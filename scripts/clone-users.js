const admin = require('firebase-admin');
const fs = require('fs');
const path = require('path');

const serviceAccountPath = path.resolve(__dirname, '../eva-ugel.json');
if (!fs.existsSync(serviceAccountPath)) {
  console.error('❌ Error: No se encontró eva-ugel.json.');
  process.exit(1);
}
const serviceAccount = require(serviceAccountPath);

async function cloneUsers() {
  console.log('👥 Iniciando clonación especializada de USUARIOS (Límite: 500)...');

  const prodApp = admin.initializeApp({
    credential: admin.credential.cert(serviceAccount)
  }, 'production');
  const prodDb = prodApp.firestore();

  process.env.FIRESTORE_EMULATOR_HOST = 'localhost:8080';
  const emuApp = admin.initializeApp({ projectId: serviceAccount.project_id }, 'emulator');
  const emuDb = emuApp.firestore();

  try {
    // 1. Clonar Usuarios (Límite 500)
    const usersCol = 'usuarios';
    const usersSnapshot = await prodDb.collection(usersCol).limit(500).get();
    
    if (usersSnapshot.empty) {
      console.log('⚠️ No se encontraron usuarios en producción.');
    } else {
      const batch = emuDb.batch();
      usersSnapshot.forEach(doc => batch.set(emuDb.collection(usersCol).doc(doc.id), doc.data()));
      await batch.commit();
      console.log(`✅ Clonados ${usersSnapshot.size} usuarios exitosamente.`);
    }

    // 2. Clonar Grados (Sin límite, suele ser pequeña)
    console.log('📚 Iniciando clonación de GRADOS...');
    const gradesCol = 'grados';
    const gradesSnapshot = await prodDb.collection(gradesCol).get();

    if (gradesSnapshot.empty) {
      console.log('⚠️ No se encontraron grados en producción.');
    } else {
      const batch = emuDb.batch();
      gradesSnapshot.forEach(doc => batch.set(emuDb.collection(gradesCol).doc(doc.id), doc.data()));
      await batch.commit();
      console.log(`✅ Clonados ${gradesSnapshot.size} grados exitosamente.`);
    }

    // 3. Clonar Característica Curricular (Sin límite)
    console.log('📝 Iniciando clonación de CARACTERISTICA-CURRICULAR...');
    const curricularCol = 'caracteristica-curricular';
    const curricularSnapshot = await prodDb.collection(curricularCol).get();

    if (curricularSnapshot.empty) {
      console.log('⚠️ No se encontraron características curriculares en producción.');
    } else {
      const batch = emuDb.batch();
      curricularSnapshot.forEach(doc => batch.set(emuDb.collection(curricularCol).doc(doc.id), doc.data()));
      await batch.commit();
      console.log(`✅ Clonadas ${curricularSnapshot.size} características curriculares exitosamente.`);
    }

    // 4. Clonar Región (Sin límite)
    console.log('🌍 Iniciando clonación de REGION...');
    const regionCol = 'region';
    const regionSnapshot = await prodDb.collection(regionCol).get();

    if (regionSnapshot.empty) {
      console.log('⚠️ No se encontraron regiones en producción.');
    } else {
      const batch = emuDb.batch();
      regionSnapshot.forEach(doc => batch.set(emuDb.collection(regionCol).doc(doc.id), doc.data()));
      await batch.commit();
      console.log(`✅ Clonadas ${regionSnapshot.size} regiones exitosamente.`);
    }
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
  
  process.exit(0);
}

cloneUsers();
