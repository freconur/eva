const admin = require('firebase-admin');
const serviceAccount = require('../eva-ugel.json');

if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount)
  });
}

const db = admin.firestore();

async function countDirectores() {
  console.log('--- Contando directores en la colección /usuarios ---');
  const snapshot = await db.collection('usuarios').where('rol', '==', 2).get();
  
  console.log(`Total de directores con rol === 2: ${snapshot.size}`);

  let sinNivel = 0;
  let soloInicial = 0;
  let soloPrimaria = 0;
  let soloSecundaria = 0;
  let multinivel = 0;

  snapshot.forEach(doc => {
    const data = doc.data();
    const niveles = data.nivelDeInstitucion;
    if (!niveles || !Array.isArray(niveles) || niveles.length === 0) {
      sinNivel++;
    } else if (niveles.length > 1) {
      multinivel++;
    } else if (niveles.includes(0)) {
      soloInicial++;
    } else if (niveles.includes(1)) {
      soloPrimaria++;
    } else if (niveles.includes(2)) {
      soloSecundaria++;
    }
  });

  console.log('\n📊 Desglose por Nivel de Institución:');
  console.log(`  - Solo Inicial (0): ${soloInicial}`);
  console.log(`  - Solo Primaria (1): ${soloPrimaria}`);
  console.log(`  - Solo Secundaria (2): ${soloSecundaria}`);
  console.log(`  - Multinivel (e.g. [1, 2]): ${multinivel}`);
  console.log(`  - Sin nivel configurado: ${sinNivel}`);

  process.exit(0);
}

countDirectores().catch(err => {
  console.error('Error:', err);
  process.exit(1);
});
