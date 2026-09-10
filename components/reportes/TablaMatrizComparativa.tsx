import React, { useState, useMemo, useRef, useEffect } from 'react';
import {
  MdTableChart,
  MdSearch,
  MdDownload,
  MdClose,
  MdRefresh,
  MdTrendingUp,
  MdTrendingDown,
  MdTrendingFlat,
  MdBarChart,
  MdFullscreen,
  MdFullscreenExit,
  MdViewColumn,
  MdCheck,
} from 'react-icons/md';
import { RiFileExcel2Line, RiLoader4Line } from 'react-icons/ri';
import * as XLSX from 'xlsx';
import styles from './TablaMatrizComparativa.module.css';
import { Evaluaciones, PreguntasRespuestas } from '@/features/types/types';
import {
  UgelMatrizComparativaRow,
  NivelComparativoStat,
} from '@/features/hooks/useMatrizResultados';
import QuestionDetailPopover from './QuestionDetailPopover';

export interface ColumnVisibilityConfig {
  showRc: boolean;
  showPuntaje: boolean;
  showNiveles: boolean;
  showPreguntas: boolean;
  showEdi: boolean;
  showEp1: boolean;
  showEp2: boolean;
  preguntasVisibles: Record<number, boolean>;
}

const DEFAULT_COLUMN_VISIBILITY: ColumnVisibilityConfig = {
  showRc: true,
  showPuntaje: true,
  showNiveles: true,
  showPreguntas: true,
  showEdi: true,
  showEp1: true,
  showEp2: true,
  preguntasVisibles: {},
};

interface TablaMatrizComparativaProps {
  data: UgelMatrizComparativaRow[];
  loading: boolean;
  evaluacionEdi: Evaluaciones | null;
  evaluacionEp1: Evaluaciones | null;
  evaluacionEp2: Evaluaciones | null;
  preguntas: PreguntasRespuestas[];
  onReload?: () => void;
  gradoName?: string;
}

