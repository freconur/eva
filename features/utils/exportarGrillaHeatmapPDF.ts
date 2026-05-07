import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { getMonthName } from '@/fuctions/dates';
import { converSeccion } from '@/fuctions/regiones';

interface ExportarGrillaProps {
  estudiantes: any[];
  preguntasRespuestas: any[];
  evaluacion: any;
  monthSelected: number;
  nombreDocente: string;
}

export const exportarGrillaHeatmapPDF = ({
  estudiantes,
  preguntasRespuestas,
  evaluacion,
  monthSelected,
  nombreDocente
}: ExportarGrillaProps) => {
  // Crear documento en formato horizontal (landscape)
  const doc = new jsPDF({
    orientation: 'landscape',
    unit: 'mm',
    format: 'a4'
  });

  // 1. Título y Metadatos
  doc.setFontSize(16);
  doc.setTextColor(40);
  doc.text(`Reporte de Evaluación: ${evaluacion.nombre || 'Sin nombre'}`, 14, 15);
  
  doc.setFontSize(9);
  doc.setTextColor(80);
  doc.text(`Docente: ${nombreDocente}`, 14, 22);
  doc.text(`Mes: ${getMonthName(monthSelected)}`, 14, 26);
  doc.text(`Fecha: ${new Date().toLocaleDateString()}`, 14, 30);

  // 1.1 Calcular estadísticas de niveles para el resumen
  const totalEstudiantes = estudiantes.length;
  const conteoNiveles = {
    satisfactorio: 0,
    proceso: 0,
    inicio: 0,
    previo: 0
  };

  estudiantes.forEach(est => {
    const nivel = (est.nivel || '').toLowerCase();
    if (nivel.includes('satisfactorio')) conteoNiveles.satisfactorio++;
    else if (nivel.includes('proceso')) conteoNiveles.proceso++;
    else if (nivel.includes('previo')) conteoNiveles.previo++;
    else if (nivel.includes('inicio')) conteoNiveles.inicio++;
  });

  const getPerc = (count: number) => totalEstudiantes > 0 ? ((count / totalEstudiantes) * 100).toFixed(1) : '0.0';

  // 1.2 Leyenda de Niveles y Resumen
  const legendX = 140;
  let legendY = 22;
  doc.setFontSize(7);
  doc.setFont('helvetica', 'bold');
  doc.text('RESUMEN DE LOGROS:', legendX, 18);
  doc.setFont('helvetica', 'normal');
  
  const drawLegendItem = (x: number, y: number, color: [number, number, number], label: string, count: number) => {
    doc.setFillColor(color[0], color[1], color[2]);
    doc.circle(x, y - 1, 1.2, 'F');
    doc.setTextColor(40);
    doc.text(`${label}: ${count} (${getPerc(count)}%)`, x + 3, y);
  };

  drawLegendItem(legendX, legendY, [34, 197, 94], 'Satisfactorio', conteoNiveles.satisfactorio);
  drawLegendItem(legendX + 45, legendY, [245, 158, 11], 'En proceso', conteoNiveles.proceso);
  drawLegendItem(legendX, legendY + 5, [166, 78, 77], 'Inicio', conteoNiveles.inicio);
  drawLegendItem(legendX + 45, legendY + 5, [165, 165, 165], 'Previo al inicio', conteoNiveles.previo);
  
  // Leyenda de Respuestas
  doc.setFont('helvetica', 'bold');
  doc.text('RESPUESTAS:', legendX + 95, 18);
  doc.setFont('helvetica', 'normal');
  doc.setFillColor(59, 130, 246);
  doc.rect(legendX + 95, 20, 3, 3, 'F');
  doc.text('Correcto', legendX + 99, 22.5);
  
  doc.setFillColor(239, 68, 68);
  doc.rect(legendX + 95, 25, 3, 3, 'F');
  doc.text('Incorrecto', legendX + 99, 27.5);

  // 2. Calcular estadísticas por pregunta para la cabecera
  const estadisticasPreguntas = preguntasRespuestas.map(p => {
    const aciertos = estudiantes.filter(est => {
      const resp = est.respuestas?.find((r: any) => 
        (r.id && p.id === r.id) || (r.order !== undefined && p.order === r.order)
      );
      if (!resp) return false;
      const altSeleccionada = resp.alternativas?.find((alt: any) => alt.selected === true);
      const rtaSel = (altSeleccionada?.alternativa || '').toString().toLowerCase().trim();
      const rtaCorr = (resp.respuesta || p.respuesta || '').toString().toLowerCase().trim();
      return rtaCorr !== '' && rtaSel !== '' && rtaSel === rtaCorr;
    }).length;
    
    const porcentaje = estudiantes.length > 0 ? Math.round((aciertos / estudiantes.length) * 100) : 0;
    return { aciertos, porcentaje, total: estudiantes.length };
  });

  const head = [
    [
      '#',
      'Estudiante',
      'Sec',
      'R.C',
      'Puntaje',
      'Nivel',
      ...preguntasRespuestas.map((_, i) => {
        const stats = estadisticasPreguntas[i];
        return `${i + 1}\n${stats.porcentaje}%\n${stats.aciertos}/${stats.total}`;
      })
    ]
  ];

  const body = estudiantes.map((est, index) => {
    const nombreCompleto = est.nombresApellidos || `${est.apellidos || ''}, ${est.nombres || ''}`.trim();
    const rc = est.respuestasCorrectas !== undefined ? est.respuestasCorrectas : (est.correctas || 0);
    const puntaje = est.puntajeTotal !== undefined ? est.puntajeTotal : (est.puntaje || 0);

    return [
      index + 1,
      nombreCompleto || 'Sin nombre',
      converSeccion(Number(est.seccion))?.toUpperCase() || '-',
      rc,
      puntaje,
      est.nivel || '-',
      ...preguntasRespuestas.map(p => {
        const respuestaEstudiante = est.respuestas?.find((r: any) => 
          (r.id && p.id === r.id) || (r.order !== undefined && p.order === r.order)
        );
        if (!respuestaEstudiante) return '';
        const alternativaSeleccionada = respuestaEstudiante.alternativas?.find((alt: any) => alt.selected === true);
        const rtaSeleccionada = (alternativaSeleccionada?.alternativa || '').toString().toLowerCase().trim();
        const rtaCorrecta = (respuestaEstudiante.respuesta || p.respuesta || '').toString().toLowerCase().trim();
        const esCorrecta = rtaCorrecta !== '' && rtaSeleccionada !== '' && rtaSeleccionada === rtaCorrecta;
        return esCorrecta ? 'SI' : 'NO';
      })
    ];
  });

  // 3. Generar AutoTable
  autoTable(doc, {
    startY: 40,
    head: head,
    body: body,
    theme: 'grid',
    styles: {
      fontSize: 6,
      cellPadding: 0.5,
      halign: 'center',
      valign: 'middle',
      lineWidth: 0.05
    },
    headStyles: {
      fillColor: [249, 250, 251],
      textColor: [55, 65, 81],
      fontStyle: 'bold',
      fontSize: 5,
      minCellHeight: 12
    },
    columnStyles: {
      0: { cellWidth: 6 },
      1: { halign: 'left', cellWidth: 45, fontSize: 5.5 },
      2: { cellWidth: 6 },
      3: { cellWidth: 6 },
      4: { cellWidth: 10 },
      5: { cellWidth: 8 }
    },
    // Limpiar el texto ANTES de que se procese la celda para dibujar
    didParseCell: (data) => {
      if (data.section === 'body' && (data.column.index === 5 || data.column.index > 5)) {
        // Guardamos el valor original en una propiedad personalizada para usarla en didDrawCell
        (data.cell as any).originalValue = data.cell.raw;
        data.cell.text = []; // Vaciamos el texto por completo
      }
    },
    didDrawCell: (data) => {
      // Dibujar círculo en la columna Nivel (índice 5)
      if (data.section === 'body' && data.column.index === 5) {
        const nivel = ((data.cell as any).originalValue as string || '').toLowerCase();
        let color: [number, number, number] = [165, 165, 165];
        if (nivel.includes('satisfactorio')) color = [34, 197, 94];
        else if (nivel.includes('proceso')) color = [245, 158, 11];
        else if (nivel.includes('previo')) color = [165, 165, 165];
        else if (nivel.includes('inicio')) color = [166, 78, 77];

        const radius = 1.5;
        const centerX = data.cell.x + data.cell.width / 2;
        const centerY = data.cell.y + data.cell.height / 2;
        doc.setFillColor(color[0], color[1], color[2]);
        doc.circle(centerX, centerY, radius, 'F');
      }

      // Dibujar bloques de color en las preguntas (índice > 5)
      if (data.section === 'body' && data.column.index > 5) {
        const cellValue = (data.cell as any).originalValue;
        if (cellValue === 'SI') {
          doc.setFillColor(59, 130, 246);
          doc.rect(data.cell.x, data.cell.y, data.cell.width, data.cell.height, 'F');
        } else if (cellValue === 'NO') {
          doc.setFillColor(239, 68, 68);
          doc.rect(data.cell.x, data.cell.y, data.cell.width, data.cell.height, 'F');
        }
      }
    },
    margin: { top: 40, left: 5, right: 5 }
  });

  // 4. Descargar
  doc.save(`Reporte_Grilla_${evaluacion.nombre || 'Evaluacion'}_${getMonthName(monthSelected)}.pdf`);
};
