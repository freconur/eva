import { createPortal } from "react-dom"
import styles from '../evaluarDocente/EvaluarDocente.module.css'
import { useForm } from "react-hook-form";
import { useGlobalContext } from "@/features/context/GlolbalContext";
import { PRDocentes, respuestaPsicolinguistica } from "@/features/types/types";
import { RiLoader4Line } from "react-icons/ri";
import { usePsicolinguistica } from "@/features/hooks/usePsicolinguistica";
import { useState } from "react";
import UseEvaluacionDocentes from "@/features/hooks/UseEvaluacionDocentes";
import UseEvaluacionDirectores from "@/features/hooks/UseEvaluacionDirectores";

interface Props {
  handleShowEvaluarDocente: () => void,
  id: string
  // preguntasPsicolinguistica: PsicolinguiticaExamen[]
  getPreguntaRespuestaDocentes: PRDocentes[]
}

const EvaluarDirector = ({ handleShowEvaluarDocente, id, getPreguntaRespuestaDocentes }: Props) => {
  const { loaderSalvarPregunta, } = useGlobalContext()
  const [ordenLimitePregunta, setOrdenLimitePregunta] = useState(0)
  let container;
  if (typeof window !== "undefined") {
    container = document.getElementById("portal-modal");
  }
  const { register, handleSubmit, watch, reset, formState: { errors } } = useForm()
  const { preguntasPsicolinguistica, dataDirector, warningDataDocente } = useGlobalContext()
  const [originalPR, setOriginalPR] = useState([...getPreguntaRespuestaDocentes])
  const [copyPR, setCopyPR] = useState(getPreguntaRespuestaDocentes)
  const [observacion, setObservacion] = useState<boolean>(false)
  const [dniDocente, setDniDocente] = useState<string>("")
  const [valueObservacion, setValueObservacion] = useState<string>("")
  // console.log('testing', preguntasPsicolinguistica)
  const { actualizarPreguntasPsicolinguistica } = usePsicolinguistica()
  const { buscarDirector, guardarEvaluacionDirector, resetDirector, agregarObservacionDirector } = UseEvaluacionDirectores()

  //FUNCION DECTECCION DE CAMBIO DEL VALOR DE CHECKED
  const handleCheckedRespuesta = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (copyPR[ordenLimitePregunta].alternativas)
      copyPR[ordenLimitePregunta] = {
        ...copyPR[ordenLimitePregunta],
        alternativas: [
          { alternativa: 'a', value: copyPR[ordenLimitePregunta].alternativas[0].value, descripcion: copyPR[ordenLimitePregunta].alternativas[0].descripcion, selected: e.target.value === 'a' ? true : false },
          { alternativa: 'b', value: copyPR[ordenLimitePregunta].alternativas[1].value, descripcion: copyPR[ordenLimitePregunta].alternativas[1].descripcion, selected: e.target.value === 'b' ? true : false },
          { alternativa: 'c', value: copyPR[ordenLimitePregunta].alternativas[2].value, descripcion: copyPR[ordenLimitePregunta].alternativas[2].descripcion, selected: e.target.value === 'c' ? true : false },
          { alternativa: 'd', value: copyPR[ordenLimitePregunta].alternativas[3].value, descripcion: copyPR[ordenLimitePregunta].alternativas[3].descripcion, selected: e.target.value === 'd' ? true : false },
        ]
      }
    actualizarPreguntasPsicolinguistica(preguntasPsicolinguistica)
  }
  //FUNCION DECTECCION DE CAMBIO DEL VALOR DE CHECKED
  //FUNCION PARA QUE ME CREE LAS RESPUESTAS DE SI O NO
  const preguntaRespuestaFunction = (data: PRDocentes[]) => {
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

  const activeButtonSiguiente = () => {
    if (copyPR[ordenLimitePregunta]?.alternativas) {
      const rta = copyPR[ordenLimitePregunta]?.alternativas.find(a => a.selected === true)
      return rta
    }
  }
  const handleChangeObservacion = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setValueObservacion(e.target.value)
  }
  //USEFFECT PARA ACTUALIZACION DE LOS DATOS AL DAR CHECKED
  const handleFinalizar = () => {
    if(dataDirector.dni) {
      agregarObservacionDirector(id, dataDirector.dni, valueObservacion)
      setObservacion(!observacion)
      setCopyPR([...originalPR])
      resetDirector()
    }
  }
  const handleSalvarPreguntaDocente = (e: React.ChangeEvent<HTMLFormElement>) => {
    e.preventDefault()
    if (dataDirector.dni) {
      guardarEvaluacionDirector(id, copyPR, dataDirector)
      setCopyPR([...originalPR])
      setOrdenLimitePregunta(0)
      setObservacion(!observacion)
    }
  }
  const handleChangeDocente = (e: React.ChangeEvent<HTMLInputElement>) => {
    setDniDocente(e.target.value)
  }
  const handleBuscardDocente = () => {
    buscarDirector(dniDocente)
  }
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
                  <span className='text-colorTercero animate-pulse'>...guardando evaluación</span>
                </div>
              </div>
              :
              <>
                <div className={styles.closeModalContainer}>
                  <div className={styles.close} onClick={handleShowEvaluarDocente} >cerrar</div>
                </div>
                <h3 className={styles.title}>Evaluación de Director</h3>
                <div className='w-full my-2'>
                  <div className={styles.containerBuscarDocente}>
                    <input
                      name="dni"
                      className={styles.inputNombresDni}
                      type="number"
                      placeholder="NÚMERO DE DNI"
                      onChange={handleChangeDocente}
                    />
                    <button disabled={dniDocente.length === 8 ? false : true} onClick={handleBuscardDocente} className={styles.buscarDocentebutton}>Buscar</button>
                  </div>
                  {
                    dataDirector.dni &&
                    <div className="text-slate-500">
                      <p>DNI: <strong>{dataDirector.dni}</strong></p>
                      <p>Nombres y Apellidos: <strong>{dataDirector.nombres?.toUpperCase()} {dataDirector.apellidos?.toUpperCase()}</strong></p>
                    </div>

                  }
                  <div className="grid">
                    {dniDocente.length !== 8 && <span className='pl-3 text-red-400 text-sm'> *dni debe tener 8 digitos</span>}
                    {warningDataDocente?.length > 0 && <span className='pl-3 text-red-400 text-sm'>*{warningDataDocente}</span>}
                  </div>
                </div>
                <form onSubmit={handleSalvarPreguntaDocente}>


                  {
                    observacion ?
                      <div>
                        <textarea
                          onChange={handleChangeObservacion}
                          className={styles.textAreaPregunta}
                          placeholder="ESCRIBE UNA OBSERVACIÓN PARA EL DOCENTE"
                        />
                      </div>
                      :
                      <>
                        <div className={styles.containerPregunta}>
                          <h3 className={styles.tituloPregunta}>{`${ordenLimitePregunta + 1})`}{copyPR[ordenLimitePregunta]?.criterio}</h3>
                        </div>
                        <div className={styles.containerPreguntasAlternativas}>
                          {preguntaRespuestaFunction(copyPR)}
                        </div>
                      </>
                  }
                  <div className={ordenLimitePregunta === 0 ? styles.buttonsContainer : styles.buttonsContainerSiguiente}>
                    {
                      ordenLimitePregunta === 0 ? null :
                        <div onClick={() => setOrdenLimitePregunta(ordenLimitePregunta - 1)} className={styles.buttonCrearEvaluacion}>Atras</div>
                    }
                    {
                      ordenLimitePregunta === Number(copyPR.length) - 1 ?
                        // null 
                        activeButtonSiguiente() &&
                        <button className={styles.buttonCrearEvaluacion}>Guardar</button>
                        :
                        /* observacion ?
                          <div onClick={() => handleFinalizar()} className={styles.buttonCrearEvaluacion}>Finalizar</div>
                          : */
                          activeButtonSiguiente() &&
                          <div onClick={() => setOrdenLimitePregunta(ordenLimitePregunta + 1)} className={styles.buttonCrearEvaluacion}>Siguiente</div>
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

export default EvaluarDirector