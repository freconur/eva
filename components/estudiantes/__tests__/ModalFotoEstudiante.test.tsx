import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import ModalFotoEstudiante from '../ModalFotoEstudiante';
import { UserEstudiante } from '@/features/types/types';

const mockActualizarFotoEstudiante = jest.fn();
jest.mock('@/features/hooks/useAgregarEvaluaciones', () => ({
  useAgregarEvaluaciones: () => ({
    actualizarFotoEstudiante: (...args: any[]) => mockActualizarFotoEstudiante(...args),
  }),
}));

const mockUploadBytes = jest.fn();
const mockGetDownloadURL = jest.fn();
const mockDeleteObject = jest.fn();
jest.mock('firebase/storage', () => ({
  getStorage: jest.fn(() => ({})),
  ref: jest.fn((_storage, path) => ({ path })),
  uploadBytes: (...args: any[]) => mockUploadBytes(...args),
  getDownloadURL: (...args: any[]) => mockGetDownloadURL(...args),
  deleteObject: (...args: any[]) => mockDeleteObject(...args),
}));

jest.mock('@/features/utils/compressCarnetImage', () => ({
  compressCarnetImage: jest.fn(() =>
    Promise.resolve({
      blob: new Blob(['fake_compressed_image'], { type: 'image/jpeg' }),
      dataUrl: 'data:image/jpeg;base64,mockCompressedDataUrl',
      sizeInKb: 24.5,
      width: 300,
      height: 360,
    })
  ),
}));

jest.mock('react-toastify', () => ({
  toast: {
    loading: jest.fn(() => 'toast-id-1'),
    update: jest.fn(),
    success: jest.fn(),
    error: jest.fn(),
    info: jest.fn(),
  },
}));

describe('ModalFotoEstudiante', () => {
  const mockStudent: UserEstudiante = {
    id: '70809010',
    dni: '70809010',
    nombresApellidos: 'Quispe Mamani, Juan Carlos',
    grado: '5',
    seccion: '1',
    genero: '1',
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('no renderiza nada si isOpen es false', () => {
    const { container } = render(
      <ModalFotoEstudiante
        isOpen={false}
        onClose={jest.fn()}
        student={mockStudent}
        dniDocente="12345678"
      />
    );
    expect(container.firstChild).toBeNull();
  });

  test('renderiza correctamente los datos del estudiante cuando está abierto', () => {
    render(
      <ModalFotoEstudiante
        isOpen={true}
        onClose={jest.fn()}
        student={mockStudent}
        dniDocente="12345678"
      />
    );

    expect(screen.getByText('Quispe Mamani, Juan Carlos')).toBeInTheDocument();
    expect(screen.getByText('70809010')).toBeInTheDocument();
    expect(screen.getAllByText('Foto Carnet').length).toBeGreaterThanOrEqual(1);
    expect(screen.getByText('2.5 × 3.0 cm')).toBeInTheDocument();
  });

  test('permite seleccionar un archivo, comprime y muestra botón de guardar', async () => {
    const mockOnSuccess = jest.fn();
    mockUploadBytes.mockResolvedValueOnce({
      ref: { fullPath: 'estudiantes/70809010/foto.jpg' },
    });
    mockGetDownloadURL.mockResolvedValueOnce('https://storage.googleapis.com/test-bucket/estudiantes/70809010/foto.jpg');
    mockActualizarFotoEstudiante.mockResolvedValueOnce({ success: true });

    render(
      <ModalFotoEstudiante
        isOpen={true}
        onClose={jest.fn()}
        student={mockStudent}
        dniDocente="12345678"
        onSuccess={mockOnSuccess}
      />
    );

    const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement;
    expect(fileInput).toBeInTheDocument();

    const fakeFile = new File(['photo_content'], 'carnet.jpg', { type: 'image/jpeg' });
    fireEvent.change(fileInput, { target: { files: [fakeFile] } });

    await waitFor(() => {
      expect(screen.getByText(/Lista para guardar \(24.5 KB\)/i)).toBeInTheDocument();
    });

    const saveButton = screen.getByText('Guardar foto');
    expect(saveButton).toBeInTheDocument();

    fireEvent.click(saveButton);

    await waitFor(() => {
      expect(mockUploadBytes).toHaveBeenCalled();
      expect(mockActualizarFotoEstudiante).toHaveBeenCalledWith(
        '70809010',
        'https://storage.googleapis.com/test-bucket/estudiantes/70809010/foto.jpg',
        '12345678'
      );
      expect(mockOnSuccess).toHaveBeenCalledWith(
        '70809010',
        'https://storage.googleapis.com/test-bucket/estudiantes/70809010/foto.jpg'
      );
    });
  });

  test('permite eliminar foto si el estudiante ya tiene una', async () => {
    const studentWithPhoto: UserEstudiante = {
      ...mockStudent,
      fotoUrl: 'https://storage.googleapis.com/test-bucket/estudiantes/70809010/foto.jpg',
    };

    window.confirm = jest.fn(() => true);
    mockActualizarFotoEstudiante.mockResolvedValueOnce({ success: true });

    const mockOnSuccess = jest.fn();
    render(
      <ModalFotoEstudiante
        isOpen={true}
        onClose={jest.fn()}
        student={studentWithPhoto}
        dniDocente="12345678"
        onSuccess={mockOnSuccess}
      />
    );

    const deleteBtn = screen.getByText('Eliminar foto actual');
    expect(deleteBtn).toBeInTheDocument();

    fireEvent.click(deleteBtn);

    await waitFor(() => {
      expect(mockActualizarFotoEstudiante).toHaveBeenCalledWith('70809010', null, '12345678');
      expect(mockOnSuccess).toHaveBeenCalledWith('70809010', null);
    });
  });
});
