import React, { useMemo } from 'react';
import { Bar } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';
import styles from './CardResultadoCriterio.module.css';

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend
);

export interface ScaleItemStat {
  label: string;
  count: number;
}

export interface CardResultadoCriterioProps {
  orderNumber?: number | string;
  criterio?: string;
  dimensionName?: string;
  dimensionColor?: string;
  scaleStats?: ScaleItemStat[];
  stats?: {
    a?: number;
    b?: number;
    c?: number;
    d?: number;
    e?: number;
    f?: number;
    total?: number;
    [key: string]: any;
  };
  escala?: Array<{ descripcion?: string; valor?: number | string }>;
  totalResponses?: number;
  indicatorColor?: string;
  chartHeight?: number;
  className?: string;
}

const DEFAULT_BG_COLORS = [
  'rgba(148, 163, 184, 0.65)', // 1. Slate (En inicio)
  'rgba(96, 165, 250, 0.65)',  // 2. Blue (En desarrollo)
  'rgba(52, 211, 153, 0.65)',  // 3. Emerald (Logrado esperado)
  'rgba(129, 140, 248, 0.65)', // 4. Indigo (Logro destacado)
  'rgba(192, 132, 252, 0.65)', // 5. Purple (Logro innovador)
  'rgba(56, 189, 248, 0.65)',  // 6. Cyan
];

const DEFAULT_BORDER_COLORS = [
  '#64748b',
  '#3b82f6',
  '#10b981',
  '#6366f1',
  '#c084fc',
  '#0284c7',
];

export const CardResultadoCriterio: React.FC<CardResultadoCriterioProps> = ({
  orderNumber,
  criterio = '',
  dimensionName,
  dimensionColor,
  scaleStats,
  stats,
  escala,
  totalResponses,
  indicatorColor = '#38bdf8',
  chartHeight = 240,
  className,
}) => {
  // Resuelve las estadísticas por cada nivel/opción de la escala
  const resolvedScaleStats: ScaleItemStat[] = useMemo(() => {
    if (scaleStats && scaleStats.length > 0) {
      return scaleStats;
    }
    if (escala && escala.length > 0) {
      const keys = ['a', 'b', 'c', 'd', 'e', 'f', 'g'];
      return escala.map((item, idx) => {
        const key = keys[idx] || `opt_${idx}`;
        const val = Number(stats?.[key] ?? 0);
        return {
          label: item.descripcion || `Nivel ${idx + 1}`,
          count: isNaN(val) ? 0 : val,
        };
      });
    }
    return [];
  }, [scaleStats, stats, escala]);

  // Resuelve el total de respuestas recibidas
  const resolvedTotal = useMemo(() => {
    if (totalResponses !== undefined && totalResponses !== null) {
      return totalResponses;
    }
    if (stats?.total !== undefined && stats.total !== null) {
      return Number(stats.total) || 0;
    }
    return resolvedScaleStats.reduce((acc, curr) => acc + curr.count, 0);
  }, [totalResponses, stats, resolvedScaleStats]);

  // Datos estructurados para ChartJS
  const chartData = useMemo(() => {
    const labels = resolvedScaleStats.map((s) => s.label);
    const data = resolvedScaleStats.map((s) => s.count);

    return {
      labels,
      datasets: [
        {
          label: 'Respuestas',
          data,
          backgroundColor: resolvedScaleStats.map(
            (_, idx) => DEFAULT_BG_COLORS[idx % DEFAULT_BG_COLORS.length]
          ),
          borderColor: resolvedScaleStats.map(
            (_, idx) => DEFAULT_BORDER_COLORS[idx % DEFAULT_BORDER_COLORS.length]
          ),
          borderWidth: 1,
          borderRadius: 4,
        },
      ],
    };
  }, [resolvedScaleStats]);

  // Opciones de configuración del gráfico de barras
  const chartOptions = useMemo(() => {
    const truncatedTitle =
      criterio && criterio.length > 50
        ? `Resultados: ${criterio.substring(0, 50)}...`
        : `Resultados: ${criterio || ''}`;

    return {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          display: false,
        },
        title: {
          display: true,
          text: truncatedTitle,
          color: '#64748b',
          font: {
            family: "'Montserrat', sans-serif",
            size: 11,
            weight: 600,
          },
          padding: {
            bottom: 12,
          },
        },
        tooltip: {
          callbacks: {
            label: (ctx: any) => {
              const count = ctx.parsed?.y ?? ctx.parsed ?? 0;
              const pct = resolvedTotal > 0 ? ((count / resolvedTotal) * 100).toFixed(1) : '0';
              return ` ${count} ${count === 1 ? 'respuesta' : 'respuestas'} (${pct}%)`;
            },
          },
        },
      },
      scales: {
        x: {
          grid: {
            display: false,
          },
          ticks: {
            font: {
              family: "'Montserrat', sans-serif",
              size: 10,
            },
            color: '#64748b',
          },
        },
        y: {
          beginAtZero: true,
          grid: {
            color: '#f1f5f9',
          },
          ticks: {
            precision: 0,
            font: {
              family: "'Montserrat', sans-serif",
              size: 10,
            },
            color: '#64748b',
          },
        },
      },
    };
  }, [criterio, resolvedTotal]);

  return (
    <div className={`${styles.card} ${className || ''}`.trim()}>
      {/* Cabecera con número, indicador y texto del criterio */}
      <div className={styles.header}>
        <div className={styles.titleRow}>
          <span
            className={styles.indicator}
            style={{ background: indicatorColor }}
          />
          {orderNumber !== undefined && orderNumber !== null && (
            <span className={styles.orderNumber}>{orderNumber}.</span>
          )}
          <h3 className={styles.criterioText}>{criterio}</h3>
        </div>

        {dimensionName && (
          <span
            className={styles.domainBadge}
            style={{
              color: dimensionColor || '#0284c7',
              background: dimensionColor ? `${dimensionColor}1f` : '#e0f2fe',
            }}
          >
            {dimensionName}
          </span>
        )}
      </div>

      {/* Gráfico de Barras */}
      <div className={styles.chartWrapper} style={{ height: `${chartHeight}px` }}>
        <Bar data={chartData} options={chartOptions as any} />
      </div>

      {/* Cuadrícula de estadísticas numéricas por cada nivel */}
      {resolvedScaleStats.length > 0 && (
        <div className={styles.statsGrid}>
          {resolvedScaleStats.map((item, idx) => (
            <div key={`${item.label}-${idx}`} className={styles.statItem}>
              <span className={styles.statLabel} title={item.label}>
                {item.label}
              </span>
              <span className={styles.statValue}>{item.count}</span>
            </div>
          ))}
        </div>
      )}

      {/* Insignia de total de respuestas */}
      <div className={styles.totalBadge}>
        Total: {resolvedTotal} {resolvedTotal === 1 ? 'respuesta' : 'respuestas'}
      </div>
    </div>
  );
};

export default CardResultadoCriterio;
