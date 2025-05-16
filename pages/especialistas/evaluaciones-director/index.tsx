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
import UseEvaluacionDirectores from '@/features/hooks/UseEvaluacionDirectores'
import DeleteEvaluacionDirector from '@/modals/DeleteEvaluacionDirector'
import CrearEvaluacionDirector from '@/modals/crearEvaluacionDirector'
import PrivateRouteEspecialista from '@/components/layouts/PrivateRoutesEspecialista'
import UpdateEvaluacionDesempeñoDirectivo from '@/modals/updateEvaluacionDesempeñoDirectivo'
import styles from './evaluaciones-director.module.css'

const EvaluacionesDesempeñoDirectores = () => {
  const { getEvaluacionesDirectores } = UseEvaluacionDirectores()
  const { evaluacionDesempeñoDocente, getPreguntaRespuestaDocentes, loaderPages, currentUserData } = useGlobalContext()
  const [showModalCrearEvaluacion, setShowCrearEvaluacion] = useState<boolean>(false)
  const [idEva, setIdEva] = useState<string>("")
  const [nameEva, setNameEva] = useState<string>("")
  const [eva, setEva] = useState({})
  const [showDelete, setShowDelete] = useState<boolean>(false)
  const [inputUpdate, setInputUpdate] = useState<boolean>(false)
  const handleShowInputUpdate = () => { setInputUpdate(!inputUpdate) }
  const handleShowModalDelete = () => { setShowDelete(!showDelete) }
  const handleShowModalCrearEvaluacion = () => {
    setShowCrearEvaluacion(!showModalCrearEvaluacion)
  }

  useEffect(() => {
    getEvaluacionesDirectores()
  }, [])

  return (
    <div>
      {showDelete && <DeleteEvaluacionDirector handleShowModalDelete={handleShowModalDelete} idEva={idEva} />}
      {inputUpdate && <UpdateEvaluacionDesempeñoDirectivo evaluacion={eva} handleShowInputUpdate={handleShowInputUpdate} />}
      {showModalCrearEvaluacion && <CrearEvaluacionDirector handleShowModalCrearEvaluacion={handleShowModalCrearEvaluacion} />}

      <div className={styles.header}>
        <div className={styles.headerOverlay}></div>
        <Image
          className={styles.headerImage}
          src={header}
          alt="imagen de cabecera"
          priority
        />
        <h1 className={styles.headerTitle}>Seguimiento y retroalimentación al desempeño del directivo</h1>
        {
          currentUserData.perfil?.rol === 4 &&
          <button onClick={handleShowModalCrearEvaluacion} className={styles.createButton}>Crear Evaluación</button>
        }
      </div>

      {loaderPages ? (
        <div className={styles.loaderContainer}>
          <RiLoader4Line className={styles.loaderIcon} />
          <p className={styles.loaderText}>buscando resultados...</p>
        </div>
      ) : (
        <div className={styles.tableContainer}>
          <table className={styles.table}>
            <thead className={styles.tableHeader}>
              <tr className={styles.tableHeaderRow}>
                <th className={`${styles.tableHeaderCell} ${styles.tableHeaderCellNumber}`}>#</th>
                <th className={styles.tableHeaderCell}>nombre de evaluación</th>
                <th className={styles.tableHeaderCell}>categorias</th>
                <th className={styles.tableHeaderCell}></th>
                <th className={styles.tableHeaderCell}></th>
              </tr>
            </thead>
            <tbody className={styles.tableBody}>
              {evaluacionDesempeñoDocente?.map((evaluacion, index) => (
                <tr key={index} className={styles.tableRow}>
                  <td className={`${styles.tableCell} ${styles.tableCellNumber}`}>
                    <Link href={`/especialistas/evaluaciones-director/evaluacion/${evaluacion.id}`} className={styles.tableCellLink}>
                      {index + 1}
                    </Link>
                  </td>
                  <td className={styles.tableCell}>
                    <Link href={`/especialistas/evaluaciones-director/evaluacion/${evaluacion.id}`} className={styles.tableCellLink}>
                      {evaluacion.name}
                    </Link>
                  </td>
                  <td className={styles.tableCell}>
                    <Link href={`/especialistas/evaluaciones-director/evaluacion/${evaluacion.id}`} className={styles.tableCellLink}>
                      {evaluacion.categoria}
                    </Link>
                  </td>
                  {currentUserData.perfil?.rol === 4 && (
                    <>
                      <td className={styles.tableCell}>
                        <MdEditSquare
                          onClick={() => {
                            setNameEva(`${evaluacion.name}`);
                            handleShowInputUpdate();
                            setEva(evaluacion)
                          }}
                          className={styles.editIcon}
                        />
                      </td>
                      <td className={styles.tableCell}>
                        <MdDeleteForever
                          onClick={() => {
                            handleShowModalDelete();
                            setIdEva(`${evaluacion.id}`)
                          }}
                          className={styles.deleteIcon}
                        />
                      </td>
                    </>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}

export default EvaluacionesDesempeñoDirectores
EvaluacionesDesempeñoDirectores.Auth = PrivateRouteEspecialista