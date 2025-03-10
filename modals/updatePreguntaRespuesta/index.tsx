import { createPortal } from "react-dom"
import styles from '../updateEvaluacion/updateEvaluacion.module.css'
import { useForm } from "react-hook-form";
import { useGlobalContext } from "@/features/context/GlolbalContext";
import { Alternativa, Alternativas, Evaluaciones, PreguntasRespuestas, Psicolinguistica } from "@/features/types/types";
import { RiLoader4Line } from "react-icons/ri";
import { usePsicolinguistica } from "@/features/hooks/usePsicolinguistica";
import { useAgregarEvaluaciones } from "@/features/hooks/useAgregarEvaluaciones";
import { useEffect, useState } from "react";

interface Props {
  handleShowModalPreguntaRespuesta: () => void
  pregunta: PreguntasRespuestas,
  id: string,
  handleShowModalUpdatePreguntaRespuesta: () => void
}
const initialValue = {
  id: "",
  order: 0,
  pregunta: "",
  preguntaDocente: "",
  respuesta: "",
  alternativas: [
    { descripcion: "", alternativa: "", selected: false },
    { descripcion: "", alternativa: "", selected: false },
    { descripcion: "", alternativa: "", selected: false },
    { descripcion: "", alternativa: "", selected: false },
  ]
}

const initialValueAlternativas = { descripcion: "", alternativa: "", selected: false }

const UpdatePreguntaRespuesta = ({ pregunta, handleShowModalUpdatePreguntaRespuesta,handleShowModalPreguntaRespuesta, id }: Props) => {
  const { loaderSalvarPregunta, } = useGlobalContext()
  const { updateEvaluacion } = useAgregarEvaluaciones()
  // const [valueInput, setValueInput] = useState<PreguntasRespuestas>(pregunta)
  const [valueInput, setValueInput] = useState<PreguntasRespuestas>(initialValue)
  const [valueInputA, setValueInputA] = useState<Alternativa>(initialValueAlternativas)
  const [valueInputB, setValueInputB] = useState<Alternativa>(initialValueAlternativas)
  const [valueInputC, setValueInputC] = useState<Alternativa>(initialValueAlternativas)
  const [valueInputD, setValueInputD] = useState<Alternativa>(initialValueAlternativas)
  // const [valueInputAlternativas, setValueInputAlternativas] = useState<Alternativa[]>(initialValueAlternativas)
  // const [valueInput, setValueInput] = useState<Evaluaciones>(initialValue)
  // const [nameUpdate, setNameUpdate] = useState(nameEva)
  let container;
  if (typeof window !== "undefined") {
    container = document.getElementById("portal-modal");
  }
  const { updatePreguntaRespuesta } = useAgregarEvaluaciones()
  const handleChangeInput = (e: React.ChangeEvent<HTMLInputElement> | React.ChangeEvent<HTMLTextAreaElement>) => {
    // setNameUpdate(e.target.value)
    setValueInput({ ...valueInput, [e.target.name]: e.target.value })

  }
  const handleA = (e: React.ChangeEvent<HTMLInputElement>) => {
    setValueInputA({ ...valueInputA, descripcion: e.target.value })
  }
  const handleB = (e: React.ChangeEvent<HTMLInputElement>) => {
    setValueInputB({ ...valueInputB, descripcion: e.target.value })
  }
  const handleC = (e: React.ChangeEvent<HTMLInputElement>) => {
    setValueInputC({ ...valueInputC, descripcion: e.target.value })
  }
  const handleD = (e: React.ChangeEvent<HTMLInputElement>) => {
    setValueInputD({ ...valueInputD, descripcion: e.target.value })
  }

  const handleActualizar = () => {
    console.log('valueInput', valueInput)
    const array: Alternativa[] = []
    array.push(valueInputA)
    array.push(valueInputB)
    array.push(valueInputC)
    console.log('arrat', array)
    valueInputD?.descripcion?.length === 0 ? null : array.push(valueInputD)
    updatePreguntaRespuesta(valueInput, array, id)
  }
  useEffect(() => {
    setValueInput(pregunta)
    if (pregunta.alternativas) {
      // setValueInputAlternativas(pregunta.alternativas)
      setValueInputA(pregunta.alternativas[0])
      setValueInputB(pregunta.alternativas[1])
      setValueInputC(pregunta.alternativas[2])
      setValueInputD(pregunta.alternativas[3])
    }
  }, [])
  console.log('valueInput', valueInput)
  console.log('valueInputA', valueInputA)
  console.log('valueInputB', valueInputB)
  console.log('valueInputC', valueInputC)
  console.log('valueInputD', valueInputD)
  // console.log('valueInputAlternativas', valueInputAlternativas)
  return container
    ? createPortal(
      <div className={styles.containerModal}>

        <div className={styles.containerSale}>

          {

            loaderSalvarPregunta ?
              <div className='grid items-center justify-center'>
                <div className='flex justify-center items-center'>
                  <RiLoader4Line className="animate-spin text-3xl text-colorTercero " />
                  <span className='text-colorTercero animate-pulse'>...borrando evaluación</span>
                </div>
              </div>
              :
              <>
                <div className={styles.closeModalContainer}>
                  <div className={styles.close} onClick={() => { handleShowModalPreguntaRespuesta(); setValueInput(initialValue) }} >cerrar</div>
                </div>
                <h3 className={styles.title}>Editar pregunta</h3>
                <div>
                  {/* <h3 className="text-xl text-white">{valueInput.pregunta}</h3> */}
                  <textarea
                    className={styles.inputNombresDni}
                    name="pregunta"
                    value={valueInput.pregunta}
                    onChange={handleChangeInput}
                  // placeholder={nameEva}
                  />
                  <textarea
                    className={styles.inputNombresDni}
                    name="preguntaDocente"
                    value={valueInput.preguntaDocente}
                    onChange={handleChangeInput}
                  // placeholder={nameEva}
                  />
                  <div>
                    <input
                      type="text"
                      className={styles.inputNombresDni}
                      name="descripcion"
                      value={valueInputA.descripcion}
                      onChange={handleA}
                    />
                    <input
                      type="text"
                      className={styles.inputNombresDni}
                      name="descripcion"
                      value={valueInputB.descripcion}
                      onChange={handleB}
                    />
                    <input
                      type="text"
                      className={styles.inputNombresDni}
                      name="descripcion"
                      value={valueInputC.descripcion}
                      onChange={handleC}
                    />
                    <input
                      type="text"
                      className={styles.inputNombresDni}
                      name="descripcion"
                      value={valueInputD?.descripcion}
                      onChange={handleD}
                    />
                    <p className={styles.tituloBotones}>Respuesta Correcta</p>
                    <input
                      type="text"
                      className={styles.inputNombresDni}
                      name="respuesta"
                      value={valueInput.respuesta}
                      onChange={handleChangeInput}
                    />
                  </div>
                  <p className={styles.tituloBotones}>¿Quieres actualizar esta evaluación?</p>
                  <div className='flex gap-3 justify-center items-center'>

                    <button onClick={() => { handleShowModalPreguntaRespuesta(); setValueInput(initialValue) }} className={styles.buttonCrearEvaluacion}>CANCELAR</button>
                    <button onClick={() => {handleShowModalUpdatePreguntaRespuesta();handleActualizar() }} className={styles.buttonDelete}>SI</button>

                  </div>

                </div>
              </>
          }
        </div>
      </div>,
      container
    )
    : null
}

export default UpdatePreguntaRespuesta