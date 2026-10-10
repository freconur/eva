import PrivateRouteDocentes from '@/components/layouts/PrivateRoutesDocentes';
import { useGlobalContext, useGlobalContextDispatch } from '@/features/context/GlolbalContext';
import { useReporteDocente } from '@/features/hooks/useReporteDocente';
import {
  Alternativa,
  Estudiante,
  PreguntasRespuestas,
  UserEstudiante,
  Evaluaciones,
} from '@/features/types/types';
import { useRouter } from 'next/router';
import React, { useEffect, useState, useMemo, useCallback, useRef } from 'react';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';
import { useAgregarEvaluaciones } from '@/features/hooks/useAgregarEvaluaciones';
import { RiLoader4Line, RiErrorWarningLine, RiCalendarLine, RiGraduationCapLine, RiBuilding4Line, RiSparklingLine } from 'react-icons/ri';
import { MdTableChart, MdTrackChanges, MdTrendingUp, MdShowChart, MdAssignment, MdKeyboardArrowUp } from 'react-icons/md';
import DeleteEstudiante from '@/modals/deleteEstudiante';
import styles from './reporte.module.css';
import { currentMonth, getMonthName } from '@/fuctions/dates';
import { converSeccion, getGradoTexto } from '@/fuctions/regiones';
import { exportEstudiantesToExcel } from '@/features/utils/excelExport';
import { useGenerarPDFReporte } from '@/features/hooks/useGenerarPDFReporte';
import ReporteEvaluacionPorPregunta from './reporteEvaluacionPorPregunta';
import { TablaPreguntas } from '@/components/tabla-preguntas';
import { calculoNivel, calculoPreguntasCorrectas } from '@/features/utils/calculoNivel';
import { getFirestore, collection, query, where, getDocs, doc, getDoc, onSnapshot } from 'firebase/firestore';
import CorregirPuntajesModal from '@/modals/corregirPuntajes';
import EvaluarEstudianteForm from '@/components/evaluar/EvaluarEstudianteForm';
import ActualizarEvaluacionForm from '@/components/evaluar/ActualizarEvaluacionForm';
import Loader from '@/components/loader/loader';

// Modales y componentes analíticos modernos
import GuiaBurbujasModal from '@/components/modals/GuiaBurbujasModal';
import GuiaDecisionesModal from '@/components/modals/GuiaDecisionesModal';
import {
  BaremoDecisiones,
  DEFAULT_BAREMO_DECISIONES,
} from '@/components/modals/ConfigurarBaremoModal';
import QuestionDetailPopover from '@/components/reportes/QuestionDetailPopover';
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
import DirectorFiltrosBar, {
  ColumnasVisiblesState,
  FiltrosState,
} from '@/components/reportes/director/DirectorFiltrosBar';
import tabsStyles from '@/components/reportes/director/DirectorTabsNav.module.css';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend
);

