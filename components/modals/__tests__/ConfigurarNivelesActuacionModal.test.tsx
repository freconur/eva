import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import ConfigurarNivelesActuacionModal from '@/modals/ConfigurarNivelesActuacion';

const mockGuardarNiveles = jest.fn().mockResolvedValue({ ok: true });

jest.mock('@/firebase/firebase.config', () => ({
  db: {},
}));

jest.mock('@/features/context/GlolbalContext', () => ({
  useGlobalContext: () => ({
    currentUserData: { email: 'admin@ugel.edu.pe', rol: 4 },
  }),
}));

jest.mock('@/features/hooks/useNivelesActuacionesConfig', () => {
  const original = jest.requireActual('@/features/hooks/useNivelesActuacionesConfig');
  return {
    ...original,
    useNivelesActuacionesConfig: () => ({
      niveles: original.DEFAULT_NIVELES_ACTUACIONES,
      loading: false,
      isSaving: false,
      guardarNiveles: mockGuardarNiveles,
      restaurarValoresSugeridos: () => original.DEFAULT_NIVELES_ACTUACIONES,
    }),
  };
});

describe('ConfigurarNivelesActuacionModal Component', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('no renderiza nada cuando showModal es false', () => {
    const { container } = render(
      <ConfigurarNivelesActuacionModal showModal={false} handleClose={jest.fn()} />
    );
    expect(container.firstChild).toBeNull();
  });

  it('renderiza el modal con la cabecera y los 4 niveles predeterminados', () => {
    render(
      <ConfigurarNivelesActuacionModal showModal={true} handleClose={jest.fn()} />
    );

    // Título y subtítulo
    expect(screen.getByText(/Configurar Niveles por Actuación/i)).toBeInTheDocument();
    expect(screen.getByText(/Escala global de progresión continua/i)).toBeInTheDocument();

    // Los 4 niveles deben estar en los inputs
    expect(screen.getByDisplayValue('Por desarrollar')).toBeInTheDocument();
    expect(screen.getByDisplayValue('Iniciándose')).toBeInTheDocument();
    expect(screen.getByDisplayValue('Consolidación')).toBeInTheDocument();
    expect(screen.getByDisplayValue('Autonomía')).toBeInTheDocument();

    // Botones de acción
    expect(screen.getByText(/Agregar Nivel/i)).toBeInTheDocument();
    expect(screen.getByText(/Restaurar Plantilla Sugerida/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Guardar Configuración Global/i })).toBeInTheDocument();
  });

  it('permite modificar el nombre de un nivel y actualizarlo', () => {
    render(
      <ConfigurarNivelesActuacionModal showModal={true} handleClose={jest.fn()} />
    );

    const inputNivel1 = screen.getByDisplayValue('Por desarrollar');
    fireEvent.change(inputNivel1, { target: { value: 'En desarrollo' } });

    expect(screen.getByDisplayValue('En desarrollo')).toBeInTheDocument();
  });

  it('permite agregar un nuevo nivel a la escala', () => {
    render(
      <ConfigurarNivelesActuacionModal showModal={true} handleClose={jest.fn()} />
    );

    const btnAgregar = screen.getByText(/Agregar Nivel/i);
    fireEvent.click(btnAgregar);

    // Debe existir un 5to nivel
    expect(screen.getByDisplayValue('Nuevo Nivel 5')).toBeInTheDocument();
  });

  it('restaura los 4 niveles por defecto al hacer clic en restaurar plantilla', () => {
    render(
      <ConfigurarNivelesActuacionModal showModal={true} handleClose={jest.fn()} />
    );

    // Modificamos el primer nivel
    const input = screen.getByDisplayValue('Por desarrollar');
    fireEvent.change(input, { target: { value: 'Cambiado Temporal' } });
    expect(screen.getByDisplayValue('Cambiado Temporal')).toBeInTheDocument();

    // Hacemos clic en restaurar
    const btnRestaurar = screen.getByText(/Restaurar Plantilla Sugerida/i);
    fireEvent.click(btnRestaurar);

    expect(screen.getByDisplayValue('Por desarrollar')).toBeInTheDocument();
  });

  it('llama a guardarNiveles y cierra el modal al enviar el formulario válido', async () => {
    const handleClose = jest.fn();
    const handleSuccess = jest.fn();

    render(
      <ConfigurarNivelesActuacionModal
        showModal={true}
        handleClose={handleClose}
        onSuccess={handleSuccess}
      />
    );

    const btnGuardar = screen.getByRole('button', { name: /Guardar Configuración Global/i });
    fireEvent.click(btnGuardar);

    await waitFor(() => {
      expect(mockGuardarNiveles).toHaveBeenCalledTimes(1);
      expect(handleClose).toHaveBeenCalledTimes(1);
      expect(handleSuccess).toHaveBeenCalledTimes(1);
    });
  });

  it('cierra el modal al presionar la tecla Escape', () => {
    const handleClose = jest.fn();
    render(
      <ConfigurarNivelesActuacionModal showModal={true} handleClose={handleClose} />
    );

    fireEvent.keyDown(window, { key: 'Escape' });
    expect(handleClose).toHaveBeenCalledTimes(1);
  });
});
