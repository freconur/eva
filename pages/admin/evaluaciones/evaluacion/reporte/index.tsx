import { useGlobalContext, useGlobalContextDispatch } from '@/features/context/GlolbalContext';
import { AppAction } from '@/features/actions/appAction';
import { useRouter } from 'next/router';
import React, { useEffect, useState, useMemo, useCallback, useRef } from 'react';
import { useColorsFromCSS } from '@/features/hooks/useColorsFromCSS';
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
import { Alternativa, DataEstadisticas, PreguntasRespuestas } from '@/features/types/types';
import { RiLoader4Line, RiFileExcel2Line, RiDownloadLine } from 'react-icons/ri';
import { toast } from 'react-toastify';
import { MdAddCircle, MdAnalytics, MdCalendarToday, MdClose, MdDeleteForever, MdEditSquare, MdFileDownload, MdVisibility, MdVisibilityOff, MdGridView, MdViewStream, MdViewModule, MdSearch } from 'react-icons/md';
import styles from './Reporte.module.css';
import { currentMonth, getAllMonths } from '@/fuctions/dates';
import PrivateRouteEspecialista from '@/components/layouts/PrivateRoutesEspecialista';
import { useReporteEspecialistas } from '@/features/hooks/useReporteEspecialistas';
import { distritosPuno } from '@/fuctions/provinciasPuno';
import { exportDirectorDocenteDataToExcel } from '@/features/utils/excelExport';
import { regiones, regionTexto } from '@/fuctions/regiones';
import { useCrearEstudiantesDeDocente } from '@/features/hooks/useCrearEstudiantesDeDocente';
import { useCrearPuntajeProgresiva } from '@/features/hooks/useCrearPuntajeProgresiva';
import AcordeonGraficosTendencia from '@/components/reportes/AcordeonGraficosTendencia';
import AcordeonReportePregunta from '@/components/reportes/AcordeonReportePregunta';
import PieChartComponent from '@/components/reportes/PieChartComponent';
import FiltrosReporte from '@/components/reportes/FiltrosReporte';
import { useExportExcel } from '@/features/hooks/useExportExcel';
import { httpsCallable } from 'firebase/functions';
import { getDoc, doc, updateDoc, onSnapshot } from "firebase/firestore";
import { functions, db } from '@/firebase/firebase.config';
import BarChartDirectores from '@/components/reportes/BarChartDirectores';
import ParticipacionDirectoresChart from '@/components/reportes/ParticipacionDirectoresChart';
import BarChartDocentes from '@/components/reportes/BarChartDocentes';
import BarChartDocentesBuckets from '@/components/reportes/BarChartDocentesBuckets';
import BarChartDocenteDetalle from '@/components/reportes/BarChartDocenteDetalle';
import BarChartUgelStacked from '@/components/reportes/BarChartUgelStacked';
import { getStorage, ref, getDownloadURL } from 'firebase/storage';

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

