import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

export interface SubItemDetallado {
  id?: string;
  codigo?: string; // ej. "1.1", "1.2", "4.1"
  descripcion: string;
  horas: number;
}

export interface FeatureCostoItem {
  id?: string;
  codigo?: string; // ej. "E-001", "F-001"
  titulo: string;
  tituloCliente?: string;
  modulo: string;
  tipo: string;
  descripcion?: string;
  descripcionCliente?: string;
  subItems?: SubItemDetallado[];
  horasEstimadas: number;
  horasReales: number;
  tarifaPorHora: number;
  costoTotal: number;
  modalidad: 'horas' | 'fijo';
  estado: 'Planificado' | 'En Desarrollo' | 'Completado' | 'Entregado' | 'Facturado';
  orden?: number;
  fecha?: string;
  prioridad?: 'Baja' | 'Media' | 'Alta' | 'Crítica';
  notas?: string;
}

export interface MatrizConfig {
  developerName: string;
  developerDni: string;
  clientName: string;
  projectName: string;
  currency: string;
  defaultHourlyRate: number;
}

/**
 * Elimina recursivamente todas las propiedades con valor `undefined` para evitar errores de Firestore
 */
export function sanitizeForFirestore<T extends Record<string, any>>(obj: T): Partial<T> {
  const clean: Record<string, any> = {};
  for (const [key, value] of Object.entries(obj)) {
    if (value !== undefined) {
      if (Array.isArray(value)) {
        clean[key] = value.map((item) =>
          item && typeof item === 'object' && !(item instanceof Date)
            ? sanitizeForFirestore(item)
            : item
        );
      } else if (
        value !== null &&
        typeof value === 'object' &&
        !(value instanceof Date) &&
        !('nanoseconds' in value)
      ) {
        clean[key] = sanitizeForFirestore(value);
      } else {
        clean[key] = value;
      }
    }
  }
  return clean as Partial<T>;
}

interface ExportarMatrizProps {
  features: FeatureCostoItem[];
  config: MatrizConfig;
  modoVista?: 'tecnico' | 'cliente';
}

