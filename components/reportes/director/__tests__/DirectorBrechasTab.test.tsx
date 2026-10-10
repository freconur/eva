import React from 'react';
import { render, screen, fireEvent, act } from '@testing-library/react';
import DirectorBrechasTab from '../DirectorBrechasTab';
import { DirectorMetricasResumen } from '../types';

// Mock de Firestore
jest.mock('firebase/firestore', () => ({
  getFirestore: jest.fn(() => ({})),
  doc: jest.fn(),
  getDoc: jest.fn(() =>
    Promise.resolve({
      exists: () => true,
      data: () => ({
        grados: {
          '2_1': { ediId: 'eval-edi-1', ep1Id: 'eval-ep1-1', ep2Id: 'eval-ep2-1' },
          '2_2': { ediId: 'eval-edi-2', ep1Id: 'eval-ep1-2' },
          '3_1': { ediId: 'eval-edi-3-1', ep1Id: 'eval-ep1-3-1' },
        },
      }),
    })
  ),
  collection: jest.fn(),
  query: jest.fn(),
  onSnapshot: jest.fn(() => () => {}),
  setDoc: jest.fn(),
  getDocs: jest.fn(() =>
    Promise.resolve({
      forEach: jest.fn(),
      docs: [],
    })
  ),
  orderBy: jest.fn(),
}));

// Mock de Firebase Functions
jest.mock('firebase/functions', () => ({
  getFunctions: jest.fn(() => ({})),
  httpsCallable: jest.fn(() => () =>
    Promise.resolve({ data: { success: true, estudiantes: [] } })
  ),
}));

// Mock del contexto global
jest.mock('@/features/context/GlolbalContext', () => ({
  useGlobalContext: () => ({
    currentUserData: {
      dni: '12345678',
      rol: 2,
      institucion: 'IE 123',
    },
    categorias: [
      { id: 1, categoria: 'LEE DIVERSOS TIPOS DE TEXTOS' },
      { id: 2, categoria: 'RESUELVE PROBLEMAS DE CANTIDAD' },
    ],
  }),
}));

// Mock de componentes secundarios
jest.mock('../DirectorBurbujasTab', () => {
  return function MockBurbujas(props: any) {
    return (
      <div
        data-testid="mock-director-burbujas"
        data-secciones={JSON.stringify(props.metricas?.secciones?.map((s: any) => s.id))}
      >
        <span>Burbujas Active</span>
      </div>
    );
  };
});

jest.mock('../DirectorDecisionesTab', () => {
  return function MockDecisiones(props: any) {
    return (
      <div
        data-testid="mock-director-decisiones"
        data-secciones={JSON.stringify(props.metricas?.secciones?.map((s: any) => s.id))}
      >
        <span>Decisiones Active</span>
      </div>
    );
  };
});

