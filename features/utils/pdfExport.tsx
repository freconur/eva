import React from 'react';
import { Page, Text, View, Document, pdf, StyleSheet, Font } from '@react-pdf/renderer';

// Registrar fuentes personalizadas (opcional)
Font.register({
  family: 'Helvetica',
  fonts: [
    { src: 'https://fonts.gstatic.com/s/helveticaneue/v70/1Ptsg8zYS_SKggPNyC0IT4ttDfA.ttf', fontWeight: 'normal' },
    { src: 'https://fonts.gstatic.com/s/helveticaneue/v70/1Ptsg8zYS_SKggPNyC0IT4ttDfB.ttf', fontWeight: 'bold' },
  ]
});

interface ReporteItem {
  pregunta: string;
  actuacion: string;
  order: number;
  id: string;
  dataEstadistica: {
    a?: number;
    b?: number;
    c?: number;
    d?: number;
    total?: number;
  };
  respuesta: string;
  index: number;
  graficoImagen?: string;
}

interface GenerarPDFOptions {
  titulo?: string;
  nombreDocente?: string;
  fecha?: string;
}

// Estilos para el PDF
const styles = StyleSheet.create({
  page: {
    padding: 30,
    fontSize: 12,
    fontFamily: 'Helvetica',
  },
  header: {
    marginBottom: 20,
    textAlign: 'center',
    borderBottom: '2 solid #333',
    paddingBottom: 10,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 5,
    color: '#2c3e50',
  },
  subtitle: {
    fontSize: 14,
    color: '#7f8c8d',
    marginBottom: 10,
  },
  infoSection: {
    marginBottom: 20,
    padding: 15,
    backgroundColor: '#f8f9fa',
    borderRadius: 5,
  },
  infoRow: {
    flexDirection: 'row',
    marginBottom: 8,
    alignItems: 'center',
  },
  infoLabel: {
    fontWeight: 'bold',
    width: '30%',
    color: '#34495e',
  },
  infoValue: {
    width: '70%',
    color: '#2c3e50',
  },
  questionSection: {
    marginBottom: 25,
    padding: 15,
    border: '1 solid #ddd',
    borderRadius: 5,
    backgroundColor: '#fff',
  },
  questionNumber: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#2c3e50',
    marginBottom: 10,
  },
  questionText: {
    fontSize: 14,
    marginBottom: 10,
    lineHeight: 1.4,
    color: '#34495e',
  },
  questionDetails: {
    marginBottom: 8,
    paddingLeft: 10,
  },
  questionLabel: {
    fontWeight: 'bold',
    color: '#7f8c8d',
    marginRight: 5,
  },
  questionValue: {
    color: '#2c3e50',
  },
  statsContainer: {
    marginTop: 10,
    padding: 10,
    backgroundColor: '#ecf0f1',
    borderRadius: 3,
  },
  statsText: {
    fontSize: 12,
    color: '#34495e',
    textAlign: 'center',
  },
  chartContainer: {
    marginTop: 15,
    alignItems: 'center',
  },
  chartImage: {
    maxWidth: '100%',
    maxHeight: 100,
  },
  separator: {
    borderTop: '1 solid #ddd',
    marginTop: 15,
    marginBottom: 15,
  },
  footer: {
    position: 'absolute',
    bottom: 30,
    left: 30,
    right: 30,
    textAlign: 'center',
    fontSize: 10,
    color: '#7f8c8d',
    borderTop: '1 solid #ddd',
    paddingTop: 10,
  },
  pageNumber: {
    textAlign: 'center',
    fontSize: 10,
    color: '#95a5a6',
  },
});

// Componente para la información del reporte
const ReporteInfo = ({ titulo, nombreDocente, fecha }: GenerarPDFOptions) => (
  <View style={styles.header}>
    <Text style={styles.title}>{titulo}</Text>
    <Text style={styles.subtitle}>Sistema de Evaluación Docente</Text>
  </View>
);

// Componente para la información del docente
const DocenteInfo = ({ nombreDocente, fecha }: { nombreDocente: string; fecha: string }) => (
  <View style={styles.infoSection}>
    <View style={styles.infoRow}>
      <Text style={styles.infoLabel}>Docente:</Text>
      <Text style={styles.infoValue}>{nombreDocente}</Text>
    </View>
    <View style={styles.infoRow}>
      <Text style={styles.infoLabel}>Fecha:</Text>
      <Text style={styles.infoValue}>{fecha}</Text>
    </View>
  </View>
);

