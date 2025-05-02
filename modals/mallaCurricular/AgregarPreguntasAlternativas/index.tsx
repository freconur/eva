import { createPortal } from "react-dom"
import styles from './agregarPreguntaAlternativas.module.css'
import { useState } from "react";
import { useForm } from "react-hook-form";
import { useGlobalContext } from "@/features/context/GlolbalContext";
import { useAgregarEvaluaciones } from "@/features/hooks/useAgregarEvaluaciones";
import UseEvaluacionDocentes from "@/features/hooks/UseEvaluacionDocentes";
import { RiLoader4Line } from "react-icons/ri";
import UseEvaluacionDirectores from "@/features/hooks/UseEvaluacionDirectores";
import useEvaluacionCurricular from "@/features/hooks/useEvaluacionCurricular";
import { nivelCurricular } from "@/fuctions/regiones";

interface Props {
  handleShowModalPreguntasAlternativas: () => void,
  idEvaluacion: string
}

const AgregarPreguntasAlternativasCurricular = ({ handleShowModalPreguntasAlternativas, idEvaluacion }: Props) => {
  const { currentUserData, loaderModales } = useGlobalContext()
  const [typeRol, setTypeRol] = useState("")
  const [institucionData, setInstitucionData] = useState("")
  const [rolesData, setRolesData] = useState<number[]>([])
  const [cursosProfesor, setCursosProfesor] = useState<string[]>([])

  const { addPreguntasAlternativasCurricular } = useEvaluacionCurricular()
  let container;
  if (typeof window !== "undefined") {
    container = document.getElementById("portal-modal");
  }
  const { register, handleSubmit, watch, reset, formState: { errors } } = useForm()
  const handleSubmitform = handleSubmit(async (data) => {
    addPreguntasAlternativasCurricular(data)
    const nivelCurricularValue = watch('nivelCurricular')
    reset()
    if (nivelCurricularValue) {
      reset({ nivelCurricular: nivelCurricularValue })
    }
  })

  return container
    ? createPortal(
      <div className={styles.containerModal}>
        {
          loaderModales ?
            <div className={styles.loaderContainer}>
              <RiLoader4Line className={styles.loaderIcon} />
              <p className={styles.loaderText}>guardando pregunta...</p>
            </div>
            :
            <div className={styles.containerSale}>
              <div className={styles.closeModalContainer}>
                <h3 className={styles.title}>agregar habilidades lectoras</h3>
                <div className={styles.close} onClick={handleShowModalPreguntasAlternativas}>cerrar</div>
              </div>
              <form onSubmit={handleSubmitform}>
                <div className={styles.formGroup}>
                  <p className={styles.titlePregunta}>Nivel Curricular</p>
                  <div className={styles.containerRadio}>
                    {nivelCurricular.map((nivel) => (
                      <div key={nivel.id} className={styles.radioOption}>
                        <input
                          type="radio"
                          id={nivel.id.toString()}
                          value={nivel.id.toString()}
                          className={styles.radioInput}
                          {...register("nivelCurricular", {
                            required: { value: true, message: "El nivel curricular es requerido" }
                          })}
                        />
                        <label htmlFor={nivel.id.toString()} className={styles.radioLabel}>{nivel.name}</label>
                      </div>
                    ))}
                  </div>
                  {errors.nivelCurricular && <span className={styles.errorMessage}>{errors.nivelCurricular.message as string}</span>}
                </div>
                <div className={styles.formGroup}>
                  <p className={styles.titlePregunta}>descripcion</p>
                  <input
                    type="text"
                    className={styles.alternativaInput}
                    placeholder="habilidad lectora"
                    {...register("name",
                      {
                        required: { value: true, message: "criterio es requerido" },
                        minLength: { value: 1, message: "criterio debe tener un minimo de 1 caracteres" },
                        maxLength: { value: 150, message: "criterio debe tener un maximo de 150 caracteres" },
                      }
                    )}
                  />
                  {errors.criterio && <span className={styles.errorMessage}>{errors.criterio.message as string}</span>}
                </div>
                <button type="submit" className={styles.button}>guardar</button>
              </form>
            </div>
        }
      </div>,
      container
    )
    : null
}

export default AgregarPreguntasAlternativasCurricular