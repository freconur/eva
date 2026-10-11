import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import PieChartComponent from '../PieChartComponent';
import TablaParticipacionDirectores from '../TablaParticipacionDirectores';

// Mock de Chart.js y react-chartjs-2
jest.mock('react-chartjs-2', () => ({
  Pie: () => <div data-testid="mock-pie-chart">Pie Chart Mock</div>,
  Bar: () => <div data-testid="mock-bar-chart">Bar Chart Mock</div>,
}));

// Mock de GlobalContext
jest.mock('@/features/context/GlolbalContext', () => ({
  useGlobalContext: () => ({
    loaderDataGraficoPieChart: false,
    dataGraficoPieChart: [
      {
        mes: 10,
        niveles: [
          { nivel: 'Satisfactorio', cantidadDeEstudiantes: 35 },
          { nivel: 'En Proceso', cantidadDeEstudiantes: 20 },
        ],
      },
    ],
  }),
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
    preparePieChartData: () => ({
      labels: ['Satisfactorio', 'En Proceso'],
      datasets: [{ data: [35, 20], backgroundColor: ['#10b981', '#f59e0b'] }],
    }),
  }),
}));

jest.mock('next/router', () => ({
  useRouter: () => ({
    query: { idEvaluacion: 'eval-123' },
  }),
}));

describe('Restricciones de UGEL para Especialistas', () => {
  describe('PieChartComponent', () => {
    it('cuando canChangeRegion={true} (admin), el selector de UGEL está habilitado y contiene "Todas las Ugel"', () => {
      render(
        <PieChartComponent
          monthSelected={10}
          dataGraficoTendenciaNiveles={[]}
          yearSelected={2026}
          filtros={{ region: '' }}
          canChangeRegion={true}
        />
      );

      const select = screen.getByRole('combobox') as HTMLSelectElement;
      expect(select).toBeInTheDocument();
      expect(select).not.toBeDisabled();
      expect(screen.getByText('Todas las Ugel')).toBeInTheDocument();
      expect(screen.getByText('Puno')).toBeInTheDocument();
      expect(screen.getByText('San Román')).toBeInTheDocument();
    });

    it('cuando canChangeRegion={false} (especialista), el selector está deshabilitado y solo muestra su UGEL asignada', () => {
      const onFilterChange = jest.fn();
      render(
        <PieChartComponent
          monthSelected={10}
          dataGraficoTendenciaNiveles={[]}
          yearSelected={2026}
          filtros={{ region: '1' }} // Puno
          onFilterChange={onFilterChange}
          canChangeRegion={false}
        />
      );

      const select = screen.getByRole('combobox') as HTMLSelectElement;
      expect(select).toBeInTheDocument();
      expect(select).toBeDisabled();
      expect(screen.getByText(/Ugel \(Asignada\)/i)).toBeInTheDocument();
      expect(screen.queryByText('Todas las Ugel')).not.toBeInTheDocument();
      expect(screen.getByText('Puno')).toBeInTheDocument();
      expect(screen.queryByText('San Román')).not.toBeInTheDocument();

      // No debe permitir cambiar el filtro
      fireEvent.change(select, { target: { value: '2' } });
      expect(onFilterChange).not.toHaveBeenCalled();
    });
  });

  describe('TablaParticipacionDirectores', () => {
    const defaultProps = {
      styles: {},
      directorsDetailRef: { current: null },
      selectedDirectorStatus: 'all' as const,
      setSelectedDirectorStatus: jest.fn(),
      selectedRegionDirector: '1',
      setSelectedRegionDirector: jest.fn(),
      selectedNivelDirector: 'all',
      setSelectedNivelDirector: jest.fn(),
      pageSizeDirector: 25 as const,
      setPageSizeDirector: jest.fn(),
      searchTermDirector: '',
      setSearchTermDirector: jest.fn(),
      filteredDirectoresByStatus: [
        {
          dniDirector: '12345678',
          nombres: 'JUAN',
          apellidos: 'PEREZ',
          institucion: 'IE PUNO',
          region: 1,
          totalEstudiantes: 20,
          participo: true,
        },
      ],
      directoresStats: { participo: 1, no_participo: 0, total: 1 },
    };

    it('cuando canChangeRegion={true} (admin), el selector en el drawer permite elegir cualquier UGEL o "Todas las UGEL"', () => {
      render(<TablaParticipacionDirectores {...defaultProps} canChangeRegion={true} />);

      const ugelSelect = screen.getByLabelText(/filtrar por ugel/i) as HTMLSelectElement;
      expect(ugelSelect).toBeInTheDocument();
      expect(ugelSelect).not.toBeDisabled();
      expect(screen.getByText('Todas las UGEL')).toBeInTheDocument();
    });

    it('cuando canChangeRegion={false} (especialista), el selector está deshabilitado y solo muestra su UGEL asignada', () => {
      render(<TablaParticipacionDirectores {...defaultProps} canChangeRegion={false} />);

      const ugelSelect = screen.getByLabelText(/filtrar por ugel/i) as HTMLSelectElement;
      expect(ugelSelect).toBeInTheDocument();
      expect(ugelSelect).toBeDisabled();
      expect(screen.queryByText('Todas las UGEL')).not.toBeInTheDocument();
      expect(screen.getAllByText(/UGEL Puno/i).length).toBeGreaterThanOrEqual(1);
      expect(screen.queryByText(/UGEL San Román/i)).not.toBeInTheDocument();
    });
  });
});
