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
import { Bar } from "react-chartjs-2"
import { DataEstadisticas } from '@/features/types/types';
import { RiLoader4Line } from 'react-icons/ri';
import { useAgregarEvaluaciones } from '@/features/hooks/useAgregarEvaluaciones';
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
const ReporteRegional = () => {
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
  const iterateData = (data: DataEstadisticas, respuesta: string) => {
    return {
      labels: ['a', 'b', 'c'],
      datasets: [
        {
          label: "total",
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
  const route = useRouter()
  const [loaderReporteDirector, setLoaderReporteDirector] = useState(false)
  const { reporteRegionales, getRegiones } = useReporteDirectores()
  const { regiones, reporteRegional, preguntasRespuestas, loaderReporteRegional } = useGlobalContext()
  const { getPreguntasRespuestas } = useAgregarEvaluaciones()
  const [regionValue, setRegionValue] = useState({ region: 0 })

  useEffect(() => {
    getRegiones()
  }, [])

  useEffect(() => {
    if (regionValue.region !== 0) {
      reporteRegionales(Number(regionValue.region), `${route.query.idEvaluacion}`)
    }
    getPreguntasRespuestas(`${route.query.idEvaluacion}`)
  }, [regionValue.region])
  const handleRegion = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setRegionValue({ region: Number(e.target.value) })
  }
  const iterarPregunta = (index: string) => {
    return (
      <div className='flex'>
        <span className='text-colorSegundo mr-2 font-semibold'>{index}.</span> <h3 className='text-slate-500 mr-2'>{preguntasRespuestas[Number(index) - 1]?.preguntaDocente}</h3>
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
  //tengo que traerme toda la informacion de la cada director que corresponda a la region.
  return (
    <div className="grid justify-center items-center relative mt-3">
      <div className='w-[1024px] bg-white  p-20'>

        <h1 className='uppercase text-2xl  font-montserrat font-semibold text-colorSexto'>reporte regional</h1>
        <div>
          <p className='text-xl text-slate-600 mb-2 capitalize'>selecciona una región:</p>
          <select onChange={handleRegion} className=' text-slate-500 p-3 rounded-md shadow-lg w-full mb-10'>
            <option>---REGION---</option>
            {
              regiones?.map((region, index) => {
                return (
                  <option key={index} value={region.codigo}>{region.region?.toUpperCase()}</option>
                )
              })
            }
          </select>
          {
            loaderReporteRegional ?
              <div className='grid '>
                <div className='flex justify-center items-center'>
                  <RiLoader4Line className="animate-spin text-3xl text-colorTercero " />
                  <span className='text-colorTercero animate-pulse'>...buscando resultados</span>
                </div>
              </div>
              :
              reporteRegional.length > 0 ?
              <div className='grid justify-center items-center relative z-10'>
                <div className='w-[1024px] grid justify-center items-center p-20'>
                  <h1 className='text-2xl text-center text-cyan-700 font-semibold uppercase mb-20'>reporte de evaluación</h1>
                  <div>
                    <div>
                      {
                        reporteRegional?.map((dat, index) => {
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
              :
              <>
                <div className='w-full flex justify-center items-center'>
                  <p className='text-slate-500'>No hay resultados</p>
                </div>
              </>
          }
        </div>
      </div>
    </div>
  )
}

export default ReporteRegional