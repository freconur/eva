import PrivateRouteDirectores from '@/components/layouts/PrivateRoutesDirectores'
import { useGlobalContext } from '@/features/context/GlolbalContext'
import { useAgregarEvaluaciones } from '@/features/hooks/useAgregarEvaluaciones'
import Link from 'next/link'
import styles from './evaluaciones.module.css'
import React, { useEffect } from 'react'
import { RiLoader4Line } from 'react-icons/ri'
import { MdDeleteForever } from 'react-icons/md'
import EvaluacionesDirector from '@/components/evaluaciones-director'

const Evaluaciones = () => {
  const { getEvaluaciones } = useAgregarEvaluaciones()
  const { evaluaciones, currentUserData, loaderPages } = useGlobalContext()

  useEffect(() => {
    getEvaluaciones()
  }, [])

  console.log('evaluaciones', evaluaciones)
  return (
    <div className={styles.container}>
      {loaderPages ? (
        <div className={styles.loaderContainer}>
          <div className={styles.loaderWrapper}>
            <RiLoader4Line className={styles.loader} />
            <span className={styles.loaderText}>...cargando</span>
          </div>
        </div>
      ) : (
        <div className={styles.contentContainer}>
          <div>
            <h1 className={styles.title}>evaluaciones</h1>
            <table className={styles.table}>
              <thead className={styles.tableHeader}>
                <tr className={styles.tableHeaderRow}>
                  <th className={styles.tableHeaderCell}>#</th>
                  <th className={styles.tableHeaderCell}>nombre de evaluación</th>
                </tr>
              </thead>
              <tbody className={styles.tableBody}>
                {evaluaciones.length > 0 &&
                  evaluaciones?.map((eva, index) => (
                    <tr key={index} className={styles.tableRow}>
                      <td className={styles.tableCell}>
                        <Link href={`/directores/evaluaciones/evaluacion/${eva.id}`} className={styles.link}>
                          {index + 1}
                        </Link>
                      </td>
                      <td className={styles.tableCell}>
                        <Link href={`/directores/evaluaciones/evaluacion/${eva.id}`} className={styles.link}>
                          {eva.nombre}
                        </Link>
                      </td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  )
}

export default Evaluaciones
Evaluaciones.Auth = PrivateRouteDirectores