import { createPortal } from "react-dom"
import styles from '../updateEvaluacion/updateEvaluacion.module.css'
import { useForm } from "react-hook-form";
import { useGlobalContext } from "@/features/context/GlolbalContext";
import { Evaluaciones, Psicolinguistica } from "@/features/types/types";
import { RiLoader4Line, RiGlobalLine, RiMapPin2Line, RiCheckLine, RiAlertLine } from "react-icons/ri";
import { usePsicolinguistica } from "@/features/hooks/usePsicolinguistica";
import { useAgregarEvaluaciones } from "@/features/hooks/useAgregarEvaluaciones";
import { useEffect, useState } from "react";
import { getAllMonths } from "@/fuctions/dates";
import { regiones } from "@/fuctions/regiones";
interface Props {
  handleShowInputUpdate: () => void,
  evaluacion: Evaluaciones,
  idEva: string,
  nameEva: string,
}
const initialValue = { nombre: "", categoria: 0, grado: 0, idDocente: "" }
const UpdateEvaluacion = ({ idEva, handleShowInputUpdate, nameEva }: Props) => {
  const { loaderSalvarPregunta, evaluacion, tiposDeEvaluacion } = useGlobalContext()
  const { updateEvaluacion, getTipoDeEvaluacion } = useAgregarEvaluaciones()
  const [valueInput, setValueInput] = useState<Evaluaciones>(evaluacion)
  // const [valueInput, setValueInput] = useState<Evaluaciones>(initialValue)
  const [nameUpdate, setNameUpdate] = useState(nameEva)
  const [selectedMonth, setSelectedMonth] = useState<string>(evaluacion.mesDelExamen || "0")
  const [isActive, setIsActive] = useState<boolean>(evaluacion.active || false)
  const [updating, setUpdating] = useState<boolean>(false)
  const [scopeMode, setScopeMode] = useState<'todas' | 'especificas'>('todas')
  const [selectedUgels, setSelectedUgels] = useState<number[]>([])
  let container;
  if (typeof window !== "undefined") {
    container = document.getElementById("portal-modal");
  }
  const { getEvaluacion } = useAgregarEvaluaciones()
  const handleChangeInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    setNameUpdate(e.target.value)
    setValueInput({ ...valueInput, nombre: e.target.value })
  }

  const handleMonthChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const monthId = e.target.value
    setSelectedMonth(monthId)
    setValueInput({ ...valueInput, mesDelExamen: monthId })
  }

  const handleTipoEvaluacionChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const tipoEvaluacion = e.target.value
    setValueInput({ ...valueInput, tipoDeEvaluacion: tipoEvaluacion })
  }

  const handleActiveChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const isActive = e.target.checked
    setIsActive(isActive)
    setValueInput({ ...valueInput, active: isActive })
  }

  const handleActualizar = async () => {
    if (scopeMode === 'especificas' && selectedUgels.length === 0) return
    setUpdating(true)
    try {
      await updateEvaluacion({
        ...evaluacion,
        nombre: valueInput.nombre,
        mesDelExamen: valueInput.mesDelExamen,
        tipoDeEvaluacion: valueInput.tipoDeEvaluacion,
        active: valueInput.active,
        ugels: scopeMode === 'especificas' ? selectedUgels.map(Number) : []
      }, idEva)
      setValueInput(initialValue)
    } finally {
      setUpdating(false)
    }
  }
  useEffect(() => {
    // setValueInput(initialValue)
    getTipoDeEvaluacion()
    getEvaluacion(idEva)
  }, [])
  useEffect(() => {
    if (evaluacion.id) {
      setValueInput({
        idDocente: evaluacion.idDocente || "",
        grado: evaluacion.grado || 0,
        nombre: evaluacion.nombre || "",
        categoria: evaluacion.categoria || 0,
        mesDelExamen: evaluacion.mesDelExamen || "0",
        tipoDeEvaluacion: evaluacion.tipoDeEvaluacion || "",
        active: evaluacion.active || false,
      })
      setNameUpdate(evaluacion.nombre || nameEva)
      setSelectedMonth(evaluacion.mesDelExamen || "0")
      setIsActive(evaluacion.active || false)
      if (evaluacion.ugels && Array.isArray(evaluacion.ugels) && evaluacion.ugels.length > 0) {
        setScopeMode('especificas')
        setSelectedUgels(evaluacion.ugels.map(Number))
      } else {
        setScopeMode('todas')
        setSelectedUgels([])
      }
    }
  }, [evaluacion.id, evaluacion.nombre, evaluacion.mesDelExamen, evaluacion.tipoDeEvaluacion, evaluacion.active, evaluacion.ugels])

  return container
    ? createPortal(
      <div className={styles.containerModal}>

        <div className={styles.containerSale}>

          {

            loaderSalvarPregunta ?
              <div className={styles.loaderWrapper}>
                <div className={styles.loaderContent}>
                  <RiLoader4Line className={styles.loaderIcon} />
                  <span className={styles.loaderText}>...borrando evaluación</span>
                </div>
              </div>
              :
              <>
                <div className={styles.closeModalContainer}>
                  <div className={styles.close} onClick={() => { handleShowInputUpdate(); setValueInput(initialValue) }} >cerrar</div>
                </div>
                <h3 className={styles.title}>Editar evaluación</h3>
                <div>
                  <h3 className={styles.evaluationTitle}>{nameEva}</h3>
                  <input
                    className={styles.inputNombresDni}
                    type="text"
                    name="nombre"
                    value={nameUpdate}
                    onChange={handleChangeInput}
                    placeholder={nameEva}
                  />

                  <div className={styles.inputContainer}>
                    <label className={styles.label}>Mes del examen:</label>
                    <select
                      className={styles.select}
                      value={selectedMonth}
                      onChange={handleMonthChange}
                    >
                      {getAllMonths.map((mes) => (
                        <option key={mes.id} value={mes.id.toString()}>
                          {mes.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className={styles.inputContainer}>
                    <label className={styles.label}>Tipo de evaluación:</label>
                    <select
                      className={styles.select}
                      value={valueInput.tipoDeEvaluacion || ""}
                      onChange={handleTipoEvaluacionChange}
                    >
                      <option value="">Seleccionar tipo</option>
                      {tiposDeEvaluacion?.map((tipo, index) => (
                        <option key={index} value={tipo.value}>
                          {tipo.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className={styles.inputContainer}>
                    <label className={styles.label}>Alcance de la Evaluación:</label>
                    <div className={styles.scopeSegmentedControl}>
                      <button
                        type="button"
                        onClick={() => {
                          setScopeMode('todas')
                          setSelectedUgels([])
                        }}
                        className={`${styles.scopeSegmentBtn} ${scopeMode === 'todas' ? styles.scopeSegmentBtnActive : ''}`}
                      >
                        <RiGlobalLine className={styles.scopeIcon} />
                        <span>Todas las UGELs</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => setScopeMode('especificas')}
                        className={`${styles.scopeSegmentBtn} ${scopeMode === 'especificas' ? styles.scopeSegmentBtnActive : ''}`}
                      >
                        <RiMapPin2Line className={styles.scopeIcon} />
                        <span>UGELs Específicas</span>
                        {selectedUgels.length > 0 && (
                          <span className={styles.scopeBadgeCount}>{selectedUgels.length}</span>
                        )}
                      </button>
                    </div>

                    {scopeMode === 'especificas' && (
                      <div className={styles.ugelsContainer}>
                        <div className={styles.ugelsHeaderBar}>
                          <span className={styles.ugelsCountText}>
                            {selectedUgels.length} de {regiones.length} seleccionadas
                          </span>
                          <div className={styles.ugelsActionsGroup}>
                            <button
                              type="button"
                              className={styles.ugelsActionLink}
                              onClick={() => setSelectedUgels(regiones.map(r => r.id))}
                            >
                              Marcar todas
                            </button>
                            <span className={styles.ugelsActionDivider}>|</span>
                            <button
                              type="button"
                              className={styles.ugelsActionLink}
                              onClick={() => setSelectedUgels([])}
                            >
                              Limpiar
                            </button>
                          </div>
                        </div>

                        <div className={styles.ugelsGrid}>
                          {regiones.map((reg) => {
                            const isChecked = selectedUgels.includes(reg.id)
                            return (
                              <button
                                key={reg.id}
                                type="button"
                                onClick={() => {
                                  if (isChecked) {
                                    setSelectedUgels(prev => prev.filter(id => id !== reg.id))
                                  } else {
                                    setSelectedUgels(prev => [...prev, reg.id])
                                  }
                                }}
                                className={`${styles.ugelChip} ${isChecked ? styles.ugelChipSelected : ''}`}
                              >
                                <span className={styles.ugelCheckboxIndicator}>
                                  {isChecked && <RiCheckLine className={styles.ugelCheckIcon} />}
                                </span>
                                <span className={styles.ugelName}>{reg.region}</span>
                              </button>
                            )
                          })}
                        </div>

                        {selectedUgels.length === 0 && (
                          <div className={styles.validationMessage}>
                            <RiAlertLine className={styles.validationIcon} />
                            <span>Seleccione al menos una UGEL para la opción específica.</span>
                          </div>
                        )}
                      </div>
                    )}
                  </div>

                  <p className={styles.tituloBotones}>¿Quieres actualizar esta evaluación?</p>
                  <div className={styles.buttonGroup}>

                    <button onClick={() => { handleShowInputUpdate(); setValueInput(initialValue) }} className={styles.buttonCrearEvaluacion}>CANCELAR</button>
                    <button
                      onClick={() => { handleActualizar(); handleShowInputUpdate(); setValueInput(initialValue) }}
                      className={styles.buttonDelete}
                      disabled={updating || (scopeMode === 'especificas' && selectedUgels.length === 0)}
                    >
                      {updating ? (
                        <div className={styles.loaderContainer}>
                          <RiLoader4Line className={styles.loaderIcon} />
                          <span>Actualizando...</span>
                        </div>
                      ) : (
                        "ACTUALIZAR"
                      )}
                    </button>

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

export default UpdateEvaluacion