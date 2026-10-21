import { createPortal } from "react-dom"
import styles from './crearEvaluacionDocentes.module.css'
import { useState } from "react";
import { useForm } from "react-hook-form";
import { useGlobalContext } from "@/features/context/GlolbalContext";
import { RiLoader4Line } from "react-icons/ri";
import UseEvaluacionDirectores from "@/features/hooks/UseEvaluacionDirectores";
import { DEFAULT_ESCALA_DIRECTOR, DEFAULT_NIVELES_DIRECTOR } from "@/features/types/types";

interface Props {
  handleShowModalCrearEvaluacion: () => void
}

const CrearEvaluacionDirector = ({ handleShowModalCrearEvaluacion }: Props) => {
  const { loaderSalvarPregunta } = useGlobalContext()
  const [isSaving, setIsSaving] = useState(false)
  let container;
  if (typeof window !== "undefined") {
    container = document.getElementById("portal-modal") || document.body;
  }
  const { register, handleSubmit, reset, formState: { errors } } = useForm()

  const { createEvaluacionesDirectores } = UseEvaluacionDirectores()

  const handleCreateEvaluacion = handleSubmit(async (data) => {
    setIsSaving(true)
    try {
      await createEvaluacionesDirectores({
        name: data.name.trim(),
        categoria: String(data.categoria).trim(),
        active: false,
        escala: DEFAULT_ESCALA_DIRECTOR,
        niveles: DEFAULT_NIVELES_DIRECTOR,
        nivelYPuntaje: DEFAULT_NIVELES_DIRECTOR,
      })
      handleShowModalCrearEvaluacion()
      reset()
    } catch (error) {
      console.error("Error al crear evaluación de director:", error)
    } finally {
      setIsSaving(false)
    }
  })

  return container
    ? createPortal(
      <div className={styles.containerModal} onClick={(e) => e.target === e.currentTarget && handleShowModalCrearEvaluacion()}>
        <div className={styles.containerSale}>
          {loaderSalvarPregunta ? (
            <div className='grid items-center justify-center'>
              <div className='flex justify-center items-center'>
                <RiLoader4Line className="animate-spin text-3xl text-colorTercero " />
                <span className='text-colorTercero animate-pulse'>...guardando respuestas</span>
              </div>
            </div>
          ) : (
            <>
              <div className={styles.closeModalContainer}>
                <div className={styles.close} onClick={handleShowModalCrearEvaluacion}>cerrar</div>
              </div>
              <h3 className={styles.title}>Crear Evaluación de Director</h3>
              <form onSubmit={handleCreateEvaluacion}>
                <div className='w-full my-4'>
                  <p className="text-sm font-medium text-slate-700 mb-2">Nombre de la evaluación</p>
                  <input
                    {...register("name", {
                      required: { value: true, message: "nombre de evaluación es requerido" },
                      minLength: { value: 2, message: "nombre debe tener un minimo de 2 caracteres" },
                      maxLength: { value: 50, message: "nombre debe tener un maximo de 50 caracteres" },
                    })}
                    autoFocus
                    className={styles.inputNombresDni}
                    type="text"
                    placeholder="Ej. Evaluación de Desempeño Q1"
                  />
                  {errors.name && <span className='text-red-500 text-xs mt-1 block'>{errors.name.message as string}</span>}
                </div>

                <div className="mb-4">
                  <p className="text-sm font-medium text-slate-700 mb-2">Categoría</p>
                  <select
                    {...register("categoria", {
                      required: { value: true, message: "categoria es requerido" },
                    })}
                    className="w-full rounded-lg border-1.5 border-slate-200 outline-none p-3 bg-slate-50 text-slate-900 focus:bg-white focus:border-indigo-500 transition-all text-sm appearance-none cursor-pointer"
                    style={{ border: '1.5px solid #e2e8f0' }}
                  >
                    <option value="">Seleccione una categoría</option>
                    <option value="SEGUIMIENTO">SEGUIMIENTO</option>
                    <option value="RETROALIMENTACIÓN">RETROALIMENTACIÓN</option>
                  </select>
                  {errors.categoria && <span className='text-red-500 text-xs mt-1 block'>{errors.categoria.message as string}</span>}
                </div>

                <button
                  type="submit"
                  disabled={isSaving}
                  className={styles.buttonCrearEvaluacion}
                >
                  {isSaving ? (
                    <div className="flex items-center justify-center gap-2">
                      <RiLoader4Line className="animate-spin text-xl text-white" />
                      <span>Guardando...</span>
                    </div>
                  ) : (
                    "Guardar"
                  )}
                </button>
              </form>
            </>
          )}
        </div>
      </div>,
      container
    )
    : null
}

export default CrearEvaluacionDirector