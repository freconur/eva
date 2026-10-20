import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { ModalCrearEvaluacionDesempeno } from '../modals/ModalCrearEvaluacionDesempeno';

jest.mock('@/firebase/firebase.config', () => ({
  db: {},
  storage: {},
  app: {},
  initAnalytics: jest.fn().mockResolvedValue(null),
}));

const mockCreateEvaluacion = jest.fn().mockResolvedValue('eval-123');

jest.mock('@/features/hooks/useEvaluacionDesempenoBase', () => ({
  __esModule: true,
  default: () => ({
    createEvaluacion: mockCreateEvaluacion,
  }),
}));

jest.mock('@/features/context/GlolbalContext', () => ({
  useGlobalContext: () => ({
    loaderModales: false,
  }),
}));

describe('ModalCrearEvaluacionDesempeno', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renderiza con los campos exactos de desempeño (nombre y categoría) y sin tipo de examen cognitivo', () => {
    render(
      <ModalCrearEvaluacionDesempeno
        idEvaluacion=""
        collectionName="evaluaciones-docentes"
        title="Crear Evaluación de Docente"
        onClose={jest.fn()}
      />
    );

    // Título y botón cerrar en texto
    expect(screen.getByText('Crear Evaluación de Docente')).toBeInTheDocument();
    expect(screen.getByText('cerrar')).toBeInTheDocument();

    // Campo Nombre
    expect(screen.getByText('Nombre de la evaluación')).toBeInTheDocument();
    expect(
      screen.getByPlaceholderText('Ej. Evaluación de Desempeño Q1')
    ).toBeInTheDocument();

    // Campo Etapa / Fase inicial
    expect(screen.getByText('Nombre de la primera etapa / fase')).toBeInTheDocument();
    expect(
      screen.getByPlaceholderText('Ej. Octubre, Ronda I, Diagnóstica...')
    ).toBeInTheDocument();

    // Campo Categoría
    expect(screen.getByText('Categoría')).toBeInTheDocument();
    expect(screen.getByRole('combobox')).toBeInTheDocument();
    expect(screen.getByText('Seleccione una categoría')).toBeInTheDocument();
    expect(screen.getByText('SEGUIMIENTO')).toBeInTheDocument();
    expect(screen.getByText('RETROALIMENTACIÓN')).toBeInTheDocument();

    // Botón Guardar
    expect(screen.getByRole('button', { name: /guardar/i })).toBeInTheDocument();

    // Verificación clave: NO debe existir ningún selector de Tipo de Evaluación (regular, progresiva, escala)
    expect(screen.queryByText(/tipo de evaluación/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/progresiva/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/regular/i)).not.toBeInTheDocument();
  });

  it('permite completar el formulario y llama a createEvaluacion con datos limpios', async () => {
    const handleClose = jest.fn();
    const handleSuccess = jest.fn();

    render(
      <ModalCrearEvaluacionDesempeno
        idEvaluacion=""
        collectionName="evaluaciones-docentes"
        title="Crear Evaluación de Docente"
        onClose={handleClose}
        onSuccess={handleSuccess}
      />
    );

    const inputName = screen.getByPlaceholderText('Ej. Evaluación de Desempeño Q1');
    const selectCategoria = screen.getByRole('combobox');
    const submitBtn = screen.getByRole('button', { name: /guardar/i });

    fireEvent.change(inputName, { target: { value: 'Evaluación Trimestral Docentes' } });
    fireEvent.change(selectCategoria, { target: { value: 'SEGUIMIENTO' } });
    fireEvent.click(submitBtn);

    await waitFor(() => {
      expect(mockCreateEvaluacion).toHaveBeenCalledWith({
        name: 'Evaluación Trimestral Docentes',
        categoria: 'SEGUIMIENTO',
        faseNombre: 'Fase Diagnóstica',
        active: false,
      });
      expect(handleClose).toHaveBeenCalled();
      expect(handleSuccess).toHaveBeenCalled();
    });
  });

  it('permite especificar un nombre de fase personalizado al crear la evaluación', async () => {
    const handleClose = jest.fn();
    const handleSuccess = jest.fn();

    render(
      <ModalCrearEvaluacionDesempeno
        idEvaluacion=""
        collectionName="evaluaciones-docentes"
        title="Crear Evaluación de Docente"
        onClose={handleClose}
        onSuccess={handleSuccess}
      />
    );

    const inputName = screen.getByPlaceholderText('Ej. Evaluación de Desempeño Q1');
    const inputFase = screen.getByPlaceholderText('Ej. Octubre, Ronda I, Diagnóstica...');
    const selectCategoria = screen.getByRole('combobox');
    const submitBtn = screen.getByRole('button', { name: /guardar/i });

    fireEvent.change(inputName, { target: { value: 'Evaluación Anual 2026' } });
    fireEvent.change(inputFase, { target: { value: 'Octubre II' } });
    fireEvent.change(selectCategoria, { target: { value: 'SEGUIMIENTO' } });
    fireEvent.click(submitBtn);

    await waitFor(() => {
      expect(mockCreateEvaluacion).toHaveBeenCalledWith({
        name: 'Evaluación Anual 2026',
        categoria: 'SEGUIMIENTO',
        faseNombre: 'Octubre II',
        active: false,
      });
      expect(handleClose).toHaveBeenCalled();
      expect(handleSuccess).toHaveBeenCalled();
    });
  });

  it('permite cerrar el modal haciendo clic en "cerrar"', () => {
    const handleClose = jest.fn();

    render(
      <ModalCrearEvaluacionDesempeno
        idEvaluacion=""
        collectionName="evaluaciones-docentes"
        onClose={handleClose}
      />
    );

    fireEvent.click(screen.getByText('cerrar'));
    expect(handleClose).toHaveBeenCalled();
  });
});
