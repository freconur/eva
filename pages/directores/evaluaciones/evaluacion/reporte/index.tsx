import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
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
import DirectorComparativaTab from '@/components/reportes/director/DirectorComparativaTab';
import DirectorExportMenu from '@/components/reportes/director/DirectorExportMenu';
import DirectorHeroBanner from '@/components/reportes/director/DirectorHeroBanner';
import DirectorLayoutModeSwitch, {
  DirectorLayoutMode,
} from '@/components/reportes/director/DirectorLayoutModeSwitch';
import { isEvaluacionEnMatriz } from '@/components/reportes/director/useEvaluacionesMatriz';
import {
  useDirectorTabsConfig,
  DEFAULT_DIRECTOR_TAB_ORDER,
  DEFAULT_DIRECTOR_TAB_LABELS,
} from '@/components/reportes/director/useDirectorTabsConfig';
import {
  MdTableChart,
  MdTrackChanges,
  MdTrendingUp,
  MdShowChart,
  MdAssignment,
  MdKeyboardArrowUp,
} from 'react-icons/md';
import {
  RiSparklingLine,
  RiCalendarLine,
  RiTimeLine,
  RiArrowDownSLine,
  RiGraduationCapLine,
  RiBuilding4Line,
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

  // Modo de diseño del reporte: 'tabs' (pestañas independientes) o 'cascade' (cascada vertical continua)
  const [layoutMode, setLayoutMode] = useState<DirectorLayoutMode>(() => {
    if (typeof window !== 'undefined') {
      try {
        const saved = localStorage.getItem('eva_director_report_layout');
        if (saved === 'tabs' || saved === 'cascade') return saved;
      } catch (e) {
        console.error('Error al leer layoutMode:', e);
      }
    }
    return 'tabs';
  });

  const handleToggleLayoutMode = (mode: DirectorLayoutMode) => {
    setLayoutMode(mode);
    if (typeof window !== 'undefined') {
      try {
        localStorage.setItem('eva_director_report_layout', mode);
      } catch (e) {
        console.error('Error al guardar layoutMode:', e);
      }
    }
    if (mode === 'cascade' && activeTab) {
      setTimeout(() => {
        const elem = document.getElementById(`section-${activeTab}`);
        if (elem) {
          elem.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
      }, 150);
    }
  };

  // Configuración de títulos y orden de pestañas sincronizados con Firestore
  const { tabLabels, tabOrder } = useDirectorTabsConfig();

  // Control de scroll programático para evitar bucle con IntersectionObserver
  const isProgrammaticScroll = useRef(false);
  const programmaticScrollTimer = useRef<NodeJS.Timeout | null>(null);

  const handleTabChange = useCallback(
    (key: DirectorTabKey) => {
      setActiveTab(key);
      if (layoutMode === 'cascade') {
        isProgrammaticScroll.current = true;
        if (programmaticScrollTimer.current) {
          clearTimeout(programmaticScrollTimer.current);
        }
        const elem = document.getElementById(`section-${key}`);
        if (elem) {
          elem.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
        programmaticScrollTimer.current = setTimeout(() => {
          isProgrammaticScroll.current = false;
        }, 850);
      }
    },
    [layoutMode]
  );

  // Estados de modales interactivos
  const [isBurbujasModalOpen, setIsBurbujasModalOpen] = useState<boolean>(false);
  const [isDecisionesModalOpen, setIsDecisionesModalOpen] = useState<boolean>(false);
  const [questionDetailPopover, setQuestionDetailPopover] = useState<{
    order: number;
    coords: { x: number; y: number };
  } | null>(null);

  // Baremo de alertas pedagógicas - Oficial y centralizado desde la Matriz de Resultados regional
  const [baremo, setBaremo] = useState<BaremoDecisiones>(DEFAULT_BAREMO_DECISIONES);
  const [matrizConfigGrados, setMatrizConfigGrados] = useState<Record<string, any>>({});
  const [isConfigLoaded, setIsConfigLoaded] = useState<boolean>(false);

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
          if (data?.grados) {
            setMatrizConfigGrados(data.grados);
          }
        }
      } catch (e) {
        console.error('Error al cargar baremo oficial del administrador:', e);
      } finally {
        if (isMounted) {
          setIsConfigLoaded(true);
        }
      }
    };
    fetchBaremoAdmin();
    return () => {
      isMounted = false;
    };
  }, []);

  // Determinar si la evaluación actual forma parte de la configuración EDI, EP1, EP2
  const isEtapaConfigurada = useMemo(() => {
    if (!evaluacion?.id || !matrizConfigGrados) return false;
    return isEvaluacionEnMatriz(evaluacion.id, matrizConfigGrados);
  }, [evaluacion?.id, matrizConfigGrados]);

  // Si Brechas de Aprendizaje no está habilitada para esta evaluación, redireccionar a Grilla
  useEffect(() => {
    if (isConfigLoaded && !isEtapaConfigurada && activeTab === 'brechas') {
      setActiveTab('grilla');
    }
  }, [isConfigLoaded, isEtapaConfigurada, activeTab]);

  // Pestañas visibles según si Brechas está habilitada
  const visibleTabOrder = useMemo(() => {
    return tabOrder.filter((id) => (id === 'brechas' ? isEtapaConfigurada : true));
  }, [tabOrder, isEtapaConfigurada]);

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
  const canEditTabNames = Boolean(isAuditing || currentUserData?.rol === 4 || currentUserData?.perfil?.rol === 4);

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
    (evalId: string, mesDelExamen?: number, newGrado?: number | string) => {
      const targetMonth =
        mesDelExamen !== undefined && mesDelExamen !== null
          ? Number(mesDelExamen)
          : monthSelected;

      const queryParams: Record<string, any> = {
        idEvaluacion: evalId,
        mes: targetMonth,
      };

      let targetGrado = newGrado !== undefined && newGrado !== '' ? String(newGrado) : undefined;
      if (!targetGrado) {
        const found = evaluacionesDb.find((e) => e.id === evalId);
        if (found?.grado !== undefined && found?.grado !== null) {
          targetGrado = String(found.grado);
        }
      }

      if (targetGrado) {
        queryParams.grado = targetGrado;
        if (targetGrado !== filtros.grado) {
          queryParams.seccion = '';
          setFiltros((prev) => ({ ...prev, grado: targetGrado!, seccion: '' }));
        } else {
          setFiltros((prev) => ({ ...prev, grado: targetGrado! }));
        }
      }

      updateQuery(queryParams);
    },
    [monthSelected, evaluacionesDb, filtros.grado, updateQuery]
  );

  const handleSelectGrado = useCallback(
    (newGrado: number | string) => {
      const gradoStr = String(newGrado);
      setFiltros((prev) => ({ ...prev, grado: gradoStr, seccion: '' }));
      updateQuery({ grado: gradoStr, seccion: '' });
    },
    [updateQuery]
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

  const handleSingleFilterChange = (name: keyof FiltrosState, value: string) => {
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
    totalEstudiantesMatriculados,
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

  // Sincronizar activeTab cuando el usuario hace scroll en modo cascada (Scroll Spy robusto)
  useEffect(() => {
    if (layoutMode !== 'cascade' || isLoading || loadingMonth) return;

    let rafId: number | null = null;

    const updateActiveTab = () => {
      if (isProgrammaticScroll.current) return;

      const navEl = document.getElementById('director-tabs-nav-container');
      const stickyBottom = navEl ? Math.max(navEl.getBoundingClientRect().bottom, 60) : 70;
      // Umbral de activación: la sección se considera activa cuando su encabezado alcanza
      // la zona de lectura debajo de las pestañas fijas (+55px de tolerancia).
      const activationOffset = stickyBottom + 55;

      // Detectar si el scroll llegó al final del contenedor con scroll real (requiere desplazamiento previo)
      const contentWrapper = navEl?.closest<HTMLElement>('[class*="contentWrapper"]');
      if (contentWrapper && contentWrapper.scrollTop > 200) {
        const isWrapperBottom =
          contentWrapper.scrollHeight - contentWrapper.scrollTop - contentWrapper.clientHeight <= 40;
        if (isWrapperBottom && visibleTabOrder.length > 0) {
          const lastKey = visibleTabOrder[visibleTabOrder.length - 1];
          setActiveTab((prev) => (prev !== lastKey ? lastKey : prev));
          return;
        }
      } else if (typeof window !== 'undefined' && window.scrollY > 200) {
        const scrollEl = document.scrollingElement || document.documentElement;
        const totalHeight = Math.max(document.body?.scrollHeight || 0, scrollEl?.scrollHeight || 0);
        if (totalHeight > window.innerHeight + 200) {
          const isWindowBottom = window.innerHeight + window.scrollY >= totalHeight - 40;
          if (isWindowBottom && visibleTabOrder.length > 0) {
            const lastKey = visibleTabOrder[visibleTabOrder.length - 1];
            setActiveTab((prev) => (prev !== lastKey ? lastKey : prev));
            return;
          }
        }
      }

      // Encontrar la sección activa en el orden visible
      let activeSectionKey = visibleTabOrder[0];

      for (const tabId of visibleTabOrder) {
        const el = document.getElementById(`section-${tabId}`);
        if (!el) continue;
        const rect = el.getBoundingClientRect();
        if (rect.top <= activationOffset) {
          activeSectionKey = tabId;
        }
      }

      if (activeSectionKey) {
        setActiveTab((prev) => (prev !== activeSectionKey ? activeSectionKey : prev));
      }
    };

    const onScroll = () => {
      if (isProgrammaticScroll.current) return;
      if (rafId !== null) return;
      rafId = window.requestAnimationFrame(() => {
        rafId = null;
        updateActiveTab();
      });
    };

    window.addEventListener('scroll', onScroll, { capture: true, passive: true });
    window.addEventListener('resize', onScroll, { passive: true });

    // Verificación inicial al montar o alternar a modo cascada
    const initialTimer = setTimeout(updateActiveTab, 150);

    return () => {
      window.removeEventListener('scroll', onScroll, { capture: true });
      window.removeEventListener('resize', onScroll);
      clearTimeout(initialTimer);
      if (rafId !== null) {
        window.cancelAnimationFrame(rafId);
      }
    };
  }, [layoutMode, visibleTabOrder, isLoading, loadingMonth]);

  useEffect(() => {
    return () => {
      if (programmaticScrollTimer.current) {
        clearTimeout(programmaticScrollTimer.current);
      }
    };
  }, []);

  // Helper de renderizado: TAB 1 (Grilla y Estudiantes)
  const renderGrillaContent = () => (
    <>
      <DirectorFiltrosBar
        filtros={filtros}
        onFilterChange={handleChangeFiltros}
        onSingleFilterChange={handleSingleFilterChange}
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
    </>
  );

  // Helper de renderizado: TAB 2 (Brechas de Aprendizaje)
  const renderBrechasContent = () => (
    <DirectorBrechasTab
      metricas={metricasDirector}
      preguntas={preguntasRespuestas}
      evaluacion={evaluacion}
      evaluacionesDb={evaluacionesDb}
      initialGrado={filtros.grado || evaluacion?.grado}
      initialSeccion={filtros.seccion}
      isLoadingData={isLoading || loadingMonth}
      availableSections={availableSections}
      docentesMap={docentesMap}
      dniDirector={currentUserData?.dni}
      yearSelected={yearSelected}
      baremo={baremo}
      onOpenQuestionDetail={(order, coords) =>
        setQuestionDetailPopover({ order, coords })
      }
      onOpenGuiaBurbujas={() => setIsBurbujasModalOpen(true)}
      onOpenGuiaDecisiones={() => setIsDecisionesModalOpen(true)}
      isAuditing={canEditTabNames}
    />
  );

  // Helper de renderizado: TAB 3 (Tendencias y Cobertura)
  const renderTendenciaContent = () => (
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
      initialGrado={filtros.grado || evaluacion?.grado}
      initialSeccion={filtros.seccion}
      isLoadingData={isLoading || loadingMonth}
      onSelectEvaluacion={handleSelectEvaluacion}
      onSelectGrado={handleSelectGrado}
      isAuditing={canEditTabNames}
    />
  );

  // Helper de renderizado: TAB 4 (Comparativa Histórica)
  const renderComparativaContent = () => (
    <DirectorComparativaTab
      evaluacion={evaluacion}
      evaluacionesDb={evaluacionesDb}
      loadingEvaluaciones={loadingEvaluaciones}
      dniDirector={currentUserData.dni}
      routeEvaluacionId={route.query.idEvaluacion as string}
      monthSelected={monthSelected}
      yearSelected={yearSelected}
    />
  );

  // Helper de renderizado: TAB 5 (Análisis por Ítem / Preguntas)
  const renderPreguntasContent = () => (
    <ReporteEvaluacionPorPregunta
      dataEstadisticasOrdenadas={reporteDirectorOrdenado}
      preguntasMap={preguntasMap}
      detectarNumeroOpciones={detectarNumeroOpciones}
      warningEvaEstudianteSinRegistro={undefined}
      convertirGraficoAImagen={() => {}}
    />
  );

  // Metadatos de diseño por sección para el modo Cascada
  const getSectionMeta = (tabId: DirectorTabKey) => {
    switch (tabId) {
      case 'grilla':
        return {
          icon: MdTableChart,
          iconColor: 'text-blue-600',
          iconBg: 'bg-blue-50 border-blue-200/80',
          description: 'Matriz integral de resultados por estudiante, puntajes, niveles y respuestas clave.',
          badge: (
            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-semibold bg-blue-50 text-blue-700 border border-blue-200/60">
              {estudiantesFiltrados.length} estudiantes
            </span>
          ),
        };
      case 'brechas':
        return {
          icon: MdTrackChanges,
          iconColor: 'text-amber-600',
          iconBg: 'bg-amber-50 border-amber-200/80',
          description: 'Diagnóstico de rezago pedagógico, dispersión de competencias y matriz de decisiones.',
          badge:
            metricasDirector.kpis.totalCritico > 0 ? (
              <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-semibold bg-rose-50 text-rose-700 border border-rose-200/60">
                {metricasDirector.kpis.totalCritico} críticas
              </span>
            ) : (
              <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200/60">
                Sin alertas
              </span>
            ),
        };
      case 'tendencia':
        return {
          icon: MdTrendingUp,
          iconColor: 'text-emerald-600',
          iconBg: 'bg-emerald-50 border-emerald-200/80',
          description: 'Evolución histórica mensual, cobertura de participación y promedios comparativos.',
          badge: (
            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200/60">
              {estudiantes.length} evaluados
            </span>
          ),
        };
      case 'comparativa':
        return {
          icon: MdShowChart,
          iconColor: 'text-indigo-600',
          iconBg: 'bg-indigo-50 border-indigo-200/80',
          description: 'Análisis comparativo de tendencias con otras evaluaciones estandarizadas de la institución.',
          badge: (
            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-semibold bg-indigo-50 text-indigo-700 border border-indigo-200/60">
              {evaluacionesDb.length} evaluaciones
            </span>
          ),
        };
      case 'preguntas':
        return {
          icon: MdAssignment,
          iconColor: 'text-purple-600',
          iconBg: 'bg-purple-50 border-purple-200/80',
          description: 'Desglose psicométrico por ítem pedagógico, tasa de aciertos y distribución de alternativas.',
          badge: (
            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-semibold bg-purple-50 text-purple-700 border border-purple-200/60">
              {preguntasRespuestas.length} ítems
            </span>
          ),
        };
    }
  };

  // Renderizado continuo vertical en Modo Cascada
  const renderCascadeView = () => {
    if (isLoading || loadingMonth) {
      return (
        <div className="flex flex-col items-center justify-center py-20 min-h-[380px] bg-white rounded-2xl border border-slate-200/90 shadow-2xs">
          <Loader
            size="large"
            variant="spinner"
            text="Cargando datos del reporte..."
            color="#10b981"
          />
        </div>
      );
    }

    return (
      <div className="space-y-6 sm:space-y-8 pb-12">
        {visibleTabOrder.map((tabId) => {
          const meta = getSectionMeta(tabId);
          const Icon = meta.icon;

          return (
            <section
              key={tabId}
              id={`section-${tabId}`}
              className="scroll-mt-24 sm:scroll-mt-28 bg-white rounded-2xl border border-slate-200/90 shadow-2xs hover:shadow-xs transition-shadow duration-200 p-4 sm:p-6"
              aria-label={tabLabels[tabId] || DEFAULT_DIRECTOR_TAB_LABELS[tabId]}
            >
              {/* Cabecera accesible de la Sección en Cascada */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 mb-5 border-b border-slate-100">
                <div className="flex items-start sm:items-center gap-3 min-w-0">
                  <div
                    className={`w-10 h-10 rounded-xl border flex items-center justify-center shrink-0 ${meta.iconBg}`}
                  >
                    <Icon className={`w-5 h-5 ${meta.iconColor}`} />
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-2.5 flex-wrap">
                      <h2 className="text-base sm:text-lg font-bold text-slate-800 tracking-tight leading-snug">
                        {tabLabels[tabId] || DEFAULT_DIRECTOR_TAB_LABELS[tabId]}
                      </h2>
                      {meta.badge}
                    </div>
                    <p className="text-xs text-slate-500 leading-tight mt-0.5">
                      {meta.description}
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
                  className="self-end sm:self-center inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-500 hover:text-blue-600 hover:bg-blue-50/80 active:bg-blue-100/60 rounded-xl transition-all duration-150 cursor-pointer border border-slate-200/80 hover:border-blue-200/80 shrink-0 shadow-2xs"
                  title="Volver a la parte superior del reporte"
                  aria-label="Volver arriba"
                >
                  <MdKeyboardArrowUp className="w-4 h-4 text-slate-400 group-hover:text-blue-600" />
                  <span>Subir</span>
                </button>
              </div>

              {/* Contenido Modular de la Sección */}
              <div>
                {tabId === 'grilla' && renderGrillaContent()}
                {tabId === 'brechas' && renderBrechasContent()}
                {tabId === 'tendencia' && renderTendenciaContent()}
                {tabId === 'comparativa' && renderComparativaContent()}
                {tabId === 'preguntas' && renderPreguntasContent()}
              </div>
            </section>
          );
        })}
      </div>
    );
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
            {/* Si está activo el modo Ejecutivo, se muestra el Banner Hero de Alto Impacto con métricas y acciones integradas */}
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
                totalEstudiantesMatriculados={totalEstudiantesMatriculados}
                estudiantes={estudiantes}
                filtros={filtros}
                layoutMode={layoutMode}
                onChangeLayoutMode={handleToggleLayoutMode}
                onSwitchToCompact={() => handleToggleBannerMode('compacto')}
                hasAnyDirectorAction={hasAnyDirectorAction}
                loadingExport={loadingExport}
                loadingPDF={loadingPDF}
                allowExportGrillaPdf={allowExportGrillaPdf}
                allowExportExcel={allowExportExcel}
                allowGenerarPdfPreguntas={allowGenerarPdfPreguntas}
                imagenesGeneradas={imagenesGeneradas}
                hasPreguntasConImagenes={reporteCompletoConImagenes.length > 0}
                onExport={handleExportOption}
              />
            )}

            {/* Si está activo el modo Compacto, se muestra una barra de control ligera sin selectores redundantes de fecha */}
            {bannerMode === 'compacto' && (
              <div className="flex flex-wrap items-center justify-between gap-3 w-full mb-4 sm:mb-6">
                {/* Contexto Minimalista en modo compacto */}
                <div className="flex items-center gap-2 flex-wrap">
                  {evaluacion?.grado && (
                    <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold bg-white border border-slate-200/90 text-slate-700 shadow-2xs">
                      <RiGraduationCapLine className="w-4 h-4 text-blue-600" />
                      <span>{getGradoTexto(evaluacion.grado)}</span>
                    </span>
                  )}
                  <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold bg-white border border-slate-200/90 text-slate-700 shadow-2xs">
                    <RiCalendarLine className="w-4 h-4 text-teal-600" />
                    <span>{getMonthName(monthSelected)} {yearSelected}</span>
                  </span>
                  {currentUserData?.institucion && (
                    <span
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold bg-white border border-slate-200/90 text-slate-700 shadow-2xs max-w-[220px] truncate"
                      title={currentUserData.institucion}
                    >
                      <RiBuilding4Line className="w-4 h-4 text-purple-600 shrink-0" />
                      <span className="truncate">{currentUserData.institucion}</span>
                    </span>
                  )}
                </div>

                {/* Acciones en modo compacto: Conmutador de vista y Menú de Exportación */}
                <div className="flex items-center gap-2.5 flex-wrap">
                  {/* Conmutador de modo de diseño Pestañas / Cascada */}
                  <DirectorLayoutModeSwitch
                    mode={layoutMode}
                    onChange={handleToggleLayoutMode}
                    variant="light"
                  />

                  <div
                    className="inline-flex items-center p-1 bg-slate-100 rounded-xl border border-slate-200/90 shadow-2xs h-[42px]"
                    role="group"
                    aria-label="Modo de visualización"
                  >
                    <button
                      type="button"
                      onClick={() => handleToggleBannerMode('compacto')}
                      className="h-full px-3 sm:px-3.5 text-xs font-semibold rounded-lg bg-white text-slate-800 shadow-xs"
                      title="Modo tradicional compacto"
                      aria-pressed={true}
                    >
                      Compacto
                    </button>
                    <button
                      type="button"
                      onClick={() => handleToggleBannerMode('ejecutivo')}
                      className="h-full flex items-center gap-1.5 px-3 sm:px-3.5 text-xs font-semibold rounded-lg text-slate-500 hover:text-blue-700 hover:bg-blue-50/50 transition-all duration-150"
                      title="Modo ejecutivo con banner y métricas clave"
                      aria-pressed={false}
                    >
                      <RiSparklingLine className="w-3.5 h-3.5" />
                      <span>Ejecutivo</span>
                    </button>
                  </div>

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
            )}

            {/* Barra Ergonómica de Pestañas (Tabs) / Salto Rápido en Cascada */}
            <div
              id="director-tabs-nav-container"
              className={`transition-all duration-200 ${
                layoutMode === 'cascade'
                  ? 'sticky top-0 z-[300] bg-white/95 backdrop-blur-md pt-2 pb-1.5 mb-6 border-b border-slate-200/80 shadow-2xs'
                  : ''
              }`}
            >
              <DirectorTabsNav
                activeTab={activeTab}
                onChangeTab={handleTabChange}
                totalEstudiantes={estudiantesFiltrados.length}
                totalCritico={metricasDirector.kpis.totalCritico}
                totalPreguntas={preguntasRespuestas.length}
                isAuditing={canEditTabNames}
                hideBrechas={isConfigLoaded && !isEtapaConfigurada}
              />
            </div>

            {/* Contenedor del Reporte: Pestañas (Folder Card) o Cascada Vertical Continua */}
            {layoutMode === 'tabs' ? (
              <div className="bg-white border-x-2 border-b-2 border-blue-600 rounded-b-3xl p-4 sm:p-6 shadow-xs -mt-[2px] min-h-[520px]">
                {(isLoading || loadingMonth) && activeTab !== 'brechas' ? (
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
                        {renderGrillaContent()}
                      </div>
                    )}

                    {/* TAB 2: BRECHAS DE APRENDIZAJE (BURBUJAS Y DECISIONES) */}
                    {activeTab === 'brechas' && isEtapaConfigurada && (
                      <div key="brechas" className={tabsStyles.tabContentPanel} role="tabpanel" tabIndex={0}>
                        {renderBrechasContent()}
                      </div>
                    )}

                    {/* TAB 3: TENDENCIAS Y COBERTURA */}
                    {activeTab === 'tendencia' && (
                      <div key="tendencia" className={tabsStyles.tabContentPanel} role="tabpanel" tabIndex={0}>
                        {renderTendenciaContent()}
                      </div>
                    )}

                    {/* TAB 4: COMPARATIVA HISTÓRICA DE TENDENCIA */}
                    {activeTab === 'comparativa' && (
                      <div key="comparativa" className={tabsStyles.tabContentPanel} role="tabpanel" tabIndex={0}>
                        {renderComparativaContent()}
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
                        {renderPreguntasContent()}
                      </div>
                    )}
                  </>
                )}
              </div>
            ) : (
              renderCascadeView()
            )}

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
