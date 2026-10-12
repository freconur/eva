import { createPortal } from "react-dom"
import styles from './configurarDescripcion.module.css'
import { useGlobalContext } from "@/features/context/GlolbalContext";
import { RiLoader4Line } from "react-icons/ri";
import { useEffect, useState } from "react";
import useEvaluacionDesempenoBase from "@/features/hooks/useEvaluacionDesempenoBase";

interface Props {
    handleShowConfigurarDescripcion?: () => void,
    onClose?: () => void,
    onSuccess?: () => void,
    idEvaluacion: string,
    descripcionActual?: string,
    collectionName?: string
}

const ConfigurarDescripcionEspecialistas = ({
    handleShowConfigurarDescripcion,
    onClose,
    onSuccess,
    idEvaluacion,
    descripcionActual,
    collectionName = 'evaluaciones-especialista'
}: Props) => {
    const { loaderModales } = useGlobalContext()
    const { updateDescripcionEvaluacion } = useEvaluacionDesempenoBase({ collectionName })
    const closeHandler = onClose || handleShowConfigurarDescripcion;
    const [descripcion, setDescripcion] = useState<string>('')

    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'Escape' && closeHandler) {
                closeHandler();
            }
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [closeHandler]);

    useEffect(() => {
        if (descripcionActual) {
            setDescripcion(descripcionActual);
        }
    }, [descripcionActual]);

    const handleSave = async () => {
        await updateDescripcionEvaluacion(idEvaluacion, descripcion);
        if (onSuccess) onSuccess();
        if (closeHandler) closeHandler();
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
                            <div className={styles.close} onClick={closeHandler}>cerrar</div>
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
