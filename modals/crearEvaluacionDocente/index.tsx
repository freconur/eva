import { createPortal } from "react-dom"
import styles from './crearEvaluacionDocentes.module.css'
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { useGlobalContext } from "@/features/context/GlolbalContext";
import { useAgregarEvaluaciones } from "@/features/hooks/useAgregarEvaluaciones";
import { Alternativa, Alternativas, Evaluaciones, PreguntasRespuestas, Psicolinguistica } from "@/features/types/types";
import { RiLoader4Line } from "react-icons/ri";
import { usePsicolinguistica } from "@/features/hooks/usePsicolinguistica";
import UseEvaluacionDocentes from "@/features/hooks/UseEvaluacionDocentes";
import UseEvaluacionDirectores from "@/features/hooks/UseEvaluacionDirectores";

interface Props {
  handleShowModalCrearEvaluacion: () => void
}

const CrearEvaluacionDocente = ({ handleShowModalCrearEvaluacion }: Props) => {
  const { preguntasRespuestas, sizePreguntas, preguntasRespuestasEstudiante, loaderSalvarPregunta } = useGlobalContext()
  const [ordenLimitePregunta, setOrdenLimitePregunta] = useState(0)
  const [activarBotonSiguiente, setActivarBotonSiguiente] = useState(false)
  const [repuestasCorrectas, setRespuestasCorrectas] = useState(0)
  const { prEstudiantes, salvarPreguntRespuestaEstudiante, getPreguntasRespuestas } = useAgregarEvaluaciones()
  let container;
  if (typeof window !== "undefined") {
    container = document.getElementById("portal-modal");
  }
  const { register, handleSubmit, watch, reset, formState: { errors } } = useForm()

  const { createEvaluacionesDirectores } = UseEvaluacionDirectores()

  const handleCreateEvaluacion = handleSubmit((data) => {
    createEvaluacionesDirectores(data)
    reset()
  })

  return container
    ? createPortal(
      <div className={styles.containerModal}>
        <div className={styles.containerSale}>
          {loaderSalvarPregunta ? (
            <div className={styles.loaderContainer}>
              <RiLoader4Line className={styles.loaderIcon} />
              <span>Guardando respuestas...</span>
            </div>
          ) : (
            <>
              <div className={styles.closeModalContainer}>
                <button className={styles.close} onClick={handleShowModalCrearEvaluacion}>
                  Cerrar
                </button>
              </div>
              <h3 className={styles.title}>Crear Evaluación Desempeño del director</h3>
              <form onSubmit={handleCreateEvaluacion}>
                <div className="w-full my-2">
                  <label className={styles.inputLabel}>Nombre de evaluación:</label>
                  <input
                    {...register("name", {
                      required: { value: true, message: "El nombre de evaluación es requerido" },
                      minLength: { value: 2, message: "El nombre debe tener un mínimo de 2 caracteres" },
                      maxLength: { value: 50, message: "El nombre debe tener un máximo de 50 caracteres" },
                    })}
                    className={styles.inputNombresDni}
                    type="text"
                    placeholder="Ingrese el nombre de la evaluación"
                  />
                  {errors.name && <span className={styles.errorMessage}>{errors.name.message as string}</span>}
                </div>
                <div className="mb-3">
                  <label className={styles.inputLabel}>Categoría:</label>
                  <select 
                    {...register("categoria", {
                      required: { value: true, message: "La categoría es requerida" },
                    })}
                    className={styles.inputNombresDni}
                  >
                    <option value="">Seleccione una categoría</option>
                    <option value="LECTURA">LECTURA</option>
                    <option value="MATEMÁTICA">MATEMÁTICA</option>
                  </select>
                  {errors.categoria && <span className={styles.errorMessage}>{errors.categoria.message as string}</span>}
                </div>
                <button type="submit" className={styles.buttonCrearEvaluacion}>
                  Guardar
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

export default CrearEvaluacionDocente