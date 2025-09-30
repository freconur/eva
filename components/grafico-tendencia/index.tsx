import {
  Evaluacion,
  GraficoTendenciaNiveles,
  PromedioGlobalPorMes,
  GraficoPieChart,
} from '@/features/types/types';
import React from 'react';
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
}

const GraficoTendenciaColegio = ({
  datosPorMes,
  mesesConDataDisponibles,
  promedioGlobal,
  monthSelected,
  dataGraficoTendenciaNiveles,
  evaluacion,
}: Props) => {
  

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
  } = useChartOptions({
    evaluacion,
    promedioGlobal,
    valorMaximoNiveles,
    monthSelected,
  });
 
  return (
    <div className={styles.threeColumnGrid}>
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
      <div className={styles.column}>
        {datosNiveles && (
          <div className={styles.chartCard}>
            <div className={styles.cardHeader}>
              <div className={`${styles.headerBar} ${styles.headerBarBlue}`}></div>
              <h3 className={styles.cardTitle}>Cantidad de Estudiantes por Nivel y Mes</h3>
            </div>
            <div className={styles.chartContainer}>
              <Line data={datosNiveles} options={opcionesComunes} />
            </div>
          </div>
        )}
      </div>

      {/* Columna 3 - Gráficos de promedio global */}
      <div className={styles.column}>
        {/* Gráfico de promedio global - Líneas */}
        {datosPromedio && (
          <div className={styles.chartCard}>
            <div className={styles.cardHeader}>
              <div className={`${styles.headerBar} ${styles.headerBarGreen}`}></div>
              <h3 className={styles.cardTitle}>Promedio Global por Mes - Líneas</h3>
            </div>
            <div className={styles.chartContainer}>
              <Line data={datosPromedio} options={opcionesPromedio} />
            </div>
          </div>
        )}
      </div>
      <div className={styles.column}>
        {/* Gráfico de promedio global - Barras */}
        {datosBarrasPromedio && (
          <div className={styles.chartCard}>
            <div className={styles.cardHeader}>
              <div className={`${styles.headerBar} ${styles.headerBarBlue}`}></div>
              <h3 className={styles.cardTitle}>Promedio Global por Mes - Barras</h3>
            </div>
            <div className={styles.chartContainer}>
              <Bar data={datosBarrasPromedio} options={opcionesBarrasPromedio} />
            </div>
          </div>
        )}
      </div>
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
  );
};

export default GraficoTendenciaColegio;
