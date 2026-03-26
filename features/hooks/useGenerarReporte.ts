import { useState } from 'react';
import { getFunctions, httpsCallable } from 'firebase/functions';
import { currentYear } from '@/fuctions/dates';
import { getAuth } from 'firebase/auth';
import { app, functions as firebaseFunctions, FUNCTIONS_TIMEOUT } from '@/firebase/firebase.config'; // Usar la instancia configurada
import {
  EstimacionTiempo,
  calcularTiempoEstimado,
  formatearEstimacion,
  mostrarConfirmacionEstimacion,
  ESTIMACIONES_PREDETERMINADAS
} from '@/fuctions/timeEstimation';

interface FiltrosReporte {
  region: string;
  distrito: string;
  caracteristicaCurricular: string;
  genero: string;
  area: string;
}



interface ResultadoReporte {
  directores: string[];
  directoresConDocentes: any[];
  docentesTotales: string[];
  acumuladoGlobal: any[];
  totalDirectores: number;
  totalDocentes: number;
  totalEvaluaciones: number;
  procesados: number;
  completado: boolean;
  estimacionTiempo: EstimacionTiempo; // Agregar campo de estimación de tiempo
  estadisticas: {
    directoresSinDocentes: number;
    directoresConDatos: number;
    directoresConErrores: number;
    promedioDocentesPorDirector: number;
    promedioEvaluacionesPorDirector: number;
    eficienciaProcesamiento: number;
    porcentajeProcesado: number;
    preguntasProcesadas: number;
    tiempoReal?: {
      tiempoRealMinutos: number;
      velocidadRealDirectoresPorMin: number;
      diferenciaPorcentaje: number;
      masRapidoQueEstimacion: boolean;
      eficienciaEstimacion: string;
    };
  };
}

