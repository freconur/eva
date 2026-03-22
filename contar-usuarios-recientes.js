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
 * Función para contar usuarios con rol === 3 y actualizados recientemente.
 */
async function contarUsuariosRecientes() {
  // Definimos la fecha de corte (15 de marzo de 2026)
  // Nota: Meses en JS van de 0 a 11 (Marzo es 2)
  const fechaFiltro = new Date(2026, 2, 15); 
  
  console.log(`🚀 Iniciando script de conteo por fecha...`);
  console.log(`🔍 Filtrando: rol === 3 Y ultimaActualizacion >= ${fechaFiltro.toDateString()}`);
  
  try {
    const snapshot = await db.collection('usuarios')
      .where('rol', '==', 3)
      .where('ultimaActualizacion', '>=', fechaFiltro)
      .count()
      .get();
      
    const total = snapshot.data().count;
    
    console.log(`✅ Resultado: Se encontraron ${total} usuarios que cumplen ambas condiciones.`);
    return total;
  } catch (error) {
    console.error("❌ Error en la consulta de Firestore:", error);
    if (error.message.includes("FAILED_PRECONDITION")) {
      console.log("⚠️ Nota: Es posible que necesites crear un índice compuesto en la consola de Firebase.");
    }
  } finally {
    process.exit(0);
  }
}

// Ejecución
contarUsuariosRecientes();
