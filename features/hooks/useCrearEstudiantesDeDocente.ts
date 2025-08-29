import { useState } from 'react';
import { httpsCallable } from 'firebase/functions';
import { functions, FUNCTIONS_TIMEOUT } from '@/firebase/firebase.config';

interface ResultadoCrearEstudiantes {
  success: boolean;
  totalDocentes: number;
  docentesProcesados: number;
  totalEstudiantes: number;
  lotesCompletados: number;
  erroresEncontrados: number;
  executionTime: number;
  tiempoTotal: number;
  tasaExito: string;
  estadisticasLotes: Array<{
    lote: number;
    docentes: number;
    tiempo: number;
    estudiantes: number;
  }>;
  message: string;
}

export const useCrearEstudiantesDeDocente = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [resultado, setResultado] = useState<ResultadoCrearEstudiantes | null>(null);
  const [progreso, setProgreso] = useState<{
    docentesProcesados: number;
    totalDocentes: number;
    porcentaje: number;
    estudiantesProcesados: number;
    lotesCompletados: number;
    erroresEncontrados: number;
  } | null>(null);

  /**
   * Ejecuta la función para crear estudiantes de docentes
   * @param monthSelected - Mes seleccionado para la evaluación
   * @param idEvaluacion - ID de la evaluación
   * @returns Promise con el resultado de la operación
   */
  const ejecutarCrearEstudiantes = async (monthSelected: string, idEvaluacion: string): Promise<ResultadoCrearEstudiantes> => {
    try {
      setLoading(true);
      setError(null);
      setResultado(null);
      setProgreso(null);

      console.log('🚀 Iniciando creación de estudiantes de docentes...');
      console.log('📅 Mes seleccionado:', monthSelected);
      console.log('🎯 ID Evaluación:', idEvaluacion);

      // Crear la función callable con timeout personalizado
      const crearEstudiantesFunction = httpsCallable(
        functions, 
        'crearEstudianteDeDocenteFrontend',
        {
          timeout: FUNCTIONS_TIMEOUT // 9.5 minutos
        }
      );

      console.log('🔍 Using functions instance with custom timeout:', FUNCTIONS_TIMEOUT / 1000, 'segundos');

      // Ejecutar la función con timeout extendido y parámetros
      const resultado = await Promise.race([
        crearEstudiantesFunction({ monthSelected, idEvaluacion }),
        new Promise<never>((_, reject) => 
          setTimeout(() => reject(new Error('Timeout del cliente: La función está tardando más de 9.5 minutos')), FUNCTIONS_TIMEOUT) // Usar el mismo timeout
        )
      ]);
      
      // El resultado viene en data
      const data = resultado.data as ResultadoCrearEstudiantes;
      
      if (data.success) {
        setResultado(data);
        setProgreso({
          docentesProcesados: data.docentesProcesados,
          totalDocentes: data.totalDocentes,
          porcentaje: (data.docentesProcesados / data.totalDocentes) * 100,
          estudiantesProcesados: data.totalEstudiantes,
          lotesCompletados: data.lotesCompletados,
          erroresEncontrados: data.erroresEncontrados
        });

        console.log('✅ Estudiantes creados exitosamente:', data);
        return data;
      } else {
        throw new Error(data.message || 'Error desconocido en la creación de estudiantes');
      }

    } catch (error) {
      let errorMessage = 'Error desconocido';
      
      // Manejar errores específicos de Firebase Functions
      if (error && typeof error === 'object' && 'code' in error) {
        const firebaseError = error as any;
        
        switch (firebaseError.code) {
          case 'functions/deadline-exceeded':
            errorMessage = '⚠️ Tiempo de espera agotado\n\n' +
              'La función está procesando un gran volumen de datos y puede tardar más tiempo del esperado.\n\n' +
              '• La función continúa ejecutándose en el servidor\n' +
              '• Puedes verificar el progreso en los logs del emulador\n' +
              '• Intenta nuevamente en unos minutos\n' +
              '• Si el problema persiste, revisa la configuración de timeout';
            break;
          case 'functions/unavailable':
            errorMessage = 'Servicio temporalmente no disponible';
            break;
          case 'functions/resource-exhausted':
            errorMessage = 'Recursos del servidor agotados';
            break;
          default:
            errorMessage = firebaseError.message || 'Error de Firebase Functions';
        }
      } else if (error instanceof Error) {
        errorMessage = error.message;
      }
      
      setError(errorMessage);
      console.error('❌ Error al crear estudiantes de docentes:', error);
      throw new Error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  /**
   * Limpia el estado del hook
   */
  const limpiarEstado = () => {
    setLoading(false);
    setError(null);
    setResultado(null);
    setProgreso(null);
  };

  /**
   * Obtiene un mensaje de resumen del resultado
   */
  const obtenerMensajeResumen = (): string => {
    if (!resultado) return '';
    
    return `✅ Proceso completado: ${resultado.docentesProcesados}/${resultado.totalDocentes} docentes procesados, ${resultado.totalEstudiantes} estudiantes creados en ${resultado.tiempoTotal.toFixed(2)}s`;
  };

  /**
   * Obtiene estadísticas detalladas del proceso
   */
  const obtenerEstadisticas = () => {
    if (!resultado) return null;
    
    return {
      tiempoTotal: resultado.tiempoTotal,
      tiempoEjecucion: resultado.executionTime,
      tasaExito: resultado.tasaExito,
      lotesCompletados: resultado.lotesCompletados,
      erroresEncontrados: resultado.erroresEncontrados,
      promedioTiempoLote: resultado.estadisticasLotes.length > 0 
        ? resultado.estadisticasLotes.reduce((sum, lote) => sum + lote.tiempo, 0) / resultado.estadisticasLotes.length
        : 0
    };
  };

  return {
    // Estados
    loading,
    error,
    resultado,
    progreso,
    
    // Funciones
    ejecutarCrearEstudiantes,
    limpiarEstado,
    obtenerMensajeResumen,
    obtenerEstadisticas,
    
    // Utilidades
    tieneResultado: !!resultado,
    tieneError: !!error,
    estaProcesando: loading,
    porcentajeCompletado: progreso ? progreso.porcentaje : 0
  };
};
