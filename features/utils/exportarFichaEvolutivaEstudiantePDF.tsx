import React from 'react';
import {
  Document,
  Page,
  View,
  Text,
  Svg,
  Polygon,
  Circle,
  Line,
  Rect,
  Path,
  G,
  Image,
  StyleSheet,
  pdf,
} from '@react-pdf/renderer';
import { converSeccion, getGradoTexto } from '../../fuctions/regiones';
import { ActuacionCatalogoItem } from '../../components/reportes/estudiante/useDocenteEvolucionEstudiantes';
import {
  loadStoredCardAdjustments,
  getCoincidentRadiusOffset,
  describeAnnularSector,
  getEtapaColorConfig,
  loadStoredCenterChartType,
  RadarCenterChartType,
} from '../../components/reportes/estudiante/DocenteActuacionesRadarChart';
import {
  determinarNivelActuacion,
  DEFAULT_NIVELES_ACTUACIONES,
} from '../hooks/useNivelesActuacionesConfig';

export interface EtapaHistorialEstudiante {
  etapaKey: string;
  label: string;
  nombreEvaluacion?: string;
  puntaje: number;
  maxPuntaje: number;
  nivel: string;
  nivelColor?: string;
  respuestasCorrectas: number;
  totalPreguntas: number;
  porcentaje: number;
  fecha?: string;
}

export interface EstudianteEvolutivoPDFProps {
  estudiante: {
    dni: string;
    nombres: string;
    apellidos: string;
    seccion?: string | number;
    genero?: string;
    fotoUrl?: string;
    puntaje?: number;
    maxPuntaje?: number;
    nivel?: string;
  };
  evaluacionActual: {
    id?: string;
    nombre?: string;
    grado?: number | string;
    añoDelExamen?: number | string;
    mesDelExamen?: number | string;
  };
  nombreDocente: string;
  fotoDocenteUrl?: string;
  nombreColegio: string;
  historialEtapas: EtapaHistorialEstudiante[];
  deltaPuntaje: number;
  estadoTrayectoria: 'superacion' | 'estable' | 'alerta';
  promedioAula: number;
  diferenciaConAula: number;
  // Código QR para descarga digital de la ficha por el estudiante o padre
  qrCodeDataUrl?: string;
  qrVerificationUrl?: string;
  // Propiedades para el gráfico Radar Vectorial
  catalogoActuaciones?: ActuacionCatalogoItem[];
  etapasConfiguradas?: { key: string; id: string; label: string; order: number }[];
  studentEtapas?: Record<
    string,
    {
      etapaKey: string;
      label: string;
      puntaje: number;
      actuacionesResultados?: Record<number, 1 | 2>;
    }
  >;
  activeStages?: Record<string, boolean>;
  chartLayoutMode?: 'columnas' | 'flotante' | 'dividido' | 'diana';
  centerChartType?: RadarCenterChartType;
  splitInTwo?: boolean;
  orderDirection?: 'horario' | 'antihorario';
  cardAdjustments?: Record<
    number,
    {
      dx: number;
      dy: number;
      customW?: number;
      customH?: number;
      x?: number;
      y?: number;
    }
  >;
  textScale?: number | string;
}

/**
 * Normaliza el factor de escala de tipografía para el documento PDF:
 * Soporta números directos (ej: 1.0, 1.15, 1.30, 1.45) y nombres clave ('normal', 'mediano', 'grande', 'extra').
 * Si no se proporciona valor, intenta recuperar la preferencia guardada en localStorage o devuelve 1.0.
 */
export function parsePdfTextScale(scale?: number | string): number {
  if (typeof scale === 'number' && !isNaN(scale) && scale > 0) return scale;
  if (typeof scale === 'string') {
    if (scale === 'normal') return 1.0;
    if (scale === 'mediano') return 1.15;
    if (scale === 'grande') return 1.30;
    if (scale === 'extra') return 1.45;
    const parsed = parseFloat(scale);
    if (!isNaN(parsed) && parsed > 0) return parsed;
  }
  if (typeof window !== 'undefined') {
    try {
      const stored = window.localStorage?.getItem('eva_radar_text_scale');
      if (stored) return parsePdfTextScale(stored);
    } catch {
      // ignore
    }
  }
  return 1.0;
}

// Paleta de colores oficial EVA para las etapas de evaluación
export const PDF_ETAPA_COLORS: Record<
  string,
  {
    border: string;
    bg: string;
    fillOpacity: number;
    label: string;
  }
> = {
  edi: {
    border: '#2563eb', // Azul oficial EVA
    bg: '#2563eb',
    fillOpacity: 0.07,
    label: 'EDI (Diagnóstica)',
  },
  ep1: {
    border: '#f59e0b', // Ámbar oficial EVA
    bg: '#f59e0b',
    fillOpacity: 0.07,
    label: 'EP1 (Progresiva 1)',
  },
  ep2: {
    border: '#10b981', // Verde esmeralda oficial EVA
    bg: '#10b981',
    fillOpacity: 0.12,
    label: 'EP2 (Progresiva 2)',
  },
};

/**
 * Divide el texto completo de cada actuación pedagógica en renglones sin truncar palabras
 * para visualización 100% nítida y completa en el gráfico reticular vectorial.
 */
export function wrapTextForPdf(
  order: number,
  text: string | undefined,
  totalCount: number
): string[] {
  const rawText = (text || `Actuación ${order}`).trim();
  const fullText = `${order}. ${rawText}`;

  let maxChars = 22;
  if (totalCount <= 6) maxChars = 24;
  else if (totalCount <= 10) maxChars = 20;
  else if (totalCount <= 16) maxChars = 16;
  else maxChars = 14;

  if (fullText.length <= maxChars) return [fullText];

  const words = fullText.split(/\s+/);
  const lines: string[] = [];
  let current = '';

  for (const w of words) {
    if (!current) {
      current = w;
    } else if (current.length + 1 + w.length <= maxChars) {
      current += ' ' + w;
    } else {
      lines.push(current);
      current = w;
    }
  }
  if (current) lines.push(current);
  return lines;
}

/**
 * Algoritmo de cálculo dinámico del tamaño de la tarjeta y autoajuste del texto para PDF:
 * Si el texto es extenso, agranda automáticamente el ancho y la altura del contenedor
 * dentro del lienzo apaisado para que todo el contenido quepa con nitidez vectorial.
 */
export function calculateDynamicPdfCard(
  order: number,
  text: string | undefined,
  maxAvailableWidth: number = 205,
  textScale: number = 1.0
): {
  boxW: number;
  boxH: number;
  fontSize: number;
  lines: string[];
  lineHeight: number;
} {
  const effectiveScale =
    typeof textScale === 'number' && !isNaN(textScale) && textScale > 0 ? textScale : 1.0;
  const rawText = (text || `Actuación ${order}`).trim();
  const fullText = `${order}. ${rawText}`;
  const charCount = fullText.length;

  let baseBoxW = 155;
  if (charCount > 140) {
    baseBoxW = Math.min(205, maxAvailableWidth);
  } else if (charCount > 85) {
    baseBoxW = Math.min(180, maxAvailableWidth);
  } else {
    baseBoxW = 155;
  }
  const targetBoxW = Math.min(
    Math.round(baseBoxW * Math.min(effectiveScale, 1.25)),
    Math.max(maxAvailableWidth, 230)
  );

  let baseFontSize = 7.2;
  if (charCount > 150) baseFontSize = 6.2;
  else if (charCount > 90) baseFontSize = 6.8;
  else baseFontSize = 7.2;

  const targetFontSize = Math.round(baseFontSize * effectiveScale * 10) / 10;

  const padX = 7;
  const availW = Math.max(targetBoxW - padX * 2, 50);
  const charWidth = targetFontSize * 0.52;
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

  const lineHeight = Math.round(targetFontSize * 1.25 * 10) / 10;
  const textHeight = lines.length * lineHeight;
  const padY = 8;
  const targetBoxH = Math.max(Math.round(textHeight + padY), 28);

  return {
    boxW: targetBoxW,
    boxH: targetBoxH,
    fontSize: targetFontSize,
    lines,
    lineHeight,
  };
}

/**
 * Algoritmo de autoajuste del texto al contenedor para PDF vectorial:
 * Calcula dinámicamente el tamaño de fuente y partición de renglones para
 * que el texto se adapte sin tocar los bordes de la tarjeta, respetando textScale.
 */
export function fitTextInPdfBox(
  order: number,
  text: string | undefined,
  boxW: number,
  boxH: number,
  textScale: number = 1.0
): { fontSize: number; lines: string[]; lineHeight: number } {
  const effectiveScale =
    typeof textScale === 'number' && !isNaN(textScale) && textScale > 0 ? textScale : 1.0;
  const fullText = `${order}. ${(text || `Actuación ${order}`).trim()}`;
  const padX = 8;
  const availW = Math.max(boxW - padX * 2, 50);

  const candidateFontSizes = [8.5, 7.8, 7.2, 6.6, 6.0, 5.5].map(
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

    const lineHeight = Math.round(fontSize * 1.22 * 10) / 10;
    const totalH = lines.length * lineHeight;

    if (totalH <= boxH - 4 && lines.length <= 4) {
      return { fontSize, lines, lineHeight };
    }
  }

  const minFontSize = Math.round(5.5 * effectiveScale * 10) / 10;
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

  return {
    fontSize: minFontSize,
    lines,
    lineHeight: Math.round(minFontSize * 1.22 * 10) / 10,
  };
}

// Estilos del documento PDF en orientación Horizontal (Landscape)
const styles = StyleSheet.create({
  page: {
    paddingVertical: 5,
    paddingHorizontal: 16,
    fontFamily: 'Helvetica',
    fontSize: 8,
    color: '#1e293b',
    backgroundColor: '#ffffff',
  },
  headerContainer: {
    width: '100%',
    marginBottom: 2,
  },
  titleContainer: {
    width: '100%',
    alignItems: 'center',
    justifyContent: 'center',
    paddingBottom: 2,
    marginBottom: 2,
    borderBottomWidth: 0.6,
    borderBottomColor: '#cbd5e1',
  },
  titleMain: {
    fontSize: 10.5,
    fontFamily: 'Helvetica-Bold',
    color: '#0f172a',
    letterSpacing: 0.4,
    textAlign: 'center',
  },
  titleSub: {
    fontSize: 6.5,
    fontFamily: 'Helvetica',
    color: '#475569',
    marginTop: 1,
    textAlign: 'center',
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    width: '100%',
    paddingBottom: 2,
    marginBottom: 2,
    borderBottomWidth: 0.8,
    borderBottomColor: '#e2e8f0',
  },
  headerSideBlock: {
    flexDirection: 'row',
    alignItems: 'center',
    width: '48%',
  },
  photoCarnet: {
    width: 71,
    height: 85,
    borderWidth: 0.8,
    borderColor: '#cbd5e1',
    borderRadius: 3,
    overflow: 'hidden',
    backgroundColor: '#f8fafc',
    marginRight: 10,
  },
  photoImage: {
    width: '100%',
    height: '100%',
    objectFit: 'cover',
  },
  photoCarnetPlaceholder: {
    width: 71,
    height: 85,
    borderWidth: 0.8,
    borderColor: '#cbd5e1',
    borderRadius: 3,
    backgroundColor: '#f8fafc',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
    paddingVertical: 2,
  },
  photoPlaceholderText: {
    fontSize: 6.5,
    fontFamily: 'Helvetica-Bold',
    color: '#94a3b8',
    marginTop: 2,
    textAlign: 'center',
  },
  qrContainer: {
    width: 58,
    borderWidth: 0.6,
    borderColor: '#cbd5e1',
    borderRadius: 3,
    backgroundColor: '#ffffff',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 2.5,
    paddingHorizontal: 2,
    marginLeft: 6,
    flexShrink: 0,
  },
  qrImage: {
    width: 46,
    height: 46,
  },
  qrTitle: {
    fontSize: 5.5,
    fontFamily: 'Helvetica-Bold',
    color: '#0f172a',
    marginTop: 1.5,
    textAlign: 'center',
  },
  qrSubtitle: {
    fontSize: 4.8,
    fontFamily: 'Helvetica',
    color: '#64748b',
    marginTop: 0.5,
    textAlign: 'center',
  },
  personInfoCol: {
    flex: 1,
    flexDirection: 'column',
    justifyContent: 'center',
  },
  personTitleRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    marginBottom: 3,
  },
  personLabel: {
    fontSize: 7.8,
    fontFamily: 'Helvetica-Bold',
    color: '#334155',
  },
  personValue: {
    fontSize: 7.8,
    fontFamily: 'Helvetica-Bold',
    color: '#0f172a',
    marginLeft: 3,
  },
  personSubRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 2.5,
  },
  personSubLabel: {
    fontSize: 7.0,
    fontFamily: 'Helvetica-Bold',
    color: '#64748b',
  },
  personSubValue: {
    fontSize: 7.0,
    fontFamily: 'Helvetica',
    color: '#1e293b',
    marginLeft: 3,
  },
  personInlineRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    justifyContent: 'space-between',
    width: '100%',
    marginBottom: 2,
  },
  personInlineColLeft: {
    flexDirection: 'row',
    alignItems: 'baseline',
    flex: 1,
    marginRight: 6,
  },
  personInlineColRight: {
    flexDirection: 'row',
    alignItems: 'baseline',
    flexShrink: 0,
  },
  miniTableContainer: {
    width: '100%',
    borderWidth: 0.6,
    borderColor: '#cbd5e1',
    borderRadius: 2,
    marginTop: 2.5,
    backgroundColor: '#ffffff',
  },
  miniTableHeaderRow: {
    flexDirection: 'row',
    borderBottomWidth: 0.6,
    borderBottomColor: '#cbd5e1',
    backgroundColor: '#ffffff',
  },
  miniTableNivelRow: {
    flexDirection: 'row',
    borderBottomWidth: 0.5,
    borderBottomColor: '#e2e8f0',
    backgroundColor: '#ffffff',
  },
  miniTablePuntajeRow: {
    flexDirection: 'row',
    backgroundColor: '#ffffff',
  },
  miniTableCell: {
    flex: 1,
    paddingHorizontal: 2,
    paddingVertical: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
    borderRightWidth: 0.5,
    borderRightColor: '#e2e8f0',
  },
  miniTableCellLast: {
    borderRightWidth: 0,
  },
  miniTableHeaderText: {
    fontSize: 6.8,
    fontFamily: 'Helvetica-Bold',
    color: '#0f172a',
    textAlign: 'center',
  },
  miniTableNivelText: {
    fontSize: 6.0,
    fontFamily: 'Helvetica',
    color: '#334155',
    textAlign: 'center',
  },
  miniTablePuntajeText: {
    fontSize: 6.5,
    fontFamily: 'Helvetica-Bold',
    color: '#0f172a',
    textAlign: 'center',
  },
  radarContainer: {
    backgroundColor: '#ffffff',
    paddingVertical: 0,
    paddingHorizontal: 0,
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
  },
  radarContainerFlotante: {
    backgroundColor: '#ffffff',
    paddingVertical: 0,
    paddingHorizontal: 0,
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
  },
  radarLegendContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 1,
    paddingBottom: 0,
    paddingHorizontal: 8,
  },
  radarLegendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: 8,
    marginVertical: 1,
  },
  radarLegendSwatch: {
    width: 14,
    height: 7,
    borderRadius: 1.5,
    marginRight: 4,
  },
  radarLegendText: {
    fontSize: 7.2,
    fontFamily: 'Helvetica-Bold',
    color: '#334155',
  },
  columnsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    width: '100%',
    paddingHorizontal: 0,
    paddingVertical: 1,
  },
  lateralColumn: {
    flex: 1,
    flexDirection: 'column',
    justifyContent: 'center',
  },
  columnHeader: {
    fontSize: 7.2,
    fontFamily: 'Helvetica-Bold',
    color: '#475569',
    borderBottomWidth: 0.8,
    borderBottomColor: '#cbd5e1',
    paddingBottom: 2.5,
    marginBottom: 4,
  },
  compactCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: '#ffffff',
  },
  cardBadge: {
    borderRadius: 2.5,
    backgroundColor: '#1e40af',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 3.5,
    marginTop: 0.5,
  },
  cardBadgeText: {
    fontFamily: 'Helvetica-Bold',
    color: '#ffffff',
  },
  cardActuacionText: {
    fontFamily: 'Helvetica',
    color: '#1e293b',
    flex: 1,
  },
  radarCenterColumn: {
    width: 360,
    marginHorizontal: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  // Estilos dedicados para el Diseño Diana Polar en PDF
  dianaContainer: {
    backgroundColor: '#ffffff',
    width: '100%',
    paddingVertical: 0,
    paddingHorizontal: 0,
  },
  dianaSummaryBlock: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#f8fafc',
    borderWidth: 0.6,
    borderColor: '#e2e8f0',
    borderRadius: 3,
    paddingVertical: 2,
    paddingHorizontal: 6,
    marginBottom: 3.5,
    width: '100%',
  },
  dianaSummaryCardsRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  dianaStageCard: {
    backgroundColor: '#ffffff',
    borderWidth: 0.6,
    borderColor: '#cbd5e1',
    borderRadius: 2.5,
    paddingVertical: 1.5,
    paddingHorizontal: 4,
    alignItems: 'center',
    minWidth: 48,
    marginRight: 4,
    borderTopWidth: 2.2,
  },
  dianaStageTitle: {
    fontSize: 5.2,
    fontFamily: 'Helvetica-Bold',
    color: '#475569',
  },
  dianaStageScore: {
    fontSize: 9,
    fontFamily: 'Helvetica-Bold',
    color: '#0f172a',
    marginVertical: 0.5,
  },
  dianaStagePct: {
    fontSize: 4.8,
    fontFamily: 'Helvetica-Bold',
    color: '#2563eb',
  },
  dianaTrayectoriaText: {
    fontSize: 6,
    fontFamily: 'Helvetica',
    color: '#475569',
  },
  dianaColumnsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    width: '100%',
  },
  dianaLeftColumn: {
    width: 335,
    alignItems: 'center',
    justifyContent: 'flex-start',
  },
  dianaRightColumn: {
    flex: 1,
    marginLeft: 8,
    borderWidth: 0.6,
    borderColor: '#cbd5e1',
    borderRadius: 2.5,
    backgroundColor: '#ffffff',
    overflow: 'hidden',
  },
  dianaTableHeader: {
    flexDirection: 'row',
    backgroundColor: '#f1f5f9',
    borderBottomWidth: 0.6,
    borderBottomColor: '#cbd5e1',
    paddingVertical: 2.5,
    paddingHorizontal: 3,
    alignItems: 'center',
  },
  dianaTableHeaderText: {
    fontSize: 6.5,
    fontFamily: 'Helvetica-Bold',
    color: '#475569',
    textAlign: 'center',
  },
  dianaTableRow: {
    flexDirection: 'row',
    borderBottomWidth: 0.4,
    borderBottomColor: '#f1f5f9',
    paddingHorizontal: 3,
    alignItems: 'center',
  },
  dianaBadgeCircle: {
    borderRadius: 5,
    backgroundColor: '#f1f5f9',
    alignItems: 'center',
    justifyContent: 'center',
  },
  dianaPillNivel: {
    borderRadius: 2.5,
    paddingVertical: 0.8,
    paddingHorizontal: 3,
    borderWidth: 0.5,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dianaLegendRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 1.5,
  },
  dianaLegendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: 3.5,
    marginVertical: 0.8,
  },
  dianaLegendDot: {
    width: 5,
    height: 5,
    borderRadius: 2.5,
    marginRight: 2.5,
  },
  dianaLegendText: {
    fontSize: 5.5,
    fontFamily: 'Helvetica-Bold',
    color: '#475569',
  },
});

