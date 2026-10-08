import React, { useState } from 'react';
import {
  MdHelpOutline,
  MdKeyboardArrowDown,
  MdKeyboardArrowUp,
  MdUnfoldMore,
  MdUnfoldLess,
  MdTrackChanges,
  MdTableChart,
} from 'react-icons/md';
import { PreguntasRespuestas } from '@/features/types/types';
import { DirectorMetricasResumen } from './types';
import { getAlertaInfo, formatQuestionCode } from './useMetricasDirector';
import styles from './DirectorVisualizaciones.module.css';

interface DirectorDecisionesTabProps {
  metricas: DirectorMetricasResumen;
  preguntas: PreguntasRespuestas[];
  onOpenQuestionDetail: (order: number, coords: { x: number; y: number }) => void;
  onOpenGuiaModal: () => void;
  onOpenBaremoModal?: () => void;
}

export const DirectorDecisionesTab: React.FC<DirectorDecisionesTabProps> = ({
  metricas,
  preguntas,
  onOpenQuestionDetail,
  onOpenGuiaModal,
}) => {
  const { secciones, kpis, activeBaremo } = metricas;
  const [expandedSectionIds, setExpandedSectionIds] = useState<Record<string, boolean>>({});

  const toggleExpandSection = (secId: string) => {
    setExpandedSectionIds((prev) => ({
      ...prev,
      [secId]: !prev[secId],
    }));
  };

  const allAreExpanded =
    secciones.length > 0 &&
    secciones.every((sec) => !!expandedSectionIds[sec.id]);

  const toggleAllSections = () => {
    if (allAreExpanded) {
      setExpandedSectionIds({});
    } else {
      const next: Record<string, boolean> = {};
      secciones.forEach((sec) => {
        next[sec.id] = true;
      });
      setExpandedSectionIds(next);
    }
  };

  // Helper para buscar actuación docente configurada en la pregunta
  const getActuacionDocente = (order: number): string => {
    const q = preguntas.find(
      (p, idx) => (p.order !== undefined && p.order !== null ? Number(p.order) : idx + 1) === order
    );
    return q?.preguntaDocente?.trim() || '';
  };

  return (
    <div className={styles.container}>
      {/* Encabezado con Botón de Guía Metodológica */}
      <div className={styles.tabHeaderWithAction}>
        <div className={styles.tabHeaderTitleGroup}>
          <h3 className={styles.tabSectionTitle}>
            <MdTrackChanges style={{ color: '#2563eb', fontSize: '1.35rem', flexShrink: 0 }} />
            <span>Panel de Toma de Decisiones Pedagógicas</span>
          </h3>
          <p className={styles.tabSectionSubtitle}>
            Priorización automática de focos críticos por sección y recomendaciones de intervención docente en aula
          </p>
        </div>
        <div className={styles.headerActionsGroup}>
          <button
            type="button"
            className={styles.infoHelpBtn}
            onClick={onOpenGuiaModal}
            title="¿En qué consiste este panel de decisiones? Haz clic para ver la guía metodológica"
          >
            <MdHelpOutline className={styles.infoHelpIcon} />
            <span>¿Cómo interpretar este panel?</span>
          </button>
        </div>
      </div>

      {/* Barra Compacta Unificada de KPIs de Alertas */}
      <div className={styles.decisionCompactBar}>
        <div className={styles.kpiCompactItem}>
          <span className={`${styles.kpiDotIndicator} ${styles.kpiDotCritico}`} />
          <span className={`${styles.kpiBadge} ${styles.kpiBadgeCritico}`}>
            {kpis.totalCritico}
          </span>
          <span className={styles.kpiLabel}>Críticas (≥{activeBaremo.critico}%)</span>
        </div>

        <div className={styles.kpiDivider} />

        <div className={styles.kpiCompactItem}>
          <span className={`${styles.kpiDotIndicator} ${styles.kpiDotAlto}`} />
          <span className={`${styles.kpiBadge} ${styles.kpiBadgeAlto}`}>
            {kpis.totalAlto}
          </span>
          <span className={styles.kpiLabel}>
            Altas ({activeBaremo.alto}-{activeBaremo.critico - 1}%)
          </span>
        </div>

        <div className={styles.kpiDivider} />

        <div className={styles.kpiCompactItem}>
          <span className={`${styles.kpiDotIndicator} ${styles.kpiDotMedio}`} />
          <span className={`${styles.kpiBadge} ${styles.kpiBadgeMedio}`}>
            {kpis.totalMedio}
          </span>
          <span className={styles.kpiLabel}>
            Medias ({activeBaremo.medio}-{activeBaremo.alto - 1}%)
          </span>
        </div>

        <div className={styles.kpiDivider} />

        <div className={styles.kpiCompactItem}>
          <span className={`${styles.kpiDotIndicator} ${styles.kpiDotBajo}`} />
          <span className={`${styles.kpiBadge} ${styles.kpiBadgeBajo}`}>
            {kpis.totalBajo}
          </span>
          <span className={styles.kpiLabel}>Bajas (&lt;{activeBaremo.medio}%)</span>
        </div>

        <div className={styles.kpiDivider} />

        <div className={styles.kpiCompactItem}>
          <span className={`${styles.kpiDotIndicator} ${styles.kpiDotPromedio}`} />
          <span className={`${styles.kpiBadge} ${styles.kpiBadgePromedio}`}>
            {kpis.avgPrev}%
          </span>
          <span className={styles.kpiLabel}>Promedio I.E.</span>
        </div>
      </div>

      {/* Tabla Ejecutiva Master-Detail por Sección */}
      <div>
        <div className={styles.tableHeaderBar}>
          <div className={styles.tableHeaderInfo}>
            <MdTableChart style={{ color: '#64748b', fontSize: '1.1rem' }} />
            <span>
              Resumen de criticidad por Sección ({secciones.length} aulas) · Ordenadas por riesgo pedagógico
            </span>
          </div>
          <button
            type="button"
            className={styles.toggleAllBtn}
            onClick={toggleAllSections}
            title={allAreExpanded ? 'Colapsar todas las secciones' : 'Expandir todas las secciones'}
          >
            {allAreExpanded ? (
              <>
                <MdUnfoldLess style={{ fontSize: '1rem' }} />
                <span>Colapsar todas</span>
              </>
            ) : (
              <>
                <MdUnfoldMore style={{ fontSize: '1rem' }} />
                <span>Expandir todas ({secciones.length})</span>
              </>
            )}
          </button>
        </div>

        <div className={styles.tableWrapper}>
          <table className={styles.executiveTable}>
            <thead>
              <tr>
                <th style={{ width: '50px' }}>#</th>
                <th style={{ minWidth: '160px', textAlign: 'left' }}>Sección / Docente</th>
                <th style={{ minWidth: '130px' }}>Nivel de Riesgo</th>
                <th style={{ minWidth: '140px' }}>Alertas por Ítem</th>
                <th style={{ minWidth: '140px' }}>Ítem Más Crítico</th>
                <th style={{ minWidth: '240px', textAlign: 'left' }}>Acción Prioritaria Sugerida</th>
                <th style={{ width: '80px' }}>Detalle</th>
              </tr>
            </thead>
            <tbody>
              {secciones.map((sec, idx) => {
                const isExpanded = !!expandedSectionIds[sec.id];
                const position = idx + 1;
                const topAlerta = sec.topPregunta
                  ? getAlertaInfo(sec.topPregunta.prevPct, activeBaremo)
                  : null;
                const actuacionTop = sec.topPregunta
                  ? getActuacionDocente(sec.topPregunta.order)
                  : '';

                return (
                  <React.Fragment key={sec.id}>
                    {/* Fila Maestra */}
                    <tr
                      className={`${styles.masterRow} ${isExpanded ? styles.masterRowExpanded : ''}`}
                      onClick={() => toggleExpandSection(sec.id)}
                    >
                      <td className="text-center font-bold">
                        <span className={styles.rankBadge}>{position}</span>
                      </td>
                      <td>
                        <div className={styles.sectionNameCell}>
                          <span className={styles.sectionNameText}>{sec.nombre}</span>
                          {sec.docenteNombre && (
                            <span style={{ fontSize: '0.72rem', color: '#475569' }}>
                              Prof. {sec.docenteNombre}
                            </span>
                          )}
                          <span className={styles.sectionCountText}>
                            {sec.totalEstudiantes} estudiantes evaluados
                          </span>
                        </div>
                      </td>
                      <td className="text-center">
                        <span
                          className={styles.riesgoBadge}
                          style={{
                            backgroundColor: sec.nivelRiesgo.bg,
                            color: sec.nivelRiesgo.text,
                          }}
                        >
                          <span
                            className={styles.riskDot}
                            style={{ backgroundColor: sec.nivelRiesgo.color }}
                          />
                          <span>{sec.nivelRiesgo.label}</span>
                        </span>
                        <div style={{ fontSize: '0.68rem', color: '#64748b', fontWeight: 600, marginTop: '2px' }}>
                          Rezago Prom: {sec.avgPrev}%
                        </div>
                      </td>
                      <td>
                        <div className={styles.miniBadgesRow}>
                          {sec.criticas > 0 && (
                            <span
                              className={`${styles.alertPill} ${styles.alertPillCritico}`}
                              title={`${sec.criticas} preguntas en estado crítico`}
                            >
                              <span className={`${styles.pillDot} ${styles.kpiDotCritico}`} />
                              <span>{sec.criticas}</span>
                            </span>
                          )}
                          {sec.altas > 0 && (
                            <span
                              className={`${styles.alertPill} ${styles.alertPillAlto}`}
                              title={`${sec.altas} preguntas en dificultad alta`}
                            >
                              <span className={`${styles.pillDot} ${styles.kpiDotAlto}`} />
                              <span>{sec.altas}</span>
                            </span>
                          )}
                          {sec.medias > 0 && (
                            <span
                              className={`${styles.alertPill} ${styles.alertPillMedio}`}
                              title={`${sec.medias} preguntas en alerta media`}
                            >
                              <span className={`${styles.pillDot} ${styles.kpiDotMedio}`} />
                              <span>{sec.medias}</span>
                            </span>
                          )}
                          {sec.bajas > 0 && (
                            <span
                              className={`${styles.alertPill} ${styles.alertPillBajo}`}
                              title={`${sec.bajas} preguntas en bajo rezago`}
                            >
                              <span className={`${styles.pillDot} ${styles.kpiDotBajo}`} />
                              <span>{sec.bajas}</span>
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="text-center">
                        {sec.topPregunta ? (
                          <span
                            className={styles.topItemChip}
                            style={{
                              backgroundColor: `${topAlerta?.color}18`,
                              color: topAlerta?.color,
                              borderColor: topAlerta?.color,
                            }}
                            onClick={(e) => {
                              e.stopPropagation();
                              const rect = e.currentTarget.getBoundingClientRect();
                              onOpenQuestionDetail(sec.topPregunta!.order, {
                                x: Math.round(rect.left + rect.width / 2),
                                y: Math.round(rect.bottom + 8),
                              });
                            }}
                            title={`Haz clic para ver el ítem y actuación de ${formatQuestionCode(sec.topPregunta.order)}`}
                          >
                            {formatQuestionCode(sec.topPregunta.order)} ({sec.topPregunta.prevPct}%)
                          </span>
                        ) : (
                          <span style={{ color: '#94a3b8' }}>-</span>
                        )}
                      </td>
                      <td>
                        <div className={styles.actionSuggestionText}>
                          {actuacionTop ? (
                            <span>{actuacionTop}</span>
                          ) : topAlerta ? (
                            <span>{topAlerta.accion}</span>
                          ) : (
                            <span style={{ color: '#94a3b8' }}>Sin intervenciones urgentes</span>
                          )}
                        </div>
                      </td>
                      <td className="text-center">
                        <button
                          type="button"
                          className={styles.expandButton}
                          title={isExpanded ? 'Ocultar desglose de preguntas' : 'Ver desglose de preguntas'}
                        >
                          {isExpanded ? <MdKeyboardArrowUp /> : <MdKeyboardArrowDown />}
                        </button>
                      </td>
                    </tr>

                    {/* Fila de Detalle Desplegable */}
                    {isExpanded && (
                      <tr className={styles.detailRow}>
                        <td colSpan={7}>
                          <div className={styles.detailContainer}>
                            <div className={styles.detailHeader}>
                              <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem' }}>
                                <MdTrackChanges style={{ color: '#2563eb', fontSize: '1rem', flexShrink: 0 }} />
                                Desglose de Ítems para {sec.nombre} ({sec.totalEstudiantes} alumnos)
                              </span>
                              <span style={{ fontSize: '0.72rem', color: '#64748b' }}>
                                Clic en el código de la pregunta para ver el ítem completo
                              </span>
                            </div>

                            <div className={styles.detailGrid}>
                              {Object.values(sec.preguntas).map((qStat) => {
                                const qAlerta = getAlertaInfo(qStat.prevPct, activeBaremo);
                                const qActuacion = getActuacionDocente(qStat.order);
                                const code = formatQuestionCode(qStat.order);

                                return (
                                  <div key={qStat.order} className={styles.detailCard}>
                                    <div className={styles.detailCardHeader}>
                                      <span
                                        className={styles.detailCardTitle}
                                        onClick={(e) => {
                                          const rect = e.currentTarget.getBoundingClientRect();
                                          onOpenQuestionDetail(qStat.order, {
                                            x: Math.round(rect.left + rect.width / 2),
                                            y: Math.round(rect.bottom + 8),
                                          });
                                        }}
                                      >
                                        {code}
                                      </span>
                                      <span
                                        className={styles.detailCardPct}
                                        style={{ color: qAlerta.color }}
                                      >
                                        {qStat.prevPct}% rezago
                                      </span>
                                    </div>

                                    <div className={styles.detailProgressBar}>
                                      <div
                                        className={styles.detailProgressFill}
                                        style={{
                                          width: `${qStat.prevPct}%`,
                                          backgroundColor: qAlerta.color,
                                        }}
                                      />
                                    </div>

                                    <div className={styles.detailCardAction}>
                                      {qActuacion ? (
                                        <span>{qActuacion}</span>
                                      ) : (
                                        <span>{qAlerta.accion}</span>
                                      )}
                                    </div>
                                  </div>
                                );
                              })}
                            </div>
                          </div>
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Leyenda del Baremo Oficial de Decisiones */}
        <div className={styles.legend}>
          <span className={styles.legendTitle}>Baremo Oficial:</span>
          <div className={styles.legendItem}>
            <div className={styles.legendDot} style={{ background: '#ef4444' }} />
            <span>Crítico (≥{activeBaremo.critico}%)</span>
          </div>
          <div className={styles.legendItem}>
            <div className={styles.legendDot} style={{ background: '#f97316' }} />
            <span>Alto ({activeBaremo.alto}-{activeBaremo.critico - 1}%)</span>
          </div>
          <div className={styles.legendItem}>
            <div className={styles.legendDot} style={{ background: '#eab308' }} />
            <span>Medio ({activeBaremo.medio}-{activeBaremo.alto - 1}%)</span>
          </div>
          <div className={styles.legendItem}>
            <div className={styles.legendDot} style={{ background: '#22c55e' }} />
            <span>Bajo (&lt;{activeBaremo.medio}%)</span>
          </div>
          <span className={styles.legendNotice}>
            Priorizar intervención pedagógica en las primeras posiciones del ranking
          </span>
          <button
            type="button"
            className={styles.infoHelpBtn}
            onClick={onOpenGuiaModal}
            style={{ padding: '0.25rem 0.65rem', fontSize: '0.74rem', marginLeft: 'auto' }}
            title="Ver explicación completa del Panel de Decisiones"
          >
            <MdHelpOutline className={styles.infoHelpIcon} style={{ fontSize: '0.95rem' }} />
            <span>Ver guía completa</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default DirectorDecisionesTab;
