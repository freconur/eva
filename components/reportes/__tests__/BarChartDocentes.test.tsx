import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import BarChartDocentes from '../BarChartDocentes';

// Mock de chart.js y react-chartjs-2
jest.mock('react-chartjs-2', () => ({
  Bar: () => <div data-testid="mock-bar-chart-docentes">Bar Chart Docentes Mock</div>,
}));

// Mock de hooks
jest.mock('@/features/hooks/useHighQualityChartOptions', () => ({
  useHighQualityChartOptions: () => ({
    responsive: true,
    plugins: {},
  }),
}));

jest.mock('@/features/hooks/useColorsFromCSS', () => ({
  useColorsFromCSS: () => ({
    getNivelColor: () => ({ bg: 'rgba(16, 185, 129, 0.8)', border: '#10b981' }),
  }),
}));

const mockDocentesData = [
  {
    dniDocente: '11223344',
    nombres: 'CARLOS',
    apellidos: 'QUISPE',
    institucion: 'IE 70001 SAN JUAN',
    region: '1',
    regionNombre: 'PUNO',
    promedioGlobal: 16.5,
    porcentajeSatisfactorio: 65,
    totalEstudiantes: 30,
    niveles: [
      { id: 1, nivel: 'Satisfactorio', cantidadDeEstudiantes: 20, color: '#10b981' },
      { id: 2, nivel: 'En Proceso', cantidadDeEstudiantes: 10, color: '#f59e0b' },
    ],
  },
  {
    dniDocente: '44332211',
    nombres: 'ROSA',
    apellidos: 'MAMANI',
    institucion: 'IE 70002 SANTA ROSA',
    region: '2',
    regionNombre: 'SAN ROMAN',
    promedioGlobal: 17.8,
    porcentajeSatisfactorio: 75,
    totalEstudiantes: 28,
    niveles: [
      { id: 1, nivel: 'Satisfactorio', cantidadDeEstudiantes: 22, color: '#10b981' },
      { id: 2, nivel: 'En Proceso', cantidadDeEstudiantes: 6, color: '#f59e0b' },
    ],
  },
];

describe('BarChartDocentes Component - UI/UX y control de dropdowns', () => {
  it('en la vista normal de la tarjeta NO muestra los dropdowns de UGEL ni controles de paginación/orden', () => {
    render(<BarChartDocentes data={mockDocentesData} />);

    // El gráfico y el header deben estar presentes
    expect(screen.getByTestId('mock-bar-chart-docentes')).toBeInTheDocument();
    expect(screen.getByText(/Desempeño por Docente/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /abrir vista completa del ranking/i })).toBeInTheDocument();

    // Los dropdowns y controles NO deben estar visibles en la tarjeta normal
    expect(screen.queryByText('Todas las Ugel')).not.toBeInTheDocument();
    expect(screen.queryByText(/⭐ Promedio/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/🚀 Impacto/i)).not.toBeInTheDocument();
    expect(screen.queryByText('Ver:')).not.toBeInTheDocument();
  });

  it('al pulsar "Vista Completa" se abre el Drawer con todos los dropdowns, buscador y filtros', () => {
    render(<BarChartDocentes data={mockDocentesData} />);

    const fullScreenButton = screen.getByRole('button', { name: /abrir vista completa del ranking/i });
    fireEvent.click(fullScreenButton);

    // Ahora dentro del Drawer (portal) SÍ deben estar disponibles los dropdowns y filtros
    expect(screen.getByText(/Ranking de Docentes \(Vista Completa\)/i)).toBeInTheDocument();
    expect(screen.getByPlaceholderText(/Buscar por IE, nombre o DNI/i)).toBeInTheDocument();
    expect(screen.getByText('Todas las Ugel')).toBeInTheDocument();
    expect(screen.getByText(/⭐ Promedio/i)).toBeInTheDocument();
    expect(screen.getByText(/🚀 Impacto/i)).toBeInTheDocument();
    expect(screen.getByText('Ver:')).toBeInTheDocument();

    // Cerrar el Drawer
    const closeBtn = screen.getByRole('button', { name: /cerrar/i });
    fireEvent.click(closeBtn);

    // Los filtros del Drawer ya no deben estar en el documento
    expect(screen.queryByText(/Ranking de Docentes \(Vista Completa\)/i)).not.toBeInTheDocument();
  });

  it('cuando canChangeRegion={false}, el selector de UGEL en el Drawer está bloqueado y fijado a su región asignada', () => {
    render(<BarChartDocentes data={mockDocentesData} canChangeRegion={false} initialRegion="1" />);

    const fullScreenButton = screen.getByRole('button', { name: /abrir vista completa del ranking/i });
    fireEvent.click(fullScreenButton);

    const ugelSelect = screen.getByLabelText(/filtrar por ugel/i) as HTMLSelectElement;
    expect(ugelSelect).toBeInTheDocument();
    expect(ugelSelect).toBeDisabled();
    expect(screen.queryByText('Todas las Ugel')).not.toBeInTheDocument();
    expect(screen.getByText('Puno')).toBeInTheDocument();
  });
});
