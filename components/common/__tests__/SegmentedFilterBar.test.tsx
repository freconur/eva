import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import SegmentedFilterBar, { FilterItem } from '../SegmentedFilterBar';

describe('SegmentedFilterBar Component', () => {
  const mockYearChange = jest.fn();
  const mockMonthChange = jest.fn();
  const mockReset = jest.fn();

  const testFilters: FilterItem<any>[] = [
    {
      id: 'year',
      label: 'Año',
      value: 2026,
      onChange: mockYearChange,
      options: [
        { value: 2026, label: '2026' },
        { value: 2025, label: '2025' },
      ],
      minWidth: 'md:min-w-[120px]',
    },
    {
      id: 'month',
      label: 'Mes',
      value: 'all',
      onChange: mockMonthChange,
      options: [
        { value: 'all', label: 'Todos los Meses' },
        { value: '1', label: 'Enero' },
        { value: '2', label: 'Febrero' },
      ],
      minWidth: 'md:min-w-[160px]',
    },
  ];

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renderiza correctamente el título y los valores seleccionados', () => {
    render(
      <SegmentedFilterBar
        title="Filtrar por"
        filters={testFilters}
        onReset={mockReset}
      />
    );

    // Debe renderizar el título (tanto para desktop como mobile)
    const titles = screen.getAllByText('Filtrar por');
    expect(titles.length).toBeGreaterThan(0);

    // Debe mostrar los valores activos
    expect(screen.getByText('2026')).toBeInTheDocument();
    expect(screen.getByText('Todos los Meses')).toBeInTheDocument();

    // Debe mostrar el botón de restablecer
    expect(screen.getByRole('button', { name: /Restablecer Filtros/i })).toBeInTheDocument();
  });

  it('abre el dropdown al hacer clic y permite seleccionar una opción', () => {
    render(
      <SegmentedFilterBar
        title="Filtrar por"
        filters={testFilters}
        onReset={mockReset}
      />
    );

    const yearButton = screen.getByRole('button', { name: /2026/i });
    expect(yearButton).toHaveAttribute('aria-expanded', 'false');

    // Abre el dropdown
    fireEvent.click(yearButton);
    expect(yearButton).toHaveAttribute('aria-expanded', 'true');

    // La opción 2025 debe estar visible
    const option2025 = screen.getByRole('option', { name: /2025/i });
    expect(option2025).toBeInTheDocument();

    // Selecciona 2025
    fireEvent.click(option2025);
    expect(mockYearChange).toHaveBeenCalledWith(2025);
  });

  it('ejecuta la función onReset al hacer clic en restablecer', () => {
    render(
      <SegmentedFilterBar
        title="Filtrar por"
        filters={testFilters}
        onReset={mockReset}
      />
    );

    const resetButton = screen.getByRole('button', { name: /Restablecer Filtros/i });
    fireEvent.click(resetButton);

    expect(mockReset).toHaveBeenCalledTimes(1);
  });

  it('cierra el dropdown al presionar la tecla Escape', () => {
    render(
      <SegmentedFilterBar
        title="Filtrar por"
        filters={testFilters}
        onReset={mockReset}
      />
    );

    const yearButton = screen.getByRole('button', { name: /2026/i });
    fireEvent.click(yearButton);
    expect(yearButton).toHaveAttribute('aria-expanded', 'true');

    fireEvent.keyDown(document, { key: 'Escape' });
    expect(yearButton).toHaveAttribute('aria-expanded', 'false');
  });

  it('cierra el dropdown al hacer clic fuera del componente', () => {
    render(
      <div>
        <div data-testid="outside">Fuera</div>
        <SegmentedFilterBar
          title="Filtrar por"
          filters={testFilters}
          onReset={mockReset}
        />
      </div>
    );

    const yearButton = screen.getByRole('button', { name: /2026/i });
    fireEvent.click(yearButton);
    expect(yearButton).toHaveAttribute('aria-expanded', 'true');

    fireEvent.mouseDown(screen.getByTestId('outside'));
    expect(yearButton).toHaveAttribute('aria-expanded', 'false');
  });
});
