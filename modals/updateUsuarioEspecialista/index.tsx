import { createPortal } from "react-dom"
import styles from './updateUsuarioEspecialista.module.css'
import { useForm } from "react-hook-form";
import { useGlobalContext } from "@/features/context/GlolbalContext";
import { User } from "@/features/types/types";
import { RiLoader4Line } from "react-icons/ri";
import { useEffect, useState } from "react";
import useUsuario from "@/features/hooks/useUsuario";

interface Props {
  handleShowModal: () => void,
  idUsuario: string,
}

const initialValue = { 
  apellidos: "", 
  institucion: "", 
  dni: "", 
  modular: "", 
  nombres: "", 
  region: 0, 
  rol: 0, 
  perfil: { nombre: "", rol: 0 } 
}

const UpdateUsuarioEspecialista = ({ idUsuario, handleShowModal }: Props) => {
  const { loaderSalvarPregunta, dataDirector } = useGlobalContext()
  const [valueInput, setValueInput] = useState<User>(initialValue)
  const { getDirectorById, updateEspecialista } = useUsuario()

  let container;
  if (typeof window !== "undefined") {
    container = document.getElementById("portal-modal");
  }

  const handleChangeInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    setValueInput(prev => ({ ...prev, [e.target.name]: e.target.value }))
  }

  const handleActualizar = async () => {
    try {
      await updateEspecialista(idUsuario, valueInput)
      setValueInput(initialValue)
      handleShowModal()
    } catch (error) {
      console.error('Error al actualizar especialista:', error)
    }
  }

  useEffect(() => {
    if (idUsuario) {
      getDirectorById(idUsuario)
    }
  }, [idUsuario])

  useEffect(() => {
    if (dataDirector && dataDirector.dni) {
      setValueInput(dataDirector)
    }
  }, [dataDirector])

  return container
    ? createPortal(
      <div className={styles.containerModal}>
        <div className={styles.containerSale}>
          {loaderSalvarPregunta ? (
            <div className={styles.loaderContainer}>
              <RiLoader4Line className={styles.loaderIcon} />
              <span>...actualizando usuario</span>
            </div>
          ) : (
            <>
              <div className={styles.closeModalContainer}>
                <div className={styles.close} onClick={() => { handleShowModal(); setValueInput(initialValue) }}>
                  cerrar
                </div>
              </div>
              
              <h3 className={styles.title}>Editar usuario especialista</h3>
              
              <div className={styles.formGroup}>
                <label className={styles.label}>DNI</label>
                <input
                  className={styles.inputNombresDni}
                  value={valueInput.dni}
                  disabled={true}
                />
              </div>

              <div className={styles.formGroup}>
                <label className={styles.label}>Nombres</label>
                <input
                  className={styles.inputNombresDni}
                  type="text"
                  name="nombres"
                  value={valueInput.nombres}
                  onChange={handleChangeInput}
                />
              </div>

              <div className={styles.formGroup}>
                <label className={styles.label}>Apellidos</label>
                <input
                  className={styles.inputNombresDni}
                  type="text"
                  name="apellidos"
                  value={valueInput.apellidos}
                  onChange={handleChangeInput}
                />
              </div>
              
              <p className={styles.tituloBotones}>¿Quieres actualizar los datos de este usuario?</p>
              
              <div className={styles.buttonContainer}>
                <button 
                  onClick={() => { handleShowModal(); setValueInput(initialValue) }} 
                  className={styles.buttonCrearEvaluacion}
                >
                  CANCELAR
                </button>
                <button 
                  onClick={() => { handleActualizar(); handleShowModal() }} 
                  className={styles.buttonDelete}
                >
                  SI
                </button>
              </div>
            </>
          )}
        </div>
      </div>,
      container
    )
    : null
}

export default UpdateUsuarioEspecialista