import { createPortal } from "react-dom"
import styles from './configurarFase.module.css'
import { useGlobalContext } from "@/features/context/GlolbalContext";
import { RiLoader4Line } from "react-icons/ri";
import { useState, useMemo } from "react";
import UseEvaluacionEspecialistas from "@/features/hooks/UseEvaluacionEspecialistas";
import { MdEdit, MdDelete, MdCheck, MdClose, MdHistory } from "react-icons/md";

import { getUniquePhases } from "@/features/utils/phaseUtils";

interface Props {
    handleShowConfigurarFase: () => void,
    idEvaluacion: string,
    faseActual?: string
}

const ConfigurarFaseEspecialistas = ({ handleShowConfigurarFase, idEvaluacion, faseActual }: Props) => {
    const { loaderModales, evaluadosEspecialista, dataEvaluacionDocente } = useGlobalContext()
    const { 
        updateFaseEvaluacion, 
        updateNombreFaseEvaluacion, 
        deleteFaseEvaluacion 
    } = UseEvaluacionEspecialistas()
    
    const [nombreFase, setNombreFase] = useState(faseActual || "")
    const [editingFaseId, setEditingFaseId] = useState<string | null>(null);
    const [editingNombre, setEditingNombre] = useState("");

    // Obtener fases únicas unificadas
    const fasesExistentes = useMemo(() => {
        return getUniquePhases(dataEvaluacionDocente, evaluadosEspecialista);
    }, [evaluadosEspecialista, dataEvaluacionDocente]);

    const handleSaveNew = async () => {
        if (nombreFase.trim() === "") return;
        await updateFaseEvaluacion(idEvaluacion, nombreFase);
        handleShowConfigurarFase();
    };

    const handleEditClick = (fase: { id: string, nombre: string }) => {
        setEditingFaseId(fase.id);
        setEditingNombre(fase.nombre);
    };

    const handleUpdateFase = async () => {
        if (!editingFaseId || editingNombre.trim() === "") return;
        try {
            await updateNombreFaseEvaluacion(idEvaluacion, editingFaseId, editingNombre);
            setEditingFaseId(null);
        } catch (error) {
            alert("Error al actualizar la fase");
        }
    };

    const handleDeleteFase = async (idFase: string, nombre: string) => {
        if (window.confirm(`¿Estás seguro de que deseas eliminar la fase "${nombre}"? \n\n¡ATENCIÓN! Se eliminarán todas las evaluaciones realizadas bajo esta etapa de forma permanente.`)) {
            try {
                await deleteFaseEvaluacion(idEvaluacion, idFase);
            } catch (error) {
                alert("Error al eliminar la fase");
            }
        }
    };

    let container;
    if (typeof window !== "undefined") {
        container = document.getElementById("portal-modal");
    }

    return container
        ? createPortal(
            <div className={styles.containerModal}>
                <div className={styles.containerSale}>
                    <div className={styles.closeModalContainer}>
                        <h3 className={styles.title}>Etapas de Evaluación</h3>
                        <div className={styles.close} onClick={handleShowConfigurarFase}>cerrar</div>
                    </div>

                    {loaderModales ? (
                        <div className={styles.loaderContainer}>
                            <RiLoader4Line className={styles.loaderIcon} />
                            <p className={styles.loaderText}>Procesando...</p>
                        </div>
                    ) : (
                        <>
                            <div className={styles.section}>
                                <h4 className={styles.sectionTitle}>Nueva Etapa</h4>
                                <div className={styles.description}>
                                    Al iniciar una nueva etapa, las siguientes evaluaciones se agruparán bajo este nombre.
                                </div>
                                <div className={styles.formGroupHorizontal}>
                                    <input
                                        type="text"
                                        className={styles.input}
                                        placeholder="Ej: Segunda Ronda Mayo..."
                                        value={nombreFase}
                                        onChange={(e) => setNombreFase(e.target.value)}
                                    />
                                    <button 
                                        className={styles.submitButton} 
                                        onClick={handleSaveNew} 
                                        disabled={nombreFase.trim() === ""}
                                    >
                                        Empezar
                                    </button>
                                </div>
                            </div>

                            {fasesExistentes.length > 0 && (
                                <div className={styles.section}>
                                    <h4 className={styles.sectionTitle}>Gestionar Etapas Existentes</h4>
                                    <div className={styles.phasesList}>
                                        {fasesExistentes.map((fase) => (
                                            <div key={fase.id} className={styles.phaseItem}>
                                                {editingFaseId === fase.id ? (
                                                    <div className={styles.editRow}>
                                                        <input 
                                                            className={styles.inputSmall}
                                                            value={editingNombre}
                                                            onChange={(e) => setEditingNombre(e.target.value)}
                                                            autoFocus
                                                        />
                                                        <div className={styles.itemActions}>
                                                            <MdCheck className={styles.iconCheck} onClick={handleUpdateFase} />
                                                            <MdClose className={styles.iconClose} onClick={() => setEditingFaseId(null)} />
                                                        </div>
                                                    </div>
                                                ) : (
                                                    <div className={styles.displayRow}>
                                                        <div className={styles.phaseInfo}>
                                                            <MdHistory className={styles.iconHistory} />
                                                            <span className={styles.phaseName}>{fase.nombre}</span>
                                                            {fase.id === dataEvaluacionDocente?.faseActualID && (
                                                                <span className={styles.activeBadge}>Actual</span>
                                                            )}
                                                        </div>
                                                        <div className={styles.itemActions}>
                                                            <MdEdit className={styles.iconEdit} onClick={() => handleEditClick(fase)} />
                                                            <MdDelete className={styles.iconDelete} onClick={() => handleDeleteFase(fase.id, fase.nombre)} />
                                                        </div>
                                                    </div>
                                                )}
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </>
                    )}
                </div>
            </div>,
            container
        )
        : null
}

export default ConfigurarFaseEspecialistas
