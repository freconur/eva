import { renderHook, act } from '@testing-library/react'
import { useEvaluacionesFilters } from '../useEvaluacionesFilters'

const mockPush = jest.fn()
jest.mock('next/router', () => ({
  useRouter: () => ({
    isReady: true,
    query: {},
    pathname: '/admin/evaluaciones',
    push: mockPush,
  }),
}))

let mockEvaluaciones: any[] = []
let mockGrados: any[] = [
  { id: 'g1', grado: 1, nombre: '1° de Primaria', nivel: 1 },
  { id: 'g2', grado: 2, nombre: '2° de Primaria', nivel: 1 },
]
let mockCurrentUser = { dni: '76543210', perfil: { rol: 4 } }

jest.mock('@/features/context/GlolbalContext', () => ({
  useGlobalContext: () => ({
    evaluaciones: mockEvaluaciones,
    grados: mockGrados,
    currentUserData: mockCurrentUser,
  }),
}))

describe('useEvaluacionesFilters - availableMonths', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    mockEvaluaciones = [
      // 1° grado tiene evaluaciones solo en Marzo (2) y Julio (6)
      { id: 'eva-1', nombre: 'Diagnóstica 1°', grado: 1, mesDelExamen: '2', añoDelExamen: '2026' },
      { id: 'eva-2', nombre: 'Salida 1°', grado: 1, mesDelExamen: '6', añoDelExamen: '2026' },
      // 2° grado tiene evaluaciones en Mayo (4) y Noviembre (10)
      { id: 'eva-3', nombre: 'Diagnóstica 2°', grado: 2, mesDelExamen: '4', añoDelExamen: '2026' },
      { id: 'eva-4', nombre: 'Salida 2°', grado: 2, mesDelExamen: '10', añoDelExamen: '2026' },
      // Otra de año distinto (2025)
      { id: 'eva-5', nombre: 'Año pasado', grado: 1, mesDelExamen: '8', añoDelExamen: '2025' },
    ]
  })

  test('availableMonths debe incluir solo los meses con evaluaciones para el grado seleccionado y año actual', () => {
    const { result } = renderHook(() => useEvaluacionesFilters())

    // selectedGrado por defecto es '1' y selectedYear es el año actual (2026)
    // Debería retornar SOLAMENTE Marzo (2) y Julio (6)
    expect(result.current.availableMonths).toEqual([
      { id: '2', name: 'Marzo', count: 1 },
      { id: '6', name: 'Julio', count: 1 },
    ])
  })

  test('al cambiar de grado a 2°, availableMonths debe actualizarse solo a Mayo y Noviembre', () => {
    const { result } = renderHook(() => useEvaluacionesFilters())

    act(() => {
      result.current.setSelectedGrado('2')
    })

    expect(result.current.availableMonths).toEqual([
      { id: '4', name: 'Mayo', count: 1 },
      { id: '10', name: 'Noviembre', count: 1 },
    ])
  })

  test('cuando selectedGrado es "all", debe incluir los meses de todos los grados permitidos en ese año', () => {
    const { result } = renderHook(() => useEvaluacionesFilters())

    act(() => {
      result.current.setSelectedGrado('all')
    })

    expect(result.current.availableMonths).toEqual([
      { id: '2', name: 'Marzo', count: 1 },
      { id: '4', name: 'Mayo', count: 1 },
      { id: '6', name: 'Julio', count: 1 },
      { id: '10', name: 'Noviembre', count: 1 },
    ])
  })

  test('si un grado no tiene evaluaciones registradas, availableMonths debe ser un arreglo vacío', () => {
    const { result } = renderHook(() => useEvaluacionesFilters())

    act(() => {
      result.current.setSelectedGrado('99') // Grado inexistente
    })

    expect(result.current.availableMonths).toEqual([])
  })
})