/**
 * Cabecera institucional sobria y profesional con fotos carnet y metadatos
 * de identificación (estudiante y docente), optimizada para impresión (fondo 100% blanco).
 */
const HeaderIdentificacionPDF: React.FC<{
  estudiante: EstudianteEvolutivoPDFProps['estudiante'];
  evaluacionActual: EstudianteEvolutivoPDFProps['evaluacionActual'];
  nombreDocente: string;
  fotoDocenteUrl?: string;
  nombreColegio: string;
  subtituloParte?: string;
  historialEtapas?: EtapaHistorialEstudiante[];
  etapasConfiguradas?: { key: string; id: string; label: string; order: number }[];
  studentEtapas?: Record<string, any>;
  qrCodeDataUrl?: string;
  qrVerificationUrl?: string;
  catalogoActuaciones?: ActuacionCatalogoItem[];
  chartLayoutMode?: string;
}> = ({
  estudiante,
  evaluacionActual,
  nombreDocente,
  fotoDocenteUrl,
  nombreColegio,
  subtituloParte,
  historialEtapas = [],
  etapasConfiguradas = [],
  studentEtapas = {},
  qrCodeDataUrl,
  catalogoActuaciones,
  chartLayoutMode,
}) => {
  const gradoTexto = evaluacionActual?.grado
    ? getGradoTexto(evaluacionActual.grado)
    : 'Grado no esp.';
  const seccionTexto =
    estudiante?.seccion !== undefined
      ? (converSeccion(Number(estudiante.seccion)) || String(estudiante.seccion))
      : '';
  const gradoSeccion = seccionTexto
    ? `${gradoTexto} "${seccionTexto}"`
    : gradoTexto;
  const nombreEstudiante = estudiante?.nombres
    ? `${estudiante.nombres} ${estudiante.apellidos || ''}`.trim()
    : 'Estudiante';

  // Helper para obtener el código o etiqueta corta de la etapa (EDI, EP1, EP2, etc.)
  const getEtapaHeaderLabel = (cfgKey: string, cfgLabel?: string) => {
    if (cfgKey) {
      const upperKey = cfgKey.toUpperCase();
      if (upperKey === 'EDI' || upperKey === 'EP1' || upperKey === 'EP2') {
        return upperKey;
      }
    }
    if (cfgLabel) {
      const match = cfgLabel.match(/^(EDI|EP1|EP2)/i);
      if (match) return match[1].toUpperCase();
      return cfgLabel.length > 10 ? cfgLabel.substring(0, 10) : cfgLabel;
    }
    return (cfgKey || 'ETAPA').toUpperCase();
  };

  // Helper para contar aciertos de una etapa dada (para mostrar en la tabla de estudiante)
  const getEtapaAciertos = (
    etapaKey: string,
    etapaObj?: {
      actuacionesResultados?: Record<number, 1 | 2>;
      respuestasCorrectas?: number;
      totalPreguntas?: number;
      porcentaje?: number;
    }
  ) => {
    // 1. Si tenemos catálogo de actuaciones y resultados de actuaciones por número de orden:
    if (catalogoActuaciones && catalogoActuaciones.length > 0) {
      const actResults =
        etapaObj?.actuacionesResultados ||
        studentEtapas?.[etapaKey]?.actuacionesResultados;
      if (actResults && Object.keys(actResults).length > 0) {
        let aciertos = 0;
        catalogoActuaciones.forEach((act) => {
          if (actResults[act.order] === 2) {
            aciertos++;
          }
        });
        const total = catalogoActuaciones.length;
        const pct = Math.round((aciertos / total) * 100);
        return {
          aciertos,
          total,
          pct,
          texto: `${aciertos}/${total}`,
          subtexto: `${pct}% aciertos`,
        };
      }
    }

    // 2. Si el historial o el objeto tiene respuestasCorrectas y totalPreguntas:
    if (
      etapaObj?.respuestasCorrectas !== undefined &&
      etapaObj?.totalPreguntas !== undefined &&
      etapaObj.totalPreguntas > 0
    ) {
      const aciertos = etapaObj.respuestasCorrectas;
      const total = etapaObj.totalPreguntas;
      const pct =
        etapaObj.porcentaje !== undefined
          ? Math.round(etapaObj.porcentaje)
          : Math.round((aciertos / total) * 100);
      return {
        aciertos,
        total,
        pct,
        texto: `${aciertos}/${total}`,
        subtexto: `${pct}% aciertos`,
      };
    }

    return null;
  };

  // Construir columnas de la mini-tabla con todas las evaluaciones
  interface ColumnaEtapaTabla {
    key: string;
    label: string;
    nivel: string;
    puntajeTexto: string;
    aciertosTexto?: string;
    aciertosSubtexto?: string;
  }

  let etapasTabla: ColumnaEtapaTabla[] = [];

  if (etapasConfiguradas && etapasConfiguradas.length > 0) {
    const ordenadas = [...etapasConfiguradas].sort(
      (a, b) => (a.order ?? 0) - (b.order ?? 0)
    );
    etapasTabla = ordenadas.map((cfg) => {
      const histItem = (historialEtapas || []).find((h) => h.etapaKey === cfg.key);
      const studentEtapa = studentEtapas?.[cfg.key];
      const etapaData = studentEtapa || histItem;

      const rawPuntaje = etapaData?.puntaje;
      const tienePuntajeEtapa =
        rawPuntaje !== undefined && rawPuntaje !== null && !isNaN(Number(rawPuntaje));

      const nivelRaw = (etapaData?.nivel || '').trim();
      const nivelValido =
        nivelRaw &&
        nivelRaw.toLowerCase() !== 'sin clasificar' &&
        nivelRaw !== '-';

      const aciertosInfo = getEtapaAciertos(cfg.key, etapaData || studentEtapas?.[cfg.key]);

      return {
        key: cfg.key,
        label: getEtapaHeaderLabel(cfg.key, cfg.label),
        nivel: nivelValido ? nivelRaw : '—',
        puntajeTexto: tienePuntajeEtapa ? `${rawPuntaje} pts` : '—',
        aciertosTexto: aciertosInfo?.texto,
        aciertosSubtexto: aciertosInfo?.subtexto,
      };
    });
  } else if (historialEtapas && historialEtapas.length > 0) {
    etapasTabla = historialEtapas.map((hist) => {
      const histKey = hist?.etapaKey || '';
      const nivelRaw = (hist.nivel || '').trim();
      const nivelValido =
        nivelRaw &&
        nivelRaw.toLowerCase() !== 'sin clasificar' &&
        nivelRaw !== '-';
      const tienePuntajeEtapa =
        hist.puntaje !== undefined &&
        hist.puntaje !== null &&
        !isNaN(Number(hist.puntaje));

      const aciertosInfo = getEtapaAciertos(
        histKey,
        studentEtapas?.[histKey] || hist
      );

      return {
        key: histKey,
        label: getEtapaHeaderLabel(histKey, hist.label),
        nivel: nivelValido ? nivelRaw : '—',
        puntajeTexto: tienePuntajeEtapa ? `${hist.puntaje} pts` : '—',
        aciertosTexto: aciertosInfo?.texto,
        aciertosSubtexto: aciertosInfo?.subtexto,
      };
    });
  } else if (estudiante?.puntaje !== undefined || estudiante?.nivel) {
    const nivelRaw = (estudiante.nivel || '').trim();
    const nivelValido =
      nivelRaw &&
      nivelRaw.toLowerCase() !== 'sin clasificar' &&
      nivelRaw !== '-';
    const tienePuntajeEtapa =
      estudiante.puntaje !== undefined &&
      estudiante.puntaje !== null &&
      !isNaN(Number(estudiante.puntaje));

    const aciertosInfo = getEtapaAciertos('actual', {
      actuacionesResultados: (estudiante as any)?.actuacionesResultados || studentEtapas?.['actual']?.actuacionesResultados,
      respuestasCorrectas: (estudiante as any)?.respuestasCorrectas,
      totalPreguntas: (estudiante as any)?.totalPreguntas,
    });

    etapasTabla = [
      {
        key: 'actual',
        label: evaluacionActual?.nombre
          ? (evaluacionActual.nombre.length > 12
              ? evaluacionActual.nombre.substring(0, 12)
              : evaluacionActual.nombre)
          : 'Evaluación',
        nivel: nivelValido ? nivelRaw : '—',
        puntajeTexto: tienePuntajeEtapa ? `${estudiante.puntaje} pts` : '—',
        aciertosTexto: aciertosInfo?.texto,
        aciertosSubtexto: aciertosInfo?.subtexto,
      },
    ];
  }

  return (
    <View style={styles.headerContainer} wrap={false}>
      {/* Título Principal Institucional (Puro texto sin fondos de color, ideal para impresión) */}
      <View style={styles.titleContainer}>
        <Text style={styles.titleMain}>
          INFORME DE PROGRESO Y EVOLUCIÓN DEL ESTUDIANTE
        </Text>
        <Text style={styles.titleSub}>
          Monitoreo Longitudinal de Actuaciones Pedagógicas y Niveles de Logro
        </Text>
      </View>

      <View style={styles.headerRow}>
        {/* Bloque Izquierdo: Estudiante */}
        <View style={styles.headerSideBlock}>
          {estudiante?.fotoUrl ? (
            <View style={styles.photoCarnet}>
              <Image src={estudiante.fotoUrl} style={styles.photoImage} />
            </View>
          ) : (
            <View style={styles.photoCarnetPlaceholder}>
              <Svg width={22} height={22} viewBox="0 0 24 24">
                <Circle cx={12} cy={8} r={4} fill="#cbd5e1" />
                <Path
                  d="M4 20c0-4.4 3.6-8 8-8s8 3.6 8 8"
                  fill="none"
                  stroke="#cbd5e1"
                  strokeWidth={2}
                />
              </Svg>
              <Text style={styles.photoPlaceholderText}>FOTO CARNET</Text>
              <Text style={[styles.photoPlaceholderText, { fontSize: 5.5, marginTop: 1 }]}>
                2.5 × 3.0 cm
              </Text>
            </View>
          )}
          <View style={styles.personInfoCol}>
            {/* Fila 1: Estudiante y DNI juntos */}
            <View style={styles.personInlineRow}>
              <View style={styles.personInlineColLeft}>
                <Text style={styles.personLabel}>Estudiante:</Text>
                <Text style={styles.personValue}>{nombreEstudiante}</Text>
              </View>
              {estudiante?.dni && (
                <View style={styles.personInlineColRight}>
                  <Text style={styles.personSubLabel}>DNI:</Text>
                  <Text style={styles.personSubValue}>{estudiante.dni}</Text>
                </View>
              )}
            </View>

            {/* Fila 2: Grado e Institución juntos */}
            <View style={styles.personInlineRow}>
              <View
                style={{
                  flexDirection: 'row',
                  alignItems: 'baseline',
                  width: '38%',
                  marginRight: 6,
                }}
              >
                <Text style={styles.personSubLabel}>Grado:</Text>
                <Text style={styles.personSubValue}>{gradoSeccion}</Text>
              </View>
              <View
                style={{
                  flexDirection: 'row',
                  alignItems: 'baseline',
                  flex: 1,
                }}
              >
                <Text style={styles.personSubLabel}>Institución:</Text>
                <Text style={styles.personSubValue}>
                  {nombreColegio || 'I.E. Sin registro'}
                </Text>
              </View>
            </View>

            {/* Fila 3: Mini-tabla compacta con todas las evaluaciones */}
            {etapasTabla.length > 0 && (
              <View style={styles.miniTableContainer}>
                {/* Cabecera de la tabla con los nombres/códigos de evaluación */}
                <View style={styles.miniTableHeaderRow}>
                  {etapasTabla.map((col, idx) => (
                    <View
                      key={`th-${col.key}`}
                      style={
                        idx === etapasTabla.length - 1
                          ? [styles.miniTableCell, styles.miniTableCellLast]
                          : styles.miniTableCell
                      }
                    >
                      <Text style={styles.miniTableHeaderText}>{col.label}</Text>
                    </View>
                  ))}
                </View>

                {/* Fila 1: Nivel de Logro */}
                <View style={styles.miniTableNivelRow}>
                  {etapasTabla.map((col, idx) => (
                    <View
                      key={`tb-nivel-${col.key}`}
                      style={
                        idx === etapasTabla.length - 1
                          ? [styles.miniTableCell, styles.miniTableCellLast]
                          : styles.miniTableCell
                      }
                    >
                      <Text style={styles.miniTableNivelText}>{col.nivel}</Text>
                    </View>
                  ))}
                </View>

                {/* Fila 2: Puntaje obtenido o Aciertos */}
                <View style={styles.miniTablePuntajeRow}>
                  {etapasTabla.map((col, idx) => (
                    <View
                      key={`tb-pts-${col.key}`}
                      style={
                        idx === etapasTabla.length - 1
                          ? [styles.miniTableCell, styles.miniTableCellLast]
                          : styles.miniTableCell
                      }
                    >
                      {col.aciertosTexto ? (
                        <View style={{ alignItems: 'center' }}>
                          <Text style={styles.miniTablePuntajeText}>
                            {col.aciertosTexto}
                          </Text>
                          <Text
                            style={{
                              fontSize: 5.2,
                              fontFamily: 'Helvetica-Bold',
                              color: '#2563eb',
                              marginTop: 0.5,
                            }}
                          >
                            {col.aciertosSubtexto || ''}
                          </Text>
                        </View>
                      ) : (
                        <Text style={styles.miniTablePuntajeText}>
                          {col.puntajeTexto}
                        </Text>
                      )}
                    </View>
                  ))}
                </View>
              </View>
            )}
          </View>
        </View>

      {/* Bloque Derecho: Docente y Evaluación */}
      <View style={styles.headerSideBlock}>
        {fotoDocenteUrl ? (
          <View style={styles.photoCarnet}>
            <Image src={fotoDocenteUrl} style={styles.photoImage} />
          </View>
        ) : (
          <View style={styles.photoCarnetPlaceholder}>
            <Svg width={22} height={22} viewBox="0 0 24 24">
              <Circle cx={12} cy={8} r={4} fill="#cbd5e1" />
              <Path
                d="M4 20c0-4.4 3.6-8 8-8s8 3.6 8 8"
                fill="none"
                stroke="#cbd5e1"
                strokeWidth={2}
              />
            </Svg>
            <Text style={styles.photoPlaceholderText}>FOTO CARNET</Text>
            <Text style={[styles.photoPlaceholderText, { fontSize: 5.5, marginTop: 1 }]}>
              2.5 × 3.0 cm
            </Text>
          </View>
        )}
        <View style={styles.personInfoCol}>
          <View style={styles.personTitleRow}>
            <Text style={styles.personLabel}>Docente:</Text>
            <Text style={styles.personValue}>{nombreDocente || 'Docente de Aula'}</Text>
          </View>
          <View style={styles.personSubRow}>
            <Text style={styles.personSubLabel}>Evaluación:</Text>
            <Text style={styles.personSubValue}>
              {evaluacionActual?.nombre || 'Evaluación de Aprendizajes'}
            </Text>
          </View>
          <View style={styles.personSubRow}>
            <Text style={styles.personSubLabel}>Periodo:</Text>
            <Text style={styles.personSubValue}>
              {evaluacionActual?.añoDelExamen
                ? `Año escolar ${evaluacionActual.añoDelExamen}`
                : `${new Date().getFullYear()}`}
            </Text>
          </View>
          {subtituloParte && (
            <View style={styles.personSubRow}>
              <Text style={styles.personSubLabel}>Hoja / Parte:</Text>
              <Text
                style={[
                  styles.personSubValue,
                  { fontFamily: 'Helvetica-Bold', color: '#0f172a' },
                ]}
              >
                {subtituloParte}
              </Text>
            </View>
          )}
        </View>

        {/* QR DE DESCARGA DIGITAL DIRECTA PARA EL PADRE DE FAMILIA */}
        {qrCodeDataUrl ? (
          <View style={styles.qrContainer}>
            <Image src={qrCodeDataUrl} style={styles.qrImage} />
            <Text style={styles.qrTitle}>COPIA DIGITAL</Text>
            <Text style={styles.qrSubtitle}>Escanea el QR</Text>
          </View>
        ) : null}
      </View>
    </View>
  </View>
);
};

