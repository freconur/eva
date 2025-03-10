import { createPortal } from "react-dom"
import styles from '../updateEvaluacion/updateEvaluacion.module.css'
import { useForm } from "react-hook-form";
import { useGlobalContext } from "@/features/context/GlolbalContext";
import { Evaluaciones, Psicolinguistica } from "@/features/types/types";
import { RiLoader4Line } from "react-icons/ri";
import { usePsicolinguistica } from "@/features/hooks/usePsicolinguistica";
import { useAgregarEvaluaciones } from "@/features/hooks/useAgregarEvaluaciones";
import { useEffect, useState } from "react";

interface Props {
  handleShowInputUpdate: () => void,
  evaluacion: Evaluaciones,
  idEva: string,
  nameEva: string,
}
const initialValue = { nombre: "", categoria: 0, grado: 0, idDocente: "" }
const UpdateEvaluacion = ({ idEva, handleShowInputUpdate, nameEva, evaluacion }: Props) => {
  const { loaderSalvarPregunta, } = useGlobalContext()
  const { updateEvaluacion } = useAgregarEvaluaciones()
  const [valueInput, setValueInput] = useState<Evaluaciones>(evaluacion)
  // const [valueInput, setValueInput] = useState<Evaluaciones>(initialValue)
  const [nameUpdate, setNameUpdate] = useState(nameEva)
  let container;
  if (typeof window !== "undefined") {
    container = document.getElementById("portal-modal");
  }
  const { getEvaluacion } = useAgregarEvaluaciones()
  const handleChangeInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    setNameUpdate(e.target.value)
    setValueInput({ ...valueInput, nombre: e.target.value })
  }

  const handleActualizar = () => {
    console.log('nameUpdate', nameUpdate)
    console.log('valueInput', valueInput)
    updateEvaluacion(valueInput, idEva)
  }
  useEffect(() => {
    getEvaluacion(idEva)
  }, [])
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
                  <div className={styles.close} onClick={() => { handleShowInputUpdate(); setValueInput(initialValue) }} >cerrar</div>
                </div>
                <h3 className={styles.title}>Editar pregunta</h3>
                <div>
                  <h3 className="text-xl text-white">{nameEva}</h3>
                  <input
                    className={styles.inputNombresDni}
                    type="text"
                    name="nombre"
                    value={nameUpdate}
                    onChange={handleChangeInput}
                    placeholder={nameEva}
                  />
                  <p className={styles.tituloBotones}>¿Quieres actualizar esta evaluación?</p>
                  <div className='flex gap-3 justify-center items-center'>

                    <button onClick={() => { handleShowInputUpdate(); setValueInput(initialValue) }} className={styles.buttonCrearEvaluacion}>CANCELAR</button>
                    <button onClick={() => { handleActualizar() }} className={styles.buttonDelete}>SI</button>

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

export default UpdateEvaluacion