import PrivateRouteAdmins from '@/components/layouts/PrivateRoutes'
import PrivateRouteAdmin from '@/components/layouts/PrivateRoutesAdmin'
import { useGlobalContext } from '@/features/context/GlolbalContext'
import { useAgregarEvaluaciones } from '@/features/hooks/useAgregarEvaluaciones'
// import { Evaluaciones } from '@/features/types/types'
import DeleteEvaluacion from '@/modals/deleteEvaluacion'
import UpdateEvaluacion from '@/modals/updateEvaluacion'
import Image from 'next/image'
import Link from 'next/link'
import React, { useEffect, useState } from 'react'
import { MdDeleteForever, MdEditSquare, MdVisibility, MdVisibilityOff } from 'react-icons/md'
import { RiLoader4Line } from 'react-icons/ri'
import header from '@/assets/evaluacion-docente.jpg'
import styles from './evaluaciones.module.css'

const Evaluaciones = () => {
  const { getEvaluaciones, getEvaluacion, updateEvaluacion } = useAgregarEvaluaciones()
  const { evaluaciones, currentUserData, loaderPages, evaluacion } = useGlobalContext()
  const [showDelete, setShowDelete] = useState<boolean>(false)
  const [inputUpdate, setInputUpdate] = useState<boolean>(false)
  const [idEva, setIdEva] = useState<string>("")
  const [nameEva, setNameEva] = useState<string>("")
  const handleShowInputUpdate = () => { setInputUpdate(!inputUpdate) }
  const handleShowModalDelete = () => { setShowDelete(!showDelete) }
  const [dataEvaluacion, setDataEvaluacion] = useState(evaluacion)

  const toggleActiveStatus = async (eva: any) => {
    const updatedEva = { ...eva, active: !eva.active }
    await updateEvaluacion(updatedEva, eva.id)
  }
  
  useEffect(() => {
    getEvaluaciones()
  }, [currentUserData.dni])

  return (
    <>
      {showDelete && <DeleteEvaluacion handleShowModalDelete={handleShowModalDelete} idEva={idEva} />}
      {inputUpdate && nameEva.length > 0 && <UpdateEvaluacion evaluacion={evaluacion} nameEva={nameEva} handleShowInputUpdate={handleShowInputUpdate} idEva={idEva} />}
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
          <h1 className={styles.headerTitle}>Seguimiento y retroalimentacion al desempeño del directivo</h1>
        </div>

        {loaderPages ? (
          <div className={styles.loader}>
            <div className={styles.loaderContent}>
              <div className={styles.loaderIcon} />
              <span className={styles.loaderText}>Cargando</span>
            </div>
          </div>
        ) : (
          <div className={styles.content}>
            <div className={styles.tableContainer}>
              {/* <h1 className={styles.tableTitle}>evaluaciones</h1> */}
              <table className={styles.table}>
                <thead className={styles.tableHeader}>
                  <tr className={styles.tableHeaderRow}>
                    <th className={styles.tableHeaderCell}>#</th>
                    <th className={styles.tableHeaderCell}>nombre de evaluación</th>
                    <th className={styles.tableHeaderCell}>estado</th>
                    <th className={styles.tableHeaderCell}>acciones</th>
                  </tr>
                </thead>
                <tbody className={styles.tableBody}>
                  {evaluaciones.length > 0 ? (
                    evaluaciones?.map((eva, index) => (
                      <tr key={index} className={styles.tableRow}>
                        <td className={styles.tableCell}>
                          <Link href={`/admin/evaluaciones/evaluacion/${eva.id}`}>
                            {index + 1}
                          </Link>
                        </td>
                        <td className={styles.tableCell}>
                          <Link href={`/admin/evaluaciones/evaluacion/${eva.id}`}>
                            {eva.nombre}
                          </Link>
                        </td>
                        <td>
                          {eva.active ? (
                            <MdVisibility 
                              onClick={() => toggleActiveStatus(eva)} 
                              className={`${styles.actionIcon} ${styles.activeIcon}`} 
                              title="Evaluación activa - Click para desactivar"
                            />
                          ) : (
                            <MdVisibilityOff 
                              onClick={() => toggleActiveStatus(eva)} 
                              className={`${styles.actionIcon} ${styles.inactiveIcon}`} 
                              title="Evaluación inactiva - Click para activar"
                            />
                          )}
                        </td>
                        <td>
                          <div className={styles.actionsContainer}>
                            <MdEditSquare 
                              onClick={() => { 
                                setNameEva(`${eva.nombre}`); 
                                handleShowInputUpdate(); 
                                setIdEva(`${eva.id}`) 
                              }} 
                              className={`${styles.actionIcon} ${styles.editIcon}`} 
                            />
                            <MdDeleteForever 
                              onClick={() => { 
                                handleShowModalDelete(); 
                                setIdEva(`${eva.id}`) 
                              }} 
                              className={`${styles.actionIcon} ${styles.deleteIcon}`} 
                            />
                          </div>
                        </td>
                      </tr>
                    ))
                  ) : null}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </>
  )
}

export default Evaluaciones
Evaluaciones.Auth = PrivateRouteAdmins