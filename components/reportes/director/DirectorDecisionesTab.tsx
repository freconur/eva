import React, { useState, useMemo, useEffect, useRef, useCallback } from 'react';
import {
  MdHelpOutline,
  MdKeyboardArrowDown,
  MdKeyboardArrowUp,
  MdUnfoldMore,
  MdUnfoldLess,
  MdTrackChanges,
  MdTableChart,
  MdClass,
  MdFullscreen,
  MdFullscreenExit,
} from 'react-icons/md';
import { Evaluaciones, PreguntasRespuestas } from '@/features/types/types';
import CustomFilterDropdown, { FilterOption } from '@/components/reportes/CustomFilterDropdown';
import { DirectorMetricasResumen, SeccionMetrica } from './types';
import { getAlertaInfo, formatQuestionCode } from './useMetricasDirector';
import EvidenciaCaptureButton from './EvidenciaCaptureButton';
import EvidenciaBanner from './EvidenciaBanner';
import styles from './DirectorVisualizaciones.module.css';

interface DirectorDecisionesTabProps {
  metricas: DirectorMetricasResumen;
  preguntas: PreguntasRespuestas[];
  evaluacion?: Evaluaciones;
  categoryName?: string;
  onOpenQuestionDetail: (order: number, coords: { x: number; y: number }) => void;
  onOpenGuiaModal: () => void;
  onOpenBaremoModal?: () => void;
  isDocenteView?: boolean;
  isUgelView?: boolean;
  ugelName?: string;
  selectedSeccion?: string;
  onSelectSeccion?: (secId: string) => void;
  seccionOptions?: FilterOption[];
}

