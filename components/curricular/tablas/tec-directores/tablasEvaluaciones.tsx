import { EvaluacionCurricular } from '@/features/types/types'
import React from 'react'
import Link from 'next/link'
import styles from './tablasEvaluaciones.module.css'
import { convertRolToPath } from '@/fuctions/regiones'
import { useGlobalContext } from '@/features/context/GlolbalContext'

interface TablasEvaluacionesProps {
  evaluacionCurricular: EvaluacionCurricular[],
  
}

const TablasEvaluacionesDirectores = ({ evaluacionCurricular}: TablasEvaluacionesProps) => {
  return (
    <div className={styles.tableSection}>
      <h2 className={styles.sectionTitle}>
        <span className={styles.sectionTitleIndicator}></span>
        Unidades didácticas
      </h2>
      <table className={styles.table}>
        <thead className={styles.tableHeader}>
          <tr>
            <th>#</th>
            <th>Nombre de evaluación</th>
            <th>Acciones</th>
            <th></th>
          </tr>
        </thead>
        <tbody className={styles.tableBody}>
          {
            evaluacionCurricular?.map((evaluacion, index) => {
              return (
                <tr key={index} className={styles.tableRow}>
                  <td className={styles.tableCell}>
                    <Link href="" className={styles.tableLink}>
                      {index + 1}
                    </Link>
                  </td>
                  <td className={styles.tableCell}>
                    <Link href="" className={styles.tableLink}>
                      {evaluacion.name?.toUpperCase()}
                    </Link>
                  </td>
                  {/* <td>
                    <Link href={`/${convertRolToPath(rol)}/cobertura-curricular/reporte?idCurricular=${evaluacion.id}`} className={styles.tableLink}>reporte</Link>
                  </td> */}
                  <td>
                    <Link href={`/especialistas/cobertura-curricular/reporte?idCurricular=${evaluacion.id}`} className={styles.tableLink}>reporte</Link>
                  </td>
                  {/*  <td className={styles.tableCell}>
                              <div className={styles.tableActions}>
                                <MdEditSquare 
                                  onClick={() => { setNameEva(`${evaluacion.name}`); handleShowInputUpdate(); setIdEva(`${evaluacion.id}`) }} 
                                  className={`${styles.actionIcon} ${styles.editIcon}`}
                                />
                                <MdDeleteForever 
                                  onClick={() => { handleShowModalDelete(); setIdEva(`${evaluacion.id}`) }} 
                                  className={`${styles.actionIcon} ${styles.deleteIcon}`}
                                />
                              </div>
                            </td> */}
                </tr>
              )
            })
          }
        </tbody>
      </table>
    </div>
  )
}

export default TablasEvaluacionesDirectores