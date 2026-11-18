import React, { useState, useMemo, useRef, useCallback, useEffect } from 'react';
import {
  EstudianteEvolutivo,
  ActuacionCatalogoItem,
} from './useDocenteEvolucionEstudiantes';
import {
  MdCheckCircle,
  MdCancel,
  MdTableRows,
  MdExpandMore,
  MdExpandLess,
  MdViewColumn,
  MdRestartAlt,
  MdRotateLeft,
  MdRotateRight,
  MdSplitscreen,
  MdDonutLarge,
  MdPlayArrow,
  MdPause,
  MdSearch,
} from 'react-icons/md';
import { TbChartRadar } from 'react-icons/tb';
import {
  useNivelesActuacionesConfig,
  determinarNivelActuacion,
} from '@/features/hooks/useNivelesActuacionesConfig';

export interface CustomCardAdjustment {
  dx: number;
  dy: number;
  customW?: number;
  customH?: number;
  x?: number; // Coordenada X absoluta en el espacio Web SVG
  y?: number; // Coordenada Y absoluta en el espacio Web SVG
}

// Prefijo de clave en localStorage para almacenar las personalizaciones de diseño del radar
export const RADAR_CARD_ADJUSTMENTS_STORAGE_PREFIX = 'eva_radar_card_adjustments_n_';

/**
 * Obtiene la clave de almacenamiento local segmentada según el número de actuaciones N de la evaluación
 * y opcionalmente diferenciada si corresponde a la vista dividida en 2 paneles (isSplit).
 * Permite que evaluaciones con 7, 25, 28 o cualquier número de actuaciones tengan su propia distribución persistente.
 */
export const getRadarCardAdjustmentsStorageKey = (actuacionesCount: number, isSplit: boolean = false): string => {
  return `${RADAR_CARD_ADJUSTMENTS_STORAGE_PREFIX}${actuacionesCount}${isSplit ? '_split' : ''}`;
};

/**
 * Carga de forma segura los ajustes de tarjetas desde localStorage para la cantidad N dada (y opcionalmente isSplit).
 */
export const loadStoredCardAdjustments = (
  actuacionesCount: number,
  isSplit: boolean = false
): Record<number, CustomCardAdjustment> => {
  if (typeof window === 'undefined' || !actuacionesCount || actuacionesCount <= 0) return {};
  try {
    const key = getRadarCardAdjustmentsStorageKey(actuacionesCount, isSplit);
    const raw = window.localStorage?.getItem(key);
    if (!raw) return {};
    const parsed = JSON.parse(raw);
    if (parsed && typeof parsed === 'object') {
      const clean: Record<number, CustomCardAdjustment> = {};
      Object.entries(parsed).forEach(([orderStr, adj]: [string, any]) => {
        const orderNum = parseInt(orderStr, 10);
        if (!isNaN(orderNum) && adj && typeof adj === 'object') {
          clean[orderNum] = {
            dx: typeof adj.dx === 'number' && !isNaN(adj.dx) ? adj.dx : 0,
            dy: typeof adj.dy === 'number' && !isNaN(adj.dy) ? adj.dy : 0,
            customW: typeof adj.customW === 'number' && !isNaN(adj.customW) ? adj.customW : undefined,
            customH: typeof adj.customH === 'number' && !isNaN(adj.customH) ? adj.customH : undefined,
            x: typeof adj.x === 'number' && !isNaN(adj.x) ? adj.x : undefined,
            y: typeof adj.y === 'number' && !isNaN(adj.y) ? adj.y : undefined,
          };
        }
      });
      return clean;
    }
  } catch (err) {
    console.warn('No se pudieron recuperar los ajustes de tarjetas desde localStorage:', err);
  }
  return {};
};

/**
 * Guarda los ajustes de tarjetas en localStorage para la cantidad N de actuaciones (y opcionalmente isSplit).
 */
export const saveStoredCardAdjustments = (
  actuacionesCount: number,
  adjustments: Record<number, CustomCardAdjustment>,
  sourceId?: string,
  isSplit: boolean = false
): void => {
  if (typeof window === 'undefined' || !actuacionesCount || actuacionesCount <= 0) return;
  try {
    const key = getRadarCardAdjustmentsStorageKey(actuacionesCount, isSplit);
    if (!adjustments || Object.keys(adjustments).length === 0) {
      window.localStorage?.removeItem(key);
    } else {
      window.localStorage?.setItem(key, JSON.stringify(adjustments));
    }
    // Notificar a otras instancias del componente (ej. modal y drawer en pantalla)
    window.dispatchEvent(
      new CustomEvent('eva_radar_adjustments_changed', {
        detail: { n: actuacionesCount, isSplit, sourceId },
      })
    );
  } catch (err) {
    console.warn('No se pudieron guardar los ajustes de tarjetas en localStorage:', err);
  }
};

/**
 * Limpia los ajustes guardados para una cantidad N de actuaciones en localStorage (y opcionalmente isSplit).
 */
export const clearStoredCardAdjustments = (
  actuacionesCount: number,
  sourceId?: string,
  isSplit: boolean = false
): void => {
  if (typeof window === 'undefined' || !actuacionesCount || actuacionesCount <= 0) return;
  try {
    const key = getRadarCardAdjustmentsStorageKey(actuacionesCount, isSplit);
    window.localStorage?.removeItem(key);
    window.dispatchEvent(
      new CustomEvent('eva_radar_adjustments_changed', {
        detail: { n: actuacionesCount, isSplit, sourceId },
      })
    );
  } catch (err) {
    console.warn('No se pudieron eliminar los ajustes de tarjetas de localStorage:', err);
  }
};

// Clave de almacenamiento en localStorage para el sentido de rotación del radar (horario / antihorario)
export const RADAR_DIRECTION_STORAGE_KEY = 'eva_radar_order_direction';

/**
 * Carga de forma segura el sentido de rotación guardado ('horario' o 'antihorario').
 */
export const loadStoredRadarDirection = (): 'horario' | 'antihorario' => {
  if (typeof window === 'undefined') return 'horario';
  try {
    const val = window.localStorage?.getItem(RADAR_DIRECTION_STORAGE_KEY);
    if (val === 'antihorario' || val === 'horario') return val;
  } catch (err) {
    console.warn('No se pudo recuperar la dirección del radar desde localStorage:', err);
  }
  return 'horario';
};

/**
 * Guarda el sentido de rotación del radar en localStorage y notifica a otras instancias.
 */
export const saveStoredRadarDirection = (
  direction: 'horario' | 'antihorario',
  sourceId?: string
): void => {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage?.setItem(RADAR_DIRECTION_STORAGE_KEY, direction);
    window.dispatchEvent(
      new CustomEvent('eva_radar_direction_changed', {
        detail: { direction, sourceId },
      })
    );
  } catch (err) {
    console.warn('No se pudo guardar la dirección del radar en localStorage:', err);
  }
};

// =========================================================================
// ESCALADO DE TAMAÑO DE TEXTO DE LAS ACTUACIONES (FEATURE: AGRANDAR TEXTO)
// =========================================================================
export type RadarTextScaleLevel = 'normal' | 'mediano' | 'grande' | 'extra';

export interface TextScalePreset {
  key: RadarTextScaleLevel;
  factor: number;
  label: string;
  percent: string;
}

export const TEXT_SCALE_PRESETS: TextScalePreset[] = [
  { key: 'normal', factor: 1.0, label: 'Normal', percent: '100%' },
  { key: 'mediano', factor: 1.15, label: 'Mediano', percent: '115%' },
  { key: 'grande', factor: 1.3, label: 'Grande', percent: '130%' },
  { key: 'extra', factor: 1.45, label: 'Extra', percent: '145%' },
];

export const RADAR_TEXT_SCALE_STORAGE_KEY = 'eva_radar_text_scale';

export function parseRadarTextScale(scale?: number | string): number {
  if (typeof scale === 'number' && !isNaN(scale) && scale > 0) return scale;
  if (typeof scale === 'string') {
    const found = TEXT_SCALE_PRESETS.find((p) => p.key === scale);
    if (found) return found.factor;
    const parsedNum = parseFloat(scale);
    if (!isNaN(parsedNum) && parsedNum > 0) return parsedNum;
  }
  return 1.0;
}

export function loadStoredTextScale(): number {
  if (typeof window === 'undefined') return 1.0;
  try {
    const raw = window.localStorage?.getItem(RADAR_TEXT_SCALE_STORAGE_KEY);
    if (raw) {
      return parseRadarTextScale(raw);
    }
  } catch {
    // fallback seguro
  }
  return 1.0;
}

export function saveStoredTextScale(scale: number): void {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage?.setItem(RADAR_TEXT_SCALE_STORAGE_KEY, String(scale));
    window.dispatchEvent(
      new CustomEvent('eva_radar_text_scale_changed', {
        detail: { scale },
      })
    );
  } catch {
    // fallback seguro
  }
}

// Paleta de colores institucional EVA para las etapas evaluativas:
// EDI: Azul (#2563eb) | EP1: Ámbar (#f59e0b) | EP2: Esmeralda (#10b981)
export const ETAPA_COLORS: Record<
  string,
  {
    border: string;
    bg: string;
    dot: string;
    label: string;
    lightBadgeBg: string;
    lightBadgeText: string;
    lightBadgeBorder: string;
    lightCardBg: string;
    lightCardBorder: string;
  }
> = {
  edi: {
    border: '#2563eb', // Azul oficial EVA (EDI - Diagnóstica)
    bg: 'rgba(37, 99, 235, 0.10)',
    dot: '#2563eb',
    label: 'EDI (Diagnóstica)',
    lightBadgeBg: 'bg-blue-50',
    lightBadgeText: 'text-blue-700',
    lightBadgeBorder: 'border-blue-300',
    lightCardBg: 'bg-blue-50/50',
    lightCardBorder: 'border-blue-200/80',
  },
  ep1: {
    border: '#f59e0b', // Ámbar oficial EVA (EP1 - Progresiva 1)
    bg: 'rgba(245, 158, 11, 0.10)',
    dot: '#f59e0b',
    label: 'EP1 (Progresiva 1)',
    lightBadgeBg: 'bg-amber-50',
    lightBadgeText: 'text-amber-800',
    lightBadgeBorder: 'border-amber-300',
    lightCardBg: 'bg-amber-50/50',
    lightCardBorder: 'border-amber-200/80',
  },
  ep2: {
    border: '#10b981', // Verde / Esmeralda oficial EVA (EP2 - Progresiva 2)
    bg: 'rgba(16, 185, 129, 0.12)',
    dot: '#10b981',
    label: 'EP2 (Progresiva 2)',
    lightBadgeBg: 'bg-emerald-50',
    lightBadgeText: 'text-emerald-800',
    lightBadgeBorder: 'border-emerald-300',
    lightCardBg: 'bg-emerald-50/50',
    lightCardBorder: 'border-emerald-200/80',
  },
  ep3: {
    border: '#8b5cf6', // Púrpura / Violeta institucional (EP3 - Progresiva 3)
    bg: 'rgba(139, 92, 246, 0.12)',
    dot: '#8b5cf6',
    label: 'EP3 (Progresiva 3)',
    lightBadgeBg: 'bg-purple-50',
    lightBadgeText: 'text-purple-800',
    lightBadgeBorder: 'border-purple-300',
    lightCardBg: 'bg-purple-50/50',
    lightCardBorder: 'border-purple-200/80',
  },
  es: {
    border: '#6366f1', // Índigo institucional (ES - Evaluación de Salida)
    bg: 'rgba(99, 102, 241, 0.12)',
    dot: '#6366f1',
    label: 'ES (Evaluación de Salida)',
    lightBadgeBg: 'bg-indigo-50',
    lightBadgeText: 'text-indigo-800',
    lightBadgeBorder: 'border-indigo-300',
    lightCardBg: 'bg-indigo-50/50',
    lightCardBorder: 'border-indigo-200/80',
  },
};

/**
 * Obtiene la configuración de color de una etapa evaluativa de manera dinámica y extensible.
 * Soporta EDI, EP1, EP2, EP3, ES y etapas arbitrarias futuras con paleta rotativa institucional.
 */
export const getEtapaColorConfig = (
  stageKey: string,
  idx: number = 0
): {
  border: string;
  bg: string;
  dot: string;
  label: string;
  lightBadgeBg: string;
  lightBadgeText: string;
  lightBadgeBorder: string;
  lightCardBg: string;
  lightCardBorder: string;
} => {
  const normalizedKey = (stageKey || '').toLowerCase();
  if (ETAPA_COLORS[normalizedKey]) {
    return ETAPA_COLORS[normalizedKey];
  }
  const fallbackPalette = [
    {
      border: '#2563eb',
      bg: 'rgba(37, 99, 235, 0.10)',
      dot: '#2563eb',
      label: stageKey.toUpperCase(),
      lightBadgeBg: 'bg-blue-50',
      lightBadgeText: 'text-blue-700',
      lightBadgeBorder: 'border-blue-300',
      lightCardBg: 'bg-blue-50/50',
      lightCardBorder: 'border-blue-200/80',
    },
    {
      border: '#f59e0b',
      bg: 'rgba(245, 158, 11, 0.10)',
      dot: '#f59e0b',
      label: stageKey.toUpperCase(),
      lightBadgeBg: 'bg-amber-50',
      lightBadgeText: 'text-amber-800',
      lightBadgeBorder: 'border-amber-300',
      lightCardBg: 'bg-amber-50/50',
      lightCardBorder: 'border-amber-200/80',
    },
    {
      border: '#10b981',
      bg: 'rgba(16, 185, 129, 0.12)',
      dot: '#10b981',
      label: stageKey.toUpperCase(),
      lightBadgeBg: 'bg-emerald-50',
      lightBadgeText: 'text-emerald-800',
      lightBadgeBorder: 'border-emerald-300',
      lightCardBg: 'bg-emerald-50/50',
      lightCardBorder: 'border-emerald-200/80',
    },
    {
      border: '#8b5cf6',
      bg: 'rgba(139, 92, 246, 0.12)',
      dot: '#8b5cf6',
      label: stageKey.toUpperCase(),
      lightBadgeBg: 'bg-purple-50',
      lightBadgeText: 'text-purple-800',
      lightBadgeBorder: 'border-purple-300',
      lightCardBg: 'bg-purple-50/50',
      lightCardBorder: 'border-purple-200/80',
    },
    {
      border: '#ec4899',
      bg: 'rgba(236, 72, 153, 0.12)',
      dot: '#ec4899',
      label: stageKey.toUpperCase(),
      lightBadgeBg: 'bg-pink-50',
      lightBadgeText: 'text-pink-800',
      lightBadgeBorder: 'border-pink-300',
      lightCardBg: 'bg-pink-50/50',
      lightCardBorder: 'border-pink-200/80',
    },
  ];
  return fallbackPalette[idx % fallbackPalette.length];
};

/**
 * Calcula un micro-desplazamiento radial para etapas que coinciden en el mismo puntaje (1 o 2)
 * en una actuación específica, generando carriles paralelos visibles para evitar que se solapen.
 */
export const getCoincidentRadiusOffset = (
  stageKey: string,
  actOrder: number,
  activeEtapasList: { key: string }[],
  studentEtapas: Record<string, any>
): number => {
  if (!studentEtapas || !activeEtapasList || activeEtapasList.length <= 1) return 0;

  const thisVal = studentEtapas[stageKey]?.actuacionesResultados?.[actOrder] ?? 1;

  // Filtrar las etapas activas que tienen exactamente este mismo valor en esta actuación
  const coincidentKeys = activeEtapasList
    .map((e) => e.key)
    .filter((k) => {
      const v = studentEtapas[k]?.actuacionesResultados?.[actOrder] ?? 1;
      return v === thisVal;
    });

  if (coincidentKeys.length <= 1) return 0;

  const idx = coincidentKeys.indexOf(stageKey);
  if (idx === -1) return 0;

  // Espaciado sutil entre carriles (1.8px) centrado en 0
  const step = 1.8;
  const count = coincidentKeys.length;
  return (idx - (count - 1) / 2) * step;
};

/**
 * Divide el texto completo de cada actuación pedagógica en renglones balanceados.
 * Mantiene compatibilidad con suites de pruebas existentes.
 */
export function formatSmartRadarLabel(
  order: number,
  text: string | undefined,
  totalCount: number
): string[] {
  const rawText = (text || `Actuación ${order}`).trim();
  const fullText = `${order}. ${rawText}`;

  let maxCharsPerLine = 22;
  if (totalCount <= 6) {
    maxCharsPerLine = 24;
  } else if (totalCount <= 12) {
    maxCharsPerLine = 20;
  } else if (totalCount <= 20) {
    maxCharsPerLine = 16;
  } else {
    maxCharsPerLine = 13;
  }

  if (fullText.length <= maxCharsPerLine) {
    return [fullText];
  }

  const words = fullText.split(/\s+/);
  const lines: string[] = [];
  let currentLine = '';

  for (const word of words) {
    if (!currentLine) {
      currentLine = word;
    } else if (currentLine.length + 1 + word.length <= maxCharsPerLine) {
      currentLine += ' ' + word;
    } else {
      lines.push(currentLine);
      currentLine = word;
    }
  }

  if (currentLine) {
    lines.push(currentLine);
  }

  return lines;
}

/**
 * Genera la ruta SVG (path data) para un sector anular (celda de diana polar / radial)
 * delimitado por radio interior, radio exterior, ángulo inicial y ángulo final en grados.
 */
export function describeAnnularSector(
  cx: number,
  cy: number,
  innerR: number,
  outerR: number,
  startDeg: number,
  endDeg: number
): string {
  const rad = Math.PI / 180;
  const actualEndDeg = endDeg - startDeg >= 360 ? startDeg + 359.999 : endDeg;
  const a1 = startDeg * rad;
  const a2 = actualEndDeg * rad;

  const x1 = cx + outerR * Math.cos(a1);
  const y1 = cy + outerR * Math.sin(a1);
  const x2 = cx + outerR * Math.cos(a2);
  const y2 = cy + outerR * Math.sin(a2);

  const x3 = cx + innerR * Math.cos(a2);
  const y3 = cy + innerR * Math.sin(a2);
  const x4 = cx + innerR * Math.cos(a1);
  const y4 = cy + innerR * Math.sin(a1);

  const largeArc = actualEndDeg - startDeg > 180 ? 1 : 0;

  return `M ${x1} ${y1} A ${outerR} ${outerR} 0 ${largeArc} 1 ${x2} ${y2} L ${x3} ${y3} A ${innerR} ${innerR} 0 ${largeArc} 0 ${x4} ${y4} Z`;
}

/**
 * Algoritmo de cálculo dinámico del tamaño de la tarjeta y autoajuste del texto:
 * Si el texto es extenso, agranda automáticamente el ancho y la altura del contenedor
 * para que todo el contenido quepa cómodamente con excelente legibilidad y holgura.
 */
