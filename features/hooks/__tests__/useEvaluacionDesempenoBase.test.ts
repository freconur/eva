import { renderHook, act } from '@testing-library/react';
import { useEvaluacionDesempenoBase } from '../useEvaluacionDesempenoBase';
import { addDoc, deleteDoc, doc, updateDoc, collection, setDoc, where } from 'firebase/firestore';

// 1. Mocks de Firebase
jest.mock('firebase/firestore', () => ({
  addDoc: jest.fn().mockResolvedValue({ id: 'new-eval-123' }),
  deleteDoc: jest.fn().mockResolvedValue(undefined),
  updateDoc: jest.fn().mockResolvedValue(undefined),
  doc: jest.fn((...args: any[]) => ({
    id: args.length === 1 ? 'mock-generated-session-id' : args[2] || 'mock-doc-id',
    path: args.length === 1 ? `${args[0]?.path}/mock-generated-session-id` : `${args[1]}/${args[2]}`,
  })),
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
  where: jest.fn((field, op, val) => ({ field, op, val })),
  or: jest.fn((...conditions) => ({ conditions })),
  orderBy: jest.fn(),
  limit: jest.fn((n) => n),
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

let mockCurrentUser: any = { dni: '12345678', rol: 2, region: 1 };
const mockDispatch = jest.fn();
jest.mock('@/features/context/GlolbalContext', () => ({
  useGlobalContext: () => ({
    currentUserData: mockCurrentUser,
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

  it('guarda evaluación de docente por un especialista con trazabilidad completa para el director', async () => {
    mockCurrentUser = { dni: '87654321', rol: 1, region: 1, nombres: 'Especialista', apellidos: 'Puno' };

    const { result } = renderHook(() =>
      useEvaluacionDesempenoBase({
        role: 'especialista',
        collectionName: 'evaluaciones-docentes',
      })
    );

    const mockEvaluado = {
      dni: '70000001',
      nombres: 'Docente Juan',
      apellidos: 'Pérez',
      dniDirector: '20000002',
    };

    await act(async () => {
      await result.current.guardarEvaluacion(
        'eval-doc-999',
        [],
        mockEvaluado as any,
        [],
        '2026-10-18',
        '08:00',
        '09:30',
        { dni: '87654321' },
        'EVALUACIÓN DE PRUEBA'
      );
    });

    expect(setDoc).toHaveBeenCalledWith(
      expect.anything(),
      expect.objectContaining({
        docenteDni: '70000001',
        dniDirector: '20000002',
        especialistaDni: '87654321',
        evaluadorDni: '87654321',
        evaluadorRol: 'especialista',
        tipoMonitoreo: 'acompaniamiento_pedagogico',
      }),
      expect.anything()
    );
  });

  it('guarda evaluación de docente por un administrador con trazabilidad completa', async () => {
    mockCurrentUser = { dni: '11223344', rol: 4, region: 1 };

    const { result } = renderHook(() =>
      useEvaluacionDesempenoBase({
        role: 'admin',
        collectionName: 'evaluaciones-docentes',
      })
    );

    const mockEvaluado = {
      dni: '70000001',
      nombres: 'Docente Juan',
      apellidos: 'Pérez',
      dniDirector: '20000002',
    };

    await act(async () => {
      await result.current.guardarEvaluacion(
        'eval-doc-999',
        [],
        mockEvaluado as any,
        [],
        '2026-10-18',
        '08:00',
        '09:30',
        { dni: '11223344' },
        'EVALUACIÓN DE PRUEBA'
      );
    });

    expect(setDoc).toHaveBeenCalledWith(
      expect.anything(),
      expect.objectContaining({
        docenteDni: '70000001',
        dniDirector: '20000002',
        adminDni: '11223344',
        evaluadorDni: '11223344',
        evaluadorRol: 'admin',
        tipoMonitoreo: 'acompaniamiento_pedagogico',
      }),
      expect.anything()
    );
  });

  it('obtiene el padrón de docentes cuando un especialista monitorea evaluaciones-docentes', async () => {
    mockCurrentUser = { dni: '87654321', rol: 1, region: 1 };

    const { result } = renderHook(() =>
      useEvaluacionDesempenoBase({
        role: 'especialista',
        collectionName: 'evaluaciones-docentes',
      })
    );

    await act(async () => {
      const docentes = await result.current.getParrillaEvaluados();
      expect(Array.isArray(docentes)).toBe(true);
    });

    expect(collection).toHaveBeenCalledWith({}, 'usuarios');
  });

  it('filtra en Firestore las sesiones evaluadas por dniDirector cuando se especifica el scope', () => {
    const { result } = renderHook(() =>
      useEvaluacionDesempenoBase({
        role: 'especialista',
        collectionName: 'evaluaciones-docentes',
      })
    );

    act(() => {
      result.current.getEvaluados('eval-123', { dniDirector: '99887766' });
    });

    expect(where).toHaveBeenCalledWith('dniDirector', '==', '99887766');
    expect(where).toHaveBeenCalledWith('directorDni', '==', '99887766');
  });

  it('filtra en Firestore las sesiones evaluadas por institucion cuando se especifica el scope', () => {
    const { result } = renderHook(() =>
      useEvaluacionDesempenoBase({
        role: 'especialista',
        collectionName: 'evaluaciones-docentes',
      })
    );

    act(() => {
      result.current.getEvaluados('eval-123', { institucion: 'I.E. 80001' });
    });

    expect(where).toHaveBeenCalledWith('institucion', 'in', expect.arrayContaining(['I.E. 80001', '80001']));
  });

  it('obtiene el padrón de docentes filtrado por institución desde usuarios', async () => {
    const { result } = renderHook(() =>
      useEvaluacionDesempenoBase({
        role: 'especialista',
        collectionName: 'evaluaciones-docentes',
      })
    );

    await act(async () => {
      await result.current.getParrillaEvaluados('institucion', 'I.E. 80001');
    });

    expect(where).toHaveBeenCalledWith('rol', '==', 3);
    expect(where).toHaveBeenCalledWith('institucion', 'in', expect.arrayContaining(['I.E. 80001', '80001']));
  });

  describe('Gestión de Etapas de Evaluación (Fases)', () => {
    it('inicializa automáticamente una etapa por defecto (Fase Diagnóstica) al crear una evaluación', async () => {
      const { result } = renderHook(() =>
        useEvaluacionDesempenoBase({ role: 'director' })
      );

      await act(async () => {
        await result.current.createEvaluacion({
          name: 'Monitoreo 2026',
        });
      });

      expect(addDoc).toHaveBeenCalledWith(
        expect.anything(),
        expect.objectContaining({
          name: 'Monitoreo 2026',
          faseNombre: 'Fase Diagnóstica',
          faseActualID: expect.stringContaining('FASE_DIAGNÓSTICA'),
          fases: expect.arrayContaining([
            expect.objectContaining({
              nombre: 'Fase Diagnóstica',
            }),
          ]),
        })
      );
    });

    it('utiliza el nombre de fase personalizado ingresado por el usuario al crear una evaluación', async () => {
      const { result } = renderHook(() =>
        useEvaluacionDesempenoBase({ role: 'especialista' })
      );

      await act(async () => {
        await result.current.createEvaluacion({
          name: 'Monitoreo Trimestral',
          faseNombre: 'Ronda Mayo',
        });
      });

      expect(addDoc).toHaveBeenCalledWith(
        expect.anything(),
        expect.objectContaining({
          name: 'Monitoreo Trimestral',
          faseNombre: 'Ronda Mayo',
          faseActualID: expect.stringContaining('RONDA_MAYO'),
          fases: expect.arrayContaining([
            expect.objectContaining({
              nombre: 'Ronda Mayo',
            }),
          ]),
        })
      );
    });

    it('respalda la fase anterior y agrega la nueva fase sin sobreescribir el historial en updateFaseEvaluacion', async () => {
      const { getDoc } = require('firebase/firestore');
      (getDoc as jest.Mock).mockResolvedValueOnce({
        exists: () => true,
        data: () => ({
          faseNombre: 'OCTUBRE',
          faseActualID: 'OCTUBRE_100',
          fases: [{ id: 'OCTUBRE_100', nombre: 'OCTUBRE' }],
        }),
      });

      const { result } = renderHook(() =>
        useEvaluacionDesempenoBase({ collectionName: 'evaluaciones-especialista' })
      );

      await act(async () => {
        await result.current.updateFaseEvaluacion('eval-123', 'OCTUBRE II');
      });

      expect(updateDoc).toHaveBeenCalledWith(
        expect.anything(),
        expect.objectContaining({
          faseNombre: 'OCTUBRE II',
          faseActualID: expect.stringContaining('OCTUBRE_II'),
          fases: expect.arrayContaining([
            expect.objectContaining({ id: 'OCTUBRE_100', nombre: 'OCTUBRE' }),
            expect.objectContaining({ nombre: 'OCTUBRE II' }),
          ]),
        })
      );
    });

    it('respalda la fase anterior cuando proviene de formato legacy sin arreglo fases', async () => {
      const { getDoc } = require('firebase/firestore');
      (getDoc as jest.Mock).mockResolvedValueOnce({
        exists: () => true,
        data: () => ({
          faseNombre: 'OCTUBRE',
          faseActualID: 'OCTUBRE_100',
          // fases no existe en el documento
        }),
      });

      const { result } = renderHook(() =>
        useEvaluacionDesempenoBase({ collectionName: 'evaluaciones-especialista' })
      );

      await act(async () => {
        await result.current.updateFaseEvaluacion('eval-123', 'OCTUBRE II');
      });

      expect(updateDoc).toHaveBeenCalledWith(
        expect.anything(),
        expect.objectContaining({
          faseNombre: 'OCTUBRE II',
          fases: expect.arrayContaining([
            expect.objectContaining({ id: 'OCTUBRE_100', nombre: 'OCTUBRE' }),
            expect.objectContaining({ nombre: 'OCTUBRE II' }),
          ]),
        })
      );
    });

    it('reutiliza y reactiva una etapa si el nombre ya existe (case-insensitive) sin duplicarla', async () => {
      const { getDoc } = require('firebase/firestore');
      (getDoc as jest.Mock).mockResolvedValueOnce({
        exists: () => true,
        data: () => ({
          faseNombre: 'OCTUBRE II',
          faseActualID: 'OCTUBRE_II_200',
          fases: [
            { id: 'OCTUBRE_100', nombre: 'OCTUBRE' },
            { id: 'OCTUBRE_II_200', nombre: 'OCTUBRE II' },
          ],
        }),
      });

      const { result } = renderHook(() =>
        useEvaluacionDesempenoBase({ collectionName: 'evaluaciones-especialista' })
      );

      await act(async () => {
        await result.current.updateFaseEvaluacion('eval-123', 'octubre');
      });

      expect(updateDoc).toHaveBeenCalledWith(
        expect.anything(),
        expect.objectContaining({
          faseActualID: 'OCTUBRE_100',
          faseNombre: 'octubre',
          fases: expect.arrayContaining([
            expect.objectContaining({ id: 'OCTUBRE_100', nombre: 'octubre' }),
            expect.objectContaining({ id: 'OCTUBRE_II_200', nombre: 'OCTUBRE II' }),
          ]),
        })
      );
    });

    it('permite cambiar la etapa activa directamente con setFaseActiva', async () => {
      const { result } = renderHook(() =>
        useEvaluacionDesempenoBase({ collectionName: 'evaluaciones-especialista' })
      );

      await act(async () => {
        await result.current.setFaseActiva('eval-123', 'OCTUBRE_100', 'OCTUBRE');
      });

      expect(updateDoc).toHaveBeenCalledWith(
        expect.anything(),
        expect.objectContaining({
          faseActualID: 'OCTUBRE_100',
          faseNombre: 'OCTUBRE',
        })
      );
    });
  });
});
