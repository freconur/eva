import React, { useEffect, useState, useMemo } from 'react'
import { useRouter } from 'next/router'
import {
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from '@dnd-kit/core'
import { arrayMove } from '@dnd-kit/sortable'
import { useGlobalContext } from '@/features/context/GlolbalContext'
import { getMonthName } from '@/fuctions/dates'
import { categoriaTransform } from '@/fuctions/categorias'
import {
  matchesEvaluationSearch,
  calculateEvaluationRelevance,
} from '@/features/utils/searchEvaluaciones'

// Helper para mostrar nivel
export const getNivelGrado = (gradoNum: number) => {
  if (gradoNum === 12) return 'Inicial'
  if (gradoNum >= 1 && gradoNum <= 6) return 'Primaria'
  if (gradoNum >= 7 && gradoNum <= 11) return 'Secundaria'
  return 'Otro'
}

export const useEvaluacionesFilters = () => {
  const { evaluaciones, currentUserData, grados, categorias } = useGlobalContext()
  const router = useRouter()

  const [selectedYear, setSelectedYear] = useState<string>(new Date().getFullYear().toString())
  const [selectedGrado, setSelectedGrado] = useState<string>('1')
  const [selectedMonth, setSelectedMonth] = useState<string>('')
  const [selectedCategoria, setSelectedCategoria] = useState<string>('all')
  const [searchQuery, setSearchQuery] = useState<string>('')
  const [showYearMenu, setShowYearMenu] = useState<boolean>(false)
  const [showGradoMenu, setShowGradoMenu] = useState<boolean>(false)
  const [showMonthMenu, setShowMonthMenu] = useState<boolean>(false)
  const [showCategoriaMenu, setShowCategoriaMenu] = useState<boolean>(false)

  const [visibleColumns, setVisibleColumns] = useState<Record<string, boolean>>({
    id: true,
    niveles: true,
    nombre: true,
    grado: true,
    fecha: true,
    estado: true,
    reporte: true,
    acciones: true
  })
  const [showColMenu, setShowColMenu] = useState<boolean>(false)

  // Drag & Drop local states & sensors
  const [orderedEvaluaciones, setOrderedEvaluaciones] = useState<any[]>([])

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8, // Requires dragging 8px before activation to prevent intercepting button/link clicks
      },
    })
  )

  const currentYear = new Date().getFullYear().toString()

  // --- YEARS ---
  const years = useMemo(() => {
    const startYear = 2025
    const currentYr = new Date().getFullYear()
    const yearsArr = []
    for (let y = startYear; y <= currentYr; y++) {
      yearsArr.push(y.toString())
    }
    return yearsArr
  }, [])

  // --- GRADOS FILTRADOS ---
  const gradosFiltrados = useMemo(() => {
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

  // --- ACCESO A EVALUACIÓN ---
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

  // --- VISIBLE COLUMNS PERSISTENCE ---
  useEffect(() => {
    const savedCols = localStorage.getItem('eva_visible_columns')
    if (savedCols) {
      try {
        const parsed = JSON.parse(savedCols)
        setVisibleColumns(prev => ({ ...prev, ...parsed }))
      } catch (e) {
        console.error("Error reading visible columns from localStorage:", e)
      }
    }
  }, [])

  const toggleColumn = (colKey: string) => {
    const updated = { ...visibleColumns, [colKey]: !visibleColumns[colKey] }
    setVisibleColumns(updated)
    localStorage.setItem('eva_visible_columns', JSON.stringify(updated))
  }

  // --- MESES DISPONIBLES EN BASE AL AÑO, GRADO Y ACCESO (SOLO MESES CON EVALUACIONES) ---
  const availableMonths = useMemo(() => {
    const monthsMap = new Map<number, number>()

    evaluaciones.forEach(eva => {
      const yr = eva.añoDelExamen || currentYear
      if (yr !== selectedYear) return

      if (!tieneAccesoAEvaluacion(eva)) return

      if (selectedGrado !== 'all') {
        if (Number(eva.grado) !== Number(selectedGrado)) return
      } else {
        const idsDeGradosPermitidos = gradosFiltrados.map(g => g.grado)
        if (!idsDeGradosPermitidos.includes(eva.grado)) return
      }

      if (selectedCategoria !== 'all') {
        if (Number(eva.categoria) !== Number(selectedCategoria)) return
      }

      if (
        eva.mesDelExamen !== undefined &&
        eva.mesDelExamen !== null &&
        String(eva.mesDelExamen).trim() !== ''
      ) {
        const monthNum = Number(eva.mesDelExamen)
        if (!isNaN(monthNum) && monthNum >= 0 && monthNum <= 11) {
          monthsMap.set(monthNum, (monthsMap.get(monthNum) || 0) + 1)
        }
      }
    })

    const sortedMonthIds = Array.from(monthsMap.keys()).sort((a, b) => a - b)

    return sortedMonthIds.map(id => ({
      id: id.toString(),
      name: getMonthName(id),
      count: monthsMap.get(id) || 0,
    }))
  }, [evaluaciones, selectedYear, selectedGrado, selectedCategoria, gradosFiltrados, currentYear, currentUserData])

  // --- CATEGORÍAS DISPONIBLES EN BASE A EVALUACIONES EXISTENTES ---
  const availableCategories = useMemo(() => {
    const catMap = new Map<number, number>()

    evaluaciones.forEach(eva => {
      const yr = eva.añoDelExamen || currentYear
      if (yr !== selectedYear) return

      if (!tieneAccesoAEvaluacion(eva)) return

      if (selectedGrado !== 'all') {
        if (Number(eva.grado) !== Number(selectedGrado)) return
      } else {
        const idsDeGradosPermitidos = gradosFiltrados.map(g => g.grado)
        if (!idsDeGradosPermitidos.includes(eva.grado)) return
      }

      if (selectedMonth !== '') {
        if (eva.mesDelExamen?.toString() !== selectedMonth) return
      }

      if (
        eva.categoria !== undefined &&
        eva.categoria !== null &&
        String(eva.categoria).trim() !== ''
      ) {
        const catNum = Number(eva.categoria)
        if (!isNaN(catNum)) {
          catMap.set(catNum, (catMap.get(catNum) || 0) + 1)
        }
      }
    })

    const sortedCatIds = Array.from(catMap.keys()).sort((a, b) => a - b)

    return sortedCatIds.map(id => {
      const name = categoriaTransform(id, categorias)
      return {
        id: id.toString(),
        name: name !== '-' ? name : `Categoría ${id}`,
        count: catMap.get(id) || 0,
      }
    })
  }, [evaluaciones, selectedYear, selectedGrado, selectedMonth, gradosFiltrados, currentYear, currentUserData, categorias])

  // --- SINCRONIZACIÓN INICIAL CON URL (QUERY PARAMS) ---
  const [isUrlInitialized, setIsUrlInitialized] = useState<boolean>(false)

  useEffect(() => {
    if (!router.isReady || isUrlInitialized) return

    const { year, grado, month, categoria, search } = router.query
    if (year) setSelectedYear(year as string)
    
    if (grado) {
      setSelectedGrado(grado as string)
    } else {
      setSelectedGrado('1')
    }

    if (month) {
      setSelectedMonth(month as string)
    } else {
      setSelectedMonth('')
    }

    if (categoria) {
      setSelectedCategoria(categoria as string)
    } else {
      setSelectedCategoria('all')
    }

    if (search && typeof search === 'string') {
      setSearchQuery(search)
    }

    setIsUrlInitialized(true)
  }, [router.isReady, router.query, isUrlInitialized])

  // --- AJUSTE AUTOMÁTICO DE MES SI DEJA DE TENER EVALUACIONES DISPONIBLES ---
  useEffect(() => {
    if (selectedMonth === '' || evaluaciones.length === 0) return

    const isMonthAvailable = availableMonths.some(m => m.id === selectedMonth)
    if (!isMonthAvailable) {
      setSelectedMonth('')
      updateQueryParams(selectedYear, selectedGrado, '', selectedCategoria, searchQuery)
    }
  }, [availableMonths, selectedMonth, selectedYear, selectedGrado, selectedCategoria, searchQuery, evaluaciones.length])

  // --- AJUSTE AUTOMÁTICO DE CATEGORÍA SI DEJA DE TENER EVALUACIONES DISPONIBLES ---
  useEffect(() => {
    if (selectedCategoria === 'all' || evaluaciones.length === 0) return

    const isCatAvailable = availableCategories.some(c => c.id === selectedCategoria)
    if (!isCatAvailable) {
      setSelectedCategoria('all')
      updateQueryParams(selectedYear, selectedGrado, selectedMonth, 'all', searchQuery)
    }
  }, [availableCategories, selectedCategoria, selectedYear, selectedGrado, selectedMonth, searchQuery, evaluaciones.length])

  const updateQueryParams = (
    newYear: string,
    newGrado: string,
    newMonth?: string,
    newCategoria?: string,
    newSearch?: string
  ) => {
    const nextQuery: any = { ...router.query, year: newYear, grado: newGrado }
    if (newMonth !== undefined) {
      if (newMonth === '') {
        delete nextQuery.month
      } else {
        nextQuery.month = newMonth
      }
    }
    if (newCategoria !== undefined) {
      if (newCategoria === 'all' || newCategoria === '') {
        delete nextQuery.categoria
      } else {
        nextQuery.categoria = newCategoria
      }
    }
    const searchVal = newSearch !== undefined ? newSearch : searchQuery
    if (searchVal && searchVal.trim() !== '') {
      nextQuery.search = searchVal.trim()
    } else {
      delete nextQuery.search
    }

    router.push(
      {
        pathname: router.pathname,
        query: nextQuery,
      },
      undefined,
      { shallow: true }
    )
  }

  // --- SINCRONIZACIÓN DE BÚSQUEDA CON URL (DEBOUNCED) ---
  useEffect(() => {
    if (!isUrlInitialized) return

    const timer = setTimeout(() => {
      const currentParam = (router.query.search as string) || ''
      const trimmedQuery = searchQuery.trim()
      if (currentParam !== trimmedQuery) {
        updateQueryParams(
          selectedYear,
          selectedGrado,
          selectedMonth,
          selectedCategoria,
          trimmedQuery
        )
      }
    }, 350)

    return () => clearTimeout(timer)
  }, [searchQuery, isUrlInitialized, selectedYear, selectedGrado, selectedMonth, selectedCategoria])

  // --- FILTRADO + ORDENAMIENTO LOCAL ---
  useEffect(() => {
    const filtered = evaluaciones.filter(eva => {
      const matchesYear = (eva.añoDelExamen || currentYear) === selectedYear
      
      let matchesMonth = true
      if (selectedMonth !== '') {
        matchesMonth = eva.mesDelExamen?.toString() === selectedMonth
      }
      
      let matchesGrado = true
      if (selectedGrado !== 'all') {
        matchesGrado = eva.grado === Number(selectedGrado)
      } else {
        const idsDeGradosPermitidos = gradosFiltrados.map(g => g.grado)
        matchesGrado = idsDeGradosPermitidos.includes(eva.grado)
      }

      let matchesCategoria = true
      if (selectedCategoria !== 'all') {
        matchesCategoria = Number(eva.categoria) === Number(selectedCategoria)
      }

      const matchesSearch = matchesEvaluationSearch(eva, searchQuery)

      return matchesYear && matchesMonth && matchesGrado && matchesCategoria && matchesSearch
    })

    // Si hay búsqueda activa, ordenar por relevancia de búsqueda
    if (searchQuery.trim()) {
      filtered.sort((a, b) => {
        const scoreA = calculateEvaluationRelevance(a, searchQuery)
        const scoreB = calculateEvaluationRelevance(b, searchQuery)
        return scoreB - scoreA
      })
    } else if (selectedGrado !== 'all') {
      const savedOrderStr = localStorage.getItem(`eva_order_${selectedYear}_${selectedGrado}`)
      if (savedOrderStr) {
        try {
          const savedIds: string[] = JSON.parse(savedOrderStr)
          const idToPos = new Map<string, number>()
          savedIds.forEach((id, idx) => idToPos.set(id, idx))

          filtered.sort((a, b) => {
            const idA = a.id || ''
            const idB = b.id || ''
            const posA = idToPos.has(idA) ? idToPos.get(idA)! : Infinity
            const posB = idToPos.has(idB) ? idToPos.get(idB)! : Infinity
            return posA - posB
          })
        } catch (e) {
          console.error("Error parsing saved evaluations order:", e)
        }
      }
    }

    setOrderedEvaluaciones(filtered)
  }, [evaluaciones, selectedYear, selectedMonth, selectedGrado, selectedCategoria, searchQuery, gradosFiltrados, currentYear])

  // --- DRAG & DROP ---
  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event

    if (over && active.id !== over.id) {
      const oldIndex = orderedEvaluaciones.findIndex(item => item.id === active.id)
      const newIndex = orderedEvaluaciones.findIndex(item => item.id === over.id)

      const reordered = arrayMove(orderedEvaluaciones, oldIndex, newIndex)
      setOrderedEvaluaciones(reordered)

      // Persist locally in localStorage
      if (selectedGrado !== 'all') {
        const orderIds = reordered.map(item => item.id)
        localStorage.setItem(
          `eva_order_${selectedYear}_${selectedGrado}`,
          JSON.stringify(orderIds)
        )
      }
    }
  }

  return {
    // Filter states
    selectedYear,
    setSelectedYear,
    selectedGrado,
    setSelectedGrado,
    selectedMonth,
    setSelectedMonth,
    selectedCategoria,
    setSelectedCategoria,
    searchQuery,
    setSearchQuery,
    showYearMenu,
    setShowYearMenu,
    showGradoMenu,
    setShowGradoMenu,
    showMonthMenu,
    setShowMonthMenu,
    showCategoriaMenu,
    setShowCategoriaMenu,
    availableMonths,
    availableCategories,

    // Column visibility
    visibleColumns,
    showColMenu,
    setShowColMenu,
    toggleColumn,

    // Derived data
    years,
    currentYear,
    gradosFiltrados,
    orderedEvaluaciones,

    // D&D
    sensors,
    handleDragEnd,

    // Utilities
    getNivelGrado,
    tieneAccesoAEvaluacion,
    updateQueryParams,
  }
}
