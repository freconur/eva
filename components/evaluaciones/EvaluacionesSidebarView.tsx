import React, { useState, useMemo, useEffect } from 'react'
import {
  MdFolderOpen,
  MdChevronRight,
  MdChevronLeft,
  MdSchool,
  MdAdd,
  MdAddCircle,
  MdSearch,
  MdContentCopy,
  MdAccountTree
} from 'react-icons/md'
import { DndContext, closestCenter } from '@dnd-kit/core'
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable'
import SortableRow from './SortableRow'
import { getNivelGrado } from '@/features/hooks/useEvaluacionesFilters'
import styles from './evaluacionesSidebar.module.css'
import tableStyles from '../../pages/admin/evaluaciones/evaluaciones.module.css'

interface EvaluacionesSidebarViewProps {
  evaluaciones: any[]
  orderedEvaluaciones: any[]
  selectedYear: string
  currentYear: string
  selectedGrado: string
  setSelectedGrado: (grado: string) => void
  selectedMonth: string
  selectedCategoria: string
  searchQuery?: string
  setSearchQuery?: (query: string) => void
  updateQueryParams: (year: string, grado: string, month?: string, categoria?: string, search?: string) => void
  grados: any[]
  gradosFiltrados: any[]
  tieneAccesoAEvaluacion: (eva: any) => boolean
  sensors: any
  handleDragEnd: (event: any) => void
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
  handleOpenPuntuacionModal: (eva: any) => void
  handleOpenDuplicateModal: (eva: any) => void
  selectedEvaIds: string[]
  setSelectedEvaIds: React.Dispatch<React.SetStateAction<string[]>>
  handleToggleSelect: (id: string) => void
  handleToggleSelectAll: () => void
  isAllSelected: boolean
  isSomeSelected: boolean
  handleOpenBulkDuplicateModal: () => void
  handleShowCreateModal: () => void
}

const formatGradoLabel = (gradoNum: number, originalName?: string): string => {
  if (gradoNum === 12) return 'Inicial 3, 4 y 5 años'
  if (gradoNum >= 1 && gradoNum <= 6) return `${gradoNum}° Primaria`
  if (gradoNum >= 7 && gradoNum <= 11) return `${gradoNum - 6}° Secundaria`
  return originalName || `Grado ${gradoNum}`
}

const getNivelLabel = (nivelId: number | string): string => {
  const n = Number(nivelId)
  if (n === 0) return 'Inicial'
  if (n === 1) return 'Primaria'
  if (n === 2) return 'Secundaria'
  return 'General'
}

