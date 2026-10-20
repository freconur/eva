import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import { EvaluadosDashboardContainer } from '../containers/EvaluadosDashboardContainer';

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
}));

let mockRouter = {
  query: { id: 'eval-doc-123' },
  pathname: '/especialistas/evaluaciones-docentes/evaluacion/[id]/evaluados',
};

jest.mock('next/router', () => ({
  useRouter: () => mockRouter,
}));

const mockGetDataEvaluacion = jest.fn(() => jest.fn());
const mockGetDimensiones = jest.fn(() => jest.fn());
const mockGetPreguntasRespuestas = jest.fn(() => jest.fn());
const mockGetEvaluados = jest.fn(() => jest.fn());
const mockGetParrillaEvaluados = jest.fn().mockResolvedValue([]);
const mockGetHistorialEvaluado = jest.fn().mockResolvedValue([]);
const mockDeleteEvaluadoSession = jest.fn();
const mockUpdateNivelesEvaluacion = jest.fn();

jest.mock('@/features/hooks/useEvaluacionDesempenoBase', () => ({
  __esModule: true,
  default: () => ({
    getDataEvaluacion: mockGetDataEvaluacion,
    getDimensiones: mockGetDimensiones,
    getPreguntasRespuestas: mockGetPreguntasRespuestas,
    getEvaluados: mockGetEvaluados,
    getParrillaEvaluados: mockGetParrillaEvaluados,
    getHistorialEvaluado: mockGetHistorialEvaluado,
    deleteEvaluadoSession: mockDeleteEvaluadoSession,
    updateNivelesEvaluacion: mockUpdateNivelesEvaluacion,
  }),
}));

jest.mock('@/features/hooks/useUsuario', () => ({
  __esModule: true,
  default: () => ({
    getAllEspecialistas: jest.fn(() => jest.fn()),
  }),
}));

const mockEvaluadosDataset = [
  {
    id: 'ses-1',
    dni: '10000001',
    docenteDni: '10000001',
    nombres: 'PrimerDocente',
    apellidos: 'EvaluadoPorMi',
    institucion: 'I.E. San Juan',
    dniDirector: '77889900',
    nombreDirector: 'Director San Juan',
    calificacion: 19,
    cargo: 'Docente Primaria',
    fechaMonitoreo: '15/10/2026',
    faseNombre: 'FASE I',
    evaluadorRol: 'especialista',
    evaluadorDni: '11223344',
    especialistaDni: '11223344',
  },
  {
    id: 'ses-2',
    dni: '20000002',
    docenteDni: '20000002',
    nombres: 'TercerDocente',
    apellidos: 'DeOtroEspecialista',
    institucion: 'I.E. San Juan',
    dniDirector: '77889900',
    nombreDirector: 'Director San Juan',
    calificacion: 15,
    cargo: 'Docente Secundaria',
    fechaMonitoreo: '16/10/2026',
    faseNombre: 'FASE I',
    evaluadorRol: 'especialista',
    evaluadorDni: '99881122',
    especialistaDni: '99881122',
  },
  {
    id: 'ses-3',
    dni: '30000003',
    docenteDni: '30000003',
    nombres: 'CuartoDocente',
    apellidos: 'EvaluadoPorDirector',
    institucion: 'I.E. San Juan',
    dniDirector: '77889900',
    nombreDirector: 'Director San Juan',
    calificacion: 14,
    cargo: 'Docente Primaria',
    fechaMonitoreo: '10/10/2026',
    faseNombre: 'FASE I',
    evaluadorRol: 'director',
    evaluadorDni: '77889900',
    dniDirectorPredecesor: '',
  },
  {
    id: 'ses-4',
    dni: '40000004',
    docenteDni: '40000004',
    nombres: 'SegundoDocente',
    apellidos: 'MonitoreadoPorMi',
    institucion: 'I.E. Santa Rosa',
    dniDirector: '55443322',
    nombreDirector: 'Directora Santa Rosa',
    calificacion: 18,
    cargo: 'Docente Inicial',
    fechaMonitoreo: '18/10/2026',
    faseNombre: 'FASE I',
    evaluadorRol: 'especialista',
    evaluadorDni: '11223344',
    especialistaDni: '11223344',
  },
];

let mockCurrentUser: any = null;

