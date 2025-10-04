import { useCallback } from 'react';

// Hook personalizado para obtener colores de variables CSS
export const useColorsFromCSS = () => {
  // Función para obtener el valor real de una variable CSS
  const getCSSVariable = useCallback((variable: string): string => {
    if (typeof window === 'undefined') {
      // En el servidor, devolver valores por defecto
      return '#6b7280';
    }
    
    const root = document.documentElement;
    const value = getComputedStyle(root).getPropertyValue(variable).trim();
    return value || '#6b7280';
  }, []);

  // Función para obtener colores de niveles progresivos
  const getNivelColor = useCallback((nivel: string) => {
    const nivelLower = nivel.toLowerCase();
    
    if (nivelLower.includes('satisfactorio')) {
      const color = getCSSVariable('--satisfactorio');
      return { 
        bg: color, 
        border: color, 
        hoverBg: color, 
        hoverBorder: color 
      };
    } else if (nivelLower.includes('proceso')) {
      const color = getCSSVariable('--en-proceso');
      return { 
        bg: color, 
        border: color, 
        hoverBg: color, 
        hoverBorder: color 
      };
    } else if (nivelLower.includes('inicio') && !nivelLower.includes('previo')) {
      const color = getCSSVariable('--inicio');
      return { 
        bg: color, 
        border: color, 
        hoverBg: color, 
        hoverBorder: color 
      };
    } else if (nivelLower.includes('previo')) {
      const color = getCSSVariable('--previo-al-inicio');
      return { 
        bg: color, 
        border: color, 
        hoverBg: color, 
        hoverBorder: color 
      };
    }
    
    return { 
      bg: '#6b7280', 
      border: '#4b5563', 
      hoverBg: '#4b5563', 
      hoverBorder: '#6b7280' 
    };
  }, [getCSSVariable]);

  // Función para obtener colores de alternativas
  const getAlternativaColor = useCallback((alternativa: string) => {
    const variable = `--alternativa-${alternativa.toLowerCase()}`;
    return getCSSVariable(variable);
  }, [getCSSVariable]);

  // Función para obtener estilos de niveles para tarjetas/componentes
  const getNivelStyles = useCallback((nivel: string) => {
    const nivelLower = nivel.toLowerCase();
    
    if (nivelLower.includes('satisfactorio')) {
      const color = getCSSVariable('--satisfactorio');
      return { 
        bg: `color-mix(in srgb, ${color} 10%, white)`, 
        border: color, 
        text: color, 
        textValue: color 
      };
    } else if (nivelLower.includes('proceso')) {
      const color = getCSSVariable('--en-proceso');
      return { 
        bg: `color-mix(in srgb, ${color} 10%, white)`, 
        border: color, 
        text: color, 
        textValue: color 
      };
    } else if (nivelLower.includes('inicio') && !nivelLower.includes('previo')) {
      const color = getCSSVariable('--inicio');
      return { 
        bg: `color-mix(in srgb, ${color} 10%, white)`, 
        border: color, 
        text: color, 
        textValue: color 
      };
    } else if (nivelLower.includes('previo')) {
      const color = getCSSVariable('--previo-al-inicio');
      return { 
        bg: `color-mix(in srgb, ${color} 10%, white)`, 
        border: color, 
        text: color, 
        textValue: color 
      };
    }
    
    return { 
      bg: '#f9fafb', 
      border: '#6b7280', 
      text: '#374151', 
      textValue: '#6b7280' 
    };
  }, [getCSSVariable]);

  // Función para obtener colores de alternativas con transparencia para gráficos
  const getAlternativaColorWithOpacity = useCallback((alternativa: string, opacity: string = 'CC') => {
    const color = getAlternativaColor(alternativa);
    return `${color}${opacity}`;
  }, [getAlternativaColor]);

  // Función para preparar datos de gráfico pie con colores de niveles
  const preparePieChartData = useCallback((niveles: any[]) => {
    return {
      labels: niveles.map(nivel => {
        return nivel.nivel
          .split(' ')
          .map((word: string) => word.charAt(0).toUpperCase() + word.slice(1))
          .join(' ');
      }),
      datasets: [{
        data: niveles.map(nivel => nivel.cantidadDeEstudiantes),
        backgroundColor: niveles.map(nivel => getNivelColor(nivel.nivel).bg),
        borderColor: niveles.map(nivel => getNivelColor(nivel.nivel).border),
        borderWidth: 2,
        hoverBackgroundColor: niveles.map(nivel => getNivelColor(nivel.nivel).hoverBg),
        hoverBorderColor: niveles.map(nivel => getNivelColor(nivel.nivel).hoverBorder),
        hoverBorderWidth: 3
      }]
    };
  }, [getNivelColor]);

  // Función para preparar datos de gráfico de barras con colores de alternativas
  const prepareBarChartData = useCallback((data: any, respuesta: string, numOpciones: number = 4) => {
    const esRespuestaCorrecta = (opcion: string) => {
      return opcion.toLowerCase() === respuesta.toLowerCase();
    };

    const alternativas = ['a', 'b', 'c', 'd'];
    const dataValues = [data.a, data.b, data.c, data.d];
    
    const backgroundColor = alternativas.slice(0, numOpciones).map(alt => 
      esRespuestaCorrecta(alt) ? 'rgba(34, 197, 94, 0.8)' : getAlternativaColorWithOpacity(alt)
    );
    
    const borderColor = alternativas.slice(0, numOpciones).map(alt => 
      esRespuestaCorrecta(alt) ? 'rgb(34, 197, 94)' : getAlternativaColor(alt)
    );

    return {
      labels: alternativas.slice(0, numOpciones),
      datasets: [{
        label: 'total',
        data: dataValues.slice(0, numOpciones),
        backgroundColor,
        borderColor,
        borderWidth: 2
      }]
    };
  }, [getAlternativaColor, getAlternativaColorWithOpacity]);

  return {
    getCSSVariable,
    getNivelColor,
    getAlternativaColor,
    getNivelStyles,
    getAlternativaColorWithOpacity,
    preparePieChartData,
    prepareBarChartData
  };
};
