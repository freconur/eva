import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import DirectorTendenciasTab from '../DirectorTendenciasTab';

// Mock de Firestore
jest.mock('firebase/firestore', () => ({
  getFirestore: jest.fn(() => ({})),
  doc: jest.fn(),
  getDoc: jest.fn(() =>
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
  onSnapshot: jest.fn(() => () => {}),
  setDoc: jest.fn(),
}));

// Mock del contexto global
jest.mock('@/features/context/GlolbalContext', () => ({
  useGlobalContext: () => ({
    currentUserData: {
      dni: '12345678',
      rol: 2,
      institucion: 'IE 123',
    },
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
    />
  ),
  Line: (props: any) => (
    <div
      data-testid="mock-line-chart"
      aria-label="Mock Line Chart"
      data-labels={JSON.stringify(props.data?.labels)}
      data-datasets={JSON.stringify(props.data?.datasets?.map((d: any) => d.label))}
    />
  ),
}));

// Mock de Firebase Functions
jest.mock('firebase/functions', () => ({
  getFunctions: jest.fn(() => ({})),
  httpsCallable: jest.fn(() => () => Promise.resolve({ data: { estudiantes: [], promedioGlobal: [], datosPorMes: [] } })),
}));

// Mock de GraficoTendenciaColegio para verificar llamadas sin cargar Chart.js pesado
jest.mock('@/components/grafico-tendencia', () => {
  return function MockGraficoTendencia(props: any) {
    return (
      <div data-testid="mock-grafico-tendencia">
        <span>GraficoTendencia: {props.evaluacion?.nombre}</span>
        {props.soloPrincipales && <span>[soloPrincipales]</span>}
        {props.soloPieYCobertura && <span>[soloPieYCobertura]</span>}
        {props.soloDocentesYSecciones && <span>[soloDocentesYSecciones]</span>}
      </div>
    );
  };
});

describe('DirectorTendenciasTab Component', () => {
  const mockEvaluacion: any = {
    id: 'eval-edi-1',
    nombre: 'Evaluación Diagnóstica Comunicación',
    grado: 2,
    categoria: 1,
    mesDelExamen: 3,
  };

  const defaultProps: any = {
    evaluacion: mockEvaluacion,
    datosPorMes: [{ mes: 3, promedio: 14.5 }],
    mesesConDataDisponibles: [3],
    promedioGlobal: [{ mes: 3, promedio: 14.5 }],
    monthSelected: 3,
    promedioPorDocente: [],
    evaluados: 28,
    pendientes: 2,
    listaPendientes: [],
    estudiantesFiltrados: [
      { id: 'est-1', puntaje: 16, nivel: 'Satisfactorio', docente: 'Docente 1', seccion: 'A' },
      { id: 'est-2', puntaje: 12, nivel: 'En Proceso', docente: 'Docente 1', seccion: 'A' },
    ],
    estudiantes: [],
    availableSections: [
      { id: 1, name: 'A' },
      { id: 2, name: 'B' },
    ],
    docentesMap: new Map(),
    evaluacionesDb: [
      mockEvaluacion,
      {
        id: 'eval-edi-2',
        nombre: 'Evaluación Diagnóstica Matemática',
        grado: 2,
        categoria: 2,
        mesDelExamen: 3,
      },
    ],
    initialGrado: 2,
    initialSeccion: 'all',
    isLoadingData: false,
    onSelectEvaluacion: jest.fn(),
    onSelectGrado: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renderiza correctamente el switch de sub-vistas (Visión General, Tendencia, Cobertura, Docentes)', async () => {
    await React.act(async () => {
      render(<DirectorTendenciasTab {...defaultProps} />);
    });

    expect(screen.getByRole('tab', { name: /Visión General/i })).toBeInTheDocument();
    expect(screen.getByRole('tab', { name: /Tendencia y Promedios/i })).toBeInTheDocument();
    expect(screen.getByRole('tab', { name: /Logro y Cobertura/i })).toBeInTheDocument();
    expect(screen.getByRole('tab', { name: /Docentes y Aulas/i })).toBeInTheDocument();
  });

  it('permite alternar entre sub-vistas al hacer clic en los botones del toolbar', async () => {
    await React.act(async () => {
      render(<DirectorTendenciasTab {...defaultProps} />);
    });

    // En vista inicial (Visión General / Todos), renderiza los gráficos de etapas y los de cobertura y docentes
    expect(screen.getByText(/Tendencia Longitudinal por Etapas/i)).toBeInTheDocument();
    expect(screen.getByText('[soloPieYCobertura]')).toBeInTheDocument();
    expect(screen.getByText('[soloDocentesYSecciones]')).toBeInTheDocument();

    // Cambiar a sub-vista Tendencia y Promedios
    const btnTendencia = screen.getByRole('tab', { name: /Tendencia y Promedios/i });
    await React.act(async () => {
      fireEvent.click(btnTendencia);
    });
    expect(btnTendencia).toHaveAttribute('aria-selected', 'true');
    expect(screen.getByText(/Tendencia Longitudinal por Etapas/i)).toBeInTheDocument();
    expect(screen.queryByText('[soloPieYCobertura]')).not.toBeInTheDocument();

    // Cambiar a sub-vista Logro y Cobertura
    const btnCobertura = screen.getByRole('tab', { name: /Logro y Cobertura/i });
    await React.act(async () => {
      fireEvent.click(btnCobertura);
    });
    expect(btnCobertura).toHaveAttribute('aria-selected', 'true');
    expect(screen.getByText('[soloPieYCobertura]')).toBeInTheDocument();
    expect(screen.queryByText(/Tendencia Longitudinal por Etapas/i)).not.toBeInTheDocument();

    // Cambiar a sub-vista Docentes y Aulas
    const btnDocentes = screen.getByRole('tab', { name: /Docentes y Aulas/i });
    await React.act(async () => {
      fireEvent.click(btnDocentes);
    });
    expect(btnDocentes).toHaveAttribute('aria-selected', 'true');
    expect(screen.getByText('[soloDocentesYSecciones]')).toBeInTheDocument();
  });

  it('renderiza la barra de materias con RADALECTOR y permite alternar métrica de niveles (% vs N°)', async () => {
    await React.act(async () => {
      render(<DirectorTendenciasTab {...defaultProps} />);
    });

    // Verifica que el título temático muestra RADALECTOR para categoría 1
    const title = screen.getByText(/RADALECTOR:/i);
    expect(title).toBeInTheDocument();

    // Verifica los botones de alternancia de métrica (Porcentaje (%) vs N° Alumnos)
    const btnPct = screen.getByRole('button', { name: /Porcentaje \(%\)/i });
    const btnNum = screen.getByRole('button', { name: /N° Alumnos/i });
    expect(btnPct).toBeInTheDocument();
    expect(btnNum).toBeInTheDocument();

    // Alternar a N° Alumnos
    await React.act(async () => {
      fireEvent.click(btnNum);
    });
    expect(btnNum).toHaveClass('bg-blue-600');

    // Verificar que los gráficos Bar y Line de react-chartjs-2 están presentes
    expect(screen.getByTestId('mock-bar-chart')).toBeInTheDocument();
    expect(screen.getAllByTestId('mock-line-chart').length).toBeGreaterThanOrEqual(1);
  });

  it('renderiza el flujo de etapas longitudinales EDI ➔ EP1 ➔ EP2 y simplifica la cabecera sin dropdowns redundantes', async () => {
    await React.act(async () => {
      render(<DirectorTendenciasTab {...defaultProps} />);
    });

    // Debe mostrar la insignia del flujo longitudinal
    expect(screen.getByText('EDI ➔ EP1 ➔ EP2')).toBeInTheDocument();

    // No debe mostrar los dropdowns de selección redundantes en la cabecera
    expect(screen.queryByText(/Evaluación:/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/Grado:/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/Sección:/i)).not.toBeInTheDocument();

    // Debe mostrar las insignias informativas del grado y alcance institucional
    expect(screen.getByText('2° Primaria')).toBeInTheDocument();
    expect(screen.getByText(/Todas las aulas/i)).toBeInTheDocument();
  });

  it('coloca los niveles de logro en el eje X del gráfico de tendencia y las etapas en los datasets', async () => {
    await React.act(async () => {
      render(<DirectorTendenciasTab {...defaultProps} />);
    });

    const lineCharts = screen.getAllByTestId('mock-line-chart');
    // El segundo gráfico de líneas corresponde al gráfico de tendencia de niveles
    const trendChart = lineCharts[1];
    expect(trendChart).toBeInTheDocument();

    const labelsAttr = trendChart.getAttribute('data-labels');
    expect(labelsAttr).toBeTruthy();
    const labels = JSON.parse(labelsAttr!);
    // Los niveles deben ser los labels del eje X
    expect(labels).toEqual(['Previo al Inicio', 'En Inicio', 'En Proceso', 'Satisfactorio']);

    // Los datasets deben contener las etapas (EDI, EP1, EP2)
    const datasetsAttr = trendChart.getAttribute('data-datasets');
    expect(datasetsAttr).toBeTruthy();
    const datasets = JSON.parse(datasetsAttr!);
    expect(datasets.some((d: string) => d.includes('EDI'))).toBe(true);
  });

  it('oculta los gráficos de EDI/EP1/EP2 y muestra la vista independiente con Resumen Ejecutivo si la evaluación no está configurada en la matriz', async () => {
    const independentEval: any = {
      id: 'eval-independiente-999',
      nombre: 'Simulacro Institucional de Comunicación',
      grado: 2,
      categoria: 1,
      mesDelExamen: 4,
    };

    const independentProps: any = {
      ...defaultProps,
      evaluacion: independentEval,
      datosPorMes: [{ mes: 4, promedio: 15.2 }], // Solo 1 mes (sin histórico mensual múltiple)
      mesesConDataDisponibles: [4],
      promedioGlobal: [{ mes: 4, promedio: 15.2 }],
      monthSelected: 4,
    };

    await React.act(async () => {
      render(<DirectorTendenciasTab {...independentProps} />);
    });

    // 1. NO debe mostrar la insignia ni el flujo de EDI ➔ EP1 ➔ EP2
    expect(screen.queryByText('EDI ➔ EP1 ➔ EP2')).not.toBeInTheDocument();
    expect(screen.queryByText(/Tendencia Longitudinal por Etapas/i)).not.toBeInTheDocument();

    // 2. Debe mostrar la insignia de Evaluación Independiente
    expect(screen.getByText('Evaluación Independiente')).toBeInTheDocument();

    // 3. Debe mostrar el título de la evaluación en mayúsculas (Regla 3)
    expect(
      screen.getByText(/SIMULACRO INSTITUCIONAL DE COMUNICACIÓN:/i)
    ).toBeInTheDocument();

    // 4. Debe mostrar la tarjeta de Resumen Ejecutivo con KPIs clave
    expect(screen.getByText(/Resumen Ejecutivo/i)).toBeInTheDocument();
    expect(screen.getByText('Promedio General')).toBeInTheDocument();
    expect(screen.getByText('Estudiantes Evaluados')).toBeInTheDocument();
    expect(screen.getByText('Nivel Predominante')).toBeInTheDocument();

    // 5. Debe mostrar los gráficos de logro y comparativas de la evaluación independiente
    expect(screen.getByText('[soloPieYCobertura]')).toBeInTheDocument();
    expect(screen.getByText('[soloDocentesYSecciones]')).toBeInTheDocument();
  });

  it('muestra el gráfico de evolución mensual si la evaluación independiente tiene histórico de varios meses', async () => {
    const independentEvalConMeses: any = {
      id: 'eval-mensual-888',
      nombre: 'Evaluación Mensual Continua',
      grado: 2,
      categoria: 1,
      mesDelExamen: 5,
    };

    const propsConMeses: any = {
      ...defaultProps,
      evaluacion: independentEvalConMeses,
      datosPorMes: [
        { mes: 3, promedio: 12.0 },
        { mes: 4, promedio: 14.0 },
        { mes: 5, promedio: 15.5 },
      ],
      mesesConDataDisponibles: [3, 4, 5],
      promedioGlobal: [
        { mes: 3, promedio: 12.0 },
        { mes: 4, promedio: 14.0 },
        { mes: 5, promedio: 15.5 },
      ],
      monthSelected: 5,
    };

    await React.act(async () => {
      render(<DirectorTendenciasTab {...propsConMeses} />);
    });

    // Debe mostrar la cabecera de Evaluación Independiente
    expect(screen.getByText('Evaluación Independiente')).toBeInTheDocument();

    // Al tener múltiples meses, debe renderizar la evolución histórica mensual con soloPrincipales
    expect(screen.getByText(/Evolución Histórica Mensual/i)).toBeInTheDocument();
    expect(screen.getByText('[soloPrincipales]')).toBeInTheDocument();

    // NO debe mostrar el flujo EDI ➔ EP1 ➔ EP2
    expect(screen.queryByText('EDI ➔ EP1 ➔ EP2')).not.toBeInTheDocument();
  });

  it('muestra únicamente la pestaña de RADALECTOR si la evaluación es de Lectura y oculta RADAMATE', async () => {
    // defaultProps tiene evaluacion de categoria 1 (Lectura / RADALECTOR),
    // y matriz_resultados tiene tanto 2_1 (Lectura) como 2_2 (Matemática) configurados.
    await React.act(async () => {
      render(<DirectorTendenciasTab {...defaultProps} />);
    });

    // Debe mostrar la pestaña de Lectura (categoría 1)
    expect(screen.getByRole('tab', { name: /LEE DIVERSOS TIPOS DE TEXTOS/i })).toBeInTheDocument();
    expect(screen.getByText(/RADALECTOR:/i)).toBeInTheDocument();

    // NO debe mostrar la pestaña de Matemática (categoría 2)
    expect(screen.queryByRole('tab', { name: /RESUELVE PROBLEMAS DE CANTIDAD/i })).not.toBeInTheDocument();
    expect(screen.queryByText(/RADAMATE:/i)).not.toBeInTheDocument();
  });

  it('muestra únicamente la pestaña de RADAMATE si la evaluación es de Matemática y oculta RADALECTOR', async () => {
    const mateEval: any = {
      id: 'eval-edi-2',
      nombre: 'Evaluación Diagnóstica Matemática',
      grado: 2,
      categoria: 2,
      mesDelExamen: 3,
    };

    const mateProps: any = {
      ...defaultProps,
      evaluacion: mateEval,
    };

    await React.act(async () => {
      render(<DirectorTendenciasTab {...mateProps} />);
    });

    // Debe mostrar la pestaña de Matemática (categoría 2)
    expect(screen.getByRole('tab', { name: /RESUELVE PROBLEMAS DE CANTIDAD/i })).toBeInTheDocument();
    expect(screen.getByText(/RADAMATE:/i)).toBeInTheDocument();

    // NO debe mostrar la pestaña de Lectura (categoría 1)
    expect(screen.queryByRole('tab', { name: /LEE DIVERSOS TIPOS DE TEXTOS/i })).not.toBeInTheDocument();
    expect(screen.queryByText(/RADALECTOR:/i)).not.toBeInTheDocument();
  });

  it('muestra títulos limpios sin "RADALECTOR (EPX)" y coloca Tendencia Longitudinal después de Secciones', async () => {
    await React.act(async () => {
      render(<DirectorTendenciasTab {...defaultProps} />);
    });

    // 1. Títulos limpios sin sufijo de materia o etapa
    expect(screen.getByText('Distribución de Logro y Cobertura Institucional')).toBeInTheDocument();
    expect(screen.getByText('Comparativa por Docentes y Secciones')).toBeInTheDocument();
    expect(screen.queryByText(/Distribución de Logro y Cobertura Institucional ·/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/Comparativa por Docentes y Secciones ·/i)).not.toBeInTheDocument();

    // 2. Orden en el DOM: Cobertura -> Secciones -> Tendencia Longitudinal
    const headings = screen.getAllByRole('heading', { level: 3 });
    const headingTexts = headings.map((h) => h.textContent?.trim());

    const idxCobertura = headingTexts.findIndex((t) => t?.includes('Distribución de Logro y Cobertura Institucional'));
    const idxSecciones = headingTexts.findIndex((t) => t?.includes('Comparativa por Docentes y Secciones'));
    const idxTendencia = headingTexts.findIndex((t) => t?.includes('Tendencia Longitudinal por Etapas'));

    expect(idxCobertura).toBeGreaterThanOrEqual(0);
    expect(idxSecciones).toBeGreaterThan(idxCobertura);
    expect(idxTendencia).toBeGreaterThan(idxSecciones);
  });

  it('muestra "Progresiva 1" y "Progresiva 2" en lugar de "Proceso 1" y "Proceso 2"', async () => {
    await React.act(async () => {
      render(<DirectorTendenciasTab {...defaultProps} />);
    });

    expect(screen.getByText(/EP1 \(Progresiva 1\)/i)).toBeInTheDocument();
    expect(screen.getByText(/EP2 \(Progresiva 2\)/i)).toBeInTheDocument();
    expect(screen.queryByText(/EP1 \(Proceso 1\)/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/EP2 \(Proceso 2\)/i)).not.toBeInTheDocument();
  });
});
