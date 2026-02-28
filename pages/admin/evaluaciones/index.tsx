import PrivateRouteAdmins from '@/components/layouts/PrivateRoutes'
import PrivateRouteAdmin from '@/components/layouts/PrivateRoutesAdmin'
import { useGlobalContext } from '@/features/context/GlolbalContext'
import { useAgregarEvaluaciones } from '@/features/hooks/useAgregarEvaluaciones'
// import { Evaluaciones } from '@/features/types/types'
import DeleteEvaluacion from '@/modals/deleteEvaluacion'
import UpdateEvaluacion from '@/modals/updateEvaluacion'
import AlertModal from '@/modals/alertModal/AlertModal'

import Image from 'next/image'
import Link from 'next/link'
import React, { useEffect, useState } from 'react'
import { MdDeleteForever, MdEditSquare, MdVisibility, MdVisibilityOff, MdAddCircle, MdCalendarToday } from 'react-icons/md'
import { RiLoader4Line } from 'react-icons/ri'
import { LocalizationProvider } from "@mui/x-date-pickers/LocalizationProvider";
import { AdapterDayjs } from "@mui/x-date-pickers/AdapterDayjs";
import { DesktopDatePicker } from "@mui/x-date-pickers";
import dayjs from "dayjs";
import "dayjs/locale/es";
import styles from './evaluaciones.module.css'
import { getMonthName } from '@/fuctions/dates'
import { getAllMonths } from '@/fuctions/dates'
import { createPortal } from 'react-dom'
import CreateEvaluacionModal from './CreateEvaluacionModal'

