import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import EvaluacionDetalleEspecialista from '@/pages/admin/especialistas/evaluaciones-especialistas/evaluacion/[id]';

jest.mock('@/firebase/firebase.config', () => ({
  db: {},
  storage: {},
  app: {},
  initAnalytics: jest.fn().mockResolvedValue(null),
}));

jest.mock('firebase/auth', () => ({
  getAuth: jest.fn(() => ({})),
  onAuthStateChanged: jest.fn(),
}));

jest.mock('firebase/firestore', () => ({
  getFirestore: jest.fn(() => ({})),
  doc: jest.fn(() => ({ id: 'mockDoc' })),
  collection: jest.fn(() => ({})),
  onSnapshot: jest.fn(() => jest.fn()),
  setDoc: jest.fn(),
  deleteDoc: jest.fn(),
  updateDoc: jest.fn(),
  query: jest.fn(() => ({})),
  where: jest.fn(),
  getDocs: jest.fn().mockResolvedValue({
    docs: [],
    forEach: jest.fn(),
  }),
}));

jest.mock('next/router', () => ({
  useRouter: () => ({
    query: { id: 'eval-esp-123' },
    pathname: '/admin/especialistas/evaluaciones-especialistas/evaluacion/[id]',
  }),
}));

const mockGetDataEvaluacion = jest.fn();
const mockGetPreguntasRespuestasEspecialistas = jest.fn();
const mockGetDimensionesEspecialistas = jest.fn();
const mockGetEspecialistasEvaluados = jest.fn();
const mockDeletePreguntaRespuestaEspecialista = jest.fn();
const mockDeleteDimensionEspecialista = jest.fn();
const mockUpdateActivacionEvidencias = jest.fn();

jest.mock('@/features/hooks/UseEvaluacionEspecialistas', () => ({
  __esModule: true,
  default: () => ({
    getDataEvaluacion: mockGetDataEvaluacion,
    getPreguntasRespuestasEspecialistas: mockGetPreguntasRespuestasEspecialistas,
    getDimensionesEspecialistas: mockGetDimensionesEspecialistas,
    getEspecialistasEvaluados: mockGetEspecialistasEvaluados,
    deletePreguntaRespuestaEspecialista: mockDeletePreguntaRespuestaEspecialista,
    deleteDimensionEspecialista: mockDeleteDimensionEspecialista,
    updateActivacionEvidencias: mockUpdateActivacionEvidencias,
  }),
}));

const mockEspecialistasPadron = [
  {
    dni: '10000001',
    nombres: 'Juan',
    apellidos: 'Perez',
    region: 1, // Puno
    cargo: 'Especialista de Comunicación',
    rol: 1,
  },
  {
    dni: '10000002',
    nombres: 'Rosa',
    apellidos: 'Quispe',
    region: 2, // San Román
    cargo: 'Especialista de Matemática',
    rol: 1,
  },
];

const mockGetParrillaEvaluados = jest.fn().mockResolvedValue(mockEspecialistasPadron);

jest.mock('@/features/hooks/useEvaluacionDesempenoBase', () => ({
  __esModule: true,
  default: () => ({
    getParrillaEvaluados: mockGetParrillaEvaluados,
  }),
}));

const mockCurrentUser = {
  dni: '99999999',
  nombres: 'Admin',
  apellidos: 'Principal',
  rol: 4,
};

// Evaluaciones en la BD: una hecha por 99999999 (Juan Perez) y otra hecha por 88888888 (Rosa Quispe)
const mockEvaluadosEspecialista = [
  {
    id: 'eval-juan',
    especialistaDni: '10000001',
    dni: '10000001',
    evaluadorDni: '99999999', // Evaluado por el usuario actual
    calificacion: 18,
    fechaMonitoreo: '15/10/2026',
  },
  {
    id: 'eval-rosa',
    especialistaDni: '10000002',
    dni: '10000002',
    evaluadorDni: '88888888', // Evaluado por OTRO usuario
    calificacion: 15,
    fechaMonitoreo: '16/10/2026',
  },
];

