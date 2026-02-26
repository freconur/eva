import { createPortal } from "react-dom"
import styles from './updateDimension.module.css'
import { useForm } from "react-hook-form";
import { useGlobalContext } from "@/features/context/GlolbalContext";
import { RiLoader4Line } from "react-icons/ri";
import UseEvaluacionEspecialistas from "@/features/hooks/UseEvaluacionEspecialistas";
import { DimensionEspecialista } from "@/features/types/types";
import { useEffect } from "react";

interface Props {
    handleShowUpdateDimension: () => void,
    idEvaluacion: string,
    dimensionUpdate: DimensionEspecialista
}

const UpdateDimensionEspecialistas = ({ handleShowUpdateDimension, idEvaluacion, dimensionUpdate }: Props) => {
    const { loaderModales } = useGlobalContext()
    const { updateDimensionEspecialista } = UseEvaluacionEspecialistas()

    let container;
    if (typeof window !== "undefined") {
        container = document.getElementById("portal-modal");
    }

    const { register, handleSubmit, reset, formState: { errors } } = useForm({
        defaultValues: {
            nombre: dimensionUpdate.nombre
        }
    })

    useEffect(() => {
        if (dimensionUpdate) {
            reset({ nombre: dimensionUpdate.nombre });
        }
    }, [dimensionUpdate, reset]);
    const handleSubmitform = handleSubmit(async (data) => {
        if (dimensionUpdate.id && data.nombre) {
            await updateDimensionEspecialista(idEvaluacion, dimensionUpdate.id, data.nombre)
            handleShowUpdateDimension()
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
                            <div className={styles.close} onClick={handleShowUpdateDimension}>cerrar</div>
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
                            <button type="submit" className={styles.submitButton}>actualizar</button>
                        </form>
                    </div>
                )}
            </div>,
            container
        )
        : null
}

export default UpdateDimensionEspecialistas
