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
    Title,
    Tooltip,
    Legend,
} from 'chart.js';
import { Line } from 'react-chartjs-2';
import styles from './styles.module.css';

ChartJS.register(
    CategoryScale,
    LinearScale,
    PointElement,
    LineElement,
    Title,
    Tooltip,
    Legend
);

const EvaluadosPage = () => {
    const router = useRouter();
    const { id } = router.query;
    const { evaluadosEspecialista, loaderPages, dataEvaluacionDocente } = useGlobalContext();
    const { getEspecialistasEvaluados, getDataEvaluacion, getHistorialEspecialista } = UseEvaluacionEspecialistas();
    const [searchQuery, setSearchQuery] = useState<string>('');
    const [showModalEvolucion, setShowModalEvolucion] = useState(false);
    const [selectedEspecialista, setSelectedEspecialista] = useState<User | null>(null);
    const [historialSelected, setHistorialSelected] = useState<User[]>([]);
    const [loadingHistorial, setLoadingHistorial] = useState(false);
    const [expandedRows, setExpandedRows] = useState<Set<string>>(new Set());

    useEffect(() => {
        if (id) {
            getEspecialistasEvaluados(`${id}`);
            getDataEvaluacion(`${id}`);
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

    const groupedEvaluados = useMemo(() => {
        if (!evaluadosEspecialista) return [];

        const groups: { [dni: string]: { info: User; evaluations: User[] } } = {};

        evaluadosEspecialista.forEach((esp) => {
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
    }, [evaluadosEspecialista, searchQuery]);

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
    };

    const chartData = {
        labels: historialSelected.map(h => h.fechaMonitoreo || '—'),
        datasets: [
            {
                label: 'Calificación',
                data: historialSelected.map(h => h.calificacion || 0),
                borderColor: '#2563eb',
                backgroundColor: 'rgba(37, 99, 235, 0.5)',
                tension: 0.3,
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
        },
        scales: {
            y: {
                beginAtZero: true,
                max: 100, // Ajustar según escala máxima real
            }
        }
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
                                                    <span className={styles.calificacionBadge}>
                                                        {latestEval?.calificacion ?? '—'}
                                                    </span>
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
                                                                                <span className={styles.evalDate}>{evalu.fechaMonitoreo || '—'}</span>
                                                                                <span className={styles.evalTime}>{formatTime(evalu.fechaCreacion)}</span>
                                                                            </div>
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
                            {loadingHistorial ? (
                                <div className={styles.modalLoading}>
                                    <RiLoader4Line className={styles.loadingIcon} />
                                    <span>Cargando historial...</span>
                                </div>
                            ) : historialSelected.length > 0 ? (
                                <div className={styles.chartContainer}>
                                    <Line data={chartData} options={chartOptions} />
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
