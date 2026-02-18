const admin = require('firebase-admin');
const serviceAccount = require('../eva-ugel.json');

// Inicializar Firebase Admin
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

const db = admin.firestore();

async function updateUsersLevel() {
  console.log('--- Iniciando actualización de nivelDeInstitucion ---');
  
  try {
    const usuariosRef = db.collection('usuarios');
    const snapshot = await usuariosRef.get();
    
    if (snapshot.empty) {
      console.log('No se encontraron documentos en la colección /usuarios.');
      return;
    }

    console.log(`Se encontraron ${snapshot.size} documentos. Procesando...`);

    let count = 0;
    let batch = db.batch();
    let batchCount = 0;

    for (const doc of snapshot.docs) {
      const data = doc.data();
      const nivel = data.nivelDeInstitucion;

      // Condición: No tiene la propiedad o es un array vacío
      const shouldUpdate = nivel === undefined || (Array.isArray(nivel) && nivel.length === 0);

      if (shouldUpdate) {
        batch.update(doc.ref, { nivelDeInstitucion: [1, 2] });
        count++;
        batchCount++;

        // Firestore permite hasta 500 operaciones por batch
        if (batchCount === 499) {
          await batch.commit();
          console.log(`Lote enviado. Usuarios actualizados hasta ahora: ${count}`);
          batch = db.batch();
          batchCount = 0;
        }
      }
    }

    // Enviar el último lote si tiene operaciones
    if (batchCount > 0) {
      await batch.commit();
    }

    console.log('--- Proceso finalizado ---');
    console.log(`Total de usuarios actualizados: ${count}`);

  } catch (error) {
    console.error('Error durante la actualización:', error);
  } finally {
    process.exit();
  }
}

updateUsersLevel();
