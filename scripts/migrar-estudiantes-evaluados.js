const admin = require('firebase-admin');
const serviceAccount = require('../eva-ugel.json');

// Inicializar Firebase Admin
if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount)
  });
}

const db = admin.firestore();

// CONSTANTES CONFIGURABLES
// Puede ser una sola cadena (string) "id_evaluacion" o un arreglo (Array) de cadenas ["id1", "id2", ...]

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

const ANIO = '2026';
const MES = '6';

async function migrarEstudiantes() {
  console.log('--- Iniciando migración eficiente de estudiantes-evaluados ---');

  // Convertir a arreglo en caso de que se pase una sola cadena de ID
  const listaEvaluaciones = Array.isArray(IDS_EVALUACIONES) ? IDS_EVALUACIONES : [IDS_EVALUACIONES];

  if (!listaEvaluaciones || listaEvaluaciones.length === 0) {
    console.error('ERROR: Por favor especifica al menos un ID de evaluación en IDS_EVALUACIONES.');
    process.exit(1);
  }

  console.log(`Año: ${ANIO}, Mes: ${MES}`);
  console.log(`Total de evaluaciones a procesar: ${listaEvaluaciones.length}`);

  try {
    // 1. Obtener directores (rol === 2) con select y get (Carga 1 sola vez en RAM)
    console.log('\nObteniendo información de directores (rol === 2)...');
    const usuariosRef = db.collection('usuarios');

    const directoresSnapshot = await usuariosRef
      .where('rol', '==', 2)
      .select('area', 'caracteristicaCurricular', 'institucion', 'nivelDeInstitucion', 'tipoGestion', 'dni')
      .get();

    if (directoresSnapshot.empty) {
      console.log('No se encontraron directores en la colección /usuarios.');
      return;
    }

    console.log(`Se encontraron ${directoresSnapshot.size} directores.`);

    // Crear mapa de directores en memoria
    const directorMap = {};
    directoresSnapshot.forEach(doc => {
      const data = doc.data();
      const dni = doc.id;

      directorMap[dni] = {
        area: data.area !== undefined ? data.area : '',
        caracteristicaCurricular: data.caracteristicaCurricular !== undefined ? data.caracteristicaCurricular : '',
        institucion: data.institucion !== undefined ? data.institucion : '',
        nivelDeInstitucion: data.nivelDeInstitucion !== undefined ? data.nivelDeInstitucion : [],
        tipoGestion: data.tipoGestion !== undefined ? data.tipoGestion : ''
      };

      if (data.dni && data.dni !== doc.id) {
        directorMap[data.dni] = directorMap[dni];
      }
    });

    let totalGlobalActualizados = 0;
    let totalGlobalIgnorados = 0;

    // 2. Iterar sobre la lista de evaluaciones
    for (let index = 0; index < listaEvaluaciones.length; index++) {
      const idEvaluacion = listaEvaluaciones[index];
      console.log(`\n==================================================`);
      console.log(`[${index + 1}/${listaEvaluaciones.length}] Procesando Evaluación: ${idEvaluacion}`);
      console.log(`==================================================`);

      const estudiantesRef = db
        .collection('evaluaciones')
        .doc(idEvaluacion)
        .collection('estudiantes-evaluados')
        .doc(ANIO)
        .collection(MES);

      const estudiantesStream = estudiantesRef
        .select('dniDirector')
        .stream();

      let count = 0;
      let skippedCount = 0;
      let batch = db.batch();
      let batchCount = 0;

      for await (const doc of estudiantesStream) {
        const studentData = doc.data();
        const dniDirector = studentData.dniDirector;

        if (!dniDirector) {
          skippedCount++;
          continue;
        }

        const directorData = directorMap[dniDirector];

        if (!directorData) {
          skippedCount++;
          continue;
        }

        batch.update(doc.ref, {
          area: directorData.area,
          caracteristicaCurricular: directorData.caracteristicaCurricular,
          institucion: directorData.institucion,
          nivelDeInstitucion: directorData.nivelDeInstitucion,
          tipoGestion: directorData.tipoGestion,
          ultimaActualizacion: admin.firestore.FieldValue.serverTimestamp()
        });

        count++;
        batchCount++;

        if (batchCount === 499) {
          await batch.commit();
          console.log(`  Lote enviado. Estudiantes actualizados en esta evaluación: ${count}`);
          batch = db.batch();
          batchCount = 0;
        }
      }

      if (batchCount > 0) {
        await batch.commit();
      }

      console.log(`  Resumen Evaluación (${idEvaluacion}): ${count} actualizados, ${skippedCount} ignorados.`);
      totalGlobalActualizados += count;
      totalGlobalIgnorados += skippedCount;
    }

    console.log('\n==================================================');
    console.log('🎉 --- Proceso global de migración finalizado con éxito --- 🎉');
    console.log(`Total acumulado de estudiantes actualizados: ${totalGlobalActualizados}`);
    console.log(`Total acumulado de estudiantes ignorados: ${totalGlobalIgnorados}`);
    console.log('==================================================');

  } catch (error) {
    console.error('Error durante la migración:', error);
  } finally {
    process.exit();
  }
}

migrarEstudiantes();
