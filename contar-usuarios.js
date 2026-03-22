console.log("Cargando módulos...");
const admin = require('firebase-admin');
const serviceAccount = require("./eva-ugel.json");
console.log("Módulos cargados.");

// Inicializa Firebase Admin
console.log("Inicializando Firebase Admin...");
try {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount)
  });
  console.log("Firebase Admin inicializado correctamente.");
} catch (error) {
  console.error("Error al inicializar:", error);
  process.exit(1);
}

const db = admin.firestore();

async function contarUsuariosPorDirector(dni) {
  console.log(`🔍 Iniciando consulta para DNI: ${dni}...`);
  try {
    const coll = db.collection('usuarios');
    const query = coll.where('dniDirector', '==', dni);
    
    console.log("Ejecutando count().get()...");
    const snapshot = await query.count().get();
    
    const total = snapshot.data().count;
    console.log(`✅ Resultado: Se encontraron ${total} usuarios.`);
    return total;
  } catch (error) {
    console.error("❌ Error en la consulta:", error);
  } finally {
    console.log("Cerrando proceso.");
    process.exit(0);
  }
}

// Configuración de prueba
const dniPrueba = '01296917'; 
contarUsuariosPorDirector(dniPrueba);
