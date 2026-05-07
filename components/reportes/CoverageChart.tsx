import React, { useMemo } from 'react';
import { Doughnut } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  ArcElement,
  Tooltip,
  Legend,
  ChartOptions,
  ChartData
} from 'chart.js';
import { IoClose } from 'react-icons/io5';
import { getElementAtEvent } from 'react-chartjs-2';
import styles from './CoverageChart.module.css';
import { UserEstudiante } from '@/features/types/types';
import { getGradoTexto, getSeccionTexto, converGenero } from '@/fuctions/regiones';

ChartJS.register(ArcElement, Tooltip, Legend);

interface CoverageChartProps {
  evaluados: number;
  pendientes: number;
  listaPendientes?: UserEstudiante[];
}

const CoverageChart: React.FC<CoverageChartProps> = ({ evaluados, pendientes, listaPendientes = [] }) => {
  const [showModal, setShowModal] = React.useState(false);
  const chartRef = React.useRef<any>(null);

  const total = evaluados + pendientes;
  const porcentajeEvaluados = total > 0 ? ((evaluados / total) * 100).toFixed(1) : '0';

  const data: ChartData<'doughnut'> = useMemo(() => ({
    labels: ['Evaluados', 'Pendientes'],
    datasets: [
      {
        data: [evaluados, pendientes],
        backgroundColor: [
          'rgba(16, 185, 129, 0.8)', // Emerald-500
          'rgba(209, 213, 219, 0.5)', // Gray-300
        ],
        borderColor: [
          '#10b981',
          '#d1d5db',
        ],
        borderWidth: 1,
        hoverOffset: 10,
      },
    ],
  }), [evaluados, pendientes]);

  const onChartClick = (event: React.MouseEvent<HTMLCanvasElement>) => {
    const { current: chart } = chartRef;
    if (!chart) return;

    const element = getElementAtEvent(chart, event);
    if (element.length > 0) {
      const { index } = element[0];
      if (index === 1 && pendientes > 0) {
        setShowModal(true);
      }
    }
  };

  const options: ChartOptions<'doughnut'> = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'bottom' as const,
        labels: {
          padding: 20,
          usePointStyle: true,
          font: {
            family: "'Inter', sans-serif",
            size: 12
          }
        }
      },
      tooltip: {
        callbacks: {
          label: (context) => {
            const label = context.label || '';
            const value = context.parsed || 0;
            const percentage = total > 0 ? ((value / total) * 100).toFixed(1) : '0';
            const suffix = label === 'Pendientes' ? ' (Click para ver lista)' : '';
            return `${label}: ${value} (${percentage}%)${suffix}`;
          }
        }
      }
    },
    cutout: '70%',
  };

  return (
    <div className={styles.chartWrapper}>
      <div className={styles.chartHeader}>
        <h3 className={styles.chartTitle}>Cobertura de Evaluación</h3>
        <span className={styles.totalBadge}>Total: {total}</span>
      </div>
      <div className={styles.chartContainer}>
        <Doughnut 
          ref={chartRef}
          data={data} 
          options={options} 
          onClick={onChartClick}
          style={{ cursor: pendientes > 0 ? 'pointer' : 'default' }}
        />
        <div className={styles.centerText}>
          <span className={styles.percentageText}>{porcentajeEvaluados}%</span>
          <span className={styles.subText}>Evaluados</span>
        </div>
      </div>
      <div className={styles.statsGrid}>
        <div className={styles.statItem}>
          <div className={`${styles.statusDot} ${styles.bgEvaluados}`}></div>
          <span className={styles.statLabel}>Realizados</span>
          <span className={styles.statValue}>{evaluados}</span>
        </div>
        <div className={styles.statItem} onClick={() => pendientes > 0 && setShowModal(true)} style={{ cursor: pendientes > 0 ? 'pointer' : 'default' }}>
          <div className={`${styles.statusDot} ${styles.bgPendientes}`}></div>
          <span className={styles.statLabel}>Pendientes</span>
          <span className={styles.statValue}>{pendientes}</span>
          {pendientes > 0 && <span className={styles.viewLink}>Ver lista</span>}
        </div>
      </div>

      {showModal && (
        <div className={styles.modalOverlay} onClick={() => setShowModal(false)}>
          <div className={styles.modalContent} onClick={e => e.stopPropagation()}>
            <div className={styles.modalHeader}>
              <h2 className={styles.modalTitle}>Estudiantes Pendientes de Evaluación</h2>
              <button className={styles.closeButton} onClick={() => setShowModal(false)}>
                <IoClose size={24} />
              </button>
            </div>
            <div className={styles.modalBody}>
              <div className={styles.tableWrapper}>
                <table className={styles.studentsTable}>
                  <thead>
                    <tr>
                      <th>DNI</th>
                      <th>Apellidos y Nombres</th>
                      <th>Grado</th>
                      <th>Sección</th>
                      <th>Género</th>
                    </tr>
                  </thead>
                  <tbody>
                    {listaPendientes.map((est, idx) => (
                      <tr key={est.dni || idx}>
                        <td>{est.dni}</td>
                        <td>{est.nombresApellidos}</td>
                        <td>{getGradoTexto(est.grado)}</td>
                        <td style={{ textTransform: 'uppercase' }}>{getSeccionTexto(est.seccion)}</td>
                        <td>{converGenero(`${est.genero}`) || est.genero}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
            <div className={styles.modalFooter}>
              <span>Mostrando {listaPendientes.length} estudiantes</span>
              <button className={styles.primaryButton} onClick={() => setShowModal(false)}>Cerrar</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CoverageChart;
