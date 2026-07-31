import { useGlobalContext } from '@/features/context/GlolbalContext';
import { useReporteDirectores } from '@/features/hooks/useReporteDirectores';
import { useRegistros } from '@/features/hooks/useRegistros';
import { useRouter } from 'next/router';
import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';
import {
  sectionByGrade,
  ordernarAscDsc,
  genero,
  convertGrade,
  converSeccion,
  gradosDeColegio,
  getGradoTexto,
} from '@/fuctions/regiones';
import { useAgregarEvaluaciones } from '@/features/hooks/useAgregarEvaluaciones';
import { DataEstadisticas, PreguntasRespuestas, UserEstudiante } from '@/features/types/types';
import { RiLoader4Line, RiSettings4Line, RiArrowDownSLine, RiSearchLine, RiCloseLine, RiErrorWarningLine, RiFileExcel2Line, RiFilePdfLine } from 'react-icons/ri';
import { IoIosArrowDown } from 'react-icons/io';
import { HiOutlineDownload } from 'react-icons/hi';
import styles from './Reporte.module.css';
import { currentMonth, getAllMonths, getMonthName } from '@/fuctions/dates';
import { exportEstudiantesToExcel } from '@/features/utils/excelExport';
import PrivateRouteDirectores from '@/components/layouts/PrivateRoutesDirectores';
import { useGlobalContextDispatch } from '@/features/context/GlolbalContext';
import { AppAction } from '@/features/actions/appAction';
import { generarPDFReporte } from '@/features/utils/pdfExportEstadisticasDocentes';
import { useGenerarPDFReporte } from '@/features/hooks/useGenerarPDFReporte';
import { TablaPreguntas } from '@/components/tabla-preguntas';
import GraficoTendenciaColegio from '@/components/grafico-tendencia';
import GraficoTendencia from '@/components/reportes/graficoTendencia';
import { generarDataGraficoPiechart } from '@/features/utils/generar-data-grafico-piechart';
import ReporteEvaluacionPorPregunta from '@/pages/docentes/evaluaciones/tercerNivel/pruebas/prueba/reporte/reporteEvaluacionPorPregunta';
import Loader from '@/components/loader/loader';
import { getFirestore, collection, getDocs, query, where } from 'firebase/firestore';
import accordionStyles from '@/components/reportes/Acordeon.module.css';
ChartJS.register(
  CategoryScale,
  LinearScale,
  Title,
  Tooltip,
  Legend
);

// Guardias persistentes fuera del componente para sobrevivir a re-montajes accidentales
let globalLastFetchParams = "";
let globalLastFetchTrendParams = "";

