import React from 'react'
import { render, screen, fireEvent } from '@testing-library/react'
import '@testing-library/jest-dom'
import EvaluacionesOnboardingModal, { ONBOARDING_STORAGE_KEY } from '../EvaluacionesOnboardingModal'

describe('EvaluacionesOnboardingModal', () => {
  const mockOnClose = jest.fn()
  const mockOnSwitchToPanelView = jest.fn()

  beforeEach(() => {
    jest.clearAllMocks()
    localStorage.clear()
    const portal = document.createElement('div')
    portal.setAttribute('id', 'portal-modal')
    document.body.appendChild(portal)
  })

  afterEach(() => {
    const portal = document.getElementById('portal-modal')
    if (portal) {
      document.body.removeChild(portal)
    }
  })

  test('no renderiza nada cuando isOpen es false', () => {
    render(
      <EvaluacionesOnboardingModal
        isOpen={false}
        onClose={mockOnClose}
        onSwitchToPanelView={mockOnSwitchToPanelView}
      />
    )
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
  })

  test('renderiza el primer paso (Novedades) cuando isOpen es true', () => {
    render(
      <EvaluacionesOnboardingModal
        isOpen={true}
        onClose={mockOnClose}
        onSwitchToPanelView={mockOnSwitchToPanelView}
      />
    )

    expect(screen.getByRole('dialog')).toBeInTheDocument()
    expect(screen.getByText('Nuevas herramientas para gestionar tus evaluaciones')).toBeInTheDocument()
    expect(screen.getByText('1. Clonar por Unidad')).toBeInTheDocument()
    expect(screen.getByText('2. Clonar por Lote')).toBeInTheDocument()
    expect(screen.getByText('3. Nueva Vista de Panel')).toBeInTheDocument()
  })

  test('avanza por todos los pasos: Unidad -> Lote -> Panel', () => {
    render(
      <EvaluacionesOnboardingModal
        isOpen={true}
        onClose={mockOnClose}
        onSwitchToPanelView={mockOnSwitchToPanelView}
      />
    )

    // Paso 1 -> Paso 2 (Clonación por Unidad)
    const nextBtn = screen.getByText('Siguiente')
    fireEvent.click(nextBtn)
    expect(screen.getByText('Duplica evaluaciones completas en un solo clic')).toBeInTheDocument()
    expect(screen.getByText('Copia íntegramente preguntas, alternativas y respuestas')).toBeInTheDocument()

    // Paso 2 -> Paso 3 (Clonación Masiva por Lote)
    fireEvent.click(screen.getByText('Siguiente'))
    expect(screen.getByText('Duplicación en bloque con barra de progreso')).toBeInTheDocument()
    expect(screen.getByText('Migra o crea múltiples exámenes en simultáneo')).toBeInTheDocument()

    // Paso 3 -> Paso 4 (Vista de Panel)
    fireEvent.click(screen.getByText('Siguiente'))
    expect(screen.getByText('Explorador estructurado de niveles y grados')).toBeInTheDocument()
    expect(screen.getByText('Mayor concentración y 100% de ancho disponible')).toBeInTheDocument()
    expect(screen.getByText('¡Entendido!')).toBeInTheDocument()
    expect(screen.getByText('Probar Vista de Panel')).toBeInTheDocument()
  })

  test('retrocede con el botón Anterior', () => {
    render(
      <EvaluacionesOnboardingModal
        isOpen={true}
        onClose={mockOnClose}
        onSwitchToPanelView={mockOnSwitchToPanelView}
      />
    )

    fireEvent.click(screen.getByText('Siguiente'))
    expect(screen.getByText('Duplica evaluaciones completas en un solo clic')).toBeInTheDocument()

    const prevBtn = screen.getByText('Anterior')
    fireEvent.click(prevBtn)
    expect(screen.getByText('Nuevas herramientas para gestionar tus evaluaciones')).toBeInTheDocument()
  })

  test('navega directamente al hacer clic en los puntos indicadores (dots)', () => {
    render(
      <EvaluacionesOnboardingModal
        isOpen={true}
        onClose={mockOnClose}
        onSwitchToPanelView={mockOnSwitchToPanelView}
      />
    )

    const dotStep3 = screen.getByTitle('Ir al paso 3')
    fireEvent.click(dotStep3)
    expect(screen.getByText('Duplicación en bloque con barra de progreso')).toBeInTheDocument()
  })

  test('permite navegar con las teclas de flecha (ArrowRight y ArrowLeft)', () => {
    render(
      <EvaluacionesOnboardingModal
        isOpen={true}
        onClose={mockOnClose}
        onSwitchToPanelView={mockOnSwitchToPanelView}
      />
    )

    fireEvent.keyDown(window, { key: 'ArrowRight' })
    expect(screen.getByText('Duplica evaluaciones completas en un solo clic')).toBeInTheDocument()

    fireEvent.keyDown(window, { key: 'ArrowLeft' })
    expect(screen.getByText('Nuevas herramientas para gestionar tus evaluaciones')).toBeInTheDocument()
  })

  test('guarda en localStorage y llama onClose al hacer clic en Omitir', () => {
    render(
      <EvaluacionesOnboardingModal
        isOpen={true}
        onClose={mockOnClose}
        onSwitchToPanelView={mockOnSwitchToPanelView}
      />
    )

    const skipBtn = screen.getByText('Omitir')
    fireEvent.click(skipBtn)

    expect(mockOnClose).toHaveBeenCalledTimes(1)
    expect(localStorage.getItem(ONBOARDING_STORAGE_KEY)).toBe('true')
  })

  test('cierra al presionar la tecla Escape', () => {
    render(
      <EvaluacionesOnboardingModal
        isOpen={true}
        onClose={mockOnClose}
        onSwitchToPanelView={mockOnSwitchToPanelView}
      />
    )

    fireEvent.keyDown(window, { key: 'Escape' })
    expect(mockOnClose).toHaveBeenCalledTimes(1)
    expect(localStorage.getItem(ONBOARDING_STORAGE_KEY)).toBe('true')
  })

  test('cierra y activa la vista de panel al hacer clic en "Probar Vista de Panel"', () => {
    render(
      <EvaluacionesOnboardingModal
        isOpen={true}
        onClose={mockOnClose}
        onSwitchToPanelView={mockOnSwitchToPanelView}
      />
    )

    // Ir al último paso
    fireEvent.click(screen.getByTitle('Ir al paso 4'))

    const tryPanelBtn = screen.getByText('Probar Vista de Panel')
    fireEvent.click(tryPanelBtn)

    expect(mockOnClose).toHaveBeenCalledTimes(1)
    expect(mockOnSwitchToPanelView).toHaveBeenCalledTimes(1)
    expect(localStorage.getItem(ONBOARDING_STORAGE_KEY)).toBe('true')
  })
})
