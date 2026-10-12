import React, { useEffect, useState, useMemo } from 'react';
import { useRouter } from 'next/router';
import { MdPeople, MdBarChart } from 'react-icons/md';
import { doc, setDoc } from 'firebase/firestore';
import { db } from '@/firebase/firebase.config';
import { useGlobalContext } from '@/features/context/GlolbalContext';
import useEvaluacionDesempenoBase from '@/features/hooks/useEvaluacionDesempenoBase';
import useUsuario from '@/features/hooks/useUsuario';
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

export interface EvaluadosDashboardContainerProps {
	id?: string;
	collectionName: 'evaluaciones-especialistas' | 'evaluaciones-director' | 'evaluaciones-docentes' | string;
	role: 'especialista' | 'director' | 'docente' | string;
	targetTitle: string;
	targetNoun: string;
	targetNounSingular: string;
	backHref: string;
	getReporteIndividualHref?: (id: string, evalu: User) => string;
}

export const EvaluadosDashboardContainer: React.FC<EvaluadosDashboardContainerProps> = ({
	id: propId,
	collectionName,
	role,
	targetTitle,
	targetNoun,
	targetNounSingular,
	backHref,
	getReporteIndividualHref,
}) => {
	const router = useRouter();
	const id = propId || (router.query.id as string);
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
		allEspecialistas,
		loaderPages,
		dataEvaluacionDocente,
		getPreguntaRespuestaDocentes,
		dimensionesEspecialistas
	} = useGlobalContext();

	const {
		getEvaluados,
		getDataEvaluacion,
		getHistorialEvaluado,
		getPreguntasRespuestas,
		getDimensiones,
		deleteEvaluadoSession,
		updateNivelesEvaluacion
	} = useEvaluacionDesempenoBase({
		collectionName,
		role: role as any,
	});

	const { getAllEspecialistas } = useUsuario();

	// Escuchar especialistas activos solo cuando la evaluación corresponde al rol de especialistas
	useEffect(() => {
		if (role === 'especialista' || collectionName === 'evaluaciones-especialistas' || collectionName === 'evaluaciones-especialista') {
			const unsubscribe = getAllEspecialistas();
			return () => {
				if (typeof unsubscribe === 'function') unsubscribe();
			};
		}
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [role, collectionName]);

	const activeDnisSet = useMemo(() => {
		if (role !== 'especialista' && collectionName !== 'evaluaciones-especialistas' && collectionName !== 'evaluaciones-especialista') {
			return null;
		}
		if (!allEspecialistas || allEspecialistas.length === 0) return null;
		return new Set(
			allEspecialistas
				.map((esp) => (esp.dni ? String(esp.dni).trim() : ''))
				.filter(Boolean)
		);
	}, [allEspecialistas, role, collectionName]);

	// Evaluaciones válidas: se descartan huérfanas si existe filtro de activos
	const evaluadosValidos = useMemo(() => {
		if (!evaluadosEspecialista || evaluadosEspecialista.length === 0) return [];
		if (!activeDnisSet) return evaluadosEspecialista;

		return evaluadosEspecialista.filter((evalu) => {
			const dni = String(
				(evalu as any).especialistaDni ||
				(evalu as any).directorDni ||
				(evalu as any).docenteDni ||
				evalu.dni ||
				''
			).trim();
			return activeDnisSet.has(dni);
		});
	}, [evaluadosEspecialista, activeDnisSet]);

	// Hooks para lista y métricas
	const evaluadosList = useEvaluadosList(evaluadosValidos, dataEvaluacionDocente);

	const rankingAnalytics = useRankingAnalytics(
		evaluadosValidos,
		dataEvaluacionDocente,
		evaluadosList.getNivel,
		evaluadosList.getDisplayCalificacion
	);

	const historialEvolucion = useHistorialEvolucion(
		id,
		getHistorialEvaluado,
		dataEvaluacionDocente,
		dimensionesEspecialistas,
		getPreguntaRespuestaDocentes,
		evaluadosList.getDisplayCalificacion,
		evaluadosList.getNivel
	);

	// Navegación de pestañas y modales
	const [mainPageTab, setMainPageTab] = useState<'evaluados' | 'graficos'>('evaluados');
	const [showModalRanking, setShowModalRanking] = useState(false);
	const [showConfirmDelete, setShowConfirmDelete] = useState(false);
	const [evaluacionToDelete, setEvaluacionToDelete] = useState<{ id: string; name: string } | null>(null);
	const [isDeleting, setIsDeleting] = useState(false);

	useEffect(() => {
		if (id) {
			const unsubEval = getEvaluados(`${id}`);
			const unsubDoc = getDataEvaluacion(`${id}`);
			const unsubPreg = getPreguntasRespuestas(`${id}`);
			const unsubDims = getDimensiones(`${id}`);

			return () => {
				if (typeof unsubEval === 'function') unsubEval();
				if (typeof unsubDoc === 'function') unsubDoc();
				if (typeof unsubPreg === 'function') unsubPreg();
				if (typeof unsubDims === 'function') unsubDims();
			};
		}
	}, [id, getEvaluados, getDataEvaluacion, getPreguntasRespuestas, getDimensiones]);

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
				getEvaluados(`${id}`);
			}
			if (historialEvolucion.selectedEspecialista) {
				const historial = await getHistorialEvaluado(`${id}`, historialEvolucion.selectedEspecialista.dni!);
				const listSorted = historial.sort((a, b) => (a as any).fechaMonitoreo - (b as any).fechaMonitoreo);
				historialEvolucion.setHistorialSelected(listSorted);
			}
		} catch (error) {
			console.error('Error al eliminar evaluación:', error);
		} finally {
			setIsDeleting(false);
		}
	};

	const handleUpdateNivelColor = async (nivelIdx: number, newColor: string) => {
		if (!id || !dataEvaluacionDocente?.niveles) return;
		const currentNiveles = [...dataEvaluacionDocente.niveles];
		if (!currentNiveles[nivelIdx]) return;
		currentNiveles[nivelIdx] = {
			...currentNiveles[nivelIdx],
			color: newColor
		};
		try {
			await updateNivelesEvaluacion(`${id}`, currentNiveles);
		} catch (error) {
			console.error('Error al actualizar color de nivel:', error);
		}
	};

	const saveConfiguracionColores = async (evalId: string, configuracionColores: any) => {
		const docRef = doc(db, collectionName, evalId);
		await setDoc(docRef, { configuracionColores }, { merge: true });
		if (configuracionColores?.palette && Array.isArray(configuracionColores.palette)) {
			const globalPaletteRef = doc(db, 'configuraciones', 'paletaColoresEspecialistas');
			await setDoc(globalPaletteRef, { palette: configuracionColores.palette }, { merge: true });
		}
	};

	const savePaletaGlobalColores = async (palette: string[]) => {
		const docRef = doc(db, 'configuraciones', 'paletaColoresEspecialistas');
		await setDoc(docRef, { palette }, { merge: true });
	};

	const handleOpenColorConfig = () => {
		if (evaluadosValidos && evaluadosValidos.length > 0) {
			historialEvolucion.handleOpenEvolucion(evaluadosValidos[0]);
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
				evaluadosCount={evaluadosValidos.length}
				onOpenColorConfig={handleOpenColorConfig}
				onOpenOnboarding={() => setShowOnboarding(true)}
				backHref={backHref}
				title={targetTitle}
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
						<MdPeople className={styles.pageNavIcon} /> Lista de {targetNoun.charAt(0).toUpperCase() + targetNoun.slice(1)} Evaluados ({evaluadosList.groupedEvaluados.length})
					</button>
					<button
						type="button"
						className={`${styles.pageNavTab} ${mainPageTab === 'graficos' ? styles.activePageNavTab : ''}`}
						onClick={() => setMainPageTab('graficos')}
					>
						<MdBarChart className={styles.pageNavIcon} /> Gráficos & Analíticas
					</button>
				</div>

				{/* Pestaña 1: Lista de Evaluados */}
				{mainPageTab === 'evaluados' && (
					<div key="evaluados" className={styles.tabFadeContainer}>
						<EvaluadosTable
							id={id}
							searchQuery={evaluadosList.searchQuery}
							setSearchQuery={evaluadosList.setSearchQuery}
							selectedFase={evaluadosList.selectedFase}
							setSelectedFase={evaluadosList.setSelectedFase}
							selectedUgel={evaluadosList.selectedUgel}
							setSelectedUgel={evaluadosList.setSelectedUgel}
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
							targetNoun={targetNoun}
							tableColumnLabel={targetNounSingular}
							getReporteIndividualHref={getReporteIndividualHref}
						/>
					</div>
				)}

				{/* Pestaña 2: Gráficos & Analíticas */}
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
							onUpdateNivelColor={handleUpdateNivelColor}
							targetNoun={targetNoun}
							targetNounSingular={targetNounSingular}
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
				onUpdateNivelColor={handleUpdateNivelColor}
				targetNoun={targetNoun}
				targetNounSingular={targetNounSingular}
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
				evaluadosEspecialista={evaluadosValidos}
				getDisplayCalificacion={evaluadosList.getDisplayCalificacion}
				evalId={`${id}`}
				saveConfiguracionColoresEspecialistas={saveConfiguracionColores}
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

export default EvaluadosDashboardContainer;
