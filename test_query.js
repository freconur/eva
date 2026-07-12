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
  const idEvaluacion = 'qRnVE00uOdQ6szJJWVyG'; // Let's check this eval
  const dniDirector = '11111111';
  
  try {
    const evalDoc = await db.doc(`/evaluaciones/${idEvaluacion}`).get();
    if (!evalDoc.exists) {
      console.log("Evaluation not found");
      return;
    }
    const evalData = evalDoc.data();
    console.log("Evaluation details:", {
      nombre: evalData.nombre,
      añoDelExamen: evalData.añoDelExamen,
      mesDelExamen: evalData.mesDelExamen,
    });
    
    const año = evalData.añoDelExamen || '2026';
    const mes = evalData.mesDelExamen || '6';
    
    const path = `/evaluaciones/${idEvaluacion}/estudiantes-evaluados/${año}/${mes}`;
    console.log(`Querying path: ${path}`);
    
    // Global query
    const globalSnap = await db.collection(path).get();
    console.log(`Global total students: ${globalSnap.size}`);
    
    // Director query
    const dirSnap = await db.collection(path).where('dniDirector', '==', dniDirector).get();
    console.log(`Director total students (string DNI): ${dirSnap.size}`);
    
    // Director query (number DNI)
    const dirSnapNum = await db.collection(path).where('dniDirector', '==', Number(dniDirector)).get();
    console.log(`Director total students (number DNI): ${dirSnapNum.size}`);
    
    if (dirSnap.size > 0) {
      console.log("Example student data:", JSON.stringify(dirSnap.docs[0].data(), null, 2));
    }
  } catch (error) {
    console.error("Error:", error);
  } finally {
    process.exit(0);
  }
}

main();
