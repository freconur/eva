/**
 * Import function triggers from their respective submodules:
 *
 * import {onCall} from "firebase-functions/v2/https";
 * import {onDocumentWritten} from "firebase-functions/v2/firestore";
 *
 * See a full list of supported triggers at https://firebase.google.com/docs/functions
 */
import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';
import { onCall } from 'firebase-functions/v2/https';

admin.initializeApp();
const db = admin.firestore();
// Import removido ya que no se usa en la versión optimizada
import {
  ErrorHandler,
  CacheManager,
  PerformanceMonitor,
  validarDNI,
  validarParametrosEntrada,
  manejarPromesa,
  calcularEstadisticasOptimizadas,
  calcularAcumuladoGlobal,
  formatearTiempo,
  calcularProgreso,
  generarTrackingId,
  limpiarParaFirestore,
} from './utils';

// Importar la función desde el archivo separado
import { crearEstudianteDeDocente } from './crearEstudianteDeDocente';
// Importar la nueva función para frontend
import { crearEstudianteDeDocenteFrontend } from './crearEstudianteDeDocenteFrontend';


// ==========================================================
// 2. FUNCIÓN DE LECTURA DE DOCUMENTOS (MODO DESARROLLO)
// ==========================================================

/**
 * Calcula el tiempo estimado de procesamiento basado en el número de directores
 * @param totalDirectores - Número total de directores a procesar
 * @param batchSize - Tamaño del lote de procesamiento paralelo
 * @returns Objeto con estimaciones de tiempo
 */
const calcularTiempoEstimado = (totalDirectores: number, batchSize: number = 30) => {
  // Tiempos base estimados (en millisegundos) basados en análisis empírico
  const TIEMPO_BASE_POR_LOTE = 2000; // 2 segundos base por lote de 30 directores
  const TIEMPO_POR_DIRECTOR_EN_LOTE = 150; // 150ms adicionales por director con datos
  const OVERHEAD_NETWORK = 500; // 500ms de overhead de red por lote
  const FACTOR_DOCENTES_PROMEDIO = 1.8; // Factor multiplicador por docentes promedio por director
  const FACTOR_EVALUACIONES_PROMEDIO = 1.5; // Factor multiplicador por evaluaciones promedio

  // Cálculos
  const totalLotes = Math.ceil(totalDirectores / batchSize);
  const directoresPorLote = Math.min(batchSize, totalDirectores);

  // Tiempo estimado por lote considerando paralelismo
  const tiempoPorLote =
    TIEMPO_BASE_POR_LOTE +
    directoresPorLote *
      TIEMPO_POR_DIRECTOR_EN_LOTE *
      FACTOR_DOCENTES_PROMEDIO *
      FACTOR_EVALUACIONES_PROMEDIO +
    OVERHEAD_NETWORK;

  // Tiempo total estimado
  const tiempoTotalMs = totalLotes * tiempoPorLote;
  const tiempoTotalSegundos = Math.round(tiempoTotalMs / 1000);
  const tiempoTotalMinutos = Math.round((tiempoTotalSegundos / 60) * 10) / 10; // Redondear a 1 decimal

  // Clasificación del tiempo
  let clasificacion = '';
  let recomendacion = '';

  if (tiempoTotalSegundos < 60) {
    clasificacion = 'RÁPIDO';
    recomendacion = 'Procesamiento rápido esperado';
  } else if (tiempoTotalSegundos < 180) {
    clasificacion = 'MODERADO';
    recomendacion = 'Tiempo de procesamiento moderado';
  } else if (tiempoTotalSegundos < 420) {
    clasificacion = 'LENTO';
    recomendacion = 'Procesamiento lento - considera optimización';
  } else {
    clasificacion = 'MUY LENTO';
    recomendacion = 'Tiempo crítico - puede exceder timeout de 8 minutos';
  }

  return {
    totalDirectores,
    totalLotes,
    directoresPorLote: Math.min(batchSize, totalDirectores),
    tiempoEstimadoMs: tiempoTotalMs,
    tiempoEstimadoSegundos: tiempoTotalSegundos,
    tiempoEstimadoMinutos: tiempoTotalMinutos,
    clasificacion,
    recomendacion,
    porcentajeDelTimeout: Math.round((tiempoTotalMs / 480000) * 100), // 480000ms = 8 minutos
    excederaTimeout: tiempoTotalMs > 480000,
    detalles: {
      tiempoPorLoteMs: Math.round(tiempoPorLote),
      tiempoPorLoteSegundos: Math.round(tiempoPorLote / 1000),
      factorParalelismo: `${batchSize} directores por lote`,
      velocidadProcesamiento: `${Math.round(
        totalDirectores / tiempoTotalMinutos
      )} directores/minuto`,
    },
  };
};