export const DirectorDecisionesTab: React.FC<DirectorDecisionesTabProps> = ({
  metricas,
  preguntas,
  evaluacion,
  categoryName,
  onOpenQuestionDetail,
  onOpenGuiaModal,
  isDocenteView = false,
  isUgelView = false,
  ugelName,
  selectedSeccion: propSelectedSeccion,
  onSelectSeccion,
  seccionOptions: propSeccionOptions,
}) => {
  const { secciones, kpis, activeBaremo } = metricas;

  const [localSelectedSeccion, setLocalSelectedSeccion] = useState<string>(() => {
    if (propSelectedSeccion) return propSelectedSeccion;
    return isDocenteView ? 'global' : 'all';
  });

  const activeSelectedSeccion =
    propSelectedSeccion !== undefined ? propSelectedSeccion : localSelectedSeccion;

  // Sincronizar estado local si cambia la prop
  useEffect(() => {
    if (propSelectedSeccion !== undefined) {
      setLocalSelectedSeccion(propSelectedSeccion);
    }
  }, [propSelectedSeccion]);

  // Opciones para el dropdown custom de aulas/secciones
  const dropdownOptions: FilterOption[] = useMemo(() => {
    if (propSeccionOptions && propSeccionOptions.length > 0) {
      return propSeccionOptions;
    }
    const list: FilterOption[] = [];

    if (isDocenteView) {
      list.push({
        value: 'global',
        label: 'Global (Todos mis estudiantes)',
        badge: `${metricas.totalIe?.totalEstudiantes || 0} alumnos`,
        badgeType: 'neutral',
      });

      if (metricas.secciones.length > 1) {
        list.push({
          value: 'all',
          label: `Todas mis secciones (${metricas.secciones.length} aulas)`,
          badge: `${metricas.totalIe?.totalEstudiantes || 0} eval.`,
          badgeType: 'neutral',
        });
      }
    } else {
      list.push({
        value: 'all',
        label: `Todas las secciones (${metricas.secciones.length} aulas)`,
        badge: `${metricas.totalIe?.totalEstudiantes || 0} eval.`,
        badgeType: 'neutral',
      });
    }

    metricas.secciones.forEach((sec) => {
      list.push({
        value: String(sec.id),
        label: sec.nombre,
        badge: `${sec.totalEstudiantes} eval.`,
        badgeType: sec.criticas > 0 ? 'warning' : 'neutral',
      });
    });

    return list;
  }, [propSeccionOptions, metricas.secciones, metricas.totalIe?.totalEstudiantes, isDocenteView]);

  // Secciones a renderizar en la tabla según el filtro
  const displaySecciones: SeccionMetrica[] = useMemo(() => {
    if (isUgelView) {
      if (metricas.totalIe) {
        return [
          {
            ...metricas.totalIe,
            id: 'global_ugel',
            nombre: ugelName ? `Consolidado UGEL ${ugelName}` : 'Consolidado UGEL',
            docenteNombre: undefined,
          },
        ];
      }
      return [];
    }

    if (activeSelectedSeccion === 'global') {
      const existingGlobal = metricas.secciones.find((s) => s.id === 'global');
      if (existingGlobal) {
        return [
          {
            ...existingGlobal,
            nombre: isDocenteView
              ? 'Consolidado Global (Todos mis estudiantes)'
              : 'Consolidado I.E. (Global)',
            docenteNombre: isDocenteView ? undefined : existingGlobal.docenteNombre,
          },
        ];
      }
      if (metricas.totalIe) {
        return [
          {
            ...metricas.totalIe,
            id: 'global',
            nombre: isDocenteView
              ? 'Consolidado Global (Todos mis estudiantes)'
              : 'Consolidado I.E. (Global)',
            docenteNombre: isDocenteView ? undefined : metricas.totalIe.docenteNombre,
          },
        ];
      }
    }

    if (activeSelectedSeccion !== 'all') {
      const match = metricas.secciones.filter((s) => String(s.id) === String(activeSelectedSeccion));
      if (match.length > 0) return match;
    }

    return metricas.secciones.filter((s) => s.id !== 'global' && s.id !== 'total_ie');
  }, [metricas.secciones, metricas.totalIe, activeSelectedSeccion, isDocenteView, isUgelView, ugelName]);

  // KPIs dinámicos adaptados a la sección, global o consolidado UGEL seleccionado
  const activeKpis = useMemo(() => {
    if (isUgelView) {
      const ugelSec = metricas.totalIe || displaySecciones[0];
      if (ugelSec) {
        return {
          totalCritico: ugelSec.criticas,
          totalAlto: ugelSec.altas,
          totalMedio: ugelSec.medias,
          totalBajo: ugelSec.bajas,
          avgPrev: ugelSec.avgPrev,
        };
      }
      return kpis;
    }
    if (activeSelectedSeccion === 'global') {
      const globalSec = metricas.totalIe || displaySecciones.find((s) => s.id === 'global');
      if (globalSec) {
        return {
          totalCritico: globalSec.criticas,
          totalAlto: globalSec.altas,
          totalMedio: globalSec.medias,
          totalBajo: globalSec.bajas,
          avgPrev: globalSec.avgPrev,
        };
      }
    }
    if (activeSelectedSeccion !== 'all' && displaySecciones.length === 1) {
      const sec = displaySecciones[0];
      return {
        totalCritico: sec.criticas,
        totalAlto: sec.altas,
        totalMedio: sec.medias,
        totalBajo: sec.bajas,
        avgPrev: sec.avgPrev,
      };
    }
    return kpis;
  }, [activeSelectedSeccion, displaySecciones, metricas.totalIe, kpis, isUgelView]);

  const [expandedSectionIds, setExpandedSectionIds] = useState<Record<string, boolean>>({});

  // Auto-expandir cuando hay una sola sección en pantalla (sección individual o cohorte global)
  useEffect(() => {
    if (displaySecciones.length === 1) {
      const secId = displaySecciones[0].id;
      setExpandedSectionIds((prev) => ({
        ...prev,
        [secId]: prev[secId] !== undefined ? prev[secId] : true,
      }));
    }
  }, [displaySecciones]);

  const handleSectionChange = (newVal: string) => {
    setLocalSelectedSeccion(newVal);
    if (onSelectSeccion) {
      onSelectSeccion(newVal);
    }
    if (newVal !== 'all') {
      setExpandedSectionIds({ [newVal]: true });
    }
  };

  const toggleExpandSection = (secId: string) => {
    setExpandedSectionIds((prev) => ({
      ...prev,
      [secId]: !prev[secId],
    }));
  };

  const allAreExpanded =
    displaySecciones.length > 0 &&
    displaySecciones.every((sec) => !!expandedSectionIds[sec.id]);

  const toggleAllSections = () => {
    if (allAreExpanded) {
      setExpandedSectionIds({});
    } else {
      const next: Record<string, boolean> = {};
      displaySecciones.forEach((sec) => {
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

  // Referencias para Pantalla Completa y Captura de Evidencia en Alta Resolución
  const containerRef = useRef<HTMLDivElement>(null);
  const matrixCaptureRef = useRef<HTMLDivElement>(null);
  const [isFullScreen, setIsFullScreen] = useState<boolean>(false);

  const toggleFullscreen = useCallback(async () => {
    try {
      if (!isFullScreen) {
        if (containerRef.current?.requestFullscreen) {
          await containerRef.current.requestFullscreen().catch(() => {});
        }
        setIsFullScreen(true);
      } else {
        if (document.fullscreenElement) {
          await document.exitFullscreen().catch(() => {});
        }
        setIsFullScreen(false);
      }
    } catch {
      setIsFullScreen((prev) => !prev);
    }
  }, [isFullScreen]);

  // Sincronizar evento de fullscreen del navegador (Esc o F11)
  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullScreen(!!document.fullscreenElement);
    };
    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => {
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
    };
  }, []);

  // Tecla Escape para salir de pantalla completa
  useEffect(() => {
    if (!isFullScreen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (document.fullscreenElement) {
          document.exitFullscreen().catch(() => {});
        }
        setIsFullScreen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isFullScreen]);

  // Bloqueo de scroll en body al estar en pantalla completa
  useEffect(() => {
    if (isFullScreen) {
      const prevOverflow = document.body.style.overflow;
      document.body.style.overflow = 'hidden';
      return () => {
        document.body.style.overflow = prevOverflow;
      };
    }
  }, [isFullScreen]);

  return (
    <div
      ref={containerRef}
      className={`${styles.container} ${isFullScreen ? styles.containerFullscreen : ''}`}
    >
      {/* Encabezado con Botón de Guía Metodológica, Captura y Pantalla Completa */}
      <div className={styles.tabHeaderWithAction}>
        <div className={styles.tabHeaderTitleGroup}>
          <h3 className={styles.tabSectionTitle}>
            <MdTrackChanges style={{ color: '#2563eb', fontSize: '1.35rem', flexShrink: 0 }} />
            <span>Panel de Toma de Decisiones Pedagógicas</span>
          </h3>
          <p className={styles.tabSectionSubtitle}>
            {isUgelView
              ? `Priorización pedagógica consolidada a nivel de la UGEL ${ugelName || ''} e identificación de ítems de mayor rezago regional`
              : isDocenteView
              ? 'Priorización automática de focos críticos por aula y recomendaciones de intervención docente para tus estudiantes'
              : 'Priorización automática de focos críticos por sección y recomendaciones de intervención docente en aula'}
          </p>
        </div>
        <div className={styles.headerActionsGroup}>
          {/* Botón de Captura de Evidencia (PNG / Portapapeles) */}
          <EvidenciaCaptureButton
            targetRef={matrixCaptureRef}
            titulo="Panel de Toma de Decisiones Pedagógicas"
            subtitulo={isDocenteView ? 'Priorización de Alertas · Docente' : 'Priorización de Alertas · Director'}
            evaluacion={evaluacion}
            categoryName={categoryName}
          />

          {/* Botón de Pantalla Completa */}
          <button
            type="button"
            onClick={toggleFullscreen}
            className={`${styles.fullscreenBtn} ${isFullScreen ? styles.fullscreenBtnActive : ''}`}
            title={isFullScreen ? 'Salir de pantalla completa (Esc)' : 'Ver panel en pantalla completa'}
            aria-label={isFullScreen ? 'Salir de pantalla completa' : 'Pantalla completa'}
          >
            {isFullScreen ? (
              <>
                <MdFullscreenExit className={styles.fullscreenIcon} />
                <span className="hidden sm:inline">Salir pantalla completa</span>
              </>
            ) : (
              <>
                <MdFullscreen className={styles.fullscreenIcon} />
                <span className="hidden sm:inline">Pantalla completa</span>
              </>
            )}
          </button>

          {/* Botón de Guía Metodológica */}
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

      {/* ÁREA DE CAPTURA DE EVIDENCIA (Envuelve Membrete, KPIs, Tablas y Leyenda) */}
      <div ref={matrixCaptureRef} className="w-full flex flex-col gap-4">
        {/* Membrete Oficial para Exportación */}
        <EvidenciaBanner
          titulo="Panel de Toma de Decisiones Pedagógicas"
          subtitulo={isDocenteView ? 'Priorización de Alertas · Docente' : 'Priorización de Alertas · Director'}
          evaluacion={evaluacion}
          categoryName={categoryName}
        />

      {/* Barra Compacta Unificada de KPIs de Alertas */}
      <div className={styles.decisionCompactBar}>
        <div className={styles.kpiCompactItem}>
          <span className={`${styles.kpiDotIndicator} ${styles.kpiDotCritico}`} />
          <span className={`${styles.kpiBadge} ${styles.kpiBadgeCritico}`}>
            {activeKpis.totalCritico}
          </span>
          <span className={styles.kpiLabel}>Críticas (≥{activeBaremo.critico}%)</span>
        </div>

        <div className={styles.kpiDivider} />

        <div className={styles.kpiCompactItem}>
          <span className={`${styles.kpiDotIndicator} ${styles.kpiDotAlto}`} />
          <span className={`${styles.kpiBadge} ${styles.kpiBadgeAlto}`}>
            {activeKpis.totalAlto}
          </span>
          <span className={styles.kpiLabel}>
            Altas ({activeBaremo.alto}-{activeBaremo.critico - 1}%)
          </span>
        </div>

        <div className={styles.kpiDivider} />

        <div className={styles.kpiCompactItem}>
          <span className={`${styles.kpiDotIndicator} ${styles.kpiDotMedio}`} />
          <span className={`${styles.kpiBadge} ${styles.kpiBadgeMedio}`}>
            {activeKpis.totalMedio}
          </span>
          <span className={styles.kpiLabel}>
            Medias ({activeBaremo.medio}-{activeBaremo.alto - 1}%)
          </span>
        </div>

        <div className={styles.kpiDivider} />

        <div className={styles.kpiCompactItem}>
          <span className={`${styles.kpiDotIndicator} ${styles.kpiDotBajo}`} />
          <span className={`${styles.kpiBadge} ${styles.kpiBadgeBajo}`}>
            {activeKpis.totalBajo}
          </span>
          <span className={styles.kpiLabel}>Bajas (&lt;{activeBaremo.medio}%)</span>
        </div>

        <div className={styles.kpiDivider} />

        <div className={styles.kpiCompactItem}>
          <span className={`${styles.kpiDotIndicator} ${styles.kpiDotPromedio}`} />
          <span className={`${styles.kpiBadge} ${styles.kpiBadgePromedio}`}>
            {activeKpis.avgPrev}%
          </span>
          <span className={styles.kpiLabel}>
            {isUgelView
              ? 'Rezago UGEL'
              : isDocenteView
              ? activeSelectedSeccion === 'global'
                ? 'Rezago Global'
                : 'Rezago Aula'
              : activeSelectedSeccion === 'all'
                ? 'Promedio I.E.'
                : 'Rezago Aula'}
          </span>
        </div>
      </div>

      {/* Tabla Ejecutiva Master-Detail por Sección */}
      <div>
        <div className={styles.tableHeaderBar}>
          <div className={styles.tableHeaderInfo}>
            <MdTableChart style={{ color: '#64748b', fontSize: '1.1rem' }} />
            <span>
              {isUgelView
                ? `Consolidado pedagógico regional UGEL · ${metricas.totalIe?.totalEstudiantes || (displaySecciones[0]?.totalEstudiantes ?? 0)} estudiantes evaluados`
                : isDocenteView
                ? activeSelectedSeccion === 'global'
                  ? `Priorización pedagógica global · Todos tus estudiantes evaluados (${metricas.totalIe?.totalEstudiantes || (displaySecciones[0]?.totalEstudiantes ?? 0)} alumnos)`
                  : `Priorización pedagógica por aula (${displaySecciones.length} ${displaySecciones.length === 1 ? 'aula' : 'aulas'})`
                : activeSelectedSeccion !== 'all' && displaySecciones.length === 1
                  ? `Resumen de criticidad para ${displaySecciones[0].nombre} · ${displaySecciones[0].totalEstudiantes} estudiantes`
                  : `Resumen de criticidad por Sección (${displaySecciones.length} aulas) · Ordenadas por riesgo pedagógico`}
            </span>
          </div>

          {!isUgelView && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem', flexWrap: 'wrap' }}>
              <CustomFilterDropdown
                label="Filtrar aula:"
                icon={<MdClass style={{ color: '#2563eb', fontSize: '1.15rem' }} />}
                value={activeSelectedSeccion}
                options={dropdownOptions}
                onChange={handleSectionChange}
                minWidth={200}
                showSearch={dropdownOptions.length > 5}
              />

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
                    <span>Expandir todas ({displaySecciones.length})</span>
                  </>
                )}
              </button>
            </div>
          )}
        </div>

        <div className={styles.tableWrapper}>
          <table className={styles.executiveTable}>
            <thead>
              <tr>
                <th style={{ width: '50px' }}>#</th>
                <th style={{ minWidth: '160px', textAlign: 'left' }}>
                  {isUgelView
                    ? 'Ámbito / Consolidado'
                    : isDocenteView
                    ? activeSelectedSeccion === 'global'
                      ? 'Cohorte'
                      : 'Sección / Aula'
                    : 'Sección / Docente'}
                </th>
                <th style={{ minWidth: '130px' }}>Nivel de Riesgo</th>
                <th style={{ minWidth: '140px' }}>Alertas por Ítem</th>
                <th style={{ minWidth: '140px' }}>Ítem Más Crítico</th>
                <th style={{ minWidth: '240px', textAlign: 'left' }}>Acción Prioritaria Sugerida</th>
                <th style={{ width: '80px' }}>Detalle</th>
              </tr>
            </thead>
            <tbody>
              {displaySecciones.length === 0 ? (
                <tr>
                  <td colSpan={7} className="text-center py-8 text-slate-500 text-sm">
                    No se encontraron aulas o estudiantes evaluados para el filtro seleccionado.
                  </td>
                </tr>
              ) : (
                displaySecciones.map((sec, idx) => {
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
                            {!isDocenteView && !isUgelView && sec.docenteNombre && (
                              <span style={{ fontSize: '0.72rem', color: '#475569' }}>
                                Prof. {sec.docenteNombre}
                              </span>
                            )}
                            <span className={styles.sectionCountText}>
                              {sec.totalEstudiantes} {isUgelView ? 'estudiantes evaluados en la UGEL' : 'estudiantes evaluados'}
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
              }))}
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
  </div>
);
};

export default DirectorDecisionesTab;
