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
     const pregunta = preguntasMap.get(data.id || '');
 
     // Función para determinar si una opción es la respuesta correcta
     const esRespuestaCorrecta = (opcion: string) => {
       return opcion.toLowerCase() === respuesta.toLowerCase();
     };
 
     const getLabel = (opcion: string, valor: number, porcentaje: number, descripcion?: string) => {
       const labelText = descripcion?.toLowerCase() === 'no respondio' 
         ? `NR` 
         : opcion.toUpperCase();
       const check = esRespuestaCorrecta(opcion) ? ' ✓' : '';
       return `${labelText}(${valor} - ${porcentaje}%)${check}`;
     };
 
     // Obtener las alternativas de la pregunta (o por defecto A, B, C, D)
     let alternativas = pregunta?.alternativas || [
       { alternativa: 'A', descripcion: '', selected: false },
       { alternativa: 'B', descripcion: '', selected: false },
       { alternativa: 'C', descripcion: '', selected: false },
       { alternativa: 'D', descripcion: '', selected: false }
     ];
 
     // Filtrar la alternativa 'no respondio' si su cantidad es 0
     alternativas = alternativas.filter((alt) => {
       if (alt.descripcion?.toLowerCase() === 'no respondio') {
         const key = (alt.alternativa || '').toLowerCase();
         const count = data[key] || 0;
         return count > 0;
       }
       return true;
     });
 
     // Calcular porcentajes para cada opción
     const calcularPorcentaje = (valor: number | undefined) => {
       if (valor === null || valor === undefined) return 0;
       return !data.total || data.total === 0 ? 0 : ((100 * Number(valor)) / Number(data.total));
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
         const rawPct = calcularPorcentaje(data[key] || 0);
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
 
     const labels = alternativas.map((alt, idx) => {
       const key = (alt.alternativa || '').toLowerCase();
       const count = data[key] || 0;
       const pct = roundedPercentages[idx];
       return getLabel(key, count, pct, alt.descripcion);
     });
 
     const chartData = prepareBarChartData(data, respuesta, alternativas.length);
 
     return {
       labels: labels,
       datasets: chartData.datasets
     };
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
        <span className={styles.columnSelectorLabel}>
          Número de columnas:
        </span>
        <div className={styles.gridSelectorWrapper}>
          <button
            type="button"
            className={`${styles.gridButton} ${numeroColumnas === 1 ? styles.active : ''}`}
            onClick={() => setNumeroColumnas(1)}
            title="1 columna"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
              <rect x="4" y="7" width="16" height="3" rx="1.5" />
              <rect x="4" y="14" width="16" height="3" rx="1.5" />
            </svg>
          </button>
          <button
            type="button"
            className={`${styles.gridButton} ${numeroColumnas === 2 ? styles.active : ''}`}
            onClick={() => setNumeroColumnas(2)}
            title="2 columnas"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
              <rect x="4" y="4" width="7" height="7" rx="1.5" />
              <rect x="13" y="4" width="7" height="7" rx="1.5" />
              <rect x="4" y="13" width="7" height="7" rx="1.5" />
              <rect x="13" y="13" width="7" height="7" rx="1.5" />
            </svg>
          </button>
          <button
            type="button"
            className={`${styles.gridButton} ${numeroColumnas === 3 ? styles.active : ''}`}
            onClick={() => setNumeroColumnas(3)}
            title="3 columnas"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
              <rect x="3" y="3" width="4" height="4" rx="1" />
              <rect x="10" y="3" width="4" height="4" rx="1" />
              <rect x="17" y="3" width="4" height="4" rx="1" />
              <rect x="3" y="10" width="4" height="4" rx="1" />
              <rect x="10" y="10" width="4" height="4" rx="1" />
              <rect x="17" y="10" width="4" height="4" rx="1" />
              <rect x="3" y="17" width="4" height="4" rx="1" />
              <rect x="10" y="17" width="4" height="4" rx="1" />
              <rect x="17" y="17" width="4" height="4" rx="1" />
            </svg>
          </button>
        </div>
      </div>

      <div
        className={styles.reportContainer}
        style={{
          '--num-cols': numeroColumnas,
          display: 'grid'
        } as React.CSSProperties}
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
                            }, 500); // Aumentado a 500ms para asegurar renderizado
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
