import ExcelJS from 'exceljs';
import {
  UgelMatrizComparativaRow,
} from '@/features/hooks/useMatrizResultados';
import { PreguntasRespuestas } from '@/features/types/types';
import { ColumnVisibilityConfig } from '@/components/reportes/TablaMatrizComparativa';

interface ExportarMatrizExcelOptions {
  data: UgelMatrizComparativaRow[];
  totalGeneral?: {
    rc?: { edi?: number; ep1?: number; ep2?: number };
    puntaje?: { edi?: number; ep1?: number; ep2?: number };
    niveles?: Array<{
      id?: string | number;
      nivel: string;
      color?: string;
      edi?: { cantidad: number; porcentaje: number };
      ep1?: { cantidad: number; porcentaje: number };
      ep2?: { cantidad: number; porcentaje: number };
    }>;
    preguntas?: Record<
      number,
      {
        edi?: { total: number; correctas: number; porcentaje: number };
        ep1?: { total: number; correctas: number; porcentaje: number };
        ep2?: { total: number; correctas: number; porcentaje: number };
      }
    > | Array<{
      order: number;
      edi?: { total: number; correctas: number; porcentaje: number };
      ep1?: { total: number; correctas: number; porcentaje: number };
      ep2?: { total: number; correctas: number; porcentaje: number };
    }>;
  } | null;
  activeStages: ('edi' | 'ep1' | 'ep2')[];
  colVisibility: ColumnVisibilityConfig;
  visiblePreguntas: PreguntasRespuestas[];
  gradoName?: string;
  yearSelected?: number | string;
}

// Colores oficiales ARGB para ExcelJS
const ARGB = {
  NAVY_HEADER: 'FF1E3A8A',
  SLATE_HEADER: 'FF1E293B',
  TEAL_HEADER: 'FF0F766E',
  BLUE_HEADER: 'FF1D4ED8',
  INDIGO_HEADER: 'FF4338CA',
  SLATE_DARK: 'FF334155',
  WHITE: 'FFFFFFFF',
  GRAY_SUBTITLE: 'FFF1F5F9',
  TEXT_MUTED: 'FF475569',
  BORDER_COLOR: 'FFCBD5E1',

  // Etapas Sub-headers
  STAGE_EDI: 'FFDBEAFE', // Azul suave
  STAGE_EDI_TEXT: 'FF1E40AF',
  STAGE_EP1: 'FFFEF3C7', // Ámbar suave
  STAGE_EP1_TEXT: 'FF92400E',
  STAGE_EP2: 'FFEDE9FE', // Púrpura suave
  STAGE_EP2_TEXT: 'FF5B21B6',

  // Niveles de Logro oficiales CNEB
  NIVEL_SATISFACTORIO: 'FF9BBB58',
  NIVEL_PROCESO: 'FFF89646',
  NIVEL_INICIO: 'FFA64E4D',
  NIVEL_PREVIO: 'FFA5A5A5',

  // Fondos suaves para celdas de nivel
  BG_SATISFACTORIO: 'FFF0FDF4',
  BG_PROCESO: 'FFFFFBEB',
  BG_INICIO: 'FFFEF2F2',
  BG_PREVIO: 'FFF8FAFC',

  // Semáforo Preguntas
  SEM_GREEN_BG: 'FFDCFCE7',
  SEM_GREEN_TEXT: 'FF166534',
  SEM_YELLOW_BG: 'FFFEF9C3',
  SEM_YELLOW_TEXT: 'FF854D0E',
  SEM_RED_BG: 'FFFEE2E2',
  SEM_RED_TEXT: 'FF991B1B',
  SEM_EMPTY_TEXT: 'FF94A3B8',
};

