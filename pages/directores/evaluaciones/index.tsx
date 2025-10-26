import PrivateRouteDirectores from '@/components/layouts/PrivateRoutesDirectores'
import { useGlobalContext } from '@/features/context/GlolbalContext'
import { useAgregarEvaluaciones } from '@/features/hooks/useAgregarEvaluaciones'
import Link from 'next/link'
import styles from './evaluaciones.module.css'
import React, { useEffect, useMemo } from 'react'
import { RiLoader4Line } from 'react-icons/ri'
import { MdDeleteForever, MdAssessment, MdSchool, MdTrendingUp } from 'react-icons/md'
import EvaluacionesDirector from '@/components/evaluaciones-director'

const Evaluaciones = () => {
  const { getEvaluaciones } = useAgregarEvaluaciones()
  const { evaluaciones, currentUserData, loaderPages } = useGlobalContext()

  useEffect(() => {
    getEvaluaciones()
  }, [])

  // Calcular estadísticas de evaluaciones
  const evaluacionesFiltradas = useMemo(() => {
    return evaluaciones
      ?.filter(eva => eva.active === true)
      ?.filter(eva => {
        // Si el usuario no tiene nivelDeInstitucion o está vacío, mostrar todas las evaluaciones EXCEPTO las que tienen nivel 2
        if (!currentUserData?.nivelDeInstitucion || 
            (Array.isArray(currentUserData?.nivelDeInstitucion) && currentUserData.nivelDeInstitucion.length === 0)) {
          const nivelEva = Array.isArray(eva.nivel) ? eva.nivel[0] : eva.nivel;
          return nivelEva !== 2;
        }
        
        // Si el usuario tiene nivelDeInstitucion que incluye 2, solo mostrar evaluaciones nivel 2
        const nivelDeInstitucion = currentUserData?.nivelDeInstitucion;
        if (Array.isArray(nivelDeInstitucion) && nivelDeInstitucion.includes(2)) {
          const nivelEva = Array.isArray(eva.nivel) ? eva.nivel[0] : eva.nivel;
          return nivelEva === 2;
        }
        
        // Para otros casos, mostrar todas las evaluaciones
        return true;
      }) || []
  }, [evaluaciones, currentUserData])

  const stats = useMemo(() => {
    const total = evaluacionesFiltradas.length
    const activas = evaluacionesFiltradas.filter(eva => eva.active).length
    // Como no hay propiedad 'completed', asumimos que todas las activas están pendientes
    const completadas = 0
    
    return {
      total,
      activas,
      completadas,
      pendientes: activas - completadas
    }
  }, [evaluacionesFiltradas])

  return (
    <div className={styles.container}>
      {/* Header Profesional - Ocupa todo el ancho */}
      <div className={styles.header}>
        <div className={styles.headerContent}>
          <div className={styles.titleContainer}>
            <h1 className={styles.title}>
              <MdAssessment className={styles.titleIcon} />
              Evaluaciones
            </h1>
            <p className={styles.subtitle}>
              Gestiona y supervisa las evaluaciones de tu institución educativa
            </p>
          </div>
          
          {/* Estadísticas */}
          {/* <div className={styles.statsGrid}>
            <div className={styles.statCard}>
              <div className={styles.statIcon}>
                <MdSchool />
              </div>
              <div className={styles.statContent}>
                <span className={styles.statNumber}>{stats.total}</span>
                <span className={styles.statLabel}>Total</span>
              </div>
            </div>
            
            <div className={styles.statCard}>
              <div className={styles.statIcon}>
                <MdTrendingUp />
              </div>
              <div className={styles.statContent}>
                <span className={styles.statNumber}>{stats.activas}</span>
                <span className={styles.statLabel}>Activas</span>
              </div>
            </div>
            
            <div className={styles.statCard}>
              <div className={styles.statIcon}>
                <MdAssessment />
              </div>
              <div className={styles.statContent}>
                <span className={styles.statNumber}>{stats.completadas}</span>
                <span className={styles.statLabel}>Completadas</span>
              </div>
            </div>
            
            <div className={styles.statCard}>
              <div className={styles.statIcon}>
                <RiLoader4Line />
              </div>
              <div className={styles.statContent}>
                <span className={styles.statNumber}>{stats.pendientes}</span>
                <span className={styles.statLabel}>Pendientes</span>
              </div>
            </div>
          </div> */}
        </div>
      </div>

      {loaderPages ? (
        <div className={styles.loaderContainer}>
          <div className={styles.loaderWrapper}>
            <RiLoader4Line className={styles.loader} />
            <span className={styles.loaderText}>...cargando</span>
          </div>
        </div>
      ) : (
        <div className={styles.contentContainer}>

          {/* Tabla de Evaluaciones */}
          <div className={styles.tableContainer}>
            <div className={styles.tableHeader}>
              <h2 className={styles.tableTitle}>Lista de Evaluaciones</h2>
              <span className={styles.tableCount}>
                {evaluacionesFiltradas.length} evaluación{evaluacionesFiltradas.length !== 1 ? 'es' : ''}
              </span>
            </div>
            
            <div className={styles.tableWrapper}>
              <table className={styles.table}>
                <thead>
                  <tr className={styles.tableHeaderRow}>
                    <th className={styles.tableHeaderCell}>#</th>
                    <th className={styles.tableHeaderCell}>Nombre de Evaluación</th>
                  </tr>
                </thead>
                <tbody className={styles.tableBody}>
                  {evaluacionesFiltradas.length > 0 ? (
                    evaluacionesFiltradas.map((eva, index) => (
                      <tr key={eva.id} className={styles.tableRow} onClick={() => window.location.href = `/directores/evaluaciones/evaluacion/${eva.id}`}>
                        <td className={styles.tableCell}>
                          <span className={styles.rowNumber}>{index + 1}</span>
                        </td>
                        <td className={styles.tableCell}>
                          <div className={styles.evaluationInfo}>
                            <span className={styles.evaluationName}>{eva.nombre}</span>
                            <span className={styles.evaluationId}>ID: {eva.id}</span>
                          </div>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr className={styles.emptyRow}>
                      <td colSpan={2} className={styles.emptyCell}>
                        <div className={styles.emptyState}>
                          <MdAssessment className={styles.emptyIcon} />
                          <p className={styles.emptyText}>No hay evaluaciones disponibles</p>
                          <p className={styles.emptySubtext}>
                            Las evaluaciones aparecerán aquí cuando estén disponibles
                          </p>
                        </div>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default Evaluaciones
Evaluaciones.Auth = PrivateRouteDirectores