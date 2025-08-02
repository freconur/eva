/**
 * Utilities para cálculo de estimaciones de tiempo de procesamiento
 * Puede ser usado en diferentes componentes del frontend
 */

export interface EstimacionTiempo {
  totalDirectores: number;
  totalLotes: number;
  directoresPorLote: number;
  tiempoEstimadoMs: number;
  tiempoEstimadoSegundos: number;
  tiempoEstimadoMinutos: number;
  clasificacion: string;
  recomendacion: string;
  colorClasificacion: string;
  porcentajeDelTimeout: number;
  excederaTimeout: boolean;
  detalles: {
    tiempoPorLoteMs: number;
    tiempoPorLoteSegundos: number;
    factorParalelismo: string;
    velocidadProcesamiento: string;
  };
}

/**
 * Calcula el tiempo estimado de procesamiento basado en el número de directores
 * @param totalDirectores - Número total de directores a procesar
 * @param batchSize - Tamaño del lote de procesamiento paralelo
 * @returns Objeto con estimaciones de tiempo
 */
export const calcularTiempoEstimado = (totalDirectores: number, batchSize: number = 30): EstimacionTiempo => {
  console.log('totalDirectores', totalDirectores)
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
  const tiempoPorLote = TIEMPO_BASE_POR_LOTE + 
                       (directoresPorLote * TIEMPO_POR_DIRECTOR_EN_LOTE * FACTOR_DOCENTES_PROMEDIO * FACTOR_EVALUACIONES_PROMEDIO) + 
                       OVERHEAD_NETWORK;
  
  // Tiempo total estimado
  const tiempoTotalMs = totalLotes * tiempoPorLote;
  const tiempoTotalSegundos = Math.round(tiempoTotalMs / 1000);
  const tiempoTotalMinutos = Math.round(tiempoTotalSegundos / 60 * 10) / 10; // Redondear a 1 decimal
  
  // Clasificación del tiempo
  let clasificacion = '';
  let recomendacion = '';
  let colorClasificacion = '';
  
  if (tiempoTotalSegundos < 60) {
    clasificacion = 'RÁPIDO';
    recomendacion = 'Procesamiento rápido esperado';
    colorClasificacion = 'green';
  } else if (tiempoTotalSegundos < 180) {
    clasificacion = 'MODERADO';
    recomendacion = 'Tiempo de procesamiento moderado';
    colorClasificacion = 'yellow';
  } else if (tiempoTotalSegundos < 420) {
    clasificacion = 'LENTO';
    recomendacion = 'Procesamiento lento - considera optimización';
    colorClasificacion = 'orange';
  } else {
    clasificacion = 'MUY LENTO';
    recomendacion = 'Tiempo crítico - puede exceder timeout de 8 minutos';
    colorClasificacion = 'red';
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
    colorClasificacion,
    porcentajeDelTimeout: Math.round((tiempoTotalMs / 480000) * 100), // 480000ms = 8 minutos
    excederaTimeout: tiempoTotalMs > 480000,
    detalles: {
      tiempoPorLoteMs: Math.round(tiempoPorLote),
      tiempoPorLoteSegundos: Math.round(tiempoPorLote / 1000),
      factorParalelismo: `${batchSize} directores por lote`,
      velocidadProcesamiento: `${Math.round(totalDirectores / tiempoTotalMinutos)} directores/minuto`
    }
  };
};

/**
 * Formatea una estimación de tiempo para mostrar en la UI
 * @param estimacion - Objeto de estimación de tiempo
 * @returns String formateado para mostrar
 */
export const formatearEstimacion = (estimacion: EstimacionTiempo): string => {
  return `
🔍 ESTIMACIÓN DE TIEMPO DE PROCESAMIENTO:

📈 Directores: ${estimacion.totalDirectores}
⏰ Tiempo estimado: ${estimacion.tiempoEstimadoMinutos} minutos
🚦 Clasificación: ${estimacion.clasificacion}
📊 Uso del timeout: ${estimacion.porcentajeDelTimeout}%
🏃 Velocidad: ${estimacion.detalles.velocidadProcesamiento}

💡 ${estimacion.recomendacion}

${estimacion.excederaTimeout ? 
  '⚠️ ADVERTENCIA: Puede exceder el tiempo límite de 8 minutos.' : 
  '✅ El tiempo estimado está dentro del límite.'
}`;
};

/**
 * Crea un mensaje de confirmación con estimación
 * @param numeroDirectores - Número de directores estimado
 * @returns true si el usuario confirma, false si cancela
 */
export const mostrarConfirmacionEstimacion = (numeroDirectores: number = 1200): boolean => {
  const estimacion = calcularTiempoEstimado(numeroDirectores);
  const mensaje = `${formatearEstimacion(estimacion)}\n\n¿Deseas continuar con la generación del reporte?`;
  return confirm(mensaje);
};

/**
 * Obtiene el color CSS basado en la clasificación de tiempo
 * @param clasificacion - Clasificación de tiempo (RÁPIDO, MODERADO, LENTO, MUY LENTO)
 * @returns Color CSS apropiado
 */
export const obtenerColorClasificacion = (clasificacion: string): string => {
  switch (clasificacion) {
    case 'RÁPIDO':
      return '#10b981'; // Verde
    case 'MODERADO':
      return '#f59e0b'; // Amarillo
    case 'LENTO':
      return '#f97316'; // Naranja
    case 'MUY LENTO':
      return '#ef4444'; // Rojo
    default:
      return '#6b7280'; // Gris
  }
};

/**
 * Obtiene el icono apropiado basado en la clasificación
 * @param clasificacion - Clasificación de tiempo
 * @returns Emoji del icono apropiado
 */
export const obtenerIconoClasificacion = (clasificacion: string): string => {
  switch (clasificacion) {
    case 'RÁPIDO':
      return '🟢';
    case 'MODERADO':
      return '🟡';
    case 'LENTO':
      return '🟠';
    case 'MUY LENTO':
      return '🔴';
    default:
      return '⚪';
  }
};

/**
 * Estimaciones predeterminadas para diferentes escenarios
 */
export const ESTIMACIONES_PREDETERMINADAS = {
  PEQUENO: { directores: 100, nombre: 'Pequeño (100 directores)' },
  MEDIANO: { directores: 500, nombre: 'Mediano (500 directores)' },
  GRANDE: { directores: 1000, nombre: 'Grande (1000 directores)' },
  MUY_GRANDE: { directores: 1500, nombre: 'Muy Grande (1500 directores)' },
  UGEL_PROMEDIO: { directores: 1200, nombre: 'UGEL Promedio (1200 directores)' }
}; 