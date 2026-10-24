import React, { useState, useEffect, useMemo, useRef } from 'react';
import {
	RiSearchLine,
	RiUser3Line,
	RiIdCardLine,
	RiBuilding4Line,
	RiHistoryLine,
	RiCornerDownLeftLine,
	RiCloseLine,
	RiArrowRightLine
} from 'react-icons/ri';
import { User } from '@/features/types/types';
import { regionTexto } from '@/fuctions/regiones';
import styles from '../styles.module.css';

interface ModalBuscadorEspecialistasProps {
	isOpen: boolean;
	onClose: () => void;
	groupedEvaluados: Array<{ info: User; evaluations: User[] }>;
	onSelectEspecialista: (especialista: User) => void;
	getDisplayCalificacion?: (evalu: any) => number;
	targetNoun?: string;
	targetNounSingular?: string;
}

const normalizeText = (text: string = ''): string => {
	return String(text || '')
		.toLowerCase()
		.normalize('NFD')
		.replace(/[\u0300-\u036f]/g, '')
		.replace(/\s+/g, ' ')
		.trim();
};

export const ModalBuscadorEspecialistas: React.FC<ModalBuscadorEspecialistasProps> = ({
	isOpen,
	onClose,
	groupedEvaluados,
	onSelectEspecialista,
	getDisplayCalificacion,
	targetNoun = 'especialistas',
	targetNounSingular = 'Especialista',
}) => {
	const [query, setQuery] = useState('');
	const [selectedIndex, setSelectedIndex] = useState(0);
	const inputRef = useRef<HTMLInputElement>(null);
	const listRef = useRef<HTMLDivElement>(null);

	const singularLower = targetNounSingular.toLowerCase();
	const pluralLower = targetNoun.toLowerCase();

	// Focus input al abrir
	useEffect(() => {
		if (isOpen) {
			setQuery('');
			setSelectedIndex(0);
			const timer = setTimeout(() => {
				inputRef.current?.focus();
				inputRef.current?.select();
			}, 50);
			return () => clearTimeout(timer);
		}
	}, [isOpen]);

	// Filtrado inteligente en memoria multi-término (independiente del orden)
	const filteredResults = useMemo(() => {
		if (!groupedEvaluados || groupedEvaluados.length === 0) return [];
		const cleanQuery = normalizeText(query);
		if (!cleanQuery) return groupedEvaluados;

		const tokens = cleanQuery.split(' ').filter(Boolean);
		if (tokens.length === 0) return groupedEvaluados;

		return groupedEvaluados
			.map(item => {
				const nombres = normalizeText(item.info.nombres || '');
				const apellidos = normalizeText(item.info.apellidos || '');
				const fullNameDirect = `${nombres} ${apellidos}`.trim();
				const fullNameReverse = `${apellidos} ${nombres}`.trim();
				const dni = String(
					item.info.dni ||
					(item.info as any).especialistaDni ||
					(item.info as any).directorDni ||
					(item.info as any).docenteDni ||
					''
				).trim();
				const regText = regionTexto(String(item.info.region));
				const ugel = normalizeText(regText || (item.info as any).ugel || '');

				// Palabras individuales para coincidencias por prefijo y término completo
				const words = `${fullNameDirect} ${ugel}`.split(' ').filter(Boolean);

				let score = 0;
				let allTokensMatched = true;

				// Cada término escrito en la búsqueda DEBE coincidir con alguna propiedad del registro
				for (const token of tokens) {
					let tokenMatched = false;

					// 1. Coincidencia por DNI (si el término es numérico o coincide con el documento)
					if (dni.startsWith(token)) {
						score += 150;
						tokenMatched = true;
					} else if (dni.includes(token)) {
						score += 70;
						tokenMatched = true;
					}

					// 2. Coincidencia con palabras individuales (nombre, apellidos, ugel)
					const exactWord = words.some(w => w === token);
					const prefixWord = words.some(w => w.startsWith(token));
					const substringWord = words.some(w => w.includes(token));

					if (exactWord) {
						score += 100;
						tokenMatched = true;
					} else if (prefixWord) {
						score += 75;
						tokenMatched = true;
					} else if (substringWord) {
						score += 45;
						tokenMatched = true;
					}

					// 3. Coincidencia en cadenas completas
					if (fullNameDirect.includes(token) || fullNameReverse.includes(token)) {
						score += 30;
						tokenMatched = true;
					} else if (ugel.includes(token)) {
						score += 25;
						tokenMatched = true;
					}

					if (!tokenMatched) {
						allTokensMatched = false;
						break;
					}
				}

				if (!allTokensMatched) {
					return { item, score: 0, match: false };
				}

				// Bonus de alta precisión si la frase completa coincide en orden exacto
				if (fullNameDirect.includes(cleanQuery) || fullNameReverse.includes(cleanQuery)) {
					score += 200;
				}
				if (dni.startsWith(cleanQuery)) {
					score += 250;
				}

				return { item, score, match: true };
			})
			.filter(r => r.match)
			.sort((a, b) => b.score - a.score)
			.map(r => r.item);
	}, [groupedEvaluados, query]);

	// Reset de índice al cambiar la búsqueda
	useEffect(() => {
		setSelectedIndex(0);
	}, [query]);

	// Auto-scroll del elemento seleccionado
	useEffect(() => {
		if (!listRef.current) return;
		const activeElement = listRef.current.children[selectedIndex] as HTMLElement;
		if (activeElement) {
			activeElement.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
		}
	}, [selectedIndex]);

	// Atajos de teclado: Flechas, Enter y Escape
	useEffect(() => {
		if (!isOpen) return;

		const handleKeyDown = (e: KeyboardEvent) => {
			if (e.key === 'Escape') {
				e.preventDefault();
				e.stopPropagation();
				e.stopImmediatePropagation();
				onClose();
			} else if (e.key === 'ArrowDown') {
				e.preventDefault();
				setSelectedIndex(prev => (prev < filteredResults.length - 1 ? prev + 1 : 0));
			} else if (e.key === 'ArrowUp') {
				e.preventDefault();
				setSelectedIndex(prev => (prev > 0 ? prev - 1 : Math.max(0, filteredResults.length - 1)));
			} else if (e.key === 'Enter') {
				e.preventDefault();
				if (filteredResults[selectedIndex]) {
					onSelectEspecialista(filteredResults[selectedIndex].info);
					onClose();
				}
			}
		};

		window.addEventListener('keydown', handleKeyDown, true);
		return () => window.removeEventListener('keydown', handleKeyDown, true);
	}, [isOpen, filteredResults, selectedIndex, onSelectEspecialista, onClose]);

	if (!isOpen) return null;

	return (
		<div className={styles.commandPaletteOverlay} onClick={onClose}>
			<div className={styles.commandPaletteModal} onClick={e => e.stopPropagation()}>
				{/* Barra de Búsqueda */}
				<div className={styles.commandPaletteSearchBox}>
					<RiSearchLine className={styles.commandPaletteSearchIcon} />
					<input
						ref={inputRef}
						type="text"
						className={styles.commandPaletteInput}
						placeholder={`Buscar ${singularLower} por nombre, apellido o DNI... (Ctrl+K)`}
						value={query}
						onChange={e => setQuery(e.target.value)}
						onKeyDown={e => {
							if (e.key === 'Escape') {
								e.preventDefault();
								e.stopPropagation();
								e.nativeEvent.stopImmediatePropagation();
								onClose();
							}
						}}
					/>
					{query && (
						<button
							type="button"
							className={styles.commandPaletteClearBtn}
							onClick={() => {
								setQuery('');
								inputRef.current?.focus();
							}}
							title="Limpiar búsqueda"
						>
							<RiCloseLine />
						</button>
					)}
					<button
						type="button"
						className={styles.commandPaletteEscBadge}
						onClick={onClose}
						title="Cerrar buscador"
					>
						Esc
					</button>
				</div>

				{/* Lista de Resultados */}
				<div ref={listRef} className={styles.commandPaletteList}>
					{filteredResults.length === 0 ? (
						<div className={styles.commandPaletteEmpty}>
							<RiSearchLine className={styles.commandPaletteEmptyIcon} />
							<p className={styles.commandPaletteEmptyTitle}>No se encontraron {pluralLower}</p>
							<p className={styles.commandPaletteEmptySubtitle}>
								Intenta con otro término de búsqueda o número de DNI.
							</p>
						</div>
					) : (
						filteredResults.map((group, idx) => {
							const info = group.info;
							const nombre = `${info.nombres || ''} ${info.apellidos || ''}`.trim() || targetNounSingular;
							const dni = info.dni || (info as any).especialistaDni || (info as any).directorDni || (info as any).docenteDni || '—';
							const ugelRaw = info.region !== undefined ? regionTexto(String(info.region)) : (info as any).ugel;
							const ugel = ugelRaw ? `UGEL ${ugelRaw.replace(/^ugel\s+/i, '')}` : '—';
							const isSelected = idx === selectedIndex;
							const evalCount = group.evaluations.length;
							const latestScore = group.evaluations[0] && getDisplayCalificacion
								? getDisplayCalificacion(group.evaluations[0])
								: null;

							return (
								<div
									key={info.dni || info.id || idx}
									className={`${styles.commandPaletteItem} ${isSelected ? styles.commandPaletteItemActive : ''}`}
									onClick={() => {
										onSelectEspecialista(info);
										onClose();
									}}
									onMouseEnter={() => setSelectedIndex(idx)}
								>
									<div className={styles.commandPaletteAvatar}>
										<RiUser3Line />
									</div>
									<div className={styles.commandPaletteInfo}>
										<div className={styles.commandPaletteNameRow}>
											<span className={styles.commandPaletteName}>{nombre}</span>
											{latestScore !== null && (
												<span className={styles.commandPaletteScoreBadge}>
													{latestScore} pts
												</span>
											)}
										</div>
										<div className={styles.commandPaletteBadges}>
											<span className={styles.commandPaletteBadgeDni}>
												<RiIdCardLine /> DNI: {dni}
											</span>
											<span className={styles.commandPaletteBadgeUgel}>
												<RiBuilding4Line /> {ugel}
											</span>
											<span className={styles.commandPaletteBadgeCount}>
												<RiHistoryLine /> {evalCount} {evalCount === 1 ? 'evaluación' : 'evaluaciones'}
											</span>
										</div>
									</div>
									<div className={styles.commandPaletteAction}>
										<span className={styles.commandPaletteSelectHint}>
											{isSelected ? (
												<>
													<span>Abrir</span>
													<RiCornerDownLeftLine className={styles.commandPaletteEnterIcon} />
												</>
											) : (
												<RiArrowRightLine />
											)}
										</span>
									</div>
								</div>
							);
						})
					)}
				</div>

				{/* Pie de Página con Atajos */}
				<div className={styles.commandPaletteFooter}>
					<div className={styles.commandPaletteShortcuts}>
						<span className={styles.commandShortcut}>
							<kbd>↑</kbd> <kbd>↓</kbd> Navegar
						</span>
						<span className={styles.commandShortcut}>
							<kbd>↵</kbd> Seleccionar
						</span>
						<span className={styles.commandShortcut}>
							<kbd>Esc</kbd> Cerrar
						</span>
					</div>
					<div className={styles.commandPaletteCount}>
						{query.trim() ? (
							`${filteredResults.length} de ${groupedEvaluados.length} ${groupedEvaluados.length === 1 ? singularLower : pluralLower}`
						) : (
							`${filteredResults.length} ${filteredResults.length === 1 ? singularLower : pluralLower}`
						)}
					</div>
				</div>
			</div>
		</div>
	);
};
export default ModalBuscadorEspecialistas;
