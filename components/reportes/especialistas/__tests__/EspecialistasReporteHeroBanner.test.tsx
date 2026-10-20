import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { EspecialistasReporteHeroBanner } from '../EspecialistasReporteHeroBanner';

describe('EspecialistasReporteHeroBanner Component', () => {
  it('renderiza el título de la evaluación siempre en MAYÚSCULAS según AGENTS.md', () => {
    render(
      <EspecialistasReporteHeroBanner
        tituloEvaluacion="Evaluación Regional de Especialistas 2026"
        subtitulo="Monitoreo de Desempeño DRE Puno"
      />
    );

    expect(screen.getByText('EVALUACIÓN REGIONAL DE ESPECIALISTAS 2026')).toBeInTheDocument();
    expect(screen.getByText('Monitoreo de Desempeño DRE Puno')).toBeInTheDocument();
  });

  it('renderiza la variante grande (expanded) con las 4 tarjetas KPI para especialistas', () => {
    render(
      <EspecialistasReporteHeroBanner
        tituloEvaluacion="Desempeño Especialistas"
        variant="expanded"
        ugelsParticipantes={14}
        totalUgels={14}
        totalEspecialistas={42}
        totalCriterios={20}
        ambitoTexto="Especialistas DRE/UGEL"
        regionTexto="DRE Puno"
        fechaTexto="Octubre 2026"
      />
    );

    // Badges superiores
    expect(screen.getByText('Especialistas DRE/UGEL')).toBeInTheDocument();
    expect(screen.getByText('Octubre 2026')).toBeInTheDocument();
    expect(screen.getByText('DRE Puno')).toBeInTheDocument();

    // 4 Tarjetas KPI en vista grande
    expect(screen.getByText('UGELs Participantes')).toBeInTheDocument();
    expect(screen.getByText('UGELs con especialistas evaluados')).toBeInTheDocument();
    expect(screen.getByText('100%')).toBeInTheDocument(); // Cobertura 14 / 14
    expect(screen.getByText('Tasa de cobertura territorial')).toBeInTheDocument();
    expect(screen.getByText('42')).toBeInTheDocument();
    expect(screen.getByText('Especialistas registrados y evaluados')).toBeInTheDocument();
    expect(screen.getByText('20')).toBeInTheDocument();
    expect(screen.getByText('Criterios e indicadores pedagógicos')).toBeInTheDocument();
  });

  it('renderiza la variante compacta con micro-cápsulas horizontales', () => {
    render(
      <EspecialistasReporteHeroBanner
        tituloEvaluacion="Desempeño Especialistas"
        variant="compact"
        ugelsParticipantes={12}
        totalUgels={14}
        totalEspecialistas={35}
        totalCriterios={15}
      />
    );

    // Etiquetas de micro-cápsulas compactas
    expect(screen.getByText('UGELs')).toBeInTheDocument();
    expect(screen.getByText('Cobertura')).toBeInTheDocument();
    expect(screen.getByText('Especialistas')).toBeInTheDocument();
    expect(screen.getByText('Criterios')).toBeInTheDocument();
    expect(screen.getByText('35')).toBeInTheDocument();
    expect(screen.getByText('15')).toBeInTheDocument();
  });

  it('permite cambiar entre variante compacta y grande mediante onVariantChange solo a administradores', () => {
    const handleVariantChange = jest.fn();
    render(
      <EspecialistasReporteHeroBanner
        tituloEvaluacion="Desempeño Especialistas"
        variant="compact"
        isAdmin={true}
        onVariantChange={handleVariantChange}
      />
    );

    const btnGrande = screen.getByTitle(/Vista Grande: Diseño amplio/i);
    expect(btnGrande).toBeInTheDocument();
    fireEvent.click(btnGrande);

    expect(handleVariantChange).toHaveBeenCalledWith('expanded');
  });

  it('oculta el selector de variante compacta/grande para roles no administradores', () => {
    const handleVariantChange = jest.fn();
    render(
      <EspecialistasReporteHeroBanner
        tituloEvaluacion="Desempeño Especialistas"
        variant="compact"
        isAdmin={false}
        onVariantChange={handleVariantChange}
      />
    );

    expect(screen.queryByTitle(/Vista Grande: Diseño amplio/i)).not.toBeInTheDocument();
    expect(screen.queryByTitle(/Vista Compacta: Diseño horizontal/i)).not.toBeInTheDocument();
  });

  it('renderiza el switch de Pestañas / Cascada e interactúa con onChangeLayoutMode', () => {
    const handleLayoutChange = jest.fn();
    render(
      <EspecialistasReporteHeroBanner
        tituloEvaluacion="Desempeño Especialistas"
        layoutMode="tabs"
        onChangeLayoutMode={handleLayoutChange}
      />
    );

    const btnCascada = screen.getByTitle(/Ver reporte en cascada vertical continua/i);
    expect(btnCascada).toBeInTheDocument();
    fireEvent.click(btnCascada);

    expect(handleLayoutChange).toHaveBeenCalledWith('cascade');
  });

  it('permite interactuar con la subida y eliminación de imagen de fondo', () => {
    const handleUpload = jest.fn().mockResolvedValue('http://example.com/bg.jpg');
    const handleRemove = jest.fn().mockResolvedValue(undefined);

    const { rerender } = render(
      <EspecialistasReporteHeroBanner
        tituloEvaluacion="Desempeño Especialistas"
        backgroundImage={null}
        onUploadBackgroundImage={handleUpload}
        onRemoveBackgroundImage={handleRemove}
      />
    );

    const btnFondo = screen.getByTitle(/Subir imagen de fondo institucional/i);
    expect(btnFondo).toBeInTheDocument();

    const fileInput = screen.getByTestId('banner-file-input');
    const dummyFile = new File(['dummy'], 'bg.png', { type: 'image/png' });
    fireEvent.change(fileInput, { target: { files: [dummyFile] } });
    expect(handleUpload).toHaveBeenCalledWith(dummyFile);

    // Ahora con imagen de fondo activa
    rerender(
      <EspecialistasReporteHeroBanner
        tituloEvaluacion="Desempeño Especialistas"
        backgroundImage="http://example.com/bg.jpg"
        onUploadBackgroundImage={handleUpload}
        onRemoveBackgroundImage={handleRemove}
      />
    );

    const btnDelete = screen.getByLabelText(/Eliminar imagen de fondo/i);
    expect(btnDelete).toBeInTheDocument();
    fireEvent.click(btnDelete);
    expect(handleRemove).toHaveBeenCalled();
  });

  it('renderiza el botón de volver cuando se proporciona backHref en variante expanded y compact', () => {
    const { rerender } = render(
      <EspecialistasReporteHeroBanner
        tituloEvaluacion="Desempeño Especialistas"
        variant="expanded"
        backHref="/admin/especialistas/evaluaciones-especialistas/evaluacion/eval-123"
      />
    );

    const backButtonExpanded = screen.getByRole('link', { name: /Volver a la evaluación/i });
    expect(backButtonExpanded).toBeInTheDocument();
    expect(backButtonExpanded).toHaveAttribute(
      'href',
      '/admin/especialistas/evaluaciones-especialistas/evaluacion/eval-123'
    );
    expect(backButtonExpanded).toHaveTextContent('Volver');

    // Cambiar a compacta y con etiqueta personalizada
    rerender(
      <EspecialistasReporteHeroBanner
        tituloEvaluacion="Desempeño Especialistas"
        variant="compact"
        backHref="/admin/especialistas/evaluaciones-especialistas/evaluacion/eval-123"
        backLabel="Regresar"
      />
    );

    const backButtonCompact = screen.getByRole('link', { name: /Volver a la evaluación/i });
    expect(backButtonCompact).toBeInTheDocument();
    expect(backButtonCompact).toHaveAttribute(
      'href',
      '/admin/especialistas/evaluaciones-especialistas/evaluacion/eval-123'
    );
    expect(backButtonCompact).toHaveTextContent('Regresar');
  });
});
