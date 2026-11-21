import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
  MdTrendingUp,
  MdPieChart,
  MdGroups,
  MdSchool,
  MdClass,
  MdMenuBook,
  MdCalculate,
  MdDashboard,
  MdInfoOutline,
  MdCheckCircle,
  MdFilterList,
  MdCheckBox,
  MdCheckBoxOutlineBlank,
  MdShowChart,
  MdBarChart,
  MdZoomIn,
  MdCompareArrows,
  MdOutlineLabel,
} from 'react-icons/md';
import { RiLoader4Line } from 'react-icons/ri';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  Filler,
} from 'chart.js';
import { Bar, Line } from 'react-chartjs-2';
import { getFunctions, httpsCallable } from 'firebase/functions';
import { getFirestore, collection, query, where, getDocs, doc, getDoc } from 'firebase/firestore';

import GraficoTendenciaColegio from '@/components/grafico-tendencia';
import { generarDataGraficoPiechart } from '@/features/utils/generar-data-grafico-piechart';
import { Evaluaciones, UserEstudiante } from '@/features/types/types';
import { useGlobalContext } from '@/features/context/GlolbalContext';
import { getCategoriasParaGrado } from '@/fuctions/categorias';
import { getGradoTexto } from '@/fuctions/regiones';
import { useEvaluacionesMatriz } from './useEvaluacionesMatriz';
import DirectorCategoriaTabs, {
  EmptyCategoriaState,
  formatCategoriaLabel,
} from './DirectorCategoriaTabs';
import { useDirectorTabsConfig } from './useDirectorTabsConfig';
import tabsStyles from './DirectorTabsNav.module.css';
import styles from '@/pages/directores/evaluaciones/evaluacion/reporte/Reporte.module.css';

// Registrar componentes de Chart.js
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

/**
 * Componente de carga localizada para los Gráficos de Tendencia.
 * Mantiene la barra de materias visible con feedback inmediato tipo skeleton.
 */
const TrendLoadingState: React.FC<{
  categoryName: string;
}> = ({ categoryName }) => {
  return (
    <div
      className="flex flex-col items-center justify-center py-12 sm:py-16 px-4 bg-slate-50/50 rounded-2xl border border-dashed border-slate-200/90 my-2 min-h-[380px] animate-fadeIn"
      role="status"
      aria-live="polite"
      aria-label={`Cargando gráficos de tendencia de ${categoryName}`}
    >
      <div className="relative flex items-center justify-center w-14 h-14 rounded-full bg-emerald-50 ring-8 ring-emerald-50/60 mb-3.5">
        <RiLoader4Line className="w-7 h-7 text-emerald-600 animate-spin" />
      </div>

      <h4 className="text-sm sm:text-base font-bold text-slate-800 mb-1">
        Cargando Gráficos de Tendencia · {categoryName}
      </h4>

      <p className="text-xs text-slate-500 max-w-md text-center mb-6 leading-relaxed">
        Sincronizando evaluaciones EDI, EP1 y EP2, promedios globales y distribución de niveles...
      </p>

      {/* Skeleton de gráficos simulados para retroalimentación visual de alta calidad */}
      <div className="w-full max-w-3xl bg-white rounded-xl border border-slate-200/80 p-4 shadow-2xs space-y-3.5 opacity-80">
        <div className="flex items-center justify-between pb-2 border-b border-slate-100">
          <div className="h-4 w-36 bg-slate-200 rounded animate-pulse" />
          <div className="flex gap-3">
            <div className="h-4 w-16 bg-slate-100 rounded animate-pulse" />
            <div className="h-4 w-16 bg-slate-100 rounded animate-pulse" />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 py-2">
          <div className="h-36 bg-slate-100 rounded-lg animate-pulse" />
          <div className="h-36 bg-slate-100 rounded-lg animate-pulse" />
        </div>
      </div>
    </div>
  );
};

const formatGradoDisplay = (gradoId: number): { label: string } => {
  if (gradoId === 12) return { label: '5 años' };
  if (gradoId >= 1 && gradoId <= 6) return { label: `${gradoId}° Primaria` };
  if (gradoId >= 7 && gradoId <= 11) return { label: `${gradoId - 6}° Secundaria` };
  return { label: getGradoTexto(gradoId) };
};

export type TrendSubTabKey = 'todos' | 'tendencia' | 'cobertura' | 'docentes';

export type EtapaKey = 'edi' | 'ep1' | 'ep2';

interface EtapaData {
  promedio: number;
  totalEstudiantes: number;
  satisfactorio: number;
  proceso: number;
  inicio: number;
  previo: number;
  hasData: boolean;
}

export interface DirectorTendenciasTabProps {
  evaluacion: Evaluaciones;
  datosPorMes: any;
  mesesConDataDisponibles: any[];
  promedioGlobal: any;
  monthSelected: number;
  yearSelected?: number;
  promedioPorDocente?: any[];
  evaluados: number;
  pendientes: number;
  listaPendientes: any[];
  estudiantesFiltrados: UserEstudiante[];
  evaluacionesDb?: any[];
  loadingEvaluaciones?: boolean;
  dniDirector?: string | number;
  dniDocente?: string | number;
  isDocenteView?: boolean;
  routeEvaluacionId?: string;
  estudiantes: UserEstudiante[];
  availableSections: Array<{ id: number | string; name: string }>;
  docentesMap: Map<string, string>;
  initialGrado?: number | string;
  initialSeccion?: string;
  isLoadingData?: boolean;
  onSelectEvaluacion?: (idEvaluacion: string, mesDelExamen?: number, grado?: number | string) => void;
  onSelectGrado?: (grado: number | string) => void;
  isAuditing?: boolean;
}

// Caché en memoria a nivel de módulo para evitar lecturas repetidas de etapas al alternar pestañas
const globalTendenciasEtapasCache = new Map<string, Record<string, EtapaData>>();

export const clearTendenciasEtapasCache = () => {
  globalTendenciasEtapasCache.clear();
};

