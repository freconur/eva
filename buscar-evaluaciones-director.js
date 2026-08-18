const admin = require('firebase-admin');
const path = require('path');
const fs = require('fs');

// =========================================================================
// PARÁMETROS CONFIGURABLES (Modifica estos valores según tu necesidad)
// =========================================================================
const AÑO = "2026";           // Año del examen (ej. "2026" o 2026)
const MES = "6";              // Mes del examen (ej. "6" o 6)
const GRADO = 3;              // Grado del examen (ej. 4 o "4")
const DNI_DIRECTOR = "01514252";      // DNI del director a consultar (ej. "11111111")
// =========================================================================

// Inicialización de Firebase Admin
const serviceAccountPath = path.join(__dirname, 'eva-ugel.json');
if (!fs.existsSync(serviceAccountPath)) {
  console.error("❌ Error: No se encontró el archivo de credenciales 'eva-ugel.json'.");
  process.exit(1);
}

const serviceAccount = require(serviceAccountPath);

try {
  if (!admin.apps.length) {
    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount)
    });
  }
} catch (error) {
  console.error("❌ Error al inicializar Firebase Admin:", error.message);
  process.exit(1);
}

const db = admin.firestore();

async function buscarEvaluacionesYDirector() {
  console.log("\n=======================================================");
  console.log("🔍 INICIANDO BÚSQUEDA DE EVALUACIONES Y DIRECTOR");
  console.log("=======================================================");
  console.log(`📌 Filtros configurados:`);
  console.log(`   - Año (AÑO):          "${AÑO}"`);
  console.log(`   - Mes (MES):          "${MES}"`);
  console.log(`   - Grado (GRADO):      ${GRADO}`);
  console.log(`   - DNI Director:       "${DNI_DIRECTOR || '(NO ESPECIFICADO - Se mostrarán todas las evaluaciones)'}"`);
  console.log("=======================================================\n");

  try {
    // 1. Obtener todas las evaluaciones
    console.log("⏳ Obteniendo colección 'evaluaciones'...");
    const evalSnapshot = await db.collection('evaluaciones').get();

    if (evalSnapshot.empty) {
      console.log("⚠️ No se encontraron documentos en la colección 'evaluaciones'.");
      return;
    }

    const targetAnoStr = String(AÑO).trim();
    const targetMesStr = String(MES).trim();
    const targetGradoStr = String(GRADO).trim();

    // 2. Filtrar evaluaciones por AÑO, MES y GRADO (tolerante a tipos string/number)
    const evaluacionesFiltradas = [];
    evalSnapshot.forEach(doc => {
      const data = doc.data();
      const docAno = String(data.añoDelExamen || '').trim();
      const docMes = String(data.mesDelExamen || '').trim();
      const docGrado = String(data.grado !== undefined ? data.grado : '').trim();

      if (docAno === targetAnoStr && docMes === targetMesStr && docGrado === targetGradoStr) {
        evaluacionesFiltradas.push({
          id: doc.id,
          nombre: data.nombre || data.name || 'Sin nombre',
          grado: data.grado,
          añoDelExamen: data.añoDelExamen,
          mesDelExamen: data.mesDelExamen,
          tipoDeEvaluacion: data.tipoDeEvaluacion || data.tipoEvaluacion || 'N/A',
          active: data.active
        });
      }
    });

    console.log(`✅ Se encontraron ${evaluacionesFiltradas.length} evaluación(es) que coinciden con AÑO=${targetAnoStr}, MES=${targetMesStr}, GRADO=${targetGradoStr}:\n`);

    if (evaluacionesFiltradas.length === 0) {
      console.log("⚠️ Ninguna evaluación coincide exactamente con los filtros especificados.");
      return;
    }

    // Mostrar lista de evaluaciones encontradas
    evaluacionesFiltradas.forEach((ev, idx) => {
      console.log(`  ${idx + 1}. [ID: ${ev.id}] - ${ev.nombre} (Grado: ${ev.grado}, Estado: ${ev.active ? 'Activa' : 'Inactiva'})`);
    });
    console.log("\n-------------------------------------------------------");
    console.log(`🔎 CONSULTANDO SUBCOLECCIONES: /evaluaciones/{IdEvaluacion}/estudiantes-evaluados/${targetAnoStr}/${targetMesStr}`);
    console.log("-------------------------------------------------------\n");

    let totalEvaluacionesConDirector = 0;
    let totalEstudiantesEvaluadosPorDirector = 0;
    const targetDniStr = String(DNI_DIRECTOR).trim();

    // 3. Iterar cada evaluación para consultar la subcolección estudiantes-evaluados/AÑO/MES
    for (const ev of evaluacionesFiltradas) {
      const subcollectionPath = `/evaluaciones/${ev.id}/estudiantes-evaluados/${targetAnoStr}/${targetMesStr}`;
      const subcolRef = db.collection(subcollectionPath);
      const subcolSnap = await subcolRef.get();

      console.log(`📋 Evaluación: "${ev.nombre}" (ID: ${ev.id})`);
      console.log(`   Path subcolección: ${subcollectionPath}`);
      console.log(`   Total global de estudiantes en esta subcolección: ${subcolSnap.size}`);

      if (!targetDniStr) {
        console.log(`   ℹ️ (No se especificó DNI_DIRECTOR para filtrar directores individuales)`);
        console.log("");
        continue;
      }

      // Filtrar estudiantes pertenecientes al colegio/director (comparación tolerante a string/number)
      const estudiantesDirector = [];
      subcolSnap.forEach(doc => {
        const studentData = doc.data();
        const docDniDirector = String(studentData.dniDirector || '').trim();
        if (docDniDirector === targetDniStr) {
          estudiantesDirector.push({
            id: doc.id,
            ...studentData
          });
        }
      });

      if (estudiantesDirector.length > 0) {
        totalEvaluacionesConDirector++;
        totalEstudiantesEvaluadosPorDirector += estudiantesDirector.length;

        const muestraEstudiante = estudiantesDirector[0];
        console.log(`   ✅ ¡DIRECTOR ENCONTRADO! El director DNI "${targetDniStr}" TIENE ${estudiantesDirector.length} estudiante(s) evaluado(s) en su institución.`);
        console.log(`      - Institución: ${muestraEstudiante.institucion || 'N/A'}`);
        console.log(`      - Sección:     ${muestraEstudiante.seccion || 'N/A'}`);
        console.log(`      - Docente:     DNI "${muestraEstudiante.dniDocente || 'N/A'}"`);
        console.log(`      - Muestra:     Estudiante "${muestraEstudiante.nombresApellidos || muestraEstudiante.dni || 'Sin nombre'}" (Puntaje: ${muestraEstudiante.puntaje || muestraEstudiante.respuestasCorrectas || 0})`);
      } else {
        console.log(`   ❌ El director DNI "${targetDniStr}" NO tiene registros de estudiantes evaluados en esta prueba.`);
      }
      console.log("");
    }

    // 4. Resumen final
    console.log("=======================================================");
    console.log("📊 RESUMEN FINAL DE BÚSQUEDA");
    console.log("=======================================================");
    console.log(`- Evaluaciones encontradas (Filtros AÑO/MES/GRADO): ${evaluacionesFiltradas.length}`);
    if (targetDniStr) {
      console.log(`- Director DNI Consultado:                          "${targetDniStr}"`);
      console.log(`- Evaluaciones en las que participó el director:   ${totalEvaluacionesConDirector} de ${evaluacionesFiltradas.length}`);
      console.log(`- Total de estudiantes evaluados en su institución: ${totalEstudiantesEvaluadosPorDirector}`);
      if (totalEvaluacionesConDirector > 0) {
        console.log(`\n🎉 RESULTADO: El director DNI "${targetDniStr}" SÍ registra evaluaciones hechas en su institución en las pruebas encontradas.`);
      } else {
        console.log(`\n⚠️ RESULTADO: El director DNI "${targetDniStr}" NO tiene evaluaciones registradas en ninguna de las pruebas de los filtros dados.`);
      }
    } else {
      console.log(`\n💡 Sugerencia: Especifica una constante DNI_DIRECTOR al inicio del script para verificar si un director específico participó.`);
    }
    console.log("=======================================================\n");

  } catch (error) {
    console.error("❌ Ocurrió un error al realizar las consultas:", error);
  } finally {
    process.exit(0);
  }
}

buscarEvaluacionesYDirector();
