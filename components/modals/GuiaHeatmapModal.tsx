import React, { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import {
  MdClose,
  MdLocalFireDepartment,
  MdGridView,
  MdViewWeek,
  MdTableRows,
  MdLightbulb,
  MdCheckCircle,
  MdInfoOutline,
} from 'react-icons/md';
import styles from './GuiaHeatmapModal.module.css';

interface GuiaHeatmapModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const GuiaHeatmapModal: React.FC<GuiaHeatmapModalProps> = ({
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
      aria-labelledby="heatmap-modal-title"
    >
      <div
        className={styles.modal}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Cabecera */}
        <header className={styles.header}>
          <div className={styles.headerTitleGroup}>
            <div className={styles.headerIcon}>
              <MdLocalFireDepartment />
            </div>
            <div>
              <h2 id="heatmap-modal-title" className={styles.title}>
                Interpretación del Mapa de Calor (Heatmap)
              </h2>
              <p className={styles.subtitle}>
                Guía metodológica, escala térmica y patrones de lectura curricular
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
              <MdGridView style={{ fontSize: '1.2rem' }} />
              <span>¿En qué consiste el Mapa de Calor?</span>
            </div>
            <p className={styles.conceptText}>
              Es una <strong>matriz bidimensional de doble entrada</strong> que cruza las <strong>14 UGELs</strong> con cada una de las <strong>preguntas evaluadas</strong> (P01 a P18).
            </p>
            <p className={styles.conceptText}>
              Cada celda refleja la <strong>tasa de no acierto / error</strong>: el porcentaje (%) de estudiantes que <strong>no lograron responder correctamente esa pregunta</strong>. Permite identificar de manera inmediata <strong>dónde se concentran los focos de dificultad pedagógica</strong> en toda la región sin tener que revisar reporte por reporte.
            </p>
          </div>

          {/* Tarjeta de Aclaración Crucial sobre la Población Evaluada */}
          <div className={styles.aclaracionCard}>
            <div className={styles.aclaracionHeader}>
              <MdInfoOutline style={{ fontSize: '1.25rem' }} />
              <span>Aclaración clave: ¿Qué estudiantes componen este porcentaje?</span>
            </div>
            <p className={styles.aclaracionText}>
              <strong>No se restringe únicamente</strong> a los alumnos que obtuvieron la calificación global de «Previo al Inicio» en la prueba. La métrica toma en cuenta al <strong>100% de los estudiantes evaluados</strong> en esa UGEL y calcula qué proporción de ellos falló ese ítem específico.
            </p>
            <div className={styles.formulaBox}>
              <div className={styles.formulaMath}>
                % Celda = ((Total Evaluados - Respuestas Correctas) / Total Evaluados) × 100
              </div>
              <p className={styles.formulaDetail}>
                <strong>Ejemplo práctico:</strong> Si en una UGEL rindieron 1,000 estudiantes y en la pregunta P03 acertaron 480 alumnos (48%), los otros <strong>520 alumnos fallaron (52%)</strong>. La celda del Heatmap mostrará <strong>52%</strong> en color naranja.
              </p>
            </div>
            <p className={styles.aclaracionText}>
              Se le vincula pedagógicamente a «Previo al Inicio» porque quien no logra responder la pregunta se encuentra en <strong>situación de rezago en esa capacidad específica</strong>, independientemente de si en el puntaje total del examen logró alcanzar el nivel Inicio o En Proceso.
            </p>
          </div>

          {/* Desglose de Estructura */}
          <section className={styles.section}>
            <h3 className={styles.sectionTitle}>
              📐 Estructura de la Matriz
            </h3>
            <div className={styles.elementosGrid}>
              <div className={styles.elementoItem}>
                <div className={`${styles.elementoBadge} ${styles.badgeUgel}`}>
                  UGEL (Filas)
                </div>
                <div className={styles.elementoDesc}>
                  <strong>Eje Vertical · Población Total por Jurisdicción</strong>
                  <span>
                    Representa al universo completo de estudiantes evaluados en cada UGEL. Permite evaluar si las dificultades de una provincia son transversales o aisladas.
                  </span>
                </div>
              </div>

              <div className={styles.elementoItem}>
                <div className={`${styles.elementoBadge} ${styles.badgePregunta}`}>
                  P01 ... P18
                </div>
                <div className={styles.elementoDesc}>
                  <strong>Eje Horizontal · Preguntas Evaluadas</strong>
                  <span>
                    Cada ítem curricular de la prueba. Permite detectar preguntas con alto índice de fallo transversal a nivel regional.
                  </span>
                </div>
              </div>

              <div className={styles.elementoItem}>
                <div className={`${styles.elementoBadge} ${styles.badgeCelda}`}>
                  % y Tooltip
                </div>
                <div className={styles.elementoDesc}>
                  <strong>Celdas (Intersección UGEL × Pregunta)</strong>
                  <span>
                    Porcentaje de no acierto. Al posar el cursor, el tooltip muestra el conteo exacto de estudiantes que fallaron sobre el total evaluado (ej. <em>260 de 500 estudiantes evaluados no lograron resolver la pregunta</em>).
                  </span>
                </div>
              </div>
            </div>
          </section>

          {/* Escala Térmica de Colores */}
          <section className={styles.section}>
            <h3 className={styles.sectionTitle}>
              🌡️ Escala Térmica de Colores (7 Niveles de Dificultad)
            </h3>
            <div className={styles.thermalGrid}>
              <div className={styles.thermalCard} style={{ borderTopColor: '#2e7d32' }}>
                <div className={styles.thermalTop}>
                  <span className={styles.thermalHeader}>Dominio Alto</span>
                  <span className={styles.thermalColorDot} style={{ background: '#2e7d32' }} />
                </div>
                <span className={styles.thermalRange}>≤ 15% fallo</span>
                <span className={styles.thermalDesc}>≥ 85% de acierto. La gran mayoría resolvió el ítem.</span>
              </div>

              <div className={styles.thermalCard} style={{ borderTopColor: '#66bb6a' }}>
                <div className={styles.thermalTop}>
                  <span className={styles.thermalHeader}>Buen Dominio</span>
                  <span className={styles.thermalColorDot} style={{ background: '#66bb6a' }} />
                </div>
                <span className={styles.thermalRange}>16% – 25% fallo</span>
                <span className={styles.thermalDesc}>75% a 84% de acierto. Rezago bajo y controlado.</span>
              </div>

              <div className={styles.thermalCard} style={{ borderTopColor: '#aed581' }}>
                <div className={styles.thermalTop}>
                  <span className={styles.thermalHeader}>Regular</span>
                  <span className={styles.thermalColorDot} style={{ background: '#aed581' }} />
                </div>
                <span className={styles.thermalRange}>26% – 35% fallo</span>
                <span className={styles.thermalDesc}>Dificultad moderada. Entre 26% y 35% de errores.</span>
              </div>

              <div className={styles.thermalCard} style={{ borderTopColor: '#fbc02d' }}>
                <div className={styles.thermalTop}>
                  <span className={styles.thermalHeader}>Alerta Media</span>
                  <span className={styles.thermalColorDot} style={{ background: '#fff9c4', border: '1px solid #eab308' }} />
                </div>
                <span className={styles.thermalRange}>36% – 45% fallo</span>
                <span className={styles.thermalDesc}>Alerta preventiva. Más de un tercio no logró responder.</span>
              </div>

              <div className={styles.thermalCard} style={{ borderTopColor: '#ffcc80' }}>
                <div className={styles.thermalTop}>
                  <span className={styles.thermalHeader}>Dificultad Alta</span>
                  <span className={styles.thermalColorDot} style={{ background: '#ffcc80' }} />
                </div>
                <span className={styles.thermalRange}>46% – 55% fallo</span>
                <span className={styles.thermalDesc}>Casi la mitad de evaluados no logró la respuesta.</span>
              </div>

              <div className={styles.thermalCard} style={{ borderTopColor: '#ff8a65' }}>
                <div className={styles.thermalTop}>
                  <span className={styles.thermalHeader}>Severa</span>
                  <span className={styles.thermalColorDot} style={{ background: '#ff8a65' }} />
                </div>
                <span className={styles.thermalRange}>56% – 65% fallo</span>
                <span className={styles.thermalDesc}>Más de la mitad en rezago. Refuerzo focalizado.</span>
              </div>

              <div className={styles.thermalCard} style={{ borderTopColor: '#e53935' }}>
                <div className={styles.thermalTop}>
                  <span className={styles.thermalHeader}>Crítica</span>
                  <span className={styles.thermalColorDot} style={{ background: '#e53935' }} />
                </div>
                <span className={styles.thermalRange}>&gt; 65% fallo</span>
                <span className={styles.thermalDesc}>Alerta máxima. La gran mayoría no logró resolverlo.</span>
              </div>
            </div>
          </section>

          {/* Patrones de Lectura Pedagógica */}
          <section className={styles.section}>
            <h3 className={styles.sectionTitle}>
              🔎 Patrones Clave de Lectura e Interpretación
            </h3>
            <div className={styles.patronesContainer}>
              <div className={styles.patronCard}>
                <div className={styles.patronHeader}>
                  <MdViewWeek className={styles.patronIcon} />
                  <span>Lectura Vertical (Por Columna)</span>
                </div>
                <p className={styles.patronDesc}>
                  <strong>Diagnóstico Curricular Regional:</strong> Evalúa la dificultad intrínseca de la pregunta en toda la región.
                </p>
                <div className={styles.patronEjemplo}>
                  🔸 <strong>Columna Cálida (Naranja/Rojo):</strong> Ej. Pregunta <code>P03</code> (~50%). Señala una debilidad curricular transversal que debe abordarse con capacitación regional a docentes.
                </div>
                <div className={styles.patronEjemplo}>
                  🔹 <strong>Columna Fría (Verde):</strong> Ej. <code>P01</code> o <code>P09</code> (&lt;10%). Habilidad dominada en todas las provincias.
                </div>
              </div>

              <div className={styles.patronCard}>
                <div className={styles.patronHeader}>
                  <MdTableRows className={styles.patronIcon} />
                  <span>Lectura Horizontal (Por Fila)</span>
                </div>
                <p className={styles.patronDesc}>
                  <strong>Diagnóstico Institucional por UGEL:</strong> Permite ver la consistencia del aprendizaje en una provincia.
                </p>
                <div className={styles.patronEjemplo}>
                  🔸 <strong>Fila con muchas celdas cálidas:</strong> La UGEL enfrenta un rezago amplio que requiere asistencia técnica integral.
                </div>
                <div className={styles.patronEjemplo}>
                  🔹 <strong>Celda Aislada:</strong> Si una UGEL tiene rojo en una pregunta que las demás tienen verde, indica una brecha muy específica de esa jurisdicción.
                </div>
              </div>
            </div>
          </section>

          {/* Utilidad para la Toma de Decisiones */}
          <div className={styles.decisionesBox}>
            <div className={styles.decisionesTitle}>
              <MdLightbulb style={{ fontSize: '1.2rem', color: '#2563eb' }} />
              <span>¿Cómo utilizar el Heatmap en la gestión educativa?</span>
            </div>
            <ul className={styles.decisionesList}>
              <li>
                <strong>Focalización pedagógica prioritaria:</strong> Diseñar talleres y guías de refuerzo concentrados exactamente en las capacidades de las preguntas en naranja y rojo.
              </li>
              <li>
                <strong>Monitoreo evolutivo inter-etapas:</strong> Al pasar de Diagnóstica (EDI) a Progresiva 1 (EP1) y Progresiva 2 (EP2), verificar si las columnas «se enfrían» (cambian de naranja a verde), evidenciando el impacto de las intervenciones.
              </li>
              <li>
                <strong>Optimización de recursos:</strong> Asignar acompañamiento pedagógico presencial a las UGELs con mayor acumulación de calor térmico.
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

export default GuiaHeatmapModal;
