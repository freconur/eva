import React from 'react';
import Link from 'next/link';
import { MdArrowBack, MdPeople, MdPalette } from 'react-icons/md';
import styles from '../styles.module.css';

interface EvaluadosHeaderProps {
	id: string | string[] | undefined;
	dataEvaluacionDocente: any;
	evaluadosCount: number;
	onOpenColorConfig?: () => void;
}

export const EvaluadosHeader: React.FC<EvaluadosHeaderProps> = ({ id, dataEvaluacionDocente, evaluadosCount, onOpenColorConfig }) => {
	return (
		<div className={styles.header}>
			<div className={styles.headerTop}>
				<Link href={`/admin/especialistas/evaluaciones-especialistas/evaluacion/${id}`} className={styles.backButton}>
					<MdArrowBack /> Volver
				</Link>
				{onOpenColorConfig && (
					<button
						type="button"
						className={styles.colorConfigHeaderBtn}
						onClick={onOpenColorConfig}
					>
						<MdPalette style={{ fontSize: '1.1rem', color: '#2563eb' }} />
						Configuración de color
					</button>
				)}
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
					<span>{evaluadosCount} registros</span>
				</div>
			</div>
		</div>
	);
};