/**
 * Función Callable (invocable) para leer todos los documentos de la colección 'evaluaciones'.
 * VERSIÓN OPTIMIZADA: Con manejo avanzado de errores, caché, monitoreo de rendimiento y validaciones
 */
exports.leerEvaluacionesParaAdmin = onCall(
  {
    timeoutSeconds: 540, // 9 minutos
    memory: '8GiB',
    cpu: 4,
    cors: [
      'http://localhost:3000',
      'http://localhost:3001',
      'http://127.0.0.1:3000',
      'http://127.0.0.1:3001',
      'https://evaluaciones-ugel.firebaseapp.com',
      'https://evaluaciones-ugel.web.app',
      'https://eva-rouge-zeta.vercel.app',
      'https://*.vercel.app',
    ],
  },
  async (request) => {
    // Inicializar monitores y utilidades
    const trackingId = generarTrackingId();
    const errorHandler = ErrorHandler.getInstance();
    const cacheManager = new CacheManager();
    const performanceMonitor = new PerformanceMonitor();

    performanceMonitor.iniciar('funcion_completa');

    functions.logger.info(`🚀 INICIO de leerEvaluacionesParaAdmin - Tracking ID: ${trackingId}`);

    try {
      // Extraer y validar parámetros
      const { idEvaluacion, month, filtros, currentYear } = request.data;

      const validacion = validarParametrosEntrada({ idEvaluacion, month, currentYear, filtros });
      if (!validacion.valido) {
        errorHandler.registrarError(
          new Error(`Parámetros inválidos: ${validacion.errores.join(', ')}`),
          'validacion_parametros'
        );
        throw new functions.https.HttpsError(
          'invalid-argument',
          `Parámetros inválidos: ${validacion.errores.join(', ')}`
        );
      }

      functions.logger.info(`📥 Parámetros validados:`, {
        idEvaluacion,
        month,
        filtros,
        currentYear,
      });

      // Verificar autenticación
      const isEmulator =
        process.env.FUNCTIONS_EMULATOR === 'true' || process.env.NODE_ENV === 'development';
      functions.logger.info(`🔧 Modo emulador: ${isEmulator}`);

      if (!isEmulator) {
        if (!request.auth) {
          errorHandler.registrarError(new Error('Usuario no autenticado'), 'autenticacion');
          throw new functions.https.HttpsError(
            'unauthenticated',
            'El usuario debe estar autenticado para acceder a esta función.'
          );
        }

        if (!(request.auth.token?.role === 'admin')) {
          errorHandler.registrarError(
            new Error(`Usuario no es admin. Role: ${request.auth.token?.role}`),
            'autorizacion'
          );
          throw new functions.https.HttpsError(
            'permission-denied',
            'Solo los administradores tienen permiso para leer todas las evaluaciones.'
          );
        }
      }

      performanceMonitor.iniciar('obtener_directores');

      // Obtener directores con manejo de errores
      //aqui hace el get de los directores junto a ello todas sus validaciones correspondientes
      const directores = await manejarPromesa(obtenerDirectores(), 'obtener_directores', []);

      performanceMonitor.finalizar('obtener_directores');

      if (directores.length === 0) {
        functions.logger.warn('⚠️ No se encontraron directores para procesar');
        return {
          success: true,
          message: 'No se encontraron directores para procesar',
          data: {
            directores: [],
            resultados: [],
            acumuladoGlobal: [],
            valoresExtras: 0,
            estadisticas: {
              totalDirectores: 0,
              tiempoProcesamiento: { ms: 0, segundos: 0, minutos: 0 },
              estimacionPrevia: null,
            },
          },
          mode: isEmulator ? 'development' : 'production',
          trackingId,
        };
      }

      // Calcular estimación de tiempo
      const estimacionTiempo = calcularTiempoEstimado(directores.length);
      functions.logger.info(
        `⏱️ Estimación de tiempo: ${formatearTiempo(estimacionTiempo.tiempoEstimadoMs)} (${
          estimacionTiempo.clasificacion
        })`
      );

      performanceMonitor.iniciar('procesar_directores');

      // Procesar directores con todas las optimizaciones
      const { resultados: resultadosProcesamiento, acumuladoGlobal, valoresExtras } = await procesarDirectoresOptimizado(
        directores,
        idEvaluacion,
        currentYear,
        month,
        cacheManager,
        errorHandler,
        performanceMonitor
      );

      performanceMonitor.finalizar('procesar_directores');
      performanceMonitor.finalizar('funcion_completa');

      // Generar estadísticas finales
      const estadisticasFinales = generarEstadisticasFinales(
        resultadosProcesamiento,
        performanceMonitor,
        cacheManager,
        errorHandler,
        estimacionTiempo
      );

      // Guardar estadísticas globales en Firestore
      if (acumuladoGlobal && acumuladoGlobal.length > 0) {
        functions.logger.info(`✅ Valores extras: ${valoresExtras}`);
        console.log('valoresExtras',valoresExtras)
        try {
          await db
            .collection(`evaluaciones/${idEvaluacion}/estadisticas-graficos`)
            .doc(`${currentYear}-${month}`)
            .set({acumuladoGlobal});
          functions.logger.info(`✅ Estadísticas globales guardadas: ${acumuladoGlobal.length} preguntas`);
        } catch (error) {
          functions.logger.error('❌ Error al guardar estadísticas globales:', error);
          errorHandler.registrarError(error, 'guardar_estadisticas_globales');
        }
      } else {
        functions.logger.warn('⚠️ No hay datos de acumulado global para guardar');
      }
      functions.logger.info(`✅ PROCESAMIENTO COMPLETADO - Tracking ID: ${trackingId}`);
      /* functions.logger.info(performanceMonitor.generarReporte()); */
      
      // Mostrar acumulado global en los logs
      functions.logger.info(`🌍 ACUMULADO GLOBAL - ${acumuladoGlobal.length} preguntas:`, acumuladoGlobal);
      console.log('📊 ACUMULADO GLOBAL COMPLETO:', JSON.stringify(acumuladoGlobal, null, 2));

      return {
        success: true,
        message: `Procesamiento completado: ${resultadosProcesamiento.length} directores procesados`,
        data: {
          directores,
          resultados: resultadosProcesamiento,
          acumuladoGlobal,
          valoresExtras,
          estadisticas: estadisticasFinales,
        },
        mode: isEmulator ? 'development' : 'production',
        trackingId,
      };
    } catch (error: any) {
      performanceMonitor.finalizar('funcion_completa');
      errorHandler.registrarError(error, 'funcion_principal');

      functions.logger.error(
        `💥 Error en leerEvaluacionesParaAdmin - Tracking ID: ${trackingId}:`,
        error
      );

      throw new functions.https.HttpsError(
        'internal',
        'Error al procesar la solicitud de lectura.',
        error.message
      );
    }
  }
);

