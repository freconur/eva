import { useState, useCallback, useMemo, useEffect } from 'react';
import { generarPDFReporte } from '@/features/utils/pdfExportEstadisticasDocentes';

interface UseGenerarPDFReporteProps {
  reporteCompleto: any[];
  currentUserData: {
    nombres?: string;
    apellidos?: string;
  };
  titulo: string;
  tipoUsuario: 'Docente' | 'Director' | 'Especialista';
  monthSelected?: number;
}

export const useGenerarPDFReporte = ({
  reporteCompleto,
  currentUserData,
  titulo,
  tipoUsuario,
  monthSelected
}: UseGenerarPDFReporteProps) => {
  // Estado para almacenar las imágenes de los gráficos
  const [graficosImagenes, setGraficosImagenes] = useState<{ [key: string]: string }>({});
  const [imagenesGeneradas, setImagenesGeneradas] = useState<boolean>(false);
  const [loadingPDF, setLoadingPDF] = useState<boolean>(false);
  // Función para convertir el gráfico a imagen con mejor calidad
  const convertirGraficoAImagen = useCallback(
    (idPregunta: string, canvasRef: HTMLCanvasElement | null) => {
      if (!canvasRef) return;

      try {
        // Crear un canvas temporal con dimensiones fijas para mejor calidad
        const tempCanvas = document.createElement('canvas');
        const tempCtx = tempCanvas.getContext('2d');

        // Dimensiones optimizadas para calidad y tamaño balanceado
        const pdfWidth = 900;
        const pdfHeight = 600;

        tempCanvas.width = pdfWidth;
        tempCanvas.height = pdfHeight;

        if (tempCtx) {
          // Configurar el contexto para mejor calidad
          tempCtx.imageSmoothingEnabled = true;
          tempCtx.imageSmoothingQuality = 'high';

          // Configurar DPI para mejor calidad de impresión (300 DPI)
          const dpi = 300;
          const scaleFactor = dpi / 96; // 96 es el DPI estándar de pantalla
          
          // Aplicar el factor de escala para DPI
          tempCtx.scale(scaleFactor, scaleFactor);

          // Copiar el contenido del canvas original al temporal con escalado suave
          tempCtx.drawImage(canvasRef, 0, 0, pdfWidth / scaleFactor, pdfHeight / scaleFactor);

          // Convertir a base64 con máxima calidad
          const base64 = tempCanvas.toDataURL('image/png', 1.0);

          setGraficosImagenes((prev) => {
            const newState = {
              ...prev,
              [idPregunta]: base64,
            };
            
            // Verificar si se han generado todas las imágenes
            if (Object.keys(newState).length === reporteCompleto?.length) {
              console.log('imagenes generadas cambia a true')
              setImagenesGeneradas(true);
            }
            
            return newState;
          });
        }
      } catch (error) {
        console.error('Error al convertir gráfico a imagen:', error);
      }
    },
    [reporteCompleto]
  );

  // Actualizar reporteCompleto cuando se generen las imágenes de los gráficos
  const reporteCompletoConImagenes = useMemo(() => {
    return reporteCompleto.map((item) => ({
      ...item,
      graficoImagen: graficosImagenes[item.id] || '',
    }));
  }, [reporteCompleto, graficosImagenes]);
/* console.log('reporteCompletoConImagenes', reporteCompletoConImagenes); */
  // Función para generar PDF
  const handleGenerarPDF = useCallback(async () => {
    setLoadingPDF(true);
    try {
      await generarPDFReporte(reporteCompletoConImagenes, {
        titulo,
        nombreDocente:
          `${currentUserData.nombres || ''} ${currentUserData.apellidos || ''}`.trim() || tipoUsuario,
        fecha: new Date().toLocaleDateString('es-ES'),
      });
    } catch (error) {
      console.error('Error al generar PDF:', error);
    } finally {
      setLoadingPDF(false);
    }
  }, [reporteCompletoConImagenes, titulo, currentUserData, tipoUsuario]);

  // Limpiar imágenes cuando cambie el mes o se reinicie
  const limpiarImagenes = useCallback(() => {
    setGraficosImagenes({});
    setImagenesGeneradas(false);
    setLoadingPDF(false); // Resetear también el estado de loading del PDF
  }, []);

  // Limpiar imágenes cuando cambie el mes
  useEffect(() => {
    limpiarImagenes();
  }, [monthSelected, limpiarImagenes]);

  return {
    graficosImagenes,
    imagenesGeneradas,
    loadingPDF,
    reporteCompletoConImagenes,
    convertirGraficoAImagen,
    handleGenerarPDF,
    limpiarImagenes
  };
};
