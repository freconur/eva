import React, { useEffect, useState, useMemo } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';
import { MdArrowBack, MdSearch, MdPeople, MdExpandMore, MdExpandLess, MdTrendingUp, MdTrendingDown, MdTrendingFlat, MdHistory } from 'react-icons/md';
import { RiLoader4Line } from 'react-icons/ri';
import { useGlobalContext } from '@/features/context/GlolbalContext';
import UseEvaluacionEspecialistas from '@/features/hooks/UseEvaluacionEspecialistas';
import { User } from '@/features/types/types';
import { regionTexto } from '@/fuctions/regiones';
import {
    Chart as ChartJS,
    CategoryScale,
    LinearScale,
    PointElement,
    LineElement,
    BarElement,
    RadialLinearScale,
    ArcElement,
    Title,
    Tooltip,
    Legend,
} from 'chart.js';
import { Line, Radar, Bar, Pie } from 'react-chartjs-2';
import styles from './styles.module.css';

ChartJS.register(
    CategoryScale,
    LinearScale,
    PointElement,
    LineElement,
    BarElement,
    RadialLinearScale,
    ArcElement,
    Title,
    Tooltip,
    Legend
);

const EvaluadosPage = () => {
    const router = useRouter();
    const { id } = router.query;
    const { evaluadosEspecialista, loaderPages, dataEvaluacionDocente, getPreguntaRespuestaDocentes, dimensionesEspecialistas } = useGlobalContext();
    const { getEspecialistasEvaluados, getDataEvaluacion, getHistorialEspecialista, getPreguntasRespuestasEspecialistas, getDimensionesEspecialistas } = UseEvaluacionEspecialistas();
    const [searchQuery, setSearchQuery] = useState<string>('');
    const [selectedFase, setSelectedFase] = useState<string>('');
    const [showModalEvolucion, setShowModalEvolucion] = useState(false);
    const [selectedEspecialista, setSelectedEspecialista] = useState<User | null>(null);
    const [historialSelected, setHistorialSelected] = useState<User[]>([]);
    const [loadingHistorial, setLoadingHistorial] = useState(false);
    const [expandedRows, setExpandedRows] = useState<Set<string>>(new Set());
    const [activeTab, setActiveTab] = useState<'evolucion' | 'radar' | 'analisis' | 'distribucion'>('evolucion');

    useEffect(() => {
        if (id) {
            getEspecialistasEvaluados(`${id}`);
            getDataEvaluacion(`${id}`);
            getPreguntasRespuestasEspecialistas(`${id}`);
            getDimensionesEspecialistas(`${id}`);
        }
    }, [id]);

    const getTimestamp = (val: any): number => {
        if (!val) return 0;
        // Si es un Timestamp de Firestore
        if (typeof val === 'object' && val.seconds !== undefined) {
            return val.seconds * 1000 + (val.nanoseconds || 0) / 1000000;
        }
        // Si es una cadena o número
        const d = new Date(val);
        return isNaN(d.getTime()) ? 0 : d.getTime();
    };

    const formatTime = (val: any): string => {
        if (!val) return '';
        const date = new Date(getTimestamp(val));
        if (isNaN(date.getTime())) return '';
        return date.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' });
    };

    const getNivel = (calificacion: number) => {
        if (!dataEvaluacionDocente?.niveles || dataEvaluacionDocente.niveles.length === 0) return null;
        return dataEvaluacionDocente.niveles.find(n => calificacion >= (n.min || 0) && calificacion <= (n.max || 0));
    };

    const fasesUnicas = useMemo(() => {
        if (!evaluadosEspecialista) return [];
        const fases: { id: string; nombre: string }[] = [];
        evaluadosEspecialista.forEach((esp: any) => {
            if (esp.idFase && !fases.find(f => f.id === esp.idFase)) {
                fases.push({ id: esp.idFase, nombre: esp.faseNombre || esp.idFase });
            }
        });
        return fases;
    }, [evaluadosEspecialista]);

    const groupedEvaluados = useMemo(() => {
        if (!evaluadosEspecialista) return [];

        const groups: { [dni: string]: { info: User; evaluations: User[] } } = {};

        const evaluadosActivos = selectedFase
            ? evaluadosEspecialista.filter(esp => esp.idFase === selectedFase)
            : evaluadosEspecialista;

        evaluadosActivos.forEach((esp) => {
            const dni = esp.dni || 'sin-dni';
            if (!groups[dni]) {
                groups[dni] = {
                    info: esp,
                    evaluations: []
                };
            }
            groups[dni].evaluations.push(esp);
        });

        // Ordenar evaluaciones por fecha y hora descendente (la más reciente primero)
        Object.values(groups).forEach(group => {
            group.evaluations.sort((a, b) => {
                const timeA = getTimestamp(a.fechaCreacion);
                const timeB = getTimestamp(b.fechaCreacion);
                return timeB - timeA;
            });
        });

        const result = Object.values(groups);

        if (!searchQuery) return result;

        const q = searchQuery.toLowerCase();
        return result.filter(group =>
            group.info.nombres?.toLowerCase().includes(q) ||
            group.info.apellidos?.toLowerCase().includes(q) ||
            group.info.dni?.toLowerCase().includes(q) ||
            group.info.ugel?.toLowerCase().includes(q)
        );
    }, [evaluadosEspecialista, searchQuery, selectedFase]);

    const toggleRow = (dni: string) => {
        const newExpanded = new Set(expandedRows);
        if (newExpanded.has(dni)) {
            newExpanded.delete(dni);
        } else {
            newExpanded.add(dni);
        }
        setExpandedRows(newExpanded);
    };

    const getTrend = (evaluations: User[]) => {
        if (evaluations.length < 2) return null;
        const current = evaluations[0].calificacion || 0;
        const previous = evaluations[1].calificacion || 0;
        if (current > previous) return { icon: <MdTrendingUp className={styles.trendUp} />, label: 'Mejorando' };
        if (current < previous) return { icon: <MdTrendingDown className={styles.trendDown} />, label: 'En descenso' };
        return { icon: <MdTrendingFlat className={styles.trendNeutral} />, label: 'Estable' };
    };

    const handleOpenEvolucion = async (esp: User) => {
        setSelectedEspecialista(esp);
        setLoadingHistorial(true);
        setShowModalEvolucion(true);
        if (id && esp.dni) {
            const history = await getHistorialEspecialista(`${id}`, esp.dni);
            // Ordenar por fecha cronológica (ascendente para el gráfico)
            const sortedHistory = [...history].sort((a, b) => {
                const timeA = getTimestamp(a.fechaCreacion);
                const timeB = getTimestamp(b.fechaCreacion);
                return timeA - timeB;
            });
            setHistorialSelected(sortedHistory);
        }
        setLoadingHistorial(false);
        setActiveTab('evolucion'); // Reset tab when opening
    };

    const getLocalDateString = (dateString: any) => {
        if (!dateString) return '—';
        // Si ya viene con formato YYYY-MM-DD, lo devolvemos tal cual para evitar que JS sume horas por locale timezone.
        if (typeof dateString === 'string' && dateString.length >= 10) {
            return dateString.substring(0, 10);
        }
        return String(dateString);
    };

    const chartData = {
        labels: historialSelected.map(h => getLocalDateString(h.fechaMonitoreo || h.fechaCreacion)),
        datasets: [
            {
                label: 'Calificación',
                data: historialSelected.map(h => h.calificacion || 0),
                borderColor: '#2563eb',
                backgroundColor: 'rgba(37, 99, 235, 0.5)',
                tension: 0.3,
                pointBackgroundColor: '#2563eb',
                pointBorderColor: '#fff',
                pointHoverBackgroundColor: '#fff',
                pointHoverBorderColor: '#2563eb',
                pointRadius: 5,
                pointHoverRadius: 7,
            }
        ]
    };

    const chartOptions = {
        responsive: true,
        plugins: {
            legend: {
                position: 'top' as const,
            },
            title: {
                display: true,
                text: `Evolución de ${selectedEspecialista?.nombres || ''}`,
            },
            tooltip: {
                callbacks: {
                    title: (context: any) => {
                        return context[0].label;
                    }
                }
            }
        },
        scales: {
            y: {
                beginAtZero: true,
                suggestedMax: (dataEvaluacionDocente?.escala || []).at(-1)?.value || 4, // Usamos suggestedMax para no forzar cortes
            },
            x: {
                offset: true, // Importante para que el punto único se centre y no quede cortado en los bordes
                grid: {
                    offset: true,
                }
            }
        },
        layout: {
            padding: {
                left: 20,
                right: 20,
                top: 20,
                bottom: 20
            }
        }
    };

    const latestEvaluation = historialSelected.length > 0 ? historialSelected[historialSelected.length - 1] : null;

    const getRadarData = () => {
        const labels = dimensionesEspecialistas.map((d: any) => d.nombre || '');
        const scale = dataEvaluacionDocente.escala || [];
        const detailsData: any[] = [];

        const data = dimensionesEspecialistas.map((dim: any) => {
            const preguntasDim = getPreguntaRespuestaDocentes.filter(p => p.dimensionId === dim.id);
            if (preguntasDim.length === 0 || !latestEvaluation?.resultadosSeguimientoRetroalimentacion) {
                detailsData.push([]);
                return 0;
            }

            const idsPreguntas = preguntasDim.map(p => p.order);
            const respuestasUsuario = latestEvaluation.resultadosSeguimientoRetroalimentacion.filter(
                (r: any) => idsPreguntas.includes(r.order)
            );

            if (respuestasUsuario.length === 0) {
                detailsData.push([]);
                return 0;
            }

            const dimDetails: any[] = [];
            const totalPuntaje = respuestasUsuario.reduce((acc: number, resp: any) => {
                const selectedAlt = resp.alternativas?.find((a: any) => a.selected);
                const matchedScale = scale.find(s => s.alternativa === selectedAlt?.alternativa || s.descripcion === selectedAlt?.descripcion?.trim());
                const puntaje = matchedScale?.value || 0;

                const preguntaOrig = preguntasDim.find(p => p.order === resp.order);
                let textCrit = preguntaOrig?.criterio || `Pregunta ${resp.order}`;
                if (textCrit.length > 55) textCrit = textCrit.substring(0, 52) + '...';

                dimDetails.push({ orden: resp.order, nombre: textCrit, puntaje });
                return acc + puntaje;
            }, 0);

            // Ordenamiento por número de pregunta para el tooltip
            dimDetails.sort((a, b) => a.orden - b.orden);
            detailsData.push(dimDetails);

            return (totalPuntaje / respuestasUsuario.length).toFixed(2);
        });

        return {
            labels,
            datasets: [
                {
                    label: 'Perfil de Competencias Actual',
                    data,
                    customDetails: detailsData, // Inyección de detalles para el tooltip
                    backgroundColor: 'rgba(59, 130, 246, 0.2)',
                    borderColor: '#3b82f6',
                    pointBackgroundColor: '#3b82f6',
                    pointBorderColor: '#fff',
                    pointHoverBackgroundColor: '#fff',
                    pointHoverBorderColor: '#3b82f6',
                },
            ],
        };
    };

    const getItemAnalysisData = () => {
        if (!latestEvaluation?.resultadosSeguimientoRetroalimentacion) return null;

        const scale = dataEvaluacionDocente.escala || [];
        const maxScore = scale.length > 0 ? Math.max(...scale.map(s => s.value || 0)) : 4;

        // Calculate score for each question
        const questionScores = latestEvaluation.resultadosSeguimientoRetroalimentacion.map((resp: any) => {
            const selectedAlt = resp.alternativas?.find((a: any) => a.selected);
            const matchedScale = scale.find(s => s.alternativa === selectedAlt?.alternativa || s.descripcion === selectedAlt?.descripcion?.trim());
            const score = matchedScale?.value || 0;

            const preguntaOrig = getPreguntaRespuestaDocentes.find(p => p.order === resp.order);

            return {
                id: resp.order,
                criterio: preguntaOrig?.criterio || `Pregunta ${resp.order}`,
                score
            };
        });

        // Filtrar aquellos que ya tienen el puntaje máximo, no son brechas
        const filteredScores = questionScores.filter(item => item.score < maxScore);

        if (filteredScores.length === 0) return null;

        // Sort ascending (lowest scores first)
        const sortedItems = [...filteredScores].sort((a, b) => a.score - b.score).slice(0, 5);

        return {
            labels: sortedItems.map(item => item.criterio.substring(0, 40) + '...'),
            datasets: [
                {
                    label: 'Puntaje',
                    data: sortedItems.map(item => item.score),
                    backgroundColor: 'rgba(239, 68, 68, 0.6)',
                    borderColor: '#ef4444',
                    borderWidth: 1,
                },
            ],
        };
    };

    const getDistribucionGlobalData = () => {
        if (!latestEvaluation?.resultadosSeguimientoRetroalimentacion || !dataEvaluacionDocente?.escala) {
            return { pieData: null, stats: [], totalPreguntas: 0 };
        }

        const scale = dataEvaluacionDocente.escala;
        const counts = new Array(scale.length).fill(0);

        latestEvaluation.resultadosSeguimientoRetroalimentacion.forEach((resp: any) => {
            const selectedAlt = resp.alternativas?.find((a: any) => a.selected);
            const matchedIndex = scale.findIndex((s: any) => s.alternativa === selectedAlt?.alternativa || s.descripcion === selectedAlt?.descripcion?.trim());
            if (matchedIndex !== -1) {
                counts[matchedIndex]++;
            }
        });

        const backgroundColors = [
            'rgba(148, 163, 184, 0.8)', // Slate 400
            'rgba(96, 165, 250, 0.8)', // Blue 400
            'rgba(52, 211, 153, 0.8)', // Emerald 400
            'rgba(129, 140, 248, 0.8)', // Indigo 400
        ];

        const borderColors = [
            '#64748b', // Slate 500
            '#3b82f6', // Blue 500
            '#10b981', // Emerald 500
            '#6366f1', // Indigo 500
        ];

        const labels = scale.map((s: any) => s.descripcion || '');

        return {
            pieData: {
                labels,
                datasets: [
                    {
                        data: counts,
                        backgroundColor: scale.map((s: any, i: number) => s.color || backgroundColors[i % backgroundColors.length]),
                        borderColor: scale.map((s: any, i: number) => borderColors[i % borderColors.length]),
                        borderWidth: 1,
                    },
                ],
            },
            stats: scale.map((s: any, index: number) => ({
                label: s.descripcion || '',
                count: counts[index],
            })),
            totalPreguntas: counts.reduce((a, b) => a + b, 0)
        };
    };

    return (
        <div className={styles.container}>
            {/* Header */}
            <div className={styles.header}>
                <div className={styles.headerTop}>
                    <Link href={`/admin/especialistas/evaluaciones-especialistas/evaluacion/${id}`} className={styles.backButton}>
                        <MdArrowBack /> Volver
                    </Link>
                </div>
                <div className={styles.headerContent}>
                    <h1 className={styles.headerTitle}>
                        Especialistas Evaluados
                    </h1>
                    {dataEvaluacionDocente?.name && (
                        <p className={styles.headerSubtitle}>
                            {dataEvaluacionDocente.name}
                        </p>
                    )}
                    <div className={styles.headerBadge}>
                        <MdPeople />
                        <span>{evaluadosEspecialista?.length ?? 0} registros</span>
                    </div>
                </div>
            </div>

            {/* Main content */}
            <div className={styles.content}>
                {/* Search bar */}
                <div className={styles.searchBar}>
                    <div className={styles.searchInputWrapper}>
                        <MdSearch className={styles.searchIcon} />
                        <input
                            type="text"
                            className={styles.searchInput}
                            placeholder="Buscar por nombre, DNI o UGEL..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                        />
                    </div>
                    {fasesUnicas.length > 0 && (
                        <div className={styles.selectWrapper}>
                            <select
                                className={styles.phaseSelect}
                                value={selectedFase}
                                onChange={(e) => setSelectedFase(e.target.value)}
                            >
                                <option value="">Todas las Fases</option>
                                {fasesUnicas.map(f => (
                                    <option key={f.id} value={f.id}>{f.nombre}</option>
                                ))}
                            </select>
                        </div>
                    )}
                    <span className={styles.resultCount}>
                        {groupedEvaluados.length} especialista{groupedEvaluados.length !== 1 ? 's' : ''}
                    </span>
                </div>

                {/* Table */}
                {loaderPages ? (
                    <div className={styles.loaderContainer}>
                        <RiLoader4Line className={styles.loaderIcon} />
                        <p className={styles.loaderText}>Cargando especialistas...</p>
                    </div>
                ) : groupedEvaluados.length === 0 ? (
                    <div className={styles.emptyState}>
                        <MdPeople className={styles.emptyIcon} />
                        <p className={styles.emptyText}>
                            {searchQuery ? 'Sin resultados para tu búsqueda.' : 'Aún no hay especialistas evaluados.'}
                        </p>
                    </div>
                ) : (
                    <div className={styles.tableWrapper}>
                        <table className={styles.table}>
                            <thead>
                                <tr>
                                    <th style={{ width: '40px' }}></th>
                                    <th>Especialista</th>
                                    <th>UGEL</th>
                                    <th style={{ textAlign: 'center' }}>Evaluaciones</th>
                                    <th style={{ textAlign: 'center' }}>Última Calif.</th>
                                    <th style={{ textAlign: 'center' }}>Tendencia</th>
                                    <th style={{ textAlign: 'right' }}>Acciones</th>
                                </tr>
                            </thead>
                            <tbody>
                                {groupedEvaluados.map((group, index) => {
                                    const dni = group.info.dni || `idx-${index}`;
                                    const isExpanded = expandedRows.has(dni);
                                    const latestEval = group.evaluations[0];
                                    const trend = getTrend(group.evaluations);

                                    return (
                                        <React.Fragment key={dni}>
                                            <tr
                                                className={`${styles.tableRow} ${isExpanded ? styles.rowExpanded : ''}`}
                                                onClick={() => toggleRow(dni)}
                                                style={{ cursor: 'pointer' }}
                                            >
                                                <td>
                                                    <div className={styles.expandIcon}>
                                                        {isExpanded ? <MdExpandLess /> : <MdExpandMore />}
                                                    </div>
                                                </td>
                                                <td>
                                                    <div className={styles.specialistInfo}>
                                                        <span className={styles.specialistName}>
                                                            {`${group.info.nombres ?? ''} ${group.info.apellidos ?? ''}`.trim() || '—'}
                                                        </span>
                                                        <span className={styles.specialistDni}>{group.info.dni ?? '—'}</span>
                                                    </div>
                                                </td>
                                                <td className={styles.tdUgel}>{regionTexto(String(group.info.region)) ?? '—'}</td>
                                                <td style={{ textAlign: 'center' }}>
                                                    <span className={styles.evalCountBadge}>
                                                        {group.evaluations.length}
                                                    </span>
                                                </td>
                                                <td style={{ textAlign: 'center' }}>
                                                    <div className={styles.scoreContainer}>
                                                        <span className={styles.calificacionBadge}>
                                                            {latestEval?.calificacion ?? '—'}
                                                        </span>
                                                        {latestEval?.calificacion !== undefined && getNivel(latestEval.calificacion) && (
                                                            <span
                                                                className={styles.levelBadgeMini}
                                                                style={{
                                                                    backgroundColor: `${getNivel(latestEval.calificacion)?.color}20`,
                                                                    color: getNivel(latestEval.calificacion)?.color,
                                                                    borderColor: `${getNivel(latestEval.calificacion)?.color}40`,
                                                                }}
                                                            >
                                                                {getNivel(latestEval.calificacion)?.nivel}
                                                            </span>
                                                        )}
                                                    </div>
                                                </td>
                                                <td style={{ textAlign: 'center' }}>
                                                    {trend ? (
                                                        <div className={styles.trendWrapper} title={trend.label}>
                                                            {trend.icon}
                                                        </div>
                                                    ) : (
                                                        <span className={styles.textMuted}>—</span>
                                                    )}
                                                </td>
                                                <td style={{ textAlign: 'right' }}>
                                                    <button
                                                        className={styles.historyButton}
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            handleOpenEvolucion(group.info);
                                                        }}
                                                    >
                                                        <MdHistory /> Evolución
                                                    </button>
                                                </td>
                                            </tr>
                                            {isExpanded && (
                                                <tr className={styles.detailRow}>
                                                    <td colSpan={7}>
                                                        <div className={styles.detailContent}>
                                                            <h4 className={styles.detailTitle}>Historial de Evaluaciones</h4>
                                                            <div className={styles.detailGrid}>
                                                                {group.evaluations.map((evalu, idx) => (
                                                                    <div key={evalu.id || idx} className={styles.evaluationItem}>
                                                                        <div className={styles.evalMainInfo}>
                                                                            <div className={styles.evalDateWrapper}>
                                                                                <span className={styles.evalDate}>{getLocalDateString(evalu.fechaMonitoreo || evalu.fechaCreacion)}</span>
                                                                                <span className={styles.evalTime}>{formatTime(evalu.fechaCreacion)}</span>
                                                                            </div>
                                                                            {(evalu as any).faseNombre && (
                                                                                <span className={styles.evalFaseBadge}>Fase: {(evalu as any).faseNombre}</span>
                                                                            )}
                                                                        </div>
                                                                        <div className={styles.evalScoreGroup}>
                                                                            {evalu.calificacion !== undefined && getNivel(evalu.calificacion) && (
                                                                                <span
                                                                                    className={styles.evalLevelText}
                                                                                    style={{ color: getNivel(evalu.calificacion)?.color }}
                                                                                >
                                                                                    {getNivel(evalu.calificacion)?.nivel}
                                                                                </span>
                                                                            )}
                                                                            <span className={styles.evalScore}>{evalu.calificacion || 0} pts</span>
                                                                        </div>
                                                                        <div className={styles.evalActions}>
                                                                            <Link
                                                                                href={`/admin/especialistas/evaluaciones-especialistas/evaluacion/reporte-especialista-individual?idEvaluacion=${id}&sessionId=${evalu.id}`}
                                                                                className={styles.viewReportLink}
                                                                                onClick={(e) => e.stopPropagation()}
                                                                            >
                                                                                Ver Reporte
                                                                            </Link>
                                                                        </div>
                                                                    </div>
                                                                ))}
                                                            </div>
                                                        </div>
                                                    </td>
                                                </tr>
                                            )}
                                        </React.Fragment>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>

            {/* Evolution Modal */}
            {showModalEvolucion && (
                <div className={styles.modalOverlay} onClick={() => setShowModalEvolucion(false)}>
                    <div className={styles.modalContent} onClick={e => e.stopPropagation()}>
                        <div className={styles.modalHeader}>
                            <h2 className={styles.modalTitle}>Progreso del Especialista</h2>
                            <button className={styles.modalClose} onClick={() => setShowModalEvolucion(false)}>×</button>
                        </div>
                        <div className={styles.modalBody}>
                            <div className={styles.modalTabs}>
                                <button className={`${styles.tabButton} ${activeTab === 'evolucion' ? styles.activeTab : ''}`} onClick={() => setActiveTab('evolucion')}>Evolución Histórica</button>
                                <button className={`${styles.tabButton} ${activeTab === 'radar' ? styles.activeTab : ''}`} onClick={() => setActiveTab('radar')}>Perfil Reticular</button>
                                <button className={`${styles.tabButton} ${activeTab === 'analisis' ? styles.activeTab : ''}`} onClick={() => setActiveTab('analisis')}>Brechas Críticas</button>
                                <button className={`${styles.tabButton} ${activeTab === 'distribucion' ? styles.activeTab : ''}`} onClick={() => setActiveTab('distribucion')}>Resultados Globales</button>
                            </div>

                            {loadingHistorial ? (
                                <div className={styles.modalLoading}>
                                    <RiLoader4Line className={styles.loadingIcon} />
                                    <span>Cargando historial...</span>
                                </div>
                            ) : historialSelected.length > 0 ? (
                                <div className={styles.tabContent}>
                                    {activeTab === 'evolucion' && (
                                        <div className={styles.chartContainer} style={{ minHeight: '350px', position: 'relative' }}>
                                            {historialSelected.length === 1 && (
                                                <div style={{
                                                    position: 'absolute',
                                                    top: '10px',
                                                    left: '50%',
                                                    transform: 'translateX(-50%)',
                                                    background: '#eff6ff',
                                                    color: '#1d4ed8',
                                                    padding: '0.5rem 1rem',
                                                    borderRadius: '8px',
                                                    fontWeight: '600',
                                                    border: '1px solid #bfdbfe',
                                                    zIndex: 10
                                                }}>
                                                    Única Evaluación: {historialSelected[0].calificacion} pts
                                                </div>
                                            )}
                                            <Line data={chartData} options={chartOptions} />
                                        </div>
                                    )}
                                    {activeTab === 'radar' && (
                                        <div className={styles.chartContainer} style={{ minHeight: '350px' }}>
                                            {(() => {
                                                const maxScale = (dataEvaluacionDocente.escala || []).at(-1)?.value || 4;
                                                const tooltipOptions = {
                                                    backgroundColor: 'rgba(15, 23, 42, 0.95)', // Tono oscuro profesional (Slate 900)
                                                    titleColor: '#f8fafc',
                                                    bodyColor: '#e2e8f0',
                                                    titleFont: { size: 14, weight: 'bold' as const, family: "'Inter', system-ui, sans-serif" },
                                                    bodyFont: { size: 13, family: "'Inter', system-ui, sans-serif" },
                                                    padding: 16,
                                                    cornerRadius: 8,
                                                    displayColors: false, // Ocultar el cuadrito azul que sale por defecto
                                                    callbacks: {
                                                        title: (context: any) => context[0].label,
                                                        label: (context: any) => `Promedio del dominio: ${context.raw} pts`,
                                                        afterLabel: (context: any) => {
                                                            const details = context.dataset.customDetails[context.dataIndex];
                                                            if (!details || details.length === 0) return ['\nSin datos de evaluación.'];
                                                            const lines = ['\nDesglose por puntos evaluados:'];
                                                            details.forEach((d: any) => {
                                                                lines.push(`• P${d.orden} (${d.puntaje} pts) - ${d.nombre}`);
                                                            });
                                                            return lines;
                                                        }
                                                    }
                                                };

                                                return dimensionesEspecialistas.length >= 3 ? (
                                                    <Radar
                                                        data={getRadarData()}
                                                        options={{
                                                            responsive: true,
                                                            maintainAspectRatio: false,
                                                            interaction: {
                                                                mode: 'index',
                                                                intersect: false, // ¡Esto hace que no tengas que atinarle al punto exacto!
                                                            },
                                                            scales: { r: { min: 0, max: maxScale } },
                                                            plugins: {
                                                                title: { display: true, text: 'Dominio de Competencias Actual' },
                                                                tooltip: tooltipOptions
                                                            }
                                                        }}
                                                    />
                                                ) : (
                                                    <Bar
                                                        data={getRadarData()}
                                                        options={{
                                                            responsive: true,
                                                            maintainAspectRatio: false,
                                                            interaction: {
                                                                mode: 'index',
                                                                intersect: false, // Facilita el hover en gráficas de barras
                                                            },
                                                            scales: { y: { min: 0, max: maxScale } },
                                                            plugins: {
                                                                title: { display: true, text: 'Dominio de Competencias Actual' },
                                                                legend: { display: false },
                                                                tooltip: tooltipOptions
                                                            }
                                                        }}
                                                    />
                                                );
                                            })()}
                                        </div>
                                    )}
                                    {activeTab === 'analisis' && (
                                        <div className={styles.chartContainer} style={{ minHeight: '350px' }}>
                                            {getItemAnalysisData() ? (
                                                <Bar
                                                    data={getItemAnalysisData()!}
                                                    options={{
                                                        responsive: true,
                                                        maintainAspectRatio: false,
                                                        indexAxis: 'y' as const,
                                                        scales: { x: { min: 0, max: (dataEvaluacionDocente.escala || []).at(-1)?.value || 4 } },
                                                        plugins: { title: { display: true, text: 'Top 5 Criterios con Menor Puntaje' }, legend: { display: false } }
                                                    }}
                                                />
                                            ) : (
                                                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', color: '#16a34a', textAlign: 'center' }}>
                                                    <MdTrendingUp style={{ fontSize: '3rem', marginBottom: '1rem' }} />
                                                    <h3 style={{ fontSize: '1.2rem', marginBottom: '0.5rem' }}>¡Excelente Desempeño!</h3>
                                                    <p style={{ maxWidth: '300px' }}>El especialista alcanzó el puntaje máximo en todos los criterios evaluados. No se detectaron brechas críticas.</p>
                                                </div>
                                            )}
                                        </div>
                                    )}
                                    {activeTab === 'distribucion' && (
                                        <div style={{ width: '100%', paddingTop: '0.5rem' }}>
                                            {(() => {
                                                const distData = getDistribucionGlobalData();
                                                if (!distData.pieData) return <p style={{ textAlign: 'center', marginTop: '2rem' }}>No hay datos suficientes para mostrar.</p>;
                                                return (
                                                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', width: '100%' }}>
                                                        <div style={{ marginBottom: '2rem', width: '100%' }}>
                                                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem' }}>
                                                                <div style={{ width: '4px', height: '24px', backgroundColor: '#3b82f6', borderRadius: '4px' }}></div>
                                                                <h3 style={{ fontSize: '1.25rem', fontWeight: 'bold', color: '#1e293b', margin: 0 }}>Consolidado de Resultados</h3>
                                                            </div>
                                                            <div style={{ width: '100%', maxWidth: '300px', margin: '0 auto' }}>
                                                                <Pie
                                                                    data={distData.pieData}
                                                                    options={{
                                                                        plugins: {
                                                                            legend: { position: 'bottom' },
                                                                            title: { display: false }
                                                                        }
                                                                    }}
                                                                />
                                                            </div>
                                                        </div>
                                                        <div style={{
                                                            display: 'flex',
                                                            flexWrap: 'wrap',
                                                            gap: '1.5rem',
                                                            justifyContent: 'center',
                                                            background: '#f8fafc',
                                                            padding: '1.5rem',
                                                            borderRadius: '12px',
                                                            width: '100%',
                                                            border: '1px solid #e2e8f0'
                                                        }}>
                                                            <div style={{ textAlign: 'center', minWidth: '100px' }}>
                                                                <span style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.5rem' }}>TOTAL PREGUNTAS</span>
                                                                <span style={{ fontSize: '1.5rem', fontWeight: 700, color: '#0f172a' }}>{distData.totalPreguntas}</span>
                                                            </div>
                                                            {distData.stats.map((stat: any, idx: number) => (
                                                                <div key={idx} style={{ textAlign: 'center', minWidth: '100px' }}>
                                                                    <span style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.5rem' }}>{stat.label}</span>
                                                                    <span style={{ fontSize: '1.5rem', fontWeight: 700, color: '#0f172a' }}>{stat.count}</span>
                                                                </div>
                                                            ))}
                                                        </div>
                                                    </div>
                                                );
                                            })()}
                                        </div>
                                    )}
                                </div>
                            ) : (
                                <p className={styles.noHistory}>No se encontraron suficientes registros para generar una gráfica.</p>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default EvaluadosPage;
