import React from 'react';
import { MdHelpOutline, MdBubbleChart } from 'react-icons/md';
import { Evaluaciones, PreguntasRespuestas } from '@/features/types/types';
import { DirectorMetricasResumen } from './types';
import { formatQuestionCode } from './useMetricasDirector';
import styles from './DirectorVisualizaciones.module.css';

interface DirectorBurbujasTabProps {
  metricas: DirectorMetricasResumen;
  preguntas: PreguntasRespuestas[];
  evaluacion?: Evaluaciones;
  onOpenQuestionDetail: (order: number, coords: { x: number; y: number }) => void;
  onOpenGuiaModal: () => void;
}

// Función auxiliar para obtener el tamaño de burbuja según el % de rezago
export const getBubbleClass = (pct: number) => {
  if (pct <= 15) return styles.bubbleSize1;
  if (pct <= 25) return styles.bubbleSize2;
  if (pct <= 35) return styles.bubbleSize3;
  if (pct <= 45) return styles.bubbleSize4;
  if (pct <= 55) return styles.bubbleSize5;
  if (pct <= 65) return styles.bubbleSize6;
  return styles.bubbleSize7;
};

export const DirectorBurbujasTab: React.FC<DirectorBurbujasTabProps> = ({
  metricas,
  onOpenQuestionDetail,
  onOpenGuiaModal,
}) => {
  const { secciones, totalIe, sortedPreguntas } = metricas;

  const handleCellClick = (
    e: React.MouseEvent<HTMLDivElement>,
    order: number
  ) => {
    const rect = e.currentTarget.getBoundingClientRect();
    onOpenQuestionDetail(order, {
      x: Math.round(rect.left + rect.width / 2),
      y: Math.round(rect.bottom + 8),
    });
  };

  const handleHeaderClick = (
    e: React.MouseEvent<HTMLDivElement>,
    order: number
  ) => {
    const rect = e.currentTarget.getBoundingClientRect();
    onOpenQuestionDetail(order, {
      x: Math.round(rect.left + rect.width / 2),
      y: Math.round(rect.bottom + 8),
    });
  };

  return (
    <div className={styles.container}>
      {/* Encabezado con Botón de Interpretación Modal */}
      <div className={styles.tabHeaderWithAction}>
        <div className={styles.tabHeaderTitleGroup}>
          <h3 className={styles.tabSectionTitle}>
            <MdBubbleChart style={{ color: '#2563eb', fontSize: '1.35rem', flexShrink: 0 }} />
            <span>Matriz de Burbujas de Rezago Pedagógico</span>
          </h3>
          <p className={styles.tabSectionSubtitle}>
            Visualización de criticidad por aula y escala cromática según el % de estudiantes que fallaron cada pregunta
          </p>
        </div>
        <div className={styles.headerActionsGroup}>
          <button
            type="button"
            className={styles.infoHelpBtn}
            onClick={onOpenGuiaModal}
            title="¿En qué consiste este gráfico de burbujas? Haz clic para ver la guía metodológica y de interpretación"
          >
            <MdHelpOutline className={styles.infoHelpIcon} />
            <span>¿Cómo interpretar este gráfico?</span>
          </button>
        </div>
      </div>

      {/* Contenedor de la Matriz con Scroll Horizontal */}
      <div className={styles.bubbleContainer}>
        <div
          className={styles.bubbleGrid}
          style={{
            gridTemplateColumns: `190px repeat(${sortedPreguntas.length}, minmax(48px, 1fr))`,
          }}
        >
          {/* Fila de cabecera */}
          <div className={`${styles.bubbleHeader} ${styles.bubbleHeaderSeccion}`}>
            Sección / Aula
          </div>
          {sortedPreguntas.map((p, idx) => {
            const order = p.order !== undefined && p.order !== null ? Number(p.order) : idx + 1;
            const code = formatQuestionCode(order);
            return (
              <div
                key={order}
                className={`${styles.bubbleHeader} ${styles.bubbleHeaderPregunta}`}
                onClick={(e) => handleHeaderClick(e, order)}
                title={`Haz clic para ver el ítem y actuación pedagógica de ${code}`}
              >
                {code}
              </div>
            );
          })}

          {/* Filas por Sección */}
          {secciones.map((sec) => (
            <React.Fragment key={sec.id}>
              <div className={styles.bubbleCellSeccion}>
                <span style={{ fontWeight: 700 }}>{sec.nombre}</span>
                {sec.docenteNombre && (
                  <span className={styles.subDocenteName} title={sec.docenteNombre}>
                    {sec.docenteNombre}
                  </span>
                )}
                <span style={{ fontSize: '0.68rem', color: '#94a3b8' }}>
                  {sec.totalEstudiantes} alumnos
                </span>
              </div>
              {sortedPreguntas.map((p, idx) => {
                const order = p.order !== undefined && p.order !== null ? Number(p.order) : idx + 1;
                const stat = sec.preguntas[order];
                const bubbleCls = stat ? getBubbleClass(stat.prevPct) : '';
                return (
                  <div
                    key={order}
                    className={styles.bubbleCellWrapper}
                    onClick={(e) => handleCellClick(e, order)}
                  >
                    {stat && stat.totalEstudiantes > 0 ? (
                      <div
                        className={`${styles.bubbleBase} ${bubbleCls}`}
                        title={`${sec.nombre} · ${formatQuestionCode(order)}: ${stat.prevPct}% en rezago (${stat.falladas} de ${stat.totalEstudiantes} estudiantes evaluados fallaron esta pregunta). Haz clic para ver detalles del ítem.`}
                      >
                        {stat.prevPct}%
                      </div>
                    ) : (
                      <span className={styles.bubbleCellEmpty}>-</span>
                    )}
                  </div>
                );
              })}
            </React.Fragment>
          ))}

          {/* Fila Resumen "CONSOLIDADO I.E." */}
          {totalIe && (
            <React.Fragment key="total_ie">
              <div className={`${styles.bubbleCellSeccion} ${styles.bubbleCellSeccionTotal}`}>
                <span>{totalIe.nombre}</span>
                <span style={{ fontSize: '0.68rem', color: '#166534' }}>
                  {totalIe.totalEstudiantes} evaluados
                </span>
              </div>
              {sortedPreguntas.map((p, idx) => {
                const order = p.order !== undefined && p.order !== null ? Number(p.order) : idx + 1;
                const stat = totalIe.preguntas[order];
                const bubbleCls = stat ? getBubbleClass(stat.prevPct) : '';
                return (
                  <div
                    key={order}
                    className={styles.bubbleCellWrapper}
                    onClick={(e) => handleCellClick(e, order)}
                  >
                    {stat && stat.totalEstudiantes > 0 ? (
                      <div
                        className={`${styles.bubbleBase} ${bubbleCls}`}
                        title={`Consolidado I.E. · ${formatQuestionCode(order)}: ${stat.prevPct}% en rezago (${stat.falladas} de ${stat.totalEstudiantes} evaluados). Haz clic para ver detalles del ítem.`}
                      >
                        {stat.prevPct}%
                      </div>
                    ) : (
                      <span className={styles.bubbleCellEmpty}>-</span>
                    )}
                  </div>
                );
              })}
            </React.Fragment>
          )}
        </div>
      </div>

      {/* Leyenda de la Matriz de Burbujas */}
      <div className={styles.legend}>
        <span className={styles.legendTitle}>Escala:</span>
        <div className={styles.legendItem}>
          <div className={styles.legendDot} style={{ background: '#2e7d32' }} />
          <span>≤15%</span>
        </div>
        <div className={styles.legendItem}>
          <div className={styles.legendDot} style={{ background: '#43a047' }} />
          <span>16-25%</span>
        </div>
        <div className={styles.legendItem}>
          <div className={styles.legendDot} style={{ background: '#7cb342' }} />
          <span>26-35%</span>
        </div>
        <div className={styles.legendItem}>
          <div className={styles.legendDot} style={{ background: '#fbc02d' }} />
          <span>36-45%</span>
        </div>
        <div className={styles.legendItem}>
          <div className={styles.legendDot} style={{ background: '#fb8c00' }} />
          <span>46-55%</span>
        </div>
        <div className={styles.legendItem}>
          <div className={styles.legendDot} style={{ background: '#f4511e' }} />
          <span>56-65%</span>
        </div>
        <div className={styles.legendItem}>
          <div className={styles.legendDot} style={{ background: '#d32f2f' }} />
          <span>&gt;65%</span>
        </div>
        <span className={styles.legendNotice}>
          🫧 Diámetro y color indican criticidad de rezago (% de alumnos que fallaron la pregunta)
        </span>
      </div>
    </div>
  );
};

export default DirectorBurbujasTab;
