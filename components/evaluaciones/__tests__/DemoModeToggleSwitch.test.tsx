import React from 'react'
import { render, screen, fireEvent } from '@testing-library/react'
import DemoModeToggleSwitch from '../DemoModeToggleSwitch'

describe('DemoModeToggleSwitch', () => {
  const mockOnToggle = jest.fn()

  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('muestra estado OFF cuando isDemoMode es false', () => {
    render(
      <DemoModeToggleSwitch
        isDemoMode={false}
        onToggle={mockOnToggle}
        variant="light"
      />
    )

    expect(screen.getByText('Modo Demo')).toBeInTheDocument()
    expect(screen.getByText('OFF')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /conmutador de modo demostración/i })).toHaveAttribute(
      'aria-pressed',
      'false'
    )
  })

  it('muestra estado ON cuando isDemoMode es true', () => {
    render(
      <DemoModeToggleSwitch
        isDemoMode={true}
        onToggle={mockOnToggle}
        variant="glass"
      />
    )

    expect(screen.getByText('Modo Demo')).toBeInTheDocument()
    expect(screen.getByText('ON')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /conmutador de modo demostración/i })).toHaveAttribute(
      'aria-pressed',
      'true'
    )
  })

  it('ejecuta onToggle al hacer clic', () => {
    render(
      <DemoModeToggleSwitch
        isDemoMode={false}
        onToggle={mockOnToggle}
      />
    )

    const btn = screen.getByRole('button', { name: /conmutador de modo demostración/i })
    fireEvent.click(btn)
    expect(mockOnToggle).toHaveBeenCalledTimes(1)
  })
})
