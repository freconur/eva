import { createPortal } from "react-dom"
import styles from './deleteUsuario.module.css'
import { useForm } from "react-hook-form";
import { useGlobalContext } from "@/features/context/GlolbalContext";
import { Psicolinguistica } from "@/features/types/types";
import { RiLoader4Line } from "react-icons/ri";
import { usePsicolinguistica } from "@/features/hooks/usePsicolinguistica";
import { useAgregarEvaluaciones } from "@/features/hooks/useAgregarEvaluaciones";
import { useState } from "react";
import useUsuario from "@/features/hooks/useUsuario";

interface Props {
  handleShowModalDelete: () => void,
  idUsuario: string
}

const DeleteUsuario = ({ idUsuario, handleShowModalDelete }: Props) => {
  const { loaderSalvarPregunta } = useGlobalContext()
  const [reValidar, setReValidar] = useState(false)
  const { deleteUsuarioById } = useUsuario()
  const { deleteEvaluacion } = useAgregarEvaluaciones()
  let container;
  if (typeof window !== "undefined") {
    container = document.getElementById("portal-modal");
  }

  const handleDeleteEvaluacion = () => {
    deleteUsuarioById(idUsuario)
  }

  console.log('idUsuario', idUsuario)
  return container
    ? createPortal(
      <div className={styles.containerModal}>
        <div className={styles.containerSale}>
          {loaderSalvarPregunta ? (
            <div className={styles.loaderContainer}>
              <RiLoader4Line className={styles.loaderIcon} />
              <span className={styles.loaderText}>...borrando evaluación</span>
            </div>
          ) : (
            <>
              <div className={styles.closeModalContainer}>
                <div className={styles.close} onClick={() => { handleShowModalDelete(); setReValidar(false) }}>cerrar</div>
              </div>
              {reValidar ? (
                <div>
                  <p className={styles.advertenciaEliminar}>
                    Esta acción no se puede deshacer y el usuario se eliminará para siempre. Si estas seguro, dale a continuar
                  </p>
                  <div className={styles.buttonContainer}>
                    <button onClick={handleShowModalDelete} className={styles.buttonCrearEvaluacion}>CANCELAR</button>
                    <button onClick={() => { handleDeleteEvaluacion(); handleShowModalDelete(); setReValidar(false) }} className={styles.buttonDelete}>CONTINUAR</button>
                  </div>
                </div>
              ) : (
                <div>
                  <h3 className={styles.title}>¿Estás seguro que quieres borrar este usuario?</h3>
                  <div className={styles.buttonContainer}>
                    <button onClick={() => { handleShowModalDelete(); setReValidar(false) }} className={styles.buttonCrearEvaluacion}>CANCELAR</button>
                    <button onClick={() => { setReValidar(!reValidar) }} className={styles.buttonDelete}>SI</button>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>,
      container
    )
    : null
}

export default DeleteUsuario