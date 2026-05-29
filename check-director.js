const admin = require('firebase-admin');
const serviceAccount = require('./eva-ugel.json');

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

const db = admin.firestore();

async function check() {
  const query = db.collection('usuarios').where('dni', '==', '11111111');
  const snap = await query.get();
  if (!snap.empty) {
    snap.forEach(doc => {
      console.log(`Document ID (UID): ${doc.id}`);
      console.log(JSON.stringify(doc.data(), null, 2));
    });
  } else {
    console.log("Director not found in production by DNI 11111111");
  }
}

check();
