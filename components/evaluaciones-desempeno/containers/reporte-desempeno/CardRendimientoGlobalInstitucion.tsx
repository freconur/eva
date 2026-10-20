import React, { useState, useRef, useEffect } from 'react';
import { Bar } from 'react-chartjs-2';
import {
  RiBarChartHorizontalLine,
  RiBarChart2Line,
  RiFullscreenLine,
  RiAwardLine,
} from 'react-icons/ri';
import { GlobalScoreInfoPopup } from './GlobalScoreInfoPopup';
import {
  getGlobalUgelChartOptions,
  getGlobalUgelVerticalChartOptions,
} from './chartOptions';
import { barDataLabelPlugin } from './chartPlugins';
import styles from './CardRendimientoGlobalInstitucion.module.css';

export interface CardRendimientoGlobalInstitucionProps {
  globalGroupData: {
    labels: (string | string[])[];
    datasets: any[];
    groupList: any[];
    maxGlobalScore?: number;
    totalQuestions?: number;
  };
  groupLabel?: string;
  groupColor?: string;
  onColorChange?: (color: string) => void;
  orientation?: 'horizontal' | 'vertical';
  onOrientationChange?: (orientation: 'horizontal' | 'vertical') => void;
  onOpenFullScreen?: () => void;
  targetNounSingular?: string;
  globalNiveles?: any[];
  title?: string;
  subtitle?: string;
  className?: string;
  showLevelsFooter?: boolean;
}

