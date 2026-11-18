import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import ModalCrearEstudianteGeneral from '../ModalCrearEstudianteGeneral';

const mockCrearEstudianteIndividual = jest.fn();
const mockActualizarEstudiante = jest.fn();

jest.mock('@/features/hooks/useAgregarEvaluaciones', () => ({
  useAgregarEvaluaciones: () => ({
    crearEstudianteIndividual: (...args: any[]) => mockCrearEstudianteIndividual(...args),
    actualizarEstudiante: (...args: any[]) => mockActualizarEstudiante(...args),
    loaderCrearEstudiantes: false,
  }),
}));

jest.mock('@/features/utils/compressCarnetImage', () => ({
  compressCarnetImage: jest.fn(() =>
    Promise.resolve({
      blob: new Blob(['fake_compressed_image'], { type: 'image/jpeg' }),
      dataUrl: 'data:image/jpeg;base64,mockCompressedDataUrl',
      sizeInKb: 20.0,
      width: 300,
      height: 360,
    })
  ),
}));

jest.mock('react-toastify', () => ({
  toast: {
    loading: jest.fn(() => 'toast-1'),
    update: jest.fn(),
    success: jest.fn(),
    error: jest.fn(),
    info: jest.fn(),
  },
}));

describe('ModalCrearEstudianteGeneral', () => {
  let portalRoot: HTMLElement;

  beforeEach(() => {
    jest.clearAllMocks();
    portalRoot = document.createElement('div');
    portalRoot.setAttribute('id', 'portal-modal');
    document.body.appendChild(portalRoot);
  });

  afterEach(() => {
    if (portalRoot && document.body.contains(portalRoot)) {
      document.body.removeChild(portalRoot);
    }
  });

  const mockDocentesList = [
    { dni: '11223344', nombre: 'Pérez Gómez, Juan' },
    { dni: '55667788', nombre: 'López Quispe, María' },
  ];

  it('renders teacher selector dropdown when docentesList is provided in create mode', () => {
    render(
      <ModalCrearEstudianteGeneral
        isOpen={true}
        onClose={jest.fn()}
        mode="create"
        docentesList={mockDocentesList}
      />
    );

    expect(screen.getByText(/Docente a cargo/i)).toBeInTheDocument();
    expect(screen.getByText(/Pérez Gómez, Juan/i)).toBeInTheDocument();
    expect(screen.getByText(/López Quispe, María/i)).toBeInTheDocument();
  });

  it('populates fields and submits with teacher DNI in edit mode', async () => {
    const mockOnSuccess = jest.fn();
    const mockClose = jest.fn();

    render(
      <ModalCrearEstudianteGeneral
        isOpen={true}
        onClose={mockClose}
        mode="edit"
        estudianteData={{
          dni: '71234567',
          nombresApellidos: 'GARCIA LOPEZ, CARLOS',
          grado: '1',
          seccion: '1',
          genero: '1',
          dniDocente: '11223344',
        }}
        dniDocente="11223344"
        onSuccess={mockOnSuccess}
      />
    );

    expect(screen.getByDisplayValue('71234567')).toBeInTheDocument();
    expect(screen.getByDisplayValue('GARCIA LOPEZ, CARLOS')).toBeInTheDocument();

    const submitBtn = screen.getByRole('button', { name: /Guardar Cambios/i });
    fireEvent.click(submitBtn);

    await waitFor(() => {
      expect(mockActualizarEstudiante).toHaveBeenCalledWith(
        expect.objectContaining({
          dni: '71234567',
          nombresApellidos: 'GARCIA LOPEZ, CARLOS',
        }),
        '11223344'
      );
    });
  });
});