export const useGenerarReporte = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [resultado, setResultado] = useState<ResultadoReporte | null>(null);
  const [estimacionPrevia, setEstimacionPrevia] = useState<EstimacionTiempo | null>(null);

  /**
   * Calcula una estimación previa basada en el número aproximado de directores
   * @param numeroDirectoresEstimado - Número estimado de directores (por defecto 1200)
   */
  const calcularEstimacionPrevia = (numeroDirectoresEstimado: number = 100) => {
    const estimacion = calcularTiempoEstimado(numeroDirectoresEstimado);
    setEstimacionPrevia(estimacion);

    console.log('⏱️  ESTIMACIÓN PREVIA CALCULADA:');
    console.log(`   📈 Directores estimados: ${estimacion.totalDirectores}`);
    console.log(`   ⏰ Tiempo estimado: ${estimacion.tiempoEstimadoMinutos} minutos`);
    console.log(`   🚦 Clasificación: ${estimacion.clasificacion}`);
    console.log(`   💡 ${estimacion.recomendacion}`);
    console.log(`   📊 Uso del timeout: ${estimacion.porcentajeDelTimeout}%`);

    return estimacion;
  };

  /**
   * Muestra una confirmación al usuario con la estimación antes de proceder
   * @param numeroDirectoresEstimado - Número estimado de directores
   * @returns true si el usuario confirma, false si cancela
   */
  const mostrarConfirmacionConEstimacion = (numeroDirectoresEstimado: number = 100): boolean => {
    console.log('numeroDirectoresEstimado', numeroDirectoresEstimado)
    const estimacion = calcularTiempoEstimado(numeroDirectoresEstimado);

    const mensaje = `
🔍 ESTIMACIÓN DE TIEMPO DE PROCESAMIENTO:

📈 Directores aproximados: ${estimacion.totalDirectores}
⏰ Tiempo estimado: ${estimacion.tiempoEstimadoMinutos} minutos (${estimacion.tiempoEstimadoSegundos} segundos)
🚦 Clasificación: ${estimacion.clasificacion}
📊 Uso del timeout: ${estimacion.porcentajeDelTimeout}% del límite
🏃 Velocidad estimada: ${estimacion.detalles.velocidadProcesamiento}

💡 ${estimacion.recomendacion}

${estimacion.excederaTimeout ?
        '⚠️ ADVERTENCIA: Puede exceder el tiempo límite de 8 minutos.\n' :
        '✅ El tiempo estimado está dentro del límite.\n'
      }

¿Deseas continuar con la generación del reporte?`;

    return confirm(mensaje);
  };

  /**
   * Obtiene estimaciones para diferentes escenarios predeterminados
   * @returns Objeto con estimaciones para diferentes tamaños
   */
  const obtenerEstimacionesEscenarios = () => {
    return Object.entries(ESTIMACIONES_PREDETERMINADAS).map(([key, scenario]) => ({
      nombre: scenario.nombre,
      estimacion: calcularTiempoEstimado(scenario.directores),
      directores: scenario.directores
    }));
  };

  /**
   * Busca la mejor estimación basada en el número real de directores
   * @param numeroRealDirectores - Número real de directores obtenido del backend
   * @returns Estimación actualizada con datos reales
   */
  const actualizarEstimacionConDatosReales = (numeroRealDirectores: number) => {
    const estimacionReal = calcularTiempoEstimado(numeroRealDirectores);
    setEstimacionPrevia(estimacionReal);

    console.log('🔄 Estimación actualizada con datos reales:');
    console.log(`   📊 Directores reales: ${numeroRealDirectores}`);
    console.log(`   ⏰ Tiempo estimado actualizado: ${estimacionReal.tiempoEstimadoMinutos} minutos`);
    console.log(`   🚦 Clasificación: ${estimacionReal.clasificacion}`);

    return estimacionReal;
  };

  const generarReporte = async (
    idEvaluacion: string,
    month: number,
    filtros: FiltrosReporte,
    year: number
  ) => {
    setLoading(true);
    setError(null);

    try {
      // Calcular y mostrar estimación previa antes de proceder
      console.log('🧮 Calculando estimación previa...');
      const estimacionInicial = calcularTiempoEstimado(100); // Usar 1200 como estimación por defecto
      setEstimacionPrevia(estimacionInicial);

      // La confirmación ahora se maneja en los componentes para mayor flexibilidad

      // Verificar autenticación y refrescar token
      const auth = getAuth(app);
      const currentUser = auth.currentUser;

      console.log('🔍 Current user:', currentUser);

      if (!currentUser) {
        throw new Error('Usuario no autenticado');
      }

      // Refrescar el token para asegurar que tenga los custom claims actualizados
      const idTokenResult = await currentUser.getIdTokenResult(true);
      console.log('🔍 Custom claims del usuario actual:', idTokenResult.claims);
      console.log('🔍 Role del usuario:', idTokenResult.claims.role);
      console.log('🔍 Admin claim:', idTokenResult.claims.admin);
      console.log('🔍 UID del usuario:', currentUser.uid);
      console.log('🔍 Email del usuario:', currentUser.email);
      console.log('Token refrescado antes de generar reporte');

      // Usar la instancia de Functions ya configurada con timeout personalizado
      console.log('🔍 Using functions instance from config with custom timeout:', FUNCTIONS_TIMEOUT / 1000, 'segundos');

      // Configurar la función callable con timeout personalizado
      const generarReporteFunction = httpsCallable(firebaseFunctions, 'leerEvaluacionesParaAdmin', {
        timeout: FUNCTIONS_TIMEOUT // 9.5 minutos
      });

      console.log('📞 Llamando a la función generarReporte con parámetros:', {
        idEvaluacion,
        month,
        filtros,
        currentYear,
        timeoutConfigured: FUNCTIONS_TIMEOUT / 1000 + ' segundos'
      });

      // Mostrar mensaje de progreso al usuario
      console.log('⏱️  Procesando reporte... esto puede tomar hasta 9 minutos');

      // Llamar a la función Cloud Function
      const result = await generarReporteFunction({
        idEvaluacion,
        month,
        filtros,
        currentYear: year
      });

      console.log('✅ Resultado de la función:', result.data);

      const { data } = result.data as {
        success: boolean;
        message: string;
        data: ResultadoReporte
      };

      setResultado(data);

      // Mostrar información detallada de la estimación de tiempo
      /* if (data.estimacionTiempo) {
        const est = data.estimacionTiempo;
        console.log('⏱️  INFORMACIÓN DE ESTIMACIÓN DE TIEMPO:');
        console.log(`   📈 Total directores procesados: ${est.totalDirectores}`);
        console.log(`   📦 Lotes procesados: ${est.totalLotes} (${est.directoresPorLote} directores/lote)`);
        console.log(`   ⏰ Tiempo estimado inicial: ${est.tiempoEstimadoMinutos} minutos`);
        console.log(`   🚦 Clasificación: ${est.clasificacion}`);
        console.log(`   💡 ${est.recomendacion}`);
        console.log(`   📊 Uso del timeout: ${est.porcentajeDelTimeout}%`);
        console.log(`   🏃 Velocidad de procesamiento: ${est.detalles.velocidadProcesamiento}`);
        
        if (est.excederaTimeout) {
          console.warn(`⚠️  El tiempo estimado podría haber excedido el timeout`);
        }
      } */

      // Mostrar información de tiempo real si está disponible
      /* if (data.estadisticas.tiempoReal) {
        const real = data.estadisticas.tiempoReal;
        console.log('⏰ INFORMACIÓN DE TIEMPO REAL:');
        console.log(`   🕐 Tiempo real: ${real.tiempoRealMinutos} minutos`);
        console.log(`   🏃 Velocidad real: ${real.velocidadRealDirectoresPorMin} directores/min`);
        console.log(`   📊 Diferencia con estimación: ${real.diferenciaPorcentaje > 0 ? '+' : ''}${real.diferenciaPorcentaje}%`);
        console.log(`   ✅ ${real.masRapidoQueEstimacion ? 'Más rápido que lo estimado' : 'Más lento que lo estimado'}`);
        console.log(`   🎯 Eficiencia de estimación: ${real.eficienciaEstimacion}`);
      } */

      /* const mensajeExito = `Reporte generado exitosamente. ${(result.data as any).message}${data.estimacionTiempo ?
          `\n\n📊 Estimación: ${data.estimacionTiempo.tiempoEstimadoMinutos} min (${data.estimacionTiempo.clasificacion})` :
          ''
        }`;
      alert(mensajeExito); */

      return data;

    } catch (error: any) {
      console.error('❌ Error al generar reporte:', error);

      let errorMessage = 'Error desconocido al generar el reporte';

      if (error.code === 'functions/deadline-exceeded') {
        errorMessage = 'El reporte está tardando más de lo esperado. Esto puede ocurrir con grandes volúmenes de datos. Por favor, intenta nuevamente o contacta al administrador del sistema.';
        console.log('⚠️  Timeout del cliente - la función podría seguir ejecutándose en el servidor');
      } else if (error.code === 'functions/unauthenticated') {
        errorMessage = 'No tienes permisos para generar reportes. Por favor, inicia sesión nuevamente.';
      } else if (error.code === 'functions/permission-denied') {
        errorMessage = 'No tienes permisos de administrador para generar reportes.';
      } else if (error.code === 'functions/invalid-argument') {
        errorMessage = 'Parámetros inválidos. Verifica que todos los campos requeridos estén completos.';
      } else if (error.code === 'functions/not-found') {
        errorMessage = 'No se encontraron evaluaciones para el período seleccionado.';
      } else if (error.message) {
        errorMessage = error.message;
      }

      setError(errorMessage);
      throw error;

    } finally {
      setLoading(false);
    }
  };

  const limpiarResultado = () => {
    setResultado(null);
    setError(null);
    setEstimacionPrevia(null); // Limpiar la estimación previa al limpiar el resultado
  };

  return {
    generarReporte,
    loading,
    error,
    resultado,
    limpiarResultado,
    estimacionPrevia,
    calcularEstimacionPrevia,
    mostrarConfirmacionConEstimacion,
    obtenerEstimacionesEscenarios,
    actualizarEstimacionConDatosReales
  };
};