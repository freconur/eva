import React, { useState, useEffect, useCallback, useMemo } from 'react'
import { createPortal } from 'react-dom'
import {
  MdClose,
  MdAutoAwesome,
  MdContentCopy,
  MdCheckBox,
  MdLayers,
  MdAccountTree,
  MdCheckCircle,
  MdChevronRight,
  MdChevronLeft,
  MdLightbulb,
  MdTouchApp
} from 'react-icons/md'
import styles from './EvaluacionesSpotlightTour.module.css'

export interface EvaluacionesSpotlightTourProps {
  isOpen: boolean
  onClose: () => void
  viewMode: 'table' | 'sidebar'
  setViewMode: (mode: 'table' | 'sidebar') => void
  selectedEvaIds: string[]
  setSelectedEvaIds: React.Dispatch<React.SetStateAction<string[]>>
  firstEvaId?: string
}

export const SPOTLIGHT_STORAGE_KEY = 'eva_onboarding_evaluaciones_v1'

interface TourStep {
  target?: string
  title: string
  badge: string
  badgeColor: string
  icon: React.ReactNode
  instruction: string
  whatItDoes: string
  pointerText?: string
  preferredPosition?: 'top' | 'bottom' | 'left' | 'right'
  actionBefore?: () => void
}

const EvaluacionesSpotlightTour: React.FC<EvaluacionesSpotlightTourProps> = ({
  isOpen,
  onClose,
  viewMode,
  setViewMode,
  selectedEvaIds,
  setSelectedEvaIds,
  firstEvaId,
}) => {
  const [currentStep, setCurrentStep] = useState<number>(0)
  const [targetRect, setTargetRect] = useState<DOMRect | null>(null)
  const [mounted, setMounted] = useState<boolean>(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  const tourSteps: TourStep[] = useMemo(() => [
    {
      title: 'Tour Guiado: Nuevas Funcionalidades',
      badge: '✨ BIENVENIDA',
      badgeColor: '#4f46e5',
      icon: <MdAutoAwesome style={{ color: '#4f46e5' }} />,
      instruction:
        'Te señalaremos paso a paso en tu pantalla dónde se ubica cada botón, dónde hacer clic y qué hace cada una de las nuevas herramientas incorporadas.',
      whatItDoes:
        'Aprenderás a clonar por unidad, duplicar en lote con barra de progreso y aprovechar la nueva Vista de Panel.',
      actionBefore: () => {
        if (viewMode !== 'table') setViewMode('table')
      },
    },
    {
      target: 'tour-btn-duplicate-single',
      title: '1. Clonar por Unidad (Botón Duplicar)',
      badge: '📋 COPIA INDIVIDUAL',
      badgeColor: '#2563eb',
      icon: <MdContentCopy style={{ color: '#2563eb' }} />,
      pointerText: '👆 Haz clic en este ícono',
      instruction:
        'En la columna "Acciones" de cada evaluación, haz clic en este ícono de copia.',
      whatItDoes:
        'Abre el modal para duplicar la evaluación completa (preguntas, alternativas y claves) y reemplaza automáticamente el mes en el nombre sugerido (ej. de marzo a octubre).',
      preferredPosition: 'bottom',
      actionBefore: () => {
        if (viewMode !== 'table') setViewMode('table')
      },
    },
    {
      target: 'tour-checkbox-select',
      title: '2. Selección para Clonación Masiva',
      badge: '☑️ SELECCIÓN MÚLTIPLE',
      badgeColor: '#7c3aed',
      icon: <MdCheckBox style={{ color: '#7c3aed' }} />,
      pointerText: '👆 Marca aquí para seleccionar',
      instruction:
        'Marca las casillas a la izquierda de cada evaluación que desees clonar juntas (o usa la casilla superior para marcar todas).',
      whatItDoes:
        'Al marcar una o más evaluaciones, se activará la barra flotante inferior con opciones de procesamiento por lote.',
      preferredPosition: 'bottom',
      actionBefore: () => {
        if (viewMode !== 'table') setViewMode('table')
        if (firstEvaId && !selectedEvaIds.includes(firstEvaId)) {
          setSelectedEvaIds([firstEvaId])
        }
      },
    },
    {
      target: 'tour-bulk-duplicate-button',
      title: '3. Duplicación Masiva en Bloque',
      badge: '🚀 PROCESAR EN LOTE',
      badgeColor: '#4f46e5',
      icon: <MdLayers style={{ color: '#4f46e5' }} />,
      pointerText: '👆 Presiona este botón morado',
      instruction:
        'Haz clic en "Duplicar seleccionadas" en la barra flotante que aparece tras marcar evaluaciones.',
      whatItDoes:
        'Abre el modal de duplicación en lote, donde seleccionas el mes destino y monitoreas en vivo la barra de porcentaje y progreso mientras se clonan.',
      preferredPosition: 'top',
      actionBefore: () => {
        if (viewMode !== 'table') setViewMode('table')
        if (firstEvaId && selectedEvaIds.length === 0) {
          setSelectedEvaIds([firstEvaId])
        }
      },
    },
    {
      target: 'tour-view-mode-panel',
      title: '4. Cambiar a la Vista de Panel',
      badge: '📂 VISTA DE PANEL',
      badgeColor: '#0284c7',
      icon: <MdAccountTree style={{ color: '#0284c7' }} />,
      pointerText: '👆 Haz clic en "Panel"',
      instruction:
        'En la barra de herramientas, haz clic en el botón "Panel" para activar la vista organizada en dos columnas.',
      whatItDoes:
        'Pasa de la matriz tradicional a un explorador interactivo clasificado por niveles educativos (Inicial, Primaria, Secundaria) y grados.',
      preferredPosition: 'bottom',
      actionBefore: () => {
        if (viewMode !== 'table') setViewMode('table')
      },
    },
    {
      target: 'tour-sidebar-panel',
      title: '5. Explorador por Grados y Ancho Disponible',
      badge: '🖥️ RESPONSIVIDAD Y FOCO',
      badgeColor: '#0891b2',
      icon: <MdTouchApp style={{ color: '#0891b2' }} />,
      pointerText: '👈 Árbol de Grados y botón colapsar',
      instruction:
        'Haz clic en cualquier grado para ver sus evaluaciones. Usa el botón de flecha en la cabecera del explorador para colapsarlo cuando necesites que la tabla tome el 100% del ancho de tu pantalla.',
      whatItDoes:
        'Mantiene tu trabajo enfocado en un grado a la vez, garantizando que la tabla sea 100% responsiva y sin desbordar tu ventana.',
      preferredPosition: 'right',
      actionBefore: () => {
        if (viewMode !== 'sidebar') setViewMode('sidebar')
      },
    },
    {
      title: '¡Listo para comenzar!',
      badge: '🎉 GUÍA COMPLETADA',
      badgeColor: '#10b981',
      icon: <MdCheckCircle style={{ color: '#10b981' }} />,
      instruction:
        'Ya sabes exactamente dónde hacer clic y cómo utilizar cada funcionalidad. Puedes volver a abrir este tour en cualquier momento desde el botón "Novedades".',
      whatItDoes:
        'Tus preferencias de guía quedan guardadas. ¡Mucho éxito en la gestión de tus evaluaciones!',
    },
  ], [viewMode, setViewMode, firstEvaId, selectedEvaIds, setSelectedEvaIds])

  useEffect(() => {
    if (isOpen) {
      setCurrentStep(0)
    }
  }, [isOpen])

  // Execute step actionBefore and measure target element
  useEffect(() => {
    if (!isOpen) {
      setTargetRect(null)
      return
    }

    const step = tourSteps[currentStep]
    if (step?.actionBefore) {
      step.actionBefore()
    }

    const updateRect = () => {
      if (!step?.target) {
        setTargetRect(null)
        return
      }

      const el = document.querySelector(`[data-tour="${step.target}"]`)
      if (el) {
        const rect = el.getBoundingClientRect()
        setTargetRect(rect)
      } else {
        setTargetRect(null)
      }
    }

    // Delay slightly to let React render and scroll into view smoothly
    const timer = setTimeout(() => {
      if (step?.target) {
        const el = document.querySelector(`[data-tour="${step.target}"]`)
        if (el) {
          el.scrollIntoView({ behavior: 'smooth', block: 'center' })
        }
      }
      updateRect()
    }, 220)

    window.addEventListener('resize', updateRect)
    window.addEventListener('scroll', updateRect, { passive: true })

    return () => {
      clearTimeout(timer)
      window.removeEventListener('resize', updateRect)
      window.removeEventListener('scroll', updateRect)
    }
  }, [currentStep, isOpen, tourSteps])

  const handleFinish = useCallback(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem(SPOTLIGHT_STORAGE_KEY, 'true')
    }
    // Clean up sample selection if it was only selected for the tour
    if (firstEvaId && selectedEvaIds.length === 1 && selectedEvaIds[0] === firstEvaId) {
      setSelectedEvaIds([])
    }
    onClose()
  }, [firstEvaId, selectedEvaIds, setSelectedEvaIds, onClose])

  const handleNext = useCallback(() => {
    if (currentStep < tourSteps.length - 1) {
      setCurrentStep(prev => prev + 1)
    } else {
      handleFinish()
    }
  }, [currentStep, tourSteps.length, handleFinish])

  const handlePrev = useCallback(() => {
    if (currentStep > 0) {
      setCurrentStep(prev => prev - 1)
    }
  }, [currentStep])

  // Keyboard navigation
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

  const currentStepData = tourSteps[currentStep]
  const isCenteredModal = !currentStepData.target || !targetRect

  // Smart floating tooltip positioning
  const getTooltipStyle = (): React.CSSProperties => {
    if (isCenteredModal || !targetRect) {
      return {
        top: '50%',
        left: '50%',
        transform: 'translate(-50%, -50%)',
      }
    }

    const cardWidth = 370
    const estimatedHeight = 240
    const margin = 16
    const position = currentStepData.preferredPosition || 'bottom'

    let top = 0
    let left = 0

    if (position === 'bottom') {
      top = targetRect.bottom + margin
      left = targetRect.left + (targetRect.width - cardWidth) / 2
      // If below viewport, place above
      if (top + estimatedHeight > window.innerHeight - margin) {
        top = Math.max(margin, targetRect.top - estimatedHeight - margin)
      }
    } else if (position === 'top') {
      top = targetRect.top - estimatedHeight - margin
      left = targetRect.left + (targetRect.width - cardWidth) / 2
      // If above viewport, place below
      if (top < margin) {
        top = Math.min(window.innerHeight - estimatedHeight - margin, targetRect.bottom + margin)
      }
    } else if (position === 'right') {
      left = targetRect.right + margin
      top = targetRect.top + (targetRect.height - estimatedHeight) / 2
      // If overflowing right, place to the left or below
      if (left + cardWidth > window.innerWidth - margin) {
        left = targetRect.left - cardWidth - margin
      }
    } else {
      left = targetRect.left - cardWidth - margin
      top = targetRect.top + (targetRect.height - estimatedHeight) / 2
    }

    // Keep within safe viewport horizontal bounds
    left = Math.max(margin, Math.min(window.innerWidth - cardWidth - margin, left))
    top = Math.max(margin, Math.min(window.innerHeight - estimatedHeight - margin, top))

    return {
      top: `${top}px`,
      left: `${left}px`,
      transform: 'none',
    }
  }

  const tourContent = (
    <div className={styles.tourOverlay} onClick={handleFinish}>
      {/* Fallback dark backdrop if centered */}
      {isCenteredModal && <div className={styles.modalBackdrop} />}

      {/* Spotlight highlight hole around the exact targeted element */}
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

      {/* Floating Guided Tooltip Card */}
      <div
        className={styles.tooltipCard}
        style={getTooltipStyle()}
        onClick={e => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-labelledby="tour-step-title"
      >
        {/* Header */}
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
              <h4 id="tour-step-title" className={styles.stepTitle}>
                {currentStepData.title}
              </h4>
            </div>
          </div>
          <button
            type="button"
            onClick={handleFinish}
            className={styles.closeButton}
            title="Cerrar tour"
            aria-label="Cerrar tour"
          >
            <MdClose />
          </button>
        </div>

        {/* Instructions */}
        <p className={styles.stepInstruction}>
          {currentStepData.instruction}
        </p>

        {/* What It Does Box */}
        <div className={styles.whatItDoesBox}>
          <span className={styles.whatItDoesLabel}>
            <MdLightbulb style={{ color: '#f59e0b' }} />
            ¿Qué hace esta acción?
          </span>
          <p className={styles.whatItDoesText}>
            {currentStepData.whatItDoes}
          </p>
        </div>

        {/* Progress Dots */}
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

        {/* Footer Actions */}
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
  )

  const portalContainer = document.getElementById('portal-modal') || document.body
  return createPortal(tourContent, portalContainer)
}

export default EvaluacionesSpotlightTour
