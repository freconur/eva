const admin = require('firebase-admin');
const serviceAccount = require('../eva-ugel.json');

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

const db = admin.firestore();

// Category mapping by levels:
// 0: Inicial, 1: Primaria, 2: Secundaria
const categoryNiveles = {
  1: [0, 1],    // lee (Inicial, Primaria)
  2: [0, 1],    // resuelve problemas (Inicial, Primaria)
  3: [2],       // Comunicación-Secundaria (Secundaria)
  4: [2],       // Matemática-Secundaria (Secundaria)
  5: [2],       // Ciencia y Tecnología-Secundaria (Secundaria)
  6: [2],       // DPCC-Secundaria (Secundaria)
  7: [2],       // Ciencias Sociales-Secundaria (Secundaria)
  8: [1],       // Personal Social (Primaria)
  9: [1],       // Ciencia y Tecnologia (Primaria)
  10: [0]       // prueba 5 años (Inicial)
};

async function migrate() {
  console.log('Starting migration to update categories with educational levels...');
  const batch = db.batch();

  for (const [idStr, niveles] of Object.entries(categoryNiveles)) {
    const docRef = db.collection('categorias').doc(idStr);
    
    // Check if the document exists before trying to update it
    const docSnap = await docRef.get();
    if (docSnap.exists) {
      console.log(`Setting levels ${JSON.stringify(niveles)} for category "${docSnap.data().categoria}" (ID ${idStr})`);
      batch.update(docRef, { niveles: niveles });
    } else {
      console.log(`Warning: Category with ID ${idStr} not found, skipping.`);
    }
  }

  await batch.commit();
  console.log('Categories successfully updated with levels array!');
}

migrate().catch(err => {
  console.error('Error during migration:', err);
  process.exit(1);
});
