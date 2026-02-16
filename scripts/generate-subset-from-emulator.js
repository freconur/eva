const admin = require('firebase-admin');

// Configuración específica para el subset de pruebas de Cloud Function
const EVALUACION_ID = '7aN8fAxS4SQAlm9CTIlX';
const USUARIO_ID = 'YSd3Gak0ytNE427UGD5TlhZ146b2';
const MES = '10';
const ANO = '2025';

async function generateSubsetFromEmulator() {
  console.log('🚀 Iniciando filtrado de subset desde emulador...\n');

  // Conectar al emulador
  process.env.FIRESTORE_EMULATOR_HOST = 'localhost:8080';
  const app = admin.initializeApp({
    projectId: 'eva-ugel'
  });
  const db = app.firestore();

  console.log('📡 Conectado al emulador local (localhost:8080)\n');

  try {
    // 1. Obtener estudiantes evaluados
    console.log(`📦 Procesando: estudiantes-evaluados/${ANO}/${MES}...`);
    const estudiantesPath = `evaluaciones/${EVALUACION_ID}/estudiantes-evaluados/${ANO}/${MES}`;
    const estudiantesSnapshot = await db.collection(estudiantesPath).get();
    
    if (estudiantesSnapshot.empty) {
      console.log(`   ⚠️ No se encontraron estudiantes en ${estudiantesPath}`);
    } else {
      console.log(`   ✅ Encontrados ${estudiantesSnapshot.size} estudiantes`);
    }

    // 2. Obtener preguntas-respuestas
    console.log(`📦 Procesando: preguntas-respuestas...`);
    const preguntasPath = `evaluaciones/${EVALUACION_ID}/preguntas-respuestas`;
    const preguntasSnapshot = await db.collection(preguntasPath).get();
    
    if (preguntasSnapshot.empty) {
      console.log(`   ⚠️ No se encontraron preguntas en ${preguntasPath}`);
    } else {
      console.log(`   ✅ Encontradas ${preguntasSnapshot.size} preguntas`);
    }

    // 3. Obtener usuario
    console.log(`📦 Procesando: usuario...`);
    const usuarioDoc = await db.collection('usuarios').doc(USUARIO_ID).get();
    
    if (!usuarioDoc.exists) {
      console.log(`   ⚠️ No se encontró el usuario ${USUARIO_ID}`);
    } else {
      console.log(`   ✅ Usuario encontrado`);
    }

    // 4. Obtener documento de evaluación
    console.log(`📦 Procesando: evaluación...`);
    const evaluacionDoc = await db.collection('evaluaciones').doc(EVALUACION_ID).get();
    
    if (!evaluacionDoc.exists) {
      console.log(`   ⚠️ No se encontró la evaluación ${EVALUACION_ID}`);
    } else {
      console.log(`   ✅ Evaluación encontrada`);
    }

    console.log('\n✨ Filtrado completado exitosamente.');
    console.log('💡 Los datos están listos en el emulador para ser exportados.\n');
    
    console.log('📋 Resumen de datos en el subset:');
    console.log(`   • Estudiantes: ${estudiantesSnapshot.size}`);
    console.log(`   • Preguntas: ${preguntasSnapshot.size}`);
    console.log(`   • Usuario: ${usuarioDoc.exists ? '1' : '0'}`);
    console.log(`   • Evaluación: ${evaluacionDoc.exists ? '1' : '0'}`);
    console.log('');
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Error al generar subset:', error.message);
    process.exit(1);
  }
}

generateSubsetFromEmulator().catch(err => {
  console.error('💥 Error fatal:', err);
  process.exit(1);
});
