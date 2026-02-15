import React, { useEffect, useState } from 'react'
import { MdClose, MdRemove } from 'react-icons/md'
import styles from './AsignarEvaluacionModal.module.css'
import { useEspecialistasRegionales } from '@/features/hooks/useEspecialistasRegionales'

interface AsignarEvaluacionUgelModalProps {
    showModal: boolean
    handleShowModal: () => void
    idEvaluacion: string,
    usuariosConPermisosUgel: string[] | undefined
}

const AsignarEvaluacionUgelModal: React.FC<AsignarEvaluacionUgelModalProps> = ({
    showModal,
    handleShowModal,
    idEvaluacion,
    usuariosConPermisosUgel
}) => {
    const [especialistasSeleccionados, setEspecialistasSeleccionados] = useState<string[]>([])
    const [haHabidoCambios, setHaHabidoCambios] = useState<boolean>(false)

    const { getEspecialistasUgel, especialistasUgel, addPermisosUgelEnEvaluacion } = useEspecialistasRegionales()

    useEffect(() => {
        if (showModal) {
            getEspecialistasUgel()
        }
    }, [showModal])

    // Inicializar especialistas seleccionados si usuariosConPermisosUgel tiene datos
    useEffect(() => {
        if (showModal && usuariosConPermisosUgel && usuariosConPermisosUgel.length > 0) {
            setEspecialistasSeleccionados(usuariosConPermisosUgel)
        } else if (showModal) {
            setEspecialistasSeleccionados([])
        }
        setHaHabidoCambios(false)
    }, [showModal, usuariosConPermisosUgel])

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
        addPermisosUgelEnEvaluacion(idEvaluacion, especialistasSeleccionados)
        alert(`Se han asignado ${especialistasSeleccionados.length} especialista(s) UGEL a la evaluación`)
        setHaHabidoCambios(false)
        handleShowModal()
    }

    return (
        <div className={styles.modalOverlay} onClick={handleShowModal}>
            <div className={styles.modalContent} onClick={(e) => e.stopPropagation()}>
                <div className={styles.modalHeader}>
                    <h2 className={styles.modalTitle}>Asignar Especialista UGEL a Evaluación</h2>
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
                            Seleccionar Especialistas UGEL (Rol 1):
                        </label>
                        <select
                            multiple
                            value={especialistasSeleccionados}
                            onChange={handleSelectChange}
                            className={styles.multiSelect}
                            size={6}
                        >
                            {especialistasUgel.map((especialista) => (
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
                                    const especialista = especialistasUgel.find(esp => esp.dni === dni)
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
                        Guardar Permisos UGEL
                    </button>
                </div>
            </div>
        </div>
    )
}

export default AsignarEvaluacionUgelModal