jest.mock('@/features/context/GlolbalContext', () => ({
  useGlobalContext: () => ({
    currentUserData: mockCurrentUser || {
      dni: '11223344',
      nombres: 'Especialista',
      apellidos: 'Autenticado',
      rol: 1,
      institucion: 'UGEL',
    },
    dataEvaluacionDocente: {
      id: 'eval-doc-123',
      name: 'RÚBRICA DE DESEMPEÑO DOCENTE',
      escala: [
        { alternativa: '1', value: 1 },
        { alternativa: '2', value: 2 },
        { alternativa: '3', value: 3 },
        { alternativa: '4', value: 4 },
      ],
      niveles: [
        { nivel: 'Muy Bueno', color: '#10b981', min: 16, max: 20 },
        { nivel: 'Regular', color: '#f59e0b', min: 11, max: 15 },
        { nivel: 'En Inicio', color: '#ef4444', min: 0, max: 10 },
      ],
    },
    loaderPages: false,
    evaluadosEspecialista: mockEvaluadosDataset,
    allEspecialistas: [],
    getPreguntaRespuestaDocentes: [],
    dimensionesEspecialistas: [],
  }),
}));

describe('EvaluadosDashboardContainer - Aislamiento de Evaluados por Monitor', () => {
  beforeEach(() => {
    mockCurrentUser = null;
    mockRouter = {
      query: { id: 'eval-doc-123' },
      pathname: '/especialistas/evaluaciones-docentes/evaluacion/[id]/evaluados',
    };
    jest.clearAllMocks();
  });

  it('aísla los docentes evaluados para Especialista: sólo muestra los evaluados por su propio DNI', async () => {
    mockCurrentUser = {
      dni: '11223344',
      nombres: 'Especialista',
      apellidos: 'Autenticado',
      rol: 1,
    };

    render(
      <EvaluadosDashboardContainer
        id="eval-doc-123"
        collectionName="evaluaciones-docentes"
        role="especialista"
        targetTitle="Docentes Evaluados"
        targetNoun="docentes"
        targetNounSingular="Docente"
        backHref="/especialistas/evaluaciones-docentes/evaluacion/eval-doc-123"
      />
    );

    await waitFor(() => {
      expect(screen.getByText(/PrimerDocente EvaluadoPorMi/i)).toBeInTheDocument();
    });

    expect(screen.getByText(/SegundoDocente MonitoreadoPorMi/i)).toBeInTheDocument();

    // NO debe mostrar el evaluado por el otro especialista ('99881122')
    expect(screen.queryByText(/DeOtroEspecialista/i)).not.toBeInTheDocument();

    // NO debe mostrar el evaluado por el director
    expect(screen.queryByText(/EvaluadoPorDirector/i)).not.toBeInTheDocument();
  });

  it('aísla los docentes evaluados para Administrador: excluye los de otros evaluadores y directores', async () => {
    mockCurrentUser = {
      dni: '11223344',
      nombres: 'Admin',
      apellidos: 'General',
      rol: 4,
    };

    render(
      <EvaluadosDashboardContainer
        id="eval-doc-123"
        collectionName="evaluaciones-docentes"
        role="admin"
        targetTitle="Docentes Evaluados"
        targetNoun="docentes"
        targetNounSingular="Docente"
        backHref="/admin/evaluaciones-docentes/evaluacion/eval-doc-123"
      />
    );

    await waitFor(() => {
      expect(screen.getByText(/PrimerDocente EvaluadoPorMi/i)).toBeInTheDocument();
    });

    expect(screen.getByText(/SegundoDocente MonitoreadoPorMi/i)).toBeInTheDocument();

    // Excluye al de otro especialista y al del director
    expect(screen.queryByText(/DeOtroEspecialista/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/EvaluadoPorDirector/i)).not.toBeInTheDocument();
  });

  it('respeta el filtro por institución combinado con el aislamiento de monitor', async () => {
    mockCurrentUser = {
      dni: '11223344',
      nombres: 'Especialista',
      apellidos: 'Autenticado',
      rol: 1,
    };

    mockRouter = {
      query: { id: 'eval-doc-123', institucion: 'I.E. Santa Rosa' } as any,
      pathname: '/especialistas/evaluaciones-docentes/evaluacion/[id]/evaluados',
    };

    render(
      <EvaluadosDashboardContainer
        id="eval-doc-123"
        collectionName="evaluaciones-docentes"
        role="especialista"
        targetTitle="Docentes Evaluados"
        targetNoun="docentes"
        targetNounSingular="Docente"
        backHref="/especialistas/evaluaciones-docentes/evaluacion/eval-doc-123"
      />
    );

    await waitFor(() => {
      expect(screen.getByText(/SegundoDocente MonitoreadoPorMi/i)).toBeInTheDocument();
    });

    // No debe mostrar el evaluado en 'I.E. San Juan'
    expect(screen.queryByText(/PrimerDocente EvaluadoPorMi/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/DeOtroEspecialista/i)).not.toBeInTheDocument();
  });
});
