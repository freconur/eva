import React, { useState } from 'react';
import { Bar } from 'react-chartjs-2';
import Loader from '../loader/loader';
import { DataEstadisticas, PreguntasRespuestas } from '@/features/types/types';
import styles from './QuestionReport.module.css';
import FiltrosReporte from './FiltrosReporte';

interface ReporteEvaluacionPorPreguntaProps {
  reporteDirectorOrdenado: DataEstadisticas[];
  preguntasMap: Map<string, PreguntasRespuestas>;
  iterarPregunta: (idPregunta: string) => React.ReactNode;
  obtenerRespuestaPorId: (idPregunta: string) => string;
  iterateData: (data: DataEstadisticas, respuesta: string) => any;
  options: any;
  filtros: {
    region: string;
    distrito: string;
    genero: string;
    area: string;
  };
  distritosDisponibles: string[];
  handleChangeFiltros: (e: React.ChangeEvent<HTMLSelectElement>) => void;
  handleRestablecerFiltros: () => void;
  handleFiltrar?: () => void;
  loading?: boolean;
  columns?: number;
  globalStyles?: any;
  mostrarDistrito?: boolean;
}

  const ReporteEvaluacionPorPregunta: React.FC<ReporteEvaluacionPorPreguntaProps> = ({
  reporteDirectorOrdenado,
  preguntasMap,
  iterarPregunta,
  obtenerRespuestaPorId,
  iterateData,
  options,
  filtros,
  distritosDisponibles,
  handleChangeFiltros,
  handleRestablecerFiltros,
  handleFiltrar,
  loading = false,
  columns = 2,
  globalStyles = {},
  mostrarDistrito = false,
}) => {
  const [popoverData, setPopoverData] = useState<{
    preguntaId: string;
    alternativa: string;
    description: string;
    show: boolean;
  } | null>(null);

  // Función para obtener la descripción de una alternativa
  const getAlternativeDescription = (preguntaId: string, alternativaKey: string): string => {
    const pregunta = preguntasMap.get(preguntaId);
    if (!pregunta?.alternativas) return '';

    const alternativa = pregunta.alternativas.find(alt =>
      alt.alternativa?.toLowerCase() === alternativaKey.toLowerCase()
    );

    return alternativa?.descripcion || '';
  };

  return (
    <div className={styles.reportContainer}>
      <FiltrosReporte
        filtros={filtros}
        distritosDisponibles={distritosDisponibles}
        handleChangeFiltros={handleChangeFiltros}
        handleRestablecerFiltros={handleRestablecerFiltros}
        handleFiltrar={handleFiltrar}
        loading={loading}
        soloUgel={true}
        mostrarDistrito={mostrarDistrito}
      />

      <h2 className={styles.reportTitle}>Detalle por Pregunta</h2>

      <div className={loading ? styles.loadingWrapper : (reporteDirectorOrdenado?.length > 0 ? globalStyles.chartsGrid : styles.questionsList)}>
        {loading ? (
          <Loader size="large" variant="spinner" color="#3b82f6" text="Procesando reporte..." />
        ) : reporteDirectorOrdenado?.length === 0 ? (
          <div className={styles.emptyState}>
            <div className={styles.emptyIcon}>📊</div>
            <h4 className={styles.emptyTitle}>Sin resultados</h4>
            <p className={styles.emptyText}>No se encontraron datos para los filtros seleccionados. Intenta con otros parámetros.</p>
          </div>
        ) : (
          reporteDirectorOrdenado
            ?.filter((dat: DataEstadisticas) => preguntasMap.has(dat.id || ''))
            .map((dat: DataEstadisticas, index: number) => {
              const id = dat.id || '';
              const correctKey = obtenerRespuestaPorId(id);

              return (
                <div key={index} className={`${styles.questionContainer} ${columns === 1 ? globalStyles.gridItemFull : columns === 2 ? globalStyles.gridItemHalf : globalStyles.gridItemThird}`}>
                  <div className={styles.questionHeader}>
                    <span className={styles.questionNumber}>{index + 1}.</span>
                    <div className={styles.questionContent}>
                      {iterarPregunta(id)}
                    </div>
                  </div>

                  <div className={styles.chartContainer}>
                    <div className={styles.chartWrapper}>
                      {dat && (
                        <Bar
                          options={options}
                          data={iterateData(dat, correctKey)}
                        />
                      )}
                    </div>
                  </div>

                  <div className={styles.statsGrid}>
                    {dat?.alternativas && Array.isArray(dat.alternativas) ? (
                      // RENDERIZADO DINÁMICO (NUEVO)
                      dat.alternativas.map((alt: any) => {
                        const key = alt?.id;
                        const value = alt?.cantidad ?? 0;
                        const description = getAlternativeDescription(id, key);
                        const total = dat?.total ?? 1; // Evitar división por cero
                        const percentage = Math.round((100 * Number(value)) / Number(total));

                        if (!key) return null;

                        return (
                          <div key={key} className={styles.statItemWrapper}>
                            <div
                              className={`${styles.statItem} ${alt?.esCorrecta ? styles.statItemCorrect : ''}`}
                              onMouseEnter={() => {
                                if (description) {
                                  setPopoverData({
                                    preguntaId: id,
                                    alternativa: key,
                                    description: description,
                                    show: true
                                  });
                                }
                              }}
                              onMouseLeave={() => {
                                setPopoverData(prev => prev ? { ...prev, show: false } : null);
                              }}
                            >
                              <span>{String(key).toUpperCase()}: <span className={styles.statValue}>{value}</span></span>
                              <span className={styles.statPercentage}>{percentage}%</span>
                            </div>

                            {popoverData?.show &&
                              popoverData.preguntaId === id &&
                              popoverData.alternativa === key && (
                                <div className={styles.popover}>
                                  <div className={styles.popoverContent}>
                                    <div className={styles.popoverHeader}>Alternativa {popoverData.alternativa}</div>
                                    {popoverData.description}
                                  </div>
                                  <div className={styles.popoverArrow}></div>
                                </div>
                              )}
                          </div>
                        );
                      })
                    ) : (
                      // RESPALDO ESTRUCTURA ANTIGUA
                      Object.entries(dat || {})
                        .filter(([key]) => key !== 'id' && key !== 'total' && key !== 'question_order' && key !== 'order' && key !== 'alternativas')
                        .sort(([a], [b]) => a.localeCompare(b))
                        .map(([key, value]) => {
                          const description = getAlternativeDescription(id, key);
                          const total = (dat as any)?.total ?? 1;
                          const percentage = Math.round((100 * (value as number)) / Number(total));

                          return (
                            <div key={key} className={styles.statItemWrapper}>
                              <div
                                className={styles.statItem}
                                onMouseEnter={() => {
                                  if (description) {
                                    setPopoverData({
                                      preguntaId: id,
                                      alternativa: key,
                                      description: description,
                                      show: true
                                    });
                                  }
                                }}
                                onMouseLeave={() => {
                                  setPopoverData(prev => prev ? { ...prev, show: false } : null);
                                }}
                              >
                                <span>{key.toUpperCase()}: <span className={styles.statValue}>{value as React.ReactNode}</span></span>
                                <span className={styles.statPercentage}>{percentage}%</span>
                              </div>

                              {popoverData?.show &&
                                popoverData.preguntaId === id &&
                                popoverData.alternativa === key && (
                                  <div className={styles.popover}>
                                    <div className={styles.popoverContent}>
                                      <div className={styles.popoverHeader}>Alternativa {popoverData.alternativa}</div>
                                      {popoverData.description}
                                    </div>
                                    <div className={styles.popoverArrow}></div>
                                  </div>
                                )}
                            </div>
                          );
                        })
                    )}
                  </div>

                  <div className={styles.answerContainer}>
                    <span>Respuesta correcta:</span>
                    <span className={styles.answerText}>
                      {correctKey.toUpperCase()}
                    </span>
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
