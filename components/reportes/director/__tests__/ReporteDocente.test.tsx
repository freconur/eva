jest.mock('firebase/auth', () => ({
  getAuth: jest.fn(() => ({})),
  onAuthStateChanged: jest.fn(),
  signInWithEmailAndPassword: jest.fn(),
  signOut: jest.fn(),
}));

jest.mock('@/features/hooks/useUsuario', () => () => ({
  getUserData: jest.fn(),
  logout: jest.fn(),
}));

jest.mock('@/modals/deleteEstudiante', () => {
  return function MockDeleteEstudiante() {
    return <div data-testid="mock-delete-estudiante" />;
  };
});

import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import Reportes from '@/pages/docentes/evaluaciones/tercerNivel/pruebas/prueba/reporte/index';

// Mock de Next.js useRouter
jest.mock('@/components/layouts/PrivateRoutesDocentes', () => {
  return function MockPrivateRouteDocentes({ children }: any) {
    return <>{children}</>;
  };
});

const mockPush = jest.fn();
jest.mock('next/router', () => ({
  useRouter: () => ({
    query: { idExamen: 'eval-doc-1', mes: '3', year: '2026' },
    pathname: '/docentes/evaluaciones/tercerNivel/pruebas/prueba/reporte',
    isReady: true,
    push: mockPush,
  }),
}));

const mockMatrizGradosConfig: { current: any } = {
  current: {
    '2_1': { ep1Id: 'eval-doc-1' },
  },
};

// Mock de Firestore
jest.mock('firebase/firestore', () => ({
  getFirestore: jest.fn(() => ({})),
  collection: jest.fn(),
  query: jest.fn(),
  where: jest.fn(),
  getDocs: jest.fn(() =>
    Promise.resolve({
      forEach: (cb: any) => {
        cb({
          id: 'eval-db-1',
          data: () => ({ nombre: 'Evaluación de Prueba', grado: 2, tipoDeEvaluacion: '1' }),
        });
      },
    })
  ),
  doc: jest.fn(),
  getDoc: jest.fn(() =>
    Promise.resolve({
      exists: () => true,
      data: () => ({
        baremoDecisiones: { critico: 60, alto: 40, medio: 20 },
        grados: mockMatrizGradosConfig.current,
      }),
    })
  ),
  onSnapshot: jest.fn((ref, onNext) => {
    onNext({
      exists: () => true,
      data: () => ({
        accionesDocente: {
          exportarGrillaPdf: true,
          exportarExcel: true,
          generarPdfPreguntas: true,
          actualizarRespuestas: true,
        },
      }),
    });
    return () => {};
  }),
}));

// Mock del contexto global
const mockEvaluacion = {
  id: 'eval-doc-1',
  nombre: 'Evaluación de Comunicación Docente',
  grado: 2,
  categoria: 1,
  añoDelExamen: '2026',
  mesDelExamen: '3',
  tipoDeEvaluacion: '1',
  active: true,
  cerrada: false,
  nivelYPuntaje: [
    { nivel: 'Satisfactorio', min: 15, max: 20, color: '#10b981' },
    { nivel: 'En Proceso', min: 11, max: 14, color: '#f59e0b' },
    { nivel: 'En Inicio', min: 0, max: 10, color: '#ef4444' },
  ],
};

const mockEstudiantes = [
  {
    id: 'est-1',
    nombres: 'Juan',
    apellidos: 'Perez',
    puntaje: 18,
    nivel: 'Satisfactorio',
    seccion: 'A',
    respuestas: { 'p-1': 'a', 'p-2': 'b' },
  },
  {
    id: 'est-2',
    nombres: 'Maria',
    apellidos: 'Gomez',
    puntaje: 12,
    nivel: 'En Proceso',
    seccion: 'A',
    respuestas: { 'p-1': 'a', 'p-2': 'a' },
  },
];

const mockPreguntas = [
  {
    id: 'p-1',
    pregunta: '¿Cuál es la idea principal?',
    order: 1,
    respuesta: 'a',
    alternativas: [
      { alternativa: 'a', descripcion: 'Opción A', correcta: true },
      { alternativa: 'b', descripcion: 'Opción B', correcta: false },
    ],
  },
  {
    id: 'p-2',
    pregunta: '¿Qué infieres del texto?',
    order: 2,
    respuesta: 'b',
    alternativas: [
      { alternativa: 'a', descripcion: 'Opción A', correcta: false },
      { alternativa: 'b', descripcion: 'Opción B', correcta: true },
    ],
  },
];

