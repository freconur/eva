import PrivateRouteDocentes from '@/components/layouts/PrivateRoutesDocentes'
import { useGlobalContext } from '@/features/context/GlolbalContext'
import { useReporteDocente } from '@/features/hooks/useReporteDocente'
import { DataEstadisticas } from '@/features/types/types'
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
import { useAgregarEvaluaciones } from '@/features/hooks/useAgregarEvaluaciones'
import { RiLoader4Line } from 'react-icons/ri'

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
  const { estudiantes, currentUserData, dataEstadisticas, preguntasRespuestas, loaderPages, loaderReporteDirector } = useGlobalContext()
  const { estudiantesQueDieronExamen } = useReporteDocente()
  const { getPreguntasRespuestas } = useAgregarEvaluaciones()
  const iterateData = (data: DataEstadisticas, respuesta: string) => {
    return {
      labels: ['a', 'b', 'c'],
      datasets: [
        {
          label: "estadisticas de respuesta",
          data: [data.a, data.b, data.c],
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

  useEffect(() => {
   /*  estudiantesQueDieronExamen(`${route.query.idExamen}`, `${currentUserData.dni}`) */
    getPreguntasRespuestas(`${route.query.idExamen}`)
  }, [route.query.idExamen, currentUserData.dni])
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

  const iterarPregunta = (index: string) => {
    return (
      <h3>
        {preguntasRespuestas[Number(index) - 1]?.id}. {preguntasRespuestas[Number(index) - 1]?.pregunta}
      </h3>
    )
  }
// console.log('dataEstadisticas', dataEstadisticas)
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
                            <div className='text-center text-md  w-[150px] text-colorTercero p-2  rounded-md mt-5 border border-colorTercero'>respuesta:<span className='text-colorTercero font-semibold ml-2'>{preguntasRespuestas[Number(index)]?.respuesta}</span> </div>
                          </div>
                        </div>
                      )
                    })
                  }
                </div>
              </div>
            </div>
            <table className='w-full  bg-white  rounded-md shadow-md relative'>
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
              </table>
          </div>
      }

      {/* {
        loaderPages ?
          <div className='grid grid-rows-loader'>
            <div className='flex justify-center items-center'>
              <RiLoader4Line className="animate-spin text-3xl text-colorTercero " />
              <span className='text-colorTercero animate-pulse'>...cargando</span>
            </div>
          </div>
          :
          <div className='p-10 grid items-center justify-center'>
            <h1 className='text-2xl uppercase mb-10 font-semibold text-blue-700'>reporte de evalucion</h1>
            <div className=' gap-10 grid items-center justify-center m-auto' >
              {
                dataEstadisticas?.map((dat, index) => {
                  return (
                    <div key={index} className="w-[800px]  p-2 rounded-lg">
                      <h3 className='text-slate-600 text-lg mb-10'>{iterarPregunta(`${dat.id}`)}</h3>
                      <div className='bg-white w-[500px] rounded-md grid place-content-center'>
                        <Bar className="w-full h-full"
                          // data={data}
                          options={options}
                          data={iterateData(dat, `${preguntasRespuestas[Number(index) - 1]?.respuesta}`)}
                        />
                        <div className='text-sm  flex gap-[90px] items-center justify-center ml-[30px] text-slate-500'>
                          <p>{dat.a} | {((100 * Number(dat.a)) / Number(dat.total)).toFixed(0)}%</p>
                          <p>{dat.b} |{((100 * Number(dat.b)) / Number(dat.total)).toFixed(0)}%</p>
                          <p>{dat.c} | {((100 * Number(dat.c)) / Number(dat.total)).toFixed(0)}%</p>
                        </div>
                        <div className='text-center text-md  text-green-500'>respuesta:<span className='text-green-500 font-semibold ml-2'>{preguntasRespuestas[Number(index) - 1]?.respuesta}</span> </div>
                      </div>
                    </div>
                  )
                })
              }


              <table className='w-full  bg-white  rounded-md shadow-md relative'>
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
              </table>
              <p className='text-lg text-slate-400 text-center '>Aun no existen datos, evalua a los estudiantes para poder ver resultados.</p>
            </div>
          </div>

      } */}
    </>
  )
}

export default Reportes
Reportes.Auth = PrivateRouteDocentes