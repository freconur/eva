import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import CardRendimientoGlobalInstitucion from '../containers/reporte-desempeno/CardRendimientoGlobalInstitucion';

// Mock react-chartjs-2
jest.mock('react-chartjs-2', () => ({
  Bar: () => <div data-testid="mock-bar-chart">Bar Chart</div>,
}));

describe('CardRendimientoGlobalInstitucion', () => {
  const mockGlobalGroupData = {
    labels: ['I.E. 3049 IMPERIO DEL TAHUANTINSUYO'],
    datasets: [
      {
        label: 'I TRAMO',
        data: [16.5],
        rawScores: [16.5],
        backgroundColor: ['rgba(59, 130, 246, 0.85)'],
        borderColor: ['#3b82f6'],
      },
    ],
    groupList: [
      {
        groupId: 'ie1',
        name: 'I.E. 3049 IMPERIO DEL TAHUANTINSUYO',
        latestScore: 16.5,
        nivelNombre: 'Satisfactorio',
        nivelColor: '#10b981',
        evalsData: [
          {
            score: 16.5,
            fase: 'I TRAMO',
            nivel: { nivel: 'Satisfactorio', color: '#10b981' },
          },
        ],
      },
    ],
    maxGlobalScore: 20,
    totalQuestions: 10,
  };

  const mockGlobalNiveles = [
    { nivel: 'En Inicio', min: 0, max: 10, color: '#ef4444' },
    { nivel: 'En Proceso', min: 11, max: 14, color: '#f59e0b' },
    { nivel: 'Satisfactorio', min: 15, max: 20, color: '#10b981' },
  ];

  it('renders with title, subtitle, and mock bar chart', () => {
    render(
      <CardRendimientoGlobalInstitucion
        globalGroupData={mockGlobalGroupData}
        groupLabel="Institución Educativa"
        groupColor="#3b82f6"
        globalNiveles={mockGlobalNiveles}
      />
    );

    expect(screen.getByText('Rendimiento Global por Institución Educativa')).toBeInTheDocument();
    expect(screen.getByText(/EVALUACIÓN INTEGRAL/i)).toBeInTheDocument();
    expect(screen.getByText(/10 criterios evaluados/i)).toBeInTheDocument();
    expect(screen.getByText(/Puntaje máx: 20 pts/i)).toBeInTheDocument();
    expect(screen.getByTestId('mock-bar-chart')).toBeInTheDocument();
  });

  it('renders level chips in footer when globalNiveles provided', () => {
    render(
      <CardRendimientoGlobalInstitucion
        globalGroupData={mockGlobalGroupData}
        groupLabel="Institución Educativa"
        globalNiveles={mockGlobalNiveles}
      />
    );

    expect(screen.getByText(/Puntajes por Nivel de Logro:/i)).toBeInTheDocument();
    expect(screen.getByText('En Inicio')).toBeInTheDocument();
    expect(screen.getByText('En Proceso')).toBeInTheDocument();
    expect(screen.getByText('Satisfactorio')).toBeInTheDocument();
    expect(screen.getByText('0 - 10')).toBeInTheDocument();
    expect(screen.getByText('15 - 20')).toBeInTheDocument();
  });

  it('calls onOrientationChange when clicking horizontal/vertical buttons', () => {
    const handleOrientationChange = jest.fn();
    render(
      <CardRendimientoGlobalInstitucion
        globalGroupData={mockGlobalGroupData}
        orientation="horizontal"
        onOrientationChange={handleOrientationChange}
      />
    );

    const verticalBtn = screen.getByTitle('Vista Vertical');
    fireEvent.click(verticalBtn);
    expect(handleOrientationChange).toHaveBeenCalledWith('vertical');

    const horizontalBtn = screen.getByTitle('Vista Horizontal');
    fireEvent.click(horizontalBtn);
    expect(handleOrientationChange).toHaveBeenCalledWith('horizontal');
  });

  it('triggers onColorChange when picking a color', () => {
    const handleColorChange = jest.fn();
    render(
      <CardRendimientoGlobalInstitucion
        globalGroupData={mockGlobalGroupData}
        groupColor="#3b82f6"
        onColorChange={handleColorChange}
      />
    );

    const colorInput = screen.getByLabelText('Selector de color');
    fireEvent.change(colorInput, { target: { value: '#10b981' } });
    expect(handleColorChange).toHaveBeenCalledWith('#10b981');
  });

  it('triggers onOpenFullScreen when clicking fullscreen button', () => {
    const handleOpenFullScreen = jest.fn();
    render(
      <CardRendimientoGlobalInstitucion
        globalGroupData={mockGlobalGroupData}
        onOpenFullScreen={handleOpenFullScreen}
      />
    );

    const fullScreenBtn = screen.getByTitle('Ver en pantalla completa');
    fireEvent.click(fullScreenBtn);
    expect(handleOpenFullScreen).toHaveBeenCalledTimes(1);
  });
});
