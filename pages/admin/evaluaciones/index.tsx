import PrivateRouteAdmins from '@/components/layouts/PrivateRoutes'
import PrivateRouteAdmin from '@/components/layouts/PrivateRoutesAdmin'
import { useGlobalContext } from '@/features/context/GlolbalContext'
import { useAgregarEvaluaciones } from '@/features/hooks/useAgregarEvaluaciones'
// import { Evaluaciones } from '@/features/types/types'
import DeleteEvaluacion from '@/modals/deleteEvaluacion'
import UpdateEvaluacion from '@/modals/updateEvaluacion'
import AlertModal from '@/modals/alertModal/AlertModal'
import GradosAcordeon from '@/components/grados-acordeon/GradosAcordeon'
import Image from 'next/image'
import Link from 'next/link'
import React, { useEffect, useState } from 'react'
import { MdDeleteForever, MdEditSquare, MdVisibility, MdVisibilityOff, MdViewList, MdViewModule, MdAddCircle } from 'react-icons/md'
import { RiLoader4Line } from 'react-icons/ri'
import header from '@/assets/evaluacion-docente.jpg'
import styles from './evaluaciones.module.css'
import { getMonthName } from '@/fuctions/dates'
import { getAllMonths } from '@/fuctions/dates'
import { createPortal } from 'react-dom'
import CreateEvaluacionModal from './CreateEvaluacionModal'

