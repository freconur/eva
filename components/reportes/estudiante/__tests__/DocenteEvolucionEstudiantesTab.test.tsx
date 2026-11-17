import React from 'react';
import { render, screen, fireEvent, within } from '@testing-library/react';
import { DocenteEvolucionEstudiantesTab } from '../DocenteEvolucionEstudiantesTab';
import { Evaluaciones } from '@/features/types/types';

// Mock de Chart.js y react-chartjs-2
jest.mock('react-chartjs-2', () => ({
  Line: ({ data, options }: any) => (
    <div
      data-testid="mock-line-chart"
      data-spangaps-options={String(options?.spanGaps)}
      data-spangaps-datasets={String(data?.datasets?.every((d: any) => d.spanGaps === true))}
    >
      Line Chart
    </div>
  ),
  Radar: () => <div data-testid="mock-radar-chart">Radar Chart</div>,
}));

// Mock de exportarFichaEvolutivaEstudiantePDF
jest.mock('@/features/utils/exportarFichaEvolutivaEstudiantePDF', () => ({
  exportarFichaEvolutivaEstudiantePDF: jest.fn(),
}));

// Mock del hook useDocenteEvolucionEstudiantes
jest.mock('../useDocenteEvolucionEstudiantes', () => ({
  useDocenteEvolucionEstudiantes: jest.fn(() => ({
    estudiantesEvolutivos: [
      {
        dni: '12345678',
        nombres: 'Juan Carlos',
        apellidos: 'Pérez Ramos',
        nombreCompleto: 'Pérez Ramos Juan Carlos',
        seccion: '1',
        grado: 3,
        puntajeInicial: 8,
        puntajeFinal: 14,
        deltaPuntaje: 6,
        nivelInicial: 'En Inicio',
        nivelFinal: 'En Proceso',
        estadoTrayectoria: 'superacion',
        porcentajeAsistencia: 100,
        diferenciaConAula: 2.5,
        etapas: {
          edi: {
            etapaKey: 'edi',
            label: 'EDI (Diagnóstica)',
            nombreEvaluacion: 'EDI',
            evaluacionId: 'eval-edi',
            puntaje: 8,
            maxPuntaje: 20,
            nivel: 'En Inicio',
            nivelColor: '#ef4444',
            respuestasCorrectas: 8,
            totalPreguntas: 20,
            porcentaje: 40,
          },
          ep1: {
            etapaKey: 'ep1',
            label: 'EP1 (Progresiva 1)',
            nombreEvaluacion: 'EP1',
            evaluacionId: 'eval-ep1',
            puntaje: 14,
            maxPuntaje: 20,
            nivel: 'En Proceso',
            nivelColor: '#f59e0b',
            respuestasCorrectas: 14,
            totalPreguntas: 20,
            porcentaje: 70,
          },
        },
        historial: [
          {
            etapaKey: 'edi',
            label: 'EDI (Diagnóstica)',
            nombreEvaluacion: 'EDI',
            evaluacionId: 'eval-edi',
            puntaje: 8,
            maxPuntaje: 20,
            nivel: 'En Inicio',
            nivelColor: '#ef4444',
            respuestasCorrectas: 8,
            totalPreguntas: 20,
            porcentaje: 40,
          },
          {
            etapaKey: 'ep1',
            label: 'EP1 (Progresiva 1)',
            nombreEvaluacion: 'EP1',
            evaluacionId: 'eval-ep1',
            puntaje: 14,
            maxPuntaje: 20,
            nivel: 'En Proceso',
            nivelColor: '#f59e0b',
            respuestasCorrectas: 14,
            totalPreguntas: 20,
            porcentaje: 70,
          },
        ],
      },
      {
        dni: '87654321',
        nombres: 'María Elena',
        apellidos: 'Gómez Flores',
        nombreCompleto: 'Gómez Flores María Elena',
        seccion: '1',
        grado: 3,
        puntajeInicial: 16,
        puntajeFinal: 12,
        deltaPuntaje: -4,
        nivelInicial: 'Satisfactorio',
        nivelFinal: 'En Proceso',
        estadoTrayectoria: 'alerta',
        porcentajeAsistencia: 100,
        diferenciaConAula: 0.5,
        etapas: {
          edi: {
            etapaKey: 'edi',
            label: 'EDI (Diagnóstica)',
            nombreEvaluacion: 'EDI',
            evaluacionId: 'eval-edi',
            puntaje: 16,
            maxPuntaje: 20,
            nivel: 'Satisfactorio',
            nivelColor: '#10b981',
            respuestasCorrectas: 16,
            totalPreguntas: 20,
            porcentaje: 80,
          },
          ep1: {
            etapaKey: 'ep1',
            label: 'EP1 (Progresiva 1)',
            nombreEvaluacion: 'EP1',
            evaluacionId: 'eval-ep1',
            puntaje: 12,
            maxPuntaje: 20,
            nivel: 'En Proceso',
            nivelColor: '#f59e0b',
            respuestasCorrectas: 12,
            totalPreguntas: 20,
            porcentaje: 60,
          },
        },
        historial: [],
      },
    ],
    etapasConfiguradas: [
      { key: 'edi', id: 'eval-edi', label: 'EDI (Diagnóstica)', order: 1 },
      { key: 'ep1', id: 'eval-ep1', label: 'EP1 (Progresiva 1)', order: 2 },
    ],
    kpis: {
      totalEstudiantes: 2,
      totalSuperacion: 1,
      totalEstable: 0,
      totalAlerta: 1,
      promedioAulaActual: 13.0,
      deltaPromedioAula: 1.0,
      promediosPorEtapa: { edi: 12.0, ep1: 13.0 },
    },
    loading: false,
    error: null,
    refetch: jest.fn(),
  })),
}));

