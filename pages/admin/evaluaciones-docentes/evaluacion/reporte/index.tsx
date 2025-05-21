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
import { gradosDeColegio, sectionByGrade, ordernarAscDsc, niveles, area, caracteristicasDirectivo, genero, regiones } from '@/fuctions/regiones'
import PrivateRouteEspecialista from '@/components/layouts/PrivateRoutesEspecialista'
import { useReporteEspecialistas } from '@/features/hooks/useReporteEspecialistas'
import { currentMonth, getAllMonths } from '@/fuctions/dates'
import { distritosPuno } from '@/fuctions/provinciasPuno'
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
  const { currentUserData, dataEstadisticas, preguntasRespuestas, loaderPages, getPreguntaRespuestaDocentes, dataEvaluacionDocente, allEvaluacionesDirectorDocente, dataFiltradaDirectorDocenteTabla } = useGlobalContext()
  const { reporteEvaluacionDocentes, getPreguntasRespuestasDocentes, getDataEvaluacion, reporteTablaEvaluacionDirectorDocente, resetReporteTabla } = UseEvaluacionDocentes()
  const { reporteEspecialistaDeDocente, reporteFiltrosEspecialistaDirectores } = useReporteEspecialistas()
  const [filtros, setFiltros] = useState({
    area: '',
    region: '',
    distrito: '',
    orden: '',
    genero: '',
    caracteristicaCurricular: ''
  });
  const [distritosDisponibles, setDistritosDisponibles] = useState<string[]>([]);
  const [activePopover, setActivePopover] = useState<string | null>(null);
  const [selectedMonth, setSelectedMonth] = useState<number>(currentMonth)
  const handleChangeFiltros = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setFiltros({
      ...filtros,
      [e.target.name]: e.target.value
    });
  };

  const iterateData = (data: DataEstadisticas, respuesta: string) => {
    return {
      labels: ['Nivel 1', 'Nivel 2', 'Nivel 3', 'Nivel 4'],
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
    if (filtros.region) {
      const provinciaEncontrada = distritosPuno.find(p => p.id === Number(filtros.region));
      if (provinciaEncontrada) {
        setDistritosDisponibles(provinciaEncontrada.distritos);
      } else {
        setDistritosDisponibles([]);
      }
    } else {
      setDistritosDisponibles([]);
    }
  }, [filtros.region]);
  const handleFiltrar = () => {
    console.log('test')
    reporteFiltrosEspecialistaDirectores(allEvaluacionesDirectorDocente, filtros)
  }
  const handleChangeMonth = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setSelectedMonth(Number(e.target.value))
  }
  useEffect(() => {
    getDataEvaluacion(`${route.query.idEvaluacion}`);
    reporteEspecialistaDeDocente(`${route.query.idEvaluacion}`, currentMonth);
    getPreguntasRespuestasDocentes(`${route.query.idEvaluacion}`)
  }, [route.query.idEvaluacion, currentUserData.dni])


  useEffect(() => {
    reporteEspecialistaDeDocente(`${route.query.idEvaluacion}`, selectedMonth)
  }, [selectedMonth])
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
                  Reporte de la rúbrica de la mediación didáctica de la {dataEvaluacionDocente?.name}
                </h1>
              </div>
            </div>
            <div className={styles.filtersContainer}>
              <div className={styles.filtersContainerMonth}>
                <select
                  onChange={handleChangeMonth}
                  className={styles.select}>
                  <option value="">Mes</option>
                  {
                    getAllMonths.slice(0, currentMonth + 1).map((mes, index) => (
                      <option key={index} value={mes.id}>{mes.name}</option>
                    ))
                  }
                </select>
              </div>
              <div>
                <select
                  name="region"
                  className={styles.select}
                  onChange={handleChangeFiltros}
                  value={filtros.region}
                >
                  <option value="">Seleccionar Región</option>
                  {regiones.map((region, index) => (
                    <option key={index} value={region.id}>{region.region}</option>
                  ))}
                </select>

                <select
                  name="distrito"
                  className={styles.select}
                  onChange={handleChangeFiltros}
                  value={filtros.distrito}
                  disabled={!filtros.region}
                >
                  <option value="">Seleccionar Distrito</option>
                  {distritosDisponibles.map((distrito, index) => (
                    <option key={index} value={distrito}>{distrito}</option>
                  ))}
                </select>

                <select
                  name="area"
                  value={filtros.area}
                  onChange={handleChangeFiltros}
                  className={styles.select}
                >
                  <option value="">Area</option>
                  {area.map((are) => (
                    <option key={are.id} value={are.id}>
                      {are.name.toUpperCase()}
                    </option>
                  ))}
                </select>
                <select
                  name="caracteristicaCurricular"
                  value={filtros.caracteristicaCurricular}
                  onChange={handleChangeFiltros}
                  className={styles.select}
                >
                  <option value="">Característica Curricular</option>
                  {caracteristicasDirectivo.map((are) => (
                    <option key={are.id} value={are.name}>
                      {are.name.toUpperCase()}
                    </option>
                  ))}
                </select>
                <select
                  name="genero"
                  value={filtros.genero}
                  onChange={handleChangeFiltros}
                  className={styles.select}
                >
                  <option value="">Género</option>
                  {genero.map((gen) => (
                    <option key={gen.id} value={gen.id}>
                      {gen.name.toUpperCase()}
                    </option>
                  ))}
                </select>
                <button className={styles.filterButton} onClick={handleFiltrar}>Filtrar</button>
              </div>
            </div>
            <div className={styles.tableContainer}>
              <div className={styles.tableSection}>

                <div>
                  {
                    dataEstadisticas?.map((dat, index) => {
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
                              {Object.entries(dat)
                                .filter(([key]) => key !== 'id' && key !== 'total')
                                .map(([key, value]) => (
                                  <p key={key}>
                                    {key}: {value} | {dat.total === 0 ? 0 : ((100 * Number(value)) / Number(dat.total)).toFixed(0)}%
                                  </p>
                                ))}
                            </div>
                            {/* <div className={styles.answerContainer}>
                              respuesta:<span className={styles.answerText}>{preguntasRespuestas[Number(index)]?.respuesta}</span>
                            </div> */}
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
Reportes.Auth = PrivateRouteEspecialista