// ==========================================================
// FUNCIONES AUXILIARES OPTIMIZADAS
// ==========================================================

/**
 * Guarda la evaluación de un director sin docentes en la base de datos
 * Versión optimizada con validaciones mejoradas y manejo de errores
 */
async function guardarEvaluacionDirectorSinDocentes(
  dni: string,
  idEvaluacion: string,
  currentYear: number,
  month: number
): Promise<void> {
  try {
    // Validar parámetros de entrada
    if (!validarDNI(dni) || !idEvaluacion || !currentYear || !month) {
      throw new Error(
        `Parámetros inválidos: dni=${dni}, idEvaluacion=${idEvaluacion}, year=${currentYear}, month=${month}`
      );
    }

    // Obtener datos del director con validación
    const directorDoc = await db.collection('usuarios').doc(dni).get();

    if (!directorDoc.exists) {
      functions.logger.warn(`⚠️ Director ${dni} no encontrado en la base de datos`);
      return;
    }

    const directorData = directorDoc.data();
    if (!directorData) {
      functions.logger.warn(`⚠️ Datos del director ${dni} son null o undefined`);
      return;
    }

    // Preparar datos optimizados para Firestore
    const datosEvaluacion = {
      ...limpiarParaFirestore(directorData),
      reporteEstudiantes: [],
      /* fechaActualizacion: admin.firestore.FieldValue.serverTimestamp(), */
      estado: 'sin_docentes',
    };

    // Guardar en la base de datos
    await db
      .collection(`evaluaciones/${idEvaluacion}/${currentYear}-${month}`)
      .doc(dni)
      .set(datosEvaluacion);

    functions.logger.info(`✅ DIRECTOR SIN DOCENTES GUARDADO - DNI: ${dni}`);
  } catch (error) {
    functions.logger.error(
      `❌ Error al guardar evaluación de director sin docentes ${dni}:`,
      error
    );
    // No relanzar el error para no interrumpir el procesamiento de otros directores
  }
}

