import { createPortal } from "react-dom"
import styles from '../deleteEvaluacion/deleteEvaluacion.module.css'
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
                  <div className={styles.close} onClick={() => { handleShowModalDelete(); setReValidar(false) }} >cerrar</div>
                </div>
                {
                  reValidar ?
                    <div>
                      <p className={styles.advertenciaEliminar}>Esta acción no se puede deshacer y el usuario se eliminará para siempre. Si estas seguro, dale a continuar</p>
                      <div className='flex gap-3 justify-center items-center'>
                        <button onClick={handleShowModalDelete} className={styles.buttonCrearEvaluacion}>CANCELAR</button>
                        {/* <button onClick={() => {handleDeleteEvaluacion(); handleShowModalDelete()}} className={styles.buttonDelete}>SI</button> */}
                        <button onClick={() => { handleDeleteEvaluacion();handleShowModalDelete(); setReValidar(false) }} className={styles.buttonDelete}>CONTINUAR</button>
                      </div>
                    </div>

                    :
                    <div>
                      <h3 className={styles.title}>¿Estás seguro que quieres borrar este usuario?</h3>

                      <div >
                        <div className='flex gap-3 justify-center items-center'>
                          <button onClick={() => {handleShowModalDelete(); setReValidar(false)}} className={styles.buttonCrearEvaluacion}>CANCELAR</button>
                          {/* <button onClick={() => {handleDeleteEvaluacion(); handleShowModalDelete()}} className={styles.buttonDelete}>SI</button> */}
                          <button onClick={() => { setReValidar(!reValidar) }} className={styles.buttonDelete}>SI</button>
                        </div>
                      </div>
                    </div>
                }
              </>
          }
        </div>
      </div>,
      container
    )
    : null
}

export default DeleteUsuario