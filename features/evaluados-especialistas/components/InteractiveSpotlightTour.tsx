import React, { useState, useEffect } from 'react';
import { MdPalette, MdTouchApp, MdOutlineLanguage, MdBarChart, MdCheckCircle, MdChevronLeft, MdChevronRight, MdClose, MdSave } from 'react-icons/md';
import styles from '../styles.module.css';

interface InteractiveSpotlightTourProps {
	isOpen: boolean;
	onClose: () => void;
	onOpenColorConfig: () => void;
}

export const InteractiveSpotlightTour: React.FC<InteractiveSpotlightTourProps> = ({
	isOpen,
	onClose,
	onOpenColorConfig,
}) => {
	const [currentStep, setCurrentStep] = useState(0);
	const [targetRect, setTargetRect] = useState<DOMRect | null>(null);

	const tourSteps = [
		{
			target: 'header-color-btn',
			title: '1. Acceso a Configuración de Color',
			subtitle: 'Botón directo en la cabecera',
			icon: <MdPalette style={{ color: '#2563eb' }} />,
			color: '#2563eb',
			text: 'Haz clic en este botón ubicado en la cabecera en cualquier momento para abrir el panel de personalización de colores.',
			actionBefore: null,
		},
		{
			target: 'palette-card',
			title: '2. Paleta de Colores Global',
			subtitle: 'Formato HEX y persistencia',
			icon: <MdOutlineLanguage style={{ color: '#10b981' }} />,
			color: '#10b981',
			text: 'Aquí puedes agregar nuevos colores escribiendo su código HEX (ejemplo: #3B82F6) o usando el selector visual. La paleta se comparte de forma global entre todas las evaluaciones.',
			actionBefore: () => onOpenColorConfig(),
		},
		{
			target: 'palette-swatches',
			title: '3. Eliminar Colores de la Paleta (×)',
			subtitle: 'Gestión rápida de muestras',
			icon: <MdTouchApp style={{ color: '#ef4444' }} />,
			color: '#ef4444',
			text: 'Pasa el cursor sobre cualquier círculo de la paleta y haz clic en la "×" roja para eliminar ese color de tu paleta global permanente.',
			actionBefore: () => onOpenColorConfig(),
		},
		{
			target: 'phases-card',
			title: '4. Colores Unificados por Fase',
			subtitle: 'Coherencia en Perfil Reticular y Brechas',
			icon: <MdBarChart style={{ color: '#f59e0b' }} />,
			color: '#f59e0b',
			text: 'Asigna el color a cada tramo/fase de evaluación (ej: I Tramo, II Tramo). Ese mismo color se aplicará de forma unificada tanto en el gráfico Radar como en el gráfico de Brechas Críticas.',
			actionBefore: () => onOpenColorConfig(),
		},
		{
			target: 'popover-badge',
			title: '5. Desplegable Inteligente Popover',
			subtitle: 'Selección limpia y rápida',
			icon: <MdCheckCircle style={{ color: '#06b6d4' }} />,
			color: '#06b6d4',
			text: 'Haz clic en la insignia del color [ ● #HEX ▼ ] para desplegar las muestras de tu paleta. El menú se cierra automáticamente si haces clic en cualquier parte fuera de él.',
			actionBefore: () => onOpenColorConfig(),
		},
		{
			target: 'save-btn',
			title: '6. Guardar Configuración',
			subtitle: 'Persistencia en la base de datos',
			icon: <MdSave style={{ color: '#8b5cf6' }} />,
			color: '#8b5cf6',
			text: 'Una vez elegidos los colores por fase y niveles de logro, haz clic en "Guardar Configuración" para almacenar tus preferencias de forma permanente.',
			actionBefore: () => onOpenColorConfig(),
		},
	];

	useEffect(() => {
		if (isOpen) {
			setCurrentStep(0);
		}
	}, [isOpen]);

	useEffect(() => {
		if (!isOpen) return;

		const stepConfig = tourSteps[currentStep];
		if (stepConfig.actionBefore) {
			stepConfig.actionBefore();
		}

		const updateRect = () => {
			const el = document.querySelector(`[data-tour="${stepConfig.target}"]`);
			if (el) {
				const rect = el.getBoundingClientRect();
				setTargetRect(rect);
			} else {
				setTargetRect(null);
			}
		};

		const timer = setTimeout(() => {
			const el = document.querySelector(`[data-tour="${stepConfig.target}"]`);
			if (el) {
				el.scrollIntoView({ behavior: 'smooth', block: 'center' });
			}
			updateRect();
		}, 200);

		window.addEventListener('resize', updateRect);
		window.addEventListener('scroll', updateRect, true);

		return () => {
			clearTimeout(timer);
			window.removeEventListener('resize', updateRect);
			window.removeEventListener('scroll', updateRect, true);
		};
	}, [currentStep, isOpen]);

	if (!isOpen) return null;

	const currentStepData = tourSteps[currentStep];

	const handleNext = () => {
		if (currentStep < tourSteps.length - 1) {
			setCurrentStep(prev => prev + 1);
		} else {
			handleFinish();
		}
	};

	const handlePrev = () => {
		if (currentStep > 0) {
			setCurrentStep(prev => prev - 1);
		}
	};

	const handleFinish = () => {
		if (typeof window !== 'undefined') {
			localStorage.setItem('eva_onboarding_colors_seen', 'true');
		}
		onClose();
	};

	const getTooltipStyle = (): React.CSSProperties => {
		if (!targetRect) {
			return {
				top: '50%',
				left: '50%',
				transform: 'translate(-50%, -50%)',
			};
		}

		const cardWidth = 360;
		const cardHeight = 250;
		const margin = 16;

		let top: number;
		let left: number;

		const spaceBelow = window.innerHeight - targetRect.bottom;
		const spaceAbove = targetRect.top;

		if (spaceBelow >= cardHeight + margin) {
			top = targetRect.bottom + margin;
		} else if (spaceAbove >= cardHeight + margin) {
			top = targetRect.top - cardHeight - margin;
		} else {
			// Posicionamiento inteligente flotante para tarjetas grandes
			top = Math.max(margin, window.innerHeight - cardHeight - margin - 20);
		}

		left = targetRect.left;
		if (left + cardWidth > window.innerWidth - margin) {
			left = window.innerWidth - cardWidth - margin;
		}
		left = Math.max(margin, left);

		return {
			top: `${top}px`,
			left: `${left}px`,
			transform: 'none',
		};
	};

	return (
		<div className={styles.tourOverlay}>
			{/* Spotlight Highlight Hole */}
			{targetRect && (
				<div
					className={styles.tourSpotlightHole}
					style={{
						top: `${targetRect.top - 6}px`,
						left: `${targetRect.left - 6}px`,
						width: `${targetRect.width + 12}px`,
						height: `${targetRect.height + 12}px`,
						borderColor: currentStepData.color,
					}}
				/>
			)}

			{/* Floating Tooltip Card */}
			<div
				className={styles.tourTooltipCard}
				style={getTooltipStyle()}
			>
				{/* Top Header */}
				<div className={styles.tourHeaderRow}>
					<div className={styles.tourIconBadge} style={{ backgroundColor: `${currentStepData.color}15`, color: currentStepData.color }}>
						{currentStepData.icon}
					</div>
					<div className={styles.tourTitleBox}>
						<span className={styles.tourStepCounter} style={{ color: currentStepData.color }}>
							Paso {currentStep + 1} de {tourSteps.length}
						</span>
						<h4 className={styles.tourStepTitle}>{currentStepData.title}</h4>
					</div>
					<button type="button" className={styles.tourCloseBtn} onClick={handleFinish} title="Cerrar guía">
						<MdClose />
					</button>
				</div>

				{/* Description */}
				<p className={styles.tourStepText}>{currentStepData.text}</p>

				{/* Progress Dots */}
				<div className={styles.tourDotsRow}>
					{tourSteps.map((_, idx) => (
						<button
							key={idx}
							type="button"
							className={`${styles.tourDot} ${idx === currentStep ? styles.tourDotActive : ''}`}
							style={{ backgroundColor: idx === currentStep ? currentStepData.color : '#cbd5e1' }}
							onClick={() => setCurrentStep(idx)}
						/>
					))}
				</div>

				{/* Footer Controls */}
				<div className={styles.tourFooterRow}>
					<button type="button" className={styles.tourSkipBtn} onClick={handleFinish}>
						Omitir
					</button>

					<div className={styles.tourNavGroup}>
						{currentStep > 0 && (
							<button type="button" className={styles.tourPrevBtn} onClick={handlePrev}>
								<MdChevronLeft /> Anterior
							</button>
						)}
						<button
							type="button"
							className={styles.tourNextBtn}
							style={{ backgroundColor: currentStepData.color }}
							onClick={handleNext}
						>
							{currentStep === tourSteps.length - 1 ? '¡Finalizar Guía!' : 'Siguiente'}
							{currentStep < tourSteps.length - 1 && <MdChevronRight />}
						</button>
					</div>
				</div>
			</div>
		</div>
	);
};
