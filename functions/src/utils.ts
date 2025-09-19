/**
 * Utilidades optimizadas para el procesamiento de datos
 */

import * as functions from 'firebase-functions';
import { Estudiante } from './types';

// ==========================================================
// TIPOS Y INTERFACES
// ==========================================================

export interface EstadisticaPregunta {
  id: string;
  a: number;
  b: number;
  c: number;
  d?: number;
  total: number;
}

export interface ResultadoProcesamiento {
  dni: string;
  docentes: any[];
  acumuladoPorPregunta: Record<string, EstadisticaPregunta>;
  totalEvaluaciones: number;
  error?: string;
  tiempoProcesamiento?: number;
}

export interface EstadisticasRendimiento {
  totalConsultasDB: number;
  totalConsultasCache: number;
  totalErrores: number;
  totalDirectoresProcesados: number;
  tiempoTotal: number;
  eficienciaCache: number;
}

// ==========================================================
// VALIDACIONES
// ==========================================================

/**
 * Valida que un DNI sea válido
 */
export const validarDNI = (dni: string): boolean => {
  if (!dni || typeof dni !== 'string') return false;
  const dniLimpio = dni.trim();
  if (dniLimpio.length === 0) return false;
  // Validación: debe ser solo números y tener exactamente 8 caracteres
  return /^[0-9]{8}$/.test(dniLimpio);
};

/**
 * Valida parámetros de entrada para el procesamiento
 */
export const validarParametrosEntrada = (params: {
  idEvaluacion?: string;
  month?: number;
  currentYear?: number;
  filtros?: any;
}): { valido: boolean; errores: string[] } => {
  const errores: string[] = [];

  if (!params.idEvaluacion || typeof params.idEvaluacion !== 'string') {
    errores.push('idEvaluacion es requerido y debe ser una cadena');
  }

  if (typeof params.month !== 'number' || params.month < 1 || params.month > 12) {
    errores.push('month debe ser un número entre 1 y 12');
  }

  if (typeof params.currentYear !== 'number' || params.currentYear < 2020) {
    errores.push('currentYear debe ser un número válido mayor a 2020');
  }

  return {
    valido: errores.length === 0,
    errores,
  };
};

// ==========================================================
// MANEJO DE ERRORES
// ==========================================================

/**
 * Clase para manejo centralizado de errores
 */
export class ErrorHandler {
  private static instance: ErrorHandler;
  private errores: Array<{ timestamp: number; error: any; contexto: string }> = [];

  static getInstance(): ErrorHandler {
    if (!ErrorHandler.instance) {
      ErrorHandler.instance = new ErrorHandler();
    }
    return ErrorHandler.instance;
  }

  /**
   * Registra un error con contexto
   */
  registrarError(error: any, contexto: string): void {
    const errorInfo = {
      timestamp: Date.now(),
      error:
        error instanceof Error
          ? {
              message: error.message,
              stack: error.stack,
              name: error.name,
            }
          : error,
      contexto,
    };

    this.errores.push(errorInfo);
    functions.logger.error(`❌ Error en ${contexto}:`, errorInfo);
  }

  /**
   * Obtiene estadísticas de errores
   */
  obtenerEstadisticasErrores(): {
    total: number;
    porContexto: Record<string, number>;
    erroresRecientes: Array<{ timestamp: number; error: any; contexto: string }>;
  } {
    const porContexto: Record<string, number> = {};
    const ahora = Date.now();
    const erroresRecientes = this.errores.filter((e) => ahora - e.timestamp < 300000); // Últimos 5 minutos

    this.errores.forEach((e) => {
      porContexto[e.contexto] = (porContexto[e.contexto] || 0) + 1;
    });

    return {
      total: this.errores.length,
      porContexto,
      erroresRecientes,
    };
  }

  /**
   * Limpia errores antiguos (más de 1 hora)
   */
  limpiarErroresAntiguos(): void {
    const unaHoraAtras = Date.now() - 3600000;
    this.errores = this.errores.filter((e) => e.timestamp > unaHoraAtras);
  }
}

/**
 * Wrapper para manejo seguro de promesas
 */
export const manejarPromesa = async <T>(
  promesa: Promise<T>,
  contexto: string,
  valorPorDefecto: T
): Promise<T> => {
  try {
    return await promesa;
  } catch (error) {
    ErrorHandler.getInstance().registrarError(error, contexto);
    return valorPorDefecto;
  }
};

// ==========================================================
// OPTIMIZACIONES DE RENDIMIENTO
// ==========================================================

/**
 * Clase para gestión de caché optimizada
 */
