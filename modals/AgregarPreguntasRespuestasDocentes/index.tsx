import { createPortal } from "react-dom"
import styles from './agregarPreguntaRespuestas.module.css'
import { useState } from "react";
import { useForm } from "react-hook-form";
import { useGlobalContext } from "@/features/context/GlolbalContext";
import { useAgregarEvaluaciones } from "@/features/hooks/useAgregarEvaluaciones";
import UseEvaluacionDocentes from "@/features/hooks/UseEvaluacionDocentes";
import { RiLoader4Line } from "react-icons/ri";
import UseEvaluacionDirectores from "@/features/hooks/UseEvaluacionDirectores";

interface Props {
  handleShowModalPreguntas: () => void,
  idEvaluacion: string
}

const AgregarPreguntasRespuestasDocentes = ({ handleShowModalPreguntas, idEvaluacion }: Props) => {
  const { currentUserData, loaderModales } = useGlobalContext()
  const [typeRol, setTypeRol] = useState("")
  const [institucionData, setInstitucionData] = useState("")
  const [rolesData, setRolesData] = useState<number[]>([])
  const [cursosProfesor, setCursosProfesor] = useState<string[]>([])

  const { addPreguntasEvaluacionDocente } = UseEvaluacionDocentes()
  let container;
  if (typeof window !== "undefined") {
    container = document.getElementById("portal-modal");
  }
  const { register, handleSubmit, watch, reset, formState: { errors } } = useForm()
  const handleSubmitform = handleSubmit(async (data) => {
    addPreguntasEvaluacionDocente(data, idEvaluacion)
    reset()
  })

  return container
    ? createPortal(
      <div className={styles.containerModal}>
        {
          loaderModales ?
            <div className={styles.containerSale}>
              <div className={styles.loaderContainer}>
                <RiLoader4Line className={styles.loaderIcon} />
                <p className={styles.loaderText}>guardando pregunta...</p>
              </div>
            </div>
            :
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
                    {...register("criterio",
                      {
                        required: { value: true, message: "criterio es requerido" },
                        minLength: { value: 1, message: "criterio debe tener un minimo de 1 caracteres" },
                        maxLength: { value: 300, message: "criterio debe tener un maximo de 300 caracteres" },
                      }
                    )}
                  />
                  {errors.criterio && <span className={styles.errorMessage}>{errors.criterio.message as string}</span>}
                </div>
                <div className={styles.formGroup}>
                  <h3 className={styles.titlePregunta}>niveles</h3>
                  <div className={styles.nivelesContainer}>
                    <div className={styles.nivelItem}>
                      <div className={styles.numberAlternativas}>1.</div>
                      <textarea
                        className={styles.textAreaPregunta}
                        placeholder="descripción del nivel"
                        {...register("a",
                          {
                            required: { value: true, message: "criterio es requerido" },
                            minLength: { value: 1, message: "criterio debe tener un minimo de 1 caracteres" },
                            maxLength: { value: 300, message: "criterio debe tener un maximo de 300 caracteres" },
                          }
                        )}
                      />
                      {errors.a && <span className={styles.errorMessage}>{errors.a.message as string}</span>}
                    </div>
                    <div className={styles.nivelItem}>
                      <div className={styles.numberAlternativas}>2.</div>
                      <textarea
                        className={styles.textAreaPregunta}
                        placeholder="descripción del nivel"
                        {...register("b",
                          {
                            required: { value: true, message: "criterio es requerido" },
                            minLength: { value: 1, message: "criterio debe tener un minimo de 1 caracteres" },
                            maxLength: { value: 300, message: "criterio debe tener un maximo de 300 caracteres" },
                          }
                        )}
                      />
                      {errors.b && <span className={styles.errorMessage}>{errors.b.message as string}</span>}
                    </div>
                    <div className={styles.nivelItem}>
                      <div className={styles.numberAlternativas}>3.</div>
                      <textarea
                        className={styles.textAreaPregunta}
                        placeholder="descripción del nivel"
                        {...register("c",
                          {
                            required: { value: true, message: "criterio es requerido" },
                            minLength: { value: 1, message: "criterio debe tener un minimo de 1 caracteres" },
                            maxLength: { value: 300, message: "criterio debe tener un maximo de 300 caracteres" },
                          }
                        )}
                      />
                      {errors.c && <span className={styles.errorMessage}>{errors.c.message as string}</span>}
                    </div>
                    <div className={styles.nivelItem}>
                      <div className={styles.numberAlternativas}>4.</div>
                      <textarea
                        className={styles.textAreaPregunta}
                        placeholder="descripción del nivel"
                        {...register("d",
                          {
                            required: { value: true, message: "criterio es requerido" },
                            minLength: { value: 1, message: "criterio debe tener un minimo de 1 caracteres" },
                            maxLength: { value: 300, message: "criterio debe tener un maximo de 300 caracteres" },
                          }
                        )}
                      />
                      {errors.d && <span className={styles.errorMessage}>{errors.d.message as string}</span>}
                    </div>
                  </div>
                </div>
                <button type="submit" className={styles.buttonSubmit}>guardar</button>
              </form>
            </div>
        }
      </div>,
      container
    )
    : null
}

export default AgregarPreguntasRespuestasDocentes