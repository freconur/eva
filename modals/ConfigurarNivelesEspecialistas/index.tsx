import { createPortal } from "react-dom"
import styles from './configurarNiveles.module.css'
import { useGlobalContext } from "@/features/context/GlolbalContext";
import { NivelYPuntaje } from "@/features/types/types";
import { RiLoader4Line, RiDeleteBin6Line, RiAddLine } from "react-icons/ri";
import { useEffect, useState } from "react";
import UseEvaluacionEspecialistas from "@/features/hooks/UseEvaluacionEspecialistas";

interface Props {
    handleShowConfigurarNiveles: () => void,
    idEvaluacion: string,
    nivelesActuales?: NivelYPuntaje[]
}

const ConfigurarNivelesEspecialistas = ({ handleShowConfigurarNiveles, idEvaluacion, nivelesActuales }: Props) => {
    const { loaderModales } = useGlobalContext()
    const { updateNivelesEvaluacion } = UseEvaluacionEspecialistas()
    const [niveles, setNiveles] = useState<NivelYPuntaje[]>([])

    useEffect(() => {
        if (nivelesActuales && nivelesActuales.length > 0) {
            setNiveles(nivelesActuales);
        } else {
            setNiveles([
                { nivel: "Inicio", min: 0, max: 5, color: "#94a3b8", id: 1 },
                { nivel: "Proceso", min: 6, max: 10, color: "#60a5fa", id: 2 },
                { nivel: "Logrado", min: 11, max: 15, color: "#34d399", id: 3 },
            ]);
        }
    }, [nivelesActuales]);

    const handleAddLevel = () => {
        const nextId = niveles.length > 0 ? Math.max(...niveles.map(n => n.id || 0)) + 1 : 1;
        const lastMax = niveles.length > 0 ? Math.max(...niveles.map(n => n.max || 0)) : -1;
        setNiveles([...niveles, {
            nivel: "",
            min: lastMax + 1,
            max: lastMax + 5,
            color: "#818cf8",
            id: nextId
        }]);
    };

    const handleRemoveLevel = (index: number) => {
        setNiveles(niveles.filter((_, i) => i !== index));
    };

    const handleLevelChange = (index: number, field: keyof NivelYPuntaje, value: any) => {
        const newNiveles = [...niveles];
        newNiveles[index] = { ...newNiveles[index], [field]: value };
        setNiveles(newNiveles);
    };

    const handleSave = async () => {
        await updateNivelesEvaluacion(idEvaluacion, niveles);
        handleShowConfigurarNiveles();
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
                        <p className={styles.loaderText}>guardando niveles...</p>
                    </div>
                ) : (
                    <div className={styles.containerSale}>
                        <div className={styles.closeModalContainer}>
                            <h3 className={styles.title}>configurar niveles de logro</h3>
                            <div className={styles.close} onClick={handleShowConfigurarNiveles}>cerrar</div>
                        </div>
                        <div className={styles.description}>
                            Define los rangos de puntaje para categorizar el desempeño de los especialistas.
                        </div>
                        <div className={styles.optionsList}>
                            {niveles.map((nivel, index) => (
                                <div key={index} className={styles.optionRow}>
                                    <div className={styles.levelInputGroup}>
                                        <label className={styles.label}>Nivel</label>
                                        <input
                                            type="text"
                                            className={styles.input}
                                            placeholder="Ej: Logrado"
                                            value={nivel.nivel}
                                            onChange={(e) => handleLevelChange(index, 'nivel', e.target.value)}
                                        />
                                    </div>
                                    <div className={styles.rangeInputGroup}>
                                        <label className={styles.label}>Min</label>
                                        <input
                                            type="number"
                                            className={styles.input}
                                            value={nivel.min}
                                            onChange={(e) => handleLevelChange(index, 'min', parseInt(e.target.value))}
                                        />
                                    </div>
                                    <div className={styles.rangeInputGroup}>
                                        <label className={styles.label}>Max</label>
                                        <input
                                            type="number"
                                            className={styles.input}
                                            value={nivel.max}
                                            onChange={(e) => handleLevelChange(index, 'max', parseInt(e.target.value))}
                                        />
                                    </div>
                                    <div className={styles.colorInputGroup}>
                                        <label className={styles.label}>Color</label>
                                        <input
                                            type="color"
                                            className={`${styles.input} ${styles.colorInput}`}
                                            value={nivel.color}
                                            onChange={(e) => handleLevelChange(index, 'color', e.target.value)}
                                        />
                                    </div>
                                    <button
                                        className={styles.removeButton}
                                        onClick={() => handleRemoveLevel(index)}
                                        title="Eliminar nivel"
                                    >
                                        <RiDeleteBin6Line />
                                    </button>
                                </div>
                            ))}
                        </div>
                        <div className={styles.actions}>
                            <button className={styles.addButton} onClick={handleAddLevel}>
                                <RiAddLine /> Añadir nivel
                            </button>
                            <button className={styles.submitButton} onClick={handleSave}>guardar niveles</button>
                        </div>
                    </div>
                )}
            </div>,
            container
        )
        : null
}

export default ConfigurarNivelesEspecialistas
