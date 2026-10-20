export interface ChartOptionsConfig {
  maxScaleValue?: number;
  onHover?: (event: any, chartElements: any[]) => void;
  targetNounSingular?: string;
  groupNoun?: string;
}

export const getDimensionBarOptions = (
  dimList: any[] = [],
  maxGlobalDomainScore: number = 20,
  onHover?: (event: any, chartElements: any[]) => void
) => ({
  responsive: true,
  maintainAspectRatio: false,
  animation: {
    duration: 350,
    easing: 'easeOutQuart' as const,
  },
  transitions: {
    active: {
      animation: {
        duration: 300,
        easing: 'easeOutQuart' as const,
      },
    },
  },
  onHover,
  indexAxis: 'y' as const,
  layout: {
    padding: {
      left: 10,
      right: 120,
      top: 5,
      bottom: 5,
    },
  },
  categoryPercentage: 0.65,
  barPercentage: 0.9,
  plugins: {
    customItemData: dimList || [],
    legend: {
      display: false,
    },
    title: {
      display: true,
      text: 'Rendimiento Global por Dominio (Suma de Criterios)',
      font: {
        family: 'Montserrat, sans-serif',
        size: 13,
        weight: 'bold' as const,
      },
      padding: {
        bottom: 15,
      },
    },
    tooltip: {
      callbacks: {
        title: (tooltipItems: any[]) => {
          const item = tooltipItems[0];
          if (!item) return '';
          const label = item.label;
          return Array.isArray(label) ? label.join(' ') : label;
        },
        label: (context: any) => {
          const item = dimList ? dimList[context.dataIndex] : null;
          const evalIndex = context.datasetIndex;
          const evData = item?.evalsData?.[evalIndex];
          if (!evData) return '';
          const score = evData.domainScore;
          const fase = evData.fase;
          const nivel = evData.nivel?.nivel;
          return ` ${fase}: ${score} pts promedio global en dimensión ${nivel ? `[${nivel}]` : ''}`;
        },
        afterBody: (context: any) => {
          const item = dimList ? dimList[context[0].dataIndex] : null;
          if (!item) return '';
          const lines: string[] = [];
          const latestScore = item.latestDomainScore ?? item.latestScore;
          if (latestScore !== undefined) {
            const nivel = item.nivelNombre ? ` [${item.nivelNombre}]` : '';
            lines.push(`\n⭐ Promedio Vigente del Dominio: ${latestScore} pts${nivel}`);
            lines.push(`   (Promedio de la última evaluación de todos los evaluados)`);
          }
          if (item.evalsData && item.evalsData.length > 1) {
            lines.push('\nHistorial del Dominio por Fases:');
            item.evalsData.forEach((ev: any, idx: number) => {
              const s = ev.domainScore;
              const f = ev.fase;
              const n = ev.nivel?.nivel || '—';
              lines.push(`• Fase ${idx + 1} (${f}): ${s} pts prom global [${n}]`);
            });
          }
          return lines;
        },
      },
    },
  },
  scales: {
    x: {
      stacked: true,
      beginAtZero: true,
      suggestedMax: maxGlobalDomainScore,
      grid: {
        color: '#f1f5f9',
      },
      ticks: {
        font: {
          family: 'Montserrat, sans-serif',
          size: 11,
        },
        color: '#64748b',
      },
    },
    y: {
      stacked: true,
      grid: {
        display: false,
      },
      ticks: {
        autoSkip: false,
        font: {
          family: 'Montserrat, sans-serif',
          size: 11,
          weight: 'normal' as const,
        },
        color: '#1e293b',
        padding: 10,
      },
    },
  },
});

