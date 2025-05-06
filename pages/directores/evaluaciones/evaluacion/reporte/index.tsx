import { useGlobalContext } from '@/features/context/GlolbalContext'
import { useReporteDirectores } from '@/features/hooks/useReporteDirectores'
import { useRouter } from 'next/router'
import React, { useEffect, useState } from 'react'
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
import { gradosDeColegio, sectionByGrade, ordernarAscDsc } from '@/fuctions/regiones'
import { Bar } from "react-chartjs-2"
import { useAgregarEvaluaciones } from '@/features/hooks/useAgregarEvaluaciones';
import { Alternativa, DataEstadisticas, PreguntasRespuestas } from '@/features/types/types';
import { RiLoader4Line } from 'react-icons/ri';
import { MdDeleteForever } from 'react-icons/md';
import styles from './Reporte.module.css';
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
    grado: '',
    seccion: '',
    orden: ''
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
  const { reporteDirectorData,reporteToTableDirector ,agregarDatosEstadisticosDirector } = useReporteDirectores()
  const { currentUserData, reporteDirector, preguntasRespuestas, loaderReporteDirector, allRespuestasEstudiantesDirector, dataFiltradaDirectorTabla } = useGlobalContext()
  const { getPreguntasRespuestas } = useAgregarEvaluaciones()
  const [showTable, setShowTable] = useState(false)
  const route = useRouter()
  useEffect(() => {

    getPreguntasRespuestas(`${route.query.idEvaluacion}`)
  }, [currentUserData.dni, route.query.idEvaluacion])

  const handleShowTable = () => {
    setShowTable(!showTable)
  }
  const handleFiltrar = () => {
    reporteToTableDirector(allRespuestasEstudiantesDirector,{grado: filtros.grado, seccion: filtros.seccion, orden: filtros.orden}, `${route.query.id}`, `${route.query.idEvaluacion}`)
  }
  useEffect(() => {
    reporteDirectorData(`${route.query.id}`, `${route.query.idEvaluacion}`)
  }, [route.query.id])

  const iterarPregunta = (index: string) => {
    return (
      <div className='grid gap-1'>
        <h3 className='text-slate-500 mr-2'><span className='text-colorSegundo mr-2 font-semibold'>{index}.</span>{preguntasRespuestas[Number(index) - 1]?.pregunta}</h3>
        <h3 className='text-slate-500 mr-2'><span className='text-colorSegundo mr-2 font-semibold'>Actuación:</span> {preguntasRespuestas[Number(index) - 1]?.preguntaDocente}</h3>
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
  console.log('preguntasRespuestas', preguntasRespuestas)
  console.log('dataFiltradaDirectorTabla', dataFiltradaDirectorTabla)
  console.log('allRespuestasEstudiantesDirector', allRespuestasEstudiantesDirector)
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
  /*  console.log('reporteDirector', reporteDirector) */
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
                <div className={styles.filtersContainer}>
                  <select
                    name="grado"
                    value={filtros.grado}
                    onChange={handleChangeFiltros}
                    className={styles.select}
                  >
                    <option value="">Seleccione un grado</option>
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
                    <option value="">Seleccione una sección</option>
                    {sectionByGrade.map((seccion) => (
                      <option key={seccion.id} value={seccion.id}>
                        {seccion.name.toUpperCase()}
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
                        <th className={styles.tableHeaderCell}>R.C</th>
                        <th className={styles.tableHeaderCell}>T.P</th>
                        {preguntasRespuestas.map((pr) => {
                          return (
                            <th key={pr.order} className={styles.tableHeaderCell}>
                              <button
                                className={styles.popoverButton}
                                popoverTarget={`${pr.order}`}
                              >
                                {pr.order}
                              </button>
                              <div
                                className={styles.popoverContent}
                                popover="auto"
                                id={`${pr.order}`}
                              >
                                <div className="w-full">
                                  <span className={styles.popoverTitle}>
                                    {pr.order}. Actuación:
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
                              {dir.nombresApellidos}
                            </td>
                            <td className={styles.tableCell}>
                              {dir.respuestasCorrectas}
                            </td>
                            <td className={styles.tableCell}>
                              {dir.totalPreguntas}
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
                    reporteDirector?.map((dat, index) => {
                      return (
                        <div key={index} className={styles.questionContainer}>
                          {iterarPregunta(`${dat.id}`)}
                          <div className={styles.chartContainer}>
                            <div className={styles.chartWrapper}>
                              <Bar className={styles.chart}
                                options={options}
                                data={iterateData(dat, `${preguntasRespuestas[Number(index) - 1]?.respuesta}`)}
                              />
                            </div>
                            <div className={styles.statsContainer}>
                              <p>{dat.a} | {dat.total === 0 ? 0 : ((100 * Number(dat.a)) / Number(dat.total)).toFixed(0)} %</p>
                              <p>{dat.b} |{dat.total === 0 ? 0 : ((100 * Number(dat.b)) / Number(dat.total)).toFixed(0)}%</p>
                              <p>{dat.c} | {dat.total === 0 ? 0 : ((100 * Number(dat.c)) / Number(dat.total)).toFixed(0)}%</p>
                              {
                                dat.d &&
                                <p>{dat.d} | {dat.total === 0 ? `${0}%` : ((100 * Number(dat.d)) / Number(dat.total)).toFixed(0)}%</p>
                              }
                            </div>
                            <div className={styles.answerContainer}>
                              respuesta:<span className={styles.answerText}>{preguntasRespuestas[Number(index)]?.respuesta}</span>
                            </div>
                          </div>
                        </div>
                      )
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