export const TablaMatrizComparativa: React.FC<TablaMatrizComparativaProps> = ({
  data = [],
  loading = false,
  evaluacionEdi,
  evaluacionEp1,
  evaluacionEp2,
  preguntas = [],
  onReload,
  gradoName = '',
}) => {
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [vistaPreguntas, setVistaPreguntas] = useState<'porcentaje' | 'aciertos'>('porcentaje');

  // Popover interactivo al hacer click en EDI, EP1, EP2 (cabeceras o celdas)
  const [activePopover, setActivePopover] = useState<{
    type: 'header' | 'cell';
    title: string;
    subtitle: string;
    correctas: number;
    total: number;
    porcentaje: number;
    etapa: 'edi' | 'ep1' | 'ep2';
    order: number;
    ugelName?: string;
    coords: { x: number; y: number };
  } | null>(null);

  const popoverRef = useRef<HTMLDivElement>(null);

  // Popover interactivo para Pregunta y Actuación (al hacer clic en P01, P02...)
  const [questionPopover, setQuestionPopover] = useState<{
    order: number;
    selectedEtapa: 'edi' | 'ep1' | 'ep2';
    coords: { x: number; y: number };
  } | null>(null);

  // Popover interactivo de Niveles de Logro (al hacer clic en celdas de Nivel)
  const [nivelPopover, setNivelPopover] = useState<{
    row: UgelMatrizComparativaRow;
    selectedEtapa: 'edi' | 'ep1' | 'ep2';
    coords: { x: number; y: number };
  } | null>(null);

  const nivelPopoverRef = useRef<HTMLDivElement>(null);

  // Popover interactivo de Matriz de Pregunta por UGEL (al hacer clic en celda de pregunta)
  const [questionCellPopover, setQuestionCellPopover] = useState<{
    row: UgelMatrizComparativaRow;
    order: number;
    selectedEtapa: 'edi' | 'ep1' | 'ep2';
    coords: { x: number; y: number };
  } | null>(null);

  const questionCellPopoverRef = useRef<HTMLDivElement>(null);

  // Visibilidad de columnas personalizable
  const [colVisibility, setColVisibility] = useState<ColumnVisibilityConfig>(DEFAULT_COLUMN_VISIBILITY);
  const [showColMenu, setShowColMenu] = useState<boolean>(false);
  const colSelectorRef = useRef<HTMLDivElement>(null);

  const resetColumns = () => {
    setColVisibility(DEFAULT_COLUMN_VISIBILITY);
  };

  // Modo pantalla completa
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

  // Sincronizar cambios de pantalla completa del navegador (por ejemplo presionar F11 o Esc)
  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullScreen(!!document.fullscreenElement);
    };
    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => {
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
    };
  }, []);

  // Cerrar popovers o salir de pantalla completa con clic exterior o tecla Escape
  useEffect(() => {
    if (!activePopover && !questionPopover && !nivelPopover && !questionCellPopover && !showColMenu && !isFullScreen) return;

    const handleClickOutside = (e: MouseEvent) => {
      if (popoverRef.current && !popoverRef.current.contains(e.target as Node)) {
        setActivePopover(null);
      }

      if (nivelPopoverRef.current && !nivelPopoverRef.current.contains(e.target as Node)) {
        setNivelPopover(null);
      }
      if (questionCellPopoverRef.current && !questionCellPopoverRef.current.contains(e.target as Node)) {
        setQuestionCellPopover(null);
      }
      if (colSelectorRef.current && !colSelectorRef.current.contains(e.target as Node)) {
        setShowColMenu(false);
      }
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setActivePopover(null);
        setQuestionPopover(null);
        setNivelPopover(null);
        setQuestionCellPopover(null);
        setShowColMenu(false);
        if (isFullScreen) {
          if (document.fullscreenElement) {
            document.exitFullscreen().catch(() => {});
          }
          setIsFullScreen(false);
        }
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    window.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [activePopover, questionPopover, nivelPopover, questionCellPopover, showColMenu, isFullScreen]);

  const handleHeaderClick = (
    e: React.MouseEvent,
    order: number,
    etapa: 'edi' | 'ep1' | 'ep2'
  ) => {
    e.stopPropagation();
    setQuestionPopover(null);
    setNivelPopover(null);
    setQuestionCellPopover(null);
    const qReg = regionalSummary?.preguntas?.[order]?.[etapa];
    const qNum = order < 10 ? `0${order}` : order;
    const rect = e.currentTarget.getBoundingClientRect();

    if (
      activePopover &&
      activePopover.type === 'header' &&
      activePopover.order === order &&
      activePopover.etapa === etapa
    ) {
      setActivePopover(null);
      return;
    }

    const correctas = qReg?.correctas ?? 0;
    const total = qReg?.total ?? 0;
    const porcentaje = qReg?.porcentaje ?? 0;

    const popoverWidth = 270;
    let left = rect.left + rect.width / 2 - popoverWidth / 2;
    if (left < 16) left = 16;
    if (left + popoverWidth > window.innerWidth - 16) {
      left = window.innerWidth - popoverWidth - 16;
    }

    let top = rect.bottom + 6;
    if (top + 160 > window.innerHeight) {
      top = rect.top - 160;
    }

    setActivePopover({
      type: 'header',
      title: `Pregunta P${qNum} - ${etapa.toUpperCase()}`,
      subtitle: 'Consolidado Regional de Aciertos',
      correctas,
      total,
      porcentaje,
      etapa,
      order,
      coords: { x: left, y: top },
    });
  };

  const handleCellClick = (
    e: React.MouseEvent,
    order: number,
    etapa: 'edi' | 'ep1' | 'ep2',
    stat: { total: number; correctas: number; porcentaje: number } | undefined,
    ugelNombre: string
  ) => {
    e.stopPropagation();
    setQuestionPopover(null);
    setNivelPopover(null);
    const qNum = order < 10 ? `0${order}` : order;
    const rect = e.currentTarget.getBoundingClientRect();

    if (
      activePopover &&
      activePopover.type === 'cell' &&
      activePopover.order === order &&
      activePopover.etapa === etapa &&
      activePopover.ugelName === ugelNombre
    ) {
      setActivePopover(null);
      return;
    }

    const correctas = stat?.correctas ?? 0;
    const total = stat?.total ?? 0;
    const porcentaje = stat?.porcentaje ?? 0;

    const popoverWidth = 270;
    let left = rect.left + rect.width / 2 - popoverWidth / 2;
    if (left < 16) left = 16;
    if (left + popoverWidth > window.innerWidth - 16) {
      left = window.innerWidth - popoverWidth - 16;
    }

    let top = rect.bottom + 6;
    if (top + 160 > window.innerHeight) {
      top = rect.top - 160;
    }

    setActivePopover({
      type: 'cell',
      title: `${ugelNombre}`,
      subtitle: `Pregunta P${qNum} (${etapa.toUpperCase()})`,
      correctas,
      total,
      porcentaje,
      etapa,
      order,
      ugelName: ugelNombre,
      coords: { x: left, y: top },
    });
  };

  const handleQuestionGroupClick = (e: React.MouseEvent, order: number) => {
    e.stopPropagation();
    setActivePopover(null);
    setNivelPopover(null);
    setQuestionCellPopover(null);

    if (questionPopover && questionPopover.order === order) {
      setQuestionPopover(null);
      return;
    }

    const rect = e.currentTarget.getBoundingClientRect();
    const popoverWidth = 440;
    let left = rect.left + rect.width / 2 - popoverWidth / 2;
    if (left < 16) left = 16;
    if (left + popoverWidth > window.innerWidth - 16) {
      left = window.innerWidth - popoverWidth - 16;
    }

    let top = rect.bottom + 8;
    if (top + 400 > window.innerHeight && rect.top - 400 > 16) {
      top = rect.top - 400;
    }

    const qObj = preguntas.find(
      (p, idx) => (p.order !== undefined ? Number(p.order) : idx + 1) === order
    );
    const hasEdi = !!(qObj as any)?.ediPregunta || !!evaluacionEdi;
    const hasEp1 = !!(qObj as any)?.ep1Pregunta || !!evaluacionEp1;
    const initialEtapa: 'edi' | 'ep1' | 'ep2' = hasEdi ? 'edi' : hasEp1 ? 'ep1' : 'ep2';

    setQuestionPopover({
      order,
      selectedEtapa: initialEtapa,
      coords: { x: left, y: top },
    });
  };


  const handleNivelCellClick = (
    e: React.MouseEvent,
    row: UgelMatrizComparativaRow,
    etapa: 'edi' | 'ep1' | 'ep2'
  ) => {
    e.stopPropagation();
    setActivePopover(null);
    setQuestionPopover(null);
    setQuestionCellPopover(null);

    if (
      nivelPopover &&
      nivelPopover.row.id === row.id &&
      nivelPopover.selectedEtapa === etapa
    ) {
      setNivelPopover(null);
      return;
    }

    const rect = e.currentTarget.getBoundingClientRect();
    const hasEp2 =
      !!evaluacionEp2 ||
      row.totalEstudiantes.ep2 !== undefined ||
      row.niveles.some((n) => n.ep2 !== undefined);
    const popoverWidth = hasEp2 ? 590 : 530;
    const popoverHeight = 280;

    let left = rect.left + rect.width / 2 - popoverWidth / 2;
    if (left < 16) left = 16;
    if (left + popoverWidth > window.innerWidth - 16) {
      left = window.innerWidth - popoverWidth - 16;
    }

    let top = rect.bottom + 8;
    if (top + popoverHeight > window.innerHeight && rect.top - popoverHeight > 16) {
      top = rect.top - popoverHeight - 8;
    } else if (top + popoverHeight > window.innerHeight) {
      top = Math.max(16, window.innerHeight - popoverHeight - 16);
    }

    setNivelPopover({
      row,
      selectedEtapa: etapa,
      coords: { x: left, y: top },
    });
  };

  const handleQuestionCellClick = (
    e: React.MouseEvent,
    row: UgelMatrizComparativaRow,
    order: number,
    etapa: 'edi' | 'ep1' | 'ep2'
  ) => {
    e.stopPropagation();
    setActivePopover(null);
    setQuestionPopover(null);
    setNivelPopover(null);

    if (
      questionCellPopover &&
      questionCellPopover.row.id === row.id &&
      questionCellPopover.order === order &&
      questionCellPopover.selectedEtapa === etapa
    ) {
      setQuestionCellPopover(null);
      return;
    }

    const rect = e.currentTarget.getBoundingClientRect();
    const hasEp2 =
      !!evaluacionEp2 ||
      row.totalEstudiantes.ep2 !== undefined ||
      row.preguntas[order]?.ep2 !== undefined;
    const popoverWidth = hasEp2 ? 590 : 550;
    const popoverHeight = 360;

    let left = rect.left + rect.width / 2 - popoverWidth / 2;
    if (left < 16) left = 16;
    if (left + popoverWidth > window.innerWidth - 16) {
      left = window.innerWidth - popoverWidth - 16;
    }

    let top = rect.bottom + 8;
    if (top + popoverHeight > window.innerHeight && rect.top - popoverHeight > 16) {
      top = rect.top - popoverHeight - 8;
    } else if (top + popoverHeight > window.innerHeight) {
      top = Math.max(16, window.innerHeight - popoverHeight - 16);
    }

    setQuestionCellPopover({
      row,
      order,
      selectedEtapa: etapa,
      coords: { x: left, y: top },
    });
  };

  const selectedQuestionCellInfo = useMemo(() => {
    if (!questionCellPopover) return null;
    const order = questionCellPopover.order;
    const q =
      preguntas.find(
        (p, idx) => (p.order !== undefined ? Number(p.order) : idx + 1) === order
      ) || null;
    if (!q) return null;

    const etapa = questionCellPopover.selectedEtapa;
    const stageSpecificQ =
      etapa === 'edi'
        ? (q as any)?.ediPregunta || q
        : etapa === 'ep1'
        ? (q as any)?.ep1Pregunta || q
        : etapa === 'ep2'
        ? (q as any)?.ep2Pregunta || q
        : q;

    const correctAlt = stageSpecificQ?.alternativas?.find(
      (a: any) =>
        a.esCorrecta === true ||
        String(a.id) === String(stageSpecificQ?.respuesta) ||
        String(a.texto)?.trim() === String(stageSpecificQ?.respuesta)?.trim()
    );

    return {
      q,
      stageSpecificQ,
      correctAltText: correctAlt?.texto || stageSpecificQ?.respuesta || '',
    };
  }, [questionCellPopover, preguntas]);

  // Filtrar UGELs según el buscador
  const filteredData = useMemo(() => {
    if (!searchTerm.trim()) return data;
    const term = searchTerm.toLowerCase();
    return data.filter(
      (r) =>
        r.nombre.toLowerCase().includes(term) ||
        r.nombreCorto.toLowerCase().includes(term)
    );
  }, [data, searchTerm]);

  // Etapas de evaluación activas (EDI, EP1, EP2)
  const activeStages = useMemo(() => {
    const list: ('edi' | 'ep1' | 'ep2')[] = [];
    if (colVisibility.showEdi) list.push('edi');
    if (colVisibility.showEp1) list.push('ep1');
    if (colVisibility.showEp2) list.push('ep2');
    return list;
  }, [colVisibility.showEdi, colVisibility.showEp1, colVisibility.showEp2]);

  const activeStagesCount = activeStages.length;

  // Preguntas visibles por orden
  const visiblePreguntas = useMemo(() => {
    if (!colVisibility.showPreguntas) return [];
    return preguntas.filter((p, idx) => {
      const order = p.order !== undefined ? Number(p.order) : idx + 1;
      return colVisibility.preguntasVisibles[order] !== false;
    });
  }, [preguntas, colVisibility.showPreguntas, colVisibility.preguntasVisibles]);

  // Total de columnas para colSpan de celdas de carga y vacío
  const totalTableColumns = useMemo(() => {
    let count = 2; // N° + UGEL
    if (activeStagesCount > 0) {
      if (colVisibility.showRc) count += activeStagesCount;
      if (colVisibility.showPuntaje) count += activeStagesCount;
      if (colVisibility.showNiveles) count += activeStagesCount;
      if (colVisibility.showPreguntas) count += visiblePreguntas.length * activeStagesCount;
    }
    return count;
  }, [
    activeStagesCount,
    colVisibility.showRc,
    colVisibility.showPuntaje,
    colVisibility.showNiveles,
    colVisibility.showPreguntas,
    visiblePreguntas.length,
  ]);

  // Indicador de personalización activa
  const isCustomized = useMemo(() => {
    if (
      !colVisibility.showRc ||
      !colVisibility.showPuntaje ||
      !colVisibility.showNiveles ||
      !colVisibility.showPreguntas
    )
      return true;
    if (!colVisibility.showEdi || !colVisibility.showEp1 || !colVisibility.showEp2) return true;
    if (Object.values(colVisibility.preguntasVisibles).some((v) => v === false)) return true;
    return false;
  }, [colVisibility]);

  // Cantidad de columnas de datos ocultas
  const hiddenColumnsCount = useMemo(() => {
    let count = 0;
    const stagesFactor = activeStagesCount > 0 ? activeStagesCount : 3;
    if (!colVisibility.showRc) count += stagesFactor;
    if (!colVisibility.showPuntaje) count += stagesFactor;
    if (!colVisibility.showNiveles) count += stagesFactor;
    if (!colVisibility.showPreguntas) {
      count += preguntas.length * stagesFactor;
    } else {
      const hiddenQ = preguntas.filter((p, idx) => {
        const o = p.order !== undefined ? Number(p.order) : idx + 1;
        return colVisibility.preguntasVisibles[o] === false;
      }).length;
      count += hiddenQ * stagesFactor;
    }
    return count;
  }, [colVisibility, activeStagesCount, preguntas]);

  // Cálculo del Promedio Regional para el resumen superior
  const regionalSummary = useMemo(() => {
    if (data.length === 0) return null;

    const calcAvg = (getter: (r: UgelMatrizComparativaRow) => number | undefined) => {
      const vals = data.map(getter).filter((v): v is number => v !== undefined && !isNaN(v));
      if (vals.length === 0) return undefined;
      return Number((vals.reduce((a, b) => a + b, 0) / vals.length).toFixed(1));
    };

    // Calcular estadísticas regionales acumuladas por pregunta y etapa
    const preguntasRegional: Record<
      number,
      {
        edi?: { total: number; correctas: number; porcentaje: number };
        ep1?: { total: number; correctas: number; porcentaje: number };
        ep2?: { total: number; correctas: number; porcentaje: number };
      }
    > = {};

    preguntas.forEach((p, idx) => {
      const order = p.order !== undefined ? Number(p.order) : idx + 1;

      const sumEtapa = (etapa: 'edi' | 'ep1' | 'ep2') => {
        let sumCorr = 0;
        let sumTot = 0;
        let hasData = false;

        data.forEach((r) => {
          const qStat = r.preguntas?.[order]?.[etapa];
          if (qStat && qStat.total > 0) {
            sumCorr += qStat.correctas;
            sumTot += qStat.total;
            hasData = true;
          }
        });

        if (!hasData || sumTot === 0) return undefined;
        return {
          correctas: sumCorr,
          total: sumTot,
          porcentaje: Math.round((sumCorr / sumTot) * 100),
        };
      };

      preguntasRegional[order] = {
        edi: sumEtapa('edi'),
        ep1: sumEtapa('ep1'),
        ep2: sumEtapa('ep2'),
      };
    });

    // Calcular estadísticas regionales de niveles de logro
    const nivelesRegional = (data[0]?.niveles || []).map((nc, nIdx) => {
      const sumEtapaNivel = (etapa: 'edi' | 'ep1' | 'ep2') => {
        let cantSum = 0;
        let totEstSum = 0;
        let hasData = false;

        data.forEach((r) => {
          const nStat = r.niveles?.[nIdx]?.[etapa];
          const totEst = r.totalEstudiantes?.[etapa];
          if (nStat !== undefined && totEst !== undefined && totEst > 0) {
            cantSum += nStat.cantidad;
            totEstSum += totEst;
            hasData = true;
          }
        });

        if (!hasData || totEstSum === 0) return undefined;
        return {
          cantidad: cantSum,
          porcentaje: Math.round((cantSum / totEstSum) * 100),
        };
      };

      return {
        id: nc.id,
        nivel: nc.nivel,
        color: nc.color,
        edi: sumEtapaNivel('edi'),
        ep1: sumEtapaNivel('ep1'),
        ep2: sumEtapaNivel('ep2'),
      };
    });

    return {
      rc: {
        edi: calcAvg((r) => r.rc.edi),
        ep1: calcAvg((r) => r.rc.ep1),
        ep2: calcAvg((r) => r.rc.ep2),
      },
      puntaje: {
        edi: calcAvg((r) => r.puntaje.edi),
        ep1: calcAvg((r) => r.puntaje.ep1),
        ep2: calcAvg((r) => r.puntaje.ep2),
      },
      niveles: nivelesRegional,
      preguntas: preguntasRegional,
    };
  }, [data, preguntas]);

  // Exportar a Excel con columnas desglosadas por etapa (respetando columnas visibles)
  const exportToExcel = () => {
    if (data.length === 0) return;

    const exportRows = data.map((r) => {
      const rowObj: Record<string, any> = {
        'N°': r.index,
        UGEL: r.nombre,
      };

      // R.C
      if (colVisibility.showRc) {
        activeStages.forEach((etapa) => {
          rowObj[`R.C (${etapa.toUpperCase()})`] = r.rc[etapa] ?? '-';
        });
      }

      // Puntaje
      if (colVisibility.showPuntaje) {
        activeStages.forEach((etapa) => {
          rowObj[`PUNTAJE (${etapa.toUpperCase()})`] = r.puntaje[etapa] ?? '-';
        });
      }

      // Niveles
      if (colVisibility.showNiveles) {
        r.niveles.forEach((n) => {
          activeStages.forEach((etapa) => {
            const stat = n[etapa];
            rowObj[`${n.nivel} ${etapa.toUpperCase()} (%)`] = stat
              ? `${stat.cantidad} (${stat.porcentaje}%)`
              : '-';
          });
        });
      }

      // Preguntas
      if (colVisibility.showPreguntas) {
        visiblePreguntas.forEach((p, idx) => {
          const order = p.order !== undefined ? Number(p.order) : idx + 1;
          const pStat = r.preguntas[order];
          activeStages.forEach((etapa) => {
            const stat = pStat?.[etapa];
            rowObj[`P${order < 10 ? `0${order}` : order} ${etapa.toUpperCase()} (%)`] = stat
              ? `${stat.porcentaje}%`
              : '-';
          });
        });
      }

      return rowObj;
    });

    const worksheet = XLSX.utils.json_to_sheet(exportRows);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Matriz Comparativa UGEL');
    const fileName = `Matriz_Resultados_${gradoName ? gradoName.replace(/\s+/g, '_') : 'Comparativa'}.xlsx`;
    XLSX.writeFile(workbook, fileName);
  };

  // Helper de color según porcentaje de aciertos
  const getBadgeStyle = (pct?: number) => {
    if (pct === undefined || isNaN(pct)) return styles.chipEmpty;
    if (pct >= 70) return styles.chipHigh;
    if (pct >= 50) return styles.chipMid;
    return styles.chipLow;
  };

  // Helper de color de fondo del nivel según variables oficiales del proyecto:
  // var(--satisfactorio): #9bbb58 | var(--en-proceso): #f89646 | var(--inicio): #a64e4d | var(--previo-al-inicio): #a5a5a5
  const getNivelColor = (nombreNivel: string, customColor?: string) => {
    const clean = (nombreNivel || '')
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .trim();
    if (clean.includes('satisfactorio')) return 'var(--satisfactorio, #9bbb58)';
    if (clean.includes('proceso')) return 'var(--en-proceso, #f89646)';
    if (clean.includes('inicio') && !clean.includes('previo')) return 'var(--inicio, #a64e4d)';
    if (clean.includes('previo')) return 'var(--previo-al-inicio, #a5a5a5)';
    return customColor || '#a5a5a5';
  };

  // Helper para obtener el nivel de logro y color según el puntaje obtenido y la etapa evaluada
  const getNivelDataForPuntaje = (
    puntaje: number | undefined | null,
    etapa: 'edi' | 'ep1' | 'ep2'
  ) => {
    if (puntaje === undefined || puntaje === null || isNaN(puntaje)) return null;

    const targetEval =
      etapa === 'edi'
        ? evaluacionEdi
        : etapa === 'ep1'
        ? evaluacionEp1
        : evaluacionEp2;

    const rawNiveles =
      targetEval?.nivelYPuntaje ||
      evaluacionEp2?.nivelYPuntaje ||
      evaluacionEp1?.nivelYPuntaje ||
      evaluacionEdi?.nivelYPuntaje || [
        { nivel: 'Satisfactorio', min: 16, max: 20, color: '#9bbb58' },
        { nivel: 'En proceso', min: 12, max: 15, color: '#f89646' },
        { nivel: 'En inicio', min: 8, max: 11, color: '#a64e4d' },
        { nivel: 'Previo al inicio', min: 0, max: 7, color: '#a5a5a5' },
      ];

    if (!rawNiveles || rawNiveles.length === 0) return null;

    // Ordenar de menor a mayor según min
    const sorted = [...rawNiveles].sort((a, b) => Number(a.min ?? 0) - Number(b.min ?? 0));

    // 1. Coincidencia exacta dentro del rango [min, max]
    let matched = sorted.find((n) => {
      const min = Number(n.min ?? 0);
      const max = n.max !== undefined && n.max !== null ? Number(n.max) : Infinity;
      return puntaje >= min && puntaje <= max;
    });

    // 2. Si hay gap entre enteros y el puntaje es decimal (ej. 412.6 entre max 412 y min 413)
    if (!matched) {
      for (let i = 0; i < sorted.length; i++) {
        const min = Number(sorted[i].min ?? 0);
        const nextMin = i < sorted.length - 1 ? Number(sorted[i + 1].min ?? Infinity) : Infinity;
        if (puntaje >= min && puntaje < nextMin) {
          matched = sorted[i];
          break;
        }
      }
    }

    // 3. Fallback en extremos (si queda por debajo del mínimo o por encima del máximo)
    if (!matched) {
      if (puntaje < Number(sorted[0].min ?? 0)) {
        matched = sorted[0];
      } else {
        matched = sorted[sorted.length - 1];
      }
    }

    if (!matched) return null;

    const color = getNivelColor(matched.nivel || '', matched.color);
    return {
      nivel: matched.nivel || '',
      color,
    };
  };

  return (
    <div
      ref={containerRef}
      className={`${styles.wrapper} ${isFullScreen ? styles.wrapperFullscreen : ''}`}
    >
      {/* Barra de herramientas */}
      <div className={styles.toolbar}>
        <div className={styles.searchBox}>
          <MdSearch className={styles.searchIcon} />
          <input
            type="text"
            placeholder="Buscar UGEL por nombre..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className={styles.searchInput}
          />
          {searchTerm && (
            <button
              type="button"
              className={styles.clearSearchBtn}
              onClick={() => setSearchTerm('')}
            >
              <MdClose />
            </button>
          )}
        </div>

        <div className={styles.toolActions}>
          {/* Alternar vista de preguntas: % o Cantidad de aciertos */}
          <div className={styles.viewToggleGroup}>
            <span className={styles.viewToggleLabel}>Vista de ítems:</span>
            <button
              type="button"
              className={`${styles.viewToggleBtn} ${vistaPreguntas === 'porcentaje' ? styles.viewToggleBtnActive : ''}`}
              onClick={() => setVistaPreguntas('porcentaje')}
              title="Ver porcentaje de aciertos"
            >
              % Porcentaje
            </button>
            <button
              type="button"
              className={`${styles.viewToggleBtn} ${vistaPreguntas === 'aciertos' ? styles.viewToggleBtnActive : ''}`}
              onClick={() => setVistaPreguntas('aciertos')}
              title="Ver cantidad de aciertos sobre total (ej. 1650/3120)"
            >
              Aciertos / Total
            </button>
          </div>

          {/* Selector de Columnas Visibles */}
          <div className={styles.colSelectorContainer} ref={colSelectorRef}>
            <button
              type="button"
              onClick={() => setShowColMenu((prev) => !prev)}
              className={`${styles.actionBtn} ${styles.colSelectorBtn} ${showColMenu ? styles.actionBtnActive : ''}`}
              title="Personalizar columnas visibles de la matriz"
            >
              <MdViewColumn className={styles.excelIcon} style={{ color: '#6366f1' }} />
              <span>Columnas</span>
              {isCustomized && (
                <span className={styles.customizedBadge}>
                  {hiddenColumnsCount > 0 ? `${hiddenColumnsCount} oculta(s)` : 'Filtro'}
                </span>
              )}
            </button>

            {showColMenu && (
              <div className={styles.colDropdownMenu}>
                <div className={styles.colDropdownHeader}>
                  <div>
                    <h4 className={styles.colDropdownTitle}>Personalizar Columnas</h4>
                    <p className={styles.colDropdownSubtitle}>
                      Selecciona las secciones, etapas o ítems a mostrar
                    </p>
                  </div>
                  {isCustomized && (
                    <button
                      type="button"
                      onClick={resetColumns}
                      className={styles.resetColsBtn}
                      title="Restablecer todas las columnas por defecto"
                    >
                      <MdRefresh />
                      <span>Restablecer</span>
                    </button>
                  )}
                </div>

                <div className={styles.colDropdownBody}>
                  {/* Secciones Principales */}
                  <div className={styles.colDropdownSection}>
                    <span className={styles.colSectionLabel}>Métricas Principales:</span>
                    <div className={styles.colCheckboxGrid}>
                      <label className={styles.colCheckboxItem}>
                        <input
                          type="checkbox"
                          checked={colVisibility.showRc}
                          onChange={(e) =>
                            setColVisibility((prev) => ({ ...prev, showRc: e.target.checked }))
                          }
                        />
                        <span className={styles.colCheckboxText}>R.C (Aciertos Promedio)</span>
                      </label>
                      <label className={styles.colCheckboxItem}>
                        <input
                          type="checkbox"
                          checked={colVisibility.showPuntaje}
                          onChange={(e) =>
                            setColVisibility((prev) => ({ ...prev, showPuntaje: e.target.checked }))
                          }
                        />
                        <span className={styles.colCheckboxText}>PUNTAJE (Promedio)</span>
                      </label>
                      <label className={styles.colCheckboxItem}>
                        <input
                          type="checkbox"
                          checked={colVisibility.showNiveles}
                          onChange={(e) =>
                            setColVisibility((prev) => ({ ...prev, showNiveles: e.target.checked }))
                          }
                        />
                        <span className={styles.colCheckboxText}>NIVEL DE LOGRO (2×2)</span>
                      </label>
                      <label className={styles.colCheckboxItem}>
                        <input
                          type="checkbox"
                          checked={colVisibility.showPreguntas}
                          onChange={(e) =>
                            setColVisibility((prev) => ({ ...prev, showPreguntas: e.target.checked }))
                          }
                        />
                        <span className={styles.colCheckboxText}>PREGUNTAS (Por Ítem)</span>
                      </label>
                    </div>
                  </div>

                  {/* Etapas de Evaluación */}
                  <div className={styles.colDropdownSection}>
                    <span className={styles.colSectionLabel}>Etapas de Evaluación:</span>
                    <div className={styles.colEtapasGrid}>
                      <label
                        className={`${styles.colEtapaPill} ${
                          colVisibility.showEdi ? styles.colEtapaPillActive : ''
                        }`}
                      >
                        <input
                          type="checkbox"
                          checked={colVisibility.showEdi}
                          onChange={(e) => {
                            if (activeStagesCount === 1 && colVisibility.showEdi) return;
                            setColVisibility((prev) => ({ ...prev, showEdi: e.target.checked }));
                          }}
                        />
                        <span>EDI (Marzo)</span>
                      </label>
                      <label
                        className={`${styles.colEtapaPill} ${
                          colVisibility.showEp1 ? styles.colEtapaPillActive : ''
                        }`}
                      >
                        <input
                          type="checkbox"
                          checked={colVisibility.showEp1}
                          onChange={(e) => {
                            if (activeStagesCount === 1 && colVisibility.showEp1) return;
                            setColVisibility((prev) => ({ ...prev, showEp1: e.target.checked }));
                          }}
                        />
                        <span>EP1 (Julio)</span>
                      </label>
                      <label
                        className={`${styles.colEtapaPill} ${
                          colVisibility.showEp2 ? styles.colEtapaPillActive : ''
                        }`}
                      >
                        <input
                          type="checkbox"
                          checked={colVisibility.showEp2}
                          onChange={(e) => {
                            if (activeStagesCount === 1 && colVisibility.showEp2) return;
                            setColVisibility((prev) => ({ ...prev, showEp2: e.target.checked }));
                          }}
                        />
                        <span>EP2 (Nov.)</span>
                      </label>
                    </div>
                  </div>

                  {/* Preguntas Individuales */}
                  {colVisibility.showPreguntas && preguntas.length > 0 && (
                    <div className={styles.colDropdownSection}>
                      <div className={styles.colSectionHeaderBetween}>
                        <span className={styles.colSectionLabel}>Ítems de Pregunta:</span>
                        <div className={styles.colQuickActions}>
                          <button
                            type="button"
                            onClick={() => {
                              const next: Record<number, boolean> = {};
                              preguntas.forEach((p, idx) => {
                                const o = p.order !== undefined ? Number(p.order) : idx + 1;
                                next[o] = true;
                              });
                              setColVisibility((prev) => ({ ...prev, preguntasVisibles: next }));
                            }}
                            className={styles.colQuickBtn}
                          >
                            Todas
                          </button>
                          <span className={styles.colQuickSep}>|</span>
                          <button
                            type="button"
                            onClick={() => {
                              const next: Record<number, boolean> = {};
                              preguntas.forEach((p, idx) => {
                                const o = p.order !== undefined ? Number(p.order) : idx + 1;
                                next[o] = false;
                              });
                              setColVisibility((prev) => ({ ...prev, preguntasVisibles: next }));
                            }}
                            className={styles.colQuickBtn}
                          >
                            Ninguna
                          </button>
                        </div>
                      </div>
                      <div className={styles.colQuestionsGrid}>
                        {preguntas.map((p, idx) => {
                          const order = p.order !== undefined ? Number(p.order) : idx + 1;
                          const isChecked = colVisibility.preguntasVisibles[order] !== false;
                          const qLabel = `P${order < 10 ? `0${order}` : order}`;
                          return (
                            <button
                              key={`col-q-${order}`}
                              type="button"
                              onClick={() => {
                                setColVisibility((prev) => ({
                                  ...prev,
                                  preguntasVisibles: {
                                    ...prev.preguntasVisibles,
                                    [order]: !isChecked,
                                  },
                                }));
                              }}
                              className={`${styles.colQuestionChip} ${
                                isChecked ? styles.colQuestionChipActive : ''
                              }`}
                              title={p.pregunta ? `${qLabel}: ${p.pregunta.slice(0, 50)}...` : qLabel}
                            >
                              {isChecked && <MdCheck className={styles.colChipCheck} />}
                              <span>{qLabel}</span>
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </div>

                <div className={styles.colDropdownFooter}>
                  <span className={styles.colSummaryInfo}>
                    {totalTableColumns - 2} columna(s) visibles
                  </span>
                  <button
                    type="button"
                    onClick={() => setShowColMenu(false)}
                    className={styles.colDoneBtn}
                  >
                    Listo
                  </button>
                </div>
              </div>
            )}
          </div>

          {onReload && (
            <button
              type="button"
              onClick={onReload}
              disabled={loading}
              className={styles.actionBtn}
              title="Recalcular matriz"
            >
              <MdRefresh className={loading ? 'animate-spin' : ''} />
              <span>Actualizar</span>
            </button>
          )}

          <button
            type="button"
            onClick={exportToExcel}
            disabled={loading || data.length === 0}
            className={`${styles.actionBtn} ${styles.exportBtn}`}
            title="Exportar a Excel"
          >
            <RiFileExcel2Line className={styles.excelIcon} />
            <span>Exportar Excel</span>
          </button>

          <button
            type="button"
            onClick={toggleFullscreen}
            className={`${styles.fullscreenBtn} ${isFullScreen ? styles.fullscreenBtnActive : ''}`}
            title={isFullScreen ? 'Salir de pantalla completa (Esc)' : 'Pantalla completa'}
            aria-label={isFullScreen ? 'Salir de pantalla completa' : 'Pantalla completa'}
          >
            {isFullScreen ? (
              <MdFullscreenExit className={styles.fullscreenIcon} />
            ) : (
              <MdFullscreen className={styles.fullscreenIcon} />
            )}
          </button>
        </div>
      </div>

      {/* Contenedor con Scroll de la Tabla */}
      <div className={styles.tableScroll}>
        <table className={styles.table}>
          <thead>
            {/* Fila 1: Cabeceras principales agrupadas */}
            <tr className={styles.mainHeaderRow}>
              <th rowSpan={2} className={`${styles.thFixed} ${styles.colIndex}`}>
                N°
              </th>
              <th rowSpan={2} className={`${styles.thFixed} ${styles.colUgel}`}>
                UGEL
              </th>

              {/* R.C */}
              {colVisibility.showRc && activeStagesCount > 0 && (
                <th
                  colSpan={activeStagesCount}
                  className={`${styles.thGroup} ${styles.groupRc}`}
                >
                  R.C (Aciertos Prom.)
                </th>
              )}

              {/* PUNTAJE */}
              {colVisibility.showPuntaje && activeStagesCount > 0 && (
                <th
                  colSpan={activeStagesCount}
                  className={`${styles.thGroup} ${styles.groupPuntaje}`}
                >
                  PUNTAJE
                </th>
              )}

              {/* NIVEL DE LOGRO */}
              {colVisibility.showNiveles && activeStagesCount > 0 && (
                <th
                  colSpan={activeStagesCount}
                  className={`${styles.thGroup} ${styles.groupNivel}`}
                >
                  NIVEL DE LOGRO
                </th>
              )}

              {/* PREGUNTAS (P01, P02, etc.) */}
              {colVisibility.showPreguntas &&
                activeStagesCount > 0 &&
                visiblePreguntas.map((p, idx) => {
                  const order = p.order !== undefined ? Number(p.order) : idx + 1;
                  const isQuestionActive = questionPopover?.order === order;
                  return (
                    <th
                      key={`q-group-${order}`}
                      colSpan={activeStagesCount}
                      className={`${styles.thGroup} ${styles.groupQuestion} ${styles.groupQuestionInteractive} ${
                        isQuestionActive ? styles.groupQuestionActive : ''
                      }`}
                      onClick={(e) => handleQuestionGroupClick(e, order)}
                      title={`Haz clic para ver la pregunta y actuación de P${order < 10 ? `0${order}` : order}`}
                      style={{ cursor: 'pointer' }}
                    >
                      P{order < 10 ? `0${order}` : order}
                    </th>
                  );
                })}
            </tr>

            {/* Fila 2: Sub-cabeceras de etapas (EDI, EP1, EP2) */}
            <tr className={styles.subHeaderRow}>
              {/* R.C Subheaders */}
              {colVisibility.showRc &&
                activeStages.map((etapa) => (
                  <th
                    key={`sub-rc-${etapa}`}
                    className={`${styles.thSub} ${styles[`sub${etapa.charAt(0).toUpperCase() + etapa.slice(1)}`]}`}
                  >
                    {etapa.toUpperCase()}
                  </th>
                ))}

              {/* PUNTAJE Subheaders */}
              {colVisibility.showPuntaje &&
                activeStages.map((etapa) => (
                  <th
                    key={`sub-puntaje-${etapa}`}
                    className={`${styles.thSub} ${styles[`sub${etapa.charAt(0).toUpperCase() + etapa.slice(1)}`]}`}
                  >
                    {etapa.toUpperCase()}
                  </th>
                ))}

              {/* NIVEL DE LOGRO Subheaders */}
              {colVisibility.showNiveles &&
                activeStages.map((etapa) => (
                  <th
                    key={`sub-nivel-${etapa}`}
                    className={`${styles.thSub} ${styles[`sub${etapa.charAt(0).toUpperCase() + etapa.slice(1)}`]}`}
                  >
                    {etapa.toUpperCase()}
                  </th>
                ))}

              {/* PREGUNTAS Subheaders */}
              {colVisibility.showPreguntas &&
                visiblePreguntas.map((p, idx) => {
                  const order = p.order !== undefined ? Number(p.order) : idx + 1;
                  return (
                    <React.Fragment key={`sub-q-wrap-${order}`}>
                      {activeStages.map((etapa) => {
                        const isActive =
                          activePopover?.order === order &&
                          activePopover?.etapa === etapa &&
                          activePopover?.type === 'header';

                        return (
                          <th
                            key={`sub-q-${order}-${etapa}`}
                            className={`${styles.thSub} ${
                              styles[`sub${etapa.charAt(0).toUpperCase() + etapa.slice(1)}`]
                            } ${isActive ? styles.thSubActive : ''}`}
                            onClick={(e) => handleHeaderClick(e, order, etapa)}
                            title="Haz clic para ver aciertos regionales"
                            style={{ cursor: 'pointer' }}
                          >
                            {etapa.toUpperCase()}
                          </th>
                        );
                      })}
                    </React.Fragment>
                  );
                })}
            </tr>

            {/* Fila Opcional: Promedio Regional */}
            {regionalSummary && (
              <tr className={styles.summaryRow}>
                <td colSpan={2} className={styles.summaryLabel}>
                  PROMEDIO REGIONAL
                </td>
                {/* RC */}
                {colVisibility.showRc &&
                  activeStages.map((etapa) => (
                    <td key={`reg-rc-${etapa}`} className={styles.summaryCell}>
                      {regionalSummary.rc[etapa] ?? '-'}
                    </td>
                  ))}
                {/* Puntaje */}
                {colVisibility.showPuntaje &&
                  activeStages.map((etapa) => {
                    const sNivel = getNivelDataForPuntaje(regionalSummary.puntaje[etapa], etapa);

                    return (
                      <td
                        key={`reg-puntaje-${etapa}`}
                        className={`${styles.summaryCell} ${sNivel ? styles.tdPuntajeNivel : ''}`}
                        style={
                          sNivel
                            ? { backgroundColor: sNivel.color, color: '#ffffff' }
                            : undefined
                        }
                        title={
                          sNivel
                            ? `Promedio Regional: ${regionalSummary.puntaje[etapa]} · Nivel: ${sNivel.nivel}`
                            : undefined
                        }
                      >
                        {regionalSummary.puntaje[etapa] ?? '-'}
                      </td>
                    );
                  })}
                {/* Nivel de Logro Regional (3 columnas: EDI, EP1, EP2) */}
                {colVisibility.showNiveles &&
                  activeStages.map((etapa) => {
                    const regRow: UgelMatrizComparativaRow = {
                      index: 0,
                      id: 0,
                      nombre: 'PROMEDIO REGIONAL',
                      nombreCorto: 'REGIONAL',
                      totalEstudiantes: {
                        edi: data.reduce((acc, r) => acc + (r.totalEstudiantes.edi || 0), 0),
                        ep1: data.reduce((acc, r) => acc + (r.totalEstudiantes.ep1 || 0), 0),
                        ep2: data.reduce((acc, r) => acc + (r.totalEstudiantes.ep2 || 0), 0),
                      },
                      rc: regionalSummary.rc,
                      puntaje: regionalSummary.puntaje,
                      niveles: regionalSummary.niveles || [],
                      preguntas: {},
                    };

                    return (
                      <td
                        key={`reg-nivel-${etapa}`}
                        className={`${styles.tdNivelCol} ${
                          nivelPopover?.row.id === 0 && nivelPopover?.selectedEtapa === etapa
                            ? styles.tdNivelColActive
                            : ''
                        }`}
                        onClick={(e) => handleNivelCellClick(e, regRow, etapa)}
                        title="Haz clic para ver desglose y variación de niveles a nivel regional"
                      >
                        <div className={styles.nivelColBoxes}>
                          {(regionalSummary.niveles || []).map((n, nIdx) => {
                            const stat = n[etapa];
                            return (
                              <div
                                key={`reg-n-${etapa}-${nIdx}`}
                                className={styles.nivelColorBox}
                                style={{ backgroundColor: getNivelColor(n.nivel, n.color) }}
                                title={`Regional ${n.nivel} (${etapa.toUpperCase()}): ${
                                  stat
                                    ? `${stat.cantidad.toLocaleString('es-PE')} estudiantes (${stat.porcentaje}%)`
                                    : 'Sin datos'
                                }`}
                              >
                                {stat !== undefined ? `${stat.porcentaje}%` : '-'}
                              </div>
                            );
                          })}
                        </div>
                      </td>
                    );
                  })}
                {/* Preguntas */}
                {colVisibility.showPreguntas &&
                  visiblePreguntas.map((p, pIdx) => {
                    const order = p.order !== undefined ? Number(p.order) : pIdx + 1;
                    const qReg = regionalSummary?.preguntas?.[order];

                    return (
                      <React.Fragment key={`sum-q-${order}`}>
                        {activeStages.map((etapa) => {
                          const stat = qReg?.[etapa];
                          return (
                            <td
                              key={`sum-q-${order}-${etapa}`}
                              className={styles.summaryCell}
                              onClick={(e) => handleHeaderClick(e, order, etapa)}
                              style={{ cursor: 'pointer' }}
                              title="Haz clic para ver aciertos"
                            >
                              <span
                                className={`${styles.chip} ${getBadgeStyle(stat?.porcentaje)}`}
                              >
                                {vistaPreguntas === 'aciertos' && stat
                                  ? `${stat.correctas}/${stat.total}`
                                  : stat !== undefined
                                  ? `${stat.porcentaje}%`
                                  : '-'}
                              </span>
                            </td>
                          );
                        })}
                      </React.Fragment>
                    );
                  })}
              </tr>
            )}
          </thead>

          <tbody>
            {loading ? (
              <tr>
                <td colSpan={totalTableColumns} className={styles.loadingCell}>
                  <div className={styles.loadingState}>
                    <RiLoader4Line className="animate-spin" />
                    <span>Cargando y sincronizando datos de las evaluaciones...</span>
                  </div>
                </td>
              </tr>
            ) : filteredData.length === 0 ? (
              <tr>
                <td colSpan={totalTableColumns} className={styles.emptyCell}>
                  No se encontraron resultados para la búsqueda o no hay evaluaciones asignadas.
                </td>
              </tr>
            ) : (
              filteredData.map((row) => (
                <tr key={row.id} className={styles.bodyRow}>
                  {/* N° */}
                  <td className={`${styles.tdFixed} ${styles.colIndex}`}>
                    {row.index}
                  </td>

                  {/* UGEL */}
                  <td className={`${styles.tdFixed} ${styles.colUgel}`}>
                    <span className={styles.ugelName}>{row.nombre}</span>
                  </td>

                  {/* R.C */}
                  {colVisibility.showRc &&
                    activeStages.map((etapa) => (
                      <td
                        key={`row-${row.id}-rc-${etapa}`}
                        className={`${styles.tdVal} ${styles[`sub${etapa.charAt(0).toUpperCase() + etapa.slice(1)}`]}`}
                      >
                        {row.rc[etapa] !== undefined ? row.rc[etapa] : '-'}
                      </td>
                    ))}

                  {/* PUNTAJE */}
                  {colVisibility.showPuntaje &&
                    activeStages.map((etapa) => {
                      const pt = row.puntaje[etapa];
                      const nivelPt = getNivelDataForPuntaje(pt, etapa);

                      return (
                        <td
                          key={`row-${row.id}-pt-${etapa}`}
                          className={`${styles.tdVal} ${
                            !nivelPt ? styles[`sub${etapa.charAt(0).toUpperCase() + etapa.slice(1)}`] : styles.tdPuntajeNivel
                          }`}
                          style={
                            nivelPt
                              ? { backgroundColor: nivelPt.color, color: '#ffffff' }
                              : undefined
                          }
                          title={
                            nivelPt
                              ? `Puntaje: ${pt} · Nivel: ${nivelPt.nivel}`
                              : undefined
                          }
                        >
                          {pt !== undefined ? pt : '-'}
                        </td>
                      );
                    })}

                  {/* NIVEL DE LOGRO */}
                  {colVisibility.showNiveles &&
                    activeStages.map((etapa) => (
                      <td
                        key={`row-${row.id}-lvl-${etapa}`}
                        className={`${styles.tdNivelCol} ${styles[`sub${etapa.charAt(0).toUpperCase() + etapa.slice(1)}`]} ${
                          nivelPopover?.row.id === row.id && nivelPopover?.selectedEtapa === etapa
                            ? styles.tdNivelColActive
                            : ''
                        }`}
                        onClick={(e) => handleNivelCellClick(e, row, etapa)}
                        title={`Haz clic para ver desglose y variación de niveles de logro en ${row.nombre}`}
                      >
                        <div className={styles.nivelColBoxes}>
                          {row.niveles.map((n, nIdx) => (
                            <div
                              key={`${etapa}-n-${row.id}-${nIdx}`}
                              className={styles.nivelColorBox}
                              style={{ backgroundColor: getNivelColor(n.nivel, n.color) }}
                              title={`${n.nivel} (${etapa.toUpperCase()}): ${
                                n[etapa] ? `${n[etapa].cantidad} estudiantes (${n[etapa].porcentaje}%)` : 'Sin datos'
                              }`}
                            >
                              {n[etapa] !== undefined ? `${n[etapa].porcentaje}%` : '-'}
                            </div>
                          ))}
                        </div>
                      </td>
                    ))}

                  {/* PREGUNTAS */}
                  {colVisibility.showPreguntas &&
                    visiblePreguntas.map((p, pIdx) => {
                      const order = p.order !== undefined ? Number(p.order) : pIdx + 1;
                      const pStat = row.preguntas[order];

                      return (
                        <React.Fragment key={`q-cell-${row.id}-${order}`}>
                          {activeStages.map((etapa) => {
                            const stat = pStat?.[etapa];
                            return (
                              <td
                                key={`q-cell-${row.id}-${order}-${etapa}`}
                                className={`${styles.tdQuestion} ${styles[`sub${etapa.charAt(0).toUpperCase() + etapa.slice(1)}`]}`}
                                onClick={(e) => handleQuestionCellClick(e, row, order, etapa)}
                                style={{ cursor: 'pointer' }}
                                title="Haz clic para ver análisis comparativo del ítem"
                              >
                                <span
                                  className={`${styles.chip} ${getBadgeStyle(stat?.porcentaje)}`}
                                >
                                  {vistaPreguntas === 'aciertos' && stat
                                    ? `${stat.correctas}/${stat.total}`
                                    : stat !== undefined
                                    ? `${stat.porcentaje}%`
                                    : '-'}
                                </span>
                              </td>
                            );
                          })}
                        </React.Fragment>
                      );
                    })}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Popover flotante interactivo al hacer click */}
      {activePopover && (
        <div
          ref={popoverRef}
          className={styles.clickPopover}
          style={{
            top: `${activePopover.coords.y}px`,
            left: `${activePopover.coords.x}px`,
          }}
          onClick={(e) => e.stopPropagation()}
        >
          <div className={styles.clickPopoverHeader}>
            <div className={styles.popoverHeaderTitles}>
              <span className={styles.popoverBadge}>{activePopover.etapa.toUpperCase()}</span>
              <strong className={styles.popoverMainTitle}>{activePopover.title}</strong>
            </div>
            <button
              type="button"
              className={styles.popoverCloseBtn}
              onClick={() => setActivePopover(null)}
              aria-label="Cerrar"
            >
              <MdClose />
            </button>
          </div>

          <div className={styles.clickPopoverBody}>
            <span className={styles.popoverSubtitle}>{activePopover.subtitle}</span>

            <div className={styles.popoverMetricBox}>
              <span className={styles.popoverBigNumber}>
                {activePopover.total > 0
                  ? `${activePopover.correctas.toLocaleString('es-PE')} / ${activePopover.total.toLocaleString('es-PE')}`
                  : '0 / 0'}
              </span>
              <span className={styles.popoverMetricDesc}>
                {activePopover.total > 0
                  ? `${activePopover.porcentaje}% de aciertos`
                  : 'Sin evaluaciones registradas'}
              </span>
            </div>

            {activePopover.total > 0 && (
              <div className={styles.popoverProgressBar}>
                <div
                  className={styles.popoverProgressFill}
                  style={{
                    width: `${activePopover.porcentaje}%`,
                    backgroundColor:
                      activePopover.porcentaje >= 70
                        ? '#22c55e'
                        : activePopover.porcentaje >= 50
                        ? '#eab308'
                        : '#ef4444',
                  }}
                />
              </div>
            )}
          </div>
        </div>
      )}

      {/* Popover interactivo para Pregunta y Actuación al hacer click en P01, P02... */}
      {questionPopover && (
        <QuestionDetailPopover
          order={questionPopover.order}
          initialEtapa={questionPopover.selectedEtapa}
          coords={questionPopover.coords}
          onClose={() => setQuestionPopover(null)}
          evaluacionEdi={evaluacionEdi}
          evaluacionEp1={evaluacionEp1}
          evaluacionEp2={evaluacionEp2}
          preguntas={preguntas}
          gradoName={gradoName}
        />
      )}

      {/* Popover Interactivo de Niveles de Logro - MATRIZ COMPACTA */}
      {nivelPopover && (
        <div
          ref={nivelPopoverRef}
          className={styles.nivelPopover}
          style={{
            top: nivelPopover.coords.y,
            left: nivelPopover.coords.x,
          }}
        >
          {/* Header */}
          <div className={styles.nivelPopoverHeader}>
            <div className={styles.nivelPopoverTitleGroup}>
              <span className={styles.nivelPopoverBadge}>
                <MdBarChart />
                Niveles
              </span>
              <div className={styles.nivelPopoverTitleWrapper}>
                <h4 className={styles.nivelPopoverTitle}>{nivelPopover.row.nombre}</h4>
                <span className={styles.nivelPopoverSubtitle}>
                  Matriz comparativa de niveles de logro
                </span>
              </div>
            </div>
            <button
              type="button"
              className={styles.popoverCloseBtn}
              onClick={() => setNivelPopover(null)}
              aria-label="Cerrar"
            >
              <MdClose />
            </button>
          </div>

          {/* Body: Matriz de Niveles a primera vista */}
          <div className={styles.nivelPopoverBody}>
            {(() => {
              const hasEp2 =
                !!evaluacionEp2 ||
                nivelPopover.row.totalEstudiantes.ep2 !== undefined ||
                nivelPopover.row.niveles.some((n) => n.ep2 !== undefined);

              const totEdi = nivelPopover.row.totalEstudiantes.edi;
              const totEp1 = nivelPopover.row.totalEstudiantes.ep1;
              const totEp2 = nivelPopover.row.totalEstudiantes.ep2;
              const totalDiff =
                totEdi !== undefined && totEp1 !== undefined ? totEp1 - totEdi : null;

              return (
                <table className={styles.nivelMatrixTable}>
                  <thead>
                    <tr>
                      <th className={styles.matrixThNivel}>Nivel de Logro</th>
                      <th
                        className={`${styles.matrixThEtapa} ${
                          nivelPopover.selectedEtapa === 'edi' ? styles.matrixThSelected : ''
                        }`}
                      >
                        <span>EDI</span>
                        <small className={styles.matrixThSub}>(Marzo)</small>
                      </th>
                      <th
                        className={`${styles.matrixThEtapa} ${
                          nivelPopover.selectedEtapa === 'ep1' ? styles.matrixThSelected : ''
                        }`}
                      >
                        <span>EP1</span>
                        <small className={styles.matrixThSub}>(Julio)</small>
                      </th>
                      {hasEp2 && (
                        <th
                          className={`${styles.matrixThEtapa} ${
                            nivelPopover.selectedEtapa === 'ep2' ? styles.matrixThSelected : ''
                          }`}
                        >
                          <span>EP2</span>
                          <small className={styles.matrixThSub}>(Nov.)</small>
                        </th>
                      )}
                      <th className={styles.matrixThTrend}>Variación (EDI ➔ EP1)</th>
                    </tr>
                  </thead>
                  <tbody>
                    {nivelPopover.row.niveles.map((n, idx) => {
                      const pEdi = n.edi?.porcentaje;
                      const pEp1 = n.ep1?.porcentaje;
                      const pEp2 = n.ep2?.porcentaje;

                      const hasEdiAndEp1 = pEdi !== undefined && pEp1 !== undefined;
                      const diffEp1Edi = hasEdiAndEp1 ? pEp1 - pEdi : null;
                      const nivelColor = getNivelColor(n.nivel, n.color);

                      return (
                        <tr key={`pop-lvl-${idx}`} className={styles.matrixRow}>
                          {/* Columna Nivel */}
                          <td className={styles.matrixTdNivel}>
                            <span
                              className={styles.matrixNivelPill}
                              style={{ backgroundColor: nivelColor }}
                            >
                              {n.nivel}
                            </span>
                          </td>

                          {/* Columna EDI */}
                          <td
                            className={`${styles.matrixTdEtapa} ${
                              nivelPopover.selectedEtapa === 'edi' ? styles.matrixTdSelected : ''
                            }`}
                          >
                            {n.edi !== undefined ? (
                              <div className={styles.matrixValGroup}>
                                <span className={styles.matrixValPct}>{n.edi.porcentaje}%</span>
                                <span className={styles.matrixValCount}>
                                  {n.edi.cantidad.toLocaleString('es-PE')} est.
                                </span>
                              </div>
                            ) : (
                              <span className={styles.matrixEmpty}>-</span>
                            )}
                          </td>

                          {/* Columna EP1 */}
                          <td
                            className={`${styles.matrixTdEtapa} ${
                              nivelPopover.selectedEtapa === 'ep1' ? styles.matrixTdSelected : ''
                            }`}
                          >
                            {n.ep1 !== undefined ? (
                              <div className={styles.matrixValGroup}>
                                <span className={styles.matrixValPct}>{n.ep1.porcentaje}%</span>
                                <span className={styles.matrixValCount}>
                                  {n.ep1.cantidad.toLocaleString('es-PE')} est.
                                </span>
                              </div>
                            ) : (
                              <span className={styles.matrixEmpty}>-</span>
                            )}
                          </td>

                          {/* Columna EP2 */}
                          {hasEp2 && (
                            <td
                              className={`${styles.matrixTdEtapa} ${
                                nivelPopover.selectedEtapa === 'ep2' ? styles.matrixTdSelected : ''
                              }`}
                            >
                              {n.ep2 !== undefined ? (
                                <div className={styles.matrixValGroup}>
                                  <span className={styles.matrixValPct}>{n.ep2.porcentaje}%</span>
                                  <span className={styles.matrixValCount}>
                                    {n.ep2.cantidad.toLocaleString('es-PE')} est.
                                  </span>
                                </div>
                              ) : (
                                <span className={styles.matrixEmpty}>-</span>
                              )}
                            </td>
                          )}

                          {/* Columna Variación */}
                          <td className={styles.matrixTdTrend}>
                            {diffEp1Edi !== null ? (
                              <span
                                className={`${styles.matrixVarBadge} ${
                                  diffEp1Edi > 0
                                    ? styles.variationIncrement
                                    : diffEp1Edi < 0
                                    ? styles.variationDecrement
                                    : styles.variationNeutral
                                }`}
                                title={`Variación EDI a EP1: ${
                                  diffEp1Edi > 0 ? `+${diffEp1Edi}%` : `${diffEp1Edi}%`
                                }`}
                              >
                                {diffEp1Edi > 0 ? (
                                  <>
                                    <MdTrendingUp className={styles.matrixVarIcon} />
                                    <span>+{diffEp1Edi}%</span>
                                    <small className={styles.matrixVarLabel}>Incrementó</small>
                                  </>
                                ) : diffEp1Edi < 0 ? (
                                  <>
                                    <MdTrendingDown className={styles.matrixVarIcon} />
                                    <span>{diffEp1Edi}%</span>
                                    <small className={styles.matrixVarLabel}>Disminuyó</small>
                                  </>
                                ) : (
                                  <>
                                    <MdTrendingFlat className={styles.matrixVarIcon} />
                                    <span>0%</span>
                                    <small className={styles.matrixVarLabel}>Sin cambio</small>
                                  </>
                                )}
                              </span>
                            ) : (
                              <span className={styles.matrixEmpty}>-</span>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                  <tfoot>
                    <tr className={styles.matrixTotalRow}>
                      <td className={styles.matrixTotalLabel}>Total Estudiantes</td>
                      <td
                        className={`${styles.matrixTotalVal} ${
                          nivelPopover.selectedEtapa === 'edi' ? styles.matrixTdSelected : ''
                        }`}
                      >
                        {totEdi !== undefined ? `${totEdi.toLocaleString('es-PE')} est.` : '-'}
                      </td>
                      <td
                        className={`${styles.matrixTotalVal} ${
                          nivelPopover.selectedEtapa === 'ep1' ? styles.matrixTdSelected : ''
                        }`}
                      >
                        {totEp1 !== undefined ? `${totEp1.toLocaleString('es-PE')} est.` : '-'}
                      </td>
                      {hasEp2 && (
                        <td
                          className={`${styles.matrixTotalVal} ${
                            nivelPopover.selectedEtapa === 'ep2' ? styles.matrixTdSelected : ''
                          }`}
                        >
                          {totEp2 !== undefined ? `${totEp2.toLocaleString('es-PE')} est.` : '-'}
                        </td>
                      )}
                      <td className={styles.matrixTotalDiff}>
                        {totalDiff !== null ? (
                          <span
                            className={totalDiff >= 0 ? styles.totalDiffPos : styles.totalDiffNeg}
                            title="Diferencia en total de evaluados entre EP1 y EDI"
                          >
                            {totalDiff >= 0
                              ? `+${totalDiff.toLocaleString('es-PE')}`
                              : totalDiff.toLocaleString('es-PE')}{' '}
                            est.
                          </span>
                        ) : (
                          '-'
                        )}
                      </td>
                    </tr>
                  </tfoot>
                </table>
              );
            })()}
          </div>
        </div>
      )}

      {/* Popover interactivo de Matriz Comparativa de Pregunta por UGEL */}
      {questionCellPopover && (
        <div
          ref={questionCellPopoverRef}
          className={styles.questionCellPopover}
          style={{
            top: questionCellPopover.coords.y,
            left: questionCellPopover.coords.x,
          }}
        >
          {/* Header */}
          <div className={styles.questionCellPopoverHeader}>
            <div className={styles.questionCellTitleGroup}>
              <span className={styles.questionCellBadge}>
                P{questionCellPopover.order < 10 ? `0${questionCellPopover.order}` : questionCellPopover.order}
              </span>
              <div className={styles.questionCellTitleWrapper}>
                <h4 className={styles.questionCellTitle}>{questionCellPopover.row.nombre}</h4>
                <span className={styles.questionCellSubtitle}>
                  {selectedQuestionCellInfo?.stageSpecificQ?.preguntaDocente
                    ? `Actuación: ${selectedQuestionCellInfo.stageSpecificQ.preguntaDocente}`
                    : `Análisis comparativo del ítem P${questionCellPopover.order}`}
                </span>
              </div>
            </div>
            <button
              type="button"
              className={styles.popoverCloseBtn}
              onClick={() => setQuestionCellPopover(null)}
              aria-label="Cerrar"
            >
              <MdClose />
            </button>
          </div>

          {/* Body */}
          <div className={styles.questionCellPopoverBody}>
            {(() => {
              const order = questionCellPopover.order;
              const qStat = questionCellPopover.row.preguntas?.[order];
              const pEdi = qStat?.edi?.porcentaje;
              const pEp1 = qStat?.ep1?.porcentaje;
              const pEp2 = qStat?.ep2?.porcentaje;
              const diffEp1Edi = pEdi !== undefined && pEp1 !== undefined ? pEp1 - pEdi : null;

              const regQStat = regionalSummary?.preguntas?.[order];
              const regEdi = regQStat?.edi?.porcentaje;
              const regEp1 = regQStat?.ep1?.porcentaje;
              const regEp2 = regQStat?.ep2?.porcentaje;
              const diffReg = regEdi !== undefined && regEp1 !== undefined ? regEp1 - regEdi : null;

              const hasEp2 =
                !!evaluacionEp2 ||
                questionCellPopover.row.totalEstudiantes.ep2 !== undefined ||
                qStat?.ep2 !== undefined;

              return (
                <>
                  <table className={styles.nivelMatrixTable}>
                    <thead>
                      <tr>
                        <th className={styles.matrixThNivel}>Referencia</th>
                        <th
                          className={`${styles.matrixThEtapa} ${
                            questionCellPopover.selectedEtapa === 'edi' ? styles.matrixThSelected : ''
                          }`}
                        >
                          <span>EDI</span>
                          <small className={styles.matrixThSub}>(Marzo)</small>
                        </th>
                        <th
                          className={`${styles.matrixThEtapa} ${
                            questionCellPopover.selectedEtapa === 'ep1' ? styles.matrixThSelected : ''
                          }`}
                        >
                          <span>EP1</span>
                          <small className={styles.matrixThSub}>(Julio)</small>
                        </th>
                        {hasEp2 && (
                          <th
                            className={`${styles.matrixThEtapa} ${
                              questionCellPopover.selectedEtapa === 'ep2' ? styles.matrixThSelected : ''
                            }`}
                          >
                            <span>EP2</span>
                            <small className={styles.matrixThSub}>(Nov.)</small>
                          </th>
                        )}
                        <th className={styles.matrixThTrend}>Variación (EDI ➔ EP1)</th>
                      </tr>
                    </thead>
                    <tbody>
                      {/* Fila UGEL */}
                      <tr className={styles.matrixRow}>
                        <td className={styles.matrixTdNivel}>
                          <div className={styles.qRefTag}>
                            <span className={styles.qUgelPill}>UGEL</span>
                            <strong className={styles.qRefTitle}>
                              {questionCellPopover.row.nombreCorto || questionCellPopover.row.nombre}
                            </strong>
                          </div>
                        </td>

                        {/* EDI */}
                        <td
                          className={`${styles.matrixTdEtapa} ${
                            questionCellPopover.selectedEtapa === 'edi' ? styles.matrixTdSelected : ''
                          }`}
                        >
                          {qStat?.edi !== undefined ? (
                            <div className={styles.matrixValGroup}>
                              <span className={styles.matrixValPct}>{qStat.edi.porcentaje}%</span>
                              <span className={styles.matrixValCount}>
                                {qStat.edi.correctas.toLocaleString('es-PE')} /{' '}
                                {qStat.edi.total.toLocaleString('es-PE')} est.
                              </span>
                            </div>
                          ) : (
                            <span className={styles.matrixEmpty}>-</span>
                          )}
                        </td>

                        {/* EP1 */}
                        <td
                          className={`${styles.matrixTdEtapa} ${
                            questionCellPopover.selectedEtapa === 'ep1' ? styles.matrixTdSelected : ''
                          }`}
                        >
                          {qStat?.ep1 !== undefined ? (
                            <div className={styles.matrixValGroup}>
                              <span className={styles.matrixValPct}>{qStat.ep1.porcentaje}%</span>
                              <span className={styles.matrixValCount}>
                                {qStat.ep1.correctas.toLocaleString('es-PE')} /{' '}
                                {qStat.ep1.total.toLocaleString('es-PE')} est.
                              </span>
                            </div>
                          ) : (
                            <span className={styles.matrixEmpty}>-</span>
                          )}
                        </td>

                        {/* EP2 */}
                        {hasEp2 && (
                          <td
                            className={`${styles.matrixTdEtapa} ${
                              questionCellPopover.selectedEtapa === 'ep2' ? styles.matrixTdSelected : ''
                            }`}
                          >
                            {qStat?.ep2 !== undefined ? (
                              <div className={styles.matrixValGroup}>
                                <span className={styles.matrixValPct}>{qStat.ep2.porcentaje}%</span>
                                <span className={styles.matrixValCount}>
                                  {qStat.ep2.correctas.toLocaleString('es-PE')} /{' '}
                                  {qStat.ep2.total.toLocaleString('es-PE')} est.
                                </span>
                              </div>
                            ) : (
                              <span className={styles.matrixEmpty}>-</span>
                            )}
                          </td>
                        )}

                        {/* Variación UGEL */}
                        <td className={styles.matrixTdTrend}>
                          {diffEp1Edi !== null ? (
                            <span
                              className={`${styles.matrixVarBadge} ${
                                diffEp1Edi > 0
                                  ? styles.matrixVarInc
                                  : diffEp1Edi < 0
                                  ? styles.matrixVarDec
                                  : styles.matrixVarNeu
                              }`}
                              title={`Variación en la UGEL: ${
                                diffEp1Edi > 0 ? `+${diffEp1Edi}%` : `${diffEp1Edi}%`
                              }`}
                            >
                              {diffEp1Edi > 0 ? (
                                <>
                                  <MdTrendingUp className={styles.matrixVarIcon} />
                                  <span>+{diffEp1Edi}%</span>
                                  <small className={styles.matrixVarLabel}>Incrementó</small>
                                </>
                              ) : diffEp1Edi < 0 ? (
                                <>
                                  <MdTrendingDown className={styles.matrixVarIcon} />
                                  <span>{diffEp1Edi}%</span>
                                  <small className={styles.matrixVarLabel}>Disminuyó</small>
                                </>
                              ) : (
                                <>
                                  <MdTrendingFlat className={styles.matrixVarIcon} />
                                  <span>0%</span>
                                  <small className={styles.matrixVarLabel}>Sin cambio</small>
                                </>
                              )}
                            </span>
                          ) : (
                            <span className={styles.matrixEmpty}>-</span>
                          )}
                        </td>
                      </tr>

                      {/* Fila Promedio Regional */}
                      {regQStat && (
                        <tr className={`${styles.matrixRow} ${styles.matrixRegionalRow}`}>
                          <td className={styles.matrixTdNivel}>
                            <div className={styles.qRefTag}>
                              <span className={styles.qRegionPill}>Región</span>
                              <span className={styles.qRefTitle}>Promedio Regional</span>
                            </div>
                          </td>

                          {/* EDI Región */}
                          <td
                            className={`${styles.matrixTdEtapa} ${
                              questionCellPopover.selectedEtapa === 'edi' ? styles.matrixTdSelected : ''
                            }`}
                          >
                            {regQStat.edi !== undefined ? (
                              <div className={styles.matrixValGroup}>
                                <span className={styles.matrixValPct}>{regQStat.edi.porcentaje}%</span>
                                <span className={styles.matrixValCount}>
                                  {regQStat.edi.correctas.toLocaleString('es-PE')} /{' '}
                                  {regQStat.edi.total.toLocaleString('es-PE')} est.
                                </span>
                              </div>
                            ) : (
                              <span className={styles.matrixEmpty}>-</span>
                            )}
                          </td>

                          {/* EP1 Región */}
                          <td
                            className={`${styles.matrixTdEtapa} ${
                              questionCellPopover.selectedEtapa === 'ep1' ? styles.matrixTdSelected : ''
                            }`}
                          >
                            {regQStat.ep1 !== undefined ? (
                              <div className={styles.matrixValGroup}>
                                <span className={styles.matrixValPct}>{regQStat.ep1.porcentaje}%</span>
                                <span className={styles.matrixValCount}>
                                  {regQStat.ep1.correctas.toLocaleString('es-PE')} /{' '}
                                  {regQStat.ep1.total.toLocaleString('es-PE')} est.
                                </span>
                              </div>
                            ) : (
                              <span className={styles.matrixEmpty}>-</span>
                            )}
                          </td>

                          {/* EP2 Región */}
                          {hasEp2 && (
                            <td
                              className={`${styles.matrixTdEtapa} ${
                                questionCellPopover.selectedEtapa === 'ep2' ? styles.matrixTdSelected : ''
                              }`}
                            >
                              {regQStat.ep2 !== undefined ? (
                                <div className={styles.matrixValGroup}>
                                  <span className={styles.matrixValPct}>{regQStat.ep2.porcentaje}%</span>
                                  <span className={styles.matrixValCount}>
                                    {regQStat.ep2.correctas.toLocaleString('es-PE')} /{' '}
                                    {regQStat.ep2.total.toLocaleString('es-PE')} est.
                                  </span>
                                </div>
                              ) : (
                                <span className={styles.matrixEmpty}>-</span>
                              )}
                            </td>
                          )}

                          {/* Variación Región */}
                          <td className={styles.matrixTdTrend}>
                            {diffReg !== null ? (
                              <span
                                className={`${styles.matrixVarBadge} ${
                                  diffReg > 0
                                    ? styles.matrixVarInc
                                    : diffReg < 0
                                    ? styles.matrixVarDec
                                    : styles.matrixVarNeu
                                }`}
                                title={`Variación regional: ${
                                  diffReg > 0 ? `+${diffReg}%` : `${diffReg}%`
                                }`}
                              >
                                {diffReg > 0 ? (
                                  <>
                                    <MdTrendingUp className={styles.matrixVarIcon} />
                                    <span>+{diffReg}%</span>
                                    <small className={styles.matrixVarLabel}>Incrementó</small>
                                  </>
                                ) : diffReg < 0 ? (
                                  <>
                                    <MdTrendingDown className={styles.matrixVarIcon} />
                                    <span>{diffReg}%</span>
                                    <small className={styles.matrixVarLabel}>Disminuyó</small>
                                  </>
                                ) : (
                                  <>
                                    <MdTrendingFlat className={styles.matrixVarIcon} />
                                    <span>0%</span>
                                    <small className={styles.matrixVarLabel}>Sin cambio</small>
                                  </>
                                )}
                              </span>
                            ) : (
                              <span className={styles.matrixEmpty}>-</span>
                            )}
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>

                  {/* Contexto Pedagógico del Ítem */}
                  {selectedQuestionCellInfo?.stageSpecificQ && (
                    <div className={styles.qContextBox}>
                      {selectedQuestionCellInfo.stageSpecificQ.pregunta && (
                        <div className={styles.qEnunciadoRow}>
                          <span className={styles.qEnunciadoLabel}>Enunciado:</span>
                          <p className={styles.qEnunciadoText}>
                            {selectedQuestionCellInfo.stageSpecificQ.pregunta}
                          </p>
                        </div>
                      )}
                      {selectedQuestionCellInfo.correctAltText && (
                        <div className={styles.qRespuestaRow}>
                          <span className={styles.qRespuestaLabel}>Clave correcta:</span>
                          <span className={styles.qRespuestaPill}>
                            {selectedQuestionCellInfo.correctAltText}
                          </span>
                        </div>
                      )}
                    </div>
                  )}
                </>
              );
            })()}
          </div>
        </div>
      )}
    </div>
  );
};

export default TablaMatrizComparativa;
