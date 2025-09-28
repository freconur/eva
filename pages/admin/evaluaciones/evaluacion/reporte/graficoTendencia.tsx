import React, { useEffect } from 'react'
import { useReporteEspecialistas } from '@/features/hooks/useReporteEspecialistas'
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
import { useGlobalContext } from '@/features/context/GlolbalContext'
import Loader from '@/components/loader/loader'

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

interface GraficoTendenciaProps {
  rangoMesAplicado: number[]
  idEvaluacion: string,
  monthSelected: number
}

const GraficoTendencia = ({ rangoMesAplicado, idEvaluacion, monthSelected }: GraficoTendenciaProps) => {
  const { getDataParaGraficoTendencia } = useReporteEspecialistas()
  const { dataGraficoTendencia, dataGraficoTendenciaNiveles, loaderGraficos } = useGlobalContext()

  useEffect(() => {
    // Solo obtener datos cuando se aplique el rango y haya datos válidos
    if (rangoMesAplicado && rangoMesAplicado.length > 0) {
      getDataParaGraficoTendencia(rangoMesAplicado, idEvaluacion)
    }
  }, [rangoMesAplicado, idEvaluacion])

  // Configuración del gráfico de líneas original (promedios)
  const opcionesGrafico = {
    responsive: true,
    plugins: {
      legend: {
        position: 'top' as const,
        labels: {
          color: '#333',
          font: {
            size: 14
          }
        }
      },
      title: {
        display: true,
        text: 'Gráfico de tendencia por puntaje promedio',
        color: '#333',
        font: {
          size: 18
        }
      },
      tooltip: {
        backgroundColor: 'rgba(0, 0, 0, 0.8)',
        titleColor: '#fff',
        bodyColor: '#fff',
        borderColor: '#666',
        borderWidth: 1,
        cornerRadius: 8,
        displayColors: false,
        callbacks: {
          label: function(context: any) {
            return `Puntaje: ${context.parsed.y.toFixed(1)}`;
          }
        }
      }
    },
    scales: {
      x: {
        title: {
          display: true,
          text: 'Mes',
          color: '#333',
          font: {
            size: 14
          }
        },
        grid: {
          color: 'rgba(0, 0, 0, 0.1)',
          drawBorder: false
        },
        ticks: {
          color: '#666',
          font: {
            size: 12
          }
        }
      },
      y: {
        title: {
          display: true,
          text: 'Puntaje Promedio',
          color: '#333',
          font: {
            size: 14
          }
        },
        grid: {
          color: 'rgba(0, 0, 0, 0.1)',
          drawBorder: false
        },
        ticks: {
          color: '#666',
          font: {
            size: 12
          }
        }
      }
    },
    elements: {
      point: {
        radius: 5,
        hoverRadius: 7,
        backgroundColor: '#4F46E5',
        borderColor: '#fff',
        borderWidth: 2
      },
      line: {
        tension: 0,
        borderWidth: 2
      }
    },
    interaction: {
      intersect: false,
      mode: 'index' as const
    }
  }
  // Configuración del gráfico de líneas para niveles
  const opcionesGraficoNiveles = {
    responsive: true,
    plugins: {
      legend: {
        position: 'top' as const,
        labels: {
          color: '#333',
          font: {
            size: 14
          }
        }
      },
      title: {
        display: true,
        text: 'Gráfico de tendencia por nivel de rendimiento',
        color: '#333',
        font: {
          size: 18
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
            return `${context.dataset.label}: ${context.parsed.y} estudiantes`;
          }
        }
      }
    },
    scales: {
      x: {
        title: {
          display: true,
          text: 'Niveles de Rendimiento',
          color: '#333',
          font: {
            size: 14
          }
        },
        grid: {
          color: 'rgba(0, 0, 0, 0.1)',
          drawBorder: false
        },
        ticks: {
          color: '#666',
          font: {
            size: 12
          }
        }
      },
      y: {
        title: {
          display: true,
          text: 'Cantidad de Estudiantes',
          color: '#333',
          font: {
            size: 14
          }
        },
        grid: {
          color: 'rgba(0, 0, 0, 0.1)',
          drawBorder: false
        },
        ticks: {
          color: '#666',
          font: {
            size: 12
          },
          min: 0
        }
      }
    },
    elements: {
      point: {
        radius: 5,
        hoverRadius: 7,
        borderColor: '#fff',
        borderWidth: 2
      },
      line: {
        tension: 0,
        borderWidth: 3
      }
    },
    interaction: {
      intersect: false,
      mode: 'index' as const
    }
  }

  // Datos del gráfico de líneas original (promedios)
  const datosChart = {
    labels: dataGraficoTendencia.map(item => {
      const nombresMeses = [
        'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
        'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
      ]
      return nombresMeses[item.mes] || `Mes ${item.mes}`
    }),
    datasets: [
      {
        label: 'Puntaje Promedio',
        data: dataGraficoTendencia.map(item => item.puntajeMedia),
        borderColor: '#4F46E5',
        backgroundColor: 'rgba(79, 70, 229, 0.1)',
        fill: false,
        tension: 0,
        pointBackgroundColor: '#4F46E5',
        pointBorderColor: '#fff',
        pointBorderWidth: 2,
        pointRadius: 5,
        pointHoverRadius: 7,
        borderWidth: 2,
        pointHoverBackgroundColor: '#6366F1',
        pointHoverBorderColor: '#fff'
      }
    ]
  }

  // Datos del gráfico de líneas para niveles (niveles en eje X)
  const datosChartNiveles = {
    labels: ['Previo al Inicio', 'En Inicio', 'En Proceso', 'Satisfactorio'],
    datasets: dataGraficoTendenciaNiveles.map((item, index) => {
      const nombresMeses = [
        'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
        'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
      ]
      const mesNombre = nombresMeses[item.mes] || `Mes ${item.mes}`
      
      return {
        label: mesNombre,
        data: [
          item.niveles.find(nivel => nivel.nivel === 'previo al inicio')?.cantidadDeEstudiantes || 0,
          item.niveles.find(nivel => nivel.nivel === 'en inicio')?.cantidadDeEstudiantes || 0,
          item.niveles.find(nivel => nivel.nivel === 'en proceso')?.cantidadDeEstudiantes || 0,
          item.niveles.find(nivel => nivel.nivel === 'satisfactorio')?.cantidadDeEstudiantes || 0
        ],
        borderColor: `hsl(${index * 60}, 70%, 50%)`,
        backgroundColor: `hsla(${index * 60}, 70%, 50%, 0.1)`,
        fill: false,
        tension: 0,
        pointBackgroundColor: `hsl(${index * 60}, 70%, 50%)`,
        pointBorderColor: '#fff',
        pointBorderWidth: 2,
        pointRadius: 5,
        pointHoverRadius: 7,
        borderWidth: 3
      }
    })
  }

  // Calcular estadísticas por nivel
  const calcularEstadisticasNivel = (nivelNombre: string) => {
    if (dataGraficoTendenciaNiveles.length === 0) return { total: 0, promedio: 0, maximo: 0, minimo: 0 }
    
    const datosNivel = dataGraficoTendenciaNiveles.map(item => 
      item.niveles.find(nivel => nivel.nivel === nivelNombre)?.cantidadDeEstudiantes || 0
    )
    
    const total = datosNivel.reduce((sum, valor) => sum + valor, 0)
    const promedio = total / datosNivel.length
    const maximo = Math.max(...datosNivel)
    const minimo = Math.min(...datosNivel)
    
    return { total, promedio, maximo, minimo }
  }

  const estadisticasSatisfactorio = calcularEstadisticasNivel('satisfactorio')
  const estadisticasEnProceso = calcularEstadisticasNivel('en proceso')
  const estadisticasEnInicio = calcularEstadisticasNivel('en inicio')
  const estadisticasPrevioAlInicio = calcularEstadisticasNivel('previo al inicio')


  // Verificar si ambos datos están disponibles
  const hasData = dataGraficoTendencia && dataGraficoTendencia.length > 0 && 
                  dataGraficoTendenciaNiveles && dataGraficoTendenciaNiveles.length > 0

  // Si no hay datos, mostrar el loader
  if (loaderGraficos === true) {
    return (
      <div className="w-full max-w-7xl mx-auto p-6 flex justify-center items-center min-h-96">
        <Loader 
          size="large" 
          variant="spinner" 
          color="#4F46E5" 
          text="Cargando datos de gráficos..." 
        />
      </div>
    )
  }
  return (
    <div className="w-full max-w-7xl mx-auto p-4 space-y-6">
      {/* Gráfico de Promedios */}
      <div className="bg-white rounded-lg shadow-lg p-4">
        {/* <div className="mb-6">
          <h2 className="text-2xl font-bold text-gray-800 mb-2">
            Gráfico de Tendencia - Puntajes Promedio
          </h2>
          <p className="text-gray-600">
            Evolución del puntaje promedio de los estudiantes a lo largo del tiempo
          </p>
        </div> */}
        
        <div className="bg-gray-50 p-4 rounded-lg">
          <Line data={datosChart} options={opcionesGrafico} />
        </div>
        
        {/* <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-blue-50 p-4 rounded-lg border-l-4 border-blue-500">
            <h3 className="font-semibold text-blue-800">Puntaje Más Alto</h3>
            <p className="text-2xl font-bold text-blue-600">
              {dataGraficoTendencia.length > 0 ? Math.max(...dataGraficoTendencia.map(d => d.puntajeMedia)).toFixed(1) : '0.0'}
            </p>
          </div>
          <div className="bg-green-50 p-4 rounded-lg border-l-4 border-green-500">
            <h3 className="font-semibold text-green-800">Puntaje Más Bajo</h3>
            <p className="text-2xl font-bold text-green-600">
              {dataGraficoTendencia.length > 0 ? Math.min(...dataGraficoTendencia.map(d => d.puntajeMedia)).toFixed(1) : '0.0'}
            </p>
          </div>
          <div className="bg-purple-50 p-4 rounded-lg border-l-4 border-purple-500">
            <h3 className="font-semibold text-purple-800">Promedio General</h3>
            <p className="text-2xl font-bold text-purple-600">
              {dataGraficoTendencia.length > 0 ? (dataGraficoTendencia.reduce((sum, d) => sum + d.puntajeMedia, 0) / dataGraficoTendencia.length).toFixed(1) : '0.0'}
            </p>
          </div>
        </div> */}
      </div>

      {/* Gráfico de Niveles */}
      <div className="bg-white rounded-lg shadow-lg p-4">
        {/* <div className="mb-6">
          <h2 className="text-2xl font-bold text-gray-800 mb-2">
            Distribución de Estudiantes por Niveles de Rendimiento
          </h2>
          <p className="text-gray-600">
            Comparación de la cantidad de estudiantes en cada nivel de rendimiento por mes
          </p>
        </div> */}
        
        <div className="bg-gray-50 p-4 rounded-lg">
          <Line data={datosChartNiveles} options={opcionesGraficoNiveles} />
        </div>
        
        {/* <div className="mt-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-green-50 p-4 rounded-lg border-l-4 border-green-500">
            <h3 className="font-semibold text-green-800">Satisfactorio</h3>
            <p className="text-2xl font-bold text-green-600">
              {estadisticasSatisfactorio.total}
            </p>
            <p className="text-sm text-green-600">
              Promedio: {estadisticasSatisfactorio.promedio.toFixed(1)}
            </p>
          </div>
          <div className="bg-yellow-50 p-4 rounded-lg border-l-4 border-yellow-500">
            <h3 className="font-semibold text-yellow-800">En Proceso</h3>
            <p className="text-2xl font-bold text-yellow-600">
              {estadisticasEnProceso.total}
            </p>
            <p className="text-sm text-yellow-600">
              Promedio: {estadisticasEnProceso.promedio.toFixed(1)}
            </p>
          </div>
          <div className="bg-red-50 p-4 rounded-lg border-l-4 border-red-500">
            <h3 className="font-semibold text-red-800">En Inicio</h3>
            <p className="text-2xl font-bold text-red-600">
              {estadisticasEnInicio.total}
            </p>
            <p className="text-sm text-red-600">
              Promedio: {estadisticasEnInicio.promedio.toFixed(1)}
            </p>
          </div>
          <div className="bg-gray-50 p-4 rounded-lg border-l-4 border-gray-500">
            <h3 className="font-semibold text-gray-800">Previo al Inicio</h3>
            <p className="text-2xl font-bold text-gray-600">
              {estadisticasPrevioAlInicio.total}
            </p>
            <p className="text-sm text-gray-600">
              Promedio: {estadisticasPrevioAlInicio.promedio.toFixed(1)}
            </p>
          </div>
        </div> */}
      </div>

    </div>
  )
}

export default GraficoTendencia