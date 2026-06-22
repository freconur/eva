import { createPortal } from "react-dom"
import styles from './agregarPreguntaRespuestas.module.css'
import { useState, useEffect } from "react";
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

  const { currentUserData, preguntasRespuestas } = useGlobalContext()
  const { guardarPreguntasRespuestas } = useAgregarEvaluaciones()

  let container;
  if (typeof window !== "undefined") {
    container = document.getElementById("portal-modal");
  }

  const { register, handleSubmit, watch, reset, setValue, formState: { errors } } = useForm()
  const [alternativas, setAlternativas] = useState<string[]>(['', '', '', ''])
  const [validationError, setValidationError] = useState<string>("")
  const [isSaving, setIsSaving] = useState(false)

  const handleAlternativeChange = (index: number, val: string) => {
    setAlternativas(prev => {
      const updated = [...prev]
      updated[index] = val
      return updated
    })
  }

  const handleAddAlternative = () => {
    setAlternativas(prev => [...prev, ''])
  }

  const handleRemoveAlternative = (index: number) => {
    if (alternativas.length <= 2) return
    setAlternativas(prev => prev.filter((_, i) => i !== index))

    const currentRespuesta = watch("respuesta")
    const letterOfRemovedIndex = String.fromCharCode(97 + index)
    const lastLetterAfterRemoval = String.fromCharCode(97 + alternativas.length - 2)

    if (currentRespuesta === letterOfRemovedIndex || currentRespuesta > lastLetterAfterRemoval) {
      setValue("respuesta", "")
    }
  }

  useEffect(() => {
    const handleGlobalKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        handleshowModal();
      }
    };
    window.addEventListener("keydown", handleGlobalKeyDown);
    return () => {
      window.removeEventListener("keydown", handleGlobalKeyDown);
    };
  }, [handleshowModal]);

  const handleFormKeyDown = (e: React.KeyboardEvent<HTMLFormElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      if ((e.target as HTMLElement).tagName === "BUTTON") {
        return;
      }
      e.preventDefault();
      e.currentTarget.requestSubmit();
    }
  };

  const handleSubmitform = handleSubmit(async (data) => {
    if (isSaving) return;

    const hasEmptyAlt = alternativas.some(alt => !alt.trim())
    if (hasEmptyAlt) {
      setValidationError("Todas las alternativas ingresadas son requeridas")
      return;
    }
    
    if (alternativas.length < 2) {
      setValidationError("Debe ingresar al menos 2 alternativas")
      return;
    }

    setValidationError("")
    setIsSaving(true)

    try {
      const rtaConvert = alternativas.map((val, idx) => ({
        alternativa: String.fromCharCode(97 + idx),
        descripcion: val.trim(),
        selected: false
      }))

      await guardarPreguntasRespuestas({ 
        id: id, 
        preguntaDocente: data.preguntaDocente, 
        pregunta: data.pregunta, 
        respuesta: data.respuesta, 
        alternativas: rtaConvert,
        puntaje: data.puntaje ? String(data.puntaje) : "0"
      })
      
      reset()
      setAlternativas(['', '', '', ''])
    } catch (error: any) {
      alert(`❌ Error al guardar la pregunta: ${error.message || 'Error desconocido'}`)
    } finally {
      setIsSaving(false)
    }
  })

  return container
    ? createPortal(
      <div className={styles.containerModal}>
        <div className={styles.containerSale}>
          <div className={styles.closeModalContainer}>
            <h3 className={styles.title}>
              agregar pregunta N° {(preguntasRespuestas?.length || 0) + 1}
            </h3>
            <button type="button" className={styles.closeButton} onClick={handleshowModal} title="Cerrar">
              <MdClose />
            </button>
          </div>

          <form className={styles.formulario} onSubmit={handleSubmitform} onKeyDown={handleFormKeyDown}>
            <div className={styles.columnaIzquierda}>
              <div className={styles.formGroup}>
                <label className={styles.labelPregunta}>Pregunta del examen *</label>
                <textarea
                  autoFocus
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
                {alternativas.map((desc, idx) => {
                  const letter = String.fromCharCode(97 + idx);
                  return (
                    <div key={idx} className={styles.alternativaRow}>
                      <span className={styles.alternativaLabel}>{letter}.</span>
                      <div className={styles.alternativaInputWrapper}>
                        <input
                          className={styles.alternativaInput}
                          type="text"
                          value={desc}
                          onChange={(e) => handleAlternativeChange(idx, e.target.value)}
                          placeholder={`Escribe la alternativa ${letter}`}
                        />
                      </div>
                      {alternativas.length > 2 && (
                        <button
                          type="button"
                          className={styles.deleteAlternativeBtn}
                          onClick={() => handleRemoveAlternative(idx)}
                          title="Eliminar alternativa"
                        >
                          ✕
                        </button>
                      )}
                    </div>
                  );
                })}
              </div>

              <button
                type="button"
                className={styles.addAlternativeBtn}
                onClick={handleAddAlternative}
              >
                + Agregar Alternativa
              </button>

              <div className={styles.formGroup}>
                <label className={styles.labelPregunta}>respuesta correcta *</label>
                <div className={styles.radioGroup}>
                  {alternativas.map((_, idx) => {
                    const option = String.fromCharCode(97 + idx);
                    return (
                      <label key={option} className={styles.radioLabel}>
                        <input
                          type="radio"
                          value={option}
                          {...register("respuesta", {
                            required: "La respuesta correcta es requerida"
                          })}
                          className={styles.radioInput}
                        />
                        <span className={styles.radioCustomBadge}>{option.toUpperCase()}</span>
                      </label>
                    );
                  })}
                </div>
              {errors.respuesta && (
                <span className={styles.error}>{errors.respuesta.message as string}</span>
              )}
            </div>

            <div className={styles.formGroup}>
              <label className={styles.labelPregunta}>Puntaje</label>
              <input
                type="text"
                className={styles.alternativaInput}
                placeholder="Ingrese el puntaje (opcional)"
                {...register("puntaje", {
                  validate: (val) => {
                    if (val && !/^\d+$/.test(val)) {
                      return "Solo se permiten números";
                    }
                    return true;
                  }
                })}
              />
              {errors.puntaje && (
                <span className={styles.error}>{errors.puntaje.message as string}</span>
              )}
            </div>

              {validationError && (
                <span className={styles.error}>{validationError}</span>
              )}
            </div>

            <button type="submit" className={styles.submitButton} disabled={isSaving}>
              {isSaving ? "guardando..." : "guardar pregunta"}
            </button>
          </form>
        </div>
      </div>,
      container
    )
    : null
}

export default AgregarPreguntasRespuestas;