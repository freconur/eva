const admin = require('firebase-admin');
const serviceAccount = require('../eva-ugel.json');

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

const db = admin.firestore();

const especialidades = [
  { id: 1, categoria: 'lee' },
  { id: 2, categoria: 'resuelve problemas' },
  { id: 3, categoria: 'Comunicación-Secundaria' },
  { id: 4, categoria: 'Matemática-Secundaria' },
  { id: 5, categoria: 'Ciencia y Tecnología-Secundaria' },
  { id: 6, categoria: 'DPCC-Secundaria' },
  { id: 7, categoria: 'Ciencias Sociales-Secundaria' },
  { id: 8, categoria: 'Personal Social' },
  { id: 9, categoria: 'Ciencia y Tecnologia' },
];

async function migrate() {
  console.log('Starting migration of categories to Firestore...');
  const batch = db.batch();

  for (const esp of especialidades) {
    // Document ID matches the string version of the numeric ID to keep querying easy
    const docRef = db.collection('categorias').doc(esp.id.toString());
    batch.set(docRef, {
      id: esp.id,
      categoria: esp.categoria,
      activo: true
    });
  }

  await batch.commit();
  console.log('Categories successfully migrated to Firestore!');
}

migrate().catch(err => {
  console.error('Error during migration:', err);
  process.exit(1);
});
