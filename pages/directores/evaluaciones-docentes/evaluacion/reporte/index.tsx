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
  const data = {
    labels: ['a', 'b', 'c'],
    datasets: [{
      axis: 'y',
      label: 'My First Dataset',
      // data: dataEstadisticas,
      data: [65, 59, 80],
      fill: false,

      borderWidth: 1
    }]
  };

  const route = useRouter()
  const { estudiantes, currentUserData, dataEstadisticas, preguntasRespuestas, loaderPages, loaderReporteDirector, getPreguntaRespuestaDocentes, dataEvaluacionDocente } = useGlobalContext()
  const { reporteEvaluacionDocentes, getPreguntasRespuestasDocentes,getDataEvaluacion } = UseEvaluacionDocentes()
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
  useEffect(() => { getDataEvaluacion(`${route.query.idEvaluacion}`);reporteEvaluacionDocentes(`${route.query.idEvaluacion}`); getPreguntasRespuestasDocentes(`${route.query.idEvaluacion}`) }, [route.query.idEvaluacion, currentUserData.dni])
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
              <div className='top-0 bottom-0 rigth-0 left-0 bg-blue-600 z-[15] absolute w-full opacity-30'></div>

              <Image
                className='absolute bottom-0 top-[-250px] right-0 left-0 z-1 opacity-1'
                src={header}
                alt="imagen de cabecera"
                objectFit='fill'
                priority
              />
              <h1 className="text-textTitulos relative z-[20]  text-3xl font-bold font-martianMono capitalize text-left">Reporte de {dataEvaluacionDocente?.name}</h1>
            </div>
            <div className='w-[1024px] bg-white grid justify-center items-center p-20'>
              {/* <h1 className='text-2xl text-center text-cyan-700 font-semibold uppercase mb-20'>reporte de evaluación</h1> */}
              <div>
                <div>
                  {
                    dataEstadisticas?.map((dat, index) => {
                      return (
                        <div key={index} className="w-[800px]  p-2 rounded-lg">
                          {iterarPregunta(`${dat.id}`)}
                          <div className='bg-white rounded-md grid justify-center items-center place-content-center'>
                            <div className='grid justify-center m-auto items-center w-[500px]'>
                              <Bar className="m-auto w-[500px]"
                                // data={data}
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
                            {/* <div className='text-center text-md  w-[150px] text-colorTercero p-2  rounded-md mt-5 border border-colorTercero'>respuesta:<span className='text-colorTercero font-semibold ml-2'>{preguntasRespuestas[Number(index)]?.respuesta}</span> </div> */}
                          </div>
                        </div>
                      )
                    })
                  }
                </div>
              </div>
            </div>
            {/* <table className='w-full  bg-white  rounded-md shadow-md relative'>
              <thead className='bg-blue-700 border-b-2 border-blue-300 '>
                <tr className='text-white capitalize font-nunito '>
                  <th className="uppercase  pl-1 md:pl-2 px-1 text-center">#</th>
                  <th className="py-3 md:p-2 pl-1 md:pl-2 text-left ">dni</th>
                  <th className="py-3 md:p-2  text-left">nombres y apellidos</th>
                  <th className="py-3 md:p-2  text-left">rpta. correctas</th>
                  <th className="py-3 md:p-2  text-left">rpta. incorrectas</th>
                  <th className="py-3 md:p-2  text-left">total de preguntas</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {
                  dataEstadisticas.length > 0 ?
                    estudiantes?.map((dir, index) => {
                      return (
                        <tr key={index} className='h-[60px] hover:bg-blue-100 duration-100 cursor-pointer'>
                          <td className='uppercase text-slate-500 pl-1 md:pl-2 px-1 text-center'>{index + 1}</td>
                          <td className='uppercase text-slate-500 pl-1 md:pl-2 px-1 text-left'>{dir.dni}</td>
                          <td className='uppercase text-slate-500 pl-1 md:pl-2 px-1 text-left'>{dir.nombresApellidos}</td>
                          <td className='uppercase text-slate-500 pl-1 md:pl-2 px-1 text-center'>{dir.respuestasCorrectas}</td>
                          <td className='uppercase text-slate-500 pl-1 md:pl-2 px-1 text-center'>{Number(dir.totalPreguntas) - Number(dir.respuestasCorrectas)}</td>
                          <td className='uppercase text-slate-500 pl-1 md:pl-2 px-1 text-center'>{dir.totalPreguntas}</td>
                        </tr>
                      )
                    })
                    :
                    null
                }
              </tbody>
            </table> */}
          </div>
      }
    </>
  )
}

export default Reportes
Reportes.Auth = PrivateRouteDirectores