import React, { useState } from 'react';
import ReporteEvaluacionPorPregunta from '@/components/reportes/ReporteEvaluacionPorPregunta';
import { PreguntasRespuestas, DataEstadisticas } from '@/features/types/types';
import { useGlobalContext } from '@/features/context/GlolbalContext';
import Loader from '@/components/loader/loader';
import styles from './Acordeon.module.css';

interface AcordeonReportePreguntaProps {
  reporteDirectorOrdenado: any[];
  preguntasMap: Map<string, PreguntasRespuestas>;
  iterarPregunta: (idPregunta: string) => JSX.Element;
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
  yearSelected: number;
}

const AcordeonReportePregunta: React.FC<AcordeonReportePreguntaProps> = ({
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
  yearSelected
}) => {
  const [mostrarReporte, setMostrarReporte] = useState(false);
  const { loaderReportePorPregunta, reporteDirector } = useGlobalContext();

  const datosParaReporte = Array.isArray(reporteDirector) && reporteDirector.length > 0
    ? reporteDirector
    : (Array.isArray(reporteDirectorOrdenado) ? reporteDirectorOrdenado : []);

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
          {loaderReportePorPregunta ? (
            <div className="flex justify-center items-center py-10">
              <Loader size="large" variant="spinner" color="#3b82f6" text="Cargando datos..." />
            </div>
          ) : (
            datosParaReporte.length === 0 ? (
              <div className={styles.emptyState}>
                <div className={styles.emptyIcon}>📊</div>
                <h4 className={styles.emptyTitle}>Sin datos disponibles</h4>
                <p className={styles.emptyText}>No se encontraron datos para mostrar en este reporte</p>
              </div>
            ) : (
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
                handleFiltrar={handleFiltrar}
                handleRestablecerFiltros={handleRestablecerFiltros}
              />
            )
          )}
        </div>
      </div>
    </div>
  );
};

export default AcordeonReportePregunta;