/**
 * Obtiene la lista de directores de la base de datos
 */
async function obtenerDirectores(): Promise<string[]> {
  const usuariosRef = db.collection('usuarios');
  const q = usuariosRef.where('rol', '==', 2);
  const querySnapshot = await q.get();

  const directores: string[] = [];
  querySnapshot.forEach((doc: any) => {
    const dni = doc.data().dni;
    if (validarDNI(dni)) {
      directores.push(dni);
    }
  });

  functions.logger.info(`📊 Directores encontrados: ${directores.length}`);
  return directores;
}

/**
 * Procesa directores con todas las optimizaciones aplicadas
 */
async function procesarDirectoresOptimizado(
  directores: string[],
  idEvaluacion: string,
  currentYear: number,
  month: number,
  cacheManager: CacheManager,
  errorHandler: ErrorHandler,
  performanceMonitor: PerformanceMonitor
): Promise<{ resultados: any[], acumuladoGlobal: any[], valoresExtras: number }> {
  const TIMEOUT_LIMITE = 480000; // 8 minutos
  const BATCH_SIZE = 30;
  const tiempoInicio = Date.now();

  const resultados: any[] = [];
  const todosLosPuntajes: any[][] = []; // Array para almacenar todos los acumulados de directores
  let totalProcesados = 0;
  let totalErrores = 0;

  functions.logger.info(`🚀 Procesando ${directores.length} directores en lotes de ${BATCH_SIZE}`);

  for (let i = 0; i < directores.length; i += BATCH_SIZE) {
    // Verificar timeout
    if (Date.now() - tiempoInicio > TIMEOUT_LIMITE) {
      functions.logger.warn(
        `⚠️ Timeout alcanzado. Procesados ${i}/${directores.length} directores`
      );
      break;
    }

    // Log de progreso
    const progreso = calcularProgreso(i, directores.length);
    if (i % (BATCH_SIZE * 5) === 0) {
      const tiempoRestante = Math.round((TIMEOUT_LIMITE - (Date.now() - tiempoInicio)) / 1000);
      functions.logger.info(
        `📈 Progreso: ${progreso}% (${i}/${directores.length}) - Tiempo restante: ${tiempoRestante}s`
      );
    }

    const lote = directores.slice(i, i + BATCH_SIZE);

    // Procesar lote con manejo de errores
    const promesasLote = lote.map((dni) =>
      manejarPromesa(
        procesarDirectorOptimizado(
          dni,
          idEvaluacion,
          currentYear,
          month,
          cacheManager,
          performanceMonitor
        ),
        `procesar_director_${dni}`,
        {
          dni,
          docentes: [],
          acumuladoPorPregunta: {},
          totalEvaluaciones: 0,
          error: 'Error en procesamiento',
          tiempoProcesamiento: 0,
        }
      )
    );

    const resultadosLote = await Promise.allSettled(promesasLote);

    // Procesar resultados del lote
    for (const resultado of resultadosLote) {
      if (resultado.status === 'fulfilled') {
        resultados.push(resultado.value);
        // Recopilar puntajes para el acumulado global
        if (resultado.value.acumuladoPorPregunta && Object.keys(resultado.value.acumuladoPorPregunta).length > 0) {
          const puntajesDirector = Object.values(resultado.value.acumuladoPorPregunta);
          todosLosPuntajes.push(puntajesDirector);
        }
        totalProcesados++;
      } else {
        totalErrores++;
        errorHandler.registrarError(resultado.reason, 'procesamiento_lote');
      }
    }

    // Limpiar caché expirado periódicamente
    if (i % (BATCH_SIZE * 10) === 0) {
      const eliminados = cacheManager.limpiarExpirados();
      if (eliminados > 0) {
        functions.logger.info(`🧹 Cache limpiado: ${eliminados} elementos expirados eliminados`);
      }
    }
  }

  functions.logger.info(`📊 Lote completado: ${totalProcesados} exitosos, ${totalErrores} errores`);
  
  // Calcular acumulado global DESPUÉS de procesar todos los directores
  let acumuladoGlobal: any[] = [];
  let valoresExtras: number = 0;
  if (todosLosPuntajes.length > 0) {
    functions.logger.info(`🌍 Calculando acumulado global de ${todosLosPuntajes.length} directores...`);
    const resultadoAcumulado = calcularAcumuladoGlobal(todosLosPuntajes);
    acumuladoGlobal = resultadoAcumulado.acumulado;
    valoresExtras = resultadoAcumulado.canti;
    functions.logger.info(`✅ Acumulado global calculado: ${acumuladoGlobal.length} preguntas`);
  } else {
    functions.logger.warn('⚠️ No se encontraron puntajes para calcular acumulado global');
  }
  
  return {
    resultados,
    acumuladoGlobal,
    valoresExtras
  };
}

