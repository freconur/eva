import {
  Evaluacion,
  GraficoTendenciaNiveles,
  PromedioGlobalPorMes,
  GraficoPieChart,
  UserEstudiante,
} from '@/features/types/types';
import React, { useMemo, useState } from 'react';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  Filler,
  ArcElement,
} from 'chart.js';
import { Line, Bar, Pie } from 'react-chartjs-2';
import { useGlobalContext } from '@/features/context/GlolbalContext';
import Loader from '@/components/loader/loader';
import { useGraficoTendenciaData } from '@/features/hooks/useGraficoTendenciaData';
import { useChartOptions } from '@/features/hooks/useChartOptions';
import CoverageChart from '../reportes/CoverageChart';
import styles from './grafico-tendencia.module.css';
// Registrar los componentes necesarios de Chart.js
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  Filler,
  ArcElement
);

interface Props {
  datosPorMes: GraficoTendenciaNiveles[];
  mesesConDataDisponibles: number[];
  promedioGlobal: PromedioGlobalPorMes[];
  monthSelected: number;
  dataGraficoTendenciaNiveles: GraficoPieChart[];
  evaluacion: Evaluacion;
  evaluados?: number;
  pendientes?: number;
  listaPendientes?: UserEstudiante[];
  promedioPorSeccion?: {
    seccion: string;
    promedio: number;
    cantidad: number;
    distribucion: {
      satisfactorio: number;
      proceso: number;
      inicio: number;
      previo: number;
    };
  }[];
}

