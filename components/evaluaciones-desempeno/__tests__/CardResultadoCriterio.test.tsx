import React from 'react';
import { render, screen } from '@testing-library/react';
import CardResultadoCriterio from '../containers/reporte-desempeno/CardResultadoCriterio';

// Mock react-chartjs-2
jest.mock('react-chartjs-2', () => ({
  Bar: () => <div data-testid="mock-bar-chart">Bar Chart Mock</div>,
}));

describe('CardResultadoCriterio', () => {
  it('renders order number, criterion title, and dimension badge', () => {
    render(
      <CardResultadoCriterio
        orderNumber={1}
        criterio="Diagnostica los aprendizajes del ámbito de la UGEL basado en el Competence LAB"
        dimensionName="Liderazgo y Gestión"
        dimensionColor="#38bdf8"
        scaleStats={[
          { label: 'En inicio', count: 0 },
          { label: 'En desarrollo', count: 3 },
          { label: 'Logrado esperado', count: 61 },
          { label: 'Logro destacado', count: 3 },
          { label: 'Logro innovador', count: 0 },
        ]}
        totalResponses={67}
      />
    );

    // Title and number
    expect(screen.getByText('1.')).toBeInTheDocument();
    expect(
      screen.getByText('Diagnostica los aprendizajes del ámbito de la UGEL basado en el Competence LAB')
    ).toBeInTheDocument();

    // Dimension badge
    expect(screen.getByText('Liderazgo y Gestión')).toBeInTheDocument();

    // Chart mock
    expect(screen.getByTestId('mock-bar-chart')).toBeInTheDocument();

    // Stats grid
    expect(screen.getByText(/en inicio/i)).toBeInTheDocument();
    expect(screen.getByText('61')).toBeInTheDocument();

    // Total badge
    expect(screen.getByText(/Total: 67 respuestas/i)).toBeInTheDocument();
  });

  it('correctly derives stats when passed stats object and escala array', () => {
    const stats = {
      id: 'crit-2',
      a: 40,
      b: 12,
      c: 25,
      d: 8,
      e: 0,
      total: 85,
    };
    const escala = [
      { descripcion: 'En inicio' },
      { descripcion: 'En desarrollo' },
      { descripcion: 'Logrado esperado' },
      { descripcion: 'Logro destacado' },
      { descripcion: 'Logro innovador' },
    ];

    render(
      <CardResultadoCriterio
        orderNumber={2}
        criterio="Planifica o actualiza actividades/acciones"
        stats={stats}
        escala={escala}
      />
    );

    expect(screen.getByText('2.')).toBeInTheDocument();
    expect(screen.getByText('Planifica o actualiza actividades/acciones')).toBeInTheDocument();

    // Check counts from stats object
    expect(screen.getByText('40')).toBeInTheDocument();
    expect(screen.getByText('12')).toBeInTheDocument();
    expect(screen.getByText('25')).toBeInTheDocument();
    expect(screen.getByText('8')).toBeInTheDocument();
    expect(screen.getByText('Total: 85 respuestas')).toBeInTheDocument();
  });

  it('calculates total responses automatically when not explicitly provided', () => {
    const scaleStats = [
      { label: 'Nivel 1', count: 10 },
      { label: 'Nivel 2', count: 15 },
    ];

    render(
      <CardResultadoCriterio
        orderNumber={5}
        criterio="Prueba sin total"
        scaleStats={scaleStats}
      />
    );

    expect(screen.getByText('Total: 25 respuestas')).toBeInTheDocument();
  });
});
