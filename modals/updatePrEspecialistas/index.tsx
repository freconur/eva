import { createPortal } from "react-dom"
import styles from './updateEvaluacion.module.css'
import { useGlobalContext } from "@/features/context/GlolbalContext";
import { AlternativasDocente, PRDocentes, DimensionEspecialista } from "@/features/types/types";
import { RiLoader4Line } from "react-icons/ri";
import useEvaluacionDesempenoBase from "@/features/hooks/useEvaluacionDesempenoBase";
import { useEffect, useState } from "react";

interface Props {
  dataUpdate: PRDocentes,
  handleShowUpdateModal?: () => void,
  onClose?: () => void,
  onSuccess?: () => void,
  id?: string,
  idEvaluacion?: string,
  dimensiones?: DimensionEspecialista[],
  escala?: AlternativasDocente[],
  collectionName?: string
}
const initialValue = {
  id: "",
  order: 0,
  criterio: "",
}

const initialValueAlternativas = { descripcion: "", alternativa: "", value: 0 }

const UpdatePreguntaRespuestaEspecialistas = ({
  dataUpdate,
  handleShowUpdateModal,
  onClose,
  onSuccess,
  id,
  idEvaluacion,
  dimensiones: propDimensiones,
  collectionName = 'evaluaciones-especialista'
}: Props) => {
  const { loaderSalvarPregunta, dimensionesEspecialistas, dataEvaluacionDocente } = useGlobalContext()
  const targetId = idEvaluacion || id || ''
  const closeHandler = onClose || handleShowUpdateModal
  const dimensiones = propDimensiones || dimensionesEspecialistas || []
  const { updatePreguntaRespuesta, getDimensiones } = useEvaluacionDesempenoBase({ collectionName })
  const [inputValue, setInputValue] = useState<PRDocentes>(initialValue)
  const [dimensionId, setDimensionId] = useState<string>('')
  const [requiereEvidencia, setRequiereEvidencia] = useState<boolean>(false)
  const [descripcionEvidencia, setDescripcionEvidencia] = useState<string>('')

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && closeHandler) {
        closeHandler();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [closeHandler]);

  useEffect(() => {
    if (targetId) {
      getDimensiones(targetId)
    }
  }, [targetId, getDimensiones])
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

  const handleUpdatePRDirector = async () => {
    await updatePreguntaRespuesta({
      ...inputValue,
      dimensionId: dimensionId,
      alternativas: dataUpdate.alternativas, // Keep existing scale
      requiereEvidencia,
      descripcionEvidencia
    }, targetId)
    if (onSuccess) onSuccess()
    if (closeHandler) closeHandler()
  }


  useEffect(() => {
    if (dataUpdate) {
      setInputValue({ criterio: dataUpdate.criterio, order: dataUpdate.order, id: dataUpdate.id })
      setDimensionId(dataUpdate.dimensionId || '')
      setRequiereEvidencia(dataUpdate.requiereEvidencia || false)
      setDescripcionEvidencia(dataUpdate.descripcionEvidencia || '')
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
                  <div onClick={() => closeHandler && closeHandler()} className={styles.closeButton}>cerrar</div>
                </div>
                <h3 className={styles.modalTitle}>Editar criterio</h3>
                <div className={styles.modalContent}>
                  <div className={styles.formGroup}>
                    <p className={styles.label}>Dominio</p>
                    <select
                      className={styles.inputField}
                      value={dimensionId}
                      onChange={handleDimensionChange}
                    >
                      <option value="">Seleccione un dominio</option>
                      {dimensiones?.map((dim) => (
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
                  {dataEvaluacionDocente?.activarEvidencias && (
                    <>
                      <div className={styles.formGroupCheckbox}>
                        <input
                          type="checkbox"
                          id="requiereEvidenciaUpdate"
                          checked={requiereEvidencia}
                          onChange={(e) => setRequiereEvidencia(e.target.checked)}
                        />
                        <label htmlFor="requiereEvidenciaUpdate">¿Requiere evidencia?</label>
                      </div>
                      {requiereEvidencia && (
                        <div className={styles.formGroup}>
                          <p className={styles.label}>Descripción de la evidencia</p>
                          <textarea
                            className={styles.inputField}
                            placeholder="Ej: Plan de trabajo, fotos de la asistencia..."
                            value={descripcionEvidencia}
                            onChange={(e) => setDescripcionEvidencia(e.target.value)}
                          />
                        </div>
                      )}
                    </>
                  )}

                  <p className={styles.confirmationText}>¿Quieres actualizar este criterio?</p>
                  <div className={styles.buttonContainer}>
                    <button onClick={() => closeHandler && closeHandler()} className={styles.cancelButton}>CANCELAR</button>
                    <button onClick={() => handleUpdatePRDirector()} className={styles.confirmButton}>SI</button>
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