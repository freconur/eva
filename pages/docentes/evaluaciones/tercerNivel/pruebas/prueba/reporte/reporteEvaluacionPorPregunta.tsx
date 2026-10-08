import React, { useMemo, useCallback, useState } from 'react';
import { Bar } from 'react-chartjs-2';
import { RiErrorWarningLine } from 'react-icons/ri';
import { MdHelpOutline } from 'react-icons/md';
import { DataEstadisticas, PreguntasRespuestas } from '@/features/types/types';
import { useColorsFromCSS } from '@/features/hooks/useColorsFromCSS';

interface ReporteEvaluacionPorPreguntaProps {
  dataEstadisticasOrdenadas: DataEstadisticas[];
  preguntasMap: Map<string, PreguntasRespuestas>;
  detectarNumeroOpciones: number;
  warningEvaEstudianteSinRegistro?: string;
  convertirGraficoAImagen: (idPregunta: string, canvasRef: HTMLCanvasElement | null) => void;
  forceOneColumn?: boolean;
}

const ReporteEvaluacionPorPregunta: React.FC<ReporteEvaluacionPorPreguntaProps> = ({
  dataEstadisticasOrdenadas,
  preguntasMap,
  detectarNumeroOpciones,
  warningEvaEstudianteSinRegistro,
  convertirGraficoAImagen,
  forceOneColumn = false,
}) => {
  // Estado para controlar el número de columnas (por defecto 2)
  const [numeroColumnas, setNumeroColumnas] = useState<number>(2);

  const { prepareBarChartData, getAlternativaColor } = useColorsFromCSS();

  // Función optimizada para obtener respuesta usando el mapa
  const obtenerRespuestaPorId = useCallback(
    (idPregunta: string): string => {
      const pregunta = preguntasMap.get(idPregunta);
      return pregunta?.respuesta || '';
    },
    [preguntasMap]
  );

  const processQuestionData = useCallback(
    (data: DataEstadisticas, respuesta: string, pregunta?: PreguntasRespuestas) => {
      const esRespuestaCorrecta = (opcion: string) => {
        return opcion.toLowerCase() === respuesta.toLowerCase();
      };

      // Obtener las alternativas de la pregunta (o por defecto A, B, C, D)
      let alternativas = pregunta?.alternativas || [
        { alternativa: 'A', descripcion: '', selected: false },
        { alternativa: 'B', descripcion: '', selected: false },
        { alternativa: 'C', descripcion: '', selected: false },
        { alternativa: 'D', descripcion: '', selected: false },
      ];

      // Filtrar la alternativa 'no respondio' si su cantidad es 0
      alternativas = alternativas.filter((alt) => {
        if (alt.descripcion?.toLowerCase() === 'no respondio') {
          const key = (alt.alternativa || '').toLowerCase();
          const count = Array.isArray(data.alternativas)
            ? data.alternativas.find((a: any) => (a.id || '').toLowerCase() === key)?.cantidad ?? 0
            : data[key] || 0;
          return count > 0;
        }
        return true;
      });

      // Calcular porcentajes para cada opción
      const calcularPorcentaje = (valor: number | undefined) => {
        if (valor === null || valor === undefined) return 0;
        return !data.total || data.total === 0 ? 0 : (100 * Number(valor)) / Number(data.total);
      };

      const roundedPercentages: number[] = [];
      if (!data.total || data.total === 0) {
        alternativas.forEach(() => {
          roundedPercentages.push(0);
        });
      } else {
        let sumOfRounded = 0;
        for (let i = 0; i < alternativas.length; i++) {
          const key = (alternativas[i].alternativa || '').toLowerCase();
          const count = Array.isArray(data.alternativas)
            ? data.alternativas.find((a: any) => (a.id || '').toLowerCase() === key)?.cantidad ?? 0
            : data[key] || 0;
          const rawPct = calcularPorcentaje(count);
          if (i < alternativas.length - 1) {
            const rounded = Math.round(rawPct);
            roundedPercentages.push(rounded);
            sumOfRounded += rounded;
          } else {
            // La última alternativa absorbe la diferencia para sumar exactamente 100
            const rounded = Math.max(0, 100 - sumOfRounded);
            roundedPercentages.push(rounded);
          }
        }
      }

      const labels = alternativas.map((alt) =>
        alt.descripcion?.toLowerCase() === 'no respondio' ? 'NR' : (alt.alternativa || '').toUpperCase()
      );

      // Obtenemos los datasets con sus colores existentes (PRESERVADOS INTACTOS)
      const rawChartData = prepareBarChartData(data, respuesta, alternativas.length);

      // Aplicamos el estilo visual de la captura: barras anchas con esquinas superiores redondeadas, sin bordes oscuros
      const datasets = rawChartData.datasets.map((ds: any) => ({
        ...ds,
        borderWidth: 0,
        borderRadius: { topLeft: 6, topRight: 6, bottomLeft: 0, bottomRight: 0 },
        borderSkipped: 'bottom' as const,
        barPercentage: 0.75,
        categoryPercentage: 0.85,
        maxBarThickness: 56,
      }));

      return {
        chartData: {
          labels,
          datasets,
        },
        alternativas,
        roundedPercentages,
      };
    },
    [prepareBarChartData]
  );

  // Opciones de configuración de Chart.js con la estética limpia del diseño de referencia
  const getChartOptions = useCallback((respuesta: string) => {
    return {
      animation: false as const, // Desactivado para captura inmediata y rendimiento óptimo
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          display: false, // La leyenda personalizada con círculos se renderiza debajo en HTML
        },
        title: {
          display: false,
        },
        tooltip: {
          enabled: true,
          mode: 'index' as const,
          intersect: false,
          backgroundColor: 'rgba(15, 23, 42, 0.94)', // Slate 900
          titleColor: '#ffffff',
          bodyColor: '#cbd5e1', // Slate 300
          borderColor: 'rgba(255, 255, 255, 0.1)',
          borderWidth: 1,
          cornerRadius: 8,
          padding: 10,
          boxPadding: 4,
          usePointStyle: true,
          titleFont: {
            family: 'Inter, -apple-system, BlinkMacSystemFont, sans-serif',
            size: 13,
            weight: 'bold' as const,
          },
          bodyFont: {
            family: 'Inter, -apple-system, BlinkMacSystemFont, sans-serif',
            size: 12,
          },
          callbacks: {
            title: function (context: any) {
              const rawLabel = context[0]?.label || '';
              return rawLabel === 'NR' ? 'No respondió' : `Opción ${rawLabel.toUpperCase()}`;
            },
            label: function (context: any) {
              const value = context.parsed.y;
              const total = context.dataset.data.reduce((a: number, b: number) => a + b, 0);
              const percentage = total > 0 ? ((value / total) * 100).toFixed(1) : '0';
              return ` Respuestas: ${value} (${percentage}%)`;
            },
            afterLabel: function (context: any) {
              const rawLabel = (context.label || '').toLowerCase();
              if (rawLabel === respuesta.toLowerCase()) {
                return ' ✓ Respuesta Correcta';
              }
              return '';
            },
          },
        },
      },
      scales: {
        x: {
          grid: {
            color: 'rgba(241, 245, 249, 0.7)', // Líneas verticales muy tenues (#f1f5f9)
            drawBorder: false,
          },
          border: {
            display: false, // Ocultar línea de eje para aspecto plano y moderno
          },
          ticks: {
            display: false, // Ocultamos texto en eje X; la leyenda inferior actúa como identificador limpio
          },
        },
        y: {
          beginAtZero: true,
          grace: '8%', // Espacio respirable en la parte superior para no tocar el borde
          grid: {
            color: '#f1f5f9', // Líneas horizontales suaves
            drawBorder: false,
          },
          border: {
            display: false,
          },
          ticks: {
            color: '#94a3b8', // Color Slate-400 idéntico a la captura
            font: {
              family: 'Inter, -apple-system, BlinkMacSystemFont, sans-serif',
              size: 11,
              weight: 500,
            },
            padding: 8,
            precision: 0,
          },
        },
      },
      interaction: {
        mode: 'index' as const,
        intersect: false,
      },
      onHover: (event: any, activeElements: any) => {
        if (event.native) {
          event.native.target.style.cursor = activeElements.length > 0 ? 'pointer' : 'default';
        }
      },
    };
  }, []);

  return (
    <div className="w-full">
      {/* Selector de número de columnas y Cabecera de Sección */}
      {!forceOneColumn && (
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6 pb-4 border-b border-slate-200/80">
          <div>
            <div className="flex items-center gap-2.5">
              <h2 className="text-base sm:text-lg font-bold text-slate-800 tracking-tight">
                Análisis de Respuestas por Pregunta
              </h2>
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-blue-50 text-blue-700 border border-blue-200/60">
                {dataEstadisticasOrdenadas?.length || 0} ítems
              </span>
            </div>
            <p className="text-xs sm:text-sm text-slate-500 mt-1">
              Frecuencia de respuesta por alternativa y tasa porcentual de elección de los estudiantes
            </p>
          </div>

          <div className="flex items-center gap-2.5 self-end sm:self-auto">
            <span className="text-xs font-medium text-slate-500 hidden sm:inline">Visualización:</span>
            <div
              className="inline-flex items-center p-1 bg-slate-100 rounded-xl border border-slate-200/80 shadow-2xs"
              role="group"
              aria-label="Selector de columnas"
            >
              <button
                type="button"
                onClick={() => setNumeroColumnas(1)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all duration-150 ${
                  numeroColumnas === 1
                    ? 'bg-white text-blue-700 shadow-xs font-semibold'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/50'
                }`}
                title="Ver en 1 columna"
                aria-pressed={numeroColumnas === 1}
              >
                <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="currentColor">
                  <rect x="3" y="6" width="18" height="4" rx="1.5" />
                  <rect x="3" y="14" width="18" height="4" rx="1.5" />
                </svg>
                <span>1 col</span>
              </button>

              <button
                type="button"
                onClick={() => setNumeroColumnas(2)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all duration-150 ${
                  numeroColumnas === 2
                    ? 'bg-white text-blue-700 shadow-xs font-semibold'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/50'
                }`}
                title="Ver en 2 columnas"
                aria-pressed={numeroColumnas === 2}
              >
                <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="currentColor">
                  <rect x="3" y="4" width="8" height="7" rx="1.5" />
                  <rect x="13" y="4" width="8" height="7" rx="1.5" />
                  <rect x="3" y="13" width="8" height="7" rx="1.5" />
                  <rect x="13" y="13" width="8" height="7" rx="1.5" />
                </svg>
                <span>2 cols</span>
              </button>

              <button
                type="button"
                onClick={() => setNumeroColumnas(3)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all duration-150 ${
                  numeroColumnas === 3
                    ? 'bg-white text-blue-700 shadow-xs font-semibold'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/50'
                }`}
                title="Ver en 3 columnas"
                aria-pressed={numeroColumnas === 3}
              >
                <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="currentColor">
                  <rect x="2" y="4" width="5.5" height="16" rx="1.5" />
                  <rect x="9.25" y="4" width="5.5" height="16" rx="1.5" />
                  <rect x="16.5" y="4" width="5.5" height="16" rx="1.5" />
                </svg>
                <span>3 cols</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Alerta de advertencia si no hay registros */}
      {warningEvaEstudianteSinRegistro ? (
        <div className="flex items-center gap-3 p-4 bg-amber-50 border border-amber-200/80 rounded-2xl text-amber-800 text-sm">
          <RiErrorWarningLine className="w-5 h-5 text-amber-600 shrink-0" />
          <span>{warningEvaEstudianteSinRegistro}</span>
        </div>
      ) : !dataEstadisticasOrdenadas || dataEstadisticasOrdenadas.length === 0 ? (
        <div className="flex flex-col items-center justify-center p-12 bg-white rounded-2xl border border-slate-200/80 text-center">
          <div className="p-3 bg-blue-50 text-blue-600 rounded-full mb-3">
            <MdHelpOutline className="w-8 h-8" />
          </div>
          <h4 className="text-base font-semibold text-slate-800 mb-1">
            No hay estadísticas de preguntas disponibles
          </h4>
          <p className="text-sm text-slate-500 max-w-md">
            Aún no se registran respuestas de estudiantes para las preguntas de esta evaluación.
          </p>
        </div>
      ) : (
        /* Grilla de Tarjetas de Preguntas */
        <div
          className={`grid gap-5 sm:gap-6 ${
            forceOneColumn || numeroColumnas === 1
              ? 'grid-cols-1'
              : numeroColumnas === 2
              ? 'grid-cols-1 lg:grid-cols-2'
              : 'grid-cols-1 md:grid-cols-2 xl:grid-cols-3'
          }`}
        >
          {dataEstadisticasOrdenadas.map((dat, index) => {
            const pregunta = preguntasMap.get(dat.id || '');
            const numeroOrden = pregunta?.order || index + 1;
            const respuestaCorrecta = obtenerRespuestaPorId(`${dat.id}`);
            const { chartData, alternativas, roundedPercentages } = processQuestionData(
              dat,
              respuestaCorrecta,
              pregunta
            );

            return (
              <div
                key={dat.id || index}
                className="bg-white rounded-2xl border border-slate-200/90 shadow-2xs hover:shadow-md transition-all duration-200 flex flex-col justify-between overflow-hidden"
              >
                {/* Cabecera de la Pregunta */}
                <div className="p-4 sm:p-5 bg-gradient-to-r from-slate-50/90 to-white border-b border-slate-100 flex items-start justify-between gap-3">
                  <div className="flex items-start gap-3 min-w-0">
                    <span className="shrink-0 flex items-center justify-center w-8 h-8 rounded-xl bg-blue-50 text-blue-700 font-bold text-xs border border-blue-200/60 shadow-2xs">
                      {numeroOrden}
                    </span>
                    <div className="min-w-0">
                      <h3 className="text-sm sm:text-base font-semibold text-slate-800 leading-snug tracking-tight">
                        {pregunta?.pregunta || `Pregunta N° ${numeroOrden}`}
                      </h3>
                      {pregunta?.preguntaDocente && (
                        <p className="text-xs text-slate-500 mt-1.5 leading-relaxed">
                          <strong className="text-slate-700 font-semibold">Actuación / Criterio:</strong>{' '}
                          {pregunta.preguntaDocente}
                        </p>
                      )}
                    </div>
                  </div>
                  {dat.total !== undefined && (
                    <span className="shrink-0 inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium text-slate-600 bg-slate-100 border border-slate-200/80">
                      {dat.total} resp.
                    </span>
                  )}
                </div>

                {/* Contenedor del Gráfico y Leyenda Inferior */}
                <div className="p-4 sm:p-5 flex-1 flex flex-col justify-between">
                  <div className="relative w-full h-[250px] sm:h-[270px]">
                    <Bar
                      options={getChartOptions(respuestaCorrecta)}
                      data={chartData}
                      ref={(chartRef) => {
                        if (chartRef && chartRef.canvas) {
                          setTimeout(() => {
                            convertirGraficoAImagen(dat.id || '', chartRef.canvas);
                          }, 500);
                        }
                      }}
                    />
                  </div>

                  {/* Leyenda Horizontal Inferior (Exacta al estilo de la captura con puntos circulares) */}
                  <div className="flex flex-wrap items-center justify-center gap-x-6 gap-y-2 mt-4 pt-3.5 border-t border-slate-100/90">
                    {alternativas.map((alt, altIdx) => {
                      const altLetter = (alt.alternativa || '').toLowerCase();
                      const isCorrect = respuestaCorrecta.toLowerCase() === altLetter;
                      const count = Array.isArray(dat.alternativas)
                        ? dat.alternativas.find((a: any) => (a.id || '').toLowerCase() === altLetter)?.cantidad ?? 0
                        : dat[altLetter] || 0;
                      const pct = roundedPercentages[altIdx] || 0;
                      const color = isCorrect ? '#22c55e' : getAlternativaColor(altLetter);
                      const labelLegend =
                        alt.descripcion?.toLowerCase() === 'no respondio'
                          ? 'No respondió'
                          : `Opción ${(alt.alternativa || '').toUpperCase()}`;

                      return (
                        <div
                          key={altIdx}
                          className="inline-flex items-center gap-2 text-xs sm:text-sm font-medium text-slate-500 select-none"
                          title={alt.descripcion ? `${labelLegend}: ${alt.descripcion}` : labelLegend}
                        >
                          <span
                            className="w-2.5 h-2.5 rounded-full shrink-0 shadow-2xs"
                            style={{ backgroundColor: color }}
                            aria-hidden="true"
                          />
                          <span>
                            {labelLegend}{' '}
                            <span className="text-slate-400 font-normal">
                              ({count} • {pct}%)
                            </span>
                            {isCorrect && (
                              <span className="ml-1 text-emerald-600 font-bold" title="Respuesta Correcta">
                                ✓
                              </span>
                            )}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default ReporteEvaluacionPorPregunta;