describe('useEvaluacionesFilters - availableCategories y filtrado por categoría', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    mockEvaluaciones = [
      // 1° grado tiene categoría 1 (lee) y categoría 2 (resuelve problemas)
      { id: 'eva-1', nombre: 'Diagnóstica Lee 1°', grado: 1, categoria: 1, mesDelExamen: '2', añoDelExamen: '2026' },
      { id: 'eva-2', nombre: 'Diagnóstica Mate 1°', grado: 1, categoria: 2, mesDelExamen: '2', añoDelExamen: '2026' },
      // 2° grado tiene solo categoría 2 (resuelve problemas)
      { id: 'eva-3', nombre: 'Diagnóstica Mate 2°', grado: 2, categoria: 2, mesDelExamen: '4', añoDelExamen: '2026' },
    ]
  })

  test('availableCategories debe incluir las categorías existentes para el grado y año seleccionado', () => {
    const { result } = renderHook(() => useEvaluacionesFilters())

    // Grado 1 debe tener categoría 1 (lee) y categoría 2 (resuelve problemas)
    expect(result.current.availableCategories).toEqual([
      { id: '1', name: 'lee', count: 1 },
      { id: '2', name: 'resuelve problemas', count: 1 },
    ])
  })

  test('filtrar por categoría debe reducir orderedEvaluaciones a solo esa categoría', () => {
    const { result } = renderHook(() => useEvaluacionesFilters())

    expect(result.current.orderedEvaluaciones.length).toBe(2)

    act(() => {
      result.current.setSelectedCategoria('1')
    })

    expect(result.current.orderedEvaluaciones.length).toBe(1)
    expect(result.current.orderedEvaluaciones[0].id).toBe('eva-1')
  })

  test('al cambiar a un grado que no tiene la categoría seleccionada, debe resetearse automáticamente a "all"', () => {
    const { result } = renderHook(() => useEvaluacionesFilters())

    act(() => {
      result.current.setSelectedCategoria('1') // lee
    })
    expect(result.current.selectedCategoria).toBe('1')

    // Grado 2 solo tiene categoría 2 (resuelve problemas), no categoría 1 (lee)
    act(() => {
      result.current.setSelectedGrado('2')
    })

    // Debe resetearse a 'all'
    expect(result.current.selectedCategoria).toBe('all')
  })
})

describe('useEvaluacionesFilters - búsqueda por texto inteligente (searchQuery)', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    mockEvaluaciones = [
      { id: 'eva-1', nombre: '1ERO MATEMÁTICA MARZO 01.03.2026', grado: 1, categoria: 2, mesDelExamen: '2', añoDelExamen: '2026' },
      { id: 'eva-2', nombre: '1ERO COMUNICACIÓN MARZO 01.03.2026', grado: 1, categoria: 1, mesDelExamen: '2', añoDelExamen: '2026' },
      { id: 'eva-3', nombre: '1ERO MATEMÁTICA OCTUBRE 01.10.2026', grado: 1, categoria: 2, mesDelExamen: '9', añoDelExamen: '2026' },
    ]
  })

  test('filtra evaluaciones por coincidencia de texto ignorando tildes y mayúsculas', () => {
    const { result } = renderHook(() => useEvaluacionesFilters())

    expect(result.current.orderedEvaluaciones.length).toBe(3)

    act(() => {
      result.current.setSearchQuery('matematica')
    })

    expect(result.current.orderedEvaluaciones.length).toBe(2)
    expect(result.current.orderedEvaluaciones.map(e => e.id)).toEqual(['eva-1', 'eva-3'])
  })

  test('filtra con múltiples tokens (AND logic) en cualquier orden', () => {
    const { result } = renderHook(() => useEvaluacionesFilters())

    act(() => {
      result.current.setSearchQuery('octubre mate')
    })

    expect(result.current.orderedEvaluaciones.length).toBe(1)
    expect(result.current.orderedEvaluaciones[0].id).toBe('eva-3')
  })

  test('retorna lista vacía si la búsqueda no coincide con ninguna evaluación', () => {
    const { result } = renderHook(() => useEvaluacionesFilters())

    act(() => {
      result.current.setSearchQuery('ciencias sociales')
    })

    expect(result.current.orderedEvaluaciones.length).toBe(0)
  })

  test('al limpiar el texto de búsqueda, restaura todas las evaluaciones filtradas por los selectores', () => {
    const { result } = renderHook(() => useEvaluacionesFilters())

    act(() => {
      result.current.setSearchQuery('comunicacion')
    })
    expect(result.current.orderedEvaluaciones.length).toBe(1)

    act(() => {
      result.current.setSearchQuery('')
    })
    expect(result.current.orderedEvaluaciones.length).toBe(3)
  })

  test('al cambiar de grado, el valor de searchQuery debe mantenerse y no limpiarse', () => {
    const { result } = renderHook(() => useEvaluacionesFilters())

    act(() => {
      result.current.setSearchQuery('mate')
    })
    expect(result.current.searchQuery).toBe('mate')

    // Cambiar a grado 2
    act(() => {
      result.current.setSelectedGrado('2')
    })

    // El input de búsqueda no debe limpiarse
    expect(result.current.searchQuery).toBe('mate')

    // Cambiar a 'all'
    act(() => {
      result.current.setSelectedGrado('all')
    })
    expect(result.current.searchQuery).toBe('mate')
  })
})

