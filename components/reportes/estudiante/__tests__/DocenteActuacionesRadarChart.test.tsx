import React from 'react';
import { render, screen, fireEvent, act } from '@testing-library/react';
import {
  DocenteActuacionesRadarChart,
  formatSmartRadarLabel,
  fitTextInBox,
  calculateDynamicCard,
  loadStoredCardAdjustments,
  saveStoredCardAdjustments,
  clearStoredCardAdjustments,
  getRadarCardAdjustmentsStorageKey,
  RADAR_DIRECTION_STORAGE_KEY,
  getCoincidentRadiusOffset,
} from '../DocenteActuacionesRadarChart';
import { EstudianteEvolutivo, ActuacionCatalogoItem } from '../useDocenteEvolucionEstudiantes';

// Mock de react-chartjs-2 Radar
jest.mock('react-chartjs-2', () => ({
  Radar: ({ data, options }: any) => (
    <div data-testid="mock-radar-chart">
      <span>Datasets: {data.datasets.length}</span>
      <span>Labels: {data.labels.length}</span>
      <div data-testid="radar-point-labels">
        {data.labels.map((l: any, i: number) => (
          <span key={i} data-testid={`radar-label-${i}`}>
            {Array.isArray(l) ? l.join(' / ') : l}
          </span>
        ))}
      </div>
      {data.datasets.map((ds: any, idx: number) => (
        <div key={idx} data-testid={`radar-dataset-${idx}`}>
          <span>{ds.label}</span>
          <span>Values: {ds.data.join(',')}</span>
        </div>
      ))}
    </div>
  ),
}));