/**
 * Procesa un director individual con optimizaciones
 */
async function procesarDirectorOptimizado(
  dni: string,
  idEvaluacion: string,
  currentYear: number,
  month: number,
  cacheManager: CacheManager,
  performanceMonitor: PerformanceMonitor
): Promise<any> {
  performanceMonitor.iniciar(`director_${dni}`);

  try {
    // Validar DNI
    if (!validarDNI(dni)) {
      throw new Error(`DNI inválido: ${dni}`);
    }

    // Obtener docentes con caché
    const docentes = await obtenerDocentesConCache(dni, cacheManager, performanceMonitor);

    if (docentes.length === 0) {
      // Director sin docentes - guardar evaluación con array vacío
      const resultadoSinDocentes = {
        dni,
        docentes: [],
        acumuladoPorPregunta: {},
        totalEvaluaciones: 0,
        tiempoProcesamiento: performanceMonitor.finalizar(`director_${dni}`),
      };

      // Optimización: Usar manejarPromesa para operación de base de datos
      await manejarPromesa(
        guardarEvaluacionDirectorSinDocentes(dni, idEvaluacion, currentYear, month),
        `guardar_director_sin_docentes_${dni}`,
        null
      );

      return resultadoSinDocentes;
    }

    // Obtener evaluaciones de docentes
    const evaluacionesDocentes = await obtenerEvaluacionesDocentes(
      docentes,
      idEvaluacion,
      currentYear,
      month,
      cacheManager,
      performanceMonitor
    );

    // Calcular estadísticas
    const estadisticas = calcularEstadisticasOptimizadas(evaluacionesDocentes);

    // Validar y limpiar estadísticas para Firestore
    if (!estadisticas || !Array.isArray(estadisticas)) {
      functions.logger.warn(`⚠️ Estadísticas inválidas para director ${dni}:`, estadisticas);
      return {
        dni,
        docentes: evaluacionesDocentes,
        acumuladoPorPregunta: {},
        totalEvaluaciones: 0,
        tiempoProcesamiento: performanceMonitor.finalizar(`director_${dni}`),
      };
    }

    // Limpiar valores undefined de las estadísticas para Firestore
    const estadisticasLimpias = limpiarParaFirestore(estadisticas);

    functions.logger.info(
      `📊 Estadísticas calculadas para director ${dni}: ${estadisticasLimpias.length} preguntas`
    );

    // Obtener datos del director con validación
    const myDirector = await db.collection('usuarios').doc(dni).get();

    // Solo guardar si el director existe
    if (myDirector.exists) {
      try {
        const directorData = myDirector.data();
        if (!directorData) {
          functions.logger.warn(`⚠️ Datos del director ${dni} son null o undefined`);
          return {
            dni,
            docentes: evaluacionesDocentes,
            acumuladoPorPregunta: {},
            totalEvaluaciones: 0,
            tiempoProcesamiento: performanceMonitor.finalizar(`director_${dni}`),
          };
        }

        await db
          .collection(`evaluaciones/${idEvaluacion}/${currentYear}-${month}`)
          .doc(`${dni}`)
          .set({
            ...directorData,
            reporteEstudiantes: estadisticasLimpias,
          });
        functions.logger.info(`✅ Datos guardados para director ${dni}`);
      } catch (error) {
        functions.logger.error(`❌ Error al guardar datos del director ${dni}:`, error);
        // No lanzar error para no interrumpir el procesamiento de otros directores
      }
    } else {
      functions.logger.warn(`⚠️ Director ${dni} no encontrado en la base de datos`);
    }
    const totalEvaluaciones = evaluacionesDocentes.reduce(
      (total, docente) => total + docente.cantidadEvaluaciones,
      0
    );

    const tiempoProcesamiento = performanceMonitor.finalizar(`director_${dni}`);

    functions.logger.info(
      `✅ Director ${dni}: ${docentes.length} docentes, ${totalEvaluaciones} evaluaciones, ${
        estadisticasLimpias.length
      } preguntas en ${formatearTiempo(tiempoProcesamiento)}`
    );

    return {
      dni,
      docentes: evaluacionesDocentes,
      acumuladoPorPregunta: estadisticasLimpias.reduce((acc: Record<string, any>, stat: any) => {
        acc[stat.id] = stat;
        return acc;
      }, {} as Record<string, any>),
      totalEvaluaciones,
      tiempoProcesamiento,
    };
  } catch (error) {
    performanceMonitor.finalizar(`director_${dni}`);
    throw error;
  }
}

