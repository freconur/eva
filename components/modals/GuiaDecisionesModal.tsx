import React, { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import {
  MdClose,
  MdFactCheck,
  MdLightbulb,
  MdCheckCircle,
  MdViewList,
  MdGridView,
} from 'react-icons/md';
import {
  BaremoDecisiones,
  DEFAULT_BAREMO_DECISIONES,
} from './ConfigurarBaremoModal';
import styles from './GuiaDecisionesModal.module.css';

interface GuiaDecisionesModalProps {
  isOpen: boolean;
  onClose: () => void;
  baremo?: BaremoDecisiones;
}

export const GuiaDecisionesModal: React.FC<GuiaDecisionesModalProps> = ({
  isOpen,
  onClose,
  baremo,
}) => {
  const activeBaremo = baremo || DEFAULT_BAREMO_DECISIONES;
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
      aria-labelledby="decisiones-modal-title"
    >
      <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
        {/* Cabecera */}
        <header className={styles.header}>
          <div className={styles.headerTitleGroup}>
            <div className={styles.headerIcon}>
              <MdFactCheck />
            </div>
            <div>
              <h2 id="decisiones-modal-title" className={styles.title}>
                Interpretación del Panel de Decisiones
              </h2>
              <p className={styles.subtitle}>
                Guía metodológica, umbrales de alerta temprana y acciones pedagógicas recomendadas
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
              <MdLightbulb style={{ fontSize: '1.25rem' }} />
              <span>¿En qué consiste el Panel de Toma de Decisiones?</span>
            </div>
            <p className={styles.conceptText}>
              Es el <strong>motor de inteligencia pedagógica y priorización</strong> de la plataforma. Su objetivo es convertir los datos crudos de evaluación (% aciertos y rezago) en <strong>alertas tempranas automáticas y planes de acción concretos</strong>.
            </p>
            <p className={styles.conceptText}>
              En lugar de analizar manualmente celda por celda de reportes extensos, este módulo <strong>detecta de inmediato las combinaciones UGEL × Pregunta más críticas</strong> y las clasifica según su nivel de urgencia para focalizar el acompañamiento pedagógico.
            </p>
          </div>

          {/* Umbrales de Alerta y Acciones */}
          <section className={styles.section}>
            <h3 className={styles.sectionTitle}>
              🚦 Niveles de Alerta y Acciones Recomendadas
            </h3>
            <div className={styles.alertasGrid}>
              {/* Crítico */}
              <div className={styles.alertaCard} style={{ borderTopColor: '#e53935' }}>
                <div className={styles.alertaHeader}>
                  <span className={`${styles.alertaTag} ${styles.alertaCritico}`}>🔴 Crítico</span>
                  <span className={styles.alertaRange}>≥ {activeBaremo.critico}%</span>
                </div>
                <p className={styles.alertaDesc}>
                  <strong>Emergencia educativa:</strong> Al menos el {activeBaremo.critico}% de los estudiantes se encuentran en el nivel «Previo al Inicio» en este ítem.
                </p>
                <div className={styles.alertaAccion}>
                  <strong>Acción:</strong> Intervención inmediata · Taller de reforzamiento presencial focalizado.
                </div>
              </div>

              {/* Alto */}
              <div className={styles.alertaCard} style={{ borderTopColor: '#ff8a65' }}>
                <div className={styles.alertaHeader}>
                  <span className={`${styles.alertaTag} ${styles.alertaAlto}`}>🟠 Alto</span>
                  <span className={styles.alertaRange}>{activeBaremo.alto}% – {activeBaremo.critico - 1}%</span>
                </div>
                <p className={styles.alertaDesc}>
                  <strong>Dificultad severa:</strong> Una proporción alta de los evaluados no logra resolver la capacidad evaluada.
                </p>
                <div className={styles.alertaAccion}>
                  <strong>Acción:</strong> Priorizar · Sesiones de práctica adicionales y dosificación curricular.
                </div>
              </div>

              {/* Medio */}
              <div className={styles.alertaCard} style={{ borderTopColor: '#f9a825' }}>
                <div className={styles.alertaHeader}>
                  <span className={`${styles.alertaTag} ${styles.alertaMedio}`}>🟡 Medio</span>
                  <span className={styles.alertaRange}>{activeBaremo.medio}% – {activeBaremo.alto - 1}%</span>
                </div>
                <p className={styles.alertaDesc}>
                  <strong>Alerta preventiva:</strong> Estudiantes muestran debilidades en el aprendizaje que requieren atención continua.
                </p>
                <div className={styles.alertaAccion}>
                  <strong>Acción:</strong> Monitoreo · Seguimiento personalizado y retroalimentación en aula.
                </div>
              </div>

              {/* Bajo */}
              <div className={styles.alertaCard} style={{ borderTopColor: '#66bb6a' }}>
                <div className={styles.alertaHeader}>
                  <span className={`${styles.alertaTag} ${styles.alertaBajo}`}>🟢 Bajo</span>
                  <span className={styles.alertaRange}>&lt; {activeBaremo.medio}%</span>
                </div>
                <p className={styles.alertaDesc}>
                  <strong>Nivel controlado:</strong> Rezago mínimo o moderado dentro de los parámetros esperados.
                </p>
                <div className={styles.alertaAccion}>
                  <strong>Acción:</strong> Mantener · Continuar con las estrategias pedagógicas actuales y buenas prácticas.
                </div>
              </div>
            </div>
          </section>

          {/* Arquitectura de la Tabla Ejecutiva */}
          <section className={styles.section}>
            <h3 className={styles.sectionTitle}>
              🔄 Estructura de la Tabla Ejecutiva (Master-Detail)
            </h3>
            <div className={styles.vistasGrid}>
              <div className={styles.vistaCard}>
                <div className={styles.vistaHeader}>
                  <MdViewList className={styles.vistaIcon} />
                  <span>1. Fila Maestra (Nivel Territorial UGEL)</span>
                </div>
                <p className={styles.vistaDesc}>
                  Ordena las UGELs de la región de mayor a menor urgencia pedagógica por nivel de prioridad (#1, #2, #3...).
                </p>
                <div className={styles.vistaDetalle}>
                  📌 <strong>Resumen Inmediato:</strong> Presenta el nivel de riesgo global, conteo de alertas (🔴, 🟠, 🟡, 🟢), el ítem más crítico con alumnos afectados y la acción directiva prioritaria.
                </div>
              </div>

              <div className={styles.vistaCard}>
                <div className={styles.vistaHeader}>
                  <MdGridView className={styles.vistaIcon} />
                  <span>2. Subtabla Desplegable (Desglose por Ítem)</span>
                </div>
                <p className={styles.vistaDesc}>
                  Al expandir una fila (individualmente o con «Expandir todas»), muestra el detalle de todas las preguntas de la UGEL.
                </p>
                <div className={styles.vistaDetalle}>
                  📌 <strong>Barras de Rezago y Acción Didáctica:</strong> Visualiza barras de progreso semafóricas, cantidad absoluta de estudiantes en rezago y la recomendación pedagógica específica.
                </div>
              </div>
            </div>
          </section>

          {/* Utilidad para la Toma de Decisiones */}
          <div className={styles.decisionesBox}>
            <div className={styles.decisionesTitle}>
              <MdFactCheck style={{ fontSize: '1.25rem' }} />
              <span>¿Cómo utilizar el Panel de Decisiones en la gestión educativa?</span>
            </div>
            <ul className={styles.decisionesList}>
              <li>
                <strong>Focalización de Asistencia Técnica (DRE):</strong> Permite enviar especialistas de la Dirección Regional con precisión a las UGELs situadas en las primeras posiciones del ranking crítico.
              </li>
              <li>
                <strong>Capacitaciones Curriculares Específicas:</strong> Si una misma pregunta (ej. inferencia en lectura) aparece repetidamente en rojo en múltiples UGELs, se programa un taller regional para docentes de ese grado.
              </li>
              <li>
                <strong>Monitoreo Evolutivo Inter-etapas (EDI ➔ EP1 ➔ EP2):</strong> Al cambiar la etapa de evaluación, el éxito del plan se constata cuando las tarjetas rojas disminuyen y los porcentajes bajan hacia niveles medios y verdes.
              </li>
            </ul>
          </div>
        </div>

        {/* Pie del modal */}
        <footer className={styles.footer}>
          <button type="button" className={styles.btnCerrar} onClick={onClose}>
            <MdCheckCircle style={{ marginRight: '6px', verticalAlign: 'middle' }} />
            Entendido
          </button>
        </footer>
      </div>
    </div>,
    portalTarget
  );
};

export default GuiaDecisionesModal;
