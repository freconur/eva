import { useMemo } from 'react';
import styles from '@/components/grafico-tendencia/grafico-tendencia.module.css';

interface ColorConfig {
  bg: string;
  border: string;
  hoverBg: string;
  hoverBorder: string;
}

interface StyleClasses {
  card: string;
  title: string;
  value: string;
  percentage: string;
}

export const useNivelColors = () => {
  // Función para obtener el color según el nivel
  const obtenerColorPorNivel = useMemo(() => {
    return (nivel: string): ColorConfig => {
      const nivelLower = nivel.toLowerCase();
      if (nivelLower.includes('satisfactorio')) {
        return { bg: '#10b981', border: '#059669', hoverBg: '#059669', hoverBorder: '#10b981' };
      } else if (nivelLower.includes('proceso')) {
        return { bg: '#f59e0b', border: '#d97706', hoverBg: '#d97706', hoverBorder: '#f59e0b' };
      } else if (nivelLower.includes('inicio') && !nivelLower.includes('previo')) {
        return { bg: '#ef4444', border: '#dc2626', hoverBg: '#dc2626', hoverBorder: '#ef4444' };
      } else if (nivelLower.includes('previo')) {
        return { bg: '#8b5cf6', border: '#7c3aed', hoverBg: '#7c3aed', hoverBorder: '#8b5cf6' };
      }
      return { bg: '#6b7280', border: '#4b5563', hoverBg: '#4b5563', hoverBorder: '#6b7280' };
    };
  }, []);

  // Función para obtener las clases CSS según el nivel
  const obtenerClasesColorPorNivel = useMemo(() => {
    return (nivel: string): StyleClasses => {
      const nivelLower = nivel.toLowerCase();
      if (nivelLower.includes('satisfactorio')) {
        return {
          card: styles.statCardSatisfactorio,
          title: styles.statTitleSatisfactorio,
          value: styles.statValueSatisfactorio,
          percentage: styles.statPercentageSatisfactorio,
        };
      } else if (nivelLower.includes('proceso')) {
        return {
          card: styles.statCardProceso,
          title: styles.statTitleProceso,
          value: styles.statValueProceso,
          percentage: styles.statPercentageProceso,
        };
      } else if (nivelLower.includes('inicio') && !nivelLower.includes('previo')) {
        return {
          card: styles.statCardInicio,
          title: styles.statTitleInicio,
          value: styles.statValueInicio,
          percentage: styles.statPercentageInicio,
        };
      } else if (nivelLower.includes('previo')) {
        return {
          card: styles.statCardPrevio,
          title: styles.statTitlePrevio,
          value: styles.statValuePrevio,
          percentage: styles.statPercentagePrevio,
        };
      }
      return {
        card: styles.statCardDefault,
        title: styles.statTitleDefault,
        value: styles.statValueDefault,
        percentage: styles.statPercentageDefault,
      };
    };
  }, []);

  return {
    obtenerColorPorNivel,
    obtenerClasesColorPorNivel,
  };
};
