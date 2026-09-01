import { useGlobalContext } from '@/features/context/GlolbalContext';
import { DataEstadisticas, PRDocentes } from '@/features/types/types';
import { useRouter } from 'next/router';
import React, { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import header from '@/assets/evaluacion-docente.jpg';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  RadialLinearScale,
  Title,
  Tooltip,
  Legend,
  ChartData,
} from 'chart.js';
import { Bar, Pie, Radar, Line } from 'react-chartjs-2';
import {
  RiLoader4Line,
  RiInformationLine,
  RiPulseLine,
  RiRadarLine,
  RiBarChartGroupedLine,
  RiFullscreenLine,
  RiCloseLine,
  RiArrowLeftSLine,
  RiArrowRightSLine,
  RiPaletteLine,
  RiCheckLine,
  RiRefreshLine,
} from 'react-icons/ri';
import PrivateRouteDirectores from '@/components/layouts/PrivateRoutesDirectores';
import UseEvaluacionDocentes from '@/features/hooks/UseEvaluacionDocentes';
import Image from 'next/image';
import styles from './styles.module.css';
import {
  sectionByGrade,
  ordernarAscDsc,
  regiones,
  genero,
} from '@/fuctions/regiones';
import PrivateRouteAdmins from '@/components/layouts/PrivateRoutes';
import UseEvaluacionEspecialistas from '@/features/hooks/UseEvaluacionEspecialistas';

import NoHayResultados from '@/components/no-hay-resultados';
import Loader from '@/components/loader/loader';
import GenericDropdown from '@/components/common/GenericDropdown';
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  RadialLinearScale,
  Title,
  Tooltip,
  Legend
);

const DEFAULT_DOMAIN_PALETTE = [
  '#3b82f6', // Azul
  '#10b981', // Verde Esmeralda
  '#f59e0b', // Ámbar / Naranja
  '#8b5cf6', // Púrpura
  '#00b4d8', // Celeste
  '#ec4899', // Rosa
  '#f97316', // Naranja brillante
  '#6366f1', // Índigo
  '#06b6d4', // Cian
  '#ef4444', // Rojo
  '#84cc16', // Lima
  '#64748b', // Pizarra
];

const PRESET_COLOR_SWATCHES = [
  { label: 'Celeste', hex: '#00b4d8' },
  { label: 'Azul', hex: '#2563eb' },
  { label: 'Índigo', hex: '#6366f1' },
  { label: 'Morado', hex: '#8b5cf6' },
  { label: 'Verde', hex: '#10b981' },
  { label: 'Turquesa', hex: '#14b8a6' },
  { label: 'Lima', hex: '#84cc16' },
  { label: 'Ámbar', hex: '#f59e0b' },
  { label: 'Naranja', hex: '#f97316' },
  { label: 'Rojo', hex: '#ef4444' },
  { label: 'Rosa', hex: '#ec4899' },
  { label: 'Pizarra', hex: '#64748b' },
];

const hexToRgba = (hex: string, alpha: number = 0.75): string => {
  if (!hex || typeof hex !== 'string') return `rgba(59, 130, 246, ${alpha})`;
  let cleanHex = hex.replace('#', '');
  if (cleanHex.length === 3) {
    cleanHex = cleanHex.split('').map((c) => c + c).join('');
  }
  const r = parseInt(cleanHex.substring(0, 2), 16) || 0;
  const g = parseInt(cleanHex.substring(2, 4), 16) || 0;
  const b = parseInt(cleanHex.substring(4, 6), 16) || 0;
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
};

const getDomainColor = (dim: any, index: number): string => {
  if (dim?.color && typeof dim.color === 'string' && dim.color.startsWith('#')) {
    return dim.color;
  }
  return DEFAULT_DOMAIN_PALETTE[index % DEFAULT_DOMAIN_PALETTE.length];
};

