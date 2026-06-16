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
  const targetPath = '/evaluaciones/2mdtmKI4xquimBSTaGMe/estudiantes-evaluados/2026/2/80763987';
  console.log(`Intentando leer el documento en la ruta: ${targetPath}`);
  
  try {
    const docRef = db.doc(targetPath);
    const doc = await docRef.get();
    
    if (!doc.exists) {
      console.log("El documento no existe.");
      return;
    }
    
    const data = doc.data();
    
    // Función para calcular el tamaño en bytes según la fórmula oficial de Firestore:
    // https://firebase.google.com/docs/firestore/storage-size
    function getFirestoreValueSize(val) {
      if (val === null) return 1;
      if (typeof val === 'boolean') return 1;
      if (typeof val === 'number') return 8; // Firestore almacena números como doubles (8 bytes) o integers (8 bytes)
      if (typeof val === 'string') return Buffer.byteLength(val, 'utf8') + 1;
      
      // Si es un Timestamp de Firestore (objeto con _seconds o Date)
      if (val && typeof val === 'object' && (val.toDate || (val._seconds !== undefined && val._nanoseconds !== undefined))) {
        return 8; // Timestamps ocupan 8 bytes
      }
      
      if (Array.isArray(val)) {
        let size = 1; // 1 byte de overhead para el array
        for (const item of val) {
          size += getFirestoreValueSize(item);
        }
        return size;
      }
      
      if (typeof val === 'object') {
        let size = 1; // 1 byte de overhead para el mapa
        for (const key in val) {
          if (val.hasOwnProperty(key)) {
            const keySize = Buffer.byteLength(key, 'utf8') + 32; // Cada clave en un mapa tiene clave + 32 bytes de overhead
            size += keySize + getFirestoreValueSize(val[key]);
          }
        }
        return size;
      }
      
      return 0;
    }
    
    function calculateFirestoreDocSize(path, documentData) {
      let total = 0;
      
      // 1. Nombre del documento (ruta completa relativa al proyecto)
      // Ejemplo: projects/project-id/databases/(default)/documents/evaluaciones/2mdtmKI4xquimBSTaGMe/...
      const fullPath = `projects/eva-ugel/databases/(default)/documents${path}`; // Usamos un id aproximado de proyecto
      total += Buffer.byteLength(fullPath, 'utf8') + 32;
      
      // 2. Campos raíz
      for (const key in documentData) {
        if (documentData.hasOwnProperty(key)) {
          const keySize = Buffer.byteLength(key, 'utf8') + 32; // 32 bytes de overhead por campo raíz
          const valSize = getFirestoreValueSize(documentData[key]);
          total += keySize + valSize;
        }
      }
      
      return total;
    }
    
    const rawJsonSize = Buffer.byteLength(JSON.stringify(data), 'utf8');
    const firestoreSize = calculateFirestoreDocSize(targetPath, data);
    
    console.log(`\n==================================================`);
    console.log(`CÁLCULO DETALLADO DE PESO`);
    console.log(`Ruta: ${targetPath}`);
    console.log(`--------------------------------------------------`);
    console.log(`1. Peso en texto plano (JSON crudo): ${rawJsonSize} bytes (${(rawJsonSize/1024).toFixed(2)} KB)`);
    console.log(`2. Peso real facturado en Firestore: ${firestoreSize} bytes (${(firestoreSize/1024).toFixed(2)} KB)`);
    console.log(`==================================================\n`);
    
  } catch (error) {
    console.error("Error al leer el documento:", error);
  } finally {
    process.exit(0);
  }
}

main();
