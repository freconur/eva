import React from 'react';
import { render, screen } from '@testing-library/react';

jest.mock('@/firebase/firebase.config', () => ({
  db: {},
}));

// Mock de @react-pdf/renderer para entorno Jest jsdom
jest.mock('@react-pdf/renderer', () => {
  const React = require('react');
  return {
    Document: ({ children }: any) => <div data-testid="pdf-document">{children}</div>,
    Page: ({ children, wrap }: any) => (
      <div data-testid="pdf-page" data-wrap={String(wrap)}>
        {children}
      </div>
    ),
    View: ({ children, wrap }: any) => (
      <div data-testid="pdf-view" data-wrap={String(wrap)}>
        {children}
      </div>
    ),
    Text: ({ children }: any) => <span data-testid="pdf-text">{children}</span>,
    Svg: ({ children, viewBox }: any) => (
      <svg data-testid="pdf-svg" viewBox={viewBox}>
        {children}
      </svg>
    ),
    Polygon: (props: any) => <polygon data-testid="pdf-polygon" {...props} />,
    Circle: (props: any) => <circle data-testid="pdf-circle" {...props} />,
    Line: (props: any) => <line data-testid="pdf-line" {...props} />,
    Rect: (props: any) => <rect data-testid="pdf-rect" {...props} />,
    Path: (props: any) => <path data-testid="pdf-path" {...props} />,
    Image: (props: any) => <img data-testid="pdf-image" {...props} />,
    StyleSheet: {
      create: (styles: any) => styles,
    },
    pdf: jest.fn(() => ({
      toBlob: jest.fn(
        async () => new Blob(['%PDF-1.4 mock content'], { type: 'application/pdf' })
      ),
    })),
  };
});

import {
  wrapTextForPdf,
  calibratePdfColumnMetrics,
  isStudentEvaluatedInStage,
  formatEtapaConfigName,
  resolveMesTexto,
  RadarEvaluacionesLegendPDF,
  exportarFichaEvolutivaEstudiantePDF,
  exportarFichaEvolutivaConsolidadoPDF,
  FichaEvolutivaEstudiantePDFDocument,
  FichaEvolutivaConsolidadoPDFDocument,
  EstudianteEvolutivoPDFProps,
} from '../exportarFichaEvolutivaEstudiantePDF';
import {
  saveStoredCardAdjustments,
  clearStoredCardAdjustments,
} from '@/components/reportes/estudiante/DocenteActuacionesRadarChart';

