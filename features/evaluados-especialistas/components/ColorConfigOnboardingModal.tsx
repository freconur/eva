import React, { useState, useEffect } from 'react';
import { MdPalette, MdTouchApp, MdOutlineLanguage, MdBarChart, MdCheckCircle, MdChevronLeft, MdChevronRight, MdClose, MdHelpOutline } from 'react-icons/md';
import styles from '../styles.module.css';

interface ColorConfigOnboardingModalProps {
	isOpen: boolean;
	onClose: () => void;
	onOpenColorConfig?: () => void;
}

export const ColorConfigOnboardingModal: React.FC<ColorConfigOnboardingModalProps> = ({
	isOpen,
	onClose,
	onOpenColorConfig,
}) => {
	const [currentStep, setCurrentStep] = useState(0);

	useEffect(() => {
		if (isOpen) {
			setCurrentStep(0);
		}
	}, [isOpen]);

	if (!isOpen) return null;

	const steps = [
		{
			title: '¡Nueva Personalización de Colores!',
			subtitle: 'Crea la identidad visual perfecta para tus analíticas',
			icon: <MdPalette style={{ fontSize: '2.5rem', color: '#2563eb' }} />,
			color: '#2563eb',
			bgGradient: 'linear-gradient(135deg, #eff6ff 0%, #dbeafe 100%)',
			content: 'Hemos añadido una herramienta completa para personalizar los colores de los gráficos de Perfil Reticular, Brechas Críticas y Resultados Globales de forma independiente y persistente.'
		},
		{
			title: 'Acceso Rápido en la Cabecera',
			subtitle: 'Accede al panel de colores con un solo clic',
			icon: <MdTouchApp style={{ fontSize: '2.5rem', color: '#8b5cf6' }} />,
			color: '#8b5cf6',
			bgGradient: 'linear-gradient(135deg, #f5f3ff 0%, #ede9fe 100%)',
			content: 'Encontrarás el nuevo botón "Configuración de color" en la parte superior derecha de la pantalla para abrir el panel de personalización al instante desde cualquier lugar.'
		},
		{
			title: 'Paleta Global Persistente',
			subtitle: 'Guarda tus colores favoritos para todas las evaluaciones',
			icon: <MdOutlineLanguage style={{ fontSize: '2.5rem', color: '#10b981' }} />,
			color: '#10b981',
			bgGradient: 'linear-gradient(135deg, #ecfdf5 0%, #d1fae5 100%)',
			content: 'Agrega códigos HEX o elimina colores con el botón ×. La paleta es global y se guarda automáticamente en la base de datos para utilizarse en todas las evaluaciones.'
		},
		{
			title: 'Colores Unificados por Fase',
			subtitle: 'Mantén la coherencia en todos los gráficos',
			icon: <MdBarChart style={{ fontSize: '2.5rem', color: '#f59e0b' }} />,
			color: '#f59e0b',
			bgGradient: 'linear-gradient(135deg, #fffbeb 0%, #fef3c7 100%)',
			content: 'Asigna el color a cada tramo o fase de la evaluación una sola vez. Ese mismo color se aplicará de forma coherente tanto en el Radar de Perfil Reticular como en Brechas Críticas.'
		},
		{
			title: 'Selectores Inteligentes Popover',
			subtitle: 'Experiencia limpia e intuitiva',
			icon: <MdCheckCircle style={{ fontSize: '2.5rem', color: '#06b6d4' }} />,
			color: '#06b6d4',
			bgGradient: 'linear-gradient(135deg, #ecfeff 0%, #cffafe 100%)',
			content: 'Haz clic en cualquier insignia de color para desplegar las muestras de la paleta. El menú se cierra automáticamente cuando haces clic en cualquier parte fuera de él.'
		}
	];

	const step = steps[currentStep];

	const handleNext = () => {
		if (currentStep < steps.length - 1) {
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

	const handleFinishAndOpenConfig = () => {
		handleFinish();
		if (onOpenColorConfig) {
			onOpenColorConfig();
		}
	};

	return (
		<div className={styles.onboardingOverlay} onClick={onClose}>
			<div className={styles.onboardingModal} onClick={(e) => e.stopPropagation()}>
				{/* Close Button */}
				<button type="button" className={styles.onboardingCloseBtn} onClick={onClose} title="Cerrar guía">
					<MdClose />
				</button>

				{/* Header Illustration / Icon Box */}
				<div className={styles.onboardingHeroBox} style={{ background: step.bgGradient }}>
					<div className={styles.onboardingIconCircle} style={{ borderColor: step.color }}>
						{step.icon}
					</div>
					<span className={styles.onboardingStepBadge} style={{ backgroundColor: step.color }}>
						Paso {currentStep + 1} de {steps.length}
					</span>
				</div>

				{/* Content Body */}
				<div className={styles.onboardingBody}>
					<h3 className={styles.onboardingTitle}>{step.title}</h3>
					<h4 className={styles.onboardingSubtitle}>{step.subtitle}</h4>
					<p className={styles.onboardingText}>{step.content}</p>
				</div>

				{/* Step Indicators */}
				<div className={styles.onboardingDotsRow}>
					{steps.map((_, idx) => (
						<button
							key={idx}
							type="button"
							className={`${styles.onboardingDot} ${idx === currentStep ? styles.onboardingDotActive : ''}`}
							style={{ backgroundColor: idx === currentStep ? step.color : '#cbd5e1' }}
							onClick={() => setCurrentStep(idx)}
							title={`Ir al paso ${idx + 1}`}
						/>
					))}
				</div>

				{/* Footer Controls */}
				<div className={styles.onboardingFooter}>
					<button type="button" className={styles.onboardingSkipBtn} onClick={handleFinish}>
						Omitir
					</button>

					<div className={styles.onboardingNavBtnGroup}>
						{currentStep > 0 && (
							<button type="button" className={styles.onboardingPrevBtn} onClick={handlePrev}>
								<MdChevronLeft style={{ fontSize: '1.2rem' }} /> Anterior
							</button>
						)}

						{currentStep < steps.length - 1 ? (
							<button
								type="button"
								className={styles.onboardingNextBtn}
								style={{ backgroundColor: step.color }}
								onClick={handleNext}
							>
								Siguiente <MdChevronRight style={{ fontSize: '1.2rem' }} />
							</button>
						) : (
							<button
								type="button"
								className={styles.onboardingFinishBtn}
								onClick={handleFinishAndOpenConfig}
							>
								<MdPalette style={{ marginRight: '0.4rem' }} /> ¡Probar Configuración!
							</button>
						)}
					</div>
				</div>
			</div>
		</div>
	);
};
