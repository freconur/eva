import React, { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import { MdSearch, MdSort, MdExpandMore, MdExpandLess, MdLeaderboard, MdPeople, MdHistory, MdDelete, MdFilterList, MdCheck, MdBarChart } from 'react-icons/md';
import { RiLoader4Line } from 'react-icons/ri';
import { User } from '@/features/types/types';
import { regionTexto } from '@/fuctions/regiones';
import { getCleanPhaseName, getLocalDateString, formatTime } from './utils';
import styles from '../styles.module.css';

interface EvaluadosTableProps {
	id: string | string[] | undefined;
	searchQuery: string;
	setSearchQuery: (val: string) => void;
	selectedFase: string;
	setSelectedFase: (val: string) => void;
	fasesUnicas: any[];
	sortOrder: 'default' | 'score-desc' | 'score-asc';
	setSortOrder: (val: 'default' | 'score-desc' | 'score-asc') => void;
	showSortDropdown: boolean;
	setShowSortDropdown: (val: boolean) => void;
	sortDropdownRef: React.RefObject<HTMLDivElement>;
	setShowModalRanking: (val: boolean) => void;
	groupedEvaluados: any[];
	loaderPages: boolean;
	expandedRows: Set<string>;
	toggleRow: (dni: string) => void;
	getTrend: (evaluations: any[]) => { label: string; icon: React.ReactNode } | null;
	getDisplayCalificacion: (evalu: any) => number;
	getNivel: (score: number) => any;
	handleOpenEvolucion: (info: User, evalu?: User) => void;
	handleDeleteClick: (e: React.MouseEvent, evalu: User) => void;
}

export const EvaluadosTable: React.FC<EvaluadosTableProps> = ({
	id,
	searchQuery,
	setSearchQuery,
	selectedFase,
	setSelectedFase,
	fasesUnicas,
	sortOrder,
	setSortOrder,
	showSortDropdown,
	setShowSortDropdown,
	sortDropdownRef,
	setShowModalRanking,
	groupedEvaluados,
	loaderPages,
	expandedRows,
	toggleRow,
	getTrend,
	getDisplayCalificacion,
	getNivel,
	handleOpenEvolucion,
	handleDeleteClick,
}) => {
	const [isTablePhaseDropdownOpen, setIsTablePhaseDropdownOpen] = useState(false);
	const tablePhaseDropdownRef = useRef<HTMLDivElement>(null);

	useEffect(() => {
		const handleClickOutside = (event: MouseEvent) => {
			if (tablePhaseDropdownRef.current && !tablePhaseDropdownRef.current.contains(event.target as Node)) {
				setIsTablePhaseDropdownOpen(false);
			}
		};
		document.addEventListener('mousedown', handleClickOutside);
		return () => document.removeEventListener('mousedown', handleClickOutside);
	}, []);

	return (
		<>
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

				{/* Custom Phase Filter Dropdown */}
				{fasesUnicas.length > 0 && (
					<div className={styles.customDropdownContainer} ref={tablePhaseDropdownRef}>
						<button
							type="button"
							className={`${styles.customDropdownTrigger} ${isTablePhaseDropdownOpen ? styles.customDropdownTriggerActive : ''}`}
							onClick={() => setIsTablePhaseDropdownOpen(!isTablePhaseDropdownOpen)}
						>
							<MdFilterList className={styles.customDropdownIcon} />
							<span className={styles.customDropdownLabel}>
								{selectedFase
									? (fasesUnicas.find(f => f.id === selectedFase)?.nombre || selectedFase)
									: 'Todas las Fases'
								}
							</span>
							<MdExpandMore className={`${styles.customDropdownArrow} ${isTablePhaseDropdownOpen ? styles.customDropdownArrowOpen : ''}`} />
						</button>

						{isTablePhaseDropdownOpen && (
							<div className={styles.customDropdownMenu}>
								<div
									className={`${styles.customDropdownItem} ${selectedFase === '' ? styles.customDropdownItemActive : ''}`}
									onClick={() => { setSelectedFase(''); setIsTablePhaseDropdownOpen(false); }}
								>
									<span>Todas las Fases</span>
									{selectedFase === '' && <MdCheck className={styles.customDropdownCheck} />}
								</div>
								{fasesUnicas.map((f, idx) => (
									<div
										key={`${f.id}-${idx}`}
										className={`${styles.customDropdownItem} ${selectedFase === f.id ? styles.customDropdownItemActive : ''}`}
										onClick={() => { setSelectedFase(f.id); setIsTablePhaseDropdownOpen(false); }}
									>
										<span>{f.nombre}</span>
										{selectedFase === f.id && <MdCheck className={styles.customDropdownCheck} />}
									</div>
								))}
							</div>
						)}
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
								Por defecto (Orden original)
							</div>
							<div
								className={`${styles.sortDropdownItem} ${sortOrder === 'score-desc' ? styles.sortItemActive : ''}`}
								onClick={() => { setSortOrder('score-desc'); setShowSortDropdown(false); }}
							>
								Calificación: Mayor a Menor
							</div>
							<div
								className={`${styles.sortDropdownItem} ${sortOrder === 'score-asc' ? styles.sortItemActive : ''}`}
								onClick={() => { setSortOrder('score-asc'); setShowSortDropdown(false); }}
							>
								Calificación: Menor a Mayor
							</div>
						</div>
					)}
				</div>
				<button
					type="button"
					className={styles.rankingButton}
					onClick={() => setShowModalRanking(true)}
				>
					<MdBarChart /> Gráficos
				</button>
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
														{`${group.info.nombres ?? ''} ${group.info.apellidos ?? ''}`.trim().toUpperCase() || '—'}
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
														{latestEval ? getDisplayCalificacion(latestEval) : '—'}
													</span>
													{latestEval && getNivel(getDisplayCalificacion(latestEval)) && (
														<span
															className={styles.levelBadgeMini}
															style={{
																backgroundColor: `${getNivel(getDisplayCalificacion(latestEval))?.color}20`,
																color: getNivel(getDisplayCalificacion(latestEval))?.color,
																borderColor: `${getNivel(getDisplayCalificacion(latestEval))?.color}40`,
															}}
														>
															{getNivel(getDisplayCalificacion(latestEval))?.nivel}
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
															{group.evaluations.map((evalu: any, idx: number) => {
																const displayScore = getDisplayCalificacion(evalu);
																const nivelObj = getNivel(displayScore);
																return (
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
																				{nivelObj && (
																					<span
																						className={styles.evalLevelText}
																						style={{ color: nivelObj.color }}
																					>
																						{nivelObj.nivel}
																					</span>
																				)}
																				<span className={styles.evalScore}>{displayScore} pts</span>
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
																);
															})}
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
		</>
	);
};
