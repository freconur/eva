import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import DirectorFiltrosBar from '../DirectorFiltrosBar';
import { Evaluaciones } from '@/features/types/types';

describe('DirectorFiltrosBar Component', () => {
  const baseEvaluacion: Evaluaciones = {
    id: 'eval-123',
    nombre: 'Evaluación Diagnóstica',
    grado: 6,
    tipoDeEvaluacion: '1',
    nivelYPuntaje: [
      { nivel: 'Inicio', min: 0, max: 10, color: '#ef4444' },
      { nivel: 'Proceso', min: 11, max: 15, color: '#f59e0b' },
      { nivel: 'Satisfactorio', min: 16, max: 20, color: '#10b981' },
    ],
  };

  const defaultProps = {
    filtros: {
      grado: '',
      seccion: '',
      orden: '',
      genero: '',
      nivel: '',
    },
    onFilterChange: jest.fn(),
    onSingleFilterChange: jest.fn(),
    evaluacion: baseEvaluacion,
    availableSections: [
      { id: '1', name: 'A' },
      { id: '2', name: 'B' },
    ],
    isDirectorRol: false,
    columnasVisibles: {
      showRC: true,
      showTP: true,
      showPuntaje: true,
      showNivel: true,
      showDniDocente: false,
    },
    onToggleColumna: jest.fn(),
    onLimpiarFiltros: jest.fn(),
  };

  it('muestra únicamente el grado correspondiente a la evaluación cuando evaluacion.grado está definido', () => {
    render(<DirectorFiltrosBar {...defaultProps} />);

    // El botón de filtro de grado debe mostrar "6to grado" inmediatamente
    const gradoButton = screen.getByRole('button', { name: /Grado: 6to grado/i });
    expect(gradoButton).toBeInTheDocument();
    expect(gradoButton).toHaveTextContent('6to grado');

    // Al hacer clic para desplegar opciones
    fireEvent.click(gradoButton);

    // Debe mostrar la opción "6to grado"
    const options = screen.getAllByRole('option');
    expect(options).toHaveLength(1);
    expect(options[0]).toHaveTextContent('6to grado');

    // NO debe mostrar "Todos los grados", ni otros grados como "5 años", "1ro grado", etc.
    expect(screen.queryByText('Todos los grados')).not.toBeInTheDocument();
    expect(screen.queryByText('5 años')).not.toBeInTheDocument();
    expect(screen.queryByText('1ro grado')).not.toBeInTheDocument();
    expect(screen.queryByText('1ro sec.')).not.toBeInTheDocument();
  });

  it('muestra todas las opciones de grado cuando la evaluación no tiene grado asignado', () => {
    const evaluacionSinGrado: Evaluaciones = {
      ...baseEvaluacion,
      grado: undefined,
    };

    render(
      <DirectorFiltrosBar
        {...defaultProps}
        evaluacion={evaluacionSinGrado}
        filtros={{ ...defaultProps.filtros, grado: '' }}
      />
    );

    // El botón debe mostrar "Todos los grados"
    const gradoButton = screen.getByRole('button', { name: /Grado: Todos los grados/i });
    expect(gradoButton).toBeInTheDocument();

    // Al abrir el dropdown
    fireEvent.click(gradoButton);

    // Debe contener "Todos los grados" y opciones adicionales
    expect(screen.getAllByText('Todos los grados').length).toBeGreaterThanOrEqual(1);
    expect(screen.getByText('6to grado')).toBeInTheDocument();
    expect(screen.getByText('1ro grado')).toBeInTheDocument();
  });

  it('llama a onSingleFilterChange cuando se selecciona una opción', () => {
    const onSingleFilterChange = jest.fn();
    render(
      <DirectorFiltrosBar
        {...defaultProps}
        onSingleFilterChange={onSingleFilterChange}
      />
    );

    const gradoButton = screen.getByRole('button', { name: /Grado: 6to grado/i });
    fireEvent.click(gradoButton);

    const option = screen.getByRole('option', { name: /6to grado/i });
    fireEvent.click(option);

    expect(onSingleFilterChange).toHaveBeenCalledWith('grado', '6');
  });

  it('llama a onLimpiarFiltros cuando se hace clic en el botón de restablecer', () => {
    const onLimpiarFiltros = jest.fn();
    render(
      <DirectorFiltrosBar
        {...defaultProps}
        onLimpiarFiltros={onLimpiarFiltros}
      />
    );

    const resetBtn = screen.getByRole('button', { name: /Limpiar Filtros/i });
    fireEvent.click(resetBtn);

    expect(onLimpiarFiltros).toHaveBeenCalledTimes(1);
  });
});
