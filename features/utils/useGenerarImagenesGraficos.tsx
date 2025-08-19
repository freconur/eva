import { useState, useRef, useCallback, useEffect } from 'react';
import { DataEstadisticas } from '@/features/types/types';

interface UseGenerarImagenesGraficosProps {
  reporteDirectorOrdenado: DataEstadisticas[] | undefined;
}

export const useGenerarImagenesGraficos = ({ reporteDirectorOrdenado }: UseGenerarImagenesGraficosProps) => {
  const [graficosImagenes, setGraficosImagenes] = useState<{[key: string]: string}>({});
  const [imagenesGeneradas, setImagenesGeneradas] = useState<boolean>(false);
  
  // Referencias para los gráficos
  const chartRefs = useRef<{[key: string]: any}>({});

  // Función para convertir el gráfico a imagen con mejor calidad
  const convertirGraficoAImagen = useCallback((idPregunta: string, canvasRef: HTMLCanvasElement | null) => {
    if (!canvasRef) return;
    
    try {
      // Crear un canvas temporal con dimensiones fijas para mejor calidad
      const tempCanvas = document.createElement('canvas');
      const tempCtx = tempCanvas.getContext('2d');
      
      // Dimensiones fijas para el PDF (más grandes para mejor calidad)
      const pdfWidth = 600;
      const pdfHeight = 400;
      
      tempCanvas.width = pdfWidth;
      tempCanvas.height = pdfHeight;
      
      if (tempCtx) {
        // Copiar el contenido del canvas original al temporal
        tempCtx.drawImage(canvasRef, 0, 0, pdfWidth, pdfHeight);
        
        // Convertir a base64 con mejor calidad
        const base64 = tempCanvas.toDataURL('image/png', 1.0);
        
        setGraficosImagenes(prev => {
          const newState = {
            ...prev,
            [idPregunta]: base64
          };
          
          // Verificar si se han generado todas las imágenes
          if (Object.keys(newState).length === reporteDirectorOrdenado?.length) {
            setImagenesGeneradas(true);
          }
          
          return newState;
        });
      }
    } catch (error) {
      console.error('Error al convertir gráfico a imagen:', error);
    }
  }, [reporteDirectorOrdenado]);

  // Función para generar todas las imágenes después de que se rendericen los gráficos
  const generarTodasLasImagenes = useCallback(() => {
    if (!reporteDirectorOrdenado || reporteDirectorOrdenado.length === 0) return;
    
    // Esperar un poco más para asegurar que todos los gráficos estén renderizados
    setTimeout(() => {
      reporteDirectorOrdenado.forEach((dat) => {
        const chartRef = chartRefs.current[dat.id || ''];
        if (chartRef && chartRef.canvas) {
          convertirGraficoAImagen(dat.id || '', chartRef.canvas);
        }
      });
    }, 1000);
  }, [reporteDirectorOrdenado, convertirGraficoAImagen]);

  // Función para limpiar las imágenes
  const limpiarImagenes = useCallback(() => {
    setGraficosImagenes({});
    setImagenesGeneradas(false);
  }, []);

  // Función para obtener la referencia de un gráfico
  const obtenerRefGrafico = useCallback((idPregunta: string) => {
    return (chartRef: any) => {
      if (chartRef) {
        // Guardar la referencia del gráfico
        chartRefs.current[idPregunta] = chartRef;
      }
    };
  }, []);

  // Efecto para forzar la regeneración de imágenes cuando cambien los datos
  useEffect(() => {
    if (reporteDirectorOrdenado && reporteDirectorOrdenado.length > 0) {
      // Limpiar imágenes existentes cuando cambien los datos
      limpiarImagenes();
      
      // Generar todas las imágenes después de un delay
      generarTodasLasImagenes();
    }
  }, [reporteDirectorOrdenado, generarTodasLasImagenes, limpiarImagenes]);

  // Efecto adicional para generar imágenes después de que se monten los gráficos
  useEffect(() => {
    if (Object.keys(chartRefs.current).length > 0 && reporteDirectorOrdenado && reporteDirectorOrdenado.length > 0) {
      // Verificar que todos los gráficos estén listos
      const todosLosGraficosListos = reporteDirectorOrdenado.every(dat => 
        chartRefs.current[dat.id || ''] && chartRefs.current[dat.id || ''].canvas
      );
      
      if (todosLosGraficosListos) {
        generarTodasLasImagenes();
      }
    }
  }, [chartRefs.current, reporteDirectorOrdenado, generarTodasLasImagenes]);

  return {
    graficosImagenes,
    imagenesGeneradas,
    chartRefs,
    convertirGraficoAImagen,
    generarTodasLasImagenes,
    limpiarImagenes,
    obtenerRefGrafico
  };
};
