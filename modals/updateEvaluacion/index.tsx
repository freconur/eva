import { createPortal } from "react-dom"
import styles from '../updateEvaluacion/updateEvaluacion.module.css'
import { useForm } from "react-hook-form";
import { useGlobalContext } from "@/features/context/GlolbalContext";
import { Evaluaciones, Psicolinguistica } from "@/features/types/types";
import { RiLoader4Line } from "react-icons/ri";
import { usePsicolinguistica } from "@/features/hooks/usePsicolinguistica";
import { useAgregarEvaluaciones } from "@/features/hooks/useAgregarEvaluaciones";
import { useEffect, useState } from "react";
import { getAllMonths } from "@/fuctions/dates";
interface Props {
  handleShowInputUpdate: () => void,
  evaluacion: Evaluaciones,
  idEva: string,
  nameEva: string,
}
const initialValue = { nombre: "", categoria: 0, grado: 0, idDocente: "" }
const UpdateEvaluacion = ({ idEva, handleShowInputUpdate, nameEva }: Props) => {
  const { loaderSalvarPregunta,evaluacion } = useGlobalContext()
  const { updateEvaluacion } = useAgregarEvaluaciones()
  const [valueInput, setValueInput] = useState<Evaluaciones>(evaluacion)
  // const [valueInput, setValueInput] = useState<Evaluaciones>(initialValue)
  const [nameUpdate, setNameUpdate] = useState(nameEva)
  const [selectedMonth, setSelectedMonth] = useState<string>(evaluacion.mesDelExamen || "0")
  const [updating, setUpdating] = useState<boolean>(false)
  let container;
  if (typeof window !== "undefined") {
    container = document.getElementById("portal-modal");
  }
  const { getEvaluacion } = useAgregarEvaluaciones()
  const handleChangeInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    setNameUpdate(e.target.value)
    setValueInput({ ...valueInput, nombre: e.target.value })
  }

  const handleMonthChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const monthId = e.target.value
    setSelectedMonth(monthId)
    setValueInput({ ...valueInput, mesDelExamen: monthId })
  }

  const handleActualizar = async () => {
    // console.log('nameUpdate', nameUpdate)
    // console.log('valueInput', valueInput)
    setUpdating(true)
    try {
      await updateEvaluacion({...evaluacion, nombre: valueInput.nombre, mesDelExamen: valueInput.mesDelExamen}, idEva)
      setValueInput(initialValue)
    } finally {
      setUpdating(false)
    }
  }
  useEffect(() => {
    // setValueInput(initialValue)
    getEvaluacion(idEva)
  }, [])
  useEffect(() => {
    setValueInput({idDocente:valueInput.idDocente, grado:valueInput.grado, nombre:valueInput.nombre, categoria:valueInput.categoria, mesDelExamen: valueInput.mesDelExamen })
  },[evaluacion.id])
  console.log('evaluacion',evaluacion)
  console.log('valueInput',valueInput)
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
                  
                  <div className={styles.inputContainer}>
                    <label className={styles.label}>Mes del examen:</label>
                    <select
                      className={styles.select}
                      value={selectedMonth}
                      onChange={handleMonthChange}
                    >
                      {getAllMonths.map((mes) => (
                        <option key={mes.id} value={mes.id.toString()}>
                          {mes.name}
                        </option>
                      ))}
                    </select>
                  </div>
                  
                  <p className={styles.tituloBotones}>¿Quieres actualizar esta evaluación?</p>
                  <div className='flex gap-3 justify-center items-center'>

                    <button onClick={() => { handleShowInputUpdate(); setValueInput(initialValue) }} className={styles.buttonCrearEvaluacion}>CANCELAR</button>
                    <button 
                      onClick={() => { handleActualizar();handleShowInputUpdate();setValueInput(initialValue) }} 
                      className={styles.buttonDelete}
                      disabled={updating}
                    >
                      {updating ? (
                        <div className={styles.loaderContainer}>
                          <RiLoader4Line className={styles.loaderIcon} />
                          <span>Actualizando...</span>
                        </div>
                      ) : (
                        "SI"
                      )}
                    </button>

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