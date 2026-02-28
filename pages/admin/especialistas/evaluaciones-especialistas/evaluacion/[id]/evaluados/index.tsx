import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';
import { MdArrowBack, MdSearch, MdPeople } from 'react-icons/md';
import { RiLoader4Line } from 'react-icons/ri';
import { useGlobalContext } from '@/features/context/GlolbalContext';
import UseEvaluacionEspecialistas from '@/features/hooks/UseEvaluacionEspecialistas';
import { User } from '@/features/types/types';
import { regionTexto } from '@/fuctions/regiones';
import styles from './styles.module.css';

const EvaluadosPage = () => {
    const router = useRouter();
    const { id } = router.query;
    const { evaluadosEspecialista, loaderPages, dataEvaluacionDocente } = useGlobalContext();
    const { getEspecialistasEvaluados, getDataEvaluacion } = UseEvaluacionEspecialistas();
    const [searchQuery, setSearchQuery] = useState<string>('');

    useEffect(() => {
        if (id) {
            getEspecialistasEvaluados(`${id}`);
            getDataEvaluacion(`${id}`);
        }
    }, [id]);

    const filteredEvaluados: User[] = evaluadosEspecialista?.filter((esp) => {
        if (!searchQuery) return true;
        const q = searchQuery.toLowerCase();
        return (
            esp.nombres?.toLowerCase().includes(q) ||
            esp.apellidos?.toLowerCase().includes(q) ||
            esp.dni?.toLowerCase().includes(q) ||
            esp.ugel?.toLowerCase().includes(q)
        );
    }) ?? [];

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
                        {filteredEvaluados.length} resultado{filteredEvaluados.length !== 1 ? 's' : ''}
                    </span>
                </div>

                {/* Table */}
                {loaderPages ? (
                    <div className={styles.loaderContainer}>
                        <RiLoader4Line className={styles.loaderIcon} />
                        <p className={styles.loaderText}>Cargando especialistas...</p>
                    </div>
                ) : filteredEvaluados.length === 0 ? (
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
                                    <th>#</th>
                                    <th>DNI</th>
                                    <th>Nombres y Apellidos</th>
                                    <th>UGEL</th>
                                    <th>Fecha Monitoreo</th>
                                    <th>Calificación</th>
                                    <th>Acciones</th>
                                </tr>
                            </thead>
                            <tbody>
                                {filteredEvaluados.map((esp, index) => (
                                    <tr key={esp.dni ?? index} className={styles.tableRow}>
                                        <td className={styles.tdIndex}>{index + 1}</td>
                                        <td className={styles.tdDni}>{esp.dni ?? '—'}</td>
                                        <td className={styles.tdName}>
                                            {`${esp.nombres ?? ''} ${esp.apellidos ?? ''}`.trim() || '—'}
                                        </td>
                                        <td className={styles.tdUgel}>{regionTexto(String(esp.region)) ?? '—'}</td>
                                        <td className={styles.tdDate}>{esp.fechaMonitoreo ?? '—'}</td>
                                        <td>
                                            <span className={styles.calificacionBadge}>
                                                {esp.calificacion ?? '—'}
                                            </span>
                                        </td>
                                        <td>
                                            <Link
                                                href={`/admin/especialistas/evaluaciones-especialistas/evaluacion/reporte-especialista-individual?idEvaluacion=${id}&idDirector=${esp.dni}`}
                                                className={styles.viewButton}
                                            >
                                                Ver reporte
                                            </Link>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>
        </div>
    );
};

export default EvaluadosPage;
