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
import styles from './BarChartDirectores.module.css';
import { useHighQualityChartOptions } from '@/features/hooks/useHighQualityChartOptions';
import { useColorsFromCSS } from '@/features/hooks/useColorsFromCSS';

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

interface DirectorData {
    dniDirector: string;
    nombres: string;
    apellidos: string;
    institucion: string;
    totalEstudiantes: number;
    promedioGlobal: number;
    niveles: Nivel[];
}

interface BarChartDirectoresProps {
    data: DirectorData[];
}

const BarChartDirectores = ({ data = [] }: BarChartDirectoresProps) => {
    const { getNivelColor } = useColorsFromCSS();
    const [currentPage, setCurrentPage] = React.useState(0);
    const [sortBy, setSortBy] = React.useState<'promedio' | 'evaluados' | 'satisfactorios' | 'impacto'>('promedio');
    const [itemsPerPage, setItemsPerPage] = React.useState(25);

    // Helper para obtener conteo de satisfactorios de forma robusta
    const getSatisfactorioCount = (director: DirectorData) => {
        const satNivel = director.niveles.find(n =>
            n.nivel.toLowerCase().includes('satisfactorio')
        );
        return satNivel ? satNivel.cantidadDeEstudiantes : 0;
    };

    // Algoritmo de Impacto: Logaritmo de volumen * Promedio
    const getImpactScore = (director: DirectorData) => {
        return director.promedioGlobal * Math.log10(1 + director.totalEstudiantes);
    };

    // Aplicar ordenamiento dinámico con desempates lógicos predefinidos
    const sortedData = useMemo(() => {
        return [...data].sort((a, b) => {
            const aSat = getSatisfactorioCount(a);
            const bSat = getSatisfactorioCount(b);
            const aImpact = getImpactScore(a);
            const bImpact = getImpactScore(b);

            if (sortBy === 'promedio') {
                return (b.promedioGlobal - a.promedioGlobal) || (bImpact - aImpact) || (bSat - aSat);
            }
            if (sortBy === 'evaluados') {
                return (b.totalEstudiantes - a.totalEstudiantes) || (b.promedioGlobal - a.promedioGlobal) || (bSat - aSat);
            }
            if (sortBy === 'satisfactorios') {
                return (bSat - aSat) || (b.promedioGlobal - a.promedioGlobal) || (b.totalEstudiantes - a.totalEstudiantes);
            }
            if (sortBy === 'impacto') {
                return (bImpact - aImpact) || (b.promedioGlobal - a.promedioGlobal) || (b.totalEstudiantes - a.totalEstudiantes);
            }
            return 0;
        });
    }, [data, sortBy]);

    const totalPages = Math.ceil(sortedData.length / itemsPerPage);

    const isPromedioMode = sortBy === 'promedio' || sortBy === 'impacto';
    const isImpactMode = sortBy === 'impacto';

    const paginatedData = useMemo(() => {
        const start = currentPage * itemsPerPage;
        return sortedData.slice(start, start + itemsPerPage);
    }, [sortedData, currentPage, itemsPerPage]);

    const options = useHighQualityChartOptions({
        chartType: 'bar',
        title: 'Desempeño por Institución (Distribución de Niveles)',
        showLegend: true,
        legendPosition: 'bottom',
    });



    const chartData = useMemo(() => {
        if (isPromedioMode || isImpactMode) {
            return {
                labels: paginatedData.map((d) => d.dniDirector),
                datasets: [{
                    label: isImpactMode ? 'Puntaje de Impacto' : 'Promedio Global',
                    data: paginatedData.map(d => isImpactMode ? getImpactScore(d) : d.promedioGlobal),
                    backgroundColor: isImpactMode ? 'rgba(79, 70, 229, 0.8)' : 'rgba(59, 130, 246, 0.8)',
                    borderColor: isImpactMode ? 'rgb(79, 70, 229)' : 'rgb(59, 130, 246)',
                    borderWidth: 1,
                    barThickness: 22,
                    categoryPercentage: 0.85,
                }]
            };
        }

        // Encontrar todos los niveles únicos presentes en la data paginada
        const uniqueLevels = new Map<string, { name: string }>();
        paginatedData.forEach(director => {
            director.niveles.forEach(n => {
                if (!uniqueLevels.has(n.nivel)) {
                    uniqueLevels.set(n.nivel, { name: n.nivel });
                }
            });
        });

        const datasets = Array.from(uniqueLevels.values()).map(levelInfo => {
            const colorData = getNivelColor(levelInfo.name);
            return {
                label: levelInfo.name,
                data: paginatedData.map(director => {
                    const nivelData = director.niveles.find(n => n.nivel === levelInfo.name);
                    return nivelData ? nivelData.cantidadDeEstudiantes : 0;
                }),
                backgroundColor: colorData.bg,
                borderColor: colorData.border,
                borderWidth: 1,
                barThickness: 22,
                categoryPercentage: 0.85,
            };
        });

        return {
            labels: paginatedData.map((d) => d.dniDirector),
            datasets: datasets,
        };
    }, [paginatedData, sortBy, getNivelColor, isPromedioMode, isImpactMode]);

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
                legend: {
                    ...options.plugins?.legend,
                    display: !isPromedioMode, // Solo mostrar leyenda en modo distribución
                },
                tooltip: {
                    ...options.plugins?.tooltip,
                    backgroundColor: 'rgba(15, 23, 42, 0.98)',
                    padding: 16,
                    cornerRadius: 12,
                    displayColors: true,
                    boxPadding: 8,
                    callbacks: {
                        title: (context: any) => {
                            const index = context[0].dataIndex;
                            const item = paginatedData[index];
                            return `👤 Director: ${item.nombres} ${item.apellidos}`;
                        },
                        beforeBody: (context: any) => {
                            const index = context[0].dataIndex;
                            const item = paginatedData[index];
                            const impact = getImpactScore(item).toFixed(2);
                            let text = `🏫 Institución: ${item.institucion}\n🆔 DNI: ${item.dniDirector}\n🚀 Impacto: ${impact}\n📊 Promedio Global: ${item.promedioGlobal}\n👥 Total Evaluados: ${item.totalEstudiantes}\n`;

                            // Si estamos en modo promedio o impacto, los niveles no están en el dataset gráfico,
                            // así que los añadimos manualmente al cuerpo del tooltip.
                            if (isPromedioMode || isImpactMode) {
                                text += '\n📌 Distribución por Niveles:';
                                item.niveles.forEach(n => {
                                    if (n.cantidadDeEstudiantes > 0) {
                                        const perc = ((n.cantidadDeEstudiantes / item.totalEstudiantes) * 100).toFixed(1);
                                        text += `\n  • ${n.nivel}: ${n.cantidadDeEstudiantes} (${perc}%)`;
                                    }
                                });
                            }
                            return text;
                        },
                        label: (context: any) => {
                            if (isPromedioMode || isImpactMode) return null; // No repetir el label individual en estos modos

                            const datasetLabel = context.dataset.label || '';
                            const value = context.parsed.x;
                            if (value === 0) return null;

                            const index = context.dataIndex;
                            const item = paginatedData[index];
                            const total = item.totalEstudiantes;
                            const percentage = total > 0 ? ((value / total) * 100).toFixed(1) : '0';

                            return `  • ${datasetLabel}: ${value} (${percentage}%)`;
                        },
                    },
                },
            },
            scales: {
                x: {
                    stacked: !(isPromedioMode || isImpactMode),
                    beginAtZero: true,
                    grid: {
                        display: true,
                        color: 'rgba(0, 0, 0, 0.05)',
                    },
                    ticks: {
                        font: {
                            size: 11, weight: '600' as const,
                        },
                    },
                    title: {
                        display: true,
                        text: isImpactMode ? 'Índice de Impacto (Promedio x Volumen)' : (isPromedioMode ? 'Puntaje Promedio Global' : 'Cantidad de Estudiantes'),
                        font: { size: 12, weight: '700' as const }
                    }
                },
                y: {
                    stacked: !(isPromedioMode || isImpactMode),
                    grid: {
                        display: false,
                    },
                    ticks: {
                        font: {
                            size: 10, weight: '500' as const,
                        },
                    }
                },
            },
        };
    }, [options, paginatedData, isPromedioMode, sortBy]);

    const handleNext = () => {
        if (currentPage < totalPages - 1) {
            setCurrentPage(prev => prev + 1);
        }
    };

    const handlePrev = () => {
        if (currentPage > 0) {
            setCurrentPage(prev => prev - 1);
        }
    };

    if (!data || data.length === 0) {
        return null;
    }

    return (
        <div className={styles.container}>
            <div className={styles.header}>
                <div className={styles.titleWrapper}>
                    <h2 className={styles.title}>Desempeño por Institución</h2>
                    <p className={styles.subtitle}>{data.length} directores registrados</p>
                </div>

                <div className={styles.controlsRow}>
                    {totalPages > 1 && (
                        <div className={styles.pagination}>
                            <div className={styles.rowsPerPageContainer}>
                                <span>Ver:</span>
                                <select
                                    className={styles.rowsPerPageSelect}
                                    value={itemsPerPage}
                                    onChange={(e) => {
                                        setItemsPerPage(Number(e.target.value));
                                        setCurrentPage(0);
                                    }}
                                >
                                    <option value={10}>10</option>
                                    <option value={25}>25</option>
                                    <option value={50}>50</option>
                                </select>
                            </div>
                            <button
                                onClick={handlePrev}
                                disabled={currentPage === 0}
                                className={styles.pageButton}
                                title="Página anterior"
                            >
                                ←
                            </button>
                            <span className={styles.pageInfo}>
                                {currentPage + 1} / {totalPages}
                            </span>
                            <button onClick={handleNext} disabled={currentPage === totalPages - 1} className={styles.pageButton} title="Siguiente">
                                &gt;
                            </button>
                        </div>
                    )}

                    <div className={styles.sortContainer}>
                        <div className={styles.sortButtons}>
                            <button
                                onClick={() => { setSortBy('promedio'); setCurrentPage(0); }}
                                className={`${styles.sortButton} ${sortBy === 'promedio' ? styles.sortButtonActive : ''}`}
                                title="Ordenar por Promedio Académico"
                            >
                                ⭐ Promedio
                            </button>
                            <button
                                onClick={() => { setSortBy('evaluados'); setCurrentPage(0); }}
                                className={`${styles.sortButton} ${sortBy === 'evaluados' ? styles.sortButtonActive : ''}`}
                                title="Ordenar por Cantidad de Evaluados"
                            >
                                👥 Evaluados
                            </button>
                            <button
                                onClick={() => { setSortBy('satisfactorios'); setCurrentPage(0); }}
                                className={`${styles.sortButton} ${sortBy === 'satisfactorios' ? styles.sortButtonActive : ''}`}
                                title="Ordenar por Nivel Satisfactorio"
                            >
                                🏆 Satisfactorios
                            </button>
                            <div className={styles.impactWrapper}>
                                <button
                                    onClick={() => { setSortBy('impacto'); setCurrentPage(0); }}
                                    className={`${styles.sortButton} ${sortBy === 'impacto' ? styles.sortButtonActive : ''}`}
                                    title="Ordenar por Índice de Impacto Estratégico"
                                >
                                    🚀 Impacto
                                </button>
                                <div className={styles.infoTooltip}>
                                    <b>Modo Impacto</b>
                                    Métrica estratégica que equilibra el rendimiento académico (Promedio) con el volumen de estudiantes.
                                    Este índice identifica el éxito a gran escala, evitando que directores con pocos alumnos dominen el ranking.
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
            <div className={styles.chartWrapper} style={{ height: `${Math.max(400, paginatedData.length * 45 + 100)}px` }}>
                <Bar data={chartData} options={customOptions as any} />
            </div>
        </div >
    );
};

export default BarChartDirectores;
