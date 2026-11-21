import React, { useState, useRef, useEffect, useCallback } from 'react'
import { createPortal } from 'react-dom'
import Link from 'next/link'
import {
  MdDeleteForever,
  MdEditSquare,
  MdVisibility,
  MdVisibilityOff,
  MdDragIndicator,
  MdAnalytics,
  MdContentCopy,
  MdLock,
  MdCheck,
} from 'react-icons/md'
import { RiLoader4Line, RiMapPin2Line } from 'react-icons/ri'
import { useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { LocalizationProvider } from "@mui/x-date-pickers/LocalizationProvider"
import { AdapterDayjs } from "@mui/x-date-pickers/AdapterDayjs"
import { DesktopDatePicker } from "@mui/x-date-pickers"
import dayjs from "dayjs"
import "dayjs/locale/es"
import { getMonthName } from '@/fuctions/dates'
import { regionTexto, getUgelsTexto } from '@/fuctions/regiones'
import styles from '../../pages/admin/evaluaciones/evaluaciones.module.css'
import ConsolidationAction from './ConsolidationAction'
import { HighlightMatch } from './HighlightMatch'

export interface SortableRowProps {
  eva: any
  puedeAcceder: boolean
  gradoObj: any
  nivelGrado: string
  currentYear: string
  editingMonth: boolean
  editingMonthId: string
  dataEvaluacion: any
  setDataEvaluacion: (val: any) => void
  updatingMonth: boolean
  handleSaveMonth: (newMonth: string, newYear: string) => Promise<void>
  handleCancelEditMonth: () => void
  handleEditMonth: (eva: any) => void
  handleCopyId: (id: string) => void
  toggleActiveStatus: (eva: any) => Promise<void>
  onChangeEstado?: (eva: any, nuevoEstado: 'activa' | 'cerrada' | 'inactiva') => Promise<void>
  handleShowInputUpdate: () => void
  setNameEva: (name: string) => void
  setIdEva: (id: string) => void
  handleShowModalDelete: () => void
  currentUserData: any
  visibleColumns: Record<string, boolean>
  selectedGrado: string
  handleOpenPuntuacionModal: (eva: any) => void
  handleOpenDuplicateModal?: (eva: any) => void
  isEnMatriz?: boolean
  isSelected?: boolean
  onToggleSelect?: (id: string) => void
  searchQuery?: string
}

const SortableRow = ({
  eva,
  puedeAcceder,
  gradoObj,
  nivelGrado,
  currentYear,
  editingMonth,
  editingMonthId,
  dataEvaluacion,
  setDataEvaluacion,
  updatingMonth,
  handleSaveMonth,
  handleCancelEditMonth,
  handleEditMonth,
  handleCopyId,
  toggleActiveStatus,
  onChangeEstado,
  handleShowInputUpdate,
  setNameEva,
  setIdEva,
  handleShowModalDelete,
  currentUserData,
  visibleColumns,
  selectedGrado,
  handleOpenPuntuacionModal,
  handleOpenDuplicateModal,
  isEnMatriz,
  isSelected,
  onToggleSelect,
  searchQuery,
}: SortableRowProps) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: eva.id })

  const [showEstadoMenu, setShowEstadoMenu] = useState(false)
  const [dropdownPos, setDropdownPos] = useState<{
    top: number
    left: number
    placement: 'top' | 'bottom'
  } | null>(null)
  const [mounted, setMounted] = useState(false)

  const estadoMenuRef = useRef<HTMLDivElement>(null)
  const dropdownRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    setMounted(true)
  }, [])

  const calculateDropdownPosition = useCallback(() => {
    if (!estadoMenuRef.current) return
    const rect = estadoMenuRef.current.getBoundingClientRect()
    const menuEl = dropdownRef.current
    const menuHeight = menuEl ? menuEl.offsetHeight : 230
    const menuWidth = menuEl ? menuEl.offsetWidth : 275

    const spaceBelow = window.innerHeight - rect.bottom
    const spaceAbove = rect.top

    // Si no hay suficiente espacio abajo (menos de menuHeight + 12px) y arriba hay más espacio, abrir hacia arriba (dropup)
    const openUpward = spaceBelow < menuHeight + 12 && spaceAbove > spaceBelow

    // Alinear horizontalmente a la izquierda del botón de estado
    let left = rect.left
    if (left + menuWidth > window.innerWidth - 12) {
      left = Math.max(12, rect.right - menuWidth)
    }
    if (left + menuWidth > window.innerWidth - 12) {
      left = Math.max(12, window.innerWidth - menuWidth - 12)
    }

    const top = openUpward
      ? Math.max(10, rect.top - menuHeight - 6)
      : Math.min(window.innerHeight - menuHeight - 10, rect.bottom + 6)

    setDropdownPos({
      top,
      left,
      placement: openUpward ? 'top' : 'bottom',
    })
  }, [])

  const toggleEstadoMenu = () => {
    setShowEstadoMenu((prev) => {
      const next = !prev
      if (next) {
        calculateDropdownPosition()
      }
      return next
    })
  }

  // Refinar la posición una vez que el dropdown se monta en el DOM para medir su altura exacta
  useEffect(() => {
    if (showEstadoMenu && dropdownRef.current) {
      calculateDropdownPosition()
    }
  }, [showEstadoMenu, calculateDropdownPosition])

  // Cerrar el menú si la fila comienza a arrastrarse
  useEffect(() => {
    if (isDragging) {
      setShowEstadoMenu(false)
    }
  }, [isDragging])

  // Cierre por click exterior, scroll, resize o Escape
  useEffect(() => {
    if (!showEstadoMenu) return

    calculateDropdownPosition()

    const handleOutsideClick = (e: MouseEvent) => {
      const target = e.target as Node
      if (
        estadoMenuRef.current &&
        !estadoMenuRef.current.contains(target) &&
        dropdownRef.current &&
        !dropdownRef.current.contains(target)
      ) {
        setShowEstadoMenu(false)
      }
    }

    const handleScrollOrResize = (e: Event) => {
      if (dropdownRef.current && dropdownRef.current.contains(e.target as Node)) {
        return
      }
      setShowEstadoMenu(false)
    }

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setShowEstadoMenu(false)
      }
    }

    document.addEventListener('mousedown', handleOutsideClick)
    window.addEventListener('scroll', handleScrollOrResize, true)
    window.addEventListener('resize', handleScrollOrResize)
    window.addEventListener('keydown', handleKeyDown)

    return () => {
      document.removeEventListener('mousedown', handleOutsideClick)
      window.removeEventListener('scroll', handleScrollOrResize, true)
      window.removeEventListener('resize', handleScrollOrResize)
      window.removeEventListener('keydown', handleKeyDown)
    }
  }, [showEstadoMenu, calculateDropdownPosition])

  const handleSelectEstado = async (nuevoEstado: 'activa' | 'cerrada' | 'inactiva') => {
    setShowEstadoMenu(false)
    if (onChangeEstado) {
      await onChangeEstado(eva, nuevoEstado)
    } else {
      await toggleActiveStatus(eva)
    }
  }

  const style: React.CSSProperties = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : puedeAcceder ? 1 : 0.6,
    background: isDragging ? '#f8fafc' : puedeAcceder ? 'inherit' : '#f8fafc',
    zIndex: isDragging ? 1000 : 'auto',
    position: isDragging ? 'relative' : 'initial',
    boxShadow: isDragging ? '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)' : 'none',
  }

  const isSearchActive = Boolean(searchQuery && searchQuery.trim())
  const isActiva = Boolean(eva.active && !eva.cerrada)
  const isCerrada = Boolean(eva.active && eva.cerrada)
  const isInactiva = Boolean(!eva.active)

  return (
    <tr
      ref={setNodeRef}
      style={style}
      className={styles.tableRow}
    >
      {currentUserData?.perfil?.rol === 4 && (
        <td className={styles.tableCell} style={{ textAlign: 'center', width: '38px', padding: '0 0.25rem' }}>
          <input
            type="checkbox"
            checked={Boolean(isSelected)}
            onChange={() => onToggleSelect && onToggleSelect(eva.id)}
            style={{ cursor: 'pointer', width: '16px', height: '16px', accentColor: '#6366f1' }}
            title={isSelected ? "Deseleccionar" : "Seleccionar para duplicar"}
            data-tour="tour-checkbox-select"
          />
        </td>
      )}
      {selectedGrado !== 'all' && (
        <td className={styles.tableCell} style={{ width: '40px', paddingRight: 0 }}>
          {!isSearchActive && (
            <div
              {...attributes}
              {...listeners}
              className={styles.dragHandle}
              title="Arrastrar para reordenar"
            >
              <MdDragIndicator style={{ fontSize: '1.25rem' }} />
            </div>
          )}
        </td>
      )}
      {visibleColumns.id && (
        <td 
          className={`${styles.tableCell} ${styles.tableCellId}`}
          onClick={() => handleCopyId(eva.id || '')}
          style={{ cursor: 'pointer' }}
          title="Click para copiar ID"
        >
          <span style={{ fontSize: '0.75rem', color: '#64748b', fontFamily: 'monospace' }}>
            {eva.id}
          </span>
        </td>
      )}
      {visibleColumns.niveles && (
        <td className={styles.tableCell}>
          <div
            className={`${styles.nivelesContainer} ${puedeAcceder ? styles.nivelesContainerClickable : ''}`}
            onClick={puedeAcceder ? () => handleOpenPuntuacionModal(eva) : undefined}
            title={puedeAcceder ? "Ver o configurar niveles y puntuaciones" : undefined}
          >
            {eva.nivelYPuntaje === undefined ? (
              <span style={{ color: '#ef4444', fontSize: '0.85rem', fontWeight: 500 }}>Undefined</span>
            ) : Array.isArray(eva.nivelYPuntaje) && eva.nivelYPuntaje.length === 0 ? (
              <span style={{ color: '#f59e0b', fontSize: '0.85rem', fontWeight: 500 }}>Vacío</span>
            ) : (
              <span style={{ color: '#10b981', fontSize: '0.85rem', fontWeight: 500 }}>Con data ({eva.nivelYPuntaje.length})</span>
            )}
          </div>
        </td>
      )}
      {visibleColumns.nombre && (
        <td className={styles.tableCell}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem', flexWrap: 'wrap' }}>
            {puedeAcceder ? (
              <Link href={`/admin/evaluaciones/evaluacion/${eva.id}`}>
                <HighlightMatch text={eva.nombre || ''} query={searchQuery} />
              </Link>
            ) : (
              <span>
                <HighlightMatch text={eva.nombre || ''} query={searchQuery} />
              </span>
            )}
            {eva.ugels && Array.isArray(eva.ugels) && eva.ugels.length > 0 && (
              <span
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '3px',
                  padding: '2px 7px',
                  borderRadius: '6px',
                  fontSize: '0.675rem',
                  fontWeight: 600,
                  backgroundColor: '#f1f5f9',
                  color: '#475569',
                  border: '1px solid #cbd5e1',
                  whiteSpace: 'nowrap',
                }}
                title={`Exclusiva para: ${getUgelsTexto(eva.ugels)}`}
              >
                <RiMapPin2Line style={{ width: '11px', height: '11px', color: '#64748b' }} />
                <span>{eva.ugels.length === 1 ? regionTexto(eva.ugels[0]) : `${eva.ugels.length} UGELs`}</span>
              </span>
            )}
          </div>
        </td>
      )}
      {visibleColumns.grado && (
        <td className={styles.tableCell}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.2rem' }}>
            <span style={{ fontWeight: 600 }}>{gradoObj?.nombre || `Grado ${eva.grado}`}</span>
            <span style={{ fontSize: '0.75rem', color: '#64748b' }}>{nivelGrado}</span>
          </div>
        </td>
      )}
      {visibleColumns.fecha && (
        <td className={styles.tableCell} style={{ position: 'relative' }}>
          {(!puedeAcceder) ? (
            <div className={styles.monthContainer}>
              <span className={styles.monthText}>
                {getMonthName(Number(eva.mesDelExamen))} {eva.añoDelExamen || currentYear}
              </span>
            </div>
          ) : (
            <div style={{ display: 'inline-block', position: 'relative' }}>
              <div
                className={styles.monthContainer}
                style={{
                  opacity: editingMonth && editingMonthId === eva.id ? 0 : 1,
                  pointerEvents: editingMonth && editingMonthId === eva.id ? 'none' : 'auto',
                  cursor: currentUserData?.perfil?.rol === 4 ? 'pointer' : 'default'
                }}
                onClick={currentUserData?.perfil?.rol === 4 ? () => handleEditMonth(eva) : undefined}
                title={currentUserData?.perfil?.rol === 4 ? "Click para editar mes y año de la evaluación" : undefined}
              >
                <span className={styles.monthText}>
                  {getMonthName(Number(eva.mesDelExamen))} {eva.añoDelExamen || currentYear}
                </span>
              </div>
              {editingMonth && editingMonthId === eva.id && (
                <div className={styles.monthEditContainer}>
                  <LocalizationProvider dateAdapter={AdapterDayjs} adapterLocale="es">
                    <DesktopDatePicker
                      views={['year', 'month']}
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
              )}
            </div>
          )}
        </td>
      )}
      {visibleColumns.estado && (
        <td style={{ position: 'relative' }}>
          {!puedeAcceder ? (
            <span className={styles.inactiveIcon} style={{ fontSize: '0.8rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>🔒 Sin acceso</span>
          ) : (
            <div ref={estadoMenuRef} style={{ display: 'inline-block', position: 'relative' }}>
              {isActiva ? (
                <button
                  type="button"
                  onClick={toggleEstadoMenu}
                  className={`${styles.actionIcon} ${styles.activeIcon}`}
                  title="Evaluación Activa (Abierta para calificar) - Clic para cambiar estado"
                  aria-label="Estado activa. Clic para cambiar estado."
                >
                  <MdVisibility />
                </button>
              ) : isCerrada ? (
                <button
                  type="button"
                  onClick={toggleEstadoMenu}
                  className={`${styles.actionIcon} ${styles.cerradaIcon}`}
                  title="Evaluación Cerrada (Solo lectura, visible para docentes) - Clic para cambiar estado"
                  aria-label="Estado cerrada solo lectura. Clic para cambiar estado."
                >
                  <MdLock />
                </button>
              ) : (
                <button
                  type="button"
                  onClick={toggleEstadoMenu}
                  className={`${styles.actionIcon} ${styles.inactiveIcon}`}
                  title="Evaluación Inactiva (Oculta para docentes) - Clic para cambiar estado"
                  aria-label="Estado inactiva. Clic para cambiar estado."
                >
                  <MdVisibilityOff />
                </button>
              )}

              {mounted && showEstadoMenu && dropdownPos && typeof document !== 'undefined' && createPortal(
                <div
                  ref={dropdownRef}
                  className={`${styles.estadoDropdownMenu} ${dropdownPos.placement === 'top' ? styles.estadoDropdownDropup : ''}`}
                  style={{
                    position: 'fixed',
                    top: `${dropdownPos.top}px`,
                    left: `${dropdownPos.left}px`,
                    zIndex: 9999,
                  }}
                >
                  <div className={styles.estadoDropdownHeader}>
                    <span>Estado para Docentes</span>
                  </div>

                  <button
                    type="button"
                    className={`${styles.estadoDropdownOption} ${isActiva ? styles.estadoOptionActive : ''}`}
                    onClick={() => handleSelectEstado('activa')}
                  >
                    <div className={styles.estadoOptionIconBox} style={{ color: '#10b981', background: 'rgba(16, 185, 129, 0.1)' }}>
                      <MdVisibility />
                    </div>
                    <div className={styles.estadoOptionTextBox}>
                      <span className={styles.estadoOptionTitle}>Activa (Abierta)</span>
                      <span className={styles.estadoOptionDesc}>Visible y permite calificar estudiantes</span>
                    </div>
                    {isActiva && <MdCheck className={styles.estadoCheckIcon} />}
                  </button>

                  <button
                    type="button"
                    className={`${styles.estadoDropdownOption} ${isCerrada ? styles.estadoOptionCerrada : ''}`}
                    onClick={() => handleSelectEstado('cerrada')}
                  >
                    <div className={styles.estadoOptionIconBox} style={{ color: '#d97706', background: 'rgba(217, 119, 6, 0.1)' }}>
                      <MdLock />
                    </div>
                    <div className={styles.estadoOptionTextBox}>
                      <span className={styles.estadoOptionTitle}>Cerrada (Solo lectura)</span>
                      <span className={styles.estadoOptionDesc}>Visible pero bloqueada para ingresar datos</span>
                    </div>
                    {isCerrada && <MdCheck className={styles.estadoCheckIcon} />}
                  </button>

                  <button
                    type="button"
                    className={`${styles.estadoDropdownOption} ${isInactiva ? styles.estadoOptionInactiva : ''}`}
                    onClick={() => handleSelectEstado('inactiva')}
                  >
                    <div className={styles.estadoOptionIconBox} style={{ color: '#6b7280', background: 'rgba(107, 114, 128, 0.1)' }}>
                      <MdVisibilityOff />
                    </div>
                    <div className={styles.estadoOptionTextBox}>
                      <span className={styles.estadoOptionTitle}>Inactiva (Oculta)</span>
                      <span className={styles.estadoOptionDesc}>Oculta completamente para los docentes</span>
                    </div>
                    {isInactiva && <MdCheck className={styles.estadoCheckIcon} />}
                  </button>
                </div>,
                document.body
              )}
            </div>
          )}
        </td>
      )}
      {visibleColumns.reporte && (
        <td className={styles.tableCell}>
          {(puedeAcceder || currentUserData?.perfil?.rol === 5) ? (
            <Link
              href={`/admin/evaluaciones/evaluacion/reporte?id=${currentUserData?.dni}&idEvaluacion=${eva.id}`}
              className={styles.reportLink}
            >
              <MdAnalytics style={{ fontSize: '1rem' }} />
              <span>Ver</span>
            </Link>
          ) : (
            <span className={styles.inactiveIcon}>-</span>
          )}
        </td>
      )}
      {visibleColumns.acciones && (
        <td>
          {puedeAcceder && currentUserData?.perfil?.rol === 4 ? (
            <div className={styles.actionsContainer}>
              {!eva.realtimeEnabled && <ConsolidationAction eva={eva} />}
              <MdContentCopy
                onClick={() => handleOpenDuplicateModal && handleOpenDuplicateModal(eva)}
                className={`${styles.actionIcon} ${styles.copyIcon}`}
                title="Duplicar evaluación (copiar preguntas y respuestas)"
                data-tour="tour-btn-duplicate-single"
              />
              <MdEditSquare
                onClick={() => {
                  setNameEva(`${eva.nombre}`)
                  handleShowInputUpdate()
                  setIdEva(`${eva.id}`)
                }}
                className={`${styles.actionIcon} ${styles.editIcon}`}
                title="Editar evaluación"
              />
              <MdDeleteForever
                onClick={() => {
                  handleShowModalDelete()
                  setIdEva(`${eva.id}`)
                }}
                className={`${styles.actionIcon} ${styles.deleteIcon}`}
                title="Eliminar evaluación"
              />
            </div>
          ) : null}
        </td>
      )}
    </tr>
  )
}

export default SortableRow
