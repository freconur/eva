import { useGlobalContext } from '@/features/context/GlolbalContext';
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
import styles from './Reporte.module.css';
import { currentMonth, getAllMonths } from '@/fuctions/dates';
import PrivateRouteEspecialista from '@/components/layouts/PrivateRoutesEspecialista';
import { useReporteEspecialistas } from '@/features/hooks/useReporteEspecialistas';
import { distritosPuno } from '@/fuctions/provinciasPuno';
import { exportDirectorDocenteDataToExcel } from '@/features/utils/excelExport';
import { useGenerarReporte } from '@/features/hooks/useGenerarReporte';
import { useCrearEstudiantesDeDocente } from '@/features/hooks/useCrearEstudiantesDeDocente';
import { useCrearPuntajeProgresiva } from '@/features/hooks/useCrearPuntajeProgresiva';
import AcordeonGraficosTendencia from './AcordeonGraficosTendencia';
import AcordeonReportePregunta from './AcordeonReportePregunta';
import PieChartComponent from './PieChartComponent';
import FiltrosReporte from '@/components/reportes/FiltrosReporte';
import { useExportExcel } from '@/features/hooks/useExportExcel';
import { httpsCallable } from 'firebase/functions';
import { functions } from '@/firebase/firebase.config';
import BarChartDirectores from './BarChartDirectores';

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
    caracteristicaCurricular: '',
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
  const { getPreguntasRespuestas, getEvaluacion } = useAgregarEvaluaciones();
  const { generarReporte, loading: loadingGenerarReporte } = useGenerarReporte();
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

  // Ordenar dataEstadisticaEvaluacion por el order de las preguntas correspondientes
  const dataEstadisticaEvaluacionOrdenada = useMemo(() => {
    if (!dataEstadisticaEvaluacion || dataEstadisticaEvaluacion.length === 0 || !preguntasOrdenadas.length) return [];

    // Crear un mapa de estadísticas por ID de pregunta
    const estadisticasMap = new Map<string, any>();
    dataEstadisticaEvaluacion.forEach((stat) => {
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
  }, [dataEstadisticaEvaluacion, preguntasOrdenadas]);


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
        caracteristicaCurricular: filtros.caracteristicaCurricular,
        distrito: filtros.distrito,
      },
      monthSelected,
      `${route.query.idEvaluacion}`,
      yearSelected
    );
  };
  useEffect(() => {
    getDataGraficoPieChart(`${route.query.idEvaluacion}`, monthSelected, evaluacion);
    getEstadisticaGlobal(`${route.query.idEvaluacion}`, monthSelected, yearSelected);
  }, [route.query.id, route.query.idEvaluacion, currentUserData.dni, monthSelected]);

  // --- INTEGRACIÓN DE GRÁFICOS DE BARRAS PARA DIRECTORES ---
  const isFetchedBarGraphics = useRef<string | null>(null);

  useEffect(() => {
    const idEval = route.query.idEvaluacion;
    if (!idEval || monthSelected === undefined || !yearSelected) return;

    // Evitar ejecuciones duplicadas innecesarias (incluyendo React Strict Mode)
    const currentKey = `${idEval}-${monthSelected}-${yearSelected}`;
    if (isFetchedBarGraphics.current === currentKey) return;

    const fetchBarGraphicsData = async () => {
      setLoadingDirectoresBar(true);
      try {
        console.log('🚀 [Cloud Function] Solicitando datos para directores...');
        const getDataFunction = httpsCallable(functions, 'getDataToDirectoresFromBarGraphics');
        const result = await getDataFunction({
          idEvaluacion: idEval,
          año: yearSelected,
          mes: monthSelected
        });
        console.log('✅ [Cloud Function] Datos de directores recibidos:', result.data);

        const response: any = result.data;
        if (response.success && Array.isArray(response.data)) {
          setDataDirectoresBar(response.data);
        }
      } catch (error) {
        console.error('❌ [Cloud Function] Error en getDataToDirectoresFromBarGraphics:', error);
      } finally {
        setLoadingDirectoresBar(false);
      }
    };

    fetchBarGraphicsData();
    isFetchedBarGraphics.current = currentKey;
  }, [route.query.idEvaluacion, monthSelected, yearSelected]);


  const handleRestablecerFiltros = () => {
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
  const handleGenerarReporte = async () => {
    if (!route.query.idEvaluacion) {
      alert('No se ha seleccionado una evaluación válida');
      return;
    }

    // Mostrar alerta informativa antes de comenzar
    const confirmed = window.confirm(
      '⏱️ Esta operación puede tomar hasta 9 minutos para procesar todos los datos.\n\n' +
      '• Se procesarán todos los directores y sus docentes\n' +
      '• Se generarán estadísticas consolidadas\n' +
      '• Por favor, mantén esta ventana abierta\n\n' +
      '¿Deseas continuar?'
    );

    if (!confirmed) return;

    try {
      const resultado = await generarReporte(String(route.query.idEvaluacion), monthSelected, {
        region: filtros.region,
        distrito: filtros.distrito,
        caracteristicaCurricular: filtros.caracteristicaCurricular,
        genero: filtros.genero,
        area: filtros.area,
      }, yearSelected);

      if (resultado) {
        const data = resultado as any;
        const message =
          `🎉 ¡Reporte generado exitosamente!\n\n` +
          `📊 Estadísticas del procesamiento:\n` +
          `• Directores procesados: ${data.procesados || 'N/A'}\n` +
          `• Total de docentes: ${data.totalDocentes || 'N/A'}\n` +
          `• Total de evaluaciones: ${data.totalEvaluaciones || 'N/A'}\n` +
          `• Directores con datos: ${data.estadisticas?.directoresConDatos || 'N/A'}\n` +
          `• Preguntas procesadas: ${data.estadisticas?.preguntasProcesadas || 'N/A'}\n\n` +
          `Los datos están listos para visualización y exportación.`;

        alert(message);
      }
    } catch (error: any) {
      if (error.code === 'functions/deadline-exceeded') {
        const timeoutMessage =
          '⚠️ Tiempo de espera agotado\n\n' +
          'El reporte está tardando más de lo esperado debido al gran volumen de datos.\n\n' +
          'Opciones:\n' +
          '• Intenta nuevamente en unos minutos\n' +
          '• La función podría seguir ejecutándose en el servidor\n' +
          '• Contacta al administrador si el problema persiste\n\n' +
          'Esto puede ocurrir con más de 1000 directores o muchas evaluaciones.';

        alert(timeoutMessage);
      }
    }
  };


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

              {currentUserData?.rol === 4 && (
                <button
                  className={styles.warningButton}
                  onClick={handleGenerarReporte}
                  disabled={loadingGenerarReporte || !route.query.idEvaluacion}
                >
                  {loadingGenerarReporte ? (
                    <>
                      <RiLoader4Line className={styles.loaderIcon} />
                      <span>Procesando...</span>
                    </>
                  ) : (
                    'Generar consolidado'
                  )}
                </button>
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

          {/* Componente de acordeón para gráficos de tendencia */}

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
            reporteDirectorOrdenado={dataEstadisticaEvaluacionOrdenada}
            preguntasMap={preguntasMap}
            iterarPregunta={iterarPregunta}
            obtenerRespuestaPorId={obtenerRespuestaPorId}
            iterateData={iterateData}
            options={options}
            filtros={filtros}
            distritosDisponibles={distritosDisponibles}
            handleChangeFiltros={handleChangeFiltros}
            handleFiltrar={handleFiltrar}
            handleRestablecerFiltros={handleRestablecerFiltros}
            yearSelected={yearSelected}
          />
        </div>
      )}
    </>
  );
};

export default Reporte;
Reporte.Auth = PrivateRouteEspecialista;