export class CacheManager {
  private cache = new Map<string, { data: any; timestamp: number; ttl: number }>();
  private estadisticas = {
    hits: 0,
    misses: 0,
    sets: 0,
  };

  /**
   * Obtiene un valor del caché
   */
  get<T>(key: string): T | null {
    const item = this.cache.get(key);

    if (!item) {
      this.estadisticas.misses++;
      return null;
    }

    // Verificar si ha expirado
    if (Date.now() > item.timestamp + item.ttl) {
      this.cache.delete(key);
      this.estadisticas.misses++;
      return null;
    }

    this.estadisticas.hits++;
    return item.data as T;
  }

  /**
   * Establece un valor en el caché
   */
  set<T>(key: string, data: T, ttl: number = 300000): void {
    // 5 minutos por defecto
    this.cache.set(key, {
      data,
      timestamp: Date.now(),
      ttl,
    });
    this.estadisticas.sets++;
  }

  /**
   * Limpia elementos expirados del caché
   */
  limpiarExpirados(): number {
    const ahora = Date.now();
    let eliminados = 0;

    this.cache.forEach((item, key) => {
      if (ahora > item.timestamp + item.ttl) {
        this.cache.delete(key);
        eliminados++;
      }
    });

    return eliminados;
  }

  /**
   * Obtiene estadísticas del caché
   */
  obtenerEstadisticas(): {
    hits: number;
    misses: number;
    sets: number;
    size: number;
    hitRate: number;
  } {
    const total = this.estadisticas.hits + this.estadisticas.misses;
    return {
      ...this.estadisticas,
      size: this.cache.size,
      hitRate: total > 0 ? (this.estadisticas.hits / total) * 100 : 0,
    };
  }
}

/**
 * Función para procesar datos en lotes con límite de concurrencia
 */
export const procesarEnLotes = async <T, R>(
  items: T[],
  procesador: (item: T) => Promise<R>,
  batchSize: number = 10,
  maxConcurrencia: number = 5
): Promise<R[]> => {
  const resultados: R[] = [];

  for (let i = 0; i < items.length; i += batchSize) {
    const lote = items.slice(i, i + batchSize);

    // Procesar con límite de concurrencia
    const promesas = lote.map(procesador);
    const resultadosLote = await Promise.allSettled(promesas);

    // Filtrar resultados exitosos
    for (const resultado of resultadosLote) {
      if (resultado.status === 'fulfilled') {
        resultados.push(resultado.value);
      }
    }

    // Pequeña pausa para evitar sobrecarga
    if (i + batchSize < items.length) {
      await new Promise((resolve) => setTimeout(resolve, 10));
    }
  }

  return resultados;
};

// ==========================================================
// FUNCIONES DE ESTADÍSTICAS OPTIMIZADAS
// ==========================================================

/**
 * Calcula estadísticas de manera optimizada usando Map
 */
export const calcularEstadisticasOptimizadas = (
  evaluacionesDocentes: Array<{
    docente: string;
    evaluaciones: Estudiante[];
    cantidadEvaluaciones: number;
  }>
): EstadisticaPregunta[] => {
  const acumuladoPorPregunta: Record<
    string,
    { id: string; a: number; b: number; c: number; d?: number; total: number }
  > = {};

  evaluacionesDocentes.forEach((estudiante) => {
    estudiante.evaluaciones.forEach((evaluacion) => {
      if (evaluacion.respuestas && Array.isArray(evaluacion.respuestas)) {
        evaluacion.respuestas.forEach((respuesta) => {
          const idPregunta = String(respuesta.id);
          if (!idPregunta) return;
          // Detectar si la alternativa 'd' existe en esta pregunta
          let tieneD = false;
          if (respuesta.alternativas && Array.isArray(respuesta.alternativas)) {
            tieneD = respuesta.alternativas.some((alt) => alt.alternativa === 'd');
          }
          if (!acumuladoPorPregunta[idPregunta]) {
            acumuladoPorPregunta[idPregunta] = tieneD
              ? { id: idPregunta, a: 0, b: 0, c: 0, d: 0, total: 0 }
              : { id: idPregunta, a: 0, b: 0, c: 0, total: 0 };
          }
          if (respuesta.alternativas && Array.isArray(respuesta.alternativas)) {
            respuesta.alternativas.forEach((alternativa) => {
              if (alternativa.selected) {
                switch (alternativa.alternativa) {
                  case 'a':
                    acumuladoPorPregunta[idPregunta].a += 1;
                    break;
                  case 'b':
                    acumuladoPorPregunta[idPregunta].b += 1;
                    break;
                  case 'c':
                    acumuladoPorPregunta[idPregunta].c += 1;
                    break;
                  case 'd':
                    if (typeof acumuladoPorPregunta[idPregunta].d === 'number') {
                      acumuladoPorPregunta[idPregunta].d! += 1;
                    }
                    break;
                  default:
                    break;
                }
              }
            });
          }
        });
      }
    });
  });

  // Calcular totales para cada pregunta
  Object.values(acumuladoPorPregunta).forEach((obj) => {
    obj.total = obj.a + obj.b + obj.c + (typeof obj.d === 'number' ? obj.d : 0);
  });

  const resultado = Object.values(acumuladoPorPregunta);
  return resultado;
};