const mockUserData = {
  dni: '87654321',
  nombres: 'Carlos',
  apellidos: 'Docente',
  rol: 3,
  institucion: 'I.E. Los Próceres',
};

const mockGlobalContextValue = {
  estudiantesDeEvaluacion: [],
  estudiantes: mockEstudiantes,
  currentUserData: mockUserData,
  dataEstadisticas: [],
  preguntasRespuestas: mockPreguntas,
  evaluacion: mockEvaluacion,
  loaderReporteDirector: false,
  warningEvaEstudianteSinRegistro: false,
  categorias: [
    { id: 1, categoria: 'LEE DIVERSOS TIPOS DE TEXTOS' },
    { id: 2, categoria: 'RESUELVE PROBLEMAS DE CANTIDAD' },
  ],
};

jest.mock('@/features/context/GlolbalContext', () => ({
  useGlobalContext: () => mockGlobalContextValue,
  useGlobalContextDispatch: () => jest.fn(),
}));

// Mock de hooks
jest.mock('@/features/hooks/useReporteDocente', () => ({
  useReporteDocente: () => ({
    estudiantesQueDieronExamen: mockEstudiantes,
    estadisticasEstudiantesDelDocente: jest.fn(() => () => {}),
    datosPorMes: [],
    mesesConDataDisponibles: [3],
    añosConDataDisponibles: ['2026'],
    obtenerAñosConData: jest.fn(),
    promedioGlobal: [{ mes: 3, totalEstudiantes: 2, promedioGlobal: 15 }],
    estudiantesQueDieronExamenPorMes: jest.fn(),
    corregirPuntajesEstudiantes: jest.fn(),
    loaderCorreccionPuntajes: false,
    correccionPuntajesExitoso: false,
    setCorreccionPuntajesExitoso: jest.fn(),
    correccionPuntajesError: false,
    setCorreccionPuntajesError: jest.fn(),
  }),
}));

jest.mock('@/features/hooks/useAgregarEvaluaciones', () => ({
  useAgregarEvaluaciones: () => ({
    getPreguntasRespuestas: jest.fn(),
    getEvaluacion: jest.fn(),
    obtenerEstudianteDeEvaluacion: jest.fn(() => () => {}),
  }),
}));

jest.mock('@/features/hooks/useGenerarPDFReporte', () => ({
  useGenerarPDFReporte: () => ({
    imagenesGeneradas: true,
    loadingPDF: false,
    reporteCompletoConImagenes: [],
    convertirGraficoAImagen: jest.fn(),
    handleGenerarPDF: jest.fn(),
  }),
}));

// Mock de componentes pesados hijos
jest.mock('@/components/tabla-preguntas', () => ({
  TablaPreguntas: (props: any) => (
    <div data-testid="mock-tabla-preguntas">
      <span>Tabla de Estudiantes ({props.estudiantes?.length})</span>
    </div>
  ),
}));

jest.mock('@/components/reportes/director/DirectorTendenciasTab', () => {
  return function MockDirectorTendenciasTab(props: any) {
    return (
      <div data-testid="mock-tendencias-tab">
        <span>DirectorTendenciasTab Component</span>
        <span data-testid="docente-view">{props.isDocenteView ? 'Modo Docente Activo' : 'Modo General'}</span>
        <span data-testid="docente-dni">{props.dniDocente}</span>
        {props.promedioPorDocente && <span data-testid="docentes-chart-present">Comparativa Docentes Presente</span>}
      </div>
    );
  };
});

jest.mock('@/components/reportes/director/DirectorBrechasTab', () => {
  return function MockDirectorBrechasTab(props: any) {
    return (
      <div data-testid="mock-brechas-tab">
        <span>DirectorBrechasTab Component</span>
        <span data-testid="brechas-docente-view">{props.isDocenteView ? 'Modo Docente Activo' : 'Modo General'}</span>
      </div>
    );
  };
});

jest.mock('@/components/reportes/director/DirectorComparativaTab', () => {
  return function MockDirectorComparativaTab(props: any) {
    return (
      <div data-testid="mock-comparativa-tab">
        <span>DirectorComparativaTab Component</span>
        <span data-testid="comparativa-docente-dni">{props.dniDocente}</span>
      </div>
    );
  };
});

