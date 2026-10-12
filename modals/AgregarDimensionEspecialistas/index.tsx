import { createPortal } from "react-dom"
import styles from './agregarDimension.module.css'
import { useForm } from "react-hook-form";
import { useGlobalContext } from "@/features/context/GlolbalContext";
import { RiLoader4Line } from "react-icons/ri";
import useEvaluacionDesempenoBase from "@/features/hooks/useEvaluacionDesempenoBase";

interface Props {
    handleShowModalDimension?: () => void,
    onClose?: () => void,
    onSuccess?: () => void,
    idEvaluacion: string,
    collectionName?: string
}

const AgregarDimensionEspecialistas = ({
    handleShowModalDimension,
    onClose,
    onSuccess,
    idEvaluacion,
    collectionName = 'evaluaciones-especialista'
}: Props) => {
    const { loaderModales } = useGlobalContext()
    const { createDimension } = useEvaluacionDesempenoBase({ collectionName })
    const closeHandler = onClose || handleShowModalDimension;

    let container;
    if (typeof window !== "undefined") {
        container = document.getElementById("portal-modal");
    }

    const { register, handleSubmit, reset, formState: { errors, isSubmitting } } = useForm()
    const handleSubmitform = handleSubmit(async (data) => {
        await createDimension(idEvaluacion, data.nombre)
        reset()
        if (onSuccess) onSuccess()
        if (closeHandler) closeHandler()
    })

    return container
        ? createPortal(
            <div className={styles.containerModal}>
                {loaderModales ? (
                    <div className={styles.loaderContainer}>
                        <RiLoader4Line className={styles.loaderIcon} />
                        <p className={styles.loaderText}>guardando dominio...</p>
                    </div>
                ) : (
                    <div className={styles.containerSale}>
                        <div className={styles.closeModalContainer}>
                            <h3 className={styles.title}>agregar dominio</h3>
                            <div className={styles.close} onClick={closeHandler}>cerrar</div>
                        </div>
                        <form onSubmit={handleSubmitform}>
                            <div className={styles.formGroup}>
                                <p className={styles.titlePregunta}>nombre del dominio</p>
                                <input
                                    type="text"
                                    className={styles.alternativaInput}
                                    placeholder="Ej: DOMINIO 1: Creación de cuentas"
                                    {...register("nombre", {
                                        required: { value: true, message: "el nombre es requerido" },
                                        minLength: { value: 1, message: "el nombre debe tener un mínimo de 1 carácter" },
                                    })}
                                />
                                {errors.nombre && <span className={styles.error}>{errors.nombre.message as string}</span>}
                            </div>
                            <button type="submit" disabled={isSubmitting || loaderModales} className={styles.submitButton}>guardar</button>
                        </form>
                    </div>
                )}
            </div>,
            container
        )
        : null
}

export default AgregarDimensionEspecialistas
