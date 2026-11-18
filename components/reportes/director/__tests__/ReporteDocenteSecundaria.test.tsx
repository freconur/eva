jest.mock('firebase/auth', () => ({
  getAuth: jest.fn(() => ({})),
  onAuthStateChanged: jest.fn(),
  signInWithEmailAndPassword: jest.fn(),
  signOut: jest.fn(),
  setPersistence: jest.fn(() => Promise.resolve()),
  browserLocalPersistence: {},
}));

jest.mock('firebase/storage', () => ({
  getStorage: jest.fn(() => ({})),
  ref: jest.fn(),
  uploadBytes: jest.fn(() => Promise.resolve()),
  getDownloadURL: jest.fn(() => Promise.resolve('https://mock-image.png')),
  deleteObject: jest.fn(() => Promise.resolve()),
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
import ReportesSecundaria from '@/pages/docentes/evaluaciones/secundaria/pruebas/prueba/reporte/index';

// Mock de Next.js useRouter
jest.mock('@/components/layouts/PrivateRoutesDocentes', () => {
  return function MockPrivateRouteDocentes({ children }: any) {
    return <>{children}</>;
  };
});

const mockPush = jest.fn();
const mockReplace = jest.fn();
jest.mock('next/router', () => ({
  useRouter: () => ({
    query: { idExamen: 'eval-doc-sec-1', mes: '3', year: '2026' },
    pathname: '/docentes/evaluaciones/secundaria/pruebas/prueba/reporte',
    isReady: true,
    push: mockPush,
    replace: mockReplace,
  }),
}));

// Mocks de Firestore
const mockDocData = {
  baremoDecisiones: { critico: 40, alto: 60, medio: 75 },
  grados: {
    '1_1': {
      ediId: 'eval-doc-sec-1',
      ep1Id: 'eval-ep1',
    },
  },
};

jest.mock('firebase/firestore', () => ({
  getFirestore: jest.fn(),
  doc: jest.fn(),
  getDoc: jest.fn(() =>
    Promise.resolve({
      exists: () => true,
      data: () => mockDocData,
    })
  ),
  collection: jest.fn(),
  query: jest.fn(),
  where: jest.fn(),
  getDocs: jest.fn(() =>
    Promise.resolve({
      empty: false,
      forEach: (cb: any) => {
        cb({
          id: 'eval-doc-sec-1',
          data: () => ({
            id: 'eval-doc-sec-1',
            nombre: 'Evaluación Diagnóstica - Matemática 1° Sec',
            grado: 1,
            añoDelExamen: '2026',
            mesDelExamen: '3',
            tipoDeEvaluacion: '1',
            active: true,
          }),
        });
      },
    })
  ),
  onSnapshot: jest.fn((docRef, callback) => {
    callback({
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
const mockEstudiantes = [
  {
    dni: '12345678',
    nombres: 'Carlos',
    apellidos: 'Mamani Flores',
    nombresApellidos: 'Mamani Flores Carlos',
    nombreCompleto: 'Mamani Flores Carlos',
    seccion: 'a',
    puntaje: 18,
    nivel: 'Satisfactorio',
    totalPreguntas: 20,
    respuestasCorrectas: 18,
    diferenciaConAula: 3.5,
  },
  {
    dni: '87654321',
    nombres: 'Ana',
    apellidos: 'Quispe Ramos',
    nombresApellidos: 'Quispe Ramos Ana',
    nombreCompleto: 'Quispe Ramos Ana',
    seccion: 'a',
    puntaje: 12,
    nivel: 'En Proceso',
    totalPreguntas: 20,
    respuestasCorrectas: 12,
    diferenciaConAula: -2.5,
  },
];

const mockEvaluacion = {
  id: 'eval-doc-sec-1',
  nombre: 'Evaluación Diagnóstica - Matemática 1° Sec',
  grado: 1,
  añoDelExamen: '2026',
  mesDelExamen: '3',
  tipoDeEvaluacion: '1',
  active: true,
  cerrada: false,
};

const mockPreguntasRespuestas = [
  {
    id: 'p1',
    pregunta: '¿Cuánto es 2 + 2?',
    respuesta: '4',
    order: 1,
  },
];

jest.mock('@/features/context/GlolbalContext', () => ({
  useGlobalContext: () => ({
    currentUserData: {
      dni: '10203040',
      nombre: 'Profesor Secundaria',
      rol: 'docente',
      colegio: 'I.E. Emblemática Secundaria',
    },
    estudiantesDeEvaluacion: mockEstudiantes,
    estudiantes: mockEstudiantes,
    dataEstadisticas: [],
    preguntasRespuestas: mockPreguntasRespuestas,
    evaluacion: mockEvaluacion,
    loaderReporteDirector: false,
    warningEvaEstudianteSinRegistro: false,
  }),
  useGlobalContextDispatch: () => jest.fn(),
}));

// Mock de hooks complementarios
jest.mock('@/features/hooks/useReporteDocente', () => ({
  useReporteDocente: () => ({
    estudiantesQueDieronExamen: mockEstudiantes,
    filtroEstudiantes: mockEstudiantes,
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
    generarPDF: jest.fn(),
    loadingPDF: false,
    convertirGraficoAImagen: jest.fn(),
    imagenesGeneradas: true,
    reporteCompletoConImagenes: [{ id: 'p1' }],
  }),
}));

// Mock de tabs analíticos
jest.mock('@/components/reportes/director/DirectorBrechasTab', () => {
  return function MockDirectorBrechasTab() {
    return <div data-testid="mock-director-brechas-tab">Brechas Tab Content</div>;
  };
});

jest.mock('@/components/reportes/director/DirectorTendenciasTab', () => {
  return function MockDirectorTendenciasTab() {
    return <div data-testid="mock-director-tendencias-tab">Tendencias Tab Content</div>;
  };
});

jest.mock('@/components/reportes/director/DirectorComparativaTab', () => {
  return function MockDirectorComparativaTab() {
    return <div data-testid="mock-director-comparativa-tab">Comparativa Tab Content</div>;
  };
});

jest.mock('@/components/reportes/estudiante/DocenteEvolucionEstudiantesTab', () => ({
  DocenteEvolucionEstudiantesTab: function MockDocenteEvolucionEstudiantesTab() {
    return <div data-testid="mock-docente-evolucion-tab">Evolucion Estudiantes Tab Content</div>;
  },
}));

jest.mock('@/components/tabla-preguntas', () => ({
  TablaPreguntas: function MockTablaPreguntas() {
    return <div data-testid="mock-tabla-preguntas">Tabla Preguntas Mock</div>;
  },
}));

jest.mock('@/pages/docentes/evaluaciones/secundaria/pruebas/prueba/reporte/reporteEvaluacionPorPregunta', () => {
  return function MockReporteEvaluacionPorPregunta() {
    return <div data-testid="mock-reporte-preguntas">Reporte Preguntas Mock</div>;
  };
});

describe('Reportes Page (Secundaria - Paridad con Primaria)', () => {
  it('renderiza la estructura moderna de 6 pestañas en secundaria idéntica a primaria', async () => {
    render(<ReportesSecundaria />);

    await waitFor(() => {
      expect(screen.getByRole('tab', { name: /Grilla/i })).toBeInTheDocument();
    });

    // Validar las pestañas principales
    expect(screen.getByRole('tab', { name: /Grilla/i })).toBeInTheDocument();
    expect(screen.getByRole('tab', { name: /Brechas/i })).toBeInTheDocument();
    expect(screen.getByRole('tab', { name: /Tendencias/i })).toBeInTheDocument();
    expect(screen.getByRole('tab', { name: /Comparativa/i })).toBeInTheDocument();
    expect(screen.getByRole('tab', { name: /Análisis/i })).toBeInTheDocument();
    expect(screen.getByRole('tab', { name: /Evolución/i })).toBeInTheDocument();
  });

  it('permite alternar a la pestaña Evolución de Estudiantes en secundaria mostrando el componente modular', async () => {
    render(<ReportesSecundaria />);

    await waitFor(() => {
      expect(screen.getByRole('tab', { name: /Evolución de Estudiantes/i })).toBeInTheDocument();
    });

    const evolucionTab = screen.getByRole('tab', { name: /Evolución de Estudiantes/i });
    fireEvent.click(evolucionTab);

    expect(screen.getByTestId('mock-docente-evolucion-tab')).toBeInTheDocument();
    expect(screen.getByText('Evolucion Estudiantes Tab Content')).toBeInTheDocument();
  });
});
