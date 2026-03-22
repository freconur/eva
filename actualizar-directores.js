const admin = require('firebase-admin');
const serviceAccount = require("./eva-ugel.json");
// Importamos la lista de directores desde el archivo ya formateado
const { directoresFixed } = require("./directores.ts"); 

// Inicializa Firebase Admin
if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount)
  });
}

const db = admin.firestore();

/**
 * Realiza una actualización masiva (batch) para cambiar el rol a 2 (Director).
 */
async function actualizarRolesADirector() {
  console.log(`🚀 Iniciando actualización masiva de ${directoresFixed.length} usuarios...`);
  
  // WriteBatch permite hasta 500 operaciones por lote. 
  // Como tenemos 138, entra todo en un solo batch.
  const batch = db.batch();
  const usuariosRef = db.collection('usuarios');

  directoresFixed.forEach((dni) => {
    // Referenciamos el documento por su ID (DNI)
    const docRef = usuariosRef.doc(dni);
    
    // Agregamos la actualización al batch incluyendo el objeto perfil
    batch.update(docRef, { 
      rol: 2,
      perfil: {
        nombre: "director",
        rol: 2
      }
    });
  });

  try {
    console.log("⏳ Enviando lote de actualizaciones a Firestore...");
    await batch.commit();
    console.log(`✅ ¡Éxito! Se han actualizado ${directoresFixed.length} usuarios con rol: 2.`);
  } catch (error) {
    console.error("❌ Error al ejecutar el batch update:", error);
  } finally {
    process.exit(0);
  }
}

// Ejecutar proceso
actualizarRolesADirector();
