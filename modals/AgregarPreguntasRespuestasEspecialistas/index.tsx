import { createPortal } from "react-dom"
import styles from './agregarPreguntaRespuestas.module.css'
import { useForm } from "react-hook-form";
import { useGlobalContext } from "@/features/context/GlolbalContext";
import { RiLoader4Line } from "react-icons/ri";
import UseEvaluacionEspecialistas from "@/features/hooks/UseEvaluacionEspecialistas";

interface Props {
  handleShowModalPreguntas: () => void,
  idEvaluacion: string
}

const AgregarPreguntasRespuestasEspecialistas = ({ handleShowModalPreguntas, idEvaluacion }: Props) => {
  const { currentUserData, loaderModales } = useGlobalContext()
  const { addPreguntasEvaluacionEspecialistas } = UseEvaluacionEspecialistas()
  
  let container;
  if (typeof window !== "undefined") {
    container = document.getElementById("portal-modal");
  }
  
  const { register, handleSubmit, watch, reset, formState: { errors } } = useForm()
  const handleSubmitform = handleSubmit(async (data) => {
    addPreguntasEvaluacionEspecialistas(data, idEvaluacion)
    reset()
  })

  return container
    ? createPortal(
      <div className={styles.containerModal}>
        {loaderModales ? (
          <div className={styles.loaderContainer}>
            <RiLoader4Line className={styles.loaderIcon} />
            <p className={styles.loaderText}>guardando pregunta...</p>
          </div>
        ) : (
          <div className={styles.containerSale}>
            <div className={styles.closeModalContainer}>
              <h3 className={styles.title}>agregar preguntas y respuestas</h3>
              <div className={styles.close} onClick={handleShowModalPreguntas}>cerrar</div>
            </div>
            <form onSubmit={handleSubmitform}>
              <div className={styles.formGroup}>
                <p className={styles.titlePregunta}>criterio</p>
                <input
                  type="text"
                  className={styles.alternativaInput}
                  placeholder="criterio a evaluar"
                  {...register("criterio", {
                    required: { value: true, message: "criterio es requerido" },
                    minLength: { value: 1, message: "criterio debe tener un minimo de 1 caracteres" },
                    maxLength: { value: 300, message: "criterio debe tener un maximo de 300 caracteres" },
                  })}
                />
                {errors.criterio && <span className={styles.error}>{errors.criterio.message as string}</span>}
              </div>
              <div className={styles.formGroup}>
                <h3 className={styles.titlePregunta}>niveles</h3>
                <div className={styles.levelsContainer}>
                  {['a', 'b', 'c', 'd'].map((level, index) => (
                    <div key={level} className={styles.levelItem}>
                      <div className={styles.numberContainer}>
                        <p className={styles.numberAlternativas}>{index + 1}.</p>
                      </div>
                      <textarea
                        className={styles.textAreaPregunta}
                        placeholder="descripción del nivel"
                        {...register(level, {
                          required: { value: true, message: "criterio es requerido" },
                          minLength: { value: 1, message: "criterio debe tener un minimo de 1 caracteres" },
                          maxLength: { value: 300, message: "criterio debe tener un maximo de 300 caracteres" },
                        })}
                      />
                      {errors[level] && <span className={styles.error}>{errors[level].message as string}</span>}
                    </div>
                  ))}
                </div>
              </div>
              <button type="submit" className={styles.submitButton}>guardar</button>
            </form>
          </div>
        )}
      </div>,
      container
    )
    : null
}

export default AgregarPreguntasRespuestasEspecialistas