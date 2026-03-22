console.log("🚀 Iniciando script de conteo por rol...");
const admin = require('firebase-admin');
const serviceAccount = require("./eva-ugel.json");

// Inicializa Firebase Admin
if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount)
  });
}

const db = admin.firestore();

/**
 * Función para contar usuarios con rol === 3 (Docentes).
 */
async function contarUsuariosRol3() {
  console.log("🔍 Consultando usuarios con rol === 3...");
  
  try {
    // Filtro por campo numérico 'rol'
    const snapshot = await db.collection('usuarios')
      .where('rol', '==', 3)
      .count()
      .get();
      
    const total = snapshot.data().count;
    
    console.log(`✅ Resultado: Se encontraron ${total} usuarios con rol 3.`);
    return total;
  } catch (error) {
    console.error("❌ Error en la consulta de Firestore:", error);
  } finally {
    process.exit(0);
  }
}

// Ejecución
contarUsuariosRol3();
