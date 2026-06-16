import React, { useState, useEffect } from 'react';
import RangoMes from './ragoMes';
import GraficoTendencia from './graficoTendencia';
import styles from './Acordeon.module.css';

interface AcordeonGraficosTendenciaProps {
  rangoMes: number[];
  setRangoMes: (rango: number[]) => void;
  onRangoChange: (mesInicio: number, mesFin: number, año: number, mesesIds: number[]) => void;
  idEvaluacion: string;
  monthSelected: number;
  yearSelected: number;
}

const AcordeonGraficosTendencia: React.FC<AcordeonGraficosTendenciaProps> = ({
  rangoMes,
  setRangoMes,
  onRangoChange,
  idEvaluacion,
  monthSelected,
  yearSelected
}) => {
  const [mostrarGraficos, setMostrarGraficos] = useState(false);
  const [rangoMesAplicado, setRangoMesAplicado] = useState<number[]>([]);

  const toggleGraficos = () => {
    setMostrarGraficos(!mostrarGraficos);
  };

  useEffect(() => {
    if (rangoMes && rangoMes.length > 0 && rangoMesAplicado.length === 0) {
      setRangoMesAplicado(rangoMes);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [rangoMes]);

  const handleAplicarRango = (mesInicio: number, mesFin: number, año: number, mesesIds: number[]) => {
    setRangoMesAplicado(mesesIds);
    onRangoChange(mesInicio, mesFin, año, mesesIds);
  };

  return (
    <div className={styles.accordionContainer}>
      <div
        onClick={toggleGraficos}
        className={mostrarGraficos ? styles.headerOpen : styles.header}
      >
        <div className={styles.titleGroup}>
          <span className={styles.icon}>
            {mostrarGraficos ? '📊' : '📈'}
          </span>
          <h3 className={styles.title}>
            Gráficos de Tendencia
          </h3>
        </div>
        <div className={mostrarGraficos ? styles.chevronOpen : styles.chevron}>
          ▼
        </div>
      </div>

      <div className={`${styles.contentWrapper} ${mostrarGraficos ? styles.contentWrapperOpen : ''}`}>
        <div className={`${styles.contentInner} ${mostrarGraficos ? styles.innerVisible : ''}`}>
          <RangoMes setRangoMes={setRangoMes} onRangoChange={handleAplicarRango} />
          <GraficoTendencia
            monthSelected={monthSelected}
            rangoMesAplicado={rangoMesAplicado}
            idEvaluacion={idEvaluacion}
            yearSelected={yearSelected}
          />
        </div>
      </div>
    </div>
  );
};

export default AcordeonGraficosTendencia;