export const getDimensionVerticalBarOptions = (
  dimList: any[] = [],
  maxGlobalDomainScore: number = 20,
  onHover?: (event: any, chartElements: any[]) => void
) => ({
  responsive: true,
  maintainAspectRatio: false,
  indexAxis: 'x' as const,
  animation: {
    duration: 350,
    easing: 'easeOutQuart' as const,
  },
  transitions: {
    active: {
      animation: {
        duration: 300,
        easing: 'easeOutQuart' as const,
      },
    },
  },
  onHover,
  layout: {
    padding: {
      top: 30,
      bottom: 5,
      left: 10,
      right: 10,
    },
  },
  categoryPercentage: 0.65,
  barPercentage: 0.9,
  plugins: {
    customItemData: dimList || [],
    legend: {
      display: false,
    },
    title: {
      display: true,
      text: 'Rendimiento Global por Dominio (Suma de Criterios)',
      font: {
        family: 'Montserrat, sans-serif',
        size: 13,
        weight: 'bold' as const,
      },
      padding: {
        bottom: 15,
      },
    },
    tooltip: {
      callbacks: {
        title: (tooltipItems: any[]) => {
          const item = tooltipItems[0];
          if (!item) return '';
          const label = item.label;
          return Array.isArray(label) ? label.join(' ') : label;
        },
        label: (context: any) => {
          const item = dimList ? dimList[context.dataIndex] : null;
          const evalIndex = context.datasetIndex;
          const evData = item?.evalsData?.[evalIndex];
          if (!evData) return '';
          const score = evData.domainScore;
          const fase = evData.fase;
          const nivel = evData.nivel?.nivel;
          return ` ${fase}: ${score} pts promedio global en dimensión ${nivel ? `[${nivel}]` : ''}`;
        },
        afterBody: (context: any) => {
          const item = dimList ? dimList[context[0].dataIndex] : null;
          if (!item) return '';
          const lines: string[] = [];
          const latestScore = item.latestDomainScore ?? item.latestScore;
          if (latestScore !== undefined) {
            const nivel = item.nivelNombre ? ` [${item.nivelNombre}]` : '';
            lines.push(`\n⭐ Promedio Vigente del Dominio: ${latestScore} pts${nivel}`);
            lines.push(`   (Promedio de la última evaluación de todos los evaluados)`);
          }
          if (item.evalsData && item.evalsData.length > 1) {
            lines.push('\nHistorial del Dominio por Fases:');
            item.evalsData.forEach((ev: any, idx: number) => {
              const s = ev.domainScore;
              const f = ev.fase;
              const n = ev.nivel?.nivel || '—';
              lines.push(`• Fase ${idx + 1} (${f}): ${s} pts prom global [${n}]`);
            });
          }
          return lines;
        },
      },
    },
  },
  scales: {
    x: {
      stacked: true,
      grid: {
        display: false,
      },
      ticks: {
        autoSkip: false,
        font: {
          family: 'Montserrat, sans-serif',
          size: 11,
          weight: 'normal' as const,
        },
        color: '#1e293b',
        padding: 5,
      },
    },
    y: {
      stacked: true,
      beginAtZero: true,
      suggestedMax: maxGlobalDomainScore,
      grid: {
        color: '#f1f5f9',
      },
      ticks: {
        font: {
          family: 'Montserrat, sans-serif',
          size: 11,
        },
        color: '#64748b',
      },
    },
  },
});

export const getUgelDimensionChartOptions = (
  maxScore: number = 20,
  groupList: any[] = [],
  groupLabel: string = 'UGEL'
) => ({
  responsive: true,
  maintainAspectRatio: false,
  indexAxis: 'y' as const,
  layout: {
    padding: {
      left: 5,
      right: 120,
      top: 5,
      bottom: 5,
    },
  },
  plugins: {
    customItemData: groupList || [],
    legend: {
      display: false,
    },
    title: {
      display: false,
    },
    tooltip: {
      callbacks: {
        title: (context: any) => {
          const item = groupList ? groupList[context[0].dataIndex] : null;
          return item ? `#${context[0].dataIndex + 1}. ${item.name}` : '';
        },
        label: (context: any) => {
          const item = groupList ? groupList[context.dataIndex] : null;
          const evalIndex = context.datasetIndex;
          const evData = item?.evalsData?.[evalIndex];
          if (!evData) return '';
          const score = evData.domainScore;
          const fase = evData.fase;
          const nivel = evData.nivel?.nivel;
          return ` ${fase}: ${score} pts promedio en dimensión ${nivel ? `[${nivel}]` : ''}`;
        },
        afterBody: (context: any) => {
          const item = groupList ? groupList[context[0].dataIndex] : null;
          if (!item || !item.evalsData || item.evalsData.length <= 1) return '';
          const lines = [`\nHistorial del Dominio por Fases (${groupLabel}):`];
          item.evalsData.forEach((ev: any, idx: number) => {
            const s = ev.domainScore;
            const f = ev.fase;
            const n = ev.nivel?.nivel || '—';
            lines.push(`• Fase ${idx + 1} (${f}): ${s} pts prom [${n}]`);
          });
          return lines;
        },
      },
    },
  },
  scales: {
    x: {
      stacked: true,
      beginAtZero: true,
      suggestedMax: Math.ceil(maxScore * 1.1),
      grid: {
        color: '#f1f5f9',
      },
      ticks: {
        font: {
          family: 'Montserrat, sans-serif',
          size: 11,
        },
        color: '#64748b',
      },
    },
    y: {
      stacked: true,
      grid: {
        display: false,
      },
      ticks: {
        autoSkip: false,
        callback: function (this: any, val: any, index: number) {
          const label = this.getLabelForValue(index);
          return typeof label === 'string' ? label.toUpperCase() : label;
        },
        font: {
          family: 'Montserrat, sans-serif',
          size: 11,
          weight: 'normal' as const,
        },
        color: '#1e293b',
        padding: 8,
      },
    },
  },
});

