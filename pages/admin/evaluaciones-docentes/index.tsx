import PrivateRouteDirectores from '@/components/layouts/PrivateRoutesDirectores'
import Image from 'next/image'
import React, { useEffect, useState } from 'react'
import header from '../../../assets/evaluacion-docente.jpg'
import CrearEvaluacionDocente from '@/modals/crearEvaluacionDocente'
import UseEvaluacionDocentes from '@/features/hooks/UseEvaluacionDocentes'
import { useGlobalContext } from '@/features/context/GlolbalContext'
import { MdDeleteForever, MdEditSquare } from 'react-icons/md'
import DeleteEvaluacionDocente from '@/modals/DeleteEvaluacionDocente'
import Link from 'next/link'
import { RiLoader4Line } from 'react-icons/ri'
import PrivateRouteAdmins from '@/components/layouts/PrivateRoutes'
import styles from './index.module.css'

const EvaluacionesDesempeñoDocentes = () => {
  const { getEvaluacionesDocentes } = UseEvaluacionDocentes()
  const { evaluacionDesempeñoDocente, getPreguntaRespuestaDocentes, loaderPages } = useGlobalContext()
  const [showModalCrearEvaluacion, setShowCrearEvaluacion] = useState<boolean>(false)
  const [idEva, setIdEva] = useState<string>("")
  const [nameEva, setNameEva] = useState<string>("")
  const [showDelete, setShowDelete] = useState<boolean>(false)
  const [inputUpdate, setInputUpdate] = useState<boolean>(false)
  const handleShowInputUpdate = () => { setInputUpdate(!inputUpdate) }
  const handleShowModalDelete = () => { setShowDelete(!showDelete) }
  const handleShowModalCrearEvaluacion = () => {
    setShowCrearEvaluacion(!showModalCrearEvaluacion)
  }

  useEffect(() => {
    getEvaluacionesDocentes()
  }, [])

  return (
    <div>
      {showDelete && <DeleteEvaluacionDocente handleShowModalDelete={handleShowModalDelete} idEva={idEva} />}
      {showModalCrearEvaluacion && <CrearEvaluacionDocente handleShowModalCrearEvaluacion={handleShowModalCrearEvaluacion} />}

      <div>
        <div className={styles.header}>
          <div className={styles.headerOverlay}></div>

          <Image
            className={styles.headerImage}
            src={header}
            alt="imagen de cabecera"
            objectFit='fill'
            priority
          />
          <h1 className={styles.headerTitle}>Evaluaciones de seguimiento de desempeño del docente</h1>
          <button onClick={handleShowModalCrearEvaluacion} className={styles.createButton}>Crear Evaluación</button>
        </div>

        {
          loaderPages ?
            <div className={styles.loaderContainer}>
              <RiLoader4Line className={styles.loaderIcon} />
              <p className={styles.loaderText}>buscando resultados...</p>
            </div>
            :

            <div className={styles.tableContainer}>
              <table className={styles.table}>
                <thead className={styles.tableHeader}>
                  <tr className={styles.tableHeaderRow}>
                    <th className={styles.tableHeaderCellNumber}>#</th>
                    <th className={styles.tableHeaderCell}>nombre de evaluación</th>
                    <th className={styles.tableHeaderCell}>categoria</th>
                    <th className={styles.tableHeaderCell}></th>
                    <th className={styles.tableHeaderCell}></th>
                  </tr>
                </thead>
                <tbody className={styles.tableBody}>
                  {
                    evaluacionDesempeñoDocente?.map((evaluacion, index) => {
                      return (
                        <tr key={index} className={styles.tableRow}>
                          <td className={`${styles.tableCell} ${styles.tableCellNumber}`}>
                            <Link href={`/admin/evaluaciones-docentes/evaluacion/${evaluacion.id}`} className={styles.tableCellLink}>
                              {index + 1}
                            </Link>
                          </td>
                          <td className={styles.tableCell}>
                            <Link href={`/admin/evaluaciones-docentes/evaluacion/${evaluacion.id}`} className={styles.tableCellLink}>
                              {evaluacion.name}
                            </Link>
                          </td>
                          <td className={styles.tableCell}>
                            <Link href={`/admin/evaluaciones-docentes/evaluacion/${evaluacion.id}`} className={styles.tableCellLink}>
                              {evaluacion.categoria}
                            </Link>
                          </td>
                          <td>
                            <MdEditSquare onClick={() => { setNameEva(`${evaluacion.name}`); handleShowInputUpdate(); setIdEva(`${evaluacion.id}`) }} className={styles.editIcon} />
                          </td>
                          <td>
                            <MdDeleteForever onClick={() => { handleShowModalDelete(); setIdEva(`${evaluacion.id}`) }} className={styles.deleteIcon} />
                          </td>
                        </tr>
                      )
                    })
                  }
                </tbody>
              </table>
            </div>
        }

      </div>
    </div>
  )
}

export default EvaluacionesDesempeñoDocentes
EvaluacionesDesempeñoDocentes.Auth = PrivateRouteAdmins