import React, { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import {
  MdClose,
  MdBubbleChart,
  MdColorLens,
  MdViewWeek,
  MdTableRows,
  MdLightbulb,
  MdCheckCircle,
} from 'react-icons/md';
import styles from './GuiaBurbujasModal.module.css';

interface GuiaBurbujasModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const GuiaBurbujasModal: React.FC<GuiaBurbujasModalProps> = ({
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
      aria-labelledby="bubble-modal-title"
    >
      <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
        {/* Cabecera */}
        <header className={styles.header}>
          <div className={styles.headerTitleGroup}>
            <div className={styles.headerIcon}>
              <MdBubbleChart />
            </div>
            <div>
              <h2 id="bubble-modal-title" className={styles.title}>
                Interpretación del Gráfico de Burbujas
              </h2>
              <p className={styles.subtitle}>
                Guía metodológica, doble codificación visual (tamaño y color) y patrones de lectura
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
              <MdBubbleChart style={{ fontSize: '1.25rem' }} />
              <span>¿En qué consiste el Gráfico de Burbujas?</span>
            </div>
            <p className={styles.conceptText}>
              Es una <strong>matriz bidimensional interactiva</strong> que cruza las <strong>14 UGELs</strong> con cada una de las <strong>preguntas evaluadas</strong> (P01, P02... Pn).
            </p>
            <p className={styles.conceptText}>
              Cada burbuja refleja el <strong>porcentaje (%) de estudiantes en el nivel «Previo al Inicio»</strong> (alumnos que no lograron responder satisfactoriamente el ítem). Utiliza una <strong>doble codificación perceptiva (tamaño y color simultáneos)</strong> para que las situaciones críticas destaquen inmediatamente a la vista.
            </p>
          </div>

          {/* Doble Variable Visual */}
          <section className={styles.section}>
            <h3 className={styles.sectionTitle}>
              🎨 Doble Variable Visual (Tamaño + Color)
            </h3>
            <div className={styles.variablesGrid}>
              <div className={styles.variableCard}>
                <div className={styles.variableHeader}>
                  <MdBubbleChart className={styles.variableIcon} />
                  <span>1. Diámetro / Tamaño (26px a 62px)</span>
                </div>
                <p className={styles.variableDesc}>
                  <strong>Magnitud del impacto:</strong> El radio del círculo es proporcional al porcentaje de rezago. Círculos pequeños representan poco o nulo rezago, mientras que círculos grandes alertan sobre un volumen elevado de alumnos con dificultades.
                </p>
              </div>

              <div className={styles.variableCard}>
                <div className={styles.variableHeader}>
                  <MdColorLens className={styles.variableIcon} />
                  <span>2. Color Térmico (Verde a Rojo)</span>
                </div>
                <p className={styles.variableDesc}>
                  <strong>Nivel de criticidad:</strong> Refuerza el tamaño mediante tonalidades semafóricas. Va desde el verde esmeralda (dominio y normalidad) pasando por amarillos/naranjas hasta el rojo carmesí (emergencia pedagógica).
                </p>
              </div>
            </div>
          </section>

          {/* Escala de 7 Niveles Visuales */}
          <section className={styles.section}>
            <h3 className={styles.sectionTitle}>
              🫧 Escala Visual de Burbujas (7 Niveles Progresivos)
            </h3>
            <div className={styles.bubbleScaleGrid}>
              {/* Nivel 1 */}
              <div className={styles.bubbleCard}>
                <div className={styles.bubblePreviewWrapper}>
                  <div
                    className={styles.bubbleSample}
                    style={{ width: 26, height: 26, background: '#2e7d32', fontSize: '0.6rem' }}
                  >
                    12%
                  </div>
                </div>
                <div className={styles.bubbleLabelGroup}>
                  <span className={styles.bubbleCardHeader}>Dominio Alto</span>
                  <span className={styles.bubbleCardRange}>≤ 15%</span>
                  <span className={styles.bubbleCardSize}>26 px</span>
                  <span className={styles.bubbleCardDesc}>Rezago mínimo. La gran mayoría resolvió el ítem.</span>
                </div>
              </div>

              {/* Nivel 2 */}
              <div className={styles.bubbleCard}>
                <div className={styles.bubblePreviewWrapper}>
                  <div
                    className={styles.bubbleSample}
                    style={{ width: 32, height: 32, background: '#66bb6a', fontSize: '0.62rem' }}
                  >
                    21%
                  </div>
                </div>
                <div className={styles.bubbleLabelGroup}>
                  <span className={styles.bubbleCardHeader}>Buen Dominio</span>
                  <span className={styles.bubbleCardRange}>16% – 25%</span>
                  <span className={styles.bubbleCardSize}>32 px</span>
                  <span className={styles.bubbleCardDesc}>Nivel de rezago bajo y dentro de lo esperado.</span>
                </div>
              </div>

              {/* Nivel 3 */}
              <div className={styles.bubbleCard}>
                <div className={styles.bubblePreviewWrapper}>
                  <div
                    className={styles.bubbleSample}
                    style={{ width: 38, height: 38, background: '#aed581', color: '#1e293b', textShadow: 'none', fontSize: '0.65rem' }}
                  >
                    30%
                  </div>
                </div>
                <div className={styles.bubbleLabelGroup}>
                  <span className={styles.bubbleCardHeader}>Regular</span>
                  <span className={styles.bubbleCardRange}>26% – 35%</span>
                  <span className={styles.bubbleCardSize}>38 px</span>
                  <span className={styles.bubbleCardDesc}>Dificultad moderada. Requiere observación.</span>
                </div>
              </div>

              {/* Nivel 4 */}
              <div className={styles.bubbleCard}>
                <div className={styles.bubblePreviewWrapper}>
                  <div
                    className={styles.bubbleSample}
                    style={{
                      width: 44,
                      height: 44,
                      background: '#fff9c4',
                      border: '1px solid #eab308',
                      color: '#1e293b',
                      textShadow: 'none',
                      fontSize: '0.68rem',
                    }}
                  >
                    42%
                  </div>
                </div>
                <div className={styles.bubbleLabelGroup}>
                  <span className={styles.bubbleCardHeader}>Alerta Media</span>
                  <span className={styles.bubbleCardRange}>36% – 45%</span>
                  <span className={styles.bubbleCardSize}>44 px</span>
                  <span className={styles.bubbleCardDesc}>Rezago preventivo en más de un tercio de alumnos.</span>
                </div>
              </div>

              {/* Nivel 5 */}
              <div className={styles.bubbleCard}>
                <div className={styles.bubblePreviewWrapper}>
                  <div
                    className={styles.bubbleSample}
                    style={{ width: 50, height: 50, background: '#ffcc80', color: '#1e293b', textShadow: 'none', fontSize: '0.72rem' }}
                  >
                    51%
                  </div>
                </div>
                <div className={styles.bubbleLabelGroup}>
                  <span className={styles.bubbleCardHeader}>Dificultad Alta</span>
                  <span className={styles.bubbleCardRange}>46% – 55%</span>
                  <span className={styles.bubbleCardSize}>50 px</span>
                  <span className={styles.bubbleCardDesc}>Cerca de la mitad no logra resolver la capacidad.</span>
                </div>
              </div>

              {/* Nivel 6 */}
              <div className={styles.bubbleCard}>
                <div className={styles.bubblePreviewWrapper}>
                  <div
                    className={styles.bubbleSample}
                    style={{ width: 56, height: 56, background: '#ff8a65', fontSize: '0.74rem' }}
                  >
                    60%
                  </div>
                </div>
                <div className={styles.bubbleLabelGroup}>
                  <span className={styles.bubbleCardHeader}>Severa</span>
                  <span className={styles.bubbleCardRange}>56% – 65%</span>
                  <span className={styles.bubbleCardSize}>56 px</span>
                  <span className={styles.bubbleCardDesc}>Más de la mitad en rezago. Refuerzo prioritario.</span>
                </div>
              </div>

              {/* Nivel 7 */}
              <div className={styles.bubbleCard}>
                <div className={styles.bubblePreviewWrapper}>
                  <div
                    className={styles.bubbleSample}
                    style={{ width: 62, height: 62, background: '#e53935', fontSize: '0.76rem' }}
                  >
                    72%
                  </div>
                </div>
                <div className={styles.bubbleLabelGroup}>
                  <span className={styles.bubbleCardHeader}>Crítica</span>
                  <span className={styles.bubbleCardRange}>&gt; 65%</span>
                  <span className={styles.bubbleCardSize}>62 px</span>
                  <span className={styles.bubbleCardDesc}>Alerta máxima. Rezago crítico masivo en el ítem.</span>
                </div>
              </div>
            </div>
          </section>

          {/* Patrones de Lectura */}
          <section className={styles.section}>
            <h3 className={styles.sectionTitle}>
              🔎 Patrones Clave de Lectura e Interpretación
            </h3>
            <div className={styles.patronesContainer}>
              <div className={styles.patronCard}>
                <div className={styles.patronHeader}>
                  <MdViewWeek className={styles.patronIcon} />
                  <span>Lectura Vertical (Por Pregunta)</span>
                </div>
                <p className={styles.patronDesc}>
                  <strong>Diagnóstico Curricular Regional:</strong> Evalúa el comportamiento intrínseco de cada ítem en toda la región Huánuco.
                </p>
                <div className={styles.patronEjemplo}>
                  🔸 <strong>Columna con burbujas gigantes:</strong> Indica una debilidad curricular generalizada (ej. inferencia compleja). Requiere talleres regionales a docentes.
                </div>
                <div className={styles.patronEjemplo}>
                  🔹 <strong>Columna con burbujas diminutas y verdes:</strong> Habilidad o contenido dominado satisfactoriamente por todas las provincias.
                </div>
              </div>

              <div className={styles.patronCard}>
                <div className={styles.patronHeader}>
                  <MdTableRows className={styles.patronIcon} />
                  <span>Lectura Horizontal (Por UGEL)</span>
                </div>
                <p className={styles.patronDesc}>
                  <strong>Diagnóstico Jurisdiccional:</strong> Permite ver la regularidad del rendimiento de una UGEL a lo largo de toda la prueba.
                </p>
                <div className={styles.patronEjemplo}>
                  🔸 <strong>Fila con predominio de burbujas grandes:</strong> La UGEL presenta rezago extendido en múltiples capacidades y necesita asistencia técnica global.
                </div>
                <div className={styles.patronEjemplo}>
                  🔹 <strong>Burbuja solitaria de gran tamaño:</strong> La UGEL va bien en casi todo pero tiene un tropiezo específico en esa pregunta particular.
                </div>
              </div>
            </div>
          </section>

          {/* Toma de Decisiones */}
          <div className={styles.decisionesBox}>
            <div className={styles.decisionesTitle}>
              <MdLightbulb style={{ fontSize: '1.25rem', color: '#16a34a' }} />
              <span>¿Cómo utilizar el Gráfico de Burbujas en la gestión educativa?</span>
            </div>
            <ul className={styles.decisionesList}>
              <li>
                <strong>Identificación visual instantánea:</strong> Permite a directores y especialistas ubicar los focos rojos más grandes en segundos, sin necesidad de cotejar tablas extensas de números.
              </li>
              <li>
                <strong>Monitoreo evolutivo inter-etapas (EDI ➔ EP1 ➔ EP2):</strong> El objetivo pedagógico es ver cómo las burbujas «se desinflan» (reducen su diámetro) y transicionan hacia colores verdes entre etapas de evaluación.
              </li>
              <li>
                <strong>Focalización precisa de recursos:</strong> Asignar acompañamiento pedagógico presencial y kits didácticos específicamente a las UGELs y preguntas con burbujas de mayor diámetro.
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

export default GuiaBurbujasModal;
