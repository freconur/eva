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
 * Filtra usuarios candidatos y realiza comparación local dniDirector === dni.
 * Genera una lista de DNIs y el conteo total.
 */
async function filtrarYListarFinal() {
  // Mantendremos el filtro de Fecha del 15 de marzo de 2026
  const fechaFiltro = new Date(2026, 2, 15);
  
  console.log("🚀 Iniciando reporte final con filtrado por flujo (Stream)...");
  console.log(`🔍 Candidatos: rol === 3 Y ultimaActualizacion >= ${fechaFiltro.toDateString()}`);
  
  try {
    // Usamos .stream() para no saturar la memoria RAM
    const stream = db.collection('usuarios')
      .where('rol', '==', 3)
      .where('ultimaActualizacion', '>=', fechaFiltro)
      .stream();
    
    const dnisEncontrados = [];
    let procesados = 0;

    stream.on('data', (doc) => {
      procesados++;
      const data = doc.data();
      
      // Condición de igualdad de campos en el mismo documento
      if (data.dniDirector && data.dni && data.dniDirector === data.dni) {
        dnisEncontrados.push(data.dni);
      }
      
      // Log cada 500 para saber que sigue trabajando
      if (procesados % 500 === 0) {
        console.log(`⏳ Procesados: ${procesados} documentos...`);
      }
    });

    stream.on('end', () => {
      console.log("\n✅ --- REPORTE FINAL ---");
      console.log(`Documentos candidatos analizados: ${procesados}`);
      console.log(`Documentos que cumplen 'dniDirector === dni': ${dnisEncontrados.length}`);
      console.log("\nLista de DNIs hallados:");
      console.log(JSON.stringify(dnisEncontrados, null, 2));
      
      console.log("\nProceso finalizado con éxito.");
      process.exit(0);
    });

    stream.on('error', (error) => {
      console.error("❌ Error durante el flujo de datos:", error);
      process.exit(1);
    });
    
  } catch (error) {
    console.error("❌ Error al iniciar la consulta:", error);
    process.exit(1);
  }
}

// Ejecución
filtrarYListarFinal();