export function calculateDynamicCard(
  order: number,
  text: string | undefined,
  maxAvailableWidth: number = 295,
  textScale: number = 1.0
): {
  boxW: number;
  boxH: number;
  fontSize: number;
  lines: string[];
  lineHeight: number;
} {
  const rawText = (text || `Actuación ${order}`).trim();
  const fullText = `${order}. ${rawText}`;
  const charCount = fullText.length;
  const effectiveScale = typeof textScale === 'number' && !isNaN(textScale) && textScale > 0 ? textScale : 1.0;

  // 1. El ancho del contenedor se ensancha dinámicamente según la extensión del texto y escala
  let targetBoxW = 205;
  if (charCount > 150) {
    targetBoxW = Math.min(295, maxAvailableWidth);
  } else if (charCount > 95) {
    targetBoxW = Math.min(265, maxAvailableWidth);
  } else if (charCount > 55) {
    targetBoxW = Math.min(235, maxAvailableWidth);
  } else {
    targetBoxW = Math.min(205, maxAvailableWidth);
  }

  if (effectiveScale > 1.0) {
    targetBoxW = Math.min(Math.round(targetBoxW * (1 + (effectiveScale - 1) * 0.45)), maxAvailableWidth + 40);
  }

  // 2. Tamaño de fuente óptimo para legibilidad impecable
  let targetFontSize = 10.2;
  if (charCount > 170) {
    targetFontSize = 8.5;
  } else if (charCount > 120) {
    targetFontSize = 9.0;
  } else if (charCount > 65) {
    targetFontSize = 9.5;
  } else {
    targetFontSize = 10.2;
  }

  targetFontSize = Math.round(targetFontSize * effectiveScale * 10) / 10;

  const padX = 14;
  const availW = Math.max(targetBoxW - padX * 2, 80);
  const charWidth = targetFontSize * 0.52;
  const maxCharsPerLine = Math.max(Math.floor(availW / charWidth), 12);

  // 3. Envolver texto respetando palabras completas
  const words = fullText.split(/\s+/);
  const lines: string[] = [];
  let cur = '';

  for (const w of words) {
    if (!cur) {
      cur = w;
    } else if ((cur + ' ' + w).length <= maxCharsPerLine) {
      cur += ' ' + w;
    } else {
      lines.push(cur);
      cur = w;
    }
  }
  if (cur) lines.push(cur);

  const lineHeight = Math.round(targetFontSize * 1.28 * 10) / 10;
  const textHeight = lines.length * lineHeight;
  const padY = 16;
  // 4. La altura del contenedor se agranda dinámicamente para alojar todos los renglones
  const targetBoxH = Math.max(Math.round(textHeight + padY), 42);

  return {
    boxW: targetBoxW,
    boxH: targetBoxH,
    fontSize: targetFontSize,
    lines,
    lineHeight,
  };
}

/**
 * Algoritmo inteligente de autoajuste de texto al contenedor para dimensiones fijas:
 * Evalúa progresivamente tamaños de fuente decrecientes y partición en renglones
 * para garantizar que el texto se adapte perfectamente con margen interno
 * dentro de la tarjeta contenedora sin desbordar ni cortarse.
 */
export function fitTextInBox(
  order: number,
  text: string | undefined,
  boxW: number,
  boxH: number,
  textScale: number = 1.0
): { fontSize: number; lines: string[]; lineHeight: number } {
  const fullText = `${order}. ${(text || `Actuación ${order}`).trim()}`;
  const padX = 10;
  const availW = Math.max(boxW - padX * 2, 60);
  const effectiveScale = typeof textScale === 'number' && !isNaN(textScale) && textScale > 0 ? textScale : 1.0;

  // Intentamos tamaños de fuente decrecientes escalados para que el texto se autoajuste al contenedor
  const candidateFontSizes = [10.5, 9.8, 9.0, 8.2, 7.5, 7.0].map(
    (s) => Math.round(s * effectiveScale * 10) / 10
  );

  for (const fontSize of candidateFontSizes) {
    const charWidth = fontSize * 0.52;
    const maxCharsPerLine = Math.max(Math.floor(availW / charWidth), 12);

    const words = fullText.split(/\s+/);
    const lines: string[] = [];
    let cur = '';

    for (const w of words) {
      if (!cur) {
        cur = w;
      } else if ((cur + ' ' + w).length <= maxCharsPerLine) {
        cur += ' ' + w;
      } else {
        lines.push(cur);
        cur = w;
      }
    }
    if (cur) lines.push(cur);

    const lineHeight = Math.round(fontSize * 1.25 * 10) / 10;
    const totalH = lines.length * lineHeight;

    if (totalH <= boxH - 6 && lines.length <= 4) {
      return { fontSize, lines, lineHeight };
    }
  }

  // Fallback con partición en líneas al tamaño mínimo
  const minFontSize = Math.round(7.0 * effectiveScale * 10) / 10;
  const charWidth = minFontSize * 0.52;
  const maxCharsPerLine = Math.max(Math.floor(availW / charWidth), 12);
  const words = fullText.split(/\s+/);
  const lines: string[] = [];
  let cur = '';
  for (const w of words) {
    if (!cur) cur = w;
    else if ((cur + ' ' + w).length <= maxCharsPerLine) cur += ' ' + w;
    else {
      lines.push(cur);
      cur = w;
    }
  }
  if (cur) lines.push(cur);

  return { fontSize: minFontSize, lines, lineHeight: Math.round(minFontSize * 1.25 * 10) / 10 };
}

export interface DocenteActuacionesRadarChartProps {
  student: EstudianteEvolutivo;
  etapasConfiguradas?: { key: string; id: string; label: string; order: number }[];
  catalogoActuaciones?: ActuacionCatalogoItem[];
  activeStages?: Record<string, boolean>;
  onToggleStage?: (stageKey: string) => void;
  hideStageSelector?: boolean;
  layoutMode?: 'columnas' | 'flotante' | 'diana';
  onLayoutModeChange?: (mode: 'columnas' | 'flotante' | 'diana') => void;
  splitInTwo?: boolean;
  onSplitInTwoChange?: (split: boolean) => void;
  orderDirection?: 'horario' | 'antihorario';
  onOrderDirectionChange?: (direction: 'horario' | 'antihorario') => void;
  onAdjustmentsChange?: (adjustments: Record<number, CustomCardAdjustment>) => void;
  hideHeader?: boolean;
  showTable?: boolean;
  onToggleTable?: () => void;
  textScale?: number | string;
  onTextScaleChange?: (scale: number) => void;
}

export interface DocenteRadarControlsProps {
  chartLayoutMode: 'columnas' | 'flotante' | 'diana';
  onLayoutModeSelect: (mode: 'columnas' | 'flotante' | 'diana') => void;
  orderDirection?: 'horario' | 'antihorario';
  onOrderDirectionChange?: (dir: 'horario' | 'antihorario') => void;
  splitInTwo?: boolean;
  onToggleSplitInTwo?: () => void;
  showTable?: boolean;
  onToggleShowTable?: () => void;
  canResetPositions?: boolean;
  onResetPositions?: () => void;
  textScale?: number | string;
  onTextScaleChange?: (scale: number) => void;
  className?: string;
}

export const DocenteRadarControls: React.FC<DocenteRadarControlsProps> = ({
  chartLayoutMode,
  onLayoutModeSelect,
  orderDirection = 'horario',
  onOrderDirectionChange,
  splitInTwo = false,
  onToggleSplitInTwo,
  showTable = false,
  onToggleShowTable,
  canResetPositions = false,
  onResetPositions,
  textScale = 1.0,
  onTextScaleChange,
  className = '',
}) => {
  const isAntihorario = orderDirection === 'antihorario';
  const effectiveScale = parseRadarTextScale(textScale);
  const currentPresetIndex = Math.max(
    0,
    TEXT_SCALE_PRESETS.findIndex((p) => Math.abs(p.factor - effectiveScale) < 0.05)
  );
  const currentPreset = TEXT_SCALE_PRESETS[currentPresetIndex] || TEXT_SCALE_PRESETS[0];

  const handleDecreaseScale = () => {
    if (currentPresetIndex > 0 && onTextScaleChange) {
      onTextScaleChange(TEXT_SCALE_PRESETS[currentPresetIndex - 1].factor);
    }
  };

  const handleIncreaseScale = () => {
    if (currentPresetIndex < TEXT_SCALE_PRESETS.length - 1 && onTextScaleChange) {
      onTextScaleChange(TEXT_SCALE_PRESETS[currentPresetIndex + 1].factor);
    }
  };

  return (
    <div className={`flex items-center gap-1.5 flex-wrap ${className}`}>
      {/* 1. Botón para restablecer posiciones personalizadas si hay ajustes activos */}
      {chartLayoutMode === 'flotante' && canResetPositions && onResetPositions && (
        <button
          type="button"
          data-testid="reset-card-positions"
          onClick={onResetPositions}
          className="group inline-flex items-center gap-0 hover:gap-1.5 px-2 py-1.5 rounded-xl text-xs font-semibold bg-white border border-slate-200 text-slate-700 hover:text-blue-600 hover:border-blue-300 hover:bg-blue-50/50 transition-all duration-200 shadow-2xs cursor-pointer animate-fadeIn"
          title="Restablecer todas las tarjetas a sus posiciones y tamaños originales"
          aria-label="Restablecer Posiciones"
        >
          <MdRestartAlt className="w-3.5 h-3.5 shrink-0 text-blue-600" />
          <span className="max-w-0 overflow-hidden whitespace-nowrap opacity-0 group-hover:max-w-[140px] group-hover:opacity-100 transition-all duration-200 ease-in-out">
            Restablecer Posiciones
          </span>
        </button>
      )}

      {/* 2. Conmutador de Sentido de Giro del Radar (Horario vs Antihorario) para Diseños con Columnas o Diana */}
      {(chartLayoutMode === 'columnas' || chartLayoutMode === 'diana') && onOrderDirectionChange && (
        <div
          className="inline-flex items-center p-0.5 bg-slate-200/70 rounded-xl border border-slate-200 shadow-2xs"
          role="group"
          aria-label="Sentido de giro del radar"
        >
          <button
            type="button"
            data-testid="toggle-direction-horario"
            onClick={() => onOrderDirectionChange('horario')}
            className={`group inline-flex items-center gap-0 hover:gap-1.5 px-2 py-1.5 rounded-lg text-xs font-bold transition-all duration-200 cursor-pointer ${
              !isAntihorario
                ? 'bg-blue-600 text-white shadow-2xs'
                : 'text-slate-600 hover:text-slate-900 hover:bg-white/60'
            }`}
            title="Sentido Horario: las actuaciones giran hacia la derecha (↻)"
            aria-label="Sentido Horario ↻"
          >
            <MdRotateRight className="w-3.5 h-3.5 shrink-0" />
            <span className="max-w-0 overflow-hidden whitespace-nowrap opacity-0 group-hover:max-w-[80px] group-hover:opacity-100 transition-all duration-200 ease-in-out">
              Horario ↻
            </span>
          </button>
          <button
            type="button"
            data-testid="toggle-direction-antihorario"
            onClick={() => onOrderDirectionChange('antihorario')}
            className={`group inline-flex items-center gap-0 hover:gap-1.5 px-2 py-1.5 rounded-lg text-xs font-bold transition-all duration-200 cursor-pointer ${
              isAntihorario
                ? 'bg-blue-600 text-white shadow-2xs'
                : 'text-slate-600 hover:text-slate-900 hover:bg-white/60'
            }`}
            title="Sentido Antihorario: las actuaciones giran hacia la izquierda (↺)"
            aria-label="Sentido Antihorario ↺"
          >
            <MdRotateLeft className="w-3.5 h-3.5 shrink-0" />
            <span className="max-w-0 overflow-hidden whitespace-nowrap opacity-0 group-hover:max-w-[95px] group-hover:opacity-100 transition-all duration-200 ease-in-out">
              Antihorario ↺
            </span>
          </button>
        </div>
      )}

      {/* 3. Selector de Diseño: Columnas Laterales vs Red Conectada vs Diana Polar */}
      <div
        className="inline-flex items-center p-0.5 bg-slate-200/70 rounded-xl border border-slate-200 shadow-2xs"
        role="group"
        aria-label="Selector de diseño del mapa de actuaciones"
      >
        <button
          type="button"
          data-testid="toggle-mode-columnas"
          onClick={() => onLayoutModeSelect('columnas')}
          className={`group inline-flex items-center gap-0 hover:gap-1.5 px-2 py-1.5 rounded-lg text-xs font-bold transition-all duration-200 cursor-pointer ${
            chartLayoutMode === 'columnas'
              ? 'bg-blue-600 text-white shadow-2xs'
              : 'text-slate-600 hover:text-slate-900 hover:bg-white/60'
          }`}
          title="Diseño 2: Columnas Laterales"
          aria-label="Diseño 2: Columnas Laterales"
        >
          <MdViewColumn className="w-3.5 h-3.5 shrink-0" />
          <span className="max-w-0 overflow-hidden whitespace-nowrap opacity-0 group-hover:max-w-[130px] group-hover:opacity-100 transition-all duration-200 ease-in-out">
            Columnas Laterales
          </span>
        </button>
        <button
          type="button"
          data-testid="toggle-mode-flotante"
          onClick={() => onLayoutModeSelect('flotante')}
          className={`group inline-flex items-center gap-0 hover:gap-1.5 px-2 py-1.5 rounded-lg text-xs font-bold transition-all duration-200 cursor-pointer ${
            chartLayoutMode === 'flotante'
              ? 'bg-blue-600 text-white shadow-2xs'
              : 'text-slate-600 hover:text-slate-900 hover:bg-white/60'
          }`}
          title="Diseño 1: Red Conectada"
          aria-label="Diseño 1: Red Conectada"
        >
          <TbChartRadar className="w-3.5 h-3.5 shrink-0" />
          <span className="max-w-0 overflow-hidden whitespace-nowrap opacity-0 group-hover:max-w-[110px] group-hover:opacity-100 transition-all duration-200 ease-in-out">
            Red Conectada
          </span>
        </button>
        <button
          type="button"
          data-testid="toggle-mode-diana"
          onClick={() => onLayoutModeSelect('diana')}
          className={`group inline-flex items-center gap-0 hover:gap-1.5 px-2 py-1.5 rounded-lg text-xs font-bold transition-all duration-200 cursor-pointer ${
            chartLayoutMode === 'diana'
              ? 'bg-blue-600 text-white shadow-2xs'
              : 'text-slate-600 hover:text-slate-900 hover:bg-white/60'
          }`}
          title="Diseño 3: Diana de Progresión"
          aria-label="Diseño 3: Diana de Progresión"
        >
          <MdDonutLarge className="w-3.5 h-3.5 shrink-0" />
          <span className="max-w-0 overflow-hidden whitespace-nowrap opacity-0 group-hover:max-w-[130px] group-hover:opacity-100 transition-all duration-200 ease-in-out">
            Diana Polar
          </span>
        </button>
      </div>

      {/* 4. Conmutador para dividir en 2 gráficos */}
      {onToggleSplitInTwo && (
        <button
          type="button"
          data-testid="toggle-split-in-two"
          onClick={onToggleSplitInTwo}
          className={`group inline-flex items-center gap-0 hover:gap-1.5 px-2 py-1.5 rounded-xl text-xs font-bold transition-all duration-200 cursor-pointer border ${
            splitInTwo
              ? 'bg-blue-600 text-white border-blue-600 shadow-xs'
              : 'bg-white text-slate-700 border-slate-200/90 hover:bg-slate-100 hover:text-slate-900 shadow-2xs'
          }`}
          title="Dividir en 2 gráficos: reparte las actuaciones en dos partes iguales (mitad y mitad) y genera 2 páginas en PDF"
          aria-label="Dividir en 2"
        >
          <MdSplitscreen className="w-3.5 h-3.5 shrink-0" />
          <span className="max-w-0 overflow-hidden whitespace-nowrap opacity-0 group-hover:max-w-[90px] group-hover:opacity-100 transition-all duration-200 ease-in-out">
            Dividir en 2
          </span>
          {splitInTwo && (
            <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse shrink-0 ml-0.5" />
          )}
        </button>
      )}

      {/* 5. Selector de Tamaño de Texto de las Actuaciones (A- / Preset / A+) */}
      {onTextScaleChange && (
        <div
          className="inline-flex items-center p-0.5 bg-slate-200/70 rounded-xl border border-slate-200 shadow-2xs"
          role="group"
          aria-label="Tamaño del texto de las actuaciones"
        >
          <button
            type="button"
            data-testid="decrease-text-size-control"
            onClick={handleDecreaseScale}
            disabled={currentPresetIndex === 0}
            className={`px-2 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              currentPresetIndex === 0
                ? 'opacity-40 cursor-not-allowed text-slate-400'
                : 'text-slate-700 hover:text-slate-900 hover:bg-white/60'
            }`}
            title="Reducir tamaño de letra de las actuaciones (A-)"
            aria-label="Reducir tamaño de letra (A-)"
          >
            A-
          </button>
          <span
            data-testid="text-size-indicator-control"
            className="px-2 py-1 rounded-md bg-white text-slate-800 text-[11px] font-bold shadow-2xs min-w-[56px] text-center select-none"
            title={`Tamaño actual: ${currentPreset.label} (${currentPreset.percent})`}
          >
            {currentPreset.label}
          </span>
          <button
            type="button"
            data-testid="increase-text-size-control"
            onClick={handleIncreaseScale}
            disabled={currentPresetIndex === TEXT_SCALE_PRESETS.length - 1}
            className={`px-2 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              currentPresetIndex === TEXT_SCALE_PRESETS.length - 1
                ? 'opacity-40 cursor-not-allowed text-slate-400'
                : 'text-slate-700 hover:text-slate-900 hover:bg-white/60'
            }`}
            title="Aumentar tamaño de letra de las actuaciones (A+)"
            aria-label="Aumentar tamaño de letra (A+)"
          >
            A+
          </button>
        </div>
      )}

      {/* 6. Desglose detallado */}
      {onToggleShowTable && (
        <button
          type="button"
          onClick={onToggleShowTable}
          className={`group inline-flex items-center gap-0 hover:gap-1.5 px-2 py-1.5 rounded-xl text-xs font-semibold transition-all duration-200 cursor-pointer border ${
            showTable
              ? 'bg-blue-600 text-white border-blue-500 shadow-xs'
              : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-100 hover:text-slate-900 shadow-2xs'
          }`}
          title={showTable ? 'Ocultar desglose detallado' : 'Ver desglose detallado de actuaciones'}
          aria-label={showTable ? 'Ocultar Desglose' : 'Ver Desglose'}
        >
          <MdTableRows className="w-3.5 h-3.5 shrink-0" />
          <span className="max-w-0 overflow-hidden whitespace-nowrap opacity-0 group-hover:max-w-[110px] group-hover:opacity-100 transition-all duration-200 ease-in-out">
            {showTable ? 'Ocultar Desglose' : 'Ver Desglose'}
          </span>
          <span className="shrink-0 ml-0.5">
            {showTable ? <MdExpandLess className="w-3 h-3" /> : <MdExpandMore className="w-3 h-3" />}
          </span>
        </button>
      )}
    </div>
  );
};

interface HoveredPointInfo {
  act: ActuacionCatalogoItem;
  order: number;
  etapaLabel: string;
  etapaKey: string;
  valor: number;
  x: number;
  y: number;
  allStages?: { key: string; label: string; valor: number; color: string }[];
}

