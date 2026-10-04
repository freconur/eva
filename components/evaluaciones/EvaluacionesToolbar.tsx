import React, { useRef, useEffect } from 'react'
import { MdViewColumn, MdTableChart, MdAccountTree } from 'react-icons/md'
import { IoIosArrowDown } from 'react-icons/io'
import { IoSearch, IoClose } from 'react-icons/io5'
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

  // Month filter
  selectedMonth: string
  setSelectedMonth: (month: string) => void
  showMonthMenu: boolean
  setShowMonthMenu: (val: boolean | ((prev: boolean) => boolean)) => void
  availableMonths: { id: string; name: string; count?: number }[]

  // Categoría filter
  selectedCategoria: string
  setSelectedCategoria: (categoria: string) => void
  showCategoriaMenu: boolean
  setShowCategoriaMenu: (val: boolean | ((prev: boolean) => boolean)) => void
  availableCategories: { id: string; name: string; count?: number }[]

  // Search filter
  searchQuery: string
  setSearchQuery: (query: string) => void
  totalResults?: number

  // Column visibility
  visibleColumns: Record<string, boolean>
  showColMenu: boolean
  setShowColMenu: (val: boolean | ((prev: boolean) => boolean)) => void
  toggleColumn: (colKey: string) => void

  // View mode
  viewMode?: 'table' | 'sidebar'
  setViewMode?: (mode: 'table' | 'sidebar') => void

  // Actions
  updateQueryParams: (
    newYear: string,
    newGrado: string,
    newMonth?: string,
    newCategoria?: string,
    newSearch?: string
  ) => void
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
  selectedMonth,
  setSelectedMonth,
  showMonthMenu,
  setShowMonthMenu,
  availableMonths,
  selectedCategoria,
  setSelectedCategoria,
  showCategoriaMenu,
  setShowCategoriaMenu,
  availableCategories,
  searchQuery,
  setSearchQuery,
  totalResults,
  visibleColumns,
  showColMenu,
  setShowColMenu,
  toggleColumn,
  viewMode = 'table',
  setViewMode,
  updateQueryParams,
}: EvaluacionesToolbarProps) => {
  const searchInputRef = useRef<HTMLInputElement>(null)

  // Atajos de teclado: Ctrl+K o / para enfocar la búsqueda, Escape para limpiar/desenfocar
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const activeEl = document.activeElement
      const isInputFocused =
        activeEl &&
        (activeEl.tagName === 'INPUT' ||
          activeEl.tagName === 'TEXTAREA' ||
          (activeEl as HTMLElement).isContentEditable)

      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault()
        searchInputRef.current?.focus()
        searchInputRef.current?.select()
      } else if (e.key === '/' && !isInputFocused) {
        e.preventDefault()
        searchInputRef.current?.focus()
        searchInputRef.current?.select()
      } else if (e.key === 'Escape' && document.activeElement === searchInputRef.current) {
        if (searchQuery) {
          setSearchQuery('')
          updateQueryParams(selectedYear, selectedGrado, selectedMonth, selectedCategoria, '')
        } else {
          searchInputRef.current?.blur()
        }
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [searchQuery, selectedYear, selectedGrado, selectedMonth, selectedCategoria, updateQueryParams, setSearchQuery])

  return (
    <div className={styles.toolbar}>
      <div className={styles.filtersContainer}>
        {/* Filtro de Año */}
        <div className={styles.customSelectContainer}>
          <button
            type="button"
            onClick={() => setShowYearMenu(prev => !prev)}
            className={`${styles.customSelectButton} ${showYearMenu ? styles.customSelectButtonActive : ''}`}
            title="Filtrar por año"
          >
            <div className={styles.filterPillContent}>
              <span className={styles.filterPillLabel}>Año:</span>
              <span className={styles.filterPillValue}>{selectedYear}</span>
            </div>
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
                      updateQueryParams(year, selectedGrado, selectedMonth, selectedCategoria, searchQuery);
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

        {/* Filtro de Mes */}
        <div className={styles.customSelectContainer}>
          <button
            type="button"
            onClick={() => setShowMonthMenu(prev => !prev)}
            className={`${styles.customSelectButton} ${showMonthMenu ? styles.customSelectButtonActive : ''} ${selectedMonth !== '' ? styles.customSelectButtonFiltering : ''}`}
            title="Filtrar por mes"
          >
            <div className={styles.filterPillContent}>
              <span className={styles.filterPillLabel}>Mes:</span>
              <span className={styles.filterPillValue}>
                {selectedMonth === '' 
                  ? 'Todos'
                  : availableMonths.find(m => m.id === selectedMonth)?.name || 'Todos'
                }
              </span>
            </div>
            <IoIosArrowDown className={`${styles.customSelectChevron} ${showMonthMenu ? styles.customSelectChevronRotate : ''}`} />
          </button>
          {showMonthMenu && (
            <>
              <div className={styles.customSelectOverlay} onClick={() => setShowMonthMenu(false)} />
              <div className={styles.customSelectDropdown}>
                <div
                  onClick={() => {
                    setSelectedMonth('');
                    updateQueryParams(selectedYear, selectedGrado, '', selectedCategoria, searchQuery);
                    setShowMonthMenu(false);
                  }}
                  className={`${styles.customSelectOption} ${selectedMonth === '' ? styles.customSelectOptionActive : ''}`}
                >
                  Todos
                </div>
                {availableMonths.map(month => (
                  <div
                    key={month.id}
                    onClick={() => {
                      setSelectedMonth(month.id);
                      updateQueryParams(selectedYear, selectedGrado, month.id, selectedCategoria, searchQuery);
                      setShowMonthMenu(false);
                    }}
                    className={`${styles.customSelectOption} ${selectedMonth === month.id ? styles.customSelectOptionActive : ''}`}
                    style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}
                  >
                    <span>{month.name}</span>
                    {month.count !== undefined && month.count > 0 && (
                      <span style={{ fontSize: '0.75rem', color: '#64748b', opacity: 0.85, marginLeft: '0.5rem' }}>
                        ({month.count})
                      </span>
                    )}
                  </div>
                ))}
                {availableMonths.length === 0 && (
                  <div className={styles.customSelectOption} style={{ color: '#94a3b8', fontStyle: 'italic', cursor: 'default' }}>
                    Sin evaluaciones en este año
                  </div>
                )}
              </div>
            </>
          )}
        </div>

        {/* Filtro de Grado */}
        {viewMode !== 'sidebar' && (
          <div className={styles.customSelectContainer}>
            <button
              type="button"
              onClick={() => setShowGradoMenu(prev => !prev)}
              className={`${styles.customSelectButton} ${showGradoMenu ? styles.customSelectButtonActive : ''} ${selectedGrado !== 'all' ? styles.customSelectButtonFiltering : ''}`}
              title="Filtrar por grado"
            >
              <div className={styles.filterPillContent} style={{ maxWidth: '160px' }}>
                <span className={styles.filterPillLabel}>Grado:</span>
                <span className={styles.filterPillValue}>
                  {selectedGrado === 'all' 
                    ? 'Todos' 
                    : gradosFiltrados.find(g => g.grado?.toString() === selectedGrado)?.nombre || selectedGrado
                  }
                </span>
              </div>
              <IoIosArrowDown className={`${styles.customSelectChevron} ${showGradoMenu ? styles.customSelectChevronRotate : ''}`} />
            </button>
            {showGradoMenu && (
              <>
                <div className={styles.customSelectOverlay} onClick={() => setShowGradoMenu(false)} />
                <div className={styles.customSelectDropdown} style={{ minWidth: '220px' }}>
                  <div
                    onClick={() => {
                      setSelectedGrado('all');
                      updateQueryParams(selectedYear, 'all', selectedMonth, selectedCategoria, searchQuery);
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
                        updateQueryParams(selectedYear, val, selectedMonth, selectedCategoria, searchQuery);
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
        )}

        {/* Filtro de Categoría */}
        <div className={styles.customSelectContainer}>
          <button
            type="button"
            onClick={() => setShowCategoriaMenu(prev => !prev)}
            className={`${styles.customSelectButton} ${showCategoriaMenu ? styles.customSelectButtonActive : ''} ${selectedCategoria !== 'all' ? styles.customSelectButtonFiltering : ''}`}
            title="Filtrar por categoría"
          >
            <div className={styles.filterPillContent} style={{ maxWidth: '160px' }}>
              <span className={styles.filterPillLabel}>Categoría:</span>
              <span className={styles.filterPillValue} style={{ textTransform: 'capitalize' }}>
                {selectedCategoria === 'all' 
                  ? 'Todas' 
                  : availableCategories.find(c => c.id === selectedCategoria)?.name || selectedCategoria
                }
              </span>
            </div>
            <IoIosArrowDown className={`${styles.customSelectChevron} ${showCategoriaMenu ? styles.customSelectChevronRotate : ''}`} />
          </button>
          {showCategoriaMenu && (
            <>
              <div className={styles.customSelectOverlay} onClick={() => setShowCategoriaMenu(false)} />
              <div className={styles.customSelectDropdown} style={{ minWidth: '200px' }}>
                <div
                  onClick={() => {
                    setSelectedCategoria('all');
                    updateQueryParams(selectedYear, selectedGrado, selectedMonth, 'all', searchQuery);
                    setShowCategoriaMenu(false);
                  }}
                  className={`${styles.customSelectOption} ${selectedCategoria === 'all' ? styles.customSelectOptionActive : ''}`}
                >
                  Todas las categorías
                </div>
                {availableCategories.map(cat => (
                  <div
                    key={cat.id}
                    onClick={() => {
                      setSelectedCategoria(cat.id);
                      updateQueryParams(selectedYear, selectedGrado, selectedMonth, cat.id, searchQuery);
                      setShowCategoriaMenu(false);
                    }}
                    className={`${styles.customSelectOption} ${selectedCategoria === cat.id ? styles.customSelectOptionActive : ''}`}
                    style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}
                  >
                    <span style={{ textTransform: 'capitalize' }}>{cat.name}</span>
                    {cat.count !== undefined && cat.count > 0 && (
                      <span style={{ fontSize: '0.75rem', color: '#64748b', opacity: 0.85, marginLeft: '0.5rem' }}>
                        ({cat.count})
                      </span>
                    )}
                  </div>
                ))}
                {availableCategories.length === 0 && (
                  <div className={styles.customSelectOption} style={{ color: '#94a3b8', fontStyle: 'italic', cursor: 'default' }}>
                    Sin categorías registradas
                  </div>
                )}
              </div>
            </>
          )}
        </div>

        {/* Botón de limpiar filtros activos */}
        {(selectedMonth !== '' || selectedGrado !== 'all' || selectedCategoria !== 'all' || searchQuery.trim() !== '') && (
          <button
            type="button"
            onClick={() => {
              setSelectedMonth('');
              setSelectedGrado('all');
              setSelectedCategoria('all');
              setSearchQuery('');
              updateQueryParams(selectedYear, 'all', '', 'all', '');
            }}
            className={styles.clearAllFiltersBtn}
            title="Restablecer todos los filtros"
            aria-label="Restablecer todos los filtros"
          >
            <IoClose style={{ fontSize: '0.95rem' }} />
            <span>Limpiar</span>
          </button>
        )}
      </div>

      {/* Acciones Derecha: Búsqueda Inteligente y Configuración de Columnas */}
      <div className={styles.toolbarActionsRight}>
        {/* Input Inteligente de Búsqueda */}
        <div className={styles.searchContainer}>
          <IoSearch className={styles.searchIcon} />
          <input
            ref={searchInputRef}
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Buscar evaluación..."
            className={styles.searchInput}
            title="Buscar por nombre o ID (Ctrl+K o /)"
            aria-label="Buscar evaluación por nombre o ID"
          />
          {searchQuery ? (
            <button
              type="button"
              onClick={() => {
                setSearchQuery('')
                updateQueryParams(selectedYear, selectedGrado, selectedMonth, selectedCategoria, '')
                searchInputRef.current?.focus()
              }}
              className={styles.searchClearButton}
              title="Limpiar búsqueda (Escape)"
              aria-label="Limpiar búsqueda"
            >
              <IoClose style={{ fontSize: '1.1rem' }} />
            </button>
          ) : (
            <kbd className={styles.searchKbdHint} title="Presiona Ctrl+K o / para buscar">
              Ctrl K
            </kbd>
          )}
        </div>

        {searchQuery.trim() !== '' && totalResults !== undefined && (
          <span className={styles.searchResultsBadge} title="Resultados encontrados">
            {totalResults} {totalResults === 1 ? 'encontrada' : 'encontradas'}
          </span>
        )}

        {/* Selector de Columnas Visibles */}
        <div className={styles.columnSelectorContainer}>
          <button
            type="button"
            onClick={() => setShowColMenu(prev => !prev)}
            className={`${styles.columnSelectorButton} ${showColMenu ? styles.columnSelectorButtonActive : ''}`}
            title="Configurar columnas visibles"
            aria-label="Configurar columnas visibles"
          >
            <MdViewColumn className={styles.columnSelectorIcon} />
            <span className={styles.columnSelectorText}>Columnas</span>
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

        {/* Toggle Tipo de Vista (Tabla vs Panel) */}
        {setViewMode && (
          <div className={styles.viewModeToggle}>
            <button
              type="button"
              onClick={() => setViewMode('table')}
              className={`${styles.viewModeBtn} ${viewMode === 'table' ? styles.viewModeBtnActive : ''}`}
              title="Vista de Tabla / Matriz tradicional"
            >
              <MdTableChart className={styles.viewModeIcon} />
              <span>Tabla</span>
            </button>
            <button
              type="button"
              onClick={() => setViewMode('sidebar')}
              className={`${styles.viewModeBtn} ${viewMode === 'sidebar' ? styles.viewModeBtnActive : ''}`}
              title="Vista de Panel lateral con árbol de grados"
              data-tour="tour-view-mode-panel"
            >
              <MdAccountTree className={styles.viewModeIcon} />
              <span>Panel</span>
            </button>
          </div>
        )}
      </div>
    </div>
  )
}


export default EvaluacionesToolbar
