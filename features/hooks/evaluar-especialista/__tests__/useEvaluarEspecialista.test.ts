import { renderHook, act } from '@testing-library/react';
import { useEvaluarEspecialista } from '../useEvaluarEspecialista';
import { PRDocentes } from '@/features/types/types';

// 1. Mocks de Next Router y Firebase
jest.mock('next/router', () => ({
    useRouter: () => ({
        query: { id: 'eval-spec-123' },
    }),
}));

jest.mock('firebase/firestore', () => ({
    getFirestore: jest.fn(() => ({})),
    doc: jest.fn(),
    getDoc: jest.fn().mockResolvedValue({ exists: () => false, data: () => ({}) }),
    collection: jest.fn(),
    query: jest.fn(),
    where: jest.fn(),
    getDocs: jest.fn().mockResolvedValue({ empty: true, docs: [] }),
}));

jest.mock('@/firebase/firebase.config', () => ({
    db: {},
}));

// 2. Mock del Contexto Global y Hook Secundario con variables dinámicas
let mockGlobalContextState: any = {};
let mockEvaluacionEspecialistasState: any = {};

jest.mock('@/features/context/GlolbalContext', () => ({
    useGlobalContext: () => ({
        getPreguntaRespuestaDocentes: mockGlobalContextState.getPreguntaRespuestaDocentes || [],
        dimensionesEspecialistas: mockGlobalContextState.dimensionesEspecialistas || [],
        dataEvaluacionDocente: mockGlobalContextState.dataEvaluacionDocente || {},
        currentUserData: mockGlobalContextState.currentUserData || { dni: '11111111', rol: 2, email: 'monitor@test.com' },
        dataDirector: mockGlobalContextState.dataDirector || {},
        evaluadosEspecialista: mockGlobalContextState.evaluadosEspecialista || [],
    }),
}));

const mockBuscarEspecialista = jest.fn();
const mockGuardarEvaluacionEspecialistas = jest.fn().mockResolvedValue('session-123');
const mockResetEspecialista = jest.fn();
const mockGetPreguntasRespuestasEspecialistas = jest.fn();
const mockGetDimensionesEspecialistas = jest.fn();
const mockGetDataEvaluacion = jest.fn();
const mockGetDataSeguimientoRetroalimentacionEspecialista = jest.fn();
const mockUploadEvidencia = jest.fn();
const mockDeleteEvidencia = jest.fn();
const mockUpdateConfiguracionCamposRetro = jest.fn();
const mockGetHistorialEspecialista = jest.fn().mockResolvedValue([]);
const mockGetTodosLosEspecialistas = jest.fn().mockResolvedValue([]);
const mockGetEspecialistasEvaluados = jest.fn();

jest.mock('@/features/hooks/UseEvaluacionEspecialistas', () => ({
    __esModule: true,
    default: () => ({
        buscarEspecialista: mockBuscarEspecialista,
        guardarEvaluacionEspecialistas: mockGuardarEvaluacionEspecialistas,
        resetEspecialista: mockResetEspecialista,
        getPreguntasRespuestasEspecialistas: mockGetPreguntasRespuestasEspecialistas,
        getDimensionesEspecialistas: mockGetDimensionesEspecialistas,
        getDataEvaluacion: mockGetDataEvaluacion,
        dataEspecialista: mockEvaluacionEspecialistasState.dataEspecialista || {},
        setDataEspecialista: jest.fn(),
        getDataSeguimientoRetroalimentacionEspecialista: mockGetDataSeguimientoRetroalimentacionEspecialista,
        uploadEvidencia: mockUploadEvidencia,
        deleteEvidencia: mockDeleteEvidencia,
        updateConfiguracionCamposRetro: mockUpdateConfiguracionCamposRetro,
        getHistorialEspecialista: mockGetHistorialEspecialista,
        getTodosLosEspecialistas: mockGetTodosLosEspecialistas,
        getEspecialistasEvaluados: mockGetEspecialistasEvaluados,
    }),
}));

