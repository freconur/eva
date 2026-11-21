import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import {
  DirectorSeccionDianaPolarChart,
  getTasaLogroLevel,
} from '../DirectorSeccionDianaPolarChart';

describe('DirectorSeccionDianaPolarChart', () => {
  const mockCatalogoActuaciones = [
    { order: 1, actuacion: 'Identifica información explícita' },
    { order: 2, actuacion: 'Infiere e interpreta hechos' },
    { order: 3, actuacion: 'Reflexiona y evalúa el contenido' },
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
        tasaLogroPorActuacion: { 1: 44, 2: 60, 3: 52 },
      },
      ep1: {
        etapaKey: 'ep1',
        etapaLabel: 'Proceso 1 (EP1)',
        totalParticipantes: 25,
        promedioPuntaje: 14.0,
        promedioPorcentaje: 70.0,
        promedioCorrectas: 14.0,
        maxPuntaje: 20,
        tasaLogroPorActuacion: { 1: 68, 2: 76, 3: 72 },
      },
      ep2: {
        etapaKey: 'ep2',
        etapaLabel: 'Proceso 2 (EP2)',
        totalParticipantes: 25,
        promedioPuntaje: 17.0,
        promedioPorcentaje: 85.0,
        promedioCorrectas: 17.0,
        maxPuntaje: 20,
        tasaLogroPorActuacion: { 1: 88, 2: 92, 3: 84 },
      },
    },
    deltaPuntaje: 5.5,
    deltaPorcentaje: 27.5,
  };

  test('calcula correctamente los niveles pedagógicos según tasa porcentual', () => {
    expect(getTasaLogroLevel(95).key).toBe('destacado');
    expect(getTasaLogroLevel(80).key).toBe('logrado');
    expect(getTasaLogroLevel(65).key).toBe('proceso');
    expect(getTasaLogroLevel(40).key).toBe('inicio');
  });

  test('renderiza la Diana Polar con título de sección y leyenda', () => {
    render(
      <DirectorSeccionDianaPolarChart
        catalogoActuaciones={mockCatalogoActuaciones}
        seccionData={mockSeccionData}
        etapasConfiguradas={mockEtapasConfiguradas}
        activeStages={mockActiveStages}
        seccionLabel="Sección 1° A"
      />
    );

    expect(screen.getByText(/Diana Polar de Logro y Progresión • Sección 1° A/i)).toBeInTheDocument();
    expect(screen.getByText(/3 criterios evaluados/i)).toBeInTheDocument();
    expect(screen.getByText(/< 50% Inicio/i)).toBeInTheDocument();
    expect(screen.getByText(/≥ 90% Destacado/i)).toBeInTheDocument();
  });

  test('permite seleccionar un criterio al hacer clic en la tabla y muestra su detalle', () => {
    render(
      <DirectorSeccionDianaPolarChart
        catalogoActuaciones={mockCatalogoActuaciones}
        seccionData={mockSeccionData}
        etapasConfiguradas={mockEtapasConfiguradas}
        activeStages={mockActiveStages}
        seccionLabel="Sección 1° A"
      />
    );

    // Clic en la fila del criterio 1
    const criterio1Row = screen.getByText('Identifica información explícita');
    fireEvent.click(criterio1Row);

    // Debe mostrar la cabecera del criterio seleccionado
    expect(screen.getByText(/Criterio N° 1 seleccionado/i)).toBeInTheDocument();
    expect(screen.getByText(/✕ Ver resumen del aula/i)).toBeInTheDocument();

    // Al hacer clic en volver a ver el resumen del aula
    fireEvent.click(screen.getByText(/✕ Ver resumen del aula/i));
    expect(screen.queryByText(/Criterio N° 1 seleccionado/i)).not.toBeInTheDocument();
  });
});
