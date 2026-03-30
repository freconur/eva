import React, { useState } from 'react';
import ReporteEvaluacionPorPregunta from '@/components/reportes/ReporteEvaluacionPorPregunta';
import { PreguntasRespuestas, DataEstadisticas } from '@/features/types/types';
import { useGlobalContext } from '@/features/context/GlolbalContext';
import styles from './Acordeon.module.css';

interface AcordeonReportePreguntaProps {
  preguntasMap: Map<string, PreguntasRespuestas>;
  iterarPregunta: (idPregunta: string) => JSX.Element;
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
  yearSelected: number;
  dataReportePreguntas: any[];
  loadingReportePreguntas: boolean;
}

const AcordeonReportePregunta: React.FC<AcordeonReportePreguntaProps> = ({
  preguntasMap,
  iterarPregunta,
  obtenerRespuestaPorId,
  iterateData,
  options,
  filtros,
  distritosDisponibles,
  handleChangeFiltros,
  handleRestablecerFiltros,
  yearSelected,
  dataReportePreguntas,
  loadingReportePreguntas
}) => {
  const [mostrarReporte, setMostrarReporte] = useState(false);

  const loading = loadingReportePreguntas;

  const datosParaReporte = Array.isArray(dataReportePreguntas) ? dataReportePreguntas : [];

  const toggleReporte = () => {
    setMostrarReporte(!mostrarReporte);
  };

  return (
    <div className={styles.accordionContainer}>
      <div
        onClick={toggleReporte}
        className={mostrarReporte ? styles.headerOpen : styles.header}
      >
        <div className={styles.titleGroup}>
          <span className={styles.icon}>
            {mostrarReporte ? '📋' : '📊'}
          </span>
          <h3 className={styles.title}>
            Reporte de Evaluación por Pregunta
          </h3>
        </div>
        <div className={mostrarReporte ? styles.chevronOpen : styles.chevron}>
          ▼
        </div>
      </div>

      <div className={`${styles.contentWrapper} ${mostrarReporte ? styles.contentWrapperOpen : ''}`}>
        <div className={`${styles.contentInner} ${mostrarReporte ? styles.innerVisible : ''}`}>
          <ReporteEvaluacionPorPregunta
            reporteDirectorOrdenado={datosParaReporte}
            preguntasMap={preguntasMap}
            iterarPregunta={iterarPregunta}
            obtenerRespuestaPorId={obtenerRespuestaPorId}
            iterateData={iterateData}
            options={options}
            filtros={filtros}
            distritosDisponibles={distritosDisponibles}
            handleChangeFiltros={handleChangeFiltros}
            handleRestablecerFiltros={handleRestablecerFiltros}
            loading={loading}
          />
        </div>
      </div>
    </div>
  );
};

export default AcordeonReportePregunta;
