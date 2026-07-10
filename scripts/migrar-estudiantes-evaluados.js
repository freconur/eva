const admin = require('firebase-admin');
const serviceAccount = require('../eva-ugel.json');

// Inicializar Firebase Admin
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

const db = admin.firestore();

// CONSTANTES CONFIGURABLES
const ID_EVALUACION = 'nbzUoQbbKgIDvSEURc4p'; // Pon el ID de la evaluación aquí
const ANIO = '2026';
const MES = '6';

async function migrarEstudiantes() {
  console.log('--- Iniciando migración eficiente de estudiantes-evaluados ---');
  console.log(`Evaluación: ${ID_EVALUACION}`);
  console.log(`Año: ${ANIO}, Mes: ${MES}`);

  if (ID_EVALUACION === 'REEMPLAZAR_CON_ID_EVALUACION') {
    console.error('ERROR: Por favor especifica un ID_EVALUACION válido en el script.');
    process.exit(1);
  }

  try {
    // 1. Obtener directores (rol === 2) con select y get
    console.log('Obteniendo información de directores (rol === 2)...');
    const usuariosRef = db.collection('usuarios');

    // Seleccionar únicamente los campos requeridos para ahorrar ancho de banda
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

      // Mapear también por el campo 'dni' si existe y es diferente de doc.id
      if (data.dni && data.dni !== doc.id) {
        directorMap[data.dni] = directorMap[dni];
      }
    });

    // 2. Obtener estudiantes evaluados usando select y stream
    const estudiantesRef = db
      .collection('evaluaciones')
      .doc(ID_EVALUACION)
      .collection('estudiantes-evaluados')
      .doc(ANIO)
      .collection(MES);

    console.log(`Abriendo stream de estudiantes evaluados en /evaluaciones/${ID_EVALUACION}/estudiantes-evaluados/${ANIO}/${MES}...`);

    // Seleccionamos solo el dniDirector del estudiante para el cruce (máxima eficiencia de lectura)
    const estudiantesStream = estudiantesRef
      .select('dniDirector')
      .stream();

    let count = 0;
    let skippedCount = 0;
    let batch = db.batch();
    let batchCount = 0;

    // Procesamiento secuencial del stream
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

      // Preparar la actualización con las 5 propiedades del director
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

      // Enviar lotes de hasta 500 escrituras (límite de Firestore)
      if (batchCount === 499) {
        await batch.commit();
        console.log(`Lote enviado. Estudiantes actualizados: ${count}`);
        batch = db.batch();
        batchCount = 0;
      }
    }

    // Enviar el último lote restante si contiene operaciones
    if (batchCount > 0) {
      await batch.commit();
    }

    console.log('--- Proceso de migración finalizado con éxito ---');
    console.log(`Total de estudiantes actualizados: ${count}`);
    console.log(`Total de estudiantes ignorados (sin cruce de director): ${skippedCount}`);

  } catch (error) {
    console.error('Error durante la migración:', error);
  } finally {
    process.exit();
  }
}

migrarEstudiantes();