const getNivelHeaderColor = (nombreNivel: string): { bg: string; text: string } => {
  const clean = (nombreNivel || '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .trim();

  if (clean.includes('satisfactorio')) return { bg: ARGB.NIVEL_SATISFACTORIO, text: ARGB.WHITE };
  if (clean.includes('proceso')) return { bg: ARGB.NIVEL_PROCESO, text: ARGB.WHITE };
  if (clean.includes('inicio') && !clean.includes('previo')) return { bg: ARGB.NIVEL_INICIO, text: ARGB.WHITE };
  if (clean.includes('previo')) return { bg: ARGB.NIVEL_PREVIO, text: ARGB.WHITE };
  return { bg: ARGB.SLATE_DARK, text: ARGB.WHITE };
};

const getNivelCellBg = (nombreNivel: string): string => {
  const clean = (nombreNivel || '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .trim();

  if (clean.includes('satisfactorio')) return ARGB.BG_SATISFACTORIO;
  if (clean.includes('proceso')) return ARGB.BG_PROCESO;
  if (clean.includes('inicio') && !clean.includes('previo')) return ARGB.BG_INICIO;
  if (clean.includes('previo')) return ARGB.BG_PREVIO;
  return ARGB.WHITE;
};

export const exportarMatrizComparativaExcel = async ({
  data,
  totalGeneral,
  activeStages,
  colVisibility,
  visiblePreguntas,
  gradoName = 'Resultados',
  yearSelected = new Date().getFullYear(),
}: ExportarMatrizExcelOptions): Promise<void> => {
  if (!data || data.length === 0) return;

  const workbook = new ExcelJS.Workbook();
  workbook.creator = 'UGEL - Competence Lab';
  workbook.lastModifiedBy = 'Plataforma EVA';
  workbook.created = new Date();

  const worksheet = workbook.addWorksheet('Matriz Comparativa UGEL', {
    views: [{ showGridLines: true, state: 'frozen', xSplit: 2, ySplit: 5 }],
  });

  const stagesCount = activeStages.length;
  if (stagesCount === 0) return;

  // Consolidado seguro y tipado
  const safeRc: { edi?: number; ep1?: number; ep2?: number } = totalGeneral?.rc || {};
  const safePuntaje: { edi?: number; ep1?: number; ep2?: number } = totalGeneral?.puntaje || {};
  const safeNiveles = totalGeneral?.niveles || [];
  const safePreguntas = totalGeneral?.preguntas || {};

  // Lista de niveles presentes en la primera fila de datos (o safeNiveles)
  const availableNiveles = data[0]?.niveles || safeNiveles || [];

  // 1. BANNER INSTITUCIONAL (Filas 1 y 2)
  worksheet.mergeCells('A1:Z1');
  const titleCell = worksheet.getCell('A1');
  titleCell.value = 'EVALUACIÓN REGIONAL DE APRENDIZAJES - MATRIZ COMPARATIVA POR UGEL';
  titleCell.font = { name: 'Calibri', size: 14, bold: true, color: { argb: ARGB.WHITE } };
  titleCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: ARGB.NAVY_HEADER } };
  titleCell.alignment = { vertical: 'middle', horizontal: 'center' };
  worksheet.getRow(1).height = 30;

  worksheet.mergeCells('A2:Z2');
  const subTitleCell = worksheet.getCell('A2');
  subTitleCell.value = `GRADO / ÁREA: ${gradoName.toUpperCase()}   |   AÑO LECTIVO: ${yearSelected}   |   FECHA DE DESCARGA: ${new Date().toLocaleDateString('es-PE')}`;
  subTitleCell.font = { name: 'Calibri', size: 10, italic: true, color: { argb: ARGB.TEXT_MUTED } };
  subTitleCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: ARGB.GRAY_SUBTITLE } };
  subTitleCell.alignment = { vertical: 'middle', horizontal: 'center' };
  worksheet.getRow(2).height = 20;

  // Fila 3 vacía
  worksheet.getRow(3).height = 10;

  // Definición de columnas y cabeceras multinivel
  // Fila 4 = Grupo Nivel 1 (Mayor)
  // Fila 5 = Subcabecera Nivel 2 (Etapas: EDI, EP1, EP2)
  const row4 = worksheet.getRow(4);
  const row5 = worksheet.getRow(5);
  row4.height = 28;
  row5.height = 22;

  let currentCol = 1;

  // Helper para bordes estándar
  const thinBorder: Partial<ExcelJS.Borders> = {
    top: { style: 'thin', color: { argb: ARGB.BORDER_COLOR } },
    bottom: { style: 'thin', color: { argb: ARGB.BORDER_COLOR } },
    left: { style: 'thin', color: { argb: ARGB.BORDER_COLOR } },
    right: { style: 'thin', color: { argb: ARGB.BORDER_COLOR } },
  };

  const applyHeaderStyle = (
    cell: ExcelJS.Cell,
    bg: string,
    textColor: string = ARGB.WHITE,
    bold: boolean = true,
    size: number = 10
  ) => {
    cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: bg } };
    cell.font = { name: 'Calibri', size, bold, color: { argb: textColor } };
    cell.alignment = { vertical: 'middle', horizontal: 'center', wrapText: true };
    cell.border = thinBorder;
  };

  // N°
  worksheet.mergeCells(4, currentCol, 5, currentCol);
  applyHeaderStyle(worksheet.getCell(4, currentCol), ARGB.SLATE_HEADER);
  worksheet.getCell(4, currentCol).value = 'N°';
  worksheet.getColumn(currentCol).width = 6;
  currentCol++;

  // UGEL
  worksheet.mergeCells(4, currentCol, 5, currentCol);
  applyHeaderStyle(worksheet.getCell(4, currentCol), ARGB.SLATE_HEADER);
  worksheet.getCell(4, currentCol).value = 'UGEL / JURISDICCIÓN';
  worksheet.getColumn(currentCol).width = 34;
  currentCol++;

  // R.C. (Aciertos Prom.)
  if (colVisibility.showRc) {
    const startCol = currentCol;
    const endCol = currentCol + stagesCount - 1;
    worksheet.mergeCells(4, startCol, 4, endCol);
    applyHeaderStyle(worksheet.getCell(4, startCol), ARGB.TEAL_HEADER);
    worksheet.getCell(4, startCol).value = 'R.C (Aciertos Prom.)';

    activeStages.forEach((etapa, idx) => {
      const c = worksheet.getCell(5, startCol + idx);
      const isEdi = etapa === 'edi';
      const isEp1 = etapa === 'ep1';
      applyHeaderStyle(
        c,
        isEdi ? ARGB.STAGE_EDI : isEp1 ? ARGB.STAGE_EP1 : ARGB.STAGE_EP2,
        isEdi ? ARGB.STAGE_EDI_TEXT : isEp1 ? ARGB.STAGE_EP1_TEXT : ARGB.STAGE_EP2_TEXT,
        true,
        9
      );
      c.value = etapa.toUpperCase();
      worksheet.getColumn(startCol + idx).width = 11;
    });

    currentCol = endCol + 1;
  }

  // PUNTAJE PROMEDIO
  if (colVisibility.showPuntaje) {
    const startCol = currentCol;
    const endCol = currentCol + stagesCount - 1;
    worksheet.mergeCells(4, startCol, 4, endCol);
    applyHeaderStyle(worksheet.getCell(4, startCol), ARGB.BLUE_HEADER);
    worksheet.getCell(4, startCol).value = 'PUNTAJE PROMEDIO';

    activeStages.forEach((etapa, idx) => {
      const c = worksheet.getCell(5, startCol + idx);
      const isEdi = etapa === 'edi';
      const isEp1 = etapa === 'ep1';
      applyHeaderStyle(
        c,
        isEdi ? ARGB.STAGE_EDI : isEp1 ? ARGB.STAGE_EP1 : ARGB.STAGE_EP2,
        isEdi ? ARGB.STAGE_EDI_TEXT : isEp1 ? ARGB.STAGE_EP1_TEXT : ARGB.STAGE_EP2_TEXT,
        true,
        9
      );
      c.value = etapa.toUpperCase();
      worksheet.getColumn(startCol + idx).width = 11;
    });

    currentCol = endCol + 1;
  }

  // NIVELES DE LOGRO CNEB (Un bloque por cada nivel: Satisfactorio, Proceso, etc.)
  if (colVisibility.showNiveles) {
    availableNiveles.forEach((n) => {
      const startCol = currentCol;
      const endCol = currentCol + stagesCount - 1;
      const { bg, text } = getNivelHeaderColor(n.nivel);

      worksheet.mergeCells(4, startCol, 4, endCol);
      applyHeaderStyle(worksheet.getCell(4, startCol), bg, text, true, 10);
      worksheet.getCell(4, startCol).value = n.nivel.toUpperCase();

      activeStages.forEach((etapa, idx) => {
        const c = worksheet.getCell(5, startCol + idx);
        const isEdi = etapa === 'edi';
        const isEp1 = etapa === 'ep1';
        applyHeaderStyle(
          c,
          isEdi ? ARGB.STAGE_EDI : isEp1 ? ARGB.STAGE_EP1 : ARGB.STAGE_EP2,
          isEdi ? ARGB.STAGE_EDI_TEXT : isEp1 ? ARGB.STAGE_EP1_TEXT : ARGB.STAGE_EP2_TEXT,
          true,
          9
        );
        c.value = etapa.toUpperCase();
        worksheet.getColumn(startCol + idx).width = 11;
      });

      currentCol = endCol + 1;
    });
  }

  // PREGUNTAS (P01, P02, etc.)
  if (colVisibility.showPreguntas) {
    visiblePreguntas.forEach((p, qIdx) => {
      const order = p.order !== undefined ? Number(p.order) : qIdx + 1;
      const orderStr = order < 10 ? `P0${order}` : `P${order}`;

      const startCol = currentCol;
      const endCol = currentCol + stagesCount - 1;
      worksheet.mergeCells(4, startCol, 4, endCol);
      applyHeaderStyle(worksheet.getCell(4, startCol), ARGB.INDIGO_HEADER);
      worksheet.getCell(4, startCol).value = orderStr;

      activeStages.forEach((etapa, idx) => {
        const c = worksheet.getCell(5, startCol + idx);
        const isEdi = etapa === 'edi';
        const isEp1 = etapa === 'ep1';
        applyHeaderStyle(
          c,
          isEdi ? ARGB.STAGE_EDI : isEp1 ? ARGB.STAGE_EP1 : ARGB.STAGE_EP2,
          isEdi ? ARGB.STAGE_EDI_TEXT : isEp1 ? ARGB.STAGE_EP1_TEXT : ARGB.STAGE_EP2_TEXT,
          true,
          9
        );
        c.value = etapa.toUpperCase();
        worksheet.getColumn(startCol + idx).width = 9.5;
      });

      currentCol = endCol + 1;
    });
  }

  const lastColIndex = currentCol - 1;

  // Ajustar banner superior al ancho total exacto de columnas
  worksheet.unMergeCells('A1:Z1');
  worksheet.unMergeCells('A2:Z2');
  worksheet.mergeCells(1, 1, 1, lastColIndex);
  worksheet.mergeCells(2, 1, 2, lastColIndex);

  // 2. FILAS DE DATOS (Por cada UGEL)
  let currentRow = 6;

  data.forEach((row, rIdx) => {
    const isEven = rIdx % 2 === 0;
    const rowBg = isEven ? ARGB.WHITE : 'FFF8FAFC';
    let cIdx = 1;

    // N°
    const cNum = worksheet.getCell(currentRow, cIdx++);
    cNum.value = row.index;
    cNum.alignment = { vertical: 'middle', horizontal: 'center' };
    cNum.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: rowBg } };
    cNum.border = thinBorder;
    cNum.font = { name: 'Calibri', size: 9.5 };

    // UGEL
    const cUgel = worksheet.getCell(currentRow, cIdx++);
    cUgel.value = row.nombre;
    cUgel.alignment = { vertical: 'middle', horizontal: 'left' };
    cUgel.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: rowBg } };
    cUgel.border = thinBorder;
    cUgel.font = { name: 'Calibri', size: 9.5, bold: true, color: { argb: 'FF1E293B' } };

    // R.C.
    if (colVisibility.showRc) {
      activeStages.forEach((etapa) => {
        const c = worksheet.getCell(currentRow, cIdx++);
        const val = row.rc[etapa];
        c.value = val !== undefined && val !== null ? Number(val.toFixed(1)) : '-';
        c.alignment = { vertical: 'middle', horizontal: 'center' };
        c.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: rowBg } };
        c.border = thinBorder;
        c.font = { name: 'Calibri', size: 9.5 };
        if (typeof c.value === 'number') c.numFmt = '0.0';
      });
    }

    // Puntaje
    if (colVisibility.showPuntaje) {
      activeStages.forEach((etapa) => {
        const c = worksheet.getCell(currentRow, cIdx++);
        const val = row.puntaje[etapa];
        c.value = val !== undefined && val !== null ? Number(val.toFixed(1)) : '-';
        c.alignment = { vertical: 'middle', horizontal: 'center' };
        c.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: rowBg } };
        c.border = thinBorder;
        c.font = { name: 'Calibri', size: 9.5, bold: true };
        if (typeof c.value === 'number') c.numFmt = '0.0';
      });
    }

    // Niveles
    if (colVisibility.showNiveles) {
      availableNiveles.forEach((nItem, nIdx) => {
        const nData = row.niveles?.[nIdx];
        const cellBg = getNivelCellBg(nItem.nivel);

        activeStages.forEach((etapa) => {
          const c = worksheet.getCell(currentRow, cIdx++);
          const stat = nData?.[etapa];
          c.value = stat !== undefined ? `${stat.porcentaje}%` : '-';
          c.alignment = { vertical: 'middle', horizontal: 'center' };
          c.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: cellBg } };
          c.border = thinBorder;
          c.font = { name: 'Calibri', size: 9.5, bold: stat !== undefined && stat.porcentaje >= 50 };
        });
      });
    }

    // Preguntas (con semáforo condicional de aciertos)
    if (colVisibility.showPreguntas) {
      visiblePreguntas.forEach((p, qIdx) => {
        const order = p.order !== undefined ? Number(p.order) : qIdx + 1;
        const pStat = row.preguntas?.[order];

        activeStages.forEach((etapa) => {
          const c = worksheet.getCell(currentRow, cIdx++);
          const stat = pStat?.[etapa];
          const pct = stat?.porcentaje;

          c.alignment = { vertical: 'middle', horizontal: 'center' };
          c.border = thinBorder;

          if (pct === undefined || isNaN(pct)) {
            c.value = '-';
            c.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: rowBg } };
            c.font = { name: 'Calibri', size: 9, color: { argb: ARGB.SEM_EMPTY_TEXT } };
          } else {
            c.value = `${pct}%`;
            if (pct >= 70) {
              c.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: ARGB.SEM_GREEN_BG } };
              c.font = { name: 'Calibri', size: 9.5, bold: true, color: { argb: ARGB.SEM_GREEN_TEXT } };
            } else if (pct >= 50) {
              c.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: ARGB.SEM_YELLOW_BG } };
              c.font = { name: 'Calibri', size: 9.5, bold: true, color: { argb: ARGB.SEM_YELLOW_TEXT } };
            } else {
              c.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: ARGB.SEM_RED_BG } };
              c.font = { name: 'Calibri', size: 9.5, bold: true, color: { argb: ARGB.SEM_RED_TEXT } };
            }
          }
        });
      });
    }

    worksheet.getRow(currentRow).height = 20;
    currentRow++;
  });

  // 3. FILA DE PROMEDIO GENERAL REGIONAL (Al pie de la tabla)
  let cIdx = 1;
  const regRowIndex = currentRow;

  // N°
  const cNum = worksheet.getCell(regRowIndex, cIdx++);
  cNum.value = '★';
  cNum.alignment = { vertical: 'middle', horizontal: 'center' };

  // UGEL
  const cUgel = worksheet.getCell(regRowIndex, cIdx++);
  cUgel.value = 'PROMEDIO REGIONAL';
  cUgel.alignment = { vertical: 'middle', horizontal: 'left' };

  // R.C. Regional
  if (colVisibility.showRc) {
    activeStages.forEach((etapa) => {
      const c = worksheet.getCell(regRowIndex, cIdx++);
      const val = safeRc[etapa];
      c.value = val !== undefined && val !== null ? Number(val.toFixed(1)) : '-';
      c.alignment = { vertical: 'middle', horizontal: 'center' };
      if (typeof c.value === 'number') c.numFmt = '0.0';
    });
  }

  // Puntaje Regional
  if (colVisibility.showPuntaje) {
    activeStages.forEach((etapa) => {
      const c = worksheet.getCell(regRowIndex, cIdx++);
      const val = safePuntaje[etapa];
      c.value = val !== undefined && val !== null ? Number(val.toFixed(1)) : '-';
      c.alignment = { vertical: 'middle', horizontal: 'center' };
      if (typeof c.value === 'number') c.numFmt = '0.0';
    });
  }

  // Niveles Regional
  if (colVisibility.showNiveles) {
    availableNiveles.forEach((nItem, nIdx) => {
      const nData = safeNiveles[nIdx];
      activeStages.forEach((etapa) => {
        const c = worksheet.getCell(regRowIndex, cIdx++);
        const stat = nData?.[etapa];
        c.value = stat !== undefined ? `${stat.porcentaje}%` : '-';
        c.alignment = { vertical: 'middle', horizontal: 'center' };
      });
    });
  }

  // Preguntas Regional
  if (colVisibility.showPreguntas) {
    visiblePreguntas.forEach((p, qIdx) => {
      const order = p.order !== undefined ? Number(p.order) : qIdx + 1;
      const pStat = Array.isArray(safePreguntas)
        ? safePreguntas.find((x: any) => x.order === order)
        : (safePreguntas as Record<number, any>)?.[order];

      activeStages.forEach((etapa) => {
        const c = worksheet.getCell(regRowIndex, cIdx++);
        const pct = pStat?.[etapa]?.porcentaje;
        c.value = pct !== undefined ? `${pct}%` : '-';
        c.alignment = { vertical: 'middle', horizontal: 'center' };
      });
    });
  }

  // Estilo formal de la fila de Promedio Regional
  for (let c = 1; c <= lastColIndex; c++) {
    const cell = worksheet.getCell(regRowIndex, c);
    cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: ARGB.SLATE_DARK } };
    cell.font = { name: 'Calibri', size: 10, bold: true, color: { argb: ARGB.WHITE } };
    cell.border = {
      top: { style: 'medium', color: { argb: 'FF0F172A' } },
      bottom: { style: 'double', color: { argb: 'FF0F172A' } },
      left: { style: 'thin', color: { argb: 'FF475569' } },
      right: { style: 'thin', color: { argb: 'FF475569' } },
    };
  }
  worksheet.getRow(regRowIndex).height = 24;

  // 4. DESCARGA DEL ARCHIVO EN EL NAVEGADOR
  const buffer = await workbook.xlsx.writeBuffer();
  const blob = new Blob([buffer], {
    type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  });

  const cleanGrade = (gradoName || 'Comparativa').replace(/\s+/g, '_');
  const fileName = `Matriz_Resultados_${cleanGrade}_${yearSelected}.xlsx`;

  const url = window.URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = fileName;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  window.URL.revokeObjectURL(url);
};