const Evaluaciones = () => {
  const { getEvaluaciones, getEvaluacion, updateEvaluacion, getGrades, totalPreguntas, validacionSiEvaluacionTienePreguntasYPuntuacion } = useAgregarEvaluaciones()
  const { evaluaciones, currentUserData, loaderPages, evaluacion, grados } = useGlobalContext()
  const [showDelete, setShowDelete] = useState<boolean>(false)
  const [inputUpdate, setInputUpdate] = useState<boolean>(false)
  const [idEva, setIdEva] = useState<string>("")
  const [nameEva, setNameEva] = useState<string>("")
  const [editingMonth, setEditingMonth] = useState<boolean>(false)
  const [editingMonthId, setEditingMonthId] = useState<string>("")
  const [updatingMonth, setUpdatingMonth] = useState<boolean>(false)
  const [viewMode, setViewMode] = useState<'acordeon' | 'table'>('acordeon')
  const [showAlert, setShowAlert] = useState<boolean>(false)
  const [alertMessage, setAlertMessage] = useState<string>("")
  const [showSuccessAlert, setShowSuccessAlert] = useState<boolean>(false)
  const [successData, setSuccessData] = useState<any>(null)
  const [showCreateModal, setShowCreateModal] = useState<boolean>(false)
  const [selectedYear, setSelectedYear] = useState<string>(new Date().getFullYear().toString())

  const years = React.useMemo(() => {
    const startYear = 2025
    const currentYear = new Date().getFullYear()
    const yearsArr = []
    for (let y = startYear; y <= currentYear; y++) {
      yearsArr.push(y.toString())
    }
    return yearsArr
  }, [])

  const handleShowCreateModal = () => { setShowCreateModal(!showCreateModal) }
  const handleShowInputUpdate = () => { setInputUpdate(!inputUpdate) }
  const handleShowModalDelete = () => { setShowDelete(!showDelete) }
  const handleShowAlert = () => { setShowAlert(!showAlert) }
  const handleShowSuccessAlert = () => { setShowSuccessAlert(!showSuccessAlert) }

  const handleActivateEvaluacion = async () => {
    if (successData) {
      const updatedEva = { ...successData.evaluacion, active: true }
      await updateEvaluacion(updatedEva, successData.evaluacion.id)
      setShowSuccessAlert(false)
      setSuccessData(null)
    }
  }
  const toggleViewMode = () => {
    setViewMode(viewMode === 'acordeon' ? 'table' : 'acordeon')
  }
  const [dataEvaluacion, setDataEvaluacion] = useState(evaluacion)

  const toggleActiveStatus = async (eva: any) => {
    // Si se quiere activar, validar que nivelYPuntaje exista y tenga datos
    if (!eva.active) {
      // Solo aplicar la validación de nivelYPuntaje si tipoDeEvaluacion es "1"
      if (eva.tipoDeEvaluacion === "1") {
        if (!eva.nivelYPuntaje || !Array.isArray(eva.nivelYPuntaje) || eva.nivelYPuntaje.length === 0) {
          setAlertMessage('No se puede activar la evaluación. Debe configurar primero los niveles y puntajes.')
          setShowAlert(true)
          return
        }

        // Validar que existan preguntas y que todas tengan puntaje
        const { tienePuntajeValido, totalPreguntas: total } = await validacionSiEvaluacionTienePreguntasYPuntuacion(eva);
        if (!tienePuntajeValido) {
          setAlertMessage('No se puede activar la evaluación. Debe configurar preguntas y asignar puntaje a todas las preguntas.')
          setShowAlert(true)
          return
        }

        // Si pasa las validaciones, mostrar los datos y activar
        setSuccessData({
          nivelYPuntaje: eva.nivelYPuntaje,
          totalPreguntas: total,
          evaluacion: eva
        })
        setShowSuccessAlert(true)
        return
      }
    }

    const updatedEva = { ...eva, active: !eva.active }
    await updateEvaluacion(updatedEva, eva.id)
  }

  const handleEditMonth = (eva: any) => {
    setEditingMonth(true)
    setEditingMonthId(eva.id)
    setDataEvaluacion({
      ...eva,
      añoDelExamen: eva.añoDelExamen || new Date().getFullYear().toString()
    })
  }

  const handleCancelEditMonth = () => {
    setEditingMonth(false)
    setEditingMonthId("")
    setDataEvaluacion(evaluacion)
  }

  const handleSaveMonth = async (newMonth: string, newYear: string) => {
    if (editingMonthId) {
      setUpdatingMonth(true)
      const updatedEva = {
        ...dataEvaluacion,
        mesDelExamen: newMonth,
        añoDelExamen: newYear
      }
      await updateEvaluacion(updatedEva, editingMonthId)
      setEditingMonth(false)
      setEditingMonthId("")
      setUpdatingMonth(false)
    }
  }
  useEffect(() => {
    getGrades()
  }, [])
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

  const currentYear = new Date().getFullYear().toString()
  const filteredEvaluaciones = evaluaciones.filter(eva => {
    // Si no tiene añoDelExamen, asumimos que es del año actual para no ocultar datos existentes
    return (eva.añoDelExamen || currentYear) === selectedYear
  })

  return (
    <>
      {showDelete && <DeleteEvaluacion handleShowModalDelete={handleShowModalDelete} idEva={idEva} />}
      {inputUpdate && nameEva.length > 0 && <UpdateEvaluacion evaluacion={evaluacion} nameEva={nameEva} handleShowInputUpdate={handleShowInputUpdate} idEva={idEva} />}
      {showAlert && <AlertModal message={alertMessage} handleClose={handleShowAlert} />}
      {showCreateModal && (
        <CreateEvaluacionModal
          showModal={showCreateModal}
          handleShowModal={handleShowCreateModal}
        />
      )}
      {showSuccessAlert && successData && typeof window !== 'undefined' && createPortal(
        <div className={styles.successModal} onClick={handleShowSuccessAlert}>
          <div className={styles.successModalContent} onClick={(e) => e.stopPropagation()}>
            <div className={styles.successModalHeader}>
              <h3 className={styles.successModalTitle}>Confirmar Activación</h3>
              <div className={styles.successModalClose} onClick={handleShowSuccessAlert}>×</div>
            </div>
            <div className={styles.successModalBody}>
              <p style={{ marginBottom: '20px' }}>La evaluación cumple con todos los requisitos:</p>

              <div style={{ marginBottom: '20px' }}>
                <strong>Total de preguntas:</strong> {successData.totalPreguntas}
              </div>

              <div style={{ marginBottom: '20px' }}>
                <strong>Niveles y Puntajes:</strong>
                <div style={{ marginTop: '10px' }}>
                  {successData.nivelYPuntaje?.map((nivel: any, index: number) => (
                    <div key={index} style={{
                      padding: '8px',
                      margin: '5px 0',
                      backgroundColor: '#f5f5f5',
                      borderRadius: '4px',
                      display: 'flex',
                      justifyContent: 'space-between'
                    }}>
                      <span><strong>Nivel:</strong> {nivel.nivel}</span>
                      <span><strong>Puntaje:</strong> max:{nivel.max} - min:{nivel.min}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
            <div className={styles.successModalFooter}>
              <button
                onClick={handleActivateEvaluacion}
                className={styles.successModalButton}
              >
                ACEPTAR
              </button>
            </div>
          </div>
        </div>,
        document.getElementById('portal-modal') || document.body
      )}
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

          <div className={styles.headerActions}>
            <button
              onClick={handleShowCreateModal}
              className={styles.createButton}
              title="Crear nueva evaluación"
            >
              <MdAddCircle />
              <span>Crear Evaluación</span>
            </button>
          </div>
        </div>

        {/* Botón de cambio de vista */}
        {/* <div className={styles.viewToggleContainer}>
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
        </div> */}

        {loaderPages ? (
          <div className={styles.loader}>
            <div className={styles.loaderContent}>
              <div className={styles.loaderIcon} />
              <span className={styles.loaderText}>Cargando</span>
            </div>
          </div>
        ) : (
          <div className={styles.content}>
            <div className={styles.toolbar}>
              <div className={styles.yearFilterContainer}>
                <span className={styles.filterLabel}>Año:</span>
                {years.map(year => (
                  <button
                    key={year}
                    className={`${styles.yearBadge} ${selectedYear === year ? styles.yearBadgeActive : ''}`}
                    onClick={() => setSelectedYear(year)}
                  >
                    {year}
                  </button>
                ))}
              </div>
            </div>

            {/* Vista de Acordeón */}
            {viewMode === 'acordeon' && grados && grados.length > 0 && (
              <div className={styles.acordeonViewContainer}>
                <GradosAcordeon
                  grados={grados}
                  evaluaciones={filteredEvaluaciones}
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
                      {filteredEvaluaciones.length > 0 ? (
                        filteredEvaluaciones?.map((eva, index) => (
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
                                    onChange={(e) => setDataEvaluacion({ ...dataEvaluacion, mesDelExamen: e.target.value })}
                                  >
                                    {getAllMonths.map((mes) => (
                                      <option key={mes.id} value={mes.id.toString()}>
                                        {mes.name}
                                      </option>
                                    ))}
                                  </select>
                                  <div className={styles.monthEditActions}>
                                    <button
                                      onClick={() => handleSaveMonth(dataEvaluacion.mesDelExamen || "0", dataEvaluacion.añoDelExamen || currentYear)}
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