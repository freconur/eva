import React from 'react';
import { render, screen, fireEvent, act } from '@testing-library/react';
import { EvaluacionDetalleHeroBanner } from '../containers/EvaluacionDetalleHeroBanner';

jest.mock('@/firebase/firebase.config', () => ({
  db: {},
  storage: {},
  app: {},
  initAnalytics: jest.fn().mockResolvedValue(null),
}));

jest.mock('@/features/context/GlolbalContext', () => ({
  useGlobalContext: () => ({
    currentUserData: { rol: 2, institucion: 'I.E. Los Próceres' },
  }),
}));

const mockSetDoc = jest.fn().mockResolvedValue(undefined);
let snapshotCallbacks: Array<(snap: any) => void> = [];

jest.mock('firebase/firestore', () => ({
  getFirestore: jest.fn(() => ({})),
  doc: jest.fn((_db, collection, docId) => ({ path: `${collection}/${docId}` })),
  setDoc: (...args: any[]) => mockSetDoc(...args),
  onSnapshot: jest.fn((_ref, cb) => {
    snapshotCallbacks.push(cb);
    return () => {};
  }),
}));

describe('EvaluacionDetalleHeroBanner', () => {
  beforeEach(() => {
    localStorage.clear();
    jest.clearAllMocks();
    snapshotCallbacks = [];
  });

  const defaultProps = {
    title: 'Rúbrica de Mediación Pedagógica',
    descripcion: 'Evaluación oficial de desempeño docente',
    selectedYear: 2026,
    institucion: 'I.E. Los Próceres',
    faseNombre: 'Diagnóstica',
    categoria: 'Monitoreo Directivo',
    metricas: [
      { id: 'm1', label: 'Docentes', value: 24, badgeText: 'Padrón', helperText: 'En padrón' },
      { id: 'm2', label: 'Evaluados', value: 18, badgeText: 'Concluidos', helperText: 'Registrados' },
    ],
  };

  it('renderiza el título, descripción y badges institucionales', () => {
    render(<EvaluacionDetalleHeroBanner {...defaultProps} />);

    expect(screen.getByText('RÚBRICA DE MEDIACIÓN PEDAGÓGICA')).toBeInTheDocument();
    expect(screen.getByText('Evaluación oficial de desempeño docente')).toBeInTheDocument();
    expect(screen.getByText('Año Escolar 2026')).toBeInTheDocument();
    expect(screen.getByText('I.E. Los Próceres')).toBeInTheDocument();
    expect(screen.getByText('Fase: Diagnóstica')).toBeInTheDocument();
    expect(screen.getByText('MONITOREO DIRECTIVO')).toBeInTheDocument();
  });

  it('renderiza las tarjetas KPI de métricas en la vista grande', () => {
    render(<EvaluacionDetalleHeroBanner {...defaultProps} />);

    expect(screen.getByText('Docentes')).toBeInTheDocument();
    expect(screen.getByText('24')).toBeInTheDocument();
    expect(screen.getByText('Evaluados')).toBeInTheDocument();
    expect(screen.getByText('18')).toBeInTheDocument();
  });

  it('alterna correctamente entre la vista grande y compacta', async () => {
    render(<EvaluacionDetalleHeroBanner {...defaultProps} isAdmin={true} />);

    const compactBtn = screen.getByRole('button', { name: /compacta/i });
    await act(async () => {
      fireEvent.click(compactBtn);
    });

    expect(localStorage.getItem('eva_eval_detalle_banner_variant')).toBe('compact');

    const grandeBtn = screen.getByRole('button', { name: /grande/i });
    await act(async () => {
      fireEvent.click(grandeBtn);
    });

    expect(localStorage.getItem('eva_eval_detalle_banner_variant')).toBe('expanded');
  });

  it('oculta controles de subida de fondo para usuarios no administradores', () => {
    render(<EvaluacionDetalleHeroBanner {...defaultProps} isAdmin={false} />);

    expect(screen.queryByRole('button', { name: /fondo/i })).not.toBeInTheDocument();
  });

  it('oculta el switch de cambiar entre compacta y grande para usuarios no administradores', () => {
    render(<EvaluacionDetalleHeroBanner {...defaultProps} isAdmin={false} />);

    expect(screen.queryByRole('button', { name: /compacta/i })).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /grande/i })).not.toBeInTheDocument();
  });

  it('muestra el botón de fondo cuando isAdmin={true}', () => {
    render(<EvaluacionDetalleHeroBanner {...defaultProps} isAdmin={true} />);

    expect(screen.getByRole('button', { name: /fondo/i })).toBeInTheDocument();
  });

  it('renderiza la imagen de fondo con opacidad cuando se proporciona backgroundImage', () => {
    const { container } = render(
      <EvaluacionDetalleHeroBanner
        {...defaultProps}
        backgroundImage="https://example.com/test-bg.jpg"
        backgroundImageOpacity={0.3}
      />
    );

    const bgElement = container.querySelector('[style*="test-bg.jpg"]');
    expect(bgElement).toBeInTheDocument();
  });

  it('muestra el botón de editar título y abre el modal al hacer clic', () => {
    render(
      <EvaluacionDetalleHeroBanner
        {...defaultProps}
        idEvaluacion="eval-123"
        collectionName="evaluaciones-docentes"
        canEditTitleDescription={true}
      />
    );

    const editBtn = screen.getByRole('button', { name: /editar título y descripción/i });
    expect(editBtn).toBeInTheDocument();

    fireEvent.click(editBtn);

    expect(screen.getByText('Editar Título y Descripción')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('Ej. RÚBRICA DE MEDIACIÓN DIDÁCTICA')).toHaveValue(
      'Rúbrica de Mediación Pedagógica'
    );
  });

  it('persiste el cambio de variante a Firestore cuando el administrador cambia la vista', async () => {
    render(
      <EvaluacionDetalleHeroBanner
        {...defaultProps}
        isAdmin={true}
        idEvaluacion="eval-999"
        collectionName="evaluaciones-docentes"
        storageKey="eva_eval_docente_banner_variant"
      />
    );

    const compactBtn = screen.getByRole('button', { name: /compacta/i });
    await act(async () => {
      fireEvent.click(compactBtn);
    });

    // Debe guardar en el documento de la evaluación
    expect(mockSetDoc).toHaveBeenCalledWith(
      { path: 'evaluaciones-docentes/eval-999' },
      expect.objectContaining({
        bannerVariant: 'compact',
        variant: 'compact',
      }),
      { merge: true }
    );

    // Debe guardar en la colección de configuraciones globales
    expect(mockSetDoc).toHaveBeenCalledWith(
      { path: 'configuraciones/evaluaciones_detalle_banner' },
      expect.objectContaining({
        eva_eval_docente_banner_variant: expect.objectContaining({
          variant: 'compact',
        }),
      }),
      { merge: true }
    );
  });

  it('actualiza la vista dinámicamente cuando Firestore emite un cambio de variante en tiempo real', () => {
    const { act } = require('@testing-library/react');
    render(
      <EvaluacionDetalleHeroBanner
        {...defaultProps}
        isAdmin={false}
        idEvaluacion="eval-999"
        collectionName="evaluaciones-docentes"
      />
    );

    // Inicialmente expandida
    expect(screen.getByText('Docentes')).toBeInTheDocument();

    // Simular que Firestore emite actualización a vista compacta
    act(() => {
      snapshotCallbacks.forEach((cb) => {
        cb({
          exists: () => true,
          data: () => ({
            bannerVariant: 'compact',
            variant: 'compact',
          }),
        });
      });
    });

    // En vista compacta las tarjetas KPI ampliadas ya no se muestran en la grilla grande
    // y localStorage se mantiene actualizado
    expect(localStorage.getItem('eva_eval_detalle_banner_variant')).toBe('compact');
  });

  it('respeta la prop variant pasada por el componente padre', () => {
    render(
      <EvaluacionDetalleHeroBanner
        {...defaultProps}
        variant="compact"
      />
    );

    expect(screen.getByRole('banner')).toBeInTheDocument();
  });
});
