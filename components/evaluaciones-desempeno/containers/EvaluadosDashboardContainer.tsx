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
	const queryInstitucion = (router.query.institucion as string) || '';
	const queryDniDirector = (router.query.dniDirector as string) || '';
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
		currentUserData,
		evaluadosEspecialista,
		allEspecialistas,
		loaderPages,
		dataEvaluacionDocente,
		getPreguntaRespuestaDocentes,
		dimensionesEspecialistas,
	} = useGlobalContext();

	const {
		getEvaluados,
		getParrillaEvaluados,
		getDataEvaluacion,
		getHistorialEvaluado,
		getPreguntasRespuestas,
		getDimensiones,
		deleteEvaluadoSession,
		updateNivelesEvaluacion,
	} = useEvaluacionDesempenoBase({
		collectionName,
		role: role as any,
	});

	const { getAllEspecialistas } = useUsuario();

	const isDirectorRole = role === 'director' || currentUserData?.rol === 2;
	const isMonitorDocente = collectionName === 'evaluaciones-docentes' && !isDirectorRole;

	// Conjunto de DNIs del director autenticado y sus predecesores
	const directorDnis = useMemo(() => {
		if (!currentUserData?.dni) return new Set<string>();
		const dnis = new Set<string>();
		const cleanDni = String(currentUserData.dni).trim();
		if (cleanDni) dnis.add(cleanDni);
		const pred = String((currentUserData as any).directorPredecesor || currentUserData.dniDirectorPredecesor || '').trim();
		if (pred) dnis.add(pred);
		if (Array.isArray(currentUserData.directoresPredecesores)) {
			currentUserData.directoresPredecesores.forEach((d: string) => {
				const c = String(d || '').trim();
				if (c) dnis.add(c);
			});
		}
		return dnis;
	}, [
		currentUserData?.dni,
		(currentUserData as any)?.directorPredecesor,
		currentUserData?.dniDirectorPredecesor,
		currentUserData?.directoresPredecesores,
	]);

	// Padrón de docentes oficiales asignados a este director o institución
	const [docentesPadronDnis, setDocentesPadronDnis] = useState<Set<string>>(new Set());

	useEffect(() => {
		let isMounted = true;
		const targetDniDirector = isDirectorRole ? currentUserData?.dni : queryDniDirector;
		const targetInstitucion = !isDirectorRole ? queryInstitucion : undefined;

		if (targetDniDirector) {
			getParrillaEvaluados('dniDirector', targetDniDirector)
				.then((docentes) => {
					if (isMounted && Array.isArray(docentes)) {
						const dnis = new Set(
							docentes
								.map((d) => (d.dni ? String(d.dni).trim() : ''))
								.filter(Boolean)
						);
						setDocentesPadronDnis(dnis);
					}
				})
				.catch((err) => {
					console.error('Error al cargar padrón de docentes por dniDirector:', err);
				});
		} else if (targetInstitucion) {
			getParrillaEvaluados('institucion', targetInstitucion)
				.then((docentes) => {
					if (isMounted && Array.isArray(docentes)) {
						const dnis = new Set(
							docentes
								.map((d) => (d.dni ? String(d.dni).trim() : ''))
								.filter(Boolean)
						);
						setDocentesPadronDnis(dnis);
					}
				})
				.catch((err) => {
					console.error('Error al cargar padrón de docentes por institucion:', err);
				});
		}
		return () => {
			isMounted = false;
		};
	}, [isDirectorRole, currentUserData?.dni, queryDniDirector, queryInstitucion, getParrillaEvaluados]);

	// Escuchar especialistas activos solo cuando la evaluación corresponde a la colección de especialistas
	useEffect(() => {
		if (collectionName === 'evaluaciones-especialistas' || collectionName === 'evaluaciones-especialista') {
			const unsubscribe = getAllEspecialistas();
			return () => {
				if (typeof unsubscribe === 'function') unsubscribe();
			};
		}
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [role, collectionName]);

	const activeDnisSet = useMemo(() => {
		if (collectionName !== 'evaluaciones-especialistas' && collectionName !== 'evaluaciones-especialista') {
			return null;
		}
		if (!allEspecialistas || allEspecialistas.length === 0) return null;
		return new Set(
			allEspecialistas
				.map((esp) => (esp.dni ? String(esp.dni).trim() : ''))
				.filter(Boolean)
		);
	}, [allEspecialistas, collectionName]);

	// Evaluaciones válidas: se descartan huérfanas o fuera del alcance del rol
	const evaluadosValidos = useMemo(() => {
		if (!evaluadosEspecialista || evaluadosEspecialista.length === 0) return [];

		let list = evaluadosEspecialista;

		// 1. Filtro estricto para rol Director:
		// Únicamente mostrar evaluaciones de docentes vinculados por dniDirector (o padrón oficial de dniDirector)
		if (isDirectorRole) {
			// Si aún no han cargado los datos del director autenticado, evitar fuga de registros de otras I.E.
			if (directorDnis.size === 0) {
				return [];
			}

			list = list.filter((evalu) => {
				const evaluDirectorDni = String(
					(evalu as any).dniDirector ||
					(evalu as any).directorDni ||
					''
				).trim();

				// Si el registro contiene explícitamente el dniDirector, validar que coincida con este director
				if (evaluDirectorDni) {
					return directorDnis.has(evaluDirectorDni);
				}

				// Si el registro no tiene dniDirector explícito, comprobar si el docente está en el padrón por dniDirector
				const teacherDni = String(
					(evalu as any).docenteDni ||
					(evalu as any).evaluadoDni ||
					evalu.dni ||
					''
				).trim();

				if (teacherDni && docentesPadronDnis.has(teacherDni)) {
					return true;
				}

				return false;
			});
		}

		// 2. Filtro estricto para Especialistas y Administradores en Evaluaciones Docentes:
		// Únicamente mostrar docentes evaluados por este especialista o administrador autenticado
		if (isMonitorDocente) {
			const userDni = currentUserData?.dni ? String(currentUserData.dni).trim() : '';
			if (!userDni) {
				return [];
			}

			list = list.filter((ev: any) => {
				// 1. Excluir explícitamente evaluaciones efectuadas por el Director de la institución
				if (ev.evaluadorRol === 'director') {
					return false;
				}

				// 2. Si no tiene evaluadorRol explícito pero carece de identificador de monitor y fue guardada con dniDirector
				if (
					!ev.evaluadorRol &&
					!ev.especialistaDni &&
					!ev.adminDni &&
					ev.dniDirector &&
					(ev.evaluadorDni === ev.dniDirector || !ev.evaluadorDni)
				) {
					return false;
				}

				// 3. Comprobar que la evaluación haya sido realizada por este especialista o administrador
				const monitorDni = String(
					ev.evaluadorDni ||
					ev.especialistaDni ||
					ev.adminDni ||
					ev.datosMonitor?.dni ||
					''
				).trim();

				if (monitorDni && monitorDni === userDni) {
					return true;
				}

				return false;
			});
		}

		// 3. Filtro por Institución Educativa o Director (cuando se navega desde la tarjeta de la I.E.)
		if (queryInstitucion || queryDniDirector) {
			const targetNorm = queryInstitucion
				? queryInstitucion.toLowerCase().replace(/^i\.?e\.?\s*/i, '').trim()
				: '';
			const targetDni = queryDniDirector.trim();

			list = list.filter((ev: any) => {
				const evInst = (ev.institucion || ev.info?.institucion || '').toString().trim();
				const evDniDir = (ev.dniDirector || '').toString().trim();

				if (targetDni && evDniDir && evDniDir === targetDni) {
					return true;
				}
				if (targetNorm && evInst) {
					const norm = evInst.toLowerCase().replace(/^i\.?e\.?\s*/i, '').trim();
					return norm === targetNorm || norm.includes(targetNorm) || targetNorm.includes(norm);
				}
				return false;
			});
		}

		// 4. Filtro para especialistas huérfanos (si aplica)
		if (activeDnisSet) {
			list = list.filter((evalu) => {
				const dni = String(
					(evalu as any).especialistaDni ||
					(evalu as any).directorDni ||
					(evalu as any).docenteDni ||
					evalu.dni ||
					''
				).trim();
				return activeDnisSet.has(dni);
			});
		}

		return list;
	}, [
		evaluadosEspecialista,
		isDirectorRole,
		isMonitorDocente,
		currentUserData?.dni,
		directorDnis,
		docentesPadronDnis,
		activeDnisSet,
		queryInstitucion,
		queryDniDirector,
	]);

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
			const unsubEval = getEvaluados(
				`${id}`,
				isDirectorRole
					? { dniDirector: currentUserData?.dni }
					: !isMonitorDocente && (queryDniDirector || queryInstitucion)
					? {
							dniDirector: queryDniDirector || null,
							institucion: queryInstitucion || null,
					  }
					: undefined
			);
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
	}, [
		id,
		isDirectorRole,
		isMonitorDocente,
		currentUserData?.dni,
		queryDniDirector,
		queryInstitucion,
		getEvaluados,
		getDataEvaluacion,
		getPreguntasRespuestas,
		getDimensiones,
	]);

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
				getEvaluados(
					`${id}`,
					isDirectorRole
						? { dniDirector: currentUserData?.dni }
						: !isMonitorDocente && (queryDniDirector || queryInstitucion)
						? {
								dniDirector: queryDniDirector || null,
								institucion: queryInstitucion || null,
						  }
						: undefined
				);
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
				title={
					queryInstitucion
						? `${targetTitle} • ${queryInstitucion.startsWith('I.E.') ? queryInstitucion : `I.E. ${queryInstitucion}`}`
						: targetTitle
				}
			/>

			{/* Main content */}
			<div className={styles.content}>
				{/* Banner Informativo cuando se filtra por Institución Educativa */}
				{queryInstitucion && (
					<div className="flex items-center justify-between gap-3 px-4 py-2.5 mb-4 bg-purple-50/80 border border-purple-200/90 rounded-2xl text-xs sm:text-sm text-purple-900 shadow-2xs">
						<div className="flex items-center gap-2.5">
							<span className="w-2.5 h-2.5 rounded-full bg-purple-600 animate-pulse shrink-0" />
							<span>
								Resultados y analíticas exclusivos de:{' '}
								<strong className="font-bold text-purple-800">
									{queryInstitucion.startsWith('I.E.') ? queryInstitucion : `I.E. ${queryInstitucion}`}
								</strong>{' '}
								({evaluadosList.groupedEvaluados.length} {evaluadosList.groupedEvaluados.length === 1 ? 'docente' : 'docentes'})
							</span>
						</div>
						<button
							type="button"
							onClick={() => {
								const { institucion, dniDirector, ...rest } = router.query;
								router.replace({ pathname: router.pathname, query: rest }, undefined, { shallow: true });
							}}
							className="font-bold text-purple-700 hover:text-purple-900 underline cursor-pointer shrink-0"
						>
							Ver todas las I.E.
						</button>
					</div>
				)}

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