/**
 * Determina con precisión si un estudiante rindió y fue efectivamente evaluado en una etapa específica.
 * Devuelve false si el estudiante no rindió la evaluación o no tiene registros de aciertos/puntaje en dicha etapa.
 */
export function isStudentEvaluatedInStage(
  etapaKey: string,
  studentEtapas?: Record<
    string,
    {
      etapaKey: string;
      label?: string;
      puntaje?: number;
      actuacionesResultados?: Record<number, 1 | 2>;
    }
  >,
  historialEtapas?: EtapaHistorialEstudiante[]
): boolean {
  const etapaData = studentEtapas?.[etapaKey];
  if (etapaData) {
    if (typeof etapaData.puntaje === 'number') return true;
    if (
      etapaData.actuacionesResultados &&
      Object.keys(etapaData.actuacionesResultados).length > 0
    ) {
      return true;
    }
  }

  const histItem = historialEtapas?.find((h) => h.etapaKey === etapaKey);
  if (histItem) {
    if (typeof histItem.puntaje === 'number') return true;
    if (typeof histItem.totalPreguntas === 'number' && histItem.totalPreguntas > 0) return true;
    if (typeof histItem.respuestasCorrectas === 'number') return true;
  }

  return false;
}

/**
 * Nombres oficiales de los meses en español para los reportes y leyendas institucionales
 */
export const NOMBRES_MESES = [
  'Enero',
  'Febrero',
  'Marzo',
  'Abril',
  'Mayo',
  'Junio',
  'Julio',
  'Agosto',
  'Septiembre',
  'Octubre',
  'Noviembre',
  'Diciembre',
];

/**
 * Busca si dentro de una cadena de texto se menciona explícitamente algún mes del año.
 */
export function extractMonthFromString(str?: string): string | undefined {
  if (!str) return undefined;
  for (const mes of NOMBRES_MESES) {
    const regex = new RegExp(`\\b${mes}\\b`, 'i');
    if (regex.test(str)) {
      return mes;
    }
  }
  return undefined;
}

/**
 * Normaliza y resuelve el nombre de un mes en texto (ej. "Marzo", "Julio", "Noviembre")
 * a partir de un valor numérico (0-11 o 1-12) o una cadena de texto.
 */
export function resolveMesTexto(mesRaw?: string | number): string | undefined {
  if (mesRaw === undefined || mesRaw === null) return undefined;

  if (typeof mesRaw === 'number') {
    if (mesRaw >= 0 && mesRaw <= 11) return NOMBRES_MESES[mesRaw];
    if (mesRaw >= 1 && mesRaw <= 12) return NOMBRES_MESES[mesRaw - 1];
    return undefined;
  }

  if (typeof mesRaw === 'string') {
    const trimmed = mesRaw.trim();
    if (!trimmed) return undefined;

    // 1. Coincidencia directa con nombre de mes
    const match = NOMBRES_MESES.find(
      (m) => m.toLowerCase() === trimmed.toLowerCase()
    );
    if (match) return match;

    // 2. Extraer nombre de mes si la cadena lo contiene (ej. "Marzo 2026")
    const extracted = extractMonthFromString(trimmed);
    if (extracted) return extracted;

    // 3. Cadena con fecha ISO "YYYY-MM-DD" o "YYYY-MM"
    const matchIso = /^\d{4}[-/](\d{1,2})/.exec(trimmed);
    if (matchIso) {
      const mNum = parseInt(matchIso[1], 10);
      if (mNum >= 1 && mNum <= 12) return NOMBRES_MESES[mNum - 1];
    }

    // 4. Cadena con fecha "DD/MM/YYYY"
    const matchSlash = /^\d{1,2}[-/](\d{1,2})[-/]\d{4}/.exec(trimmed);
    if (matchSlash) {
      const mNum = parseInt(matchSlash[1], 10);
      if (mNum >= 1 && mNum <= 12) return NOMBRES_MESES[mNum - 1];
    }

    // 5. Cadena numérica pura ("2", "03", "11")
    const num = parseInt(trimmed, 10);
    if (!isNaN(num)) {
      if (num >= 0 && num <= 11) return NOMBRES_MESES[num];
      if (num >= 1 && num <= 12) return NOMBRES_MESES[num - 1];
    }
  }

  return undefined;
}

/**
 * Formatea el nombre de configuración institucional de la etapa evaluativa,
 * garantizando la nomenclatura solicitada:
 * - "Evaluación Diagnóstica (Mes)" (ej. "Evaluación Diagnóstica (Marzo)")
 * - "Evaluación Progresiva 1 (Mes)" (ej. "Evaluación Progresiva 1 (Julio)")
 * - "Evaluación Progresiva 2 (Mes)" (ej. "Evaluación Progresiva 2 (Noviembre)")
 */
export function formatEtapaConfigName(
  etapaKey: string,
  etapaLabel?: string,
  mesRaw?: string | number
): string {
  const key = etapaKey.toLowerCase();
  let baseName = 'Evaluación';

  if (key === 'edi') {
    baseName = 'Evaluación Diagnóstica';
  } else if (key === 'ep1') {
    baseName = 'Evaluación Progresiva 1';
  } else if (key === 'ep2') {
    baseName = 'Evaluación Progresiva 2';
  } else {
    const lbl = (etapaLabel || '').toLowerCase();
    if (
      lbl.includes('diagnóstica') ||
      lbl.includes('diagnostica') ||
      lbl.includes('edi')
    ) {
      baseName = 'Evaluación Diagnóstica';
    } else if (lbl.includes('progresiva 1') || lbl.includes('ep1')) {
      baseName = 'Evaluación Progresiva 1';
    } else if (lbl.includes('progresiva 2') || lbl.includes('ep2')) {
      baseName = 'Evaluación Progresiva 2';
    } else if (etapaLabel && etapaLabel.trim()) {
      baseName = etapaLabel.trim();
    } else {
      baseName = `Evaluación ${etapaKey.toUpperCase()}`;
    }
  }

  const mesTexto = resolveMesTexto(mesRaw);
  if (mesTexto) {
    if (!baseName.toLowerCase().includes(mesTexto.toLowerCase())) {
      return `${baseName} (${mesTexto})`;
    }
  }

  return baseName;
}

/**
 * Leyenda gráfica inferior con rectángulos del color institucional de cada evaluación
 * y el nombre de configuración correspondiente (ej. "Evaluación Diagnóstica (Marzo)").
 * Solo aparecen los nombres de las evaluaciones que rindió el estudiante; si no fue evaluado en alguna, no se muestra.
 */
export const RadarEvaluacionesLegendPDF: React.FC<{
  activeEtapasList: { key: string; id?: string; label: string; order?: number }[];
  studentEtapas?: Record<
    string,
    {
      etapaKey: string;
      label?: string;
      puntaje?: number;
      actuacionesResultados?: Record<number, 1 | 2>;
    }
  >;
  historialEtapas?: EtapaHistorialEstudiante[];
  evaluacionActual?: {
    nombre?: string;
    grado?: number | string;
    añoDelExamen?: number | string;
    mesDelExamen?: number | string;
  };
}> = ({
  activeEtapasList,
  studentEtapas = {},
  historialEtapas = [],
  evaluacionActual,
}) => {
  // Filtrar estrictamente solo las evaluaciones donde el alumno fue evaluado
  const evaluatedStages = activeEtapasList
    .map((etapa, idx) => {
      const isEvaluated = isStudentEvaluatedInStage(
        etapa.key,
        studentEtapas,
        historialEtapas
      );
      if (!isEvaluated) return null;

      const etapaData = studentEtapas[etapa.key];
      const histItem = historialEtapas.find((h) => h.etapaKey === etapa.key);

      const color =
        PDF_ETAPA_COLORS[etapa.key] ||
        (idx === 0
          ? PDF_ETAPA_COLORS.edi
          : idx === 1
          ? PDF_ETAPA_COLORS.ep1
          : PDF_ETAPA_COLORS.ep2);

      // Determinar el mes de la etapa a partir de fecha, historial o evaluación actual
      let mesTexto = resolveMesTexto(histItem?.fecha || (etapaData as any)?.fecha);
      if (!mesTexto && histItem?.nombreEvaluacion) {
        mesTexto = extractMonthFromString(histItem.nombreEvaluacion);
      }
      if (!mesTexto && evaluacionActual?.mesDelExamen !== undefined) {
        if (
          etapa.key === 'actual' ||
          activeEtapasList.length === 1 ||
          (histItem?.nombreEvaluacion &&
            evaluacionActual?.nombre &&
            histItem.nombreEvaluacion === evaluacionActual.nombre)
        ) {
          mesTexto = resolveMesTexto(evaluacionActual.mesDelExamen);
        }
      }

      // Generar el nombre de configuración (ej. "Evaluación Diagnóstica (Marzo)")
      const nombreEvaluacion = formatEtapaConfigName(
        etapa.key,
        etapa.label || color.label,
        mesTexto
      );

      return {
        key: etapa.key,
        nombreEvaluacion,
        color,
      };
    })
    .filter(
      (
        st
      ): st is {
        key: string;
        nombreEvaluacion: string;
        color: (typeof PDF_ETAPA_COLORS)['edi'];
      } => Boolean(st)
    );

  if (evaluatedStages.length === 0) return null;

  return (
    <View style={styles.radarLegendContainer} wrap={false}>
      {evaluatedStages.map((st) => (
        <View key={`pdf-eval-legend-${st.key}`} style={styles.radarLegendItem}>
          <View
            style={[
              styles.radarLegendSwatch,
              { backgroundColor: st.color.border },
            ]}
          />
          <Text style={styles.radarLegendText}>{st.nombreEvaluacion}</Text>
        </View>
      ))}
    </View>
  );
};

