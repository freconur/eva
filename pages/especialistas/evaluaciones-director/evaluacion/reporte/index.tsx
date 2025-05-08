import PrivateRouteEspecialista from '@/components/layouts/PrivateRoutesEspecialista'
import { useGlobalContext } from '@/features/context/GlolbalContext'
import { DataEstadisticas } from '@/features/types/types'
import { useRouter } from 'next/router'
import React, { useEffect, useState } from 'react'
import header from '../../../../../assets/evaluacion-docente.jpg'
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
import { Bar } from "react-chartjs-2"
import { RiLoader4Line } from 'react-icons/ri'
import PrivateRouteDirectores from '@/components/layouts/PrivateRoutesDirectores'
import UseEvaluacionDocentes from '@/features/hooks/UseEvaluacionDocentes'
import Image from 'next/image'
import styles from './styles.module.css'
import {distritosPuno} from '@/fuctions/provinciasPuno'
import { gradosDeColegio, niveles } from '@/fuctions/regiones'
import UseEvaluacionEspecialistas from '@/features/hooks/UseEvaluacionEspecialistas'
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
const ReporteDirectorDesempeño = () => {
  const route = useRouter()
  const { estudiantes, currentUserData, dataEstadisticas, preguntasRespuestas, loaderPages, loaderReporteDirector, getPreguntaRespuestaDocentes, dataEvaluacionDocente, allEvaluacionesDirectorDocente, dataFiltradaDirectorDocenteTabla, allEvaluacionesEspecialistaDirector, dataFiltradaEspecialistaDirectorTabla } = useGlobalContext()
  const { reporteEvaluacionDocentes, getPreguntasRespuestasDocentes, getDataEvaluacion, reporteTablaEvaluacionDirectorDocente } = UseEvaluacionDocentes()
  const { reporteEvaluacionesDirectores, getPreguntasRespuestasDesempeñoDirectivo,filtrarDataEspecialistaDirectorTabla } = UseEvaluacionEspecialistas()
  const [filtros, setFiltros] = useState({
    provincia: ""
  });

  const [activePopover, setActivePopover] = useState<string | null>(null);

  const handleChangeFiltros = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setFiltros({
      ...filtros,
      [e.target.name]: e.target.value
    });
  };

  const iterateData = (data: DataEstadisticas, respuesta: string) => {
    return {
      labels: ['a', 'b', 'c', 'd'],
      datasets: [
        {
          label: "estadisticas de evaluación",
          data: [data.a, data.b, data.c, data.d],
          backgroundColor: [
            'rgba(255, 99, 132, 0.2)',
            'rgba(153, 102, 255, 0.2)',
            'rgba(54, 162, 235, 0.5)',
            'rgba(75, 192, 192, 0.2)',
            'rgba(153, 102, 255, 0.2)',
            'rgba(201, 203, 207, 0.2)'
          ],
          borderColor: [
            'rgb(255, 99, 132)',
            'rgb(153, 102, 255)',
            'rgb(54, 162, 235)',
            'rgb(75, 192, 192)',
            'rgb(255, 159, 64)',
            'rgb(255, 205, 86)',
            'rgb(201, 203, 207)'
          ],
          borderWidth: 1
        }
      ]
    }
  }

  const options = {
    plugins: {
      legend: {
        position: 'center' as const,
      },
      title: {
        display: true,
        text: 'estadística de evalulación',
      },
    },
  };

  const iterarPregunta = (index: string) => {
    return (
      <h3 className={styles.sectionTitle}>
        <span className={styles.sectionTitleIndicator}></span>
        <span className='text-cyan-500 font-martianMono text-md'>{getPreguntaRespuestaDocentes[Number(index) - 1]?.order}.</span>
        <span className='text-slate-500 font-montserrat text-md font-regular'>{getPreguntaRespuestaDocentes[Number(index) - 1]?.criterio}</span>
      </h3>
    )
  }
  const handleFiltros = () => {
    filtrarDataEspecialistaDirectorTabla(allEvaluacionesEspecialistaDirector, filtros)
  }
  console.log('allEvaluacionesEspecialistaDirector',allEvaluacionesEspecialistaDirector)
  useEffect(() => {
    getDataEvaluacion(`${route.query.idEvaluacion}`);
    reporteEvaluacionesDirectores(`${route.query.idEvaluacion}`);
    getPreguntasRespuestasDesempeñoDirectivo(`${route.query.idEvaluacion}`)
  }, [route.query.idEvaluacion, currentUserData.dni])


  const getBackgroundColor = (value: number) => {
    switch (value) {
      case 1:
        return styles.bgGray;
      case 2:
        return styles.bgOrange;
      case 3:
        return styles.bgGreen;
      case 4:
        return styles.bgCyan;
      default:
        return '';
    }
  };

  return (
    <>
      {
        loaderPages ?
          <div className={styles.loaderContainer}>
            <RiLoader4Line className={styles.loaderIcon} />
            <p className={styles.loaderText}>buscando resultados...</p>
          </div>
          :
          <div className={styles.container}>
            <div className={styles.header}>
              <div className={styles.headerOverlay}></div>

              <Image
                className={styles.headerImage}
                src={header}
                alt="imagen de cabecera"
                priority
              />

              <div className={styles.headerContent}>
                <h1 className={styles.headerTitle}>
                  Reporte de monitoreo al desempeño directivo: <br /> {dataEvaluacionDocente?.name?.toLocaleLowerCase()}
                </h1>
              </div>
            </div>

            <div className={styles.tableContainer}>
              <div className={styles.tableSection}>
                <div>
                  <div className={styles.filtersContainer}>
                    <select
                      name="provincia"
                      className={styles.select}
                      onChange={handleChangeFiltros}
                      value={filtros.provincia}
                    >
                      <option value="">Seleccionar Grado</option>
                      {distritosPuno.find(dis => dis.id === currentUserData.region)?.distritos.map((distri, index) => (
                        <option key={index} value={distri}>{distri}</option>
                      ))}
                    </select>
                    <button className={styles.filterButton} onClick={handleFiltros}>Filtrar</button>
                  </div>
                  <table className={styles.table}>
                    <thead>
                      <tr>
                        <th>#</th>
                        <th>Nombre y apellidos</th>
                        <th>puntaje</th>
                        {
                          getPreguntaRespuestaDocentes.map((pregunta, index) => (
                            <th
                              key={index}
                              onClick={() => setActivePopover(activePopover === pregunta.id ? null : pregunta.id || null)}
                              className={styles.celda}
                            >
                              {pregunta.id}
                              {activePopover === pregunta.id && (
                                <div className={styles.popover}>
                                  {pregunta.criterio}
                                </div>
                              )}
                            </th>
                          ))
                        }
                      </tr>
                    </thead>
                    <tbody>
                      {
                        dataFiltradaEspecialistaDirectorTabla.map((docente, index) => (
                          <tr key={index}>
                            <td>{index + 1}</td>
                            <td>{docente.info?.nombres} {docente.info?.apellidos}</td>
                            <td>{docente.calificacion}</td>
                            {
                              docente.resultados?.map((respuesta, index) => (
                                <td key={index} className={`${getBackgroundColor(Number(respuesta.alternativas?.find(a => a.selected)?.value))} ${styles.celda}`}>
                                  {niveles(Number(respuesta.alternativas?.find(a => a.selected)?.value)) || '-'}
                                </td>
                              ))
                            }
                          </tr>
                        ))
                      }
                    </tbody>
                  </table>
                </div>
                <div>
                  {
                    dataEstadisticas?.map((dat, index) => {
                      return (
                        <div key={index} className={styles.chartContainer}>
                          <h3 className={styles.sectionTitle}>
                            <span className={styles.sectionTitleIndicator}></span>
                            <span>{getPreguntaRespuestaDocentes[Number(index)]?.subOrden || getPreguntaRespuestaDocentes[Number(index)]?.order}.</span>
                            <span>{getPreguntaRespuestaDocentes[Number(index)]?.criterio}</span>
                          </h3>
                          <div className={styles.chartWrapper}>
                            <Bar
                              options={options}
                              data={iterateData(dat, `${preguntasRespuestas[Number(index) - 1]?.respuesta}`)}
                            />
                          </div>
                          <div className={styles.statsContainer}>
                            <p>{dat.a} | {((100 * Number(dat.a)) / Number(dat.total)).toFixed(0)}%</p>
                            <p>{dat.b} | {((100 * Number(dat.b)) / Number(dat.total)).toFixed(0)}%</p>
                            <p>{dat.c} | {((100 * Number(dat.c)) / Number(dat.total)).toFixed(0)}%</p>
                            {dat.d &&
                              <p>{dat.d} | {((100 * Number(dat.d)) / Number(dat.total)).toFixed(0)}%</p>
                            }
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

export default ReporteDirectorDesempeño
ReporteDirectorDesempeño.Auth = PrivateRouteEspecialista