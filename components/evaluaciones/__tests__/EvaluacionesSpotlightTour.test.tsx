import React from 'react'
import { render, screen, fireEvent, act } from '@testing-library/react'
import '@testing-library/jest-dom'
import EvaluacionesSpotlightTour, { SPOTLIGHT_STORAGE_KEY } from '../EvaluacionesSpotlightTour'

describe('EvaluacionesSpotlightTour', () => {
  const mockOnClose = jest.fn()
  const mockSetViewMode = jest.fn()
  const mockSetSelectedEvaIds = jest.fn()

  beforeEach(() => {
    jest.clearAllMocks()
    localStorage.clear()
    const portal = document.createElement('div')
    portal.setAttribute('id', 'portal-modal')
    document.body.appendChild(portal)

    // Add dummy target elements with data-tour attributes to test spotlight targeting
    const target1 = document.createElement('div')
    target1.setAttribute('data-tour', 'tour-btn-duplicate-single')
    document.body.appendChild(target1)

    const target2 = document.createElement('div')
    target2.setAttribute('data-tour', 'tour-checkbox-select')
    document.body.appendChild(target2)

    const target3 = document.createElement('div')
    target3.setAttribute('data-tour', 'tour-bulk-duplicate-button')
    document.body.appendChild(target3)

    const target4 = document.createElement('div')
    target4.setAttribute('data-tour', 'tour-view-mode-panel')
    document.body.appendChild(target4)

    const target5 = document.createElement('div')
    target5.setAttribute('data-tour', 'tour-sidebar-panel')
    document.body.appendChild(target5)
  })

  afterEach(() => {
    document.body.innerHTML = ''
  })

  test('no renderiza nada cuando isOpen es false', () => {
    render(
      <EvaluacionesSpotlightTour
        isOpen={false}
        onClose={mockOnClose}
        viewMode="table"
        setViewMode={mockSetViewMode}
        selectedEvaIds={[]}
        setSelectedEvaIds={mockSetSelectedEvaIds}
        firstEvaId="eva-123"
      />
    )
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
  })

  test('renderiza el paso de bienvenida cuando isOpen es true', () => {
    render(
      <EvaluacionesSpotlightTour
        isOpen={true}
        onClose={mockOnClose}
        viewMode="table"
        setViewMode={mockSetViewMode}
        selectedEvaIds={[]}
        setSelectedEvaIds={mockSetSelectedEvaIds}
        firstEvaId="eva-123"
      />
    )

    expect(screen.getByRole('dialog')).toBeInTheDocument()
    expect(screen.getByText('Tour Guiado: Nuevas Funcionalidades')).toBeInTheDocument()
    expect(screen.getByText(/Te señalaremos paso a paso en tu pantalla dónde se ubica cada botón/i)).toBeInTheDocument()
    expect(screen.getByText('¿Qué hace esta acción?')).toBeInTheDocument()
  })

  test('avanza paso a paso señalando cada botón y acción', () => {
    render(
      <EvaluacionesSpotlightTour
        isOpen={true}
        onClose={mockOnClose}
        viewMode="table"
        setViewMode={mockSetViewMode}
        selectedEvaIds={[]}
        setSelectedEvaIds={mockSetSelectedEvaIds}
        firstEvaId="eva-123"
      />
    )

    // Paso 0 -> Paso 1 (Clonar por Unidad)
    fireEvent.click(screen.getByText('Siguiente'))
    expect(screen.getByText('1. Clonar por Unidad (Botón Duplicar)')).toBeInTheDocument()
    expect(screen.getByText(/En la columna "Acciones" de cada evaluación, haz clic en este ícono de copia/i)).toBeInTheDocument()

    // Paso 1 -> Paso 2 (Selección para Clonación Masiva)
    fireEvent.click(screen.getByText('Siguiente'))
    expect(screen.getByText('2. Selección para Clonación Masiva')).toBeInTheDocument()
    expect(mockSetSelectedEvaIds).toHaveBeenCalledWith(['eva-123'])

    // Paso 2 -> Paso 3 (Duplicación Masiva en Bloque)
    fireEvent.click(screen.getByText('Siguiente'))
    expect(screen.getByText('3. Duplicación Masiva en Bloque')).toBeInTheDocument()
    expect(screen.getByText(/Haz clic en "Duplicar seleccionadas" en la barra flotante/i)).toBeInTheDocument()

    // Paso 3 -> Paso 4 (Cambiar a la Vista de Panel)
    fireEvent.click(screen.getByText('Siguiente'))
    expect(screen.getByText('4. Cambiar a la Vista de Panel')).toBeInTheDocument()
    expect(screen.getByText(/En la barra de herramientas, haz clic en el botón "Panel"/i)).toBeInTheDocument()

    // Paso 4 -> Paso 5 (Explorador por Grados y Ancho Disponible)
    fireEvent.click(screen.getByText('Siguiente'))
    expect(screen.getByText('5. Explorador por Grados y Ancho Disponible')).toBeInTheDocument()
    expect(mockSetViewMode).toHaveBeenCalledWith('sidebar')

    // Paso 5 -> Paso 6 (Guía Completada)
    fireEvent.click(screen.getByText('Siguiente'))
    expect(screen.getByText('¡Listo para comenzar!')).toBeInTheDocument()
    expect(screen.getByText('¡Entendido!')).toBeInTheDocument()
  })

  test('permite retroceder con el botón Anterior', () => {
    render(
      <EvaluacionesSpotlightTour
        isOpen={true}
        onClose={mockOnClose}
        viewMode="table"
        setViewMode={mockSetViewMode}
        selectedEvaIds={[]}
        setSelectedEvaIds={mockSetSelectedEvaIds}
        firstEvaId="eva-123"
      />
    )

    fireEvent.click(screen.getByText('Siguiente'))
    expect(screen.getByText('1. Clonar por Unidad (Botón Duplicar)')).toBeInTheDocument()

    fireEvent.click(screen.getByText('Anterior'))
    expect(screen.getByText('Tour Guiado: Nuevas Funcionalidades')).toBeInTheDocument()
  })

  test('guarda en localStorage y llama onClose al hacer clic en Omitir', () => {
    render(
      <EvaluacionesSpotlightTour
        isOpen={true}
        onClose={mockOnClose}
        viewMode="table"
        setViewMode={mockSetViewMode}
        selectedEvaIds={[]}
        setSelectedEvaIds={mockSetSelectedEvaIds}
        firstEvaId="eva-123"
      />
    )

    fireEvent.click(screen.getByText('Omitir'))
    expect(mockOnClose).toHaveBeenCalledTimes(1)
    expect(localStorage.getItem(SPOTLIGHT_STORAGE_KEY)).toBe('true')
  })

  test('cierra al presionar la tecla Escape', () => {
    render(
      <EvaluacionesSpotlightTour
        isOpen={true}
        onClose={mockOnClose}
        viewMode="table"
        setViewMode={mockSetViewMode}
        selectedEvaIds={[]}
        setSelectedEvaIds={mockSetSelectedEvaIds}
        firstEvaId="eva-123"
      />
    )

    fireEvent.keyDown(window, { key: 'Escape' })
    expect(mockOnClose).toHaveBeenCalledTimes(1)
    expect(localStorage.getItem(SPOTLIGHT_STORAGE_KEY)).toBe('true')
  })

  test('finaliza correctamente en el último paso con el botón "¡Entendido!"', () => {
    render(
      <EvaluacionesSpotlightTour
        isOpen={true}
        onClose={mockOnClose}
        viewMode="table"
        setViewMode={mockSetViewMode}
        selectedEvaIds={[]}
        setSelectedEvaIds={mockSetSelectedEvaIds}
        firstEvaId="eva-123"
      />
    )

    // Saltar al último paso directamente con el dot
    const dots = screen.getAllByRole('button', { name: /Paso/i })
    fireEvent.click(dots[dots.length - 1])

    expect(screen.getByText('¡Listo para comenzar!')).toBeInTheDocument()
    fireEvent.click(screen.getByText('¡Entendido!'))

    expect(mockOnClose).toHaveBeenCalledTimes(1)
    expect(localStorage.getItem(SPOTLIGHT_STORAGE_KEY)).toBe('true')
  })
})
