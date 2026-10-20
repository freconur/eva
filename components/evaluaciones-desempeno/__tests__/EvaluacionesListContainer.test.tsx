import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { toast } from 'react-toastify';
import { EvaluacionesListContainer } from '../containers/EvaluacionesListContainer';

jest.mock('react-toastify', () => ({
  toast: {
    warning: jest.fn(),
    success: jest.fn(),
    error: jest.fn(),
    info: jest.fn(),
  },
}));

jest.mock('@/firebase/firebase.config', () => ({
  db: {},
  storage: {},
  app: {},
  initAnalytics: jest.fn().mockResolvedValue(null),
}));

jest.mock('firebase/firestore', () => ({
  getFirestore: jest.fn(() => ({})),
  doc: jest.fn(() => ({ id: 'mockDoc' })),
  onSnapshot: jest.fn((_ref, callback) => {
    return jest.fn();
  }),
  setDoc: jest.fn(),
}));

jest.mock('../modals/ModalCrearEvaluacionDesempeno', () => ({
  __esModule: true,
  default: () => <div data-testid="modal-crear">Modal Crear</div>,
}));

jest.mock('@/modals/DeleteEvaluacionDocente', () => ({
  __esModule: true,
  default: () => <div data-testid="modal-delete-docente">Modal Delete Docente</div>,
}));

jest.mock('@/modals/DeleteEvaluacionEscpecialista', () => ({
  __esModule: true,
  default: () => <div data-testid="modal-delete-especialista">Modal Delete Especialista</div>,
}));

jest.mock('@/modals/DeleteEvaluacionDirector', () => ({
  __esModule: true,
  default: () => <div data-testid="modal-delete-director">Modal Delete Director</div>,
}));

const mockGetEvaluaciones = jest.fn(() => jest.fn());
const mockUpdateEstadoEvaluacion = jest.fn().mockResolvedValue(undefined);

jest.mock('@/features/hooks/useEvaluacionDesempenoBase', () => ({
  __esModule: true,
  default: () => ({
    getEvaluaciones: mockGetEvaluaciones,
    updateEstadoEvaluacion: mockUpdateEstadoEvaluacion,
  }),
}));

const mockEvaluaciones: any[] = [
  { id: 'eval-1', name: 'Evaluación de Comprensión Lectora', categoria: 'Primaria', active: true },
  { id: 'eval-2', name: 'Evaluación de Razonamiento Matemático', categoria: 'Secundaria', active: false },
];

let mockCurrentUser: any = undefined;

jest.mock('@/features/context/GlolbalContext', () => ({
  useGlobalContext: () => ({
    evaluacionDesempeñoDocente: mockEvaluaciones,
    loaderPages: false,
    currentUserData: mockCurrentUser,
  }),
}));

