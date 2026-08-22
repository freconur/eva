import React, { useState, useEffect, useRef } from 'react';
import { RiLoader4Line } from 'react-icons/ri';
import { MdTrendingUp, MdPalette, MdSave, MdCheck } from 'react-icons/md';
import { Line, Radar, Bar, Pie } from 'react-chartjs-2';
import { User } from '@/features/types/types';
import { db } from '@/firebase/firebase.config';
import { doc, onSnapshot } from 'firebase/firestore';
import { getCleanPhaseName, getLocalDateString, getShortDateString } from './utils';
import { getUniquePhases } from '@/features/utils/phaseUtils';
import styles from '../styles.module.css';

interface ModalEvolutionProgressProps {
	showModalEvolucion: boolean;
	onClose: () => void;
	activeTab: 'evolucion' | 'radar' | 'analisis' | 'distribucion' | 'configuracion';
	setActiveTab: (tab: 'evolucion' | 'radar' | 'analisis' | 'distribucion' | 'configuracion') => void;
	loadingHistorial: boolean;
	historialSelected: User[];
	chartData: any;
	chartOptions: any;
	dimensionesEspecialistas: any[];
	getRadarData: () => any;
	getItemAnalysisData: () => any;
	getDistribucionGlobalData: () => any;
	selectedModalEvalId: string;
	setSelectedModalEvalId: (val: string) => void;
	latestEvaluation: any;
	dataEvaluacionDocente: any;
	evaluadosEspecialista?: any[];
	getDisplayCalificacion: (evalu: any) => number;
	evalId?: string;
	saveConfiguracionColoresEspecialistas?: (idEvaluacion: string, configuracionColores: any) => Promise<void>;
	savePaletaGlobalColores?: (palette: string[]) => Promise<void>;
}

