import React, { useState, useRef, useEffect } from 'react';
import { MdBarChart, MdEqualizer, MdEmojiEvents, MdLocationOn, MdInfo, MdPieChart, MdFilterList, MdCheck, MdExpandMore, MdTrendingUp, MdAnalytics, MdWarningAmber, MdVerified, MdHistory } from 'react-icons/md';
import { Bar, Pie } from 'react-chartjs-2';
import { barSegmentScorePlugin, pieSegmentLabelPlugin, getCleanPhaseName, getLocalDateString } from './utils';
import styles from '../styles.module.css';

interface RankingViewsProps {
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
	onUpdateNivelColor?: (nivelIdx: number, newColor: string) => Promise<void>;
}

export const RankingViews: React.FC<RankingViewsProps> = ({
	rankingTab,
	setRankingTab,
	selectedRankingFase,
	setSelectedRankingFase,
	fasesUnicas,
	dataEvaluacionDocente,
	rankingEspecialistas,
	getHorizontalRankingData,
	getVerticalRankingData,
	getUgelRankingData,
	getUgelPieData,
	getNivelesPieData,
	executiveMetrics,
	handleOpenEvolucion,
	maxRankingScaleValue,
	rankingByUgel,
	selectedUgelForDetail,
	setSelectedUgelForDetail,
	selectedUgelSummary,
	ugelEspecialistasList,
	getNivel,
	onUpdateNivelColor,
}) => {
	const [ugelChartType, setUgelChartType] = useState<'bar' | 'pieUgel' | 'pieNivel'>('bar');
	const [isPhaseDropdownOpen, setIsPhaseDropdownOpen] = useState(false);
	const [activeLegendColorIdx, setActiveLegendColorIdx] = useState<number | null>(null);
	const [legendHexInput, setLegendHexInput] = useState<string>('');
	const phaseDropdownRef = useRef<HTMLDivElement>(null);
	const legendPopoverRef = useRef<HTMLDivElement>(null);

	useEffect(() => {
		const handleClickOutside = (event: MouseEvent) => {
			if (phaseDropdownRef.current && !phaseDropdownRef.current.contains(event.target as Node)) {
				setIsPhaseDropdownOpen(false);
			}
			if (legendPopoverRef.current && !legendPopoverRef.current.contains(event.target as Node)) {
				setActiveLegendColorIdx(null);
			}
		};
		document.addEventListener('mousedown', handleClickOutside);
		return () => document.removeEventListener('mousedown', handleClickOutside);
	}, []);

	return (
		<>
			{/* Subtabs for Ranking Views (Segmented Control) */}
			<div className={styles.subtabContainer}>
				<button
					className={`${styles.subtabButton} ${rankingTab === 'horizontal' ? styles.activeSubtabButton : ''}`}
					onClick={() => setRankingTab('horizontal')}
				>
					<MdBarChart /> Ranking Horizontal
				</button>
				<button
					className={`${styles.subtabButton} ${rankingTab === 'vertical' ? styles.activeSubtabButton : ''}`}
					onClick={() => setRankingTab('vertical')}
				>
					<MdEqualizer /> Ranking Vertical
				</button>
				<button
					className={`${styles.subtabButton} ${rankingTab === 'podio' ? styles.activeSubtabButton : ''}`}
					onClick={() => setRankingTab('podio')}
				>
					<MdTrendingUp /> Resumen Ejecutivo & KPIs
				</button>
				<button
					className={`${styles.subtabButton} ${rankingTab === 'ugel' ? styles.activeSubtabButton : ''}`}
					onClick={() => setRankingTab('ugel')}
				>
					<MdLocationOn /> Ranking por UGEL
				</button>
			</div>

			{/* Toolbar bar with Phase Dropdown & Level Legend */}
			<div className={styles.rankingToolbar}>
				{/* Custom Phase Filter Dropdown */}
				{fasesUnicas.length > 0 ? (
					<div className={styles.toolbarFilterGroup}>
						<span className={styles.toolbarFilterLabel}>
							Filtrar por Fase:
						</span>
						<div className={styles.customDropdownContainer} ref={phaseDropdownRef}>
							<button
								type="button"
								className={`${styles.customDropdownTrigger} ${isPhaseDropdownOpen ? styles.customDropdownTriggerActive : ''}`}
								onClick={() => setIsPhaseDropdownOpen(!isPhaseDropdownOpen)}
							>
								<MdFilterList className={styles.customDropdownIcon} />
								<span className={styles.customDropdownLabel}>
									{selectedRankingFase
										? (fasesUnicas.find(f => f.id === selectedRankingFase)?.nombre || selectedRankingFase)
										: 'Todas las Fases (General)'
									}
								</span>
								<MdExpandMore className={`${styles.customDropdownArrow} ${isPhaseDropdownOpen ? styles.customDropdownArrowOpen : ''}`} />
							</button>

							{isPhaseDropdownOpen && (
								<div className={styles.customDropdownMenu}>
									<div
										className={`${styles.customDropdownItem} ${selectedRankingFase === '' ? styles.customDropdownItemActive : ''}`}
										onClick={() => { setSelectedRankingFase(''); setIsPhaseDropdownOpen(false); }}
									>
										<span>Todas las Fases (General)</span>
										{selectedRankingFase === '' && <MdCheck className={styles.customDropdownCheck} />}
									</div>
									{fasesUnicas.map((f, idx) => (
										<div
											key={`${f.id}-${idx}`}
											className={`${styles.customDropdownItem} ${selectedRankingFase === f.id ? styles.customDropdownItemActive : ''}`}
											onClick={() => { setSelectedRankingFase(f.id); setIsPhaseDropdownOpen(false); }}
										>
											<span>{f.nombre}</span>
											{selectedRankingFase === f.id && <MdCheck className={styles.customDropdownCheck} />}
										</div>
									))}
								</div>
							)}
						</div>
					</div>
				) : <div />}

				{/* Niveles Legend */}
				{dataEvaluacionDocente?.niveles && dataEvaluacionDocente.niveles.length > 0 && (
					<div className={styles.toolbarLegendGroup} ref={legendPopoverRef}>
						<span className={styles.toolbarLegendTitle}>Leyenda:</span>
						{dataEvaluacionDocente.niveles.map((n: any, idx: number) => {
							const currentColor = n.color || '#3b82f6';
							const isEditing = activeLegendColorIdx === idx;

							return (
								<div
									key={idx}
									className={`${styles.toolbarLegendItem} ${onUpdateNivelColor ? styles.toolbarLegendItemEditable : ''} ${isEditing ? styles.toolbarLegendItemActive : ''}`}
									onClick={() => {
										if (!onUpdateNivelColor) return;
										if (isEditing) {
											setActiveLegendColorIdx(null);
										} else {
											setActiveLegendColorIdx(idx);
											setLegendHexInput(currentColor.toUpperCase());
										}
									}}
									title={onUpdateNivelColor ? `Clic para editar color HEX de "${n.nivel}"` : undefined}
								>
									<span className={styles.toolbarLegendColorWrapper}>
										<span
											className={styles.toolbarLegendDot}
											style={{ backgroundColor: currentColor }}
										/>
									</span>
									<span className={styles.toolbarLegendText}>
										{n.nivel}
									</span>

									{/* Popover editor directo en HEX */}
									{isEditing && onUpdateNivelColor && (
										<div
											className={styles.legendColorPopover}
											onClick={(e) => e.stopPropagation()}
										>
											<div className={styles.legendColorPopoverHeader}>
												<span>Editar Color ({n.nivel})</span>
												<button
													type="button"
													className={styles.legendColorCloseBtn}
													onClick={() => setActiveLegendColorIdx(null)}
												>
													✕
												</button>
											</div>

											<div className={styles.legendColorInputRow}>
												{/* Selector nativo sincronizado */}
												<input
													type="color"
													value={currentColor.startsWith('#') && currentColor.length === 7 ? currentColor : '#3b82f6'}
													onChange={(e) => {
														const val = e.target.value.toUpperCase();
														setLegendHexInput(val);
														onUpdateNivelColor(idx, val);
													}}
													className={styles.legendColorSwatchInput}
													title="Selector de color"
												/>

												{/* Input HEX directo */}
												<input
													type="text"
													value={legendHexInput}
													autoFocus
													maxLength={7}
													placeholder="#HEX"
													onChange={(e) => {
														let val = e.target.value;
														if (!val.startsWith('#') && val.length > 0) {
															val = '#' + val;
														}
														setLegendHexInput(val.toUpperCase());
														if (/^#[0-9A-Fa-f]{6}$/.test(val)) {
															onUpdateNivelColor(idx, val.toUpperCase());
														}
													}}
													onKeyDown={(e) => {
														if (e.key === 'Enter' || e.key === 'Escape') {
															setActiveLegendColorIdx(null);
														}
													}}
													className={styles.legendColorHexInput}
												/>
											</div>

											{/* Paleta rápida de sugerencias */}
											<div className={styles.legendColorPresets}>
												{['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#EC4899', '#06B6D4', '#64748B'].map((presetHex) => (
													<button
														key={presetHex}
														type="button"
														className={styles.legendColorPresetDot}
														style={{ backgroundColor: presetHex }}
														onClick={() => {
															setLegendHexInput(presetHex);
															onUpdateNivelColor(idx, presetHex);
															setActiveLegendColorIdx(null);
														}}
														title={presetHex}
													/>
												))}
											</div>
										</div>
									)}
								</div>
							);
						})}
					</div>
				)}
			</div>

			<div key={rankingTab} className={`${styles.tabContent} ${styles.tabFadeContainer}`}>
				{rankingTab === 'horizontal' && (
					<div className={styles.chartContainer} style={{ minHeight: `${Math.max(400, rankingEspecialistas.length * 40)}px`, position: 'relative' }}>
						<Bar
							data={getHorizontalRankingData()}
							plugins={[barSegmentScorePlugin]}
							options={{
								responsive: true,
								maintainAspectRatio: false,
								indexAxis: 'y' as const,
								scales: {
									x: {
										stacked: true,
										beginAtZero: true,
										suggestedMax: maxRankingScaleValue,
										title: { display: true, text: 'Puntaje de Evaluación' }
									},
									y: {
										stacked: true
									}
								},
								plugins: {
									legend: { display: false },
									title: {
										display: true,
										text: selectedRankingFase
											? `Ranking de Especialistas (${fasesUnicas.find(f => f.id === selectedRankingFase)?.nombre || 'Fase Seleccionada'})`
											: 'Ranking Descendente por Calificación (Vista Horizontal)'
									},
									tooltip: {
										callbacks: {
											title: (context: any) => {
												const item = rankingEspecialistas[context[0].dataIndex];
												return item ? `#${context[0].dataIndex + 1}. ${item.fullName}` : '';
											},
											label: (context: any) => {
												const item = rankingEspecialistas[context.dataIndex];
												const evalIndex = context.datasetIndex;
												const evalu = item?.evaluationsSorted[evalIndex];
												if (!evalu) return '';
												const score = evalu.calificacion || 0;
												const fase = getCleanPhaseName((evalu as any).faseNombre, (evalu as any).idFase || (evalu as any).faseActualID);
												const dateStr = getLocalDateString(evalu.fechaMonitoreo || evalu.fechaCreacion);
												const nivelObj = getNivel(score);
												return ` ${context.dataset.label} (${fase} - ${dateStr}): ${score} pts ${nivelObj ? `[${nivelObj.nivel}]` : ''}`;
											},
											afterBody: (context: any) => {
												const item = rankingEspecialistas[context[0].dataIndex];
												if (!item || !item.evaluationsSorted || item.evaluationsSorted.length <= 1) return '';
												const lines = ['\nHistorial Completo de Evaluaciones:'];
												item.evaluationsSorted.forEach((ev: any, idx: number) => {
													const s = ev.calificacion || 0;
													const f = getCleanPhaseName(ev.faseNombre, ev.idFase || ev.faseActualID);
													const d = getLocalDateString(ev.fechaMonitoreo || ev.fechaCreacion);
													const n = getNivel(s)?.nivel || '—';
													lines.push(`• Eval ${idx + 1} (${f} - ${d}): ${s} pts [${n}]`);
												});
												lines.push(`Total Acumulado: ${item.totalScore} pts (${item.evaluationsSorted.length} evaluaciones)`);
												return lines;
											}
										}
									}
								}
							}}
						/>
					</div>
				)}

				{rankingTab === 'vertical' && (
					<div className={styles.chartContainer} style={{ minHeight: '480px' }}>
						<Bar
							data={getVerticalRankingData()}
							plugins={[barSegmentScorePlugin]}
							options={{
								responsive: true,
								maintainAspectRatio: false,
								scales: {
									x: {
										stacked: true,
										ticks: { autoSkip: false, maxRotation: 45, minRotation: 45 }
									},
									y: {
										stacked: true,
										beginAtZero: true,
										suggestedMax: maxRankingScaleValue,
										title: { display: true, text: 'Puntaje de Evaluación' }
									}
								},
								plugins: {
									legend: { display: false },
									title: {
										display: true,
										text: selectedRankingFase
											? `Ranking de Especialistas (${fasesUnicas.find(f => f.id === selectedRankingFase)?.nombre || 'Fase Seleccionada'})`
											: 'Ranking Descendente por Calificación (Vista Vertical)'
									},
									tooltip: {
										callbacks: {
											title: (context: any) => {
												const item = rankingEspecialistas[context[0].dataIndex];
												return item ? item.fullName : '';
											},
											label: (context: any) => {
												const item = rankingEspecialistas[context.dataIndex];
												const evalIndex = context.datasetIndex;
												const evalu = item?.evaluationsSorted[evalIndex];
												if (!evalu) return '';
												const score = evalu.calificacion || 0;
												const fase = getCleanPhaseName((evalu as any).faseNombre, (evalu as any).idFase || (evalu as any).faseActualID);
												const dateStr = getLocalDateString(evalu.fechaMonitoreo || evalu.fechaCreacion);
												const nivelObj = getNivel(score);
												return ` ${context.dataset.label} (${fase} - ${dateStr}): ${score} pts ${nivelObj ? `[${nivelObj.nivel}]` : ''}`;
											},
											afterBody: (context: any) => {
												const item = rankingEspecialistas[context[0].dataIndex];
												if (!item || !item.evaluationsSorted || item.evaluationsSorted.length <= 1) return '';
												const lines = ['\nHistorial Completo de Evaluaciones:'];
												item.evaluationsSorted.forEach((ev: any, idx: number) => {
													const s = ev.calificacion || 0;
													const f = getCleanPhaseName(ev.faseNombre, ev.idFase || ev.faseActualID);
													const d = getLocalDateString(ev.fechaMonitoreo || ev.fechaCreacion);
													const n = getNivel(s)?.nivel || '—';
													lines.push(`• Eval ${idx + 1} (${f} - ${d}): ${s} pts [${n}]`);
												});
												lines.push(`Total Acumulado: ${item.totalScore} pts (${item.evaluationsSorted.length} evaluaciones)`);
												return lines;
											}
										}
									}
								}
							}}
						/>
					</div>
				)}

				{rankingTab === 'podio' && (
					<div className={styles.podiumTabContainer}>
						{/* Grid de KPIs Ejecutivos */}
						<div className={styles.kpiGrid}>
							{/* Card 1: Promedio General */}
							<div className={styles.kpiCard}>
								<div className={styles.kpiHeader}>
									<span className={styles.kpiTitle}>Promedio General</span>
									<span className={`${styles.kpiIconWrapper} ${styles.kpiIconBlue}`}>
										<MdAnalytics />
									</span>
								</div>
								<div className={styles.kpiValue}>
									{executiveMetrics?.promedioGeneral ?? 0} pts
								</div>
								<span className={styles.kpiSubtext}>
									Calificación media de especialistas evaluados
								</span>
							</div>

							{/* Card 2: Top Performer */}
							<div className={styles.kpiCard}>
								<div className={styles.kpiHeader}>
									<span className={styles.kpiTitle}>Mejor Desempeño</span>
									<span className={`${styles.kpiIconWrapper} ${styles.kpiIconGold}`}>
										<MdEmojiEvents />
									</span>
								</div>
								<div className={`${styles.kpiValue} ${styles.kpiValueName}`} title={executiveMetrics?.topPerformer?.fullName}>
									{executiveMetrics?.topPerformer?.fullName || '—'}
								</div>
								<span className={styles.kpiSubtext}>
									{executiveMetrics?.topPerformer
										? `${executiveMetrics.topPerformer.score} pts (${executiveMetrics.topPerformer.ugel})`
										: 'Sin datos'
									}
								</span>
							</div>

							{/* Card 3: Cobertura de Logro Esperado+ */}
							<div className={styles.kpiCard}>
								<div className={styles.kpiHeader}>
									<span className={styles.kpiTitle}>Cobertura de Logro</span>
									<span className={`${styles.kpiIconWrapper} ${styles.kpiIconGreen}`}>
										<MdVerified />
									</span>
								</div>
								<div className={styles.kpiValue}>
									{executiveMetrics?.tasaExitoPct ?? 0}%
								</div>
								<span className={styles.kpiSubtext}>
									{executiveMetrics?.satisfactoriosCount ?? 0} de {rankingEspecialistas.length} en Logro Esperado+
								</span>
							</div>

							{/* Card 4: Atención Prioritaria */}
							<div className={styles.kpiCard}>
								<div className={styles.kpiHeader}>
									<span className={styles.kpiTitle}>Acompañamiento Prioritario</span>
									<span className={`${styles.kpiIconWrapper} ${styles.kpiIconAmber}`}>
										<MdWarningAmber />
									</span>
								</div>
								<div className={styles.kpiValue}>
									{executiveMetrics?.atencionPrioritariaList?.length ?? 0} esp.
								</div>
								<span className={styles.kpiSubtext}>
									Requieren soporte pedagógico urgente
								</span>
							</div>
						</div>

						{/* Sección: Alerta de Atención Prioritaria si existen especialistas en Inicio */}
						{executiveMetrics?.atencionPrioritariaList && executiveMetrics.atencionPrioritariaList.length > 0 && (
							<div className={styles.priorityAlertCard}>
								<div className={styles.priorityAlertHeader}>
									<MdWarningAmber className={styles.priorityAlertIcon} />
									<span>Especialistas Identificados para Acompañamiento Pedagógico Prioritario</span>
								</div>
								<table className={styles.table}>
									<thead>
										<tr>
											<th>Especialista</th>
											<th>UGEL</th>
											<th style={{ textAlign: 'center' }}>Fases Evaluadas</th>
											<th style={{ textAlign: 'right' }}>Última Eval.</th>
											<th style={{ textAlign: 'center' }}>Promedio Histórico</th>
											<th style={{ textAlign: 'center' }}>Nivel de Logro</th>
											{handleOpenEvolucion && <th style={{ textAlign: 'center' }}>Acción</th>}
										</tr>
									</thead>
									<tbody>
										{executiveMetrics.atencionPrioritariaList.map((item: any) => (
											<tr key={`priority-${item.dni}`} className={styles.tableRow}>
												<td>
													<div className={styles.specialistInfo}>
														<span className={styles.specialistName}>{item.fullName}</span>
														<span className={styles.specialistDni}>DNI: {item.dni}</span>
													</div>
												</td>
												<td style={{ fontWeight: 600, color: '#475569' }}>{item.ugel}</td>
												<td style={{ textAlign: 'center' }}>
													<div className={styles.phasePillsWrapper} style={{ justifyContent: 'center' }}>
														{item.fasesList && item.fasesList.length > 0 ? (
															item.fasesList.map((fName: string, fIdx: number) => (
																<span key={`priority-${item.dni}-fase-${fIdx}`} className={styles.phasePillChip}>
																	{fName}
																</span>
															))
														) : (
															<span className={styles.phasePillChip}>—</span>
														)}
													</div>
												</td>
												<td style={{ textAlign: 'right', fontWeight: 800, color: item.nivel?.color || '#ef4444', fontSize: '0.98rem' }}>
													{item.score} pts
												</td>
												<td style={{ textAlign: 'center' }}>
													<span className={styles.promedioHistoricoBadge}>
														{item.promedioHistorico ?? item.score} pts
													</span>
												</td>
												<td style={{ textAlign: 'center' }}>
													{item.nivel ? (
														<span
															className={styles.levelBadgeMini}
															style={{
																backgroundColor: `${item.nivel.color}20`,
																color: item.nivel.color,
																borderColor: `${item.nivel.color}40`
															}}
														>
															{item.nivel.nivel}
														</span>
													) : '—'}
												</td>
												{handleOpenEvolucion && (
													<td style={{ textAlign: 'center' }}>
														<button
															type="button"
															className={styles.actionBtn}
															onClick={() => handleOpenEvolucion(item.info)}
														>
															<MdHistory /> Ver Historial
														</button>
													</td>
												)}
											</tr>
										))}
									</tbody>
								</table>
							</div>
						)}

						{/* Tabla General de Posiciones */}
						<div className={styles.leaderboardWrapper}>
							<h3 className={styles.leaderboardTitle}>Tabla General de Posiciones de Especialistas</h3>
							<table className={styles.table}>
								<thead>
									<tr>
										<th style={{ width: '50px', textAlign: 'center' }}>Pos.</th>
										<th>Especialista</th>
										<th>UGEL</th>
										<th style={{ textAlign: 'center' }}>Fases Evaluadas</th>
										<th style={{ textAlign: 'right' }}>Última Eval.</th>
										<th style={{ textAlign: 'center' }}>Promedio Histórico</th>
										<th style={{ textAlign: 'center' }}>Nivel</th>
										{handleOpenEvolucion && <th style={{ textAlign: 'center' }}>Historial</th>}
									</tr>
								</thead>
								<tbody>
									{rankingEspecialistas.map((item, idx) => (
										<tr key={item.dni} className={styles.tableRow}>
											<td style={{ textAlign: 'center' }}>
												<span className={`${styles.rankBadge} ${idx === 0 ? styles.rank1 : idx === 1 ? styles.rank2 : idx === 2 ? styles.rank3 : ''}`}>
													{idx + 1}
												</span>
											</td>
											<td>
												<div className={styles.specialistInfo}>
													<span className={styles.specialistName}>{item.fullName}</span>
													<span className={styles.specialistDni}>DNI: {item.dni}</span>
												</div>
											</td>
											<td style={{ fontWeight: 600, color: '#475569' }}>{item.ugel}</td>
											<td style={{ textAlign: 'center' }}>
												<div className={styles.phasePillsWrapper} style={{ justifyContent: 'center' }}>
													{item.fasesList && item.fasesList.length > 0 ? (
														item.fasesList.map((fName: string, fIdx: number) => (
															<span key={`${item.dni}-fase-${fIdx}`} className={styles.phasePillChip}>
																{fName}
															</span>
														))
													) : (
														<span className={styles.phasePillChip}>—</span>
													)}
												</div>
											</td>
											<td style={{ textAlign: 'right', fontWeight: 800, color: item.nivel?.color || '#2563eb', fontSize: '0.98rem' }}>
												{item.score} pts
											</td>
											<td style={{ textAlign: 'center' }}>
												<span className={styles.promedioHistoricoBadge}>
													{item.promedioHistorico ?? item.score} pts
												</span>
											</td>
											<td style={{ textAlign: 'center' }}>
												{item.nivel ? (
													<span
														className={styles.levelBadgeMini}
														style={{
															backgroundColor: `${item.nivel.color}20`,
															color: item.nivel.color,
															borderColor: `${item.nivel.color}40`
														}}
													>
														{item.nivel.nivel}
													</span>
												) : '—'}
											</td>
											{handleOpenEvolucion && (
												<td style={{ textAlign: 'center' }}>
													<button
														type="button"
														className={styles.actionBtn}
														onClick={() => handleOpenEvolucion(item.info)}
													>
														<MdHistory /> Historial
													</button>
												</td>
											)}
										</tr>
									))}
								</tbody>
							</table>
						</div>
					</div>
				)}

				{rankingTab === 'ugel' && (
					<div className={styles.ugelTabWrapper}>
						{/* Banner explicativo de metodología del promedio */}
						<div className={styles.ugelMethodologyBanner}>
							<MdInfo className={styles.ugelBannerIcon} />
							<div className={styles.ugelBannerContent}>
								<strong className={styles.ugelBannerTitle}>
									ℹ️ Metodología de Cálculo del Promedio por UGEL:
								</strong>
								<ul className={styles.ugelBannerList}>
									<li>
										<strong>Datos utilizados:</strong> Se consideran los puntajes alcanzados por los especialistas pertenecientes a cada UGEL {selectedRankingFase ? `en la fase seleccionada` : `en su última evaluación`}.
									</li>
									<li>
										<strong>Fórmula aplicada:</strong> <code className={styles.ugelBannerCode}>Promedio UGEL = Suma de Puntajes ÷ Total de Especialistas Evaluados en la UGEL</code>.
									</li>
									<li>
										<strong>Interpretación del Color:</strong> Cada barra adopta el color oficial del Nivel de Logro en la escala (*Satisfactorio, En Proceso, Inicio*) según el rango en el que se ubica el promedio final de la UGEL.
									</li>
								</ul>
							</div>
						</div>

						{/* Sub-selector de tipo de gráfico para UGEL & Niveles */}
						<div className={styles.chartTypeToggleBar}>
							<button
								type="button"
								className={`${styles.chartTypeToggleBtn} ${ugelChartType === 'bar' ? styles.activeChartTypeBtn : ''}`}
								onClick={() => setUgelChartType('bar')}
							>
								<MdBarChart /> Barras: Promedio por UGEL
							</button>
							<button
								type="button"
								className={`${styles.chartTypeToggleBtn} ${ugelChartType === 'pieUgel' ? styles.activeChartTypeBtn : ''}`}
								onClick={() => setUgelChartType('pieUgel')}
							>
								<MdPieChart /> Pie: Por UGEL
							</button>
							<button
								type="button"
								className={`${styles.chartTypeToggleBtn} ${ugelChartType === 'pieNivel' ? styles.activeChartTypeBtn : ''}`}
								onClick={() => setUgelChartType('pieNivel')}
							>
								<MdPieChart /> Pie: Por Nivel de Logro
							</button>
						</div>

						{/* Layout en paralelo: Gráfico (58%) + Panel Lateral (42%) */}
						<div className={styles.ugelFlexContainer}>
							{/* Columna Izquierda: Gráfico por UGEL / Nivel */}
							<div
								className={`${styles.chartContainer} ${selectedUgelForDetail ? styles.ugelChartColSplit : styles.ugelChartColFull}`}
							>
								{ugelChartType === 'bar' && (
									<Bar
										data={getUgelRankingData()}
										plugins={[barSegmentScorePlugin]}
										options={{
											responsive: true,
											maintainAspectRatio: false,
											indexAxis: 'y' as const,
											onHover: (event: any, elements: any[]) => {
												if (event.native && event.native.target) {
													event.native.target.style.cursor = elements && elements.length > 0 ? 'pointer' : 'default';
												}
											},
											onClick: (event: any, elements: any[]) => {
												if (elements && elements.length > 0) {
													const index = elements[0].index;
													const ugelData = rankingByUgel[index];
													if (ugelData) {
														setSelectedUgelForDetail(ugelData.ugel);
													}
												}
											},
											scales: {
												x: {
													beginAtZero: true,
													suggestedMax: maxRankingScaleValue,
													title: { display: true, text: 'Promedio de Puntaje' }
												},
												y: {
													ticks: {
														autoSkip: false,
														font: { size: 11, weight: 'bold' }
													}
												}
											},
											plugins: {
												legend: { display: false },
												title: { display: true, text: 'Ranking Promedio por UGEL (Haz clic en una barra para ver detalle)' },
												tooltip: {
													callbacks: {
														label: (context: any) => {
															const ugelData = rankingByUgel[context.dataIndex];
															if (!ugelData) return '';
															const nivelObj = getNivel(ugelData.promedio);
															return ` Promedio: ${context.raw} pts ${nivelObj ? `[${nivelObj.nivel}]` : ''} | Evaluados: ${ugelData.cantidad} (Clic para desplegar lista)`;
														}
													}
												}
											}
										}}
									/>
								)}

								{ugelChartType === 'pieUgel' && (
									<Pie
										data={getUgelPieData ? getUgelPieData() : { labels: [], datasets: [] }}
										plugins={[pieSegmentLabelPlugin]}
										options={{
											responsive: true,
											maintainAspectRatio: false,
											onHover: (event: any, elements: any[]) => {
												if (event.native && event.native.target) {
													event.native.target.style.cursor = elements && elements.length > 0 ? 'pointer' : 'default';
												}
											},
											onClick: (event: any, elements: any[]) => {
												if (elements && elements.length > 0) {
													const index = elements[0].index;
													const ugelData = rankingByUgel[index];
													if (ugelData) {
														setSelectedUgelForDetail(ugelData.ugel);
													}
												}
											},
											plugins: {
												legend: {
													position: 'right' as const,
													labels: {
														font: { size: 11, weight: 'bold' },
														padding: 10,
														generateLabels: (chart: any) => {
															const data = chart.data;
															if (data.labels.length && data.datasets.length) {
																const dataset = data.datasets[0];
																const total = dataset.data.reduce((a: number, b: number) => a + (b || 0), 0);
																return data.labels.map((label: string, i: number) => {
																	const val = dataset.data[i] || 0;
																	const pct = total > 0 ? ((val / total) * 100).toFixed(1) : '0';
																	return {
																		text: `${label} — ${val} (${pct}%)`,
																		fillStyle: dataset.backgroundColor[i],
																		hidden: isNaN(dataset.data[i]) || chart.getDatasetMeta(0).data[i]?.hidden,
																		index: i
																	};
																});
															}
															return [];
														}
													}
												},
												title: {
													display: true,
													text: 'Distribución de Especialistas por UGEL (Haz clic en una porción para ver detalle)',
													font: { size: 13, weight: 'bold' }
												},
												tooltip: {
													callbacks: {
														label: (context: any) => {
															const ugelData = rankingByUgel[context.dataIndex];
															if (!ugelData) return '';
															const total = rankingByUgel.reduce((sum, u) => sum + u.cantidad, 0);
															const pct = total > 0 ? ((ugelData.cantidad / total) * 100).toFixed(1) : '0';
															const nivelObj = getNivel(ugelData.promedio);
															return ` ${context.label}: ${context.raw} especialistas (${pct}%) | Promedio: ${ugelData.promedio} pts ${nivelObj ? `[${nivelObj.nivel}]` : ''}`;
														}
													}
												}
											}
										}}
									/>
								)}

								{ugelChartType === 'pieNivel' && (
									<Pie
										data={getNivelesPieData ? getNivelesPieData() : { labels: [], datasets: [] }}
										plugins={[pieSegmentLabelPlugin]}
										options={{
											responsive: true,
											maintainAspectRatio: false,
											plugins: {
												legend: {
													position: 'right' as const,
													labels: {
														font: { size: 11, weight: 'bold' },
														padding: 10,
														generateLabels: (chart: any) => {
															const data = chart.data;
															if (data.labels.length && data.datasets.length) {
																const dataset = data.datasets[0];
																const total = dataset.data.reduce((a: number, b: number) => a + (b || 0), 0);
																return data.labels.map((label: string, i: number) => {
																	const val = dataset.data[i] || 0;
																	const pct = total > 0 ? ((val / total) * 100).toFixed(1) : '0';
																	return {
																		text: `${label} — ${val} (${pct}%)`,
																		fillStyle: dataset.backgroundColor[i],
																		hidden: isNaN(dataset.data[i]) || chart.getDatasetMeta(0).data[i]?.hidden,
																		index: i
																	};
																});
															}
															return [];
														}
													}
												},
												title: {
													display: true,
													text: 'Distribución Global de Especialistas por Nivel de Logro',
													font: { size: 13, weight: 'bold' }
												},
												tooltip: {
													callbacks: {
														label: (context: any) => {
															const total = rankingEspecialistas.length;
															const val = context.raw || 0;
															const pct = total > 0 ? ((val / total) * 100).toFixed(1) : '0';
															return ` ${context.label}: ${val} especialistas (${pct}% del total)`;
														}
													}
												}
											}
										}}
									/>
								)}
							</div>

							{/* Columna Derecha: Panel Lateral Deslizable por UGEL */}
							{selectedUgelForDetail && (
								<div className={styles.ugelSidePanel}>
									{/* Cabecera del Panel Lateral */}
									<div className={styles.ugelSidePanelHeader}>
										<div className={styles.ugelSidePanelTitleGroup}>
											<MdLocationOn className={styles.ugelSidePanelIcon} />
											<div className={styles.ugelSidePanelTextWrapper}>
												<h4 className={styles.ugelSidePanelTitle}>
													{selectedUgelForDetail}
												</h4>
												<span className={styles.ugelSidePanelSub}>
													{selectedUgelSummary ? `Promedio: ${selectedUgelSummary.promedio} pts` : ''} ({ugelEspecialistasList.length} especialistas)
												</span>
											</div>
										</div>
										<button
											onClick={() => setSelectedUgelForDetail(null)}
											className={styles.ugelSidePanelClose}
											title="Cerrar panel lateral"
										>
											✕
										</button>
									</div>

									{/* Cuerpo/Tabla del Panel Lateral */}
									<div className={styles.ugelSidePanelBody}>
										{ugelEspecialistasList.length > 0 ? (
											<div className={`${styles.leaderboardWrapper} ${styles.ugelSideTableWrapper}`}>
												<table className={`${styles.table} ${styles.ugelSideTable}`}>
													<thead>
														<tr>
															<th style={{ width: '30px', textAlign: 'center' }}>N°</th>
															<th>Especialista</th>
															<th style={{ textAlign: 'center' }}>Nivel</th>
															<th style={{ textAlign: 'right' }}>Pts</th>
														</tr>
													</thead>
													<tbody>
														{ugelEspecialistasList.map((item, idx) => {
															const latestEval = item.evaluationsSorted[item.evaluationsSorted.length - 1];
															const faseName = latestEval ? getCleanPhaseName((latestEval as any).faseNombre, (latestEval as any).idFase || (latestEval as any).faseActualID) : '—';
															const dateStr = latestEval ? getLocalDateString(latestEval.fechaMonitoreo || latestEval.fechaCreacion) : '—';
															return (
																<tr key={item.dni + idx} className={styles.tableRow}>
																	<td style={{ textAlign: 'center', fontWeight: 700, color: '#64748b' }}>
																		#{idx + 1}
																	</td>
																	<td>
																		<div className={styles.specialistInfo}>
																			<span className={styles.specialistName} style={{ fontSize: '0.8rem' }}>{item.fullName}</span>
																			<span style={{ fontSize: '0.7rem', color: '#64748b' }}>{faseName} ({dateStr})</span>
																		</div>
																	</td>
																	<td style={{ textAlign: 'center' }}>
																		{item.nivel ? (
																			<span
																				className={styles.levelBadgeMini}
																				style={{
																					backgroundColor: `${item.nivel.color}20`,
																					color: item.nivel.color,
																					borderColor: `${item.nivel.color}40`,
																					fontSize: '0.68rem',
																					padding: '0.12rem 0.35rem'
																				}}
																			>
																				{item.nivel.nivel}
																			</span>
																		) : '—'}
																	</td>
																	<td style={{ textAlign: 'right', fontWeight: 800, color: item.nivel?.color || '#2563eb', fontSize: '0.92rem' }}>
																		{item.score}
																	</td>
																</tr>
															);
														})}
													</tbody>
												</table>
											</div>
										) : (
											<div className={styles.emptyState} style={{ padding: '2rem' }}>
												<p className={styles.emptyText}>No se encontraron especialistas en esta UGEL.</p>
											</div>
										)}
									</div>
								</div>
							)}
						</div>
					</div>
				)}
			</div>
		</>
	);
};
