import { createPortal } from "react-dom"
import styles from './configurarDescripcion.module.css'
import { useGlobalContext } from "@/features/context/GlolbalContext";
import { RiLoader4Line } from "react-icons/ri";
import { useEffect, useState } from "react";
import UseEvaluacionEspecialistas from "@/features/hooks/UseEvaluacionEspecialistas";

interface Props {
    handleShowConfigurarDescripcion: () => void,
    idEvaluacion: string,
    descripcionActual?: string
}

const ConfigurarDescripcionEspecialistas = ({ handleShowConfigurarDescripcion, idEvaluacion, descripcionActual }: Props) => {
    const { loaderModales } = useGlobalContext()
    const { updateDescripcionEvaluacion } = UseEvaluacionEspecialistas()
    const [descripcion, setDescripcion] = useState<string>('')

    useEffect(() => {
        if (descripcionActual) {
            setDescripcion(descripcionActual);
        }
    }, [descripcionActual]);

    const handleSave = async () => {
        await updateDescripcionEvaluacion(idEvaluacion, descripcion);
        handleShowConfigurarDescripcion();
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
                        <p className={styles.loaderText}>guardando descripción...</p>
                    </div>
                ) : (
                    <div className={styles.containerSale}>
                        <div className={styles.closeModalContainer}>
                            <h3 className={styles.title}>Configurar título PDF</h3>
                            <div className={styles.close} onClick={handleShowConfigurarDescripcion}>cerrar</div>
                        </div>
                        <div className={styles.description}>
                            Escribe un título principal. Este título se verá al exportar en el PDF.
                        </div>
                        <div className={styles.textareaGroup}>
                            <label className={styles.label}>Título Principal para el PDF</label>
                            <textarea
                                className={styles.textarea}
                                placeholder="Escribe aquí el título..."
                                value={descripcion}
                                onChange={(e) => setDescripcion(e.target.value)}
                            />
                        </div>
                        <div className={styles.actions}>
                            <button className={styles.submitButton} onClick={handleSave}>guardar título</button>
                        </div>
                    </div>
                )}
            </div>,
            container
        )
        : null
}

export default ConfigurarDescripcionEspecialistas
