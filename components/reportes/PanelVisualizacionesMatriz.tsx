import React, { useState, useMemo, useRef, useEffect } from 'react';
import {
  Chart as ChartJS,
  PointElement,
  LineElement,
  Filler,
  Tooltip,
  Legend,
  CategoryScale,
  LinearScale,
} from 'chart.js';
import { Line } from 'react-chartjs-2';
import { RiLoader4Line } from 'react-icons/ri';
import {
  MdRefresh,
  MdFilterList,
  MdHelpOutline,
  MdKeyboardArrowDown,
  MdKeyboardArrowUp,
  MdUnfoldMore,
  MdUnfoldLess,
  MdFullscreen,
  MdFullscreenExit,
} from 'react-icons/md';
import styles from './PanelVisualizacionesMatriz.module.css';
import { Evaluaciones, PreguntasRespuestas } from '@/features/types/types';
import { UgelMatrizComparativaRow } from '@/features/hooks/useMatrizResultados';
import GuiaRankingModal from '@/components/modals/GuiaRankingModal';
import GuiaHeatmapModal from '@/components/modals/GuiaHeatmapModal';
import GuiaBurbujasModal from '@/components/modals/GuiaBurbujasModal';
import GuiaDecisionesModal from '@/components/modals/GuiaDecisionesModal';
import CustomFilterDropdown, { FilterOption } from './CustomFilterDropdown';
import QuestionDetailPopover from './QuestionDetailPopover';

ChartJS.register(
  PointElement,
  LineElement,
  Filler,
  Tooltip,
  Legend,
  CategoryScale,
  LinearScale
);

interface PanelVisualizacionesMatrizProps {
  data: UgelMatrizComparativaRow[];
  loading: boolean;
  evaluacionEdi: Evaluaciones | null;
  evaluacionEp1: Evaluaciones | null;
  evaluacionEp2: Evaluaciones | null;
  preguntas: PreguntasRespuestas[];
  gradoName?: string;
  onReload?: () => void;
}

type TabKey =
  | 'apilado'
  | 'heatmap'
  | 'burbujas'
  | 'ranking'
  | 'lineas'
  | 'decisiones';

type EtapaKey = 'edi' | 'ep1' | 'ep2';

const COLORES_PALETA = [
  '#3f51b5',
  '#e65100',
  '#2e7d32',
  '#f9a825',
  '#6a1b9a',
  '#00838f',
  '#bf360c',
  '#4a148c',
  '#0288d1',
  '#c2185b',
  '#512da8',
  '#00796b',
  '#689f38',
  '#f57c00',
];

