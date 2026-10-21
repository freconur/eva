import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import PadronDirectoresUgelTab from '../containers/PadronDirectoresUgelTab';
import { getDocs } from 'firebase/firestore';

jest.mock('@/firebase/firebase.config', () => ({
  db: {},
}));

jest.mock('firebase/firestore', () => ({
  collection: jest.fn(() => ({ id: 'usuarios' })),
  query: jest.fn((...args) => ({ args })),
  where: jest.fn((field, op, val) => ({ field, op, val })),
  getDocs: jest.fn(),
}));

describe('PadronDirectoresUgelTab', () => {
  const defaultEvaluatedDnis = new Set(['12345678']);

  const mockDirectoresSanRoman = [
    {
      id: 'dir-1',
      dni: '12345678',
      nombres: 'Ana',
      apellidos: 'Mamani Quispe',
      institucion: 'Politécnico Regional Los Andes',
      region: 2,
      distrito: 'Juliaca',
      cargo: 'Directora Designada',
      rol: 2,
    },
    {
      id: 'dir-2',
      dni: '87654321',
      nombres: 'Carlos',
      apellidos: 'Condori Ramos',
      institucion: 'I.E. Las Mercedes',
      region: 2,
      distrito: 'Juliaca',
      cargo: 'Director Encargado',
      rol: 2,
    },
  ];

  beforeEach(() => {
    jest.clearAllMocks();
    (getDocs as jest.Mock).mockImplementation(() => {
      return Promise.resolve({
        forEach: (callback: (doc: any) => void) => {
          mockDirectoresSanRoman.forEach((item) => {
            callback({
              id: item.id,
              data: () => item,
            });
          });
        },
      });
    });
  });

  test('Muestra el estado de bienvenida inicial solicitando seleccionar una UGEL', () => {
    render(
      <PadronDirectoresUgelTab
        idEvaluacion="eval-dir-123"
        effectiveBasePath="/admin/evaluaciones-directores"
        evaluatedDnisSet={defaultEvaluatedDnis}
        isAdmin={true}
      />
    );

    expect(
      screen.getByText(/Consulta del Padrón de Directores por UGEL/i)
    ).toBeInTheDocument();
    expect(
      screen.getByText(/Para optimizar el rendimiento y evitar lecturas masivas/i)
    ).toBeInTheDocument();
  });

  test('Carga directores al seleccionar una UGEL y muestra estado de monitoreo', async () => {
    render(
      <PadronDirectoresUgelTab
        idEvaluacion="eval-dir-123"
        effectiveBasePath="/admin/evaluaciones-directores"
        evaluatedDnisSet={defaultEvaluatedDnis}
        isAdmin={true}
      />
    );

    const selects = screen.getAllByRole('combobox');
    const ugelSelect = selects[0];

    fireEvent.change(ugelSelect, { target: { value: '2' } });

    await waitFor(() => {
      expect(screen.getByText(/CONDORI RAMOS CARLOS/i)).toBeInTheDocument();
      expect(screen.getByText(/MAMANI QUISPE ANA/i)).toBeInTheDocument();
    });

    // 12345678 is in defaultEvaluatedDnis -> Monitoreado
    expect(screen.getByText('Monitoreado')).toBeInTheDocument();
    // 87654321 is not in defaultEvaluatedDnis -> Pendiente
    expect(screen.getByText('Pendiente')).toBeInTheDocument();
  });

  test('Permite filtrar en memoria por nombre o DNI', async () => {
    render(
      <PadronDirectoresUgelTab
        idEvaluacion="eval-dir-123"
        effectiveBasePath="/admin/evaluaciones-directores"
        evaluatedDnisSet={defaultEvaluatedDnis}
        isAdmin={true}
      />
    );

    const selects = screen.getAllByRole('combobox');
    fireEvent.change(selects[0], { target: { value: '2' } });

    await waitFor(() => {
      expect(screen.getByText(/CONDORI RAMOS CARLOS/i)).toBeInTheDocument();
    });

    const searchInput = screen.getByPlaceholderText(/Buscar en 2 directores por DNI/i);
    fireEvent.change(searchInput, { target: { value: 'Ana' } });

    expect(screen.getByText(/MAMANI QUISPE ANA/i)).toBeInTheDocument();
    expect(screen.queryByText(/CONDORI RAMOS CARLOS/i)).not.toBeInTheDocument();
  });

  test('Filtra por estado (Monitoreados / Pendientes)', async () => {
    render(
      <PadronDirectoresUgelTab
        idEvaluacion="eval-dir-123"
        effectiveBasePath="/admin/evaluaciones-directores"
        evaluatedDnisSet={defaultEvaluatedDnis}
        isAdmin={true}
      />
    );

    const selects = screen.getAllByRole('combobox');
    fireEvent.change(selects[0], { target: { value: '2' } });

    await waitFor(() => {
      expect(screen.getByText(/CONDORI RAMOS CARLOS/i)).toBeInTheDocument();
    });

    // Click on Monitoreados filter
    const monitoreadosBtn = screen.getByRole('button', { name: /Monitoreados \(1\)/i });
    fireEvent.click(monitoreadosBtn);

    expect(screen.getByText(/MAMANI QUISPE ANA/i)).toBeInTheDocument();
    expect(screen.queryByText(/CONDORI RAMOS CARLOS/i)).not.toBeInTheDocument();

    // Click on Pendientes filter
    const pendientesBtn = screen.getByRole('button', { name: /Pendientes \(1\)/i });
    fireEvent.click(pendientesBtn);

    expect(screen.getByText(/CONDORI RAMOS CARLOS/i)).toBeInTheDocument();
    expect(screen.queryByText(/MAMANI QUISPE ANA/i)).not.toBeInTheDocument();
  });

  test('Cuando el usuario es especialista (!isAdmin): carga automáticamente los directores de su UGEL y no muestra el dropdown para cambiar de UGEL', async () => {
    render(
      <PadronDirectoresUgelTab
        idEvaluacion="eval-dir-123"
        effectiveBasePath="/especialistas/evaluaciones-director"
        evaluatedDnisSet={defaultEvaluatedDnis}
        isAdmin={false}
        currentUserRegion={2} // UGEL San Román
      />
    );

    // Debe mostrar la etiqueta fija de su UGEL con badge 'Mi UGEL'
    expect(screen.getAllByText(/UGEL San Román/i).length).toBeGreaterThan(0);
    expect(screen.getByText('Mi UGEL')).toBeInTheDocument();

    // NO debe haber un combobox para elegir otra UGEL
    const ugelSelect = screen.queryByRole('combobox');
    expect(ugelSelect).toBeNull();

    // Debe cargar automáticamente los directores de su UGEL sin requerir selección manual
    await waitFor(() => {
      expect(screen.getByText(/CONDORI RAMOS CARLOS/i)).toBeInTheDocument();
      expect(screen.getByText(/MAMANI QUISPE ANA/i)).toBeInTheDocument();
    });
  });

  test('Cuando el usuario es admin (isAdmin): tiene la opción de elegir cualquier UGEL con el dropdown', () => {
    render(
      <PadronDirectoresUgelTab
        idEvaluacion="eval-dir-123"
        effectiveBasePath="/admin/evaluaciones-directores"
        evaluatedDnisSet={defaultEvaluatedDnis}
        isAdmin={true}
      />
    );

    // Debe mostrar el select de UGEL con la opción por defecto
    const selects = screen.getAllByRole('combobox');
    expect(selects[0]).toBeInTheDocument();
    expect(screen.getByText('-- Seleccionar UGEL --')).toBeInTheDocument();

    // NO debe mostrar el badge 'Mi UGEL'
    expect(screen.queryByText('Mi UGEL')).not.toBeInTheDocument();
  });

  test('Buscador por DNI en Base de Datos: Admin puede consultar cualquier director y monitorearlo', async () => {
    const mockBuscarUsuario = jest.fn().mockResolvedValue({
      id: 'dir-yunguyo',
      dni: '99887766',
      nombres: 'Pedro',
      apellidos: 'Flores',
      institucion: 'I.E. Micaela Bastidas',
      region: 9, // UGEL Yunguyo
      rol: 2,
    });

    render(
      <PadronDirectoresUgelTab
        idEvaluacion="eval-dir-123"
        effectiveBasePath="/admin/evaluaciones-directores"
        evaluatedDnisSet={defaultEvaluatedDnis}
        isAdmin={true}
        buscarUsuario={mockBuscarUsuario}
      />
    );

    const inputDni = screen.getByPlaceholderText(/Ingrese DNI del director \(8 dígitos\) para buscar en la base de datos/i);
    fireEvent.change(inputDni, { target: { value: '99887766' } });
    fireEvent.click(screen.getByRole('button', { name: /Buscar en Base de Datos/i }));

    await waitFor(() => {
      expect(mockBuscarUsuario).toHaveBeenCalledWith('99887766');
      expect(screen.getByText(/FLORES PEDRO/i)).toBeInTheDocument();
    });

    expect(screen.getByText(/Acceso Regional \(Admin\)/i)).toBeInTheDocument();
    expect(screen.getAllByText(/UGEL Yunguyo/i).length).toBeGreaterThan(0);

    const btnMonitorear = screen.getByRole('link', { name: /Monitorear Director/i });
    expect(btnMonitorear).toHaveAttribute(
      'href',
      '/admin/evaluaciones-directores/evaluacion/evaluar-director?idEvaluacion=eval-dir-123&idDirector=99887766'
    );
  });

  test('Buscador por DNI en Base de Datos: Especialista detecta director de otra UGEL y bloquea monitoreo', async () => {
    const mockBuscarUsuario = jest.fn().mockResolvedValue({
      id: 'dir-yunguyo',
      dni: '99887766',
      nombres: 'Pedro',
      apellidos: 'Flores',
      institucion: 'I.E. Micaela Bastidas',
      region: 9, // UGEL Yunguyo
      rol: 2,
    });

    render(
      <PadronDirectoresUgelTab
        idEvaluacion="eval-dir-123"
        effectiveBasePath="/especialistas/evaluaciones-director"
        evaluatedDnisSet={defaultEvaluatedDnis}
        isAdmin={false}
        currentUserRegion={1} // UGEL Puno
        buscarUsuario={mockBuscarUsuario}
      />
    );

    const inputDni = screen.getByPlaceholderText(/Ingrese DNI del director \(8 dígitos\) para buscar en la base de datos/i);
    fireEvent.change(inputDni, { target: { value: '99887766' } });
    fireEvent.click(screen.getByRole('button', { name: /Buscar en Base de Datos/i }));

    await waitFor(() => {
      expect(screen.getByText(/FLORES PEDRO/i)).toBeInTheDocument();
    });

    // Detecta otra UGEL y bloquea el monitoreo
    expect(screen.getByText(/Sin Autorización/i)).toBeInTheDocument();
    expect(screen.getAllByText(/Director no pertenece a su UGEL/i).length).toBeGreaterThan(0);
    expect(screen.getByText(/Monitoreo Bloqueado/i)).toBeInTheDocument();
    expect(screen.queryByRole('link', { name: /Monitorear Director/i })).not.toBeInTheDocument();
  });
});
