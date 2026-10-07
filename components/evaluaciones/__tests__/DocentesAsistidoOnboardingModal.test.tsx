import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import DocentesAsistidoOnboardingModal, {
  ASISTIDO_ONBOARDING_STORAGE_KEY,
} from '../DocentesAsistidoOnboardingModal';

describe('DocentesAsistidoOnboardingModal', () => {
  const mockOnClose = jest.fn();
  const mockOnSwitchToAsistido = jest.fn();
  const mockOnSwitchToClasica = jest.fn();

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
      <DocentesAsistidoOnboardingModal
        isOpen={false}
        onClose={mockOnClose}
        onSwitchToAsistido={mockOnSwitchToAsistido}
        onSwitchToClasica={mockOnSwitchToClasica}
      />
    );
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  test('renderiza el primer paso (Bienvenida e Introducción) cuando isOpen es true', () => {
    render(
      <DocentesAsistidoOnboardingModal
        isOpen={true}
        onClose={mockOnClose}
        onSwitchToAsistido={mockOnSwitchToAsistido}
        onSwitchToClasica={mockOnSwitchToClasica}
      />
    );

    expect(screen.getByRole('dialog')).toBeInTheDocument();
    expect(screen.getByText('Nuevo: Modo Asistido de Evaluaciones')).toBeInTheDocument();
    expect(screen.getByText(/Encuentra y califica tus evaluaciones en menos pasos/i)).toBeInTheDocument();
    expect(screen.getByText(/Recuerda:/i)).toBeInTheDocument();
    expect(screen.getByText(/Vista Clásica/i)).toBeInTheDocument();
  });

  test('avanza por todos los 5 pasos correctamente', () => {
    render(
      <DocentesAsistidoOnboardingModal
        isOpen={true}
        onClose={mockOnClose}
        onSwitchToAsistido={mockOnSwitchToAsistido}
        onSwitchToClasica={mockOnSwitchToClasica}
      />
    );

    // Paso 0: Bienvenida
    expect(screen.getByText('Nuevo: Modo Asistido de Evaluaciones')).toBeInTheDocument();

    // Avanzar a Paso 1: Niveles
    fireEvent.click(screen.getByText('Siguiente'));
    expect(screen.getByText('Visualiza evaluaciones activas en tiempo real')).toBeInTheDocument();

    // Avanzar a Paso 2: Grados
    fireEvent.click(screen.getByText('Siguiente'));
    expect(screen.getByText('Tus grados asignados siempre destacados')).toBeInTheDocument();

    // Avanzar a Paso 3: Áreas y Calificación
    fireEvent.click(screen.getByText('Siguiente'));
    expect(screen.getByText('Acceso en 1 clic a "Evaluar Estudiantes"')).toBeInTheDocument();

    // Avanzar a Paso 4: Recordatorio Vista Clásica
    fireEvent.click(screen.getByText('Siguiente'));
    expect(screen.getByText('¿Prefieres la vista de siempre? ¡Sigue disponible!')).toBeInTheDocument();
    expect(screen.getByText('Probar Modo Asistido')).toBeInTheDocument();
    expect(screen.getByText('Usar Vista Clásica')).toBeInTheDocument();
  });

  test('permite retroceder con el botón Anterior', () => {
    render(
      <DocentesAsistidoOnboardingModal
        isOpen={true}
        onClose={mockOnClose}
      />
    );

    fireEvent.click(screen.getByText('Siguiente'));
    expect(screen.getByText('Visualiza evaluaciones activas en tiempo real')).toBeInTheDocument();

    fireEvent.click(screen.getByText('Anterior'));
    expect(screen.getByText('Nuevo: Modo Asistido de Evaluaciones')).toBeInTheDocument();
  });

  test('navega directamente al pulsar un punto (dot)', () => {
    render(
      <DocentesAsistidoOnboardingModal
        isOpen={true}
        onClose={mockOnClose}
      />
    );

    const dots = screen.getAllByRole('tab');
    expect(dots).toHaveLength(5);

    // Saltar al último paso (índice 4: Vista clásica recordatorio)
    fireEvent.click(dots[4]);
    expect(screen.getByText('¿Prefieres la vista de siempre? ¡Sigue disponible!')).toBeInTheDocument();
  });

  test('permite navegar mediante teclado con ArrowRight y ArrowLeft', () => {
    render(
      <DocentesAsistidoOnboardingModal
        isOpen={true}
        onClose={mockOnClose}
      />
    );

    fireEvent.keyDown(window, { key: 'ArrowRight' });
    expect(screen.getByText('Visualiza evaluaciones activas en tiempo real')).toBeInTheDocument();

    fireEvent.keyDown(window, { key: 'ArrowLeft' });
    expect(screen.getByText('Nuevo: Modo Asistido de Evaluaciones')).toBeInTheDocument();
  });

  test('cierra y guarda en localStorage al pulsar Escape', () => {
    render(
      <DocentesAsistidoOnboardingModal
        isOpen={true}
        onClose={mockOnClose}
      />
    );

    fireEvent.keyDown(window, { key: 'Escape' });
    expect(mockOnClose).toHaveBeenCalledTimes(1);
    expect(localStorage.getItem(ASISTIDO_ONBOARDING_STORAGE_KEY)).toBe('true');
  });

  test('cierra y guarda en localStorage al pulsar Omitir', () => {
    render(
      <DocentesAsistidoOnboardingModal
        isOpen={true}
        onClose={mockOnClose}
      />
    );

    fireEvent.click(screen.getByText('Omitir'));
    expect(mockOnClose).toHaveBeenCalledTimes(1);
    expect(localStorage.getItem(ASISTIDO_ONBOARDING_STORAGE_KEY)).toBe('true');
  });

  test('activa modo asistido al pulsar "Probar Modo Asistido" en el último paso', () => {
    render(
      <DocentesAsistidoOnboardingModal
        isOpen={true}
        onClose={mockOnClose}
        onSwitchToAsistido={mockOnSwitchToAsistido}
        onSwitchToClasica={mockOnSwitchToClasica}
      />
    );

    // Ir al último paso
    const dots = screen.getAllByRole('tab');
    fireEvent.click(dots[4]);

    const finishBtn = screen.getByText('Probar Modo Asistido');
    fireEvent.click(finishBtn);

    expect(mockOnClose).toHaveBeenCalledTimes(1);
    expect(mockOnSwitchToAsistido).toHaveBeenCalledTimes(1);
    expect(mockOnSwitchToClasica).not.toHaveBeenCalled();
    expect(localStorage.getItem(ASISTIDO_ONBOARDING_STORAGE_KEY)).toBe('true');
  });

  test('activa vista clásica al pulsar "Usar Vista Clásica" en el último paso', () => {
    render(
      <DocentesAsistidoOnboardingModal
        isOpen={true}
        onClose={mockOnClose}
        onSwitchToAsistido={mockOnSwitchToAsistido}
        onSwitchToClasica={mockOnSwitchToClasica}
      />
    );

    // Ir al último paso
    const dots = screen.getAllByRole('tab');
    fireEvent.click(dots[4]);

    const classicBtn = screen.getByText('Usar Vista Clásica');
    fireEvent.click(classicBtn);

    expect(mockOnClose).toHaveBeenCalledTimes(1);
    expect(mockOnSwitchToClasica).toHaveBeenCalledTimes(1);
    expect(mockOnSwitchToAsistido).not.toHaveBeenCalled();
    expect(localStorage.getItem(ASISTIDO_ONBOARDING_STORAGE_KEY)).toBe('true');
  });
});
