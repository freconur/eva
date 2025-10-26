import React, { useEffect, useState } from 'react'
import { MdClose, MdRemove } from 'react-icons/md'
import styles from './AsignarEvaluacionModal.module.css'
import { useEspecialistasRegionales } from '@/features/hooks/useEspecialistasRegionales'

interface AsignarEvaluacionModalProps {
  showModal: boolean
  handleShowModal: () => void
  idEvaluacion: string,
  usuariosConPermisos: string[] | undefined
}

const AsignarEvaluacionModal: React.FC<AsignarEvaluacionModalProps> = ({
  showModal,
  handleShowModal,
  idEvaluacion,
  usuariosConPermisos
}) => {
  const [especialistasSeleccionados, setEspecialistasSeleccionados] = useState<string[]>([])
  const [haHabidoCambios, setHaHabidoCambios] = useState<boolean>(false)
  
  const { getEspecialistasRegionales, especialistasRegionales, addPermisosEspecialistasEnEvaluacion } = useEspecialistasRegionales()
  
  useEffect(() => {
    if (showModal) {
      getEspecialistasRegionales()
    }
  }, [showModal])

  // Inicializar especialistas seleccionados si usuariosConPermisos tiene datos
  useEffect(() => {
    if (showModal && usuariosConPermisos && usuariosConPermisos.length > 0) {
      setEspecialistasSeleccionados(usuariosConPermisos)
    } else if (showModal) {
      setEspecialistasSeleccionados([])
    }
    setHaHabidoCambios(false) // Resetear el estado de cambios al inicializar
  }, [showModal, usuariosConPermisos])
  
  if (!showModal) return null
  
  const handleSelectChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
    const selectedOptions = Array.from(event.target.selectedOptions, option => option.value)
    setEspecialistasSeleccionados(selectedOptions)
    setHaHabidoCambios(true)
  }

  const handleRemoveEspecialista = (dniToRemove: string) => {
    setEspecialistasSeleccionados(prev => prev.filter(dni => dni !== dniToRemove))
    setHaHabidoCambios(true)
  }
  
  const obtenerNombreCompleto = (especialista: any) => {
    return `${especialista.nombres || ''} ${especialista.apellidos || ''}`.trim()
  }

  const handleGuardar = () => {
    console.log('Guardando especialistas seleccionados:', especialistasSeleccionados)
    // Aquí puedes agregar la lógica para guardar los especialistas seleccionados
    // Por ejemplo, llamar a una API o actualizar el estado global
    addPermisosEspecialistasEnEvaluacion(idEvaluacion, especialistasSeleccionados)
    alert(`Se han asignado ${especialistasSeleccionados.length} especialista(s) a la evaluación`)
    setHaHabidoCambios(false) // Resetear el estado de cambios después de guardar
    handleShowModal() // Cerrar el modal después de guardar
  }

  console.log('especialistasSeleccionados', especialistasSeleccionados)
  return (
    <div className={styles.modalOverlay} onClick={handleShowModal}>
      <div className={styles.modalContent} onClick={(e) => e.stopPropagation()}>
        <div className={styles.modalHeader}>
          <h2 className={styles.modalTitle}>Asignar Especialista a Evaluación</h2>
          <button 
            className={styles.closeButton}
            onClick={handleShowModal}
            aria-label="Cerrar modal"
          >
            <MdClose />
          </button>
        </div>
        
        <div className={styles.modalBody}>
          <div className={styles.selectContainer}>
            <label className={styles.selectLabel}>
              Seleccionar Especialistas Regionales:
            </label>
            <select
              multiple
              value={especialistasSeleccionados}
              onChange={handleSelectChange}
              className={styles.multiSelect}
              size={6}
            >
              {especialistasRegionales.map((especialista) => (
                <option key={especialista.dni} value={especialista.dni}>
                  {especialista.dni} - {obtenerNombreCompleto(especialista)}
                </option>
              ))}
            </select>
            <p className={styles.selectHint}>
              Mantén presionado Ctrl (Cmd en Mac) para seleccionar múltiples opciones
            </p>
          </div>
          
          {especialistasSeleccionados.length > 0 && (
            <div className={styles.selectedContainer}>
              <h3 className={styles.selectedTitle}>Especialistas Seleccionados:</h3>
              <div className={styles.selectedList}>
                {especialistasSeleccionados.map((dni) => {
                  const especialista = especialistasRegionales.find(esp => esp.dni === dni)
                  return (
                    <div key={dni} className={styles.selectedItem}>
                      <span className={styles.selectedDni}>{dni}</span>
                      <span className={styles.selectedName}>
                        {especialista ? obtenerNombreCompleto(especialista) : 'Nombre no disponible'}
                      </span>
                      <button 
                        className={styles.removeButton}
                        onClick={() => handleRemoveEspecialista(dni)}
                        aria-label={`Quitar especialista ${dni}`}
                        title="Quitar especialista"
                      >
                        <MdRemove />
                      </button>
                    </div>
                  )
                })}
              </div>
            </div>
          )}
        </div>
        
        <div className={styles.modalFooter}>
          <button 
            type="button" 
            className={styles.cancelButton}
            onClick={handleShowModal}
          >
            Cancelar
          </button>
          <button 
            type="button" 
            className={styles.saveButton}
            onClick={handleGuardar}
            disabled={!haHabidoCambios}
          >
            Guardar Permisos
          </button>
        </div>
      </div>
    </div>
  )
}

export default AsignarEvaluacionModal