export const getUgelDimensionVerticalChartOptions = (
  maxScore: number = 20,
  groupList: any[] = [],
  groupLabel: string = 'UGEL'
) => ({
  responsive: true,
  maintainAspectRatio: false,
  indexAxis: 'x' as const,
  layout: {
    padding: {
      top: 25,
      bottom: 5,
      left: 5,
      right: 15,
    },
  },
  plugins: {
    customItemData: groupList || [],
    legend: {
      display: false,
    },
    title: {
      display: false,
    },
    tooltip: {
      callbacks: {
        title: (context: any) => {
          const item = groupList ? groupList[context[0].dataIndex] : null;
          return item ? `#${context[0].dataIndex + 1}. ${item.name}` : '';
        },
        label: (context: any) => {
          const item = groupList ? groupList[context.dataIndex] : null;
          const evalIndex = context.datasetIndex;
          const evData = item?.evalsData?.[evalIndex];
          if (!evData) return '';
          const score = evData.domainScore;
          const fase = evData.fase;
          const nivel = evData.nivel?.nivel;
          return ` ${fase}: ${score} pts promedio en dimensión ${nivel ? `[${nivel}]` : ''}`;
        },
        afterBody: (context: any) => {
          const item = groupList ? groupList[context[0].dataIndex] : null;
          if (!item || !item.evalsData || item.evalsData.length <= 1) return '';
          const lines = [`\nHistorial del Dominio por Fases (${groupLabel}):`];
          item.evalsData.forEach((ev: any, idx: number) => {
            const s = ev.domainScore;
            const f = ev.fase;
            const n = ev.nivel?.nivel || '—';
            lines.push(`• Fase ${idx + 1} (${f}): ${s} pts prom [${n}]`);
          });
          return lines;
        },
      },
    },
  },
  scales: {
    x: {
      stacked: true,
      grid: {
        display: false,
      },
      ticks: {
        autoSkip: false,
        maxRotation: 45,
        minRotation: 45,
        font: {
          family: 'Montserrat, sans-serif',
          size: 10,
          weight: 'normal' as const,
        },
        color: '#1e293b',
      },
    },
    y: {
      stacked: true,
      beginAtZero: true,
      suggestedMax: Math.ceil(maxScore * 1.1),
      grid: {
        color: '#f1f5f9',
      },
      ticks: {
        font: {
          family: 'Montserrat, sans-serif',
          size: 11,
        },
        color: '#64748b',
      },
    },
  },
});

