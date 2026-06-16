const admin = require('firebase-admin');
const serviceAccount = require('./eva-ugel.json');

// 1. INICIALIZACIÓN DE FIREBASE ADMIN
// Usamos el archivo de credenciales eva-ugel.json para conectarnos de forma segura.
try {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount)
  });
  console.log("✅ Firebase Admin inicializado correctamente.");
} catch (error) {
  console.error("❌ Error al inicializar Firebase Admin:", error);
  process.exit(1);
}

const db = admin.firestore();

// 2. CONFIGURACIÓN DE FILTROS DE MIGRACIÓN
// El script buscará todas las evaluaciones que coincidan con estos criterios
const TARGET_GRADO = 1;            // Grado a filtrar (como número en la BD, ej. 2)
const TARGET_AÑO_EXAMEN = '2026';  // Año del examen a filtrar (como string en la BD, ej. '2025')
const BATCH_LIMIT = 100;           // Límite de 100 por lote para evitar el error 'Transaction too big'.

// 3. FUNCIÓN PARA CONVERTIR RESPUESTAS
// Toma el array detallado y lo reduce a un mapa de { idPregunta: alternativaMarcada }
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

// 4. FUNCIÓN PARA MIGRAR UNA COLECCIÓN DE ESTUDIANTES ESPECÍFICA (UN PERIODO/MES)
async function migrarPeriodo(collectionPath, commitPromises) {
  let totalProcesados = 0;
  let totalMigrados = 0;
  let totalOmitidos = 0;
  let lastVisibleDoc = null;
  let hasMore = true;

  while (hasMore) {
    // Consulta optimizada seleccionando únicamente el campo 'respuestas'
    let query = db.collection(collectionPath).select('respuestas').limit(BATCH_LIMIT);
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
      const data = doc.data();
      totalProcesados++;

      // Idempotencia: solo migramos si 'respuestas' es un Array
      if (data.respuestas && Array.isArray(data.respuestas)) {
        const nuevoMapa = convertirRespuestasAMapa(data.respuestas);
        const docRef = db.doc(`${collectionPath}/${doc.id}`);
        batch.update(docRef, { respuestas: nuevoMapa });
        docsInBatch++;
        totalMigrados++;
      } else {
        totalOmitidos++;
      }
    }

    lastVisibleDoc = snapshot.docs[snapshot.docs.length - 1];

    if (docsInBatch > 0) {
      const currentDocsCount = docsInBatch;
      const commitPromise = batch.commit()
        .then(() => {
          console.log(`  💾 Lote de ${currentDocsCount} documentos guardado exitosamente en segundo plano.`);
        })
        .catch((err) => {
          console.error(`  ❌ Error al escribir lote de ${currentDocsCount} documentos en ${collectionPath}:`, err);
          throw err;
        });

      commitPromises.push(commitPromise);
    }

    if (snapshot.size < BATCH_LIMIT) {
      hasMore = false;
    }
  }

  return { totalProcesados, totalMigrados, totalOmitidos };
}

// 5. PROCESO PRINCIPAL DE MIGRACIÓN GLOBAL
async function migrarColeccion() {
  console.log(`\n🔍 Buscando evaluaciones con Grado: ${TARGET_GRADO} y Año: ${TARGET_AÑO_EXAMEN}...`);

  try {
    // Consultar las evaluaciones que coincidan con el grado y año del examen
    const evaluationsSnap = await db.collection('evaluaciones')
      .where('grado', '==', Number(TARGET_GRADO))
      .where('añoDelExamen', '==', String(TARGET_AÑO_EXAMEN))
      .get();

    if (evaluationsSnap.empty) {
      console.log(`⚠️ No se encontraron evaluaciones que coincidan con Grado: ${TARGET_GRADO} y Año: ${TARGET_AÑO_EXAMEN}.`);
      return;
    }

    console.log(`📊 Se encontraron ${evaluationsSnap.size} evaluaciones para procesar.\n`);

    let globalProcesados = 0;
    let globalMigrados = 0;
    let globalOmitidos = 0;
    const commitPromises = [];

    // Iterar sobre cada evaluación encontrada
    for (const evalDoc of evaluationsSnap.docs) {
      const evalData = evalDoc.data();
      const evalId = evalDoc.id;
      const evalNombre = evalData.nombre || 'Sin nombre';

      console.log(`--------------------------------------------------`);
      console.log(`📋 Evaluacion: ${evalNombre} (ID: ${evalId})`);
      console.log(`--------------------------------------------------`);

      // Referencia al documento del año del examen de los estudiantes evaluados
      const yearDocRef = db.doc(`evaluaciones/${evalId}/estudiantes-evaluados/${TARGET_AÑO_EXAMEN}`);

      // Obtener todas las subcolecciones de meses/periodos para este año
      const monthCols = await yearDocRef.listCollections();

      if (monthCols.length === 0) {
        console.log(`  ℹ️ No se encontraron subcolecciones de meses para el año ${TARGET_AÑO_EXAMEN}.`);
        continue;
      }

      // Procesar cada mes/periodo encontrado
      for (const colRef of monthCols) {
        const mesId = colRef.id;
        const collectionPath = `evaluaciones/${evalId}/estudiantes-evaluados/${TARGET_AÑO_EXAMEN}/${mesId}`;

        console.log(`  ⏳ Procesando Periodo/Mes: ${mesId} (Ruta: ${collectionPath})...`);
        const stats = await migrarPeriodo(collectionPath, commitPromises);

        globalProcesados += stats.totalProcesados;
        globalMigrados += stats.totalMigrados;
        globalOmitidos += stats.totalOmitidos;

        console.log(`  ✅ Periodo ${mesId} finalizado. (Revisados: ${stats.totalProcesados}, Migrados: ${stats.totalMigrados}, Omitidos: ${stats.totalOmitidos})\n`);
      }
    }

    // Esperar a que todas las promesas de los commits en segundo plano finalicen.
    if (commitPromises.length > 0) {
      console.log(`⏳ Esperando la confirmación de ${commitPromises.length} lotes de escritura pendientes en la base de datos...`);
      await Promise.all(commitPromises);
    }

    // 6. RESUMEN GLOBAL FINAL
    console.log(`\n==================================================`);
    console.log(`🎉 MIGRACIÓN GLOBAL FINALIZADA CON ÉXITO`);
    console.log(`--------------------------------------------------`);
    console.log(`Total evaluaciones procesadas: ${evaluationsSnap.size}`);
    console.log(`Total documentos revisados:    ${globalProcesados}`);
    console.log(`Total documentos migrados:     ${globalMigrados}`);
    console.log(`Total documentos omitidos:     ${globalOmitidos} (Ya estaban en formato nuevo/vacíos)`);
    console.log(`==================================================\n`);

  } catch (error) {
    console.error("❌ Error catastrófico durante la migración global:", error);
  } finally {
    process.exit(0);
  }
}

// Ejecutamos la migración
migrarColeccion();
