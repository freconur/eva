import React, { useMemo, useCallback } from 'react';
import { Bar } from 'react-chartjs-2';
import { DataEstadisticas, PreguntasRespuestas } from '@/features/types/types';
import styles from './reporte.module.css';

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
  const iterateData = (data: DataEstadisticas, respuesta: string) => {
    // Usar el número de opciones detectado globalmente
    const numOpciones = detectarNumeroOpciones;

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

    if (numOpciones === 3) {
      // Para 3 opciones: redondear las primeras 2 y calcular la tercera
      const porcentajeA = Math.round(porcentajeARaw);
      const porcentajeB = Math.round(porcentajeBRaw);
      const porcentajeC = Math.max(0, 100 - porcentajeA - porcentajeB);

      // Crear etiquetas solo para las 3 opciones
      const labels = [`a (${porcentajeA}%)`, `b (${porcentajeB}%)`, `c (${porcentajeC}%)`];

      return {
        labels: labels,
        datasets: [
          {
            label: 'estadisticas de respuesta',
            data: [data.a, data.b, data.c],
            backgroundColor: [
              'rgba(52, 152, 219, 0.7)',   // Azul azulado
              'rgba(46, 204, 113, 0.7)',   // Verde esmeralda
              'rgba(155, 89, 182, 0.7)',   // Púrpura
            ],
            borderColor: [
              'rgb(52, 152, 219)',         // Azul azulado
              'rgb(46, 204, 113)',         // Verde esmeralda
              'rgb(155, 89, 182)',         // Púrpura
            ],
            borderWidth: 2,
          },
        ],
      };
    } else {
      // Para 4 opciones: redondear las primeras 3 y calcular la cuarta
      const porcentajeA = Math.round(porcentajeARaw);
      const porcentajeB = Math.round(porcentajeBRaw);
      const porcentajeC = Math.round(porcentajeCRaw);
      const porcentajeD = Math.max(0, 100 - porcentajeA - porcentajeB - porcentajeC);

      // Crear etiquetas para las 4 opciones
      const labels = [`a (${porcentajeA}%)`, `b (${porcentajeB}%)`, `c (${porcentajeC}%)`, `d (${porcentajeD}%)`];

      return {
        labels: labels,
        datasets: [
          {
            label: 'estadisticas de respuesta',
            data: [data.a, data.b, data.c, data.d],
            backgroundColor: [
              'rgba(52, 152, 219, 0.7)',   // Azul azulado
              'rgba(46, 204, 113, 0.7)',   // Verde esmeralda
              'rgba(155, 89, 182, 0.7)',   // Púrpura
              'rgba(230, 126, 34, 0.7)',   // Naranja
            ],
            borderColor: [
              'rgb(52, 152, 219)',         // Azul azulado
              'rgb(46, 204, 113)',         // Verde esmeralda
              'rgb(155, 89, 182)',         // Púrpura
              'rgb(230, 126, 34)',         // Naranja
            ],
            borderWidth: 2,
          },
        ],
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
    },
  };

  // Función optimizada para renderizar pregunta usando el mapa
  const renderPregunta = useCallback((idPregunta: string) => {
    const pregunta = preguntasMap.get(idPregunta);
    if (!pregunta) {
      return <p>Pregunta no encontrada</p>;
    }
    return (
      <>
        <h3 className={styles.questionTitle}>
          {pregunta.pregunta}
        </h3>
        <h4 className={styles.questionSubtitle}>
          <strong>Actuación</strong>: {pregunta.preguntaDocente}
        </h4>
      </>
    );
  }, [preguntasMap]);

  // Función optimizada para obtener respuesta usando el mapa
  const obtenerRespuestaPorId = useCallback((idPregunta: string): string => {
    const pregunta = preguntasMap.get(idPregunta);
    return pregunta?.respuesta || '';
  }, [preguntasMap]);

  return (
    <>
      <h1 className={styles.title}>Reporte de Evaluación</h1>
      <div className={styles.reportContainer}>
        {warningEvaEstudianteSinRegistro ? (
          <div className={styles.warningContainer}>{warningEvaEstudianteSinRegistro}</div>
        ) : (
          dataEstadisticasOrdenadas?.map((dat, index) => {
            const pregunta = preguntasMap.get(dat.id || '');
            const numeroOrden = pregunta?.order || index + 1;
            return (
              <div key={dat.id || index} className={styles.questionCard}>
                {/* Header de la pregunta */}
                <div className={styles.questionHeader}>
                  <div className={styles.questionNumber}>
                    <span className={styles.numberBadge}>{index + 1}</span>
                  </div>
                  <div className={styles.questionContent}>
                    {renderPregunta(`${dat.id}`)}
                  </div>
                </div>

                {/* Contenedor principal del gráfico y estadísticas */}
                <div className={styles.analyticsContainer}>
                  {/* Gráfico principal */}
                  <div className={styles.chartSection}>
                    <div className={styles.chartHeader}>
                      <h4 className={styles.chartTitle}>Distribución de Respuestas</h4>
                      <div className={styles.chartLegend}>
                        <span className={styles.legendItem}>
                          <span className={`${styles.legendColor} ${styles.legendColorA}`}></span>
                          Opción A
                        </span>
                        <span className={styles.legendItem}>
                          <span className={`${styles.legendColor} ${styles.legendColorB}`}></span>
                          Opción B
                        </span>
                        <span className={styles.legendItem}>
                          <span className={`${styles.legendColor} ${styles.legendColorC}`}></span>
                          Opción C
                        </span>
                        {detectarNumeroOpciones === 4 && (
                          <span className={styles.legendItem}>
                            <span className={`${styles.legendColor} ${styles.legendColorD}`}></span>
                            Opción D
                          </span>
                        )}
                      </div>
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
                          },
                        }}
                        data={iterateData(
                          dat,
                          obtenerRespuestaPorId(`${dat.id}`)
                        )}
                        width={600}
                        height={400}
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

                  {/* Contenedor de estadísticas y respuesta correcta */}
                  <div className={styles.bottomPanelsContainer}>
                    {/* Panel de respuesta correcta */}
                    <div className={styles.answerPanel}>
                      <span className={styles.answerText}>
                        <strong>Respuesta correcta:</strong> {obtenerRespuestaPorId(`${dat.id}`)}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>
    </>
  );
};

export default ReporteEvaluacionPorPregunta;
