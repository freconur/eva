import React from 'react';
import { render, screen, fireEvent, act } from '@testing-library/react';
import LazyReportSection from '../LazyReportSection';

describe('LazyReportSection', () => {
  let originalIntersectionObserver: any;
  let observerCallback: any;

  beforeEach(() => {
    originalIntersectionObserver = window.IntersectionObserver;
    window.IntersectionObserver = jest.fn().mockImplementation((callback) => {
      observerCallback = callback;
      return {
        observe: jest.fn(),
        disconnect: jest.fn(),
        unobserve: jest.fn(),
      };
    }) as any;
  });

  afterEach(() => {
    window.IntersectionObserver = originalIntersectionObserver;
  });

  it('renders loading placeholder initially when not forceLoaded', () => {
    render(
      <LazyReportSection title="Cargando Preguntas...">
        <div data-testid="lazy-content">Contenido Cargado</div>
      </LazyReportSection>
    );

    expect(screen.getByText('Cargando Preguntas...')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /cargar ahora/i })).toBeInTheDocument();
    expect(screen.queryByTestId('lazy-content')).not.toBeInTheDocument();
  });

  it('renders children immediately when forceLoad is true', () => {
    const onVisible = jest.fn();
    render(
      <LazyReportSection forceLoad={true} onVisible={onVisible}>
        <div data-testid="lazy-content">Contenido Directo</div>
      </LazyReportSection>
    );

    expect(screen.getByTestId('lazy-content')).toBeInTheDocument();
    expect(onVisible).toHaveBeenCalled();
  });

  it('renders children when the "Cargar ahora" button is clicked', () => {
    const onVisible = jest.fn();
    render(
      <LazyReportSection onVisible={onVisible}>
        <div data-testid="lazy-content">Contenido Forzado por Click</div>
      </LazyReportSection>
    );

    fireEvent.click(screen.getByRole('button', { name: /cargar ahora/i }));

    expect(screen.getByTestId('lazy-content')).toBeInTheDocument();
    expect(onVisible).toHaveBeenCalledTimes(1);
  });

  it('renders children and invokes onVisible when IntersectionObserver reports intersection', () => {
    const onVisible = jest.fn();
    render(
      <LazyReportSection onVisible={onVisible}>
        <div data-testid="lazy-content">Contenido por Scroll</div>
      </LazyReportSection>
    );

    expect(screen.queryByTestId('lazy-content')).not.toBeInTheDocument();

    act(() => {
      observerCallback([{ isIntersecting: true }]);
    });

    expect(screen.getByTestId('lazy-content')).toBeInTheDocument();
    expect(onVisible).toHaveBeenCalledTimes(1);
  });
});