const Reportes = () => {
  const [loading, setLoading] = useState<boolean>(false);
  const [showDeleteEstudiante, setShowDeleteEstudiante] = useState<boolean>(false);
  const [showCorregirPuntajesModal, setShowCorregirPuntajesModal] = useState<boolean>(false);
  const [isEvaluarDrawerOpen, setIsEvaluarDrawerOpen] = useState<boolean>(false);
  const [isActualizarDrawerOpen, setIsActualizarDrawerOpen] = useState<boolean>(false);
  const [editingEstudianteDni, setEditingEstudianteDni] = useState<string | null>(null);
  const route = useRouter();
  const {
    estudiantesDeEvaluacion,
    estudiantes: estudiantesGlob,
    currentUserData,
    dataEstadisticas,
    preguntasRespuestas,
    evaluacion,
    loaderReporteDirector,
    warningEvaEstudianteSinRegistro,
  } = useGlobalContext();

  // Pestaña activa
  const [activeTab, setActiveTab] = useState<DirectorTabKey>('grilla');

  // Modo de visualización superior: 'compacto' o 'ejecutivo'
  const [bannerMode, setBannerMode] = useState<'compacto' | 'ejecutivo'>(() => {
    if (typeof window !== 'undefined') {
      try {
        const saved = localStorage.getItem('eva_docente_banner_mode');
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
        localStorage.setItem('eva_docente_banner_mode', mode);
      } catch (e) {
        console.error('Error al guardar bannerMode:', e);
      }
    }
  };

  // Modo de diseño: 'tabs' (pestañas) o 'cascade' (cascada vertical)
  const [layoutMode, setLayoutMode] = useState<DirectorLayoutMode>(() => {
    if (typeof window !== 'undefined') {
      try {
        const saved = localStorage.getItem('eva_docente_report_layout');
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
        localStorage.setItem('eva_docente_report_layout', mode);
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

  // Configuración de títulos y orden de pestañas
  const { tabLabels, tabOrder } = useDirectorTabsConfig();

  // Control de scroll programático para modo cascada
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

  // Baremo de decisiones pedagógicas y configuración de etapas longitudinales (EDI, EP1, EP2)
  const [baremo, setBaremo] = useState<BaremoDecisiones>(DEFAULT_BAREMO_DECISIONES);
  const [matrizConfigGrados, setMatrizConfigGrados] = useState<Record<string, any>>({});
  const [isConfigLoaded, setIsConfigLoaded] = useState<boolean>(false);

  useEffect(() => {
    let isMountedLocal = true;
    const fetchBaremoAdmin = async () => {
      try {
        const db = getFirestore();
        const cfgRef = doc(db, 'configuraciones', 'matriz_resultados');
        const snap = await getDoc(cfgRef);
        if (snap.exists() && isMountedLocal) {
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
        console.error('Error al cargar baremo y configuración de matriz regional:', e);
      } finally {
        if (isMountedLocal) {
          setIsConfigLoaded(true);
        }
      }
    };
    fetchBaremoAdmin();
    return () => {
      isMountedLocal = false;
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

  // Modo solo lectura si la evaluación está inactiva o cerrada
  const isSoloLectura = Boolean(evaluacion && (!evaluacion.active || evaluacion.cerrada));
  const {
    estudiantesQueDieronExamen,
    estadisticasEstudiantesDelDocente,
    datosPorMes,
    mesesConDataDisponibles,
    añosConDataDisponibles,
    obtenerAñosConData,
    promedioGlobal,
    estudiantesQueDieronExamenPorMes,
    corregirPuntajesEstudiantes,
    loaderCorreccionPuntajes,
    correccionPuntajesExitoso,
    setCorreccionPuntajesExitoso,
    correccionPuntajesError,
    setCorreccionPuntajesError,
  } = useReporteDocente();

  const { getPreguntasRespuestas, getEvaluacion, obtenerEstudianteDeEvaluacion } = useAgregarEvaluaciones();
  const [idEstudiante, setIdEstudiante] = useState<string>('');

  // Permisos globales de acciones para el Docente
  const [accionesDocente, setAccionesDocente] = useState({
    exportarGrillaPdf: true,
    exportarExcel: true,
    generarPdfPreguntas: true,
    actualizarRespuestas: false,
  });
  const [isAuditing, setIsAuditing] = useState(false);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const audited = sessionStorage.getItem('audited_user');
      const realAdmin = sessionStorage.getItem('real_admin_user');
      const nextVal = Boolean(audited || realAdmin);
      setIsAuditing((prev) => (prev !== nextVal ? nextVal : prev));
    }
  }, [currentUserData?.dni]);

  useEffect(() => {
    const db = getFirestore();
    const brandDocRef = doc(db, 'configuracion', 'branding');
    const unsubscribe = onSnapshot(
      brandDocRef,
      (docSnap: any) => {
        if (docSnap.exists()) {
          const data = docSnap.data();
          if (data.accionesDocente) {
            setAccionesDocente({
              exportarGrillaPdf: data.accionesDocente.exportarGrillaPdf !== false,
              exportarExcel: data.accionesDocente.exportarExcel !== false,
              generarPdfPreguntas: data.accionesDocente.generarPdfPreguntas !== false,
              actualizarRespuestas: Boolean(data.accionesDocente.actualizarRespuestas),
            });
          }
        }
      },
      (err: any) => {
        console.error('Error al escuchar permisos globales de accionesDocente:', err);
      }
    );
    return () => unsubscribe();
  }, []);

  const allowExportGrillaPdf = isAuditing || accionesDocente.exportarGrillaPdf !== false;
  const allowExportExcel = isAuditing || accionesDocente.exportarExcel !== false;
  const allowGenerarPdfPreguntas = isAuditing || accionesDocente.generarPdfPreguntas !== false;
  const allowActualizarRespuestas = Boolean(accionesDocente.actualizarRespuestas);
  const hasAnyDocenteAction = allowExportGrillaPdf || allowExportExcel || allowGenerarPdfPreguntas;

  const [yearSelected, setYearSelected] = useState<string>((route.query.year as string) || '');
  const [monthSelected, setMonthSelected] = useState<number>(() => {
    const mesQuery = route.query.mes;
    if (mesQuery !== undefined && mesQuery !== '' && !Array.isArray(mesQuery)) {
      const val = Number(mesQuery);
      if (!isNaN(val)) return val;
    }
    return currentMonth;
  });

  // Filtros unificados de la barra de herramientas
  const [filtros, setFiltros] = useState<FiltrosState>({
    grado: (route.query.grado as string) || '',
    seccion: (route.query.seccion as string) || '',
    orden: (route.query.orden as string) || (route.query.order as string) || '',
    genero: (route.query.genero as string) || '',
    nivel: (route.query.nivel as string) || '',
  });

  const [columnasVisibles, setColumnasVisibles] = useState<ColumnasVisiblesState>({
    showRC: true,
    showTP: true,
    showPuntaje: true,
    showNivel: true,
    showDniDocente: false,
  });

  const toggleColumna = (col: keyof ColumnasVisiblesState) => {
    setColumnasVisibles((prev) => ({ ...prev, [col]: !prev[col] }));
  };

  // Evaluaciones DB para comparativa
  const [evaluacionesDb, setEvaluacionesDb] = useState<any[]>([]);
  const [loadingEvaluaciones, setLoadingEvaluaciones] = useState<boolean>(false);
  const [isMounted, setIsMounted] = useState<boolean>(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  // Cargar lista de todas las evaluaciones de estudiantes disponibles
  useEffect(() => {
    const loadEvaluaciones = async () => {
      try {
        setLoadingEvaluaciones(true);
        const db = getFirestore();
        const coll = collection(db, 'evaluaciones');
        const q = query(coll, where('tipoDeEvaluacion', '==', '1'));
        const snap = await getDocs(q);
        const list: any[] = [];
        snap.forEach((docSnap) => {
          list.push({ id: docSnap.id, ...docSnap.data() });
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

  // Obtener estudiantes pendientes (no evaluados)
  useEffect(() => {
    if (evaluacion.id && monthSelected !== undefined && monthSelected !== null) {
      const unsubscribe = obtenerEstudianteDeEvaluacion(evaluacion, filtros.seccion, `${monthSelected}`);
      return () => {
        if (typeof unsubscribe === 'function') {
          unsubscribe();
        }
      };
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [evaluacion.id, monthSelected, filtros.seccion]);

  // Secciones únicas disponibles
  const seccionesDisponibles = useMemo(() => {
    if (!estudiantesGlob) return [];
    const sections = estudiantesGlob
      .map((est) => String(est.seccion || ''))
      .filter((s): s is string => !!s && s !== '');
    return Array.from(new Set(sections)).sort();
  }, [estudiantesGlob]);

  const availableSections = useMemo(() => {
    return seccionesDisponibles.map((s) => ({
      id: s,
      name: converSeccion(Number(s))?.toUpperCase() || `Sección ${s}`,
    }));
  }, [seccionesDisponibles]);

  const docentesMap = useMemo(() => {
    const nombre = `${currentUserData?.nombres || ''} ${currentUserData?.apellidos || ''}`.trim() || 'Docente';
    return new Map<string, string>([[String(currentUserData?.dni || ''), nombre]]);
  }, [currentUserData]);

  // Sincronizar estados locales con la URL cuando esta cambie
  useEffect(() => {
    if (!route.isReady) return;

    const qYear = route.query.year as string | undefined;
    if (qYear) {
      setYearSelected((prev) => (prev !== qYear ? qYear : prev));
    }

    const mesQuery = route.query.mes;
    if (mesQuery !== undefined && mesQuery !== '' && !Array.isArray(mesQuery)) {
      const val = Number(mesQuery);
      if (!isNaN(val)) {
        setMonthSelected((prev) => (prev !== val ? val : prev));
      }
    }

    setFiltros((prev) => {
      const newGrado = (route.query.grado as string) || prev.grado;
      const newSeccion = (route.query.seccion as string) || prev.seccion;
      const newNivel = (route.query.nivel as string) || prev.nivel;
      const newOrden = (route.query.orden as string) || (route.query.order as string) || prev.orden;
      const newGenero = (route.query.genero as string) || prev.genero;

      if (
        prev.grado === newGrado &&
        prev.seccion === newSeccion &&
        prev.nivel === newNivel &&
        prev.orden === newOrden &&
        prev.genero === newGenero
      ) {
        return prev;
      }

      return {
        ...prev,
        grado: newGrado,
        seccion: newSeccion,
        nivel: newNivel,
        orden: newOrden,
        genero: newGenero,
      };
    });
  }, [
    route.isReady,
    route.query.year,
    route.query.mes,
    route.query.grado,
    route.query.seccion,
    route.query.nivel,
    route.query.orden,
    route.query.order,
    route.query.genero,
  ]);

  // Función para actualizar la URL con los filtros actuales
  const updateQuery = (params: Record<string, any>) => {
    if (!route.isReady) return;

    const newQuery = { ...route.query, ...params };
    Object.keys(newQuery).forEach((key) => {
      if (newQuery[key] === '' || newQuery[key] === undefined || newQuery[key] === null) {
        delete newQuery[key];
      }
    });

    route.push({ pathname: route.pathname, query: newQuery }, undefined, { shallow: true });
  };

  const handleChangeFiltros = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFiltros((prev) => ({ ...prev, [name]: value }));
    updateQuery({ [name]: value, page: 1 });
  };

  const handleSingleFilterChange = (name: keyof FiltrosState, value: string) => {
    setFiltros((prev) => ({ ...prev, [name]: value }));
    updateQuery({ [name]: value, page: 1 });
  };

  const handleLimpiarFiltros = () => {
    const gradoDefault = String(evaluacion?.grado || '');
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
      page: 1,
    });
  };

  // Versión de estudiantes sincronizada con la definición global
  const estudiantesBase = useMemo(() => {
    if (!estudiantesGlob || !preguntasRespuestas || !evaluacion) return [];

    return estudiantesGlob.map((est) => {
      if (!est.respuestas) return est;

      let respuestasReconstruidas: PreguntasRespuestas[] = [];

      if (Array.isArray(est.respuestas)) {
        respuestasReconstruidas = est.respuestas.map((r) => {
          const globalP = preguntasRespuestas.find(
            (p) => (r.id && p.id === r.id) || (r.order !== undefined && p.order === r.order)
          );
          return { ...r, respuesta: globalP?.respuesta || r.respuesta };
        });
      } else if (typeof est.respuestas === 'object') {
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

          return {
            ...p,
            alternativas: alternativasReconstruidas,
          };
        });
      }

      let tempEst = { ...est, respuestas: respuestasReconstruidas } as any;
      tempEst = calculoPreguntasCorrectas(tempEst);
      tempEst = calculoNivel(tempEst, evaluacion);

      return tempEst as Estudiante | UserEstudiante;
    });
  }, [estudiantesGlob, preguntasRespuestas, evaluacion]);

  // Aplicar filtros de la barra de herramientas a los estudiantes
  const estudiantesFiltrados = useMemo(() => {
    let filtered = estudiantesBase;

    // Filtro por Nivel
    if (filtros.nivel) {
      filtered = filtered.filter((est) => {
        if (!est.nivel) return false;
        const nivel = est.nivel.toLowerCase();
        const search = filtros.nivel.toLowerCase();
        if (search === 'inicio') {
          return nivel.includes('inicio') && !nivel.includes('previo');
        }
        return nivel.includes(search);
      });
    }

    // Filtro por Sección
    if (filtros.seccion) {
      filtered = filtered.filter(
        (est) => String(est.seccion || '').toLowerCase() === filtros.seccion.toLowerCase()
      );
    }

    // Filtro por Género
    if (filtros.genero) {
      filtered = filtered.filter(
        (est) => String(est.genero || '').toLowerCase() === filtros.genero.toLowerCase()
      );
    }

    // Ordenamiento
    const currentOrder = Number(filtros.orden) || 0;
    if (currentOrder !== 0) {
      filtered = [...filtered].sort((a, b) => {
        const valA = Number(a.puntaje) || 0;
        const valB = Number(b.puntaje) || 0;
        if (currentOrder === 1) return valA - valB;
        if (currentOrder === 2) return valB - valA;
        return 0;
      });
    }

    return filtered;
  }, [estudiantesBase, filtros.nivel, filtros.seccion, filtros.genero, filtros.orden]);

  // Métricas pedagógicas para Brechas y Decisiones
  const metricasDirector = useMetricasDirector({
    estudiantes: estudiantesBase,
    preguntas: preguntasRespuestas,
    availableSections,
    docentesMap,
    baremo,
  });

  // Handlers de exportación
  const handleExportToExcel = () => {
    setLoading(true);
    try {
      const evalName = evaluacion?.nombre || 'evaluacion';
      const fileName = `estudiantes_${evalName}_${currentUserData.dni}_${getMonthName(monthSelected)}.xlsx`;
      exportEstudiantesToExcel(estudiantesFiltrados, fileName, preguntasRespuestas);
    } catch (error) {
      console.error('Error al exportar a Excel:', error);
    } finally {
      setLoading(false);
    }
  };

  const preguntasMap = useMemo(() => {
    const map = new Map<string, PreguntasRespuestas>();
    preguntasRespuestas.forEach((pregunta) => {
      if (pregunta.id) {
        map.set(pregunta.id, pregunta);
      }
    });
    return map;
  }, [preguntasRespuestas]);

  const dataEstadisticasOrdenadas = useMemo(() => {
    if (!dataEstadisticas || !preguntasRespuestas.length) return dataEstadisticas;

    return [...dataEstadisticas].sort((a, b) => {
      const preguntaA = preguntasMap.get(a.id || '');
      const preguntaB = preguntasMap.get(b.id || '');

      const orderA = preguntaA?.order || 0;
      const orderB = preguntaB?.order || 0;

      return orderA - orderB;
    });
  }, [dataEstadisticas, preguntasMap, preguntasRespuestas.length]);

  const reporteCompleto = useMemo(() => {
    if (!dataEstadisticasOrdenadas || !preguntasRespuestas.length) return [];

    return dataEstadisticasOrdenadas.map((dat, index) => {
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
  }, [dataEstadisticasOrdenadas, preguntasMap, preguntasRespuestas.length]);

  const handleExportarGrillaPDF = async () => {
    const { exportarGrillaHeatmapPDF } = await import('@/features/utils/exportarGrillaHeatmapPDF');

    setLoading(true);
    try {
      exportarGrillaHeatmapPDF({
        estudiantes: estudiantesFiltrados,
        preguntasRespuestas,
        evaluacion,
        monthSelected,
        nombreDocente: `${currentUserData.nombres || ''} ${currentUserData.apellidos || ''}`.trim() || 'Docente',
      });
    } catch (error) {
      console.error('Error al exportar grilla:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleExportOption = (type: 'excel' | 'pdf-tabla' | 'pdf-preguntas') => {
    if (type === 'excel') {
      handleExportToExcel();
    } else if (type === 'pdf-tabla') {
      handleExportarGrillaPDF();
    } else if (type === 'pdf-preguntas') {
      handleGenerarPDF();
    }
  };

  const {
    imagenesGeneradas,
    loadingPDF,
    reporteCompletoConImagenes,
    convertirGraficoAImagen,
    handleGenerarPDF,
  } = useGenerarPDFReporte({
    reporteCompleto,
    currentUserData,
    titulo: 'Reporte de Evaluación - Docente',
    tipoUsuario: 'Docente',
    monthSelected,
  });

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

  const idExamen = (route.query.idExamen as string) || (route.query.idEvaluacion as string) || '';

  useEffect(() => {
    if (idExamen) {
      obtenerAñosConData(idExamen);
      getPreguntasRespuestas(idExamen);
      getEvaluacion(`${idExamen}`);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [idExamen, currentUserData.dni]);

  useEffect(() => {
    if (evaluacion.añoDelExamen) {
      const year = String(evaluacion.añoDelExamen);
      setYearSelected((prev) => (prev !== year ? year : prev));
    }
    if (evaluacion.mesDelExamen) {
      const val = Number(evaluacion.mesDelExamen);
      if (!isNaN(val)) {
        setMonthSelected((prev) => (prev !== val ? val : prev));
      }
    }
  }, [evaluacion.añoDelExamen, evaluacion.mesDelExamen]);

  useEffect(() => {
    if (idExamen && yearSelected && preguntasRespuestas && preguntasRespuestas.length > 0 && evaluacion.id) {
      estudiantesQueDieronExamenPorMes(evaluacion, estudiantesGlob, yearSelected);
      const unsubscribe = estadisticasEstudiantesDelDocente(evaluacion, monthSelected, preguntasRespuestas, yearSelected);
      return () => {
        if (typeof unsubscribe === 'function') {
          unsubscribe();
        }
      };
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [idExamen, currentUserData.dni, evaluacion.id, yearSelected, monthSelected, preguntasRespuestas]);

  const handleShowModalDelete = () => {
    setShowDeleteEstudiante(!showDeleteEstudiante);
  };

  const handleShowCorregirPuntajesModal = () => {
    setShowCorregirPuntajesModal(!showCorregirPuntajesModal);
  };

  const handleCorregirPuntajes = () => {
    corregirPuntajesEstudiantes(
      `${currentUserData.dni}`,
      evaluacion,
      monthSelected,
      estudiantesBase,
      preguntasRespuestas,
      yearSelected
    );
  };

  const handleCerrarModalExito = () => {
    setCorreccionPuntajesExitoso(false);
    setShowCorregirPuntajesModal(false);
  };

  const handleCerrarModalError = () => {
    setCorreccionPuntajesError(false);
    setShowCorregirPuntajesModal(false);
  };

  const hasValidPuntaje = () => {
    return estudiantesFiltrados?.some(
      (estudiante) =>
        estudiante.puntaje !== undefined &&
        estudiante.puntaje !== null &&
        !isNaN(estudiante.puntaje)
    );
  };

  const hasValidNivel = () => {
    return estudiantesFiltrados?.some(
      (estudiante) =>
        estudiante.nivel !== undefined &&
        estudiante.nivel !== null &&
        estudiante.nivel !== '' &&
        estudiante.nivel !== 'sin clasificar'
    );
  };

  // Sincronización precisa de activeTab en Modo Cascada (Scroll Spy robusto)
  useEffect(() => {
    if (layoutMode !== 'cascade') return;

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
  }, [layoutMode, visibleTabOrder]);

  useEffect(() => {
    return () => {
      if (programmaticScrollTimer.current) {
        clearTimeout(programmaticScrollTimer.current);
      }
    };
  }, []);

  // RENDERIZADO TAB 1: Matriz de Respuestas
  const renderGrillaContent = () => (
    <>
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4 sm:mb-5">
        <DirectorFiltrosBar
          filtros={filtros}
          onFilterChange={handleChangeFiltros}
          onSingleFilterChange={handleSingleFilterChange}
          evaluacion={evaluacion}
          availableSections={availableSections}
          isDirectorRol={false}
          columnasVisibles={columnasVisibles}
          onToggleColumna={toggleColumna}
          onLimpiarFiltros={handleLimpiarFiltros}
        />

        {evaluacion.tipoDeEvaluacion === '1' && !isSoloLectura && (
          <button
            onClick={handleShowCorregirPuntajesModal}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs sm:text-sm font-semibold rounded-xl bg-amber-50 hover:bg-amber-100 text-amber-800 border border-amber-200/90 shadow-2xs transition-all cursor-pointer shrink-0 self-start sm:self-auto"
            title="Recalcular puntajes y niveles si se modificaron preguntas"
          >
            <span>🔧</span>
            <span>Corregir Puntajes</span>
          </button>
        )}
      </div>

      {/* Leyenda de Niveles de Logro */}
      {evaluacion.nivelYPuntaje && evaluacion.nivelYPuntaje.length > 0 && (
        <div className={styles.levelLegend}>
          <span className={styles.levelLegendTitle}>Leyenda de Niveles:</span>
          {[...evaluacion.nivelYPuntaje]
            .sort((a, b) => (b.min || 0) - (a.min || 0))
            .map((nivel, idx) => {
              const lowerNivel = (nivel.nivel || '').toLowerCase();
              const colorClass = lowerNivel.includes('satisfactorio')
                ? styles.nivelSatisfactorio
                : lowerNivel.includes('proceso')
                  ? styles.nivelEnProceso
                  : lowerNivel.includes('previo')
                    ? styles.nivelPrevioInicio
                    : lowerNivel.includes('inicio')
                      ? styles.nivelEnInicio
                      : '';

              return (
                <div key={idx} className={styles.levelLegendItem}>
                  <div
                    className={`${styles.levelLegendColor} ${colorClass}`}
                    style={{ backgroundColor: nivel.color }}
                  />
                  <span>{nivel.nivel}</span>
                </div>
              );
            })}
        </div>
      )}

      <div id="tabla-estudiantes-pdf">
        <TablaPreguntas
          estudiantes={estudiantesFiltrados}
          preguntasRespuestas={preguntasRespuestas}
          warningEvaEstudianteSinRegistro={warningEvaEstudianteSinRegistro || undefined}
          showDeleteButton={!isSoloLectura}
          showEditButton={allowActualizarRespuestas}
          onDeleteEstudiante={(dni) => {
            if (isSoloLectura) return;
            handleShowModalDelete();
            setIdEstudiante(dni);
          }}
          onEditEstudiante={(dni) => {
            if (!allowActualizarRespuestas) return;
            setEditingEstudianteDni(dni);
            setIsActualizarDrawerOpen(true);
          }}
          linkToEdit={
            allowActualizarRespuestas
              ? `/docentes/evaluaciones/tercerNivel/pruebas/prueba/reporte/actualizar-evaluacion?idExamen=${idExamen}&mes=${monthSelected}`
              : ''
          }
          customColumns={{
            showPuntaje: hasValidPuntaje() && columnasVisibles.showPuntaje,
            showNivel: hasValidNivel() && columnasVisibles.showNivel,
            showRC: columnasVisibles.showRC,
            showTP: columnasVisibles.showTP,
            showDniDocente: false,
          }}
          className={styles.tableSection}
          currentPage={Number(route.query.page) || 1}
          itemsPerPage={
            route.query.limit === 'all'
              ? 'all'
              : Number(Array.isArray(route.query.limit) ? route.query.limit[0] : route.query.limit) || 10
          }
          onPageChange={(page) => updateQuery({ page })}
          onItemsPerPageChange={(limit) => updateQuery({ limit, page: 1 })}
        />
      </div>
    </>
  );

  // RENDERIZADO TAB 2: Brechas de Aprendizaje
  const renderBrechasContent = () => (
    <DirectorBrechasTab
      metricas={metricasDirector}
      preguntas={preguntasRespuestas}
      evaluacion={evaluacion}
      evaluacionesDb={evaluacionesDb}
      initialGrado={filtros.grado || evaluacion?.grado}
      initialSeccion={filtros.seccion}
      isLoadingData={loading || loaderReporteDirector}
      availableSections={availableSections}
      docentesMap={docentesMap}
      dniDocente={currentUserData?.dni}
      isDocenteView={true}
      yearSelected={Number(yearSelected)}
      baremo={baremo}
      onOpenQuestionDetail={(order, coords) =>
        setQuestionDetailPopover({ order, coords })
      }
      onOpenGuiaBurbujas={() => setIsBurbujasModalOpen(true)}
      onOpenGuiaDecisiones={() => setIsDecisionesModalOpen(true)}
      isAuditing={isAuditing}
    />
  );

  // RENDERIZADO TAB 3: Tendencias y Cobertura (Sin comparativa por docentes)
  const renderTendenciaContent = () => (
    <DirectorTendenciasTab
      evaluacion={evaluacion}
      datosPorMes={datosPorMes}
      mesesConDataDisponibles={mesesConDataDisponibles}
      promedioGlobal={promedioGlobal}
      monthSelected={monthSelected}
      yearSelected={Number(yearSelected)}
      estudiantes={estudiantesBase}
      availableSections={availableSections}
      docentesMap={docentesMap}
      evaluados={estudiantesBase.length}
      pendientes={estudiantesDeEvaluacion.length}
      listaPendientes={estudiantesDeEvaluacion}
      estudiantesFiltrados={estudiantesFiltrados}
      evaluacionesDb={evaluacionesDb}
      loadingEvaluaciones={loadingEvaluaciones}
      dniDocente={currentUserData?.dni}
      isDocenteView={true}
      routeEvaluacionId={idExamen}
      initialGrado={filtros.grado || evaluacion?.grado}
      initialSeccion={filtros.seccion}
      isLoadingData={loading || loaderReporteDirector}
      isAuditing={isAuditing}
    />
  );

  // RENDERIZADO TAB 4: Comparativa Multievaluación
  const renderComparativaContent = () => (
    <DirectorComparativaTab
      evaluacion={evaluacion}
      evaluacionesDb={evaluacionesDb}
      loadingEvaluaciones={loadingEvaluaciones}
      dniDocente={currentUserData?.dni}
      routeEvaluacionId={idExamen}
      monthSelected={monthSelected}
      yearSelected={Number(yearSelected)}
    />
  );

  // RENDERIZADO TAB 5: Reporte Psicopedagógico por Pregunta
  const renderPreguntasContent = () => (
    <ReporteEvaluacionPorPregunta
      dataEstadisticasOrdenadas={dataEstadisticasOrdenadas}
      preguntasMap={preguntasMap}
      detectarNumeroOpciones={detectarNumeroOpciones}
      warningEvaEstudianteSinRegistro={warningEvaEstudianteSinRegistro || undefined}
      convertirGraficoAImagen={() => {}}
    />
  );

  // Metadatos de diseño por sección para el Modo Cascada
  const getSectionMeta = (tabId: DirectorTabKey) => {
    switch (tabId) {
      case 'grilla':
        return {
          icon: MdTableChart,
          iconColor: 'text-blue-600',
          iconBg: 'bg-blue-50 border-blue-200/80',
          description: 'Matriz integral de respuestas por estudiante, puntajes, niveles y registro de aula.',
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
          description: 'Evolución longitudinal por etapas, cobertura institucional y comparativa de aulas.',
          badge: (
            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200/60">
              {estudiantesBase.length} evaluados
            </span>
          ),
        };
      case 'comparativa':
        return {
          icon: MdShowChart,
          iconColor: 'text-indigo-600',
          iconBg: 'bg-indigo-50 border-indigo-200/80',
          description: 'Contraste del rendimiento con otras evaluaciones aplicadas a los estudiantes.',
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
          description: 'Desglose psicométrico por ítem pedagógico, tasa de aciertos y alternativas.',
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
      {showDeleteEstudiante && (
        <DeleteEstudiante
          estudiantes={estudiantesBase}
          idExamen={`${idExamen}`}
          idEstudiante={idEstudiante}
          monthSelected={monthSelected}
          handleShowModalDelete={handleShowModalDelete}
        />
      )}
      <CorregirPuntajesModal
        isOpen={showCorregirPuntajesModal}
        onClose={handleShowCorregirPuntajesModal}
        onConfirm={handleCorregirPuntajes}
        loading={loaderCorreccionPuntajes}
        success={correccionPuntajesExitoso}
        onCloseSuccess={handleCerrarModalExito}
        error={correccionPuntajesError}
        onCloseError={handleCerrarModalError}
      />
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
          preguntas={preguntasRespuestas}
          evaluacionEp1={evaluacion}
          gradoName={getGradoTexto(evaluacion?.grado)}
          onClose={() => setQuestionDetailPopover(null)}
        />
      )}

      {loaderReporteDirector || !isMounted ? (
        <div className={styles.loaderContainer}>
          <div className={styles.loaderContent}>
            <RiLoader4Line className={styles.loaderIcon} />
            <span className={styles.loaderText}>...cargando</span>
          </div>
        </div>
      ) : (
        <div className={styles.mainContainer || styles.container}>
          <div className={styles.content}>
            {/* Banner de solo lectura si la evaluación está concluida o cerrada */}
            {evaluacion && isSoloLectura && (
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.75rem',
                  backgroundColor: allowActualizarRespuestas ? '#eff6ff' : '#fffbeb',
                  border: `1px solid ${allowActualizarRespuestas ? '#bfdbfe' : '#fde68a'}`,
                  borderRadius: '8px',
                  padding: '0.75rem 1rem',
                  marginBottom: '1.25rem',
                  color: allowActualizarRespuestas ? '#1e40af' : '#92400e',
                  fontSize: '0.875rem',
                }}
              >
                <RiErrorWarningLine
                  style={{
                    fontSize: '1.25rem',
                    color: allowActualizarRespuestas ? '#3b82f6' : '#f59e0b',
                    flexShrink: 0,
                  }}
                />
                <div>
                  <strong>Evaluación en Modo Solo Lectura:</strong> Este examen ha concluido o se encuentra cerrado.
                  {allowActualizarRespuestas ? (
                    <span>
                      {' '}
                      <strong>Aviso:</strong> La administración ha habilitado la actualización de respuestas; puedes hacer clic sobre los nombres de los estudiantes para actualizar sus evaluaciones.
                    </span>
                  ) : (
                    <span> La edición de respuestas y registro de nuevos estudiantes están deshabilitados.</span>
                  )}
                </div>
              </div>
            )}

            {/* Modo Ejecutivo: Hero Banner */}
            {bannerMode === 'ejecutivo' && (
              <DirectorHeroBanner
                evaluacion={evaluacion}
                estudiantesFiltrados={estudiantesFiltrados}
                estudiantesDeEvaluacion={estudiantesDeEvaluacion}
                preguntasRespuestas={preguntasRespuestas}
                metricasDirector={metricasDirector}
                monthSelected={monthSelected}
                yearSelected={Number(yearSelected)}
                colegio={currentUserData?.institucion}
                totalEstudiantesMatriculados={estudiantesBase.length + estudiantesDeEvaluacion.length}
                estudiantes={estudiantesBase}
                filtros={filtros}
                layoutMode={layoutMode}
                onChangeLayoutMode={handleToggleLayoutMode}
                onSwitchToCompact={() => handleToggleBannerMode('compacto')}
                hasAnyDirectorAction={hasAnyDocenteAction}
                loadingExport={loading}
                loadingPDF={loadingPDF}
                allowExportGrillaPdf={allowExportGrillaPdf}
                allowExportExcel={allowExportExcel}
                allowGenerarPdfPreguntas={allowGenerarPdfPreguntas}
                imagenesGeneradas={imagenesGeneradas}
                hasPreguntasConImagenes={reporteCompletoConImagenes.length > 0}
                onExport={handleExportOption}
              />
            )}

            {/* Modo Compacto */}
            {bannerMode === 'compacto' && (
              <div className="flex flex-wrap items-center justify-between gap-3 w-full mb-4 sm:mb-6">
                <div className="flex items-center gap-2 flex-wrap">
                  {evaluacion?.grado && (
                    <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold bg-white border border-slate-200/90 text-slate-700 shadow-2xs">
                      <RiGraduationCapLine className="w-4 h-4 text-blue-600" />
                      <span>{getGradoTexto(evaluacion.grado)}</span>
                    </span>
                  )}
                  <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold bg-white border border-slate-200/90 text-slate-700 shadow-2xs">
                    <RiCalendarLine className="w-4 h-4 text-teal-600" />
                    <span>
                      {getMonthName(monthSelected)} {yearSelected}
                    </span>
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

                <div className="flex items-center gap-2.5 flex-wrap">
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
                      className="h-full px-3 sm:px-3.5 text-xs font-semibold rounded-lg bg-white text-slate-800 shadow-xs cursor-pointer"
                      title="Modo tradicional compacto"
                      aria-pressed={true}
                    >
                      Compacto
                    </button>
                    <button
                      type="button"
                      onClick={() => handleToggleBannerMode('ejecutivo')}
                      className="h-full flex items-center gap-1.5 px-3 sm:px-3.5 text-xs font-semibold rounded-lg text-slate-500 hover:text-blue-700 hover:bg-blue-50/50 transition-all duration-150 cursor-pointer"
                      title="Modo ejecutivo con banner y métricas clave"
                      aria-pressed={false}
                    >
                      <RiSparklingLine className="w-3.5 h-3.5" />
                      <span>Ejecutivo</span>
                    </button>
                  </div>

                  {hasAnyDocenteAction && (
                    <DirectorExportMenu
                      loadingExport={loading}
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
                isAuditing={false}
                hideBrechas={isConfigLoaded && !isEtapaConfigurada}
              />
            </div>

            {/* Contenedor del Reporte: Pestañas (Folder Card) o Cascada Vertical Continua */}
            {layoutMode === 'tabs' ? (
              <div className="bg-white border-x-2 border-b-2 border-blue-600 rounded-b-3xl p-4 sm:p-6 shadow-xs -mt-[2px] min-h-[520px]">
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
              </div>
            ) : (
              renderCascadeView()
            )}

            {/* Renderizado off-screen para asegurar que los gráficos se generen siempre para el PDF */}
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
                dataEstadisticasOrdenadas={dataEstadisticasOrdenadas}
                preguntasMap={preguntasMap}
                detectarNumeroOpciones={detectarNumeroOpciones}
                warningEvaEstudianteSinRegistro={warningEvaEstudianteSinRegistro || undefined}
                convertirGraficoAImagen={convertirGraficoAImagen}
                forceOneColumn={true}
              />
            </div>
          </div>
        </div>
      )}

      {/* Backdrop y Drawers de Evaluar y Actualizar */}
      {isEvaluarDrawerOpen && (
        <div className={styles.drawerBackdrop} onClick={() => setIsEvaluarDrawerOpen(false)} />
      )}
      <div className={`${styles.drawerContainer} ${isEvaluarDrawerOpen ? styles.drawerOpen : ''}`}>
        {isEvaluarDrawerOpen && (
          <EvaluarEstudianteForm
            idExamen={`${idExamen}`}
            isInsideDrawer={true}
            onClose={() => setIsEvaluarDrawerOpen(false)}
          />
        )}
      </div>

      {isActualizarDrawerOpen && allowActualizarRespuestas && (
        <div
          className={styles.drawerBackdrop}
          onClick={() => {
            setIsActualizarDrawerOpen(false);
            setEditingEstudianteDni(null);
          }}
        />
      )}
      <div
        className={`${styles.drawerContainer} ${
          isActualizarDrawerOpen && allowActualizarRespuestas ? styles.drawerOpen : ''
        }`}
      >
        {isActualizarDrawerOpen && allowActualizarRespuestas && editingEstudianteDni && (
          <ActualizarEvaluacionForm
            idExamen={`${idExamen}`}
            idEstudiante={editingEstudianteDni}
            mes={String(monthSelected)}
            isInsideDrawer={true}
            onClose={() => {
              setIsActualizarDrawerOpen(false);
              setEditingEstudianteDni(null);
            }}
          />
        )}
      </div>
    </>
  );
};

export default Reportes;
Reportes.Auth = PrivateRouteDocentes;
