console.log("🚀 Iniciando script de conteo total...");
const admin = require('firebase-admin');
const serviceAccount = require("./eva-ugel.json");
console.log("📦 Módulos y credenciales cargados.");
if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount)
  });
}

const db = admin.firestore();

/**
 * Función para contar el total de documentos en la colección /usuarios.
 * Utiliza la función count() para eficiencia máxima.
 */
async function contarTotalUsuarios() {
  console.log("🔍 Consultando el total de usuarios en la colección /usuarios...");
  
  try {
    // Referencia a la colección y ejecución del conteo de agregación
    const snapshot = await db.collection('usuarios').count().get();
    const total = snapshot.data().count;
    
    console.log(`✅ Éxito: Se encontraron ${total} documentos en total.`);
    return total;
  } catch (error) {
    console.error("❌ Error al obtener el conteo de Firestore:", error);
  } finally {
    // Finaliza el proceso si se ejecuta directamente
    process.exit(0);
  }
}

// Ejecución
contarTotalUsuarios();