/**
 * Componente SVG para el Diseño 1: Red flotante panorámica a todo el ancho en orientación Horizontal (Landscape)
 */
const VectorRadarChartPDFFlotante: React.FC<{
  orderedActuaciones: ActuacionCatalogoItem[];
  sortedEtapas: { key: string; id: string; label: string; order: number }[];
  studentEtapas?: Record<
    string,
    {
      etapaKey: string;
      label: string;
      puntaje: number;
      actuacionesResultados?: Record<number, 1 | 2>;
    }
  >;
  historialEtapas?: EtapaHistorialEstudiante[];
  evaluacionActual?: EstudianteEvolutivoPDFProps['evaluacionActual'];
  activeStages?: Record<string, boolean>;
  cardAdjustments?: Record<
    number,
    {
      dx: number;
      dy: number;
      customW?: number;
      customH?: number;
      x?: number;
      y?: number;
    }
  >;
  textScale?: number;
  centerChartType?: RadarCenterChartType;
}> = ({
  orderedActuaciones,
  sortedEtapas,
  studentEtapas = {},
  historialEtapas = [],
  evaluacionActual,
  activeStages = { edi: true, ep1: true, ep2: true },
  cardAdjustments = {},
  textScale = 1.0,
  centerChartType = 'radar',
}) => {
  const N = orderedActuaciones.length;
  if (N === 0) return null;

  const isCenterDiana = centerChartType === 'diana';
  const rBadgesFlot = 216;

  // Centro geométrico y radios adaptados al lienzo apaisado A4 completo (Landscape)
  // ViewBox: 0 0 1000 656 (Aprovecha todo el ancho y alto disponible en A4)
  const cx = 500;
  const cy = 328;
  const R = 195; // Radio exterior del radar web (mismo tamaño físico que diseño columnas: ~240pt)
  const r1 = R / 2; // Anillo 1: NO (97.5)
  const r2 = R; // Anillo 2: SÍ (195)

  // Filtrar etapas activas respetando el orden cronológico
  const activeEtapasList = sortedEtapas.filter(
    (et) => activeStages[et.key] ?? true
  );
  const totalActive = activeEtapasList.length;

  // Algoritmo de Dispersión Periférica Inteligente y Autoajuste al Contenedor:
  // Separa las tarjetas en zonas perimetrales (Top, Bottom, Right, Left)
  // y las distribuye vertical y horizontalmente ocupando todo el lienzo A4 sin colisiones.
  const rawSpokes = orderedActuaciones.map((act, i) => {
    let angle = -Math.PI / 2 + (2 * Math.PI * i) / N;
    let sx: number;
    let sy: number;
    if (isCenterDiana) {
      const midDeg = -90 + (i + 0.5) * (360 / N);
      const rad = (midDeg * Math.PI) / 180;
      angle = rad;
      sx = cx + rBadgesFlot * Math.cos(rad);
      sy = cy + rBadgesFlot * Math.sin(rad);
    } else {
      sx = cx + R * Math.cos(angle);
      sy = cy + R * Math.sin(angle);
    }
    const cos = Math.cos(angle);
    const sin = Math.sin(angle);

    // Clasificación direccional de zona
    let side: 'top' | 'bottom' | 'right' | 'left' = 'right';
    if (Math.abs(cos) <= 0.16 && sin < 0) side = 'top';
    else if (Math.abs(cos) <= 0.16 && sin > 0) side = 'bottom';
    else if (cos > 0) side = 'right';
    else side = 'left';

    // Dimensiones dinámicas del contenedor según extensión del texto y textScale
    const card = calculateDynamicPdfCard(act.order, act.actuacion, 205, textScale);

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
    };
  });

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

  // Rango vertical disponible para tarjetas en laterales: ocupa de Y=20 a Y=636 (616 unidades de holgura)
  const yStart = 20;
  const yEnd = 636;
  const totalSpanY = yEnd - yStart;

  // Distribución espaciada y escalonada en columnas para el lateral DERECHO
  rightGroup.forEach((spoke, idx) => {
    const stepY = totalSpanY / Math.max(rightGroup.length, 1);
    const targetY = yStart + (idx + 0.5) * stepY;

    let targetX = 720;
    if (rightGroup.length >= 8) {
      const colPattern = [1, 2, 0];
      const col = colPattern[idx % 3];
      if (col === 2) targetX = 990 - spoke.boxW;
      else if (col === 1) targetX = 810;
      else targetX = 715;
    } else if (rightGroup.length >= 4) {
      const isOuterCol = idx % 2 === 1;
      targetX = isOuterCol ? 810 : 715;
    } else {
      targetX = 720;
    }

    const boxX = targetX;
    const boxY = targetY - spoke.boxH / 2;
    const anchorX = boxX;
    const anchorY = targetY;

    Object.assign(spoke, { boxX, boxY, anchorX, anchorY });
  });

  // Distribución espaciada y escalonada en columnas para el lateral IZQUIERDO
  leftGroup.forEach((spoke, idx) => {
    const stepY = totalSpanY / Math.max(leftGroup.length, 1);
    const targetY = yStart + (idx + 0.5) * stepY;

    let targetX = 285;
    if (leftGroup.length >= 8) {
      const colPattern = [1, 2, 0];
      const col = colPattern[idx % 3];
      if (col === 2) targetX = 10 + spoke.boxW;
      else if (col === 1) targetX = 190;
      else targetX = 285;
    } else if (leftGroup.length >= 4) {
      const isOuterCol = idx % 2 === 1;
      targetX = isOuterCol ? 190 : 285;
    } else {
      targetX = 280;
    }

    const boxX = targetX - spoke.boxW;
    const boxY = targetY - spoke.boxH / 2;
    const anchorX = targetX;
    const anchorY = targetY;

    Object.assign(spoke, { boxX, boxY, anchorX, anchorY });
  });

  // Distribución superior (Polo Norte)
  topGroup.forEach((spoke, idx) => {
    const offsetCenterX = (idx - (topGroup.length - 1) / 2) * 190;
    const targetX = cx + offsetCenterX;
    const targetY = 18;

    const boxX = targetX - spoke.boxW / 2;
    const boxY = targetY;
    const anchorX = targetX;
    const anchorY = boxY + spoke.boxH;

    const textFit = fitTextInPdfBox(
      spoke.act.order,
      spoke.act.actuacion,
      spoke.boxW,
      spoke.boxH,
      textScale
    );
    Object.assign(spoke, { boxX, boxY, anchorX, anchorY, textFit });
  });

  // Distribución inferior (Polo Sur)
  bottomGroup.forEach((spoke, idx) => {
    const offsetCenterX = (idx - (bottomGroup.length - 1) / 2) * 190;
    const targetX = cx + offsetCenterX;
    const targetY = 626;

    const boxX = targetX - spoke.boxW / 2;
    const boxY = targetY - spoke.boxH;
    const anchorX = targetX;
    const anchorY = boxY;

    const textFit = fitTextInPdfBox(
      spoke.act.order,
      spoke.act.actuacion,
      spoke.boxW,
      spoke.boxH,
      textScale
    );
    Object.assign(spoke, { boxX, boxY, anchorX, anchorY, textFit });
  });

  // Aplicar ajustes manuales personalizados (posicionamiento x, y / dx, dy y dimensiones customW, customH)
  // guardados para la configuración de N actuaciones (ej. 7, 25 o 28 actuaciones)
  const webSvgWidth = 1680;
  const webSvgHeight = Math.max(800, 540 + N * 18);
  const cxWeb = webSvgWidth / 2; // 840
  const cyWeb = webSvgHeight / 2;
  const scaleX = 1000 / webSvgWidth;
  const scaleY = 656 / webSvgHeight;

  (rawSpokes as any[]).forEach((spoke) => {
    const adj = cardAdjustments[spoke.act.order];
    if (adj) {
      const hasCustomW = typeof adj.customW === 'number' && !isNaN(adj.customW);
      const hasCustomH = typeof adj.customH === 'number' && !isNaN(adj.customH);
      const hasAbsX = typeof adj.x === 'number' && !isNaN(adj.x);
      const hasAbsY = typeof adj.y === 'number' && !isNaN(adj.y);
      const hasDx = typeof adj.dx === 'number' && !isNaN(adj.dx) && adj.dx !== 0;
      const hasDy = typeof adj.dy === 'number' && !isNaN(adj.dy) && adj.dy !== 0;

      const effectiveBoxW = hasCustomW
        ? Math.min(Math.max(Math.round(adj.customW! * scaleX), 115), 380)
        : spoke.boxW;
      const effectiveBoxH = hasCustomH
        ? Math.min(Math.max(Math.round(adj.customH! * scaleY), 22), 220)
        : spoke.boxH;

      let effectiveBoxX = spoke.boxX;
      let effectiveBoxY = spoke.boxY;

      if (hasAbsX) {
        // Proyección centrada respecto al radar (Web cxWeb=840 -> PDF cx=500):
        // Garantiza que la alineación exacta en columnas o bloques configurada por el usuario en Web
        // se replique con fidelidad matemática en el lienzo expandido del PDF
        const relX = adj.x! - cxWeb;
        effectiveBoxX = Math.round(cx + relX * scaleX);
      } else if (hasDx) {
        effectiveBoxX = spoke.boxX + Math.round(adj.dx * scaleX);
      }

      if (hasAbsY) {
        const relY = adj.y! - cyWeb;
        effectiveBoxY = Math.round(cy + relY * scaleY);
      } else if (hasDy) {
        effectiveBoxY = spoke.boxY + Math.round(adj.dy * scaleY);
      }

      // Clamping de seguridad para evitar solapamiento con el círculo central ampliado
      if (spoke.side === 'right') {
        effectiveBoxX = Math.max(cx + R + 12, effectiveBoxX);
      } else if (spoke.side === 'left') {
        effectiveBoxX = Math.min(cx - R - 12 - effectiveBoxW, effectiveBoxX);
      } else if (spoke.side === 'top') {
        effectiveBoxY = Math.min(cy - R - 8 - effectiveBoxH, effectiveBoxY);
      } else if (spoke.side === 'bottom') {
        effectiveBoxY = Math.max(cy + R + 8, effectiveBoxY);
      }

      // Clamping para garantizar que la tarjeta nunca quede fuera de los bordes imprimibles del PDF
      effectiveBoxX = Math.max(8, Math.min(effectiveBoxX, 1000 - effectiveBoxW - 8));
      effectiveBoxY = Math.max(14, Math.min(effectiveBoxY, 656 - effectiveBoxH - 14));

      // Reajustar la tipografía al nuevo contenedor si fue redimensionado
      const textFit =
        hasCustomW || hasCustomH
          ? fitTextInPdfBox(
              spoke.act.order,
              spoke.act.actuacion,
              effectiveBoxW,
              effectiveBoxH,
              textScale
            )
          : spoke.textFit;

      Object.assign(spoke, {
        boxX: effectiveBoxX,
        boxY: effectiveBoxY,
        boxW: effectiveBoxW,
        boxH: effectiveBoxH,
        textFit,
      });
    }
  });

  // Algoritmo de Separación Vertical Inteligente:
  // Garantiza que ninguna tarjeta se solape o toque con otra en el PDF,
  // distribuyéndolas con holgura estética a lo largo de todo el alto del lienzo A4
  const allSpokes = rawSpokes as any[];

  const rightSpokes = allSpokes
    .filter((s) => s.boxX >= cx - 20)
    .sort((a, b) => a.boxY - b.boxY);

  const leftSpokes = allSpokes
    .filter((s) => s.boxX < cx - 20)
    .sort((a, b) => a.boxY - b.boxY);

  [rightSpokes, leftSpokes].forEach((group) => {
    if (group.length <= 1) return;
    const minGap = 7;
    const minY = 16;
    const maxY = 642;

    // Pase hacia abajo: si dos tarjetas comparten carril horizontal y se tocan, empujar la siguiente
    for (let i = 1; i < group.length; i++) {
      const prev = group[i - 1];
      const cur = group[i];
      const xOverlap =
        Math.min(prev.boxX + prev.boxW, cur.boxX + cur.boxW) -
        Math.max(prev.boxX, cur.boxX);
      if (xOverlap > 15) {
        const prevBottom = prev.boxY + prev.boxH;
        if (cur.boxY < prevBottom + minGap) {
          cur.boxY = prevBottom + minGap;
        }
      }
    }

    // Pase inverso hacia arriba si el grupo excede el borde inferior
    for (let i = group.length - 2; i >= 0; i--) {
      const next = group[i + 1];
      const cur = group[i];
      if (next.boxY + next.boxH > maxY) {
        next.boxY = maxY - next.boxH;
      }
      const xOverlap =
        Math.min(cur.boxX + cur.boxW, next.boxX + next.boxW) -
        Math.max(cur.boxX, next.boxX);
      if (xOverlap > 15) {
        if (cur.boxY + cur.boxH > next.boxY - minGap) {
          cur.boxY = next.boxY - minGap - cur.boxH;
        }
      }
    }

    // Clamping al borde superior con ajuste seguro
    if (group[0].boxY < minY) {
      group[0].boxY = minY;
      for (let i = 1; i < group.length; i++) {
        const prev = group[i - 1];
        const cur = group[i];
        const xOverlap =
          Math.min(prev.boxX + prev.boxW, cur.boxX + cur.boxW) -
          Math.max(prev.boxX, cur.boxX);
        if (xOverlap > 15) {
          const prevBottom = prev.boxY + prev.boxH;
          if (cur.boxY < prevBottom + minGap) {
            cur.boxY = prevBottom + minGap;
          }
        }
      }
    }
  });

  // Recalcular el anclaje dinámico de la línea guía hacia el borde más cercano de cada tarjeta
  allSpokes.forEach((spoke) => {
    const cardCenterX = spoke.boxX + spoke.boxW / 2;
    const cardCenterY = spoke.boxY + spoke.boxH / 2;
    const diffX = cardCenterX - spoke.sx;
    const diffY = cardCenterY - spoke.sy;

    let anchorX: number;
    let anchorY: number;

    if (Math.abs(diffX) * 0.85 >= Math.abs(diffY)) {
      if (diffX > 0) {
        anchorX = spoke.boxX;
        anchorY = Math.min(
          Math.max(spoke.sy, spoke.boxY + 6),
          spoke.boxY + spoke.boxH - 6
        );
      } else {
        anchorX = spoke.boxX + spoke.boxW;
        anchorY = Math.min(
          Math.max(spoke.sy, spoke.boxY + 6),
          spoke.boxY + spoke.boxH - 6
        );
      }
    } else {
      if (diffY > 0) {
        anchorY = spoke.boxY;
        anchorX = Math.min(
          Math.max(spoke.sx, spoke.boxX + 8),
          spoke.boxX + spoke.boxW - 8
        );
      } else {
        anchorY = spoke.boxY + spoke.boxH;
        anchorX = Math.min(
          Math.max(spoke.sx, spoke.boxX + 8),
          spoke.boxX + spoke.boxW - 8
        );
      }
    }

    spoke.anchorX = anchorX;
    spoke.anchorY = anchorY;
  });

  const spokeEndpoints = rawSpokes as any[];

  // Resumen de aciertos por etapa para la barra inferior consolidada
  const stageSummaries = activeEtapasList.map((etapa) => {
    const etapaData = studentEtapas[etapa.key];
    const color =
      PDF_ETAPA_COLORS[etapa.key] || PDF_ETAPA_COLORS.edi;

    let aciertos = 0;
    if (etapaData && etapaData.actuacionesResultados) {
      orderedActuaciones.forEach((act) => {
        if (etapaData.actuacionesResultados?.[act.order] === 2) {
          aciertos++;
        }
      });
    }

    const pct = N > 0 ? Math.round((aciertos / N) * 100) : 0;
    return {
      key: etapa.key,
      label: etapa.label || color.label,
      color: color.border,
      aciertos,
      total: N,
      pct,
      hasData: Boolean(etapaData),
    };
  });

  return (
    <View style={styles.radarContainerFlotante} wrap={false}>
      <Svg width={800} height={395} viewBox="0 0 1000 656">
        {isCenterDiana ? (
          <React.Fragment>
            {/* Círculo guía exterior */}
            <Circle
              cx={cx}
              cy={cy}
              r={190}
              fill="none"
              stroke="#e2e8f0"
              strokeWidth={1}
              strokeDasharray="3 3"
            />

            {/* Celdas anulares concéntricas por evaluación y actuación */}
            {activeEtapasList.map((etapa, k) => {
              const rHubFlot = 55;
              const rMaxFlot = 190;
              const ringThicknessFlot = (rMaxFlot - rHubFlot) / Math.max(1, activeEtapasList.length);
              const innerR = rHubFlot + k * ringThicknessFlot;
              const outerR = innerR + ringThicknessFlot;
              const etapaColor = getEtapaColorConfig(etapa.key, k);
              const sliceAngle = 360 / Math.max(N, 1);

              return (
                <G key={`pdf-flot-diana-ring-${etapa.key}-${k}`}>
                  {rawSpokes.map(({ act }, i) => {
                    const startDeg = -90 + i * sliceAngle;
                    const endDeg = -90 + (i + 1) * sliceAngle;
                    const dict = studentEtapas[etapa.key]?.actuacionesResultados as Record<string | number, any> | undefined;
                    const val = dict?.[act.order] ?? dict?.[String(act.order)];
                    let fillColor = '#f1f5f9';
                    if (val === 2) {
                      fillColor = etapaColor.border;
                    } else if (val === 1) {
                      fillColor = '#f43f5e';
                    }

                    const d = describeAnnularSector(
                      cx,
                      cy,
                      innerR,
                      outerR,
                      startDeg,
                      endDeg
                    );
                    return (
                      <Path
                        key={`pdf-flot-sector-${etapa.key}-${act.order}`}
                        d={d}
                        fill={fillColor}
                        stroke="#ffffff"
                        strokeWidth={1.2}
                      />
                    );
                  })}
                </G>
              );
            })}

            {/* Centro / Hub de la Diana Polar */}
            <Circle cx={cx} cy={cy} r={53} fill="#3b82f6" />
            <Circle
              cx={cx}
              cy={cy}
              r={49.5}
              fill="none"
              stroke="rgba(255,255,255,0.4)"
              strokeWidth={1.5}
            />
            <Text
              x={cx}
              y={cy - 4}
              style={{
                fill: '#ffffff',
                fontSize: 24,
                fontFamily: 'Helvetica-Bold',
                textAnchor: 'middle',
              }}
            >
              {N}
            </Text>
            <Text
              x={cx}
              y={cy + 13}
              style={{
                fill: '#ffffff',
                fontSize: 7.5,
                fontFamily: 'Helvetica-Bold',
                textAnchor: 'middle',
              }}
            >
              HABILIDADES
            </Text>

            {/* Badges perimetrales con números 1..N y color del nivel de logro */}
            {rawSpokes.map(({ act, sx, sy }) => {
              const superadasAct = activeEtapasList.filter((et) => {
                const dict = studentEtapas[et.key]?.actuacionesResultados as Record<string | number, any> | undefined;
                return (dict?.[act.order] ?? dict?.[String(act.order)]) === 2;
              }).length;
              const nivelBadge = determinarNivelActuacion(
                superadasAct,
                activeEtapasList.length,
                DEFAULT_NIVELES_ACTUACIONES
              );

              return (
                <G key={`pdf-flot-diana-badge-${act.order}`}>
                  <Circle
                    cx={sx}
                    cy={sy}
                    r={8.5}
                    fill="#ffffff"
                    stroke={nivelBadge.color}
                    strokeWidth={1.5}
                  />
                  <Text
                    x={sx}
                    y={sy + 2.5}
                    textAnchor="middle"
                    style={{
                      fontSize: 7,
                      fontFamily: 'Helvetica-Bold',
                      fill: '#1e293b',
                    }}
                  >
                    {act.order}
                  </Text>
                </G>
              );
            })}
          </React.Fragment>
        ) : (
          <React.Fragment>
            {/* Anillo 1 (Interior: NO acertó = 1) */}
            <Circle
              cx={cx}
              cy={cy}
              r={r1}
              fill="none"
              stroke="#e2e8f0"
              strokeWidth={1}
              strokeDasharray="4 4"
            />

            {/* Anillo 2 (Exterior: SÍ acertó = 2) */}
            <Circle
              cx={cx}
              cy={cy}
              r={r2}
              fill="none"
              stroke="#cbd5e1"
              strokeWidth={1.2}
            />

            {/* Hub central */}
            <Circle cx={cx} cy={cy} r={2.5} fill="#94a3b8" />

            {/* Indicadores numéricos de escala en el eje superior */}
            <Text
              x={cx + 4}
              y={cy - r1 + 3}
              style={{ fontSize: 6, fill: '#94a3b8', fontFamily: 'Helvetica' }}
            >
              1 (NO)
            </Text>
            <Text
              x={cx + 4}
              y={cy - r2 + 3}
              style={{ fontSize: 6, fill: '#94a3b8', fontFamily: 'Helvetica' }}
            >
              2 (SÍ)
            </Text>

            {/* Ejes radiales (Spokes) hacia cada actuación */}
            {spokeEndpoints.map((ep) => (
              <Line
                key={`spoke-${ep.index}`}
                x1={cx}
                y1={cy}
                x2={ep.sx}
                y2={ep.sy}
                stroke="#e2e8f0"
                strokeWidth={1}
              />
            ))}
          </React.Fragment>
        )}

        {/* Líneas guía conectoras hacia las tarjetas contenedoras */}
        {spokeEndpoints.map((ep) => (
          <React.Fragment key={`leader-line-${ep.act.order}`}>
            <Line
              x1={ep.sx}
              y1={ep.sy}
              x2={ep.anchorX}
              y2={ep.anchorY}
              stroke="#94a3b8"
              strokeWidth={0.9}
            />
            {!isCenterDiana && (
              <Circle cx={ep.sx} cy={ep.sy} r={2.0} fill="#94a3b8" />
            )}
          </React.Fragment>
        ))}

        {/* Polígonos de evaluación: del más antiguo (edi) al más actual (ep2).
            En SVG, los últimos elementos se dibujan ENCIMA, por lo que el más actual queda superpuesto. */}
        {!isCenterDiana &&
          activeEtapasList.map((etapa, idx) => {
            const etapaData = studentEtapas[etapa.key];
            if (!etapaData) return null;

            const color =
              PDF_ETAPA_COLORS[etapa.key] ||
              (idx === 0
                ? PDF_ETAPA_COLORS.edi
                : idx === 1
                ? PDF_ETAPA_COLORS.ep1
                : PDF_ETAPA_COLORS.ep2);

            const isMostRecent = idx === totalActive - 1;

            // Coordenadas polares para cada actuación
            const points = orderedActuaciones.map((act, i) => {
              const val = etapaData.actuacionesResultados?.[act.order] ?? 1;
              const offset = getCoincidentRadiusOffset(etapa.key, act.order, activeEtapasList, studentEtapas);
              const rVal = (val * R) / 2 + offset;
              const angle = spokeEndpoints[i].angle;
              return {
                x: cx + rVal * Math.cos(angle),
                y: cy + rVal * Math.sin(angle),
              };
            });

            const pointsString = points
              .map((p) => `${p.x.toFixed(1)},${p.y.toFixed(1)}`)
              .join(' ');

            return (
              <React.Fragment key={`dataset-${etapa.key}`}>
                {/* Polígono de área */}
                <Polygon
                  points={pointsString}
                  fill={color.bg}
                  fillOpacity={isMostRecent ? 0.12 : (color.fillOpacity ?? 0.07)}
                  stroke={color.border}
                  strokeWidth={isMostRecent ? 2.5 : 1.5}
                />
                {/* Vértices circulares */}
                {points.map((p, pIdx) => (
                  <Circle
                    key={`pt-${etapa.key}-${pIdx}`}
                    cx={p.x}
                    cy={p.y}
                    r={isMostRecent ? 3.5 : 2.5}
                    fill={color.border}
                    stroke="#ffffff"
                    strokeWidth={0.8}
                  />
                ))}
              </React.Fragment>
            );
          })}

        {/* Tarjetas contenedoras de cada actuación pedagógica (Callout Cards) */}
        {spokeEndpoints.map((ep) => {
          const { fontSize, lines, lineHeight } = ep.textFit;
          const totalTextHeight = (lines.length - 1) * lineHeight;
          const textStartY =
            ep.boxY + (ep.boxH - totalTextHeight) / 2 + fontSize * 0.35;

          return (
            <React.Fragment key={`callout-box-${ep.act.order}`}>
              {/* Tarjeta rectangular con esquinas redondeadas y fondo blanco */}
              <Rect
                x={ep.boxX}
                y={ep.boxY}
                width={ep.boxW}
                height={ep.boxH}
                rx={6}
                ry={6}
                fill="#ffffff"
                stroke="#cbd5e1"
                strokeWidth={0.8}
              />

              {/* Texto de la actuación autoajustado al contenedor */}
              {lines.map((lineText: string, j: number) => (
                <Text
                  key={`lbl-${ep.act.order}-${j}`}
                  x={ep.boxX + ep.boxW / 2}
                  y={textStartY + j * lineHeight}
                  textAnchor="middle"
                  style={{
                    fontSize,
                    fontFamily: 'Helvetica',
                    fill: '#1e293b',
                  }}
                >
                  {lineText}
                </Text>
              ))}
            </React.Fragment>
          );
        })}
      </Svg>

      {/* Leyenda institucional en la parte baja del gráfico con rectángulos de color */}
      <RadarEvaluacionesLegendPDF
        activeEtapasList={activeEtapasList}
        studentEtapas={studentEtapas}
        historialEtapas={historialEtapas}
        evaluacionActual={evaluacionActual}
      />
    </View>
  );
};

