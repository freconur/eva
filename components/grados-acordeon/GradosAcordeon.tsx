import React, { useState } from 'react'
import { Grades, Evaluaciones } from '@/features/types/types'
import { MdExpandMore, MdExpandLess, MdDeleteForever, MdEditSquare, MdVisibility, MdVisibilityOff, MdCalendarToday } from 'react-icons/md'
import { RiLoader4Line } from 'react-icons/ri'
import { getMonthName } from '@/fuctions/dates'
import { getAllMonths } from '@/fuctions/dates'
import Link from 'next/link'
import styles from './grados-acordeon.module.css'

interface GradosAcordeonProps {
  grados: Grades[]
  evaluaciones: Evaluaciones[]
  onToggleActive?: (evaluacion: Evaluaciones) => void
  onEditMonth?: (evaluacion: Evaluaciones) => void
  onCancelEditMonth?: () => void
  onSaveMonth?: (newMonth: string) => void
  onEdit?: (evaluacion: Evaluaciones) => void
  onDelete?: (evaluacion: Evaluaciones) => void
  editingMonth?: boolean
  editingMonthId?: string
  updatingMonth?: boolean
  dataEvaluacion?: Evaluaciones
  setDataEvaluacion?: (evaluacion: Evaluaciones) => void
  baseRoute?: string
}

