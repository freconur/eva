import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import DirectorDecisionesTab from '../DirectorDecisionesTab';
import { DirectorMetricasResumen } from '../types';
import { DEFAULT_BAREMO_DECISIONES } from '@/components/modals/ConfigurarBaremoModal';

describe('DirectorDecisionesTab Component', () => {
  const mockMetricas: DirectorMetricasResumen = {
    secciones: [
      {
        id: 'A',
        nombre: 'Sección A',
        docenteNombre: 'Profesor Juan Perez',
        totalEstudiantes: 25,
        preguntas: {
          1: {
            order: 1,
            preguntaId: 'p1',
            totalEstudiantes: 25,
            correctas: 10,
            falladas: 15,
            aciertoPct: 40,
            prevPct: 60,
          },
        },
        avgPrev: 60,
        criticas: 1,
        altas: 0,
        medias: 0,
        bajas: 0,
        topPregunta: {
          order: 1,
          preguntaId: 'p1',
          totalEstudiantes: 25,
          correctas: 10,
          falladas: 15,
          aciertoPct: 40,
          prevPct: 60,
        },
        nivelRiesgo: {
          label: 'Crítico',
          icon: 'critico',
          bg: '#fee2e2',
          text: '#991b1b',
          color: '#ef4444',
        },
      },
      {
        id: 'B',
        nombre: 'Sección B',
        docenteNombre: 'Profesor Juan Perez',
        totalEstudiantes: 20,
        preguntas: {
          1: {
            order: 1,
            preguntaId: 'p1',
            totalEstudiantes: 20,
            correctas: 15,
            falladas: 5,
            aciertoPct: 75,
            prevPct: 25,
          },
        },
        avgPrev: 25,
        criticas: 0,
        altas: 0,
        medias: 0,
        bajas: 1,
        topPregunta: {
          order: 1,
          preguntaId: 'p1',
          totalEstudiantes: 20,
          correctas: 15,
          falladas: 5,
          aciertoPct: 75,
          prevPct: 25,
        },
        nivelRiesgo: {
          label: 'Bajo',
          icon: 'bajo',
          bg: '#dcfce7',
          text: '#166534',
          color: '#22c55e',
        },
      },
    ],
    totalIe: {
      id: 'total_ie',
      nombre: 'TOTAL I.E.',
      docenteNombre: 'Profesor Juan Perez',
      totalEstudiantes: 45,
      preguntas: {
        1: {
          order: 1,
          preguntaId: 'p1',
          totalEstudiantes: 45,
          correctas: 25,
          falladas: 20,
          aciertoPct: 56,
          prevPct: 44,
        },
      },
      avgPrev: 44,
      criticas: 0,
      altas: 1,
      medias: 0,
      bajas: 0,
      topPregunta: {
        order: 1,
        preguntaId: 'p1',
        totalEstudiantes: 45,
        correctas: 25,
        falladas: 20,
        aciertoPct: 56,
        prevPct: 44,
      },
      nivelRiesgo: {
        label: 'Medio',
        icon: 'medio',
        bg: '#fef9c3',
        text: '#854d0e',
        color: '#eab308',
      },
    },
    sortedPreguntas: [
      {
        id: 'p1',
        order: 1,
        pregunta: '¿Cuál es la idea principal?',
        preguntaDocente: 'Modelar inferencias de textos',
        alternativas: [],
        respuesta: 'A',
      },
    ],
    kpis: {
      totalCritico: 1,
      totalAlto: 0,
      totalMedio: 0,
      totalBajo: 1,
      avgPrev: 43,
    },
    activeBaremo: DEFAULT_BAREMO_DECISIONES,
  };

  const defaultProps = {
    metricas: mockMetricas,
    preguntas: mockMetricas.sortedPreguntas,
    onOpenQuestionDetail: jest.fn(),
    onOpenGuiaModal: jest.fn(),
  };

  describe('Vista Director (isDocenteView = false)', () => {
    it('muestra columna "Sección / Docente" y muestra los nombres de los docentes en las filas', () => {
      render(<DirectorDecisionesTab {...defaultProps} isDocenteView={false} />);

      expect(screen.getByText('Sección / Docente')).toBeInTheDocument();
      expect(screen.getAllByText(/Prof\. Profesor Juan Perez/).length).toBeGreaterThan(0);
      expect(screen.getByText('Sección A')).toBeInTheDocument();
      expect(screen.getByText('Sección B')).toBeInTheDocument();
    });

    it('permite filtrar por sección individual en modo director', () => {
      render(
        <DirectorDecisionesTab
          {...defaultProps}
          isDocenteView={false}
          selectedSeccion="A"
        />
      );

      // Aparece en el dropdown y en la fila de la tabla
      expect(screen.getAllByText('Sección A').length).toBe(2);
      expect(screen.queryByText('Sección B')).not.toBeInTheDocument();
    });
  });

  describe('Vista Docente (isDocenteView = true)', () => {
    it('por defecto activa vista "global", muestra "Cohorte", no muestra nombres de docente redundantes', () => {
      render(<DirectorDecisionesTab {...defaultProps} isDocenteView={true} />);

      // Debe mostrar la columna Cohorte
      expect(screen.getByText('Cohorte')).toBeInTheDocument();

      // Debe mostrar la cohorte consolidada de todos sus estudiantes
      expect(screen.getAllByText('Consolidado Global (Todos mis estudiantes)').length).toBeGreaterThan(0);

      // No debe mostrar "Prof. Profesor Juan Perez" redundante
      expect(screen.queryByText(/Prof\. Profesor Juan Perez/)).not.toBeInTheDocument();

      // Debe indicar Rezago Global en el KPI
      expect(screen.getByText('Rezago Global')).toBeInTheDocument();
    });

    it('al seleccionar una sección específica muestra "Sección / Aula", filtra a esa sección y adapta el KPI a "Rezago Aula"', () => {
      render(
        <DirectorDecisionesTab
          {...defaultProps}
          isDocenteView={true}
          selectedSeccion="A"
        />
      );

      // Debe mostrar la columna "Sección / Aula"
      expect(screen.getByText('Sección / Aula')).toBeInTheDocument();

      // Solo muestra la sección A (en dropdown y fila)
      expect(screen.getAllByText('Sección A').length).toBe(2);
      expect(screen.queryByText('Sección B')).not.toBeInTheDocument();

      // No debe mostrar el nombre del docente redundante
      expect(screen.queryByText(/Prof\. Profesor Juan Perez/)).not.toBeInTheDocument();

      // Debe indicar Rezago Aula en el KPI
      expect(screen.getByText('Rezago Aula')).toBeInTheDocument();
    });

    it('llama a onSelectSeccion al cambiar de filtro en el dropdown custom', () => {
      const onSelectSeccionMock = jest.fn();

      render(
        <DirectorDecisionesTab
          {...defaultProps}
          isDocenteView={true}
          selectedSeccion="global"
          onSelectSeccion={onSelectSeccionMock}
        />
      );

      // Abrir el dropdown
      const label = screen.getByText('Filtrar aula:');
      const dropdownBtn = label.closest('div')!.querySelector('button')!;
      fireEvent.click(dropdownBtn);

      // Seleccionar Sección A en el listado desplegable
      const options = screen.getAllByText('Sección A');
      // La opción dentro del dropdown desplegado
      fireEvent.click(options[options.length - 1]);

      expect(onSelectSeccionMock).toHaveBeenCalledWith('A');
    });

    it('dropdownOptions incluye "Global (Todos mis estudiantes)" y "Todas mis secciones" para docentes con múltiples aulas', () => {
      render(<DirectorDecisionesTab {...defaultProps} isDocenteView={true} />);

      // Abrir el dropdown
      const label = screen.getByText('Filtrar aula:');
      const dropdownBtn = label.closest('div')!.querySelector('button')!;
      fireEvent.click(dropdownBtn);

      expect(screen.getAllByText('Global (Todos mis estudiantes)').length).toBeGreaterThan(0);
      expect(screen.getByText(/Todas mis secciones \(2 aulas\)/)).toBeInTheDocument();
      expect(screen.getByText('Sección A')).toBeInTheDocument();
      expect(screen.getByText('Sección B')).toBeInTheDocument();
    });
  });

  describe('isUgelView (Enfoque Especialista UGEL / Global)', () => {
    it('muestra únicamente los datos consolidados globales de la UGEL y no por director', () => {
      render(
        <DirectorDecisionesTab
          {...defaultProps}
          isUgelView={true}
          ugelName="Puno"
        />
      );

      // Cabecera ejecutiva adaptada a UGEL
      expect(
        screen.getByText(/Priorización pedagógica consolidada a nivel de la UGEL Puno/i)
      ).toBeInTheDocument();

      // Indicador de Rezago UGEL en KPI
      expect(screen.getByText('Rezago UGEL')).toBeInTheDocument();

      // Cabecera de tabla
      expect(screen.getByText('Ámbito / Consolidado')).toBeInTheDocument();

      // Fila única consolidada de la UGEL
      expect(screen.getByText('Consolidado UGEL Puno')).toBeInTheDocument();
      expect(screen.getByText(/estudiantes evaluados en la UGEL/i)).toBeInTheDocument();

      // NO debe mostrar dropdown de filtrar aula
      expect(screen.queryByText('Filtrar aula:')).not.toBeInTheDocument();

      // NO debe listar las secciones individuales de colegios como filas separadas
      expect(screen.queryByText('Sección A')).not.toBeInTheDocument();
      expect(screen.queryByText('Sección B')).not.toBeInTheDocument();
    });
  });
});
