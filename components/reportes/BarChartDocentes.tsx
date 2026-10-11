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
import styles from './BarChartDocentes.module.css';
import { useHighQualityChartOptions } from '@/features/hooks/useHighQualityChartOptions';
import { useColorsFromCSS } from '@/features/hooks/useColorsFromCSS';
import { regiones } from '@/fuctions/regiones';
import { NivelYPuntaje } from '@/features/types/types';
import { RiFullscreenLine, RiCloseLine, RiSearchLine, RiUserStarLine, RiInformationLine, RiArrowRightLine } from 'react-icons/ri';
import { createPortal } from 'react-dom';

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

interface BarChartDocentesProps {
    data: TeacherData[];
    nivelYPuntaje?: NivelYPuntaje[];
    canChangeRegion?: boolean;
    initialRegion?: string;
}

const BarChartDocentes = ({
    data = [],
    nivelYPuntaje = [],
    canChangeRegion = true,
    initialRegion = ''
}: BarChartDocentesProps) => {
    const { getNivelColor } = useColorsFromCSS();
    const [currentPage, setCurrentPage] = React.useState(0);
    const [sortBy, setSortBy] = React.useState<'promedio' | 'evaluados' | 'satisfactorios' | 'impacto'>('promedio');
    const [itemsPerPage, setItemsPerPage] = React.useState(10);
    const [selectedRegion, setSelectedRegion] = React.useState<string>(() => {
        return !canChangeRegion && initialRegion ? String(initialRegion) : '';
    });
    const [minStudents, setMinStudents] = React.useState<number | string>(1);
    const [selectedLevel, setSelectedLevel] = React.useState<string>('');
    const [searchTerm, setSearchTerm] = React.useState('');
    const [isExpanded, setIsExpanded] = React.useState(false);
    const [mounted, setMounted] = React.useState(false);

    React.useEffect(() => {
        if (!canChangeRegion && initialRegion) {
            setSelectedRegion(String(initialRegion));
        }
    }, [canChangeRegion, initialRegion]);

    React.useEffect(() => {
        setMounted(true);
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'Escape' && isExpanded) {
                setIsExpanded(false);
            }
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [isExpanded]);

    React.useEffect(() => {
        if (isExpanded) {
            document.body.style.overflow = 'hidden';
        } else {
            document.body.style.overflow = '';
            setItemsPerPage(10);
            setCurrentPage(0);
            setSearchTerm('');
            setSelectedRegion(!canChangeRegion && initialRegion ? String(initialRegion) : '');
            setMinStudents(1);
            setSelectedLevel('');
            setSortBy('promedio');
        }
        return () => {
            document.body.style.overflow = '';
        };
    }, [isExpanded, canChangeRegion, initialRegion]);

    // Algoritmo de Impacto: Logaritmo de volumen * Promedio
    const getImpactScore = (teacher: TeacherData) => {
        return teacher.promedioGlobal * Math.log10(1 + (teacher.totalEstudiantes || 0));
    };

    const sortedData = useMemo(() => {
        if (!Array.isArray(data)) return [];

        const threshold = Number(minStudents) || 0;

        // 1. Filtrar por región, por nivel global, por umbral mínimo de estudiantes y por término de búsqueda
        const filteredData = data.filter(d => {
            const matchRegion = selectedRegion ? String(d.region) === String(selectedRegion) : true;
            const matchMin = (d.totalEstudiantes || 0) >= threshold;
            
            let matchLevel = true;
            if (selectedLevel) {
                const targetLevel = nivelYPuntaje.find(n => n.nivel === selectedLevel);
                if (targetLevel) {
                    const minVal = targetLevel.min ?? 0;
                    const maxVal = targetLevel.max ?? Number.MAX_SAFE_INTEGER;
                    matchLevel = d.promedioGlobal >= minVal && d.promedioGlobal <= maxVal;
                } else {
                    matchLevel = false;
                }
            }

            let matchSearch = true;
            if (searchTerm.trim() !== '') {
                const term = searchTerm.toLowerCase().trim();
                const dni = d.dniDocente ? String(d.dniDocente).toLowerCase() : '';
                const nombres = d.nombres ? String(d.nombres).toLowerCase() : '';
                const apellidos = d.apellidos ? String(d.apellidos).toLowerCase() : '';
                const fullname = `${nombres} ${apellidos}`;
                const inst = d.institucion ? String(d.institucion).toLowerCase() : '';
                
                matchSearch = 
                    dni.includes(term) || 
                    nombres.includes(term) || 
                    apellidos.includes(term) || 
                    fullname.includes(term) ||
                    inst.includes(term);
            }
            
            return matchRegion && matchMin && matchLevel && matchSearch;
        });

        // 2. Ordenar datos filtrados
        return [...filteredData].sort((a, b) => {
            const aImpact = getImpactScore(a);
            const bImpact = getImpactScore(b);

            if (sortBy === 'promedio') {
                return (b.promedioGlobal - a.promedioGlobal) || (bImpact - aImpact) || (b.porcentajeSatisfactorio - a.porcentajeSatisfactorio);
            }
            if (sortBy === 'evaluados') {
                return (b.totalEstudiantes - a.totalEstudiantes) || (b.promedioGlobal - a.promedioGlobal) || (b.porcentajeSatisfactorio - a.porcentajeSatisfactorio);
            }
            if (sortBy === 'satisfactorios') {
                return (b.porcentajeSatisfactorio - a.porcentajeSatisfactorio) || (b.promedioGlobal - a.promedioGlobal) || (b.totalEstudiantes - a.totalEstudiantes);
            }
            if (sortBy === 'impacto') {
                return (bImpact - aImpact) || (b.promedioGlobal - a.promedioGlobal) || (b.totalEstudiantes - a.totalEstudiantes);
            }
            return 0;
        });
    }, [data, sortBy, selectedRegion, minStudents, selectedLevel, nivelYPuntaje, searchTerm]);

    const totalPages = Math.ceil(sortedData.length / itemsPerPage);

    const isPromedioMode = sortBy === 'promedio' || sortBy === 'impacto';
    const isImpactMode = sortBy === 'impacto';

    const paginatedData = useMemo(() => {
        const start = currentPage * itemsPerPage;
        return sortedData.slice(start, start + itemsPerPage);
    }, [sortedData, currentPage, itemsPerPage]);

    const rankingOffset = currentPage * itemsPerPage;
    const rankingLabels = paginatedData.map((_, index) => `${rankingOffset + index + 1}`);

    const options = useHighQualityChartOptions({
        chartType: 'bar',
        title: 'Desempeño por Docente (Distribución de Niveles)',
        showLegend: true,
        legendPosition: 'bottom',
    });

    const chartData = useMemo(() => {
        if (isPromedioMode || isImpactMode) {
            return {
                labels: rankingLabels,
                datasets: [{
                    label: isImpactMode ? 'Puntaje de Impacto' : 'Promedio Global',
                    data: paginatedData.map(d => isImpactMode ? getImpactScore(d) : d.promedioGlobal),
                    backgroundColor: isImpactMode ? 'rgba(14, 165, 233, 0.88)' : 'rgba(16, 185, 129, 0.88)',
                    borderColor: isImpactMode ? 'rgb(2, 132, 199)' : 'rgb(5, 150, 105)',
                    borderWidth: 1.5,
                    borderRadius: 8,
                    barPercentage: 0.76,
                    categoryPercentage: 0.84,
                }]
            };
        }

        // Encontrar todos los niveles únicos presentes en la data paginada
        const uniqueLevels = new Map<string, { name: string }>();
        paginatedData.forEach(teacher => {
            teacher.niveles?.forEach(n => {
                if (!uniqueLevels.has(n.nivel)) {
                    uniqueLevels.set(n.nivel, { name: n.nivel });
                }
            });
        });

        const datasets = Array.from(uniqueLevels.values()).map(levelInfo => {
            const colorData = getNivelColor(levelInfo.name);
            return {
                label: levelInfo.name,
                data: paginatedData.map(teacher => {
                    const nivelData = teacher.niveles?.find(n => n.nivel === levelInfo.name);
                    return nivelData ? nivelData.cantidadDeEstudiantes : 0;
                }),
                backgroundColor: colorData.bg,
                borderColor: colorData.border,
                borderWidth: 1.5,
                borderRadius: 8,
                barPercentage: 0.76,
                categoryPercentage: 0.84,
            };
        });

        return {
            labels: rankingLabels,
            datasets: datasets,
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [paginatedData, rankingLabels, sortBy, getNivelColor, isPromedioMode, isImpactMode]);

    const customOptions = useMemo(() => {
        return {
            ...options,
            indexAxis: 'y' as const,
            interaction: {
                mode: 'index' as const,
                intersect: false,
                axis: 'y' as const,
            },
            datasets: {
                bar: {
                    barThickness: undefined,
                    maxBarThickness: undefined,
                }
            },
            plugins: {
                ...options.plugins,
                title: {
                    ...options.plugins?.title,
                    display: false, // Desactivado en canvas; se muestra en el Header HTML semántico
                },
                legend: {
                    ...options.plugins?.legend,
                    display: !isPromedioMode,
                    position: 'bottom' as const,
                    labels: {
                        usePointStyle: true,
                        pointStyle: 'rectRounded' as const,
                        padding: 16,
                        font: { size: 12, weight: '600' as const, family: "'Inter', sans-serif" },
                        color: '#475569',
                    }
                },
                tooltip: {
                    ...options.plugins?.tooltip,
                    backgroundColor: 'rgba(15, 23, 42, 0.96)',
                    padding: 12,
                    cornerRadius: 10,
                    titleFont: { size: 13, weight: '700' as const },
                    bodyFont: { size: 12, weight: '500' as const },
                    callbacks: {
                        title: (context: any) => {
                            const index = context[0].dataIndex;
                            const item = paginatedData[index];
                            return `${rankingOffset + index + 1}. ${item.nombres} ${item.apellidos}`;
                        },
                        beforeBody: (context: any) => {
                            const index = context[0].dataIndex;
                            const item = paginatedData[index];
                            const impact = getImpactScore(item).toFixed(2);
                            let text = `🏫 Institución: ${item.institucion}\n🆔 DNI: ${item.dniDocente}\n🚀 Impacto: ${impact}\n📊 Promedio Global: ${item.promedioGlobal}\n🏆 Satisfactorio: ${item.porcentajeSatisfactorio}%\n👥 Total Estudiantes: ${item.totalEstudiantes}\n`;

                            if (isPromedioMode || isImpactMode) {
                                text += '\n📌 Distribución de Estudiantes:';
                                item.niveles?.forEach(n => {
                                    if (n.cantidadDeEstudiantes > 0) {
                                        const perc = ((n.cantidadDeEstudiantes / item.totalEstudiantes) * 100).toFixed(1);
                                        text += `\n  • ${n.nivel}: ${n.cantidadDeEstudiantes} (${perc}%)`;
                                    }
                                });
                            }
                            return text;
                        },
                        label: (context: any) => {
                            if (isPromedioMode || isImpactMode) return null;
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
                        color: 'rgba(241, 245, 249, 0.85)',
                    },
                    title: {
                        display: true,
                        text: isImpactMode ? 'Índice de Impacto' : (isPromedioMode ? 'Puntaje Promedio' : 'Cantidad de Estudiantes'),
                        font: { size: 12, weight: '700' as const, family: "'Inter', sans-serif" },
                        color: '#64748b'
                    },
                    ticks: {
                        font: { size: 11, weight: '600' as const },
                        color: '#64748b'
                    }
                },
                y: {
                    type: 'category',
                    stacked: !(isPromedioMode || isImpactMode),
                    grid: {
                        display: false,
                    },
                    ticks: {
                        font: { size: 11, weight: '700' as const },
                        color: '#334155'
                    }
                },
            },
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [options, paginatedData, isPromedioMode, isImpactMode, rankingOffset, sortBy]);

    const drawLabelsInsideBarsPlugin = useMemo(() => ({
        id: 'drawLabelsInsideBars',
        afterDatasetsDraw(chart: any) {
            const { ctx } = chart;
            ctx.save();
            ctx.font = '600 11.5px "Inter", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
            ctx.textAlign = 'left';
            ctx.textBaseline = 'middle';

            const firstMeta = chart.getDatasetMeta(0);
            const lastMeta = chart.getDatasetMeta(chart.data.datasets.length - 1);
            const cleanTerm = searchTerm.toLowerCase().trim();

            if (firstMeta && lastMeta && firstMeta.data && lastMeta.data) {
                firstMeta.data.forEach((bar: any, index: number) => {
                    const item = paginatedData[index];
                    if (!item) return;

                    const text = `${item.institucion} - ${item.nombres} ${item.apellidos} - Promedio: ${item.promedioGlobal.toFixed(2)}`;
                    const left = bar.base;
                    const lastBar = lastMeta.data[index];
                    const right = lastBar ? lastBar.x : bar.x;
                    const centerY = bar.y;
                    const barWidth = right - left;

                    if (barWidth > 50) {
                        ctx.save();
                        ctx.beginPath();
                        ctx.rect(left, centerY - bar.height / 2, barWidth, bar.height);
                        ctx.clip();

                        let remainingText = text;
                        let remainingTextLower = text.toLowerCase();
                        let currentX = left + 10;

                        while (remainingText.length > 0) {
                            const matchIndex = cleanTerm ? remainingTextLower.indexOf(cleanTerm) : -1;
                            if (matchIndex === -1) {
                                // Texto con alto contraste y sombra suave para legibilidad perfecta
                                ctx.shadowColor = 'rgba(15, 23, 42, 0.45)';
                                ctx.shadowBlur = 2;
                                ctx.shadowOffsetX = 0;
                                ctx.shadowOffsetY = 1;
                                ctx.fillStyle = '#ffffff';
                                ctx.fillText(remainingText, currentX, centerY);
                                break;
                            }

                            // Texto previo al match
                            const before = remainingText.substring(0, matchIndex);
                            if (before) {
                                ctx.shadowColor = 'rgba(15, 23, 42, 0.45)';
                                ctx.shadowBlur = 2;
                                ctx.shadowOffsetX = 0;
                                ctx.shadowOffsetY = 1;
                                ctx.fillStyle = '#ffffff';
                                ctx.fillText(before, currentX, centerY);
                                currentX += ctx.measureText(before).width;
                            }

                            // Match con resaltado amarillo y texto oscuro
                            const match = remainingText.substring(matchIndex, matchIndex + cleanTerm.length);
                            const matchWidth = ctx.measureText(match).width;

                            ctx.save();
                            ctx.shadowColor = 'transparent';
                            ctx.fillStyle = 'rgba(254, 240, 138, 0.95)';
                            const rectHeight = 16;
                            ctx.fillRect(currentX, centerY - rectHeight / 2, matchWidth, rectHeight);
                            ctx.restore();

                            ctx.save();
                            ctx.shadowColor = 'transparent';
                            ctx.fillStyle = '#0f172a';
                            ctx.fillText(match, currentX, centerY);
                            ctx.restore();

                            currentX += matchWidth;

                            remainingText = remainingText.substring(matchIndex + cleanTerm.length);
                            remainingTextLower = remainingTextLower.substring(matchIndex + cleanTerm.length);
                        }

                        ctx.restore();
                    }
                });
            }
            ctx.restore();
        }
    }), [paginatedData, searchTerm]);

    const handleNext = () => currentPage < totalPages - 1 && setCurrentPage(prev => prev + 1);
    const handlePrev = () => currentPage > 0 && setCurrentPage(prev => prev - 1);

    if (!data || data.length === 0) return null;

    return (
        <div className={styles.container}>
            <div className={styles.header}>
                <div className={styles.titleWrapper}>
                    <div className="flex flex-col gap-1">
                        <div className="flex items-center gap-2">
                            <span className="flex items-center justify-center w-7 h-7 rounded-lg bg-emerald-50 text-emerald-600">
                                <RiUserStarLine className="w-4 h-4" />
                            </span>
                            <h3 className={styles.title}>
                                Desempeño por Docente (Distribución de Niveles)
                            </h3>
                        </div>
                        <div className="flex items-center gap-2 mt-0.5">
                            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-100">
                                {data.length.toLocaleString()} líderes educativos
                            </span>
                            <span className="text-xs text-slate-400">•</span>
                            <span className="text-xs text-slate-500 font-medium">
                                Ranking Top 10
                            </span>
                        </div>
                    </div>

                    <button 
                        type="button"
                        onClick={() => setIsExpanded(true)} 
                        className={styles.fullscreenButton}
                        title="Ver ranking completo y filtros avanzados"
                        aria-label="Abrir vista completa del ranking"
                    >
                        <RiFullscreenLine style={{ fontSize: '1.25rem' }} />
                    </button>
                </div>
            </div>

            <div className={styles.chartWrapper} style={{ height: '450px' }}>
                <Bar data={chartData} options={customOptions as any} plugins={[drawLabelsInsideBarsPlugin]} key={`chart-docente-${sortBy}-${currentPage}-${itemsPerPage}-${selectedRegion}-${selectedLevel}-${minStudents}-${searchTerm}`} />
            </div>

            {/* Footer informativo de la tarjeta normal */}
            <div className={styles.normalCardFooter}>
                <div className={styles.normalCardHint}>
                    <RiInformationLine className="w-4 h-4 text-emerald-600 shrink-0" />
                    <span>Mostrando Top 10 por promedio. Usa <strong>Vista Completa</strong> para filtrar por UGEL, cantidad de estudiantes o buscar.</span>
                </div>
                <button
                    type="button"
                    onClick={() => setIsExpanded(true)}
                    className={styles.normalCardCta}
                >
                    <span>Filtros y lista completa</span>
                    <RiArrowRightLine className="w-3.5 h-3.5" />
                </button>
            </div>

            {isExpanded && mounted && typeof window !== 'undefined' && createPortal(
                <>
                    <div className={styles.drawerBackdrop} onClick={() => setIsExpanded(false)} />
                    <div className={styles.drawer}>
                        <div className={styles.drawerHeader}>
                            <div>
                                <h2 className={styles.drawerTitle}>Ranking de Docentes (Vista Completa)</h2>
                                <p className={styles.drawerSubtitle}>{sortedData.length} de {data.length} líderes educativos filtrados</p>
                            </div>
                            <button className={styles.drawerClose} onClick={() => setIsExpanded(false)}>
                                <RiCloseLine size={24} /> Cerrar
                            </button>
                        </div>
                        <div className={styles.drawerBody}>
                            <div className={styles.drawerControlsRow}>
                                <div className={styles.drawerControlsTopRow}>
                                    <div className={styles.drawerFiltersRow}>
                                        <div className={styles.drawerSearchGroup}>
                                            <RiSearchLine className={styles.searchIcon} />
                                            <input
                                                type="text"
                                                placeholder="Buscar por IE, nombre o DNI..."
                                                className={`${styles.drawerSearchInput} ${styles.drawerSearchInputDocentes}`}
                                                value={searchTerm}
                                                onChange={(e) => {
                                                    setSearchTerm(e.target.value);
                                                    setCurrentPage(0);
                                                }}
                                            />
                                        </div>
                                        <div className={styles.drawerFilterGroup}>
                                            <span>Ugel:</span>
                                            <select
                                                className={`${styles.drawerRowsPerPageSelect} ${styles.drawerRowsPerPageSelectDocentes} ${styles.drawerRegionSelect}`}
                                                value={selectedRegion}
                                                disabled={!canChangeRegion}
                                                onChange={(e) => {
                                                    if (!canChangeRegion) return;
                                                    setSelectedRegion(e.target.value);
                                                    setCurrentPage(0);
                                                }}
                                                style={!canChangeRegion ? { cursor: 'not-allowed', opacity: 0.85 } : undefined}
                                                aria-label="Filtrar por UGEL"
                                            >
                                                {canChangeRegion && <option value="">Todas las Ugel</option>}
                                                {regiones
                                                    .filter(reg => canChangeRegion ? true : String(reg.id) === String(selectedRegion || initialRegion))
                                                    .map((reg) => (
                                                        <option key={reg.id} value={reg.id}>
                                                            {reg.region}
                                                        </option>
                                                    ))}
                                            </select>
                                        </div>

                                        {nivelYPuntaje && nivelYPuntaje.length > 0 && (
                                            <div className={styles.drawerFilterGroup}>
                                                <span>Nivel:</span>
                                                <select
                                                    className={`${styles.drawerRowsPerPageSelect} ${styles.drawerRowsPerPageSelectDocentes} ${styles.drawerRegionSelect}`}
                                                    value={selectedLevel}
                                                    onChange={(e) => {
                                                        setSelectedLevel(e.target.value);
                                                        setCurrentPage(0);
                                                    }}
                                                >
                                                    <option value="">Todos los niveles</option>
                                                    {nivelYPuntaje.map((n) => (
                                                        <option key={n.id || n.nivel} value={n.nivel}>
                                                            {n.nivel}
                                                        </option>
                                                    ))}
                                                </select>
                                                {selectedLevel && (
                                                    <span style={{ fontSize: '0.8rem', color: '#84cc16', fontWeight: 'bold', whiteSpace: 'nowrap' }}>
                                                        ({sortedData.length} {sortedData.length === 1 ? 'docente' : 'docentes'})
                                                    </span>
                                                )}
                                            </div>
                                        )}

                                        <div className={styles.drawerFilterGroup}>
                                            <span>Estudiantes:</span>
                                            <input
                                                type="number"
                                                min="0"
                                                className={`${styles.drawerRowsPerPageSelect} ${styles.drawerRowsPerPageSelectDocentes}`}
                                                value={minStudents}
                                                onChange={(e) => {
                                                    const val = e.target.value;
                                                    setMinStudents(val === "" ? "" : Number(val));
                                                    setCurrentPage(0);
                                                }}
                                                style={{ width: '90px', padding: '10px 12px', height: '44px' }}
                                            />
                                        </div>

                                    </div>

                                    <div className={styles.drawerPaginationRow}>
                                        <div className={styles.drawerFilterGroup}>
                                            <span>Ver:</span>
                                            <select
                                                className={`${styles.drawerRowsPerPageSelect} ${styles.drawerRowsPerPageSelectDocentes}`}
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
                                        {totalPages > 1 && (
                                            <div className={styles.navButtons}>
                                                <button onClick={handlePrev} disabled={currentPage === 0} className={styles.pageButton}>←</button>
                                                <span className={styles.pageInfo}>{currentPage + 1} / {totalPages}</span>
                                                <button onClick={handleNext} disabled={currentPage === totalPages - 1} className={styles.pageButton}>→</button>
                                            </div>
                                        )}
                                    </div>
                                </div>

                                <div className={styles.drawerControlsBottomRow}>
                                    <div className={styles.sortButtons}>
                                        <button onClick={() => { setSortBy('promedio'); setCurrentPage(0); }} className={`${styles.drawerSortButton} ${sortBy === 'promedio' ? `${styles.drawerSortButtonActiveDocentes} ${styles.sortButtonActive}` : styles.drawerSortButtonDocentes}`}>⭐ Promedio</button>
                                        <button onClick={() => { setSortBy('evaluados'); setCurrentPage(0); }} className={`${styles.drawerSortButton} ${sortBy === 'evaluados' ? `${styles.drawerSortButtonActiveDocentes} ${styles.sortButtonActive}` : styles.drawerSortButtonDocentes}`}>👥 Evaluados</button>
                                        <button onClick={() => { setSortBy('satisfactorios'); setCurrentPage(0); }} className={`${styles.drawerSortButton} ${sortBy === 'satisfactorios' ? `${styles.drawerSortButtonActiveDocentes} ${styles.sortButtonActive}` : styles.drawerSortButtonDocentes}`}>🏆 Satisfactorios</button>
                                        <div className={styles.impactWrapper}>
                                            <button onClick={() => { setSortBy('impacto'); setCurrentPage(0); }} className={`${styles.drawerSortButton} ${sortBy === 'impacto' ? `${styles.drawerSortButtonActiveDocentes} ${styles.sortButtonActive}` : styles.drawerSortButtonDocentes}`}>🚀 Impacto</button>
                                            <div className={styles.infoTooltip}>
                                                <b>Modo Impacto</b>
                                                Métrica estratégica que equilibra el rendimiento académico con el volumen de estudiantes.
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div className={styles.drawerChartWrapper} style={{ height: `${Math.max(500, paginatedData.length * 45 + 100)}px` }}>
                                <Bar data={chartData} options={customOptions as any} plugins={[drawLabelsInsideBarsPlugin]} key={`chart-drawer-docente-${sortBy}-${currentPage}-${itemsPerPage}-${selectedRegion}-${selectedLevel}-${minStudents}-${searchTerm}`} />
                            </div>
                        </div>
                    </div>
                </>,
                document.body
            )}
        </div >
    );
};

export default BarChartDocentes;