/**
 * Calcula el acumulado global sumando las estadísticas de todos los directores
 * Implementa la misma lógica de exclusión que useReporteEspecialistas:
 * - Encuentra la cantidad de preguntas más común entre todos los directores
 * - Solo procesa directores que tengan esa cantidad de preguntas
 * - Excluye directores con cantidades diferentes de preguntas
 */
export const calcularAcumuladoGlobal = (
  todosLosPuntajes: Array<
    { id: string; a: number; b: number; c: number; d?: number; total: number }[]
  >
): {
  acumulado: Array<{ id: string; a: number; b: number; c: number; d?: number; total: number }>;
  canti: number;
} => {
  const acumuladoGlobal: Record<
    string,
    { id: string; a: number; b: number; c: number; d?: number; total: number }
  > = {};

  // Validar que hay datos antes de continuar
  if (todosLosPuntajes.length === 0) {
    console.log('⚠️ DEBUG: No hay directores con datos válidos');
    return {
      acumulado: [],
      canti: 0,
    };
  }

  // Filtrar directores con datos válidos
  const directoresConDatos = todosLosPuntajes.filter(
    (puntajesDirector) => puntajesDirector && puntajesDirector.length > 0
  );

  // Validar que hay directores con datos antes de continuar
  if (directoresConDatos.length === 0) {
    console.log('⚠️ DEBUG: No hay directores con datos válidos después del filtro');
    return {
      acumulado: [],
      canti: todosLosPuntajes.length,
    };
  }

  // Contar frecuencia de cantidad de preguntas
  const frecuenciaPorCantidad: Record<number, number> = {};
  const directoresPorCantidad: Record<number, typeof directoresConDatos> = {};

  directoresConDatos.forEach((puntajesDirector) => {
    const cantidadPreguntas = puntajesDirector.length;
    frecuenciaPorCantidad[cantidadPreguntas] = (frecuenciaPorCantidad[cantidadPreguntas] || 0) + 1;

    if (!directoresPorCantidad[cantidadPreguntas]) {
      directoresPorCantidad[cantidadPreguntas] = [];
    }
    directoresPorCantidad[cantidadPreguntas].push(puntajesDirector);
  });

  // Encontrar la cantidad de preguntas más común
  const cantidadesPreguntasDisponibles = Object.keys(frecuenciaPorCantidad);

  if (cantidadesPreguntasDisponibles.length === 0) {
    console.log('⚠️ DEBUG: No se encontraron cantidades de preguntas válidas');
    return {
      acumulado: [],
      canti: todosLosPuntajes.length,
    };
  }

  const cantidadMasComun = cantidadesPreguntasDisponibles.reduce((a, b) =>
    frecuenciaPorCantidad[parseInt(a)] > frecuenciaPorCantidad[parseInt(b)] ? a : b
  );

  const directoresValidos = directoresPorCantidad[parseInt(cantidadMasComun)] || [];
  const canti = directoresConDatos.length - directoresValidos.length;

  console.log('🔍 DEBUG: Análisis de directores en calcularAcumuladoGlobal:', {
    totalDirectores: todosLosPuntajes.length,
    directoresConDatos: directoresConDatos.length,
    frecuenciaPorCantidad,
    cantidadPreguntasMasComun: parseInt(cantidadMasComun),
    directoresConCantidadMasComun: directoresValidos.length,
    directoresDescartados: canti,
  });

  // Procesar solo los directores válidos
  directoresValidos.forEach((puntajesDirector) => {
    puntajesDirector.forEach((estadistica) => {
      const idPregunta = estadistica.id;

      if (!acumuladoGlobal[idPregunta]) {
        // Inicializar con la estructura de la primera pregunta que encuentre
        acumuladoGlobal[idPregunta] = {
          id: idPregunta,
          a: 0,
          b: 0,
          c: 0,
          d: typeof estadistica.d === 'number' ? 0 : undefined,
          total: 0,
        };
      }

      // Sumar los valores
      acumuladoGlobal[idPregunta].a += estadistica.a;
      acumuladoGlobal[idPregunta].b += estadistica.b;
      acumuladoGlobal[idPregunta].c += estadistica.c;

      if (typeof estadistica.d === 'number' && typeof acumuladoGlobal[idPregunta].d === 'number') {
        acumuladoGlobal[idPregunta].d! += estadistica.d;
      }
    });
  });

  // Calcular totales finales
  Object.values(acumuladoGlobal).forEach((obj) => {
    obj.total = obj.a + obj.b + obj.c + (typeof obj.d === 'number' ? obj.d : 0);
  });

  // Filtrar propiedades con valores undefined o null
  const acumuladoLimpio = Object.values(acumuladoGlobal).map((obj) => {
    const objLimpio: any = {
      id: obj.id,
      a: obj.a,
      b: obj.b,
      c: obj.c,
      total: obj.total,
    };

    // Solo incluir la propiedad 'd' si tiene un valor válido (no undefined ni null)
    if (typeof obj.d === 'number') {
      objLimpio.d = obj.d;
    }

    return objLimpio;
  });

  return {
    acumulado: acumuladoLimpio,
    canti: canti, // Cantidad de directores descartados por tener diferente cantidad de preguntas
  };
};

