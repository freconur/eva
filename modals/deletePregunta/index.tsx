import { createPortal } from "react-dom"
import styles from './deletePregunta.module.css'
import { useGlobalContext } from "@/features/context/GlolbalContext"
import { RiLoader4Line } from 'react-icons/ri'

interface Props {
  idEvaluacion: string,
  idPregunta: string,
  handleShowModalDelete: () => void,
  onDelete: () => void
}

const DeletePregunta = ({ idEvaluacion, idPregunta, handleShowModalDelete, onDelete }: Props) => {
  const { loaderSalvarPregunta } = useGlobalContext()
  let container;
  if (typeof window !== "undefined") {
    container = document.getElementById("portal-modal");
  }

  return container
    ? createPortal(
      <div className={styles.containerModal}>
        <div className={styles.containerSale}>
          {loaderSalvarPregunta ? (
            <div className={styles.loaderContainer}>
              <div className={styles.loaderContent}>
                <RiLoader4Line className={styles.loaderIcon} />
                <span className={styles.loaderText}>...borrando pregunta</span>
              </div>
            </div>
          ) : (
            <>
              <div className={styles.closeModalContainer}>
                <div className={styles.close} onClick={handleShowModalDelete}>cerrar</div>
              </div>
              <h3 className={styles.title}>¿Estás seguro que quieres borrar esta pregunta?</h3>
              <p className={styles.advertenciaEliminar}>
                Esta acción no se puede deshacer, si aceptas, la pregunta se eliminará para siempre.
              </p>
              <div className={styles.buttonContainer}>
                <button onClick={handleShowModalDelete} className={styles.buttonCrearEvaluacion}>
                  CANCELAR
                </button>
                <button 
                  onClick={() => {
                    onDelete();
                    handleShowModalDelete();
                  }} 
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

export default DeletePregunta 