export const DirectorTendenciasTab: React.FC<DirectorTendenciasTabProps> = ({
  evaluacion,
  datosPorMes,
  mesesConDataDisponibles,
  promedioGlobal,
  monthSelected,
  promedioPorDocente,
  evaluados,
  pendientes,
  listaPendientes,
  estudiantesFiltrados,
  estudiantes,
  availableSections,
  docentesMap,
  evaluacionesDb = [],
  yearSelected,
  dniDirector,
  dniDocente,
  isDocenteView = false,
  initialGrado,
  initialSeccion,
  isLoadingData,
  onSelectEvaluacion,
  onSelectGrado,
  isAuditing,
}) => {
  const { categorias: contextCategorias, currentUserData } = useGlobalContext();

  const [subTab, setSubTab] = useState<TrendSubTabKey>('todos');
  const [metricaNiveles, setMetricaNiveles] = useState<'pct' | 'cant'>('pct');

  // Controles switcheables para el gráfico de niveles:
  // 1. Tipo de gráfico: 'line' (Líneas) vs 'bar' (Barras agrupadas)
  const [tipoGraficoNiveles, setTipoGraficoNiveles] = useState<'line' | 'bar'>('line');
  // 2. Escala dinámica / Auto Zoom para amplificar diferencias mínimas
  const [escalaDinamicaNiveles, setEscalaDinamicaNiveles] = useState<boolean>(false);
  // 3. Cálculo y visualización de diferencias / deltas (Δ) en el tooltip
  const [mostrarDeltasTooltip, setMostrarDeltasTooltip] = useState<boolean>(true);
  // 4. Mostrar etiquetas con los valores siempre visibles sobre puntos y barras
  const [mostrarEtiquetasValores, setMostrarEtiquetasValores] = useState<boolean>(true);

  // Selector interactivo de etapas a visualizar/comparar (EDI, EP1, EP2)
  const [selectedEtapas, setSelectedEtapas] = useState<Array<EtapaKey>>(['edi', 'ep1', 'ep2']);

  const toggleEtapa = useCallback((key: EtapaKey) => {
    setSelectedEtapas((prev) => {
      if (prev.includes(key)) {
        if (prev.length <= 1) return prev;
        return prev.filter((k) => k !== key);
      } else {
        const order: EtapaKey[] = ['edi', 'ep1', 'ep2'];
        const next = [...prev, key];
        return order.filter((k) => next.includes(k));
      }
    });
  }, []);

  // Grado de la evaluación actual (siempre corresponde a la evaluación)
  const currentGrado =
    evaluacion?.grado !== undefined && evaluacion?.grado !== null
      ? Number(evaluacion.grado)
      : initialGrado !== undefined && initialGrado !== ''
      ? Number(initialGrado)
      : 2;

  // Estado de categoría activa (por defecto la de la evaluación o 1 = LEE)
  const [selectedCategoriaId, setSelectedCategoriaId] = useState<number>(() => {
    if (evaluacion?.categoria !== undefined && evaluacion?.categoria !== null) {
      return Number(evaluacion.categoria);
    }
    return 1;
  });

  // Integración de configuraciones/matriz_resultados para EDI, EP1, EP2
  const {
    selectedEtapa,
    etapaOptions,
    handleSelectEtapa,
    handleSelectCategoria,
    matrizConfigGrados,
    loadingConfig,
  } = useEvaluacionesMatriz({
    grado: currentGrado,
    evaluacion,
    evaluacionesDb,
    selectedCategoriaId,
    onSelectEvaluacion,
  });

  // Categoría de la evaluación actual (por metadata directa o por asignación en matriz)
  const evaluacionCategoriaId = useMemo(() => {
    if (evaluacion?.categoria !== undefined && evaluacion?.categoria !== null) {
      return Number(evaluacion.categoria);
    }
    if (evaluacion?.id) {
      for (const [key, asgn] of Object.entries(matrizConfigGrados || {})) {
        if (
          asgn &&
          (asgn.ediId === evaluacion.id ||
            asgn.ep1Id === evaluacion.id ||
            asgn.ep2Id === evaluacion.id)
        ) {
          const parts = key.split('_');
          if (parts.length === 2 && !isNaN(Number(parts[1]))) {
            return Number(parts[1]);
          }
        }
      }
    }
    return undefined;
  }, [evaluacion?.categoria, evaluacion?.id, matrizConfigGrados]);

  // Sincronizar categoría si cambia la evaluación externamente o se detecta en la matriz
  useEffect(() => {
    if (evaluacionCategoriaId !== undefined && evaluacionCategoriaId !== null) {
      setSelectedCategoriaId(evaluacionCategoriaId);
    } else if (evaluacion?.categoria !== undefined && evaluacion?.categoria !== null) {
      setSelectedCategoriaId(Number(evaluacion.categoria));
    }
  }, [evaluacionCategoriaId, evaluacion?.categoria]);

  // Categorías de área curricular disponibles según el grado
  const categoriasDisponibles = useMemo(() => {
    return getCategoriasParaGrado(currentGrado, contextCategorias, evaluacionesDb);
  }, [currentGrado, contextCategorias, evaluacionesDb]);

  // Categorías con configuración asignada en este grado (restringido al área de la evaluación activa)
  const configuredCategories = useMemo(() => {
    const list = categoriasDisponibles.filter((cat) => {
      const assignment = matrizConfigGrados[`${currentGrado}_${cat.id}`];
      return !!(assignment && (assignment.ediId || assignment.ep1Id || assignment.ep2Id));
    });
    if (evaluacionCategoriaId !== undefined && evaluacionCategoriaId !== null) {
      const filtered = list.filter((cat) => Number(cat.id) === evaluacionCategoriaId);
      if (filtered.length > 0) return filtered;
    }
    return list;
  }, [categoriasDisponibles, matrizConfigGrados, currentGrado, evaluacionCategoriaId]);

  // Verificar si la categoría actualmente seleccionada tiene asignación o evaluación activa
  const selectedCategoryAssignment = matrizConfigGrados[`${currentGrado}_${selectedCategoriaId}`];
  const ediId: string | undefined = selectedCategoryAssignment?.ediId;
  const ep1Id: string | undefined = selectedCategoryAssignment?.ep1Id;
  const ep2Id: string | undefined = selectedCategoryAssignment?.ep2Id;

  // Detección inteligente: ¿Esta evaluación está configurada para el flujo de etapas longitudinales (EDI, EP1, EP2)?
  const isEtapaConfigurada = useMemo(() => {
    if (!evaluacion?.id) return false;

    // 1. Coincide con ediId, ep1Id o ep2Id de la categoría activa para este grado
    if (
      (ediId && evaluacion.id === ediId) ||
      (ep1Id && evaluacion.id === ep1Id) ||
      (ep2Id && evaluacion.id === ep2Id)
    ) {
      return true;
    }

    // 2. Coincide con alguna asignación registrada en cualquier grado/área de matrizConfigGrados
    const isEnMatrizGlobal = Object.values(matrizConfigGrados).some((asgn: any) => {
      return Boolean(
        asgn &&
          (asgn.ediId === evaluacion.id ||
            asgn.ep1Id === evaluacion.id ||
            asgn.ep2Id === evaluacion.id)
      );
    });
    if (isEnMatrizGlobal) return true;

    return false;
  }, [evaluacion?.id, ediId, ep1Id, ep2Id, matrizConfigGrados]);

  // Identificador de la etapa de la evaluación actualmente abierta
  const currentEtapaKey = useMemo<EtapaKey | undefined>(() => {
    if (!evaluacion?.id) return undefined;
    if (evaluacion.id === ediId) return 'edi';
    if (evaluacion.id === ep1Id) return 'ep1';
    if (evaluacion.id === ep2Id) return 'ep2';
    return undefined;
  }, [evaluacion?.id, ediId, ep1Id, ep2Id]);

  const isSelectedCategoryConfigured = !!(
    selectedCategoryAssignment &&
    (selectedCategoryAssignment.ediId || selectedCategoryAssignment.ep1Id || selectedCategoryAssignment.ep2Id)
  );

  const hasActiveEvaluationForCategory =
    (evaluacion?.categoria !== undefined && Number(evaluacion.categoria) === selectedCategoriaId) ||
    isSelectedCategoryConfigured;

  // Auto-seleccionar la primera categoría configurada solo si estamos en modo etapas longitudinales
  useEffect(() => {
    if (!isEtapaConfigurada) return;
    if (configuredCategories.length > 0) {
      const isCurrentConfigured = configuredCategories.some(
        (c) => Number(c.id) === selectedCategoriaId
      );
      if (!isCurrentConfigured) {
        const firstId = Number(configuredCategories[0].id);
        setSelectedCategoriaId(firstId);
        handleSelectCategoria(firstId);
      }
    }
  }, [isEtapaConfigurada, configuredCategories, selectedCategoriaId, handleSelectCategoria]);

  const handleCategoriaChange = (catId: number) => {
    setSelectedCategoriaId(catId);
    handleSelectCategoria(catId);
  };

  // Determinar si la evaluación tiene datos en múltiples meses (serie histórica)
  const hasMonthlyData = useMemo(() => {
    const countMeses = Array.isArray(datosPorMes)
      ? datosPorMes.filter(
          (d) => d && (d.cantidadTotal > 0 || (d.datos && Object.keys(d.datos).length > 0))
        ).length
      : 0;
    const countPromedios = Array.isArray(promedioGlobal)
      ? promedioGlobal.filter((p) => p && p.promedio > 0).length
      : 0;
    const countDisponibles = Array.isArray(mesesConDataDisponibles)
      ? mesesConDataDisponibles.length
      : 0;
    return countMeses > 1 || countPromedios > 1 || countDisponibles > 1;
  }, [datosPorMes, promedioGlobal, mesesConDataDisponibles]);

  // Resumen ejecutivo para evaluaciones independientes sin serie mensual
  const resumenEvaluacion = useMemo(() => {
    const total = estudiantesFiltrados.length;
    let sum = 0;
    let sat = 0, proc = 0, ini = 0, prev = 0;
    estudiantesFiltrados.forEach((e) => {
      sum += Number(e.puntaje) || 0;
      const niv = (e.nivel || '').toLowerCase();
      if (niv.includes('satisfactorio')) sat++;
      else if (niv.includes('proceso')) proc++;
      else if (niv.includes('previo')) prev++;
      else if (niv.includes('inicio')) ini++;
    });
    const avg = total > 0 ? Number((sum / total).toFixed(2)) : 0;
    const pctSat = total > 0 ? Number(((sat / total) * 100).toFixed(1)) : 0;
    const pctProc = total > 0 ? Number(((proc / total) * 100).toFixed(1)) : 0;
    const pctIni = total > 0 ? Number(((ini / total) * 100).toFixed(1)) : 0;
    const pctPrev = total > 0 ? Number(((prev / total) * 100).toFixed(1)) : 0;

    const niveles = [
      {
        label: 'Satisfactorio',
        count: sat,
        pct: pctSat,
        color: 'text-emerald-700 bg-emerald-50 border-emerald-200',
      },
      {
        label: 'En Proceso',
        count: proc,
        pct: pctProc,
        color: 'text-amber-700 bg-amber-50 border-amber-200',
      },
      {
        label: 'En Inicio',
        count: ini,
        pct: pctIni,
        color: 'text-rose-700 bg-rose-50 border-rose-200',
      },
      {
        label: 'Previo al Inicio',
        count: prev,
        pct: pctPrev,
        color: 'text-slate-700 bg-slate-100 border-slate-200',
      },
    ];
    const predominante = total > 0 ? [...niveles].sort((a, b) => b.count - a.count)[0] : null;

    return {
      promedio: avg,
      total,
      sat,
      proc,
      ini,
      prev,
      pctSat,
      pctProc,
      pctIni,
      pctPrev,
      predominante,
    };
  }, [estudiantesFiltrados]);

  // Cálculo de promedios y distribución por sección (sobre la totalidad de aulas para comparativa)
  const promedioPorSeccion = useMemo(() => {
    if (availableSections.length === 0) return [];

    return availableSections
      .map((seccionObj) => {
        const seccionId = String(seccionObj.id);
        const ests = estudiantes.filter((est) => String(est.seccion) === seccionId);

        const docentesUnicos = Array.from(
          new Set(
            ests
              .map((est) => (est.dniDocente ? docentesMap.get(String(est.dniDocente)) : null))
              .filter(Boolean)
          )
        );
        const docenteNombre =
          docentesUnicos.length > 0
            ? docentesUnicos.join(', ')
            : docentesMap.get(`sec_${String(seccionObj.id).toUpperCase()}`) ||
              docentesMap.get(`sec_${String(seccionObj.name).toUpperCase()}`) ||
              undefined;
        const totalPuntaje = ests.reduce((acc, est) => acc + (est.puntaje || 0), 0);
        const promedio = ests.length > 0 ? totalPuntaje / ests.length : 0;

        const niveles = { satisfactorio: 0, proceso: 0, inicio: 0, previo: 0 };
        ests.forEach((est) => {
          const nivel = (est.nivel || '').toLowerCase();
          if (nivel.includes('satisfactorio')) niveles.satisfactorio++;
          else if (nivel.includes('proceso')) niveles.proceso++;
          else if (nivel.includes('previo')) niveles.previo++;
          else if (nivel.includes('inicio')) niveles.inicio++;
        });

        return {
          seccion: seccionObj.name.toUpperCase(),
          docenteNombre,
          promedio: Number(promedio.toFixed(2)),
          cantidad: ests.length,
          distribucion: niveles,
        };
      })
      .sort((a, b) => {
        const percA = a.cantidad > 0 ? a.distribucion.satisfactorio / a.cantidad : 0;
        const percB = b.cantidad > 0 ? b.distribucion.satisfactorio / b.cantidad : 0;
        return percB - percA;
      });
  }, [estudiantes, availableSections, docentesMap]);

  const dataPie = useMemo(() => {
    return [generarDataGraficoPiechart(estudiantesFiltrados, monthSelected, evaluacion)];
  }, [estudiantesFiltrados, monthSelected, evaluacion]);

  // Nombre formateado de la categoría activa
  const currentCategoryObj = categoriasDisponibles.find((c) => Number(c.id) === selectedCategoriaId);
  const currentCategoryName = currentCategoryObj
    ? formatCategoriaLabel(currentCategoryObj.categoria)
    : `ÁREA ${selectedCategoriaId}`;

  const { categoriaLabels } = useDirectorTabsConfig();
  const customCatLabel = categoriaLabels[String(selectedCategoriaId)];
  const activeLabelUpper = (customCatLabel || currentCategoryName || '').toUpperCase();

  const isMatematica =
    selectedCategoriaId === 2 ||
    activeLabelUpper.includes('MATE') ||
    activeLabelUpper.includes('PROBLEMA') ||
    activeLabelUpper.includes('RADAMATE');

  const radarTitle = isMatematica
    ? (customCatLabel?.toUpperCase() || 'RADAMATE')
    : (customCatLabel?.toUpperCase() || 'RADALECTOR');

  // =========================================================================
  // CARGA Y MAPEO LONGITUDINAL DE LAS 3 ETAPAS DEL ÁREA: EDI, EP1, EP2
  // =========================================================================
  const tendenciasCacheKey = useMemo(() => {
    return `${evaluacion?.id || ''}_${dniDocente || ''}_${dniDirector || ''}_${yearSelected || ''}_${monthSelected || ''}`;
  }, [evaluacion?.id, dniDocente, dniDirector, yearSelected, monthSelected]);

  const [etapasCache, setEtapasCache] = useState<Record<string, EtapaData>>(() => {
    return (tendenciasCacheKey && globalTendenciasEtapasCache.get(tendenciasCacheKey)) || {};
  });
  const [loadingEtapas, setLoadingEtapas] = useState<boolean>(false);

  useEffect(() => {
    if (tendenciasCacheKey && globalTendenciasEtapasCache.has(tendenciasCacheKey)) {
      setEtapasCache(globalTendenciasEtapasCache.get(tendenciasCacheKey)!);
    }
  }, [tendenciasCacheKey]);

  // 1. Registrar inmediatamente los datos de la evaluación actualmente activa
  useEffect(() => {
    const evalId = evaluacion?.id;
    if (!evalId) return;

    const total = estudiantesFiltrados.length;
    let sat = 0, proc = 0, ini = 0, prev = 0;
    let sumPts = 0;

    estudiantesFiltrados.forEach((e) => {
      const p = Number(e.puntaje) || 0;
      sumPts += p;
      let niv = (e.nivel || '').toLowerCase();
      if ((!niv || niv === 'sin clasificar') && evaluacion?.nivelYPuntaje) {
        const matchNivel = evaluacion.nivelYPuntaje.find(
          (np: any) => p >= (np.min || 0) && p <= (np.max || 20)
        );
        if (matchNivel?.nivel) {
          niv = matchNivel.nivel.toLowerCase();
        }
      }
      if (niv.includes('satisfactorio')) sat++;
      else if (niv.includes('proceso')) proc++;
      else if (niv.includes('previo')) prev++;
      else if (niv.includes('inicio')) ini++;
    });

    const avg = total > 0 ? Number((sumPts / total).toFixed(2)) : 0;

    setEtapasCache((prevCache) => {
      const nextCache = {
        ...prevCache,
        [evalId]: {
          promedio: avg,
          totalEstudiantes: total,
          satisfactorio: sat,
          proceso: proc,
          inicio: ini,
          previo: prev,
          hasData: total > 0,
        },
      };
      if (tendenciasCacheKey) {
        globalTendenciasEtapasCache.set(tendenciasCacheKey, nextCache);
      }
      return nextCache;
    });
  }, [evaluacion?.id, evaluacion?.nivelYPuntaje, estudiantesFiltrados, tendenciasCacheKey]);

  // 2. Cargar asíncronamente las etapas restantes asignadas (EDI, EP1, EP2)
  useEffect(() => {
    if (!isEtapaConfigurada || (!dniDirector && !dniDocente)) return;

    const idsParaConsultar = [ediId, ep1Id, ep2Id].filter(
      (id): id is string => !!id && id !== evaluacion?.id && !etapasCache[id]
    );

    if (idsParaConsultar.length === 0) return;

    let isMounted = true;
    const fetchEtapasFaltantes = async () => {
      setLoadingEtapas(true);
      const functions = getFunctions();
      const getReporte = httpsCallable(functions, 'getReporteDirector');

      const updates: Record<string, EtapaData> = {};

      for (const idTarget of idsParaConsultar) {
        try {
          const db = getFirestore();
          let targetEvalObj = (evaluacionesDb || []).find((e: any) => e.id === idTarget);
          if (!targetEvalObj) {
            try {
              const evalSnap = await getDoc(doc(db, 'evaluaciones', idTarget));
              if (evalSnap.exists()) {
                targetEvalObj = { id: evalSnap.id, ...evalSnap.data() };
              }
            } catch (errEval) {
              console.error(`Error al recuperar evaluación ${idTarget}:`, errEval);
            }
          }

          const targetYear = targetEvalObj?.añoDelExamen
            ? Number(targetEvalObj.añoDelExamen)
            : yearSelected || new Date().getFullYear();

          if (dniDocente) {
            const targetMonth =
              targetEvalObj?.mesDelExamen !== undefined && targetEvalObj.mesDelExamen !== ''
                ? Number(targetEvalObj.mesDelExamen)
                : monthSelected !== undefined && monthSelected !== null
                  ? monthSelected
                  : 0;

            const coll = collection(
              db,
              `/evaluaciones/${idTarget}/estudiantes-evaluados/${targetYear}/${targetMonth}`
            );
            let q = query(coll, where('dniDocente', '==', String(dniDocente)));
            let snap = await getDocs(q);
            if (snap.empty && !isNaN(Number(dniDocente))) {
              const snapNum = await getDocs(query(coll, where('dniDocente', '==', Number(dniDocente))));
              if (!snapNum.empty) snap = snapNum;
            }
            const alumnos: any[] = [];
            snap.forEach((d) => alumnos.push(d.data()));

            if (isMounted) {
              const total = alumnos.length;
              let sat = 0, proc = 0, ini = 0, prev = 0;
              let sumPts = 0;

              alumnos.forEach((e) => {
                const p = Number(e.puntaje) || 0;
                sumPts += p;
                let niv = (e.nivel || '').toLowerCase();
                if ((!niv || niv === 'sin clasificar') && targetEvalObj?.nivelYPuntaje) {
                  const matchNivel = targetEvalObj.nivelYPuntaje.find(
                    (np: any) => p >= (np.min || 0) && p <= (np.max || 20)
                  );
                  if (matchNivel?.nivel) {
                    niv = matchNivel.nivel.toLowerCase();
                  }
                }
                if (niv.includes('satisfactorio')) sat++;
                else if (niv.includes('proceso')) proc++;
                else if (niv.includes('previo')) prev++;
                else if (niv.includes('inicio')) ini++;
              });

              const avg = total > 0 ? Number((sumPts / total).toFixed(2)) : 0;

              updates[idTarget] = {
                promedio: avg,
                totalEstudiantes: total,
                satisfactorio: sat,
                proceso: proc,
                inicio: ini,
                previo: prev,
                hasData: total > 0,
              };
            }
          } else if (dniDirector) {
            const response: any = await getReporte({
              idEvaluacion: idTarget,
              year: targetYear,
              dniDirector,
            });

            if (response?.data?.success && isMounted) {
              const alumnos: any[] = response.data.estudiantes || [];
              const total = alumnos.length;
              let sat = 0, proc = 0, ini = 0, prev = 0;
              let sumPts = 0;

              alumnos.forEach((e) => {
                const p = Number(e.puntaje) || 0;
                sumPts += p;
                let niv = (e.nivel || '').toLowerCase();
                if ((!niv || niv === 'sin clasificar') && targetEvalObj?.nivelYPuntaje) {
                  const matchNivel = targetEvalObj.nivelYPuntaje.find(
                    (np: any) => p >= (np.min || 0) && p <= (np.max || 20)
                  );
                  if (matchNivel?.nivel) {
                    niv = matchNivel.nivel.toLowerCase();
                  }
                }
                if (niv.includes('satisfactorio')) sat++;
                else if (niv.includes('proceso')) proc++;
                else if (niv.includes('previo')) prev++;
                else if (niv.includes('inicio')) ini++;
              });

              const avg = total > 0 ? Number((sumPts / total).toFixed(2)) : 0;

              updates[idTarget] = {
                promedio: avg,
                totalEstudiantes: total,
                satisfactorio: sat,
                proceso: proc,
                inicio: ini,
                previo: prev,
                hasData: total > 0,
              };
            } else if (isMounted) {
              updates[idTarget] = {
                promedio: 0,
                totalEstudiantes: 0,
                satisfactorio: 0,
                proceso: 0,
                inicio: 0,
                previo: 0,
                hasData: false,
              };
            }
          }
        } catch (err) {
          console.error(`Error al cargar datos de etapa ${idTarget}:`, err);
          if (isMounted) {
            updates[idTarget] = {
              promedio: 0,
              totalEstudiantes: 0,
              satisfactorio: 0,
              proceso: 0,
              inicio: 0,
              previo: 0,
              hasData: false,
            };
          }
        }
      }

      if (isMounted) {
        if (Object.keys(updates).length > 0) {
          setEtapasCache((prev) => {
            const next = { ...prev, ...updates };
            if (tendenciasCacheKey) {
              globalTendenciasEtapasCache.set(tendenciasCacheKey, next);
            }
            return next;
          });
        }
        setLoadingEtapas(false);
      }
    };

    fetchEtapasFaltantes();

    return () => {
      isMounted = false;
    };
  }, [ediId, ep1Id, ep2Id, evaluacion?.id, dniDirector, dniDocente, yearSelected, monthSelected, evaluacionesDb, etapasCache, isEtapaConfigurada]);

  // Lista estructurada de las 3 etapas para los gráficos longitudinales
  const etapasLista = useMemo(() => {
    const etapasDef: Array<{ key: 'edi' | 'ep1' | 'ep2'; label: string; id?: string }> = [
      { key: 'edi', label: 'EDI (Diagnóstica)', id: ediId },
      { key: 'ep1', label: 'EP1 (Progresiva 1)', id: ep1Id },
      { key: 'ep2', label: 'EP2 (Progresiva 2)', id: ep2Id },
    ];

    return etapasDef.map((def) => {
      const data = def.id ? etapasCache[def.id] : undefined;
      const total = data?.totalEstudiantes || 0;
      const sat = data?.satisfactorio || 0;
      const proc = data?.proceso || 0;
      const ini = data?.inicio || 0;
      const prev = data?.previo || 0;

      const pctSat = total > 0 ? Number(((sat / total) * 100).toFixed(1)) : 0;
      const pctProc = total > 0 ? Number(((proc / total) * 100).toFixed(1)) : 0;
      const pctIni = total > 0 ? Number(((ini / total) * 100).toFixed(1)) : 0;
      const pctPrev = total > 0 ? Number(((prev / total) * 100).toFixed(1)) : 0;

      return {
        key: def.key,
        label: def.label,
        id: def.id,
        isConfigured: !!def.id,
        isCurrent: def.id === evaluacion?.id,
        hasData: Boolean(data?.hasData),
        promedio: data?.promedio || 0,
        totalEstudiantes: total,
        satisfactorio: sat,
        proceso: proc,
        inicio: ini,
        previo: prev,
        pctSatisfactorio: pctSat,
        pctProceso: pctProc,
        pctInicio: pctIni,
        pctPrevio: pctPrev,
      };
    });
  }, [ediId, ep1Id, ep2Id, etapasCache, evaluacion?.id]);

  // Lista filtrada según las etapas activas en el selector interactivo
  const etapasListaVisible = useMemo(() => {
    return etapasLista.filter((e) => selectedEtapas.includes(e.key));
  }, [etapasLista, selectedEtapas]);

  const hasAnyEtapaData = useMemo(() => {
    return etapasListaVisible.some((e) => e.hasData);
  }, [etapasListaVisible]);

  // 1. DATASET: GRÁFICO DE BARRAS DE PROMEDIO GLOBAL (EDI, EP1, EP2)
  const chartDataBarrasEtapas = useMemo(() => {
    return {
      labels: etapasListaVisible.map((e) => e.label),
      datasets: [
        {
          label: 'Promedio Global',
          data: etapasListaVisible.map((e) => (e.hasData ? e.promedio : null)),
          backgroundColor: etapasListaVisible.map((e) => {
            if (!e.hasData) return 'rgba(203, 213, 225, 0.4)';
            if (e.key === 'edi') return 'rgba(59, 130, 246, 0.85)';
            if (e.key === 'ep1') return 'rgba(245, 158, 11, 0.85)';
            return 'rgba(16, 185, 129, 0.85)';
          }),
          borderColor: etapasListaVisible.map((e) => {
            if (!e.hasData) return '#94a3b8';
            if (e.key === 'edi') return '#2563eb';
            if (e.key === 'ep1') return '#d97706';
            return '#059669';
          }),
          borderWidth: 2,
          borderRadius: 8,
          borderSkipped: false,
          maxBarThickness: etapasListaVisible.length === 1 ? 90 : 65,
        },
      ],
    };
  }, [etapasListaVisible]);

  // 2. DATASET: GRÁFICO LINEAL DE EVOLUCIÓN DEL PROMEDIO GLOBAL (EDI ➔ EP1 ➔ EP2)
  const chartDataLinealEtapas = useMemo(() => {
    return {
      labels: etapasListaVisible.map((e) => e.label),
      datasets: [
        {
          label: 'Evolución del Promedio',
          data: etapasListaVisible.map((e) => (e.hasData ? e.promedio : null)),
          borderColor: '#2563eb',
          backgroundColor: 'rgba(37, 99, 235, 0.1)',
          fill: etapasListaVisible.length > 1,
          tension: 0.3,
          borderWidth: 3,
          pointBackgroundColor: etapasListaVisible.map((e) => (e.isCurrent ? '#ffffff' : '#2563eb')),
          pointBorderColor: '#2563eb',
          pointBorderWidth: etapasListaVisible.map((e) => (e.isCurrent ? 3.5 : 2)),
          pointRadius: etapasListaVisible.map((e) => (e.isCurrent ? 8 : 6)),
          pointHoverRadius: 9,
          spanGaps: true,
        },
      ],
    };
  }, [etapasListaVisible]);

  // 3. DATASET: GRÁFICO DE TENDENCIA DE NIVELES (NIVELES EN EL EJE X, ETAPAS EN DATASETS)
  const chartDataNivelesEtapas = useMemo(() => {
    const isPct = metricaNiveles === 'pct';
    const isBar = tipoGraficoNiveles === 'bar';
    const labels = ['Previo al Inicio', 'En Inicio', 'En Proceso', 'Satisfactorio'];

    const datasets = etapasListaVisible.map((etapa) => {
      let colorBorder = '#2563eb';
      let colorBg = isBar ? 'rgba(59, 130, 246, 0.85)' : 'rgba(37, 99, 235, 0.1)';

      if (etapa.key === 'ep1') {
        colorBorder = '#d97706';
        colorBg = isBar ? 'rgba(245, 158, 11, 0.85)' : 'rgba(217, 119, 6, 0.1)';
      } else if (etapa.key === 'ep2') {
        colorBorder = '#059669';
        colorBg = isBar ? 'rgba(16, 185, 129, 0.85)' : 'rgba(5, 150, 105, 0.1)';
      }

      const dataValues = etapa.hasData
        ? isPct
          ? [etapa.pctPrevio, etapa.pctInicio, etapa.pctProceso, etapa.pctSatisfactorio]
          : [etapa.previo, etapa.inicio, etapa.proceso, etapa.satisfactorio]
        : [null, null, null, null];

      return {
        label: etapa.hasData ? etapa.label : `${etapa.label} (Sin datos)`,
        data: dataValues,
        borderColor: colorBorder,
        backgroundColor: colorBg,
        tension: 0.3,
        borderWidth: isBar ? 1.5 : etapa.isCurrent ? 3.5 : 2.5,
        borderRadius: isBar ? 6 : undefined,
        maxBarThickness: isBar ? 42 : undefined,
        borderDash: etapa.hasData ? [] : [5, 5],
        pointBackgroundColor: etapa.isCurrent ? '#ffffff' : colorBorder,
        pointBorderColor: colorBorder,
        pointBorderWidth: etapa.isCurrent ? 3 : 2,
        pointRadius: etapa.hasData ? 6 : 0,
        pointHoverRadius: 8,
        spanGaps: true,
        fill: false,
      };
    });

    return {
      labels,
      datasets,
    };
  }, [etapasListaVisible, metricaNiveles, tipoGraficoNiveles]);

  // Valor máximo dinámico para la escala Y en gráficos de Promedio Global
  const maxScorePromedio = useMemo(() => {
    // 1. Obtener de los niveles de la evaluación activa (valor max más alto de nivelYPuntaje)
    if (evaluacion?.nivelYPuntaje && Array.isArray(evaluacion.nivelYPuntaje) && evaluacion.nivelYPuntaje.length > 0) {
      const maxLevels = evaluacion.nivelYPuntaje
        .map((n) => Number(n.max) || 0)
        .filter((val) => val > 0);
      if (maxLevels.length > 0) {
        const topMax = Math.max(...maxLevels);
        if (topMax > 0) return topMax;
      }
    }

    // 2. Si alguna de las etapas tiene promedio real mayor a 20, escalar dinámicamente
    const maxProm = Math.max(...etapasListaVisible.map((e) => e.promedio || 0), 0);
    if (maxProm > 0) {
      if (maxProm <= 20) return 20;
      if (maxProm <= 100) return 100;
      return Math.ceil((maxProm * 1.15) / 25) * 25;
    }

    return 20;
  }, [evaluacion?.nivelYPuntaje, etapasListaVisible]);

  // Opciones de configuración para Chart.js
  const chartOptionsBarras = useMemo(
    () => ({
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { display: false },
        tooltip: {
          backgroundColor: 'rgba(15, 23, 42, 0.9)',
          padding: 10,
          cornerRadius: 8,
          callbacks: {
            label: (context: any) => {
              const idx = context.dataIndex;
              const item = etapasListaVisible[idx];
              if (!item?.hasData) return 'Sin evaluaciones registradas';
              return [
                `Promedio Global: ${item.promedio} pts`,
                `Estudiantes evaluados: ${item.totalEstudiantes}`,
              ];
            },
          },
        },
      },
      scales: {
        y: {
          beginAtZero: true,
          max: maxScorePromedio,
          ticks: {
            stepSize: maxScorePromedio <= 20 ? 4 : maxScorePromedio <= 100 ? 20 : 25,
            color: '#64748b',
            font: { size: 11 },
          },
          grid: { color: 'rgba(226, 232, 240, 0.8)' },
          title: {
            display: true,
            text: `Puntaje Promedio (0 a ${maxScorePromedio} pts)`,
            color: '#64748b',
            font: { size: 11 },
          },
        },
        x: {
          offset: true,
          ticks: { color: '#334155', font: { size: 11, weight: 'bold' as const } },
          grid: { display: false },
        },
      },
    }),
    [etapasListaVisible, maxScorePromedio]
  );

  const chartOptionsLineal = useMemo(
    () => ({
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { display: false },
        tooltip: {
          backgroundColor: 'rgba(15, 23, 42, 0.9)',
          padding: 10,
          cornerRadius: 8,
          callbacks: {
            label: (context: any) => {
              const idx = context.dataIndex;
              const item = etapasListaVisible[idx];
              if (!item?.hasData) return 'Sin evaluaciones registradas';
              return `Promedio: ${item.promedio} pts (${item.totalEstudiantes} estudiantes)`;
            },
          },
        },
      },
      scales: {
        y: {
          beginAtZero: true,
          max: maxScorePromedio,
          ticks: {
            stepSize: maxScorePromedio <= 20 ? 4 : maxScorePromedio <= 100 ? 20 : 25,
            color: '#64748b',
            font: { size: 11 },
          },
          grid: { color: 'rgba(226, 232, 240, 0.8)' },
          title: {
            display: true,
            text: `Puntaje Promedio (0 a ${maxScorePromedio} pts)`,
            color: '#64748b',
            font: { size: 11 },
          },
        },
        x: {
          offset: true,
          ticks: { color: '#334155', font: { size: 11, weight: 'bold' as const } },
          grid: { display: false },
        },
      },
    }),
    [etapasListaVisible, maxScorePromedio]
  );

  // Cálculo del valor máximo registrado en niveles para soportar Escala Dinámica (Auto Zoom)
  const maxValNiveles = useMemo(() => {
    let max = 0;
    etapasListaVisible.forEach((e) => {
      if (e.hasData) {
        if (metricaNiveles === 'pct') {
          max = Math.max(max, e.pctPrevio, e.pctInicio, e.pctProceso, e.pctSatisfactorio);
        } else {
          max = Math.max(max, e.previo, e.inicio, e.proceso, e.satisfactorio);
        }
      }
    });
    return max;
  }, [etapasListaVisible, metricaNiveles]);

  const yMaxNiveles = useMemo(() => {
    if (!escalaDinamicaNiveles) {
      return metricaNiveles === 'pct' ? 100 : undefined;
    }
    if (metricaNiveles === 'pct') {
      if (maxValNiveles <= 0) return 100;
      const target = Math.min(100, Math.ceil((maxValNiveles + 5) / 5) * 5);
      return Math.max(target, 20);
    } else {
      if (maxValNiveles <= 0) return undefined;
      return Math.ceil(maxValNiveles * 1.1);
    }
  }, [escalaDinamicaNiveles, metricaNiveles, maxValNiveles]);

  const chartOptionsNiveles = useMemo(
    () => ({
      responsive: true,
      maintainAspectRatio: false,
      interaction: {
        mode: 'index' as const,
        intersect: false,
      },
      plugins: {
        legend: {
          position: 'top' as const,
          labels: {
            color: '#334155',
            boxWidth: 12,
            boxHeight: 12,
            usePointStyle: true,
            font: { size: 11, weight: 'bold' as const },
          },
        },
        tooltip: {
          backgroundColor: 'rgba(15, 23, 42, 0.9)',
          padding: 10,
          cornerRadius: 8,
          callbacks: {
            title: (items: any) => {
              const label = items[0]?.label || '';
              return `Nivel de Rendimiento: ${label}`;
            },
            label: (context: any) => {
              const isPct = metricaNiveles === 'pct';
              const datasetLabel = context.dataset.label || '';
              const val = context.parsed.y;
              if (val === null || val === undefined) return `${datasetLabel}: Sin datos`;
              const etapaIdx = context.datasetIndex;
              const etapa = etapasListaVisible[etapaIdx];
              const nivelIdx = context.dataIndex; // 0: Previo, 1: Inicio, 2: Proceso, 3: Satisfactorio
              const counts = [
                etapa?.previo || 0,
                etapa?.inicio || 0,
                etapa?.proceso || 0,
                etapa?.satisfactorio || 0,
              ];
              const pcts = [
                etapa?.pctPrevio || 0,
                etapa?.pctInicio || 0,
                etapa?.pctProceso || 0,
                etapa?.pctSatisfactorio || 0,
              ];

              const baseText = isPct
                ? `${datasetLabel}: ${val}% (${counts[nivelIdx]} estudiantes)`
                : `${datasetLabel}: ${val} estudiantes (${pcts[nivelIdx]}%)`;

              if (!mostrarDeltasTooltip || context.datasetIndex === 0) {
                return baseText;
              }

              // Calcular delta respecto a la etapa previa visible
              const prevDataset = context.chart.data.datasets[context.datasetIndex - 1];
              const prevVal = prevDataset?.data?.[context.dataIndex];

              if (prevVal === null || prevVal === undefined || typeof prevVal !== 'number') {
                return baseText;
              }

              const diff = isPct
                ? Number((val - prevVal).toFixed(1))
                : val - prevVal;

              const prevName = (prevDataset.label || '').split(' (')[0] || `Etapa ${context.datasetIndex}`;

              let diffStr = '';
              if (diff > 0) {
                diffStr = isPct
                  ? ` (▲ +${diff}% vs ${prevName})`
                  : ` (▲ +${diff.toLocaleString('es-PE')} vs ${prevName})`;
              } else if (diff < 0) {
                diffStr = isPct
                  ? ` (▼ ${diff}% vs ${prevName})`
                  : ` (▼ ${diff.toLocaleString('es-PE')} vs ${prevName})`;
              } else {
                diffStr = ` (= 0% vs ${prevName})`;
              }

              return `${baseText}${diffStr}`;
            },
          },
        },
      },
      scales: {
        y: {
          beginAtZero: true,
          max: yMaxNiveles,
          ticks: {
            stepSize: escalaDinamicaNiveles ? (yMaxNiveles && yMaxNiveles <= 50 ? 5 : 10) : 10,
            callback: (value: any) => (metricaNiveles === 'pct' ? `${value}%` : value),
            color: '#64748b',
            font: { size: 11 },
          },
          grid: { color: 'rgba(226, 232, 240, 0.8)' },
          title: {
            display: true,
            text: metricaNiveles === 'pct' ? 'Porcentaje de Alumnos' : 'Cantidad de Alumnos',
            color: '#64748b',
            font: { size: 11 },
          },
        },
        x: {
          offset: true,
          ticks: { color: '#334155', font: { size: 11, weight: 'bold' as const } },
          grid: { color: 'rgba(226, 232, 240, 0.5)' },
          title: {
            display: true,
            text: 'Niveles de Rendimiento (Eje X)',
            color: '#64748b',
            font: { size: 11 },
          },
        },
      },
    }),
    [etapasListaVisible, metricaNiveles, yMaxNiveles, escalaDinamicaNiveles, mostrarDeltasTooltip]
  );

  // Plugin personalizado de Chart.js para dibujar los valores permanentemente sobre puntos y barras y desfasar puntos colisionantes
  const dataLabelsNivelesPlugin = useMemo(
    () => ({
      id: 'dataLabelsNivelesPlugin',
      beforeDatasetsDraw(chart: any) {
        if (chart.config.type !== 'line') return;

        const numCategories = 4; // Previo, Inicio, Proceso, Satisfactorio
        for (let catIdx = 0; catIdx < numCategories; catIdx++) {
          const baseX = chart.scales?.x ? chart.scales.x.getPixelForValue(catIdx) : undefined;
          const points: Array<{
            el: any;
            val: number;
            dIdx: number;
          }> = [];

          chart.data?.datasets?.forEach((ds: any, dIdx: number) => {
            const meta = chart.getDatasetMeta(dIdx);
            if (meta?.hidden || !meta?.data?.[catIdx]) return;
            const el = meta.data[catIdx];
            const val = ds.data?.[catIdx];

            if (val !== null && val !== undefined && !isNaN(val)) {
              if (baseX !== undefined) {
                el.x = baseX;
              }
              points.push({ el, val, dIdx });
            }
          });

          if (points.length < 2 || baseX === undefined) continue;

          // Detectar colisiones verticales (|y1 - y2| < 14px)
          const collidingIndices = new Set<number>();
          for (let i = 0; i < points.length; i++) {
            for (let j = i + 1; j < points.length; j++) {
              if (Math.abs(points[i].el.y - points[j].el.y) < 14) {
                collidingIndices.add(i);
                collidingIndices.add(j);
              }
            }
          }

          if (collidingIndices.size === 2) {
            const pair = Array.from(collidingIndices)
              .map((idx) => points[idx])
              .sort((a, b) => a.dIdx - b.dIdx);
            pair[0].el.x = baseX - 7;
            pair[1].el.x = baseX + 7;
          } else if (collidingIndices.size >= 3) {
            const trio = Array.from(collidingIndices)
              .map((idx) => points[idx])
              .sort((a, b) => a.dIdx - b.dIdx);
            trio[0].el.x = baseX - 8;
            trio[1].el.x = baseX;
            trio[2].el.x = baseX + 8;
          }
        }
      },
      afterDatasetsDraw(chart: any) {
        if (!mostrarEtiquetasValores) return;
        const { ctx, chartArea } = chart;
        const datasets = chart.data?.datasets;
        if (!datasets || datasets.length === 0) return;

        const isBar = chart.config.type === 'bar';
        const isPct = metricaNiveles === 'pct';

        ctx.save();
        ctx.font = 'bold 10px "Inter", -apple-system, sans-serif';
        ctx.textAlign = 'center';

        const numCategories = 4; // Previo, Inicio, Proceso, Satisfactorio
        for (let catIdx = 0; catIdx < numCategories; catIdx++) {
          const points: Array<{
            datasetIndex: number;
            val: number;
            x: number;
            y: number;
            color: string;
          }> = [];

          datasets.forEach((dataset: any, dIdx: number) => {
            const meta = chart.getDatasetMeta(dIdx);
            if (meta?.hidden || !meta?.data?.[catIdx]) return;
            const element = meta.data[catIdx];
            const val = dataset.data?.[catIdx];

            if (val !== null && val !== undefined && !isNaN(val)) {
              const xPos = isBar && typeof element.tooltipPosition === 'function' ? element.tooltipPosition().x : element.x;
              const yPos = isBar && typeof element.tooltipPosition === 'function' ? element.tooltipPosition().y : element.y;
              points.push({
                datasetIndex: dIdx,
                val,
                x: xPos,
                y: yPos,
                color: dataset.borderColor || '#334155',
              });
            }
          });

          if (isBar) {
            points.forEach((pt) => {
              const text = isPct ? `${pt.val}%` : Number(pt.val).toLocaleString('es-PE');
              const textWidth = ctx.measureText(text).width;
              const textY = Math.max(pt.y - 4, (chartArea?.top || 0) + 12);

              ctx.fillStyle = 'rgba(255, 255, 255, 0.9)';
              ctx.fillRect(pt.x - textWidth / 2 - 2, textY - 10, textWidth + 4, 12);

              ctx.fillStyle = pt.color;
              ctx.textBaseline = 'bottom';
              ctx.fillText(text, pt.x, textY);
            });
          } else {
            points.sort((a, b) => a.y - b.y);

            points.forEach((pt) => {
              const text = isPct ? `${pt.val}%` : Number(pt.val).toLocaleString('es-PE');
              const closeGroup = points.filter((other) => Math.abs(other.y - pt.y) < 16);

              let offsetY = -8;
              if (closeGroup.length > 1) {
                const rankInGroup = closeGroup.findIndex((p) => p.datasetIndex === pt.datasetIndex);
                if (rankInGroup === 0) {
                  offsetY = -9;
                } else if (rankInGroup === 1) {
                  offsetY = 18;
                } else {
                  offsetY = -23;
                }
              }

              let textY = pt.y + offsetY;
              if (chartArea) {
                if (textY - 10 < chartArea.top) {
                  textY = pt.y + 18;
                } else if (textY > chartArea.bottom) {
                  textY = pt.y - 9;
                }
              }

              const textWidth = ctx.measureText(text).width;

              ctx.fillStyle = 'rgba(255, 255, 255, 0.95)';
              ctx.fillRect(pt.x - textWidth / 2 - 2, textY - 10, textWidth + 4, 12);

              ctx.fillStyle = pt.color;
              ctx.textBaseline = 'bottom';
              ctx.fillText(text, pt.x, textY);
            });
          }
        }

        ctx.restore();
      },
    }),
    [mostrarEtiquetasValores, metricaNiveles]
  );

  // Plugin personalizado para mostrar siempre visibles los puntajes en el gráfico de barras y de líneas de promedio
  const dataLabelsPromedioPlugin = useMemo(
    () => ({
      id: 'dataLabelsPromedioPlugin',
      afterDatasetsDraw(chart: any) {
        const { ctx, chartArea } = chart;
        const datasets = chart.data?.datasets;
        if (!datasets || datasets.length === 0) return;

        const isBar = chart.config.type === 'bar';

        ctx.save();
        ctx.font = 'bold 11px "Inter", -apple-system, sans-serif';
        ctx.textAlign = 'center';

        datasets.forEach((dataset: any, dIdx: number) => {
          const meta = chart.getDatasetMeta(dIdx);
          if (meta?.hidden || !meta?.data) return;

          meta.data.forEach((element: any, index: number) => {
            const val = dataset.data?.[index];
            if (val === null || val === undefined || isNaN(val)) return;

            const text = `${val} pts`;
            const pos = typeof element.tooltipPosition === 'function' ? element.tooltipPosition() : { x: element.x, y: element.y };
            const textWidth = ctx.measureText(text).width;
            const textY = isBar
              ? Math.max(pos.y - 4, (chartArea?.top || 0) + 12)
              : pos.y - 8;

            ctx.fillStyle = 'rgba(255, 255, 255, 0.9)';
            ctx.fillRect(pos.x - textWidth / 2 - 3, textY - 11, textWidth + 6, 13);

            const item = etapasListaVisible[index];
            let textColor = '#2563eb';
            if (item?.key === 'ep1') textColor = '#d97706';
            else if (item?.key === 'ep2') textColor = '#059669';

            ctx.fillStyle = textColor;
            ctx.textBaseline = 'bottom';
            ctx.fillText(text, pos.x, textY);
          });
        });

        ctx.restore();
      },
    }),
    [etapasListaVisible]
  );

  // Estado de carga local mientras se obtiene la evaluación o cambia la materia
  const isTrendLoading =
    Boolean(isLoadingData) ||
    Boolean(loadingConfig) ||
    (isEtapaConfigurada &&
      evaluacion?.categoria !== undefined &&
      evaluacion.categoria !== null &&
      Number(evaluacion.categoria) !== selectedCategoriaId);

  return (
    <div className="flex flex-col w-full">
      {/* 1. Selector de Pestañas de Áreas Curriculares (solo para evaluaciones configuradas en matriz EDI/EP1/EP2) */}
      {isEtapaConfigurada && (
        <DirectorCategoriaTabs
          grado={currentGrado}
          selectedCategoriaId={selectedCategoriaId}
          onSelectCategoria={handleCategoriaChange}
          matrizConfigGrados={matrizConfigGrados}
          evaluacionesDb={evaluacionesDb}
          disabled={isTrendLoading}
          isAuditing={isAuditing}
          onlyCategoriaId={evaluacionCategoriaId}
        />
      )}

      {/* Si el área seleccionada no tiene evaluaciones asignadas (solo en modo etapas), mostrar estado vacío accesible */}
      {isEtapaConfigurada && !hasActiveEvaluationForCategory ? (
        <div
          key={`empty_${selectedCategoriaId}`}
          className={tabsStyles.tabContentPanel}
          role="tabpanel"
          tabIndex={0}
        >
          <EmptyCategoriaState
            categoriaName={currentCategoryName}
            grado={currentGrado}
            configuredCategories={configuredCategories}
            onSelectCategoria={handleCategoriaChange}
          />
        </div>
      ) : (
        /* ESPACIO DE TRABAJO DEL ÁREA O EVALUACIÓN SELECCIONADA */
        <div
          className={`bg-white shadow-xs overflow-hidden mb-4 ${
            isEtapaConfigurada
              ? 'border-x-2 border-b-2 border-emerald-500 rounded-b-2xl -mt-[2px]'
              : 'border-2 border-emerald-500 rounded-2xl'
          }`}
        >
          {/* Cabecera / Barra de Herramientas */}
          <div className="bg-white border-b border-slate-100 p-3 sm:p-4">
            {isEtapaConfigurada ? (
              /* Título de Enfoque Pedagógico RADALECTOR / RADAMATE */
              <div className="flex items-center justify-between gap-3 mb-3 pb-3 border-b border-slate-100/90">
                <div className="flex items-center gap-2.5">
                  <div
                    className={`w-7 h-7 sm:w-8 sm:h-8 rounded-xl flex items-center justify-center shrink-0 shadow-2xs border ${
                      isMatematica
                        ? 'bg-gradient-to-br from-indigo-50 to-blue-50 text-indigo-600 border-indigo-200/80'
                        : 'bg-gradient-to-br from-emerald-50 to-teal-50 text-emerald-600 border-emerald-200/80'
                    }`}
                  >
                    {isMatematica ? (
                      <MdCalculate className="w-4 h-4" />
                    ) : (
                      <MdMenuBook className="w-4 h-4" />
                    )}
                  </div>
                  <div className="flex items-baseline gap-1.5 sm:gap-2 flex-wrap">
                    <span
                      className={`text-sm sm:text-base font-extrabold tracking-tight ${
                        isMatematica ? 'text-indigo-700' : 'text-emerald-700'
                      }`}
                    >
                      {radarTitle}:
                    </span>
                    <span className="text-xs sm:text-sm font-semibold text-slate-700">
                      Análisis Longitudinal, Tendencias y Cobertura de Aprendizaje
                    </span>
                  </div>
                </div>

                {loadingEtapas && (
                  <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-blue-50 border border-blue-200/70 text-blue-700 text-xs font-medium animate-fadeIn">
                    <RiLoader4Line className="w-3.5 h-3.5 animate-spin" />
                    <span>Sincronizando etapas EDI, EP1, EP2...</span>
                  </div>
                )}
              </div>
            ) : (
              /* Título para Evaluación Institucional Independiente */
              <div className="flex items-center justify-between gap-3 mb-3 pb-3 border-b border-slate-100/90">
                <div className="flex items-center gap-2.5">
                  <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-xl flex items-center justify-center shrink-0 shadow-2xs border bg-gradient-to-br from-emerald-50 to-teal-50 text-emerald-700 border-emerald-200/80">
                    <MdPieChart className="w-4 h-4" />
                  </div>
                  <div className="flex items-baseline gap-1.5 sm:gap-2 flex-wrap">
                    <span className="text-sm sm:text-base font-extrabold tracking-tight text-slate-800">
                      {(evaluacion?.nombre || 'EVALUACIÓN INSTITUCIONAL').toUpperCase()}:
                    </span>
                    <span className="text-xs sm:text-sm font-semibold text-slate-600">
                      Resultados, Cobertura y Rendimiento Institucional
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-amber-50 border border-amber-200/80 text-amber-800 text-xs font-semibold">
                  <MdInfoOutline className="w-3.5 h-3.5 text-amber-600" />
                  <span>Evaluación Independiente</span>
                </div>
              </div>
            )}

            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-3.5">
              {/* Izquierda: Switcher de Enfoque de Gráficos */}
              <div className="flex items-center gap-3 flex-wrap">
                <div
                  className="inline-flex items-center p-1 bg-white rounded-xl border border-slate-200/90 shadow-2xs h-[42px]"
                  role="tablist"
                  aria-label="Enfoque de visualización de gráficos"
                >
                  <button
                    type="button"
                    role="tab"
                    aria-selected={subTab === 'todos'}
                    onClick={() => setSubTab('todos')}
                    className={`h-full inline-flex items-center gap-1.5 px-3 rounded-lg text-xs sm:text-sm font-semibold transition-all duration-150 cursor-pointer outline-none ${
                      subTab === 'todos'
                        ? 'bg-emerald-600 text-white shadow-xs'
                        : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                    }`}
                    title="Visualizar todos los gráficos integrados"
                  >
                    <MdDashboard className="w-4 h-4 shrink-0" />
                    <span className="whitespace-nowrap">Visión General</span>
                  </button>

                  <button
                    type="button"
                    role="tab"
                    aria-selected={subTab === 'cobertura'}
                    onClick={() => setSubTab('cobertura')}
                    className={`h-full inline-flex items-center gap-1.5 px-3 rounded-lg text-xs sm:text-sm font-semibold transition-all duration-150 cursor-pointer outline-none ${
                      subTab === 'cobertura'
                        ? 'bg-emerald-600 text-white shadow-xs'
                        : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                    }`}
                    title="Distribución de logro actual y cobertura institucional"
                  >
                    <MdPieChart className="w-4 h-4 shrink-0" />
                    <span className="whitespace-nowrap">Logro y Cobertura</span>
                  </button>

                  <button
                    type="button"
                    role="tab"
                    aria-selected={subTab === 'docentes'}
                    onClick={() => setSubTab('docentes')}
                    className={`h-full inline-flex items-center gap-1.5 px-3 rounded-lg text-xs sm:text-sm font-semibold transition-all duration-150 cursor-pointer outline-none ${
                      subTab === 'docentes'
                        ? 'bg-emerald-600 text-white shadow-xs'
                        : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                    }`}
                    title={isDocenteView ? "Comparativa por aulas y secciones" : "Comparativas por docentes y secciones"}
                  >
                    <MdGroups className="w-4 h-4 shrink-0" />
                    <span className="whitespace-nowrap">{isDocenteView ? 'Aulas y Secciones' : 'Docentes y Aulas'}</span>
                  </button>

                  <button
                    type="button"
                    role="tab"
                    aria-selected={subTab === 'tendencia'}
                    onClick={() => setSubTab('tendencia')}
                    className={`h-full inline-flex items-center gap-1.5 px-3 rounded-lg text-xs sm:text-sm font-semibold transition-all duration-150 cursor-pointer outline-none ${
                      subTab === 'tendencia'
                        ? 'bg-emerald-600 text-white shadow-xs'
                        : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                    }`}
                    title="Gráficos de barras y líneas de evolución histórica y niveles"
                  >
                    <MdTrendingUp className="w-4 h-4 shrink-0" />
                    <span className="whitespace-nowrap">Tendencia y Promedios</span>
                  </button>
                </div>
              </div>

              {/* Derecha: Indicadores del grado y alcance institucional de la evaluación */}
              <div className="flex items-center gap-2 flex-wrap">
                <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-50 border border-slate-200/90 text-xs font-bold text-slate-700 shadow-2xs">
                  <MdSchool className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>{formatGradoDisplay(currentGrado).label}</span>
                </span>
                <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-50 border border-slate-200/90 text-xs font-semibold text-slate-600 shadow-2xs">
                  <MdClass className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>Todas las aulas ({estudiantes.length} alumnos)</span>
                </span>
              </div>
            </div>
          </div>

          {/* Contenido dinámico del área o evaluación seleccionada */}
          <div className="p-3 sm:p-5">
            {isTrendLoading ? (
              <TrendLoadingState categoryName={currentCategoryName} />
            ) : (
              <div className="flex flex-col gap-6 w-full animate-fadeIn">
                {/* 1. SECCIÓN: DISTRIBUCIÓN ACTUAL Y COBERTURA (Pie y Cobertura) */}
                {(subTab === 'todos' || subTab === 'cobertura') && (
                  <div className="bg-slate-50/60 rounded-2xl border border-slate-200/80 p-4 sm:p-5 shadow-2xs">
                    <div className="flex items-center justify-between pb-3 mb-4 border-b border-slate-200/80">
                      <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-xl bg-purple-50 border border-purple-200/80 flex items-center justify-center text-purple-600 shrink-0">
                          <MdPieChart className="w-4 h-4" />
                        </div>
                        <div>
                          <h3 className="text-sm sm:text-base font-bold text-slate-800">
                            Distribución de Logro y Cobertura Institucional
                          </h3>
                          <p className="text-xs text-slate-500">
                            Proporción de estudiantes en cada nivel de logro y cobertura de participación de la evaluación seleccionada.
                          </p>
                        </div>
                      </div>
                    </div>

                    <div className={styles.graficosContainer}>
                      <GraficoTendenciaColegio
                        evaluacion={evaluacion}
                        datosPorMes={datosPorMes}
                        mesesConDataDisponibles={mesesConDataDisponibles}
                        promedioGlobal={promedioGlobal}
                        monthSelected={monthSelected}
                        evaluados={evaluados}
                        pendientes={pendientes}
                        listaPendientes={listaPendientes}
                        dataGraficoTendenciaNiveles={dataPie}
                        soloPieYCobertura={true}
                      />
                    </div>
                  </div>
                )}

                {/* 2. SECCIÓN: COMPARATIVA POR DOCENTES Y SECCIONES */}
                {(subTab === 'todos' || subTab === 'docentes') && (
                  <div className="bg-slate-50/60 rounded-2xl border border-slate-200/80 p-4 sm:p-5 shadow-2xs">
                    <div className="flex items-center justify-between pb-3 mb-4 border-b border-slate-200/80">
                      <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-xl bg-teal-50 border border-teal-200/80 flex items-center justify-center text-teal-600 shrink-0">
                          <MdGroups className="w-4 h-4" />
                        </div>
                        <div>
                          <h3 className="text-sm sm:text-base font-bold text-slate-800">
                            {isDocenteView ? 'Comparativa por Secciones' : 'Comparativa por Docentes y Secciones'}
                          </h3>
                          <p className="text-xs text-slate-500">
                            {isDocenteView
                              ? 'Desglose comparativo por aula para identificar fortalezas y necesidades pedagógicas.'
                              : 'Desglose comparativo por aula y docente para identificar fortalezas y necesidades pedagógicas.'}
                          </p>
                        </div>
                      </div>
                    </div>

                    <div className={styles.graficosContainer}>
                      <GraficoTendenciaColegio
                        evaluacion={evaluacion}
                        datosPorMes={datosPorMes}
                        mesesConDataDisponibles={mesesConDataDisponibles}
                        promedioGlobal={promedioGlobal}
                        monthSelected={monthSelected}
                        promedioPorSeccion={promedioPorSeccion}
                        promedioPorDocente={isDocenteView ? undefined : promedioPorDocente}
                        evaluados={evaluados}
                        pendientes={pendientes}
                        listaPendientes={listaPendientes}
                        dataGraficoTendenciaNiveles={dataPie}
                        soloDocentesYSecciones={true}
                      />
                    </div>
                  </div>
                )}

                {/* 3. SECCIÓN: TENDENCIA O RESUMEN EJECUTIVO (después del gráfico de secciones) */}
                {(subTab === 'todos' || subTab === 'tendencia') && (
                  isEtapaConfigurada ? (
                    <div className="bg-slate-50/60 rounded-2xl border border-slate-200/80 p-4 sm:p-6 shadow-2xs space-y-6">
                      {/* Cabecera de la sección de Tendencia Longitudinal por Etapas */}
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-200/70">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-xl bg-blue-50 border border-blue-200/80 flex items-center justify-center text-blue-600 shrink-0">
                            <MdTrendingUp className="w-5 h-5" />
                          </div>
                          <div>
                            <div className="flex items-center gap-2 flex-wrap">
                              <h3 className="text-base sm:text-lg font-bold text-slate-800 tracking-tight">
                                Tendencia Longitudinal por Etapas · {radarTitle}
                              </h3>
                              <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-semibold bg-blue-50 text-blue-700 border border-blue-200/60">
                                EDI ➔ EP1 ➔ EP2
                              </span>
                            </div>
                            <p className="text-xs text-slate-500 mt-0.5">
                              Evolución del promedio global y distribución de niveles de logro a través de las evaluaciones diagnóstica y progresivas.
                            </p>
                          </div>
                        </div>

                        {/* Toggle % Porcentaje vs N° Estudiantes para el gráfico de niveles */}
                        <div className="flex items-center gap-2 self-start sm:self-auto">
                          <div className="inline-flex items-center p-0.5 bg-white rounded-lg border border-slate-200/90 text-xs shadow-2xs">
                            <button
                              type="button"
                              onClick={() => setMetricaNiveles('pct')}
                              className={`px-2.5 py-1 rounded-md font-semibold transition-all cursor-pointer ${
                                metricaNiveles === 'pct'
                                  ? 'bg-blue-600 text-white shadow-2xs'
                                  : 'text-slate-500 hover:text-slate-900'
                              }`}
                              title="Ver evolución en porcentajes (%)"
                            >
                              Porcentaje (%)
                            </button>
                            <button
                              type="button"
                              onClick={() => setMetricaNiveles('cant')}
                              className={`px-2.5 py-1 rounded-md font-semibold transition-all cursor-pointer ${
                                metricaNiveles === 'cant'
                                  ? 'bg-blue-600 text-white shadow-2xs'
                                  : 'text-slate-500 hover:text-slate-900'
                              }`}
                              title="Ver evolución en cantidad de estudiantes"
                            >
                              N° Alumnos
                            </button>
                          </div>
                        </div>
                      </div>

                      {/* Sub-barra ergonómica: Selector de Etapas a Visualizar/Comparar (EDI, EP1, EP2) */}
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white rounded-xl border border-slate-200/90 p-3 shadow-2xs">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-700 mr-1">
                            <MdFilterList className="w-4 h-4 text-blue-600" />
                            <span>Etapas a comparar:</span>
                          </span>

                          {(['edi', 'ep1', 'ep2'] as const).map((key) => {
                            const isSelected = selectedEtapas.includes(key);
                            let label = 'EDI (Diagnóstica)';
                            let badgeClass = 'text-blue-700 bg-blue-50 border-blue-300';
                            if (key === 'ep1') {
                              label = 'EP1 (Progresiva 1)';
                              badgeClass = 'text-amber-700 bg-amber-50 border-amber-300';
                            } else if (key === 'ep2') {
                              label = 'EP2 (Progresiva 2)';
                              badgeClass = 'text-emerald-700 bg-emerald-50 border-emerald-300';
                            }

                            return (
                              <button
                                key={key}
                                type="button"
                                onClick={() => toggleEtapa(key)}
                                className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold border transition-all cursor-pointer ${
                                  isSelected
                                    ? `${badgeClass} shadow-2xs ring-1 ring-slate-200`
                                    : 'bg-slate-50 text-slate-400 border-slate-200 hover:bg-slate-100 hover:text-slate-600'
                                }`}
                                title={
                                  isSelected
                                    ? `Ocultar ${label} de los gráficos`
                                    : `Incluir ${label} en los gráficos`
                                }
                                aria-pressed={isSelected}
                              >
                                {isSelected ? (
                                  <MdCheckBox className="w-4 h-4 shrink-0 text-current" />
                                ) : (
                                  <MdCheckBoxOutlineBlank className="w-4 h-4 shrink-0 text-slate-400" />
                                )}
                                <span>{label}</span>
                              </button>
                            );
                          })}
                        </div>

                        {/* Accesos rápidos y estado del filtro */}
                        <div className="flex items-center gap-2 self-end sm:self-auto">
                          <span className="text-[11px] font-semibold text-slate-500">
                            {selectedEtapas.length === 1
                              ? '👁️ Vista individual (1 evaluación)'
                              : selectedEtapas.length === 2
                              ? '⚖️ Comparativa directa (2 evaluaciones)'
                              : '📊 Tríada completa (3 evaluaciones)'}
                          </span>

                          {selectedEtapas.length < 3 && (
                            <button
                              type="button"
                              onClick={() => setSelectedEtapas(['edi', 'ep1', 'ep2'])}
                              className="text-[11px] font-bold text-blue-600 hover:text-blue-700 hover:underline cursor-pointer ml-1"
                            >
                              Ver todas (3)
                            </button>
                          )}

                          {currentEtapaKey && selectedEtapas.length !== 1 && (
                            <button
                              type="button"
                              onClick={() => setSelectedEtapas([currentEtapaKey])}
                              className="text-[11px] font-semibold text-slate-600 hover:text-blue-600 hover:underline cursor-pointer"
                            >
                              Solo actual
                            </button>
                          )}
                        </div>
                      </div>

                      {hasAnyEtapaData ? (
                        <>
                          {/* Tarjetas KPI de Resumen por Etapa */}
                          <div
                            className={`grid grid-cols-1 ${
                              etapasListaVisible.length === 1
                                ? 'sm:grid-cols-1 max-w-md mx-auto w-full'
                                : etapasListaVisible.length === 2
                                ? 'sm:grid-cols-2 max-w-3xl mx-auto w-full'
                                : 'sm:grid-cols-3'
                            } gap-3.5`}
                          >
                            {etapasListaVisible.map((item) => {
                              let badgeBg = 'bg-blue-50 text-blue-700 border-blue-200/70';
                              let borderHover = 'hover:border-blue-300';
                              if (item.key === 'ep1') {
                                badgeBg = 'bg-amber-50 text-amber-700 border-amber-200/70';
                                borderHover = 'hover:border-amber-300';
                              } else if (item.key === 'ep2') {
                                badgeBg = 'bg-emerald-50 text-emerald-700 border-emerald-200/70';
                                borderHover = 'hover:border-emerald-300';
                              }

                              return (
                                <div
                                  key={item.key}
                                  className={`bg-white rounded-xl border border-slate-200/90 p-3.5 shadow-2xs transition-all ${borderHover} ${
                                    item.isCurrent ? 'ring-2 ring-blue-500/40' : ''
                                  }`}
                                >
                                  <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                                    <span className={`px-2 py-0.5 rounded-md text-[11px] font-bold border ${badgeBg}`}>
                                      {item.label}
                                    </span>
                                    {item.isCurrent && (
                                      <span className="inline-flex items-center gap-1 text-[10px] font-bold text-blue-600 bg-blue-50 px-1.5 py-0.5 rounded">
                                        <MdCheckCircle className="w-3 h-3" /> Actual
                                      </span>
                                    )}
                                  </div>

                                  <div className="mt-2.5 flex items-baseline justify-between">
                                    <div>
                                      <div className="text-xl sm:text-2xl font-black text-slate-800 tracking-tight">
                                        {item.hasData ? `${item.promedio} pts` : '—'}
                                      </div>
                                      <div className="text-[11px] text-slate-500 mt-0.5">
                                        {item.hasData
                                          ? `${item.totalEstudiantes.toLocaleString('es-PE')} estudiantes`
                                          : 'Sin registros'}
                                      </div>
                                    </div>

                                    {item.hasData && (
                                      <div className="text-right">
                                        <span className="text-[11px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200/60 inline-block">
                                          {item.pctSatisfactorio}% Sat.
                                        </span>
                                      </div>
                                    )}
                                  </div>
                                </div>
                              );
                            })}
                          </div>

                          {/* Fila 1: Promedio Global (Barra a la izquierda, Línea a la derecha) */}
                          <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
                            {/* Gráfico 1: Barras de Promedio EDI, EP1, EP2 */}
                            <div className="bg-white rounded-xl border border-slate-200/80 p-4 shadow-2xs">
                              <div className="flex items-center justify-between pb-2 mb-3 border-b border-slate-100">
                                <div className="flex items-center gap-2">
                                  <div className="w-2.5 h-4 bg-blue-600 rounded-xs" />
                                  <h4 className="text-xs sm:text-sm font-bold text-slate-800">
                                    Promedio Global por Etapa (Barras)
                                  </h4>
                                </div>
                                <span className="text-[11px] font-semibold text-slate-500">Escala 0 a {maxScorePromedio} pts</span>
                              </div>
                              <div className="h-[250px] sm:h-[270px]">
                                <Bar
                                  key={`bar-promedio-${selectedEtapas.join('-')}`}
                                  data={chartDataBarrasEtapas}
                                  options={chartOptionsBarras}
                                  plugins={[dataLabelsPromedioPlugin]}
                                />
                              </div>
                            </div>

                            {/* Gráfico 2: Línea de Evolución de Promedio EDI -> EP1 -> EP2 */}
                            <div className="bg-white rounded-xl border border-slate-200/80 p-4 shadow-2xs">
                              <div className="flex items-center justify-between pb-2 mb-3 border-b border-slate-100">
                                <div className="flex items-center gap-2">
                                  <div className="w-2.5 h-4 bg-emerald-600 rounded-xs" />
                                  <h4 className="text-xs sm:text-sm font-bold text-slate-800">
                                    Curva de Evolución del Promedio (Línea)
                                  </h4>
                                </div>
                                <span className="text-[11px] font-semibold text-slate-500">Escala 0 a {maxScorePromedio} pts</span>
                              </div>
                              <div className="h-[250px] sm:h-[270px]">
                                <Line
                                  key={`line-promedio-${selectedEtapas.join('-')}`}
                                  data={chartDataLinealEtapas}
                                  options={chartOptionsLineal}
                                  plugins={[dataLabelsPromedioPlugin]}
                                />
                              </div>
                            </div>
                          </div>

                          {/* Fila 2: Tendencia Longitudinal de Niveles de Logro (Niveles en el Eje X) */}
                          <div className="bg-white rounded-xl border border-slate-200/80 p-4 shadow-2xs">
                            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 pb-3 mb-3 border-b border-slate-100">
                              <div className="flex items-center gap-2">
                                <div className="w-2.5 h-4 bg-indigo-600 rounded-xs" />
                                <h4 className="text-xs sm:text-sm font-bold text-slate-800">
                                  Tendencia de Rendimiento por Niveles ({metricaNiveles === 'pct' ? 'Porcentaje %' : 'N° Alumnos'})
                                </h4>
                              </div>

                              {/* Controles switcheables: [Líneas/Barras] [Auto Zoom] [Δ Deltas] [Valores] */}
                              <div className="flex items-center gap-2 flex-wrap self-end lg:self-auto">
                                {/* 1. Toggle Líneas / Barras Agrupadas */}
                                <div className="inline-flex items-center p-0.5 bg-slate-100 rounded-lg text-xs border border-slate-200/80">
                                  <button
                                    type="button"
                                    onClick={() => setTipoGraficoNiveles('line')}
                                    className={`flex items-center gap-1 px-2.5 py-1 rounded-md font-semibold transition-all cursor-pointer ${
                                      tipoGraficoNiveles === 'line'
                                        ? 'bg-white text-blue-700 shadow-2xs'
                                        : 'text-slate-500 hover:text-slate-800'
                                    }`}
                                    title="Ver evolución como gráfico de líneas"
                                    aria-pressed={tipoGraficoNiveles === 'line'}
                                  >
                                    <MdShowChart className="w-3.5 h-3.5" />
                                    <span>Líneas</span>
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => setTipoGraficoNiveles('bar')}
                                    className={`flex items-center gap-1 px-2.5 py-1 rounded-md font-semibold transition-all cursor-pointer ${
                                      tipoGraficoNiveles === 'bar'
                                        ? 'bg-white text-blue-700 shadow-2xs'
                                        : 'text-slate-500 hover:text-slate-800'
                                    }`}
                                    title="Ver comparación directa como barras agrupadas (evita solapamiento)"
                                    aria-pressed={tipoGraficoNiveles === 'bar'}
                                  >
                                    <MdBarChart className="w-3.5 h-3.5" />
                                    <span>Barras</span>
                                  </button>
                                </div>

                                {/* 2. Toggle Auto Zoom / Escala Dinámica */}
                                <button
                                  type="button"
                                  onClick={() => setEscalaDinamicaNiveles((prev) => !prev)}
                                  className={`flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-semibold border transition-all cursor-pointer ${
                                    escalaDinamicaNiveles
                                      ? 'bg-indigo-50 text-indigo-700 border-indigo-300 shadow-2xs'
                                      : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50 hover:text-slate-800'
                                  }`}
                                  title={
                                    escalaDinamicaNiveles
                                      ? 'Escala optimizada / zoom activa (clic para volver a 0-100%)'
                                      : 'Activar zoom vertical para amplificar diferencias mínimas'
                                  }
                                  aria-pressed={escalaDinamicaNiveles}
                                >
                                  <MdZoomIn className="w-3.5 h-3.5" />
                                  <span>{escalaDinamicaNiveles ? 'Zoom Activo' : 'Auto Zoom'}</span>
                                </button>

                                {/* 3. Toggle Deltas / Diferencias en Tooltip */}
                                <button
                                  type="button"
                                  onClick={() => setMostrarDeltasTooltip((prev) => !prev)}
                                  className={`flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-semibold border transition-all cursor-pointer ${
                                    mostrarDeltasTooltip
                                      ? 'bg-emerald-50 text-emerald-700 border-emerald-300 shadow-2xs'
                                      : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50 hover:text-slate-800'
                                  }`}
                                  title={
                                    mostrarDeltasTooltip
                                      ? 'Diferencias (Δ) calculadas en tooltip activas (clic para desactivar)'
                                      : 'Activar cálculo de diferencias (Δ) en tooltip'
                                  }
                                  aria-pressed={mostrarDeltasTooltip}
                                >
                                  <MdCompareArrows className="w-3.5 h-3.5" />
                                  <span>{mostrarDeltasTooltip ? 'Δ Deltas On' : 'Δ Deltas Off'}</span>
                                </button>

                                {/* 4. Toggle Valores Permanentes en Puntos y Barras */}
                                <button
                                  type="button"
                                  onClick={() => setMostrarEtiquetasValores((prev) => !prev)}
                                  className={`flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-semibold border transition-all cursor-pointer ${
                                    mostrarEtiquetasValores
                                      ? 'bg-purple-50 text-purple-700 border-purple-300 shadow-2xs'
                                      : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50 hover:text-slate-800'
                                  }`}
                                  title={
                                    mostrarEtiquetasValores
                                      ? 'Etiquetas de valores visibles en puntos y barras (clic para ocultar)'
                                      : 'Mostrar valores directamente en cada punto y barra'
                                  }
                                  aria-pressed={mostrarEtiquetasValores}
                                >
                                  <MdOutlineLabel className="w-3.5 h-3.5" />
                                  <span>{mostrarEtiquetasValores ? 'Valores On' : 'Valores Off'}</span>
                                </button>
                              </div>
                            </div>

                            {/* Sub-cabecera con leyenda de etapas y estado de escala */}
                            <div className="flex items-center justify-between pb-2 mb-2 text-[11px] text-slate-500">
                              <div className="flex items-center gap-3 flex-wrap font-semibold">
                                {etapasListaVisible.map((etapa) => {
                                  let dotColor = 'text-blue-600';
                                  if (etapa.key === 'ep1') dotColor = 'text-amber-600';
                                  else if (etapa.key === 'ep2') dotColor = 'text-emerald-600';
                                  return (
                                    <span key={etapa.key} className={`inline-flex items-center gap-1 ${dotColor} font-bold`}>
                                      ● {etapa.label}
                                    </span>
                                  );
                                })}
                              </div>
                              {escalaDinamicaNiveles && (
                                <span className="text-[10px] font-medium text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded border border-indigo-100">
                                  Escala amplificada a max {yMaxNiveles}{metricaNiveles === 'pct' ? '%' : ' pts'}
                                </span>
                              )}
                            </div>

                            <div className="h-[280px] sm:h-[310px]">
                              {tipoGraficoNiveles === 'bar' ? (
                                <Bar
                                  key={`bar-niveles-${escalaDinamicaNiveles ? yMaxNiveles : '100'}-${mostrarEtiquetasValores ? 'labels' : 'nolabels'}-${metricaNiveles}-${selectedEtapas.join('-')}`}
                                  data={chartDataNivelesEtapas}
                                  options={chartOptionsNiveles}
                                  plugins={[dataLabelsNivelesPlugin]}
                                />
                              ) : (
                                <Line
                                  key={`line-niveles-${escalaDinamicaNiveles ? yMaxNiveles : '100'}-${mostrarEtiquetasValores ? 'labels' : 'nolabels'}-${metricaNiveles}-${selectedEtapas.join('-')}`}
                                  data={chartDataNivelesEtapas}
                                  options={chartOptionsNiveles}
                                  plugins={[dataLabelsNivelesPlugin]}
                                />
                              )}
                            </div>
                          </div>
                        </>
                      ) : (
                        <div className="flex items-center gap-3 p-4 bg-white rounded-xl border border-dashed border-slate-200 text-slate-500 text-xs sm:text-sm">
                          <MdInfoOutline className="w-5 h-5 text-blue-500 shrink-0" />
                          <span>
                            Aún no se cuenta con registros de evaluaciones EDI, EP1 o EP2 aplicadas para generar la curva longitudinal de {radarTitle}. Los datos se actualizarán automáticamente a medida que se rindan las pruebas en la institución.
                          </span>
                        </div>
                      )}
                    </div>
                  ) : hasMonthlyData ? (
                    /* Si tiene datos históricos mensuales para esta evaluación independiente */
                    <div className="bg-slate-50/60 rounded-2xl border border-slate-200/80 p-4 sm:p-6 shadow-2xs space-y-6">
                      <div className="flex items-center gap-3 pb-4 border-b border-slate-200/70">
                        <div className="w-10 h-10 rounded-xl bg-blue-50 border border-blue-200/80 flex items-center justify-center text-blue-600 shrink-0">
                          <MdTrendingUp className="w-5 h-5" />
                        </div>
                        <div>
                          <div className="flex items-center gap-2 flex-wrap">
                            <h3 className="text-base sm:text-lg font-bold text-slate-800 tracking-tight">
                              Evolución Histórica Mensual · {(evaluacion?.nombre || 'EVALUACIÓN').toUpperCase()}
                            </h3>
                            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200/60">
                              Histórico Mensual
                            </span>
                          </div>
                          <p className="text-xs text-slate-500 mt-0.5">
                            Tendencia del promedio global y distribución de niveles de rendimiento a lo largo de los meses evaluados.
                          </p>
                        </div>
                      </div>

                      <div className={styles.graficosContainer}>
                        <GraficoTendenciaColegio
                          evaluacion={evaluacion}
                          datosPorMes={datosPorMes}
                          mesesConDataDisponibles={mesesConDataDisponibles}
                          promedioGlobal={promedioGlobal}
                          monthSelected={monthSelected}
                          evaluados={evaluados}
                          pendientes={pendientes}
                          listaPendientes={listaPendientes}
                          dataGraficoTendenciaNiveles={dataPie}
                          soloPrincipales={true}
                        />
                      </div>
                    </div>
                  ) : (
                    /* Tarjeta de Resumen Ejecutivo si es una evaluación única sin serie mensual */
                    <div className="bg-slate-50/60 rounded-2xl border border-slate-200/80 p-4 sm:p-6 shadow-2xs space-y-5">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-200/70">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-xl bg-blue-50 border border-blue-200/80 flex items-center justify-center text-blue-600 shrink-0">
                            <MdDashboard className="w-5 h-5" />
                          </div>
                          <div>
                            <div className="flex items-center gap-2 flex-wrap">
                              <h3 className="text-base sm:text-lg font-bold text-slate-800 tracking-tight">
                                Resumen Ejecutivo · {(evaluacion?.nombre || 'EVALUACIÓN').toUpperCase()}
                              </h3>
                              <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-semibold bg-blue-50 text-blue-700 border border-blue-200/60">
                                Evaluación Institucional
                              </span>
                            </div>
                            <p className="text-xs text-slate-500 mt-0.5">
                              Métricas consolidadas de rendimiento y cobertura para la evaluación seleccionada.
                            </p>
                          </div>
                        </div>
                      </div>

                      {/* Cuadrícula de KPIs Principales */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                        {/* KPI 1: Promedio General */}
                        <div className="bg-white rounded-xl border border-slate-200/80 p-4 shadow-2xs flex flex-col justify-between">
                          <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Promedio General</span>
                          <div className="flex items-baseline gap-2 my-2">
                            <span className="text-2xl sm:text-3xl font-extrabold text-blue-600">
                              {resumenEvaluacion.promedio}
                            </span>
                            <span className="text-xs font-medium text-slate-400">/ 20 pts</span>
                          </div>
                          <span className="text-[11px] text-slate-500">
                            Puntaje medio institucional
                          </span>
                        </div>

                        {/* KPI 2: Estudiantes Evaluados */}
                        <div className="bg-white rounded-xl border border-slate-200/80 p-4 shadow-2xs flex flex-col justify-between">
                          <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Estudiantes Evaluados</span>
                          <div className="flex items-baseline gap-2 my-2">
                            <span className="text-2xl sm:text-3xl font-extrabold text-emerald-600">
                              {evaluados || resumenEvaluacion.total}
                            </span>
                            {pendientes > 0 && (
                              <span className="text-xs font-medium text-amber-600">({pendientes} pend.)</span>
                            )}
                          </div>
                          <span className="text-[11px] text-slate-500">
                            Total de alumnos con registro
                          </span>
                        </div>

                        {/* KPI 3: Cobertura Institucional */}
                        <div className="bg-white rounded-xl border border-slate-200/80 p-4 shadow-2xs flex flex-col justify-between">
                          <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Cobertura</span>
                          <div className="flex items-baseline gap-2 my-2">
                            <span className="text-2xl sm:text-3xl font-extrabold text-indigo-600">
                              {(evaluados + pendientes) > 0 ? `${Math.round((evaluados / (evaluados + pendientes)) * 100)}%` : '100%'}
                            </span>
                            <span className="text-xs font-medium text-slate-400">participación</span>
                          </div>
                          <span className="text-[11px] text-slate-500">
                            Porcentaje de matrícula evaluada
                          </span>
                        </div>

                        {/* KPI 4: Nivel Predominante */}
                        <div className="bg-white rounded-xl border border-slate-200/80 p-4 shadow-2xs flex flex-col justify-between">
                          <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Nivel Predominante</span>
                          <div className="my-2">
                            <span className={`inline-flex items-center px-2.5 py-1 rounded-lg text-xs font-bold border ${resumenEvaluacion.predominante?.color || 'text-slate-700 bg-slate-50 border-slate-200'}`}>
                              {resumenEvaluacion.predominante?.label || 'Sin datos'} ({resumenEvaluacion.predominante?.pct || 0}%)
                            </span>
                          </div>
                          <span className="text-[11px] text-slate-500">
                            Mayor concentración de alumnos
                          </span>
                        </div>
                      </div>

                      {/* Notificación informativa contextual */}
                      <div className="flex items-start gap-3 p-3.5 bg-white rounded-xl border border-dashed border-slate-200 text-slate-600 text-xs sm:text-sm">
                        <MdInfoOutline className="w-5 h-5 text-amber-500 shrink-0 mt-0.5" />
                        <div>
                          <span className="font-semibold text-slate-800">Evaluación no sujeta a etapas EDI/EP1/EP2:</span>{' '}
                          Esta prueba opera como evaluación independiente. Puedes revisar en las siguientes secciones la distribución de niveles de logro (gráfico circular) y el rendimiento detallado por docentes y aulas.
                        </div>
                      </div>
                    </div>
                  )
                )}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default DirectorTendenciasTab;