jest.mock('@/features/context/GlolbalContext', () => ({
  useGlobalContext: () => ({
    currentUserData: mockCurrentUser,
    dataEvaluacionDocente: {
      id: 'eval-esp-123',
      name: 'Evaluación del Desempeño del Especialista 2026',
      descripcion: 'Monitoreo a especialistas',
      niveles: [
        { nivel: 'Destacado', minimo: 18, maximo: 20 },
        { nivel: 'Satisfactorio', minimo: 14, maximo: 17 },
      ],
    },
    dimensionesEspecialistas: [],
    getPreguntaRespuestaDocentes: [],
    evaluadosEspecialista: mockEvaluadosEspecialista,
    loaderPages: false,
  }),
}));

describe('EvaluacionDetalleEspecialista', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders correctly and isolates evaluations: only evaluations done by current user appear as evaluado', async () => {
    render(<EvaluacionDetalleEspecialista />);

    await waitFor(() => {
      expect(screen.getByText(/JUAN PEREZ/i)).toBeInTheDocument();
      expect(screen.getByText(/ROSA QUISPE/i)).toBeInTheDocument();
    });

    // Juan Perez was evaluated by 99999999 -> Must show Evaluado (18 pts)
    expect(screen.getByText(/Evaluado \(18 pts\)/i)).toBeInTheDocument();

    // Rosa Quispe was evaluated by 88888888 (different user) -> Must show Pendiente for current user
    expect(screen.getAllByText(/Pendiente/i).length).toBeGreaterThan(0);

    // Evaluados metric count must be 1, not 2
    const evaluadosButtons = screen.getAllByRole('button', { name: /Evaluados/i });
    expect(evaluadosButtons.length).toBeGreaterThan(0);
    expect(evaluadosButtons[0]).toHaveTextContent('1');
  });

  it('groups specialists by UGEL accordions and allows switching view modes', async () => {
    render(<EvaluacionDetalleEspecialista />);

    await waitFor(() => {
      expect(screen.getByText(/JUAN PEREZ/i)).toBeInTheDocument();
    });

    // Both UGELs must be rendered in accordions
    expect(screen.getByRole('heading', { name: 'UGEL Puno' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'UGEL San Román' })).toBeInTheDocument();

    // View switcher buttons
    expect(screen.getByText('Por UGEL')).toBeInTheDocument();
    expect(screen.getByText('Lista General')).toBeInTheDocument();

    // Switch to Lista General
    const listaBtn = screen.getByText('Lista General');
    fireEvent.click(listaBtn);
    expect(screen.getByText(/JUAN PEREZ/i)).toBeInTheDocument();
    expect(screen.getByText(/ROSA QUISPE/i)).toBeInTheDocument();

    // Switch back to Por UGEL
    const ugelBtn = screen.getByText('Por UGEL');
    fireEvent.click(ugelBtn);
    expect(screen.getByRole('heading', { name: 'UGEL Puno' })).toBeInTheDocument();
  });

  it('filters by state: Evaluados only shows specialists evaluated by current user', async () => {
    render(<EvaluacionDetalleEspecialista />);

    await waitFor(() => {
      expect(screen.getByText(/JUAN PEREZ/i)).toBeInTheDocument();
    });

    // Click on "Evaluados" filter in the filter bar
    const evaluadosFilterBtns = screen.getAllByRole('button', { name: /Evaluados/i });
    // The filter button in the filter bar
    fireEvent.click(evaluadosFilterBtns[evaluadosFilterBtns.length - 1]);

    // Juan Perez was evaluated by current user -> must appear
    expect(screen.getByText(/JUAN PEREZ/i)).toBeInTheDocument();

    // Rosa Quispe was evaluated by another user -> must NOT appear under Evaluados filter
    expect(screen.queryByText(/ROSA QUISPE/i)).not.toBeInTheDocument();
  });
});
