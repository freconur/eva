import React, { useState, useEffect, useRef } from 'react'
import { createPortal } from 'react-dom'
import { MdContentCopy, MdClose, MdInfoOutline } from 'react-icons/md'
import { RiLoader4Line } from 'react-icons/ri'
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider'
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs'
import { DesktopDatePicker } from '@mui/x-date-pickers'
import dayjs, { Dayjs } from 'dayjs'
import 'dayjs/locale/es'
import { cleanExistingDateFromNombre, generarNuevoNombreEvaluacion } from './index'
import { useAgregarEvaluaciones } from '@/features/hooks/useAgregarEvaluaciones'
import { getNivelGrado } from '@/features/hooks/useEvaluacionesFilters'
import styles from './duplicarEvaluacion.module.css'

interface Props {
  showModal: boolean
  handleClose: () => void
  evaluaciones: any[]
  grados: any[]
  onCompleted?: () => void
}

const BulkDuplicateModal: React.FC<Props> = ({
  showModal,
  handleClose,
  evaluaciones,
  grados,
  onCompleted,
}) => {
  const { duplicarEvaluacionesMasivas } = useAgregarEvaluaciones()

  const [container, setContainer] = useState<Element | null>(null)
  const [selectedDate, setSelectedDate] = useState<Dayjs | null>(null)
  const [nuevoMes, setNuevoMes] = useState<string>('')
  const [nuevoAño, setNuevoAño] = useState<string>('')
  const [namesMap, setNamesMap] = useState<Record<string, string>>({})
  const [copiarNiveles, setCopiarNiveles] = useState<boolean>(true)
  const [isDuplicating, setIsDuplicating] = useState<boolean>(false)
  const [progress, setProgress] = useState<{ current: number; total: number }>({
    current: 0,
    total: 0,
  })

  const prevShowModalRef = useRef(false)

  useEffect(() => {
    setContainer(document.getElementById('portal-modal') || document.body)
  }, [])

  // Cerrar modal con tecla Escape
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && !isDuplicating) {
        handleClose()
      }
    }
    if (showModal) {
      window.addEventListener('keydown', handleKeyDown)
    }
    return () => {
      window.removeEventListener('keydown', handleKeyDown)
    }
  }, [showModal, isDuplicating, handleClose])

  // Inicializar estado únicamente cuando el modal pasa de cerrado a abierto
  useEffect(() => {
    if (showModal && !prevShowModalRef.current && !isDuplicating) {
      setSelectedDate(null)
      setNuevoMes('')
      setNuevoAño('')
      setNamesMap({})
      setCopiarNiveles(true)
      setProgress({ current: 0, total: evaluaciones?.length || 0 })
    }
    prevShowModalRef.current = showModal
  }, [showModal, isDuplicating, evaluaciones?.length])

  const handleDateChange = (newValue: Dayjs | null) => {
    setSelectedDate(newValue)
    if (newValue && newValue.isValid()) {
      setNuevoMes(newValue.month().toString())
      setNuevoAño(newValue.year().toString())

      const updatedNames: Record<string, string> = {}

      evaluaciones.forEach((eva) => {
        const currentCustom = namesMap[eva.id]
        const sourceName = currentCustom && currentCustom.trim().length > 0
          ? currentCustom
          : (eva.nombre || '')

        updatedNames[eva.id] = generarNuevoNombreEvaluacion(sourceName, newValue)
      })

      setNamesMap(updatedNames)
    } else {
      setNuevoMes('')
      setNuevoAño('')
      setNamesMap({})
    }
  }

  const handleNameChange = (id: string, newName: string) => {
    setNamesMap((prev) => ({
      ...prev,
      [id]: newName,
    }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedDate || evaluaciones.length === 0 || isDuplicating) return

    // Validar que todos los nombres tengan al menos 3 caracteres
    const hasInvalidName = evaluaciones.some(
      (eva) => !namesMap[eva.id] || namesMap[eva.id].trim().length < 3
    )
    if (hasInvalidName) return

    setIsDuplicating(true)
    setProgress({ current: 0, total: evaluaciones.length })

    const config = evaluaciones.map((eva) => ({
      idOrigen: eva.id,
      nuevoNombre: namesMap[eva.id].trim(),
      nuevoMes: nuevoMes,
      nuevoAño: nuevoAño,
    }))

    try {
      const createdIds = await duplicarEvaluacionesMasivas({
        evaluacionesConfig: config,
        copiarNivelYPuntaje: copiarNiveles,
        onProgress: (current, total) => {
          setProgress({ current, total })
        },
      })

      if (createdIds && createdIds.length > 0) {
        // Pausa breve para que el usuario pueda apreciar el 100% completado en la barra
        await new Promise((resolve) => setTimeout(resolve, 500))
        handleClose()
        if (onCompleted) {
          onCompleted()
        }
      }
    } catch (error) {
      console.error('Error durante la clonación masiva:', error)
    } finally {
      setIsDuplicating(false)
    }
  }

  if (!showModal || !evaluaciones || evaluaciones.length === 0 || !container) return null

  const progressPercentage =
    progress.total > 0 ? Math.round((progress.current / progress.total) * 100) : 0

  return createPortal(
    <div className={styles.modalOverlay} onClick={!isDuplicating ? handleClose : undefined}>
      <div className={styles.bulkModalContent} onClick={(e) => e.stopPropagation()}>
        <div className={styles.modalHeader}>
          <div className={styles.modalTitleWrapper}>
            <MdContentCopy className={styles.modalTitleIcon} />
            <h2 className={styles.modalTitle}>
              Duplicación Masiva
              <span className={styles.countBadge}>
                {evaluaciones.length} {evaluaciones.length === 1 ? 'evaluación' : 'evaluaciones'}
              </span>
            </h2>
          </div>
          {!isDuplicating && (
            <button onClick={handleClose} className={styles.closeButton} title="Cerrar modal (Esc)" type="button">
              <MdClose />
            </button>
          )}
        </div>

        <form onSubmit={handleSubmit} className={styles.form}>
          <div className={styles.bulkGrid}>
            {/* Columna Izquierda: Controles y opciones */}
            <div className={styles.bulkLeftColumn}>
              {/* 1. Selección de Fecha Global */}
              <div className={styles.inputGroup}>
                <LocalizationProvider dateAdapter={AdapterDayjs} adapterLocale="es">
                  <label className={styles.label}>
                    1. Selecciona la Nueva Fecha y Año
                  </label>
                  <DesktopDatePicker
                    value={selectedDate}
                    onChange={handleDateChange}
                    disabled={isDuplicating}
                    format="DD.MM.YYYY"
                    slotProps={{
                      textField: {
                        size: 'small',
                        fullWidth: true,
                        placeholder: 'Elige día, mes y año para todas...',
                        sx: {
                          backgroundColor: '#ffffff',
                          borderRadius: '8px',
                          '& .MuiOutlinedInput-root': {
                            height: '44px',
                            '& fieldset': {
                              borderColor: selectedDate ? '#6366f1' : '#e2e8f0',
                            },
                            '&:hover fieldset': {
                              borderColor: '#6366f1',
                            },
                            '&.Mui-focused fieldset': {
                              borderColor: '#6366f1',
                              borderWidth: '1px',
                            },
                          },
                          '& .MuiInputBase-input': {
                            padding: '0 1rem',
                            height: '44px',
                            boxSizing: 'border-box',
                            color: '#0f172a',
                            fontSize: '0.925rem',
                          },
                        },
                      },
                      popper: {
                        sx: {
                          zIndex: 99999,
                        },
                      },
                    }}
                  />
                </LocalizationProvider>
              </div>

              {/* Opciones por lote */}
              <div className={styles.checkboxContainer} style={{ gridTemplateColumns: '1fr' }}>
                <label className={styles.checkboxRow}>
                  <input
                    type="checkbox"
                    className={styles.checkboxInput}
                    checked={copiarNiveles}
                    onChange={(e) => setCopiarNiveles(e.target.checked)}
                    disabled={isDuplicating}
                  />
                  <div className={styles.checkboxContent}>
                    <span className={styles.checkboxTitle}>
                      Copiar niveles y rangos de puntaje
                    </span>
                    <span className={styles.checkboxDesc}>
                      Mantiene las escalas configuradas de cada evaluación (Satisfactorio, Proceso, Inicio).
                    </span>
                  </div>
                </label>
              </div>

              {/* Alerta informativa */}
              <div className={styles.noticeAlert}>
                <MdInfoOutline className={styles.noticeIcon} />
                <span>
                  Se crearán <strong>{evaluaciones.length} nuevas evaluaciones</strong> en estado{' '}
                  <strong>inactivo</strong> con todas sus preguntas, respuestas y puntajes originales clonados.
                </span>
              </div>

              {/* Barra de progreso si está duplicando */}
              {isDuplicating && (
                <div className={styles.progressContainer}>
                  <div className={styles.progressText}>
                    <span>
                      {progress.current === progress.total && progress.total > 0
                        ? `¡Completado! (${progress.current} de ${progress.total})`
                        : `Duplicando ${Math.min(progress.current + 1, progress.total)} de ${progress.total}...`}
                    </span>
                    <span>{progressPercentage}%</span>
                  </div>
                  <div className={styles.progressBarTrack}>
                    <div
                      className={styles.progressBarFill}
                      style={{ width: `${progressPercentage}%` }}
                    />
                  </div>
                </div>
              )}
            </div>

            {/* Columna Derecha: Lista de Evaluaciones y sus nuevos nombres */}
            <div className={styles.bulkRightColumn}>
              <div className={styles.inputGroup}>
                <label className={styles.label}>
                  2. Nuevos Nombres Asignados
                  {!selectedDate && (
                    <span className={styles.lockedBadge}> (Bloqueados hasta elegir fecha)</span>
                  )}
                </label>

                <div className={styles.bulkListContainer}>
                  {evaluaciones.map((eva) => {
                    const gradoObj = grados.find((g) => g.grado === eva.grado)
                    const gradoTxt = gradoObj?.nombre || `Grado ${eva.grado}`
                    const nivelTxt = getNivelGrado(eva.grado || 0)

                    return (
                      <div key={eva.id} className={styles.bulkRow}>
                        <div className={styles.bulkRowInfo}>
                          <span className={styles.bulkGradeBadge}>
                            {gradoTxt} • {nivelTxt}
                          </span>
                          <span className={styles.bulkOriginalName} title={eva.nombre}>
                            {eva.nombre}
                          </span>
                        </div>

                        <input
                          type="text"
                          className={styles.bulkInput}
                          value={namesMap[eva.id] || ''}
                          onChange={(e) => handleNameChange(eva.id, e.target.value)}
                          placeholder={
                            !selectedDate
                              ? 'Elige la fecha primero...'
                              : 'Nombre de la evaluación'
                          }
                          required
                          disabled={!selectedDate || isDuplicating}
                        />
                      </div>
                    )
                  })}
                </div>

                {selectedDate ? (
                  <span className={styles.hintActive}>
                    ✓ Nombres autogenerados con la nueva fecha. Puedes editar cualquiera individualmente si lo requieres.
                  </span>
                ) : (
                  <span className={styles.hintText}>
                    Al elegir la fecha a la izquierda se generarán los nuevos nombres automáticamente.
                  </span>
                )}
              </div>
            </div>
          </div>

          <div className={styles.buttonGroup}>
            <button
              type="button"
              onClick={handleClose}
              className={styles.cancelButton}
              disabled={isDuplicating}
            >
              Cancelar
            </button>
            <button
              type="submit"
              className={styles.submitButton}
              disabled={isDuplicating || !selectedDate}
            >
              {isDuplicating ? (
                <>
                  <RiLoader4Line className={styles.loaderIcon} />
                  <span>
                    Procesando ({progress.current}/{progress.total})...
                  </span>
                </>
              ) : (
                <>
                  <MdContentCopy />
                  <span>Duplicar {evaluaciones.length} Evaluaciones</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>,
    container
  )
}

export default BulkDuplicateModal
