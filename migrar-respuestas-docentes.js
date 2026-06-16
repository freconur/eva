const admin = require('firebase-admin');

// 1. INICIALIZACIÓN DE FIREBASE ADMIN
if (process.env.FIRESTORE_EMULATOR_HOST) {
  admin.initializeApp({
    projectId: 'eva-ugel'
  });
  console.log("📡 Conectado al emulador de Firestore en:", process.env.FIRESTORE_EMULATOR_HOST);
} else {
  try {
    const serviceAccount = require('./eva-ugel.json');
    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount)
    });
    console.log("✅ Conectado a Firestore en la nube mediante eva-ugel.json");
  } catch (err) {
    console.log("⚠️ No se pudo cargar eva-ugel.json. Intentando inicialización por defecto...");
    admin.initializeApp();
  }
}

const db = admin.firestore();

// 2. PARSEAR ARGUMENTOS DE EJECUCIÓN
// Por defecto se ejecuta en modo DRY RUN (Simulación) para evitar accidentes.
const args = process.argv.slice(2);
const dryRun = !args.includes('--run');

console.log("\n==================================================");
if (dryRun) {
  console.log("⚠️ EJECUTANDO EN MODO SIMULACIÓN (DRY RUN)");
  console.log("No se guardará ningún cambio en Firestore.");
  console.log("Para aplicar los cambios reales, ejecuta: node migrar-respuestas-docentes.js --run");
} else {
  console.log("🔥 EJECUTANDO MIGRACIÓN REAL");
  console.log("Los cambios se guardarán directamente en Firestore.");
}
console.log("==================================================\n");

// 3. CONFIGURACIÓN DE MESES A ESCANEAR
// Las subcolecciones de meses se guardan como strings numéricos (ej. '0', '1', ..., '12').
const TARGET_MONTHS = ['2'];
const BATCH_LIMIT = 200; // Límite de documentos recuperados por consulta para optimizar memoria

// 4. FUNCIÓN PARA CONVERTIR RESPUESTAS
// Convierte el array detallado al mapa { idPregunta: alternativaMarcada }
function convertirRespuestasAMapa(respuestasArray) {
  const mapa = {};
  respuestasArray.forEach((pregunta) => {
    // Buscamos cuál alternativa tiene selected === true
    const seleccionada = pregunta.alternativas?.find(alt => alt.selected === true);
    if (seleccionada && pregunta.id) {
      mapa[pregunta.id] = seleccionada.alternativa;
    }
  });
  return mapa;
}

// 5. FUNCIÓN PARA VALIDAR LA RUTA DEL DOCUMENTO
// Verifica que sea usuarios/{dniDocente}/{evalId}/{año}/{mes}/{estudianteDni}
function esRutaEstudianteDocente(path) {
  const parts = path.split('/');
  return (
    parts.length === 6 &&
    parts[0] === 'usuarios' &&
    parts[2] !== 'estudiantes-docentes' // Excluir la colección fija de estudiantes creados por el docente
  );
}

// 6. PROCESO DE MIGRACIÓN POR MES
async function migrarMes(monthId) {
  console.log(`--------------------------------------------------`);
  console.log(`📅 Iniciando escaneo en grupo para mes/periodo: "${monthId}"`);
  console.log(`--------------------------------------------------`);

  let totalProcesadosEnMes = 0;
  let totalMigradosEnMes = 0;
  let totalOmitidosEnMes = 0;
  let lastVisibleDoc = null;
  let hasMore = true;

  while (hasMore) {
    // Usamos collectionGroup filtrando en el servidor para que solo traiga documentos de 'usuarios/'
    let query = db.collectionGroup(monthId)
      .orderBy(admin.firestore.FieldPath.documentId())
      .startAt('usuarios/ ')
      .endAt('usuarios/\uf8ff')
      .select('respuestas')
      .limit(BATCH_LIMIT);
    if (lastVisibleDoc) {
      query = query.startAfter(lastVisibleDoc);
    }

    const snapshot = await query.get();
    if (snapshot.empty) {
      hasMore = false;
      break;
    }

    const batch = db.batch();
    let docsInBatch = 0;

    for (const doc of snapshot.docs) {
      const path = doc.ref.path;

      // Validar si la ruta coincide con el formato de docentes
      if (!esRutaEstudianteDocente(path)) {
        continue;
      }

      totalProcesadosEnMes++;
      const data = doc.data();

      // Idempotencia: solo migrar si respuestas es un Array
      if (data.respuestas && Array.isArray(data.respuestas)) {
        const nuevoMapa = convertirRespuestasAMapa(data.respuestas);
        if (!dryRun) {
          batch.update(doc.ref, { respuestas: nuevoMapa });
          docsInBatch++;
        }
        totalMigradosEnMes++;
      } else {
        totalOmitidosEnMes++;
      }
    }

    lastVisibleDoc = snapshot.docs[snapshot.docs.length - 1];

    // Commitear el lote de actualizaciones si no estamos en dry run
    if (docsInBatch > 0 && !dryRun) {
      await batch.commit();
      console.log(`  💾 Lote de ${docsInBatch} documentos actualizado exitosamente.`);
    }

    if (snapshot.size < BATCH_LIMIT) {
      hasMore = false;
    }
  }

  console.log(`👉 Resultados para periodo "${monthId}":`);
  console.log(`   Revisados en ruta: ${totalProcesadosEnMes}`);
  console.log(`   Migrados:          ${totalMigradosEnMes}`);
  console.log(`   Omitidos:          ${totalOmitidosEnMes} (Ya migrados o vacíos)`);

  return {
    procesados: totalProcesadosEnMes,
    migrados: totalMigradosEnMes,
    omitidos: totalOmitidosEnMes
  };
}

// 7. FUNCIÓN PRINCIPAL
async function ejecutarMigraciónGlobal() {
  let globalProcesados = 0;
  let globalMigrados = 0;
  let globalOmitidos = 0;

  const startTime = Date.now();

  try {
    for (const monthId of TARGET_MONTHS) {
      const stats = await migrarMes(monthId);
      globalProcesados += stats.procesados;
      globalMigrados += stats.migrados;
      globalOmitidos += stats.omitidos;
    }

    const durationSeconds = ((Date.now() - startTime) / 1000).toFixed(2);

    console.log(`\n==================================================`);
    console.log(`🎉 PROCESO FINALIZADO EN ${durationSeconds} SEGUNDOS`);
    console.log(`--------------------------------------------------`);
    console.log(`Total documentos revisados:    ${globalProcesados}`);
    console.log(`Total documentos migrados:     ${globalMigrados}`);
    console.log(`Total documents omitidos:      ${globalOmitidos}`);
    console.log(`==================================================\n`);

  } catch (error) {
    console.error("❌ Error catastrófico durante la migración:", error);
  } finally {
    process.exit(0);
  }
}

ejecutarMigraciónGlobal();
