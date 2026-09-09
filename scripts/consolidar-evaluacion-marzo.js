/**
 * scripts/consolidar-evaluacion-marzo.js
 * 
 * Script de consolidación offline para evaluaciones sin consolidados precalculados
 * (ej. Evaluaciones Diagnósticas de Marzo 2026).
 * 
 * CARACTERÍSTICAS:
 * - Operación 100% de SOLO LECTURA sobre `estudiantes-evaluados` (no modifica ningún dato de los alumnos).
 * - Agrupa y genera las subcolecciones:
 *     1) `evaluaciones/{idEvaluacion}/consolidados_realtime_directores`
 *     2) `evaluaciones/{idEvaluacion}/consolidados_realtime_regiones_{año}_{mes}`
 *     3) `evaluaciones/{idEvaluacion}/consolidados_realtime_regiones`
 * - Acumula preguntas con alternativas marcadas por pregunta (tanto por `order` como por `id`).
 * - Soporta ejecuciones con argumento CLI o lista de IDs en el código.
 * - Soporta modo de simulación `--dry-run` para previsualizar resultados sin escribir en la base de datos.
 * 
 * USO:
 *   # Modo 1: Pasar ID de evaluación por terminal
 *   node scripts/consolidar-evaluacion-marzo.js <ID_EVALUACION> [AÑO] [MES]
 * 
 *   # Ejemplo:
 *   node scripts/consolidar-evaluacion-marzo.js 2mdtmKI4xquimBSTaGMe 2026 3
 * 
 *   # Modo simulación (no escribe nada, solo muestra estadísticas en consola):
 *   node scripts/consolidar-evaluacion-marzo.js 2mdtmKI4xquimBSTaGMe 2026 3 --dry-run
 * 
 *   # Modo 2: Usar la lista IDS_EVALUACIONES configurada abajo en el archivo:
 *   node scripts/consolidar-evaluacion-marzo.js
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
    credential: admin.credential.cert(serviceAccount)
  });
}

const db = admin.firestore();

// ============================================================================
// CONFIGURACIÓN PREDETERMINADA
// Puedes colocar aquí los IDs de las evaluaciones que desees procesar en lote
// si no las pasas por línea de comandos.
// ============================================================================
const IDS_EVALUACIONES = [
  "2mdtmKI4xquimBSTaGMe",
  "mMpJKnswFC3YdifhjdnI",
  "AR0UBtIlU1ZRLzVjvlcb",
  "k2XH0tSditRkvSZ7Vn7m",
  "lblmQ9BOLpRq6gvtEem2",
  "XCH9Pn836i7JrGQoXDFI",
  "c0G65cNiYTeOAND63oPI",
  "77M91Lt7mlJrVNzeL6hN",
  "d5U7UqMHIT0nd3WXfO75",
  "evgRfHCELqggo9NZHh6H",
];

const DEFAULT_ANIO = 2026;
const DEFAULT_MES = 2;

// Catálogo de UGELs (Regiones de Puno)
const REGIONES_CATALOGO = [
  { id: 1, nombre: 'Puno' },
  { id: 2, nombre: 'San Román' },
  { id: 3, nombre: 'Chucuito-juli' },
  { id: 4, nombre: 'Yunguyo' },
  { id: 5, nombre: 'El Collao' },
  { id: 6, nombre: 'Putina' },
  { id: 7, nombre: 'Huancané' },
  { id: 8, nombre: 'Sandia' },
  { id: 9, nombre: 'Crucero' },
  { id: 10, nombre: 'Carabaya' },
  { id: 11, nombre: 'Lampa' },
  { id: 12, nombre: 'Melgar' },
  { id: 13, nombre: 'Azángaro' },
  { id: 14, nombre: 'Moho' }
];

// Helper para limpiar nombres de niveles
const cleanKey = (s) =>
  (s || '').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').trim();

/**
 * Extrae la respuesta marcada por un estudiante para una pregunta específica,
 * soportando tanto mapas { [qId]: 'A' } como arreglos legacy.
 */
