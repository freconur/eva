import React, { useState } from 'react';
import ReporteEvaluacionPorPregunta from '@/components/reportes/ReporteEvaluacionPorPregunta';
import { PreguntasRespuestas, DataEstadisticas } from '@/features/types/types';
import { useGlobalContext } from '@/features/context/GlolbalContext';
import Loader from '@/components/loader/loader';

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

  // Determinar qué datos usar: reporteDirector si tiene datos, sino reporteDirectorOrdenado
  const datosParaReporte = Array.isArray(reporteDirector) && reporteDirector.length > 0
    ? reporteDirector
    : (Array.isArray(reporteDirectorOrdenado) ? reporteDirectorOrdenado : []);

  const toggleReporte = () => {
    setMostrarReporte(!mostrarReporte);
  };

  return (
    <div style={{
      marginBottom: '20px',
      border: '1px solid #e9ecef',
      borderRadius: '8px',
      backgroundColor: '#ffffff',
      boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
      overflow: 'hidden'
    }}>
      {/* Header del acordeón */}
      <div
        onClick={toggleReporte}
        style={{
          padding: '16px 20px',
          backgroundColor: '#f8f9fa',
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          borderBottom: mostrarReporte ? '1px solid #e9ecef' : 'none',
          transition: 'all 0.3s ease',
          userSelect: 'none'
        }}
        onMouseOver={(e) => {
          e.currentTarget.style.backgroundColor = '#e9ecef';
        }}
        onMouseOut={(e) => {
          e.currentTarget.style.backgroundColor = '#f8f9fa';
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <span style={{ fontSize: '18px' }}>
            {mostrarReporte ? '📋' : '📊'}
          </span>
          <h3 style={{
            margin: 0,
            fontSize: '16px',
            fontWeight: '600',
            color: '#495057'
          }}>
            Reporte de Evaluación por Pregunta
          </h3>
        </div>
        <div style={{
          transform: mostrarReporte ? 'rotate(180deg)' : 'rotate(0deg)',
          transition: 'transform 0.3s ease',
          fontSize: '20px',
          color: '#6c757d'
        }}>
          ▼
        </div>
      </div>

      {/* Contenido del acordeón con animación */}
      <div style={{
        maxHeight: mostrarReporte ? 'none' : '0',
        overflow: 'hidden',
        transition: 'max-height 0.4s ease-in-out, padding 0.3s ease',
        padding: mostrarReporte ? '20px' : '0 20px'
      }}>
        <div style={{
          opacity: mostrarReporte ? 1 : 0,
          transition: 'opacity 0.3s ease',
          transitionDelay: mostrarReporte ? '0.1s' : '0s',
          transform: mostrarReporte ? 'translateY(0)' : 'translateY(-10px)',
          transitionProperty: 'opacity, transform',
          transitionDuration: '0.3s'
        }}>
          {loaderReportePorPregunta ? (
            <div className="flex justify-center items-center h-full">
              <Loader size="large" variant="spinner" color="#4F46E5" text="Cargando datos de reporte por pregunta..." />
            </div>
          ) : (
            datosParaReporte.length === 0 ? (
              <div style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                padding: '40px 20px',
                textAlign: 'center',
                color: '#6c757d',
                backgroundColor: '#f8f9fa',
                borderRadius: '8px',
                border: '2px dashed #dee2e6',
                minHeight: '120px'
              }}>
                <div style={{
                  fontSize: '48px',
                  marginBottom: '16px',
                  opacity: 0.6
                }}>
                  📊
                </div>
                <h4 style={{
                  margin: '0 0 8px 0',
                  fontSize: '18px',
                  fontWeight: '600',
                  color: '#495057'
                }}>
                  Sin datos disponibles
                </h4>
                <p style={{
                  margin: 0,
                  fontSize: '14px',
                  color: '#6c757d',
                  lineHeight: '1.4'
                }}>
                  No se encontraron datos para mostrar en este reporte
                </p>
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

          {/* <ReporteEvaluacionPorPregunta
            reporteDirectorOrdenado={reporteDirectorOrdenado}
            preguntasMap={preguntasMap}
            iterarPregunta={iterarPregunta}
            obtenerRespuestaPorId={obtenerRespuestaPorId}
            iterateData={iterateData}
            options={options}
          /> */}
        </div>
      </div>
    </div>
  );
};

export default AcordeonReportePregunta;
