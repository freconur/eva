import React from 'react';
import { render, screen, fireEvent, act } from '@testing-library/react';
import AdminTendenciasTab from '../AdminTendenciasTab';

// Mock de Firestore
const mockDirectoresEdi = [
  {
    id: 'dir-1',
    region: 1, // Puno
    totalEstudiantes: 20,
    sumaPuntajes: 300,
    promedioGlobal: 15,
    niveles: {
      Satisfactorio: 10,
      'En proceso': 5,
      'En inicio': 3,
      'Previo al inicio': 2,
    },
  },
  {
    id: 'dir-2',
    region: 2, // San Román
    totalEstudiantes: 30,
    sumaPuntajes: 420,
    promedioGlobal: 14,
    niveles: {
      Satisfactorio: 12,
      'En proceso': 10,
      'En inicio': 5,
      'Previo al inicio': 3,
    },
  },
];

const mockDirectoresEp1 = [
  {
    id: 'dir-3',
    region: 1,
    totalEstudiantes: 20,
    sumaPuntajes: 320,
    promedioGlobal: 16,
    niveles: {
      Satisfactorio: 12,
      'En proceso': 5,
      'En inicio': 2,
      'Previo al inicio': 1,
    },
  },
  {
    id: 'dir-4',
    region: 2,
    totalEstudiantes: 30,
    sumaPuntajes: 450,
    promedioGlobal: 15,
    niveles: {
      Satisfactorio: 15,
      'En proceso': 10,
      'En inicio': 3,
      'Previo al inicio': 2,
    },
  },
];

const mockDirectoresEp2 = [
  {
    id: 'dir-5',
    region: 1,
    totalEstudiantes: 20,
    sumaPuntajes: 340,
    promedioGlobal: 17,
    niveles: {
      Satisfactorio: 15,
      'En proceso': 3,
      'En inicio': 1,
      'Previo al inicio': 1,
    },
  },
  {
    id: 'dir-6',
    region: 2,
    totalEstudiantes: 30,
    sumaPuntajes: 480,
    promedioGlobal: 16,
    niveles: {
      Satisfactorio: 18,
      'En proceso': 8,
      'En inicio': 2,
      'Previo al inicio': 2,
    },
  },
];

jest.mock('firebase/firestore', () => ({
  getFirestore: jest.fn(() => ({})),
  doc: jest.fn(),
  collection: jest.fn(),
  query: jest.fn(),
  where: jest.fn(),
  limit: jest.fn(),
  onSnapshot: jest.fn(() => () => {}),
  setDoc: jest.fn(),
  getDoc: jest.fn((ref) =>
    Promise.resolve({
      exists: () => true,
      data: () => ({
        grados: {
          '2_1': { ediId: 'eval-edi-1', ep1Id: 'eval-ep1-1', ep2Id: 'eval-ep2-1' },
          '2_2': { ediId: 'eval-edi-2', ep1Id: 'eval-ep1-2' },
        },
      }),
    })
  ),
  getDocs: jest.fn((collRef: any) => {
    // Retornar según el ID de evaluación consultado
    return Promise.resolve({
      empty: false,
      forEach: (cb: any) => {
        mockDirectoresEdi.forEach((d) => cb({ id: d.id, data: () => d }));
      },
    });
  }),
}));

// Mock del contexto global
let mockCurrentUser = {
  dni: 'admin123',
  rol: 4, // Admin DRE
  region: undefined,
};

jest.mock('@/features/context/GlolbalContext', () => ({
  useGlobalContext: () => ({
    currentUserData: mockCurrentUser,
    categorias: [
      { id: 1, categoria: 'LEE DIVERSOS TIPOS DE TEXTOS' },
      { id: 2, categoria: 'RESUELVE PROBLEMAS DE CANTIDAD' },
    ],
  }),
}));

