import { useState, useMemo } from 'react';
import { User } from '@/features/types/types';
import { getMonitoreoTimestamp, getCleanPhaseName, getShortDateString, stackedColors } from '../components/utils';

const formatQuestionLabel = (orden: number | string, text: string, maxLen = 45): string | string[] => {
	const cleanText = text ? text.trim() : '';
	const fullText = orden ? `${orden}. ${cleanText}` : cleanText;
	if (fullText.length <= maxLen) return fullText;

	const words = fullText.split(' ');
	const lines: string[] = [];
	let currentLine = '';

	words.forEach(word => {
		if ((currentLine + (currentLine ? ' ' : '') + word).length > maxLen) {
			if (currentLine) lines.push(currentLine);
			currentLine = word;
		} else {
			currentLine += (currentLine ? ' ' : '') + word;
		}
	});
	if (currentLine) lines.push(currentLine);

	return lines.length > 1 ? lines : fullText;
};

export const useHistorialEvolucion = (
	id: string | string[] | undefined,
	getHistorialEspecialista: (evalId: string, dni: string) => Promise<User[]>,
	dataEvaluacionDocente: any,
	dimensionesEspecialistas: any[],
	getPreguntaRespuestaDocentes: any[],
	getDisplayCalificacion: (evalu: any) => number,
	getNivel: (calificacion: number) => any
) => {
	const [showModalEvolucion, setShowModalEvolucion] = useState(false);
	const [selectedEspecialista, setSelectedEspecialista] = useState<User | null>(null);
	const [historialSelected, setHistorialSelected] = useState<User[]>([]);
	const [loadingHistorial, setLoadingHistorial] = useState(false);
	const [activeTab, setActiveTab] = useState<'evolucion' | 'radar' | 'analisis' | 'distribucion' | 'configuracion'>('evolucion');
	const [selectedModalEvalId, setSelectedModalEvalId] = useState<string>('all');

	const handleOpenEvolucion = async (especialista: User, evaluacionEspecifica?: User) => {
		setSelectedEspecialista(especialista);
		setShowModalEvolucion(true);
		setLoadingHistorial(true);
		setActiveTab('evolucion');

		try {
			const historial = await getHistorialEspecialista(`${id}`, especialista.dni!);

			let listFiltered = [...historial];
			if (evaluacionEspecifica) {
				const targetTimestamp = getMonitoreoTimestamp(evaluacionEspecifica);
				listFiltered = historial.filter(e => getMonitoreoTimestamp(e) <= targetTimestamp);
			}

			const listSorted = listFiltered.sort((a, b) => getMonitoreoTimestamp(a) - getMonitoreoTimestamp(b));
			setHistorialSelected(listSorted);
			setSelectedModalEvalId('all');
		} catch (error) {
			console.error("Error al cargar historial:", error);
			setHistorialSelected([]);
		} finally {
			setLoadingHistorial(false);
		}
	};

	const chartData = useMemo(() => {
		if (!historialSelected || historialSelected.length === 0) {
			return { labels: [], datasets: [] };
		}

		const labels = historialSelected.map((item) => {
			const faseName = getCleanPhaseName((item as any).faseNombre, (item as any).idFase || (item as any).faseActualID);
			const dateStr = getShortDateString(item.fechaMonitoreo || item.fechaCreacion);
			return dateStr ? `${faseName} (${dateStr})` : faseName;
		});

		const dataPoints = historialSelected.map((item) => getDisplayCalificacion(item));

		return {
			labels,
			datasets: [
				{
					label: 'Calificación de Evaluación',
					data: dataPoints,
					borderColor: '#2563eb',
					backgroundColor: 'rgba(37, 99, 235, 0.1)',
					borderWidth: 3,
					pointBackgroundColor: '#2563eb',
					pointBorderColor: '#ffffff',
					pointBorderWidth: 2,
					pointRadius: 6,
					pointHoverRadius: 8,
					fill: true,
					tension: 0.3,
				},
			],
		};
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [historialSelected, dataEvaluacionDocente]);

	const maxScaleValue = useMemo(() => {
		if (dataEvaluacionDocente?.niveles && dataEvaluacionDocente.niveles.length > 0) {
			const maxVal = Math.max(...dataEvaluacionDocente.niveles.map((n: any) => n.max || 0));
			if (maxVal > 0) return maxVal;
		}
		if (dataEvaluacionDocente?.escala && dataEvaluacionDocente.escala.length > 0) {
			const maxVal = Math.max(...dataEvaluacionDocente.escala.map((s: any) => s.value || 0));
			if (maxVal > 0) return maxVal;
		}
		return 20;
	}, [dataEvaluacionDocente]);

	const chartOptions = {
		responsive: true,
		maintainAspectRatio: false,
		scales: {
			y: {
				beginAtZero: true,
				max: maxScaleValue,
				title: {
					display: true,
					text: 'Puntaje de Evaluación',
					font: { size: 12, weight: 'bold' as const }
				},
				grid: { color: '#f1f5f9' },
			},
			x: {
				grid: { display: false },
			},
		},
		plugins: {
			legend: { display: false },
			tooltip: {
				backgroundColor: 'rgba(15, 23, 42, 0.9)',
				padding: 12,
				cornerRadius: 8,
				callbacks: {
					label: (context: any) => ` Calificación: ${context.parsed.y} pts`,
				},
			},
		},
	};

	const getRadarData = () => {
		if (dimensionesEspecialistas.length === 0 || historialSelected.length === 0) return { labels: [], datasets: [] };

		const labels = dimensionesEspecialistas.map(d => d.nombre);
		const evalDataList = selectedModalEvalId === 'all'
			? historialSelected
			: historialSelected.filter(e => e.id === selectedModalEvalId || (selectedModalEvalId === 'latest' && e.id === historialSelected[historialSelected.length - 1]?.id));

		const activeScale = dataEvaluacionDocente?.escala || [];

		const datasets = evalDataList.map((evalu, index) => {
			const answers = evalu.resultadosSeguimientoRetroalimentacion || [];

			const data = dimensionesEspecialistas.map((dim: any) => {
				const preguntasDeDim = (getPreguntaRespuestaDocentes || []).filter(
					(pq: any) => String(pq.dimensionId || '') === String(dim.id || '') ||
					            (dim.items && Array.isArray(dim.items) && dim.items.includes(pq.id))
				);
				const dimItemIds = new Set(preguntasDeDim.map((pq: any) => String(pq.id || '')));

				let sumScores = 0;
				let count = 0;

				answers.forEach((ans: any) => {
					const ansId = String(ans.idPregunta || ans.id || '');
					const ansDimId = String(ans.dimensionId || '');
					const isMatch = (ansDimId && ansDimId === String(dim.id)) ||
					                (ansId && dimItemIds.has(ansId)) ||
					                (dim.items && Array.isArray(dim.items) && dim.items.includes(ansId));

					if (isMatch) {
						const selectedAlt = ans.alternativas?.find((alt: any) => alt.selected);
						if (selectedAlt) {
							const matchedScale = activeScale.find(
								(s: any) => String(s.alternativa || '') === String(selectedAlt.alternativa || '') ||
								            (s.descripcion && selectedAlt.descripcion && s.descripcion.trim().toLowerCase() === selectedAlt.descripcion.trim().toLowerCase())
							);
							const val = matchedScale?.value !== undefined ? Number(matchedScale.value) : Number(selectedAlt.value || 0);
							sumScores += val;
							count++;
						}
					}
				});

				if (count === 0 && preguntasDeDim.length > 0) {
					preguntasDeDim.forEach((pq: any) => {
						const ans = answers.find((a: any) =>
							String(a.order || a.orden || '') === String(pq.order || pq.orden || '') ||
							String(a.criterio || a.preguntaDocente || '').trim() === String(pq.criterio || pq.preguntaDocente || '').trim()
						);
						if (ans) {
							const selectedAlt = ans.alternativas?.find((alt: any) => alt.selected);
							if (selectedAlt) {
								const matchedScale = activeScale.find(
									(s: any) => String(s.alternativa || '') === String(selectedAlt.alternativa || '') ||
									            (s.descripcion && selectedAlt.descripcion && s.descripcion.trim().toLowerCase() === selectedAlt.descripcion.trim().toLowerCase())
								);
								const val = matchedScale?.value !== undefined ? Number(matchedScale.value) : Number(selectedAlt.value || 0);
								sumScores += val;
								count++;
							}
						}
					});
				}

				return count > 0 ? Number((sumScores / count).toFixed(2)) : 0;
			});

			const customDetails = dimensionesEspecialistas.map((dim: any) => {
				const preguntasDeDim = (getPreguntaRespuestaDocentes || []).filter(
					(pq: any) => String(pq.dimensionId || '') === String(dim.id || '') ||
					            (dim.items && Array.isArray(dim.items) && dim.items.includes(pq.id))
				);
				const dimItemIds = new Set(preguntasDeDim.map((pq: any) => String(pq.id || '')));

				const details: { orden: number; nombre: string; puntaje: number }[] = [];

				answers.forEach((ans: any, aIndex: number) => {
					const ansId = String(ans.idPregunta || ans.id || '');
					const ansDimId = String(ans.dimensionId || '');
					const isMatch = (ansDimId && ansDimId === String(dim.id)) ||
					                (ansId && dimItemIds.has(ansId)) ||
					                (dim.items && Array.isArray(dim.items) && dim.items.includes(ansId));

					if (isMatch) {
						const selectedAlt = ans.alternativas?.find((alt: any) => alt.selected);
						if (selectedAlt) {
							const matchedScale = activeScale.find(
								(s: any) => String(s.alternativa || '') === String(selectedAlt.alternativa || '') ||
								            (s.descripcion && selectedAlt.descripcion && s.descripcion.trim().toLowerCase() === selectedAlt.descripcion.trim().toLowerCase())
							);
							const val = matchedScale?.value !== undefined ? Number(matchedScale.value) : Number(selectedAlt.value || 0);
							details.push({
								orden: (ans as any).orden || (ans as any).order || aIndex + 1,
								nombre: (ans as any).preguntaDocente || (ans as any).criterio || (ans as any).pregunta || (ans as any).texto || `Criterio ${aIndex + 1}`,
								puntaje: val
							});
						}
					}
				});

				if (details.length === 0 && preguntasDeDim.length > 0) {
					preguntasDeDim.forEach((pq: any, pIndex: number) => {
						const ans = answers.find((a: any) =>
							String(a.order || a.orden || '') === String(pq.order || pq.orden || '') ||
							String(a.criterio || a.preguntaDocente || '').trim() === String(pq.criterio || pq.preguntaDocente || '').trim()
						);
						if (ans) {
							const selectedAlt = ans.alternativas?.find((alt: any) => alt.selected);
							if (selectedAlt) {
								const matchedScale = activeScale.find(
									(s: any) => String(s.alternativa || '') === String(selectedAlt.alternativa || '') ||
									            (s.descripcion && selectedAlt.descripcion && s.descripcion.trim().toLowerCase() === selectedAlt.descripcion.trim().toLowerCase())
								);
								const val = matchedScale?.value !== undefined ? Number(matchedScale.value) : Number(selectedAlt.value || 0);
								details.push({
									orden: (pq as any).orden || (pq as any).order || pIndex + 1,
									nombre: (pq as any).criterio || (pq as any).preguntaDocente || `Criterio ${pIndex + 1}`,
									puntaje: val
								});
							}
						}
					});
				}

				return details;
			});

			const faseName = getCleanPhaseName((evalu as any).faseNombre, (evalu as any).idFase || (evalu as any).faseActualID);
			const phaseKey = (evalu as any).idFase || (evalu as any).faseActualID || faseName || `${index}`;
			const colorScheme = stackedColors[index % stackedColors.length];

			const customPhaseColor = dataEvaluacionDocente?.configuracionColores?.coloresPorFase?.[phaseKey] ||
			                         dataEvaluacionDocente?.configuracionColores?.coloresPorFase?.[faseName] ||
			                         dataEvaluacionDocente?.configuracionColores?.coloresPorFase?.[`${index}`] ||
			                         dataEvaluacionDocente?.configuracionColores?.reticularByFase?.[phaseKey] ||
			                         dataEvaluacionDocente?.configuracionColores?.reticularByFase?.[faseName] ||
			                         dataEvaluacionDocente?.configuracionColores?.reticularByFase?.[`${index}`] ||
			                         dataEvaluacionDocente?.configuracionColores?.reticular?.color;

			const borderColor = customPhaseColor || colorScheme.border;
			const backgroundColor = customPhaseColor ? `${customPhaseColor}33` : `${colorScheme.bg}33`;

			const dateStr = getShortDateString(evalu.fechaMonitoreo || evalu.fechaCreacion);
			const labelText = dateStr ? `${faseName} (${dateStr})` : faseName;

			return {
				label: labelText,
				data,
				customDetails,
				backgroundColor,
				borderColor,
				pointBackgroundColor: borderColor,
				pointBorderColor: '#fff',
				pointHoverBackgroundColor: '#fff',
				pointHoverBorderColor: borderColor,
				borderWidth: 2,
			};
		});

		return { labels, datasets };
	};

	const latestEvaluation = useMemo(() => {
		if (!historialSelected || historialSelected.length === 0) return null;
		return historialSelected[historialSelected.length - 1];
	}, [historialSelected]);

	const getItemAnalysisData = () => {
		if (!getPreguntaRespuestaDocentes || getPreguntaRespuestaDocentes.length === 0 || historialSelected.length === 0) return null;

		const activeScale = dataEvaluacionDocente?.escala || [];
		const maxScore = activeScale.length > 0 ? Math.max(...activeScale.map((s: any) => s.value || 0)) : 4;

		const selectedEvals = selectedModalEvalId === 'all'
			? historialSelected
			: historialSelected.filter(e => e.id === selectedModalEvalId || (selectedModalEvalId === 'latest' && e.id === latestEvaluation?.id));

		if (selectedEvals.length === 0) return null;

		const activePreguntasMap = new Map<string, any>();
		selectedEvals.forEach(evalu => {
			const answers = evalu.resultadosSeguimientoRetroalimentacion || [];
			answers.forEach((ans: any) => {
				const idP = String(ans.idPregunta || ans.id);
				if (!activePreguntasMap.has(idP)) {
					const masterPreg = getPreguntaRespuestaDocentes.find((p: any) => String(p.id) === idP);
					activePreguntasMap.set(idP, {
						id: idP,
						orden: (ans as any).orden || (ans as any).order || (masterPreg as any)?.orden || (masterPreg as any)?.order || 999,
						pregunta: (masterPreg as any)?.criterio || (masterPreg as any)?.preguntaDocente || (ans as any)?.criterio || (ans as any)?.preguntaDocente || (masterPreg as any)?.pregunta || (masterPreg as any)?.texto || (ans as any)?.pregunta || (ans as any)?.texto || `Criterio ${idP}`
					});
				}
			});
		});

		const activePreguntas = Array.from(activePreguntasMap.values()).sort((a, b) => a.orden - b.orden);
		if (activePreguntas.length === 0) return null;

		if (selectedModalEvalId === 'all' && historialSelected.length > 1) {
			const itemScoresMap = new Map<string, { preguntaObj: any; scores: number[] }>();

			activePreguntas.forEach(preg => {
				const scores: number[] = [];
				selectedEvals.forEach(evalu => {
					const ans = (evalu.resultadosSeguimientoRetroalimentacion || []).find((a: any) => String(a.idPregunta || a.id) === preg.id);
					let val = maxScore;
					if (ans) {
						const selectedAlt = ans.alternativas?.find((alt: any) => alt.selected);
						if (selectedAlt) {
							const matchedScale = activeScale.find(
								(s: any) => String(s.alternativa || '') === String(selectedAlt.alternativa || '') ||
								            (s.descripcion && selectedAlt.descripcion && s.descripcion.trim().toLowerCase() === selectedAlt.descripcion.trim().toLowerCase())
							);
							val = matchedScale?.value !== undefined ? matchedScale.value : (selectedAlt.value || 0);
						}
					}
					scores.push(val);
				});
				itemScoresMap.set(preg.id, { preguntaObj: preg, scores });
			});

			const arrayItems = Array.from(itemScoresMap.values()).map(item => {
				const avg = item.scores.reduce((a, b) => a + b, 0) / item.scores.length;
				return { ...item, avg };
			});

			const criticalItems = arrayItems.filter(item => item.avg < maxScore);
			if (criticalItems.length === 0) return null;

			criticalItems.sort((a, b) => a.avg - b.avg);
			const topCritical = criticalItems.slice(0, 5);
			topCritical.sort((a, b) => Number(a.preguntaObj.orden || 0) - Number(b.preguntaObj.orden || 0));

			const labels = topCritical.map(item => formatQuestionLabel(item.preguntaObj.orden, item.preguntaObj.pregunta));

			const customBrechas = dataEvaluacionDocente?.configuracionColores?.brechas;
			const customBarColor = customBrechas?.barColor;
			const customZeroColor = customBrechas?.zeroColor || '#ef4444';
			const customWarningColor = customBrechas?.warningColor || '#f59e0b';

			const datasets = selectedEvals.map((evalu, index) => {
				const colorScheme = stackedColors[index % stackedColors.length];
				const faseName = getCleanPhaseName((evalu as any).faseNombre, (evalu as any).idFase || (evalu as any).faseActualID);
				const phaseKey = (evalu as any).idFase || (evalu as any).faseActualID || faseName || `${index}`;
				const dateStr = getShortDateString(evalu.fechaMonitoreo || evalu.fechaCreacion);
				const labelText = dateStr ? `${faseName} (${dateStr})` : faseName;
				const data = topCritical.map(item => item.scores[index]);

				const customPhaseColor = dataEvaluacionDocente?.configuracionColores?.coloresPorFase?.[phaseKey] ||
				                         dataEvaluacionDocente?.configuracionColores?.coloresPorFase?.[faseName] ||
				                         dataEvaluacionDocente?.configuracionColores?.coloresPorFase?.[`${index}`] ||
				                         dataEvaluacionDocente?.configuracionColores?.brechasByFase?.[phaseKey] ||
				                         dataEvaluacionDocente?.configuracionColores?.brechasByFase?.[faseName] ||
				                         dataEvaluacionDocente?.configuracionColores?.brechasByFase?.[`${index}`] ||
				                         dataEvaluacionDocente?.configuracionColores?.brechas?.barColor;

				const barColor = customPhaseColor || colorScheme.bg;

				return {
					label: labelText,
					data,
					backgroundColor: barColor,
					borderColor: barColor,
					borderWidth: 1,
					borderRadius: 4,
				};
			});

			return { labels, datasets };

		} else {
			const targetEval = selectedEvals[0];
			const answers = targetEval.resultadosSeguimientoRetroalimentacion || [];

			const itemScores = activePreguntas.map((preg) => {
				const ans = answers.find((a: any) => String(a.idPregunta || a.id) === preg.id);
				let score = maxScore;
				if (ans) {
					const selectedAlt = ans.alternativas?.find((alt: any) => alt.selected);
					if (selectedAlt) {
						const matchedScale = activeScale.find(
							(s: any) => String(s.alternativa || '') === String(selectedAlt.alternativa || '') ||
							            (s.descripcion && selectedAlt.descripcion && s.descripcion.trim().toLowerCase() === selectedAlt.descripcion.trim().toLowerCase())
						);
						score = matchedScale?.value !== undefined ? matchedScale.value : (selectedAlt.value || 0);
					}
				}
				return {
					orden: preg.orden,
					preguntaText: preg.pregunta,
					score
				};
			});

			const criticalItems = itemScores.filter(item => item.score < maxScore);
			if (criticalItems.length === 0) return null;

			criticalItems.sort((a, b) => a.score - b.score);
			const topCritical = criticalItems.slice(0, 5);
			topCritical.sort((a, b) => Number(a.orden || 0) - Number(b.orden || 0));

			const labels = topCritical.map(item => formatQuestionLabel(item.orden, item.preguntaText));
			const dataPoints = topCritical.map(item => item.score);

			const targetFaseName = getCleanPhaseName((targetEval as any).faseNombre, (targetEval as any).idFase || (targetEval as any).faseActualID);
			const targetPhaseKey = (targetEval as any).idFase || (targetEval as any).faseActualID || targetFaseName || '0';

			const customBrechas = dataEvaluacionDocente?.configuracionColores?.brechas;
			const customPhaseColor = dataEvaluacionDocente?.configuracionColores?.coloresPorFase?.[targetPhaseKey] ||
			                         dataEvaluacionDocente?.configuracionColores?.coloresPorFase?.[targetFaseName] ||
			                         dataEvaluacionDocente?.configuracionColores?.coloresPorFase?.['0'] ||
			                         dataEvaluacionDocente?.configuracionColores?.brechasByFase?.[targetPhaseKey] ||
			                         dataEvaluacionDocente?.configuracionColores?.brechasByFase?.[targetFaseName] ||
			                         dataEvaluacionDocente?.configuracionColores?.brechasByFase?.['0'] ||
			                         customBrechas?.barColor;

			const customZeroColor = customBrechas?.zeroColor || '#ef4444';
			const customWarningColor = customBrechas?.warningColor || '#f59e0b';
			const backgroundColors = topCritical.map(item => item.score === 0 ? customZeroColor : (customPhaseColor || customWarningColor));

			const faseName = getCleanPhaseName((targetEval as any).faseNombre, (targetEval as any).idFase || (targetEval as any).faseActualID);
			const dateStr = getShortDateString(targetEval.fechaMonitoreo || targetEval.fechaCreacion);
			const labelText = dateStr ? `${faseName} (${dateStr})` : faseName;

			return {
				labels,
				datasets: [
					{
						label: `Puntaje (${labelText})`,
						data: dataPoints,
						backgroundColor: backgroundColors,
						borderRadius: 4,
					}
				]
			};
		}
	};

	const getDistribucionGlobalData = () => {
		if (historialSelected.length === 0 || !dataEvaluacionDocente?.niveles) return { pieData: null, stats: [], totalPreguntas: 0 };

		const selectedEvals = selectedModalEvalId === 'all'
			? historialSelected
			: historialSelected.filter(e => e.id === selectedModalEvalId || (selectedModalEvalId === 'latest' && e.id === latestEvaluation?.id));

		if (selectedEvals.length === 0) return { pieData: null, stats: [], totalPreguntas: 0 };

		const niveles = dataEvaluacionDocente.niveles;
		const countsByNivel: { [key: string]: number } = {};
		niveles.forEach((n: any) => { countsByNivel[n.nivel] = 0; });

		let totalRespuestasEvaluadas = 0;
		const activeScale = dataEvaluacionDocente?.escala || [];

		selectedEvals.forEach(evalu => {
			const answers = evalu.resultadosSeguimientoRetroalimentacion || [];
			answers.forEach((ans: any) => {
				const selectedAlt = ans.alternativas?.find((alt: any) => alt.selected);
				if (selectedAlt) {
					const altIndex = ans.alternativas?.findIndex((alt: any) => alt.selected);
					const matchedScale = activeScale.find(
						(s: any) => String(s.alternativa || '') === String(selectedAlt.alternativa || '') ||
						            (s.descripcion && selectedAlt.descripcion && s.descripcion.trim().toLowerCase() === selectedAlt.descripcion.trim().toLowerCase())
					);

					// Strategy A: Match by level description
					let matchedNivel = niveles.find((n: any) =>
						(matchedScale?.descripcion && String(n.nivel).trim().toLowerCase() === String(matchedScale.descripcion).trim().toLowerCase()) ||
						(selectedAlt?.descripcion && String(n.nivel).trim().toLowerCase() === String(selectedAlt.descripcion).trim().toLowerCase())
					);

					// Strategy B: Match by scale value / index position (1: En inicio, 2: En desarrollo, 3: Logro esperado, 4: Logro destacado)
					if (!matchedNivel) {
						const val = matchedScale?.value !== undefined ? Number(matchedScale.value) : Number(selectedAlt.value || (altIndex >= 0 ? altIndex + 1 : 1));
						const targetIndex = Math.min(Math.max(val - 1, 0), niveles.length - 1);
						matchedNivel = niveles[targetIndex];
					}

					if (matchedNivel?.nivel && countsByNivel[matchedNivel.nivel] !== undefined) {
						countsByNivel[matchedNivel.nivel]++;
						totalRespuestasEvaluadas++;
					}
				}
			});
		});

		if (totalRespuestasEvaluadas === 0) return { pieData: null, stats: [], totalPreguntas: 0 };

		const customDist = dataEvaluacionDocente?.configuracionColores?.distribucion || {};
		const defaultColors = ['#ef4444', '#f59e0b', '#3b82f6', '#10b981'];

		const pieLabels = niveles.map((n: any) => n.nivel);
		const pieDataValues = niveles.map((n: any) => countsByNivel[n.nivel] || 0);
		const pieColors = niveles.map((n: any, idx: number) => customDist[n.nivel] || n.color || defaultColors[idx % defaultColors.length]);

		const pieData = {
			labels: pieLabels,
			datasets: [
				{
					data: pieDataValues,
					backgroundColor: pieColors,
					borderWidth: 2,
					borderColor: '#ffffff',
				}
			]
		};

		const stats = niveles.map((n: any, idx: number) => ({
			label: n.nivel,
			count: countsByNivel[n.nivel] || 0,
			color: customDist[n.nivel] || n.color || defaultColors[idx % defaultColors.length]
		}));

		return { pieData, stats, totalPreguntas: totalRespuestasEvaluadas };
	};

	return {
		showModalEvolucion,
		setShowModalEvolucion,
		selectedEspecialista,
		historialSelected,
		setHistorialSelected,
		loadingHistorial,
		activeTab,
		setActiveTab,
		selectedModalEvalId,
		setSelectedModalEvalId,
		handleOpenEvolucion,
		chartData,
		chartOptions,
		getRadarData,
		latestEvaluation,
		getItemAnalysisData,
		getDistribucionGlobalData,
	};
};
