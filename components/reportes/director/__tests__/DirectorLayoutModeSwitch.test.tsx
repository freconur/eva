import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import DirectorLayoutModeSwitch from '../DirectorLayoutModeSwitch';

describe('DirectorLayoutModeSwitch Component', () => {
  it('renderiza correctamente los botones de Pestañas y Cascada', () => {
    const mockOnChange = jest.fn();
    render(<DirectorLayoutModeSwitch mode="tabs" onChange={mockOnChange} />);

    const tabsBtn = screen.getByRole('button', { name: /Pestañas/i });
    const cascadeBtn = screen.getByRole('button', { name: /Cascada/i });

    expect(tabsBtn).toBeInTheDocument();
    expect(cascadeBtn).toBeInTheDocument();
    expect(tabsBtn).toHaveAttribute('aria-pressed', 'true');
    expect(cascadeBtn).toHaveAttribute('aria-pressed', 'false');
  });

  it('llama a onChange("cascade") cuando se hace clic en el botón de Cascada', () => {
    const mockOnChange = jest.fn();
    render(<DirectorLayoutModeSwitch mode="tabs" onChange={mockOnChange} />);

    const cascadeBtn = screen.getByRole('button', { name: /Cascada/i });
    fireEvent.click(cascadeBtn);

    expect(mockOnChange).toHaveBeenCalledTimes(1);
    expect(mockOnChange).toHaveBeenCalledWith('cascade');
  });

  it('llama a onChange("tabs") cuando se hace clic en el botón de Pestañas', () => {
    const mockOnChange = jest.fn();
    render(<DirectorLayoutModeSwitch mode="cascade" onChange={mockOnChange} />);

    const tabsBtn = screen.getByRole('button', { name: /Pestañas/i });
    fireEvent.click(tabsBtn);

    expect(mockOnChange).toHaveBeenCalledTimes(1);
    expect(mockOnChange).toHaveBeenCalledWith('tabs');
  });

  it('aplica las clases visuales de la variante glass correctamente', () => {
    const mockOnChange = jest.fn();
    const { container } = render(
      <DirectorLayoutModeSwitch mode="tabs" onChange={mockOnChange} variant="glass" />
    );

    const group = container.querySelector('[role="group"]');
    expect(group?.className).toContain('backdrop-blur-md');
  });
});