// Componente para una pregunta individual
const PreguntaItem = ({ item }: { item: ReporteItem }) => {
  const { a = 0, b = 0, c = 0, d, total = 1 } = item.dataEstadistica;
  
  const calcularPorcentaje = (valor: number) => ((valor / total) * 100).toFixed(0);
  
  return (
    <View style={styles.questionSection}>
      <Text style={styles.questionNumber}>
        {item.index}. {item.pregunta}
      </Text>
      
      <View style={styles.questionDetails}>
        <Text>
          <Text style={styles.questionLabel}>Actuación:</Text>
          <Text style={styles.questionValue}> {item.actuacion}</Text>
        </Text>
      </View>
      
      <View style={styles.questionDetails}>
        <Text>
          <Text style={styles.questionLabel}>Respuesta correcta:</Text>
          <Text style={styles.questionValue}> {item.respuesta}</Text>
        </Text>
      </View>
      
      <View style={styles.statsContainer}>
        <Text style={styles.statsText}>
          Estadísticas: A={a} ({calcularPorcentaje(a)}%), B={b} ({calcularPorcentaje(b)}%), C={c} ({calcularPorcentaje(c)}%)
          {d !== undefined ? `, D=${d} (${calcularPorcentaje(d)}%)` : ''}
        </Text>
      </View>
      
      {item.graficoImagen && (
        <View style={styles.chartContainer}>
          <Text style={styles.questionLabel}>Gráfico de resultados:</Text>
          {/* Nota: @react-pdf/renderer no soporta imágenes base64 directamente en el navegador */}
          <Text style={styles.questionValue}>[Gráfico disponible en el reporte digital]</Text>
        </View>
      )}
      
      <View style={styles.separator} />
    </View>
  );
};

// Componente principal del documento PDF
const ReportePDF = ({ 
  reporteCompleto, 
  options 
}: { 
  reporteCompleto: ReporteItem[]; 
  options: GenerarPDFOptions;
}) => {
  const {
    titulo = 'Reporte de Evaluación',
    nombreDocente = 'Docente',
    fecha = new Date().toLocaleDateString('es-ES')
  } = options;

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        <ReporteInfo titulo={titulo} nombreDocente={nombreDocente} fecha={fecha} />
        <DocenteInfo nombreDocente={nombreDocente} fecha={fecha} />
        
        {reporteCompleto.map((item, index) => (
          <PreguntaItem key={`${item.id}-${index}`} item={item} />
        ))}
        
        <View style={styles.footer}>
          <Text style={styles.pageNumber}>
            Generado el {new Date().toLocaleDateString('es-ES')} a las {new Date().toLocaleTimeString('es-ES')}
          </Text>
        </View>
      </Page>
    </Document>
  );
};

// Función principal para generar y descargar el PDF
export const generarPDFReporte = async (
  reporteCompleto: ReporteItem[],
  options: GenerarPDFOptions = {}
): Promise<void> => {
  try {
    const blob = await pdf(
      <ReportePDF reporteCompleto={reporteCompleto} options={options} />
    ).toBlob();
    
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `reporte_evaluacion_${options.nombreDocente || 'docente'}_${options.fecha || new Date().toLocaleDateString('es-ES').replace(/\//g, '-')}.pdf`;
    
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  } catch (error) {
    console.error('Error al generar el PDF:', error);
    throw new Error('No se pudo generar el PDF');
  }
};

// Función que devuelve el PDF como blob
export const generarPDFReporteComoBlob = async (
  reporteCompleto: ReporteItem[],
  options: GenerarPDFOptions = {}
): Promise<Blob> => {
  try {
    const blob = await pdf(
      <ReportePDF reporteCompleto={reporteCompleto} options={options} />
    ).toBlob();
    
    return blob;
  } catch (error) {
    console.error('Error al generar el PDF como blob:', error);
    throw new Error('No se pudo generar el PDF');
  }
};

// Función para generar URL del PDF (útil para previsualización)
export const generarPDFReporteComoURL = async (
  reporteCompleto: ReporteItem[],
  options: GenerarPDFOptions = {}
): Promise<string> => {
  try {
    const blob = await pdf(
      <ReportePDF reporteCompleto={reporteCompleto} options={options} />
    ).toBlob();
    
    return URL.createObjectURL(blob);
  } catch (error) {
    console.error('Error al generar la URL del PDF:', error);
    throw new Error('No se pudo generar la URL del PDF');
  }
};
