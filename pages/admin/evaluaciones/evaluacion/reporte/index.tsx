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
import { MdAddCircle, MdAnalytics, MdCalendarToday, MdClose, MdDeleteForever, MdEditSquare, MdFileDownload, MdVisibility, MdVisibilityOff } from 'react-icons/md';
import styles from './Reporte.module.css';
import { currentMonth, getAllMonths } from '@/fuctions/dates';
import PrivateRouteEspecialista from '@/components/layouts/PrivateRoutesEspecialista';
import { useReporteEspecialistas } from '@/features/hooks/useReporteEspecialistas';
import { distritosPuno } from '@/fuctions/provinciasPuno';
import { exportDirectorDocenteDataToExcel } from '@/features/utils/excelExport';
import { useCrearEstudiantesDeDocente } from '@/features/hooks/useCrearEstudiantesDeDocente';
import { useCrearPuntajeProgresiva } from '@/features/hooks/useCrearPuntajeProgresiva';
import AcordeonGraficosTendencia from '@/components/reportes/AcordeonGraficosTendencia';
import AcordeonReportePregunta from '@/components/reportes/AcordeonReportePregunta';
import PieChartComponent from '@/components/reportes/PieChartComponent';
import FiltrosReporte from '@/components/reportes/FiltrosReporte';
import { useExportExcel } from '@/features/hooks/useExportExcel';
import { httpsCallable } from 'firebase/functions';
import { getDoc, doc, updateDoc } from "firebase/firestore";
import { functions, db } from '@/firebase/firebase.config';
import BarChartDirectores from '@/components/reportes/BarChartDirectores';
import BarChartDocentes from '@/components/reportes/BarChartDocentes';
import BarChartDocentesBuckets from '@/components/reportes/BarChartDocentesBuckets';
import BarChartDocenteDetalle from '@/components/reportes/BarChartDocenteDetalle';
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
  const [dataReportePreguntas, setDataReportePreguntas] = useState<any[]>([]);
  const [loadingReportePreguntas, setLoadingReportePreguntas] = useState(false);

  // Drill-down para docentes
  const [fullDocentesData, setFullDocentesData] = useState<any[] | null>(null);
  const [selectedRange, setSelectedRange] = useState<string | null>(null);
  const [loadingFullDocentes, setLoadingFullDocentes] = useState(false);
  const [loadingConsolidado, setLoadingConsolidado] = useState(false);
  const drillDownRef = useRef<HTMLDivElement>(null);

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

    const confirmacion = window.confirm(
      '🚀 ¿Deseas generar la consolidación completa de datos?\n\n' +
      'Esto actualizará los archivos JSON en Storage y los resúmenes en Firestore para docentes, directores y preguntas.'
    );

    if (!confirmacion) return;

    setLoadingConsolidado(true);
    try {
      const payload = {
        idEvaluacion: idEval,
        año: yearSelected,
        mes: monthSelected
      };

      console.log('🚀 [Consolidación] Iniciando proceso...');

      const callAgregado = httpsCallable(functions, 'getDataReporteAgregadoPorRol');
      const callPreguntas = httpsCallable(functions, 'getDataReporteEvaluacionPorPreguntas');

      // 1. Consolidar Docentes
      toast.info('⏳ Consolidando datos de docentes...');
      await callAgregado({ ...payload, rol: 'docente' });

      // 2. Consolidar Directores
      toast.info('⏳ Consolidando datos de directores...');
      await callAgregado({ ...payload, rol: 'director' });

      // 3. Consolidar Preguntas
      toast.info('⏳ Consolidando reporte de preguntas...');
      await callPreguntas(payload);

      toast.success('✅ Consolidación completada exitosamente.');

      // 4. Recargar todos los datos en la vista (desde los nuevos JSON en Storage)
      await Promise.all([
        loadConsolidado(),
        fetchBarGraphicsData(),
        fetchReportePreguntas()
      ]);

      // Forzar recarga de estadísticas globales y pie chart
      const idEvalStr = String(idEval);
      getReporteEspecialistaPorUgel(idEvalStr, monthSelected, yearSelected);

    } catch (error: any) {
      console.error('❌ Error en consolidación:', error);
      toast.error(`Error: ${error.message || 'Error desconocido'}`);
    } finally {
      setLoadingConsolidado(false);
    }
  };

  const { prepareBarChartData } = useColorsFromCSS();

  const iterateData = (data: DataEstadisticas, respuesta: string) => {
    const numOpciones = data.d === undefined ? 3 : 4;
    const chartData = prepareBarChartData(data, respuesta, numOpciones);

    // Convertir labels a mayúsculas
    chartData.labels = chartData.labels.map((label: string) => label.toUpperCase());

    return chartData;
  };
  const {
    reporteParaTablaDeEspecialista,
    getEstadisticaGlobal,
    getAllReporteDeDirectoreToAdmin,
    getDataGraficoPieChart,
    restablecerFiltrosDeEspecialista,
    getReporteEspecialistaPorUgel
  } = useReporteEspecialistas();
  const {
    currentUserData,
    preguntasRespuestas,
    loaderReporteDirector,
    allEvaluacionesDirectorDocente,
    dataEstadisticaEvaluacion,
    evaluacion,
    dataGraficoTendenciaNiveles,
  } = useGlobalContext();
  const dispatch = useGlobalContextDispatch();
  const { getPreguntasRespuestas, getEvaluacion } = useAgregarEvaluaciones();
  const route = useRouter();
  const [monthSelected, setMonthSelected] = useState(currentMonth);

  const currentYear = new Date().getFullYear();
  const years = Array.from({ length: currentYear - 2025 + 1 }, (_, i) => 2025 + i);
  const [yearSelected, setYearSelected] = useState(currentYear);

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
          const response = await fetch(url);
          const res = await response.json();
          if (res.success && res.data) {
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
          const response = await fetch(url);
          const res = await response.json();
          if (res.success && Array.isArray(res.distribucionDocentes)) {
            setDataProfesoresBuckets(res.distribucionDocentes);
            setTotalDocentesBuckets(res.totalDocentes || 0);
            setFullDocentesData(res.finalDocentes || null);
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
          const response = await fetch(url);
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

  // --- CARGA DE DATOS ELIMINADA DE USEEFFECT (SE EJECUTA POR BOTÓN) ---

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

    // El rango viene como "0% - 25%" o "75.1% - 100%"
    const match = selectedRange.match(/([\d.]+)%\s*-\s*([\d.]+)%/);
    if (!match) return [];

    const min = parseFloat(match[1]);
    const max = parseFloat(match[2]);

    return fullDocentesData.filter((doc: any) => {
      const val = doc.porcentajeSatisfactorio;
      // Inclusión: 0-25, 25.1-50, ...
      return val >= min && val <= max;
    });
  }, [fullDocentesData, selectedRange]);

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

  // Función para generar reporte usando Firebase Functions



  return (
    <>
      {loaderReporteDirector ? (
        <div className={styles.loaderContainer}>
          <div className={styles.loaderContent}>
            <RiLoader4Line className={styles.loaderIcon} />
            <span className={styles.loaderText}>...cargando</span>
          </div>
        </div>
      ) : (
        <div className={styles.mainContainer}>
          <h1 className={styles.title}>{evaluacion.nombre?.toUpperCase()}</h1>

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
                    style={{ backgroundColor: '#4f46e5', color: 'white' }}
                    disabled={loadingConsolidado}
                  >
                    {loadingConsolidado ? (
                      <>
                        <RiLoader4Line className={styles.loaderIcon} />
                        <span>Consolidando...</span>
                      </>
                    ) : (
                      <>
                        <MdAnalytics />
                        <span>Generar Consolidado</span>
                      </>
                    )}
                  </button>
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



          {/* Componente de gráfico pie chart */}
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


          {/* Gráfico de barras horizontales para directores */}
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
                dataDirectoresBar.length > 0 && <BarChartDirectores data={dataDirectoresBar} />
              )
            )
          }
          {/* Gráfico de Ranking de Docentes (Nuevo) */}
          {
            evaluacion.tipoDeEvaluacion === '1' && !loadingProfesoresBuckets && fullDocentesData && fullDocentesData.length > 0 && (
              <BarChartDocentes data={fullDocentesData} />
            )
          }
          {/* Gráfico de barras de distribución por niveles para docentes (Buckets) */}
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
                dataProfesoresBuckets.length > 0 && (
                  <BarChartDocentesBuckets
                    data={dataProfesoresBuckets}
                    totalDocentes={totalDocentesBuckets}
                    onBarClick={handleBarClick}
                  />
                )
              )
            )
          }

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
            yearSelected={yearSelected}
            dataReportePreguntas={dataReportePreguntas}
            loadingReportePreguntas={loadingReportePreguntas}
          />
        </div>
      )}
    </>
  );
};

export default Reporte;
Reporte.Auth = PrivateRouteEspecialista;