function extractStudentAnswer(studentRespuestas, questionId, questionOrder) {
  if (!studentRespuestas) return null;

  // 1. Si es un objeto mapa
  if (typeof studentRespuestas === 'object' && !Array.isArray(studentRespuestas)) {
    if (questionId && studentRespuestas[questionId] !== undefined) {
      return String(studentRespuestas[questionId]).trim().toUpperCase();
    }
    if (questionOrder !== undefined && studentRespuestas[String(questionOrder)] !== undefined) {
      return String(studentRespuestas[String(questionOrder)]).trim().toUpperCase();
    }
    if (questionOrder !== undefined && studentRespuestas[Number(questionOrder)] !== undefined) {
      return String(studentRespuestas[Number(questionOrder)]).trim().toUpperCase();
    }
    return null;
  }

  // 2. Si es un arreglo (formato legacy)
  if (Array.isArray(studentRespuestas)) {
    const item = studentRespuestas.find((r) => {
      if (!r) return false;
      if (questionId && (r.id === questionId || r.preguntaId === questionId)) return true;
      if (questionOrder !== undefined && (r.order === questionOrder || r.order === Number(questionOrder))) return true;
      return false;
    });

    if (!item) return null;

    if (item.alternativas && Array.isArray(item.alternativas)) {
      const selectedAlt = item.alternativas.find((a) => a && (a.selected === true || a.checked === true));
      if (selectedAlt && selectedAlt.alternativa) {
        return String(selectedAlt.alternativa).trim().toUpperCase();
      }
    }

    if (item.respuesta) return String(item.respuesta).trim().toUpperCase();
    if (item.alternativaSeleccionada) return String(item.alternativaSeleccionada).trim().toUpperCase();
  }

  return null;
}

/**
 * Procesa una única evaluación y genera los documentos consolidados
 */
