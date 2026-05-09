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
import styles from './BarChartUgelStacked.module.css';
import { useHighQualityChartOptions } from '@/features/hooks/useHighQualityChartOptions';
import { useColorsFromCSS } from '@/features/hooks/useColorsFromCSS';
import { GraficoUgelStacked } from '@/features/types/types';

ChartJS.register(
    CategoryScale,
    LinearScale,
    BarElement,
    Title,
    Tooltip,
    Legend
);

interface BarChartUgelStackedProps {
    data: GraficoUgelStacked[];
}

const BarChartUgelStacked = ({ data = [] }: BarChartUgelStackedProps) => {
    const { getNivelColor } = useColorsFromCSS();

    const options = useHighQualityChartOptions({
        chartType: 'bar',
        title: 'Comparativa de Niveles por UGEL (%)',
        showLegend: true,
        legendPosition: 'bottom',
    });

    // Ordenar UGELs por porcentaje del nivel satisfactorio (Descendente)
    const sortedData = useMemo(() => {
        if (!data || !Array.isArray(data)) return [];
        return [...data].sort((a, b) => {
            const getSatPerc = (ugel: GraficoUgelStacked) => {
                const niveles = ugel?.niveles || [];
                const total = niveles.reduce((sum, n) => sum + (n.cantidadDeEstudiantes || 0), 0);
                if (total === 0) return 0;
                
                const satData = niveles.find(n => 
                    (n.nivel || '').toLowerCase().includes('satisfactorio')
                );
                return (satData?.cantidadDeEstudiantes || 0) / total;
            };
            
            // Orden descendente (mejor primero)
            return getSatPerc(b) - getSatPerc(a);
        });
    }, [data]);

    const chartData = useMemo(() => {
        if (sortedData.length === 0) return { labels: [], datasets: [] };

        // Obtener todos los niveles únicos (Satisfactorio, Proceso, etc.)
        const uniqueLevels = new Set<string>();
        sortedData.forEach(ugel => {
            if (ugel?.niveles && Array.isArray(ugel.niveles)) {
                ugel.niveles.forEach(n => {
                    if (n?.nivel) uniqueLevels.add(n.nivel);
                });
            }
        });

        const labels = sortedData.map(u => (u?.ugel || '').toUpperCase());

        const datasets = Array.from(uniqueLevels).map(levelName => {
            const colorData = getNivelColor(levelName);
            return {
                label: levelName,
                data: sortedData.map(ugel => {
                    const nivelData = ugel?.niveles?.find(n => n.nivel === levelName);
                    return nivelData ? nivelData.cantidadDeEstudiantes : 0;
                }),
                backgroundColor: colorData.bg,
                borderColor: colorData.border,
                borderWidth: 1,
                barThickness: 25,
            };
        });

        return {
            labels,
            datasets,
        };
    }, [sortedData, getNivelColor]);

    const customOptions = useMemo(() => {
        return {
            ...options,
            indexAxis: 'y' as const,
            interaction: {
                mode: 'index' as const,
                intersect: false,
                axis: 'y' as const,
            },
            plugins: {
                ...options.plugins,
                tooltip: {
                    ...options.plugins?.tooltip,
                    backgroundColor: 'rgba(15, 23, 42, 0.95)',
                    padding: 12,
                    footerFont: {
                        size: 13,
                        weight: 'bold',
                    },
                    footerSpacing: 8,
                    footerMarginTop: 10,
                    callbacks: {
                        label: (context: any) => {
                            const datasetLabel = context.dataset.label || '';
                            const value = context.parsed.x;
                            if (value === 0) return null;
                            const ugelIndex = context.dataIndex;
                            const ugelData = sortedData[ugelIndex];
                            if (!ugelData || !ugelData.niveles) return `  • ${datasetLabel}: ${value}`;
                            
                            const total = ugelData.niveles.reduce((sum, n) => sum + n.cantidadDeEstudiantes, 0);
                            const percentage = total > 0 ? ((value / total) * 100).toFixed(1) : '0';
                            return `  • ${datasetLabel}: ${value} (${percentage}%)`;
                        },
                        footer: (context: any) => {
                            const ugelIndex = context[0].dataIndex;
                            const ugelData = sortedData[ugelIndex];
                            if (!ugelData || !ugelData.niveles) return '';
                            const total = ugelData.niveles.reduce((sum, n) => sum + n.cantidadDeEstudiantes, 0);
                            return `\nTotal Evaluados: ${total.toLocaleString('es-PE')}`;
                        }
                    }
                }
            },
            scales: {
                x: {
                    stacked: true,
                    beginAtZero: true,
                    grid: {
                        display: false,
                    },
                    title: {
                        display: true,
                        text: 'Cantidad de Estudiantes',
                        font: { size: 12, weight: 'bold' }
                    }
                },
                y: {
                    stacked: true,
                    grid: {
                        display: false,
                    },
                    ticks: {
                        font: { size: 11, weight: '600' }
                    }
                }
            }
        };
    }, [options, data]);

    if (!data || data.length === 0) return null;

    return (
        <div className={styles.container}>
            <div className={styles.chartWrapper} style={{ height: `${data.length * 45 + 120}px`, minHeight: '400px' }}>
                <Bar data={chartData} options={customOptions as any} />
            </div>
        </div>
    );
};

export default BarChartUgelStacked;
