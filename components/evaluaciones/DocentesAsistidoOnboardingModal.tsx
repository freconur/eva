import React, { useState, useEffect, useCallback } from 'react';
import { createPortal } from 'react-dom';
import {
  MdClose,
  MdAutoAwesome,
  MdChevronRight,
  MdChevronLeft,
  MdCheckCircle,
  MdSchool,
  MdLayers,
} from 'react-icons/md';
import {
  RiCompass3Line,
  RiGridLine,
  RiEditBoxLine,
  RiFileChartLine,
  RiArrowRightLine,
  RiInformationLine,
  RiSparklingLine,
  RiBookOpenLine,
  RiCheckLine,
} from 'react-icons/ri';
import { FaGraduationCap, FaChalkboardTeacher, FaStar } from 'react-icons/fa';
import styles from './DocentesAsistidoOnboardingModal.module.css';

export interface DocentesAsistidoOnboardingModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSwitchToAsistido?: () => void;
  onSwitchToClasica?: () => void;
  onStartSpotlightTour?: () => void;
}

export const ASISTIDO_ONBOARDING_STORAGE_KEY = 'eva_onboarding_docente_asistido_v1';

const TOTAL_STEPS = 5;

const DocentesAsistidoOnboardingModal: React.FC<DocentesAsistidoOnboardingModalProps> = ({
  isOpen,
  onClose,
  onSwitchToAsistido,
  onSwitchToClasica,
  onStartSpotlightTour,
}) => {
  const [currentStep, setCurrentStep] = useState<number>(0);
  const [mounted, setMounted] = useState<boolean>(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (isOpen) {
      setCurrentStep(0);
    }
  }, [isOpen]);

  const handleFinish = useCallback(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem(ASISTIDO_ONBOARDING_STORAGE_KEY, 'true');
    }
    onClose();
  }, [onClose]);

  const handleFinishAndOpenAsistido = useCallback(() => {
    handleFinish();
    if (onSwitchToAsistido) {
      onSwitchToAsistido();
    }
  }, [handleFinish, onSwitchToAsistido]);

  const handleFinishAndOpenClasica = useCallback(() => {
    handleFinish();
    if (onSwitchToClasica) {
      onSwitchToClasica();
    }
  }, [handleFinish, onSwitchToClasica]);

  const handleNext = useCallback(() => {
    if (currentStep < TOTAL_STEPS - 1) {
      setCurrentStep((prev) => prev + 1);
    } else {
      handleFinishAndOpenAsistido();
    }
  }, [currentStep, handleFinishAndOpenAsistido]);

  const handlePrev = useCallback(() => {
    if (currentStep > 0) {
      setCurrentStep((prev) => prev - 1);
    }
  }, [currentStep]);

  // Navegación por teclado (Flechas y Escape)
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

  const slidesData = [
    {
      tag: '✨ Nueva Experiencia Docente',
      tagColor: '#0284c7',
      tagBg: '#e0f2fe',
      gradient: 'linear-gradient(135deg, #f0f9ff 0%, #e0f2fe 100%)',
      icon: <RiCompass3Line style={{ color: '#0284c7' }} />,
      title: 'Nuevo: Modo Asistido de Evaluaciones',
      subtitle: 'Encuentra y califica tus evaluaciones en menos pasos',
      description:
        'Hemos creado el Modo Asistido para que no tengas que salir a otras páginas ni recargar la plataforma. Ahora puedes recorrer el camino curricular completo (Nivel → Grado → Área → Evaluación) en una sola pantalla.',
      renderMockup: () => (
        <div className={styles.mockupContainer}>
          <div className={styles.pipelineGrid}>
            <div className={styles.pipelineStep}>
              <span className={styles.pipelineStepNum}>1</span>
              <span className={styles.pipelineStepTitle}>Nivel y Ciclo</span>
              <span className={styles.pipelineStepDesc}>Inicial, Primaria, Secundaria</span>
            </div>
            <div className={styles.pipelineStep}>
              <span className={styles.pipelineStepNum}>2</span>
              <span className={styles.pipelineStepTitle}>Grado Escolar</span>
              <span className={styles.pipelineStepDesc}>Tus aulas asignadas</span>
            </div>
            <div className={styles.pipelineStep}>
              <span className={styles.pipelineStepNum}>3</span>
              <span className={styles.pipelineStepTitle}>Área Curricular</span>
              <span className={styles.pipelineStepDesc}>Matemática, Comunicación...</span>
            </div>
            <div className={styles.pipelineStep}>
              <span className={styles.pipelineStepNum}>4</span>
              <span className={styles.pipelineStepTitle}>Evaluar</span>
              <span className={styles.pipelineStepDesc}>Registro directo de notas</span>
            </div>
          </div>
          <div className={styles.reminderBox}>
            <RiInformationLine style={{ fontSize: '1.2rem', flexShrink: 0 }} />
            <span>
              <strong>Recuerda:</strong> Puedes seguir utilizando la <strong>Vista Clásica</strong> de siempre en cualquier momento.
            </span>
          </div>
          {onStartSpotlightTour && (
            <button
              type="button"
              className={styles.startSpotlightBtn}
              onClick={() => {
                handleFinish();
                onStartSpotlightTour();
              }}
              title="Iniciar tour guiado que señala los botones en pantalla"
            >
              <MdAutoAwesome />
              <span>Señalar los botones reales en mi pantalla (Tour Guiado)</span>
            </button>
          )}
        </div>
      ),
    },
    {
      tag: '🏫 Paso 1: Niveles y Ciclos',
      tagColor: '#4f46e5',
      tagBg: '#eef2ff',
      gradient: 'linear-gradient(135deg, #eef2ff 0%, #e0e7ff 100%)',
      icon: <FaGraduationCap style={{ color: '#4f46e5' }} />,
      title: 'Visualiza evaluaciones activas en tiempo real',
      subtitle: 'Filtros automáticos según tu institución educativa',
      description:
        'En el primer paso, cada nivel educativo y ciclo (Niveles del 1 al 7) muestra insignias con el número exacto de evaluaciones activas listas para calificar. Así sabrás al instante dónde hay tareas pendientes.',
      renderMockup: () => (
        <div className={styles.mockupContainer}>
          <div className={styles.levelsMockList}>
            <div className={styles.levelMockCard}>
              <div className={styles.levelMockInfo}>
                <div className={styles.levelMockIcon} style={{ background: '#ecfdf5', color: '#059669' }}>
                  <FaChalkboardTeacher />
                </div>
                <div>
                  <div className={styles.levelMockName}>Educación Primaria</div>
                  <div className={styles.levelMockSub}>Niveles 3, 4 y 5 (1° a 6° grado)</div>
                </div>
              </div>
              <span className={styles.liveCountBadge}>
                <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#059669' }} />
                4 activas
              </span>
            </div>
            <div className={styles.levelMockCard}>
              <div className={styles.levelMockInfo}>
                <div className={styles.levelMockIcon} style={{ background: '#f5f3ff', color: '#7c3aed' }}>
                  <FaGraduationCap />
                </div>
                <div>
                  <div className={styles.levelMockName}>Educación Secundaria</div>
                  <div className={styles.levelMockSub}>Niveles 6 y 7 (1° a 5° año)</div>
                </div>
              </div>
              <span className={styles.liveCountBadge}>
                <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#059669' }} />
                2 activas
              </span>
            </div>
          </div>
        </div>
      ),
    },
    {
      tag: '🎓 Paso 2: Grados Escolares',
      tagColor: '#059669',
      tagBg: '#ecfdf5',
      gradient: 'linear-gradient(135deg, #ecfdf5 0%, #d1fae5 100%)',
      icon: <MdSchool style={{ color: '#059669' }} />,
      title: 'Tus grados asignados siempre destacados',
      subtitle: 'Acceso directo a las aulas donde impartes clases',
      description:
        'Al seleccionar un ciclo, el Modo Asistido identifica automáticamente tus grados a cargo y los resalta con un distintivo visual. No tienes que rebuscar entre grados ajenos para encontrar tu aula.',
      renderMockup: () => (
        <div className={styles.mockupContainer}>
          <div className={styles.gradeMockGrid}>
            <div className={`${styles.gradeMockItem} ${styles.gradeMockItemHighlighted}`}>
              <div className={styles.gradeMockHead}>
                <span className={styles.gradeMockTitle}>3° Grado Primaria</span>
                <span className={styles.gradeAssignedTag}>
                  <FaStar style={{ fontSize: '0.65rem' }} /> Tu Grado
                </span>
              </div>
              <div className={styles.gradeMockFooter}>
                <span>Estudiantes de 8 años</span>
                <span className={styles.liveCountBadge}>3 activas</span>
              </div>
            </div>
            <div className={styles.gradeMockItem}>
              <div className={styles.gradeMockHead}>
                <span className={styles.gradeMockTitle}>4° Grado Primaria</span>
              </div>
              <div className={styles.gradeMockFooter}>
                <span>Estudiantes de 9 años</span>
                <span style={{ fontSize: '0.72rem', color: '#64748b' }}>Disponible</span>
              </div>
            </div>
          </div>
        </div>
      ),
    },
    {
      tag: '⚡ Pasos 3 y 4: Áreas y Calificación',
      tagColor: '#ea580c',
      tagBg: '#fff7ed',
      gradient: 'linear-gradient(135deg, #fff7ed 0%, #ffedd5 100%)',
      icon: <RiEditBoxLine style={{ color: '#ea580c' }} />,
      title: 'Acceso en 1 clic a "Evaluar Estudiantes"',
      subtitle: 'Registra notas y consulta reportes de inmediato',
      description:
        'Tras elegir la materia (Matemática, Comunicación, etc.), el sistema te muestra las evaluaciones activas. El botón verde te lleva directamente a calificar, y puedes retroceder o saltar entre pasos usando las migas de pan superiores.',
      renderMockup: () => (
        <div className={styles.mockupContainer}>
          <div className={styles.actionCardMock}>
            <div className={styles.actionCardHeader}>
              <span className={styles.actionBreadcrumb}>Primaria &gt; 3° Grado &gt; Matemática</span>
              <span className={styles.liveCountBadge}>Activa</span>
            </div>
            <div className={styles.actionExamTitle}>Evaluación Diagnóstica de Matemática</div>
            <div className={styles.actionButtonsRow}>
              <div className={styles.btnEvaluarPulsing}>
                <RiEditBoxLine />
                <span>Evaluar Estudiantes</span>
              </div>
              <div className={styles.btnReporteMock}>
                <RiFileChartLine />
                <span>Reporte</span>
              </div>
            </div>
          </div>
        </div>
      ),
    },
    {
      tag: '🔄 Tú Tienes el Control',
      tagColor: '#6366f1',
      tagBg: '#f5f3ff',
      gradient: 'linear-gradient(135deg, #f5f3ff 0%, #ede9fe 100%)',
      icon: <RiGridLine style={{ color: '#6366f1' }} />,
      title: '¿Prefieres la vista de siempre? ¡Sigue disponible!',
      subtitle: 'Alterna entre el Modo Asistido y la Vista Clásica cuando quieras',
      description:
        'La Vista Clásica con sus tarjetas tradicionales sigue estando totalmente funcional. Puedes alternar libremente entre ambas vistas con un solo clic en el selector superior. Tus estudiantes, notas y evaluaciones están sincronizados en todo momento.',
      renderMockup: () => (
        <div className={styles.mockupContainer}>
          <div className={styles.classicVsAsistidoMock}>
            <div className={styles.switchDemoBar}>
              <div className={`${styles.switchDemoBtn} ${styles.switchDemoBtnActive}`}>
                <RiCompass3Line />
                <span>Asistido</span>
              </div>
              <div className={`${styles.switchDemoBtn} ${styles.switchDemoBtnClassic}`}>
                <RiGridLine />
                <span>Vista Clásica</span>
              </div>
            </div>
            <div className={styles.modesComparisonGrid}>
              <div className={styles.modeComparisonCard}>
                <div className={styles.modeComparisonTitle} style={{ color: '#0284c7' }}>
                  <RiCompass3Line /> Modo Asistido
                </div>
                <div className={styles.modeComparisonText}>
                  Rápido, en 1 sola pantalla, ideal para calificar directo sin cambiar de URL.
                </div>
              </div>
              <div className={styles.modeComparisonCard}>
                <div className={styles.modeComparisonTitle} style={{ color: '#475569' }}>
                  <RiGridLine /> Vista Clásica
                </div>
                <div className={styles.modeComparisonText}>
                  La navegación tradicional por páginas de nivel que ya conoces y utilizas siempre.
                </div>
              </div>
            </div>
            {onStartSpotlightTour && (
              <button
                type="button"
                className={styles.startSpotlightBtn}
                onClick={() => {
                  handleFinish();
                  onStartSpotlightTour();
                }}
                title="Iniciar tour interactivo que señala los botones en pantalla"
              >
                <MdAutoAwesome />
                <span>Señalar los botones reales en mi pantalla (Tour Guiado)</span>
              </button>
            )}
          </div>
        </div>
      ),
    },
  ];

  const currentSlide = slidesData[currentStep];
  const isLastStep = currentStep === TOTAL_STEPS - 1;

  const modalNode = (
    <div
      className={styles.overlay}
      role="dialog"
      aria-modal="true"
      aria-labelledby="asistido-onboarding-title"
      onClick={handleFinish}
    >
      <div
        className={styles.modalCard}
        onClick={(e) => e.stopPropagation()}
        tabIndex={-1}
      >
        {/* Botón Cerrar (X) */}
        <button
          type="button"
          className={styles.closeButton}
          onClick={handleFinish}
          aria-label="Cerrar guía de novedades"
        >
          <MdClose />
        </button>

        {/* Cabecera Hero */}
        <div
          className={styles.heroBanner}
          style={{ background: currentSlide.gradient }}
        >
          <div className={styles.heroBackgroundPattern} />
          <span
            className={styles.tagPill}
            style={{
              background: currentSlide.tagBg,
              color: currentSlide.tagColor,
            }}
          >
            {currentSlide.tag}
          </span>
          <div className={styles.iconCircle} key={currentStep}>
            {currentSlide.icon}
          </div>
        </div>

        {/* Contenido del paso */}
        <div className={styles.modalBody}>
          <h3 id="asistido-onboarding-title" className={styles.slideTitle}>
            {currentSlide.title}
          </h3>
          <p className={styles.slideSubtitle}>{currentSlide.subtitle}</p>
          <p className={styles.slideDescription}>{currentSlide.description}</p>

          {/* Demostración interactiva */}
          {currentSlide.renderMockup()}
        </div>

        {/* Pie de navegación */}
        <div className={styles.modalFooter}>
          <div className={styles.dotsRow} role="tablist" aria-label="Pasos de la guía">
            {slidesData.map((_, idx) => (
              <button
                key={idx}
                type="button"
                role="tab"
                aria-selected={currentStep === idx}
                aria-label={`Ir al paso ${idx + 1}`}
                onClick={() => setCurrentStep(idx)}
                className={`${styles.dot} ${currentStep === idx ? styles.dotActive : ''}`}
                style={currentStep === idx ? { background: currentSlide.tagColor } : undefined}
              />
            ))}
          </div>

          <div className={styles.navButtons}>
            <button
              type="button"
              className={styles.skipButton}
              onClick={handleFinish}
            >
              Omitir
            </button>

            {currentStep > 0 && (
              <button
                type="button"
                className={styles.prevButton}
                onClick={handlePrev}
              >
                <MdChevronLeft />
                <span>Anterior</span>
              </button>
            )}

            {!isLastStep ? (
              <button
                type="button"
                className={styles.nextButton}
                onClick={handleNext}
                style={{ background: currentSlide.tagColor }}
              >
                <span>Siguiente</span>
                <MdChevronRight />
              </button>
            ) : (
              <>
                <button
                  type="button"
                  className={styles.secondaryClassicBtn}
                  onClick={handleFinishAndOpenClasica}
                  title="Continuar usando la vista clásica tradicional"
                >
                  <RiGridLine />
                  <span>Usar Vista Clásica</span>
                </button>
                <button
                  type="button"
                  className={styles.primaryFinishBtn}
                  onClick={handleFinishAndOpenAsistido}
                  title="Comenzar a explorar en Modo Asistido"
                >
                  <span>Probar Modo Asistido</span>
                  <RiArrowRightLine />
                </button>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );

  const targetPortal =
    typeof document !== 'undefined'
      ? document.getElementById('portal-modal') || document.body
      : null;

  if (!targetPortal) return null;

  return createPortal(modalNode, targetPortal);
};

export default DocentesAsistidoOnboardingModal;