const Evaluaciones = () => {
  const { getEvaluaciones, getEvaluacion, updateEvaluacion, getGrades, totalPreguntas, validacionSiEvaluacionTienePreguntasYPuntuacion } = useAgregarEvaluaciones()
  const { evaluaciones, currentUserData, loaderPages, evaluacion, grados } = useGlobalContext()
  const [showDelete, setShowDelete] = useState<boolean>(false)
  const [inputUpdate, setInputUpdate] = useState<boolean>(false)
  const [idEva, setIdEva] = useState<string>("")
  const [nameEva, setNameEva] = useState<string>("")
  const [editingMonth, setEditingMonth] = useState<boolean>(false)
  const [editingMonthId, setEditingMonthId] = useState<string>("")
  const [updatingMonth, setUpdatingMonth] = useState<boolean>(false)
  const [viewMode, setViewMode] = useState<'acordeon' | 'table'>('acordeon')
  const [showAlert, setShowAlert] = useState<boolean>(false)
  const [alertMessage, setAlertMessage] = useState<string>("")
  const [showSuccessAlert, setShowSuccessAlert] = useState<boolean>(false)
  const [successData, setSuccessData] = useState<any>(null)
  const [showCreateModal, setShowCreateModal] = useState<boolean>(false)
  const [selectedYear, setSelectedYear] = useState<string>(new Date().getFullYear().toString())
  const [selectedGrado, setSelectedGrado] = useState<string>('all')

  // Helper para mostrar nivel
  const getNivelGrado = (gradoNum: number) => {
    if (gradoNum >= 1 && gradoNum <= 6) return 'Primaria'
    if (gradoNum >= 7 && gradoNum <= 11) return 'Secundaria'
    return 'Otro'
  }

  // Filtrar grados según el rol del usuario (sacado de GradosAcordeon)
  const gradosFiltrados = React.useMemo(() => {
    if (currentUserData?.perfil?.rol === 5) {
      if (currentUserData?.nivelesInstitucion?.includes(1)) {
        return grados.filter(grado => grado.nivel === 1)
      } else {
        return grados.filter(grado => grado.nivel === 2)
      }
    }
    return grados
  }, [grados, currentUserData?.perfil?.rol, currentUserData?.nivelesInstitucion])

  // Función para validar acceso a evaluación (sacado de GradosAcordeon)
  const tieneAccesoAEvaluacion = (evaluacion: any) => {
    const rol = currentUserData?.perfil?.rol
    const dni = currentUserData?.dni

    if (rol === 4) return true

    if (rol === 5) {
      return evaluacion.usuariosConPermisos?.includes(dni || '') || false
    }

    if (rol === 1) {
      return evaluacion.usuariosConPermisosUgel?.includes(dni || '') || false
    }

    return false
  }

  const years = React.useMemo(() => {
    const startYear = 2025
    const currentYear = new Date().getFullYear()
    const yearsArr = []
    for (let y = startYear; y <= currentYear; y++) {
      yearsArr.push(y.toString())
    }
    return yearsArr
  }, [])

  const handleShowCreateModal = () => { setShowCreateModal(!showCreateModal) }
  const handleShowInputUpdate = () => { setInputUpdate(!inputUpdate) }
  const handleShowModalDelete = () => { setShowDelete(!showDelete) }
  const handleShowAlert = () => { setShowAlert(!showAlert) }
  const handleShowSuccessAlert = () => { setShowSuccessAlert(!showSuccessAlert) }

  const handleActivateEvaluacion = async () => {
    if (successData) {
      const updatedEva = { ...successData.evaluacion, active: true }
      await updateEvaluacion(updatedEva, successData.evaluacion.id)
      setShowSuccessAlert(false)
      setSuccessData(null)
    }
  }
  const [dataEvaluacion, setDataEvaluacion] = useState(evaluacion)

  const toggleActiveStatus = async (eva: any) => {
    // Si se quiere activar, validar que nivelYPuntaje exista y tenga datos
    if (!eva.active) {
      // Solo aplicar la validación de nivelYPuntaje si tipoDeEvaluacion es "1"
      if (eva.tipoDeEvaluacion === "1") {
        if (!eva.nivelYPuntaje || !Array.isArray(eva.nivelYPuntaje) || eva.nivelYPuntaje.length === 0) {
          setAlertMessage('No se puede activar la evaluación. Debe configurar primero los niveles y puntajes.')
          setShowAlert(true)
          return
        }

        // Validar que existan preguntas y que todas tengan puntaje
        const { tienePuntajeValido: tienePuntaje, totalPreguntas: totalPreg, sumaTotalPuntajes } = await validacionSiEvaluacionTienePreguntasYPuntuacion(eva) as any;

        if (!tienePuntaje) {
          setAlertMessage('No se puede activar la evaluación. Debe configurar preguntas y asignar puntaje a todas las preguntas.')
          setShowAlert(true)
          return
        }

        // VALIDACIÓN DE SUMA COMPLETA
        // 1. Obtener el nivel "satisfactorio"
        const nivelSatisfactorio = eva.nivelYPuntaje.find((n: any) => n.nivel.toLowerCase() === 'satisfactorio');

        if (!nivelSatisfactorio) {
          setAlertMessage('No se puede activar la evaluación. No se encontró el nivel "Satisfactorio" en la configuración.');
          setShowAlert(true);
          return;
        }

        const puntajeMaximoSatisfactorio = Number(nivelSatisfactorio.max);
        const sumaPuntajesRegex = Number(sumaTotalPuntajes);

        if (sumaPuntajesRegex !== puntajeMaximoSatisfactorio) {
          setAlertMessage(`No se puede activar. La suma de los puntajes de las preguntas (${sumaPuntajesRegex}) debe ser igual al puntaje máximo del nivel Satisfactorio (${puntajeMaximoSatisfactorio}).`);
          setShowAlert(true);
          return;
        }

        // Si pasa las validaciones, mostrar los datos y activar
        setSuccessData({
          nivelYPuntaje: eva.nivelYPuntaje,
          totalPreguntas: totalPreg,
          evaluacion: eva
        })
        setShowSuccessAlert(true)
        return
      }
    }

    const updatedEva = { ...eva, active: !eva.active }
    await updateEvaluacion(updatedEva, eva.id)
  }

  const handleEditMonth = (eva: any) => {
    setEditingMonth(true)
    setEditingMonthId(eva.id)
    setDataEvaluacion({
      ...eva,
      añoDelExamen: eva.añoDelExamen || new Date().getFullYear().toString()
    })
  }

  const handleCancelEditMonth = () => {
    setEditingMonth(false)
    setEditingMonthId("")
    setDataEvaluacion(evaluacion)
  }

  const handleSaveMonth = async (newMonth: string, newYear: string) => {
    if (editingMonthId) {
      setUpdatingMonth(true)
      const updatedEva = {
        ...dataEvaluacion,
        mesDelExamen: newMonth,
        añoDelExamen: newYear
      }
      await updateEvaluacion(updatedEva, editingMonthId)
      setEditingMonth(false)
      setEditingMonthId("")
      setUpdatingMonth(false)
    }
  }
  useEffect(() => {
    getGrades()
  }, [])
  useEffect(() => {
    let unsubscribe: (() => void) | undefined;

    if (currentUserData.dni) {
      unsubscribe = getEvaluaciones();
    }

    // Cleanup function para desuscribirse cuando el componente se desmonte
    return () => {
      if (unsubscribe) {
        unsubscribe();
      }
    };
  }, [currentUserData.dni])


  console.log('evaluaciones', evaluaciones)
  console.log('grados', grados)

  const currentYear = new Date().getFullYear().toString()
  const filteredEvaluaciones = evaluaciones.filter(eva => {
    // 1. Filtrar año
    const matchesYear = (eva.añoDelExamen || currentYear) === selectedYear

    // 2. Filtrar grado
    let matchesGrado = true
    if (selectedGrado !== 'all') {
      matchesGrado = eva.grado === Number(selectedGrado)
    } else {
      // Si la opcion es 'all', el administrador/usuario solo debe ver los grados filtrados según su rol/nivel
      // Para ROL 5 o inferiores:
      const idsDeGradosPermitidos = gradosFiltrados.map(g => g.grado)
      matchesGrado = idsDeGradosPermitidos.includes(eva.grado)
    }

    return matchesYear && matchesGrado
  })

  return (
    <>
      {showDelete && <DeleteEvaluacion handleShowModalDelete={handleShowModalDelete} idEva={idEva} />}
      {inputUpdate && nameEva.length > 0 && <UpdateEvaluacion evaluacion={evaluacion} nameEva={nameEva} handleShowInputUpdate={handleShowInputUpdate} idEva={idEva} />}
      {showAlert && <AlertModal message={alertMessage} handleClose={handleShowAlert} />}
      {showCreateModal && (
        <CreateEvaluacionModal
          showModal={showCreateModal}
          handleShowModal={handleShowCreateModal}
        />
      )}
      {showSuccessAlert && successData && typeof window !== 'undefined' && createPortal(
        <div className={styles.successModal} onClick={handleShowSuccessAlert}>
          <div className={styles.successModalContent} onClick={(e) => e.stopPropagation()}>
            <div className={styles.successModalHeader}>
              <h3 className={styles.successModalTitle}>Confirmar Activación</h3>
              <div className={styles.successModalClose} onClick={handleShowSuccessAlert}>×</div>
            </div>
            <div className={styles.successModalBody}>
              <p style={{ marginBottom: '20px' }}>La evaluación cumple con todos los requisitos:</p>

              <div style={{ marginBottom: '20px' }}>
                <strong>Total de preguntas:</strong> {successData.totalPreguntas}
              </div>

              <div style={{ marginBottom: '20px' }}>
                <strong>Niveles y Puntajes:</strong>
                <div style={{ marginTop: '10px' }}>
                  {successData.nivelYPuntaje?.map((nivel: any, index: number) => (
                    <div key={index} style={{
                      padding: '8px',
                      margin: '5px 0',
                      backgroundColor: '#f5f5f5',
                      borderRadius: '4px',
                      display: 'flex',
                      justifyContent: 'space-between'
                    }}>
                      <span><strong>Nivel:</strong> {nivel.nivel}</span>
                      <span><strong>Puntaje:</strong> max:{nivel.max} - min:{nivel.min}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
            <div className={styles.successModalFooter}>
              <button
                onClick={handleActivateEvaluacion}
                className={styles.successModalButton}
              >
                ACEPTAR
              </button>
            </div>
          </div>
        </div>,
        document.getElementById('portal-modal') || document.body
      )}
      <div>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', margin: '2rem 2rem 0 2rem' }}>
          <h1 style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#1e293b', margin: 0 }}>Seguimiento y retroalimentación al desempeño del estudiante</h1>

          <button
            onClick={handleShowCreateModal}
            className={styles.createButton}
            title="Crear nueva evaluación"
          >
            <MdAddCircle />
            <span>Crear Evaluación</span>
          </button>
        </div>

        {/* Controles de filtro (Año y Grados) */}
        {loaderPages ? (
          <div className={styles.loader}>
            <div className={styles.loaderContent}>
              <div className={styles.loaderIcon} />
              <span className={styles.loaderText}>Cargando</span>
            </div>
          </div>
        ) : (
          <div className={styles.content}>
            <div className={styles.toolbar}>
              <div className={styles.filtersContainer} style={{ display: 'flex', gap: '2rem', flexWrap: 'wrap' }}>
                <div className={styles.yearFilterContainer} style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                  <span className={styles.filterLabel}>Año:</span>
                  <select
                    className={styles.monthSelect}
                    value={selectedYear}
                    onChange={(e) => setSelectedYear(e.target.value)}
                    style={{ padding: '0.4rem 1.25rem', borderRadius: '8px', border: '1px solid #e2e8f0' }}
                  >
                    {years.map(year => (
                      <option key={year} value={year}>
                        {year}
                      </option>
                    ))}
                  </select>
                </div>

                <div className={styles.gradoFilterContainer} style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                  <span className={styles.filterLabel}>Grado:</span>
                  <select
                    className={styles.monthSelect}
                    value={selectedGrado}
                    onChange={(e) => setSelectedGrado(e.target.value)}
                    style={{ padding: '0.4rem 1.25rem', borderRadius: '8px', border: '1px solid #e2e8f0' }}
                  >
                    <option value="all">Todos los grados permitidos</option>
                    {gradosFiltrados.map(grado => (
                      <option key={grado.id} value={grado.grado?.toString()}>
                        {grado.nombre} - Nivel {getNivelGrado(grado.grado || 0)}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

            {/* Vista de Tabla Unificada */}
            <div className={styles.tableViewContainer}>
              <div className={styles.tableContainer}>
                <table className={styles.table}>
                  <thead className={styles.tableHeader}>
                    <tr className={styles.tableHeaderRow}>
                      <th className={styles.tableHeaderCell}>#</th>
                      <th className={styles.tableHeaderCell}>nombre de evaluación</th>
                      <th className={styles.tableHeaderCell}>grado / nivel</th>
                      <th className={styles.tableHeaderCell}>mes y año</th>
                      <th className={styles.tableHeaderCell}>estado</th>
                      <th className={styles.tableHeaderCell}>acciones</th>
                    </tr>
                  </thead>
                  <tbody className={styles.tableBody}>
                    {filteredEvaluaciones.length > 0 ? (
                      filteredEvaluaciones?.map((eva, index) => {
                        const puedeAcceder = tieneAccesoAEvaluacion(eva)
                        const gradoObj = grados.find(g => g.grado === eva.grado)

                        return (
                          <tr key={index} className={styles.tableRow} style={{ opacity: puedeAcceder ? 1 : 0.6, background: puedeAcceder ? 'inherit' : '#f8fafc' }}>
                            <td className={styles.tableCell}>
                              {puedeAcceder ? (
                                <Link href={`/admin/evaluaciones/evaluacion/${eva.id}`}>
                                  {index + 1}
                                </Link>
                              ) : (
                                <span>{index + 1}</span>
                              )}
                            </td>
                            <td className={styles.tableCell}>
                              {puedeAcceder ? (
                                <Link href={`/admin/evaluaciones/evaluacion/${eva.id}`}>
                                  {eva.nombre?.toUpperCase() || ''}
                                </Link>
                              ) : (
                                <span>{eva.nombre?.toUpperCase() || ''}</span>
                              )}
                            </td>
                            <td className={styles.tableCell}>
                              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.2rem' }}>
                                <span style={{ fontWeight: 600 }}>{gradoObj?.nombre || `Grado ${eva.grado}`}</span>
                                <span style={{ fontSize: '0.75rem', color: '#64748b' }}>{getNivelGrado(eva.grado || 0)}</span>
                              </div>
                            </td>
                            <td className={styles.tableCell}>
                              {(!puedeAcceder) ? (
                                <span className={styles.monthText}>
                                  {getMonthName(Number(eva.mesDelExamen))} {eva.añoDelExamen || currentYear}
                                </span>
                              ) : editingMonth && editingMonthId === eva.id ? (
                                <div className={styles.monthEditContainer} style={{ minWidth: 'min-content' }}>
                                  <LocalizationProvider dateAdapter={AdapterDayjs} adapterLocale="es">
                                    <DesktopDatePicker
                                      views={['year', 'month']}
                                      label="Mes y Año"
                                      value={dataEvaluacion?.mesDelExamen ? dayjs().month(Number(dataEvaluacion.mesDelExamen)).year(Number(dataEvaluacion.añoDelExamen || currentYear)) : dayjs()}
                                      onChange={(newValue: any) => {
                                        if (newValue) {
                                          setDataEvaluacion({
                                            ...dataEvaluacion,
                                            mesDelExamen: newValue.month().toString(),
                                            añoDelExamen: newValue.year().toString()
                                          } as any)
                                        }
                                      }}
                                      slotProps={{
                                        textField: {
                                          size: 'small',
                                        }
                                      }}
                                    />
                                  </LocalizationProvider>
                                  <div className={styles.monthEditActions}>
                                    <button
                                      onClick={() => handleSaveMonth(dataEvaluacion.mesDelExamen || "0", dataEvaluacion.añoDelExamen || currentYear)}
                                      className={styles.saveMonthButton}
                                      title="Guardar mes"
                                    >
                                      {updatingMonth ? <RiLoader4Line className={styles.loaderIcon} /> : "✓"}
                                    </button>
                                    <button
                                      onClick={handleCancelEditMonth}
                                      className={styles.cancelMonthButton}
                                      title="Cancelar"
                                    >
                                      ✕
                                    </button>
                                  </div>
                                </div>
                              ) : (
                                <div className={styles.monthContainer}>
                                  <span className={styles.monthText}>
                                    {getMonthName(Number(eva.mesDelExamen))} {eva.añoDelExamen || currentYear}
                                  </span>
                                  {currentUserData?.perfil?.rol === 4 && (
                                    <button
                                      onClick={() => handleEditMonth(eva)}
                                      className={styles.editMonthButton}
                                      title="Editar mes del examen"
                                    >
                                      <MdCalendarToday className={styles.editMonthIcon} />
                                    </button>
                                  )}
                                </div>
                              )}
                            </td>
                            <td>
                              {!puedeAcceder ? (
                                <span className={styles.inactiveIcon} style={{ fontSize: '0.8rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>🔒 Sin acceso</span>
                              ) : eva.active ? (
                                <MdVisibility
                                  onClick={() => toggleActiveStatus(eva)}
                                  className={`${styles.actionIcon} ${styles.activeIcon}`}
                                  title="Evaluación activa - Click para desactivar"
                                />
                              ) : (
                                <MdVisibilityOff
                                  onClick={() => toggleActiveStatus(eva)}
                                  className={`${styles.actionIcon} ${styles.inactiveIcon}`}
                                  title="Evaluación inactiva - Click para activar"
                                />
                              )}
                            </td>
                            <td>
                              {puedeAcceder && currentUserData?.perfil?.rol === 4 ? (
                                <div className={styles.actionsContainer}>
                                  <MdEditSquare
                                    onClick={() => {
                                      setNameEva(`${eva.nombre}`);
                                      handleShowInputUpdate();
                                      setIdEva(`${eva.id}`)
                                    }}
                                    className={`${styles.actionIcon} ${styles.editIcon}`}
                                  />
                                  <MdDeleteForever
                                    onClick={() => {
                                      handleShowModalDelete();
                                      setIdEva(`${eva.id}`)
                                    }}
                                    className={`${styles.actionIcon} ${styles.deleteIcon}`}
                                  />
                                </div>
                              ) : null}
                            </td>
                          </tr>
                        )
                      })
                    ) : (
                      <tr>
                        <td colSpan={6} style={{ textAlign: 'center', padding: '2rem', color: '#64748b' }}>
                          No se encontraron evaluaciones para los filtros seleccionados.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}
      </div>
    </>
  )
}

export default Evaluaciones
Evaluaciones.Auth = PrivateRouteAdmins