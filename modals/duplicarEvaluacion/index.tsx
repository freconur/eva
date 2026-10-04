import React, { useState, useEffect } from 'react'
import { createPortal } from 'react-dom'
import { useRouter } from 'next/router'
import { MdContentCopy, MdClose, MdInfoOutline } from 'react-icons/md'
import { RiLoader4Line } from 'react-icons/ri'
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider'
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs'
import { DesktopDatePicker } from '@mui/x-date-pickers'
import dayjs, { Dayjs } from 'dayjs'
import 'dayjs/locale/es'
import { getMonthName } from '@/fuctions/dates'
import { useAgregarEvaluaciones } from '@/features/hooks/useAgregarEvaluaciones'
import styles from './duplicarEvaluacion.module.css'

interface Props {
  showModal: boolean
  handleClose: () => void
  evaluacion: any
  gradoNombre?: string
  nivelNombre?: string
  onDuplicated?: (nuevoId: string) => void
}

/**
 * Limpia sufijos de fechas previas de un nombre de evaluación
 * Ejemplos:
 * "1ero matematica 07.07.2026" -> "1ero matematica"
 * "1ero matematica - 07/07/2026" -> "1ero matematica"
 * "1ero matematica 7.7.2026" -> "1ero matematica"
 */
const NOMBRES_MESES = [
  'enero',
  'febrero',
  'marzo',
  'abril',
  'mayo',
  'junio',
  'julio',
  'agosto',
  'septiembre',
  'octubre',
  'noviembre',
  'diciembre',
]

/**
 * Limpia sufijos de fechas numéricas y nombres de meses previos de un nombre de evaluación,
 * detectando si contenía el nombre del mes y el estilo de mayúsculas/minúsculas.
 */
export const cleanExistingDateAndMonthFromNombre = (
  nombre: string
): {
  baseName: string
  hadMonth: boolean
  monthCasing: 'UPPER' | 'CAPITALIZED' | 'LOWER'
} => {
  if (!nombre) {
    return { baseName: '', hadMonth: false, monthCasing: 'LOWER' }
  }

  let cleaned = nombre.trim()
  let hadMonth = false
  let monthCasing: 'UPPER' | 'CAPITALIZED' | 'LOWER' = 'LOWER'

  const DATE_REGEX = /\s*[-–—/.,]?\s*\b\d{1,2}[./-]\d{1,2}(?:[./-]\d{2,4})?\b\s*$/i
  const MONTH_REGEX = /\s*[-–—/.,]?\s*(?:del?\s+mes\s+de\s+|de\s+)?\b(enero|febrero|marzo|abril|mayo|junio|julio|agosto|septiembre|setiembre|octubre|noviembre|diciembre)\b\s*$/i

  let changed = true
  while (changed) {
    changed = false
    if (DATE_REGEX.test(cleaned)) {
      cleaned = cleaned.replace(DATE_REGEX, '').trim()
      changed = true
    }
    const monthMatch = cleaned.match(MONTH_REGEX)
    if (monthMatch) {
      hadMonth = true
      const rawMonth = monthMatch[1]
      if (rawMonth === rawMonth.toUpperCase()) {
        monthCasing = 'UPPER'
      } else if (rawMonth[0] === rawMonth[0].toUpperCase()) {
        monthCasing = 'CAPITALIZED'
      } else {
        monthCasing = 'LOWER'
      }
      cleaned = cleaned.replace(MONTH_REGEX, '').trim()
      changed = true
    }
  }

  // Limpiar posibles guiones o separadores residuales al final
  cleaned = cleaned.replace(/\s*[-–—/.,]\s*$/, '').trim()

  return { baseName: cleaned, hadMonth, monthCasing }
}

/**
 * Limpia sufijos de fechas previas de un nombre de evaluación
 */
export const cleanExistingDateFromNombre = (nombre: string): string => {
  if (!nombre) return ''
  return cleanExistingDateAndMonthFromNombre(nombre).baseName
}

/**
 * Genera el nuevo nombre de la evaluación adaptando el mes si existía en el nombre original.
 * Ejemplos:
 * "1ero matematica marzo 01.03.2026" + 15.10.2026 -> "1ero matematica octubre 15.10.2026"
 * "1ero matematica Marzo 01.03.2026" + 15.10.2026 -> "1ero matematica Octubre 15.10.2026"
 * "1ero matematica 01.03.2026" + 15.10.2026 -> "1ero matematica 15.10.2026"
 */
