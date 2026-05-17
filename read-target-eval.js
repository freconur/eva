const admin = require('firebase-admin');
const serviceAccount = require('./eva-ugel.json');

try {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount)
  });
} catch (error) {
  console.error("Error al inicializar Firebase Admin:", error);
  process.exit(1);
}

const db = admin.firestore();

async function main() {
  try {
    const doc = await db.doc('/evaluaciones/qRnVE00uOdQ6szJJWVyG').get();
    if (!doc.exists) {
      console.log("No existe el documento.");
    } else {
      console.log("Datos de la evaluación:");
      console.log(JSON.stringify(doc.data(), null, 2));
    }
  } catch (error) {
    console.error("Error:", error);
  } finally {
    process.exit(0);
  }
}

main();
