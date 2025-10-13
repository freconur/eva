import { useGlobalContext } from '@/features/context/GlolbalContext';
import { useRouter } from 'next/router';
import React, { useEffect, useState, useMemo, useCallback } from 'react';
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
import {
  genero,
  regiones,
  area,
  caracteristicasDirectivo,
} from '@/fuctions/regiones';
import { useAgregarEvaluaciones } from '@/features/hooks/useAgregarEvaluaciones';
import { Alternativa, DataEstadisticas, PreguntasRespuestas } from '@/features/types/types';
import { RiLoader4Line } from 'react-icons/ri';
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
    return prepareBarChartData(data, respuesta, numOpciones);
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
  getReporteEspecialistaPorUgel(`${route.query.idEvaluacion}`, monthSelected)
}, [`${route.query.idEvaluacion}`, monthSelected, currentUserData.region])

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
      `${route.query.idEvaluacion}`
    );
  };
  useEffect(() => {
    getDataGraficoPieChart(`${route.query.idEvaluacion}`, monthSelected);
    getEstadisticaGlobal(`${route.query.idEvaluacion}`, monthSelected);
  }, [route.query.id, route.query.idEvaluacion, currentUserData.dni, monthSelected]);


  const handleRestablecerFiltros = () => {
    restablecerFiltrosDeEspecialista(`${route.query.idEvaluacion}`, monthSelected);
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
    plugins: {
      legend: {
        position: 'center' as const,
      },
      title: {
        display: true,
        text: 'estadistica de respuestas',
      },
    },
  };
  const handleChangeMonth = (e: React.ChangeEvent<HTMLSelectElement>) => {
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
      const resultado = await getAllReporteDeDirectoreToAdmin(`${route.query.idEvaluacion}`, monthSelected);
      
      if (!resultado || resultado.length === 0) {
        alert('No hay datos disponibles para exportar');
        return;
      }

      const fileName = `evaluaciones_director_docente_${
        new Date().toISOString().split('T')[0]
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
      });

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
          <div className={styles.selectContainer}>
            <select
              className={styles.select}
              onChange={handleChangeMonth}
              value={getAllMonths[monthSelected]?.name || ''}
              id=""
            >
              <option value="">Mes</option>
              {getAllMonths.slice(0, currentMonth + 1).map((mes) => (
                <option key={mes.id} value={mes.name}>
                  {mes.name}
                </option>
              ))}
            </select>
          </div>
          <div className={styles.filtersContainer}>
            <select
              name="region"
              className={styles.select}
              onChange={handleChangeFiltros}
              value={filtros.region}
            >
              <option value="">Seleccionar Ugel</option>
              {regiones.map((region, index) => (
                <option key={index} value={region.id}>
                  {region.region}
                </option>
              ))}
            </select>

            <select
              name="distrito"
              className={styles.select}
              onChange={handleChangeFiltros}
              value={filtros.distrito}
              disabled={!filtros.region}
            >
              <option value="">Seleccionar Distrito</option>
              {distritosDisponibles.map((distrito, index) => (
                <option key={index} value={distrito}>
                  {distrito}
                </option>
              ))}
            </select>

            <select
              name="area"
              value={filtros.area}
              onChange={handleChangeFiltros}
              className={styles.select}
            >
              <option value="">Area</option>
              {area.map((are) => (
                <option key={are.id} value={are.id}>
                  {are.name.toUpperCase()}
                </option>
              ))}
            </select>
            <select
              name="caracteristicaCurricular"
              value={filtros.caracteristicaCurricular}
              onChange={handleChangeFiltros}
              className={styles.select}
            >
              <option value="">Característica Curricular</option>
              {caracteristicasDirectivo.map((are) => (
                <option key={are.id} value={are.name}>
                  {are.name.toUpperCase()}
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
           
            <button className={styles.filterButton} onClick={handleFiltrar}>
              Filtrar
            </button>
            <button className={styles.filterButton} onClick={handleRestablecerFiltros}>
              restablecer
            </button>
          </div>

          <div className={styles.exportContainer}>
            <button
              className={styles.exportButton}
              onClick={handleExportToExcel}
              disabled={loadingExport}
            >
              {loadingExport ? (
                <>
                  <RiLoader4Line className={styles.loaderIcon} />
                  Exportando...
                </>
              ) : (
                'Exportar a Excel'
              )}
            </button>
            
            {/* Botón para crear estudiantes de docentes */}
            <button
              className={styles.exportButton}
              onClick={handleCrearEstudiantes}
              disabled={loadingCrearEstudiantes}
            >
              {loadingCrearEstudiantes ? (
                <>
                  <RiLoader4Line className={styles.loaderIcon} />
                  Creando estudiantes... (hasta 9 min)
                </>
              ) : (
                'Crear estudiantes de docentes'
              )}
            </button>

            {/* Botón para generar puntaje progresiva */}
            {
              currentUserData?.rol === 4 && (
            <button
              className={styles.exportButton}
              onClick={handleCrearPuntajeProgresiva}
              disabled={loadingCrearPuntajeProgresiva}
            >
              {loadingCrearPuntajeProgresiva ? (
                <>
                  <RiLoader4Line className={styles.loaderIcon} />
                  Generando puntaje progresiva...
                </>
              ) : (
                'Generar puntaje progresiva'
              )}
            </button>
              )
            }
            
            {/* Indicador de progreso para crear estudiantes */}
            {loadingCrearEstudiantes && progresoCrearEstudiantes && (
              <div className={styles.progressContainer}>
                <div className={styles.progressBar}>
                  <div 
                    className={styles.progressFill} 
                    style={{ width: `${progresoCrearEstudiantes.porcentaje}%` }}
                  ></div>
                </div>
                <div className={styles.progressText}>
                  Procesando: {progresoCrearEstudiantes.docentesProcesados}/{progresoCrearEstudiantes.totalDocentes} docentes 
                  ({progresoCrearEstudiantes.porcentaje.toFixed(1)}%)
                </div>
                <div className={styles.progressDetails}>
                  Estudiantes: {progresoCrearEstudiantes.estudiantesProcesados} | 
                  Lotes: {progresoCrearEstudiantes.lotesCompletados} | 
                  Errores: {progresoCrearEstudiantes.erroresEncontrados}
                </div>
              </div>
            )}

            {/* Mensaje de error si existe */}
            {errorCrearEstudiantes && (
              <div className={styles.errorMessage}>
                ❌ Error: {errorCrearEstudiantes}
              </div>
            )}

            {/* Mensaje de éxito si se completó */}
            {resultadoCrearEstudiantes && !loadingCrearEstudiantes && (
              <div className={styles.successMessage}>
                ✅ {obtenerMensajeResumen()}
              </div>
            )}

            {/* Indicador de progreso para puntaje progresiva */}
            {loadingCrearPuntajeProgresiva && progresoCrearPuntajeProgresiva && (
              <div className={styles.progressContainer}>
                <div className={styles.progressBar}>
                  <div 
                    className={styles.progressFill} 
                    style={{ width: `${progresoCrearPuntajeProgresiva.porcentaje}%` }}
                  ></div>
                </div>
                <div className={styles.progressText}>
                  Procesando: {progresoCrearPuntajeProgresiva.estudiantesProcesados}/{progresoCrearPuntajeProgresiva.totalEstudiantes} estudiantes 
                  ({progresoCrearPuntajeProgresiva.porcentaje.toFixed(1)}%)
                </div>
                <div className={styles.progressDetails}>
                  Estudiantes: {progresoCrearPuntajeProgresiva.estudiantesProcesados} | 
                  Lotes: {progresoCrearPuntajeProgresiva.lotesCompletados} | 
                  Errores: {progresoCrearPuntajeProgresiva.erroresEncontrados}
                </div>
              </div>
            )}

            {/* Mensaje de error para puntaje progresiva si existe */}
            {errorCrearPuntajeProgresiva && (
              <div className={styles.errorMessage}>
                ❌ Error: {errorCrearPuntajeProgresiva}
              </div>
            )}

            {/* Mensaje de éxito para puntaje progresiva si se completó */}
            {resultadoCrearPuntajeProgresiva && !loadingCrearPuntajeProgresiva && (
              <div className={styles.successMessage}>
                ✅ {obtenerMensajeResumenPuntajeProgresiva()}
              </div>
            )}

            {currentUserData?.rol === 4 && (
              <button
                className={styles.generateReportButton}
                onClick={handleGenerarReporte}
                disabled={loadingGenerarReporte || !route.query.idEvaluacion}
              >
                {loadingGenerarReporte ? (
                  <>
                    <RiLoader4Line className={styles.loaderIcon} />
                    Procesando datos... (hasta 9 min)
                  </>
                ) : (
                  'Generar reporte consolidado'
                )}
              </button>
            )}
          </div>

          {/* Componente de gráfico pie chart */}
          {
            evaluacion.tipoDeEvaluacion === '1' ? (
              <PieChartComponent 
                monthSelected={monthSelected}
                dataGraficoTendenciaNiveles={dataGraficoTendenciaNiveles}
              />

            ) : null
          }

          {/* Componente de acordeón para gráficos de tendencia */}

          {
            evaluacion.tipoDeEvaluacion === '1' ? (
              <AcordeonGraficosTendencia
                rangoMes={rangoMes}
                monthSelected={monthSelected}
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
          />
        </div>
      )}
    </>
  );
};

export default Reporte;
Reporte.Auth = PrivateRouteEspecialista;
