import { useGlobalContext } from '@/features/context/GlolbalContext';
import { DataEstadisticas, PRDocentes } from '@/features/types/types';
import { useRouter } from 'next/router';
import React, { useEffect, useState, useRef } from 'react';
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
  RiBarChartHorizontalLine,
  RiBarChart2Line,
  RiFullscreenLine,
  RiCloseLine,
  RiArrowLeftSLine,
  RiArrowRightSLine,
  RiPaletteLine,
  RiCheckLine,
  RiRefreshLine,
  RiAwardLine,
  RiGroupLine,
  RiGovernmentLine,
  RiLayoutGridLine,
  RiSlideshowLine,
  RiGridFill,
  RiEqualizerLine,
  RiArrowDownSLine,
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
import { getCleanPhaseName, getMonitoreoTimestamp, getLocalDateString } from '@/features/evaluados-especialistas/components/utils';
import {
  ModoOrganizarEspecialistasModal,
  DEFAULT_SECTIONS_ORDER,
} from '@/features/evaluados-especialistas/components/ModoOrganizarEspecialistasModal';
import ConfigurarNivelesEspecialistas from '@/modals/ConfigurarNivelesEspecialistas';
import ConfigurarNivelesPorDominio from '@/modals/ConfigurarNivelesPorDominio';
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

const drawCanvasPillBadge = (
  ctx: any,
  x: number,
  y: number,
  scoreText: string,
  isHorizontal: boolean,
  iconColor: string = '#2563eb'
) => {
  ctx.save();
  ctx.font = 'bold 10.5px Montserrat, sans-serif';
  const scoreWidth = ctx.measureText(scoreText).width;

  const iconWidth = 10;
  const iconHeight = 9.5;
  const gap = 4.5;
  const paddingX = 7;
  const badgeHeight = 18;
  const badgeWidth = iconWidth + gap + scoreWidth + paddingX * 2;
  const radius = 9;

  let rectX = x;
  let rectY = y - badgeHeight / 2;

  if (!isHorizontal) {
    rectX = x - badgeWidth / 2;
    rectY = y - badgeHeight - 4;
  }

  // Fondo redondeado del badge
  ctx.beginPath();
  if (typeof ctx.roundRect === 'function') {
    ctx.roundRect(rectX, rectY, badgeWidth, badgeHeight, radius);
  } else {
    ctx.moveTo(rectX + radius, rectY);
    ctx.lineTo(rectX + badgeWidth - radius, rectY);
    ctx.quadraticCurveTo(rectX + badgeWidth, rectY, rectX + badgeWidth, rectY + radius);
    ctx.lineTo(rectX + badgeWidth, rectY + badgeHeight - radius);
    ctx.quadraticCurveTo(rectX + badgeWidth, rectY + badgeHeight, rectX + badgeWidth - radius, rectY + badgeHeight);
    ctx.lineTo(rectX + radius, rectY + badgeHeight);
    ctx.quadraticCurveTo(rectX, rectY + badgeHeight, rectX, rectY + badgeHeight - radius);
    ctx.lineTo(rectX, rectY + radius);
    ctx.quadraticCurveTo(rectX, rectY, rectX + radius, rectY);
    ctx.closePath();
  }
  ctx.fillStyle = '#f8fafc';
  ctx.fill();
  ctx.lineWidth = 1.2;
  ctx.strokeStyle = '#cbd5e1';
  ctx.stroke();

  // 1. Dibujar mini ícono vectorial de barras (3 barras estilizadas: ▂▅▇)
  const iconX = rectX + paddingX;
  const iconBaseY = rectY + (badgeHeight + iconHeight) / 2;

  ctx.fillStyle = iconColor;
  // Barra 1 (4.5px)
  ctx.fillRect(iconX, iconBaseY - 4.5, 2.2, 4.5);
  // Barra 2 (7px)
  ctx.fillRect(iconX + 3.6, iconBaseY - 7, 2.2, 7);
  // Barra 3 (9.5px)
  ctx.fillRect(iconX + 7.2, iconBaseY - 9.5, 2.2, 9.5);

  // 2. Dibujar texto del puntaje
  const textX = iconX + iconWidth + gap;
  const textY = rectY + badgeHeight / 2 + 0.5;
  ctx.textBaseline = 'middle';
  ctx.textAlign = 'left';
  ctx.font = 'bold 10.5px Montserrat, sans-serif';
  ctx.fillStyle = '#0f172a';
  ctx.fillText(scoreText, textX, textY);

  ctx.restore();
};

