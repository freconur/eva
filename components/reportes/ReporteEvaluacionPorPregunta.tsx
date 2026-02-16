import React, { useState } from 'react';
import { Bar } from 'react-chartjs-2';
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
    caracteristicaCurricular: string;
    genero: string;
    area: string;
  };
  distritosDisponibles: string[];
  handleChangeFiltros: (e: React.ChangeEvent<HTMLSelectElement>) => void;
  handleFiltrar: () => void;
  handleRestablecerFiltros: () => void;
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
  handleFiltrar,
  handleRestablecerFiltros,
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
        handleFiltrar={handleFiltrar}
        handleRestablecerFiltros={handleRestablecerFiltros}
      />

      <h2 className={styles.reportTitle}>Detalle por Pregunta</h2>

      <div className={styles.questionsList}>
        {reporteDirectorOrdenado?.map((dat: DataEstadisticas, index: number) => {
          const id = dat.id || '';
          const correctKey = obtenerRespuestaPorId(id);

          return (
            <div key={index} className={styles.questionContainer}>
              <div className={styles.questionHeader}>
                <span className={styles.questionNumber}>{index + 1}.</span>
                <div className={styles.questionContent}>
                  {iterarPregunta(id)}
                </div>
              </div>

              <div className={styles.chartContainer}>
                <div className={styles.chartWrapper}>
                  <Bar
                    options={options}
                    data={iterateData(dat, correctKey)}
                  />
                </div>
              </div>

              <div className={styles.statsGrid}>
                {Object.entries(dat)
                  .filter(([key]) => key !== 'id' && key !== 'total')
                  .sort(([a], [b]) => a.localeCompare(b))
                  .map(([key, value]) => {
                    const description = getAlternativeDescription(id, key);
                    const percentage = dat.total === 0 ? 0 : Math.round((100 * Number(value)) / Number(dat.total));

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
                          <span>{key.toUpperCase()}: <span className={styles.statValue}>{value}</span></span>
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
                  })}
              </div>

              <div className={styles.answerContainer}>
                <span>Respuesta correcta:</span>
                <span className={styles.answerText}>
                  {correctKey.toUpperCase()}
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default ReporteEvaluacionPorPregunta;
