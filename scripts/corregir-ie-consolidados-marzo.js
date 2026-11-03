/**
 * scripts/corregir-ie-consolidados-marzo.js
 *
 * Script de corrección para consolidar los nombres reales de las Instituciones Educativas
 * en la subcolección `evaluaciones/{idEvaluacion}/consolidados_realtime_directores`
 * para las 12 evaluaciones diagnósticas de marzo 2026 (EDI - Primaria 1° a 6° grado).
 *
 * CARACTERÍSTICAS:
 * - Operación SEGURA y NO DESTRUCTIVA:
 *     * ÚNICAMENTE actualiza campos de metadata (`institucion`, `nombres`, `apellidos`, `distrito`).
 *     * NO modifica puntajes, aciertos, falladas, niveles ni respuestas de preguntas.
 *     * NO toca la colección `estudiantes-evaluados`.
 * - Resolución inteligente en múltiples niveles:
 *     1) Nivel 1 (Directo): Busca el DNI del director/docente en `usuarios` sin restricción de rol.
 *     2) Nivel 2 (Vía Docente): Si el director no tiene cuenta, consulta a un estudiante evaluado
 *        y toma la institución del perfil de su docente asignado (`dniDocente`).
 *     3) Nivel 3 (Histórico): Cruza con registros verificados de evaluaciones posteriores (julio).
 *     4) Fallback seguro: Para pseudo-directores usa `I.E. Sin Asignar (UGEL X)` y para casos sin
 *        cuenta usa `IE ${dniDirector}`.
 *
 * USO:
 *   # Modo de prueba seguro (Previsualización SIN escribir nada en Firestore):
 *   node scripts/corregir-ie-consolidados-marzo.js --dry-run
 *
 *   # Aplicación real (Escribe los cambios en Firestore):
 *   node scripts/corregir-ie-consolidados-marzo.js --apply
 */

const admin = require('firebase-admin');
const path = require('path');
const fs = require('fs');

// 1. Cargar credenciales de servicio (eva-ugel.json)
let serviceAccount;
const serviceAccountPathRoot = path.resolve(__dirname, '../eva-ugel.json');
const serviceAccountPathCurrent = path.resolve(__dirname, './eva-ugel.json');

if (fs.existsSync(serviceAccountPathRoot)) {
  serviceAccount = require(serviceAccountPathRoot);
} else if (fs.existsSync(serviceAccountPathCurrent)) {
  serviceAccount = require(serviceAccountPathCurrent);
} else {
  console.error('❌ Error: No se encontró el archivo de credenciales eva-ugel.json');
  process.exit(1);
}

if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
  });
}

const db = admin.firestore();

// 12 Evaluaciones Diagnósticas de Marzo 2026 (Primaria completa: 1° a 6° en Lectura y Matemática)
const IDS_EVALUACIONES = [
  'CPezmqMkuP3ltwqv4sOC', // 1ero Lectura Primaria MARZO
  'VJsHgAJEWCwLJ4tZtq2h', // 1ero Matemática Primaria Marzo
  'mMpJKnswFC3YdifhjdnI', // 2do Lectura Primaria Marzo
  '2mdtmKI4xquimBSTaGMe', // 2do Matemática Primaria Marzo
  'k2XH0tSditRkvSZ7Vn7m', // 3ero Lectura Primaria Marzo
  'AR0UBtIlU1ZRLzVjvlcb', // 3ero Matemática Primaria Marzo
  'XCH9Pn836i7JrGQoXDFI', // 4to Lectura Primaria Marzo
  'lblmQ9BOLpRq6gvtEem2', // 4to Matemática Primaria Marzo
  'c0G65cNiYTeOAND63oPI', // 5to Lectura Primaria Marzo
  '77M91Lt7mlJrVNzeL6hN', // 5to Matemática Primaria Marzo
  'd5U7UqMHIT0nd3WXfO75', // 6to Lectura Primaria Marzo
  'evgRfHCELqggo9NZHh6H', // 6to Matemática Primaria Marzo
];

