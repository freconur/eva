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
import { gradosDeColegio, sectionByGrade, ordernarAscDsc, genero } from '@/fuctions/regiones'
import { Bar } from "react-chartjs-2"
import { useAgregarEvaluaciones } from '@/features/hooks/useAgregarEvaluaciones';
import { Alternativa, DataEstadisticas, PreguntasRespuestas } from '@/features/types/types';
import { RiLoader4Line } from 'react-icons/ri';
import styles from './Reporte.module.css';
import { currentMonth, getAllMonths } from '@/fuctions/dates';
import PrivateRouteDirectores from '@/components/layouts/PrivateRoutesDirectores';
import { useGlobalContextDispatch } from '@/features/context/GlolbalContext';
import { AppAction } from '@/features/actions/appAction';
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
  const dispatch = useGlobalContextDispatch();
  const [filtros, setFiltros] = useState({
    grado: '',
    seccion: '',
    orden: '',
    genero:''
  });

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
  const { reporteDirectorData,reporteToTableDirector ,reporteDirectorEstudiantes,agregarDatosEstadisticosDirector } = useReporteDirectores()
  const { currentUserData, reporteDirector, preguntasRespuestas, loaderReporteDirector, allRespuestasEstudiantesDirector, dataFiltradaDirectorTabla } = useGlobalContext()
  const { getPreguntasRespuestas } = useAgregarEvaluaciones()
  const [showTable, setShowTable] = useState(false)
  const route = useRouter()
  const [monthSelected, setMonthSelected] = useState(currentMonth)
  
  // Limpiar dataFiltradaDirectorTabla cuando el componente se monta
  useEffect(() => {
    dispatch({ type: AppAction.DATA_FILTRADA_DIRECTOR_TABLA, payload: [] });
  }, [dispatch]);

  useEffect(() => {
//me trae las preguntas y respuestas para los graficos
    getPreguntasRespuestas(`${route.query.idEvaluacion}`)
  }, [currentUserData.dni, route.query.idEvaluacion])

  const handleShowTable = () => {
    setShowTable(!showTable)
  }
  const handleFiltrar = () => {
    reporteToTableDirector(allRespuestasEstudiantesDirector,{grado: filtros.grado, seccion: filtros.seccion, orden: filtros.orden, genero: filtros.genero}, `${route.query.id}`, `${route.query.idEvaluacion}`)
  }
  useEffect(() => {
    currentUserData.dni &&reporteDirectorEstudiantes(`${route.query.idEvaluacion}`,monthSelected,currentUserData)
    /* reporteDirectorData(`${route.query.id}`, `${route.query.idEvaluacion}`) */
      }, [route.query.id, route.query.idEvaluacion, currentUserData.dni])

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
    reporteDirectorEstudiantes(`${route.query.idEvaluacion}`,monthSelected,currentUserData)
  },[monthSelected])

  // Crear un mapa optimizado de preguntas por ID para evitar búsquedas repetidas O(1) en lugar de O(n)
  const preguntasMap = useMemo(() => {
    const map = new Map<string, PreguntasRespuestas>();
    preguntasRespuestas.forEach(pregunta => {
      if (pregunta.id) {
        map.set(pregunta.id, pregunta);
      }
    });
    return map;
  }, [preguntasRespuestas]);

  // Memorizar las preguntas ordenadas por la propiedad order
  const preguntasOrdenadas = useMemo(() => {
    return [...(preguntasRespuestas || [])].sort((a, b) => (a.order || 0) - (b.order || 0));
  }, [preguntasRespuestas]);
  
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

  // Función optimizada para renderizar pregunta usando el mapa
  const renderPregunta = useCallback((idPregunta: string) => {
    const pregunta = preguntasMap.get(idPregunta);
    if (!pregunta) {
      return <p>Pregunta no encontrada</p>;
    }
    return (
      <div className='grid gap-1'>
        <h3 className='text-slate-500 mr-2'>
          {/* <span className='text-colorSegundo mr-2 font-semibold'>{pregunta.order}.</span> */}
          {pregunta.pregunta}
        </h3>
        <h3 className='text-slate-500 mr-2'>
          <span className='text-colorSegundo mr-2 font-semibold'>Actuación:</span> 
          {pregunta.preguntaDocente}
        </h3>
      </div>
    );
  }, [preguntasMap]);

  // Función optimizada para obtener respuesta usando el mapa
  const obtenerRespuestaPorId = useCallback((idPregunta: string): string => {
    const pregunta = preguntasMap.get(idPregunta);
    return pregunta?.respuesta || '';
  }, [preguntasMap]);

  console.log('dataFiltradaDirectorTabla', dataFiltradaDirectorTabla)
  console.log('preguntasRespuestas', preguntasRespuestas.length)
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
            <button className={styles.button} onClick={handleShowTable}>ver tabla</button>
            {
              showTable &&
              <div>
                <div className={styles.selectContainer}>
                <select 
                  className={styles.select} 
                  onChange={handleChangeMonth}
                  value={getAllMonths[monthSelected]?.name || ''}
                  id="">
                  <option value="">Mes</option>
                    {getAllMonths.slice(0,currentMonth+1).map((mes) => (
                      <option key={mes.id} value={mes.name}>
                        {mes.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div className={styles.filtersContainer}>
                  <select
                    name="grado"
                    value={filtros.grado}
                    onChange={handleChangeFiltros}
                    className={styles.select}
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
                    {sectionByGrade.map((seccion) => (
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
                  <select 
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
                  </select>
                  <button className={styles.filterButton} onClick={handleFiltrar}>Filtrar</button>
                  
                </div>
                <div className={styles.tableContainer}>
                  <table className={styles.table}>
                    <thead className={styles.tableHeader}>
                      <tr>
                        <th className={styles.tableHeaderCell}>#</th>
                        <th className={styles.tableHeaderCell}>Nombre y apellidos</th>
                        <th className={styles.tableHeaderCell}>Docente</th>
                        <th className={styles.tableHeaderCell}>R.C</th>
                        <th className={styles.tableHeaderCell}>T.P</th>
                        <th className={styles.tableHeaderCell}>Puntaje</th>
                        <th className={styles.tableHeaderCell}>Nivel</th>
                        {preguntasRespuestas.map((pr, index) => {
                          return (
                            <th key={pr.order} className={styles.tableHeaderCell}>
                              <button
                                className={styles.popoverButton}
                                popoverTarget={`${pr.order}`}
                              >
                                {index + 1}
                              </button>
                              <div
                                className={styles.popoverContent}
                                popover="auto"
                                id={`${pr.order}`}
                              >
                                <div className="w-full">
                                  <span className={styles.popoverTitle}>
                                    {index + 1}. Actuación:
                                  </span>
                                  <span className={styles.popoverText}>
                                    {pr.preguntaDocente}
                                  </span>
                                </div>
                              </div>
                            </th>
                          );
                        })}
                      </tr>
                    </thead>
                    <tbody>
                      {dataFiltradaDirectorTabla?.map((dir, index) => {
                        return (
                          <tr
                            key={index}
                            className={styles.tableRow}
                          >
                            <td className={styles.tableCell}>
                              {index + 1}
                            </td>
                            <td className={`${styles.tableCell} ${styles.tableCellName}`}>
                              {dir.nombresApellidos?.toUpperCase()}
                            </td>
                            <td className={`${styles.tableCell} ${styles.tableCellName}`}>
                              {dir.dniDocente?.toUpperCase()}
                            </td>
                            <td className={styles.tableCell}>
                              {dir.respuestasCorrectas}
                            </td>
                            <td className={styles.tableCell}>
                              {dir.totalPreguntas}
                            </td>
                            <td className={styles.tableCell}>
                              {dir.puntaje}
                            </td>
                            <td className={styles.tableCell}>
                              {dir.nivel}
                            </td>
                            {dir.respuestas?.map((res) => {
                              return (
                                <td
                                  key={res.order}
                                  className={styles.tableCell}
                                >
                                  {handleValidateRespuesta(res)}
                                </td>
                              );
                            })}
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            }

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
                          {index + 1}.{renderPregunta(dat.id || '')}
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
Reporte.Auth = PrivateRouteDirectores