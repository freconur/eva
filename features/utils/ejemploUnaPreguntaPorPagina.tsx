import React from 'react';
import { generarPDFReporte } from './pdfExportEstadisticasDocentes';

// Datos de ejemplo para mostrar el formato de una pregunta por página
const datosEjemplo = [
  {
    id: '1',
    pregunta: '¿Cuál es la metodología más efectiva para enseñar lectura en primer grado?',
    actuacion: 'Excelente - Utiliza métodos fonéticos y visuales de manera sistemática, implementando estrategias de decodificación y comprensión lectora que se adaptan a las necesidades individuales de cada estudiante.',
    order: 1,
    dataEstadistica: {
      a: 25,
      b: 12,
      c: 8,
      d: 3,
      total: 48
    },
    respuesta: 'Método fonético combinado con lectura visual y estrategias de comprensión lectora',
    index: 1,
    graficoImagen: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg=='
  },
  {
    id: '2',
    pregunta: '¿Cómo evalúa la comprensión lectora de sus estudiantes de manera integral?',
    actuacion: 'Muy bueno - Aplica evaluaciones periódicas que incluyen comprensión literal, inferencial y crítica, utilizando diversos instrumentos como cuestionarios, entrevistas y observaciones sistemáticas.',
    order: 2,
    dataEstadistica: {
      a: 18,
      b: 20,
      c: 10,
      total: 48
    },
    respuesta: 'Evaluaciones formativas y sumativas que miden diferentes niveles de comprensión lectora',
    index: 2,
    graficoImagen: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg=='
  },
  {
    id: '3',
    pregunta: '¿Qué estrategias utiliza para motivar la lectura y fomentar el hábito lector?',
    actuacion: 'Bueno - Implementa actividades lúdicas como clubes de lectura, maratones de lectura y proyectos de lectura compartida, aunque podría diversificar más las estrategias motivacionales.',
    order: 3,
    dataEstadistica: {
      a: 15,
      b: 22,
      c: 11,
      total: 48
    },
    respuesta: 'Actividades lúdicas, clubes de lectura, proyectos colaborativos y reconocimientos',
    index: 3
  },
  {
    id: '4',
    pregunta: '¿Cómo adapta la enseñanza de la lectura para estudiantes con diferentes estilos de aprendizaje?',
    actuacion: 'Excelente - Desarrolla estrategias diferenciadas que consideran estilos visuales, auditivos y kinestésicos, adaptando materiales y metodologías según las necesidades individuales.',
    order: 4,
    dataEstadistica: {
      a: 28,
      b: 15,
      c: 5,
      total: 48
    },
    respuesta: 'Estrategias diferenciadas que consideran estilos visuales, auditivos y kinestésicos',
    index: 4,
    graficoImagen: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg=='
  }
];

// Componente de ejemplo para mostrar el nuevo formato
export const EjemploUnaPreguntaPorPagina: React.FC = () => {
  
  const handleGenerarPDF = async () => {
    try {
      console.log('Generando PDF con formato de una pregunta por página...');
      
      await generarPDFReporte(datosEjemplo, {
        titulo: 'Reporte de Evaluación Docente - Una Pregunta por Página',
        nombreDocente: 'María González Fernández',
        fecha: '20 de Diciembre, 2024'
      });
      
      console.log('✅ PDF generado exitosamente con formato de una pregunta por página');
    } catch (error) {
      console.error('❌ Error al generar PDF:', error);
    }
  };

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <h1 className="text-3xl font-bold text-gray-800 mb-6">
        📄 Nuevo Formato: Una Pregunta por Página
      </h1>
      
      <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-6">
        <h2 className="text-xl font-semibold text-green-800 mb-2">
          ✅ Características del Nuevo Formato
        </h2>
        <ul className="text-green-700 space-y-1">
          <li>• <strong>Página 1:</strong> Datos del docente + Primera pregunta</li>
          <li>• <strong>Páginas 2+:</strong> Una pregunta por página</li>
          <li>• <strong>Mejor legibilidad:</strong> Más espacio para cada pregunta</li>
          <li>• <strong>Navegación clara:</strong> Numeración de páginas</li>
          <li>• <strong>Imágenes más grandes:</strong> 350×200 píxeles</li>
        </ul>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <h3 className="text-lg font-semibold text-blue-800 mb-3">
            🖼️ Página 1 - Datos del Docente
          </h3>
          <div className="text-blue-700 space-y-2">
            <p>• Encabezado del reporte</p>
            <p>• Información del docente</p>
            <p>• Primera pregunta completa</p>
            <p>• Gráfico de la primera pregunta</p>
            <p>• Pie de página con numeración</p>
          </div>
        </div>

        <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
          <h3 className="text-lg font-semibold text-purple-800 mb-3">
            📋 Páginas Adicionales
          </h3>
          <div className="text-purple-700 space-y-2">
            <p>• Encabezado simplificado</p>
            <p>• Una pregunta por página</p>
            <p>• Gráficos cuando estén disponibles</p>
            <p>• Numeración progresiva</p>
            <p>• Mejor distribución del espacio</p>
          </div>
        </div>
      </div>

      <div className="text-center mb-6">
        <button
          onClick={handleGenerarPDF}
          className="bg-green-600 hover:bg-green-700 text-white font-medium py-4 px-8 rounded-lg transition-colors text-xl"
        >
          📄 Generar PDF con Nuevo Formato
        </button>
      </div>

      <div className="bg-gray-50 border border-gray-200 rounded-lg p-6 mb-6">
        <h3 className="text-lg font-semibold text-gray-800 mb-4">
          📊 Estructura del Reporte
        </h3>
        
        <div className="space-y-4">
          {datosEjemplo.map((item, index) => (
            <div key={item.id} className="border-l-4 border-blue-500 pl-4">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="font-semibold text-gray-800">
                    Página {index + 1}: {item.pregunta.substring(0, 60)}...
                  </h4>
                  <p className="text-sm text-gray-600 mt-1">
                    <strong>Actuación:</strong> {item.actuacion.substring(0, 80)}...
                  </p>
                  <p className="text-sm text-gray-600">
                    <strong>Gráfico:</strong> {item.graficoImagen ? '✅ Presente' : '❌ No disponible'}
                  </p>
                </div>
                <div className="text-right">
                  <div className="text-2xl font-bold text-blue-600">{index + 1}</div>
                  <div className="text-xs text-gray-500">Página</div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
        <h3 className="text-lg font-semibold text-yellow-800 mb-3">
          💡 Beneficios del Nuevo Formato
        </h3>
        <div className="text-yellow-700 space-y-2">
          <li>• <strong>Legibilidad mejorada:</strong> Cada pregunta tiene su propio espacio</li>
          <li>• <strong>Imágenes más grandes:</strong> Gráficos de 350×200 píxeles</li>
          <li>• <strong>Mejor organización:</strong> Estructura clara y navegable</li>
          <li>• <strong>Impresión optimizada:</strong> Cada pregunta en una hoja separada</li>
          <li>• <strong>Análisis detallado:</strong> Más espacio para estadísticas y observaciones</li>
        </div>
      </div>

      <div className="mt-6 text-sm text-gray-500 text-center">
        <p>
          <strong>Nota:</strong> Este nuevo formato genera un PDF donde cada pregunta ocupa una página completa, 
          mejorando significativamente la legibilidad y presentación del reporte.
        </p>
      </div>
    </div>
  );
};

export default EjemploUnaPreguntaPorPagina;
