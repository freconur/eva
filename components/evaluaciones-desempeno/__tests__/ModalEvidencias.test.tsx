import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { ModalEvidencias } from '../modals/ModalEvidencias';

jest.mock('@/firebase/firebase.config', () => ({
  db: {},
  storage: {},
  app: {},
  initAnalytics: jest.fn().mockResolvedValue(null),
}));

const mockUploadEvidencia = jest.fn().mockResolvedValue({
  nombre: 'evidencia_foto.jpg',
  url: 'https://storage.mock/evidencia_foto.jpg',
  tipo: 'image/jpeg',
  fechaSubida: new Date().toISOString(),
});
const mockDeleteEvidencia = jest.fn().mockResolvedValue(undefined);

jest.mock('@/features/hooks/useEvaluacionDesempenoBase', () => ({
  __esModule: true,
  default: () => ({
    uploadEvidencia: mockUploadEvidencia,
    deleteEvidencia: mockDeleteEvidencia,
  }),
}));

describe('ModalEvidencias', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  const defaultProps = {
    isOpen: true,
    onClose: jest.fn(),
    idEvaluacion: 'eval-123',
    collectionName: 'evaluaciones-docentes',
    pregunta: {
      id: 'preg-1',
      criterio: 'Criterio Pedagógico 1',
      descripcionEvidencia: 'Fotografía o ficha de trabajo',
      evidencias: [
        {
          nombre: 'sesion_aprendizaje.pdf',
          url: 'https://storage.mock/sesion_aprendizaje.pdf',
          tipo: 'application/pdf',
          fechaSubida: '2026-10-10T12:00:00Z',
        },
      ],
    },
    evaluadoDni: '12345678',
    currentSessionId: 'session-abc',
    onEvidenciasChange: jest.fn(),
  };

  it('no renderiza nada si isOpen es false', () => {
    const { container } = render(<ModalEvidencias {...defaultProps} isOpen={false} />);
    expect(container.firstChild).toBeNull();
  });

  it('renderiza la descripción de evidencia solicitada y la lista de evidencias existentes', () => {
    render(<ModalEvidencias {...defaultProps} />);

    expect(screen.getByText(/evidencias del criterio/i)).toBeInTheDocument();
    expect(screen.getByText('Fotografía o ficha de trabajo')).toBeInTheDocument();
    expect(screen.getByText('sesion_aprendizaje.pdf')).toBeInTheDocument();
  });

  it('permite eliminar una evidencia existente', async () => {
    window.confirm = jest.fn().mockReturnValue(true);

    render(<ModalEvidencias {...defaultProps} />);

    const deleteButton = screen.getByTitle('Eliminar evidencia');
    fireEvent.click(deleteButton);

    await waitFor(() => {
      expect(mockDeleteEvidencia).toHaveBeenCalledWith('https://storage.mock/sesion_aprendizaje.pdf');
      expect(defaultProps.onEvidenciasChange).toHaveBeenCalledWith([]);
    });
  });

  it('permite subir un archivo de evidencia nuevo', async () => {
    render(<ModalEvidencias {...defaultProps} />);

    const file = new File(['dummy content'], 'evidencia_foto.jpg', { type: 'image/jpeg' });
    const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement;

    fireEvent.change(fileInput, { target: { files: [file] } });

    await waitFor(() => {
      expect(mockUploadEvidencia).toHaveBeenCalledWith(
        file,
        'eval-123',
        'session-abc',
        'preg-1'
      );
    });
  });
});
