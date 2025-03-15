import { useGlobalContext } from '@/features/context/GlolbalContext'
import { useReporteDirectores } from '@/features/hooks/useReporteDirectores'
import { useRouter } from 'next/router'
import React, { useEffect } from 'react'
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
import { useAgregarEvaluaciones } from '@/features/hooks/useAgregarEvaluaciones';
import { DataEstadisticas } from '@/features/types/types';
import { RiLoader4Line } from 'react-icons/ri';
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
  const { reporteDirectorData, agregarDatosEstadisticosDirector } = useReporteDirectores()
  const { currentUserData, reporteDirector, preguntasRespuestas, loaderReporteDirector } = useGlobalContext()
  const { getPreguntasRespuestas } = useAgregarEvaluaciones()
  const route = useRouter()
  useEffect(() => {

    getPreguntasRespuestas(`${route.query.idEvaluacion}`)
  }, [currentUserData.dni, route.query.idEvaluacion])


  useEffect(() => {
    reporteDirectorData(`${currentUserData.dni}`, `${route.query.idEvaluacion}`)
  }, [])
  const iterarPregunta = (index: string) => {
    return (
      <div className='grid gap-1'>
        <h3 className='text-slate-500 mr-2'><span className='text-colorSegundo mr-2 font-semibold'>{index}.</span>{preguntasRespuestas[Number(index) - 1]?.pregunta}</h3>
        <h3 className='text-slate-500 mr-2'><span className='text-colorSegundo mr-2 font-semibold'>Actuación:</span> {preguntasRespuestas[Number(index) - 1]?.preguntaDocente}</h3>
      </div>
    )
  }
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
  console.log('reporteDirector', reporteDirector)
  return (

    <>
      {
        loaderReporteDirector ?
          <div className='grid grid-rows-loader'>
            <div className='flex justify-center items-center'>
              <RiLoader4Line className="animate-spin text-3xl text-colorTercero " />
              <span className='text-colorTercero animate-pulse'>...cargando</span>
            </div>
          </div>
          :
          <div className='grid justify-center items-center relative z-10'>
            <div className='w-[1024px] bg-white grid justify-center items-center p-20'>
              <h1 className='text-2xl text-center text-cyan-700 font-semibold uppercase mb-20'>reporte de evaluación</h1>
              <div>
                <div>
                  {
                    reporteDirector?.map((dat, index) => {
                      return (
                        <div key={index} className="w-[800px]  p-2 rounded-lg">
                          {iterarPregunta(`${dat.id}`)}
                          <div className='bg-white rounded-md grid justify-center items-center place-content-center'>
                            <div className='grid justify-center m-auto items-center w-[500px]'>
                              <Bar className="m-auto w-[500px]"
                                options={options}
                                data={iterateData(dat, `${preguntasRespuestas[Number(index) - 1]?.respuesta}`)}
                              />
                            </div>
                            <div className='text-sm  flex gap-[90px] items-center justify-center ml-[30px] text-slate-500'>
                              <p>{dat.a} | {dat.total === 0 ? 0 : ((100 * Number(dat.a)) / Number(dat.total)).toFixed(0)} %</p>
                              <p>{dat.b} |{dat.total === 0 ? 0 : ((100 * Number(dat.b)) / Number(dat.total)).toFixed(0)}%</p>
                              <p>{dat.c} | {dat.total === 0 ? 0 : ((100 * Number(dat.c)) / Number(dat.total)).toFixed(0)}%</p>
                              {
                                dat.d &&
                                <p>{dat.d} | {dat.total === 0 ? 0 : ((100 * Number(dat.d)) / Number(dat.total)).toFixed(0)}%</p>
                              }
                            </div>
                            <div className='text-center text-md  w-[150px] text-colorTercero p-2  rounded-md mt-5 border border-colorTercero'>respuesta:<span className='text-colorTercero font-semibold ml-2'>{preguntasRespuestas[Number(index)]?.respuesta}</span> </div>
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