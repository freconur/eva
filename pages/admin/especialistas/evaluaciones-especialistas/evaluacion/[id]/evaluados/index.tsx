import React, { useEffect, useState, useMemo, useRef } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';
import { MdArrowBack, MdSearch, MdPeople, MdExpandMore, MdExpandLess, MdTrendingUp, MdTrendingDown, MdTrendingFlat, MdHistory, MdDelete, MdWarning, MdSort, MdArrowUpward, MdArrowDownward } from 'react-icons/md';
import { RiLoader4Line } from 'react-icons/ri';
import { useGlobalContext } from '@/features/context/GlolbalContext';
import UseEvaluacionEspecialistas from '@/features/hooks/UseEvaluacionEspecialistas';
import { User } from '@/features/types/types';
import { regionTexto } from '@/fuctions/regiones';
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
import { Line, Radar, Bar, Pie } from 'react-chartjs-2';
import styles from './styles.module.css';

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
	const { evaluadosEspecialista, loaderPages, dataEvaluacionDocente, getPreguntaRespuestaDocentes, dimensionesEspecialistas } = useGlobalContext();
	const { getEspecialistasEvaluados, getDataEvaluacion, getHistorialEspecialista, getPreguntasRespuestasEspecialistas, getDimensionesEspecialistas, deleteEvaluadoSession } = UseEvaluacionEspecialistas();
	const [searchQuery, setSearchQuery] = useState<string>('');
	const [selectedFase, setSelectedFase] = useState<string>('');
	const [sortOrder, setSortOrder] = useState<'default' | 'score-desc' | 'score-asc'>('default');
	const [showSortDropdown, setShowSortDropdown] = useState(false);
	const sortDropdownRef = useRef<HTMLDivElement>(null);
	const [showModalEvolucion, setShowModalEvolucion] = useState(false);
	const [selectedEspecialista, setSelectedEspecialista] = useState<User | null>(null);
	const [historialSelected, setHistorialSelected] = useState<User[]>([]);
	const [loadingHistorial, setLoadingHistorial] = useState(false);
	const [expandedRows, setExpandedRows] = useState<Set<string>>(new Set());
	const [activeTab, setActiveTab] = useState<'evolucion' | 'radar' | 'analisis' | 'distribucion'>('evolucion');
	const [selectedModalEvalId, setSelectedModalEvalId] = useState<string>('all');
	const [showConfirmDelete, setShowConfirmDelete] = useState(false);
	const [evaluacionToDelete, setEvaluacionToDelete] = useState<{ id: string; name: string } | null>(null);
	const [isDeleting, setIsDeleting] = useState(false);

	useEffect(() => {
		const handleClickOutside = (event: MouseEvent) => {
			if (sortDropdownRef.current && !sortDropdownRef.current.contains(event.target as Node)) {
				setShowSortDropdown(false);
			}
		};
		document.addEventListener('mousedown', handleClickOutside);
		return () => document.removeEventListener('mousedown', handleClickOutside);
	}, []);

	useEffect(() => {
		if (id) {
			getEspecialistasEvaluados(`${id}`);
			getDataEvaluacion(`${id}`);
			getPreguntasRespuestasEspecialistas(`${id}`);
			getDimensionesEspecialistas(`${id}`);
		}
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [id]);

	const getTimestamp = (val: any): number => {
		if (!val) return 0;
		// Si es un Timestamp de Firestore
		if (typeof val === 'object' && val.seconds !== undefined) {
			return val.seconds * 1000 + (val.nanoseconds || 0) / 1000000;
		}
		// Si es una cadena o número
		const d = new Date(val);
		return isNaN(d.getTime()) ? 0 : d.getTime();
	};

	const formatTime = (val: any): string => {
		if (!val) return '';
		const date = new Date(getTimestamp(val));
		if (isNaN(date.getTime())) return '';
		return date.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' });
	};

	const getNivel = (calificacion: number) => {
		if (!dataEvaluacionDocente?.niveles || dataEvaluacionDocente.niveles.length === 0) return null;
		return dataEvaluacionDocente.niveles.find(n => calificacion >= (n.min || 0) && calificacion <= (n.max || 0));
	};

	// Función para limpiar nombres de fases que vienen como ID (ej. MARZO_1_1772413976244 -> MARZO 1)
	const getCleanPhaseName = (faseNombre?: string, idFase?: string) => {
		if (faseNombre) return faseNombre;
		if (!idFase) return '—';

		const parts = idFase.split('_');
		// Si tiene el formato NOMBRE_NOMBRE_TIMESTAMP, quitamos el último segmento si es numérico
		if (parts.length > 1 && !isNaN(Number(parts[parts.length - 1]))) {
			return parts.slice(0, -1).join(' ').replace(/_/g, ' ');
		}
		return idFase.replace(/_/g, ' ');
	};

	const fasesUnicas = useMemo(() => {
		if (!evaluadosEspecialista) return [];
		const fases: { id: string; nombre: string }[] = [];
		evaluadosEspecialista.forEach((esp: any) => {
			const rawId = esp.idFase || esp.faseActualID; // Compatibilidad por si acaso
			if (!rawId) return;

			const nombre = getCleanPhaseName(esp.faseNombre, rawId);
			if (!fases.find(f => f.id === rawId)) {
				fases.push({ id: rawId, nombre });
			}
		});
		return fases;
	}, [evaluadosEspecialista]);

	const groupedEvaluados = useMemo(() => {
		if (!evaluadosEspecialista) return [];

		const groups: { [dni: string]: { info: User; evaluations: User[] } } = {};

		const evaluadosActivos = selectedFase
			? evaluadosEspecialista.filter((esp: any) => (esp.idFase === selectedFase || esp.faseActualID === selectedFase))
			: evaluadosEspecialista;

		evaluadosActivos.forEach((esp) => {
			const dni = esp.dni || 'sin-dni';
			if (!groups[dni]) {
				groups[dni] = {
					info: esp,
					evaluations: []
				};
			}
			groups[dni].evaluations.push(esp);
		});

		// Ordenar evaluaciones por fecha y hora descendente (la más reciente primero)
		Object.values(groups).forEach(group => {
			group.evaluations.sort((a, b) => {
				const timeA = getTimestamp(a.fechaCreacion);
				const timeB = getTimestamp(b.fechaCreacion);
				return timeB - timeA;
			});
		});

		const result = Object.values(groups);

		const filteredResult = searchQuery
			? result.filter(group => {
				const q = searchQuery.toLowerCase();
				return (
					group.info.nombres?.toLowerCase().includes(q) ||
					group.info.apellidos?.toLowerCase().includes(q) ||
					group.info.dni?.toLowerCase().includes(q) ||
					group.info.ugel?.toLowerCase().includes(q)
				);
			})
			: result;

		if (sortOrder === 'score-desc') {
			return [...filteredResult].sort((a, b) => {
				const scoreA = a.evaluations[0]?.calificacion ?? -1;
				const scoreB = b.evaluations[0]?.calificacion ?? -1;
				return scoreB - scoreA;
			});
		}

		if (sortOrder === 'score-asc') {
			return [...filteredResult].sort((a, b) => {
				const scoreA = a.evaluations[0]?.calificacion ?? Infinity;
				const scoreB = b.evaluations[0]?.calificacion ?? Infinity;
				return scoreA - scoreB;
			});
		}

		return filteredResult;
	}, [evaluadosEspecialista, searchQuery, selectedFase, sortOrder]);

	const toggleRow = (dni: string) => {
		const newExpanded = new Set(expandedRows);
		if (newExpanded.has(dni)) {
			newExpanded.delete(dni);
		} else {
			newExpanded.add(dni);
		}
		setExpandedRows(newExpanded);
	};

	const getTrend = (evaluations: User[]) => {
		if (evaluations.length < 2) return null;
		const current = evaluations[0].calificacion || 0;
		const previous = evaluations[1].calificacion || 0;
		if (current > previous) return { icon: <MdTrendingUp className={styles.trendUp} />, label: 'Mejorando' };
		if (current < previous) return { icon: <MdTrendingDown className={styles.trendDown} />, label: 'En descenso' };
		return { icon: <MdTrendingFlat className={styles.trendNeutral} />, label: 'Estable' };
	};

	const getMonitoreoTimestamp = (evalu: User): number => {
		const fecha = evalu.fechaMonitoreo || evalu.fechaCreacion;
		if (!fecha) return 0;
		if (typeof fecha === 'string' && fecha.length >= 10) {
			const timeStr = evalu.horaInicio ? `T${evalu.horaInicio}:00` : 'T00:00:00';
			const dateObj = new Date(`${fecha.substring(0, 10)}${timeStr}`);
			if (!isNaN(dateObj.getTime())) return dateObj.getTime();
		}
		return getTimestamp(fecha);
	};

	const handleOpenEvolucion = async (esp: User, cutoffEval?: User) => {
		setSelectedEspecialista(esp);
		setLoadingHistorial(true);
		setShowModalEvolucion(true);
		setSelectedModalEvalId('all');
		if (id && esp.dni) {
			const history = await getHistorialEspecialista(`${id}`, esp.dni);
			// Ordenar por fecha de monitoreo cronológica ascendente
			const sortedHistory = [...history].sort((a, b) => {
				const timeA = getMonitoreoTimestamp(a);
				const timeB = getMonitoreoTimestamp(b);
				return timeA - timeB;
			});

			let filteredHistory = sortedHistory;
			if (cutoffEval) {
				const cutoffIndex = sortedHistory.findIndex(h => h.id === cutoffEval.id);
				if (cutoffIndex !== -1) {
					filteredHistory = sortedHistory.slice(0, cutoffIndex + 1);
				} else {
					const cutoffTime = getMonitoreoTimestamp(cutoffEval);
					filteredHistory = sortedHistory.filter(h => getMonitoreoTimestamp(h) <= cutoffTime);
				}
			}

			setHistorialSelected(filteredHistory);
		}
		setLoadingHistorial(false);
		setActiveTab('evolucion'); // Reset tab when opening
	};

	const getLocalDateString = (dateString: any) => {
		if (!dateString) return '—';
		// Si ya viene con formato YYYY-MM-DD, lo devolvemos tal cual para evitar que JS sume horas por locale timezone.
		if (typeof dateString === 'string' && dateString.length >= 10) {
			return dateString.substring(0, 10);
		}
		return String(dateString);
	};

	const handleDeleteClick = (e: React.MouseEvent, evalu: User) => {
		e.stopPropagation();
		setEvaluacionToDelete({
			id: evalu.id || '',
			name: `${evalu.nombres || ''} ${evalu.apellidos || ''}`.trim() || 'esta evaluación'
		});
		setShowConfirmDelete(true);
	};

	const handleConfirmDelete = async () => {
		if (!id || !evaluacionToDelete || isDeleting) return;

		try {
			setIsDeleting(true);
			await deleteEvaluadoSession(`${id}`, evaluacionToDelete.id);
			setShowConfirmDelete(false);
			setEvaluacionToDelete(null);
			// La lista se actualizará automáticamente ya que tenemos onSnapshot en el hook (o deberíamos)
			// En este caso getAllEvaluacionesEspecialistas usa onSnapshot
		} catch (error) {
			alert('Error al eliminar la evaluación');
		} finally {
			setIsDeleting(false);
		}
	};

	const chartData = {
		labels: historialSelected.map(h => getCleanPhaseName((h as any).faseNombre, (h as any).idFase || (h as any).faseActualID)),
		datasets: [
			{
				label: 'Calificación',
				data: historialSelected.map(h => h.calificacion || 0),
				borderColor: '#2563eb',
				backgroundColor: 'rgba(37, 99, 235, 0.5)',
				tension: 0.3,
				pointBackgroundColor: '#2563eb',
				pointBorderColor: '#fff',
				pointHoverBackgroundColor: '#fff',
				pointHoverBorderColor: '#2563eb',
				pointRadius: 5,
				pointHoverRadius: 7,
			}
		]
	};

	const chartOptions = {
		responsive: true,
		plugins: {
			legend: {
				position: 'top' as const,
			},
			title: {
				display: true,
				text: `Evolución de ${selectedEspecialista ? `${selectedEspecialista.nombres || ''} ${selectedEspecialista.apellidos || ''}`.trim() : ''}`,
				padding: {
					top: historialSelected.length === 1 ? 55 : 10,
					bottom: 10
				}
			},
			tooltip: {
				callbacks: {
					title: (context: any) => {
						const idx = context[0]?.dataIndex;
						const item = historialSelected[idx];
						if (item) {
							const phaseName = getCleanPhaseName((item as any).faseNombre, (item as any).idFase || (item as any).faseActualID);
							const dateStr = getLocalDateString(item.fechaMonitoreo || item.fechaCreacion);
							return `${phaseName} - ${dateStr}`;
						}
						return context[0]?.label;
					}
				}
			}
		},
		scales: {
			y: {
				beginAtZero: true,
				suggestedMax: (dataEvaluacionDocente?.escala || []).at(-1)?.value || 4, // Usamos suggestedMax para no forzar cortes
			},
			x: {
				offset: true, // Importante para que el punto único se centre y no quede cortado en los bordes
				grid: {
					offset: true,
				}
			}
		},
		layout: {
			padding: {
				left: 20,
				right: 20,
				top: historialSelected.length === 1 ? 30 : 20,
				bottom: 20
			}
		}
	};

	const latestEvaluation = historialSelected.length > 0 ? historialSelected[historialSelected.length - 1] : null;

	const getRadarData = () => {
		const labels = dimensionesEspecialistas.map((d: any) => d.nombre || '');
		const scale = dataEvaluacionDocente.escala || [];

		const colorPalette = [
			{ border: '#2563eb', bg: 'rgba(37, 99, 235, 0.15)' }, // Blue
			{ border: '#10b981', bg: 'rgba(16, 185, 129, 0.15)' }, // Emerald
			{ border: '#8b5cf6', bg: 'rgba(139, 92, 246, 0.15)' }, // Purple
			{ border: '#f59e0b', bg: 'rgba(245, 158, 11, 0.15)' }, // Amber
			{ border: '#ec4899', bg: 'rgba(236, 72, 153, 0.15)' }, // Pink
			{ border: '#06b6d4', bg: 'rgba(6, 182, 212, 0.15)' }, // Cyan
		];

		const datasets = historialSelected.map((evalItem, evalIndex) => {
			const phaseName = getCleanPhaseName((evalItem as any).faseNombre, (evalItem as any).idFase || (evalItem as any).faseActualID);
			const dateStr = getLocalDateString(evalItem.fechaMonitoreo || evalItem.fechaCreacion);
			const label = `${phaseName} (${dateStr})`;

			const evalDetails: any[] = [];
			const data = dimensionesEspecialistas.map((dim: any) => {
				const preguntasDim = getPreguntaRespuestaDocentes.filter(p => p.dimensionId === dim.id);
				if (preguntasDim.length === 0 || !evalItem?.resultadosSeguimientoRetroalimentacion) {
					evalDetails.push([]);
					return 0;
				}

				const idsPreguntas = preguntasDim.map(p => p.order);
				const respuestasUsuario = evalItem.resultadosSeguimientoRetroalimentacion.filter(
					(r: any) => idsPreguntas.includes(r.order)
				);

				if (respuestasUsuario.length === 0) {
					evalDetails.push([]);
					return 0;
				}

				const dimDetails: any[] = [];
				const totalPuntaje = respuestasUsuario.reduce((acc: number, resp: any) => {
					const selectedAlt = resp.alternativas?.find((a: any) => a.selected);
					const matchedScale = scale.find(s => s.alternativa === selectedAlt?.alternativa || s.descripcion === selectedAlt?.descripcion?.trim());
					const puntaje = matchedScale?.value || 0;

					const preguntaOrig = preguntasDim.find(p => p.order === resp.order);
					let textCrit = preguntaOrig?.criterio || `Pregunta ${resp.order}`;
					if (textCrit.length > 55) textCrit = textCrit.substring(0, 52) + '...';

					dimDetails.push({ orden: resp.order, nombre: textCrit, puntaje });
					return acc + puntaje;
				}, 0);

				dimDetails.sort((a, b) => a.orden - b.orden);
				evalDetails.push(dimDetails);

				return (totalPuntaje / respuestasUsuario.length).toFixed(2);
			});

			const palette = colorPalette[evalIndex % colorPalette.length];

			return {
				label,
				data,
				customDetails: evalDetails,
				backgroundColor: palette.bg,
				borderColor: palette.border,
				pointBackgroundColor: palette.border,
				pointBorderColor: '#fff',
				pointHoverBackgroundColor: '#fff',
				pointHoverBorderColor: palette.border,
			};
		});

		return {
			labels,
			datasets,
		};
	};

	const getItemAnalysisData = () => {
		const scale = dataEvaluacionDocente.escala || [];
		const maxScore = scale.length > 0 ? Math.max(...scale.map(s => s.value || 0)) : 4;

		// Si se seleccionó una evaluación individual específica en el dropdown (que no sea 'all' ni 'latest')
		if (selectedModalEvalId !== 'all' && selectedModalEvalId !== 'latest') {
			const target = historialSelected.find(h => h.id === selectedModalEvalId);
			if (!target?.resultadosSeguimientoRetroalimentacion) return null;

			const questionScores = target.resultadosSeguimientoRetroalimentacion.map((resp: any) => {
				const selectedAlt = resp.alternativas?.find((a: any) => a.selected);
				const matchedScale = scale.find(s => s.alternativa === selectedAlt?.alternativa || s.descripcion === selectedAlt?.descripcion?.trim());
				const score = matchedScale?.value || 0;
				const preguntaOrig = getPreguntaRespuestaDocentes.find(p => p.order === resp.order);

				return {
					id: resp.order,
					criterio: preguntaOrig?.criterio || `Pregunta ${resp.order}`,
					score
				};
			});

			const filteredScores = questionScores.filter(item => item.score < maxScore);
			if (filteredScores.length === 0) return null;

			const sortedItems = [...filteredScores].sort((a, b) => a.score - b.score).slice(0, 5);

			return {
				labels: sortedItems.map(item => item.criterio.length > 40 ? item.criterio.substring(0, 38) + '...' : item.criterio),
				datasets: [
					{
						label: 'Puntaje',
						data: sortedItems.map(item => item.score),
						backgroundColor: 'rgba(239, 68, 68, 0.75)',
						borderColor: '#ef4444',
						borderWidth: 1,
					},
				],
			};
		}

		if (historialSelected.length === 0) return null;

		// Si solo hay 1 evaluación en el historial o se seleccionó 'latest' explícitamente
		if (selectedModalEvalId === 'latest' || historialSelected.length === 1) {
			const target = latestEvaluation || historialSelected[historialSelected.length - 1];
			if (!target?.resultadosSeguimientoRetroalimentacion) return null;

			const questionScores = target.resultadosSeguimientoRetroalimentacion.map((resp: any) => {
				const selectedAlt = resp.alternativas?.find((a: any) => a.selected);
				const matchedScale = scale.find(s => s.alternativa === selectedAlt?.alternativa || s.descripcion === selectedAlt?.descripcion?.trim());
				const score = matchedScale?.value || 0;
				const preguntaOrig = getPreguntaRespuestaDocentes.find(p => p.order === resp.order);

				return {
					id: resp.order,
					criterio: preguntaOrig?.criterio || `Pregunta ${resp.order}`,
					score
				};
			});

			const filteredScores = questionScores.filter(item => item.score < maxScore);
			if (filteredScores.length === 0) return null;

			const sortedItems = [...filteredScores].sort((a, b) => a.score - b.score).slice(0, 5);

			return {
				labels: sortedItems.map(item => item.criterio.length > 40 ? item.criterio.substring(0, 38) + '...' : item.criterio),
				datasets: [
					{
						label: 'Puntaje',
						data: sortedItems.map(item => item.score),
						backgroundColor: 'rgba(239, 68, 68, 0.75)',
						borderColor: '#ef4444',
						borderWidth: 1,
					},
				],
			};
		}

		// Modo 'all' (Todas las etapas - Comparativo) con 2 o más evaluaciones
		const questionStats: { [order: number]: { order: number; criterio: string; totalScore: number; count: number; minScore: number } } = {};

		historialSelected.forEach(evalItem => {
			if (!evalItem.resultadosSeguimientoRetroalimentacion) return;
			evalItem.resultadosSeguimientoRetroalimentacion.forEach((resp: any) => {
				const selectedAlt = resp.alternativas?.find((a: any) => a.selected);
				const matchedScale = scale.find(s => s.alternativa === selectedAlt?.alternativa || s.descripcion === selectedAlt?.descripcion?.trim());
				const score = matchedScale?.value || 0;

				if (!questionStats[resp.order]) {
					const preguntaOrig = getPreguntaRespuestaDocentes.find(p => p.order === resp.order);
					questionStats[resp.order] = {
						order: resp.order,
						criterio: preguntaOrig?.criterio || `Pregunta ${resp.order}`,
						totalScore: 0,
						count: 0,
						minScore: Infinity
					};
				}

				questionStats[resp.order].totalScore += score;
				questionStats[resp.order].count += 1;
				questionStats[resp.order].minScore = Math.min(questionStats[resp.order].minScore, score);
			});
		});

		const candidateQuestions = Object.values(questionStats).filter(q => q.minScore < maxScore);
		if (candidateQuestions.length === 0) return null;

		// Ordenar por menor promedio de puntaje (las mayores brechas históricas primero) y tomar top 5
		candidateQuestions.sort((a, b) => (a.totalScore / a.count) - (b.totalScore / b.count));
		const topCriticalQuestions = candidateQuestions.slice(0, 5);

		const labels = topCriticalQuestions.map(q => q.criterio.length > 40 ? q.criterio.substring(0, 38) + '...' : q.criterio);

		const colorPalette = [
			{ bg: 'rgba(59, 130, 246, 0.85)', border: '#2563eb' }, // Blue
			{ bg: 'rgba(16, 185, 129, 0.85)', border: '#10b981' }, // Emerald
			{ bg: 'rgba(139, 92, 246, 0.85)', border: '#8b5cf6' }, // Purple
			{ bg: 'rgba(245, 158, 11, 0.85)', border: '#f59e0b' }, // Amber
			{ bg: 'rgba(236, 72, 153, 0.85)', border: '#ec4899' }, // Pink
		];

		const datasets = historialSelected.map((evalItem, evalIndex) => {
			const phaseName = getCleanPhaseName((evalItem as any).faseNombre, (evalItem as any).idFase || (evalItem as any).faseActualID);
			const dateStr = getLocalDateString(evalItem.fechaMonitoreo || evalItem.fechaCreacion);
			const label = `${phaseName} (${dateStr})`;

			const data = topCriticalQuestions.map(q => {
				const resp = evalItem.resultadosSeguimientoRetroalimentacion?.find((r: any) => r.order === q.order);
				if (!resp) return 0;
				const selectedAlt = resp.alternativas?.find((a: any) => a.selected);
				const matchedScale = scale.find(s => s.alternativa === selectedAlt?.alternativa || s.descripcion === selectedAlt?.descripcion?.trim());
				return matchedScale?.value || 0;
			});

			const palette = colorPalette[evalIndex % colorPalette.length];

			return {
				label,
				data,
				backgroundColor: palette.bg,
				borderColor: palette.border,
				borderWidth: 1,
			};
		});

		return {
			labels,
			datasets,
		};
	};

	const getDistribucionGlobalData = (evalTarget?: User) => {
		if (!dataEvaluacionDocente?.escala) {
			return { pieData: null, stats: [], totalPreguntas: 0 };
		}

		const scale = dataEvaluacionDocente.escala;
		const counts = new Array(scale.length).fill(0);

		let evalList: User[] = [];
		if (evalTarget) {
			evalList = [evalTarget];
		} else if (selectedModalEvalId === 'all') {
			evalList = historialSelected;
		} else if (selectedModalEvalId === 'latest') {
			evalList = latestEvaluation ? [latestEvaluation] : [];
		} else {
			const found = historialSelected.find(h => h.id === selectedModalEvalId);
			evalList = found ? [found] : (latestEvaluation ? [latestEvaluation] : []);
		}

		if (evalList.length === 0) {
			return { pieData: null, stats: [], totalPreguntas: 0 };
		}

		evalList.forEach(item => {
			if (!item?.resultadosSeguimientoRetroalimentacion) return;
			item.resultadosSeguimientoRetroalimentacion.forEach((resp: any) => {
				const selectedAlt = resp.alternativas?.find((a: any) => a.selected);
				const matchedIndex = scale.findIndex((s: any) => s.alternativa === selectedAlt?.alternativa || s.descripcion === selectedAlt?.descripcion?.trim());
				if (matchedIndex !== -1) {
					counts[matchedIndex]++;
				}
			});
		});

		const getNivelColor = (s: any, index: number) => {
			const labelToMatch = (s.descripcion || s.nivel || s.label || '').trim().toLowerCase();
			if (labelToMatch && dataEvaluacionDocente?.niveles) {
				const matchedNivel = dataEvaluacionDocente.niveles.find(
					(n: any) => (n.nivel || n.nombre || '').trim().toLowerCase() === labelToMatch
				);
				if (matchedNivel?.color) {
					return matchedNivel.color;
				}
			}
			if (s.color) return s.color;
			const fallbackColors = [
				'#94a3b8', // Slate
				'#60a5fa', // Blue
				'#34d399', // Emerald
				'#818cf8', // Indigo
				'#6366f1', // Indigo/Purple
				'#f59e0b', // Amber
				'#ec4899', // Pink
			];
			return fallbackColors[index % fallbackColors.length];
		};

		const labels = scale.map((s: any) => s.descripcion || '');

		return {
			pieData: {
				labels,
				datasets: [
					{
						data: counts,
						backgroundColor: scale.map((s: any, i: number) => getNivelColor(s, i)),
						borderColor: '#ffffff',
						borderWidth: 2,
					},
				],
			},
			stats: scale.map((s: any, index: number) => ({
				label: s.descripcion || '',
				count: counts[index],
				color: getNivelColor(s, index),
			})),
			totalPreguntas: counts.reduce((a, b) => a + b, 0)
		};
	};

	return (
		<div className={styles.container}>
			{/* Header */}
			<div className={styles.header}>
				<div className={styles.headerTop}>
					<Link href={`/admin/especialistas/evaluaciones-especialistas/evaluacion/${id}`} className={styles.backButton}>
						<MdArrowBack /> Volver
					</Link>
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
						<span>{evaluadosEspecialista?.length ?? 0} registros</span>
					</div>
				</div>
			</div>

			{/* Main content */}
			<div className={styles.content}>
				{/* Search bar */}
				<div className={styles.searchBar}>
					<div className={styles.searchInputWrapper}>
						<MdSearch className={styles.searchIcon} />
						<input
							type="text"
							className={styles.searchInput}
							placeholder="Buscar por nombre, DNI o UGEL..."
							value={searchQuery}
							onChange={(e) => setSearchQuery(e.target.value)}
						/>
					</div>
					{fasesUnicas.length > 0 && (
						<div className={styles.selectWrapper}>
							<select
								className={styles.phaseSelect}
								value={selectedFase}
								onChange={(e) => setSelectedFase(e.target.value)}
							>
								<option value="">Todas las Fases</option>
								{fasesUnicas.map((f, idx) => (
									<option key={`${f.id}-${idx}`} value={f.id}>{f.nombre}</option>
								))}
							</select>
						</div>
					)}
					<div className={styles.sortDropdownContainer} ref={sortDropdownRef}>
						<button
							type="button"
							className={styles.sortDropdownButton}
							onClick={() => setShowSortDropdown(!showSortDropdown)}
						>
							<MdSort className={styles.sortIcon} />
							<span>
								{sortOrder === 'score-desc' && 'Calif: Mayor a Menor'}
								{sortOrder === 'score-asc' && 'Calif: Menor a Mayor'}
								{sortOrder === 'default' && 'Ordenar por calif.'}
							</span>
							<MdExpandMore className={`${styles.sortArrow} ${showSortDropdown ? styles.sortArrowOpen : ''}`} />
						</button>

						{showSortDropdown && (
							<div className={styles.sortDropdownMenu}>
								<div
									className={`${styles.sortDropdownItem} ${sortOrder === 'default' ? styles.sortItemActive : ''}`}
									onClick={() => { setSortOrder('default'); setShowSortDropdown(false); }}
								>
									<MdSort /> Sin orden especial
								</div>
								<div
									className={`${styles.sortDropdownItem} ${sortOrder === 'score-desc' ? styles.sortItemActive : ''}`}
									onClick={() => { setSortOrder('score-desc'); setShowSortDropdown(false); }}
								>
									<MdArrowDownward style={{ color: '#16a34a' }} /> Mayor a Menor (Descendente)
								</div>
								<div
									className={`${styles.sortDropdownItem} ${sortOrder === 'score-asc' ? styles.sortItemActive : ''}`}
									onClick={() => { setSortOrder('score-asc'); setShowSortDropdown(false); }}
								>
									<MdArrowUpward style={{ color: '#2563eb' }} /> Menor a Mayor (Ascendente)
								</div>
							</div>
						)}
					</div>
					<span className={styles.resultCount}>
						{groupedEvaluados.length} especialista{groupedEvaluados.length !== 1 ? 's' : ''}
					</span>
				</div>

				{/* Table */}
				{loaderPages ? (
					<div className={styles.loaderContainer}>
						<RiLoader4Line className={styles.loaderIcon} />
						<p className={styles.loaderText}>Cargando especialistas...</p>
					</div>
				) : groupedEvaluados.length === 0 ? (
					<div className={styles.emptyState}>
						<MdPeople className={styles.emptyIcon} />
						<p className={styles.emptyText}>
							{searchQuery ? 'Sin resultados para tu búsqueda.' : 'Aún no hay especialistas evaluados.'}
						</p>
					</div>
				) : (
					<div className={styles.tableWrapper}>
						<table className={styles.table}>
							<thead>
								<tr>
									<th style={{ width: '40px' }}></th>
									<th>Especialista</th>
									<th>UGEL</th>
									<th style={{ textAlign: 'center' }}>Evaluaciones</th>
									<th style={{ textAlign: 'center' }}>Última Calif.</th>
									<th style={{ textAlign: 'center' }}>Tendencia</th>
									<th style={{ textAlign: 'right' }}>Acciones</th>
								</tr>
							</thead>
							<tbody>
								{groupedEvaluados.map((group, index) => {
									const dni = group.info.dni || `idx-${index}`;
									const isExpanded = expandedRows.has(dni);
									const latestEval = group.evaluations[0];
									const trend = getTrend(group.evaluations);

									return (
										<React.Fragment key={dni}>
											<tr
												className={`${styles.tableRow} ${isExpanded ? styles.rowExpanded : ''}`}
												onClick={() => toggleRow(dni)}
												style={{ cursor: 'pointer' }}
											>
												<td>
													<div className={styles.expandIcon}>
														{isExpanded ? <MdExpandLess /> : <MdExpandMore />}
													</div>
												</td>
												<td>
													<div className={styles.specialistInfo}>
														<span className={styles.specialistName}>
															{`${group.info.nombres ?? ''} ${group.info.apellidos ?? ''}`.trim() || '—'}
														</span>
														<span className={styles.specialistDni}>{group.info.dni ?? '—'}</span>
													</div>
												</td>
												<td className={styles.tdUgel}>{regionTexto(String(group.info.region)) ?? '—'}</td>
												<td style={{ textAlign: 'center' }}>
													<span className={styles.evalCountBadge}>
														{group.evaluations.length}
													</span>
												</td>
												<td style={{ textAlign: 'center' }}>
													<div className={styles.scoreContainer}>
														<span className={styles.calificacionBadge}>
															{latestEval?.calificacion ?? '—'}
														</span>
														{latestEval?.calificacion !== undefined && getNivel(latestEval.calificacion) && (
															<span
																className={styles.levelBadgeMini}
																style={{
																	backgroundColor: `${getNivel(latestEval.calificacion)?.color}20`,
																	color: getNivel(latestEval.calificacion)?.color,
																	borderColor: `${getNivel(latestEval.calificacion)?.color}40`,
																}}
															>
																{getNivel(latestEval.calificacion)?.nivel}
															</span>
														)}
													</div>
												</td>
												<td style={{ textAlign: 'center' }}>
													{trend ? (
														<div className={styles.trendWrapper} title={trend.label}>
															{trend.icon}
														</div>
													) : (
														<span className={styles.textMuted}>—</span>
													)}
												</td>
												<td style={{ textAlign: 'right' }}>
													<button
														className={styles.historyButton}
														onClick={(e) => {
															e.stopPropagation();
															handleOpenEvolucion(group.info);
														}}
													>
														<MdHistory /> Evolución
													</button>
												</td>
											</tr>
											{isExpanded && (
												<tr className={styles.detailRow}>
													<td colSpan={7}>
														<div className={styles.detailContent}>
															<h4 className={styles.detailTitle}>Historial de Evaluaciones</h4>
															<div className={styles.detailGrid}>
																{group.evaluations.map((evalu, idx) => (
																	<div key={evalu.id || idx} className={styles.evaluationItem}>
																		<div className={styles.evalCardHeader}>
																			<div className={styles.evalMainInfo}>
																				<div className={styles.evalDateWrapper}>
																					<span className={styles.evalDate}>{getLocalDateString(evalu.fechaMonitoreo || evalu.fechaCreacion)}</span>
																					<span className={styles.evalTime}>{formatTime(evalu.fechaCreacion)}</span>
																				</div>
																				{((evalu as any).faseNombre || (evalu as any).idFase || (evalu as any).faseActualID) && (
																					<span className={styles.evalFaseBadge}>Fase: {getCleanPhaseName((evalu as any).faseNombre, (evalu as any).idFase || (evalu as any).faseActualID)}</span>
																				)}
																			</div>
																			<div className={styles.evalScoreGroup}>
																				{evalu.calificacion !== undefined && getNivel(evalu.calificacion) && (
																					<span
																						className={styles.evalLevelText}
																						style={{ color: getNivel(evalu.calificacion)?.color }}
																					>
																						{getNivel(evalu.calificacion)?.nivel}
																					</span>
																				)}
																				<span className={styles.evalScore}>{evalu.calificacion || 0} pts</span>
																			</div>
																		</div>
																		<div className={styles.evalActions}>
																			<button
																				type="button"
																				className={styles.stageEvolucionButton}
																				onClick={(e) => {
																					e.stopPropagation();
																					handleOpenEvolucion(group.info, evalu);
																				}}
																				title="Ver evolución hasta esta etapa"
																			>
																				<MdHistory /> Evolución
																			</button>
																			<Link
																				href={`/admin/especialistas/evaluaciones-especialistas/evaluacion/reporte-especialista-individual?idEvaluacion=${id}&sessionId=${evalu.id}`}
																				className={styles.viewReportLink}
																				onClick={(e) => e.stopPropagation()}
																			>
																				Ver Reporte
																			</Link>
																			<button
																				className={styles.deleteButton}
																				onClick={(e) => handleDeleteClick(e, evalu)}
																				title="Eliminar evaluación"
																			>
																				<MdDelete />
																			</button>
																		</div>
																	</div>
																))}
															</div>
														</div>
													</td>
												</tr>
											)}
										</React.Fragment>
									);
								})}
							</tbody>
						</table>
					</div>
				)}
			</div>

			{/* Evolution Modal */}
			{showModalEvolucion && (
				<div className={styles.modalOverlay} onClick={() => setShowModalEvolucion(false)}>
					<div className={styles.modalContent} onClick={e => e.stopPropagation()}>
						<div className={styles.modalHeader}>
							<h2 className={styles.modalTitle}>Progreso del Especialista</h2>
							<button className={styles.modalClose} onClick={() => setShowModalEvolucion(false)}>×</button>
						</div>
						<div className={styles.modalBody}>
							<div className={styles.modalTabs}>
								<button className={`${styles.tabButton} ${activeTab === 'evolucion' ? styles.activeTab : ''}`} onClick={() => setActiveTab('evolucion')}>Evolución Histórica</button>
								<button className={`${styles.tabButton} ${activeTab === 'radar' ? styles.activeTab : ''}`} onClick={() => setActiveTab('radar')}>Perfil Reticular</button>
								<button className={`${styles.tabButton} ${activeTab === 'analisis' ? styles.activeTab : ''}`} onClick={() => setActiveTab('analisis')}>Brechas Críticas</button>
								<button className={`${styles.tabButton} ${activeTab === 'distribucion' ? styles.activeTab : ''}`} onClick={() => setActiveTab('distribucion')}>Resultados Globales</button>
							</div>

							{loadingHistorial ? (
								<div className={styles.modalLoading}>
									<RiLoader4Line className={styles.loadingIcon} />
									<span>Cargando historial...</span>
								</div>
							) : historialSelected.length > 0 ? (
								<div className={styles.tabContent}>
									{activeTab === 'evolucion' && (
										<div className={styles.chartContainer} style={{ minHeight: '350px', position: 'relative' }}>
											{historialSelected.length === 1 && (
												<div style={{
													position: 'absolute',
													top: '10px',
													left: '50%',
													transform: 'translateX(-50%)',
													background: '#eff6ff',
													color: '#1d4ed8',
													padding: '0.5rem 1rem',
													borderRadius: '8px',
													fontWeight: '600',
													border: '1px solid #bfdbfe',
													zIndex: 10
												}}>
													Única Evaluación: {historialSelected[0].calificacion} pts
												</div>
											)}
											<Line data={chartData} options={chartOptions} />
										</div>
									)}
									{activeTab === 'radar' && (
										<div className={styles.chartContainer} style={{ minHeight: '350px' }}>
											{(() => {
												const maxScale = (dataEvaluacionDocente.escala || []).at(-1)?.value || 4;
												const tooltipOptions = {
													backgroundColor: 'rgba(15, 23, 42, 0.95)', // Tono oscuro profesional (Slate 900)
													titleColor: '#f8fafc',
													bodyColor: '#e2e8f0',
													titleFont: { size: 14, weight: 'bold' as const, family: "'Inter', system-ui, sans-serif" },
													bodyFont: { size: 13, family: "'Inter', system-ui, sans-serif" },
													padding: 16,
													cornerRadius: 8,
													displayColors: false, // Ocultar el cuadrito azul que sale por defecto
													callbacks: {
														title: (context: any) => context[0].label,
														label: (context: any) => `Promedio del dominio: ${context.raw} pts`,
														afterLabel: (context: any) => {
															const details = context.dataset.customDetails[context.dataIndex];
															if (!details || details.length === 0) return ['\nSin datos de evaluación.'];
															const lines = ['\nDesglose por puntos evaluados:'];
															details.forEach((d: any) => {
																lines.push(`• P${d.orden} (${d.puntaje} pts) - ${d.nombre}`);
															});
															return lines;
														}
													}
												};

												return dimensionesEspecialistas.length >= 3 ? (
													<Radar
														data={getRadarData()}
														options={{
															responsive: true,
															maintainAspectRatio: false,
															interaction: {
																mode: 'index',
																intersect: false,
															},
															scales: { r: { min: 0, max: maxScale } },
															plugins: {
																title: { display: true, text: 'Evolución del Dominio de Competencias por Etapa' },
																legend: { display: true, position: 'bottom' },
																tooltip: tooltipOptions
															}
														}}
													/>
												) : (
													<Bar
														data={getRadarData()}
														options={{
															responsive: true,
															maintainAspectRatio: false,
															interaction: {
																mode: 'index',
																intersect: false,
															},
															scales: { y: { min: 0, max: maxScale } },
															plugins: {
																title: { display: true, text: 'Evolución del Dominio de Competencias por Etapa' },
																legend: { display: true, position: 'bottom' },
																tooltip: tooltipOptions
															}
														}}
													/>
												);
											})()}
										</div>
									)}
									{activeTab === 'analisis' && (
										<div style={{ width: '100%' }}>
											{historialSelected.length > 1 && (
												<div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1.25rem', background: '#f8fafc', padding: '0.65rem 1rem', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
													<span style={{ fontSize: '0.85rem', fontWeight: 600, color: '#475569' }}>Filtrar por Etapa / Evaluación:</span>
													<select
														value={selectedModalEvalId}
														onChange={(e) => setSelectedModalEvalId(e.target.value)}
														style={{
															padding: '0.4rem 0.85rem',
															borderRadius: '6px',
															border: '1px solid #cbd5e1',
															fontSize: '0.85rem',
															fontWeight: 500,
															color: '#1e293b',
															outline: 'none',
															background: 'white',
															cursor: 'pointer'
														}}
													>
														<option value="all">Todas las etapas (Comparativo)</option>
														<option value="latest">Última Evaluación ({getCleanPhaseName(latestEvaluation?.faseNombre, latestEvaluation?.idFase)})</option>
														{historialSelected.map((evalu, idx) => (
															<option key={evalu.id || idx} value={evalu.id}>
																{getCleanPhaseName((evalu as any).faseNombre, (evalu as any).idFase || (evalu as any).faseActualID)} - {getLocalDateString(evalu.fechaMonitoreo || evalu.fechaCreacion)} ({evalu.calificacion || 0} pts)
															</option>
														))}
													</select>
												</div>
											)}
											<div className={styles.chartContainer} style={{ minHeight: '350px' }}>
												{getItemAnalysisData() ? (
													<Bar
														data={getItemAnalysisData()!}
														options={{
															responsive: true,
															maintainAspectRatio: false,
															indexAxis: 'y' as const,
															scales: { x: { min: 0, max: (dataEvaluacionDocente.escala || []).at(-1)?.value || 4 } },
															plugins: {
																title: { display: true, text: selectedModalEvalId === 'all' && historialSelected.length > 1 ? 'Evolución de Brechas Críticas por Etapa' : 'Top 5 Criterios con Menor Puntaje' },
																legend: { display: selectedModalEvalId === 'all' && historialSelected.length > 1, position: 'bottom' }
															}
														}}
													/>
												) : (
													<div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', color: '#16a34a', textAlign: 'center' }}>
														<MdTrendingUp style={{ fontSize: '3rem', marginBottom: '1rem' }} />
														<h3 style={{ fontSize: '1.2rem', marginBottom: '0.5rem' }}>¡Excelente Desempeño!</h3>
														<p style={{ maxWidth: '300px' }}>El especialista alcanzó el puntaje máximo en todos los criterios evaluados. No se detectaron brechas críticas.</p>
													</div>
												)}
											</div>
										</div>
									)}
									{activeTab === 'distribucion' && (
										<div style={{ width: '100%', paddingTop: '0.5rem' }}>
											{historialSelected.length > 1 && (
												<div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1.25rem', background: '#f8fafc', padding: '0.65rem 1rem', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
													<span style={{ fontSize: '0.85rem', fontWeight: 600, color: '#475569' }}>Filtrar por Etapa / Evaluación:</span>
													<select
														value={selectedModalEvalId}
														onChange={(e) => setSelectedModalEvalId(e.target.value)}
														style={{
															padding: '0.4rem 0.85rem',
															borderRadius: '6px',
															border: '1px solid #cbd5e1',
															fontSize: '0.85rem',
															fontWeight: 500,
															color: '#1e293b',
															outline: 'none',
															background: 'white',
															cursor: 'pointer'
														}}
													>
														<option value="all">Todas las etapas (Comparativo)</option>
														<option value="latest">Última Evaluación ({getCleanPhaseName(latestEvaluation?.faseNombre, latestEvaluation?.idFase)})</option>
														{historialSelected.map((evalu, idx) => (
															<option key={evalu.id || idx} value={evalu.id}>
																{getCleanPhaseName((evalu as any).faseNombre, (evalu as any).idFase || (evalu as any).faseActualID)} - {getLocalDateString(evalu.fechaMonitoreo || evalu.fechaCreacion)} ({evalu.calificacion || 0} pts)
															</option>
														))}
													</select>
												</div>
											)}
											{(() => {
												const distData = getDistribucionGlobalData();
												if (!distData.pieData) return <p style={{ textAlign: 'center', marginTop: '2rem' }}>No hay datos suficientes para mostrar.</p>;
												return (
													<div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', width: '100%' }}>
														<div style={{ marginBottom: '2rem', width: '100%' }}>
															<div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem' }}>
																<div style={{ width: '4px', height: '24px', backgroundColor: '#3b82f6', borderRadius: '4px' }}></div>
																<h3 style={{ fontSize: '1.25rem', fontWeight: 'bold', color: '#1e293b', margin: 0 }}>Consolidado de Resultados</h3>
															</div>
															<div style={{ width: '100%', maxWidth: '300px', margin: '0 auto' }}>
																<Pie
																	data={distData.pieData}
																	options={{
																		plugins: {
																			legend: { position: 'bottom' },
																			title: { display: false }
																		}
																	}}
																/>
															</div>
														</div>
														<div style={{
															display: 'grid',
															gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))',
															gap: '0.85rem',
															width: '100%',
															background: '#f8fafc',
															padding: '1.25rem',
															borderRadius: '14px',
															border: '1px solid #e2e8f0'
														}}>
															{/* Total Preguntas Card */}
															<div style={{
																background: 'white',
																border: '1px solid #e2e8f0',
																borderRadius: '10px',
																padding: '0.85rem 0.65rem',
																textAlign: 'center',
																display: 'flex',
																flexDirection: 'column',
																alignItems: 'center',
																justifyContent: 'center',
																boxShadow: '0 2px 4px rgba(0, 0, 0, 0.03)'
															}}>
																<span style={{ fontSize: '0.7rem', fontWeight: 700, color: '#475569', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.35rem' }}>
																	TOTAL PREGUNTAS
																</span>
																<span style={{ fontSize: '1.6rem', fontWeight: 800, color: '#0f172a', fontFamily: "'Outfit', sans-serif" }}>
																	{distData.totalPreguntas}
																</span>
															</div>

															{/* Stat Cards por cada Nivel */}
															{distData.stats.map((stat: any, idx: number) => {
																const percentage = distData.totalPreguntas > 0 ? Math.round((stat.count / distData.totalPreguntas) * 100) : 0;
																return (
																	<div key={idx} style={{
																		background: 'white',
																		border: '1px solid #e2e8f0',
																		borderRadius: '10px',
																		padding: '0.85rem 0.65rem',
																		textAlign: 'center',
																		display: 'flex',
																		flexDirection: 'column',
																		alignItems: 'center',
																		justifyContent: 'center',
																		boxShadow: '0 2px 4px rgba(0, 0, 0, 0.03)'
																	}}>
																		<div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', marginBottom: '0.35rem' }}>
																			<span style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: stat.color || '#94a3b8', display: 'inline-block', flexShrink: 0 }}></span>
																			<span style={{ fontSize: '0.7rem', fontWeight: 700, color: '#475569', textTransform: 'uppercase', letterSpacing: '0.03em', lineHeight: 1.2 }}>
																				{stat.label}
																			</span>
																		</div>
																		<span style={{ fontSize: '1.6rem', fontWeight: 800, color: '#0f172a', fontFamily: "'Outfit', sans-serif" }}>
																			{stat.count}
																		</span>
																		<span style={{ fontSize: '0.72rem', fontWeight: 600, color: '#94a3b8', marginTop: '0.2rem' }}>
																			{percentage}% ({stat.count}/{distData.totalPreguntas})
																		</span>
																	</div>
																);
															})}
														</div>
													</div>
												);
											})()}
										</div>
									)}
								</div>
							) : (
								<p className={styles.noHistory}>No se encontraron suficientes registros para generar una gráfica.</p>
							)}
						</div>
					</div>
				</div>
			)}
			{/* Deletion Confirmation Modal */}
			{showConfirmDelete && (
				<div className={styles.modalOverlay} onClick={() => !isDeleting && setShowConfirmDelete(false)}>
					<div className={styles.modalContent} style={{ maxWidth: '450px' }} onClick={e => e.stopPropagation()}>
						<div className={styles.modalBody}>
							<div className={styles.modalConfirm}>
								<MdWarning className={styles.modalConfirmIcon} />
								<h3 className={styles.modalConfirmTitle}>¿Eliminar evaluación?</h3>
								<p className={styles.modalConfirmText}>
									Estás a punto de eliminar la evaluación de <strong>{evaluacionToDelete?.name}</strong>.
									Esta acción no se puede deshacer.
								</p>
								<div className={styles.modalActions}>
									<button
										className={styles.cancelButton}
										onClick={() => setShowConfirmDelete(false)}
										disabled={isDeleting}
									>
										Cancelar
									</button>
									<button
										className={styles.confirmDeleteButton}
										onClick={handleConfirmDelete}
										disabled={isDeleting}
									>
										{isDeleting ? 'Eliminando...' : 'Eliminar permanentemente'}
									</button>
								</div>
							</div>
						</div>
					</div>
				</div>
			)}
		</div>
	);
};

export default EvaluadosPage;