const GraficoTendenciaColegio = ({
  datosPorMes,
  mesesConDataDisponibles,
  promedioGlobal,
  monthSelected,
  dataGraficoTendenciaNiveles,
  evaluacion,
  evaluados = 0,
  pendientes = 0,
  listaPendientes = [],
  promedioPorSeccion = [],
}: Props) => {
  const [gridColumns, setGridColumns] = useState<1 | 2 | 3>(3);

  const { loaderDataGraficoPieChart } = useGlobalContext();

  // Usar hooks personalizados para manejar datos y opciones
  const {
    datosChartPie,
    datosMesSeleccionado,
    datosNiveles,
    valorMaximoNiveles,
    datosPromedio,
    valorMinimoPromedio,
    datosBarrasPromedio,
  } = useGraficoTendenciaData({
    datosPorMes,
    mesesConDataDisponibles,
    promedioGlobal,
    monthSelected,
    dataGraficoTendenciaNiveles,
    evaluacion,
  });

  const {
    opcionesComunes,
    opcionesGraficoPie,
    opcionesPromedio,
    opcionesBarrasPromedio,
    opcionesComparacionSecciones,
  } = useChartOptions({
    evaluacion,
    promedioGlobal,
    valorMaximoNiveles,
    monthSelected,
  });

  // Preparar data para el gráfico de comparación por secciones (Apilado)
  const dataSecciones = useMemo(() => {
    if (promedioPorSeccion.length < 2) return null;

    return {
      labels: promedioPorSeccion.map(s => `Sección ${s.seccion}`),
      datasets: [
        {
          label: 'Satisfactorio',
          data: promedioPorSeccion.map(s => s.distribucion.satisfactorio),
          backgroundColor: '#84cc16', // Lima/Verde (Satisfactorio)
        },
        {
          label: 'En Proceso',
          data: promedioPorSeccion.map(s => s.distribucion.proceso),
          backgroundColor: '#f97316', // Naranja (Proceso)
        },
        {
          label: 'En Inicio',
          data: promedioPorSeccion.map(s => s.distribucion.inicio),
          backgroundColor: '#b91c1c', // Rojo (Inicio)
        },
        {
          label: 'Previo al Inicio',
          data: promedioPorSeccion.map(s => s.distribucion.previo),
          backgroundColor: '#9ca3af', // Gris (Previo)
        }
      ]
    };
  }, [promedioPorSeccion]);

  // Determinar la clase de la cuadrícula según la selección
  const getGridClassName = () => {
    switch (gridColumns) {
      case 1:
        return `${styles.threeColumnGrid} ${styles.gridColumns1}`;
      case 2:
        return `${styles.threeColumnGrid} ${styles.gridColumns2}`;
      case 3:
        return `${styles.threeColumnGrid} ${styles.gridColumns3}`;
      default:
        return styles.threeColumnGrid;
    }
  };

  return (
    <div className={styles.containerWrapper}>
      {/* Controles de vista de columnas */}
      <div className={styles.controlsContainer}>
        <div className={styles.tabsWrapper}>
          <button
            onClick={() => setGridColumns(1)}
            className={`${styles.tabButton} ${gridColumns === 1 ? styles.tabButtonActive : ''}`}
            title="1 Columna"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
              <rect x="3" y="6" width="18" height="4.5" rx="1.5" />
              <rect x="3" y="13.5" width="18" height="4.5" rx="1.5" />
            </svg>
          </button>
          <button
            onClick={() => setGridColumns(2)}
            className={`${styles.tabButton} ${gridColumns === 2 ? styles.tabButtonActive : ''}`}
            title="2 Columnas"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
              <rect x="3" y="3" width="7.5" height="7.5" rx="1.5" />
              <rect x="13.5" y="3" width="7.5" height="7.5" rx="1.5" />
              <rect x="3" y="13.5" width="7.5" height="7.5" rx="1.5" />
              <rect x="13.5" y="13.5" width="7.5" height="7.5" rx="1.5" />
            </svg>
          </button>
          <button
            onClick={() => setGridColumns(3)}
            className={`${styles.tabButton} ${gridColumns === 3 ? styles.tabButtonActive : ''}`}
            title="3 Columnas"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
              <rect x="2" y="4" width="5.5" height="6.5" rx="1" />
              <rect x="9.25" y="4" width="5.5" height="6.5" rx="1" />
              <rect x="16.5" y="4" width="5.5" height="6.5" rx="1" />
              <rect x="2" y="13.5" width="5.5" height="6.5" rx="1" />
              <rect x="9.25" y="13.5" width="5.5" height="6.5" rx="1" />
              <rect x="16.5" y="13.5" width="5.5" height="6.5" rx="1" />
            </svg>
          </button>
        </div>
      </div>

      <div className={getGridClassName()}>
        {/* Columna 1 - Gráfico de Pie Chart */}
      {datosMesSeleccionado && datosMesSeleccionado.niveles.length > 0 && (
        <div className={styles.column}>
          <div className={styles.chartCard}>
            <div className={styles.cardHeader}>
              <div className={`${styles.headerBar} ${styles.headerBarPurple}`}></div>
              <h3 className={styles.cardTitle}>Distribución de Estudiantes por Niveles</h3>
            </div>
            <div className={styles.chartContainer}>
              {loaderDataGraficoPieChart ? (
                <div className={styles.loaderContainer}>
                  <Loader
                    size="large"
                    variant="spinner"
                    color="#3b82f6"
                    text="Cargando datos del gráfico..."
                  />
                </div>
              ) : (
                <Pie data={datosChartPie} options={opcionesGraficoPie} />
              )}
            </div>
          </div>
        </div>
      )}

      {/* Columna 2 - Gráfico de niveles por mes */}
      {datosNiveles && (
        <div className={styles.column}>
          <div className={styles.chartCard}>
            <div className={styles.cardHeader}>
              <div className={`${styles.headerBar} ${styles.headerBarBlue}`}></div>
              <h3 className={styles.cardTitle}>Cantidad de Estudiantes por Nivel y Mes</h3>
            </div>
            <div className={styles.chartContainer}>
              <Line data={datosNiveles} options={opcionesComunes} />
            </div>
          </div>
        </div>
      )}

      {/* Columna 3 - Gráficos de promedio global */}
      {datosPromedio && (
        <div className={styles.column}>
          <div className={styles.chartCard}>
            <div className={styles.cardHeader}>
              <div className={`${styles.headerBar} ${styles.headerBarGreen}`}></div>
              <h3 className={styles.cardTitle}>Promedio Global por Mes - Líneas</h3>
            </div>
            <div className={styles.chartContainer}>
              <Line data={datosPromedio} options={opcionesPromedio} />
            </div>
          </div>
        </div>
      )}

      {/* Gráfico de promedio global - Barras */}
      {datosBarrasPromedio && (
        <div className={styles.column}>
          <div className={styles.chartCard}>
            <div className={styles.cardHeader}>
              <div className={`${styles.headerBar} ${styles.headerBarBlue}`}></div>
              <h3 className={styles.cardTitle}>Promedio Global por Mes - Barras</h3>
            </div>
            <div className={styles.chartContainer}>
              <Bar data={datosBarrasPromedio} options={opcionesBarrasPromedio} />
            </div>
          </div>
        </div>
      )}

      {/* Columna - Gráfico de Cobertura */}
      <div className={styles.column}>
        <CoverageChart
          evaluados={evaluados}
          pendientes={pendientes}
          listaPendientes={listaPendientes}
        />
      </div>

      {/* Columna de Comparativa por Secciones (solo si hay 2 o más) */}
      {dataSecciones && (
        <div className={`${styles.column} ${styles.columnFullWidth}`}>
          <div className={styles.chartCard}>
            <div className={styles.cardHeader}>
              <div className={`${styles.headerBar} ${styles.headerBarBlue}`}></div>
              <h3 className={styles.cardTitle}>Comparativa por Secciones</h3>
            </div>
            <div className={styles.chartContainer} style={{ height: `${Math.max(250, dataSecciones.labels.length * 50)}px` }}>
              <Bar data={dataSecciones} options={opcionesComparacionSecciones} />
            </div>
          </div>
        </div>
      )}

      {/* Mensaje si no hay datos */}
      {!datosNiveles && !datosPromedio && (
        <div className={styles.noDataContainer}>
          <div className={styles.noDataIcon}>📊</div>
          <h3 className={styles.noDataTitle}>No hay datos disponibles</h3>
          <p className={styles.noDataMessage}>
            Los gráficos aparecerán cuando haya datos para mostrar
          </p>
        </div>
      )}
      </div>
    </div>
  );
};

export default GraficoTendenciaColegio;
