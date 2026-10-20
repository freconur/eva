import React, { useState, useRef, useMemo } from 'react';
import { Bar } from 'react-chartjs-2';
import {
  RiBarChartHorizontalLine,
  RiBarChart2Line,
  RiFullscreenLine,
  RiAwardLine,
} from 'react-icons/ri';
import { GlobalScoreInfoPopup } from './GlobalScoreInfoPopup';
import {
  getDimensionBarOptions,
  getDimensionVerticalBarOptions,
} from './chartOptions';
import {
  barDataLabelPlugin,
  hexToRgba,
  getDomainColor,
} from './chartPlugins';
import styles from './CardPromedioGlobalDominio.module.css';

export interface CardPromedioGlobalDominioProps {
  dimData: {
    labels: (string | string[])[];
    datasets: any[];
    dimList: any[];
  };
  maxGlobalDomainScore?: number;
  globalNiveles?: any[];
  orientation?: 'horizontal' | 'vertical';
  onOrientationChange?: (orientation: 'horizontal' | 'vertical') => void;
  onOpenFullScreen?: () => void;
  targetNounSingular?: string;
  title?: string;
  subtitle?: string;
  indicatorColor?: string;
  hoveredDomainIndex?: number | null;
  onHoverDomainIndexChange?: (index: number | null) => void;
  className?: string;
}

