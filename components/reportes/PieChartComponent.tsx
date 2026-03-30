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
import styles from './PieChartComponent.module.css'

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
  yearSelected: number
  filtros?: {
    genero: string;
    region: string;
  };
  onFilterChange?: (name: string, value: string) => void;
}

const PieChartComponent = ({
  monthSelected = 0,
  dataGraficoTendenciaNiveles = [],
  yearSelected = 2025,
  filtros = { genero: '', region: '' },
  onFilterChange
}: PieChartComponentProps) => {
  const { genero: filtroGenero, region: filtroRegion } = filtros;

  const route = useRouter()
  const { loaderDataGraficoPieChart, dataGraficoPieChart } = useGlobalContext()
  const { preparePieChartData } = useColorsFromCSS()

  // Usar dataGraficoPieChart del contexto global si está disponible, sino usar la prop
  const datosParaGrafico = useMemo(() => {
    // Si hay filtros activos (Género o Región), no queremos el fallback global
    // Queremos mostrar el resultado real del filtro (incluso si es vacío)
    if (filtroGenero || filtroRegion) {
      return dataGraficoPieChart || [];
    }

    // Si NO hay filtros, usamos lo que haya en el contexto global,
    // y si no hay nada, el fallback de dataGraficoTendenciaNiveles (datos generales)
    if (Array.isArray(dataGraficoPieChart) && dataGraficoPieChart.length > 0) {
      return dataGraficoPieChart;
    }
    return dataGraficoTendenciaNiveles;
  }, [dataGraficoPieChart, dataGraficoTendenciaNiveles, filtroGenero, filtroRegion]);

  const [dataFiltrada, setDataFiltrada] = useState<GraficoPieChart[]>(datosParaGrafico)

  // Sincronizar dataFiltrada cuando cambien los datos originales
  useEffect(() => {
    setDataFiltrada(datosParaGrafico)
  }, [datosParaGrafico])

  const handleChangeGenero = (e: React.ChangeEvent<HTMLSelectElement>) => {
    if (onFilterChange) onFilterChange('genero', e.target.value);
  }

  const handleChangeRegion = (e: React.ChangeEvent<HTMLSelectElement>) => {
    if (onFilterChange) onFilterChange('region', e.target.value);
  }

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

  return (
    <div className={styles.container}>
      {/* Selectores de filtro */}
      <div className={styles.filtersContainer}>
        <div className={styles.filterWrapper}>
          <label className={styles.label}>
            Filtrar por Género
          </label>
          <select
            value={filtroGenero}
            onChange={handleChangeGenero}
            className={styles.select}
          >
            <option value="">Todos los géneros</option>
            {genero.map((gen) => (
              <option key={gen.id} value={gen.id}>
                {gen.name.toUpperCase()}
              </option>
            ))}
          </select>
        </div>
        <div className={styles.filterWrapper}>
          <label className={styles.label}>
            Filtrar por Ugel
          </label>
          <select
            value={filtroRegion}
            onChange={handleChangeRegion}
            className={styles.select}
          >
            <option value="">Todas las Ugel</option>
            {regiones.map((region) => (
              <option key={region.id} value={region.id}>
                {region.region}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className={styles.chartContainer}>
        <div className={styles.chartWrapper}>
          {loaderDataGraficoPieChart ? (
            <Loader
              size="large"
              variant="spinner"
              color="#3b82f6"
              text="Cargando datos del gráfico..."
            />
          ) : (
            <div className={styles.chartInner}>
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
        <div className={styles.statsContainer}>
          {datosMesSeleccionado.niveles.map((nivel, index) => {
            const totalEstudiantes = datosMesSeleccionado.niveles.reduce((sum, n) => sum + n.cantidadDeEstudiantes, 0)
            const porcentaje = totalEstudiantes > 0 ? ((nivel.cantidadDeEstudiantes / totalEstudiantes) * 100).toFixed(1) : '0.0'
            
            const color = getNivelStyles(nivel.nivel)
            
            return (
              <div 
                key={nivel.nivel} 
                className={styles.statCard}
                style={{
                  backgroundColor: color.bg,
                  borderLeftColor: color.border
                }}
              >
                <h3 
                  className={styles.statTitle}
                  style={{ color: color.text }}
                >
                  {nivel.nivel.split(' ').map(word => 
                    word.charAt(0).toUpperCase() + word.slice(1)
                  ).join(' ')}
                </h3>
                <p 
                  className={styles.statValue}
                  style={{ color: color.textValue }}
                >
                  {nivel.cantidadDeEstudiantes}
                </p>
                <p 
                  className={styles.statPercentage}
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
