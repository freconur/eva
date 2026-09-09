import React, { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import {
  MdClose,
  MdHelpOutline,
  MdFlag,
  MdLightbulb,
  MdCheckCircle,
} from 'react-icons/md';
import styles from './GuiaRankingModal.module.css';

interface GuiaRankingModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const GuiaRankingModal: React.FC<GuiaRankingModalProps> = ({
  isOpen,
  onClose,
}) => {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Manejo de la tecla Escape para cerrar
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  // Bloquear scroll de fondo mientras el modal esté abierto
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  if (!isOpen || !mounted) return null;

  const portalTarget =
    (typeof document !== 'undefined' && (document.fullscreenElement as HTMLElement)) ||
    (typeof document !== 'undefined' ? document.body : null);

  if (!portalTarget) return null;

  return createPortal(
    <div
      className={styles.overlay}
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-labelledby="ranking-modal-title"
    >
      <div
        className={styles.modal}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Cabecera */}
        <header className={styles.header}>
          <div className={styles.headerTitleGroup}>
            <div className={styles.headerIcon}>
              <MdHelpOutline />
            </div>
            <div>
              <h2 id="ranking-modal-title" className={styles.title}>
                Interpretación del Ranking de Criticidad
              </h2>
              <p className={styles.subtitle}>
                Guía metodológica, métricas clave y toma de decisiones pedagógicas
              </p>
            </div>
          </div>
          <button
            type="button"
            className={styles.closeBtn}
            onClick={onClose}
            title="Cerrar modal (Esc)"
          >
            <MdClose />
          </button>
        </header>

        {/* Contenido con scroll */}
        <div className={styles.body}>
          {/* Tarjeta de Concepto Central */}
          <div className={styles.conceptCard}>
            <div className={styles.conceptHeader}>
              <MdFlag style={{ fontSize: '1.2rem' }} />
              <span>¿En qué consiste este ranking?</span>
            </div>
            <p className={styles.conceptText}>
              Este <strong>no es un ranking de mejor a peor desempeño</strong>. Es una herramienta de <strong>priorización y alerta pedagógica</strong>: clasifica a las UGELs en orden descendente según su punto de mayor rezago (la pregunta que registró la <strong>tasa más alta de no acierto entre todos los estudiantes evaluados</strong>).
            </p>
            <p className={styles.conceptText}>
              Las primeras posiciones (#1, #2, #3...) representan a las UGELs que enfrentan los <strong>cuellos de botella curriculares más urgentes</strong> y requieren acompañamiento técnico prioritario.
            </p>
          </div>

          {/* Desglose de Elementos */}
          <section className={styles.section}>
            <h3 className={styles.sectionTitle}>
              🔍 Elementos de cada fila en el gráfico
            </h3>
            <div className={styles.elementosGrid}>
              <div className={styles.elementoItem}>
                <div className={`${styles.elementoBadge} ${styles.badgeMedal}`}>
                  #1, #2, #3...
                </div>
                <div className={styles.elementoDesc}>
                  <strong>Puesto de Prioridad (#)</strong>
                  <span>
                    Indica el nivel de urgencia de intervención en la región. El puesto #1 tiene el rezago más agudo en su pregunta crítica.
                  </span>
                </div>
              </div>

              <div className={styles.elementoItem}>
                <div className={`${styles.elementoBadge} ${styles.badgePreg}`}>
                  P07, P05...
                </div>
                <div className={styles.elementoDesc}>
                  <strong>Pregunta más crítica de la UGEL</strong>
                  <span>
                    Es el ítem curricular específico donde esa UGEL registró su mayor porcentaje de estudiantes que no lograron responder correctamente.
                  </span>
                </div>
              </div>

              <div className={styles.elementoItem}>
                <div className={`${styles.elementoBadge} ${styles.badgeBar}`}>
                  Barra y %
                </div>
                <div className={styles.elementoDesc}>
                  <strong>Porcentaje de no acierto en la pregunta crítica</strong>
                  <span>
                    Proporción de estudiantes evaluados de esa UGEL que fallaron la pregunta (situación de rezago en esa competencia).
                  </span>
                </div>
              </div>

              <div className={styles.elementoItem}>
                <div className={`${styles.elementoBadge} ${styles.badgeProm}`}>
                  Prom: XX%
                </div>
                <div className={styles.elementoDesc}>
                  <strong>Promedio General de Rezago</strong>
                  <span>
                    El porcentaje promedio de no acierto considerando <strong>todas las preguntas</strong> de la prueba, permitiendo contrastar el pico con la tendencia global.
                  </span>
                </div>
              </div>
            </div>
          </section>

          {/* Semáforo de Colores */}
          <section className={styles.section}>
            <h3 className={styles.sectionTitle}>
              🚦 Niveles de Alerta y Semáforo de Dificultad
            </h3>
            <div className={styles.semaforoGrid}>
              <div className={`${styles.semaforoCard} ${styles.semaforoCritico}`}>
                <span className={styles.semaforoHeader}>🔴 Crítico</span>
                <span className={styles.semaforoRange}>≥ 60%</span>
                <span className={styles.semaforoAccion}>
                  Intervención inmediata y refuerzo urgente.
                </span>
              </div>

              <div className={`${styles.semaforoCard} ${styles.semaforoAlto}`}>
                <span className={styles.semaforoHeader}>🟠 Alto</span>
                <span className={styles.semaforoRange}>50% - 59%</span>
                <span className={styles.semaforoAccion}>
                  Sesiones adicionales y apoyo focalizado.
                </span>
              </div>

              <div className={`${styles.semaforoCard} ${styles.semaforoMedio}`}>
                <span className={styles.semaforoHeader}>🟡 Medio</span>
                <span className={styles.semaforoRange}>40% - 49%</span>
                <span className={styles.semaforoAccion}>
                  Monitoreo y seguimiento pedagógico regular.
                </span>
              </div>

              <div className={`${styles.semaforoCard} ${styles.semaforoBajo}`}>
                <span className={styles.semaforoHeader}>🟢 Bajo</span>
                <span className={styles.semaforoRange}>&lt; 40%</span>
                <span className={styles.semaforoAccion}>
                  Mayor dominio. Consolidar buenas prácticas.
                </span>
              </div>
            </div>
          </section>

          {/* Utilidad para la Toma de Decisiones */}
          <div className={styles.decisionesBox}>
            <div className={styles.decisionesTitle}>
              <MdLightbulb style={{ fontSize: '1.2rem', color: '#2563eb' }} />
              <span>¿Cómo utilizar esta información en la gestión?</span>
            </div>
            <ul className={styles.decisionesList}>
              <li>
                <strong>Detectar patrones curriculares transversales:</strong> Si múltiples UGELs coinciden en la misma pregunta (ej. P07), denota una debilidad pedagógica regional en esa capacidad curricular que debe abordarse en talleres generales.
              </li>
              <li>
                <strong>Focalizar visitas presenciales:</strong> Priorizar la asistencia técnica a los especialistas y directores de las UGELs en las primeras posiciones.
              </li>
              <li>
                <strong>Comparar Pico vs. Promedio:</strong> Si una UGEL tiene un promedio bajo (ej. 26%) pero un pico alto en una sola pregunta (ej. 42%), solo requiere refuerzo puntual en esa competencia y no una intervención global.
              </li>
            </ul>
          </div>
        </div>

        {/* Pie del modal */}
        <footer className={styles.footer}>
          <button
            type="button"
            className={styles.btnCerrar}
            onClick={onClose}
          >
            <MdCheckCircle style={{ marginRight: '6px', verticalAlign: 'middle' }} />
            Entendido
          </button>
        </footer>
      </div>
    </div>,
    portalTarget
  );
};

export default GuiaRankingModal;