export const CardRendimientoGlobalInstitucion: React.FC<CardRendimientoGlobalInstitucionProps> = ({
  globalGroupData,
  groupLabel = 'Institución Educativa',
  groupColor = '#3b82f6',
  onColorChange,
  orientation,
  onOrientationChange,
  onOpenFullScreen,
  targetNounSingular = 'Docente',
  globalNiveles = [],
  title,
  subtitle,
  className,
  showLevelsFooter = true,
}) => {
  const [internalOrientation, setInternalOrientation] = useState<'horizontal' | 'vertical'>(
    orientation || 'horizontal'
  );
  const [showInfo, setShowInfo] = useState(false);
  const infoAnchorRef = useRef<HTMLDivElement>(null);

  const activeOrientation = orientation !== undefined ? orientation : internalOrientation;

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (infoAnchorRef.current && !infoAnchorRef.current.contains(event.target as Node)) {
        setShowInfo(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleOrientationToggle = (mode: 'horizontal' | 'vertical') => {
    if (onOrientationChange) {
      onOrientationChange(mode);
    } else {
      setInternalOrientation(mode);
    }
  };

  const displayTitle = title || `Rendimiento Global por ${groupLabel}`;
  const totalQuestions = globalGroupData?.totalQuestions ?? 0;
  const maxScore = globalGroupData?.maxGlobalScore ?? 20;

  const defaultSubtitle = `EVALUACIÓN INTEGRAL (TODAS LAS DIMENSIONES)${
    totalQuestions > 0 ? ` · ${totalQuestions} criterios evaluados` : ''
  } · Puntaje máx: ${maxScore} pts`;

  const displaySubtitle = subtitle || defaultSubtitle;
  const labelsCount = globalGroupData?.labels?.length || 0;

  return (
    <div
      className={`${styles.cardContainer} ${className || ''}`}
      data-testid="card-rendimiento-global-institucion"
    >
      {/* Cabecera y Controles */}
      <div className={styles.header}>
        <div className={styles.titleGroup}>
          <h3 className={styles.mainTitle}>
            <span
              className={styles.sectionTitleIndicator}
              style={{ background: groupColor }}
              aria-hidden="true"
            />
            <span>{displayTitle}</span>
            <div ref={infoAnchorRef} style={{ display: 'inline-flex', verticalAlign: 'middle' }}>
              <GlobalScoreInfoPopup
                type="ugel"
                isOpen={showInfo}
                onToggle={() => setShowInfo((prev) => !prev)}
                onClose={() => setShowInfo(false)}
                anchorRef={infoAnchorRef}
                targetNounSingular={targetNounSingular}
                groupLabel={groupLabel}
              />
            </div>
          </h3>
          <p className={styles.subtitle}>{displaySubtitle}</p>
        </div>

        {/* Barra de Herramientas */}
        <div className={styles.controls}>
          {/* Selector Horizontal / Vertical */}
          <div className={styles.segmentedControl} role="group" aria-label="Orientación del gráfico">
            <button
              type="button"
              className={`${styles.segmentedBtn} ${
                activeOrientation === 'horizontal' ? styles.segmentedBtnActive : ''
              }`}
              onClick={() => handleOrientationToggle('horizontal')}
              title="Vista Horizontal"
              aria-label="Vista Horizontal"
            >
              <RiBarChartHorizontalLine style={{ fontSize: '1.1rem' }} />
            </button>
            <button
              type="button"
              className={`${styles.segmentedBtn} ${
                activeOrientation === 'vertical' ? styles.segmentedBtnActive : ''
              }`}
              onClick={() => handleOrientationToggle('vertical')}
              title="Vista Vertical"
              aria-label="Vista Vertical"
            >
              <RiBarChart2Line style={{ fontSize: '1.1rem' }} />
            </button>
          </div>

          {/* Color Picker Personalizado */}
          {onColorChange && (
            <div className={styles.colorPickerHeaderWrapper}>
              <label
                className={styles.colorPickerCircle}
                style={{ background: groupColor }}
                title="Personalizar color del gráfico"
                aria-label="Personalizar color del gráfico"
              >
                <input
                  type="color"
                  value={groupColor}
                  onChange={(e) => onColorChange(e.target.value)}
                  className={styles.hiddenColorInput}
                  aria-label="Selector de color"
                />
              </label>
            </div>
          )}

          {/* Botón Pantalla Completa */}
          {onOpenFullScreen && (
            <button
              type="button"
              onClick={onOpenFullScreen}
              className={styles.fullScreenButton}
              title="Ver en pantalla completa"
              aria-label="Ver en pantalla completa"
            >
              <RiFullscreenLine />
            </button>
          )}
        </div>
      </div>

      {/* Gráfico Bar Chart */}
      <div className={styles.chartWrapper}>
        {activeOrientation === 'horizontal' ? (
          <div
            style={{
              height: `${Math.max(220, labelsCount * 48 + 70)}px`,
              width: '100%',
              position: 'relative',
            }}
          >
            <Bar
              key="chart-global-institucion-h"
              data={globalGroupData}
              options={getGlobalUgelChartOptions(maxScore, globalGroupData.groupList, groupLabel) as any}
              plugins={[barDataLabelPlugin]}
            />
          </div>
        ) : (
          <div
            style={{
              minHeight: '380px',
              width: '100%',
              overflowX: labelsCount > 10 ? 'auto' : 'visible',
              position: 'relative',
            }}
          >
            <div
              style={{
                minWidth: labelsCount > 10 ? `${labelsCount * 42}px` : '100%',
                height: '360px',
              }}
            >
              <Bar
                key="chart-global-institucion-v"
                data={globalGroupData}
                options={getGlobalUgelVerticalChartOptions(maxScore, globalGroupData.groupList, groupLabel) as any}
                plugins={[barDataLabelPlugin]}
              />
            </div>
          </div>
        )}
      </div>

      {/* Leyenda de Niveles de Logro (Footer) */}
      {showLevelsFooter && globalNiveles && globalNiveles.length > 0 && (
        <footer className={styles.footer}>
          <div className={styles.levelsFooterHeader}>
            <span className={styles.levelsFooterTitle}>
              <RiAwardLine style={{ color: '#2563eb', fontSize: '0.95rem' }} />
              Puntajes por Nivel de Logro:
            </span>
          </div>
          <div className={styles.levelsList}>
            {globalNiveles.map((n: any, idx: number) => (
              <div key={idx} className={styles.levelChip}>
                <span
                  className={styles.levelChipDot}
                  style={{ background: n.color || '#3b82f6' }}
                />
                <span className={styles.levelChipRange}>
                  {n.min ?? 0} - {n.max ?? 0}
                </span>
                <span className={styles.levelChipName}>{n.nivel}</span>
              </div>
            ))}
          </div>
        </footer>
      )}
    </div>
  );
};

export default CardRendimientoGlobalInstitucion;
