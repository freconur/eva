import { useState, useMemo, useEffect } from 'react'
import { httpsCallable } from 'firebase/functions'
import { functions, FUNCTIONS_TIMEOUT } from '@/firebase/firebase.config'
import { useBusquedaDifusa } from './useBusquedaDifusa'
import { ordenamientoNatural } from '@/components/dashboard-admin/utils/helpers'

interface UseEvaluacionesDashboardProps {
  evaluaciones: any[]
}

export const useEvaluacionesDashboard = ({ evaluaciones }: UseEvaluacionesDashboardProps) => {
  // Estados para filtros
  const [textoBusqueda, setTextoBusqueda] = useState<string>('')
  const [mostrarDropdown, setMostrarDropdown] = useState<boolean>(false)

  // Estado de checkboxes de evaluaciones
  const [evaluacionesSeleccionadas, setEvaluacionesSeleccionadas] = useState<Set<string>>(new Set())

  // Estado para almacenar las colecciones por evaluación
  const [coleccionesPorEvaluacion, setColeccionesPorEvaluacion] = useState<Map<string, any[]>>(new Map())

  // Estado para las colecciones seleccionadas por evaluación
  const [coleccionesSeleccionadas, setColeccionesSeleccionadas] = useState<Map<string, Set<number>>>(new Map())

  // Estado para controlar qué dropdowns de colecciones están abiertos
  const [dropdownColeccionesAbierto, setDropdownColeccionesAbierto] = useState<Set<string>>(new Set())

  // Estado para manejar el loading de las llamadas a cloud functions
  const [loadingEvaluaciones, setLoadingEvaluaciones] = useState<Set<string>>(new Set())

  // Obtener todas las evaluaciones con tipoDeEvaluacion === "1"
  const evaluacionesTipo1 = useMemo(() => {
    return evaluaciones.filter(evaluacion => evaluacion.tipoDeEvaluacion === "1")
  }, [evaluaciones])

  // Usar el hook de búsqueda difusa
  const evaluacionesBusqueda = useBusquedaDifusa({
    items: evaluacionesTipo1,
    textoBusqueda,
    getTexto: (evaluacion) => evaluacion.nombre || '',
    umbralMinimo: 10
  })

  // Filtrar evaluaciones ya seleccionadas del dropdown
  const evaluacionesParaDropdown = useMemo(() => {
    return evaluacionesBusqueda.filter(
      evaluacion => !evaluacionesSeleccionadas.has(evaluacion.id || '')
    )
  }, [evaluacionesBusqueda, evaluacionesSeleccionadas])

  // Determinar si se debe mostrar el dropdown
  const debeMostrarDropdown = mostrarDropdown && evaluacionesParaDropdown.length > 0

  // Función para llamar a la cloud function getListCollectionsEvaluacionesPorMes
  const llamarGetListCollectionsEvaluacionesPorMes = async (idEvaluacion: string) => {
    try {
      setLoadingEvaluaciones(prev => new Set(prev).add(idEvaluacion))
      
      const getListCollectionsFunction = httpsCallable(
        functions,
        'getListCollectionsEvaluacionesPorMes',
        {
          timeout: FUNCTIONS_TIMEOUT
        }
      )

      console.log('📞 Llamando a getListCollectionsEvaluacionesPorMes con idEvaluacion:', idEvaluacion)

      const resultado = await getListCollectionsFunction({ idEvaluacion })
      
      console.log('✅ Resultado de getListCollectionsEvaluacionesPorMes:', resultado.data)
      
      if (resultado.data && Array.isArray(resultado.data)) {
        const coleccionesData = resultado.data as any[]
        setColeccionesPorEvaluacion(prev => {
          const nuevo = new Map(prev)
          nuevo.set(idEvaluacion, coleccionesData)
          return nuevo
        })

        const colecciones = coleccionesData.map((item: any) => item.coleccion)
        setColeccionesSeleccionadas(prev => {
          const nuevo = new Map(prev)
          nuevo.set(idEvaluacion, new Set(colecciones))
          return nuevo
        })
      }
      
      return resultado.data
    } catch (error: any) {
      console.error('❌ Error al llamar a getListCollectionsEvaluacionesPorMes:', error)
      throw error
    } finally {
      setLoadingEvaluaciones(prev => {
        const nuevo = new Set(prev)
        nuevo.delete(idEvaluacion)
        return nuevo
      })
    }
  }

  // Manejar cambio de checkbox de evaluación
  const handleToggleEvaluacion = async (id: string) => {
    const nuevasSeleccionadas = new Set(evaluacionesSeleccionadas)
    if (nuevasSeleccionadas.has(id)) {
      nuevasSeleccionadas.delete(id)
      setEvaluacionesSeleccionadas(nuevasSeleccionadas)
      
      setColeccionesPorEvaluacion(prev => {
        const nuevo = new Map(prev)
        nuevo.delete(id)
        return nuevo
      })
      setColeccionesSeleccionadas(prev => {
        const nuevo = new Map(prev)
        nuevo.delete(id)
        return nuevo
      })
    } else {
      nuevasSeleccionadas.add(id)
      setEvaluacionesSeleccionadas(nuevasSeleccionadas)
      
      try {
        await llamarGetListCollectionsEvaluacionesPorMes(id)
      } catch (error) {
        console.error('Error al obtener colecciones de evaluaciones por mes:', error)
        nuevasSeleccionadas.delete(id)
        setEvaluacionesSeleccionadas(nuevasSeleccionadas)
      }
    }
  }

  // Manejar toggle de colección (checkbox)
  const handleToggleColeccion = (idEvaluacion: string, coleccion: number) => {
    setColeccionesSeleccionadas(prev => {
      const nuevo = new Map(prev)
      const seleccionadas = nuevo.get(idEvaluacion) || new Set<number>()
      const nuevasSeleccionadas = new Set(seleccionadas)
      
      if (nuevasSeleccionadas.has(coleccion)) {
        nuevasSeleccionadas.delete(coleccion)
      } else {
        nuevasSeleccionadas.add(coleccion)
      }
      
      nuevo.set(idEvaluacion, nuevasSeleccionadas)
      return nuevo
    })
  }

  // Manejar selección desde el dropdown
  const handleSeleccionarEvaluacion = async (evaluacion: any) => {
    const id = evaluacion.id || ''
    if (id) {
      const nuevasSeleccionadas = new Set(evaluacionesSeleccionadas)
      if (!nuevasSeleccionadas.has(id)) {
        nuevasSeleccionadas.add(id)
        setEvaluacionesSeleccionadas(nuevasSeleccionadas)
        
        try {
          await llamarGetListCollectionsEvaluacionesPorMes(id)
        } catch (error) {
          console.error('Error al obtener colecciones de evaluaciones por mes:', error)
          nuevasSeleccionadas.delete(id)
          setEvaluacionesSeleccionadas(nuevasSeleccionadas)
        }
      }
      setMostrarDropdown(false)
    }
  }

  // Filtrar evaluaciones seleccionadas (solo las que tienen tipoDeEvaluacion === "1")
  const evaluacionesSeleccionadasFiltradas = useMemo(() => {
    return evaluacionesTipo1.filter(evaluacion => 
      evaluacionesSeleccionadas.has(evaluacion.id || '')
    )
  }, [evaluacionesTipo1, evaluacionesSeleccionadas])

  // Obtener las evaluaciones seleccionadas para mostrar en el panel (ordenadas ascendente)
  const evaluacionesSeleccionadasParaMostrar = useMemo(() => {
    return evaluacionesTipo1
      .filter(evaluacion => 
        evaluacionesSeleccionadas.has(evaluacion.id || '')
      )
      .sort((a, b) => {
        const nombreA = a.nombre || ''
        const nombreB = b.nombre || ''
        return ordenamientoNatural(nombreA, nombreB)
      })
  }, [evaluacionesTipo1, evaluacionesSeleccionadas])

  // Verificar si se deben mostrar los gráficos y tablas
  const debeMostrarGraficos = useMemo(() => {
    if (evaluacionesSeleccionadasParaMostrar.length === 0) {
      return false
    }

    const tieneDatosCargados = evaluacionesSeleccionadasParaMostrar.some(
      evaluacion => {
        const idEvaluacion = evaluacion.id || ''
        const colecciones = coleccionesPorEvaluacion.get(idEvaluacion) || []
        return colecciones.length > 0
      }
    )

    return tieneDatosCargados
  }, [evaluacionesSeleccionadasParaMostrar, coleccionesPorEvaluacion])

  // Cerrar dropdown al hacer click fuera
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as HTMLElement
      if (!target.closest('#buscarEvaluacion') && !target.closest('.dropdown-evaluaciones')) {
        setMostrarDropdown(false)
      }
      if (!target.closest('.dropdown-colecciones') && !target.closest('[data-evaluacion-id]')) {
        setDropdownColeccionesAbierto(new Set())
      }
    }

    if (mostrarDropdown || dropdownColeccionesAbierto.size > 0) {
      document.addEventListener('mousedown', handleClickOutside)
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [mostrarDropdown, dropdownColeccionesAbierto])

  return {
    // Estados
    textoBusqueda,
    setTextoBusqueda,
    mostrarDropdown,
    setMostrarDropdown,
    evaluacionesSeleccionadas,
    coleccionesPorEvaluacion,
    coleccionesSeleccionadas,
    dropdownColeccionesAbierto,
    setDropdownColeccionesAbierto,
    loadingEvaluaciones,
    
    // Datos calculados
    evaluacionesTipo1,
    evaluacionesParaDropdown,
    debeMostrarDropdown,
    evaluacionesSeleccionadasFiltradas,
    evaluacionesSeleccionadasParaMostrar,
    debeMostrarGraficos,
    
    // Funciones
    handleToggleEvaluacion,
    handleToggleColeccion,
    handleSeleccionarEvaluacion
  }
}

