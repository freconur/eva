import React, { useMemo, useCallback, useState } from 'react';
import { Bar } from 'react-chartjs-2';
import { DataEstadisticas, PreguntasRespuestas } from '@/features/types/types';
import styles from './reporte.module.css';
import { useColorsFromCSS } from '@/features/hooks/useColorsFromCSS';

interface ReporteEvaluacionPorPreguntaProps {
  dataEstadisticasOrdenadas: DataEstadisticas[];
  preguntasMap: Map<string, PreguntasRespuestas>;
  detectarNumeroOpciones: number;
  warningEvaEstudianteSinRegistro?: string;
  convertirGraficoAImagen: (idPregunta: string, canvasRef: HTMLCanvasElement | null) => void;
}

const ReporteEvaluacionPorPregunta: React.FC<ReporteEvaluacionPorPreguntaProps> = ({
  dataEstadisticasOrdenadas,
  preguntasMap,
  detectarNumeroOpciones,
  warningEvaEstudianteSinRegistro,
  convertirGraficoAImagen
}) => {
  // Estado para controlar el número de columnas (por defecto 2)
  const [numeroColumnas, setNumeroColumnas] = useState<number>(2);

  const { prepareBarChartData } = useColorsFromCSS();
  const iterateData = (data: DataEstadisticas, respuesta: string) => {
    // Usar el número de opciones detectado globalmente
    const numOpciones = detectarNumeroOpciones;
    const pregunta = preguntasMap.get(data.id || '');

    // Calcular porcentajes para cada opción
    const calcularPorcentaje = (valor: number | undefined) => {
      if (valor === null || valor === undefined) return 0;
      return data.total === 0 ? 0 : ((100 * Number(valor)) / Number(data.total));
    };

    // Calcular porcentajes sin redondear
    const porcentajeARaw = calcularPorcentaje(data.a || 0);
    const porcentajeBRaw = calcularPorcentaje(data.b || 0);
    const porcentajeCRaw = calcularPorcentaje(data.c || 0);
    const porcentajeDRaw = numOpciones === 4 ? calcularPorcentaje(data.d || 0) : 0;

    // Función para determinar si una opción es la respuesta correcta
    const esRespuestaCorrecta = (opcion: string) => {
      return opcion.toLowerCase() === respuesta.toLowerCase();
    };

    const getLabel = (opcion: string) => {
      const label = opcion.toUpperCase();
      return `${label}${esRespuestaCorrecta(opcion) ? ' ✓' : ''}`;
    };

    if (numOpciones === 3) {
      // Para 3 opciones: redondear las primeras 2 y calcular la tercera
      const porcentajeA = Math.round(porcentajeARaw);
      const porcentajeB = Math.round(porcentajeBRaw);
      // @ts-ignore
      const porcentajeC = Math.max(0, 100 - porcentajeA - porcentajeB);

      // Crear etiquetas solo para las 3 opciones con check para la respuesta correcta
      const labels = [
        getLabel('a'),
        getLabel('b'),
        getLabel('c')
      ];

      // Usar el hook para preparar los datos del gráfico
      const chartData = prepareBarChartData(data, respuesta, 3);

      return {
        labels: labels,
        datasets: chartData.datasets
      };
    } else {
      // Para 4 opciones: redondear las primeras 3 y calcular la cuarta
      const porcentajeA = Math.round(porcentajeARaw);
      const porcentajeB = Math.round(porcentajeBRaw);
      const porcentajeC = Math.round(porcentajeCRaw);
      // @ts-ignore
      const porcentajeD = Math.max(0, 100 - porcentajeA - porcentajeB - porcentajeC);

      // Crear etiquetas para las 4 opciones con check para la respuesta correcta
      const labels = [
        getLabel('a'),
        getLabel('b'),
        getLabel('c'),
        getLabel('d')
      ];

      // Usar el hook para preparar los datos del gráfico
      const chartData = prepareBarChartData(data, respuesta, 4);

      return {
        labels: labels,
        datasets: chartData.datasets
      };
    }
  };

  const options = {
    plugins: {
      legend: {
        position: 'center' as const,
      },
      title: {
        display: true,
        text: 'estadistica de respuestas',
      },
      tooltip: {
        enabled: true,
        mode: 'index' as const,
        intersect: false,
        backgroundColor: 'rgba(0, 0, 0, 0.8)',
        titleColor: '#ffffff',
        bodyColor: '#ffffff',
        borderColor: '#22c55e',
        borderWidth: 1,
        cornerRadius: 8,
        displayColors: true,
      }
    },
    scales: {
      x: {
        ticks: {
          color: function (context: any) {
            const label = context.tick.label;
            // Si la etiqueta contiene un check, usar color verde
            if (label && label.includes('✓')) {
              return '#22c55e';
            }
            return '#374151';
          },
          font: {
            family: 'Inter, -apple-system, BlinkMacSystemFont, sans-serif',
            size: 12,
            weight: 'bold' as const
          }
        }
      },
      y: {
        ticks: {
          color: '#6b7280',
          font: {
            family: 'Inter, -apple-system, BlinkMacSystemFont, sans-serif',
            size: 11
          }
        }
      }
    },
    interaction: {
      mode: 'index' as const,
      intersect: false
    },
    onHover: (event: any, activeElements: any) => {
      if (event.native) {
        // @ts-ignore
        event.native.target.style.cursor = activeElements.length > 0 ? 'pointer' : 'default';
      }
    }
  };

  // Función optimizada para obtener respuesta usando el mapa
  const obtenerRespuestaPorId = useCallback((idPregunta: string): string => {
    const pregunta = preguntasMap.get(idPregunta);
    return pregunta?.respuesta || '';
  }, [preguntasMap]);

  return (
    <div className={styles.containerPrincipal}>
      <h1 className={styles.title}>Reporte de Evaluación</h1>

      {/* Selector de número de columnas */}
      <div className={styles.columnSelectorContainer}>
        <label className={styles.columnSelectorLabel}>
          Número de columnas:
        </label>
        <select
          className={styles.columnSelector}
          value={numeroColumnas}
          onChange={(e) => setNumeroColumnas(Number(e.target.value))}
        >
          <option value={1}>1 Columna</option>
          <option value={2}>2 Columnas</option>
          <option value={3}>3 Columnas</option>
        </select>
      </div>

      <div
        className={styles.reportContainer}
        style={{
          gridTemplateColumns: `repeat(${numeroColumnas}, 1fr)`,
          display: 'grid'
        }}
      >
        {warningEvaEstudianteSinRegistro ? (
          <div className={styles.warningContainer}>{warningEvaEstudianteSinRegistro}</div>
        ) : (
          dataEstadisticasOrdenadas?.map((dat, index) => {
            const pregunta = preguntasMap.get(dat.id || '');
            return (
              <div key={dat.id || index} className={styles.questionCard}>
                {/* Header de la pregunta */}
                <div className={styles.questionHeader}>
                  <div className={styles.questionContent}>
                    <h3 className={styles.questionTitle}>
                      {index + 1}. {pregunta?.pregunta}
                    </h3>
                    <h4 className={styles.questionSubtitle}>
                      <strong>Actuación</strong>: {pregunta?.preguntaDocente}
                    </h4>
                  </div>
                </div>

                {/* Contenedor principal del gráfico y estadísticas */}
                <div className={styles.analyticsContainer}>
                  {/* Gráfico principal */}
                  <div className={styles.chartSection}>
                    <div className={styles.chartHeader}>
                      <h4 className={styles.chartTitle}>Distribución de Respuestas</h4>
                    </div>

                    <div className={styles.chartWrapper}>
                      <Bar
                        options={{
                          ...options,
                          responsive: true,
                          maintainAspectRatio: false,
                          plugins: {
                            ...options.plugins,
                            legend: {
                              display: false,
                            },
                            title: {
                              display: false,
                            },
                            tooltip: {
                              ...options.plugins?.tooltip,
                              callbacks: {
                                title: function (context: any) {
                                  const labelChar = context[0].label.charAt(0).toUpperCase();
                                  return `Opción ${labelChar}`;
                                },
                                label: function (context: any) {
                                  const value = context.parsed.y;
                                  const total = context.dataset.data.reduce((a: number, b: number) => a + b, 0);
                                  const percentage = total > 0 ? ((value / total) * 100).toFixed(1) : 0;

                                  const labelStr = context.label as string;
                                  const char = labelStr.charAt(0).toLowerCase();
                                  const alt = pregunta?.alternativas?.find(a => a.alternativa?.toLowerCase() === char);
                                  const fullDescription = alt?.descripcion || '';

                                  return [
                                    fullDescription ? `Opción: ${fullDescription}` : '',
                                    `Resultados: ${value} de ${total} (${percentage}%)`
                                  ].filter(Boolean);
                                }
                              }
                            }
                          },
                        }}
                        data={iterateData(
                          dat,
                          obtenerRespuestaPorId(`${dat.id}`)
                        )}
                        // @ts-ignore
                        ref={(chartRef) => {
                          if (chartRef && chartRef.canvas) {
                            setTimeout(() => {
                              convertirGraficoAImagen(dat.id || '', chartRef.canvas);
                            }, 100);
                          }
                        }}
                      />
                    </div>
                  </div>

                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};

export default ReporteEvaluacionPorPregunta;
