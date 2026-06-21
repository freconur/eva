import React from 'react'
import Link from 'next/link'
import { MdDeleteForever, MdEditSquare, MdVisibility, MdVisibilityOff, MdDragIndicator, MdAnalytics } from 'react-icons/md'
import { RiLoader4Line } from 'react-icons/ri'
import { useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { LocalizationProvider } from "@mui/x-date-pickers/LocalizationProvider"
import { AdapterDayjs } from "@mui/x-date-pickers/AdapterDayjs"
import { DesktopDatePicker } from "@mui/x-date-pickers"
import dayjs from "dayjs"
import "dayjs/locale/es"
import { getMonthName } from '@/fuctions/dates'
import styles from '../../pages/admin/evaluaciones/evaluaciones.module.css'
import ConsolidationAction from './ConsolidationAction'

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
  handleShowInputUpdate: () => void
  setNameEva: (name: string) => void
  setIdEva: (id: string) => void
  handleShowModalDelete: () => void
  currentUserData: any
  visibleColumns: Record<string, boolean>
  selectedGrado: string
  handleOpenPuntuacionModal: (eva: any) => void
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
  handleShowInputUpdate,
  setNameEva,
  setIdEva,
  handleShowModalDelete,
  currentUserData,
  visibleColumns,
  selectedGrado,
  handleOpenPuntuacionModal,
}: SortableRowProps) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: eva.id })

  const style: React.CSSProperties = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : puedeAcceder ? 1 : 0.6,
    background: isDragging ? '#f8fafc' : puedeAcceder ? 'inherit' : '#f8fafc',
    zIndex: isDragging ? 1000 : 'auto',
    position: isDragging ? 'relative' : 'initial',
    boxShadow: isDragging ? '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)' : 'none',
  }

  return (
    <tr
      ref={setNodeRef}
      style={style}
      className={styles.tableRow}
    >
      {selectedGrado !== 'all' && (
        <td className={styles.tableCell} style={{ width: '40px', paddingRight: 0 }}>
          <div
            {...attributes}
            {...listeners}
            className={styles.dragHandle}
            title="Arrastrar para reordenar"
          >
            <MdDragIndicator style={{ fontSize: '1.25rem' }} />
          </div>
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
          {puedeAcceder ? (
            <Link href={`/admin/evaluaciones/evaluacion/${eva.id}`}>
              {eva.nombre?.toUpperCase() || ''}
            </Link>
          ) : (
            <span>{eva.nombre?.toUpperCase() || ''}</span>
          )}
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
              <MdEditSquare
                onClick={() => {
                  setNameEva(`${eva.nombre}`)
                  handleShowInputUpdate()
                  setIdEva(`${eva.id}`)
                }}
                className={`${styles.actionIcon} ${styles.editIcon}`}
              />
              <MdDeleteForever
                onClick={() => {
                  handleShowModalDelete()
                  setIdEva(`${eva.id}`)
                }}
                className={`${styles.actionIcon} ${styles.deleteIcon}`}
              />
            </div>
          ) : null}
        </td>
      )}
    </tr>
  )
}

export default SortableRow
