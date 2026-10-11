import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { DirectorHeroBanner } from '../DirectorHeroBanner';
import { Evaluaciones } from '@/features/types/types';

const mockEvaluacion: Evaluaciones = {
  id: 'eval-1',
  nombre: 'Evaluación Diagnóstica 2026',
  grado: 3,
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

const mockMetricas: any = {
  secciones: [],
  totalIe: null,
  sortedPreguntas: [],
  kpis: {
    totalCritico: 2,
    totalAlto: 1,
    totalMedio: 0,
    totalBajo: 0,
    avgPrev: 25,
  },
  activeBaremo: { critico: 60, alto: 40, medio: 20 },
};

describe('DirectorHeroBanner Component', () => {
  it('renderiza el título de la evaluación siempre en MAYÚSCULAS', () => {
    render(
      <DirectorHeroBanner
        evaluacion={mockEvaluacion}
        monthSelected={3}
        yearSelected={2026}
        onSwitchToCompact={jest.fn()}
      />
    );

    expect(screen.getByText('EVALUACIÓN DIAGNÓSTICA 2026')).toBeInTheDocument();
  });

  it('renderiza la variante compacta por defecto con diseño horizontal y botones de variante', () => {
    render(
      <DirectorHeroBanner
        evaluacion={mockEvaluacion}
        metricasDirector={mockMetricas}
        monthSelected={3}
        yearSelected={2026}
        variant="compact"
        onVariantChange={jest.fn()}
        onSwitchToCompact={jest.fn()}
      />
    );

    const btnCompact = screen.getByTitle(/Vista Compacta: Diseño horizontal/i);
    expect(btnCompact).toBeInTheDocument();
    expect(btnCompact).toHaveAttribute('aria-pressed', 'true');
  });

  it('renderiza la variante grande (expanded) con tarjetas KPI destacadas', () => {
    render(
      <DirectorHeroBanner
        evaluacion={mockEvaluacion}
        metricasDirector={mockMetricas}
        monthSelected={3}
        yearSelected={2026}
        variant="expanded"
        onVariantChange={jest.fn()}
        onSwitchToCompact={jest.fn()}
      />
    );

    // Debe mostrar KPI de Alumnos, Cobertura, Preguntas y Alertas
    expect(screen.getByText(/Estudiantes participantes/i)).toBeInTheDocument();
    expect(screen.getByText(/Tasa de participación de examen/i)).toBeInTheDocument();
    expect(screen.getByTitle('Alertas críticas: 2')).toBeInTheDocument();
    expect(screen.getByText('Competencias con rezago crítico')).toBeInTheDocument();
  });

  it('permite cambiar entre variante compacta y grande', () => {
    const handleVariantChange = jest.fn();
    render(
      <DirectorHeroBanner
        evaluacion={mockEvaluacion}
        metricasDirector={mockMetricas}
        monthSelected={3}
        yearSelected={2026}
        variant="compact"
        onVariantChange={handleVariantChange}
        onSwitchToCompact={jest.fn()}
      />
    );

    const btnGrande = screen.getByRole('button', { name: /Grande/i });
    fireEvent.click(btnGrande);

    expect(handleVariantChange).toHaveBeenCalledTimes(1);
    expect(handleVariantChange).toHaveBeenCalledWith('expanded');
  });

  it('renderiza la imagen de fondo cuando se proporciona y muestra overlay protector', () => {
    const mockBgUrl = 'https://ejemplo.com/banner.jpg';
    const { container } = render(
      <DirectorHeroBanner
        evaluacion={mockEvaluacion}
        monthSelected={3}
        yearSelected={2026}
        variant="expanded"
        backgroundImage={mockBgUrl}
        backgroundImageOpacity={0.3}
        onSwitchToCompact={jest.fn()}
      />
    );

    const bgDiv = container.querySelector('[style*="banner.jpg"]');
    expect(bgDiv).toBeInTheDocument();
  });

  it('permite subir una nueva imagen de fondo y eliminarla', () => {
    const handleUpload = jest.fn().mockResolvedValue('https://ejemplo.com/nueva.jpg');
    const handleRemove = jest.fn().mockResolvedValue(undefined);

    const { rerender } = render(
      <DirectorHeroBanner
        evaluacion={mockEvaluacion}
        monthSelected={3}
        yearSelected={2026}
        variant="expanded"
        backgroundImage={null}
        onUploadBackgroundImage={handleUpload}
        onRemoveBackgroundImage={handleRemove}
        onSwitchToCompact={jest.fn()}
      />
    );

    const btnFondo = screen.getByRole('button', { name: /Fondo/i });
    expect(btnFondo).toBeInTheDocument();

    const fileInput = screen.getByTestId('banner-file-input') as HTMLInputElement;
    const file = new File(['dummy content'], 'banner.png', { type: 'image/png' });
    fireEvent.change(fileInput, { target: { files: [file] } });

    expect(handleUpload).toHaveBeenCalledTimes(1);
    expect(handleUpload).toHaveBeenCalledWith(file);

    rerender(
      <DirectorHeroBanner
        evaluacion={mockEvaluacion}
        monthSelected={3}
        yearSelected={2026}
        variant="expanded"
        backgroundImage="https://ejemplo.com/fondo.jpg"
        onUploadBackgroundImage={handleUpload}
        onRemoveBackgroundImage={handleRemove}
        onSwitchToCompact={jest.fn()}
      />
    );

    const btnDelete = screen.getByRole('button', { name: /Eliminar imagen de fondo/i });
    expect(btnDelete).toBeInTheDocument();
    fireEvent.click(btnDelete);

    expect(handleRemove).toHaveBeenCalledTimes(1);
  });

  it('oculta completamente los controles de configuración cuando canConfigureBanner es false', () => {
    render(
      <DirectorHeroBanner
        evaluacion={mockEvaluacion}
        monthSelected={3}
        yearSelected={2026}
        variant="compact"
        onVariantChange={jest.fn()}
        onUploadBackgroundImage={jest.fn()}
        canConfigureBanner={false}
        onSwitchToCompact={jest.fn()}
      />
    );

    expect(screen.queryByTitle(/Vista Compacta: Diseño horizontal/i)).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /Grande/i })).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /Fondo/i })).not.toBeInTheDocument();
  });

  it('oculta los controles de configuración cuando no se proporcionan onVariantChange ni onUploadBackgroundImage', () => {
    render(
      <DirectorHeroBanner
        evaluacion={mockEvaluacion}
        monthSelected={3}
        yearSelected={2026}
        variant="compact"
        onSwitchToCompact={jest.fn()}
      />
    );

    expect(screen.queryByTitle(/Vista Compacta: Diseño horizontal/i)).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /Grande/i })).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /Fondo/i })).not.toBeInTheDocument();
  });
});

