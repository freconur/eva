import React from 'react';
import Link from 'next/link';
import { MdArrowBack, MdPeople, MdPalette, MdHelpOutline } from 'react-icons/md';
import { RiSearchLine } from 'react-icons/ri';
import styles from '../styles.module.css';

interface EvaluadosHeaderProps {
	id: string | string[] | undefined;
	dataEvaluacionDocente: any;
	evaluadosCount: number;
	onOpenColorConfig?: () => void;
	onOpenOnboarding?: () => void;
	onOpenSearch?: () => void;
	backHref?: string;
	title?: string;
}

export const EvaluadosHeader: React.FC<EvaluadosHeaderProps> = ({
	id,
	dataEvaluacionDocente,
	evaluadosCount,
	onOpenColorConfig,
	onOpenOnboarding,
	onOpenSearch,
	backHref,
	title,
}) => {
	const returnUrl = backHref || `/admin/especialistas/evaluaciones-especialistas/evaluacion/${id}`;
	const headerTitle = title || 'Especialistas Evaluados';

	return (
		<div className={styles.header}>
			<div className={styles.headerTop}>
				<Link href={returnUrl} className={styles.backButton}>
					<MdArrowBack /> Volver
				</Link>

				<div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
					{onOpenSearch && (
						<button
							type="button"
							className={styles.quickSearchTriggerBtn}
							onClick={onOpenSearch}
							title="Buscador inteligente de especialistas (Ctrl + K)"
						>
							<RiSearchLine style={{ fontSize: '1rem', color: '#2563eb' }} />
							<span>Buscar especialista</span>
							<kbd className={styles.quickSearchKbd}>Ctrl K</kbd>
						</button>
					)}

					{onOpenOnboarding && (
						<button
							type="button"
							className={styles.helpGuideHeaderBtn}
							onClick={onOpenOnboarding}
							title="Ver guía de novedades"
						>
							<MdHelpOutline style={{ fontSize: '1.1rem', color: '#2563eb' }} />
							Guía de Novedades
						</button>
					)}

					{onOpenColorConfig && (
						<button
							type="button"
							className={styles.colorConfigHeaderBtn}
							onClick={onOpenColorConfig}
							data-tour="header-color-btn"
						>
							<MdPalette style={{ fontSize: '1.1rem', color: '#2563eb' }} />
							Configuración de color
						</button>
					)}
				</div>
			</div>
			<div className={styles.headerContent}>
				<h1 className={styles.headerTitle}>
					{headerTitle}
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
