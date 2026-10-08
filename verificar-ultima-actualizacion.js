const admin = require('firebase-admin');
const path = require('path');
const fs = require('fs');

// =========================================================================
// PARÁMETROS CONFIGURABLES
// =========================================================================

// 1. Coloca aquí los IDs de las evaluaciones que deseas consultar:
const EVALUACIONES_IDS = [
  'CPezmqMkuP3ltwqv4sOC',
  'VJsHgAJEWCwLJ4tZtq2h',
  '2mdtmKI4xquimBSTaGMe',
  'mMpJKnswFC3YdifhjdnI',
  'k2XH0tSditRkvSZ7Vn7m',
  'AR0UBtIlU1ZRLzVjvlcb',
  'XCH9Pn836i7JrGQoXDFI',
  'lblmQ9BOLpRq6gvtEem2',
  'c0G65cNiYTeOAND63oPI',
  '77M91Lt7mlJrVNzeL6hN',
  'd5U7UqMHIT0nd3WXfO75',
  'evgRfHCELqggo9NZHh6H'
  // Agrega aquí más IDs separados por comas, por ejemplo:
  // 'mMpJKnswFC3YdifhjdnI',
  // '2mdtmKI4xquimBSTaGMe',
];

// 2. Parámetros de la subcolección:
// Ruta generada: /evaluaciones/{idEvaluacion}/estudiantes-evaluados/{AÑO}/{PERIODO}
const AÑO = '2026';
const PERIODO = '2';

// 3. Fecha de corte: posterior al 4 de octubre de 2026 (Hora Perú / UTC-5)
const FECHA_CORTE_STR = '2026-10-04T00:00:00-05:00';
const FECHA_CORTE = new Date(FECHA_CORTE_STR);

// =========================================================================

// Cargar credenciales de servicio
const serviceAccountPath = path.join(__dirname, 'eva-ugel.json');
if (!fs.existsSync(serviceAccountPath)) {
  console.error("❌ Error: No se encontró el archivo 'eva-ugel.json'.");
  process.exit(1);
}

const serviceAccount = require(serviceAccountPath);

if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount)
  });
}

const db = admin.firestore();

// Caché en memoria para evitar consultas duplicadas a Firestore
const cacheDocentes = new Map();
const cacheEvaluaciones = new Map();

// Formateador para zona horaria de Perú
function formatearFechaLocal(date) {
  return date.toLocaleString('es-PE', {
    timeZone: 'America/Lima',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false
  });
}

// Obtener nombre de la evaluación (con caché)
async function obtenerNombreEvaluacion(evalId) {
  if (cacheEvaluaciones.has(evalId)) {
    return cacheEvaluaciones.get(evalId);
  }
  try {
    const evalDoc = await db.doc(`evaluaciones/${evalId}`).get();
    if (evalDoc.exists) {
      const data = evalDoc.data();
      const nombre = data.nombre || data.titulo || evalId;
      cacheEvaluaciones.set(evalId, nombre);
      return nombre;
    }
  } catch (e) {
    console.error(`⚠️ Error al obtener nombre de evaluación ${evalId}:`, e.message);
  }
  cacheEvaluaciones.set(evalId, evalId);
  return evalId;
}

// Obtener nombre completo del docente por DNI (con caché)
async function obtenerNombreDocente(dniDocente) {
  if (!dniDocente) return 'No registrado';
  const dniLimpio = String(dniDocente).trim();
  if (cacheDocentes.has(dniLimpio)) {
    return cacheDocentes.get(dniLimpio);
  }
  try {
    const docDocente = await db.doc(`usuarios/${dniLimpio}`).get();
    if (docDocente.exists) {
      const uData = docDocente.data();
      const nombresCompletos = [uData.nombres, uData.apellidos].filter(Boolean).join(' ')
        || uData.nombresApellidos
        || dniLimpio;
      cacheDocentes.set(dniLimpio, nombresCompletos);
      return nombresCompletos;
    }
  } catch (e) {
    console.error(`⚠️ Error al obtener docente ${dniLimpio}:`, e.message);
  }
  const fallback = `DNI ${dniLimpio}`;
  cacheDocentes.set(dniLimpio, fallback);
  return fallback;
}

