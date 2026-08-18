const admin = require('firebase-admin');
const path = require('path');
const fs = require('fs');

// =========================================================================
// PARÁMETROS CONFIGURABLES (Modifica estos valores según tu necesidad)
// =========================================================================
const AÑO = "2026";           // Año del examen (ej. "2026" o 2026)
const MES = "6";              // Mes del examen (ej. "6" o 6)
const GRADO = 4;              // Grado del examen (ej. 4 o "4")
const DNI_DOCENTE = "41380558";       // DNI del docente a consultar (ej. "12345678")
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

async function buscarEvaluacionesYDocente() {
  console.log("\n=======================================================");
  console.log("🔍 INICIANDO BÚSQUEDA DE EVALUACIONES Y DOCENTE");
  console.log("=======================================================");
  console.log(`📌 Filtros configurados:`);
  console.log(`   - Año (AÑO):          "${AÑO}"`);
  console.log(`   - Mes (MES):          "${MES}"`);
  console.log(`   - Grado (GRADO):      ${GRADO}`);
  console.log(`   - DNI Docente:        "${DNI_DOCENTE || '(NO ESPECIFICADO - Se mostrarán todas las evaluaciones)'}"`);
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

    let totalEvaluacionesConDocente = 0;
    let totalEstudiantesEvaluadosPorDocente = 0;
    const targetDniStr = String(DNI_DOCENTE).trim();

    // 3. Iterar cada evaluación para consultar la subcolección estudiantes-evaluados/AÑO/MES
    for (const ev of evaluacionesFiltradas) {
      const subcollectionPath = `/evaluaciones/${ev.id}/estudiantes-evaluados/${targetAnoStr}/${targetMesStr}`;
      const subcolRef = db.collection(subcollectionPath);
      const subcolSnap = await subcolRef.get();

      console.log(`📋 Evaluación: "${ev.nombre}" (ID: ${ev.id})`);
      console.log(`   Path subcolección: ${subcollectionPath}`);
      console.log(`   Total global de estudiantes en esta subcolección: ${subcolSnap.size}`);

      if (!targetDniStr) {
        console.log(`   ℹ️ (No se especificó DNI_DOCENTE para filtrar docentes individuales)`);
        console.log("");
        continue;
      }

      // Filtrar estudiantes evaluados por el docente (comparación tolerante a string/number)
      const estudiantesDocente = [];
      subcolSnap.forEach(doc => {
        const studentData = doc.data();
        const docDniDocente = String(studentData.dniDocente || '').trim();
        if (docDniDocente === targetDniStr) {
          estudiantesDocente.push({
            id: doc.id,
            ...studentData
          });
        }
      });

      if (estudiantesDocente.length > 0) {
        totalEvaluacionesConDocente++;
        totalEstudiantesEvaluadosPorDocente += estudiantesDocente.length;

        const muestraEstudiante = estudiantesDocente[0];
        console.log(`   ✅ ¡DOCENTE ENCONTRADO! El docente DNI "${targetDniStr}" TIENE ${estudiantesDocente.length} estudiante(s) evaluado(s) en esta prueba.`);
        console.log(`      - Institución: ${muestraEstudiante.institucion || 'N/A'}`);
        console.log(`      - Sección:     ${muestraEstudiante.seccion || 'N/A'}`);
        console.log(`      - Muestra:     Estudiante "${muestraEstudiante.nombresApellidos || muestraEstudiante.dni || 'Sin nombre'}" (Puntaje: ${muestraEstudiante.puntaje || muestraEstudiante.respuestasCorrectas || 0})`);
      } else {
        console.log(`   ❌ El docente DNI "${targetDniStr}" NO tiene registros de estudiantes evaluados en esta prueba.`);
      }
      console.log("");
    }

    // 4. Resumen final
    console.log("=======================================================");
    console.log("📊 RESUMEN FINAL DE BÚSQUEDA");
    console.log("=======================================================");
    console.log(`- Evaluaciones encontradas (Filtros AÑO/MES/GRADO): ${evaluacionesFiltradas.length}`);
    if (targetDniStr) {
      console.log(`- Docente DNI Consultado:                           "${targetDniStr}"`);
      console.log(`- Evaluaciones en las que participó el docente:    ${totalEvaluacionesConDocente} de ${evaluacionesFiltradas.length}`);
      console.log(`- Total de estudiantes evaluados por el docente:    ${totalEstudiantesEvaluadosPorDocente}`);
      if (totalEvaluacionesConDocente > 0) {
        console.log(`\n🎉 RESULTADO: El docente DNI "${targetDniStr}" SÍ tiene evaluaciones registradas en las pruebas encontradas.`);
      } else {
        console.log(`\n⚠️ RESULTADO: El docente DNI "${targetDniStr}" NO tiene evaluaciones registradas en ninguna de las pruebas de los filtros dados.`);
      }
    } else {
      console.log(`\n💡 Sugerencia: Especifica una constante DNI_DOCENTE al inicio del script para verificar si un docente específico participó.`);
    }
    console.log("=======================================================\n");

  } catch (error) {
    console.error("❌ Ocurrió un error al realizar las consultas:", error);
  } finally {
    process.exit(0);
  }
}

buscarEvaluacionesYDocente();
