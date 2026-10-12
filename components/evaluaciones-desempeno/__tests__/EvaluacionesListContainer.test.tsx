import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { EvaluacionesListContainer } from '../containers/EvaluacionesListContainer';

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

const mockEvaluaciones = [
  { id: 'eval-1', name: 'Evaluación de Comprensión Lectora', categoria: 'Primaria', active: true },
  { id: 'eval-2', name: 'Evaluación de Razonamiento Matemático', categoria: 'Secundaria', active: false },
];

jest.mock('@/features/context/GlolbalContext', () => ({
  useGlobalContext: () => ({
    evaluacionDesempeñoDocente: mockEvaluaciones,
    loaderPages: false,
  }),
}));

describe('EvaluacionesListContainer', () => {
  beforeEach(() => {
    jest.clearAllMocks();
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

  it('permite cambiar el estado de la evaluación entre activo e inactivo', () => {
    render(<EvaluacionesListContainer {...defaultProps} />);

    const activeIcon = screen.getByTitle('Evaluación activa (Clic para pausar)');
    fireEvent.click(activeIcon);

    expect(mockUpdateEstadoEvaluacion).toHaveBeenCalledWith('eval-1', false);
  });

  it('oculta el botón de crear, el botón de eliminar y muestra estado de solo lectura si canCreate es falso', () => {
    render(<EvaluacionesListContainer {...defaultProps} canCreate={false} />);

    expect(screen.queryByRole('button', { name: /nueva evaluación/i })).not.toBeInTheDocument();
    expect(screen.queryByTitle('Eliminar evaluación')).not.toBeInTheDocument();
    expect(screen.queryByTitle('Evaluación activa (Clic para pausar)')).not.toBeInTheDocument();
    expect(screen.getByText('Activa')).toBeInTheDocument();
    expect(screen.getByText('Inactiva')).toBeInTheDocument();
  });
});
