import React from 'react'
import { render, screen, fireEvent } from '@testing-library/react'
import DemoModeFloatingBanner from '../DemoModeFloatingBanner'

describe('DemoModeFloatingBanner', () => {
  const mockOnExit = jest.fn()

  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('renderiza la información de la institución y director simulados', () => {
    render(
      <DemoModeFloatingBanner
        directorName="Lic. Carlos Alberto Mamani Quispe"
        institucionName="I.E. 70001 San Martín de Porres"
        onExitDemo={mockOnExit}
      />
    )

    expect(screen.getByText('Modo Demo Activo')).toBeInTheDocument()
    expect(screen.getByText('I.E. 70001 San Martín de Porres')).toBeInTheDocument()
    expect(screen.getByText('Lic. Carlos Alberto Mamani Quispe')).toBeInTheDocument()
    expect(screen.getByText('Respuestas Reales · PII Anonimizada')).toBeInTheDocument()
  })

  it('permite salir del modo demo al hacer clic en el botón', () => {
    render(
      <DemoModeFloatingBanner
        directorName="Lic. Carlos Alberto Mamani Quispe"
        institucionName="I.E. 70001 San Martín de Porres"
        onExitDemo={mockOnExit}
      />
    )

    const exitBtn = screen.getByRole('button', { name: /salir de la demo/i })
    expect(exitBtn).toBeInTheDocument()

    fireEvent.click(exitBtn)
    expect(mockOnExit).toHaveBeenCalledTimes(1)
  })

  it('permite salir del modo demo al hacer clic en el botón flotante persistente', () => {
    render(
      <DemoModeFloatingBanner
        directorName="Lic. Carlos Alberto Mamani Quispe"
        institucionName="I.E. 70001 San Martín de Porres"
        onExitDemo={mockOnExit}
      />
    )

    const floatingBtn = screen.getByRole('button', { name: /finalizar demo flotante/i })
    expect(floatingBtn).toBeInTheDocument()

    fireEvent.click(floatingBtn)
    expect(mockOnExit).toHaveBeenCalledTimes(1)
  })
})
