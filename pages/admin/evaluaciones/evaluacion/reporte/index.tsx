import { useGlobalContext } from '@/features/context/GlolbalContext'
import { useReporteDirectores } from '@/features/hooks/useReporteDirectores'
import { useRouter } from 'next/router'
import React, { useEffect, useState, useMemo } from 'react'
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
  const [showTable, setShowTable] = useState(false)
  const route = useRouter()
  const [monthSelected, setMonthSelected] = useState(currentMonth)
  
  // Memorizar las preguntas ordenadas por la propiedad order
  const preguntasOrdenadas = useMemo(() => {
    return [...(preguntasRespuestas || [])].sort((a, b) => (a.order || 0) - (b.order || 0));
  }, [preguntasRespuestas]);
  
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

  const iterarPregunta = (idPregunta: string) => {
    const pregunta = preguntasOrdenadas.find(p => p.id === idPregunta);
    
    return (
      <div className='grid gap-1'>
        <h3 className='text-slate-500 mr-2'>
          {/* <span className='text-colorSegundo mr-2 font-semibold'>{pregunta?.order || idPregunta}.</span> */}
          {pregunta?.pregunta}</h3>
        <h3 className='text-slate-500 mr-2'><span className='text-colorSegundo mr-2 font-semibold'>Actuación:</span> {pregunta?.preguntaDocente}</h3>
      </div>
    )
  }
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
  console.log('reporteDirector', reporteDirector)

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
            </div>

            <div className={styles.reportContainer}>
              <h1 className={styles.reportTitle}>reporte de evaluación</h1>
              <div>
                <div>
                  {
                    reporteDirector?.map((dat, index) => {
                      // Encontrar la pregunta correspondiente por su id
                      const preguntaCorrespondiente = preguntasOrdenadas.find(p => p.id === dat.id);
                      
                      return (
                        <div key={index} className={styles.questionContainer}>
                          {index + 1}.{iterarPregunta(`${dat.id}`)}
                          <div className={styles.chartContainer}>
                            <div className={styles.chartWrapper}>
                              <Bar className={styles.chart}
                                options={options}
                                data={iterateData(dat, `${preguntaCorrespondiente?.respuesta || ''}`)}
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
                              respuesta:<span className={styles.answerText}>{preguntaCorrespondiente?.respuesta}</span>
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