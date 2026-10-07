import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { createPortal } from 'react-dom';
import {
  MdClose,
  MdAutoAwesome,
  MdCheckCircle,
  MdChevronRight,
  MdChevronLeft,
  MdLightbulb,
} from 'react-icons/md';
import {
  RiCompass3Line,
  RiGridLine,
  RiEditBoxLine,
  RiSparklingLine,
} from 'react-icons/ri';
import { FaGraduationCap } from 'react-icons/fa';
import styles from './DocentesAsistidoSpotlightTour.module.css';

export interface DocentesAsistidoSpotlightTourProps {
  isOpen: boolean;
  onClose: () => void;
  nivelesViewMode: 'flujo' | 'clasica';
  setNivelesViewMode: (mode: 'flujo' | 'clasica') => void;
}

export const ASISTIDO_SPOTLIGHT_STORAGE_KEY = 'eva_spotlight_docente_asistido_v1';

interface TourStep {
  target?: string;
  title: string;
  badge: string;
  badgeColor: string;
  icon: React.ReactNode;
  instruction: string;
  whatItDoes: string;
  whatIsNew: string;
  pointerText?: string;
  preferredPosition?: 'top' | 'bottom' | 'left' | 'right';
  actionBefore?: () => void;
}

const DocentesAsistidoSpotlightTour: React.FC<DocentesAsistidoSpotlightTourProps> = ({
  isOpen,
  onClose,
  nivelesViewMode,
  setNivelesViewMode,
}) => {
  const [currentStep, setCurrentStep] = useState<number>(0);
  const [targetRect, setTargetRect] = useState<DOMRect | null>(null);
  const [mounted, setMounted] = useState<boolean>(false);
  const cardRef = useRef<HTMLDivElement>(null);
  const [cardHeight, setCardHeight] = useState<number>(360);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (cardRef.current) {
      setCardHeight(cardRef.current.offsetHeight);
    }
  }, [currentStep, isOpen]);

  const tourSteps: TourStep[] = useMemo(
    () => [
      {
        title: 'Tour de Botones: Modo Asistido',
        badge: '✨ BIENVENIDA',
        badgeColor: '#0284c7',
        icon: <MdAutoAwesome style={{ color: '#0284c7' }} />,
        instruction:
          'A continuación te señalaremos directamente en tu pantalla la ubicación de cada botón, para qué sirve y qué tiene de nuevo cada uno.',
        whatItDoes:
          'Te enseñará a moverte con soltura entre el nuevo Modo Asistido y la Vista Clásica tradicional que siempre has usado.',
        whatIsNew:
          'Indicadores visuales en pantalla con foco para que ubiques los controles al instante.',
      },
      {
        target: 'tour-btn-asistido',
        title: '1. Botón "Asistido"',
        badge: '🧭 MODO ASISTIDO',
        badgeColor: '#0284c7',
        icon: <RiCompass3Line style={{ color: '#0284c7' }} />,
        pointerText: '👆 Botón Asistido (Nueva Funcionalidad)',
        instruction:
          'Haz clic en este botón para entrar al flujo guiado en una sola pantalla.',
        whatItDoes:
          'Te guía paso a paso: selecciona el Nivel educativo → Grado escolar → Área curricular → Evaluaciones activas, todo sin recargar la página.',
        whatIsNew:
          'Navegación interactiva por pasos, sin esperas y sin tener que cambiar de URL.',
        preferredPosition: 'bottom',
      },
      {
        target: 'tour-btn-clasica',
        title: '2. Botón "Vista Clásica"',
        badge: '🗂️ VISTA DE SIEMPRE',
        badgeColor: '#6366f1',
        icon: <RiGridLine style={{ color: '#6366f1' }} />,
        pointerText: '👆 Botón Vista Clásica (La de siempre)',
        instruction:
          'Haz clic aquí en cualquier momento si deseas volver a la vista tradicional por tarjetas.',
        whatItDoes:
          'Muestra las tarjetas grandes habituales de Inicial, Primaria y Secundaria como siempre las has utilizado.',
        whatIsNew:
          '¡Importante! La vista clásica sigue 100% activa. No se ha eliminado nada y puedes alternar entre ambas vistas cuando quieras.',
        preferredPosition: 'bottom',
      },
      {
        target: 'tour-btn-como-funciona',
        title: '3. Botón "¿Cómo funciona?"',
        badge: '💡 AYUDA Y GUÍA',
        badgeColor: '#ca8a04',
        icon: <MdAutoAwesome style={{ color: '#ca8a04' }} />,
        pointerText: '👆 Botón de Ayuda y Tour',
        instruction:
          'Haz clic en este botón cada vez que quieras volver a activar este tour guiado o repasar la funcionalidad.',
        whatItDoes:
          'Vuelve a abrir las explicaciones y señalar los botones en pantalla con un solo clic.',
        whatIsNew:
          'Acceso permanente para que nunca te quedes con dudas sobre el funcionamiento.',
        preferredPosition: 'bottom',
      },
      {
        target: 'tour-asistido-contenedor',
        title: '4. Niveles Educativos y Ciclos',
        badge: '🏫 PASO 1 DEL FLUJO',
        badgeColor: '#059669',
        icon: <FaGraduationCap style={{ color: '#059669' }} />,
        pointerText: '👈 Explora por Niveles y Ciclos',
        instruction:
          'Haz clic en cualquiera de las tarjetas de ciclo (Niveles del 1 al 7) para avanzar al siguiente paso de grados.',
        whatItDoes:
          'Despliega los grados correspondientes al ciclo elegido, filtrados por tu institución educativa.',
        whatIsNew:
          'Insignias verdes ("🟢 X activas") que te avisan en vivo cuántas evaluaciones esperan calificación antes de entrar.',
        preferredPosition: 'top',
        actionBefore: () => {
          if (nivelesViewMode !== 'flujo') setNivelesViewMode('flujo');
        },
      },
      {
        title: '5. Botones "Evaluar" y "Reporte"',
        badge: '⚡ ACCIÓN DIRECTA',
        badgeColor: '#16a34a',
        icon: <RiEditBoxLine style={{ color: '#16a34a' }} />,
        instruction:
          'Al llegar al paso de evaluaciones, encontrarás los botones de acción inmediata de cada examen.',
        whatItDoes:
          'El botón verde "Evaluar Estudiantes" abre la matriz para calificar a tus alumnos al instante. El botón azul "Reporte" muestra las estadísticas del examen.',
        whatIsNew:
          'Acceso directo en 1 solo clic sin pantallas intermedias.',
      },
      {
        title: '¡Todo listo para evaluar!',
        badge: '🎉 GUÍA COMPLETADA',
        badgeColor: '#10b981',
        icon: <MdCheckCircle style={{ color: '#10b981' }} />,
        instruction:
          'Ya conoces qué hace cada botón y qué hay de nuevo. Recuerda que puedes alternar entre Modo Asistido y Vista Clásica en cualquier momento.',
        whatItDoes:
          'Tus evaluaciones, notas y estudiantes siempre están disponibles y sincronizados.',
        whatIsNew:
          'Mayor rapidez y comodidad en tu trabajo diario.',
      },
    ],
    [nivelesViewMode, setNivelesViewMode]
  );

  useEffect(() => {
    if (isOpen) {
      setCurrentStep(0);
    }
  }, [isOpen]);

  // Ejecutar acción antes del paso y medir posición del elemento objetivo
  useEffect(() => {
    if (!isOpen) {
      setTargetRect(null);
      return;
    }

    const step = tourSteps[currentStep];
    if (step?.actionBefore) {
      step.actionBefore();
    }

    const updateRect = () => {
      if (!step?.target) {
        setTargetRect(null);
        return;
      }

      const el = document.querySelector(`[data-tour="${step.target}"]`);
      if (el) {
        const rect = el.getBoundingClientRect();
        setTargetRect(rect);
      } else {
        setTargetRect(null);
      }
    };

    const timer = setTimeout(() => {
      if (step?.target) {
        const el = document.querySelector(`[data-tour="${step.target}"]`);
        if (el) {
          el.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
      }
      updateRect();
    }, 220);

    window.addEventListener('resize', updateRect);
    window.addEventListener('scroll', updateRect, { passive: true });

    return () => {
      clearTimeout(timer);
      window.removeEventListener('resize', updateRect);
      window.removeEventListener('scroll', updateRect);
    };
  }, [currentStep, isOpen, tourSteps]);

  const handleFinish = useCallback(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem(ASISTIDO_SPOTLIGHT_STORAGE_KEY, 'true');
    }
    onClose();
  }, [onClose]);

  const handleNext = useCallback(() => {
    if (currentStep < tourSteps.length - 1) {
      setCurrentStep((prev) => prev + 1);
    } else {
      handleFinish();
    }
  }, [currentStep, tourSteps.length, handleFinish]);

  const handlePrev = useCallback(() => {
    if (currentStep > 0) {
      setCurrentStep((prev) => prev - 1);
    }
  }, [currentStep]);

  // Teclado
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        handleFinish();
      } else if (e.key === 'ArrowRight') {
        handleNext();
      } else if (e.key === 'ArrowLeft') {
        handlePrev();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, handleNext, handlePrev, handleFinish]);

  if (!isOpen || !mounted) return null;

  const currentStepData = tourSteps[currentStep];
  const isCenteredModal = !currentStepData.target || !targetRect;

  const getTooltipStyle = (): React.CSSProperties => {
    if (isCenteredModal || !targetRect) {
      return {
        top: '50%',
        left: '50%',
        transform: 'translate(-50%, -50%)',
      };
    }

    const currentCardHeight = cardRef.current?.offsetHeight || cardHeight || 360;
    const cardWidth = Math.min(400, typeof window !== 'undefined' ? window.innerWidth - 32 : 400);
    const margin = 16;
    const position = currentStepData.preferredPosition || 'bottom';

    let top = 0;
    let left = 0;

    // Si el elemento objetivo ocupa más del 40% del alto visible (ej. contenedor general de niveles):
    // Ubicar la tarjeta de forma segura en la parte inferior de la pantalla sin salirse
    if (typeof window !== 'undefined' && targetRect.height > window.innerHeight * 0.4) {
      top = window.innerHeight - currentCardHeight - margin;
      left = (window.innerWidth - cardWidth) / 2;
    } else if (position === 'bottom') {
      top = targetRect.bottom + margin;
      left = targetRect.left + (targetRect.width - cardWidth) / 2;
      if (typeof window !== 'undefined' && top + currentCardHeight > window.innerHeight - margin) {
        top = Math.max(margin, targetRect.top - currentCardHeight - margin);
      }
    } else if (position === 'top') {
      top = targetRect.top - currentCardHeight - margin;
      left = targetRect.left + (targetRect.width - cardWidth) / 2;
      if (top < margin) {
        top = targetRect.bottom + margin;
      }
    } else if (position === 'right') {
      left = targetRect.right + margin;
      top = targetRect.top + (targetRect.height - currentCardHeight) / 2;
      if (typeof window !== 'undefined' && left + cardWidth > window.innerWidth - margin) {
        left = targetRect.left - cardWidth - margin;
      }
    } else {
      left = targetRect.left - cardWidth - margin;
      top = targetRect.top + (targetRect.height - currentCardHeight) / 2;
    }

    if (typeof window !== 'undefined') {
      left = Math.max(margin, Math.min(window.innerWidth - cardWidth - margin, left));
      top = Math.max(margin, Math.min(window.innerHeight - currentCardHeight - margin, top));
    }

    return {
      top: `${top}px`,
      left: `${left}px`,
      transform: 'none',
    };
  };

  const tourContent = (
    <div className={styles.tourOverlay} onClick={handleFinish}>
      {isCenteredModal && <div className={styles.modalBackdrop} />}

      {!isCenteredModal && targetRect && (
        <div
          className={styles.spotlightHole}
          style={{
            top: `${Math.max(0, targetRect.top - 6)}px`,
            left: `${Math.max(0, targetRect.left - 6)}px`,
            width: `${targetRect.width + 12}px`,
            height: `${targetRect.height + 12}px`,
            borderColor: currentStepData.badgeColor,
          }}
        >
          {currentStepData.pointerText && (
            <div className={styles.pointerBadge}>
              {currentStepData.pointerText}
            </div>
          )}
        </div>
      )}

      <div
        ref={cardRef}
        className={styles.tooltipCard}
        style={getTooltipStyle()}
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-labelledby="spotlight-step-title"
      >
        <div className={styles.cardHeader}>
          <div className={styles.headerLeft}>
            <div
              className={styles.iconCircle}
              style={{
                background: `${currentStepData.badgeColor}15`,
                color: currentStepData.badgeColor,
              }}
            >
              {currentStepData.icon}
            </div>
            <div className={styles.headerTitleBox}>
              <span
                className={styles.stepCounterBadge}
                style={{ color: currentStepData.badgeColor }}
              >
                Paso {currentStep + 1} de {tourSteps.length} • {currentStepData.badge}
              </span>
              <h4 id="spotlight-step-title" className={styles.stepTitle}>
                {currentStepData.title}
              </h4>
            </div>
          </div>
          <button
            type="button"
            onClick={handleFinish}
            className={styles.closeButton}
            title="Cerrar tour de botones"
            aria-label="Cerrar tour de botones"
          >
            <MdClose />
          </button>
        </div>

        <p className={styles.stepInstruction}>
          {currentStepData.instruction}
        </p>

        <div className={styles.whatItDoesBox}>
          <span className={styles.whatItDoesLabel}>
            <MdLightbulb style={{ color: '#ca8a04' }} />
            ¿Qué hace este botón?
          </span>
          <p className={styles.whatItDoesText}>
            {currentStepData.whatItDoes}
          </p>
        </div>

        <div className={styles.whatIsNewBox}>
          <span className={styles.whatIsNewLabel}>
            <RiSparklingLine style={{ color: '#16a34a' }} />
            ¿Qué es lo nuevo?
          </span>
          <p className={styles.whatIsNewText}>
            {currentStepData.whatIsNew}
          </p>
        </div>

        <div className={styles.dotsRow}>
          {tourSteps.map((_, idx) => (
            <button
              key={idx}
              type="button"
              className={`${styles.dot} ${idx === currentStep ? styles.dotActive : ''}`}
              style={{
                backgroundColor:
                  idx === currentStep ? currentStepData.badgeColor : '#cbd5e1',
              }}
              onClick={() => setCurrentStep(idx)}
              title={`Ir al paso ${idx + 1}`}
              aria-label={`Paso ${idx + 1}`}
            />
          ))}
        </div>

        <div className={styles.cardFooter}>
          <button
            type="button"
            onClick={handleFinish}
            className={styles.skipButton}
          >
            Omitir
          </button>

          <div className={styles.navGroup}>
            {currentStep > 0 && (
              <button
                type="button"
                onClick={handlePrev}
                className={styles.prevButton}
              >
                <MdChevronLeft style={{ fontSize: '1.1rem' }} />
                <span>Anterior</span>
              </button>
            )}

            {currentStep < tourSteps.length - 1 ? (
              <button
                type="button"
                onClick={handleNext}
                className={styles.nextButton}
                style={{ backgroundColor: currentStepData.badgeColor }}
              >
                <span>Siguiente</span>
                <MdChevronRight style={{ fontSize: '1.1rem' }} />
              </button>
            ) : (
              <button
                type="button"
                onClick={handleFinish}
                className={styles.finishButton}
              >
                <MdCheckCircle style={{ fontSize: '1.1rem' }} />
                <span>¡Entendido!</span>
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );

  const portalContainer =
    typeof document !== 'undefined'
      ? document.getElementById('portal-modal') || document.body
      : null;

  if (!portalContainer) return null;

  return createPortal(tourContent, portalContainer);
};

export default DocentesAsistidoSpotlightTour;