const Reportes = () => {
  const route = useRouter();
  const {
    currentUserData,
    dataEstadisticas,
    preguntasRespuestas,
    loaderPages,
    getPreguntaRespuestaDocentes,
    dataEvaluacionDocente,
    allEvaluacionesDirectorDocente,
    dataFiltradaEspecialistaDirectorTabla,
    dimensionesEspecialistas,
  } = useGlobalContext();
  const { reporteEvaluacionDocentes } = UseEvaluacionDocentes();
  const {
    getPreguntasRespuestasEspecialistas,
    getDataEvaluacion,
    reporteEvaluacionEspecialistas,
    evaluacionEspecialista,
    dataEvaluaciones,
    dataConsolidadoGlobal,
    filtrosEvaluacionEspecialistasSeguimientoRetroalimentacion,
    valueLoader,
    warning,
    getDimensionesEspecialistas,
    filtrarReporteEspecialistas,
    allEvaluacionesEspecialistas,
    updateDimensionColor,
  } = UseEvaluacionEspecialistas();

  const [filtros, setFiltros] = useState({
    region: '',
    genero: '',
    idFase: '',
  });
  const [selectedDimensionModal, setSelectedDimensionModal] = useState<any | null>(null);
  const [isColorModalOpen, setIsColorModalOpen] = useState(false);

  const handleColorChange = async (dimId: string | undefined, newColor: string) => {
    if (!route.query.idEvaluacion || !dimId) return;
    try {
      await updateDimensionColor(`${route.query.idEvaluacion}`, dimId, newColor);
    } catch (err) {
      console.error('Error al actualizar color:', err);
    }
  };

  const handleResetColors = async () => {
    if (!route.query.idEvaluacion || !dimensionesEspecialistas) return;
    try {
      await Promise.all(
        dimensionesEspecialistas.map((dim: any) =>
          updateDimensionColor(`${route.query.idEvaluacion}`, dim.id, '')
        )
      );
    } catch (err) {
      console.error('Error al resetear colores:', err);
    }
  };

  const currentDimIndex = (dimensionesEspecialistas || []).findIndex(
    (d: any) => d.id === selectedDimensionModal?.id
  );
  const totalDims = (dimensionesEspecialistas || []).length;
  const hasPrevDim = currentDimIndex > 0;
  const hasNextDim = currentDimIndex >= 0 && currentDimIndex < totalDims - 1;

  const handlePrevDimension = () => {
    if (hasPrevDim && dimensionesEspecialistas) {
      setSelectedDimensionModal(dimensionesEspecialistas[currentDimIndex - 1]);
    }
  };

  const handleNextDimension = () => {
    if (hasNextDim && dimensionesEspecialistas) {
      setSelectedDimensionModal(dimensionesEspecialistas[currentDimIndex + 1]);
    }
  };

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!selectedDimensionModal) return;
      if (e.key === 'Escape') {
        setSelectedDimensionModal(null);
      } else if (e.key === 'ArrowRight' && hasNextDim) {
        handleNextDimension();
      } else if (e.key === 'ArrowLeft' && hasPrevDim) {
        handlePrevDimension();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedDimensionModal, dimensionesEspecialistas, currentDimIndex, hasNextDim, hasPrevDim]);

  const handleChangeFiltros = (e: React.ChangeEvent<HTMLSelectElement | HTMLInputElement>) => {
    setFiltros({
      ...filtros,
      [e.target.name]: e.target.value,
    });
  };

  const handleLimpiarFiltros = () => {
    setFiltros({
      region: '',
      genero: '',
      idFase: '',
    });
  };

  // Obtener fases únicas existentes en las evaluaciones
  const fasesUnicas: { id: string; nombre: string }[] = [];
  allEvaluacionesEspecialistas.forEach((ev: any) => {
    if (ev.idFase && !fasesUnicas.find(f => f.id === ev.idFase)) {
      fasesUnicas.push({
        id: ev.idFase,
        nombre: (ev as any).faseNombre || ev.idFase,
      });
    }
  });

  useEffect(() => {
    if (allEvaluacionesEspecialistas.length > 0) {
      filtrarReporteEspecialistas(allEvaluacionesEspecialistas, filtros);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filtros, allEvaluacionesEspecialistas]);

  const iterateData = (data: DataEstadisticas, labels: string[]) => {
    return {
      labels: labels.length > 0 ? labels : ['nivel 1', 'nivel 2', 'nivel 3', 'nivel 4'],
      datasets: [
        {
          label: 'Estadísticas de evaluación',
          data: [data.a || 0, data.b || 0, data.c || 0, data.d || 0],
          backgroundColor: [
            'rgba(148, 163, 184, 0.6)', // Slate 400
            'rgba(96, 165, 250, 0.6)', // Blue 400
            'rgba(52, 211, 153, 0.6)', // Emerald 400
            'rgba(129, 140, 248, 0.6)', // Indigo 400
          ],
          borderColor: [
            '#64748b', // Slate 500
            '#3b82f6', // Blue 500
            '#10b981', // Emerald 500
            '#6366f1', // Indigo 500
          ],
          borderWidth: 1,
        },
      ],
    };
  };

  const options = {
    plugins: {
      legend: {
        position: 'center' as const,
      },
      title: {
        display: true,
        text: 'estadística de evalulación',
      },
    },
  };

  const pieOptions = {
    plugins: {
      legend: {
        position: 'bottom' as const,
      },
      title: {
        display: true,
        text: 'Distribución Global de Resultados',
      },
    },
  };

  const getPieData = () => {
    if (!dataConsolidadoGlobal || !dataEvaluacionDocente.escala) return { labels: [], datasets: [] };

    // Mapeamos los datos del consolidado global usando el índice de la escala
    const scale = dataEvaluacionDocente.escala;
    const dataValues = scale.map((_, index) => {
      switch (index) {
        case 0: return dataConsolidadoGlobal.a || 0;
        case 1: return dataConsolidadoGlobal.b || 0;
        case 2: return dataConsolidadoGlobal.c || 0;
        case 3: return dataConsolidadoGlobal.d || 0;
        default: return 0;
      }
    });

    const backgroundColors = [
      'rgba(148, 163, 184, 0.8)', // Slate 400
      'rgba(96, 165, 250, 0.8)', // Blue 400
      'rgba(52, 211, 153, 0.8)', // Emerald 400
      'rgba(129, 140, 248, 0.8)', // Indigo 400
    ];

    const borderColors = [
      '#64748b', // Slate 500
      '#3b82f6', // Blue 500
      '#10b981', // Emerald 500
      '#6366f1', // Indigo 500
    ];

    return {
      labels: scale.map(e => e.descripcion || ''),
      datasets: [
        {
          data: dataValues,
          backgroundColor: backgroundColors.slice(0, scale.length),
          borderColor: borderColors.slice(0, scale.length),
          borderWidth: 1,
        },
      ],
    };
  };

  const getDimensionPieData = () => {
    if (!dataEvaluacionDocente.escala || !dimensionesEspecialistas || dimensionesEspecialistas.length === 0) {
      return { labels: [], datasets: [] };
    }

    const scale = dataEvaluacionDocente.escala;
    const labels = dimensionesEspecialistas.map((d: any) => (d.nombre || '').toUpperCase());

    const data = dimensionesEspecialistas.map((dim: any) => {
      const preguntasDim = getPreguntaRespuestaDocentes.filter((p) => p.dimensionId === dim.id);
      if (preguntasDim.length === 0) return 0;

      const idsPreguntas = preguntasDim.map((p) => p.order?.toString() || p.id);
      const statsDim = dataEvaluaciones.filter((stat) => idsPreguntas.includes(stat.id));

      if (statsDim.length === 0) return 0;

      const totalPuntaje = statsDim.reduce((acc, stat) => {
        const valA = (stat.a || 0) * (scale[0]?.value || 0);
        const valB = (stat.b || 0) * (scale[1]?.value || 0);
        const valC = (stat.c || 0) * (scale[2]?.value || 0);
        const valD = (stat.d || 0) * (scale[3]?.value || 0);
        return acc + valA + valB + valC + valD;
      }, 0);

      const totalRespuestas = statsDim.reduce((acc, stat) => acc + (stat.total || 0), 0);
      return totalRespuestas > 0 ? Number((totalPuntaje / totalRespuestas).toFixed(2)) : 0;
    });

    const backgroundColors = dimensionesEspecialistas.map((dim: any, i: number) =>
      hexToRgba(getDomainColor(dim, i), 0.8)
    );
    const borderColors = dimensionesEspecialistas.map((dim: any, i: number) =>
      getDomainColor(dim, i)
    );

    return {
      labels,
      datasets: [
        {
          data,
          backgroundColor: backgroundColors,
          borderColor: borderColors,
          borderWidth: 1,
        },
      ],
    };
  };

  const formatLabel = (str: string, maxLen: number = 24): string[] => {
    if (!str) return [''];
    const words = str.trim().split(/\s+/);
    const lines: string[] = [];
    let currentLine = '';

    for (const word of words) {
      if (!currentLine) {
        currentLine = word;
      } else if ((currentLine + ' ' + word).length <= maxLen) {
        currentLine += ' ' + word;
      } else {
        lines.push(currentLine);
        currentLine = word;
      }
    }
    if (currentLine) {
      lines.push(currentLine);
    }
    return lines;
  };

  const getDimensionData = () => {
    if (!dataEvaluacionDocente.escala) return { labels: [], datasets: [] };

    const labels = dimensionesEspecialistas.map((d: any) => formatLabel((d.nombre || '').toUpperCase(), 24));
    const scale = dataEvaluacionDocente.escala;

    const data = dimensionesEspecialistas.map((dim: any) => {
      const preguntasDim = getPreguntaRespuestaDocentes.filter(p => p.dimensionId === dim.id);
      if (preguntasDim.length === 0) return 0;

      const idsPreguntas = preguntasDim.map(p => p.order?.toString() || p.id);
      const statsDim = dataEvaluaciones.filter(stat => idsPreguntas.includes(stat.id));

      if (statsDim.length === 0) return 0;

      const totalPuntaje = statsDim.reduce((acc, stat) => {
        // Multiplicamos cada conteo (a,b,c,d) por el valor real asignado en la escala
        const valA = (stat.a || 0) * (scale[0]?.value || 0);
        const valB = (stat.b || 0) * (scale[1]?.value || 0);
        const valC = (stat.c || 0) * (scale[2]?.value || 0);
        const valD = (stat.d || 0) * (scale[3]?.value || 0);
        return acc + valA + valB + valC + valD;
      }, 0);

      const totalRespuestas = statsDim.reduce((acc, stat) => acc + (stat.total || 0), 0);
      return totalRespuestas > 0 ? (totalPuntaje / totalRespuestas).toFixed(2) : 0;
    });

    const backgroundColors = dimensionesEspecialistas.map((dim: any, i: number) =>
      hexToRgba(getDomainColor(dim, i), 0.75)
    );
    const borderColors = dimensionesEspecialistas.map((dim: any, i: number) =>
      getDomainColor(dim, i)
    );

    return {
      labels,
      datasets: [
        {
          label: 'Promedio por Dominio',
          data,
          backgroundColor: backgroundColors,
          borderColor: borderColors,
          borderWidth: 1,
          borderRadius: 4,
        },
      ],
    };
  };

  const maxScaleValue = Math.max(
    1,
    ...(dataEvaluacionDocente.escala?.map(e => Number(e.value) || 0) || [3])
  );

  const dimensionBarOptions = {
    responsive: true,
    maintainAspectRatio: false,
    indexAxis: 'y' as const,
    layout: {
      padding: {
        left: 10,
        right: 15,
        top: 5,
        bottom: 5,
      },
    },
    plugins: {
      legend: {
        display: false,
      },
      title: {
        display: true,
        text: 'Rendimiento por Dominio',
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
            return ` Puntaje promedio: ${context.parsed.x}`;
          },
        },
      },
    },
    scales: {
      x: {
        beginAtZero: true,
        suggestedMax: maxScaleValue,
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
        grid: {
          display: false,
        },
        ticks: {
          autoSkip: false,
          font: {
            family: 'Montserrat, sans-serif',
            size: 10,
            weight: 'normal' as const,
          },
          color: '#334155',
          padding: 8,
        },
      },
    },
  };

  const getLevelsData = () => {
    const niveles = dataEvaluacionDocente.niveles || [];
    if (niveles.length === 0 || !dataFiltradaEspecialistaDirectorTabla) return { labels: [], datasets: [] };

    const counts = niveles.map(nivel => {
      return dataFiltradaEspecialistaDirectorTabla.filter(reporte => {
        const score = reporte.calificacion || 0;
        return score >= (nivel.min || 0) && score <= (nivel.max || 0);
      }).length;
    });

    return {
      labels: niveles.map(n => n.nivel || ''),
      datasets: [
        {
          label: 'Especialistas por Nivel',
          data: counts,
          backgroundColor: niveles.map(n => n.color || 'rgba(59, 130, 246, 0.6)'),
          borderColor: niveles.map(n => n.color || '#2563eb'),
          borderWidth: 1,
        },
      ],
    };
  };

  const getRadarData = () => {
    const labels = dimensionesEspecialistas.map((d: any) => d.nombre || '');
    const scale = dataEvaluacionDocente.escala || [];

    const data = dimensionesEspecialistas.map((dim: any) => {
      const preguntasDim = getPreguntaRespuestaDocentes.filter(p => p.dimensionId === dim.id);
      if (preguntasDim.length === 0) return 0;

      const idsPreguntas = preguntasDim.map(p => p.id);
      const statsDim = dataEvaluaciones.filter(stat => idsPreguntas.includes(stat.id));

      if (statsDim.length === 0) return 0;

      const totalPuntaje = statsDim.reduce((acc, stat) => {
        const valA = (stat.a || 0) * (scale[0]?.value || 0);
        const valB = (stat.b || 0) * (scale[1]?.value || 0);
        const valC = (stat.c || 0) * (scale[2]?.value || 0);
        const valD = (stat.d || 0) * (scale[3]?.value || 0);
        return acc + valA + valB + valC + valD;
      }, 0);

      const totalRespuestas = statsDim.reduce((acc, stat) => acc + (stat.total || 0), 0);
      return totalRespuestas > 0 ? (totalPuntaje / totalRespuestas).toFixed(2) : 0;
    });

    return {
      labels,
      datasets: [
        {
          label: 'Perfil de Competencias',
          data,
          backgroundColor: 'rgba(59, 130, 246, 0.2)',
          borderColor: '#3b82f6',
          pointBackgroundColor: '#3b82f6',
          pointBorderColor: '#fff',
          pointHoverBackgroundColor: '#fff',
          pointHoverBorderColor: '#3b82f6',
        },
      ],
    };
  };

  const getTrendData = () => {
    const monthlyData: { [key: string]: { total: number, count: number } } = {};

    allEvaluacionesEspecialistas.forEach(ev => {
      if (!ev.fechaCreacion) return;

      let date;
      if (typeof ev.fechaCreacion === 'string') date = new Date(ev.fechaCreacion);
      else if ((ev.fechaCreacion as any).toDate) date = (ev.fechaCreacion as any).toDate();
      else date = new Date();

      const monthYear = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;

      if (!monthlyData[monthYear]) {
        monthlyData[monthYear] = { total: 0, count: 0 };
      }

      monthlyData[monthYear].total += ev.calificacion || 0;
      monthlyData[monthYear].count += 1;
    });

    const sortedLabels = Object.keys(monthlyData).sort();
    const dataPoints = sortedLabels.map(label => (monthlyData[label].total / monthlyData[label].count).toFixed(2));

    return {
      labels: sortedLabels,
      datasets: [
        {
          label: 'Promedio Mensual',
          data: dataPoints,
          fill: true,
          borderColor: '#10b981',
          backgroundColor: 'rgba(16, 185, 129, 0.1)',
          tension: 0.4,
        },
      ],
    };
  };

  const getItemAnalysisData = () => {
    const sortedItems = [...dataEvaluaciones]
      .filter(item => item.total && item.total > 0)
      .sort((a, b) => {
        const scoreA = ((a.a || 0) * 1 + (a.b || 0) * 2 + (a.c || 0) * 3 + (a.d || 0) * 4) / a.total!;
        const scoreB = ((b.a || 0) * 1 + (b.b || 0) * 2 + (b.c || 0) * 3 + (b.d || 0) * 4) / b.total!;
        return scoreA - scoreB;
      })
      .slice(0, 5);

    return {
      labels: sortedItems.map(item => {
        const question = getPreguntaRespuestaDocentes.find(p => p.id === item.id || p.order?.toString() === item.id);
        return question ? question.criterio?.substring(0, 30) + '...' : item.id;
      }),
      datasets: [
        {
          label: 'Puntaje Promedio (Menores)',
          data: sortedItems.map(item => {
            const score = ((item.a || 0) * 1 + (item.b || 0) * 2 + (item.c || 0) * 3 + (item.d || 0) * 4) / item.total!;
            return score.toFixed(2);
          }),
          backgroundColor: 'rgba(239, 68, 68, 0.6)',
          borderColor: '#ef4444',
          borderWidth: 1,
        },
      ],
    };
  };

  const getUGELPerformanceData = () => {
    const performanceByUGEL: { [key: string]: { total: number, count: number, name: string } } = {};

    allEvaluacionesEspecialistas.forEach(ev => {
      if (!ev.region) return;
      const ugelId = ev.region.toString();
      const ugelName = (regiones.find(r => r.id.toString() === ugelId)?.region || ugelId).toUpperCase();

      if (!performanceByUGEL[ugelId]) {
        performanceByUGEL[ugelId] = { total: 0, count: 0, name: ugelName };
      }

      performanceByUGEL[ugelId].total += ev.calificacion || 0;
      performanceByUGEL[ugelId].count += 1;
    });

    return Object.values(performanceByUGEL).map(item => ({
      name: item.name.toUpperCase(),
      avg: (item.total / item.count).toFixed(2)
    })).sort((a, b) => Number(b.avg) - Number(a.avg));
  };

  const getUGELDataForDimension = (dimensionId: string, color?: string) => {
    const preguntasDim = getPreguntaRespuestaDocentes.filter((p) => p.dimensionId === dimensionId);
    const idsPreguntas = preguntasDim.map((p) => p.id || p.order?.toString());
    const scale = dataEvaluacionDocente.escala || [];

    const dataEspecialistas = dataFiltradaEspecialistaDirectorTabla || [];
    const ugelMap: { [key: string]: { totalPuntaje: number; totalRespuestas: number; name: string } } = {};

    dataEspecialistas.forEach((esp) => {
      const regionVal = (esp as any).region || esp.info?.region;
      if (!regionVal) return;
      const ugelId = regionVal.toString();
      const ugelName = (regiones.find((r) => r.id.toString() === ugelId)?.region || ugelId).toUpperCase();

      if (!ugelMap[ugelId]) {
        ugelMap[ugelId] = { totalPuntaje: 0, totalRespuestas: 0, name: ugelName };
      }

      const respuestas = (esp as any).resultadosSeguimientoRetroalimentacion || (esp as any).resultados || esp.resultados || [];
      respuestas.forEach((resp: PRDocentes) => {
        const respId = resp.id || resp.order?.toString();
        const isMatch =
          (resp.dimensionId && resp.dimensionId === dimensionId) ||
          (respId && idsPreguntas.includes(respId));

        if (isMatch) {
          resp.alternativas?.forEach((alt, altIndex) => {
            if (alt.selected) {
              let val = alt.value;
              if (typeof val !== 'number' && scale[altIndex]) {
                val = scale[altIndex]?.value;
              }
              ugelMap[ugelId].totalPuntaje += Number(val) || 0;
              ugelMap[ugelId].totalRespuestas += 1;
            }
          });
        }
      });
    });

    const ugelList = Object.values(ugelMap)
      .filter((u) => u.totalRespuestas > 0)
      .map((u) => ({
        name: u.name.toUpperCase(),
        avg: Number((u.totalPuntaje / u.totalRespuestas).toFixed(2)),
      }))
      .sort((a, b) => b.avg - a.avg);

    const barColor = color || '#3b82f6';

    return {
      labels: ugelList.map((u) => u.name.toUpperCase()),
      datasets: [
        {
          label: 'Puntaje Promedio',
          data: ugelList.map((u) => u.avg),
          backgroundColor: hexToRgba(barColor, 0.75),
          borderColor: barColor,
          borderWidth: 1,
          borderRadius: 4,
        },
      ],
      ugelList,
    };
  };

  const getUgelDimensionChartOptions = () => ({
    responsive: true,
    maintainAspectRatio: false,
    indexAxis: 'y' as const,
    layout: {
      padding: {
        left: 5,
        right: 15,
        top: 5,
        bottom: 5,
      },
    },
    plugins: {
      legend: {
        display: false,
      },
      title: {
        display: false,
      },
      tooltip: {
        callbacks: {
          label: (context: any) => {
            return ` Puntaje promedio: ${context.parsed.x}`;
          },
        },
      },
    },
    scales: {
      x: {
        beginAtZero: true,
        suggestedMax: maxScaleValue,
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

  const getEspecialistaDataForDimension = (dimensionId: string, color?: string) => {
    const preguntasDim = getPreguntaRespuestaDocentes.filter((p) => p.dimensionId === dimensionId);
    const idsPreguntas = preguntasDim.map((p) => p.id || p.order?.toString());
    const scale = dataEvaluacionDocente.escala || [];

    const dataEspecialistas = dataFiltradaEspecialistaDirectorTabla || [];
    const espList: { name: string; avg: number; dni: string }[] = [];

    dataEspecialistas.forEach((esp: any) => {
      const respuestas = esp.resultadosSeguimientoRetroalimentacion || esp.resultados || [];
      let totalPuntaje = 0;
      let totalRespuestas = 0;

      respuestas.forEach((resp: PRDocentes) => {
        const respId = resp.id || resp.order?.toString();
        const isMatch =
          (resp.dimensionId && resp.dimensionId === dimensionId) ||
          (respId && idsPreguntas.includes(respId));

        if (isMatch) {
          resp.alternativas?.forEach((alt, altIndex) => {
            if (alt.selected) {
              let val = alt.value;
              if (typeof val !== 'number' && scale[altIndex]) {
                val = scale[altIndex]?.value;
              }
              totalPuntaje += Number(val) || 0;
              totalRespuestas += 1;
            }
          });
        }
      });

      if (totalRespuestas > 0) {
        const nombre = (esp.nombres || esp.info?.nombres || '').trim();
        const apellido = (esp.apellidos || esp.info?.apellidos || '').trim();
        const dni = (esp.dni || esp.info?.dni || '').trim();
        const fullName = ((apellido || nombre) ? `${apellido} ${nombre}`.trim() : `DNI: ${dni}`).toUpperCase();

        espList.push({
          name: fullName.toUpperCase(),
          avg: Number((totalPuntaje / totalRespuestas).toFixed(2)),
          dni,
        });
      }
    });

    espList.sort((a, b) => b.avg - a.avg);

    const barColor = color || '#10b981';

    return {
      labels: espList.map((e) => e.name.toUpperCase()),
      datasets: [
        {
          label: 'Puntaje Promedio',
          data: espList.map((e) => e.avg),
          backgroundColor: hexToRgba(barColor, 0.75),
          borderColor: barColor,
          borderWidth: 1,
          borderRadius: 4,
        },
      ],
      espList,
    };
  };

  const getEspecialistaDimensionChartOptions = () => ({
    responsive: true,
    maintainAspectRatio: false,
    indexAxis: 'y' as const,
    layout: {
      padding: {
        left: 5,
        right: 15,
        top: 5,
        bottom: 5,
      },
    },
    plugins: {
      legend: {
        display: false,
      },
      title: {
        display: false,
      },
      tooltip: {
        callbacks: {
          label: (context: any) => {
            return ` Puntaje promedio: ${context.parsed.x}`;
          },
        },
      },
    },
    scales: {
      x: {
        beginAtZero: true,
        suggestedMax: maxScaleValue,
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

  useEffect(() => {
    reporteEvaluacionEspecialistas(`${route.query.idEvaluacion}`);
    getPreguntasRespuestasEspecialistas(`${route.query.idEvaluacion}`);
    getDimensionesEspecialistas(`${route.query.idEvaluacion}`);
    getDataEvaluacion(`${route.query.idEvaluacion}`);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [route.query.idEvaluacion, currentUserData.dni]);

  console.log('warning', warning);
  console.log('dataEvaluacionDocente', dataEvaluacionDocente);
  return (
    <>
      {loaderPages ? (
        <div className={styles.loaderContainer}>
          <RiLoader4Line className={styles.loaderIcon} />
          <p className={styles.loaderText}>buscando resultados...</p>
        </div>
      ) : (
        <div className={styles.container}>
          <div className={styles.tableContainer}>
            <div className={styles.tableSection}>
              <div>
                <div className={styles.filtersContainer}>
                  <div className={styles.filterGroup}>
                    <label className={styles.filterLabel}>UGEL</label>
                    <GenericDropdown
                      options={regiones.map((region) => ({
                        id: region.id.toString(),
                        name: region.region,
                      }))}
                      value={filtros.region}
                      onChange={(val) => setFiltros({ ...filtros, region: val })}
                      placeholder="Todas las UGELs"
                      allOptionsLabel="Todas las UGELs"
                      className="min-w-[220px]"
                    />
                  </div>

                  <div className={styles.filterGroup}>
                    <label className={styles.filterLabel}>Género</label>
                    <GenericDropdown
                      options={genero.map((gen) => ({
                        id: gen.id.toString(),
                        name: gen.name,
                      }))}
                      value={filtros.genero}
                      onChange={(val) => setFiltros({ ...filtros, genero: val })}
                      placeholder="Todos los géneros"
                      allOptionsLabel="Todos los géneros"
                      className="min-w-[200px]"
                    />
                  </div>

                  <div className={styles.filterGroup}>
                    <label className={styles.filterLabel}>Fase de Evaluación</label>
                    <GenericDropdown
                      options={fasesUnicas.map((fase) => ({
                        id: fase.id,
                        name: fase.nombre,
                      }))}
                      value={filtros.idFase}
                      onChange={(val) => setFiltros({ ...filtros, idFase: val })}
                      placeholder="Todas las fases"
                      allOptionsLabel="Todas las fases"
                      className="min-w-[220px]"
                    />
                  </div>

                  {dimensionesEspecialistas && dimensionesEspecialistas.length > 0 && (
                    <button
                      type="button"
                      onClick={() => setIsColorModalOpen(true)}
                      className={styles.btnColorConfig}
                      title="Personalizar colores para cada dominio"
                    >
                      <RiPaletteLine style={{ fontSize: '1.2rem', color: '#6366f1' }} />
                      <span>Colores de Dominios</span>
                    </button>
                  )}

                  {(filtros.region !== '' || filtros.genero !== '' || filtros.idFase !== '') && (
                    <button
                      onClick={handleLimpiarFiltros}
                      className={styles.clearFilterBtn}
                    >
                      Limpiar filtros
                    </button>
                  )}
                </div>
                {valueLoader === false ? (
                  warning ? (
                    <NoHayResultados />
                  ) : (
                    <>
                      <div className={styles.globalChartsGrid}>
                        <div className={styles.chartContainer}>
                          <h3 className={styles.sectionTitle}>
                            <span className={styles.sectionTitleIndicator}></span>
                            <span>Consolidado Global de Resultados</span>
                          </h3>
                          <div className={styles.pieChartWrapper}>
                            <Pie options={pieOptions} data={getPieData()} />
                          </div>
                          <div className={styles.statsGrid}>
                            <div className={styles.statItem}>
                              <span className={styles.statLabel}>Total Evaluados</span>
                              <span className={styles.statValue}>{dataFiltradaEspecialistaDirectorTabla?.length || 0}</span>
                            </div>
                            {dataEvaluacionDocente.escala?.map((item, index) => {
                              const values = [dataConsolidadoGlobal?.a, dataConsolidadoGlobal?.b, dataConsolidadoGlobal?.c, dataConsolidadoGlobal?.d];
                              return (
                                <div key={index} className={styles.statItem}>
                                  <span className={styles.statLabel}>{item.descripcion}</span>
                                  <span className={styles.statValue}>{values[index] || 0}</span>
                                </div>
                              );
                            })}
                          </div>
                        </div>

                        {dataEvaluacionDocente.niveles && dataEvaluacionDocente.niveles.length > 0 && (
                          <div className={styles.chartContainer}>
                            <h3 className={styles.sectionTitle}>
                              <span className={styles.sectionTitleIndicator}></span>
                              <span>Distribución por Niveles de Logro</span>
                            </h3>
                            <div className={styles.pieChartWrapper}>
                              <Pie
                                options={{
                                  ...pieOptions,
                                  plugins: { ...pieOptions.plugins, title: { ...pieOptions.plugins.title, text: 'Especialistas por Nivel de Logro' } }
                                }}
                                data={getLevelsData()}
                              />
                            </div>
                            <div className={styles.statsGrid}>
                              {dataEvaluacionDocente.niveles.map((nivel, index) => {
                                const count = dataFiltradaEspecialistaDirectorTabla.filter(reporte => {
                                  const score = reporte.calificacion || 0;
                                  return score >= (nivel.min || 0) && score <= (nivel.max || 0);
                                }).length;
                                return (
                                  <div key={index} className={styles.statItem}>
                                    <span className={styles.statLabel} style={{ color: nivel.color }}>{nivel.nivel}</span>
                                    <span className={styles.statValue}>{count}</span>
                                  </div>
                                );
                              })}
                            </div>
                          </div>
                        )}

                        {dimensionesEspecialistas && dimensionesEspecialistas.length > 0 && (
                          <div className={styles.chartContainer}>
                            <h3 className={styles.sectionTitle}>
                              <span className={styles.sectionTitleIndicator} style={{ background: '#8b5cf6' }}></span>
                              <span>Distribución Proporcional por Dominio</span>
                            </h3>
                            <div className={styles.pieChartWrapper} style={{ maxWidth: '380px', width: '100%' }}>
                              <Pie
                                options={{
                                  responsive: true,
                                  maintainAspectRatio: true,
                                  plugins: {
                                    title: {
                                      display: true,
                                      text: 'Promedio Comparativo por Dominio',
                                      font: {
                                        family: 'Montserrat, sans-serif',
                                        size: 13,
                                        weight: 'bold' as const,
                                      },
                                      padding: {
                                        bottom: 12,
                                      },
                                    },
                                    legend: {
                                      display: false,
                                    },
                                    tooltip: {
                                      callbacks: {
                                        label: (context: any) => {
                                          return ` Puntaje Promedio: ${context.parsed}`;
                                        },
                                      },
                                    },
                                  },
                                }}
                                data={getDimensionPieData()}
                              />
                            </div>
                            <div className={styles.statsGrid}>
                              {dimensionesEspecialistas.map((dim: any, index: number) => {
                                const pieData = getDimensionPieData();
                                const value = pieData.datasets[0]?.data[index] || 0;
                                const color = getDomainColor(dim, index);
                                return (
                                  <div key={dim.id || index} className={styles.statItem}>
                                    <span
                                      className={styles.statLabel}
                                      style={{
                                        color,
                                        fontWeight: 600,
                                        textAlign: 'center',
                                        textTransform: 'uppercase',
                                        lineHeight: 1.3,
                                        wordBreak: 'break-word',
                                        whiteSpace: 'normal',
                                      }}
                                    >
                                      {dim.nombre}
                                    </span>
                                    <span className={styles.statValue}>{value}</span>
                                  </div>
                                );
                              })}
                            </div>
                          </div>
                        )}

                        <div className={styles.chartContainer}>
                          <h3 className={styles.sectionTitle}>
                            <span className={styles.sectionTitleIndicator}></span>
                            <span>Puntaje Promedio por Dominio</span>
                          </h3>
                          <div
                            className={styles.chartWrapper}
                            style={{
                              minHeight: `${Math.max(280, (dimensionesEspecialistas?.length || 1) * 85)}px`,
                              width: '100%',
                              maxWidth: '100%',
                              position: 'relative',
                            }}
                          >
                            <Bar
                              options={dimensionBarOptions}
                              data={getDimensionData()}
                            />
                          </div>
                        </div>
                      </div>

                      {dimensionesEspecialistas && dimensionesEspecialistas.length > 0 && (
                        <div className={styles.dimensionSectionWrapper}>
                          <div className={styles.sectionHeader}>
                            <h2 className={styles.analyticsTitle}>Rendimiento por UGEL según Dominio</h2>
                            <p className={styles.analyticsSubtitle}>
                              Comparativa y ranking del puntaje promedio por UGEL en cada una de las dimensiones evaluadas
                            </p>
                          </div>

                          <div className={styles.dimensionChartsGrid}>
                            {dimensionesEspecialistas.map((dim: any, idx: number) => {
                              const domainColor = getDomainColor(dim, idx);
                              const ugelChartData = getUGELDataForDimension(dim.id, domainColor);
                              const hasData = ugelChartData.labels.length > 0;

                              return (
                                <div key={dim.id || idx} className={styles.dimensionChartCard}>
                                  <div
                                    className={styles.dimensionChartHeader}
                                    style={{
                                      display: 'flex',
                                      justifyContent: 'space-between',
                                      alignItems: 'flex-start',
                                      flexWrap: 'wrap',
                                      gap: '0.5rem',
                                    }}
                                  >
                                    <div>
                                      <h3 className={styles.dimensionChartMainTitle}>
                                        <span
                                          className={styles.sectionTitleIndicator}
                                          style={{
                                            display: 'inline-block',
                                            verticalAlign: 'middle',
                                            marginRight: '8px',
                                            background: domainColor,
                                          }}
                                        ></span>
                                        Dimensión por UGEL
                                      </h3>
                                      <p className={styles.dimensionChartSubtitle}>
                                        {dim.nombre || `DIMENSIÓN ${idx + 1}`}
                                      </p>
                                    </div>

                                    <div className={styles.colorPickerHeaderWrapper}>
                                      <label
                                        className={styles.colorPickerCircle}
                                        style={{ background: domainColor }}
                                        title={`Cambiar color para ${dim.nombre}`}
                                      >
                                        <input
                                          type="color"
                                          value={domainColor}
                                          onChange={(e) => handleColorChange(dim.id, e.target.value)}
                                          className={styles.hiddenColorInput}
                                        />
                                      </label>
                                    </div>
                                  </div>

                                  {hasData ? (
                                    <div
                                      className={styles.chartWrapper}
                                      style={{
                                        minHeight: `${Math.max(220, ugelChartData.labels.length * 36)}px`,
                                        width: '100%',
                                        maxWidth: '100%',
                                        position: 'relative',
                                      }}
                                    >
                                      <Bar
                                        options={getUgelDimensionChartOptions()}
                                        data={{
                                          labels: ugelChartData.labels,
                                          datasets: ugelChartData.datasets,
                                        }}
                                      />
                                    </div>
                                  ) : (
                                    <div className={styles.emptyDimensionChart}>
                                      <p>No se encontraron registros evaluados para esta dimensión.</p>
                                    </div>
                                  )}
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      )}

                      {dimensionesEspecialistas && dimensionesEspecialistas.length > 0 && (
                        <div className={styles.dimensionSectionWrapper}>
                          <div className={styles.sectionHeader}>
                            <h2 className={styles.analyticsTitle}>Rendimiento por Especialista según Dominio</h2>
                            <p className={styles.analyticsSubtitle}>
                              Comparativa y ranking del puntaje promedio obtenido por cada especialista en las dimensiones evaluadas
                            </p>
                          </div>

                          <div className={styles.dimensionChartsGrid}>
                            {dimensionesEspecialistas.map((dim: any, idx: number) => {
                              const domainColor = getDomainColor(dim, idx);
                              const espChartData = getEspecialistaDataForDimension(dim.id, domainColor);
                              const hasData = espChartData.labels.length > 0;
                              const isLongList = espChartData.labels.length > 10;
                              const top10Labels = espChartData.labels.slice(0, 10);
                              const top10Data = espChartData.datasets[0]?.data.slice(0, 10) || [];

                              return (
                                <div key={dim.id || idx} className={styles.dimensionChartCard}>
                                  <div
                                    className={styles.dimensionChartHeader}
                                    style={{
                                      display: 'flex',
                                      justifyContent: 'space-between',
                                      alignItems: 'flex-start',
                                      flexWrap: 'wrap',
                                      gap: '0.5rem',
                                    }}
                                  >
                                    <div>
                                      <h3 className={styles.dimensionChartMainTitle}>
                                        <span
                                          className={styles.sectionTitleIndicator}
                                          style={{
                                            display: 'inline-block',
                                            verticalAlign: 'middle',
                                            marginRight: '8px',
                                            background: domainColor,
                                          }}
                                        ></span>
                                        Dimensión por Especialista
                                      </h3>
                                      <p className={styles.dimensionChartSubtitle}>
                                        {dim.nombre || `DIMENSIÓN ${idx + 1}`}
                                      </p>
                                    </div>

                                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                                      <div className={styles.colorPickerHeaderWrapper}>
                                        <label
                                          className={styles.colorPickerCircle}
                                          style={{ background: domainColor }}
                                          title={`Cambiar color para ${dim.nombre}`}
                                        >
                                          <input
                                            type="color"
                                            value={domainColor}
                                            onChange={(e) => handleColorChange(dim.id, e.target.value)}
                                            className={styles.hiddenColorInput}
                                          />
                                        </label>
                                      </div>

                                      {hasData && (
                                        <button
                                          onClick={() => setSelectedDimensionModal(dim)}
                                          className={styles.btnVistaCompleta}
                                          title="Abrir vista completa con todos los especialistas"
                                        >
                                          <RiFullscreenLine />
                                          <span>Vista completa ({espChartData.labels.length})</span>
                                        </button>
                                      )}
                                    </div>
                                  </div>

                                  {hasData ? (
                                    <>
                                      <div
                                        className={styles.chartWrapper}
                                        style={{
                                          minHeight: `${Math.max(220, top10Labels.length * 36)}px`,
                                          width: '100%',
                                          maxWidth: '100%',
                                          position: 'relative',
                                        }}
                                      >
                                        <Bar
                                          options={getEspecialistaDimensionChartOptions()}
                                          data={{
                                            labels: top10Labels,
                                            datasets: [
                                              {
                                                ...espChartData.datasets[0],
                                                data: top10Data,
                                              },
                                            ],
                                          }}
                                        />
                                      </div>

                                      {isLongList && (
                                        <div style={{ marginTop: '0.85rem' }}>
                                          <button
                                            onClick={() => setSelectedDimensionModal(dim)}
                                            className={styles.btnVistaCompleta}
                                            style={{
                                              width: '100%',
                                              justifyContent: 'center',
                                              padding: '0.65rem 1rem',
                                            }}
                                          >
                                            <RiFullscreenLine />
                                            <span>
                                              Ver todos ({espChartData.labels.length} especialistas) en Vista Completa
                                            </span>
                                          </button>
                                        </div>
                                      )}
                                    </>
                                  ) : (
                                    <div className={styles.emptyDimensionChart}>
                                      <p>No se encontraron especialistas evaluados para esta dimensión.</p>
                                    </div>
                                  )}
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      )}

                      <div className={styles.advancedAnalyticsSection}>
                        <div className={styles.analyticsHeader}>
                          <h2 className={styles.analyticsTitle}>Panel de Analítica Avanzada</h2>
                          <p className={styles.analyticsSubtitle}>Interpretación estratégica y tendencias de desempeño</p>
                        </div>

                        <div className={styles.globalChartsGrid}>
                          {false && (
                            <div className={styles.chartContainer}>
                              <h3 className={styles.sectionTitle}>
                                <RiRadarLine style={{ color: '#3b82f6' }} />
                                <span>Perfil Reticular de Competencias</span>
                              </h3>
                              <div className={styles.infoBox}>
                                <div className={styles.infoTitle}>
                                  <RiInformationLine /> ¿Qué mide este gráfico?
                                </div>
                                <p className={styles.infoContent}>
                                  Muestra el equilibrio entre los diferentes <span className={styles.infoHighlight}>Dominios o Dimensiones</span>.
                                  Un polígono regular indica un desempeño equilibrado, mientras que picos hacia afuera señalan fortalezas y hacia adentro áreas críticas.
                                </p>
                              </div>
                              <div className={styles.radarChartWrapper}>
                                <Radar
                                  data={getRadarData()}
                                  options={{
                                    scales: {
                                      r: {
                                        beginAtZero: true,
                                        max: (dataEvaluacionDocente.escala || []).at(-1)?.value || 4
                                      }
                                    }
                                  }}
                                />
                              </div>
                            </div>
                          )}

                          {false && (
                            <div className={styles.chartContainer}>
                              <h3 className={styles.sectionTitle}>
                                <RiPulseLine style={{ color: '#10b981' }} />
                                <span>Tendencia de Mejora Temporal</span>
                              </h3>
                              <div className={styles.infoBox}>
                                <div className={styles.infoTitle}>
                                  <RiInformationLine /> ¿Cómo interpretarlo?
                                </div>
                                <p className={styles.infoContent}>
                                  Rastrea el <span className={styles.infoHighlight}>crecimiento del promedio de calificación</span> a lo largo de los meses.
                                  Una línea ascendente valida que el acompañamiento y monitoreo está teniendo un impacto positivo real.
                                </p>
                              </div>
                              <div className={styles.chartWrapper}>
                                <Line
                                  data={getTrendData()}
                                  options={{
                                    scales: {
                                      y: { beginAtZero: true }
                                    }
                                  }}
                                />
                              </div>
                            </div>
                          )}

                          {false && (
                            <div className={`${styles.chartContainer} ${styles.fullWidthChart}`}>
                              <h3 className={styles.sectionTitle}>
                                <RiBarChartGroupedLine style={{ color: '#ef4444' }} />
                                <span>Análisis de Brechas Críticas (Top 5 Criterios con Menor Puntaje)</span>
                              </h3>
                              <div className={styles.infoBox}>
                                <div className={styles.infoTitle}>
                                  <RiInformationLine /> Uso Estratégico
                                </div>
                                <p className={styles.infoContent}>
                                  Identifica los <span className={styles.infoHighlight}>5 criterios específicos</span> donde el equipo de especialistas tiene mayor dificultad.
                                  Estos puntos deben ser la prioridad inmediata para las próximas capacitaciones o sesiones de retroalimentación colectiva.
                                </p>
                              </div>
                              <div style={{ height: '300px' }}>
                                <Bar
                                  data={getItemAnalysisData()}
                                  options={{
                                    indexAxis: 'y' as const,
                                    maintainAspectRatio: false,
                                    plugins: { legend: { display: false } }
                                  }}
                                />
                              </div>
                            </div>
                          )}

                          {false && (
                            <div className={`${styles.chartContainer} ${styles.fullWidthChart}`}>
                              <h3 className={styles.sectionTitle}>
                                <RiBarChartGroupedLine style={{ color: '#f59e0b' }} />
                                <span>Mapa de Rendimiento por UGEL</span>
                              </h3>
                              <div className={styles.infoBox}>
                                <div className={styles.infoTitle}>
                                  <RiInformationLine /> Análisis Territorial
                                </div>
                                <p className={styles.infoContent}>
                                  Compara el <span className={styles.infoHighlight}>desempeño promedio de los especialistas</span> agrupados por su respectiva UGEL.
                                  Permite identificar qué regiones territoriales están liderando y cuáles requieren un fortalecimiento focalizado.
                                </p>
                              </div>
                              <div className={styles.heatmapGrid}>
                                {getUGELPerformanceData().map((ugel, idx) => {
                                  const avgValue = Number(ugel.avg);
                                  const maxScale = dataEvaluacionDocente.escala?.[dataEvaluacionDocente.escala.length - 1]?.value || 4;
                                  const ratio = avgValue / maxScale;

                                  // Dynamic color from Red to Green
                                  const red = Math.round(239 * (1 - ratio) + 16 * ratio);
                                  const green = Math.round(68 * (1 - ratio) + 185 * ratio);
                                  const blue = Math.round(68 * (1 - ratio) + 129 * ratio);

                                  return (
                                    <div key={idx} className={styles.heatmapCell} style={{ borderBottom: `4px solid rgb(${red}, ${green}, ${blue})` }}>
                                      <span className={styles.heatmapValue}>{ugel.avg}</span>
                                      <span className={styles.heatmapLabel}>{ugel.name}</span>
                                    </div>
                                  );
                                })}
                              </div>
                            </div>
                          )}
                        </div>
                      </div>

                      <div className={styles.perQuestionGrid}>
                        {getPreguntaRespuestaDocentes.map((pregunta, index) => {
                          const stats = dataEvaluaciones.find(s => s.id === pregunta.id || s.id === pregunta.order?.toString());
                          if (!stats) return null;

                          return (
                            <div key={index} className={styles.chartContainer}>
                              <h3 className={styles.sectionTitle}>
                                <span className={styles.sectionTitleIndicator}></span>
                                <span>
                                  {pregunta.subOrden || pregunta.order}.
                                </span>
                                <span>{pregunta.criterio}</span>
                              </h3>
                              <div className={styles.chartWrapper}>
                                <Bar
                                  options={{
                                    ...options,
                                    plugins: {
                                      ...options.plugins,
                                      title: {
                                        display: true,
                                        text: `Resultados: ${pregunta.criterio?.substring(0, 50)}...`,
                                      }
                                    }
                                  }}
                                  data={iterateData(
                                    stats,
                                    dataEvaluacionDocente.escala?.map(e => e.descripcion || '') || []
                                  )}
                                />
                              </div>
                              <div className={styles.statsGrid}>
                                {dataEvaluacionDocente.escala?.map((item, scaleIndex) => {
                                  const values = [stats.a, stats.b, stats.c, stats.d];
                                  return (
                                    <div key={scaleIndex} className={styles.statItem}>
                                      <span className={styles.statLabel}>{item.descripcion}</span>
                                      <span className={styles.statValue}>{values[scaleIndex] || 0}</span>
                                    </div>
                                  );
                                })}
                              </div>
                              <div className={styles.totalBadge}>
                                Total: {stats.total} respuestas
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </>
                  )
                ) : (
                  <Loader size="large" text="buscando resultados..." variant="spinner" />
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {selectedDimensionModal && typeof window !== 'undefined'
        ? (() => {
            const currentModalColor = getDomainColor(selectedDimensionModal, currentDimIndex);
            const fullEspData = getEspecialistaDataForDimension(selectedDimensionModal.id, currentModalColor);

            return createPortal(
              <div className={styles.fullScreenViewContainer}>
                <header className={styles.fullScreenHeader}>
                  <div className={styles.fullScreenTitleGroup}>
                    <h1 className={styles.fullScreenTitle}>
                      <span
                        className={styles.sectionTitleIndicator}
                        style={{ background: currentModalColor, width: '4px', height: '24px' }}
                      ></span>
                      Dimensión por Especialista — Vista Completa
                    </h1>
                    <p className={styles.fullScreenSubtitle}>
                      {selectedDimensionModal.nombre || 'Dimensión'}
                    </p>
                  </div>
                  <div className={styles.fullScreenActions}>
                    {totalDims > 1 && (
                      <div className={styles.navDimensionGroup}>
                        <button
                          onClick={handlePrevDimension}
                          disabled={!hasPrevDim}
                          className={styles.navDimensionBtn}
                          title={hasPrevDim ? `Dominio anterior: ${dimensionesEspecialistas[currentDimIndex - 1]?.nombre}` : 'Primer dominio'}
                        >
                          <RiArrowLeftSLine style={{ fontSize: '1.2rem' }} />
                          <span>Anterior</span>
                        </button>
                        <span className={styles.navDimensionIndicator}>
                          Dominio <strong>{currentDimIndex + 1}</strong> de <strong>{totalDims}</strong>
                        </span>
                        <button
                          onClick={handleNextDimension}
                          disabled={!hasNextDim}
                          className={styles.navDimensionBtn}
                          title={hasNextDim ? `Siguiente dominio: ${dimensionesEspecialistas[currentDimIndex + 1]?.nombre}` : 'Último dominio'}
                        >
                          <span>Siguiente</span>
                          <RiArrowRightSLine style={{ fontSize: '1.2rem' }} />
                        </button>
                      </div>
                    )}

                    <span
                      className={styles.fullScreenBadge}
                      style={{
                        borderColor: hexToRgba(currentModalColor, 0.4),
                        color: currentModalColor,
                        background: hexToRgba(currentModalColor, 0.08),
                      }}
                    >
                      {fullEspData.labels.length} Especialistas evaluados
                    </span>
                    <button
                      onClick={() => setSelectedDimensionModal(null)}
                      className={styles.fullScreenExitBtn}
                      title="Cerrar vista de pantalla completa (Esc)"
                    >
                      <RiCloseLine style={{ fontSize: '1.25rem' }} />
                      <span>Cerrar</span>
                    </button>
                  </div>
                </header>

                <main className={styles.fullScreenBody}>
                  <div className={styles.fullScreenChartCard}>
                    {fullEspData.labels.length > 0 ? (
                      <div
                        style={{
                          minHeight: `${Math.max(500, fullEspData.labels.length * 36)}px`,
                          width: '100%',
                          position: 'relative',
                        }}
                      >
                        <Bar
                          options={getEspecialistaDimensionChartOptions()}
                          data={{
                            labels: fullEspData.labels,
                            datasets: fullEspData.datasets,
                          }}
                        />
                      </div>
                    ) : (
                      <div className={styles.emptyDimensionChart}>
                        <p>No se encontraron especialistas evaluados para esta dimensión.</p>
                      </div>
                    )}
                  </div>
                </main>

                <footer className={styles.fullScreenFooter}>
                  <span style={{ fontSize: '0.85rem', color: '#64748b', fontFamily: 'Montserrat, sans-serif' }}>
                    Navegue con las flechas <strong>← / →</strong> del teclado o use los botones de navegación
                  </span>

                  {totalDims > 1 && (
                    <div className={styles.footerNavGroup}>
                      <button
                        onClick={handlePrevDimension}
                        disabled={!hasPrevDim}
                        className={styles.footerNavBtn}
                        title={hasPrevDim ? `Ir a: ${dimensionesEspecialistas[currentDimIndex - 1]?.nombre}` : ''}
                      >
                        <RiArrowLeftSLine style={{ fontSize: '1.2rem' }} />
                        <span>Dominio Anterior</span>
                      </button>
                      <button
                        onClick={handleNextDimension}
                        disabled={!hasNextDim}
                        className={`${styles.footerNavBtn} ${styles.footerNavBtnNext}`}
                        title={hasNextDim ? `Ir a: ${dimensionesEspecialistas[currentDimIndex + 1]?.nombre}` : ''}
                      >
                        <span>Siguiente Dominio</span>
                        <RiArrowRightSLine style={{ fontSize: '1.2rem' }} />
                      </button>
                    </div>
                  )}

                  <button
                    onClick={() => setSelectedDimensionModal(null)}
                    className={styles.clearFilterBtn}
                    style={{ height: '38px', padding: '0.4rem 1.25rem' }}
                  >
                    Volver al Reporte
                  </button>
                </footer>
              </div>,
              document.getElementById('portal-modal') || document.body
            );
          })()
        : null}

      {isColorModalOpen && typeof window !== 'undefined'
        ? createPortal(
            <div className={styles.colorModalOverlay} onClick={() => setIsColorModalOpen(false)}>
              <div className={styles.colorModalContent} onClick={(e) => e.stopPropagation()}>
                <div className={styles.colorModalHeader}>
                  <h2 className={styles.colorModalTitle}>
                    <RiPaletteLine style={{ color: '#6366f1', fontSize: '1.35rem' }} />
                    <span>Personalizar Colores por Dominio</span>
                  </h2>
                  <button
                    onClick={() => setIsColorModalOpen(false)}
                    className={styles.colorModalCloseBtn}
                    title="Cerrar"
                  >
                    <RiCloseLine />
                  </button>
                </div>

                <div className={styles.colorModalBody}>
                  <p className={styles.colorModalSubtitle}>
                    Selecciona el color temático para cada dominio de la evaluación. Los cambios se reflejarán en tiempo real en todos los gráficos, barras y vistas.
                  </p>

                  {dimensionesEspecialistas &&
                    dimensionesEspecialistas.map((dim: any, idx: number) => {
                      const currentColor = getDomainColor(dim, idx);
                      return (
                        <div key={dim.id || idx} className={styles.domainColorCard}>
                          <div className={styles.domainColorCardHeader}>
                            <span className={styles.domainColorName}>
                              {dim.nombre || `Dominio ${idx + 1}`}
                            </span>
                            <span
                              style={{
                                fontSize: '0.75rem',
                                fontFamily: 'monospace',
                                fontWeight: 700,
                                color: currentColor,
                                background: hexToRgba(currentColor, 0.12),
                                padding: '0.2rem 0.5rem',
                                borderRadius: '6px',
                              }}
                            >
                              {currentColor.toUpperCase()}
                            </span>
                          </div>

                          <div className={styles.domainColorControls}>
                            {PRESET_COLOR_SWATCHES.map((swatch) => {
                              const isSelected = currentColor.toLowerCase() === swatch.hex.toLowerCase();
                              return (
                                <button
                                  key={swatch.hex}
                                  type="button"
                                  onClick={() => handleColorChange(dim.id, swatch.hex)}
                                  className={`${styles.presetSwatch} ${isSelected ? styles.presetSwatchActive : ''}`}
                                  style={{ background: swatch.hex }}
                                  title={`${swatch.label} (${swatch.hex})`}
                                />
                              );
                            })}

                            <label className={styles.customColorBtn} title="Elegir cualquier color personalizado">
                              <span
                                style={{
                                  width: 14,
                                  height: 14,
                                  borderRadius: '50%',
                                  background: currentColor,
                                  display: 'inline-block',
                                }}
                              />
                              <span>Personalizado</span>
                              <input
                                type="color"
                                value={currentColor}
                                onChange={(e) => handleColorChange(dim.id, e.target.value)}
                                className={styles.hiddenColorInput}
                              />
                            </label>
                          </div>
                        </div>
                      );
                    })}
                </div>

                <div className={styles.colorModalFooter}>
                  <button
                    type="button"
                    onClick={handleResetColors}
                    className={styles.resetColorsBtn}
                    title="Restablecer todos los dominios a los colores predeterminados"
                  >
                    <RiRefreshLine style={{ display: 'inline', marginRight: 4 }} />
                    Restablecer predeterminados
                  </button>
                  <button
                    type="button"
                    onClick={() => setIsColorModalOpen(false)}
                    className={styles.doneColorsBtn}
                  >
                    Listo
                  </button>
                </div>
              </div>
            </div>,
            document.getElementById('portal-modal') || document.body
          )
        : null}
    </>
  );
};

export default Reportes;
Reportes.Auth = PrivateRouteAdmins;
