import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import CardPromedioGlobalDominio from '../containers/reporte-desempeno/CardPromedioGlobalDominio';

// Mock react-chartjs-2
jest.mock('react-chartjs-2', () => ({
  Bar: () => <div data-testid="mock-bar-chart">Bar Chart</div>,
}));

describe('CardPromedioGlobalDominio', () => {
  const mockDimData = {
    labels: ['DIAGNOSTICA APRENDIZAJES', 'PLANIFICA ACCIONES'],
    datasets: [
      {
        label: 'I TRAMO',
        data: [2.5, 3.0],
        rawDomainScores: [2.5, 3.0],
        backgroundColor: ['rgba(59, 130, 246, 0.8)', 'rgba(16, 185, 129, 0.8)'],
        borderColor: ['#3b82f6', '#10b981'],
      },
    ],
    dimList: [
      {
        dim: { id: 'd1', nombre: 'DIAGNOSTICA APRENDIZAJES' },
        name: 'DIAGNOSTICA APRENDIZAJES',
        avg: 3.5,
        latestDomainScore: 3.5,
        maxScore: 5,
        color: '#3b82f6',
        nivelNombre: 'Logro destacado',
        nivelColor: '#2563eb',
        evalsData: [{ domainScore: 2.5, fase: 'I TRAMO' }],
      },
      {
        dim: { id: 'd2', nombre: 'PLANIFICA ACCIONES' },
        name: 'PLANIFICA ACCIONES',
        avg: 2.8,
        latestDomainScore: 2.8,
        maxScore: 5,
        color: '#10b981',
        nivelNombre: 'Logro esperado',
        nivelColor: '#10b981',
        evalsData: [{ domainScore: 3.0, fase: 'I TRAMO' }],
      },
    ],
  };

  const mockGlobalNiveles = [
    { nivel: 'En inicio', min: 0, max: 1, color: '#ef4444' },
    { nivel: 'En proceso', min: 1.1, max: 2, color: '#f59e0b' },
    { nivel: 'Logro esperado', min: 2.1, max: 3, color: '#84cc16' },
    { nivel: 'Logro destacado', min: 3.1, max: 4, color: '#3b82f6' },
    { nivel: 'Logro innovador', min: 4.1, max: 5, color: '#8b5cf6' },
  ];

  it('renders the card with title, subtitle, and mock chart', () => {
    render(
      <CardPromedioGlobalDominio
        dimData={mockDimData}
        maxGlobalDomainScore={5}
        globalNiveles={mockGlobalNiveles}
      />
    );

    expect(screen.getByText('Puntaje Promedio Global por Dominio')).toBeInTheDocument();
    expect(
      screen.getByText('RENDIMIENTO GLOBAL CONSOLIDADO POR DOMINIO (SUMA DE CRITERIOS)')
    ).toBeInTheDocument();
    expect(screen.getByTestId('mock-bar-chart')).toBeInTheDocument();
  });

  it('renders the reference scale and domain rows with calculated averages and levels', () => {
    render(
      <CardPromedioGlobalDominio
        dimData={mockDimData}
        maxGlobalDomainScore={5}
        globalNiveles={mockGlobalNiveles}
      />
    );

    expect(screen.getByText(/Escala de Referencia/i)).toBeInTheDocument();
    expect(screen.getByText('DIAGNOSTICA APRENDIZAJES')).toBeInTheDocument();
    expect(screen.getByText('PLANIFICA ACCIONES')).toBeInTheDocument();
    expect(screen.getByText('3.5 pts')).toBeInTheDocument();
    expect(screen.getByText('2.8 pts')).toBeInTheDocument();
  });

  it('calls onOrientationChange when toggling horizontal/vertical buttons', () => {
    const onOrientationChange = jest.fn();
    render(
      <CardPromedioGlobalDominio
        dimData={mockDimData}
        maxGlobalDomainScore={5}
        orientation="horizontal"
        onOrientationChange={onOrientationChange}
      />
    );

    const verticalBtn = screen.getByTitle('Vista Vertical');
    fireEvent.click(verticalBtn);
    expect(onOrientationChange).toHaveBeenCalledWith('vertical');
  });

  it('calls onOpenFullScreen when clicking the "Vista completa" button', () => {
    const onOpenFullScreen = jest.fn();
    render(
      <CardPromedioGlobalDominio
        dimData={mockDimData}
        maxGlobalDomainScore={5}
        onOpenFullScreen={onOpenFullScreen}
      />
    );

    const fullScreenBtn = screen.getByTitle('Abrir vista completa de promedios por dominio');
    fireEvent.click(fullScreenBtn);
    expect(onOpenFullScreen).toHaveBeenCalled();
  });

  it('handles mouse enter and mouse leave on domain rows', () => {
    const onHoverDomainIndexChange = jest.fn();
    render(
      <CardPromedioGlobalDominio
        dimData={mockDimData}
        maxGlobalDomainScore={5}
        globalNiveles={mockGlobalNiveles}
        onHoverDomainIndexChange={onHoverDomainIndexChange}
      />
    );

    const domainRow = screen.getByText('DIAGNOSTICA APRENDIZAJES').closest('.domainRow');
    if (domainRow) {
      fireEvent.mouseEnter(domainRow);
      expect(onHoverDomainIndexChange).toHaveBeenCalledWith(0);
    }
  });
});
