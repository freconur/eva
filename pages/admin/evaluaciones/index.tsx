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
import DuplicateEvaluacionModal from '@/modals/duplicarEvaluacion'
import BulkDuplicateModal from '@/modals/duplicarEvaluacion/BulkDuplicateModal'
import Link from 'next/link'

import React, { useEffect, useState } from 'react'
import { MdAdd, MdContentCopy, MdAutoAwesome } from 'react-icons/md'
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
import EvaluacionesSidebarView from '@/components/evaluaciones/EvaluacionesSidebarView'
import EvaluacionesSpotlightTour from '@/components/evaluaciones/EvaluacionesSpotlightTour'

const Evaluaciones = () => {
  const { getEvaluaciones, getEvaluacion, updateEvaluacion, getGrades, getCategories, totalPreguntas, validacionSiEvaluacionTienePreguntasYPuntuacion } = useAgregarEvaluaciones()
  const { evaluaciones, currentUserData, loaderPages, evaluacion, grados } = useGlobalContext()

  // --- View Mode state ('table' | 'sidebar') with localStorage persistence ---
  const [viewMode, setViewMode] = useState<'table' | 'sidebar'>('table')

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('evaluaciones_view_mode')
      if (saved === 'table' || saved === 'sidebar') {
        setViewMode(saved)
      }
    }
  }, [])

  const handleSetViewMode = (mode: 'table' | 'sidebar') => {
    setViewMode(mode)
    if (typeof window !== 'undefined') {
      localStorage.setItem('evaluaciones_view_mode', mode)
    }
  }

  // --- Filter & Column hook ---
  const {
    selectedYear,
    setSelectedYear,
    selectedGrado,
    setSelectedGrado,
    selectedMonth,
    setSelectedMonth,
    selectedCategoria,
    setSelectedCategoria,
    showYearMenu,
    setShowYearMenu,
    showGradoMenu,
    setShowGradoMenu,
    showMonthMenu,
    setShowMonthMenu,
    showCategoriaMenu,
    setShowCategoriaMenu,
    availableMonths,
    availableCategories,
    searchQuery,
    setSearchQuery,
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

  // --- Duplicate modal state ---
  const [showDuplicateModal, setShowDuplicateModal] = useState<boolean>(false)
  const [selectedEvaForDuplicate, setSelectedEvaForDuplicate] = useState<any>(null)

  // --- Onboarding state for new features (clonación y vista de panel) ---
  const [showOnboarding, setShowOnboarding] = useState<boolean>(false)
  const [hasSeenOnboarding, setHasSeenOnboarding] = useState<boolean>(true)

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const seen = localStorage.getItem('eva_onboarding_evaluaciones_v1')
      if (!seen) {
        setHasSeenOnboarding(false)
        const timer = setTimeout(() => {
          setShowOnboarding(true)
        }, 800)
        return () => clearTimeout(timer)
      } else {
        setHasSeenOnboarding(true)
      }
    }
  }, [])

  // --- Bulk selection state ---
  const [selectedEvaIds, setSelectedEvaIds] = useState<string[]>([])
  const [showBulkModal, setShowBulkModal] = useState<boolean>(false)

  const handleToggleSelect = (id: string) => {
    setSelectedEvaIds(prev =>
      prev.includes(id) ? prev.filter(item => item !== id) : [...prev, id]
    )
  }

  const handleToggleSelectAll = () => {
    if (selectedEvaIds.length === orderedEvaluaciones.length) {
      setSelectedEvaIds([])
    } else {
      setSelectedEvaIds(orderedEvaluaciones.map(eva => eva.id))
    }
  }

  const isAllSelected = orderedEvaluaciones.length > 0 && selectedEvaIds.length === orderedEvaluaciones.length
  const isSomeSelected = selectedEvaIds.length > 0 && selectedEvaIds.length < orderedEvaluaciones.length

  const selectedEvaluacionesList = orderedEvaluaciones.filter(eva =>
    selectedEvaIds.includes(eva.id)
  )

  const handleOpenBulkDuplicateModal = () => {
    if (selectedEvaIds.length > 0) {
      setShowBulkModal(true)
    }
  }

  const handleCloseBulkModal = () => {
    setShowBulkModal(false)
  }

  const handleBulkDuplicated = () => {
    setSelectedEvaIds([])
  }

  // --- Handlers ---
  const handleShowCreateModal = () => { setShowCreateModal(!showCreateModal) }
  const handleShowInputUpdate = () => { setInputUpdate(!inputUpdate) }
  const handleShowModalDelete = () => { setShowDelete(!showDelete) }
  const handleShowAlert = () => { setShowAlert(!showAlert) }
  const handleShowSuccessAlert = () => { setShowSuccessAlert(!showSuccessAlert) }
  const handleOpenDuplicateModal = (eva: any) => {
    setSelectedEvaForDuplicate(eva)
    setShowDuplicateModal(true)
  }
  const handleCloseDuplicateModal = () => {
    setShowDuplicateModal(false)
    setSelectedEvaForDuplicate(null)
  }

  const handleActivateEvaluacion = async () => {
    if (successData) {
      const updatedEva = { ...successData.evaluacion, active: true, cerrada: false }
      await updateEvaluacion(updatedEva, successData.evaluacion.id)
      setShowSuccessAlert(false)
      setSuccessData(null)
      toast.success(`Evaluación "${successData.evaluacion.nombre}" activada exitosamente`)
    }
  }

  const handleChangeEstadoEvaluacion = async (eva: any, nuevoEstado: 'activa' | 'cerrada' | 'inactiva') => {
    if (nuevoEstado === 'activa') {
      // Si ya estaba activa pero en modo cerrada, solo desbloquearla sin re-validar
      if (eva.active) {
        const updatedEva = { ...eva, active: true, cerrada: false }
        await updateEvaluacion(updatedEva, eva.id)
        toast.success(`Evaluación "${eva.nombre}" abierta para calificar`)
        return
      }

      // Si estaba inactiva (active: false), validar reglas de AGENTS.md
      if (eva.tipoDeEvaluacion === "1") {
        if (!eva.nivelYPuntaje || !Array.isArray(eva.nivelYPuntaje) || eva.nivelYPuntaje.length === 0) {
          setAlertMessage('No se puede activar la evaluación. Debe configurar primero los niveles y puntajes.')
          setShowAlert(true)
          return
        }

        const { tienePuntajeValido: tienePuntaje, totalPreguntas: totalPreg, sumaTotalPuntajes } = await validacionSiEvaluacionTienePreguntasYPuntuacion(eva) as any;

        if (!tienePuntaje) {
          setAlertMessage('No se puede activar la evaluación. Debe configurar preguntas y asignar puntaje a todas las preguntas.')
          setShowAlert(true)
          return
        }

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

        setSuccessData({
          nivelYPuntaje: eva.nivelYPuntaje,
          totalPreguntas: totalPreg,
          evaluacion: eva
        })
        setShowSuccessAlert(true)
        return
      }

      const updatedEva = { ...eva, active: true, cerrada: false }
      await updateEvaluacion(updatedEva, eva.id)
      toast.success(`Evaluación "${eva.nombre}" activada exitosamente`)
      return
    }

    if (nuevoEstado === 'cerrada') {
      // Modo Solo Lectura: visible para docentes pero no pueden calificar
      if (!eva.active && eva.tipoDeEvaluacion === "1") {
        if (!eva.nivelYPuntaje || !Array.isArray(eva.nivelYPuntaje) || eva.nivelYPuntaje.length === 0) {
          setAlertMessage('No se puede pasar a solo lectura. Debe configurar primero los niveles y puntajes.')
          setShowAlert(true)
          return
        }
      }
      const updatedEva = { ...eva, active: true, cerrada: true }
      await updateEvaluacion(updatedEva, eva.id)
      toast.info(`Evaluación "${eva.nombre}" establecida en modo Solo Lectura`)
      return
    }

    if (nuevoEstado === 'inactiva') {
      // Modo Oculto/Inactivo: oculta para los docentes
      const updatedEva = { ...eva, active: false, cerrada: false }
      await updateEvaluacion(updatedEva, eva.id)
      toast.info(`Evaluación "${eva.nombre}" desactivada (oculta para docentes)`)
      return
    }
  }

  const toggleActiveStatus = async (eva: any) => {
    // Ciclo: Inactiva -> Activa -> Cerrada -> Inactiva
    if (!eva.active) {
      await handleChangeEstadoEvaluacion(eva, 'activa')
    } else if (!eva.cerrada) {
      await handleChangeEstadoEvaluacion(eva, 'cerrada')
    } else {
      await handleChangeEstadoEvaluacion(eva, 'inactiva')
    }
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
    getCategories()
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
      {showDuplicateModal && selectedEvaForDuplicate && (
        <DuplicateEvaluacionModal
          showModal={showDuplicateModal}
          handleClose={handleCloseDuplicateModal}
          evaluacion={selectedEvaForDuplicate}
          gradoNombre={grados.find(g => g.grado === selectedEvaForDuplicate.grado)?.nombre}
          nivelNombre={getNivelGrado(selectedEvaForDuplicate.grado || 0)}
        />
      )}
      {showBulkModal && selectedEvaluacionesList.length > 0 && (
        <BulkDuplicateModal
          showModal={showBulkModal}
          handleClose={handleCloseBulkModal}
          evaluaciones={selectedEvaluacionesList}
          grados={grados}
          onCompleted={handleBulkDuplicated}
        />
      )}
      {/* Tour Interactivo Guiado Spotlight (Señala los botones reales en pantalla) */}
      <EvaluacionesSpotlightTour
        isOpen={showOnboarding}
        onClose={() => {
          setShowOnboarding(false)
          setHasSeenOnboarding(true)
        }}
        viewMode={viewMode}
        setViewMode={handleSetViewMode}
        selectedEvaIds={selectedEvaIds}
        setSelectedEvaIds={setSelectedEvaIds}
        firstEvaId={orderedEvaluaciones[0]?.id}
      />
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

          <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
            <button
              type="button"
              onClick={() => setShowOnboarding(true)}
              className={styles.onboardingHeaderButton}
              title="Ver guía de novedades: Clonación y Vista de Panel"
              aria-label="Ver guía de novedades"
            >
              <MdAutoAwesome className={styles.onboardingHeaderIcon} />
              <span>Novedades</span>
              {!hasSeenOnboarding && <span className={styles.onboardingHeaderBadge}>Nuevo</span>}
            </button>

            <button
              onClick={handleShowCreateModal}
              className={styles.createExpandButton}
              title="Crear nueva evaluación"
              aria-label="Crear nueva evaluación"
            >
              <MdAdd className={styles.createButtonIcon} />
              <span className={styles.createButtonText}>Crear Evaluación</span>
            </button>
          </div>
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
              selectedMonth={selectedMonth}
              setSelectedMonth={setSelectedMonth}
              showMonthMenu={showMonthMenu}
              setShowMonthMenu={setShowMonthMenu}
              availableMonths={availableMonths}
              selectedCategoria={selectedCategoria}
              setSelectedCategoria={setSelectedCategoria}
              showCategoriaMenu={showCategoriaMenu}
              setShowCategoriaMenu={setShowCategoriaMenu}
              availableCategories={availableCategories}
              searchQuery={searchQuery}
              setSearchQuery={setSearchQuery}
              totalResults={orderedEvaluaciones.length}
              visibleColumns={visibleColumns}
              showColMenu={showColMenu}
              setShowColMenu={setShowColMenu}
              toggleColumn={toggleColumn}
              viewMode={viewMode}
              setViewMode={handleSetViewMode}
              updateQueryParams={updateQueryParams}
            />

            {viewMode === 'table' ? (
              /* Vista de Tabla Unificada */
              <div className={styles.tableViewContainer}>
                {/* Barra flotante de acciones masivas */}
                {selectedEvaIds.length > 0 && currentUserData?.perfil?.rol === 4 && (
                  <div className={styles.bulkActionBar}>
                    <div className={styles.bulkActionInfo}>
                      <span className={styles.bulkActionCount}>{selectedEvaIds.length}</span>
                      <span>
                        {selectedEvaIds.length === 1
                          ? 'evaluación seleccionada'
                          : 'evaluaciones seleccionadas'}
                      </span>
                    </div>
                    <div className={styles.bulkActionButtons}>
                      <button
                        onClick={handleOpenBulkDuplicateModal}
                        className={styles.bulkDuplicateButton}
                        title="Duplicar las evaluaciones seleccionadas"
                        data-tour="tour-bulk-duplicate-button"
                      >
                        <MdContentCopy />
                        <span>Duplicar seleccionadas ({selectedEvaIds.length})</span>
                      </button>
                      <button
                        onClick={() => setSelectedEvaIds([])}
                        className={styles.bulkCancelButton}
                      >
                        Deseleccionar todas
                      </button>
                    </div>
                  </div>
                )}

                <div className={styles.tableContainer}>
                  <DndContext
                    sensors={sensors}
                    collisionDetection={closestCenter}
                    onDragEnd={handleDragEnd}
                  >
                    <table className={styles.table}>
                      <thead className={styles.tableHeader}>
                        <tr className={styles.tableHeaderRow}>
                          {currentUserData?.perfil?.rol === 4 && (
                            <th className={styles.tableHeaderCell} style={{ width: '38px', textAlign: 'center', padding: '0 0.25rem' }}>
                              <input
                                type="checkbox"
                                checked={isAllSelected}
                                ref={el => {
                                  if (el) el.indeterminate = isSomeSelected
                                }}
                                onChange={handleToggleSelectAll}
                                title={isAllSelected ? "Deseleccionar todas" : "Seleccionar todas"}
                                style={{ cursor: 'pointer', width: '16px', height: '16px', accentColor: '#6366f1' }}
                              />
                            </th>
                          )}
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
                                  onChangeEstado={handleChangeEstadoEvaluacion}
                                  handleShowInputUpdate={handleShowInputUpdate}
                                  setNameEva={setNameEva}
                                  setIdEva={setIdEva}
                                  handleShowModalDelete={handleShowModalDelete}
                                  currentUserData={currentUserData}
                                  visibleColumns={visibleColumns}
                                  selectedGrado={selectedGrado}
                                  handleOpenPuntuacionModal={handleOpenPuntuacionModal}
                                  handleOpenDuplicateModal={handleOpenDuplicateModal}
                                  isSelected={selectedEvaIds.includes(eva.id)}
                                  onToggleSelect={handleToggleSelect}
                                  searchQuery={searchQuery}
                                />
                              )
                            })
                          ) : (
                            <tr>
                              <td 
                                colSpan={(selectedGrado !== 'all' ? 1 : 0) + (currentUserData?.perfil?.rol === 4 ? 1 : 0) + Object.values(visibleColumns).filter(Boolean).length} 
                                style={{ textAlign: 'center', padding: '2.5rem 1rem', color: '#64748b' }}
                              >
                                {searchQuery ? (
                                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.75rem' }}>
                                    <span>
                                      No se encontraron evaluaciones que coincidan con <strong>&quot;{searchQuery}&quot;</strong>.
                                    </span>
                                    <button
                                      type="button"
                                      onClick={() => {
                                        setSearchQuery('')
                                        updateQueryParams(selectedYear, selectedGrado, selectedMonth, selectedCategoria, '')
                                      }}
                                      style={{
                                        padding: '0.45rem 1rem',
                                        fontSize: '0.85rem',
                                        color: '#2563eb',
                                        background: '#eff6ff',
                                        border: '1px solid #bfdbfe',
                                        borderRadius: '8px',
                                        cursor: 'pointer',
                                        fontWeight: 600,
                                        transition: 'all 0.15s ease',
                                      }}
                                    >
                                      Limpiar búsqueda
                                    </button>
                                  </div>
                                ) : (
                                  'No se encontraron evaluaciones para los filtros seleccionados.'
                                )}
                              </td>
                            </tr>
                          )}
                        </SortableContext>
                      </tbody>
                    </table>
                  </DndContext>
                </div>
              </div>
            ) : (
              /* Vista de Sidebar + Panel Detail */
              <EvaluacionesSidebarView
                evaluaciones={evaluaciones}
                orderedEvaluaciones={orderedEvaluaciones}
                selectedYear={selectedYear}
                currentYear={currentYear}
                selectedGrado={selectedGrado}
                setSelectedGrado={setSelectedGrado}
                selectedMonth={selectedMonth}
                selectedCategoria={selectedCategoria}
                searchQuery={searchQuery}
                setSearchQuery={setSearchQuery}
                updateQueryParams={updateQueryParams}
                grados={grados}
                gradosFiltrados={gradosFiltrados}
                tieneAccesoAEvaluacion={tieneAccesoAEvaluacion}
                sensors={sensors}
                handleDragEnd={handleDragEnd}
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
                onChangeEstado={handleChangeEstadoEvaluacion}
                handleShowInputUpdate={handleShowInputUpdate}
                setNameEva={setNameEva}
                setIdEva={setIdEva}
                handleShowModalDelete={handleShowModalDelete}
                currentUserData={currentUserData}
                visibleColumns={visibleColumns}
                handleOpenPuntuacionModal={handleOpenPuntuacionModal}
                handleOpenDuplicateModal={handleOpenDuplicateModal}
                selectedEvaIds={selectedEvaIds}
                setSelectedEvaIds={setSelectedEvaIds}
                handleToggleSelect={handleToggleSelect}
                handleToggleSelectAll={handleToggleSelectAll}
                isAllSelected={isAllSelected}
                isSomeSelected={isSomeSelected}
                handleOpenBulkDuplicateModal={handleOpenBulkDuplicateModal}
                handleShowCreateModal={handleShowCreateModal}
              />
            )}
          </div>
        )}
      </div>
    </>
  )
}

export default Evaluaciones
Evaluaciones.Auth = PrivateRouteAdmins