const Reporte = () => {
  const [filtros, setFiltros] = useState({
    region: '',
    distrito: '',
    genero: '',
    area: '',
  });

  const [distritosDisponibles, setDistritosDisponibles] = useState<string[]>([]);
  const [loadingExport, setLoadingExport] = useState(false);

  // Hook para crear estudiantes de docentes
  const {
    loading: loadingCrearEstudiantes,
    error: errorCrearEstudiantes,
    resultado: resultadoCrearEstudiantes,
    progreso: progresoCrearEstudiantes,
    ejecutarCrearEstudiantes,
    limpiarEstado: limpiarEstadoCrearEstudiantes,
    obtenerMensajeResumen,
    obtenerEstadisticas
  } = useCrearEstudiantesDeDocente();

  const { exportEstudiantesToExcel, exportEstudiantesParaExcelFronted, loading: loadingExportEstudiantes, error: errorExportEstudiantes } = useExportExcel();

  const handleExportEstudiantesToExcel = async () => {
    try {
      const rta = await exportEstudiantesToExcel(`${route.query.idEvaluacion}`, monthSelected, yearSelected);
      console.log(rta);
      /* console.log(rta); */

      // Si rta es una URL, abrirla en una nueva pestaña
      if (rta && typeof rta === 'string' && (rta.startsWith('http://') || rta.startsWith('https://'))) {
        window.open(rta, '_blank');
      }

      alert('✅ Estudiantes obtenidos exitosamente');
    } catch (error: any) {
      alert(`❌ Error al obtener estudiantes: ${error.message || 'Error desconocido'}`);
    }
  }

  const handleExportEstudiantesToExcelFronted = async () => {
    try {
      await exportEstudiantesParaExcelFronted(`${route.query.idEvaluacion}`, monthSelected)
    } catch (error: any) {
      alert(`❌ Error al obtener estudiantes: ${error.message || 'Error desconocido'}`)
    }
  }
  // Hook para crear puntaje progresiva
  const {
    loading: loadingCrearPuntajeProgresiva,
    error: errorCrearPuntajeProgresiva,
    resultado: resultadoCrearPuntajeProgresiva,
    progreso: progresoCrearPuntajeProgresiva,
    ejecutarCrearPuntajeProgresiva,
    limpiarEstado: limpiarEstadoCrearPuntajeProgresiva,
    obtenerMensajeResumen: obtenerMensajeResumenPuntajeProgresiva,
    obtenerEstadisticas: obtenerEstadisticasPuntajeProgresiva
  } = useCrearPuntajeProgresiva();

  const [rangoMes, setRangoMes] = useState<number[]>([]);
  const [dataDirectoresBar, setDataDirectoresBar] = useState<any[]>([]);
  const [loadingDirectoresBar, setLoadingDirectoresBar] = useState(false);
  const [dataProfesoresBuckets, setDataProfesoresBuckets] = useState<any[]>([]);
  const [totalDocentesBuckets, setTotalDocentesBuckets] = useState(0);
  const [loadingProfesoresBuckets, setLoadingProfesoresBuckets] = useState(false);
  const [chartColumns, setChartColumns] = useState(2); // 1, 2, 3 columnas
  const [questionColumns, setQuestionColumns] = useState(2); // 1, 2, 3 columnas para preguntas
  const [dataReportePreguntas, setDataReportePreguntas] = useState<any[]>([]);
  const [loadingReportePreguntas, setLoadingReportePreguntas] = useState(false);

  // Drill-down para docentes
  const [fullDocentesData, setFullDocentesData] = useState<any[] | null>(null);
  const [selectedRange, setSelectedRange] = useState<string | null>(null);
  const [selectedDirectorStatus, setSelectedDirectorStatus] = useState<'participo' | 'no_participo' | 'all' | null>(null);
  const [searchTermDirector, setSearchTermDirector] = useState('');
  const [selectedRegionDirector, setSelectedRegionDirector] = useState<string>('all');
  const [pageSizeDirector, setPageSizeDirector] = useState<number | 'all'>(100);
  const [consolidationStatus, setConsolidationStatus] = useState<any>(null);
  const [loadingFullDocentes, setLoadingFullDocentes] = useState(false);
  const [loadingConsolidado, setLoadingConsolidado] = useState(false);
  const drillDownRef = useRef<HTMLDivElement>(null);
  const directorsDetailRef = useRef<HTMLDivElement>(null);

  const { loaderDataGraficoPieChart, dataGraficoPieChart } = useGlobalContext();

  // Callback para manejar cambios en el rango
  const handleRangoChange = (mesInicio: number, mesFin: number, año: number, mesesIds: number[]) => {
    setRangoMes(mesesIds);
  };

  useEffect(() => {
    if (filtros.region) {
      const provinciaEncontrada = distritosPuno.find((p) => p.id === Number(filtros.region));
      if (provinciaEncontrada) {
        setDistritosDisponibles(provinciaEncontrada.distritos);
      } else {
        setDistritosDisponibles([]);
      }
    } else {
      setDistritosDisponibles([]);
    }
  }, [filtros.region]);

  const handleChangeFiltros = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setFiltros({
      ...filtros,
      [e.target.name]: e.target.value,
    });
  };

  // Función para manejar la creación de estudiantes de docentes
  const handleCrearEstudiantes = async () => {
    try {
      // Mostrar confirmación antes de proceder
      const confirmacion = window.confirm(
        '⚠️ ADVERTENCIA: Esta operación puede tomar hasta 9 minutos.\n\n' +
        '¿Estás seguro de que quieres continuar con la creación de estudiantes de docentes?\n\n' +
        'Esta acción procesará todos los docentes del sistema.'
      );

      if (!confirmacion) {
        return;
      }

      // Limpiar estado anterior
      limpiarEstadoCrearEstudiantes();

      // Ejecutar la función
      //le tengo que pasar el parametro de monthSelected y route.query.idEvaluacion
      await ejecutarCrearEstudiantes(`${monthSelected}`, `${route.query.idEvaluacion}`);

      // Mostrar mensaje de éxito
      alert('✅ Estudiantes de docentes creados exitosamente!\n\n' + obtenerMensajeResumen());

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Error desconocido';
      alert(`❌ Error al crear estudiantes de docentes:\n${errorMessage}`);
    }
  };

  // Función para manejar la creación de puntaje progresiva
  const handleCrearPuntajeProgresiva = async () => {
    try {
      // Mostrar confirmación antes de proceder
      const confirmacion = window.confirm(
        '⚠️ ADVERTENCIA: Esta operación puede tomar varios minutos.\n\n' +
        '¿Estás seguro de que quieres continuar con la generación de puntaje progresiva?\n\n' +
        'Esta acción procesará todos los estudiantes del sistema.'
      );

      if (!confirmacion) {
        return;
      }

      // Limpiar estado anterior
      limpiarEstadoCrearPuntajeProgresiva();

      // Ejecutar la función
      await ejecutarCrearPuntajeProgresiva(`${monthSelected}`, `${route.query.idEvaluacion}`, evaluacion, preguntasRespuestas);

      // Mostrar mensaje de éxito
      alert('✅ Puntaje progresiva generado exitosamente!\n\n' + obtenerMensajeResumenPuntajeProgresiva());

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Error desconocido';
      alert(`❌ Error al generar puntaje progresiva:\n${errorMessage}`);
    }
  };

  // Función para generar consolidación completa (Storage + Firestore)
  const handleGenerarConsolidado = async () => {
    const idEval = route.query.idEvaluacion;
    if (!idEval || monthSelected === undefined || !yearSelected) return;

    const isProcessing = consolidationStatus?.status === 'processing';
    
    const message = isProcessing
      ? `⚠️ El proceso parece haberse detenido en ${consolidationStatus?.progress || 0}%. ¿Deseas FORZAR el reinicio de la consolidación?`
      : '🚀 ¿Deseas generar la consolidación completa de datos en SEGUNDO PLANO?\n\n' +
        'Esto se ejecutará en el servidor. Podrás cerrar la pestaña y el proceso continuará.';

    const confirmacion = window.confirm(message);

    if (!confirmacion) return;

    setLoadingConsolidado(true);
    try {
      const callOrchestrator = httpsCallable(functions, 'startFullConsolidation', { timeout: 540000 });
      
      toast.info('⏳ Iniciando proceso en segundo plano...');
      
      // Llamamos a la función maestra. No esperamos a que termine (el listener de Firestore hará el trabajo)
      callOrchestrator({
        idEvaluacion: idEval,
        año: yearSelected,
        mes: monthSelected
      }).catch(err => {
        console.error("Error al iniciar orquestador:", err);
        toast.error("Error al iniciar el proceso en el servidor.");
      });

      // Damos un feedback inmediato
      toast.success(isProcessing ? '🚀 Reinicio forzado enviado.' : '🚀 Proceso delegado al servidor.');

    } catch (error: any) {
      console.error('❌ Error al invocar orquestador:', error);
      toast.error(`Error: ${error.message || 'Error desconocido'}`);
    } finally {
      setLoadingConsolidado(false);
    }
  };

  const handleDetenerConsolidado = async () => {
    const idEval = route.query.idEvaluacion;
    if (!idEval || monthSelected === undefined || !yearSelected) return;

    const confirmed = window.confirm('🛑 ¿Deseas DETENER el proceso de consolidación?');
    if (!confirmed) return;

    try {
      const statusRef = doc(db, `evaluaciones/${idEval}/estado_consolidacion`, `${yearSelected}_${monthSelected}`);
      await updateDoc(statusRef, { 
        status: 'stopped',
        message: 'Proceso detenido por el usuario.',
        endTime: new Date()
      });
      toast.info('🛑 Petición de parada enviada.');
    } catch (error: any) {
      console.error('Error stopping:', error);
      toast.error('Error al detener el proceso.');
    }
  };

  const { prepareBarChartData } = useColorsFromCSS();

  const iterateData = (data: any, respuesta: string) => {
    const chartData = prepareBarChartData(data, respuesta);

    if (chartData && chartData.labels) {
      chartData.labels = chartData.labels.map((label: string) => label.toUpperCase());
    }

    return chartData;
  };
  const {
    reporteParaTablaDeEspecialista,
    getEstadisticaGlobal,
    getAllReporteDeDirectoreToAdmin,
    getDataGraficoPieChart,
    restablecerFiltrosDeEspecialista,
    getReporteEspecialistaPorUgel,
    getDataGraficoUgelStacked
  } = useReporteEspecialistas();
  const {
    currentUserData,
    preguntasRespuestas,
    loaderReporteDirector,
    allEvaluacionesDirectorDocente,
    dataEstadisticaEvaluacion,
    evaluacion,
    dataGraficoTendenciaNiveles,
    dataGraficoUgelStacked,
    loaderDataGraficoUgelStacked
  } = useGlobalContext();
  const dispatch = useGlobalContextDispatch();
  const { getPreguntasRespuestas, getEvaluacion } = useAgregarEvaluaciones();
  const route = useRouter();
  const [monthSelected, setMonthSelected] = useState(currentMonth);

  const currentYear = new Date().getFullYear();
  const years = Array.from({ length: currentYear - 2025 + 1 }, (_, i) => 2025 + i);
  const [yearSelected, setYearSelected] = useState(currentYear);
  const isInitialMonthSet = useRef(false);

  // --- SINCRONIZACIÓN INICIAL CON EL MES DEL EXAMEN ---
  useEffect(() => {
    isInitialMonthSet.current = false;
  }, [route.query.idEvaluacion]);

  useEffect(() => {
    if (evaluacion?.mesDelExamen && !isInitialMonthSet.current) {
      isInitialMonthSet.current = true; // Marcamos como hecho inmediatamente
      const mesId = Number(evaluacion.mesDelExamen);
      if (!isNaN(mesId)) {
        console.log(`📅 [Auto-Config] Mes inicial establecido en: ${mesId} (${evaluacion.mesDelExamen})`);
        setMonthSelected(mesId);
      }
    }
  }, [evaluacion]);
  useEffect(() => {
    const idEval = route.query.idEvaluacion;
    if (!idEval || monthSelected === undefined || !yearSelected) return;

    const statusRef = doc(db, `evaluaciones/${idEval}/estado_consolidacion`, `${yearSelected}_${monthSelected}`);
    
    const unsubscribe = onSnapshot(statusRef, (snapshot) => {
      if (snapshot.exists()) {
        const data = snapshot.data();
        setConsolidationStatus(data);
        
        // Si acaba de completarse, recargamos los datos locales
        if (data.status === 'completed') {
           // Pequeño delay para asegurar que Storage se actualizó
           setTimeout(() => {
             // Funciones de refresco asumiendo que existen en el componente
             if (typeof loadConsolidado === 'function') loadConsolidado();
             if (typeof fetchBarGraphicsData === 'function') fetchBarGraphicsData();
             if (typeof fetchReportePreguntas === 'function') fetchReportePreguntas();
             getReporteEspecialistaPorUgel(String(idEval), monthSelected, yearSelected);
           }, 1000);
        }
      } else {
        setConsolidationStatus(null);
      }
    });

    return () => unsubscribe();
  }, [route.query.idEvaluacion, monthSelected, yearSelected]);

  const handleChangeYear = (e: React.ChangeEvent<HTMLSelectElement>) => {
    console.log('Select Año value:', e.target.value);
    setYearSelected(Number(e.target.value));
  };

  // Memorizar las preguntas ordenadas por la propiedad order
  const preguntasOrdenadas = useMemo(() => {
    return [...(preguntasRespuestas || [])].sort((a, b) => (a.order || 0) - (b.order || 0));
  }, [preguntasRespuestas]);

  // Crear un mapa optimizado de preguntas por ID para evitar búsquedas repetidas O(1) en lugar de O(n)
  const preguntasMap = useMemo(() => {
    const map = new Map<string, PreguntasRespuestas>();
    preguntasOrdenadas.forEach((pregunta) => {
      if (pregunta.id) {
        map.set(pregunta.id, pregunta);
      }
    });
    return map;
  }, [preguntasOrdenadas]);




  useEffect(() => {
    getReporteEspecialistaPorUgel(`${route.query.idEvaluacion}`, monthSelected, yearSelected)
  }, [`${route.query.idEvaluacion}`, monthSelected, currentUserData.region, yearSelected])

  useEffect(() => {
    //me trae las preguntas y respuestas para los graficos
    getPreguntasRespuestas(`${route.query.idEvaluacion}`);
    getEvaluacion(`${route.query.idEvaluacion}`);
  }, [currentUserData.dni, route.query.idEvaluacion]);

  const handleFiltrar = () => {
    reporteParaTablaDeEspecialista(
      allEvaluacionesDirectorDocente,
      {
        region: filtros.region,
        area: filtros.area,
        genero: filtros.genero,
        distrito: filtros.distrito,
      },
      monthSelected,
      `${route.query.idEvaluacion}`,
      yearSelected
    );
  };

  // Efecto para filtrado reactivo: actualiza el reporte automáticamente al cambiar cualquier filtro o periodo
  useEffect(() => {
    if (route.query.idEvaluacion && allEvaluacionesDirectorDocente.length > 0) {
      handleFiltrar();
    }
  }, [filtros, monthSelected, yearSelected, allEvaluacionesDirectorDocente.length]);
  useEffect(() => {
    if (route.query.idEvaluacion && evaluacion?.nivelYPuntaje) {
      getDataGraficoPieChart(
        `${route.query.idEvaluacion}`,
        monthSelected,
        evaluacion,
        filtros.genero || undefined,
        filtros.region || undefined,
        yearSelected
      );
      getDataGraficoUgelStacked(
        `${route.query.idEvaluacion}`,
        monthSelected,
        evaluacion,
        yearSelected
      );
      getEstadisticaGlobal(`${route.query.idEvaluacion}`, monthSelected, yearSelected);
    }
  }, [route.query.id, route.query.idEvaluacion, currentUserData.dni, monthSelected, filtros.genero, filtros.region, yearSelected, evaluacion]);

  // --- INTEGRACIÓN DE GRÁFICOS DE BARRAS PARA DIRECTORES ---
  const isFetchedBarGraphics = useRef<string | null>(null);

  const fetchBarGraphicsData = async () => {
    const idEval = route.query.idEvaluacion;
    if (!idEval || monthSelected === undefined || !yearSelected) return;
    setLoadingDirectoresBar(true);
    try {
      console.log('🚀 [Storage] Buscando consolidado de directores en Firestore...');
      const consolidadoRef = doc(db, `evaluaciones/${idEval}/consolidados`, `directores_${yearSelected}_${monthSelected}`);
      const consolidadoSnap = await getDoc(consolidadoRef);

      if (consolidadoSnap.exists()) {
        const { url } = consolidadoSnap.data();
        if (url) {
          // Añadimos un timestamp para evitar que el navegador use una versión en caché (Cache-busting)
          const cacheBuster = `?t=${Date.now()}`;
          const response = await fetch(url + cacheBuster);
          const res = await response.json();
          if (res.success && Array.isArray(res.data)) {
            setDataDirectoresBar(res.data);
            return;
          }
        }
      }
      console.warn('⚠️ No hay consolidado de directores disponible.');
      setDataDirectoresBar([]);
    } catch (error) {
      console.error('❌ Error al cargar consolidado de directores (Storage):', error);
      setDataDirectoresBar([]);
    } finally {
      setLoadingDirectoresBar(false);
    }
  };

  const loadConsolidado = async () => {
    const idEval = route.query.idEvaluacion;
    if (!idEval || monthSelected === undefined || !yearSelected) return;

    setLoadingProfesoresBuckets(true);
    try {
      console.log('🚀 [Storage] Buscando consolidado de docentes en Firestore...');
      const consolidadoRef = doc(db, `evaluaciones/${idEval}/consolidados`, `profesores_${yearSelected}_${monthSelected}`);
      const consolidadoSnap = await getDoc(consolidadoRef);

      if (consolidadoSnap.exists()) {
        const { url, distribucionDocentes, totalDocentes } = consolidadoSnap.data();
        if (url) {
          const cacheBuster = `?t=${Date.now()}`;
          const response = await fetch(url + cacheBuster);
          const res = await response.json();
          // El nuevo formato de la Cloud Function usa 'data' para ambos roles
          if (res.success && Array.isArray(res.data)) {
            setFullDocentesData(res.data);
            // Si el JSON no trae la distribución precalculada, la calcularemos o usaremos la data directamente
            setDataProfesoresBuckets(res.distribucionDocentes || []); 
            setTotalDocentesBuckets(res.totalDocentes || res.data.length || 0);
            return;
          }
        }
      }
      console.warn('⚠️ No hay consolidado de docentes disponible.');
      setDataProfesoresBuckets([]);
      setTotalDocentesBuckets(0);
      setFullDocentesData(null);
    } catch (error) {
      console.error('❌ Error al cargar consolidado de docentes (Storage):', error);
      setDataProfesoresBuckets([]);
    } finally {
      setLoadingProfesoresBuckets(false);
    }
  };

  const fetchReportePreguntas = async () => {
    const idEval = route.query.idEvaluacion;
    if (!idEval || monthSelected === undefined || !yearSelected) return;
    setLoadingReportePreguntas(true);
    try {
      console.log('🚀 [Storage] Buscando consolidado de preguntas en Firestore...');
      const consolidadoRef = doc(db, `evaluaciones/${idEval}/consolidados`, `preguntas_${yearSelected}_${monthSelected}`);
      const consolidadoSnap = await getDoc(consolidadoRef);

      if (consolidadoSnap.exists()) {
        const { url } = consolidadoSnap.data();
        if (url) {
          // Añadimos un timestamp para evitar que el navegador use una versión en caché (Cache-busting)
          const cacheBuster = `?t=${Date.now()}`;
          const response = await fetch(url + cacheBuster);
          const res = await response.json();
          if (res.success && Array.isArray(res.data)) {
            setDataReportePreguntas(res.data);
            return;
          }
        }
      }
      console.warn('⚠️ No hay consolidado de preguntas disponible.');
      setDataReportePreguntas([]);
    } catch (error) {
      console.error('❌ Error al cargar consolidado de preguntas (Storage):', error);
      setDataReportePreguntas([]);
    } finally {
      setLoadingReportePreguntas(false);
    }
  };

  // --- CARGA AUTOMÁTICA OPTIMIZADA DESDE STORAGE (EFECTO SEGURO) ---
  useEffect(() => {
    const idEval = route.query.idEvaluacion;
    if (!idEval || monthSelected === undefined || !yearSelected) return;

    // Ejecutar carga barata de forma automática
    const loadAllConsolidados = async () => {
      console.log('🔄 [Auto-Load] Intentando cargar consolidados existentes para:', idEval, yearSelected, monthSelected);
      await Promise.all([
        loadConsolidado(),
        fetchBarGraphicsData(),
        fetchReportePreguntas()
      ]);
    };

    loadAllConsolidados();
  }, [route.query.idEvaluacion, monthSelected, yearSelected]);

  const handleBarClick = async (range: string) => {
    setSelectedRange(range);

    // Scroll suave al detalle
    setTimeout(() => {
      drillDownRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 100);
  };

  const handleSaveMeta = async (newMeta: number) => {
    const idEval = route.query.idEvaluacion;
    if (!idEval) return;

    try {
      console.log(`💾 Guardando nueva meta global: ${newMeta}%`);
      const evalRef = doc(db, 'evaluaciones', String(idEval));
      await updateDoc(evalRef, {
        metaSatisfactorio: newMeta
      });

      // Actualizar el contexto global para que todos los componentes se enteren
      dispatch({
        type: AppAction.EVALUACION,
        payload: {
          ...evaluacion,
          metaSatisfactorio: newMeta
        }
      });

      alert('✅ Meta global actualizada exitosamente.');
    } catch (error) {
      console.error('❌ Error al guardar meta global:', error);
      alert('❌ Error al guardar la meta global.');
    }
  };

  const filteredDocentesByRange = useMemo(() => {
    if (!fullDocentesData || !selectedRange) return [];

    // El rango viene como "0-20%", "20-40%", etc.
    const match = selectedRange.match(/(\d+)-(\d+)%/);
    if (!match) return [];

    const min = parseFloat(match[1]);
    const max = parseFloat(match[2]);

    return fullDocentesData.filter((doc: any) => {
      const satNivel = doc.niveles?.find((n: any) => n.nivel?.toLowerCase().includes('satisfactorio'));
      const satCount = satNivel ? satNivel.cantidadDeEstudiantes : 0;
      const totalEst = doc.totalEstudiantes || 0;
      const percentage = totalEst > 0 ? (satCount / totalEst) * 100 : 0;

      return percentage >= min && percentage <= max;
    });
  }, [fullDocentesData, selectedRange]);

  // --- CALCULO DINÁMICO DE BUCKETS PARA DOCENTES ---
  const computedDocentesBuckets = useMemo(() => {
    if (!fullDocentesData || fullDocentesData.length === 0) return [];
    
    const ranges = [
      { label: '0-20%', min: 0, max: 20, color: '#ef4444' },
      { label: '20-40%', min: 20, max: 40, color: '#f97316' },
      { label: '40-60%', min: 40, max: 60, color: '#eab308' },
      { label: '60-80%', min: 60, max: 80, color: '#84cc16' },
      { label: '80-100%', min: 80, max: 101, color: '#22c55e' },
    ];

    const counts = ranges.map(r => ({ rango: r.label, cantidad: 0, color: r.color }));

    fullDocentesData.forEach(doc => {
      const satNivel = doc.niveles?.find((n: any) => n.nivel?.toLowerCase().includes('satisfactorio'));
      const satCount = satNivel ? satNivel.cantidadDeEstudiantes : 0;
      const totalEst = doc.totalEstudiantes || 0;
      const percentage = totalEst > 0 ? (satCount / totalEst) * 100 : 0;

      const rangeIdx = ranges.findIndex(r => percentage >= r.min && percentage < r.max);
      if (rangeIdx !== -1) {
        counts[rangeIdx].cantidad++;
      }
    });

    return counts;
  }, [fullDocentesData]);

  // Verificar si hay datos reales para el gráfico de pastel en el mes seleccionado
  const hasPieChartData = useMemo(() => {
    // El gráfico prioriza dataGraficoPieChart del contexto, luego usa dataGraficoTendenciaNiveles
    const sourceData = (Array.isArray(dataGraficoPieChart) && dataGraficoPieChart.length > 0) 
      ? dataGraficoPieChart 
      : dataGraficoTendenciaNiveles;

    if (!sourceData || !Array.isArray(sourceData)) return false;
    
    // Buscamos los datos del mes seleccionado
    const datosMes = sourceData.find((item: any) => item.mes === monthSelected);
    if (!datosMes || !datosMes.niveles) return false;

    // Sumamos la cantidad de estudiantes
    const total = datosMes.niveles.reduce((acc: number, n: any) => acc + (n.cantidadDeEstudiantes || 0), 0);
    
    return total > 0;
  }, [dataGraficoPieChart, dataGraficoTendenciaNiveles, monthSelected]);

  // Función para resaltar texto de búsqueda
  const highlightText = (text: string, term: string) => {
    if (!term.trim() || !text) return text;
    const parts = String(text).split(new RegExp(`(${term})`, 'gi'));
    return (
      <>
        {parts.map((part, i) => 
          part.toLowerCase() === term.toLowerCase() 
            ? <mark key={i} style={{ backgroundColor: '#fde047', color: '#000', padding: '0 2px', borderRadius: '2px' }}>{part}</mark> 
            : part
        )}
      </>
    );
  };

  const handleDirectorSegmentClick = (status: 'participo' | 'no_participo' | 'all') => {
    setSelectedDirectorStatus(status);
    setTimeout(() => {
      directorsDetailRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 100);
  };

  const filteredDirectoresByStatus = useMemo(() => {
    if (!dataDirectoresBar) return [];
    
    // 1. Filtrar por estado (Participó / No Participó / Todos)
    let filtered = dataDirectoresBar;
    
    if (selectedDirectorStatus && selectedDirectorStatus !== 'all') {
      filtered = dataDirectoresBar.filter(d => {
        const isParticipante = !!d.participo || (d.totalEstudiantes > 0);
        return selectedDirectorStatus === 'participo' ? isParticipante : !isParticipante;
      });
    }

    // 2. Filtrar por Región/UGEL usando el ID
    if (selectedRegionDirector !== 'all') {
      filtered = filtered.filter(d => String(d.region) === selectedRegionDirector);
    }

    // 3. Filtrar por búsqueda inteligente
    if (!searchTermDirector.trim()) return filtered;

    const term = searchTermDirector.toLowerCase().trim();
    return filtered.filter(d => 
      d.dniDirector?.toLowerCase().includes(term) ||
      d.nombres?.toLowerCase().includes(term) ||
      d.apellidos?.toLowerCase().includes(term) ||
      d.institucion?.toLowerCase().includes(term)
    );
  }, [dataDirectoresBar, selectedDirectorStatus, searchTermDirector, selectedRegionDirector]);

  // --- RESUMEN DE ESTADÍSTICAS DE DIRECTORES ---
  const directoresStats = useMemo(() => {
    if (!dataDirectoresBar) return { participo: 0, no_participo: 0, total: 0 };
    
    const baseList = selectedRegionDirector === 'all' 
      ? dataDirectoresBar 
      : dataDirectoresBar.filter(d => String(d.region) === selectedRegionDirector);

    const participoCount = baseList.filter(d => !!d.participo || (d.totalEstudiantes > 0)).length;
    
    return {
      participo: participoCount,
      no_participo: baseList.length - participoCount,
      total: baseList.length
    };
  }, [dataDirectoresBar, selectedRegionDirector]);

  const handleRestablecerFiltros = () => {
    setFiltros({
      region: '',
      distrito: '',
      genero: '',
      area: '',
    });
    restablecerFiltrosDeEspecialista(`${route.query.idEvaluacion}`, monthSelected, yearSelected);
  }
  // Función optimizada para renderizar pregunta usando el mapa
  const iterarPregunta = useCallback(
    (idPregunta: string) => {
      const pregunta = preguntasMap.get(idPregunta);
      if (!pregunta) {
        return <p>Pregunta no encontrada</p>;
      }
      return (
        <>
          <h3 className="text-slate-500 mr-2">{pregunta.pregunta}</h3>
          <h3 className="text-slate-500 mr-2">
            <span className="text-colorSegundo mr-2 font-semibold">Actuación:</span>{' '}
            {pregunta.preguntaDocente}
          </h3>
        </>
      );
    },
    [preguntasMap]
  );

  // Función optimizada para obtener respuesta usando el mapa
  const obtenerRespuestaPorId = useCallback(
    (idPregunta: string): string => {
      const pregunta = preguntasMap.get(idPregunta);
      return pregunta?.respuesta || '';
    },
    [preguntasMap]
  );

  const handleValidateRespuesta = (data: PreguntasRespuestas) => {
    const rta: Alternativa | undefined = data.alternativas?.find((r) => r.selected === true);
    if (rta?.alternativa) {
      if (rta.alternativa.toLowerCase() === data.respuesta?.toLowerCase()) {
        return <div className={styles.correctAnswer}>si</div>;
      } else {
        return <div className={styles.incorrectAnswer}>no</div>;
      }
    }
  };

  const handleFiltrarPreguntas = async () => {
    const idEval = route.query.idEvaluacion;
    if (!idEval || monthSelected === undefined || !yearSelected) return;

    setLoadingReportePreguntas(true);
    try {
      const callPreguntas = httpsCallable(functions, 'getDataReporteEvaluacionPorPreguntas');
      const result = await callPreguntas({
        idEvaluacion: idEval,
        año: yearSelected,
        mes: monthSelected,
        region: filtros.region,
        distrito: filtros.distrito,
        area: filtros.area,
        genero: filtros.genero
      });

      const dataResult = result.data as any;
      if (dataResult.success && Array.isArray(dataResult.data)) {
        setDataReportePreguntas(dataResult.data);
        toast.success('✅ Reporte de preguntas filtrado correctamente.');
      } else {
        toast.warning('⚠️ No se encontraron datos para los filtros seleccionados.');
      }
    } catch (error: any) {
      console.error('❌ Error al filtrar reporte de preguntas:', error);
      toast.error(`Error: ${error.message || 'Error desconocido'}`);
    } finally {
      setLoadingReportePreguntas(false);
    }
  };

  const options = {
    interaction: {
      intersect: false,
      mode: 'index' as const,
    },
    plugins: {
      legend: {
        position: 'center' as const,
      },
      title: {
        display: true,
        text: 'estadistica de respuestas',
      },
      tooltip: {
        backgroundColor: 'rgba(15, 23, 42, 0.95)',
        titleColor: '#ffffff',
        bodyColor: '#ffffff',
        borderColor: 'rgba(59, 130, 246, 0.5)',
        borderWidth: 2,
        cornerRadius: 12,
        displayColors: true,
        titleFont: {
          size: 16,
          weight: 'bold' as const,
          family: "'Inter', 'Helvetica', 'Arial', sans-serif",
        },
        bodyFont: {
          size: 14,
          family: "'Inter', 'Helvetica', 'Arial', sans-serif",
        },
        padding: 16,
        titleSpacing: 8,
        bodySpacing: 8,
        boxPadding: 8,
        callbacks: {
          title: function (context: any) {
            return `📊 Alternativa: ${context[0].label.toUpperCase()}`;
          },
          label: function (context: any) {
            const value = context.parsed.y;
            const dataset = context.dataset;
            const total = Array.isArray(dataset.data)
              ? dataset.data.reduce((a: number, b: number) => a + b, 0)
              : 0;
            const percentage = total > 0 ? ((value / total) * 100).toFixed(1) : '0.0';
            return [
              `👥 Cantidad: ${value.toLocaleString('es-PE')}`,
              `📈 Porcentaje: ${percentage}%`,
              `📊 Total: ${total.toLocaleString('es-PE')}`,
            ];
          },
          labelColor: function (context: any) {
            const dataset = context.dataset;
            const index = context.dataIndex;
            const borderColor = Array.isArray(dataset.borderColor)
              ? dataset.borderColor[index]
              : (typeof dataset.borderColor === 'string' ? dataset.borderColor : '#6b7280');
            const backgroundColor = Array.isArray(dataset.backgroundColor)
              ? dataset.backgroundColor[index]
              : (typeof dataset.backgroundColor === 'string' ? dataset.backgroundColor : '#6b7280');

            return {
              borderColor: borderColor,
              backgroundColor: backgroundColor,
              borderWidth: 3,
              borderRadius: 4,
            };
          },
        },
      },
    },
    scales: {
      x: {
        ticks: {
          color: function (context: any) {
            // Obtener el color de fondo de la barra correspondiente
            const chart = context.chart;
            const dataset = chart.data.datasets[0];
            const index = context.index;
            const bgColor = Array.isArray(dataset.backgroundColor)
              ? dataset.backgroundColor[index]
              : (typeof dataset.backgroundColor === 'string' ? dataset.backgroundColor : '');
            // Si el color es verde (rgb(34, 197, 94) o rgba(34, 197, 94)), es la alternativa correcta
            if (bgColor.includes('34, 197, 94') || bgColor.includes('rgb(34, 197, 94)')) {
              return '#22c55e'; // Verde para la alternativa correcta
            }
            return '#374151'; // Color gris por defecto
          },
          font: {
            size: 13,
            weight: '600' as const,
            family: "'Inter', 'Helvetica', 'Arial', sans-serif",
          },
        },
      },
    },
  };
  const handleChangeMonth = (e: React.ChangeEvent<HTMLSelectElement>) => {
    console.log('Select Mes value:', e.target.value);
    const selectedMonth = getAllMonths.find((mes) => mes.name === e.target.value);
    setMonthSelected(selectedMonth ? selectedMonth.id : currentMonth);
  };

  // Función para exportar datos a Excel
  const handleExportToExcel = async () => {
    // Mostrar confirmación antes de proceder
    const confirmacion = window.confirm(
      '¿Deseas generar un archivo Excel con los datos de las evaluaciones?\n\n' +
      'Esta acción descargará un archivo con todos los datos disponibles.'
    );

    if (!confirmacion) {
      return;
    }

    setLoadingExport(true);

    try {
      const resultado = await getAllReporteDeDirectoreToAdmin(`${route.query.idEvaluacion}`, monthSelected, yearSelected);

      if (!resultado || resultado.length === 0) {
        alert('No hay datos disponibles para exportar');
        return;
      }

      const fileName = `evaluaciones_director_docente_${new Date().toISOString().split('T')[0]
        }.xlsx`;
      exportDirectorDocenteDataToExcel(resultado, fileName);

      alert('Archivo Excel exportado exitosamente');
    } catch (error) {
      alert('Error al exportar los datos. Por favor, inténtalo de nuevo.');
    } finally {
      setLoadingExport(false);
    }
  };

  if (loaderReporteDirector) {
    return (
      <div className={styles.loaderContainer}>
        <div className={styles.loaderContent}>
          <RiLoader4Line className={styles.loaderIcon} />
          <span className={styles.loaderText}>...cargando</span>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className={styles.mainContainer}>
        <main>
          <h1 className={styles.title}>{evaluacion?.nombre?.toUpperCase() || 'REPORTE'}</h1>

          <div className={styles.toolbar}>
            <div className={styles.controlsGroup}>
              <select
                className={styles.select}
                onChange={handleChangeMonth}
                value={getAllMonths[monthSelected]?.name || ''}
              >
                <option value="">Mes</option>
                {getAllMonths.slice(0, yearSelected < currentYear ? getAllMonths.length : currentMonth + 1).map((mes) => (
                  <option key={mes.id} value={mes.name}>
                    {mes.name}
                  </option>
                ))}
              </select>

              <select
                className={styles.select}
                onChange={handleChangeYear}
                value={yearSelected}
              >
                {years.map((year) => (
                  <option key={year} value={year}>
                    {year}
                  </option>
                ))}
              </select>

              {/* Selector de Layout de Gráficos */}
              <div className={styles.layoutSelector}>
                <button
                  onClick={() => setChartColumns(1)}
                  className={`${styles.layoutButton} ${chartColumns === 1 ? styles.layoutButtonActive : ''}`}
                  title="1 Columna"
                >
                  <MdViewStream />
                </button>
                <button
                  onClick={() => setChartColumns(2)}
                  className={`${styles.layoutButton} ${chartColumns === 2 ? styles.layoutButtonActive : ''}`}
                  title="2 Columnas"
                >
                  <MdGridView />
                </button>
                <button
                  onClick={() => setChartColumns(3)}
                  className={`${styles.layoutButton} ${chartColumns === 3 ? styles.layoutButtonActive : ''}`}
                  title="3 Columnas"
                >
                  <MdViewModule />
                </button>
              </div>
            </div>

            <div className={styles.exportGroup}>
              <button
                onClick={handleExportEstudiantesToExcel}
                className={styles.primaryButton}
                disabled={loadingExportEstudiantes}
              >
                {loadingExportEstudiantes ? (
                  <>
                    <RiLoader4Line className={styles.loaderIcon} />
                    <span>Procesando...</span>
                  </>
                ) : (
                  <>
                    <RiFileExcel2Line />
                    <span>Estudiantes</span>
                  </>
                )}
              </button>

              <button
                className={styles.secondaryButton}
                onClick={handleExportToExcel}
                disabled={loadingExport}
              >
                {loadingExport ? (
                  <>
                    <RiLoader4Line className={styles.loaderIcon} />
                    <span>Exportando...</span>
                  </>
                ) : (
                  <>
                    <RiDownloadLine />
                    <span>Exportar Excel</span>
                  </>
                )}
              </button>

              {currentUserData.rol === 4 && (
                <div style={{ display: 'flex', gap: '10px' }}>
                  <button
                    onClick={async () => {
                      toast.info('⏳ Cargando datos consolidados...');
                      await Promise.all([
                        loadConsolidado(),
                        fetchBarGraphicsData(),
                        fetchReportePreguntas()
                      ]);
                      toast.success('✅ Carga desde Storage completada.');
                    }}
                    className={styles.secondaryButton}
                    onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = '#e5e7eb')}
                    onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
                  >
                    <MdVisibility />
                    <span>Ver Consolidado</span>
                  </button>

                  <button
                    onClick={handleGenerarConsolidado}
                    className={styles.primaryButton}
                    style={{ 
                      backgroundColor: (loadingConsolidado || !hasPieChartData) ? '#94a3b8' : '#4f46e5', 
                      color: 'white',
                      cursor: (loadingConsolidado || !hasPieChartData) ? 'not-allowed' : 'pointer'
                    }}
                    disabled={loadingConsolidado || !hasPieChartData}
                  >
                    {consolidationStatus?.status === 'processing' ? (
                      <>
                        <RiLoader4Line className={styles.loaderIcon} />
                        <span>{consolidationStatus.progress}% - {consolidationStatus.message || 'Procesando...'}</span>
                      </>
                    ) : loadingConsolidado ? (
                      <>
                        <RiLoader4Line className={styles.loaderIcon} />
                        <span>Iniciando...</span>
                      </>
                    ) : (
                      <>
                        <MdAnalytics />
                        <span>Generar Consolidado</span>
                      </>
                    )}
                  </button>

                  {consolidationStatus?.status === 'processing' && (
                    <button
                      onClick={handleDetenerConsolidado}
                      className={styles.secondaryButton}
                      style={{ 
                        backgroundColor: '#ef4444', 
                        color: 'white',
                        marginLeft: '8px'
                      }}
                    >
                      <MdClose />
                      <span>Detener</span>
                    </button>
                  )}
                </div>
              )}


            </div>
          </div>

          {/* <FiltrosReporte
            filtros={filtros}
            distritosDisponibles={distritosDisponibles}
            handleChangeFiltros={handleChangeFiltros}
            handleFiltrar={handleFiltrar}
            handleRestablecerFiltros={handleRestablecerFiltros}
          /> */}

          {/* Sistema de Grillas para Reportes */}
          <div className={styles.chartsGrid}>

            {/* Gráfico de distribución (Pie Chart) */}
            <div className={chartColumns === 1 ? styles.gridItemFull : chartColumns === 2 ? styles.gridItemHalf : styles.gridItemThird}>
              {
                evaluacion.tipoDeEvaluacion === '1' ? (
                  <PieChartComponent
                    monthSelected={monthSelected}
                    yearSelected={yearSelected}
                    dataGraficoTendenciaNiveles={dataGraficoTendenciaNiveles}
                    filtros={filtros}
                    onFilterChange={(name, value) => {
                      setFiltros(prev => ({ ...prev, [name]: value }));
                    }}
                  />
                ) : null
              }
            </div>

            {/* Comparativa por UGEL Stacked Bar Chart */}
            <div className={chartColumns === 1 ? styles.gridItemFull : chartColumns === 2 ? styles.gridItemHalf : styles.gridItemThird}>
              {
                evaluacion.tipoDeEvaluacion === '1' && (
                  loaderDataGraficoUgelStacked ? (
                    <div className={styles.loaderContainer} style={{ minHeight: '300px' }}>
                      <div className={styles.loaderContent}>
                        <RiLoader4Line className={styles.loaderIcon} />
                        <span className={styles.loaderText}>Procesando comparativa regional...</span>
                      </div>
                    </div>
                  ) : (
                    dataGraficoUgelStacked && dataGraficoUgelStacked.length > 0 && (
                      <BarChartUgelStacked data={dataGraficoUgelStacked} />
                    )
                  )
                )
              }
            </div>


            {/* Gráfico de Ranking de Directores */}
            <div className={chartColumns === 1 ? styles.gridItemFull : chartColumns === 2 ? styles.gridItemHalf : styles.gridItemThird}>
              {
                evaluacion.tipoDeEvaluacion === '1' && (
                  loadingDirectoresBar ? (
                    <div className={styles.loaderContainer} style={{ minHeight: '300px' }}>
                      <div className={styles.loaderContent}>
                        <RiLoader4Line className={styles.loaderIcon} />
                        <span className={styles.loaderText}>Procesando analytics de directores...</span>
                      </div>
                    </div>
                  ) : (
                    dataDirectoresBar && dataDirectoresBar.length > 0 && (
                      <BarChartDirectores data={dataDirectoresBar} />
                    )
                  )
                )
              }
            </div>

            {/* Gráfico de Ranking de Docentes */}
            <div className={chartColumns === 1 ? styles.gridItemFull : chartColumns === 2 ? styles.gridItemHalf : styles.gridItemThird}>
              {
                evaluacion.tipoDeEvaluacion === '1' && !loadingProfesoresBuckets && fullDocentesData && fullDocentesData.length > 0 && (
                  <BarChartDocentes data={fullDocentesData} />
                )
              }
            </div>

            {/* Gráfico de distribución por niveles para docentes (Buckets) */}
            <div className={chartColumns === 1 ? styles.gridItemFull : chartColumns === 2 ? styles.gridItemHalf : styles.gridItemThird}>
              {
                evaluacion.tipoDeEvaluacion === '1' && (
                  loadingProfesoresBuckets ? (
                    <div className={styles.loaderContainer} style={{ minHeight: '200px' }}>
                      <div className={styles.loaderContent}>
                        <RiLoader4Line className={styles.loaderIcon} />
                        <span className={styles.loaderText}>Cargando distribución de docentes...</span>
                      </div>
                    </div>
                  ) : (
                    computedDocentesBuckets.length > 0 && (
                      <BarChartDocentesBuckets
                        data={computedDocentesBuckets}
                        totalDocentes={fullDocentesData?.length || 0}
                        onBarClick={handleBarClick}
                      />
                    )
                  )
                )
              }
            </div>

            {/* Gráfico de Participación de Directores (Movido al final) */}
            <div className={chartColumns === 1 ? styles.gridItemFull : chartColumns === 2 ? styles.gridItemHalf : styles.gridItemThird}>
              {
                evaluacion.tipoDeEvaluacion === '1' && (
                  loadingDirectoresBar ? (
                    <div className={styles.loaderContainer} style={{ minHeight: '300px' }}>
                      <div className={styles.loaderContent}>
                        <RiLoader4Line className={styles.loaderIcon} />
                        <span className={styles.loaderText}>Cargando participación...</span>
                      </div>
                    </div>
                  ) : (
                    dataDirectoresBar && dataDirectoresBar.length > 0 && (
                      <ParticipacionDirectoresChart 
                        data={dataDirectoresBar} 
                        onSegmentClick={handleDirectorSegmentClick}
                      />
                    )
                  )
                )
              }
            </div>
          </div>

          {/* Componente de acordeón para gráficos de tendencia */}
          {/* Detalle de Docentes (Leaderboard Stacked) */}
          <div ref={drillDownRef}>
            {selectedRange && (
              loadingFullDocentes ? (
                <div className={styles.modalLoader} style={{ minHeight: '300px' }}>
                  <RiLoader4Line className={styles.loaderIcon} />
                  <span>Cargando detalle de docentes...</span>
                </div>
              ) : (
                filteredDocentesByRange.length > 0 && (
                  <BarChartDocenteDetalle
                    data={filteredDocentesByRange}
                    selectedRange={selectedRange || ''}
                    metaSatisfactorio={evaluacion?.metaSatisfactorio || 80}
                    onSaveMeta={handleSaveMeta}
                  />
                )
              )
            )}
          </div>



          {
            evaluacion.tipoDeEvaluacion === '1' ? (
              <AcordeonGraficosTendencia
                rangoMes={rangoMes}
                monthSelected={monthSelected}
                yearSelected={yearSelected}
                setRangoMes={setRangoMes}
                onRangoChange={handleRangoChange}
                idEvaluacion={`${route.query.idEvaluacion}`}
              />
            )
              : null
          }
          {/* Componente de acordeón para reporte por pregunta */}
          <AcordeonReportePregunta
            preguntasMap={preguntasMap}
            iterarPregunta={iterarPregunta}
            obtenerRespuestaPorId={obtenerRespuestaPorId}
            iterateData={iterateData}
            options={options}
            filtros={filtros}
            distritosDisponibles={distritosDisponibles}
            handleChangeFiltros={handleChangeFiltros}
            handleRestablecerFiltros={handleRestablecerFiltros}
            handleFiltrar={handleFiltrarPreguntas}
            yearSelected={yearSelected}
            dataReportePreguntas={dataReportePreguntas}
            loadingReportePreguntas={loadingReportePreguntas}
            questionColumns={questionColumns}
            setQuestionColumns={setQuestionColumns}
            globalStyles={styles}
          />
          {/* Detalle de Directores (Participación) */}
          <div ref={directorsDetailRef} style={{ marginTop: '2rem' }}>
            {(selectedDirectorStatus || selectedRegionDirector !== 'all') && (
              <div className={styles.detailCard}>
                <div className={styles.detailHeader}>
                  <div className={styles.detailTitleWrapper}>
                    <h3 className={styles.detailTitle}>
                      {selectedDirectorStatus === 'participo' ? 'Directores que Participaron' : 
                       selectedDirectorStatus === 'no_participo' ? 'Directores que No Participaron (Omisos)' : 
                       'Reporte de Participación de Directores'}
                    </h3>
                    <span className={styles.detailSubtitle}>
                      {selectedRegionDirector !== 'all' && <strong style={{ color: '#1e293b' }}>UGEL {regionTexto(selectedRegionDirector)} | </strong>}
                      Participaron: <strong style={{ color: '#10b981' }}>{directoresStats.participo}</strong> | 
                      No Participaron: <strong style={{ color: '#ef4444' }}>{directoresStats.no_participo}</strong> | 
                      Total: <strong>{directoresStats.total}</strong>
                    </span>
                  </div>
                  <div className={styles.detailActions}>
                    <div className={styles.filterWrapper}>
                      <select 
                        className={styles.limitSelect}
                        value={pageSizeDirector}
                        onChange={(e) => setPageSizeDirector(e.target.value === 'all' ? 'all' : Number(e.target.value))}
                      >
                        <option value={100}>Mostrar 100</option>
                        <option value="all">Mostrar Todos</option>
                      </select>

                      <select 
                        className={styles.regionSelect}
                        value={selectedRegionDirector}
                        onChange={(e) => setSelectedRegionDirector(e.target.value)}
                      >
                        <option value="all">Todas las UGEL</option>
                        {regiones.map(reg => (
                          <option key={reg.id} value={String(reg.id)}>{reg.region}</option>
                        ))}
                      </select>

                      <select 
                        className={styles.limitSelect}
                        value={selectedDirectorStatus || 'all'}
                        onChange={(e) => setSelectedDirectorStatus(e.target.value as any)}
                        style={{ border: '1px solid #3b82f6', fontWeight: 600 }}
                      >
                        <option value="all">Estado: Todos</option>
                        <option value="participo">Participó</option>
                        <option value="no_participo">No Participó</option>
                      </select>
                    </div>
                    <div className={styles.searchWrapper}>
                      <MdSearch style={{ marginRight: '8px', color: '#64748b', fontSize: '1.2rem' }} />
                      <input 
                        type="text" 
                        placeholder="DNI, Nombre, I.E..."
                        className={styles.searchInput}
                        value={searchTermDirector}
                        onChange={(e) => setSearchTermDirector(e.target.value)}
                      />
                    </div>
                    <button 
                      className={styles.closeBtn}
                      onClick={() => {
                        setSelectedDirectorStatus(null);
                        setSearchTermDirector('');
                        setSelectedRegionDirector('all');
                      }}
                    >
                      Cerrar Detalle
                    </button>
                  </div>
                </div>

                <div className={styles.tableWrapper}>
                  <table className={styles.customTable}>
                    <thead>
                      <tr>
                        <th>#</th>
                        <th>DNI</th>
                        <th>Director</th>
                        <th>Institución Educativa</th>
                        <th>UGEL / Región</th>
                        <th>Estado</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredDirectoresByStatus
                        .slice(0, pageSizeDirector === 'all' ? filteredDirectoresByStatus.length : pageSizeDirector)
                        .map((director, idx) => {
                          const isParticipante = !!director.participo || (director.totalEstudiantes > 0);
                          const nombreCompleto = `${director.nombres || ''} ${director.apellidos || ''}`.trim() || 'N/A';
                          
                          return (
                            <tr key={idx}>
                              <td style={{ fontWeight: 600, color: '#64748b', width: '40px' }}>{idx + 1}</td>
                              <td className={styles.dniCell}>{highlightText(director.dniDirector, searchTermDirector)}</td>
                              <td className={styles.nameCell}>{highlightText(nombreCompleto, searchTermDirector)}</td>
                              <td>{highlightText(director.institucion || 'N/A', searchTermDirector)}</td>
                              <td className={styles.ugelCell}>
                                {regionTexto(director.region) || 'N/A'}
                              </td>
                              <td>
                                <span className={isParticipante ? styles.statusBadgeActive : styles.statusBadgePending}>
                                  {isParticipante ? 'Participó' : 'Pendiente'}
                                </span>
                              </td>
                            </tr>
                          );
                        })}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        </main>
      </div>
    </>
  );
};

export default Reporte;
Reporte.Auth = PrivateRouteEspecialista;