export const DocenteActuacionesRadarChart: React.FC<DocenteActuacionesRadarChartProps> = ({
  student,
  etapasConfiguradas = [],
  catalogoActuaciones = [],
  activeStages: externalActiveStages,
  onToggleStage: _externalOnToggleStage,
  hideStageSelector: _hideStageSelector = true,
  layoutMode: controlledLayoutMode,
  onLayoutModeChange,
  splitInTwo: controlledSplitInTwo,
  onSplitInTwoChange,
  orderDirection: controlledOrderDirection,
  onOrderDirectionChange,
  onAdjustmentsChange,
  hideHeader = false,
  showTable: controlledShowTable,
  onToggleTable: controlledOnToggleTable,
  textScale: controlledTextScale,
  onTextScaleChange,
}) => {
  // Capas de evaluación efectivas (controladas globalmente desde el componente padre)
  const effectiveActiveStages = externalActiveStages ?? {
    edi: true,
    ep1: true,
    ep2: true,
  };

  // Modo de diseño del gráfico: 'columnas' (Diseño 2), 'flotante' (Diseño 1) o 'diana' (Diseño 3: Diana Polar)
  const [internalLayoutMode, setInternalLayoutMode] = useState<'columnas' | 'flotante' | 'diana'>('columnas');
  const chartLayoutMode = (controlledLayoutMode as 'columnas' | 'flotante' | 'diana') ?? internalLayoutMode;

  // Configuración global de niveles por actuación en Firestore
  const { niveles: nivelesActuacionGlobal } = useNivelesActuacionesConfig();

  const handleLayoutModeSelect = (newMode: 'columnas' | 'flotante' | 'diana') => {
    setInternalLayoutMode(newMode);
    onLayoutModeChange?.(newMode);
  };

  // Estados específicos para el Diseño 3: Diana de Progresión
  const [selectedDianaOrder, setSelectedDianaOrder] = useState<number | null>(null);
  const [hoveredDianaOrder, setHoveredDianaOrder] = useState<number | null>(null);
  const [dianaSearchQuery, setDianaSearchQuery] = useState<string>('');
  const [isEvolutionPlaying, setIsEvolutionPlaying] = useState<boolean>(false);
  const [evolutionStep, setEvolutionStep] = useState<number>(1);

  // Feature: Dividir en 2 gráficos (mitad y mitad, aplicable tanto a diseño columnas como flotante)
  const [internalSplitInTwo, setInternalSplitInTwo] = useState<boolean>(false);
  const effectiveSplitInTwo = controlledSplitInTwo ?? internalSplitInTwo;

  const handleToggleSplitInTwo = () => {
    const nextVal = !effectiveSplitInTwo;
    setInternalSplitInTwo(nextVal);
    onSplitInTwoChange?.(nextVal);
  };

  // Feature: Escalado del tamaño del texto de las actuaciones (Normal, Mediano, Grande, Extra)
  const [internalTextScale, setInternalTextScale] = useState<number>(() => loadStoredTextScale());
  const effectiveTextScale = parseRadarTextScale(
    controlledTextScale !== undefined ? controlledTextScale : internalTextScale
  );

  const currentScalePresetIndex = Math.max(
    0,
    TEXT_SCALE_PRESETS.findIndex((p) => Math.abs(p.factor - effectiveTextScale) < 0.05)
  );
  const currentScalePreset = TEXT_SCALE_PRESETS[currentScalePresetIndex] || TEXT_SCALE_PRESETS[0];

  const handleTextScaleSelect = (newScale: number) => {
    setInternalTextScale(newScale);
    saveStoredTextScale(newScale);
    onTextScaleChange?.(newScale);
  };

  const handleIncreaseTextScale = () => {
    if (currentScalePresetIndex < TEXT_SCALE_PRESETS.length - 1) {
      handleTextScaleSelect(TEXT_SCALE_PRESETS[currentScalePresetIndex + 1].factor);
    }
  };

  const handleDecreaseTextScale = () => {
    if (currentScalePresetIndex > 0) {
      handleTextScaleSelect(TEXT_SCALE_PRESETS[currentScalePresetIndex - 1].factor);
    }
  };

  // Sincronización multi-instancia de cambios en tamaño de letra
  useEffect(() => {
    const handleScaleSync = (e: any) => {
      const scale = e?.detail?.scale;
      if (typeof scale === 'number' && scale > 0) {
        setInternalTextScale(scale);
      }
    };
    if (typeof window !== 'undefined') {
      window.addEventListener('eva_radar_text_scale_changed', handleScaleSync);
      return () => {
        window.removeEventListener('eva_radar_text_scale_changed', handleScaleSync);
      };
    }
  }, []);

  // Sentido de rotación de actuaciones en el radar para modo columnas: 'horario' (defecto) o 'antihorario' (invertido)
  const [internalOrderDirection, setInternalOrderDirection] = useState<'horario' | 'antihorario'>(() => {
    return loadStoredRadarDirection();
  });
  const effectiveOrderDirection = controlledOrderDirection ?? internalOrderDirection;
  const isAntihorario = effectiveOrderDirection === 'antihorario';

  const handleOrderDirectionChange = (newDir: 'horario' | 'antihorario') => {
    setInternalOrderDirection(newDir);
    saveStoredRadarDirection(newDir, componentIdRef.current);
    onOrderDirectionChange?.(newDir);
  };

  // Despliegue de la tabla detallada de actuaciones
  const [internalShowTable, setInternalShowTable] = useState<boolean>(false);
  const showTable = controlledShowTable ?? internalShowTable;
  const handleToggleTable = controlledOnToggleTable ?? (() => setInternalShowTable((prev) => !prev));

  // Estado del tooltip interactivo flotante en pantalla
  const [activeTooltip, setActiveTooltip] = useState<HoveredPointInfo | null>(null);

  // Estado de etapa resaltada al hacer hover
  const [hoveredStageKey, setHoveredStageKey] = useState<string | null>(null);

  // Estado de tarjeta de actuación resaltada al hacer hover
  const [hoveredCardOrder, setHoveredCardOrder] = useState<number | null>(null);

  // 1. Catálogo ordenado de actuaciones (Ejes radiales 1..N)
  const orderedActuaciones = useMemo(() => {
    return [...(catalogoActuaciones || [])].sort((a, b) => a.order - b.order);
  }, [catalogoActuaciones]);

  const N = orderedActuaciones.length;

  // División equilibrada para Diseño 2:
  // En sentido horario: Hemisferio Derecho (1..mid) y Hemisferio Izquierdo (mid+1..N)
  // En sentido antihorario: Hemisferio Izquierdo (1..mid) y Hemisferio Derecho (mid+1..N)
  const midPoint = Math.ceil(N / 2);
  const rightColumnActuaciones = useMemo(() => {
    if (isAntihorario) {
      return orderedActuaciones.slice(midPoint);
    }
    return orderedActuaciones.slice(0, midPoint);
  }, [orderedActuaciones, midPoint, isAntihorario]);

  const leftColumnActuaciones = useMemo(() => {
    if (isAntihorario) {
      return orderedActuaciones.slice(0, midPoint);
    }
    return orderedActuaciones.slice(midPoint);
  }, [orderedActuaciones, midPoint, isAntihorario]);

  // Geometría del Radar Central para Diseño 2 (Perímetro exterior con números)
  const cxCol = 360;
  const cyCol = 360;
  const RCol = 240;
  const r1Col = RCol / 2; // Anillo 1 (NO) = 120
  const r2Col = RCol; // Anillo 2 (SÍ) = 240
  const RBadge = RCol + 36; // Radio exterior para los badges circulares numéricos = 276

  const columnasSpokes = useMemo(() => {
    if (N === 0) return [];
    return orderedActuaciones.map((act, i) => {
      const angle = isAntihorario
        ? -Math.PI / 2 - (2 * Math.PI * i) / N
        : -Math.PI / 2 + (2 * Math.PI * i) / N;
      const cos = Math.cos(angle);
      const sin = Math.sin(angle);
      const vx = cxCol + RCol * cos;
      const vy = cyCol + RCol * sin;
      const nx = cxCol + RBadge * cos;
      const ny = cyCol + RBadge * sin;

      return {
        act,
        index: i,
        angle,
        cos,
        sin,
        vx,
        vy,
        nx,
        ny,
      };
    });
  }, [orderedActuaciones, N, cxCol, cyCol, RCol, RBadge, isAntihorario]);

  // Orden cronológico de las etapas configuradas: del más antiguo (menor order) al más actual (mayor order)
  const sortedEtapas = useMemo(() => {
    return [...etapasConfiguradas].sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
  }, [etapasConfiguradas]);

  // Labels para test runners y compatibilidad
  const radarLabels = useMemo(() => {
    return orderedActuaciones.map((act) => {
      const formatted = formatSmartRadarLabel(
        act.order,
        act.actuacion,
        orderedActuaciones.length
      );
      return formatted.length === 1 ? formatted[0] : formatted;
    });
  }, [orderedActuaciones]);

  // 2. Filtrado de etapas activas respetando el orden cronológico
  const activeEtapasList = useMemo(() => {
    const list = sortedEtapas.filter(
      (etapa) =>
        (effectiveActiveStages[etapa.key] ?? true) &&
        !!student.etapas[etapa.key] &&
        (typeof student.etapas[etapa.key]?.puntaje === 'number' ||
          !!student.etapas[etapa.key]?.actuacionesResultados)
    );
    // Si el estudiante no registra evaluaciones en ninguna etapa, mantener el listado base para evitar errores
    if (list.length === 0) {
      return sortedEtapas.filter(
        (etapa) => effectiveActiveStages[etapa.key] ?? true
      );
    }
    return list;
  }, [sortedEtapas, effectiveActiveStages, student.etapas]);

  const totalActive = activeEtapasList.length;

  // Manejo de la reproducción animada paso a paso para el diseño Diana Polar
  useEffect(() => {
    if (!isEvolutionPlaying) return;
    const interval = setInterval(() => {
      setEvolutionStep((prev) => {
        if (prev >= activeEtapasList.length) {
          setIsEvolutionPlaying(false);
          return activeEtapasList.length;
        }
        return prev + 1;
      });
    }, 1100);
    return () => clearInterval(interval);
  }, [isEvolutionPlaying, activeEtapasList.length]);

  const handleToggleEvolutionPlay = () => {
    if (isEvolutionPlaying) {
      setIsEvolutionPlaying(false);
    } else {
      setEvolutionStep(1);
      setIsEvolutionPlaying(true);
    }
  };

  const datasetsColumnas = useMemo(() => {
    return activeEtapasList.map((etapa, idx) => {
      const etapaData = student.etapas[etapa.key];
      const colorConfig =
        ETAPA_COLORS[etapa.key] ||
        (idx === 0
          ? ETAPA_COLORS.edi
          : idx === 1
          ? ETAPA_COLORS.ep1
          : ETAPA_COLORS.ep2);

      const values = orderedActuaciones.map((act) => {
        if (!etapaData) return 1;
        return etapaData.actuacionesResultados?.[act.order] ?? 1;
      });

      const points = orderedActuaciones.map((act, i) => {
        const angle = isAntihorario
          ? -Math.PI / 2 - (2 * Math.PI * i) / N
          : -Math.PI / 2 + (2 * Math.PI * i) / N;
        const val = values[i];
        const offset = getCoincidentRadiusOffset(etapa.key, act.order, activeEtapasList, student.etapas);
        const baseR = val === 2 ? r2Col : r1Col;
        const r = baseR + offset;
        const x = cxCol + r * Math.cos(angle);
        const y = cyCol + r * Math.sin(angle);
        return { x, y, val, act, order: act.order };
      });

      const pointsString = points.map((p) => `${p.x},${p.y}`).join(' ');

      return {
        key: etapa.key,
        label: etapa.label,
        colorConfig,
        points,
        pointsString,
        isMostRecent: idx === activeEtapasList.length - 1,
      };
    });
  }, [activeEtapasList, orderedActuaciones, student, N, cxCol, cyCol, r1Col, r2Col, isAntihorario]);

  // 3. Geometría polar del Radar SVG Vectorial a Todo el Ancho y Autoajuste
  // ViewBox dinámico: ancho 1680px y altura escalable según N para desplegarse holgadamente ocupando todo el ancho
  const svgWidth = 1680;
  const svgHeight = Math.max(800, 540 + N * 18);
  const cx = svgWidth / 2;
  const cy = svgHeight / 2;
  const R = 240; // Radio exterior del radar web (mismo tamaño que en diseño de columnas: RCol = 240)
  const r1 = R / 2; // Radio intermedio (Anillo 1: NO acertó) = 120
  const r2 = R; // Radio exterior (Anillo 2: SÍ acertó) = 240

  // Referencia al callback onAdjustmentsChange para evitar dependencias inestables en efectos
  const onAdjustmentsChangeRef = useRef(onAdjustmentsChange);
  useEffect(() => {
    onAdjustmentsChangeRef.current = onAdjustmentsChange;
  }, [onAdjustmentsChange]);

  // Referencia al elemento SVG para conversión precisa de coordenadas
  const svgRef = useRef<SVGSVGElement | null>(null);

  // Identificador de instancia único para evitar bucles de eventos entre el mismo componente
  const componentIdRef = useRef<string>(`radar-${Math.random().toString(36).slice(2)}`);

  // Estado de personalizaciones manuales por tarjeta para la vista completa unificada (isSplit = false)
  const [cardAdjustments, setCardAdjustments] = useState<Record<number, CustomCardAdjustment>>(() => {
    return loadStoredCardAdjustments(N, false);
  });
  const cardAdjustmentsRef = useRef<Record<number, CustomCardAdjustment>>(cardAdjustments);
  useEffect(() => {
    cardAdjustmentsRef.current = cardAdjustments;
  }, [cardAdjustments]);

  // Estado de personalizaciones manuales por tarjeta para la vista dividida en 2 paneles (isSplit = true)
  const [splitCardAdjustments, setSplitCardAdjustments] = useState<Record<number, CustomCardAdjustment>>(() => {
    return loadStoredCardAdjustments(N, true);
  });
  const splitCardAdjustmentsRef = useRef<Record<number, CustomCardAdjustment>>(splitCardAdjustments);
  useEffect(() => {
    splitCardAdjustmentsRef.current = splitCardAdjustments;
  }, [splitCardAdjustments]);

  const effectiveSplitInTwoRef = useRef(effectiveSplitInTwo);
  useEffect(() => {
    effectiveSplitInTwoRef.current = effectiveSplitInTwo;
  }, [effectiveSplitInTwo]);

  // Al cambiar la cantidad de actuaciones N, se cargan los ajustes correspondientes guardados localmente
  useEffect(() => {
    if (N > 0) {
      const stored = loadStoredCardAdjustments(N, false);
      cardAdjustmentsRef.current = stored;
      setCardAdjustments(stored);

      const splitStored = loadStoredCardAdjustments(N, true);
      splitCardAdjustmentsRef.current = splitStored;
      setSplitCardAdjustments(splitStored);

      onAdjustmentsChangeRef.current?.(effectiveSplitInTwo ? splitStored : stored);
    } else {
      cardAdjustmentsRef.current = {};
      setCardAdjustments({});
      splitCardAdjustmentsRef.current = {};
      setSplitCardAdjustments({});
      onAdjustmentsChangeRef.current?.({});
    }
  }, [N]);

  // Escuchar eventos de sincronización entre componentes montados (ej. modal y drawer en pantalla)
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const handleSync = (e: any) => {
      // Ignorar eventos originados por esta misma instancia
      if (e.detail?.sourceId === componentIdRef.current) return;
      if (e.detail?.n === N && N > 0 && !activeInteractionRef.current) {
        if (e.detail?.isSplit) {
          const stored = loadStoredCardAdjustments(N, true);
          splitCardAdjustmentsRef.current = stored;
          setSplitCardAdjustments(stored);
          if (effectiveSplitInTwoRef.current) {
            onAdjustmentsChangeRef.current?.(stored);
          }
        } else {
          const stored = loadStoredCardAdjustments(N, false);
          cardAdjustmentsRef.current = stored;
          setCardAdjustments(stored);
          if (!effectiveSplitInTwoRef.current) {
            onAdjustmentsChangeRef.current?.(stored);
          }
        }
      }
    };
    window.addEventListener('eva_radar_adjustments_changed', handleSync);
    return () => {
      window.removeEventListener('eva_radar_adjustments_changed', handleSync);
    };
  }, [N]);

  // Escuchar sincronización de cambio de sentido del radar entre instancias montadas
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const handleSyncDir = (e: any) => {
      if (e.detail?.sourceId === componentIdRef.current) return;
      const dir = e.detail?.direction;
      if (dir === 'horario' || dir === 'antihorario') {
        setInternalOrderDirection(dir);
      }
    };
    window.addEventListener('eva_radar_direction_changed', handleSyncDir);
    return () => {
      window.removeEventListener('eva_radar_direction_changed', handleSyncDir);
    };
  }, []);

  // Estado de interacción activa (arrastrar posición o cambiar tamaño)
  const [activeInteraction, setActiveInteraction] = useState<{
    type: 'move' | 'resize';
    order: number;
    baseBoxX: number;
    baseBoxY: number;
    startSvgX: number;
    startSvgY: number;
    initialDx: number;
    initialDy: number;
    initialW: number;
    initialH: number;
    targetSvg?: SVGSVGElement | null;
    isSplit?: boolean;
  } | null>(null);

  const activeInteractionRef = useRef(activeInteraction);
  useEffect(() => {
    activeInteractionRef.current = activeInteraction;
  }, [activeInteraction]);

  // Manejar el restablecimiento completo de las posiciones originales para esta configuración N
  const handleResetPositions = useCallback(() => {
    if (effectiveSplitInTwo) {
      splitCardAdjustmentsRef.current = {};
      setSplitCardAdjustments({});
      clearStoredCardAdjustments(N, componentIdRef.current, true);
      onAdjustmentsChangeRef.current?.({});
    } else {
      cardAdjustmentsRef.current = {};
      setCardAdjustments({});
      clearStoredCardAdjustments(N, componentIdRef.current, false);
      onAdjustmentsChangeRef.current?.({});
    }
  }, [N, effectiveSplitInTwo]);

  // Convierte coordenadas de puntero del navegador (clientX, clientY) al espacio de coordenadas SVG nativo
  const getSvgCoordinates = useCallback(
    (clientX: number, clientY: number, targetSvg?: SVGSVGElement | null): { x: number; y: number } | null => {
      const svg = targetSvg || svgRef.current;
      if (!svg) return null;
      try {
        if (typeof (svg as any).createSVGPoint === 'function') {
          const pt = svg.createSVGPoint();
          pt.x = clientX;
          pt.y = clientY;
          const ctm = svg.getScreenCTM();
          if (ctm && (ctm.a !== 0 || ctm.d !== 0)) {
            const inv = ctm.inverse();
            if (inv && !isNaN(inv.a) && !isNaN(inv.d)) {
              const transformed = pt.matrixTransform(inv);
              if (!isNaN(transformed.x) && !isNaN(transformed.y)) {
                return { x: transformed.x, y: transformed.y };
              }
            }
          }
        }
      } catch {
        // Fallback en entornos donde getScreenCTM no esté disponible o no sea invertible (ej. testing)
      }
      const rect = svg.getBoundingClientRect();
      const vb = (svg as any).viewBox?.baseVal;
      const targetW = vb && vb.width > 0 ? vb.width : svgWidth;
      const targetH = vb && vb.height > 0 ? vb.height : svgHeight;
      const w = rect.width > 0 ? rect.width : targetW;
      const h = rect.height > 0 ? rect.height : targetH;
      const scaleX = targetW / w;
      const scaleY = targetH / h;
      const safeClientX = typeof clientX === 'number' && !isNaN(clientX) ? clientX : 0;
      const safeClientY = typeof clientY === 'number' && !isNaN(clientY) ? clientY : 0;
      const left = rect.left || 0;
      const top = rect.top || 0;
      return {
        x: (safeClientX - left) * scaleX,
        y: (safeClientY - top) * scaleY,
      };
    },
    [svgWidth, svgHeight]
  );

  // Escuchadores globales de puntero para arrastre y redimensionamiento continuo sin pérdida de foco
  useEffect(() => {
    if (!activeInteraction) return;

    const onPointerMove = (e: any) => {
      const cur = activeInteractionRef.current;
      if (!cur) return;
      const coords = getSvgCoordinates(e.clientX, e.clientY, cur.targetSvg);
      if (!coords) return;

      const deltaX = coords.x - cur.startSvgX;
      const deltaY = coords.y - cur.startSvgY;

      if (cur.type === 'move') {
        const nextDx = Math.round(cur.initialDx + deltaX);
        const nextDy = Math.round(cur.initialDy + deltaY);
        const nextX = Math.round(cur.baseBoxX + nextDx);
        const nextY = Math.round(cur.baseBoxY + nextDy);

        if (cur.isSplit) {
          const next = {
            ...splitCardAdjustmentsRef.current,
            [cur.order]: {
              ...splitCardAdjustmentsRef.current[cur.order],
              dx: nextDx,
              dy: nextDy,
              x: nextX,
              y: nextY,
            },
          };
          splitCardAdjustmentsRef.current = next;
          setSplitCardAdjustments(next);
          onAdjustmentsChangeRef.current?.(next);
        } else {
          const next = {
            ...cardAdjustmentsRef.current,
            [cur.order]: {
              ...cardAdjustmentsRef.current[cur.order],
              dx: nextDx,
              dy: nextDy,
              x: nextX,
              y: nextY,
            },
          };
          cardAdjustmentsRef.current = next;
          setCardAdjustments(next);
          onAdjustmentsChangeRef.current?.(next);
        }
      } else if (cur.type === 'resize') {
        const newW = Math.min(Math.max(Math.round(cur.initialW + deltaX), 130), 500);
        const newH = Math.min(Math.max(Math.round(cur.initialH + deltaY), 38), 360);
        const nextX = Math.round(cur.baseBoxX + cur.initialDx);
        const nextY = Math.round(cur.baseBoxY + cur.initialDy);

        if (cur.isSplit) {
          const next = {
            ...splitCardAdjustmentsRef.current,
            [cur.order]: {
              ...splitCardAdjustmentsRef.current[cur.order],
              dx: cur.initialDx,
              dy: cur.initialDy,
              customW: newW,
              customH: newH,
              x: nextX,
              y: nextY,
            },
          };
          splitCardAdjustmentsRef.current = next;
          setSplitCardAdjustments(next);
          onAdjustmentsChangeRef.current?.(next);
        } else {
          const next = {
            ...cardAdjustmentsRef.current,
            [cur.order]: {
              ...cardAdjustmentsRef.current[cur.order],
              dx: cur.initialDx,
              dy: cur.initialDy,
              customW: newW,
              customH: newH,
              x: nextX,
              y: nextY,
            },
          };
          cardAdjustmentsRef.current = next;
          setCardAdjustments(next);
          onAdjustmentsChangeRef.current?.(next);
        }
      }
    };

    const onPointerUp = () => {
      const cur = activeInteractionRef.current;
      if (cur && N > 0) {
        if (cur.isSplit) {
          saveStoredCardAdjustments(N, splitCardAdjustmentsRef.current, componentIdRef.current, true);
          onAdjustmentsChangeRef.current?.(splitCardAdjustmentsRef.current);
        } else {
          saveStoredCardAdjustments(N, cardAdjustmentsRef.current, componentIdRef.current, false);
          onAdjustmentsChangeRef.current?.(cardAdjustmentsRef.current);
        }
      }
      setActiveInteraction(null);
    };

    window.addEventListener('pointermove', onPointerMove);
    window.addEventListener('mousemove', onPointerMove);
    window.addEventListener('pointerup', onPointerUp);
    window.addEventListener('mouseup', onPointerUp);
    return () => {
      window.removeEventListener('pointermove', onPointerMove);
      window.removeEventListener('mousemove', onPointerMove);
      window.removeEventListener('pointerup', onPointerUp);
      window.removeEventListener('mouseup', onPointerUp);
    };
  }, [activeInteraction, getSvgCoordinates, N]);

  // Iniciar arrastre de tarjeta
  const handleStartMove = (
    e: React.PointerEvent,
    order: number,
    baseBoxX: number,
    baseBoxY: number,
    currentW: number,
    currentH: number
  ) => {
    if (e.button !== undefined && e.button !== 0) return;
    e.preventDefault();
    e.stopPropagation();
    const targetSvg = ((e.currentTarget as any)?.ownerSVGElement as SVGSVGElement | null) || svgRef.current;
    const coords = getSvgCoordinates(e.clientX, e.clientY, targetSvg);
    if (!coords) return;

    const isSplit = Boolean(effectiveSplitInTwo);
    const activeMap = isSplit ? splitCardAdjustmentsRef.current : cardAdjustmentsRef.current;
    const currentAdj = activeMap[order] || { dx: 0, dy: 0 };
    setActiveInteraction({
      type: 'move',
      order,
      baseBoxX,
      baseBoxY,
      startSvgX: coords.x,
      startSvgY: coords.y,
      initialDx: currentAdj.dx || 0,
      initialDy: currentAdj.dy || 0,
      initialW: currentW,
      initialH: currentH,
      targetSvg,
      isSplit,
    });
  };

  // Iniciar redimensionamiento desde la esquina
  const handleStartResize = (
    e: React.PointerEvent,
    order: number,
    baseBoxX: number,
    baseBoxY: number,
    currentW: number,
    currentH: number
  ) => {
    if (e.button !== undefined && e.button !== 0) return;
    e.preventDefault();
    e.stopPropagation();
    const targetSvg = ((e.currentTarget as any)?.ownerSVGElement as SVGSVGElement | null) || svgRef.current;
    const coords = getSvgCoordinates(e.clientX, e.clientY, targetSvg);
    if (!coords) return;

    const isSplit = Boolean(effectiveSplitInTwo);
    const activeMap = isSplit ? splitCardAdjustmentsRef.current : cardAdjustmentsRef.current;
    const currentAdj = activeMap[order] || { dx: 0, dy: 0 };
    setActiveInteraction({
      type: 'resize',
      order,
      baseBoxX,
      baseBoxY,
      startSvgX: coords.x,
      startSvgY: coords.y,
      initialDx: currentAdj.dx || 0,
      initialDy: currentAdj.dy || 0,
      initialW: currentW,
      initialH: currentH,
      targetSvg,
      isSplit,
    });
  };

  // Algoritmo de Dispersión Periférica Inteligente y Autoajuste al Contenedor:
  // Separa las tarjetas en zonas perimetrales (Top, Bottom, Right, Left),
  // agranda los contenedores según la extensión de texto y distribuye en hasta 3 columnas laterales
  // ocupando el 100% del ancho disponible sin colisiones.
  const spokeGeometry = useMemo(() => {
    if (N === 0) return [];

    const rawSpokes = orderedActuaciones.map((act, i) => {
      const angle = -Math.PI / 2 + (2 * Math.PI * i) / N;
      const cos = Math.cos(angle);
      const sin = Math.sin(angle);
      const sx = cx + R * cos;
      const sy = cy + R * sin;

      // Clasificación direccional de zona
      let side: 'top' | 'bottom' | 'right' | 'left' = 'right';
      if (Math.abs(cos) <= 0.16 && sin < 0) side = 'top';
      else if (Math.abs(cos) <= 0.16 && sin > 0) side = 'bottom';
      else if (cos > 0) side = 'right';
      else side = 'left';

      // Dimensiones dinámicas del contenedor: se agranda si el texto es extenso y respeta textScale
      const card = calculateDynamicCard(act.order, act.actuacion, 295, effectiveTextScale);

      return {
        act,
        index: i,
        angle,
        cos,
        sin,
        sx,
        sy,
        side,
        boxW: card.boxW,
        boxH: card.boxH,
        textFit: card,
        boxX: 0,
        boxY: 0,
        anchorX: 0,
        anchorY: 0,
      };
    });

    // Agrupación por zonas perimetrales
    const rightGroup = rawSpokes
      .filter((s) => s.side === 'right')
      .sort((a, b) => a.sy - b.sy);
    const leftGroup = rawSpokes
      .filter((s) => s.side === 'left')
      .sort((a, b) => a.sy - b.sy);
    const topGroup = rawSpokes
      .filter((s) => s.side === 'top')
      .sort((a, b) => a.sx - b.sx);
    const bottomGroup = rawSpokes
      .filter((s) => s.side === 'bottom')
      .sort((a, b) => a.sx - b.sx);

    // Rango vertical disponible para tarjetas en laterales
    const yStart = 60;
    const yEnd = svgHeight - 60;
    const totalSpanY = yEnd - yStart;

    // Distribución espaciada y escalonada en columnas para el lateral DERECHO
    rightGroup.forEach((spoke, idx) => {
      const stepY = totalSpanY / Math.max(rightGroup.length, 1);
      const targetY = yStart + (idx + 0.5) * stepY;

      // Asignación de columnas: 3 columnas si hay 8+ tarjetas, 2 columnas si 4+, 1 si menos
      let boxX = cx + R + 45;
      if (rightGroup.length >= 8) {
        const colPattern = [1, 2, 0]; // 1 = media, 2 = exterior (borde derecho), 0 = interior
        const col = colPattern[idx % 3];
        if (col === 2) {
          boxX = svgWidth - spoke.boxW - 15; // Ocupa todo el ancho hasta el extremo derecho
        } else if (col === 1) {
          boxX = 1380 - spoke.boxW / 2;
        } else {
          boxX = cx + R + 40;
        }
      } else if (rightGroup.length >= 4) {
        const isOuterCol = idx % 2 === 1;
        boxX = isOuterCol ? svgWidth - spoke.boxW - 20 : cx + R + 50;
      } else {
        boxX = cx + R + 80;
      }

      const boxY = targetY - spoke.boxH / 2;
      const anchorX = boxX;
      const anchorY = targetY;

      Object.assign(spoke, {
        boxX,
        boxY,
        anchorX,
        anchorY,
      });
    });

    // Distribución espaciada y escalonada en columnas para el lateral IZQUIERDO
    leftGroup.forEach((spoke, idx) => {
      const stepY = totalSpanY / Math.max(leftGroup.length, 1);
      const targetY = yStart + (idx + 0.5) * stepY;

      let boxX = 15;
      if (leftGroup.length >= 8) {
        const colPattern = [1, 2, 0]; // 1 = media, 2 = exterior (borde izquierdo), 0 = interior
        const col = colPattern[idx % 3];
        if (col === 2) {
          boxX = 15; // Ocupa todo el ancho hasta el extremo izquierdo
        } else if (col === 1) {
          boxX = 300 - spoke.boxW / 2;
        } else {
          boxX = (cx - R - 40) - spoke.boxW;
        }
      } else if (leftGroup.length >= 4) {
        const isOuterCol = idx % 2 === 1;
        boxX = isOuterCol ? 20 : (cx - R - 50) - spoke.boxW;
      } else {
        boxX = (cx - R - 80) - spoke.boxW;
      }

      const boxY = targetY - spoke.boxH / 2;
      const anchorX = boxX + spoke.boxW;
      const anchorY = targetY;

      Object.assign(spoke, {
        boxX,
        boxY,
        anchorX,
        anchorY,
      });
    });

    // Distribución superior (Polo Norte)
    topGroup.forEach((spoke, idx) => {
      const offsetCenterX = (idx - (topGroup.length - 1) / 2) * 220;
      const targetX = cx + offsetCenterX;
      const targetY = 40;

      const boxX = targetX - spoke.boxW / 2;
      const boxY = targetY;
      const anchorX = targetX;
      const anchorY = boxY + spoke.boxH;

      Object.assign(spoke, {
        boxX,
        boxY,
        anchorX,
        anchorY,
      });
    });

    // Distribución inferior (Polo Sur)
    bottomGroup.forEach((spoke, idx) => {
      const offsetCenterX = (idx - (bottomGroup.length - 1) / 2) * 220;
      const targetX = cx + offsetCenterX;
      const targetY = svgHeight - 40;

      const boxX = targetX - spoke.boxW / 2;
      const boxY = targetY - spoke.boxH;
      const anchorX = targetX;
      const anchorY = boxY;

      Object.assign(spoke, {
        boxX,
        boxY,
        anchorX,
        anchorY,
      });
    });

    return rawSpokes as any[];
  }, [orderedActuaciones, N, cx, cy, R, svgWidth, svgHeight, effectiveTextScale]);

  // Migración y enriquecimiento transparente: si existen ajustes guardados previamente con solo dx/dy,
  // se calculan y persisten de inmediato sus coordenadas absolutas x/y para máxima precisión en PDF y renderizado
  useEffect(() => {
    if (spokeGeometry.length === 0 || N === 0) return;
    let needsUpgrade = false;
    const current = { ...cardAdjustmentsRef.current };
    spokeGeometry.forEach((spoke: any) => {
      const adj = current[spoke.act.order];
      if (adj) {
        if (typeof adj.x !== 'number' || isNaN(adj.x) || typeof adj.y !== 'number' || isNaN(adj.y)) {
          needsUpgrade = true;
          current[spoke.act.order] = {
            ...adj,
            x: Math.round(spoke.boxX + (adj.dx || 0)),
            y: Math.round(spoke.boxY + (adj.dy || 0)),
          };
        }
      }
    });
    if (needsUpgrade) {
      cardAdjustmentsRef.current = current;
      setCardAdjustments(current);
      saveStoredCardAdjustments(N, current, componentIdRef.current);
      onAdjustmentsChangeRef.current?.(current);
    }
  }, [spokeGeometry, N]);

  // Datasets vectoriales y para test runners accesibles
  const datasets = useMemo(() => {
    const list: any[] = [];

    activeEtapasList.forEach((etapa, idx) => {
      const etapaData = student.etapas[etapa.key];
      if (!etapaData) return;

      const colorConfig =
        ETAPA_COLORS[etapa.key] ||
        (idx === 0
          ? ETAPA_COLORS.edi
          : idx === 1
          ? ETAPA_COLORS.ep1
          : ETAPA_COLORS.ep2);

      const dataValues = orderedActuaciones.map((act) => {
        const val = etapaData.actuacionesResultados?.[act.order];
        return val !== undefined ? val : 1;
      });

      const isMostRecent = idx === totalActive - 1;

      // Coordenadas cartesianas de cada vértice
      const points = dataValues.map((val, i) => {
        const act = orderedActuaciones[i];
        const actOrder = act?.order ?? i + 1;
        const offset = getCoincidentRadiusOffset(etapa.key, actOrder, activeEtapasList, student.etapas);
        const rVal = (val * R) / 2 + offset;
        const geom = spokeGeometry[i];
        const angle = geom ? geom.angle : -Math.PI / 2 + (2 * Math.PI * i) / N;
        return {
          x: cx + rVal * Math.cos(angle),
          y: cy + rVal * Math.sin(angle),
          val,
          act,
          order: actOrder,
        };
      });

      const pointsString = points
        .map((p) => `${p.x.toFixed(1)},${p.y.toFixed(1)}`)
        .join(' ');

      list.push({
        label: etapa.label || colorConfig.label,
        key: etapa.key,
        colorConfig,
        data: dataValues,
        points,
        pointsString,
        isMostRecent,
        order: totalActive - idx,
      });
    });

    return list;
  }, [student, activeEtapasList, orderedActuaciones, spokeGeometry, totalActive, N]);

  // 4. Estadísticas resumidas por etapa (todas las etapas visibles o configuradas)
  const statsPorEtapa = useMemo(() => {
    const stagesToDisplay = sortedEtapas.filter(
      (etapa) => effectiveActiveStages[etapa.key] ?? true
    );
    return stagesToDisplay.map((et, idx) => {
      const etapaData = student.etapas[et.key];
      const colorConfig =
        ETAPA_COLORS[et.key] ||
        (idx === 0
          ? ETAPA_COLORS.edi
          : idx === 1
          ? ETAPA_COLORS.ep1
          : ETAPA_COLORS.ep2);

      if (
        !etapaData ||
        (typeof etapaData.puntaje !== 'number' && !etapaData.actuacionesResultados)
      ) {
        return {
          key: et.key,
          label: et.label,
          totalLogradas: 0,
          total: orderedActuaciones.length,
          porcentaje: 0,
          activa: false,
          colorConfig,
        };
      }

      let logradas = 0;
      orderedActuaciones.forEach((act) => {
        if (etapaData.actuacionesResultados?.[act.order] === 2) {
          logradas++;
        }
      });

      return {
        key: et.key,
        label: et.label,
        totalLogradas: logradas,
        total: orderedActuaciones.length,
        porcentaje:
          orderedActuaciones.length > 0
            ? Math.round((logradas / orderedActuaciones.length) * 100)
            : 0,
        activa: true,
        colorConfig,
      };
    });
  }, [student, sortedEtapas, effectiveActiveStages, orderedActuaciones]);

  // Renderizado de tarjeta individual compacta para las columnas laterales (Diseño 2)
  const renderColumnCard = (act: ActuacionCatalogoItem) => {
    const isHovered = hoveredCardOrder === act.order;

    // Escalado adaptativo de tipografía y badge según effectiveTextScale
    const baseFontSizePx = 11;
    const scaledFontSizePx = Math.round(baseFontSizePx * effectiveTextScale * 10) / 10;
    const scaledLineHeightPx = Math.round(scaledFontSizePx * 1.32 * 10) / 10;
    const badgeSize = Math.max(20, Math.round(20 * Math.min(effectiveTextScale, 1.25)));
    const badgeFontSize = Math.max(10, Math.round(10 * Math.min(effectiveTextScale, 1.25)));

    return (
      <div
        key={act.order}
        data-testid={`lateral-card-${act.order}`}
        onMouseEnter={() => setHoveredCardOrder(act.order)}
        onMouseLeave={() => setHoveredCardOrder(null)}
        className={`py-1.5 px-2 rounded-xl border transition-colors duration-150 cursor-pointer ${
          isHovered
            ? 'bg-blue-50/95 border-blue-400 ring-2 ring-blue-500/20 shadow-xs'
            : 'bg-white hover:bg-slate-50/90 border-slate-200/80 shadow-2xs'
        }`}
      >
        <div className="flex items-start gap-2">
          {/* Número de actuación idéntico al del perímetro del radar */}
          <span
            className={`rounded-md flex items-center justify-center font-bold shrink-0 transition-colors mt-0.5 ${
              isHovered
                ? 'bg-blue-600 text-white shadow-2xs'
                : 'bg-slate-100 text-slate-700 border border-slate-200/80'
            }`}
            style={{
              width: `${badgeSize}px`,
              height: `${badgeSize}px`,
              fontSize: `${badgeFontSize}px`,
            }}
          >
            {act.order}
          </span>

          <div className="flex-1 min-w-0">
            <p
              className={`font-medium transition-colors ${
                isHovered ? 'text-blue-950' : 'text-slate-700'
              }`}
              style={{
                fontSize: `${scaledFontSizePx}px`,
                lineHeight: `${scaledLineHeightPx}px`,
              }}
            >
              {act.actuacion}
            </p>
          </div>
        </div>
      </div>
    );
  };

  // Renderizado dinámico de un bloque de Radar Central con Columnas Laterales
  // (Reutilizable para Diseño 2 completo o para Diseño 3 dividido en dos mitades)
  const renderRadarWithColumns = (
    actuacionesList: ActuacionCatalogoItem[],
    subKey: string,
    sectionTitle?: string
  ) => {
    const M = actuacionesList.length;
    if (M === 0) return null;

    const mid = Math.ceil(M / 2);
    const rightCol = isAntihorario
      ? actuacionesList.slice(mid)
      : actuacionesList.slice(0, mid);
    const leftCol = isAntihorario
      ? actuacionesList.slice(0, mid)
      : actuacionesList.slice(mid);

    const spokes = actuacionesList.map((act, i) => {
      const angle = isAntihorario
        ? -Math.PI / 2 - (2 * Math.PI * i) / M
        : -Math.PI / 2 + (2 * Math.PI * i) / M;
      const cos = Math.cos(angle);
      const sin = Math.sin(angle);
      const vx = cxCol + RCol * cos;
      const vy = cyCol + RCol * sin;
      const nx = cxCol + RBadge * cos;
      const ny = cyCol + RBadge * sin;

      return {
        act,
        index: i,
        angle,
        cos,
        sin,
        vx,
        vy,
        nx,
        ny,
      };
    });

    const datasets = activeEtapasList.map((etapa, idx) => {
      const etapaData = student.etapas[etapa.key];
      const colorConfig =
        ETAPA_COLORS[etapa.key] ||
        (idx === 0
          ? ETAPA_COLORS.edi
          : idx === 1
          ? ETAPA_COLORS.ep1
          : ETAPA_COLORS.ep2);

      const points = actuacionesList.map((act, i) => {
        const val = etapaData?.actuacionesResultados?.[act.order] ?? 1;
        const offset = getCoincidentRadiusOffset(etapa.key, act.order, activeEtapasList, student.etapas);
        const rVal = (val * RCol) / 2 + offset;
        const angle = spokes[i].angle;
        return {
          x: cxCol + rVal * Math.cos(angle),
          y: cyCol + rVal * Math.sin(angle),
          val,
          act,
          order: act.order,
        };
      });

      const pointsString = points
        .map((p) => `${p.x.toFixed(1)},${p.y.toFixed(1)}`)
        .join(' ');

      return {
        key: etapa.key,
        label: etapa.label,
        colorConfig,
        points,
        pointsString,
        isMostRecent: idx === totalActive - 1,
      };
    });

    return (
      <div key={`radar-cols-block-${subKey}`} className="w-full">
        {sectionTitle && (
          <div className="flex flex-wrap items-center justify-between gap-2 px-3 py-2 bg-slate-50 border border-slate-200/80 rounded-2xl mb-4">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-blue-600 animate-pulse" />
              <span className="text-xs font-bold text-slate-800 tracking-wide uppercase">
                {sectionTitle}
              </span>
            </div>
            <span className="text-[11px] font-semibold text-slate-500 bg-white px-2.5 py-0.5 rounded-full border border-slate-200">
              {actuacionesList.length} actuaciones pedagógicas
            </span>
          </div>
        )}

        <div className="w-full grid grid-cols-1 lg:grid-cols-12 gap-6 items-start py-2">
          {/* Columna Izquierda */}
          <div className="order-2 lg:order-1 lg:col-span-3 space-y-1.5">
            {leftCol.length > 0 && (
              <div className="flex items-center justify-between pb-1.5 px-1 border-b border-slate-200">
                <div className="flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-blue-500" />
                  <span className="text-xs font-bold text-slate-700 tracking-wide">
                    Actuaciones {leftCol[0]?.order} - {leftCol[leftCol.length - 1]?.order}
                  </span>
                </div>
                <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">
                  Lado Izquierdo
                </span>
              </div>
            )}
            <div className="space-y-1.5">
              {leftCol.map((act) => renderColumnCard(act))}
            </div>
          </div>

          {/* Columna Central: Radar Limpio con Números en los Vértices */}
          <div className="order-1 lg:order-2 lg:col-span-6 flex flex-col items-center justify-center lg:sticky lg:top-4 bg-white/70 rounded-3xl p-2 sm:p-4 relative">
            {/* Tooltip interactivo flotante para modo columnas */}
            {activeTooltip && (
              <div
                className="absolute z-30 pointer-events-none -translate-x-1/2 -translate-y-full mb-3 bg-slate-900/95 backdrop-blur-md text-white px-3.5 py-2.5 rounded-xl shadow-xl border border-slate-700/60 max-w-xs transition-all duration-150 animate-fadeIn"
                style={{
                  left: `${Math.min(Math.max((activeTooltip.x / 720) * 100, 5), 95)}%`,
                  top: `${(activeTooltip.y / 720) * 100}%`,
                }}
              >
                <div className="text-xs font-bold text-slate-100 flex items-center gap-1.5 mb-1">
                  <span
                    className="w-2.5 h-2.5 rounded-full shrink-0"
                    style={{
                      backgroundColor:
                        ETAPA_COLORS[activeTooltip.etapaKey]?.border || '#3b82f6',
                    }}
                  />
                  <span>{activeTooltip.etapaLabel}</span>
                </div>
                <div className="text-[11px] font-semibold text-slate-200 leading-snug">
                  Actuación {activeTooltip.order}: {activeTooltip.act.actuacion}
                </div>
                {activeTooltip.act.pregunta &&
                  activeTooltip.act.pregunta !== activeTooltip.act.actuacion && (
                    <div className="text-[10px] text-slate-400 mt-1 italic">
                      {activeTooltip.act.pregunta}
                    </div>
                  )}
                <div className="mt-2 pt-1.5 border-t border-slate-800 space-y-1">
                  <div className="text-[10px] text-slate-400 font-medium flex items-center justify-between">
                    <span>Resultado:</span>
                    {activeTooltip.allStages && activeTooltip.allStages.length > 1 &&
                      activeTooltip.allStages.every(s => s.valor === activeTooltip.allStages![0].valor) && (
                        <span className="text-[9px] font-bold text-amber-300 bg-amber-500/20 px-1.5 py-0.2 rounded border border-amber-500/30">
                          Sin variación
                        </span>
                      )}
                  </div>
                  <div className="flex flex-col gap-1">
                    {(activeTooltip.allStages || [{
                      key: activeTooltip.etapaKey,
                      label: activeTooltip.etapaLabel,
                      valor: activeTooltip.valor,
                      color: ETAPA_COLORS[activeTooltip.etapaKey]?.border || '#3b82f6'
                    }]).map((st) => (
                      <div key={st.key} className="flex items-center justify-between gap-2 text-[10px]">
                        <div className="flex items-center gap-1.5">
                          <span className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: st.color }} />
                          <span className="text-slate-300 font-medium">{st.label}:</span>
                        </div>
                        <span
                          className={`font-bold px-1.5 py-0.2 rounded ${
                            st.valor === 2
                              ? 'text-emerald-400 font-semibold'
                              : 'text-rose-400 font-semibold'
                          }`}
                        >
                          {st.valor === 2 ? 'SÍ (Acertó)' : 'NO (No acertó)'}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            <svg
              data-testid="radar-svg-canvas"
              viewBox="0 0 720 720"
              className="w-full max-w-[560px] h-auto select-none overflow-visible"
              preserveAspectRatio="xMidYMid meet"
            >
              {/* Anillo 1 (Interior: NO acertó = 1) */}
              <circle
                cx={cxCol}
                cy={cyCol}
                r={r1Col}
                fill="none"
                stroke="#e2e8f0"
                strokeWidth="1.5"
                strokeDasharray="4 4"
              />

              {/* Anillo 2 (Exterior: SÍ acertó = 2) */}
              <circle
                cx={cxCol}
                cy={cyCol}
                r={r2Col}
                fill="none"
                stroke="#cbd5e1"
                strokeWidth="1.5"
              />

              {/* Hub Central */}
              <circle cx={cxCol} cy={cyCol} r="3.5" fill="#94a3b8" />

              {/* Indicadores numéricos de escala en el eje superior */}
              <text
                x={cxCol + 6}
                y={cyCol - r1Col + 14}
                className="text-[10px] font-bold fill-slate-400 select-none pointer-events-none"
              >
                1 (NO)
              </text>
              <text
                x={cxCol + 6}
                y={cyCol - r2Col + 14}
                className="text-[10px] font-bold fill-slate-400 select-none pointer-events-none"
              >
                2 (SÍ)
              </text>

              {/* Ejes radiales (Spokes) hacia cada vértice exterior del radar */}
              {spokes.map((spoke) => {
                const isHovered = hoveredCardOrder === spoke.act.order;
                return (
                  <g key={`spoke-${subKey}-${spoke.act.order}`}>
                    <line
                      x1={cxCol}
                      y1={cyCol}
                      x2={spoke.vx}
                      y2={spoke.vy}
                      stroke={isHovered ? '#93c5fd' : '#e2e8f0'}
                      strokeWidth={isHovered ? 1.8 : 1.2}
                      className="transition-colors duration-150"
                    />
                    <line
                      x1={spoke.vx}
                      y1={spoke.vy}
                      x2={spoke.nx}
                      y2={spoke.ny}
                      stroke={isHovered ? '#2563eb' : '#cbd5e1'}
                      strokeWidth={isHovered ? 2 : 1}
                      strokeDasharray={isHovered ? undefined : '2 2'}
                      className="transition-colors duration-150"
                    />
                  </g>
                );
              })}

              {/* Polígonos de evaluación */}
              {datasets.map((ds) => {
                const isHovered = hoveredStageKey === ds.key;
                return (
                  <g key={`dataset-${subKey}-${ds.key}`} className="transition-all duration-200">
                    <polygon
                      points={ds.pointsString}
                      fill={ds.colorConfig.bg}
                      stroke={ds.colorConfig.border}
                      strokeWidth={ds.isMostRecent ? (isHovered ? 3.5 : 2.5) : isHovered ? 2.8 : 1.8}
                      className="cursor-pointer transition-all duration-200"
                      style={{
                        fillOpacity: isHovered
                          ? 0.22
                          : ds.isMostRecent
                          ? 0.12
                          : 0.07,
                      }}
                      onMouseEnter={() => setHoveredStageKey(ds.key)}
                      onMouseLeave={() => setHoveredStageKey(null)}
                    />

                    {ds.points.map((pt: any, ptIdx: number) => {
                      const isPtActive =
                        activeTooltip?.etapaKey === ds.key &&
                        activeTooltip?.order === pt.order;

                      return (
                        <circle
                          key={`pt-${subKey}-${ds.key}-${ptIdx}`}
                          cx={pt.x}
                          cy={pt.y}
                          r={isPtActive ? 8 : ds.isMostRecent ? 5.5 : 4.5}
                          fill={ds.colorConfig.border}
                          stroke="#ffffff"
                          strokeWidth={isPtActive ? 2.5 : 1.5}
                          className="cursor-pointer transition-all duration-150 hover:opacity-100"
                          onMouseEnter={() => {
                            setHoveredStageKey(ds.key);
                            setHoveredCardOrder(pt.order);
                            setActiveTooltip({
                              act: pt.act,
                              order: pt.order,
                              etapaLabel: ds.label,
                              etapaKey: ds.key,
                              valor: pt.val,
                              x: pt.x,
                              y: pt.y,
                              allStages: activeEtapasList.map((et) => {
                                const stData = student.etapas[et.key];
                                const v = stData?.actuacionesResultados?.[pt.order] ?? 1;
                                const cfg = ETAPA_COLORS[et.key] || ds.colorConfig;
                                return {
                                  key: et.key,
                                  label: et.label,
                                  valor: v,
                                  color: cfg.border,
                                };
                              }),
                            });
                          }}
                          onMouseLeave={() => {
                            setHoveredStageKey(null);
                            setHoveredCardOrder(null);
                            setActiveTooltip(null);
                          }}
                        />
                      );
                    })}
                  </g>
                );
              })}

              {/* Números en el perímetro exterior indicando cada actuación */}
              {spokes.map((spoke) => {
                const isBadgeHovered = hoveredCardOrder === spoke.act.order;
                return (
                  <g
                    key={`badge-${subKey}-${spoke.act.order}`}
                    data-testid={`radar-vertex-badge-${spoke.act.order}`}
                    className="cursor-pointer transition-transform duration-150"
                    onMouseEnter={() => setHoveredCardOrder(spoke.act.order)}
                    onMouseLeave={() => setHoveredCardOrder(null)}
                  >
                    <circle
                      cx={spoke.nx}
                      cy={spoke.ny}
                      r={isBadgeHovered ? 16 : 13}
                      fill={isBadgeHovered ? '#2563eb' : '#ffffff'}
                      stroke={isBadgeHovered ? '#1d4ed8' : '#cbd5e1'}
                      strokeWidth={isBadgeHovered ? 2.2 : 1.5}
                      className="transition-all duration-150 drop-shadow-xs"
                    />
                    <text
                      x={spoke.nx}
                      y={spoke.ny + 4}
                      textAnchor="middle"
                      style={{ fontSize: isBadgeHovered ? '11px' : '10px' }}
                      className={`font-extrabold select-none pointer-events-none transition-colors duration-150 ${
                        isBadgeHovered ? 'fill-white' : 'fill-slate-700'
                      }`}
                    >
                      {spoke.act.order}
                    </text>
                  </g>
                );
              })}
            </svg>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-2 mt-2">
              <p className="text-[11px] text-slate-400 text-center font-medium">
                Pasa el cursor sobre un número o tarjeta lateral para sincronizar la actuación
              </p>
              <span
                data-testid="radar-direction-indicator"
                className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-slate-100 text-slate-600 border border-slate-200"
              >
                {isAntihorario ? (
                  <>
                    <MdRotateLeft className="w-3 h-3 text-blue-600" />
                    <span>Sentido Antihorario (↺)</span>
                  </>
                ) : (
                  <>
                    <MdRotateRight className="w-3 h-3 text-slate-500" />
                    <span>Sentido Horario (↻)</span>
                  </>
                )}
              </span>
            </div>
          </div>

          {/* Columna Derecha */}
          <div className="order-3 lg:order-3 lg:col-span-3 space-y-1.5">
            {rightCol.length > 0 && (
              <div className="flex items-center justify-between pb-1.5 px-1 border-b border-slate-200">
                <div className="flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-blue-500" />
                  <span className="text-xs font-bold text-slate-700 tracking-wide">
                    Actuaciones {rightCol[0]?.order} - {rightCol[rightCol.length - 1]?.order}
                  </span>
                </div>
                <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">
                  Lado Derecho
                </span>
              </div>
            )}
            <div className="space-y-1.5">
              {rightCol.map((act) => renderColumnCard(act))}
            </div>
          </div>
        </div>
      </div>
    );
  };

  // Renderizado dinámico de un bloque de Red Flotante Panorámica
  // (Reutilizable para diseño flotante completo o dividido en dos mitades)
  // Cuando se divide en 2 bloques (isSplitBlock = true), actúa SOLO el algoritmo de ordenar y separar actuaciones
  const renderFloatingRadar = (
    actuacionesList: ActuacionCatalogoItem[],
    subKey: string,
    sectionTitle?: string,
    isSplitBlock: boolean = false
  ) => {
    const M = actuacionesList.length;
    if (M === 0) return null;

    // Si está en bloque dividido, usa sus propios ajustes independientes de vista dividida (splitCardAdjustments);
    // Si no está dividido, usa los ajustes de vista completa (cardAdjustments).
    const activeAdjustments = isSplitBlock ? splitCardAdjustments : cardAdjustments;

    const subSvgHeight = Math.max(800, 540 + M * 18);
    const subCx = svgWidth / 2;
    const subCy = subSvgHeight / 2;
    const subR = 240; // Radio exterior del radar web (mismo tamaño que en diseño de columnas: RCol = 240)
    const subR1 = subR / 2; // Radio intermedio (Anillo 1: NO acertó) = 120
    const subR2 = subR; // Radio exterior (Anillo 2: SÍ acertó) = 240

    const rawSpokes = actuacionesList.map((act, i) => {
      const angle = -Math.PI / 2 + (2 * Math.PI * i) / M;
      const cos = Math.cos(angle);
      const sin = Math.sin(angle);
      const sx = subCx + subR * cos;
      const sy = subCy + subR * sin;

      let side: "top" | "bottom" | "right" | "left" = "right";
      if (Math.abs(cos) <= 0.16 && sin < 0) side = "top";
      else if (Math.abs(cos) <= 0.16 && sin > 0) side = "bottom";
      else if (cos > 0) side = "right";
      else side = "left";

      const card = calculateDynamicCard(act.order, act.actuacion, 340, effectiveTextScale);

      return {
        act,
        index: i,
        angle,
        cos,
        sin,
        sx,
        sy,
        side,
        boxW: card.boxW,
        boxH: card.boxH,
        textFit: card,
        boxX: 0,
        boxY: 0,
        anchorX: 0,
        anchorY: 0,
      };
    });

    const rightGroup = rawSpokes
      .filter((s) => s.side === "right")
      .sort((a, b) => a.sy - b.sy);
    const leftGroup = rawSpokes
      .filter((s) => s.side === "left")
      .sort((a, b) => a.sy - b.sy);
    const topGroup = rawSpokes
      .filter((s) => s.side === "top")
      .sort((a, b) => a.sx - b.sx);
    const bottomGroup = rawSpokes
      .filter((s) => s.side === "bottom")
      .sort((a, b) => a.sx - b.sx);

    const yStart = 60;
    const yEnd = subSvgHeight - 60;
    const totalSpanY = yEnd - yStart;

    rightGroup.forEach((spoke, idx) => {
      const stepY = totalSpanY / Math.max(rightGroup.length, 1);
      const targetY = yStart + (idx + 0.5) * stepY;
      let boxX = subCx + subR + 45;
      if (rightGroup.length >= 8) {
        const colPattern = [1, 2, 0];
        const col = colPattern[idx % 3];
        if (col === 2) boxX = svgWidth - spoke.boxW - 15;
        else if (col === 1) boxX = 1380 - spoke.boxW / 2;
        else boxX = subCx + subR + 40;
      } else if (rightGroup.length >= 4) {
        const isOuterCol = idx % 2 === 1;
        boxX = isOuterCol ? svgWidth - spoke.boxW - 20 : subCx + subR + 50;
      } else {
        boxX = subCx + subR + 80;
      }

      const boxY = targetY - spoke.boxH / 2;
      const anchorX = boxX;
      const anchorY = targetY;
      Object.assign(spoke, { boxX, boxY, anchorX, anchorY });
    });

    leftGroup.forEach((spoke, idx) => {
      const stepY = totalSpanY / Math.max(leftGroup.length, 1);
      const targetY = yStart + (idx + 0.5) * stepY;
      let boxX = 15;
      if (leftGroup.length >= 8) {
        const colPattern = [1, 2, 0];
        const col = colPattern[idx % 3];
        if (col === 2) boxX = 15;
        else if (col === 1) boxX = 300 - spoke.boxW / 2;
        else boxX = (subCx - subR - 40) - spoke.boxW;
      } else if (leftGroup.length >= 4) {
        const isOuterCol = idx % 2 === 1;
        boxX = isOuterCol ? 20 : (subCx - subR - 50) - spoke.boxW;
      } else {
        boxX = (subCx - subR - 80) - spoke.boxW;
      }

      const boxY = targetY - spoke.boxH / 2;
      const anchorX = boxX + spoke.boxW;
      const anchorY = targetY;
      Object.assign(spoke, { boxX, boxY, anchorX, anchorY });
    });

    topGroup.forEach((spoke, idx) => {
      const offsetCenterX = (idx - (topGroup.length - 1) / 2) * 220;
      const targetX = subCx + offsetCenterX;
      const targetY = 40;
      const boxX = targetX - spoke.boxW / 2;
      const boxY = targetY;
      const anchorX = targetX;
      const anchorY = boxY + spoke.boxH;
      Object.assign(spoke, { boxX, boxY, anchorX, anchorY });
    });

    bottomGroup.forEach((spoke, idx) => {
      const offsetCenterX = (idx - (bottomGroup.length - 1) / 2) * 220;
      const targetX = subCx + offsetCenterX;
      const targetY = subSvgHeight - 40;
      const boxX = targetX - spoke.boxW / 2;
      const boxY = targetY - spoke.boxH;
      const anchorX = targetX;
      const anchorY = boxY;
      Object.assign(spoke, { boxX, boxY, anchorX, anchorY });
    });

    const subDatasets = activeEtapasList.map((etapa, idx) => {
      const etapaData = student.etapas[etapa.key];
      const colorConfig =
        ETAPA_COLORS[etapa.key] ||
        (idx === 0
          ? ETAPA_COLORS.edi
          : idx === 1
          ? ETAPA_COLORS.ep1
          : ETAPA_COLORS.ep2);

      const points = rawSpokes.map((spoke) => {
        const val = etapaData?.actuacionesResultados?.[spoke.act.order] ?? 1;
        const offset = getCoincidentRadiusOffset(etapa.key, spoke.act.order, activeEtapasList, student.etapas);
        const rVal = (val * subR) / 2 + offset;
        return {
          x: subCx + rVal * Math.cos(spoke.angle),
          y: subCy + rVal * Math.sin(spoke.angle),
          val,
          act: spoke.act,
          order: spoke.act.order,
        };
      });

      const pointsString = points.map((p) => p.x + "," + p.y).join(" ");

      return {
        key: etapa.key,
        label: etapa.label,
        colorConfig,
        points,
        pointsString,
        isMostRecent: idx === totalActive - 1,
      };
    });

    return (
      <div key={"floating-radar-block-" + subKey} className="w-full relative">
        {sectionTitle && (
          <div className="flex flex-wrap items-center justify-between gap-2 px-3 py-2 bg-slate-50 border border-slate-200/80 rounded-2xl mb-4">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-blue-600 animate-pulse" />
              <span className="text-xs font-bold text-slate-800 tracking-wide uppercase">
                {sectionTitle}
              </span>
            </div>
            <span className="text-[11px] font-semibold text-slate-500 bg-white px-2.5 py-0.5 rounded-full border border-slate-200">
              {actuacionesList.length} actuaciones pedagógicas
            </span>
          </div>
        )}

        {/* Tooltip interactivo flotante con Tailwind para el bloque flotante */}
        {activeTooltip && (
          <div
            className="absolute z-30 pointer-events-none -translate-x-1/2 -translate-y-full mb-3 bg-slate-900/95 backdrop-blur-md text-white px-3.5 py-2.5 rounded-xl shadow-xl border border-slate-700/60 max-w-xs transition-all duration-150 animate-fadeIn"
            style={{
              left: Math.min(Math.max((activeTooltip.x / svgWidth) * 100, 5), 95) + "%",
              top: (activeTooltip.y / subSvgHeight) * 100 + "%",
            }}
          >
            <div className="text-xs font-bold text-slate-100 flex items-center gap-1.5 mb-1">
              <span
                className="w-2.5 h-2.5 rounded-full shrink-0"
                style={{
                  backgroundColor:
                    ETAPA_COLORS[activeTooltip.etapaKey]?.border || "#3b82f6",
                }}
              />
              <span>{activeTooltip.etapaLabel}</span>
            </div>
            <div className="text-[11px] font-semibold text-slate-200 leading-snug">
              Actuación {activeTooltip.order}: {activeTooltip.act.actuacion}
            </div>
            {activeTooltip.act.pregunta &&
              activeTooltip.act.pregunta !== activeTooltip.act.actuacion && (
                <div className="text-[10px] text-slate-400 mt-1 italic">
                  {activeTooltip.act.pregunta}
                </div>
              )}
            <div className="mt-2 pt-1.5 border-t border-slate-800 space-y-1">
              <div className="text-[10px] text-slate-400 font-medium flex items-center justify-between">
                <span>Resultado:</span>
                {activeTooltip.allStages && activeTooltip.allStages.length > 1 &&
                  activeTooltip.allStages.every(s => s.valor === activeTooltip.allStages![0].valor) && (
                    <span className="text-[9px] font-bold text-amber-300 bg-amber-500/20 px-1.5 py-0.2 rounded border border-amber-500/30">
                      Sin variación
                    </span>
                  )}
              </div>
              <div className="flex flex-col gap-1">
                {(activeTooltip.allStages || [{
                  key: activeTooltip.etapaKey,
                  label: activeTooltip.etapaLabel,
                  valor: activeTooltip.valor,
                  color: ETAPA_COLORS[activeTooltip.etapaKey]?.border || "#3b82f6"
                }]).map((st) => (
                  <div key={st.key} className="flex items-center justify-between gap-2 text-[10px]">
                    <div className="flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: st.color }} />
                      <span className="text-slate-300 font-medium">{st.label}:</span>
                    </div>
                    <span
                      className={`font-bold px-1.5 py-0.2 rounded ${
                        st.valor === 2
                          ? "text-emerald-400 font-semibold"
                          : "text-rose-400 font-semibold"
                      }`}
                    >
                      {st.valor === 2 ? "SÍ (Acertó)" : "NO (No acertó)"}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        <svg
          ref={(el) => {
            if (el) svgRef.current = el;
          }}
          data-testid="radar-svg-canvas"
          viewBox={"0 0 " + svgWidth + " " + subSvgHeight}
          className="w-full h-auto select-none overflow-visible"
          preserveAspectRatio="xMidYMid meet"
        >
          {/* Anillos de escala */}
          <circle cx={subCx} cy={subCy} r={subR1} fill="none" stroke="#e2e8f0" strokeWidth="1.5" strokeDasharray="4 4" />
          <circle cx={subCx} cy={subCy} r={subR2} fill="none" stroke="#cbd5e1" strokeWidth="1.5" />
          <circle cx={subCx} cy={subCy} r="3.5" fill="#94a3b8" />
          <text x={subCx + 5} y={subCy - subR1 + 13} className="text-[10px] font-bold fill-slate-400 select-none pointer-events-none">1 (NO)</text>
          <text x={subCx + 5} y={subCy - subR2 + 13} className="text-[10px] font-bold fill-slate-400 select-none pointer-events-none">2 (SÍ)</text>

          {/* Ejes radiales */}
          {rawSpokes.map((spoke) => (
            <line key={"spoke-" + subKey + "-" + spoke.index} x1={subCx} y1={subCy} x2={spoke.sx} y2={spoke.sy} stroke="#e2e8f0" strokeWidth="1.5" />
          ))}

          {/* Líneas guía hacia tarjetas */}
          {rawSpokes.map((spoke) => {
            const adj = activeAdjustments[spoke.act.order] || { dx: 0, dy: 0 };
            const effectiveBoxW = typeof adj.customW === "number" && !isNaN(adj.customW) ? adj.customW : spoke.boxW;
            const effectiveBoxH = typeof adj.customH === "number" && !isNaN(adj.customH) ? adj.customH : spoke.boxH;
            const effectiveBoxX = typeof adj.x === "number" && !isNaN(adj.x) ? adj.x : spoke.boxX + (typeof adj.dx === "number" && !isNaN(adj.dx) ? adj.dx : 0);
            const effectiveBoxY = typeof adj.y === "number" && !isNaN(adj.y) ? adj.y : spoke.boxY + (typeof adj.dy === "number" && !isNaN(adj.dy) ? adj.dy : 0);

            const cardCenterX = effectiveBoxX + effectiveBoxW / 2;
            const cardCenterY = effectiveBoxY + effectiveBoxH / 2;
            const diffX = cardCenterX - spoke.sx;
            const diffY = cardCenterY - spoke.sy;

            let anchorX: number;
            let anchorY: number;

            if (Math.abs(diffX) * 0.85 >= Math.abs(diffY)) {
              anchorX = diffX > 0 ? effectiveBoxX : effectiveBoxX + effectiveBoxW;
              anchorY = Math.min(Math.max(spoke.sy, effectiveBoxY + 10), effectiveBoxY + effectiveBoxH - 10);
            } else {
              anchorY = diffY > 0 ? effectiveBoxY : effectiveBoxY + effectiveBoxH;
              anchorX = Math.min(Math.max(spoke.sx, effectiveBoxX + 14), effectiveBoxX + effectiveBoxW - 14);
            }

            const isCardHovered = hoveredCardOrder === spoke.act.order;
            const isCardActive = activeInteraction?.order === spoke.act.order;

            return (
              <g key={"leader-line-" + subKey + "-" + spoke.act.order}>
                <line
                  x1={spoke.sx}
                  y1={spoke.sy}
                  x2={anchorX}
                  y2={anchorY}
                  stroke={isCardActive ? "#2563eb" : isCardHovered ? "#3b82f6" : "#94a3b8"}
                  strokeWidth={isCardActive ? 2.4 : isCardHovered ? 2.0 : 1.2}
                  className="transition-colors duration-150"
                />
                <circle
                  cx={spoke.sx}
                  cy={spoke.sy}
                  r={isCardActive ? 4.5 : isCardHovered ? 3.5 : 2.5}
                  fill={isCardActive ? "#2563eb" : isCardHovered ? "#3b82f6" : "#94a3b8"}
                  className="transition-all duration-150"
                />
              </g>
            );
          })}

          {/* Polígonos de evaluación */}
          {subDatasets.map((ds) => {
            const isHovered = hoveredStageKey === ds.key;
            return (
              <g key={"dataset-group-" + subKey + "-" + ds.key} className="transition-all duration-200">
                <polygon
                  points={ds.pointsString}
                  fill={ds.colorConfig.bg}
                  stroke={ds.colorConfig.border}
                  strokeWidth={ds.isMostRecent ? (isHovered ? 3.5 : 2.5) : isHovered ? 2.8 : 1.8}
                  className="cursor-pointer transition-all duration-200"
                  style={{
                    fillOpacity: isHovered ? 0.22 : ds.isMostRecent ? 0.12 : 0.07,
                  }}
                  onMouseEnter={() => setHoveredStageKey(ds.key)}
                  onMouseLeave={() => setHoveredStageKey(null)}
                />
                {ds.points.map((pt: any, ptIdx: number) => {
                  const isPtActive =
                    activeTooltip?.etapaKey === ds.key &&
                    activeTooltip?.order === pt.order;

                  return (
                    <circle
                      key={"pt-" + subKey + "-" + ds.key + "-" + ptIdx}
                      cx={pt.x}
                      cy={pt.y}
                      r={isPtActive ? 8 : ds.isMostRecent ? 5.5 : 4.5}
                      fill={ds.colorConfig.border}
                      stroke="#ffffff"
                      strokeWidth={isPtActive ? 2.5 : 1.5}
                      className="cursor-pointer transition-all duration-150 hover:opacity-100"
                      onMouseEnter={() => {
                        setHoveredStageKey(ds.key);
                        setHoveredCardOrder(pt.order);
                        setActiveTooltip({
                          act: pt.act,
                          order: pt.order,
                          etapaLabel: ds.label,
                          etapaKey: ds.key,
                          valor: pt.val,
                          x: pt.x,
                          y: pt.y,
                          allStages: activeEtapasList.map((et) => {
                            const stData = student.etapas[et.key];
                            const v = stData?.actuacionesResultados?.[pt.order] ?? 1;
                            const cfg = ETAPA_COLORS[et.key] || ds.colorConfig;
                            return {
                              key: et.key,
                              label: et.label,
                              valor: v,
                              color: cfg.border,
                            };
                          }),
                        });
                      }}
                      onMouseLeave={() => {
                        setHoveredStageKey(null);
                        setHoveredCardOrder(null);
                        setActiveTooltip(null);
                      }}
                    />
                  );
                })}
              </g>
            );
          })}

          {/* Tarjetas interactivas Callout */}
          {rawSpokes.map((spoke) => {
            const adj = activeAdjustments[spoke.act.order] || { dx: 0, dy: 0 };
            const effectiveBoxW = typeof adj.customW === "number" && !isNaN(adj.customW) ? adj.customW : spoke.boxW;
            const effectiveBoxH = typeof adj.customH === "number" && !isNaN(adj.customH) ? adj.customH : spoke.boxH;
            const effectiveBoxX = typeof adj.x === "number" && !isNaN(adj.x) ? adj.x : spoke.boxX + (typeof adj.dx === "number" && !isNaN(adj.dx) ? adj.dx : 0);
            const effectiveBoxY = typeof adj.y === "number" && !isNaN(adj.y) ? adj.y : spoke.boxY + (typeof adj.dy === "number" && !isNaN(adj.dy) ? adj.dy : 0);

            const isCardHovered = hoveredCardOrder === spoke.act.order;
            const isCardActive = activeInteraction?.order === spoke.act.order;
            const isMoving = isCardActive && activeInteraction?.type === "move";
            const isResizing = isCardActive && activeInteraction?.type === "resize";

            const textFit =
              adj.customW || adj.customH
                ? fitTextInBox(
                    spoke.act.order,
                    spoke.act.actuacion,
                    effectiveBoxW,
                    effectiveBoxH,
                    effectiveTextScale
                  )
                : spoke.textFit;

            const { fontSize, lines, lineHeight } = textFit;
            const totalTextHeight = (lines.length - 1) * lineHeight;
            const textStartY =
              effectiveBoxY + (effectiveBoxH - totalTextHeight) / 2 + fontSize * 0.35;

            return (
              <g
                key={"callout-card-" + subKey + "-" + spoke.act.order}
                data-testid={"callout-card-" + spoke.act.order}
                className={
                  "select-none touch-none " + (
                    isMoving
                      ? "cursor-grabbing"
                      : isResizing
                      ? "cursor-se-resize"
                      : "cursor-grab"
                  )
                }
                onPointerDown={(e) =>
                  handleStartMove(
                    e,
                    spoke.act.order,
                    spoke.boxX,
                    spoke.boxY,
                    effectiveBoxW,
                    effectiveBoxH
                  )
                }
                onMouseEnter={() => setHoveredCardOrder(spoke.act.order)}
                onMouseLeave={() => setHoveredCardOrder(null)}
              >
                <title>Arrastra para mover la tarjeta • Usa la esquina inferior derecha para cambiar su tamaño</title>
                <rect
                  x={effectiveBoxX}
                  y={effectiveBoxY}
                  width={effectiveBoxW}
                  height={effectiveBoxH}
                  rx={8}
                  ry={8}
                  fill="#ffffff"
                  stroke={isCardActive ? "#2563eb" : isCardHovered ? "#3b82f6" : "#cbd5e1"}
                  strokeWidth={isCardActive ? 2.2 : isCardHovered ? 1.8 : 1.2}
                  className="transition-colors duration-150 drop-shadow-xs"
                  style={{
                    filter: isCardActive
                      ? "drop-shadow(0 4px 8px rgba(37, 99, 235, 0.22))"
                      : isCardHovered
                      ? "drop-shadow(0 2px 4px rgba(0, 0, 0, 0.08))"
                      : undefined,
                  }}
                />
                <text
                  x={effectiveBoxX + effectiveBoxW / 2}
                  y={textStartY}
                  textAnchor="middle"
                  style={{ fontSize: fontSize + "px" }}
                  className={"font-semibold pointer-events-none select-none transition-colors duration-150 " + (
                    isCardActive || isCardHovered ? "fill-blue-600" : "fill-slate-700"
                  )}
                >
                  {lines.map((lineText: string, j: number) => (
                    <tspan
                      key={"line-" + subKey + "-" + spoke.act.order + "-" + j}
                      x={effectiveBoxX + effectiveBoxW / 2}
                      dy={j === 0 ? 0 : lineHeight}
                      textAnchor="middle"
                    >
                      {lineText}
                    </tspan>
                  ))}
                </text>

                {/* Tirador de redimensionamiento */}
                <g
                  onPointerDown={(e) =>
                    handleStartResize(
                      e,
                      spoke.act.order,
                      effectiveBoxX,
                      effectiveBoxY,
                      effectiveBoxW,
                      effectiveBoxH
                    )
                  }
                  className="cursor-se-resize touch-none opacity-40 hover:opacity-100 transition-opacity"
                >
                  <path
                    d={"M " + (effectiveBoxX + effectiveBoxW - 16) + " " + (effectiveBoxY + effectiveBoxH - 16) + " h 16 v 16 h -16 Z"}
                    fill="transparent"
                  />
                  <line
                    x1={effectiveBoxX + effectiveBoxW - 11}
                    y1={effectiveBoxY + effectiveBoxH - 4}
                    x2={effectiveBoxX + effectiveBoxW - 4}
                    y2={effectiveBoxY + effectiveBoxH - 11}
                    stroke={isResizing ? "#2563eb" : isCardHovered ? "#64748b" : "#94a3b8"}
                    strokeWidth={1.5}
                    strokeLinecap="round"
                  />
                  <line
                    x1={effectiveBoxX + effectiveBoxW - 7}
                    y1={effectiveBoxY + effectiveBoxH - 4}
                    x2={effectiveBoxX + effectiveBoxW - 4}
                    y2={effectiveBoxY + effectiveBoxH - 7}
                    stroke={isResizing ? "#2563eb" : isCardHovered ? "#64748b" : "#94a3b8"}
                    strokeWidth={1.5}
                    strokeLinecap="round"
                  />
                </g>
              </g>
            );
          })}
        </svg>
      </div>
    );
  };

  // Renderizado del Diseño 3: Diana Polar de Progresión Continua
  const renderDianaWheel = (
    actuacionesList: ActuacionCatalogoItem[],
    subKey: string,
    sectionTitle?: string
  ) => {
    const M = actuacionesList.length;
    if (M === 0) {
      return (
        <div className="py-12 text-center text-slate-400 text-sm">
          No hay actuaciones configuradas para mostrar en la Diana Polar.
        </div>
      );
    }

    // Actuación seleccionada deliberadamente por clic (para las cards de cabecera y el hub central).
    // Esto garantiza que el hover NUNCA cambie la altura de la página ni provoque vibraciones.
    const selectedAct = selectedDianaOrder !== null ? actuacionesList.find((a) => a.order === selectedDianaOrder) || null : null;

    // highlightedOrder: Para el resalte visual dentro del propio SVG vectorial (cuña envolvente y hover de fila)
    const highlightedOrder = hoveredDianaOrder ?? selectedDianaOrder ?? null;

    // Filtrado de la tabla lateral según la búsqueda del usuario
    const normalizedQuery = dianaSearchQuery.trim().toLowerCase();
    const filteredList = normalizedQuery
      ? actuacionesList.filter((act) => {
          const matchOrder = act.order.toString().includes(normalizedQuery);
          const matchDesc = (act.actuacion || act.pregunta || '').toLowerCase().includes(normalizedQuery);
          const matchCap = ((act as any).capacidad || '').toLowerCase().includes(normalizedQuery);
          const matchComp = ((act as any).competencia || '').toLowerCase().includes(normalizedQuery);
          return matchOrder || matchDesc || matchCap || matchComp;
        })
      : actuacionesList;

    // Geometría polar SVG de la Diana
    const cx = 290;
    const cy = 290;
    const rHub = 62;
    const rMax = 224;
    const rBadges = 254;

    const kStagesCount = isEvolutionPlaying ? evolutionStep : activeEtapasList.length;
    const ringThickness = (rMax - rHub) / Math.max(1, activeEtapasList.length);
    const sliceAngle = 360 / M;

    // Calcular ángulos por actuación respetando el sentido horario / antihorario
    const actsGeometry = actuacionesList.map((act, i) => {
      const startDeg = isAntihorario ? -90 - (i + 1) * sliceAngle : -90 + i * sliceAngle;
      const endDeg = isAntihorario ? -90 - i * sliceAngle : -90 + (i + 1) * sliceAngle;
      const midDeg = isAntihorario ? -90 - (i + 0.5) * sliceAngle : -90 + (i + 0.5) * sliceAngle;
      return { act, i, startDeg, endDeg, midDeg };
    });

    // Cuña activa para el resalte envolvente en el SVG (por hover o por selección)
    const activeGeom = actsGeometry.find((g) => g.act.order === highlightedOrder);

    // Resumen consolidado global cuando no hay ninguna actuación seleccionada
    const globalResumenInfo = (() => {
      const stageSummaries = activeEtapasList.map((et, k) => {
        const colorCfg = getEtapaColorConfig(et.key, k);
        let aciertos = 0;
        actuacionesList.forEach((act) => {
          if (student.etapas[et.key]?.actuacionesResultados?.[act.order] === 2) {
            aciertos++;
          }
        });
        const pct = M > 0 ? Math.round((aciertos / M) * 100) : 0;
        return {
          key: et.key,
          label: et.label || et.key.toUpperCase(),
          aciertos,
          total: M,
          pct,
          color: colorCfg.border,
        };
      });

      const firstStage = stageSummaries[0];
      const lastStage = stageSummaries[stageSummaries.length - 1];
      let trendText = '→ Mantiene nivel';
      let trendColor = 'text-slate-500';
      if (lastStage && firstStage) {
        if (lastStage.aciertos > firstStage.aciertos) {
          trendText = '↗ Progreso positivo';
          trendColor = 'text-emerald-600';
        } else if (lastStage.aciertos < firstStage.aciertos) {
          trendText = '↘ Requiere atención';
          trendColor = 'text-rose-500';
        } else if (lastStage.aciertos === M && M > 0) {
          trendText = '★ Todas las habilidades superadas';
          trendColor = 'text-blue-600';
        }
      }

      return { stageSummaries, trendText, trendColor };
    })();

    // Cálculos de trayectoria para la tarjeta de la actuación seleccionada
    const trayectoriaInfo = (() => {
      if (!selectedAct) return null;
      const steps: {
        key: string;
        label: string;
        val: number;
        color: string;
        acumuladoHastaEtapa: number;
        evaluacionesHastaEtapa: number;
      }[] = [];
      let superadas = 0;

      activeEtapasList.forEach((et, k) => {
        const val = student.etapas[et.key]?.actuacionesResultados?.[selectedAct.order] ?? 1;
        const colorCfg = getEtapaColorConfig(et.key, k);
        if (val === 2) superadas++;
        steps.push({
          key: et.key,
          label: et.label || et.key.toUpperCase(),
          val,
          color: colorCfg.border,
          acumuladoHastaEtapa: superadas,
          evaluacionesHastaEtapa: k + 1,
        });
      });

      const firstVal = steps[0]?.val ?? 1;
      const lastVal = steps[steps.length - 1]?.val ?? 1;
      let trendText = '→ Mantiene nivel';
      let trendColor = 'text-slate-500';
      if (lastVal > firstVal) {
        trendText = '↗ En Progreso';
        trendColor = 'text-emerald-600';
      } else if (lastVal < firstVal) {
        trendText = '↘ Requiere atención';
        trendColor = 'text-rose-500';
      } else if (superadas === steps.length && steps.length > 0) {
        trendText = '★ Consolidado en todas las evaluaciones';
        trendColor = 'text-blue-600';
      }

      const pct = steps.length > 0 ? Math.round((superadas / steps.length) * 100) : 0;
      const nivelAlcanzado = determinarNivelActuacion(
        superadas,
        steps.length,
        nivelesActuacionGlobal
      );

      return { steps, superadas, total: steps.length, pct, trendText, trendColor, nivelAlcanzado };
    })();

    return (
      <div
        key={`radar-diana-block-${subKey}`}
        data-testid="diana-progression-view"
        className="w-full flex flex-col gap-6"
      >
        {/* Título de sección si está en vista dividida */}
        {sectionTitle && (
          <div className="flex flex-wrap items-center justify-between gap-2 px-4 py-2.5 bg-slate-50 border border-slate-200/80 rounded-2xl">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-blue-600 animate-pulse" />
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700">
                {sectionTitle}
              </h4>
            </div>
            <span className="text-[11px] font-semibold text-slate-500">
              {M} actuaciones en este sector
            </span>
          </div>
        )}

        {/* Fila superior: Leyenda interactiva de anillos y botón de reproducción */}
        <div className="flex flex-wrap items-center justify-between gap-3 px-2 sm:px-4 py-2 bg-slate-50/70 border border-slate-200/70 rounded-2xl">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 mr-1">
              Anillos (Evaluaciones):
            </span>
            {activeEtapasList.map((et, idx) => {
              const colorCfg = getEtapaColorConfig(et.key, idx);
              const isCurrentPlaying = isEvolutionPlaying && evolutionStep === idx + 1;
              return (
                <div
                  key={`diana-stage-pill-${et.key}`}
                  className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold border transition-all ${
                    isCurrentPlaying
                      ? 'bg-blue-50 border-blue-400 text-blue-900 shadow-2xs scale-105'
                      : 'bg-white border-slate-200 text-slate-700'
                  }`}
                  title={`Anillo ${idx + 1}: ${et.label || et.key.toUpperCase()}`}
                >
                  <span
                    className="w-2.5 h-2.5 rounded-full shrink-0"
                    style={{ backgroundColor: colorCfg.border }}
                  />
                  <span>{et.label || et.key.toUpperCase()}</span>
                  <span className="text-[10px] text-slate-400 font-normal">
                    (Anillo {idx + 1})
                  </span>
                </div>
              );
            })}
          </div>

          {/* Botón de reproducción de la evolución */}
          <div className="flex items-center gap-2">
            <button
              type="button"
              data-testid="toggle-evolution-play"
              onClick={handleToggleEvolutionPlay}
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold border transition-all cursor-pointer shadow-2xs ${
                isEvolutionPlaying
                  ? 'bg-amber-500 text-white border-amber-600 hover:bg-amber-600'
                  : 'bg-white text-slate-700 border-slate-200 hover:text-blue-600 hover:border-blue-300 hover:bg-blue-50/40'
              }`}
              title={isEvolutionPlaying ? 'Pausar reproducción' : 'Reproducir evolución de adentro hacia afuera'}
            >
              {isEvolutionPlaying ? (
                <>
                  <MdPause className="w-4 h-4 shrink-0" />
                  <span>Pausar ({evolutionStep}/{activeEtapasList.length})</span>
                </>
              ) : (
                <>
                  <MdPlayArrow className="w-4 h-4 shrink-0 text-blue-600" />
                  <span>Reproducir evolución</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* Bloque Superior de Resumen: Cards por Evaluación (Global Inicial o Actuación Seleccionada) */}
        {selectedAct && trayectoriaInfo ? (
          <div
            data-testid="diana-card-actuacion-detalle"
            className="rounded-2xl border border-blue-200/80 bg-gradient-to-r from-blue-50/40 via-white to-slate-50/30 p-4 sm:p-5 shadow-2xs"
          >
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="flex flex-col gap-0.5 max-w-2xl">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-blue-700">
                    ACTUACIÓN {selectedAct.order} DE {M} · SELECCIONADA EN EL RADAR
                  </span>
                  <button
                    type="button"
                    onClick={() => setSelectedDianaOrder(null)}
                    className="inline-flex items-center gap-1 text-[11px] font-bold text-slate-500 hover:text-blue-600 bg-white hover:bg-blue-50/80 px-2.5 py-0.5 rounded-md border border-slate-200 transition-colors cursor-pointer"
                    title="Volver a la vista general de todas las actuaciones"
                  >
                    ✕ Ver resumen global
                  </button>
                </div>
                <h4 className="text-sm sm:text-base font-bold text-slate-900 leading-snug">
                  {selectedAct.actuacion || selectedAct.pregunta || `Actuación ${selectedAct.order}`}
                </h4>
                <p className="text-xs text-slate-500">
                  Resultado individual y trayectoria acumulada por cada evaluación.
                </p>
              </div>

              {/* Badge del Nivel Formativo Global Alcanzado */}
              {trayectoriaInfo.nivelAlcanzado && (
                <div
                  data-testid="badge-nivel-actuacion-global"
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold border shadow-2xs shrink-0"
                  style={{
                    backgroundColor: `${trayectoriaInfo.nivelAlcanzado.color}15`,
                    color: trayectoriaInfo.nivelAlcanzado.color,
                    borderColor: `${trayectoriaInfo.nivelAlcanzado.color}40`,
                  }}
                  title={trayectoriaInfo.nivelAlcanzado.descripcion}
                >
                  <span
                    className="w-2 h-2 rounded-full shrink-0"
                    style={{ backgroundColor: trayectoriaInfo.nivelAlcanzado.color }}
                  />
                  <span>Nivel: {trayectoriaInfo.nivelAlcanzado.nombre}</span>
                </div>
              )}
            </div>

            {/* Fila de tarjetas por evaluación para la actuación seleccionada */}
            <div
              className={`grid grid-cols-2 sm:grid-cols-${Math.min(
                activeEtapasList.length,
                4
              )} lg:grid-cols-${Math.min(activeEtapasList.length, 6)} gap-3 my-4`}
            >
              {trayectoriaInfo.steps.map((st) => {
                const isSuccess = st.val === 2;
                return (
                  <div
                    key={`detail-card-${st.key}`}
                    className="p-3 bg-white rounded-xl border border-slate-200/90 shadow-2xs flex flex-col items-center text-center gap-1 border-t-4"
                    style={{ borderTopColor: isSuccess ? st.color : '#f43f5e' }}
                  >
                    <span className="text-[11px] font-bold text-slate-600 uppercase tracking-wider">
                      {st.label}
                    </span>
                    <span
                      className={`text-2xl font-black ${
                        isSuccess ? 'text-slate-900' : 'text-rose-600'
                      }`}
                    >
                      {isSuccess ? '1/1' : '0/1'}
                    </span>
                    {/* Acumulado como trayectoria en vez de 'Logrado' */}
                    <span
                      className={`text-[10.5px] font-bold px-2 py-0.5 rounded-md border shadow-2xs whitespace-nowrap ${
                        isSuccess
                          ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                          : 'bg-rose-50 text-rose-700 border-rose-200'
                      }`}
                      title={`Trayectoria acumulada hasta ${st.label}: ${st.acumuladoHastaEtapa} de ${st.evaluacionesHastaEtapa} aciertos`}
                    >
                      Trayectoria: {st.acumuladoHastaEtapa}/{st.evaluacionesHastaEtapa}
                    </span>
                  </div>
                );
              })}
            </div>

            {/* Resumen de trayectoria temporal */}
            <div className="pt-3 border-t border-slate-200/70 flex flex-wrap items-center justify-between gap-2 text-xs">
              <div className="flex items-center gap-1.5 flex-wrap">
                <span className="font-bold text-slate-700">Trayectoria:</span>
                <span className="text-slate-600 font-mono">
                  {trayectoriaInfo.steps
                    .map((s) => `${s.key.toUpperCase()} (${s.val === 2 ? '1/1' : '0/1'})`)
                    .join(' → ')}
                </span>
                <span className={`font-bold ml-1.5 ${trayectoriaInfo.trendColor}`}>
                  · {trayectoriaInfo.trendText}
                </span>
              </div>
              <div className="text-slate-500 font-medium">
                {trayectoriaInfo.superadas} de {trayectoriaInfo.total} superadas ({trayectoriaInfo.pct}%)
              </div>
            </div>
          </div>
        ) : (
          <div
            data-testid="diana-card-global-resumen"
            className="rounded-2xl border border-slate-200/90 bg-gradient-to-r from-slate-50/60 via-white to-blue-50/30 p-4 sm:p-5 shadow-2xs"
          >
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="flex flex-col gap-0.5">
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-blue-600 animate-pulse" />
                  <span className="text-[11px] font-bold uppercase tracking-wider text-slate-600">
                    RESUMEN GLOBAL DE EVALUACIONES ({M} HABILIDADES)
                  </span>
                </div>
                <h4 className="text-sm sm:text-base font-bold text-slate-900 leading-snug">
                  Total de aciertos por evaluación
                </h4>
                <p className="text-xs text-slate-500">
                  Haz clic en cualquier sector de la diana o en una habilidad de la tabla para ver su trayectoria individual.
                </p>
              </div>

              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-bold border border-blue-200 bg-blue-50 text-blue-700 shadow-2xs">
                <MdSearch className="w-3.5 h-3.5 shrink-0" />
                <span>Explora la diana o la tabla para filtrar</span>
              </div>
            </div>

            {/* Fila de tarjetas globales por evaluación con X/M aciertos */}
            <div
              className={`grid grid-cols-2 sm:grid-cols-${Math.min(
                activeEtapasList.length,
                4
              )} lg:grid-cols-${Math.min(activeEtapasList.length, 6)} gap-3 my-4`}
            >
              {globalResumenInfo.stageSummaries.map((st) => (
                <div
                  key={`global-card-${st.key}`}
                  data-testid={`global-card-${st.key}`}
                  className="p-3 bg-white rounded-xl border border-slate-200/90 shadow-2xs flex flex-col items-center text-center gap-1 border-t-4"
                  style={{ borderTopColor: st.color }}
                >
                  <span className="text-[11px] font-bold text-slate-600 uppercase tracking-wider">
                    {st.label}
                  </span>
                  <span className="text-2xl font-black text-slate-900">
                    {st.aciertos}/{st.total}
                  </span>
                  <span
                    className="text-[10.5px] font-bold px-2 py-0.5 rounded-md bg-blue-50 text-blue-700 border border-blue-200/80 shadow-2xs whitespace-nowrap"
                    title={`Porcentaje de aciertos: ${st.pct}%`}
                  >
                    Trayectoria: {st.pct}% aciertos
                  </span>
                </div>
              ))}
            </div>

            {/* Resumen de trayectoria global acumulada */}
            <div className="pt-3 border-t border-slate-200/70 flex flex-wrap items-center justify-between gap-2 text-xs">
              <div className="flex items-center gap-1.5 flex-wrap">
                <span className="font-bold text-slate-700">Trayectoria global:</span>
                <span className="text-slate-600 font-mono">
                  {globalResumenInfo.stageSummaries
                    .map((s) => `${s.key.toUpperCase()} (${s.aciertos}/${s.total})`)
                    .join(' → ')}
                </span>
                <span className={`font-bold ml-1.5 ${globalResumenInfo.trendColor}`}>
                  · {globalResumenInfo.trendText}
                </span>
              </div>
              <div className="text-slate-500 font-medium">
                Consolidado de las {M} habilidades evaluadas
              </div>
            </div>
          </div>
        )}

        {/* Cuerpo principal en 2 columnas: Diana a la izquierda y Buscador + Tabla a la derecha */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* Columna Izquierda: Rueda Diana Polar SVG */}
          <div className="lg:col-span-6 flex flex-col items-center justify-center p-2 sm:p-4 bg-slate-50/40 rounded-3xl border border-slate-200/70">
            <div className="w-full max-w-[540px] aspect-square relative flex items-center justify-center">
              <svg
                viewBox="0 0 580 580"
                className="w-full h-full select-none"
                style={{ overflow: 'visible' }}
              >
                <defs>
                  {/* Filtro de sombra suave para badges activos */}
                  <filter id="diana-active-glow" x="-20%" y="-20%" width="140%" height="140%">
                    <feDropShadow dx="0" dy="2" stdDeviation="3" floodColor="#2563eb" floodOpacity="0.45" />
                  </filter>
                  <filter id="diana-badge-shadow" x="-20%" y="-20%" width="140%" height="140%">
                    <feDropShadow dx="0" dy="1" stdDeviation="2" floodColor="#000000" floodOpacity="0.12" />
                  </filter>
                </defs>

                {/* Círculo de guía exterior */}
                <circle
                  cx={cx}
                  cy={cy}
                  r={rMax}
                  fill="none"
                  stroke="#e2e8f0"
                  strokeWidth={1}
                  strokeDasharray="2 2"
                />

                {/* 1. Celdas anulares concéntricas por evaluación y actuación */}
                {Array.from({ length: kStagesCount }).map((_, k) => {
                  const etapa = activeEtapasList[k];
                  if (!etapa) return null;
                  const innerR = rHub + k * ringThickness;
                  const outerR = innerR + ringThickness;
                  const etapaColor = getEtapaColorConfig(etapa.key, k);

                  return (
                    <g key={`diana-ring-${subKey}-${etapa.key}-${k}`}>
                      {actsGeometry.map(({ act, startDeg, endDeg }) => {
                        const val = student.etapas[etapa.key]?.actuacionesResultados?.[act.order];
                        let fillColor = '#f1f5f9'; // Sin datos
                        if (val === 2) {
                          fillColor = etapaColor.border; // Logrado / Sí
                        } else if (val === 1) {
                          fillColor = '#f43f5e'; // No logrado / No (Rojo coral)
                        }

                        const d = describeAnnularSector(cx, cy, innerR, outerR, startDeg, endDeg);
                        const isHovered = hoveredDianaOrder === act.order;
                        const isSelected = selectedDianaOrder === act.order;

                        return (
                          <path
                            key={`sector-${subKey}-${etapa.key}-${act.order}`}
                            d={d}
                            fill={fillColor}
                            stroke="#ffffff"
                            strokeWidth={1.5}
                            opacity={isHovered || isSelected ? 1 : 0.9}
                            className="cursor-pointer transition-all duration-150"
                            onClick={() => setSelectedDianaOrder((prev) => (prev === act.order ? null : act.order))}
                            onMouseEnter={() => setHoveredDianaOrder(act.order)}
                            onMouseLeave={() => setHoveredDianaOrder(null)}
                          >
                            <title>{`Actuación ${act.order} - ${etapa.label || etapa.key.toUpperCase()}: ${val === 2 ? 'Acertó' : 'No acertó'}`}</title>
                          </path>
                        );
                      })}
                    </g>
                  );
                })}

                {/* 2. Resalte envolvente de la cuña de la actuación activa */}
                {activeGeom && (
                  <path
                    d={describeAnnularSector(
                      cx,
                      cy,
                      rHub - 1,
                      rMax + 2,
                      activeGeom.startDeg,
                      activeGeom.endDeg
                    )}
                    fill="none"
                    stroke="#2563eb"
                    strokeWidth={2.8}
                    pointerEvents="none"
                    className="transition-all duration-150"
                  />
                )}

                {/* 3. Centro / Hub con conteo de habilidades o nivel formativo alcanzado */}
                {(() => {
                  const superadasActive = selectedAct
                    ? activeEtapasList.filter(
                        (et) => student.etapas[et.key]?.actuacionesResultados?.[selectedAct.order] === 2
                      ).length
                    : 0;
                  const nivelActive = selectedAct
                    ? determinarNivelActuacion(
                        superadasActive,
                        activeEtapasList.length,
                        nivelesActuacionGlobal
                      )
                    : null;
                  const hubColor = nivelActive ? nivelActive.color : '#3b82f6';

                  return (
                    <>
                      <circle
                        cx={cx}
                        cy={cy}
                        r={rHub - 2}
                        fill={hubColor}
                        className="transition-colors duration-200 cursor-pointer shadow-inner"
                        onClick={() => setSelectedDianaOrder(null)}
                      />
                      <circle
                        cx={cx}
                        cy={cy}
                        r={rHub - 5}
                        fill="none"
                        stroke="rgba(255,255,255,0.4)"
                        strokeWidth={1.5}
                        pointerEvents="none"
                      />
                      {selectedAct && nivelActive ? (
                        <g pointerEvents="none">
                          <text
                            x={cx}
                            y={cy - 6}
                            textAnchor="middle"
                            fill="#ffffff"
                            fontSize={25}
                            fontWeight="800"
                          >
                            {selectedAct.order}
                          </text>
                          <text
                            x={cx}
                            y={cy + 13}
                            textAnchor="middle"
                            fill="#ffffff"
                            fontSize={8.5}
                            fontWeight="800"
                            letterSpacing="0.04em"
                          >
                            {nivelActive.nombre.toUpperCase()}
                          </text>
                        </g>
                      ) : (
                        <g pointerEvents="none">
                          <text
                            x={cx}
                            y={cy - 5}
                            textAnchor="middle"
                            fill="#ffffff"
                            fontSize={26}
                            fontWeight="800"
                          >
                            {M}
                          </text>
                          <text
                            x={cx}
                            y={cy + 15}
                            textAnchor="middle"
                            fill="rgba(255,255,255,0.92)"
                            fontSize={9.5}
                            fontWeight="700"
                            letterSpacing="0.08em"
                          >
                            HABILIDADES
                          </text>
                        </g>
                      )}
                    </>
                  );
                })()}

                {/* 4. Badges perimetrales con números 1..N y color del nivel alcanzado */}
                {actsGeometry.map(({ act, midDeg }) => {
                  const rad = (midDeg * Math.PI) / 180;
                  const bx = cx + rBadges * Math.cos(rad);
                  const by = cy + rBadges * Math.sin(rad);
                  const isSelected = selectedDianaOrder === act.order;

                  const superadasAct = activeEtapasList.filter(
                    (et) => student.etapas[et.key]?.actuacionesResultados?.[act.order] === 2
                  ).length;
                  const nivelBadge = determinarNivelActuacion(
                    superadasAct,
                    activeEtapasList.length,
                    nivelesActuacionGlobal
                  );

                  return (
                    <g
                      key={`diana-badge-${subKey}-${act.order}`}
                      data-testid={`diana-badge-${act.order}`}
                      className="cursor-pointer transition-transform duration-150"
                      onClick={() => setSelectedDianaOrder((prev) => (prev === act.order ? null : act.order))}
                      onMouseEnter={() => setHoveredDianaOrder(act.order)}
                      onMouseLeave={() => setHoveredDianaOrder(null)}
                    >
                      {isSelected ? (
                        <>
                          <circle
                            cx={bx}
                            cy={by}
                            r={15}
                            fill={nivelBadge.color}
                            opacity={0.35}
                            filter="url(#diana-active-glow)"
                          />
                          <circle
                            cx={bx}
                            cy={by}
                            r={12}
                            fill={nivelBadge.color}
                            stroke="#ffffff"
                            strokeWidth={2}
                          />
                          <text
                            x={bx}
                            y={by}
                            textAnchor="middle"
                            dominantBaseline="central"
                            fill="#ffffff"
                            fontSize={11}
                            fontWeight="800"
                          >
                            {act.order}
                          </text>
                        </>
                      ) : (
                        <>
                          <circle
                            cx={bx}
                            cy={by}
                            r={10.5}
                            fill="#ffffff"
                            stroke={nivelBadge.color}
                            strokeWidth={2.2}
                            filter="url(#diana-badge-shadow)"
                          />
                          <text
                            x={bx}
                            y={by}
                            textAnchor="middle"
                            dominantBaseline="central"
                            fill="#1e293b"
                            fontSize={9.5}
                            fontWeight="800"
                          >
                            {act.order}
                          </text>
                        </>
                      )}
                    </g>
                  );
                })}
              </svg>
            </div>
          </div>

          {/* Columna Derecha: Buscador de Habilidades + Tabla interactiva */}
          <div className="lg:col-span-6 flex flex-col gap-3">
            {/* Buscador de habilidades */}
            <div className="relative w-full">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                <MdSearch className="w-5 h-5" />
              </div>
              <input
                type="text"
                data-testid="diana-search-input"
                value={dianaSearchQuery}
                onChange={(e) => setDianaSearchQuery(e.target.value)}
                placeholder="Buscar habilidad: tema, información, inferencias, propósito..."
                className="w-full pl-10 pr-4 py-2.5 bg-slate-50/70 border border-slate-200 rounded-2xl text-xs sm:text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all shadow-2xs"
              />
              {dianaSearchQuery && (
                <button
                  type="button"
                  onClick={() => setDianaSearchQuery('')}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-600 text-xs font-bold"
                >
                  ✕
                </button>
              )}
            </div>

            {/* Tabla interactiva scrolleable */}
            <div className="border border-slate-200/90 rounded-2xl bg-white shadow-2xs overflow-hidden">
              <div className="max-h-[460px] overflow-y-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead className="sticky top-0 bg-slate-100/95 backdrop-blur-xs border-b border-slate-200 text-slate-600 text-[11px] font-bold uppercase tracking-wider z-10">
                    <tr>
                      <th className="py-2.5 px-3 text-center w-12">N.°</th>
                      <th className="py-2.5 px-3">Habilidad evaluada</th>
                      {activeEtapasList.map((et) => (
                        <th key={`th-${et.key}`} className="py-2.5 px-2 text-center w-12">
                          {et.key.toUpperCase()}
                        </th>
                      ))}
                      <th className="py-2.5 px-2 text-center w-28">Nivel</th>
                      <th className="py-2.5 px-2 text-center w-10">Δ</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {filteredList.map((act) => {
                      const isSelected = selectedDianaOrder === act.order;
                      const isHovered = hoveredDianaOrder === act.order;

                      // Tendencia de la fila
                      const firstVal = student.etapas[activeEtapasList[0]?.key]?.actuacionesResultados?.[act.order] ?? 1;
                      const lastVal = student.etapas[activeEtapasList[activeEtapasList.length - 1]?.key]?.actuacionesResultados?.[act.order] ?? 1;

                      // Nivel formativo acumulado según la configuración global (Opción A)
                      const superadasRow = activeEtapasList.filter(
                        (et) => student.etapas[et.key]?.actuacionesResultados?.[act.order] === 2
                      ).length;
                      const nivelRow = determinarNivelActuacion(
                        superadasRow,
                        activeEtapasList.length,
                        nivelesActuacionGlobal
                      );

                      return (
                        <tr
                          key={`diana-row-${subKey}-${act.order}`}
                          data-testid={`diana-row-${act.order}`}
                          onClick={() => setSelectedDianaOrder((prev) => (prev === act.order ? null : act.order))}
                          onMouseEnter={() => setHoveredDianaOrder(act.order)}
                          onMouseLeave={() => setHoveredDianaOrder(null)}
                          className={`cursor-pointer transition-colors duration-150 ${
                            isSelected
                              ? 'bg-blue-50/90 text-blue-950 font-medium'
                              : isHovered
                              ? 'bg-slate-50/90 text-slate-800'
                              : 'hover:bg-slate-50/60 text-slate-700'
                          }`}
                        >
                          {/* N.° */}
                          <td className="py-2 px-3 text-center">
                            <span
                              className={`inline-flex items-center justify-center w-6 h-6 rounded-full text-[11px] font-bold ${
                                isSelected
                                  ? 'bg-blue-600 text-white'
                                  : 'bg-slate-100 text-slate-700'
                              }`}
                            >
                              {act.order}
                            </span>
                          </td>

                          {/* Habilidad evaluada */}
                          <td className="py-2 px-3 text-slate-800 leading-snug">
                            <span>{act.actuacion || act.pregunta || `Actuación ${act.order}`}</span>
                          </td>

                          {/* Pills por etapa */}
                          {activeEtapasList.map((et, k) => {
                            const val = student.etapas[et.key]?.actuacionesResultados?.[act.order];
                            const etapaColor = getEtapaColorConfig(et.key, k);

                            if (val === 2) {
                              return (
                                <td key={`cell-${act.order}-${et.key}`} className="py-2 px-2 text-center">
                                  <span
                                    className="inline-flex items-center justify-center w-5 h-5 rounded-full text-[11px] font-bold text-white shadow-2xs"
                                    style={{ backgroundColor: etapaColor.border }}
                                    title={`${et.key.toUpperCase()}: Acertó (1/1)`}
                                  >
                                    {k + 1}
                                  </span>
                                </td>
                              );
                            }

                            if (val === 1) {
                              return (
                                <td key={`cell-${act.order}-${et.key}`} className="py-2 px-2 text-center">
                                  <span
                                    className="inline-flex items-center justify-center w-5 h-5 rounded-full text-[11px] font-bold text-white bg-rose-500 shadow-2xs"
                                    title={`${et.key.toUpperCase()}: No acertó (0/1)`}
                                  >
                                    0
                                  </span>
                                </td>
                              );
                            }

                            return (
                              <td key={`cell-${act.order}-${et.key}`} className="py-2 px-2 text-center text-slate-300">
                                -
                              </td>
                            );
                          })}

                          {/* Nivel de Logro (Opción A) */}
                          <td className="py-2 px-2 text-center">
                            <span
                              data-testid={`diana-table-nivel-${act.order}`}
                              className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10.5px] font-bold whitespace-nowrap shadow-2xs border"
                              style={{
                                backgroundColor: `${nivelRow.color}15`,
                                color: nivelRow.color,
                                borderColor: `${nivelRow.color}40`,
                              }}
                              title={`${nivelRow.nombre}: ${superadasRow} de ${activeEtapasList.length} evaluaciones superadas`}
                            >
                              <span
                                className="w-1.5 h-1.5 rounded-full shrink-0"
                                style={{ backgroundColor: nivelRow.color }}
                              />
                              <span>{nivelRow.nombre}</span>
                            </span>
                          </td>

                          {/* Δ Tendencia */}
                          <td className="py-2 px-2 text-center font-bold text-sm">
                            {lastVal > firstVal ? (
                              <span className="text-emerald-600 font-extrabold" title="Progreso">↗</span>
                            ) : lastVal < firstVal ? (
                              <span className="text-rose-500 font-extrabold" title="Retroceso">↘</span>
                            ) : (
                              <span className="text-slate-400 font-bold" title="Sin variación">→</span>
                            )}
                          </td>
                        </tr>
                      );
                    })}

                    {filteredList.length === 0 && (
                      <tr>
                        <td
                          colSpan={activeEtapasList.length + 4}
                          className="py-8 text-center text-slate-400 text-xs"
                        >
                          No se encontraron habilidades que coincidan con &ldquo;{dianaSearchQuery}&rdquo;.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="rounded-3xl border border-slate-200/90 bg-white text-slate-800 shadow-2xs transition-colors duration-200 overflow-hidden">
      {/* 1. Encabezado de Controles Compactos (Sin texto descriptivo redundante de Mapa Reticular) */}
      {!hideHeader && (
        <div className="p-2.5 sm:px-4 sm:py-3 border-b border-slate-100 bg-slate-50/50 flex items-center justify-end gap-2 flex-wrap">
          <DocenteRadarControls
            chartLayoutMode={chartLayoutMode}
            onLayoutModeSelect={handleLayoutModeSelect}
            orderDirection={effectiveOrderDirection}
            onOrderDirectionChange={handleOrderDirectionChange}
            splitInTwo={effectiveSplitInTwo}
            onToggleSplitInTwo={handleToggleSplitInTwo}
            showTable={showTable}
            onToggleShowTable={handleToggleTable}
            canResetPositions={
              chartLayoutMode === 'flotante' &&
              (effectiveSplitInTwo
                ? Object.keys(splitCardAdjustments).length > 0
                : Object.keys(cardAdjustments).length > 0)
            }
            onResetPositions={handleResetPositions}
            textScale={effectiveTextScale}
            onTextScaleChange={handleTextScaleSelect}
          />
        </div>
      )}

      {/* 2. Área del Gráfico Radar Reticular a Todo el Ancho (SVG Vectorial Nativo con Tarjetas Autoajustadas y Líneas Guía Amplias) */}
      <div className="p-2 sm:p-4 w-full flex flex-col items-center justify-center bg-white relative overflow-x-auto">
        <div
          data-testid="mock-radar-chart"
          className="w-full relative flex items-center justify-center min-h-[550px] overflow-visible"
        >
          {/* Estructura semántica accesible para lectores de pantalla y test runners */}
          <div className="sr-only">
            <span>Datasets: {datasets.length}</span>
            <span>Labels: {radarLabels.length}</span>
            <div data-testid="radar-point-labels">
              {radarLabels.map((l: any, i: number) => (
                <span key={i} data-testid={`radar-label-${i}`}>
                  {Array.isArray(l) ? l.join(' / ') : l}
                </span>
              ))}
            </div>
            {datasets.map((ds: any, idx: number) => (
              <div key={idx} data-testid={`radar-dataset-${idx}`}>
                <span>{ds.label}</span>
                <span>Values: {ds.data.join(',')}</span>
              </div>
            ))}
          </div>

          {/* Contenido Visual Condicional: Si splitInTwo está activo, divide en 2 paneles respetando el diseño columnas o flotante */}
          {effectiveSplitInTwo && orderedActuaciones.length > 1 ? (
            <div className="w-full space-y-8 py-2">
              {(() => {
                const midTotal = Math.ceil(orderedActuaciones.length / 2);
                const primeraMitad = orderedActuaciones.slice(0, midTotal);
                const segundaMitad = orderedActuaciones.slice(midTotal);
                const label1 = "PARTE 1 DE 2: ACTUACIONES " + (primeraMitad[0]?.order || 1) + " A " + (primeraMitad[primeraMitad.length - 1]?.order || "");
                const label2 = "PARTE 2 DE 2: ACTUACIONES " + (segundaMitad[0]?.order || "") + " A " + (segundaMitad[segundaMitad.length - 1]?.order || "");

                if (chartLayoutMode === "diana") {
                  return (
                    <>
                      <div className="bg-white rounded-3xl border border-slate-200/80 p-3 sm:p-5 shadow-2xs">
                        {renderDianaWheel(primeraMitad, "diana-p1", label1)}
                      </div>
                      {segundaMitad.length > 0 && (
                        <div className="bg-white rounded-3xl border border-slate-200/80 p-3 sm:p-5 shadow-2xs">
                          {renderDianaWheel(segundaMitad, "diana-p2", label2)}
                        </div>
                      )}
                    </>
                  );
                }

                if (chartLayoutMode === "flotante") {
                  return (
                    <>
                      <div className="bg-white rounded-3xl border border-slate-200/80 p-3 sm:p-5 shadow-2xs">
                        {renderFloatingRadar(primeraMitad, "flot-p1", label1, true)}
                      </div>
                      {segundaMitad.length > 0 && (
                        <div className="bg-white rounded-3xl border border-slate-200/80 p-3 sm:p-5 shadow-2xs">
                          {renderFloatingRadar(segundaMitad, "flot-p2", label2, true)}
                        </div>
                      )}
                    </>
                  );
                }

                return (
                  <>
                    <div className="bg-white rounded-3xl border border-slate-200/80 p-3 sm:p-5 shadow-2xs">
                      {renderRadarWithColumns(primeraMitad, "col-p1", label1)}
                    </div>
                    {segundaMitad.length > 0 && (
                      <div className="bg-white rounded-3xl border border-slate-200/80 p-3 sm:p-5 shadow-2xs">
                        {renderRadarWithColumns(segundaMitad, "col-p2", label2)}
                      </div>
                    )}
                  </>
                );
              })()}
            </div>
          ) : chartLayoutMode === "diana" ? (
            renderDianaWheel(orderedActuaciones, "full")
          ) : chartLayoutMode === "columnas" ? (
            renderRadarWithColumns(orderedActuaciones, "full")
          ) : (
            renderFloatingRadar(orderedActuaciones, "full", undefined, false)
          )}
        </div>
      </div>

      {/* 3. Card Unificado de Resumen de Evaluaciones */}
      <div className="px-4 sm:px-6 py-3.5 border-t border-slate-100 bg-slate-50/50">
        {activeEtapasList.length > 1 && (() => {
          const allIdentical = orderedActuaciones.every((act) => {
            const firstVal = student.etapas[activeEtapasList[0].key]?.actuacionesResultados?.[act.order] ?? 1;
            return activeEtapasList.every((et) => {
              const v = student.etapas[et.key]?.actuacionesResultados?.[act.order] ?? 1;
              return v === firstVal;
            });
          });
          if (allIdentical) {
            return (
              <div className="mb-2.5 px-3 py-1.5 rounded-xl bg-blue-50/80 border border-blue-200/70 text-blue-800 text-[11px] font-medium flex items-center justify-between gap-2">
                <span className="flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-blue-500 animate-pulse" />
                  <span>
                    Las {activeEtapasList.length} evaluaciones activas registran el mismo puntaje en todas las actuaciones (representadas en carriles paralelos visibles).
                  </span>
                </span>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-blue-100 text-blue-700 shrink-0">
                  Sin variación
                </span>
              </div>
            );
          }
          return null;
        })()}
        <div className="bg-white rounded-2xl border border-slate-200/80 p-3 sm:px-5 sm:py-3 shadow-2xs flex flex-wrap items-center justify-around gap-4 divide-y sm:divide-y-0 sm:divide-x divide-slate-100">
          {statsPorEtapa.map((st) => (
            <div
              key={st.key}
              onMouseEnter={() => setHoveredStageKey(st.key)}
              onMouseLeave={() => setHoveredStageKey(null)}
              className={`flex items-center gap-3 sm:px-4 py-1.5 sm:py-0 flex-1 min-w-[160px] justify-between sm:justify-start rounded-xl transition-all cursor-pointer ${
                hoveredStageKey === st.key ? 'bg-slate-50 scale-[1.02]' : ''
              }`}
            >
              <div className="flex items-center gap-2">
                <span
                  className="w-2.5 h-2.5 rounded-full shrink-0"
                  style={{ backgroundColor: st.activa ? st.colorConfig.border : '#cbd5e1' }}
                />
                <div className="min-w-0">
                  <span
                    className="text-xs font-bold block truncate"
                    style={{ color: st.activa ? st.colorConfig.border : '#94a3b8' }}
                  >
                    {st.label}
                  </span>
                  <span className="text-[11px] text-slate-500 font-medium">
                    {st.activa ? (
                      <>
                        <strong className="text-slate-800 font-bold">{st.totalLogradas}</strong> / {st.total} SÍ
                      </>
                    ) : (
                      <span className="text-slate-400 italic">No evaluado</span>
                    )}
                  </span>
                </div>
              </div>

              <span
                className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                  st.activa
                    ? `${st.colorConfig.lightBadgeBg} ${st.colorConfig.lightBadgeText} ${st.colorConfig.lightBadgeBorder}`
                    : 'bg-slate-100 text-slate-400 border-slate-200'
                } shrink-0 ml-auto`}
              >
                {st.activa ? `${st.porcentaje}%` : '—'}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* 4. Tabla Desplegable de Desglose Ítem por Ítem */}
      {showTable && (
        <div className="border-t border-slate-100 bg-white overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-slate-200/80 bg-slate-50 text-slate-600 text-[11px] font-bold uppercase tracking-wider">
                <th className="py-2.5 px-3 text-center w-12">#</th>
                <th className="py-2.5 px-4 min-w-[220px]">Actuación Pedagógica / Criterio</th>
                {activeEtapasList.map((et) => {
                  const colorConfig =
                    ETAPA_COLORS[et.key] || ETAPA_COLORS.edi;
                  return (
                    <th key={et.key} className="py-2.5 px-3 text-center w-28">
                      <span className="inline-flex items-center gap-1.5 justify-center">
                        <span
                          className="w-2 h-2 rounded-full inline-block shrink-0"
                          style={{ backgroundColor: colorConfig.border }}
                        />
                        <span style={{ color: colorConfig.border }} className="font-bold">
                          {et.label}
                        </span>
                      </span>
                    </th>
                  );
                })}
                <th className="py-2.5 px-4 text-center w-36">Evolución</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {orderedActuaciones.map((act) => {
                const resultados = activeEtapasList.map((et) => {
                  const estEtapa = student.etapas[et.key];
                  if (!estEtapa) return null;
                  return estEtapa.actuacionesResultados?.[act.order] ?? 1;
                });

                // Diagnóstico formativo de la actuación
                const validRes = resultados.filter((r) => r !== null);
                let estadoBadge = { text: 'Sin registro', color: 'bg-slate-500/20 text-slate-400' };

                if (validRes.length > 0) {
                  const ultimo = validRes[validRes.length - 1];
                  const primero = validRes[0];
                  if (ultimo === 2 && primero === 1) {
                    estadoBadge = {
                      text: '🚀 Conquistada',
                      color: 'bg-emerald-50 text-emerald-700 border border-emerald-200',
                    };
                  } else if (ultimo === 2 && primero === 2) {
                    estadoBadge = {
                      text: '⭐ Consolidada',
                      color: 'bg-blue-50 text-blue-700 border border-blue-200',
                    };
                  } else if (ultimo === 1 && primero === 1) {
                    estadoBadge = {
                      text: '⚠️ En Alerta',
                      color: 'bg-rose-50 text-rose-700 border border-rose-200',
                    };
                  } else {
                    estadoBadge = {
                      text: '🔄 En Refuerzo',
                      color: 'bg-amber-50 text-amber-700 border border-amber-200',
                    };
                  }
                }

                return (
                  <tr
                    key={act.order}
                    className="hover:bg-slate-50/80 transition-colors"
                  >
                    <td className="py-2.5 px-3 text-center font-bold text-slate-600">{act.order}</td>
                    <td className="py-2.5 px-4">
                      <span className="font-semibold block text-slate-800">{act.actuacion}</span>
                      {act.pregunta && act.pregunta !== act.actuacion && (
                        <span className="text-[11px] block mt-0.5 text-slate-500">
                          {act.pregunta}
                        </span>
                      )}
                    </td>

                    {activeEtapasList.map((et) => {
                      const estEtapa = student.etapas[et.key];
                      if (!estEtapa) {
                        return (
                          <td key={et.key} className="py-2.5 px-3 text-center text-slate-400">
                            -
                          </td>
                        );
                      }
                      const val = estEtapa.actuacionesResultados?.[act.order] ?? 1;
                      const esSi = val === 2;

                      return (
                        <td key={et.key} className="py-2.5 px-3 text-center">
                          <span
                            className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold ${
                              esSi
                                ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                : 'bg-rose-50 text-rose-700 border border-rose-200'
                            }`}
                          >
                            {esSi ? <MdCheckCircle className="w-3 h-3 text-emerald-600" /> : <MdCancel className="w-3 h-3 text-rose-500" />}
                            {esSi ? 'SÍ (2)' : 'NO (1)'}
                          </span>
                        </td>
                      );
                    })}

                    <td className="py-2.5 px-4 text-center">
                      <span
                        className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-bold ${estadoBadge.color}`}
                      >
                        {estadoBadge.text}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};
