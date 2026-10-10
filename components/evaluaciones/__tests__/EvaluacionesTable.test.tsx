import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import EvaluacionesTable, { EvaluacionItem } from '../EvaluacionesTable';

describe('EvaluacionesTable', () => {
  const mockEvaluaciones: EvaluacionItem[] = [
    {
      id: 'eva-1',
      nombre: 'Evaluación Diagnóstica Matemática',
      grado: '1',
      nivel: 1,
      añoDelExamen: '2026',
      mesDelExamen: '2', // Marzo
      active: true,
      cerrada: false,
    },
    {
      id: 'eva-2',
      nombre: 'Evaluación de Salida Comunicación',
      grado: '2',
      nivel: 1,
      añoDelExamen: '2026',
      mesDelExamen: '10', // Noviembre
      active: true,
      cerrada: true,
    },
  ];

  const mockGrados = [
    { grado: 1, nombre: '1° Grado de Primaria', nivel: 1 },
    { grado: 2, nombre: '2° Grado de Primaria', nivel: 1 },
  ];

  test('renderiza estado de carga cuando isLoading es true', () => {
    render(<EvaluacionesTable evaluaciones={[]} isLoading={true} loadingMessage="Sincronizando evaluaciones..." />);

    expect(screen.getByText('Sincronizando evaluaciones...')).toBeInTheDocument();
  });

  test('renderiza estado vacío cuando evaluaciones está vacío', () => {
    const handleReset = jest.fn();
    render(
      <EvaluacionesTable
        evaluaciones={[]}
        isLoading={false}
        onResetFilters={handleReset}
        emptyTitle="No hay evaluaciones disponibles"
        emptyDescription="Prueba ajustando los filtros."
      />
    );

    expect(screen.getByText('No hay evaluaciones disponibles')).toBeInTheDocument();
    expect(screen.getByText('Prueba ajustando los filtros.')).toBeInTheDocument();

    const resetBtn = screen.getByRole('button', { name: /Restablecer filtros/i });
    expect(resetBtn).toBeInTheDocument();
    fireEvent.click(resetBtn);
    expect(handleReset).toHaveBeenCalledTimes(1);
  });

  test('renderiza lista de evaluaciones con nombres, badges y reportes', () => {
    render(
      <EvaluacionesTable
        evaluaciones={mockEvaluaciones}
        grados={mockGrados}
        currentYear={2026}
        getReporteHref={(eva) => `/reporte/${eva.id}`}
        getEvaluacionHref={(eva) => `/evaluacion/${eva.id}`}
      />
    );

    // Nombres
    expect(screen.getByText('Evaluación Diagnóstica Matemática')).toBeInTheDocument();
    expect(screen.getByText('Evaluación de Salida Comunicación')).toBeInTheDocument();

    // Enlaces de detalle
    const linkEva1 = screen.getByRole('link', { name: /Evaluación Diagnóstica Matemática/i });
    expect(linkEva1).toHaveAttribute('href', '/evaluacion/eva-1');

    // Estados
    expect(screen.getByText('Activo')).toBeInTheDocument();
    expect(screen.getByText('Cerrado')).toBeInTheDocument();

    // Grados
    expect(screen.getByText('1° Grado de Primaria')).toBeInTheDocument();
    expect(screen.getByText('2° Grado de Primaria')).toBeInTheDocument();

    // Fechas
    expect(screen.getByText('Marzo 2026')).toBeInTheDocument();
    expect(screen.getByText('Noviembre 2026')).toBeInTheDocument();

    // Botones de reporte
    const reportLinks = screen.getAllByRole('link', { name: /Ver Reporte/i });
    expect(reportLinks).toHaveLength(2);
    expect(reportLinks[0]).toHaveAttribute('href', '/reporte/eva-1');
    expect(reportLinks[1]).toHaveAttribute('href', '/reporte/eva-2');

    // Conteo del footer
    expect(
      screen.getByText((_, element) => element?.tagName.toLowerCase() === 'span' && element?.textContent?.trim() === 'Mostrando 2 evaluaciones')
    ).toBeInTheDocument();
  });

  test('renderiza texto plano en nombre si getEvaluacionHref no es provisto', () => {
    render(
      <EvaluacionesTable
        evaluaciones={[mockEvaluaciones[0]]}
        grados={mockGrados}
        getReporteHref={(eva) => `/reporte/${eva.id}`}
      />
    );

    expect(screen.getByText('Evaluación Diagnóstica Matemática')).toBeInTheDocument();
    // No debe haber enlace para la evaluación
    expect(
      screen.queryByRole('link', { name: /Evaluación Diagnóstica Matemática/i })
    ).not.toBeInTheDocument();

    // Pero sí enlace para el reporte
    expect(screen.getByRole('link', { name: /Ver Reporte/i })).toHaveAttribute(
      'href',
      '/reporte/eva-1'
    );
  });

  test('renderiza acciones adicionales cuando renderExtraActions está presente', () => {
    render(
      <EvaluacionesTable
        evaluaciones={[mockEvaluaciones[0]]}
        renderExtraActions={(eva) => (
          <button type="button" data-testid={`action-${eva.id}`}>
            Acción Extra
          </button>
        )}
      />
    );

    expect(screen.getByText('Acciones')).toBeInTheDocument();
    expect(screen.getByTestId('action-eva-1')).toBeInTheDocument();
  });
});