describe('DirectorBrechasTab Component - Aislamiento Local', () => {
  const mockEvaluacion: any = {
    id: 'eval-ep1-1',
    nombre: 'Evaluación Progresiva 1 Comunicación',
    grado: 2,
    categoria: 1,
    mesDelExamen: 6,
  };

  const mockMetricas: DirectorMetricasResumen = {
    secciones: [
      {
        id: 'A',
        nombre: 'Sección A',
        docenteNombre: 'Profesor Uno',
        totalEstudiantes: 25,
        preguntas: {},
        avgPrev: 40,
        criticas: 2,
        altas: 1,
        medias: 1,
        bajas: 0,
        topPregunta: null,
        nivelRiesgo: { label: 'Crítico', icon: '', bg: '#fee2e2', text: '#991b1b', color: '#ef4444' },
      },
      {
        id: 'B',
        nombre: 'Sección B',
        docenteNombre: 'Profesor Dos',
        totalEstudiantes: 20,
        preguntas: {},
        avgPrev: 20,
        criticas: 0,
        altas: 0,
        medias: 2,
        bajas: 2,
        topPregunta: null,
        nivelRiesgo: { label: 'Medio', icon: '', bg: '#fef9c3', text: '#854d0e', color: '#eab308' },
      },
    ],
    totalIe: {
      id: 'total_ie',
      nombre: 'CONSOLIDADO I.E.',
      docenteNombre: 'Toda la IE',
      totalEstudiantes: 45,
      preguntas: {},
      avgPrev: 31,
      criticas: 2,
      altas: 1,
      medias: 3,
      bajas: 2,
      topPregunta: null,
      nivelRiesgo: { label: 'Medio', icon: '', bg: '#fef9c3', text: '#854d0e', color: '#eab308' },
    },
    sortedPreguntas: [
      { id: 'p1', order: 1, pregunta: '¿Pregunta 1?', respuesta: 'a' },
      { id: 'p2', order: 2, pregunta: '¿Pregunta 2?', respuesta: 'b' },
    ],
    kpis: {
      totalCritico: 2,
      totalAlto: 1,
      totalMedio: 3,
      totalBajo: 2,
      avgPrev: 31,
    },
    activeBaremo: { critico: 60, alto: 45, medio: 25 },
  };

  const mockOnSelectEvaluacion = jest.fn();
  const mockOnSelectGrado = jest.fn();

  const defaultProps: any = {
    metricas: mockMetricas,
    preguntas: mockMetricas.sortedPreguntas,
    evaluacion: mockEvaluacion,
    evaluacionesDb: [
      mockEvaluacion,
      {
        id: 'eval-edi-1',
        nombre: 'Evaluación Diagnóstica Comunicación',
        grado: 2,
        categoria: 1,
        mesDelExamen: 3,
      },
      {
        id: 'eval-ep2-1',
        nombre: 'Evaluación Progresiva 2 Comunicación',
        grado: 2,
        categoria: 1,
        mesDelExamen: 11,
      },
      {
        id: 'eval-ep1-3-1',
        nombre: 'Evaluación 3° Grado',
        grado: 3,
        categoria: 1,
        mesDelExamen: 6,
      },
    ],
    initialGrado: 2,
    initialSeccion: 'all',
    isLoadingData: false,
    onSelectEvaluacion: mockOnSelectEvaluacion,
    onSelectGrado: mockOnSelectGrado,
    onOpenQuestionDetail: jest.fn(),
    onOpenGuiaBurbujas: jest.fn(),
    onOpenGuiaDecisiones: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renderiza la vista inicial con Matriz de Burbujas y los filtros de Grado, Evaluación y Sección', async () => {
    await act(async () => {
      render(<DirectorBrechasTab {...defaultProps} />);
    });

    expect(screen.getByRole('tab', { name: /Matriz de Burbujas/i })).toBeInTheDocument();
    expect(screen.getByRole('tab', { name: /Decisiones/i })).toBeInTheDocument();
    expect(screen.getByTestId('mock-director-burbujas')).toBeInTheDocument();

    // Filtros presentes
    expect(screen.getByText(/Grado:/i)).toBeInTheDocument();
    expect(screen.getByText(/Evaluación:/i)).toBeInTheDocument();
    expect(screen.getByText(/Sección:/i)).toBeInTheDocument();
  });

  it('permite alternar entre Matriz de Burbujas y Decisiones', async () => {
    await act(async () => {
      render(<DirectorBrechasTab {...defaultProps} />);
    });

    const btnDecisiones = screen.getByRole('tab', { name: /Decisiones/i });
    await act(async () => {
      fireEvent.click(btnDecisiones);
    });

    expect(screen.getByTestId('mock-director-decisiones')).toBeInTheDocument();
    expect(screen.queryByTestId('mock-director-burbujas')).not.toBeInTheDocument();
  });

  it('el filtro de sección afecta localmente a las métricas sin invocar callbacks del padre', async () => {
    await act(async () => {
      render(<DirectorBrechasTab {...defaultProps} />);
    });

    // Inicialmente muestra todas las secciones ('A' y 'B')
    const burbujasEl = screen.getByTestId('mock-director-burbujas');
    expect(JSON.parse(burbujasEl.getAttribute('data-secciones')!)).toEqual(['A', 'B']);

    // Abrir dropdown de Sección y seleccionar "Sección A"
    const seccionBtn = screen.getByRole('button', { name: /Todas las secciones/i });
    await act(async () => {
      fireEvent.click(seccionBtn);
    });

    const opcionSeccionA = screen.getByRole('option', { name: /Sección A/i });
    await act(async () => {
      fireEvent.click(opcionSeccionA);
    });

    // Ahora sólo debe mostrar la sección 'A' en Burbujas
    const burbujasFiltrado = screen.getByTestId('mock-director-burbujas');
    expect(JSON.parse(burbujasFiltrado.getAttribute('data-secciones')!)).toEqual(['A']);

    // Verifica que NO se llamó a los callbacks globales del padre
    expect(mockOnSelectEvaluacion).not.toHaveBeenCalled();
    expect(mockOnSelectGrado).not.toHaveBeenCalled();
  });

  it('cambiar de Grado o de Evaluación no altera el estado global ni invoca onSelectEvaluacion / onSelectGrado', async () => {
    await act(async () => {
      render(<DirectorBrechasTab {...defaultProps} />);
    });

    // 1. Cambiar Etapa de Evaluación (ej. a EDI)
    const evalBtn = screen.getByRole('button', { name: /EP1 · Progresiva 1/i });
    await act(async () => {
      fireEvent.click(evalBtn);
    });

    const opcionEdi = screen.getByRole('option', { name: /EDI · Diagnóstica/i });
    await act(async () => {
      fireEvent.click(opcionEdi);
    });

    // 2. Cambiar Grado (ej. a 3° Primaria)
    const gradoBtn = screen.getByRole('button', { name: /2° Primaria/i });
    await act(async () => {
      fireEvent.click(gradoBtn);
    });

    const opcionGrado3 = screen.getByRole('option', { name: /3° Primaria/i });
    await act(async () => {
      fireEvent.click(opcionGrado3);
    });

    // IMPORTANTE: Ni onSelectEvaluacion ni onSelectGrado deben haber sido invocados
    expect(mockOnSelectEvaluacion).not.toHaveBeenCalled();
    expect(mockOnSelectGrado).not.toHaveBeenCalled();
  });
});
