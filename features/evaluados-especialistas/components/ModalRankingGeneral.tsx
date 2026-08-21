import React from 'react';
import { MdLeaderboard, MdOpenInNew } from 'react-icons/md';
import { RankingViews } from './RankingViews';
import styles from '../styles.module.css';

interface ModalRankingGeneralProps {
	showModalRanking: boolean;
	onClose: () => void;
	onSwitchToFullView?: () => void;
	rankingTab: 'horizontal' | 'vertical' | 'podio' | 'ugel';
	setRankingTab: (tab: 'horizontal' | 'vertical' | 'podio' | 'ugel') => void;
	selectedRankingFase: string;
	setSelectedRankingFase: (fase: string) => void;
	fasesUnicas: any[];
	dataEvaluacionDocente: any;
	rankingEspecialistas: any[];
	getHorizontalRankingData: () => any;
	getVerticalRankingData: () => any;
	getUgelRankingData: () => any;
	getUgelPieData?: () => any;
	getNivelesPieData?: () => any;
	executiveMetrics?: any;
	handleOpenEvolucion?: (info: any, evalu?: any) => void;
	maxRankingScaleValue: number;
	rankingByUgel: any[];
	selectedUgelForDetail: string | null;
	setSelectedUgelForDetail: (ugel: string | null) => void;
	selectedUgelSummary: any;
	ugelEspecialistasList: any[];
	getNivel: (score: number) => any;
}

export const ModalRankingGeneral: React.FC<ModalRankingGeneralProps> = ({
	showModalRanking,
	onClose,
	onSwitchToFullView,
	...rankingProps
}) => {
	if (!showModalRanking) return null;

	return (
		<div className={styles.modalOverlay} onClick={onClose}>
			<div className={styles.modalContent} onClick={e => e.stopPropagation()}>
				<div className={styles.modalHeader}>
					<div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
						<MdLeaderboard style={{ fontSize: '1.6rem', color: '#2563eb' }} />
						<div>
							<h2 className={styles.modalTitle}>Ranking de Especialistas</h2>
							<p style={{ margin: 0, fontSize: '0.82rem', color: '#64748b' }}>
								Comparativa general de desempeño según puntajes alcanzados ({rankingProps.rankingEspecialistas.length} especialistas)
							</p>
						</div>
					</div>
					<div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
						{onSwitchToFullView && (
							<button
								type="button"
								className={styles.fullViewButton}
								onClick={() => {
									onClose();
									onSwitchToFullView();
								}}
							>
								<MdOpenInNew /> Ver vista completa
							</button>
						)}
						<button className={styles.modalClose} onClick={onClose}>×</button>
					</div>
				</div>
				<div className={styles.modalBody}>
					<RankingViews {...rankingProps} />
				</div>
			</div>
		</div>
	);
};
