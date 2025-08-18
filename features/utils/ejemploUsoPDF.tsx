import React from 'react';
import { generarPDFReporte, generarPDFReporteComoBlob, generarPDFReporteComoURL } from './pdfExportEstadisticasDocentes';

// Ejemplo de datos de reporte con imágenes base64
const datosEjemplo = [
  {
    id: '1',
    pregunta: '¿Cuál es la metodología más efectiva para enseñar lectura en primer grado?',
    actuacion: 'Excelente - Utiliza métodos fonéticos y visuales',
    order: 1,
    dataEstadistica: {
      a: 15,
      b: 8,
      c: 3,
      d: 1,
      total: 27
    },
    respuesta: 'Método fonético combinado con lectura visual',
    index: 1,
    graficoImagen: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg=='
  },
  {
    id: '2',
    pregunta: '¿Cómo evalúa la comprensión lectora de sus estudiantes?',
    actuacion: 'Bueno - Aplica evaluaciones periódicas',
    order: 2,
    dataEstadistica: {
      a: 12,
      b: 10,
      c: 4,
      total: 26
    },
    respuesta: 'Evaluaciones formativas y sumativas',
    index: 2,
    graficoImagen: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg=='
  },
  {
    id: '3',
    pregunta: '¿Qué estrategias utiliza para motivar la lectura?',
    actuacion: 'Muy bueno - Implementa actividades lúdicas',
    order: 3,
    dataEstadistica: {
      a: 8,
      b: 15,
      c: 3,
      total: 26
    },
    respuesta: 'Lectura compartida y actividades interactivas',
    index: 3
  }
];

// Componente de ejemplo para mostrar el uso
export const EjemploUsoPDF: React.FC = () => {
  
  const handleDescargarPDF = async () => {
    try {
      await generarPDFReporte(datosEjemplo, {
        titulo: 'Reporte de Evaluación Docente',
        nombreDocente: 'María González',
        fecha: '15 de Diciembre, 2024'
      });
      console.log('PDF descargado exitosamente');
    } catch (error) {
      console.error('Error al descargar PDF:', error);
    }
  };

  const handleGenerarBlob = async () => {
    try {
      const blob = await generarPDFReporteComoBlob(datosEjemplo, {
        titulo: 'Reporte de Evaluación Docente',
        nombreDocente: 'María González',
        fecha: '15 de Diciembre, 2024'
      });
      
      // Aquí puedes hacer lo que quieras con el blob
      console.log('Blob generado:', blob);
      
      // Por ejemplo, enviarlo a un servidor
      // const formData = new FormData();
      // formData.append('pdf', blob, 'reporte.pdf');
      // await fetch('/api/upload', { method: 'POST', body: formData });
      
    } catch (error) {
      console.error('Error al generar blob:', error);
    }
  };

  const handleGenerarURL = async () => {
    try {
      const url = await generarPDFReporteComoURL(datosEjemplo, {
        titulo: 'Reporte de Evaluación Docente',
        nombreDocente: 'María González',
        fecha: '15 de Diciembre, 2024'
      });
      
      // Abrir en nueva pestaña para previsualización
      window.open(url, '_blank');
      
      // Limpiar la URL después de un tiempo
      setTimeout(() => {
        URL.revokeObjectURL(url);
      }, 60000); // 1 minuto
      
    } catch (error) {
      console.error('Error al generar URL:', error);
    }
  };

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <h1 className="text-3xl font-bold text-gray-800 mb-6">
        Ejemplo de Uso - Exportación de PDF con Imágenes
      </h1>
      
      <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-6">
        <h2 className="text-xl font-semibold text-green-800 mb-2">
          ✅ Funcionalidades Disponibles
        </h2>
        <ul className="text-green-700 space-y-1">
          <li>• <strong>generarPDFReporte:</strong> Descarga directa del PDF</li>
          <li>• <strong>generarPDFReporteComoBlob:</strong> Genera un blob para envío a servidor</li>
          <li>• <strong>generarPDFReporteComoURL:</strong> Genera URL para previsualización</li>
          <li>• <strong>Imágenes Base64:</strong> Soporte completo para gráficos y imágenes</li>
        </ul>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <button
          onClick={handleDescargarPDF}
          className="bg-green-600 hover:bg-green-700 text-white font-medium py-3 px-4 rounded-lg transition-colors"
        >
          📥 Descargar PDF
        </button>
        
        <button
          onClick={handleGenerarBlob}
          className="bg-blue-600 hover:bg-blue-700 text-white font-medium py-3 px-4 rounded-lg transition-colors"
        >
          🔄 Generar Blob
        </button>
        
        <button
          onClick={handleGenerarURL}
          className="bg-purple-600 hover:bg-purple-700 text-white font-medium py-3 px-4 rounded-lg transition-colors"
        >
          👁️ Previsualizar
        </button>
      </div>

      <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 mb-6">
        <h3 className="text-lg font-semibold text-gray-800 mb-3">
          Datos de Ejemplo
        </h3>
        <div className="text-sm text-gray-600 space-y-2">
          <p><strong>Total de preguntas:</strong> {datosEjemplo.length}</p>
          <p><strong>Docente:</strong> María González</p>
          <p><strong>Fecha:</strong> 15 de Diciembre, 2024</p>
          <p><strong>Preguntas con gráficos:</strong> {datosEjemplo.filter(item => item.graficoImagen).length}</p>
        </div>
      </div>

      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
        <h3 className="text-lg font-semibold text-blue-800 mb-3">
          🖼️ Soporte de Imágenes
        </h3>
        <div className="text-sm text-blue-700 space-y-2">
          <p>• <strong>Formato:</strong> Base64 (PNG, JPG, JPEG)</p>
          <p>• <strong>Componente:</strong> Image de @react-pdf/renderer</p>
          <p>• <strong>Estilos:</strong> Dimensiones personalizables</p>
          <p>• <strong>Cache:</strong> Deshabilitado para mejor rendimiento</p>
        </div>
      </div>

      <div className="mt-6 text-sm text-gray-500">
        <p>
          <strong>Nota:</strong> Este ejemplo muestra cómo usar las funciones de exportación de PDF 
          que utilizan @react-pdf/renderer para generar PDFs personalizables y modernos, 
          incluyendo soporte completo para imágenes base64.
        </p>
      </div>
    </div>
  );
};

export default EjemploUsoPDF;
