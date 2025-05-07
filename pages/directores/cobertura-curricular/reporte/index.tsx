import PrivateRouteDirectores from '@/components/layouts/PrivateRoutesDirectores'
import { useGlobalContext } from '@/features/context/GlolbalContext'
import useEvaluacionCurricular from '@/features/hooks/useEvaluacionCurricular'
import Image from 'next/image'
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
import { ReporteCurricularDirector, ReporteDataEstadisticasCD } from '@/features/types/types'
import styles from '@/styles/coberturaCurricular.module.css'
import { nivelCurricularPreguntas } from '@/fuctions/regiones'
import header from '../../../../assets/evaluacion-docente.jpg'
import {gradosDeColegio,ordernarAscDsc, sectionByGrade  } from '@/fuctions/regiones'
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

const ReporteCurricular = () => {
  const router = useRouter()
  const [nivel, setNivel] = useState("")
  const [ filter, setFilter ] = useState({
    grado: "",
    orden: "",
    seccion: ""
  })
  const { currentUserData, reporteCurricularDirector, reportePreguntaHabilidad, reporteCurricularDirectorData, curricularDirectorDataFilter } = useGlobalContext()
  const { idCurricular } = router.query
  const { reporteCD , reporteCurricularDirectorFilter} = useEvaluacionCurricular()

  const iterateData = (data: ReporteCurricularDirector) => {
    return {
      labels: ['n', 'cn', 'av', 'f', 's'],
      datasets: [
        {
          label: "estadisticas de evaluación",
          data: [data.n, data.cn, data.av, data.f, data.s],
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
        <span className='text-cyan-500 font-martianMono text-md'>{reportePreguntaHabilidad[Number(index) - 1]?.order}.</span>
        <span className='text-slate-500 font-montserrat text-md font-regular'>{reportePreguntaHabilidad[Number(index) - 1]?.habilidad}</span>
      </h3>
    )
  }


  const handleChangeNivel = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setNivel(e.target.value)
  }
  const handleChangeFilter = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setFilter({
      ...filter,
      [e.target.name]: e.target.value
    })
  }
  const handleFilter = () => {
    console.log('filter', filter)
    reporteCurricularDirectorFilter(reporteCurricularDirectorData, filter)
  }
  useEffect(() => {
    if (!nivel) return;
    reporteCD(String(idCurricular), String(currentUserData.dni), String(nivel));
  }, [nivel]);
  console.log('curricularDirectorDataFilter', curricularDirectorDataFilter)
  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <div className={styles.headerOverlay}></div>
        <Image
          src={header}
          alt="imagen de cabecera"
          priority
          className={styles.headerImage}
        />
        <div className={styles.headerContent}>
          <h1 className={styles.headerTitle}>Reporte Curricular</h1>
          <div className={styles.headerButtons}>
            <select 
              onChange={handleChangeNivel} 
              className={styles.select}
              value={nivel}
            >
              <option value="">Seleccione un nivel</option>
              {nivelCurricularPreguntas.map((nivel, index) => (
                <option key={index} value={nivel.id}>{nivel.description}</option>
              ))}
            </select>
          </div>
        </div>
      </div>
      <div className={styles.filterContainer}>
        <select 
          onChange={handleChangeFilter}
          className={styles.filterSelect}
          name='grado'
        >
          <option value="">Seleccione un grado</option>
          {gradosDeColegio.map((grado) => (
            <option key={grado.id} value={grado.id}>
              {grado.name}
            </option>
          ))}
        </select>

        <select 
          onChange={handleChangeFilter}
          className={styles.filterSelect}
          name='orden'
        >
          <option value="">Seleccione orden</option>
          {ordernarAscDsc.map((orden) => (
            <option key={orden.id} value={orden.id}>
              {orden.name}
            </option>
          ))}
        </select>

        <select 
          onChange={handleChangeFilter}
          className={styles.filterSelect}
          name='seccion'
        >
          <option value="">Seleccione una sección</option>
          {sectionByGrade.map((seccion) => (
            <option key={seccion.id} value={seccion.id}>
              {seccion.name}
            </option>
          ))}
        </select>
        <button onClick={handleFilter} className={styles.filterButton}>
          Filtrar
        </button>
      </div>

      <div className={styles.tableContainer}>
        <table className={styles.table}>
          <thead className={styles.tableHeader}>
            <tr>
              <th className={styles.tableHeaderCell}>#</th>
              <th className={styles.tableHeaderCell}>Nombre y apellidos</th>
              {
                reportePreguntaHabilidad.map((pregunta) => (
                  <th key={pregunta.id} className={styles.tableHeaderCell}>{pregunta.order}</th>
                ))
              }
            </tr>
          </thead>
          <tbody>
            {
              curricularDirectorDataFilter.map((dat, index) => (
                <tr key={index} className={styles.tableRow}>
                  <td className={styles.tableCell}>{index + 1}</td>
                  <td className={`${styles.tableCell} ${styles.tableCellName}`}>{dat.nombres} {dat.apellidos}</td>
                  {
                    dat.preguntasAlternativas?.map((pregunta) => (
                      <td key={pregunta.id} className={styles.tableCell}>{pregunta.alternativas?.find(alternativa => alternativa.selected)?.acronimo}</td>
                    ))
                  }
                </tr>
              ))
            }
          </tbody>
        </table>
      </div>
      <div className={styles.tableContainer}>
        <div className={styles.containerGrafico}>
          {reporteCurricularDirector?.map((dat, index) => (
            <div key={index} className={styles.reporteCard}>
              {iterarPregunta(`${dat.id}`)}
              <div className={styles.chartContainer}>
                <Bar
                  options={options}
                  data={iterateData(dat as ReporteCurricularDirector)}
                  className={styles.chart}
                />
              </div>
              <div className={styles.statsContainer}>
                {[
                  { label: 'N', value: dat.n },
                  { label: 'CN', value: dat.cn },
                  { label: 'AV', value: dat.av },
                  { label: 'F', value: dat.f },
                  { label: 'S', value: dat.s }
                ].map(({ label, value }) => (
                  <div key={label} className={styles.statItem}>
                    <span className={styles.statLabel}>{label}:</span>
                    <span className={styles.statValue}>
                      {value} | {((100 * Number(value)) / Number(dat.total)).toFixed(0)}%
                    </span>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

export default ReporteCurricular
ReporteCurricular.Auth = PrivateRouteDirectores