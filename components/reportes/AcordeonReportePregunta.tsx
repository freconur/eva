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
  handleFiltrar?: () => void;
  yearSelected: number;
  dataReportePreguntas: any[];
  loadingReportePreguntas: boolean;
  questionColumns: number;
  setQuestionColumns: (val: number) => void;
  globalStyles?: any;
  mostrarDistrito?: boolean;
}

import { MdViewStream, MdGridView, MdViewModule } from 'react-icons/md';

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
  handleFiltrar,
  yearSelected,
  dataReportePreguntas,
  loadingReportePreguntas,
  questionColumns,
  setQuestionColumns,
  globalStyles = {},
  mostrarDistrito = false
}) => {
  const [mostrarReporte, setMostrarReporte] = useState(false);

  const loading = loadingReportePreguntas;

  const datosParaReporte = Array.isArray(dataReportePreguntas) ? dataReportePreguntas : [];

  const toggleReporte = () => {
    setMostrarReporte(!mostrarReporte);
  };

  return (
    <div className={styles.accordionContainer}>
      <div className={mostrarReporte ? styles.headerOpen : styles.header}>
        <div onClick={toggleReporte} className={styles.titleGroup} style={{ flex: 1, cursor: 'pointer' }}>
          <span className={styles.icon}>
            {mostrarReporte ? '📋' : '📊'}
          </span>
          <h3 className={styles.title}>
            Reporte de Evaluación por Pregunta
          </h3>
        </div>

        {mostrarReporte && (
          <div className={globalStyles.layoutSelector} style={{ marginRight: '1rem' }}>
            <button
              className={`${globalStyles.layoutButton} ${questionColumns === 1 ? globalStyles.layoutButtonActive : ''}`}
              onClick={() => setQuestionColumns(1)}
              title="1 Columna"
            >
              <MdViewStream />
            </button>
            <button
              className={`${globalStyles.layoutButton} ${questionColumns === 2 ? globalStyles.layoutButtonActive : ''}`}
              onClick={() => setQuestionColumns(2)}
              title="2 Columnas"
            >
              <MdGridView />
            </button>
            <button
              className={`${globalStyles.layoutButton} ${questionColumns === 3 ? globalStyles.layoutButtonActive : ''}`}
              onClick={() => setQuestionColumns(3)}
              title="3 Columnas"
            >
              <MdViewModule />
            </button>
          </div>
        )}

        <div onClick={toggleReporte} className={mostrarReporte ? styles.chevronOpen : styles.chevron} style={{ cursor: 'pointer' }}>
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
            handleFiltrar={handleFiltrar}
            loading={loading}
            columns={questionColumns}
            globalStyles={globalStyles}
            mostrarDistrito={mostrarDistrito}
          />
        </div>
      </div>
    </div>
  );
};

export default AcordeonReportePregunta;