/**
 * Calibra dinámicamente el tamaño de fuente, interlineado, padding y márgenes de las
 * columnas laterales en base al volumen real de texto y renglones necesarios,
 * garantizando que NUNCA desborde la página y que todo el contenido quepa en una sola hoja A4 horizontal.
 */
export function calibratePdfColumnMetrics(
  leftItems: ActuacionCatalogoItem[],
  rightItems: ActuacionCatalogoItem[],
  maxAvailableHeight: number = 365,
  textScale: number = 1.0
): {
  cardFontSize: number;
  cardLineHeight: number;
  cardPadY: number;
  cardMarginB: number;
  badgeSize: number;
  badgeFontSize: number;
  estimatedH: number;
} {
  const effectiveScale =
    typeof textScale === 'number' && !isNaN(textScale) && textScale > 0 ? textScale : 1.0;
  const maxItems = Math.max(leftItems.length, rightItems.length, 1);
  let baseMaxF = 8.8;
  if (maxItems > 18) baseMaxF = 6.2;
  else if (maxItems > 13) baseMaxF = 6.8;
  else if (maxItems > 8) baseMaxF = 7.8;

  const maxF = Math.round(baseMaxF * effectiveScale * 10) / 10;
  const minF = Math.max(4.5, Math.round(5.0 * Math.min(effectiveScale, 1.1) * 10) / 10);

  const H_HEADER = 14;
  const targetH = maxAvailableHeight - H_HEADER;

  for (let f = maxF; f >= minF; f -= 0.1) {
    const charsPerLine = Math.max(16, Math.floor(196 / (f * 0.51)));

    let leftLines = 0;
    for (const it of leftItems) {
      leftLines += Math.max(1, Math.ceil((it.actuacion || '').length / charsPerLine));
    }

    let rightLines = 0;
    for (const it of rightItems) {
      rightLines += Math.max(1, Math.ceil((it.actuacion || '').length / charsPerLine));
    }

    const maxLines = Math.max(leftLines, rightLines);
    const lineHeight = f * 1.18;
    const textHeight = maxLines * lineHeight;
    const remainingH = targetH - textHeight;

    if (remainingH >= maxItems * 1.4) {
      const spacePerItem = remainingH / maxItems;
      const padY = Math.min(3.8, Math.max(0.5, spacePerItem * 0.28));
      const marginB = Math.min(3.5, Math.max(0.6, spacePerItem * 0.35));
      const totalH = H_HEADER + textHeight + maxItems * (padY * 2 + marginB);

      if (totalH <= maxAvailableHeight) {
        const badgeSize = Math.max(10.5, Math.min(18, f * 1.85));
        const badgeFontSize = Math.max(5.8, Math.min(9.5, f * 0.98));
        return {
          cardFontSize: Number(f.toFixed(1)),
          cardLineHeight: 1.18,
          cardPadY: Number(padY.toFixed(1)),
          cardMarginB: Number(marginB.toFixed(1)),
          badgeSize: Number(badgeSize.toFixed(1)),
          badgeFontSize: Number(badgeFontSize.toFixed(1)),
          estimatedH: Number(totalH.toFixed(1)),
        };
      }
    }
  }

  const fallbackF = Math.round(5.2 * effectiveScale * 10) / 10;
  return {
    cardFontSize: fallbackF,
    cardLineHeight: 1.15,
    cardPadY: 0.5,
    cardMarginB: 0.6,
    badgeSize: Math.max(10.5, Math.round(fallbackF * 1.85)),
    badgeFontSize: Math.max(5.5, Math.round(fallbackF * 0.98)),
    estimatedH: maxAvailableHeight,
  };
}

/**
 * Componente para el Diseño 2: Radar central con números exteriores y columnas laterales en PDF
 */