export const exportarMatrizCostosPDF = ({ features, config, modoVista = 'tecnico' }: ExportarMatrizProps) => {
  const doc = new jsPDF({
    orientation: 'landscape',
    unit: 'mm',
    format: 'a4'
  });

  const isCliente = modoVista === 'cliente';
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const currencySymbol = config.currency === 'USD' ? '$' : 'S/';

  // Totales
  const totalHoras = features.reduce((acc, f) => acc + (Number(f.horasReales) || Number(f.horasEstimadas) || 0), 0);
  const totalCosto = features.reduce((acc, f) => acc + (Number(f.costoTotal) || 0), 0);
  const completadas = features.filter(f => f.estado === 'Completado' || f.estado === 'Entregado' || f.estado === 'Facturado').length;
  const porcentajeAvance = features.length > 0 ? Math.round((completadas / features.length) * 100) : 0;

  // 1. Cabecera decorativa
  doc.setFillColor(15, 23, 42); // slate-900
  doc.rect(0, 0, pageWidth, 28, 'F');

  // Acento de color primario (azul/cian)
  doc.setFillColor(isCliente ? 16 : 37, isCliente ? 185 : 99, isCliente ? 129 : 235); // emerald o blue
  doc.rect(0, 28, pageWidth, 2, 'F');

  // Título
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(15);
  doc.setTextColor(255, 255, 255);
  doc.text(
    isCliente
      ? 'PROPUESTA EJECUTIVA Y VALOR DE FUNCIONALIDADES DESARROLLADAS'
      : 'MATRIZ DE FUNCIONALIDADES Y COSTOS DE DESARROLLO',
    14,
    13
  );

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.setTextColor(203, 213, 225); // slate-300
  doc.text(
    isCliente
      ? `${config.projectName || 'Sistema EVA'} — Entregables y Soluciones para la Institución`
      : `${config.projectName || 'Sistema EVA'} — Registro y Liquidación de Features`,
    14,
    21
  );

  const fechaHoy = new Date().toLocaleDateString('es-PE', {
    day: '2-digit',
    month: 'long',
    year: 'numeric'
  });
  doc.text(`Fecha de Emisión: ${fechaHoy}`, pageWidth - 14, 21, { align: 'right' });

  // 2. Metadatos del Desarrollador y Proyecto
  let currentY = 36;
  doc.setFontSize(9);
  doc.setTextColor(51, 65, 85); // slate-700

  // Caja de Información Izquierda
  doc.setFillColor(248, 250, 252); // slate-50
  doc.roundedRect(14, currentY, 130, 26, 2, 2, 'F');
  doc.setDrawColor(226, 232, 240); // slate-200
  doc.roundedRect(14, currentY, 130, 26, 2, 2, 'S');

  doc.setFont('helvetica', 'bold');
  doc.setTextColor(30, 41, 59);
  doc.text('INFORMACIÓN DE DESARROLLO', 18, currentY + 6);

  doc.setFont('helvetica', 'normal');
  doc.setTextColor(71, 85, 105);
  doc.text(`Desarrollador: ${config.developerName || 'Desarrollador Principal'}`, 18, currentY + 12);
  doc.text(`DNI / Identificador: ${config.developerDni || '47163626'}`, 18, currentY + 17);
  doc.text(`Cliente / Proyecto: ${config.clientName || 'UGEL 13 - Yauyos / EVA'}`, 18, currentY + 22);

  // Caja de Métricas Resumen Derecha
  const metricsWidth = pageWidth - 14 - 150;
  doc.setFillColor(248, 250, 252);
  doc.roundedRect(150, currentY, metricsWidth, 26, 2, 2, 'F');
  doc.setDrawColor(226, 232, 240);
  doc.roundedRect(150, currentY, metricsWidth, 26, 2, 2, 'S');

  doc.setFont('helvetica', 'bold');
  doc.setTextColor(30, 41, 59);
  doc.text('RESUMEN GENERAL', 154, currentY + 6);

  doc.setFont('helvetica', 'normal');
  doc.setTextColor(71, 85, 105);
  doc.text(`Total Features: ${features.length}  (${completadas} completadas - ${porcentajeAvance}%)`, 154, currentY + 12);
  doc.text(`Horas Invertidas: ${totalHoras.toFixed(1)} hrs`, 154, currentY + 17);

  doc.setFont('helvetica', 'bold');
  doc.setTextColor(22, 101, 52); // green-800
  doc.text(`Costo Total Acumulado: ${currencySymbol} ${totalCosto.toLocaleString('es-PE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`, 154, currentY + 22);

  currentY += 32;

  // 3. Tabla Principal de Features
  const tipoClienteMap: Record<string, string> = {
    'Nueva Feature': 'Nueva Solución',
    'Mejora / Refactor': 'Optimización',
    'Seguridad y Validación': 'Seguridad y Control',
    'Optimización': 'Rendimiento',
    'Corrección de Bug': 'Mantenimiento',
    'Migración de Datos': 'Gestión de Datos'
  };

  const tableRows: any[] = [];

  features.forEach((f, index) => {
    const horas = Number(f.horasReales) || Number(f.horasEstimadas) || 0;
    const tarifa = Number(f.tarifaPorHora) || 0;
    const costo = Number(f.costoTotal) || Math.round(horas * tarifa * 100) / 100;
    const mod = f.modalidad === 'fijo' ? 'Fijo' : 'Horas';

    const dynamicCode = `F-${String(index + 1).padStart(3, '0')}`;
    const tituloPrincipal = isCliente ? (f.tituloCliente || f.titulo) : f.titulo;
    const descText = isCliente ? (f.descripcionCliente || '') : (f.descripcion || '');
    const tipoDisplay = isCliente ? (tipoClienteMap[f.tipo] || f.tipo) : (f.tipo || 'Feature');

    const hasSubItems = f.subItems && f.subItems.length > 0;

    const featureTitleContent = descText && descText.trim()
      ? `${tituloPrincipal}\n${descText.trim()}`
      : tituloPrincipal;

    // 1. Fila Principal de la Funcionalidad (Encabezado con totales consolidados)
    tableRows.push([
      {
        content: dynamicCode,
        styles: {
          fontStyle: 'bold',
          halign: 'center',
          fillColor: hasSubItems ? [238, 242, 255] : [248, 250, 252],
          textColor: [30, 58, 138]
        }
      },
      {
        content: f.modulo || 'General',
        styles: {
          fontStyle: 'bold',
          fillColor: hasSubItems ? [238, 242, 255] : [248, 250, 252],
          textColor: [51, 65, 85]
        }
      },
      {
        content: featureTitleContent,
        styles: {
          fontStyle: 'bold',
          fillColor: hasSubItems ? [238, 242, 255] : [248, 250, 252],
          textColor: [15, 23, 42]
        }
      },
      {
        content: tipoDisplay,
        styles: {
          halign: 'center',
          fillColor: hasSubItems ? [238, 242, 255] : [248, 250, 252]
        }
      },
      {
        content: mod,
        styles: {
          halign: 'center',
          fillColor: hasSubItems ? [238, 242, 255] : [248, 250, 252]
        }
      },
      {
        content: `${horas.toFixed(1)} h`,
        styles: {
          fontStyle: 'bold',
          halign: 'right',
          fillColor: hasSubItems ? [238, 242, 255] : [248, 250, 252],
          textColor: [15, 23, 42]
        }
      },
      {
        content: `${currencySymbol} ${tarifa.toFixed(2)}`,
        styles: {
          halign: 'right',
          fillColor: hasSubItems ? [238, 242, 255] : [248, 250, 252],
          textColor: [71, 85, 105]
        }
      },
      {
        content: `${currencySymbol} ${costo.toLocaleString('es-PE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
        styles: {
          fontStyle: 'bold',
          halign: 'right',
          fillColor: hasSubItems ? [238, 242, 255] : [248, 250, 252],
          textColor: [22, 101, 52]
        }
      },
      {
        content: f.estado || 'Planificado',
        styles: {
          fontStyle: 'bold',
          halign: 'center',
          fillColor: hasSubItems ? [238, 242, 255] : [248, 250, 252]
        }
      }
    ]);

    // 2. Filas de Sub-tareas Detalladas (Cada subtarea con sus horas y costo individual alineados)
    if (hasSubItems) {
      f.subItems!.forEach((si, sIdx) => {
        const subItemHours = Number(si.horas) || 0;
        const subItemCost = subItemHours * tarifa;
        const subCode = `${index + 1}.${sIdx + 1}`;

        tableRows.push([
          {
            content: subCode,
            styles: {
              halign: 'center',
              fontStyle: 'bold',
              textColor: [79, 70, 229],
              fillColor: [255, 255, 255],
              fontSize: 7.5
            }
          },
          {
            content: '↳ Sub-tarea',
            styles: {
              textColor: [148, 163, 184],
              fillColor: [255, 255, 255],
              fontSize: 7,
              fontStyle: 'italic'
            }
          },
          {
            content: si.descripcion,
            styles: {
              textColor: [51, 65, 85],
              fillColor: [255, 255, 255],
              fontSize: 7.5
            }
          },
          {
            content: 'Desarrollo',
            styles: {
              halign: 'center',
              textColor: [148, 163, 184],
              fillColor: [255, 255, 255],
              fontSize: 7
            }
          },
          {
            content: 'Horas',
            styles: {
              halign: 'center',
              textColor: [148, 163, 184],
              fillColor: [255, 255, 255],
              fontSize: 7
            }
          },
          {
            content: `${subItemHours.toFixed(1)} h`,
            styles: {
              halign: 'right',
              textColor: [51, 65, 85],
              fillColor: [255, 255, 255],
              fontSize: 7.5
            }
          },
          {
            content: `${currencySymbol} ${tarifa.toFixed(2)}`,
            styles: {
              halign: 'right',
              textColor: [148, 163, 184],
              fillColor: [255, 255, 255],
              fontSize: 7.5
            }
          },
          {
            content: `${currencySymbol} ${subItemCost.toLocaleString('es-PE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
            styles: {
              halign: 'right',
              fontStyle: 'bold',
              textColor: [30, 41, 59],
              fillColor: [255, 255, 255],
              fontSize: 7.5
            }
          },
          {
            content: '✓',
            styles: {
              halign: 'center',
              textColor: [22, 101, 52],
              fillColor: [255, 255, 255],
              fontSize: 7.5,
              fontStyle: 'bold'
            }
          }
        ]);
      });
    }
  });

  const tableHeader = isCliente
    ? [['Ítem', 'Módulo', 'Funcionalidad y Valor para la Institución', 'Tipo Solución', 'Mod.', 'Horas', 'Tarifa', 'Inversión', 'Estado']]
    : [['Ítem', 'Módulo', 'Funcionalidad / Detalle Técnico', 'Tipo', 'Mod.', 'Horas', 'Tarifa', 'Costo Total', 'Estado']];

  autoTable(doc, {
    startY: currentY,
    head: tableHeader,
    body: tableRows,
    theme: 'grid',
    styles: {
      fontSize: 8,
      textColor: [30, 41, 59],
      valign: 'middle',
      lineColor: [226, 232, 240],
      lineWidth: 0.15,
      cellPadding: 2
    },
    headStyles: {
      fillColor: isCliente ? [16, 185, 129] : [30, 41, 59],
      textColor: [255, 255, 255],
      fontStyle: 'bold',
      fontSize: 8,
      halign: 'center',
      valign: 'middle',
      lineColor: [30, 41, 59]
    },
    columnStyles: {
      0: { cellWidth: 15, halign: 'center' },
      1: { cellWidth: 28 },
      2: { cellWidth: 'auto' },
      3: { cellWidth: 22, halign: 'center' },
      4: { cellWidth: 14, halign: 'center' },
      5: { cellWidth: 16, halign: 'right' },
      6: { cellWidth: 18, halign: 'right' },
      7: { cellWidth: 24, halign: 'right' },
      8: { cellWidth: 22, halign: 'center' }
    },
    didParseCell: (data) => {
      // Formato especial para el estado
      if (data.section === 'body' && data.column.index === 8) {
        const val = String(data.cell.raw);
        if (val === 'Completado' || val === 'Entregado' || val === 'Facturado' || val === '✓') {
          data.cell.styles.textColor = [22, 101, 52];
          data.cell.styles.fontStyle = 'bold';
        } else if (val === 'En Desarrollo') {
          data.cell.styles.textColor = [29, 78, 216];
        } else if (val === 'Planificado') {
          data.cell.styles.textColor = [161, 98, 7];
        }
      }
    },
    foot: [
      [
        '',
        'TOTALES',
        `${features.length} funcionalidad(es) con tareas detalladas`,
        '',
        '',
        `${totalHoras.toFixed(1)} h`,
        '',
        `${currencySymbol} ${totalCosto.toLocaleString('es-PE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
        `${porcentajeAvance}% completado`
      ]
    ],
    footStyles: {
      fillColor: [241, 245, 249],
      textColor: [15, 23, 42],
      fontStyle: 'bold',
      fontSize: 8,
      halign: 'right',
      lineColor: [203, 213, 225]
    },
    margin: { left: 14, right: 14, bottom: 20 }
  });

  // 4. Pie de página con numeración
  const totalPages = (doc as any).internal.getNumberOfPages();
  for (let i = 1; i <= totalPages; i++) {
    doc.setPage(i);
    doc.setFontSize(8);
    doc.setTextColor(148, 163, 184); // slate-400
    doc.text(
      `Página ${i} de ${totalPages}  |  ${
        isCliente
          ? 'Propuesta de Funcionalidades y Entregables para el Cliente - EVA'
          : 'Documento de Control y Costeo Técnico - EVA'
      }`,
      pageWidth / 2,
      pageHeight - 8,
      { align: 'center' }
    );
  }

  // Descarga
  const sanitizeName = (config.projectName || 'EVA').replace(/[^a-zA-Z0-9]/g, '_');
  const dateStr = new Date().toISOString().split('T')[0];
  const filename = isCliente
    ? `Propuesta_Funcionalidades_${sanitizeName}_${dateStr}.pdf`
    : `Matriz_Costos_${sanitizeName}_${dateStr}.pdf`;
  doc.save(filename);
};
