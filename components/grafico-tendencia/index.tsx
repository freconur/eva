import {
  Evaluacion,
  GraficoTendenciaNiveles,
  PromedioGlobalPorMes,
  GraficoPieChart,
  UserEstudiante,
} from '@/features/types/types';
import React, { useMemo, useState } from 'react';
import { useRouter } from 'next/router';
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
  ChartData,
  ChartOptions,
} from 'chart.js';
import { Line, Bar, Pie } from 'react-chartjs-2';
import { useGlobalContext } from '@/features/context/GlolbalContext';
import Loader from '@/components/loader/loader';
import { useGraficoTendenciaData } from '@/features/hooks/useGraficoTendenciaData';
import { useChartOptions } from '@/features/hooks/useChartOptions';
import CoverageChart from '../reportes/CoverageChart';
import styles from './grafico-tendencia.module.css';

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
  promedioPorSeccion?: any[];
  promedioPorDocente?: any[];
  isFlat?: boolean;
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
  promedioPorDocente = [],
  isFlat = false,
}: Props) => {
  console.log("DEBUG-GRAFICOS: Recibiendo datos en GraficoTendenciaColegio:", {
    datosPorMes,
    mesesConDataDisponibles,
    promedioGlobal,
    monthSelected,
    dataGraficoTendenciaNiveles,
    evaluacion,
    evaluados,
    pendientes,
    listaPendientes,
    promedioPorSeccion,
    promedioPorDocente,
  });
  const router = useRouter();
  const [gridColumns, setGridColumns] = useState<1 | 2 | 3>(3);
  const [sortMethod, setSortMethod] = useState<'satisfactorio' | 'estudiantes'>('satisfactorio');
  const { loaderDataGraficoPieChart } = useGlobalContext();

  const isMainDashboard = router.pathname === '/directores/reporte';

  const {
    datosChartPie,
    datosMesSeleccionado,
    datosNiveles,
    valorMaximoNiveles,
    datosPromedio,
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
    opcionesComparacionSecciones,
  } = useChartOptions({
    evaluacion,
    promedioGlobal,
    valorMaximoNiveles,
    monthSelected,
  });

  // DATA DOCENTES (SERVER)
  const chartDataDocentes = useMemo<ChartData<'bar'> | null>(() => {
    let data = Array.isArray(promedioPorDocente) ? [...promedioPorDocente] : [];
    if (data.length === 0) return null;

    // Ordenar dinámicamente según el método seleccionado
    data.sort((a, b) => {
      if (sortMethod === 'satisfactorio') {
        const porcentajeA = a.cantidad > 0 ? (a.distribucion?.satisfactorio || 0) / a.cantidad : 0;
        const porcentajeB = b.cantidad > 0 ? (b.distribucion?.satisfactorio || 0) / b.cantidad : 0;
        return porcentajeB - porcentajeA; // Descendente por defecto
      } else {
        // Ordenar por número de estudiantes de manera ascendente
        return (a.cantidad || 0) - (b.cantidad || 0);
      }
    });

    return {
      labels: data.map(d => d.docenteNombre || 'Sin nombre'),
      datasets: [
        { label: 'Satisfactorio', data: data.map(d => d.distribucion?.satisfactorio || 0), backgroundColor: '#84cc16' },
        { label: 'En Proceso', data: data.map(d => d.distribucion?.proceso || 0), backgroundColor: '#f97316' },
        { label: 'En Inicio', data: data.map(d => d.distribucion?.inicio || 0), backgroundColor: '#b91c1c' },
        { label: 'Previo al Inicio', data: data.map(d => d.distribucion?.previo || 0), backgroundColor: '#9ca3af' }
      ]
    };
  }, [promedioPorDocente, sortMethod]);

  // DATA SECCIONES (CLIENT)
  const chartDataSecciones = useMemo<ChartData<'bar'> | null>(() => {
    const data = Array.isArray(promedioPorSeccion) ? promedioPorSeccion : [];
    if (data.length === 0) return null;

    return {
      labels: data.map(s => `Sección ${s.seccion || '?'}`),
      datasets: [
        { label: 'Satisfactorio', data: data.map(s => s.distribucion?.satisfactorio || 0), backgroundColor: '#84cc16' },
        { label: 'En Proceso', data: data.map(s => s.distribucion?.proceso || 0), backgroundColor: '#f97316' },
        { label: 'En Inicio', data: data.map(s => s.distribucion?.inicio || 0), backgroundColor: '#b91c1c' },
        { label: 'Previo al Inicio', data: data.map(s => s.distribucion?.previo || 0), backgroundColor: '#9ca3af' }
      ]
    };
  }, [promedioPorSeccion]);

  // --- RENDERIZADO ---

  const renderDocentesChart = () => {
    if (!chartDataDocentes) return null;
    return (
      <div className={`${styles.column} ${styles.columnFullWidth}`}>
        <div className={isFlat ? styles.flatCard : styles.chartCard}>
          <div className={styles.cardHeader} style={{ borderBottom: '1px solid #e2e8f0', paddingBottom: '0.75rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <div className={`${styles.headerBar} ${styles.headerBarBlue}`} style={{ width: '3px', height: '18px' }}></div>
              <h3 className={styles.cardTitle} style={{ fontSize: isFlat ? '0.95rem' : '1.1rem', color: '#1e293b', margin: 0, fontWeight: 600 }}>
                {isFlat ? 'Comparativa por Docentes' : 'Comparativa de Niveles por Docentes'}
              </h3>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <span style={{ fontSize: '11px', color: '#64748b', fontWeight: 500 }}>Ordenar por:</span>
              <select
                value={sortMethod}
                onChange={(e) => setSortMethod(e.target.value as 'satisfactorio' | 'estudiantes')}
                style={{
                  padding: '2px 6px',
                  fontSize: '12px',
                  borderRadius: '6px',
                  border: '1px solid #cbd5e1',
                  backgroundColor: '#f8fafc',
                  color: '#334155',
                  cursor: 'pointer',
                  fontWeight: 500,
                  outline: 'none'
                }}
              >
                <option value="satisfactorio">Satisfactorio (%)</option>
                <option value="estudiantes">N° Estudiantes (Asc)</option>
              </select>
            </div>
          </div>
          <div className={styles.chartContainer} style={{ height: `${Math.max(450, (chartDataDocentes.labels?.length || 0) * 75)}px`, marginTop: '1.5rem' }}>
            <Bar data={chartDataDocentes} options={opcionesComparacionSecciones as any} />
          </div>
        </div>
      </div>
    );
  };

  const renderSeccionesChart = () => {
    if (!chartDataSecciones) return null;
    return (
      <div className={`${styles.column} ${styles.columnFullWidth}`}>
        <div className={styles.chartCard}>
          <div className={styles.cardHeader}><div className={styles.headerBarBlue}></div><h3 className={styles.cardTitle}>Comparativa por Secciones</h3></div>
          <div className={styles.chartContainer} style={{ height: `${Math.max(250, (chartDataSecciones.labels?.length || 0) * 50)}px` }}>
            <Bar data={chartDataSecciones} options={opcionesComparacionSecciones as any} />
          </div>
        </div>
      </div>
    );
  };

  if (isMainDashboard) {
    return (
      <div className={styles.containerWrapper}>
        <div className={styles.oneColumnGrid}>
          {renderDocentesChart() || (
            <div className={styles.noDataContainer}><h3 className={styles.noDataTitle}>Procesando resultados...</h3></div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className={styles.containerWrapper}>
      <div className={styles.controlsContainer}>
        <div className={styles.tabsWrapper}>
          <button
            onClick={() => setGridColumns(1)}
            className={`${styles.tabButton} ${gridColumns === 1 ? styles.tabButtonActive : ''}`}
            title="1 columna"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
              <rect x="4" y="7" width="16" height="3" rx="1.5" />
              <rect x="4" y="14" width="16" height="3" rx="1.5" />
            </svg>
          </button>
          <button
            onClick={() => setGridColumns(2)}
            className={`${styles.tabButton} ${gridColumns === 2 ? styles.tabButtonActive : ''}`}
            title="2 columnas"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
              <rect x="4" y="4" width="7" height="7" rx="1.5" />
              <rect x="13" y="4" width="7" height="7" rx="1.5" />
              <rect x="4" y="13" width="7" height="7" rx="1.5" />
              <rect x="13" y="13" width="7" height="7" rx="1.5" />
            </svg>
          </button>
          <button
            onClick={() => setGridColumns(3)}
            className={`${styles.tabButton} ${gridColumns === 3 ? styles.tabButtonActive : ''}`}
            title="3 columnas"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
              <rect x="3" y="3" width="4" height="4" rx="1" />
              <rect x="10" y="3" width="4" height="4" rx="1" />
              <rect x="17" y="3" width="4" height="4" rx="1" />
              <rect x="3" y="10" width="4" height="4" rx="1" />
              <rect x="10" y="10" width="4" height="4" rx="1" />
              <rect x="17" y="10" width="4" height="4" rx="1" />
              <rect x="3" y="17" width="4" height="4" rx="1" />
              <rect x="10" y="17" width="4" height="4" rx="1" />
              <rect x="17" y="17" width="4" height="4" rx="1" />
            </svg>
          </button>
        </div>
      </div>

      <div className={`${styles.threeColumnGrid} ${styles[`gridColumns${gridColumns}`]}`}>
        {datosMesSeleccionado && (
          <div className={styles.column}>
            <div className={styles.chartCard}>
              <div className={styles.cardHeader}><div className={styles.headerBarPurple}></div><h3 className={styles.cardTitle}>Distribución Niveles</h3></div>
              <div className={styles.chartContainer}>
                {loaderDataGraficoPieChart ? <Loader text="Cargando..." /> : <Pie data={datosChartPie as any} options={opcionesGraficoPie as any} />}
              </div>
            </div>
          </div>
        )}
        {datosNiveles && (
          <div className={styles.column}>
            <div className={styles.chartCard}>
              <div className={styles.cardHeader}><div className={styles.headerBarBlue}></div><h3 className={styles.cardTitle}>Tendencia Niveles</h3></div>
              <div className={styles.chartContainer}><Line data={datosNiveles as any} options={opcionesComunes as any} /></div>
            </div>
          </div>
        )}
        {datosPromedio && (
          <div className={styles.column}>
            <div className={styles.chartCard}>
              <div className={styles.cardHeader}><div className={styles.headerBarGreen}></div><h3 className={styles.cardTitle}>Promedio Global</h3></div>
              <div className={styles.chartContainer}><Line data={datosPromedio as any} options={opcionesPromedio as any} /></div>
            </div>
          </div>
        )}
        <div className={styles.column}>
          <CoverageChart evaluados={evaluados} pendientes={pendientes} listaPendientes={listaPendientes} />
        </div>
        
        {/* GRÁFICOS FULL WIDTH */}
        {renderDocentesChart()}
        {renderSeccionesChart()}
      </div>
    </div>
  );
};

export default GraficoTendenciaColegio;
