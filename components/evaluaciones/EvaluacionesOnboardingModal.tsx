import React, { useState, useEffect, useCallback } from 'react'
import { createPortal } from 'react-dom'
import {
  MdClose,
  MdAutoAwesome,
  MdContentCopy,
  MdLayers,
  MdAccountTree,
  MdChevronRight,
  MdChevronLeft,
  MdCheckCircle,
  MdArrowForward,
  MdViewSidebar
} from 'react-icons/md'
import styles from './EvaluacionesOnboardingModal.module.css'

export interface EvaluacionesOnboardingModalProps {
  isOpen: boolean
  onClose: () => void
  onSwitchToPanelView?: () => void
}

export const ONBOARDING_STORAGE_KEY = 'eva_onboarding_evaluaciones_v1'

const EvaluacionesOnboardingModal: React.FC<EvaluacionesOnboardingModalProps> = ({
  isOpen,
  onClose,
  onSwitchToPanelView,
}) => {
  const [currentStep, setCurrentStep] = useState<number>(0)
  const [mounted, setMounted] = useState<boolean>(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  useEffect(() => {
    if (isOpen) {
      setCurrentStep(0)
    }
  }, [isOpen])

  const handleFinish = useCallback(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem(ONBOARDING_STORAGE_KEY, 'true')
    }
    onClose()
  }, [onClose])

  const handleFinishAndOpenPanel = useCallback(() => {
    handleFinish()
    if (onSwitchToPanelView) {
      onSwitchToPanelView()
    }
  }, [handleFinish, onSwitchToPanelView])

  const handleNext = useCallback(() => {
    if (currentStep < 3) {
      setCurrentStep(prev => prev + 1)
    } else {
      handleFinish()
    }
  }, [currentStep, handleFinish])

  const handlePrev = useCallback(() => {
    if (currentStep > 0) {
      setCurrentStep(prev => prev - 1)
    }
  }, [currentStep])

  // Keyboard navigation (Arrow keys and Escape)
  useEffect(() => {
    if (!isOpen) return

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        handleFinish()
      } else if (e.key === 'ArrowRight') {
        handleNext()
      } else if (e.key === 'ArrowLeft') {
        handlePrev()
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [isOpen, handleNext, handlePrev, handleFinish])

  if (!isOpen || !mounted) return null

  const stepsData = [
    {
      tag: '✨ Novedades en la Plataforma',
      tagColor: '#4f46e5',
      tagBg: '#eef2ff',
      gradient: 'linear-gradient(135deg, #eef2ff 0%, #e0e7ff 100%)',
      icon: <MdAutoAwesome style={{ color: '#4f46e5' }} />,
      title: 'Nuevas herramientas para gestionar tus evaluaciones',
      subtitle: 'Mayor rapidez administrativa y una navegación más cómoda',
      description:
        'Hemos añadido dos potentes funcionalidades diseñadas para ahorrarte tiempo en cada periodo lectivo: la duplicación de exámenes y la nueva vista de panel.',
      renderMockup: () => (
        <div className={styles.featuresListGrid}>
          <div className={styles.featureCardItem}>
            <div className={styles.featureCardIconBox} style={{ background: '#eff6ff', color: '#2563eb' }}>
              <MdContentCopy />
            </div>
            <div className={styles.featureCardInfo}>
              <span className={styles.featureCardTitle}>1. Clonar por Unidad</span>
              <span className={styles.featureCardDesc}>Duplica una evaluación con todas sus preguntas y claves</span>
            </div>
          </div>
          <div className={styles.featureCardItem}>
            <div className={styles.featureCardIconBox} style={{ background: '#f5f3ff', color: '#7c3aed' }}>
              <MdLayers />
            </div>
            <div className={styles.featureCardInfo}>
              <span className={styles.featureCardTitle}>2. Clonar por Lote</span>
              <span className={styles.featureCardDesc}>Selecciona varias evaluaciones y duplícalas en bloque</span>
            </div>
          </div>
          <div className={styles.featureCardItem}>
            <div className={styles.featureCardIconBox} style={{ background: '#e0f2fe', color: '#0284c7' }}>
              <MdAccountTree />
            </div>
            <div className={styles.featureCardInfo}>
              <span className={styles.featureCardTitle}>3. Nueva Vista de Panel</span>
              <span className={styles.featureCardDesc}>Explora por Inicial, Primaria y Secundaria al 100% de ancho</span>
            </div>
          </div>
        </div>
      ),
    },
    {
      tag: '📋 Clonación por Unidad',
      tagColor: '#2563eb',
      tagBg: '#eff6ff',
      gradient: 'linear-gradient(135deg, #eff6ff 0%, #dbeafe 100%)',
      icon: <MdContentCopy style={{ color: '#2563eb' }} />,
      title: 'Duplica evaluaciones completas en un solo clic',
      subtitle: 'Copia íntegramente preguntas, alternativas y respuestas',
      description:
        'En la columna "Acciones" de cada evaluación encontrarás el botón Duplicar. El sistema clona el contenido y reemplaza inteligentemente el mes en el nombre (ej. "1ero matemática marzo" cambia automáticamente a "octubre").',
      renderMockup: () => (
        <div className={styles.mockCopyRow}>
          <div className={styles.mockCopyLeft}>
            <div className={styles.mockCopyOriginalName}>
              <span>1ero Primaria - Matemática</span>
              <span className={styles.mockBadgeOld}>Marzo 2026</span>
            </div>
            <div className={styles.mockCopyBadges}>
              <span style={{ fontSize: '0.72rem', color: '#64748b' }}>Sugerencia al clonar:</span>
              <span className={styles.mockBadgeNew}>1ero Primaria - Matemática Octubre</span>
            </div>
          </div>
          <div className={styles.mockCopyBtnPulsing} title="Botón de duplicar">
            <MdContentCopy />
            <span>Duplicar</span>
          </div>
        </div>
      ),
    },
    {
      tag: '🚀 Clonación Masiva por Lote',
      tagColor: '#7c3aed',
      tagBg: '#f5f3ff',
      gradient: 'linear-gradient(135deg, #f5f3ff 0%, #ede9fe 100%)',
      icon: <MdLayers style={{ color: '#7c3aed' }} />,
      title: 'Duplicación en bloque con barra de progreso',
      subtitle: 'Migra o crea múltiples exámenes en simultáneo',
      description:
        'Usa las casillas (checkboxes) a la izquierda de la tabla para marcar evaluaciones. Se activará la barra flotante inferior para duplicarlas en conjunto, seleccionando el mes de destino y observando el progreso exacto en vivo.',
      renderMockup: () => (
        <div>
          <div className={styles.mockBulkBar}>
            <div className={styles.mockBulkInfo}>
              <span className={styles.mockBulkCountBadge}>4</span>
              <span>evaluaciones seleccionadas</span>
            </div>
            <div className={styles.mockBulkActionBtn}>
              <MdContentCopy />
              <span>Duplicar seleccionadas (4)</span>
            </div>
          </div>
          <div className={styles.mockProgressBarTrack}>
            <div className={styles.mockProgressBarFill} />
          </div>
          <div className={styles.mockProgressLabel}>
            <span>Progreso de clonación concurrente</span>
            <span style={{ color: '#10b981', fontWeight: 700 }}>100% completado</span>
          </div>
        </div>
      ),
    },
    {
      tag: '📂 Vista de Panel por Grados',
      tagColor: '#0284c7',
      tagBg: '#e0f2fe',
      gradient: 'linear-gradient(135deg, #e0f2fe 0%, #bae6fd 100%)',
      icon: <MdAccountTree style={{ color: '#0284c7' }} />,
      title: 'Explorador estructurado de niveles y grados',
      subtitle: 'Mayor concentración y 100% de ancho disponible',
      description:
        'Cambia entre "Tabla" y "Panel" desde la barra superior. Navega cómodamente por Inicial, Primaria y Secundaria. Puedes colapsar el explorador lateral con el botón de flecha para que la tabla aproveche todo el ancho de tu pantalla.',
      renderMockup: () => (
        <div className={styles.mockLayoutSplit}>
          <div className={styles.mockSidebarTree}>
            <div style={{ fontSize: '0.68rem', fontWeight: 800, color: '#64748b', textTransform: 'uppercase' }}>
              NIVELES Y GRADOS
            </div>
            <div className={styles.mockTreeItem}>
              <span className={styles.mockTreeDot} style={{ background: '#f59e0b' }} />
              <span>Inicial</span>
            </div>
            <div className={`${styles.mockTreeItem} ${styles.mockTreeItemActive}`}>
              <span className={styles.mockTreeDot} style={{ background: '#0284c7' }} />
              <span>1° Primaria (3)</span>
            </div>
            <div className={styles.mockTreeItem}>
              <span className={styles.mockTreeDot} style={{ background: '#7c3aed' }} />
              <span>Secundaria</span>
            </div>
          </div>
          <div className={styles.mockDetailTable}>
            <div className={styles.mockDetailHead}>
              <span className={styles.mockDetailTitle}>1° Primaria</span>
              <span style={{ fontSize: '0.68rem', color: '#0284c7', background: '#e0f2fe', padding: '1px 6px', borderRadius: 4, fontWeight: 700 }}>
                Colapsable
              </span>
            </div>
            <div className={styles.mockDetailRow}>
              <span>Evaluación Diagnóstica</span>
              <span style={{ color: '#10b981', fontWeight: 600 }}>Activa</span>
            </div>
            <div className={styles.mockDetailRow}>
              <span>Evaluación Formativa</span>
              <span style={{ color: '#64748b' }}>Inactiva</span>
            </div>
          </div>
        </div>
      ),
    },
  ]

  const currentData = stepsData[currentStep]

  const modalContent = (
    <div className={styles.overlay} onClick={handleFinish}>
      <div
        className={styles.modalCard}
        onClick={e => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-labelledby="onboarding-title"
      >
        {/* Botón de cierre */}
        <button
          type="button"
          onClick={handleFinish}
          className={styles.closeButton}
          title="Cerrar guía"
          aria-label="Cerrar guía"
        >
          <MdClose style={{ fontSize: '1.2rem' }} />
        </button>

        {/* Cabecera visual Hero */}
        <div className={styles.heroBanner} style={{ background: currentData.gradient }}>
          <div className={styles.heroBackgroundPattern} />
          <span
            className={styles.tagPill}
            style={{ color: currentData.tagColor, background: currentData.tagBg }}
          >
            {currentData.tag}
          </span>
          <div className={styles.iconCircle} style={{ borderColor: currentData.tagColor }}>
            {currentData.icon}
          </div>
        </div>

        {/* Cuerpo del paso */}
        <div className={styles.modalBody}>
          <h3 id="onboarding-title" className={styles.slideTitle}>
            {currentData.title}
          </h3>
          <p className={styles.slideSubtitle}>{currentData.subtitle}</p>
          <p className={styles.slideDescription}>{currentData.description}</p>

          {/* Mockup interactivo ilustrativo */}
          <div className={styles.mockupContainer}>
            {currentData.renderMockup()}
          </div>
        </div>

        {/* Footer y navegación */}
        <div className={styles.modalFooter}>
          <div className={styles.dotsRow}>
            {stepsData.map((s, index) => (
              <button
                key={index}
                type="button"
                onClick={() => setCurrentStep(index)}
                className={`${styles.dot} ${index === currentStep ? styles.dotActive : ''}`}
                style={{ backgroundColor: index === currentStep ? currentData.tagColor : '#cbd5e1' }}
                title={`Ir al paso ${index + 1}`}
                aria-label={`Paso ${index + 1}`}
              />
            ))}
          </div>

          <div className={styles.navButtons}>
            <button type="button" onClick={handleFinish} className={styles.skipButton}>
              Omitir
            </button>

            {currentStep > 0 && (
              <button type="button" onClick={handlePrev} className={styles.prevButton}>
                <MdChevronLeft style={{ fontSize: '1.15rem' }} />
                <span>Anterior</span>
              </button>
            )}

            {currentStep < stepsData.length - 1 ? (
              <button
                type="button"
                onClick={handleNext}
                className={styles.nextButton}
                style={{ background: currentData.tagColor }}
              >
                <span>Siguiente</span>
                <MdChevronRight style={{ fontSize: '1.15rem' }} />
              </button>
            ) : (
              <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                <button
                  type="button"
                  onClick={handleFinish}
                  className={styles.finishButton}
                >
                  <MdCheckCircle style={{ fontSize: '1.1rem' }} />
                  <span>¡Entendido!</span>
                </button>
                {onSwitchToPanelView && (
                  <button
                    type="button"
                    onClick={handleFinishAndOpenPanel}
                    className={styles.finishButton}
                    style={{ background: 'linear-gradient(135deg, #4f46e5 0%, #3730a3 100%)' }}
                    title="Cerrar guía y activar la Vista de Panel"
                  >
                    <MdViewSidebar style={{ fontSize: '1.1rem' }} />
                    <span>Probar Vista de Panel</span>
                  </button>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )

  const portalTarget = document.getElementById('portal-modal') || document.body
  return createPortal(modalContent, portalTarget)
}

export default EvaluacionesOnboardingModal