describe('exportarFichaEvolutivaEstudiantePDF', () => {
  const mockProps: EstudianteEvolutivoPDFProps = {
    estudiante: {
      dni: '71234567',
      nombres: 'JUAN CARLOS',
      apellidos: 'QUISPE PÉREZ',
      seccion: 'A',
      genero: 'M',
    },
    evaluacionActual: {
      nombre: 'Evaluación Formativa Primaria',
      grado: 4,
      añoDelExamen: 2026,
      mesDelExamen: 11,
    },
    nombreDocente: 'Prof. Mario Vargas',
    nombreColegio: 'I.E. San Martín de Porres',
    historialEtapas: [
      {
        etapaKey: 'edi',
        label: 'EDI (Diagnóstica)',
        nombreEvaluacion: 'Prueba de Entrada',
        puntaje: 12,
        maxPuntaje: 20,
        nivel: 'En Proceso',
        nivelColor: '#d97706',
        respuestasCorrectas: 6,
        totalPreguntas: 10,
        porcentaje: 60,
      },
      {
        etapaKey: 'ep1',
        label: 'EP1 (Progresiva 1)',
        nombreEvaluacion: 'Evaluación Formativa Intermedia',
        puntaje: 16,
        maxPuntaje: 20,
        nivel: 'Satisfactorio',
        nivelColor: '#10b981',
        respuestasCorrectas: 8,
        totalPreguntas: 10,
        porcentaje: 80,
      },
    ],
    deltaPuntaje: 4,
    estadoTrayectoria: 'superacion',
    promedioAula: 13.5,
    diferenciaConAula: 2.5,
    catalogoActuaciones: [
      { order: 1, actuacion: 'Infiere e interpreta información del texto escrito' },
      { order: 2, actuacion: 'Obtiene información explícita del texto' },
      { order: 3, actuacion: 'Adecúa el texto a la situación comunicativa' },
    ],
    etapasConfiguradas: [
      { key: 'edi', id: 'eval-edi', label: 'EDI (Diagnóstica)', order: 1 },
      { key: 'ep1', id: 'eval-ep1', label: 'EP1 (Progresiva 1)', order: 2 },
    ],
    studentEtapas: {
      edi: {
        etapaKey: 'edi',
        label: 'EDI (Diagnóstica)',
        puntaje: 12,
        actuacionesResultados: { 1: 1, 2: 2, 3: 1 },
      },
      ep1: {
        etapaKey: 'ep1',
        label: 'EP1 (Progresiva 1)',
        puntaje: 16,
        actuacionesResultados: { 1: 2, 2: 2, 3: 2 },
      },
    },
    activeStages: { edi: true, ep1: true },
  };

  describe('wrapTextForPdf (Word Wrap Inteligente)', () => {
    it('mantiene en una sola línea textos cortos', () => {
      const lines = wrapTextForPdf(1, 'Infiere datos', 3);
      expect(lines).toEqual(['1. Infiere datos']);
    });

    it('divide frases largas en múltiples renglones sin truncar palabras', () => {
      const lines = wrapTextForPdf(
        2,
        'Organiza y desarrolla las ideas de forma coherente y cohesionada',
        5
      );
      expect(lines.length).toBeGreaterThan(1);
      expect(lines[0].startsWith('2. ')).toBe(true);
      const fullJoined = lines.join(' ');
      expect(fullJoined).toContain('coherente');
      expect(fullJoined).toContain('cohesionada');
    });

    it('maneja textos vacíos o nulos asignando texto por defecto', () => {
      const lines = wrapTextForPdf(5, undefined, 4);
      expect(lines).toEqual(['5. Actuación 5']);
    });
  });

  describe('calibratePdfColumnMetrics (Autoajuste dinámico de espacio)', () => {
    it('calibra fuentes más grandes y cómodas cuando hay pocas actuaciones', () => {
      const left = [{ order: 1, actuacion: 'Corta 1' }];
      const right = [{ order: 2, actuacion: 'Corta 2' }];
      const result = calibratePdfColumnMetrics(left, right);

      expect(result.cardFontSize).toBeGreaterThanOrEqual(8.0);
      expect(result.estimatedH).toBeLessThanOrEqual(515);
    });

    it('calibra fuentes compactas y padding reducido cuando hay alta densidad de texto para no desbordar', () => {
      const longText =
        'Establece relaciones entre los datos y condiciones de situaciones vinculadas a una igualdad entre dos cantidades. Las transforma a expresiones numéricas (gráficas o simbólicas) que involucran el planteamiento de una ecuación de primer grado.';
      const denseItems = Array.from({ length: 14 }, (_, i) => ({
        order: i + 1,
        actuacion: longText,
      }));

      const result = calibratePdfColumnMetrics(denseItems, denseItems);

      expect(result.cardFontSize).toBeLessThanOrEqual(7.0);
      expect(result.cardPadY).toBeLessThan(3.0);
      expect(result.estimatedH).toBeLessThanOrEqual(365);
    });
  });

  describe('FichaEvolutivaEstudiantePDFDocument', () => {
    it('renderiza correctamente el documento PDF horizontal a página completa dedicado al gráfico y actuaciones', () => {
      render(<FichaEvolutivaEstudiantePDFDocument {...mockProps} />);

      expect(screen.getByTestId('pdf-document')).toBeInTheDocument();
      const page = screen.getByTestId('pdf-page');
      expect(page).toBeInTheDocument();
      expect(page).toHaveAttribute('data-wrap', 'false');
      // Ya no muestra cabecera azul ni resumen inferior para maximizar el espacio del gráfico
      expect(
        screen.queryByText('SISTEMA EVA - MAPA RETICULAR DE ACTUACIONES PEDAGÓGICAS')
      ).toBeNull();
      expect(screen.queryByText('EDI (Diagnóstica):')).toBeNull();
    });

    it('renderiza el gráfico reticular vectorial nativo (SVG, círculos, líneas y polígonos)', () => {
      // Modo Columnas (Diseño 2 por defecto): radar central numerado con columnas laterales
      const { rerender } = render(<FichaEvolutivaEstudiantePDFDocument {...mockProps} />);

      const svgs = screen.getAllByTestId('pdf-svg');
      expect(svgs.length).toBeGreaterThanOrEqual(1);

      const polygons = screen.getAllByTestId('pdf-polygon');
      // Debe haber al menos 2 polígonos correspondientes a EDI y EP1
      expect(polygons.length).toBeGreaterThanOrEqual(2);

      const circles = screen.getAllByTestId('pdf-circle');
      // Círculos concéntricos, vértices y badges numéricos exteriores
      expect(circles.length).toBeGreaterThan(5);

      const lines = screen.getAllByTestId('pdf-line');
      expect(lines.length).toBeGreaterThan(3);

      // Verificamos que las actuaciones estén en las columnas laterales
      expect(screen.getByText('ACTUACIONES 3 - 3 (IZQUIERDA)')).toBeInTheDocument();
      expect(screen.getByText('ACTUACIONES 1 - 2 (DERECHA)')).toBeInTheDocument();

      // Modo Flotante (Diseño 1): red panorámica con cajas callout (rects) y líneas guía
      rerender(
        <FichaEvolutivaEstudiantePDFDocument {...mockProps} chartLayoutMode="flotante" />
      );
      const rects = screen.getAllByTestId('pdf-rect');
      expect(rects.length).toBe(mockProps.catalogoActuaciones!.length);
    });

    it('aplica las personalizaciones de posición (dx, dy) y dimensiones (customW, customH) en el PDF flotante', () => {
      // Obtenemos dimensiones sin ajustes
      const { rerender } = render(
        <FichaEvolutivaEstudiantePDFDocument {...mockProps} chartLayoutMode="flotante" />
      );
      const rect1Before = screen.getAllByTestId('pdf-rect')[0];
      const xBefore = parseFloat(rect1Before.getAttribute('x') || '0');
      const yBefore = parseFloat(rect1Before.getAttribute('y') || '0');
      const wBefore = parseFloat(rect1Before.getAttribute('width') || '0');
      const hBefore = parseFloat(rect1Before.getAttribute('height') || '0');

      // Pasamos ajustes personalizados
      const customAdjustments = {
        1: { dx: 100, dy: 50, customW: 300, customH: 70 },
      };

      rerender(
        <FichaEvolutivaEstudiantePDFDocument
          {...mockProps}
          chartLayoutMode="flotante"
          cardAdjustments={customAdjustments}
        />
      );

      const rect1After = screen.getAllByTestId('pdf-rect')[0];
      const xAfter = parseFloat(rect1After.getAttribute('x') || '0');
      const yAfter = parseFloat(rect1After.getAttribute('y') || '0');
      const wAfter = parseFloat(rect1After.getAttribute('width') || '0');
      const hAfter = parseFloat(rect1After.getAttribute('height') || '0');

      expect(xAfter).not.toBe(xBefore);
      expect(yAfter).not.toBe(yBefore);
      expect(wAfter).toBeGreaterThan(wBefore);
      expect(hAfter).toBeGreaterThan(hBefore);
    });

    it('proyecta con precisión las coordenadas absolutas (x, y) de la web al PDF, logrando una columna vertical recta perfecta entre múltiples tarjetas', () => {
      // Configuramos dos tarjetas (1 y 2) alineadas verticalmente en el mismo X en el espacio Web
      const alignedWebX = 1200;
      const customAdjustments = {
        1: { dx: 100, dy: 20, x: alignedWebX, y: 150, customW: 200, customH: 45 },
        2: { dx: -50, dy: 60, x: alignedWebX, y: 220, customW: 200, customH: 45 },
      };

      render(
        <FichaEvolutivaEstudiantePDFDocument
          {...mockProps}
          chartLayoutMode="flotante"
          cardAdjustments={customAdjustments}
        />
      );

      const rects = screen.getAllByTestId('pdf-rect');
      const rect1X = parseFloat(rects[0].getAttribute('x') || '0');
      const rect2X = parseFloat(rects[1].getAttribute('x') || '0');

      // Ambas tarjetas deben compartir exactamente la misma coordenada X en el PDF, formando una columna vertical perfecta
      expect(rect1X).toBe(rect2X);
      expect(rect1X).toBeGreaterThan(480); // Lado derecho del radar
    });

    it('separa verticalmente actuaciones consecutivas en la misma columna para evitar que se toquen o solapen en el PDF', () => {
      // Configuramos dos tarjetas en la misma columna X donde la segunda inicialmente solaparía a la primera
      const alignedWebX = 1200;
      const overlappingAdjustments = {
        1: { dx: 100, dy: 20, x: alignedWebX, y: 150, customW: 200, customH: 45 },
        2: { dx: 100, dy: 20, x: alignedWebX, y: 155, customW: 200, customH: 45 }, // muy cerca en Y
      };

      render(
        <FichaEvolutivaEstudiantePDFDocument
          {...mockProps}
          chartLayoutMode="flotante"
          cardAdjustments={overlappingAdjustments}
        />
      );

      const rects = screen.getAllByTestId('pdf-rect');
      const rect1Y = parseFloat(rects[0].getAttribute('y') || '0');
      const rect1H = parseFloat(rects[0].getAttribute('height') || '0');
      const rect2Y = parseFloat(rects[1].getAttribute('y') || '0');

      // La segunda tarjeta debe haber sido empujada hacia abajo garantizando separación clara (al menos 6 unidades)
      expect(rect2Y).toBeGreaterThanOrEqual(rect1Y + rect1H + 6);
    });

    it('recupera automáticamente los ajustes desde localStorage para N actuaciones si no se pasan explícitamente', () => {
      localStorage.clear();
      const n = mockProps.catalogoActuaciones!.length;
      saveStoredCardAdjustments(n, {
        1: { dx: 80, dy: 40, customW: 280, customH: 60 },
      });

      render(
        <FichaEvolutivaEstudiantePDFDocument {...mockProps} chartLayoutMode="flotante" />
      );

      const rect1 = screen.getAllByTestId('pdf-rect')[0];
      const w = parseFloat(rect1.getAttribute('width') || '0');
      const h = parseFloat(rect1.getAttribute('height') || '0');

      // Ancho escalado al canvas PDF (280 * 1000 / 1680 = 167)
      expect(w).toBe(Math.round((280 * 1000) / 1680));
      expect(h).toBeGreaterThan(20);

      clearStoredCardAdjustments(n);
    });

    it('en diseño flotante, cuando splitInTwo es true usa solo el algoritmo e ignora ajustes locales', () => {
      localStorage.clear();
      const mockCatalogo4 = [
        { order: 1, actuacion: 'Actuación 1' },
        { order: 2, actuacion: 'Actuación 2' },
        { order: 3, actuacion: 'Actuación 3' },
        { order: 4, actuacion: 'Actuación 4' },
      ];
      saveStoredCardAdjustments(4, {
        1: { dx: 80, dy: 40, customW: 400, customH: 120 },
      });

      render(
        <FichaEvolutivaEstudiantePDFDocument
          {...mockProps}
          catalogoActuaciones={mockCatalogo4}
          chartLayoutMode="flotante"
          splitInTwo={true}
        />
      );

      const rect1 = screen.getAllByTestId('pdf-rect')[0];
      const w = parseFloat(rect1.getAttribute('width') || '0');
      // No debe ser el ancho escalado de customW=400 (400*1000/1680 = 238), sino el tamaño algorítmico estándar (< 238)
      expect(w).toBeLessThan(238);

      clearStoredCardAdjustments(4);
    });

    it('soporta casos donde no hay actuaciones pedagógicas registradas', () => {
      const propsSinActuaciones = {
        ...mockProps,
        catalogoActuaciones: [],
      };
      render(<FichaEvolutivaEstudiantePDFDocument {...propsSinActuaciones} />);

      // No debe haber polígonos del gráfico radar
      expect(screen.queryByTestId('pdf-polygon')).toBeNull();
      expect(
        screen.getByText('No se registraron actuaciones pedagógicas para esta evaluación.')
      ).toBeInTheDocument();
    });

    it('renderiza la cabecera sobria de datos y fotos carnet para estudiante y docente', () => {
      render(<FichaEvolutivaEstudiantePDFDocument {...mockProps} />);

      expect(screen.getByText('Estudiante:')).toBeInTheDocument();
      expect(screen.getByText('JUAN CARLOS QUISPE PÉREZ')).toBeInTheDocument();
      expect(screen.getByText('Docente:')).toBeInTheDocument();
      expect(screen.getByText('Prof. Mario Vargas')).toBeInTheDocument();
      expect(screen.getByText('I.E. San Martín de Porres')).toBeInTheDocument();
      expect(screen.getAllByText(/FOTO CARNET/i).length).toBe(2);
      expect(screen.getAllByText(/2.5 × 3.0 cm/).length).toBe(2);
    });

    it('renderiza dos páginas de PDF cuando splitInTwo es true para diseño columnas o flotante', () => {
      const mockCatalogo4 = [
        { order: 1, actuacion: 'Actuación 1' },
        { order: 2, actuacion: 'Actuación 2' },
        { order: 3, actuacion: 'Actuación 3' },
        { order: 4, actuacion: 'Actuación 4' },
      ];

      // Caso 1: Columnas con splitInTwo = true -> 2 páginas
      const { unmount: unmount1 } = render(
        <FichaEvolutivaEstudiantePDFDocument
          {...mockProps}
          catalogoActuaciones={mockCatalogo4}
          chartLayoutMode="columnas"
          splitInTwo={true}
        />
      );
      expect(screen.getAllByTestId('pdf-page').length).toBe(2);
      expect(screen.getByText(/Parte 1 de 2: Actuaciones 1 - 2/i)).toBeInTheDocument();
      expect(screen.getByText(/Parte 2 de 2: Actuaciones 3 - 4/i)).toBeInTheDocument();
      unmount1();

      // Caso 2: Flotante con splitInTwo = true -> 2 páginas
      const { unmount: unmount2 } = render(
        <FichaEvolutivaEstudiantePDFDocument
          {...mockProps}
          catalogoActuaciones={mockCatalogo4}
          chartLayoutMode="flotante"
          splitInTwo={true}
        />
      );
      expect(screen.getAllByTestId('pdf-page').length).toBe(2);
      expect(screen.getByText(/Parte 1 de 2: Actuaciones 1 - 2/i)).toBeInTheDocument();
      expect(screen.getByText(/Parte 2 de 2: Actuaciones 3 - 4/i)).toBeInTheDocument();
      unmount2();

      // Caso 3: Columnas con splitInTwo = false -> 1 página
      const { unmount: unmount3 } = render(
        <FichaEvolutivaEstudiantePDFDocument
          {...mockProps}
          catalogoActuaciones={mockCatalogo4}
          chartLayoutMode="columnas"
          splitInTwo={false}
        />
      );
      expect(screen.getAllByTestId('pdf-page').length).toBe(1);
      unmount3();

      // Caso 4: Flotante con splitInTwo = false -> 1 página
      render(
        <FichaEvolutivaEstudiantePDFDocument
          {...mockProps}
          catalogoActuaciones={mockCatalogo4}
          chartLayoutMode="flotante"
          splitInTwo={false}
        />
      );
      expect(screen.getAllByTestId('pdf-page').length).toBe(1);
    });

    it('renderiza en la parte baja la leyenda con rectángulos de color solo de las evaluaciones rendidas y nombres de configuración con mes', () => {
      // Configuramos 3 etapas activas: EDI, EP1, EP2
      const etapas3 = [
        { key: 'edi', id: 'e-edi', label: 'EDI (Diagnóstica)', order: 1 },
        { key: 'ep1', id: 'e-ep1', label: 'EP1 (Progresiva 1)', order: 2 },
        { key: 'ep2', id: 'e-ep2', label: 'EP2 (Progresiva 2)', order: 3 },
      ];

      // El estudiante SOLO rindió EDI y EP1 (EP2 no fue evaluado)
      const propsSinEp2: EstudianteEvolutivoPDFProps = {
        ...mockProps,
        etapasConfiguradas: etapas3,
        activeStages: { edi: true, ep1: true, ep2: true },
        historialEtapas: [
          {
            etapaKey: 'edi',
            label: 'EDI (Diagnóstica)',
            nombreEvaluacion: 'Prueba de Entrada Diagnóstica',
            fecha: 'Marzo',
            puntaje: 14,
            maxPuntaje: 20,
            nivel: 'En Proceso',
            respuestasCorrectas: 7,
            totalPreguntas: 10,
            porcentaje: 70,
          },
          {
            etapaKey: 'ep1',
            label: 'EP1 (Progresiva 1)',
            nombreEvaluacion: 'Evaluación Formativa Progresiva 1',
            fecha: 'Julio',
            puntaje: 18,
            maxPuntaje: 20,
            nivel: 'Satisfactorio',
            respuestasCorrectas: 9,
            totalPreguntas: 10,
            porcentaje: 90,
          },
        ],
        studentEtapas: {
          edi: {
            etapaKey: 'edi',
            label: 'EDI (Diagnóstica)',
            puntaje: 14,
            actuacionesResultados: { 1: 2, 2: 2 },
          },
          ep1: {
            etapaKey: 'ep1',
            label: 'EP1 (Progresiva 1)',
            puntaje: 18,
            actuacionesResultados: { 1: 2, 2: 2 },
          },
          // ep2 no está presente (el estudiante no fue evaluado)
        },
        chartLayoutMode: 'flotante',
      };

      const { unmount } = render(<FichaEvolutivaEstudiantePDFDocument {...propsSinEp2} />);

      // Debe mostrar los nombres de configuración con sus respectivos meses
      expect(screen.getByText('Evaluación Diagnóstica (Marzo)')).toBeInTheDocument();
      expect(screen.getByText('Evaluación Progresiva 1 (Julio)')).toBeInTheDocument();

      // En la leyenda inferior NO debe mostrar la Evaluación Progresiva 2 porque el estudiante no fue evaluado en ella
      expect(screen.queryByText(/Progresiva 2/i)).not.toBeInTheDocument();
      expect(screen.queryByText('Evaluación Progresiva 2 (Noviembre)')).not.toBeInTheDocument();

      // En la cabecera, la mini-tabla muestra todas las etapas con sus aciertos/puntajes y guión para las no evaluadas
      expect(screen.getByText('EDI')).toBeInTheDocument();
      expect(screen.getByText('EP1')).toBeInTheDocument();
      expect(screen.getByText('EP2')).toBeInTheDocument();
      expect(screen.getAllByText('2/3').length).toBe(2);
      expect(screen.getAllByText('67% aciertos').length).toBe(2);
      expect(screen.getAllByText('—').length).toBeGreaterThanOrEqual(2);
      unmount();

      // También debe funcionar en diseño Columnas
      render(
        <FichaEvolutivaEstudiantePDFDocument
          {...propsSinEp2}
          chartLayoutMode="columnas"
        />
      );
      expect(screen.getByText('Evaluación Diagnóstica (Marzo)')).toBeInTheDocument();
      expect(screen.getByText('Evaluación Progresiva 1 (Julio)')).toBeInTheDocument();
      expect(screen.queryByText(/Progresiva 2/i)).not.toBeInTheDocument();
    });
  });

  describe('isStudentEvaluatedInStage y RadarEvaluacionesLegendPDF', () => {
    it('isStudentEvaluatedInStage reconoce etapas rendidas y no rendidas', () => {
      const studentEtapas = {
        edi: { etapaKey: 'edi', label: 'EDI', puntaje: 10 },
      };
      const historial = [
        {
          etapaKey: 'edi',
          label: 'EDI',
          nombreEvaluacion: 'Diagnóstica',
          puntaje: 10,
          maxPuntaje: 20,
          nivel: 'Inicio',
          respuestasCorrectas: 5,
          totalPreguntas: 10,
          porcentaje: 50,
        },
      ];

      expect(isStudentEvaluatedInStage('edi', studentEtapas, historial)).toBe(true);
      expect(isStudentEvaluatedInStage('ep1', studentEtapas, historial)).toBe(false);
      expect(isStudentEvaluatedInStage('ep2', studentEtapas, historial)).toBe(false);
    });

    it('formatEtapaConfigName y resolveMesTexto formatean correctamente las leyendas', () => {
      expect(formatEtapaConfigName('edi', 'EDI (Diagnóstica)', 'Marzo')).toBe(
        'Evaluación Diagnóstica (Marzo)'
      );
      expect(formatEtapaConfigName('ep1', 'EP1 (Progresiva 1)', 'Julio')).toBe(
        'Evaluación Progresiva 1 (Julio)'
      );
      expect(formatEtapaConfigName('ep2', 'EP2 (Progresiva 2)', 'Noviembre')).toBe(
        'Evaluación Progresiva 2 (Noviembre)'
      );
      expect(formatEtapaConfigName('edi', 'EDI (Diagnóstica)', undefined)).toBe(
        'Evaluación Diagnóstica'
      );

      // Conversión de números de mes
      expect(resolveMesTexto(2)).toBe('Marzo');
      expect(resolveMesTexto('Julio')).toBe('Julio');
      expect(resolveMesTexto(10)).toBe('Noviembre');
    });

    it('RadarEvaluacionesLegendPDF renderiza nombres de configuración con mes solo para etapas evaluadas', () => {
      const activeEtapas = [
        { key: 'edi', label: 'EDI (Diagnóstica)', order: 1 },
        { key: 'ep1', label: 'EP1 (Progresiva 1)', order: 2 },
      ];
      const studentEtapas = {
        edi: { etapaKey: 'edi', label: 'EDI (Diagnóstica)', puntaje: 12 },
      };
      const historial = [
        {
          etapaKey: 'edi',
          label: 'EDI (Diagnóstica)',
          fecha: 'Marzo',
          puntaje: 12,
          maxPuntaje: 20,
          nivel: 'Proceso',
          respuestasCorrectas: 6,
          totalPreguntas: 10,
          porcentaje: 60,
        },
      ];

      const { unmount } = render(
        <RadarEvaluacionesLegendPDF
          activeEtapasList={activeEtapas}
          studentEtapas={studentEtapas}
          historialEtapas={historial}
        />
      );

      expect(screen.getByText('Evaluación Diagnóstica (Marzo)')).toBeInTheDocument();
      expect(screen.queryByText(/Progresiva 1/i)).not.toBeInTheDocument();
      unmount();

      // Si no fue evaluado en ninguna, retorna null
      const { container } = render(
        <RadarEvaluacionesLegendPDF
          activeEtapasList={activeEtapas}
          studentEtapas={{}}
          historialEtapas={[]}
        />
      );
      expect(container.firstChild).toBeNull();
    });
  });

  describe('exportarFichaEvolutivaEstudiantePDF y exportarFichaEvolutivaConsolidadoPDF', () => {
    it('compila y retorna un Blob de PDF válido y activa la descarga individual', async () => {
      // Mock de URL.createObjectURL y revokeObjectURL
      const mockCreateObjectURL = jest.fn(() => 'blob:mock-url');
      const mockRevokeObjectURL = jest.fn();
      window.URL.createObjectURL = mockCreateObjectURL;
      window.URL.revokeObjectURL = mockRevokeObjectURL;

      const blob = await exportarFichaEvolutivaEstudiantePDF(mockProps);

      expect(blob).toBeDefined();
      expect(blob instanceof Blob).toBe(true);
      expect(mockCreateObjectURL).toHaveBeenCalled();
    });

    it('FichaEvolutivaConsolidadoPDFDocument renderiza a todos los estudiantes en un único PDF', () => {
      const student1: EstudianteEvolutivoPDFProps = {
        ...mockProps,
        estudiante: {
          ...mockProps.estudiante,
          dni: '11111111',
          nombres: 'ANA LUCÍA',
          apellidos: 'GARCÍA',
        },
      };

      const student2: EstudianteEvolutivoPDFProps = {
        ...mockProps,
        estudiante: {
          ...mockProps.estudiante,
          dni: '22222222',
          nombres: 'BETHOVEN',
          apellidos: 'MENDOZA',
        },
      };

      render(
        <FichaEvolutivaConsolidadoPDFDocument estudiantes={[student1, student2]} />
      );

      // Un solo documento pero con 2 páginas (una por estudiante)
      expect(screen.getByTestId('pdf-document')).toBeInTheDocument();
      expect(screen.getAllByTestId('pdf-page').length).toBe(2);

      // Ambos estudiantes deben estar presentes en el PDF consolidado
      expect(screen.getByText('ANA LUCÍA GARCÍA')).toBeInTheDocument();
      expect(screen.getByText('BETHOVEN MENDOZA')).toBeInTheDocument();
    });

    it('exportarFichaEvolutivaConsolidadoPDF compila y activa la descarga del consolidado', async () => {
      const mockCreateObjectURL = jest.fn(() => 'blob:mock-url-consolidado');
      const mockRevokeObjectURL = jest.fn();
      window.URL.createObjectURL = mockCreateObjectURL;
      window.URL.revokeObjectURL = mockRevokeObjectURL;

      const blob = await exportarFichaEvolutivaConsolidadoPDF([mockProps], 'Consolidado_Test.pdf');

      expect(blob).toBeDefined();
      expect(blob instanceof Blob).toBe(true);
      expect(mockCreateObjectURL).toHaveBeenCalled();
    });

    it('exportarFichaEvolutivaConsolidadoPDF lanza un error si la lista está vacía', async () => {
      await expect(exportarFichaEvolutivaConsolidadoPDF([])).rejects.toThrow(
        'No hay estudiantes para exportar en el consolidado.'
      );
    });
  });
});
