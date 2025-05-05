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
  const { currentUserData, reporteCurricularDirector, reportePreguntaHabilidad } = useGlobalContext()
  const { idCurricular } = router.query
  const { reporteCD } = useEvaluacionCurricular()

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
        <span className='text-cyan-500 font-martianMono text-md'>{reportePreguntaHabilidad[Number(index) - 1]?.id}.</span>
        <span className='text-slate-500 font-montserrat text-md font-regular'>{reportePreguntaHabilidad[Number(index) - 1]?.habilidad}</span>
      </h3>
    )
  }
  const handleChangeNivel = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setNivel(e.target.value)
  }

  useEffect(() => {
    if (!idCurricular || !currentUserData?.dni) return;

    const fetchReporte = async () => {
      await reporteCD(String(idCurricular), String(currentUserData.dni), String(nivel));
    };

    fetchReporte();
  }, [idCurricular, currentUserData?.dni]);

  useEffect(() => {
    if (!nivel) return;
    reporteCD(String(idCurricular), String(currentUserData.dni), String(nivel));
  }, [nivel]);

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

      <div className={styles.tableContainer}>
        <div className={styles.containerGrafico}>
          {reporteCurricularDirector?.map((dat, index) => (
            <div key={index} className={styles.reporteCard}>
              {iterarPregunta(`${dat.id}`)}
              <div className={styles.chartContainer}>
                <Bar
                  options={options}
                  data={iterateData(dat.data ? dat.data : {})}
                  className={styles.chart}
                />
              </div>
              <div className={styles.statsContainer}>
                <div className={styles.statItem}>
                  <span className={styles.statLabel}>N:</span>
                  <span className={styles.statValue}>{dat.data?.n} | {((100 * Number(dat.data?.n)) / Number(dat.total)).toFixed(0)}%</span>
                </div>
                <div className={styles.statItem}>
                  <span className={styles.statLabel}>CN:</span>
                  <span className={styles.statValue}>{dat.data?.cn} | {((100 * Number(dat.data?.cn)) / Number(dat.total)).toFixed(0)}%</span>
                </div>
                <div className={styles.statItem}>
                  <span className={styles.statLabel}>AV:</span>
                  <span className={styles.statValue}>{dat.data?.av} | {((100 * Number(dat.data?.av)) / Number(dat.total)).toFixed(0)}%</span>
                </div>
                <div className={styles.statItem}>
                  <span className={styles.statLabel}>F:</span>
                  <span className={styles.statValue}>{dat.data?.f} | {((100 * Number(dat.data?.f)) / Number(dat.total)).toFixed(0)}%</span>
                </div>
                <div className={styles.statItem}>
                  <span className={styles.statLabel}>S:</span>
                  <span className={styles.statValue}>{dat.data?.s} | {((100 * Number(dat.data?.s)) / Number(dat.total)).toFixed(0)}%</span>
                </div>
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