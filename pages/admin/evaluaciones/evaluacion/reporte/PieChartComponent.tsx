import React, { useState, useEffect, useMemo, useCallback } from 'react'
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
import { genero, regiones } from '@/fuctions/regiones'
import { useReporteEspecialistas } from '@/features/hooks/useReporteEspecialistas'
import { useRouter } from 'next/router'

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
  const [filtroGenero, setFiltroGenero] = useState<string>('')
  const [filtroRegion, setFiltroRegion] = useState<string>('')
  const [dataFiltrada, setDataFiltrada] = useState<GraficoPieChart[]>(dataGraficoTendenciaNiveles)
  
  const route = useRouter()
  const { loaderDataGraficoPieChart, evaluacion, dataGraficoPieChart } = useGlobalContext()
  const { preparePieChartData, getNivelStyles } = useColorsFromCSS()
  const { getDataGraficoPieChart } = useReporteEspecialistas()

  // Memoizar el idEvaluacion para evitar renders innecesarios
  const idEvaluacion = useMemo(() => route.query.idEvaluacion, [route.query.idEvaluacion])

  // Efecto para recargar datos cuando cambien los filtros
  useEffect(() => {
    if (idEvaluacion && evaluacion?.nivelYPuntaje) {
      getDataGraficoPieChart(
        `${idEvaluacion}`, 
        monthSelected, 
        evaluacion,
        filtroGenero || undefined,
        filtroRegion || undefined
      )
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [monthSelected, filtroGenero, filtroRegion, idEvaluacion])

  // Usar dataGraficoPieChart del contexto global si está disponible, sino usar la prop
  const datosParaGrafico = useMemo(() => {
    return Array.isArray(dataGraficoPieChart) && dataGraficoPieChart.length > 0
      ? dataGraficoPieChart
      : dataGraficoTendenciaNiveles
  }, [dataGraficoPieChart, dataGraficoTendenciaNiveles])

  // Actualizar datos filtrados cuando cambien los datos originales
  useEffect(() => {
    setDataFiltrada(datosParaGrafico)
  }, [datosParaGrafico])

  // Buscar datos del mes seleccionado usando find
  const datosMesSeleccionado = Array.isArray(dataFiltrada) 
    ? dataFiltrada.find(item => item.mes === monthSelected)
    : undefined;
  
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

  const handleChangeGenero = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setFiltroGenero(e.target.value)
  }

  const handleChangeRegion = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setFiltroRegion(e.target.value)
  }

  return (
    <div className="bg-white rounded-lg shadow-lg p-4 mb-5">
      {/* Selectores de filtro */}
      <div className="mb-4 flex gap-3 flex-wrap">
        <div className="flex-1 min-w-[200px]">
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Filtrar por Género
          </label>
          <select
            value={filtroGenero}
            onChange={handleChangeGenero}
            className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="">Todos los géneros</option>
            {genero.map((gen) => (
              <option key={gen.id} value={gen.id}>
                {gen.name.toUpperCase()}
              </option>
            ))}
          </select>
        </div>
        <div className="flex-1 min-w-[200px]">
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Filtrar por Región
          </label>
          <select
            value={filtroRegion}
            onChange={handleChangeRegion}
            className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="">Todas las regiones</option>
            {regiones.map((region) => (
              <option key={region.id} value={region.id}>
                {region.region}
              </option>
            ))}
          </select>
        </div>
      </div>
      
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
