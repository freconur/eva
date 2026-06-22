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
import styles from './styles.module.css'
import Image from 'next/image'
import PrivateRouteAdmins from '@/components/layouts/PrivateRoutes'
import { regionTexto } from '@/fuctions/regiones'
import UseEvaluacionDirectores from '@/features/hooks/UseEvaluacionDirectores'
import { useColorsFromCSS } from '@/features/hooks/useColorsFromCSS'

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
  const { reporteEvaluacionDocentes, getPreguntasRespuestasDirectores, getDataEvaluacion, reporteEvaluacionDocenteAdmin } = UseEvaluacionDirectores()
  const { getAlternativaColor } = useColorsFromCSS()
  const iterateData = (data: DataEstadisticas, respuesta: string) => {
    const pregunta = getPreguntaRespuestaDocentes[Number(data.id) - 1];
    
    // Función para determinar si una opción es la respuesta correcta
    const esRespuestaCorrecta = (opcion: string) => {
      return opcion.toLowerCase() === respuesta.toLowerCase();
    };

    let alternativas = pregunta?.alternativas || [
      { alternativa: 'A', descripcion: '' },
      { alternativa: 'B', descripcion: '' },
      { alternativa: 'C', descripcion: '' },
      { alternativa: 'D', descripcion: '' }
    ];

    // Filtrar la alternativa 'no respondio' si su cantidad es 0
    alternativas = alternativas.filter((alt: any) => {
      const isNoRespondio = alt.descripcion?.toLowerCase() === 'no respondio';
      if (isNoRespondio) {
        const key = (alt.alternativa || '').toLowerCase();
        const count = data[key] || 0;
        return count > 0;
      }
      return true;
    });

    const labels = alternativas.map((alt: any) => {
      const isNoRespondio = alt.descripcion?.toLowerCase() === 'no respondio';
      if (isNoRespondio) return 'NR';
      return (alt.alternativa || '').toUpperCase();
    });

    const dataValues = alternativas.map((alt: any) => {
      const key = (alt.alternativa || '').toLowerCase();
      return data[key] || 0;
    });

    const backgroundColor = alternativas.map((alt: any) => {
      const key = (alt.alternativa || '').toLowerCase();
      return esRespuestaCorrecta(key) ? 'rgba(34, 197, 94, 0.8)' : `${getAlternativaColor(key)}CC`;
    });

    const borderColor = alternativas.map((alt: any) => {
      const key = (alt.alternativa || '').toLowerCase();
      return esRespuestaCorrecta(key) ? 'rgb(34, 197, 94)' : getAlternativaColor(key);
    });

    return {
      labels,
      datasets: [
        {
          label: "estadisticas de evaluación",
          data: dataValues,
          backgroundColor,
          borderColor,
          borderWidth: 1
        }
      ]
    };
  };

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
    getPreguntasRespuestasDirectores(`${route.query.idEvaluacion}`)
    // eslint-disable-next-line react-hooks/exhaustive-deps
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
                                data={iterateData(dat, `${(getPreguntaRespuestaDocentes[Number(dat.id) - 1] as any)?.respuesta || ''}`)}
                              />
                            </div>
                            <div className='text-sm flex gap-[40px] items-center justify-center ml-[30px] text-slate-500 flex-wrap'>
                              {(getPreguntaRespuestaDocentes[Number(dat.id) - 1]?.alternativas || [
                                { alternativa: 'A', descripcion: '' },
                                { alternativa: 'B', descripcion: '' },
                                { alternativa: 'C', descripcion: '' },
                                { alternativa: 'D', descripcion: '' }
                              ])
                                .filter((alt: any) => {
                                  const isNoRespondio = alt.descripcion?.toLowerCase() === 'no respondio';
                                  if (isNoRespondio) {
                                    const key = (alt.alternativa || '').toLowerCase();
                                    const count = dat[key] || 0;
                                    return count > 0;
                                  }
                                  return true;
                                })
                                .map((alt: any, idx: number) => {
                                  const key = (alt.alternativa || '').toLowerCase();
                                  const count = dat[key] || 0;
                                  const total = dat.total || 1;
                                  const percentage = total === 0 ? '0' : ((100 * Number(count)) / Number(total)).toFixed(0);
                                  const labelText = alt.descripcion?.toLowerCase() === 'no respondio' ? 'NR' : key.toUpperCase();
                                  return (
                                    <p key={idx}>{labelText}: {count} | {percentage}%</p>
                                  );
                                })}
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