import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import GestionEstudiantesDirector from '@/pages/directores/estudiantes';
import { UserEstudiante } from '@/features/types/types';

// Mock router
const mockPush = jest.fn();
jest.mock('next/router', () => ({
  useRouter: () => ({
    push: mockPush,
    pathname: '/directores/estudiantes',
    query: {},
  }),
}));

// Mock PrivateRouteDirectores
jest.mock('@/components/layouts/PrivateRoutesDirectores', () => {
  return function MockPrivateRoute({ children }: { children: React.ReactNode }) {
    return <>{children}</>;
  };
});

// Mock GlobalContext
const mockCurrentUser = {
  dni: '10203040',
  nombres: 'DIRECTOR',
  apellidos: 'PRUEBA',
  rol: 2,
};
jest.mock('@/features/context/GlolbalContext', () => ({
  useGlobalContext: () => ({
    currentUserData: mockCurrentUser,
    isSidebarCollapsed: false,
  }),
}));

// Mock useAgregarEvaluaciones
const mockEliminarEstudiante = jest.fn().mockResolvedValue({ success: true });
jest.mock('@/features/hooks/useAgregarEvaluaciones', () => ({
  useAgregarEvaluaciones: () => ({
    eliminarEstudiante: mockEliminarEstudiante,
    loaderCrearEstudiantes: false,
  }),
}));

// Mock Firebase Firestore
const mockDocentes = [
  {
    id: 'doc-1',
    dni: '20304050',
    nombres: 'JUAN',
    apellidos: 'PEREZ',
    dniDirector: '10203040',
  },
  {
    id: 'doc-2',
    dni: '30405060',
    nombres: 'MARIA',
    apellidos: 'QUISPE',
    dniDirector: '10203040',
  },
];

const mockStudentsDoc1: UserEstudiante[] = [
  {
    id: '71001001',
    dni: '71001001',
    nombresApellidos: 'ALVAREZ QUISPE, PEDRO',
    grado: '1',
    seccion: '1',
    genero: '1',
    fotoUrl: 'https://example.com/foto1.jpg',
  },
  {
    id: '71001002',
    dni: '71001002',
    nombresApellidos: 'BENITEZ SOTO, ANA',
    grado: '1',
    seccion: '1',
    genero: '2',
  },
];

const mockStudentsDoc2: UserEstudiante[] = [
  {
    id: '72002001',
    dni: '72002001',
    nombresApellidos: 'CASTILLO DIAZ, LUIS',
    grado: '2',
    seccion: '2',
    genero: '1',
  },
];

const mockDbInstance = { id: 'mock-firestore-db' };

jest.mock('firebase/firestore', () => {
  const original = jest.requireActual('firebase/firestore');
  return {
    ...original,
    getFirestore: jest.fn(() => mockDbInstance),
    collection: jest.fn((...args) => ({ path: args.slice(1).join('/') })),
    query: jest.fn((ref) => ref),
    where: jest.fn(),
    onSnapshot: jest.fn((refOrQuery, callback) => {
      const path = refOrQuery?.path || '';
      setTimeout(() => {
        if (path === 'usuarios') {
          callback({
            forEach: (fn: any) => {
              mockDocentes.forEach((d) => fn({ id: d.id, data: () => d }));
            },
            docs: mockDocentes.map((d) => ({ id: d.id, data: () => d })),
          });
        } else if (path.includes('20304050/estudiantes-docentes')) {
          callback({
            forEach: (fn: any) => {
              mockStudentsDoc1.forEach((s) => fn({ id: s.id, data: () => s }));
            },
            docs: mockStudentsDoc1.map((s) => ({ id: s.id, data: () => s })),
          });
        } else if (path.includes('30405060/estudiantes-docentes')) {
          callback({
            forEach: (fn: any) => {
              mockStudentsDoc2.forEach((s) => fn({ id: s.id, data: () => s }));
            },
            docs: mockStudentsDoc2.map((s) => ({ id: s.id, data: () => s })),
          });
        } else {
          callback({ forEach: () => {}, docs: [] });
        }
      }, 0);
      return jest.fn(); // unsubscribe
    }),
  };
});

describe('GestionEstudiantesDirector (Padrón de estudiantes institucional)', () => {
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

  it('renders the header and aggregated student counts across all teachers', async () => {
    render(<GestionEstudiantesDirector />);

    expect(screen.getByText(/Padrón General de Estudiantes/i)).toBeInTheDocument();
    expect(screen.getByText(/Gestión Institucional/i)).toBeInTheDocument();

    // Students from both teachers should appear
    await waitFor(() => {
      expect(screen.getByText('ALVAREZ QUISPE, PEDRO')).toBeInTheDocument();
      expect(screen.getByText('BENITEZ SOTO, ANA')).toBeInTheDocument();
      expect(screen.getByText('CASTILLO DIAZ, LUIS')).toBeInTheDocument();
    });

    // Check KPIs
    expect(screen.getAllByText('3').length).toBeGreaterThanOrEqual(1); // Total Estudiantes
    expect(screen.getAllByText('2').length).toBeGreaterThanOrEqual(1); // Hombres (Pedro, Luis)
    expect(screen.getAllByText('1').length).toBeGreaterThanOrEqual(1); // Mujeres (Ana)
  });

  it('filters students by search query (name or DNI)', async () => {
    render(<GestionEstudiantesDirector />);

    await waitFor(() => {
      expect(screen.getByText('ALVAREZ QUISPE, PEDRO')).toBeInTheDocument();
    });

    const searchInput = screen.getByPlaceholderText(/Buscar por DNI, estudiante o docente.../i);
    fireEvent.change(searchInput, { target: { value: '72002001' } }); // Luis

    await waitFor(() => {
      expect(screen.getByText('CASTILLO DIAZ, LUIS')).toBeInTheDocument();
      expect(screen.queryByText('ALVAREZ QUISPE, PEDRO')).not.toBeInTheDocument();
    });
  });

  it('filters students by photo status', async () => {
    render(<GestionEstudiantesDirector />);

    await waitFor(() => {
      expect(screen.getByText('ALVAREZ QUISPE, PEDRO')).toBeInTheDocument();
    });

    // Click "Con Foto" filter button
    const withPhotoBtn = screen.getByRole('button', { name: /Con Foto \(1\)/i });
    fireEvent.click(withPhotoBtn);

    await waitFor(() => {
      // Only Pedro has a photo
      expect(screen.getByText('ALVAREZ QUISPE, PEDRO')).toBeInTheDocument();
      expect(screen.queryByText('BENITEZ SOTO, ANA')).not.toBeInTheDocument();
      expect(screen.queryByText('CASTILLO DIAZ, LUIS')).not.toBeInTheDocument();
    });
  });

  it('triggers CSV export download', async () => {
    // Mock URL.createObjectURL and URL.revokeObjectURL
    window.URL.createObjectURL = jest.fn(() => 'blob:mock-url');
    window.URL.revokeObjectURL = jest.fn();

    render(<GestionEstudiantesDirector />);

    await waitFor(() => {
      expect(screen.getByText('ALVAREZ QUISPE, PEDRO')).toBeInTheDocument();
    });

    const exportBtn = screen.getByRole('button', { name: /Exportar Padrón/i });
    fireEvent.click(exportBtn);

    expect(window.URL.createObjectURL).toHaveBeenCalled();
  });
});
