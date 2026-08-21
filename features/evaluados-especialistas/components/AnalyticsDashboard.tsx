import React from 'react';
import { RankingViews } from './RankingViews';
import styles from '../styles.module.css';

interface AnalyticsDashboardProps {
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

export const AnalyticsDashboard: React.FC<AnalyticsDashboardProps> = (props) => {
	return (
		<div className={styles.embeddedAnalyticsCard}>
			<RankingViews {...props} />
		</div>
	);
};
