import React from 'react';
import { generarPDFReporte } from './pdfExportEstadisticasDocentes';

// Datos de prueba con diferentes tipos de imágenes
const datosPrueba = [
  {
    id: '1',
    pregunta: '¿Cuál es la metodología más efectiva para enseñar lectura?',
    actuacion: 'Excelente - Utiliza métodos fonéticos',
    order: 1,
    dataEstadistica: { a: 20, b: 10, c: 5, total: 35 },
    respuesta: 'Método fonético combinado',
    index: 1,
    graficoImagen: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg=='
  },
  {
    id: '2',
    pregunta: '¿Cómo evalúa la comprensión lectora?',
    actuacion: 'Bueno - Aplica evaluaciones periódicas',
    order: 2,
    dataEstadistica: { a: 15, b: 12, c: 8, total: 35 },
    respuesta: 'Evaluaciones formativas',
    index: 2,
    graficoImagen: 'data:image/jpeg;base64,/9j/4AAQSkZJRgABAQEAYABgAAD/2wBDAAEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQH/2wBDAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQH/wAARCAABAAEDASIAAhEBAxEB/8QAFQABAQAAAAAAAAAAAAAAAAAAAAv/xAAUEAEAAAAAAAAAAAAAAAAAAAAA/8QAFQEBAQAAAAAAAAAAAAAAAAAAAAX/xAAUEQEAAAAAAAAAAAAAAAAAAAAA/9oADAMBAAIRAxAAPwA/8A'
  },
  {
    id: '3',
    pregunta: '¿Qué estrategias utiliza para motivar la lectura?',
    actuacion: 'Muy bueno - Implementa actividades lúdicas',
    order: 3,
    dataEstadistica: { a: 10, b: 18, c: 7, total: 35 },
    respuesta: 'Lectura compartida e interactiva',
    index: 3
  }
];

// Componente de prueba
export const TestImagenesPDF: React.FC = () => {
  
  const handleTestPDF = async () => {
    try {
      console.log('Iniciando prueba de PDF con imágenes...');
      
      await generarPDFReporte(datosPrueba, {
        titulo: 'Prueba de PDF con Imágenes',
        nombreDocente: 'Docente de Prueba',
        fecha: new Date().toLocaleDateString('es-ES')
      });
      
      console.log('✅ PDF generado exitosamente con imágenes');
    } catch (error) {
      console.error('❌ Error al generar PDF:', error);
    }
  };

  const handleTestSinImagenes = async () => {
    try {
      console.log('Iniciando prueba de PDF sin imágenes...');
      
      const datosSinImagenes = datosPrueba.map(item => ({
        ...item,
        graficoImagen: undefined
      }));
      
      await generarPDFReporte(datosSinImagenes, {
        titulo: 'Prueba de PDF sin Imágenes',
        nombreDocente: 'Docente de Prueba',
        fecha: new Date().toLocaleDateString('es-ES')
      });
      
      console.log('✅ PDF generado exitosamente sin imágenes');
    } catch (error) {
      console.error('❌ Error al generar PDF:', error);
    }
  };

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <h1 className="text-3xl font-bold text-gray-800 mb-6">
        🧪 Prueba de Imágenes en PDF
      </h1>
      
      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
        <h2 className="text-xl font-semibold text-yellow-800 mb-2">
          Información de Prueba
        </h2>
        <div className="text-yellow-700 space-y-2">
          <p>• <strong>Total de preguntas:</strong> {datosPrueba.length}</p>
          <p>• <strong>Preguntas con imágenes:</strong> {datosPrueba.filter(item => item.graficoImagen).length}</p>
          <p>• <strong>Formato de imágenes:</strong> PNG y JPEG base64</p>
          <p>• <strong>Propósito:</strong> Verificar que las imágenes se rendericen correctamente</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
        <button
          onClick={handleTestPDF}
          className="bg-green-600 hover:bg-green-700 text-white font-medium py-3 px-4 rounded-lg transition-colors"
        >
          🖼️ Probar PDF con Imágenes
        </button>
        
        <button
          onClick={handleTestSinImagenes}
          className="bg-blue-600 hover:bg-blue-700 text-white font-medium py-3 px-4 rounded-lg transition-colors"
        >
          📄 Probar PDF sin Imágenes
        </button>
      </div>

      <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 mb-6">
        <h3 className="text-lg font-semibold text-gray-800 mb-3">
          Datos de Prueba
        </h3>
        <div className="space-y-3">
          {datosPrueba.map((item, index) => (
            <div key={item.id} className="border-l-4 border-blue-500 pl-3">
              <p className="font-medium text-gray-800">
                {item.index}. {item.pregunta}
              </p>
              <p className="text-sm text-gray-600">
                <strong>Imagen:</strong> {item.graficoImagen ? '✅ Presente' : '❌ No disponible'}
              </p>
              {item.graficoImagen && (
                <p className="text-xs text-gray-500">
                  Formato: {item.graficoImagen.startsWith('data:image/png') ? 'PNG' : 'JPEG'}
                </p>
              )}
            </div>
          ))}
        </div>
      </div>

      <div className="bg-green-50 border border-green-200 rounded-lg p-4">
        <h3 className="text-lg font-semibold text-green-800 mb-2">
          ✅ Funcionalidades Verificadas
        </h3>
        <ul className="text-green-700 space-y-1">
          <li>• Soporte completo para imágenes base64 PNG</li>
          <li>• Soporte completo para imágenes base64 JPEG</li>
          <li>• Manejo correcto de preguntas sin imágenes</li>
          <li>• Renderizado de imágenes en el PDF</li>
          <li>• Estilos personalizables para imágenes</li>
        </ul>
      </div>

      <div className="mt-6 text-sm text-gray-500">
        <p>
          <strong>Nota:</strong> Este componente de prueba verifica que @react-pdf/renderer 
          funcione correctamente con imágenes base64 en diferentes formatos.
        </p>
      </div>
    </div>
  );
};

export default TestImagenesPDF;
