import { createPortal } from "react-dom"
import styles from './updateEvaluacion.module.css'
import { useGlobalContext } from "@/features/context/GlolbalContext";
import { AlternativasDocente, PRDocentes } from "@/features/types/types";
import { RiLoader4Line } from "react-icons/ri";
import { useEffect, useState } from "react";
import UseEvaluacionEspecialistas from "@/features/hooks/UseEvaluacionEspecialistas";

interface Props {
  dataUpdate: PRDocentes,
  handleShowUpdateModal: () => void,
  id: string
}
const initialValue = {
  id: "",
  order: 0,
  criterio: "",
}

const initialValueAlternativas = { descripcion: "", alternativa: "", value: 0 }

const UpdatePreguntaRespuestaEspecialistas = ({ dataUpdate, handleShowUpdateModal, id }: Props) => {
  const { loaderSalvarPregunta, dimensionesEspecialistas } = useGlobalContext()
  const { updatePreResEspecialistas, getDimensionesEspecialistas } = UseEvaluacionEspecialistas()
  const [inputValue, setInputValue] = useState<PRDocentes>(initialValue)
  const [dimensionId, setDimensionId] = useState<string>('')

  useEffect(() => {
    getDimensionesEspecialistas(id)
  }, [id])
  const [dataA, setDataA] = useState<AlternativasDocente>(initialValueAlternativas)
  const [dataB, setDataB] = useState<AlternativasDocente>(initialValueAlternativas)
  const [dataC, setDataC] = useState<AlternativasDocente>(initialValueAlternativas)
  const [dataD, setDataD] = useState<AlternativasDocente>(initialValueAlternativas)
  let container;
  if (typeof window !== "undefined") {
    container = document.getElementById("portal-modal");
  }

  const handleOnChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => { setInputValue({ ...inputValue, criterio: e.target.value }) }
  const handleDimensionChange = (e: React.ChangeEvent<HTMLSelectElement>) => { setDimensionId(e.target.value) }

  const handleUpdatePRDirector = () => {
    updatePreResEspecialistas({
      ...inputValue,
      dimensionId: dimensionId,
      alternativas: dataUpdate.alternativas // Keep existing scale
    }, id)
  }

  useEffect(() => {
    if (dataUpdate) {
      setInputValue({ criterio: dataUpdate.criterio, order: dataUpdate.order, id: dataUpdate.id })
      setDimensionId(dataUpdate.dimensionId || '')
    }
  }, [dataUpdate])
  return container
    ? createPortal(
      <div className={styles.modalOverlay}>
        <div className={styles.modalContainer}>
          {
            loaderSalvarPregunta ?
              <div className={styles.loaderContainer}>
                <div className={styles.loaderContent}>
                  <RiLoader4Line className={styles.loaderIcon} />
                  <span className={styles.loaderText}>...actualizando</span>
                </div>
              </div>
              :
              <>
                <div className={styles.modalHeader}>
                  <div onClick={() => handleShowUpdateModal()} className={styles.closeButton}>cerrar</div>
                </div>
                <h3 className={styles.modalTitle}>Editar pregunta</h3>
                <div className={styles.modalContent}>
                  <div className={styles.formGroup}>
                    <p className={styles.label}>Dominio</p>
                    <select
                      className={styles.inputField}
                      value={dimensionId}
                      onChange={handleDimensionChange}
                    >
                      <option value="">Seleccione un dominio</option>
                      {dimensionesEspecialistas?.map((dim) => (
                        <option key={dim.id} value={dim.id}>
                          {dim.nombre}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className={styles.formGroup}>
                    <p className={styles.label}>Criterio / Pregunta</p>
                    <textarea
                      className={styles.inputField}
                      name="criterio"
                      value={inputValue.criterio}
                      onChange={handleOnChange}
                    />
                  </div>
                  <div className={styles.infoScale}>
                    <p>Escala: 0=No evidencia, 1=En proceso, 2=Logrado</p>
                  </div>
                  <p className={styles.confirmationText}>¿Quieres actualizar esta pregunta y sus alternativas?</p>
                  <div className={styles.buttonContainer}>
                    <button onClick={() => handleShowUpdateModal()} className={styles.cancelButton}>CANCELAR</button>
                    <button onClick={() => { handleUpdatePRDirector(); handleShowUpdateModal() }} className={styles.confirmButton}>SI</button>
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

export default UpdatePreguntaRespuestaEspecialistas