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
  Image,
  StyleSheet,
  pdf,
} from '@react-pdf/renderer';
import { converSeccion, getGradoTexto } from '../../fuctions/regiones';
import { ActuacionCatalogoItem } from '../../components/reportes/estudiante/useDocenteEvolucionEstudiantes';
import { loadStoredCardAdjustments } from '../../components/reportes/estudiante/DocenteActuacionesRadarChart';

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
  };
  evaluacionActual: {
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
  chartLayoutMode?: 'columnas' | 'flotante' | 'dividido';
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
    fillOpacity: 0.22,
    label: 'EDI (Diagnóstica)',
  },
  ep1: {
    border: '#f59e0b', // Ámbar oficial EVA
    bg: '#f59e0b',
    fillOpacity: 0.22,
    label: 'EP1 (Progresiva 1)',
  },
  ep2: {
    border: '#10b981', // Verde esmeralda oficial EVA
    bg: '#10b981',
    fillOpacity: 0.25,
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
    paddingVertical: 6,
    paddingHorizontal: 16,
    fontFamily: 'Helvetica',
    fontSize: 8,
    color: '#1e293b',
    backgroundColor: '#ffffff',
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    width: '100%',
    paddingBottom: 4,
    marginBottom: 4,
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
    fontSize: 8.5,
    fontFamily: 'Helvetica-Bold',
    color: '#334155',
  },
  personValue: {
    fontSize: 8.5,
    fontFamily: 'Helvetica-Bold',
    color: '#0f172a',
    marginLeft: 4,
    flex: 1,
  },
  personSubRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 2.5,
  },
  personSubLabel: {
    fontSize: 7.2,
    fontFamily: 'Helvetica-Bold',
    color: '#64748b',
  },
  personSubValue: {
    fontSize: 7.2,
    fontFamily: 'Helvetica',
    color: '#1e293b',
    marginLeft: 4,
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
    marginTop: 5,
    paddingBottom: 2,
    paddingHorizontal: 12,
  },
  radarLegendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: 8,
    marginVertical: 2,
  },
  radarLegendSwatch: {
    width: 14,
    height: 8,
    borderRadius: 1.5,
    marginRight: 5,
  },
  radarLegendText: {
    fontSize: 7.5,
    fontFamily: 'Helvetica-Bold',
    color: '#334155',
  },
  columnsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    width: '100%',
    paddingHorizontal: 0,
    paddingVertical: 2,
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
    width: 365,
    marginHorizontal: 10,
    alignItems: 'center',
    justifyContent: 'center',
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
}> = ({
  estudiante,
  evaluacionActual,
  nombreDocente,
  fotoDocenteUrl,
  nombreColegio,
  subtituloParte,
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

  return (
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
          <View style={styles.personTitleRow}>
            <Text style={styles.personLabel}>Estudiante:</Text>
            <Text style={styles.personValue}>{nombreEstudiante}</Text>
          </View>
          {estudiante?.dni && (
            <View style={styles.personSubRow}>
              <Text style={styles.personSubLabel}>DNI:</Text>
              <Text style={styles.personSubValue}>{estudiante.dni}</Text>
            </View>
          )}
          <View style={styles.personSubRow}>
            <Text style={styles.personSubLabel}>Grado:</Text>
            <Text style={styles.personSubValue}>{gradoSeccion}</Text>
          </View>
          <View style={styles.personSubRow}>
            <Text style={styles.personSubLabel}>Institución:</Text>
            <Text style={styles.personSubValue}>
              {nombreColegio || 'I.E. Sin registro'}
            </Text>
          </View>
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
              <Text style={[styles.personSubLabel, { color: '#2563eb' }]}>Hoja / Parte:</Text>
              <Text
                style={[
                  styles.personSubValue,
                  { fontFamily: 'Helvetica-Bold', color: '#1e40af' },
                ]}
              >
                {subtituloParte}
              </Text>
            </View>
          )}
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
    <View style={styles.radarLegendContainer}>
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
}> = ({
  orderedActuaciones,
  sortedEtapas,
  studentEtapas = {},
  historialEtapas = [],
  evaluacionActual,
  activeStages = { edi: true, ep1: true, ep2: true },
  cardAdjustments = {},
  textScale = 1.0,
}) => {
  const N = orderedActuaciones.length;
  if (N === 0) return null;

  // Centro geométrico y radios adaptados al lienzo apaisado A4 completo (Landscape)
  // ViewBox: 0 0 1000 656 (Aprovecha todo el ancho y alto disponible en A4)
  const cx = 500;
  const cy = 328;
  const R = N > 16 ? 128 : 118; // Radio exterior del radar web
  const r1 = R / 2; // Anillo 1: NO (64 o 59)
  const r2 = R; // Anillo 2: SÍ (128 o 118)

  // Filtrar etapas activas respetando el orden cronológico
  const activeEtapasList = sortedEtapas.filter(
    (et) => activeStages[et.key] ?? true
  );
  const totalActive = activeEtapasList.length;

  // Algoritmo de Dispersión Periférica Inteligente y Autoajuste al Contenedor:
  // Separa las tarjetas en zonas perimetrales (Top, Bottom, Right, Left)
  // y las distribuye vertical y horizontalmente ocupando todo el lienzo A4 sin colisiones.
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

    let targetX = 660;
    if (rightGroup.length >= 8) {
      const colPattern = [1, 2, 0];
      const col = colPattern[idx % 3];
      if (col === 2) targetX = 990 - spoke.boxW;
      else if (col === 1) targetX = 765;
      else targetX = 650;
    } else if (rightGroup.length >= 4) {
      const isOuterCol = idx % 2 === 1;
      targetX = isOuterCol ? 780 : 660;
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

    let targetX = 340;
    if (leftGroup.length >= 8) {
      const colPattern = [1, 2, 0];
      const col = colPattern[idx % 3];
      if (col === 2) targetX = 10 + spoke.boxW;
      else if (col === 1) targetX = 235;
      else targetX = 350;
    } else if (leftGroup.length >= 4) {
      const isOuterCol = idx % 2 === 1;
      targetX = isOuterCol ? 220 : 340;
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
  const webSvgHeight = Math.max(760, 520 + N * 18);
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
    <View style={styles.radarContainerFlotante}>
      <Svg width={800} height={430} viewBox="0 0 1000 656">
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
            <Circle cx={ep.sx} cy={ep.sy} r={2.0} fill="#94a3b8" />
          </React.Fragment>
        ))}

        {/* Polígonos de evaluación: del más antiguo (edi) al más actual (ep2).
            En SVG, los últimos elementos se dibujan ENCIMA, por lo que el más actual queda superpuesto. */}
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

          // Coordenadas polares para cada actuación
          const points = orderedActuaciones.map((act, i) => {
            const val = etapaData.actuacionesResultados?.[act.order] ?? 1;
            const rVal = (val * R) / 2;
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
                fillOpacity={color.fillOpacity}
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
  maxAvailableHeight: number = 515,
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
}> = ({
  orderedActuaciones,
  sortedEtapas,
  studentEtapas = {},
  historialEtapas = [],
  evaluacionActual,
  activeStages = { edi: true, ep1: true, ep2: true },
  orderDirection = 'horario',
  textScale = 1.0,
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

  // Dimensiones del SVG central: 365 x 450 (calibrado para marco físico real de mini carnet 2.5x3cm)
  const svgWidth = 365;
  const svgHeight = 450;
  const cx = svgWidth / 2;
  const cy = svgHeight / 2;
  const R = 130; // Radio exterior del radar calibrado con holgura para mini carnet
  const r1 = R / 2; // Radio intermedio (NO = 1) = 65
  const r2 = R; // Radio exterior = 130
  const rBadge = R + 20; // Radio de los badges numéricos = 150

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
  } = calibratePdfColumnMetrics(leftColumn, rightColumn, 450, textScale);
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
        {act.actuacion}
      </Text>
    </View>
  );

  return (
    <View style={styles.radarContainer}>
      <View style={styles.columnsContainer}>
        {/* Columna Izquierda: Actuaciones Hemisferio Izquierdo */}
        <View style={styles.lateralColumn}>
          {leftColumn.length > 0 && (
            <Text style={styles.columnHeader}>
              {`Actuaciones ${leftColumn[0]?.order} - ${leftColumn[leftColumn.length - 1]?.order} (Izquierda)`.toUpperCase()}
            </Text>
          )}
          {leftColumn.map(renderPdfCompactCard)}
        </View>

        {/* Columna Central: Radar Limpio con Números en el Perímetro */}
        <View style={styles.radarCenterColumn}>
          <Svg width={svgWidth} height={svgHeight} viewBox={`0 0 ${svgWidth} ${svgHeight}`}>
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
                const val = etapaData.actuacionesResultados?.[act.order] ?? 1;
                const rVal = (val * R) / 2;
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
                    fillOpacity={color.fillOpacity}
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
 * Componente Documento React-PDF para la Ficha Evolutiva Horizontal (Solo Gráfico y Actuaciones a Página Completa)
 */
export const FichaEvolutivaEstudiantePDFDocument: React.FC<
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
  textScale,
}) => {
  // Factor de escala de tipografía efectivo para el PDF
  const effectiveTextScale = parsePdfTextScale(textScale);

  // Catálogo ordenado de actuaciones
  const orderedActuaciones = [...(catalogoActuaciones || [])].sort(
    (a, b) => a.order - b.order
  );

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
          textScale={effectiveTextScale}
        />
      );
    };

    return (
      <Document>
        {/* PÁGINA 1: Primera Mitad de Actuaciones */}
        <Page size="A4" orientation="landscape" style={styles.page}>
          <HeaderIdentificacionPDF
            estudiante={estudiante}
            evaluacionActual={evaluacionActual}
            nombreDocente={nombreDocente}
            fotoDocenteUrl={fotoDocenteUrl}
            nombreColegio={nombreColegio}
            subtituloParte={labelMitad1}
          />
          {renderChartForSubset(primeraMitad)}
        </Page>

        {/* PÁGINA 2: Segunda Mitad de Actuaciones */}
        <Page size="A4" orientation="landscape" style={styles.page}>
          <HeaderIdentificacionPDF
            estudiante={estudiante}
            evaluacionActual={evaluacionActual}
            nombreDocente={nombreDocente}
            fotoDocenteUrl={fotoDocenteUrl}
            nombreColegio={nombreColegio}
            subtituloParte={labelMitad2}
          />
          {renderChartForSubset(segundaMitad)}
        </Page>
      </Document>
    );
  }

  return (
    <Document>
      <Page
        size="A4"
        orientation="landscape"
        style={styles.page}
      >
        {/* Cabecera institucional sobria con fotos carnet y datos de identificación */}
        <HeaderIdentificacionPDF
          estudiante={estudiante}
          evaluacionActual={evaluacionActual}
          nombreDocente={nombreDocente}
          fotoDocenteUrl={fotoDocenteUrl}
          nombreColegio={nombreColegio}
        />

        {/* Gráfico Radar Vectorial de Actuaciones Pedagógicas */}
        {orderedActuaciones.length > 0 ? (
          chartLayoutMode === 'flotante' ? (
            <VectorRadarChartPDFFlotante
              orderedActuaciones={orderedActuaciones}
              sortedEtapas={sortedEtapas}
              studentEtapas={studentEtapas}
              historialEtapas={historialEtapas}
              evaluacionActual={evaluacionActual}
              activeStages={activeStages}
              cardAdjustments={effectiveCardAdjustments}
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
    </Document>
  );
};

/**
 * Función principal para compilar el PDF vectorial nativo y descargarlo en el navegador
 */
export const exportarFichaEvolutivaEstudiantePDF = async (
  props: EstudianteEvolutivoPDFProps
): Promise<Blob> => {
  const blob = await pdf(
    <FichaEvolutivaEstudiantePDFDocument {...props} />
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