// Mapeo histórico verificado (docentes que crearon su cuenta en evaluaciones posteriores)
const HISTORICAL_IE_MAPPINGS = {
  '01332465': { institucion: '70160', source: 'histórico verificado' },
  '01845664': { institucion: '70140 Sullcacatura II', source: 'histórico verificado' },
  '02554836': { institucion: '72155 Uyuni', source: 'histórico verificado' },
};

// Nombres descriptivos para UGELs
const UGEL_NOMBRES = {
  '1': 'Puno',
  '2': 'San Román',
  '3': 'Chucuito-Juli',
  '4': 'Yunguyo',
  '5': 'El Collao',
  '6': 'Putina',
  '7': 'Huancané',
  '8': 'Sandia',
  '9': 'Crucero',
  '10': 'Carabaya',
  '11': 'Lampa',
  '12': 'Melgar',
  '13': 'Azángaro',
  '14': 'Moho',
};

// Procesar argumentos de terminal
const args = process.argv.slice(2);
const isApply = args.includes('--apply');
const isDryRun = !isApply || args.includes('--dry-run');

// Si se pasa un ID específico como argumento
const specificEvalId = args.find((a) => !a.startsWith('--') && IDS_EVALUACIONES.includes(a));
const targetEvaluations = specificEvalId ? [specificEvalId] : IDS_EVALUACIONES;

