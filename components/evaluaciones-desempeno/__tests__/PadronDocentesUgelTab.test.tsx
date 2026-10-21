import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import PadronDocentesUgelTab from '../containers/PadronDocentesUgelTab';
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

describe('PadronDocentesUgelTab', () => {
  const defaultEvaluatedDnis = new Set(['12345678']);

  const mockDocentesSanRoman = [
    {
      id: 'doc-1',
      dni: '12345678',
      nombres: 'Ana',
      apellidos: 'Mamani Quispe',
      institucion: 'Politécnico Regional Los Andes',
      region: 2,
      distrito: 'Juliaca',
      cargo: 'Docente Nombrado',
    },
    {
      id: 'doc-2',
      dni: '87654321',
      nombres: 'Carlos',
      apellidos: 'Condori Ramos',
      institucion: 'I.E. Las Mercedes',
      region: 2,
      distrito: 'Juliaca',
      cargo: 'Docente Contratado',
    },
    {
      id: 'doc-3',
      dni: '55667788',
      nombres: 'Zulema',
      apellidos: 'Apaza Flores',
      institucion: 'I.E. José Antonio Encinas',
      region: 2,
      distrito: 'Juliaca',
      cargo: 'Docente de Primaria',
    },
  ];

  const mockDocentesPuno = [
    {
      id: 'doc-puno-1',
      dni: '11223344',
      nombres: 'Felipe',
      apellidos: 'Vilca Pari',
      institucion: 'I.E. Glorioso San Carlos',
      region: 1,
      distrito: 'Puno',
    },
  ];

  beforeEach(() => {
    jest.clearAllMocks();
    (getDocs as jest.Mock).mockImplementation((q) => {
      // Si la consulta es para region 2 (San Román)
      const isSanRoman = q?.args?.some((arg: any) => arg?.val === 2);
      const data = isSanRoman ? mockDocentesSanRoman : mockDocentesPuno;

      return Promise.resolve({
        forEach: (callback: (doc: any) => void) => {
          data.forEach((item) => {
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
      <PadronDocentesUgelTab
        idEvaluacion="eval-123"
        effectiveBasePath="/admin/evaluaciones-docentes"
        evaluatedDnisSet={defaultEvaluatedDnis}
        isAdmin={true}
      />
    );

    expect(
      screen.getByText(/Consulta del Padrón de Docentes por UGEL/i)
    ).toBeInTheDocument();
    expect(
      screen.getByText(/Para optimizar el rendimiento y evitar lecturas masivas/i)
    ).toBeInTheDocument();
  });

  test('Carga docentes de la UGEL seleccionada y renderiza la tabla', async () => {
    render(
      <PadronDocentesUgelTab
        idEvaluacion="eval-123"
        effectiveBasePath="/admin/evaluaciones-docentes"
        evaluatedDnisSet={defaultEvaluatedDnis}
        isAdmin={true}
      />
    );

    const selectElements = screen.getAllByRole('combobox');
    const ugelSelect = selectElements[0];

    // Seleccionamos San Román (id: 2)
    fireEvent.change(ugelSelect, { target: { value: '2' } });

    await waitFor(() => {
      expect(screen.getByText(/Mamani Quispe Ana/i)).toBeInTheDocument();
      expect(screen.getByText(/Condori Ramos Carlos/i)).toBeInTheDocument();
      expect(screen.getByText(/Apaza Flores Zulema/i)).toBeInTheDocument();
    });

    expect(getDocs).toHaveBeenCalledTimes(1);
    expect(screen.getByText('Memoria activa')).toBeInTheDocument();
    expect(screen.getByText(/docentes cargados de/i)).toBeInTheDocument();
  });

  test('Mantiene los datos en memoria (caché) sin volver a consultar Firestore al cambiar y regresar de UGEL', async () => {
    render(
      <PadronDocentesUgelTab
        idEvaluacion="eval-123"
        effectiveBasePath="/admin/evaluaciones-docentes"
        evaluatedDnisSet={defaultEvaluatedDnis}
        isAdmin={true}
      />
    );

    const selectElements = screen.getAllByRole('combobox');
    const ugelSelect = selectElements[0];

    // 1. Cargar San Román (id: 2)
    fireEvent.change(ugelSelect, { target: { value: '2' } });
    await waitFor(() => {
      expect(screen.getByText(/Mamani Quispe Ana/i)).toBeInTheDocument();
    });
    expect(getDocs).toHaveBeenCalledTimes(1);

    // 2. Cambiar a Puno (id: 1)
    fireEvent.change(ugelSelect, { target: { value: '1' } });
    await waitFor(() => {
      expect(screen.getByText(/Vilca Pari Felipe/i)).toBeInTheDocument();
    });
    expect(getDocs).toHaveBeenCalledTimes(2);

    // 3. Volver a San Román (id: 2) -> Debe cargar de la memoria sin llamar a getDocs
    fireEvent.change(ugelSelect, { target: { value: '2' } });
    await waitFor(() => {
      expect(screen.getByText(/Mamani Quispe Ana/i)).toBeInTheDocument();
    });
    expect(getDocs).toHaveBeenCalledTimes(2); // No se incrementó a 3 porque estaba en caché
  });

  test('Permite búsqueda instantánea en memoria por DNI o nombres', async () => {
    render(
      <PadronDocentesUgelTab
        idEvaluacion="eval-123"
        effectiveBasePath="/admin/evaluaciones-docentes"
        evaluatedDnisSet={defaultEvaluatedDnis}
        isAdmin={true}
      />
    );

    const selectElements = screen.getAllByRole('combobox');
    fireEvent.change(selectElements[0], { target: { value: '2' } });

    await waitFor(() => {
      expect(screen.getByText(/Mamani Quispe Ana/i)).toBeInTheDocument();
    });

    const searchInput = screen.getByPlaceholderText(/Buscar en 3 docentes por DNI/i);

    // Buscar por DNI
    fireEvent.change(searchInput, { target: { value: '87654321' } });
    expect(screen.getByText(/Condori Ramos Carlos/i)).toBeInTheDocument();
    expect(screen.queryByText(/Mamani Quispe Ana/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/Apaza Flores Zulema/i)).not.toBeInTheDocument();

    // Limpiar búsqueda
    const clearButton = screen.getByRole('button', { name: /Limpiar/i });
    fireEvent.click(clearButton);

    expect(screen.getByText(/Mamani Quispe Ana/i)).toBeInTheDocument();
    expect(screen.getByText(/Condori Ramos Carlos/i)).toBeInTheDocument();
  });

  test('Identifica docentes monitoreados (con Reevaluar/Reporte) y pendientes (con Monitorear)', async () => {
    render(
      <PadronDocentesUgelTab
        idEvaluacion="eval-123"
        effectiveBasePath="/admin/evaluaciones-docentes"
        evaluatedDnisSet={defaultEvaluatedDnis} // '12345678' está monitoreado
        isAdmin={true}
      />
    );

    const selectElements = screen.getAllByRole('combobox');
    fireEvent.change(selectElements[0], { target: { value: '2' } });

    await waitFor(() => {
      expect(screen.getByText(/Mamani Quispe Ana/i)).toBeInTheDocument();
    });

    // Ana Mamani (DNI 12345678) debe tener estado Monitoreado
    expect(screen.getByText('Monitoreado')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /Reevaluar/i })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /Reporte/i })).toBeInTheDocument();

    // Carlos Condori (DNI 87654321) debe tener estado Pendiente y botón Monitorear
    const monitorearLinks = screen.getAllByRole('link', { name: /Monitorear/i });
    expect(monitorearLinks.length).toBeGreaterThanOrEqual(1);

    // Filtrar solo Pendientes
    const pendientesTab = screen.getByRole('button', { name: /Pendientes \(2\)/i });
    fireEvent.click(pendientesTab);

    expect(screen.queryByText(/Mamani Quispe Ana/i)).not.toBeInTheDocument();
    expect(screen.getByText(/Condori Ramos Carlos/i)).toBeInTheDocument();
    expect(screen.getByText(/Apaza Flores Zulema/i)).toBeInTheDocument();
  });

  test('Fuerza recarga de datos al hacer clic en el botón de sincronización/refresco', async () => {
    render(
      <PadronDocentesUgelTab
        idEvaluacion="eval-123"
        effectiveBasePath="/admin/evaluaciones-docentes"
        evaluatedDnisSet={defaultEvaluatedDnis}
        isAdmin={true}
      />
    );

    const selectElements = screen.getAllByRole('combobox');
    fireEvent.change(selectElements[0], { target: { value: '2' } });

    await waitFor(() => {
      expect(screen.getByText(/Mamani Quispe Ana/i)).toBeInTheDocument();
    });
    expect(getDocs).toHaveBeenCalledTimes(1);

    const refreshButton = screen.getByTitle(/Volver a sincronizar datos de esta UGEL/i);
    fireEvent.click(refreshButton);

    await waitFor(() => {
      expect(getDocs).toHaveBeenCalledTimes(2);
    });
  });
});
