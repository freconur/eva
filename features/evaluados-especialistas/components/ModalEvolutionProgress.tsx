import React, { useState, useEffect, useRef, useMemo } from 'react';
import {
	RiLoader4Line,
	RiUser3Line,
	RiBuilding4Line,
	RiIdCardLine,
	RiHistoryLine,
	RiSearchLine,
	RiCameraLine
} from 'react-icons/ri';
import { MdTrendingUp, MdPalette, MdSave, MdCheck } from 'react-icons/md';
import { Line, Radar, Bar, Pie } from 'react-chartjs-2';
import { User } from '@/features/types/types';
import { db } from '@/firebase/firebase.config';
import { doc, onSnapshot } from 'firebase/firestore';
import { regionTexto } from '@/fuctions/regiones';
import { getCleanPhaseName, getLocalDateString, getShortDateString, copyChartElementToClipboard, linePointScorePlugin } from './utils';
import { getUniquePhases } from '@/features/utils/phaseUtils';
import styles from '../styles.module.css';

interface ModalEvolutionProgressProps {
	showModalEvolucion: boolean;
	onClose: () => void;
	activeTab: 'evolucion' | 'radar' | 'analisis' | 'distribucion' | 'configuracion';
	setActiveTab: (tab: 'evolucion' | 'radar' | 'analisis' | 'distribucion' | 'configuracion') => void;
	loadingHistorial: boolean;
	historialSelected: User[];
	selectedEspecialista?: User | null;
	targetNoun?: string;
	targetNounSingular?: string;
	chartData: any;
	chartOptions: any;
	dimensionesEspecialistas: any[];
	getRadarData: () => any;
	getItemAnalysisData: () => any;
	getDistribucionGlobalData: () => any;
	selectedModalEvalId?: string;
	setSelectedModalEvalId?: (val: string) => void;
	selectedModalEvalIds?: string[];
	setSelectedModalEvalIds?: (val: string[]) => void;
	togglePhaseSelection?: (phaseId: string) => void;
	selectAllPhases?: () => void;
	isAllPhasesSelected?: boolean;
	latestEvaluation: any;
	dataEvaluacionDocente: any;
	evaluadosEspecialista?: any[];
	getDisplayCalificacion: (evalu: any) => number;
	evalId?: string;
	saveConfiguracionColoresEspecialistas?: (idEvaluacion: string, configuracionColores: any) => Promise<void>;
	savePaletaGlobalColores?: (palette: string[]) => Promise<void>;
	onOpenSearch?: () => void;
	isSearchOpen?: boolean;
}

