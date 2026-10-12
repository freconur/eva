import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
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

describe('EvaluacionDetalleHeroBanner', () => {
  beforeEach(() => {
    localStorage.clear();
    jest.clearAllMocks();
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

  it('alterna correctamente entre la vista grande y compacta', () => {
    render(<EvaluacionDetalleHeroBanner {...defaultProps} />);

    const compactBtn = screen.getByRole('button', { name: /compacta/i });
    fireEvent.click(compactBtn);

    expect(localStorage.getItem('eva_eval_detalle_banner_variant')).toBe('compact');

    const grandeBtn = screen.getByRole('button', { name: /grande/i });
    fireEvent.click(grandeBtn);

    expect(localStorage.getItem('eva_eval_detalle_banner_variant')).toBe('expanded');
  });

  it('oculta controles de subida de fondo para usuarios no administradores', () => {
    render(<EvaluacionDetalleHeroBanner {...defaultProps} isAdmin={false} />);

    expect(screen.queryByRole('button', { name: /fondo/i })).not.toBeInTheDocument();
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
});
