console.log("Cargando módulos...");
const admin = require("firebase-admin");
console.log("Módulos cargados.");


// PASO 1: Importa tus credenciales de servicio JSON
// Recuerda colocar el archivo en la misma ruta o ajustar el path
const serviceAccount = require("./eva-ugel.json");

// Inicializa la app de Firebase
try {
  console.log("Inicializando Firebase Admin...");
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount)
  });
  console.log("Firebase Admin inicializado correctamente.");
} catch (initError) {
  console.error("Error al inicializar Firebase Admin:", initError);
  process.exit(1);
}


const db = admin.firestore();

async function buscarEvaluaciones() {
  try {
    console.log("Iniciando búsqueda de evaluaciones...");
    
    // PASO 2: Referencia y consulta usando array-contains
    const snapshot = await db.collection("evaluaciones")
      .where("usuariosConPermisos", "array-contains", "01296917")
      .get();
      
    if (snapshot.empty) {
      console.log("No se encontraron documentos donde el array contenga el usuario '01296917'.");
      return;
    }
    
    // PASO 3: Recorrer e imprimir los resultados
    const resultados = [];
    
    snapshot.forEach(doc => {
      console.log(`\n====== Documento ID: ${doc.id} ======`);
      console.log(doc.data()); // Muestra toda la data en la consola
      
      resultados.push({
        id: doc.id,
        ...doc.data()
      });
    });
    
    console.log(`\n--> Búsqueda finalizada. Documentos encontrados: ${resultados.length}`);

  } catch (error) {
    console.error("Error al ejecutar la consulta:", error);
  }
}

// Ejecutar la función
buscarEvaluaciones();