export const getPersonDimensionChartOptions = (
  maxScore: number = 20,
  personList: any[] = [],
  personNoun: string = 'Docente'
) => ({
  responsive: true,
  maintainAspectRatio: false,
  indexAxis: 'y' as const,
  layout: {
    padding: {
      left: 5,
      right: 110,
      top: 5,
      bottom: 5,
    },
  },
  plugins: {
    customItemData: personList || [],
    legend: {
      display: false,
    },
    title: {
      display: false,
    },
    tooltip: {
      callbacks: {
        title: (context: any) => {
          const item = personList ? personList[context[0].dataIndex] : null;
          return item ? `#${context[0].dataIndex + 1}. ${item.name}` : '';
        },
        label: (context: any) => {
          const item = personList ? personList[context.dataIndex] : null;
          const evalIndex = context.datasetIndex;
          const evData = item?.evalsData?.[evalIndex];
          if (!evData) return '';
          const score = evData.domainScore;
          const fase = evData.fase;
          const dateStr = evData.dateStr;
          const nivel = evData.nivel?.nivel;
          return ` ${context.dataset.label} (${fase} - ${dateStr}): ${score} pts en dimensión ${nivel ? `[${nivel}]` : ''}`;
        },
        afterBody: (context: any) => {
          const item = personList ? personList[context[0].dataIndex] : null;
          if (!item || !item.evalsData || item.evalsData.length <= 1) return '';
          const lines = ['\nHistorial del Dominio por Fases:'];
          item.evalsData.forEach((ev: any, idx: number) => {
            const s = ev.domainScore;
            const f = ev.fase;
            const d = ev.dateStr;
            const n = ev.nivel?.nivel || '—';
            lines.push(`• Eval ${idx + 1} (${f} - ${d}): ${s} pts [${n}]`);
          });
          return lines;
        },
      },
    },
  },
  scales: {
    x: {
      stacked: true,
      beginAtZero: true,
      suggestedMax: Math.ceil(maxScore * 1.1),
      grid: {
        color: '#f1f5f9',
      },
      ticks: {
        font: {
          family: 'Montserrat, sans-serif',
          size: 11,
        },
        color: '#64748b',
      },
    },
    y: {
      stacked: true,
      grid: {
        display: false,
      },
      ticks: {
        autoSkip: false,
        callback: function (this: any, val: any, index: number) {
          const label = this.getLabelForValue(index);
          return typeof label === 'string' ? label.toUpperCase() : label;
        },
        font: {
          family: 'Montserrat, sans-serif',
          size: 12,
          weight: 'normal' as const,
        },
        color: '#1e293b',
        padding: 8,
      },
    },
  },
});

export const getPersonDimensionVerticalChartOptions = (
  maxScore: number = 20,
  personList: any[] = [],
  personNoun: string = 'Docente'
) => ({
  responsive: true,
  maintainAspectRatio: false,
  indexAxis: 'x' as const,
  layout: {
    padding: {
      top: 25,
      bottom: 5,
      left: 5,
      right: 15,
    },
  },
  plugins: {
    customItemData: personList || [],
    legend: {
      display: false,
    },
    title: {
      display: false,
    },
    tooltip: {
      callbacks: {
        title: (context: any) => {
          const item = personList ? personList[context[0].dataIndex] : null;
          return item ? `#${context[0].dataIndex + 1}. ${item.name}` : '';
        },
        label: (context: any) => {
          const item = personList ? personList[context.dataIndex] : null;
          const evalIndex = context.datasetIndex;
          const evData = item?.evalsData?.[evalIndex];
          if (!evData) return '';
          const score = evData.domainScore;
          const fase = evData.fase;
          const dateStr = evData.dateStr;
          const nivel = evData.nivel?.nivel;
          return ` ${context.dataset.label} (${fase} - ${dateStr}): ${score} pts en dimensión ${nivel ? `[${nivel}]` : ''}`;
        },
        afterBody: (context: any) => {
          const item = personList ? personList[context[0].dataIndex] : null;
          if (!item || !item.evalsData || item.evalsData.length <= 1) return '';
          const lines = ['\nHistorial del Dominio por Fases:'];
          item.evalsData.forEach((ev: any, idx: number) => {
            const s = ev.domainScore;
            const f = ev.fase;
            const d = ev.dateStr;
            const n = ev.nivel?.nivel || '—';
            lines.push(`• Eval ${idx + 1} (${f} - ${d}): ${s} pts [${n}]`);
          });
          return lines;
        },
      },
    },
  },
  scales: {
    x: {
      stacked: true,
      grid: {
        display: false,
      },
      ticks: {
        autoSkip: false,
        maxRotation: 45,
        minRotation: 45,
        font: {
          family: 'Montserrat, sans-serif',
          size: 10,
          weight: 'normal' as const,
        },
        color: '#1e293b',
      },
    },
    y: {
      stacked: true,
      beginAtZero: true,
      suggestedMax: Math.ceil(maxScore * 1.1),
      grid: {
        color: '#f1f5f9',
      },
      ticks: {
        font: {
          family: 'Montserrat, sans-serif',
          size: 11,
        },
        color: '#64748b',
      },
    },
  },
});