const Reporte = () => {
  const {
    currentUserData,
    reporteDirector,
    preguntasRespuestas,
    loaderReporteDirector,
    allRespuestasEstudiantesDirector,
    dataFiltradaDirectorTabla,
    evaluacion,
    estudiantesDeEvaluacion,
  } = useGlobalContext();

  const dispatch = useGlobalContextDispatch();
  const route = useRouter();
  const [filtros, setFiltros] = useState({
    grado: (route.query.grado as string) || '',
    seccion: (route.query.seccion as string) || '',
    orden: (route.query.orden as string) || '',
    genero: (route.query.genero as string) || '',
    nivel: (route.query.nivel as string) || '',
  });
  const [loadingMonth, setLoadingMonth] = useState<boolean>(false);
  const [loadingExport, setLoadingExport] = useState<boolean>(false);
  const [isOpen, setIsOpen] = useState<boolean>(false);
  const [showConfig, setShowConfig] = useState<boolean>(false);
  const [mostrarGraficos, setMostrarGraficos] = useState<boolean>(false);
  const [mostrarReportePreguntas, setMostrarReportePreguntas] = useState<boolean>(false);
  const configRef = useRef<HTMLDivElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const [isMounted, setIsMounted] = useState<boolean>(false);
  useEffect(() => {
    setIsMounted(true);
  }, []);

  // Estados para el custom searchable selector de evaluación (Base)
  const [evaluacionesDb, setEvaluacionesDb] = useState<any[]>([]);
  const [loadingEvaluaciones, setLoadingEvaluaciones] = useState<boolean>(false);

  // Estados para la comparación de evaluaciones
  const [evaluacionesAComparar, setEvaluacionesAComparar] = useState<string[]>([]);
  const [isCompDropdownOpen, setIsCompDropdownOpen] = useState<boolean>(false);
  const [searchCompQuery, setSearchCompQuery] = useState<string>('');
  const compDropdownRef = useRef<HTMLDivElement>(null);

  // Click outside detector para cerrar el selector de comparativa
  useEffect(() => {
    const handleClickOutsideComp = (event: MouseEvent) => {
      if (compDropdownRef.current && !compDropdownRef.current.contains(event.target as Node)) {
        setIsCompDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutsideComp);
    return () => document.removeEventListener('mousedown', handleClickOutsideComp);
  }, []);

  const evaluacionesCompFiltradas = useMemo(() => {
    let list = evaluacionesDb.filter((ev) => ev.id !== evaluacion?.id);
    if (searchCompQuery.trim()) {
      const q = searchCompQuery.toLowerCase().trim();
      list = list.filter((ev) => {
        const nombreMatch = (ev.nombre || '').toLowerCase().includes(q);
        const gradoTexto = getGradoTexto(ev.grado).toLowerCase();
        return nombreMatch || gradoTexto.includes(q);
      });
    }
    return list;
  }, [evaluacionesDb, evaluacion?.id, searchCompQuery]);

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
        snap.forEach((doc) => {
          list.push({ id: doc.id, ...doc.data() });
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



  // Cerrar el menú de configuración al hacer click fuera
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (configRef.current && !configRef.current.contains(event.target as Node)) {
        setShowConfig(false);
      }
    };

    if (showConfig) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showConfig]);

  // Cerrar el dropdown de exportación al hacer click fuera
  useEffect(() => {
    const handleClickOutsideExport = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutsideExport);
    return () => document.removeEventListener('mousedown', handleClickOutsideExport);
  }, []);

  const [columnasVisibles, setColumnasVisibles] = useState({
    showRC: true,
    showTP: true,
    showPuntaje: true,
    showNivel: true,
    showDniDocente: false // Por defecto oculto para directores a menos que lo activen
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

  const updateQuery = useCallback((params: Record<string, any>) => {
    if (!route.isReady) return;

    const newQuery = { ...route.query, ...params };
    Object.keys(newQuery).forEach(key => {
      if (newQuery[key] === '' || newQuery[key] === undefined || newQuery[key] === null) {
        delete newQuery[key];
      }
    });

    route.push({ pathname: route.pathname, query: newQuery }, undefined, { shallow: true });
  }, [route]);

  // Sincronizar estados locales con la URL cuando esta cambie
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

  // Sincronizar mes con mesDelExamen de la evaluación
  useEffect(() => {
    if (evaluacion?.mesDelExamen !== undefined && evaluacion?.mesDelExamen !== null) {
      const examMonth = Number(evaluacion.mesDelExamen);
      setMonthSelected(examMonth);
      if (route.isReady && Number(route.query.mes) !== examMonth) {
        updateQuery({ mes: examMonth });
      }
    }
  }, [evaluacion?.mesDelExamen, route.isReady, updateQuery]);

  useEffect(() => {
    console.log("EVA-LOG: >>> Componente Reporte MONTADO <<<");
    return () => console.log("EVA-LOG: <<< Componente Reporte DESMONTADO <<<");
  }, []);

  const yearsAvailable = useMemo(() => {
    const startYear = 2025;
    const endYear = new Date().getFullYear();
    const years = [];
    for (let i = startYear; i <= endYear; i++) {
      years.push(i);
    }
    return years;
  }, []);


  // Eliminar el bloque de aquí porque está antes de la inicialización de currentUserData

  const handleChangeFiltros = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFiltros(prev => ({ ...prev, [name]: value }));
    updateQuery({ [name]: value });
  };

  const toggleColumna = (columna: keyof typeof columnasVisibles) => {
    setColumnasVisibles(prev => ({
      ...prev,
      [columna]: !prev[columna]
    }));
  };

  // Eliminado de aquí para moverse después de la inicialización de currentUserData

  const hasValidPuntaje = () => {
    return estudiantes?.some(
      (estudiante) =>
        estudiante.puntaje !== undefined &&
        estudiante.puntaje !== null &&
        !isNaN(estudiante.puntaje)
    );
  };

  // Verificar si existen valores válidos para nivel
  const hasValidNivel = () => {
    return estudiantes?.some(
      (estudiante) =>
        estudiante.nivel !== undefined &&
        estudiante.nivel !== null &&
        estudiante.nivel !== '' &&
        estudiante.nivel !== 'sin clasificar'
    );
  };
  const {
    reporteToTableDirector,
    reporteDirectorEstudiantes,
    getGrados,
    estudiantes,
    setEstudiantes,
    getAllEvaluacionesDeEstudiantesPorMes,
    datosPorMes,
    promedioGlobal,
    mesesConDataDisponibles,
    promedioPorDocente,
    warning,
    setIsLoading,
    isLoading,
    filtrosParaReporteDirector,
    obtenerCoberturaDirector
  } = useReporteDirectores();

  // Ya no usamos useRef locales, sino las variables globales de arriba para diagnosticar re-montajes
  const lastFetchParams = { current: globalLastFetchParams };
  const lastFetchTrendParams = { current: globalLastFetchTrendParams };

  // Función para actualizar los guardias globales
  const setGlobalFetchParams = (val: string) => {
    globalLastFetchParams = val;
    lastFetchParams.current = val;
  };

  const setGlobalTrendParams = (val: string) => {
    globalLastFetchTrendParams = val;
    lastFetchTrendParams.current = val;
  };

  const availableSections = useMemo(() => {
    const baseList = estudiantes;
    if (!baseList || baseList.length === 0) return [];

    // Extraer IDs de secciones únicas de los estudiantes cargados originalmente para el mes/año
    const uniqueSectionIds = Array.from(new Set(baseList.map(e => String(e.seccion))));

    // Filtrar la lista maestra de secciones para incluir solo las que tienen datos
    return sectionByGrade.filter(seccion => uniqueSectionIds.includes(String(seccion.id)));
  }, [estudiantes]);

  // Mapeo de docentes para mostrar nombres en el gráfico
  const { docentesDeDirectores } = useGlobalContext();
  const { getDocentesDeDirectores } = useRegistros();

  useEffect(() => {
    if (currentUserData?.dni && currentUserData?.rol === 2) {
      getDocentesDeDirectores(currentUserData.dni);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentUserData?.dni, currentUserData?.rol]);

  const docentesMap = useMemo(() => {
    const map = new Map<string, string>();
    docentesDeDirectores?.forEach(docente => {
      if (docente.dni) {
        map.set(String(docente.dni), `${docente.nombres} ${docente.apellidos}`);
      }
    });
    return map;
  }, [docentesDeDirectores]);

  // Cálculo de promedios y distribución por sección para el gráfico comparativo
  const promedioPorSeccion = useMemo(() => {
    if (availableSections.length === 0) return [];

    return availableSections.map(seccionObj => {
      const seccionId = String(seccionObj.id);
      const estudiantesSeccion = estudiantes.filter(est => String(est.seccion) === seccionId);

      const docentesUnicos = Array.from(new Set(
        estudiantesSeccion
          .map(est => est.dniDocente ? docentesMap.get(String(est.dniDocente)) : null)
          .filter(Boolean)
      ));
      const docenteNombre = docentesUnicos.length > 0 ? docentesUnicos.join(", ") : undefined;

      const totalPuntaje = estudiantesSeccion.reduce((acc, est) => acc + (est.puntaje || 0), 0);
      const promedio = estudiantesSeccion.length > 0 ? totalPuntaje / estudiantesSeccion.length : 0;

      // Contar niveles
      const niveles = {
        satisfactorio: 0,
        proceso: 0,
        inicio: 0,
        previo: 0
      };

      estudiantesSeccion.forEach(est => {
        const nivel = (est.nivel || '').toLowerCase();
        if (nivel.includes('satisfactorio')) niveles.satisfactorio++;
        else if (nivel.includes('proceso')) niveles.proceso++;
        else if (nivel.includes('previo')) niveles.previo++;
        else if (nivel.includes('inicio')) niveles.inicio++;
      });

      return {
        seccion: seccionObj.name.toUpperCase(),
        docenteNombre: docenteNombre,
        promedio: Number(promedio.toFixed(2)),
        cantidad: estudiantesSeccion.length,
        distribucion: niveles
      };
    })
      // Ordenar por el porcentaje de estudiantes en nivel Satisfactorio (de mayor a menor)
      .sort((a, b) => {
        const percA = a.cantidad > 0 ? (a.distribucion.satisfactorio / a.cantidad) : 0;
        const percB = b.cantidad > 0 ? (b.distribucion.satisfactorio / b.cantidad) : 0;
        return percB - percA;
      });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [estudiantes, availableSections]);


  // Auto-seleccionar grado de la evaluación para Directores
  useEffect(() => {
    if (!route.isReady) return;
    const gradoEvaluacion = evaluacion?.grado;
    if (currentUserData?.rol === 2 && gradoEvaluacion && !filtros.grado) {
      const gradoId = String(gradoEvaluacion);
      setFiltros((prev: any) => ({ ...prev, grado: gradoId }));
      updateQuery({ grado: gradoId });
    }
  }, [currentUserData?.rol, evaluacion, filtros.grado, updateQuery, setFiltros, route.isReady]);

  // Bloque movido abajo para evitar errores de referencia
  const nivelesLeyenda: any[] = ((evaluacion as any)?.niveles?.length > 0)
    ? (evaluacion as any).niveles
    : [
      { nombre: 'satisfactorio', color: 'var(--satisfactorio)' },
      { nombre: 'en proceso', color: 'var(--en-proceso)' },
      { nombre: 'en inicio', color: 'var(--inicio)' },
      { nombre: 'previo al inicio', color: 'var(--previo-al-inicio)' }
    ];

  const handleLimpiarFiltros = () => {
    const gradoDefault = currentUserData?.rol === 2 ? String(evaluacion?.grado || filtros.grado) : '';
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
      nivel: ''
    });
  };

  // --- Handlers de exportación ---
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
        nombreDocente: `${currentUserData.nombres || ''} ${currentUserData.apellidos || ''}`.trim() || 'Director',
        tipoUsuario: 'Director'
      });
    } catch (error) {
      console.error('Error al exportar grilla:', error);
    } finally {
      setLoadingExport(false);
    }
  };

  const handleExportOption = (type: string) => {
    if (type === 'excel') {
      handleExportToExcel();
    } else if (type === 'pdf-tabla') {
      handleExportarGrillaPDF();
    } else if (type === 'pdf-preguntas') {
      handleGenerarPDF();
    }
    setIsOpen(false);
  };

  const { getPreguntasRespuestas, getEvaluacion } = useAgregarEvaluaciones();
  // const route = useRouter(); // Ya definido arriba
  // const [monthSelected, setMonthSelected] = useState(currentMonth); // Ya definido arriba

  // Función para detectar si toda la evaluación tiene 3 o 4 opciones basándose en la configuración de preguntas
  const detectarNumeroOpciones = useMemo(() => {
    if (!preguntasRespuestas || preguntasRespuestas.length === 0) return 4; // Por defecto 4

    let maxOpciones = 3;
    preguntasRespuestas.forEach((p) => {
      // Excluir la opción dinámica "no respondió" del conteo de alternativas reales
      const altsReales = p.alternativas?.filter(
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

  // Ordenar reporteDirector por el order de las preguntas correspondientes
  const reporteDirectorOrdenado = useMemo(() => {
    if (!reporteDirector || !preguntasOrdenadas.length) return reporteDirector;

    // Crear un mapa de estadísticas por ID de pregunta
    const estadisticasMap = new Map<string, any>();
    reporteDirector.forEach((stat) => {
      if (stat.id) {
        estadisticasMap.set(stat.id, stat);
      }
    });

    // Crear un array sincronizado basado en preguntasRespuestas
    const reporteSincronizado = preguntasOrdenadas.map((pregunta) => {
      const estadistica = estadisticasMap.get(pregunta.id || '');
      if (estadistica) {
        return estadistica;
      } else {
        // Si no hay estadísticas para esta pregunta, crear una estructura vacía
        return {
          id: pregunta.id,
          a: 0,
          b: 0,
          c: 0,
          d: pregunta.alternativas?.some((alt) => alt.alternativa === 'd') ? 0 : undefined,
          total: 0,
        };
      }
    });

    return reporteSincronizado;
  }, [reporteDirector, preguntasOrdenadas]);

  // Crear array de objetos con toda la información necesaria para el reporte
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
        graficoImagen: '', // Se llenará después de renderizar el gráfico
      };
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [reporteDirectorOrdenado, preguntasMap]);
  const {
    graficosImagenes,
    imagenesGeneradas,
    loadingPDF,
    reporteCompletoConImagenes,
    convertirGraficoAImagen,
    handleGenerarPDF,
    limpiarImagenes
  } = useGenerarPDFReporte({
    reporteCompleto,
    currentUserData,
    titulo: 'Reporte de Evaluación - Directores',
    tipoUsuario: 'Director',
    monthSelected
  });
  // Limpiar dataFiltradaDirectorTabla cuando el componente se monta
  useEffect(() => {
    dispatch({ type: AppAction.DATA_FILTRADA_DIRECTOR_TABLA, payload: [] });
  }, [dispatch]);

  useEffect(() => {
    //me trae las preguntas y respuestas para los graficos
    getPreguntasRespuestas(`${route.query.idEvaluacion}`);
    getEvaluacion(`${route.query.idEvaluacion}`);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentUserData.dni, route.query.idEvaluacion]);

  // Reconstruir en memoria para compatibilidad del Director
  const estudiantesBase = useMemo(() => {
    if (!estudiantes || !preguntasRespuestas) return [];

    return estudiantes.map(est => {
      let respuestasReconstruidas: PreguntasRespuestas[] = [];

      if (Array.isArray(est.respuestas)) {
        respuestasReconstruidas = est.respuestas.map(r => {
          const globalP = preguntasRespuestas.find(p =>
            (r.id && p.id === r.id) || (r.order !== undefined && p.order === r.order)
          );
          return { ...r, respuesta: globalP?.respuesta || r.respuesta };
        });
      } else if (est.respuestas && typeof est.respuestas === 'object') {
        respuestasReconstruidas = preguntasRespuestas.map(p => {
          const alternativaSeleccionada = (est.respuestas as any)[p.id || ''];
          const alternativasReconstruidas = p.alternativas?.map(alt => ({
            ...alt,
            selected: !!alt.alternativa && !!alternativaSeleccionada && alt.alternativa.toLowerCase() === alternativaSeleccionada.toLowerCase()
          })) || [];

          return {
            ...p,
            alternativas: alternativasReconstruidas
          };
        });
      }

      return { ...est, respuestas: respuestasReconstruidas } as UserEstudiante;
    });
  }, [estudiantes, preguntasRespuestas]);

  // Memoizar el filtrado de estudiantes para evitar loops infinitos
  const estudiantesFiltrados = useMemo(() => {
    return filtrosParaReporteDirector(estudiantesBase, filtros);
  }, [estudiantesBase, filtros, filtrosParaReporteDirector]);

  // Sincronizar el estado global cuando cambian los estudiantes filtrados
  useEffect(() => {
    dispatch({
      type: AppAction.DATA_FILTRADA_DIRECTOR_TABLA,
      payload: estudiantesFiltrados
    });
  }, [estudiantesFiltrados, dispatch]);

  // Efecto principal para cargar los datos del reporte cuando cambian los filtros de tiempo o la evaluación
  useEffect(() => {
    const currentFetchKey = `${route.query.idEvaluacion}-${monthSelected}-${yearSelected}-${evaluacion.id}`;

    if (currentUserData.dni && evaluacion.id && monthSelected !== undefined) {
      // Si los parámetros de identidad/tiempo no han cambiado, no volver a leer de Firestore
      if (lastFetchParams.current === currentFetchKey) {
        console.log("EVA-LOG: Filtro aplicado en memoria (estudiantes)");
        return;
      }

      console.log("EVA-LOG: Iniciando carga de estudiantes...", {
        motivo: "Cambio de parámetros detectado",
        keyAntigua: lastFetchParams.current,
        keyNueva: currentFetchKey
      });
      setGlobalFetchParams(currentFetchKey);

      reporteDirectorEstudiantes(
        `${route.query.idEvaluacion}`,
        monthSelected,
        yearSelected,
        currentUserData,
        evaluacion
      ).then((res) => {
        console.log("DEBUG-REPORTE: Datos recibidos de reporteDirectorEstudiantes en reporte/index.tsx:", res);
        const alumnos = res?.estudiantes || [];
        if (evaluacion.id) {
          obtenerCoberturaDirector(evaluacion, alumnos);
        }
      }).finally(() => {
        setLoadingMonth(false);
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [route.query.idEvaluacion, currentUserData.dni, yearSelected, monthSelected, evaluacion.id, obtenerCoberturaDirector, reporteDirectorEstudiantes]);
  useEffect(() => {
    getGrados();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])
  useEffect(() => {
    const trendKey = `${evaluacion.id}-${yearSelected}`;
    if (evaluacion.id) {
      if (lastFetchTrendParams.current === trendKey) {
        console.log("EVA-LOG: Filtro aplicado en memoria (tendencia)");
        return;
      }
      console.log("EVA-LOG: Iniciando carga de tendencia anual (CF)...");
      setGlobalTrendParams(trendKey);
      getAllEvaluacionesDeEstudiantesPorMes(evaluacion, yearSelected);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [evaluacion.id, yearSelected, getAllEvaluacionesDeEstudiantesPorMes]);

  // Asegurar que el mes seleccionado sea válido para el nuevo año (COMENTADO TEMPORALMENTE PARA EVITAR SALTOS)
  /* useEffect(() => {
    if (mesesConDataDisponibles.length > 0 && route.isReady) {
      const mesEnUrl = route.query.mes ? Number(route.query.mes) : null;
      if (!mesesConDataDisponibles.includes(monthSelected)) {
        const nuevoMes = mesesConDataDisponibles[0];
        console.log(`EVA-LOG: Bloqueado salto de mes automático de ${monthSelected} a ${nuevoMes}`);
        // setMonthSelected(nuevoMes);
      }
    }
  }, [mesesConDataDisponibles, monthSelected, route.query.mes, route.isReady]); */






  const handleChangeMonth = async (e: React.ChangeEvent<HTMLSelectElement>) => {
    const val = e.target.value;
    if (val === "") return;

    setLoadingMonth(true);
    const newMonth = Number(val);

    // Limpiar las imágenes de gráficos cuando cambie el mes
    limpiarImagenes();
    // Limpiar filtros cuando cambie el mes (preservando grado si es director)
    const gradoDefault = currentUserData?.rol === 2 ? String(evaluacion?.grado || filtros.grado) : '';
    setFiltros({
      grado: gradoDefault,
      seccion: '',
      orden: '',
      genero: '',
      nivel: '',
    });


    try {
      // Actualizar el mes seleccionado
      setMonthSelected(newMonth);
      updateQuery({ mes: newMonth });

      // La función reporteDirectorEstudiantes se ejecutará automáticamente 
      // por el useEffect que depende de monthSelected
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

  // Eliminado: el efecto de arriba ya maneja la carga de datos por mes/año de forma consolidada

  // Crear un mapa optimizado de preguntas por ID para evitar búsquedas repetidas O(1) en lugar de O(n)


  // Memorizar las preguntas ordenadas por la propiedad order


  // Hook para generar PDF con imágenes

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
            <div className={styles.selectContainer}>
              <div className={styles.leftSelects}>
                <div className={styles.selectWrapper}>
                  <select
                    className={styles.select}
                    onChange={handleChangeYear}
                    value={yearSelected}
                  >
                    {yearsAvailable.map((year) => (
                      <option key={year} value={year}>
                        {year}
                      </option>
                    ))}
                  </select>
                </div>

                <div className={styles.selectWrapper}>
                  <select
                    className={styles.select}
                    onChange={handleChangeMonth}
                    value={monthSelected}
                    disabled={true}
                    id=""
                  >
                    {evaluacion?.mesDelExamen !== undefined && evaluacion?.mesDelExamen !== null ? (
                      (() => {
                        const examMonthId = Number(evaluacion.mesDelExamen);
                        const mes = getAllMonths.find(m => m.id === examMonthId);
                        return mes ? (
                          <option key={mes.id} value={mes.id}>
                            {mes.name}
                          </option>
                        ) : null;
                      })()
                    ) : (
                      <>
                        <option value="">Mes</option>
                        {getAllMonths.filter(mes => mesesConDataDisponibles.includes(mes.id)).map((mes) => (
                          <option key={mes.id} value={mes.id}>
                            {mes.name}
                          </option>
                        ))}
                      </>
                    )}
                  </select>
                  {loadingMonth && (
                    <div className={styles.monthLoader}>
                      <RiLoader4Line className={styles.loaderIcon} />
                    </div>
                  )}
                </div>
              </div>

              {/* Dropdown de exportación */}
              <div className={styles.headerActions} style={{ marginBottom: 0 }}>
                <div className={styles.exportButtonsContainer}>
                  <div className={styles.customDropdown} ref={dropdownRef}>
                    <button
                      className={`${styles.dropdownTrigger} ${isOpen ? styles.dropdownActive : ''}`}
                      onClick={() => setIsOpen(!isOpen)}
                      disabled={loadingExport || loadingPDF || !estudiantesFiltrados || estudiantesFiltrados.length === 0}
                    >
                      <HiOutlineDownload className={styles.dropdownIcon} />
                      <span>{loadingExport || loadingPDF ? 'Procesando...' : 'Exportar Reporte'}</span>
                      <IoIosArrowDown className={`${styles.arrowIcon} ${isOpen ? styles.arrowRotate : ''}`} />
                    </button>

                    {isOpen && (
                      <div className={styles.dropdownMenu}>
                        <div
                          className={styles.dropdownItem}
                          onClick={() => handleExportOption('pdf-tabla')}
                        >
                          <RiFilePdfLine className={styles.itemIconPdf} />
                          <div className={styles.itemContent}>
                            <span className={styles.itemTitle}>Exportar Grilla PDF</span>
                            <span className={styles.itemDescription}>Reporte tabular de resultados</span>
                          </div>
                        </div>
                        <div
                          className={styles.dropdownItem}
                          onClick={() => handleExportOption('excel')}
                        >
                          <RiFileExcel2Line className={styles.itemIconExcel} />
                          <div className={styles.itemContent}>
                            <span className={styles.itemTitle}>Exportar a Excel</span>
                            <span className={styles.itemDescription}>Datos crudos para análisis</span>
                          </div>
                        </div>
                        <div
                          className={`${styles.dropdownItem} ${(!imagenesGeneradas || reporteCompletoConImagenes.length === 0) ? styles.itemDisabled : ''}`}
                          onClick={() => {
                            if (imagenesGeneradas && reporteCompletoConImagenes.length > 0) {
                              handleExportOption('pdf-preguntas');
                            }
                          }}
                        >
                          <RiFilePdfLine className={styles.itemIconQuestions} />
                          <div className={styles.itemContent}>
                            <span className={styles.itemTitle}>
                              {!imagenesGeneradas ? 'Preparando PDF Preguntas...' : 'Generar PDF Preguntas'}
                            </span>
                            <span className={styles.itemDescription}>Reporte gráfico detallado</span>
                          </div>
                          {!imagenesGeneradas && <RiLoader4Line className={styles.loaderIconSmall} />}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
            <div className={styles.filtersContainer}>
              <select
                name="nivel"
                className={styles.select}
                onChange={handleChangeFiltros}
                value={filtros.nivel}
              >
                <option value="">Nivel</option>
                {evaluacion.nivelYPuntaje?.map((nivel) => (
                  <option key={nivel.id} value={nivel.nivel}>
                    {nivel.nivel}
                  </option>
                ))}
              </select>

              <select
                name="grado"
                className={styles.select}
                onChange={handleChangeFiltros}
                value={filtros.grado}
                disabled={currentUserData.rol === 2}
              >
                <option value="">Grado</option>
                {gradosDeColegio.map((grado) => (
                  <option key={grado.id} value={grado.id}>
                    {grado.name}
                  </option>
                ))}
              </select>

              <select
                name="seccion"
                value={filtros.seccion}
                onChange={handleChangeFiltros}
                className={styles.select}
              >
                <option value="">Sección</option>
                {availableSections.map((seccion) => (
                  <option key={seccion.id} value={seccion.id}>
                    {seccion.name.toUpperCase()}
                  </option>
                ))}
              </select>
              <select
                name="genero"
                value={filtros.genero}
                onChange={handleChangeFiltros}
                className={styles.select}
              >
                <option value="">Género</option>
                {genero.map((gen) => (
                  <option key={gen.id} value={gen.id}>
                    {gen.name.toUpperCase()}
                  </option>
                ))}
              </select>
              <select className={styles.select} onChange={handleChangeFiltros} name="orden" id="">
                <option value="">ordernar por</option>
                {ordernarAscDsc.map((orden) => (
                  <option key={orden.id} value={orden.name}>
                    {orden.name}
                  </option>
                ))}
              </select>

              <div className={styles.configContainer} ref={configRef}>
                <button
                  className={styles.configButton}
                  onClick={() => setShowConfig(!showConfig)}
                  title="Configurar columnas"
                >
                  <RiSettings4Line />
                  Columnas
                </button>

                {showConfig && (
                  <div className={styles.configMenu}>
                    <span className={styles.configTitle}>Visibilidad de Columnas</span>
                    <div className={styles.configList}>
                      <label className={styles.configItem}>
                        <input
                          type="checkbox"
                          checked={columnasVisibles.showRC}
                          onChange={() => toggleColumna('showRC')}
                        />
                        <span>Respuestas Correctas (RC)</span>
                      </label>
                      <label className={styles.configItem}>
                        <input
                          type="checkbox"
                          checked={columnasVisibles.showTP}
                          onChange={() => toggleColumna('showTP')}
                        />
                        <span>Total Preguntas (TP)</span>
                      </label>
                      <label className={styles.configItem}>
                        <input
                          type="checkbox"
                          checked={columnasVisibles.showPuntaje}
                          onChange={() => toggleColumna('showPuntaje')}
                        />
                        <span>Puntaje</span>
                      </label>
                      <label className={styles.configItem}>
                        <input
                          type="checkbox"
                          checked={columnasVisibles.showNivel}
                          onChange={() => toggleColumna('showNivel')}
                        />
                        <span>Nivel (Logro)</span>
                      </label>
                      <label className={styles.configItem}>
                        <input
                          type="checkbox"
                          checked={columnasVisibles.showDniDocente}
                          onChange={() => toggleColumna('showDniDocente')}
                        />
                        <span>DNI Docente</span>
                      </label>
                    </div>
                  </div>
                )}
              </div>

              <button className={styles.clearButton} onClick={handleLimpiarFiltros}>
                Limpiar Filtros
              </button>
            </div>


            {isLoading || loadingMonth ? (
              <div className={styles.loaderContainer}>
                <Loader
                  size="large"
                  variant="spinner"
                  text="Cargando datos..."
                  color="#10b981"
                />
              </div>
            ) : (
              <>
                {/* Leyenda de Niveles */}
                <div className={styles.legendContainer}>
                  <span className={styles.legendTitle}>LEYENDA DE NIVELES:</span>
                  {(nivelesLeyenda as any[]).map((nivel: any, index: number) => (
                    <div key={index} className={styles.legendItem}>
                      <div
                        className={styles.legendCircle}
                        style={{ backgroundColor: nivel.color }}
                      ></div>
                      <span className={styles.legendLabel}>{nivel.nombre}</span>
                    </div>
                  ))}
                </div>

                <TablaPreguntas
                  estudiantes={estudiantesFiltrados}
                  preguntasRespuestas={preguntasRespuestas}
                  warningEvaEstudianteSinRegistro={undefined}
                  /* warningEvaEstudianteSinRegistro={warningEvaEstudianteSinRegistro || undefined} */

                  linkToEdit={`/docentes/evaluaciones/tercerNivel/pruebas/prueba/reporte/actualizar-evaluacion?idExamen=${route.query.idExamen}&mes=${monthSelected}`}
                  customColumns={{
                    showPuntaje: columnasVisibles.showPuntaje,
                    showNivel: columnasVisibles.showNivel,
                    showRC: columnasVisibles.showRC,
                    showTP: columnasVisibles.showTP,
                    showDniDocente: columnasVisibles.showDniDocente
                  }}
                  showEditButton={false}
                  className={styles.tableWrapper}
                />

                {evaluacion.tipoDeEvaluacion === '1' ? (
                  <>
                    {/* Distribución Niveles y Cobertura de Evaluación */}
                    <div className={styles.graficosContainer} style={{ marginTop: '2rem' }}>
                      <GraficoTendenciaColegio
                        evaluacion={evaluacion}
                        datosPorMes={datosPorMes}
                        mesesConDataDisponibles={mesesConDataDisponibles}
                        promedioGlobal={promedioGlobal}
                        monthSelected={monthSelected}
                        promedioPorSeccion={promedioPorSeccion}
                        promedioPorDocente={promedioPorDocente}
                        evaluados={estudiantes.length}
                        pendientes={estudiantesDeEvaluacion.length}
                        listaPendientes={estudiantesDeEvaluacion}
                        dataGraficoTendenciaNiveles={[
                          generarDataGraficoPiechart(estudiantesFiltrados, monthSelected, evaluacion),
                        ]}
                        soloPieYCobertura={true}
                      />
                    </div>

                    {/* Comparativa de Niveles por Docentes y Comparativa por Secciones */}
                    <div className={styles.graficosContainer} style={{ marginTop: '2rem' }}>
                      <GraficoTendenciaColegio
                        evaluacion={evaluacion}
                        datosPorMes={datosPorMes}
                        mesesConDataDisponibles={mesesConDataDisponibles}
                        promedioGlobal={promedioGlobal}
                        monthSelected={monthSelected}
                        promedioPorSeccion={promedioPorSeccion}
                        promedioPorDocente={promedioPorDocente}
                        evaluados={estudiantes.length}
                        pendientes={estudiantesDeEvaluacion.length}
                        listaPendientes={estudiantesDeEvaluacion}
                        dataGraficoTendenciaNiveles={[
                          generarDataGraficoPiechart(estudiantesFiltrados, monthSelected, evaluacion),
                        ]}
                        soloDocentesYSecciones={true}
                      />
                    </div>

                    {/* Gráficos de Tendencia (Acordeón 1) */}
                    <div className={accordionStyles.accordionContainer} style={{ overflow: mostrarGraficos ? 'visible' : 'hidden', marginTop: '2rem' }}>
                      <div
                        onClick={() => setMostrarGraficos(!mostrarGraficos)}
                        className={mostrarGraficos ? accordionStyles.headerOpen : accordionStyles.header}
                        style={{ cursor: 'pointer' }}
                      >
                        <div className={accordionStyles.titleGroup}>
                          <span className={accordionStyles.icon}>📊</span>
                          <h3 className={accordionStyles.title}>Gráficos de Tendencia</h3>
                        </div>
                        <div className={mostrarGraficos ? accordionStyles.chevronOpen : accordionStyles.chevron}>
                          ▼
                        </div>
                      </div>

                      <div className={`${accordionStyles.contentWrapper} ${mostrarGraficos ? accordionStyles.contentWrapperOpen : ''}`}>
                        <div className={`${accordionStyles.contentInner} ${mostrarGraficos ? accordionStyles.innerVisible : ''}`}>
                          {/* Custom Searchable Dropdown de Selección de Comparativa Múltiple */}
                          <div className={styles.evalDropdownWrapper} ref={compDropdownRef} style={{ marginBottom: '1.5rem', width: '100%', maxWidth: '600px' }}>
                            {loadingEvaluaciones ? (
                              <div className={styles.evalDropdownTrigger} style={{ cursor: 'wait' }}>
                                <span className={styles.triggerText}>Cargando evaluaciones...</span>
                                <RiLoader4Line className={styles.loaderIcon} style={{ fontSize: '1rem', margin: 0 }} />
                              </div>
                            ) : (
                              <>
                                <button
                                  type="button"
                                  onClick={() => setIsCompDropdownOpen(!isCompDropdownOpen)}
                                  className={styles.evalDropdownTrigger}
                                >
                                  <span className={styles.triggerText}>
                                    {evaluacionesAComparar.length === 0
                                      ? 'Comparar con otras evaluaciones...'
                                      : `${evaluacionesAComparar.length} seleccionada(s) para comparar`}
                                  </span>
                                  <RiArrowDownSLine className={`${styles.chevronIcon} ${isCompDropdownOpen ? styles.chevronIconOpen : ''}`} />
                                </button>

                                {isCompDropdownOpen && (
                                  <div className={styles.evalOptionsPanel}>
                                    <div className={styles.evalSearchContainer}>
                                      <div className={styles.evalSearchRelative}>
                                        <input
                                          type="text"
                                          autoFocus
                                          value={searchCompQuery}
                                          onChange={(e) => setSearchCompQuery(e.target.value)}
                                          placeholder="Buscar evaluación..."
                                          className={styles.evalSearchInput}
                                        />
                                        <RiSearchLine className={styles.evalSearchIcon} />
                                        {searchCompQuery && (
                                          <button
                                            type="button"
                                            onClick={() => setSearchCompQuery('')}
                                            className={styles.evalSearchClearButton}
                                          >
                                            <RiCloseLine />
                                          </button>
                                        )}
                                      </div>
                                    </div>

                                    <div className={styles.evalOptionsList}>
                                      {evaluacionesCompFiltradas.map((evalOption) => {
                                        const isSelected = evaluacionesAComparar.includes(evalOption.id);
                                        const gradoNombre = getGradoTexto(evalOption.grado);
                                        return (
                                          <button
                                            key={evalOption.id}
                                            type="button"
                                            onClick={() => {
                                              setEvaluacionesAComparar((prev) =>
                                                prev.includes(evalOption.id)
                                                  ? prev.filter((id) => id !== evalOption.id)
                                                  : [...prev, evalOption.id]
                                              );
                                            }}
                                            className={`${styles.evalOptionItem} ${
                                              isSelected ? styles.evalOptionItemActive : ''
                                            }`}
                                            style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '0.75rem' }}
                                          >
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flex: 1, minWidth: 0 }}>
                                              <input
                                                type="checkbox"
                                                checked={isSelected}
                                                readOnly
                                                style={{ cursor: 'pointer', flexShrink: 0 }}
                                              />
                                              <span style={{ fontWeight: 600, color: '#1e293b', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                                {evalOption.nombre || 'Sin nombre'}
                                              </span>
                                            </div>
                                            <span
                                              style={{
                                                fontSize: '0.75rem',
                                                padding: '2px 8px',
                                                borderRadius: '6px',
                                                backgroundColor: isSelected ? '#3b82f6' : '#e2e8f0',
                                                color: isSelected ? '#ffffff' : '#475569',
                                                fontWeight: 600,
                                                whiteSpace: 'nowrap',
                                                flexShrink: 0
                                              }}
                                            >
                                              {gradoNombre}
                                            </span>
                                          </button>
                                        );
                                      })}
                                      {evaluacionesCompFiltradas.length === 0 && (
                                        <div className={styles.evalNoResults}>
                                          <RiErrorWarningLine className={styles.evalNoResultsIcon} />
                                          <span className={styles.evalNoResultsText}>No se encontraron evaluaciones para comparar.</span>
                                        </div>
                                      )}
                                    </div>
                                  </div>
                                )}
                              </>
                            )}
                          </div>

                          <div className={styles.graficosContainer}>
                            <GraficoTendencia
                              idEvaluacion={route.query.idEvaluacion as string}
                              evaluacionesAComparar={evaluacionesAComparar}
                              dniDirector={currentUserData.dni}
                              monthSelected={monthSelected}
                              yearSelected={Number(yearSelected)}
                              ocultarTabla={false}
                            />
                          </div>
                        </div>
                      </div>
                    </div>
                  </>
                ) : null}
                <div className={accordionStyles.accordionContainer} style={{ marginTop: '2rem' }}>
                  <div
                    onClick={() => setMostrarReportePreguntas(!mostrarReportePreguntas)}
                    className={mostrarReportePreguntas ? accordionStyles.headerOpen : accordionStyles.header}
                    style={{ cursor: 'pointer' }}
                  >
                    <div className={accordionStyles.titleGroup}>
                      <span className={accordionStyles.icon}>📋</span>
                      <h3 className={accordionStyles.title}>Reporte de Evaluación por Pregunta</h3>
                    </div>
                    <div className={mostrarReportePreguntas ? accordionStyles.chevronOpen : accordionStyles.chevron}>
                      ▼
                    </div>
                  </div>

                  <div className={`${accordionStyles.contentWrapper} ${mostrarReportePreguntas ? accordionStyles.contentWrapperOpen : ''}`}>
                    <div className={`${accordionStyles.contentInner} ${mostrarReportePreguntas ? accordionStyles.innerVisible : ''}`}>
                      <ReporteEvaluacionPorPregunta
                        dataEstadisticasOrdenadas={reporteDirectorOrdenado}
                        preguntasMap={preguntasMap}
                        detectarNumeroOpciones={detectarNumeroOpciones}
                        warningEvaEstudianteSinRegistro={undefined}
                        convertirGraficoAImagen={() => {}} // No-op para la vista interactiva
                      />
                    </div>
                  </div>
                </div>

                {/* Renderizado off-screen para asegurar que los gráficos se generen siempre para el PDF, incluso con el acordeón cerrado */}
                <div style={{ position: 'absolute', left: '-9999px', top: '-9999px', width: '700px', height: 'auto', overflow: 'hidden', pointerEvents: 'none' }}>
                  <ReporteEvaluacionPorPregunta
                    dataEstadisticasOrdenadas={reporteDirectorOrdenado}
                    preguntasMap={preguntasMap}
                    detectarNumeroOpciones={detectarNumeroOpciones}
                    warningEvaEstudianteSinRegistro={undefined}
                    convertirGraficoAImagen={convertirGraficoAImagen}
                    forceOneColumn={true}
                  />
                </div>
              </>
            )}
          </div>

        </div>
      )}
    </>
  );
};

export default Reporte;
Reporte.Auth = PrivateRouteDirectores;
