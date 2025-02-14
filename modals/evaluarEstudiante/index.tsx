import { createPortal } from "react-dom"
import styles from '../evaluarEstudiante/evaluarEstudiante.module.css'
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { useGlobalContext } from "@/features/context/GlolbalContext";
import { useAgregarEvaluaciones } from "@/features/hooks/useAgregarEvaluaciones";
import { Alternativa, Alternativas, Evaluaciones, PreguntasRespuestas } from "@/features/types/types";

interface Props {
  id: string,
  handleShowModalEstudiante: () => void,
  preguntasRespuestas: PreguntasRespuestas[]
}

const EvaluarEstudiante = ({ id, handleShowModalEstudiante }: Props) => {
  const { preguntasRespuestas, sizePreguntas, preguntasRespuestasEstudiante } = useGlobalContext()
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

  const validateRespuests = (data: PreguntasRespuestas[]) => {

    data.forEach(pq => {
      if (preguntasRespuestasEstudiante[ordenLimitePregunta]?.id === pq.id) {
        pq.alternativas?.forEach(a => {
          if (a.selected === true) {
            if (a.alternativa === pq.respuesta) {
              setRespuestasCorrectas(repuestasCorrectas + 1)
            }
          }
        })
      }
    })
  }
  const handleSubmitform = handleSubmit(async (data) => {




    validateRespuests(preguntasRespuestasEstudiante)
    salvarPreguntRespuestaEstudiante(data, id, preguntasRespuestasEstudiante, repuestasCorrectas, sizePreguntas)
    getPreguntasRespuestas(id)
    setOrdenLimitePregunta(0)
    setRespuestasCorrectas(0)
    prEstudiantes(preguntasRespuestas)
    reset()
  })
  const siguientePregunta = () => {
    if (sizePreguntas - 1 !== ordenLimitePregunta) {
      setOrdenLimitePregunta(ordenLimitePregunta + 1)
      validateRespuests(preguntasRespuestasEstudiante)
      //aqui tendria que agregar la funcion para que vaya incrementando
    }
    setActivarBotonSiguiente(false)

  }
  const handleCheckedRespuesta = (e: React.ChangeEvent<HTMLInputElement>) => {
    preguntasRespuestasEstudiante?.map((pq: PreguntasRespuestas, index: number) => {
      if (Number(pq.id) === Number(e.target.name)) {
        pq.alternativas?.map(al => {


          if (al.alternativa === e.target.value) {
            al.selected = true
            return al
          } else {
            al.selected = false
          }
        })
      }
    })
    preguntasRespuestasEstudiante.find(p => {
      if (Number(e.target.name) === Number(p.id)) {
        p.alternativas?.map(a => {
          if (a.selected === true) {
            setActivarBotonSiguiente(true)
          }
        })
      }
    })
    prEstudiantes(preguntasRespuestasEstudiante)
  }
  useEffect(() => {
    preguntasRespuestasEstudiante[ordenLimitePregunta]?.alternativas?.map(a => {
      if (a.selected === true) return setActivarBotonSiguiente(true)
    })
  }, [activarBotonSiguiente])

  useEffect(() => { prEstudiantes(preguntasRespuestas) }, [preguntasRespuestas])
  return container
    ? createPortal(
      <div className={styles.containerModal}>
        <div className={styles.containerSale}>
          <div className={styles.closeModalContainer}>
            <div className={styles.close} onClick={handleShowModalEstudiante}>cerrar</div>
          </div>
          <h3 className={styles.title}>evaluar estudiante</h3>
          <form onSubmit={handleSubmitform} >
            <div className='w-full my-2'>
              <p className={styles.inputLabel}>dni</p>
              <input
                {...register("dni",
                  {
                    required: { value: true, message: "dni es requerido" },
                    minLength: { value: 8, message: "nombre debe tener un minimo de 8 caracteres" },
                    maxLength: { value: 8, message: "nombre debe tener un maximo de 8 caracteres" },
                  }
                )}
                className={styles.inputNombresDni}
                type="number"
                placeholder="dni de estudiante"
              />
              {errors.dni && <span className='text-red-400 text-sm'>{errors.dni.message as string}</span>}
            </div>
            <div className='w-full my-2'>
              <p className={styles.inputLabel}>nombre y apellidos</p>
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
                placeholder="nombres y apellidos de estudiante"
              />
              {errors.nombresApellidos && <span className='text-red-400 text-sm'>{errors.nombresApellidos.message as string}</span>}
            </div>
            <h2 className={styles.tituloPreguntasRespuestas}>preguntas</h2>
            <div className={styles.preguntasContainer}>
              <p className={styles.preguntaTitulo}>
                <span className={styles.numeroPregunta}>
                  {preguntasRespuestasEstudiante[ordenLimitePregunta]?.id}.
                </span>
                {preguntasRespuestasEstudiante[ordenLimitePregunta]?.pregunta}</p>
              <ul className={styles.respuestaContainer}>
                {
                  preguntasRespuestasEstudiante &&
                  preguntasRespuestasEstudiante[ordenLimitePregunta]?.alternativas?.map((al, index) => {
                    return (
                      <li key={index} className={styles.respuestas}>
                        <p className={styles.alternativa}>{al.alternativa}. </p>
                        <input
                          className={styles.radio}
                          type="radio"
                          name={preguntasRespuestasEstudiante[ordenLimitePregunta]?.id}
                          value={al.alternativa}
                          checked={al?.selected}
                          onChange={handleCheckedRespuesta} />
                        <p className={styles.descripcionrespuesta}>{al.descripcion}</p>
                      </li>
                    )
                  })
                }
              </ul>
            </div>

            {
              ordenLimitePregunta === 24 ?
                <button
                  // onClick={salvarPrEstudiante}
                  disabled={activarBotonSiguiente === true ? false : true} className='flex justify-center items-center bg-blue-500 hover:bg-blue-300 duration-300 p-3 rounded-md w-full text-white hover:text-slate-600 uppercase'>guardar</button>
                :
                // <button disabled={activarBotonSiguiente === true ? false : true} onClick={siguientePregunta} className={`flex justify-center items-center ${activarBotonSiguiente ? "bg-blue-500" : "bg-gray-400"} hover:bg-blue-300 duration-300 p-3 rounded-md w-full text-white hover:text-slate-600 uppercase`}>siguiente</button>
                <button disabled={activarBotonSiguiente === true ? false : true} onClick={siguientePregunta} className={activarBotonSiguiente ? styles.botonSiguiente : styles.botonSiguienteDisabled}>siguiente</button>
            }
          </form>
        </div>
      </div>,
      container
    )
    : null
}

export default EvaluarEstudiante