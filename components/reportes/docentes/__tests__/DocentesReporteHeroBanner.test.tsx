import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { DocentesReporteHeroBanner } from '../DocentesReporteHeroBanner';

describe('DocentesReporteHeroBanner Component', () => {
  it('renderiza el título de la evaluación de docentes en MAYÚSCULAS', () => {
    render(
      <DocentesReporteHeroBanner
        tituloEvaluacion="Acompañamiento y Desempeño Docente 2026"
        subtitulo="Monitoreo Directivo"
        colegio="I.E. José Antonio Encinas"
      />
    );

    expect(screen.getByText('ACOMPAÑAMIENTO Y DESEMPEÑO DOCENTE 2026')).toBeInTheDocument();
    expect(screen.getByText('Monitoreo Directivo')).toBeInTheDocument();
    expect(screen.getByText('I.E. José Antonio Encinas')).toBeInTheDocument();
  });

  it('renderiza la variante grande (expanded) con las 4 tarjetas KPI para Director', () => {
    render(
      <DocentesReporteHeroBanner
        tituloEvaluacion="Monitoreo Docente"
        role="director"
        variant="expanded"
        docentesEvaluados={18}
        totalDocentesPadron={20}
        totalCriterios={12}
        totalDominios={4}
        colegio="I.E. 70001"
        fechaTexto="Octubre 2026"
      />
    );

    // Badges superiores
    expect(screen.getByText('Evaluación Docente')).toBeInTheDocument();
    expect(screen.getByText('Octubre 2026')).toBeInTheDocument();
    expect(screen.getByText('I.E. 70001')).toBeInTheDocument();

    // 4 Tarjetas KPI
    expect(screen.getByText('Docentes Evaluados')).toBeInTheDocument();
    expect(screen.getByText('18')).toBeInTheDocument();
    expect(screen.getByText('/20')).toBeInTheDocument();
    expect(screen.getByText('Docentes evaluados de la I.E.')).toBeInTheDocument();

    expect(screen.getByText('Cobertura')).toBeInTheDocument();
    expect(screen.getByText('90%')).toBeInTheDocument(); // 18 / 20 = 90%
    expect(screen.getByText('Tasa de avance docente')).toBeInTheDocument();

    expect(screen.getByText('Criterios Evaluados')).toBeInTheDocument();
    expect(screen.getByText('12')).toBeInTheDocument();

    expect(screen.getByText('Dominios de Aula')).toBeInTheDocument();
    expect(screen.getByText('4')).toBeInTheDocument();
  });

  it('renderiza la variante compacta con micro-cápsulas para docentes', () => {
    render(
      <DocentesReporteHeroBanner
        tituloEvaluacion="Monitoreo Docente"
        role="director"
        variant="compact"
        docentesEvaluados={15}
        totalDocentesPadron={15}
        totalCriterios={10}
        totalDominios={3}
      />
    );

    expect(screen.getByText('Docentes')).toBeInTheDocument();
    expect(screen.getByText('Cobertura')).toBeInTheDocument();
    expect(screen.getByText('Criterios')).toBeInTheDocument();
    expect(screen.getByText('Dominios')).toBeInTheDocument();
    expect(screen.getByText('15')).toBeInTheDocument();
    expect(screen.getByText('100%')).toBeInTheDocument();
  });

  it('permite cambiar entre variante compacta y grande mediante onVariantChange solo a administradores', () => {
    const handleVariantChange = jest.fn();
    render(
      <DocentesReporteHeroBanner
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

  it('oculta el conmutador de variante compacta/grande para roles no administradores', () => {
    const handleVariantChange = jest.fn();
    render(
      <DocentesReporteHeroBanner
        variant="compact"
        role="director"
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
      <DocentesReporteHeroBanner
        layoutMode="tabs"
        onChangeLayoutMode={handleLayoutChange}
      />
    );

    const btnCascada = screen.getByTitle(/Ver reporte en cascada vertical continua/i);
    expect(btnCascada).toBeInTheDocument();
    fireEvent.click(btnCascada);

    expect(handleLayoutChange).toHaveBeenCalledWith('cascade');
  });

  it('renderiza el botón de Volver cuando se pasa backHref', () => {
    render(
      <DocentesReporteHeroBanner
        backHref="/directores/evaluaciones-docentes/evaluacion/123"
      />
    );

    const linkVolver = screen.getByRole('link', { name: /Volver/i });
    expect(linkVolver).toBeInTheDocument();
    expect(linkVolver).toHaveAttribute('href', '/directores/evaluaciones-docentes/evaluacion/123');
  });

  it('permite subir y eliminar imagen de fondo', () => {
    const handleUpload = jest.fn().mockResolvedValue('http://example.com/bg.jpg');
    const handleRemove = jest.fn().mockResolvedValue(undefined);

    const { rerender } = render(
      <DocentesReporteHeroBanner
        onUploadBackgroundImage={handleUpload}
        onRemoveBackgroundImage={handleRemove}
      />
    );

    const fileInput = screen.getByTestId('banner-file-input');
    const file = new File(['test'], 'test.png', { type: 'image/png' });
    fireEvent.change(fileInput, { target: { files: [file] } });
    expect(handleUpload).toHaveBeenCalledWith(file);

    rerender(
      <DocentesReporteHeroBanner
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
});
