import React, { useState, useEffect } from 'react'
import { HiX } from 'react-icons/hi'
import styles from './especialistaRegionales.module.css'
import Loader from '@/components/loader/loader'
import { User } from '@/features/types/types'

interface ModalEditarEspecialistaProps {
  isOpen: boolean
  onClose: () => void
  onUpdate: (dni: string, data: User) => Promise<void>
  onDelete: (dni: string) => Promise<void>
  onSuccess?: () => void
  onError?: (error: Error) => void
  especialista: User | null
  warningMessage?: string
  setWarningMessage?: (message: string) => void
}

const ModalEditarEspecialista: React.FC<ModalEditarEspecialistaProps> = ({
  isOpen,
  onClose,
  onUpdate,
  onDelete,
  onSuccess,
  onError,
  especialista,
  warningMessage: externalWarningMessage,
  setWarningMessage: setExternalWarningMessage
}) => {
  const [formData, setFormData] = useState({
    dni: '',
    nombres: '',
    apellidos: ''
  })
  const [isLoading, setIsLoading] = useState(false)
  const [warningMessage, setWarningMessage] = useState('')
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)

  // Función para limpiar texto de nombres y apellidos
  const cleanTextInput = (text: string): string => {
    return text
      .trim() // Eliminar espacios al inicio y final
      .replace(/\s+/g, ' ') // Reemplazar múltiples espacios con uno solo
      .replace(/[^\w\sáéíóúñüÁÉÍÓÚÑÜ]/g, '') // Eliminar caracteres especiales excepto letras y espacios
      .replace(/\b\w/g, (char) => char.toUpperCase()) // Capitalizar primera letra de cada palabra
  }

  // Función para validar y generar mensajes de advertencia
  const validateAndSetWarning = (data: typeof formData) => {
    const warnings: string[] = []
    
    // Validar DNI
    if (data.dni.length > 0 && data.dni.length < 8) {
      warnings.push('El DNI debe tener exactamente 8 dígitos')
    }
    
    // Validar nombres
    if (data.nombres.length > 0 && data.nombres.length < 2) {
      warnings.push('Los nombres deben tener al menos 2 caracteres')
    }
    
    // Validar apellidos
    if (data.apellidos.length > 0 && data.apellidos.length < 2) {
      warnings.push('Los apellidos deben tener al menos 2 caracteres')
    }
    
    // Validar que no contenga solo espacios
    if (data.nombres.trim().length === 0 && data.nombres.length > 0) {
      warnings.push('Los nombres no pueden contener solo espacios')
    }
    
    if (data.apellidos.trim().length === 0 && data.apellidos.length > 0) {
      warnings.push('Los apellidos no pueden contener solo espacios')
    }
    
    // Validar caracteres especiales en nombres y apellidos
    const hasSpecialChars = /[^a-zA-ZáéíóúñüÁÉÍÓÚÑÜ\s]/.test(data.nombres) || 
                           /[^a-zA-ZáéíóúñüÁÉÍÓÚÑÜ\s]/.test(data.apellidos)
    if (hasSpecialChars) {
      warnings.push('Los nombres y apellidos solo pueden contener letras y espacios')
    }
    
    setWarningMessage(warnings.join('. ') || '')
  }

  // Cargar datos del especialista cuando se abre el modal
  useEffect(() => {
    if (especialista && isOpen) {
      setFormData({
        dni: especialista.dni || '',
        nombres: especialista.nombres || '',
        apellidos: especialista.apellidos || ''
      })
    }
  }, [especialista, isOpen])

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    
    // Si es el campo DNI, solo permitir números y máximo 8 dígitos
    if (name === 'dni') {
      const numericValue = value.replace(/[^0-9]/g, '')
      // Limitar a máximo 8 dígitos
      const limitedValue = numericValue.slice(0, 8)
      const newFormData = {
        ...formData,
        [name]: limitedValue
      }
      setFormData(newFormData)
      validateAndSetWarning(newFormData)
    } 
    // Para otros campos, permitir escritura normal
    else {
      const newFormData = {
        ...formData,
        [name]: value
      }
      setFormData(newFormData)
      validateAndSetWarning(newFormData)
    }
  }

  // Función para limpiar texto cuando el campo pierde el foco
  const handleBlur = (e: React.FocusEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    
    if (name === 'nombres' || name === 'apellidos') {
      const cleanedValue = cleanTextInput(value)
      const newFormData = {
        ...formData,
        [name]: cleanedValue
      }
      setFormData(newFormData)
      validateAndSetWarning(newFormData)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!especialista?.dni) {
      setWarningMessage('Error: No se encontró el DNI del especialista')
      return
    }

    // Validar que el DNI tenga exactamente 8 dígitos
    if (formData.dni.length !== 8) {
      setWarningMessage('El DNI debe tener exactamente 8 dígitos')
      return
    }

    try {
      setIsLoading(true)
      setWarningMessage('')
      
      // Limpiar datos antes de enviar
      const cleanedData = {
        dni: formData.dni.trim(),
        nombres: cleanTextInput(formData.nombres),
        apellidos: cleanTextInput(formData.apellidos)
      }
      
      await onUpdate(especialista.dni, cleanedData)
      
      if (onSuccess) {
        onSuccess()
      }
      onClose()
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Error desconocido'
      setWarningMessage(`Error al actualizar especialista: ${errorMessage}`)
      if (onError) {
        onError(error as Error)
      }
    } finally {
      setIsLoading(false)
    }
  }

  const handleDelete = async () => {
    if (!especialista?.dni) {
      setWarningMessage('Error: No se encontró el DNI del especialista')
      return
    }

    try {
      setIsLoading(true)
      setWarningMessage('')
      
      await onDelete(especialista.dni)
      
      if (onSuccess) {
        onSuccess()
      }
      onClose()
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Error desconocido'
      setWarningMessage(`Error al eliminar especialista: ${errorMessage}`)
      if (onError) {
        onError(error as Error)
      }
    } finally {
      setIsLoading(false)
    }
  }

  const handleCancel = () => {
    setFormData({
      dni: especialista?.dni || '',
      nombres: especialista?.nombres || '',
      apellidos: especialista?.apellidos || ''
    })
    setWarningMessage('')
    setShowDeleteConfirm(false)
    onClose()
  }

  if (!isOpen || !especialista) return null
  
  // Usar el warningMessage externo si está disponible, sino usar el del formulario
  const displayWarningMessage = externalWarningMessage || warningMessage
  
  return (
    <div className={styles.modalOverlay} onClick={handleCancel}>
      <div className={styles.modalContent} onClick={(e) => e.stopPropagation()}>
        <div className={styles.modalHeader}>
          <h2 className={styles.modalTitle}>Editar Especialista Regional</h2>
          <button className={styles.closeButton} onClick={handleCancel}>
            <HiX className={styles.closeIcon} />
          </button>
        </div>
        
        {isLoading ? (
          <div className={styles.loaderContainer}>
            <Loader text={showDeleteConfirm ? "Eliminando especialista..." : "Actualizando especialista..."} />
          </div>
        ) : showDeleteConfirm ? (
          <div className={styles.deleteConfirmContainer}>
            <div className={styles.deleteIcon}>⚠️</div>
            <h3 className={styles.deleteTitle}>¿Estás seguro?</h3>
            <p className={styles.deleteMessage}>
              Esta acción eliminará permanentemente al especialista <strong>{especialista.nombres} {especialista.apellidos}</strong> (DNI: {especialista.dni}).
            </p>
            <p className={styles.deleteWarning}>
              Esta acción no se puede deshacer.
            </p>
            <div className={styles.deleteActions}>
              <button
                type="button"
                className={styles.cancelDeleteButton}
                onClick={() => setShowDeleteConfirm(false)}
              >
                Cancelar
              </button>
              <button
                type="button"
                className={styles.confirmDeleteButton}
                onClick={handleDelete}
              >
                Sí, Eliminar
              </button>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className={styles.form}>
            <div className={styles.formGroup}>
              <label className={styles.label}>DNI</label>
              <input
                type="text"
                name="dni"
                value={formData.dni}
                onChange={handleInputChange}
                className={styles.input}
                placeholder="Ingrese el DNI (solo números)"
                maxLength={8}
                pattern="[0-9]{8}"
                title="El DNI debe contener exactamente 8 dígitos"
                required
              />
            </div>
            
            <div className={styles.formGroup}>
              <label className={styles.label}>Nombres</label>
              <input
                type="text"
                name="nombres"
                value={formData.nombres}
                onChange={handleInputChange}
                onBlur={handleBlur}
                className={styles.input}
                placeholder="Ingrese los nombres"
                required
              />
            </div>
            
            <div className={styles.formGroup}>
              <label className={styles.label}>Apellidos</label>
              <input
                type="text"
                name="apellidos"
                value={formData.apellidos}
                onChange={handleInputChange}
                onBlur={handleBlur}
                className={styles.input}
                placeholder="Ingrese los apellidos"
                required
              />
            </div>
            
            {displayWarningMessage && typeof displayWarningMessage === 'string' && displayWarningMessage.length > 0 && (
              <p className={styles.warningMessage}>{displayWarningMessage}</p>
            )}
            
            <div className={styles.formActions}>
              <button
                type="button"
                className={styles.deleteButton}
                onClick={() => setShowDeleteConfirm(true)}
                disabled={isLoading}
              >
                Eliminar Especialista
              </button>
              <div className={styles.rightActions}>
                <button
                  type="button"
                  className={styles.cancelButton}
                  onClick={handleCancel}
                  disabled={isLoading}
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className={styles.submitButton}
                  disabled={isLoading}
                >
                  {isLoading ? 'Actualizando...' : 'Actualizar Especialista'}
                </button>
              </div>
            </div>
          </form>
        )}
      </div>
    </div>
  )
}

export default ModalEditarEspecialista
