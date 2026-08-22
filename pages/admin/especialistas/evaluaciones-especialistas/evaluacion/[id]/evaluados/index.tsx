import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import { MdPeople, MdBarChart } from 'react-icons/md';
import { useGlobalContext } from '@/features/context/GlolbalContext';
import UseEvaluacionEspecialistas from '@/features/hooks/UseEvaluacionEspecialistas';
import { User } from '@/features/types/types';
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
import styles from '@/features/evaluados-especialistas/styles.module.css';

import { EvaluadosHeader } from '@/features/evaluados-especialistas/components/EvaluadosHeader';
import { EvaluadosTable } from '@/features/evaluados-especialistas/components/EvaluadosTable';
import { AnalyticsDashboard } from '@/features/evaluados-especialistas/components/AnalyticsDashboard';
import { ModalDeleteConfirm } from '@/features/evaluados-especialistas/components/ModalDeleteConfirm';
import { ModalRankingGeneral } from '@/features/evaluados-especialistas/components/ModalRankingGeneral';
import { ModalEvolutionProgress } from '@/features/evaluados-especialistas/components/ModalEvolutionProgress';
import { InteractiveSpotlightTour } from '@/features/evaluados-especialistas/components/InteractiveSpotlightTour';

import { useEvaluadosList } from '@/features/evaluados-especialistas/hooks/useEvaluadosList';
import { useRankingAnalytics } from '@/features/evaluados-especialistas/hooks/useRankingAnalytics';
import { useHistorialEvolucion } from '@/features/evaluados-especialistas/hooks/useHistorialEvolucion';

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
	const [showOnboarding, setShowOnboarding] = useState(false);

	useEffect(() => {
		if (typeof window !== 'undefined') {
			const hasSeen = localStorage.getItem('eva_onboarding_colors_seen');
			if (!hasSeen) {
				const timer = setTimeout(() => {
					setShowOnboarding(true);
				}, 500);
				return () => clearTimeout(timer);
			}
		}
	}, []);
	const {
		evaluadosEspecialista,
		loaderPages,
		dataEvaluacionDocente,
		getPreguntaRespuestaDocentes,
		dimensionesEspecialistas
	} = useGlobalContext();

	const {
		getEspecialistasEvaluados,
		getDataEvaluacion,
		getHistorialEspecialista,
		getPreguntasRespuestasEspecialistas,
		getDimensionesEspecialistas,
		deleteEvaluadoSession,
		saveConfiguracionColoresEspecialistas,
		savePaletaGlobalColores
	} = UseEvaluacionEspecialistas();

	// Custom Hooks
	const evaluadosList = useEvaluadosList(evaluadosEspecialista, dataEvaluacionDocente);

	const rankingAnalytics = useRankingAnalytics(
		evaluadosEspecialista,
		dataEvaluacionDocente,
		evaluadosList.getNivel,
		evaluadosList.getDisplayCalificacion
	);

	const historialEvolucion = useHistorialEvolucion(
		id,
		getHistorialEspecialista,
		dataEvaluacionDocente,
		dimensionesEspecialistas,
		getPreguntaRespuestaDocentes,
		evaluadosList.getDisplayCalificacion,
		evaluadosList.getNivel
	);

	// Page-level State for Navigation & Delete Modal
	const [mainPageTab, setMainPageTab] = useState<'evaluados' | 'graficos'>('evaluados');
	const [showModalRanking, setShowModalRanking] = useState(false);
	const [showConfirmDelete, setShowConfirmDelete] = useState(false);
	const [evaluacionToDelete, setEvaluacionToDelete] = useState<{ id: string; name: string } | null>(null);
	const [isDeleting, setIsDeleting] = useState(false);

	useEffect(() => {
		if (id) {
			getEspecialistasEvaluados(`${id}`);
			getDataEvaluacion(`${id}`);
			getPreguntasRespuestasEspecialistas(`${id}`);
			getDimensionesEspecialistas(`${id}`);
		}
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [id]);

	const handleDeleteClick = (e: React.MouseEvent, evalu: User) => {
		e.stopPropagation();
		const name = `${evalu.nombres || ''} ${evalu.apellidos || ''}`.trim();
		setEvaluacionToDelete({ id: evalu.id!, name });
		setShowConfirmDelete(true);
	};

	const handleConfirmDelete = async () => {
		if (!evaluacionToDelete || !id) return;
		setIsDeleting(true);
		try {
			await deleteEvaluadoSession(`${id}`, evaluacionToDelete.id);
			setShowConfirmDelete(false);
			setEvaluacionToDelete(null);
			if (id) {
				getEspecialistasEvaluados(`${id}`);
			}
			if (historialEvolucion.selectedEspecialista) {
				const historial = await getHistorialEspecialista(`${id}`, historialEvolucion.selectedEspecialista.dni!);
				const listSorted = historial.sort((a, b) => (a as any).fechaMonitoreo - (b as any).fechaMonitoreo);
				historialEvolucion.setHistorialSelected(listSorted);
			}
		} catch (error) {
			console.error("Error al eliminar evaluación:", error);
		} finally {
			setIsDeleting(false);
		}
	};

	const handleOpenColorConfig = () => {
		if (evaluadosEspecialista && evaluadosEspecialista.length > 0) {
			historialEvolucion.handleOpenEvolucion(evaluadosEspecialista[0]);
		} else {
			historialEvolucion.handleOpenEvolucion({
				id: 'config_mode',
				nombres: 'Configuración',
				apellidos: 'Global',
				dni: '00000000'
			});
		}
		historialEvolucion.setActiveTab('configuracion');
		historialEvolucion.setSelectedModalEvalId('all');
	};

	return (
		<div className={styles.container}>
			{/* Header */}
			<EvaluadosHeader
				id={id}
				dataEvaluacionDocente={dataEvaluacionDocente}
				evaluadosCount={evaluadosEspecialista?.length ?? 0}
				onOpenColorConfig={handleOpenColorConfig}
				onOpenOnboarding={() => setShowOnboarding(true)}
			/>

			{/* Main content */}
			<div className={styles.content}>
				{/* Page-level Navigation Tabs */}
				<div className={styles.pageNavTabs}>
					<button
						type="button"
						className={`${styles.pageNavTab} ${mainPageTab === 'evaluados' ? styles.activePageNavTab : ''}`}
						onClick={() => setMainPageTab('evaluados')}
					>
						<MdPeople className={styles.pageNavIcon} /> Lista de Especialistas Evaluados ({evaluadosList.groupedEvaluados.length})
					</button>
					<button
						type="button"
						className={`${styles.pageNavTab} ${mainPageTab === 'graficos' ? styles.activePageNavTab : ''}`}
						onClick={() => setMainPageTab('graficos')}
					>
						<MdBarChart className={styles.pageNavIcon} /> Gráficos & Analíticas
					</button>
				</div>

				{/* Pestaña 1: Lista de Especialistas Evaluados */}
				{mainPageTab === 'evaluados' && (
					<div key="evaluados" className={styles.tabFadeContainer}>
						<EvaluadosTable
							id={id}
							searchQuery={evaluadosList.searchQuery}
							setSearchQuery={evaluadosList.setSearchQuery}
							selectedFase={evaluadosList.selectedFase}
							setSelectedFase={evaluadosList.setSelectedFase}
							fasesUnicas={evaluadosList.fasesUnicas}
							sortOrder={evaluadosList.sortOrder}
							setSortOrder={evaluadosList.setSortOrder}
							showSortDropdown={evaluadosList.showSortDropdown}
							setShowSortDropdown={evaluadosList.setShowSortDropdown}
							sortDropdownRef={evaluadosList.sortDropdownRef}
							setShowModalRanking={setShowModalRanking}
							groupedEvaluados={evaluadosList.groupedEvaluados}
							loaderPages={loaderPages}
							expandedRows={evaluadosList.expandedRows}
							toggleRow={evaluadosList.toggleRow}
							getTrend={evaluadosList.getTrend}
							getDisplayCalificacion={evaluadosList.getDisplayCalificacion}
							getNivel={evaluadosList.getNivel}
							handleOpenEvolucion={historialEvolucion.handleOpenEvolucion}
							handleDeleteClick={handleDeleteClick}
						/>
					</div>
				)}

				{/* Pestaña 2: Gráficos & Analíticas (Nativo en la página) */}
				{mainPageTab === 'graficos' && (
					<div key="graficos" className={styles.tabFadeContainer}>
						<AnalyticsDashboard
							rankingTab={rankingAnalytics.rankingTab}
							setRankingTab={rankingAnalytics.setRankingTab}
							selectedRankingFase={rankingAnalytics.selectedRankingFase}
							setSelectedRankingFase={rankingAnalytics.setSelectedRankingFase}
							fasesUnicas={evaluadosList.fasesUnicas}
							dataEvaluacionDocente={dataEvaluacionDocente}
							rankingEspecialistas={rankingAnalytics.rankingEspecialistas}
							getHorizontalRankingData={rankingAnalytics.getHorizontalRankingData}
							getVerticalRankingData={rankingAnalytics.getVerticalRankingData}
							getUgelRankingData={rankingAnalytics.getUgelRankingData}
							getUgelPieData={rankingAnalytics.getUgelPieData}
							getNivelesPieData={rankingAnalytics.getNivelesPieData}
							executiveMetrics={rankingAnalytics.executiveMetrics}
							handleOpenEvolucion={historialEvolucion.handleOpenEvolucion}
							maxRankingScaleValue={rankingAnalytics.maxRankingScaleValue}
							rankingByUgel={rankingAnalytics.rankingByUgel}
							selectedUgelForDetail={rankingAnalytics.selectedUgelForDetail}
							setSelectedUgelForDetail={rankingAnalytics.setSelectedUgelForDetail}
							selectedUgelSummary={rankingAnalytics.selectedUgelSummary}
							ugelEspecialistasList={rankingAnalytics.ugelEspecialistasList}
							getNivel={evaluadosList.getNivel}
						/>
					</div>
				)}
			</div>

			{/* Deletion Confirmation Modal */}
			<ModalDeleteConfirm
				showConfirmDelete={showConfirmDelete}
				evaluacionToDelete={evaluacionToDelete}
				isDeleting={isDeleting}
				onClose={() => setShowConfirmDelete(false)}
				onConfirm={handleConfirmDelete}
			/>

			{/* Modal Ranking Global */}
			<ModalRankingGeneral
				showModalRanking={showModalRanking}
				onClose={() => setShowModalRanking(false)}
				onSwitchToFullView={() => {
					setShowModalRanking(false);
					setMainPageTab('graficos');
				}}
				rankingTab={rankingAnalytics.rankingTab}
				setRankingTab={rankingAnalytics.setRankingTab}
				selectedRankingFase={rankingAnalytics.selectedRankingFase}
				setSelectedRankingFase={rankingAnalytics.setSelectedRankingFase}
				fasesUnicas={evaluadosList.fasesUnicas}
				dataEvaluacionDocente={dataEvaluacionDocente}
				rankingEspecialistas={rankingAnalytics.rankingEspecialistas}
				getHorizontalRankingData={rankingAnalytics.getHorizontalRankingData}
				getVerticalRankingData={rankingAnalytics.getVerticalRankingData}
				getUgelRankingData={rankingAnalytics.getUgelRankingData}
				getUgelPieData={rankingAnalytics.getUgelPieData}
				getNivelesPieData={rankingAnalytics.getNivelesPieData}
				executiveMetrics={rankingAnalytics.executiveMetrics}
				handleOpenEvolucion={historialEvolucion.handleOpenEvolucion}
				maxRankingScaleValue={rankingAnalytics.maxRankingScaleValue}
				rankingByUgel={rankingAnalytics.rankingByUgel}
				selectedUgelForDetail={rankingAnalytics.selectedUgelForDetail}
				setSelectedUgelForDetail={rankingAnalytics.setSelectedUgelForDetail}
				selectedUgelSummary={rankingAnalytics.selectedUgelSummary}
				ugelEspecialistasList={rankingAnalytics.ugelEspecialistasList}
				getNivel={evaluadosList.getNivel}
			/>

			{/* Evolution Modal */}
			<ModalEvolutionProgress
				showModalEvolucion={historialEvolucion.showModalEvolucion}
				onClose={() => historialEvolucion.setShowModalEvolucion(false)}
				activeTab={historialEvolucion.activeTab}
				setActiveTab={historialEvolucion.setActiveTab}
				loadingHistorial={historialEvolucion.loadingHistorial}
				historialSelected={historialEvolucion.historialSelected}
				chartData={historialEvolucion.chartData}
				chartOptions={historialEvolucion.chartOptions}
				dimensionesEspecialistas={dimensionesEspecialistas}
				getRadarData={historialEvolucion.getRadarData}
				getItemAnalysisData={historialEvolucion.getItemAnalysisData}
				getDistribucionGlobalData={historialEvolucion.getDistribucionGlobalData}
				selectedModalEvalId={historialEvolucion.selectedModalEvalId}
				setSelectedModalEvalId={historialEvolucion.setSelectedModalEvalId}
				latestEvaluation={historialEvolucion.latestEvaluation}
				dataEvaluacionDocente={dataEvaluacionDocente}
				evaluadosEspecialista={evaluadosEspecialista}
				getDisplayCalificacion={evaluadosList.getDisplayCalificacion}
				evalId={`${id}`}
				saveConfiguracionColoresEspecialistas={saveConfiguracionColoresEspecialistas}
				savePaletaGlobalColores={savePaletaGlobalColores}
			/>

			{/* Interactive Spotlight Tour */}
			<InteractiveSpotlightTour
				isOpen={showOnboarding}
				onClose={() => setShowOnboarding(false)}
				onOpenColorConfig={handleOpenColorConfig}
			/>
		</div>
	);
};

export default EvaluadosPage;
