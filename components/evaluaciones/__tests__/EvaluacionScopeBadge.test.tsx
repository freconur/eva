import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import EvaluacionScopeBadge from '../EvaluacionScopeBadge';

describe('EvaluacionScopeBadge', () => {
  test('debe renderizar el distintivo exclusivo de UGEL Huancané cuando ugels=[7]', () => {
    render(<EvaluacionScopeBadge ugels={[7]} />);
    
    // Verifica que muestre el texto de la UGEL
    expect(screen.getByText('UGEL Huancané')).toBeInTheDocument();
    
    // Verifica atributos de accesibilidad y title
    const button = screen.getByRole('button');
    expect(button).toHaveAttribute('aria-haspopup', 'dialog');
    expect(button).toHaveAttribute('title', expect.stringContaining('Huancané'));
  });

  test('debe renderizar el distintivo de múltiples UGELs cuando ugels tiene varios IDs', () => {
    render(<EvaluacionScopeBadge ugels={[7, 8]} />);
    
    expect(screen.getByText('Exclusiva (2 UGELs)')).toBeInTheDocument();
  });

  test('debe renderizar el distintivo regional por defecto cuando ugels no está definido o está vacío', () => {
    render(<EvaluacionScopeBadge ugels={[]} />);
    
    expect(screen.getByText('Regional')).toBeInTheDocument();
  });

  test('no debe renderizar nada cuando showGlobal=false y no es exclusiva', () => {
    const { container } = render(<EvaluacionScopeBadge ugels={[]} showGlobal={false} />);
    expect(container.firstChild).toBeNull();
  });

  test('debe abrir el popover interactivo al hacer clic y mostrar la información detallada', () => {
    render(<EvaluacionScopeBadge ugels={[7]} />);
    
    const button = screen.getByRole('button');
    fireEvent.click(button);

    // El popover debe estar visible en el documento
    expect(screen.getByRole('dialog')).toBeInTheDocument();
    expect(screen.getByText('Evaluación Exclusiva')).toBeInTheDocument();
    expect(screen.getByText(/Acceso habilitado para tu sede institucional/i)).toBeInTheDocument();
  });

  test('debe cerrar el popover al hacer clic en el botón de cerrar', () => {
    render(<EvaluacionScopeBadge ugels={[7]} />);
    
    const button = screen.getByRole('button');
    fireEvent.click(button);
    expect(screen.getByRole('dialog')).toBeInTheDocument();

    const closeBtn = screen.getByTitle('Cerrar ventana emergente');
    fireEvent.click(closeBtn);
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });
});
