import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import TablaEvaluacion from '../TablaEvaluacion';
import { PRDocentes } from '@/features/types/types';

describe('TablaEvaluacion', () => {
    const mockHandleCheckedRespuesta = jest.fn();
    const mockHandleUploadEvidencia = jest.fn();
    const mockHandleDeleteEvidencia = jest.fn();
    const mockHandleSalvarPreguntaDocente = jest.fn(e => e.preventDefault());

    const defaultEscala = [
        { value: 0, alternativa: '0', descripcion: 'No evidencia' },
        { value: 1, alternativa: '1', descripcion: 'En proceso' },
        { value: 2, alternativa: '2', descripcion: 'Logrado' },
    ];

    const defaultProps = {
        copyPR: [],
        dimensionesEspecialistas: [],
        currentEscala: defaultEscala,
        dataEvaluacionDocente: { activarEvidencias: false },
        dataEspecialista: { dni: '12345678' },
        dataDirector: {},
        uploadingMap: {},
        handleCheckedRespuesta: mockHandleCheckedRespuesta,
        handleUploadEvidencia: mockHandleUploadEvidencia,
        handleDeleteEvidencia: mockHandleDeleteEvidencia,
        handleSalvarPreguntaDocente: mockHandleSalvarPreguntaDocente,
    };

    beforeEach(() => {
        jest.clearAllMocks();
    });

    describe('Emparejamiento de alternativas (string vs número)', () => {
        test('Renderiza alternativa como checked cuando escala.alternativa es number (5) y alternativa de pregunta es string ("5")', () => {
            const currentEscalaNumber = [
                { value: 5, alternativa: 5, descripcion: 'Excelente' },
                { value: 10, alternativa: 10, descripcion: 'Sobresaliente' },
            ];

            const copyPR: PRDocentes[] = [
                {
                    id: 'q1',
                    order: 1,
                    criterio: 'Criterio de prueba 1',
                    alternativas: [
                        { alternativa: '5', selected: true, descripcion: 'Excelente' },
                        { alternativa: '10', selected: false, descripcion: 'Sobresaliente' },
                    ],
                },
            ];

            render(
                <TablaEvaluacion
                    {...defaultProps}
                    currentEscala={currentEscalaNumber}
                    copyPR={copyPR}
                />
            );

            const radios = screen.getAllByRole('radio');
            expect(radios).toHaveLength(2);

            const radio5 = screen.getByDisplayValue('5') as HTMLInputElement;
            const radio10 = screen.getByDisplayValue('10') as HTMLInputElement;

            expect(radio5.checked).toBe(true);
            expect(radio10.checked).toBe(false);
        });

        test('Renderiza alternativa como checked cuando escala.alternativa es string ("5") y alternativa de pregunta es number (5)', () => {
            const currentEscalaString = [
                { value: 5, alternativa: '5', descripcion: 'Excelente' },
                { value: 10, alternativa: '10', descripcion: 'Sobresaliente' },
            ];

            const copyPR: PRDocentes[] = [
                {
                    id: 'q1',
                    order: 1,
                    criterio: 'Criterio de prueba 1',
                    alternativas: [
                        { alternativa: 5 as any, selected: true, descripcion: 'Excelente' },
                        { alternativa: 10 as any, selected: false, descripcion: 'Sobresaliente' },
                    ],
                },
            ];

            render(
                <TablaEvaluacion
                    {...defaultProps}
                    currentEscala={currentEscalaString}
                    copyPR={copyPR}
                />
            );

            const radio5 = screen.getByDisplayValue('5') as HTMLInputElement;
            const radio10 = screen.getByDisplayValue('10') as HTMLInputElement;

            expect(radio5.checked).toBe(true);
            expect(radio10.checked).toBe(false);
        });
    });

    describe('Cálculo seguro de actualIndex con dimensiones', () => {
        test('Calcula actualIndex correctamente al agrupar por dimensiones', () => {
            const dimensiones = [
                { id: 'dim1', nombre: 'Dimensión Pedagógica' },
                { id: 'dim2', nombre: 'Dimensión Institucional' },
            ];

            const copyPR: PRDocentes[] = [
                {
                    id: 'q1',
                    order: 1,
                    dimensionId: 'dim1',
                    criterio: 'Pregunta en Dimensión 1',
                    alternativas: [
                        { alternativa: '0', selected: false },
                        { alternativa: '1', selected: true },
                    ],
                },
                {
                    id: 'q2',
                    order: 2,
                    dimensionId: 'dim2',
                    criterio: 'Primera pregunta en Dimensión 2',
                    alternativas: [
                        { alternativa: '0', selected: false },
                        { alternativa: '1', selected: false },
                    ],
                },
                {
                    id: 'q3',
                    order: 3,
                    dimensionId: 'dim2',
                    criterio: 'Segunda pregunta en Dimensión 2',
                    alternativas: [
                        { alternativa: '0', selected: false },
                        { alternativa: '1', selected: false },
                    ],
                },
            ];

            const { container } = render(
                <TablaEvaluacion
                    {...defaultProps}
                    dimensionesEspecialistas={dimensiones}
                    copyPR={copyPR}
                />
            );

            // Verificar que se renderizan los nombres de las dimensiones
            expect(screen.getByText('Dimensión Pedagógica')).toBeInTheDocument();
            expect(screen.getByText('Dimensión Institucional')).toBeInTheDocument();

            // Buscar la pregunta q2 ("Primera pregunta en Dimensión 2"), que está en el índice global 1 en copyPR
            // Seleccionamos sus radio buttons y hacemos click en el valor '1'
            const radiosQ2 = container.querySelectorAll('input[name="question-q2"]');
            expect(radiosQ2).toHaveLength(3); // escala por defecto tiene '0', '1', '2'

            fireEvent.click(radiosQ2[1]); // Hace click en valor '1'

            // handleCheckedRespuesta debe recibir ('1', 1) donde 1 es el actualIndex en copyPR
            expect(mockHandleCheckedRespuesta).toHaveBeenCalledWith('1', 1);
        });

        test('Calcula actualIndex de forma segura cuando id u order son números en uno y strings en otro', () => {
            const dimensiones = [
                { id: 'dim1', nombre: 'Dimensión Única' },
            ];

            const copyPR: PRDocentes[] = [
                {
                    id: 100 as any, // ID numérico en la lista global copyPR
                    order: 10 as any, // Order numérico
                    dimensionId: 'dim1',
                    criterio: 'Criterio con ID numérico',
                    alternativas: [{ alternativa: '0', selected: false }],
                },
                {
                    id: 200 as any,
                    order: 20 as any,
                    dimensionId: 'dim1',
                    criterio: 'Segundo criterio numérico',
                    alternativas: [{ alternativa: '0', selected: false }],
                },
            ];

            const { container } = render(
                <TablaEvaluacion
                    {...defaultProps}
                    dimensionesEspecialistas={dimensiones}
                    copyPR={copyPR}
                />
            );

            const radiosQ200 = container.querySelectorAll('input[name="question-200"]');
            fireEvent.click(radiosQ200[0]);

            // Debe encontrar realIndex = 1 comparando String(p.id) === String(pregunta.id)
            expect(mockHandleCheckedRespuesta).toHaveBeenCalledWith('0', 1);
        });

        test('Utiliza copyPR.indexOf como fallback seguro si no coincide ni id ni order', () => {
            const dimensiones = [
                { id: 'dim1', nombre: 'Dimensión Test' },
            ];

            // Pregunta sin ID ni order en copyPR
            const preguntaSinId: PRDocentes = {
                dimensionId: 'dim1',
                criterio: 'Pregunta sin id u order',
                alternativas: [{ alternativa: '0', selected: false }],
            };

            const copyPR: PRDocentes[] = [preguntaSinId];

            render(
                <TablaEvaluacion
                    {...defaultProps}
                    dimensionesEspecialistas={dimensiones}
                    copyPR={copyPR}
                />
            );

            const radio = screen.getAllByRole('radio')[0];
            fireEvent.click(radio);

            expect(mockHandleCheckedRespuesta).toHaveBeenCalledWith('0', 0);
        });
    });

    describe('Renderizado sin dimensiones', () => {
        test('Renderiza preguntas secuencialmente y pasa el índice correcto a handleCheckedRespuesta', () => {
            const copyPR: PRDocentes[] = [
                {
                    id: 'q1',
                    criterio: 'Pregunta 1 sin dimensión',
                    alternativas: [{ alternativa: '0', selected: false }, { alternativa: '1', selected: true }],
                },
                {
                    id: 'q2',
                    criterio: 'Pregunta 2 sin dimensión',
                    alternativas: [{ alternativa: '0', selected: false }, { alternativa: '1', selected: false }],
                },
            ];

            const { container } = render(
                <TablaEvaluacion
                    {...defaultProps}
                    dimensionesEspecialistas={[]}
                    copyPR={copyPR}
                />
            );

            const radiosQ2 = container.querySelectorAll('input[name="question-q2"]');
            fireEvent.click(radiosQ2[1]);

            expect(mockHandleCheckedRespuesta).toHaveBeenCalledWith('1', 1);
        });
    });

    describe('Gestión de evidencias en la tabla', () => {
        test('Llama a handleDeleteEvidencia con el realIndex adecuado', () => {
            const dimensiones = [{ id: 'dim1', nombre: 'Dim 1' }];
            const copyPR: PRDocentes[] = [
                {
                    id: 'q1',
                    dimensionId: 'dim1',
                    criterio: 'Pregunta con evidencia',
                    requiereEvidencia: true,
                    evidencias: [
                        { nombre: 'doc1.pdf', url: 'http://example.com/doc1.pdf', tipo: 'application/pdf', fechaSubida: '2026-08-18' },
                    ],
                },
            ];

            render(
                <TablaEvaluacion
                    {...defaultProps}
                    dimensionesEspecialistas={dimensiones}
                    copyPR={copyPR}
                    dataEvaluacionDocente={{ activarEvidencias: true }}
                />
            );

            expect(screen.getByText('doc1.pdf')).toBeInTheDocument();
            const deleteBtn = screen.getByRole('button');
            fireEvent.click(deleteBtn);

            expect(mockHandleDeleteEvidencia).toHaveBeenCalledWith(0, 0);
        });
    });
});
