import React from 'react'
import { HiX } from 'react-icons/hi'
import styles from './especialistaRegionales.module.css'
import { useEspecialistaForm, EspecialistaData } from '@/features/hooks/especialista-regional/useEspecialistaFormUtils'
import Loader from '@/components/loader/loader'
import {nivelInstitucion} from '@/fuctions/regiones'
interface ModalAgregarEspecialistaProps {
  isOpen: boolean
  onClose: () => void
  onSubmit: (data: EspecialistaData) => Promise<void>
  onSuccess?: () => void
  onError?: (error: Error) => void
  warningMessage?: string
  setWarningMessage?: (message: string) => void
}

const ModalAgregarEspecialista: React.FC<ModalAgregarEspecialistaProps> = ({
  isOpen,
  onClose,
  onSubmit,
  onSuccess,
  onError,
  warningMessage: externalWarningMessage,
  setWarningMessage: setExternalWarningMessage
}) => {

  const {
    formData,
    isLoading,
    warningMessage,
    handleInputChange,
    handleBlur,
    handleCheckboxChange,
    handleSubmit,
    handleCancel
  } = useEspecialistaForm({ onSubmit, onClose, onSuccess, onError, setExternalWarningMessage })

  if (!isOpen) return null
  
  // Usar el warningMessage externo si está disponible, sino usar el del formulario
  const displayWarningMessage = externalWarningMessage || warningMessage
  
  return (
    <div className={styles.modalOverlay} onClick={handleCancel}>
      <div className={styles.modalContent} onClick={(e) => e.stopPropagation()}>
        <div className={styles.modalHeader}>
          <h2 className={styles.modalTitle}>Agregar Especialista Regional</h2>
          <button className={styles.closeButton} onClick={handleCancel}>
            <HiX className={styles.closeIcon} />
          </button>
        </div>
        {
          isLoading ? (
            <div className={styles.loaderContainer}>
              <Loader  text="Creando especialista..."/>
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

          <div className={styles.formGroup}>
            <label className={styles.label}>Nivel de Institución</label>
            <div className={styles.checkboxContainer}>
              {nivelInstitucion.filter(nivel => nivel.id !== 0).map((nivel) => (
                <div key={nivel.id} className={styles.checkboxItem}>
                  <input
                    type="checkbox"
                    id={`nivel-${nivel.id}`}
                    checked={formData.nivelesInstitucion?.includes(nivel.id) || false}
                    onChange={() => handleCheckboxChange(nivel.id)}
                    className={styles.checkbox}
                  />
                  <label htmlFor={`nivel-${nivel.id}`} className={styles.checkboxLabel}>
                    {nivel.name.charAt(0).toUpperCase() + nivel.name.slice(1)}
                  </label>
                </div>
              ))}
            </div>
          </div>
            {displayWarningMessage && typeof displayWarningMessage === 'string' && displayWarningMessage.length > 0 && <p className={styles.warningMessage}>{displayWarningMessage}</p>}
          
          <div className={styles.formActions}>
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
              {isLoading ? 'Creando...' : 'Crear Especialista'}
            </button>
          </div>
        </form>
          )
        }
        
      </div>
    </div>
  )
}

export default ModalAgregarEspecialista
export type { EspecialistaData }
