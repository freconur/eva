import { useGlobalContext } from "@/features/context/GlolbalContext";
import { useReporteDirectores } from "@/features/hooks/useReporteDirectores";
import { useRouter } from "next/router";
import React, { useEffect, useState } from "react";
import header from '@/assets/evaluacion-docente.jpg'
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
} from "chart.js";
import { Bar } from "react-chartjs-2";
import { DataEstadisticas } from "@/features/types/types";
import { RiLoader4Line } from "react-icons/ri";
import { useAgregarEvaluaciones } from "@/features/hooks/useAgregarEvaluaciones";
import Image from "next/image";
import UseEvaluacionDocentes from "@/features/hooks/UseEvaluacionDocentes";
import UseEvaluacionDirectores from "@/features/hooks/UseEvaluacionDirectores";
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
  const iterateData = (data: DataEstadisticas, respuesta: string) => {
    return {
      labels: data.d === undefined ? ['a', 'b', 'c'] : ['nivel 1', 'nivel 2', 'nivel 3', 'nivel 4'],
      datasets: [
        {
          label: "total",
          data: [data.a, data.b, data.c, data.d !== 0 && data.d],
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
          borderWidth: 1,
        },
      ],
    };
  };
  const route = useRouter();
  const [loaderReporteDirector, setLoaderReporteDirector] = useState(false);
  const {
    reporteRegionales,
    getRegiones,
    resetReporteRegional,
    reporteRegionalGlobal,
    resetReporteGlobal
  } = useReporteDirectores();

  const { getDataEvaluacion, reporteUgelGlobal, getPreguntasRespuestasDirectores } = UseEvaluacionDirectores()
  const {
    regiones,
    reporteRegional,
    preguntasRespuestas,
    dataEvaluacionDocente,
    getPreguntaRespuestaDocentes,
    loaderPages
  } = useGlobalContext();
  const { getPreguntasRespuestas } = useAgregarEvaluaciones();
  const [regionValue, setRegionValue] = useState("");

  useEffect(() => {
    if (route.query.idEvaluacion) {
      if (regionValue.length > 0 && route.query.idEvaluacion.length > 0) {
        console.log('cumplo')
        reporteUgelGlobal(Number(regionValue), `${route.query.idEvaluacion}`,getPreguntaRespuestaDocentes.length )
      }
    }
  }, [regionValue, route.query.idEvaluacion])

  useEffect(() => {

    getRegiones();
    resetReporteRegional();
    resetReporteGlobal()
  }, []);

  const handleRegion = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setRegionValue(e.target.value);
  };
  const iterarPregunta = (index: string) => {
    return (
      <div className="grid gap-1">
        <h3 className="text-slate-500 mr-2">
          <span className="text-colorSegundo mr-2 font-semibold">{index}.</span>{" "}
          {getPreguntaRespuestaDocentes[Number(index) - 1]?.criterio}
        </h3>
        {/* <h3 className="text-slate-500 ml-8">
          <strong>Actuación:</strong>{" "}
          {getPreguntaRespuestaDocentes[Number(index) - 1]?.preguntaDocente}
        </h3> */}
      </div>
    );
  };
  useEffect(() => {
    getDataEvaluacion(`${route.query.idEvaluacion}`)
    getPreguntasRespuestasDirectores(`${route.query.idEvaluacion}`)
  },[route.query.idEvaluacion])
  // console.log('reporteRegional', reporteRegional)
  // console.log('getPreguntaRespuestaDocentes', getPreguntaRespuestaDocentes)
  const options = {
    plugins: {
      legend: {
        position: "center" as const,
      },
      title: {
        display: true,
        text: "estadistica de respuestas",
      },
    },
  };
  return (
    // <div className="grid justify-center items-center relative mt-3">
    <div className="">
      <div className='grid relative xxl:flex gap-[20px] justify-between p-20 bg-headerPsicolinguistica overflow-hidden'>
        <div className='top-0 bottom-0 rigth-0 left-0 bg-gray-700 z-[15] absolute w-full opacity-60'></div>
        <Image
          // className='absolute bottom-0 top-[-250px] right-0 left-0 z-1 opacity-1'
          className="absolute object-cover h-[100%] w-full bottom-0 top-[0px] right-0 left-0 z-[10] opacity-80"
          src={header}
          alt="imagen de cabecera"
          objectFit='fill'
          priority
        />
        <div className="relative z-[50]">
          {/* <h2></h2> */}
          <h2 className="uppercase text-3xl  font-montserrat font-semibold text-textTitulos mb-5">
            Reporte de evaluación de {dataEvaluacionDocente.name}
          </h2>
          <select
            onChange={handleRegion}
            className=" text-slate-500 p-3 rounded-md shadow-lg w-[200px] mb-10 outline-none"
          >
            <option>---UGEL---</option>
            <option value={15}>GLOBAL</option>
            {regiones?.map((region, index) => {
              return (
                <option key={index} value={region.codigo}>
                  {region.region?.toUpperCase()}
                </option>
              );
            })}
          </select>
        </div>
      </div>
      <div className="w-[1024px] bg-white ">

        <div>
          {/* <p className='text-xl text-slate-600 mb-2 capitalize'>selecciona una región:</p> */}

          {loaderPages ? (
            <div className="grid ">
              <div className="flex justify-center items-center">
                <RiLoader4Line className="animate-spin text-3xl text-colorTercero " />
                <span className="text-colorTercero animate-pulse">
                  ...buscando resultados
                </span>
              </div>
            </div>
          ) : reporteRegional.length > 0 ? (
            <div className="grid justify-center items-center relative z-10">
              <div className="w-[1024px] grid justify-center items-center p-10">
                {/* <h1 className="text-2xl text-center text-cyan-700 font-semibold uppercase mb-20">
                  reporte de evaluación
                </h1> */}
                <div>
                  <div>
                    {reporteRegional?.map((dat, index) => {
                      return (
                        <div key={index} className="w-[800px]  p-2 rounded-lg">
                          {iterarPregunta(`${dat.id}`)}
                          <div className="bg-white rounded-md grid justify-center items-center place-content-center">
                            <div className="grid justify-center m-auto items-center w-[500px]">
                              <Bar
                                className="m-auto w-[500px]"
                                // data={data}
                                options={options}
                                data={iterateData(
                                  dat,
                                  `${preguntasRespuestas[Number(index) - 1]
                                    ?.respuesta
                                  }`
                                )}
                              />
                            </div>
                            <div className="text-sm  flex gap-[90px] items-center justify-center ml-[30px] text-slate-500">
                              <p>{dat.a} | {dat.total === 0 ? 0 : ((100 * Number(dat.a)) / Number(dat.total)).toFixed(0)} %</p>
                              <p>{dat.b} |{dat.total === 0 ? 0 : ((100 * Number(dat.b)) / Number(dat.total)).toFixed(0)}%</p>
                              <p>{dat.c} | {dat.total === 0 ? 0 : ((100 * Number(dat.c)) / Number(dat.total)).toFixed(0)}%</p>
                              {
                                dat.d &&
                                <p>{dat.d} | {dat.total === 0 ? 0 : ((100 * Number(dat.d)) / Number(dat.total)).toFixed(0)}%</p>
                              }
                            </div>
                            {/* <div className="text-center text-md  w-[150px] text-colorTercero p-2  rounded-md mt-5 border border-colorTercero">
                              respuesta:
                              <span className="text-colorTercero font-semibold ml-2">
                                {preguntasRespuestas[Number(index)]?.respuesta}
                              </span>{" "}
                            </div> */}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <>
              <div className="w-full flex justify-center items-center">
                <p className="text-slate-500">No hay resultados</p>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default ReporteRegional;