describe('Reportes Page (Docentes)', () => {
  beforeEach(() => {
    mockMatrizGradosConfig.current = {
      '2_1': { ep1Id: 'eval-doc-1' },
    };
  });

  it('renderiza la estructura moderna de navegación por pestañas de Directores', async () => {
    render(<Reportes />);

    // Verifica que se renderice la barra de pestañas moderna
    expect(screen.getByRole('tab', { name: /Estudiantes y Grilla/i })).toBeInTheDocument();
    expect(screen.getByRole('tab', { name: /Brechas de Aprendizaje/i })).toBeInTheDocument();
    expect(screen.getByRole('tab', { name: /Tendencias y Cobertura/i })).toBeInTheDocument();
    expect(screen.getByRole('tab', { name: /Comparativa/i })).toBeInTheDocument();
    expect(screen.getByRole('tab', { name: /Análisis por Ítem/i })).toBeInTheDocument();
  });

  it('permite alternar entre pestañas y muestra el contenido correspondiente', async () => {
    render(<Reportes />);

    // Esperar a que la configuración de la matriz se procese y la pestaña esté confirmada
    await waitFor(() => {
      expect(screen.getByRole('tab', { name: /Brechas de Aprendizaje/i })).toBeInTheDocument();
    });

    // Inicialmente muestra la Grilla
    expect(screen.getByTestId('mock-tabla-preguntas')).toBeInTheDocument();

    // Cambiar a Brechas de Aprendizaje
    const tabBrechas = screen.getByRole('tab', { name: /Brechas de Aprendizaje/i });
    fireEvent.click(tabBrechas);
    await waitFor(() => {
      expect(screen.getByTestId('mock-brechas-tab')).toBeInTheDocument();
    });
    expect(screen.getByTestId('brechas-docente-view')).toHaveTextContent('Modo Docente Activo');

    // Cambiar a Tendencias y Cobertura
    const tabTendencia = screen.getByRole('tab', { name: /Tendencias y Cobertura/i });
    fireEvent.click(tabTendencia);
    expect(screen.getByTestId('mock-tendencias-tab')).toBeInTheDocument();
    expect(screen.getByTestId('docente-view')).toHaveTextContent('Modo Docente Activo');
    expect(screen.getByTestId('docente-dni')).toHaveTextContent('87654321');
    // Verifica que NO se le pase ni se renderice gráfico de comparativa por docentes
    expect(screen.queryByTestId('docentes-chart-present')).not.toBeInTheDocument();

    // Cambiar a Comparativa
    const tabComparativa = screen.getByRole('tab', { name: /Comparativa/i });
    fireEvent.click(tabComparativa);
    expect(screen.getByTestId('mock-comparativa-tab')).toBeInTheDocument();
    expect(screen.getByTestId('comparativa-docente-dni')).toHaveTextContent('87654321');
  });

  it('permite alternar entre modo Compacto y modo Ejecutivo (Hero Banner)', async () => {
    render(<Reportes />);

    // Por defecto inicia en modo compacto
    expect(screen.getByTitle('Modo tradicional compacto')).toBeInTheDocument();
    const btnEjecutivo = screen.getByTitle('Modo ejecutivo con banner y métricas clave');
    expect(btnEjecutivo).toBeInTheDocument();

    // Al hacer clic en Ejecutivo, activa el Hero Banner
    fireEvent.click(btnEjecutivo);
    expect(screen.getByText(/EVALUACIÓN DE COMUNICACIÓN DOCENTE/i)).toBeInTheDocument();
  });

  it('oculta la pestaña y sección de Brechas de Aprendizaje si la evaluación no está configurada en EDI, EP1, EP2', async () => {
    mockMatrizGradosConfig.current = {}; // Evaluación no configurada en matriz
    render(<Reportes />);

    // Esperar a que se procese la configuración regional y se oculte la pestaña
    await waitFor(() => {
      expect(screen.queryByRole('tab', { name: /Brechas de Aprendizaje/i })).not.toBeInTheDocument();
    });

    // Las otras pestañas sí deben estar presentes
    expect(screen.getByRole('tab', { name: /Estudiantes y Grilla/i })).toBeInTheDocument();
    expect(screen.getByRole('tab', { name: /Tendencias y Cobertura/i })).toBeInTheDocument();
    expect(screen.getByRole('tab', { name: /Comparativa/i })).toBeInTheDocument();
    expect(screen.getByRole('tab', { name: /Análisis por Ítem/i })).toBeInTheDocument();
  });
});
