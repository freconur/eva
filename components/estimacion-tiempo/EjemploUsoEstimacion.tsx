import React, { useState } from 'react';
import EstimacionTiempoComponent from './EstimacionTiempo';
import { useGenerarReporte } from '@/features/hooks/useGenerarReporte';
import { EstimacionTiempo } from '@/fuctions/timeEstimation';

/**
 * Ejemplo de cómo usar el componente de estimación de tiempo
 * y las funciones del hook useGenerarReporte en una página real
 */
const EjemploUsoEstimacion: React.FC = () => {
  const {
    generarReporte,
    loading,
    error,
    resultado,
    estimacionPrevia,
    calcularEstimacionPrevia,
    obtenerEstimacionesEscenarios,
    actualizarEstimacionConDatosReales
  } = useGenerarReporte();

  const [estimacionActual, setEstimacionActual] = useState<EstimacionTiempo | null>(null);
  const [mostrarModal, setMostrarModal] = useState(false);

  // Datos de ejemplo para el reporte
  const filtrosEjemplo = {
    region: 'Lima',
    distrito: 'Todos',
    caracteristicaCurricular: 'Todas',
    genero: 'Todos',
    area: 'Todas'
  };

  const handleEstimacionCalculada = (estimacion: EstimacionTiempo) => {
    setEstimacionActual(estimacion);
  };

  const handleGenerarReporte = async () => {
    if (estimacionActual?.excederaTimeout) {
      const continuar = confirm(
        '⚠️ La estimación indica que el procesamiento puede exceder el tiempo límite.\n\n' +
        '¿Estás seguro de que deseas continuar?'
      );
      if (!continuar) return;
    }

    try {
      await generarReporte('evaluacion-ejemplo', 11, filtrosEjemplo);
    } catch (error) {
      console.error('Error al generar reporte:', error);
    }
  };

  const handleMostrarEscenarios = () => {
    const escenarios = obtenerEstimacionesEscenarios();
    console.log('📊 Escenarios disponibles:', escenarios);
    setMostrarModal(true);
  };

  const handleCalcularEstimacionPrevia = () => {
    const estimacion = calcularEstimacionPrevia(1200);
    console.log('🧮 Estimación previa calculada:', estimacion);
  };

  return (
    <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '20px' }}>
      <h1>🔍 Ejemplo de Uso - Estimación de Tiempo</h1>
      
      <p style={{ color: '#6b7280', marginBottom: '20px' }}>
        Este es un ejemplo de cómo usar el componente de estimación de tiempo 
        y las funciones del hook useGenerarReporte en una aplicación real.
      </p>

      {/* Componente de Estimación Principal */}
      <EstimacionTiempoComponent
        numeroDirectores={1200}
        mostrarDetalles={true}
        mostrarEscenarios={true}
        onEstimacionCalculada={handleEstimacionCalculada}
      />

      {/* Controles de Ejemplo */}
      <div style={{ 
        display: 'grid', 
        gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', 
        gap: '12px',
        marginTop: '20px'
      }}>
        <button
          onClick={handleGenerarReporte}
          disabled={loading}
          style={{
            padding: '12px 16px',
            backgroundColor: loading ? '#9ca3af' : '#3b82f6',
            color: 'white',
            border: 'none',
            borderRadius: '6px',
            cursor: loading ? 'not-allowed' : 'pointer',
            fontSize: '16px',
            fontWeight: 'bold'
          }}
        >
          {loading ? '⏳ Generando...' : '🚀 Generar Reporte'}
        </button>

        <button
          onClick={handleCalcularEstimacionPrevia}
          style={{
            padding: '12px 16px',
            backgroundColor: '#10b981',
            color: 'white',
            border: 'none',
            borderRadius: '6px',
            cursor: 'pointer',
            fontSize: '14px'
          }}
        >
          🧮 Calcular Estimación Previa
        </button>

        <button
          onClick={handleMostrarEscenarios}
          style={{
            padding: '12px 16px',
            backgroundColor: '#f59e0b',
            color: 'white',
            border: 'none',
            borderRadius: '6px',
            cursor: 'pointer',
            fontSize: '14px'
          }}
        >
          📊 Ver Todos los Escenarios
        </button>
      </div>

      {/* Información de Estado */}
      {loading && (
        <div style={{
          padding: '16px',
          backgroundColor: '#dbeafe',
          border: '1px solid #93c5fd',
          borderRadius: '6px',
          marginTop: '20px'
        }}>
          <div style={{ fontWeight: 'bold', color: '#1e40af' }}>
            ⏳ Procesando Reporte...
          </div>
          <div style={{ color: '#3730a3', marginTop: '4px' }}>
            Esto puede tomar hasta {estimacionActual?.tiempoEstimadoMinutos || 'varios'} minutos. 
            Por favor, mantén esta pestaña abierta.
          </div>
          {estimacionActual && (
            <div style={{ marginTop: '8px', fontSize: '14px', color: '#6b7280' }}>
              📊 Clasificación: {estimacionActual.clasificacion} | 
              🏃 Velocidad estimada: {estimacionActual.detalles.velocidadProcesamiento}
            </div>
          )}
        </div>
      )}

      {error && (
        <div style={{
          padding: '16px',
          backgroundColor: '#fef2f2',
          border: '1px solid #fecaca',
          borderRadius: '6px',
          marginTop: '20px'
        }}>
          <div style={{ fontWeight: 'bold', color: '#dc2626' }}>
            ❌ Error:
          </div>
          <div style={{ color: '#7f1d1d', marginTop: '4px' }}>
            {error}
          </div>
        </div>
      )}

      {/* Estimación Previa */}
      {estimacionPrevia && (
        <div style={{
          padding: '16px',
          backgroundColor: '#f0fdf4',
          border: '1px solid #bbf7d0',
          borderRadius: '6px',
          marginTop: '20px'
        }}>
          <div style={{ fontWeight: 'bold', color: '#047857', marginBottom: '8px' }}>
            🔮 Estimación Previa Calculada:
          </div>
          <div style={{ fontSize: '14px', color: '#059669' }}>
            ⏰ {estimacionPrevia.tiempoEstimadoMinutos} minutos | 
            🚦 {estimacionPrevia.clasificacion} | 
            📊 {estimacionPrevia.porcentajeDelTimeout}% del timeout
          </div>
        </div>
      )}

      {/* Resultado del Reporte */}
      {resultado && (
        <div style={{
          padding: '16px',
          backgroundColor: '#f0fdf4',
          border: '1px solid #bbf7d0',
          borderRadius: '6px',
          marginTop: '20px'
        }}>
          <div style={{ fontWeight: 'bold', color: '#047857', marginBottom: '12px' }}>
            ✅ Reporte Generado Exitosamente
          </div>
          
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '8px' }}>
            <div>
              <strong>📊 Directores:</strong> {resultado.totalDirectores}
            </div>
            <div>
              <strong>👥 Docentes:</strong> {resultado.totalDocentes}
            </div>
            <div>
              <strong>📝 Evaluaciones:</strong> {resultado.totalEvaluaciones}
            </div>
            <div>
              <strong>✅ Completado:</strong> {resultado.completado ? 'Sí' : 'No'}
            </div>
          </div>

          {/* Comparación Estimación vs Realidad */}
          {resultado.estimacionTiempo && resultado.estadisticas.tiempoReal && (
            <div style={{ marginTop: '12px', padding: '12px', backgroundColor: 'white', borderRadius: '4px' }}>
              <div style={{ fontWeight: 'bold', marginBottom: '8px' }}>
                📈 Comparación Estimación vs Realidad:
              </div>
              <div style={{ fontSize: '14px', color: '#374151' }}>
                <div>🔮 Estimado: {resultado.estimacionTiempo.tiempoEstimadoMinutos} min</div>
                <div>⏰ Real: {resultado.estadisticas.tiempoReal.tiempoRealMinutos} min</div>
                <div>📊 Diferencia: {resultado.estadisticas.tiempoReal.diferenciaPorcentaje > 0 ? '+' : ''}{resultado.estadisticas.tiempoReal.diferenciaPorcentaje}%</div>
                <div>🎯 Precisión: {resultado.estadisticas.tiempoReal.eficienciaEstimacion}</div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Modal de Escenarios */}
      {mostrarModal && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0,0,0,0.5)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000
        }}>
          <div style={{
            backgroundColor: 'white',
            padding: '24px',
            borderRadius: '8px',
            maxWidth: '600px',
            width: '90%',
            maxHeight: '80vh',
            overflowY: 'auto'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <h3 style={{ margin: 0 }}>📊 Todos los Escenarios de Estimación</h3>
              <button
                onClick={() => setMostrarModal(false)}
                style={{
                  background: 'none',
                  border: 'none',
                  fontSize: '20px',
                  cursor: 'pointer',
                  padding: '4px'
                }}
              >
                ✕
              </button>
            </div>
            
            <div style={{ display: 'grid', gap: '12px' }}>
              {obtenerEstimacionesEscenarios().map((escenario, index) => (
                <div key={index} style={{
                  padding: '12px',
                  border: '1px solid #d1d5db',
                  borderRadius: '6px',
                  backgroundColor: '#f9fafb'
                }}>
                  <div style={{ fontWeight: 'bold', marginBottom: '4px' }}>
                    {escenario.nombre}
                  </div>
                  <div style={{ fontSize: '14px', color: '#6b7280' }}>
                    ⏰ {escenario.estimacion.tiempoEstimadoMinutos} min | 
                    🚦 {escenario.estimacion.clasificacion} | 
                    📊 {escenario.estimacion.porcentajeDelTimeout}% timeout
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default EjemploUsoEstimacion; 