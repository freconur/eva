import { createPortal } from "react-dom"
import styles from './crearEvaluacionCurricular.module.css'
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { useGlobalContext } from "@/features/context/GlolbalContext";
import { useAgregarEvaluaciones } from "@/features/hooks/useAgregarEvaluaciones";
import { Alternativa, Alternativas, Evaluaciones, PreguntasRespuestas, Psicolinguistica } from "@/features/types/types";
import { RiLoader4Line } from "react-icons/ri";
import { usePsicolinguistica } from "@/features/hooks/usePsicolinguistica";
import UseEvaluacionDocentes from "@/features/hooks/UseEvaluacionDocentes";
import UseEvaluacionDirectores from "@/features/hooks/UseEvaluacionDirectores";
import UseEvaluacionEspecialistas from "@/features/hooks/UseEvaluacionEspecialistas";
import useEvaluacionCurricular from "@/features/hooks/useEvaluacionCurricular";

interface Props {
  handleShowModalCrearEvaluacion: () => void
}

const CrearEvaluacionCurricular = ({ handleShowModalCrearEvaluacion }: Props) => {
  const { loaderSalvarPregunta } = useGlobalContext()
  const { createEvaluacionCurricular, getEvaluacionCurricular } = useEvaluacionCurricular()
  let container;
  if (typeof window !== "undefined") {
    container = document.getElementById("portal-modal");
  }
  const { register, handleSubmit, watch, reset, formState: { errors } } = useForm()
  const handleCreateEvaluacion = handleSubmit((data) => {
    createEvaluacionCurricular(data)
    reset()
  })

  return container
    ? createPortal(
      <div className={styles.containerModal}>
        <div className={styles.containerSale}>
          {loaderSalvarPregunta ? (
            <div className={styles.loadingContainer}>
              <RiLoader4Line className={styles.loadingIcon} />
              <span className={styles.loadingText}>Guardando evaluación...</span>
            </div>
          ) : (
            <>
              <div className={styles.closeModalContainer}>
                <div className={styles.close} onClick={handleShowModalCrearEvaluacion}>
                  Cerrar
                </div>
              </div>
              <h3 className={styles.title}>Crear instrumento de monitoreo </h3>
              <form onSubmit={handleCreateEvaluacion}>
                <div className={styles.formGroup}>
                  <label className={styles.inputLabel}>
                    Nombre de la evaluación
                  </label>
                  <input
                    {...register("name", {
                      required: { value: true, message: "El nombre de la evaluación es requerido" },
                      minLength: { value: 2, message: "El nombre debe tener un mínimo de 2 caracteres" },
                      maxLength: { value: 50, message: "El nombre debe tener un máximo de 50 caracteres" },
                    })}
                    className={styles.inputNombresDni}
                    type="text"
                    placeholder="Ingrese el nombre de la evaluación"
                  />
                  {errors.name && (
                    <span className={styles.errorMessage}>
                      {errors.name.message as string}
                    </span>
                  )}
                </div>
                <button
                  type="submit"
                  className={styles.buttonCrearEvaluacion}
                >
                  Guardar evaluación
                </button>
              </form>
            </>
          )}
        </div>
      </div>,
      container
    )
    : null
}

export default CrearEvaluacionCurricular