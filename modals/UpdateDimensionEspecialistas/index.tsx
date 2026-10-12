import { createPortal } from "react-dom"
import styles from './updateDimension.module.css'
import { useForm } from "react-hook-form";
import { useGlobalContext } from "@/features/context/GlolbalContext";
import { RiLoader4Line } from "react-icons/ri";
import useEvaluacionDesempenoBase from "@/features/hooks/useEvaluacionDesempenoBase";
import { DimensionEspecialista } from "@/features/types/types";
import { useEffect } from "react";

interface Props {
    handleShowUpdateDimension?: () => void,
    onClose?: () => void,
    onSuccess?: () => void,
    idEvaluacion: string,
    dimensionUpdate?: DimensionEspecialista | null,
    dimension?: DimensionEspecialista | null,
    collectionName?: string
}

const UpdateDimensionEspecialistas = ({
    handleShowUpdateDimension,
    onClose,
    onSuccess,
    idEvaluacion,
    dimensionUpdate,
    dimension,
    collectionName = 'evaluaciones-especialista'
}: Props) => {
    const { loaderModales } = useGlobalContext()
    const { updateDimension } = useEvaluacionDesempenoBase({ collectionName })
    const targetDimension = dimensionUpdate || dimension;
    const closeHandler = onClose || handleShowUpdateDimension;

    let container;
    if (typeof window !== "undefined") {
        container = document.getElementById("portal-modal");
    }

    const { register, handleSubmit, reset, formState: { errors, isSubmitting } } = useForm({
        defaultValues: {
            nombre: targetDimension?.nombre || ''
        }
    })

    useEffect(() => {
        if (targetDimension) {
            reset({ nombre: targetDimension.nombre || '' });
        }
    }, [targetDimension, reset]);

    const handleSubmitform = handleSubmit(async (data) => {
        if (targetDimension?.id && data.nombre) {
            await updateDimension(idEvaluacion, targetDimension.id, data.nombre)
            if (onSuccess) onSuccess()
            if (closeHandler) closeHandler()
        }
    })

    return container
        ? createPortal(
            <div className={styles.containerModal}>
                {loaderModales ? (
                    <div className={styles.loaderContainer}>
                        <RiLoader4Line className={styles.loaderIcon} />
                        <p className={styles.loaderText}>actualizando dominio...</p>
                    </div>
                ) : (
                    <div className={styles.containerSale}>
                        <div className={styles.closeModalContainer}>
                            <h3 className={styles.title}>editar dominio</h3>
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
                            <button type="submit" disabled={isSubmitting || loaderModales} className={styles.submitButton}>actualizar</button>
                        </form>
                    </div>
                )}
            </div>,
            container
        )
        : null
}

export default UpdateDimensionEspecialistas
