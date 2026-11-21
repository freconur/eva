import React, { useState, useRef, useEffect, useMemo } from 'react';
import { createPortal } from 'react-dom';
import {
  RiMapPin2Fill,
  RiGlobalLine,
  RiCloseLine,
  RiCheckboxCircleLine,
  RiBuilding2Line,
} from 'react-icons/ri';
import { regiones, regionTexto, getUgelsTexto } from '@/fuctions/regiones';
import styles from './EvaluacionScopeBadge.module.css';

export interface EvaluacionScopeBadgeProps {
  ugels?: number[] | null;
  size?: 'xs' | 'sm' | 'md';
  showGlobal?: boolean;
  className?: string;
  interactive?: boolean;
}

export const EvaluacionScopeBadge: React.FC<EvaluacionScopeBadgeProps> = ({
  ugels,
  size = 'sm',
  showGlobal = true,
  className = '',
  interactive = true,
}) => {
  const [isOpen, setIsOpen] = useState<boolean>(false);
  const [mounted, setMounted] = useState<boolean>(false);
  const [popoverCoords, setPopoverCoords] = useState<{ top: number; left: number; placeAbove: boolean }>({
    top: 0,
    left: 0,
    placeAbove: true,
  });

  const triggerRef = useRef<HTMLButtonElement | null>(null);
  const popoverRef = useRef<HTMLDivElement | null>(null);
  const hoverTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    setMounted(true);
    return () => {
      if (hoverTimeoutRef.current) clearTimeout(hoverTimeoutRef.current);
    };
  }, []);

  // Determinar si es exclusiva de UGEL o global
  const isExclusive = useMemo(() => {
    return Boolean(
      ugels &&
      Array.isArray(ugels) &&
      ugels.length > 0 &&
      ugels.length < regiones.length
    );
  }, [ugels]);

  // Nombres de las UGELs asignadas
  const ugelNames = useMemo(() => {
    if (!ugels || !Array.isArray(ugels)) return [];
    return ugels.map((u) => regionTexto(u)).filter(Boolean) as string[];
  }, [ugels]);

  // Texto principal del distintivo en pantalla
  const badgeLabel = useMemo(() => {
    if (isExclusive) {
      if (ugelNames.length === 1) {
        return `UGEL ${ugelNames[0]}`;
      }
      if (ugelNames.length > 1) {
        return `Exclusiva (${ugelNames.length} UGELs)`;
      }
      return 'Exclusiva UGEL';
    }
    return 'Regional';
  }, [isExclusive, ugelNames]);

  // Fallback nativo para el atributo title
  const nativeTitle = useMemo(() => {
    if (isExclusive) {
      return `Evaluación exclusiva para: ${getUgelsTexto(ugels ?? [])}. Clic o pasar cursor para más detalles.`;
    }
    return 'Evaluación Regional: Disponible para todas las 14 UGELs del departamento de Puno.';
  }, [isExclusive, ugels]);

  // Cálculo de coordenadas dinámicas para el portal flotante
  const updatePosition = () => {
    if (!triggerRef.current || typeof window === 'undefined') return;
    const rect = triggerRef.current.getBoundingClientRect();
    const popoverWidth = 320;
    const approxPopoverHeight = 180;
    const margin = 8;

    // Determinar si cabe arriba o abajo
    const spaceAbove = rect.top;
    const placeAbove = spaceAbove >= approxPopoverHeight + margin;

    const top = placeAbove
      ? rect.top - margin
      : rect.bottom + margin;

    // Centrar horizontalmente respecto al badge y recortar a los límites de la ventana
    let left = rect.left + rect.width / 2 - popoverWidth / 2;
    const minLeft = 16;
    const maxLeft = window.innerWidth - popoverWidth - 16;
    if (left < minLeft) left = minLeft;
    if (left > maxLeft) left = maxLeft;

    setPopoverCoords({ top, left, placeAbove });
  };

  const handleOpen = () => {
    if (!interactive) return;
    if (hoverTimeoutRef.current) clearTimeout(hoverTimeoutRef.current);
    updatePosition();
    setIsOpen(true);
  };

  const handleClose = () => {
    if (hoverTimeoutRef.current) clearTimeout(hoverTimeoutRef.current);
    hoverTimeoutRef.current = setTimeout(() => {
      setIsOpen(false);
    }, 120);
  };

  const handleToggle = (e: React.MouseEvent) => {
    if (!interactive) return;
    e.preventDefault();
    e.stopPropagation();
    if (isOpen) {
      setIsOpen(false);
    } else {
      updatePosition();
      setIsOpen(true);
    }
  };

  // Manejo de clic exterior y tecla Escape
  useEffect(() => {
    if (!isOpen) return;

    const handleClickOutside = (e: MouseEvent) => {
      if (
        popoverRef.current &&
        !popoverRef.current.contains(e.target as Node) &&
        triggerRef.current &&
        !triggerRef.current.contains(e.target as Node)
      ) {
        setIsOpen(false);
      }
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setIsOpen(false);
      }
    };

    const handleScrollOrResize = () => {
      updatePosition();
    };

    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleKeyDown);
    window.addEventListener('scroll', handleScrollOrResize, true);
    window.addEventListener('resize', handleScrollOrResize);

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('scroll', handleScrollOrResize, true);
      window.removeEventListener('resize', handleScrollOrResize);
    };
  }, [isOpen]);

  // Si no se debe mostrar el distintivo global y no es exclusiva, no renderizar nada
  if (!isExclusive && !showGlobal) {
    return null;
  }

  const sizeClass =
    size === 'xs' ? styles.sizeXs : size === 'md' ? styles.sizeMd : styles.sizeSm;

  const badgeColorClass = isExclusive ? styles.badgeExclusive : styles.badgeGlobal;

  return (
    <div className={`${styles.badgeWrapper} ${className}`}>
      <button
        ref={triggerRef}
        type="button"
        onClick={handleToggle}
        onMouseEnter={handleOpen}
        onMouseLeave={handleClose}
        onFocus={handleOpen}
        onBlur={handleClose}
        className={`${styles.badgeTrigger} ${sizeClass} ${badgeColorClass}`}
        title={nativeTitle}
        aria-haspopup="dialog"
        aria-expanded={isOpen}
      >
        {isExclusive ? (
          <>
            <span className={styles.exclusivePulseDot} aria-hidden="true" />
            <RiMapPin2Fill className={styles.badgeIconExclusive} aria-hidden="true" />
            <span>{badgeLabel}</span>
          </>
        ) : (
          <>
            <RiGlobalLine className={styles.badgeIconGlobal} aria-hidden="true" />
            <span>{badgeLabel}</span>
          </>
        )}
      </button>

      {/* Popover enriquecido renderizado mediante Portal */}
      {isOpen && mounted && typeof document !== 'undefined' && createPortal(
        <div
          ref={popoverRef}
          role="dialog"
          aria-label={isExclusive ? 'Detalle de Evaluación Exclusiva' : 'Detalle de Evaluación Regional'}
          className={`${styles.popoverCard} ${
            isExclusive ? styles.popoverCardExclusive : styles.popoverCardGlobal
          }`}
          style={{
            top: `${popoverCoords.top}px`,
            left: `${popoverCoords.left}px`,
            transform: popoverCoords.placeAbove ? 'translateY(-100%)' : 'none',
          }}
          onMouseEnter={handleOpen}
          onMouseLeave={handleClose}
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
          }}
        >
          {/* Cabecera del Popover */}
          <div className={styles.popoverHeader}>
            <div className={styles.popoverTitleRow}>
              <div
                className={
                  isExclusive
                    ? styles.popoverIconCircleExclusive
                    : styles.popoverIconCircleGlobal
                }
              >
                {isExclusive ? (
                  <RiMapPin2Fill aria-hidden="true" />
                ) : (
                  <RiGlobalLine aria-hidden="true" />
                )}
              </div>
              <span
                className={`${styles.popoverCategoryText} ${
                  isExclusive
                    ? styles.popoverCategoryTextExclusive
                    : styles.popoverCategoryTextGlobal
                }`}
              >
                {isExclusive ? 'Evaluación Exclusiva' : 'Evaluación General'}
              </span>
            </div>

            <button
              type="button"
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                setIsOpen(false);
              }}
              className={styles.popoverCloseBtn}
              title="Cerrar ventana emergente"
              aria-label="Cerrar"
            >
              <RiCloseLine />
            </button>
          </div>

          {/* Cuerpo del Popover */}
          <div className={styles.popoverBody}>
            {isExclusive ? (
              <>
                <div
                  className={`${styles.highlightPill} ${styles.highlightPillExclusive}`}
                >
                  <RiBuilding2Line className={styles.highlightPillIcon} />
                  <span>
                    {ugelNames.length === 1
                      ? `UGEL ${ugelNames[0]}`
                      : ugelNames.join(', ')}
                  </span>
                </div>
                <p className={styles.popoverDescription}>
                  Esta evaluación fue asignada exclusivamente para las instituciones
                  educativas de la jurisdicción{' '}
                  <strong>
                    {ugelNames.length === 1
                      ? `UGEL ${ugelNames[0]}`
                      : `de las UGELs: ${ugelNames.join(', ')}`}
                  </strong>
                  .
                </p>
                <div className={styles.popoverFooter}>
                  <RiCheckboxCircleLine className={styles.footerCheckIcon} />
                  <span>Acceso habilitado para tu sede institucional</span>
                </div>
              </>
            ) : (
              <>
                <div
                  className={`${styles.highlightPill} ${styles.highlightPillGlobal}`}
                >
                  <RiGlobalLine className={styles.highlightPillIcon} />
                  <span>Todas las UGELs (DRE Puno)</span>
                </div>
                <p className={styles.popoverDescription}>
                  Esta evaluación es de <strong>alcance regional general</strong> y
                  está disponible para docentes de todas las 14 UGELs del
                  departamento.
                </p>
                <div className={`${styles.popoverFooter} ${styles.popoverFooterGlobal}`}>
                  <RiCheckboxCircleLine className={styles.footerCheckIcon} />
                  <span>Ámbito Regional Abierto</span>
                </div>
              </>
            )}
          </div>
        </div>,
        document.body
      )}
    </div>
  );
};

export default EvaluacionScopeBadge;
