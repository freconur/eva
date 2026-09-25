import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { DiagnosticoOutputResponse } from '@/pages/api/reportes/diagnostico-ia-matriz';
import { Evaluaciones } from '@/features/types/types';

export interface ExportarDiagnosticoIAPDFProps {
  diagnostico: DiagnosticoOutputResponse;
  gradoName: string;
  yearSelected: number;
  evaluaciones: {
    edi?: Evaluaciones | null;
    ep1?: Evaluaciones | null;
    ep2?: Evaluaciones | null;
  };
  resumenGeneral: {
    totalEstudiantes: { edi?: number; ep1?: number; ep2?: number };
    rcPromedio: { edi?: number; ep1?: number; ep2?: number };
    puntajePromedio: { edi?: number; ep1?: number; ep2?: number };
    nivelesLogro: {
      nivel: string;
      color?: string;
      edi?: { cantidad: number; porcentaje: number };
      ep1?: { cantidad: number; porcentaje: number };
      ep2?: { cantidad: number; porcentaje: number };
    }[];
  };
}

export const exportarDiagnosticoIAPDF = ({
  diagnostico,
  gradoName,
  yearSelected,
  evaluaciones,
  resumenGeneral,
}: ExportarDiagnosticoIAPDFProps) => {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  });

  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const marginX = 14;
  const contentWidth = pageWidth - marginX * 2;

  let currentY = 14;

  // Helper para verificar salto de página
  const checkPageBreak = (neededHeight: number): boolean => {
    if (currentY + neededHeight > pageHeight - 20) {
      doc.addPage();
      currentY = 20;
      return true;
    }
    return false;
  };

  // Helper para imprimir párrafos con control de salto de página
  const printParagraph = (
    text: string,
    x: number,
    maxWidth: number,
    lineHeight = 4.3,
    fontSize = 8.5,
    fontStyle: 'normal' | 'bold' | 'italic' = 'normal',
    color: [number, number, number] = [30, 41, 59]
  ) => {
    doc.setFont('helvetica', fontStyle);
    doc.setFontSize(fontSize);
    doc.setTextColor(color[0], color[1], color[2]);

    const lines = doc.splitTextToSize(text || '', maxWidth);
    for (const line of lines) {
      checkPageBreak(lineHeight + 1);
      doc.text(line, x, currentY);
      currentY += lineHeight;
    }
  };

  // Helper para dibujar títulos de sección
  const drawSectionTitle = (numberStr: string, title: string) => {
    checkPageBreak(14);
    currentY += 3;

    // Barra lateral de acento
    doc.setFillColor(30, 58, 138); // navy-900
    doc.rect(marginX, currentY, 3, 6.5, 'F');

    // Número y Texto
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(10.5);
    doc.setTextColor(30, 58, 138);
    doc.text(`${numberStr}. ${title.toUpperCase()}`, marginX + 5, currentY + 5);

    currentY += 8.5;
  };

  // 1. CABECERA INSTITUCIONAL
  doc.setFillColor(15, 23, 42); // slate-900
  doc.rect(0, 0, pageWidth, 24, 'F');

  // Acento dorado/ámbar del MINEDU / UGEL
  doc.setFillColor(245, 158, 11);
  doc.rect(0, 24, pageWidth, 2.2, 'F');

  // Textos Institucionales
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10.5);
  doc.setTextColor(255, 255, 255);
  doc.text('GOBIERNO REGIONAL DE LIMA  |  DRELP  |  UGEL N° 13 YAUYOS', marginX, 10);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.5);
  doc.setTextColor(203, 213, 225); // slate-300
  doc.text(
    'ÁREA DE GESTIÓN PEDAGÓGICA (AGP)  •  SISTEMA DE EVALUACIÓN DE APRENDIZAJES (EVA)',
    marginX,
    16
  );

  const fechaHoy = new Date().toLocaleDateString('es-PE', {
    day: '2-digit',
    month: 'long',
    year: 'numeric',
  });
  doc.text(`Fecha: ${fechaHoy}`, pageWidth - marginX, 16, { align: 'right' });

  currentY = 32;

  // 2. TÍTULO DEL INFORME
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(13);
  doc.setTextColor(15, 23, 42);
  const tituloText = diagnostico.tituloInforme || 'INFORME TÉCNICO-PEDAGÓGICO DE EVALUACIÓN LONGITUDINAL';
  const tituloLines = doc.splitTextToSize(tituloText.toUpperCase(), contentWidth);
  for (const line of tituloLines) {
    doc.text(line, marginX, currentY);
    currentY += 5.5;
  }

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8.5);
  doc.setTextColor(71, 85, 105); // slate-600
  doc.text(
    'Diagnóstico Asistido por Inteligencia Artificial y Plan de Acción Curricular (CNEB - MINEDU)',
    marginX,
    currentY
  );
  currentY += 6;

  // 3. TARJETAS DE CONTEXTO / FICHA TÉCNICA
  const cardHeight = 22;
  const colWidth = (contentWidth - 6) / 2;

  // Tarjeta Izquierda (Grado y Área)
  doc.setFillColor(248, 250, 252);
  doc.roundedRect(marginX, currentY, colWidth, cardHeight, 1.5, 1.5, 'F');
  doc.setDrawColor(226, 232, 240);
  doc.roundedRect(marginX, currentY, colWidth, cardHeight, 1.5, 1.5, 'S');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7.5);
  doc.setTextColor(30, 41, 59);
  doc.text('DATOS DE LA EVALUACIÓN:', marginX + 4, currentY + 5.5);

  doc.setFont('helvetica', 'normal');
  doc.setTextColor(71, 85, 105);
  doc.text(`• ÁREA / GRADO: ${gradoName}`, marginX + 4, currentY + 10.5);
  doc.text(`• AÑO LECTIVO: ${yearSelected}`, marginX + 4, currentY + 15);
  doc.text(`• JURISDICCIÓN: Red de Instituciones Educativas - UGEL 13`, marginX + 4, currentY + 19.5);

  // Tarjeta Derecha (Cobertura por Etapa)
  const cardRightX = marginX + colWidth + 6;
  doc.setFillColor(248, 250, 252);
  doc.roundedRect(cardRightX, currentY, colWidth, cardHeight, 1.5, 1.5, 'F');
  doc.setDrawColor(226, 232, 240);
  doc.roundedRect(cardRightX, currentY, colWidth, cardHeight, 1.5, 1.5, 'S');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7.5);
  doc.setTextColor(30, 41, 59);
  doc.text('COBERTURA ESTUDIANTIL EVALUADA:', cardRightX + 4, currentY + 5.5);

  doc.setFont('helvetica', 'normal');
  doc.setTextColor(71, 85, 105);
  const ediEst = resumenGeneral.totalEstudiantes.edi !== undefined ? `${resumenGeneral.totalEstudiantes.edi} est.` : 'Sin datos';
  const ep1Est = resumenGeneral.totalEstudiantes.ep1 !== undefined ? `${resumenGeneral.totalEstudiantes.ep1} est.` : 'Sin datos';
  const ep2Est = resumenGeneral.totalEstudiantes.ep2 !== undefined ? `${resumenGeneral.totalEstudiantes.ep2} est.` : 'Sin datos';

  doc.text(`• EDI (Marzo - Inicio): ${ediEst}`, cardRightX + 4, currentY + 10.5);
  doc.text(`• EP1 (Julio - Proceso 1): ${ep1Est}`, cardRightX + 4, currentY + 15);
  doc.text(`• EP2 (Noviembre - Proceso 2): ${ep2Est}`, cardRightX + 4, currentY + 19.5);

  currentY += cardHeight + 4;

  // 4. TABLA COMPARATIVA DE DESEMPEÑO LONGITUDINAL
  drawSectionTitle('I', 'CUADRO RESUMEN DE RENDIMIENTO LONGITUDINAL (EDI ➔ EP1 ➔ EP2)');

  const tablaEtapasHead = [
    [
      'Etapa Escolar',
      'Evaluación Registrada',
      'Estudiantes',
      'R.C. Prom.',
      'Puntaje (0-20)',
      'Inicio (%)',
      'Proceso (%)',
      'Logrado (%)',
    ],
  ];

  // Helper para buscar porcentaje por nivel
  const getNivelPerc = (etapa: 'edi' | 'ep1' | 'ep2', nivelKeywords: string[]) => {
    const matched = resumenGeneral.nivelesLogro.find((n) =>
      nivelKeywords.some((kw) => n.nivel.toLowerCase().includes(kw))
    );
    const val = matched?.[etapa];
    if (!val || val.porcentaje === undefined) return '-';
    return `${val.porcentaje}% (${val.cantidad})`;
  };

  const tablaEtapasBody = [
    [
      'EDI (Marzo)',
      evaluaciones.edi?.nombre || 'No asignada',
      resumenGeneral.totalEstudiantes.edi ?? '-',
      resumenGeneral.rcPromedio.edi !== undefined ? `${resumenGeneral.rcPromedio.edi}` : '-',
      resumenGeneral.puntajePromedio.edi !== undefined ? `${resumenGeneral.puntajePromedio.edi.toFixed(1)} / 20` : '-',
      getNivelPerc('edi', ['inicio', 'previo']),
      getNivelPerc('edi', ['proceso']),
      getNivelPerc('edi', ['satisfactorio', 'logrado', 'esperado', 'destacado']),
    ],
    [
      'EP1 (Julio)',
      evaluaciones.ep1?.nombre || 'No asignada',
      resumenGeneral.totalEstudiantes.ep1 ?? '-',
      resumenGeneral.rcPromedio.ep1 !== undefined ? `${resumenGeneral.rcPromedio.ep1}` : '-',
      resumenGeneral.puntajePromedio.ep1 !== undefined ? `${resumenGeneral.puntajePromedio.ep1.toFixed(1)} / 20` : '-',
      getNivelPerc('ep1', ['inicio', 'previo']),
      getNivelPerc('ep1', ['proceso']),
      getNivelPerc('ep1', ['satisfactorio', 'logrado', 'esperado', 'destacado']),
    ],
    [
      'EP2 (Noviembre)',
      evaluaciones.ep2?.nombre || 'No asignada',
      resumenGeneral.totalEstudiantes.ep2 ?? '-',
      resumenGeneral.rcPromedio.ep2 !== undefined ? `${resumenGeneral.rcPromedio.ep2}` : '-',
      resumenGeneral.puntajePromedio.ep2 !== undefined ? `${resumenGeneral.puntajePromedio.ep2.toFixed(1)} / 20` : '-',
      getNivelPerc('ep2', ['inicio', 'previo']),
      getNivelPerc('ep2', ['proceso']),
      getNivelPerc('ep2', ['satisfactorio', 'logrado', 'esperado', 'destacado']),
    ],
  ];

  autoTable(doc, {
    startY: currentY,
    head: tablaEtapasHead,
    body: tablaEtapasBody,
    theme: 'grid',
    headStyles: {
      fillColor: [30, 41, 59],
      textColor: [255, 255, 255],
      fontStyle: 'bold',
      fontSize: 7.5,
      halign: 'center',
    },
    bodyStyles: {
      fontSize: 7.5,
      textColor: [30, 41, 59],
      lineColor: [226, 232, 240],
      halign: 'center',
    },
    columnStyles: {
      0: { fontStyle: 'bold', halign: 'left', cellWidth: 26 },
      1: { halign: 'left', cellWidth: 42 },
      2: { cellWidth: 18 },
      3: { cellWidth: 16 },
      4: { fontStyle: 'bold', cellWidth: 22 },
      5: { cellWidth: 20, fillColor: [254, 242, 242] }, // red tint
      6: { cellWidth: 20, fillColor: [254, 243, 199] }, // amber tint
      7: { cellWidth: 20, fillColor: [236, 253, 245] }, // emerald tint
    },
    margin: { left: marginX, right: marginX },
  });

  currentY = (doc as any).lastAutoTable.finalY + 5;

  // 5. DIAGNÓSTICO GLOBAL Y EVOLUCIÓN
  drawSectionTitle('II', 'DIAGNÓSTICO PEDAGÓGICO GENERAL DEL RENDIMIENTO');

  // Tarjeta o caja de texto estilizada
  const boxPadding = 3.5;
  const globalLines = doc.splitTextToSize(diagnostico.diagnosticoGlobal || 'Sin observaciones.', contentWidth - boxPadding * 2);
  const globalBoxHeight = globalLines.length * 4.2 + boxPadding * 2;

  checkPageBreak(globalBoxHeight + 6);
  doc.setFillColor(248, 250, 252);
  doc.roundedRect(marginX, currentY, contentWidth, globalBoxHeight, 1.5, 1.5, 'F');
  doc.setDrawColor(203, 213, 225);
  doc.roundedRect(marginX, currentY, contentWidth, globalBoxHeight, 1.5, 1.5, 'S');

  currentY += boxPadding + 3;
  printParagraph(diagnostico.diagnosticoGlobal, marginX + boxPadding, contentWidth - boxPadding * 2, 4.2, 8, 'normal', [15, 23, 42]);
  currentY += boxPadding + 3;

  // Transición entre niveles
  drawSectionTitle('III', 'ANÁLISIS DE LA TRANSICIÓN ENTRE NIVELES DE LOGRO');
  const evoLines = doc.splitTextToSize(diagnostico.analisisEvolucionNiveles || 'Sin datos de transición.', contentWidth - boxPadding * 2);
  const evoBoxHeight = evoLines.length * 4.2 + boxPadding * 2;

  checkPageBreak(evoBoxHeight + 6);
  doc.setFillColor(248, 250, 252);
  doc.roundedRect(marginX, currentY, contentWidth, evoBoxHeight, 1.5, 1.5, 'F');
  doc.setDrawColor(203, 213, 225);
  doc.roundedRect(marginX, currentY, contentWidth, evoBoxHeight, 1.5, 1.5, 'S');

  currentY += boxPadding + 3;
  printParagraph(diagnostico.analisisEvolucionNiveles, marginX + boxPadding, contentWidth - boxPadding * 2, 4.2, 8, 'normal', [15, 23, 42]);
  currentY += boxPadding + 4;

  // 6. MATRIZ DE ÍTEMS CRÍTICOS Y ESTRATEGIAS DIDÁCTICAS
  if (diagnostico.analisisItemsCriticos && diagnostico.analisisItemsCriticos.length > 0) {
    drawSectionTitle('IV', 'MATRIZ DE ÍTEMS CRÍTICOS Y ORIENTACIONES DIDÁCTICAS');

    const itemsHead = [['Ítem', 'Competencia / Habilidad', 'Diagnóstico del Error Cognitivo', 'Estrategia Didáctica Prioritaria']];
    const itemsBody = diagnostico.analisisItemsCriticos.map((item) => [
      item.item || 'Ítem',
      item.competenciaOEnfoque || 'Competencia evaluada',
      item.diagnostico || '-',
      item.estrategiaDidactica || '-',
    ]);

    autoTable(doc, {
      startY: currentY,
      head: itemsHead,
      body: itemsBody,
      theme: 'grid',
      headStyles: {
        fillColor: [30, 58, 138],
        textColor: [255, 255, 255],
        fontStyle: 'bold',
        fontSize: 7.5,
      },
      bodyStyles: {
        fontSize: 7.2,
        textColor: [30, 41, 59],
        lineColor: [226, 232, 240],
        valign: 'top',
      },
      columnStyles: {
        0: { fontStyle: 'bold', cellWidth: 18, halign: 'center' },
        1: { fontStyle: 'bold', cellWidth: 38 },
        2: { cellWidth: 63 },
        3: { cellWidth: 63 },
      },
      margin: { left: marginX, right: marginX },
    });

    currentY = (doc as any).lastAutoTable.finalY + 5;
  }

  // 7. ZONAS O INSTITUCIONES PRIORITARIAS
  if (diagnostico.zonasPrioritarias && diagnostico.zonasPrioritarias.length > 0) {
    drawSectionTitle('V', 'INSTITUCIONES / ZONAS PRIORITARIAS PARA INTERVENCIÓN');

    const zonasHead = [['Institución / Zona', 'Nivel Alerta', 'Observación / Brecha Identificada', 'Acción Focalizada Recomendada']];
    const zonasBody = diagnostico.zonasPrioritarias.map((z) => [
      z.zonaOInstitucion || 'Zona',
      z.nivelAlerta || 'Media',
      z.observacion || '-',
      z.accionFocalizada || '-',
    ]);

    autoTable(doc, {
      startY: currentY,
      head: zonasHead,
      body: zonasBody,
      theme: 'grid',
      headStyles: {
        fillColor: [180, 83, 9], // ámbar/ocre oscuro
        textColor: [255, 255, 255],
        fontStyle: 'bold',
        fontSize: 7.5,
      },
      bodyStyles: {
        fontSize: 7.2,
        textColor: [30, 41, 59],
        lineColor: [226, 232, 240],
        valign: 'top',
      },
      columnStyles: {
        0: { fontStyle: 'bold', cellWidth: 42 },
        1: { fontStyle: 'bold', cellWidth: 22, halign: 'center' },
        2: { cellWidth: 60 },
        3: { cellWidth: 58 },
      },
      didParseCell: (hookData) => {
        if (hookData.section === 'body' && hookData.column.index === 1) {
          const val = String(hookData.cell.raw).toLowerCase();
          if (val.includes('alta')) {
            hookData.cell.styles.textColor = [185, 28, 28]; // red
            hookData.cell.styles.fillColor = [254, 242, 242];
          } else if (val.includes('media')) {
            hookData.cell.styles.textColor = [180, 83, 9]; // amber
            hookData.cell.styles.fillColor = [254, 243, 199];
          } else {
            hookData.cell.styles.textColor = [21, 128, 61]; // green
            hookData.cell.styles.fillColor = [236, 253, 245];
          }
        }
      },
      margin: { left: marginX, right: marginX },
    });

    currentY = (doc as any).lastAutoTable.finalY + 5;
  }

  // 8. PLAN DE ACCIÓN ARTICULADO
  drawSectionTitle('VI', 'PLAN DE ACCIÓN ARTICULADO POR NIVELES DE GESTIÓN');

  const renderBulletList = (categoryTitle: string, items: string[], headerColor: [number, number, number]) => {
    checkPageBreak(12);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8.5);
    doc.setTextColor(headerColor[0], headerColor[1], headerColor[2]);
    doc.text(categoryTitle, marginX, currentY);
    currentY += 4.5;

    items.forEach((item, idx) => {
      const bulletText = `•  ${item}`;
      printParagraph(bulletText, marginX + 3, contentWidth - 6, 4.0, 7.8, 'normal', [51, 65, 85]);
      currentY += 1.5;
    });
    currentY += 2;
  };

  if (diagnostico.accionesUgel && diagnostico.accionesUgel.length > 0) {
    renderBulletList('1. Nivel UGEL (Especialistas de Gestión Pedagógica):', diagnostico.accionesUgel, [30, 58, 138]);
  }

  if (diagnostico.accionesDirectores && diagnostico.accionesDirectores.length > 0) {
    renderBulletList('2. Nivel Institucional (Directores y Líderes Pedagógicos):', diagnostico.accionesDirectores, [180, 83, 9]);
  }

  if (diagnostico.accionesDocentes && diagnostico.accionesDocentes.length > 0) {
    renderBulletList('3. Nivel de Aula (Docentes del Área Curricular):', diagnostico.accionesDocentes, [21, 128, 61]);
  }

  // 9. CONCLUSIÓN PEDAGÓGICA Y CIERRE
  drawSectionTitle('VII', 'CONCLUSIÓN GENERAL Y TOMA DE DECISIONES');
  printParagraph(diagnostico.conclusionPedagogica || 'Se recomienda continuar con el acompañamiento pedagógico sostenido.', marginX, contentWidth, 4.2, 8, 'normal', [15, 23, 42]);
  currentY += 8;

  // 10. BLOQUE DE FIRMAS Y VALIDACIÓN OFICIAL
  checkPageBreak(38);
  currentY += 8;

  const signWidth = 70;
  const sign1X = marginX + 15;
  const sign2X = pageWidth - marginX - signWidth - 15;

  // Líneas de firma
  doc.setDrawColor(100, 116, 139);
  doc.setLineWidth(0.3);
  doc.line(sign1X, currentY, sign1X + signWidth, currentY);
  doc.line(sign2X, currentY, sign2X + signWidth, currentY);

  currentY += 4.5;
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7.5);
  doc.setTextColor(30, 41, 59);
  doc.text('ESPECIALISTA RESPONSABLE DE ÁREA', sign1X + signWidth / 2, currentY, { align: 'center' });
  doc.text('DIRECCIÓN DE GESTIÓN PEDAGÓGICA', sign2X + signWidth / 2, currentY, { align: 'center' });

  currentY += 3.5;
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(6.8);
  doc.setTextColor(100, 116, 139);
  doc.text('UGEL N° 13 Yauyos', sign1X + signWidth / 2, currentY, { align: 'center' });
  doc.text('UGEL N° 13 Yauyos', sign2X + signWidth / 2, currentY, { align: 'center' });

  // 11. PIE DE PÁGINA AUTOMÁTICO EN TODAS LAS HOJAS
  const totalPages = (doc as any).internal.getNumberOfPages();
  for (let i = 1; i <= totalPages; i++) {
    doc.setPage(i);

    // Línea separadora tenue
    doc.setDrawColor(226, 232, 240);
    doc.setLineWidth(0.2);
    doc.line(marginX, pageHeight - 11, pageWidth - marginX, pageHeight - 11);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7);
    doc.setTextColor(148, 163, 184); // slate-400
    doc.text(
      'Sistema EVA - Plataforma de Monitoreo y Diagnóstico Pedagógico | UGEL 13 Yauyos',
      marginX,
      pageHeight - 7
    );
    doc.text(
      `Página ${i} de ${totalPages}`,
      pageWidth - marginX,
      pageHeight - 7,
      { align: 'right' }
    );
  }

  // Descarga del documento
  const cleanGrade = gradoName.replace(/[^a-zA-Z0-9]/g, '_');
  const dateStamp = new Date().toISOString().split('T')[0];
  const filename = `Informe_Pedagogico_IA_${cleanGrade}_${yearSelected}_${dateStamp}.pdf`;
  doc.save(filename);
};
