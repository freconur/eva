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
import UseEvaluacionDocentes from '@/features/hooks/UseEvaluacionDocentes'
import Image from 'next/image'
import PrivateRouteAdmins from '@/components/layouts/PrivateRoutes'
import { regionTexto } from '@/fuctions/regiones'

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
  const { currentUserData, dataEstadisticas, preguntasRespuestas, loaderPages, loaderReporteDirector, getPreguntaRespuestaDocentes, dataEvaluacionDocente, dataDirector } = useGlobalContext()
  const { reporteEvaluacionDocentes, getPreguntasRespuestasDocentes, getDataEvaluacion, reporteEvaluacionDocenteAdmin } = UseEvaluacionDocentes()
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
      <h3>
        <span className='text-cyan-500 font-martianMono text-md'>{getPreguntaRespuestaDocentes[Number(index) - 1]?.id}.</span>
        <span className='text-slate-500 font-montserrat text-md font-regular'>{getPreguntaRespuestaDocentes[Number(index) - 1]?.criterio}</span>

      </h3>
    )
  }
  useEffect(() => {
    getDataEvaluacion(`${route.query.idEvaluacion}`);
    reporteEvaluacionDocenteAdmin(`${route.query.idEvaluacion}`, `${route.query.idDirector}`);
    getPreguntasRespuestasDocentes(`${route.query.idEvaluacion}`)
  }, [route.query.idEvaluacion, route.query.idDirector])
  return (
    <>
      {
        loaderPages ?
          <div className='grid grid-rows-loader'>
            <div className='flex justify-center items-center'>
              <RiLoader4Line className="animate-spin text-3xl text-colorTercero " />
              <span className='text-colorTercero animate-pulse'>...cargando</span>
            </div>
          </div>
          :
          <div className='grid  relative z-10'>
            <div className='grid relative xxl:flex gap-[20px] justify-between p-20 bg-headerPsicolinguistica overflow-hidden'>
              <div className='top-0 bottom-0 rigth-0 left-0 bg-gray-600 z-[15] absolute w-full opacity-50'></div>

              <Image
                className="absolute object-cover h-[100%] w-full bottom-0 top-[0px] right-0 left-0 z-[10] opacity-80"
                src={header}
                alt="imagen de cabecera"
                objectFit='fill'
                priority
              />
              <h1 className="text-textTitulos relative z-[20]  text-3xl font-bold font-martianMono capitalize text-left">Reporte de {dataEvaluacionDocente?.name}</h1>
              <div>
              <h3  className="text-pastel1 relative z-[20]  text-xl font-bold font-martianMono uppercase text-left">{dataDirector.nombres} {dataDirector.apellidos}</h3>
              <h3  className="text-pastel1 relative z-[20]  text-lg font-bold font-martianMono uppercase text-left">{dataDirector.dni}</h3>
              <h3  className="text-amarilloLogo relative z-[20]  text-lg font-bold font-martianMono uppercase text-left">{dataDirector.perfil?.nombre}</h3>
              <h3  className="text-amarilloLogo relative z-[20]  text-lg font-bold font-martianMono uppercase text-left">{dataDirector.institucion}</h3>
              <h3  className="text-amarilloLogo relative z-[20]  text-lg font-bold font-martianMono uppercase text-left">{regionTexto(`${dataDirector.region}`)}</h3>
              </div>
              
              
            </div>
            <div className='w-full lg:w-[1024px] bg-white grid justify-center items-center p-20'>
              <div>
                <div>
                  {
                    dataEstadisticas?.map((dat, index) => {
                      return (
                        <div key={index} className="w-full lg:w-[800px]  p-2 rounded-lg">
                          {iterarPregunta(`${dat.id}`)}
                          <div className='bg-white rounded-md grid justify-center items-center place-content-center'>
                            <div className='grid justify-center m-auto items-center w-[500px]'>
                              <Bar className="m-auto w-[500px] "
                                options={options}
                                data={iterateData(dat, `${preguntasRespuestas[Number(index) - 1]?.respuesta}`)}
                              />
                            </div>
                            <div className='text-sm  flex gap-[90px] items-center justify-center ml-[30px] text-slate-500'>
                              <p>{dat.a} | {((100 * Number(dat.a)) / Number(dat.total)).toFixed(0)}%</p>
                              <p>{dat.b} |{((100 * Number(dat.b)) / Number(dat.total)).toFixed(0)}%</p>
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
Reportes.Auth = PrivateRouteAdmins