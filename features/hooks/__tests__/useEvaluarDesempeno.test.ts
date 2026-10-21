import { renderHook, act } from '@testing-library/react';
import { toast } from 'react-toastify';
import { useEvaluarDesempeno } from '../useEvaluarDesempeno';
import { PRDocentes, User } from '@/features/types/types';

jest.mock('react-toastify', () => ({
  toast: {
    warning: jest.fn(),
    success: jest.fn(),
    error: jest.fn(),
    info: jest.fn(),
  },
}));

// Mock router
let mockQuery: any = { id: 'eval-123', idDirector: '22222222' };
const mockReplace = jest.fn();

jest.mock('next/router', () => ({
  useRouter: () => ({
    query: mockQuery,
    pathname: '/especialistas/evaluaciones-director/evaluacion/evaluar-director',
    replace: mockReplace,
  }),
}));

// Mock Global Context
let mockGlobalContextState: any = {};
const defaultDataEvaluacionDocente = { id: 'eval-123', active: true };
const defaultCurrentUserData = {
  dni: '10000000',
  rol: 1,
  email: 'monitor@test.com',
  celular: '999888777',
  cargo: 'ESPECIALISTA',
};
const defaultEmptyArray: any[] = [];

jest.mock('@/features/context/GlolbalContext', () => ({
  useGlobalContext: () => ({
    getPreguntaRespuestaDocentes: mockGlobalContextState.getPreguntaRespuestaDocentes || defaultEmptyArray,
    dimensionesEspecialistas: mockGlobalContextState.dimensionesEspecialistas || defaultEmptyArray,
    dataEvaluacionDocente: mockGlobalContextState.dataEvaluacionDocente || defaultDataEvaluacionDocente,
    currentUserData: mockGlobalContextState.currentUserData || defaultCurrentUserData,
    evaluadosEspecialista: mockGlobalContextState.evaluadosEspecialista || defaultEmptyArray,
    warningDataDocente: '',
    loaderSalvarPregunta: false,
  }),
}));

// Mock useEvaluacionDesempenoBase
const mockBuscarUsuario = jest.fn();
const mockGuardarEvaluacion = jest.fn().mockResolvedValue('session-saved-999');
const mockGetHistorialEvaluado = jest.fn().mockResolvedValue([]);
const mockGetParrillaEvaluados = jest.fn().mockResolvedValue([]);
const mockGetDataEvaluacion = jest.fn();
const mockGetDimensiones = jest.fn();
const mockGetPreguntasRespuestas = jest.fn();
const mockGetEvaluados = jest.fn();
const mockGetSessionData = jest.fn();
const mockUploadEvidencia = jest.fn();
const mockDeleteEvidencia = jest.fn();
const mockUpdateConfiguracionCamposRetro = jest.fn();

jest.mock('@/features/hooks/useEvaluacionDesempenoBase', () => ({
  __esModule: true,
  default: () => ({
    getDataEvaluacion: mockGetDataEvaluacion,
    getDimensiones: mockGetDimensiones,
    getPreguntasRespuestas: mockGetPreguntasRespuestas,
    getEvaluados: mockGetEvaluados,
    getParrillaEvaluados: mockGetParrillaEvaluados,
    buscarUsuario: mockBuscarUsuario,
    guardarEvaluacion: mockGuardarEvaluacion,
    getHistorialEvaluado: mockGetHistorialEvaluado,
    getSessionData: mockGetSessionData,
    uploadEvidencia: mockUploadEvidencia,
    deleteEvidencia: mockDeleteEvidencia,
    updateConfiguracionCamposRetro: mockUpdateConfiguracionCamposRetro,
  }),
}));

