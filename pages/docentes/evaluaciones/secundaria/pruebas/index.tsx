import { useGlobalContext } from '@/features/context/GlolbalContext'
import { useAgregarEvaluaciones } from '@/features/hooks/useAgregarEvaluaciones'
import { categoriaTransform } from '@/fuctions/categorias'
import { convertGrade } from '@/fuctions/regiones'
import Link from 'next/link'
import { useRouter } from 'next/router'
import React, { useEffect, useMemo } from 'react'
import { PiFilesFill } from 'react-icons/pi'
import { RiCalendarCheckLine } from 'react-icons/ri'
import styles from './pruebas.module.css'

const Pruebas = () => {
  const { evaluacionesGradoYCategoria, loaderPages, categorias } = useGlobalContext()
  const { getEvaluacionesGradoYCategoria, getCategories } = useAgregarEvaluaciones()
  const route = useRouter()
  
  useEffect(() => {
    getEvaluacionesGradoYCategoria(Number(route.query.grado), Number(route.query.categoria))
    getCategories()
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [route.query.grado, route.query.categoria])
  
  // Filtrar estrictamente solo evaluaciones activas para el docente
  const evaluacionesActivas = useMemo(() => {
    if (!Array.isArray(evaluacionesGradoYCategoria)) return []
    return evaluacionesGradoYCategoria.filter((eva) => eva.active === true)
  }, [evaluacionesGradoYCategoria])

  // Algoritmo para ordenar evaluaciones alfabéticamente
  const evaluacionesOrdenadas = useMemo(() => {
    return [...evaluacionesActivas].sort((a, b) => {
      const nombreA = a.nombre?.toLowerCase().trim() || ''
      const nombreB = b.nombre?.toLowerCase().trim() || ''
      return nombreA.localeCompare(nombreB, 'es', {
        numeric: true,
        sensitivity: 'base',
      })
    })
  }, [evaluacionesActivas])
  
  // Renderizar loader si loaderPages es true
  if (loaderPages) {
    return (
      <div className={styles.container}>
        <div className={styles.header}>
          <h1 className={styles.title}>{convertGrade(`${route.query.grado}`)}: {categoriaTransform(Number(route.query.categoria), categorias)}</h1>
        </div>
        <div className={styles.loaderContainer}>
          <div className={styles.loader}></div>
          <p className={styles.loaderText}>Cargando evaluaciones activas...</p>
        </div>
      </div>
    )
  }

  // Renderizar contenido cuando loaderPages es false
  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h1 className={styles.title}>{convertGrade(`${route.query.grado}`)}: {categoriaTransform(Number(route.query.categoria), categorias)}</h1>
      </div>
      <div className={styles.content}>
        {evaluacionesOrdenadas.length > 0 ? (
          <div className={styles.cardsGrid}>
            {evaluacionesOrdenadas.map((eva, index) => (
              <div key={`${eva.id}-${index}`} className={styles.card}>
                <Link href={`pruebas/prueba?idExamen=${eva.id}`} className={styles.cardLink}>
                  <div className={styles.cardHeader}>
                    <div className={styles.iconContainer}>
                      <PiFilesFill className={styles.icon} />
                    </div>
                    <div className={`${styles.cardBadge} ${styles.badgeActive}`}>
                      <span className={styles.badgeText}>Activa</span>
                    </div>
                  </div>
                  <div className={styles.cardBody}>
                    <h3 className={styles.cardTitle}>{eva.nombre}</h3>
                    <p className={styles.cardStatusText}>
                      Disponible para evaluar estudiantes
                    </p>
                  </div>
                  <div className={styles.cardFooter}>
                    <span className={styles.startButton}>
                      Comenzar →
                    </span>
                  </div>
                </Link>
              </div>
            ))}
          </div>
        ) : (
          <div className={styles.emptyState}>
            <RiCalendarCheckLine className={styles.emptyStateIcon} />
            <h3 className={styles.emptyStateTitle}>No hay evaluaciones activas</h3>
            <p className={styles.emptyStateText}>
              Actualmente no hay evaluaciones vigentes para calificar en este grado y área curricular.
            </p>
            <Link href="/docentes/evaluaciones" className={styles.resetBtn}>
              Ver evaluaciones anteriores y reportes en Acceso Rápido
            </Link>
          </div>
        )}
      </div>
    </div>
  )
}

export default Pruebas