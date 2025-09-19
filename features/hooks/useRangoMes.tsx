import { useState, useCallback } from 'react';
import { useReporteEspecialistas } from './useReporteEspecialistas';
import { useGlobalContext } from '../context/GlolbalContext';
import { User } from '../types/types';
import { getAllMonths } from '@/fuctions/dates';

interface RangoMes {
  mesInicio: number;
  mesFin: number;
  año: number;
  mesesIds: number[];
}

interface DatosMes {
  mes: number;
  datos: any[];
  nombreMes: string;
}

export const useRangoMes = () => {
  const [rangoSeleccionado, setRangoSeleccionado] = useState<RangoMes | null>(null);
  const [datosAcumulados, setDatosAcumulados] = useState<DatosMes[]>([]);
  const [cargando, setCargando] = useState(false);
  const [error, setError] = useState<string>('');

  const { currentUserData } = useGlobalContext();
  const { 
    reporteEspecialistaDeEstudiantes,
    reporteEspecialistaDeDocente,
    getAllReporteDeDirectores 
  } = useReporteEspecialistas();

  const meses = getAllMonths.map(mes => mes.name);

  const actualizarRango = useCallback((mesInicio: number, mesFin: number, año: number, mesesIds: number[]) => {
    const nuevoRango: RangoMes = { mesInicio, mesFin, año, mesesIds };
    setRangoSeleccionado(nuevoRango);
    setError('');
    // Limpiar datos anteriores cuando cambie el rango
    setDatosAcumulados([]);
  }, []);

  const obtenerDatosPorRango = useCallback(async (
    idEvaluacion: string,
    tipoReporte: 'estudiantes' | 'docentes' | 'directores' = 'estudiantes'
  ) => {
    if (!rangoSeleccionado) {
      setError('Debe seleccionar un rango de meses primero');
      return null;
    }

    setCargando(true);
    setError('');

    try {
      const datosAcumulados: DatosMes[] = [];
      
      // Obtener datos para cada mes en el rango
      for (let mes = rangoSeleccionado.mesInicio; mes <= rangoSeleccionado.mesFin; mes++) {
        let datosMes: any[] = [];

        switch (tipoReporte) {
          case 'estudiantes':
            datosMes = await reporteEspecialistaDeEstudiantes(
              idEvaluacion, 
              mes, 
              currentUserData
            ) || [];
            break;
          
          case 'docentes':
            datosMes = await reporteEspecialistaDeDocente(
              idEvaluacion, 
              mes
            ) || [];
            break;
          
          case 'directores':
            datosMes = await getAllReporteDeDirectores(
              idEvaluacion, 
              mes
            ) || [];
            break;
          
          default:
            datosMes = await reporteEspecialistaDeEstudiantes(
              idEvaluacion, 
              mes, 
              currentUserData
            ) || [];
        }

        datosAcumulados.push({
          mes,
          datos: datosMes,
          nombreMes: meses[mes - 1]
        });
      }

      setDatosAcumulados(datosAcumulados);
      return datosAcumulados;

    } catch (error) {
      const mensajeError = error instanceof Error ? error.message : 'Error desconocido al obtener datos';
      setError(`Error al obtener datos: ${mensajeError}`);
      console.error('Error en obtenerDatosPorRango:', error);
      return null;
    } finally {
      setCargando(false);
    }
  }, [rangoSeleccionado, currentUserData, reporteEspecialistaDeEstudiantes, reporteEspecialistaDeDocente, getAllReporteDeDirectores]);

  const obtenerDatosConsolidados = useCallback(() => {
    if (datosAcumulados.length === 0) return null;

    // Consolidar datos de todos los meses
    const datosConsolidados = datosAcumulados.reduce((acumulador, mesActual) => {
      if (mesActual.datos && Array.isArray(mesActual.datos)) {
        mesActual.datos.forEach(item => {
          // Aquí puedes implementar la lógica de consolidación específica
          // según el tipo de datos que estés manejando
          acumulador.push({
            ...item,
            mes: mesActual.mes,
            nombreMes: mesActual.nombreMes
          });
        });
      }
      return acumulador;
    }, [] as any[]);

    return datosConsolidados;
  }, [datosAcumulados]);

  const obtenerEstadisticasPorMes = useCallback(() => {
    if (datosAcumulados.length === 0) return null;

    return datosAcumulados.map(mes => ({
      mes: mes.mes,
      nombreMes: mes.nombreMes,
      cantidadRegistros: mes.datos?.length || 0,
      // Aquí puedes agregar más estadísticas según tus necesidades
      // Por ejemplo: promedio, total, etc.
    }));
  }, [datosAcumulados]);

  const limpiarDatos = useCallback(() => {
    setDatosAcumulados([]);
    setError('');
  }, []);

  const validarRango = useCallback((rango: RangoMes): boolean => {
    if (rango.mesInicio > rango.mesFin) {
      setError('El mes de inicio no puede ser mayor que el mes de fin');
      return false;
    }
    
    if (rango.mesInicio < 0 || rango.mesInicio > 11 || rango.mesFin < 0 || rango.mesFin > 11) {
      setError('Los meses deben estar entre 0 y 11');
      return false;
    }

    setError('');
    return true;
  }, []);

  return {
    // Estado
    rangoSeleccionado,
    datosAcumulados,
    cargando,
    error,
    
    // Acciones
    actualizarRango,
    obtenerDatosPorRango,
    obtenerDatosConsolidados,
    obtenerEstadisticasPorMes,
    limpiarDatos,
    validarRango,
    
    // Utilidades
    meses,
    totalMeses: rangoSeleccionado ? rangoSeleccionado.mesFin - rangoSeleccionado.mesInicio + 1 : 0
  };
};
