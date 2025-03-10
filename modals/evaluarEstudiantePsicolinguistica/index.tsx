import { createPortal } from "react-dom"
import styles from '../evaluarEstudiantePsicolinguistica/EvaluarEstudiantePsicolinguistica.module.css'
import { useForm } from "react-hook-form";
import { useGlobalContext } from "@/features/context/GlolbalContext";
import { Psicolinguistica, PsicolinguiticaExamen, respuestaPsicolinguistica } from "@/features/types/types";
import { RiLoader4Line } from "react-icons/ri";
import { usePsicolinguistica } from "@/features/hooks/usePsicolinguistica";
import { database } from "firebase-admin";
import { useEffect, useState } from "react";
import { sectionByGrade } from "@/fuctions/regiones";
import { useAgregarEvaluaciones } from "@/features/hooks/useAgregarEvaluaciones";

interface Props {
  handleShowModalEvaluar: () => void,
  id: string
  preguntasPsicolinguistica: PsicolinguiticaExamen[]

}

const EvaluarEstudiantePsicolinguistica = ({ handleShowModalEvaluar, id }: Props) => {
  const { loaderSalvarPregunta, preguntasPsicolinguisticaActualizadas, grados } = useGlobalContext()
  const [ordenLimitePregunta, setOrdenLimitePregunta] = useState(0)
  const { getGrades } = useAgregarEvaluaciones()
  let container;
  if (typeof window !== "undefined") {
    container = document.getElementById("portal-modal");
  }
  const { register, handleSubmit, watch, reset, formState: { errors } } = useForm()
  const { preguntasPsicolinguistica, currentUserData } = useGlobalContext()
  const [botonSiguiente, setBotonSiguiente] = useState<boolean>(true)
  // console.log('testing', preguntasPsicolinguistica)
  const { salvarRespuestaPsicolinguistica, getPsicolinguisticaById, actualizarPreguntasPsicolinguistica } = usePsicolinguistica()

  //FUNCION DECTECCION DE CAMBIO DEL VALOR DE CHECKED
  const handleCheckedRespuesta = (e: React.ChangeEvent<HTMLInputElement>) => {
    console.log('eee',)
    preguntasPsicolinguistica[ordenLimitePregunta] = {
      ...preguntasPsicolinguistica[ordenLimitePregunta],
      alternativas: [
        { alternativa: 'a', descripcion: 'si', selected: e.target.value === 'a' ? true : false },
        { alternativa: 'b', descripcion: 'no', selected: e.target.value === 'b' ? true : false },
      ]
    }
    actualizarPreguntasPsicolinguistica(preguntasPsicolinguistica)
  }
  //FUNCION DECTECCION DE CAMBIO DEL VALOR DE CHECKED
  //FUNCION PARA QUE ME CREE LAS RESPUESTAS DE SI O NO
  const preguntaRespuestaFunction = (data: PsicolinguiticaExamen[]) => {
    return (
      <>
        {
          data.length >= 0 &&
          data[ordenLimitePregunta]?.alternativas?.map((alter, index) => {
            return (
              <div key={index} className={styles.respuestas}>
                <div className={styles.containerAlternativas}>
                  <p className={styles.alternativa}>{`${alter.alternativa})`}  </p>
                  <input
                    className={styles.radio}
                    type="radio"
                    name={`${data[ordenLimitePregunta]?.order}`}
                    value={alter.alternativa}
                    checked={alter.selected}
                    onChange={handleCheckedRespuesta}
                  />
                  <p className={styles.descripcion}>{alter.descripcion}</p>
                </div>
              </div>
            )
          })
        }
      </>
    )
  }
  //FUNCION PARA QUE ME CREE LAS RESPUESTAS DE SI O NO

  //USEFFECT PARA ACTUALIZACION DE LOS DATOS AL DAR CHECKED
  useEffect(() => {
    getGrades()
  }, [])
  useEffect(() => {
    //ESTO ACTUALIZA LOS ESTADOS DESPUES DE CADA CHECKED
    actualizarPreguntasPsicolinguistica(preguntasPsicolinguistica)
  }, [preguntasPsicolinguistica])
  //USEFFECT PARA ACTUALIZACION DE LOS DATOS AL DAR CHECKED
  const handleSalvarPreguntaPsicolinguistica = handleSubmit((data: respuestaPsicolinguistica,) => {
    console.log('dato', data)
    salvarRespuestaPsicolinguistica(data, preguntasPsicolinguistica, id, `${currentUserData.dniDirector}`)
    getPsicolinguisticaById(id)
    setOrdenLimitePregunta(0)
    reset()
    // if (ordenLimitePregunta === 0) {
    // }
  })
  // console.log('currentUserData', currentUserData)

  ////MEW QUEDE EN PODER HACER UN GET DE LOS DATOS Y PODER TRABAJARLOS EN TABLAS.
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
                  <div className={styles.close} onClick={handleShowModalEvaluar} >cerrar</div>
                </div>
                <h3 className={styles.title}>Agregar Preguntas Psicolinguistica</h3>
                <form onSubmit={handleSalvarPreguntaPsicolinguistica}>
                  <div className='w-full my-2'>
                    {/* <p className={styles.inputLabel}>Nombre y apellidos: </p> */}
                    <input
                      {...register("nombreApellidos",
                        {
                          required: { value: true, message: "nombre de pregunta es requerido" },
                          minLength: { value: 2, message: "nombre debe tener un minimo de 2 caracteres" },
                          maxLength: { value: 400, message: "nombre debe tener un maximo de 400 caracteres" },
                        }
                      )}
                      className={styles.inputNombresDni}
                      // type="text"
                      placeholder="NOMBRES Y APELLIDOS"
                    />
                    {errors.nombreApellidos && <span className='text-red-400 text-sm'>{errors.nombreApellidos.message as string}</span>}
                  </div>
                  <div className="grid gap-5 grid-cols-3">
                    <div className='w-full my-2'>
                      {/* <p className={styles.inputLabel}>Dni estudiante: </p> */}
                      <input
                        {...register("dni",
                          {
                            required: { value: true, message: "nombre de pregunta es requerido" },
                            minLength: { value: 2, message: "nombre debe tener un minimo de 2 caracteres" },
                            maxLength: { value: 400, message: "nombre debe tener un maximo de 400 caracteres" },
                          }
                        )}
                        className={styles.inputNombresDni}
                        // type="text"
                        placeholder="DNI"
                      />
                      {errors.dni && <span className='text-red-400 text-sm'>{errors.dni.message as string}</span>}
                    </div>

                    <div className='w-full my-2'>
                      {/* <p className={styles.inputLabel}>Nombre y apellidos: </p> */}
                      <select
                        {...register("grado",
                          {
                            required: { value: true, message: "grado es requerido" },
                          }
                        )}
                        className={styles.select}>
                        <option value="">--GRADO--</option>
                        {
                          grados?.map((gr, index) => {
                            return (
                              <option value={gr.grado}>{gr.nombre?.toLocaleUpperCase()}</option>
                            )
                          })
                        }
                      </select>
                      {errors.grado && <span className='text-red-400 text-sm'>{errors.grado.message as string}</span>}
                    </div>
                    <div className='w-full my-2'>
                      {/* <p className={styles.inputLabel}>Nombre y apellidos: </p> */}
                      <select
                        {...register("seccion",
                          {
                            required: { value: true, message: "seccion es requerido" },
                          }
                        )}
                        className={styles.select}>
                        <option value="">--SECCIÓN--</option>
                        {
                          sectionByGrade.map((sec, index) => {
                            return (
                              <option value={sec.id}>{sec.name?.toLocaleUpperCase()}</option>
                            )
                          })
                        }
                      </select>
                      {errors.seccion && <span className='text-red-400 text-sm'>{errors.seccion.message as string}</span>}
                    </div>
                  </div>
                  <div className={styles.containerPregunta}>
                    <h3 className={styles.tituloPregunta}>{`${ordenLimitePregunta + 1})`}{preguntasPsicolinguisticaActualizadas[ordenLimitePregunta]?.pregunta}</h3>
                  </div>
                  <div className={styles.containerPreguntasAlternativas}>
                    {preguntaRespuestaFunction(preguntasPsicolinguisticaActualizadas)}

                  </div>
                  <div className={ordenLimitePregunta === 0 ? styles.buttonsContainer : styles.buttonsContainerSiguiente}>
                    {
                      ordenLimitePregunta === 0 ? null :
                        <div onClick={() => setOrdenLimitePregunta(ordenLimitePregunta - 1)} className={styles.buttonCrearEvaluacion}>atras</div>
                    }
                    {
                      ordenLimitePregunta === Number(preguntasPsicolinguisticaActualizadas.length) - 1 ?
                        // null 
                        <button className={styles.buttonCrearEvaluacion}>Guardar</button>
                        :
                        <div onClick={() => setOrdenLimitePregunta(ordenLimitePregunta + 1)} className={styles.buttonCrearEvaluacion}>siguiente</div>
                    }

                  </div>
                </form>
              </>
          }
        </div>
      </div>,
      container
    )
    : null
}

export default EvaluarEstudiantePsicolinguistica