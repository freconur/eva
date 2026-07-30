const admin = require('firebase-admin');
const serviceAccount = require('../eva-ugel.json');

// Inicializar Firebase Admin
if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount)
  });
}

const db = admin.firestore();
// const IDS_EVALUACIONES = [
//   "0kYS9yzOo42FXSpfVHos"]
// 30 Evaluaciones Activas de Julio 2026
const IDS_EVALUACIONES = [
  "0r2RvV5vMwCj993ub2aI",
  "13yP88FwKVVQwREpOeg9",
  "1igVIs8tD91unSAy8Bv5",
  "4u54TaVqAEGsajItfwnE",
  "7a7tcReh0PmObm6CXCXB",
  "9iW7yTanY368mqvG0tk2",
  "A03SoBidQLgzqznVktoC",
  "DLw1tV0Aw2ifFVXD2NHu",
  "GDQaRsvAPZgBGrmTlF8D",
  "HuPxUrbtMcARXK7lt0MW",
  "KDF3bnjOGJ09wLy4v5VO",
  "SYodnwI1WCA8uH4Y9rFo",
  "UihuHA37DhKgrJGNtWpm",
  "XDiX3VGecMrbw14RVWPj",
  "bdqn123aSS7KxHC8fZ06",
  "bqemoSFPwkqxg1U3kauW",
  "dG03PPrsxeEcL6Ehxb0T",
  "deliVGyCw8AbUDyBC46U",
  "eS22sTjZCAQL3ulebEbU",
  "eiYpjTfa0MRzUSF79HeI",
  "iDcUub7RZj3PwYgptLvc",
  "mIciQwXo8hDTuJmLgCer",
  "nbzUoQbbKgIDvSEURc4p",
  "qXeUiomrPgxZo9aBrgVF",
  "qZPpfFkLOR3FW1cV54S7",
  "s7xdkMLKfiZeqiUmL4sd",
  "sxB9Ebzs4tQ1ZP7iz4il",
  "uFP0X7TP2gyyCc764M4E",
  "yxWQOSOfGkdpWKKFMmpQ"
];

async function migrarConsolidadosDirectores() {
  console.log('--- Iniciando parcheo de consolidados_realtime_directores ---');

  const listaEvaluaciones = Array.isArray(IDS_EVALUACIONES) ? IDS_EVALUACIONES : [IDS_EVALUACIONES];

  // 1. Cargar Directores desde /usuarios (rol === 2) únicamente con los campos requeridos
  console.log('Cargando perfiles de directores en memoria (RAM)...');
  const snapshot = await db.collection('usuarios')
    .where('rol', '==', 2)
    .select('genero', 'area', 'caracteristicaCurricular', 'tipoGestion', 'region', 'distrito', 'dni')
    .get();

  const directorMap = {};
  snapshot.forEach(doc => {
    const data = doc.data();
    const dni = data.dni || doc.id;
    directorMap[dni] = {
      genero: data.genero !== undefined ? data.genero : '',
      area: data.area !== undefined ? Number(data.area) : '',
      caracteristicaCurricular: data.caracteristicaCurricular !== undefined ? data.caracteristicaCurricular : '',
      tipoGestion: data.tipoGestion !== undefined ? data.tipoGestion : '',
      region: data.region !== undefined ? data.region : '',
      distrito: data.distrito !== undefined ? data.distrito : ''
    };
  });

  console.log(`Se cargaron ${Object.keys(directorMap).length} directores en memoria.`);

  let totalActualizados = 0;

  // 2. Iterar sobre las evaluaciones y procesar con .stream()
  for (let i = 0; i < listaEvaluaciones.length; i++) {
    const idEval = listaEvaluaciones[i];
    console.log(`\n[${i + 1}/${listaEvaluaciones.length}] Procesando evaluación: ${idEval}`);

    const collectionRef = db.collection(`evaluaciones/${idEval}/consolidados_realtime_directores`);
    const stream = collectionRef.stream();

    let batch = db.batch();
    let batchCount = 0;
    let evalCount = 0;

    for await (const doc of stream) {
      const dniDirector = doc.id;
      const info = directorMap[dniDirector];

      if (info) {
        // Actualización parcial: Adiciona SOLO las propiedades indicadas sin borrar nada existente
        batch.update(doc.ref, info);
        batchCount++;
        evalCount++;
        totalActualizados++;
      }

      if (batchCount === 499) {
        await batch.commit();
        batch = db.batch();
        batchCount = 0;
      }
    }

    if (batchCount > 0) {
      await batch.commit();
    }

    console.log(`  -> Directores actualizados en esta evaluación: ${evalCount}`);
  }

  console.log('\n🎉 --- Parcheo finalizado con éxito ---');
  console.log(`Total acumulado de documentos de directores actualizados: ${totalActualizados}`);
  process.exit(0);
}

migrarConsolidadosDirectores().catch(err => {
  console.error('Error:', err);
  process.exit(1);
});
