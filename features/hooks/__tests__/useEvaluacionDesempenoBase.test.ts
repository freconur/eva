import { renderHook, act } from '@testing-library/react';
import { useEvaluacionDesempenoBase } from '../useEvaluacionDesempenoBase';
import { addDoc, deleteDoc, doc, updateDoc, collection } from 'firebase/firestore';

// 1. Mocks de Firebase
jest.mock('firebase/firestore', () => ({
  addDoc: jest.fn().mockResolvedValue({ id: 'new-eval-123' }),
  deleteDoc: jest.fn().mockResolvedValue(undefined),
  updateDoc: jest.fn().mockResolvedValue(undefined),
  doc: jest.fn((_db, col, id) => ({ id, path: `${col}/${id}` })),
  collection: jest.fn((_db, path) => ({ path })),
  getDoc: jest.fn().mockResolvedValue({ exists: () => false, data: () => ({}) }),
  getDocs: jest.fn().mockResolvedValue({ empty: true, size: 0, docs: [] }),
  setDoc: jest.fn().mockResolvedValue(undefined),
  onSnapshot: jest.fn((_ref, cb) => {
    cb({
      forEach: jest.fn(),
      docs: [],
    });
    return jest.fn(); // Unsubscribe mock
  }),
  query: jest.fn((col) => col),
  where: jest.fn(),
  orderBy: jest.fn(),
  arrayUnion: jest.fn((val) => val),
  serverTimestamp: jest.fn(() => 'TIMESTAMP_MOCK'),
}));

jest.mock('firebase/storage', () => ({
  ref: jest.fn(),
  uploadBytes: jest.fn().mockResolvedValue({}),
  getDownloadURL: jest.fn().mockResolvedValue('https://storage.mock/file.pdf'),
  deleteObject: jest.fn().mockResolvedValue(undefined),
}));

jest.mock('@/firebase/firebase.config', () => ({
  db: {},
  storage: {},
}));

const mockDispatch = jest.fn();
jest.mock('@/features/context/GlolbalContext', () => ({
  useGlobalContext: () => ({
    currentUserData: { dni: '12345678', rol: 2, region: 1 },
    dataEvaluacionDocente: {
      escala: [
        { value: 0, alternativa: '0', descripcion: 'No evidencia' },
        { value: 1, alternativa: '1', descripcion: 'En proceso' },
        { value: 2, alternativa: '2', descripcion: 'Logrado' },
      ],
    },
  }),
  useGlobalContextDispatch: () => mockDispatch,
}));

describe('useEvaluacionDesempenoBase', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('determina la colección por defecto según el rol especificado', () => {
    // Si role es especialista -> evaluaciones-especialista
    const { result: resEspecialista } = renderHook(() =>
      useEvaluacionDesempenoBase({ role: 'especialista' })
    );
    expect(resEspecialista.current.collectionName).toBe('evaluaciones-especialista');

    // Si role es director -> evaluaciones-docentes
    const { result: resDirector } = renderHook(() =>
      useEvaluacionDesempenoBase({ role: 'director' })
    );
    expect(resDirector.current.collectionName).toBe('evaluaciones-docentes');
  });

  it('permite sobrescribir el collectionName explícitamente', () => {
    const { result } = renderHook(() =>
      useEvaluacionDesempenoBase({ collectionName: 'evaluaciones-personalizadas' })
    );
    expect(result.current.collectionName).toBe('evaluaciones-personalizadas');
  });

  it('calcula la calificación sumando valores de alternativas seleccionadas', () => {
    const { result } = renderHook(() => useEvaluacionDesempenoBase());

    const mockPreguntas: any = [
      {
        id: '1',
        alternativas: [
          { value: 0, alternativa: '0', selected: false },
          { value: 1, alternativa: '1', selected: false },
          { value: 2, alternativa: '2', selected: true }, // 2 pts
        ],
      },
      {
        id: '2',
        alternativas: [
          { value: 0, alternativa: '0', selected: false },
          { value: 1, alternativa: '1', selected: true }, // 1 pt
          { value: 2, alternativa: '2', selected: false },
        ],
      },
    ];

    const escala = [
      { value: 0, alternativa: '0' },
      { value: 1, alternativa: '1' },
      { value: 2, alternativa: '2' },
    ];

    const calificacion = result.current.calcularCalificacion(mockPreguntas, escala);
    expect(calificacion).toBe(3);
  });

  it('crea una evaluación en la colección correspondiente', async () => {
    const { result } = renderHook(() =>
      useEvaluacionDesempenoBase({ role: 'director' })
    );

    let idGenerado;
    await act(async () => {
      idGenerado = await result.current.createEvaluacion({
        name: 'Monitoreo Pedagógico 2026',
        tipoDeEvaluacion: '1',
      });
    });

    expect(collection).toHaveBeenCalledWith({}, 'evaluaciones-docentes');
    expect(addDoc).toHaveBeenCalled();
    expect(idGenerado).toBe('new-eval-123');
  });

  it('actualiza el estado activo/inactivo de la evaluación', async () => {
    const { result } = renderHook(() =>
      useEvaluacionDesempenoBase({ collectionName: 'evaluaciones-docentes' })
    );

    await act(async () => {
      await result.current.updateEstadoEvaluacion('eval-123', true);
    });

    expect(doc).toHaveBeenCalledWith({}, 'evaluaciones-docentes', 'eval-123');
    expect(updateDoc).toHaveBeenCalledWith(expect.anything(), { active: true });
  });

  it('elimina la evaluación llamando a deleteDoc', async () => {
    const { result } = renderHook(() =>
      useEvaluacionDesempenoBase({ collectionName: 'evaluaciones-docentes' })
    );

    await act(async () => {
      await result.current.deleteEvaluacion('eval-123');
    });

    expect(deleteDoc).toHaveBeenCalled();
  });

  it('obtiene el padrón de evaluados filtrado por región para especialistas', async () => {
    const { result } = renderHook(() =>
      useEvaluacionDesempenoBase({ role: 'especialista' })
    );

    await act(async () => {
      const directores = await result.current.getParrillaEvaluados('region', 2);
      expect(Array.isArray(directores)).toBe(true);
    });

    expect(collection).toHaveBeenCalledWith({}, 'usuarios');
  });

  it('permite a un especialista regional consultar todas las regiones sin restricción', async () => {
    const { result } = renderHook(() =>
      useEvaluacionDesempenoBase({ role: 'especialista' })
    );

    await act(async () => {
      const directores = await result.current.getParrillaEvaluados('region', 'all');
      expect(Array.isArray(directores)).toBe(true);
    });

    expect(collection).toHaveBeenCalledWith({}, 'usuarios');
  });

  it('obtiene el padrón de especialistas para administradores', async () => {
    const { result } = renderHook(() =>
      useEvaluacionDesempenoBase({ role: 'admin' })
    );

    await act(async () => {
      const especialistas = await result.current.getParrillaEvaluados('region', 'all');
      expect(Array.isArray(especialistas)).toBe(true);
    });

    expect(collection).toHaveBeenCalledWith({}, 'usuarios');
  });
});
