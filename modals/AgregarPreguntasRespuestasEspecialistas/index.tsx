import { createPortal } from "react-dom"
import styles from './agregarPreguntaRespuestas.module.css'
import { useForm } from "react-hook-form";
import { useGlobalContext } from "@/features/context/GlolbalContext";
import { RiLoader4Line } from "react-icons/ri";
import useEvaluacionDesempenoBase from "@/features/hooks/useEvaluacionDesempenoBase";
import { useEffect } from "react";
import { DimensionEspecialista } from "@/features/types/types";

interface Props {
  handleShowModalPreguntas?: () => void,
  onClose?: () => void,
  onSuccess?: () => void,
  idEvaluacion: string,
  dimensiones?: DimensionEspecialista[],
  escala?: any[],
  collectionName?: string
}

const AgregarPreguntasRespuestasEspecialistas = ({
  handleShowModalPreguntas,
  onClose,
  onSuccess,
  idEvaluacion,
  dimensiones: propDimensiones,
  escala: propEscala,
  collectionName = 'evaluaciones-especialista'
}: Props) => {
  const { currentUserData, loaderModales, dimensionesEspecialistas, dataEvaluacionDocente } = useGlobalContext()
  const { addPreguntaRespuesta, getDimensiones } = useEvaluacionDesempenoBase({ collectionName })
  const closeHandler = onClose || handleShowModalPreguntas;
  const dimensiones = propDimensiones || dimensionesEspecialistas || [];

  useEffect(() => {
    getDimensiones(idEvaluacion)
  }, [idEvaluacion, getDimensiones])

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && closeHandler) {
        closeHandler();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [closeHandler]);

  let container;
  if (typeof window !== "undefined") {
    container = document.getElementById("portal-modal");
  }

  const { register, handleSubmit, watch, reset, formState: { errors, isSubmitting } } = useForm()
  const handleSubmitform = handleSubmit(async (data) => {
    const escalaToUse = propEscala || dataEvaluacionDocente?.escala;
    await addPreguntaRespuesta(data as any, idEvaluacion, escalaToUse)
    reset()
    if (onSuccess) onSuccess()
    if (closeHandler) closeHandler()
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
              <div className={styles.close} onClick={closeHandler}>cerrar</div>
            </div>
            <form onSubmit={handleSubmitform}>
              <div className={styles.formGroup}>
                <p className={styles.titlePregunta}>dominio</p>
                <select
                  className={styles.alternativaInput}
                  {...register("dimensionId", {
                    required: { value: true, message: "dominio es requerido" },
                  })}
                >
                  <option value="">Seleccione un dominio</option>
                  {dimensiones?.map((dim) => (
                    <option key={dim.id} value={dim.id}>
                      {dim.nombre}
                    </option>
                  ))}
                </select>
                {errors.dimensionId && <span className={styles.error}>{errors.dimensionId.message as string}</span>}
              </div>
              <div className={styles.formGroup}>
                <p className={styles.titlePregunta}>criterio / pregunta</p>
                <textarea
                  autoFocus
                  className={styles.textAreaPregunta}
                  placeholder="Escriba la pregunta o criterio a evaluar"
                  {...register("criterio", {
                    required: { value: true, message: "criterio es requerido" },
                    minLength: { value: 1, message: "criterio debe tener un minimo de 1 caracteres" },
                  })}
                />
                {errors.criterio && <span className={styles.error}>{errors.criterio.message as string}</span>}
              </div>

              {dataEvaluacionDocente?.activarEvidencias && (
                <>
                  <div className={styles.formGroupCheckbox}>
                    <input
                      type="checkbox"
                      id="requiereEvidencia"
                      {...register("requiereEvidencia")}
                    />
                    <label htmlFor="requiereEvidencia">¿Requiere evidencia?</label>
                  </div>
                  {watch("requiereEvidencia") && (
                    <div className={styles.formGroup}>
                      <p className={styles.titlePregunta}>Descripción de la evidencia</p>
                      <textarea
                        className={styles.textAreaPregunta}
                        placeholder="Ej: Plan de trabajo, fotos de la asistencia..."
                        {...register("descripcionEvidencia")}
                      />
                    </div>
                  )}
                </>
              )}

              <div className={styles.infoScale}>
                <p>Nota: Esta evaluación utiliza la siguiente escala:</p>
                <ul>
                  {(propEscala || dataEvaluacionDocente?.escala)?.length ? (
                    (propEscala || dataEvaluacionDocente?.escala)!.map((opt: any, i: number) => (
                      <li key={i}>{opt.value} = {opt.descripcion}</li>
                    ))
                  ) : (
                    <>
                      <li>0 = No evidencia</li>
                      <li>1 = En proceso</li>
                      <li>2 = Logrado</li>
                    </>
                  )}
                </ul>
              </div>
              <button type="submit" disabled={isSubmitting || loaderModales} className={styles.submitButton}>guardar</button>
            </form>
          </div>
        )}
      </div>,
      container
    )
    : null
}

export default AgregarPreguntasRespuestasEspecialistas