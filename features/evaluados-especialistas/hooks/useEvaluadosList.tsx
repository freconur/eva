import React, { useState, useMemo, useRef, useEffect } from 'react';
import { MdTrendingUp, MdTrendingDown, MdTrendingFlat } from 'react-icons/md';
import { User } from '@/features/types/types';
import { regionTexto } from '@/fuctions/regiones';
import { getMonitoreoTimestamp, getCleanPhaseName } from '../components/utils';
import { getUniquePhases } from '@/features/utils/phaseUtils';
import styles from '../styles.module.css';

export const useEvaluadosList = (evaluadosEspecialista: User[] | undefined, dataEvaluacionDocente: any) => {
	const [searchQuery, setSearchQuery] = useState<string>('');
	const [selectedFase, setSelectedFase] = useState<string>('');
	const [selectedUgel, setSelectedUgel] = useState<string>('');
	const [sortOrder, setSortOrder] = useState<'default' | 'score-desc' | 'score-asc'>('score-desc');
	const [showSortDropdown, setShowSortDropdown] = useState(false);
	const sortDropdownRef = useRef<HTMLDivElement>(null);
	const [expandedRows, setExpandedRows] = useState<Set<string>>(new Set());

	useEffect(() => {
		const handleClickOutside = (event: MouseEvent) => {
			if (sortDropdownRef.current && !sortDropdownRef.current.contains(event.target as Node)) {
				setShowSortDropdown(false);
			}
		};
		document.addEventListener('mousedown', handleClickOutside);
		return () => document.removeEventListener('mousedown', handleClickOutside);
	}, []);

	const getNivel = (calificacion: number) => {
		if (!dataEvaluacionDocente?.niveles || dataEvaluacionDocente.niveles.length === 0) return null;
		return dataEvaluacionDocente.niveles.find((n: any) => calificacion >= (n.min || 0) && calificacion <= (n.max || 0));
	};

	const getDisplayCalificacion = (evalu: any): number => {
		if (!evalu) return 0;
		const activeScale = dataEvaluacionDocente?.escala || [];
		if (!evalu.resultadosSeguimientoRetroalimentacion || activeScale.length === 0) {
			return evalu.calificacion || 0;
		}
		let total = 0;
		evalu.resultadosSeguimientoRetroalimentacion.forEach((resp: any) => {
			const selectedAlt = resp.alternativas?.find((a: any) => a.selected);
			if (selectedAlt) {
				const matchedScale = activeScale.find(
					(s: any) => String(s.alternativa || '') === String(selectedAlt.alternativa || '') ||
					            (s.descripcion && selectedAlt.descripcion && s.descripcion.trim().toLowerCase() === selectedAlt.descripcion.trim().toLowerCase())
				);
				total += matchedScale?.value !== undefined ? matchedScale.value : (selectedAlt.value || 0);
			}
		});
		return total > 0 ? total : (evalu.calificacion || 0);
	};

	const fasesUnicas = useMemo(() => {
		if (!evaluadosEspecialista || evaluadosEspecialista.length === 0) return [];
		const uniquePhases = getUniquePhases(dataEvaluacionDocente, evaluadosEspecialista);
		if (uniquePhases && uniquePhases.length > 0) {
			return uniquePhases;
		}

		const mapFases = new Map<string, string>();
		evaluadosEspecialista.forEach(e => {
			const idF = (e as any).idFase || (e as any).faseActualID || e.faseNombre;
			if (idF) {
				const nombreLimpio = getCleanPhaseName(e.faseNombre, idF);
				if (!Array.from(mapFases.values()).some(n => n.toLowerCase() === nombreLimpio.toLowerCase())) {
					mapFases.set(idF, nombreLimpio);
				}
			}
		});
		return Array.from(mapFases.entries()).map(([id, nombre]) => ({ id, nombre }));
	}, [evaluadosEspecialista, dataEvaluacionDocente]);

	const groupedEvaluados = useMemo(() => {
		if (!evaluadosEspecialista || evaluadosEspecialista.length === 0) return [];

		const mapGroup = new Map<string, { info: User; evaluations: User[] }>();

		evaluadosEspecialista.forEach(item => {
			const key = item.dni || item.id || 'desconocido';
			if (!mapGroup.has(key)) {
				mapGroup.set(key, {
					info: item,
					evaluations: []
				});
			}
			mapGroup.get(key)!.evaluations.push(item);
		});

		let result = Array.from(mapGroup.values()).map(group => {
			const sortedEvals = [...group.evaluations].sort((a, b) => getMonitoreoTimestamp(b) - getMonitoreoTimestamp(a));
			return {
				...group,
				evaluations: sortedEvals
			};
		});

		if (searchQuery.trim()) {
			const query = searchQuery.toLowerCase().trim();
			result = result.filter(group => {
				const nombres = (group.info.nombres || '').toLowerCase();
				const apellidos = (group.info.apellidos || '').toLowerCase();
				const dni = (group.info.dni || '').toLowerCase();
				const ugel = (regionTexto(String(group.info.region)) || '').toLowerCase();
				return nombres.includes(query) || apellidos.includes(query) || dni.includes(query) || ugel.includes(query);
			});
		}

		if (selectedFase) {
			const targetFaseObj = fasesUnicas.find(f => f.id === selectedFase);
			const targetFaseName = targetFaseObj?.nombre?.toLowerCase().trim();

			result = result
				.map(group => {
					const filteredEvals = group.evaluations.filter(e => {
						const idF = (e as any).idFase || (e as any).faseActualID || e.faseNombre;
						if (idF === selectedFase) return true;
						if ((e as any).idFase === selectedFase) return true;
						if ((e as any).faseActualID === selectedFase) return true;
						if (e.faseNombre === selectedFase) return true;

						if (targetFaseName) {
							const cleanName = getCleanPhaseName(e.faseNombre, (e as any).idFase || (e as any).faseActualID).toLowerCase().trim();
							if (cleanName === targetFaseName) return true;
						}
						return false;
					});

					return {
						...group,
						evaluations: filteredEvals
					};
				})
				.filter(group => group.evaluations.length > 0);
		}

		if (selectedUgel && selectedUgel !== 'all') {
			result = result.filter(group => {
				const reg = group.info.region;
				return String(reg) === String(selectedUgel) || Number(reg) === Number(selectedUgel);
			});
		}

		if (sortOrder === 'score-desc') {
			result.sort((a, b) => {
				const scoreA = a.evaluations[0] ? getDisplayCalificacion(a.evaluations[0]) : 0;
				const scoreB = b.evaluations[0] ? getDisplayCalificacion(b.evaluations[0]) : 0;
				return scoreB - scoreA;
			});
		} else if (sortOrder === 'score-asc') {
			result.sort((a, b) => {
				const scoreA = a.evaluations[0] ? getDisplayCalificacion(a.evaluations[0]) : 0;
				const scoreB = b.evaluations[0] ? getDisplayCalificacion(b.evaluations[0]) : 0;
				return scoreA - scoreB;
			});
		}

		return result;
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [evaluadosEspecialista, searchQuery, selectedFase, selectedUgel, sortOrder, dataEvaluacionDocente, fasesUnicas]);

	const getTrend = (evaluations: User[]) => {
		if (evaluations.length < 2) return null;
		const latestScore = getDisplayCalificacion(evaluations[0]);
		const prevScore = getDisplayCalificacion(evaluations[1]);

		if (latestScore > prevScore) {
			return {
				label: `Subió de ${prevScore} a ${latestScore} pts`,
				icon: <MdTrendingUp className={styles.trendUp} />
			};
		} else if (latestScore < prevScore) {
			return {
				label: `Bajó de ${prevScore} a ${latestScore} pts`,
				icon: <MdTrendingDown className={styles.trendDown} />
			};
		} else {
			return {
				label: `Se mantuvo en ${latestScore} pts`,
				icon: <MdTrendingFlat className={styles.trendNeutral} />
			};
		}
	};

	const toggleRow = (dni: string) => {
		setExpandedRows(prev => {
			const next = new Set(prev);
			if (next.has(dni)) {
				next.delete(dni);
			} else {
				next.add(dni);
			}
			return next;
		});
	};

	return {
		searchQuery,
		setSearchQuery,
		selectedFase,
		setSelectedFase,
		selectedUgel,
		setSelectedUgel,
		sortOrder,
		setSortOrder,
		showSortDropdown,
		setShowSortDropdown,
		sortDropdownRef,
		expandedRows,
		fasesUnicas,
		groupedEvaluados,
		getTrend,
		getNivel,
		getDisplayCalificacion,
		toggleRow,
	};
};