export const getGlobalUgelChartOptions = (
  maxScore: number = 20,
  groupList: any[] = [],
  groupLabel: string = 'UGEL'
) => ({
  responsive: true,
  maintainAspectRatio: false,
  indexAxis: 'y' as const,
  layout: {
    padding: {
      left: 5,
      right: 120,
      top: 5,
      bottom: 5,
    },
  },
  plugins: {
    customItemData: groupList || [],
    legend: {
      display: false,
    },
    title: {
      display: false,
    },
    tooltip: {
      callbacks: {
        title: (context: any) => {
          const item = groupList ? groupList[context[0].dataIndex] : null;
          return item ? `#${context[0].dataIndex + 1}. ${item.name}` : '';
        },
        label: (context: any) => {
          const item = groupList ? groupList[context.dataIndex] : null;
          const evalIndex = context.datasetIndex;
          const evData = item?.evalsData?.[evalIndex];
          if (!evData) return '';
          const score = evData.score;
          const fase = evData.fase;
          const nivel = evData.nivel?.nivel;
          return ` ${fase}: ${score} pts promedio general ${nivel ? `[${nivel}]` : ''}`;
        },
        afterBody: (context: any) => {
          const item = groupList ? groupList[context[0].dataIndex] : null;
          if (!item) return '';
          const lines: string[] = [];
          if (item.latestScore !== undefined) {
            const nivel = item.nivelNombre ? ` [${item.nivelNombre}]` : '';
            lines.push(`\n⭐ Puntaje Vigente ${groupLabel}: ${item.latestScore} pts${nivel}`);
            lines.push(`   (Promedio de la última evaluación de sus evaluados)`);
          }
          if (item.evalsData && item.evalsData.length > 1) {
            lines.push(`\nHistorial Global por Fases (${groupLabel}):`);
            item.evalsData.forEach((ev: any, idx: number) => {
              const s = ev.score;
              const f = ev.fase;
              const n = ev.nivel?.nivel || '—';
              lines.push(`• Fase ${idx + 1} (${f}): ${s} pts prom [${n}]`);
            });
          }
          return lines;
        },
      },
    },
  },
  scales: {
    x: {
      stacked: true,
      beginAtZero: true,
      suggestedMax: Math.ceil((maxScore || 20) * 1.1),
      grid: {
        color: '#f1f5f9',
      },
      ticks: {
        font: {
          family: 'Montserrat, sans-serif',
          size: 11,
        },
        color: '#64748b',
      },
    },
    y: {
      stacked: true,
      grid: {
        display: false,
      },
      ticks: {
        autoSkip: false,
        callback: function (this: any, val: any, index: number) {
          const label = this.getLabelForValue(index);
          return typeof label === 'string' ? label.toUpperCase() : label;
        },
        font: {
          family: 'Montserrat, sans-serif',
          size: 11,
          weight: 'normal' as const,
        },
        color: '#1e293b',
        padding: 8,
      },
    },
  },
});

export const getGlobalUgelVerticalChartOptions = (
  maxScore: number = 20,
  groupList: any[] = [],
  groupLabel: string = 'UGEL'
) => ({
  responsive: true,
  maintainAspectRatio: false,
  indexAxis: 'x' as const,
  layout: {
    padding: {
      top: 25,
      bottom: 5,
      left: 5,
      right: 15,
    },
  },
  scales: {
    x: {
      stacked: true,
      grid: {
        display: false,
      },
      ticks: {
        autoSkip: false,
        maxRotation: 45,
        minRotation: 45,
        font: {
          family: 'Montserrat, sans-serif',
          size: 10,
          weight: 'normal' as const,
        },
        color: '#1e293b',
      },
    },
    y: {
      stacked: true,
      beginAtZero: true,
      suggestedMax: Math.ceil((maxScore || 20) * 1.1),
      grid: {
        color: '#f1f5f9',
      },
      ticks: {
        font: {
          family: 'Montserrat, sans-serif',
          size: 11,
        },
        color: '#64748b',
      },
    },
  },
  plugins: {
    customItemData: groupList || [],
    legend: {
      display: false,
    },
    title: {
      display: false,
    },
    tooltip: {
      callbacks: {
        title: (context: any) => {
          const item = groupList ? groupList[context[0].dataIndex] : null;
          return item ? `#${context[0].dataIndex + 1}. ${item.name}` : '';
        },
        label: (context: any) => {
          const item = groupList ? groupList[context.dataIndex] : null;
          const evalIndex = context.datasetIndex;
          const evData = item?.evalsData?.[evalIndex];
          if (!evData) return '';
          const score = evData.score;
          const fase = evData.fase;
          const nivel = evData.nivel?.nivel;
          return ` ${fase}: ${score} pts promedio general ${nivel ? `[${nivel}]` : ''}`;
        },
        afterBody: (context: any) => {
          const item = groupList ? groupList[context[0].dataIndex] : null;
          if (!item) return '';
          const lines: string[] = [];
          if (item.latestScore !== undefined) {
            const nivel = item.nivelNombre ? ` [${item.nivelNombre}]` : '';
            lines.push(`\n⭐ Puntaje Vigente ${groupLabel}: ${item.latestScore} pts${nivel}`);
            lines.push(`   (Promedio de la última evaluación de sus evaluados)`);
          }
          if (item.evalsData && item.evalsData.length > 1) {
            lines.push(`\nHistorial Global por Fases (${groupLabel}):`);
            item.evalsData.forEach((ev: any, idx: number) => {
              const s = ev.score;
              const f = ev.fase;
              const n = ev.nivel?.nivel || '—';
              lines.push(`• Fase ${idx + 1} (${f}): ${s} pts prom [${n}]`);
            });
          }
          return lines;
        },
      },
    },
  },
});

