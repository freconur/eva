const admin = require('firebase-admin');
const fs = require('fs');
const path = require('path');

// Cargar la llave de servicio
const serviceAccountPath = path.resolve(__dirname, '../eva-ugel.json');
if (!fs.existsSync(serviceAccountPath)) {
  console.error('❌ Error: No se encontró eva-ugel.json en la raíz del proyecto.');
  process.exit(1);
}
const serviceAccount = require(serviceAccountPath);

// Configuración de colecciones a clonar (máximo 50 docs por cada una)
const COLLECTIONS = [
  'usuarios',
  'evaluaciones',
  'grados',
  'evaluacion-curricular',
  'evaluacion-curricular-preguntas-alternativas',
  'caracteristica-curricular',
  'comunicados',
  'asistencia_estudiantes',
  'asistencia_docentes'
];

const LIMIT_PER_COLLECTION = 50;

async function generateSubset() {
  console.log('🚀 Iniciando generación de subset...');

  // 1. Inicializar app de Producción (Solo lectura)
  const prodApp = admin.initializeApp({
    credential: admin.credential.cert(serviceAccount)
  }, 'production');
  const prodDb = prodApp.firestore();

  // 2. Inicializar app de Emulador (Escritura)
  // IMPORTANTE: El host debe coincidir con el de firebase.json
  process.env.FIRESTORE_EMULATOR_HOST = 'localhost:8080';
  const emuApp = admin.initializeApp({
    projectId: serviceAccount.project_id
  }, 'emulator');
  const emuDb = emuApp.firestore();

  console.log(`📡 Conectado a producción (${serviceAccount.project_id})`);
  console.log(`💻 Conectado a emulador local (localhost:8080)`);

  for (const colName of COLLECTIONS) {
    try {
      console.log(`📦 Procesando colección: ${colName}...`);
      const snapshot = await prodDb.collection(colName).limit(LIMIT_PER_COLLECTION).get();
      
      if (snapshot.empty) {
        console.log(`   ⚠️ La colección ${colName} está vacía.`);
        continue;
      }

      const batch = emuDb.batch();
      let count = 0;

      snapshot.forEach(doc => {
        const docRef = emuDb.collection(colName).doc(doc.id);
        batch.set(docRef, doc.data());
        count++;
      });

      await batch.commit();
      console.log(`   ✅ Clonados ${count} documentos de ${colName}.`);
    } catch (error) {
      console.error(`   ❌ Error en ${colName}:`, error.message);
    }
  }

  console.log('\n✨ Subset generado exitosamente en el emulador.');
  console.log('💡 Recuerda ejecutar "firebase emulators:export ./latest-subset-export" para guardar estos cambios.');
  
  process.exit(0);
}

generateSubset().catch(err => {
  console.error('💥 Error fatal:', err);
  process.exit(1);
});
