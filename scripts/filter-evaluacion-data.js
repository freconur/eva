const admin = require('firebase-admin');

// Configuración de las rutas específicas que necesitamos mantener
const EVALUACION_ID = '7aN8fAxS4SQAlm9CTIlX';
const USUARIO_ID = 'YSd3Gak0ytNE427UGD5TlhZ146b2';
const MES = '10';
const ANO = '2025';

async function filterEvaluacionData() {
  console.log('🔄 Iniciando filtrado y limpieza de datos...\n');

  // Conectar al emulador (que ya tiene el export completo cargado)
  process.env.FIRESTORE_EMULATOR_HOST = 'localhost:8080';
  const app = admin.initializeApp({ projectId: 'eva-ugel' });
  const db = app.firestore();

  console.log('📡 Conectado al emulador local (localhost:8080)\n');

  try {
    // PASO 1: Verificar que los datos necesarios existen
    console.log('📋 PASO 1: Verificando datos necesarios...\n');

    const estudiantesPath = `evaluaciones/${EVALUACION_ID}/estudiantes-evaluados/${ANO}/${MES}`;
    const preguntasPath = `evaluaciones/${EVALUACION_ID}/preguntas-respuestas`;

    // Verificar estudiantes
    console.log(`   Verificando: ${estudiantesPath}...`);
    const estudiantesSnapshot = await db.collection(estudiantesPath).get();
    if (estudiantesSnapshot.empty) {
      console.log(`   ❌ ERROR: No se encontraron estudiantes`);
      process.exit(1);
    }
    console.log(`   ✅ ${estudiantesSnapshot.size} estudiantes encontrados`);

    // Verificar preguntas
    console.log(`   Verificando: ${preguntasPath}...`);
    const preguntasSnapshot = await db.collection(preguntasPath).get();
    if (preguntasSnapshot.empty) {
      console.log(`   ❌ ERROR: No se encontraron preguntas`);
      process.exit(1);
    }
    console.log(`   ✅ ${preguntasSnapshot.size} preguntas encontradas`);

    // Verificar usuario
    console.log(`   Verificando: usuarios/${USUARIO_ID}...`);
    const usuarioDoc = await db.collection('usuarios').doc(USUARIO_ID).get();
    if (!usuarioDoc.exists) {
      console.log(`   ❌ ERROR: No se encontró el usuario`);
      process.exit(1);
    }
    console.log(`   ✅ Usuario encontrado`);

    // Verificar evaluación
    console.log(`   Verificando: evaluaciones/${EVALUACION_ID}...`);
    const evaluacionDoc = await db.collection('evaluaciones').doc(EVALUACION_ID).get();
    if (!evaluacionDoc.exists) {
      console.log(`   ❌ ERROR: No se encontró la evaluación`);
      process.exit(1);
    }
    console.log(`   ✅ Evaluación encontrada\n`);

    // PASO 2: Eliminar TODAS las colecciones de nivel superior excepto las necesarias
    console.log('🧹 PASO 2: Limpiando colecciones innecesarias...\n');

    // Obtener todas las colecciones de nivel superior
    const collections = await db.listCollections();
    console.log(`   Total de colecciones encontradas: ${collections.length}`);

    for (const collection of collections) {
      const colName = collection.id;
      
      // Mantener solo 'usuarios' y 'evaluaciones'
      if (colName !== 'usuarios' && colName !== 'evaluaciones') {
        console.log(`   🗑️  Eliminando colección: ${colName}...`);
        await deleteCollection(db, colName, 100);
      } else {
        console.log(`   ✅ Manteniendo colección: ${colName}`);
      }
    }

    // PASO 3: Limpiar colección 'usuarios' - mantener solo el usuario necesario
    console.log('\n🧹 PASO 3: Limpiando colección usuarios...\n');
    const todosUsuarios = await db.collection('usuarios').get();
    console.log(`   Total de usuarios: ${todosUsuarios.size}`);
    
    let usuariosEliminados = 0;
    const batch = db.batch();
    todosUsuarios.forEach(doc => {
      if (doc.id !== USUARIO_ID) {
        batch.delete(doc.ref);
        usuariosEliminados++;
      }
    });
    await batch.commit();
    console.log(`   ✅ Eliminados ${usuariosEliminados} usuarios innecesarios`);
    console.log(`   ✅ Mantenido 1 usuario: ${USUARIO_ID}`);

    // PASO 4: Limpiar colección 'evaluaciones' - mantener solo la evaluación necesaria
    console.log('\n🧹 PASO 4: Limpiando colección evaluaciones...\n');
    const todasEvaluaciones = await db.collection('evaluaciones').get();
    console.log(`   Total de evaluaciones: ${todasEvaluaciones.size}`);
    
    let evaluacionesEliminadas = 0;
    for (const doc of todasEvaluaciones.docs) {
      if (doc.id !== EVALUACION_ID) {
        // Eliminar la evaluación y todas sus subcolecciones
        await deleteDocumentWithSubcollections(db, `evaluaciones/${doc.id}`);
        evaluacionesEliminadas++;
      }
    }
    console.log(`   ✅ Eliminadas ${evaluacionesEliminadas} evaluaciones innecesarias`);
    console.log(`   ✅ Mantenida 1 evaluación: ${EVALUACION_ID}`);

    // PASO 5: Limpiar subcolecciones de la evaluación que mantenemos
    console.log('\n🧹 PASO 5: Limpiando subcolecciones innecesarias de la evaluación...\n');
    const evaluacionRef = db.collection('evaluaciones').doc(EVALUACION_ID);
    const subcollections = await evaluacionRef.listCollections();
    
    for (const subcol of subcollections) {
      const subcolName = subcol.id;
      
      // Mantener solo 'preguntas-respuestas' y 'estudiantes-evaluados'
      if (subcolName !== 'preguntas-respuestas' && subcolName !== 'estudiantes-evaluados') {
        console.log(`   🗑️  Eliminando subcolección: ${subcolName}...`);
        await deleteCollection(db, `evaluaciones/${EVALUACION_ID}/${subcolName}`, 100);
      } else {
        console.log(`   ✅ Manteniendo subcolección: ${subcolName}`);
      }
    }

    // PASO 6: Limpiar estudiantes-evaluados - mantener solo el mes necesario
    console.log('\n🧹 PASO 6: Limpiando estudiantes-evaluados...\n');
    const estudiantesEvaluadosRef = db.collection(`evaluaciones/${EVALUACION_ID}/estudiantes-evaluados`);
    const anosSnapshot = await estudiantesEvaluadosRef.get();
    
    for (const anoDoc of anosSnapshot.docs) {
      if (anoDoc.id !== ANO) {
        console.log(`   🗑️  Eliminando año: ${anoDoc.id}...`);
        await deleteDocumentWithSubcollections(db, `evaluaciones/${EVALUACION_ID}/estudiantes-evaluados/${anoDoc.id}`);
      } else {
        // Limpiar meses innecesarios dentro del año correcto
        const mesesRef = db.collection(`evaluaciones/${EVALUACION_ID}/estudiantes-evaluados/${ANO}`);
        const mesesSnapshot = await mesesRef.get();
        
        for (const mesDoc of mesesSnapshot.docs) {
          if (mesDoc.id !== MES) {
            console.log(`   🗑️  Eliminando mes: ${mesDoc.id}...`);
            await deleteDocumentWithSubcollections(db, `evaluaciones/${EVALUACION_ID}/estudiantes-evaluados/${ANO}/${mesDoc.id}`);
          }
        }
      }
    }
    console.log(`   ✅ Mantenido solo: ${ANO}/${MES}`);

    // Resumen final
    console.log('\n' + '='.repeat(60));
    console.log('✅ LIMPIEZA COMPLETADA EXITOSAMENTE');
    console.log('='.repeat(60));
    console.log('\n📋 Datos mantenidos en el subset:');
    console.log(`   • Estudiantes: ${estudiantesSnapshot.size} (mes ${MES}/${ANO})`);
    console.log(`   • Preguntas: ${preguntasSnapshot.size}`);
    console.log(`   • Usuarios: 1 (${USUARIO_ID})`);
    console.log(`   • Evaluaciones: 1 (${EVALUACION_ID})`);
    console.log('\n💾 El subset está listo para ser exportado.\n');
    
    process.exit(0);
  } catch (error) {
    console.error('\n❌ Error durante el filtrado:', error.message);
    console.error(error.stack);
    process.exit(1);
  }
}

// Función auxiliar para eliminar una colección completa
async function deleteCollection(db, collectionPath, batchSize) {
  const collectionRef = db.collection(collectionPath);
  const query = collectionRef.limit(batchSize);

  return new Promise((resolve, reject) => {
    deleteQueryBatch(db, query, resolve).catch(reject);
  });
}

async function deleteQueryBatch(db, query, resolve) {
  const snapshot = await query.get();

  const batchSize = snapshot.size;
  if (batchSize === 0) {
    resolve();
    return;
  }

  const batch = db.batch();
  snapshot.docs.forEach((doc) => {
    batch.delete(doc.ref);
  });
  await batch.commit();

  process.nextTick(() => {
    deleteQueryBatch(db, query, resolve);
  });
}

// Función auxiliar para eliminar un documento con todas sus subcolecciones
async function deleteDocumentWithSubcollections(db, docPath) {
  const docRef = db.doc(docPath);
  const subcollections = await docRef.listCollections();
  
  for (const subcol of subcollections) {
    await deleteCollection(db, `${docPath}/${subcol.id}`, 100);
  }
  
  await docRef.delete();
}

filterEvaluacionData();

