import { useMemo } from 'react';

interface UseHighQualityChartOptionsProps {
  chartType: 'pie' | 'bar' | 'line';
  title?: string;
  showLegend?: boolean;
  legendPosition?: 'top' | 'bottom' | 'left' | 'right';
}

export const useHighQualityChartOptions = ({ 
  chartType, 
  title = 'Gráfico', 
  showLegend = true, 
  legendPosition = 'bottom' 
}: UseHighQualityChartOptionsProps) => {
  
  const highQualityOptions = useMemo(() => {
    const baseOptions = {
      responsive: true,
      maintainAspectRatio: false,
      // Configuración para alta calidad
      devicePixelRatio: 2, // Doble resolución para pantallas de alta densidad
      animation: {
        duration: 400, // Animación suave para efectos de hover
        easing: 'easeOutQuart' as const,
      },
      // Configuración de interacción para efectos de hover
      interaction: {
        intersect: false,
        mode: 'point' as const,
      },
      onHover: (event: any, activeElements: any) => {
        if (event.native) {
          const target = event.native.target as HTMLElement;
          if (activeElements && activeElements.length > 0) {
            target.style.cursor = 'pointer';
          } else {
            target.style.cursor = 'default';
          }
        }
      },
      // Configuración de renderizado para mejor calidad
      elements: {
        line: {
          borderJoinStyle: 'round' as const,
          borderCapStyle: 'round' as const,
          borderWidth: 3, // Líneas más gruesas para mejor visibilidad
        },
        point: {
          radius: 6, // Puntos más grandes
          hoverRadius: 8,
          borderWidth: 3,
        },
        arc: {
          borderWidth: 1, // Bordes mínimos para gráficos de pie
          borderAlign: 'inner' as const, // Bordes internos para mejor apariencia
          hoverOffset: 10, // Separación al hacer hover (efecto de "pop-out")
          hoverBorderWidth: 2, // Borde mínimo al hacer hover
          hoverBorderColor: '#ffffff', // Color del borde al hacer hover
        },
        bar: {
          borderWidth: 2, // Bordes para barras
        },
      },
      plugins: {
        legend: {
          display: showLegend,
          position: legendPosition,
          borderWidth: 0, // Sin borde en la leyenda
          labels: {
            usePointStyle: true,
            pointStyle: chartType === 'pie' ? 'circle' : 'rect',
            padding: 25, // Más espacio entre elementos
            font: {
              size: 16, // Fuente más grande
              weight: 'bold' as const,
              family: "'Inter', 'Helvetica', 'Arial', sans-serif",
            },
            color: '#1F2937',
            generateLabels: chartType === 'pie' ? function(chart: any) {
              const data = chart.data;
              if (data.labels.length && data.datasets.length) {
                const dataset = data.datasets[0];
                const total = dataset.data.reduce((a: number, b: number) => a + b, 0);
                
                return data.labels.map((label: string, index: number) => {
                  const value = dataset.data[index];
                  const percentage = total > 0 ? ((value / total) * 100).toFixed(1) : '0.0';
                  // Todos los indicadores son cuadrados
                  const pointStyle = 'rect';
                  
                  return {
                    text: `${label}: ${value} (${percentage}%)`,
                    fillStyle: dataset.backgroundColor[index],
                    strokeStyle: dataset.backgroundColor[index], // Sin borde, usar el mismo color
                    lineWidth: 0, // Sin borde en los indicadores
                    pointStyle: pointStyle,
                    hidden: false,
                    index: index
                  };
                });
              }
              return [];
            } : undefined,
          },
        },
        title: {
          display: true,
          text: title,
          font: {
            size: 20, // Título más grande
            weight: 'bold' as const,
            family: "'Inter', 'Helvetica', 'Arial', sans-serif",
          },
          color: '#1F2937',
          padding: {
            top: 15,
            bottom: 25,
          },
        },
        tooltip: {
          backgroundColor: 'rgba(15, 23, 42, 0.95)',
          titleColor: '#ffffff',
          bodyColor: '#ffffff',
          borderColor: 'rgba(59, 130, 246, 0.5)',
          borderWidth: 2,
          cornerRadius: 12,
          displayColors: true,
          titleFont: {
            size: 16,
            weight: 'bold' as const,
            family: "'Inter', 'Helvetica', 'Arial', sans-serif",
          },
          bodyFont: {
            size: 14,
            family: "'Inter', 'Helvetica', 'Arial', sans-serif",
          },
          padding: 16,
          titleSpacing: 8,
          bodySpacing: 6,
          boxPadding: 8,
          callbacks: chartType === 'pie' ? {
            title: function (context: any) {
              return `📊 ${context[0].label}`;
            },
            label: function (context: any) {
              const total = context.dataset.data.reduce((a: number, b: number) => a + b, 0);
              const percentage = ((context.parsed / total) * 100).toFixed(1);
              const estudiantes = context.parsed;
              
              return [
                `👥 Estudiantes: ${estudiantes.toLocaleString('es-PE')}`,
                `📈 Porcentaje: ${percentage}%`,
                `📊 Total: ${total.toLocaleString('es-PE')}`
              ];
            },
            labelColor: function (context: any) {
              return {
                borderColor: context.dataset.backgroundColor[context.dataIndex],
                backgroundColor: context.dataset.backgroundColor[context.dataIndex],
                borderWidth: 3,
                borderRadius: 4,
              };
            },
          } : undefined,
        },
      },
    };

    // Configuración específica por tipo de gráfico
    if (chartType === 'pie') {
      return {
        ...baseOptions,
        plugins: {
          ...baseOptions.plugins,
          legend: {
            ...baseOptions.plugins.legend,
            position: 'bottom' as const,
          },
        },
      };
    }

    if (chartType === 'bar' || chartType === 'line') {
      return {
        ...baseOptions,
        scales: {
          x: {
            offset: true,
            grid: {
              display: true,
              color: 'rgba(0, 0, 0, 0.1)',
              drawBorder: false,
              lineWidth: 2,
            },
            ticks: {
              font: {
                size: 14,
                weight: 'bold' as const,
                family: "'Inter', 'Helvetica', 'Arial', sans-serif",
              },
              color: '#374151',
              padding: 12,
            },
            border: {
              display: false,
            },
          },
          y: {
            beginAtZero: true,
            grid: {
              display: true,
              color: 'rgba(0, 0, 0, 0.1)',
              drawBorder: false,
              lineWidth: 2,
            },
            ticks: {
              font: {
                size: 14,
                weight: 'bold' as const,
                family: "'Inter', 'Helvetica', 'Arial', sans-serif",
              },
              color: '#374151',
              padding: 12,
            },
            border: {
              display: false,
            },
          },
        },
        datasets: chartType === 'bar' ? {
          bar: {
            barThickness: 50, // Barras más gruesas
            maxBarThickness: 60,
            borderRadius: 6, // Bordes redondeados
            borderSkipped: false,
          },
        } : undefined,
      };
    }

    return baseOptions;
  }, [chartType, title, showLegend, legendPosition]);

  return highQualityOptions;
};
