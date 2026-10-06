import { useGlobalContext } from '@/features/context/GlolbalContext'
import { useAgregarEvaluaciones } from '@/features/hooks/useAgregarEvaluaciones'
import { categoriaTransform } from '@/fuctions/categorias'
import { convertGrade } from '@/fuctions/regiones'
import Link from 'next/link'
import { useRouter } from 'next/router'
import React, { useEffect, useMemo } from 'react'
import { PiFilesFill } from 'react-icons/pi'
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
  
  // Algoritmo para ordenar evaluaciones: activas primero, luego alfabéticamente
  const evaluacionesOrdenadas = useMemo(() => {
    if (!evaluacionesGradoYCategoria) return []
    
    return [...evaluacionesGradoYCategoria]
      .sort((a, b) => {
        // Mostrar activas primero
        if (a.active && !b.active) return -1;
        if (!a.active && b.active) return 1;

        // Normalización para ordenamiento alfabético
        const nombreA = a.nombre?.toLowerCase().trim() || ''
        const nombreB = b.nombre?.toLowerCase().trim() || ''
        
        return nombreA.localeCompare(nombreB, 'es', { 
          numeric: true,
          sensitivity: 'base'
        })
      })
  }, [evaluacionesGradoYCategoria])
  
  // Renderizar loader si loaderPages es true
  if (loaderPages) {
    return (
      <div className={styles.container}>
        <div className={styles.header}>
          <h1 className={styles.title}>{convertGrade(`${route.query.grado}`)}: {categoriaTransform(Number(route.query.categoria), categorias)}</h1>
        </div>
        <div className={styles.loaderContainer}>
          <div className={styles.loader}></div>
          <p className={styles.loaderText}>Cargando evaluaciones...</p>
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
        <div className={styles.cardsGrid}>
          {evaluacionesOrdenadas.map((eva, index) => (
            <div key={`${eva.id}-${index}`} className={`${styles.card} ${!eva.active ? styles.cardInactive : ''}`}>
              <Link href={`pruebas/prueba?idExamen=${eva.id}`} className={styles.cardLink}>
                <div className={styles.cardHeader}>
                  <div className={styles.iconContainer}>
                    <PiFilesFill className={styles.icon} />
                  </div>
                  <div className={`${styles.cardBadge} ${eva.active ? styles.badgeActive : styles.badgeInactive}`}>
                    <span className={styles.badgeText}>{eva.active ? 'Activa' : 'Finalizada'}</span>
                  </div>
                </div>
                <div className={styles.cardBody}>
                  <h3 className={styles.cardTitle}>{eva.nombre}</h3>
                  <p className={styles.cardStatusText}>
                    {eva.active ? 'Disponible para evaluar estudiantes' : 'Evaluación cerrada • Consulta de reportes'}
                  </p>
                </div>
                <div className={styles.cardFooter}>
                  <span className={eva.active ? styles.startButton : styles.reportButtonCard}>
                    {eva.active ? 'Comenzar →' : 'Ver Reporte →'}
                  </span>
                </div>
              </Link>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

export default Pruebas