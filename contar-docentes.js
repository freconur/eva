const admin = require('firebase-admin');

// Si se define la variable de entorno, se conecta al emulador
if (process.env.FIRESTORE_EMULATOR_HOST) {
  admin.initializeApp({
    projectId: 'eva-ugel'
  });
  console.log("📡 Conectado al emulador de Firestore en:", process.env.FIRESTORE_EMULATOR_HOST);
} else {
  // De lo contrario, intenta usar las credenciales de eva-ugel.json
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

async function contarDocentes() {
  try {
    console.log("🔍 Contando usuarios con rol === 3 (docentes)...");
    
    let total;
    try {
      // Intenta usar count() (más rápido y económico en Firestore)
      const snapshot = await db.collection('usuarios')
        .where('rol', '==', 3)
        .count()
        .get();
      total = snapshot.data().count;
    } catch (e) {
      // Fallback para versiones antiguas del SDK de Firebase Admin que no soportan count()
      const snapshot = await db.collection('usuarios')
        .where('rol', '==', 3)
        .select() // Para no descargar los datos pesados de los documentos
        .get();
      total = snapshot.size;
    }
    
    console.log(`\n==================================================`);
    console.log(`👨‍🏫 Total de docentes (rol === 3) encontrados: ${total}`);
    console.log(`==================================================\n`);
  } catch (error) {
    console.error("❌ Error al contar los docentes:", error);
  } finally {
    process.exit(0);
  }
}

contarDocentes();