/**
 * Obtiene docentes de un director con caché
 */
async function obtenerDocentesConCache(
  dni: string,
  cacheManager: CacheManager,
  performanceMonitor: PerformanceMonitor
): Promise<string[]> {
  const cacheKey = `docentes_${dni}`;

  // Intentar obtener del caché
  const cached = cacheManager.get<string[]>(cacheKey);
  if (cached) {
    return cached;
  }

  // Obtener de la base de datos
  performanceMonitor.iniciar(`db_docentes_${dni}`);

  const queryDocentes = db.collection('usuarios').where('dniDirector', '==', dni);
  const snapshot = await queryDocentes.get();

  const docentes: string[] = [];
  snapshot.forEach((doc: any) => {
    const dniDocente = doc.data().dni;
    if (validarDNI(dniDocente)) {
      docentes.push(dniDocente);
    }
  });

  performanceMonitor.finalizar(`db_docentes_${dni}`);

  // Guardar en caché
  cacheManager.set(cacheKey, docentes, 300000); // 5 minutos

  return docentes;
}

/**
 * Obtiene evaluaciones de docentes con caché
 */
async function obtenerEvaluacionesDocentes(
  docentes: string[],
  idEvaluacion: string,
  currentYear: number,
  month: number,
  cacheManager: CacheManager,
  performanceMonitor: PerformanceMonitor
): Promise<any[]> {
  const promesas = docentes.map(async (dniDocente) => {
    const cacheKey = `evaluaciones_${dniDocente}_${idEvaluacion}_${currentYear}_${month}`;

    // Intentar obtener del caché
    const cached = cacheManager.get<any[]>(cacheKey);
    if (cached) {
      return {
        docente: dniDocente,
        evaluaciones: cached,
        cantidadEvaluaciones: cached.length,
      };
    }

    // Obtener de la base de datos
    performanceMonitor.iniciar(`db_evaluaciones_${dniDocente}`);

    const queryEvaluaciones = db.collection(
      `usuarios/${dniDocente}/${idEvaluacion}/${currentYear}/${month}`
    );
    const snapshot = await queryEvaluaciones.get();

    const evaluaciones: any[] = [];
    snapshot.forEach((doc: any) => {
      const data = doc.data();
      if (data && data.respuestas) {
        evaluaciones.push(data);
      }
    });

    performanceMonitor.finalizar(`db_evaluaciones_${dniDocente}`);

    // Guardar en caché
    cacheManager.set(cacheKey, evaluaciones, 300000); // 5 minutos

    return {
      docente: dniDocente,
      evaluaciones,
      cantidadEvaluaciones: evaluaciones.length,
    };
  });

  return await Promise.all(promesas);
}

