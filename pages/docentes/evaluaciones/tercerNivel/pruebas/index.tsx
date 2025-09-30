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
  const { evaluacionesGradoYCategoria , loaderPages} = useGlobalContext()
  const { getEvaluacionesGradoYCategoria } = useAgregarEvaluaciones()
  const route = useRouter()
  
  useEffect(() => {
    getEvaluacionesGradoYCategoria(Number(route.query.grado), Number(route.query.categoria))
  }, [route.query.grado, route.query.categoria])
  
  // Algoritmo super eficiente para ordenar evaluaciones alfabéticamente
  const evaluacionesOrdenadas = useMemo(() => {
    if (!evaluacionesGradoYCategoria) return []
    
    // Filtro y ordenamiento en una sola pasada para máxima eficiencia
    return evaluacionesGradoYCategoria
      .filter(eva => eva.active) // Filtrar solo activas
      .sort((a, b) => {
        // Normalización para ordenamiento insensible a mayúsculas/minúsculas
        const nombreA = a.nombre?.toLowerCase().trim() || ''
        const nombreB = b.nombre?.toLowerCase().trim() || ''
        
        // Ordenamiento alfabético usando localeCompare para caracteres especiales
        return nombreA.localeCompare(nombreB, 'es', { 
          numeric: true, // Ordenamiento numérico natural (ej: "Evaluación 2" antes que "Evaluación 10")
          sensitivity: 'base' // Ignorar acentos y mayúsculas
        })
      })
  }, [evaluacionesGradoYCategoria])
  
  console.log('evaluacionesGradoYCategoria', evaluacionesGradoYCategoria)
  console.log('evaluacionesOrdenadas', evaluacionesOrdenadas)
  
  // Renderizar loader si loaderPages es true
  if (loaderPages) {
    return (
      <div className={styles.container}>
        <div className={styles.header}>
          <h1 className={styles.title}>{convertGrade(`${route.query.grado}`)}: {categoriaTransform(Number(route.query.categoria))}</h1>
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
        <h1 className={styles.title}>{convertGrade(`${route.query.grado}`)}: {categoriaTransform(Number(route.query.categoria))}</h1>
      </div>
      <div className={styles.content}>
        <ul className={styles.list}>
          {evaluacionesOrdenadas.map((eva, index) => (
            <li key={`${eva.id}-${index}`} className={styles.listItem}>
              <Link href={`pruebas/prueba?idExamen=${eva.id}`} className={styles.link}>
                <div className={styles.iconContainer}>
                  <PiFilesFill className={styles.icon} />
                </div>
                <p className={styles.name}>{eva.nombre}</p>
              </Link>
            </li>
          ))}
        </ul>
      </div>
    </div>
  )
}

export default Pruebas