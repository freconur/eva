import { useGlobalContext } from '@/features/context/GlolbalContext'
import { useAgregarEvaluaciones } from '@/features/hooks/useAgregarEvaluaciones'
import { categoriaTransform } from '@/fuctions/categorias'
import { convertGrade } from '@/fuctions/regiones'
import Link from 'next/link'
import { useRouter } from 'next/router'
import React, { useEffect } from 'react'
import { PiFilesFill } from 'react-icons/pi'
import styles from './pruebas.module.css'

const Pruebas = () => {
  const { evaluacionesGradoYCategoria } = useGlobalContext()
  const { getEvaluacionesGradoYCategoria } = useAgregarEvaluaciones()
  const route = useRouter()
  useEffect(() => {
    getEvaluacionesGradoYCategoria(Number(route.query.grado), Number(route.query.categoria))
  }, [route.query.grado, route.query.categoria])
  console.log('evaluacionesGradoYCategoria', evaluacionesGradoYCategoria)
  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h1 className={styles.title}>{convertGrade(`${route.query.grado}`)}: {categoriaTransform(Number(route.query.categoria))}</h1>
      </div>
      <div className={styles.content}>
        <ul className={styles.list}>
          {
            evaluacionesGradoYCategoria?.map((eva, index) => {
              if(eva.active){
              return (
                <li key={index} className={styles.listItem}>
                  <Link href={`pruebas/prueba?idExamen=${eva.id}`} className={styles.link}>
                    <div className={styles.iconContainer}>
                      <PiFilesFill className={styles.icon} />
                    </div>
                    <p className={styles.name}>{eva.nombre}</p>
                  </Link>
                </li>
              )
              }
            })
          }
        </ul>
      </div>
    </div>
  )
}

export default Pruebas