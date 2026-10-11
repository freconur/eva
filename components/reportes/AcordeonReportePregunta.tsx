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
  hideUgelSelect?: boolean;
  isDirectView?: boolean;
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
  mostrarDistrito = false,
  hideUgelSelect = false,
  isDirectView = false,
}) => {
  const [mostrarReporte, setMostrarReporte] = useState(false);
  const activo = isDirectView ? true : mostrarReporte;

  const loading = loadingReportePreguntas;

  const datosParaReporte = Array.isArray(dataReportePreguntas) ? dataReportePreguntas : [];

  const toggleReporte = () => {
    setMostrarReporte(!mostrarReporte);
  };

  return (
    <div className={isDirectView ? 'w-full' : styles.accordionContainer}>
      {isDirectView ? (
        <div className="flex items-center justify-between gap-3 pb-3 mb-4 border-b border-slate-100 flex-wrap">
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
              Columnas de visualización:
            </span>
          </div>
          <div className="inline-flex items-center p-1 bg-slate-100 rounded-xl border border-slate-200/90 shadow-2xs">
            <button
              type="button"
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all duration-150 flex items-center gap-1.5 cursor-pointer ${
                questionColumns === 1
                  ? 'bg-white text-blue-700 shadow-xs font-bold'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
              }`}
              onClick={() => setQuestionColumns(1)}
              title="1 Columna"
            >
              <MdViewStream className="w-4 h-4" />
              <span className="hidden sm:inline">1 Columna</span>
            </button>
            <button
              type="button"
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all duration-150 flex items-center gap-1.5 cursor-pointer ${
                questionColumns === 2
                  ? 'bg-white text-blue-700 shadow-xs font-bold'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
              }`}
              onClick={() => setQuestionColumns(2)}
              title="2 Columnas"
            >
              <MdGridView className="w-4 h-4" />
              <span className="hidden sm:inline">2 Columnas</span>
            </button>
            <button
              type="button"
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all duration-150 flex items-center gap-1.5 cursor-pointer ${
                questionColumns === 3
                  ? 'bg-white text-blue-700 shadow-xs font-bold'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
              }`}
              onClick={() => setQuestionColumns(3)}
              title="3 Columnas"
            >
              <MdViewModule className="w-4 h-4" />
              <span className="hidden sm:inline">3 Columnas</span>
            </button>
          </div>
        </div>
      ) : (
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
      )}

      <div className={isDirectView ? 'w-full' : `${styles.contentWrapper} ${mostrarReporte ? styles.contentWrapperOpen : ''}`}>
        <div className={isDirectView ? 'w-full' : `${styles.contentInner} ${mostrarReporte ? styles.innerVisible : ''}`}>
          {activo && (
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
              hideUgelSelect={hideUgelSelect}
            />
          )}
        </div>
      </div>
    </div>
  );
};

export default AcordeonReportePregunta;
