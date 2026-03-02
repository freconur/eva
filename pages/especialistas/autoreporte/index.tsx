import React, { useEffect } from 'react'
import { useGlobalContext } from '@/features/context/GlolbalContext'
import UseEvaluacionEspecialistas from '@/features/hooks/UseEvaluacionEspecialistas'
import { RiLoader4Line } from 'react-icons/ri'
import Link from 'next/link'
import styles from './autoreporte.module.css'

const AutoreporteEspecialista = () => {
    const { getEvaluacionesEspecialistas } = UseEvaluacionEspecialistas()
    const { evaluacionDesempeñoDocente, loaderPages } = useGlobalContext()

    useEffect(() => {
        getEvaluacionesEspecialistas()
    }, [])

    return (
        <div className={styles.container}>
            <header className={styles.header}>
                <h1 className={styles.headerTitle}>Autorreporte</h1>
            </header>

            {loaderPages ? (
                <div className={styles.loaderContainer}>
                    <RiLoader4Line className={styles.loaderIcon} />
                    <p className={styles.loaderText}>Buscando evaluaciones...</p>
                </div>
            ) : evaluacionDesempeñoDocente?.length === 0 ? (
                <div className={styles.emptyState}>
                    <p className={styles.emptyText}>No hay evaluaciones disponibles.</p>
                </div>
            ) : (
                <div className={styles.tableContainer}>
                    <table className={styles.table}>
                        <thead className={styles.tableHeader}>
                            <tr>
                                <th className={`${styles.tableHeaderCell} ${styles.tableHeaderCellNumber}`}>#</th>
                                <th className={styles.tableHeaderCell}>Nombre de Evaluación</th>
                                <th className={styles.tableHeaderCell}>Categoría</th>
                                <th className={styles.tableHeaderCell}>Acciones</th>
                            </tr>
                        </thead>
                        <tbody>
                            {evaluacionDesempeñoDocente
                                ?.filter(evaluacion => evaluacion.active === true)
                                .map((evaluacion, index) => (
                                    <tr key={evaluacion.id || index} className={styles.tableRow}>
                                        <td className={`${styles.tableCell} ${styles.tableCellNumber}`}>
                                            {index + 1}
                                        </td>
                                        <td className={styles.tableCell}>
                                            {evaluacion.name}
                                        </td>
                                        <td className={styles.tableCell}>
                                            {evaluacion.categoria && (
                                                <span className={styles.categoryBadge}>
                                                    {evaluacion.categoria}
                                                </span>
                                            )}
                                        </td>
                                        <td className={styles.tableCell}>
                                            <Link
                                                href={`/admin/especialistas/evaluaciones-especialistas/evaluacion/evaluar-especialista?id=${evaluacion.id}`}
                                                className={styles.viewButton}
                                            >
                                                Ver evaluación
                                            </Link>
                                        </td>
                                    </tr>
                                ))}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
    )
}

export default AutoreporteEspecialista