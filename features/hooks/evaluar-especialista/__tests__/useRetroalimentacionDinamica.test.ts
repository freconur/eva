import { renderHook, act } from '@testing-library/react';
import { useRetroalimentacionDinamica } from '../useRetroalimentacionDinamica';
import { CampoRetroalimentacionConfig } from '@/features/types/types';

describe('useRetroalimentacionDinamica', () => {
    let mockUpdateConfiguracionCamposRetro: jest.Mock;
    const defaultEvaluacionDocente = {};
    const defaultEspecialista = {};

    beforeEach(() => {
        mockUpdateConfiguracionCamposRetro = jest.fn().mockResolvedValue(undefined);
    });

    describe('1. Plantilla por defecto', () => {
        test('utiliza por defecto los campos ["AVANCES", "DIFICULTADES", "COMPROMISOS"] cuando dataEvaluacionDocente.camposRetroalimentacion es undefined', () => {
            const isDataLoadedRef = { current: false };
            const dataEvaluacionDocente = {};
            const dataEspecialista = {};

            const { result } = renderHook(() =>
                useRetroalimentacionDinamica({
                    dataEvaluacionDocente,
                    dataEspecialista,
                    isDataLoadedRef,
                    evaluacionId: 'eval-123',
                    updateConfiguracionCamposRetro: mockUpdateConfiguracionCamposRetro,
                })
            );

            expect(result.current.retroalimentacionDinamica).toHaveLength(3);
            expect(result.current.retroalimentacionDinamica).toEqual([
                { etiqueta: 'AVANCES', descripcion: '', contenido: '' },
                { etiqueta: 'DIFICULTADES', descripcion: '', contenido: '' },
                { etiqueta: 'COMPROMISOS', descripcion: '', contenido: '' },
            ]);
        });

        test('utiliza por defecto los campos ["AVANCES", "DIFICULTADES", "COMPROMISOS"] cuando camposRetroalimentacion es un arreglo vacío []', () => {
            const isDataLoadedRef = { current: false };
            const dataEvaluacionDocente = { camposRetroalimentacion: [] };
            const dataEspecialista = {};

            const { result } = renderHook(() =>
                useRetroalimentacionDinamica({
                    dataEvaluacionDocente,
                    dataEspecialista,
                    isDataLoadedRef,
                    evaluacionId: 'eval-123',
                    updateConfiguracionCamposRetro: mockUpdateConfiguracionCamposRetro,
                })
            );

            expect(result.current.retroalimentacionDinamica).toHaveLength(3);
            expect(result.current.retroalimentacionDinamica.map(r => r.etiqueta)).toEqual([
                'AVANCES',
                'DIFICULTADES',
                'COMPROMISOS',
            ]);
        });

        test('utiliza los campos personalizados cuando dataEvaluacionDocente.camposRetroalimentacion contiene un arreglo de strings u objetos', () => {
            const isDataLoadedRef = { current: false };
            const camposCustom: (CampoRetroalimentacionConfig | string)[] = [
                'ASPECTOS POSITIVOS',
                { etiqueta: 'PLAN DE MEJORA', descripcion: 'Descripción del plan de mejora' },
            ];
            const dataEvaluacionDocente = { camposRetroalimentacion: camposCustom };
            const dataEspecialista = {};

            const { result } = renderHook(() =>
                useRetroalimentacionDinamica({
                    dataEvaluacionDocente,
                    dataEspecialista,
                    isDataLoadedRef,
                    evaluacionId: 'eval-123',
                    updateConfiguracionCamposRetro: mockUpdateConfiguracionCamposRetro,
                })
            );

            expect(result.current.retroalimentacionDinamica).toHaveLength(2);
            expect(result.current.retroalimentacionDinamica[0]).toEqual({
                etiqueta: 'ASPECTOS POSITIVOS',
                descripcion: '',
                contenido: '',
            });
            expect(result.current.retroalimentacionDinamica[1]).toEqual({
                etiqueta: 'PLAN DE MEJORA',
                descripcion: 'Descripción del plan de mejora',
                contenido: '',
            });
        });
    });

    describe('2. Coincidencia tolerante a mayúsculas/minúsculas y espacios', () => {
        test('coincide las etiquetas guardadas en dataEspecialista.retroalimentacionDinamica con el molde global ignorando mayúsculas/minúsculas y espacios en blanco', () => {
            const isDataLoadedRef = { current: false };
            const dataEvaluacionDocente = {
                camposRetroalimentacion: ['  Avances  ', 'dificultades', 'COMPROMISOS'],
            };
            const dataEspecialista = {
                retroalimentacionDinamica: [
                    { etiqueta: 'avances', contenido: 'Contenido de Avances Guardado' },
                    { etiqueta: '  DIFICULTADES  ', contenido: 'Contenido de Dificultades Guardado' },
                    { etiqueta: 'Compromisos', contenido: 'Contenido de Compromisos Guardado' },
                ],
            };

            const { result } = renderHook(() =>
                useRetroalimentacionDinamica({
                    dataEvaluacionDocente,
                    dataEspecialista,
                    isDataLoadedRef,
                    evaluacionId: 'eval-123',
                    updateConfiguracionCamposRetro: mockUpdateConfiguracionCamposRetro,
                })
            );

            expect(result.current.retroalimentacionDinamica[0].contenido).toBe('Contenido de Avances Guardado');
            expect(result.current.retroalimentacionDinamica[1].contenido).toBe('Contenido de Dificultades Guardado');
            expect(result.current.retroalimentacionDinamica[2].contenido).toBe('Contenido de Compromisos Guardado');
        });
    });

    describe('3. Respaldo con campos legados (fallback)', () => {
        test('rescata los campos legados (avancesRetroalimentacion, dificultadesRetroalimentacion, compromisosRetroalimentacion) si el contenido dinámico está vacío', () => {
            const isDataLoadedRef = { current: false };
            const dataEspecialista = {
                avancesRetroalimentacion: 'Avances legados',
                dificultadesRetroalimentacion: 'Dificultades legadas',
                compromisosRetroalimentacion: 'Compromisos legados',
            };

            const { result } = renderHook(() =>
                useRetroalimentacionDinamica({
                    dataEvaluacionDocente: defaultEvaluacionDocente,
                    dataEspecialista,
                    isDataLoadedRef,
                    evaluacionId: 'eval-123',
                    updateConfiguracionCamposRetro: mockUpdateConfiguracionCamposRetro,
                })
            );

            expect(result.current.retroalimentacionDinamica[0].contenido).toBe('Avances legados');
            expect(result.current.retroalimentacionDinamica[1].contenido).toBe('Dificultades legadas');
            expect(result.current.retroalimentacionDinamica[2].contenido).toBe('Compromisos legados');
        });

        test('rescata contenido legado cuando las etiquetas globales contienen palabras clave como FORTALEZA o MEJORA', () => {
            const isDataLoadedRef = { current: false };
            const dataEvaluacionDocente = {
                camposRetroalimentacion: ['MIS FORTALEZAS', 'OPORTUNIDAD DE MEJORA'],
            };
            const dataEspecialista = {
                avancesRetroalimentacion: 'Fortaleza identificada',
                compromisosRetroalimentacion: 'Mejora acordada',
            };

            const { result } = renderHook(() =>
                useRetroalimentacionDinamica({
                    dataEvaluacionDocente,
                    dataEspecialista,
                    isDataLoadedRef,
                    evaluacionId: 'eval-123',
                    updateConfiguracionCamposRetro: mockUpdateConfiguracionCamposRetro,
                })
            );

            expect(result.current.retroalimentacionDinamica[0].contenido).toBe('Fortaleza identificada');
            expect(result.current.retroalimentacionDinamica[1].contenido).toBe('Mejora acordada');
        });

        test('no reemplaza con contenido legado si ya existe contenido dinámico guardado no vacío', () => {
            const isDataLoadedRef = { current: false };
            const dataEvaluacionDocente = { camposRetroalimentacion: ['AVANCES'] };
            const dataEspecialista = {
                avancesRetroalimentacion: 'Texto legado no utilizado',
                retroalimentacionDinamica: [
                    { etiqueta: 'AVANCES', contenido: 'Texto dinámico actual' },
                ],
            };

            const { result } = renderHook(() =>
                useRetroalimentacionDinamica({
                    dataEvaluacionDocente,
                    dataEspecialista,
                    isDataLoadedRef,
                    evaluacionId: 'eval-123',
                    updateConfiguracionCamposRetro: mockUpdateConfiguracionCamposRetro,
                })
            );

            expect(result.current.retroalimentacionDinamica[0].contenido).toBe('Texto dinámico actual');
        });
    });

    describe('4. Actualización de contenido (handleChangeFeedbackValue)', () => {
        test('actualiza el contenido de la sección indicada de forma inmutable al llamar a handleChangeFeedbackValue', () => {
            const isDataLoadedRef = { current: false };
            const { result } = renderHook(() =>
                useRetroalimentacionDinamica({
                    dataEvaluacionDocente: defaultEvaluacionDocente,
                    dataEspecialista: defaultEspecialista,
                    isDataLoadedRef,
                    evaluacionId: 'eval-123',
                    updateConfiguracionCamposRetro: mockUpdateConfiguracionCamposRetro,
                })
            );

            const initialRetro = result.current.retroalimentacionDinamica;

            act(() => {
                result.current.handleChangeFeedbackValue(0, 'Se observa buen desempeño en aula');
            });

            expect(result.current.retroalimentacionDinamica[0].contenido).toBe('Se observa buen desempeño en aula');
            // Referencia diferente debido a la actualización inmutable
            expect(result.current.retroalimentacionDinamica).not.toBe(initialRetro);
            // El resto de los elementos conservan su estado original
            expect(result.current.retroalimentacionDinamica[1].contenido).toBe('');
            expect(result.current.retroalimentacionDinamica[2].contenido).toBe('');
        });
    });

    describe('5. Agregar y eliminar campos', () => {
        test('handleAddFeedbackField agrega una nueva sección "NUEVA SECCIÓN" y llama a updateConfiguracionCamposRetro', async () => {
            const isDataLoadedRef = { current: false };
            const { result } = renderHook(() =>
                useRetroalimentacionDinamica({
                    dataEvaluacionDocente: defaultEvaluacionDocente,
                    dataEspecialista: defaultEspecialista,
                    isDataLoadedRef,
                    evaluacionId: 'eval-123',
                    updateConfiguracionCamposRetro: mockUpdateConfiguracionCamposRetro,
                })
            );

            expect(result.current.retroalimentacionDinamica).toHaveLength(3);

            await act(async () => {
                await result.current.handleAddFeedbackField();
            });

            expect(result.current.retroalimentacionDinamica).toHaveLength(4);
            expect(result.current.retroalimentacionDinamica[3]).toEqual({
                etiqueta: 'NUEVA SECCIÓN',
                descripcion: '',
                contenido: '',
            });

            expect(mockUpdateConfiguracionCamposRetro).toHaveBeenCalledWith(
                'eval-123',
                [
                    { etiqueta: 'AVANCES', descripcion: '' },
                    { etiqueta: 'DIFICULTADES', descripcion: '' },
                    { etiqueta: 'COMPROMISOS', descripcion: '' },
                    { etiqueta: 'NUEVA SECCIÓN', descripcion: '' },
                ]
            );
        });

        test('handleRemoveFeedbackField elimina la sección en el índice indicado y llama a updateConfiguracionCamposRetro', async () => {
            const isDataLoadedRef = { current: false };
            const { result } = renderHook(() =>
                useRetroalimentacionDinamica({
                    dataEvaluacionDocente: defaultEvaluacionDocente,
                    dataEspecialista: defaultEspecialista,
                    isDataLoadedRef,
                    evaluacionId: 'eval-123',
                    updateConfiguracionCamposRetro: mockUpdateConfiguracionCamposRetro,
                })
            );

            expect(result.current.retroalimentacionDinamica).toHaveLength(3);

            await act(async () => {
                await result.current.handleRemoveFeedbackField(1); // Elimina DIFICULTADES
            });

            expect(result.current.retroalimentacionDinamica).toHaveLength(2);
            expect(result.current.retroalimentacionDinamica.map(r => r.etiqueta)).toEqual([
                'AVANCES',
                'COMPROMISOS',
            ]);

            expect(mockUpdateConfiguracionCamposRetro).toHaveBeenCalledWith(
                'eval-123',
                [
                    { etiqueta: 'AVANCES', descripcion: '' },
                    { etiqueta: 'COMPROMISOS', descripcion: '' },
                ]
            );
        });

        test('no llama a updateConfiguracionCamposRetro al agregar o eliminar si evaluacionId es una cadena vacía', async () => {
            const isDataLoadedRef = { current: false };
            const { result } = renderHook(() =>
                useRetroalimentacionDinamica({
                    dataEvaluacionDocente: defaultEvaluacionDocente,
                    dataEspecialista: defaultEspecialista,
                    isDataLoadedRef,
                    evaluacionId: '',
                    updateConfiguracionCamposRetro: mockUpdateConfiguracionCamposRetro,
                })
            );

            await act(async () => {
                await result.current.handleAddFeedbackField();
            });

            expect(mockUpdateConfiguracionCamposRetro).not.toHaveBeenCalled();

            await act(async () => {
                await result.current.handleRemoveFeedbackField(0);
            });

            expect(mockUpdateConfiguracionCamposRetro).not.toHaveBeenCalled();
        });
    });

    describe('Funciones adicionales de modificación de etiqueta y descripción', () => {
        test('handleChangeFeedbackLabel actualiza la etiqueta en mayúsculas y sincroniza la configuración con silent = true', async () => {
            const isDataLoadedRef = { current: false };
            const { result } = renderHook(() =>
                useRetroalimentacionDinamica({
                    dataEvaluacionDocente: defaultEvaluacionDocente,
                    dataEspecialista: defaultEspecialista,
                    isDataLoadedRef,
                    evaluacionId: 'eval-123',
                    updateConfiguracionCamposRetro: mockUpdateConfiguracionCamposRetro,
                })
            );

            await act(async () => {
                await result.current.handleChangeFeedbackLabel(0, 'Logros Clave');
            });

            expect(result.current.retroalimentacionDinamica[0].etiqueta).toBe('LOGROS CLAVE');
            expect(mockUpdateConfiguracionCamposRetro).toHaveBeenCalledWith(
                'eval-123',
                expect.arrayContaining([{ etiqueta: 'LOGROS CLAVE', descripcion: '' }]),
                true
            );
        });

        test('handleChangeFeedbackDescription actualiza la descripción y sincroniza la configuración con silent = true', async () => {
            const isDataLoadedRef = { current: false };
            const { result } = renderHook(() =>
                useRetroalimentacionDinamica({
                    dataEvaluacionDocente: defaultEvaluacionDocente,
                    dataEspecialista: defaultEspecialista,
                    isDataLoadedRef,
                    evaluacionId: 'eval-123',
                    updateConfiguracionCamposRetro: mockUpdateConfiguracionCamposRetro,
                })
            );

            await act(async () => {
                await result.current.handleChangeFeedbackDescription(0, 'Descripción detallada de avances');
            });

            expect(result.current.retroalimentacionDinamica[0].descripcion).toBe('Descripción detallada de avances');
            expect(mockUpdateConfiguracionCamposRetro).toHaveBeenCalledWith(
                'eval-123',
                expect.arrayContaining([{ etiqueta: 'AVANCES', descripcion: 'Descripción detallada de avances' }]),
                true
            );
        });
    });
});