export const ModalEvolutionProgress: React.FC<ModalEvolutionProgressProps> = ({
	showModalEvolucion,
	onClose,
	activeTab,
	setActiveTab,
	loadingHistorial,
	historialSelected,
	chartData,
	chartOptions,
	dimensionesEspecialistas,
	getRadarData,
	getItemAnalysisData,
	getDistribucionGlobalData,
	selectedModalEvalId,
	setSelectedModalEvalId,
	latestEvaluation,
	dataEvaluacionDocente,
	evaluadosEspecialista,
	getDisplayCalificacion,
	evalId,
	saveConfiguracionColoresEspecialistas,
	savePaletaGlobalColores,
}) => {
	const [palette, setPalette] = useState<string[]>([
		'#2563eb', '#f59e0b', '#ef4444', '#10b981', '#8b5cf6', '#ec4899', '#06b6d4', '#f97316', '#64748b'
	]);
	const [newColorInput, setNewColorInput] = useState('#3b82f6');

	const [configColores, setConfigColores] = useState<any>({
		reticularByFase: {},
		brechasByFase: {},
		reticular: { color: '#2563eb' },
		brechas: { barColor: '#f59e0b', zeroColor: '#ef4444', warningColor: '#f59e0b' },
		distribucion: {}
	});

	const [isSaving, setIsSaving] = useState(false);
	const [saveSuccess, setSaveSuccess] = useState(false);
	const [openDropdownKey, setOpenDropdownKey] = useState<string | null>(null);
	const dropdownContainerRef = useRef<HTMLDivElement | null>(null);

	useEffect(() => {
		const handleClickOutside = (event: MouseEvent) => {
			if (
				dropdownContainerRef.current &&
				!dropdownContainerRef.current.contains(event.target as Node)
			) {
				setOpenDropdownKey(null);
			}
		};

		if (openDropdownKey) {
			document.addEventListener('mousedown', handleClickOutside);
		}

		return () => {
			document.removeEventListener('mousedown', handleClickOutside);
		};
	}, [openDropdownKey]);

	const renderCompactColorRow = (
		keyId: string,
		label: string,
		currentColor: string,
		onSelect: (color: string) => void
	) => {
		const isOpen = openDropdownKey === keyId;
		return (
			<div className={styles.colorSelectorRowCompact}>
				<label className={styles.colorSelectorLabel}>{label}</label>
				<div
					ref={isOpen ? dropdownContainerRef : null}
					className={styles.colorPickerPopoverWrapper}
				>
					<button
						type="button"
						className={styles.colorBadgeBtn}
						onClick={() => setOpenDropdownKey(isOpen ? null : keyId)}
					>
						<span className={styles.colorBadgeDot} style={{ backgroundColor: currentColor }} />
						<span className={styles.colorBadgeHex}>{currentColor.toUpperCase()}</span>
						<span className={styles.colorBadgeArrow}>{isOpen ? '▲' : '▼'}</span>
					</button>

					{isOpen && (
						<div className={styles.colorPopoverMenu}>
							<span className={styles.popoverHeader}>Seleccionar de la paleta:</span>
							<div className={styles.popoverSwatches}>
								{palette.map((hex, idx) => (
									<button
										key={idx}
										type="button"
										className={`${styles.swatchMini} ${currentColor === hex ? styles.swatchActive : ''}`}
										style={{ backgroundColor: hex }}
										onClick={() => {
											onSelect(hex);
											setOpenDropdownKey(null);
										}}
										title={hex}
									/>
								))}
							</div>
							<div className={styles.popoverCustomRow}>
								<span>Personalizado:</span>
								<input
									type="color"
									value={currentColor}
									onChange={(e) => onSelect(e.target.value)}
									className={styles.colorPickerInput}
								/>
							</div>
						</div>
					)}
				</div>
			</div>
		);
	};

	const phasesList = React.useMemo(() => {
		const uniquePhases = getUniquePhases(dataEvaluacionDocente, evaluadosEspecialista);
		if (uniquePhases && uniquePhases.length > 0) {
			return uniquePhases;
		}
		if (historialSelected && historialSelected.length > 0) {
			const phasesMap = new Map<string, string>();
			historialSelected.forEach((item: any, idx: number) => {
				const name = getCleanPhaseName(item.faseNombre, item.idFase || item.faseActualID) || `Fase ${idx + 1}`;
				const key = item.idFase || item.faseActualID || name;
				if (!phasesMap.has(key)) {
					phasesMap.set(key, name);
				}
			});
			return Array.from(phasesMap.entries()).map(([id, nombre]) => ({ id, nombre }));
		}
		return [
			{ id: 'fase_1', nombre: 'I Tramo' },
			{ id: 'fase_2', nombre: 'II Tramo' },
			{ id: 'fase_3', nombre: 'III Tramo' }
		];
	}, [dataEvaluacionDocente, evaluadosEspecialista, historialSelected]);

	const [hexTextInput, setHexTextInput] = useState('#3B82F6');
	const [hexError, setHexError] = useState('');

	const isValidHex = (hex: string) => {
		return /^#([0-9A-Fa-f]{6}|[0-9A-Fa-f]{3})$/.test(hex);
	};

	// Suscribirse en tiempo real a la paleta de colores global desde Firestore (/configuraciones/paletaColoresEspecialistas)
	useEffect(() => {
		const globalPaletteRef = doc(db, 'configuraciones', 'paletaColoresEspecialistas');
		const unsubscribe = onSnapshot(globalPaletteRef, (docSnap) => {
			if (docSnap.exists()) {
				const data = docSnap.data();
				if (data?.palette && Array.isArray(data.palette) && data.palette.length > 0) {
					setPalette(data.palette);
				}
			}
		});
		return () => unsubscribe();
	}, []);

	useEffect(() => {
		if (dataEvaluacionDocente?.configuracionColores) {
			setConfigColores(dataEvaluacionDocente.configuracionColores);
		}
	}, [dataEvaluacionDocente]);

	const handleColorPickerChange = (val: string) => {
		setNewColorInput(val);
		setHexTextInput(val.toUpperCase());
		setHexError('');
	};

	const handleHexInputChange = (val: string) => {
		let clean = val.trim();
		if (clean && !clean.startsWith('#')) {
			clean = '#' + clean;
		}
		setHexTextInput(clean.toUpperCase());
		if (clean && isValidHex(clean)) {
			setNewColorInput(clean);
			setHexError('');
		}
	};

	const handleAddColorToPalette = async () => {
		let formatted = hexTextInput.trim();
		if (!formatted.startsWith('#')) {
			formatted = '#' + formatted;
		}
		formatted = formatted.toUpperCase();

		if (isValidHex(formatted)) {
			if (!palette.some(h => h.toUpperCase() === formatted)) {
				const updatedPalette = [...palette, formatted];
				setPalette(updatedPalette);
				setConfigColores((prev: any) => ({ ...prev, palette: updatedPalette }));
				setHexError('');
				if (savePaletaGlobalColores) {
					await savePaletaGlobalColores(updatedPalette);
				}
			} else {
				setHexError('El color ya está en la paleta');
			}
		} else {
			setHexError('Formato HEX inválido (ej: #3B82F6)');
		}
	};

	const handleDeleteColorFromPalette = async (hexToRemove: string) => {
		const updatedPalette = palette.filter(hex => hex.toUpperCase() !== hexToRemove.toUpperCase());
		setPalette(updatedPalette);
		setConfigColores((prev: any) => ({ ...prev, palette: updatedPalette }));
		if (savePaletaGlobalColores) {
			await savePaletaGlobalColores(updatedPalette);
		}
	};

	const handleSaveConfig = async () => {
		if (!evalId || !saveConfiguracionColoresEspecialistas) return;
		setIsSaving(true);
		setSaveSuccess(false);
		try {
			const payload = { ...configColores, palette };
			await saveConfiguracionColoresEspecialistas(evalId, payload);
			setSaveSuccess(true);
			setTimeout(() => setSaveSuccess(false), 3000);
		} catch (error) {
			console.error("Error al guardar colores en Firestore:", error);
		} finally {
			setIsSaving(false);
		}
	};

	if (!showModalEvolucion) return null;

	return (
		<div className={styles.modalOverlay} onClick={onClose}>
			<div className={styles.modalContent} onClick={e => e.stopPropagation()}>
				<div className={styles.modalHeader}>
					<h2 className={styles.modalTitle}>Progreso del Especialista</h2>
					<button className={styles.modalClose} onClick={onClose}>×</button>
				</div>
				<div className={styles.modalBody}>
					<div className={styles.modalTabs}>
						<button className={`${styles.tabButton} ${activeTab === 'evolucion' ? styles.activeTab : ''}`} onClick={() => { setActiveTab('evolucion'); setSelectedModalEvalId('all'); }}>Evolución Histórica</button>
						<button className={`${styles.tabButton} ${activeTab === 'radar' ? styles.activeTab : ''}`} onClick={() => { setActiveTab('radar'); setSelectedModalEvalId('all'); }}>Perfil Reticular</button>
						<button className={`${styles.tabButton} ${activeTab === 'analisis' ? styles.activeTab : ''}`} onClick={() => { setActiveTab('analisis'); setSelectedModalEvalId('all'); }}>Brechas Críticas</button>
						<button className={`${styles.tabButton} ${activeTab === 'distribucion' ? styles.activeTab : ''}`} onClick={() => { setActiveTab('distribucion'); setSelectedModalEvalId('all'); }}>Resultados Globales</button>
						<button className={`${styles.tabButton} ${activeTab === 'configuracion' ? styles.activeTab : ''}`} onClick={() => { setActiveTab('configuracion'); setSelectedModalEvalId('all'); }}>⚙️ Configuración</button>
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
								<div style={{ width: '100%' }}>
									{historialSelected.length > 1 && (
										<div className={styles.filterBar}>
											<span className={styles.filterBarLabel}>Filtrar por Etapa / Evaluación:</span>
											<select
												className={styles.toolbarSelect}
												value={selectedModalEvalId}
												onChange={(e) => setSelectedModalEvalId(e.target.value)}
											>
												<option value="all">Todas las etapas (Comparativo)</option>
												<option value="latest">Última Evaluación ({getCleanPhaseName(latestEvaluation?.faseNombre, latestEvaluation?.idFase)}{getShortDateString(latestEvaluation?.fechaMonitoreo || latestEvaluation?.fechaCreacion) ? ` - ${getShortDateString(latestEvaluation?.fechaMonitoreo || latestEvaluation?.fechaCreacion)}` : ''})</option>
												{historialSelected.map((evalu, idx) => (
													<option key={evalu.id || idx} value={evalu.id}>
														{getCleanPhaseName((evalu as any).faseNombre, (evalu as any).idFase || (evalu as any).faseActualID)} ({getShortDateString(evalu.fechaMonitoreo || evalu.fechaCreacion)}) - {getDisplayCalificacion(evalu)} pts
													</option>
												))}
											</select>
										</div>
									)}
									<div className={styles.chartContainer} style={{ minHeight: '350px' }}>
										{(() => {
											const maxScale = (dataEvaluacionDocente?.escala || []).at(-1)?.value || 4;
											const tooltipOptions = {
												backgroundColor: 'rgba(15, 23, 42, 0.95)',
												titleColor: '#f8fafc',
												bodyColor: '#e2e8f0',
												titleFont: { size: 14, weight: 'bold' as const, family: "'Inter', system-ui, sans-serif" },
												bodyFont: { size: 13, family: "'Inter', system-ui, sans-serif" },
												padding: 16,
												cornerRadius: 8,
												displayColors: false,
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
														scales: { r: { min: 0, max: maxScale, ticks: { stepSize: 1 } } },
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
								</div>
							)}
							{activeTab === 'analisis' && (
								<div style={{ width: '100%' }}>
									{historialSelected.length > 1 && (
										<div className={styles.filterBar}>
											<span className={styles.filterBarLabel}>Filtrar por Etapa / Evaluación:</span>
											<select
												className={styles.toolbarSelect}
												value={selectedModalEvalId}
												onChange={(e) => setSelectedModalEvalId(e.target.value)}
											>
												<option value="all">Todas las etapas (Comparativo)</option>
												<option value="latest">Última Evaluación ({getCleanPhaseName(latestEvaluation?.faseNombre, latestEvaluation?.idFase)}{getShortDateString(latestEvaluation?.fechaMonitoreo || latestEvaluation?.fechaCreacion) ? ` - ${getShortDateString(latestEvaluation?.fechaMonitoreo || latestEvaluation?.fechaCreacion)}` : ''})</option>
												{historialSelected.map((evalu, idx) => (
													<option key={evalu.id || idx} value={evalu.id}>
														{getCleanPhaseName((evalu as any).faseNombre, (evalu as any).idFase || (evalu as any).faseActualID)} ({getShortDateString(evalu.fechaMonitoreo || evalu.fechaCreacion)}) - {getDisplayCalificacion(evalu)} pts
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
													scales: {
														x: { min: 0, max: (dataEvaluacionDocente?.escala || []).at(-1)?.value || 4 },
														y: {
															ticks: {
																autoSkip: false,
																font: { size: 12 }
															}
														}
													},
													plugins: {
														title: { display: true, text: selectedModalEvalId === 'all' && historialSelected.length > 1 ? 'Evolución de Brechas Críticas por Etapa' : 'Top 5 Criterios con Menor Puntaje' },
														legend: { display: selectedModalEvalId === 'all' && historialSelected.length > 1, position: 'bottom' },
														tooltip: {
															callbacks: {
																title: (context: any) => {
																	const label = context[0]?.label;
																	return Array.isArray(label) ? label.join(' ') : label;
																}
															}
														}
													}
												}}
											/>
										) : (
											<div className={styles.perfectScoreBanner}>
												<MdTrendingUp className={styles.perfectScoreIcon} />
												<h3 className={styles.perfectScoreTitle}>¡Excelente Desempeño!</h3>
												<p className={styles.perfectScoreText}>El especialista alcanzó el puntaje máximo en todos los criterios evaluados. No se detectaron brechas críticas.</p>
											</div>
										)}
									</div>
								</div>
							)}
							{activeTab === 'distribucion' && (
								<div className={styles.distribucionWrapper}>
									{historialSelected.length > 1 && (
										<div className={styles.filterBar}>
											<span className={styles.filterBarLabel}>Filtrar por Etapa / Evaluación:</span>
											<select
												className={styles.toolbarSelect}
												value={selectedModalEvalId}
												onChange={(e) => setSelectedModalEvalId(e.target.value)}
											>
												<option value="all">Todas las etapas (Comparativo)</option>
												<option value="latest">Última Evaluación ({getCleanPhaseName(latestEvaluation?.faseNombre, latestEvaluation?.idFase)}{getShortDateString(latestEvaluation?.fechaMonitoreo || latestEvaluation?.fechaCreacion) ? ` - ${getShortDateString(latestEvaluation?.fechaMonitoreo || latestEvaluation?.fechaCreacion)}` : ''})</option>
												{historialSelected.map((evalu, idx) => (
													<option key={evalu.id || idx} value={evalu.id}>
														{getCleanPhaseName((evalu as any).faseNombre, (evalu as any).idFase || (evalu as any).faseActualID)} ({getShortDateString(evalu.fechaMonitoreo || evalu.fechaCreacion)}) - {getDisplayCalificacion(evalu)} pts
													</option>
												))}
											</select>
										</div>
									)}
									{(() => {
										const distData = getDistribucionGlobalData();
										if (!distData.pieData) return <p className={styles.emptyText} style={{ textAlign: 'center', marginTop: '2rem' }}>No hay datos suficientes para mostrar.</p>;
										return (
											<div className={styles.distribucionCol}>
												<div className={styles.distribucionSection}>
													<div className={styles.distribucionHeaderGroup}>
														<div className={styles.distribucionBarIndicator}></div>
														<h3 className={styles.distribucionTitle}>Consolidado de Resultados</h3>
													</div>
													<div className={styles.distribucionPieContainer}>
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
												<div className={styles.distribucionStatsGrid}>
													<div className={styles.distribucionStatCard}>
														<span className={styles.distribucionStatLabel}>
															TOTAL PREGUNTAS
														</span>
														<span className={styles.distribucionStatValue}>
															{distData.totalPreguntas}
														</span>
													</div>

													{distData.stats.map((stat: any, idx: number) => {
														const percentage = distData.totalPreguntas > 0 ? Math.round((stat.count / distData.totalPreguntas) * 100) : 0;
														return (
															<div key={idx} className={styles.distribucionStatCard}>
																<div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', marginBottom: '0.35rem' }}>
																	<span style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: stat.color || '#94a3b8', display: 'inline-block', flexShrink: 0 }}></span>
																	<span className={styles.distribucionStatLabel} style={{ marginBottom: 0, lineHeight: 1.2 }}>
																		{stat.label}
																	</span>
																</div>
																<span className={styles.distribucionStatValue}>
																	{stat.count}
																</span>
																<span className={styles.distribucionStatSub}>
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
							{activeTab === 'configuracion' && (
								<div className={styles.configContainer}>
									<h3 className={styles.configSectionTitle}>
										<MdPalette style={{ marginRight: '0.5rem', color: '#2563eb' }} />
										Personalización de Colores de Gráficos
									</h3>
									<p className={styles.configSubtitle}>
										Personaliza los colores para cada gráfico independientemente y guárdalos en la base de datos.
									</p>

									{/* Seccion 1: Gestor de Paleta */}
									<div className={styles.configCard}>
										<h4 className={styles.cardHeaderTitle}>Paleta de Colores Disponibles</h4>
										<p className={styles.cardHeaderSub}>Agrega o elimina colores de tu paleta (formato HEX):</p>
										
										<div className={styles.paletteControls}>
											<div className={styles.colorInputWrapper}>
												<input
													type="color"
													value={newColorInput}
													onChange={(e) => handleColorPickerChange(e.target.value)}
													className={styles.colorPickerInput}
												/>
												<input
													type="text"
													value={hexTextInput}
													onChange={(e) => handleHexInputChange(e.target.value)}
													placeholder="#3B82F6"
													maxLength={7}
													className={styles.hexTextInput}
												/>
											</div>
											<button type="button" className={styles.btnAddColor} onClick={handleAddColorToPalette}>
												+ Agregar a la Paleta
											</button>
										</div>

										{hexError && <span className={styles.hexErrorText}>{hexError}</span>}

										<div className={styles.paletteSwatches}>
											{palette.map((hex, idx) => (
												<div key={idx} className={styles.swatchItemWrapper}>
													<div className={styles.swatchItem} style={{ backgroundColor: hex }} title={hex} />
													<button
														type="button"
														className={styles.swatchDeleteBtn}
														onClick={() => handleDeleteColorFromPalette(hex)}
														title={`Eliminar ${hex} de la paleta`}
													>
														×
													</button>
												</div>
											))}
										</div>
									</div>

									{/* Seccion 2: Colores por Fase (Perfil Reticular & Brechas Críticas) */}
									<div className={styles.configCard}>
										<h4 className={styles.cardHeaderTitle}>1. Colores por Fase / Etapa (Perfil Reticular & Brechas Críticas)</h4>
										<p className={styles.cardHeaderSub}>Asigna el color de cada fase; se aplicará de forma unificada en el perfil reticular y en brechas críticas:</p>

										{phasesList.map((faseItem: { id: string; nombre: string }, pIdx: number) => {
											const currentPhaseColor = configColores?.coloresPorFase?.[faseItem.id] ||
											                          configColores?.coloresPorFase?.[faseItem.nombre] ||
											                          configColores?.coloresPorFase?.[`${pIdx}`] ||
											                          configColores?.reticularByFase?.[faseItem.id] ||
											                          configColores?.brechasByFase?.[faseItem.id] ||
											                          palette[pIdx % palette.length];

											return renderCompactColorRow(
												`phase-${faseItem.id}-${pIdx}`,
												`Fase: ${faseItem.nombre}`,
												currentPhaseColor,
												(color) => setConfigColores({
													...configColores,
													coloresPorFase: {
														...configColores?.coloresPorFase,
														[faseItem.id]: color,
														[faseItem.nombre]: color,
														[`${pIdx}`]: color,
													}
												})
											);
										})}

										{renderCompactColorRow(
											'brechas-zero-score',
											'Color para Criterios en Puntaje Cero (0 pts en Brechas):',
											configColores?.brechas?.zeroColor || '#ef4444',
											(color) => setConfigColores({
												...configColores,
												brechas: { ...configColores?.brechas, zeroColor: color }
											})
										)}
									</div>

									{/* Seccion 3: Resultados Globales */}
									<div className={styles.configCard}>
										<h4 className={styles.cardHeaderTitle}>2. Gráfico de Resultados Globales (Consolidado Pie)</h4>
										<p className={styles.cardHeaderSub}>Asigna un color independiente para cada nivel de logro:</p>

										{(dataEvaluacionDocente?.niveles || [
											{ nivel: 'En inicio', color: '#ef4444' },
											{ nivel: 'En desarrollo', color: '#f59e0b' },
											{ nivel: 'Logro esperado', color: '#3b82f6' },
											{ nivel: 'Logro destacado', color: '#10b981' }
										]).map((n: any, idx: number) => {
											const currentColor = configColores?.distribucion?.[n.nivel] || n.color || ['#ef4444', '#f59e0b', '#3b82f6', '#10b981'][idx % 4];
											return renderCompactColorRow(
												`dist-${n.nivel}-${idx}`,
												`Nivel: ${n.nivel}`,
												currentColor,
												(color) => setConfigColores({
													...configColores,
													distribucion: { ...configColores?.distribucion, [n.nivel]: color }
												})
											);
										})}
									</div>

									{/* Boton Guardar */}
									<div className={styles.configSaveBar}>
										<button
											type="button"
											className={styles.btnSaveConfig}
											onClick={handleSaveConfig}
											disabled={isSaving}
										>
											{isSaving ? <RiLoader4Line className={styles.spinIcon} /> : <MdSave />}
											{isSaving ? 'Guardando...' : 'Guardar Configuración'}
										</button>

										{saveSuccess && (
											<span className={styles.saveSuccessBadge}>
												<MdCheck style={{ marginRight: '0.25rem' }} /> Configuración guardada exitosamente
											</span>
										)}
									</div>
								</div>
							)}
						</div>
					) : (
						<p className={styles.noHistory}>No se encontraron suficientes registros para generar una gráfica.</p>
					)}
				</div>
			</div>
		</div>
	);
};