describe('useEvaluarDesempeno', () => {
  const mockPreguntas: PRDocentes[] = [
    {
      id: 'preg-1',
      order: 1,
      criterio: 'Criterio Pedagógico 1',
      alternativas: [
        { alternativa: '0', descripcion: 'No evidencia', selected: false },
        { alternativa: '1', descripcion: 'En proceso', selected: false },
        { alternativa: '2', descripcion: 'Logrado', selected: false },
      ],
    },
    {
      id: 'preg-2',
      order: 2,
      criterio: 'Criterio Pedagógico 2',
      alternativas: [
        { alternativa: '0', descripcion: 'No evidencia', selected: false },
        { alternativa: '1', descripcion: 'En proceso', selected: false },
        { alternativa: '2', descripcion: 'Logrado', selected: false },
      ],
    },
  ];

  beforeEach(() => {
    jest.clearAllMocks();
    mockQuery = { id: 'eval-123', idDirector: '22222222' };
    mockGlobalContextState = {
      getPreguntaRespuestaDocentes: mockPreguntas,
      dimensionesEspecialistas: [{ id: 'dim-1', nombre: 'Dominio 1' }],
      dataEvaluacionDocente: {
        id: 'eval-123',
        active: true,
        name: 'Monitoreo Directivo 2026',
        faseActualID: 'FASE_1',
        faseNombre: 'Diagnóstico',
        escala: [
          { value: 0, alternativa: '0', descripcion: 'No evidencia' },
          { value: 1, alternativa: '1', descripcion: 'En proceso' },
          { value: 2, alternativa: '2', descripcion: 'Logrado' },
        ],
      },
      currentUserData: {
        dni: '10000000',
        rol: 1,
        email: 'especialista@test.com',
        celular: '999888777',
        cargo: 'ESPECIALISTA',
      },
    };

    mockBuscarUsuario.mockResolvedValue({
      dni: '22222222',
      nombres: 'JUAN',
      apellidos: 'PEREZ',
      institucion: 'I.E. 11001',
      email: 'juan@test.com',
      celular: '987654321',
    });
  });

  it('inicializa correctamente y auto-carga evaluado desde query param', async () => {
    const { result } = renderHook(() =>
      useEvaluarDesempeno({
        role: 'especialista',
        collectionName: 'evaluaciones-director',
        evaluadoRoleLabel: 'Director',
        queryParamKeys: ['idDirector', 'dniDirector'],
      })
    );

    expect(result.current.evaluacionId).toBe('eval-123');
    expect(result.current.copyPR.length).toBe(2);
    expect(result.current.allQuestionsAnswered).toBe(false);

    // Esperar a que el efecto de carga de usuario termine
    await act(async () => {
      await Promise.resolve();
    });

    expect(mockBuscarUsuario).toHaveBeenCalledWith('22222222');
    expect(result.current.dataDirector.dni).toBe('22222222');
    expect(result.current.dataDirector.nombres).toBe('JUAN');
  });

  it('permite responder preguntas y actualiza allQuestionsAnswered', () => {
    const { result } = renderHook(() =>
      useEvaluarDesempeno({
        role: 'especialista',
        collectionName: 'evaluaciones-director',
      })
    );

    expect(result.current.allQuestionsAnswered).toBe(false);

    act(() => {
      result.current.handleCheckedRespuesta('2', 0);
    });

    expect(result.current.copyPR[0].alternativas?.find((a) => a.selected)?.alternativa).toBe('2');
    expect(result.current.allQuestionsAnswered).toBe(false);

    act(() => {
      result.current.handleCheckedRespuesta('1', 1);
    });

    expect(result.current.copyPR[1].alternativas?.find((a) => a.selected)?.alternativa).toBe('1');
    expect(result.current.allQuestionsAnswered).toBe(true);
  });

  it('guarda la evaluación y cierra el evaluado seleccionado', async () => {
    const { result } = renderHook(() =>
      useEvaluarDesempeno({
        role: 'especialista',
        collectionName: 'evaluaciones-director',
      })
    );

    await act(async () => {
      await Promise.resolve();
    });

    // Responder todas las preguntas
    act(() => {
      result.current.handleCheckedRespuesta('2', 0);
      result.current.handleCheckedRespuesta('2', 1);
    });

    await act(async () => {
      await result.current.handleGuardarClick();
    });

    expect(mockGuardarEvaluacion).toHaveBeenCalled();
    expect(mockReplace).toHaveBeenCalled();
  });

  it('permite buscar y seleccionar docente para el rol director', async () => {
    mockQuery = { id: 'eval-docentes-456' };
    mockGlobalContextState.currentUserData = {
      dni: '22222222',
      rol: 2,
      cargo: 'DIRECTOR',
      email: 'director@test.com',
    };

    const mockDocentes = [
      { dni: '33333333', nombres: 'MARIA', apellidos: 'GARCIA', institucion: 'I.E. 11001' },
      { dni: '44444444', nombres: 'PEDRO', apellidos: 'LOPEZ', institucion: 'I.E. 11001' },
    ];
    mockGetParrillaEvaluados.mockResolvedValue(mockDocentes);

    const { result } = renderHook(() =>
      useEvaluarDesempeno({
        role: 'director',
        collectionName: 'evaluaciones-docentes',
        evaluadoRoleLabel: 'Docente',
      })
    );

    // Click en input para cargar lista de docentes
    await act(async () => {
      await result.current.handleInputClick();
    });

    expect(result.current.especialistasFiltrados.length).toBe(2);

    // Seleccionar docente
    await act(async () => {
      result.current.handleSelectEspecialista(mockDocentes[0]);
    });

    expect(result.current.dataDirector.dni).toBe('33333333');
    expect(result.current.dataDirector.nombres).toBe('MARIA');
  });

  it('limpia el estado al cerrar evaluado con handleCerrarEspecialista', async () => {
    const { result } = renderHook(() =>
      useEvaluarDesempeno({
        role: 'especialista',
        collectionName: 'evaluaciones-director',
      })
    );

    await act(async () => {
      await Promise.resolve();
    });

    expect(result.current.dataDirector.dni).toBe('22222222');

    act(() => {
      result.current.handleCerrarEspecialista();
    });

    expect(result.current.dataDirector.dni).toBeUndefined();
    expect(result.current.dniDocente).toBe('');
    expect(mockReplace).toHaveBeenCalledWith(
      { pathname: '/especialistas/evaluaciones-director/evaluacion/evaluar-director', query: { id: 'eval-123' } },
      undefined,
      { shallow: true }
    );
  });

  it('bloquea la selección de docentes que pertenecen a otra UGEL para especialistas', async () => {
    mockQuery = { id: 'eval-123' };
    mockGlobalContextState = {
      currentUserData: {
        dni: '10000000',
        rol: 1,
        region: 2, // UGEL San Román
        cargo: 'ESPECIALISTA',
      },
    };

    const docenteOtraUgel: User = {
      dni: '99887766',
      nombres: 'PEDRO',
      apellidos: 'MAMANI',
      region: 1, // UGEL Puno (distinta a San Román)
      rol: 3,
    };

    mockBuscarUsuario.mockResolvedValue(docenteOtraUgel);

    const { result } = renderHook(() =>
      useEvaluarDesempeno({
        role: 'especialista',
        collectionName: 'evaluaciones-docentes',
        queryParamKeys: ['idDocente', 'dni'],
      })
    );

    await act(async () => {
      await Promise.resolve();
    });

    // Intentar buscar al docente de otra región por DNI
    act(() => {
      result.current.handleChangeDocente({ target: { value: '99887766' } } as any);
    });

    await act(async () => {
      await result.current.handleBuscarDocente();
    });

    // Debe bloquearse y no seleccionarlo
    expect(result.current.dataDirector.dni).toBeUndefined();

    // Intentar seleccionar directamente desde lista/dropdown
    await act(async () => {
      result.current.handleSelectEspecialista(docenteOtraUgel);
    });

    expect(result.current.dataDirector.dni).toBeUndefined();
  });

  it('bloquea el guardado de la evaluación si está inactiva y el usuario no es administrador', async () => {
    mockGlobalContextState = {
      ...mockGlobalContextState,
      dataEvaluacionDocente: {
        ...mockGlobalContextState.dataEvaluacionDocente,
        active: false,
      },
      currentUserData: {
        dni: '10000000',
        rol: 1, // Especialista
      },
    };

    const { result } = renderHook(() =>
      useEvaluarDesempeno({
        role: 'especialista',
        collectionName: 'evaluaciones-director',
      })
    );

    await act(async () => {
      await Promise.resolve();
    });

    expect(result.current.isEvaluacionInactiva).toBe(true);

    // Responder preguntas
    act(() => {
      result.current.handleCheckedRespuesta('2', 0);
      result.current.handleCheckedRespuesta('2', 1);
    });

    // Intentar guardar
    await act(async () => {
      await result.current.handleGuardarClick();
    });

    expect(toast.warning).toHaveBeenCalledWith(
      expect.stringContaining('inactiva')
    );
    expect(mockGuardarEvaluacion).not.toHaveBeenCalled();
  });

  it('permite el guardado de la evaluación inactiva si el usuario es administrador', async () => {
    mockGlobalContextState = {
      ...mockGlobalContextState,
      dataEvaluacionDocente: {
        ...mockGlobalContextState.dataEvaluacionDocente,
        active: false,
      },
      currentUserData: {
        dni: '99999999',
        rol: 4, // Administrador
      },
    };

    const { result } = renderHook(() =>
      useEvaluarDesempeno({
        role: 'admin',
        collectionName: 'evaluaciones-docentes',
      })
    );

    await act(async () => {
      await Promise.resolve();
    });

    expect(result.current.isEvaluacionInactiva).toBe(false);

    // Responder preguntas
    act(() => {
      result.current.handleCheckedRespuesta('2', 0);
      result.current.handleCheckedRespuesta('2', 1);
    });

    // Guardar
    await act(async () => {
      await result.current.handleGuardarClick();
    });

    expect(mockGuardarEvaluacion).toHaveBeenCalled();
  });

  it('resuelve evaluacionId correctamente cuando la URL pasa idEvaluacion en lugar de id', async () => {
    mockQuery = { idEvaluacion: 'eval-director-789', idDirector: '22222222' };
    mockGlobalContextState = {
      ...mockGlobalContextState,
      dataEvaluacionDocente: {
        id: 'eval-director-789',
        active: true,
        camposRetroalimentacion: [
          { etiqueta: 'AVANCES', descripcion: 'hhhhhhhhhh' },
          { etiqueta: 'DIFICULTADES', descripcion: 'dificultades previas' },
        ],
      },
    };

    const { result } = renderHook(() =>
      useEvaluarDesempeno({
        role: 'admin',
        collectionName: 'evaluaciones-director',
        queryParamKeys: ['idDirector'],
      })
    );

    await act(async () => {
      await Promise.resolve();
    });

    expect(result.current.evaluacionId).toBe('eval-director-789');
    expect(mockGetDataEvaluacion).toHaveBeenCalledWith('eval-director-789');
    expect(result.current.retroalimentacionDinamica[0].descripcion).toBe('hhhhhhhhhh');

    // Al editar o borrar la descripción de retroalimentación cualitativa se modifica en memoria
    await act(async () => {
      await result.current.handleChangeFeedbackDescription(0, '');
    });

    expect(result.current.retroalimentacionDinamica[0].descripcion).toBe('');
    expect(result.current.isTemplateDirty).toBe(true);
    expect(mockUpdateConfiguracionCamposRetro).not.toHaveBeenCalled();

    // Se persiste al llamar a handleSaveTemplateConfig
    await act(async () => {
      await result.current.handleSaveTemplateConfig();
    });

    expect(mockUpdateConfiguracionCamposRetro).toHaveBeenCalledWith(
      'eval-director-789',
      expect.arrayContaining([
        expect.objectContaining({ etiqueta: 'AVANCES', descripcion: '' }),
      ])
    );
  });
});
