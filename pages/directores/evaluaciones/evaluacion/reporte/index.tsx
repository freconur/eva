import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useRouter } from 'next/router';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';
import { RiLoader4Line } from 'react-icons/ri';
import {
  getFirestore,
  collection,
  getDocs,
  query,
  where,
  doc,
  getDoc,
  onSnapshot,
} from 'firebase/firestore';

import { useGlobalContext, useGlobalContextDispatch } from '@/features/context/GlolbalContext';
import { useReporteDirectores } from '@/features/hooks/useReporteDirectores';
import { useRegistros } from '@/features/hooks/useRegistros';
import { useAgregarEvaluaciones } from '@/features/hooks/useAgregarEvaluaciones';
import { useGenerarPDFReporte } from '@/features/hooks/useGenerarPDFReporte';
import { AppAction } from '@/features/actions/appAction';
import { exportEstudiantesToExcel } from '@/features/utils/excelExport';
import { currentMonth, getAllMonths, getMonthName } from '@/fuctions/dates';
import { sectionByGrade, getGradoTexto } from '@/fuctions/regiones';
import { PreguntasRespuestas, UserEstudiante } from '@/features/types/types';
import PrivateRouteDirectores from '@/components/layouts/PrivateRoutesDirectores';
import Loader from '@/components/loader/loader';
import { TablaPreguntas } from '@/components/tabla-preguntas';
import ReporteEvaluacionPorPregunta from '@/pages/docentes/evaluaciones/tercerNivel/pruebas/prueba/reporte/reporteEvaluacionPorPregunta';

// Modales del sistema
import GuiaBurbujasModal from '@/components/modals/GuiaBurbujasModal';
import GuiaDecisionesModal from '@/components/modals/GuiaDecisionesModal';
import {
  BaremoDecisiones,
  DEFAULT_BAREMO_DECISIONES,
} from '@/components/modals/ConfigurarBaremoModal';
import QuestionDetailPopover from '@/components/reportes/QuestionDetailPopover';

// Módulos especializados del Director
import { useMetricasDirector } from '@/components/reportes/director/useMetricasDirector';
import DirectorTabsNav, { DirectorTabKey } from '@/components/reportes/director/DirectorTabsNav';
import DirectorBrechasTab from '@/components/reportes/director/DirectorBrechasTab';
import DirectorTendenciasTab from '@/components/reportes/director/DirectorTendenciasTab';
import DirectorExportMenu from '@/components/reportes/director/DirectorExportMenu';
import DirectorHeroBanner from '@/components/reportes/director/DirectorHeroBanner';
import {
  RiSparklingLine,
  RiCalendarLine,
  RiTimeLine,
  RiArrowDownSLine,
} from 'react-icons/ri';
import DirectorFiltrosBar, {
  ColumnasVisiblesState,
  FiltrosState,
} from '@/components/reportes/director/DirectorFiltrosBar';
import tabsStyles from '@/components/reportes/director/DirectorTabsNav.module.css';

import styles from './Reporte.module.css';

ChartJS.register(CategoryScale, LinearScale, Title, Tooltip, Legend);

// Guardias persistentes fuera del componente para evitar re-montajes accidentales
let globalLastFetchParams = '';
let globalLastFetchTrendParams = '';