export const getGlobalPersonChartOptions = (
  maxScore: number = 20,
  personList: any[] = [],
  personNoun: string = 'Docente'
) => ({
  responsive: true,
  maintainAspectRatio: false,
  indexAxis: 'y' as const,
  layout: {
    padding: {
      left: 5,
      right: 120,
      top: 5,
      bottom: 5,
    },
  },
  plugins: {
    customItemData: personList || [],
    legend: {
      display: false,
    },
    title: {
      display: false,
    },
    tooltip: {
      callbacks: {
        title: (context: any) => {
          const item = personList ? personList[context[0].dataIndex] : null;
          return item ? `#${context[0].dataIndex + 1}. ${item.name}` : '';
        },
        label: (context: any) => {
          const item = personList ? personList[context.dataIndex] : null;
          const evalIndex = context.datasetIndex;
          const evData = item?.evalsData?.[evalIndex];
          if (!evData) return '';
          const score = evData.score;
          const fase = evData.fase;
          const dateStr = evData.dateStr;
          const nivel = evData.nivel?.nivel;
          return ` ${context.dataset.label} (${fase} - ${dateStr}): ${score} pts total ${nivel ? `[${nivel}]` : ''}`;
        },
        afterBody: (context: any) => {
          const item = personList ? personList[context[0].dataIndex] : null;
          if (!item) return '';
          const lines: string[] = [];
          if (item.latestScore !== undefined) {
            const nivel = item.nivelNombre ? ` [${item.nivelNombre}]` : '';
            lines.push(`\n⭐ Puntaje Vigente ${personNoun}: ${item.latestScore} pts${nivel}`);
            lines.push(`   (Puntaje de su evaluación más reciente)`);
          }
          if (item.evalsData && item.evalsData.length > 1) {
            lines.push('\nHistorial Global por Fases:');
            item.evalsData.forEach((ev: any, idx: number) => {
              const s = ev.score;
              const f = ev.fase;
              const d = ev.dateStr;
              const n = ev.nivel?.nivel || '—';
              lines.push(`• Eval ${idx + 1} (${f} - ${d}): ${s} pts [${n}]`);
            });
          }
          return lines;
        },
      },
    },
  },
  scales: {
    x: {
      stacked: true,
      beginAtZero: true,
      suggestedMax: Math.ceil((maxScore || 20) * 1.1),
      grid: {
        color: '#f1f5f9',
      },
      ticks: {
        font: {
          family: 'Montserrat, sans-serif',
          size: 11,
        },
        color: '#64748b',
      },
    },
    y: {
      stacked: true,
      grid: {
        display: false,
      },
      ticks: {
        autoSkip: false,
        callback: function (this: any, val: any, index: number) {
          const label = this.getLabelForValue(index);
          return typeof label === 'string' ? label.toUpperCase() : label;
        },
        font: {
          family: 'Montserrat, sans-serif',
          size: 11,
          weight: 'normal' as const,
        },
        color: '#1e293b',
        padding: 8,
      },
    },
  },
});