export const ModalEvolutionProgress: React.FC<ModalEvolutionProgressProps> = ({
	showModalEvolucion,
	onClose,
	activeTab,
	setActiveTab,
	loadingHistorial,
	historialSelected,
	selectedEspecialista,
	targetNoun = 'especialistas',
	targetNounSingular = 'Especialista',
	chartData,
	chartOptions,
	dimensionesEspecialistas,
	getRadarData,
	getItemAnalysisData,
	getDistribucionGlobalData,
	selectedModalEvalId = 'all',
	setSelectedModalEvalId,
	selectedModalEvalIds = ['all'],
	setSelectedModalEvalIds,
	togglePhaseSelection,
	selectAllPhases,
	isAllPhasesSelected,
	latestEvaluation,
	dataEvaluacionDocente,
	evaluadosEspecialista,
	getDisplayCalificacion,
	evalId,
	saveConfiguracionColoresEspecialistas,
	savePaletaGlobalColores,
	onOpenSearch,
	isSearchOpen,
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

	const [isCopying, setIsCopying] = useState<string | null>(null);
	const [copiedTab, setCopiedTab] = useState<string | null>(null);

	const chartRefEvolucion = useRef<HTMLDivElement | null>(null);
	const chartRefRadar = useRef<HTMLDivElement | null>(null);
	const chartRefAnalisis = useRef<HTMLDivElement | null>(null);
	const chartRefDistribucion = useRef<HTMLDivElement | null>(null);

	const handleCopyChart = async (tabKey: string, ref: React.RefObject<HTMLDivElement | null>, title: string) => {
		if (!ref.current || isCopying) return;
		setIsCopying(tabKey);
		const ok = await copyChartElementToClipboard(ref.current, title);
		if (ok) {
			setCopiedTab(tabKey);
			setTimeout(() => setCopiedTab(null), 2500);
		}
		setIsCopying(null);
	};

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
						data-tour="popover-badge"
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

	const especialistaData = selectedEspecialista || (historialSelected && historialSelected.length > 0 ? historialSelected[0] : null);

	const especialistaNombre = useMemo(() => {
		if (!especialistaData) return targetNounSingular;
		const nombres = especialistaData.nombres || '';
		const apellidos = especialistaData.apellidos || '';
		const full = `${nombres} ${apellidos}`.trim();
		return full || targetNounSingular;
	}, [especialistaData, targetNounSingular]);

	const especialistaDni = useMemo(() => {
		if (!especialistaData) return '';
		return (
			especialistaData.dni ||
			(especialistaData as any).especialistaDni ||
			(especialistaData as any).directorDni ||
			(especialistaData as any).docenteDni ||
			''
		);
	}, [especialistaData]);

	const especialistaUgel = useMemo(() => {
		if (!especialistaData) return '—';
		const reg = especialistaData.region;
		if (reg !== undefined && reg !== null && String(reg).trim() !== '') {
			const ugelNombre = regionTexto(String(reg));
			if (ugelNombre) return `UGEL ${ugelNombre.replace(/^ugel\s+/i, '')}`;
		}
		if ((especialistaData as any).ugel) {
			const raw = (especialistaData as any).ugel;
			return `UGEL ${String(raw).replace(/^ugel\s+/i, '')}`;
		}
		return '—';
	}, [especialistaData]);

	const allSelected = useMemo(() => {
		if (isAllPhasesSelected !== undefined) return isAllPhasesSelected;
		if (selectedModalEvalIds && selectedModalEvalIds.length > 0) {
			return (
				selectedModalEvalIds.includes('all') ||
				(historialSelected.length > 0 && selectedModalEvalIds.length === historialSelected.length)
			);
		}
		return selectedModalEvalId === 'all';
	}, [isAllPhasesSelected, selectedModalEvalIds, selectedModalEvalId, historialSelected]);

	const activeIds = useMemo(() => {
		if (selectedModalEvalIds && selectedModalEvalIds.length > 0) {
			if (selectedModalEvalIds.includes('all')) {
				return (historialSelected || []).map(e => e.id).filter(Boolean) as string[];
			}
			return selectedModalEvalIds.filter(Boolean);
		}
		if (selectedModalEvalId === 'all') {
			return (historialSelected || []).map(e => e.id).filter(Boolean) as string[];
		}
		return selectedModalEvalId ? [selectedModalEvalId] : [];
	}, [selectedModalEvalIds, selectedModalEvalId, historialSelected]);

	const handleTogglePhase = (id: string) => {
		if (togglePhaseSelection) {
			togglePhaseSelection(id);
		} else if (setSelectedModalEvalId) {
			setSelectedModalEvalId(id);
		}
	};

	const handleSelectAllPhases = () => {
		if (selectAllPhases) {
			selectAllPhases();
		} else if (setSelectedModalEvalId) {
			setSelectedModalEvalId('all');
		}
	};

	const fasesEvaluadas = useMemo(() => {
		if (!historialSelected || historialSelected.length === 0) return [];

		return historialSelected.map((evalu, idx) => {
			const faseName = getCleanPhaseName((evalu as any).faseNombre, (evalu as any).idFase || (evalu as any).faseActualID);
			const dateStr = getShortDateString(evalu.fechaMonitoreo || evalu.fechaCreacion);
			const score = getDisplayCalificacion(evalu);
			const isCurrent = !allSelected && Boolean(evalu.id && activeIds.includes(evalu.id));

			return {
				id: evalu.id || String(idx),
				faseName,
				dateStr,
				score,
				isCurrent,
				evalu
			};
		});
	}, [historialSelected, allSelected, activeIds, getDisplayCalificacion]);

	const selectedPhaseNames = useMemo(() => {
		if (allSelected) return [];
		const setIds = new Set(activeIds);
		return (historialSelected || [])
			.filter(e => e.id && setIds.has(e.id))
			.map(e => getCleanPhaseName((e as any).faseNombre, (e as any).idFase || (e as any).faseActualID));
	}, [allSelected, activeIds, historialSelected]);

	const selectedPhasesSubtitle = useMemo(() => {
		if (allSelected) return '';
		if (selectedPhaseNames.length === 1) return selectedPhaseNames[0];
		return selectedPhaseNames.join(' + ');
	}, [allSelected, selectedPhaseNames]);

	const faseDistribucionTitle = useMemo(() => {
		if (allSelected) {
			if (historialSelected && historialSelected.length === 1) {
				const item = historialSelected[0];
				return getCleanPhaseName((item as any).faseNombre, (item as any).idFase || (item as any).faseActualID) || 'I TRAMO';
			}
			return 'CONSOLIDADO HISTÓRICO';
		}
		if (selectedPhaseNames.length === 1) {
			return selectedPhaseNames[0];
		}
		if (selectedPhaseNames.length > 0) {
			return `CONSOLIDADO (${selectedPhaseNames.join(' + ')})`;
		}
		return 'CONSOLIDADO HISTÓRICO';
	}, [allSelected, selectedPhaseNames, historialSelected]);

	// Cerrar modal con la tecla Escape, abrir buscador con Ctrl+K y bloquear scroll de fondo
	useEffect(() => {
		if (!showModalEvolucion) return;

		const handleKeyDown = (event: KeyboardEvent) => {
			if (isSearchOpen) return;
			if (event.key === 'Escape') {
				onClose();
			} else if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 'k') {
				event.preventDefault();
				onOpenSearch?.();
			}
		};

		window.addEventListener('keydown', handleKeyDown);
		const originalOverflow = document.body.style.overflow;
		document.body.style.overflow = 'hidden';

		return () => {
			window.removeEventListener('keydown', handleKeyDown);
			document.body.style.overflow = originalOverflow;
		};
	}, [showModalEvolucion, onClose, onOpenSearch, isSearchOpen]);

	if (!showModalEvolucion) return null;

	return (
		<div className={`${styles.modalOverlay} ${styles.modalOverlayFullScreen}`} onClick={onClose}>
			<div className={`${styles.modalContent} ${styles.modalContentFullScreen}`} onClick={e => e.stopPropagation()}>
				<div className={`${styles.modalHeader} ${styles.modalHeaderFullScreen}`}>
					<div className={styles.modalHeaderLeftGroup}>
						<h2 className={styles.modalTitle}>Progreso del {targetNounSingular}</h2>
						<span className={styles.escBadge} title="Presiona la tecla Escape para cerrar">Esc</span>
					</div>
					<div className={styles.modalHeaderActions}>
						{onOpenSearch && (
							<button
								type="button"
								className={styles.quickSearchTriggerBtn}
								onClick={onOpenSearch}
								title={`Buscar otro ${targetNounSingular.toLowerCase()} (Ctrl + K)`}
							>
								<RiSearchLine />
								<span>Buscar {targetNounSingular.toLowerCase()}</span>
								<kbd className={styles.quickSearchKbd}>Ctrl K</kbd>
							</button>
						)}
						<button
							type="button"
							className={styles.modalCloseBtnFull}
							onClick={onClose}
							title="Cerrar modal (Esc)"
						>
							<span>Cerrar</span>
							<span className={styles.modalCloseX}>✕</span>
						</button>
					</div>
				</div>
				<div className={`${styles.modalBody} ${styles.modalBodyFullScreen}`}>
					{/* Tarjeta Compacta de Información del Especialista y Fases */}
					{especialistaData && (
						<div className={styles.specialistInfoCardCompact}>
							<div className={styles.specialistTopBar}>
								<div className={styles.specialistIdentity}>
									<div className={styles.specialistAvatarSmall}>
										<RiUser3Line />
									</div>
									<span className={styles.specialistFullName}>
										{especialistaNombre}
									</span>
									<div className={styles.specialistBadgesList}>
										{especialistaDni && (
											<span className={styles.specialistBadgeDni} title="Documento Nacional de Identidad">
												<RiIdCardLine /> DNI: <strong>{especialistaDni}</strong>
											</span>
										)}
										<span className={styles.specialistBadgeUgel} title="UGEL a la que pertenece">
											<RiBuilding4Line /> <strong>{especialistaUgel}</strong>
										</span>
										<span className={styles.specialistBadgeCount} title="Total de evaluaciones en su historial">
											<RiHistoryLine /> {historialSelected.length} {historialSelected.length === 1 ? 'evaluación registrada' : 'evaluaciones registradas'}
										</span>
									</div>
								</div>

								{/* Fases en las que ha sido evaluado */}
								{fasesEvaluadas.length > 0 && (
									<div className={styles.fasesInlineGroup}>
										<span className={styles.fasesInlineLabel}>Fases evaluadas:</span>
										<div className={styles.fasesChipsList}>
											{historialSelected.length > 1 && (
												<button
													type="button"
													className={`${styles.faseChipBtn} ${allSelected ? styles.faseChipBtnActive : ''}`}
													onClick={handleSelectAllPhases}
													title="Ver comparativo de todas las fases"
												>
													Todas las fases
												</button>
											)}
											{fasesEvaluadas.map((f) => (
												<button
													key={f.id}
													type="button"
													className={`${styles.faseChipBtn} ${f.isCurrent ? styles.faseChipBtnActive : ''}`}
													onClick={() => handleTogglePhase(f.id)}
													title={f.isCurrent ? `Deseleccionar ${f.faseName}` : `Seleccionar ${f.faseName}${f.dateStr ? ` (${f.dateStr})` : ''}`}
												>
													<span>{f.faseName}</span>
													<span className={styles.faseChipScore}>{f.score} pts</span>
												</button>
											))}
										</div>
									</div>
								)}
							</div>
						</div>
					)}
					<div className={styles.modalTabs}>
						<button className={`${styles.tabButton} ${activeTab === 'evolucion' ? styles.activeTab : ''}`} onClick={() => setActiveTab('evolucion')}>Evolución Histórica</button>
						<button className={`${styles.tabButton} ${activeTab === 'radar' ? styles.activeTab : ''}`} onClick={() => setActiveTab('radar')}>Perfil Reticular</button>
						<button className={`${styles.tabButton} ${activeTab === 'analisis' ? styles.activeTab : ''}`} onClick={() => setActiveTab('analisis')}>Brechas Críticas</button>
						<button className={`${styles.tabButton} ${activeTab === 'distribucion' ? styles.activeTab : ''}`} onClick={() => setActiveTab('distribucion')}>Resultados Globales</button>
						<button className={`${styles.tabButton} ${activeTab === 'configuracion' ? styles.activeTab : ''}`} onClick={() => setActiveTab('configuracion')}>⚙️ Configuración</button>
					</div>

					{loadingHistorial ? (
						<div className={styles.modalLoading}>
							<RiLoader4Line className={styles.loadingIcon} />
							<span>Cargando historial...</span>
						</div>
					) : historialSelected.length > 0 ? (
						<div className={styles.tabContent}>
							{activeTab === 'evolucion' && (
								<div className={styles.chartConstrainedWrapper}>
									<div className={styles.chartTabToolbar}>
										<span className={styles.chartTabToolbarTitle}>Evolución del Puntaje en el Tiempo</span>
										<button
											type="button"
											className={`${styles.copyChartBtn} ${copiedTab === 'evolucion' ? styles.copyChartBtnSuccess : ''}`}
											onClick={() => handleCopyChart('evolucion', chartRefEvolucion, 'Evolución Histórica')}
											disabled={isCopying === 'evolucion'}
											title="Copiar imagen del gráfico al portapapeles para pegar (Ctrl + V)"
										>
											{copiedTab === 'evolucion' ? (
												<>
													<MdCheck />
													<span>¡Copiado!</span>
												</>
											) : isCopying === 'evolucion' ? (
												<>
													<RiLoader4Line className={styles.spinningIcon} />
													<span>Capturando...</span>
												</>
											) : (
												<>
													<RiCameraLine />
													<span>Copiar captura</span>
												</>
											)}
										</button>
									</div>
									<div ref={chartRefEvolucion} className={styles.chartCaptureContainer}>
										<h3 className={styles.chartSpecialistTitle}>
											Evolución de {especialistaNombre.toUpperCase()}{selectedPhasesSubtitle ? ` — ${selectedPhasesSubtitle.toUpperCase()}` : ''}
										</h3>
										<div className={styles.chartContainer} style={{ minHeight: '380px', position: 'relative' }}>
											{!allSelected && selectedPhasesSubtitle && (
												<div style={{
													position: 'absolute',
													top: '10px',
													left: '50%',
													transform: 'translateX(-50%)',
													background: '#eff6ff',
													color: '#1d4ed8',
													padding: '0.35rem 0.85rem',
													borderRadius: '8px',
													fontWeight: '600',
													fontSize: '0.82rem',
													border: '1px solid #bfdbfe',
													zIndex: 10,
													boxShadow: '0 1px 3px rgba(37,99,235,0.08)'
												}}>
													{selectedPhaseNames.length > 1 ? `Fases seleccionadas: ${selectedPhasesSubtitle}` : `Fase seleccionada: ${selectedPhasesSubtitle}`}
												</div>
											)}
											<Line data={chartData} options={chartOptions} plugins={[linePointScorePlugin]} />
										</div>
									</div>
								</div>
							)}
							{activeTab === 'radar' && (
								<div style={{ width: '100%' }}>
									<div className={styles.chartTabToolbar}>
										<span className={styles.chartTabToolbarTitle}>Perfil Reticular</span>
										<button
											type="button"
											className={`${styles.copyChartBtn} ${copiedTab === 'radar' ? styles.copyChartBtnSuccess : ''}`}
											onClick={() => handleCopyChart('radar', chartRefRadar, 'Perfil Reticular')}
											disabled={isCopying === 'radar'}
											title="Copiar imagen del gráfico al portapapeles para pegar (Ctrl + V)"
										>
											{copiedTab === 'radar' ? (
												<>
													<MdCheck />
													<span>¡Copiado!</span>
												</>
											) : isCopying === 'radar' ? (
												<>
													<RiLoader4Line className={styles.spinningIcon} />
													<span>Capturando...</span>
												</>
											) : (
												<>
													<RiCameraLine />
													<span>Copiar captura</span>
												</>
											)}
										</button>
									</div>
									<div ref={chartRefRadar} className={styles.chartCaptureContainer}>
										<h3 className={styles.chartSpecialistTitle}>
											Perfil Reticular de {especialistaNombre.toUpperCase()}
										</h3>
										<div className={styles.chartContainer} style={{ minHeight: '380px' }}>
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
								</div>
							)}
							{activeTab === 'analisis' && (
								<div className={styles.chartConstrainedWrapper}>
									<div className={styles.chartTabToolbar}>
										<span className={styles.chartTabToolbarTitle}>Brechas Críticas</span>
										<button
											type="button"
											className={`${styles.copyChartBtn} ${copiedTab === 'analisis' ? styles.copyChartBtnSuccess : ''}`}
											onClick={() => handleCopyChart('analisis', chartRefAnalisis, 'Brechas Críticas')}
											disabled={isCopying === 'analisis'}
											title="Copiar imagen del gráfico al portapapeles para pegar (Ctrl + V)"
										>
											{copiedTab === 'analisis' ? (
												<>
													<MdCheck />
													<span>¡Copiado!</span>
												</>
											) : isCopying === 'analisis' ? (
												<>
													<RiLoader4Line className={styles.spinningIcon} />
													<span>Capturando...</span>
												</>
											) : (
												<>
													<RiCameraLine />
													<span>Copiar captura</span>
												</>
											)}
										</button>
									</div>
									<div ref={chartRefAnalisis} className={styles.chartCaptureContainer}>
										<h3 className={styles.chartSpecialistTitle}>
											Brechas Críticas de {especialistaNombre.toUpperCase()}
										</h3>
										<div className={styles.chartContainer} style={{ minHeight: '380px' }}>
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
													<p className={styles.perfectScoreText}>El {targetNounSingular.toLowerCase()} alcanzó el puntaje máximo en todos los criterios evaluados. No se detectaron brechas críticas.</p>
												</div>
											)}
										</div>
									</div>
								</div>
							)}
							{activeTab === 'distribucion' && (
								<div className={styles.chartConstrainedWrapper}>
									<div className={styles.chartTabToolbar}>
										<span className={styles.chartTabToolbarTitle}>Resultados Globales</span>
										<button
											type="button"
											className={`${styles.copyChartBtn} ${copiedTab === 'distribucion' ? styles.copyChartBtnSuccess : ''}`}
											onClick={() => handleCopyChart('distribucion', chartRefDistribucion, 'Resultados Globales')}
											disabled={isCopying === 'distribucion'}
											title="Copiar imagen del consolidado al portapapeles para pegar (Ctrl + V)"
										>
											{copiedTab === 'distribucion' ? (
												<>
													<MdCheck />
													<span>¡Copiado!</span>
												</>
											) : isCopying === 'distribucion' ? (
												<>
													<RiLoader4Line className={styles.spinningIcon} />
													<span>Capturando...</span>
												</>
											) : (
												<>
													<RiCameraLine />
													<span>Copiar captura</span>
												</>
											)}
										</button>
									</div>
									{(() => {
										const distData = getDistribucionGlobalData();
										if (!distData.pieData) return <p className={styles.emptyText} style={{ textAlign: 'center', marginTop: '2rem' }}>No hay datos suficientes para mostrar.</p>;
										return (
											<div ref={chartRefDistribucion} className={styles.distribucionCol}>
												<h3 className={styles.distribucionFaseTitle}>
													{faseDistribucionTitle}
												</h3>
												<div className={styles.distribucionContentRow}>
													<div className={styles.distribucionPieContainer}>
														<Pie
															data={distData.pieData}
															options={{
																plugins: {
																	legend: { display: false },
																	title: { display: false }
																}
															}}
														/>
													</div>
													<div className={styles.distribucionStatsGrid}>
														<div
															className={styles.distribucionStatCard}
															style={{
																border: '1px solid #2563eb',
																backgroundColor: '#ffffff'
															}}
														>
															<div className={styles.statLabelGroup}>
																<span className={styles.statColorDot} style={{ backgroundColor: '#2563eb' }} />
																<span className={styles.distribucionStatLabel}>
																	TOTAL PREGUNTAS
																</span>
															</div>
															<span className={styles.distribucionStatValue}>
																{distData.totalPreguntas}
															</span>
															<span className={styles.distribucionStatSub}>
																100%
															</span>
														</div>

														{distData.stats.map((stat: any, idx: number) => {
															const percentage = distData.totalPreguntas > 0 ? Math.round((stat.count / distData.totalPreguntas) * 100) : 0;
															const cardColor = stat.color || '#94a3b8';

															return (
																<div
																	key={idx}
																	className={styles.distribucionStatCard}
																	style={{
																		border: `1px solid ${cardColor}`,
																		backgroundColor: '#ffffff'
																	}}
																>
																	<div
																		className={styles.statLabelGroup}
																		title={stat.label}
																	>
																		<span className={styles.statColorDot} style={{ backgroundColor: cardColor }} />
																		<span className={styles.distribucionStatLabel}>
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
									<div className={styles.configCard} data-tour="palette-card">
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

										<div className={styles.paletteSwatches} data-tour="palette-swatches">
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
									<div className={styles.configCard} data-tour="phases-card">
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
											data-tour="save-btn"
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
