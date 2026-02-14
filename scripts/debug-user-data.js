const admin = require('firebase-admin');
const serviceAccount = require('./eva-ugel.json');

process.env.FIRESTORE_EMULATOR_HOST = 'localhost:8080';

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  projectId: 'evaluaciones-ugel' 
});

const db = admin.firestore();

// DNI shown in the screenshot: 22200011
const targetDNI = '22200011';

async function verifyUserData() {
  console.log(`🔍 Verificando datos para el usuario: ${targetDNI}`);
  const docRef = db.collection('usuarios').doc(targetDNI);
  const doc = await docRef.get();

  if (!doc.exists) {
    console.log('❌ El documento no existe.');
  } else {
    const data = doc.data();
    console.log('✅ Datos encontrados:');
    console.log('-------------------------------------------');
    console.log('Nombres:', data.nombres);
    console.log('Apellidos:', data.apellidos);
    console.log('nivelDeInstitucion (raw):', data.nivelDeInstitucion);
    console.log('Tipo de nivelDeInstitucion:', Array.isArray(data.nivelDeInstitucion) ? 'Array' : typeof data.nivelDeInstitucion);
    if (Array.isArray(data.nivelDeInstitucion)) {
      console.log('Elementos del array:', data.nivelDeInstitucion.map(item => `${item} (type: ${typeof item})`));
    }
    console.log('-------------------------------------------');
  }
}

verifyUserData();
