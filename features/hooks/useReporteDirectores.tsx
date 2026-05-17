import {
  collection,
  count,
  doc,
  getAggregateFromServer,
  getDoc,
  getDocs,
  getFirestore,
  onSnapshot,
  orderBy,
  query,
  setDoc,
  where,
} from 'firebase/firestore';
import { getFunctions, httpsCallable } from 'firebase/functions';
import { DataEstadisticas, Evaluacion, Grades, GraficoTendenciaNiveles, PromedioGlobalPorMes, Region, User, UserEstudiante } from '../types/types';
import { useGlobalContext, useGlobalContextDispatch } from '../context/GlolbalContext';
import { AppAction } from '../actions/appAction';
import { currentMonth, currentYear, getAllMonths } from '@/fuctions/dates';
import { calculoNivel, calculoNivelProgresivo, calculoPreguntasCorrectas, calculoPromedioGlobalPorGradoEvaluacionPRogresiva } from '../utils/calculoNivel';
import { generarDataGraficoPiechart } from '../utils/generar-data-grafico-piechart';
import { gradosDeColegio } from '@/fuctions/regiones';
import { useState, useCallback } from 'react';

export const useReporteDirectores = () => {
  const dispatch = useGlobalContextDispatch();
  const { currentUserData } = useGlobalContext();
  const db = getFirestore();
  const [estudiantes, setEstudiantes] = useState<UserEstudiante[]>([]);
  const [evaluacionesEstudiantesDirector, setEvaluacionesEstudiantesDirector] = useState<UserEstudiante[]>([]);
  const [promedioGlobal, setPromedioGlobal] = useState<PromedioGlobalPorMes[]>([])
  const [mesesConDataDisponibles, setMesesConDataDisponibles] = useState<number[]>([]);
  const [datosPorMes, setDatosPorMes] = useState<GraficoTendenciaNiveles[]>([])
  const [promedioPorDocente, setPromedioPorDocente] = useState<any[]>([]);
  const [warning, setWarning] = useState<string>("")
  const [isLoading, setIsLoading] = useState<boolean>(false)


  const loadingGraficos = useCallback((value: boolean) => {
    setIsLoading(value)
  }, []);

  const getGrados = useCallback(async () => {
    const refGrados = collection(db, 'grados');
    const q = query(refGrados, orderBy('grado'));
    const res = await getDocs(q);
    const grados: Grades[] = [];
    res.forEach((doc) => {
      grados.push(doc.data());
    });
    dispatch({ type: AppAction.GRADOS, payload: grados });
    return grados;
  }, [db, dispatch]);

  const getAllEvaluacionesDeEstudiantesPorMes = useCallback(async (evaluacion: Evaluacion, year: number) => {
    try {
      if (!evaluacion.id || !currentUserData.dni) return;
      loadingGraficos(true);
      const functions = getFunctions();
      const getReporte = httpsCallable(functions, 'getReporteDirector');

      const response: any = await getReporte({
        idEvaluacion: evaluacion.id,
        year: year,
        dniDirector: currentUserData.dni,
      });

      if (response.data.success) {
        const nuevosMeses = response.data.mesesDisponibles || [];
        setMesesConDataDisponibles(prev => {
          if (JSON.stringify(prev) === JSON.stringify(nuevosMeses)) return prev;
          return nuevosMeses;
        });

        if (response.data.datosPorMes) setDatosPorMes(response.data.datosPorMes);
        if (response.data.promedioGlobal) setPromedioGlobal(response.data.promedioGlobal);
        if (response.data.promedioPorDocente && response.data.promedioPorDocente.length > 0) {
          setPromedioPorDocente(response.data.promedioPorDocente);
        }
      }
    } catch (error) {
      console.error('Error en getAllEvaluacionesDeEstudiantesPorMes (CF):', error);
    } finally {
      setIsLoading(false);
    }
  }, [currentUserData.dni]);

  const reporteDirectorEstudiantes = useCallback(async (
    idEvaluacion: string,
    month: number,
    year: number,
    currentUserData: User,
    evaluacion: Evaluacion
  ) => {
    try {
      loadingGraficos(true);
      const functions = getFunctions();
      const getReporte = httpsCallable(functions, 'getReporteDirector');

      const response: any = await getReporte({
        idEvaluacion,
        month,
        year,
        dniDirector: currentUserData.dni,
      });

      console.log("DEBUG-HOOK: Cloud Function getReporteDirector response:", response.data);

      if (response.data.success) {
        const { 
          estudiantes: alumnos, 
          estadisticas, 
          mesesDisponibles, 
          datosPorMes: trendData, 
          promedioGlobal: avgData,
          promedioPorDocente: teacherData
        } = response.data;

        setEstudiantes(alumnos || []);
        setMesesConDataDisponibles(mesesDisponibles || []);

        if (trendData) setDatosPorMes(trendData);
        if (avgData) setPromedioGlobal(avgData);
        if (teacherData && teacherData.length > 0) {
          setPromedioPorDocente(teacherData);
        }

        dispatch({ type: AppAction.REPORTE_DIRECTOR, payload: estadisticas });

        dispatch({
          type: AppAction.ALL_RESPUESTAS_ESTUDIANTES_DIRECTOR,
          payload: alumnos || [],
        });

        return {
          estudiantes: alumnos || [],
          promedioPorDocente: teacherData || []
        };
      }
      return { estudiantes: [], promedioPorDocente: [] };
    } catch (error) {
      console.error('Error en reporteDirectorEstudiantes (CF):', error);
      return { estudiantes: [], promedioPorDocente: [] };
    } finally {
      setIsLoading(false);
    }
  }, [currentUserData.dni, dispatch]);

  const filtrosParaReporteDirector = useCallback((estudiantes: UserEstudiante[], filtros: {
    grado: string;
    seccion: string;
    orden: string;
    genero: string;
    nivel: string;
  }) => {
    if (!filtros.grado && !filtros.seccion && !filtros.genero && !filtros.orden && !filtros.nivel) {
      return estudiantes;
    }

    let estudiantesFiltrados = estudiantes.filter((estudiante) => {
      const cumpleGrado = !filtros.grado || estudiante.grado?.toString() === filtros.grado;
      const cumpleSeccion = !filtros.seccion || estudiante.seccion?.toString() === filtros.seccion;
      const cumpleGenero = !filtros.genero || estudiante.genero?.toString() === filtros.genero;

      let cumpleNivel = true;
      if (filtros.nivel) {
        if (!estudiante.nivel) {
          cumpleNivel = false;
        } else {
          const nivelEst = estudiante.nivel.toLowerCase();
          const nivelBusqueda = filtros.nivel.toLowerCase();
          if (nivelBusqueda === 'inicio') {
            cumpleNivel = nivelEst.includes('inicio') && !nivelEst.includes('previo');
          } else {
            cumpleNivel = nivelEst.includes(nivelBusqueda);
          }
        }
      }

      return cumpleGrado && cumpleSeccion && cumpleGenero && cumpleNivel;
    });

    if (filtros.orden) {
      switch (filtros.orden) {
        case 'asc':
          estudiantesFiltrados.sort((a, b) => Number(a.puntaje || 0) - Number(b.puntaje || 0));
          break;
        case 'desc':
          estudiantesFiltrados.sort((a, b) => Number(b.puntaje || 0) - Number(a.puntaje || 0));
          break;
        default:
          break;
      }
    }

    return estudiantesFiltrados;
  }, []);

  const reporteToTableDirector = (
    data: UserEstudiante[],
    {
      grado,
      seccion,
      orden,
      genero,
    }: { grado: string; seccion: string; orden: string; genero: string },
    idDirector: string,
    idEvaluacion: string
  ) => {
    const dataFiltrada = data?.filter((estudiante) => {
      if (!grado && !seccion && !genero) return true;
      const cumpleGrado = !grado || estudiante.grado?.toString() === grado;
      const cumpleSeccion = !seccion || estudiante.seccion?.toString() === seccion;
      const cumpleGenero = !genero || estudiante.genero?.toString() === genero;
      return cumpleGrado && cumpleSeccion && cumpleGenero;
    });

    let dataOrdenada = [...dataFiltrada];
    if (orden) {
      switch (orden) {
        case 'asc':
          dataOrdenada.sort((a, b) => Number(a.puntaje || 0) - Number(b.puntaje || 0));
          break;
        case 'desc':
          dataOrdenada.sort((a, b) => Number(b.puntaje || 0) - Number(a.puntaje || 0));
          break;
        default:
          break;
      }
    }

    dispatch({ type: AppAction.DATA_FILTRADA_DIRECTOR_TABLA, payload: dataOrdenada });
    return dataOrdenada;
  };

  const obtenerCoberturaDirector = useCallback(async (evaluacion: Evaluacion, alumnosEvaluados?: UserEstudiante[]) => {
    try {
      if (!evaluacion.id || !currentUserData.dni) return;

      const qProfesores = query(
        collection(db, 'usuarios'),
        where('dniDirector', '==', currentUserData.dni),
        where('rol', '==', 3), 
        where('grados', 'array-contains', Number(evaluacion.grado))
      );

      const snapshotProfesores = await getDocs(qProfesores);

      if (snapshotProfesores.empty) {
        dispatch({ type: AppAction.ESTUDIANTES_DE_EVALUACION, payload: [] });
        return;
      }

      const promesasEstudiantes = snapshotProfesores.docs.map(async (docProfesor) => {
        const qEstudiantes = query(
          collection(db, `usuarios/${docProfesor.id}/estudiantes-docentes`),
          where('grado', '==', `${evaluacion.grado}`)
        );
        const snapEst = await getDocs(qEstudiantes);
        return snapEst.docs.map(d => ({ ...d.data(), id: d.id } as UserEstudiante));
      });

      const resultadosEstudiantes = await Promise.all(promesasEstudiantes);

      const uniqueEstudiantesMap = new Map<string, UserEstudiante>();
      resultadosEstudiantes.flat().forEach(est => {
        if (est.dni) uniqueEstudiantesMap.set(String(est.dni), est);
      });

      const todosLosEstudiantesDelGrado = Array.from(uniqueEstudiantesMap.values());

      const baseEvaluados = alumnosEvaluados || estudiantes;
      const evaluadosDnis = new Set(baseEvaluados.map(e => String(e.dni)));

      const listaPendientes = todosLosEstudiantesDelGrado.filter(
        est => !evaluadosDnis.has(String(est.dni))
      );

      dispatch({
        type: AppAction.ESTUDIANTES_DE_EVALUACION,
        payload: listaPendientes,
      });

    } catch (error) {
      console.error('Error al obtener cobertura director:', error);
      dispatch({ type: AppAction.ESTUDIANTES_DE_EVALUACION, payload: [] });
    }
  }, [currentUserData.dni, db, dispatch, estudiantes]);

  // --- MÉTODOS DE COMPATIBILIDAD REGIONAL ---
  const resetReporteRegional = useCallback(() => {
    dispatch({ type: AppAction.REPORTE_REGIONAL, payload: [] });
  }, [dispatch]);

  const resetReporteGlobal = useCallback(() => {
    dispatch({ type: AppAction.REPORTE_REGIONAL, payload: [] });
  }, [dispatch]);

  const getRegiones = useCallback(async () => {
    const regionRef = collection(db, 'region');
    const queryRegiones = await getDocs(regionRef);
    const arrayRegiones: Region[] = [];
    queryRegiones.forEach((doc) => {
      arrayRegiones.push(doc.data() as Region);
    });
    dispatch({ type: AppAction.REGIONES, payload: arrayRegiones });
    return arrayRegiones;
  }, [db, dispatch]);

  const reporteRegionales = useCallback(async (regionValue: number, idEvaluacion: string) => {
    resetReporteRegional();
  }, [resetReporteRegional]);

  const reporteRegionalGlobal = useCallback(async (idEvaluacion: string) => {
    resetReporteRegional();
  }, [resetReporteRegional]);

  return {
    estudiantes,
    setEstudiantes,
    promedioGlobal,
    mesesConDataDisponibles,
    datosPorMes,
    promedioPorDocente,
    isLoading,
    setIsLoading,
    warning,
    reporteDirectorEstudiantes,
    obtenerCoberturaDirector,
    getAllEvaluacionesDeEstudiantesPorMes,
    getGrados,
    filtrosParaReporteDirector,
    reporteToTableDirector,
    getRegiones,
    reporteRegionales,
    resetReporteRegional,
    reporteRegionalGlobal,
    resetReporteGlobal
  };
};
