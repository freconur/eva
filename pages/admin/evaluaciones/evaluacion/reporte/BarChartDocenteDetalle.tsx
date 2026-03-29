import React, { useMemo, useState, useEffect } from 'react';
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
import styles from './BarChartDocenteDetalle.module.css';
import { useColorsFromCSS } from '@/features/hooks/useColorsFromCSS';
import { regiones } from '@/fuctions/regiones';

ChartJS.register(
    CategoryScale,
    LinearScale,
    BarElement,
    Title,
    Tooltip,
    Legend
);

interface Nivel {
    id: number;
    nivel: string;
    cantidadDeEstudiantes: number;
    color: string;
}

interface TeacherData {
    dniDocente: string;
    nombres: string;
    apellidos: string;
    institucion: string;
    totalEstudiantes: number;
    promedioGlobal: number;
    porcentajeSatisfactorio: number;
    region?: string | number;
    niveles: Nivel[];
}

interface BarChartDocenteDetalleProps {
    data: TeacherData[];
    selectedRange: string;
}

const BarChartDocenteDetalle = ({ data = [], selectedRange }: BarChartDocenteDetalleProps) => {
    const { getNivelColor } = useColorsFromCSS();
    const [pageSize, setPageSize] = useState(10);
    const [currentPage, setCurrentPage] = useState(0);
    const [selectedRegion, setSelectedRegion] = useState<string>('');

    const sortedData = useMemo(() => {
        const filteredData = selectedRegion
            ? data.filter(d => String(d.region) === String(selectedRegion))
            : data;
        return [...filteredData].sort((a, b) => (b.totalEstudiantes || 0) - (a.totalEstudiantes || 0));
    }, [data, selectedRegion]);

    // Resetear a la página 0 si cambia el rango o la data filtrada
    useEffect(() => {
        setCurrentPage(0);
    }, [selectedRange, data.length, sortedData.length]);

    const paginatedData = useMemo(() => {
        const start = currentPage * pageSize;
        return sortedData.slice(start, start + pageSize);
    }, [sortedData, currentPage, pageSize]);

    const totalPages = Math.ceil(sortedData.length / pageSize);

    const chartData = useMemo(() => {
        if (paginatedData.length === 0) return { labels: [], datasets: [] };

        // Definir el orden deseado (mapeo flexible)
        const displayLevels = [
            { key: 'satisfactorio', label: 'Satisfactorio' },
            { key: 'proceso', label: 'En Proceso' },
            { key: 'inicio', label: 'En Inicio' },
            { key: 'previo', label: 'Previo al Inicio' }
        ];

        // Obtener todos los niveles reales presentes en los datos (normalizados a lowercase)
        const actualLevelData = new Set(data.flatMap(t => t.niveles?.map(n => n.nivel.toLowerCase()) || []));

        // Filtrar cuáles de nuestros niveles de interés existen realmente
        const levelsToRender = displayLevels.filter(dl =>
            Array.from(actualLevelData).some(al => al.includes(dl.key))
        );

        const datasets = levelsToRender.map(dl => {
            const colorData = getNivelColor(dl.label);
            return {
                label: dl.label,
                data: paginatedData.map(teacher => {
                    // Mapeo preciso para evitar solapamientos (ej. 'inicio' contenido en 'previo al inicio')
                    const nivelData = teacher.niveles?.find(n => {
                        const ln = n.nivel.toLowerCase();
                        if (dl.key === 'previo') return ln.includes('previo');
                        if (dl.key === 'inicio') return ln.includes('inicio') && !ln.includes('previo');
                        if (dl.key === 'proceso') return ln.includes('proceso');
                        if (dl.key === 'satisfactorio') return ln.includes('satisfactorio');
                        return false;
                    });
                    const cantidad = nivelData ? nivelData.cantidadDeEstudiantes : 0;
                    // Normalizado a 100%
                    return teacher.totalEstudiantes > 0
                        ? (cantidad / teacher.totalEstudiantes) * 100
                        : 0;
                }),
                backgroundColor: colorData.bg,
                borderColor: colorData.border,
                borderWidth: 1,
                barThickness: 25,
            };
        });

        return {
            labels: paginatedData.map(t => `${t.nombres} ${t.apellidos}`),
            datasets: datasets
        };
    }, [paginatedData, getNivelColor]);

    const options = {
        indexAxis: 'y' as const,
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
            legend: {
                position: 'bottom' as const,
                labels: {
                    usePointStyle: true,
                    padding: 20,
                    font: { size: 12, weight: '600' }
                }
            },
            tooltip: {
                backgroundColor: 'rgba(15, 23, 42, 0.95)',
                padding: 12,
                cornerRadius: 8,
                callbacks: {
                    label: (context: any) => {
                        const teacherIndex = context.dataIndex;
                        const teacher = paginatedData[teacherIndex];
                        const label = context.dataset.label;

                        // Usar el mismo mapeo flexible para encontrar el dato real
                        const dl = [
                            { key: 'satisfactorio', label: 'Satisfactorio' },
                            { key: 'proceso', label: 'En Proceso' },
                            { key: 'inicio', label: 'En Inicio' },
                            { key: 'previo', label: 'Previo al Inicio' }
                        ].find(d => d.label === label);

                        const nivelData = teacher.niveles?.find(n => {
                            const ln = n.nivel.toLowerCase();
                            if (!dl) return n.nivel === label;
                            if (dl.key === 'previo') return ln.includes('previo');
                            if (dl.key === 'inicio') return ln.includes('inicio') && !ln.includes('previo');
                            if (dl.key === 'proceso') return ln.includes('proceso');
                            if (dl.key === 'satisfactorio') return ln.includes('satisfactorio');
                            return false;
                        });

                        const cantidad = nivelData ? nivelData.cantidadDeEstudiantes : 0;
                        const percentage = context.raw.toFixed(1);
                        return ` ${label}: ${cantidad} alumnos (${percentage}%)`;
                    },
                    footer: (context: any) => {
                        const teacher = paginatedData[context[0].dataIndex];
                        return `\nTotal: ${teacher.totalEstudiantes} estudiantes\nSatisfactorio: ${teacher.porcentajeSatisfactorio}%`;
                    }
                }
            },
            studentCount: {
                counts: paginatedData.map(t => t.totalEstudiantes)
            }
        },
        layout: {
            padding: {
                right: 70 // Espacio para los badges de estudiantes
            }
        },
        scales: {
            x: {
                stacked: true,
                max: 100,
                title: {
                    display: true,
                    text: 'Distribución Porcentual (%)',
                    font: { weight: 'bold' }
                },
                ticks: {
                    callback: (value: any) => `${value}%`
                }
            },
            y: {
                stacked: true,
                ticks: {
                    font: { size: 11, weight: '700' }
                }
            }
        }
    };

    // Plugin para la línea vertical de meta (ej. 80%)
    const verticalLinePlugin = {
        id: 'verticalLine',
        afterDraw: (chart: any) => {
            const { ctx, chartArea: { top, bottom }, scales: { x } } = chart;
            const xPos = x.getPixelForValue(80);

            ctx.save();
            ctx.beginPath();
            ctx.setLineDash([5, 5]);
            ctx.moveTo(xPos, top);
            ctx.lineTo(xPos, bottom);
            ctx.lineWidth = 2;
            ctx.strokeStyle = '#1e293b';
            ctx.stroke();

            ctx.fillStyle = '#1e293b';
            ctx.font = 'bold 12px sans-serif';
            ctx.textAlign = 'center';
            ctx.fillText('Satisfactorio (80%)', xPos, top - 10);
            ctx.restore();
        }
    };

    const studentCountPlugin = {
        id: 'studentCount',
        afterDraw: (chart: any) => {
            const { ctx, chartArea: { right, top }, scales: { y } } = chart;
            const counts = chart.options.plugins.studentCount?.counts || [];

            ctx.save();

            // Cabecera "Nº Est."
            ctx.fillStyle = '#64748b';
            ctx.font = 'bold 10px sans-serif';
            ctx.textAlign = 'center';
            ctx.fillText('Nº Est.', right + 35, top - 15);

            y.getLabels().forEach((label: string, index: number) => {
                const yPos = y.getPixelForTick(index);
                const count = counts[index] || 0;

                const badgeWidth = 40;
                const badgeHeight = 22;
                const xPos = right + 15;

                // Fondo redondo
                ctx.fillStyle = '#f8fafc';
                ctx.beginPath();
                if ((ctx as any).roundRect) {
                    (ctx as any).roundRect(xPos, yPos - badgeHeight / 2, badgeWidth, badgeHeight, 11);
                } else {
                    ctx.rect(xPos, yPos - badgeHeight / 2, badgeWidth, badgeHeight); // Fallback
                }
                ctx.fill();
                ctx.strokeStyle = '#e2e8f0';
                ctx.lineWidth = 1;
                ctx.stroke();

                // Texto (Persona + Cantidad)
                ctx.fillStyle = '#334155';
                ctx.font = 'bold 11px sans-serif';
                ctx.textAlign = 'center';
                ctx.textBaseline = 'middle';
                ctx.fillText(`👥 ${count}`, xPos + badgeWidth / 2, yPos);
            });
            ctx.restore();
        }
    };

    if (!data || data.length === 0) return null;

    return (
        <div className={styles.container}>
            <div className={styles.header}>
                <div className={styles.titleInfo}>
                    <h3 className={styles.title}>Liderazgo Pedagógico por Docente</h3>
                    <p className={styles.subtitle}>
                        Detalle de niveles para el rango <b>{selectedRange}</b>
                    </p>
                </div>
                <div className={styles.controls}>
                    <div className={styles.pageSizeControl}>
                        <span>Ugel:</span>
                        <select
                            value={selectedRegion}
                            onChange={(e) => {
                                setSelectedRegion(e.target.value);
                                setCurrentPage(0);
                            }}
                            className={styles.select}
                        >
                            <option value="">Todas las Ugel</option>
                            {regiones.map((reg) => (
                                <option key={reg.id} value={reg.id}>
                                    {reg.region}
                                </option>
                            ))}
                        </select>
                    </div>
                    <div className={styles.pageSizeControl}>
                        <span>Mostrar:</span>
                        <select
                            value={pageSize}
                            onChange={(e) => {
                                setPageSize(Number(e.target.value));
                                setCurrentPage(0);
                            }}
                            className={styles.select}
                        >
                            <option value={10}>10</option>
                            <option value={25}>25</option>
                            <option value={50}>50</option>
                        </select>
                    </div>
                    <div className={styles.statsBadge}>
                        <span>Mostrando <b>{paginatedData.length}</b> de <b>{data.length}</b> docentes</span>
                    </div>
                </div>
            </div>

            {paginatedData.length === 0 ? (
                <div className={styles.noData}>No hay docentes evaluados para esta Ugel y rango seleccionado.</div>
            ) : (
                <div className={styles.chartWrapper} style={{ height: `${Math.max(400, paginatedData.length * 55 + 100)}px` }}>
                    <Bar
                        data={chartData as any}
                        options={options as any}
                        plugins={[verticalLinePlugin, studentCountPlugin]}
                    />
                </div>
            )}

            {totalPages > 1 && (
                <div className={styles.pagination}>
                    <button
                        disabled={currentPage === 0}
                        onClick={() => setCurrentPage(prev => prev - 1)}
                        className={styles.pageButton}
                    >
                        Anterior
                    </button>
                    <span className={styles.pageInfo}>
                        Página <b>{currentPage + 1}</b> de <b>{totalPages}</b>
                    </span>
                    <button
                        disabled={currentPage === totalPages - 1}
                        onClick={() => setCurrentPage(prev => prev + 1)}
                        className={styles.pageButton}
                    >
                        Siguiente
                    </button>
                </div>
            )}
        </div>
    );
};

export default BarChartDocenteDetalle;
