import { createPortal } from "react-dom";
import styles from "../deleteEvaluacion/deleteEvaluacion.module.css";
import { useForm } from "react-hook-form";
import { useGlobalContext } from "@/features/context/GlolbalContext";
import { Estudiante, Psicolinguistica } from "@/features/types/types";
import { RiLoader4Line } from "react-icons/ri";
import { usePsicolinguistica } from "@/features/hooks/usePsicolinguistica";
import { useAgregarEvaluaciones } from "@/features/hooks/useAgregarEvaluaciones";
import { useState } from "react";
import useUsuario from "@/features/hooks/useUsuario";

interface Props {
  handleShowModalDelete: () => void;
  idEstudiante: string;
  idExamen: string;
  estudiantes: Estudiante[];
}

const DeleteEstudiante = ({
  idEstudiante,
  estudiantes,
  handleShowModalDelete,
  idExamen,
}: Props) => {
  const { loaderSalvarPregunta } = useGlobalContext();
  const [reValidar, setReValidar] = useState(false);
  const [exito, setExito] = useState(false);
  const { deleteEstudianteById } = useUsuario();
  const { deleteEvaluacion } = useAgregarEvaluaciones();
  let container;
  if (typeof window !== "undefined") {
    container = document.getElementById("portal-modal");
  }

  const handleDeleteEvaluacion = () => {
    deleteEstudianteById(idEstudiante, idExamen, estudiantes);
  };
  console.log("estudiantes", estudiantes);
  return container
    ? createPortal(
        <div className={styles.containerModal}>
          <div className={styles.containerSale}>
            {loaderSalvarPregunta ? (
              <div className="grid items-center justify-center">
                <div className="flex justify-center items-center">
                  <RiLoader4Line className="animate-spin text-3xl text-colorTercero " />
                  <span className="text-colorTercero animate-pulse">
                    ...borrando respuestas
                  </span>
                </div>
              </div>
            ) : (
              <>
                <div className={styles.closeModalContainer}>
                  <div
                    className={styles.close}
                    onClick={() => {
                      handleShowModalDelete();
                      setReValidar(false);
                      setExito(false)
                    }}
                  >
                    cerrar
                  </div>
                </div>
                {reValidar ? (
                  !exito ? 
                    <div>
                      <p className={styles.advertenciaEliminar}>
                        Esta acción no se puede deshacer y los resutlados se
                        eliminará para siempre. Si estas seguro, dale a
                        continuar
                      </p>
                      <div className="flex gap-3 justify-center items-center">
                        <button
                          onClick={handleShowModalDelete}
                          className={styles.buttonCrearEvaluacion}
                        >
                          CANCELAR
                        </button>
                        {/* <button onClick={() => {handleDeleteEvaluacion(); handleShowModalDelete()}} className={styles.buttonDelete}>SI</button> */}
                        <button
                          onClick={() => {
                            handleDeleteEvaluacion();
                            // setReValidar(false);
                            setExito(!exito)
                          }}
                          className={styles.buttonDelete}
                        >
                          CONTINUAR
                        </button>
                      </div>
                    </div>
                  :
                  <p className={styles.advertenciaEliminar}>se ha eliminado resultados con exito</p>
                ) : (
                  <div>
                    <h3 className={styles.title}>
                      ¿Estás seguro que quieres borrar los resultados del
                      estudiante?
                    </h3>

                    <div>
                      <div className="flex gap-3 justify-center items-center">
                        <button
                          onClick={() => {
                            handleShowModalDelete();
                            setReValidar(false);
                          }}
                          className={styles.buttonCrearEvaluacion}
                        >
                          CANCELAR
                        </button>
                        {/* <button onClick={() => {handleDeleteEvaluacion(); handleShowModalDelete()}} className={styles.buttonDelete}>SI</button> */}
                        <button
                          onClick={() => {
                            setReValidar(!reValidar);
                          }}
                          className={styles.buttonDelete}
                        >
                          SI
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
        </div>,
        container
      )
    : null;
};

export default DeleteEstudiante;
