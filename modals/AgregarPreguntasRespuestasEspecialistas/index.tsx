import { createPortal } from "react-dom"
import styles from './agregarPreguntaRespuestas.module.css'
import { useForm } from "react-hook-form";
import { useGlobalContext } from "@/features/context/GlolbalContext";
import { RiLoader4Line } from "react-icons/ri";
import UseEvaluacionEspecialistas from "@/features/hooks/UseEvaluacionEspecialistas";
import { useEffect } from "react";

interface Props {
  handleShowModalPreguntas: () => void,
  idEvaluacion: string
}

const AgregarPreguntasRespuestasEspecialistas = ({ handleShowModalPreguntas, idEvaluacion }: Props) => {
  const { currentUserData, loaderModales, dimensionesEspecialistas, dataEvaluacionDocente } = useGlobalContext()
  const { addPreguntasEvaluacionEspecialistas, getDimensionesEspecialistas } = UseEvaluacionEspecialistas()

  useEffect(() => {
    getDimensionesEspecialistas(idEvaluacion)
  }, [idEvaluacion])

  let container;
  if (typeof window !== "undefined") {
    container = document.getElementById("portal-modal");
  }

  const { register, handleSubmit, watch, reset, formState: { errors } } = useForm()
  const handleSubmitform = handleSubmit(async (data) => {
    addPreguntasEvaluacionEspecialistas(data, idEvaluacion, dataEvaluacionDocente?.escala)
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
                <p className={styles.titlePregunta}>dominio</p>
                <select
                  className={styles.alternativaInput}
                  {...register("dimensionId", {
                    required: { value: true, message: "dominio es requerido" },
                  })}
                >
                  <option value="">Seleccione un dominio</option>
                  {dimensionesEspecialistas?.map((dim) => (
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
                  {dataEvaluacionDocente?.escala?.length ? (
                    dataEvaluacionDocente.escala.map((opt, i) => (
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