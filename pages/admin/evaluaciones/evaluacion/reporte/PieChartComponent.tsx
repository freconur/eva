import React from 'react'
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler,
  ArcElement
} from 'chart.js'
import { Pie } from 'react-chartjs-2'
import { GraficoPieChart } from '@/features/types/types'
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
  Filler,
  ArcElement
)

interface PieChartComponentProps {
  monthSelected: number
  dataGraficoTendenciaNiveles: GraficoPieChart[]
}
const PieChartComponent = ({ monthSelected, dataGraficoTendenciaNiveles }: PieChartComponentProps) => {
  // Buscar datos del mes seleccionado usando find
  const datosMesSeleccionado = Array.isArray(dataGraficoTendenciaNiveles) 
    ? dataGraficoTendenciaNiveles.find(item => item.mes === monthSelected)
    : undefined;
  
  const { loaderDataGraficoPieChart } = useGlobalContext()
  // Configuración del gráfico de pie
  const opcionesGraficoPie = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'bottom' as const,
        labels: {
          color: '#333',
          font: {
            size: 14
          },
          padding: 20
        }
      },
      title: {
        display: true,
        text: `Distribución de Estudiantes por Niveles - ${datosMesSeleccionado ? 
          ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
           'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'][monthSelected] || `Mes ${monthSelected}` : 'Sin datos'}`,
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
        callbacks: {
          label: function(context: any) {
            const total = context.dataset.data.reduce((a: number, b: number) => a + b, 0)
            const percentage = ((context.parsed / total) * 100).toFixed(1)
            return `${context.label}: ${context.parsed} estudiantes (${percentage}%)`
          }
        }
      }
    }
  }

  // Función para obtener el color según el nivel
  const obtenerColorPorNivel = (nivel: string) => {
    const nivelLower = nivel.toLowerCase();
    if (nivelLower.includes('satisfactorio')) {
      return { bg: '#10b981', border: '#059669', hoverBg: '#059669', hoverBorder: '#10b981' };
    } else if (nivelLower.includes('proceso')) {
      return { bg: '#f59e0b', border: '#d97706', hoverBg: '#d97706', hoverBorder: '#f59e0b' };
    } else if (nivelLower.includes('inicio') && !nivelLower.includes('previo')) {
      return { bg: '#ef4444', border: '#dc2626', hoverBg: '#dc2626', hoverBorder: '#ef4444' };
    } else if (nivelLower.includes('previo')) {
      return { bg: '#8b5cf6', border: '#7c3aed', hoverBg: '#7c3aed', hoverBorder: '#8b5cf6' };
    }
    return { bg: '#6b7280', border: '#4b5563', hoverBg: '#4b5563', hoverBorder: '#6b7280' }; // Color gris por defecto
  };

  // Datos del gráfico de pie para el mes seleccionado
  const datosChartPie = datosMesSeleccionado ? {
    labels: datosMesSeleccionado.niveles.map(nivel => {
      // Capitalizar la primera letra de cada palabra
      return nivel.nivel.split(' ').map(word => 
        word.charAt(0).toUpperCase() + word.slice(1)
      ).join(' ')
    }),
    datasets: [{
      data: datosMesSeleccionado.niveles.map(nivel => nivel.cantidadDeEstudiantes),
      backgroundColor: datosMesSeleccionado.niveles.map(nivel => obtenerColorPorNivel(nivel.nivel).bg),
      borderColor: datosMesSeleccionado.niveles.map(nivel => obtenerColorPorNivel(nivel.nivel).border),
      borderWidth: 2,
      hoverBackgroundColor: datosMesSeleccionado.niveles.map(nivel => obtenerColorPorNivel(nivel.nivel).hoverBg),
      hoverBorderColor: datosMesSeleccionado.niveles.map(nivel => obtenerColorPorNivel(nivel.nivel).hoverBorder),
      hoverBorderWidth: 3
    }]
  } : {
    labels: ['Sin datos'],
    datasets: [{
      data: [1],
      backgroundColor: ['#E5E7EB'],
      borderColor: ['#9CA3AF'],
      borderWidth: 2
    }]
  }

  return (
    <div className="bg-white rounded-lg shadow-lg p-4">
      <div className="bg-gray-50 p-3 rounded-lg">
        <div className="h-80 flex items-center justify-center">
          {loaderDataGraficoPieChart ? (
            <Loader 
              size="large" 
              variant="spinner" 
              color="#3b82f6"
              text="Cargando datos del gráfico..."
            />
          ) : (
            <Pie data={datosChartPie} options={opcionesGraficoPie} />
          )}
        </div>
      </div>
      
      {/* Estadísticas del mes seleccionado - Solo mostrar si no está cargando */}
      {!loaderDataGraficoPieChart && datosMesSeleccionado && (
        <div className="mt-4 grid grid-cols-2 md:grid-cols-4 gap-3">
          {datosMesSeleccionado.niveles.map((nivel, index) => {
            const totalEstudiantes = datosMesSeleccionado.niveles.reduce((sum, n) => sum + n.cantidadDeEstudiantes, 0)
            const porcentaje = totalEstudiantes > 0 ? ((nivel.cantidadDeEstudiantes / totalEstudiantes) * 100).toFixed(1) : '0.0'
            
            // Función para obtener las clases de color según el nivel
            const obtenerClasesColorPorNivel = (nivel: string) => {
              const nivelLower = nivel.toLowerCase();
              if (nivelLower.includes('satisfactorio')) {
                return { bg: 'bg-green-50', border: 'border-green-500', text: 'text-green-800', textValue: 'text-green-600' };
              } else if (nivelLower.includes('proceso')) {
                return { bg: 'bg-orange-50', border: 'border-orange-500', text: 'text-orange-800', textValue: 'text-orange-600' };
              } else if (nivelLower.includes('inicio') && !nivelLower.includes('previo')) {
                return { bg: 'bg-red-50', border: 'border-red-500', text: 'text-red-800', textValue: 'text-red-600' };
              } else if (nivelLower.includes('previo')) {
                return { bg: 'bg-purple-50', border: 'border-purple-500', text: 'text-purple-800', textValue: 'text-purple-600' };
              }
              return { bg: 'bg-gray-50', border: 'border-gray-500', text: 'text-gray-800', textValue: 'text-gray-600' }; // Color gris por defecto
            };
            
            const color = obtenerClasesColorPorNivel(nivel.nivel)
            
            return (
              <div key={nivel.nivel} className={`${color.bg} p-3 rounded-lg border-l-4 ${color.border}`}>
                <h3 className={`font-medium text-sm ${color.text} mb-1`}>
                  {nivel.nivel.split(' ').map(word => 
                    word.charAt(0).toUpperCase() + word.slice(1)
                  ).join(' ')}
                </h3>
                <p className={`text-xl font-bold ${color.textValue} mb-1`}>
                  {nivel.cantidadDeEstudiantes}
                </p>
                <p className={`text-xs ${color.textValue}`}>
                  {porcentaje}%
                </p>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}

export default PieChartComponent
