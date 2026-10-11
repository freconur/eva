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
import {
  BaremoDecisiones,
  DEFAULT_BAREMO_DECISIONES,
} from './ConfigurarBaremoModal';
import styles from './GuiaBurbujasModal.module.css';

interface GuiaBurbujasModalProps {
  isOpen: boolean;
  onClose: () => void;
  baremo?: BaremoDecisiones;
}

export const GuiaBurbujasModal: React.FC<GuiaBurbujasModalProps> = ({
  isOpen,
  onClose,
  baremo,
}) => {
  const activeBaremo = baremo || DEFAULT_BAREMO_DECISIONES;
  const step1 = Math.round(activeBaremo.medio * 0.38);
  const step2 = Math.round(activeBaremo.medio * 0.72);
  const criticoExtreme = activeBaremo.critico + Math.max(5, Math.round((100 - activeBaremo.critico) / 4));

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
                Guía metodológica, calibración con el Baremo Oficial (Bajo &lt;{activeBaremo.medio}%, Medio {activeBaremo.medio}–{activeBaremo.alto - 1}%, Alto {activeBaremo.alto}–{activeBaremo.critico - 1}%, Crítico ≥{activeBaremo.critico}%) y patrones de lectura
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
              🫧 Escala Visual de Burbujas Calibrada con el Baremo (7 Niveles Progresivos)
            </h3>
            <div className={styles.bubbleScaleGrid}>
              {/* Nivel 1 */}
              <div className={styles.bubbleCard}>
                <div className={styles.bubblePreviewWrapper}>
                  <div
                    className={styles.bubbleSample}
                    style={{ width: 26, height: 26, background: '#059669', fontSize: '0.6rem' }}
                  >
                    {Math.min(12, step1)}%
                  </div>
                </div>
                <div className={styles.bubbleLabelGroup}>
                  <span className={styles.bubbleCardHeader}>Dominio Alto</span>
                  <span className={styles.bubbleCardRange}>≤ {step1}%</span>
                  <span className={styles.bubbleCardSize}>26 px · Zona Bajo</span>
                  <span className={styles.bubbleCardDesc}>Rezago mínimo. La gran mayoría resolvió el ítem.</span>
                </div>
              </div>

              {/* Nivel 2 */}
              <div className={styles.bubbleCard}>
                <div className={styles.bubblePreviewWrapper}>
                  <div
                    className={styles.bubbleSample}
                    style={{ width: 29, height: 29, background: '#10b981', fontSize: '0.62rem' }}
                  >
                    {Math.round((step1 + step2) / 2)}%
                  </div>
                </div>
                <div className={styles.bubbleLabelGroup}>
                  <span className={styles.bubbleCardHeader}>Buen Dominio</span>
                  <span className={styles.bubbleCardRange}>{step1 + 1}% – {step2}%</span>
                  <span className={styles.bubbleCardSize}>29 px · Zona Bajo</span>
                  <span className={styles.bubbleCardDesc}>Nivel de rezago bajo y dentro de lo esperado.</span>
                </div>
              </div>

              {/* Nivel 3 */}
              <div className={styles.bubbleCard}>
                <div className={styles.bubblePreviewWrapper}>
                  <div
                    className={styles.bubbleSample}
                    style={{ width: 33, height: 33, background: '#84cc16', color: '#ffffff', fontSize: '0.65rem' }}
                  >
                    {Math.max(step2 + 1, activeBaremo.medio - 5)}%
                  </div>
                </div>
                <div className={styles.bubbleLabelGroup}>
                  <span className={styles.bubbleCardHeader}>Regular</span>
                  <span className={styles.bubbleCardRange}>{step2 + 1}% – {activeBaremo.medio - 1}%</span>
                  <span className={styles.bubbleCardSize}>33 px · Zona Bajo</span>
                  <span className={styles.bubbleCardDesc}>Dificultad leve. Próximo al umbral de alerta media.</span>
                </div>
              </div>

              {/* Nivel 4 */}
              <div className={styles.bubbleCard}>
                <div className={styles.bubblePreviewWrapper}>
                  <div
                    className={styles.bubbleSample}
                    style={{
                      width: 37,
                      height: 37,
                      background: '#f59e0b',
                      color: '#ffffff',
                      fontSize: '0.68rem',
                    }}
                  >
                    {activeBaremo.medio}%
                  </div>
                </div>
                <div className={styles.bubbleLabelGroup}>
                  <span className={styles.bubbleCardHeader}>Alerta Media</span>
                  <span className={styles.bubbleCardRange}>{activeBaremo.medio}% – {activeBaremo.alto - 1}%</span>
                  <span className={styles.bubbleCardSize}>37 px · Zona Medio</span>
                  <span className={styles.bubbleCardDesc}>Rezago preventivo. Requiere monitoreo y observación.</span>
                </div>
              </div>

              {/* Nivel 5 */}
              <div className={styles.bubbleCard}>
                <div className={styles.bubblePreviewWrapper}>
                  <div
                    className={styles.bubbleSample}
                    style={{ width: 41, height: 41, background: '#f97316', color: '#ffffff', fontSize: '0.72rem' }}
                  >
                    {activeBaremo.alto}%
                  </div>
                </div>
                <div className={styles.bubbleLabelGroup}>
                  <span className={styles.bubbleCardHeader}>Dificultad Alta</span>
                  <span className={styles.bubbleCardRange}>{activeBaremo.alto}% – {activeBaremo.critico - 1}%</span>
                  <span className={styles.bubbleCardSize}>41 px · Zona Alto</span>
                  <span className={styles.bubbleCardDesc}>Proporción alta en rezago. Priorizar práctica adicional.</span>
                </div>
              </div>

              {/* Nivel 6 */}
              <div className={styles.bubbleCard}>
                <div className={styles.bubblePreviewWrapper}>
                  <div
                    className={styles.bubbleSample}
                    style={{ width: 45, height: 45, background: '#f43f5e', fontSize: '0.74rem' }}
                  >
                    {activeBaremo.critico}%
                  </div>
                </div>
                <div className={styles.bubbleLabelGroup}>
                  <span className={styles.bubbleCardHeader}>Severa</span>
                  <span className={styles.bubbleCardRange}>{activeBaremo.critico}% – {criticoExtreme - 1}%</span>
                  <span className={styles.bubbleCardSize}>45 px · Zona Crítico</span>
                  <span className={styles.bubbleCardDesc}>Emergencia pedagógica. Refuerzo e intervención prioritaria.</span>
                </div>
              </div>

              {/* Nivel 7 */}
              <div className={styles.bubbleCard}>
                <div className={styles.bubblePreviewWrapper}>
                  <div
                    className={styles.bubbleSample}
                    style={{ width: 48, height: 48, background: '#e11d48', fontSize: '0.76rem' }}
                  >
                    {criticoExtreme}%
                  </div>
                </div>
                <div className={styles.bubbleLabelGroup}>
                  <span className={styles.bubbleCardHeader}>Crítica Extrema</span>
                  <span className={styles.bubbleCardRange}>≥ {criticoExtreme}%</span>
                  <span className={styles.bubbleCardSize}>48 px · Zona Crítico</span>
                  <span className={styles.bubbleCardDesc}>Alerta máxima. Rezago crítico masivo en la capacidad.</span>
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
