import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import {
  DirectorSeccionRadarDarkChart,
  getEvaluacionColor,
} from '../DirectorSeccionRadarDarkChart';

describe('DirectorSeccionRadarDarkChart', () => {
  const mockCatalogoActuaciones = [
    { order: 1, actuacion: 'Establece relaciones que involucran juntar' },
    { order: 2, actuacion: 'Establece relaciones que involucran reiterar' },
    { order: 3, actuacion: 'Acciones de repartir cantidades' },
  ];

  const mockEtapasConfiguradas = [
    { key: 'edi', label: 'EDI (Diagnóstica)' },
    { key: 'ep1', label: 'EP1 (Proceso 1)' },
    { key: 'ep2', label: 'EP2 (Proceso 2)' },
  ];

  const mockActiveStages = {
    edi: true,
    ep1: true,
    ep2: true,
  };

  const mockSeccionData = {
    id: 'sec-1',
    label: '6to A',
    docenteNombre: 'Prof. Laura',
    totalEstudiantes: 25,
    etapas: {
      edi: {
        etapaKey: 'edi',
        etapaLabel: 'EDI (Diagnóstica)',
        totalParticipantes: 25,
        promedioPuntaje: 12.0,
        promedioPorcentaje: 60.0,
        promedioCorrectas: 12.0,
        maxPuntaje: 20,
        tasaLogroPorActuacion: { 1: 50, 2: 60, 3: 40 },
      },
      ep1: {
        etapaKey: 'ep1',
        etapaLabel: 'EP1 (Proceso 1)',
        totalParticipantes: 25,
        promedioPuntaje: 15.0,
        promedioPorcentaje: 75.0,
        promedioCorrectas: 15.0,
        maxPuntaje: 20,
        tasaLogroPorActuacion: { 1: 70, 2: 80, 3: 65 },
      },
      ep2: {
        etapaKey: 'ep2',
        etapaLabel: 'EP2 (Proceso 2)',
        totalParticipantes: 25,
        promedioPuntaje: 18.0,
        promedioPorcentaje: 90.0,
        promedioCorrectas: 18.0,
        maxPuntaje: 20,
        tasaLogroPorActuacion: { 1: 90, 2: 95, 3: 85 },
      },
    },
    deltaPuntaje: 6.0,
    deltaPorcentaje: 30.0,
  };

  test('conserva los colores institucionales para cada evaluación', () => {
    expect(getEvaluacionColor('edi').border).toBe('#2563eb');
    expect(getEvaluacionColor('ep1').border).toBe('#f59e0b');
    expect(getEvaluacionColor('ep2').border).toBe('#10b981');
  });

  test('renderiza el lienzo circular con los badges perimetrales 1, 2, 3', () => {
    render(
      <DirectorSeccionRadarDarkChart
        catalogoActuaciones={mockCatalogoActuaciones}
        seccionData={mockSeccionData}
        etapasConfiguradas={mockEtapasConfiguradas}
        activeStages={mockActiveStages}
        seccionLabel="6to A"
      />
    );

    expect(screen.getByText(/Radar Circular Estelar de Competencias • 6to A/i)).toBeInTheDocument();

    // Badges perimetrales con números
    expect(screen.getByText('1')).toBeInTheDocument();
    expect(screen.getByText('2')).toBeInTheDocument();
    expect(screen.getByText('3')).toBeInTheDocument();

    // Escala concéntrica
    expect(screen.getByText('1.0')).toBeInTheDocument();
    expect(screen.getByText('0.8')).toBeInTheDocument();
    expect(screen.getByText('0.6')).toBeInTheDocument();
    expect(screen.getByText('0.4')).toBeInTheDocument();
    expect(screen.getByText('0.2')).toBeInTheDocument();
    expect(screen.getByText('0.0')).toBeInTheDocument();
  });

  test('permite alternar etapas mediante los checkboxes de la cabecera', () => {
    const handleToggle = jest.fn();

    render(
      <DirectorSeccionRadarDarkChart
        catalogoActuaciones={mockCatalogoActuaciones}
        seccionData={mockSeccionData}
        etapasConfiguradas={mockEtapasConfiguradas}
        activeStages={mockActiveStages}
        seccionLabel="6to A"
        onToggleStage={handleToggle}
      />
    );

    const btnEp1 = screen.getByTitle(/Alternar EP1 \(Proceso 1\)/i);
    fireEvent.click(btnEp1);

    expect(handleToggle).toHaveBeenCalledWith('ep1');
  });

  test('permite abrir y buscar en la tabla lateral de habilidades', () => {
    render(
      <DirectorSeccionRadarDarkChart
        catalogoActuaciones={mockCatalogoActuaciones}
        seccionData={mockSeccionData}
        etapasConfiguradas={mockEtapasConfiguradas}
        activeStages={mockActiveStages}
        seccionLabel="6to A"
      />
    );

    // Inicialmente la tabla está oculta
    expect(screen.queryByPlaceholderText(/Buscar por número o descripción.../i)).not.toBeInTheDocument();

    // Clic en "Ver Tabla"
    const toggleTableBtn = screen.getByRole('button', { name: /Ver Tabla/i });
    fireEvent.click(toggleTableBtn);

    // Ahora la tabla y el buscador están visibles
    const searchInput = screen.getByPlaceholderText(/Buscar por número o descripción.../i);
    expect(searchInput).toBeInTheDocument();

    fireEvent.change(searchInput, { target: { value: 'reiterar' } });
    expect(screen.getByText(/Establece relaciones que involucran reiterar/i)).toBeInTheDocument();
    expect(screen.queryByText(/juntar/i)).not.toBeInTheDocument();
  });

  test('en modo compacto renderiza la cabecera Radar del Aprendizaje y el contenedor con fondo blanco limpio', () => {
    const { container } = render(
      <DirectorSeccionRadarDarkChart
        catalogoActuaciones={mockCatalogoActuaciones}
        seccionData={mockSeccionData}
        etapasConfiguradas={mockEtapasConfiguradas}
        activeStages={mockActiveStages}
        seccionLabel="6to A"
        compact={true}
      />
    );

    // Cabecera institucional estilo captura
    expect(screen.getByText(/Radar del Aprendizaje · 3 habilidades/i)).toBeInTheDocument();
    expect(screen.getByText(/Tres momentos de aprendizaje, 3 caminos de progreso/i)).toBeInTheDocument();

    // Contenedor con clase bg-white
    const whiteContainer = container.querySelector('.bg-white');
    expect(whiteContainer).toBeInTheDocument();
  });
});
