import { useState, useMemo } from 'react';
import { User } from '@/features/types/types';
import { regionTexto } from '@/fuctions/regiones';
import { getMonitoreoTimestamp, getCleanPhaseName } from '../components/utils';

export const useRankingAnalytics = (
	evaluadosEspecialista: User[] | undefined,
	dataEvaluacionDocente: any,
	getNivel: (calificacion: number) => any,
	getDisplayCalificacion: (evalu: any) => number
) => {
	const [rankingTab, setRankingTab] = useState<'horizontal' | 'vertical' | 'podio' | 'ugel'>('horizontal');
	const [selectedRankingFase, setSelectedRankingFase] = useState<string>('');
	const [selectedUgelForDetail, setSelectedUgelForDetail] = useState<string | null>(null);

	const rankingEspecialistas = useMemo(() => {
		if (!evaluadosEspecialista || evaluadosEspecialista.length === 0) return [];

		const mapGroup = new Map<string, { info: User; evaluations: User[] }>();

		evaluadosEspecialista.forEach(item => {
			const key = item.dni || item.id || 'desconocido';
			if (!mapGroup.has(key)) {
				mapGroup.set(key, { info: item, evaluations: [] });
			}
			mapGroup.get(key)!.evaluations.push(item);
		});

		const list = Array.from(mapGroup.values()).map(group => {
			let evals = group.evaluations.sort((a, b) => getMonitoreoTimestamp(a) - getMonitoreoTimestamp(b));

			if (selectedRankingFase) {
				evals = evals.filter(e => {
					const idF = (e as any).idFase || (e as any).faseActualID || e.faseNombre;
					return idF === selectedRankingFase;
				});
			}

			const targetEval = evals[evals.length - 1];
			const score = targetEval ? getDisplayCalificacion(targetEval) : 0;
			const totalScore = evals.reduce((sum, e) => sum + getDisplayCalificacion(e), 0);
			const evalsCount = evals.length;
			const promedioHistorico = evalsCount > 0 ? Number((totalScore / evalsCount).toFixed(1)) : score;
			const fasesList = evals.map(e => getCleanPhaseName((e as any).faseNombre, (e as any).idFase || (e as any).faseActualID));

			const fullName = `${group.info.nombres ?? ''} ${group.info.apellidos ?? ''}`.trim().toUpperCase() || '—';
			const ugel = regionTexto(String(group.info.region)) ?? '—';
			const nivelObj = getNivel(score);

			return {
				dni: group.info.dni,
				fullName,
				ugel,
				score,
				totalScore,
				promedioHistorico,
				evalsCount,
				fasesList,
				nivel: nivelObj,
				evaluationsSorted: evals,
				info: group.info
			};
		}).filter(item => item.evaluationsSorted.length > 0);

		list.sort((a, b) => b.score - a.score);
		return list;
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [evaluadosEspecialista, selectedRankingFase, dataEvaluacionDocente]);

	const rankingByUgel = useMemo(() => {
		if (rankingEspecialistas.length === 0) return [];
		const mapUgel = new Map<string, { totalScore: number; count: number; ugel: string }>();

		rankingEspecialistas.forEach(r => {
			const u = r.ugel || 'Desconocido';
			if (!mapUgel.has(u)) {
				mapUgel.set(u, { totalScore: 0, count: 0, ugel: u });
			}
			const curr = mapUgel.get(u)!;
			curr.totalScore += r.score;
			curr.count += 1;
		});

		const result = Array.from(mapUgel.values()).map(item => ({
			ugel: item.ugel,
			promedio: Number((item.totalScore / item.count).toFixed(2)),
			cantidad: item.count
		}));

		result.sort((a, b) => b.promedio - a.promedio);
		return result;
	}, [rankingEspecialistas]);

	const ugelEspecialistasList = useMemo(() => {
		if (!selectedUgelForDetail) return [];
		return rankingEspecialistas.filter(r => r.ugel === selectedUgelForDetail);
	}, [rankingEspecialistas, selectedUgelForDetail]);

	const selectedUgelSummary = useMemo(() => {
		if (!selectedUgelForDetail) return null;
		return rankingByUgel.find(u => u.ugel === selectedUgelForDetail) || null;
	}, [rankingByUgel, selectedUgelForDetail]);

	const maxRankingScaleValue = useMemo(() => {
		if (rankingEspecialistas.length === 0) return 20;
		const maxScoreInRanking = Math.max(...rankingEspecialistas.map(r => r.score));
		return Math.max(maxScoreInRanking, 20);
	}, [rankingEspecialistas]);

	const executiveMetrics = useMemo(() => {
		if (rankingEspecialistas.length === 0) {
			return {
				promedioGeneral: 0,
				topPerformer: null,
				atencionPrioritariaList: [],
				satisfactoriosCount: 0,
				tasaExitoPct: '0',
				minScore: 0,
				maxScore: 0,
				brechaPuntaje: 0
			};
		}

		const total = rankingEspecialistas.length;
		const sumScores = rankingEspecialistas.reduce((acc, r) => acc + r.score, 0);
		const promedioGeneral = Number((sumScores / total).toFixed(2));

		const topPerformer = rankingEspecialistas[0];
		const minScore = Math.min(...rankingEspecialistas.map(r => r.score));
		const maxScore = Math.max(...rankingEspecialistas.map(r => r.score));
		const brechaPuntaje = Number((maxScore - minScore).toFixed(1));

		const atencionPrioritariaList = rankingEspecialistas.filter(r => {
			const n = (r.nivel?.nivel || '').toLowerCase();
			return n.includes('inicio') || r.score < 11;
		});

		const satisfactoriosCount = rankingEspecialistas.filter(r => {
			const n = (r.nivel?.nivel || '').toLowerCase();
			return n.includes('esperado') || n.includes('satisfactorio') || n.includes('destacado') || n.includes('innovador');
		}).length;

		const tasaExitoPct = ((satisfactoriosCount / total) * 100).toFixed(1);

		return {
			promedioGeneral,
			topPerformer,
			atencionPrioritariaList,
			satisfactoriosCount,
			tasaExitoPct,
			minScore,
			maxScore,
			brechaPuntaje
		};
	}, [rankingEspecialistas]);

	const getHorizontalRankingData = () => {
		if (rankingEspecialistas.length === 0) return { labels: [], datasets: [] };

		const maxEvalsCount = Math.max(...rankingEspecialistas.map(r => r.evaluationsSorted.length), 1);

		const datasets = [];
		for (let i = 0; i < maxEvalsCount; i++) {
			const data = rankingEspecialistas.map(r => {
				const evalu = r.evaluationsSorted[i];
				if (!evalu) return 0;
				const sumScores = r.evaluationsSorted.reduce((acc, ev) => acc + getDisplayCalificacion(ev), 0);
				const evalScore = getDisplayCalificacion(evalu);
				if (sumScores === 0) return 0;
				return Number(((evalScore / sumScores) * r.score).toFixed(3));
			});

			const rawScores = rankingEspecialistas.map(r => {
				const evalu = r.evaluationsSorted[i];
				return evalu ? getDisplayCalificacion(evalu) : 0;
			});

			const phaseNames = rankingEspecialistas.map(r => {
				const evalu = r.evaluationsSorted[i];
				if (!evalu) return '';
				return getCleanPhaseName((evalu as any).faseNombre, (evalu as any).idFase || (evalu as any).faseActualID);
			});

			const backgroundColor = rankingEspecialistas.map(r => {
				const evalu = r.evaluationsSorted[i];
				if (!evalu) return 'transparent';
				const score = getDisplayCalificacion(evalu);
				const nivelObj = getNivel(score);
				return nivelObj?.color || '#3b82f6';
			});

			const borderColor = rankingEspecialistas.map(r => {
				const evalu = r.evaluationsSorted[i];
				if (!evalu) return 'transparent';
				const score = getDisplayCalificacion(evalu);
				const nivelObj = getNivel(score);
				return nivelObj?.color || '#2563eb';
			});

			datasets.push({
				label: `Evaluación N° ${i + 1}`,
				data,
				rawScores,
				phaseNames,
				backgroundColor,
				borderColor,
				borderWidth: 1,
				borderRadius: 2,
			});
		}

		return {
			labels: rankingEspecialistas.map((r, idx) => `#${idx + 1}. ${r.fullName}`),
			datasets,
		};
	};

	const getVerticalRankingData = () => {
		if (rankingEspecialistas.length === 0) return { labels: [], datasets: [] };

		const maxEvalsCount = Math.max(...rankingEspecialistas.map(r => r.evaluationsSorted.length), 1);

		const datasets = [];
		for (let i = 0; i < maxEvalsCount; i++) {
			const data = rankingEspecialistas.map(r => {
				const evalu = r.evaluationsSorted[i];
				if (!evalu) return 0;
				const sumScores = r.evaluationsSorted.reduce((acc, ev) => acc + getDisplayCalificacion(ev), 0);
				const evalScore = getDisplayCalificacion(evalu);
				if (sumScores === 0) return 0;
				return Number(((evalScore / sumScores) * r.score).toFixed(3));
			});

			const rawScores = rankingEspecialistas.map(r => {
				const evalu = r.evaluationsSorted[i];
				return evalu ? getDisplayCalificacion(evalu) : 0;
			});

			const phaseNames = rankingEspecialistas.map(r => {
				const evalu = r.evaluationsSorted[i];
				if (!evalu) return '';
				return getCleanPhaseName((evalu as any).faseNombre, (evalu as any).idFase || (evalu as any).faseActualID);
			});

			const backgroundColor = rankingEspecialistas.map(r => {
				const evalu = r.evaluationsSorted[i];
				if (!evalu) return 'transparent';
				const score = getDisplayCalificacion(evalu);
				const nivelObj = getNivel(score);
				return nivelObj?.color || '#3b82f6';
			});

			const borderColor = rankingEspecialistas.map(r => {
				const evalu = r.evaluationsSorted[i];
				if (!evalu) return 'transparent';
				const score = getDisplayCalificacion(evalu);
				const nivelObj = getNivel(score);
				return nivelObj?.color || '#2563eb';
			});

			datasets.push({
				label: `Evaluación N° ${i + 1}`,
				data,
				rawScores,
				phaseNames,
				backgroundColor,
				borderColor,
				borderWidth: 1,
				borderRadius: 2,
			});
		}

		return {
			labels: rankingEspecialistas.map(r => r.fullName),
			datasets,
		};
	};

	const getUgelRankingData = () => {
		if (rankingByUgel.length === 0) return { labels: [], datasets: [] };

		const labels = rankingByUgel.map(item => item.ugel);
		const data = rankingByUgel.map(item => item.promedio);
		const backgroundColor = rankingByUgel.map(item => {
			const nivelObj = getNivel(item.promedio);
			return nivelObj?.color || '#3b82f6';
		});

		return {
			labels,
			datasets: [
				{
					label: 'Promedio UGEL',
					data,
					backgroundColor,
					borderRadius: 4,
				}
			]
		};
	};

	const getUgelPieData = () => {
		if (rankingByUgel.length === 0) return { labels: [], datasets: [] };

		const labels = rankingByUgel.map(item => item.ugel);
		const data = rankingByUgel.map(item => item.cantidad);
		const palette = [
			'#2563eb', '#10b981', '#f59e0b', '#8b5cf6', '#ec4899', '#06b6d4', '#f97316', '#64748b', '#3b82f6', '#10b981'
		];

		return {
			labels,
			datasets: [
				{
					label: 'Cantidad de Especialistas',
					data,
					backgroundColor: labels.map((_, idx) => palette[idx % palette.length]),
					borderWidth: 2,
					borderColor: '#ffffff',
				}
			]
		};
	};

	const getNivelesPieData = () => {
		if (rankingEspecialistas.length === 0) return { labels: [], datasets: [] };

		const countsMap: { [key: string]: { count: number; color: string } } = {};

		rankingEspecialistas.forEach(r => {
			const nivelNombre = r.nivel?.nivel || 'Sin Nivel';
			const color = r.nivel?.color || '#94a3b8';

			if (!countsMap[nivelNombre]) {
				countsMap[nivelNombre] = { count: 0, color };
			}
			countsMap[nivelNombre].count += 1;
		});

		const labels = Object.keys(countsMap);
		const data = labels.map(lbl => countsMap[lbl].count);
		const backgroundColor = labels.map(lbl => countsMap[lbl].color);

		return {
			labels,
			datasets: [
				{
					label: 'Especialistas por Nivel',
					data,
					backgroundColor,
					borderWidth: 2,
					borderColor: '#ffffff',
				}
			]
		};
	};

	return {
		rankingTab,
		setRankingTab,
		selectedRankingFase,
		setSelectedRankingFase,
		selectedUgelForDetail,
		setSelectedUgelForDetail,
		rankingEspecialistas,
		rankingByUgel,
		selectedUgelSummary,
		ugelEspecialistasList,
		maxRankingScaleValue,
		getHorizontalRankingData,
		getVerticalRankingData,
		getUgelRankingData,
		getUgelPieData,
		getNivelesPieData,
		executiveMetrics,
	};
};
