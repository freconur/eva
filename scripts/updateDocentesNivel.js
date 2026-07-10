const admin = require('firebase-admin');
const serviceAccount = require('../eva-ugel.json');

// Inicializar Firebase Admin
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

const db = admin.firestore();

// CONFIGURACIÓN: cambiar a false para aplicar los cambios reales en la base de datos
const DRY_RUN = false;

async function updateDocentesNivel() {
  console.log('--- Iniciando actualización de nivelDeInstitucion para Docentes (rol === 3) ---');
  console.log(`Modo: ${DRY_RUN ? 'SIMULACIÓN (Dry Run) - No se guardarán cambios' : 'EJECUCIÓN REAL - Guardando cambios'}`);
  console.log('--------------------------------------------------------------------------------');

  try {
    const usuariosRef = db.collection('usuarios');

    // Seleccionar únicamente el campo nivelDeInstitucion para ahorrar ancho de banda
    console.log('Obteniendo docentes (rol === 3) de Firestore...');
    const snapshot = await usuariosRef
      .where('rol', '==', 3)
      .select('nivelDeInstitucion')
      .get();

    if (snapshot.empty) {
      console.log('No se encontraron docentes (rol === 3) en la colección /usuarios.');
      return;
    }

    console.log(`Se encontraron ${snapshot.size} docentes registrados. Analizando...`);

    const docentesPorActualizar = [];

    snapshot.forEach(doc => {
      const data = doc.data();
      const nivel = data.nivelDeInstitucion;

      // Condiciones de actualización: undefined, null o array vacío []
      const requiereActualizacion = (
        nivel === undefined ||
        nivel === null ||
        (Array.isArray(nivel) && nivel.length === 0)
      );

      if (requiereActualizacion) {
        docentesPorActualizar.push({
          id: doc.id,
          ref: doc.ref,
          valorActual: nivel
        });
      }
    });

    console.log(`\nDocentes que requieren actualización (nivelDeInstitucion nulo, vacío o inexistente): ${docentesPorActualizar.length}`);

    if (docentesPorActualizar.length === 0) {
      console.log('Todos los docentes tienen sus niveles correctamente configurados. No hay nada que hacer.');
      return;
    }

    // Listar los DNI de los docentes que serán actualizados
    console.log('\nListado de DNI de docentes identificados:');
    docentesPorActualizar.forEach(docente => {
      console.log(`- DNI: ${docente.id} (Valor actual: ${JSON.stringify(docente.valorActual)})`);
    });

    if (DRY_RUN) {
      console.log('\n[SIMULACIÓN] El script ha terminado en modo Dry Run. Ningún dato fue modificado.');
      console.log('Para aplicar los cambios reales, edita el script y cambia "const DRY_RUN = true;" a "false".');
      return;
    }

    // Ejecutar la actualización real por lotes (batches de hasta 500)
    console.log('\nAplicando cambios en Firestore...');
    let count = 0;
    let batch = db.batch();
    let batchCount = 0;

    for (const docente of docentesPorActualizar) {
      batch.update(docente.ref, {
        nivelDeInstitucion: [1, 2],
        // Opcional: registrar última actualización del campo
        ultimaActualizacion: admin.firestore.FieldValue.serverTimestamp()
      });

      count++;
      batchCount++;

      // Firebase permite hasta 500 operaciones por batch
      if (batchCount === 499) {
        await batch.commit();
        console.log(`Lote enviado. Docentes actualizados hasta ahora: ${count}`);
        batch = db.batch();
        batchCount = 0;
      }
    }

    // Enviar el último lote restante si contiene operaciones
    if (batchCount > 0) {
      await batch.commit();
    }

    console.log('\n--- Proceso de actualización finalizado con éxito ---');
    console.log(`Total de docentes actualizados: ${count}`);

  } catch (error) {
    console.error('Error durante la actualización:', error);
  } finally {
    process.exit();
  }
}

updateDocentesNivel();
