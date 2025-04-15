import { createPortal } from "react-dom"
import styles from './agregarPreguntaRespuestas.module.css'
import { useState } from "react";
import { useForm } from "react-hook-form";
import { useGlobalContext } from "@/features/context/GlolbalContext";
import { useAgregarEvaluaciones } from "@/features/hooks/useAgregarEvaluaciones";
import UseEvaluacionDocentes from "@/features/hooks/UseEvaluacionDocentes";
import { RiLoader4Line } from "react-icons/ri";

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
            <div className="flex w-full mt-5 items-center m-auto justify-center">
              <RiLoader4Line className="animate-spin text-3xl text-slate-500 " />
              <p className="text-slate-500">guardando pregunta...</p>
            </div>
            :

            <div className={styles.containerSale}>
              <div className={styles.closeModalContainer}>
                <h3 className={styles.title}>agregar preguntas y respuestas</h3>
                <div className={styles.close} onClick={handleShowModalPreguntas}>cerrar</div>
              </div>
              <form onSubmit={handleSubmitform}>
                <div className="my-5">
                  <p className={styles.titlePregunta}>criterio</p>
                  <input
                    type="text"
                    className={styles.alternativaInput}
                    placeholder="criterio a evaluar"
                    {...register("criterio",
                      {
                        required: { value: true, message: "criterio es requerido" },
                        minLength: { value: 1, message: "criterio debe tener un minimo de 1 caracteres" },
                        maxLength: { value: 150, message: "criterio debe tener un maximo de 150 caracteres" },
                      }
                    )}
                  />
                  {errors.criterio && <span className='text-red-400 text-sm'>{errors.criterio.message as string}</span>}
                </div>
                <div>
                  <h3 className={styles.titlePregunta}>niveles</h3>
                  <div className="grid gap-3">
                    <div className="flex gap-3">
                      <div className="flex justify-center items-center"><p className={styles.numberAlternativas}>1.</p></div>
                      <textarea
                        className={styles.textAreaPregunta}
                        placeholder="descripción del nivel"
                        {...register("a",
                          {
                            required: { value: true, message: "criterio es requerido" },
                            minLength: { value: 1, message: "criterio debe tener un minimo de 1 caracteres" },
                            maxLength: { value: 150, message: "criterio debe tener un maximo de 150 caracteres" },
                          }
                        )}
                      />
                      {errors.a && <span className='text-red-400 text-sm'>{errors.a.message as string}</span>}

                    </div>
                    <div className="flex gap-3">
                      <div className="flex justify-center items-center"><p className={styles.numberAlternativas}>2.</p></div>
                      <textarea
                        className={styles.textAreaPregunta}
                        placeholder="descripción del nivel"
                        {...register("b",
                          {
                            required: { value: true, message: "criterio es requerido" },
                            minLength: { value: 1, message: "criterio debe tener un minimo de 1 caracteres" },
                            maxLength: { value: 150, message: "criterio debe tener un maximo de 150 caracteres" },
                          }
                        )}
                      />
                      {errors.b && <span className='text-red-400 text-sm'>{errors.b.message as string}</span>}

                    </div>
                    <div className="flex gap-3">
                      <div className="flex justify-center items-center"><p className={styles.numberAlternativas}>3.</p></div>
                      <textarea
                        className={styles.textAreaPregunta}
                        placeholder="descripción del nivel"
                        {...register("c",
                          {
                            required: { value: true, message: "criterio es requerido" },
                            minLength: { value: 1, message: "criterio debe tener un minimo de 1 caracteres" },
                            maxLength: { value: 150, message: "criterio debe tener un maximo de 150 caracteres" },
                          }
                        )}
                      />
                      {errors.c && <span className='text-red-400 text-sm'>{errors.c.message as string}</span>}

                    </div>
                    <div className="flex gap-3">
                      <div className="flex justify-center items-center"><p className={styles.numberAlternativas}>4.</p></div>
                      <textarea
                        className={styles.textAreaPregunta}
                        placeholder="descripción del nivel"
                        {...register("d",
                          {
                            required: { value: true, message: "criterio es requerido" },
                            minLength: { value: 1, message: "criterio debe tener un minimo de 1 caracteres" },
                            maxLength: { value: 200, message: "criterio debe tener un maximo de 150 caracteres" },
                          }
                        )}
                      />
                      {errors.d && <span className='text-red-400 text-sm'>{errors.d.message as string}</span>}

                    </div>
                  </div>
                </div>
                <button className='mt-5 flex justify-center items-center bg-blue-500 hover:bg-blue-300 duration-300 p-3 rounded-md w-full text-white hover:text-slate-600 uppercase'>guardar</button>
              </form>

            </div>
        }
      </div>,
      container
    )
    : null
}

export default AgregarPreguntasRespuestasDocentes