async function main() {
  console.log('\n' + '='.repeat(80));
  console.log('🛠️  CORRECCIÓN DE INSTITUCIONES EDUCATIVAS: CONSOLIDADOS MARZO (EDI)');
  console.log('='.repeat(80));
  console.log(`🔒 Modo de ejecución: ${isDryRun ? '🟡 [DRY-RUN / SOLO LECTURA (No escribirá en BD)]' : '🟢 [APPLY / MODO REAL (Escribirá en BD)]'}`);
  console.log(`📋 Evaluaciones a procesar: ${targetEvaluations.length} (Primaria 1° a 6° grado)`);
  console.log('='.repeat(80) + '\n');

  // Cache en memoria para reutilizar entre evaluaciones
  const resolvedProfilesMap = new Map();

  // Precargar mapeos históricos
  for (const [dni, data] of Object.entries(HISTORICAL_IE_MAPPINGS)) {
    resolvedProfilesMap.set(dni, {
      source: data.source,
      institucion: data.institucion,
      nombres: '',
      apellidos: '',
      distrito: '',
    });
  }

  let globalTotalEvaluaciones = targetEvaluations.length;
  let globalTotalConsolidados = 0;
  let globalTotalAfectados = 0;
  let globalResueltosUsuario = 0;
  let globalResueltosDocente = 0;
  let globalResueltosHistorico = 0;
  let globalResueltosFallback = 0;

  for (let idx = 0; idx < targetEvaluations.length; idx++) {
    const idEval = targetEvaluations[idx];
    console.log(`\n[${idx + 1}/${globalTotalEvaluaciones}] 🔍 Inspeccionando evaluación: ${idEval}`);

    // 1. Obtener la evaluación para mostrar datos informativos
    const evalDoc = await db.doc(`evaluaciones/${idEval}`).get();
    const evalData = evalDoc.data() || {};
    console.log(`   Nombre: "${evalData.nombre || 'Sin nombre'}" | Grado: ${evalData.grado || 'N/A'}`);

    // 2. Consultar solo los documentos con "I.E. Consolidada"
    const snapshotAfectados = await db
      .collection(`evaluaciones/${idEval}/consolidados_realtime_directores`)
      .where('institucion', '==', 'I.E. Consolidada')
      .get();

    const totalAfectadosEnEval = snapshotAfectados.size;
    globalTotalAfectados += totalAfectadosEnEval;

    const countAllSnap = await db
      .collection(`evaluaciones/${idEval}/consolidados_realtime_directores`)
      .count()
      .get();
    const totalEnEval = countAllSnap.data().count;
    globalTotalConsolidados += totalEnEval;

    console.log(`   📊 Total directores en la evaluación: ${totalEnEval}`);
    console.log(`   ⚠️  Registros con "I.E. Consolidada": ${totalAfectadosEnEval}`);

    if (totalAfectadosEnEval === 0) {
      console.log('   ✅ No requiere corrección en esta evaluación.');
      continue;
    }

    // 3. Recopilar DNIs que aún no están en cache
    const dnisToFetchDirect = [];
    snapshotAfectados.docs.forEach((doc) => {
      const dni = doc.id;
      if (!resolvedProfilesMap.has(dni) && !dnisToFetchDirect.includes(dni)) {
        dnisToFetchDirect.push(dni);
      }
    });

    // 4. Resolver en lote (Batch getAll) desde la colección `usuarios` (NIVEL 1)
    const CHUNK_SIZE = 100;
    for (let c = 0; c < dnisToFetchDirect.length; c += CHUNK_SIZE) {
      const chunk = dnisToFetchDirect.slice(c, c + CHUNK_SIZE);
      const refs = chunk.map((dni) => db.doc(`usuarios/${dni}`));
      const userSnaps = await db.getAll(...refs);

      userSnaps.forEach((s) => {
        if (s.exists) {
          const u = s.data();
          if (u.institucion && String(u.institucion).trim() !== '') {
            resolvedProfilesMap.set(s.id, {
              source: 'usuarios (directo)',
              institucion: String(u.institucion).trim(),
              nombres: u.nombres || '',
              apellidos: u.apellidos || '',
              distrito: u.distrito || '',
            });
          }
        }
      });
    }

    // 5. Resolver faltantes vía estudiante -> docente (NIVEL 2)
    const stillUnresolved = dnisToFetchDirect.filter((dni) => !resolvedProfilesMap.has(dni));
    if (stillUnresolved.length > 0) {
      process.stdout.write(`   🔎 Buscando institución vía docente para ${stillUnresolved.length} directores sin cuenta propia... `);
      for (const dni of stillUnresolved) {
        let found = false;
        // Explorar meses 2 y 3 (febrero/marzo)
        for (const m of [2, 3]) {
          const stSnap = await db
            .collection(`evaluaciones/${idEval}/estudiantes-evaluados/2026/${m}`)
            .where('dniDirector', '==', dni)
            .limit(1)
            .get();

          if (!stSnap.empty) {
            const st = stSnap.docs[0].data();
            if (st.dniDocente) {
              const docSnap = await db.doc(`usuarios/${st.dniDocente}`).get();
              if (docSnap.exists && docSnap.data()?.institucion) {
                const docData = docSnap.data();
                resolvedProfilesMap.set(dni, {
                  source: 'via docente (' + st.dniDocente + ')',
                  institucion: String(docData.institucion).trim(),
                  nombres: '',
                  apellidos: '',
                  distrito: docData.distrito || '',
                });
                found = true;
                break;
              }
            }
          }
        }

        // Si tampoco se encontró vía docente, fallback limpio por DNI o pseudo-director
        if (!found) {
          if (dni.startsWith('sin_director_ugel_')) {
            const ugelNum = dni.replace('sin_director_ugel_', '');
            const ugelNombre = UGEL_NOMBRES[ugelNum] ? `UGEL ${UGEL_NOMBRES[ugelNum]}` : `UGEL ${ugelNum}`;
            resolvedProfilesMap.set(dni, {
              source: 'pseudo-director ugel',
              institucion: `I.E. Sin Asignar (${ugelNombre})`,
              nombres: `Directores ${ugelNombre}`,
              apellidos: '',
              distrito: '',
            });
          } else {
            resolvedProfilesMap.set(dni, {
              source: 'fallback seguro',
              institucion: `IE ${dni}`,
              nombres: '',
              apellidos: '',
              distrito: '',
            });
          }
        }
      }
      console.log('✅ Listo.');
    }

    // 6. Preparar actualizaciones
    const updates = [];
    const samplePreview = [];

    snapshotAfectados.docs.forEach((docSnap) => {
      const docData = docSnap.data();
      const dni = docSnap.id;
      const profile = resolvedProfilesMap.get(dni);

      if (!profile) return;

      const updateData = {
        institucion: profile.institucion,
      };

      if (profile.nombres && (!docData.nombres || docData.nombres === 'Director')) {
        updateData.nombres = profile.nombres;
      }
      if (profile.apellidos && (!docData.apellidos || docData.apellidos === 'N/A' || docData.apellidos === '')) {
        updateData.apellidos = profile.apellidos;
      }
      if (profile.distrito && !docData.distrito) {
        updateData.distrito = profile.distrito;
      }

      if (profile.source.startsWith('usuarios')) {
        globalResueltosUsuario++;
      } else if (profile.source.startsWith('via docente')) {
        globalResueltosDocente++;
      } else if (profile.source.startsWith('histórico')) {
        globalResueltosHistorico++;
      } else {
        globalResueltosFallback++;
      }

      updates.push({
        ref: docSnap.ref,
        dni,
        prevInstitucion: docData.institucion,
        newInstitucion: updateData.institucion,
        nombres: updateData.nombres || docData.nombres,
        apellidos: updateData.apellidos || docData.apellidos,
        source: profile.source,
        data: updateData,
      });

      if (samplePreview.length < 5) {
        samplePreview.push(updates[updates.length - 1]);
      }
    });

    // 7. Mostrar muestra de cambios para esta evaluación
    console.log(`   📋 Muestra de resoluciones para esta evaluación:`);
    samplePreview.forEach((item, i) => {
      const nombreCompleto = [item.nombres, item.apellidos].filter(Boolean).join(' ') || '(Sin nombre)';
      console.log(`      ${i + 1}. [DNI ${item.dni}]`);
      console.log(`         Antes: "${item.prevInstitucion}"`);
      console.log(`         Ahora: "${item.newInstitucion}" (${nombreCompleto})`);
      console.log(`         Fuente: ${item.source}`);
    });

    // 8. Aplicar cambios si NO es dry-run
    if (!isDryRun) {
      console.log(`   💾 Escribiendo ${updates.length} actualizaciones en Firestore en lotes...`);
      const BATCH_SIZE = 400;
      for (let b = 0; b < updates.length; b += BATCH_SIZE) {
        const batch = db.batch();
        const batchItems = updates.slice(b, b + BATCH_SIZE);
        batchItems.forEach((u) => {
          batch.update(u.ref, u.data);
        });
        await batch.commit();
        process.stdout.write(`      Guardados ${Math.min(b + BATCH_SIZE, updates.length)} / ${updates.length}...\r`);
      }
      console.log(`\n   ✅ Evaluación ${idEval} actualizada exitosamente.`);
    } else {
      console.log(`   🟡 [DRY-RUN] Se actualizarían ${updates.length} documentos (ninguna escritura realizada).`);
    }
  }

  // Resumen Global Final
  console.log('\n' + '='.repeat(80));
  console.log('📊 RESUMEN GENERAL DE LA EJECUCIÓN');
  console.log('='.repeat(80));
  console.log(`Total de evaluaciones analizadas: ${globalTotalEvaluaciones} (1° a 6° Primaria)`);
  console.log(`Total de registros de directores en BD: ${globalTotalConsolidados}`);
  console.log(`Total de registros con "I.E. Consolidada": ${globalTotalAfectados}`);
  console.log(`   - Resueltos directamente vía perfil de usuario: ${globalResueltosUsuario}`);
  console.log(`   - Resueltos vía perfil del docente asignado: ${globalResueltosDocente}`);
  console.log(`   - Resueltos vía histórico verificado (julio): ${globalResueltosHistorico}`);
  console.log(`   - Resueltos con fallback limpio (IE [DNI] / Sin Asignar): ${globalResueltosFallback}`);
  console.log('-'.repeat(80));

  if (isDryRun) {
    console.log('🔒 ESTADO FINAL: MODO DE PRUEBA SEGURO COMPLETADO.');
    console.log('👉 No se modificó ningún dato en Firestore.');
    console.log('👉 Para aplicar los cambios reales, ejecuta:');
    console.log('   node scripts/corregir-ie-consolidados-marzo.js --apply\n');
  } else {
    console.log('🎉 ESTADO FINAL: ACTUALIZACIÓN EN FIRESTORE COMPLETADA CON ÉXITO.\n');
  }
}

main().catch((err) => {
  console.error('\n❌ Error durante la ejecución del script:', err);
  process.exit(1);
});