// Mock de react-chartjs-2
jest.mock('react-chartjs-2', () => ({
  Bar: (props: any) => (
    <div
      data-testid="mock-bar-chart"
      aria-label="Mock Bar Chart"
      data-labels={JSON.stringify(props.data?.labels)}
      data-datasets={JSON.stringify(props.data?.datasets)}
    />
  ),
  Line: (props: any) => (
    <div
      data-testid="mock-line-chart"
      aria-label="Mock Line Chart"
      data-labels={JSON.stringify(props.data?.labels)}
      data-datasets={JSON.stringify(props.data?.datasets)}
    />
  ),
}));

// Mock de AcordeonGraficosTendencia
jest.mock('@/components/reportes/AcordeonGraficosTendencia', () => {
  return function MockAcordeon(props: any) {
    return <div data-testid="mock-acordeon-comparativa">AcordeonGraficosTendencia: {props.idEvaluacion}</div>;
  };
});

describe('AdminTendenciasTab Component', () => {
  const mockEvaluacion: any = {
    id: 'eval-edi-1',
    nombre: 'Evaluación Diagnóstica Comunicación',
    grado: 2,
    categoria: 1,
    mesDelExamen: 3,
    nivelYPuntaje: [
      { nivel: 'Satisfactorio', min: 18, max: 20 },
      { nivel: 'En proceso', min: 14, max: 17 },
      { nivel: 'En inicio', min: 11, max: 13 },
      { nivel: 'Previo al inicio', min: 0, max: 10 },
    ],
  };

  const defaultProps: any = {
    evaluacion: mockEvaluacion,
    evaluacionesDb: [
      mockEvaluacion,
      { id: 'eval-ep1-1', nombre: 'Evaluación Progresiva 1 Comunicación', grado: 2, categoria: 1 },
      { id: 'eval-ep2-1', nombre: 'Evaluación Progresiva 2 Comunicación', grado: 2, categoria: 1 },
    ],
    currentUserData: mockCurrentUser,
    yearSelected: 2026,
    monthSelected: 3,
    onSelectEvaluacion: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
    mockCurrentUser = {
      dni: 'admin123',
      rol: 4,
      region: undefined,
    };
  });

  it('renderiza correctamente el título de Tendencia Longitudinal por Etapas con el badge EDI ➔ EP1 ➔ EP2', async () => {
    await act(async () => {
      render(<AdminTendenciasTab {...defaultProps} />);
    });

    expect(screen.getByText(/Tendencia Longitudinal por Etapas/i)).toBeInTheDocument();
    expect(screen.getByText('EDI ➔ EP1 ➔ EP2')).toBeInTheDocument();
  });

  it('renderiza el selector de Ámbito / UGEL con opción Global y opciones de UGEL', async () => {
    await act(async () => {
      render(<AdminTendenciasTab {...defaultProps} />);
    });

    const selector = screen.getByLabelText(/Seleccionar ámbito de resultados/i) as HTMLSelectElement;
    expect(selector).toBeInTheDocument();
    expect(selector.value).toBe('all');
    expect(screen.getByText(/Toda la Región \(Global - DRE Puno\)/i)).toBeInTheDocument();
    expect(screen.getByText(/UGEL Puno/i)).toBeInTheDocument();
    expect(screen.getByText(/UGEL San Román/i)).toBeInTheDocument();
  });

  it('permite alternar entre ámbito Global y una UGEL específica actualizando los gráficos', async () => {
    await act(async () => {
      render(<AdminTendenciasTab {...defaultProps} />);
    });

    const selector = screen.getByLabelText(/Seleccionar ámbito de resultados/i) as HTMLSelectElement;

    // Cambiar a UGEL San Román (id: 2)
    await act(async () => {
      fireEvent.change(selector, { target: { value: '2' } });
    });

    expect(selector.value).toBe('2');
    expect(screen.getByText(/de UGEL San Román/i)).toBeInTheDocument();
  });

  it('bloquea el selector de UGEL si el usuario es Especialista UGEL (rol 1)', async () => {
    const especialistaUser = {
      dni: 'esp123',
      rol: 1,
      region: 2, // San Román
    };

    await act(async () => {
      render(<AdminTendenciasTab {...defaultProps} currentUserData={especialistaUser} />);
    });

    const selector = screen.getByLabelText(/Seleccionar ámbito de resultados/i) as HTMLSelectElement;
    expect(selector).toBeDisabled();
    expect(selector.value).toBe('2');
    expect(screen.getByText('Asignada')).toBeInTheDocument();
  });

  it('permite alternar la métrica de niveles entre Porcentaje (%) y N° Alumnos', async () => {
    await act(async () => {
      render(<AdminTendenciasTab {...defaultProps} />);
    });

    const btnPct = screen.getByRole('button', { name: /Porcentaje \(%\)/i });
    const btnCant = screen.getByRole('button', { name: /N° Alumnos/i });

    expect(btnPct).toHaveAttribute('aria-pressed', 'true');
    expect(btnCant).toHaveAttribute('aria-pressed', 'false');

    await act(async () => {
      fireEvent.click(btnCant);
    });

    expect(btnCant).toHaveAttribute('aria-pressed', 'true');
    expect(btnPct).toHaveAttribute('aria-pressed', 'false');
  });

  it('renderiza los 3 gráficos: Promedio Barras, Curva Línea y Tendencia por Niveles', async () => {
    await act(async () => {
      render(<AdminTendenciasTab {...defaultProps} />);
    });

    expect(screen.getByText(/Promedio Global por Etapa \(Barras\)/i)).toBeInTheDocument();
    expect(screen.getByText(/Curva de Evolución del Promedio \(Línea\)/i)).toBeInTheDocument();
    expect(screen.getByText(/Tendencia de Rendimiento por Niveles/i)).toBeInTheDocument();

    const barChart = screen.getByTestId('mock-bar-chart');
    expect(barChart).toBeInTheDocument();

    const lineCharts = screen.getAllByTestId('mock-line-chart');
    expect(lineCharts.length).toBe(2); // Curva de evolución + Tendencia por niveles
  });

  it('permite desplegar el comparador histórico ad-hoc complementario', async () => {
    await act(async () => {
      render(<AdminTendenciasTab {...defaultProps} />);
    });

    const toggleBtn = screen.getByRole('button', { name: /Comparador Histórico Ad-Hoc/i });
    expect(toggleBtn).toBeInTheDocument();

    // Inicialmente cerrado
    expect(screen.queryByTestId('mock-acordeon-comparativa')).not.toBeInTheDocument();

    // Abrir acordeón
    await act(async () => {
      fireEvent.click(toggleBtn);
    });

    expect(screen.getByTestId('mock-acordeon-comparativa')).toBeInTheDocument();
  });

  it('muestra mensaje informativo si la evaluación no está en la matriz', async () => {
    const unconfiguredEval = {
      ...mockEvaluacion,
      id: 'eval-otra-999',
      grado: 5,
    };

    await act(async () => {
      render(
        <AdminTendenciasTab
          {...defaultProps}
          evaluacion={unconfiguredEval}
        />
      );
    });

    expect(
      screen.getByText(/Evaluación fuera del flujo longitudinal de etapas/i)
    ).toBeInTheDocument();
  });

  it('permite filtrar etapas para comparar solo 2 o ver 1 sola evaluación individualmente', async () => {
    await act(async () => {
      render(<AdminTendenciasTab {...defaultProps} />);
    });

    // 1. Verificar estado inicial: Tríada completa (3 evaluaciones)
    expect(screen.getByText(/Tríada completa \(3 evaluaciones\)/i)).toBeInTheDocument();
    const btnEdi = screen.getByRole('button', { name: /EDI \(Diagnóstica\)/i });
    const btnEp1 = screen.getByRole('button', { name: /EP1 \(Progresiva 1\)/i });
    const btnEp2 = screen.getByRole('button', { name: /EP2 \(Progresiva 2\)/i });

    expect(btnEdi).toHaveAttribute('aria-pressed', 'true');
    expect(btnEp1).toHaveAttribute('aria-pressed', 'true');
    expect(btnEp2).toHaveAttribute('aria-pressed', 'true');

    // 2. Desactivar EP2 para comparar solo 2 evaluaciones (EDI y EP1)
    await act(async () => {
      fireEvent.click(btnEp2);
    });

    expect(btnEp2).toHaveAttribute('aria-pressed', 'false');
    expect(screen.getByText(/Comparativa directa \(2 evaluaciones\)/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Ver todas \(3\)/i })).toBeInTheDocument();

    // 3. Desactivar EP1 para ver solo 1 evaluación (EDI)
    await act(async () => {
      fireEvent.click(btnEp1);
    });

    expect(btnEp1).toHaveAttribute('aria-pressed', 'false');
    expect(screen.getByText(/Vista individual \(1 evaluación\)/i)).toBeInTheDocument();

    // 4. Asegurar que no se pueda desmarcar la última etapa activa
    expect(btnEdi).toBeDisabled();
    await act(async () => {
      fireEvent.click(btnEdi);
    });
    expect(btnEdi).toHaveAttribute('aria-pressed', 'true');

    // 5. Restaurar las 3 etapas con el botón rápido "Ver todas (3)"
    const btnVerTodas = screen.getByRole('button', { name: /Ver todas \(3\)/i });
    await act(async () => {
      fireEvent.click(btnVerTodas);
    });

    expect(screen.getByText(/Tríada completa \(3 evaluaciones\)/i)).toBeInTheDocument();
    expect(btnEdi).toHaveAttribute('aria-pressed', 'true');
    expect(btnEp1).toHaveAttribute('aria-pressed', 'true');
    expect(btnEp2).toHaveAttribute('aria-pressed', 'true');
  });

  it('permite alternar entre Líneas y Barras agrupadas, activar Auto Zoom y alternar Deltas en el gráfico de niveles', async () => {
    await act(async () => {
      render(<AdminTendenciasTab {...defaultProps} />);
    });

    // 1. Alternar Líneas vs Barras
    const btnLineas = screen.getByRole('button', { name: /Líneas/i });
    const btnBarras = screen.getByRole('button', { name: /Barras/i });

    expect(btnLineas).toHaveAttribute('aria-pressed', 'true');
    expect(btnBarras).toHaveAttribute('aria-pressed', 'false');

    await act(async () => {
      fireEvent.click(btnBarras);
    });

    expect(btnBarras).toHaveAttribute('aria-pressed', 'true');
    expect(btnLineas).toHaveAttribute('aria-pressed', 'false');

    // 2. Toggle Auto Zoom
    const btnZoom = screen.getByRole('button', { name: /Auto Zoom/i });
    expect(btnZoom).toHaveAttribute('aria-pressed', 'false');

    await act(async () => {
      fireEvent.click(btnZoom);
    });

    expect(screen.getByRole('button', { name: /Zoom Activo/i })).toHaveAttribute('aria-pressed', 'true');
    expect(screen.getByText(/Escala amplificada a max/i)).toBeInTheDocument();

    // 3. Toggle Deltas en Tooltip
    const btnDeltas = screen.getByRole('button', { name: /Δ Deltas On/i });
    expect(btnDeltas).toHaveAttribute('aria-pressed', 'true');

    await act(async () => {
      fireEvent.click(btnDeltas);
    });

    expect(screen.getByRole('button', { name: /Δ Deltas Off/i })).toHaveAttribute('aria-pressed', 'false');

    // 4. Toggle Valores Permanentes en Puntos y Barras
    const btnValores = screen.getByRole('button', { name: /Valores On/i });
    expect(btnValores).toHaveAttribute('aria-pressed', 'true');

    await act(async () => {
      fireEvent.click(btnValores);
    });

    expect(screen.getByRole('button', { name: /Valores Off/i })).toHaveAttribute('aria-pressed', 'false');
  });
});
