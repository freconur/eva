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
    // 1. Obtener todos los directores (rol == 2)
    const dirSnap = await db.collection('usuarios').where('rol', '==', 2).get();
    console.log(`Encontrados ${dirSnap.size} directores en total.`);
    
    // Para cada director, busquemos sus docentes
    for (const dirDoc of dirSnap.docs) {
      const dirData = dirDoc.data();
      const dniDirector = dirDoc.id; // DNI suele ser el ID del documento
      
      const docentesSnap = await db.collection('usuarios')
        .where('dniDirector', '==', dniDirector)
        .get();
        
      if (docentesSnap.size > 0) {
        console.log(`\nDirector: ${dirData.nombres} ${dirData.apellidos} (DNI: ${dniDirector})`);
        console.log(`  Colegio: ${dirData.institucion}`);
        console.log(`  Docentes a cargo: ${docentesSnap.size}`);
        
        // Busquemos las evaluaciones de sus docentes
        const docentesIds = docentesSnap.docs.map(doc => doc.id);
        
        // Vamos a listar los subdirectorios o colecciones de las evaluaciones
        // Para cada docente, busquemos si tiene colecciones anidadas
        let totalEvaluacionesCount = 0;
        let activeEvaluaciones = new Set();
        
        for (const docId of docentesIds) {
          // Ya que no podemos listar colecciones fácilmente sin admin SDK y listCollections,
          // busquemos en evaluaciones si hay referencias o hagamos consultas directas si tenemos IDs de evaluación.
          // Pero podemos consultar las evaluaciones del sistema para probar si hay datos
        }
      }
    }
  } catch (error) {
    console.error("Error:", error);
  } finally {
    process.exit(0);
  }
}

main();
