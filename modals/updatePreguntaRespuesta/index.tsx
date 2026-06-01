import { createPortal } from "react-dom"
import styles from './updatePreguntaRespuesta.module.css'
import { useGlobalContext } from "@/features/context/GlolbalContext";
import { Alternativa, PreguntasRespuestas } from "@/features/types/types";
import { RiLoader4Line } from "react-icons/ri";
import { useAgregarEvaluaciones } from "@/features/hooks/useAgregarEvaluaciones";
import { useEffect, useState } from "react";
import { MdClose } from 'react-icons/md';

interface Props {
  pregunta: PreguntasRespuestas,
  id: string,
  handleShowModalUpdatePreguntaRespuesta: () => void
}

const initialValue = {
  id: "",
  order: 0,
  pregunta: "",
  preguntaDocente: "",
  respuesta: "",
  puntaje: "",
  alternativas: [
    { descripcion: "", alternativa: "", selected: false },
    { descripcion: "", alternativa: "", selected: false },
    { descripcion: "", alternativa: "", selected: false },
    { descripcion: "", alternativa: "", selected: false },
  ]
}

const initialValueAlternativas = { descripcion: "", alternativa: "", selected: false }

const UpdatePreguntaRespuesta = ({ pregunta, handleShowModalUpdatePreguntaRespuesta, id }: Props) => {
  const { loaderSalvarPregunta, evaluacion, preguntasRespuestas } = useGlobalContext()
  const [valueInput, setValueInput] = useState<PreguntasRespuestas>(initialValue)
  const [valueInputA, setValueInputA] = useState<Alternativa>(initialValueAlternativas)
  const [valueInputB, setValueInputB] = useState<Alternativa>(initialValueAlternativas)
  const [valueInputC, setValueInputC] = useState<Alternativa>(initialValueAlternativas)
  const [valueInputD, setValueInputD] = useState<Alternativa>(initialValueAlternativas)
  const [puntajeError, setPuntajeError] = useState<string>("")
  const [validationError, setValidationError] = useState<string>("")

  let container;
  if (typeof window !== "undefined") {
    container = document.getElementById("portal-modal");
  }

  const { updatePreguntaRespuesta } = useAgregarEvaluaciones()

  const handleChangeInput = (e: React.ChangeEvent<HTMLInputElement> | React.ChangeEvent<HTMLTextAreaElement>) => {
    setValueInput({ ...valueInput, [e.target.name]: e.target.value })
  }

  const handleA = (e: React.ChangeEvent<HTMLInputElement>) => {
    setValueInputA({ ...valueInputA, descripcion: e.target.value })
  }
  const handleB = (e: React.ChangeEvent<HTMLInputElement>) => {
    setValueInputB({ ...valueInputB, descripcion: e.target.value })
  }
  const handleC = (e: React.ChangeEvent<HTMLInputElement>) => {
    setValueInputC({ ...valueInputC, descripcion: e.target.value })
  }
  const handleD = (e: React.ChangeEvent<HTMLInputElement>) => {
    setValueInputD({
      alternativa: 'd',
      selected: valueInputD?.selected || false,
      descripcion: e.target.value
    })
  }

  const handlePuntajeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    const numericValue = value.replace(/[^0-9]/g, ''); // Solo permite números
    
    setValueInput({ ...valueInput, puntaje: numericValue });
    
    // Validación
    if (value && !/^\d+$/.test(value)) {
      setPuntajeError("Solo se permiten números");
    } else if (numericValue && parseInt(numericValue) <= 0) {
      setPuntajeError("El puntaje debe ser mayor a 0");
    } else {
      setPuntajeError("");
    }
  }

  const handleActualizar = () => {
    if (!valueInput.pregunta?.trim()) {
      setValidationError("La pregunta del examen es requerida");
      return;
    }
    if (!valueInput.preguntaDocente?.trim()) {
      setValidationError("La actuación docente es requerida");
      return;
    }
    if (!valueInputA.descripcion?.trim() || !valueInputB.descripcion?.trim() || !valueInputC.descripcion?.trim()) {
      setValidationError("Las alternativas A, B y C son requeridas");
      return;
    }
    if (!valueInput.respuesta) {
      setValidationError("Debe seleccionar la respuesta correcta");
      return;
    }
    
    const descD = valueInputD?.descripcion?.trim();
    if (valueInput.respuesta.toLowerCase() === 'd' && !descD) {
      setValidationError("La alternativa D debe tener contenido para ser la respuesta correcta");
      return;
    }
    if (puntajeError) {
      setValidationError("Por favor corrige los errores del puntaje");
      return;
    }

    // VALIDACIÓN DE NIVELES Y PUNTAJES (Solo para tipo de evaluación "1")
    if (evaluacion.tipoDeEvaluacion === "1") {
      const nuevoPuntaje = Number(valueInput.puntaje) || 0;
      if (nuevoPuntaje > 0) {
        if (!evaluacion.nivelYPuntaje || !Array.isArray(evaluacion.nivelYPuntaje) || evaluacion.nivelYPuntaje.length === 0) {
          setValidationError("Primero debes configurar los rangos de nivel y puntaje en la evaluación para poder asignar puntos a las preguntas.");
          return;
        }

        const nivelSatisfactorio = evaluacion.nivelYPuntaje.find((n: any) => n.nivel.toLowerCase() === 'satisfactorio');
        if (!nivelSatisfactorio) {
          setValidationError("No se encontró la configuración del nivel 'Satisfactorio'. Por favor configurarlo primero.");
          return;
        }

        const maxSatisfactorio = Number(nivelSatisfactorio.max || 0);
        const sumOfOtherQuestions = preguntasRespuestas
          .filter((p: any) => p.id !== valueInput.id)
          .reduce((sum: number, p: any) => sum + (Number(p.puntaje) || 0), 0);
        const proposedSum = sumOfOtherQuestions + nuevoPuntaje;

        if (proposedSum > maxSatisfactorio) {
          setValidationError(`La suma total de los puntajes de las preguntas (${proposedSum}) superaría el puntaje máximo del nivel Satisfactorio (${maxSatisfactorio}).`);
          return;
        }
      }
    }

    setValidationError("");
    
    const array: Alternativa[] = []
    array.push(valueInputA)
    array.push(valueInputB)
    array.push(valueInputC)
    
    if (descD && descD.length > 0) {
      array.push(valueInputD)
    }
    
    updatePreguntaRespuesta(valueInput, array, id)
    handleShowModalUpdatePreguntaRespuesta()
  }

  useEffect(() => {
    setValueInput(pregunta)
    if (pregunta.alternativas) {
      setValueInputA(pregunta.alternativas[0] || initialValueAlternativas)
      setValueInputB(pregunta.alternativas[1] || initialValueAlternativas)
      setValueInputC(pregunta.alternativas[2] || initialValueAlternativas)
      setValueInputD(pregunta.alternativas[3] || initialValueAlternativas)
    }
  }, [pregunta])

  return container
    ? createPortal(
      <div className={styles.containerModal}>
        <div className={styles.containerSale}>
          <div className={styles.closeModalContainer}>
            <h3 className={styles.title}>Editar pregunta</h3>
            <button
              type="button"
              className={styles.closeButton}
              onClick={() => { handleShowModalUpdatePreguntaRespuesta(); setValueInput(initialValue) }}
              title="Cerrar"
            >
              <MdClose />
            </button>
          </div>

          {loaderSalvarPregunta ? (
            <div className='flex flex-col justify-center items-center py-12'>
              <RiLoader4Line className={`${styles.spinner} text-3xl text-blue-500`} />
              <span className='text-gray-500 animate-pulse mt-2'>Guardando cambios...</span>
            </div>
          ) : (
            <div className={styles.formulario}>
              <div className={styles.columnaIzquierda}>
                <div className={styles.formGroup}>
                  <label className={styles.labelPregunta}>Pregunta del examen *</label>
                  <textarea
                    className={styles.textAreaPregunta}
                    name="pregunta"
                    value={valueInput.pregunta}
                    onChange={handleChangeInput}
                    placeholder="Escribe la pregunta aquí..."
                  />
                </div>

                <div className={styles.formGroup}>
                  <label className={styles.labelPregunta}>Actuación Docente (Especialidad) *</label>
                  <textarea
                    className={styles.textAreaPregunta}
                    name="preguntaDocente"
                    value={valueInput.preguntaDocente}
                    onChange={handleChangeInput}
                    placeholder="Escribe la actuación docente aquí..."
                  />
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
                        type="text"
                        className={styles.alternativaInput}
                        name="descripcion"
                        value={valueInputA.descripcion}
                        onChange={handleA}
                        placeholder="Escribe la alternativa a"
                      />
                    </div>
                  </div>

                  {/* alternativa B */}
                  <div className={styles.alternativaRow}>
                    <span className={styles.alternativaLabel}>b.</span>
                    <div className={styles.alternativaInputWrapper}>
                      <input
                        type="text"
                        className={styles.alternativaInput}
                        name="descripcion"
                        value={valueInputB.descripcion}
                        onChange={handleB}
                        placeholder="Escribe la alternativa b"
                      />
                    </div>
                  </div>

                  {/* alternativa C */}
                  <div className={styles.alternativaRow}>
                    <span className={styles.alternativaLabel}>c.</span>
                    <div className={styles.alternativaInputWrapper}>
                      <input
                        type="text"
                        className={styles.alternativaInput}
                        name="descripcion"
                        value={valueInputC.descripcion}
                        onChange={handleC}
                        placeholder="Escribe la alternativa c"
                      />
                    </div>
                  </div>

                  {/* alternativa D */}
                  <div className={styles.alternativaRow}>
                    <span className={styles.alternativaLabel}>d.</span>
                    <div className={styles.alternativaInputWrapper}>
                      <input
                        type="text"
                        className={styles.alternativaInput}
                        name="descripcion"
                        value={valueInputD?.descripcion || ""}
                        onChange={handleD}
                        placeholder="Escribe la alternativa d (Opcional)"
                      />
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
                          name="respuesta"
                          value={option}
                          checked={valueInput.respuesta?.toLowerCase() === option}
                          onChange={() => setValueInput({ ...valueInput, respuesta: option })}
                          className={styles.radioInput}
                        />
                        <span className={styles.radioCustomBadge}>{option.toUpperCase()}</span>
                      </label>
                    ))}
                  </div>
                </div>

                <div className={styles.formGroup}>
                  <label className={styles.labelPregunta}>Puntaje</label>
                  <input
                    type="text"
                    className={styles.inputNombresDni}
                    name="puntaje"
                    value={valueInput.puntaje || ""}
                    onChange={handlePuntajeChange}
                    placeholder="Ingrese el puntaje"
                  />
                  {puntajeError && (
                    <span className={styles.error}>{puntajeError}</span>
                  )}
                </div>
              </div>

              {validationError && (
                <div style={{ gridColumn: '1 / -1' }}>
                  <span className={styles.error}>{validationError}</span>
                </div>
              )}

              <div className={styles.buttonGroup}>
                <button
                  type="button"
                  onClick={() => { handleShowModalUpdatePreguntaRespuesta(); setValueInput(initialValue) }}
                  className={styles.cancelButton}
                >
                  cancelar
                </button>
                <button
                  type="button"
                  onClick={handleActualizar}
                  className={styles.submitButton}
                >
                  guardar cambios
                </button>
              </div>
            </div>
          )}
        </div>
      </div>,
      container
    )
    : null
}

export default UpdatePreguntaRespuesta;