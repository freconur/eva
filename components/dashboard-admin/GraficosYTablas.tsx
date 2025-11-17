import React, { useState, useMemo, useEffect } from 'react'
import { Line, Bar } from 'react-chartjs-2'
import { obtenerNombreMes, normalizarNivel, calcularRangoAmigable } from './utils/helpers'
import { colores, coloresBarras, coloresBordes, nivelesOrden } from './utils/constants'
import styles from './GraficosYTablas.module.css'

interface GraficosYTablasProps {
  evaluacionesSeleccionadasFiltradas: any[]
  coleccionesPorEvaluacion: Map<string, any[]>
  coleccionesSeleccionadas: Map<string, Set<number>>
  modoComparacion: 'mes-a-mes' | 'evaluacion-a-evaluacion'
  vistaColumnas: 1 | 2 | 3
}

const GraficosYTablas: React.FC<GraficosYTablasProps> = ({
  evaluacionesSeleccionadasFiltradas,
  coleccionesPorEvaluacion,
  coleccionesSeleccionadas,
  modoComparacion,
  vistaColumnas
}) => {
  // Estados para drag and drop
  const [ordenFilas, setOrdenFilas] = useState<number[]>([])
  const [filaArrastrando, setFilaArrastrando] = useState<number | null>(null)

  // Estados para tooltips
  const [tooltipVisible, setTooltipVisible] = useState<string | null>(null)
  const [tooltipPosition, setTooltipPosition] = useState<{ x: number; y: number } | null>(null)

  // Preparar datos para el gráfico lineal
  const datosGrafico = useMemo(() => {
    const datosPorEvaluacion = new Map<string, Map<number, any[]>>()
    evaluacionesSeleccionadasFiltradas.forEach(evaluacion => {
      const idEvaluacion = evaluacion.id || ''
      const coleccionesEvaluacion = coleccionesPorEvaluacion.get(idEvaluacion) || []
      const datosPorColeccion = new Map<number, any[]>()
      
      coleccionesEvaluacion.forEach((item: any) => {
        const coleccionNum = typeof item.coleccion === 'number' 
          ? item.coleccion 
          : parseInt(item.coleccion, 10)
        datosPorColeccion.set(coleccionNum, item.data || [])
      })
      
      datosPorEvaluacion.set(idEvaluacion, datosPorColeccion)
    })
    
    const datasets: any[] = []
    let colorIndex = 0
    
    evaluacionesSeleccionadasFiltradas.forEach((evaluacion, evalIndex) => {
      const idEvaluacion = evaluacion.id || ''
      const coleccionesSeleccionadasEvaluacion = coleccionesSeleccionadas.get(idEvaluacion) || new Set<number>()
      const datosPorColeccion = datosPorEvaluacion.get(idEvaluacion) || new Map()
      const coleccionesOrdenadas = Array.from(coleccionesSeleccionadasEvaluacion).sort((a, b) => a - b)
      
      coleccionesOrdenadas.forEach(coleccion => {
        const datosColeccion = datosPorColeccion.get(coleccion) || []
        const nombreMes = obtenerNombreMes(coleccion)
        
        const cantidadPorNivel = new Map<string, number>()
        datosColeccion.forEach((nivel: any) => {
          if (nivel && nivel.nivel && nivel.cantidadDeEstudiantes !== undefined) {
            const nivelNormalizado = normalizarNivel(nivel.nivel)
            cantidadPorNivel.set(nivelNormalizado, nivel.cantidadDeEstudiantes)
          }
        })
        
        const data = nivelesOrden.map(nivelNombre => {
          const cantidad = cantidadPorNivel.get(nivelNombre) || 0
          return cantidad
        })
        
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

    return {
      labels: nivelesOrden,
      datasets
    }
  }, [evaluacionesSeleccionadasFiltradas, coleccionesPorEvaluacion, coleccionesSeleccionadas])

  // Preparar datos para el gráfico de barras
  const datosGraficoBarras = useMemo(() => {
    const datosPorEvaluacion = new Map<string, Map<number, any[]>>()
    evaluacionesSeleccionadasFiltradas.forEach(evaluacion => {
      const idEvaluacion = evaluacion.id || ''
      const coleccionesEvaluacion = coleccionesPorEvaluacion.get(idEvaluacion) || []
      const datosPorColeccion = new Map<number, any[]>()
      
      coleccionesEvaluacion.forEach((item: any) => {
        const coleccionNum = typeof item.coleccion === 'number' 
          ? item.coleccion 
          : parseInt(item.coleccion, 10)
        datosPorColeccion.set(coleccionNum, item.data || [])
      })
      
      datosPorEvaluacion.set(idEvaluacion, datosPorColeccion)
    })
    
    const datasets: any[] = []
    let colorIndex = 0
    
    evaluacionesSeleccionadasFiltradas.forEach((evaluacion, evalIndex) => {
      const idEvaluacion = evaluacion.id || ''
      const coleccionesSeleccionadasEvaluacion = coleccionesSeleccionadas.get(idEvaluacion) || new Set<number>()
      const datosPorColeccion = datosPorEvaluacion.get(idEvaluacion) || new Map()
      const coleccionesOrdenadas = Array.from(coleccionesSeleccionadasEvaluacion).sort((a, b) => a - b)
      
      coleccionesOrdenadas.forEach(coleccion => {
        const datosColeccion = datosPorColeccion.get(coleccion) || []
        const nombreMes = obtenerNombreMes(coleccion)
        
        const cantidadPorNivel = new Map<string, number>()
        datosColeccion.forEach((nivel: any) => {
          if (nivel && nivel.nivel && nivel.cantidadDeEstudiantes !== undefined) {
            const nivelNormalizado = normalizarNivel(nivel.nivel)
            cantidadPorNivel.set(nivelNormalizado, nivel.cantidadDeEstudiantes)
          }
        })
        
        const data = nivelesOrden.map(nivelNombre => {
          const cantidad = cantidadPorNivel.get(nivelNombre) || 0
          return cantidad
        })
        
        datasets.push({
          label: `${evaluacion.nombre || `Evaluación ${evalIndex + 1}`} - ${nombreMes}`,
          data: data,
          backgroundColor: coloresBarras[colorIndex % coloresBarras.length],
          borderColor: coloresBordes[colorIndex % coloresBordes.length],
          borderWidth: 2,
          borderRadius: 8,
          borderSkipped: false,
          barThickness: 'flex' as const,
          maxBarThickness: 60,
          categoryPercentage: 0.7,
          barPercentage: 0.85
        })
        
        colorIndex++
      })
    })

    return {
      labels: nivelesOrden,
      datasets
    }
  }, [evaluacionesSeleccionadasFiltradas, coleccionesPorEvaluacion, coleccionesSeleccionadas])

  // Preparar datos para el gráfico de línea de promedio global
  const datosGraficoLinealPromedioGlobal = useMemo(() => {
    const mesesConDatos = new Set<number>()
    const promediosPorEvaluacion = new Map<string, Map<number, number>>()
    const totalEstudiantesPorEvaluacion = new Map<string, Map<number, number>>()
    
    evaluacionesSeleccionadasFiltradas.forEach(evaluacion => {
      const idEvaluacion = evaluacion.id || ''
      const coleccionesEvaluacion = coleccionesPorEvaluacion.get(idEvaluacion) || []
      const coleccionesSeleccionadasEvaluacion = coleccionesSeleccionadas.get(idEvaluacion) || new Set<number>()
      
      const promedioPorColeccion = new Map<number, number>()
      const totalEstudiantesPorColeccion = new Map<number, number>()
      coleccionesEvaluacion.forEach((item: any) => {
        const coleccionNum = typeof item.coleccion === 'number' 
          ? item.coleccion 
          : parseInt(item.coleccion, 10)
        if (item.promedioGlobal !== undefined && item.promedioGlobal !== null) {
          promedioPorColeccion.set(coleccionNum, item.promedioGlobal)
          if (coleccionesSeleccionadasEvaluacion.has(coleccionNum)) {
            mesesConDatos.add(coleccionNum)
          }
        }
        if (item.totalEstudiantes !== undefined && item.totalEstudiantes !== null) {
          totalEstudiantesPorColeccion.set(coleccionNum, item.totalEstudiantes)
        }
      })
      
      promediosPorEvaluacion.set(idEvaluacion, promedioPorColeccion)
      totalEstudiantesPorEvaluacion.set(idEvaluacion, totalEstudiantesPorColeccion)
    })
    
    const mesesOrdenados = Array.from(mesesConDatos).sort((a, b) => a - b)
    
    if (mesesOrdenados.length === 0) {
      return {
        labels: [],
        datasets: [],
        mesesOrdenados: [],
        totalEstudiantesPorEvaluacion: new Map()
      }
    }
    
    const meses = mesesOrdenados.map(coleccion => obtenerNombreMes(coleccion))
    const datasets: any[] = []
    
    evaluacionesSeleccionadasFiltradas.forEach((evaluacion, evalIndex) => {
      const idEvaluacion = evaluacion.id || ''
      const promedioPorColeccion = promediosPorEvaluacion.get(idEvaluacion) || new Map()
      const coleccionesSeleccionadasEvaluacion = coleccionesSeleccionadas.get(idEvaluacion) || new Set<number>()
      
      const data = mesesOrdenados.map(coleccion => {
        if (!coleccionesSeleccionadasEvaluacion.has(coleccion)) {
          return null
        }
        const promedio = promedioPorColeccion.get(coleccion)
        return promedio !== undefined && promedio !== null ? promedio : null
      })
      
      const tieneDatosValidos = data.some(valor => valor !== null && valor !== undefined)
      
      if (!tieneDatosValidos) {
        return
      }
      
      datasets.push({
        label: evaluacion.nombre || `Evaluación ${evalIndex + 1}`,
        data: data,
        borderColor: colores[evalIndex % colores.length],
        backgroundColor: colores[evalIndex % colores.length],
        fill: false,
        tension: 0.4,
        pointRadius: 6,
        pointHoverRadius: 8,
        pointBackgroundColor: colores[evalIndex % colores.length],
        pointBorderColor: '#fff',
        pointBorderWidth: 2,
        idEvaluacion: idEvaluacion
      })
    })

    return {
      labels: meses,
      datasets,
      mesesOrdenados,
      totalEstudiantesPorEvaluacion
    }
  }, [evaluacionesSeleccionadasFiltradas, coleccionesPorEvaluacion, coleccionesSeleccionadas])

  // Preparar datos para el gráfico de promedio global (barras)
  const datosGraficoPromedioGlobal = useMemo(() => {
    const mesesConDatos = new Set<number>()
    const promediosPorEvaluacion = new Map<string, Map<number, number>>()
    const totalEstudiantesPorEvaluacion = new Map<string, Map<number, number>>()
    const mesesPorEvaluacion = new Map<string, Set<number>>()
    
    evaluacionesSeleccionadasFiltradas.forEach(evaluacion => {
      const idEvaluacion = evaluacion.id || ''
      const coleccionesEvaluacion = coleccionesPorEvaluacion.get(idEvaluacion) || []
      const coleccionesSeleccionadasEvaluacion = coleccionesSeleccionadas.get(idEvaluacion) || new Set<number>()
      
      const promedioPorColeccion = new Map<number, number>()
      const totalEstudiantesPorColeccion = new Map<number, number>()
      const mesesEvaluacion = new Set<number>()
      
      coleccionesEvaluacion.forEach((item: any) => {
        const coleccionNum = typeof item.coleccion === 'number' 
          ? item.coleccion 
          : parseInt(item.coleccion, 10)
        if (item.promedioGlobal !== undefined && item.promedioGlobal !== null) {
          promedioPorColeccion.set(coleccionNum, item.promedioGlobal)
          if (coleccionesSeleccionadasEvaluacion.has(coleccionNum)) {
            mesesConDatos.add(coleccionNum)
            mesesEvaluacion.add(coleccionNum)
          }
        }
        if (item.totalEstudiantes !== undefined && item.totalEstudiantes !== null) {
          totalEstudiantesPorColeccion.set(coleccionNum, item.totalEstudiantes)
        }
      })
      
      promediosPorEvaluacion.set(idEvaluacion, promedioPorColeccion)
      totalEstudiantesPorEvaluacion.set(idEvaluacion, totalEstudiantesPorColeccion)
      mesesPorEvaluacion.set(idEvaluacion, mesesEvaluacion)
    })
    
    const mesesOrdenados = Array.from(mesesConDatos).sort((a, b) => a - b)
    
    if (mesesOrdenados.length === 0) {
      return {
        labels: [],
        datasets: [],
        mesesOrdenados: [],
        totalEstudiantesPorEvaluacion: new Map()
      }
    }
    
    const meses = mesesOrdenados.map(coleccion => obtenerNombreMes(coleccion))
    const datasets: any[] = []
    
    evaluacionesSeleccionadasFiltradas.forEach((evaluacion, evalIndex) => {
      const idEvaluacion = evaluacion.id || ''
      const promedioPorColeccion = promediosPorEvaluacion.get(idEvaluacion) || new Map()
      const mesesEvaluacion = mesesPorEvaluacion.get(idEvaluacion) || new Set<number>()
      
      const data = mesesOrdenados.map(coleccion => {
        if (!mesesEvaluacion.has(coleccion)) {
          return null
        }
        const promedio = promedioPorColeccion.get(coleccion)
        return promedio !== undefined && promedio !== null ? promedio : null
      })
      
      const tieneDatosValidos = data.some(valor => valor !== null && valor !== undefined)
      
      if (!tieneDatosValidos) {
        return
      }
      
      datasets.push({
        label: evaluacion.nombre || `Evaluación ${evalIndex + 1}`,
        data: data,
        backgroundColor: coloresBarras[evalIndex % coloresBarras.length],
        borderColor: coloresBordes[evalIndex % coloresBordes.length],
        borderWidth: 2,
        borderRadius: 8,
        borderSkipped: false,
        barThickness: 'flex' as const,
        maxBarThickness: 60,
        categoryPercentage: 0.7,
        barPercentage: 0.85,
        idEvaluacion: idEvaluacion
      })
    })

    return {
      labels: meses,
      datasets,
      mesesOrdenados,
      totalEstudiantesPorEvaluacion
    }
  }, [evaluacionesSeleccionadasFiltradas, coleccionesPorEvaluacion, coleccionesSeleccionadas])

  // Configuración del gráfico lineal
  const opcionesGrafico = useMemo(() => {
    const todosLosValores: number[] = []
    datosGrafico.datasets.forEach((dataset: any) => {
      dataset.data.forEach((valor: any) => {
        if (valor !== null && valor !== undefined && !isNaN(valor)) {
          todosLosValores.push(valor)
        }
      })
    })
    
    const rango = calcularRangoAmigable(todosLosValores)
    
    return {
      responsive: true,
      maintainAspectRatio: false,
      layout: {
        padding: {
          left: 10,
          right: 10,
          top: 5,
          bottom: 5
        }
      },
      plugins: {
        legend: {
          position: 'bottom' as const,
          labels: {
            usePointStyle: true,
            padding: 10,
            font: {
              size: 11
            }
          }
        },
        title: {
          display: true,
          text: 'Distribución de Estudiantes por Nivel',
          font: {
            size: 16,
            weight: 'bold' as const
          },
          padding: {
            top: 8,
            bottom: 12
          }
        },
        tooltip: {
          mode: 'index' as const,
          intersect: false,
          backgroundColor: 'rgba(15, 23, 42, 0.95)',
          titleColor: '#60A5FA',
          titleFont: {
            size: 14,
            weight: 'bold' as const
          },
          bodyColor: '#E2E8F0',
          bodyFont: {
            size: 12
          },
          borderColor: '#3B82F6',
          borderWidth: 2,
          cornerRadius: 12,
          padding: 16,
          displayColors: true,
          boxPadding: 8,
          usePointStyle: true,
          callbacks: {
            title: function(contexts: any[]) {
              if (contexts.length > 0) {
                const nivel = datosGrafico.labels[contexts[0].dataIndex]
                return `📊 ${nivel.toUpperCase()}`
              }
              return ''
            },
            label: function(context: any) {
              const valor = context.parsed.y
              const labelCompleto = context.dataset.label || ''
              const mes = labelCompleto.includes(' - ') ? labelCompleto.split(' - ')[1] : ''
              if (valor === null || valor === undefined) {
                return `  ⚠️  ${mes ? mes + ': ' : ''}Sin datos`
              }
              return `  ✓  ${mes ? mes + ': ' : ''}${valor.toFixed(0)} estudiantes`
            },
            labelColor: function(context: any) {
              return {
                borderColor: context.dataset.borderColor,
                backgroundColor: context.dataset.backgroundColor,
                borderWidth: 3,
                borderRadius: 4
              }
            },
            afterBody: function(contexts: any[]) {
              if (contexts.length === 0) return ''
              
              const total = contexts.reduce((sum, ctx) => {
                const valor = ctx.parsed.y
                return sum + (valor !== null && valor !== undefined ? valor : 0)
              }, 0)
              
              return [
                '',
                '━━━━━━━━━━━━━━━━━━━━',
                `📈 Total: ${total.toFixed(0)} estudiantes`,
                `📋 Evaluaciones: ${contexts.length}`
              ]
            },
            footer: function() {
              return ''
            }
          }
        }
      },
      scales: {
        y: {
          beginAtZero: rango.min === 0,
          min: rango.min,
          max: rango.max,
          title: {
            display: true,
            text: 'Cantidad de Estudiantes',
            font: {
              size: 12
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
          offset: true,
          title: {
            display: true,
            text: 'Niveles',
            font: {
              size: 12
            }
          },
          grid: {
            display: false
          }
        }
      }
    }
  }, [datosGrafico])

  // Plugin para mostrar valores encima de las barras
  const pluginValoresBarras = useMemo(() => ({
    id: 'valoresBarras',
    afterDatasetsDraw: (chart: any) => {
      const ctx = chart.ctx
      chart.data.datasets.forEach((dataset: any, datasetIndex: number) => {
        const meta = chart.getDatasetMeta(datasetIndex)
        if (meta.hidden) {
          return
        }
        meta.data.forEach((bar: any, index: number) => {
          const valor = dataset.data[index]
          if (valor !== null && valor !== undefined) {
            const x = bar.x
            const y = bar.y
            ctx.save()
            ctx.textAlign = 'center'
            ctx.textBaseline = 'bottom'
            ctx.fillStyle = '#374151'
            ctx.font = 'bold 12px Arial'
            ctx.fillText(
              valor.toFixed(0),
              x,
              y - 5
            )
            ctx.restore()
          }
        })
      })
    }
  }), [])

  // Configuración del gráfico de barras
  const opcionesGraficoBarras = useMemo(() => {
    const todosLosValores: number[] = []
    datosGraficoBarras.datasets.forEach((dataset: any) => {
      dataset.data.forEach((valor: any) => {
        if (valor !== null && valor !== undefined && !isNaN(valor)) {
          todosLosValores.push(valor)
        }
      })
    })
    
    const rango = calcularRangoAmigable(todosLosValores)
    
    return {
      responsive: true,
      maintainAspectRatio: false,
      layout: {
        padding: {
          left: 10,
          right: 10,
          top: 5,
          bottom: 5
        }
      },
      animation: {
        duration: 1000,
        easing: 'easeOutQuart' as const
      },
      plugins: {
        legend: {
          position: 'bottom' as const,
          labels: {
            usePointStyle: true,
            padding: 10,
            font: {
              size: 11
            }
          }
        },
        title: {
          display: true,
          text: 'Distribución de Estudiantes por Nivel (Barras)',
          font: {
            size: 16,
            weight: 'bold' as const
          },
          padding: {
            top: 8,
            bottom: 12
          }
        },
        tooltip: {
          mode: 'index' as const,
          intersect: false,
          backgroundColor: 'rgba(15, 23, 42, 0.95)',
          titleColor: '#60A5FA',
          titleFont: {
            size: 14,
            weight: 'bold' as const
          },
          bodyColor: '#E2E8F0',
          bodyFont: {
            size: 12
          },
          borderColor: '#3B82F6',
          borderWidth: 2,
          cornerRadius: 12,
          padding: 16,
          displayColors: true,
          boxPadding: 8,
          usePointStyle: true,
          callbacks: {
            title: function(contexts: any[]) {
              if (contexts.length > 0) {
                const nivel = datosGraficoBarras.labels[contexts[0].dataIndex]
                return `📊 ${nivel.toUpperCase()}`
              }
              return ''
            },
            label: function(context: any) {
              const valor = context.parsed.y
              const labelCompleto = context.dataset.label || ''
              const mes = labelCompleto.includes(' - ') ? labelCompleto.split(' - ')[1] : ''
              if (valor === null || valor === undefined) {
                return `  ⚠️  ${mes ? mes + ': ' : ''}Sin datos`
              }
              return `  ✓  ${mes ? mes + ': ' : ''}${valor.toFixed(0)} estudiantes`
            },
            labelColor: function(context: any) {
              return {
                borderColor: context.dataset.borderColor,
                backgroundColor: context.dataset.backgroundColor,
                borderWidth: 3,
                borderRadius: 4
              }
            },
            afterBody: function(contexts: any[]) {
              if (contexts.length === 0) return ''
              
              const total = contexts.reduce((sum, ctx) => {
                const valor = ctx.parsed.y
                return sum + (valor !== null && valor !== undefined ? valor : 0)
              }, 0)
              
              return [
                '',
                '━━━━━━━━━━━━━━━━━━━━',
                `📈 Total: ${total.toFixed(0)} estudiantes`,
                `📋 Evaluaciones: ${contexts.length}`
              ]
            },
            footer: function() {
              return ''
            }
          }
        }
      },
      scales: {
        y: {
          beginAtZero: rango.min === 0,
          min: rango.min,
          max: rango.max,
          title: {
            display: true,
            text: 'Cantidad de Estudiantes',
            font: {
              size: 14,
              weight: 'bold' as const
            },
            color: '#4B5563'
          },
          ticks: {
            stepSize: undefined,
            color: '#6B7280',
            font: {
              size: 11
            },
            padding: 8
          },
          grid: {
            color: 'rgba(0, 0, 0, 0.08)',
            drawBorder: false,
            lineWidth: 1
          }
        },
        x: {
          offset: true,
          title: {
            display: true,
            text: 'Niveles',
            font: {
              size: 14,
              weight: 'bold' as const
            },
            color: '#4B5563'
          },
          ticks: {
            color: '#6B7280',
            font: {
              size: 11
            },
            padding: 10
          },
          grid: {
            display: false
          }
        }
      }
    }
  }, [datosGraficoBarras])

  // Plugin para mostrar valores encima de las barras de promedio global
  const pluginValoresPromedioGlobal = useMemo(() => ({
    id: 'valoresPromedioGlobal',
    afterDatasetsDraw: (chart: any) => {
      const ctx = chart.ctx
      chart.data.datasets.forEach((dataset: any, datasetIndex: number) => {
        const meta = chart.getDatasetMeta(datasetIndex)
        if (meta.hidden) {
          return
        }
        meta.data.forEach((bar: any, index: number) => {
          const valor = dataset.data[index]
          if (valor !== null && valor !== undefined) {
            const x = bar.x
            const y = bar.y
            ctx.save()
            ctx.textAlign = 'center'
            ctx.textBaseline = 'bottom'
            ctx.fillStyle = '#374151'
            ctx.font = 'bold 12px Arial'
            ctx.fillText(
              valor.toFixed(2),
              x,
              y - 5
            )
            ctx.restore()
          }
        })
      })
    }
  }), [])

  // Configuración del gráfico de línea de promedio global
  const opcionesGraficoLinealPromedioGlobal = useMemo(() => {
    const todosLosValores: number[] = []
    datosGraficoLinealPromedioGlobal.datasets.forEach((dataset: any) => {
      dataset.data.forEach((valor: any) => {
        if (valor !== null && valor !== undefined && !isNaN(valor)) {
          todosLosValores.push(valor)
        }
      })
    })
    
    const rango = calcularRangoAmigable(todosLosValores)
    
    return {
      responsive: true,
      maintainAspectRatio: false,
      layout: {
        padding: {
          left: 10,
          right: 10,
          top: 5,
          bottom: 5
        }
      },
      plugins: {
        legend: {
          position: 'bottom' as const,
          labels: {
            usePointStyle: true,
            padding: 10,
            font: {
              size: 11
            }
          }
        },
        title: {
          display: true,
          text: 'Promedio Global de Puntaje por Mes',
          font: {
            size: 16,
            weight: 'bold' as const
          },
          padding: {
            top: 8,
            bottom: 12
          }
        },
        tooltip: {
          mode: 'index' as const,
          intersect: false,
          backgroundColor: 'rgba(15, 23, 42, 0.95)',
          titleColor: '#60A5FA',
          titleFont: {
            size: 14,
            weight: 'bold' as const
          },
          bodyColor: '#E2E8F0',
          bodyFont: {
            size: 12
          },
          borderColor: '#3B82F6',
          borderWidth: 2,
          cornerRadius: 12,
          padding: 16,
          displayColors: true,
          boxPadding: 8,
          usePointStyle: true,
          callbacks: {
            title: function(contexts: any[]) {
              if (contexts.length > 0) {
                const mes = datosGraficoLinealPromedioGlobal.labels[contexts[0].dataIndex]
                return `📅 ${mes}`
              }
              return ''
            },
            label: function(context: any) {
              const valor = context.parsed.y
              if (valor === null || valor === undefined) {
                return `  ⚠️  Sin datos`
              }
              
              const chartData = datosGraficoLinealPromedioGlobal as any
              const dataset = context.dataset
              const idEvaluacion = dataset.idEvaluacion
              const dataIndex = context.dataIndex
              const mesesOrdenados = chartData.mesesOrdenados || []
              const totalEstudiantesPorEvaluacion = chartData.totalEstudiantesPorEvaluacion || new Map()
              
              let totalEstudiantesText = ''
              if (idEvaluacion && mesesOrdenados[dataIndex] !== undefined) {
                const coleccion = mesesOrdenados[dataIndex]
                const totalEstudiantesMap = totalEstudiantesPorEvaluacion.get(idEvaluacion)
                const totalEstudiantes = totalEstudiantesMap?.get(coleccion)
                if (totalEstudiantes !== undefined && totalEstudiantes !== null) {
                  totalEstudiantesText = ` | 👥 ${totalEstudiantes} estudiantes`
                }
              }
              
              return `  ✓  ${valor.toFixed(2)} puntos${totalEstudiantesText}`
            },
            labelColor: function(context: any) {
              return {
                borderColor: context.dataset.borderColor,
                backgroundColor: context.dataset.backgroundColor,
                borderWidth: 3,
                borderRadius: 4
              }
            },
            afterBody: function(contexts: any[]) {
              if (contexts.length === 0) return ''
              
              const total = contexts.reduce((sum, ctx) => {
                const valor = ctx.parsed.y
                return sum + (valor !== null && valor !== undefined ? valor : 0)
              }, 0)
              const promedio = total / contexts.length
              
              return [
                '',
                '━━━━━━━━━━━━━━━━━━━━',
                `📈 Promedio: ${promedio.toFixed(2)} puntos`,
                `📋 Evaluaciones: ${contexts.length}`
              ]
            },
            footer: function() {
              return ''
            }
          }
        }
      },
      scales: {
        y: {
          beginAtZero: rango.min === 0,
          min: rango.min,
          max: rango.max,
          title: {
            display: true,
            text: 'Promedio de Puntaje',
            font: {
              size: 12,
              weight: 'bold' as const
            },
            color: '#4B5563'
          },
          ticks: {
            stepSize: undefined,
            color: '#6B7280',
            font: {
              size: 11
            },
            padding: 8
          },
          grid: {
            color: 'rgba(0, 0, 0, 0.08)',
            drawBorder: false,
            lineWidth: 1
          }
        },
        x: {
          offset: true,
          title: {
            display: true,
            text: 'Meses',
            font: {
              size: 12,
              weight: 'bold' as const
            },
            color: '#4B5563'
          },
          ticks: {
            color: '#6B7280',
            font: {
              size: 11
            },
            padding: 10
          },
          grid: {
            display: false
          }
        }
      }
    }
  }, [datosGraficoLinealPromedioGlobal])

  // Configuración del gráfico de promedio global (barras)
  const opcionesGraficoPromedioGlobal = useMemo(() => {
    const todosLosValores: number[] = []
    datosGraficoPromedioGlobal.datasets.forEach((dataset: any) => {
      dataset.data.forEach((valor: any) => {
        if (valor !== null && valor !== undefined && !isNaN(valor)) {
          todosLosValores.push(valor)
        }
      })
    })
    
    const rango = calcularRangoAmigable(todosLosValores)
    
    return {
      responsive: true,
      maintainAspectRatio: false,
      layout: {
        padding: {
          left: 10,
          right: 10,
          top: 5,
          bottom: 5
        }
      },
      animation: {
        duration: 1000,
        easing: 'easeOutQuart' as const
      },
      plugins: {
        legend: {
          position: 'bottom' as const,
          labels: {
            usePointStyle: true,
            padding: 10,
            font: {
              size: 11
            }
          }
        },
        title: {
          display: true,
          text: 'Promedio Global de Puntaje por Mes (Barras)',
          font: {
            size: 16,
            weight: 'bold' as const
          },
          padding: {
            top: 8,
            bottom: 12
          }
        },
        tooltip: {
          mode: 'index' as const,
          intersect: false,
          backgroundColor: 'rgba(15, 23, 42, 0.95)',
          titleColor: '#60A5FA',
          titleFont: {
            size: 14,
            weight: 'bold' as const
          },
          bodyColor: '#E2E8F0',
          bodyFont: {
            size: 12
          },
          borderColor: '#3B82F6',
          borderWidth: 2,
          cornerRadius: 12,
          padding: 16,
          displayColors: true,
          boxPadding: 8,
          usePointStyle: true,
          filter: function(context: any) {
            return context.parsed.y !== null && context.parsed.y !== undefined
          },
          callbacks: {
            title: function(contexts: any[]) {
              if (contexts.length > 0) {
                const mes = datosGraficoPromedioGlobal.labels[contexts[0].dataIndex]
                return `📅 ${mes}`
              }
              return ''
            },
            label: function(context: any) {
              const valor = context.parsed.y
              if (valor === null || valor === undefined) {
                return
              }
              
              const chartData = datosGraficoPromedioGlobal as any
              const dataset = context.dataset
              const idEvaluacion = dataset.idEvaluacion
              const dataIndex = context.dataIndex
              const mesesOrdenados = chartData.mesesOrdenados || []
              const totalEstudiantesPorEvaluacion = chartData.totalEstudiantesPorEvaluacion || new Map()
              
              let totalEstudiantesText = ''
              if (idEvaluacion && mesesOrdenados[dataIndex] !== undefined) {
                const coleccion = mesesOrdenados[dataIndex]
                const totalEstudiantesMap = totalEstudiantesPorEvaluacion.get(idEvaluacion)
                const totalEstudiantes = totalEstudiantesMap?.get(coleccion)
                if (totalEstudiantes !== undefined && totalEstudiantes !== null) {
                  totalEstudiantesText = ` | 👥 ${totalEstudiantes} estudiantes`
                }
              }
              
              return `  ✓  ${valor.toFixed(2)} puntos${totalEstudiantesText}`
            },
            labelColor: function(context: any) {
              return {
                borderColor: context.dataset.borderColor,
                backgroundColor: context.dataset.backgroundColor,
                borderWidth: 3,
                borderRadius: 4
              }
            }
          }
        }
      },
      scales: {
        y: {
          beginAtZero: rango.min === 0,
          min: rango.min,
          max: rango.max,
          title: {
            display: true,
            text: 'Promedio de Puntaje',
            font: {
              size: 12,
              weight: 'bold' as const
            },
            color: '#4B5563'
          },
          ticks: {
            stepSize: undefined,
            color: '#6B7280',
            font: {
              size: 11
            },
            padding: 8
          },
          grid: {
            color: 'rgba(0, 0, 0, 0.08)',
            drawBorder: false,
            lineWidth: 1
          }
        },
        x: {
          title: {
            display: true,
            text: 'Meses',
            font: {
              size: 12,
              weight: 'bold' as const
            },
            color: '#4B5563'
          },
          ticks: {
            color: '#6B7280',
            font: {
              size: 11
            },
            padding: 10
          },
          grid: {
            display: false
          }
        }
      }
    }
  }, [datosGraficoPromedioGlobal])

  // Calcular datos para la tabla de detalles
  const datosTablaBase = useMemo(() => {
    const todasLasFilas: any[] = []
    
    evaluacionesSeleccionadasFiltradas.forEach(evaluacion => {
      const idEvaluacion = evaluacion.id || ''
      const coleccionesEvaluacion = coleccionesPorEvaluacion.get(idEvaluacion) || []
      const coleccionesSeleccionadasEvaluacion = coleccionesSeleccionadas.get(idEvaluacion) || new Set<number>()
      const coleccionesOrdenadas = Array.from(coleccionesSeleccionadasEvaluacion).sort((a, b) => a - b)
      
      coleccionesOrdenadas.forEach((coleccionNum) => {
        const item = coleccionesEvaluacion.find((item: any) => {
          const num = typeof item.coleccion === 'number' ? item.coleccion : parseInt(item.coleccion, 10)
          return num === coleccionNum
        })
        
        if (!item) return
        
        const nivelesData = item.data || []
        const nivelesMap = new Map<string, number>()
        nivelesData.forEach((nivel: any) => {
          if (nivel && nivel.nivel && nivel.cantidadDeEstudiantes !== undefined) {
            const nivelNormalizado = normalizarNivel(nivel.nivel)
            nivelesMap.set(nivelNormalizado, nivel.cantidadDeEstudiantes)
          }
        })
        
        const datosActuales = {
          evaluacion: evaluacion.nombre || 'Sin nombre',
          idEvaluacion: idEvaluacion,
          mes: obtenerNombreMes(coleccionNum),
          coleccionNum: coleccionNum,
          totalEstudiantes: item.totalEstudiantes || 0,
          promedioGlobal: item.promedioGlobal || 0,
          previoAlInicio: nivelesMap.get('Previo al inicio') || 0,
          enInicio: nivelesMap.get('En inicio') || 0,
          enProceso: nivelesMap.get('En proceso') || 0,
          satisfactorio: nivelesMap.get('Satisfactorio') || 0
        }
        
        todasLasFilas.push(datosActuales)
      })
    })
    
    return todasLasFilas
  }, [evaluacionesSeleccionadasFiltradas, coleccionesPorEvaluacion, coleccionesSeleccionadas])

  // Aplicar el orden reordenado y calcular métricas
  const datosTabla = useMemo(() => {
    const filasParaCalcular = ordenFilas.length === 0 || ordenFilas.length !== datosTablaBase.length
      ? datosTablaBase
      : ordenFilas.map(index => datosTablaBase[index])
    
    return filasParaCalcular.map((datosActuales, index) => {
      let crecimientoPromedio = null
      let porcentajeCambioPromedio = null
      let cambioSatisfactorio = null
      let porcentajeCambioSatisfactorio = null
      let cambioPrevioAlInicio = null
      let porcentajeCambioPrevioAlInicio = null
      let tasaMejora = null
      
      let datosAnteriores = null
      
      if (modoComparacion === 'evaluacion-a-evaluacion' && index > 0) {
        datosAnteriores = filasParaCalcular[index - 1]
      } else if (modoComparacion === 'mes-a-mes') {
        for (let i = index - 1; i >= 0; i--) {
          if (filasParaCalcular[i].idEvaluacion === datosActuales.idEvaluacion) {
            datosAnteriores = filasParaCalcular[i]
            break
          }
        }
      }
      
      if (datosAnteriores) {
        const promedioAnterior = datosAnteriores.promedioGlobal
        const promedioActual = datosActuales.promedioGlobal
        crecimientoPromedio = promedioActual - promedioAnterior
        porcentajeCambioPromedio = promedioAnterior > 0 
          ? ((crecimientoPromedio / promedioAnterior) * 100) 
          : 0
        
        const satisfactorioAnterior = datosAnteriores.satisfactorio
        const satisfactorioActual = datosActuales.satisfactorio
        cambioSatisfactorio = satisfactorioActual - satisfactorioAnterior
        const totalAnterior = datosAnteriores.totalEstudiantes
        porcentajeCambioSatisfactorio = totalAnterior > 0
          ? ((cambioSatisfactorio / totalAnterior) * 100)
          : 0
        
        const previoAnterior = datosAnteriores.previoAlInicio
        const previoActual = datosActuales.previoAlInicio
        cambioPrevioAlInicio = previoActual - previoAnterior
        porcentajeCambioPrevioAlInicio = totalAnterior > 0
          ? ((cambioPrevioAlInicio / totalAnterior) * 100)
          : 0
        
        const nivelesAltosAnterior = datosAnteriores.satisfactorio + datosAnteriores.enProceso
        const nivelesBajosAnterior = datosAnteriores.previoAlInicio + datosAnteriores.enInicio
        const nivelesAltosActual = datosActuales.satisfactorio + datosActuales.enProceso
        const nivelesBajosActual = datosActuales.previoAlInicio + datosActuales.enInicio
        
        const mejoraNivelesAltos = nivelesAltosActual - nivelesAltosAnterior
        const mejoraNivelesBajos = nivelesBajosActual - nivelesBajosAnterior
        tasaMejora = mejoraNivelesAltos - mejoraNivelesBajos
      }
      
      return {
        ...datosActuales,
        crecimientoPromedio,
        porcentajeCambioPromedio,
        cambioSatisfactorio,
        porcentajeCambioSatisfactorio,
        cambioPrevioAlInicio,
        porcentajeCambioPrevioAlInicio,
        tasaMejora
      }
    })
  }, [datosTablaBase, ordenFilas, modoComparacion])

  // Inicializar el orden de las filas
  useEffect(() => {
    if (datosTablaBase.length > 0) {
      if (ordenFilas.length !== datosTablaBase.length) {
        setOrdenFilas(datosTablaBase.map((_, index) => index))
      }
    } else {
      setOrdenFilas([])
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [datosTablaBase.length])

  // Filas ordenadas
  const filasOrdenadas = useMemo(() => {
    return datosTabla
  }, [datosTabla])

  // Funciones para drag and drop
  const handleDragStart = (e: React.DragEvent<HTMLTableRowElement>, indexOrdenado: number) => {
    setFilaArrastrando(indexOrdenado)
    e.dataTransfer.effectAllowed = 'move'
    e.currentTarget.style.opacity = '0.5'
  }

  const handleDragEnd = (e: React.DragEvent<HTMLTableRowElement>) => {
    e.currentTarget.style.opacity = '1'
    setFilaArrastrando(null)
  }

  const handleDragOver = (e: React.DragEvent<HTMLTableRowElement>) => {
    e.preventDefault()
    e.dataTransfer.dropEffect = 'move'
  }

  const handleDrop = (e: React.DragEvent<HTMLTableRowElement>, indexDestinoOrdenado: number) => {
    e.preventDefault()
    
    if (filaArrastrando === null || filaArrastrando === indexDestinoOrdenado) {
      return
    }

    const nuevoOrden = [...ordenFilas]
    const [elementoMovido] = nuevoOrden.splice(filaArrastrando, 1)
    nuevoOrden.splice(indexDestinoOrdenado, 0, elementoMovido)

    setOrdenFilas(nuevoOrden)
    setFilaArrastrando(null)
  }

  // Clase CSS para el número de columnas
  const chartsGridClass = vistaColumnas === 1 
    ? `${styles.chartsGrid} ${styles.chartsGrid1Cols}`
    : vistaColumnas === 2
    ? `${styles.chartsGrid} ${styles.chartsGrid2Cols}`
    : `${styles.chartsGrid} ${styles.chartsGrid3Cols}`

  return (
    <div className={styles.wrapper}>
      <div className={chartsGridClass}>
        {/* Panel principal - Gráfico Lineal */}
        <div className={styles.chartContainer}>
          <div className={styles.chartWrapper}>
            <Line data={datosGrafico} options={opcionesGrafico} />
          </div>
        </div>

        {/* Gráfico de Barras */}
        <div className={styles.chartContainer}>
          <div className={styles.chartWrapper}>
            <Bar data={datosGraficoBarras} options={opcionesGraficoBarras} plugins={[pluginValoresBarras]} />
          </div>
        </div>

        {/* Gráfico de Promedio Global (Barras) */}
        <div className={styles.chartContainer}>
          <div className={styles.chartWrapper}>
            <Bar data={datosGraficoPromedioGlobal} options={opcionesGraficoPromedioGlobal} plugins={[pluginValoresPromedioGlobal]} />
          </div>
        </div>

        {/* Gráfico de Promedio Global (Línea) */}
        <div className={styles.chartContainer}>
          <div className={styles.chartWrapper}>
            <Line data={datosGraficoLinealPromedioGlobal} options={opcionesGraficoLinealPromedioGlobal} />
          </div>
        </div>
      </div>

      {/* Tabla de datos detallados */}
      <div className={styles.tableContainer}>
        <h3 className={styles.tableTitle}>
          Tabla de Datos Detallados
        </h3>
        <div className={styles.tableScrollContainer}>
          <table className={styles.table} style={{ minWidth: '700px' }}>
            <thead>
              <tr className={styles.tableHeader}>
                <th className={`${styles.tableHeaderCell} ${styles.tableHeaderCellCenter}`}>
                  <span className={styles.srOnly}>Ordenar</span>
                </th>
                <th className={`${styles.tableHeaderCell} ${styles.tableHeaderCellLeft}`} style={{ minWidth: '100px' }}>
                  Evaluación
                </th>
                <th className={styles.tableHeaderCell}>
                  Mes
                </th>
                <th className={styles.tableHeaderCell}>
                  Total Estudiantes
                </th>
                <th className={styles.tableHeaderCell}>
                  Promedio Global
                </th>
                <th className={styles.tableHeaderCell}>
                  Previo al Inicio
                </th>
                <th className={styles.tableHeaderCell}>
                  En Inicio
                </th>
                <th className={styles.tableHeaderCell}>
                  En Proceso
                </th>
                <th className={styles.tableHeaderCell}>
                  Satisfactorio
                </th>
                <th 
                  className={`${styles.tableHeaderCell} ${styles.tableHeaderCellHelp}`}
                  style={{ borderLeft: '2px solid #9ca3af' }}
                  onMouseEnter={(e) => {
                    const rect = e.currentTarget.getBoundingClientRect()
                    setTooltipPosition({ x: rect.left + rect.width / 2, y: rect.top })
                    setTooltipVisible('crecimiento-promedio')
                  }}
                  onMouseLeave={() => setTooltipVisible(null)}
                  title="Crecimiento Promedio"
                >
                  <div className={styles.tableHeaderCellContent}>
                    <span>Cr. Prom.</span>
                    <svg className={styles.tableHeaderCellIcon} fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-8-3a1 1 0 00-.867.5 1 1 0 11-1.731-1A3 3 0 0113 8a3.001 3.001 0 01-2 2.83V11a1 1 0 11-2 0v-1a1 1 0 011-1 1 1 0 100-2zm0 8a1 1 0 100-2 1 1 0 000 2z" clipRule="evenodd" />
                    </svg>
                  </div>
                </th>
                <th 
                  className={`${styles.tableHeaderCell} ${styles.tableHeaderCellHelp}`}
                  onMouseEnter={(e) => {
                    const rect = e.currentTarget.getBoundingClientRect()
                    setTooltipPosition({ x: rect.left + rect.width / 2, y: rect.top })
                    setTooltipVisible('cambio-promedio')
                  }}
                  onMouseLeave={() => setTooltipVisible(null)}
                  title="% Cambio Promedio"
                >
                  <div className={styles.tableHeaderCellContent}>
                    <span>% Camb.</span>
                    <svg className={styles.tableHeaderCellIcon} fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-8-3a1 1 0 00-.867.5 1 1 0 11-1.731-1A3 3 0 0113 8a3.001 3.001 0 01-2 2.83V11a1 1 0 11-2 0v-1a1 1 0 011-1 1 1 0 100-2zm0 8a1 1 0 100-2 1 1 0 000 2z" clipRule="evenodd" />
                    </svg>
                  </div>
                </th>
                <th 
                  className={`${styles.tableHeaderCell} ${styles.tableHeaderCellHelp}`}
                  onMouseEnter={(e) => {
                    const rect = e.currentTarget.getBoundingClientRect()
                    setTooltipPosition({ x: rect.left + rect.width / 2, y: rect.top })
                    setTooltipVisible('cambio-satisfactorio')
                  }}
                  onMouseLeave={() => setTooltipVisible(null)}
                  title="Cambio Satisfactorio"
                >
                  <div className={styles.tableHeaderCellContent}>
                    <span>Camb. Sat.</span>
                    <svg className={styles.tableHeaderCellIcon} fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-8-3a1 1 0 00-.867.5 1 1 0 11-1.731-1A3 3 0 0113 8a3.001 3.001 0 01-2 2.83V11a1 1 0 11-2 0v-1a1 1 0 011-1 1 1 0 100-2zm0 8a1 1 0 100-2 1 1 0 000 2z" clipRule="evenodd" />
                    </svg>
                  </div>
                </th>
                <th 
                  className={`${styles.tableHeaderCell} ${styles.tableHeaderCellHelp}`}
                  onMouseEnter={(e) => {
                    const rect = e.currentTarget.getBoundingClientRect()
                    setTooltipPosition({ x: rect.left + rect.width / 2, y: rect.top })
                    setTooltipVisible('cambio-previo')
                  }}
                  onMouseLeave={() => setTooltipVisible(null)}
                  title="Cambio Previo al Inicio"
                >
                  <div className={styles.tableHeaderCellContent}>
                    <span>Camb. Prev.</span>
                    <svg className={styles.tableHeaderCellIcon} fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-8-3a1 1 0 00-.867.5 1 1 0 11-1.731-1A3 3 0 0113 8a3.001 3.001 0 01-2 2.83V11a1 1 0 11-2 0v-1a1 1 0 011-1 1 1 0 100-2zm0 8a1 1 0 100-2 1 1 0 000 2z" clipRule="evenodd" />
                    </svg>
                  </div>
                </th>
                <th 
                  className={`${styles.tableHeaderCell} ${styles.tableHeaderCellHelp}`}
                  onMouseEnter={(e) => {
                    const rect = e.currentTarget.getBoundingClientRect()
                    setTooltipPosition({ x: rect.left + rect.width / 2, y: rect.top })
                    setTooltipVisible('tasa-mejora')
                  }}
                  onMouseLeave={() => setTooltipVisible(null)}
                  title="Tasa de Mejora"
                >
                  <div className={styles.tableHeaderCellContent}>
                    <span>Tasa Mej.</span>
                    <svg className={styles.tableHeaderCellIcon} fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-8-3a1 1 0 00-.867.5 1 1 0 11-1.731-1A3 3 0 0113 8a3.001 3.001 0 01-2 2.83V11a1 1 0 11-2 0v-1a1 1 0 011-1 1 1 0 100-2zm0 8a1 1 0 100-2 1 1 0 000 2z" clipRule="evenodd" />
                    </svg>
                  </div>
                </th>
              </tr>
            </thead>
            <tbody>
              {filasOrdenadas?.length > 0 ? (
                filasOrdenadas.map((fila, index) => (
                  <tr
                    key={`${fila.evaluacion}-${fila.mes}-${fila.coleccionNum}`}
                    draggable
                    onDragStart={(e) => handleDragStart(e, index)}
                    onDragEnd={handleDragEnd}
                    onDragOver={handleDragOver}
                    onDrop={(e) => handleDrop(e, index)}
                    className={`${styles.tableRow} ${filaArrastrando === index ? styles.tableRowDragging : ''}`}
                  >
                    <td className={`${styles.tableCell} ${styles.tableCellDrag}`}>
                      <svg
                        className={styles.tableCellDragIcon}
                        fill="currentColor"
                        viewBox="0 0 20 20"
                        xmlns="http://www.w3.org/2000/svg"
                      >
                        <path d="M7 2a2 2 0 1 1 0 4 2 2 0 0 1 0-4zM7 8a2 2 0 1 1 0 4 2 2 0 0 1 0-4zM7 14a2 2 0 1 1 0 4 2 2 0 0 1 0-4zM13 2a2 2 0 1 1 0 4 2 2 0 0 1 0-4zM13 8a2 2 0 1 1 0 4 2 2 0 0 1 0-4zM13 14a2 2 0 1 1 0 4 2 2 0 0 1 0-4z" />
                      </svg>
                    </td>
                    <td className={`${styles.tableCell} ${styles.tableCellLeft} ${styles.tableCellEvaluation}`}>{fila.evaluacion}</td>
                    <td className={`${styles.tableCell} ${styles.tableCellCenter}`}>{fila.mes}</td>
                    <td className={`${styles.tableCell} ${styles.tableCellCenter}`}>
                      {fila.totalEstudiantes}
                    </td>
                    <td className={`${styles.tableCell} ${styles.tableCellCenter}`}>
                      {fila.promedioGlobal.toFixed(2)}
                    </td>
                    <td className={`${styles.tableCell} ${styles.tableCellCenter}`}>
                      {fila.previoAlInicio}
                    </td>
                    <td className={`${styles.tableCell} ${styles.tableCellCenter}`}>
                      {fila.enInicio}
                    </td>
                    <td className={`${styles.tableCell} ${styles.tableCellCenter}`}>
                      {fila.enProceso}
                    </td>
                    <td className={`${styles.tableCell} ${styles.tableCellCenter}`}>
                      {fila.satisfactorio}
                    </td>
                    {/* Métricas de crecimiento */}
                    <td className={`${styles.tableCell} ${styles.tableCellMetric} ${
                      fila.crecimientoPromedio === null 
                        ? styles.tableCellMetricNull
                        : fila.crecimientoPromedio >= 0 
                          ? styles.tableCellMetricPositive
                          : styles.tableCellMetricNegative
                    }`}>
                      {fila.crecimientoPromedio === null 
                        ? '-' 
                        : `${fila.crecimientoPromedio >= 0 ? '+' : ''}${fila.crecimientoPromedio.toFixed(2)}`
                      }
                    </td>
                    <td className={`${styles.tableCell} ${styles.tableCellMetric} ${
                      fila.porcentajeCambioPromedio === null 
                        ? styles.tableCellMetricNull
                        : fila.porcentajeCambioPromedio >= 0 
                          ? styles.tableCellMetricPositive
                          : styles.tableCellMetricNegative
                    }`}>
                      {fila.porcentajeCambioPromedio === null 
                        ? '-' 
                        : `${fila.porcentajeCambioPromedio >= 0 ? '+' : ''}${fila.porcentajeCambioPromedio.toFixed(2)}%`
                      }
                    </td>
                    <td className={`${styles.tableCell} ${styles.tableCellMetric} ${
                      fila.cambioSatisfactorio === null 
                        ? styles.tableCellMetricNull
                        : fila.cambioSatisfactorio >= 0 
                          ? styles.tableCellMetricPositive
                          : styles.tableCellMetricNegative
                    }`}>
                      {fila.cambioSatisfactorio === null 
                        ? '-' 
                        : `${fila.cambioSatisfactorio >= 0 ? '+' : ''}${fila.cambioSatisfactorio}`
                      }
                    </td>
                    <td className={`${styles.tableCell} ${styles.tableCellMetric} ${
                      fila.cambioPrevioAlInicio === null 
                        ? styles.tableCellMetricNull
                        : fila.cambioPrevioAlInicio <= 0 
                          ? styles.tableCellMetricPositive
                          : styles.tableCellMetricNegative
                    }`}>
                      {fila.cambioPrevioAlInicio === null 
                        ? '-' 
                        : `${fila.cambioPrevioAlInicio >= 0 ? '+' : ''}${fila.cambioPrevioAlInicio}`
                      }
                      {fila.cambioPrevioAlInicio !== null && (
                        <span className={styles.tableCellMetricSubtext}>
                          ({fila.porcentajeCambioPrevioAlInicio >= 0 ? '+' : ''}{fila.porcentajeCambioPrevioAlInicio.toFixed(1)}%)
                        </span>
                      )}
                    </td>
                    <td className={`${styles.tableCell} ${styles.tableCellMetric} ${
                      fila.tasaMejora === null 
                        ? styles.tableCellMetricNull
                        : fila.tasaMejora >= 0 
                          ? styles.tableCellMetricPositive
                          : styles.tableCellMetricNegative
                    }`}>
                      {fila.tasaMejora === null 
                        ? '-' 
                        : `${fila.tasaMejora >= 0 ? '+' : ''}${fila.tasaMejora}`
                      }
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={14} className={styles.tableCellEmpty}>
                    No hay datos disponibles. Selecciona evaluaciones y meses para ver los datos.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Tooltip flotante para las columnas de métricas */}
      {tooltipVisible && tooltipPosition && (
        <div
          className={styles.tooltip}
          style={{
            left: `${tooltipPosition.x}px`,
            top: `${tooltipPosition.y - 10}px`
          }}
        >
          {tooltipVisible === 'crecimiento-promedio' && (
            <>
              <div className={styles.tooltipTitle}>Crecimiento del Promedio Global</div>
              <div className={styles.tooltipText}>Diferencia absoluta en puntos del promedio global entre el período anterior y el actual.</div>
              <div className={styles.tooltipDivider}>
                <div className={`${styles.tooltipItem} ${styles.tooltipItemPositive}`}>✓ Positivo = Mejora</div>
                <div className={`${styles.tooltipItem} ${styles.tooltipItemNegative}`}>✗ Negativo = Retroceso</div>
              </div>
            </>
          )}
          {tooltipVisible === 'cambio-promedio' && (
            <>
              <div className={styles.tooltipTitle}>Porcentaje de Cambio del Promedio</div>
              <div className={styles.tooltipText}>Porcentaje de variación del promedio global respecto al período anterior.</div>
              <div className={styles.tooltipDivider}>
                <div className={`${styles.tooltipItem} ${styles.tooltipItemPositive}`}>✓ +5% o más = Mejora significativa</div>
                <div className={`${styles.tooltipItem} ${styles.tooltipItemNeutral}`}>○ -5% a +5% = Cambio moderado</div>
                <div className={`${styles.tooltipItem} ${styles.tooltipItemNegative}`}>✗ Menos de -5% = Retroceso</div>
              </div>
            </>
          )}
          {tooltipVisible === 'cambio-satisfactorio' && (
            <>
              <div className={styles.tooltipTitle}>Cambio en Satisfactorio</div>
              <div className={styles.tooltipText}>Diferencia en el número de estudiantes que alcanzaron el nivel &quot;Satisfactorio&quot; (el más alto).</div>
              <div className={styles.tooltipDivider}>
                <div className={`${styles.tooltipItem} ${styles.tooltipItemPositive}`}>✓ Positivo = Más estudiantes alcanzaron el nivel más alto</div>
                <div className={`${styles.tooltipItem} ${styles.tooltipItemNegative}`}>✗ Negativo = Menos estudiantes en el nivel más alto</div>
              </div>
            </>
          )}
          {tooltipVisible === 'cambio-previo' && (
            <>
              <div className={styles.tooltipTitle}>Cambio en Previo al Inicio</div>
              <div className={styles.tooltipText}>Diferencia en el número de estudiantes en el nivel más bajo (&quot;Previo al Inicio&quot;).</div>
              <div className={styles.tooltipDivider}>
                <div className={`${styles.tooltipItem} ${styles.tooltipItemPositive}`}>✓ Negativo = Mejora (menos estudiantes en nivel bajo)</div>
                <div className={`${styles.tooltipItem} ${styles.tooltipItemNegative}`}>✗ Positivo = Retroceso (más estudiantes en nivel bajo)</div>
                <div className={styles.tooltipItemSmall}>Nota: Un valor negativo aquí es bueno</div>
              </div>
            </>
          )}
          {tooltipVisible === 'tasa-mejora' && (
            <>
              <div className={styles.tooltipTitle}>Tasa de Mejora</div>
              <div className={styles.tooltipText}>Movimiento neto de estudiantes desde niveles bajos hacia niveles altos.</div>
              <div className={styles.tooltipDivider}>
                <div className={styles.tooltipItemSmall}>Cálculo:</div>
                <div className={styles.tooltipItemSmallText}>(Satisfactorio + En Proceso) - (Previo al Inicio + En Inicio)</div>
                <div className={`${styles.tooltipItem} ${styles.tooltipItemPositive}`}>✓ Positivo = Mejora general del grupo</div>
                <div className={`${styles.tooltipItem} ${styles.tooltipItemNegative}`}>✗ Negativo = Retroceso general del grupo</div>
              </div>
            </>
          )}
          <div className={styles.tooltipArrow}></div>
        </div>
      )}
    </div>
  )
}

export default GraficosYTablas
