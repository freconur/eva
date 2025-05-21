import { createPortal } from "react-dom"
import styles from './agregarPreguntaRespuestas.module.css'
import { useState } from "react";
import { useForm } from "react-hook-form";
import { useGlobalContext } from "@/features/context/GlolbalContext";
import { useAgregarEvaluaciones } from "@/features/hooks/useAgregarEvaluaciones";

interface Props {
  showModal: boolean,
  handleshowModal: () => void,
  id: string
  // nombreEvaluacion: string
}

const AgregarPreguntasRespuestas = ({ id, showModal, handleshowModal }: Props) => {

  const { currentUserData } = useGlobalContext()
  const [typeRol, setTypeRol] = useState("")
  const [institucionData, setInstitucionData] = useState("")
  const [rolesData, setRolesData] = useState<number[]>([])
  const [cursosProfesor, setCursosProfesor] = useState<string[]>([])

  const { guardarPreguntasRespuestas } = useAgregarEvaluaciones()
  let container;
  if (typeof window !== "undefined") {
    container = document.getElementById("portal-modal");
  }
  const { register, handleSubmit, watch, reset, formState: { errors } } = useForm()
  const handleSubmitform = handleSubmit(async (data) => {
    console.log('data', data)
    let rtaConvert: any = []
    Object.entries(data).forEach(([key, value]) => {
      if (key.length === 1) {
        if (value.length > 0)
          rtaConvert.push({ alternativa: key, descripcion: value })
      }

    });
    // if (rtaConvert.length === 3) {
    if (rtaConvert.length >= 3) {
      guardarPreguntasRespuestas({ id: id, preguntaDocente: data.preguntaDocente, pregunta: data.pregunta, respuesta: data.respuesta, alternativas: rtaConvert })
      console.log('rtaConvert', rtaConvert)
      reset()
    }
  })
  console.log('id de modal', id)

  return container
    ? createPortal(
      <div className={styles.containerModal}>
        <div className={styles.containerSale}>
          <div className={styles.closeModalContainer}>
            <h3 className={styles.title}>agregar preguntas y respuestas</h3>
            <div className={styles.close} onClick={handleshowModal}>cerrar</div>
          </div>

          <form className={styles.formulario} onSubmit={handleSubmitform} >
            <div>
              <div className='w-full my-2'>
                {/* <p className={styles.titlePregunta}>pregunta:</p> */}
                <textarea
                  {...register("pregunta",
                    {
                      required: { value: true, message: "pregunta es requerido" },
                      minLength: { value: 5, message: "nombre debe tener un minimo de 5 caracteres" },
                      maxLength: { value: 400, message: "nombre debe tener un maximo de 150 caracteres" },
                    }
                  )}
                  className={styles.textAreaPregunta}
                  placeholder="PREGUNTA DE EXAMEN"

                />
              </div>
              <div className='w-full my-2'>
                {/* <p className={styles.titlePregunta}>pregunta especialidad:</p> */}
                <textarea
                  {...register("preguntaDocente",
                    {
                      required: { value: true, message: "pregunta especialidad es requerido" },
                      minLength: { value: 5, message: "nombre debe tener un minimo de 5 caracteres" },
                      maxLength: { value: 400, message: "nombre debe tener un maximo de 150 caracteres" },
                    }
                  )}
                  className={styles.textAreaPregunta}
                  placeholder="PREGUNTA DE ACTUACIÓN"

                />
              </div>

            </div>
            <div>
              <p className={styles.titlePregunta}>alternativas</p>
              <div className={styles.inputAlternativas}>

                {/* alternativa A */}
                <div className="flex gap-3 justify-center items-center">
                  <p className={styles.alternativa}>a.</p>
                  <input
                    {...register("a",
                      {
                        required: { value: true, message: "institucion es requerido" },
                        minLength: { value: 1, message: "nombre debe tener un minimo de 1 caracteres" },
                        maxLength: { value: 150, message: "nombre debe tener un maximo de 150 caracteres" },
                      }
                    )}
                    className={styles.alternativaInput}
                    type="text"
                    placeholder="alternativa a"
                  />
                </div>

                {/* alternativa B */}
                <div className="flex gap-3 justify-center items-center">
                  <p className={styles.alternativa}>b.</p>
                  <input
                    {...register("b",
                      {
                        required: { value: true, message: "institucion es requerido" },
                        minLength: { value: 1, message: "nombre debe tener un minimo de 1 caracteres" },
                        maxLength: { value: 150, message: "nombre debe tener un maximo de 150 caracteres" },
                      }
                    )}
                    className={styles.alternativaInput}
                    type="text"
                    placeholder="alternativa b"
                  />
                </div>
                {/* alternativa C */}
                <div className="flex gap-3 justify-center items-center">
                  <p className={styles.alternativa}>c.</p>
                  <input
                    {...register("c",
                      {
                        required: { value: true, message: "institucion es requerido" },
                        minLength: { value: 1, message: "nombre debe tener un minimo de 1 caracteres" },
                        maxLength: { value: 150, message: "nombre debe tener un maximo de 150 caracteres" },
                      }
                    )}
                    className={styles.alternativaInput}
                    type="text"
                    placeholder="alternativa c"
                  />
                </div>
                <div className="flex gap-3 justify-center items-center">
                  <p className={styles.alternativa}>d.</p>
                  <input
                    {...register("d")}
                    className={styles.alternativaInput}
                    type="text"
                    placeholder="alternativa d"
                  />
                </div>
              </div>
            </div>
            <div className=" gap-3">
              <p className={styles.titlePregunta}>respuesta correcta</p>
              <input
                {...register("respuesta",
                  {
                    required: { value: true, message: "institucion es requerido" },
                    minLength: { value: 1, message: "nombre debe tener un minimo de 1 caracteres" },
                    maxLength: { value: 1, message: "nombre debe tener un maximo de 1 caracteres" },
                  }
                )}
                className={styles.alternativaInput}
                type="text"
                placeholder="escribe la alternativa correcta"
              />
            </div>

            <button className='flex justify-center items-center bg-blue-500 hover:bg-blue-300 duration-300 p-3 rounded-md w-full text-white hover:text-slate-600 uppercase'>guardar</button>
          </form>
        </div>
      </div>,
      container
    )
    : null
}

export default AgregarPreguntasRespuestas