import { createPortal } from "react-dom"
import styles from '../updateEvaluacion/updateEvaluacion.module.css'
import { useForm } from "react-hook-form";
import { useGlobalContext } from "@/features/context/GlolbalContext";
import { Evaluaciones, Psicolinguistica, User } from "@/features/types/types";
import { RiLoader4Line } from "react-icons/ri";
import { usePsicolinguistica } from "@/features/hooks/usePsicolinguistica";
import { useAgregarEvaluaciones } from "@/features/hooks/useAgregarEvaluaciones";
import { useEffect, useState } from "react";
import useUsuario from "@/features/hooks/useUsuario";

interface Props {
  handleShowModal: () => void,
  idUsuario: string,
}
const initialValue = { apellidos: "", institucion: "", dni: "", modular: "", nombres: "", region: 0, rol: 0, perfil: { nombre: "", rol: 0 } }
const UpdateUsuarioDirector = ({ idUsuario, handleShowModal }: Props) => {
  const { loaderSalvarPregunta, dataDirector } = useGlobalContext()
  const { updateEvaluacion } = useAgregarEvaluaciones()
  const [valueInput, setValueInput] = useState<User>(initialValue)
  // const [valueInput, setValueInput] = useState<Evaluaciones>(initialValue)
  const [nameUpdate, setNameUpdate] = useState()
  let container;
  if (typeof window !== "undefined") {
    container = document.getElementById("portal-modal");
  }
  const { getDirectorById, updateDirector } = useUsuario()
  const handleChangeInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    // setNameUpdate(e.target.value)
    // setValueInput({ ...valueInput, nombre: e.target.value })
    setValueInput({ ...valueInput, [e.target.name]: e.target.value })
  }

  const handleActualizar = () => {
    // updateEvaluacion(valueInput, idUsuario)
    updateDirector(idUsuario, valueInput)
    setValueInput(initialValue)
  }
  useEffect(() => {
    // getEvaluacion(idEva)
    getDirectorById(idUsuario)
  }, [])
  useEffect(() => {
    setValueInput(dataDirector)
  }, [dataDirector.dni])
  console.log('valueInput', valueInput)
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
                  <div className={styles.close} onClick={() => { handleShowModal(); setValueInput(initialValue) }} >cerrar</div>
                </div>
                <h3 className={styles.title}>Editar pregunta</h3>
                <div>
                  {/* <h3 className="text-xl text-white">{nameEva}</h3> */}
                  <label className="text-sm text-white font-martianMono">Dni</label>
                  <input
                    className={styles.inputNombresDni}
                    value={valueInput.dni}
                    disabled={true}
                  />
                  <label className="text-sm text-white font-martianMono">Nombres</label>
                  <input
                    className={styles.inputNombresDni}
                    type="text"
                    name="nombres"
                    value={valueInput.nombres}
                    onChange={handleChangeInput}
                  />
                  <label className="text-sm text-white font-martianMono">Apellidos</label>
                  <input
                    className={styles.inputNombresDni}
                    type="text"
                    name="apellidos"
                    value={valueInput.apellidos}
                    onChange={handleChangeInput}
                  />
                  <label className="text-sm text-white font-martianMono">Institución</label>
                  <input
                    className={styles.inputNombresDni}
                    type="text"
                    name="institucion"
                    value={valueInput.institucion}
                    onChange={handleChangeInput}
                  />
                  <label className="text-sm text-white font-martianMono">Modular</label>
                  <input
                    className={styles.inputNombresDni}
                    type="text"
                    name="modular"
                    value={valueInput.modular}
                    onChange={handleChangeInput}
                  />
                  <p className={styles.tituloBotones}>¿Quieres actualizar los datos de este usuario?</p>
                  <div className='flex gap-3 justify-center items-center'>

                    <button onClick={() => { handleShowModal(); setValueInput(initialValue) }} className={styles.buttonCrearEvaluacion}>CANCELAR</button>
                    <button onClick={() => { handleActualizar(); handleShowModal() }} className={styles.buttonDelete}>SI</button>

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

export default UpdateUsuarioDirector