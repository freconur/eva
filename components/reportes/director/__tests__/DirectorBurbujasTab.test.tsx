import React from 'react';
import { render, screen } from '@testing-library/react';
import DirectorBurbujasTab from '../DirectorBurbujasTab';
import { DirectorMetricasResumen } from '../types';
import { formatGradoAbbr, formatSeccionDisplay } from '../useMetricasDirector';

describe('DirectorBurbujasTab Component', () => {
  const mockMetricas: DirectorMetricasResumen = {
    secciones: [
      {
        id: 'ie_1',
        nombre: 'IE 70001',
        totalEstudiantes: 30,
        preguntas: {
          1: {
            order: 1,
            preguntaId: 'p1',
            totalEstudiantes: 30,
            correctas: 10,
            falladas: 20,
            aciertoPct: 33,
            prevPct: 67,
          },
        },
        avgPrev: 67,
        criticas: 1,
        altas: 0,
        medias: 0,
        bajas: 0,
        topPregunta: null,
        nivelRiesgo: {
          label: 'Crítico',
          icon: '',
          bg: '#fee2e2',
          text: '#991b1b',
          color: '#ef4444',
        },
      },
    ],
    totalIe: {
      id: 'total_ie',
      nombre: 'CONSOLIDADO UGEL PUNO',
      totalEstudiantes: 30,
      preguntas: {
        1: {
          order: 1,
          preguntaId: 'p1',
          totalEstudiantes: 30,
          correctas: 10,
          falladas: 20,
          aciertoPct: 33,
          prevPct: 67,
        },
      },
      avgPrev: 67,
      criticas: 1,
      altas: 0,
      medias: 0,
      bajas: 0,
      topPregunta: null,
      nivelRiesgo: {
        label: 'Crítico',
        icon: '',
        bg: '#fee2e2',
        text: '#991b1b',
        color: '#ef4444',
      },
    },
    kpis: {
      totalCritico: 1,
      totalAlto: 0,
      totalMedio: 0,
      totalBajo: 0,
      avgPrev: 67,
    },
    activeBaremo: {
      critico: 60,
      alto: 40,
      medio: 20,
    },
    sortedPreguntas: [
      {
        id: 'p1',
        order: 1,
        pregunta: '¿Cuál es la idea principal?',
        respuesta: 'A',
      },
    ],
  };

  const defaultProps = {
    metricas: mockMetricas,
    preguntas: mockMetricas.sortedPreguntas,
    onOpenQuestionDetail: jest.fn(),
    onOpenGuiaModal: jest.fn(),
  };

  it('renderiza cabecera "Sección / Aula" en modo estándar', () => {
    render(<DirectorBurbujasTab {...defaultProps} isUgelView={false} />);
    expect(screen.getByText('Sección / Aula')).toBeInTheDocument();
  });

  it('renderiza chip "Institucion" y fila de institución en modo isUgelView', () => {
    render(<DirectorBurbujasTab {...defaultProps} isUgelView={true} />);
    expect(screen.getByText('Institucion')).toBeInTheDocument();
    expect(screen.getByText('IE 70001')).toBeInTheDocument();
    expect(screen.getByText('CONSOLIDADO UGEL PUNO')).toBeInTheDocument();
    expect(screen.getByText('P01')).toBeInTheDocument();
    expect(screen.getAllByText('67%').length).toBeGreaterThan(0);
  });

  it('renderiza secciones y fila benchmark regional cuando se pasa benchmarkRow (drill-down IE)', () => {
    const drillDownMetricas: DirectorMetricasResumen = {
      ...mockMetricas,
      secciones: [
        {
          id: 'A',
          nombre: 'Sección A',
          totalEstudiantes: 15,
          preguntas: {
            1: {
              order: 1,
              preguntaId: 'p1',
              totalEstudiantes: 15,
              correctas: 5,
              falladas: 10,
              aciertoPct: 33,
              prevPct: 67,
            },
          },
          avgPrev: 67,
          criticas: 1,
          altas: 0,
          medias: 0,
          bajas: 0,
          topPregunta: null,
          nivelRiesgo: mockMetricas.secciones[0].nivelRiesgo,
        },
        {
          id: 'B',
          nombre: 'Sección B',
          totalEstudiantes: 15,
          preguntas: {
            1: {
              order: 1,
              preguntaId: 'p1',
              totalEstudiantes: 15,
              correctas: 6,
              falladas: 9,
              aciertoPct: 40,
              prevPct: 60,
            },
          },
          avgPrev: 60,
          criticas: 1,
          altas: 0,
          medias: 0,
          bajas: 0,
          topPregunta: null,
          nivelRiesgo: mockMetricas.secciones[0].nivelRiesgo,
        },
      ],
      totalIe: {
        id: 'total_ie',
        nombre: 'CONSOLIDADO IE 70001',
        totalEstudiantes: 30,
        preguntas: {
          1: {
            order: 1,
            preguntaId: 'p1',
            totalEstudiantes: 30,
            correctas: 11,
            falladas: 19,
            aciertoPct: 37,
            prevPct: 63,
          },
        },
        avgPrev: 63,
        criticas: 1,
        altas: 0,
        medias: 0,
        bajas: 0,
        topPregunta: null,
        nivelRiesgo: mockMetricas.secciones[0].nivelRiesgo,
      },
    };

    const benchmarkUgelRow = {
      id: 'total_ugel',
      nombre: 'CONSOLIDADO UGEL PUNO',
      totalEstudiantes: 1200,
      preguntas: {
        1: {
          order: 1,
          preguntaId: 'p1',
          totalEstudiantes: 1200,
          correctas: 600,
          falladas: 600,
          aciertoPct: 50,
          prevPct: 50,
        },
      },
      avgPrev: 50,
      criticas: 0,
      altas: 1,
      medias: 0,
      bajas: 0,
      topPregunta: null,
      nivelRiesgo: mockMetricas.secciones[0].nivelRiesgo,
    };

    render(
      <DirectorBurbujasTab
        {...defaultProps}
        metricas={drillDownMetricas}
        isUgelView={true}
        benchmarkRow={benchmarkUgelRow}
      />
    );

    expect(screen.getByText('Institucion')).toBeInTheDocument();
    expect(screen.getByText('Sección A')).toBeInTheDocument();
    expect(screen.getByText('Sección B')).toBeInTheDocument();
    expect(screen.getByText('CONSOLIDADO IE 70001')).toBeInTheDocument();
    expect(screen.getByText('CONSOLIDADO UGEL PUNO')).toBeInTheDocument();
    expect(screen.getByText('1200 evaluados en la UGEL')).toBeInTheDocument();
  });

  it('renderiza el nombre de la institución en el chip de cabecera y "6to-B", "6to-A" en las filas', () => {
    const drillDownMetricas: DirectorMetricasResumen = {
      ...mockMetricas,
      secciones: [
        {
          id: '2',
          nombre: '6to-B',
          totalEstudiantes: 28,
          preguntas: {
            1: {
              order: 1,
              preguntaId: 'p1',
              totalEstudiantes: 28,
              correctas: 19,
              falladas: 9,
              aciertoPct: 68,
              prevPct: 32,
            },
          },
          avgPrev: 32,
          criticas: 0,
          altas: 0,
          medias: 1,
          bajas: 0,
          topPregunta: null,
          nivelRiesgo: mockMetricas.secciones[0].nivelRiesgo,
        },
        {
          id: '1',
          nombre: '6to-A',
          totalEstudiantes: 30,
          preguntas: {
            1: {
              order: 1,
              preguntaId: 'p1',
              totalEstudiantes: 30,
              correctas: 21,
              falladas: 9,
              aciertoPct: 70,
              prevPct: 29,
            },
          },
          avgPrev: 29,
          criticas: 0,
          altas: 0,
          medias: 1,
          bajas: 0,
          topPregunta: null,
          nivelRiesgo: mockMetricas.secciones[0].nivelRiesgo,
        },
      ],
      totalIe: {
        id: 'total_ie',
        nombre: 'CONSOLIDADO IE 70618',
        totalEstudiantes: 87,
        preguntas: {
          1: {
            order: 1,
            preguntaId: 'p1',
            totalEstudiantes: 87,
            correctas: 67,
            falladas: 20,
            aciertoPct: 77,
            prevPct: 23,
          },
        },
        avgPrev: 23,
        criticas: 0,
        altas: 0,
        medias: 1,
        bajas: 0,
        topPregunta: null,
        nivelRiesgo: mockMetricas.secciones[0].nivelRiesgo,
      },
    };

    const benchmarkUgelRow = {
      id: 'total_ugel',
      nombre: 'CONSOLIDADO UGEL SAN ROMÁN',
      totalEstudiantes: 2281,
      preguntas: {
        1: {
          order: 1,
          preguntaId: 'p1',
          totalEstudiantes: 2281,
          correctas: 1688,
          falladas: 593,
          aciertoPct: 74,
          prevPct: 26,
        },
      },
      avgPrev: 26,
      criticas: 0,
      altas: 0,
      medias: 1,
      bajas: 0,
      topPregunta: null,
      nivelRiesgo: mockMetricas.secciones[0].nivelRiesgo,
    };

    render(
      <DirectorBurbujasTab
        {...defaultProps}
        metricas={drillDownMetricas}
        isUgelView={true}
        headerLabel="IE 70618"
        benchmarkRow={benchmarkUgelRow}
      />
    );

    // Debe mostrar el nombre de la institución en el chip superior
    expect(screen.getByText('IE 70618')).toBeInTheDocument();
    // Las secciones deben mostrar "6to-B" y "6to-A"
    expect(screen.getByText('6to-B')).toBeInTheDocument();
    expect(screen.getByText('6to-A')).toBeInTheDocument();
    // Los consolidados deben coincidir con la captura
    expect(screen.getByText('CONSOLIDADO IE 70618')).toBeInTheDocument();
    expect(screen.getByText('CONSOLIDADO UGEL SAN ROMÁN')).toBeInTheDocument();
    expect(screen.getByText('87 evaluados')).toBeInTheDocument();
    expect(screen.getByText('2281 evaluados en la UGEL')).toBeInTheDocument();
  });

  describe('formatGradoAbbr and formatSeccionDisplay helpers', () => {
    it('formatea abreviaciones de grados escolares correctamente', () => {
      expect(formatGradoAbbr(1)).toBe('1ro');
      expect(formatGradoAbbr(2)).toBe('2do');
      expect(formatGradoAbbr(3)).toBe('3ro');
      expect(formatGradoAbbr(4)).toBe('4to');
      expect(formatGradoAbbr(5)).toBe('5to');
      expect(formatGradoAbbr(6)).toBe('6to');
      expect(formatGradoAbbr(7)).toBe('1ro');
      expect(formatGradoAbbr(8)).toBe('2do');
      expect(formatGradoAbbr(12)).toBe('5 años');
    });

    it('formatea secciones numéricas a grado y letra (ej. "6to-B", "6to-A")', () => {
      expect(formatSeccionDisplay(2, 6)).toBe('6to-B');
      expect(formatSeccionDisplay(1, 6)).toBe('6to-A');
      expect(formatSeccionDisplay(3, 6)).toBe('6to-C');
      expect(formatSeccionDisplay('2', 6)).toBe('6to-B');
      expect(formatSeccionDisplay('1', 6)).toBe('6to-A');
    });

    it('respeta secciones con letras ya existentes', () => {
      expect(formatSeccionDisplay('b', 6)).toBe('6to-B');
      expect(formatSeccionDisplay('A', 6)).toBe('6to-A');
      expect(formatSeccionDisplay('6to-B', 6)).toBe('6to-B');
      expect(formatSeccionDisplay('Sección 2', 6)).toBe('6to-B');
    });
  });
});