const VectorRadarChartPDFColumnas: React.FC<{
  orderedActuaciones: ActuacionCatalogoItem[];
  sortedEtapas: { key: string; id: string; label: string; order: number }[];
  studentEtapas?: Record<
    string,
    {
      etapaKey: string;
      label: string;
      puntaje: number;
      actuacionesResultados?: Record<number, 1 | 2>;
    }
  >;
  historialEtapas?: EtapaHistorialEstudiante[];
  evaluacionActual?: EstudianteEvolutivoPDFProps['evaluacionActual'];
  activeStages?: Record<string, boolean>;
  orderDirection?: 'horario' | 'antihorario';
  textScale?: number;
  centerChartType?: RadarCenterChartType;
}> = ({
  orderedActuaciones,
  sortedEtapas,
  studentEtapas = {},
  historialEtapas = [],
  evaluacionActual,
  activeStages = { edi: true, ep1: true, ep2: true },
  orderDirection = 'horario',
  textScale = 1.0,
  centerChartType = 'radar',
}) => {
  const N = orderedActuaciones.length;
  if (N === 0) return null;

  // Filtrar etapas activas respetando el orden cronológico
  const activeEtapasList = sortedEtapas.filter(
    (et) => activeStages[et.key] ?? true
  );
  const totalActive = activeEtapasList.length;

  const isAntihorario = orderDirection === 'antihorario';
  // División hemisférica:
  // Horario: Hemisferio Derecho (1..mid) y Hemisferio Izquierdo (mid+1..N)
  // Antihorario: Hemisferio Izquierdo (1..mid) y Hemisferio Derecho (mid+1..N)
  const midPoint = Math.ceil(N / 2);
  const rightColumn = isAntihorario
    ? orderedActuaciones.slice(midPoint)
    : orderedActuaciones.slice(0, midPoint);
  const leftColumn = isAntihorario
    ? orderedActuaciones.slice(0, midPoint)
    : orderedActuaciones.slice(midPoint);

  // Dimensiones del SVG central: 360 x 355 (calibrado para que la leyenda quede pegada al gráfico y nunca desborde a una 2da página)
  const svgWidth = 360;
  const svgHeight = 355;
  const cx = svgWidth / 2;
  const cy = svgHeight / 2;
  const R = 120; // Radio exterior del radar calibrado para A4 landscape
  const r1 = R / 2; // Radio intermedio (NO = 1) = 60
  const r2 = R; // Radio exterior = 120
  const rBadge = R + 18; // Radio de los badges numéricos = 138

  const spokeEndpoints = orderedActuaciones.map((act, i) => {
    const angle = isAntihorario
      ? -Math.PI / 2 - (2 * Math.PI * i) / N
      : -Math.PI / 2 + (2 * Math.PI * i) / N;
    const cos = Math.cos(angle);
    const sin = Math.sin(angle);
    const vx = cx + R * cos;
    const vy = cy + R * sin;
    const nx = cx + rBadge * cos;
    const ny = cy + rBadge * sin;

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

  // Calibración dinámica adaptativa del tamaño de tarjeta y tipografía según el volumen real de texto y textScale
  const {
    cardFontSize,
    cardLineHeight,
    cardPadY,
    cardMarginB,
    badgeSize,
    badgeFontSize,
  } = calibratePdfColumnMetrics(leftColumn, rightColumn, 365, textScale);
  const cardPadX = 0;

  const renderPdfCompactCard = (act: ActuacionCatalogoItem) => (
    <View
      key={`pdf-card-${act.order}`}
      style={[
        styles.compactCard,
        {
          paddingVertical: cardPadY,
          paddingHorizontal: cardPadX,
          marginBottom: cardMarginB,
        },
      ]}
    >
      <View
        style={[
          styles.cardBadge,
          {
            width: badgeSize,
            height: badgeSize,
          },
        ]}
      >
        <Text style={[styles.cardBadgeText, { fontSize: badgeFontSize }]}>
          {act.order}
        </Text>
      </View>
      <Text
        style={[
          styles.cardActuacionText,
          {
            fontSize: cardFontSize,
            lineHeight: cardLineHeight,
          },
        ]}
      >
        {act.actuacion ||
          (act as any).preguntaDocente ||
          (act as any).actuaciones ||
          (act as any).textoActuacion ||
          (act as any).pregunta ||
          `Actuación Pedagógica N° ${act.order}`}
      </Text>
    </View>
  );

  return (
    <View style={styles.radarContainer} wrap={false}>
      <View style={styles.columnsContainer} wrap={false}>
        {/* Columna Izquierda: Actuaciones Hemisferio Izquierdo */}
        <View style={styles.lateralColumn}>
          {leftColumn.length > 0 && (
            <Text style={styles.columnHeader}>
              {`Actuaciones ${leftColumn[0]?.order} - ${leftColumn[leftColumn.length - 1]?.order} (Izquierda)`.toUpperCase()}
            </Text>
          )}
          {leftColumn.map(renderPdfCompactCard)}
        </View>

        {/* Columna Central: Radar Limpio con Números en el Perímetro o Diana Polar Concéntrica */}
        <View style={styles.radarCenterColumn}>
          <Svg width={svgWidth} height={svgHeight} viewBox={`0 0 ${svgWidth} ${svgHeight}`}>
            {centerChartType === 'diana' ? (
              <React.Fragment>
                {/* Círculo guía exterior */}
                <Circle
                  cx={cx}
                  cy={cy}
                  r={115}
                  fill="none"
                  stroke="#e2e8f0"
                  strokeWidth={1}
                  strokeDasharray="3 3"
                />

                {/* Celdas anulares concéntricas por evaluación y actuación */}
                {activeEtapasList.map((etapa, k) => {
                  const rHubCol = 34;
                  const rMaxCol = 115;
                  const ringThicknessCol = (rMaxCol - rHubCol) / Math.max(1, activeEtapasList.length);
                  const innerR = rHubCol + k * ringThicknessCol;
                  const outerR = innerR + ringThicknessCol;
                  const etapaColor = getEtapaColorConfig(etapa.key, k);
                  const sliceAngle = 360 / Math.max(N, 1);

                  return (
                    <G key={`pdf-col-diana-ring-${etapa.key}-${k}`}>
                      {spokeEndpoints.map(({ act }, i) => {
                        const startDeg = isAntihorario
                          ? -90 - (i + 1) * sliceAngle
                          : -90 + i * sliceAngle;
                        const endDeg = isAntihorario
                          ? -90 - i * sliceAngle
                          : -90 + (i + 1) * sliceAngle;

                        const dict = studentEtapas[etapa.key]?.actuacionesResultados as Record<string | number, any> | undefined;
                        const val = dict?.[act.order] ?? dict?.[String(act.order)];
                        let fillColor = '#f1f5f9';
                        if (val === 2) {
                          fillColor = etapaColor.border;
                        } else if (val === 1) {
                          fillColor = '#f43f5e';
                        }

                        const d = describeAnnularSector(
                          cx,
                          cy,
                          innerR,
                          outerR,
                          startDeg,
                          endDeg
                        );
                        return (
                          <Path
                            key={`pdf-col-sector-${etapa.key}-${act.order}`}
                            d={d}
                            fill={fillColor}
                            stroke="#ffffff"
                            strokeWidth={1.2}
                          />
                        );
                      })}
                    </G>
                  );
                })}

                {/* Centro / Hub de la Diana Polar */}
                <Circle cx={cx} cy={cy} r={32} fill="#3b82f6" />
                <Circle
                  cx={cx}
                  cy={cy}
                  r={29.5}
                  fill="none"
                  stroke="rgba(255,255,255,0.4)"
                  strokeWidth={1.2}
                />
                <Text
                  x={cx}
                  y={cy - 3}
                  style={{
                    fill: '#ffffff',
                    fontSize: 16,
                    fontFamily: 'Helvetica-Bold',
                    textAnchor: 'middle',
                  }}
                >
                  {N}
                </Text>
                <Text
                  x={cx}
                  y={cy + 8}
                  style={{
                    fill: '#ffffff',
                    fontSize: 5,
                    fontFamily: 'Helvetica-Bold',
                    textAnchor: 'middle',
                  }}
                >
                  HABILIDADES
                </Text>

                {/* Badges perimetrales con números 1..N y color del nivel de logro */}
                {spokeEndpoints.map(({ act }, i) => {
                  const sliceAngle = 360 / Math.max(N, 1);
                  const midDeg = isAntihorario
                    ? -90 - (i + 0.5) * sliceAngle
                    : -90 + (i + 0.5) * sliceAngle;
                  const rad = (midDeg * Math.PI) / 180;
                  const bx = cx + 134 * Math.cos(rad);
                  const by = cy + 134 * Math.sin(rad);

                  const superadasAct = activeEtapasList.filter((et) => {
                    const dict = studentEtapas[et.key]?.actuacionesResultados as Record<string | number, any> | undefined;
                    return (dict?.[act.order] ?? dict?.[String(act.order)]) === 2;
                  }).length;
                  const nivelBadge = determinarNivelActuacion(
                    superadasAct,
                    activeEtapasList.length,
                    DEFAULT_NIVELES_ACTUACIONES
                  );

                  return (
                    <G key={`pdf-col-diana-badge-${act.order}`}>
                      <Circle
                        cx={bx}
                        cy={by}
                        r={6.5}
                        fill="#ffffff"
                        stroke={nivelBadge.color}
                        strokeWidth={1.2}
                      />
                      <Text
                        x={bx}
                        y={by + 2}
                        textAnchor="middle"
                        style={{
                          fontSize: 5,
                          fontFamily: 'Helvetica-Bold',
                          fill: '#1e293b',
                        }}
                      >
                        {act.order}
                      </Text>
                    </G>
                  );
                })}
              </React.Fragment>
            ) : (
              <React.Fragment>
                {/* Anillo 1 (NO = 1) */}
                <Circle
                  cx={cx}
                  cy={cy}
                  r={r1}
                  fill="none"
                  stroke="#e2e8f0"
                  strokeWidth={1}
                  strokeDasharray="4 4"
                />

                {/* Anillo 2 (SÍ = 2) */}
                <Circle
                  cx={cx}
                  cy={cy}
                  r={r2}
                  fill="none"
                  stroke="#cbd5e1"
                  strokeWidth={1.2}
                />

                {/* Hub Central */}
                <Circle cx={cx} cy={cy} r={2.5} fill="#94a3b8" />

                {/* Escala */}
                <Text
                  x={cx + 4}
                  y={cy - r1 + 3}
                  style={{ fontSize: 6.5, fill: '#94a3b8', fontFamily: 'Helvetica' }}
                >
                  1 (NO)
                </Text>
                <Text
                  x={cx + 4}
                  y={cy - r2 + 3}
                  style={{ fontSize: 6.5, fill: '#94a3b8', fontFamily: 'Helvetica' }}
                >
                  2 (SÍ)
                </Text>

                {/* Ejes radiales (Spokes) */}
                {spokeEndpoints.map((ep) => (
                  <Line
                    key={`spoke-col-${ep.index}`}
                    x1={cx}
                    y1={cy}
                    x2={ep.vx}
                    y2={ep.vy}
                    stroke="#e2e8f0"
                    strokeWidth={1}
                  />
                ))}

                {/* Conectores hacia badges numéricos */}
                {spokeEndpoints.map((ep) => (
                  <Line
                    key={`spoke-tick-${ep.index}`}
                    x1={ep.vx}
                    y1={ep.vy}
                    x2={ep.nx}
                    y2={ep.ny}
                    stroke="#cbd5e1"
                    strokeWidth={0.8}
                    strokeDasharray="2 2"
                  />
                ))}

                {/* Polígonos de evaluación del más antiguo al más actual */}
                {activeEtapasList.map((etapa, idx) => {
                  const etapaData = studentEtapas[etapa.key];
                  if (!etapaData) return null;

                  const color =
                    PDF_ETAPA_COLORS[etapa.key] ||
                    (idx === 0
                      ? PDF_ETAPA_COLORS.edi
                      : idx === 1
                      ? PDF_ETAPA_COLORS.ep1
                      : PDF_ETAPA_COLORS.ep2);

                  const isMostRecent = idx === totalActive - 1;

                  const points = orderedActuaciones.map((act, i) => {
                    const dict = etapaData.actuacionesResultados as Record<string | number, any> | undefined;
                    const val = dict?.[act.order] ?? dict?.[String(act.order)] ?? 1;
                    const offset = getCoincidentRadiusOffset(etapa.key, act.order, activeEtapasList, studentEtapas);
                    const rVal = (val * R) / 2 + offset;
                    const angle = spokeEndpoints[i].angle;
                    return {
                      x: cx + rVal * Math.cos(angle),
                      y: cy + rVal * Math.sin(angle),
                    };
                  });

                  const pointsString = points
                    .map((p) => `${p.x.toFixed(1)},${p.y.toFixed(1)}`)
                    .join(' ');

                  return (
                    <React.Fragment key={`dataset-col-${etapa.key}`}>
                      <Polygon
                        points={pointsString}
                        fill={color.bg}
                        fillOpacity={isMostRecent ? 0.12 : (color.fillOpacity ?? 0.07)}
                        stroke={color.border}
                        strokeWidth={isMostRecent ? 2.5 : 1.5}
                      />
                      {points.map((p, pIdx) => (
                        <Circle
                          key={`pt-col-${etapa.key}-${pIdx}`}
                          cx={p.x}
                          cy={p.y}
                          r={isMostRecent ? 3.5 : 2.5}
                          fill={color.border}
                          stroke="#ffffff"
                          strokeWidth={0.8}
                        />
                      ))}
                    </React.Fragment>
                  );
                })}

                {/* Badges numéricos en el perímetro exterior */}
                {spokeEndpoints.map((ep) => (
                  <React.Fragment key={`badge-outer-${ep.act.order}`}>
                    <Circle
                      cx={ep.nx}
                      cy={ep.ny}
                      r={8}
                      fill="#ffffff"
                      stroke="#94a3b8"
                      strokeWidth={0.8}
                    />
                    <Text
                      x={ep.nx}
                      y={ep.ny + 2.4}
                      textAnchor="middle"
                      style={{
                        fontSize: 6,
                        fontFamily: 'Helvetica-Bold',
                        fill: '#1e293b',
                      }}
                    >
                      {ep.act.order}
                    </Text>
                  </React.Fragment>
                ))}
              </React.Fragment>
            )}
          </Svg>
        </View>

        {/* Columna Derecha: Actuaciones Hemisferio Derecho */}
        <View style={styles.lateralColumn}>
          {rightColumn.length > 0 && (
            <Text style={styles.columnHeader}>
              {`Actuaciones ${rightColumn[0]?.order} - ${rightColumn[rightColumn.length - 1]?.order} (Derecha)`.toUpperCase()}
            </Text>
          )}
          {rightColumn.map(renderPdfCompactCard)}
        </View>
      </View>

      {/* Leyenda institucional en la parte baja del gráfico con rectángulos de color */}
      <RadarEvaluacionesLegendPDF
        activeEtapasList={activeEtapasList}
        studentEtapas={studentEtapas}
        historialEtapas={historialEtapas}
        evaluacionActual={evaluacionActual}
      />
    </View>
  );
};

/**
 * Componente Vectorial Nativo de Alta Fidelidad para el Diseño Diana Polar de Progresión Continua en PDF
 */
const VectorRadarChartPDFDiana: React.FC<{
  orderedActuaciones: ActuacionCatalogoItem[];
  sortedEtapas: { key: string; label: string; order?: number }[];
  studentEtapas: Record<
    string,
    {
      etapaKey?: string;
      label?: string;
      puntaje?: number;
      actuacionesResultados?: Record<number, 1 | 2>;
    }
  >;
  historialEtapas?: EtapaHistorialEstudiante[];
  evaluacionActual?: EstudianteEvolutivoPDFProps['evaluacionActual'];
  activeStages?: Record<string, boolean>;
  orderDirection?: 'horario' | 'antihorario';
  textScale?: number;
}> = ({
  orderedActuaciones,
  sortedEtapas,
  studentEtapas,
  activeStages,
  orderDirection = 'horario',
  textScale = 1.0,
}) => {
  const isAntihorario = orderDirection === 'antihorario';
  const M = orderedActuaciones.length;

  // Filtrar etapas activas y evaluadas respetando el orden cronológico
  const activeEtapasList = sortedEtapas.filter(
    (et) => activeStages?.[et.key] !== false && activeStages?.[et.key.toLowerCase()] !== false
  );
  const effectiveActiveEtapas = activeEtapasList.length > 0 ? activeEtapasList : sortedEtapas;

  // Helper para resolver el valor de la actuación (2 = SÍ, 1 = NO) con resiliencia a tipos de clave
  const getActVal = (stageKey: string, order: number): 1 | 2 | undefined => {
    const etapaData =
      studentEtapas[stageKey] ||
      studentEtapas[stageKey.toLowerCase()] ||
      studentEtapas[stageKey.toUpperCase()];
    const dict = etapaData?.actuacionesResultados as Record<string | number, any> | undefined;
    if (!dict) return undefined;
    const v = dict[order] ?? dict[String(order)] ?? dict[Number(order)];
    return v === 2 || v === 1 ? v : undefined;
  };

  // Geometría polar SVG de la Diana
  const cx = 290;
  const cy = 290;
  const rHub = 62;
  const rMax = 224;
  const rBadges = 254;

  const ringThickness = (rMax - rHub) / Math.max(1, effectiveActiveEtapas.length);
  const sliceAngle = 360 / Math.max(M, 1);

  // Cálculo angular por actuación
  const actsGeometry = orderedActuaciones.map((act, i) => {
    const startDeg = isAntihorario ? -90 - (i + 1) * sliceAngle : -90 + i * sliceAngle;
    const endDeg = isAntihorario ? -90 - i * sliceAngle : -90 + (i + 1) * sliceAngle;
    const midDeg = isAntihorario ? -90 - (i + 0.5) * sliceAngle : -90 + (i + 0.5) * sliceAngle;
    return { act, i, startDeg, endDeg, midDeg };
  });

  // Calibración adaptativa de altura de fila para aprovechar al máximo el espacio vertical y garantizar que los textos se muestren completos
  const availableTableH = 360;
  const tableRowH = Math.min(22, Math.max(12, Math.floor(availableTableH / Math.max(M, 1))));
  const tableFontSize =
    Math.round((M > 22 ? 5.5 : M > 16 ? 6.2 : 6.8) * Math.min(textScale, 1.15) * 10) / 10;

  return (
    <View style={styles.dianaContainer} wrap={false}>
      {/* Cuerpo en 2 Columnas: Diana Polar SVG a la izquierda y Tabla Limpia de Habilidades a la derecha */}
      <View style={styles.dianaColumnsGrid}>
        {/* Columna Izquierda: Rueda Diana Polar SVG con leyendas */}
        <View style={styles.dianaLeftColumn}>
          <Svg width={335} height={325} viewBox="0 0 580 580">
            {/* Círculo guía exterior */}
            <Circle
              cx={cx}
              cy={cy}
              r={rMax}
              fill="none"
              stroke="#e2e8f0"
              strokeWidth={1}
              strokeDasharray="3 3"
            />

            {/* Celdas anulares concéntricas por evaluación y actuación */}
            {effectiveActiveEtapas.map((etapa, k) => {
              const innerR = rHub + k * ringThickness;
              const outerR = innerR + ringThickness;
              const etapaColor = getEtapaColorConfig(etapa.key, k);

              return (
                <G key={`pdf-diana-ring-${etapa.key}-${k}`}>
                  {actsGeometry.map(({ act, startDeg, endDeg }) => {
                    const val = getActVal(etapa.key, act.order);
                    let fillColor = '#f1f5f9';
                    if (val === 2) {
                      fillColor = etapaColor.border;
                    } else if (val === 1) {
                      fillColor = '#f43f5e';
                    }

                    const d = describeAnnularSector(
                      cx,
                      cy,
                      innerR,
                      outerR,
                      startDeg,
                      endDeg
                    );
                    return (
                      <Path
                        key={`pdf-sector-${etapa.key}-${act.order}`}
                        d={d}
                        fill={fillColor}
                        stroke="#ffffff"
                        strokeWidth={1.2}
                      />
                    );
                  })}
                </G>
              );
            })}

            {/* Centro / Hub de la Diana Polar */}
            <Circle cx={cx} cy={cy} r={rHub - 2} fill="#3b82f6" />
            <Circle
              cx={cx}
              cy={cy}
              r={rHub - 5}
              fill="none"
              stroke="rgba(255,255,255,0.4)"
              strokeWidth={1.5}
            />
            <Text
              x={cx}
              y={cy - 4}
              style={{
                fill: '#ffffff',
                fontSize: 26,
                fontFamily: 'Helvetica-Bold',
                textAnchor: 'middle',
              }}
            >
              {M}
            </Text>
            <Text
              x={cx}
              y={cy + 15}
              style={{
                fill: '#ffffff',
                fontSize: 8.5,
                fontFamily: 'Helvetica-Bold',
                textAnchor: 'middle',
              }}
            >
              HABILIDADES
            </Text>

            {/* Badges perimetrales con números 1..N */}
            {actsGeometry.map(({ act, midDeg }) => {
              const rad = (midDeg * Math.PI) / 180;
              const bx = cx + rBadges * Math.cos(rad);
              const by = cy + rBadges * Math.sin(rad);

              const superadasAct = effectiveActiveEtapas.filter(
                (et) => getActVal(et.key, act.order) === 2
              ).length;
              const nivelBadge = determinarNivelActuacion(
                superadasAct,
                effectiveActiveEtapas.length,
                DEFAULT_NIVELES_ACTUACIONES
              );

              return (
                <G key={`pdf-diana-badge-${act.order}`}>
                  <Circle
                    cx={bx}
                    cy={by}
                    r={10.5}
                    fill="#ffffff"
                    stroke={nivelBadge.color}
                    strokeWidth={2}
                  />
                  <Text
                    x={bx}
                    y={by + 3.2}
                    style={{
                      fill: '#0f172a',
                      fontSize: 8.5,
                      fontFamily: 'Helvetica-Bold',
                      textAnchor: 'middle',
                    }}
                  >
                    {act.order}
                  </Text>
                </G>
              );
            })}
          </Svg>

          {/* Leyenda de Anillos (Evaluaciones) */}
          <View style={styles.dianaLegendRow}>
            {effectiveActiveEtapas.map((et, idx) => {
              const colorCfg = getEtapaColorConfig(et.key, idx);
              return (
                <View key={`pdf-leg-stage-${et.key}`} style={styles.dianaLegendItem}>
                  <View
                    style={[
                      styles.dianaLegendDot,
                      { backgroundColor: colorCfg.border },
                    ]}
                  />
                  <Text style={styles.dianaLegendText}>
                    Anillo {idx + 1}: {et.label || et.key.toUpperCase()}
                  </Text>
                </View>
              );
            })}
          </View>

          {/* Leyenda de Niveles de Actuación */}
          <View style={styles.dianaLegendRow}>
            {DEFAULT_NIVELES_ACTUACIONES.map((nv) => (
              <View key={`pdf-leg-nv-${nv.id}`} style={styles.dianaLegendItem}>
                <View
                  style={[
                    styles.dianaLegendDot,
                    { backgroundColor: nv.color },
                  ]}
                />
                <Text style={styles.dianaLegendText}>{nv.nombre}</Text>
              </View>
            ))}
          </View>
        </View>

        {/* Columna Derecha: Tabla Institucional Limpia de Habilidades (Sin cabecera para máximo espacio vertical y círculo de color para nivel) */}
        <View style={styles.dianaRightColumn}>
          {/* Filas de la tabla */}
          {orderedActuaciones.map((act, rIdx) => {
            const superadasRow = effectiveActiveEtapas.filter(
              (et) => getActVal(et.key, act.order) === 2
            ).length;
            const nivelRow = determinarNivelActuacion(
              superadasRow,
              effectiveActiveEtapas.length,
              DEFAULT_NIVELES_ACTUACIONES
            );

            const fullText =
              String(act.actuacion || act.pregunta || '').trim() ||
              `Actuación Pedagógica N° ${act.order}`;

            const isLast = rIdx === orderedActuaciones.length - 1;

            return (
              <View
                key={`pdf-diana-row-${act.order}`}
                style={[
                  styles.dianaTableRow,
                  {
                    height: tableRowH,
                    backgroundColor:
                      rIdx % 2 === 0 ? '#ffffff' : '#f8fafc',
                    borderBottomWidth: isLast ? 0 : 0.4,
                  },
                ]}
              >
                {/* N.° */}
                <View style={{ width: 22, alignItems: 'center', justifyContent: 'center' }}>
                  <Text
                    style={{
                      fontSize: tableFontSize,
                      fontFamily: 'Helvetica-Bold',
                      color: '#475569',
                    }}
                  >
                    {act.order}
                  </Text>
                </View>

                {/* Actuación evaluada (Texto completo con máximo ancho horizontal disponible) */}
                <View
                  style={{
                    flex: 1,
                    paddingLeft: 6,
                    paddingRight: 6,
                    justifyContent: 'center',
                  }}
                >
                  <Text
                    style={{
                      fontSize: tableFontSize,
                      fontFamily: 'Helvetica',
                      color: '#1e293b',
                    }}
                  >
                    {fullText}
                  </Text>
                </View>

                {/* Nivel formativo representado por círculo de color según la leyenda */}
                <View
                  style={{
                    width: 22,
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <View
                    style={{
                      width: 8.5,
                      height: 8.5,
                      borderRadius: 4.25,
                      backgroundColor: nivelRow.color,
                    }}
                  />
                </View>
              </View>
            );
          })}
        </View>
      </View>
    </View>
  );
};

/**
 * Genera la(s) página(s) A4 en orientación horizontal para un estudiante individual
 * (1 página estándar o 2 páginas si está configurado para dividir en dos hemisferios)
 */
export const FichaEvolutivaEstudiantePages: React.FC<
  EstudianteEvolutivoPDFProps
> = ({
  estudiante,
  evaluacionActual,
  nombreDocente,
  fotoDocenteUrl,
  nombreColegio,
  historialEtapas = [],
  catalogoActuaciones = [],
  etapasConfiguradas = [],
  studentEtapas = {},
  activeStages = { edi: true, ep1: true, ep2: true },
  chartLayoutMode = 'columnas',
  splitInTwo = false,
  orderDirection = 'horario',
  cardAdjustments: externalCardAdjustments,
  centerChartType: controlledCenterChartType,
  textScale,
  qrCodeDataUrl,
  qrVerificationUrl,
}) => {
  // Factor de escala de tipografía efectivo para el PDF
  const effectiveTextScale = parsePdfTextScale(textScale);

  // Tipo de gráfico central efectivo (radar poligonal o diana polar)
  const effectiveCenterChartType =
    controlledCenterChartType ||
    (typeof window !== 'undefined' ? loadStoredCenterChartType() : 'radar');

  // Catálogo ordenado y normalizado de actuaciones pedagógicas
  const orderedActuaciones = [...(catalogoActuaciones || [])]
    .map((item: any, idx) => ({
      ...item,
      order: item.order !== undefined ? Number(item.order) : idx + 1,
      actuacion:
        String(
          item.actuacion ||
          item.preguntaDocente ||
          item.actuaciones ||
          item.textoActuacion ||
          item.enunciado ||
          item.pregunta ||
          ''
        ).trim() || `Actuación Pedagógica N° ${item.order !== undefined ? item.order : idx + 1}`,
    }))
    .sort((a, b) => a.order - b.order);

  // Orden cronológico de las etapas configuradas
  const sortedEtapas = [...(etapasConfiguradas || [])].sort(
    (a, b) => (a.order ?? 0) - (b.order ?? 0)
  );

  // FEATURE DIVIDIR EN 2 GRÁFICOS: Genera un PDF de 2 páginas (mitad y mitad) aplicando el diseño seleccionado (columnas o flotante)
  const isSplit =
    (splitInTwo || chartLayoutMode === 'dividido') &&
    orderedActuaciones.length > 1;

  // Ajustes de posiciones y tamaños de tarjetas: utiliza los pasados o los recupera de localStorage para N (diferenciando si es split)
  const effectiveCardAdjustments =
    externalCardAdjustments ??
    (typeof window !== 'undefined'
      ? loadStoredCardAdjustments(orderedActuaciones.length, isSplit)
      : {});

  if (isSplit) {
    const midTotal = Math.ceil(orderedActuaciones.length / 2);
    const primeraMitad = orderedActuaciones.slice(0, midTotal);
    const segundaMitad = orderedActuaciones.slice(midTotal);

    const labelMitad1 = `Parte 1 de 2: Actuaciones ${primeraMitad[0]?.order} - ${primeraMitad[primeraMitad.length - 1]?.order}`;
    const labelMitad2 = `Parte 2 de 2: Actuaciones ${segundaMitad[0]?.order} - ${segundaMitad[segundaMitad.length - 1]?.order}`;

    const renderChartForSubset = (subset: ActuacionCatalogoItem[]) => {
      if (chartLayoutMode === 'diana') {
        return (
          <VectorRadarChartPDFDiana
            orderedActuaciones={subset}
            sortedEtapas={sortedEtapas}
            studentEtapas={studentEtapas}
            historialEtapas={historialEtapas}
            evaluacionActual={evaluacionActual}
            activeStages={activeStages}
            orderDirection={orderDirection}
            textScale={effectiveTextScale}
          />
        );
      }
      if (chartLayoutMode === 'flotante') {
        return (
          <VectorRadarChartPDFFlotante
            orderedActuaciones={subset}
            sortedEtapas={sortedEtapas}
            studentEtapas={studentEtapas}
            historialEtapas={historialEtapas}
            evaluacionActual={evaluacionActual}
            activeStages={activeStages}
            // Si el usuario movió/agrandó tarjetas en la vista dividida, se respetan; si no, actúa el algoritmo puro
            cardAdjustments={effectiveCardAdjustments}
            centerChartType={effectiveCenterChartType}
            textScale={effectiveTextScale}
          />
        );
      }
      return (
        <VectorRadarChartPDFColumnas
          orderedActuaciones={subset}
          sortedEtapas={sortedEtapas}
          studentEtapas={studentEtapas}
          historialEtapas={historialEtapas}
          evaluacionActual={evaluacionActual}
          activeStages={activeStages}
          orderDirection={orderDirection}
          centerChartType={effectiveCenterChartType}
          textScale={effectiveTextScale}
        />
      );
    };

    return (
      <React.Fragment>
        {/* PÁGINA 1: Primera Mitad de Actuaciones */}
        <Page size="A4" orientation="landscape" style={styles.page} wrap={false}>
          <HeaderIdentificacionPDF
            estudiante={estudiante}
            evaluacionActual={evaluacionActual}
            nombreDocente={nombreDocente}
            fotoDocenteUrl={fotoDocenteUrl}
            nombreColegio={nombreColegio}
            subtituloParte={labelMitad1}
            historialEtapas={historialEtapas}
            etapasConfiguradas={etapasConfiguradas}
            studentEtapas={studentEtapas}
            qrCodeDataUrl={qrCodeDataUrl}
            qrVerificationUrl={qrVerificationUrl}
            catalogoActuaciones={orderedActuaciones}
            chartLayoutMode={chartLayoutMode}
          />
          {renderChartForSubset(primeraMitad)}
        </Page>

        {/* PÁGINA 2: Segunda Mitad de Actuaciones */}
        <Page size="A4" orientation="landscape" style={styles.page} wrap={false}>
          <HeaderIdentificacionPDF
            estudiante={estudiante}
            evaluacionActual={evaluacionActual}
            nombreDocente={nombreDocente}
            fotoDocenteUrl={fotoDocenteUrl}
            nombreColegio={nombreColegio}
            subtituloParte={labelMitad2}
            historialEtapas={historialEtapas}
            etapasConfiguradas={etapasConfiguradas}
            studentEtapas={studentEtapas}
            qrCodeDataUrl={qrCodeDataUrl}
            qrVerificationUrl={qrVerificationUrl}
            catalogoActuaciones={orderedActuaciones}
            chartLayoutMode={chartLayoutMode}
          />
          {renderChartForSubset(segundaMitad)}
        </Page>
      </React.Fragment>
    );
  }

  return (
    <Page
      size="A4"
      orientation="landscape"
      style={styles.page}
      wrap={false}
    >
      {/* Cabecera institucional sobria con fotos carnet y datos de identificación */}
      <HeaderIdentificacionPDF
        estudiante={estudiante}
        evaluacionActual={evaluacionActual}
        nombreDocente={nombreDocente}
        fotoDocenteUrl={fotoDocenteUrl}
        nombreColegio={nombreColegio}
        historialEtapas={historialEtapas}
        etapasConfiguradas={etapasConfiguradas}
        studentEtapas={studentEtapas}
        qrCodeDataUrl={qrCodeDataUrl}
        qrVerificationUrl={qrVerificationUrl}
        catalogoActuaciones={orderedActuaciones}
        chartLayoutMode={chartLayoutMode}
      />

      {/* Gráfico Radar Vectorial de Actuaciones Pedagógicas */}
      {orderedActuaciones.length > 0 ? (
        chartLayoutMode === 'diana' ? (
          <VectorRadarChartPDFDiana
            orderedActuaciones={orderedActuaciones}
            sortedEtapas={sortedEtapas}
            studentEtapas={studentEtapas}
            historialEtapas={historialEtapas}
            evaluacionActual={evaluacionActual}
            activeStages={activeStages}
            orderDirection={orderDirection}
            textScale={effectiveTextScale}
          />
        ) : chartLayoutMode === 'flotante' ? (
          <VectorRadarChartPDFFlotante
            orderedActuaciones={orderedActuaciones}
            sortedEtapas={sortedEtapas}
            studentEtapas={studentEtapas}
            historialEtapas={historialEtapas}
            evaluacionActual={evaluacionActual}
            activeStages={activeStages}
            cardAdjustments={effectiveCardAdjustments}
            centerChartType={effectiveCenterChartType}
            textScale={effectiveTextScale}
          />
        ) : (
          <VectorRadarChartPDFColumnas
            orderedActuaciones={orderedActuaciones}
            sortedEtapas={sortedEtapas}
            studentEtapas={studentEtapas}
            historialEtapas={historialEtapas}
            evaluacionActual={evaluacionActual}
            activeStages={activeStages}
            orderDirection={orderDirection}
            centerChartType={effectiveCenterChartType}
            textScale={effectiveTextScale}
          />
        )
      ) : (
        <View style={styles.radarContainer}>
          <Text style={{ fontSize: 9, color: '#64748b', padding: 20 }}>
            No se registraron actuaciones pedagógicas para esta evaluación.
          </Text>
        </View>
      )}
    </Page>
  );
};

/**
 * Componente Documento React-PDF para la Ficha Evolutiva Horizontal de un solo estudiante
 */
export const FichaEvolutivaEstudiantePDFDocument: React.FC<
  EstudianteEvolutivoPDFProps
> = (props) => (
  <Document>
    <FichaEvolutivaEstudiantePages {...props} />
  </Document>
);

/**
 * Componente Documento React-PDF para consolidar a TODOS los estudiantes del aula en un único PDF
 */
export const FichaEvolutivaConsolidadoPDFDocument: React.FC<{
  estudiantes: EstudianteEvolutivoPDFProps[];
}> = ({ estudiantes }) => (
  <Document>
    {estudiantes.map((props, idx) => (
      <FichaEvolutivaEstudiantePages
        key={`consolidado-est-${props.estudiante.dni || idx}`}
        {...props}
      />
    ))}
  </Document>
);

/**
 * Genera un token determinista seguro de verificación para la ficha del estudiante.
 * Garantiza que solo quien tiene el QR físico pueda consultar o descargar la ficha digital.
 */
export function generateFichaToken(dni: string, evaluacionId: string): string {
  const secret = 'eva_ugel_ficha_token_secret_salt_2026';
  const str = `${dni}:${evaluacionId}:${secret}`;
  let hash1 = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash1 = (hash1 << 5) - hash1 + char;
    hash1 |= 0;
  }
  const hex1 = (hash1 >>> 0).toString(16).padStart(8, '0');

  let hash2 = 5381;
  for (let i = str.length - 1; i >= 0; i--) {
    hash2 = (hash2 * 33) ^ str.charCodeAt(i);
    hash2 |= 0;
  }
  const hex2 = (hash2 >>> 0).toString(16).padStart(8, '0');
  return `${hex1}${hex2}`;
}

/**
 * Asegura que las props del estudiante contengan el código QR vectorial/PNG generado
 * para la descarga digital directa por parte de padres de familia y estudiantes.
 */
export const asegurarQrPropsEstudiante = async (
  props: EstudianteEvolutivoPDFProps,
  baseUrl?: string
): Promise<EstudianteEvolutivoPDFProps> => {
  const origin =
    baseUrl ||
    (typeof window !== 'undefined' && window.location.origin
      ? window.location.origin
      : 'https://evaluaciones-ugel.web.app');

  const dni = props.estudiante.dni || '';
  const evalId = props.evaluacionActual?.id || '';
  const token = generateFichaToken(dni, evalId);

  // Preservar exactamente el diseño seleccionado al generar el QR
  const layout = props.chartLayoutMode || 'diana';
  const isSplit = Boolean(props.splitInTwo || props.chartLayoutMode === 'dividido');
  const dir = props.orderDirection || 'horario';
  const scale = props.textScale !== undefined ? String(props.textScale) : '1';
  const centerType =
    props.centerChartType ||
    (typeof window !== 'undefined' ? loadStoredCenterChartType() : 'radar');

  const queryParams = new URLSearchParams({
    dni,
    evalId,
    token,
    layout,
  });

  if (isSplit) {
    queryParams.set('split', '1');
  }
  if (dir && dir !== 'horario') {
    queryParams.set('dir', dir);
  }
  if (scale && scale !== '1') {
    queryParams.set('scale', scale);
  }
  if (centerType && centerType !== 'radar') {
    queryParams.set('center', centerType);
  }

  const targetUrl = `${origin}/descargar-ficha?${queryParams.toString()}`;

  // Si ya tiene QR generado para exactamente esta misma URL de destino, reutilizarlo
  if (props.qrCodeDataUrl && props.qrVerificationUrl === targetUrl) {
    return props;
  }

  try {
    const QRCodeMod = await import('qrcode');
    const QRCode = QRCodeMod.default || QRCodeMod;
    const qrCodeDataUrl = await QRCode.toDataURL(targetUrl, {
      margin: 1,
      width: 130,
      color: { dark: '#0f172a', light: '#ffffff' },
    });

    return {
      ...props,
      qrCodeDataUrl,
      qrVerificationUrl: targetUrl,
    };
  } catch (err) {
    console.warn('No se pudo generar código QR para el PDF del estudiante:', err);
    return props;
  }
};

/**
 * Función principal para compilar el PDF vectorial nativo de un estudiante individual y descargarlo en el navegador
 */
export const exportarFichaEvolutivaEstudiantePDF = async (
  props: EstudianteEvolutivoPDFProps
): Promise<Blob> => {
  const propsConQr = await asegurarQrPropsEstudiante(props);
  const blob = await pdf(
    <FichaEvolutivaEstudiantePDFDocument {...propsConQr} />
  ).toBlob();

  if (typeof window !== 'undefined' && typeof document !== 'undefined') {
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    const sanitizedName = (props.estudiante.apellidos || 'Estudiante').replace(
      /\s+/g,
      '_'
    );
    link.download = `Radar_${sanitizedName}_${
      props.estudiante.dni || 'DNI'
    }.pdf`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }

  return blob;
};

/**
 * Función para compilar y descargar el PDF consolidado con todas las fichas de los estudiantes en un solo archivo
 */
export const exportarFichaEvolutivaConsolidadoPDF = async (
  estudiantesProps: EstudianteEvolutivoPDFProps[],
  nombreArchivo?: string
): Promise<Blob> => {
  if (!estudiantesProps || estudiantesProps.length === 0) {
    throw new Error('No hay estudiantes para exportar en el consolidado.');
  }

  const propsConQr = await Promise.all(
    estudiantesProps.map((p) => asegurarQrPropsEstudiante(p))
  );

  const blob = await pdf(
    <FichaEvolutivaConsolidadoPDFDocument estudiantes={propsConQr} />
  ).toBlob();

  if (typeof window !== 'undefined' && typeof document !== 'undefined') {
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = nombreArchivo || 'Radar_Consolidado_Aula_Completa.pdf';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }

  return blob;
};

/**
 * Abre el cuadro de diálogo de la impresora nativo del navegador para un Blob de PDF,
 * utilizando un iframe invisible en background y con respaldo directo por si el navegador
 * restringe la interacción en iframes con plugins PDF.
 */
export const imprimirBlobPDF = async (blob: Blob): Promise<void> => {
  if (typeof window === 'undefined' || typeof document === 'undefined') return;

  const blobUrl = URL.createObjectURL(blob);

  return new Promise<void>((resolve) => {
    try {
      const frameId = 'eva-pdf-print-iframe';
      const existingFrame = document.getElementById(frameId);
      if (existingFrame && existingFrame.parentNode) {
        existingFrame.parentNode.removeChild(existingFrame);
      }

      const iframe = document.createElement('iframe');
      iframe.id = frameId;
      iframe.style.position = 'fixed';
      iframe.style.right = '0';
      iframe.style.bottom = '0';
      iframe.style.width = '0';
      iframe.style.height = '0';
      iframe.style.border = '0';
      iframe.style.visibility = 'hidden';
      iframe.src = blobUrl;

      let isFinished = false;
      const finish = () => {
        if (isFinished) return;
        isFinished = true;
        window.removeEventListener('afterprint', finish);
        window.removeEventListener('focus', onFocus);
        resolve();
      };

      const onFocus = () => {
        // Al recuperar el foco tras cerrar el diálogo modal de impresión nativo
        setTimeout(finish, 150);
      };

      // Escuchar eventos globales de fin de impresión y recuperación de foco
      window.addEventListener('afterprint', finish);
      window.addEventListener('focus', onFocus);

      // Limpieza de recursos (iframe y blobUrl) en segundo plano después de 1 minuto (no bloquea la UI)
      setTimeout(() => {
        try {
          if (iframe.parentNode) {
            iframe.parentNode.removeChild(iframe);
          }
          URL.revokeObjectURL(blobUrl);
        } catch {
          // ignore
        }
      }, 60000);

      let hasTriggered = false;
      const doPrint = () => {
        if (hasTriggered) return;
        hasTriggered = true;

        try {
          if (iframe.contentWindow) {
            try {
              iframe.contentWindow.addEventListener('afterprint', finish);
            } catch {
              // ignore si el navegador bloquea listener interno en el iframe
            }
            iframe.contentWindow.focus();
            iframe.contentWindow.print();
            // Si print() fue bloqueante (síncrono), el usuario ya cerró el diálogo al llegar aquí.
            // Si fue asíncrono, liberamos tras un breve respiro para que el loader no quede colgado.
            setTimeout(finish, 500);
          } else {
            throw new Error('No contentWindow in iframe');
          }
        } catch (e) {
          console.warn('Iframe print no admitido en este navegador, abriendo ventana directa:', e);
          const printWin = window.open(blobUrl, '_blank');
          if (printWin) {
            printWin.focus();
            try {
              printWin.print();
            } catch {
              // ignore
            }
          }
          finish();
        }
      };

      iframe.onload = () => {
        setTimeout(doPrint, 400);
      };

      document.body.appendChild(iframe);

      // Respaldo por si el evento onload de plugins PDF internos no dispara
      setTimeout(doPrint, 1800);

      // Timeout máximo de seguridad: a los 4 segundos liberar siempre el estado de carga
      setTimeout(finish, 4000);
    } catch (err) {
      console.error('Error al inicializar diálogo de impresión:', err);
      const printWin = window.open(blobUrl, '_blank');
      if (printWin) {
        printWin.focus();
      }
      resolve();
    }
  });
};

/**
 * Compila la ficha evolutiva del estudiante y abre directamente el diálogo nativo de la impresora
 */
export const imprimirFichaEvolutivaEstudiantePDF = async (
  props: EstudianteEvolutivoPDFProps
): Promise<void> => {
  const propsConQr = await asegurarQrPropsEstudiante(props);
  const blob = await pdf(
    <FichaEvolutivaEstudiantePDFDocument {...propsConQr} />
  ).toBlob();
  await imprimirBlobPDF(blob);
};

/**
 * Compila el consolidado de todas las fichas del aula y abre directamente el diálogo nativo de la impresora
 */
export const imprimirFichaEvolutivaConsolidadoPDF = async (
  estudiantesProps: EstudianteEvolutivoPDFProps[]
): Promise<void> => {
  if (!estudiantesProps || estudiantesProps.length === 0) {
    throw new Error('No hay estudiantes para imprimir en el consolidado.');
  }

  const propsConQr = await Promise.all(
    estudiantesProps.map((p) => asegurarQrPropsEstudiante(p))
  );

  const blob = await pdf(
    <FichaEvolutivaConsolidadoPDFDocument estudiantes={propsConQr} />
  ).toBlob();
  await imprimirBlobPDF(blob);
};
