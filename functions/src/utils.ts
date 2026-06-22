/**
 * Utilidades optimizadas para el procesamiento de datos
 */

import * as functions from 'firebase-functions';
import { Estudiante, PreguntasRespuestas } from './types';

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
 * Calcula estadísticas de manera optimizada
 */
export const calcularEstadisticasOptimizadas = (
  evaluacionesDocentes: Array<{
    docente: string;
    evaluaciones: Estudiante[];
    cantidadEvaluaciones: number;
  }>,
  preguntas?: any[]
): any[] => {
  const acumuladoPorPregunta: Record<
    string,
    { id: string; total: number; [key: string]: any }
  > = {};

  evaluacionesDocentes.forEach((docente) => {
    docente.evaluaciones.forEach((evaluacion) => {
      if (evaluacion.respuestas && Array.isArray(evaluacion.respuestas)) {
        evaluacion.respuestas.forEach((respuesta) => {
          const idPregunta = String(respuesta.id);
          if (!idPregunta) return;

          if (!acumuladoPorPregunta[idPregunta]) {
            const initialObj: any = { id: idPregunta, total: 0 };
            
            // Si tenemos las preguntas globales, inicializar todas sus alternativas en 0
            const preguntaObj = preguntas?.find((p: any) => String(p.id) === idPregunta);
            if (preguntaObj && Array.isArray(preguntaObj.alternativas)) {
              preguntaObj.alternativas.forEach((alt: any) => {
                if (alt.alternativa) {
                  initialObj[alt.alternativa.toLowerCase()] = 0;
                }
              });
            } else if (respuesta.alternativas && Array.isArray(respuesta.alternativas)) {
              // Fallback con las alternativas del examen del estudiante
              respuesta.alternativas.forEach((alt: any) => {
                if (alt.alternativa) {
                  initialObj[alt.alternativa.toLowerCase()] = 0;
                }
              });
            } else {
              // Fallback básico
              initialObj.a = 0;
              initialObj.b = 0;
              initialObj.c = 0;
              initialObj.d = 0;
            }
            acumuladoPorPregunta[idPregunta] = initialObj;
          }

          if (respuesta.alternativas && Array.isArray(respuesta.alternativas)) {
            respuesta.alternativas.forEach((alternativa) => {
              if (alternativa.selected && alternativa.alternativa) {
                const altKey = alternativa.alternativa.toLowerCase();
                // Asegurar que la propiedad existe e incrementar
                if (acumuladoPorPregunta[idPregunta][altKey] === undefined) {
                  acumuladoPorPregunta[idPregunta][altKey] = 0;
                }
                acumuladoPorPregunta[idPregunta][altKey] += 1;
              }
            });
          }
        });
      }
    });
  });

  // Calcular totales para cada pregunta
  Object.values(acumuladoPorPregunta).forEach((obj) => {
    let sum = 0;
    Object.keys(obj).forEach((key) => {
      if (key !== 'id' && key !== 'total' && typeof obj[key] === 'number') {
        sum += obj[key];
      }
    });
    obj.total = sum;
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
  todosLosPuntajes: Array<any[]>
): {
  acumulado: any[];
  canti: number;
} => {
  const acumuladoGlobal: Record<string, any> = {};

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
        acumuladoGlobal[idPregunta] = { id: idPregunta, total: 0 };
      }

      // Sumar dinámicamente todas las claves numéricas (excepto 'id' y 'total')
      Object.keys(estadistica).forEach((key) => {
        if (key !== 'id' && key !== 'total' && typeof estadistica[key] === 'number') {
          if (acumuladoGlobal[idPregunta][key] === undefined) {
            acumuladoGlobal[idPregunta][key] = 0;
          }
          acumuladoGlobal[idPregunta][key] += estadistica[key];
        }
      });
    });
  });

  // Calcular totales finales
  Object.values(acumuladoGlobal).forEach((obj) => {
    let sum = 0;
    Object.keys(obj).forEach((key) => {
      if (key !== 'id' && key !== 'total' && typeof obj[key] === 'number') {
        sum += obj[key];
      }
    });
    obj.total = sum;
  });

  return {
    acumulado: Object.values(acumuladoGlobal),
    canti: canti,
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


export const reconstruirRespuestas = (respuestas: any, preguntas: any[]): any[] => {
  if (Array.isArray(respuestas)) {
    return respuestas;
  }
  if (respuestas && typeof respuestas === 'object' && preguntas) {
    return preguntas.map((p) => {
      const alternativaSeleccionada = respuestas[p.id || ''];
      const alternativasReconstruidas =
        p.alternativas?.map((alt: any) => ({
          ...alt,
          selected: !!alt.alternativa && !!alternativaSeleccionada && alt.alternativa.toLowerCase() === alternativaSeleccionada.toLowerCase(),
        })) || [];

      return {
        ...p,
        alternativas: alternativasReconstruidas,
      };
    });
  }
  return [];
};

export const convertirRespuestasAMapa = (respuestas?: any[]): Record<string, string> => {
  const mapa: Record<string, string> = {};
  if (!respuestas || !Array.isArray(respuestas)) return mapa;
  respuestas.forEach((p) => {
    const seleccionada = p.alternativas?.find((alt: any) => alt.selected === true)?.alternativa;
    if (seleccionada && p.id) {
      mapa[p.id] = seleccionada;
    }
  });
  return mapa;
};

export const calculoNivel = (data: Estudiante, evaluacion?: any) => {
  // Validación temprana para evitar procesamiento innecesario
  const respuestas = data.respuestas;
  if (!respuestas?.length) {
    return data;
  }

  let puntajeAcumulado = 0;
  const respuestasLength = respuestas.length;

  // Optimización: usar bucle for tradicional para máximo rendimiento
  for (let i = 0; i < respuestasLength; i++) {
    const pregunta = respuestas[i];
    
    // Validación temprana de la pregunta
    const alternativas = pregunta.alternativas;
    if (!alternativas?.length) {
      continue;
    }

    // Pre-calcular la respuesta correcta en minúsculas una sola vez
    const respuestaCorrecta = pregunta.respuesta?.toLowerCase();
    if (!respuestaCorrecta) {
      continue;
    }

    // Optimización: buscar directamente la alternativa correcta sin find()
    const alternativasLength = alternativas.length;
    for (let j = 0; j < alternativasLength; j++) {
      const alternativa = alternativas[j];
      
      // Verificar si está seleccionada y coincide con la respuesta correcta
      if (alternativa.selected && alternativa.alternativa?.toLowerCase() === respuestaCorrecta) {
        // Optimización: validar y convertir puntaje de manera más eficiente
        const puntajeStr = pregunta.puntaje;
        if (puntajeStr && puntajeStr !== '') {
          const puntajeNum = +puntajeStr; // Conversión más rápida que Number()
          if (puntajeNum > 0) {
            puntajeAcumulado += puntajeNum;
          }
        }
        break; // Salir del bucle interno una vez encontrada la respuesta correcta
      }
    }
  }

  // Asignar puntaje
  data.puntaje = puntajeAcumulado;

  // Si se proporciona la evaluación, calcular el nivel correspondiente
  if (evaluacion && evaluacion.nivelYPuntaje && Array.isArray(evaluacion.nivelYPuntaje) && evaluacion.nivelYPuntaje.length > 0) {
    const nivelesOrdenados = [...evaluacion.nivelYPuntaje].sort((a, b) => (a.min || 0) - (b.min || 0));
    
    let nivelEncontrado = null;
    for (let i = 0; i < nivelesOrdenados.length; i++) {
      const nivelData = nivelesOrdenados[i];
      const minPuntaje = nivelData.min || 0;
      const maxPuntaje = nivelData.max || Number.MAX_SAFE_INTEGER;
      
      if (puntajeAcumulado >= minPuntaje && puntajeAcumulado <= maxPuntaje) {
        nivelEncontrado = nivelData;
        break;
      }
    }
    
    if (nivelEncontrado) {
      data.nivel = nivelEncontrado.nivel || "sin clasificar";
      data.nivelData = nivelEncontrado;
    } else {
      data.nivel = "sin clasificar";
      data.nivelData = undefined;
    }
  } else {
    data.nivel = "sin clasificar";
    data.nivelData = undefined;
  }
  
  return data;
};

export function agregarPuntajesARespuestas(
  estudiante: Estudiante,
  preguntaRespuestas: PreguntasRespuestas[]
): Estudiante {
  // Validación temprana para evitar procesamiento innecesario
  if (!estudiante.respuestas || estudiante.respuestas.length === 0) {
    return estudiante;
  }

  // Crear un objeto simple en lugar de Map para mejor rendimiento
  // Los objetos son más rápidos que Map para claves numéricas simples
  const puntajesPorOrder: Record<number, string> = {};
  for (let i = 0; i < preguntaRespuestas.length; i++) {
    const pregunta = preguntaRespuestas[i];
    if (pregunta.order !== undefined && pregunta.puntaje !== undefined) {
      puntajesPorOrder[pregunta.order] = pregunta.puntaje;
    }
  }

  // Mutar directamente el array de respuestas para evitar crear nuevos objetos
  const respuestas = estudiante.respuestas;
  for (let i = 0; i < respuestas.length; i++) {
    const respuesta = respuestas[i];
    if (respuesta.order !== undefined) {
      respuesta.puntaje = puntajesPorOrder[respuesta.order] || "0";
    } else {
      respuesta.puntaje = "0";
    }
  }

  // Retornar el estudiante con las respuestas mutadas (más eficiente que spread)
  estudiante.respuestas = respuestas;
  return estudiante;
}

/**
 * Función para agregar una alternativa "no respondió" a todas las preguntas
 * Identifica el correlativo actual de las alternativas y agrega la siguiente letra
 */
export const addNoRespondioAlternative = (preguntas: any[]): any[] => {
  return preguntas.map(pregunta => {
    if (!pregunta.alternativas || pregunta.alternativas.length === 0) {
      return pregunta;
    }

    const alternativasExistentes = [...pregunta.alternativas];
    
    const correlativosExistentes = alternativasExistentes
      .map(alt => alt.alternativa?.toLowerCase())
      .filter(alt => alt && alt.length === 1 && alt >= 'a' && alt <= 'z')
      .sort();

    let siguienteLetra = 'd';
    
    if (correlativosExistentes.length > 0) {
      const ultimaLetra = correlativosExistentes[correlativosExistentes.length - 1];
      if (ultimaLetra) {
        const codigoAscii = ultimaLetra.charCodeAt(0);
        siguienteLetra = String.fromCharCode(codigoAscii + 1);
      }
    }

    const nuevaAlternativa = {
      alternativa: siguienteLetra.toUpperCase(),
      descripcion: 'no respondio',
      selected: false
    };

    const alternativasActualizadas = [...alternativasExistentes, nuevaAlternativa];

    return {
      ...pregunta,
      alternativas: alternativasActualizadas
    };
  });
};