import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import RetroalimentacionSection from '../RetroalimentacionSection';
import { RetroalimentacionDinamica } from '@/features/types/types';

describe('RetroalimentacionSection', () => {
    const mockHandleAddFeedbackField = jest.fn();
    const mockHandleRemoveFeedbackField = jest.fn();
    const mockHandleChangeFeedbackLabel = jest.fn();
    const mockHandleChangeFeedbackDescription = jest.fn();
    const mockHandleChangeFeedbackValue = jest.fn();

    const sampleFields: RetroalimentacionDinamica[] = [
        {
            etiqueta: 'AVANCES',
            descripcion: 'Guía explicativa para avances del docente',
            contenido: 'Texto de avances del evaluador',
        },
        {
            etiqueta: 'DIFICULTADES',
            descripcion: '', // Sin descripción
            contenido: '',
        },
    ];

    beforeEach(() => {
        jest.clearAllMocks();
    });

    describe('Modo Evaluador no-admin (Directores y Especialistas)', () => {
        test('NO renderiza el botón "+ Agregar campo" cuando isAdmin es false', () => {
            render(
                <RetroalimentacionSection
                    retroalimentacionDinamica={sampleFields}
                    isAutoreporte={false}
                    isAdmin={false}
                    handleAddFeedbackField={mockHandleAddFeedbackField}
                    handleRemoveFeedbackField={mockHandleRemoveFeedbackField}
                    handleChangeFeedbackLabel={mockHandleChangeFeedbackLabel}
                    handleChangeFeedbackDescription={mockHandleChangeFeedbackDescription}
                    handleChangeFeedbackValue={mockHandleChangeFeedbackValue}
                />
            );

            expect(screen.queryByRole('button', { name: /\+ Agregar campo/i })).not.toBeInTheDocument();
        });

        test('NO renderiza botones para eliminar campos', () => {
            render(
                <RetroalimentacionSection
                    retroalimentacionDinamica={sampleFields}
                    isAutoreporte={false}
                    isAdmin={false}
                    handleAddFeedbackField={mockHandleAddFeedbackField}
                    handleRemoveFeedbackField={mockHandleRemoveFeedbackField}
                    handleChangeFeedbackLabel={mockHandleChangeFeedbackLabel}
                    handleChangeFeedbackDescription={mockHandleChangeFeedbackDescription}
                    handleChangeFeedbackValue={mockHandleChangeFeedbackValue}
                />
            );

            expect(screen.queryByTitle(/Eliminar campo/i)).not.toBeInTheDocument();
        });

        test('Renderiza las etiquetas como texto estático y no como inputs editables', () => {
            render(
                <RetroalimentacionSection
                    retroalimentacionDinamica={sampleFields}
                    isAutoreporte={false}
                    isAdmin={false}
                    handleAddFeedbackField={mockHandleAddFeedbackField}
                    handleRemoveFeedbackField={mockHandleRemoveFeedbackField}
                    handleChangeFeedbackLabel={mockHandleChangeFeedbackLabel}
                    handleChangeFeedbackDescription={mockHandleChangeFeedbackDescription}
                    handleChangeFeedbackValue={mockHandleChangeFeedbackValue}
                />
            );

            expect(screen.getByText('AVANCES')).toBeInTheDocument();
            expect(screen.getByText('DIFICULTADES')).toBeInTheDocument();
            expect(screen.queryByPlaceholderText('Título del campo...')).not.toBeInTheDocument();
        });

        test('Muestra la descripción como guía informativa si existe, y no como textarea editable', () => {
            render(
                <RetroalimentacionSection
                    retroalimentacionDinamica={sampleFields}
                    isAutoreporte={false}
                    isAdmin={false}
                    handleAddFeedbackField={mockHandleAddFeedbackField}
                    handleRemoveFeedbackField={mockHandleRemoveFeedbackField}
                    handleChangeFeedbackLabel={mockHandleChangeFeedbackLabel}
                    handleChangeFeedbackDescription={mockHandleChangeFeedbackDescription}
                    handleChangeFeedbackValue={mockHandleChangeFeedbackValue}
                />
            );

            // La guía de texto debe estar visible como texto estático
            expect(screen.getByText('Guía explicativa para avances del docente')).toBeInTheDocument();
            // No debe existir el textarea editable de configuración de descripción
            expect(
                screen.queryByPlaceholderText(/Aquí debe detallar en qué situaciones/i)
            ).not.toBeInTheDocument();
        });

        test('No muestra caja de guía si la descripción está vacía', () => {
            render(
                <RetroalimentacionSection
                    retroalimentacionDinamica={[{ etiqueta: 'COMPROMISOS', descripcion: '', contenido: '' }]}
                    isAutoreporte={false}
                    isAdmin={false}
                    handleChangeFeedbackValue={mockHandleChangeFeedbackValue}
                />
            );

            expect(screen.getByText('COMPROMISOS')).toBeInTheDocument();
            // Solo debe haber exactamente un textarea (el de contenido)
            const textareas = screen.getAllByRole('textbox');
            expect(textareas).toHaveLength(1);
            expect(textareas[0]).toHaveAttribute('placeholder', 'Describa compromisos...');
        });

        test('Permite redactar en el textarea de contenido llamando a handleChangeFeedbackValue', () => {
            render(
                <RetroalimentacionSection
                    retroalimentacionDinamica={sampleFields}
                    isAutoreporte={false}
                    isAdmin={false}
                    handleChangeFeedbackValue={mockHandleChangeFeedbackValue}
                />
            );

            const contentInput = screen.getByPlaceholderText('Describa avances...');
            expect(contentInput).toHaveValue('Texto de avances del evaluador');

            fireEvent.change(contentInput, { target: { value: 'Nueva observación' } });
            expect(mockHandleChangeFeedbackValue).toHaveBeenCalledWith(0, 'Nueva observación');
        });
    });

    describe('Modo Administrador (isAdmin: true, isAutoreporte: false)', () => {
        test('Renderiza el botón "+ Agregar campo" y permite hacer clic', () => {
            render(
                <RetroalimentacionSection
                    retroalimentacionDinamica={sampleFields}
                    isAutoreporte={false}
                    isAdmin={true}
                    handleAddFeedbackField={mockHandleAddFeedbackField}
                    handleRemoveFeedbackField={mockHandleRemoveFeedbackField}
                    handleChangeFeedbackLabel={mockHandleChangeFeedbackLabel}
                    handleChangeFeedbackDescription={mockHandleChangeFeedbackDescription}
                    handleChangeFeedbackValue={mockHandleChangeFeedbackValue}
                />
            );

            const addButton = screen.getByRole('button', { name: /\+ Agregar campo/i });
            expect(addButton).toBeInTheDocument();

            fireEvent.click(addButton);
            expect(mockHandleAddFeedbackField).toHaveBeenCalledTimes(1);
        });

        test('Renderiza inputs editables para las etiquetas de los campos', () => {
            render(
                <RetroalimentacionSection
                    retroalimentacionDinamica={sampleFields}
                    isAutoreporte={false}
                    isAdmin={true}
                    handleAddFeedbackField={mockHandleAddFeedbackField}
                    handleRemoveFeedbackField={mockHandleRemoveFeedbackField}
                    handleChangeFeedbackLabel={mockHandleChangeFeedbackLabel}
                    handleChangeFeedbackDescription={mockHandleChangeFeedbackDescription}
                    handleChangeFeedbackValue={mockHandleChangeFeedbackValue}
                />
            );

            const labelInputs = screen.getAllByPlaceholderText('Título del campo...');
            expect(labelInputs).toHaveLength(2);
            expect(labelInputs[0]).toHaveValue('AVANCES');

            fireEvent.change(labelInputs[0], { target: { value: 'FORTALEZAS' } });
            expect(mockHandleChangeFeedbackLabel).toHaveBeenCalledWith(0, 'FORTALEZAS');
        });

        test('Renderiza botones de eliminar campo y responde al clic', () => {
            render(
                <RetroalimentacionSection
                    retroalimentacionDinamica={sampleFields}
                    isAutoreporte={false}
                    isAdmin={true}
                    handleAddFeedbackField={mockHandleAddFeedbackField}
                    handleRemoveFeedbackField={mockHandleRemoveFeedbackField}
                    handleChangeFeedbackLabel={mockHandleChangeFeedbackLabel}
                    handleChangeFeedbackDescription={mockHandleChangeFeedbackDescription}
                    handleChangeFeedbackValue={mockHandleChangeFeedbackValue}
                />
            );

            const removeButtons = screen.getAllByTitle(/Eliminar campo/i);
            expect(removeButtons).toHaveLength(2);

            fireEvent.click(removeButtons[1]);
            expect(mockHandleRemoveFeedbackField).toHaveBeenCalledWith(1);
        });

        test('Renderiza textarea de descripción editable para configurar la plantilla', () => {
            render(
                <RetroalimentacionSection
                    retroalimentacionDinamica={sampleFields}
                    isAutoreporte={false}
                    isAdmin={true}
                    handleAddFeedbackField={mockHandleAddFeedbackField}
                    handleRemoveFeedbackField={mockHandleRemoveFeedbackField}
                    handleChangeFeedbackLabel={mockHandleChangeFeedbackLabel}
                    handleChangeFeedbackDescription={mockHandleChangeFeedbackDescription}
                    handleChangeFeedbackValue={mockHandleChangeFeedbackValue}
                />
            );

            const descInputs = screen.getAllByPlaceholderText(/Aquí debe detallar en qué situaciones/i);
            expect(descInputs).toHaveLength(2);
            expect(descInputs[0]).toHaveValue('Guía explicativa para avances del docente');

            fireEvent.change(descInputs[0], { target: { value: 'Nueva guía para avances' } });
            expect(mockHandleChangeFeedbackDescription).toHaveBeenCalledWith(0, 'Nueva guía para avances');
        });
    });

    describe('Modo Autorreporte (isAutoreporte: true)', () => {
        test('No permite agregar ni eliminar campos aún si isAdmin es true', () => {
            render(
                <RetroalimentacionSection
                    retroalimentacionDinamica={sampleFields}
                    isAutoreporte={true}
                    isAdmin={true}
                    handleAddFeedbackField={mockHandleAddFeedbackField}
                    handleRemoveFeedbackField={mockHandleRemoveFeedbackField}
                    handleChangeFeedbackLabel={mockHandleChangeFeedbackLabel}
                    handleChangeFeedbackDescription={mockHandleChangeFeedbackDescription}
                    handleChangeFeedbackValue={mockHandleChangeFeedbackValue}
                />
            );

            expect(screen.queryByRole('button', { name: /\+ Agregar campo/i })).not.toBeInTheDocument();
            expect(screen.queryByTitle(/Eliminar campo/i)).not.toBeInTheDocument();
            expect(screen.queryByPlaceholderText('Título del campo...')).not.toBeInTheDocument();
        });
    });
});