export const getGlobalPersonVerticalChartOptions = (
  maxScore: number = 20,
  personList: any[] = [],
  personNoun: string = 'Docente'
) => ({
  responsive: true,
  maintainAspectRatio: false,
  indexAxis: 'x' as const,
  layout: {
    padding: {
      top: 25,
      bottom: 5,
      left: 5,
      right: 15,
    },
  },
  scales: {
    x: {
      stacked: true,
      grid: {
        display: false,
      },
      ticks: {
        autoSkip: false,
        maxRotation: 45,
        minRotation: 45,
        font: {
          family: 'Montserrat, sans-serif',
          size: 10,
          weight: 'normal' as const,
        },
        color: '#1e293b',
      },
    },
    y: {
      stacked: true,
      beginAtZero: true,
      suggestedMax: Math.ceil((maxScore || 20) * 1.1),
      grid: {
        color: '#f1f5f9',
      },
      ticks: {
        font: {
          family: 'Montserrat, sans-serif',
          size: 11,
        },
        color: '#64748b',
      },
    },
  },
  plugins: {
    customItemData: personList || [],
    legend: {
      display: false,
    },
    title: {
      display: false,
    },
    tooltip: {
      callbacks: {
        title: (context: any) => {
          const item = personList ? personList[context[0].dataIndex] : null;
          return item ? `#${context[0].dataIndex + 1}. ${item.name}` : '';
        },
        label: (context: any) => {
          const item = personList ? personList[context.dataIndex] : null;
          const evalIndex = context.datasetIndex;
          const evData = item?.evalsData?.[evalIndex];
          if (!evData) return '';
          const score = evData.score;
          const fase = evData.fase;
          const dateStr = evData.dateStr;
          const nivel = evData.nivel?.nivel;
          return ` ${context.dataset.label} (${fase} - ${dateStr}): ${score} pts total ${nivel ? `[${nivel}]` : ''}`;
        },
        afterBody: (context: any) => {
          const item = personList ? personList[context[0].dataIndex] : null;
          if (!item) return '';
          const lines: string[] = [];
          if (item.latestScore !== undefined) {
            const nivel = item.nivelNombre ? ` [${item.nivelNombre}]` : '';
            lines.push(`\n⭐ Puntaje Vigente ${personNoun}: ${item.latestScore} pts${nivel}`);
            lines.push(`   (Puntaje de su evaluación más reciente)`);
          }
          if (item.evalsData && item.evalsData.length > 1) {
            lines.push('\nHistorial Global por Fases:');
            item.evalsData.forEach((ev: any, idx: number) => {
              const s = ev.score;
              const f = ev.fase;
              const d = ev.dateStr;
              const n = ev.nivel?.nivel || '—';
              lines.push(`• Eval ${idx + 1} (${f} - ${d}): ${s} pts [${n}]`);
            });
          }
          return lines;
        },
      },
    },
  },
});

export const getPieChartOptions = (titleText: string = 'Distribución Global de Resultados') => ({
  responsive: true,
  maintainAspectRatio: true,
  animation: {
    duration: 400,
    easing: 'easeOutQuart' as const,
  },
  layout: {
    padding: {
      top: 10,
      bottom: 10,
      left: 10,
      right: 10,
    },
  },
  plugins: {
    legend: {
      position: 'bottom' as const,
      labels: {
        font: {
          family: 'Montserrat, sans-serif',
          size: 11,
          weight: 'normal' as const,
        },
        padding: 14,
        boxWidth: 32,
        boxHeight: 12,
        borderRadius: 2,
        color: '#475569',
      },
    },
    title: {
      display: true,
      text: titleText,
      font: {
        family: 'Montserrat, sans-serif',
        size: 13,
        weight: 'bold' as const,
      },
      color: '#475569',
      padding: {
        bottom: 12,
      },
    },
    tooltip: {
      callbacks: {
        label: (context: any) => {
          const label = context.label || '';
          const value = context.parsed || 0;
          const dataset = context.dataset;
          const total = dataset?.data?.reduce((acc: number, curr: number) => acc + (Number(curr) || 0), 0) || 0;
          const percentage = total > 0 ? ((value / total) * 100).toFixed(1) : '0';
          return ` ${label}: ${value} (${percentage}%)`;
        },
      },
    },
  },
});
