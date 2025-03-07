import { createPortal } from "react-dom"
import styles from '../crearEvaluacionPsicolinguitica/crearEvaluacionPsicolinguistica.module.css'
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { useGlobalContext } from "@/features/context/GlolbalContext";
import { useAgregarEvaluaciones } from "@/features/hooks/useAgregarEvaluaciones";
import { Alternativa, Alternativas, Evaluaciones, PreguntasRespuestas, Psicolinguistica } from "@/features/types/types";
import { RiLoader4Line } from "react-icons/ri";
import { usePsicolinguistica } from "@/features/hooks/usePsicolinguistica";

interface Props {
  handleShowCrearEvaluacion: () => void
}

const CrearEvaluacionPsicolinguitica = ({handleShowCrearEvaluacion}:Props) => {
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

  const { createPsicolinguistica } = usePsicolinguistica()


  const handleCreateEvaluacion = handleSubmit((data: Psicolinguistica) => {
    createPsicolinguistica(data)
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
                  <div className={styles.close} onClick={handleShowCrearEvaluacion} >cerrar</div>
                </div>
                <h3 className={styles.title}>Crear Evaluación Psicolinguistica</h3>
                <form onSubmit={handleCreateEvaluacion}>

                  <div className='w-full my-2'>
                    <p className={styles.inputLabel}>Nombre de evaluación: </p>
                    <input
                      {...register("nombre",
                        {
                          required: { value: true, message: "nombre de evaluación es requerido" },
                          minLength: { value: 2, message: "nombre debe tener un minimo de 2 caracteres" },
                          maxLength: { value: 50, message: "nombre debe tener un maximo de 50 caracteres" },
                        }
                      )}
                      className={styles.inputNombresDni}
                      type="text"
                      placeholder="nombres de evaluacion"
                    />
                    {errors.nombre && <span className='text-red-400 text-sm'>{errors.nombre.message as string}</span>}
                  </div>

                  <button
                    className={styles.buttonCrearEvaluacion}>Guardar</button>
                </form>
              </>
          }
        </div>
      </div>,
      container
    )
    : null
}

export default CrearEvaluacionPsicolinguitica