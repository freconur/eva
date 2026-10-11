import React, { useRef, useEffect } from 'react'
import { MdViewColumn, MdTableChart, MdAccountTree } from 'react-icons/md'
import { IoSearch, IoClose } from 'react-icons/io5'
import { getNivelGrado } from '@/features/hooks/useEvaluacionesFilters'
import SegmentedFilterBar, { FilterItem } from '@/components/common/SegmentedFilterBar'
import styles from '../../pages/admin/evaluaciones/evaluaciones.module.css'

interface EvaluacionesToolbarProps {
  // Year filter
  selectedYear: string
  setSelectedYear: (year: string) => void
  showYearMenu?: boolean
  setShowYearMenu?: (val: boolean | ((prev: boolean) => boolean)) => void
  years: string[]

  // Grado filter
  selectedGrado: string
  setSelectedGrado: (grado: string) => void
  showGradoMenu?: boolean
  setShowGradoMenu?: (val: boolean | ((prev: boolean) => boolean)) => void
  gradosFiltrados: any[]

  // Month filter
  selectedMonth: string
  setSelectedMonth: (month: string) => void
  showMonthMenu?: boolean
  setShowMonthMenu?: (val: boolean | ((prev: boolean) => boolean)) => void
  availableMonths: { id: string; name: string; count?: number }[]

  // Categoría filter
  selectedCategoria: string
  setSelectedCategoria: (categoria: string) => void
  showCategoriaMenu?: boolean
  setShowCategoriaMenu?: (val: boolean | ((prev: boolean) => boolean)) => void
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

  const filters: FilterItem<any>[] = [
    {
      id: 'year',
      label: 'Año',
      value: selectedYear,
      onChange: (year) => {
        const yStr = String(year);
        setSelectedYear(yStr);
        updateQueryParams(yStr, selectedGrado, selectedMonth, selectedCategoria, searchQuery);
      },
      options: years.map((year) => ({
        value: year,
        label: String(year),
      })),
      minWidth: 'md:min-w-[110px]',
    },
    {
      id: 'month',
      label: 'Mes',
      value: selectedMonth === '' ? 'all' : selectedMonth,
      onChange: (month) => {
        const mStr = month === 'all' ? '' : String(month);
        setSelectedMonth(mStr);
        updateQueryParams(selectedYear, selectedGrado, mStr, selectedCategoria, searchQuery);
      },
      options: [
        { value: 'all', label: 'Todos los Meses' },
        ...availableMonths.map((m) => ({
          value: m.id,
          label: m.name,
          badge: m.count !== undefined && m.count > 0 ? String(m.count) : undefined,
          badgeType: 'neutral' as const,
        })),
      ],
      minWidth: 'md:min-w-[150px]',
    },
    ...(viewMode !== 'sidebar'
      ? [
          {
            id: 'grade',
            label: 'Grado',
            value: selectedGrado,
            onChange: (grado: string) => {
              const gStr = String(grado);
              setSelectedGrado(gStr);
              updateQueryParams(selectedYear, gStr, selectedMonth, selectedCategoria, searchQuery);
            },
            options: [
              { value: 'all', label: 'Todos los Grados' },
              ...gradosFiltrados.map((grado) => ({
                value: grado.grado?.toString() || '',
                label: `${grado.nombre} - Nivel ${getNivelGrado(grado.grado || 0)}`,
              })),
            ],
            minWidth: 'md:min-w-[180px]',
            showSearch: true,
          },
        ]
      : []),
    {
      id: 'categoria',
      label: 'Categoría',
      value: selectedCategoria,
      onChange: (cat: string) => {
        const cStr = String(cat);
        setSelectedCategoria(cStr);
        updateQueryParams(selectedYear, selectedGrado, selectedMonth, cStr, searchQuery);
      },
      options: [
        { value: 'all', label: 'Todas las Categorías' },
        ...availableCategories.map((cat) => ({
          value: cat.id,
          label: cat.name,
          badge: cat.count !== undefined && cat.count > 0 ? String(cat.count) : undefined,
          badgeType: 'neutral' as const,
        })),
      ],
      minWidth: 'md:min-w-[160px]',
    },
  ];

  const hasActiveFilters = Boolean(
    selectedMonth !== '' ||
    selectedGrado !== 'all' ||
    selectedCategoria !== 'all' ||
    searchQuery.trim() !== ''
  );

  const handleResetFilters = () => {
    setSelectedMonth('');
    setSelectedGrado('all');
    setSelectedCategoria('all');
    setSearchQuery('');
    updateQueryParams(selectedYear, 'all', '', 'all', '');
  };

  return (
    <div className={styles.toolbar}>
      {/* Barra de Filtros Segmentada Modular (Patrón oficial de Directores y Especialistas) */}
      <SegmentedFilterBar
        title="Filtrar por"
        className="w-full xl:w-auto xl:flex-1 min-w-0"
        filters={filters}
        onReset={handleResetFilters}
        showReset={hasActiveFilters}
        resetLabel="Limpiar Filtros"
      />

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
