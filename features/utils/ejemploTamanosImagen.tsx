import React, { useState } from 'react';
import { generarPDFReporte } from './pdfExportEstadisticasDocentes';

// Diferentes configuraciones de tamaño de imagen
const configuracionesImagen = {
  pequena: { width: 200, height: 120, label: 'Pequeña (200x120px)' },
  mediana: { width: 350, height: 200, label: 'Mediana (350x200px) - Actual' },
  grande: { width: 500, height: 300, label: 'Grande (500x300px)' },
  extraGrande: { width: 600, height: 400, label: 'Extra Grande (600x400px)' }
};

// Datos de ejemplo
const datosEjemplo = [
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
    graficoImagen: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg=='
  }
];

// Componente para mostrar diferentes tamaños
export const EjemploTamanosImagen: React.FC = () => {
  const [tamanoSeleccionado, setTamanoSeleccionado] = useState('mediana');
  const [mostrarVistaPrevia, setMostrarVistaPrevia] = useState(false);

  const handleGenerarPDF = async () => {
    try {
      const config = configuracionesImagen[tamanoSeleccionado as keyof typeof configuracionesImagen];
      
      console.log(`Generando PDF con imágenes de tamaño: ${config.label}`);
      
      await generarPDFReporte(datosEjemplo, {
        titulo: `Reporte con Imágenes ${config.label}`,
        nombreDocente: 'Docente Ejemplo',
        fecha: new Date().toLocaleDateString('es-ES')
      });
      
      console.log('✅ PDF generado exitosamente');
    } catch (error) {
      console.error('❌ Error al generar PDF:', error);
    }
  };

  const config = configuracionesImagen[tamanoSeleccionado as keyof typeof configuracionesImagen];

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <h1 className="text-3xl font-bold text-gray-800 mb-6">
        🖼️ Ejemplo de Tamaños de Imagen en PDF
      </h1>
      
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
        <h2 className="text-xl font-semibold text-blue-800 mb-2">
          Selecciona el Tamaño de Imagen
        </h2>
        <p className="text-blue-700">
          Elige el tamaño que mejor se adapte a tus necesidades. Las imágenes más grandes 
          serán más detalladas pero ocuparán más espacio en el PDF.
        </p>
      </div>

      {/* Selector de tamaños */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        {Object.entries(configuracionesImagen).map(([key, config]) => (
          <button
            key={key}
            onClick={() => setTamanoSeleccionado(key)}
            className={`p-4 rounded-lg border-2 transition-all ${
              tamanoSeleccionado === key
                ? 'border-blue-500 bg-blue-50 text-blue-800'
                : 'border-gray-200 bg-white hover:border-gray-300'
            }`}
          >
            <div className="text-center">
              <div className="text-lg font-semibold mb-2">{config.label}</div>
              <div className="text-sm text-gray-600">
                {config.width} × {config.height}px
              </div>
            </div>
          </button>
        ))}
      </div>

      {/* Vista previa del tamaño */}
      <div className="bg-gray-50 border border-gray-200 rounded-lg p-6 mb-6">
        <h3 className="text-lg font-semibold text-gray-800 mb-4">
          Vista Previa del Tamaño Seleccionado
        </h3>
        
        <div className="flex items-center justify-center">
          <div 
            className="bg-white border-2 border-dashed border-gray-300 flex items-center justify-center text-gray-500"
            style={{ 
              width: `${config.width / 3}px`, 
              height: `${config.height / 3}px` 
            }}
          >
            <div className="text-center">
              <div className="text-sm font-medium">Vista Previa</div>
              <div className="text-xs">{config.width} × {config.height}px</div>
            </div>
          </div>
        </div>
        
        <div className="mt-4 text-center text-sm text-gray-600">
          <p><strong>Tamaño en PDF:</strong> {config.width} × {config.height} píxeles</p>
          <p><strong>Proporción:</strong> {(config.width / config.height).toFixed(2)}:1</p>
        </div>
      </div>

      {/* Botón de generación */}
      <div className="text-center mb-6">
        <button
          onClick={handleGenerarPDF}
          className="bg-green-600 hover:bg-green-700 text-white font-medium py-3 px-6 rounded-lg transition-colors text-lg"
        >
          🖼️ Generar PDF con Imágenes {config.label}
        </button>
      </div>

      {/* Información adicional */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-green-50 border border-green-200 rounded-lg p-4">
          <h3 className="text-lg font-semibold text-green-800 mb-3">
            ✅ Ventajas del Tamaño Actual
          </h3>
          <ul className="text-green-700 space-y-2">
            <li>• <strong>350×200px:</strong> Balance entre detalle y espacio</li>
            <li>• <strong>Legibilidad:</strong> Gráficos claros y comprensibles</li>
            <li>• <strong>Espacio:</strong> No ocupa demasiado en la página</li>
            <li>• <strong>Calidad:</strong> Suficiente para análisis detallado</li>
          </ul>
        </div>

        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <h3 className="text-lg font-semibold text-yellow-800 mb-3">
            💡 Recomendaciones
          </h3>
          <ul className="text-yellow-700 space-y-2">
            <li>• <strong>200×120px:</strong> Para listas compactas</li>
            <li>• <strong>350×200px:</strong> Para reportes estándar</li>
            <li>• <strong>500×300px:</strong> Para análisis detallados</li>
            <li>• <strong>600×400px:</strong> Para presentaciones</li>
          </ul>
        </div>
      </div>

      <div className="mt-6 text-sm text-gray-500 text-center">
        <p>
          <strong>Nota:</strong> Los tamaños se pueden personalizar modificando los estilos 
          en el archivo <code>pdfExportEstadisticasDocentes.tsx</code>
        </p>
      </div>
    </div>
  );
};

export default EjemploTamanosImagen;