async function consolidarEvaluacion(idEval, explicitYear, explicitMonth, isDryRun) {
  console.log('\n' + '='.repeat(70));
  console.log(`📌 INICIANDO CONSOLIDACIÓN: ${idEval}`);
  console.log('='.repeat(70));

  // 1. Cargar datos de la evaluación
  const evalRef = db.doc(`evaluaciones/${idEval}`);
  const evalSnap = await evalRef.get();

  if (!evalSnap.exists) {
    console.error(`❌ La evaluación con ID ${idEval} no existe en Firestore.`);
    return false;
  }

  const evalData = evalSnap.data();
  console.log(`📋 Nombre: ${evalData.nombre || 'Sin nombre'}`);
  console.log(`🎯 Grado: ${evalData.grado || 'N/A'} | Tipo: ${evalData.tipoDeEvaluacion === '1' ? 'Estudiantes' : evalData.tipoDeEvaluacion}`);

  const anio = Number(explicitYear) || Number(evalData.añoDelExamen) || DEFAULT_ANIO;
  let mes = Number(explicitMonth) || Number(evalData.mesDelExamen) || DEFAULT_MES;

  console.log(`📅 Periodo objetivo: Año ${anio}, Mes ${mes}`);

  // 2. Verificar existencia de estudiantes en la ruta
  let studentsPath = `evaluaciones/${idEval}/estudiantes-evaluados/${anio}/${mes}`;
  let countSnap = await db.collection(studentsPath).count().get();
  let totalCount = countSnap.data().count;

  // Si no hay estudiantes en el mes indicado, explorar meses cercanos (3, 2, 1, 4)
  if (totalCount === 0 && !explicitMonth) {
    console.log(`⚠️ No se encontraron estudiantes en mes ${mes}. Explorando meses alternativos...`);
    const fallbackMonths = [3, 2, 1, 4, 7, 8, 11, 12];
    for (const testM of fallbackMonths) {
      if (testM === mes) continue;
      const testPath = `evaluaciones/${idEval}/estudiantes-evaluados/${anio}/${testM}`;
      const snap = await db.collection(testPath).count().get();
      if (snap.data().count > 0) {
        mes = testM;
        studentsPath = testPath;
        totalCount = snap.data().count;
        console.log(`✅ ¡Se encontraron ${totalCount} estudiantes en mes ${mes}! Usando esta ruta.`);
        break;
      }
    }
  }

  if (totalCount === 0) {
    console.warn(`⚠️ [OMITIDO] No hay estudiantes registrados para ${idEval} en año ${anio}.`);
    return false;
  }

  console.log(`👥 Total de estudiantes a procesar: ${totalCount}`);

  // 3. Cargar configuración de niveles y rangos
  const nivelesConfig = evalData.nivelYPuntaje || [
    { nivel: 'Previo al Inicio', min: 0, max: 10, color: '#ef4444' },
    { nivel: 'En Inicio', min: 11, max: 13, color: '#f59e0b' },
    { nivel: 'En Proceso', min: 14, max: 17, color: '#eab308' },
    { nivel: 'Satisfactorio', min: 18, max: 20, color: '#22c55e' }
  ];

  // 4. Cargar preguntas de la evaluación
  console.log('📖 Cargando plantilla de preguntas...');
  const preguntasSnap = await db.collection(`evaluaciones/${idEval}/preguntasRespuestas`).orderBy('order', 'asc').get();
  const preguntasList = [];
  preguntasSnap.forEach((docSnap) => {
    preguntasList.push({ id: docSnap.id, ...docSnap.data() });
  });

  console.log(`📝 Total de preguntas encontradas: ${preguntasList.length}`);

  // 5. Cargar perfiles de directores en memoria para asociar región y escuela
  console.log('🏫 Cargando directorio de directores en memoria...');
  const directoresSnap = await db.collection('usuarios')
    .where('rol', '==', 2)
    .select('dni', 'nombres', 'apellidos', 'institucion', 'region', 'distrito', 'area', 'caracteristicaCurricular', 'tipoGestion', 'nivelDeInstitucion')
    .get();

  const directorProfileMap = new Map();
  directoresSnap.forEach((d) => {
    const data = d.data();
    const dni = String(data.dni || d.id).trim();
    directorProfileMap.set(dni, data);
  });
  console.log(`👔 Directores cargados: ${directorProfileMap.size}`);

  // 6. Estructuras acumuladoras en memoria (RAM)
  // Director Stats Map: key = dniDirector
  const directorStatsMap = new Map();

  // Region Stats Map: key = regionId (1 a 14)
  const regionStatsMap = new Map();
  REGIONES_CATALOGO.forEach((r) => {
    regionStatsMap.set(r.id, {
      regionId: r.id,
      nombre: r.nombre,
      totalEstudiantes: 0,
      sumaPuntajes: 0,
      sumaCorrectas: 0,
      niveles: {},
      preguntas: {} // key = orderStr -> { total, correctas, alternativas: { A, B, C... } }
    });

    // Inicializar contadores de niveles en 0
    nivelesConfig.forEach((nc) => {
      regionStatsMap.get(r.id).niveles[nc.nivel] = 0;
    });

    // Inicializar preguntas
    preguntasList.forEach((p, idx) => {
      const order = p.order !== undefined ? Number(p.order) : idx + 1;
      regionStatsMap.get(r.id).preguntas[String(order)] = {
        order,
        total: 0,
        correctas: 0,
        alternativas: {}
      };
    });
  });

  // 7. Leer estudiantes mediante .stream() para máximo rendimiento y bajo uso de memoria
  console.log('🔄 Procesando estudiantes evaluados (Lectura segura)...');
  const stream = db.collection(studentsPath).stream();

  let procesados = 0;
  let sinRegion = 0;

  for await (const doc of stream) {
    procesados++;
    if (procesados % 1000 === 0 || procesados === totalCount) {
      process.stdout.write(`   Procesando... ${procesados}/${totalCount} estudiantes (${Math.round((procesados / totalCount) * 100)}%)\r`);
    }

    const st = doc.data();

    // Resolver director y región
    let dniDir = st.dniDirector ? String(st.dniDirector).trim() : '';
    let dirProfile = dniDir ? directorProfileMap.get(dniDir) : null;

    let regId = null;
    if (st.region !== undefined && st.region !== null && !isNaN(Number(st.region))) {
      regId = Number(st.region);
    } else if (dirProfile && dirProfile.region !== undefined && dirProfile.region !== null && !isNaN(Number(dirProfile.region))) {
      regId = Number(dirProfile.region);
    }

    if (!regId || regId < 1 || regId > 14) {
      sinRegion++;
      // Si no tiene región identificable, usar la del primer director o asignar 1 provisional
      regId = 1;
    }

    // Puntaje del estudiante
    const puntaje = typeof st.puntaje === 'number' ? st.puntaje : Number(st.puntaje || 0);

    // Determinar nivel del estudiante
    let nivelNombre = st.nivel || null;
    if (!nivelNombre) {
      const nivelMatch = nivelesConfig.find((nc) => puntaje >= (nc.min ?? 0) && puntaje <= (nc.max ?? 1000));
      nivelNombre = nivelMatch ? nivelMatch.nivel : 'Sin clasificar';
    }

    // A) Acumular a la Región (UGEL)
    const regStat = regionStatsMap.get(regId);
    if (regStat) {
      regStat.totalEstudiantes++;
      regStat.sumaPuntajes += puntaje;
      regStat.niveles[nivelNombre] = (regStat.niveles[nivelNombre] || 0) + 1;

      // Evaluar preguntas para la región
      preguntasList.forEach((p, idx) => {
        const order = p.order !== undefined ? Number(p.order) : idx + 1;
        const orderStr = String(order);
        const correctKey = String(p.respuestaCorrecta || p.respuesta || 'A').trim().toUpperCase();

        const answer = extractStudentAnswer(st.respuestas, p.id, order);

        if (answer) {
          const qObj = regStat.preguntas[orderStr];
          if (qObj) {
            qObj.total++;
            qObj.alternativas[answer] = (qObj.alternativas[answer] || 0) + 1;
            if (answer === correctKey) {
              qObj.correctas++;
              regStat.sumaCorrectas++;
            }
          }
        }
      });
    }

    // B) Acumular al Director
    // Si no tiene dniDirector, agrupamos en un pseudo-director por UGEL para asegurar que la matriz lo lea
    const dirKey = dniDir || `sin_director_ugel_${regId}`;
    if (!directorStatsMap.has(dirKey)) {
      directorStatsMap.set(dirKey, {
        dniDirector: dirKey,
        region: regId,
        nombres: dirProfile?.nombres || (dniDir ? 'Director' : `Directores UGEL ${regId}`),
        apellidos: dirProfile?.apellidos || (dniDir ? 'N/A' : ''),
        institucion: dirProfile?.institucion || st.institucion || 'I.E. Consolidada',
        distrito: dirProfile?.distrito || st.distrito || '',
        totalEstudiantes: 0,
        sumaPuntajes: 0,
        niveles: {},
        preguntas: {}
      });

      nivelesConfig.forEach((nc) => {
        directorStatsMap.get(dirKey).niveles[nc.nivel] = 0;
      });
    }

    const dStat = directorStatsMap.get(dirKey);
    dStat.totalEstudiantes++;
    dStat.sumaPuntajes += puntaje;
    dStat.niveles[nivelNombre] = (dStat.niveles[nivelNombre] || 0) + 1;

    // Registrar respuestas por pregunta del director
    preguntasList.forEach((p, idx) => {
      const order = p.order !== undefined ? Number(p.order) : idx + 1;
      const orderStr = String(order);
      const idStr = p.id ? String(p.id) : '';

      const answer = extractStudentAnswer(st.respuestas, p.id, order);

      if (answer) {
        // Inicializar si no existe
        if (!dStat.preguntas[orderStr]) {
          dStat.preguntas[orderStr] = { total: 0 };
        }
        dStat.preguntas[orderStr].total = (dStat.preguntas[orderStr].total || 0) + 1;
        dStat.preguntas[orderStr][answer] = (dStat.preguntas[orderStr][answer] || 0) + 1;

        // Solo registrar por id si es un ID alfanumérico largo (ej. "abc123xyz")
        // y NO un número simple, para evitar colisiones con el orden de las preguntas
        if (idStr && idStr !== orderStr && isNaN(Number(idStr))) {
          if (!dStat.preguntas[idStr]) {
            dStat.preguntas[idStr] = { total: 0 };
          }
          dStat.preguntas[idStr].total = (dStat.preguntas[idStr].total || 0) + 1;
          dStat.preguntas[idStr][answer] = (dStat.preguntas[idStr][answer] || 0) + 1;
        }
      }
    });
  }

  console.log(`\n✅ Lectura completada: ${procesados} estudiantes procesados.`);
  if (sinRegion > 0) {
    console.log(`ℹ️ Estudiantes sin región explícita: ${sinRegion} (resueltos con perfil de director o UGEL 1).`);
  }

  // 8. Mostrar resumen previo en consola
  console.log('\n📊 RESUMEN CONSOLIDADO POR UGEL:');
  console.log('-'.repeat(80));
  console.log(
    'ID'.padEnd(4) +
    'UGEL'.padEnd(18) +
    'Estudiantes'.padEnd(14) +
    'Promedio'.padEnd(12) +
    'RC Prom'.padEnd(12) +
    'Rezago %'.padEnd(10) +
    'Satisfactorio %'
  );
  console.log('-'.repeat(80));

  regionStatsMap.forEach((stat) => {
    if (stat.totalEstudiantes === 0) return;
    const prom = (stat.sumaPuntajes / stat.totalEstudiantes).toFixed(1);
    const rcProm = (stat.sumaCorrectas / stat.totalEstudiantes).toFixed(1);

    // Rezago: primer nivel
    const primerNivelNombre = nivelesConfig[0]?.nivel || 'Previo al Inicio';
    const cantRezago = stat.niveles[primerNivelNombre] || 0;
    const pctRezago = `${Math.round((cantRezago / stat.totalEstudiantes) * 100)}%`;

    // Satisfactorio: último nivel
    const ultimoNivelNombre = nivelesConfig[nivelesConfig.length - 1]?.nivel || 'Satisfactorio';
    const cantSatis = stat.niveles[ultimoNivelNombre] || 0;
    const pctSatis = `${Math.round((cantSatis / stat.totalEstudiantes) * 100)}%`;

    console.log(
      String(stat.regionId).padEnd(4) +
      stat.nombre.padEnd(18) +
      String(stat.totalEstudiantes).padEnd(14) +
      prom.padEnd(12) +
      rcProm.padEnd(12) +
      pctRezago.padEnd(10) +
      pctSatis
    );
  });
  console.log('-'.repeat(80));

  if (isDryRun) {
    console.log('\n🔍 [MODO DRY-RUN] Simulación finalizada. No se escribió ningún dato en Firestore.');
    return true;
  }

  // 9. Escritura de documentos consolidados en Firestore (en lotes seguros de 300)
  console.log('\n💾 Guardando consolidados en Firestore...');

  let batch = db.batch();
  let batchCount = 0;
  let batchesCommitted = 0;

  const commitBatchIfNeeded = async (force = false) => {
    if (batchCount >= 300 || (force && batchCount > 0)) {
      await batch.commit();
      batchesCommitted++;
      batch = db.batch();
      batchCount = 0;
    }
  };

  // A) Guardar consolidados por Director
  console.log(`   Guardando ${directorStatsMap.size} directores en 'consolidados_realtime_directores'...`);
  for (const [dniDir, dStat] of directorStatsMap.entries()) {
    const dRef = db.doc(`evaluaciones/${idEval}/consolidados_realtime_directores/${dniDir}`);
    const docPayload = {
      dniDirector: dniDir,
      region: dStat.region,
      nombres: dStat.nombres,
      apellidos: dStat.apellidos,
      institucion: dStat.institucion,
      distrito: dStat.distrito,
      totalEstudiantes: dStat.totalEstudiantes,
      sumaPuntajes: dStat.sumaPuntajes,
      puntajePromedio: dStat.totalEstudiantes > 0 ? Number((dStat.sumaPuntajes / dStat.totalEstudiantes).toFixed(1)) : 0,
      niveles: dStat.niveles,
      preguntas: dStat.preguntas,
      ultimaActualizacion: admin.firestore.FieldValue.serverTimestamp()
    };

    batch.set(dRef, docPayload, { merge: true });
    batchCount++;
    await commitBatchIfNeeded();
  }

  // B) Guardar consolidados por Región (ambas rutas: con y sin sufijo de fecha)
  console.log(`   Guardando 14 regiones en 'consolidados_realtime_regiones'...`);
  for (const [rId, rStat] of regionStatsMap.entries()) {
    const puntajePromedio = rStat.totalEstudiantes > 0 ? Number((rStat.sumaPuntajes / rStat.totalEstudiantes).toFixed(1)) : 0;
    const rcPromedio = rStat.totalEstudiantes > 0 ? Number((rStat.sumaCorrectas / rStat.totalEstudiantes).toFixed(1)) : 0;

    const docPayload = {
      region: rId,
      regionId: rId,
      nombre: rStat.nombre,
      totalEstudiantes: rStat.totalEstudiantes,
      sumaPuntajes: rStat.sumaPuntajes,
      puntajePromedio,
      rcPromedio,
      niveles: rStat.niveles,
      preguntas: rStat.preguntas,
      ultimaActualizacion: admin.firestore.FieldValue.serverTimestamp()
    };

    // Ruta con sufijo de año y mes: consolidados_realtime_regiones_2026_3
    const regWithSuffixRef = db.doc(`evaluaciones/${idEval}/consolidados_realtime_regiones_${anio}_${mes}/${rId}`);
    batch.set(regWithSuffixRef, docPayload, { merge: true });
    batchCount++;

    // Ruta base estándar: consolidados_realtime_regiones
    const regBaseRef = db.doc(`evaluaciones/${idEval}/consolidados_realtime_regiones/${rId}`);
    batch.set(regBaseRef, docPayload, { merge: true });
    batchCount++;

    await commitBatchIfNeeded();
  }

  // Confirmar último lote
  await commitBatchIfNeeded(true);

  console.log(`\n🎉 ¡CONSOLIDACIÓN EXITOSA!`);
  console.log(`   Total de lotes (batches) enviados: ${batchesCommitted}`);
  console.log(`   Colección de estudiantes permanece 100% intacta e inalterada.`);
  console.log(`   Ahora puedes abrir la Matriz de Resultados y verás los datos de Marzo al instante.\n`);

  return true;
}

