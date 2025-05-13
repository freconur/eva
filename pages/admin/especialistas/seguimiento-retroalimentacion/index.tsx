import PrivateRouteDirectores from '@/components/layouts/PrivateRoutesDirectores'
import Image from 'next/image'
import React, { useEffect, useState } from 'react'
import header from '@/assets/evaluacion-docente.jpg'
import CrearEvaluacionDocente from '@/modals/crearEvaluacionDocente'
import UseEvaluacionDocentes from '@/features/hooks/UseEvaluacionDocentes'
import { useGlobalContext } from '@/features/context/GlolbalContext'
import { MdDeleteForever, MdEditSquare } from 'react-icons/md'
import DeleteEvaluacionDocente from '@/modals/DeleteEvaluacionDocente'
import Link from 'next/link'
import { RiLoader4Line } from 'react-icons/ri'
import styles from '@/styles/evaluacionesDocentes.module.css'
import PrivateRouteAdmins from '@/components/layouts/PrivateRoutes'

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

      <div className={styles.header}>
        <div className={styles.headerOverlay}></div>

        <Image
          className={styles.headerImage}
          src={header}
          alt="imagen de cabecera"
          priority
        />

        <div className={styles.headerContent}>
          <h1 className={styles.headerTitle}>
            Monitoreo a la mediación didáctica del docente
          </h1>

          {/*  <button 
            onClick={handleShowModalCrearEvaluacion} 
            className={styles.headerButton}
          >
            Crear Evaluación
          </button> */}
        </div>
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
                <tr>
                  <th>#</th>
                  <th>Nombre de evaluación</th>
                  <th>Categoría</th>
                  <th></th>
                  <th></th>
                </tr>
              </thead>
              <tbody className={styles.tableBody}>
                {
                  evaluacionDesempeñoDocente?.map((evaluacion, index) => {
                    return (
                      <tr key={index} className={styles.tableRow}>
                        <td className={styles.tableCell}>
                          <Link
                            href={`/directores/evaluaciones-docentes/evaluacion/${evaluacion.id}`}
                            className={styles.tableLink}
                          >
                            {index + 1}
                          </Link>
                        </td>
                        <td className={styles.tableCell}>
                          <Link
                            href={`/directores/evaluaciones-docentes/evaluacion/${evaluacion.id}`}
                            className={styles.tableLink}
                          >
                            {evaluacion.name?.toUpperCase()}
                          </Link>
                        </td>
                        <td className={styles.tableCell}>
                          <Link
                            href={`/directores/evaluaciones-docentes/evaluacion/${evaluacion.id}`}
                            className={styles.tableLink}
                          >
                            {evaluacion.categoria}
                          </Link>
                        </td>
                        {/*  <td className={styles.tableCell}>
                          <MdEditSquare 
                            onClick={() => { setNameEva(`${evaluacion.name}`); handleShowInputUpdate(); setIdEva(`${evaluacion.id}`) }} 
                            className={`${styles.actionIcon} ${styles.editIcon}`}
                          />
                        </td>
                        <td className={styles.tableCell}>
                          <MdDeleteForever 
                            onClick={() => { handleShowModalDelete(); setIdEva(`${evaluacion.id}`) }} 
                            className={`${styles.actionIcon} ${styles.deleteIcon}`}
                          />
                        </td> */}
                      </tr>
                    )
                  })
                }
              </tbody>
            </table>
          </div>
      }
    </div>
  )
}

export default EvaluacionesDesempeñoDocentes
EvaluacionesDesempeñoDocentes.Auth = PrivateRouteAdmins