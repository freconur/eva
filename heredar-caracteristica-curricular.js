const admin = require('firebase-admin');

// 1. Inicialización de Firebase
if (process.env.FIRESTORE_EMULATOR_HOST) {
  admin.initializeApp({ projectId: 'eva-ugel' });
  console.log("📡 Conectado al emulador de Firestore en:", process.env.FIRESTORE_EMULATOR_HOST);
} else {
  try {
    const serviceAccount = require('./eva-ugel.json');
    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount)
    });
    console.log("✅ Conectado a Firestore en la nube mediante eva-ugel.json");
  } catch (err) {
    console.log("⚠️ No se pudo cargar eva-ugel.json. Intentando inicialización por defecto...");
    admin.initializeApp();
  }
}

const db = admin.firestore();

function esValorValido(val) {
  return val !== undefined && val !== null && val !== '';
}

async function ejecutarMigracion() {
  try {
    console.log("\n🚀 Iniciando actualización global de característica curricular y tipo de gestión...");
    console.log("🔍 Cargando todos los directores (rol: 2)...");
    
    // Obtener todos los directores seleccionando sólo los campos necesarios
    const directoresSnapshot = await db.collection('usuarios')
      .where('rol', '==', 2)
      .select('dni', 'caracteristicaCurricular', 'tipoGestion')
      .get();
      
    const mapaDirectores = {};
    directoresSnapshot.forEach(doc => {
      const data = doc.data();
      if (data.dni) {
        const dniKey = data.dni.toString().trim();
        mapaDirectores[dniKey] = {
          caracteristicaCurricular: data.caracteristicaCurricular,
          tipoGestion: data.tipoGestion
        };
      }
    });
    
    const totalDirectores = Object.keys(mapaDirectores).length;
    console.log(`✅ Directores cargados en memoria: ${totalDirectores}`);
    
    if (totalDirectores === 0) {
      console.log("⚠️ No se encontraron directores en la base de datos. Finalizando proceso.");
      process.exit(0);
    }
    
    console.log("🚀 Analizando docentes (rol: 3) mediante stream...");
    const stream = db.collection('usuarios')
      .where('rol', '==', 3)
      .stream();
      
    let totalProcesados = 0;
    let totalParaActualizar = 0;
    let totalActualizados = 0;
    
    let batch = db.batch();
    let batchCount = 0;
    const batchPromises = [];

    // Función auxiliar para enviar el lote
    const commitBatch = async (currentBatch, size) => {
      try {
        await currentBatch.commit();
        totalActualizados += size;
        console.log(`   📈 Lote de ${size} docentes actualizado con éxito.`);
      } catch (error) {
        console.error("   ❌ Error al procesar un lote:", error);
      }
    };

    stream.on('data', (doc) => {
      totalProcesados++;
      const data = doc.data();
      
      if (data.dniDirector) {
        const dniDirKey = data.dniDirector.toString().trim();
        const directorInfo = mapaDirectores[dniDirKey];
        
        if (directorInfo) {
          const updates = {};
          
          // Validar y heredar caracteristicaCurricular
          if (esValorValido(directorInfo.caracteristicaCurricular)) {
            if (data.caracteristicaCurricular !== directorInfo.caracteristicaCurricular) {
              updates.caracteristicaCurricular = directorInfo.caracteristicaCurricular;
            }
          }
          
          // Validar y heredar tipoGestion
          if (esValorValido(directorInfo.tipoGestion)) {
            if (data.tipoGestion !== directorInfo.tipoGestion) {
              updates.tipoGestion = directorInfo.tipoGestion;
            }
          }
          
          // Si hay campos que actualizar, los añadimos al lote
          if (Object.keys(updates).length > 0) {
            totalParaActualizar++;
            
            updates.ultimaActualizacion = admin.firestore.FieldValue.serverTimestamp();
            
            batch.update(doc.ref, updates);
            batchCount++;
            
            // Si el lote alcanza los 500 elementos, lo enviamos y creamos uno nuevo
            if (batchCount === 500) {
              console.log(`⏳ Lote lleno (500). Enviando actualizaciones...`);
              batchPromises.push(commitBatch(batch, batchCount));
              batch = db.batch();
              batchCount = 0;
            }
          }
        }
      }

      if (totalProcesados % 1000 === 0) {
        console.log(`   Procesados: ${totalProcesados} docentes...`);
      }
    });

    stream.on('end', async () => {
      // Enviar el último lote si tiene elementos pendientes
      if (batchCount > 0) {
        console.log(`⏳ Enviando último lote de ${batchCount} actualizaciones...`);
        batchPromises.push(commitBatch(batch, batchCount));
      }
      
      // Esperar a que todos los batches finalicen
      await Promise.all(batchPromises);
      
      console.log(`\n🏁 --- REPORTE DE EJECUCIÓN GLOBAL ---`);
      console.log(`👨‍🏫 Docentes totales analizados: ${totalProcesados}`);
      console.log(`🔄 Docentes que requerían actualización: ${totalParaActualizar}`);
      console.log(`✅ Docentes actualizados correctamente: ${totalActualizados}`);
      console.log("----------------------------------------\n");
      process.exit(0);
    });

    stream.on('error', (err) => {
      console.error("❌ Error durante el flujo de lectura:", err);
      process.exit(1);
    });

  } catch (error) {
    console.error("❌ Error general en la migración:", error);
    process.exit(1);
  }
}

ejecutarMigracion();
