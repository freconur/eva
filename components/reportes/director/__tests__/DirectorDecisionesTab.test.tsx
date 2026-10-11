import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { DirectorDecisionesTab } from '../DirectorDecisionesTab';
import { DirectorMetricasResumen } from '../types';
import { DEFAULT_BAREMO_DECISIONES } from '@/components/modals/ConfigurarBaremoModal';

describe('DirectorDecisionesTab - Lista de Desglose Ordenada por Criticidad', () => {
  const mockOnOpenQuestionDetail = jest.fn();
  const mockOnOpenGuiaModal = jest.fn();

  const mockMetricas: DirectorMetricasResumen = {
    secciones: [
      {
        id: 'sec-1',
        nombre: '1° A',
        docenteNombre: 'Juan Pérez',
        totalEstudiantes: 20,
        avgPrev: 45,
        criticas: 1,
        altas: 1,
        medias: 1,
        bajas: 1,
        topPregunta: {
          order: 3,
          preguntaId: 'q3',
          totalEstudiantes: 20,
          correctas: 4,
          falladas: 16,
          aciertoPct: 20,
          prevPct: 80,
        },
        nivelRiesgo: {
          label: 'Crítico',
          icon: '',
          bg: '#fee2e2',
          text: '#991b1b',
          color: '#ef4444',
        },
        preguntas: {
          1: {
            order: 1,
            preguntaId: 'q1',
            totalEstudiantes: 20,
            correctas: 15,
            falladas: 5,
            aciertoPct: 75,
            prevPct: 25, // Nivel Bajo
          },
          2: {
            order: 2,
            preguntaId: 'q2',
            totalEstudiantes: 20,
            correctas: 11,
            falladas: 9,
            aciertoPct: 55,
            prevPct: 45, // Nivel Medio
          },
          3: {
            order: 3,
            preguntaId: 'q3',
            totalEstudiantes: 20,
            correctas: 4,
            falladas: 16,
            aciertoPct: 20,
            prevPct: 80, // Nivel Crítico
          },
          4: {
            order: 4,
            preguntaId: 'q4',
            totalEstudiantes: 20,
            correctas: 9,
            falladas: 11,
            aciertoPct: 45,
            prevPct: 55, // Nivel Alto
          },
        },
      },
    ],
    totalIe: null,
    sortedPreguntas: [],
    kpis: {
      totalCritico: 1,
      totalAlto: 1,
      totalMedio: 1,
      totalBajo: 1,
      avgPrev: 45,
    },
    activeBaremo: DEFAULT_BAREMO_DECISIONES,
  };

  const mockPreguntas = [
    { id: 'q1', order: 1, pregunta: '¿Pregunta 1?', preguntaDocente: 'Competencia 1' },
    { id: 'q2', order: 2, pregunta: '¿Pregunta 2?', preguntaDocente: 'Competencia 2' },
    { id: 'q3', order: 3, pregunta: '¿Pregunta 3?', preguntaDocente: 'Competencia 3' },
    { id: 'q4', order: 4, pregunta: '¿Pregunta 4?', preguntaDocente: 'Competencia 4' },
  ];

  it('renderiza la tabla analítica con las cabeceras solicitadas en vez de cards', () => {
    render(
      <DirectorDecisionesTab
        metricas={mockMetricas}
        preguntas={mockPreguntas as any}
        onOpenQuestionDetail={mockOnOpenQuestionDetail}
        onOpenGuiaModal={mockOnOpenGuiaModal}
      />
    );

    // Las cabeceras exactas de la tabla
    expect(screen.getByText('Ítem')).toBeInTheDocument();
    expect(screen.getByText('% en Previo al Inicio (Rezago)')).toBeInTheDocument();
    expect(screen.getByText('Estudiantes Afectados')).toBeInTheDocument();
    expect(screen.getByText('Nivel de Alerta')).toBeInTheDocument();
    expect(screen.getByText('Acción Recomendada')).toBeInTheDocument();
  });

  it('ordena los ítems de mayor a menor rezago (de más crítico a menos crítico)', () => {
    render(
      <DirectorDecisionesTab
        metricas={mockMetricas}
        preguntas={mockPreguntas as any}
        onOpenQuestionDetail={mockOnOpenQuestionDetail}
        onOpenGuiaModal={mockOnOpenGuiaModal}
      />
    );

    // Los botones de ítem (P03, P04, P02, P01)
    const itemButtons = screen.getAllByRole('button', { name: /^P0[1-4]$/ });
    expect(itemButtons).toHaveLength(4);

    // Debe estar ordenado descendentemente:
    // P03 (80%) -> P04 (55%) -> P02 (45%) -> P01 (25%)
    expect(itemButtons[0]).toHaveTextContent('P03');
    expect(itemButtons[1]).toHaveTextContent('P04');
    expect(itemButtons[2]).toHaveTextContent('P02');
    expect(itemButtons[3]).toHaveTextContent('P01');

    // Verificar texto de Estudiantes Afectados
    expect(screen.getByText('16 de 20')).toBeInTheDocument();
    expect(screen.getByText('11 de 20')).toBeInTheDocument();
    expect(screen.getByText('9 de 20')).toBeInTheDocument();
    expect(screen.getByText('5 de 20')).toBeInTheDocument();
  });

  it('permite hacer clic en un ítem para abrir el detalle pedagógico', () => {
    render(
      <DirectorDecisionesTab
        metricas={mockMetricas}
        preguntas={mockPreguntas as any}
        onOpenQuestionDetail={mockOnOpenQuestionDetail}
        onOpenGuiaModal={mockOnOpenGuiaModal}
      />
    );

    const btnP03 = screen.getByRole('button', { name: 'P03' });
    fireEvent.click(btnP03);

    expect(mockOnOpenQuestionDetail).toHaveBeenCalledWith(3, expect.any(Object));
  });
});