describe('useEvaluarEspecialista', () => {
    const mockPreguntasDocentes: PRDocentes[] = [
        {
            id: 'preg-101',
            order: 1,
            criterio: 'Acompañamiento docente',
            alternativas: [
                { alternativa: '0', descripcion: 'No evidencia', selected: false },
                { alternativa: '1', descripcion: 'En proceso', selected: false },
                { alternativa: '2', descripcion: 'Logrado', selected: false },
            ],
        },
        {
            id: 'preg-102',
            order: 2,
            criterio: 'Retroalimentación pedagógica',
            alternativas: [
                { alternativa: '0', descripcion: 'No evidencia', selected: false },
                { alternativa: '1', descripcion: 'En proceso', selected: false },
                { alternativa: '2', descripcion: 'Logrado', selected: false },
            ],
        },
    ];

    beforeEach(() => {
        jest.clearAllMocks();
        mockGlobalContextState = {
            getPreguntaRespuestaDocentes: [...mockPreguntasDocentes],
            dataEvaluacionDocente: {
                escala: [
                    { value: 0, alternativa: '0', descripcion: 'No evidencia' },
                    { value: 1, alternativa: '1', descripcion: 'En proceso' },
                    { value: 2, alternativa: '2', descripcion: 'Logrado' },
                ],
            },
            dataDirector: { dni: '87654321', nombres: 'Juan Pérez' },
            currentUserData: { dni: '11111111', rol: 2, email: 'monitor@test.com' },
        };
        mockEvaluacionEspecialistasState = {
            dataEspecialista: {},
        };
    });

    describe('Emparejamiento de preguntas y recuperación de respuestas', () => {
        test('Empareja preguntas comparando "order" como string (String(r.order) === String(pregunta.order)) y preserva alternativas seleccionadas', () => {
            // Inicialmente renderizamos para que copyPR/originalPR se carguen con las preguntas base
            const { result, rerender } = renderHook(() => useEvaluarEspecialista());
            expect(result.current.copyPR).toHaveLength(2);

            // Simulamos que al seleccionar un especialista se actualizan los datos en dataEspecialista
            mockEvaluacionEspecialistasState.dataEspecialista = {
                dni: '87654321',
                resultadosSeguimientoRetroalimentacion: [
                    {
                        order: '1' as any, // string en Firebase
                        alternativas: [
                            { alternativa: '0', selected: false },
                            { alternativa: '1', selected: false },
                            { alternativa: '2', selected: true }, // '2' seleccionada
                        ],
                    },
                ],
            };

            // Forzamos el rerender para que reaccione al cambio de dataEspecialista
            rerender();

            // copyPR debe tener la primera pregunta con la alternativa '2' en selected: true
            expect(result.current.copyPR).toHaveLength(2);
            expect(result.current.copyPR[0].alternativas?.find(a => a.alternativa === '2')?.selected).toBe(true);
            expect(result.current.copyPR[0].alternativas?.find(a => a.alternativa === '1')?.selected).toBe(false);
            // La segunda pregunta no tiene respuesta guardada, todas sus alternativas deben ser false
            expect(result.current.copyPR[1].alternativas?.every(a => !a.selected)).toBe(true);
        });

        test('Empareja preguntas comparando "id" como string (String(r.id) === String(pregunta.id)) y preserva alternativas seleccionadas', () => {
            const { result, rerender } = renderHook(() => useEvaluarEspecialista());

            mockEvaluacionEspecialistasState.dataEspecialista = {
                dni: '87654321',
                resultadosSeguimientoRetroalimentacion: [
                    {
                        id: 'preg-102',
                        alternativas: [
                            { alternativa: '0', selected: false },
                            { alternativa: '1', selected: true },
                            { alternativa: '2', selected: false },
                        ],
                    },
                ],
            };

            rerender();

            expect(result.current.copyPR).toHaveLength(2);
            // Segunda pregunta emparejada por id
            const preg102 = result.current.copyPR.find(p => p.id === 'preg-102');
            expect(preg102?.alternativas?.find(a => a.alternativa === '1')?.selected).toBe(true);
        });

        test('Empareja correctamente cuando id u order en la pregunta es number y en la respuesta es string', () => {
            const preguntasConNumberId: PRDocentes[] = [
                {
                    id: 999 as any, // id numérico
                    order: 5 as any, // order numérico
                    criterio: 'Pregunta con ID y Order numéricos',
                    alternativas: [
                        { alternativa: '0', selected: false },
                        { alternativa: '1', selected: false },
                    ],
                },
            ];

            mockGlobalContextState.getPreguntaRespuestaDocentes = preguntasConNumberId;

            const { result, rerender } = renderHook(() => useEvaluarEspecialista());

            mockEvaluacionEspecialistasState.dataEspecialista = {
                dni: '87654321',
                resultadosSeguimientoRetroalimentacion: [
                    {
                        id: '999', // string en Firebase
                        order: '5', // string en Firebase
                        alternativas: [
                            { alternativa: '0', selected: false },
                            { alternativa: '1', selected: true },
                        ],
                    },
                ],
            };

            rerender();

            expect(result.current.copyPR[0].alternativas?.find(a => a.alternativa === '1')?.selected).toBe(true);
        });
    });

    describe('Selección manual de respuestas (handleCheckedRespuesta)', () => {
        test('Marca la alternativa seleccionada con selected: true y deshabilita las demás comparando como string', () => {
            const { result } = renderHook(() => useEvaluarEspecialista());

            // Seleccionar alternativa '2' para la pregunta en índice 0
            act(() => {
                result.current.handleCheckedRespuesta('2', 0);
            });

            expect(result.current.copyPR[0].alternativas?.find(a => a.alternativa === '2')?.selected).toBe(true);
            expect(result.current.copyPR[0].alternativas?.find(a => a.alternativa === '1')?.selected).toBe(false);
            expect(result.current.copyPR[0].alternativas?.find(a => a.alternativa === '0')?.selected).toBe(false);
        });

        test('Funciona si escala tiene alternativa numérica (2) y se pasa value como string ("2")', () => {
            mockGlobalContextState.dataEvaluacionDocente = {
                escala: [
                    { value: 0, alternativa: 0 as any, descripcion: 'No evidencia' },
                    { value: 1, alternativa: 1 as any, descripcion: 'En proceso' },
                    { value: 2, alternativa: 2 as any, descripcion: 'Logrado' },
                ],
            };

            const { result } = renderHook(() => useEvaluarEspecialista());

            act(() => {
                result.current.handleCheckedRespuesta('1', 1);
            });

            expect(result.current.copyPR[1].alternativas?.find(a => String(a.alternativa) === '1')?.selected).toBe(true);
        });
    });

    describe('Validación de estado y reinicio', () => {
        test('allQuestionsAnswered retorna false si falta responder alguna pregunta y true si todas tienen respuesta', () => {
            const { result } = renderHook(() => useEvaluarEspecialista());

            expect(result.current.allQuestionsAnswered).toBe(false);

            // Marcar respuesta para la pregunta 0
            act(() => {
                result.current.handleCheckedRespuesta('1', 0);
            });
            expect(result.current.allQuestionsAnswered).toBe(false);

            // Marcar respuesta para la pregunta 1
            act(() => {
                result.current.handleCheckedRespuesta('2', 1);
            });

            expect(result.current.allQuestionsAnswered).toBe(true);
        });

        test('handleCerrarEspecialista resetea las respuestas seleccionadas y limpia la sesión', () => {
            const { result } = renderHook(() => useEvaluarEspecialista());

            act(() => {
                result.current.handleCheckedRespuesta('1', 0);
            });
            expect(result.current.copyPR[0].alternativas?.find(a => a.alternativa === '1')?.selected).toBe(true);

            act(() => {
                result.current.handleCerrarEspecialista();
            });

            expect(mockResetEspecialista).toHaveBeenCalled();
            expect(result.current.currentSessionId).toBeNull();
            expect(result.current.copyPR[0].alternativas?.every(a => !a.selected)).toBe(true);
        });
    });
});
