import React, { useState, useEffect } from 'react';
import { 
  calcularTiempoEstimado, 
  obtenerColorClasificacion, 
  obtenerIconoClasificacion,
  ESTIMACIONES_PREDETERMINADAS,
  EstimacionTiempo
} from '@/fuctions/timeEstimation';

interface EstimacionTiempoProps {
  numeroDirectores?: number;
  mostrarDetalles?: boolean;
  mostrarEscenarios?: boolean;
  onEstimacionCalculada?: (estimacion: EstimacionTiempo) => void;
}

const EstimacionTiempoComponent: React.FC<EstimacionTiempoProps> = ({
  numeroDirectores = 1200,
  mostrarDetalles = true,
  mostrarEscenarios = false,
  onEstimacionCalculada
}) => {
  const [estimacion, setEstimacion] = useState<EstimacionTiempo | null>(null);
  const [directoresInput, setDirectoresInput] = useState(numeroDirectores);

  useEffect(() => {
    const nuevaEstimacion = calcularTiempoEstimado(directoresInput);
    setEstimacion(nuevaEstimacion);
    onEstimacionCalculada?.(nuevaEstimacion);
  }, [directoresInput, onEstimacionCalculada]);

  if (!estimacion) return null;

  const colorPrincipal = obtenerColorClasificacion(estimacion.clasificacion);
  const icono = obtenerIconoClasificacion(estimacion.clasificacion);

  return (
    <div style={{ 
      border: `2px solid ${colorPrincipal}`, 
      borderRadius: '8px', 
      padding: '16px', 
      margin: '16px 0',
      backgroundColor: '#f9fafb'
    }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', marginBottom: '12px' }}>
        <span style={{ fontSize: '24px', marginRight: '8px' }}>{icono}</span>
        <h3 style={{ margin: 0, color: colorPrincipal }}>
          Estimación de Tiempo de Procesamiento
        </h3>
      </div>

      {/* Input para número de directores */}
      <div style={{ marginBottom: '16px' }}>
        <label style={{ display: 'block', fontWeight: 'bold', marginBottom: '4px' }}>
          📊 Número de Directores:
        </label>
        <input
          type="number"
          value={directoresInput}
          onChange={(e) => setDirectoresInput(Math.max(1, parseInt(e.target.value) || 1))}
          style={{
            padding: '8px',
            border: '1px solid #d1d5db',
            borderRadius: '4px',
            width: '150px',
            fontSize: '16px'
          }}
          min="1"
          max="5000"
        />
      </div>

      {/* Información principal */}
      <div style={{ 
        display: 'grid', 
        gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', 
        gap: '12px',
        marginBottom: '16px'
      }}>
        <div style={{ padding: '12px', backgroundColor: 'white', borderRadius: '6px' }}>
          <div style={{ fontWeight: 'bold', color: '#374151' }}>⏰ Tiempo Estimado</div>
          <div style={{ fontSize: '18px', color: colorPrincipal, fontWeight: 'bold' }}>
            {estimacion.tiempoEstimadoMinutos} minutos
          </div>
          <div style={{ fontSize: '14px', color: '#6b7280' }}>
            ({estimacion.tiempoEstimadoSegundos} segundos)
          </div>
        </div>

        <div style={{ padding: '12px', backgroundColor: 'white', borderRadius: '6px' }}>
          <div style={{ fontWeight: 'bold', color: '#374151' }}>🚦 Clasificación</div>
          <div style={{ fontSize: '16px', color: colorPrincipal, fontWeight: 'bold' }}>
            {estimacion.clasificacion}
          </div>
        </div>

        <div style={{ padding: '12px', backgroundColor: 'white', borderRadius: '6px' }}>
          <div style={{ fontWeight: 'bold', color: '#374151' }}>📊 Uso del Timeout</div>
          <div style={{ 
            fontSize: '16px', 
            color: estimacion.excederaTimeout ? '#ef4444' : '#10b981',
            fontWeight: 'bold' 
          }}>
            {estimacion.porcentajeDelTimeout}%
          </div>
        </div>

        <div style={{ padding: '12px', backgroundColor: 'white', borderRadius: '6px' }}>
          <div style={{ fontWeight: 'bold', color: '#374151' }}>🏃 Velocidad</div>
          <div style={{ fontSize: '14px', color: '#374151' }}>
            {estimacion.detalles.velocidadProcesamiento}
          </div>
        </div>
      </div>

      {/* Recomendación */}
      <div style={{
        padding: '12px',
        backgroundColor: estimacion.excederaTimeout ? '#fef2f2' : '#f0fdf4',
        border: `1px solid ${estimacion.excederaTimeout ? '#fecaca' : '#bbf7d0'}`,
        borderRadius: '6px',
        marginBottom: mostrarDetalles ? '16px' : '0'
      }}>
        <div style={{ fontWeight: 'bold', marginBottom: '4px' }}>
          💡 Recomendación:
        </div>
        <div style={{ color: '#374151' }}>
          {estimacion.recomendacion}
        </div>
        {estimacion.excederaTimeout && (
          <div style={{ color: '#dc2626', fontWeight: 'bold', marginTop: '8px' }}>
            ⚠️ ADVERTENCIA: Puede exceder el tiempo límite de 8 minutos
          </div>
        )}
      </div>

      {/* Detalles adicionales */}
      {mostrarDetalles && (
        <details style={{ marginTop: '12px' }}>
          <summary style={{ cursor: 'pointer', fontWeight: 'bold', color: '#374151' }}>
            📋 Ver Detalles Técnicos
          </summary>
          <div style={{ marginTop: '8px', fontSize: '14px', color: '#6b7280' }}>
            <div><strong>📦 Total de lotes:</strong> {estimacion.totalLotes}</div>
            <div><strong>👥 Directores por lote:</strong> {estimacion.directoresPorLote}</div>
            <div><strong>⚡ Factor de paralelismo:</strong> {estimacion.detalles.factorParalelismo}</div>
            <div><strong>🕐 Tiempo por lote:</strong> {estimacion.detalles.tiempoPorLoteSegundos}s</div>
          </div>
        </details>
      )}

      {/* Escenarios predeterminados */}
      {mostrarEscenarios && (
        <details style={{ marginTop: '12px' }}>
          <summary style={{ cursor: 'pointer', fontWeight: 'bold', color: '#374151' }}>
            📊 Escenarios Predeterminados
          </summary>
          <div style={{ marginTop: '8px', display: 'grid', gap: '8px' }}>
            {Object.entries(ESTIMACIONES_PREDETERMINADAS).map(([key, scenario]) => {
              const escenarioEstimacion = calcularTiempoEstimado(scenario.directores);
              return (
                <button
                  key={key}
                  onClick={() => setDirectoresInput(scenario.directores)}
                  style={{
                    padding: '8px 12px',
                    border: '1px solid #d1d5db',
                    borderRadius: '4px',
                    backgroundColor: 'white',
                    cursor: 'pointer',
                    textAlign: 'left',
                    fontSize: '14px'
                  }}
                >
                  <div style={{ fontWeight: 'bold' }}>{scenario.nombre}</div>
                  <div style={{ color: obtenerColorClasificacion(escenarioEstimacion.clasificacion) }}>
                    {escenarioEstimacion.tiempoEstimadoMinutos} min ({escenarioEstimacion.clasificacion})
                  </div>
                </button>
              );
            })}
          </div>
        </details>
      )}
    </div>
  );
};

export default EstimacionTiempoComponent; 