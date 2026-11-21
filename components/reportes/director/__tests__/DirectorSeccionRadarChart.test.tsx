import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';

jest.mock('@/firebase/firebase.config', () => ({
  db: {},
}));

import {
  DirectorSeccionRadarChart,
  determinarNivelSalonHabilidad,
} from '../DirectorSeccionRadarChart';

// Mock de react-chartjs-2 para Radar
jest.mock('react-chartjs-2', () => ({
  Radar: (props: any) => (
    <div data-testid="mock-radar-chart">
      <div data-testid="radar-labels">{props.data?.labels?.join(',')}</div>
      <div data-testid="radar-datasets-count">{props.data?.datasets?.length}</div>
    </div>
  ),
}));

describe('DirectorSeccionRadarChart', () => {
  const mockCatalogoActuaciones = [
    { order: 1, actuacion: 'Establece relaciones que involucran acciones de juntar y quitar' },
    { order: 2, actuacion: 'Establece relaciones que involucran acciones de reiterar' },
    { order: 3, actuacion: 'Acciones de repartir cantidades en situaciones multiplicativas' },
  ];

  const mockEtapasConfiguradas = [
    { key: 'edi', label: 'Diagnóstica (EDI)' },
    { key: 'ep1', label: 'Proceso 1 (EP1)' },
    { key: 'ep2', label: 'Proceso 2 (EP2)' },
  ];

  const mockActiveStages = {
    edi: true,
    ep1: true,
    ep2: true,
  };

  const mockSeccionData = {
    id: '1',
    label: 'Sección 1° A',
    docenteNombre: 'Profesor Juan',
    totalEstudiantes: 25,
    etapas: {
      edi: {
        etapaKey: 'edi',
        etapaLabel: 'Diagnóstica (EDI)',
        totalParticipantes: 25,
        promedioPuntaje: 11.5,
        promedioPorcentaje: 57.5,
        promedioCorrectas: 11.5,
        maxPuntaje: 20,
        tasaLogroPorActuacion: { 1: 60, 2: 52, 3: 40 },
      },
      ep1: {
        etapaKey: 'ep1',
        etapaLabel: 'Proceso 1 (EP1)',
        totalParticipantes: 25,
        promedioPuntaje: 14.0,
        promedioPorcentaje: 70.0,
        promedioCorrectas: 14.0,
        maxPuntaje: 20,
        tasaLogroPorActuacion: { 1: 75, 2: 68, 3: 45 },
      },
      ep2: {
        etapaKey: 'ep2',
        etapaLabel: 'Proceso 2 (EP2)',
        totalParticipantes: 25,
        promedioPuntaje: 17.0,
        promedioPorcentaje: 85.0,
        promedioCorrectas: 17.0,
        maxPuntaje: 20,
        tasaLogroPorActuacion: { 1: 92, 2: 84, 3: 58 },
      },
    },
    deltaPuntaje: 5.5,
    deltaPorcentaje: 27.5,
  };

  test('calcula correctamente los niveles formativos consolidados del salón', () => {
    expect(determinarNivelSalonHabilidad(90).nombre).toBe('Autonomía');
    expect(determinarNivelSalonHabilidad(75).nombre).toBe('Consolidación');
    expect(determinarNivelSalonHabilidad(55).nombre).toBe('Iniciándose');
    expect(determinarNivelSalonHabilidad(42).nombre).toBe('Por desarrollo');
  });

  test('renderiza el radar con vértices numerados y la tabla de habilidades al lado derecho', () => {
    render(
      <DirectorSeccionRadarChart
        catalogoActuaciones={mockCatalogoActuaciones}
        seccionData={mockSeccionData}
        etapasConfiguradas={mockEtapasConfiguradas}
        activeStages={mockActiveStages}
        seccionLabel="Sección 1° A"
      />
    );

    expect(screen.getByText(/Radar de Competencias y Actuaciones Pedagógicas • Sección 1° A/i)).toBeInTheDocument();
    
    // Vértices del radar limpios: '1,2,3'
    expect(screen.getByTestId('radar-labels')).toHaveTextContent('1,2,3');

    // Tabla de la derecha: columnas presentes
    expect(screen.getByText('Habilidad Evaluada')).toBeInTheDocument();
    expect(screen.getByText(/Estudiantes por Nivel/i)).toBeInTheDocument();
    expect(screen.getByText('Δ')).toBeInTheDocument();

    // Habilidad 1 visible con texto completo
    expect(screen.getByText(/Establece relaciones que involucran acciones de juntar y quitar/i)).toBeInTheDocument();
  });

  test('la tabla no contiene input de buscador y muestra todas las habilidades evaluadas con cabecera propia', () => {
    render(
      <DirectorSeccionRadarChart
        catalogoActuaciones={mockCatalogoActuaciones}
        seccionData={mockSeccionData}
        etapasConfiguradas={mockEtapasConfiguradas}
        activeStages={mockActiveStages}
        seccionLabel="Sección 1° A"
      />
    );

    // No debe existir el buscador
    expect(screen.queryByPlaceholderText(/Buscar habilidad por número o descripción.../i)).not.toBeInTheDocument();

    // Todas las habilidades deben estar presentes
    expect(screen.getByText(/Acciones de repartir cantidades/i)).toBeInTheDocument();
    expect(screen.getByText(/Establece relaciones que involucran acciones de juntar y quitar/i)).toBeInTheDocument();
    expect(screen.getByText(/Matriz de Habilidades Evaluadas \(3\)/i)).toBeInTheDocument();
  });

  test('permite alternar entre Modo Claro y Modo Oscuro mediante el switch interno del radar', () => {
    const handleVariantChange = jest.fn();
    const handleToggleStage = jest.fn();

    render(
      <DirectorSeccionRadarChart
        catalogoActuaciones={mockCatalogoActuaciones}
        seccionData={mockSeccionData}
        etapasConfiguradas={mockEtapasConfiguradas}
        activeStages={mockActiveStages}
        seccionLabel="Sección 1° A"
        onVariantChange={handleVariantChange}
        onToggleStage={handleToggleStage}
      />
    );

    // Inicialmente está en Modo Claro (clásico)
    expect(screen.getByText(/Radar de Competencias y Actuaciones Pedagógicas/i)).toBeInTheDocument();
    const btnModoOscuro = screen.getByRole('button', { name: /Modo Oscuro/i });
    expect(btnModoOscuro).toBeInTheDocument();

    // Clic en el switch para cambiar a Modo Oscuro (el nuevo diseño circular estelar)
    fireEvent.click(btnModoOscuro);

    expect(handleVariantChange).toHaveBeenCalledWith('oscuro');

    // Ahora se renderiza el diseño circular estelar en Modo Oscuro
    expect(screen.getByText(/Radar Circular Estelar de Competencias/i)).toBeInTheDocument();

    // Verifica que los botones de alternar etapa estén presentes con sus checkboxes
    const btnEtapaEDI = screen.getByTitle(/Alternar Diagnóstica \(EDI\)/i);
    expect(btnEtapaEDI).toBeInTheDocument();
    fireEvent.click(btnEtapaEDI);
    expect(handleToggleStage).toHaveBeenCalledWith('edi');

    // Clic en Modo Claro para volver al diseño tradicional
    const btnModoClaro = screen.getByRole('button', { name: /Modo Claro/i });
    fireEvent.click(btnModoClaro);
    expect(handleVariantChange).toHaveBeenCalledWith('claro');
    expect(screen.getByText(/Radar de Competencias y Actuaciones Pedagógicas/i)).toBeInTheDocument();
  });

  test('renderiza directamente la variante oscuro cuando se especifica por prop', () => {
    render(
      <DirectorSeccionRadarChart
        catalogoActuaciones={mockCatalogoActuaciones}
        seccionData={mockSeccionData}
        etapasConfiguradas={mockEtapasConfiguradas}
        activeStages={mockActiveStages}
        seccionLabel="Sección 1° A"
        variant="oscuro"
      />
    );

    expect(screen.getByText(/Radar Circular Estelar de Competencias • Sección 1° A/i)).toBeInTheDocument();
    expect(screen.getByText(/Diseño circular concéntrico con halo de habilidades/i)).toBeInTheDocument();
  });

  test('en Modo Claro renderiza también la cabecera institucional Radar del Aprendizaje', () => {
    render(
      <DirectorSeccionRadarChart
        catalogoActuaciones={mockCatalogoActuaciones}
        seccionData={mockSeccionData}
        etapasConfiguradas={mockEtapasConfiguradas}
        activeStages={mockActiveStages}
        seccionLabel="Sección 1° A"
        variant="claro"
      />
    );

    expect(screen.getByText(/Radar del Aprendizaje · 3 habilidades/i)).toBeInTheDocument();
    expect(screen.getByText(/Tres momentos de aprendizaje, 3 caminos de progreso/i)).toBeInTheDocument();
  });
});