export const PanelVisualizacionesMatriz: React.FC<PanelVisualizacionesMatrizProps> = ({
  data = [],
  loading = false,
  evaluacionEdi,
  evaluacionEp1,
  evaluacionEp2,
  preguntas = [],
  gradoName = '',
  onReload,
}) => {
  // Pestaña activa
  const [activeTab, setActiveTab] = useState<TabKey>('decisiones');

  // Filtro de Evaluación común: 'ep1' | 'edi' | 'ep2'
  const [selectedEtapa, setSelectedEtapa] = useState<EtapaKey>(() => {
    if (evaluacionEp1) return 'ep1';
    if (evaluacionEdi) return 'edi';
    if (evaluacionEp2) return 'ep2';
    return 'ep1';
  });

  // Filtro de UGEL común: 'all' o ugel.id
  const [selectedUgel, setSelectedUgel] = useState<string>('all');

  // Filtro de Pregunta específico para Apilado: 'all' o order
  const [apiladoPregunta, setApiladoPregunta] = useState<string>('all');

  // Métrica para la pestaña Líneas: 'prev' (% Previo al Inicio) | 'aciertos' (% Aciertos)
  const [lineMetric, setLineMetric] = useState<'prev' | 'aciertos'>('prev');

  // Estado del modal de guía e interpretación del ranking
  const [isRankingModalOpen, setIsRankingModalOpen] = useState<boolean>(false);

  // Estado del modal de guía e interpretación del heatmap
  const [isHeatmapModalOpen, setIsHeatmapModalOpen] = useState<boolean>(false);

  // Estado del modal de guía e interpretación del gráfico de burbujas
  const [isBurbujasModalOpen, setIsBurbujasModalOpen] = useState<boolean>(false);

  // Estado del modal de guía e interpretación del panel de decisiones
  const [isDecisionesModalOpen, setIsDecisionesModalOpen] = useState<boolean>(false);

  // Estado para el popover interactivo de detalles de pregunta (P01, P02...)
  const [questionDetailPopover, setQuestionDetailPopover] = useState<{
    order: number;
    initialEtapa: 'edi' | 'ep1' | 'ep2';
    coords: { x: number; y: number };
  } | null>(null);

  const openQuestionDetailAt = (
    order: number,
    coords: { x: number; y: number; width?: number; height?: number }
  ) => {
    if (questionDetailPopover && questionDetailPopover.order === order) {
      setQuestionDetailPopover(null);
      return;
    }

    const popoverWidth = Math.min(440, window.innerWidth - 32);
    const originWidth = coords.width || 0;
    const originHeight = coords.height || 0;

    let left = coords.x + originWidth / 2 - popoverWidth / 2;
    if (left < 16) left = 16;
    if (left + popoverWidth > window.innerWidth - 16) {
      left = window.innerWidth - popoverWidth - 16;
    }

    let top = coords.y + originHeight + 8;
    const estimatedHeight = 420;
    if (top + estimatedHeight > window.innerHeight && coords.y - estimatedHeight > 16) {
      top = coords.y - estimatedHeight - 8;
    }
    if (top < 16) top = 16;

    setQuestionDetailPopover({
      order,
      initialEtapa: selectedEtapa,
      coords: { x: left, y: top },
    });
  };

  const handleOpenQuestionDetail = (e: React.MouseEvent, order: number) => {
    e.stopPropagation();
    const rect = e.currentTarget.getBoundingClientRect();
    openQuestionDetailAt(order, {
      x: rect.left,
      y: rect.top,
      width: rect.width,
      height: rect.height,
    });
  };

  // UGELs expandidas en la sub-vista 'porugel' de Decisiones (Master-Detail)
  const [expandedUgelIds, setExpandedUgelIds] = useState<Record<string | number, boolean>>({});

  const toggleExpandUgel = (id: string | number) => {
    setExpandedUgelIds((prev) => ({
      ...prev,
      [id]: !prev[id],
    }));
  };

  // Modo pantalla completa / vista completa
  const containerRef = useRef<HTMLDivElement>(null);
  const [isFullScreen, setIsFullScreen] = useState<boolean>(false);

  const toggleFullscreen = async () => {
    try {
      if (!isFullScreen) {
        if (containerRef.current?.requestFullscreen) {
          await containerRef.current.requestFullscreen().catch(() => {});
        }
        setIsFullScreen(true);
      } else {
        if (document.fullscreenElement) {
          await document.exitFullscreen().catch(() => {});
        }
        setIsFullScreen(false);
      }
    } catch {
      setIsFullScreen((prev) => !prev);
    }
  };

  // Sincronizar cambios de pantalla completa del navegador (por ejemplo F11 o Esc nativo)
  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullScreen(!!document.fullscreenElement);
    };
    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => {
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
    };
  }, []);

  // Escape para salir de pantalla completa de forma segura
  useEffect(() => {
    if (!isFullScreen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      // Si hay algún modal abierto, dejar que el modal maneje el Escape
      if (isHeatmapModalOpen || isBurbujasModalOpen || isRankingModalOpen || isDecisionesModalOpen) {
        return;
      }
      if (e.key === 'Escape') {
        if (document.fullscreenElement) {
          document.exitFullscreen().catch(() => {});
        }
        setIsFullScreen(false);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isFullScreen, isHeatmapModalOpen, isBurbujasModalOpen, isRankingModalOpen, isDecisionesModalOpen]);

  // UGELs seleccionadas en la pestaña Líneas (soporta multi-selección interactiva)
  const [selectedLineUgelIds, setSelectedLineUgelIds] = useState<number[]>([]);

  // Resolver cuáles UGELs están activas (por defecto, la primera UGEL)
  const activeLineUgelIds = useMemo(() => {
    if (selectedLineUgelIds.length > 0) return selectedLineUgelIds;
    return data.length > 0 ? [data[0].id] : [];
  }, [selectedLineUgelIds, data]);

  const toggleLineUgel = (id: number) => {
    setSelectedLineUgelIds((prev) => {
      const current = prev.length > 0 ? prev : data.length > 0 ? [data[0].id] : [];
      if (current.includes(id)) {
        if (current.length === 1) return current; // Mantener al menos una seleccionada
        return current.filter((x) => x !== id);
      } else {
        return [...current, id];
      }
    });
  };

  const selectAllLineUgeles = () => {
    setSelectedLineUgelIds(data.map((u) => u.id));
  };

  const selectOnlyFirstLineUgel = () => {
    if (data.length > 0) setSelectedLineUgelIds([data[0].id]);
  };

  // Helper nombres de evaluación
  const getEtapaLabel = (etapa: EtapaKey) => {
    if (etapa === 'edi') return evaluacionEdi ? `EDI: ${evaluacionEdi.nombre}` : 'Diagnóstica (EDI)';
    if (etapa === 'ep1') return evaluacionEp1 ? `EP1: ${evaluacionEp1.nombre}` : 'Progresiva 1 (EP1)';
    if (etapa === 'ep2') return evaluacionEp2 ? `EP2: ${evaluacionEp2.nombre}` : 'Progresiva 2 (EP2)';
    return String(etapa).toUpperCase();
  };

  const getEtapaShortName = (etapa: EtapaKey) => {
    if (etapa === 'edi') return 'EDI';
    if (etapa === 'ep1') return 'EP1';
    if (etapa === 'ep2') return 'EP2';
    return String(etapa);
  };

  const getOrderNum = (p: PreguntasRespuestas, fallbackIndex: number = 1): number => {
    return p.order !== undefined && p.order !== null ? Number(p.order) : fallbackIndex;
  };

  const formatQuestionCode = (order: number) => {
    return `P${order < 10 ? '0' : ''}${order}`;
  };

  // UGELs filtradas según el selector común
  const filteredUgeles = useMemo(() => {
    if (selectedUgel === 'all') return data;
    return data.filter((u) => String(u.id) === selectedUgel);
  }, [data, selectedUgel]);

  // Lista ordenada de preguntas
  const sortedPreguntas = useMemo(() => {
    return [...preguntas].sort(
      (a, b) => Number(a.order || 0) - Number(b.order || 0)
    );
  }, [preguntas]);

  // Helper para clasificar el nivel de alerta según % Previo al Inicio (Dificultad)
  const getAlertaInfo = (pct: number) => {
    if (pct >= 60) {
      return {
        label: 'Crítico',
        clase: styles.alertaCritico,
        color: '#e53935',
        dotClase: styles.dotDificil,
        badgeClase: styles.muyDificil,
        accion: 'Intervención inmediata: Taller de reforzamiento',
      };
    } else if (pct >= 50) {
      return {
        label: 'Alto',
        clase: styles.alertaAlto,
        color: '#ff8a65',
        dotClase: styles.dotDificil,
        badgeClase: styles.dificil,
        accion: 'Priorizar: Sesiones de práctica adicionales',
      };
    } else if (pct >= 40) {
      return {
        label: 'Medio',
        clase: styles.alertaMedio,
        color: '#f9a825',
        dotClase: styles.dotMedia,
        badgeClase: styles.media,
        accion: 'Monitoreo: Seguimiento personalizado',
      };
    } else {
      return {
        label: 'Bajo',
        clase: styles.alertaBajo,
        color: '#66bb6a',
        dotClase: styles.dotFacil,
        badgeClase: styles.facil,
        accion: 'Mantener: Estrategias actuales',
      };
    }
  };

  // Helper intensidad de color Heatmap
  const getHeatClass = (pct: number) => {
    if (pct <= 15) return styles.nivel0;
    if (pct <= 25) return styles.nivel1;
    if (pct <= 35) return styles.nivel2;
    if (pct <= 45) return styles.nivel3;
    if (pct <= 55) return styles.nivel4;
    if (pct <= 65) return styles.nivel5;
    return styles.nivel6;
  };

  // Helper tamaño Burbuja
  const getBubbleClass = (pct: number) => {
    if (pct <= 15) return styles.bubbleSize1;
    if (pct <= 25) return styles.bubbleSize2;
    if (pct <= 35) return styles.bubbleSize3;
    if (pct <= 45) return styles.bubbleSize4;
    if (pct <= 55) return styles.bubbleSize5;
    if (pct <= 65) return styles.bubbleSize6;
    return styles.bubbleSize7;
  };

  // Extraer estadística de una pregunta y UGEL específica
  const getPreguntaStat = (row: UgelMatrizComparativaRow, order: number, etapa: EtapaKey) => {
    const pStat = row.preguntas?.[order]?.[etapa];
    const total = pStat?.total ?? (row.totalEstudiantes?.[etapa] || 0);
    const correctas = pStat?.correctas ?? 0;
    const aciertoPct =
      pStat?.porcentaje ?? (total > 0 ? Math.round((correctas / total) * 100) : 0);
    const prevPct = total > 0 ? Math.max(0, 100 - aciertoPct) : 0;
    const prevCount = total > 0 ? Math.max(0, total - correctas) : 0;

    return {
      total,
      correctas,
      aciertoPct,
      prevPct,
      prevCount,
    };
  };

  // Configuración de niveles de logro y colores oficiales del proyecto
  const nivelConfig = useMemo(() => {
    const allNiveles =
      (data && data.length > 0 ? data[0]?.niveles : undefined) ||
      evaluacionEp2?.nivelYPuntaje ||
      evaluacionEp1?.nivelYPuntaje ||
      evaluacionEdi?.nivelYPuntaje ||
      [];

    const getLevelData = (
      matcher: (name: string) => boolean,
      defaultLabel: string,
      cssVar: string,
      defaultHex: string
    ) => {
      const found = allNiveles.find((n: any) => matcher((n.nivel || '').toLowerCase()));
      const label = found?.nivel || defaultLabel;
      let color = `var(${cssVar}, ${defaultHex})`;
      if (
        found?.color &&
        !found.color.startsWith('nivel') &&
        (found.color.startsWith('#') || found.color.startsWith('rgb'))
      ) {
        color = found.color;
      }
      return { label, color };
    };

    return {
      sat: getLevelData((n) => n.includes('satis'), 'Satisfactorio', '--satisfactorio', '#9bbb58'),
      proc: getLevelData((n) => n.includes('proc'), 'En Proceso', '--en-proceso', '#f89646'),
      ini: getLevelData((n) => n.includes('ini') && !n.includes('prev'), 'En Inicio', '--inicio', '#a64e4d'),
      prev: getLevelData((n) => n.includes('prev'), 'Previo al Inicio', '--previo-al-inicio', '#a5a5a5'),
    };
  }, [data, evaluacionEdi, evaluacionEp1, evaluacionEp2]);

  // =========================================================================
  // 1. DATA PARA GRÁFICO APILADO
  // =========================================================================
  const apiladoData = useMemo(() => {
    return filteredUgeles.map((row) => {
      // Extraer niveles globales de la UGEL para la etapa
      let sat = 0,
        proc = 0,
        ini = 0,
        prev = 0;

      row.niveles.forEach((nc) => {
        const nom = (nc.nivel || '').toLowerCase();
        const pct = nc[selectedEtapa]?.porcentaje || 0;
        if (nom.includes('satis')) sat = pct;
        else if (nom.includes('proc')) proc = pct;
        else if (nom.includes('ini') && !nom.includes('prev')) ini = pct;
        else if (nom.includes('prev')) prev = pct;
      });

      // Si se seleccionó una pregunta específica, calculamos las proporciones para esa pregunta
      if (apiladoPregunta !== 'all') {
        const order = Number(apiladoPregunta);
        const { total, aciertoPct, prevPct } = getPreguntaStat(row, order, selectedEtapa);

        if (total > 0) {
          const sumLogrado = sat + proc || 1;
          const ratioSat = sat / sumLogrado;
          const qSat = Math.round(aciertoPct * ratioSat);
          const qProc = Math.max(0, aciertoPct - qSat);

          const sumNoLogrado = ini + prev || 1;
          const ratioPrev = prev / sumNoLogrado;
          const qPrev = Math.round(prevPct * ratioPrev);
          const qIni = Math.max(0, prevPct - qPrev);

          sat = qSat;
          proc = qProc;
          ini = qIni;
          prev = qPrev;
        }
      }

      const totalSum = sat + proc + ini + prev || 1;
      return {
        ugel: row.nombre,
        sat,
        proc,
        ini,
        prev,
        pSat: (sat / totalSum) * 100,
        pProc: (proc / totalSum) * 100,
        pIni: (ini / totalSum) * 100,
        pPrev: (prev / totalSum) * 100,
      };
    }).sort((a, b) => b.sat - a.sat);
  }, [filteredUgeles, selectedEtapa, apiladoPregunta]);

  // =========================================================================
  // 2. DATA PARA RANKING
  // =========================================================================
  const rankingData = useMemo(() => {
    return filteredUgeles.map((row) => {
      let maxPct = 0;
      let maxPregunta = 1;
      let sumPrev = 0;
      let count = 0;

      sortedPreguntas.forEach((p) => {
        const order = Number(p.order || 1);
        const stat = getPreguntaStat(row, order, selectedEtapa);
        if (stat.total > 0) {
          sumPrev += stat.prevPct;
          count++;
          if (stat.prevPct > maxPct) {
            maxPct = stat.prevPct;
            maxPregunta = order;
          }
        }
      });

      const prom = count > 0 ? Math.round(sumPrev / count) : 0;
      return {
        ugel: row.nombre,
        maxPct,
        maxPregunta,
        prom,
      };
    }).sort((a, b) => b.maxPct - a.maxPct);
  }, [filteredUgeles, sortedPreguntas, selectedEtapa]);

  // =========================================================================
  // 3. DATA PARA DECISIONES
  // =========================================================================
  const decisionData = useMemo(() => {
    const list: Array<{
      ugel: string;
      pregunta: number;
      prevPct: number;
      estudiantes: number;
      totalEstudiantes: number;
    }> = [];

    filteredUgeles.forEach((row) => {
      sortedPreguntas.forEach((p) => {
        const order = Number(p.order || 1);
        const stat = getPreguntaStat(row, order, selectedEtapa);
        if (stat.total > 0) {
          list.push({
            ugel: row.nombre,
            pregunta: order,
            prevPct: stat.prevPct,
            estudiantes: stat.prevCount,
            totalEstudiantes: stat.total,
          });
        }
      });
    });

    list.sort((a, b) => b.prevPct - a.prevPct);

    const totalCritico = list.filter((d) => d.prevPct >= 60).length;
    const totalAlto = list.filter((d) => d.prevPct >= 50 && d.prevPct < 60).length;
    const totalMedio = list.filter((d) => d.prevPct >= 40 && d.prevPct < 50).length;
    const totalBajo = list.filter((d) => d.prevPct < 40).length;
    const avgPrev =
      list.length > 0
        ? Math.round(list.reduce((acc, d) => acc + d.prevPct, 0) / list.length)
        : 0;

    return {
      list,
      totalCritico,
      totalAlto,
      totalMedio,
      totalBajo,
      avgPrev,
    };
  }, [filteredUgeles, sortedPreguntas, selectedEtapa]);

  // Decisiones agrupadas por UGEL (para vista 'porugel' - Tabla Ejecutiva Master-Detail)
  const decisionPorUgelData = useMemo(() => {
    const list = filteredUgeles.map((row) => {
      const preguntasUgel = sortedPreguntas
        .map((p) => {
          const order = Number(p.order || 1);
          const stat = getPreguntaStat(row, order, selectedEtapa);
          return {
            pregunta: order,
            prevPct: stat.prevPct,
            estudiantes: stat.prevCount,
            totalEstudiantes: stat.total,
          };
        })
        .filter((item) => item.totalEstudiantes > 0)
        .sort((a, b) => b.prevPct - a.prevPct);

      const criticas = preguntasUgel.filter((d) => d.prevPct >= 60).length;
      const altas = preguntasUgel.filter((d) => d.prevPct >= 50 && d.prevPct < 60).length;
      const medias = preguntasUgel.filter((d) => d.prevPct >= 40 && d.prevPct < 50).length;
      const bajas = preguntasUgel.filter((d) => d.prevPct < 40).length;

      const borderLeftColor =
        criticas > 0
          ? '#e53935'
          : altas > 0
          ? '#ff8a65'
          : medias > 0
          ? '#f9a825'
          : '#66bb6a';

      // Ítem más crítico
      const topPregunta = preguntasUgel[0] || null;

      // Promedio general de rezago de la UGEL
      const avgPrev =
        preguntasUgel.length > 0
          ? Math.round(
              preguntasUgel.reduce((acc, p) => acc + p.prevPct, 0) / preguntasUgel.length
            )
          : 0;

      // Nivel de riesgo consolidado de la UGEL
      const nivelRiesgo =
        criticas > 0
          ? {
              label: 'Crítico',
              color: '#e53935',
              bg: '#fee2e2',
              text: '#991b1b',
              icon: '🔴',
              accion: 'Intervención inmediata: Taller presencial focalizado',
            }
          : altas > 0
          ? {
              label: 'Alto',
              color: '#ff8a65',
              bg: '#ffedd5',
              text: '#9a3412',
              icon: '🟠',
              accion: 'Priorizar: Sesiones de práctica adicionales',
            }
          : medias > 0
          ? {
              label: 'Medio',
              color: '#f9a825',
              bg: '#fef9c3',
              text: '#854d0e',
              icon: '🟡',
              accion: 'Monitoreo: Seguimiento y retroalimentación',
            }
          : {
              label: 'Estable',
              color: '#16a34a',
              bg: '#dcfce7',
              text: '#166534',
              icon: '🟢',
              accion: 'Mantener: Estrategias pedagógicas actuales',
            };

      const totalEstudiantesUgel =
        row.totalEstudiantes?.[selectedEtapa] || (topPregunta?.totalEstudiantes ?? 0);

      return {
        id: row.id,
        ugel: row.nombre,
        preguntas: preguntasUgel,
        totalPreguntas: preguntasUgel.length,
        criticas,
        altas,
        medias,
        bajas,
        borderLeftColor,
        topPregunta,
        avgPrev,
        nivelRiesgo,
        totalEstudiantesUgel,
      };
    });

    // Ordenar por severidad de riesgo pedagógico (UGELs con mayor criticidad primero)
    return list.sort((a, b) => {
      if (b.criticas !== a.criticas) return b.criticas - a.criticas;
      if (b.altas !== a.altas) return b.altas - a.altas;
      const aMax = a.topPregunta?.prevPct || 0;
      const bMax = b.topPregunta?.prevPct || 0;
      return bMax - aMax;
    });
  }, [filteredUgeles, sortedPreguntas, selectedEtapa]);

  // Verificar si todas las UGELs están expandidas
  const allUgelsAreExpanded = useMemo(() => {
    if (decisionPorUgelData.length === 0) return false;
    return decisionPorUgelData.every((u) => !!expandedUgelIds[u.id]);
  }, [decisionPorUgelData, expandedUgelIds]);

  // Alternar entre expandir todas y colapsar todas
  const toggleAllUgels = () => {
    if (allUgelsAreExpanded) {
      setExpandedUgelIds({});
    } else {
      const allExp: Record<string | number, boolean> = {};
      decisionPorUgelData.forEach((u) => {
        allExp[u.id] = true;
      });
      setExpandedUgelIds(allExp);
    }
  };

  // =========================================================================
  // 4. DATA PARA LÍNEAS (CHART.JS) - Multi-UGEL vs Promedio Regional Dinámico
  // =========================================================================
  const lineChartInfo = useMemo(() => {
    const labels = sortedPreguntas.map((p, idx) => formatQuestionCode(getOrderNum(p, idx + 1)));

    // Calcular Promedio Regional para cada pregunta
    const regionalDataPoints = sortedPreguntas.map((p, pIdx) => {
      const order = getOrderNum(p, pIdx + 1);
      let sumIncorrectas = 0;
      let sumCorrectas = 0;
      let sumTotal = 0;
      data.forEach((row) => {
        const stat = getPreguntaStat(row, order, selectedEtapa);
        sumIncorrectas += stat.prevCount;
        sumCorrectas += stat.correctas;
        sumTotal += stat.total;
      });
      if (lineMetric === 'prev') {
        return sumTotal > 0 ? Math.round((sumIncorrectas / sumTotal) * 100) : 0;
      } else {
        return sumTotal > 0 ? Math.round((sumCorrectas / sumTotal) * 100) : 0;
      }
    });

    // Datasets para cada UGEL seleccionada
    const ugelDatasets = activeLineUgelIds.map((uId) => {
      const row = data.find((u) => u.id === uId);
      const uIdx = data.findIndex((u) => u.id === uId);
      const color = COLORES_PALETA[uIdx >= 0 ? uIdx % COLORES_PALETA.length : 0];

      const dataPoints = sortedPreguntas.map((p, pIdx) => {
        const order = getOrderNum(p, pIdx + 1);
        const stat = row ? getPreguntaStat(row, order, selectedEtapa) : { prevPct: 0, aciertoPct: 0 };
        return lineMetric === 'prev' ? stat.prevPct : stat.aciertoPct;
      });

      return {
        label: row ? row.nombre : `UGEL ${uId}`,
        data: dataPoints,
        borderColor: color,
        backgroundColor: color + '15',
        borderWidth: activeLineUgelIds.length === 1 ? 3.5 : 2.5,
        pointRadius: activeLineUgelIds.length <= 3 ? 5 : 3.5,
        pointHoverRadius: 7,
        pointBackgroundColor: color,
        pointBorderColor: '#ffffff',
        pointBorderWidth: 1.5,
        tension: 0.3,
        fill: false,
      };
    });

    // Dataset Promedio Regional (Línea Base)
    const regionalDataset = {
      label: 'Promedio Regional (Línea Base)',
      data: regionalDataPoints,
      borderColor: '#64748b', // Pizarra neutral
      backgroundColor: 'transparent',
      borderWidth: 2.5,
      borderDash: [6, 4], // Punteada
      pointRadius: 4,
      pointHoverRadius: 6,
      pointBackgroundColor: '#64748b',
      pointBorderColor: '#ffffff',
      pointBorderWidth: 1.5,
      tension: 0.3,
      fill: false,
    };

    const datasets = [...ugelDatasets, regionalDataset];

    // Cálculo dinámico del máximo en el eje Y según las líneas mostradas
    let maxPointVal = 0;
    datasets.forEach((ds) => {
      ds.data.forEach((val: number) => {
        if (typeof val === 'number' && val > maxPointVal) maxPointVal = val;
      });
    });
    // Escala dinámica del eje Y: añade margen de 6-8%, redondea a la decena más cercana, mínimo 25% y máximo 100%
    const dynamicYMax = Math.min(100, Math.max(25, Math.ceil((maxPointVal + 7) / 10) * 10));

    // Estadísticas para todas las UGELs
    const stats = data.map((row, idx) => {
      let sumPrev = 0;
      let sumAcierto = 0;
      let count = 0;

      let maxPrev = 0;
      let maxPrevPregunta = 1;
      let minPrev = 100;
      let minPrevPregunta = 1;

      let maxAcierto = 0;
      let maxAciertoPregunta = 1;
      let minAcierto = 100;
      let minAciertoPregunta = 1;

      sortedPreguntas.forEach((p, pIdx) => {
        const order = getOrderNum(p, pIdx + 1);
        const stat = getPreguntaStat(row, order, selectedEtapa);
        if (stat.total > 0) {
          sumPrev += stat.prevPct;
          sumAcierto += stat.aciertoPct;
          count++;

          if (stat.prevPct > maxPrev) {
            maxPrev = stat.prevPct;
            maxPrevPregunta = order;
          }
          if (stat.prevPct < minPrev) {
            minPrev = stat.prevPct;
            minPrevPregunta = order;
          }

          if (stat.aciertoPct > maxAcierto) {
            maxAcierto = stat.aciertoPct;
            maxAciertoPregunta = order;
          }
          if (stat.aciertoPct < minAcierto) {
            minAcierto = stat.aciertoPct;
            minAciertoPregunta = order;
          }
        }
      });

      return {
        id: row.id,
        ugel: row.nombre,
        promPrev: count > 0 ? Math.round(sumPrev / count) : 0,
        maxPrev,
        maxPrevPregunta,
        minPrev: count > 0 ? minPrev : 0,
        minPrevPregunta,

        promAcierto: count > 0 ? Math.round(sumAcierto / count) : 0,
        maxAcierto,
        maxAciertoPregunta,
        minAcierto: count > 0 ? minAcierto : 0,
        minAciertoPregunta,

        color: COLORES_PALETA[idx % COLORES_PALETA.length],
      };
    });

    const regPromPrev =
      stats.length > 0
        ? Math.round(stats.reduce((acc, s) => acc + s.promPrev, 0) / stats.length)
        : 0;
    const regPromAcierto =
      stats.length > 0
        ? Math.round(stats.reduce((acc, s) => acc + s.promAcierto, 0) / stats.length)
        : 0;

    return {
      chartData: { labels, datasets },
      stats,
      dynamicYMax,
      regPromPrev,
      regPromAcierto,
    };
  }, [sortedPreguntas, data, activeLineUgelIds, selectedEtapa, lineMetric]);

  // =========================================================================
  // OPCIONES PARA DROPDOWNS CUSTOM
  // =========================================================================
  const etapaOptions: FilterOption[] = useMemo(
    () => [
      {
        value: 'edi',
        label: 'EDI · Diagnóstica',
        badge: evaluacionEdi ? '✓ Asignada' : 'Sin asignar',
        badgeType: evaluacionEdi ? 'success' : 'neutral',
      },
      {
        value: 'ep1',
        label: 'EP1 · Progresiva 1',
        badge: evaluacionEp1 ? '✓ Asignada' : 'Sin asignar',
        badgeType: evaluacionEp1 ? 'success' : 'neutral',
      },
      {
        value: 'ep2',
        label: 'EP2 · Progresiva 2',
        badge: evaluacionEp2 ? '✓ Asignada' : 'Sin asignar',
        badgeType: evaluacionEp2 ? 'success' : 'neutral',
      },
    ],
    [evaluacionEdi, evaluacionEp1, evaluacionEp2]
  );

  const ugelOptions: FilterOption[] = useMemo(
    () => [
      {
        value: 'all',
        label: `Todas las UGEL (${data.length})`,
      },
      ...data.map((u) => ({
        value: String(u.id),
        label: u.nombre,
      })),
    ],
    [data]
  );

  const preguntaOptions: FilterOption[] = useMemo(
    () => [
      {
        value: 'all',
        label: 'Todas las preguntas (Nivel Global)',
      },
      ...sortedPreguntas.map((p, pIdx) => {
        const order = getOrderNum(p, pIdx + 1);
        return {
          value: String(order),
          label: `Pregunta ${formatQuestionCode(order)}`,
        };
      }),
    ],
    [sortedPreguntas]
  );

  return (
    <div
      ref={containerRef}
      className={`${styles.vizContainer} ${isFullScreen ? styles.vizContainerFullscreen : ''}`}
    >
      {/* Cabecera del Panel */}
      <div className={styles.vizHeader}>
        <div className={styles.titleArea}>
          <h2>Visualizaciones de Dificultad y Toma de Decisiones</h2>
          <p className={styles.subtitle}>
            Análisis pedagógico comparativo de ítems por UGEL · {gradoName}
          </p>
        </div>

        <div className={styles.headerActions}>
          {onReload && (
            <button
              type="button"
              onClick={onReload}
              className={styles.reloadBtn}
              title="Recalcular visualizaciones"
            >
              <MdRefresh className={loading ? 'animate-spin' : ''} style={{ fontSize: '1rem' }} />
              <span>Recalcular Datos</span>
            </button>
          )}

          <button
            type="button"
            onClick={toggleFullscreen}
            className={`${styles.fullscreenBtn} ${isFullScreen ? styles.fullscreenBtnActive : ''}`}
            title={isFullScreen ? 'Salir de vista completa (Esc)' : 'Vista completa (Pantalla completa)'}
            aria-label={isFullScreen ? 'Salir de vista completa' : 'Vista completa'}
          >
            {isFullScreen ? (
              <MdFullscreenExit className={styles.fullscreenIcon} />
            ) : (
              <MdFullscreen className={styles.fullscreenIcon} />
            )}
            <span className={styles.fullscreenBtnText}>
              {isFullScreen ? 'Salir' : 'Vista Completa'}
            </span>
          </button>
        </div>
      </div>

      {/* Pestañas idénticas a la captura */}
      <div className={styles.tabsBar}>
        <button
          type="button"
          className={`${styles.tabBtn} ${activeTab === 'apilado' ? styles.tabBtnActive : ''}`}
          onClick={() => setActiveTab('apilado')}
        >
          <span>📊</span>
          <span>Apilado</span>
        </button>

        <button
          type="button"
          className={`${styles.tabBtn} ${activeTab === 'heatmap' ? styles.tabBtnActive : ''}`}
          onClick={() => setActiveTab('heatmap')}
        >
          <span>🔥</span>
          <span>Heatmap</span>
        </button>

        <button
          type="button"
          className={`${styles.tabBtn} ${activeTab === 'burbujas' ? styles.tabBtnActive : ''}`}
          onClick={() => setActiveTab('burbujas')}
        >
          <span>🫧</span>
          <span>Burbujas</span>
        </button>

        <button
          type="button"
          className={`${styles.tabBtn} ${activeTab === 'ranking' ? styles.tabBtnActive : ''}`}
          onClick={() => setActiveTab('ranking')}
        >
          <span>🏆</span>
          <span>Ranking</span>
        </button>

        <button
          type="button"
          className={`${styles.tabBtn} ${activeTab === 'lineas' ? styles.tabBtnActive : ''}`}
          onClick={() => setActiveTab('lineas')}
        >
          <span>📈</span>
          <span>Líneas</span>
        </button>

        <button
          type="button"
          className={`${styles.tabBtn} ${activeTab === 'decisiones' ? styles.tabBtnActive : ''}`}
          onClick={() => setActiveTab('decisiones')}
        >
          <span>📋</span>
          <span>Decisiones</span>
        </button>
      </div>

      {/* Barra de Filtros Interna con Dropdowns Custom */}
      <div className={styles.vizFilters}>
        {/* Selector de Evaluación Custom */}
        <CustomFilterDropdown
          label="Evaluación:"
          icon="📝"
          value={selectedEtapa}
          options={etapaOptions}
          onChange={(val) => setSelectedEtapa(val as EtapaKey)}
          minWidth={195}
        />

        {/* Selector de UGEL Custom */}
        <CustomFilterDropdown
          label="UGEL:"
          icon="📍"
          value={selectedUgel}
          options={ugelOptions}
          onChange={(val) => setSelectedUgel(val)}
          showSearch={data.length > 6}
          minWidth={210}
        />

        {/* Selector de Pregunta Custom (Solo en Apilado) */}
        {activeTab === 'apilado' && (
          <CustomFilterDropdown
            label="Pregunta:"
            icon="❓"
            value={apiladoPregunta}
            options={preguntaOptions}
            onChange={(val) => setApiladoPregunta(val)}
            showSearch={sortedPreguntas.length > 6}
            minWidth={230}
          />
        )}

        <div className={styles.infoBadge}>
          {getEtapaShortName(selectedEtapa)} ·{' '}
          {selectedUgel === 'all'
            ? 'Todas las UGEL'
            : data.find((u) => String(u.id) === selectedUgel)?.nombre || 'UGEL Seleccionada'}
        </div>
      </div>

      {/* Área con scroll para el contenido de los gráficos y tablas */}
      <div className={styles.vizScrollArea}>
        {loading ? (
        <div className={styles.loadingBox}>
          <RiLoader4Line className="animate-spin text-3xl" />
          <span>Calculando visualizaciones pedagógicas...</span>
        </div>
      ) : data.length === 0 ? (
        <div className="py-12 text-center text-slate-500 text-sm">
          No hay evaluaciones asignadas o resultados para este grado y categoría.
        </div>
      ) : (
        <>
          {/* ========================================================================= */}
          {/* TAB 1: 📊 APILADO */}
          {/* ========================================================================= */}
          {activeTab === 'apilado' && (
            <div>
              <div className={styles.chartGrid}>
                {apiladoData.map((d) => (
                  <div key={d.ugel} className={styles.chartRow}>
                    <div className={styles.label} title={d.ugel}>
                      {d.ugel}
                    </div>
                    <div className={styles.barGroup}>
                      <div
                        className={`${styles.bar} ${styles.barSat}`}
                        style={{ width: `${d.pSat}%`, backgroundColor: nivelConfig.sat.color }}
                        title={`${nivelConfig.sat.label}: ${d.sat}%`}
                      >
                        {d.sat >= 6 ? `${d.sat}%` : ''}
                      </div>
                      <div
                        className={`${styles.bar} ${styles.barProc}`}
                        style={{ width: `${d.pProc}%`, backgroundColor: nivelConfig.proc.color }}
                        title={`${nivelConfig.proc.label}: ${d.proc}%`}
                      >
                        {d.proc >= 6 ? `${d.proc}%` : ''}
                      </div>
                      <div
                        className={`${styles.bar} ${styles.barIni}`}
                        style={{ width: `${d.pIni}%`, backgroundColor: nivelConfig.ini.color }}
                        title={`${nivelConfig.ini.label}: ${d.ini}%`}
                      >
                        {d.ini >= 6 ? `${d.ini}%` : ''}
                      </div>
                      <div
                        className={`${styles.bar} ${styles.barPrev}`}
                        style={{ width: `${d.pPrev}%`, backgroundColor: nivelConfig.prev.color }}
                        title={`${nivelConfig.prev.label}: ${d.prev}%`}
                      >
                        {d.prev >= 6 ? `${d.prev}%` : ''}
                      </div>
                    </div>
                    <div className={styles.valueGroup}>
                      <span className={styles.vSat} style={{ color: nivelConfig.sat.color }}>
                        {d.sat}%
                      </span>
                      <span className={styles.vProc} style={{ color: nivelConfig.proc.color }}>
                        {d.proc}%
                      </span>
                      <span className={styles.vIni} style={{ color: nivelConfig.ini.color }}>
                        {d.ini}%
                      </span>
                      <span className={styles.vPrev} style={{ color: nivelConfig.prev.color }}>
                        {d.prev}%
                      </span>
                    </div>
                  </div>
                ))}
              </div>

              {/* Leyenda */}
              <div className={styles.legend}>
                <div className={styles.legendItem}>
                  <div className={styles.legendColor} style={{ background: nivelConfig.sat.color }} />
                  {nivelConfig.sat.label}
                </div>
                <div className={styles.legendItem}>
                  <div className={styles.legendColor} style={{ background: nivelConfig.proc.color }} />
                  {nivelConfig.proc.label}
                </div>
                <div className={styles.legendItem}>
                  <div className={styles.legendColor} style={{ background: nivelConfig.ini.color }} />
                  {nivelConfig.ini.label}
                </div>
                <div className={styles.legendItem}>
                  <div className={styles.legendColor} style={{ background: nivelConfig.prev.color }} />
                  {nivelConfig.prev.label}
                </div>
              </div>
            </div>
          )}

          {/* ========================================================================= */}
          {/* TAB 2: 🔥 HEATMAP */}
          {/* ========================================================================= */}
          {activeTab === 'heatmap' && (
            <div>
              {/* Encabezado con Botón de Interpretación Modal */}
              <div className={styles.tabHeaderWithAction}>
                <div className={styles.tabHeaderTitleGroup}>
                  <h3 className={styles.tabSectionTitle}>
                    🔥 Mapa de Calor Regional por Pregunta (Heatmap)
                  </h3>
                  <p className={styles.tabSectionSubtitle}>
                    Porcentaje de estudiantes evaluados que no lograron resolver cada pregunta (% de no acierto / dificultad)
                  </p>
                </div>
                <button
                  type="button"
                  className={styles.infoHelpBtn}
                  onClick={() => setIsHeatmapModalOpen(true)}
                  title="¿En qué consiste este mapa de calor? Haz clic para ver la guía metodológica y de interpretación"
                >
                  <MdHelpOutline className={styles.infoHelpIcon} />
                  <span>¿Cómo interpretar este Heatmap?</span>
                </button>
              </div>

              <div className={styles.heatmapContainer}>
                <div
                  className={styles.heatmapGrid}
                  style={{
                    gridTemplateColumns: `140px repeat(${sortedPreguntas.length}, minmax(44px, 1fr))`,
                  }}
                >
                  {/* Fila de cabecera */}
                  <div className={`${styles.heatmapHeader} ${styles.heatmapHeaderUgel}`}>
                    UGEL
                  </div>
                  {sortedPreguntas.map((p, pIdx) => {
                    const order = getOrderNum(p, pIdx + 1);
                    return (
                      <div
                        key={order}
                        className={`${styles.heatmapHeader} ${styles.heatmapHeaderPregunta} ${styles.interactiveHeader}`}
                        onClick={(e) => handleOpenQuestionDetail(e, order)}
                        title={`Haz clic para ver la pregunta y actuación pedagógica de ${formatQuestionCode(order)}`}
                      >
                        {formatQuestionCode(order)}
                      </div>
                    );
                  })}

                  {/* Celdas por UGEL */}
                  {filteredUgeles.map((row) => (
                    <React.Fragment key={row.id}>
                      <div className={`${styles.heatmapCell} ${styles.heatmapCellUgel}`}>
                        {row.nombre}
                      </div>
                      {sortedPreguntas.map((p) => {
                        const order = Number(p.order || 1);
                        const stat = getPreguntaStat(row, order, selectedEtapa);
                        const heatCls = getHeatClass(stat.prevPct);
                        return (
                          <div
                            key={order}
                            className={`${styles.heatmapCell} ${heatCls}`}
                            onClick={(e) => handleOpenQuestionDetail(e, order)}
                            title={`${row.nombre} · ${formatQuestionCode(order)}: ${stat.prevPct}% de no acierto (${stat.prevCount} de ${stat.total} estudiantes evaluados fallaron esta pregunta). Haz clic para ver detalles del ítem.`}
                          >
                            {stat.total > 0 ? `${stat.prevPct}%` : '-'}
                          </div>
                        );
                      })}
                    </React.Fragment>
                  ))}
                </div>
              </div>

              {/* Leyenda Heatmap */}
              <div className={styles.legend}>
                <div className={styles.legendItem}>
                  <div className={styles.legendColor} style={{ background: '#2e7d32' }} />
                  ≤15%
                </div>
                <div className={styles.legendItem}>
                  <div className={styles.legendColor} style={{ background: '#66bb6a' }} />
                  16-25%
                </div>
                <div className={styles.legendItem}>
                  <div className={styles.legendColor} style={{ background: '#aed581' }} />
                  26-35%
                </div>
                <div className={styles.legendItem}>
                  <div className={styles.legendColor} style={{ background: '#fff9c4' }} />
                  36-45%
                </div>
                <div className={styles.legendItem}>
                  <div className={styles.legendColor} style={{ background: '#ffcc80' }} />
                  46-55%
                </div>
                <div className={styles.legendItem}>
                  <div className={styles.legendColor} style={{ background: '#ff8a65' }} />
                  56-65%
                </div>
                <div className={styles.legendItem}>
                  <div className={styles.legendColor} style={{ background: '#e53935' }} />
                  &gt;65%
                </div>
                <span className={styles.legendNotice}>
                  🔥 % de estudiantes evaluados que fallaron la pregunta (a mayor %, mayor dificultad pedagógica)
                </span>
                <button
                  type="button"
                  className={styles.legendLinkBtn}
                  onClick={() => setIsHeatmapModalOpen(true)}
                  title="Ver explicación completa del Mapa de Calor"
                >
                  <MdHelpOutline />
                  <span>Ver guía completa</span>
                </button>
              </div>
            </div>
          )}

          {/* ========================================================================= */}
          {/* TAB 3: 🫧 BURBUJAS */}
          {/* ========================================================================= */}
          {activeTab === 'burbujas' && (
            <div>
              {/* Encabezado con Botón de Interpretación Modal */}
              <div className={styles.tabHeaderWithAction}>
                <div className={styles.tabHeaderTitleGroup}>
                  <h3 className={styles.tabSectionTitle}>
                    🫧 Matriz de Burbujas de Rezago Pedagógico
                  </h3>
                  <p className={styles.tabSectionSubtitle}>
                    Visualización de criticidad por tamaño de impacto y escala cromática según % en Previo al Inicio
                  </p>
                </div>
                <button
                  type="button"
                  className={styles.infoHelpBtn}
                  onClick={() => setIsBurbujasModalOpen(true)}
                  title="¿En qué consiste este gráfico de burbujas? Haz clic para ver la guía metodológica y de interpretación"
                >
                  <MdHelpOutline className={styles.infoHelpIcon} />
                  <span>¿Cómo interpretar este gráfico?</span>
                </button>
              </div>

              <div className={styles.bubbleContainer}>
                <div
                  className={styles.bubbleGrid}
                  style={{
                    gridTemplateColumns: `140px repeat(${sortedPreguntas.length}, minmax(50px, 1fr))`,
                  }}
                >
                  {/* Fila de cabecera */}
                  <div className={`${styles.bubbleHeader} ${styles.bubbleHeaderUgel}`}>
                    UGEL
                  </div>
                  {sortedPreguntas.map((p, pIdx) => {
                    const order = getOrderNum(p, pIdx + 1);
                    return (
                      <div
                        key={order}
                        className={`${styles.bubbleHeader} ${styles.bubbleHeaderPregunta} ${styles.interactiveHeader}`}
                        onClick={(e) => handleOpenQuestionDetail(e, order)}
                        title={`Haz clic para ver la pregunta y actuación pedagógica de ${formatQuestionCode(order)}`}
                      >
                        {formatQuestionCode(order)}
                      </div>
                    );
                  })}

                  {/* Celdas por UGEL */}
                  {filteredUgeles.map((row) => (
                    <React.Fragment key={row.id}>
                      <div className={`${styles.bubbleCell} ${styles.bubbleCellUgel}`}>
                        {row.nombre}
                      </div>
                      {sortedPreguntas.map((p) => {
                        const order = Number(p.order || 1);
                        const stat = getPreguntaStat(row, order, selectedEtapa);
                        const bubbleCls = getBubbleClass(stat.prevPct);
                        return (
                          <div
                            key={order}
                            className={styles.bubbleCellWrapper}
                            onClick={(e) => handleOpenQuestionDetail(e, order)}
                            style={{ cursor: 'pointer' }}
                          >
                            {stat.total > 0 ? (
                              <div
                                className={`${styles.bubbleCell} ${bubbleCls}`}
                                title={`${row.nombre} · ${formatQuestionCode(order)}: ${stat.prevPct}% en Previo al Inicio. Haz clic para ver detalles del ítem.`}
                              >
                                {stat.prevPct}%
                              </div>
                            ) : (
                              <span className="text-slate-300 text-xs">-</span>
                            )}
                          </div>
                        );
                      })}
                    </React.Fragment>
                  ))}
                </div>
              </div>

              {/* Leyenda Burbujas */}
              <div className={styles.legend}>
                <span className="font-semibold text-indigo-900">Tamaño y Color de Burbuja:</span>
                <div className={styles.legendItem}>
                  <div
                    className={styles.legendColor}
                    style={{ background: '#2e7d32', width: 10, height: 10, borderRadius: '50%' }}
                  />
                  ≤15%
                </div>
                <div className={styles.legendItem}>
                  <div
                    className={styles.legendColor}
                    style={{ background: '#ffcc80', width: 14, height: 14, borderRadius: '50%' }}
                  />
                  46-55%
                </div>
                <div className={styles.legendItem}>
                  <div
                    className={styles.legendColor}
                    style={{ background: '#e53935', width: 18, height: 18, borderRadius: '50%' }}
                  />
                  &gt;65%
                </div>
                <span className={styles.legendNotice}>
                  🫧 Círculos más grandes representan mayor rezago de estudiantes en esa pregunta
                </span>
                <button
                  type="button"
                  className={styles.legendLinkBtn}
                  onClick={() => setIsBurbujasModalOpen(true)}
                  title="Ver explicación completa del Gráfico de Burbujas"
                >
                  <MdHelpOutline />
                  <span>Ver guía completa</span>
                </button>
              </div>
            </div>
          )}

          {/* ========================================================================= */}
          {/* TAB 4: 🏆 RANKING */}
          {/* ========================================================================= */}
          {activeTab === 'ranking' && (
            <div>
              {/* Encabezado con Botón de Interpretación Modal */}
              <div className={styles.tabHeaderWithAction}>
                <div className={styles.tabHeaderTitleGroup}>
                  <h3 className={styles.tabSectionTitle}>
                    🏆 Ranking Regional de Criticidad y Rezago Pedagógico
                  </h3>
                  <p className={styles.tabSectionSubtitle}>
                    Priorización de UGELs según el porcentaje máximo de estudiantes en Previo al Inicio
                  </p>
                </div>
                <button
                  type="button"
                  className={styles.infoHelpBtn}
                  onClick={() => setIsRankingModalOpen(true)}
                  title="¿En qué consiste este ranking? Haz clic para ver la guía metodológica y de interpretación"
                >
                  <MdHelpOutline className={styles.infoHelpIcon} />
                  <span>¿Cómo interpretar este ranking?</span>
                </button>
              </div>

              <div className={styles.rankingGrid}>
                {rankingData.map((d, idx) => {
                  const alerta = getAlertaInfo(d.maxPct);
                  const position = `#${idx + 1}`;
                  return (
                    <div key={d.ugel} className={styles.rankingRow}>
                      <div className={styles.rankMedal}>{position}</div>
                      <div className={styles.rankingUgelName} title={d.ugel}>
                        {d.ugel}
                      </div>
                      <div
                        className={`${styles.preguntaBadge} ${alerta.badgeClase} ${
                          questionDetailPopover?.order === d.maxPregunta ? styles.preguntaBadgeActive : ''
                        }`}
                        onClick={(e) => handleOpenQuestionDetail(e, d.maxPregunta)}
                        title={`Pregunta P${
                          d.maxPregunta < 10 ? `0${d.maxPregunta}` : d.maxPregunta
                        }: Haz clic para ver ítem pedagógico`}
                        role="button"
                        tabIndex={0}
                      >
                        P{d.maxPregunta < 10 ? `0${d.maxPregunta}` : d.maxPregunta}
                      </div>
                      <div className={styles.barMini}>
                        <div
                          className={styles.fillBar}
                          style={{
                            width: `${d.maxPct}%`,
                            backgroundColor: alerta.color,
                          }}
                        />
                      </div>
                      <div
                        className={styles.pctValue}
                        style={{ color: alerta.color }}
                      >
                        {d.maxPct}%
                      </div>
                      <div className={styles.promStat}>Prom: {d.prom}%</div>
                    </div>
                  );
                })}
              </div>

              {/* Leyenda Ranking */}
              <div className={styles.legend}>
                <div className={styles.legendItem}>
                  <span className="badge px-2 py-0.5 rounded text-white text-xs bg-[#e53935]">
                    Muy Difícil (&gt;65%)
                  </span>
                </div>
                <div className={styles.legendItem}>
                  <span className="badge px-2 py-0.5 rounded text-white text-xs bg-[#ff8a65]">
                    Difícil (50-65%)
                  </span>
                </div>
                <div className={styles.legendItem}>
                  <span className="badge px-2 py-0.5 rounded text-slate-800 text-xs bg-[#f9a825]">
                    Media (40-49%)
                  </span>
                </div>
                <div className={styles.legendItem}>
                  <span className="badge px-2 py-0.5 rounded text-white text-xs bg-[#66bb6a]">
                    Fácil (&lt;40%)
                  </span>
                </div>
                <span className={styles.legendNotice}>
                  Muestra la pregunta más crítica identificada por cada UGEL
                </span>
                <button
                  type="button"
                  className={styles.legendLinkBtn}
                  onClick={() => setIsRankingModalOpen(true)}
                  title="Ver explicación completa del ranking"
                >
                  <MdHelpOutline />
                  <span>Ver guía completa</span>
                </button>
              </div>
            </div>
          )}

          {/* ========================================================================= */}
          {/* TAB 5: 📈 LÍNEAS */}
          {/* ========================================================================= */}
          {activeTab === 'lineas' && (
            <div>
              {/* Selector de Métrica para Líneas */}
              <div className="flex items-center justify-between flex-wrap gap-2 mb-3">
                <div className={styles.viewToggle} style={{ margin: 0 }}>
                  <button
                    type="button"
                    className={`${styles.viewToggleBtn} ${
                      lineMetric === 'prev' ? styles.viewToggleBtnActive : ''
                    }`}
                    onClick={() => setLineMetric('prev')}
                  >
                    📉 % Previo al Inicio (Dificultad)
                  </button>
                  <button
                    type="button"
                    className={`${styles.viewToggleBtn} ${
                      lineMetric === 'aciertos' ? styles.viewToggleBtnActive : ''
                    }`}
                    onClick={() => setLineMetric('aciertos')}
                  >
                    📈 % Aciertos (Logro)
                  </button>
                </div>
                <span className="text-xs text-slate-500 font-medium">
                  {lineMetric === 'prev'
                    ? 'Valores altos indican mayor porcentaje en rezago escolar'
                    : 'Valores altos indican mayor porcentaje de respuestas correctas'}
                </span>
              </div>

              {/* Barra de todas las UGELs como píldoras interactivas (Multi-selección) */}
              <div className={styles.ugelPillsBar}>
                <span className={styles.ugelPillsLabel}>📍 UGELs visibles:</span>
                <button
                  type="button"
                  className={styles.quickActionBtn}
                  onClick={selectAllLineUgeles}
                  title="Mostrar todas las UGELs en la gráfica"
                >
                  + Todas
                </button>
                <button
                  type="button"
                  className={styles.quickActionBtn}
                  onClick={selectOnlyFirstLineUgel}
                  title="Ver solo la primera UGEL"
                >
                  Solo una
                </button>
                {data.map((u, idx) => {
                  const isActive = activeLineUgelIds.includes(u.id);
                  const color = COLORES_PALETA[idx % COLORES_PALETA.length];
                  return (
                    <button
                      key={u.id}
                      type="button"
                      className={`${styles.ugelPillBtn} ${
                        isActive ? styles.ugelPillBtnActive : ''
                      }`}
                      onClick={() => toggleLineUgel(u.id)}
                      title={`Haz clic para ${isActive ? 'ocultar' : 'mostrar'} la curva de ${u.nombre}`}
                    >
                      <span
                        className={styles.ugelColorDot}
                        style={{
                          backgroundColor: isActive ? '#ffffff' : color,
                        }}
                      />
                      <span>{u.nombre}</span>
                      {isActive && <span className={styles.activeCheck}>✓</span>}
                    </button>
                  );
                })}
              </div>

              <div className={styles.lineChartWrapper}>
                <Line
                  data={lineChartInfo.chartData}
                  options={{
                    responsive: true,
                    maintainAspectRatio: false,
                    onClick: (event: any, elements: any[], chart: any) => {
                      const nativeEvt = (event?.native || event) as MouseEvent | undefined;
                      if (!nativeEvt) return;

                      let targetIndex: number | null = null;
                      if (elements && elements.length > 0) {
                        targetIndex = elements[0].index;
                      } else if (chart?.scales?.x) {
                        const xScale = chart.scales.x;
                        const x = typeof event?.x === 'number' ? event.x : nativeEvt.offsetX;
                        if (x >= xScale.left - 15 && x <= xScale.right + 15) {
                          const val = xScale.getValueForPixel(x);
                          if (typeof val === 'number') {
                            targetIndex = Math.max(
                              0,
                              Math.min(sortedPreguntas.length - 1, Math.round(val))
                            );
                          }
                        }
                      }

                      if (
                        targetIndex !== null &&
                        targetIndex >= 0 &&
                        targetIndex < sortedPreguntas.length
                      ) {
                        const q = sortedPreguntas[targetIndex];
                        const order = getOrderNum(q, targetIndex + 1);
                        openQuestionDetailAt(order, {
                          x: nativeEvt.clientX,
                          y: nativeEvt.clientY,
                          width: 0,
                          height: 0,
                        });
                      }
                    },
                    onHover: (event: any, elements: any[], chart: any) => {
                      const canvas = chart?.canvas;
                      if (!canvas) return;
                      if (elements && elements.length > 0) {
                        canvas.style.cursor = 'pointer';
                        return;
                      }
                      const nativeEvt = (event?.native || event) as MouseEvent | undefined;
                      const xScale = chart?.scales?.x;
                      if (xScale && nativeEvt) {
                        const x = typeof event?.x === 'number' ? event.x : nativeEvt.offsetX;
                        const y = typeof event?.y === 'number' ? event.y : nativeEvt.offsetY;
                        if (
                          x >= xScale.left - 15 &&
                          x <= xScale.right + 15 &&
                          y >= xScale.top - 20
                        ) {
                          canvas.style.cursor = 'pointer';
                          return;
                        }
                      }
                      canvas.style.cursor = 'default';
                    },
                    interaction: {
                      mode: 'index' as const,
                      intersect: false,
                    },
                    plugins: {
                      legend: {
                        position: 'top',
                        labels: { font: { size: 11, weight: 'bold' }, boxWidth: 16, padding: 12 },
                      },
                      tooltip: {
                        mode: 'index' as const,
                        intersect: false,
                        backgroundColor: 'rgba(15, 23, 42, 0.94)',
                        padding: 10,
                        titleFont: { size: 12, weight: 'bold' },
                        bodyFont: { size: 11 },
                        callbacks: {
                          title: (items) => {
                            if (!items.length) return '';
                            return `Pregunta: ${items[0].label} (Haz clic para ver detalle)`;
                          },
                          label: (context) =>
                            lineMetric === 'prev'
                              ? ` ${context.dataset.label}: ${context.parsed.y}% en Previo al Inicio`
                              : ` ${context.dataset.label}: ${context.parsed.y}% de aciertos`,
                          footer: () => '👉 Haz clic para ver ítem pedagógico',
                        },
                      },
                    },
                    scales: {
                      y: {
                        beginAtZero: true,
                        max: lineChartInfo.dynamicYMax,
                        ticks: {
                          callback: (val) => `${val}%`,
                          stepSize:
                            lineChartInfo.dynamicYMax <= 35
                              ? 5
                              : lineChartInfo.dynamicYMax <= 65
                              ? 10
                              : 20,
                        },
                        title: {
                          display: true,
                          text:
                            lineMetric === 'prev'
                              ? '% Previo al Inicio (Dificultad)'
                              : '% Respuestas Correctas (Aciertos)',
                        },
                      },
                      x: {
                        title: {
                          display: true,
                          text: 'Preguntas Evaluadas (Haz clic en P01, P02... para ver detalle)',
                        },
                        ticks: {
                          color: '#1e293b',
                          font: { weight: 'bold', size: 11 },
                        },
                      },
                    },
                  }}
                />
              </div>

              {/* Tarjetas resumen bajo la gráfica */}
              <div className="mt-4 mb-2 flex items-center justify-between flex-wrap gap-2">
                <span className="text-xs font-bold text-slate-700">
                  Resumen por UGEL ({activeLineUgelIds.length} de {data.length} seleccionadas - Haz clic para activar/desactivar):
                </span>
                <span className="text-xs text-slate-500">
                  Promedio Regional Base:{' '}
                  <strong>
                    {lineMetric === 'prev'
                      ? `${lineChartInfo.regPromPrev}% rezago`
                      : `${lineChartInfo.regPromAcierto}% aciertos`}
                  </strong>
                </span>
              </div>

              <div className={styles.statsLine}>
                {lineChartInfo.stats.map((s) => {
                  const isSelected = activeLineUgelIds.includes(s.id);
                  return (
                    <div
                      key={s.ugel}
                      className={`${styles.statCard} ${
                        isSelected ? styles.statCardSelected : styles.statCardUnselected
                      }`}
                      onClick={() => toggleLineUgel(s.id)}
                      title={`Haz clic para ${isSelected ? 'ocultar' : 'mostrar'} la curva de ${s.ugel}`}
                    >
                      <div className={styles.statCardHeader}>
                        <div className={styles.statCardTitle}>
                          <span
                            className={styles.ugelColorDot}
                            style={{ backgroundColor: s.color }}
                          />
                          <span className={styles.num}>{s.ugel}</span>
                          {isSelected && (
                            <span className={styles.activeCheck} style={{ color: '#2563eb' }}>
                              ✓
                            </span>
                          )}
                        </div>
                        <span className={styles.promBadge}>
                          {lineMetric === 'prev'
                            ? `Rezago: ${s.promPrev}%`
                            : `Aciertos: ${s.promAcierto}%`}
                        </span>
                      </div>

                      <div className={styles.statDetailList}>
                        {lineMetric === 'prev' ? (
                          <>
                            <div
                              className={styles.statDetailItem}
                              title={`Pregunta más difícil: en ${formatQuestionCode(s.maxPrevPregunta)} el ${s.maxPrev}% de los alumnos quedó en Previo al Inicio`}
                            >
                              <span>🔴</span>
                              <span className={styles.statDetailText}>
                                Más difícil:{' '}
                                <strong>{formatQuestionCode(s.maxPrevPregunta)}</strong>{' '}
                                ({s.maxPrev}%)
                              </span>
                            </div>
                            <div
                              className={styles.statDetailItem}
                              title={`Pregunta más lograda: en ${formatQuestionCode(s.minPrevPregunta)} solo el ${s.minPrev}% de los alumnos quedó en Previo al Inicio`}
                            >
                              <span>🟢</span>
                              <span className={styles.statDetailText}>
                                Más lograda:{' '}
                                <strong>{formatQuestionCode(s.minPrevPregunta)}</strong>{' '}
                                ({s.minPrev}%)
                              </span>
                            </div>
                          </>
                        ) : (
                          <>
                            <div
                              className={styles.statDetailItem}
                              title={`Pregunta con mayor porcentaje de aciertos: ${s.maxAcierto}%`}
                            >
                              <span>🟢</span>
                              <span className={styles.statDetailText}>
                                Mayor acierto:{' '}
                                <strong>{formatQuestionCode(s.maxAciertoPregunta)}</strong>{' '}
                                ({s.maxAcierto}%)
                              </span>
                            </div>
                            <div
                              className={styles.statDetailItem}
                              title={`Pregunta con menor porcentaje de aciertos: ${s.minAcierto}%`}
                            >
                              <span>🔴</span>
                              <span className={styles.statDetailText}>
                                Menor acierto:{' '}
                                <strong>{formatQuestionCode(s.minAciertoPregunta)}</strong>{' '}
                                ({s.minAcierto}%)
                              </span>
                            </div>
                          </>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* ========================================================================= */}
          {/* TAB 6: 📋 DECISIONES */}
          {/* ========================================================================= */}
          {activeTab === 'decisiones' && (
            <div>
              {/* Encabezado con Botón de Interpretación Modal */}
              <div className={styles.tabHeaderWithAction}>
                <div className={styles.tabHeaderTitleGroup}>
                  <h3 className={styles.tabSectionTitle}>
                    📋 Panel de Toma de Decisiones y Alertas Pedagógicas
                  </h3>
                  <p className={styles.tabSectionSubtitle}>
                    Priorización automática de focos críticos por UGEL y recomendaciones de intervención inmediata
                  </p>
                </div>
                <button
                  type="button"
                  className={styles.infoHelpBtn}
                  onClick={() => setIsDecisionesModalOpen(true)}
                  title="¿En qué consiste este panel de decisiones? Haz clic para ver la guía metodológica y de interpretación"
                >
                  <MdHelpOutline className={styles.infoHelpIcon} />
                  <span>¿Cómo interpretar este panel?</span>
                </button>
              </div>

              {/* Barra Compacta Unificada de Resumen de Alertas (Un Solo Contenedor) */}
              <div className={styles.decisionCompactBar}>
                <div className={styles.kpiCompactItem}>
                  <span className={styles.kpiDot}>🔴</span>
                  <span className={`${styles.kpiBadge} ${styles.kpiBadgeCritico}`}>
                    {decisionData.totalCritico}
                  </span>
                  <span className={styles.kpiLabel}>Críticas (≥60%)</span>
                </div>

                <div className={styles.kpiDivider} />

                <div className={styles.kpiCompactItem}>
                  <span className={styles.kpiDot}>🟠</span>
                  <span className={`${styles.kpiBadge} ${styles.kpiBadgeAlto}`}>
                    {decisionData.totalAlto}
                  </span>
                  <span className={styles.kpiLabel}>Altas (50-59%)</span>
                </div>

                <div className={styles.kpiDivider} />

                <div className={styles.kpiCompactItem}>
                  <span className={styles.kpiDot}>🟡</span>
                  <span className={`${styles.kpiBadge} ${styles.kpiBadgeMedio}`}>
                    {decisionData.totalMedio}
                  </span>
                  <span className={styles.kpiLabel}>Medias (40-49%)</span>
                </div>

                <div className={styles.kpiDivider} />

                <div className={styles.kpiCompactItem}>
                  <span className={styles.kpiDot}>🟢</span>
                  <span className={`${styles.kpiBadge} ${styles.kpiBadgeBajo}`}>
                    {decisionData.totalBajo}
                  </span>
                  <span className={styles.kpiLabel}>Bajas (&lt;40%)</span>
                </div>

                <div className={styles.kpiDivider} />

                <div className={styles.kpiCompactItem}>
                  <span className={styles.kpiDot}>📊</span>
                  <span className={`${styles.kpiBadge} ${styles.kpiBadgePromedio}`}>
                    {decisionData.avgPrev}%
                  </span>
                  <span className={styles.kpiLabel}>Promedio General</span>
                </div>
              </div>

              {/* Tabla Ejecutiva Master-Detail por UGEL */}
              <div>
                {/* Barra de Herramientas superior */}
                  <div className={styles.porUgelHeaderBar}>
                    <div className={styles.porUgelHeaderInfo}>
                      <span>📌</span>
                      <span>
                        Resumen de criticidad por UGEL ({decisionPorUgelData.length} provincias)
                        · Ordenadas por nivel de riesgo pedagógico
                      </span>
                    </div>
                    <button
                      type="button"
                      className={styles.toggleAllBtn}
                      onClick={toggleAllUgels}
                      title={allUgelsAreExpanded ? 'Colapsar todas las UGELs' : 'Expandir todas las UGELs'}
                    >
                      {allUgelsAreExpanded ? (
                        <>
                          <MdUnfoldLess style={{ fontSize: '1rem' }} />
                          <span>Colapsar todas</span>
                        </>
                      ) : (
                        <>
                          <MdUnfoldMore style={{ fontSize: '1rem' }} />
                          <span>Expandir todas ({decisionPorUgelData.length})</span>
                        </>
                      )}
                    </button>
                  </div>

                  {/* Tabla Ejecutiva */}
                  <div className={styles.porUgelTableWrapper}>
                    <table className={styles.porUgelTable}>
                      <thead>
                        <tr>
                          <th style={{ width: '50px' }}>#</th>
                          <th style={{ minWidth: '160px', textAlign: 'left' }}>UGEL / Jurisdicción</th>
                          <th style={{ minWidth: '130px' }}>Nivel de Riesgo</th>
                          <th style={{ minWidth: '140px' }}>Alertas por Ítem</th>
                          <th style={{ minWidth: '180px' }}>Ítem Más Crítico</th>
                          <th style={{ minWidth: '240px', textAlign: 'left' }}>Acción Prioritaria Sugerida</th>
                          <th style={{ width: '130px' }}>Detalle</th>
                        </tr>
                      </thead>
                      <tbody>
                        {decisionPorUgelData.map((u, idx) => {
                          const isExpanded = !!expandedUgelIds[u.id];
                          const position = idx + 1;
                          const topAlerta = u.topPregunta ? getAlertaInfo(u.topPregunta.prevPct) : null;

                          return (
                            <React.Fragment key={u.id}>
                              {/* Fila Maestra */}
                              <tr
                                className={`${styles.porUgelMasterRow} ${
                                  isExpanded ? styles.porUgelMasterRowExpanded : ''
                                }`}
                                onClick={() => toggleExpandUgel(u.id)}
                              >
                                <td className="font-bold text-center">
                                  <span className={styles.rankBadge}>{position}</span>
                                </td>
                                <td>
                                  <div className={styles.ugelNameCell}>
                                    <span className={styles.ugelNameText}>{u.ugel}</span>
                                    <span className={styles.ugelCountText}>
                                      {u.totalEstudiantesUgel.toLocaleString('es-PE')} estudiantes evaluados
                                    </span>
                                  </div>
                                </td>
                                <td className="text-center">
                                  <span
                                    className={styles.riesgoBadge}
                                    style={{
                                      backgroundColor: u.nivelRiesgo.bg,
                                      color: u.nivelRiesgo.text,
                                    }}
                                  >
                                    <span>{u.nivelRiesgo.icon}</span>
                                    <span>{u.nivelRiesgo.label}</span>
                                  </span>
                                  <div className="text-[10px] text-slate-500 font-semibold mt-1">
                                    Prom: {u.avgPrev}%
                                  </div>
                                </td>
                                <td>
                                  <div className={styles.miniBadgesRow}>
                                    {u.criticas > 0 && (
                                      <span
                                        className={`${styles.alertPill} ${styles.alertPillCritico}`}
                                        title={`${u.criticas} preguntas en estado crítico`}
                                      >
                                        🔴 {u.criticas}
                                      </span>
                                    )}
                                    {u.altas > 0 && (
                                      <span
                                        className={`${styles.alertPill} ${styles.alertPillAlto}`}
                                        title={`${u.altas} preguntas en dificultad alta`}
                                      >
                                        🟠 {u.altas}
                                      </span>
                                    )}
                                    {u.medias > 0 && (
                                      <span
                                        className={`${styles.alertPill} ${styles.alertPillMedio}`}
                                        title={`${u.medias} preguntas en alerta media`}
                                      >
                                        🟡 {u.medias}
                                      </span>
                                    )}
                                    {u.bajas > 0 && (
                                      <span
                                        className={`${styles.alertPill} ${styles.alertPillBajo}`}
                                        title={`${u.bajas} preguntas en bajo rezago`}
                                      >
                                        🟢 {u.bajas}
                                      </span>
                                    )}
                                  </div>
                                </td>
                                <td>
                                  {u.topPregunta ? (
                                    <div
                                      className={`${styles.topItemCell} ${styles.interactiveTopItem}`}
                                      onClick={(e) => handleOpenQuestionDetail(e, u.topPregunta.pregunta)}
                                      title={`Haz clic para ver la pregunta y actuación de P${u.topPregunta.pregunta < 10 ? `0${u.topPregunta.pregunta}` : u.topPregunta.pregunta}`}
                                    >
                                      <span
                                        className={styles.topItemChip}
                                        style={{
                                          backgroundColor: topAlerta?.color + '20',
                                          color: topAlerta?.color,
                                          borderColor: topAlerta?.color,
                                        }}
                                      >
                                        P{u.topPregunta.pregunta < 10 ? `0${u.topPregunta.pregunta}` : u.topPregunta.pregunta}
                                      </span>
                                      <div className={styles.topItemInfo}>
                                        <span className={styles.topItemPct} style={{ color: topAlerta?.color }}>
                                          {u.topPregunta.prevPct}%
                                        </span>
                                        <span className={styles.topItemEst}>
                                          {u.topPregunta.estudiantes.toLocaleString('es-PE')} est.
                                        </span>
                                      </div>
                                    </div>
                                  ) : (
                                    <span className="text-slate-400 text-xs">-</span>
                                  )}
                                </td>
                                <td>
                                  <div className={styles.accionBox}>
                                    {u.nivelRiesgo.accion}
                                  </div>
                                </td>
                                <td className="text-center" onClick={(e) => e.stopPropagation()}>
                                  <button
                                    type="button"
                                    className={`${styles.detailToggleBtn} ${
                                      isExpanded ? styles.detailToggleBtnActive : ''
                                    }`}
                                    onClick={() => toggleExpandUgel(u.id)}
                                  >
                                    <span>{isExpanded ? 'Ocultar' : `Ver ${u.totalPreguntas} ítems`}</span>
                                    {isExpanded ? (
                                      <MdKeyboardArrowUp style={{ fontSize: '1.05rem' }} />
                                    ) : (
                                      <MdKeyboardArrowDown style={{ fontSize: '1.05rem' }} />
                                    )}
                                  </button>
                                </td>
                              </tr>

                              {/* Fila de Detalle Expandible */}
                              {isExpanded && (
                                <tr>
                                  <td colSpan={7} className={styles.detailContainerCell}>
                                    <div className={styles.detailPanel}>
                                      <div className={styles.detailPanelHeader}>
                                        <div className={styles.detailPanelTitle}>
                                          <span>📌 Desglose pedagógico por ítem · {u.ugel}</span>
                                          <span className={styles.detailCountBadge}>
                                            {u.totalPreguntas} preguntas evaluadas
                                          </span>
                                        </div>
                                      </div>

                                      <div className={styles.subTableWrapper}>
                                        <table className={styles.subTable}>
                                          <thead>
                                            <tr>
                                              <th style={{ width: '70px' }}>Ítem</th>
                                              <th style={{ minWidth: '180px' }}>% en Previo al Inicio (Rezago)</th>
                                              <th style={{ minWidth: '150px' }}>Estudiantes Afectados</th>
                                              <th style={{ minWidth: '100px' }}>Nivel de Alerta</th>
                                              <th style={{ minWidth: '250px', textAlign: 'left' }}>Acción Recomendada</th>
                                            </tr>
                                          </thead>
                                          <tbody>
                                            {u.preguntas.map((p) => {
                                              const alerta = getAlertaInfo(p.prevPct);
                                              return (
                                                <tr key={p.pregunta}>
                                                  <td
                                                     className={`font-bold text-slate-800 ${styles.interactiveItemCell}`}
                                                     onClick={(e) => handleOpenQuestionDetail(e, p.pregunta)}
                                                     title={`Haz clic para ver la pregunta y actuación de P${p.pregunta < 10 ? `0${p.pregunta}` : p.pregunta}`}
                                                  >
                                                    <span className={styles.itemCellBadge}>
                                                      P{p.pregunta < 10 ? `0${p.pregunta}` : p.pregunta}
                                                    </span>
                                                  </td>
                                                  <td>
                                                    <div className={styles.progressCellWrapper}>
                                                      <div className={styles.progressBar}>
                                                        <div
                                                          className={styles.progressFill}
                                                          style={{
                                                            width: `${p.prevPct}%`,
                                                            backgroundColor: alerta.color,
                                                          }}
                                                        />
                                                      </div>
                                                      <span
                                                        className={styles.progressPct}
                                                        style={{ color: alerta.color }}
                                                      >
                                                        {p.prevPct}%
                                                      </span>
                                                    </div>
                                                  </td>
                                                  <td className="text-slate-600 font-medium">
                                                    <strong>{p.estudiantes.toLocaleString('es-PE')}</strong> de{' '}
                                                    {p.totalEstudiantes.toLocaleString('es-PE')}
                                                  </td>
                                                  <td>
                                                    <span className={`${styles.alertaBadge} ${alerta.clase}`}>
                                                      {alerta.label}
                                                    </span>
                                                  </td>
                                                  <td className="text-left pl-3">
                                                    <span className={styles.accionText}>{alerta.accion}</span>
                                                  </td>
                                                </tr>
                                              );
                                            })}
                                          </tbody>
                                        </table>
                                      </div>
                                    </div>
                                  </td>
                                </tr>
                              )}
                            </React.Fragment>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>

              {/* Leyenda Decisiones */}
              <div className={styles.legend}>
                <div className={styles.legendItem}>
                  <div className={styles.legendColor} style={{ background: '#e53935' }} />
                  Crítico (≥ 60%)
                </div>
                <div className={styles.legendItem}>
                  <div className={styles.legendColor} style={{ background: '#ff8a65' }} />
                  Alto (50-59%)
                </div>
                <div className={styles.legendItem}>
                  <div className={styles.legendColor} style={{ background: '#f9a825' }} />
                  Medio (40-49%)
                </div>
                <div className={styles.legendItem}>
                  <div className={styles.legendColor} style={{ background: '#66bb6a' }} />
                  Bajo (&lt; 40%)
                </div>
                <span className={styles.legendNotice}>
                  🔴 Priorizar intervención pedagógica en las primeras posiciones del ranking
                </span>
                <button
                  type="button"
                  className={styles.legendLinkBtn}
                  onClick={() => setIsDecisionesModalOpen(true)}
                  title="Ver explicación completa del Panel de Decisiones"
                >
                  <MdHelpOutline />
                  <span>Ver guía completa</span>
                </button>
              </div>
            </div>
          )}
        </>
      )}
      </div>

      {/* Modal interactivo de Guía e Interpretación del Ranking */}
      <GuiaRankingModal
        isOpen={isRankingModalOpen}
        onClose={() => setIsRankingModalOpen(false)}
      />

      {/* Modal interactivo de Guía e Interpretación del Heatmap */}
      <GuiaHeatmapModal
        isOpen={isHeatmapModalOpen}
        onClose={() => setIsHeatmapModalOpen(false)}
      />

      {/* Modal interactivo de Guía e Interpretación del Gráfico de Burbujas */}
      <GuiaBurbujasModal
        isOpen={isBurbujasModalOpen}
        onClose={() => setIsBurbujasModalOpen(false)}
      />

      {/* Modal interactivo de Guía e Interpretación del Panel de Decisiones */}
      <GuiaDecisionesModal
        isOpen={isDecisionesModalOpen}
        onClose={() => setIsDecisionesModalOpen(false)}
      />

      {/* Popover interactivo de detalles de pregunta para Heatmap y Burbujas */}
      {questionDetailPopover && (
        <QuestionDetailPopover
          order={questionDetailPopover.order}
          initialEtapa={questionDetailPopover.initialEtapa}
          coords={questionDetailPopover.coords}
          onClose={() => setQuestionDetailPopover(null)}
          evaluacionEdi={evaluacionEdi}
          evaluacionEp1={evaluacionEp1}
          evaluacionEp2={evaluacionEp2}
          preguntas={preguntas}
          gradoName={gradoName}
        />
      )}
    </div>
  );
};

export default PanelVisualizacionesMatriz;