export const generarNuevoNombreEvaluacion = (
  nombreActual: string,
  targetDate: Dayjs
): string => {
  if (!nombreActual && !targetDate) return ''
  if (!targetDate || !targetDate.isValid()) return nombreActual || ''

  const { baseName, hadMonth, monthCasing } = cleanExistingDateAndMonthFromNombre(nombreActual)
  const formattedDate = targetDate.format('DD.MM.YYYY')

  const monthIndex = targetDate.month()
  let newMonthName = NOMBRES_MESES[monthIndex] || ''

  if (monthCasing === 'UPPER') {
    newMonthName = newMonthName.toUpperCase()
  } else if (monthCasing === 'CAPITALIZED') {
    newMonthName = newMonthName.charAt(0).toUpperCase() + newMonthName.slice(1)
  } else {
    newMonthName = newMonthName.toLowerCase()
  }

  if (hadMonth) {
    return baseName ? `${baseName} ${newMonthName} ${formattedDate}` : `${newMonthName} ${formattedDate}`
  } else {
    return baseName ? `${baseName} ${formattedDate}` : formattedDate
  }
}

const DuplicateEvaluacionModal: React.FC<Props> = ({
  showModal,
  handleClose,
  evaluacion,
  gradoNombre,
  nivelNombre,
  onDuplicated,
}) => {
  const router = useRouter()
  const { duplicarEvaluacion } = useAgregarEvaluaciones()

  const [container, setContainer] = useState<Element | null>(null)
  const [nuevoNombre, setNuevoNombre] = useState<string>('')
  const [selectedDate, setSelectedDate] = useState<Dayjs | null>(null)
  const [nuevoMes, setNuevoMes] = useState<string>('')
  const [nuevoAño, setNuevoAño] = useState<string>('')
  const [copiarNiveles, setCopiarNiveles] = useState<boolean>(true)
  const [redirigir, setRedirigir] = useState<boolean>(true)
  const [isDuplicating, setIsDuplicating] = useState<boolean>(false)

  useEffect(() => {
    setContainer(document.getElementById('portal-modal') || document.body)
  }, [])

  useEffect(() => {
    if (evaluacion) {
      // Inicia con fecha sin seleccionar para forzar la elección primero
      setSelectedDate(null)
      setNuevoNombre('')
      setNuevoMes('')
      setNuevoAño('')
      setCopiarNiveles(
        Boolean(
          evaluacion.nivelYPuntaje &&
            Array.isArray(evaluacion.nivelYPuntaje) &&
            evaluacion.nivelYPuntaje.length > 0
        )
      )
      setRedirigir(true)
    }
  }, [evaluacion])

  const handleDateChange = (newValue: Dayjs | null) => {
    setSelectedDate(newValue)
    if (newValue && newValue.isValid()) {
      setNuevoMes(newValue.month().toString())
      setNuevoAño(newValue.year().toString())

      // Conservar el nombre base original adaptando el mes si existía
      const sourceName = nuevoNombre.trim().length > 0 ? nuevoNombre : (evaluacion?.nombre || '')
      const finalName = generarNuevoNombreEvaluacion(sourceName, newValue)
      setNuevoNombre(finalName)
    } else {
      setNuevoMes('')
      setNuevoAño('')
      setNuevoNombre('')
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!evaluacion?.id || !selectedDate || nuevoNombre.trim().length < 3 || isDuplicating) return

    setIsDuplicating(true)
    try {
      const nuevoId = await duplicarEvaluacion({
        idOrigen: evaluacion.id,
        nuevoNombre: nuevoNombre.trim(),
        nuevoMes: nuevoMes,
        nuevoAño: nuevoAño,
        copiarNivelYPuntaje: copiarNiveles,
      })

      if (nuevoId) {
        handleClose()
        if (onDuplicated) {
          onDuplicated(nuevoId)
        }
        if (redirigir) {
          router.push(`/admin/evaluaciones/evaluacion/${nuevoId}`)
        }
      }
    } catch (error) {
      console.error('Error al duplicar evaluación:', error)
    } finally {
      setIsDuplicating(false)
    }
  }

  if (!showModal || !evaluacion || !container) return null

  const originalMonthName = evaluacion.mesDelExamen !== undefined ? getMonthName(Number(evaluacion.mesDelExamen)) : ''
  const originalYear = evaluacion.añoDelExamen || ''

  return createPortal(
    <div className={styles.modalOverlay} onClick={handleClose}>
      <div className={styles.modalContent} onClick={(e) => e.stopPropagation()}>
        <div className={styles.modalHeader}>
          <div className={styles.modalTitleWrapper}>
            <MdContentCopy className={styles.modalTitleIcon} />
            <h2 className={styles.modalTitle}>Duplicar Evaluación</h2>
          </div>
          <button onClick={handleClose} className={styles.closeButton} title="Cerrar modal" type="button">
            <MdClose />
          </button>
        </div>

        {/* Tarjeta con información de la evaluación de origen */}
        <div className={styles.sourceCard}>
          <div className={styles.sourceMainInfo}>
            <span className={styles.sourceBadge}>Evaluación de Origen</span>
            <h4 className={styles.sourceTitle}>{evaluacion.nombre?.toUpperCase()}</h4>
          </div>
          <p className={styles.sourceSubtitle}>
            {gradoNombre || `Grado ${evaluacion.grado}`} {nivelNombre ? `• ${nivelNombre}` : ''} • Fecha original: {originalMonthName} {originalYear}
          </p>
        </div>

        <form onSubmit={handleSubmit} className={styles.form}>
          <div className={styles.inputsRow}>
            {/* 1. PRIMERO: Selección de Fecha y Año */}
            <div className={styles.inputGroup}>
              <LocalizationProvider dateAdapter={AdapterDayjs} adapterLocale="es">
                <label className={styles.label}>
                  1. Nueva Fecha y Año
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
                      placeholder: 'Elige día, mes y año...',
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

            {/* 2. SEGUNDO: Nombre de la Evaluación (se habilita al elegir fecha) */}
            <div className={styles.inputGroup}>
              <label className={styles.label}>
                2. Nombre de la Nueva Evaluación
                {!selectedDate && (
                  <span className={styles.lockedBadge}> (Bloqueado hasta elegir fecha)</span>
                )}
              </label>
              <input
                type="text"
                className={styles.input}
                value={nuevoNombre}
                onChange={(e) => setNuevoNombre(e.target.value)}
                placeholder={
                  !selectedDate
                    ? 'Elige primero la fecha para generar el nombre...'
                    : 'Ej: 1ero matematica 15.10.2026'
                }
                required
                disabled={!selectedDate || isDuplicating}
              />
              {selectedDate ? (
                <span className={styles.hintActive}>
                  ✓ Nombre generado con la fecha. Puedes editarlo libremente si deseas.
                </span>
              ) : (
                <span className={styles.hintText}>
                  Se activará automáticamente al seleccionar la fecha a la izquierda.
                </span>
              )}
            </div>
          </div>

          <div className={styles.checkboxContainer}>
            <label className={styles.checkboxRow}>
              <input
                type="checkbox"
                className={styles.checkboxInput}
                checked={copiarNiveles}
                onChange={(e) => setCopiarNiveles(e.target.checked)}
                disabled={isDuplicating}
              />
              <div className={styles.checkboxContent}>
                <span className={styles.checkboxTitle}>Copiar niveles y rangos de puntaje</span>
                <span className={styles.checkboxDesc}>
                  Mantiene la escala configurada (Satisfactorio, Proceso, Inicio) para no tener que volver a configurarla.
                </span>
              </div>
            </label>

            <label className={styles.checkboxRow}>
              <input
                type="checkbox"
                className={styles.checkboxInput}
                checked={redirigir}
                onChange={(e) => setRedirigir(e.target.checked)}
                disabled={isDuplicating}
              />
              <div className={styles.checkboxContent}>
                <span className={styles.checkboxTitle}>Abrir para editar preguntas de inmediato</span>
                <span className={styles.checkboxDesc}>
                  Te llevará automáticamente a la pantalla de la evaluación para modificar las preguntas y alternativas.
                </span>
              </div>
            </label>
          </div>

          <div className={styles.noticeAlert}>
            <MdInfoOutline className={styles.noticeIcon} />
            <span>
              La evaluación se creará en estado <strong>inactivo</strong> con todas las preguntas y respuestas clonadas. Podrás modificar o reemplazar las que necesites sin alterar la evaluación original ni afectar datos previos.
            </span>
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
              disabled={isDuplicating || !selectedDate || nuevoNombre.trim().length < 3}
            >
              {isDuplicating ? (
                <>
                  <RiLoader4Line className={styles.loaderIcon} />
                  <span>Duplicando preguntas...</span>
                </>
              ) : (
                <>
                  <MdContentCopy />
                  <span>Duplicar Evaluación</span>
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

export default DuplicateEvaluacionModal
