import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { ModalEditarTituloDescripcion } from '../modals/ModalEditarTituloDescripcion';
import { updateDoc } from 'firebase/firestore';
import { toast } from 'react-toastify';

jest.mock('@/firebase/firebase.config', () => ({
  db: {},
  storage: {},
  app: {},
  initAnalytics: jest.fn().mockResolvedValue(null),
}));

jest.mock('firebase/firestore', () => ({
  doc: jest.fn(() => ({ id: 'mock-doc-ref' })),
  updateDoc: jest.fn().mockResolvedValue(undefined),
}));

jest.mock('react-toastify', () => ({
  toast: {
    success: jest.fn(),
    error: jest.fn(),
  },
}));

describe('ModalEditarTituloDescripcion', () => {
  const defaultProps = {
    idEvaluacion: 'eval-123',
    collectionName: 'evaluaciones-docentes',
    tituloActual: 'Rúbrica de Mediación Didáctica',
    descripcionActual: 'Supervisión y acompañamiento pedagógico al desempeño docente en aula',
    onClose: jest.fn(),
    onSuccess: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renderiza correctamente el modal con los valores iniciales y foco en el título', () => {
    render(<ModalEditarTituloDescripcion {...defaultProps} />);

    expect(screen.getByText('Editar Título y Descripción')).toBeInTheDocument();
    const inputTitulo = screen.getByPlaceholderText('Ej. RÚBRICA DE MEDIACIÓN DIDÁCTICA');
    const textareaDescripcion = screen.getByPlaceholderText(
      'Ej. Supervisión y acompañamiento pedagógico al desempeño docente en aula'
    );

    expect(inputTitulo).toHaveValue('Rúbrica de Mediación Didáctica');
    expect(textareaDescripcion).toHaveValue(
      'Supervisión y acompañamiento pedagógico al desempeño docente en aula'
    );
  });

  it('permite modificar el título y la descripción y guardar los cambios', async () => {
    render(<ModalEditarTituloDescripcion {...defaultProps} />);

    const inputTitulo = screen.getByPlaceholderText('Ej. RÚBRICA DE MEDIACIÓN DIDÁCTICA');
    const textareaDescripcion = screen.getByPlaceholderText(
      'Ej. Supervisión y acompañamiento pedagógico al desempeño docente en aula'
    );

    fireEvent.change(inputTitulo, { target: { value: 'Nuevo Título de Evaluación' } });
    fireEvent.change(textareaDescripcion, { target: { value: 'Nueva descripción de acompañamiento' } });

    const submitBtn = screen.getByRole('button', { name: /guardar cambios/i });
    fireEvent.click(submitBtn);

    await waitFor(() => {
      expect(updateDoc).toHaveBeenCalledWith(
        expect.anything(),
        expect.objectContaining({
          name: 'Nuevo Título de Evaluación',
          descripcion: 'Nueva descripción de acompañamiento',
        })
      );
      expect(toast.success).toHaveBeenCalledWith('Título y descripción actualizados con éxito.');
      expect(defaultProps.onSuccess).toHaveBeenCalled();
      expect(defaultProps.onClose).toHaveBeenCalled();
    });
  });

  it('muestra validación de error si el título está vacío', async () => {
    render(<ModalEditarTituloDescripcion {...defaultProps} />);

    const inputTitulo = screen.getByPlaceholderText('Ej. RÚBRICA DE MEDIACIÓN DIDÁCTICA');
    fireEvent.change(inputTitulo, { target: { value: '   ' } });

    const submitBtn = screen.getByRole('button', { name: /guardar cambios/i });
    expect(submitBtn).toBeDisabled();
  });

  it('cierra el modal al presionar la tecla Escape', () => {
    render(<ModalEditarTituloDescripcion {...defaultProps} />);

    fireEvent.keyDown(window, { key: 'Escape' });
    expect(defaultProps.onClose).toHaveBeenCalled();
  });
});