/**
 * Genera estadísticas finales del procesamiento
 */
function generarEstadisticasFinales(
  resultados: any[],
  performanceMonitor: PerformanceMonitor,
  cacheManager: CacheManager,
  errorHandler: ErrorHandler,
  estimacionPrevia: any
): any {
  const tiempoTotal = performanceMonitor.obtenerEstadisticas()['funcion_completa']?.promedio || 0;
  const cacheStats = cacheManager.obtenerEstadisticas();
  const errorStats = errorHandler.obtenerEstadisticasErrores();

  return {
    totalDirectores: resultados.length,
    tiempoProcesamiento: {
      ms: tiempoTotal,
      segundos: Math.round(tiempoTotal / 1000),
      minutos: Math.round((tiempoTotal / 60000) * 10) / 10,
    },
    estimacionPrevia,
    rendimiento: {
      cache: cacheStats,
      errores: errorStats,
      metricas: performanceMonitor.obtenerEstadisticas(),
    },
  };
}

// ==========================================================
// 3. FUNCIÓN PARA CREAR ESTUDIANTE DE DOCENTE (OPTIMIZADA)
// ==========================================================

/**
 * Función interna para crear un estudiante asociado a un docente
 * Solo usa Firestore - no requiere HTTP
 * OPTIMIZADA para máximo rendimiento y cumplir límite de 540 segundos
 */

// Exportar la función para uso interno
exports.crearEstudianteDeDocente = crearEstudianteDeDocente;

// Exportar la nueva función para frontend
exports.crearEstudianteDeDocenteFrontend = crearEstudianteDeDocenteFrontend;

// Configuración global para todas las funciones
// Nota: setGlobalOptions no está disponible en la versión actual de firebase-functions
// La configuración se maneja individualmente en cada función

// Configuración específica para la función crearEstudianteDeDocente
/* export const crearEstudianteDeDocenteConfig = {
  timeoutSeconds: 900, // 15 minutos
  memory: '2GiB',
  maxInstances: 5
}; */