describe('EvaluacionesListContainer', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockCurrentUser = undefined;
  });

  const defaultProps = {
    role: 'director' as const,
    title: 'Evaluaciones de Desempeño Docente',
    collectionName: 'evaluaciones-docentes',
    baseDetailRoute: '/directores/evaluaciones-docentes/evaluacion',
    canCreate: true,
  };

  it('renderiza el título, botón de creación y la tabla con las evaluaciones y categorías', () => {
    render(<EvaluacionesListContainer {...defaultProps} />);

    expect(screen.getByText('Evaluaciones de Desempeño Docente')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /nueva evaluación/i })).toBeInTheDocument();
    expect(screen.getByText('Evaluación de Comprensión Lectora')).toBeInTheDocument();
    expect(screen.getByText('Evaluación de Razonamiento Matemático')).toBeInTheDocument();
    expect(screen.getByText('Primaria')).toBeInTheDocument();
    expect(screen.getByText('Secundaria')).toBeInTheDocument();
  });

  it('filtra las evaluaciones dinámicamente según el texto de búsqueda por nombre o categoría', () => {
    render(<EvaluacionesListContainer {...defaultProps} />);

    const searchInput = screen.getByPlaceholderText(/buscar evaluación por nombre/i);
    fireEvent.change(searchInput, { target: { value: 'Secundaria' } });

    expect(screen.queryByText('Evaluación de Comprensión Lectora')).not.toBeInTheDocument();
    expect(screen.getByText('Evaluación de Razonamiento Matemático')).toBeInTheDocument();
    expect(screen.getByText('Secundaria')).toBeInTheDocument();
  });

  it('permite cambiar el estado de la evaluación entre activo e inactivo para administradores', () => {
    render(<EvaluacionesListContainer {...defaultProps} />);

    const activeIcon = screen.getByTitle('Evaluación activa (Clic para pausar)');
    fireEvent.click(activeIcon);

    expect(mockUpdateEstadoEvaluacion).toHaveBeenCalledWith('eval-1', false);
  });

  it('oculta evaluaciones inactivas, oculta botón de crear y eliminar, y muestra badge estático para no administradores', () => {
    render(<EvaluacionesListContainer {...defaultProps} canCreate={false} />);

    // El botón de crear y eliminar no deben mostrarse
    expect(screen.queryByRole('button', { name: /nueva evaluación/i })).not.toBeInTheDocument();
    expect(screen.queryByTitle('Eliminar evaluación')).not.toBeInTheDocument();
    expect(screen.queryByTitle('Evaluación activa (Clic para pausar)')).not.toBeInTheDocument();

    // Solo debe verse la evaluación activa
    expect(screen.getByText('Evaluación de Comprensión Lectora')).toBeInTheDocument();
    expect(screen.getByText('Activa')).toBeInTheDocument();

    // La evaluación inactiva debe estar completamente oculta
    expect(screen.queryByText('Evaluación de Razonamiento Matemático')).not.toBeInTheDocument();
    expect(screen.queryByText('Inactiva')).not.toBeInTheDocument();
  });

  it('permite a un usuario administrador (rol 4) ver evaluaciones inactivas y alternar su estado', () => {
    mockCurrentUser = { rol: 4, dni: '99999999' };
    render(<EvaluacionesListContainer {...defaultProps} canCreate={false} />);

    // Administrador puede ver tanto activa como inactiva
    expect(screen.getByText('Evaluación de Comprensión Lectora')).toBeInTheDocument();
    expect(screen.getByText('Evaluación de Razonamiento Matemático')).toBeInTheDocument();
    expect(screen.getByTitle('Evaluación activa (Clic para pausar)')).toBeInTheDocument();
    expect(screen.getByTitle('Inactiva (Clic para activar)')).toBeInTheDocument();
  });

  it('muestra modal de alerta y bloquea la activación si la evaluación inactiva no tiene fase creada', () => {
    // eval-2 no tiene faseNombre ni fases
    render(<EvaluacionesListContainer {...defaultProps} />);

    const inactiveBtn = screen.getByTitle('Inactiva (Clic para activar)');
    fireEvent.click(inactiveBtn);

    // Debe bloquearse y NO llamar a updateEstadoEvaluacion
    expect(mockUpdateEstadoEvaluacion).not.toHaveBeenCalled();

    // Debe mostrarse el modal informativo
    expect(screen.getByText(/fase de evaluación requerida/i)).toBeInTheDocument();
    expect(
      screen.getByText(/debe crear una fase antes de activar la evaluación/i)
    ).toBeInTheDocument();
    expect(
      screen.getAllByText('Evaluación de Razonamiento Matemático').length
    ).toBeGreaterThanOrEqual(2);

    // Al pulsar "Entendido" se cierra el modal
    const entendidoBtn = screen.getByRole('button', { name: /entendido/i });
    fireEvent.click(entendidoBtn);

    expect(
      screen.queryByText(/debe crear una fase antes de activar la evaluación/i)
    ).not.toBeInTheDocument();
  });

  it('permite activar la evaluación si ya cuenta con una fase configurada', () => {
    // Añadimos fase a eval-2
    mockEvaluaciones[1] = {
      ...mockEvaluaciones[1],
      faseNombre: 'Fase Diagnóstica',
    };

    render(<EvaluacionesListContainer {...defaultProps} />);

    const inactiveBtn = screen.getByTitle('Inactiva (Clic para activar)');
    fireEvent.click(inactiveBtn);

    // Debe llamar a updateEstadoEvaluacion con true
    expect(mockUpdateEstadoEvaluacion).toHaveBeenCalledWith('eval-2', true);
  });
});