async function buscarEnEvaluaciones() {
  console.log(`\n===========================================================================================================`);
  console.log(`🔍 BÚSQUEDA MULTI-EVALUACIÓN POR 'ultimaActualizacion'`);
  console.log(`📅 Fecha mínima de corte: ${formatearFechaLocal(FECHA_CORTE)} (Hora Perú / UTC-5)`);
  console.log(`   (ISO: ${FECHA_CORTE.toISOString()})`);
  console.log(`📂 Subcolección: estudiantes-evaluados/${AÑO}/${PERIODO}`);
  console.log(`📋 Total de evaluaciones a revisar: ${EVALUACIONES_IDS.length}`);
  console.log(`===========================================================================================================\n`);

  const timestampCorte = admin.firestore.Timestamp.fromDate(FECHA_CORTE);
  const resultadosTotales = [];

  for (let i = 0; i < EVALUACIONES_IDS.length; i++) {
    const evalId = EVALUACIONES_IDS[i];
    const rutaColeccion = `evaluaciones/${evalId}/estudiantes-evaluados/${AÑO}/${PERIODO}`;

    console.log(`[${i + 1}/${EVALUACIONES_IDS.length}] Consultando: ${rutaColeccion}...`);

    try {
      // 1. Obtener nombre de la evaluación
      const nombreEvaluacion = await obtenerNombreEvaluacion(evalId);

      // 2. Consultar solo los documentos con fecha >= corte
      // Seleccionamos exclusivamente los campos solicitados para máxima eficiencia
      const colRef = db.collection(rutaColeccion);
      const snapshot = await colRef
        .where('ultimaActualizacion', '>=', timestampCorte)
        .orderBy('ultimaActualizacion', 'desc')
        .select('ultimaActualizacion', 'nombresApellidos', 'dniDocente', 'dniDirector', 'dni')
        .get();

      if (snapshot.empty) {
        console.log(`    ↳ Evaluacion: "${nombreEvaluacion}"`);
        console.log(`    ↳ ⚠️ Sin registros posteriores al 04/10/2026.\n`);
        continue;
      }

      console.log(`    ↳ Evaluacion: "${nombreEvaluacion}"`);
      console.log(`    ↳ ✅ Se encontraron ${snapshot.size} documento(s) actualizado(s). Obteniendo datos de docentes...\n`);

      for (const doc of snapshot.docs) {
        const data = doc.data();
        const fecha = data.ultimaActualizacion?.toDate
          ? data.ultimaActualizacion.toDate()
          : new Date(data.ultimaActualizacion);

        const nombreEstudiante = data.nombresApellidos || 'No registrado';
        const dniDocente = data.dniDocente || '';
        const dniDirector = data.dniDirector || 'No registrado';
        const nombreDocente = await obtenerNombreDocente(dniDocente);

        resultadosTotales.push({
          nombreEvaluacion,
          evaluacionId: evalId,
          dniEstudiante: doc.id,
          nombreEstudiante,
          nombreDocente,
          dniDirector,
          fechaLocal: formatearFechaLocal(fecha),
          fechaIso: fecha.toISOString()
        });
      }

    } catch (error) {
      console.error(`    ↳ ❌ Error al procesar evaluación ${evalId}:`, error.message, `\n`);
    }
  }

  console.log(`\n===========================================================================================================`);
  console.log(`📊 RESUMEN FINAL`);
  console.log(`===========================================================================================================`);
  console.log(`Total de estudiantes encontrados con actualizaciones posteriores al 04/10/2026: ${resultadosTotales.length}\n`);

  if (resultadosTotales.length > 0) {
    console.log(`-------------------------------------------------------------------------------------------------------------------------------------------------------------------------`);
    console.log(`| #   | Evaluación                     | Estudiante (DNI - Nombre)                  | Docente                                    | DNI Director | Fecha Actualización (Perú) |`);
    console.log(`-------------------------------------------------------------------------------------------------------------------------------------------------------------------------`);
    resultadosTotales.forEach((res, idx) => {
      const num = String(idx + 1).padStart(3, ' ');
      const evaluacion = String(res.nombreEvaluacion).padEnd(30, ' ').slice(0, 30);
      const estudiante = String(`${res.dniEstudiante} - ${res.nombreEstudiante}`).padEnd(42, ' ').slice(0, 42);
      const docente = String(res.nombreDocente).padEnd(42, ' ').slice(0, 42);
      const director = String(res.dniDirector).padEnd(12, ' ').slice(0, 12);
      const fechaLoc = String(res.fechaLocal).padEnd(26, ' ');

      console.log(`| ${num} | ${evaluacion} | ${estudiante} | ${docente} | ${director} | ${fechaLoc} |`);
    });
    console.log(`-------------------------------------------------------------------------------------------------------------------------------------------------------------------------`);
  } else {
    console.log(`No se encontraron estudiantes actualizados posteriormente al 04/10/2026 en ninguna de las evaluaciones consultadas.`);
  }

  return resultadosTotales;
}

buscarEnEvaluaciones().then(() => {
  console.log(`\n🏁 Proceso finalizado.`);
  process.exit(0);
}).catch(err => {
  console.error("Error fatal:", err);
  process.exit(1);
});
