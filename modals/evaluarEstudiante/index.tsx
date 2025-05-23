import { createPortal } from "react-dom"
import styles from '../evaluarEstudiante/evaluarEstudiante.module.css'
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { useGlobalContext } from "@/features/context/GlolbalContext";
import { useAgregarEvaluaciones } from "@/features/hooks/useAgregarEvaluaciones";
import { Alternativa, Alternativas, Evaluaciones, PreguntasRespuestas } from "@/features/types/types";
import { RiLoader4Line } from "react-icons/ri";
import { gradosDeColegio, sectionByGrade, genero } from '../../fuctions/regiones'
import { currentYear } from "@/fuctions/dates";
interface Props {
  id: string,
  handleShowModalEstudiante: () => void,
  preguntasRespuestas: PreguntasRespuestas[]
}

const EvaluarEstudiante = ({ id, handleShowModalEstudiante }: Props) => {
  const { preguntasRespuestas, sizePreguntas, preguntasRespuestasEstudiante, loaderSalvarPregunta } = useGlobalContext()
  const [ordenLimitePregunta, setOrdenLimitePregunta] = useState(0)
  // const [ initialValueData, setInitialValueData] = useState([...preguntasRespuestas])
  const [activarBotonSiguiente, setActivarBotonSiguiente] = useState(true)
  const [repuestasCorrectas, setRespuestasCorrectas] = useState(0)
  const { prEstudiantes,resetPRestudiantes, salvarPreguntRespuestaEstudiante, getPreguntasRespuestas } = useAgregarEvaluaciones()
  let container;
  if (typeof window !== "undefined") {
    container = document.getElementById("portal-modal");
  }
  const { register, handleSubmit, watch, reset, formState: { errors } } = useForm()

  const validateRespuests = (data: PreguntasRespuestas[]) => {
    data.forEach(pq => {
      // if (preguntasRespuestasEstudiante[ordenLimitePregunta]?.id === pq.id) {
      if (preguntasRespuestasEstudiante[ordenLimitePregunta]?.order === pq.order) {
        pq.alternativas?.forEach(a => {
          if (a.selected === true) {
            if (a.alternativa?.toLowerCase() === pq.respuesta?.toLowerCase()) {
              setRespuestasCorrectas(repuestasCorrectas + 1)
            }
          }
        })
      }
    })
  }
  const validateUltimaRespuesta = (data: PreguntasRespuestas[], dataForm:any) => {
    let respuestaCorrecta = false;
    
    data.forEach(pq => {
      if (preguntasRespuestasEstudiante[ordenLimitePregunta]?.order === pq.order) {
        pq.alternativas?.forEach(a => {
          if (a.selected === true && a.alternativa?.toLowerCase() === pq.respuesta?.toLowerCase()) {
            respuestaCorrecta = true;
          }
        });
      }
    });

    if (respuestaCorrecta) {
      salvarPreguntRespuestaEstudiante(dataForm, id, preguntasRespuestasEstudiante, repuestasCorrectas + 1, sizePreguntas);
    } else {
      salvarPreguntRespuestaEstudiante(dataForm, id, preguntasRespuestasEstudiante, repuestasCorrectas, sizePreguntas);
    }
  }
  const handleSubmitform = handleSubmit(async (data) => {
    // setOrdenLimitePregunta(ordenLimitePregunta + 1)
    // validateRespuests(preguntasRespuestasEstudiante)
    validateUltimaRespuesta(preguntasRespuestasEstudiante, data)
      // salvarPreguntRespuestaEstudiante(data, id, preguntasRespuestasEstudiante, repuestasCorrectas, sizePreguntas)

      
      getPreguntasRespuestas(id)
      setOrdenLimitePregunta(0)
      setRespuestasCorrectas(0)
      prEstudiantes(preguntasRespuestas)
      setActivarBotonSiguiente(true)
      reset()
  })
  const siguientePregunta = () => {
    // debugger
    if (sizePreguntas - 1 !== ordenLimitePregunta) {
      setOrdenLimitePregunta(ordenLimitePregunta + 1)
      validateRespuests(preguntasRespuestasEstudiante)
      //aqui tendria que agregar la funcion para que vaya incrementando
    }
    // debugger
    setActivarBotonSiguiente(true)

  }
  const handleCheckedRespuesta = (e: React.ChangeEvent<HTMLInputElement>) => {
    preguntasRespuestasEstudiante?.map((pq: PreguntasRespuestas, index: number) => {
      // if (Number(pq.id) === Number(e.target.name)) {
      if (Number(pq.order) === Number(e.target.name)) {
        pq.alternativas?.map(al => {

          // console.log('al', al)
          if (al.descripcion?.length !== 0) {
            if (al.alternativa === e.target.value) {
              al.selected = true
              return al
            } else {
              al.selected = false
            }
          }
        })
      }
    })
    preguntasRespuestasEstudiante.find(p => {
      if (Number(e.target.name) === Number(p.order)) {
        p.alternativas?.map(a => {
          if (a.selected === true) {
            setActivarBotonSiguiente(false)
          }
        })
      }
    })
   /*  console.log('preguntasRespuestasEstudiante', preguntasRespuestasEstudiante) */
    prEstudiantes(preguntasRespuestasEstudiante)
    
  }
  // useEffect(() => {
  //   preguntasRespuestasEstudiante[ordenLimitePregunta]?.alternativas?.map(a => {
  //     if (a.selected === true) return setActivarBotonSiguiente(false)
  //   })
  // }, [activarBotonSiguiente])

  useEffect(() => { prEstudiantes(preguntasRespuestas) }, [preguntasRespuestas])


console.log('currentYear',currentYear)  

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
                  <div className={styles.close} onClick={handleShowModalEstudiante}>cerrar</div>
                </div>
                <h3 className={styles.title}>evaluar estudiante</h3>
                <form onSubmit={handleSubmitform} >
                  <div className='w-full my-2'>
                    {/* <p className={styles.inputLabel}>dni</p> */}
                    <input
                      {...register("dni",
                        {
                          required: { value: true, message: "dni es requerido" },
                          minLength: { value: 8, message: "nombre debe tener un minimo de 8 caracteres" },
                          maxLength: { value: 8, message: "nombre debe tener un maximo de 8 caracteres" },
                        }
                      )}
                      className={styles.inputNombresDni}
                      type="text"
                      placeholder="DNI DE ESTUDIANTE"
                    />
                    {errors.dni && <span className='text-red-400 text-sm'>{errors.dni.message as string}</span>}
                  </div>
                  <div className='w-full my-2'>
                    {/* <p className={styles.inputLabel}>nombre y apellidos</p> */}
                    <input
                      {...register("nombresApellidos",
                        {
                          required: { value: true, message: "dni es requerido" },
                          minLength: { value: 2, message: "nombre debe tener un minimo de 2 caracteres" },
                          maxLength: { value: 50, message: "nombre debe tener un maximo de 50 caracteres" },
                        }
                      )}
                      className={styles.inputNombresDni}
                      type="text"
                      placeholder="NOMBRES Y APELLIDOS DE ESTUDIANTES"
                    />
                    {errors.nombresApellidos && <span className='text-red-400 text-sm'>{errors.nombresApellidos.message as string}</span>}
                  </div>

                  <div className={styles.containerGradoSeccionGenero}>
                  <div className='w-full my-2'>
                    <select
                      {...register("grado",
                        {
                          required: { value: true, message: "El grado es requerido" }
                        }
                      )}
                      className={styles.inputNombresDni}
                    >
                      <option value="">--GRADO--</option>
                      {gradosDeColegio.map((grado) => (
                        <option key={grado.id} value={grado.id}>
                          {grado.name}
                        </option>
                      ))}
                    </select>
                    {errors.grado && <span className='text-red-400 text-sm'>{errors.grado.message as string}</span>}
                  </div>
                  <div className='w-full my-2'>
                    <select
                      {...register("seccion",
                        {
                          required: { value: true, message: "La sección es requerida" }
                        }
                      )}
                      className={styles.inputNombresDni}
                    >
                      <option value="">--SECCIÓN--</option>
                      {sectionByGrade.map((seccion) => (
                        <option key={seccion.id} value={seccion.id}>
                          {seccion.name.toUpperCase()}
                        </option>
                      ))}
                    </select>
                    {errors.seccion && <span className='text-red-400 text-sm'>{errors.seccion.message as string}</span>}
                  </div>
                  <div className='w-full my-2'>
                    <select
                      {...register("genero",
                        {
                          required: { value: true, message: "El género es requerido" }
                        }
                      )}
                      className={styles.inputNombresDni}
                    >
                      <option value="">--GÉNERO--</option>
                      {genero.map((gen) => (
                        <option key={gen.id} value={gen.id}>
                          {gen.name.toUpperCase()}
                        </option>
                      ))}
                    </select>
                    {errors.genero && <span className='text-red-400 text-sm'>{errors.genero.message as string}</span>}
                  </div>

                  </div>
                  {/* <p className={styles.tituloPreguntasRespuestas}>preguntas</p> */}
                  <div className={styles.preguntasContainer}>
                    <p className={styles.preguntaTitulo}>
                      <span className={styles.numeroPregunta}>
                        {preguntasRespuestasEstudiante[ordenLimitePregunta]?.order}.
                      </span>
                      {preguntasRespuestasEstudiante[ordenLimitePregunta]?.pregunta}</p>
                    <ul className={styles.respuestaContainer}>
                      {
                        preguntasRespuestasEstudiante &&
                        preguntasRespuestasEstudiante[ordenLimitePregunta]?.alternativas?.map((al, index) => {
                          return (
                            <li key={index} className={styles.respuestas}>
                              {
                                al.descripcion?.length === 0 ?
                                  null
                                  :
                                  <>
                                    <p className={styles.alternativa}>{al.alternativa}. </p>
                                    <input
                                      className={styles.radio}
                                      type="radio"
                                      name={`${preguntasRespuestasEstudiante[ordenLimitePregunta]?.order}`}
                                      // name={preguntasRespuestasEstudiante[ordenLimitePregunta]?.id}
                                      value={al.alternativa}
                                      checked={al?.selected === undefined ? false : al.selected}
                                      onChange={handleCheckedRespuesta} />
                                    <p className={styles.descripcionrespuesta}>{al.descripcion}</p>
                                  </>
                              }
                            </li>
                          )
                        })
                      }
                    </ul>
                  </div>

                  {
                    ordenLimitePregunta === preguntasRespuestas.length - 1 ?
                      <button
                        // onClick={salvarPrEstudiante}
                        disabled={activarBotonSiguiente && true} className='flex justify-center items-center bg-blue-500 hover:bg-blue-300 duration-300 p-3 rounded-md w-full text-white hover:text-slate-600 uppercase'>guardar</button>
                      :
                      // <button disabled={activarBotonSiguiente === true ? false : true} onClick={siguientePregunta} className={`flex justify-center items-center ${activarBotonSiguiente ? "bg-blue-500" : "bg-gray-400"} hover:bg-blue-300 duration-300 p-3 rounded-md w-full text-white hover:text-slate-600 uppercase`}>siguiente</button>
                      <button disabled={activarBotonSiguiente && true} onClick={siguientePregunta} className={!activarBotonSiguiente ? styles.botonSiguiente : styles.botonSiguienteDisabled}>siguiente</button>
                  }
                </form>
              </>
          }
        </div>
      </div>,
      container
    )
    : null
}

export default EvaluarEstudiante