export const CardPromedioGlobalDominio: React.FC<CardPromedioGlobalDominioProps> = ({
  dimData,
  maxGlobalDomainScore = 20,
  globalNiveles = [],
  orientation,
  onOrientationChange,
  onOpenFullScreen,
  targetNounSingular = 'Docente',
  title = 'Puntaje Promedio Global por Dominio',
  subtitle = 'RENDIMIENTO GLOBAL CONSOLIDADO POR DOMINIO (SUMA DE CRITERIOS)',
  indicatorColor = '#8b5cf6',
  hoveredDomainIndex,
  onHoverDomainIndexChange,
  className,
}) => {
  const [internalOrientation, setInternalOrientation] = useState<'horizontal' | 'vertical'>(
    orientation || 'horizontal'
  );
  const [internalHoveredIndex, setInternalHoveredIndex] = useState<number | null>(null);
  const [showInfo, setShowInfo] = useState(false);
  const infoAnchorRef = useRef<HTMLDivElement>(null);
  const hoverTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const activeOrientation = orientation !== undefined ? orientation : internalOrientation;
  const activeHoveredIndex = hoveredDomainIndex !== undefined ? hoveredDomainIndex : internalHoveredIndex;

  const handleOrientationToggle = (mode: 'horizontal' | 'vertical') => {
    if (onOrientationChange) {
      onOrientationChange(mode);
    } else {
      setInternalOrientation(mode);
    }
  };

  const handleDomainRowMouseEnter = (idx: number) => {
    if (hoverTimeoutRef.current) {
      clearTimeout(hoverTimeoutRef.current);
      hoverTimeoutRef.current = null;
    }
    if (onHoverDomainIndexChange) {
      onHoverDomainIndexChange(idx);
    } else {
      setInternalHoveredIndex(idx);
    }
  };

  const handleDomainRowMouseLeave = () => {
    if (hoverTimeoutRef.current) {
      clearTimeout(hoverTimeoutRef.current);
    }
    hoverTimeoutRef.current = setTimeout(() => {
      if (onHoverDomainIndexChange) {
        onHoverDomainIndexChange(null);
      } else {
        setInternalHoveredIndex(null);
      }
      hoverTimeoutRef.current = null;
    }, 80);
  };

  // Helper para determinar el nivel alcanzado en base a un puntaje y lista de niveles
  const getNivelForScore = (score: number, levelsList: any[]) => {
    if (!levelsList || levelsList.length === 0) return null;
    const sorted = [...levelsList].sort((a, b) => (Number(a.min) || 0) - (Number(b.min) || 0));
    const exact = sorted.find((n) => score >= (Number(n.min) || 0) && score <= (Number(n.max) || 0));
    if (exact) return exact;
    if (score <= (Number(sorted[0]?.max) || 0)) return sorted[0];
    for (let i = 0; i < sorted.length; i++) {
      const cur = sorted[i];
      const next = sorted[i + 1];
      const curMax = Number(cur.max) || 0;
      const nextMin = next ? Number(next.min) || 0 : Infinity;
      if (score > curMax && score < nextMin) return next || cur;
      if (score <= curMax) return cur;
    }
    return sorted[sorted.length - 1];
  };

  // Construir la lista de dominios con sus niveles y puntajes para el footer
  const domainRangesList = useMemo(() => {
    const list = dimData?.dimList || [];
    return list.map((dItem: any, idx: number) => {
      const dim = dItem.dim || {};
      let niveles = dim?.niveles && dim.niveles.length > 0 ? dim.niveles : null;
      const maxScore = dItem.maxScore || maxGlobalDomainScore || 20;

      if (!niveles && globalNiveles.length > 0) {
        const maxGlobalScale = Math.max(
          1,
          ...(globalNiveles.map((n: any) => Number(n.max) || 0) || [maxScore])
        );
        niveles = globalNiveles.map((n: any) => ({
          ...n,
          min: Number(((Number(n.min || 0) / maxGlobalScale) * maxScore).toFixed(0)),
          max: Number(((Number(n.max || 0) / maxGlobalScale) * maxScore).toFixed(0)),
        }));
      }

      const avgScore = dItem.latestDomainScore ?? dItem.avg ?? 0;
      const nivelAlcanzado = getNivelForScore(avgScore, niveles || []);

      return {
        dim,
        dimIndex: idx,
        nombre: dItem.name || dim.nombre || `Dominio ${idx + 1}`,
        maxScore,
        niveles: niveles || [],
        avgScore,
        nivelAlcanzado,
        color: dItem.color || getDomainColor(dim, idx),
      };
    });
  }, [dimData?.dimList, globalNiveles, maxGlobalDomainScore]);

  // Escala de referencia única mostrada en la cabecera del footer
  const referenceNiveles = domainRangesList[0]?.niveles || globalNiveles || [];
  const referenceMax = domainRangesList[0]?.maxScore || maxGlobalDomainScore;

  // Datos del gráfico con efecto hover sincronizado
  const activeChartData = useMemo(() => {
    if (activeHoveredIndex === null || !dimData.datasets) return dimData;
    return {
      ...dimData,
      datasets: dimData.datasets.map((ds: any) => ({
        ...ds,
        backgroundColor: Array.isArray(ds.backgroundColor)
          ? ds.backgroundColor.map((color: string, idx: number) =>
              idx === activeHoveredIndex ? hexToRgba(color, 0.95) : hexToRgba(color, 0.28)
            )
          : ds.backgroundColor,
        borderColor: Array.isArray(ds.borderColor)
          ? ds.borderColor.map((color: string, idx: number) =>
              idx === activeHoveredIndex ? color : hexToRgba(color, 0.45)
            )
          : ds.borderColor,
      })),
    };
  }, [dimData, activeHoveredIndex]);

  const chartHeight = useMemo(() => {
    const count = dimData?.labels?.length || 1;
    return Math.max(260, count * 85);
  }, [dimData?.labels?.length]);

  return (
    <div className={`${styles.cardContainer} ${className || ''}`.trim()}>
      {/* 1. Header con Título, Subtítulo, Popup y Controles */}
      <div className={styles.header}>
        <div className={styles.titleGroup}>
          <h3 className={styles.mainTitle}>
            <span style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span
                className={styles.sectionTitleIndicator}
                style={{ background: indicatorColor }}
              />
              {title}
            </span>
            <div ref={infoAnchorRef} style={{ display: 'inline-flex' }}>
              <GlobalScoreInfoPopup
                type="dominio"
                isOpen={showInfo}
                onToggle={() => setShowInfo((prev) => !prev)}
                onClose={() => setShowInfo(false)}
                anchorRef={infoAnchorRef}
                targetNounSingular={targetNounSingular}
              />
            </div>
          </h3>
          <p className={styles.subtitle}>{subtitle}</p>
        </div>

        <div className={styles.controls}>
          <div className={styles.segmentedControl}>
            <button
              type="button"
              className={`${styles.segmentedBtn} ${activeOrientation === 'horizontal' ? styles.segmentedBtnActive : ''}`}
              onClick={() => handleOrientationToggle('horizontal')}
              title="Vista Horizontal"
              aria-label="Vista Horizontal"
            >
              <RiBarChartHorizontalLine style={{ fontSize: '1.1rem' }} />
            </button>
            <button
              type="button"
              className={`${styles.segmentedBtn} ${activeOrientation === 'vertical' ? styles.segmentedBtnActive : ''}`}
              onClick={() => handleOrientationToggle('vertical')}
              title="Vista Vertical"
              aria-label="Vista Vertical"
            >
              <RiBarChart2Line style={{ fontSize: '1.1rem' }} />
            </button>
          </div>

          {onOpenFullScreen && dimData?.labels && dimData.labels.length > 0 && (
            <button
              type="button"
              onClick={onOpenFullScreen}
              className={styles.btnVistaCompleta}
              title="Abrir vista completa de promedios por dominio"
            >
              <RiFullscreenLine />
              <span>Vista completa ({dimData.labels.length})</span>
            </button>
          )}
        </div>
      </div>

      {/* 2. Área del Gráfico (Horizontal o Vertical) */}
      {activeOrientation === 'horizontal' ? (
        <div
          className={styles.chartWrapper}
          onMouseLeave={handleDomainRowMouseLeave}
          style={{
            minHeight: `${chartHeight}px`,
            width: '100%',
          }}
        >
          <Bar
            key="card-dim-bar-h"
            data={activeChartData}
            options={getDimensionBarOptions(dimData?.dimList, maxGlobalDomainScore) as any}
            plugins={[barDataLabelPlugin]}
          />
        </div>
      ) : (
        <div
          onMouseLeave={handleDomainRowMouseLeave}
          style={{
            minHeight: '360px',
            width: '100%',
            overflowX: dimData?.labels && dimData.labels.length > 6 ? 'auto' : 'visible',
            position: 'relative',
          }}
        >
          <div
            style={{
              minWidth: dimData?.labels && dimData.labels.length > 6 ? `${dimData.labels.length * 90}px` : '100%',
              height: '350px',
            }}
          >
            <Bar
              key="card-dim-bar-v"
              data={activeChartData}
              options={getDimensionVerticalBarOptions(dimData?.dimList, maxGlobalDomainScore) as any}
              plugins={[barDataLabelPlugin]}
            />
          </div>
        </div>
      )}

      {/* 3. Footer Interactivo: Escala de Referencia y Lista Detallada de Dominios */}
      {domainRangesList.length > 0 && (
        <div className={styles.footer} onMouseLeave={handleDomainRowMouseLeave}>
          {/* Cabecera con Leyenda Global de Referencia */}
          {referenceNiveles.length > 0 && (
            <div className={styles.footerHeader}>
              <div className={styles.footerTitle}>
                <RiAwardLine style={{ color: '#2563eb', fontSize: '1.05rem' }} />
                <span>
                  Escala de Referencia {referenceMax ? `(Máx. ${referenceMax} pts)` : ''}:
                </span>
              </div>

              <div className={styles.chipsList}>
                {referenceNiveles.map((n: any, nIdx: number) => (
                  <div key={nIdx} className={styles.levelChip}>
                    <span
                      className={styles.levelDot}
                      style={{ background: n.color || '#3b82f6' }}
                    />
                    <span className={styles.levelChipRange}>
                      {n.min ?? 0} - {n.max ?? 0}
                    </span>
                    <span
                      className={styles.levelChipName}
                      style={{ color: n.color || '#1e293b' }}
                    >
                      {n.nivel}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Filas de Dominios Interactivas */}
          <div className={styles.domainsList}>
            {domainRangesList.map((dItem, dIdx) => {
              const isHovered = activeHoveredIndex === dIdx;
              const currentLevel = dItem.nivelAlcanzado;
              const levelColor = currentLevel?.color || '#3b82f6';
              const formattedScore = Number.isInteger(dItem.avgScore)
                ? dItem.avgScore
                : Number(dItem.avgScore).toFixed(1);

              return (
                <div
                  key={dItem.dim?.id || dIdx}
                  onMouseEnter={() => handleDomainRowMouseEnter(dIdx)}
                  onMouseLeave={handleDomainRowMouseLeave}
                  className={`${styles.domainRow} ${isHovered ? styles.domainRowHovered : ''}`}
                  style={{
                    borderColor: isHovered ? dItem.color : '#e2e8f0',
                  }}
                >
                  {/* Lado izquierdo: Indicador de dominio + Nombre + Máx pts */}
                  <div className={styles.domainLeft}>
                    <span
                      className={styles.domainDot}
                      style={{ background: dItem.color }}
                    />
                    <span
                      className={styles.domainName}
                      style={{ color: isHovered ? dItem.color : '#0f172a' }}
                    >
                      {dItem.nombre}
                    </span>
                    <span className={styles.domainMaxTag}>
                      Máx. {dItem.maxScore} pts
                    </span>
                  </div>

                  {/* Lado derecho: Puntaje Promedio obtenido + Badge del nivel alcanzado */}
                  <div className={styles.domainRight}>
                    <div className={styles.domainAvgLabel}>
                      <span>Promedio:</span>
                      <span
                        className={styles.domainAvgValue}
                        style={{ color: isHovered ? dItem.color : '#0f172a' }}
                      >
                        {formattedScore} pts
                      </span>
                    </div>

                    {currentLevel && (
                      <div
                        className={styles.domainLevelBadge}
                        style={{
                          background: hexToRgba(levelColor, 0.12),
                          border: `1.5px solid ${hexToRgba(levelColor, 0.45)}`,
                          color: levelColor,
                        }}
                      >
                        <span
                          className={styles.domainBadgeDot}
                          style={{ background: levelColor }}
                        />
                        <span>{currentLevel.nivel}</span>
                        {currentLevel.min !== undefined && currentLevel.max !== undefined && (
                          <span className={styles.domainBadgeRange}>
                            ({currentLevel.min} - {currentLevel.max} pts)
                          </span>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};

export default CardPromedioGlobalDominio;
