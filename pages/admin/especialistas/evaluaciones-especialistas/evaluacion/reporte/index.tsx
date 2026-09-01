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
          const rawVal = dataset.rawDomainScores ? dataset.rawDomainScores[index] : dataset.data[index];
          const phaseName = dataset.phaseNames ? dataset.phaseNames[index] : '';

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
                // 2. Si el segmento tiene ancho medio (>= 28px) y cabe el texto de puntos completo:
                else if (ptsWidth <= availWidth && segmentWidth >= 28) {
                  ctx.strokeText(fullPtsText, centerX, centerY);
                  ctx.fillText(fullPtsText, centerX, centerY);
                }
                // 3. Si el segmento es angosto (>= 14px) y cabe solo el número:
                else if (numWidth <= availWidth && segmentWidth >= 14) {
                  ctx.font = 'bold 8.5px Montserrat, sans-serif';
                  ctx.strokeText(numOnlyText, centerX, centerY);
                  ctx.fillText(numOnlyText, centerX, centerY);
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
                ctx.strokeStyle = 'rgba(0, 0, 0, 0.75)';
                ctx.lineWidth = 2.5;
                ctx.textAlign = 'center';

                ctx.font = 'bold 9px Montserrat, sans-serif';
                const ptsWidth = ctx.measureText(fullPtsText).width;
                const numWidth = ctx.measureText(numOnlyText).width;
                const barWidth = rect.width || 30;

                if (segmentHeight >= 22 && ptsWidth <= barWidth - 2) {
                  ctx.strokeText(fullPtsText, centerX, centerY);
                  ctx.fillText(fullPtsText, centerX, centerY);
                } else if (numWidth <= barWidth - 2) {
                  ctx.font = 'bold 8.5px Montserrat, sans-serif';
                  ctx.strokeText(numOnlyText, centerX, centerY);
                  ctx.fillText(numOnlyText, centerX, centerY);
                }

                ctx.restore();
              }
            }
          }
        });
      });

      // En vista horizontal: dibujar al final exterior de la barra total el puntaje del último dominio
      if (isHorizontal) {
        const lastMeta = chart.getDatasetMeta(datasets.length - 1);
        if (lastMeta && !lastMeta.hidden) {
          lastMeta.data.forEach((element: any, index: number) => {
            const item = customData[index];
            if (!item) return;
            const latestDomainScore = item.latestDomainScore ?? item.avg ?? 0;
            const domainScoreText = `${Number.isInteger(latestDomainScore) ? latestDomainScore : Number(latestDomainScore).toFixed(1)} pts`;

            ctx.shadowColor = 'transparent';
            ctx.textAlign = 'left';
            ctx.font = '600 11px Montserrat, sans-serif';
            ctx.fillStyle = '#475569';
            ctx.fillText(domainScoreText, element.x + 8, element.y);
          });
        }
      }
    } else {
      // --- MODO SIMPLE (UGEL O ESPECIALISTA CON 1 SOLA FASE) ---
      const dataset = datasets[0];
      const meta = chart.getDatasetMeta(0);
      if (meta && !meta.hidden) {
        meta.data.forEach((bar: any, index: number) => {
          const value = dataset.data[index];
          if (value === undefined || value === null) return;

          const item = customData[index];
          const nivelNombre = item?.nivelNombre ? item.nivelNombre.trim() : '';
          const nivelColor = item?.nivelColor || '#2563eb';

          // 1. Puntaje total alcanzado en la evaluación (ej. 36)
          const evalScore = typeof item?.latestCalificacion === 'number'
            ? item.latestCalificacion
            : (typeof value === 'number' ? Number(value).toFixed(0) : value);

          // Formato interior: Logrado(36) o Nivel(Puntaje)
          const insideLabelText = nivelNombre ? `${nivelNombre}(${evalScore})` : `${evalScore}`;

          // 2. Puntaje obtenido en este DOMINIO (ej. 12.0 pts o 12 pts)
          const domainVal = Number(value);
          const domainScoreText = `${Number.isInteger(domainVal) ? domainVal : domainVal.toFixed(1)} pts`;

          if (isHorizontal) {
            const barWidth = Math.abs(bar.x - bar.base);
            ctx.font = '700 11.5px Montserrat, sans-serif';
            const insideTextWidth = ctx.measureText(insideLabelText).width;

            // Si la barra es lo suficientemente ancha:
            if (barWidth > insideTextWidth + 18) {
              ctx.textAlign = 'right';
              ctx.fillStyle = '#ffffff';
              ctx.shadowColor = 'rgba(0, 0, 0, 0.45)';
              ctx.shadowBlur = 3;
              ctx.shadowOffsetX = 0;
              ctx.shadowOffsetY = 1;
              ctx.fillText(insideLabelText, bar.x - 10, bar.y);

              ctx.shadowColor = 'transparent';
              ctx.textAlign = 'left';
              ctx.font = '600 11px Montserrat, sans-serif';
              ctx.fillStyle = '#475569';
              ctx.fillText(domainScoreText, bar.x + 8, bar.y);
            } else {
              ctx.shadowColor = 'transparent';
              ctx.textAlign = 'left';
              ctx.font = '700 11px Montserrat, sans-serif';
              ctx.fillStyle = nivelColor || '#334155';
              ctx.fillText(`${insideLabelText} · ${domainScoreText}`, bar.x + 8, bar.y);
            }
          } else {
            // En vista vertical simple:
            const barHeight = Math.abs(bar.y - bar.base);
            const centerY = (bar.y + bar.base) / 2;

            if (barHeight >= 18) {
              ctx.fillStyle = '#ffffff';
              ctx.strokeStyle = 'rgba(0, 0, 0, 0.7)';
              ctx.lineWidth = 2.5;
              ctx.font = 'bold 9.5px Montserrat, sans-serif';
              ctx.textAlign = 'center';
              ctx.strokeText(domainScoreText, bar.x, centerY);
              ctx.fillText(domainScoreText, bar.x, centerY);
            }
          }
        });
      }
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
  const [selectedDimensionModal, setSelectedDimensionModal] = useState<{ dim: any; type: 'especialista' | 'ugel' } | null>(null);
  const [isColorModalOpen, setIsColorModalOpen] = useState(false);
  const [colorMode, setColorMode] = useState<'dominio' | 'nivel'>('nivel');
  const [modalOrientation, setModalOrientation] = useState<'horizontal' | 'vertical'>('horizontal');

  const getNivelLogro = (calificacion: number) => {
    const niveles = dataEvaluacionDocente?.niveles || [];
    if (niveles.length === 0) return null;
    const found = niveles.find((n: any) => calificacion >= (n.min ?? 0) && calificacion <= (n.max ?? 0));
    if (found) return found;
    if (calificacion < (niveles[0]?.min ?? 0)) return niveles[0];
    return niveles[niveles.length - 1];
  };

  const getNivelLogroDominio = (puntajeDominio: number, maxDomainScore: number) => {
    const niveles = dataEvaluacionDocente?.niveles || [];
    if (niveles.length === 0) return null;

    const maxScaleNivel = Math.max(1, ...(niveles.map((n: any) => Number(n.max) || 0) || [20]));
    const puntajeEquivalente = maxDomainScore > 0 ? (puntajeDominio / maxDomainScore) * maxScaleNivel : puntajeDominio;

    const found = niveles.find(
      (n: any) => puntajeEquivalente >= (n.min ?? 0) && puntajeEquivalente <= (n.max ?? 0)
    );
    if (found) return found;
    if (puntajeEquivalente < (niveles[0]?.min ?? 0)) return niveles[0];
    return niveles[niveles.length - 1];
  };

  const renderDomainLevelRanges = () => {
    const niveles = dataEvaluacionDocente?.niveles || (dataEvaluacionDocente as any)?.nivelYPuntaje || [];
    if (niveles.length === 0) return null;

    return (
      <div className={styles.domainCardLevelsFooter}>
        <div className={styles.domainLevelsFooterHeader}>
          <span className={styles.domainLevelsFooterTitle}>
            <RiAwardLine style={{ color: '#2563eb', fontSize: '0.95rem' }} />
            Puntajes por Nivel de Logro:
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

  const getDimensionPieData = () => {
    if (!dataEvaluacionDocente.escala || !dimensionesEspecialistas || dimensionesEspecialistas.length === 0) {
      return { labels: [], datasets: [] };
    }

    const scale = dataEvaluacionDocente.escala;
    const labels = dimensionesEspecialistas.map((d: any) => (d.nombre || '').toUpperCase());

    const data = dimensionesEspecialistas.map((dim: any) => {
      const preguntasDim = getPreguntaRespuestaDocentes.filter((p) => p.dimensionId === dim.id);
      if (preguntasDim.length === 0) return 0;

      // Suma de los promedios obtenidos en cada uno de los criterios del dominio
      let sumaPuntosDominio = 0;

      preguntasDim.forEach((pregunta) => {
        const pId = pregunta.order?.toString() || pregunta.id;
        const stat = dataEvaluaciones.find((s) => s.id === pId || s.id === pregunta.id);

        if (stat && stat.total && stat.total > 0) {
          const valA = (stat.a || 0) * (scale[0]?.value || 0);
          const valB = (stat.b || 0) * (scale[1]?.value || 0);
          const valC = (stat.c || 0) * (scale[2]?.value || 0);
          const valD = (stat.d || 0) * (scale[3]?.value || 0);
          const avgPregunta = (valA + valB + valC + valD) / stat.total;
          sumaPuntosDominio += avgPregunta;
        }
      });

      return Number(sumaPuntosDominio.toFixed(2));
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

      const latestGlobalCalifAvg = latestCalifs.length > 0
        ? latestCalifs.reduce((acc, curr) => acc + curr, 0) / latestCalifs.length
        : latestGlobalDomainAvg;

      const roundedCalif = Number(latestGlobalCalifAvg.toFixed(0));
      const nivelObj = getNivelLogro(roundedCalif);

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
          const rCalif = Number(avgCalif.toFixed(0));
          const nivel = getNivelLogro(rCalif);
          const nivelColor = nivel?.color || getDomainColor(dim, dimIndex);

          evalsData.push({
            domainScore: Number(avgDomain.toFixed(2)),
            fase: p.faseName,
            dateStr: '',
            calif: rCalif,
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
        latestCalificacion: roundedCalif,
        latestFaseNombre,
        nivelNombre: nivelObj?.nivel || '',
        nivelColor: nivelObj?.color || getDomainColor(dim, dimIndex),
        evalsData,
        dimIndex,
      };
    });

    const labels = dimList.map((d) => formatLabel(d.name, 24));
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
        label: `Fase N° ${i + 1}`,
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
        right: 80,
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

      const latestUgelDomainAvg = latestDomainScores.reduce((acc, curr) => acc + curr, 0) / latestDomainScores.length;
      const latestUgelCalifAvg = latestCalifs.reduce((acc, curr) => acc + curr, 0) / latestCalifs.length;
      const roundedCalif = Number(latestUgelCalifAvg.toFixed(0));
      const nivelObj = getNivelLogro(roundedCalif);

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
          const rCalif = Number(avgCalif.toFixed(0));
          const nivel = getNivelLogro(rCalif);
          const nivelColor = nivel?.color || (color || '#3b82f6');

          evalsData.push({
            domainScore: Number(avgDomain.toFixed(2)),
            fase: p.faseName,
            dateStr: '',
            calif: rCalif,
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
        latestCalificacion: roundedCalif,
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
        label: `Fase N° ${i + 1}`,
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
        right: 80,
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
        suggestedMax: maxScore || maxScaleValue,
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
        suggestedMax: maxScore || maxScaleValue,
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

      evalsSorted.forEach((ev: any) => {
        const sumEspecialista = getPuntajeSumPorDominioParaEspecialista(ev, dimensionId, preguntasDim, scale);
        if (sumEspecialista !== null) {
          const fase = getCleanPhaseName(ev.faseNombre, ev.idFase || ev.faseActualID);
          const dateStr = getLocalDateString(ev.fechaMonitoreo || ev.fechaCreacion);
          const calif = typeof ev.calificacion === 'number' ? ev.calificacion : sumEspecialista;
          const nivel = getNivelLogro(calif);
          const nivelColor = nivel?.color || (color || '#10b981');

          evalsData.push({
            domainScore: Number(sumEspecialista.toFixed(2)),
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
        label: `Evaluación N° ${i + 1}`,
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
        right: 80,
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
        suggestedMax: maxScore || maxScaleValue,
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

                      <button
                        type="button"
                        onClick={() => setIsColorModalOpen(true)}
                        className={styles.btnColorConfig}
                        title="Personalizar colores para cada dominio"
                      >
                        <RiPaletteLine style={{ fontSize: '1.2rem', color: '#6366f1' }} />
                        <span>Colores de Dominios</span>
                      </button>
                    </>
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
                            <span>Puntaje Promedio Global por Dominio</span>
                          </h3>
                          {(() => {
                            const dimData = getDimensionData();
                            return (
                              <div
                                className={styles.chartWrapper}
                                style={{
                                  minHeight: `${Math.max(340, (dimensionesEspecialistas?.length || 1) * 95)}px`,
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
                            );
                          })()}
                          {renderDomainLevelRanges()}
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

                          {colorMode === 'nivel' && dataEvaluacionDocente.niveles && dataEvaluacionDocente.niveles.length > 0 && (
                            <div className={styles.levelsLegendBar}>
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
                                        {ugelChartData.totalItems > 0 && (
                                          <span style={{ display: 'block', fontSize: '0.78rem', color: '#64748b', marginTop: '2px', fontWeight: 500 }}>
                                            {ugelChartData.totalItems} criterios · Puntaje máx: {ugelChartData.maxDomainScore} pts
                                          </span>
                                        )}
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
                                          options={getUgelDimensionChartOptions(ugelChartData.maxDomainScore, ugelChartData.ugelList)}
                                          data={{
                                            labels: ugelChartData.labels,
                                            datasets: ugelChartData.datasets,
                                          }}
                                          plugins={[barDataLabelPlugin]}
                                        />
                                      </div>
                                      {renderDomainLevelRanges()}
                                    </>
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
                              Comparativa y ranking del puntaje total obtenido por cada especialista en las dimensiones evaluadas
                            </p>
                          </div>

                          {colorMode === 'nivel' && dataEvaluacionDocente.niveles && dataEvaluacionDocente.niveles.length > 0 && (
                            <div className={styles.levelsLegendBar}>
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
                                        {espChartData.totalItems > 0 && (
                                          <span style={{ display: 'block', fontSize: '0.78rem', color: '#64748b', marginTop: '2px', fontWeight: 500 }}>
                                            {espChartData.totalItems} criterios · Puntaje máx: {espChartData.maxDomainScore} pts
                                          </span>
                                        )}
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

                                      {renderDomainLevelRanges()}
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
            const { dim, type } = selectedDimensionModal;
            const currentModalColor = getDomainColor(dim, currentDimIndex);
            const isUgel = type === 'ugel';

            const modalChartData = isUgel
              ? getUGELDataForDimension(dim.id, currentModalColor)
              : getEspecialistaDataForDimension(dim.id, currentModalColor);

            const entityName = isUgel ? 'UGEL' : 'Especialista';
            const entityPlural = isUgel ? 'UGELs' : 'Especialistas';

            return createPortal(
              <div className={styles.fullScreenViewContainer}>
                <header className={styles.fullScreenHeader}>
                  <div className={styles.fullScreenTitleGroup}>
                    <h1 className={styles.fullScreenTitle}>
                      <span
                        className={styles.sectionTitleIndicator}
                        style={{ background: currentModalColor, width: '4px', height: '24px' }}
                      ></span>
                      Dimensión por {entityName} — Vista Completa
                    </h1>
                    <p className={styles.fullScreenSubtitle}>
                      {dim.nombre || 'Dimensión'}
                      {modalChartData.totalItems > 0 && (
                        <span style={{ display: 'inline-block', marginLeft: '8px', fontSize: '0.9rem', color: '#64748b', fontWeight: 500 }}>
                          ({modalChartData.totalItems} criterios evaluados · Puntaje máx: {modalChartData.maxDomainScore} pts)
                        </span>
                      )}
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
                        title="Color por Dominio"
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

                    {totalDims > 1 && (
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
                      {isUgel ? (
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
                                isUgel
                                  ? getUgelDimensionChartOptions(modalChartData.maxDomainScore, (modalChartData as any).ugelList)
                                  : getEspecialistaDimensionChartOptions(modalChartData.maxDomainScore, (modalChartData as any).espList)
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
                              overflowX: modalChartData.labels.length > 20 ? 'auto' : 'visible',
                              position: 'relative',
                            }}
                          >
                            <div
                              style={{
                                minWidth: modalChartData.labels.length > 20 ? `${modalChartData.labels.length * 38}px` : '100%',
                                height: '500px',
                              }}
                            >
                              <Bar
                                options={
                                  isUgel
                                    ? getUgelDimensionVerticalChartOptions(modalChartData.maxDomainScore, (modalChartData as any).ugelList)
                                    : getEspecialistaDimensionVerticalChartOptions(modalChartData.maxDomainScore, (modalChartData as any).espList)
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
                          {renderDomainLevelRanges()}
                        </div>
                      </>
                    ) : (
                      <div className={styles.emptyDimensionChart}>
                        <p>No se encontraron registros evaluados para esta dimensión.</p>
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
    </>
  );
};

export default Reportes;
Reportes.Auth = PrivateRouteAdmins;
