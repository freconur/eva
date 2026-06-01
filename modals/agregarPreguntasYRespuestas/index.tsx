import { createPortal } from "react-dom"
import styles from './agregarPreguntaRespuestas.module.css'
import { useState } from "react";
import { useForm } from "react-hook-form";
import { useGlobalContext } from "@/features/context/GlolbalContext";
import { useAgregarEvaluaciones } from "@/features/hooks/useAgregarEvaluaciones";
import { MdClose } from 'react-icons/md';

interface Props {
  showModal: boolean,
  handleshowModal: () => void,
  id: string
}

const AgregarPreguntasRespuestas = ({ id, showModal, handleshowModal }: Props) => {

  const { currentUserData } = useGlobalContext()
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
      if (key.length === 1 && typeof value === 'string') {
        if (value.trim().length > 0)
          rtaConvert.push({ alternativa: key, descripcion: value.trim() })
      }
    });

    if (rtaConvert.length >= 3) {
      await guardarPreguntasRespuestas({ 
        id: id, 
        preguntaDocente: data.preguntaDocente, 
        pregunta: data.pregunta, 
        respuesta: data.respuesta, 
        alternativas: rtaConvert 
      })
      console.log('rtaConvert', rtaConvert)
      reset()
    }
  })

  return container
    ? createPortal(
      <div className={styles.containerModal}>
        <div className={styles.containerSale}>
          <div className={styles.closeModalContainer}>
            <h3 className={styles.title}>agregar preguntas y respuestas</h3>
            <button type="button" className={styles.closeButton} onClick={handleshowModal} title="Cerrar">
              <MdClose />
            </button>
          </div>

          <form className={styles.formulario} onSubmit={handleSubmitform} >
            <div className={styles.columnaIzquierda}>
              <div className={styles.formGroup}>
                <label className={styles.labelPregunta}>Pregunta del examen *</label>
                <textarea
                  {...register("pregunta", {
                    required: "La pregunta de examen es requerida",
                    minLength: { value: 5, message: "La pregunta debe tener un mínimo de 5 caracteres" },
                    maxLength: { value: 400, message: "La pregunta debe tener un máximo de 400 caracteres" },
                  })}
                  className={styles.textAreaPregunta}
                  placeholder="Escribe la pregunta aquí..."
                />
                {errors.pregunta && (
                  <span className={styles.error}>{errors.pregunta.message as string}</span>
                )}
              </div>

              <div className={styles.formGroup}>
                <label className={styles.labelPregunta}>Actuación Docente (Especialidad) *</label>
                <textarea
                  {...register("preguntaDocente", {
                    required: "La pregunta de actuación es requerida",
                    minLength: { value: 5, message: "La actuación debe tener un mínimo de 5 caracteres" },
                    maxLength: { value: 400, message: "La actuación debe tener un máximo de 400 caracteres" },
                  })}
                  className={styles.textAreaPregunta}
                  placeholder="Escribe la actuación docente aquí..."
                />
                {errors.preguntaDocente && (
                  <span className={styles.error}>{errors.preguntaDocente.message as string}</span>
                )}
              </div>
            </div>

            <div className={styles.columnaDerecha}>
              <p className={styles.titlePregunta}>alternativas</p>
              
              <div className={styles.inputAlternativas}>
                {/* alternativa A */}
                <div className={styles.alternativaRow}>
                  <span className={styles.alternativaLabel}>a.</span>
                  <div className={styles.alternativaInputWrapper}>
                    <input
                      {...register("a", {
                        required: "La alternativa A es requerida",
                        minLength: { value: 1, message: "Debe tener un mínimo de 1 carácter" },
                        maxLength: { value: 150, message: "Debe tener un máximo de 150 caracteres" },
                      })}
                      className={styles.alternativaInput}
                      type="text"
                      placeholder="Escribe la alternativa a"
                    />
                    {errors.a && (
                      <span className={styles.error}>{errors.a.message as string}</span>
                    )}
                  </div>
                </div>

                {/* alternativa B */}
                <div className={styles.alternativaRow}>
                  <span className={styles.alternativaLabel}>b.</span>
                  <div className={styles.alternativaInputWrapper}>
                    <input
                      {...register("b", {
                        required: "La alternativa B es requerida",
                        minLength: { value: 1, message: "Debe tener un mínimo de 1 carácter" },
                        maxLength: { value: 150, message: "Debe tener un máximo de 150 caracteres" },
                      })}
                      className={styles.alternativaInput}
                      type="text"
                      placeholder="Escribe la alternativa b"
                    />
                    {errors.b && (
                      <span className={styles.error}>{errors.b.message as string}</span>
                    )}
                  </div>
                </div>

                {/* alternativa C */}
                <div className={styles.alternativaRow}>
                  <span className={styles.alternativaLabel}>c.</span>
                  <div className={styles.alternativaInputWrapper}>
                    <input
                      {...register("c", {
                        required: "La alternativa C es requerida",
                        minLength: { value: 1, message: "Debe tener un mínimo de 1 carácter" },
                        maxLength: { value: 150, message: "Debe tener un máximo de 150 caracteres" },
                      })}
                      className={styles.alternativaInput}
                      type="text"
                      placeholder="Escribe la alternativa c"
                    />
                    {errors.c && (
                      <span className={styles.error}>{errors.c.message as string}</span>
                    )}
                  </div>
                </div>

                {/* alternativa D */}
                <div className={styles.alternativaRow}>
                  <span className={styles.alternativaLabel}>d.</span>
                  <div className={styles.alternativaInputWrapper}>
                    <input
                      {...register("d", {
                        maxLength: { value: 150, message: "Debe tener un máximo de 150 caracteres" },
                      })}
                      className={styles.alternativaInput}
                      type="text"
                      placeholder="Escribe la alternativa d (Opcional)"
                    />
                    {errors.d && (
                      <span className={styles.error}>{errors.d.message as string}</span>
                    )}
                  </div>
                </div>
              </div>

              <div className={styles.formGroup}>
                <label className={styles.labelPregunta}>respuesta correcta *</label>
                <div className={styles.radioGroup}>
                  {['a', 'b', 'c', 'd'].map((option) => (
                    <label key={option} className={styles.radioLabel}>
                      <input
                        type="radio"
                        value={option}
                        {...register("respuesta", {
                          required: "La respuesta correcta es requerida",
                          validate: (val) => {
                            if (val === 'd' && !watch('d')?.trim()) {
                              return "La alternativa D debe tener contenido para ser la respuesta correcta";
                            }
                            return true;
                          }
                        })}
                        className={styles.radioInput}
                      />
                      <span className={styles.radioCustomBadge}>{option.toUpperCase()}</span>
                    </label>
                  ))}
                </div>
                {errors.respuesta && (
                  <span className={styles.error}>{errors.respuesta.message as string}</span>
                )}
              </div>
            </div>

            <button type="submit" className={styles.submitButton}>
              guardar pregunta
            </button>
          </form>
        </div>
      </div>,
      container
    )
    : null
}

export default AgregarPreguntasRespuestas;