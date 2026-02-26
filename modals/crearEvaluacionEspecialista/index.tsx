import { createPortal } from "react-dom"
import styles from './crearEvaluacionDocentes.module.css'
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { useGlobalContext } from "@/features/context/GlolbalContext";
import { useAgregarEvaluaciones } from "@/features/hooks/useAgregarEvaluaciones";
import { Alternativa, Alternativas, Evaluaciones, PreguntasRespuestas, Psicolinguistica } from "@/features/types/types";
import { RiLoader4Line } from "react-icons/ri";
import { usePsicolinguistica } from "@/features/hooks/usePsicolinguistica";
import UseEvaluacionDocentes from "@/features/hooks/UseEvaluacionDocentes";
import UseEvaluacionDirectores from "@/features/hooks/UseEvaluacionDirectores";
import UseEvaluacionEspecialistas from "@/features/hooks/UseEvaluacionEspecialistas";

interface Props {
  handleShowModalCrearEvaluacion: () => void
}

const CrearEvaluacionEspecialista = ({ handleShowModalCrearEvaluacion }: Props) => {
  const { preguntasRespuestas, sizePreguntas, preguntasRespuestasEstudiante, loaderSalvarPregunta } = useGlobalContext()
  const [ordenLimitePregunta, setOrdenLimitePregunta] = useState(0)
  // const [ initialValueData, setInitialValueData] = useState([...preguntasRespuestas])
  const [activarBotonSiguiente, setActivarBotonSiguiente] = useState(false)
  const [repuestasCorrectas, setRespuestasCorrectas] = useState(0)
  const { prEstudiantes, salvarPreguntRespuestaEstudiante, getPreguntasRespuestas } = useAgregarEvaluaciones()
  let container;
  if (typeof window !== "undefined") {
    container = document.getElementById("portal-modal");
  }
  const { register, handleSubmit, watch, reset, formState: { errors } } = useForm()

  const { createEvaluacionesEspecialistas, valueLoader } = UseEvaluacionEspecialistas()


  const handleCreateEvaluacion = handleSubmit(async (data) => {
    await createEvaluacionesEspecialistas(data)
    handleShowModalCrearEvaluacion()
    reset()
  })
  return container
    ? createPortal(
      <div className={styles.containerModal}>

        <div className={styles.containerSale}>

          {

            loaderSalvarPregunta ?
              <div className='grid items-center justify-center'>
                <div className='flex justify-center items-center'>
                  <RiLoader4Line className="animate-spin text-3xl text-colorTercero " />
                  <span className='text-colorTercero animate-pulse'>...guardando respuestas</span>
                </div>
              </div>
              :
              <>
                <div className={styles.closeModalContainer}>
                  <div className={styles.close} onClick={handleShowModalCrearEvaluacion} >cerrar</div>
                </div>
                <h3 className={styles.title}>Crear Evaluación de Especialista</h3>
                <form onSubmit={handleCreateEvaluacion}>

                  <div className='w-full my-4'>
                    <p className="text-sm font-medium text-slate-700 mb-2">Nombre de la evaluación</p>
                    <input
                      {...register("name",
                        {
                          required: { value: true, message: "nombre de evaluación es requerido" },
                          minLength: { value: 2, message: "nombre debe tener un minimo de 2 caracteres" },
                          maxLength: { value: 50, message: "nombre debe tener un maximo de 50 caracteres" },
                        }
                      )}
                      className={styles.inputNombresDni}
                      type="text"
                      placeholder="Ej. Evaluación de Desempeño Q1"
                    />
                    {errors.name && <span className='text-red-500 text-xs mt-1 block'>{errors.name.message as string}</span>}
                  </div>
                  <div className="mb-4">
                    <p className="text-sm font-medium text-slate-700 mb-2">Categoría</p>
                    <select
                      {...register("categoria",
                        {
                          required: { value: true, message: "categoria es requerido" },
                        }
                      )}
                      className="w-full rounded-lg border-1.5 border-slate-200 outline-none p-3 bg-slate-50 text-slate-900 focus:bg-white focus:border-indigo-500 transition-all text-sm appearance-none"
                      style={{ border: '1.5px solid #e2e8f0' }}
                    >
                      <option value="">Seleccione una categoría</option>
                      <option value="SEGUIMIENTO">SEGUIMIENTO</option>
                      <option value="RETROALIMENTACIÓN">RETROALIMENTACIÓN</option>
                    </select>
                    {errors.categoria && <span className='text-red-500 text-xs mt-1 block'>{errors.categoria.message as string}</span>}
                  </div>

                  <button
                    disabled={valueLoader}
                    className={styles.buttonCrearEvaluacion}>
                    {valueLoader ? (
                      <div className="flex items-center justify-center gap-2">
                        <RiLoader4Line className="animate-spin text-xl" />
                        <span>Guardando...</span>
                      </div>
                    ) : (
                      "Guardar"
                    )}
                  </button>
                </form>
              </>
          }
        </div>
      </div>,
      container
    )
    : null
}

export default CrearEvaluacionEspecialista