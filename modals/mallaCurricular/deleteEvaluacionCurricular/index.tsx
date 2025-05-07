import { createPortal } from "react-dom"
import styles from './deleteEvaluacion.module.css'
import { useGlobalContext } from "@/features/context/GlolbalContext";
import { RiLoader4Line } from "react-icons/ri";
import { useAgregarEvaluaciones } from "@/features/hooks/useAgregarEvaluaciones";
import UseEvaluacionEspecialistas from "@/features/hooks/UseEvaluacionEspecialistas";
import UseEvaluacionDirectores from "@/features/hooks/UseEvaluacionDirectores";

interface Props {
  handleShowModalDelete: () => void,
  idEva:string
}

const DeleteEvaluacionCurricular = ({idEva,handleShowModalDelete}:Props) => {
  const {loaderSalvarPregunta } = useGlobalContext()
  const { deleteEvaluacionDirectorCurricular } = UseEvaluacionDirectores() 
  let container;
  if (typeof window !== "undefined") {
    container = document.getElementById("portal-modal");
  }

const handleDeleteEvaluacion = () => {
  deleteEvaluacionDirectorCurricular(idEva)
}

  return container
    ? createPortal(
      <div className={styles.containerModal}>
        <div className={styles.containerSale}>
          {loaderSalvarPregunta ? (
            <div className={styles.loadingContainer}>
              <div className={styles.loadingContent}>
                <RiLoader4Line className={styles.loadingIcon} />
                <span className={styles.loadingText}>...borrando evaluación</span>
              </div>
            </div>
          ) : (
            <>
              <div className={styles.closeModalContainer}>
                <div className={styles.close} onClick={handleShowModalDelete}>cerrar</div>
              </div>
              <h3 className={styles.title}>¿Estás seguro que quieres borrar esta evaluación?</h3>
              <p className={styles.advertenciaEliminar}>
                Esta acción no se puede deshacer, si aceptas, la evaluación se eliminará para siempre.
              </p>
              <div className={styles.buttonContainer}>
                <button onClick={handleShowModalDelete} className={styles.buttonCrearEvaluacion}>
                  CANCELAR
                </button>
                <button 
                  onClick={() => {
                    handleDeleteEvaluacion();
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

export default DeleteEvaluacionCurricular