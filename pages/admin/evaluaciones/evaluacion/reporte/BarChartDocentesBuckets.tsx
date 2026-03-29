import React, { useMemo } from 'react';
import {
    Chart as ChartJS,
    CategoryScale,
    LinearScale,
    BarElement,
    Title,
    Tooltip,
    Legend,
} from 'chart.js';
import { Bar } from 'react-chartjs-2';
import styles from './BarChartDocentesBuckets.module.css';

ChartJS.register(
    CategoryScale,
    LinearScale,
    BarElement,
    Title,
    Tooltip,
    Legend
);

interface BucketData {
    rango: string;
    cantidad: number;
    color: string;
}

interface BarChartDocentesBucketsProps {
    data: BucketData[];
    totalDocentes?: number;
    onBarClick?: (range: string) => void;
}

const BarChartDocentesBuckets = ({ data = [], totalDocentes = 0, onBarClick }: BarChartDocentesBucketsProps) => {
    const chartData = useMemo(() => {
        return {
            labels: data.map(item => item.rango),
            datasets: [
                {
                    label: 'Cantidad de Docentes',
                    data: data.map(item => item.cantidad),
                    backgroundColor: data.map(item => item.color),
                    borderColor: data.map(item => item.color.replace('0.8', '1')),
                    borderWidth: 1,
                    borderRadius: 8,
                    barThickness: 50,
                },
            ],
        };
    }, [data]);

    const options = {
        responsive: true,
        maintainAspectRatio: false,
        interaction: {
            mode: 'index' as const,
            intersect: false,
        },
        onClick: (event: any, elements: any) => {
            if (elements && elements.length > 0 && onBarClick) {
                const index = elements[0].index;
                onBarClick(data[index].rango);
            }
        },
        onHover: (event: any, elements: any) => {
            if (event.native) {
                event.native.target.style.cursor = elements && elements.length > 0 ? 'pointer' : 'default';
            }
        },
        plugins: {
            legend: {
                display: false,
            },
            title: {
                display: false,
            },
            tooltip: {
                backgroundColor: 'rgba(15, 23, 42, 0.95)',
                padding: 12,
                cornerRadius: 8,
                callbacks: {
                    label: (context: any) => {
                        const value = context.raw;
                        const percentage = totalDocentes > 0
                            ? ((value / totalDocentes) * 100).toFixed(1)
                            : '0';
                        return ` Docentes: ${value} (${percentage}%)`;
                    }
                }
            }
        },
        scales: {
            y: {
                beginAtZero: true,
                grid: {
                    color: 'rgba(0, 0, 0, 0.05)',
                },
                ticks: {
                    font: {
                        size: 12,
                        weight: '600',
                    }
                }
            },
            x: {
                grid: {
                    display: false,
                },
                ticks: {
                    font: {
                        size: 12,
                        weight: '700',
                    }
                }
            }
        }
    };

    if (!data || data.length === 0) return null;

    return (
        <div className={styles.chartContainer}>
            <div className={styles.header}>
                <div className={styles.titleInfo}>
                    <h3 className={styles.title}>Distribución de Docentes</h3>
                    <p className={styles.subtitle}>
                        Basado en el % de estudiantes en nivel <b>Satisfactorio</b>
                    </p>
                </div>
                {totalDocentes > 0 && (
                    <div className={styles.totalBadge}>
                        <span>Total: <b>{totalDocentes}</b></span>
                    </div>
                )}
            </div>
            <div className={styles.canvasWrapper}>
                <Bar data={chartData} options={options as any} />
            </div>
            <div className={styles.footer}>
                <div className={styles.legend}>
                    {data.map((item, idx) => (
                        <div key={idx} className={styles.legendItem}>
                            <span className={styles.dot} style={{ backgroundColor: item.color }}></span>
                            <span className={styles.rank}>{item.rango}</span>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};

export default BarChartDocentesBuckets;
