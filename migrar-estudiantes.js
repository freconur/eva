const admin = require('firebase-admin');

// --- CONFIGURACIÓN DE EMULADORES (Comentar si se usa en producción) ---
// process.env.FIRESTORE_EMULATOR_HOST = 'localhost:8080';
// process.env.FIREBASE_AUTH_EMULATOR_HOST = 'localhost:9099';

// Inicialización de la App
admin.initializeApp({
  projectId: 'evaluaciones-ugel', // Asegúrate de que coincida con tu .firebaserc
});

const db = admin.firestore();

// Rutas de las colecciones
const evaluacionId = 'mMpJKnswFC3YdifhjdnI';
const year = '2026';
const sourcePeriodo = '1';
const targetPeriodo = '2';

const sourcePath = `evaluaciones/${evaluacionId}/estudiantes-evaluados/${year}/${sourcePeriodo}`;
const targetPath = `evaluaciones/${evaluacionId}/estudiantes-evaluados/${year}/${targetPeriodo}`;

async function migrateData() {
  console.log(`🚀 Iniciando copia de documentos de: ${sourcePath}`);
  console.log(`📂 Destino: ${targetPath}`);

  try {
    const sourceRef = db.collection(sourcePath);
    const targetRef = db.collection(targetPath);

    const snapshot = await sourceRef.get();

    if (snapshot.empty) {
      console.log('⚠️ No se encontraron documentos en la colección de origen.');
      return;
    }

    console.log(`📊 Se encontraron ${snapshot.size} documentos para copiar.`);

    // Procesar en lotes de 500 (límite de Firestore batch)
    let batch = db.batch();
    let count = 0;
    let totalCopied = 0;

    for (const doc of snapshot.docs) {
      const data = doc.data();
      const newDocRef = targetRef.doc(doc.id);
      
      batch.set(newDocRef, data);
      count++;
      totalCopied++;

      // Si llegamos a 500, ejecutamos el batch y creamos uno nuevo
      if (count === 500) {
        await batch.commit();
        console.log(`✅ Lote de 500 documentos procesado (${totalCopied}/${snapshot.size})...`);
        batch = db.batch();
        count = 0;
      }
    }

    // Ejecutar el lote final si hay documentos restantes
    if (count > 0) {
      await batch.commit();
    }

    console.log(`\n🎉 Migración completada con éxito.`);
    console.log(`✅ Total de documentos copiados: ${totalCopied}`);

  } catch (error) {
    console.error('❌ Error durante la migración:', error);
  } finally {
    console.log('🏁 Proceso finalizado.');
    process.exit(0);
  }
}

migrateData();
