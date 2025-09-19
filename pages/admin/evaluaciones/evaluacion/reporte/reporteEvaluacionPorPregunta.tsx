import React from 'react';
import { Bar } from 'react-chartjs-2';
import { DataEstadisticas, PreguntasRespuestas } from '@/features/types/types';
import styles from './Reporte.module.css';

interface ReporteEvaluacionPorPreguntaProps {
  reporteDirectorOrdenado: DataEstadisticas[];
  preguntasMap: Map<string, PreguntasRespuestas>;
  iterarPregunta: (idPregunta: string) => React.ReactNode;
  obtenerRespuestaPorId: (idPregunta: string) => string;
  iterateData: (data: DataEstadisticas, respuesta: string) => any;
  options: any;
}

const ReporteEvaluacionPorPregunta: React.FC<ReporteEvaluacionPorPreguntaProps> = ({
  reporteDirectorOrdenado,
  preguntasMap,
  iterarPregunta,
  obtenerRespuestaPorId,
  iterateData,
  options,
}) => {
  return (
    <div className={styles.reportContainer}>
      <h1 className={styles.reportTitle}>reporte de evaluación</h1>
      <div>
        <div>
          {reporteDirectorOrdenado?.map((dat: DataEstadisticas, index: number) => {
            // Encontrar la pregunta correspondiente por su id
            const preguntaCorrespondiente = preguntasMap.get(dat.id || '');

            return (
              <div key={index} className={styles.questionContainer}>
                {index + 1}.{iterarPregunta(dat.id || '')}
                <div className={styles.chartContainer}>
                  <div className={styles.chartWrapper}>
                    <Bar
                      className={styles.chart}
                      options={options}
                      data={iterateData(dat, obtenerRespuestaPorId(dat.id || ''))}
                    />
                  </div>
                  <div className={styles.statsContainer}>
                    {Object.entries(dat)
                      .filter(([key]) => key !== 'id' && key !== 'total')
                      .map(([key, value]) => (
                        <p key={key}>
                          {key}: {value} |{' '}
                          {dat.total === 0
                            ? 0
                            : ((100 * Number(value)) / Number(dat.total)).toFixed(0)}
                          %
                        </p>
                      ))}
                  </div>
                  <div className={styles.answerContainer}>
                    respuesta:
                    <span className={styles.answerText}>
                      {obtenerRespuestaPorId(dat.id || '')}
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default ReporteEvaluacionPorPregunta;