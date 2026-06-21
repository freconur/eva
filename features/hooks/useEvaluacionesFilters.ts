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

// Helper para mostrar nivel
export const getNivelGrado = (gradoNum: number) => {
  if (gradoNum === 12) return 'Inicial'
  if (gradoNum >= 1 && gradoNum <= 6) return 'Primaria'
  if (gradoNum >= 7 && gradoNum <= 11) return 'Secundaria'
  return 'Otro'
}

export const useEvaluacionesFilters = () => {
  const { evaluaciones, currentUserData, grados } = useGlobalContext()
  const router = useRouter()

  const [selectedYear, setSelectedYear] = useState<string>(new Date().getFullYear().toString())
  const [selectedGrado, setSelectedGrado] = useState<string>('all')
  const [showYearMenu, setShowYearMenu] = useState<boolean>(false)
  const [showGradoMenu, setShowGradoMenu] = useState<boolean>(false)

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

  // --- SINCRONIZACIÓN DE FILTROS CON URL (QUERY PARAMS) ---
  useEffect(() => {
    if (!router.isReady) return;

    const { year, grado } = router.query;
    if (year) setSelectedYear(year as string);
    if (grado) setSelectedGrado(grado as string);
  }, [router.isReady, router.query]);

  const updateQueryParams = (newYear: string, newGrado: string) => {
    router.push({
      pathname: router.pathname,
      query: { ...router.query, year: newYear, grado: newGrado },
    }, undefined, { shallow: true });
  }

  // --- FILTRADO + ORDENAMIENTO LOCAL ---
  useEffect(() => {
    const filtered = evaluaciones.filter(eva => {
      const matchesYear = (eva.añoDelExamen || currentYear) === selectedYear
      let matchesGrado = true
      if (selectedGrado !== 'all') {
        matchesGrado = eva.grado === Number(selectedGrado)
      } else {
        const idsDeGradosPermitidos = gradosFiltrados.map(g => g.grado)
        matchesGrado = idsDeGradosPermitidos.includes(eva.grado)
      }
      return matchesYear && matchesGrado
    })

    if (selectedGrado !== 'all') {
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
  }, [evaluaciones, selectedYear, selectedGrado, gradosFiltrados, currentYear])

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
    showYearMenu,
    setShowYearMenu,
    showGradoMenu,
    setShowGradoMenu,

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