const GradosAcordeon: React.FC<GradosAcordeonProps> = ({ 
  grados, 
  evaluaciones, 
  onToggleActive,
  onEditMonth,
  onCancelEditMonth,
  onSaveMonth,
  onEdit,
  onDelete,
  editingMonth,
  editingMonthId,
  updatingMonth,
  dataEvaluacion,
  setDataEvaluacion,
  baseRoute = '/admin/evaluaciones/evaluacion'
}) => {
  const [expandedGrado, setExpandedGrado] = useState<string | null>(null)
  const [columnas, setColumnas] = useState<number>(4)

  const toggleGrado = (gradoId: string) => {
    setExpandedGrado(expandedGrado === gradoId ? null : gradoId)
  }

  const getNivelGrado = (grado: number) => {
    if (grado >= 1 && grado <= 6) return 'Primaria'
    if (grado >= 7 && grado <= 11) return 'Secundaria'
    return 'Otro'
  }

  const getColorNivel = (grado: number) => {
    if (grado >= 1 && grado <= 6) return styles.nivelPrimaria
    if (grado >= 7 && grado <= 11) return styles.nivelSecundaria
    return styles.nivelOtro
  }

  // Filtrar evaluaciones por grado
  const getEvaluacionesPorGrado = (grado: number) => {
    const evaluacionesFiltradas = evaluaciones.filter(evaluacion => evaluacion.grado === grado)
    
    // Debug para 4to grado
    if (grado === 4) {
      console.log('Evaluaciones de 4to grado:', evaluacionesFiltradas)
      console.log('Todas las evaluaciones:', evaluaciones)
    }
    
    return evaluacionesFiltradas
  }

  return (
    <div className={styles.acordeonContainer}>
      <div className={styles.acordeonHeader}>
        <h2 className={styles.acordeonTitle}>Grados Disponibles</h2>
        <div className={styles.columnSelector}>
          <span className={styles.columnLabel}>Columnas:</span>
          <div className={styles.columnButtons}>
            <button 
              className={`${styles.columnButton} ${columnas === 2 ? styles.active : ''}`}
              onClick={() => setColumnas(2)}
              title="2 columnas"
            >
              2
            </button>
            <button 
              className={`${styles.columnButton} ${columnas === 3 ? styles.active : ''}`}
              onClick={() => setColumnas(3)}
              title="3 columnas"
            >
              3
            </button>
            <button 
              className={`${styles.columnButton} ${columnas === 4 ? styles.active : ''}`}
              onClick={() => setColumnas(4)}
              title="4 columnas"
            >
              4
            </button>
          </div>
        </div>
      </div>
      <div className={styles.acordeonContent}>
        {grados.map((grado) => (
          <div key={grado.id} className={styles.acordeonItem}>
            <div 
              className={`${styles.acordeonItemHeader} ${getColorNivel(grado.grado || 0)}`}
              onClick={() => toggleGrado(grado.id || '')}
            >
              <div className={styles.headerContent}>
                <span className={styles.gradoNumber}>{grado.grado}°</span>
                <span className={styles.gradoName}>{grado.nombre}</span>
                <span className={styles.nivelTag}>{getNivelGrado(grado.grado || 0)}</span>
              </div>
              <div className={styles.expandIcon}>
                {expandedGrado === grado.id ? (
                  <MdExpandLess className={styles.icon} />
                ) : (
                  <MdExpandMore className={styles.icon} />
                )}
              </div>
            </div>
            
            <div className={`${styles.acordeonBody} ${expandedGrado === grado.id ? styles.expanded : ''}`}>
              <div className={styles.acordeonBodyContent}>
                {(() => {
                  const evaluacionesDelGrado = getEvaluacionesPorGrado(grado.grado || 0)
                  return (
                    <>

                      {evaluacionesDelGrado.length > 0 ? (
                        <div className={styles.evaluacionesContainer}>
                          <h3 className={styles.evaluacionesTitle}>Evaluaciones del Grado</h3>
                          <div className={`${styles.evaluacionesList} ${styles[`columns${columnas}`]}`}>
                            {evaluacionesDelGrado.map((evaluacion, index) => {
                              // Debug para evaluaciones de 4to grado
                              if (grado.grado === 4) {
                                console.log(`Evaluación ${index + 1} de 4to grado:`, {
                                  id: evaluacion.id,
                                  nombre: evaluacion.nombre,
                                  mesDelExamen: evaluacion.mesDelExamen,
                                  active: evaluacion.active,
                                  grado: evaluacion.grado,
                                  evaluacionCompleta: evaluacion
                                })
                                console.log('Tipo de mesDelExamen:', typeof evaluacion.mesDelExamen)
                                console.log('Valor de mesDelExamen:', evaluacion.mesDelExamen)
                                console.log('Resultado de getMonthName:', evaluacion.mesDelExamen ? getMonthName(Number(evaluacion.mesDelExamen)) : 'No especificado')
                              }
                              
                              return (
                                <div key={evaluacion.id} className={styles.evaluacionCardWrapper}>
                                  <Link 
                                    href={`${baseRoute}/${evaluacion.id}`}
                                    className={styles.evaluacionCardLink}
                                  >
                                    <div className={`${styles.evaluacionCard} ${evaluacion.tipoDeEvaluacion === '0' ? styles.tipoEvaluacion0 : styles.tipoEvaluacion1}`}>
                                      <div className={styles.evaluacionInfo}>
                                        <div className={styles.evaluacionHeader}>
                                          <h4 
                                            className={styles.evaluacionNombre}
                                            data-tooltip={evaluacion.nombre || 'Sin nombre'}
                                            title={evaluacion.nombre || 'Sin nombre'}
                                          >
                                            {evaluacion.nombre?.toUpperCase() || 'Sin nombre'}
                                          </h4>
                                        </div>
                                        <div className={styles.evaluacionDetails}>
                                          <span className={styles.evaluacionMes}>
                                            <strong>Mes:</strong> {evaluacion.mesDelExamen ? getMonthName(Number(evaluacion.mesDelExamen)) : 'No especificado'}
                                          </span>
                                          <span className={`${styles.evaluacionEstado} ${evaluacion.active ? styles.activo : styles.inactivo}`}>
                                            {evaluacion.active ? 'Activa' : 'Inactiva'}
                                          </span>
                                        </div>
                                      </div>
                                    </div>
                                  </Link>
                                  
                                  {/* Botones de acción posicionados por delante */}
                                  <div className={styles.evaluacionActions}>
                                  {editingMonth && editingMonthId === evaluacion.id ? (
                                    <div className={styles.monthEditContainer}>
                                      <select
                                        className={styles.monthSelect}
                                        value={dataEvaluacion?.mesDelExamen || "0"}
                                        onChange={(e) => setDataEvaluacion && setDataEvaluacion({...dataEvaluacion, mesDelExamen: e.target.value} as Evaluaciones)}
                                      >
                                        {getAllMonths.map((mes) => (
                                          <option key={mes.id} value={mes.id.toString()}>
                                            {mes.name}
                                          </option>
                                        ))}
                                      </select>
                                      <div className={styles.monthEditActions}>
                                        <button
                                          onClick={() => onSaveMonth && onSaveMonth(dataEvaluacion?.mesDelExamen || "0")}
                                          className={styles.saveMonthButton}
                                          title="Guardar mes"
                                        >
                                          {updatingMonth ? <RiLoader4Line className={styles.loaderIcon} /> : "✓"}
                                        </button>
                                        <button
                                          onClick={onCancelEditMonth}
                                          className={styles.cancelMonthButton}
                                          title="Cancelar"
                                        >
                                          ✕
                                        </button>
                                      </div>
                                    </div>
                                  ) : (
                                    <div className={styles.actionsContainer}>
                                      <button
                                        onClick={() => onEditMonth && onEditMonth(evaluacion)}
                                        className={`${styles.actionButton} ${styles.calendarButton}`}
                                        title="Editar mes del examen"
                                      >
                                        <MdCalendarToday className={styles.actionIcon} />
                                      </button>
                                      {evaluacion.active ? (
                                        <button
                                          onClick={() => onToggleActive && onToggleActive(evaluacion)} 
                                          className={`${styles.actionButton} ${styles.toggleButton}`}
                                          title="Desactivar evaluación"
                                        >
                                          <MdVisibility className={styles.actionIcon} />
                                        </button>
                                      ) : (
                                        <button
                                          onClick={() => onToggleActive && onToggleActive(evaluacion)} 
                                          className={`${styles.actionButton} ${styles.toggleButton}`}
                                          title="Activar evaluación"
                                        >
                                          <MdVisibilityOff className={styles.actionIcon} />
                                        </button>
                                      )}
                                      <button
                                        onClick={() => onEdit && onEdit(evaluacion)} 
                                        className={`${styles.actionButton} ${styles.editButton}`}
                                        title="Editar evaluación"
                                      >
                                        <MdEditSquare className={styles.actionIcon} />
                                      </button>
                                      <button
                                        onClick={() => onDelete && onDelete(evaluacion)} 
                                        className={`${styles.actionButton} ${styles.deleteButton}`}
                                        title="Eliminar evaluación"
                                      >
                                        <MdDeleteForever className={styles.actionIcon} />
                                      </button>
                                    </div>
                                  )}
                                  </div>
                                </div>
                              )
                            })}
                          </div>
                        </div>
                      ) : (
                        <div className={styles.noEvaluaciones}>
                          <p>No hay evaluaciones disponibles para este grado</p>
                        </div>
                      )}
                    </>
                  )
                })()}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

export default GradosAcordeon
