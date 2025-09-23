import { createPortal } from "react-dom"
import styles from './updateEvaluacionDocente.module.css'
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { useGlobalContext } from "@/features/context/GlolbalContext";
import { useAgregarEvaluaciones } from "@/features/hooks/useAgregarEvaluaciones";
import { CrearEvaluacionDocente } from "@/features/types/types";
import { RiLoader4Line } from "react-icons/ri";
import UseEvaluacionDocentes from "@/features/hooks/UseEvaluacionDocentes";

interface Props {
  handleShowModalUpdate: () => void
  evaluacionData: CrearEvaluacionDocente
}

const UpdateEvaluacionDocente = ({ handleShowModalUpdate, evaluacionData }: Props) => {
  const { tiposDeEvaluacion, loaderSalvarPregunta } = useGlobalContext()
  const { getTipoDeEvaluacion } = useAgregarEvaluaciones()
  const { updateEvaluacionDocentes } = UseEvaluacionDocentes()
  
  let container;
  if (typeof window !== "undefined") {
    container = document.getElementById("portal-modal");
  }
  
  const { register, handleSubmit, reset, formState: { errors } } = useForm({
    defaultValues: {
      name: evaluacionData.name || "",
      categoria: evaluacionData.categoria || "",
      tipoDeEvaluacion: evaluacionData.tipoDeEvaluacion || ""
    }
  })

  useEffect(() => {
    getTipoDeEvaluacion()
    // Resetear el formulario con los datos de la evaluación
    reset({
      name: evaluacionData.name || "",
      categoria: evaluacionData.categoria || "",
      tipoDeEvaluacion: evaluacionData.tipoDeEvaluacion || ""
    })
  }, [evaluacionData, reset])

  const handleUpdateEvaluacion = handleSubmit((data) => {
    if (evaluacionData.id) {
      updateEvaluacionDocentes(data, evaluacionData.id)
      handleShowModalUpdate()
    }
  })

  return container
    ? createPortal(
      <div className={styles.containerModal}>
        <div className={styles.containerSale}>
          {loaderSalvarPregunta ? (
            <div className={styles.loaderContainer}>
              <RiLoader4Line className={styles.loaderIcon} />
              <span>Actualizando evaluación...</span>
            </div>
          ) : (
            <>
              <div className={styles.closeModalContainer}>
                <button className={styles.close} onClick={handleShowModalUpdate}>
                  Cerrar
                </button>
              </div>
              <h3 className={styles.title}>Editar Evaluación de Docente</h3>
              <form onSubmit={handleUpdateEvaluacion}>
                <div className="w-full my-2">
                  <label className={styles.inputLabel}>Nombre de evaluación:</label>
                  <input
                    {...register("name", {
                      required: { value: true, message: "El nombre de evaluación es requerido" },
                      minLength: { value: 2, message: "El nombre debe tener un mínimo de 2 caracteres" },
                      maxLength: { value: 200, message: "El nombre debe tener un máximo de 200 caracteres" },
                    })}
                    className={styles.inputNombresDni}
                    type="text"
                    placeholder="Ingrese el nombre de la evaluación"
                  />
                  {errors.name && <span className={styles.errorMessage}>{errors.name.message as string}</span>}
                </div>
                <div className="mb-3">
                  <label className={styles.inputLabel}>Categoría:</label>
                  <select 
                    {...register("categoria", {
                      required: { value: true, message: "La categoría es requerida" },
                    })}
                    className={styles.inputNombresDni}
                  >
                    <option value="">Seleccione una categoría</option>
                    <option value="LECTURA">LECTURA</option>
                    <option value="MATEMÁTICA">MATEMÁTICA</option>
                  </select>
                  {errors.categoria && <span className={styles.errorMessage}>{errors.categoria.message as string}</span>}
                </div>
                <div className="mb-3">
                  <label className={styles.inputLabel}>Tipo de Evaluación:</label>
                  <select 
                    {...register("tipoDeEvaluacion", {
                      required: { value: true, message: "El tipo de evaluación es requerido" },
                    })}
                    className={styles.inputNombresDni}
                  >
                    <option value="">Seleccione un tipo de evaluación</option>
                    {tiposDeEvaluacion?.map((tipo, index) => (
                      <option key={index} value={tipo.value}>
                        {tipo.name}
                      </option>
                    ))}
                  </select>
                  {errors.tipoDeEvaluacion && <span className={styles.errorMessage}>{errors.tipoDeEvaluacion.message as string}</span>}
                </div>
                <div className={styles.buttonContainer}>
                  <button type="button" onClick={handleShowModalUpdate} className={styles.buttonCancel}>
                    Cancelar
                  </button>
                  <button type="submit" className={styles.buttonUpdate}>
                    Actualizar
                  </button>
                </div>
              </form>
            </>
          )}
        </div>
      </div>,
      container
    )
    : null
}

export default UpdateEvaluacionDocente
