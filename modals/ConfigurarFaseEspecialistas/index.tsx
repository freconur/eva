import { createPortal } from "react-dom"
import styles from './configurarFase.module.css'
import { useGlobalContext } from "@/features/context/GlolbalContext";
import { RiLoader4Line } from "react-icons/ri";
import { useState } from "react";
import UseEvaluacionEspecialistas from "@/features/hooks/UseEvaluacionEspecialistas";

interface Props {
    handleShowConfigurarFase: () => void,
    idEvaluacion: string,
    faseActual?: string
}

const ConfigurarFaseEspecialistas = ({ handleShowConfigurarFase, idEvaluacion, faseActual }: Props) => {
    const { loaderModales } = useGlobalContext()
    const { updateFaseEvaluacion } = UseEvaluacionEspecialistas()
    const [nombreFase, setNombreFase] = useState(faseActual || "")

    const handleSave = async () => {
        if (nombreFase.trim() === "") return;
        await updateFaseEvaluacion(idEvaluacion, nombreFase);
        handleShowConfigurarFase();
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
                        <p className={styles.loaderText}>Iniciando nueva fase...</p>
                    </div>
                ) : (
                    <div className={styles.containerSale}>
                        <div className={styles.closeModalContainer}>
                            <h3 className={styles.title}>Nueva Etapa de Evaluación</h3>
                            <div className={styles.close} onClick={handleShowConfigurarFase}>cerrar</div>
                        </div>
                        <div className={styles.description}>
                            Al iniciar una nueva etapa, todas las evaluaciones que se realicen a partir de ahora se agruparán bajo este nombre. Esto evita que se mezclen con evaluaciones anteriores en los reportes.
                        </div>
                        <div className={styles.formGroup}>
                            <label className={styles.label}>Nombre de la Etapa (Fase)</label>
                            <input
                                type="text"
                                className={styles.input}
                                placeholder="Ej: Segunda Ronda Marzo, Seguimiento Trimestral..."
                                value={nombreFase}
                                onChange={(e) => setNombreFase(e.target.value)}
                                autoFocus
                            />
                        </div>
                        <div className={styles.actions}>
                            <button className={styles.submitButton} onClick={handleSave} disabled={nombreFase.trim() === ""}>
                                Empezar Nueva Etapa
                            </button>
                        </div>
                    </div>
                )}
            </div>,
            container
        )
        : null
}

export default ConfigurarFaseEspecialistas
