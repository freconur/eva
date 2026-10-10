import React from 'react';
import { render, screen, fireEvent, act } from '@testing-library/react';
import { UgelBrechasTab } from '../UgelBrechasTab';

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
        },
      }),
    })
  ),
  collection: jest.fn(),
  query: jest.fn(),
  where: jest.fn(),
  onSnapshot: jest.fn(() => () => {}),
  setDoc: jest.fn(),
  getDocs: jest.fn(() =>
    Promise.resolve({
      empty: false,
      forEach: function (cb: any) {
        this.docs.forEach(cb);
      },
      docs: [
        {
          id: 'dir-1',
          data: () => ({
            id: 'dir-1',
            dniDirector: '11111111',
            region: 13,
            nombreInstitucion: 'I.E. SAN JUAN',
            institucion: 'I.E. SAN JUAN',
            evaluaciones: {
              'eval-ep1-1': {
                estudiantes: [
                  { id: 'est-1', seccion: 'A', respuestas: { p1: 'a', p2: 'b' } },
                ],
              },
            },
          }),
        },
      ],
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
      dni: '99999999',
      rol: 1, // Especialista UGEL
      region: 13, // UGEL San Román
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
        data-testid="mock-ugel-burbujas"
        data-secciones={JSON.stringify(props.metricas?.secciones?.map((s: any) => s.id))}
      >
        <span>Burbujas UGEL Active</span>
      </div>
    );
  };
});

jest.mock('../DirectorDecisionesTab', () => {
  return function MockDecisiones(props: any) {
    return (
      <div
        data-testid="mock-ugel-decisiones"
        data-secciones={JSON.stringify(props.metricas?.secciones?.map((s: any) => s.id))}
      >
        <span>Decisiones UGEL Active</span>
      </div>
    );
  };
});

describe('UgelBrechasTab Component con SegmentedFilterBar', () => {
  const mockEvaluacion: any = {
    id: 'eval-ep1-1',
    nombre: 'Evaluación Progresiva 1 Comunicación',
    grado: 2,
    categoria: 1,
    mesDelExamen: 6,
  };

  const defaultProps: any = {
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
    ],
    preguntasRespuestas: [
      { id: 'p1', order: 1, pregunta: '¿Pregunta 1?', respuesta: 'a' },
      { id: 'p2', order: 2, pregunta: '¿Pregunta 2?', respuesta: 'b' },
    ],
    currentUserData: {
      dni: '99999999',
      rol: 1, // Especialista UGEL
      region: 13,
    },
    yearSelected: 2026,
    monthSelected: 6,
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renderiza la barra segmentada de filtros con Grado, Evaluación e Institución para especialista', async () => {
    await act(async () => {
      render(<UgelBrechasTab {...defaultProps} />);
    });

    // Barra de filtros segmentada y título
    const filterTitles = screen.getAllByText('Filtrar por');
    expect(filterTitles.length).toBeGreaterThan(0);

    // Filtros de Grado, Evaluación e Institución presentes
    expect(screen.getByText(/Grado:/i)).toBeInTheDocument();
    expect(screen.getByText(/Evaluación:/i)).toBeInTheDocument();
    expect(screen.getByText(/Institución:/i)).toBeInTheDocument();

    // No debe mostrar filtro de UGEL para especialista (fijada a su región)
    expect(screen.queryByText(/UGEL:/i)).not.toBeInTheDocument();
  });

  it('muestra filtro de UGEL cuando el usuario es administrador', async () => {
    const adminProps = {
      ...defaultProps,
      currentUserData: {
        dni: '00000000',
        rol: 3, // Administrador
        region: 13,
      },
    };

    await act(async () => {
      render(<UgelBrechasTab {...adminProps} />);
    });

    expect(screen.getByText(/UGEL:/i)).toBeInTheDocument();
  });

  it('permite alternar entre Matriz de Burbujas y Decisiones (UGEL)', async () => {
    await act(async () => {
      render(<UgelBrechasTab {...defaultProps} />);
    });

    const btnDecisiones = screen.getByRole('tab', { name: /Decisiones \(UGEL\)/i });
    await act(async () => {
      fireEvent.click(btnDecisiones);
    });

    expect(screen.getByTestId('mock-ugel-decisiones')).toBeInTheDocument();
    expect(screen.queryByTestId('mock-ugel-burbujas')).not.toBeInTheDocument();

    // En decisiones, el filtro de institución no se muestra
    expect(screen.queryByText(/Institución:/i)).not.toBeInTheDocument();
  });

  it('permite filtrar por institución con showSearch y restablecer con el botón Todas las I.E.', async () => {
    await act(async () => {
      render(<UgelBrechasTab {...defaultProps} />);
    });

    // Abrir dropdown de Institución
    const instBtn = screen.getByRole('button', { name: /Todas las instituciones/i });
    await act(async () => {
      fireEvent.click(instBtn);
    });

    // Debe mostrar input de búsqueda porque showSearch es true
    expect(screen.getByPlaceholderText(/Buscar institución/i)).toBeInTheDocument();

    // Seleccionar I.E. SAN JUAN
    const opcionSanJuan = screen.getByRole('option', { name: /I.E. SAN JUAN/i });
    await act(async () => {
      fireEvent.click(opcionSanJuan);
    });

    // Debe aparecer el botón de restablecer "Todas las I.E."
    const resetBtns = screen.getAllByRole('button', { name: /Todas las I.E./i });
    expect(resetBtns.length).toBeGreaterThan(0);
    const resetBtn = resetBtns[0];

    // Hacer clic en restablecer
    await act(async () => {
      fireEvent.click(resetBtn);
    });

    // Vuelve al estado inicial "Todas las instituciones"
    expect(screen.getByRole('button', { name: /Todas las instituciones/i })).toBeInTheDocument();
  });
});
