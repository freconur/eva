import PrivateRouteAdmins from '@/components/layouts/PrivateRoutes'
import PrivateRouteAdmin from '@/components/layouts/PrivateRoutesAdmin'
import { useGlobalContext } from '@/features/context/GlolbalContext'
import { useAgregarEvaluaciones } from '@/features/hooks/useAgregarEvaluaciones'
import { useGenerarReporte } from '@/features/hooks/useGenerarReporte'
// import { Evaluaciones } from '@/features/types/types'
import DeleteEvaluacion from '@/modals/deleteEvaluacion'
import UpdateEvaluacion from '@/modals/updateEvaluacion'
import AlertModal from '@/modals/alertModal/AlertModal'

import Image from 'next/image'
import Link from 'next/link'
import { useRouter } from 'next/router'
import React, { useEffect, useState } from 'react'
import { MdDeleteForever, MdEditSquare, MdVisibility, MdVisibilityOff, MdAddCircle, MdCalendarToday, MdAnalytics, MdClose } from 'react-icons/md'
import { RiLoader4Line } from 'react-icons/ri'
import { toast } from 'react-toastify'
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
import { httpsCallable } from 'firebase/functions'
import { doc, onSnapshot, updateDoc } from 'firebase/firestore'
import { functions, db } from '@/firebase/firebase.config'

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
  const [processingIds, setProcessingIds] = useState<string[]>([])

  const router = useRouter()

  const { generarReporte } = useGenerarReporte()

  // Helper para mostrar nivel
  const getNivelGrado = (gradoNum: number) => {
    if (gradoNum === 12) return 'Inicial'
    if (gradoNum >= 1 && gradoNum <= 6) return 'Primaria'
    if (gradoNum >= 7 && gradoNum <= 11) return 'Secundaria'
    return 'Otro'
  }

  // Filtrar grados según el rol del usuario (sacado de GradosAcordeon)
  const gradosFiltrados = React.useMemo(() => {
    let list = grados
    if (currentUserData?.perfil?.rol === 5 && Array.isArray(currentUserData?.nivelesInstitucion)) {
      const niveles = currentUserData.nivelesInstitucion
      list = grados.filter(grado => grado.nivel !== undefined && niveles.includes(grado.nivel))
    }
    return [...list].sort((a, b) => {
      const nivelA = a.nivel ?? 0
      const nivelB = b.nivel ?? 0
      if (nivelA !== nivelB) return nivelA - nivelB
      return (a.grado ?? 0) - (b.grado ?? 0)
    })
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

  const handleGenerarReporteLocal = async (eva: any) => {
    if (!eva.id) {
      toast.warning('No se ha seleccionado una evaluación válida')
      return
    }

    const confirmed = window.confirm(
      'Este proceso puede tardar un máximo de 2 minutos. ¿Deseas continuar?'
    )

    if (!confirmed) return

    setProcessingIds(prev => [...prev, eva.id])

    try {
      const mes = Number(eva.mesDelExamen)
      const año = Number(eva.añoDelExamen || new Date().getFullYear().toString())

      const resultado = await generarReporte(eva.id, mes, {
        region: '',
        distrito: '',
        caracteristicaCurricular: '',
        genero: '',
        area: '',
      }, año)

      if (resultado) {
        toast.success(`Consolidado generado con éxito para la evaluación ${eva.nombre}`, {
          autoClose: 5000,
          position: "top-right",
        })
      }
    } catch (error: any) {
      if (error.code === 'functions/deadline-exceeded') {
        toast.warning('⚠️ Tiempo de espera agotado. El proceso podría seguir ejecutándose en el servidor.')
      } else {
        toast.error(`❌ Error al generar reporte: ${error.message || 'Error desconocido'}`)
      }
    } finally {
      setProcessingIds(prev => prev.filter(id => id !== eva.id))
    }
  }

  const handleCopyId = (id: string) => {
    navigator.clipboard.writeText(id)
    toast.success(`ID ${id} copiado al portapapeles`, {
      autoClose: 2000,
      position: "bottom-right",
    })
  }

  useEffect(() => {
    getGrades()
    // eslint-disable-next-line react-hooks/exhaustive-deps
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentUserData.dni])

  // --- SINCRONIZACIÓN DE FILTROS CON URL (QUERY PARAMS) ---
  useEffect(() => {
    if (!router.isReady) return;

    const { year, grado } = router.query;
    if (year) setSelectedYear(year as string);
    if (grado) setSelectedGrado(grado as string);
  }, [router.isReady, router.query]);

  const updateQueryParams = (newYear: string, newGrado: string) => {
    router.push({
      pathname: router.pathname,
      query: { ...router.query, year: newYear, grado: newGrado },
    }, undefined, { shallow: true });
  }


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
                    onChange={(e) => {
                      const val = e.target.value;
                      setSelectedYear(val);
                      updateQueryParams(val, selectedGrado);
                    }}
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
                    onChange={(e) => {
                      const val = e.target.value;
                      setSelectedGrado(val);
                      updateQueryParams(selectedYear, val);
                    }}
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
                      <th className={styles.tableHeaderCell}>ID</th>
                      <th className={styles.tableHeaderCell}>niveles</th>
                      <th className={styles.tableHeaderCell}>nombre de evaluación</th>
                      <th className={styles.tableHeaderCell}>grado / nivel</th>
                      <th className={styles.tableHeaderCell}>mes y año</th>
                      <th className={styles.tableHeaderCell}>estado</th>
                      <th className={styles.tableHeaderCell}>reporte</th>
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
                            <td 
                              className={styles.tableCell}
                              onClick={() => handleCopyId(eva.id || '')}
                              style={{ cursor: 'pointer' }}
                              title="Click para copiar ID"
                            >
                              <span style={{ fontSize: '0.75rem', color: '#64748b', fontFamily: 'monospace' }}>
                                {eva.id}
                              </span>
                            </td>
                            <td className={styles.tableCell}>
                              {eva.nivelYPuntaje === undefined ? (
                                <span style={{ color: '#ef4444', fontSize: '0.85rem', fontWeight: 500 }}>Undefined</span>
                              ) : Array.isArray(eva.nivelYPuntaje) && eva.nivelYPuntaje.length === 0 ? (
                                <span style={{ color: '#f59e0b', fontSize: '0.85rem', fontWeight: 500 }}>Vacío</span>
                              ) : (
                                <span style={{ color: '#10b981', fontSize: '0.85rem', fontWeight: 500 }}>Con data ({eva.nivelYPuntaje.length})</span>
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
                            <td className={styles.tableCell}>
                              {(puedeAcceder || currentUserData?.perfil?.rol === 5) ? (
                                <Link
                                  href={`/admin/evaluaciones/evaluacion/reporte?id=${currentUserData?.dni}&idEvaluacion=${eva.id}`}
                                  className={styles.reportLink}
                                >
                                  Ir
                                </Link>
                              ) : (
                                <span className={styles.inactiveIcon}>-</span>
                              )}
                            </td>
                            <td>
                              {puedeAcceder && currentUserData?.perfil?.rol === 4 ? (
                                <div className={styles.actionsContainer}>
                                  <ConsolidationAction eva={eva} />
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
                        <td colSpan={7} style={{ textAlign: 'center', padding: '2rem', color: '#64748b' }}>
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


// --- SUB-COMPONENTE PARA MANEJAR LA CONSOLIDACIÓN POR FILA ---
const ConsolidationAction = ({ eva }: { eva: any }) => {
  const [status, setStatus] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  const mes = eva.mesDelExamen;
  const año = eva.añoDelExamen || new Date().getFullYear().toString();

  useEffect(() => {
    if (!eva.id || mes === undefined || !año) return;

    const statusRef = doc(db, `evaluaciones/${eva.id}/estado_consolidacion`, `${año}_${mes}`);
    
    const unsubscribe = onSnapshot(statusRef, (snapshot) => {
      if (snapshot.exists()) {
        setStatus(snapshot.data());
      } else {
        setStatus(null);
      }
    });

    return () => unsubscribe();
  }, [eva.id, año, mes]);

  const handleStartConsolidation = async (isForced = false) => {
    if (!eva.id) return;

    const message = isForced 
      ? `⚠️ El proceso parece haberse detenido en ${status?.progress || 0}%. ¿Deseas FORZAR el reinicio de la consolidación para "${eva.nombre}"?`
      : `🚀 ¿Deseas generar la consolidación completa para "${eva.nombre}" (${año})?\n\nEsto se ejecutará en segundo plano.`;

    const confirmed = window.confirm(message);

    if (!confirmed) return;

    setLoading(true);
    try {
      const callOrchestrator = httpsCallable(functions, 'startFullConsolidation', { timeout: 540000 });
      
      await callOrchestrator({
        idEvaluacion: eva.id,
        año: Number(año),
        mes: Number(mes)
      });

      toast.success(`🚀 Proceso ${isForced ? 'reiniciado' : 'iniciado'} para ${eva.nombre}`);
    } catch (error: any) {
      console.error('Error orchestrator:', error);
      toast.error(`Error: ${error.message || 'Error al iniciar'}`);
    } finally {
      setLoading(false);
    }
  };

  const handleStopConsolidation = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!eva.id) return;

    const confirmed = window.confirm('🛑 ¿Deseas DETENER el proceso de consolidación?');
    if (!confirmed) return;

    try {
      const statusRef = doc(db, `evaluaciones/${eva.id}/estado_consolidacion`, `${año}_${mes}`);
      await updateDoc(statusRef, { 
        status: 'stopped',
        message: 'Proceso detenido por el usuario.',
        endTime: new Date()
      });
      toast.info('🛑 Petición de parada enviada.');
    } catch (error: any) {
      console.error('Error stopping:', error);
      toast.error('Error al detener el proceso.');
    }
  };

  const isProcessing = status?.status === 'processing';

  return (
    <div 
      style={{ display: 'flex', alignItems: 'center', gap: '8px' }}
    >
      <div 
        onClick={isProcessing ? () => handleStartConsolidation(true) : (!loading ? () => handleStartConsolidation(false) : undefined)}
        style={{ cursor: 'pointer', position: 'relative' }}
        title={isProcessing ? "Proceso en curso (clic para forzar reinicio si está trabado)" : "Generar consolidado global (Background)"}
      >
        {isProcessing ? (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
            <RiLoader4Line className={`${styles.actionIcon} ${styles.loaderIcon}`} />
            <span style={{ fontSize: '0.65rem', fontWeight: 'bold', color: '#4f46e5', marginTop: '-4px' }}>
              {status.progress}%
            </span>
          </div>
        ) : loading ? (
          <RiLoader4Line className={`${styles.actionIcon} ${styles.loaderIcon}`} />
        ) : (
          <MdAnalytics
            className={`${styles.actionIcon} ${styles.consolidadoIcon}`}
          />
        )}
      </div>

      {isProcessing && (
        <MdClose 
          className={styles.actionIcon}
          style={{ color: '#ef4444', cursor: 'pointer', fontSize: '1.2rem' }}
          title="Detener tarea"
          onClick={handleStopConsolidation}
        />
      )}
    </div>
  );
};

export default Evaluaciones
Evaluaciones.Auth = PrivateRouteAdmins