/**
 * Función principal
 */
async function main() {
  const args = process.argv.slice(2);
  const isDryRun = args.includes('--dry-run');
  const isListar = args.includes('--listar') || args.includes('-l');
  const isTodas = args.includes('--todas');
  const cleanArgs = args.filter((a) => a !== '--dry-run' && a !== '--listar' && a !== '-l' && a !== '--todas');

  console.log('╔══════════════════════════════════════════════════════════════════════╗');
  console.log('║  SISTEMA EVA - SCRIPT DE CONSOLIDACIÓN DE EVALUACIONES (MARZO 2026)  ║');
  console.log('╚══════════════════════════════════════════════════════════════════════╝');
  if (isDryRun) {
    console.log('⚡ MODO SIMULACIÓN ACTIVO (--dry-run): No se modificará la base de datos.');
  }

  // 1. Opción --listar: Muestra todas las evaluaciones para copiar y pegar su ID fácilmente
  if (isListar) {
    console.log('\n🔍 Consultando evaluaciones disponibles en Firestore...');
    const evalsSnap = await db.collection('evaluaciones')
      .where('tipoDeEvaluacion', '==', '1')
      .get();

    console.log('\n' + '='.repeat(90));
    console.log(
      'ID EVALUACIÓN'.padEnd(26) +
      'AÑO'.padEnd(7) +
      'MES'.padEnd(7) +
      'GRADO'.padEnd(8) +
      'NOMBRE'
    );
    console.log('='.repeat(90));

    evalsSnap.docs.forEach((d) => {
      const data = d.data();
      const a = String(data.añoDelExamen || '-');
      const m = String(data.mesDelExamen || '-');
      const g = String(data.grado || '-');
      const n = String(data.nombre || 'Sin nombre');

      console.log(
        d.id.padEnd(26) +
        a.padEnd(7) +
        m.padEnd(7) +
        g.padEnd(8) +
        n.substring(0, 42)
      );
    });

    console.log('='.repeat(90));
    console.log(`Total de evaluaciones encontradas: ${evalsSnap.size}\n`);
    console.log('👉 Para consolidar una evaluación, copia su ID y ejecuta:');
    console.log('   node scripts/consolidar-evaluacion-marzo.js <ID> 2026 3 --dry-run\n');
    process.exit(0);
  }

  let evalsToProcess = [];
  let explicitYear = null;
  let explicitMonth = null;

  // 2. Opción --todas: Consolida todas las evaluaciones del año y mes indicados
  if (isTodas) {
    explicitYear = cleanArgs[0] || '2026';
    explicitMonth = cleanArgs[1] || '3';
    console.log(`\n🔍 Buscando todas las evaluaciones para Año ${explicitYear} y Mes ${explicitMonth}...`);
    const evalsSnap = await db.collection('evaluaciones')
      .where('tipoDeEvaluacion', '==', '1')
      .get();

    evalsSnap.docs.forEach((d) => {
      const data = d.data();
      const a = String(data.añoDelExamen || '');
      const m = String(data.mesDelExamen || '');
      if (a === String(explicitYear) && (m === String(explicitMonth) || m === '2' || m === '3')) {
        evalsToProcess.push(d.id);
      }
    });

    if (evalsToProcess.length === 0) {
      console.log(`⚠️ No se encontraron evaluaciones con año ${explicitYear} y mes ${explicitMonth}.`);
      process.exit(0);
    }
  } else if (cleanArgs.length >= 1) {
    evalsToProcess = [cleanArgs[0]];
    if (cleanArgs[1]) explicitYear = cleanArgs[1];
    if (cleanArgs[2]) explicitMonth = cleanArgs[2];
  } else if (IDS_EVALUACIONES.length > 0) {
    evalsToProcess = IDS_EVALUACIONES;
  } else {
    console.log('\n❌ No se especificó ninguna evaluación para consolidar.');
    console.log('\nFormas de uso:');
    console.log('  1) Ver la lista de todas las evaluaciones con sus IDs:');
    console.log('     node scripts/consolidar-evaluacion-marzo.js --listar');
    console.log('\n  2) Consolidar una evaluación específica pasando su ID:');
    console.log('     node scripts/consolidar-evaluacion-marzo.js <ID_EVALUACION> [AÑO] [MES] [--dry-run]');
    console.log('\n     Ejemplo (Modo prueba sin escribir en BD):');
    console.log('     node scripts/consolidar-evaluacion-marzo.js 2mdtmKI4xquimBSTaGMe 2026 3 --dry-run');
    console.log('\n     Ejemplo (Modo real guardando en Firestore):');
    console.log('     node scripts/consolidar-evaluacion-marzo.js 2mdtmKI4xquimBSTaGMe 2026 3');
    console.log('\n  3) O edita este archivo y coloca los IDs en el arreglo IDS_EVALUACIONES = [...].\n');
    process.exit(0);
  }

  console.log(`Evaluaciones a consolidar: ${evalsToProcess.length}`);

  for (let i = 0; i < evalsToProcess.length; i++) {
    const id = evalsToProcess[i];
    try {
      await consolidarEvaluacion(id, explicitYear, explicitMonth, isDryRun);
    } catch (err) {
      console.error(`❌ Error al consolidar evaluación ${id}:`, err);
    }
  }

  console.log('✨ Proceso finalizado.');
  process.exit(0);
}

main().catch((err) => {
  console.error('Error fatal en el script:', err);
  process.exit(1);
});
