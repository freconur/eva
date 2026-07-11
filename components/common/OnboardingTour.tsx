import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import styles from './OnboardingTour.module.css';

export interface OnboardingStep {
    targetId: string;
    title: string;
    content: string;
    position?: 'top' | 'bottom' | 'left' | 'right';
}

interface OnboardingTourProps {
    steps: OnboardingStep[];
    isOpen: boolean;
    onClose: () => void;
}

const OnboardingTour: React.FC<OnboardingTourProps> = ({ steps, isOpen, onClose }) => {
    const [currentStep, setCurrentStep] = useState(0);
    const [coords, setCoords] = useState<{ top: number; left: number; width: number; height: number } | null>(null);
    const [portalContainer, setPortalContainer] = useState<HTMLElement | null>(null);

    useEffect(() => {
        if (typeof window !== 'undefined') {
            setPortalContainer(document.getElementById('portal-modal'));
        }
    }, []);

    // Scroll into view exactly once when step changes to prevent scroll loops
    useEffect(() => {
        if (!isOpen) return;

        const targetId = steps[currentStep]?.targetId;
        if (!targetId) return;

        const el = document.getElementById(targetId);
        if (el) {
            el.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
    }, [currentStep, isOpen, steps]);

    // Track coordinates relative to viewport (using position: fixed for 100% layout accuracy)
    useEffect(() => {
        if (!isOpen) {
            setCurrentStep(0);
            setCoords(null);
            return;
        }

        const targetId = steps[currentStep]?.targetId;
        if (!targetId) {
            setCoords(null);
            return;
        }

        const updateCoords = () => {
            const el = document.getElementById(targetId);
            if (el) {
                const rect = el.getBoundingClientRect();
                setCoords({
                    top: rect.top, // Viewport-relative
                    left: rect.left,
                    width: rect.width,
                    height: rect.height,
                });
            } else {
                setCoords(null);
            }
        };

        // Delay measurement slightly to allow smooth scroll animation to finish
        const timer = setTimeout(updateCoords, 300);
        window.addEventListener('resize', updateCoords);
        window.addEventListener('scroll', updateCoords, { passive: true });

        return () => {
            clearTimeout(timer);
            window.removeEventListener('resize', updateCoords);
            window.removeEventListener('scroll', updateCoords);
        };
    }, [currentStep, isOpen, steps]);

    if (!isOpen || !portalContainer) return null;

    const step = steps[currentStep];
    const isModal = !step.targetId || !coords;

    // Calculate dynamic position for the tooltip on desktop
    const getTooltipStyle = (): React.CSSProperties => {
        if (isModal || !coords) return {};

        const spacing = 16;
        const position = step.position || 'bottom';
        const tooltipWidth = 352; // 22rem = 352px

        if (position === 'bottom') {
            return {
                position: 'fixed',
                top: coords.top + coords.height + spacing,
                left: Math.max(16, Math.min(window.innerWidth - tooltipWidth - 16, coords.left + (coords.width - tooltipWidth) / 2)),
            };
        }
        if (position === 'top') {
            return {
                position: 'fixed',
                bottom: window.innerHeight - coords.top + spacing,
                left: Math.max(16, Math.min(window.innerWidth - tooltipWidth - 16, coords.left + (coords.width - tooltipWidth) / 2)),
            };
        }
        return {
            position: 'fixed',
            top: Math.max(16, Math.min(window.innerHeight - 200, coords.top)),
            left: coords.left + coords.width + spacing,
        };
    };

    const handleNext = () => {
        if (currentStep < steps.length - 1) {
            setCurrentStep((prev) => prev + 1);
        } else {
            onClose();
        }
    };

    const handlePrev = () => {
        if (currentStep > 0) {
            setCurrentStep((prev) => prev - 1);
        }
    };

    return createPortal(
        <>
            {/* Overlay backdrop */}
            <div className={styles.overlay} onClick={onClose} />

            {/* Highlighted region */}
            {!isModal && coords && (
                <div
                    className={styles.highlightRing}
                    style={{
                        top: coords.top - 6,
                        left: coords.left - 6,
                        width: coords.width + 12,
                        height: coords.height + 12,
                    }}
                />
            )}

            {/* Guided Tour Tooltip */}
            <div
                className={isModal ? styles.tooltipModal : styles.tooltip}
                style={getTooltipStyle()}
            >
                <h4 className={styles.title}>{step.title}</h4>
                <p className={styles.content}>{step.content}</p>
                <div className={styles.footer}>
                    <span className={styles.stepsIndicator}>
                        {currentStep + 1} de {steps.length}
                    </span>
                    <div className={styles.actions}>
                        <button type="button" onClick={onClose} className={styles.skipBtn}>
                            Omitir
                        </button>
                        {currentStep > 0 && (
                            <button type="button" onClick={handlePrev} className={styles.prevBtn}>
                                Atrás
                            </button>
                        )}
                        <button type="button" onClick={handleNext} className={styles.nextBtn}>
                            {currentStep === steps.length - 1 ? 'Terminar' : 'Siguiente'}
                        </button>
                    </div>
                </div>
            </div>
        </>,
        portalContainer
    );
};

export default OnboardingTour;
