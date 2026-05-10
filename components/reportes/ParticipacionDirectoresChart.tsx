import React from 'react';
import { Doughnut } from 'react-chartjs-2';
import {
    Chart as ChartJS,
    ArcElement,
    Tooltip as ChartTooltip,
    Legend as ChartLegend
} from 'chart.js';
import styles from './ParticipacionDirectoresChart.module.css';

ChartJS.register(ArcElement, ChartTooltip, ChartLegend);

interface DirectorData {
    dniDirector: string;
    participo: boolean;
}

interface ParticipacionDirectoresChartProps {
    data: any[];
    onSegmentClick?: (status: 'participo' | 'no_participo') => void;
}

const ParticipacionDirectoresChart = ({ data = [], onSegmentClick }: ParticipacionDirectoresChartProps) => {
    const participaron = data.filter(d => !!d.participo || (d.totalEstudiantes > 0)).length;
    const total = data.length;
    const noParticiparon = total - participaron;
    const porcentaje = total > 0 ? Math.round((participaron / total) * 100) : 0;

    // Plugin para dibujar el texto en el centro y que no tape los tooltips
    const centerTextPlugin = {
        id: 'centerText',
        beforeDraw: (chart: any) => {
            const { ctx, chartArea: { top, width, height } } = chart;
            ctx.save();
            const centerX = chart.getDatasetMeta(0).data[0].x;
            const centerY = chart.getDatasetMeta(0).data[0].y;
            
            // Dibujar Porcentaje
            ctx.font = 'bold 32px Inter, sans-serif';
            ctx.fillStyle = '#0f172a';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText(`${porcentaje}%`, centerX, centerY - 10);
            
            // Dibujar "COBERTURA"
            ctx.font = 'bold 12px Inter, sans-serif';
            ctx.fillStyle = '#64748b';
            ctx.fillText('COBERTURA', centerX, centerY + 20);
            
            ctx.restore();
        }
    };

    if (total === 0) {
        return (
            <div className={styles.chartContainer}>
                <h3 className={styles.title}>Participación de Directores</h3>
                <div style={{ display: 'flex', flex: 1, alignItems: 'center', color: '#94a3b8' }}>Sin datos</div>
            </div>
        );
    }

    const chartData = {
        labels: ['Participaron', 'No Participaron'],
        datasets: [
            {
                data: [participaron, noParticiparon],
                backgroundColor: ['#22c55e', '#f1f5f9'],
                hoverBackgroundColor: ['#16a34a', '#e2e8f0'],
                borderWidth: 0,
                cutout: '75%',
                borderRadius: participaron === 0 || noParticiparon === 0 ? 0 : 20,
                spacing: 2
            },
        ],
    };

    const options = {
        plugins: {
            legend: { display: false },
            tooltip: {
                enabled: true,
                backgroundColor: '#0f172a',
                padding: 12,
                cornerRadius: 10,
                z: 999, // Intentar forzar z-index en el motor de renderizado
                callbacks: {
                    label: (context: any) => ` ${context.label}: ${context.parsed} (${((context.parsed / total) * 100).toFixed(1)}%)`
                }
            },
        },
        maintainAspectRatio: false,
        responsive: true,
        onClick: (event: any, elements: any) => {
            if (elements && elements.length > 0 && onSegmentClick) {
                onSegmentClick(elements[0].index === 0 ? 'participo' : 'no_participo');
            }
        },
        onHover: (event: any, elements: any) => {
            if (event.native) {
                event.native.target.style.cursor = elements && elements.length > 0 ? 'pointer' : 'default';
            }
        }
    };

    return (
        <div className={styles.chartContainer}>
            <h3 className={styles.title}>Participación de Directores</h3>
            
            <div className={styles.canvasWrapper}>
                <Doughnut 
                    data={chartData} 
                    options={options as any} 
                    plugins={[centerTextPlugin]} 
                />
            </div>

            <div className={styles.legend}>
                <div 
                    className={`${styles.legendCard} ${styles.success}`}
                    onClick={() => onSegmentClick && onSegmentClick('participo')}
                    style={{ cursor: 'pointer' }}
                >
                    <span className={styles.label}>Participaron</span>
                    <span className={styles.count}>{participaron}</span>
                    <span className={styles.cardPercentage}>{porcentaje}% del total</span>
                </div>
                <div 
                    className={`${styles.legendCard} ${styles.warning}`}
                    onClick={() => onSegmentClick && onSegmentClick('no_participo')}
                    style={{ cursor: 'pointer' }}
                >
                    <span className={styles.label}>No Participaron</span>
                    <span className={styles.count}>{noParticiparon}</span>
                    <span className={styles.cardPercentage}>{total > 0 ? (100 - porcentaje) : 0}% del total</span>
                </div>
            </div>

            <div className={styles.summary}>
                <span>Universo Directores</span>
                <span className={styles.totalValue}>{total}</span>
            </div>
        </div>
    );
};

export default ParticipacionDirectoresChart;
