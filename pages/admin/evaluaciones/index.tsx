import PrivateRouteAdmins from '@/components/layouts/PrivateRoutes'
import PrivateRouteAdmin from '@/components/layouts/PrivateRoutesAdmin'
import { useGlobalContext } from '@/features/context/GlolbalContext'
import { useAgregarEvaluaciones } from '@/features/hooks/useAgregarEvaluaciones'
// import { Evaluaciones } from '@/features/types/types'
import DeleteEvaluacion from '@/modals/deleteEvaluacion'
import UpdateEvaluacion from '@/modals/updateEvaluacion'
import GradosAcordeon from '@/components/grados-acordeon/GradosAcordeon'
import Image from 'next/image'
import Link from 'next/link'
import React, { useEffect, useState } from 'react'
import { MdDeleteForever, MdEditSquare, MdVisibility, MdVisibilityOff, MdViewList, MdViewModule } from 'react-icons/md'
import { RiLoader4Line } from 'react-icons/ri'
import header from '@/assets/evaluacion-docente.jpg'
import styles from './evaluaciones.module.css'
import { getMonthName } from '@/fuctions/dates'
import { getAllMonths } from '@/fuctions/dates'

const Evaluaciones = () => {
  const { getEvaluaciones, getEvaluacion, updateEvaluacion,getGrades } = useAgregarEvaluaciones()
  const { evaluaciones, currentUserData, loaderPages, evaluacion , grados} = useGlobalContext()
  const [showDelete, setShowDelete] = useState<boolean>(false)
  const [inputUpdate, setInputUpdate] = useState<boolean>(false)
  const [idEva, setIdEva] = useState<string>("")
  const [nameEva, setNameEva] = useState<string>("")
  const [editingMonth, setEditingMonth] = useState<boolean>(false)
  const [editingMonthId, setEditingMonthId] = useState<string>("")
  const [updatingMonth, setUpdatingMonth] = useState<boolean>(false)
  const [viewMode, setViewMode] = useState<'acordeon' | 'table'>('acordeon')
  const handleShowInputUpdate = () => { setInputUpdate(!inputUpdate) }
  const handleShowModalDelete = () => { setShowDelete(!showDelete) }
  const toggleViewMode = () => { 
    setViewMode(viewMode === 'acordeon' ? 'table' : 'acordeon') 
  }
  const [dataEvaluacion, setDataEvaluacion] = useState(evaluacion)

  const toggleActiveStatus = async (eva: any) => {
    // Si se quiere activar, validar que nivelYPuntaje exista y tenga datos
    if (!eva.active) {
      if (!eva.nivelYPuntaje || !Array.isArray(eva.nivelYPuntaje) || eva.nivelYPuntaje.length === 0) {
        alert('No se puede activar la evaluación. Debe configurar primero los niveles y puntajes.')
        return
      }
    }
    
    const updatedEva = { ...eva, active: !eva.active }
    await updateEvaluacion(updatedEva, eva.id)
  }

  const handleEditMonth = (eva: any) => {
    setEditingMonth(true)
    setEditingMonthId(eva.id)
    setDataEvaluacion(eva)
  }
  
  const handleCancelEditMonth = () => {
    setEditingMonth(false)
    setEditingMonthId("")
    setDataEvaluacion(evaluacion)
  }
  
  const handleSaveMonth = async (newMonth: string) => {
    if (editingMonthId) {
      setUpdatingMonth(true)
      const updatedEva = { ...dataEvaluacion, mesDelExamen: newMonth }
      await updateEvaluacion(updatedEva, editingMonthId)
      setEditingMonth(false)
      setEditingMonthId("")
      setUpdatingMonth(false)
    }
  }
  useEffect(() => {
    getGrades()
  },[])
  useEffect(() => {
    let unsubscribe: (() => void) | undefined;
    
    if (currentUserData.dni) {
      unsubscribe = getEvaluaciones();
    }
    
    // Cleanup function para desuscribirse cuando el componente se desmonte
    return () => {
      if (unsubscribe) {
        unsubscribe();
      }
    };
  }, [currentUserData.dni])


  console.log('evaluaciones', evaluaciones)
  console.log('grados', grados)
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
          <h1 className={styles.headerTitle}>Seguimiento y retroalimentacion al desempeño del estudiante</h1>
        </div>

        {/* Botón de cambio de vista */}
        <div className={styles.viewToggleContainer}>
          <button 
            onClick={toggleViewMode}
            className={styles.viewToggleButton}
            title={viewMode === 'acordeon' ? 'Cambiar a vista de tabla' : 'Cambiar a vista de acordeón'}
          >
            {viewMode === 'acordeon' ? (
              <>
                <MdViewList className={styles.viewToggleIcon} />
                <span>Vista de Tabla</span>
              </>
            ) : (
              <>
                <MdViewModule className={styles.viewToggleIcon} />
                <span>Vista de Acordeón</span>
              </>
            )}
          </button>
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
            {/* Vista de Acordeón */}
            {viewMode === 'acordeon' && grados && grados.length > 0 && (
              <div className={styles.acordeonViewContainer}>
                <GradosAcordeon 
                  grados={grados}
                  evaluaciones={evaluaciones}
                  onToggleActive={toggleActiveStatus}
                  onEditMonth={handleEditMonth}
                  onCancelEditMonth={handleCancelEditMonth}
                  onSaveMonth={handleSaveMonth}
                  onEdit={(evaluacion) => {
                    setNameEva(`${evaluacion.nombre}`)
                    handleShowInputUpdate()
                    setIdEva(`${evaluacion.id}`)
                  }}
                  onDelete={(evaluacion) => {
                    handleShowModalDelete()
                    setIdEva(`${evaluacion.id}`)
                  }}
                  editingMonth={editingMonth}
                  editingMonthId={editingMonthId}
                  updatingMonth={updatingMonth}
                  dataEvaluacion={dataEvaluacion}
                  setDataEvaluacion={setDataEvaluacion}
                  baseRoute="/admin/evaluaciones/evaluacion"
                />
              </div>
            )}
            
            {/* Vista de Tabla */}
            {viewMode === 'table' && (
              <div className={styles.tableViewContainer}>
                <div className={styles.tableContainer}>
              {/* <h1 className={styles.tableTitle}>evaluaciones</h1> */}
              <table className={styles.table}>
                <thead className={styles.tableHeader}>
                  <tr className={styles.tableHeaderRow}>
                    <th className={styles.tableHeaderCell}>#</th>
                    <th className={styles.tableHeaderCell}>nombre de evaluación</th>
                    <th className={styles.tableHeaderCell}>mes</th>
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
                            {eva.nombre?.toUpperCase() || ''}
                          </Link>
                        </td>
                        <td className={styles.tableCell}>
                          {editingMonth && editingMonthId === eva.id ? (
                            <div className={styles.monthEditContainer}>
                              <select
                                className={styles.monthSelect}
                                value={dataEvaluacion.mesDelExamen || "0"}
                                onChange={(e) => setDataEvaluacion({...dataEvaluacion, mesDelExamen: e.target.value})}
                              >
                                {getAllMonths.map((mes) => (
                                  <option key={mes.id} value={mes.id.toString()}>
                                    {mes.name}
                                  </option>
                                ))}
                              </select>
                              <div className={styles.monthEditActions}>
                                <button
                                  onClick={() => handleSaveMonth(dataEvaluacion.mesDelExamen || "0")}
                                  className={styles.saveMonthButton}
                                  title="Guardar mes"
                                >
                                  {updatingMonth ? <RiLoader4Line className={styles.loaderIcon} /> : "✓"}
                                </button>
                                <button
                                  onClick={handleCancelEditMonth}
                                  className={styles.cancelMonthButton}
                                  title="Cancelar"
                                >
                                  ✕
                                </button>
                              </div>
                            </div>
                          ) : (
                            <div className={styles.monthContainer}>
                              <span className={styles.monthText}>
                                {getMonthName(Number(eva.mesDelExamen))}
                              </span>
                              <button
                                onClick={() => handleEditMonth(eva)}
                                className={styles.editMonthButton}
                                title="Editar mes del examen"
                              >
                                <MdEditSquare className={styles.editMonthIcon} />
                              </button>
                            </div>
                          )}
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
        )}
      </div>
    </>
  )
}

export default Evaluaciones
Evaluaciones.Auth = PrivateRouteAdmins