import { useGlobalContext } from '@/features/context/GlolbalContext'
import { DataEstadisticas } from '@/features/types/types'
import { useRouter } from 'next/router'
import React, { useEffect } from 'react'
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
import styles from '@/styles/coberturaCurricular.module.css'

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

const Reportes = () => {
  const route = useRouter()
  const { estudiantes, currentUserData, dataEstadisticas, preguntasRespuestas, loaderPages, loaderReporteDirector, getPreguntaRespuestaDocentes, dataEvaluacionDocente } = useGlobalContext()
  const { reporteEvaluacionDocentes, getPreguntasRespuestasDocentes, getDataEvaluacion } = UseEvaluacionDocentes()

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
        <span className='text-cyan-500 font-martianMono text-md'>{getPreguntaRespuestaDocentes[Number(index) - 1]?.id}.</span>
        <span className='text-slate-500 font-montserrat text-md font-regular'>{getPreguntaRespuestaDocentes[Number(index) - 1]?.criterio}</span>
      </h3>
    )
  }

  useEffect(() => { 
    getDataEvaluacion(`${route.query.idEvaluacion}`);
    reporteEvaluacionDocentes(`${route.query.idEvaluacion}`); 
    getPreguntasRespuestasDocentes(`${route.query.idEvaluacion}`) 
  }, [route.query.idEvaluacion, currentUserData.dni])

  return (
    <>
      {
        loaderPages ?
          <div className={styles.loaderContainer}>
            <RiLoader4Line className={styles.loaderIcon} />
            <p className={styles.loaderText}>buscando resultados...</p>
          </div>
          :
          <div className='grid relative z-10'>
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
                  Reporte de {dataEvaluacionDocente?.name}
                </h1>
              </div>
            </div>

            <div className={styles.tableContainer}>
              <div className={styles.tableSection}>
                <div>
                  {
                    dataEstadisticas?.map((dat, index) => {
                      return (
                        <div key={index} className="w-full p-6 rounded-lg">
                          {iterarPregunta(`${dat.id}`)}
                          <div className='bg-white rounded-md grid justify-center items-center place-content-center'>
                            <div className='grid justify-center m-auto items-center w-[500px]'>
                              <Bar className="m-auto w-[500px]"
                                options={options}
                                data={iterateData(dat, `${preguntasRespuestas[Number(index) - 1]?.respuesta}`)}
                              />
                            </div>
                            <div className='text-sm flex gap-[90px] items-center justify-center ml-[30px] text-slate-500'>
                              <p>{dat.a} | {((100 * Number(dat.a)) / Number(dat.total)).toFixed(0)}%</p>
                              <p>{dat.b} | {((100 * Number(dat.b)) / Number(dat.total)).toFixed(0)}%</p>
                              <p>{dat.c} | {((100 * Number(dat.c)) / Number(dat.total)).toFixed(0)}%</p>
                              {dat.d &&
                                <p>{dat.d} | {((100 * Number(dat.d)) / Number(dat.total)).toFixed(0)}%</p>
                              }
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

export default Reportes
Reportes.Auth = PrivateRouteDirectores