import React, { useEffect, useState } from 'react'
import { useGlobalContext } from '@/features/context/GlolbalContext'
import { useAgregarEvaluaciones } from '@/features/hooks/useAgregarEvaluaciones'
import { especialidad } from '@/fuctions/categorias'
import { MdClose } from 'react-icons/md'
import { RiLoader4Line } from 'react-icons/ri'
import styles from './createEvaluacionModal.module.css'

interface CreateEvaluacionModalProps {
    showModal: boolean
    handleShowModal: () => void
}

const CreateEvaluacionModal: React.FC<CreateEvaluacionModalProps> = ({
    showModal,
    handleShowModal
}) => {
    const initialValuesForData = {
        grado: 0,
        categoria: "",
        nombreEvaluacion: "",
        tipoDeEvaluacion: "",
        nivel: 0,
        añoDelExamen: new Date().getFullYear().toString(),
        mesDelExamen: new Date().getMonth().toString()
    }

    const [selectValues, setSelectValues] = useState(initialValuesForData)
    const { grados, loaderPages, tiposDeEvaluacion } = useGlobalContext()
    const { crearEvaluacion, getGrades, getTipoDeEvaluacion } = useAgregarEvaluaciones()

    useEffect(() => {
        getGrades()
        getTipoDeEvaluacion()
    }, [])

    const getNivelGrado = (grado: number) => {
        if (grado >= 1 && grado <= 6) return 1 // Primaria
        if (grado >= 7 && grado <= 11) return 2 // Secundaria
        return 0 // Inicial
    }

    const handleChangeValues = (e: React.ChangeEvent<HTMLSelectElement> | React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target
        const newValues = {
            ...selectValues,
            [name]: value
        }

        if (name === 'grado') {
            const gradoSeleccionado = parseInt(value)
            newValues.nivel = getNivelGrado(gradoSeleccionado)
        }

        setSelectValues(newValues)
    }

    const handleAgregarEvaluacion = async (e: React.FormEvent) => {
        e.preventDefault()
        try {
            await crearEvaluacion(selectValues)
            setSelectValues(initialValuesForData)
            handleShowModal() // Cerrar modal tras éxito
        } catch (error) {
            console.error('Error al crear evaluación:', error)
        }
    }

    if (!showModal) return null

    const isFormValid =
        selectValues.grado > 0 &&
        selectValues.categoria.length > 0 &&
        selectValues.nombreEvaluacion.length > 3 &&
        selectValues.tipoDeEvaluacion.length > 0

    return (
        <div className={styles.modalOverlay}>
            <div className={styles.modalContent}>
                <div className={styles.modalHeader}>
                    <h2 className={styles.modalTitle}>Crear Nueva Evaluación</h2>
                    <button onClick={handleShowModal} className={styles.closeButton}>
                        <MdClose />
                    </button>
                </div>

                <form className={styles.form} onSubmit={handleAgregarEvaluacion}>
                    <div className={styles.inputGroup}>
                        <label className={styles.label}>Nombre de la Evaluación</label>
                        <input
                            onChange={handleChangeValues}
                            className={styles.input}
                            type="text"
                            placeholder="Ej: Evaluación de Comunicación - Marzo"
                            name="nombreEvaluacion"
                            value={selectValues.nombreEvaluacion}
                            required
                        />
                    </div>

                    <div className={styles.inputGroup}>
                        <label className={styles.label}>Grado</label>
                        <select
                            name="grado"
                            onChange={handleChangeValues}
                            className={styles.select}
                            value={selectValues.grado}
                            required
                        >
                            <option value="0">Seleccionar Grado</option>
                            {grados?.map((gr, index) => (
                                <option value={gr.grado} key={index}>{gr.nombre}</option>
                            ))}
                        </select>
                    </div>

                    <div className={styles.inputGroup}>
                        <label className={styles.label}>Categoría / Especialidad</label>
                        <select
                            name="categoria"
                            onChange={handleChangeValues}
                            className={styles.select}
                            value={selectValues.categoria}
                            required
                        >
                            <option value="">Seleccionar Categoría</option>
                            {[...especialidad]
                                .sort((a, b) => a.categoria.localeCompare(b.categoria))
                                .map((esp, index) => (
                                    <option key={index} value={esp.id}>{esp.categoria}</option>
                                ))}
                        </select>
                    </div>

                    <div className={styles.inputGroup}>
                        <label className={styles.label}>Tipo de Evaluación</label>
                        <select
                            name="tipoDeEvaluacion"
                            onChange={handleChangeValues}
                            className={styles.select}
                            value={selectValues.tipoDeEvaluacion}
                            required
                        >
                            <option value="">Seleccionar Tipo</option>
                            {tiposDeEvaluacion?.map((tipo) => (
                                <option key={tipo.value} value={tipo.value}>{tipo.name}</option>
                            ))}
                        </select>
                    </div>

                    <button
                        type="submit"
                        disabled={!isFormValid || loaderPages}
                        className={`${styles.submitButton} ${!isFormValid ? styles.disabled : ''}`}
                    >
                        {loaderPages ? (
                            <>
                                <RiLoader4Line className={styles.spinner} />
                                Guardando...
                            </>
                        ) : (
                            'Guardar Evaluación'
                        )}
                    </button>
                </form>
            </div>
        </div>
    )
}

export default CreateEvaluacionModal
