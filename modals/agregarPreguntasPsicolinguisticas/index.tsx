import { createPortal } from "react-dom"
import styles from '../agregarPreguntasPsicolinguisticas/AgregarPreguntaPsicolinguistica.module.css'
import { useForm } from "react-hook-form";
import { useGlobalContext } from "@/features/context/GlolbalContext";
import { Psicolinguistica, PsicolinguiticaExamen } from "@/features/types/types";
import { RiLoader4Line } from "react-icons/ri";
import { usePsicolinguistica } from "@/features/hooks/usePsicolinguistica";

interface Props {
  handleShowModalAgregarPregunta: () => void,
  id:string
}

const AgregarPreguntasPsicolinguistica = ({handleShowModalAgregarPregunta,id}:Props) => {
  const { loaderSalvarPregunta } = useGlobalContext()
  let container;
  if (typeof window !== "undefined") {
    container = document.getElementById("portal-modal");
  }
  const { register, handleSubmit, watch, reset, formState: { errors } } = useForm()

  const { salvarPreguntaPsicolinguistica } = usePsicolinguistica()


  const handleSalvarPreguntaPsicolinguistica = handleSubmit((data: PsicolinguiticaExamen) => {
    salvarPreguntaPsicolinguistica(data, id)
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
                  <div className={styles.close} onClick={handleShowModalAgregarPregunta} >cerrar</div>
                </div>
                <h3 className={styles.title}>Agregar Preguntas Psicolinguistica</h3>
                <form onSubmit={handleSalvarPreguntaPsicolinguistica}>

                  <div className='w-full my-2'>
                    <p className={styles.inputLabel}>Nombre de pregunta: </p>
                    <textarea
                      {...register("pregunta",
                        {
                          required: { value: true, message: "nombre de pregunta es requerido" },
                          minLength: { value: 2, message: "nombre debe tener un minimo de 2 caracteres" },
                          maxLength: { value: 400, message: "nombre debe tener un maximo de 400 caracteres" },
                        }
                      )}
                      className={styles.inputNombresDni}
                      // type="text"
                      placeholder="nombre de pregunta"
                    />
                    {errors.pregunta && <span className='text-red-400 text-sm'>{errors.pregunta.message as string}</span>}
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

export default AgregarPreguntasPsicolinguistica