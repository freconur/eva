import { useMemo, useCallback } from 'react';
import { Evaluacion, PromedioGlobalPorMes } from '@/features/types/types';
import { getMonthName } from '@/fuctions/dates';

interface UseChartOptionsProps {
  evaluacion: Evaluacion;
  promedioGlobal: PromedioGlobalPorMes[];
  valorMaximoNiveles: number;
  monthSelected: number;
}

export const useChartOptions = ({ evaluacion, promedioGlobal, valorMaximoNiveles, monthSelected }: UseChartOptionsProps) => {
  // Función para determinar el nivel basado en el puntaje
  const obtenerNivelPorPuntaje = useCallback((puntaje: number) => {
    if (!evaluacion?.nivelYPuntaje || evaluacion.nivelYPuntaje.length === 0) {
      return { nivel: 'Sin nivel', color: '#6B7280' };
    }

    // Ordenar por min de menor a mayor para encontrar el rango correcto
    const nivelesOrdenados = [...evaluacion.nivelYPuntaje].sort((a, b) => (a.min || 0) - (b.min || 0));
    
    for (const nivelData of nivelesOrdenados) {
      const min = nivelData.min || 0;
      const max = nivelData.max || 0;
      
      if (puntaje >= min && puntaje <= max) {
        return {
          nivel: nivelData.nivel || 'Sin nivel',
          color: nivelData.color || '#6B7280'
        };
      }
    }
    
    // Si no encuentra un rango, devolver el último nivel o un valor por defecto
    const ultimoNivel = nivelesOrdenados[nivelesOrdenados.length - 1];
    return {
      nivel: ultimoNivel?.nivel || 'Sin nivel',
      color: ultimoNivel?.color || '#6B7280'
    };
  }, [evaluacion?.nivelYPuntaje]);

  // Opciones comunes para todos los gráficos
  const opcionesComunes = useMemo(() => ({
    responsive: true,
    maintainAspectRatio: false,
    interaction: {
      intersect: false,
      mode: 'index' as const,
    },
    plugins: {
      legend: {
        position: 'top' as const,
        labels: {
          usePointStyle: true,
          pointStyle: 'circle',
          padding: 20,
          font: {
            size: 12,
            weight: 'normal' as const,
            family: "'Inter', sans-serif",
          },
          color: '#6B7280',
        },
      },
      title: {
        display: true,
        text: 'Gráfico de Tendencias',
        font: {
          size: 16,
          weight: 'bold' as const,
          family: "'Inter', sans-serif",
        },
        color: '#1F2937',
        padding: {
          top: 10,
          bottom: 20,
        },
      },
      tooltip: {
        backgroundColor: 'rgba(0, 0, 0, 0.8)',
        titleColor: '#ffffff',
        bodyColor: '#ffffff',
        borderColor: 'rgba(255, 255, 255, 0.1)',
        borderWidth: 1,
        cornerRadius: 8,
        displayColors: true,
        titleFont: {
          size: 13,
          weight: 'bold' as const,
        },
        bodyFont: {
          size: 12,
        },
        padding: 12,
      },
    },
    scales: {
      x: {
        offset: true,
        grid: {
          display: true,
          color: 'rgba(0, 0, 0, 0.05)',
          drawBorder: false,
        },
        ticks: {
          font: {
            size: 11,
            family: "'Inter', sans-serif",
          },
          color: '#6B7280',
          padding: 8,
        },
        border: {
          display: false,
        },
      },
      y: {
        beginAtZero: true,
        min: 0,
        max: valorMaximoNiveles,
        grid: {
          display: true,
          color: 'rgba(0, 0, 0, 0.05)',
          drawBorder: false,
        },
        ticks: {
          precision: 0,
          stepSize: 5,
          font: {
            size: 11,
            family: "'Inter', sans-serif",
          },
          color: '#6B7280',
          padding: 8,
        },
        border: {
          display: false,
        },
      },
    },
    elements: {
      line: {
        borderJoinStyle: 'round' as const,
        borderCapStyle: 'round' as const,
      },
    },
  }), [valorMaximoNiveles]);

  // Opciones específicas para el gráfico de pie
  const opcionesGraficoPie = useMemo(() => ({
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'bottom' as const,
        labels: {
          color: '#333',
          font: {
            size: 14,
          },
          padding: 20,
          generateLabels: function(chart: any) {
            const data = chart.data;
            if (data.labels.length && data.datasets.length) {
              const dataset = data.datasets[0];
              const total = dataset.data.reduce((a: number, b: number) => a + b, 0);
              
              return data.labels.map((label: string, index: number) => {
                const value = dataset.data[index];
                const percentage = total > 0 ? ((value / total) * 100).toFixed(1) : '0.0';
                
                return {
                  text: `${label}: ${value} (${percentage}%)`,
                  fillStyle: dataset.backgroundColor[index],
                  strokeStyle: dataset.borderColor[index],
                  lineWidth: dataset.borderWidth,
                  pointStyle: 'circle',
                  hidden: false,
                  index: index
                };
              });
            }
            return [];
          },
        },
      },
      title: {
        display: true,
        text: `Distribución de Estudiantes por Niveles - ${
          [
            'Enero',
            'Febrero',
            'Marzo',
            'Abril',
            'Mayo',
            'Junio',
            'Julio',
            'Agosto',
            'Septiembre',
            'Octubre',
            'Noviembre',
            'Diciembre',
          ][monthSelected] || `Mes ${monthSelected}`
        }`,
        color: '#333',
        font: {
          size: 18,
        },
      },
      tooltip: {
        backgroundColor: 'rgba(0, 0, 0, 0.8)',
        titleColor: '#fff',
        bodyColor: '#fff',
        borderColor: '#666',
        borderWidth: 1,
        cornerRadius: 8,
        callbacks: {
          label: function (context: any) {
            const total = context.dataset.data.reduce((a: number, b: number) => a + b, 0);
            const percentage = ((context.parsed / total) * 100).toFixed(1);
            return `${context.label}: ${context.parsed} estudiantes (${percentage}%)`;
          },
        },
      },
    },
  }), []);

  // Opciones para el gráfico de promedio
  const opcionesPromedio = useMemo(() => ({
    ...opcionesComunes,
    plugins: {
      ...opcionesComunes.plugins,
      title: {
        display: true,
        text: 'Promedio Global por Evaluación',
      },
      tooltip: {
        backgroundColor: 'rgba(0, 0, 0, 0.8)',
        titleColor: '#ffffff',
        bodyColor: '#ffffff',
        borderColor: 'rgba(255, 255, 255, 0.1)',
        borderWidth: 1,
        cornerRadius: 8,
        displayColors: true,
        titleFont: {
          size: 13,
          weight: 'bold' as const,
        },
        bodyFont: {
          size: 12,
        },
        padding: 12,
        callbacks: {
          title: function (context: any) {
            const datosOrdenados = [...promedioGlobal].sort((a, b) => a.mes - b.mes);
            const dato = datosOrdenados[context[0].dataIndex];
            return dato ? getMonthName(dato.mes) : context[0].label;
          },
          label: function (context: any) {
            if (context.datasetIndex === 0) {
              const datosOrdenados = [...promedioGlobal].sort((a, b) => a.mes - b.mes);
              const dato = datosOrdenados[context.dataIndex];
              const nivelInfo = obtenerNivelPorPuntaje(context.parsed.y);
              
              return [
                `Promedio Global: ${context.parsed.y.toFixed(2)}`,
                `Nivel: ${nivelInfo.nivel}`,
                `Total Estudiantes: ${dato?.totalEstudiantes || 'N/A'}`,
              ];
            }
            return context.dataset.label;
          },
        },
      },
    },
    scales: {
      ...opcionesComunes.scales,
      x: {
        ...opcionesComunes.scales.x,
        offset: true,
        grid: {
          display: true,
          color: 'rgba(0, 0, 0, 0.05)',
          drawBorder: false,
        },
        ticks: {
          font: {
            size: 11,
            family: "'Inter', sans-serif",
          },
          color: '#6B7280',
          padding: 8,
        },
        border: {
          display: false,
        },
      },
      y: {
        beginAtZero: true,
        min: 0,
        max: 900,
        ticks: {
          precision: 0,
          stepSize: 100,
          callback: function (value: any) {
            return Number(value).toFixed(0);
          },
        },
        grid: {
          display: true,
          color: 'rgba(0, 0, 0, 0.05)',
          drawBorder: false,
        },
        border: {
          display: false,
        },
      },
    },
  }), [opcionesComunes, promedioGlobal, obtenerNivelPorPuntaje]);

  // Opciones para el gráfico de barras
  const opcionesBarrasPromedio = useMemo(() => ({
    responsive: true,
    maintainAspectRatio: false,
    interaction: {
      intersect: false,
      mode: 'index' as const,
    },
    datasets: {
      bar: {
        barThickness: 40,
        maxBarThickness: 50,
      },
    },
    plugins: {
      legend: {
        position: 'top' as const,
        labels: {
          usePointStyle: true,
          pointStyle: 'rect',
          padding: 20,
          font: {
            size: 12,
            weight: 'normal' as const,
            family: "'Inter', sans-serif",
          },
          color: '#374151',
        },
      },
      title: {
        display: true,
        text: 'Promedio Global por Mes - Vista de Barras',
        font: {
          size: 16,
          weight: 'bold' as const,
          family: "'Inter', sans-serif",
        },
        color: '#1F2937',
        padding: {
          top: 10,
          bottom: 20,
        },
      },
      tooltip: {
        backgroundColor: 'rgba(0, 0, 0, 0.8)',
        titleColor: '#ffffff',
        bodyColor: '#ffffff',
        borderColor: 'rgba(255, 255, 255, 0.1)',
        borderWidth: 1,
        cornerRadius: 8,
        displayColors: true,
        titleFont: {
          size: 13,
          weight: 'bold' as const,
        },
        bodyFont: {
          size: 12,
        },
        padding: 12,
        callbacks: {
          title: function (context: any) {
            const datosOrdenados = [...promedioGlobal].sort((a, b) => a.mes - b.mes);
            const dato = datosOrdenados[context[0].dataIndex];
            return dato ? getMonthName(dato.mes) : context[0].label;
          },
          label: function (context: any) {
            const datosOrdenados = [...promedioGlobal].sort((a, b) => a.mes - b.mes);
            const dato = datosOrdenados[context.dataIndex];
            return [
              `Promedio Global: ${context.parsed.y.toFixed(2)}`,
              `Total Estudiantes: ${dato?.totalEstudiantes || 'N/A'}`,
            ];
          },
        },
      },
    },
    scales: {
      x: {
        offset: true,
        categoryPercentage: 0.6,
        barPercentage: 0.8,
        grid: {
          display: true,
          color: 'rgba(0, 0, 0, 0.05)',
          drawBorder: false,
        },
        ticks: {
          font: {
            size: 11,
            family: "'Inter', sans-serif",
          },
          color: '#6B7280',
          padding: 8,
        },
        border: {
          display: false,
        },
      },
      y: {
        beginAtZero: true,
        min: 0,
        max: 900,
        grid: {
          display: true,
          color: 'rgba(0, 0, 0, 0.05)',
          drawBorder: false,
        },
        ticks: {
          precision: 0,
          stepSize: 100,
          callback: function (value: any) {
            return Number(value).toFixed(0);
          },
          font: {
            size: 11,
            family: "'Inter', sans-serif",
          },
          color: '#6B7280',
          padding: 8,
        },
        border: {
          display: false,
        },
      },
    },
  }), [promedioGlobal]);

  return {
    opcionesComunes,
    opcionesGraficoPie,
    opcionesPromedio,
    opcionesBarrasPromedio,
    obtenerNivelPorPuntaje,
  };
};
