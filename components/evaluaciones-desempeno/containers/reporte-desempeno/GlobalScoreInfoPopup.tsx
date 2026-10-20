import React from 'react';
import { RiInformationLine, RiCloseLine } from 'react-icons/ri';
import styles from '../ReporteGeneralDesempenoContainer.module.css';

export interface GlobalScoreInfoPopupProps {
  type: 'ugel' | 'especialista' | 'dominio' | 'consolidado_general' | 'niveles_logro' | 'proporcional_dominio';
  isOpen: boolean;
  onToggle: () => void;
  onClose: () => void;
  anchorRef: React.RefObject<HTMLDivElement>;
  targetNounSingular?: string;
  groupLabel?: string;
}

export const GlobalScoreInfoPopup: React.FC<GlobalScoreInfoPopupProps> = ({
  type = 'ugel',
  isOpen,
  onToggle,
  onClose,
  anchorRef,
  targetNounSingular = 'Docente',
  groupLabel = 'UGEL / Institución',
}) => {
  const getPopupContent = () => {
    switch (type) {
      case 'ugel':
        return {
          title: '¿Cómo se calculan estos datos?',
          items: [
            {
              color: '#10b981',
              isSquare: true,
              label: 'Segmentos dentro de la barra',
              desc: `Evolución histórica: Muestra el puntaje promedio obtenido por la ${groupLabel} en cada una de las fases o tramos evaluados.`,
            },
            {
              color: '#3b82f6',
              isSquare: false,
              label: 'Cápsula exterior (ej. 19.5 pts)',
              desc: `Puntaje Consolidado Vigente de la ${groupLabel}. Se calcula promediando la última evaluación registrada de todos los ${targetNounSingular.toLowerCase()}s y define el ranking.`,
            },
            {
              color: '#f59e0b',
              isSquare: false,
              label: 'Ícono de barras de color',
              desc: 'El color del mini ícono dentro de la cápsula refleja el Nivel de Logro de acuerdo a la escala oficial de la evaluación.',
            },
          ],
        };
      case 'especialista':
        return {
          title: '¿Cómo se calculan estos datos?',
          items: [
            {
              color: '#10b981',
              isSquare: true,
              label: 'Segmentos dentro de la barra',
              desc: `Evolución histórica: Muestra el puntaje total obtenido por el ${targetNounSingular.toLowerCase()} en cada una de sus fases o evaluaciones registradas.`,
            },
            {
              color: '#6366f1',
              isSquare: false,
              label: 'Cápsula exterior (ej. 24 pts)',
              desc: `Puntaje Total Vigente del ${targetNounSingular.toLowerCase()} correspondiente a su evaluación más reciente. Determina su ubicación en el ranking general.`,
            },
            {
              color: '#f59e0b',
              isSquare: false,
              label: 'Ícono de barras de color',
              desc: 'El color del mini ícono dentro de la cápsula refleja el Nivel de Logro alcanzado en su evaluación vigente según la escala oficial.',
            },
          ],
        };
      case 'dominio':
        return {
          title: '¿Cómo se calcula este rendimiento?',
          items: [
            {
              color: '#8b5cf6',
              isSquare: true,
              label: 'Segmentos dentro de la barra',
              desc: 'Evolución histórica: Muestra el puntaje promedio obtenido en esta dimensión/dominio en cada una de las fases o tramos evaluados.',
            },
            {
              color: '#3b82f6',
              isSquare: false,
              label: 'Cápsula exterior de puntaje',
              desc: `Puntaje Promedio Vigente del Dominio. Promedio obtenido en esta dimensión tomando la última evaluación de todos los ${targetNounSingular.toLowerCase()}s evaluados.`,
            },
            {
              color: '#10b981',
              isSquare: false,
              label: 'Nivel de Logro por Dominio',
              desc: 'Refleja la escala de logro (Destacado, Esperado, En Proceso, etc.) correspondiente al puntaje promedio obtenido en la dimensión.',
            },
          ],
        };
      case 'consolidado_general':
        return {
          title: 'Consolidado Global de Resultados',
          items: [
            {
              color: '#3b82f6',
              isSquare: false,
              label: 'Distribución Global de Respuestas',
              desc: 'Muestra la suma y porcentaje de todas las respuestas marcadas en la evaluación agrupadas por la escala configurada (ej. A, B, C, D o Destacado, Esperado, etc.).',
            },
            {
              color: '#10b981',
              isSquare: true,
              label: 'Muestra Total',
              desc: `Total de ${targetNounSingular.toLowerCase()}s evaluados y volumen global de respuestas calificadas en toda la evaluación.`,
            },
          ],
        };
      case 'niveles_logro':
        return {
          title: 'Distribución por Niveles de Logro',
          items: [
            {
              color: '#10b981',
              isSquare: false,
              label: 'Clasificación General',
              desc: `Agrupa a los ${targetNounSingular.toLowerCase()}s según su puntaje total en el rango de nivel de logro alcanzado.`,
            },
            {
              color: '#f59e0b',
              isSquare: true,
              label: `Conteo de ${targetNounSingular}s`,
              desc: `Indica la cantidad exacta de ${targetNounSingular.toLowerCase()}s ubicados en cada nivel para conocer el balance general del rendimiento.`,
            },
          ],
        };
      case 'proporcional_dominio':
        return {
          title: 'Distribución Proporcional por Dominio',
          items: [
            {
              color: '#8b5cf6',
              isSquare: false,
              label: 'Peso de cada Dimensión',
              desc: 'Compara la proporción y aporte porcentual de cada dimensión o dominio evaluado respecto al puntaje total general.',
            },
          ],
        };
    }
  };

  const content = getPopupContent();

  return (
    <div className={styles.infoPopupWrapper} ref={anchorRef}>
      <button
        type="button"
        className={`${styles.infoPopupBtn} ${isOpen ? styles.infoPopupBtnActive : ''}`}
        onClick={(e) => {
          e.stopPropagation();
          onToggle();
        }}
        title="¿Cómo se calcula este rendimiento? Clic para ver el detalle"
        aria-label="¿Cómo se calcula este rendimiento?"
      >
        <RiInformationLine />
      </button>

      {isOpen && (
        <div
          className={styles.infoPopupContent}
          onClick={(e) => e.stopPropagation()}
        >
          <div className={styles.infoPopupHeader}>
            <span className={styles.infoPopupTitle}>
              <RiInformationLine style={{ fontSize: '1rem', color: '#38bdf8' }} />
              {content.title}
            </span>
            <button
              type="button"
              className={styles.infoPopupCloseBtn}
              onClick={onClose}
              title="Cerrar"
              aria-label="Cerrar ventana informativa"
            >
              <RiCloseLine style={{ fontSize: '1.1rem' }} />
            </button>
          </div>

          <div className={styles.infoPopupList}>
            {content.items.map((item, idx) => (
              <div key={idx} className={styles.infoPopupItem}>
                <div className={styles.infoPopupItemHeader}>
                  <span
                    style={{
                      width: 8,
                      height: 8,
                      borderRadius: item.isSquare ? 2 : '50%',
                      background: item.color,
                      display: 'inline-block',
                      flexShrink: 0,
                    }}
                  />
                  <span>{item.label}</span>
                </div>
                <p className={styles.infoPopupItemDesc}>{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default GlobalScoreInfoPopup;