const EvaluacionesSidebarView: React.FC<EvaluacionesSidebarViewProps> = ({
  evaluaciones,
  orderedEvaluaciones,
  selectedYear,
  currentYear,
  selectedGrado,
  setSelectedGrado,
  selectedMonth,
  selectedCategoria,
  searchQuery,
  setSearchQuery,
  updateQueryParams,
  grados,
  gradosFiltrados,
  tieneAccesoAEvaluacion,
  sensors,
  handleDragEnd,
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
  handleOpenPuntuacionModal,
  handleOpenDuplicateModal,
  selectedEvaIds,
  setSelectedEvaIds,
  handleToggleSelect,
  handleToggleSelectAll,
  isAllSelected,
  isSomeSelected,
  handleOpenBulkDuplicateModal,
  handleShowCreateModal,
}) => {
  // Estado local para los acordeones del árbol
  const [treeOpen, setTreeOpen] = useState<Record<string, boolean>>({
    '0': true,
    '1': true,
    '2': true,
  })

  // Estado para colapsar/expandir el panel lateral de grados (maximiza el espacio de la tabla)
  const [isPanelCollapsed, setIsPanelCollapsed] = useState<boolean>(false)

  // Búsqueda local de respaldo si no se pasa searchQuery
  const [filterSearch, setFilterSearch] = useState<string>('')
  const activeSearchQuery = searchQuery !== undefined ? searchQuery : filterSearch

  const handleSearchChange = (val: string) => {
    if (setSearchQuery) {
      setSearchQuery(val)
    } else {
      setFilterSearch(val)
    }
  }

  // Agrupación de grados filtrados por nivel
  const nivelesGroups = useMemo(() => {
    const groups: { nivel: number; nombre: string; grados: any[] }[] = []

    const nivelOrder = [0, 1, 2] // Inicial, Primaria, Secundaria
    nivelOrder.forEach(nivelId => {
      const gList = gradosFiltrados.filter(g => (g.nivel ?? 1) === nivelId)
      if (gList.length > 0) {
        groups.push({
          nivel: nivelId,
          nombre: getNivelLabel(nivelId),
          grados: gList,
        })
      }
    })

    // Otros niveles si existen
    const otherGrados = gradosFiltrados.filter(g => ![0, 1, 2].includes(g.nivel ?? 1))
    if (otherGrados.length > 0) {
      groups.push({
        nivel: 99,
        nombre: 'Otros',
        grados: otherGrados,
      })
    }

    return groups
  }, [gradosFiltrados])

  // Contadores por grado y por nivel en el año seleccionado
  const countsByGrado = useMemo(() => {
    const map = new Map<number, number>()
    evaluaciones.forEach(eva => {
      const yr = eva.añoDelExamen || currentYear
      if (yr !== selectedYear) return
      if (!tieneAccesoAEvaluacion(eva)) return
      const gNum = Number(eva.grado)
      if (!isNaN(gNum)) {
        map.set(gNum, (map.get(gNum) || 0) + 1)
      }
    })
    return map
  }, [evaluaciones, selectedYear, currentYear, tieneAccesoAEvaluacion])

  // Total de evaluaciones accesibles en el año seleccionado
  const totalEvaluacionesAno = useMemo(() => {
    let total = 0
    countsByGrado.forEach(count => {
      total += count
    })
    return total
  }, [countsByGrado])

  // Si selectedGrado es 'all' o no existe en gradosFiltrados, autoseleccionar el primer grado con datos o el primero disponible
  useEffect(() => {
    if (gradosFiltrados.length === 0) return

    const isCurrentValid = gradosFiltrados.some(g => String(g.grado) === String(selectedGrado))
    if (!isCurrentValid || selectedGrado === 'all') {
      // Priorizar grado con evaluaciones
      const gradoConDatos = gradosFiltrados.find(g => (countsByGrado.get(g.grado) || 0) > 0)
      const targetGrado = gradoConDatos || gradosFiltrados[0]
      if (targetGrado) {
        const targetStr = String(targetGrado.grado)
        setSelectedGrado(targetStr)
        updateQueryParams(selectedYear, targetStr, selectedMonth, selectedCategoria, activeSearchQuery)
      }
    }
  }, [gradosFiltrados, selectedGrado, countsByGrado, selectedYear, selectedMonth, selectedCategoria, activeSearchQuery, setSelectedGrado, updateQueryParams])

  const toggleNivel = (nivelKey: string) => {
    setTreeOpen(prev => ({ ...prev, [nivelKey]: !prev[nivelKey] }))
  }

  // Al seleccionar o cambiar de grado, la búsqueda por texto no se limpia
  const handleSelectGrado = (gradoNum: number) => {
    const gStr = String(gradoNum)
    setSelectedGrado(gStr)
    updateQueryParams(selectedYear, gStr, selectedMonth, selectedCategoria, activeSearchQuery)
  }

  // Grado seleccionado actualmente (objeto)
  const currentGradoObj = useMemo(() => {
    return grados.find(g => String(g.grado) === String(selectedGrado)) || null
  }, [grados, selectedGrado])

  const currentGradoNum = currentGradoObj?.grado || Number(selectedGrado) || 1
  const currentGradoNombre = formatGradoLabel(currentGradoNum, currentGradoObj?.name)
  const currentGradoNivelNombre = getNivelGrado(currentGradoNum)

  // Evaluaciones a mostrar (si hay searchQuery global ya vienen filtradas inteligentemente)
  const displayedEvaluaciones = useMemo(() => {
    if (searchQuery !== undefined) {
      return orderedEvaluaciones
    }
    let list = orderedEvaluaciones
    if (filterSearch.trim() !== '') {
      const q = filterSearch.toLowerCase().trim()
      list = list.filter(eva =>
        eva.nombre?.toLowerCase().includes(q) ||
        eva.id?.toLowerCase().includes(q)
      )
    }
    return list
  }, [orderedEvaluaciones, searchQuery, filterSearch])

  return (
    <div className={`${styles.sidebarLayout} ${isPanelCollapsed ? styles.collapsed : ''}`}>
      {/* ── Panel Izquierdo: Árbol de Exploración ── */}
      <aside
        className={`${styles.sidebarPanel} ${isPanelCollapsed ? styles.isCollapsed : ''}`}
        aria-label="Explorador de Grados"
        data-tour="tour-sidebar-panel"
      >
        <div className={styles.sidebarHeader}>
          {!isPanelCollapsed ? (
            <>
              <div className={styles.sidebarHeaderTitleRow}>
                <h2 className={styles.sidebarTitle}>Niveles y Grados</h2>
                <span className={styles.sidebarTotalBadge} title={`Total en ${selectedYear}`}>
                  {totalEvaluacionesAno} eval.
                </span>
              </div>
              <button
                type="button"
                onClick={() => setIsPanelCollapsed(true)}
                className={styles.toggleTreeButton}
                title="Colapsar panel (maximizar tabla)"
                aria-label="Colapsar panel lateral"
              >
                <MdChevronLeft style={{ fontSize: '1.15rem' }} />
              </button>
            </>
          ) : (
            <button
              type="button"
              onClick={() => setIsPanelCollapsed(false)}
              className={styles.toggleTreeButton}
              title="Expandir explorador de grados"
              aria-label="Expandir panel lateral"
            >
              <MdChevronRight style={{ fontSize: '1.15rem' }} />
            </button>
          )}
        </div>

        {!isPanelCollapsed ? (
          <nav>
            {nivelesGroups.map(group => {
              const nivelKey = String(group.nivel)
              const isOpen = treeOpen[nivelKey] ?? true

              // Total de evaluaciones para este nivel
              const nivelTotal = group.grados.reduce((acc, g) => acc + (countsByGrado.get(g.grado) || 0), 0)

              let tagClass = styles.tagPrimaria
              if (group.nivel === 0) tagClass = styles.tagInicial
              if (group.nivel === 2) tagClass = styles.tagSecundaria

              return (
                <div key={nivelKey} className={styles.treeGroup}>
                  <button
                    type="button"
                    onClick={() => toggleNivel(nivelKey)}
                    className={styles.treeNivelButton}
                    aria-expanded={isOpen}
                  >
                    <MdChevronRight
                      className={`${styles.treeNivelIcon} ${isOpen ? styles.treeNivelIconOpen : ''}`}
                    />
                    <span className={`${styles.treeNivelTag} ${tagClass}`} />
                    <span className={styles.treeNivelLabel}>{group.nombre}</span>
                    <span className={styles.treeNivelCount}>{nivelTotal}</span>
                  </button>

                  {isOpen && (
                    <div className={styles.treeGradosList}>
                      {group.grados.map(g => {
                        const count = countsByGrado.get(g.grado) || 0
                        const isSelected = String(g.grado) === String(selectedGrado)
                        const label = formatGradoLabel(g.grado, g.name)

                        return (
                          <button
                            key={g.grado}
                            type="button"
                            onClick={() => handleSelectGrado(g.grado)}
                            className={`${styles.treeGradoItem} ${isSelected ? styles.treeGradoItemActive : ''}`}
                          >
                            <MdSchool className={styles.treeGradoIcon} />
                            <span className={styles.treeGradoName} title={label}>
                              {label}
                            </span>
                            <span className={styles.treeGradoCount}>{count}</span>
                          </button>
                        )
                      })}
                    </div>
                  )}
                </div>
              )
            })}
          </nav>
        ) : (
          <div className={styles.collapsedShortcuts}>
            {nivelesGroups.map(group => {
              let tagClass = styles.tagPrimaria
              if (group.nivel === 0) tagClass = styles.tagInicial
              if (group.nivel === 2) tagClass = styles.tagSecundaria

              return (
                <button
                  key={group.nivel}
                  type="button"
                  onClick={() => {
                    setIsPanelCollapsed(false)
                    setTreeOpen(prev => ({ ...prev, [String(group.nivel)]: true }))
                    const firstGrado = group.grados[0]
                    if (firstGrado) handleSelectGrado(firstGrado.grado)
                  }}
                  className={styles.quickNivelDot}
                  title={`Expandir y ver ${group.nombre}`}
                  aria-label={group.nombre}
                >
                  <span className={`${styles.treeNivelTag} ${tagClass}`} />
                </button>
              )
            })}
          </div>
        )}
      </aside>

      {/* ── Panel Derecho: Detalle y Tabla de Evaluaciones ── */}
      <section className={styles.detailPanel} aria-label={`Evaluaciones de ${currentGradoNombre}`}>
        {/* Cabecera del Panel de Detalle */}
        <div className={styles.detailHeader}>
          <div className={styles.detailHeaderLeft}>
            {isPanelCollapsed && (
              <button
                type="button"
                onClick={() => setIsPanelCollapsed(false)}
                className={styles.expandFromHeaderBtn}
                title="Mostrar explorador de grados"
                aria-label="Mostrar explorador de grados"
              >
                <MdAccountTree style={{ fontSize: '1rem' }} />
                <span>Grados</span>
              </button>
            )}
            <MdFolderOpen className={styles.detailFolderIcon} />
            <div className={styles.detailTitleBlock}>
              <div className={styles.detailTitleRow}>
                <h3 className={styles.detailTitle}>{currentGradoNombre}</h3>
                <span
                  className={`${styles.detailNivelBadge} ${
                    currentGradoNum === 12
                      ? styles.badgeInicial
                      : currentGradoNum <= 6
                      ? styles.badgePrimaria
                      : styles.badgeSecundaria
                  }`}
                >
                  {currentGradoNivelNombre}
                </span>
              </div>
              <p className={styles.detailSubtitle}>
                {orderedEvaluaciones.length}{' '}
                {orderedEvaluaciones.length === 1 ? 'evaluación registrada' : 'evaluaciones registradas'}{' '}
                en el año {selectedYear}
              </p>
            </div>
          </div>

          <div className={styles.detailHeaderRight}>
            {(orderedEvaluaciones.length > 3 || activeSearchQuery) && (
              <div className={styles.detailSearchInput}>
                <MdSearch className={styles.detailSearchIcon} />
                <input
                  type="text"
                  placeholder="Buscar evaluación..."
                  value={activeSearchQuery}
                  onChange={e => handleSearchChange(e.target.value)}
                  className={styles.detailSearchField}
                />
              </div>
            )}

            <button
              type="button"
              onClick={handleShowCreateModal}
              className={styles.createInGradoButton}
              title={`Crear nueva evaluación para ${currentGradoNombre}`}
              aria-label={`Crear nueva evaluación para ${currentGradoNombre}`}
            >
              <MdAdd className={styles.createInGradoIcon} />
              <span className={styles.createInGradoText}>Crear Evaluación</span>
            </button>
          </div>
        </div>

        {/* Acciones Masivas Flotantes si hay seleccionadas */}
        {selectedEvaIds.length > 0 && currentUserData?.perfil?.rol === 4 && (
          <div className={tableStyles.bulkActionBar}>
            <div className={tableStyles.bulkActionInfo}>
              <span className={tableStyles.bulkActionCount}>{selectedEvaIds.length}</span>
              <span>
                {selectedEvaIds.length === 1
                  ? 'evaluación seleccionada'
                  : 'evaluaciones seleccionadas'}
              </span>
            </div>
            <div className={tableStyles.bulkActionButtons}>
              <button
                onClick={handleOpenBulkDuplicateModal}
                className={tableStyles.bulkDuplicateButton}
                title="Duplicar las evaluaciones seleccionadas"
              >
                <MdContentCopy />
                <span>Duplicar seleccionadas ({selectedEvaIds.length})</span>
              </button>
              <button
                onClick={() => setSelectedEvaIds([])}
                className={tableStyles.bulkCancelButton}
              >
                Deseleccionar todas
              </button>
            </div>
          </div>
        )}

        {/* Tabla de Evaluaciones con DnD */}
        {displayedEvaluaciones.length > 0 ? (
          <div className={styles.tableWrapper}>
            <DndContext
              sensors={sensors}
              collisionDetection={closestCenter}
              onDragEnd={handleDragEnd}
            >
              <table className={tableStyles.table}>
                <thead className={tableStyles.tableHeader}>
                  <tr className={tableStyles.tableHeaderRow}>
                    {currentUserData?.perfil?.rol === 4 && (
                      <th
                        className={tableStyles.tableHeaderCell}
                        style={{ width: '38px', textAlign: 'center', padding: '0 0.25rem' }}
                      >
                        <input
                          type="checkbox"
                          checked={isAllSelected}
                          ref={el => {
                            if (el) el.indeterminate = isSomeSelected
                          }}
                          onChange={handleToggleSelectAll}
                          title={isAllSelected ? 'Deseleccionar todas' : 'Seleccionar todas'}
                          style={{
                            cursor: 'pointer',
                            width: '16px',
                            height: '16px',
                            accentColor: '#6366f1',
                          }}
                        />
                      </th>
                    )}
                    <th className={tableStyles.tableHeaderCell} style={{ width: '40px' }} />
                    {visibleColumns.id && <th className={tableStyles.tableHeaderCell}>ID</th>}
                    {visibleColumns.niveles && <th className={tableStyles.tableHeaderCell}>niveles</th>}
                    {visibleColumns.nombre && <th className={tableStyles.tableHeaderCell}>nombre de evaluación</th>}
                    {visibleColumns.grado && <th className={tableStyles.tableHeaderCell}>grado / nivel</th>}
                    {visibleColumns.fecha && <th className={tableStyles.tableHeaderCell}>mes y año</th>}
                    {visibleColumns.estado && <th className={tableStyles.tableHeaderCell}>estado</th>}
                    {visibleColumns.reporte && <th className={tableStyles.tableHeaderCell}>reporte</th>}
                    {visibleColumns.acciones && <th className={tableStyles.tableHeaderCell}>acciones</th>}
                  </tr>
                </thead>
                <tbody className={tableStyles.tableBody}>
                  <SortableContext
                    items={displayedEvaluaciones.map(eva => eva.id)}
                    strategy={verticalListSortingStrategy}
                  >
                    {displayedEvaluaciones.map(eva => {
                      const puedeAcceder = tieneAccesoAEvaluacion(eva)
                      const gradoObj = grados.find(g => g.grado === eva.grado)

                      return (
                        <SortableRow
                          key={eva.id}
                          eva={eva}
                          puedeAcceder={puedeAcceder}
                          gradoObj={gradoObj}
                          nivelGrado={getNivelGrado(eva.grado || 0)}
                          currentYear={currentYear}
                          editingMonth={editingMonth}
                          editingMonthId={editingMonthId}
                          dataEvaluacion={dataEvaluacion}
                          setDataEvaluacion={setDataEvaluacion}
                          updatingMonth={updatingMonth}
                          handleSaveMonth={handleSaveMonth}
                          handleCancelEditMonth={handleCancelEditMonth}
                          handleEditMonth={handleEditMonth}
                          handleCopyId={handleCopyId}
                          toggleActiveStatus={toggleActiveStatus}
                          handleShowInputUpdate={handleShowInputUpdate}
                          setNameEva={setNameEva}
                          setIdEva={setIdEva}
                          handleShowModalDelete={handleShowModalDelete}
                          currentUserData={currentUserData}
                          visibleColumns={visibleColumns}
                          selectedGrado={selectedGrado}
                          handleOpenPuntuacionModal={handleOpenPuntuacionModal}
                          handleOpenDuplicateModal={handleOpenDuplicateModal}
                          isSelected={selectedEvaIds.includes(eva.id)}
                          onToggleSelect={handleToggleSelect}
                          searchQuery={activeSearchQuery}
                        />
                      )
                    })}
                  </SortableContext>
                </tbody>
              </table>
            </DndContext>
          </div>
        ) : (
          <div className={styles.emptyState}>
            <MdFolderOpen className={styles.emptyStateIcon} />
            <h4 className={styles.emptyStateTitle}>
              {activeSearchQuery ? 'Sin resultados para la búsqueda' : 'Sin evaluaciones en este grado'}
            </h4>
            <p className={styles.emptyStateText}>
              {activeSearchQuery
                ? `No se encontraron evaluaciones con el término "${activeSearchQuery}" en ${currentGradoNombre}.`
                : `Aún no se han registrado evaluaciones para ${currentGradoNombre} en el año lectivo ${selectedYear}.`}
            </p>
            {activeSearchQuery ? (
              <button
                type="button"
                onClick={() => handleSearchChange('')}
                className={styles.emptyStateButton}
              >
                Limpiar búsqueda
              </button>
            ) : (
              <button
                type="button"
                onClick={handleShowCreateModal}
                className={styles.emptyStateButton}
              >
                <MdAddCircle />
                <span>Crear Primera Evaluación</span>
              </button>
            )}
          </div>
        )}
      </section>
    </div>
  )
}

export default EvaluacionesSidebarView
