import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import ModalAlertaFaseRequerida from '../modals/ModalAlertaFaseRequerida';

describe('ModalAlertaFaseRequerida', () => {
  beforeEach(() => {
    // Asegurar que exista portal-modal en el documento
    let portal = document.getElementById('portal-modal');
    if (!portal) {
      portal = document.createElement('div');
      portal.setAttribute('id', 'portal-modal');
      document.body.appendChild(portal);
    }
  });

  it('no renderiza nada si isOpen es false', () => {
    const { container } = render(
      <ModalAlertaFaseRequerida
        isOpen={false}
        onClose={jest.fn()}
        evaluacionTitulo="Prueba Docente"
      />
    );

    expect(container.firstChild).toBeNull();
    expect(screen.queryByText(/fase de evaluación requerida/i)).not.toBeInTheDocument();
  });

  it('renderiza título, mensaje, badge de evaluación y botones cuando isOpen es true', () => {
    const mockOnClose = jest.fn();

    render(
      <ModalAlertaFaseRequerida
        isOpen={true}
        onClose={mockOnClose}
        evaluacionTitulo="Evaluación Trimestral 2026"
        detailUrl="/admin/evaluaciones-docentes/evaluacion/eval-123"
      />
    );

    expect(screen.getByText(/fase de evaluación requerida/i)).toBeInTheDocument();
    expect(screen.getByText(/debe crear una fase antes de activar la evaluación/i)).toBeInTheDocument();
    expect(screen.getByText('Evaluación Trimestral 2026')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /entendido/i })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /ir a configurar fase/i })).toHaveAttribute(
      'href',
      '/admin/evaluaciones-docentes/evaluacion/eval-123'
    );
  });

  it('llama a onClose al hacer clic en el botón "Entendido" y en el botón de cerrar X', () => {
    const mockOnClose = jest.fn();

    render(
      <ModalAlertaFaseRequerida
        isOpen={true}
        onClose={mockOnClose}
        evaluacionTitulo="Evaluación Trimestral 2026"
      />
    );

    const btnEntendido = screen.getByRole('button', { name: /entendido/i });
    fireEvent.click(btnEntendido);
    expect(mockOnClose).toHaveBeenCalledTimes(1);

    const btnClose = screen.getByRole('button', { name: /cerrar advertencia/i });
    fireEvent.click(btnClose);
    expect(mockOnClose).toHaveBeenCalledTimes(2);
  });

  it('cierra el modal al presionar la tecla Escape', () => {
    const mockOnClose = jest.fn();

    render(
      <ModalAlertaFaseRequerida
        isOpen={true}
        onClose={mockOnClose}
        evaluacionTitulo="Evaluación Trimestral 2026"
      />
    );

    fireEvent.keyDown(window, { key: 'Escape' });
    expect(mockOnClose).toHaveBeenCalledTimes(1);
  });

  it('cierra el modal al hacer clic en el backdrop', () => {
    const mockOnClose = jest.fn();

    render(
      <ModalAlertaFaseRequerida
        isOpen={true}
        onClose={mockOnClose}
        evaluacionTitulo="Evaluación Trimestral 2026"
      />
    );

    const dialogBackdrop = screen.getByRole('dialog');
    fireEvent.click(dialogBackdrop);
    expect(mockOnClose).toHaveBeenCalledTimes(1);
  });
});
