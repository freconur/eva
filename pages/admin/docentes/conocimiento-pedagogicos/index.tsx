import React, { useEffect, useState } from 'react'
import Image from 'next/image'
import header from '@/assets/evaluacion-docente.jpg'
import styles from './conocimientoPedagogicos.module.css'
import { useEvaluacionesEscalaLikert } from '@/features/hooks/useEvaluacionesEscalaLikert'
import { EvaluacionLikert } from '@/features/types/types'
import { HiEye, HiEyeOff, HiPlus, HiPencil, HiTrash } from 'react-icons/hi'
import {getAllMonths} from '@/fuctions/dates'
import Link from 'next/link'
import useUsuario from '@/features/hooks/useUsuario'
import { useGlobalContext } from '@/features/context/GlolbalContext'

const ConocimientoPedagogicosMain = () => {

    const {evaluacionesEscalaLikert, getEvaluacionesEscalaLikert, updateEvaluacionEscalaLikert, createEvaluacionEscalaLikert, optionsEvaluacion, getOptionsEvaluacion, deleteEvaluacionEscalaLikert} = useEvaluacionesEscalaLikert()
    const [updatingId, setUpdatingId] = useState<string | null>(null)
    const [showModal, setShowModal] = useState(false)
    const [showUpdateModal, setShowUpdateModal] = useState(false)
    const [showDeleteModal, setShowDeleteModal] = useState(false)
    const [isCreating, setIsCreating] = useState(false)
    const [isUpdating, setIsUpdating] = useState(false)
    const [isDeleting, setIsDeleting] = useState(false)
    const [formData, setFormData] = useState<Partial<EvaluacionLikert>>({
        name: '',
        mesDelExamen: '',
        tipoDeEvaluacion: '',
        active: true
    })
    const [updateFormData, setUpdateFormData] = useState<Partial<EvaluacionLikert>>({
        name: '',
        mesDelExamen: '',
        tipoDeEvaluacion: '',
        active: true
    })
    const [selectedEvaluationId, setSelectedEvaluationId] = useState<string | null>(null)
    const { currentUserData } = useGlobalContext()
    const handleToggleVisibility = async (evaluacionId: string, currentActive: boolean) => {
        setUpdatingId(evaluacionId)
        try {
            await updateEvaluacionEscalaLikert(evaluacionId, { active: !currentActive })
            // No necesitamos actualizar manualmente la lista ya que onSnapshot lo hace automáticamente
        } catch (error) {
            console.error('Error al actualizar el estado:', error)
        } finally {
            setUpdatingId(null)
        }
    }

    const handleAddEvaluation = () => {
        setShowModal(true)
    }

    const handleCloseModal = () => {
        setShowModal(false)
        setFormData({
            name: '',
            mesDelExamen: '',
            tipoDeEvaluacion: '',
            active: true
        })
    }

    const handleOpenUpdateModal = (evaluacion: EvaluacionLikert) => {
        setSelectedEvaluationId(evaluacion.id || null)
        setUpdateFormData({
            name: evaluacion.name || '',
            mesDelExamen: evaluacion.mesDelExamen || '',
            tipoDeEvaluacion: evaluacion.tipoDeEvaluacion || '',
            active: evaluacion.active ?? true
        })
        setShowUpdateModal(true)
    }

    const handleCloseUpdateModal = () => {
        setShowUpdateModal(false)
        setSelectedEvaluationId(null)
        setUpdateFormData({
            name: '',
            mesDelExamen: '',
            tipoDeEvaluacion: '',
            active: true
        })
    }

    const handleOpenDeleteModal = (evaluacion: EvaluacionLikert) => {
        setSelectedEvaluationId(evaluacion.id || null)
        setShowDeleteModal(true)
    }

    const handleCloseDeleteModal = () => {
        setShowDeleteModal(false)
        setSelectedEvaluationId(null)
    }

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value, type } = e.target
        setFormData(prev => ({
            ...prev,
            [name]: type === 'checkbox' ? (e.target as HTMLInputElement).checked : value
        }))
    }

    const handleUpdateInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value, type } = e.target
        setUpdateFormData(prev => ({
            ...prev,
            [name]: type === 'checkbox' ? (e.target as HTMLInputElement).checked : value
        }))
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!formData.name?.trim()) {
            alert('El nombre de la evaluación es requerido')
            return
        }

        setIsCreating(true)
        try {
            await createEvaluacionEscalaLikert(formData as EvaluacionLikert)
            handleCloseModal()
        } catch (error) {
            console.error('Error al crear la evaluación:', error)
            alert('Error al crear la evaluación. Intente nuevamente.')
        } finally {
            setIsCreating(false)
        }
    }

    const handleUpdateSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!updateFormData.name?.trim()) {
            alert('El nombre de la evaluación es requerido')
            return
        }

        if (!selectedEvaluationId) {
            alert('Error: No se ha seleccionado una evaluación')
            return
        }

        setIsUpdating(true)
        try {
            await updateEvaluacionEscalaLikert(selectedEvaluationId, updateFormData)
            handleCloseUpdateModal()
        } catch (error) {
            console.error('Error al actualizar la evaluación:', error)
            alert('Error al actualizar la evaluación. Intente nuevamente.')
        } finally {
            setIsUpdating(false)
        }
    }

    const handleConfirmDelete = async () => {
        if (!selectedEvaluationId) {
            alert('Error: No se ha seleccionado una evaluación')
            return
        }

        setIsDeleting(true)
        try {
            await deleteEvaluacionEscalaLikert(selectedEvaluationId)
            handleCloseDeleteModal()
        } catch (error) {
            console.error('Error al eliminar la evaluación:', error)
            alert('Error al eliminar la evaluación. Intente nuevamente.')
        } finally {
            setIsDeleting(false)
        }
    }

    useEffect(() => {
        const unsubscribeEvaluaciones = getEvaluacionesEscalaLikert()
        const unsubscribeOptions = getOptionsEvaluacion()
        return () => {
            if (unsubscribeEvaluaciones) {
                unsubscribeEvaluaciones()
            }
            if (unsubscribeOptions) {
                unsubscribeOptions()
            }
        }
    }, [])

  return (
    <div>
      <div className={styles.header}>
        <div className={styles.headerOverlay}></div>
        <Image
          className={styles.headerImage}
          src={header}
          alt="imagen de cabecera"
          objectFit='fill'
          fetchPriority='high'
        />
        <h1 className={styles.headerTitle}>Conocimiento Pedagógico</h1>
      </div>

      {/* Tabla de evaluaciones */}
      <div className={styles.tableContainer}>
        <div className={styles.tableHeaderContainer}>
          <h2 className={styles.tableTitle}>Evaluaciones de Conocimiento Pedagógico</h2>
          
          {
            currentUserData.rol === 4 &&
            <button 
              className={styles.addEvaluationButton}
              onClick={handleAddEvaluation}
              title="Agregar nueva evaluación"
            >
              <HiPlus className={styles.addIcon} />
              Evaluación
            </button>
          }
          {/* <button 
            className={styles.addEvaluationButton}
            onClick={handleAddEvaluation}
            title="Agregar nueva evaluación"
          >
            <HiPlus className={styles.addIcon} />
            Evaluación
          </button> */}
        </div>
        
        <div className={styles.tableWrapper}>
          <table className={styles.table}>
            <thead>
              <tr className={styles.tableHeadRow}>
                <th className={styles.tableHeader}>Nombre de la Evaluación</th>
                <th className={styles.tableHeader}>Estado</th>
                <th className={styles.tableHeader}>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {evaluacionesEscalaLikert.length === 0 ? (
                <tr>
                  <td colSpan={3} className={styles.emptyState}>
                    No hay evaluaciones disponibles
                  </td>
                </tr>
              ) : (
                evaluacionesEscalaLikert
                  .filter(evaluacion => {
                    // Si el usuario es docente (rol 3) y la evaluación está inactiva, no mostrarla
                    if (currentUserData.rol === 3 && !evaluacion.active) {
                      return false
                    }
                    return true
                  })
                  .map((evaluacion, index) => (
                  <tr key={evaluacion.id || index} className={styles.tableRow}>
                    <td className={styles.tableCell}>
                      <Link href={`${currentUserData.rol === 3 ? `/docentes/conocimiento-pedagogico?idEvaluacion=${evaluacion.id}` : `/admin/docentes/conocimiento-pedagogico/${evaluacion.id}`}`}>
                      <div className={styles.evaluationName}>
                        {evaluacion.name || 'Sin nombre'}
                      </div>
                      </Link>
                     {/*  <Link href={`/admin/docentes/conocimiento-pedagogico/${evaluacion.id}`}>
                      </Link> */}
                    </td>
                    {
                      currentUserData.rol === 4 ?
<>
                    <td className={styles.tableCell}>
                      <div className={styles.statusContainer}>
                        {evaluacion.active ? (
                          <div 
                            className={`${styles.statusActive} ${updatingId === evaluacion.id ? styles.updating : ''}`}
                            onClick={() => evaluacion.id && handleToggleVisibility(evaluacion.id, evaluacion.active ?? false)}
                            style={{ cursor: updatingId === evaluacion.id ? 'not-allowed' : 'pointer' }}
                            title={updatingId === evaluacion.id ? 'Actualizando...' : 'Hacer clic para desactivar'}
                          >
                            <HiEye className={styles.eyeIcon} />
                            <span>{updatingId === evaluacion.id ? 'Actualizando...' : 'Activa'}</span>
                          </div>
                        ) : (
                          <div 
                            className={`${styles.statusInactive} ${updatingId === evaluacion.id ? styles.updating : ''}`}
                            onClick={() => evaluacion.id && handleToggleVisibility(evaluacion.id, evaluacion.active ?? false)}
                            style={{ cursor: updatingId === evaluacion.id ? 'not-allowed' : 'pointer' }}
                            title={updatingId === evaluacion.id ? 'Actualizando...' : 'Hacer clic para activar'}
                          >
                            <HiEyeOff className={styles.eyeIcon} />
                            <span>{updatingId === evaluacion.id ? 'Actualizando...' : 'Inactiva'}</span>
                          </div>
                        )}
                      </div>
                    </td>
                    <td className={styles.tableCell}>
                      <div className={styles.actionsContainer}>
                        <button 
                          className={styles.actionButton}
                          title="Editar evaluación"
                          onClick={() => handleOpenUpdateModal(evaluacion)}
                        >
                          <HiPencil className={styles.actionIcon} />
                        </button>
                        <button 
                          className={`${styles.actionButton} ${styles.deleteButton}`}
                          title="Eliminar evaluación"
                          onClick={() => handleOpenDeleteModal(evaluacion)}
                        >
                          <HiTrash className={styles.actionIcon} />
                        </button>
                      </div>
                    </td>
                    </>
                      :
                        currentUserData.rol === 3 && null
                    }
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal para crear evaluación */}
      {showModal && (
        <div className={styles.modalOverlay}>
          <div className={styles.modalContent}>
            <h3 className={styles.modalTitle}>Crear Nueva Evaluación</h3>
            
            <form onSubmit={handleSubmit} className={styles.form}>
              <div className={styles.inputGroup}>
                <label className={styles.inputLabel} htmlFor="name">
                  Nombre de la Evaluación *
                </label>
                <input
                  type="text"
                  id="name"
                  name="name"
                  value={formData.name || ''}
                  onChange={handleInputChange}
                  className={styles.input}
                  placeholder="Ingrese el nombre de la evaluación"
                  required
                />
              </div>

              <div className={styles.inputGroup}>
                <label className={styles.inputLabel} htmlFor="mesDelExamen">
                  Mes del Examen
                </label>
                <select
                  id="mesDelExamen"
                  name="mesDelExamen"
                  value={formData.mesDelExamen || ''}
                  onChange={handleInputChange}
                  className={styles.select}
                >
                  <option value="">Seleccionar mes</option>
                  {getAllMonths.map((month) => (
                    <option key={month.id} value={month.id}>
                      {month.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className={styles.inputGroup}>
                <label className={styles.inputLabel} htmlFor="tipoDeEvaluacion">
                  Tipo de Evaluación
                </label>
                <select
                  id="tipoDeEvaluacion"
                  name="tipoDeEvaluacion"
                  value={formData.tipoDeEvaluacion || ''}
                  onChange={handleInputChange}
                  className={styles.select}
                >
                  <option value="">Seleccionar tipo</option>
                  {optionsEvaluacion.tiposDeEvaluacion.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className={styles.inputGroup}>
                <label className={styles.checkboxLabel}>
                  <input
                    type="checkbox"
                    name="active"
                    checked={formData.active || false}
                    onChange={handleInputChange}
                    className={styles.checkbox}
                  />
                  <span className={styles.checkboxText}>Evaluación activa</span>
                </label>
              </div>

              <div className={styles.modalActions}>
                <button
                  type="button"
                  className={styles.cancelButton}
                  onClick={handleCloseModal}
                  disabled={isCreating}
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className={styles.submitButton}
                  disabled={isCreating || !formData.name?.trim()}
                >
                  {isCreating ? 'Creando...' : 'Crear Evaluación'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal para actualizar evaluación */}
      {showUpdateModal && (
        <div className={styles.modalOverlay}>
          <div className={styles.modalContent}>
            <h3 className={styles.modalTitle}>Actualizar Evaluación</h3>
            
            <form onSubmit={handleUpdateSubmit} className={styles.form}>
              <div className={styles.inputGroup}>
                <label className={styles.inputLabel} htmlFor="updateName">
                  Nombre de la Evaluación *
                </label>
                <input
                  type="text"
                  id="updateName"
                  name="name"
                  value={updateFormData.name || ''}
                  onChange={handleUpdateInputChange}
                  className={styles.input}
                  placeholder="Ingrese el nombre de la evaluación"
                  required
                />
              </div>

              <div className={styles.inputGroup}>
                <label className={styles.inputLabel} htmlFor="updateMesDelExamen">
                  Mes del Examen
                </label>
                <select
                  id="updateMesDelExamen"
                  name="mesDelExamen"
                  value={updateFormData.mesDelExamen || ''}
                  onChange={handleUpdateInputChange}
                  className={styles.select}
                >
                  <option value="">Seleccionar mes</option>
                  {getAllMonths.map((month) => (
                    <option key={month.id} value={month.id}>
                      {month.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className={styles.inputGroup}>
                <label className={styles.inputLabel} htmlFor="updateTipoDeEvaluacion">
                  Tipo de Evaluación
                </label>
                <select
                  id="updateTipoDeEvaluacion"
                  name="tipoDeEvaluacion"
                  value={updateFormData.tipoDeEvaluacion || ''}
                  onChange={handleUpdateInputChange}
                  className={styles.select}
                >
                  <option value="">Seleccionar tipo</option>
                  {optionsEvaluacion.tiposDeEvaluacion.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className={styles.inputGroup}>
                <label className={styles.checkboxLabel}>
                  <input
                    type="checkbox"
                    name="active"
                    checked={updateFormData.active || false}
                    onChange={handleUpdateInputChange}
                    className={styles.checkbox}
                  />
                  <span className={styles.checkboxText}>Evaluación activa</span>
                </label>
              </div>

              <div className={styles.modalActions}>
                <button
                  type="button"
                  className={styles.cancelButton}
                  onClick={handleCloseUpdateModal}
                  disabled={isUpdating}
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className={styles.submitButton}
                  disabled={isUpdating || !updateFormData.name?.trim()}
                >
                  {isUpdating ? 'Actualizando...' : 'Actualizar Evaluación'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal de confirmación para eliminar evaluación */}
      {showDeleteModal && (
        <div className={styles.modalOverlay}>
          <div className={styles.modalContent}>
            <h3 className={styles.modalTitle}>Confirmar Eliminación</h3>
            
            <div className={styles.confirmationContent}>
              <p>¿Está seguro de que desea eliminar esta evaluación?</p>
              <p className={styles.warningText}>
                Esta acción no se puede deshacer y eliminará permanentemente la evaluación.
              </p>
            </div>

            <div className={styles.modalActions}>
              <button
                type="button"
                className={styles.cancelButton}
                onClick={handleCloseDeleteModal}
                disabled={isDeleting}
              >
                Cancelar
              </button>
              <button
                type="button"
                className={styles.deleteConfirmButton}
                onClick={handleConfirmDelete}
                disabled={isDeleting}
              >
                {isDeleting ? 'Eliminando...' : 'Eliminar Evaluación'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default ConocimientoPedagogicosMain