const mockEvaluacion: Evaluaciones = {
  id: 'eval-ep1',
  nombre: 'Evaluación Progresiva 1 - Matemática',
  grado: 3,
  categoria: 1,
  añoDelExamen: '2026',
  mesDelExamen: '6',
  tipoDeEvaluacion: '1',
  active: true,
  cerrada: false,
};

describe('DocenteEvolucionEstudiantesTab Component', () => {
  it('renderiza correctamente las tarjetas de resumen KPI', () => {
    render(
      <DocenteEvolucionEstudiantesTab
        evaluacion={mockEvaluacion}
        dniDocente="12345678"
        currentEstudiantes={[]}
        yearSelected={2026}
        monthSelected={6}
      />
    );

    expect(screen.getByText('Total Evaluados')).toBeInTheDocument();
    expect(screen.getByText('En Superación')).toBeInTheDocument();
    expect(screen.getByText('En Alerta')).toBeInTheDocument();
    expect(screen.getByText('Promedio de Aula')).toBeInTheDocument();
  });

  it('permite buscar y filtrar estudiantes combinando nombre, apellido y DNI en cualquier orden', () => {
    render(
      <DocenteEvolucionEstudiantesTab
        evaluacion={mockEvaluacion}
        dniDocente="12345678"
        currentEstudiantes={[]}
        yearSelected={2026}
        monthSelected={6}
      />
    );

    const searchInput = screen.getByPlaceholderText(/Buscar por nombre, apellido, DNI o combinación/i);
    expect(searchInput).toBeInTheDocument();

    // Búsqueda inteligente multi-criterio combinando apellido, nombre y DNI
    fireEvent.change(searchInput, { target: { value: 'perez juan 12345678' } });
    expect(screen.getAllByText('Pérez Ramos Juan Carlos').length).toBeGreaterThanOrEqual(1);
    expect(screen.queryByText('Gómez Flores María Elena')).not.toBeInTheDocument();

    // Búsqueda en orden inverso con DNI primero
    fireEvent.change(searchInput, { target: { value: '12345678 perez' } });
    expect(screen.getAllByText('Pérez Ramos Juan Carlos').length).toBeGreaterThanOrEqual(1);
    expect(screen.queryByText('Gómez Flores María Elena')).not.toBeInTheDocument();
  });

  it('muestra la Matriz General por defecto sin el título consolidado y con la cabecera ESTUDIANTES', () => {
    render(
      <DocenteEvolucionEstudiantesTab
        evaluacion={mockEvaluacion}
        dniDocente="12345678"
        currentEstudiantes={[]}
        yearSelected={2026}
        monthSelected={6}
      />
    );

    // El título consolidado antiguo debe desaparecer
    expect(screen.queryByText('Matriz Consolidada de Trayectoria Estudiantil')).not.toBeInTheDocument();

    // Muestra la cabecera limpia tipo captura: ESTUDIANTES (2) y la indicación de clic
    expect(screen.getByText('ESTUDIANTES (2)')).toBeInTheDocument();
    expect(screen.getByText('Haz clic para ver ficha')).toBeInTheDocument();
  });

  it('permite alternar entre la vista de Ficha Individual y la Matriz General', () => {
    render(
      <DocenteEvolucionEstudiantesTab
        evaluacion={mockEvaluacion}
        dniDocente="12345678"
        currentEstudiantes={[]}
        yearSelected={2026}
        monthSelected={6}
      />
    );

    const fichaBtn = screen.getByText('Ficha Individual');
    fireEvent.click(fichaBtn);

    // En la vista de Ficha Individual se muestra el gráfico lineal
    expect(screen.getByTestId('mock-line-chart')).toBeInTheDocument();

    const matrixBtn = screen.getByText('Matriz General');
    fireEvent.click(matrixBtn);

    expect(screen.getByText('ESTUDIANTES (2)')).toBeInTheDocument();
  });

  it('abre el modal a pantalla completa mostrando un solo gráfico a la vez y permite alternar a Radar', () => {
    render(
      <DocenteEvolucionEstudiantesTab
        evaluacion={mockEvaluacion}
        dniDocente="12345678"
        currentEstudiantes={[]}
        yearSelected={2026}
        monthSelected={6}
      />
    );

    // Clic en la fila del estudiante
    const studentCell = screen.getByText('Pérez Ramos Juan Carlos');
    fireEvent.click(studentCell);

    // Abre el modal a pantalla completa por delante de todo
    expect(screen.getByRole('button', { name: /Cerrar/i })).toBeInTheDocument();

    // Solo se muestra un gráfico no ambos juntos (no existe "Ambos Gráficos")
    expect(screen.queryByText('Ambos Gráficos')).not.toBeInTheDocument();

    // La barra de capas ya no tiene el texto "Capas:" y tiene botones simplificados EDI y EP1
    expect(screen.queryByText(/Capas:/i)).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: /EDI/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /EP1/i })).toBeInTheDocument();

    // El conmutador de gráficos no muestra texto visible, solo iconos accesibles
    expect(screen.queryByText('Trayectoria (Línea)')).not.toBeInTheDocument();
    expect(screen.queryByText('Actuaciones (Radar)')).not.toBeInTheDocument();

    // Por defecto muestra el gráfico lineal
    expect(screen.getByTestId('mock-line-chart')).toBeInTheDocument();

    // El conmutador permite alternar al gráfico Radar mediante su botón de solo icono
    const radarBtn = screen.getByRole('button', { name: /Actuaciones \(Radar\)/i });
    fireEvent.click(radarBtn);

    // Ahora muestra el gráfico de radar reticular
    expect(screen.getByTestId('mock-radar-chart')).toBeInTheDocument();

    // Cerrar con Escape
    fireEvent.keyDown(window, { key: 'Escape' });
    expect(screen.queryByRole('button', { name: /Cerrar/i })).not.toBeInTheDocument();
  });

  it('permite buscar con el botón Buscar y al dar clic a la lupa de búsqueda restablece y muestra toda la lista de estudiantes', () => {
    render(
      <DocenteEvolucionEstudiantesTab
        evaluacion={mockEvaluacion}
        dniDocente="12345678"
        currentEstudiantes={[]}
        yearSelected={2026}
        monthSelected={6}
      />
    );

    // Existe el botón explícito de búsqueda
    const buscarBtns = screen.getAllByRole('button', { name: /Buscar/i });
    expect(buscarBtns.length).toBeGreaterThanOrEqual(1);

    const searchInput = screen.getByPlaceholderText(/Buscar por nombre, apellido, DNI o combinación/i);
    fireEvent.change(searchInput, { target: { value: 'Perez' } });

    // Solo aparece Juan Carlos Pérez
    expect(screen.getByText('Pérez Ramos Juan Carlos')).toBeInTheDocument();
    expect(screen.queryByText('Gómez Flores María Elena')).not.toBeInTheDocument();

    // Clic en el botón de la lupa de búsqueda restablece y muestra toda la lista
    const lupaBtns = screen.getAllByLabelText('Mostrar toda la lista de estudiantes');
    fireEvent.click(lupaBtns[0]);

    // Se muestra toda la lista de estudiantes nuevamente
    expect(screen.getByText('Pérez Ramos Juan Carlos')).toBeInTheDocument();
    expect(screen.getByText('Gómez Flores María Elena')).toBeInTheDocument();
    expect(screen.getByText('ESTUDIANTES (2)')).toBeInTheDocument();
  });

  it('permite activar el buscador Spotlight centralizado con Ctrl + K y cerrarlo con Escape', () => {
    render(
      <DocenteEvolucionEstudiantesTab
        evaluacion={mockEvaluacion}
        dniDocente="12345678"
        currentEstudiantes={[]}
        yearSelected={2026}
        monthSelected={6}
      />
    );

    // Inicialmente no está abierto el buscador Spotlight
    expect(screen.queryByRole('dialog', { name: /Buscador inteligente de estudiantes/i })).not.toBeInTheDocument();

    // Presionar Ctrl + K
    fireEvent.keyDown(window, { key: 'k', ctrlKey: true });

    // Se abre el Spotlight centrado, amplio y con efecto
    const dialog = screen.getByRole('dialog', { name: /Buscador inteligente de estudiantes/i });
    expect(dialog).toBeInTheDocument();
    expect(dialog.querySelector('.animate-spotlight')).toBeInTheDocument();

    // Muestra todos los estudiantes
    expect(screen.getByText('Todos los estudiantes (2)')).toBeInTheDocument();

    // Filtrar por nombre en el Spotlight
    const spotlightInput = screen.getByPlaceholderText(/Buscar por nombre, apellidos o DNI/i);
    fireEvent.change(spotlightInput, { target: { value: 'Gomez' } });

    expect(within(dialog).getByText(/Gómez Flores María Elena/i)).toBeInTheDocument();

    // Presionar Escape cierra el Spotlight
    fireEvent.keyDown(window, { key: 'Escape' });
    expect(screen.queryByRole('dialog', { name: /Buscador inteligente de estudiantes/i })).not.toBeInTheDocument();
  });

  it('permite buscar y cambiar de estudiante dentro del modal mediante el botón Buscar con Ctrl + K', () => {
    render(
      <DocenteEvolucionEstudiantesTab
        evaluacion={mockEvaluacion}
        dniDocente="12345678"
        currentEstudiantes={[]}
        yearSelected={2026}
        monthSelected={6}
      />
    );

    // Abrir modal haciendo clic en el primer estudiante
    const studentCell = screen.getByText('Pérez Ramos Juan Carlos');
    fireEvent.click(studentCell);

    // En el modal existe el botón Buscar con atajo Ctrl + K
    const modalSearchBtn = screen.getByTitle('Buscar estudiante en toda la lista (Ctrl + K)');
    expect(modalSearchBtn).toBeInTheDocument();

    // Abrir buscador del modal mediante el botón
    fireEvent.click(modalSearchBtn);
    const dialog = screen.getByRole('dialog', { name: /Buscador inteligente de estudiantes/i });
    expect(dialog).toBeInTheDocument();

    // Buscar "Gómez"
    const modalInput = screen.getByPlaceholderText(/Buscar por nombre, apellidos o DNI/i);
    fireEvent.change(modalInput, { target: { value: 'Gomez' } });

    // Seleccionar a María Elena Gómez en la lista
    const verFichaButtons = within(dialog).getAllByRole('button', { name: /Ver Ficha/i });
    fireEvent.click(verFichaButtons[0]);

    // El modal cambia al estudiante seleccionado
    expect(screen.getAllByText('87654321').length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText('87654321').length).toBeGreaterThanOrEqual(1);
  });

  it('configura spanGaps: true en datasets y opciones del gráfico lineal para completar la línea cuando hay etapas sin evaluación', () => {
    render(
      <DocenteEvolucionEstudiantesTab
        evaluacion={mockEvaluacion}
        dniDocente="12345678"
        currentEstudiantes={[]}
        yearSelected={2026}
        monthSelected={6}
      />
    );

    // Abrir modal de evolución de estudiante
    const studentCell = screen.getByText('Pérez Ramos Juan Carlos');
    fireEvent.click(studentCell);

    // El gráfico lineal del modal debe tener spanGaps activado en opciones y datasets
    const lineCharts = screen.getAllByTestId('mock-line-chart');
    expect(lineCharts.length).toBeGreaterThanOrEqual(1);
    const modalLineChart = lineCharts[lineCharts.length - 1];

    expect(modalLineChart).toHaveAttribute('data-spangaps-options', 'true');
    expect(modalLineChart).toHaveAttribute('data-spangaps-datasets', 'true');
  });
});
