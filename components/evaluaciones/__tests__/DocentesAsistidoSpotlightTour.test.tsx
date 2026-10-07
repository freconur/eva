import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import DocentesAsistidoSpotlightTour, {
  ASISTIDO_SPOTLIGHT_STORAGE_KEY,
} from '../DocentesAsistidoSpotlightTour';

describe('DocentesAsistidoSpotlightTour', () => {
  const mockOnClose = jest.fn();
  const mockSetNivelesViewMode = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    localStorage.clear();
    const portal = document.createElement('div');
    portal.setAttribute('id', 'portal-modal');
    document.body.appendChild(portal);
  });

  afterEach(() => {
    const portal = document.getElementById('portal-modal');
    if (portal) {
      document.body.removeChild(portal);
    }
  });

  test('no renderiza nada cuando isOpen es false', () => {
    render(
      <DocentesAsistidoSpotlightTour
        isOpen={false}
        onClose={mockOnClose}
        nivelesViewMode="flujo"
        setNivelesViewMode={mockSetNivelesViewMode}
      />
    );
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  test('renderiza el primer paso del tour cuando isOpen es true', () => {
    render(
      <DocentesAsistidoSpotlightTour
        isOpen={true}
        onClose={mockOnClose}
        nivelesViewMode="flujo"
        setNivelesViewMode={mockSetNivelesViewMode}
      />
    );

    expect(screen.getByRole('dialog')).toBeInTheDocument();
    expect(screen.getByText('Tour de Botones: Modo Asistido')).toBeInTheDocument();
    expect(screen.getByText(/¿Qué hace este botón\?/i)).toBeInTheDocument();
    expect(screen.getByText(/¿Qué es lo nuevo\?/i)).toBeInTheDocument();
  });

  test('recorre los pasos señalando los botones: Asistido, Clásica, ¿Cómo funciona?, Niveles', () => {
    render(
      <DocentesAsistidoSpotlightTour
        isOpen={true}
        onClose={mockOnClose}
        nivelesViewMode="flujo"
        setNivelesViewMode={mockSetNivelesViewMode}
      />
    );

    // Paso 0: Bienvenida
    expect(screen.getByText('Tour de Botones: Modo Asistido')).toBeInTheDocument();

    // Paso 1: Botón Asistido
    fireEvent.click(screen.getByText('Siguiente'));
    expect(screen.getByText('1. Botón "Asistido"')).toBeInTheDocument();

    // Paso 2: Botón Vista Clásica
    fireEvent.click(screen.getByText('Siguiente'));
    expect(screen.getByText('2. Botón "Vista Clásica"')).toBeInTheDocument();
    expect(screen.getByText(/la vista clásica sigue 100% activa/i)).toBeInTheDocument();

    // Paso 3: Botón ¿Cómo funciona?
    fireEvent.click(screen.getByText('Siguiente'));
    expect(screen.getByText('3. Botón "¿Cómo funciona?"')).toBeInTheDocument();

    // Paso 4: Niveles y Ciclos
    fireEvent.click(screen.getByText('Siguiente'));
    expect(screen.getByText('4. Niveles Educativos y Ciclos')).toBeInTheDocument();

    // Paso 5: Botones Evaluar y Reporte
    fireEvent.click(screen.getByText('Siguiente'));
    expect(screen.getByText('5. Botones "Evaluar" y "Reporte"')).toBeInTheDocument();

    // Paso 6: Listo
    fireEvent.click(screen.getByText('Siguiente'));
    expect(screen.getByText('¡Todo listo para evaluar!')).toBeInTheDocument();
    expect(screen.getByText('¡Entendido!')).toBeInTheDocument();

    // Finalizar
    fireEvent.click(screen.getByText('¡Entendido!'));
    expect(mockOnClose).toHaveBeenCalledTimes(1);
    expect(localStorage.getItem(ASISTIDO_SPOTLIGHT_STORAGE_KEY)).toBe('true');
  });

  test('cierra y guarda en localStorage al pulsar Escape', () => {
    render(
      <DocentesAsistidoSpotlightTour
        isOpen={true}
        onClose={mockOnClose}
        nivelesViewMode="flujo"
        setNivelesViewMode={mockSetNivelesViewMode}
      />
    );

    fireEvent.keyDown(window, { key: 'Escape' });
    expect(mockOnClose).toHaveBeenCalledTimes(1);
    expect(localStorage.getItem(ASISTIDO_SPOTLIGHT_STORAGE_KEY)).toBe('true');
  });

  test('inicia en modo clasica y activa flujo al llegar al paso 4 (Niveles y Ciclos)', () => {
    render(
      <DocentesAsistidoSpotlightTour
        isOpen={true}
        onClose={mockOnClose}
        nivelesViewMode="clasica"
        setNivelesViewMode={mockSetNivelesViewMode}
      />
    );

    // Pasos 0, 1, 2, 3 no fuerzan cambio a flujo
    expect(mockSetNivelesViewMode).not.toHaveBeenCalled();

    // Avanzar a paso 1
    fireEvent.click(screen.getByText('Siguiente'));
    // Avanzar a paso 2
    fireEvent.click(screen.getByText('Siguiente'));
    // Avanzar a paso 3
    fireEvent.click(screen.getByText('Siguiente'));
    expect(mockSetNivelesViewMode).not.toHaveBeenCalled();

    // Avanzar a paso 4 (Niveles Educativos y Ciclos)
    fireEvent.click(screen.getByText('Siguiente'));
    expect(mockSetNivelesViewMode).toHaveBeenCalledWith('flujo');
  });
});
