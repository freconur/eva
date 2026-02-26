import { createPortal } from "react-dom"
import styles from './deleteEvaluacion.module.css'
import { useGlobalContext } from "@/features/context/GlolbalContext";
import { RiLoader4Line } from "react-icons/ri";
import { useAgregarEvaluaciones } from "@/features/hooks/useAgregarEvaluaciones";
import UseEvaluacionEspecialistas from "@/features/hooks/UseEvaluacionEspecialistas";

interface Props {
  handleShowModalDelete: () => void,
  idEva: string
}

const DeleteEvaluacionEspecialista = ({ idEva, handleShowModalDelete }: Props) => {
  const { loaderSalvarPregunta } = useGlobalContext()
  const { deleteEvaluacionEspecilistas } = UseEvaluacionEspecialistas()
  let container;
  if (typeof window !== "undefined") {
    container = document.getElementById("portal-modal");
  }

  const handleDeleteEvaluacion = () => {
    deleteEvaluacionEspecilistas(idEva)
  }

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
                  <div className={styles.close} onClick={handleShowModalDelete} >cerrar</div>
                </div>
                <h3 className={styles.title}>¿Estás seguro que quieres borrar esta evaluación?</h3>
                <p className={styles.advertenciaEliminar}>Esta acción no se puede deshacer. Si aceptas, la evaluación se eliminará de forma permanente.</p>
                <div className='flex gap-4 justify-center items-center mt-4 w-full'>
                  <button onClick={handleShowModalDelete} className={styles.buttonCrearEvaluacion}>Cancelar</button>
                  <button onClick={() => { handleDeleteEvaluacion(); handleShowModalDelete() }} className={styles.buttonDelete}>Eliminar</button>
                </div>

              </>
          }
        </div>
      </div>,
      container
    )
    : null
}

export default DeleteEvaluacionEspecialista