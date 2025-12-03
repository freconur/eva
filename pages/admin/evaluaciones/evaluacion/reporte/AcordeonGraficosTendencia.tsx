import React, { useState, useEffect } from 'react';
import RangoMes from './ragoMes';
import GraficoTendencia from './graficoTendencia';

interface AcordeonGraficosTendenciaProps {
  rangoMes: number[];
  setRangoMes: (rango: number[]) => void;
  onRangoChange: (mesInicio: number, mesFin: number, año: number, mesesIds: number[]) => void;
  idEvaluacion: string;
  monthSelected: number;
}

const AcordeonGraficosTendencia: React.FC<AcordeonGraficosTendenciaProps> = ({
  rangoMes,
  setRangoMes,
  onRangoChange,
  idEvaluacion,
  monthSelected
}) => {
  const [mostrarGraficos, setMostrarGraficos] = useState(false);
  const [rangoMesAplicado, setRangoMesAplicado] = useState<number[]>([]);

  const toggleGraficos = () => {
    setMostrarGraficos(!mostrarGraficos);
  };

  // Inicializar el rango aplicado con el rango inicial
  useEffect(() => {
    if (rangoMes && rangoMes.length > 0 && rangoMesAplicado.length === 0) {
      setRangoMesAplicado(rangoMes);
    }
  }, [rangoMes]);

  // Función para manejar cuando se aplique el rango
  const handleAplicarRango = (mesInicio: number, mesFin: number, año: number, mesesIds: number[]) => {
    setRangoMesAplicado(mesesIds);
    onRangoChange(mesInicio, mesFin, año, mesesIds);
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
        onClick={toggleGraficos}
        style={{
          padding: '16px 20px',
          backgroundColor: '#f8f9fa',
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          borderBottom: mostrarGraficos ? '1px solid #e9ecef' : 'none',
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
            {mostrarGraficos ? '📊' : '📈'}
          </span>
          <h3 style={{ 
            margin: 0, 
            fontSize: '16px', 
            fontWeight: '600',
            color: '#495057'
          }}>
            Gráficos de Tendencia
          </h3>
        </div>
        <div style={{
          transform: mostrarGraficos ? 'rotate(180deg)' : 'rotate(0deg)',
          transition: 'transform 0.3s ease',
          fontSize: '20px',
          color: '#6c757d'
        }}>
          ▼
        </div>
      </div>

      {/* Contenido del acordeón con animación */}
      <div style={{
        maxHeight: mostrarGraficos ? 'none' : '0',
        overflow: 'hidden',
        transition: 'max-height 0.4s ease-in-out, padding 0.3s ease',
        padding: mostrarGraficos ? '20px' : '0 20px'
      }}>
        <div style={{
          opacity: mostrarGraficos ? 1 : 0,
          transition: 'opacity 0.3s ease',
          transitionDelay: mostrarGraficos ? '0.1s' : '0s',
          transform: mostrarGraficos ? 'translateY(0)' : 'translateY(-10px)',
          transitionProperty: 'opacity, transform',
          transitionDuration: '0.3s'
        }}>
          <RangoMes setRangoMes={setRangoMes} onRangoChange={handleAplicarRango}/>
          <GraficoTendencia monthSelected={monthSelected} rangoMesAplicado={rangoMesAplicado} idEvaluacion={idEvaluacion}/>
        </div>
      </div>
    </div>
  );
};

export default AcordeonGraficosTendencia;