const Reporte = () => {
  const {
    currentUserData,
    reporteDirector,
    preguntasRespuestas,
    loaderReporteDirector,
    evaluacion,
    estudiantesDeEvaluacion,
    docentesDeDirectores,
  } = useGlobalContext();

  const dispatch = useGlobalContextDispatch();
  const route = useRouter();

  // Pestaña activa del Director
  const [activeTab, setActiveTab] = useState<DirectorTabKey>('grilla');

  // Modo de visualización superior: 'compacto' (tradicional) o 'ejecutivo' (con Hero Banner)
  const [bannerMode, setBannerMode] = useState<'compacto' | 'ejecutivo'>(() => {
    if (typeof window !== 'undefined') {
      try {
        const saved = localStorage.getItem('eva_director_banner_mode');
        if (saved === 'ejecutivo' || saved === 'compacto') return saved;
      } catch (e) {
        console.error('Error al leer bannerMode:', e);
      }
    }
    return 'compacto';
  });

  const handleToggleBannerMode = (mode: 'compacto' | 'ejecutivo') => {
    setBannerMode(mode);
    if (typeof window !== 'undefined') {
      try {
        localStorage.setItem('eva_director_banner_mode', mode);
      } catch (e) {
        console.error('Error al guardar bannerMode:', e);
      }
    }
  };

  // Estados de modales interactivos
  const [isBurbujasModalOpen, setIsBurbujasModalOpen] = useState<boolean>(false);
  const [isDecisionesModalOpen, setIsDecisionesModalOpen] = useState<boolean>(false);
  const [questionDetailPopover, setQuestionDetailPopover] = useState<{
    order: number;
    coords: { x: number; y: number };
  } | null>(null);

  // Baremo de alertas pedagógicas - Oficial y centralizado desde la Matriz de Resultados regional
  const [baremo, setBaremo] = useState<BaremoDecisiones>(DEFAULT_BAREMO_DECISIONES);

  useEffect(() => {
    let isMounted = true;
    const fetchBaremoAdmin = async () => {
      try {
        const db = getFirestore();
        const cfgRef = doc(db, 'configuraciones', 'matriz_resultados');
        const snap = await getDoc(cfgRef);
        if (snap.exists() && isMounted) {
          const data = snap.data();
          if (data?.baremoDecisiones) {
            setBaremo({
              critico: Number(data.baremoDecisiones.critico) || DEFAULT_BAREMO_DECISIONES.critico,
              alto: Number(data.baremoDecisiones.alto) || DEFAULT_BAREMO_DECISIONES.alto,
              medio: Number(data.baremoDecisiones.medio) || DEFAULT_BAREMO_DECISIONES.medio,
            });
          }
        }
      } catch (e) {
        console.error('Error al cargar baremo oficial del administrador:', e);
      }
    };
    fetchBaremoAdmin();
    return () => {
      isMounted = false;
    };
  }, []);

  // Filtros de tabla
  const [filtros, setFiltros] = useState<FiltrosState>({
    grado: (route.query.grado as string) || '',
    seccion: (route.query.seccion as string) || '',
    orden: (route.query.orden as string) || '',
    genero: (route.query.genero as string) || '',
    nivel: (route.query.nivel as string) || '',
  });

  const [loadingMonth, setLoadingMonth] = useState<boolean>(false);
  const [loadingExport, setLoadingExport] = useState<boolean>(false);
  const [isMounted, setIsMounted] = useState<boolean>(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  // Permisos globales de acciones para el Director
  const [accionesDirector, setAccionesDirector] = useState({
    exportarGrillaPdf: true,
    exportarExcel: true,
    generarPdfPreguntas: true,
  });
  const [isAuditing, setIsAuditing] = useState(false);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const audited = sessionStorage.getItem('audited_user');
      const realAdmin = sessionStorage.getItem('real_admin_user');
      setIsAuditing(Boolean(audited || realAdmin));
    }
  }, [currentUserData]);

  useEffect(() => {
    const db = getFirestore();
    const brandDocRef = doc(db, 'configuracion', 'branding');
    const unsubscribe = onSnapshot(
      brandDocRef,
      (docSnap) => {
        if (docSnap.exists()) {
          const data = docSnap.data();
          if (data.accionesDirector) {
            setAccionesDirector({
              exportarGrillaPdf: data.accionesDirector.exportarGrillaPdf !== false,
              exportarExcel: data.accionesDirector.exportarExcel !== false,
              generarPdfPreguntas: data.accionesDirector.generarPdfPreguntas !== false,
            });
          }
        }
      },
      (err) => {
        console.error('Error al escuchar permisos globales de accionesDirector:', err);
      }
    );
    return () => unsubscribe();
  }, []);

  const allowExportGrillaPdf = isAuditing || accionesDirector.exportarGrillaPdf !== false;
  const allowExportExcel = isAuditing || accionesDirector.exportarExcel !== false;
  const allowGenerarPdfPreguntas = isAuditing || accionesDirector.generarPdfPreguntas !== false;
  const hasAnyDirectorAction = allowExportGrillaPdf || allowExportExcel || allowGenerarPdfPreguntas;

  // Base de datos de evaluaciones para comparativa
  const [evaluacionesDb, setEvaluacionesDb] = useState<any[]>([]);
  const [loadingEvaluaciones, setLoadingEvaluaciones] = useState<boolean>(false);

  useEffect(() => {
    const loadEvaluaciones = async () => {
      try {
        setLoadingEvaluaciones(true);
        const db = getFirestore();
        const coll = collection(db, 'evaluaciones');
        const q = query(coll, where('tipoDeEvaluacion', '==', '1'));
        const snap = await getDocs(q);
        const list: any[] = [];
        snap.forEach((d) => {
          const data = d.data();
          if (data.active) {
            list.push({ id: d.id, ...data });
          }
        });
        setEvaluacionesDb(list);
      } catch (error) {
        console.error('Error al cargar evaluaciones:', error);
      } finally {
        setLoadingEvaluaciones(false);
      }
    };
    loadEvaluaciones();
  }, []);

  const [columnasVisibles, setColumnasVisibles] = useState<ColumnasVisiblesState>({
    showRC: true,
    showTP: true,
    showPuntaje: true,
    showNivel: true,
    showDniDocente: false,
  });

  const [yearSelected, setYearSelected] = useState<number>(() => {
    const y = route.query.year;
    return y ? Number(y) : new Date().getFullYear();
  });

  const [monthSelected, setMonthSelected] = useState<number>(() => {
    const m = route.query.mes;
    if (m) return Number(m);
    if (evaluacion?.mesDelExamen !== undefined && evaluacion?.mesDelExamen !== null) {
      return Number(evaluacion.mesDelExamen);
    }
    return currentMonth;
  });

  const updateQuery = useCallback(
    (params: Record<string, any>) => {
      if (!route.isReady) return;
      const newQuery = { ...route.query, ...params };
      Object.keys(newQuery).forEach((key) => {
        if (newQuery[key] === '' || newQuery[key] === undefined || newQuery[key] === null) {
          delete newQuery[key];
        }
      });
      route.push({ pathname: route.pathname, query: newQuery }, undefined, { shallow: true });
    },
    [route]
  );

  // Sincronizar URL query con estados
  useEffect(() => {
    if (route.isReady) {
      setFiltros({
        grado: (route.query.grado as string) || '',
        seccion: (route.query.seccion as string) || '',
        orden: (route.query.orden as string) || '',
        genero: (route.query.genero as string) || '',
        nivel: (route.query.nivel as string) || '',
      });
      if (route.query.year) setYearSelected(Number(route.query.year));

      if (evaluacion?.mesDelExamen !== undefined && evaluacion?.mesDelExamen !== null) {
        setMonthSelected(Number(evaluacion.mesDelExamen));
      } else if (route.query.mes) {
        setMonthSelected(Number(route.query.mes));
      }
    }
  }, [route.query, route.isReady, evaluacion?.mesDelExamen]);

  useEffect(() => {
    if (evaluacion?.mesDelExamen !== undefined && evaluacion?.mesDelExamen !== null) {
      const examMonth = Number(evaluacion.mesDelExamen);
      setMonthSelected(examMonth);
      if (route.isReady && Number(route.query.mes) !== examMonth) {
        updateQuery({ mes: examMonth });
      }
    }
  }, [evaluacion?.mesDelExamen, route.isReady, updateQuery]);

  const handleSelectEvaluacion = useCallback(
    (evalId: string, mesDelExamen?: number) => {
      const targetMonth =
        mesDelExamen !== undefined && mesDelExamen !== null
          ? Number(mesDelExamen)
          : monthSelected;
      updateQuery({
        idEvaluacion: evalId,
        mes: targetMonth,
      });
    },
    [monthSelected, updateQuery]
  );

  const yearsAvailable = useMemo(() => {
    const startYear = 2025;
    const endYear = new Date().getFullYear();
    const years = [];
    for (let i = startYear; i <= endYear; i++) {
      years.push(i);
    }
    return years;
  }, []);

  const handleChangeFiltros = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFiltros((prev) => ({ ...prev, [name]: value }));
    updateQuery({ [name]: value });
  };

  const toggleColumna = (columna: keyof ColumnasVisiblesState) => {
    setColumnasVisibles((prev) => ({
      ...prev,
      [columna]: !prev[columna],
    }));
  };

  // Hooks de datos del Director
  const {
    reporteDirectorEstudiantes,
    getGrados,
    estudiantes,
    getAllEvaluacionesDeEstudiantesPorMes,
    datosPorMes,
    promedioGlobal,
    mesesConDataDisponibles,
    promedioPorDocente,
    isLoading,
    filtrosParaReporteDirector,
    obtenerCoberturaDirector,
  } = useReporteDirectores();

  const { getDocentesDeDirectores } = useRegistros();
  const { getPreguntasRespuestas, getEvaluacion } = useAgregarEvaluaciones();

  // Docentes mapeados por DNI
  useEffect(() => {
    if (currentUserData?.dni && currentUserData?.rol === 2) {
      getDocentesDeDirectores(currentUserData.dni);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentUserData?.dni, currentUserData?.rol]);

  const docentesMap = useMemo(() => {
    const map = new Map<string, string>();
    docentesDeDirectores?.forEach((docente) => {
      if (docente.dni) {
        map.set(String(docente.dni), `${docente.nombres} ${docente.apellidos}`);
      }
    });
    return map;
  }, [docentesDeDirectores]);

  // Secciones con datos en la evaluación
  const availableSections = useMemo(() => {
    const baseList = estudiantes;
    if (!baseList || baseList.length === 0) return [];
    const uniqueSectionIds = Array.from(new Set(baseList.map((e) => String(e.seccion))));
    return sectionByGrade.filter((seccion) => uniqueSectionIds.includes(String(seccion.id)));
  }, [estudiantes]);


  // Auto-seleccionar grado de la evaluación para Directores
  useEffect(() => {
    if (!route.isReady) return;
    const gradoEvaluacion = evaluacion?.grado;
    if (currentUserData?.rol === 2 && gradoEvaluacion && !filtros.grado) {
      const gradoId = String(gradoEvaluacion);
      setFiltros((prev: any) => ({ ...prev, grado: gradoId }));
      updateQuery({ grado: gradoId });
    }
  }, [currentUserData?.rol, evaluacion, filtros.grado, updateQuery, route.isReady]);

  const nivelesLeyenda: any[] =
    (evaluacion as any)?.niveles?.length > 0
      ? (evaluacion as any).niveles
      : [
          { nombre: 'satisfactorio', color: 'var(--satisfactorio)' },
          { nombre: 'en proceso', color: 'var(--en-proceso)' },
          { nombre: 'en inicio', color: 'var(--inicio)' },
          { nombre: 'previo al inicio', color: 'var(--previo-al-inicio)' },
        ];

  const handleLimpiarFiltros = () => {
    const gradoDefault =
      currentUserData?.rol === 2 ? String(evaluacion?.grado || filtros.grado) : '';
    setFiltros({
      grado: gradoDefault,
      seccion: '',
      orden: '',
      genero: '',
      nivel: '',
    });
    updateQuery({
      grado: gradoDefault,
      seccion: '',
      orden: '',
      genero: '',
      nivel: '',
    });
  };

  // Preguntas y estadísticas por ítem
  const detectarNumeroOpciones = useMemo(() => {
    if (!preguntasRespuestas || preguntasRespuestas.length === 0) return 4;
    let maxOpciones = 3;
    preguntasRespuestas.forEach((p) => {
      const altsReales =
        p.alternativas?.filter(
          (alt) => alt.descripcion?.toLowerCase() !== 'no respondio'
        ) || [];
      if (altsReales.length > maxOpciones) {
        maxOpciones = altsReales.length;
      }
    });
    return maxOpciones;
  }, [preguntasRespuestas]);

  const preguntasMap = useMemo(() => {
    const map = new Map<string, PreguntasRespuestas>();
    preguntasRespuestas.forEach((pregunta) => {
      if (pregunta.id) {
        map.set(pregunta.id, pregunta);
      }
    });
    return map;
  }, [preguntasRespuestas]);

  const preguntasOrdenadas = useMemo(() => {
    return [...(preguntasRespuestas || [])].sort((a, b) => (a.order || 0) - (b.order || 0));
  }, [preguntasRespuestas]);

  const reporteDirectorOrdenado = useMemo(() => {
    if (!reporteDirector || !preguntasOrdenadas.length) return reporteDirector;
    const estadisticasMap = new Map<string, any>();
    reporteDirector.forEach((stat) => {
      if (stat.id) {
        estadisticasMap.set(stat.id, stat);
      }
    });
    return preguntasOrdenadas.map((pregunta) => {
      const estadistica = estadisticasMap.get(pregunta.id || '');
      if (estadistica) return estadistica;
      return {
        id: pregunta.id,
        a: 0,
        b: 0,
        c: 0,
        d: pregunta.alternativas?.some((alt) => alt.alternativa === 'd') ? 0 : undefined,
        total: 0,
      };
    });
  }, [reporteDirector, preguntasOrdenadas]);

  const reporteCompleto = useMemo(() => {
    if (!reporteDirectorOrdenado || !preguntasRespuestas.length) return [];
    return reporteDirectorOrdenado.map((dat, index) => {
      const pregunta = preguntasMap.get(dat.id || '');
      return {
        pregunta: pregunta?.pregunta || 'Pregunta no encontrada',
        actuacion: pregunta?.preguntaDocente || 'Actuación no encontrada',
        order: pregunta?.order || index + 1,
        id: dat.id || '',
        dataEstadistica: dat,
        respuesta: pregunta?.respuesta || '',
        index: index + 1,
        graficoImagen: '',
      };
    });
  }, [reporteDirectorOrdenado, preguntasMap, preguntasRespuestas.length]);

  const {
    imagenesGeneradas,
    loadingPDF,
    reporteCompletoConImagenes,
    convertirGraficoAImagen,
    handleGenerarPDF,
    limpiarImagenes,
  } = useGenerarPDFReporte({
    reporteCompleto,
    currentUserData,
    titulo: 'Reporte de Evaluación - Directores',
    tipoUsuario: 'Director',
    monthSelected,
  });

  // Limpiar dataFiltrada al montar
  useEffect(() => {
    dispatch({ type: AppAction.DATA_FILTRADA_DIRECTOR_TABLA, payload: [] });
  }, [dispatch]);

  useEffect(() => {
    getPreguntasRespuestas(`${route.query.idEvaluacion}`);
    getEvaluacion(`${route.query.idEvaluacion}`);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentUserData.dni, route.query.idEvaluacion]);

  // Reconstrucción en memoria de respuestas
  const estudiantesBase = useMemo(() => {
    if (!estudiantes || !preguntasRespuestas) return [];
    return estudiantes.map((est) => {
      let respuestasReconstruidas: PreguntasRespuestas[] = [];
      if (Array.isArray(est.respuestas)) {
        respuestasReconstruidas = est.respuestas.map((r) => {
          const globalP = preguntasRespuestas.find(
            (p) => (r.id && p.id === r.id) || (r.order !== undefined && p.order === r.order)
          );
          return { ...r, respuesta: globalP?.respuesta || r.respuesta };
        });
      } else if (est.respuestas && typeof est.respuestas === 'object') {
        respuestasReconstruidas = preguntasRespuestas.map((p) => {
          const alternativaSeleccionada = (est.respuestas as any)[p.id || ''];
          const alternativasReconstruidas =
            p.alternativas?.map((alt) => ({
              ...alt,
              selected:
                !!alt.alternativa &&
                !!alternativaSeleccionada &&
                alt.alternativa.toLowerCase() === alternativaSeleccionada.toLowerCase(),
            })) || [];
          return { ...p, alternativas: alternativasReconstruidas };
        });
      }
      return { ...est, respuestas: respuestasReconstruidas } as UserEstudiante;
    });
  }, [estudiantes, preguntasRespuestas]);

  const estudiantesFiltrados = useMemo(() => {
    return filtrosParaReporteDirector(estudiantesBase, filtros);
  }, [estudiantesBase, filtros, filtrosParaReporteDirector]);

  useEffect(() => {
    dispatch({
      type: AppAction.DATA_FILTRADA_DIRECTOR_TABLA,
      payload: estudiantesFiltrados,
    });
  }, [estudiantesFiltrados, dispatch]);

  // Hook de métricas de Rezago y Decisiones (Secciones x Preguntas)
  const metricasDirector = useMetricasDirector({
    estudiantes: estudiantesFiltrados,
    preguntas: preguntasRespuestas,
    availableSections,
    docentesMap,
    baremo,
  });

  // Carga de estudiantes con guardias
  useEffect(() => {
    const currentFetchKey = `${route.query.idEvaluacion}-${monthSelected}-${yearSelected}-${evaluacion.id}`;
    if (currentUserData.dni && evaluacion.id && monthSelected !== undefined) {
      if (globalLastFetchParams === currentFetchKey) return;
      globalLastFetchParams = currentFetchKey;
      reporteDirectorEstudiantes(
        `${route.query.idEvaluacion}`,
        monthSelected,
        yearSelected,
        currentUserData,
        evaluacion
      )
        .then((res) => {
          const alumnos = res?.estudiantes || [];
          if (evaluacion.id) {
            obtenerCoberturaDirector(evaluacion, alumnos);
          }
        })
        .finally(() => {
          setLoadingMonth(false);
        });
    }
  }, [
    route.query.idEvaluacion,
    currentUserData,
    yearSelected,
    monthSelected,
    evaluacion,
    obtenerCoberturaDirector,
    reporteDirectorEstudiantes,
  ]);

  useEffect(() => {
    getGrados();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const trendKey = `${evaluacion.id}-${yearSelected}`;
    if (evaluacion.id) {
      if (globalLastFetchTrendParams === trendKey) return;
      globalLastFetchTrendParams = trendKey;
      getAllEvaluacionesDeEstudiantesPorMes(evaluacion, yearSelected);
    }
  }, [evaluacion, yearSelected, getAllEvaluacionesDeEstudiantesPorMes]);

  const handleChangeMonth = async (e: React.ChangeEvent<HTMLSelectElement>) => {
    const val = e.target.value;
    if (val === '') return;
    setLoadingMonth(true);
    const newMonth = Number(val);
    limpiarImagenes();
    const gradoDefault =
      currentUserData?.rol === 2 ? String(evaluacion?.grado || filtros.grado) : '';
    setFiltros({
      grado: gradoDefault,
      seccion: '',
      orden: '',
      genero: '',
      nivel: '',
    });
    try {
      setMonthSelected(newMonth);
      updateQuery({ mes: newMonth });
    } catch (error) {
      console.error('Error al cambiar mes:', error);
      setLoadingMonth(false);
    }
  };

  const handleChangeYear = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const val = Number(e.target.value);
    setYearSelected(val);
    updateQuery({ year: val });
  };

  // Handlers de exportación
  const handleExportToExcel = () => {
    setLoadingExport(true);
    try {
      const evalName = evaluacion?.nombre || 'evaluacion';
      const fileName = `reporte_director_${evalName}_${getMonthName(monthSelected)}.xlsx`;
      exportEstudiantesToExcel(estudiantesFiltrados, fileName, preguntasRespuestas);
    } catch (error) {
      console.error('Error al exportar a Excel:', error);
    } finally {
      setLoadingExport(false);
    }
  };

  const handleExportarGrillaPDF = async () => {
    const { exportarGrillaHeatmapPDF } = await import('@/features/utils/exportarGrillaHeatmapPDF');
    setLoadingExport(true);
    try {
      exportarGrillaHeatmapPDF({
        estudiantes: estudiantesFiltrados,
        preguntasRespuestas,
        evaluacion,
        monthSelected,
        nombreDocente:
          `${currentUserData.nombres || ''} ${currentUserData.apellidos || ''}`.trim() || 'Director',
        tipoUsuario: 'Director',
      });
    } catch (error) {
      console.error('Error al exportar grilla:', error);
    } finally {
      setLoadingExport(false);
    }
  };

  const handleExportOption = (type: 'excel' | 'pdf-tabla' | 'pdf-preguntas') => {
    if (type === 'excel') handleExportToExcel();
    else if (type === 'pdf-tabla') handleExportarGrillaPDF();
    else if (type === 'pdf-preguntas') handleGenerarPDF();
  };

  return (
    <>
      {loaderReporteDirector || !isMounted ? (
        <div className={styles.loaderContainer}>
          <div className={styles.loaderContent}>
            <RiLoader4Line className={styles.loaderIcon} />
            <span className={styles.loaderText}>...cargando</span>
          </div>
        </div>
      ) : (
        <div className={styles.mainContainer}>
          <div className={styles.content}>
            {/* Si está activo el modo Ejecutivo, se muestra el Banner Hero de Alto Impacto */}
            {bannerMode === 'ejecutivo' && (
              <DirectorHeroBanner
                evaluacion={evaluacion}
                estudiantesFiltrados={estudiantesFiltrados}
                estudiantesDeEvaluacion={estudiantesDeEvaluacion}
                preguntasRespuestas={preguntasRespuestas}
                metricasDirector={metricasDirector}
                monthSelected={monthSelected}
                yearSelected={yearSelected}
                colegio={currentUserData?.institucion}
                onSwitchToCompact={() => handleToggleBannerMode('compacto')}
              />
            )}

            {/* Barra Superior de Año, Mes, Selector de Vista y Menú de Exportación */}
            <div className="flex flex-wrap items-center justify-between gap-3 w-full mb-6">
              <div className="flex items-center gap-2.5 flex-wrap">
                {/* Selector de Año */}
                <div className="relative inline-flex items-center h-[42px] rounded-xl bg-white border border-slate-200/90 hover:border-slate-300 shadow-2xs transition-colors focus-within:border-blue-500 focus-within:ring-2 focus-within:ring-blue-100">
                  <RiCalendarLine className="absolute left-3 w-4 h-4 text-slate-400 pointer-events-none" />
                  <select
                    className="appearance-none bg-transparent pl-9 pr-8 h-full text-xs sm:text-sm font-semibold text-slate-700 outline-none cursor-pointer w-28 sm:w-32"
                    onChange={handleChangeYear}
                    value={yearSelected}
                    aria-label="Seleccionar año de evaluación"
                  >
                    {yearsAvailable.map((year) => (
                      <option key={year} value={year}>
                        {year}
                      </option>
                    ))}
                  </select>
                  <RiArrowDownSLine className="absolute right-2.5 w-4 h-4 text-slate-400 pointer-events-none" />
                </div>

                {/* Selector de Mes */}
                <div
                  className={`relative inline-flex items-center h-[42px] rounded-xl border shadow-2xs transition-colors ${
                    evaluacion?.mesDelExamen !== undefined && evaluacion?.mesDelExamen !== null
                      ? 'bg-slate-50/80 border-slate-200/90 text-slate-600'
                      : 'bg-white border-slate-200/90 hover:border-slate-300 text-slate-700 focus-within:border-blue-500 focus-within:ring-2 focus-within:ring-blue-100'
                  }`}
                  title={
                    evaluacion?.mesDelExamen !== undefined && evaluacion?.mesDelExamen !== null
                      ? 'Mes asignado a esta evaluación'
                      : 'Seleccionar mes'
                  }
                >
                  <RiTimeLine className="absolute left-3 w-4 h-4 text-slate-400 pointer-events-none" />
                  <select
                    className={`appearance-none bg-transparent pl-9 pr-8 h-full text-xs sm:text-sm font-semibold outline-none w-36 sm:w-44 ${
                      evaluacion?.mesDelExamen !== undefined && evaluacion?.mesDelExamen !== null
                        ? 'cursor-default text-slate-600'
                        : 'cursor-pointer text-slate-700'
                    }`}
                    onChange={handleChangeMonth}
                    value={monthSelected}
                    disabled={true}
                    aria-label="Mes de la evaluación"
                  >
                    {evaluacion?.mesDelExamen !== undefined &&
                    evaluacion?.mesDelExamen !== null ? (
                      (() => {
                        const examMonthId = Number(evaluacion.mesDelExamen);
                        const mes = getAllMonths.find((m) => m.id === examMonthId);
                        return mes ? (
                          <option key={mes.id} value={mes.id}>
                            {mes.name}
                          </option>
                        ) : null;
                      })()
                    ) : (
                      <>
                        <option value="">Mes</option>
                        {getAllMonths
                          .filter((mes) => mesesConDataDisponibles.includes(mes.id))
                          .map((mes) => (
                            <option key={mes.id} value={mes.id}>
                              {mes.name}
                            </option>
                          ))}
                      </>
                    )}
                  </select>
                  {loadingMonth ? (
                    <div className="absolute right-2.5 flex items-center pointer-events-none">
                      <RiLoader4Line className="w-4 h-4 text-slate-400 animate-spin" />
                    </div>
                  ) : (
                    <RiArrowDownSLine className="absolute right-2.5 w-4 h-4 text-slate-400 pointer-events-none" />
                  )}
                </div>
              </div>

              {/* Acciones de la derecha: Selector de Vista (Compacto / Ejecutivo) y Menú de Exportación */}
              <div className="flex items-center gap-2.5 flex-wrap">
                <div
                  className="inline-flex items-center p-1 bg-slate-100 rounded-xl border border-slate-200/90 shadow-2xs h-[42px]"
                  role="group"
                  aria-label="Modo de visualización"
                >
                  <button
                    type="button"
                    onClick={() => handleToggleBannerMode('compacto')}
                    className={`h-full px-3 sm:px-3.5 text-xs font-semibold rounded-lg transition-all duration-150 inline-flex items-center justify-center ${
                      bannerMode === 'compacto'
                        ? 'bg-white text-slate-800 shadow-xs'
                        : 'text-slate-500 hover:text-slate-800'
                    }`}
                    title="Modo tradicional compacto"
                    aria-pressed={bannerMode === 'compacto'}
                  >
                    Compacto
                  </button>
                  <button
                    type="button"
                    onClick={() => handleToggleBannerMode('ejecutivo')}
                    className={`h-full flex items-center gap-1.5 px-3 sm:px-3.5 text-xs font-semibold rounded-lg transition-all duration-150 ${
                      bannerMode === 'ejecutivo'
                        ? 'bg-blue-600 text-white shadow-xs'
                        : 'text-slate-500 hover:text-blue-700 hover:bg-blue-50/50'
                    }`}
                    title="Modo ejecutivo con banner y métricas clave"
                    aria-pressed={bannerMode === 'ejecutivo'}
                  >
                    <RiSparklingLine className="w-3.5 h-3.5" />
                    <span>Ejecutivo</span>
                  </button>
                </div>

                {/* Menú Modular de Exportación */}
                {hasAnyDirectorAction && (
                  <DirectorExportMenu
                    loadingExport={loadingExport}
                    loadingPDF={loadingPDF}
                    disabled={!estudiantesFiltrados || estudiantesFiltrados.length === 0}
                    allowExportGrillaPdf={allowExportGrillaPdf}
                    allowExportExcel={allowExportExcel}
                    allowGenerarPdfPreguntas={allowGenerarPdfPreguntas}
                    imagenesGeneradas={imagenesGeneradas}
                    hasPreguntasConImagenes={reporteCompletoConImagenes.length > 0}
                    onExport={handleExportOption}
                  />
                )}
              </div>
            </div>

            {/* Barra Ergonómica de Pestañas (Tabs) */}
            <DirectorTabsNav
              activeTab={activeTab}
              onChangeTab={setActiveTab}
              totalEstudiantes={estudiantesFiltrados.length}
              totalCritico={metricasDirector.kpis.totalCritico}
              totalPreguntas={preguntasRespuestas.length}
            />

            {/* Contenedor Maestro Tipo Carpeta Integrada (Folder Card Body) */}
            <div className="bg-white border-x-2 border-b-2 border-slate-200 rounded-b-3xl p-4 sm:p-6 shadow-xs -mt-[2px] min-h-[520px]">
              {isLoading || loadingMonth ? (
                <div className="flex flex-col items-center justify-center py-20 min-h-[380px]">
                  <Loader
                    size="large"
                    variant="spinner"
                    text="Cargando datos..."
                    color="#10b981"
                  />
                </div>
              ) : (
                <>
                  {/* TAB 1: ESTUDIANTES Y GRILLA DE RESULTADOS */}
                  {activeTab === 'grilla' && (
                    <div key="grilla" className={tabsStyles.tabContentPanel} role="tabpanel" tabIndex={0}>
                      <DirectorFiltrosBar
                        filtros={filtros}
                        onFilterChange={handleChangeFiltros}
                        evaluacion={evaluacion}
                        availableSections={availableSections}
                        isDirectorRol={currentUserData.rol === 2}
                        columnasVisibles={columnasVisibles}
                        onToggleColumna={toggleColumna}
                        onLimpiarFiltros={handleLimpiarFiltros}
                      />

                      {/* Leyenda de Niveles */}
                      <div className={styles.legendContainer}>
                        <span className={styles.legendTitle}>LEYENDA DE NIVELES:</span>
                        {(nivelesLeyenda as any[]).map((nivel: any, index: number) => (
                          <div key={index} className={styles.legendItem}>
                            <div
                              className={styles.legendCircle}
                              style={{ backgroundColor: nivel.color }}
                            />
                            <span className={styles.legendLabel}>{nivel.nombre}</span>
                          </div>
                        ))}
                      </div>

                      <TablaPreguntas
                        estudiantes={estudiantesFiltrados}
                        preguntasRespuestas={preguntasRespuestas}
                        warningEvaEstudianteSinRegistro={undefined}
                        linkToEdit={`/docentes/evaluaciones/tercerNivel/pruebas/prueba/reporte/actualizar-evaluacion?idExamen=${route.query.idExamen}&mes=${monthSelected}`}
                        customColumns={{
                          showPuntaje: columnasVisibles.showPuntaje,
                          showNivel: columnasVisibles.showNivel,
                          showRC: columnasVisibles.showRC,
                          showTP: columnasVisibles.showTP,
                          showDniDocente: columnasVisibles.showDniDocente,
                        }}
                        showEditButton={false}
                        className={styles.tableWrapper}
                      />
                    </div>
                  )}

                  {/* TAB 2: BRECHAS DE APRENDIZAJE (BURBUJAS Y DECISIONES) */}
                  {activeTab === 'brechas' && (
                    <div key="brechas" className={tabsStyles.tabContentPanel} role="tabpanel" tabIndex={0}>
                      <DirectorBrechasTab
                        metricas={metricasDirector}
                        preguntas={preguntasRespuestas}
                        evaluacion={evaluacion}
                        evaluacionesDb={evaluacionesDb}
                        initialGrado={filtros.grado || evaluacion?.grado}
                        initialSeccion={filtros.seccion}
                        onSelectEvaluacion={handleSelectEvaluacion}
                        onOpenQuestionDetail={(order, coords) =>
                          setQuestionDetailPopover({ order, coords })
                        }
                        onOpenGuiaBurbujas={() => setIsBurbujasModalOpen(true)}
                        onOpenGuiaDecisiones={() => setIsDecisionesModalOpen(true)}
                      />
                    </div>
                  )}

                  {/* TAB 4: TENDENCIAS Y COBERTURA */}
                  {activeTab === 'tendencia' && (
                    <div key="tendencia" className={tabsStyles.tabContentPanel} role="tabpanel" tabIndex={0}>
                      <DirectorTendenciasTab
                        evaluacion={evaluacion}
                        datosPorMes={datosPorMes}
                        mesesConDataDisponibles={mesesConDataDisponibles}
                        promedioGlobal={promedioGlobal}
                        monthSelected={monthSelected}
                        yearSelected={yearSelected}
                        estudiantes={estudiantes}
                        availableSections={availableSections}
                        docentesMap={docentesMap}
                        promedioPorDocente={promedioPorDocente}
                        evaluados={estudiantes.length}
                        pendientes={estudiantesDeEvaluacion.length}
                        listaPendientes={estudiantesDeEvaluacion}
                        estudiantesFiltrados={estudiantesFiltrados}
                        evaluacionesDb={evaluacionesDb}
                        loadingEvaluaciones={loadingEvaluaciones}
                        dniDirector={currentUserData.dni}
                        routeEvaluacionId={route.query.idEvaluacion as string}
                      />
                    </div>
                  )}

                  {/* TAB 5: ANÁLISIS POR PREGUNTA */}
                  {activeTab === 'preguntas' && (
                    <div
                      key="preguntas"
                      className={tabsStyles.tabContentPanel}
                      role="tabpanel"
                      tabIndex={0}
                    >
                      <ReporteEvaluacionPorPregunta
                        dataEstadisticasOrdenadas={reporteDirectorOrdenado}
                        preguntasMap={preguntasMap}
                        detectarNumeroOpciones={detectarNumeroOpciones}
                        warningEvaEstudianteSinRegistro={undefined}
                        convertirGraficoAImagen={() => {}}
                      />
                    </div>
                  )}
                </>
              )}
            </div>

            {/* Renderizado off-screen para asegurar que los gráficos se generen para el PDF */}
            <div
              style={{
                position: 'absolute',
                left: '-9999px',
                top: '-9999px',
                width: '700px',
                height: 'auto',
                overflow: 'hidden',
                pointerEvents: 'none',
              }}
            >
              <ReporteEvaluacionPorPregunta
                dataEstadisticasOrdenadas={reporteDirectorOrdenado}
                preguntasMap={preguntasMap}
                detectarNumeroOpciones={detectarNumeroOpciones}
                warningEvaEstudianteSinRegistro={undefined}
                convertirGraficoAImagen={convertirGraficoAImagen}
                forceOneColumn={true}
              />
            </div>
          </div>
        </div>
      )}

      {/* Modales Compartidos */}
      <GuiaBurbujasModal
        isOpen={isBurbujasModalOpen}
        onClose={() => setIsBurbujasModalOpen(false)}
      />

      <GuiaDecisionesModal
        isOpen={isDecisionesModalOpen}
        onClose={() => setIsDecisionesModalOpen(false)}
        baremo={baremo}
      />

      {questionDetailPopover && (
        <QuestionDetailPopover
          order={questionDetailPopover.order}
          coords={questionDetailPopover.coords}
          onClose={() => setQuestionDetailPopover(null)}
          preguntas={preguntasRespuestas}
          gradoName={`${getGradoTexto(evaluacion?.grado)} - ${evaluacion?.nombre || ''}`}
        />
      )}
    </>
  );
};

Reporte.Auth = PrivateRouteDirectores;

export default Reporte;
