const admin = require('firebase-admin');
const fs = require('fs');
const path = require('path');

const serviceAccountPath = path.resolve(__dirname, '../eva-ugel.json');
if (!fs.existsSync(serviceAccountPath)) {
  console.error('❌ Error: No se encontró eva-ugel.json.');
  process.exit(1);
}
const serviceAccount = require(serviceAccountPath);

// Configuración
const EVALUACION_ID = '7aN8fAxS4SQAlm9CTIlX';
const USUARIO_ID = 'YSd3Gak0ytNE427UGD5TlhZ146b2';
const MES = '10';
const ANO = '2025';
const LIMIT_ESTUDIANTES = 20;

async function cloneEvaluacionData() {
  console.log('📦 Iniciando clonación de datos de evaluación desde producción...\n');

  // Conectar a producción
  const prodApp = admin.initializeApp({
    credential: admin.credential.cert(serviceAccount)
  }, 'production');
  const prodDb = prodApp.firestore();

  // Conectar al emulador
  process.env.FIRESTORE_EMULATOR_HOST = 'localhost:8080';
  const emuApp = admin.initializeApp({ projectId: serviceAccount.project_id }, 'emulator');
  const emuDb = emuApp.firestore();

  console.log(`📡 Conectado a producción (${serviceAccount.project_id})`);
  console.log(`💻 Conectado a emulador local (localhost:8080)\n`);

  try {
    // 1. Clonar documento de evaluación
    console.log(`📋 Clonando evaluación: ${EVALUACION_ID}...`);
    const evaluacionDoc = await prodDb.collection('evaluaciones').doc(EVALUACION_ID).get();
    
    if (!evaluacionDoc.exists) {
      console.log(`   ❌ ERROR: No se encontró la evaluación ${EVALUACION_ID}`);
      process.exit(1);
    }
    
    await emuDb.collection('evaluaciones').doc(EVALUACION_ID).set(evaluacionDoc.data());
    console.log(`   ✅ Evaluación clonada exitosamente\n`);

    // 2. Clonar preguntas-respuestas
    console.log(`📝 Clonando preguntasRespuestas...`);
    const preguntasPath = `evaluaciones/${EVALUACION_ID}/preguntasRespuestas`;
    const preguntasSnapshot = await prodDb.collection(preguntasPath).get();
    
    if (preguntasSnapshot.empty) {
      console.log(`   ❌ ERROR: No se encontraron preguntas`);
      process.exit(1);
    }
    
    const preguntasBatch = emuDb.batch();
    preguntasSnapshot.forEach(doc => {
      const docRef = emuDb.collection(preguntasPath).doc(doc.id);
      preguntasBatch.set(docRef, doc.data());
    });
    await preguntasBatch.commit();
    console.log(`   ✅ ${preguntasSnapshot.size} preguntas clonadas\n`);

    // 3. Clonar estudiantes evaluados (LÍMITE: 1000)
    console.log(`👥 Clonando estudiantes evaluados (límite: ${LIMIT_ESTUDIANTES})...`);
    const estudiantesPath = `evaluaciones/${EVALUACION_ID}/estudiantes-evaluados/${ANO}/${MES}`;
    const estudiantesSnapshot = await prodDb.collection(estudiantesPath)
      .limit(LIMIT_ESTUDIANTES)
      .get();
    
    if (estudiantesSnapshot.empty) {
      console.log(`   ❌ ERROR: No se encontraron estudiantes`);
      process.exit(1);
    }
    
    // Clonar en lotes de 500 (límite de Firestore batch)
    const BATCH_SIZE = 500;
    let totalClonados = 0;
    let currentBatch = emuDb.batch();
    let batchCount = 0;
    
    for (const doc of estudiantesSnapshot.docs) {
      const docRef = emuDb.collection(estudiantesPath).doc(doc.id);
      currentBatch.set(docRef, doc.data());
      batchCount++;
      
      if (batchCount === BATCH_SIZE) {
        await currentBatch.commit();
        totalClonados += batchCount;
        console.log(`   ⏳ Clonados ${totalClonados} estudiantes...`);
        currentBatch = emuDb.batch();
        batchCount = 0;
      }
    }
    
    // Commit del último batch
    if (batchCount > 0) {
      await currentBatch.commit();
      totalClonados += batchCount;
    }
    
    console.log(`   ✅ ${totalClonados} estudiantes clonados exitosamente\n`);

    // 4. Clonar usuario
    console.log(`👤 Clonando usuario: ${USUARIO_ID}...`);
    const usuarioDoc = await prodDb.collection('usuarios').doc(USUARIO_ID).get();
    
    if (!usuarioDoc.exists) {
      console.log(`   ❌ ERROR: No se encontró el usuario`);
      process.exit(1);
    }
    
    await emuDb.collection('usuarios').doc(USUARIO_ID).set(usuarioDoc.data());
    console.log(`   ✅ Usuario clonado exitosamente\n`);

    // Resumen
    console.log('='.repeat(60));
    console.log('✅ CLONACIÓN COMPLETADA EXITOSAMENTE');
    console.log('='.repeat(60));
    console.log('\n📋 Datos clonados:');
    console.log(`   • Evaluación: 1 documento`);
    console.log(`   • Preguntas: ${preguntasSnapshot.size} documentos`);
    console.log(`   • Estudiantes: ${totalClonados} documentos (mes ${MES}/${ANO})`);
    console.log(`   • Usuarios: 1 documento`);
    console.log('\n💾 Listo para exportar.\n');

  } catch (error) {
    console.error('\n❌ Error durante la clonación:', error.message);
    console.error(error.stack);
    process.exit(1);
  }
  
  process.exit(0);
}

cloneEvaluacionData();
