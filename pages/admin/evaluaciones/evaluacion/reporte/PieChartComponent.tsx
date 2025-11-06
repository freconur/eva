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
import { useHighQualityChartOptions } from '@/features/hooks/useHighQualityChartOptions'
import { useColorsFromCSS } from '@/features/hooks/useColorsFromCSS'

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
  const { preparePieChartData, getNivelStyles } = useColorsFromCSS()
  
  // Usar opciones de alta calidad
  const opcionesGraficoPie = useHighQualityChartOptions({
    chartType: 'pie',
    title: `Distribución de Estudiantes por Niveles - ${datosMesSeleccionado ? 
      ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
       'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'][monthSelected] || `Mes ${monthSelected}` : 'Sin datos'}`,
    showLegend: true,
    legendPosition: 'bottom'
  })

  // Datos del gráfico de pie para el mes seleccionado
  const datosChartPie = datosMesSeleccionado 
    ? preparePieChartData(datosMesSeleccionado.niveles)
    : {
        labels: ['Sin datos'],
        datasets: [{
          data: [1],
          backgroundColor: ['#E5E7EB'],
          borderColor: '#ffffff',
          borderWidth: 1,
          borderAlign: 'inner' as const
        }]
      }

  return (
    <div className="bg-white rounded-lg shadow-lg p-4 mb-5">
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
            <div style={{ width: '100%', height: '100%', position: 'relative' }}>
              <Pie 
                data={datosChartPie} 
                options={{
                  ...opcionesGraficoPie,
                  // Configuración adicional para alta calidad
                  devicePixelRatio: 2,
                  // Mantener animaciones para efectos de hover
                  animation: {
                    ...opcionesGraficoPie.animation,
                  },
                }}
              />
            </div>
          )}
        </div>
      </div>
      
      {/* Estadísticas del mes seleccionado - Solo mostrar si no está cargando */}
     {/*  {!loaderDataGraficoPieChart && datosMesSeleccionado && (
        <div className="mt-4 grid grid-cols-2 md:grid-cols-4 gap-3">
          {datosMesSeleccionado.niveles.map((nivel, index) => {
            const totalEstudiantes = datosMesSeleccionado.niveles.reduce((sum, n) => sum + n.cantidadDeEstudiantes, 0)
            const porcentaje = totalEstudiantes > 0 ? ((nivel.cantidadDeEstudiantes / totalEstudiantes) * 100).toFixed(1) : '0.0'
            
            const color = getNivelStyles(nivel.nivel)
            
            return (
              <div 
                key={nivel.nivel} 
                className="p-3 rounded-lg border-l-4"
                style={{
                  backgroundColor: color.bg,
                  borderLeftColor: color.border
                }}
              >
                <h3 
                  className="font-medium text-sm mb-1"
                  style={{ color: color.text }}
                >
                  {nivel.nivel.split(' ').map(word => 
                    word.charAt(0).toUpperCase() + word.slice(1)
                  ).join(' ')}
                </h3>
                <p 
                  className="text-xl font-bold mb-1"
                  style={{ color: color.textValue }}
                >
                  {nivel.cantidadDeEstudiantes}
                </p>
                <p 
                  className="text-xs"
                  style={{ color: color.textValue }}
                >
                  {porcentaje}%
                </p>
              </div>
            )
          })}
        </div>
      )} */}
    </div>
  )
}

export default PieChartComponent
