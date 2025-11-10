import React, { useState } from 'react';
import { Bar } from 'react-chartjs-2';
import { DataEstadisticas, PreguntasRespuestas } from '@/features/types/types';
import styles from '@/pages/admin/evaluaciones/evaluacion/reporte/Reporte.module.css';
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
                      .sort(([a], [b]) => a.localeCompare(b))
                      .map(([key, value]) => {
                        const description = getAlternativeDescription(dat.id || '', key);
                        return (
                          <div key={key} className={styles.statItemWrapper}>
                            <p 
                              className={styles.statItem}
                              onMouseEnter={() => {
                                if (description) {
                                  setPopoverData({
                                    preguntaId: dat.id || '',
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
                              {key}: {value} |{' '}
                              {dat.total === 0
                                ? 0
                                : ((100 * Number(value)) / Number(dat.total)).toFixed(0)}
                              %
                            </p>
                            
                            {/* Popover */}
                            {popoverData?.show && 
                             popoverData.preguntaId === dat.id && 
                             popoverData.alternativa === key && (
                              <div className={styles.popover}>
                                <div className={styles.popoverContent}>
                                  <div className={styles.popoverHeader}>
                                    <strong>{popoverData.alternativa}</strong>
                                  </div>
                                  <div className={styles.popoverBody}>
                                    {popoverData.description}
                                  </div>
                                </div>
                                <div className={styles.popoverArrow}></div>
                              </div>
                            )}
                          </div>
                        );
                      })}
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

