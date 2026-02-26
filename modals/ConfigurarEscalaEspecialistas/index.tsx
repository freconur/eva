import { createPortal } from "react-dom"
import styles from './configurarEscala.module.css'
import { useGlobalContext } from "@/features/context/GlolbalContext";
import { AlternativasDocente } from "@/features/types/types";
import { RiLoader4Line, RiDeleteBin6Line, RiAddLine } from "react-icons/ri";
import { useEffect, useState } from "react";
import UseEvaluacionEspecialistas from "@/features/hooks/UseEvaluacionEspecialistas";

interface Props {
    handleShowConfigurarEscala: () => void,
    idEvaluacion: string,
    escalaActual?: AlternativasDocente[]
}

const ConfigurarEscalaEspecialistas = ({ handleShowConfigurarEscala, idEvaluacion, escalaActual }: Props) => {
    const { loaderModales } = useGlobalContext()
    const { updateEscalaEvaluacion } = UseEvaluacionEspecialistas()
    const [escala, setEscala] = useState<AlternativasDocente[]>([])

    useEffect(() => {
        if (escalaActual && escalaActual.length > 0) {
            setEscala(escalaActual);
        } else {
            setEscala([
                { value: 0, descripcion: "No evidencia", alternativa: "0" },
                { value: 1, descripcion: "En proceso", alternativa: "1" },
                { value: 2, descripcion: "Logrado", alternativa: "2" },
            ]);
        }
    }, [escalaActual]);

    const handleAddOption = () => {
        const nextValue = escala.length > 0 ? Math.max(...escala.map(o => o.value || 0)) + 1 : 0;
        setEscala([...escala, { value: nextValue, descripcion: "", alternativa: nextValue.toString() }]);
    };

    const handleRemoveOption = (index: number) => {
        setEscala(escala.filter((_, i) => i !== index));
    };

    const handleOptionChange = (index: number, field: keyof AlternativasDocente, value: any) => {
        const newEscala = [...escala];
        newEscala[index] = { ...newEscala[index], [field]: value };
        setEscala(newEscala);
    };

    const handleSave = async () => {
        await updateEscalaEvaluacion(idEvaluacion, escala);
        handleShowConfigurarEscala();
    };

    let container;
    if (typeof window !== "undefined") {
        container = document.getElementById("portal-modal");
    }

    return container
        ? createPortal(
            <div className={styles.containerModal}>
                {loaderModales ? (
                    <div className={styles.loaderContainer}>
                        <RiLoader4Line className={styles.loaderIcon} />
                        <p className={styles.loaderText}>guardando configuración...</p>
                    </div>
                ) : (
                    <div className={styles.containerSale}>
                        <div className={styles.closeModalContainer}>
                            <h3 className={styles.title}>configurar escala</h3>
                            <div className={styles.close} onClick={handleShowConfigurarEscala}>cerrar</div>
                        </div>
                        <div className={styles.description}>
                            Define los valores y etiquetas para la evaluación. Se aplicarán a las preguntas nuevas.
                        </div>
                        <div className={styles.optionsList}>
                            {escala.map((option, index) => (
                                <div key={index} className={styles.optionRow}>
                                    <div className={styles.valueInputGroup}>
                                        <label className={styles.label}>Valor</label>
                                        <input
                                            type="number"
                                            className={styles.valueInput}
                                            value={option.value}
                                            onChange={(e) => handleOptionChange(index, 'value', parseInt(e.target.value))}
                                        />
                                    </div>
                                    <div className={styles.descInputGroup}>
                                        <label className={styles.label}>Etiqueta / Descripción</label>
                                        <input
                                            type="text"
                                            className={styles.descInput}
                                            placeholder="Ej: Excelente"
                                            value={option.descripcion}
                                            onChange={(e) => handleOptionChange(index, 'descripcion', e.target.value)}
                                        />
                                    </div>
                                    <button
                                        className={styles.removeButton}
                                        onClick={() => handleRemoveOption(index)}
                                        title="Eliminar opción"
                                    >
                                        <RiDeleteBin6Line />
                                    </button>
                                </div>
                            ))}
                        </div>
                        <div className={styles.actions}>
                            <button className={styles.addButton} onClick={handleAddOption}>
                                <RiAddLine /> Añadir nivel
                            </button>
                            <button className={styles.submitButton} onClick={handleSave}>guardar escala</button>
                        </div>
                    </div>
                )}
            </div>,
            container
        )
        : null
}

export default ConfigurarEscalaEspecialistas
