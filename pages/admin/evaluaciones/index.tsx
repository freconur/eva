import PrivateRouteAdmins from '@/components/layouts/PrivateRoutes'
import PrivateRouteAdmin from '@/components/layouts/PrivateRoutesAdmin'
import { useGlobalContext } from '@/features/context/GlolbalContext'
import { useAgregarEvaluaciones } from '@/features/hooks/useAgregarEvaluaciones'
import { useGenerarReporte } from '@/features/hooks/useGenerarReporte'
// import { Evaluaciones } from '@/features/types/types'
import DeleteEvaluacion from '@/modals/deleteEvaluacion'
import UpdateEvaluacion from '@/modals/updateEvaluacion'
import AlertModal from '@/modals/alertModal/AlertModal'
import PuntuacionYNivel from '@/modals/PuntuacionYNivel/puntuacionYNivel'

import React, { useEffect, useState } from 'react'
import { MdAddCircle } from 'react-icons/md'
import { RiLoader4Line } from 'react-icons/ri'
import { toast } from 'react-toastify'
import {
  DndContext,
  closestCenter,
} from '@dnd-kit/core'
import {
  SortableContext,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable'
import { createPortal } from 'react-dom'
import CreateEvaluacionModal from './CreateEvaluacionModal'
import styles from './evaluaciones.module.css'

// Modularized imports
import { useEvaluacionesFilters, getNivelGrado } from '@/features/hooks/useEvaluacionesFilters'
import EvaluacionesToolbar from '@/components/evaluaciones/EvaluacionesToolbar'
import SortableRow from '@/components/evaluaciones/SortableRow'

const Evaluaciones = () => {
  const { getEvaluaciones, getEvaluacion, updateEvaluacion, getGrades, totalPreguntas, validacionSiEvaluacionTienePreguntasYPuntuacion } = useAgregarEvaluaciones()
  const { evaluaciones, currentUserData, loaderPages, evaluacion, grados } = useGlobalContext()

  // --- Filter & Column hook ---
  const {
    selectedYear,
    setSelectedYear,
    selectedGrado,
    setSelectedGrado,
    showYearMenu,
    setShowYearMenu,
    showGradoMenu,
    setShowGradoMenu,
    visibleColumns,
    showColMenu,
    setShowColMenu,
    toggleColumn,
    years,
    currentYear,
    gradosFiltrados,
    orderedEvaluaciones,
    sensors,
    handleDragEnd,
    tieneAccesoAEvaluacion,
    updateQueryParams,
  } = useEvaluacionesFilters()

  // --- Modal & editing states ---
  const [showDelete, setShowDelete] = useState<boolean>(false)
  const [inputUpdate, setInputUpdate] = useState<boolean>(false)
  const [idEva, setIdEva] = useState<string>("")
  const [nameEva, setNameEva] = useState<string>("")
  const [editingMonth, setEditingMonth] = useState<boolean>(false)
  const [editingMonthId, setEditingMonthId] = useState<string>("")
  const [updatingMonth, setUpdatingMonth] = useState<boolean>(false)
  const [showAlert, setShowAlert] = useState<boolean>(false)
  const [alertMessage, setAlertMessage] = useState<string>("")
  const [showSuccessAlert, setShowSuccessAlert] = useState<boolean>(false)
  const [successData, setSuccessData] = useState<any>(null)
  const [showCreateModal, setShowCreateModal] = useState<boolean>(false)
  const [processingIds, setProcessingIds] = useState<string[]>([])
  const [dataEvaluacion, setDataEvaluacion] = useState(evaluacion)

  // --- PuntuacionYNivel modal state ---
  const [showPuntuacionModal, setShowPuntuacionModal] = useState<boolean>(false)
  const [selectedEvaForPuntuacion, setSelectedEvaForPuntuacion] = useState<any>(null)

  // --- Handlers ---
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
        const { tienePuntajeValido: tienePuntaje, totalPreguntas: totalPreg, sumaTotalPuntajes } = await validacionSiEvaluacionTienePreguntasYPuntuacion(eva) as any;

        if (!tienePuntaje) {
          setAlertMessage('No se puede activar la evaluación. Debe configurar preguntas y asignar puntaje a todas las preguntas.')
          setShowAlert(true)
          return
        }

        // VALIDACIÓN DE SUMA COMPLETA
        // 1. Obtener el nivel "satisfactorio"
        const nivelSatisfactorio = eva.nivelYPuntaje.find((n: any) => n.nivel.toLowerCase() === 'satisfactorio');

        if (!nivelSatisfactorio) {
          setAlertMessage('No se puede activar la evaluación. No se encontró el nivel "Satisfactorio" en la configuración.');
          setShowAlert(true);
          return;
        }

        const puntajeMaximoSatisfactorio = Number(nivelSatisfactorio.max);
        const sumaPuntajesRegex = Number(sumaTotalPuntajes);

        if (sumaPuntajesRegex !== puntajeMaximoSatisfactorio) {
          setAlertMessage(`No se puede activar. La suma de los puntajes de las preguntas (${sumaPuntajesRegex}) debe ser igual al puntaje máximo del nivel Satisfactorio (${puntajeMaximoSatisfactorio}).`);
          setShowAlert(true);
          return;
        }

        // Si pasa las validaciones, mostrar los datos y activar
        setSuccessData({
          nivelYPuntaje: eva.nivelYPuntaje,
          totalPreguntas: totalPreg,
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

  const handleCopyId = (id: string) => {
    navigator.clipboard.writeText(id)
    toast.success(`ID ${id} copiado al portapapeles`, {
      autoClose: 2000,
      position: "bottom-right",
    })
  }

  const handleOpenPuntuacionModal = (eva: any) => {
    setSelectedEvaForPuntuacion(eva)
    setShowPuntuacionModal(true)
  }

  // --- Data fetching ---
  useEffect(() => {
    getGrades()
    // eslint-disable-next-line react-hooks/exhaustive-deps
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentUserData.dni])

  console.log('evaluaciones', evaluaciones)
  console.log('grados', grados)

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
      {showPuntuacionModal && selectedEvaForPuntuacion && (
        <PuntuacionYNivel
          evaluacion={selectedEvaForPuntuacion}
          showModal={showPuntuacionModal}
          handleShowModal={() => setShowPuntuacionModal(false)}
          estudiante={null}
          idExamen={selectedEvaForPuntuacion.id}
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
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', margin: '2rem 2rem 0 2rem' }}>
          <h1 style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#1e293b', margin: 0 }}>Seguimiento y retroalimentación al desempeño del estudiante</h1>

          <button
            onClick={handleShowCreateModal}
            className={styles.createButton}
            title="Crear nueva evaluación"
          >
            <MdAddCircle />
            <span>Crear Evaluación</span>
          </button>
        </div>

        {/* Controles de filtro (Año y Grados) */}
        {loaderPages ? (
          <div className={styles.loader}>
            <div className={styles.loaderContent}>
              <div className={styles.loaderIcon} />
              <span className={styles.loaderText}>Cargando</span>
            </div>
          </div>
        ) : (
          <div className={styles.content}>
            <EvaluacionesToolbar
              selectedYear={selectedYear}
              setSelectedYear={setSelectedYear}
              showYearMenu={showYearMenu}
              setShowYearMenu={setShowYearMenu}
              years={years}
              selectedGrado={selectedGrado}
              setSelectedGrado={setSelectedGrado}
              showGradoMenu={showGradoMenu}
              setShowGradoMenu={setShowGradoMenu}
              gradosFiltrados={gradosFiltrados}
              visibleColumns={visibleColumns}
              showColMenu={showColMenu}
              setShowColMenu={setShowColMenu}
              toggleColumn={toggleColumn}
              updateQueryParams={updateQueryParams}
            />

            {/* Vista de Tabla Unificada */}
            <div className={styles.tableViewContainer}>
              <div className={styles.tableContainer}>
                <DndContext
                  sensors={sensors}
                  collisionDetection={closestCenter}
                  onDragEnd={handleDragEnd}
                >
                  <table className={styles.table}>
                    <thead className={styles.tableHeader}>
                      <tr className={styles.tableHeaderRow}>
                        {selectedGrado !== 'all' && <th className={styles.tableHeaderCell} style={{ width: '40px' }}></th>}
                        {visibleColumns.id && <th className={styles.tableHeaderCell}>ID</th>}
                        {visibleColumns.niveles && <th className={styles.tableHeaderCell}>niveles</th>}
                        {visibleColumns.nombre && <th className={styles.tableHeaderCell}>nombre de evaluación</th>}
                        {visibleColumns.grado && <th className={styles.tableHeaderCell}>grado / nivel</th>}
                        {visibleColumns.fecha && <th className={styles.tableHeaderCell}>mes y año</th>}
                        {visibleColumns.estado && <th className={styles.tableHeaderCell}>estado</th>}
                        {visibleColumns.reporte && <th className={styles.tableHeaderCell}>reporte</th>}
                        {visibleColumns.acciones && <th className={styles.tableHeaderCell}>acciones</th>}
                      </tr>
                    </thead>
                    <tbody className={styles.tableBody}>
                      <SortableContext
                        items={orderedEvaluaciones.map(eva => eva.id)}
                        strategy={verticalListSortingStrategy}
                      >
                        {orderedEvaluaciones.length > 0 ? (
                          orderedEvaluaciones.map((eva, index) => {
                            const puedeAcceder = tieneAccesoAEvaluacion(eva)
                            const gradoObj = grados.find(g => g.grado === eva.grado)

                            return (
                              <SortableRow
                                key={eva.id}
                                eva={eva}
                                puedeAcceder={puedeAcceder}
                                gradoObj={gradoObj}
                                nivelGrado={getNivelGrado(eva.grado || 0)}
                                currentYear={currentYear}
                                editingMonth={editingMonth}
                                editingMonthId={editingMonthId}
                                dataEvaluacion={dataEvaluacion}
                                setDataEvaluacion={setDataEvaluacion}
                                updatingMonth={updatingMonth}
                                handleSaveMonth={handleSaveMonth}
                                handleCancelEditMonth={handleCancelEditMonth}
                                handleEditMonth={handleEditMonth}
                                handleCopyId={handleCopyId}
                                toggleActiveStatus={toggleActiveStatus}
                                handleShowInputUpdate={handleShowInputUpdate}
                                setNameEva={setNameEva}
                                setIdEva={setIdEva}
                                handleShowModalDelete={handleShowModalDelete}
                                currentUserData={currentUserData}
                                visibleColumns={visibleColumns}
                                selectedGrado={selectedGrado}
                                handleOpenPuntuacionModal={handleOpenPuntuacionModal}
                              />
                            )
                          })
                        ) : (
                          <tr>
                            <td 
                              colSpan={(selectedGrado !== 'all' ? 1 : 0) + Object.values(visibleColumns).filter(Boolean).length} 
                              style={{ textAlign: 'center', padding: '2rem', color: '#64748b' }}
                            >
                              No se encontraron evaluaciones para los filtros seleccionados.
                            </td>
                          </tr>
                        )}
                      </SortableContext>
                    </tbody>
                  </table>
                </DndContext>
              </div>
            </div>
          </div>
        )}
      </div>
    </>
  )
}

export default Evaluaciones
Evaluaciones.Auth = PrivateRouteAdmins