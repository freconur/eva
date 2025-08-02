import { useGlobalContext } from '@/features/context/GlolbalContext'
import { useReporteDirectores } from '@/features/hooks/useReporteDirectores'
import { useRouter } from 'next/router'
import React, { useEffect, useState, useMemo, useCallback } from 'react'
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
  ChartData,
} from 'chart.js';
import { gradosDeColegio, sectionByGrade, ordernarAscDsc, genero, regiones, area, caracteristicasDirectivo } from '@/fuctions/regiones'
import { Bar } from "react-chartjs-2"
import { useAgregarEvaluaciones } from '@/features/hooks/useAgregarEvaluaciones';
import { Alternativa, DataEstadisticas, PreguntasRespuestas } from '@/features/types/types';
import { RiLoader4Line } from 'react-icons/ri';
import styles from './Reporte.module.css';
import { currentMonth, getAllMonths } from '@/fuctions/dates';
import PrivateRouteDirectores from '@/components/layouts/PrivateRoutesDirectores';
import PrivateRouteEspecialista from '@/components/layouts/PrivateRoutesEspecialista';
import { useReporteEspecialistas } from '@/features/hooks/useReporteEspecialistas';
import { distritosPuno } from '@/fuctions/provinciasPuno';
import { exportDirectorDocenteDataToExcel } from '@/features/utils/excelExport';
import { useGenerarReporte } from '@/features/hooks/useGenerarReporte';
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

  useEffect(() => {
    if (filtros.region) {
      const provinciaEncontrada = distritosPuno.find(p => p.id === Number(filtros.region));
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
      [e.target.name]: e.target.value
    });
  };

  const iterateData = (data: DataEstadisticas, respuesta: string) => {
    return {
      labels: data.d === undefined ? ['a', 'b', 'c'] : ['a', 'b', 'c', 'd'],
      datasets: [
        {
          label: "total",
          data: [data.a, data.b, data.c, data.d !== 0 && data.d],
          backgroundColor: [
            'rgba(255, 99, 132, 0.2)',
            'rgba(255, 159, 64, 0.2)',
            'rgba(153, 102, 255, 0.2)',
            // respuesta === "a" ? 'rgba(255, 99, 132, 0.2)' : 'rgb(0, 153, 0)',
            // respuesta === "b" ? 'rgba(255, 159, 64, 0.2)' : 'rgb(0, 153, 0)',
            // respuesta === "c" ? 'rgba(153, 102, 255, 0.2)' : 'rgb(0, 153, 0)',
            'rgba(255, 159, 64, 0.2)',
            'rgba(255, 205, 86, 0.2)',
            'rgba(75, 192, 192, 0.2)',
            'rgba(54, 162, 235, 0.2)',
            'rgba(153, 102, 255, 0.2)',
            'rgba(201, 203, 207, 0.2)'
          ],
          borderColor: [
            'rgb(255, 99, 132)',
            'rgb(255, 159, 64)',
            'rgb(255, 205, 86)',
            'rgb(75, 192, 192)',
            'rgb(54, 162, 235)',
            'rgb(153, 102, 255)',
            'rgb(201, 203, 207)'
          ],
          borderWidth: 1
        }
      ]
    }
  }
  const { reporteDirectorData, reporteToTableDirector, reporteDirectorEstudiantes, agregarDatosEstadisticosDirector } = useReporteDirectores()
  const { getAllReporteDeDirectores, reporteParaTablaDeEspecialista, reporteEspecialistaDeEstudiantes } = useReporteEspecialistas()
  const { currentUserData, reporteDirector, preguntasRespuestas, loaderReporteDirector, allRespuestasEstudiantesDirector, dataFiltradaDirectorTabla, allEvaluacionesEstudiantes, allEvaluacionesDirectorDocente } = useGlobalContext()
  const { getPreguntasRespuestas } = useAgregarEvaluaciones()
  const { generarReporte, loading: loadingGenerarReporte } = useGenerarReporte()
  const [showTable, setShowTable] = useState(false)
  const route = useRouter()
  const [monthSelected, setMonthSelected] = useState(currentMonth)
  
  // Memorizar las preguntas ordenadas por la propiedad order
  const preguntasOrdenadas = useMemo(() => {
    return [...(preguntasRespuestas || [])].sort((a, b) => (a.order || 0) - (b.order || 0));
  }, [preguntasRespuestas]);
  
  // Crear un mapa optimizado de preguntas por ID para evitar búsquedas repetidas O(1) en lugar de O(n)
  const preguntasMap = useMemo(() => {
    const map = new Map<string, PreguntasRespuestas>();
    preguntasOrdenadas.forEach(pregunta => {
      if (pregunta.id) {
        map.set(pregunta.id, pregunta);
      }
    });
    return map;
  }, [preguntasOrdenadas]);

  // Ordenar reporteDirector por el order de las preguntas correspondientes
  const reporteDirectorOrdenado = useMemo(() => {
    if (!reporteDirector || !preguntasOrdenadas.length) return reporteDirector;
    
    // Crear un mapa de estadísticas por ID de pregunta
    const estadisticasMap = new Map<string, any>();
    reporteDirector.forEach(stat => {
      if (stat.id) {
        estadisticasMap.set(stat.id, stat);
      }
    });
    
    // Crear un array sincronizado basado en preguntasRespuestas
    const reporteSincronizado = preguntasOrdenadas.map(pregunta => {
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
          d: pregunta.alternativas?.some(alt => alt.alternativa === 'd') ? 0 : undefined,
          total: 0
        };
      }
    });
    
    return reporteSincronizado;
  }, [reporteDirector, preguntasOrdenadas]);


  useEffect(() => {
    //me trae las preguntas y respuestas para los graficos
    getPreguntasRespuestas(`${route.query.idEvaluacion}`)
  }, [currentUserData.dni, route.query.idEvaluacion])

  const handleShowTable = () => {
    setShowTable(!showTable)
  }
  const handleFiltrar = () => {
    /* reporteToTableDirector() */
    reporteParaTablaDeEspecialista(allEvaluacionesDirectorDocente, { region: filtros.region, area: filtros.area, genero: filtros.genero, caracteristicaCurricular: filtros.caracteristicaCurricular, distrito: filtros.distrito }, `${route.query.id}`, `${route.query.idEvaluacion}`)
  }
  useEffect(() => {
    reporteEspecialistaDeEstudiantes(`${route.query.idEvaluacion}`, monthSelected, currentUserData)
    /* currentUserData.dni && reporteDirectorEstudiantes(`${route.query.idEvaluacion}`,monthSelected,currentUserData) */
    /* reporteDirectorData(`${route.query.id}`, `${route.query.idEvaluacion}`) */
  }, [route.query.id, route.query.idEvaluacion, currentUserData.dni])

  // Función optimizada para renderizar pregunta usando el mapa
  const iterarPregunta = useCallback((idPregunta: string) => {
    const pregunta = preguntasMap.get(idPregunta);
    if (!pregunta) {
      return <p>Pregunta no encontrada</p>;
    }
    return (
      <>
        <h3 className='text-slate-500 mr-2'>
          {pregunta.pregunta}
        </h3>
        <h3 className='text-slate-500 mr-2'>
          <span className='text-colorSegundo mr-2 font-semibold'>Actuación:</span> {pregunta.preguntaDocente}
        </h3>
      </>
    );
  }, [preguntasMap]);

  // Función optimizada para obtener respuesta usando el mapa
  const obtenerRespuestaPorId = useCallback((idPregunta: string): string => {
    const pregunta = preguntasMap.get(idPregunta);
    return pregunta?.respuesta || '';
  }, [preguntasMap]);

  const handleValidateRespuesta = (data: PreguntasRespuestas) => {
    const rta: Alternativa | undefined = data.alternativas?.find(
      (r) => r.selected === true
    );
    if (rta?.alternativa) {
      if (rta.alternativa.toLowerCase() === data.respuesta?.toLowerCase()) {
        return (
          <div className={styles.correctAnswer}>
            si
          </div>
        );
      } else {
        return (
          <div className={styles.incorrectAnswer}>
            no
          </div>
        );
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
    const selectedMonth = getAllMonths.find(mes => mes.name === e.target.value);
    setMonthSelected(selectedMonth ? selectedMonth.id : currentMonth);
  }

  useEffect(() => {
    reporteEspecialistaDeEstudiantes(`${route.query.idEvaluacion}`, monthSelected, currentUserData)
    /* reporteDirectorEstudiantes(`${route.query.idEvaluacion}`, monthSelected, currentUserData) */
  }, [monthSelected])

  /* console.log('preguntasRespuestas', preguntasRespuestas) */
  /* console.log('reporteDirector', reporteDirector) */
  console.log('preguntasRespuestas', preguntasRespuestas.length)
  console.log('reporteDirector original', reporteDirector?.length || 0)
  console.log('reporteDirectorOrdenado sincronizado', reporteDirectorOrdenado?.length || 0)

  // Función para exportar datos a Excel
  const handleExportToExcel = async () => {
    if (!allEvaluacionesDirectorDocente || allEvaluacionesDirectorDocente.length === 0) {
      alert('No hay datos disponibles para exportar');
      return;
    }
    
    setLoadingExport(true);
    try {
      // Agregar un pequeño delay para mostrar el loading
      await new Promise(resolve => setTimeout(resolve, 500));
      
      const fileName = `evaluaciones_director_docente_${new Date().toISOString().split('T')[0]}.xlsx`;
      exportDirectorDocenteDataToExcel(allEvaluacionesDirectorDocente, fileName);
      
      // Mostrar mensaje de éxito
      alert('Archivo Excel exportado exitosamente');
    } catch (error) {
      console.error('Error al exportar a Excel:', error);
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
      console.log('🚀 Iniciando generación de reporte...');
      
      const resultado = await generarReporte(
        String(route.query.idEvaluacion),
        monthSelected,
        {
          region: filtros.region,
          distrito: filtros.distrito,
          caracteristicaCurricular: filtros.caracteristicaCurricular,
          genero: filtros.genero,
          area: filtros.area
        }
      );
      
      console.log('✅ Reporte generado exitosamente:', resultado);
      
      // Mostrar detalles del resultado al usuario
      if (resultado) {
        // Acceder a las estadísticas desde la estructura real de la respuesta
        const data = resultado as any; // Cast temporal para acceder a las propiedades
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
      console.error('❌ Error al generar reporte:', error);
      
      // Manejo específico para timeout
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
      // El error ya se maneja en el hook useGenerarReporte para otros casos
    }
  };
  return (

    <>
      {
        loaderReporteDirector ?
          <div className={styles.loaderContainer}>
            <div className={styles.loaderContent}>
              <RiLoader4Line className={styles.loaderIcon} />
              <span className={styles.loaderText}>...cargando</span>
            </div>
          </div>
          :
          <div className={styles.mainContainer}>
            {/* <button className={styles.button} onClick={handleShowTable}>ver tabla</button> */}
            <div className={styles.selectContainer}>
              <select
                className={styles.select}
                onChange={handleChangeMonth}
                value={getAllMonths[monthSelected]?.name || ''}
                id="">
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
                <option value="">Seleccionar Región</option>
                {regiones.map((region, index) => (
                  <option key={index} value={region.id}>{region.region}</option>
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
                  <option key={index} value={distrito}>{distrito}</option>
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
              {/* <select
                    className={styles.select}
                    onChange={handleChangeFiltros}
                    name="orden"
                    id="">
                    <option value="">ordernar por</option>
                    {ordernarAscDsc.map((orden) => (
                      <option key={orden.id} value={orden.name}>
                        {orden.name}
                      </option>
                    ))}
                  </select> */}
              <button className={styles.filterButton} onClick={handleFiltrar}>Filtrar</button>
            </div>

            <div className={styles.exportContainer}>
              <button 
                className={styles.exportButton} 
                onClick={handleExportToExcel}
                disabled={loadingExport || !allEvaluacionesDirectorDocente || allEvaluacionesDirectorDocente.length === 0}
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
              {
                currentUserData.rol === 4 && 
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
              }
            </div>

            <div className={styles.reportContainer}>
              <h1 className={styles.reportTitle}>reporte de evaluación</h1>
              <div>
                <div>
                  {
                    reporteDirectorOrdenado?.map((dat: DataEstadisticas, index: number) => {
                      // Encontrar la pregunta correspondiente por su id
                      const preguntaCorrespondiente = preguntasMap.get(dat.id || '');
                      
                      return (
                        <div key={index} className={styles.questionContainer}>
                          {index + 1}.{iterarPregunta(dat.id || '')}
                          <div className={styles.chartContainer}>
                            <div className={styles.chartWrapper}>
                              <Bar className={styles.chart}
                                options={options}
                                data={iterateData(dat, obtenerRespuestaPorId(dat.id || ''))}
                              />
                            </div>
                            <div className={styles.statsContainer}>
                              {Object.entries(dat)
                                .filter(([key]) => key !== 'id' && key !== 'total')
                                .map(([key, value]) => (
                                  <p key={key}>
                                    {key}: {value} | {dat.total === 0 ? 0 : ((100 * Number(value)) / Number(dat.total)).toFixed(0)}%
                                  </p>
                                ))}
                            </div>
                            <div className={styles.answerContainer}>
                              respuesta:<span className={styles.answerText}>{obtenerRespuestaPorId(dat.id || '')}</span>
                            </div>
                          </div>
                        </div>
                      );
                    })
                  }
                </div>
              </div>
            </div>
          </div>
      }
    </>
  )
}

export default Reporte
Reporte.Auth = PrivateRouteEspecialista