const barDataLabelPlugin = {
  id: 'barDataLabelPlugin',
  afterDatasetsDraw(chart: any) {
    const { ctx } = chart;
    const datasets = chart.data.datasets;
    if (!datasets || datasets.length === 0) return;
    const customData = chart.config.options?.plugins?.customItemData;
    if (!customData || customData.length === 0) return;

    const isHorizontal = chart.options.indexAxis === 'y';
    const isStacked = chart.options.scales?.x?.stacked || chart.options.scales?.y?.stacked;

    ctx.save();
    ctx.textBaseline = 'middle';

    if (isStacked && datasets.length > 1) {
      // --- MODO MULTI-FASE APILADO (ESPECIALISTAS CON MÁS DE 1 FASE) ---
      datasets.forEach((dataset: any, datasetIndex: number) => {
        const meta = chart.getDatasetMeta(datasetIndex);
        if (meta.hidden) return;

        meta.data.forEach((element: any, index: number) => {
          const rawVal = dataset.rawDomainScores ? dataset.rawDomainScores[index] : (dataset.rawScores ? dataset.rawScores[index] : dataset.data[index]);
          const rawPhaseName = dataset.phaseNames ? dataset.phaseNames[index] : (dataset.label || '');
          const phaseName = (rawPhaseName || '').toUpperCase();

          if (rawVal !== undefined && rawVal !== null && rawVal > 0) {
            const rect = element.getProps(['x', 'y', 'base', 'width', 'height'], true);
            const segmentWidth = Math.abs(rect.x - rect.base);
            const segmentHeight = Math.abs(rect.y - rect.base);

            if (isHorizontal) {
              const availWidth = segmentWidth - 4;
              if (availWidth >= 12) {
                const centerX = (rect.x + rect.base) / 2;
                const centerY = element.y;

                const formattedScore = Number.isInteger(rawVal) ? `${rawVal}` : `${Number(rawVal).toFixed(1)}`;
                const fullPtsText = `${formattedScore} pts`;
                const numOnlyText = `${formattedScore}`;

                ctx.save();
                ctx.fillStyle = '#ffffff';
                ctx.strokeStyle = 'rgba(0, 0, 0, 0.75)';
                ctx.lineWidth = 2.5;
                ctx.textAlign = 'center';

                ctx.font = 'bold 9px Montserrat, sans-serif';
                const phaseWidth = phaseName ? ctx.measureText(phaseName).width : 0;
                const ptsWidth = ctx.measureText(fullPtsText).width;
                const numWidth = ctx.measureText(numOnlyText).width;

                // 1. Si el segmento es suficientemente ancho (>= 60px) y caben ambas líneas:
                if (phaseName && phaseWidth <= availWidth && ptsWidth <= availWidth && segmentWidth >= 60) {
                  const fontOffset = 5.5;
                  ctx.strokeText(phaseName, centerX, centerY - fontOffset);
                  ctx.fillText(phaseName, centerX, centerY - fontOffset);

                  ctx.strokeText(fullPtsText, centerX, centerY + fontOffset);
                  ctx.fillText(fullPtsText, centerX, centerY + fontOffset);
                }
                // 2. Si el segmento tiene ancho medio (>= 36px) y cabe el texto de puntos completo:
                else if (ptsWidth <= availWidth && segmentWidth >= 36) {
                  ctx.strokeText(fullPtsText, centerX, centerY);
                  ctx.fillText(fullPtsText, centerX, centerY);
                }

                ctx.restore();
              }
            } else {
              // Gráfico vertical
              const availHeight = segmentHeight - 4;
              if (availHeight >= 12) {
                const centerX = element.x;
                const centerY = (rect.y + rect.base) / 2;

                const formattedScore = Number.isInteger(rawVal) ? `${rawVal}` : `${Number(rawVal).toFixed(1)}`;
                const fullPtsText = `${formattedScore} pts`;
                const numOnlyText = `${formattedScore}`;

                ctx.save();
                ctx.fillStyle = '#ffffff';
                ctx.strokeStyle = 'rgba(0, 0, 0, 0.8)';
                ctx.lineWidth = 2.5;
                ctx.textAlign = 'center';

                ctx.font = 'bold 8.5px Montserrat, sans-serif';
                const ptsWidth = ctx.measureText(fullPtsText).width;
                const numWidth = ctx.measureText(numOnlyText).width;
                const barWidth = rect.width || 30;

                // 1. Si la altura del segmento permite 2 líneas (>= 24px) y hay nombre de fase:
                if (phaseName && segmentHeight >= 24) {
                  const fontOffset = 5.5;
                  ctx.strokeText(phaseName, centerX, centerY - fontOffset);
                  ctx.fillText(phaseName, centerX, centerY - fontOffset);

                  const scoreText = (ptsWidth <= barWidth - 2) ? fullPtsText : numOnlyText;
                  ctx.strokeText(scoreText, centerX, centerY + fontOffset);
                  ctx.fillText(scoreText, centerX, centerY + fontOffset);
                }
                // 2. Si la altura permite 1 sola línea (>= 16px):
                else if (segmentHeight >= 16) {
                  const scoreText = (ptsWidth <= barWidth - 2) ? fullPtsText : numOnlyText;
                  ctx.strokeText(scoreText, centerX, centerY);
                  ctx.fillText(scoreText, centerX, centerY);
                }
                // 3. Segmento muy angosto:
                else if (numWidth <= barWidth + 2) {
                  ctx.font = 'bold 8px Montserrat, sans-serif';
                  ctx.strokeText(numOnlyText, centerX, centerY);
                  ctx.fillText(numOnlyText, centerX, centerY);
                }

                ctx.restore();
              }
            }
          }
        });
      });

      // En vista horizontal: dibujar al final exterior de la barra total el puntaje con cápsula destacada
      if (isHorizontal) {
        const lastMeta = chart.getDatasetMeta(datasets.length - 1);
        if (lastMeta && !lastMeta.hidden) {
          lastMeta.data.forEach((element: any, index: number) => {
            const item = customData[index];
            if (!item) return;
            const latestDomainScore = item.latestScore ?? item.latestDomainScore ?? item.avg ?? 0;
            const scoreText = `${Number.isInteger(latestDomainScore) ? latestDomainScore : Number(latestDomainScore).toFixed(1)} pts`;
            const iconColor = item.nivelColor || item.color || '#2563eb';

            drawCanvasPillBadge(ctx, element.x + 8, element.y, scoreText, true, iconColor);
          });
        }
      } else {
        // En vista vertical: dibujar en el tope exterior de la barra total el puntaje con cápsula destacada
        const lastMeta = chart.getDatasetMeta(datasets.length - 1);
        if (lastMeta && !lastMeta.hidden) {
          lastMeta.data.forEach((element: any, index: number) => {
            const item = customData[index];
            if (!item) return;
            const latestDomainScore = item.latestScore ?? item.latestDomainScore ?? item.avg ?? 0;
            const scoreText = `${Number.isInteger(latestDomainScore) ? latestDomainScore : Number(latestDomainScore).toFixed(1)} pts`;
            const iconColor = item.nivelColor || item.color || '#2563eb';

            drawCanvasPillBadge(ctx, element.x, element.y, scoreText, false, iconColor);
          });
        }
      }
    } else {
      // --- MODO SIMPLE O AGRUPADO (!isStacked) ---
      datasets.forEach((dataset: any, dsIndex: number) => {
        const meta = chart.getDatasetMeta(dsIndex);
        if (!meta || meta.hidden) return;

        meta.data.forEach((bar: any, index: number) => {
          const value = dataset.data[index];
          if (value === undefined || value === null || value <= 0) return;

          const item = customData[index];
          const evData = item?.evalsData?.[dsIndex];
          const nivelNombre = (evData?.nivel?.nivel || item?.nivelNombre || '').toUpperCase();
          const rawPhaseName = dataset.phaseNames?.[index] || dataset.label || '';
          const phaseName = (rawPhaseName || '').toUpperCase();

          const domainVal = Number(value);
          const formattedScore = Number.isInteger(domainVal) ? `${domainVal}` : domainVal.toFixed(1);
          const domainScoreText = `${formattedScore} pts`;
          const insideLabelText = phaseName ? `${phaseName}: ${domainScoreText}` : domainScoreText;

          if (isHorizontal) {
            const barWidth = Math.abs(bar.x - bar.base);
            ctx.font = '700 10.5px Montserrat, sans-serif';
            const insideTextWidth = ctx.measureText(insideLabelText).width;

            // Si la barra es lo suficientemente ancha para el texto de fase y puntos:
            if (barWidth > insideTextWidth + 20) {
              ctx.textAlign = 'right';
              ctx.fillStyle = '#ffffff';
              ctx.shadowColor = 'rgba(0, 0, 0, 0.45)';
              ctx.shadowBlur = 3;
              ctx.shadowOffsetX = 0;
              ctx.shadowOffsetY = 1;
              ctx.fillText(insideLabelText, bar.x - 8, bar.y);
            } else {
              ctx.shadowColor = 'transparent';
              ctx.textAlign = 'left';
              ctx.font = '600 10.5px Montserrat, sans-serif';
              ctx.fillStyle = '#475569';
              ctx.fillText(domainScoreText, bar.x + 6, bar.y);
            }
          } else {
            // En vista vertical simple / agrupada:
            const barHeight = Math.abs(bar.y - bar.base);
            const centerY = (bar.y + bar.base) / 2;

            if (barHeight >= 12) {
              ctx.save();
              ctx.fillStyle = '#ffffff';
              ctx.strokeStyle = 'rgba(0, 0, 0, 0.8)';
              ctx.lineWidth = 2.5;
              ctx.font = 'bold 8.5px Montserrat, sans-serif';
              ctx.textAlign = 'center';

              if (phaseName && barHeight >= 24) {
                const fontOffset = 5.5;
                ctx.strokeText(phaseName, bar.x, centerY - fontOffset);
                ctx.fillText(phaseName, bar.x, centerY - fontOffset);

                ctx.strokeText(domainScoreText, bar.x, centerY + fontOffset);
                ctx.fillText(domainScoreText, bar.x, centerY + fontOffset);
              } else if (barHeight >= 16) {
                ctx.strokeText(domainScoreText, bar.x, centerY);
                ctx.fillText(domainScoreText, bar.x, centerY);
              }
              ctx.restore();
            }
          }
        });
      });
    }

    ctx.restore();
  },
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
  const [selectedDimensionModal, setSelectedDimensionModal] = useState<{
    dim: any;
    type: 'especialista' | 'ugel' | 'global_especialista' | 'global_ugel' | 'global_dominio';
  } | null>(null);
  const [isColorModalOpen, setIsColorModalOpen] = useState(false);
  const [colorMode, setColorMode] = useState<'dominio' | 'nivel'>('nivel');
  const [modalOrientation, setModalOrientation] = useState<'horizontal' | 'vertical'>('horizontal');
  const [ugelViewMode, setUgelViewMode] = useState<'grid' | 'compact'>('compact');
  const [currentUgelDimIndex, setCurrentUgelDimIndex] = useState<number>(0);
  const [espViewMode, setEspViewMode] = useState<'grid' | 'compact'>('compact');
  const [currentEspDimIndex, setCurrentEspDimIndex] = useState<number>(0);
  const [globalUgelColor, setGlobalUgelColor] = useState<string>('#3b82f6');
  const [globalEspColor, setGlobalEspColor] = useState<string>('#6366f1');
  const [cardOrientations, setCardOrientations] = useState<Record<string, 'horizontal' | 'vertical'>>({});
  const getCardOrientation = (key: string) => cardOrientations[key] || 'horizontal';
  const setCardOrientation = (key: string, val: 'horizontal' | 'vertical') =>
    setCardOrientations((prev) => ({ ...prev, [key]: val }));

  const [isOrganizerModalOpen, setIsOrganizerModalOpen] = useState(false);
  const [isGlobalLevelsModalOpen, setIsGlobalLevelsModalOpen] = useState(false);
  const [isDomainLevelsModalOpen, setIsDomainLevelsModalOpen] = useState(false);
  const [isSettingsDropdownOpen, setIsSettingsDropdownOpen] = useState(false);
  const settingsDropdownRef = useRef<HTMLDivElement>(null);

  // Click outside para cerrar el dropdown de ajustes
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (settingsDropdownRef.current && !settingsDropdownRef.current.contains(event.target as Node)) {
        setIsSettingsDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const [ordenSecciones, setOrdenSecciones] = useState<string[]>(DEFAULT_SECTIONS_ORDER);
  const [seccionesVisibles, setSeccionesVisibles] = useState<string[]>(DEFAULT_SECTIONS_ORDER);

  // Cargar configuración guardada de localStorage
  useEffect(() => {
    if (typeof window !== 'undefined' && evaluacionEspecialista?.id) {
      try {
        const savedOrder = localStorage.getItem(`eva_esp_report_order_${evaluacionEspecialista.id}`);
        const savedVisible = localStorage.getItem(`eva_esp_report_visible_${evaluacionEspecialista.id}`);

        if (savedOrder) {
          const parsedOrder = JSON.parse(savedOrder);
          if (Array.isArray(parsedOrder) && parsedOrder.length > 0) {
            const missing = DEFAULT_SECTIONS_ORDER.filter((s) => !parsedOrder.includes(s));
            setOrdenSecciones([...parsedOrder.filter((s) => DEFAULT_SECTIONS_ORDER.includes(s)), ...missing]);
          }
        }

        if (savedVisible) {
          const parsedVisible = JSON.parse(savedVisible);
          if (Array.isArray(parsedVisible)) {
            setSeccionesVisibles(parsedVisible);
          }
        }
      } catch (err) {
        console.error('Error cargando configuración de orden de secciones', err);
      }
    }
  }, [evaluacionEspecialista?.id]);

  const handleOrderChange = (newOrder: string[]) => {
    setOrdenSecciones(newOrder);
    if (typeof window !== 'undefined' && evaluacionEspecialista?.id) {
      try {
        localStorage.setItem(`eva_esp_report_order_${evaluacionEspecialista.id}`, JSON.stringify(newOrder));
      } catch (err) {
        console.error('Error guardando orden de secciones', err);
      }
    }
  };

  const handleVisibilityChange = (newVisible: string[]) => {
    setSeccionesVisibles(newVisible);
    if (typeof window !== 'undefined' && evaluacionEspecialista?.id) {
      try {
        localStorage.setItem(`eva_esp_report_visible_${evaluacionEspecialista.id}`, JSON.stringify(newVisible));
      } catch (err) {
        console.error('Error guardando visibilidad de secciones', err);
      }
    }
  };

  const getNivelLogro = (calificacion: number, nivelesEspecificos?: any[]) => {
    const rawNiveles = (nivelesEspecificos && nivelesEspecificos.length > 0)
      ? nivelesEspecificos
      : (dataEvaluacionDocente?.niveles || (dataEvaluacionDocente as any)?.nivelYPuntaje || []);
    if (!rawNiveles || rawNiveles.length === 0) return null;

    // Asegurar orden ascendente por valor mínimo
    const niveles = [...rawNiveles].sort((a: any, b: any) => (Number(a.min) || 0) - (Number(b.min) || 0));

    // 1. Coincidencia directa dentro del rango
    const exact = niveles.find((n: any) => calificacion >= (Number(n.min) || 0) && calificacion <= (Number(n.max) || 0));
    if (exact) return exact;

    // 2. Si es menor que el mínimo del primer nivel
    if (calificacion <= (Number(niveles[0]?.max) || 0)) {
      return niveles[0];
    }

    // 3. Evaluación continua por umbrales para saltos/huecos decimales (ej. 1.05 entre 1.0 y 1.1)
    for (let i = 0; i < niveles.length; i++) {
      const current = niveles[i];
      const next = niveles[i + 1];
      const curMax = Number(current.max) || 0;
      const nextMin = next ? (Number(next.min) || 0) : Infinity;

      // Si cae en el hueco entre current.max y next.min (ej. 1.05 entre 1.0 y 1.1)
      if (calificacion > curMax && calificacion < nextMin) {
        return next || current;
      }

      // Si está por debajo o igual al límite superior de este nivel
      if (calificacion <= curMax) {
        return current;
      }
    }

    // Si supera el puntaje máximo configurado, retorna el nivel superior
    return niveles[niveles.length - 1];
  };

  const getNivelLogroDominio = (puntajeDominio: number, maxDomainScore: number, dimObj?: any) => {
    if (dimObj?.niveles && dimObj.niveles.length > 0) {
      return getNivelLogro(puntajeDominio, dimObj.niveles);
    }

    const niveles = dataEvaluacionDocente?.niveles || (dataEvaluacionDocente as any)?.nivelYPuntaje || [];
    if (niveles.length === 0) return null;

    const maxScaleNivel = Math.max(1, ...(niveles.map((n: any) => Number(n.max) || 0) || [20]));
    const puntajeEquivalente = maxDomainScore > 0 ? (puntajeDominio / maxDomainScore) * maxScaleNivel : puntajeDominio;

    return getNivelLogro(puntajeEquivalente, niveles);
  };

  const renderDomainLevelRanges = (dim?: any) => {
    let niveles = dim?.niveles && dim.niveles.length > 0 ? dim.niveles : null;

    if (!niveles) {
      const globalNiveles = dataEvaluacionDocente?.niveles || (dataEvaluacionDocente as any)?.nivelYPuntaje || [];
      if (globalNiveles.length === 0) return null;

      if (dim?.id) {
        const preguntasDim = getPreguntaRespuestaDocentes.filter((p) => p.dimensionId === dim.id);
        const countQuestions = preguntasDim.length || 1;
        const maxScaleVal = Math.max(1, ...(dataEvaluacionDocente.escala?.map((e) => Number(e.value) || 0) || [3]));
        const maxDomainScore = countQuestions * maxScaleVal;
        const maxGlobalScale = Math.max(1, ...(globalNiveles.map((n: any) => Number(n.max) || 0) || [maxDomainScore]));

        niveles = globalNiveles.map((n: any) => {
          const scaledMin = Number(((Number(n.min || 0) / maxGlobalScale) * maxDomainScore).toFixed(0));
          const scaledMax = Number(((Number(n.max || 0) / maxGlobalScale) * maxDomainScore).toFixed(0));
          return {
            ...n,
            min: scaledMin,
            max: scaledMax,
          };
        });
      } else {
        niveles = globalNiveles;
      }
    }

    if (!niveles || niveles.length === 0) return null;

    return (
      <div className={styles.domainCardLevelsFooter}>
        <div className={styles.domainLevelsFooterHeader}>
          <span className={styles.domainLevelsFooterTitle}>
            <RiAwardLine style={{ color: '#2563eb', fontSize: '0.95rem' }} />
            {dim?.nombre ? `Puntajes de Nivel de Logro (${dim.nombre}):` : 'Puntajes por Nivel de Logro:'}
          </span>
        </div>
        <div className={styles.domainLevelsList}>
          {niveles.map((n: any, idx: number) => (
            <div key={idx} className={styles.domainLevelChip}>
              <span className={styles.levelLegendDot} style={{ background: n.color || '#3b82f6' }} />
              <span className={styles.domainLevelChipRange}>
                {n.min ?? 0} - {n.max ?? 0}
              </span>
              <span className={styles.domainLevelChipName}>{n.nivel}</span>
            </div>
          ))}
        </div>
      </div>
    );
  };

  const renderGlobalDomainLevelRanges = () => {
    const globalNiveles = dataEvaluacionDocente?.niveles || (dataEvaluacionDocente as any)?.nivelYPuntaje || [];
    if (!dimensionesEspecialistas || dimensionesEspecialistas.length === 0 || globalNiveles.length === 0) {
      return null;
    }

    const scale = dataEvaluacionDocente.escala || [];
    const maxScaleVal = Math.max(1, ...(scale.map((e) => Number(e.value) || 0) || [3]));
    const maxGlobalScale = Math.max(1, ...(globalNiveles.map((n: any) => Number(n.max) || 0) || [20]));

    // Calcular los rangos y datos para cada dimensión
    const dimData = getDimensionData();
    const domainRangesList = dimensionesEspecialistas.map((dim: any, idx: number) => {
      let niveles = dim?.niveles && dim.niveles.length > 0 ? dim.niveles : null;
      const preguntasDim = getPreguntaRespuestaDocentes.filter((p) => p.dimensionId === dim.id);
      const countQuestions = preguntasDim.length || 1;
      const maxDomainScore = countQuestions * maxScaleVal;

      if (!niveles) {
        niveles = globalNiveles.map((n: any) => {
          const scaledMin = Number(((Number(n.min || 0) / maxGlobalScale) * maxDomainScore).toFixed(0));
          const scaledMax = Number(((Number(n.max || 0) / maxGlobalScale) * maxDomainScore).toFixed(0));
          return {
            ...n,
            min: scaledMin,
            max: scaledMax,
          };
        });
      }

      const domainItemData = dimData.dimList?.[idx];
      const avgScore = domainItemData?.latestDomainScore ?? 0;
      const nivelAlcanzado = (dim.niveles && dim.niveles.length > 0)
        ? getNivelLogro(avgScore, dim.niveles)
        : getNivelLogroDominio(avgScore, maxDomainScore, dim);

      return {
        dim,
        dimIndex: idx,
        nombre: dim.nombre || `Dominio ${idx + 1}`,
        maxDomainScore,
        niveles,
        avgScore,
        nivelAlcanzado,
      };
    });

    return (
      <div className={styles.domainCardLevelsFooter} style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
        <div className={styles.domainLevelsFooterHeader}>
          <span className={styles.domainLevelsFooterTitle}>
            <RiAwardLine style={{ color: '#2563eb', fontSize: '1rem' }} />
            Escalas de Nivel de Logro por cada Dominio:
          </span>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.65rem', width: '100%' }}>
          {domainRangesList.map((dItem, dIdx) => {
            const dColor = getDomainColor(dItem.dim, dItem.dimIndex);
            return (
              <div
                key={dItem.dim.id || dIdx}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  flexWrap: 'wrap',
                  gap: '0.5rem 1rem',
                  padding: '0.55rem 0.85rem',
                  background: '#f8fafc',
                  borderRadius: '10px',
                  border: `1.5px solid ${hexToRgba(dColor, 0.25)}`,
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                  <span
                    style={{
                      width: '10px',
                      height: '10px',
                      borderRadius: '50%',
                      background: dColor,
                      display: 'inline-block',
                      flexShrink: 0,
                    }}
                  />
                  <span
                    style={{
                      fontSize: '0.8rem',
                      fontWeight: 700,
                      color: '#0f172a',
                      textTransform: 'uppercase',
                      fontFamily: 'Montserrat, sans-serif',
                    }}
                  >
                    {dItem.nombre}
                  </span>
                  <span
                    style={{
                      fontSize: '0.72rem',
                      color: '#475569',
                      fontWeight: 600,
                      background: '#e2e8f0',
                      padding: '1px 6px',
                      borderRadius: '4px',
                    }}
                  >
                    Máx. {dItem.maxDomainScore} pts
                  </span>
                </div>

                <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: '0.45rem' }}>
                  {dItem.niveles.map((n: any, nIdx: number) => {
                    const isCurrent = dItem.nivelAlcanzado?.nivel === n.nivel;
                    return (
                      <div
                        key={nIdx}
                        className={styles.domainLevelChip}
                        style={{
                          padding: '0.2rem 0.6rem',
                          background: isCurrent ? hexToRgba(n.color || '#3b82f6', 0.14) : 'white',
                          border: isCurrent
                            ? `1.5px solid ${n.color || '#3b82f6'}`
                            : '1px solid #cbd5e1',
                        }}
                      >
                        <span className={styles.levelLegendDot} style={{ background: n.color || '#3b82f6' }} />
                        <span
                          className={styles.domainLevelChipRange}
                          style={{
                            fontSize: '0.75rem',
                            fontWeight: isCurrent ? 700 : 500,
                            color: isCurrent ? '#0f172a' : '#475569',
                          }}
                        >
                          {n.min ?? 0} - {n.max ?? 0}
                        </span>
                        <span
                          className={styles.domainLevelChipName}
                          style={{
                            fontSize: '0.75rem',
                            fontWeight: isCurrent ? 800 : 600,
                            color: isCurrent ? (n.color || '#1e293b') : '#64748b',
                          }}
                        >
                          {n.nivel}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  };

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
    (d: any) => d.id === selectedDimensionModal?.dim?.id
  );
  const totalDims = (dimensionesEspecialistas || []).length;
  const hasPrevDim = currentDimIndex > 0;
  const hasNextDim = currentDimIndex >= 0 && currentDimIndex < totalDims - 1;

  const handlePrevDimension = () => {
    if (hasPrevDim && dimensionesEspecialistas && selectedDimensionModal) {
      setSelectedDimensionModal({
        dim: dimensionesEspecialistas[currentDimIndex - 1],
        type: selectedDimensionModal.type,
      });
    }
  };

  const handleNextDimension = () => {
    if (hasNextDim && dimensionesEspecialistas && selectedDimensionModal) {
      setSelectedDimensionModal({
        dim: dimensionesEspecialistas[currentDimIndex + 1],
        type: selectedDimensionModal.type,
      });
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

  const getPuntajeSumPorDominioParaEspecialista = (
    esp: any,
    dimensionId: string,
    preguntasDim: any[],
    scale: any[]
  ): number | null => {
    const respuestas = (esp as any).resultadosSeguimientoRetroalimentacion || (esp as any).resultados || esp.resultados || [];
    if (!respuestas || respuestas.length === 0) return null;

    let sumaPuntos = 0;
    let respuestasEncontradas = 0;

    preguntasDim.forEach((pregunta) => {
      const pId = pregunta.id || pregunta.order?.toString();
      const resp = respuestas.find((r: any) => {
        const rId = r.id || r.order?.toString();
        if (r.dimensionId && r.dimensionId === dimensionId && rId === pId) return true;
        if (rId && pId && rId.toString() === pId.toString()) return true;
        if (r.dimensionId && r.dimensionId === dimensionId && r.criterio && pregunta.criterio && r.criterio.trim() === pregunta.criterio.trim()) return true;
        return false;
      });

      if (resp && resp.alternativas) {
        resp.alternativas.forEach((alt: any, altIndex: number) => {
          if (alt.selected) {
            let val = alt.value;
            if (typeof val !== 'number' && scale[altIndex]) {
              val = scale[altIndex]?.value;
            }
            sumaPuntos += Number(val) || 0;
            respuestasEncontradas += 1;
          }
        });
      }
    });

    return respuestasEncontradas > 0 ? sumaPuntos : null;
  };

  const getEspecialistaTotalScore = (esp: any, scale: any[]): number | null => {
    if (typeof esp.calificacion === 'number') {
      return esp.calificacion;
    }
    const respuestas = (esp as any).resultadosSeguimientoRetroalimentacion || (esp as any).resultados || esp.resultados || [];
    if (!respuestas || respuestas.length === 0) return null;
    let sumaPuntos = 0;
    let respuestasEncontradas = 0;
    respuestas.forEach((resp: any) => {
      if (resp && resp.alternativas) {
        resp.alternativas.forEach((alt: any, altIndex: number) => {
          if (alt.selected) {
            let val = alt.value;
            if (typeof val !== 'number' && scale[altIndex]) {
              val = scale[altIndex]?.value;
            }
            sumaPuntos += Number(val) || 0;
            respuestasEncontradas += 1;
          }
        });
      }
    });
    return respuestasEncontradas > 0 ? sumaPuntos : null;
  };

  const getDimensionPieData = () => {
    if (!dataEvaluacionDocente.escala || !dimensionesEspecialistas || dimensionesEspecialistas.length === 0) {
      return { labels: [], datasets: [] };
    }

    const scale = dataEvaluacionDocente.escala;
    const labels = dimensionesEspecialistas.map((d: any) => (d.nombre || '').toUpperCase());
    const dataEspecialistas = dataFiltradaEspecialistaDirectorTabla || [];

    // Agrupar especialistas únicos por DNI para obtener la última evaluación vigente de cada uno
    const uniqueEspMap = new Map<string, any[]>();
    dataEspecialistas.forEach((esp: any) => {
      const dni = (esp.dni || esp.especialistaDni || esp.info?.dni || '').trim();
      if (!dni) return;
      if (!uniqueEspMap.has(dni)) {
        uniqueEspMap.set(dni, []);
      }
      uniqueEspMap.get(dni)!.push(esp);
    });

    const data = dimensionesEspecialistas.map((dim: any) => {
      const preguntasDim = getPreguntaRespuestaDocentes.filter((p) => p.dimensionId === dim.id);
      if (preguntasDim.length === 0) return 0;

      const latestDomainScores: number[] = [];
      Array.from(uniqueEspMap.values()).forEach((evalsList) => {
        const evalsSorted = evalsList.sort((a, b) => {
          const timeA = getMonitoreoTimestamp(a);
          const timeB = getMonitoreoTimestamp(b);
          if (timeA !== timeB) return timeA - timeB;
          return (Number(a.numeroEvaluacion) || 0) - (Number(b.numeroEvaluacion) || 0);
        });
        const latestEval = evalsSorted[evalsSorted.length - 1];
        const sumEsp = getPuntajeSumPorDominioParaEspecialista(latestEval, dim.id, preguntasDim, scale);
        if (sumEsp !== null) {
          latestDomainScores.push(sumEsp);
        }
      });

      const avgScore = latestDomainScores.length > 0
        ? latestDomainScores.reduce((acc, curr) => acc + curr, 0) / latestDomainScores.length
        : 0;

      return Number(avgScore.toFixed(2));
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
    if (!dataEvaluacionDocente.escala || !dimensionesEspecialistas || dimensionesEspecialistas.length === 0) {
      return { labels: [], datasets: [], dimList: [] };
    }

    const scale = dataEvaluacionDocente.escala;
    const dataEspecialistas = dataFiltradaEspecialistaDirectorTabla || [];

    // Agrupar especialistas únicos por DNI para obtener la última evaluación vigente de cada uno
    const uniqueEspMap = new Map<string, any[]>();
    dataEspecialistas.forEach((esp: any) => {
      const dni = (esp.dni || esp.especialistaDni || esp.info?.dni || '').trim();
      if (!dni) return;
      if (!uniqueEspMap.has(dni)) {
        uniqueEspMap.set(dni, []);
      }
      uniqueEspMap.get(dni)!.push(esp);
    });

    const dimList = (dimensionesEspecialistas || []).map((dim: any, dimIndex: number) => {
      const preguntasDim = getPreguntaRespuestaDocentes.filter((p) => p.dimensionId === dim.id);

      // 1. Promedio global final: toma la última evaluación vigente de CADA especialista único
      const latestDomainScores: number[] = [];
      const latestCalifs: number[] = [];

      Array.from(uniqueEspMap.values()).forEach((evalsList) => {
        const evalsSorted = evalsList.sort((a, b) => {
          const timeA = getMonitoreoTimestamp(a);
          const timeB = getMonitoreoTimestamp(b);
          if (timeA !== timeB) return timeA - timeB;
          return (Number(a.numeroEvaluacion) || 0) - (Number(b.numeroEvaluacion) || 0);
        });
        const latestEval = evalsSorted[evalsSorted.length - 1];
        const sumEsp = getPuntajeSumPorDominioParaEspecialista(latestEval, dim.id, preguntasDim, scale);
        if (sumEsp !== null) {
          latestDomainScores.push(sumEsp);
          const califEsp = typeof latestEval.calificacion === 'number' ? latestEval.calificacion : sumEsp;
          latestCalifs.push(califEsp);
        }
      });

      const latestGlobalDomainAvg = latestDomainScores.length > 0
        ? latestDomainScores.reduce((acc, curr) => acc + curr, 0) / latestDomainScores.length
        : 0;

      const countQuestions = preguntasDim.length || 1;
      const maxScaleVal = Math.max(1, ...(scale?.map((e: any) => Number(e.value) || 0) || [3]));
      const maxDomainScore = countQuestions * maxScaleVal;

      const roundedDomainAvg = Number(latestGlobalDomainAvg.toFixed(2));
      const nivelObj = (dim.niveles && dim.niveles.length > 0)
        ? getNivelLogro(roundedDomainAvg, dim.niveles)
        : getNivelLogroDominio(roundedDomainAvg, maxDomainScore, dim);

      // 2. Desglose histórico por fases
      const phaseMap = new Map<
        string,
        {
          faseKey: string;
          faseName: string;
          timestamp: number;
          numEval: number;
          domainScores: number[];
          califs: number[];
        }
      >();

      dataEspecialistas.forEach((esp: any) => {
        const sumEspecialista = getPuntajeSumPorDominioParaEspecialista(esp, dim.id, preguntasDim, scale);
        if (sumEspecialista !== null) {
          const faseName = getCleanPhaseName(esp.faseNombre, esp.idFase || esp.faseActualID);
          const timestamp = getMonitoreoTimestamp(esp);
          const numEval = Number(esp.numeroEvaluacion) || 1;
          const faseKey = (esp.idFase || esp.faseActualID || esp.faseNombre || `eval_${numEval}`).toString().trim();

          if (!phaseMap.has(faseKey)) {
            phaseMap.set(faseKey, {
              faseKey,
              faseName,
              timestamp,
              numEval,
              domainScores: [],
              califs: [],
            });
          }

          const pData = phaseMap.get(faseKey)!;
          pData.domainScores.push(sumEspecialista);
          if (typeof esp.calificacion === 'number') {
            pData.califs.push(esp.calificacion);
          } else {
            pData.califs.push(sumEspecialista);
          }
        }
      });

      const phasesSorted = Array.from(phaseMap.values()).sort((a, b) => {
        if (a.timestamp !== b.timestamp) return a.timestamp - b.timestamp;
        return a.numEval - b.numEval;
      });

      const evalsData: {
        domainScore: number;
        fase: string;
        dateStr: string;
        calif: number;
        nivel: any;
        nivelColor: string;
      }[] = [];

      phasesSorted.forEach((p) => {
        if (p.domainScores.length > 0) {
          const avgDomain = p.domainScores.reduce((acc, curr) => acc + curr, 0) / p.domainScores.length;
          const avgCalif = p.califs.length > 0
            ? p.califs.reduce((acc, curr) => acc + curr, 0) / p.califs.length
            : avgDomain;
          const rCalif = Number(avgDomain.toFixed(2));
          const nivel = (dim.niveles && dim.niveles.length > 0)
            ? getNivelLogro(rCalif, dim.niveles)
            : getNivelLogroDominio(rCalif, maxDomainScore, dim);
          const nivelColor = nivel?.color || getDomainColor(dim, dimIndex);

          evalsData.push({
            domainScore: Number(avgDomain.toFixed(2)),
            fase: p.faseName,
            dateStr: '',
            calif: Number(avgCalif.toFixed(0)),
            nivel,
            nivelColor,
          });
        }
      });

      const latestFaseNombre = evalsData.length > 0 ? evalsData[evalsData.length - 1].fase : '';

      return {
        dim,
        name: (dim.nombre || '').toUpperCase(),
        avg: Number(latestGlobalDomainAvg.toFixed(2)),
        latestDomainScore: Number(latestGlobalDomainAvg.toFixed(2)),
        latestCalificacion: Number(roundedDomainAvg.toFixed(0)),
        latestFaseNombre,
        nivelNombre: nivelObj?.nivel || '',
        nivelColor: nivelObj?.color || getDomainColor(dim, dimIndex),
        evalsData,
        dimIndex,
      };
    });

    const labels = dimList.map((d) => formatLabel(d.name, 45));
    const maxEvalsCount = Math.max(...dimList.map((d) => d.evalsData.length), 1);

    const datasets = [];
    for (let i = 0; i < maxEvalsCount; i++) {
      const data = dimList.map((d) => {
        const evData = d.evalsData[i];
        if (!evData) return 0;
        const sumScores = d.evalsData.reduce((acc, ev) => acc + (ev.domainScore || 0), 0);
        if (sumScores === 0) return 0;
        return Number(((evData.domainScore / sumScores) * d.latestDomainScore).toFixed(3));
      });

      const rawDomainScores = dimList.map((d) => d.evalsData[i]?.domainScore ?? 0);
      const phaseNames = dimList.map((d) => d.evalsData[i]?.fase ?? '');
      const evalDates = dimList.map((d) => d.evalsData[i]?.dateStr ?? '');
      const levelNames = dimList.map((d) => d.evalsData[i]?.nivel?.nivel ?? '');

      const backgroundColor = dimList.map((d) => {
        const evData = d.evalsData[i];
        if (!evData) return 'transparent';
        if (colorMode === 'nivel' && evData.nivelColor) {
          return hexToRgba(evData.nivelColor, 0.85);
        }
        return hexToRgba(getDomainColor(d.dim, d.dimIndex), 0.75);
      });

      const borderColor = dimList.map((d) => {
        const evData = d.evalsData[i];
        if (!evData) return 'transparent';
        if (colorMode === 'nivel' && evData.nivelColor) {
          return evData.nivelColor;
        }
        return getDomainColor(d.dim, d.dimIndex);
      });

      datasets.push({
        label: `Fase ${i + 1}`,
        data,
        rawDomainScores,
        phaseNames,
        evalDates,
        levelNames,
        backgroundColor,
        borderColor,
        borderWidth: 1.5,
        borderRadius: 4,
      });
    }

    return {
      labels,
      datasets,
      dimList,
    };
  };

  const maxScaleValue = Math.max(
    1,
    ...(dataEvaluacionDocente.escala?.map(e => Number(e.value) || 0) || [3])
  );

  const maxGlobalDomainScore = Math.max(
    maxScaleValue,
    ...(dimensionesEspecialistas || []).map((dim: any) => {
      const count = getPreguntaRespuestaDocentes.filter(p => p.dimensionId === dim.id).length;
      return count > 0 ? count * maxScaleValue : maxScaleValue;
    })
  );

  const getDimensionBarOptions = (dimList?: any[]) => ({
    responsive: true,
    maintainAspectRatio: false,
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
            if (!item || !item.evalsData || item.evalsData.length <= 1) return '';
            const lines = ['\nHistorial del Dominio por Fases:'];
            item.evalsData.forEach((ev: any, idx: number) => {
              const s = ev.domainScore;
              const f = ev.fase;
              const n = ev.nivel?.nivel || '—';
              lines.push(`• Fase ${idx + 1} (${f}): ${s} pts prom global [${n}]`);
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

  const getDimensionVerticalBarOptions = (dimList?: any[]) => ({
    responsive: true,
    maintainAspectRatio: false,
    layout: {
      padding: {
        top: 25,
        bottom: 10,
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
            if (!item || !item.evalsData || item.evalsData.length <= 1) return '';
            const lines = ['\nHistorial del Dominio por Fases:'];
            item.evalsData.forEach((ev: any, idx: number) => {
              const s = ev.domainScore;
              const f = ev.fase;
              const n = ev.nivel?.nivel || '—';
              lines.push(`• Fase ${idx + 1} (${f}): ${s} pts prom global [${n}]`);
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
          font: {
            family: 'Montserrat, sans-serif',
            size: 11,
            weight: 'normal' as const,
          },
          color: '#1e293b',
          padding: 8,
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

  const getLevelsData = () => {
    const niveles = dataEvaluacionDocente.niveles || [];
    if (niveles.length === 0 || !dataFiltradaEspecialistaDirectorTabla) return { labels: [], datasets: [] };

    const counts = niveles.map(nivel => {
      return dataFiltradaEspecialistaDirectorTabla.filter(reporte => {
        const score = reporte.calificacion || 0;
        const matched = getNivelLogro(score, niveles);
        return matched?.nivel === nivel.nivel;
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
    const scale = dataEvaluacionDocente.escala || [];
    const dataEspecialistas = dataFiltradaEspecialistaDirectorTabla || [];
    const maxQuestionValue = Math.max(1, ...(scale.map((e) => Number(e.value) || 0) || [3]));
    const maxDomainScore = Math.max(1, (preguntasDim.length || 1) * maxQuestionValue);

    // 1. Agrupar especialistas por UGEL y por DNI para obtener la última evaluación de cada uno
    const ugelEspMap = new Map<string, Map<string, any[]>>();
    // 2. Agrupar todas las evaluaciones por UGEL y por fase histórica
    const ugelPhaseMap = new Map<
      string,
      Map<
        string,
        {
          faseKey: string;
          faseName: string;
          timestamp: number;
          numEval: number;
          domainScores: number[];
          califs: number[];
        }
      >
    >();

    dataEspecialistas.forEach((esp: any) => {
      const regionVal = (esp as any).region || esp.info?.region;
      const dni = (esp.dni || esp.especialistaDni || esp.info?.dni || '').trim();
      if (!regionVal) return;
      const ugelId = regionVal.toString();

      if (!ugelEspMap.has(ugelId)) {
        ugelEspMap.set(ugelId, new Map());
      }
      if (dni) {
        const espGroup = ugelEspMap.get(ugelId)!;
        if (!espGroup.has(dni)) {
          espGroup.set(dni, []);
        }
        espGroup.get(dni)!.push(esp);
      }

      if (!ugelPhaseMap.has(ugelId)) {
        ugelPhaseMap.set(ugelId, new Map());
      }

      const sumEspecialista = getPuntajeSumPorDominioParaEspecialista(esp, dimensionId, preguntasDim, scale);
      if (sumEspecialista !== null) {
        const faseName = getCleanPhaseName(esp.faseNombre, esp.idFase || esp.faseActualID);
        const timestamp = getMonitoreoTimestamp(esp);
        const numEval = Number(esp.numeroEvaluacion) || 1;
        const faseKey = (esp.idFase || esp.faseActualID || esp.faseNombre || `eval_${numEval}`).toString().trim();

        const pMap = ugelPhaseMap.get(ugelId)!;
        if (!pMap.has(faseKey)) {
          pMap.set(faseKey, {
            faseKey,
            faseName,
            timestamp,
            numEval,
            domainScores: [],
            califs: [],
          });
        }

        const pData = pMap.get(faseKey)!;
        pData.domainScores.push(sumEspecialista);
        if (typeof esp.calificacion === 'number') {
          pData.califs.push(esp.calificacion);
        } else {
          pData.califs.push(sumEspecialista);
        }
      }
    });

    const ugelList: {
      name: string;
      avg: number;
      latestDomainScore: number;
      ugelId: string;
      latestCalificacion?: number;
      latestFaseNombre?: string;
      nivelNombre?: string;
      nivelColor?: string;
      evalsData: {
        domainScore: number;
        fase: string;
        dateStr: string;
        calif: number;
        nivel: any;
        nivelColor: string;
      }[];
    }[] = [];

    Array.from(ugelEspMap.entries()).forEach(([ugelId, espGroup]) => {
      const ugelName = (regiones.find((r) => r.id.toString() === ugelId)?.region || ugelId).toUpperCase();

      // Calcular el promedio final de la UGEL con la última evaluación vigente de CADA especialista único
      const latestDomainScores: number[] = [];
      const latestCalifs: number[] = [];

      Array.from(espGroup.values()).forEach((evalsList) => {
        const evalsSorted = evalsList.sort((a, b) => {
          const timeA = getMonitoreoTimestamp(a);
          const timeB = getMonitoreoTimestamp(b);
          if (timeA !== timeB) return timeA - timeB;
          return (Number(a.numeroEvaluacion) || 0) - (Number(b.numeroEvaluacion) || 0);
        });
        const latestEval = evalsSorted[evalsSorted.length - 1];
        const sumEsp = getPuntajeSumPorDominioParaEspecialista(latestEval, dimensionId, preguntasDim, scale);
        if (sumEsp !== null) {
          latestDomainScores.push(sumEsp);
          const califEsp = typeof latestEval.calificacion === 'number' ? latestEval.calificacion : sumEsp;
          latestCalifs.push(califEsp);
        }
      });

      if (latestDomainScores.length === 0) return;

      const currentDim = dimensionesEspecialistas?.find((d) => d.id === dimensionId);
      const dimNiveles = currentDim?.niveles;
      const latestUgelDomainAvg = latestDomainScores.reduce((acc, curr) => acc + curr, 0) / latestDomainScores.length;
      const latestUgelCalifAvg = latestCalifs.reduce((acc, curr) => acc + curr, 0) / latestCalifs.length;
      const roundedDomainAvg = Number(latestUgelDomainAvg.toFixed(2));
      const nivelObj = (dimNiveles && dimNiveles.length > 0)
        ? getNivelLogro(roundedDomainAvg, dimNiveles)
        : getNivelLogroDominio(roundedDomainAvg, maxDomainScore, currentDim);

      // Desglose histórico por fases de esta UGEL
      const pMap = ugelPhaseMap.get(ugelId) || new Map();
      const phasesSorted = Array.from(pMap.values()).sort((a, b) => {
        if (a.timestamp !== b.timestamp) return a.timestamp - b.timestamp;
        return a.numEval - b.numEval;
      });

      const evalsData: {
        domainScore: number;
        fase: string;
        dateStr: string;
        calif: number;
        nivel: any;
        nivelColor: string;
      }[] = [];

      phasesSorted.forEach((p) => {
        if (p.domainScores.length > 0) {
          const avgDomain = p.domainScores.reduce((acc: number, curr: number) => acc + curr, 0) / p.domainScores.length;
          const avgCalif = p.califs.length > 0
            ? p.califs.reduce((acc: number, curr: number) => acc + curr, 0) / p.califs.length
            : avgDomain;
          const rCalif = Number(avgDomain.toFixed(2));
          const nivel = (dimNiveles && dimNiveles.length > 0)
            ? getNivelLogro(rCalif, dimNiveles)
            : getNivelLogroDominio(rCalif, maxDomainScore, currentDim);
          const nivelColor = nivel?.color || (color || '#3b82f6');

          evalsData.push({
            domainScore: Number(avgDomain.toFixed(2)),
            fase: p.faseName,
            dateStr: '',
            calif: Number(avgCalif.toFixed(0)),
            nivel,
            nivelColor,
          });
        }
      });

      const latestFaseNombre = evalsData.length > 0 ? evalsData[evalsData.length - 1].fase : '';

      ugelList.push({
        name: ugelName,
        avg: Number(latestUgelDomainAvg.toFixed(2)),
        latestDomainScore: Number(latestUgelDomainAvg.toFixed(2)),
        ugelId,
        latestCalificacion: Number(latestUgelCalifAvg.toFixed(0)),
        latestFaseNombre,
        nivelNombre: nivelObj?.nivel || '',
        nivelColor: nivelObj?.color || (color || '#3b82f6'),
        evalsData,
      });
    });

    // Ordenar descendente según el puntaje promedio de la UGEL (incluyendo a todos sus especialistas)
    ugelList.sort((a, b) => b.latestDomainScore - a.latestDomainScore);

    const maxEvalsCount = Math.max(...ugelList.map((u) => u.evalsData.length), 1);
    const barColor = color || '#3b82f6';

    const datasets = [];
    for (let i = 0; i < maxEvalsCount; i++) {
      const data = ugelList.map((u) => {
        const evData = u.evalsData[i];
        if (!evData) return 0;
        const sumScores = u.evalsData.reduce((acc, ev) => acc + (ev.domainScore || 0), 0);
        if (sumScores === 0) return 0;
        return Number(((evData.domainScore / sumScores) * u.latestDomainScore).toFixed(3));
      });

      const rawDomainScores = ugelList.map((u) => u.evalsData[i]?.domainScore ?? 0);
      const phaseNames = ugelList.map((u) => u.evalsData[i]?.fase ?? '');
      const evalDates = ugelList.map((u) => u.evalsData[i]?.dateStr ?? '');
      const levelNames = ugelList.map((u) => u.evalsData[i]?.nivel?.nivel ?? '');

      const backgroundColor = ugelList.map((u) => {
        const evData = u.evalsData[i];
        if (!evData) return 'transparent';
        if (colorMode === 'nivel' && evData.nivelColor) {
          return hexToRgba(evData.nivelColor, 0.85);
        }
        return hexToRgba(barColor, 0.75);
      });

      const borderColor = ugelList.map((u) => {
        const evData = u.evalsData[i];
        if (!evData) return 'transparent';
        if (colorMode === 'nivel' && evData.nivelColor) {
          return evData.nivelColor;
        }
        return barColor;
      });

      datasets.push({
        label: `FASE N° ${i + 1}`,
        data,
        rawDomainScores,
        phaseNames,
        evalDates,
        levelNames,
        backgroundColor,
        borderColor: '#ffffff',
        borderWidth: 1.5,
        borderRadius: 2,
      });
    }

    return {
      labels: ugelList.map((u) => u.name.toUpperCase()),
      datasets,
      ugelList,
      maxDomainScore,
      totalItems: preguntasDim.length,
    };
  };

  const getUgelDimensionChartOptions = (maxScore?: number, ugelList?: any[]) => ({
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
      customItemData: ugelList || [],
      legend: {
        display: false,
      },
      title: {
        display: false,
      },
      tooltip: {
        callbacks: {
          title: (context: any) => {
            const item = ugelList ? ugelList[context[0].dataIndex] : null;
            return item ? `#${context[0].dataIndex + 1}. ${item.name}` : '';
          },
          label: (context: any) => {
            const item = ugelList ? ugelList[context.dataIndex] : null;
            const evalIndex = context.datasetIndex;
            const evData = item?.evalsData?.[evalIndex];
            if (!evData) return '';
            const score = evData.domainScore;
            const fase = evData.fase;
            const nivel = evData.nivel?.nivel;
            return ` ${fase}: ${score} pts promedio en dimensión ${nivel ? `[${nivel}]` : ''}`;
          },
          afterBody: (context: any) => {
            const item = ugelList ? ugelList[context[0].dataIndex] : null;
            if (!item || !item.evalsData || item.evalsData.length <= 1) return '';
            const lines = ['\nHistorial del Dominio por Fases (UGEL):'];
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
        suggestedMax: Math.ceil((maxScore || maxScaleValue) * 1.1),
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

  const getUgelDimensionVerticalChartOptions = (maxScore?: number, ugelList?: any[]) => ({
    responsive: true,
    maintainAspectRatio: false,
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
        suggestedMax: Math.ceil((maxScore || maxScaleValue) * 1.1),
        title: {
          display: true,
          text: 'Puntaje en Dominio (promedio pts)',
          font: {
            family: 'Montserrat, sans-serif',
            size: 11,
            weight: 'bold' as const,
          },
          color: '#475569',
        },
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
      customItemData: ugelList || [],
      legend: {
        display: false,
      },
      title: {
        display: false,
      },
      tooltip: {
        callbacks: {
          title: (context: any) => {
            const item = ugelList ? ugelList[context[0].dataIndex] : null;
            return item ? item.name : '';
          },
          label: (context: any) => {
            const item = ugelList ? ugelList[context.dataIndex] : null;
            const evalIndex = context.datasetIndex;
            const evData = item?.evalsData?.[evalIndex];
            if (!evData) return '';
            const score = evData.domainScore;
            const fase = evData.fase;
            const nivel = evData.nivel?.nivel;
            return ` ${fase}: ${score} pts promedio en dimensión ${nivel ? `[${nivel}]` : ''}`;
          },
          afterBody: (context: any) => {
            const item = ugelList ? ugelList[context[0].dataIndex] : null;
            if (!item || !item.evalsData || item.evalsData.length <= 1) return '';
            const lines = ['\nHistorial del Dominio por Fases (UGEL):'];
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
  });

  const getEspecialistaDataForDimension = (dimensionId: string, color?: string) => {
    const preguntasDim = getPreguntaRespuestaDocentes.filter((p) => p.dimensionId === dimensionId);
    const scale = dataEvaluacionDocente.escala || [];
    const dataEspecialistas = dataFiltradaEspecialistaDirectorTabla || [];
    const maxQuestionValue = Math.max(1, ...(scale.map((e) => Number(e.value) || 0) || [3]));
    const maxDomainScore = Math.max(1, (preguntasDim.length || 1) * maxQuestionValue);

    // Agrupar por especialista único (DNI) para recopilar TODAS sus evaluaciones y fases
    const espGroupMap = new Map<string, { info: any; evaluations: any[] }>();

    dataEspecialistas.forEach((esp: any) => {
      const dni = (esp.dni || esp.especialistaDni || esp.info?.dni || '').trim();
      if (!dni) return;
      if (!espGroupMap.has(dni)) {
        espGroupMap.set(dni, { info: esp, evaluations: [] });
      }
      espGroupMap.get(dni)!.evaluations.push(esp);
    });

    const espList: {
      name: string;
      avg: number;
      latestDomainScore: number;
      dni: string;
      totalItems: number;
      latestCalificacion?: number;
      latestFaseNombre?: string;
      nivelNombre?: string;
      nivelColor?: string;
      evalsData: {
        domainScore: number;
        fase: string;
        dateStr: string;
        calif: number;
        nivel: any;
        nivelColor: string;
      }[];
    }[] = [];

    Array.from(espGroupMap.values()).forEach((group) => {
      const evalsSorted = group.evaluations.sort((a, b) => {
        const timeA = getMonitoreoTimestamp(a);
        const timeB = getMonitoreoTimestamp(b);
        if (timeA !== timeB) return timeA - timeB;
        return (Number(a.numeroEvaluacion) || 0) - (Number(b.numeroEvaluacion) || 0);
      });

      const evalsData: {
        domainScore: number;
        fase: string;
        dateStr: string;
        calif: number;
        nivel: any;
        nivelColor: string;
      }[] = [];

      const currentDim = dimensionesEspecialistas?.find((d) => d.id === dimensionId);
      const dimNiveles = currentDim?.niveles;

      evalsSorted.forEach((ev: any) => {
        const sumEspecialista = getPuntajeSumPorDominioParaEspecialista(ev, dimensionId, preguntasDim, scale);
        if (sumEspecialista !== null) {
          const fase = getCleanPhaseName(ev.faseNombre, ev.idFase || ev.faseActualID);
          const dateStr = getLocalDateString(ev.fechaMonitoreo || ev.fechaCreacion);
          const calif = typeof ev.calificacion === 'number' ? ev.calificacion : sumEspecialista;
          const score = Number(sumEspecialista.toFixed(2));
          const nivel = (dimNiveles && dimNiveles.length > 0)
            ? getNivelLogro(score, dimNiveles)
            : getNivelLogroDominio(score, maxDomainScore, currentDim);
          const nivelColor = nivel?.color || (color || '#10b981');

          evalsData.push({
            domainScore: score,
            fase,
            dateStr,
            calif,
            nivel,
            nivelColor,
          });
        }
      });

      if (evalsData.length > 0) {
        const latestEval = evalsData[evalsData.length - 1];
        const nombre = (group.info.nombres || group.info.info?.nombres || '').trim();
        const apellido = (group.info.apellidos || group.info.info?.apellidos || '').trim();
        const dni = (group.info.dni || group.info.info?.dni || '').trim();
        const fullName = ((apellido || nombre) ? `${apellido} ${nombre}`.trim() : `DNI: ${dni}`).toUpperCase();

        espList.push({
          name: fullName,
          avg: latestEval.domainScore,
          latestDomainScore: latestEval.domainScore,
          dni,
          totalItems: preguntasDim.length,
          latestCalificacion: latestEval.calif,
          latestFaseNombre: latestEval.fase,
          nivelNombre: latestEval.nivel?.nivel || '',
          nivelColor: latestEval.nivelColor,
          evalsData,
        });
      }
    });

    // Ordenar descendente según el puntaje de la última evaluación en esta dimensión
    espList.sort((a, b) => b.latestDomainScore - a.latestDomainScore);

    const maxEvalsCount = Math.max(...espList.map((e) => e.evalsData.length), 1);
    const barColor = color || '#10b981';

    const datasets = [];
    for (let i = 0; i < maxEvalsCount; i++) {
      const data = espList.map((esp) => {
        const evData = esp.evalsData[i];
        if (!evData) return 0;
        const sumScores = esp.evalsData.reduce((acc, ev) => acc + (ev.domainScore || 0), 0);
        if (sumScores === 0) return 0;
        return Number(((evData.domainScore / sumScores) * esp.latestDomainScore).toFixed(3));
      });

      const rawDomainScores = espList.map((esp) => esp.evalsData[i]?.domainScore ?? 0);
      const phaseNames = espList.map((esp) => esp.evalsData[i]?.fase ?? '');
      const evalDates = espList.map((esp) => esp.evalsData[i]?.dateStr ?? '');
      const levelNames = espList.map((esp) => esp.evalsData[i]?.nivel?.nivel ?? '');

      const backgroundColor = espList.map((esp) => {
        const evData = esp.evalsData[i];
        if (!evData) return 'transparent';
        if (colorMode === 'nivel' && evData.nivelColor) {
          return hexToRgba(evData.nivelColor, 0.85);
        }
        return hexToRgba(barColor, 0.75);
      });

      const borderColor = espList.map((esp) => {
        const evData = esp.evalsData[i];
        if (!evData) return 'transparent';
        if (colorMode === 'nivel' && evData.nivelColor) {
          return evData.nivelColor;
        }
        return barColor;
      });

      datasets.push({
        label: `EVALUACIÓN N° ${i + 1}`,
        data,
        rawDomainScores,
        phaseNames,
        evalDates,
        levelNames,
        backgroundColor,
        borderColor: '#ffffff',
        borderWidth: 1.5,
        borderRadius: 2,
      });
    }

    return {
      labels: espList.map((e) => e.name.toUpperCase()),
      datasets,
      espList,
      maxDomainScore,
      totalItems: preguntasDim.length,
    };
  };

  const getEspecialistaDimensionChartOptions = (maxScore?: number, espList?: any[]) => ({
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
      customItemData: espList || [],
      legend: {
        display: false,
      },
      title: {
        display: false,
      },
      tooltip: {
        callbacks: {
          title: (context: any) => {
            const item = espList ? espList[context[0].dataIndex] : null;
            return item ? `#${context[0].dataIndex + 1}. ${item.name}` : '';
          },
          label: (context: any) => {
            const item = espList ? espList[context.dataIndex] : null;
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
            const item = espList ? espList[context[0].dataIndex] : null;
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
        suggestedMax: Math.ceil((maxScore || maxScaleValue) * 1.1),
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

  const getEspecialistaDimensionVerticalChartOptions = (maxScore?: number, espList?: any[]) => ({
    responsive: true,
    maintainAspectRatio: false,
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
        suggestedMax: maxScore || maxScaleValue,
        title: {
          display: true,
          text: 'Puntaje en Dominio (pts)',
          font: {
            family: 'Montserrat, sans-serif',
            size: 11,
            weight: 'bold' as const,
          },
          color: '#475569',
        },
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
      customItemData: espList || [],
      legend: {
        display: false,
      },
      title: {
        display: false,
      },
      tooltip: {
        callbacks: {
          title: (context: any) => {
            const item = espList ? espList[context[0].dataIndex] : null;
            return item ? item.name : '';
          },
          label: (context: any) => {
            const item = espList ? espList[context.dataIndex] : null;
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
            const item = espList ? espList[context[0].dataIndex] : null;
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
  });

  const getGlobalUGELData = (color?: string) => {
    const scale = dataEvaluacionDocente.escala || [];
    const dataEspecialistas = dataFiltradaEspecialistaDirectorTabla || [];
    const maxQuestionValue = Math.max(1, ...(scale.map((e) => Number(e.value) || 0) || [3]));
    const totalQuestions = getPreguntaRespuestaDocentes.length || 1;
    const maxGlobalScore = Math.max(1, totalQuestions * maxQuestionValue);

    // 1. Agrupar especialistas por UGEL y por DNI para obtener la última evaluación de cada uno
    const ugelEspMap = new Map<string, Map<string, any[]>>();
    // 2. Agrupar todas las evaluaciones por UGEL y por fase histórica
    const ugelPhaseMap = new Map<
      string,
      Map<
        string,
        {
          faseKey: string;
          faseName: string;
          timestamp: number;
          numEval: number;
          scores: number[];
        }
      >
    >();

    dataEspecialistas.forEach((esp: any) => {
      const regionVal = (esp as any).region || esp.info?.region;
      const dni = (esp.dni || esp.especialistaDni || esp.info?.dni || '').trim();
      if (!regionVal) return;
      const ugelId = regionVal.toString();

      if (!ugelEspMap.has(ugelId)) {
        ugelEspMap.set(ugelId, new Map());
      }
      if (dni) {
        const espGroup = ugelEspMap.get(ugelId)!;
        if (!espGroup.has(dni)) {
          espGroup.set(dni, []);
        }
        espGroup.get(dni)!.push(esp);
      }

      if (!ugelPhaseMap.has(ugelId)) {
        ugelPhaseMap.set(ugelId, new Map());
      }

      const scoreEsp = getEspecialistaTotalScore(esp, scale);
      if (scoreEsp !== null) {
        const faseName = getCleanPhaseName(esp.faseNombre, esp.idFase || esp.faseActualID);
        const timestamp = getMonitoreoTimestamp(esp);
        const numEval = Number(esp.numeroEvaluacion) || 1;
        const faseKey = (esp.idFase || esp.faseActualID || esp.faseNombre || `eval_${numEval}`).toString().trim();

        const pMap = ugelPhaseMap.get(ugelId)!;
        if (!pMap.has(faseKey)) {
          pMap.set(faseKey, {
            faseKey,
            faseName,
            timestamp,
            numEval,
            scores: [],
          });
        }
        pMap.get(faseKey)!.scores.push(scoreEsp);
      }
    });

    const ugelList: {
      name: string;
      avg: number;
      latestScore: number;
      latestDomainScore?: number;
      ugelId: string;
      latestFaseNombre?: string;
      nivelNombre?: string;
      nivelColor?: string;
      evalsData: {
        score: number;
        fase: string;
        dateStr: string;
        nivel: any;
        nivelColor: string;
      }[];
    }[] = [];

    Array.from(ugelEspMap.entries()).forEach(([ugelId, espGroup]) => {
      const ugelName = (regiones.find((r) => r.id.toString() === ugelId)?.region || ugelId).toUpperCase();

      const latestScores: number[] = [];
      Array.from(espGroup.values()).forEach((evalsList) => {
        const evalsSorted = evalsList.sort((a, b) => {
          const timeA = getMonitoreoTimestamp(a);
          const timeB = getMonitoreoTimestamp(b);
          if (timeA !== timeB) return timeA - timeB;
          return (Number(a.numeroEvaluacion) || 0) - (Number(b.numeroEvaluacion) || 0);
        });
        const latestEval = evalsSorted[evalsSorted.length - 1];
        const score = getEspecialistaTotalScore(latestEval, scale);
        if (score !== null) {
          latestScores.push(score);
        }
      });

      if (latestScores.length === 0) return;

      const latestUgelAvg = latestScores.reduce((acc, curr) => acc + curr, 0) / latestScores.length;
      const roundedAvg = Number(latestUgelAvg.toFixed(2));
      const nivelObj = getNivelLogro(roundedAvg);

      const pMap = ugelPhaseMap.get(ugelId) || new Map();
      const phasesSorted = Array.from(pMap.values()).sort((a, b) => {
        if (a.timestamp !== b.timestamp) return a.timestamp - b.timestamp;
        return a.numEval - b.numEval;
      });

      const evalsData = phasesSorted.map((p) => {
        const avgFase = p.scores.reduce((acc: number, curr: number) => acc + curr, 0) / p.scores.length;
        const roundedFase = Number(avgFase.toFixed(2));
        const lvl = getNivelLogro(roundedFase);
        return {
          score: roundedFase,
          fase: p.faseName,
          dateStr: p.timestamp ? new Date(p.timestamp).toLocaleDateString('es-PE') : '',
          nivel: lvl,
          nivelColor: lvl?.color || color || '#3b82f6',
        };
      });

      const latestFaseNombre = evalsData.length > 0 ? evalsData[evalsData.length - 1].fase : '';

      ugelList.push({
        name: ugelName,
        avg: roundedAvg,
        latestScore: roundedAvg,
        latestDomainScore: roundedAvg,
        ugelId,
        latestFaseNombre,
        nivelNombre: nivelObj?.nivel || '',
        nivelColor: nivelObj?.color || color || '#3b82f6',
        evalsData,
      });
    });

    ugelList.sort((a, b) => b.latestScore - a.latestScore);

    const maxEvalsCount = Math.max(...ugelList.map((u) => u.evalsData.length), 1);
    const datasets: any[] = [];
    const barColor = color || '#3b82f6';

    for (let i = 0; i < maxEvalsCount; i++) {
      const data = ugelList.map((u) => {
        const evalsCount = u.evalsData.length;
        if (i >= evalsCount) return 0;
        const segmentShare = u.latestScore / evalsCount;
        return Number(segmentShare.toFixed(2));
      });

      const rawScores = ugelList.map((u) => (i < u.evalsData.length ? u.evalsData[i].score : null));
      const phaseNames = ugelList.map((u) => (i < u.evalsData.length ? u.evalsData[i].fase : ''));
      const evalDates = ugelList.map((u) => (i < u.evalsData.length ? u.evalsData[i].dateStr : ''));
      const levelNames = ugelList.map((u) => (i < u.evalsData.length ? (u.evalsData[i].nivel?.nivel || '') : ''));
      const samplePhase = ugelList.find((u) => u.evalsData[i]?.fase)?.evalsData[i]?.fase;
      const datasetLabel = (samplePhase || `FASE N° ${i + 1}`).toUpperCase();

      const backgroundColor = ugelList.map((u) => {
        if (i >= u.evalsData.length) return 'transparent';
        const evData = u.evalsData[i];
        if (colorMode === 'nivel' && evData.nivelColor) {
          return hexToRgba(evData.nivelColor, 0.85);
        }
        return hexToRgba(barColor, 0.75);
      });

      datasets.push({
        label: datasetLabel,
        data,
        rawScores,
        rawDomainScores: rawScores,
        phaseNames,
        evalDates,
        levelNames,
        backgroundColor,
        borderColor: '#ffffff',
        borderWidth: 1.5,
        borderRadius: 2,
      });
    }

    return {
      labels: ugelList.map((u) => u.name.toUpperCase()),
      datasets,
      ugelList,
      maxGlobalScore,
      totalQuestions,
    };
  };

  const getGlobalEspecialistaData = (color?: string) => {
    const scale = dataEvaluacionDocente.escala || [];
    const dataEspecialistas = dataFiltradaEspecialistaDirectorTabla || [];
    const maxQuestionValue = Math.max(1, ...(scale.map((e) => Number(e.value) || 0) || [3]));
    const totalQuestions = getPreguntaRespuestaDocentes.length || 1;
    const maxGlobalScore = Math.max(1, totalQuestions * maxQuestionValue);

    const espMap = new Map<string, any[]>();
    dataEspecialistas.forEach((esp: any) => {
      const dni = (esp.dni || esp.especialistaDni || esp.info?.dni || '').trim();
      if (!dni) return;
      if (!espMap.has(dni)) {
        espMap.set(dni, []);
      }
      espMap.get(dni)!.push(esp);
    });

    const espList: {
      name: string;
      dni: string;
      avg: number;
      latestScore: number;
      latestDomainScore: number;
      nivelNombre?: string;
      nivelColor?: string;
      evalsData: {
        score: number;
        fase: string;
        dateStr: string;
        nivel: any;
        nivelColor: string;
      }[];
    }[] = [];

    Array.from(espMap.entries()).forEach(([dni, evalsList]) => {
      const evalsSorted = evalsList.sort((a, b) => {
        const timeA = getMonitoreoTimestamp(a);
        const timeB = getMonitoreoTimestamp(b);
        if (timeA !== timeB) return timeA - timeB;
        return (Number(a.numeroEvaluacion) || 0) - (Number(b.numeroEvaluacion) || 0);
      });

      const firstItem = evalsSorted[0];
      const nombre = (firstItem.nombres || firstItem.info?.nombres || '').trim();
      const apellido = (firstItem.apellidos || firstItem.info?.apellidos || '').trim();
      const fullName = (
        (apellido || nombre)
          ? `${apellido} ${nombre}`.trim()
          : (firstItem.especialistaNombre || firstItem.nombre || `DNI: ${dni}`)
      ).toUpperCase();

      const evalsData: {
        score: number;
        fase: string;
        dateStr: string;
        nivel: any;
        nivelColor: string;
      }[] = [];

      evalsSorted.forEach((ev) => {
        const score = getEspecialistaTotalScore(ev, scale);
        if (score !== null) {
          const roundedScore = Number(score.toFixed(2));
          const lvl = getNivelLogro(roundedScore);
          evalsData.push({
            score: roundedScore,
            fase: getCleanPhaseName(ev.faseNombre, ev.idFase || ev.faseActualID),
            dateStr: getLocalDateString(ev.fechaMonitoreo || ev.fechaCreacion),
            nivel: lvl,
            nivelColor: lvl?.color || color || '#6366f1',
          });
        }
      });

      if (evalsData.length === 0) return;

      const latestScore = evalsData[evalsData.length - 1].score;
      const nivelObj = getNivelLogro(latestScore);

      espList.push({
        name: fullName,
        dni,
        avg: latestScore,
        latestScore,
        latestDomainScore: latestScore,
        nivelNombre: (nivelObj?.nivel || '').toUpperCase(),
        nivelColor: nivelObj?.color || color || '#6366f1',
        evalsData,
      });
    });

    espList.sort((a, b) => b.latestScore - a.latestScore);

    const maxEvalsCount = Math.max(...espList.map((e) => e.evalsData.length), 1);
    const datasets: any[] = [];
    const barColor = color || '#6366f1';

    for (let i = 0; i < maxEvalsCount; i++) {
      const data = espList.map((e) => {
        const evalsCount = e.evalsData.length;
        if (i >= evalsCount) return 0;
        const segmentShare = e.latestScore / evalsCount;
        return Number(segmentShare.toFixed(2));
      });

      const rawScores = espList.map((e) => (i < e.evalsData.length ? e.evalsData[i].score : null));
      const phaseNames = espList.map((e) => (i < e.evalsData.length ? e.evalsData[i].fase : ''));
      const evalDates = espList.map((e) => (i < e.evalsData.length ? e.evalsData[i].dateStr : ''));
      const levelNames = espList.map((e) => (i < e.evalsData.length ? (e.evalsData[i].nivel?.nivel || '') : ''));
      const samplePhase = espList.find((e) => e.evalsData[i]?.fase)?.evalsData[i]?.fase;
      const datasetLabel = (samplePhase || `FASE N° ${i + 1}`).toUpperCase();

      const backgroundColor = espList.map((e) => {
        if (i >= e.evalsData.length) return 'transparent';
        const evData = e.evalsData[i];
        if (colorMode === 'nivel' && evData.nivelColor) {
          return hexToRgba(evData.nivelColor, 0.85);
        }
        return hexToRgba(barColor, 0.75);
      });

      datasets.push({
        label: datasetLabel,
        data,
        rawScores,
        rawDomainScores: rawScores,
        phaseNames,
        evalDates,
        levelNames,
        backgroundColor,
        borderColor: '#ffffff',
        borderWidth: 1.5,
        borderRadius: 2,
      });
    }

    return {
      labels: espList.map((e) => e.name.toUpperCase()),
      datasets,
      espList,
      maxGlobalScore,
      totalQuestions,
    };
  };

  const getGlobalUgelChartOptions = (maxScore?: number, ugelList?: any[]) => ({
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
      customItemData: ugelList || [],
      legend: {
        display: false,
      },
      title: {
        display: false,
      },
      tooltip: {
        callbacks: {
          title: (context: any) => {
            const item = ugelList ? ugelList[context[0].dataIndex] : null;
            return item ? `#${context[0].dataIndex + 1}. ${item.name}` : '';
          },
          label: (context: any) => {
            const item = ugelList ? ugelList[context.dataIndex] : null;
            const evalIndex = context.datasetIndex;
            const evData = item?.evalsData?.[evalIndex];
            if (!evData) return '';
            const score = evData.score;
            const fase = evData.fase;
            const nivel = evData.nivel?.nivel;
            return ` ${fase}: ${score} pts promedio general ${nivel ? `[${nivel}]` : ''}`;
          },
          afterBody: (context: any) => {
            const item = ugelList ? ugelList[context[0].dataIndex] : null;
            if (!item || !item.evalsData || item.evalsData.length <= 1) return '';
            const lines = ['\nHistorial Global por Fases (UGEL):'];
            item.evalsData.forEach((ev: any, idx: number) => {
              const s = ev.score;
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
        suggestedMax: Math.ceil((maxScore || 36) * 1.1),
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

  const getGlobalUgelVerticalChartOptions = (maxScore?: number, ugelList?: any[]) => ({
    responsive: true,
    maintainAspectRatio: false,
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
        suggestedMax: maxScore || maxScaleValue,
        title: {
          display: true,
          text: 'Puntaje Global (promedio pts)',
          font: {
            family: 'Montserrat, sans-serif',
            size: 11,
            weight: 'bold' as const,
          },
          color: '#475569',
        },
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
      customItemData: ugelList || [],
      legend: {
        display: false,
      },
      title: {
        display: false,
      },
      tooltip: {
        callbacks: {
          title: (context: any) => {
            const item = ugelList ? ugelList[context[0].dataIndex] : null;
            return item ? item.name : '';
          },
          label: (context: any) => {
            const item = ugelList ? ugelList[context.dataIndex] : null;
            const evalIndex = context.datasetIndex;
            const evData = item?.evalsData?.[evalIndex];
            if (!evData) return '';
            const score = evData.score;
            const fase = evData.fase;
            const nivel = evData.nivel?.nivel;
            return ` ${fase}: ${score} pts promedio general ${nivel ? `[${nivel}]` : ''}`;
          },
          afterBody: (context: any) => {
            const item = ugelList ? ugelList[context[0].dataIndex] : null;
            if (!item || !item.evalsData || item.evalsData.length <= 1) return '';
            const lines = ['\nHistorial Global por Fases (UGEL):'];
            item.evalsData.forEach((ev: any, idx: number) => {
              const s = ev.score;
              const f = ev.fase;
              const n = ev.nivel?.nivel || '—';
              lines.push(`• Fase ${idx + 1} (${f}): ${s} pts prom [${n}]`);
            });
            return lines;
          },
        },
      },
    },
  });

  const getGlobalEspecialistaChartOptions = (maxScore?: number, espList?: any[]) => ({
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
      customItemData: espList || [],
      legend: {
        display: false,
      },
      title: {
        display: false,
      },
      tooltip: {
        callbacks: {
          title: (context: any) => {
            const item = espList ? espList[context[0].dataIndex] : null;
            return item ? `#${context[0].dataIndex + 1}. ${item.name}` : '';
          },
          label: (context: any) => {
            const item = espList ? espList[context.dataIndex] : null;
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
            const item = espList ? espList[context[0].dataIndex] : null;
            if (!item || !item.evalsData || item.evalsData.length <= 1) return '';
            const lines = ['\nHistorial Global por Fases:'];
            item.evalsData.forEach((ev: any, idx: number) => {
              const s = ev.score;
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
        suggestedMax: Math.ceil((maxScore || 36) * 1.1),
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

  const getGlobalEspecialistaVerticalChartOptions = (maxScore?: number, espList?: any[]) => ({
    responsive: true,
    maintainAspectRatio: false,
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
        suggestedMax: maxScore || maxScaleValue,
        title: {
          display: true,
          text: 'Puntaje Global (pts)',
          font: {
            family: 'Montserrat, sans-serif',
            size: 11,
            weight: 'bold' as const,
          },
          color: '#475569',
        },
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
      customItemData: espList || [],
      legend: {
        display: false,
      },
      title: {
        display: false,
      },
      tooltip: {
        callbacks: {
          title: (context: any) => {
            const item = espList ? espList[context[0].dataIndex] : null;
            return item ? item.name : '';
          },
          label: (context: any) => {
            const item = espList ? espList[context.dataIndex] : null;
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
            const item = espList ? espList[context[0].dataIndex] : null;
            if (!item || !item.evalsData || item.evalsData.length <= 1) return '';
            const lines = ['\nHistorial Global por Fases:'];
            item.evalsData.forEach((ev: any, idx: number) => {
              const s = ev.score;
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
                    <>
                      <div className={styles.colorModeToggleWrapper}>
                        <span className={styles.colorModeLabel}>Colorear por:</span>
                        <div className={styles.segmentedControl}>
                          <button
                            type="button"
                            className={`${styles.segmentedBtn} ${colorMode === 'dominio' ? styles.segmentedBtnActive : ''}`}
                            onClick={() => setColorMode('dominio')}
                            title="Colorear gráficos según el color temático configurado para cada dominio"
                          >
                            <RiPaletteLine style={{ fontSize: '1rem', color: colorMode === 'dominio' ? '#2563eb' : '#64748b' }} />
                            <span>Color de Dominio</span>
                          </button>
                          <button
                            type="button"
                            className={`${styles.segmentedBtn} ${colorMode === 'nivel' ? `${styles.segmentedBtnActive} ${styles.segmentedBtnNivel}` : ''}`}
                            onClick={() => setColorMode('nivel')}
                            title="Colorear cada barra según el nivel de logro alcanzado en la evaluación"
                          >
                            <RiAwardLine style={{ fontSize: '1rem', color: colorMode === 'nivel' ? '#2563eb' : '#64748b' }} />
                            <span>Nivel de Logro</span>
                          </button>
                        </div>
                      </div>

                    </>
                  )}

                  <div className={styles.customDropdownContainer} ref={settingsDropdownRef}>
                    <button
                      type="button"
                      onClick={() => setIsSettingsDropdownOpen(!isSettingsDropdownOpen)}
                      className={`${styles.customDropdownTrigger} ${isSettingsDropdownOpen ? styles.customDropdownTriggerActive : ''}`}
                      title="Opciones de personalización y configuración del reporte"
                    >
                      <RiEqualizerLine style={{ fontSize: '1.15rem', color: '#2563eb' }} />
                      <span>Personalizar y Ajustes</span>
                      {DEFAULT_SECTIONS_ORDER.length - seccionesVisibles.length > 0 && (
                        <span className={styles.hiddenCountBadge}>
                          {DEFAULT_SECTIONS_ORDER.length - seccionesVisibles.length}
                        </span>
                      )}
                      <RiArrowDownSLine
                        style={{
                          fontSize: '1.15rem',
                          color: '#64748b',
                          transition: 'transform 0.2s ease',
                          transform: isSettingsDropdownOpen ? 'rotate(180deg)' : 'rotate(0deg)',
                        }}
                      />
                    </button>

                    {isSettingsDropdownOpen && (
                      <div className={styles.customDropdownMenu}>
                        <button
                          type="button"
                          onClick={() => {
                            setIsSettingsDropdownOpen(false);
                            setIsOrganizerModalOpen(true);
                          }}
                          className={styles.customDropdownItem}
                        >
                          <div className={styles.customDropdownItemLeft}>
                            <span className={styles.customDropdownItemIcon} style={{ color: '#0284c7' }}>
                              <RiGridFill />
                            </span>
                            <span>Personalizar Gráficos</span>
                          </div>
                          {DEFAULT_SECTIONS_ORDER.length - seccionesVisibles.length > 0 && (
                            <span className={styles.hiddenCountBadge}>
                              {DEFAULT_SECTIONS_ORDER.length - seccionesVisibles.length} oculto{DEFAULT_SECTIONS_ORDER.length - seccionesVisibles.length > 1 ? 's' : ''}
                            </span>
                          )}
                        </button>

                        <button
                          type="button"
                          onClick={() => {
                            setIsSettingsDropdownOpen(false);
                            setIsGlobalLevelsModalOpen(true);
                          }}
                          className={styles.customDropdownItem}
                        >
                          <div className={styles.customDropdownItemLeft}>
                            <span className={styles.customDropdownItemIcon} style={{ color: '#10b981' }}>
                              <RiAwardLine />
                            </span>
                            <span>Niveles Globales</span>
                          </div>
                        </button>

                        {dimensionesEspecialistas && dimensionesEspecialistas.length > 0 && (
                          <>
                            <button
                              type="button"
                              onClick={() => {
                                setIsSettingsDropdownOpen(false);
                                setIsDomainLevelsModalOpen(true);
                              }}
                              className={styles.customDropdownItem}
                            >
                              <div className={styles.customDropdownItemLeft}>
                                <span className={styles.customDropdownItemIcon} style={{ color: '#8b5cf6' }}>
                                  <RiAwardLine />
                                </span>
                                <span>Niveles por Dominio</span>
                              </div>
                            </button>

                            <div className={styles.customDropdownDivider} />

                            <button
                              type="button"
                              onClick={() => {
                                setIsSettingsDropdownOpen(false);
                                setIsColorModalOpen(true);
                              }}
                              className={styles.customDropdownItem}
                            >
                              <div className={styles.customDropdownItemLeft}>
                                <span className={styles.customDropdownItemIcon} style={{ color: '#6366f1' }}>
                                  <RiPaletteLine />
                                </span>
                                <span>Colores de Dominios</span>
                              </div>
                            </button>
                          </>
                        )}
                      </div>
                    )}
                  </div>

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
                      {seccionesVisibles.length === 0 && (
                        <div style={{ textAlign: 'center', padding: '3.5rem 1.5rem', background: '#f8fafc', borderRadius: '16px', border: '2px dashed #cbd5e1', marginBottom: '2rem' }}>
                          <h4 style={{ color: '#1e293b', fontSize: '1.1rem', fontWeight: 700, margin: '0 0 0.5rem 0', fontFamily: 'Montserrat, sans-serif' }}>
                            Todos los gráficos están ocultos
                          </h4>
                          <p style={{ color: '#64748b', fontSize: '0.88rem', margin: '0 0 1.25rem 0', fontFamily: 'Montserrat, sans-serif' }}>
                            Usa el botón de personalizar para activar los gráficos que deseas visualizar.
                          </p>
                          <button
                            type="button"
                            onClick={() => setIsOrganizerModalOpen(true)}
                            style={{
                              padding: '0.65rem 1.35rem',
                              background: '#2563eb',
                              color: 'white',
                              border: 'none',
                              borderRadius: '10px',
                              fontWeight: 600,
                              cursor: 'pointer',
                              fontFamily: 'Montserrat, sans-serif',
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '0.5rem',
                            }}
                          >
                            <RiGridFill />
                            <span>Personalizar Gráficos</span>
                          </button>
                        </div>
                      )}

                      {ordenSecciones.map((secId) => {
                        if (!seccionesVisibles.includes(secId)) return null;

                        // 1. SECCIÓN RENDIMIENTO GLOBAL CONSOLIDADO (UGEL Y ESPECIALISTAS)
                        if (secId === 'global_consolidado') {
                          return (
                            <div key="global_consolidado" className={styles.dimensionSectionWrapper}>
                              <div className={styles.sectionHeader}>
                                <h2 className={styles.analyticsTitle}>Rendimiento Global Consolidado</h2>
                                <p className={styles.analyticsSubtitle}>
                                  Comparativa general y ranking del puntaje total de toda la evaluación y su evolución a través de las fases
                                </p>
                              </div>

                              <div style={{ display: 'flex', flexDirection: 'column', gap: '1.75rem', width: '100%' }}>
                                {/* Card 1: Rendimiento Global por UGEL */}
                                {(() => {
                                  const globalUgelData = getGlobalUGELData(globalUgelColor);
                                  const hasData = globalUgelData.labels.length > 0;
                                  const orient = getCardOrientation('global_ugel');

                                  return (
                                    <div className={`${styles.dimensionChartCard} ${styles.dimensionChartCardCompact}`} style={{ width: '100%' }}>
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
                                                background: globalUgelColor,
                                              }}
                                            ></span>
                                            Rendimiento Global por UGEL
                                          </h3>
                                          <p className={styles.dimensionChartSubtitle}>
                                            EVALUACIÓN INTEGRAL (TODAS LAS DIMENSIONES)
                                            <span style={{ display: 'block', fontSize: '0.78rem', color: '#64748b', marginTop: '2px', fontWeight: 500 }}>
                                              {globalUgelData.totalQuestions} criterios evaluados · Puntaje máx: {globalUgelData.maxGlobalScore} pts
                                            </span>
                                          </p>
                                        </div>

                                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                                          <div className={styles.segmentedControl}>
                                            <button
                                              type="button"
                                              className={`${styles.segmentedBtn} ${orient === 'horizontal' ? styles.segmentedBtnActive : ''}`}
                                              onClick={() => setCardOrientation('global_ugel', 'horizontal')}
                                              title="Vista Horizontal"
                                              aria-label="Vista Horizontal"
                                              style={{ padding: '0.35rem 0.6rem' }}
                                            >
                                              <RiBarChartHorizontalLine style={{ fontSize: '1.1rem' }} />
                                            </button>
                                            <button
                                              type="button"
                                              className={`${styles.segmentedBtn} ${orient === 'vertical' ? styles.segmentedBtnActive : ''}`}
                                              onClick={() => setCardOrientation('global_ugel', 'vertical')}
                                              title="Vista Vertical"
                                              aria-label="Vista Vertical"
                                              style={{ padding: '0.35rem 0.6rem' }}
                                            >
                                              <RiBarChart2Line style={{ fontSize: '1.1rem' }} />
                                            </button>
                                          </div>

                                          <div className={styles.colorPickerHeaderWrapper}>
                                            <label
                                              className={styles.colorPickerCircle}
                                              style={{ background: globalUgelColor }}
                                              title="Cambiar color del gráfico"
                                            >
                                              <input
                                                type="color"
                                                value={globalUgelColor}
                                                onChange={(e) => setGlobalUgelColor(e.target.value)}
                                                className={styles.hiddenColorInput}
                                              />
                                            </label>
                                          </div>

                                          {hasData && (
                                            <button
                                              onClick={() => setSelectedDimensionModal({ dim: { nombre: 'Evaluación Global Consolidada' }, type: 'global_ugel' })}
                                              className={styles.btnVistaCompleta}
                                              title="Abrir vista completa con todas las UGELs"
                                            >
                                              <RiFullscreenLine />
                                              <span>Vista completa ({globalUgelData.labels.length})</span>
                                            </button>
                                          )}
                                        </div>
                                      </div>

                                      {hasData ? (
                                        <>
                                          {orient === 'horizontal' ? (
                                            <div
                                              className={styles.chartWrapper}
                                              style={{
                                                minHeight: `${Math.max(260, globalUgelData.labels.length * 40)}px`,
                                                width: '100%',
                                                maxWidth: '100%',
                                                position: 'relative',
                                              }}
                                            >
                                              <Bar
                                                options={getGlobalUgelChartOptions(globalUgelData.maxGlobalScore, globalUgelData.ugelList)}
                                                data={{
                                                  labels: globalUgelData.labels,
                                                  datasets: globalUgelData.datasets,
                                                }}
                                                plugins={[barDataLabelPlugin]}
                                              />
                                            </div>
                                          ) : (
                                            <div
                                              style={{
                                                minHeight: '380px',
                                                width: '100%',
                                                overflowX: globalUgelData.labels.length > 14 ? 'auto' : 'visible',
                                                position: 'relative',
                                              }}
                                            >
                                              <div
                                                style={{
                                                  minWidth: globalUgelData.labels.length > 14 ? `${globalUgelData.labels.length * 42}px` : '100%',
                                                  height: '360px',
                                                }}
                                              >
                                                <Bar
                                                  options={getGlobalUgelVerticalChartOptions(globalUgelData.maxGlobalScore, globalUgelData.ugelList)}
                                                  data={{
                                                    labels: globalUgelData.labels,
                                                    datasets: globalUgelData.datasets,
                                                  }}
                                                  plugins={[barDataLabelPlugin]}
                                                />
                                              </div>
                                            </div>
                                          )}
                                          {renderDomainLevelRanges()}
                                        </>
                                      ) : (
                                        <div className={styles.emptyDimensionChart}>
                                          <p>No se encontraron registros evaluados para las UGELs.</p>
                                        </div>
                                      )}
                                    </div>
                                  );
                                })()}

                                {/* Card 2: Rendimiento Global por Especialista */}
                                {(() => {
                                  const globalEspData = getGlobalEspecialistaData(globalEspColor);
                                  const hasData = globalEspData.labels.length > 0;
                                  const top10Labels = globalEspData.labels.slice(0, 10);
                                  const orient = getCardOrientation('global_esp');

                                  return (
                                    <div className={`${styles.dimensionChartCard} ${styles.dimensionChartCardCompact}`} style={{ width: '100%' }}>
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
                                                background: globalEspColor,
                                              }}
                                            ></span>
                                            Rendimiento Global por Especialista
                                          </h3>
                                          <p className={styles.dimensionChartSubtitle}>
                                            TOP RANKING GENERAL (TODAS LAS DIMENSIONES)
                                            <span style={{ display: 'block', fontSize: '0.78rem', color: '#64748b', marginTop: '2px', fontWeight: 500 }}>
                                              {globalEspData.totalQuestions} criterios evaluados · Puntaje máx: {globalEspData.maxGlobalScore} pts
                                            </span>
                                          </p>
                                        </div>

                                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                                          <div className={styles.segmentedControl}>
                                            <button
                                              type="button"
                                              className={`${styles.segmentedBtn} ${orient === 'horizontal' ? styles.segmentedBtnActive : ''}`}
                                              onClick={() => setCardOrientation('global_esp', 'horizontal')}
                                              title="Vista Horizontal"
                                              aria-label="Vista Horizontal"
                                              style={{ padding: '0.35rem 0.6rem' }}
                                            >
                                              <RiBarChartHorizontalLine style={{ fontSize: '1.1rem' }} />
                                            </button>
                                            <button
                                              type="button"
                                              className={`${styles.segmentedBtn} ${orient === 'vertical' ? styles.segmentedBtnActive : ''}`}
                                              onClick={() => setCardOrientation('global_esp', 'vertical')}
                                              title="Vista Vertical"
                                              aria-label="Vista Vertical"
                                              style={{ padding: '0.35rem 0.6rem' }}
                                            >
                                              <RiBarChart2Line style={{ fontSize: '1.1rem' }} />
                                            </button>
                                          </div>

                                          <div className={styles.colorPickerHeaderWrapper}>
                                            <label
                                              className={styles.colorPickerCircle}
                                              style={{ background: globalEspColor }}
                                              title="Cambiar color del gráfico"
                                            >
                                              <input
                                                type="color"
                                                value={globalEspColor}
                                                onChange={(e) => setGlobalEspColor(e.target.value)}
                                                className={styles.hiddenColorInput}
                                              />
                                            </label>
                                          </div>

                                          {hasData && (
                                            <button
                                              onClick={() => setSelectedDimensionModal({ dim: { nombre: 'Evaluación Global Consolidada' }, type: 'global_especialista' })}
                                              className={styles.btnVistaCompleta}
                                              title="Abrir vista completa con todos los especialistas"
                                            >
                                              <RiFullscreenLine />
                                              <span>Vista completa ({globalEspData.labels.length})</span>
                                            </button>
                                          )}
                                        </div>
                                      </div>

                                      {hasData ? (
                                        <>
                                          {orient === 'horizontal' ? (
                                            <div
                                              className={styles.chartWrapper}
                                              style={{
                                                minHeight: `${Math.max(260, top10Labels.length * 40)}px`,
                                                width: '100%',
                                                maxWidth: '100%',
                                                position: 'relative',
                                              }}
                                            >
                                              <Bar
                                                options={getGlobalEspecialistaChartOptions(globalEspData.maxGlobalScore, globalEspData.espList.slice(0, 10))}
                                                data={{
                                                  labels: top10Labels,
                                                  datasets: globalEspData.datasets.map((ds: any) => ({
                                                    ...ds,
                                                    data: ds.data.slice(0, 10),
                                                    rawScores: ds.rawScores?.slice(0, 10),
                                                    phaseNames: ds.phaseNames?.slice(0, 10),
                                                    evalDates: ds.evalDates?.slice(0, 10),
                                                    backgroundColor: Array.isArray(ds.backgroundColor) ? ds.backgroundColor.slice(0, 10) : ds.backgroundColor,
                                                    borderColor: Array.isArray(ds.borderColor) ? ds.borderColor.slice(0, 10) : ds.borderColor,
                                                  })),
                                                }}
                                                plugins={[barDataLabelPlugin]}
                                              />
                                            </div>
                                          ) : (
                                            <div
                                              style={{
                                                minHeight: '380px',
                                                width: '100%',
                                                overflowX: top10Labels.length > 10 ? 'auto' : 'visible',
                                                position: 'relative',
                                              }}
                                            >
                                              <div
                                                style={{
                                                  minWidth: top10Labels.length > 10 ? `${top10Labels.length * 42}px` : '100%',
                                                  height: '360px',
                                                }}
                                              >
                                                <Bar
                                                  options={getGlobalEspecialistaVerticalChartOptions(globalEspData.maxGlobalScore, globalEspData.espList.slice(0, 10))}
                                                  data={{
                                                    labels: top10Labels,
                                                    datasets: globalEspData.datasets.map((ds: any) => ({
                                                      ...ds,
                                                      data: ds.data.slice(0, 10),
                                                      rawScores: ds.rawScores?.slice(0, 10),
                                                      phaseNames: ds.phaseNames?.slice(0, 10),
                                                      evalDates: ds.evalDates?.slice(0, 10),
                                                      backgroundColor: Array.isArray(ds.backgroundColor) ? ds.backgroundColor.slice(0, 10) : ds.backgroundColor,
                                                      borderColor: Array.isArray(ds.borderColor) ? ds.borderColor.slice(0, 10) : ds.borderColor,
                                                    })),
                                                  }}
                                                  plugins={[barDataLabelPlugin]}
                                                />
                                              </div>
                                            </div>
                                          )}
                                          {renderDomainLevelRanges()}
                                        </>
                                      ) : (
                                        <div className={styles.emptyDimensionChart}>
                                          <p>No se encontraron especialistas evaluados.</p>
                                        </div>
                                      )}
                                    </div>
                                  );
                                })()}
                              </div>
                            </div>
                          );
                        }

                        // 2. SECCIÓN CONSOLIDADO GLOBAL Y NIVELES (TORTA)
                        if (secId === 'pie_charts') {
                          return (
                            <div key="pie_charts" className={styles.globalChartsGrid}>
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
                                        const matched = getNivelLogro(score, dataEvaluacionDocente.niveles);
                                        return matched?.nivel === nivel.nivel;
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
                                                const dim = dimensionesEspecialistas[context.dataIndex];
                                                const score = context.parsed;
                                                const preguntasDim = getPreguntaRespuestaDocentes.filter((p: any) => p.dimensionId === dim?.id);
                                                const countQuestions = preguntasDim.length || 1;
                                                const maxScaleVal = Math.max(1, ...(dataEvaluacionDocente.escala?.map((e: any) => Number(e.value) || 0) || [3]));
                                                const maxDomainScore = countQuestions * maxScaleVal;
                                                const nivelObj = (dim?.niveles && dim.niveles.length > 0)
                                                  ? getNivelLogro(score, dim.niveles)
                                                  : getNivelLogroDominio(score, maxDomainScore, dim);
                                                const rangeText = (nivelObj && nivelObj.min !== undefined && nivelObj.max !== undefined)
                                                  ? ` (${nivelObj.min} - ${nivelObj.max} pts)`
                                                  : '';
                                                return ` Puntaje Promedio: ${score} pts ${nivelObj?.nivel ? `[${nivelObj.nivel}${rangeText}]` : ''}`;
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

                                      const preguntasDim = getPreguntaRespuestaDocentes.filter((p) => p.dimensionId === dim.id);
                                      const countQuestions = preguntasDim.length || 1;
                                      const maxScaleVal = Math.max(1, ...(dataEvaluacionDocente.escala?.map((e: any) => Number(e.value) || 0) || [3]));
                                      const maxDomainScore = countQuestions * maxScaleVal;
                                      const nivelObj = (dim.niveles && dim.niveles.length > 0)
                                        ? getNivelLogro(value, dim.niveles)
                                        : getNivelLogroDominio(value, maxDomainScore, dim);

                                      let domainLevels = (dim.niveles && dim.niveles.length > 0) ? dim.niveles : null;
                                      if (!domainLevels) {
                                        const globalNiveles = dataEvaluacionDocente?.niveles || (dataEvaluacionDocente as any)?.nivelYPuntaje || [];
                                        const maxGlobalScale = Math.max(1, ...(globalNiveles.map((n: any) => Number(n.max) || 0) || [maxDomainScore]));
                                        domainLevels = globalNiveles.map((n: any) => ({
                                          ...n,
                                          min: Number(((Number(n.min || 0) / maxGlobalScale) * maxDomainScore).toFixed(0)),
                                          max: Number(((Number(n.max || 0) / maxGlobalScale) * maxDomainScore).toFixed(0)),
                                        }));
                                      }

                                      const currentLevel = domainLevels?.find((lvl: any) => nivelObj?.nivel === lvl.nivel) || nivelObj;

                                      return (
                                        <div
                                          key={dim.id || index}
                                          className={styles.statItem}
                                          style={{
                                            display: 'flex',
                                            flexDirection: 'column',
                                            alignItems: 'center',
                                            gap: '4px',
                                          }}
                                        >
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

                                          {currentLevel && (
                                            <div
                                              style={{
                                                display: 'inline-flex',
                                                alignItems: 'center',
                                                gap: '5px',
                                                marginTop: '4px',
                                                flexWrap: 'nowrap',
                                              }}
                                            >
                                              <span
                                                style={{
                                                  fontSize: '0.72rem',
                                                  color: currentLevel.color || '#1e293b',
                                                  fontWeight: 700,
                                                  background: hexToRgba(currentLevel.color || '#3b82f6', 0.14),
                                                  padding: '2px 8px',
                                                  borderRadius: '6px',
                                                  border: `1px solid ${hexToRgba(currentLevel.color || '#3b82f6', 0.35)}`,
                                                  display: 'inline-flex',
                                                  alignItems: 'center',
                                                  gap: '5px',
                                                  whiteSpace: 'nowrap',
                                                }}
                                              >
                                                <span
                                                  style={{
                                                    width: '6px',
                                                    height: '6px',
                                                    borderRadius: '50%',
                                                    background: currentLevel.color || '#3b82f6',
                                                    display: 'inline-block',
                                                    flexShrink: 0,
                                                  }}
                                                />
                                                {currentLevel.min !== undefined && currentLevel.max !== undefined
                                                  ? `${currentLevel.min} - ${currentLevel.max} `
                                                  : ''}
                                                {currentLevel.nivel}
                                              </span>

                                              {domainLevels && domainLevels.length > 0 && (
                                                <div className={styles.domainLevelTooltipWrapper}>
                                                  <button
                                                    type="button"
                                                    className={styles.domainLevelInfoBtn}
                                                    title="Ver escala completa de niveles"
                                                    aria-label="Ver escala completa de niveles"
                                                  >
                                                    <RiInformationLine style={{ fontSize: '0.85rem' }} />
                                                  </button>

                                                  <div className={styles.domainLevelTooltipContent}>
                                                    <div className={styles.domainLevelTooltipArrow} />
                                                    <span className={styles.domainLevelTooltipTitle}>
                                                      Escala: {dim.nombre}
                                                    </span>
                                                    <div className={styles.domainLevelTooltipList}>
                                                      {domainLevels.map((lvl: any, lIdx: number) => {
                                                        const isCurrent = nivelObj?.nivel === lvl.nivel;
                                                        return (
                                                          <div
                                                            key={lIdx}
                                                            className={`${styles.domainLevelTooltipItem} ${isCurrent ? styles.domainLevelTooltipItemActive : ''}`}
                                                          >
                                                            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                                              <span
                                                                style={{
                                                                  width: '7px',
                                                                  height: '7px',
                                                                  borderRadius: '50%',
                                                                  background: lvl.color || '#3b82f6',
                                                                  display: 'inline-block',
                                                                  flexShrink: 0,
                                                                }}
                                                              />
                                                              <span style={{ color: isCurrent ? '#ffffff' : '#cbd5e1' }}>
                                                                {lvl.nivel}
                                                              </span>
                                                              {isCurrent && (
                                                                <span style={{ fontSize: '0.65rem', color: '#38bdf8', fontWeight: 700 }}>
                                                                  (Actual)
                                                                </span>
                                                              )}
                                                            </div>
                                                            <span style={{ color: isCurrent ? '#38bdf8' : '#94a3b8', fontWeight: 600 }}>
                                                              {lvl.min ?? 0} - {lvl.max ?? 0} pts
                                                            </span>
                                                          </div>
                                                        );
                                                      })}
                                                    </div>
                                                  </div>
                                                </div>
                                              )}
                                            </div>
                                          )}
                                        </div>
                                      );
                                    })}
                                  </div>
                                </div>
                              )}
                              {/* Card: Puntaje Promedio Global por Dominio */}
                              {(() => {
                                const dimData = getDimensionData();
                                const orient = getCardOrientation('global_dim_avg');

                                return (
                                  <div className={`${styles.chartContainer} ${styles.fullWidthChart}`}>
                                    <div
                                      className={styles.dimensionChartHeader}
                                      style={{
                                        display: 'flex',
                                        justifyContent: 'space-between',
                                        alignItems: 'flex-start',
                                        flexWrap: 'wrap',
                                        gap: '0.5rem',
                                        marginBottom: '1rem',
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
                                              background: '#8b5cf6',
                                            }}
                                          ></span>
                                          Puntaje Promedio Global por Dominio
                                        </h3>
                                        <p className={styles.dimensionChartSubtitle}>
                                          RENDIMIENTO GLOBAL CONSOLIDADO POR DOMINIO (SUMA DE CRITERIOS)
                                        </p>
                                      </div>

                                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                                        <div className={styles.segmentedControl}>
                                          <button
                                            type="button"
                                            className={`${styles.segmentedBtn} ${orient === 'horizontal' ? styles.segmentedBtnActive : ''}`}
                                            onClick={() => setCardOrientation('global_dim_avg', 'horizontal')}
                                            title="Vista Horizontal"
                                            aria-label="Vista Horizontal"
                                            style={{ padding: '0.35rem 0.6rem' }}
                                          >
                                            <RiBarChartHorizontalLine style={{ fontSize: '1.1rem' }} />
                                          </button>
                                          <button
                                            type="button"
                                            className={`${styles.segmentedBtn} ${orient === 'vertical' ? styles.segmentedBtnActive : ''}`}
                                            onClick={() => setCardOrientation('global_dim_avg', 'vertical')}
                                            title="Vista Vertical"
                                            aria-label="Vista Vertical"
                                            style={{ padding: '0.35rem 0.6rem' }}
                                          >
                                            <RiBarChart2Line style={{ fontSize: '1.1rem' }} />
                                          </button>
                                        </div>

                                        {dimData.labels.length > 0 && (
                                          <button
                                            onClick={() => setSelectedDimensionModal({ dim: { nombre: 'Puntaje Promedio Global por Dominio' }, type: 'global_dominio' })}
                                            className={styles.btnVistaCompleta}
                                            title="Abrir vista completa de promedios por dominio"
                                          >
                                            <RiFullscreenLine />
                                            <span>Vista completa ({dimData.labels.length})</span>
                                          </button>
                                        )}
                                      </div>
                                    </div>

                                    {orient === 'horizontal' ? (
                                      <div
                                        className={styles.chartWrapper}
                                        style={{
                                          minHeight: `${Math.max(260, (dimensionesEspecialistas?.length || 1) * 85)}px`,
                                          width: '100%',
                                          maxWidth: '100%',
                                          position: 'relative',
                                        }}
                                      >
                                        <Bar
                                          options={getDimensionBarOptions(dimData.dimList)}
                                          data={{
                                            labels: dimData.labels,
                                            datasets: dimData.datasets,
                                          }}
                                          plugins={[barDataLabelPlugin]}
                                        />
                                      </div>
                                    ) : (
                                      <div
                                        style={{
                                          minHeight: '360px',
                                          width: '100%',
                                          overflowX: dimData.labels.length > 6 ? 'auto' : 'visible',
                                          position: 'relative',
                                        }}
                                      >
                                        <div
                                          style={{
                                            minWidth: dimData.labels.length > 6 ? `${dimData.labels.length * 90}px` : '100%',
                                            height: '350px',
                                          }}
                                        >
                                          <Bar
                                            options={getDimensionVerticalBarOptions(dimData.dimList)}
                                            data={{
                                              labels: dimData.labels,
                                              datasets: dimData.datasets,
                                            }}
                                            plugins={[barDataLabelPlugin]}
                                          />
                                        </div>
                                      </div>
                                    )}

                                    {renderGlobalDomainLevelRanges()}
                                  </div>
                                );
                              })()}
                            </div>
                          );
                        }

                        // 3. SECCIÓN RENDIMIENTO POR UGEL SEGÚN DOMINIO
                        if (secId === 'dimensiones_ugel') {
                          if (!dimensionesEspecialistas || dimensionesEspecialistas.length === 0) return null;
                          return (
                            <div key="dimensiones_ugel" className={styles.dimensionSectionWrapper}>
                              <div className={styles.sectionHeader} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
                                <div>
                                  <h2 className={styles.analyticsTitle}>Rendimiento por UGEL según Dominio</h2>
                                  <p className={styles.analyticsSubtitle}>
                                    Comparativa y ranking del puntaje promedio por UGEL en cada una de las dimensiones evaluadas
                                  </p>
                                </div>

                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap' }}>
                                  {/* Switch de modo de vista: Cuadrícula vs Compacto */}
                                  <div className={styles.segmentedControl}>
                                    <button
                                      type="button"
                                      className={`${styles.segmentedBtn} ${ugelViewMode === 'grid' ? styles.segmentedBtnActive : ''}`}
                                      onClick={() => setUgelViewMode('grid')}
                                      title="Ver todos los dominios simultáneamente en cuadrícula"
                                    >
                                      <RiLayoutGridLine style={{ fontSize: '1rem', color: ugelViewMode === 'grid' ? '#2563eb' : '#64748b' }} />
                                      <span>Ver Todos</span>
                                    </button>
                                    <button
                                      type="button"
                                      className={`${styles.segmentedBtn} ${ugelViewMode === 'compact' ? styles.segmentedBtnActive : ''}`}
                                      onClick={() => setUgelViewMode('compact')}
                                      title="Ver un dominio a la vez con controles de navegación"
                                    >
                                      <RiSlideshowLine style={{ fontSize: '1rem', color: ugelViewMode === 'compact' ? '#2563eb' : '#64748b' }} />
                                      <span>Vista Compacta</span>
                                    </button>
                                  </div>

                                  {/* Paginador carousel en modo compacto */}
                                  {ugelViewMode === 'compact' && dimensionesEspecialistas.length > 0 && (
                                    <div className={styles.carouselPaginationControl}>
                                      <button
                                        type="button"
                                        onClick={() => setCurrentUgelDimIndex((prev) => Math.max(0, prev - 1))}
                                        disabled={currentUgelDimIndex === 0}
                                        className={styles.carouselNavBtn}
                                        title="Dominio anterior"
                                      >
                                        <RiArrowLeftSLine />
                                      </button>
                                      <span className={styles.carouselPaginationText}>
                                        Dominio <strong>{currentUgelDimIndex + 1}</strong> de <strong>{dimensionesEspecialistas.length}</strong>
                                      </span>
                                      <button
                                        type="button"
                                        onClick={() => setCurrentUgelDimIndex((prev) => Math.min(dimensionesEspecialistas.length - 1, prev + 1))}
                                        disabled={currentUgelDimIndex >= dimensionesEspecialistas.length - 1}
                                        className={styles.carouselNavBtn}
                                        title="Siguiente dominio"
                                      >
                                        <RiArrowRightSLine />
                                      </button>
                                    </div>
                                  )}
                                </div>
                              </div>

                              {/* Tabs de dominios en modo compacto */}
                              {ugelViewMode === 'compact' && dimensionesEspecialistas.length > 1 && (
                                <div className={styles.domainSelectorTabs}>
                                  {dimensionesEspecialistas.map((d: any, dIdx: number) => {
                                    const isActive = dIdx === currentUgelDimIndex;
                                    const dColor = getDomainColor(d, dIdx);
                                    return (
                                      <button
                                        key={d.id || dIdx}
                                        type="button"
                                        onClick={() => setCurrentUgelDimIndex(dIdx)}
                                        className={`${styles.domainTabBtn} ${isActive ? styles.domainTabBtnActive : ''}`}
                                        style={{
                                          borderColor: isActive ? dColor : undefined,
                                          backgroundColor: isActive ? hexToRgba(dColor, 0.08) : undefined,
                                          color: isActive ? dColor : undefined,
                                        }}
                                      >
                                        <span
                                          style={{
                                            width: '8px',
                                            height: '8px',
                                            borderRadius: '50%',
                                            background: dColor,
                                          }}
                                        />
                                        <span>{d.nombre || `Dominio ${dIdx + 1}`}</span>
                                      </button>
                                    );
                                  })}
                                </div>
                              )}

                              {(() => {
                                const renderUgelCard = (dim: any, idx: number, isCompact: boolean = false) => {
                                  const domainColor = getDomainColor(dim, idx);
                                  const ugelChartData = getUGELDataForDimension(dim.id, domainColor);
                                  const hasData = ugelChartData.labels.length > 0;
                                  const cardKey = `ugel_${dim.id || idx}`;
                                  const orient = getCardOrientation(cardKey);

                                  return (
                                    <div
                                      key={dim.id || idx}
                                      className={`${styles.dimensionChartCard} ${isCompact ? styles.dimensionChartCardCompact : ''}`}
                                    >
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
                                            {ugelChartData.totalItems > 0 && (
                                              <span style={{ display: 'block', fontSize: '0.78rem', color: '#64748b', marginTop: '2px', fontWeight: 500 }}>
                                                {ugelChartData.totalItems} criterios · Puntaje máx: {ugelChartData.maxDomainScore} pts
                                              </span>
                                            )}
                                          </p>
                                        </div>

                                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                                          <div className={styles.segmentedControl}>
                                            <button
                                              type="button"
                                              className={`${styles.segmentedBtn} ${orient === 'horizontal' ? styles.segmentedBtnActive : ''}`}
                                              onClick={() => setCardOrientation(cardKey, 'horizontal')}
                                              title="Vista Horizontal"
                                              aria-label="Vista Horizontal"
                                              style={{ padding: '0.35rem 0.6rem' }}
                                            >
                                              <RiBarChartHorizontalLine style={{ fontSize: '1.1rem' }} />
                                            </button>
                                            <button
                                              type="button"
                                              className={`${styles.segmentedBtn} ${orient === 'vertical' ? styles.segmentedBtnActive : ''}`}
                                              onClick={() => setCardOrientation(cardKey, 'vertical')}
                                              title="Vista Vertical"
                                              aria-label="Vista Vertical"
                                              style={{ padding: '0.35rem 0.6rem' }}
                                            >
                                              <RiBarChart2Line style={{ fontSize: '1.1rem' }} />
                                            </button>
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

                                          {hasData && (
                                            <button
                                              onClick={() => setSelectedDimensionModal({ dim, type: 'ugel' })}
                                              className={styles.btnVistaCompleta}
                                              title="Abrir vista completa con todas las UGELs"
                                            >
                                              <RiFullscreenLine />
                                              <span>Vista completa ({ugelChartData.labels.length})</span>
                                            </button>
                                          )}
                                        </div>
                                      </div>

                                      {hasData ? (
                                        <>
                                          {orient === 'horizontal' ? (
                                            <div
                                              className={styles.chartWrapper}
                                              style={{
                                                minHeight: `${Math.max(220, ugelChartData.labels.length * (isCompact ? 40 : 36))}px`,
                                                width: '100%',
                                                maxWidth: '100%',
                                                position: 'relative',
                                              }}
                                            >
                                              <Bar
                                                options={getUgelDimensionChartOptions(ugelChartData.maxDomainScore, ugelChartData.ugelList)}
                                                data={{
                                                  labels: ugelChartData.labels,
                                                  datasets: ugelChartData.datasets,
                                                }}
                                                plugins={[barDataLabelPlugin]}
                                              />
                                            </div>
                                          ) : (
                                            <div
                                              style={{
                                                minHeight: '360px',
                                                width: '100%',
                                                overflowX: ugelChartData.labels.length > 10 ? 'auto' : 'visible',
                                                position: 'relative',
                                              }}
                                            >
                                              <div
                                                style={{
                                                  minWidth: ugelChartData.labels.length > 10 ? `${ugelChartData.labels.length * 40}px` : '100%',
                                                  height: '340px',
                                                }}
                                              >
                                                <Bar
                                                  options={getUgelDimensionVerticalChartOptions(ugelChartData.maxDomainScore, ugelChartData.ugelList)}
                                                  data={{
                                                    labels: ugelChartData.labels,
                                                    datasets: ugelChartData.datasets,
                                                  }}
                                                  plugins={[barDataLabelPlugin]}
                                                />
                                              </div>
                                            </div>
                                          )}
                                          {renderDomainLevelRanges(dim)}
                                        </>
                                      ) : (
                                        <div className={styles.emptyDimensionChart}>
                                          <p>No se encontraron registros evaluados para esta dimensión.</p>
                                        </div>
                                      )}
                                    </div>
                                  );
                                };

                                if (ugelViewMode === 'compact') {
                                  const currentDim = dimensionesEspecialistas[currentUgelDimIndex] || dimensionesEspecialistas[0];
                                  return (
                                    <div className={styles.compactDimensionWrapper}>
                                      {currentDim && renderUgelCard(currentDim, currentUgelDimIndex, true)}
                                    </div>
                                  );
                                }

                                return (
                                  <div className={styles.dimensionChartsGrid}>
                                    {dimensionesEspecialistas.map((dim: any, idx: number) => renderUgelCard(dim, idx, false))}
                                  </div>
                                );
                              })()}
                            </div>
                          );
                        }

                        // 4. SECCIÓN RENDIMIENTO POR ESPECIALISTA SEGÚN DOMINIO
                        if (secId === 'dimensiones_especialistas') {
                          if (!dimensionesEspecialistas || dimensionesEspecialistas.length === 0) return null;
                          return (
                            <div key="dimensiones_especialistas" className={styles.dimensionSectionWrapper}>
                              <div className={styles.sectionHeader} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
                                <div>
                                  <h2 className={styles.analyticsTitle}>Rendimiento por Especialista según Dominio</h2>
                                  <p className={styles.analyticsSubtitle}>
                                    Comparativa y ranking del puntaje total obtenido por cada especialista en las dimensiones evaluadas
                                  </p>
                                </div>

                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap' }}>
                                  {/* Switch de modo de vista: Cuadrícula vs Compacto */}
                                  <div className={styles.segmentedControl}>
                                    <button
                                      type="button"
                                      className={`${styles.segmentedBtn} ${espViewMode === 'grid' ? styles.segmentedBtnActive : ''}`}
                                      onClick={() => setEspViewMode('grid')}
                                      title="Ver todos los dominios simultáneamente en cuadrícula"
                                    >
                                      <RiLayoutGridLine style={{ fontSize: '1rem', color: espViewMode === 'grid' ? '#2563eb' : '#64748b' }} />
                                      <span>Ver Todos</span>
                                    </button>
                                    <button
                                      type="button"
                                      className={`${styles.segmentedBtn} ${espViewMode === 'compact' ? styles.segmentedBtnActive : ''}`}
                                      onClick={() => setEspViewMode('compact')}
                                      title="Ver un dominio a la vez con controles de navegación"
                                    >
                                      <RiSlideshowLine style={{ fontSize: '1rem', color: espViewMode === 'compact' ? '#2563eb' : '#64748b' }} />
                                      <span>Vista Compacta</span>
                                    </button>
                                  </div>

                                  {/* Paginador carousel en modo compacto */}
                                  {espViewMode === 'compact' && dimensionesEspecialistas.length > 0 && (
                                    <div className={styles.carouselPaginationControl}>
                                      <button
                                        type="button"
                                        onClick={() => setCurrentEspDimIndex((prev) => Math.max(0, prev - 1))}
                                        disabled={currentEspDimIndex === 0}
                                        className={styles.carouselNavBtn}
                                        title="Dominio anterior"
                                      >
                                        <RiArrowLeftSLine />
                                      </button>
                                      <span className={styles.carouselPaginationText}>
                                        Dominio <strong>{currentEspDimIndex + 1}</strong> de <strong>{dimensionesEspecialistas.length}</strong>
                                      </span>
                                      <button
                                        type="button"
                                        onClick={() => setCurrentEspDimIndex((prev) => Math.min(dimensionesEspecialistas.length - 1, prev + 1))}
                                        disabled={currentEspDimIndex >= dimensionesEspecialistas.length - 1}
                                        className={styles.carouselNavBtn}
                                        title="Siguiente dominio"
                                      >
                                        <RiArrowRightSLine />
                                      </button>
                                    </div>
                                  )}
                                </div>
                              </div>

                              {/* Tabs de dominios en modo compacto */}
                              {espViewMode === 'compact' && dimensionesEspecialistas.length > 1 && (
                                <div className={styles.domainSelectorTabs}>
                                  {dimensionesEspecialistas.map((d: any, dIdx: number) => {
                                    const isActive = dIdx === currentEspDimIndex;
                                    const dColor = getDomainColor(d, dIdx);
                                    return (
                                      <button
                                        key={d.id || dIdx}
                                        type="button"
                                        onClick={() => setCurrentEspDimIndex(dIdx)}
                                        className={`${styles.domainTabBtn} ${isActive ? styles.domainTabBtnActive : ''}`}
                                        style={{
                                          borderColor: isActive ? dColor : undefined,
                                          backgroundColor: isActive ? hexToRgba(dColor, 0.08) : undefined,
                                          color: isActive ? dColor : undefined,
                                        }}
                                      >
                                        <span
                                          style={{
                                            width: '8px',
                                            height: '8px',
                                            borderRadius: '50%',
                                            background: dColor,
                                          }}
                                        />
                                        <span>{d.nombre || `Dominio ${dIdx + 1}`}</span>
                                      </button>
                                    );
                                  })}
                                </div>
                              )}

                              {(() => {
                                const renderEspCard = (dim: any, idx: number, isCompact: boolean = false) => {
                                  const domainColor = getDomainColor(dim, idx);
                                  const espChartData = getEspecialistaDataForDimension(dim.id, domainColor);
                                  const hasData = espChartData.labels.length > 0;
                                  const top10Labels = espChartData.labels.slice(0, 10);
                                  const cardKey = `esp_${dim.id || idx}`;
                                  const orient = getCardOrientation(cardKey);

                                  return (
                                    <div
                                      key={dim.id || idx}
                                      className={`${styles.dimensionChartCard} ${isCompact ? styles.dimensionChartCardCompact : ''}`}
                                    >
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
                                            {espChartData.totalItems > 0 && (
                                              <span style={{ display: 'block', fontSize: '0.78rem', color: '#64748b', marginTop: '2px', fontWeight: 500 }}>
                                                {espChartData.totalItems} criterios · Puntaje máx: {espChartData.maxDomainScore} pts
                                              </span>
                                            )}
                                          </p>
                                        </div>

                                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                                          <div className={styles.segmentedControl}>
                                            <button
                                              type="button"
                                              className={`${styles.segmentedBtn} ${orient === 'horizontal' ? styles.segmentedBtnActive : ''}`}
                                              onClick={() => setCardOrientation(cardKey, 'horizontal')}
                                              title="Vista Horizontal"
                                              aria-label="Vista Horizontal"
                                              style={{ padding: '0.35rem 0.6rem' }}
                                            >
                                              <RiBarChartHorizontalLine style={{ fontSize: '1.1rem' }} />
                                            </button>
                                            <button
                                              type="button"
                                              className={`${styles.segmentedBtn} ${orient === 'vertical' ? styles.segmentedBtnActive : ''}`}
                                              onClick={() => setCardOrientation(cardKey, 'vertical')}
                                              title="Vista Vertical"
                                              aria-label="Vista Vertical"
                                              style={{ padding: '0.35rem 0.6rem' }}
                                            >
                                              <RiBarChart2Line style={{ fontSize: '1.1rem' }} />
                                            </button>
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

                                          {hasData && (
                                            <button
                                              onClick={() => setSelectedDimensionModal({ dim, type: 'especialista' })}
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
                                          {orient === 'horizontal' ? (
                                            <div
                                              className={styles.chartWrapper}
                                              style={{
                                                minHeight: `${Math.max(220, top10Labels.length * (isCompact ? 40 : 36))}px`,
                                                width: '100%',
                                                maxWidth: '100%',
                                                position: 'relative',
                                              }}
                                            >
                                              <Bar
                                                options={getEspecialistaDimensionChartOptions(espChartData.maxDomainScore, espChartData.espList.slice(0, 10))}
                                                data={{
                                                  labels: top10Labels,
                                                  datasets: espChartData.datasets.map((ds: any) => ({
                                                    ...ds,
                                                    data: ds.data.slice(0, 10),
                                                    rawDomainScores: ds.rawDomainScores?.slice(0, 10),
                                                    phaseNames: ds.phaseNames?.slice(0, 10),
                                                    evalDates: ds.evalDates?.slice(0, 10),
                                                    backgroundColor: Array.isArray(ds.backgroundColor) ? ds.backgroundColor.slice(0, 10) : ds.backgroundColor,
                                                    borderColor: Array.isArray(ds.borderColor) ? ds.borderColor.slice(0, 10) : ds.borderColor,
                                                  })),
                                                }}
                                                plugins={[barDataLabelPlugin]}
                                              />
                                            </div>
                                          ) : (
                                            <div
                                              style={{
                                                minHeight: '360px',
                                                width: '100%',
                                                overflowX: top10Labels.length > 10 ? 'auto' : 'visible',
                                                position: 'relative',
                                              }}
                                            >
                                              <div
                                                style={{
                                                  minWidth: top10Labels.length > 10 ? `${top10Labels.length * 40}px` : '100%',
                                                  height: '340px',
                                                }}
                                              >
                                                <Bar
                                                  options={getEspecialistaDimensionVerticalChartOptions(espChartData.maxDomainScore, espChartData.espList.slice(0, 10))}
                                                  data={{
                                                    labels: top10Labels,
                                                    datasets: espChartData.datasets.map((ds: any) => ({
                                                      ...ds,
                                                      data: ds.data.slice(0, 10),
                                                      rawDomainScores: ds.rawDomainScores?.slice(0, 10),
                                                      phaseNames: ds.phaseNames?.slice(0, 10),
                                                      evalDates: ds.evalDates?.slice(0, 10),
                                                      backgroundColor: Array.isArray(ds.backgroundColor) ? ds.backgroundColor.slice(0, 10) : ds.backgroundColor,
                                                      borderColor: Array.isArray(ds.borderColor) ? ds.borderColor.slice(0, 10) : ds.borderColor,
                                                    })),
                                                  }}
                                                  plugins={[barDataLabelPlugin]}
                                                />
                                              </div>
                                            </div>
                                          )}

                                          {renderDomainLevelRanges(dim)}
                                        </>
                                      ) : (
                                        <div className={styles.emptyDimensionChart}>
                                          <p>No se encontraron especialistas evaluados para esta dimensión.</p>
                                        </div>
                                      )}
                                    </div>
                                  );
                                };

                                if (espViewMode === 'compact') {
                                  const currentDim = dimensionesEspecialistas[currentEspDimIndex] || dimensionesEspecialistas[0];
                                  return (
                                    <div className={styles.compactDimensionWrapper}>
                                      {currentDim && renderEspCard(currentDim, currentEspDimIndex, true)}
                                    </div>
                                  );
                                }

                                return (
                                  <div className={styles.dimensionChartsGrid}>
                                    {dimensionesEspecialistas.map((dim: any, idx: number) => renderEspCard(dim, idx, false))}
                                  </div>
                                );
                              })()}
                            </div>
                          );
                        }

                        // 5. SECCIÓN RESULTADOS DETALLADOS POR CRITERIO
                        if (secId === 'preguntas_criterios') {
                          return (
                            <div key="preguntas_criterios" className={styles.perQuestionGrid}>
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
                          );
                        }

                        return null;
                      })}
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
            const { dim, type } = selectedDimensionModal;
            const isGlobalDominio = type === 'global_dominio';
            const isGlobal = type === 'global_ugel' || type === 'global_especialista' || isGlobalDominio;
            const isUgel = type === 'ugel' || type === 'global_ugel';
            const currentModalColor = isGlobalDominio
              ? '#8b5cf6'
              : isGlobal
              ? (type === 'global_ugel' ? globalUgelColor : globalEspColor)
              : getDomainColor(dim, currentDimIndex);

            let modalChartData: any;
            if (isGlobalDominio) {
              modalChartData = getDimensionData();
            } else if (type === 'global_ugel') {
              modalChartData = getGlobalUGELData(globalUgelColor);
            } else if (type === 'global_especialista') {
              modalChartData = getGlobalEspecialistaData(globalEspColor);
            } else if (type === 'ugel') {
              modalChartData = getUGELDataForDimension(dim?.id, currentModalColor);
            } else {
              modalChartData = getEspecialistaDataForDimension(dim?.id, currentModalColor);
            }

            const entityName = isGlobalDominio ? 'Dominio' : (isUgel ? 'UGEL' : 'Especialista');
            const entityPlural = isGlobalDominio ? 'Dominios' : (isUgel ? 'UGELs' : 'Especialistas');
            const modalTitle = isGlobalDominio
              ? 'Puntaje Promedio Global por Dominio — Vista Completa'
              : isGlobal
              ? `Rendimiento Global por ${entityName} — Vista Completa`
              : `Dimensión por ${entityName} — Vista Completa`;
            const maxScore = isGlobalDominio
              ? maxGlobalDomainScore
              : isGlobal
              ? modalChartData.maxGlobalScore
              : modalChartData.maxDomainScore;

            return createPortal(
              <div className={styles.fullScreenViewContainer}>
                <header className={styles.fullScreenHeader}>
                  <div className={styles.fullScreenTitleGroup}>
                    <h1 className={styles.fullScreenTitle}>
                      <span
                        className={styles.sectionTitleIndicator}
                        style={{ background: currentModalColor, width: '4px', height: '24px' }}
                      ></span>
                      {modalTitle}
                    </h1>
                    <p className={styles.fullScreenSubtitle}>
                      {isGlobalDominio
                        ? 'Rendimiento Global Consolidado por Dominio (Suma de Criterios)'
                        : isGlobal
                        ? 'Evaluación Integral Consolidada'
                        : (dim.nombre || 'Dimensión')}
                      {modalChartData.totalItems > 0 || modalChartData.totalQuestions > 0 ? (
                        <span style={{ display: 'inline-block', marginLeft: '8px', fontSize: '0.9rem', color: '#64748b', fontWeight: 500 }}>
                          ({isGlobal ? modalChartData.totalQuestions : modalChartData.totalItems} criterios evaluados · Puntaje máx: {maxScore} pts)
                        </span>
                      ) : null}
                    </p>
                  </div>
                  <div className={styles.fullScreenActions}>
                    <div className={styles.segmentedControl}>
                      <button
                        type="button"
                        className={`${styles.segmentedBtn} ${modalOrientation === 'horizontal' ? styles.segmentedBtnActive : ''}`}
                        onClick={() => setModalOrientation('horizontal')}
                        title="Vista Horizontal"
                        aria-label="Vista Horizontal"
                        style={{ padding: '0.45rem 0.65rem' }}
                      >
                        <RiBarChartHorizontalLine style={{ fontSize: '1.15rem' }} />
                      </button>
                      <button
                        type="button"
                        className={`${styles.segmentedBtn} ${modalOrientation === 'vertical' ? styles.segmentedBtnActive : ''}`}
                        onClick={() => setModalOrientation('vertical')}
                        title="Vista Vertical"
                        aria-label="Vista Vertical"
                        style={{ padding: '0.45rem 0.65rem' }}
                      >
                        <RiBarChart2Line style={{ fontSize: '1.15rem' }} />
                      </button>
                    </div>

                    <div className={styles.segmentedControl}>
                      <button
                        type="button"
                        className={`${styles.segmentedBtn} ${colorMode === 'dominio' ? styles.segmentedBtnActive : ''}`}
                        onClick={() => setColorMode('dominio')}
                        title="Color por Dominio / Personalizado"
                        aria-label="Color por Dominio"
                        style={{ padding: '0.45rem 0.65rem' }}
                      >
                        <RiPaletteLine style={{ fontSize: '1.15rem' }} />
                      </button>
                      <button
                        type="button"
                        className={`${styles.segmentedBtn} ${colorMode === 'nivel' ? `${styles.segmentedBtnActive} ${styles.segmentedBtnNivel}` : ''}`}
                        onClick={() => setColorMode('nivel')}
                        title="Color por Nivel de Logro"
                        aria-label="Color por Nivel de Logro"
                        style={{ padding: '0.45rem 0.65rem' }}
                      >
                        <RiAwardLine style={{ fontSize: '1.15rem' }} />
                      </button>
                    </div>

                    {!isGlobal && totalDims > 1 && (
                      <div className={styles.navDimensionGroup}>
                        <button
                          onClick={handlePrevDimension}
                          disabled={!hasPrevDim}
                          className={styles.navDimensionBtn}
                          title={hasPrevDim ? `Dominio anterior: ${dimensionesEspecialistas[currentDimIndex - 1]?.nombre}` : 'Primer dominio'}
                          aria-label="Dominio anterior"
                          style={{ padding: '0.45rem 0.6rem' }}
                        >
                          <RiArrowLeftSLine style={{ fontSize: '1.25rem' }} />
                        </button>
                        <span className={styles.navDimensionIndicator}>
                          Dominio <strong>{currentDimIndex + 1}</strong> de <strong>{totalDims}</strong>
                        </span>
                        <button
                          onClick={handleNextDimension}
                          disabled={!hasNextDim}
                          className={styles.navDimensionBtn}
                          title={hasNextDim ? `Siguiente dominio: ${dimensionesEspecialistas[currentDimIndex + 1]?.nombre}` : 'Último dominio'}
                          aria-label="Siguiente dominio"
                          style={{ padding: '0.45rem 0.6rem' }}
                        >
                          <RiArrowRightSLine style={{ fontSize: '1.25rem' }} />
                        </button>
                      </div>
                    )}

                    <span
                      className={styles.fullScreenBadge}
                      style={{
                        borderColor: hexToRgba(currentModalColor, 0.4),
                        color: currentModalColor,
                        background: hexToRgba(currentModalColor, 0.08),
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '0.35rem',
                        padding: '0.4rem 0.75rem',
                      }}
                      title={`${modalChartData.labels.length} ${entityPlural} evaluados`}
                    >
                      <strong style={{ fontSize: '0.95rem' }}>{modalChartData.labels.length}</strong>
                      {isGlobalDominio ? (
                        <RiAwardLine style={{ fontSize: '1.15rem' }} />
                      ) : isUgel ? (
                        <RiGovernmentLine style={{ fontSize: '1.15rem' }} />
                      ) : (
                        <RiGroupLine style={{ fontSize: '1.15rem' }} />
                      )}
                    </span>
                    <button
                      onClick={() => setSelectedDimensionModal(null)}
                      className={styles.fullScreenExitBtn}
                      title="Cerrar vista de pantalla completa (Esc)"
                      aria-label="Cerrar"
                      style={{ padding: '0.45rem 0.65rem' }}
                    >
                      <RiCloseLine style={{ fontSize: '1.35rem' }} />
                    </button>
                  </div>
                </header>

                <main className={styles.fullScreenBody}>
                  <div className={styles.fullScreenChartCard}>
                    {colorMode === 'nivel' && dataEvaluacionDocente.niveles && dataEvaluacionDocente.niveles.length > 0 && (
                      <div className={styles.levelsLegendBar} style={{ marginBottom: '1.5rem' }}>
                        <span className={styles.levelsLegendTitle}>
                          <RiAwardLine style={{ color: '#2563eb', fontSize: '1.1rem' }} />
                          Niveles de Logro:
                        </span>
                        {dataEvaluacionDocente.niveles.map((nivel: any, idx: number) => (
                          <div key={idx} className={styles.levelLegendItem}>
                            <span className={styles.levelLegendDot} style={{ background: nivel.color || '#3b82f6' }} />
                            <span style={{ color: '#1e293b' }}>{nivel.nivel}</span>
                            <span style={{ color: '#64748b', fontSize: '0.72rem' }}>
                              ({nivel.min ?? 0} - {nivel.max ?? 0} pts)
                            </span>
                          </div>
                        ))}
                      </div>
                    )}

                    {modalChartData.labels.length > 0 ? (
                      <>
                        {modalOrientation === 'horizontal' ? (
                          <div
                            style={{
                              minHeight: `${Math.max(500, modalChartData.labels.length * 36)}px`,
                              width: '100%',
                              position: 'relative',
                            }}
                          >
                            <Bar
                              options={
                                isGlobalDominio
                                  ? getDimensionBarOptions(modalChartData.dimList)
                                  : type === 'global_ugel'
                                  ? getGlobalUgelChartOptions(maxScore, modalChartData.ugelList)
                                  : type === 'global_especialista'
                                  ? getGlobalEspecialistaChartOptions(maxScore, modalChartData.espList)
                                  : isUgel
                                  ? getUgelDimensionChartOptions(maxScore, (modalChartData as any).ugelList)
                                  : getEspecialistaDimensionChartOptions(maxScore, (modalChartData as any).espList)
                              }
                              data={{
                                labels: modalChartData.labels,
                                datasets: modalChartData.datasets,
                              }}
                              plugins={[barDataLabelPlugin]}
                            />
                          </div>
                        ) : (
                          <div
                            style={{
                              minHeight: '520px',
                              width: '100%',
                              overflowX: modalChartData.labels.length > 40 ? 'auto' : 'visible',
                              position: 'relative',
                            }}
                          >
                            <div
                              style={{
                                width: '100%',
                                minWidth: modalChartData.labels.length > 40 ? `${modalChartData.labels.length * 40}px` : '100%',
                                height: '520px',
                              }}
                            >
                              <Bar
                                options={
                                  isGlobalDominio
                                    ? getDimensionVerticalBarOptions(modalChartData.dimList)
                                    : type === 'global_ugel'
                                    ? getGlobalUgelVerticalChartOptions(maxScore, modalChartData.ugelList)
                                    : type === 'global_especialista'
                                    ? getGlobalEspecialistaVerticalChartOptions(maxScore, modalChartData.espList)
                                    : isUgel
                                    ? getUgelDimensionVerticalChartOptions(maxScore, (modalChartData as any).ugelList)
                                    : getEspecialistaDimensionVerticalChartOptions(maxScore, (modalChartData as any).espList)
                                }
                                data={{
                                  labels: modalChartData.labels,
                                  datasets: modalChartData.datasets,
                                }}
                                plugins={[barDataLabelPlugin]}
                              />
                            </div>
                          </div>
                        )}
                        <div style={{ marginTop: '1.5rem' }}>
                          {isGlobalDominio
                            ? renderGlobalDomainLevelRanges()
                            : renderDomainLevelRanges(isGlobal ? undefined : selectedDimensionModal?.dim)}
                        </div>
                      </>
                    ) : (
                      <div className={styles.emptyDimensionChart}>
                        <p>No se encontraron registros evaluados.</p>
                      </div>
                    )}
                  </div>
                </main>
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

      <ModoOrganizarEspecialistasModal
        isOpen={isOrganizerModalOpen}
        onClose={() => setIsOrganizerModalOpen(false)}
        ordenSecciones={ordenSecciones}
        onOrderChange={handleOrderChange}
        seccionesVisibles={seccionesVisibles}
        onVisibilityChange={handleVisibilityChange}
      />

      {isGlobalLevelsModalOpen && (
        <ConfigurarNivelesEspecialistas
          handleShowConfigurarNiveles={() => setIsGlobalLevelsModalOpen(false)}
          idEvaluacion={`${route.query.idEvaluacion}`}
          nivelesActuales={dataEvaluacionDocente?.niveles || (dataEvaluacionDocente as any)?.nivelYPuntaje || []}
        />
      )}

      {isDomainLevelsModalOpen && (
        <ConfigurarNivelesPorDominio
          handleShowModal={() => setIsDomainLevelsModalOpen(false)}
          idEvaluacion={`${route.query.idEvaluacion}`}
          dimensiones={dimensionesEspecialistas || []}
          preguntas={getPreguntaRespuestaDocentes || []}
          escala={dataEvaluacionDocente?.escala || []}
        />
      )}
    </>
  );
};

export default Reportes;
Reportes.Auth = PrivateRouteAdmins;
