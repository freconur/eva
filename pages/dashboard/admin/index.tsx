import PrivateRouteAdmins from '@/components/layouts/PrivateRoutes'
import React, { useState, useMemo, useEffect } from 'react'
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler
} from 'chart.js'
import { Line } from 'react-chartjs-2'
import { FaArrowUp, FaArrowDown } from 'react-icons/fa'
import { useAgregarEvaluaciones } from '@/features/hooks/useAgregarEvaluaciones'
import { useGlobalContext } from '@/features/context/GlolbalContext'
import { useBusquedaDifusa } from '@/features/hooks/useBusquedaDifusa'
import { httpsCallable } from 'firebase/functions'
import { functions, FUNCTIONS_TIMEOUT } from '@/firebase/firebase.config'

// Registrar los componentes necesarios de Chart.js
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler
)

interface EvaluacionData {
  id: string
  nombre: string
  color: string
  datos: {
    mes: string
    valor: number
  }[]
}

const DashboardAdmin = () => { 
  // Estados para filtros
  const [textoBusqueda, setTextoBusqueda] = useState<string>('')
  const [mostrarDropdown, setMostrarDropdown] = useState<boolean>(false)
  const { getEvaluaciones } = useAgregarEvaluaciones()
  const { evaluaciones } = useGlobalContext()

  // Estado de checkboxes de evaluaciones
  const [evaluacionesSeleccionadas, setEvaluacionesSeleccionadas] = useState<Set<string>>(
    new Set()
  )

  // Estado para almacenar las colecciones por evaluación
  const [coleccionesPorEvaluacion, setColeccionesPorEvaluacion] = useState<Map<string, any[]>>(
    new Map()
  )

  // Estado para las colecciones seleccionadas por evaluación
  const [coleccionesSeleccionadas, setColeccionesSeleccionadas] = useState<Map<string, Set<number>>>(
    new Map()
  )

  // Estado para controlar qué dropdowns de colecciones están abiertos (pueden estar múltiples abiertos)
  const [dropdownColeccionesAbierto, setDropdownColeccionesAbierto] = useState<Set<string>>(
    new Set()
  )

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

  // Filtrar evaluaciones por tipoDeEvaluacion === "1" (para mostrar en el panel)
  const evaluacionesFiltradasPorTipo = useMemo(() => {
    return evaluacionesTipo1
  }, [evaluacionesTipo1])

  // Función para llamar a la cloud function getListCollectionsEvaluacionesPorMes
  const llamarGetListCollectionsEvaluacionesPorMes = async (idEvaluacion: string) => {
    try {
      // Agregar el id a los que están cargando
      setLoadingEvaluaciones(prev => new Set(prev).add(idEvaluacion))
      
      // Crear la función callable con timeout personalizado
      const getListCollectionsFunction = httpsCallable(
        functions,
        'getListCollectionsEvaluacionesPorMes',
        {
          timeout: FUNCTIONS_TIMEOUT
        }
      )

      console.log('📞 Llamando a getListCollectionsEvaluacionesPorMes con idEvaluacion:', idEvaluacion)

      // Llamar a la función
      const resultado = await getListCollectionsFunction({ idEvaluacion })
      
      console.log('✅ Resultado de getListCollectionsEvaluacionesPorMes:', resultado.data)
      
      // Guardar las colecciones en el estado
      if (resultado.data && Array.isArray(resultado.data)) {
        const coleccionesData = resultado.data as any[]
        setColeccionesPorEvaluacion(prev => {
          const nuevo = new Map(prev)
          nuevo.set(idEvaluacion, coleccionesData)
          return nuevo
        })

        // Inicializar todas las colecciones como seleccionadas por defecto
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
      // Remover el id de los que están cargando
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
      
      // Limpiar las colecciones cuando se elimina una evaluación
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
      
      // Si se está agregando una evaluación, llamar a la cloud function
      try {
        await llamarGetListCollectionsEvaluacionesPorMes(id)
      } catch (error) {
        console.error('Error al obtener colecciones de evaluaciones por mes:', error)
        // Revertir la selección si hay error
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
        
        // Llamar a la cloud function cuando se selecciona una evaluación
        try {
          await llamarGetListCollectionsEvaluacionesPorMes(id)
        } catch (error) {
          console.error('Error al obtener colecciones de evaluaciones por mes:', error)
          // Revertir la selección si hay error
          nuevasSeleccionadas.delete(id)
          setEvaluacionesSeleccionadas(nuevasSeleccionadas)
        }
      }
      // Mantener el texto de búsqueda para poder seguir buscando
      setMostrarDropdown(false)
    }
  }

  // Filtrar evaluaciones seleccionadas (solo las que tienen tipoDeEvaluacion === "1")
  const evaluacionesSeleccionadasFiltradas = useMemo(() => {
    return evaluacionesFiltradasPorTipo.filter(evaluacion => 
      evaluacionesSeleccionadas.has(evaluacion.id || '')
    )
  }, [evaluacionesFiltradasPorTipo, evaluacionesSeleccionadas])

  // Función helper para obtener el nombre del mes
  const obtenerNombreMes = (numero: number): string => {
    const meses = [
      'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
      'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
    ]
    return meses[numero - 1] || `Mes ${numero}`
  }

  // Función helper para normalizar nombres de niveles (case-insensitive)
  const normalizarNivel = (nivel: string): string => {
    const nivelLower = nivel.toLowerCase().trim()
    const mapeo: Record<string, string> = {
      'previo al inicio': 'Previo al inicio',
      'inicio': 'Inicio',
      'en proceso': 'En proceso',
      'satisfactorio': 'Satisfactorio'
    }
    return mapeo[nivelLower] || nivel
  }

  // Preparar datos para el gráfico
  const datosGrafico = useMemo(() => {
    // Colores predefinidos para las evaluaciones
    const colores = ['#3B82F6', '#EF4444', '#10B981', '#F59E0B', '#8B5CF6', '#EC4899']
    
    // Definir el orden de los niveles en el eje X
    const nivelesOrden = ['Previo al inicio', 'Inicio', 'En proceso', 'Satisfactorio']
    
    // Crear un mapa de colección -> datos para acceso rápido por evaluación
    const datosPorEvaluacion = new Map<string, Map<number, any[]>>()
    evaluacionesSeleccionadasFiltradas.forEach(evaluacion => {
      const idEvaluacion = evaluacion.id || ''
      const coleccionesEvaluacion = coleccionesPorEvaluacion.get(idEvaluacion) || []
      const datosPorColeccion = new Map<number, any[]>()
      
      coleccionesEvaluacion.forEach((item: any) => {
        const coleccionNum = typeof item.coleccion === 'number' 
          ? item.coleccion 
          : parseInt(item.coleccion, 10)
        // Guardar el array de datos (niveles) para esta colección
        datosPorColeccion.set(coleccionNum, item.data || [])
      })
      
      datosPorEvaluacion.set(idEvaluacion, datosPorColeccion)
    })
    
    // Crear datasets: cada línea representa una evaluación + mes seleccionado
    const datasets: any[] = []
    let colorIndex = 0
    
    evaluacionesSeleccionadasFiltradas.forEach((evaluacion, evalIndex) => {
      const idEvaluacion = evaluacion.id || ''
      const coleccionesSeleccionadasEvaluacion = coleccionesSeleccionadas.get(idEvaluacion) || new Set<number>()
      const datosPorColeccion = datosPorEvaluacion.get(idEvaluacion) || new Map()
      
      // Ordenar las colecciones seleccionadas para esta evaluación
      const coleccionesOrdenadas = Array.from(coleccionesSeleccionadasEvaluacion).sort((a, b) => a - b)
      
      // Crear una línea por cada mes seleccionado
      coleccionesOrdenadas.forEach(coleccion => {
        const datosColeccion = datosPorColeccion.get(coleccion) || []
        const nombreMes = obtenerNombreMes(coleccion)
        
        // Debug: ver qué datos tenemos
        console.log(`📊 Datos para ${evaluacion.nombre} - ${nombreMes}:`, datosColeccion)
        
        // Crear un mapa de nivel normalizado -> cantidad para acceso rápido
        const cantidadPorNivel = new Map<string, number>()
        datosColeccion.forEach((nivel: any) => {
          if (nivel && nivel.nivel && nivel.cantidadDeEstudiantes !== undefined) {
            const nivelNormalizado = normalizarNivel(nivel.nivel)
            cantidadPorNivel.set(nivelNormalizado, nivel.cantidadDeEstudiantes)
          }
        })
        
        // Crear el array de datos para cada nivel en el orden correcto
        const data = nivelesOrden.map(nivelNombre => {
          const cantidad = cantidadPorNivel.get(nivelNombre) || 0
          return cantidad
        })
        
        // Debug: ver el array de datos generado
        console.log(`📈 Data array para ${evaluacion.nombre} - ${nombreMes}:`, data)
        
        datasets.push({
          label: `${evaluacion.nombre || `Evaluación ${evalIndex + 1}`} - ${nombreMes}`,
          data: data,
          borderColor: colores[colorIndex % colores.length],
          backgroundColor: colores[colorIndex % colores.length],
          fill: false,
          tension: 0.1,
          pointRadius: 6,
          pointHoverRadius: 8,
          pointBackgroundColor: colores[colorIndex % colores.length],
          pointBorderColor: '#fff',
          pointBorderWidth: 2
        })
        
        colorIndex++
      })
    })

    console.log('🎯 Datasets finales para el gráfico:', datasets)
    console.log('🏷️ Labels del gráfico:', nivelesOrden)

    return {
      labels: nivelesOrden,
      datasets
    }
  }, [evaluacionesSeleccionadasFiltradas, coleccionesPorEvaluacion, coleccionesSeleccionadas])

  // Configuración del gráfico
  const opcionesGrafico = useMemo(() => {
    return {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          position: 'bottom' as const,
          labels: {
            usePointStyle: true,
            padding: 15,
            font: {
              size: 12
            }
          }
        },
        title: {
          display: true,
          text: 'Distribución de Estudiantes por Nivel',
          font: {
            size: 18,
            weight: 'bold' as const
          },
          padding: {
            top: 10,
            bottom: 20
          }
        },
        tooltip: {
          backgroundColor: 'rgba(0, 0, 0, 0.8)',
          titleColor: '#fff',
          bodyColor: '#fff',
          borderColor: '#666',
          borderWidth: 1,
          cornerRadius: 8,
          displayColors: true,
          callbacks: {
            label: function(context: any) {
              const nivel = datosGrafico.labels[context.dataIndex]
              const valor = context.parsed.y
              if (valor === null) return `${context.dataset.label}: Sin datos (${nivel})`
              return `${context.dataset.label}: ${valor.toFixed(0)} estudiantes (${nivel})`
            }
          }
        }
      },
      scales: {
        y: {
          beginAtZero: true,
          title: {
            display: true,
            text: 'Cantidad de Estudiantes',
            font: {
              size: 14
            }
          },
          ticks: {
            stepSize: undefined
          },
          grid: {
            color: 'rgba(0, 0, 0, 0.1)'
          }
        },
        x: {
          title: {
            display: true,
            text: 'Niveles',
            font: {
              size: 14
            }
          },
          grid: {
            display: false
          }
        }
      }
    }
  }, [datosGrafico])

  // Calcular datos para la tabla
  const datosTabla = useMemo(() => {
    return evaluacionesSeleccionadasFiltradas.map(evaluacion => {
      // Datos de ejemplo - aquí deberías obtener los datos reales de cada evaluación
      const octubre: number = 85.2
      const noviembre: number = 88.5
      const diferencia = noviembre - octubre
      const porcentajeCambio = octubre > 0 ? ((diferencia / octubre) * 100) : 0

      return {
        evaluacion: evaluacion.nombre || 'Sin nombre',
        octubre,
        noviembre,
        suma: octubre + noviembre,
        diferencia,
        porcentajeCambio
      }
    })
  }, [evaluacionesSeleccionadasFiltradas])


  useEffect(() => {
    getEvaluaciones()
  }, [getEvaluaciones])

  // Obtener las evaluaciones seleccionadas para mostrar en el panel
  const evaluacionesSeleccionadasParaMostrar = useMemo(() => {
    return evaluacionesTipo1.filter(evaluacion => 
      evaluacionesSeleccionadas.has(evaluacion.id || '')
    )
  }, [evaluacionesTipo1, evaluacionesSeleccionadas])

  // Cerrar dropdown al hacer click fuera
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as HTMLElement
      if (!target.closest('#buscarEvaluacion') && !target.closest('.dropdown-evaluaciones')) {
        setMostrarDropdown(false)
      }
      // Solo cerrar si se hace clic fuera de todos los dropdowns de colecciones
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

  console.log('evaluaciones totales', evaluaciones)
  console.log('evaluaciones filtradas (tipoDeEvaluacion === "1")', evaluacionesFiltradasPorTipo)
  return (
    <div className="min-h-screen bg-gray-50 p-6 w-full">
      <div className="w-full space-y-6">
        {/* Sección de Filtros */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-lg font-semibold text-gray-700 mb-4 uppercase">Filtros</h2>
          
          {/* Input de búsqueda con dropdown */}
          <div className="mb-4 relative">
            <label htmlFor="buscarEvaluacion" className="block text-sm text-gray-600 mb-2">
              Buscar evaluación:
            </label>
            <div className="relative">
              <input
                id="buscarEvaluacion"
                type="text"
                value={textoBusqueda}
                onChange={(e) => {
                  setTextoBusqueda(e.target.value)
                  setMostrarDropdown(true)
                }}
                onFocus={() => {
                  setMostrarDropdown(true)
                }}
                placeholder="Buscar por nombre de evaluación..."
                className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
              />
              
              {/* Dropdown de resultados */}
              {debeMostrarDropdown && (
                <div className="dropdown-evaluaciones absolute z-50 w-full mt-1 bg-white border border-gray-300 rounded-md shadow-lg max-h-60 overflow-auto">
                  {evaluacionesParaDropdown.map((evaluacion) => (
                    <div
                      key={evaluacion.id}
                      onClick={() => handleSeleccionarEvaluacion(evaluacion)}
                      className={`px-4 py-2 cursor-pointer hover:bg-blue-50 transition-colors ${
                        evaluacionesSeleccionadas.has(evaluacion.id || '')
                          ? 'bg-blue-100'
                          : ''
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-gray-700 lowercase">{(evaluacion.nombre || 'Sin nombre').toLowerCase()}</span>
                        {evaluacionesSeleccionadas.has(evaluacion.id || '') && (
                          <span className="text-xs text-blue-600 font-semibold">✓ Seleccionada</span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
              
              {/* Mensaje cuando no hay resultados */}
              {mostrarDropdown && textoBusqueda.trim() && evaluacionesParaDropdown.length === 0 && (
                <div className="dropdown-evaluaciones absolute z-50 w-full mt-1 bg-white border border-gray-300 rounded-md shadow-lg">
                  <div className="px-4 py-3 text-sm text-gray-500 text-center">
                    No se encontraron evaluaciones que coincidan con &quot;{textoBusqueda}&quot;
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Contenido principal */}
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Panel izquierdo - Lista de evaluaciones seleccionadas */}
          <div className="lg:col-span-1 bg-white rounded-lg shadow-md p-6">
            <h3 className="text-lg font-semibold text-gray-700 mb-4 uppercase">Evaluaciones</h3>
            <div className="space-y-3">
              {evaluacionesSeleccionadasParaMostrar.length > 0 ? (
                <>
                  {/* Lista de evaluaciones seleccionadas con dropdown de colecciones */}
                  <div className="space-y-2">
                    <p className="text-xs text-gray-500 font-medium mb-2">Evaluaciones seleccionadas:</p>
                    {evaluacionesSeleccionadasParaMostrar.map((evaluacion) => {
                      const idEvaluacion = evaluacion.id || ''
                      const colecciones = coleccionesPorEvaluacion.get(idEvaluacion) || []
                      const coleccionesSeleccionadasEvaluacion = coleccionesSeleccionadas.get(idEvaluacion) || new Set<number>()
                      const estaAbierto = dropdownColeccionesAbierto.has(idEvaluacion)
                      const estaCargando = loadingEvaluaciones.has(idEvaluacion)

                      return (
                        <div
                          key={evaluacion.id}
                          data-evaluacion-id={idEvaluacion}
                          className="border border-gray-200 rounded-md bg-gray-50 hover:bg-gray-100 transition-colors"
                        >
                          {/* Header de la evaluación */}
                          <div className="flex items-center justify-between p-2">
                            <span className="text-sm text-gray-700 lowercase flex-1">
                              {(evaluacion.nombre || 'Sin nombre').toLowerCase()}
                            </span>
                            <div className="flex items-center gap-2">
                              {/* Botón para abrir/cerrar dropdown de colecciones */}
                              {colecciones.length > 0 && (
                                <button
                                  onClick={() => {
                                    setDropdownColeccionesAbierto(prev => {
                                      const nuevo = new Set(prev)
                                      if (nuevo.has(idEvaluacion)) {
                                        nuevo.delete(idEvaluacion)
                                      } else {
                                        nuevo.add(idEvaluacion)
                                      }
                                      return nuevo
                                    })
                                  }}
                                  className="text-blue-500 hover:text-blue-700 text-xs font-medium px-2 py-1 rounded hover:bg-blue-50 transition-colors"
                                  title="Ver colecciones"
                                >
                                  {estaAbierto ? '▼' : '▶'} Colecciones
                                </button>
                              )}
                              {/* Indicador de carga */}
                              {estaCargando && (
                                <span className="text-xs text-gray-500">Cargando...</span>
                              )}
                              {/* Botón para eliminar evaluación */}
                              <button
                                onClick={() => handleToggleEvaluacion(idEvaluacion)}
                                className="text-red-500 hover:text-red-700 text-xs font-medium"
                                title="Eliminar evaluación"
                              >
                                ✕
                              </button>
                            </div>
                          </div>

                          {/* Dropdown de colecciones con checkboxes */}
                          {estaAbierto && colecciones.length > 0 && (
                            <div className="dropdown-colecciones border-t border-gray-200 bg-white p-3 max-h-60 overflow-y-auto">
                              <p className="text-xs text-gray-600 font-medium mb-2">Seleccionar meses:</p>
                              <div className="space-y-2">
                                {colecciones.map((item: any) => {
                                  const coleccionNum = typeof item.coleccion === 'number' 
                                    ? item.coleccion 
                                    : parseInt(item.coleccion, 10)
                                  const estaSeleccionada = coleccionesSeleccionadasEvaluacion.has(coleccionNum)
                                  
                                  return (
                                    <label
                                      key={coleccionNum}
                                      className="flex items-center gap-2 cursor-pointer hover:bg-gray-50 p-1 rounded"
                                    >
                                      <input
                                        type="checkbox"
                                        checked={estaSeleccionada}
                                        onChange={() => handleToggleColeccion(idEvaluacion, coleccionNum)}
                                        className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                                      />
                                      <span className="text-sm text-gray-700">
                                        {obtenerNombreMes(coleccionNum)}
                                      </span>
                                    </label>
                                  )
                                })}
                              </div>
                            </div>
                          )}

                          {/* Mensaje cuando no hay colecciones */}
                          {estaAbierto && colecciones.length === 0 && !estaCargando && (
                            <div className="dropdown-colecciones border-t border-gray-200 bg-white p-3">
                              <p className="text-xs text-gray-500 text-center">
                                No hay colecciones disponibles
                              </p>
                            </div>
                          )}
                        </div>
                      )
                    })}
                  </div>
                </>
              ) : (
                <p className="text-sm text-gray-500 text-center py-4">
                  No hay evaluaciones seleccionadas. Busca y selecciona evaluaciones desde el campo de búsqueda.
                </p>
              )}
            </div>
          </div>

          {/* Panel principal - Gráfico */}
          <div className="lg:col-span-3 bg-white rounded-lg shadow-md p-6">
            <div className="h-96">
              <Line data={datosGrafico} options={opcionesGrafico} />
            </div>
          </div>
        </div>

        {/* Tabla de datos detallados */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <h3 className="text-lg font-semibold text-gray-700 mb-4 uppercase">
            Tabla de Datos Detealdes
          </h3>
          <div className="overflow-x-auto">
            <table className="w-full border-collapse">
              <thead>
                <tr className="bg-gray-100 border-b-2 border-gray-300">
                  <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700 uppercase">
                    Evaluación
                  </th>
                  <th className="px-4 py-3 text-center text-sm font-semibold text-gray-700 uppercase">
                    Octubre (Valor)
                  </th>
                  <th className="px-4 py-3 text-center text-sm font-semibold text-gray-700 uppercase">
                    Novimbre (Valor)
                  </th>
                  <th className="px-4 py-3 text-center text-sm font-semibold text-gray-700 uppercase">
                    Suma
                  </th>
                  <th className="px-4 py-3 text-center text-sm font-semibold text-gray-700 uppercase">
                    Diferencia Abslutaa
                  </th>
                  <th className="px-4 py-3 text-center text-sm font-semibold text-gray-700 uppercase">
                    % Cambo
                  </th>
                </tr>
              </thead>
              <tbody>
                {datosTabla.map((fila, index) => (
                  <tr
                    key={index}
                    className="border-b border-gray-200 hover:bg-gray-50 transition-colors"
                  >
                    <td className="px-4 py-3 text-sm text-gray-700">{fila.evaluacion}</td>
                    <td className="px-4 py-3 text-sm text-gray-700 text-center">
                      {fila.octubre.toFixed(1)}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-700 text-center">
                      {fila.noviembre.toFixed(1)}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-700 text-center">
                      {fila.suma.toFixed(1)}
                    </td>
                    <td
                      className={`px-4 py-3 text-sm text-center font-medium ${
                        fila.diferencia >= 0 ? 'text-green-600' : 'text-red-600'
                      }`}
                    >
                      {fila.diferencia >= 0 ? '+' : ''}
                      {fila.diferencia.toFixed(1)}
                    </td>
                    <td
                      className={`px-4 py-3 text-sm text-center font-medium flex items-center justify-center gap-1 ${
                        fila.porcentajeCambio >= 0 ? 'text-green-600' : 'text-red-600'
                      }`}
                    >
                      {fila.porcentajeCambio >= 0 ? (
                        <FaArrowUp className="text-xs" />
                      ) : (
                        <FaArrowDown className="text-xs" />
                      )}
                      {fila.porcentajeCambio >= 0 ? '+' : ''}
                      {fila.porcentajeCambio.toFixed(2)}%
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  )
}

export default DashboardAdmin
DashboardAdmin.Auth = PrivateRouteAdmins