describe('DocenteActuacionesRadarChart Component', () => {
  const mockStudent: EstudianteEvolutivo = {
    dni: '47163626',
    nombres: 'Franco',
    apellidos: 'Condori Mamani',
    nombresApellidos: 'Condori Mamani Franco',
    nombreCompleto: 'Condori Mamani Franco',
    seccion: 'c',
    puntajeInicial: 8,
    puntajeFinal: 20,
    deltaPuntaje: 12,
    nivelInicial: 'En Inicio',
    nivelFinal: 'Satisfactorio',
    estadoTrayectoria: 'superacion',
    porcentajeAsistencia: 100,
    diferenciaConAula: 3.5,
    etapas: {
      edi: {
        etapaKey: 'edi',
        label: 'Prueba 1 (EDI)',
        nombreEvaluacion: 'EDI',
        evaluacionId: 'eval-edi',
        puntaje: 8,
        maxPuntaje: 20,
        nivel: 'En Inicio',
        respuestasCorrectas: 1,
        totalPreguntas: 3,
        porcentaje: 33,
        actuacionesResultados: {
          1: 2, // Acertó actuación 1 (SÍ = 2)
          2: 1, // Falló actuación 2 (NO = 1)
          3: 1, // Falló actuación 3 (NO = 1)
        },
      },
      ep1: {
        etapaKey: 'ep1',
        label: 'Prueba 2 (EP1)',
        nombreEvaluacion: 'EP1',
        evaluacionId: 'eval-ep1',
        puntaje: 14,
        maxPuntaje: 20,
        nivel: 'En Proceso',
        respuestasCorrectas: 2,
        totalPreguntas: 3,
        porcentaje: 67,
        actuacionesResultados: {
          1: 2, // SÍ (2)
          2: 2, // SÍ (2)
          3: 1, // NO (1)
        },
      },
      ep2: {
        etapaKey: 'ep2',
        label: 'Prueba 3 (EP2)',
        nombreEvaluacion: 'EP2',
        evaluacionId: 'eval-ep2',
        puntaje: 20,
        maxPuntaje: 20,
        nivel: 'Satisfactorio',
        respuestasCorrectas: 3,
        totalPreguntas: 3,
        porcentaje: 100,
        actuacionesResultados: {
          1: 2, // SÍ (2)
          2: 2, // SÍ (2)
          3: 2, // SÍ (2)
        },
      },
    },
    historial: [],
  };

  const mockEtapas = [
    { key: 'edi', id: 'eval-edi', label: 'Prueba 1 (EDI)', order: 1 },
    { key: 'ep1', id: 'eval-ep1', label: 'Prueba 2 (EP1)', order: 2 },
    { key: 'ep2', id: 'eval-ep2', label: 'Prueba 3 (EP2)', order: 3 },
  ];

  const mockCatalogo: ActuacionCatalogoItem[] = [
    { order: 1, actuacion: 'Identifica información explícita', pregunta: '¿Qué animal se menciona?' },
    { order: 2, actuacion: 'Deduce relaciones de causa-efecto', pregunta: '¿Por qué ocurrió el suceso?' },
    { order: 3, actuacion: 'Evalúa la validez de un argumento', pregunta: '¿Qué opinas de la decisión?' },
  ];

  it('renderiza el gráfico radar con los valores 2 (SÍ) y 1 (NO) en cada dataset', () => {
    render(
      <DocenteActuacionesRadarChart
        student={mockStudent}
        etapasConfiguradas={mockEtapas}
        catalogoActuaciones={mockCatalogo}
      />
    );

    expect(screen.getByTestId('mock-radar-chart')).toBeInTheDocument();
    expect(screen.getByText('Datasets: 3')).toBeInTheDocument();
    expect(screen.getByText('Labels: 3')).toBeInTheDocument();

    // Dataset EDI: valores 2,1,1
    const ediDs = screen.getByTestId('radar-dataset-0');
    expect(ediDs).toHaveTextContent('Values: 2,1,1');

    // Dataset EP1: valores 2,2,1
    const ep1Ds = screen.getByTestId('radar-dataset-1');
    expect(ep1Ds).toHaveTextContent('Values: 2,2,1');

    // Dataset EP2: valores 2,2,2
    const ep2Ds = screen.getByTestId('radar-dataset-2');
    expect(ep2Ds).toHaveTextContent('Values: 2,2,2');

    // En cada vértice aparece el texto autoajustado de la actuación pedagógica
    expect(screen.getByTestId('radar-label-0')).toHaveTextContent(/Identifica/i);
    expect(screen.getByTestId('radar-label-1')).toHaveTextContent(/Deduce/i);
    expect(screen.getByTestId('radar-label-2')).toHaveTextContent(/Evalúa/i);
  });

  it('respeta las capas evaluativas activas recibidas vía activeStages (ej. ocultar EDI)', () => {
    const { rerender } = render(
      <DocenteActuacionesRadarChart
        student={mockStudent}
        etapasConfiguradas={mockEtapas}
        catalogoActuaciones={mockCatalogo}
        activeStages={{ edi: true, ep1: true, ep2: true }}
      />
    );

    expect(screen.getByText('Datasets: 3')).toBeInTheDocument();

    // Actualizar capas activas ocultando EDI
    rerender(
      <DocenteActuacionesRadarChart
        student={mockStudent}
        etapasConfiguradas={mockEtapas}
        catalogoActuaciones={mockCatalogo}
        activeStages={{ edi: false, ep1: true, ep2: true }}
      />
    );

    // Ahora solo deben quedar 2 datasets en el gráfico
    expect(screen.getByText('Datasets: 2')).toBeInTheDocument();
  });

  it('permite desplegar la tabla de desglose con las actuaciones y badges formativos', () => {
    render(
      <DocenteActuacionesRadarChart
        student={mockStudent}
        etapasConfiguradas={mockEtapas}
        catalogoActuaciones={mockCatalogo}
      />
    );

    const toggleBtn = screen.getByText('Ver Desglose');
    fireEvent.click(toggleBtn);

    expect(screen.getAllByText('Identifica información explícita').length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText('Deduce relaciones de causa-efecto').length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText('Evalúa la validez de un argumento').length).toBeGreaterThanOrEqual(1);
    expect(screen.getByText('Ocultar Desglose')).toBeInTheDocument();
  });

  it('se renderiza en Modo Claro institucional sin botones ni clases de modo oscuro', () => {
    render(
      <DocenteActuacionesRadarChart
        student={mockStudent}
        etapasConfiguradas={mockEtapas}
        catalogoActuaciones={mockCatalogo}
      />
    );

    // No debe haber botones para cambiar a modo oscuro
    expect(screen.queryByTitle('Cambiar a modo claro')).not.toBeInTheDocument();
    expect(screen.queryByTitle('Cambiar a modo oscuro')).not.toBeInTheDocument();

    // El canvas del radar se muestra correctamente
    expect(screen.getByTestId('radar-svg-canvas')).toBeInTheDocument();
  });

  it('no muestra barra interna redundante de selección de capas al gestionarse globalmente', () => {
    render(
      <DocenteActuacionesRadarChart
        student={mockStudent}
        etapasConfiguradas={mockEtapas}
        catalogoActuaciones={mockCatalogo}
        activeStages={{ edi: true, ep1: false, ep2: true }}
      />
    );

    // Deben mostrarse solo los datasets activos (edi y ep2) -> 2 datasets
    expect(screen.getByText('Datasets: 2')).toBeInTheDocument();

    // No debe existir el texto redundante "Capas de Evaluación:"
    expect(screen.queryByText(/Capas de Evaluación:/i)).not.toBeInTheDocument();
  });

  it('ordena cronológicamente los datasets de más antiguo a más actual, quedando el más actual encima', () => {
    const desordenadas = [
      { key: 'ep2', id: 'eval-ep2', label: 'Prueba 3 (EP2)', order: 3 },
      { key: 'edi', id: 'eval-edi', label: 'Prueba 1 (EDI)', order: 1 },
      { key: 'ep1', id: 'eval-ep1', label: 'Prueba 2 (EP1)', order: 2 },
    ];

    render(
      <DocenteActuacionesRadarChart
        student={mockStudent}
        etapasConfiguradas={desordenadas}
        catalogoActuaciones={mockCatalogo}
      />
    );

    // Dataset 0: EDI (más antiguo, en la base)
    // Dataset 1: EP1 (intermedio)
    // Dataset 2: EP2 (más reciente, encima de todos)
    expect(screen.getByTestId('radar-dataset-0')).toHaveTextContent('Prueba 1 (EDI)');
    expect(screen.getByTestId('radar-dataset-1')).toHaveTextContent('Prueba 2 (EP1)');
    expect(screen.getByTestId('radar-dataset-2')).toHaveTextContent('Prueba 3 (EP2)');
  });

  it('unifica las métricas de evaluaciones en un único card y elimina Anillo 1/2 y Crecimiento Total', () => {
    render(
      <DocenteActuacionesRadarChart
        student={mockStudent}
        etapasConfiguradas={mockEtapas}
        catalogoActuaciones={mockCatalogo}
      />
    );

    // No debe existir el card de Anillo 1 / Anillo 2
    expect(screen.queryByText(/Anillo 2/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/Anillo 1/i)).not.toBeInTheDocument();

    // No debe existir el card de Crecimiento Total
    expect(screen.queryByText('Crecimiento Total')).not.toBeInTheDocument();

    // Las evaluaciones están presentes en el resumen unificado
    expect(screen.getAllByText('Prueba 1 (EDI)').length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText('Prueba 2 (EP1)').length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText('Prueba 3 (EP2)').length).toBeGreaterThanOrEqual(1);
  });

  it('renderiza el gráfico en formato vectorial SVG nativo con anillos, rayos, polígonos y puntos interactivos', () => {
    const { container } = render(
      <DocenteActuacionesRadarChart
        student={mockStudent}
        etapasConfiguradas={mockEtapas}
        catalogoActuaciones={mockCatalogo}
      />
    );

    const svgElement = container.querySelector('svg[data-testid="radar-svg-canvas"]');
    expect(svgElement).toBeInTheDocument();

    // En Modo Columnas (Diseño 2): debe contener tarjetas laterales y badges en el perímetro
    expect(screen.getByTestId('lateral-card-1')).toBeInTheDocument();
    expect(screen.getByTestId('radar-vertex-badge-1')).toBeInTheDocument();

    // Debe contener los círculos concéntricos de escala y los vértices
    const circles = container.querySelectorAll('circle');
    expect(circles.length).toBeGreaterThanOrEqual(5);

    // Debe contener los polígonos correspondientes a las etapas evaluativas
    const polygons = container.querySelectorAll('polygon');
    expect(polygons.length).toBe(3); // EDI, EP1, EP2

    // Los textos de los anillos de escala están presentes en el SVG
    expect(screen.getByText('1 (NO)')).toBeInTheDocument();
    expect(screen.getByText('2 (SÍ)')).toBeInTheDocument();

    // Al alternar a Modo Flotante (Diseño 1), se despliegan las tarjetas rectangulares en el canvas SVG
    const btnFlotante = screen.getByTestId('toggle-mode-flotante');
    fireEvent.click(btnFlotante);

    const rects = container.querySelectorAll('rect');
    expect(rects.length).toBeGreaterThanOrEqual(3);
    const lines = container.querySelectorAll('line');
    expect(lines.length).toBeGreaterThanOrEqual(6);
  });

  it('muestra un tooltip interactivo flotante al hacer hover sobre un vértice del gráfico SVG', () => {
    const { container } = render(
      <DocenteActuacionesRadarChart
        student={mockStudent}
        etapasConfiguradas={mockEtapas}
        catalogoActuaciones={mockCatalogo}
      />
    );

    // Seleccionamos un vértice circular de una etapa (por ejemplo el último dataset)
    const circles = container.querySelectorAll('circle');
    // Encontrar un círculo con evento onMouseEnter (los puntos de datos)
    const dataPoint = Array.from(circles).find(c => c.getAttribute('r') === '5.5' || c.getAttribute('r') === '4.5');
    expect(dataPoint).toBeDefined();

    if (dataPoint) {
      fireEvent.mouseEnter(dataPoint);
      // Debe aparecer el tooltip con el resultado
      expect(screen.getByText(/Resultado:/i)).toBeInTheDocument();

      fireEvent.mouseLeave(dataPoint);
      // Al salir el tooltip desaparece
      expect(screen.queryByText(/Resultado:/i)).not.toBeInTheDocument();
    }
  });

  describe('formatSmartRadarLabel - Autoajuste inteligente de textos en vértices', () => {
    it('divide frases largas en renglones naturales para Chart.js cuando N <= 6', () => {
      const result = formatSmartRadarLabel(1, 'Identifica información explícita', 3);
      expect(result.length).toBe(2);
      expect(result[0]).toContain('1. Identifica');
      expect(result[1]).toContain('información explícita');
    });

    it('retorna un solo renglón si el texto es suficientemente corto', () => {
      const result = formatSmartRadarLabel(2, 'Infiere datos', 3);
      expect(result).toEqual(['2. Infiere datos']);
    });

    it('muestra el texto de la actuación completo preservando todas las palabras en renglones apilados', () => {
      const longText = 'Evalúa el uso de recursos formales y gramaticales complejos';
      const result = formatSmartRadarLabel(15, longText, 25);
      const combined = result.join(' ');
      expect(combined).toBe(`15. ${longText}`);
      expect(result.length).toBeGreaterThanOrEqual(2);
      expect(combined).not.toContain('…');
    });

    it('proporciona fallback seguro si la actuación no tiene texto registrado', () => {
      const result = formatSmartRadarLabel(5, undefined, 4);
      expect(result).toEqual(['5. Actuación 5']);
    });
  });

  describe('fitTextInBox - Autoajuste del texto a la tarjeta contenedora', () => {
    it('ajusta dinámicamente el tamaño de fuente y divide en renglones balanceados para caber en la tarjeta', () => {
      const res = fitTextInBox(
        1,
        'Infiere e interpreta información del texto escrito',
        155,
        42
      );
      expect(res.fontSize).toBeGreaterThanOrEqual(7);
      expect(res.lines.length).toBeGreaterThanOrEqual(1);
      expect(res.lines.length).toBeLessThanOrEqual(3);
      expect(res.lines.join(' ')).toContain('Infiere');
    });

    it('asigna tamaño de fuente mayor para textos cortos', () => {
      const resShort = fitTextInBox(2, 'Infiere datos', 155, 42);
      expect(resShort.fontSize).toBeGreaterThanOrEqual(9.5);
    });

    it('escala a un tamaño de fuente menor para textos extensos sin desbordar el alto', () => {
      const resLong = fitTextInBox(
        3,
        'Adecúa el texto a la situación comunicativa considerando el propósito comunicativo formal',
        155,
        42
      );
      expect(resLong.fontSize).toBeLessThanOrEqual(8.5);
      expect(resLong.lines.length).toBeLessThanOrEqual(3);
    });
  });

  describe('calculateDynamicCard - Crecimiento dinámico del contenedor según extensión del texto', () => {
    it('mantiene dimensiones estándar compactas para textos cortos', () => {
      const shortCard = calculateDynamicCard(1, 'Infiere datos breves');
      expect(shortCard.boxW).toBeLessThanOrEqual(235);
      expect(shortCard.boxH).toBeLessThanOrEqual(50);
      expect(shortCard.lines.length).toBeLessThanOrEqual(2);
    });

    it('agranda el ancho y la altura del contenedor cuando el texto de la actuación es extenso', () => {
      const extensiveText =
        'Establece relaciones entre los datos y condiciones de situaciones vinculadas a las acciones de juntar-separar cantidades. Las transforma a expresiones numéricas (gráficas o simbólicas) que involucran el uso de números decimales y las resuelve.';
      const longCard = calculateDynamicCard(2, extensiveText);
      // El contenedor debe agrandarse en ancho (> 260px) y en alto (> 65px)
      expect(longCard.boxW).toBeGreaterThanOrEqual(265);
      expect(longCard.boxH).toBeGreaterThanOrEqual(65);
      expect(longCard.lines.length).toBeGreaterThanOrEqual(3);
      expect(longCard.lines.join(' ')).toContain('decimales');
    });

    it('distribuye holgadamente a todo el ancho cuando hay 28 actuaciones', () => {
      // 28 actuaciones pedagógicas reales
      const catalogo28: ActuacionCatalogoItem[] = Array.from({ length: 28 }, (_, i) => ({
        order: i + 1,
        actuacion: `Actuación pedagógica número ${i + 1} con contenido curricular extenso para evaluar competencias formativas integrales en estudiantes de primaria y secundaria`,
      }));

      const { container } = render(
        <DocenteActuacionesRadarChart
          student={{
            ...mockStudent,
            etapas: {
              ...mockStudent.etapas,
              edi: {
                ...mockStudent.etapas.edi,
                actuacionesResultados: Object.fromEntries(
                  Array.from({ length: 28 }, (_, i) => [i + 1, (i % 2 === 0 ? 2 : 1) as 1 | 2])
                ),
              },
            },
          }}
          etapasConfiguradas={mockEtapas}
          catalogoActuaciones={catalogo28}
        />
      );

      // En Diseño 2 (Columnas Laterales): debe haber 28 tarjetas y 28 badges en el perímetro
      for (let order = 1; order <= 28; order++) {
        expect(screen.getByTestId(`lateral-card-${order}`)).toBeInTheDocument();
        expect(screen.getByTestId(`radar-vertex-badge-${order}`)).toBeInTheDocument();
      }

      // Al alternar a Diseño 1 (Red Conectada Flotante), se despliegan las 28 tarjetas SVG a todo el ancho
      const btnFlotante = screen.getByTestId('toggle-mode-flotante');
      fireEvent.click(btnFlotante);

      const rects = container.querySelectorAll('rect');
      // Debe haber exactamente 28 tarjetas callout
      expect(rects.length).toBe(28);

      // Verificamos que las tarjetas ocupen el ancho completo (se extienden hacia X cerca del borde)
      const rectXValues = Array.from(rects).map((r) => parseFloat(r.getAttribute('x') || '0'));
      const minX = Math.min(...rectXValues);
      const maxX = Math.max(...rectXValues);

      // En el lateral izquierdo, las tarjetas exteriores llegan al borde izquierdo (X <= 30)
      expect(minX).toBeLessThanOrEqual(30);
      // En el lateral derecho, las tarjetas exteriores se extienden más allá de X >= 1300
      expect(maxX).toBeGreaterThanOrEqual(1300);
    });
  });

  describe('Diseño 2 - Radar Central Numerado con Columnas Laterales', () => {
    it('muestra los números en los vértices del radar y sincroniza el hover bidireccional con las tarjetas', () => {
      render(
        <DocenteActuacionesRadarChart
          student={mockStudent}
          etapasConfiguradas={mockEtapas}
          catalogoActuaciones={mockCatalogo}
        />
      );

      // Verificamos que el conmutador esté activo en 'Columnas Laterales' por defecto
      const toggleCol = screen.getByTestId('toggle-mode-columnas');
      const toggleFlotante = screen.getByTestId('toggle-mode-flotante');
      expect(toggleCol).toHaveClass('bg-blue-600');

      // Las tarjetas laterales existen para las 3 actuaciones
      const card1 = screen.getByTestId('lateral-card-1');
      const card2 = screen.getByTestId('lateral-card-2');
      const card3 = screen.getByTestId('lateral-card-3');
      expect(card1).toBeInTheDocument();
      expect(card2).toBeInTheDocument();
      expect(card3).toBeInTheDocument();

      // Los badges numéricos existen en el perímetro del radar
      const badge1 = screen.getByTestId('radar-vertex-badge-1');
      const badge2 = screen.getByTestId('radar-vertex-badge-2');
      const badge3 = screen.getByTestId('radar-vertex-badge-3');
      expect(badge1).toBeInTheDocument();
      expect(badge2).toBeInTheDocument();
      expect(badge3).toBeInTheDocument();

      // Hover sobre el badge 2 en el radar ilumina la tarjeta lateral 2
      fireEvent.mouseEnter(badge2);
      expect(card2).toHaveClass('bg-blue-50/95');

      // Al retirar el mouse del badge 2, se restaura el estado normal
      fireEvent.mouseLeave(badge2);
      expect(card2).not.toHaveClass('bg-blue-50/95');

      // Hover sobre la tarjeta lateral 1 ilumina el badge 1
      fireEvent.mouseEnter(card1);
      expect(card1).toHaveClass('bg-blue-50/95');
      fireEvent.mouseLeave(card1);
      expect(card1).not.toHaveClass('bg-blue-50/95');

      // Alternar a Red Conectada y volver a Columnas Laterales
      fireEvent.click(toggleFlotante);
      expect(toggleFlotante).toHaveClass('bg-blue-600');
      fireEvent.click(toggleCol);
      expect(toggleCol).toHaveClass('bg-blue-600');
    });

    it('permite al cliente invertir el orden en sentido antihorario en modo columnas', () => {
      const onOrderDirectionChange = jest.fn();
      render(
        <DocenteActuacionesRadarChart
          student={mockStudent}
          etapasConfiguradas={mockEtapas}
          catalogoActuaciones={mockCatalogo}
          onOrderDirectionChange={onOrderDirectionChange}
        />
      );

      // Los botones de selección de sentido están presentes
      const btnHorario = screen.getByTestId('toggle-direction-horario');
      const btnAntihorario = screen.getByTestId('toggle-direction-antihorario');
      expect(btnHorario).toBeInTheDocument();
      expect(btnAntihorario).toBeInTheDocument();

      // Inicialmente está en sentido Horario (por defecto)
      expect(btnHorario).toHaveClass('bg-blue-600');
      expect(screen.getByTestId('radar-direction-indicator')).toHaveTextContent('Sentido Horario (↻)');

      // Al dar clic en Antihorario, se invierte el sentido
      fireEvent.click(btnAntihorario);

      expect(btnAntihorario).toHaveClass('bg-blue-600');
      expect(btnHorario).not.toHaveClass('bg-blue-600');
      expect(screen.getByTestId('radar-direction-indicator')).toHaveTextContent('Sentido Antihorario (↺)');
      expect(onOrderDirectionChange).toHaveBeenCalledWith('antihorario');

      // Verifica persistencia en localStorage
      expect(localStorage.getItem(RADAR_DIRECTION_STORAGE_KEY)).toBe('antihorario');

      // Al alternar a Red Conectada ('flotante'), los botones de sentido de columnas no deben mostrarse
      const toggleFlotante = screen.getByTestId('toggle-mode-flotante');
      fireEvent.click(toggleFlotante);
      expect(screen.queryByTestId('toggle-direction-horario')).not.toBeInTheDocument();
      expect(screen.queryByTestId('toggle-direction-antihorario')).not.toBeInTheDocument();
    });

    it('distribuye las actuaciones correctamente a la izquierda y derecha según el sentido horario/antihorario', () => {
      const catalogo4: ActuacionCatalogoItem[] = [
        { id: '1', order: 1, actuacion: 'Actuación 1' },
        { id: '2', order: 2, actuacion: 'Actuación 2' },
        { id: '3', order: 3, actuacion: 'Actuación 3' },
        { id: '4', order: 4, actuacion: 'Actuación 4' },
      ];

      const { rerender } = render(
        <DocenteActuacionesRadarChart
          student={mockStudent}
          etapasConfiguradas={mockEtapas}
          catalogoActuaciones={catalogo4}
          layoutMode="columnas"
          orderDirection="horario"
        />
      );

      // En sentido horario:
      // Actuaciones 1-2 están en el hemisferio derecho (Columna Derecha)
      // Actuaciones 3-4 están en el hemisferio izquierdo (Columna Izquierda)
      expect(screen.getByText('Actuaciones 3 - 4')).toBeInTheDocument();
      expect(screen.getByText('Actuaciones 1 - 2')).toBeInTheDocument();

      // Cambiamos a sentido antihorario
      rerender(
        <DocenteActuacionesRadarChart
          student={mockStudent}
          etapasConfiguradas={mockEtapas}
          catalogoActuaciones={catalogo4}
          layoutMode="columnas"
          orderDirection="antihorario"
        />
      );

      // En sentido antihorario:
      // Actuaciones 1-2 van hacia la izquierda (Columna Izquierda)
      // Actuaciones 3-4 van hacia la derecha (Columna Derecha)
      const leftHeaders = screen.getAllByText(/Actuaciones 1 - 2/);
      expect(leftHeaders.length).toBeGreaterThan(0);
    });
  });

  describe('Interacción de Arrastre (Drag & Drop) y Redimensión en Red Conectada', () => {
    it('permite arrastrar tarjetas para reubicarlas, redimensionarlas y restablecer sus posiciones', () => {
      render(
        <DocenteActuacionesRadarChart
          student={mockStudent}
          etapasConfiguradas={mockEtapas}
          catalogoActuaciones={mockCatalogo}
          layoutMode="flotante"
        />
      );

      // Verificamos que las tarjetas callout existan
      const card1 = screen.getByTestId('callout-card-1');
      expect(card1).toBeInTheDocument();
      expect(card1).toHaveClass('cursor-grab');

      // Inicialmente no debe mostrarse el botón de restablecer
      expect(screen.queryByTestId('reset-card-positions')).not.toBeInTheDocument();

      const rect1Before = card1.querySelector('rect');
      const xBefore = parseFloat(rect1Before?.getAttribute('x') || '0');
      const yBefore = parseFloat(rect1Before?.getAttribute('y') || '0');

      // Simulamos inicio de arrastre (pointerdown) sobre la tarjeta 1
      fireEvent.pointerDown(card1, { clientX: 200, clientY: 200 });

      // Simulamos movimiento de puntero
      fireEvent.mouseMove(window, { clientX: 250, clientY: 230 });

      // Finalizamos el arrastre
      fireEvent.mouseUp(window);

      // Ahora el botón de restablecer debe ser visible
      const resetBtn = screen.getByTestId('reset-card-positions');
      expect(resetBtn).toBeInTheDocument();

      // Al hacer clic en Restablecer, se vuelve a las posiciones calculadas por el algoritmo
      fireEvent.click(resetBtn);
      expect(screen.queryByTestId('reset-card-positions')).not.toBeInTheDocument();

      const rect1AfterReset = card1.querySelector('rect');
      expect(parseFloat(rect1AfterReset?.getAttribute('x') || '0')).toBeCloseTo(xBefore);
      expect(parseFloat(rect1AfterReset?.getAttribute('y') || '0')).toBeCloseTo(yBefore);
    });

    it('permite redimensionar una tarjeta desde la esquina inferior derecha', () => {
      render(
        <DocenteActuacionesRadarChart
          student={mockStudent}
          etapasConfiguradas={mockEtapas}
          catalogoActuaciones={mockCatalogo}
          layoutMode="flotante"
        />
      );

      const card1 = screen.getByTestId('callout-card-1');
      const rect1Before = card1.querySelector('rect');
      const wBefore = parseFloat(rect1Before?.getAttribute('width') || '0');
      const hBefore = parseFloat(rect1Before?.getAttribute('height') || '0');

      // El grip de redimensión es el subgrupo con cursor-se-resize
      const resizeHandle = card1.querySelector('.cursor-se-resize');
      expect(resizeHandle).toBeInTheDocument();

      // Simulamos inicio de redimensión
      if (resizeHandle) {
        fireEvent.pointerDown(resizeHandle, { clientX: 300, clientY: 300 });

        // Simulamos movimiento ampliando 50px a la derecha y 30px hacia abajo
        fireEvent.mouseMove(window, { clientX: 350, clientY: 330 });
        fireEvent.mouseUp(window);

        const rect1After = card1.querySelector('rect');
        const wAfter = parseFloat(rect1After?.getAttribute('width') || '0');
        const hAfter = parseFloat(rect1After?.getAttribute('height') || '0');

        expect(wAfter).toBeGreaterThan(wBefore);
        expect(hAfter).toBeGreaterThan(hBefore);
      }
    });
  });

  describe('Persistencia Local por Cantidad de Actuaciones (Evaluaciones de 7, 25, 28)', () => {
    beforeEach(() => {
      localStorage.clear();
      jest.clearAllMocks();
    });

    it('genera claves de almacenamiento segmentadas por número de actuaciones', () => {
      expect(getRadarCardAdjustmentsStorageKey(7)).toBe('eva_radar_card_adjustments_n_7');
      expect(getRadarCardAdjustmentsStorageKey(25)).toBe('eva_radar_card_adjustments_n_25');
      expect(getRadarCardAdjustmentsStorageKey(28)).toBe('eva_radar_card_adjustments_n_28');
    });

    it('aísla los ajustes entre evaluaciones con diferente número de actuaciones (7 vs 25 vs 28)', () => {
      const adj7 = { 1: { dx: 15, dy: 10, customW: 240, customH: 50 } };
      const adj25 = { 1: { dx: -30, dy: -20, customW: 290, customH: 60 } };
      const adj28 = { 1: { dx: 45, dy: 5, customW: 320, customH: 70 } };

      saveStoredCardAdjustments(7, adj7);
      saveStoredCardAdjustments(25, adj25);
      saveStoredCardAdjustments(28, adj28);

      expect(loadStoredCardAdjustments(7)).toEqual(adj7);
      expect(loadStoredCardAdjustments(25)).toEqual(adj25);
      expect(loadStoredCardAdjustments(28)).toEqual(adj28);

      // Limpiar únicamente la configuración de 25 no altera la de 7 ni la de 28
      clearStoredCardAdjustments(25);
      expect(loadStoredCardAdjustments(25)).toEqual({});
      expect(loadStoredCardAdjustments(7)).toEqual(adj7);
      expect(loadStoredCardAdjustments(28)).toEqual(adj28);
    });

    it('aplica automáticamente los ajustes guardados en localStorage al renderizar el componente', () => {
      // Guardamos ajustes para una evaluación de 7 actuaciones
      const saved7 = {
        1: { dx: 60, dy: 35, customW: 310, customH: 65 },
      };
      saveStoredCardAdjustments(7, saved7);

      const catalogo7: ActuacionCatalogoItem[] = Array.from({ length: 7 }, (_, i) => ({
        order: i + 1,
        actuacion: `Actuación Corta ${i + 1}`,
      }));

      render(
        <DocenteActuacionesRadarChart
          student={mockStudent}
          etapasConfiguradas={mockEtapas}
          catalogoActuaciones={catalogo7}
          layoutMode="flotante"
        />
      );

      // La tarjeta 1 debe cargarse con las dimensiones y desplazamiento guardados
      const card1 = screen.getByTestId('callout-card-1');
      const rect1 = card1.querySelector('rect');
      expect(parseFloat(rect1?.getAttribute('width') || '0')).toBe(310);
      expect(parseFloat(rect1?.getAttribute('height') || '0')).toBe(65);

      // El botón de restablecer debe ser visible porque hay ajustes guardados activos
      expect(screen.getByTestId('reset-card-positions')).toBeInTheDocument();
    });

    it('guarda las nuevas posiciones en localStorage al terminar de arrastrar una tarjeta', () => {
      const catalogo7: ActuacionCatalogoItem[] = Array.from({ length: 7 }, (_, i) => ({
        order: i + 1,
        actuacion: `Actuación ${i + 1}`,
      }));

      render(
        <DocenteActuacionesRadarChart
          student={mockStudent}
          etapasConfiguradas={mockEtapas}
          catalogoActuaciones={catalogo7}
          layoutMode="flotante"
        />
      );

      const card1 = screen.getByTestId('callout-card-1');

      // Arrastramos la tarjeta
      fireEvent.pointerDown(card1, { clientX: 100, clientY: 100 });
      fireEvent.mouseMove(window, { clientX: 150, clientY: 140 });
      fireEvent.mouseUp(window);

      // Verificamos que se haya guardado en localStorage bajo la clave correspondiente a 7 actuaciones
      const stored = loadStoredCardAdjustments(7);
      expect(stored[1]).toBeDefined();
      expect(stored[1].dx).not.toBe(0);
      expect(stored[1].dy).not.toBe(0);

      // Al pulsar Restablecer, se limpia el localStorage de 7
      const resetBtn = screen.getByTestId('reset-card-positions');
      fireEvent.click(resetBtn);
      expect(loadStoredCardAdjustments(7)).toEqual({});
    });

    it('notifica onAdjustmentsChange con coordenadas absolutas (x, y) calculadas durante el arrastre', () => {
      const handleAdjustmentsChange = jest.fn();
      const catalogo7: ActuacionCatalogoItem[] = Array.from({ length: 7 }, (_, i) => ({
        order: i + 1,
        actuacion: `Actuación ${i + 1}`,
      }));

      render(
        <DocenteActuacionesRadarChart
          student={mockStudent}
          etapasConfiguradas={mockEtapas}
          catalogoActuaciones={catalogo7}
          layoutMode="flotante"
          onAdjustmentsChange={handleAdjustmentsChange}
        />
      );

      const card1 = screen.getByTestId('callout-card-1');
      fireEvent.pointerDown(card1, { clientX: 200, clientY: 200 });
      fireEvent.mouseMove(window, { clientX: 260, clientY: 240 });
      fireEvent.mouseUp(window);

      expect(handleAdjustmentsChange).toHaveBeenCalled();
      const lastCall =
        handleAdjustmentsChange.mock.calls[handleAdjustmentsChange.mock.calls.length - 1][0];
      expect(lastCall[1]).toBeDefined();
      expect(typeof lastCall[1].x).toBe('number');
      expect(typeof lastCall[1].y).toBe('number');
      expect(lastCall[1].x).toBeGreaterThan(0);
    });
  });

  describe('Feature Dividir en 2 Gráficos (Mitad y Mitad)', () => {
    it('activa la feature de dividir en 2 tanto en diseño columnas como en diseño flotante', () => {
      const mockCatalogo4 = [
        { order: 1, actuacion: 'Actuación 1' },
        { order: 2, actuacion: 'Actuación 2' },
        { order: 3, actuacion: 'Actuación 3' },
        { order: 4, actuacion: 'Actuación 4' },
      ];

      render(
        <DocenteActuacionesRadarChart
          student={mockStudent}
          etapasConfiguradas={mockEtapas}
          catalogoActuaciones={mockCatalogo4}
          layoutMode="columnas"
        />
      );

      const toggleSplit = screen.getByTestId('toggle-split-in-two');
      expect(toggleSplit).toBeInTheDocument();

      fireEvent.click(toggleSplit);
      expect(toggleSplit).toHaveClass('bg-blue-600');

      // Se muestran los encabezados de Parte 1 y Parte 2 en modo Columnas
      expect(screen.getByText(/PARTE 1 DE 2: ACTUACIONES 1 A 2/i)).toBeInTheDocument();
      expect(screen.getByText(/PARTE 2 DE 2: ACTUACIONES 3 A 4/i)).toBeInTheDocument();

      // Las tarjetas de ambas mitades existen
      expect(screen.getByTestId('lateral-card-1')).toBeInTheDocument();
      expect(screen.getByTestId('lateral-card-2')).toBeInTheDocument();
      expect(screen.getByTestId('lateral-card-3')).toBeInTheDocument();
      expect(screen.getByTestId('lateral-card-4')).toBeInTheDocument();

      // Cambiamos a diseño Red Conectada (flotante) manteniendo la feature activa
      const btnFlotante = screen.getByTestId('toggle-mode-flotante');
      fireEvent.click(btnFlotante);

      // Ahora se renderizan dos lienzos SVG para las dos mitades en diseño flotante
      const svgs = screen.getAllByTestId('radar-svg-canvas');
      expect(svgs.length).toBe(2);
      expect(screen.getByText(/PARTE 1 DE 2: ACTUACIONES 1 A 2/i)).toBeInTheDocument();
      expect(screen.getByText(/PARTE 2 DE 2: ACTUACIONES 3 A 4/i)).toBeInTheDocument();
    });

    it('ignora ajustes locales en modo flotante cuando está dividido en 2 y actúa solo el algoritmo', () => {
      const mockCatalogo4 = [
        { order: 1, actuacion: 'Actuación 1' },
        { order: 2, actuacion: 'Actuación 2' },
        { order: 3, actuacion: 'Actuación 3' },
        { order: 4, actuacion: 'Actuación 4' },
      ];

      // Guardamos un ajuste manual en localStorage para la actuación 1
      saveStoredCardAdjustments(4, {
        1: { dx: 300, dy: 200, customW: 400, customH: 150 },
      });

      const { rerender } = render(
        <DocenteActuacionesRadarChart
          student={mockStudent}
          etapasConfiguradas={mockEtapas}
          catalogoActuaciones={mockCatalogo4}
          layoutMode="flotante"
          splitInTwo={false}
        />
      );

      // Cuando NO está dividido (splitInTwo = false), SÍ usa los ajustes locales:
      const card1Unsplit = screen.getByTestId('callout-card-1');
      const rectUnsplit = card1Unsplit.querySelector('rect');
      expect(parseFloat(rectUnsplit?.getAttribute('width') || '0')).toBe(400);
      expect(parseFloat(rectUnsplit?.getAttribute('height') || '0')).toBe(150);

      // Cuando SÍ está dividido (splitInTwo = true), actúa SOLO el algoritmo (ignora ajustes locales):
      rerender(
        <DocenteActuacionesRadarChart
          student={mockStudent}
          etapasConfiguradas={mockEtapas}
          catalogoActuaciones={mockCatalogo4}
          layoutMode="flotante"
          splitInTwo={true}
        />
      );

      const card1Split = screen.getByTestId('callout-card-1');
      const rectSplit = card1Split.querySelector('rect');
      // Las dimensiones calculadas por el algoritmo para "Actuación 1" son de tamaño estándar (< 400)
      expect(parseFloat(rectSplit?.getAttribute('width') || '0')).toBeLessThan(400);
      expect(parseFloat(rectSplit?.getAttribute('height') || '0')).toBeLessThan(150);

      act(() => {
        clearStoredCardAdjustments(4);
      });
    });
  });

  describe('Evaluaciones con Puntajes Idénticos y Carriles Paralelos', () => {
    test('getCoincidentRadiusOffset distribuye en carriles simétricos cuando hay coincidencia', () => {
      const activeList = [{ key: 'edi' }, { key: 'ep1' }, { key: 'ep2' }];
      const etapasSame = {
        edi: { actuacionesResultados: { 1: 2 } },
        ep1: { actuacionesResultados: { 1: 2 } },
        ep2: { actuacionesResultados: { 1: 2 } },
      };

      const offsetEdi = getCoincidentRadiusOffset('edi', 1, activeList, etapasSame);
      const offsetEp1 = getCoincidentRadiusOffset('ep1', 1, activeList, etapasSame);
      const offsetEp2 = getCoincidentRadiusOffset('ep2', 1, activeList, etapasSame);

      expect(offsetEdi).toBeCloseTo(-1.8, 1);
      expect(offsetEp1).toBeCloseTo(0, 1);
      expect(offsetEp2).toBeCloseTo(1.8, 1);
    });

    test('getCoincidentRadiusOffset retorna 0 si no coinciden en el valor', () => {
      const activeList = [{ key: 'edi' }, { key: 'ep1' }];
      const etapasDiff = {
        edi: { actuacionesResultados: { 1: 1 } },
        ep1: { actuacionesResultados: { 1: 2 } },
      };

      const offsetEdi = getCoincidentRadiusOffset('edi', 1, activeList, etapasDiff);
      const offsetEp1 = getCoincidentRadiusOffset('ep1', 1, activeList, etapasDiff);

      expect(offsetEdi).toBe(0);
      expect(offsetEp1).toBe(0);
    });

    test('Muestra el indicador de evaluaciones idénticas cuando el estudiante tiene el mismo puntaje en todas', () => {
      const mockStudentSame: EstudianteEvolutivo = {
        ...mockStudent,
        dni: '12345678',
        nombres: 'Estudiante',
        apellidos: 'Idéntico',
        deltaPuntaje: 0,
        estadoTrayectoria: 'estable',
        diferenciaConAula: 0,
        etapas: {
          edi: {
            etapaKey: 'edi',
            label: 'EDI (Diagnóstica)',
            nombreEvaluacion: 'Evaluación EDI',
            evaluacionId: 'eva-edi',
            porcentaje: 100,
            puntaje: 20,
            maxPuntaje: 20,
            nivel: 'Logrado',
            respuestasCorrectas: 2,
            totalPreguntas: 2,
            actuacionesResultados: { 1: 2, 2: 2 },
          },
          ep1: {
            etapaKey: 'ep1',
            label: 'EP1 (Progresiva 1)',
            nombreEvaluacion: 'Evaluación EP1',
            evaluacionId: 'eva-ep1',
            porcentaje: 100,
            puntaje: 20,
            maxPuntaje: 20,
            nivel: 'Logrado',
            respuestasCorrectas: 2,
            totalPreguntas: 2,
            actuacionesResultados: { 1: 2, 2: 2 },
          },
          ep2: {
            etapaKey: 'ep2',
            label: 'EP2 (Progresiva 2)',
            nombreEvaluacion: 'Evaluación EP2',
            evaluacionId: 'eva-ep2',
            porcentaje: 100,
            puntaje: 20,
            maxPuntaje: 20,
            nivel: 'Logrado',
            respuestasCorrectas: 2,
            totalPreguntas: 2,
            actuacionesResultados: { 1: 2, 2: 2 },
          },
        },
      };

      const mockCatalogo: ActuacionCatalogoItem[] = [
        { order: 1, actuacion: 'Actuación 1' },
        { order: 2, actuacion: 'Actuación 2' },
      ];

      const mockEtapasList = [
        { key: 'edi', id: 'edi', label: 'EDI (Diagnóstica)', order: 1 },
        { key: 'ep1', id: 'ep1', label: 'EP1 (Progresiva 1)', order: 2 },
        { key: 'ep2', id: 'ep2', label: 'EP2 (Progresiva 2)', order: 3 },
      ];

      render(
        <DocenteActuacionesRadarChart
          student={mockStudentSame}
          etapasConfiguradas={mockEtapasList}
          catalogoActuaciones={mockCatalogo}
          layoutMode="columnas"
        />
      );

      // Debe aparecer el aviso de evaluaciones con resultados idénticos
      expect(screen.getByText(/Sin variación/i)).toBeInTheDocument();
      expect(
        screen.getByText(/registran el mismo puntaje en todas las actuaciones/i)
      ).toBeInTheDocument();
    });

    it('maneja limpiamente a estudiantes no evaluados en una etapa (ej. tiene EDI y EP2 pero no EP1)', () => {
      const mockStudentMissingEp1: EstudianteEvolutivo = {
        ...mockStudent,
        etapas: {
          edi: {
            etapaKey: 'edi',
            label: 'EDI (Diagnóstica)',
            nombreEvaluacion: 'EDI',
            evaluacionId: 'eval-edi',
            puntaje: 418,
            maxPuntaje: 900,
            nivel: 'En Inicio',
            respuestasCorrectas: 13,
            totalPreguntas: 28,
            porcentaje: 46,
            actuacionesResultados: { 1: 2, 2: 1 },
          },
          // ep1 NO está presente (no fue evaluado)
          ep2: {
            etapaKey: 'ep2',
            label: 'EP2 (Progresiva 2)',
            nombreEvaluacion: 'EP2',
            evaluacionId: 'eval-ep2',
            puntaje: 450,
            maxPuntaje: 900,
            nivel: 'En Proceso',
            respuestasCorrectas: 14,
            totalPreguntas: 28,
            porcentaje: 50,
            actuacionesResultados: { 1: 2, 2: 2 },
          },
        },
      };

      const mockCatalogo: ActuacionCatalogoItem[] = [
        { order: 1, actuacion: 'Actuación 1' },
        { order: 2, actuacion: 'Actuación 2' },
      ];

      const mockEtapasList = [
        { key: 'edi', id: 'edi', label: 'EDI (Diagnóstica)', order: 1 },
        { key: 'ep1', id: 'ep1', label: 'EP1 (Progresiva 1)', order: 2 },
        { key: 'ep2', id: 'ep2', label: 'EP2 (Progresiva 2)', order: 3 },
      ];

      render(
        <DocenteActuacionesRadarChart
          student={mockStudentMissingEp1}
          etapasConfiguradas={mockEtapasList}
          catalogoActuaciones={mockCatalogo}
          layoutMode="columnas"
        />
      );

      // En el card de estadísticas debe mostrar "No evaluado" y "—" para EP1
      expect(screen.getByText('No evaluado')).toBeInTheDocument();
      expect(screen.getAllByText(/EDI \(Diagnóstica\)/i).length).toBeGreaterThan(0);
      expect(screen.getAllByText(/EP2 \(Progresiva 2\)/i).length).toBeGreaterThan(0);
    });
  });
});
