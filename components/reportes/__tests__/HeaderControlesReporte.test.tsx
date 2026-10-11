import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import HeaderControlesReporte from '../HeaderControlesReporte';

// Mock de next/router
jest.mock('next/router', () => ({
  useRouter: () => ({
    query: { idEvaluacion: 'eval-123' },
    pathname: '/admin/evaluaciones/evaluacion/reporte',
    push: jest.fn(),
    replace: jest.fn(),
  }),
}));

// Mock de firebase
jest.mock('firebase/firestore', () => ({
  getFirestore: jest.fn(),
  doc: jest.fn(),
  onSnapshot: jest.fn((_, callback) => {
    callback({
      exists: () => true,
      data: () => ({
        accionesEspecialista: {
          exportarEstudiantes: true,
          exportarExcel: true,
        },
      }),
    });
    return jest.fn();
  }),
  setDoc: jest.fn(),
}));

jest.mock('@/firebase/firebase.config', () => ({
  app: {},
  db: {},
}));

describe('HeaderControlesReporte - Control de visibilidad del botón Configurar', () => {
  const defaultProps: any = {
    evaluacion: { id: 'eval-123', nombre: 'Evaluación Prueba' },
    styles: {},
    chartColumns: 2,
    setChartColumns: jest.fn(),
    loadingExportEstudiantes: false,
    handleExportEstudiantesToExcel: jest.fn(),
    loadingExport: false,
    handleExportToExcel: jest.fn(),
    currentUserData: null,
    loadConsolidado: false,
    fetchBarGraphicsData: jest.fn(),
    fetchReportePreguntas: jest.fn(),
    handleGenerarConsolidado: jest.fn(),
    loadingConsolidado: false,
    hasPieChartData: true,
    consolidationStatus: null,
    handleDetenerConsolidado: jest.fn(),
    bannerMode: 'ejecutivo',
  };

  beforeEach(() => {
    sessionStorage.clear();
  });

  it('muestra el botón Configurar si el usuario tiene rol 4 (Administrador)', () => {
    render(
      <HeaderControlesReporte
        {...defaultProps}
        currentUserData={{ rol: 4, dni: '12345678' }}
      />
    );

    const configButton = screen.getByRole('link', { name: /configurar/i });
    expect(configButton).toBeInTheDocument();
    expect(configButton).toHaveAttribute('href', '/admin/evaluaciones/evaluacion/eval-123');
  });

  it('NO muestra el botón Configurar si el usuario es especialista (rol 1)', () => {
    render(
      <HeaderControlesReporte
        {...defaultProps}
        currentUserData={{ rol: 1, dni: '87654321' }}
      />
    );

    expect(screen.queryByRole('link', { name: /configurar/i })).not.toBeInTheDocument();
  });

  it('NO muestra el botón Configurar si el usuario es especialista UGEL (rol 5)', () => {
    render(
      <HeaderControlesReporte
        {...defaultProps}
        currentUserData={{ rol: 5, dni: '98765432' }}
      />
    );

    expect(screen.queryByRole('link', { name: /configurar/i })).not.toBeInTheDocument();
  });

  it('NO muestra el botón Configurar si el usuario es director (rol 2) o docente (rol 3)', () => {
    const { rerender } = render(
      <HeaderControlesReporte
        {...defaultProps}
        currentUserData={{ rol: 2, dni: '11111111' }}
      />
    );
    expect(screen.queryByRole('link', { name: /configurar/i })).not.toBeInTheDocument();

    rerender(
      <HeaderControlesReporte
        {...defaultProps}
        currentUserData={{ rol: 3, dni: '22222222' }}
      />
    );
    expect(screen.queryByRole('link', { name: /configurar/i })).not.toBeInTheDocument();
  });

  it('muestra el botón Configurar si el usuario está en modo auditoría', () => {
    sessionStorage.setItem('audited_user', 'true');

    render(
      <HeaderControlesReporte
        {...defaultProps}
        currentUserData={{ rol: 1, dni: '87654321' }}
      />
    );

    expect(screen.getByRole('link', { name: /configurar/i })).toBeInTheDocument();
  });
});

describe('HeaderControlesReporte - Menú Acciones y Permisos de Especialistas', () => {
  const defaultProps: any = {
    evaluacion: { id: 'eval-123', nombre: 'Evaluación Prueba' },
    styles: {},
    chartColumns: 2,
    setChartColumns: jest.fn(),
    loadingExportEstudiantes: false,
    handleExportEstudiantesToExcel: jest.fn(),
    loadingExport: false,
    handleExportToExcel: jest.fn(),
    currentUserData: { rol: 1, dni: '87654321' }, // Especialista
    loadConsolidado: jest.fn(),
    fetchBarGraphicsData: jest.fn(),
    fetchReportePreguntas: jest.fn(),
    handleGenerarConsolidado: jest.fn(),
    loadingConsolidado: false,
    hasPieChartData: true,
    consolidationStatus: null,
    handleDetenerConsolidado: jest.fn(),
    bannerMode: 'ejecutivo',
  };

  beforeEach(() => {
    jest.clearAllMocks();
    sessionStorage.clear();
  });

  it('muestra el botón Acciones para un especialista si los permisos están habilitados', () => {
    render(<HeaderControlesReporte {...defaultProps} />);

    expect(screen.getByRole('button', { name: /acciones/i })).toBeInTheDocument();
  });

  it('oculta el botón Acciones para un especialista si los permisos están deshabilitados', () => {
    render(
      <HeaderControlesReporte
        {...defaultProps}
        evaluacion={{
          id: 'eval-123',
          nombre: 'Evaluación Prueba',
          accionesEspecialista: {
            exportarEstudiantes: false,
            exportarExcel: false,
          },
        }}
      />
    );

    expect(screen.queryByRole('button', { name: /acciones/i })).not.toBeInTheDocument();
  });

  it('muestra la sección de PERMISOS ESPECIALISTAS solo para el Administrador', () => {
    // Para especialista (rol 1)
    const { rerender } = render(<HeaderControlesReporte {...defaultProps} />);
    expect(screen.queryByText(/Permisos Especialistas/i)).not.toBeInTheDocument();

    // Para administrador (rol 4)
    rerender(
      <HeaderControlesReporte
        {...defaultProps}
        currentUserData={{ rol: 4, dni: '12345678' }}
      />
    );

    // Abrir el dropdown de acciones
    const btnAcciones = screen.getByRole('button', { name: /acciones/i });
    fireEvent.click(btnAcciones);

    expect(screen.getByText(/Permisos Especialistas/i)).toBeInTheDocument();
    expect(screen.getByText(/Permitir Exportar Estudiantes/i)).toBeInTheDocument();
    expect(screen.getByText(/Permitir Exportar Excel/i)).toBeInTheDocument();
  });
});

