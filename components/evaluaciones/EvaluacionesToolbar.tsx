import React from 'react'
import { MdVisibility } from 'react-icons/md'
import { IoIosArrowDown } from 'react-icons/io'
import { getNivelGrado } from '@/features/hooks/useEvaluacionesFilters'
import styles from '../../pages/admin/evaluaciones/evaluaciones.module.css'

interface EvaluacionesToolbarProps {
  // Year filter
  selectedYear: string
  setSelectedYear: (year: string) => void
  showYearMenu: boolean
  setShowYearMenu: (val: boolean | ((prev: boolean) => boolean)) => void
  years: string[]

  // Grado filter
  selectedGrado: string
  setSelectedGrado: (grado: string) => void
  showGradoMenu: boolean
  setShowGradoMenu: (val: boolean | ((prev: boolean) => boolean)) => void
  gradosFiltrados: any[]

  // Column visibility
  visibleColumns: Record<string, boolean>
  showColMenu: boolean
  setShowColMenu: (val: boolean | ((prev: boolean) => boolean)) => void
  toggleColumn: (colKey: string) => void

  // Actions
  updateQueryParams: (newYear: string, newGrado: string) => void
}

const EvaluacionesToolbar = ({
  selectedYear,
  setSelectedYear,
  showYearMenu,
  setShowYearMenu,
  years,
  selectedGrado,
  setSelectedGrado,
  showGradoMenu,
  setShowGradoMenu,
  gradosFiltrados,
  visibleColumns,
  showColMenu,
  setShowColMenu,
  toggleColumn,
  updateQueryParams,
}: EvaluacionesToolbarProps) => {
  return (
    <div className={styles.toolbar}>
      <div className={styles.filtersContainer} style={{ display: 'flex', gap: '2rem', flexWrap: 'wrap' }}>
        <div className={styles.yearFilterContainer} style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <span className={styles.filterLabel}>Año:</span>
          <div className={styles.customSelectContainer}>
            <button
              type="button"
              onClick={() => setShowYearMenu(prev => !prev)}
              className={`${styles.customSelectButton} ${showYearMenu ? styles.customSelectButtonActive : ''}`}
            >
              <span>{selectedYear}</span>
              <IoIosArrowDown className={`${styles.customSelectChevron} ${showYearMenu ? styles.customSelectChevronRotate : ''}`} />
            </button>
            {showYearMenu && (
              <>
                <div className={styles.customSelectOverlay} onClick={() => setShowYearMenu(false)} />
                <div className={styles.customSelectDropdown}>
                  {years.map(year => (
                    <div
                      key={year}
                      onClick={() => {
                        setSelectedYear(year);
                        updateQueryParams(year, selectedGrado);
                        setShowYearMenu(false);
                      }}
                      className={`${styles.customSelectOption} ${selectedYear === year ? styles.customSelectOptionActive : ''}`}
                    >
                      {year}
                    </div>
                  ))}
                </div>
              </>
            )}
          </div>
        </div>

        <div className={styles.gradoFilterContainer} style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <span className={styles.filterLabel}>Grado:</span>
          <div className={styles.customSelectContainer}>
            <button
              type="button"
              onClick={() => setShowGradoMenu(prev => !prev)}
              className={`${styles.customSelectButton} ${showGradoMenu ? styles.customSelectButtonActive : ''}`}
              style={{ minWidth: '220px' }}
            >
              <span>
                {selectedGrado === 'all' 
                  ? 'Todos los grados permitidos' 
                  : gradosFiltrados.find(g => g.grado?.toString() === selectedGrado)?.nombre || selectedGrado
                }
              </span>
              <IoIosArrowDown className={`${styles.customSelectChevron} ${showGradoMenu ? styles.customSelectChevronRotate : ''}`} />
            </button>
            {showGradoMenu && (
              <>
                <div className={styles.customSelectOverlay} onClick={() => setShowGradoMenu(false)} />
                <div className={styles.customSelectDropdown} style={{ minWidth: '240px' }}>
                  <div
                    onClick={() => {
                      setSelectedGrado('all');
                      updateQueryParams(selectedYear, 'all');
                      setShowGradoMenu(false);
                    }}
                    className={`${styles.customSelectOption} ${selectedGrado === 'all' ? styles.customSelectOptionActive : ''}`}
                  >
                    Todos los grados permitidos
                  </div>
                  {gradosFiltrados.map(grado => (
                    <div
                      key={grado.id}
                      onClick={() => {
                        const val = grado.grado?.toString() || '';
                        setSelectedGrado(val);
                        updateQueryParams(selectedYear, val);
                        setShowGradoMenu(false);
                      }}
                      className={`${styles.customSelectOption} ${selectedGrado === grado.grado?.toString() ? styles.customSelectOptionActive : ''}`}
                    >
                      {grado.nombre} - Nivel {getNivelGrado(grado.grado || 0)}
                    </div>
                  ))}
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Selector de Columnas Visibles */}
      <div className={styles.columnSelectorContainer}>
        <button
          type="button"
          onClick={() => setShowColMenu(prev => !prev)}
          className={styles.columnSelectorButton}
          title="Configurar columnas visibles"
        >
          <MdVisibility className={styles.columnSelectorIcon} />
          <span>Columnas</span>
        </button>

        {showColMenu && (
          <>
            <div className={styles.columnSelectorOverlay} onClick={() => setShowColMenu(false)} />
            <div className={styles.columnSelectorDropdown}>
              <h4 className={styles.columnSelectorTitle}>Columnas Visibles</h4>
              <div className={styles.columnSelectorOptions}>
                <label className={styles.columnSelectorOption}>
                  <input
                    type="checkbox"
                    checked={visibleColumns.id}
                    onChange={() => toggleColumn('id')}
                  />
                  <span>ID</span>
                </label>
                <label className={styles.columnSelectorOption}>
                  <input
                    type="checkbox"
                    checked={visibleColumns.niveles}
                    onChange={() => toggleColumn('niveles')}
                  />
                  <span>Niveles</span>
                </label>
                <label className={styles.columnSelectorOption}>
                  <input
                    type="checkbox"
                    checked={visibleColumns.nombre}
                    onChange={() => toggleColumn('nombre')}
                  />
                  <span>Nombre</span>
                </label>
                <label className={styles.columnSelectorOption}>
                  <input
                    type="checkbox"
                    checked={visibleColumns.grado}
                    onChange={() => toggleColumn('grado')}
                  />
                  <span>Grado / Nivel</span>
                </label>
                <label className={styles.columnSelectorOption}>
                  <input
                    type="checkbox"
                    checked={visibleColumns.fecha}
                    onChange={() => toggleColumn('fecha')}
                  />
                  <span>Mes y Año</span>
                </label>
                <label className={styles.columnSelectorOption}>
                  <input
                    type="checkbox"
                    checked={visibleColumns.estado}
                    onChange={() => toggleColumn('estado')}
                  />
                  <span>Estado</span>
                </label>
                <label className={styles.columnSelectorOption}>
                  <input
                    type="checkbox"
                    checked={visibleColumns.reporte}
                    onChange={() => toggleColumn('reporte')}
                  />
                  <span>Reporte</span>
                </label>
                <label className={styles.columnSelectorOption}>
                  <input
                    type="checkbox"
                    checked={visibleColumns.acciones}
                    onChange={() => toggleColumn('acciones')}
                  />
                  <span>Acciones</span>
                </label>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  )
}

export default EvaluacionesToolbar