// ==========================================================
// FUNCIONES DE MONITOREO
// ==========================================================

/**
 * Clase para monitoreo de rendimiento
 */
export class PerformanceMonitor {
  private metricas: Array<{ nombre: string; inicio: number; fin?: number }> = [];
  private estadisticas: Record<
    string,
    { total: number; promedio: number; min: number; max: number }
  > = {};

  /**
   * Inicia el monitoreo de una operación
   */
  iniciar(nombre: string): void {
    this.metricas.push({
      nombre,
      inicio: Date.now(),
    });
  }

  /**
   * Finaliza el monitoreo de una operación
   */
  finalizar(nombre: string): number {
    const metrica = this.metricas.find((m) => m.nombre === nombre && !m.fin);
    if (!metrica) {
      functions.logger.warn(`⚠️ No se encontró métrica iniciada para: ${nombre}`);
      return 0;
    }

    metrica.fin = Date.now();
    const duracion = metrica.fin - metrica.inicio;

    // Actualizar estadísticas
    if (!this.estadisticas[nombre]) {
      this.estadisticas[nombre] = { total: 0, promedio: 0, min: Infinity, max: 0 };
    }

    const stats = this.estadisticas[nombre];
    stats.total++;
    stats.promedio = (stats.promedio * (stats.total - 1) + duracion) / stats.total;
    stats.min = Math.min(stats.min, duracion);
    stats.max = Math.max(stats.max, duracion);

    return duracion;
  }

  /**
   * Obtiene estadísticas de rendimiento
   */
  obtenerEstadisticas(): Record<
    string,
    { total: number; promedio: number; min: number; max: number }
  > {
    return { ...this.estadisticas };
  }

  /**
   * Genera un reporte de rendimiento
   */
  generarReporte(): string {
    const reporte = ['📊 REPORTE DE RENDIMIENTO:'];

    for (const [nombre, stats] of Object.entries(this.estadisticas)) {
      reporte.push(`   ${nombre}:`);
      reporte.push(`     Total: ${stats.total} operaciones`);
      reporte.push(`     Promedio: ${Math.round(stats.promedio)}ms`);
      reporte.push(`     Min: ${stats.min}ms, Max: ${stats.max}ms`);
    }

    return reporte.join('\n');
  }
}

// ==========================================================
// FUNCIONES DE UTILIDAD
// ==========================================================

/**
 * Formatea tiempo en formato legible
 */
export const formatearTiempo = (ms: number): string => {
  if (ms < 1000) return `${ms}ms`;
  if (ms < 60000) return `${Math.round(ms / 1000)}s`;
  return `${Math.round((ms / 60000) * 10) / 10}min`;
};

/**
 * Calcula el porcentaje de progreso
 */
export const calcularProgreso = (actual: number, total: number): number => {
  return total > 0 ? Math.round((actual / total) * 100) : 0;
};

/**
 * Genera un ID único para tracking
 */
export const generarTrackingId = (): string => {
  return `track_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
};

/**
 * Limpia un objeto removiendo propiedades undefined para compatibilidad con Firestore
 */
export const limpiarParaFirestore = (obj: any): any => {
  if (obj === null || obj === undefined) {
    return null;
  }

  if (Array.isArray(obj)) {
    return obj.map((item) => limpiarParaFirestore(item)).filter((item) => item !== null);
  }

  if (typeof obj === 'object') {
    const cleaned: any = {};
    for (const [key, value] of Object.entries(obj)) {
      if (value !== undefined) {
        cleaned[key] = limpiarParaFirestore(value);
      }
    }
    return cleaned;
  }

  return obj;
};
