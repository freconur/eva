import React, { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import {
  MdBubbleChart,
  MdFactCheck,
  MdAssignment,
  MdSchool,
  MdRestartAlt,
  MdMenuBook,
  MdCalculate,
  MdLocationOn,
  MdDomain,
} from 'react-icons/md';
import { RiLoader4Line } from 'react-icons/ri';
import { doc, getDoc, collection, query, getDocs, orderBy, getFirestore, where } from 'firebase/firestore';
import { getFunctions, httpsCallable } from 'firebase/functions';
import { Evaluaciones, PreguntasRespuestas, UserEstudiante } from '@/features/types/types';
import { useGlobalContext } from '@/features/context/GlolbalContext';
import { getCategoriasParaGrado } from '@/fuctions/categorias';
import { regiones, regionTexto, gradosDeColegio, getGradoTexto } from '@/fuctions/regiones';
import SegmentedFilterBar, { FilterItem, FilterOption } from '@/components/common/SegmentedFilterBar';
import { addNoRespondioAlternative } from '@/features/utils/addNoRespondioAlternative';
import {
  BaremoDecisiones,
  DEFAULT_BAREMO_DECISIONES,
} from '@/components/modals/ConfigurarBaremoModal';
import GuiaBurbujasModal from '@/components/modals/GuiaBurbujasModal';
import GuiaDecisionesModal from '@/components/modals/GuiaDecisionesModal';
import QuestionDetailPopover from '@/components/reportes/QuestionDetailPopover';
import { DirectorMetricasResumen, SeccionMetrica, PreguntaMetricaSeccion } from './types';
import {
  calculateMetricasDirector,
  getNivelRiesgo,
  formatSeccionDisplay,
} from './useMetricasDirector';
import { useEvaluacionesMatriz } from './useEvaluacionesMatriz';
import DirectorBurbujasTab from './DirectorBurbujasTab';
import DirectorDecisionesTab from './DirectorDecisionesTab';
import DirectorCategoriaTabs, {
  EmptyCategoriaState,
  formatCategoriaLabel,
} from './DirectorCategoriaTabs';

/**
 * Componente de carga localizada para la Matriz de Burbujas / Decisiones UGEL.
 */
const MatrixLoadingState: React.FC<{
  categoryName: string;
  subTab: 'burbujas' | 'decisiones';
  ugelName: string;
}> = ({ categoryName, subTab, ugelName }) => {
  return (
    <div
      className="flex flex-col items-center justify-center py-12 sm:py-16 px-4 bg-slate-50/50 rounded-2xl border border-dashed border-slate-200/90 my-2 min-h-[380px] animate-fadeIn"
      role="status"
      aria-live="polite"
      aria-label={`Cargando datos pedagógicos de UGEL ${ugelName} - ${categoryName}`}
    >
      <div className="relative flex items-center justify-center w-14 h-14 rounded-full bg-blue-50 ring-8 ring-blue-50/60 mb-3.5">
        <RiLoader4Line className="w-7 h-7 text-blue-600 animate-spin" />
      </div>

      <h4 className="text-sm sm:text-base font-bold text-slate-800 mb-1">
        Cargando {subTab === 'burbujas' ? 'Matriz de Burbujas' : 'Panel de Decisiones'} · UGEL {ugelName}
      </h4>

      <p className="text-xs text-slate-500 max-w-md text-center mb-6 leading-relaxed">
        Sincronizando consolidados de directores e instituciones para el área de {categoryName}...
      </p>

      <div className="w-full max-w-3xl bg-white rounded-xl border border-slate-200/80 p-4 shadow-2xs space-y-3.5 opacity-80">
        <div className="flex items-center justify-between pb-2 border-b border-slate-100">
          <div className="h-4 w-32 bg-slate-200 rounded animate-pulse" />
          <div className="flex gap-4">
            <div className="h-4 w-10 bg-slate-100 rounded animate-pulse" />
            <div className="h-4 w-10 bg-slate-100 rounded animate-pulse" />
            <div className="h-4 w-10 bg-slate-100 rounded animate-pulse" />
            <div className="h-4 w-10 bg-slate-100 rounded animate-pulse" />
          </div>
        </div>

        {[1, 2, 3, 4].map((row) => (
          <div key={row} className="flex items-center justify-between py-1">
            <div className="flex items-center gap-2">
              <div className="h-3.5 w-24 bg-slate-200 rounded animate-pulse" />
              <div className="h-3 w-16 bg-slate-100 rounded animate-pulse" />
            </div>
            <div className="flex items-center gap-4">
              <div className="w-6 h-6 rounded-full bg-emerald-100/80 animate-pulse" />
              <div className="w-6 h-6 rounded-full bg-amber-100/80 animate-pulse" />
              <div className="w-6 h-6 rounded-full bg-rose-100/80 animate-pulse" />
            </div>
          </div>
        ))}
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

/**
 * Procesa la data consolidada de directores por UGEL para generar las métricas de la matriz
 */
function calculateMetricasUgel(
  directores: any[],
  preguntas: PreguntasRespuestas[],
  baremo: BaremoDecisiones,
  ugelNombre: string
): DirectorMetricasResumen {
  const sortedPreguntas = [...preguntas].sort(
    (a, b) => Number(a.order || 0) - Number(b.order || 0)
  );

  const correctMap = new Map<number, string>();
  sortedPreguntas.forEach((p, idx) => {
    const order = p.order !== undefined && p.order !== null ? Number(p.order) : idx + 1;
    if (p.respuesta) {
      correctMap.set(order, p.respuesta.trim().toUpperCase());
    }
  });

  const getQuestionStats = (d: any, order: number, pId?: string) => {
    const orderStr = String(order);
    const idStr = pId ? String(pId) : '';

    let qObj: any = null;
    if (d.preguntas && typeof d.preguntas === 'object') {
      qObj = d.preguntas[orderStr] || (idStr ? d.preguntas[idStr] : null);
    }

    const getAltCount = (alt: string) => {
      const u = alt.toUpperCase();
      const l = alt.toLowerCase();
      if (qObj) {
        if (qObj[u] !== undefined) return Number(qObj[u]);
        if (qObj[l] !== undefined) return Number(qObj[l]);
      }
      if (d[`preguntas.${orderStr}.${u}`] !== undefined) return Number(d[`preguntas.${orderStr}.${u}`]);
      if (d[`preguntas.${orderStr}.${l}`] !== undefined) return Number(d[`preguntas.${orderStr}.${l}`]);
      if (idStr) {
        if (d[`preguntas.${idStr}.${u}`] !== undefined) return Number(d[`preguntas.${idStr}.${u}`]);
        if (d[`preguntas.${idStr}.${l}`] !== undefined) return Number(d[`preguntas.${idStr}.${l}`]);
      }
      return 0;
    };

    let total = 0;
    if (qObj && qObj.total !== undefined) {
      total = Number(qObj.total);
    } else if (d[`preguntas.${orderStr}.total`] !== undefined) {
      total = Number(d[`preguntas.${orderStr}.total`]);
    } else if (idStr && d[`preguntas.${idStr}.total`] !== undefined) {
      total = Number(d[`preguntas.${idStr}.total`]);
    } else {
      total = Number(d.totalEstudiantes || 0);
    }

    return { total, getAltCount };
  };

  // 1. Métricas por Institución / Director
  const secciones: SeccionMetrica[] = directores.map((d) => {
    const totalEstudiantesDir = Number(d.totalEstudiantes || 0);
    const preguntasMetricas: Record<number, PreguntaMetricaSeccion> = {};
    let sumPrev = 0;
    let countPreguntas = 0;
    let criticas = 0;
    let altas = 0;
    let medias = 0;
    let bajas = 0;
    let maxPrevPct = -1;
    let topPregunta: PreguntaMetricaSeccion | null = null;

    sortedPreguntas.forEach((p, idx) => {
      const order = p.order !== undefined && p.order !== null ? Number(p.order) : idx + 1;
      const correctLetter = correctMap.get(order);
      const { total, getAltCount } = getQuestionStats(d, order, p.id);
      const qTotal = total > 0 ? total : totalEstudiantesDir;

      let correctas = 0;
      if (correctLetter) {
        correctas = getAltCount(correctLetter);
      }

      const falladas = Math.max(0, qTotal - correctas);
      const aciertoPct = qTotal > 0 ? Math.round((correctas / qTotal) * 100) : 0;
      const prevPct = qTotal > 0 ? Math.max(0, 100 - aciertoPct) : 0;

      const metrica: PreguntaMetricaSeccion = {
        order,
        preguntaId: p.id || '',
        totalEstudiantes: qTotal,
        correctas,
        falladas,
        aciertoPct,
        prevPct,
      };

      preguntasMetricas[order] = metrica;

      if (qTotal > 0) {
        sumPrev += prevPct;
        countPreguntas++;
        if (prevPct >= baremo.critico) criticas++;
        else if (prevPct >= baremo.alto) altas++;
        else if (prevPct >= baremo.medio) medias++;
        else bajas++;

        if (prevPct > maxPrevPct) {
          maxPrevPct = prevPct;
          topPregunta = metrica;
        }
      }
    });

    const avgPrev = countPreguntas > 0 ? Math.round(sumPrev / countPreguntas) : 0;
    const nivelRiesgo = getNivelRiesgo(avgPrev, criticas, baremo);

    const rawInstitucion = d.institucion || d.nombreInstitucion || d.nombreIE;
    const nombreIe = rawInstitucion
      ? (rawInstitucion.toUpperCase().startsWith('IE') ? rawInstitucion.toUpperCase() : `IE ${rawInstitucion.toUpperCase()}`)
      : (d.id ? `IE ${d.id}` : 'I.E. Sin Nombre');

    return {
      id: String(d.id || d.dniDirector || Math.random()),
      nombre: nombreIe,
      docenteNombre: d.nombresDirector || d.nombreDirector || d.directorNombre || undefined,
      totalEstudiantes: totalEstudiantesDir,
      preguntas: preguntasMetricas,
      avgPrev,
      criticas,
      altas,
      medias,
      bajas,
      topPregunta,
      nivelRiesgo,
    };
  });

  // Ordenar por rezago descendente (instituciones con mayor necesidad primero)
  secciones.sort((a, b) => b.avgPrev - a.avgPrev);

  // 2. Fila Consolidada UGEL
  const preguntasTotalUgel: Record<number, PreguntaMetricaSeccion> = {};
  let sumPrevUgel = 0;
  let countPreguntasUgel = 0;
  let criticasUgel = 0;
  let altasUgel = 0;
  let mediasUgel = 0;
  let bajasUgel = 0;
  let maxPrevPctUgel = -1;
  let topPreguntaUgel: PreguntaMetricaSeccion | null = null;
  let totalEstudiantesUgel = 0;

  directores.forEach((d) => {
    totalEstudiantesUgel += Number(d.totalEstudiantes || 0);
  });

  sortedPreguntas.forEach((p, idx) => {
    const order = p.order !== undefined && p.order !== null ? Number(p.order) : idx + 1;
    const correctLetter = correctMap.get(order);

    let qTotalUgel = 0;
    let correctasUgel = 0;

    directores.forEach((d) => {
      const { total, getAltCount } = getQuestionStats(d, order, p.id);
      const t = total > 0 ? total : Number(d.totalEstudiantes || 0);
      qTotalUgel += t;
      if (correctLetter) {
        correctasUgel += getAltCount(correctLetter);
      }
    });

    const effTotal = qTotalUgel > 0 ? qTotalUgel : totalEstudiantesUgel;
    const falladasUgel = Math.max(0, effTotal - correctasUgel);
    const aciertoPctUgel = effTotal > 0 ? Math.round((correctasUgel / effTotal) * 100) : 0;
    const prevPctUgel = effTotal > 0 ? Math.max(0, 100 - aciertoPctUgel) : 0;

    const metricaUgel: PreguntaMetricaSeccion = {
      order,
      preguntaId: p.id || '',
      totalEstudiantes: effTotal,
      correctas: correctasUgel,
      falladas: falladasUgel,
      aciertoPct: aciertoPctUgel,
      prevPct: prevPctUgel,
    };

    preguntasTotalUgel[order] = metricaUgel;

    if (effTotal > 0) {
      sumPrevUgel += prevPctUgel;
      countPreguntasUgel++;
      if (prevPctUgel >= baremo.critico) criticasUgel++;
      else if (prevPctUgel >= baremo.alto) altasUgel++;
      else if (prevPctUgel >= baremo.medio) mediasUgel++;
      else bajasUgel++;

      if (prevPctUgel > maxPrevPctUgel) {
        maxPrevPctUgel = prevPctUgel;
        topPreguntaUgel = metricaUgel;
      }
    }
  });

  const avgPrevUgel = countPreguntasUgel > 0 ? Math.round(sumPrevUgel / countPreguntasUgel) : 0;
  const nivelRiesgoUgel = getNivelRiesgo(avgPrevUgel, criticasUgel, baremo);

  const totalIe: SeccionMetrica = {
    id: 'total_ie',
    nombre: `CONSOLIDADO UGEL ${ugelNombre.toUpperCase()}`,
    totalEstudiantes: totalEstudiantesUgel,
    preguntas: preguntasTotalUgel,
    avgPrev: avgPrevUgel,
    criticas: criticasUgel,
    altas: altasUgel,
    medias: mediasUgel,
    bajas: bajasUgel,
    topPregunta: topPreguntaUgel,
    nivelRiesgo: nivelRiesgoUgel,
  };

  const kpis = {
    totalCritico: totalIe.criticas,
    totalAlto: totalIe.altas,
    totalMedio: totalIe.medias,
    totalBajo: totalIe.bajas,
    avgPrev: totalIe.avgPrev,
  };

  return {
    secciones,
    totalIe,
    kpis,
    activeBaremo: baremo,
    sortedPreguntas,
  };
}

interface UgelBrechasTabProps {
  evaluacion?: Evaluaciones;
  evaluacionesDb?: Evaluaciones[];
  preguntasRespuestas?: PreguntasRespuestas[];
  currentUserData?: any;
  yearSelected?: number;
  monthSelected?: number;
}

export const UgelBrechasTab: React.FC<UgelBrechasTabProps> = ({
  evaluacion,
  evaluacionesDb = [],
  preguntasRespuestas = [],
  currentUserData,
  yearSelected,
  monthSelected,
}) => {
  const { categorias: contextCategorias } = useGlobalContext();

  const isEspecialistaUgel = currentUserData?.rol === 1;

  // 1. UGEL seleccionada: Si es especialista, fijada estrictamente a su región; si es admin, seleccionable
  const [selectedUgelId, setSelectedUgelId] = useState<number>(() => {
    if (currentUserData?.region !== undefined && currentUserData?.region !== null) {
      return Number(currentUserData.region);
    }
    return 1; // Default Puno
  });

  useEffect(() => {
    if (isEspecialistaUgel && currentUserData?.region) {
      setSelectedUgelId(Number(currentUserData.region));
    }
  }, [isEspecialistaUgel, currentUserData?.region]);

  const currentUgelName = useMemo(() => {
    return regionTexto(selectedUgelId) || `UGEL ${selectedUgelId}`;
  }, [selectedUgelId]);

  // Sub-pestaña activa: Matriz de Burbujas vs Panel de Decisiones
  const [subTab, setSubTab] = useState<'burbujas' | 'decisiones'>('burbujas');

  // Filtro de institución local en la matriz de burbujas
  const [selectedInstitucion, setSelectedInstitucion] = useState<string>('all');

  // 2. Grado local independiente de Brechas de Aprendizaje
  const [localGrado, setLocalGrado] = useState<number>(() => {
    if (evaluacion?.grado !== undefined && evaluacion?.grado !== null) {
      return Number(evaluacion.grado);
    }
    return 2;
  });

  // 3. ID de evaluación local activa en Brechas de Aprendizaje
  const [localEvaluacionId, setLocalEvaluacionId] = useState<string | undefined>(evaluacion?.id);

  // 4. Categoría de área curricular activa (1 = LEE por defecto o la de la evaluación)
  const [selectedCategoriaId, setSelectedCategoriaId] = useState<number>(() => {
    if (evaluacion?.categoria !== undefined && evaluacion?.categoria !== null) {
      return Number(evaluacion.categoria);
    }
    return 1;
  });

  // Sincronizar estado local si la evaluación inicial cambia
  const prevInitEvalIdRef = useRef(evaluacion?.id);
  useEffect(() => {
    if (evaluacion?.id && evaluacion.id !== prevInitEvalIdRef.current) {
      prevInitEvalIdRef.current = evaluacion.id;
      setLocalEvaluacionId(evaluacion.id);
      if (evaluacion.grado !== undefined && evaluacion.grado !== null) {
        setLocalGrado(Number(evaluacion.grado));
      }
      if (evaluacion.categoria !== undefined && evaluacion.categoria !== null) {
        setSelectedCategoriaId(Number(evaluacion.categoria));
      }
      setSelectedInstitucion('all');
    }
  }, [evaluacion?.id, evaluacion?.grado, evaluacion?.categoria]);

  // Caché de directores y preguntas por evaluacionId
  const [evalCache, setEvalCache] = useState<
    Record<
      string,
      {
        evaluacion: Evaluaciones;
        preguntas: PreguntasRespuestas[];
        directores: any[];
      }
    >
  >({});
  const [loadingLocalData, setLoadingLocalData] = useState<boolean>(false);

  // Caché de drill-down de instituciones (estudiantes agrupados por secciones)
  const [schoolDrillDownCache, setSchoolDrillDownCache] = useState<
    Record<
      string,
      {
        estudiantes: UserEstudiante[];
        metricas: DirectorMetricasResumen;
      }
    >
  >({});
  const [loadingSchoolDrillDown, setLoadingSchoolDrillDown] = useState<boolean>(false);

  // Instancia de evaluación activa en Brechas
  const activeEvaluacion = useMemo<Evaluaciones | undefined>(() => {
    if (!localEvaluacionId) return undefined;
    if (evaluacion?.id === localEvaluacionId) return evaluacion;
    const foundInDb = evaluacionesDb.find((e) => e.id === localEvaluacionId);
    if (foundInDb) return foundInDb;
    return evalCache[localEvaluacionId]?.evaluacion;
  }, [localEvaluacionId, evaluacion, evaluacionesDb, evalCache]);

  // Handler local para cambiar de evaluación (aislado a Brechas)
  const handleLocalSelectEvaluacion = useCallback(
    (newEvalId: string, _targetMonth?: number, newGrado?: number | string) => {
      if (newGrado !== undefined && newGrado !== '') {
        setLocalGrado(Number(newGrado));
      }
      setLocalEvaluacionId(newEvalId);
      setSelectedInstitucion('all');
    },
    []
  );

  // Integración de matriz_resultados para EDI, EP1, EP2
  const {
    selectedEtapa,
    etapaOptions,
    handleSelectEtapa,
    handleSelectCategoria,
    matrizConfigGrados,
    baremoDecisiones,
  } = useEvaluacionesMatriz({
    grado: localGrado,
    evaluacion: activeEvaluacion,
    evaluacionesDb,
    selectedCategoriaId,
    onSelectEvaluacion: handleLocalSelectEvaluacion,
  });

  // Categorías de área curricular disponibles según el grado
  const categoriasDisponibles = useMemo(() => {
    return getCategoriasParaGrado(localGrado, contextCategorias, evaluacionesDb);
  }, [localGrado, contextCategorias, evaluacionesDb]);

  // Categorías con configuración asignada en este grado
  const configuredCategories = useMemo(() => {
    return categoriasDisponibles.filter((cat) => {
      const assignment = matrizConfigGrados[`${localGrado}_${cat.id}`];
      return !!(assignment && (assignment.ediId || assignment.ep1Id || assignment.ep2Id));
    });
  }, [categoriasDisponibles, matrizConfigGrados, localGrado]);

  // Verificar si la categoría actualmente seleccionada tiene asignación
  const selectedCategoryAssignment = matrizConfigGrados[`${localGrado}_${selectedCategoriaId}`];
  const isSelectedCategoryConfigured = !!(
    selectedCategoryAssignment &&
    (selectedCategoryAssignment.ediId || selectedCategoryAssignment.ep1Id || selectedCategoryAssignment.ep2Id)
  );

  const hasActiveEvaluationForCategory =
    Boolean(localEvaluacionId) || isSelectedCategoryConfigured;

  // Auto-seleccionar la primera categoría configurada si la actual no tiene
  useEffect(() => {
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
  }, [configuredCategories, selectedCategoriaId, handleSelectCategoria]);

  const handleCategoriaChange = (catId: number) => {
    setSelectedCategoriaId(catId);
    handleSelectCategoria(catId);
  };

  // Opciones para el filtro de Grados
  const gradoOptions: FilterOption[] = useMemo(() => {
    let availableGrados = gradosDeColegio;
    if (!availableGrados.some((g) => g.id === localGrado)) {
      const currentGradeObj = gradosDeColegio.find((g) => g.id === localGrado);
      if (currentGradeObj) {
        availableGrados = [...availableGrados, currentGradeObj].sort((a, b) => a.id - b.id);
      }
    }

    return availableGrados.map((g) => {
      const hasConfig =
        Object.keys(matrizConfigGrados).some((key) => {
          if (!key.startsWith(`${g.id}_`) && key !== `${g.id}`) return false;
          const asgn = matrizConfigGrados[key];
          return !!(asgn && (asgn.ediId || asgn.ep1Id || asgn.ep2Id));
        }) || evaluacionesDb.some((e) => Number(e.grado) === g.id);

      const display = formatGradoDisplay(g.id);

      return {
        value: String(g.id),
        label: display.label,
        badge: hasConfig ? '✓ Configurado' : 'Sin asignar',
        badgeType: (hasConfig ? 'success' : 'neutral') as 'success' | 'neutral',
      };
    });
  }, [localGrado, matrizConfigGrados, evaluacionesDb]);

  const handleSelectGrado = (newGradoStr: string) => {
    const newGrado = Number(newGradoStr);
    if (newGrado === localGrado) return;

    setSelectedInstitucion('all');
    setLocalGrado(newGrado);

    const assignmentActual = matrizConfigGrados[`${newGrado}_${selectedCategoriaId}`];
    let targetEvalId: string | undefined = undefined;
    let targetCatId = selectedCategoriaId;

    if (assignmentActual && (assignmentActual.ep1Id || assignmentActual.ediId || assignmentActual.ep2Id)) {
      targetEvalId =
        assignmentActual[`${selectedEtapa}Id`] ||
        assignmentActual.ep1Id ||
        assignmentActual.ediId ||
        assignmentActual.ep2Id;
    }

    if (!targetEvalId) {
      const catsForNewGrade = getCategoriasParaGrado(newGrado, contextCategorias, evaluacionesDb);
      for (const cat of catsForNewGrade) {
        const asgn = matrizConfigGrados[`${newGrado}_${cat.id}`];
        if (asgn && (asgn.ep1Id || asgn.ediId || asgn.ep2Id)) {
          targetEvalId =
            asgn[`${selectedEtapa}Id`] ||
            asgn.ep1Id ||
            asgn.ediId ||
            asgn.ep2Id;
          targetCatId = Number(cat.id);
          break;
        }
      }
    }

    if (!targetEvalId && evaluacionesDb.length > 0) {
      const foundInDb = evaluacionesDb.find((e) => Number(e.grado) === newGrado);
      if (foundInDb) {
        targetEvalId = foundInDb.id;
        if (foundInDb.categoria) {
          targetCatId = Number(foundInDb.categoria);
        }
      }
    }

    if (targetCatId !== selectedCategoriaId) {
      setSelectedCategoriaId(targetCatId);
    }

    setLocalEvaluacionId(targetEvalId);
  };

  // Opciones de UGEL para Administradores
  const ugelOptions: FilterOption[] = useMemo(() => {
    return regiones.map((r) => ({
      value: String(r.id),
      label: `UGEL ${r.region}`,
    }));
  }, []);

  // Carga asíncrona de datos desde consolidados_realtime_directores
  useEffect(() => {
    if (!localEvaluacionId) return;
    if (evalCache[localEvaluacionId]) return;

    let isMounted = true;
    const loadData = async () => {
      setLoadingLocalData(true);
      try {
        const db = getFirestore();

        // 1. Objeto de evaluación
        let targetEval = evaluacionesDb.find((e) => e.id === localEvaluacionId);
        if (!targetEval && evaluacion?.id === localEvaluacionId) {
          targetEval = evaluacion;
        }
        if (!targetEval) {
          const evalSnap = await getDoc(doc(db, 'evaluaciones', localEvaluacionId));
          if (evalSnap.exists()) {
            targetEval = { id: evalSnap.id, ...evalSnap.data() } as Evaluaciones;
          }
        }

        // 2. Preguntas de la evaluación
        let fetchedPreguntas: PreguntasRespuestas[] = [];
        if (evaluacion?.id === localEvaluacionId && preguntasRespuestas.length > 0) {
          fetchedPreguntas = [...preguntasRespuestas];
        } else {
          const qColl = collection(db, `evaluaciones/${localEvaluacionId}/preguntasRespuestas`);
          const qSnap = await getDocs(query(qColl, orderBy('order', 'asc')));
          qSnap.forEach((d) => {
            fetchedPreguntas.push({ ...d.data(), id: d.id } as PreguntasRespuestas);
          });
          fetchedPreguntas.sort((a, b) => Number(a.order || 0) - Number(b.order || 0));
        }
        fetchedPreguntas = addNoRespondioAlternative(fetchedPreguntas);

        // 3. Directores desde consolidados_realtime_directores
        const directoresList: any[] = [];
        const partSnap = await getDocs(
          collection(db, `evaluaciones/${localEvaluacionId}/consolidados_realtime_directores`)
        );

        if (!partSnap.empty) {
          partSnap.forEach((docSnap) => {
            directoresList.push({ id: docSnap.id, ...docSnap.data() });
          });
        } else {
          // Fallback a consolidado JSON histórico
          const y = targetEval?.añoDelExamen
            ? Number(targetEval.añoDelExamen)
            : yearSelected || new Date().getFullYear();
          const m = targetEval?.mesDelExamen !== undefined && targetEval?.mesDelExamen !== ''
            ? Number(targetEval.mesDelExamen)
            : monthSelected ?? 0;

          try {
            const consolidadoRef = doc(db, `evaluaciones/${localEvaluacionId}/consolidados`, `directores_${y}_${m}`);
            const consolidadoSnap = await getDoc(consolidadoRef);
            if (consolidadoSnap.exists()) {
              const { url } = consolidadoSnap.data();
              if (url) {
                const response = await fetch(`${url}?t=${Date.now()}`);
                const res = await response.json();
                if (res?.success && Array.isArray(res?.data)) {
                  directoresList.push(...res.data);
                }
              }
            }
          } catch (e) {
            // No crítico
          }
        }

        if (isMounted && targetEval) {
          setEvalCache((prev) => ({
            ...prev,
            [localEvaluacionId]: {
              evaluacion: targetEval!,
              preguntas: fetchedPreguntas,
              directores: directoresList,
            },
          }));
        }
      } catch (error) {
        console.error('Error al cargar datos UGEL para brechas:', error);
      } finally {
        if (isMounted) setLoadingLocalData(false);
      }
    };

    loadData();
    return () => {
      isMounted = false;
    };
  }, [
    localEvaluacionId,
    evaluacion?.id,
    preguntasRespuestas,
    evaluacionesDb,
    evalCache,
    yearSelected,
    monthSelected,
  ]);

  // Preguntas activas
  const currentPreguntas = useMemo<PreguntasRespuestas[]>(() => {
    if (localEvaluacionId && evalCache[localEvaluacionId]) {
      return evalCache[localEvaluacionId].preguntas;
    }
    if (evaluacion?.id === localEvaluacionId && preguntasRespuestas.length > 0) {
      return preguntasRespuestas;
    }
    return [];
  }, [localEvaluacionId, evalCache, evaluacion?.id, preguntasRespuestas]);

  // Directores activos filtrados por la UGEL seleccionada
  const directoresDeUgel = useMemo<any[]>(() => {
    if (!localEvaluacionId || !evalCache[localEvaluacionId]) return [];
    const all = evalCache[localEvaluacionId].directores || [];
    return all.filter((d) => {
      const regNum = d.region !== undefined && d.region !== null && d.region !== '' ? Number(d.region) : null;
      return regNum === Number(selectedUgelId);
    });
  }, [localEvaluacionId, evalCache, selectedUgelId]);

  // Modales y baremo oficial configurado por la administración
  const baremo = baremoDecisiones || DEFAULT_BAREMO_DECISIONES;
  const [isBurbujasModalOpen, setIsBurbujasModalOpen] = useState<boolean>(false);
  const [isDecisionesModalOpen, setIsDecisionesModalOpen] = useState<boolean>(false);
  const [questionDetailPopover, setQuestionDetailPopover] = useState<{
    order: number;
    coords: { x: number; y: number };
  } | null>(null);

  // Métricas calculadas para la UGEL seleccionada
  const metricasUgel = useMemo<DirectorMetricasResumen>(() => {
    return calculateMetricasUgel(directoresDeUgel, currentPreguntas, baremo, currentUgelName);
  }, [directoresDeUgel, currentPreguntas, baremo, currentUgelName]);

  // Opciones de filtro de Institución Educativa para la Matriz de Burbujas
  const institucionOptions: FilterOption[] = useMemo(() => {
    const list: FilterOption[] = [
      {
        value: 'all',
        label: `Todas las instituciones (${metricasUgel.secciones.length} I.E.)`,
        badge: `${metricasUgel.totalIe?.totalEstudiantes || 0} eval.`,
        badgeType: 'neutral',
      },
    ];

    metricasUgel.secciones.forEach((sec) => {
      list.push({
        value: String(sec.id),
        label: sec.nombre,
        badge: `${sec.totalEstudiantes} eval.`,
        badgeType: sec.criticas > 0 ? 'warning' : 'neutral',
      });
    });

    return list;
  }, [metricasUgel.secciones, metricasUgel.totalIe?.totalEstudiantes]);

  // Información de la escuela seleccionada para el encabezado de drill-down
  const selectedSchoolInfo = useMemo(() => {
    if (selectedInstitucion === 'all') return null;
    const dirDoc = directoresDeUgel.find(
      (d) => String(d.id || d.dniDirector) === String(selectedInstitucion)
    );
    const rawName = dirDoc?.institucion || dirDoc?.nombreInstitucion || dirDoc?.nombreIE;
    const name = rawName
      ? rawName.toUpperCase().startsWith('IE')
        ? rawName.toUpperCase()
        : `IE ${rawName.toUpperCase()}`
      : `IE ${selectedInstitucion}`;
    const director =
      dirDoc?.nombresDirector || dirDoc?.nombreDirector || dirDoc?.directorNombre || undefined;
    return { name, director };
  }, [selectedInstitucion, directoresDeUgel]);

  // Carga on-demand de estudiantes y desglose por secciones al seleccionar una institución específica
  useEffect(() => {
    if (selectedInstitucion === 'all' || !localEvaluacionId || !currentPreguntas.length) {
      return;
    }

    const selectedDirectorDoc = directoresDeUgel.find(
      (d) => String(d.id || d.dniDirector) === String(selectedInstitucion)
    );
    const effectiveDirectorDni =
      selectedDirectorDoc?.dniDirector || selectedDirectorDoc?.id || selectedInstitucion;
    if (!effectiveDirectorDni) return;

    const cacheKey = `${localEvaluacionId}_${effectiveDirectorDni}`;
    if (schoolDrillDownCache[cacheKey]) return;

    let isMounted = true;
    const fetchSchoolStudents = async () => {
      setLoadingSchoolDrillDown(true);
      try {
        const db = getFirestore();
        const targetYear = activeEvaluacion?.añoDelExamen
          ? Number(activeEvaluacion.añoDelExamen)
          : yearSelected || new Date().getFullYear();
        const targetMonth =
          activeEvaluacion?.mesDelExamen !== undefined && activeEvaluacion?.mesDelExamen !== ''
            ? Number(activeEvaluacion.mesDelExamen)
            : monthSelected ?? 0;

        let rawStudents: any[] = [];

        // 1. Intentar vía Cloud Function getReporteDirector
        try {
          const functions = getFunctions();
          const getReporte = httpsCallable(functions, 'getReporteDirector');
          const res: any = await getReporte({
            idEvaluacion: localEvaluacionId,
            year: targetYear,
            month: targetMonth,
            dniDirector: String(effectiveDirectorDni),
          });
          if (res?.data?.success && Array.isArray(res.data.estudiantes)) {
            rawStudents = res.data.estudiantes;
          }
        } catch (cfErr) {
          // Fallback silencioso a Firestore directo
        }

        // 2. Fallback directo a Firestore estudiantes-evaluados si la Cloud Function no devolvió datos
        if (rawStudents.length === 0) {
          try {
            const coll = collection(
              db,
              `evaluaciones/${localEvaluacionId}/estudiantes-evaluados/${targetYear}/${targetMonth}`
            );
            const q = query(coll, where('dniDirector', '==', String(effectiveDirectorDni)));
            const snap = await getDocs(q);
            snap.forEach((d) => {
              rawStudents.push({ ...d.data(), id: d.id });
            });

            // Si vino vacío y el DNI es numérico, probar como número
            if (rawStudents.length === 0 && !isNaN(Number(effectiveDirectorDni))) {
              const qNum = query(coll, where('dniDirector', '==', Number(effectiveDirectorDni)));
              const snapNum = await getDocs(qNum);
              snapNum.forEach((d) => {
                rawStudents.push({ ...d.data(), id: d.id });
              });
            }
          } catch (dbErr) {
            console.error('Error al consultar estudiantes-evaluados en Firestore:', dbErr);
          }
        }

        // 3. Reconstruir respuestas de los estudiantes con las alternativas de currentPreguntas
        const reconstructedEstudiantes = rawStudents.map((est) => {
          let respuestasReconstruidas: PreguntasRespuestas[] = [];
          if (Array.isArray(est.respuestas)) {
            respuestasReconstruidas = est.respuestas.map((r: any) => {
              const globalP = currentPreguntas.find(
                (p) => (r.id && p.id === r.id) || (r.order !== undefined && p.order === r.order)
              );
              return { ...r, respuesta: globalP?.respuesta || r.respuesta };
            });
          } else if (est.respuestas && typeof est.respuestas === 'object') {
            respuestasReconstruidas = currentPreguntas.map((p) => {
              const altSeleccionada = (est.respuestas as any)[p.id || ''];
              const alts =
                p.alternativas?.map((alt) => ({
                  ...alt,
                  selected:
                    !!alt.alternativa &&
                    !!altSeleccionada &&
                    alt.alternativa.toLowerCase() === altSeleccionada.toLowerCase(),
                })) || [];
              return { ...p, alternativas: alts };
            });
          }
          return { ...est, respuestas: respuestasReconstruidas } as UserEstudiante;
        });

        // 4. Agrupar por secciones y formatear con grado y letra (ej. "6to-B", "6to-A")
        const uniqueSecs = Array.from(
          new Set(reconstructedEstudiantes.map((e) => String(e.seccion || '').trim()))
        ).filter(Boolean);

        const sectionsList =
          uniqueSecs.length > 0
            ? uniqueSecs
                .sort((a, b) => {
                  const numA = Number(a);
                  const numB = Number(b);
                  if (!isNaN(numA) && !isNaN(numB)) {
                    return numA - numB;
                  }
                  return a.localeCompare(b);
                })
                .map((sec) => ({
                  id: sec,
                  name: formatSeccionDisplay(sec, localGrado),
                }))
            : [{ id: 'unica', name: formatSeccionDisplay('unica', localGrado) }];

        // 5. Calcular métricas por sección
        const computedSchoolMetricas = calculateMetricasDirector({
          estudiantes: reconstructedEstudiantes,
          preguntas: currentPreguntas,
          availableSections: sectionsList,
          docentesMap: new Map(),
          baremo,
        });

        // Personalizar el título del consolidado institucional
        const rawSchool =
          selectedDirectorDoc?.institucion ||
          selectedDirectorDoc?.nombreInstitucion ||
          selectedDirectorDoc?.nombreIE;
        const schoolDisplayName = rawSchool
          ? rawSchool.toUpperCase().startsWith('IE')
            ? rawSchool.toUpperCase()
            : `IE ${rawSchool.toUpperCase()}`
          : `IE ${effectiveDirectorDni}`;

        if (computedSchoolMetricas.totalIe) {
          computedSchoolMetricas.totalIe.nombre = `CONSOLIDADO ${schoolDisplayName}`;
        }

        if (isMounted) {
          setSchoolDrillDownCache((prev) => ({
            ...prev,
            [cacheKey]: {
              estudiantes: reconstructedEstudiantes,
              metricas: computedSchoolMetricas,
            },
          }));
        }
      } catch (err) {
        console.error('Error durante el drill-down de la institución:', err);
      } finally {
        if (isMounted) {
          setLoadingSchoolDrillDown(false);
        }
      }
    };

    fetchSchoolStudents();
    return () => {
      isMounted = false;
    };
  }, [
    selectedInstitucion,
    localEvaluacionId,
    currentPreguntas,
    directoresDeUgel,
    activeEvaluacion,
    yearSelected,
    monthSelected,
    baremo,
    schoolDrillDownCache,
  ]);

  // Métricas activas para la matriz de burbujas (desglose por secciones si se seleccionó una institución)
  const activeBubblesMetricas = useMemo<DirectorMetricasResumen>(() => {
    if (selectedInstitucion === 'all') {
      return metricasUgel;
    }

    const selectedDirectorDoc = directoresDeUgel.find(
      (d) => String(d.id || d.dniDirector) === String(selectedInstitucion)
    );
    const effectiveDirectorDni =
      selectedDirectorDoc?.dniDirector || selectedDirectorDoc?.id || selectedInstitucion;
    const cacheKey = `${localEvaluacionId}_${effectiveDirectorDni}`;

    if (schoolDrillDownCache[cacheKey]) {
      return schoolDrillDownCache[cacheKey].metricas;
    }

    // Fallback temporal mientras se cargan los estudiantes de la institución
    const filteredSecciones = metricasUgel.secciones.filter(
      (sec) => String(sec.id) === String(selectedInstitucion)
    );

    return {
      ...metricasUgel,
      secciones: filteredSecciones,
    };
  }, [selectedInstitucion, metricasUgel, directoresDeUgel, localEvaluacionId, schoolDrillDownCache]);

  const currentCategoryObj = useMemo(() => {
    return categoriasDisponibles.find((c) => Number(c.id) === selectedCategoriaId);
  }, [categoriasDisponibles, selectedCategoriaId]);

  const currentCategoryName = formatCategoriaLabel(
    currentCategoryObj?.categoria || 'Área Curricular'
  );

  const isMatematica = useMemo(() => {
    const n = (currentCategoryObj?.categoria || '').toLowerCase();
    return n.includes('mate') || selectedCategoriaId === 2;
  }, [currentCategoryObj?.categoria, selectedCategoriaId]);

  const radarTitle = isMatematica
    ? 'Radar de Competencias Matemáticas'
    : 'Radar de Comprensión Lectora';

  const isMatrixLoading = loadingLocalData && !evalCache[localEvaluacionId || ''];

  // Configuración de filtros segmentados para la barra contextual
  const ugelFilters: FilterItem<any>[] = useMemo(() => {
    const items: FilterItem<any>[] = [];

    if (!isEspecialistaUgel) {
      items.push({
        id: 'ugel',
        label: 'UGEL',
        value: String(selectedUgelId),
        onChange: (val) => {
          setSelectedUgelId(Number(val));
          setSelectedInstitucion('all');
        },
        options: ugelOptions,
        icon: <MdLocationOn className="text-blue-600 text-base shrink-0" />,
        showSearch: ugelOptions.length > 6,
      });
    }

    items.push({
      id: 'grado',
      label: 'Grado',
      value: String(localGrado),
      onChange: handleSelectGrado,
      options: gradoOptions,
      icon: <MdSchool className="text-blue-600 text-base shrink-0" />,
      disabled: isMatrixLoading,
      showSearch: gradoOptions.length > 6,
    });

    items.push({
      id: 'evaluacion',
      label: 'Evaluación',
      value: selectedEtapa,
      onChange: handleSelectEtapa,
      options: etapaOptions,
      icon: <MdAssignment className="text-blue-600 text-base shrink-0" />,
    });

    if (subTab === 'burbujas') {
      items.push({
        id: 'institucion',
        label: 'Institución',
        value: selectedInstitucion,
        onChange: (val) => setSelectedInstitucion(String(val)),
        options: institucionOptions,
        icon: <MdDomain className="text-blue-600 text-base shrink-0" />,
        showSearch: true,
      });
    }

    return items;
  }, [
    isEspecialistaUgel,
    selectedUgelId,
    ugelOptions,
    localGrado,
    handleSelectGrado,
    gradoOptions,
    isMatrixLoading,
    selectedEtapa,
    handleSelectEtapa,
    etapaOptions,
    subTab,
    selectedInstitucion,
    institucionOptions,
  ]);

  return (
    <div className="w-full space-y-4">
      {/* 1. Barra de Pestañas de Área Curricular */}
      <DirectorCategoriaTabs
        grado={localGrado}
        selectedCategoriaId={selectedCategoriaId}
        onSelectCategoria={handleCategoriaChange}
        matrizConfigGrados={matrizConfigGrados}
        evaluacionesDb={evaluacionesDb}
        disabled={isMatrixLoading}
      />

      {/* 2. Estado Vacío si la categoría no está configurada */}
      {!hasActiveEvaluationForCategory ? (
        <EmptyCategoriaState
          categoriaName={currentCategoryName}
          grado={localGrado}
          configuredCategories={configuredCategories}
          onSelectCategoria={(catId: number) => {
            setSelectedCategoriaId(catId);
            handleSelectCategoria(catId);
          }}
        />
      ) : (
        <div className="bg-white rounded-2xl border border-slate-200/90 shadow-2xs overflow-hidden">
          {/* Cabecera Contextual del Radar Pedagógico */}
          <div className="px-4 sm:px-6 py-4 bg-gradient-to-r from-slate-50 via-white to-slate-50/60 border-b border-slate-200/80 space-y-3.5">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
              <div className="flex items-center gap-2.5">
                <div
                  className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 ${
                    isMatematica
                      ? 'bg-indigo-100 text-indigo-700 ring-4 ring-indigo-50'
                      : 'bg-blue-100 text-blue-700 ring-4 ring-blue-50'
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
                      isMatematica ? 'text-indigo-700' : 'text-blue-700'
                    }`}
                  >
                    {radarTitle}:
                  </span>
                  <span className="text-xs sm:text-sm font-semibold text-slate-700">
                    Enfoque Regional UGEL {currentUgelName}
                  </span>
                </div>
              </div>

              {/* Indicador de UGEL fija si es especialista */}
              {isEspecialistaUgel && (
                <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-blue-50 border border-blue-200/80 rounded-xl text-xs font-bold text-blue-800">
                  <MdLocationOn className="w-4 h-4 text-blue-600" />
                  <span>Ámbito: UGEL {currentUgelName}</span>
                </div>
              )}
            </div>

            <div className="flex flex-col 2xl:flex-row 2xl:items-center 2xl:justify-between gap-3.5">
              {/* Izquierda: Switcher de Enfoque (Matriz de Burbujas vs. Decisiones) */}
              <div className="flex items-center gap-3 flex-wrap shrink-0">
                <div
                  className="inline-flex items-center p-1 bg-white rounded-xl border border-slate-200/90 shadow-2xs h-[42px]"
                  role="tablist"
                  aria-label="Enfoque de análisis pedagógico"
                >
                  <button
                    type="button"
                    role="tab"
                    aria-selected={subTab === 'burbujas'}
                    onClick={() => setSubTab('burbujas')}
                    className={`h-full inline-flex items-center gap-2 px-3 sm:px-4 rounded-lg text-xs sm:text-sm font-semibold transition-all duration-150 cursor-pointer outline-none ${
                      subTab === 'burbujas'
                        ? 'bg-blue-600 text-white shadow-xs'
                        : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                    }`}
                    title="Visualización gráfica de criticidad por institución"
                  >
                    <MdBubbleChart className="w-4 h-4 shrink-0" />
                    <span className="whitespace-nowrap">Matriz de Burbujas</span>
                  </button>

                  <button
                    type="button"
                    role="tab"
                    aria-selected={subTab === 'decisiones'}
                    onClick={() => setSubTab('decisiones')}
                    className={`h-full inline-flex items-center gap-2 px-3 sm:px-4 rounded-lg text-xs sm:text-sm font-semibold transition-all duration-150 cursor-pointer outline-none ${
                      subTab === 'decisiones'
                        ? 'bg-blue-600 text-white shadow-xs'
                        : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                    }`}
                    title="Panel consolidado global de decisiones para la UGEL"
                  >
                    <MdFactCheck className="w-4 h-4 shrink-0" />
                    <span className="whitespace-nowrap">Decisiones (UGEL)</span>
                    {metricasUgel.kpis.totalCritico > 0 && (
                      <span
                        className={`px-1.5 py-0.5 text-[11px] font-bold rounded-full transition-colors shrink-0 ${
                          subTab === 'decisiones'
                            ? 'bg-white/20 text-white'
                            : 'bg-rose-100 text-rose-700'
                        }`}
                      >
                        {metricasUgel.kpis.totalCritico} críticas
                      </span>
                    )}
                  </button>
                </div>
              </div>

              {/* Derecha / Fila Siguiente: Barra de Filtros Segmentada Contextual */}
              <div className="w-full 2xl:w-auto min-w-0">
                <SegmentedFilterBar
                  title="Filtrar por"
                  filters={ugelFilters}
                  showReset={subTab === 'burbujas' && selectedInstitucion !== 'all'}
                  onReset={() => setSelectedInstitucion('all')}
                  resetLabel="Todas las I.E."
                  className="w-full 2xl:w-auto"
                />
              </div>
            </div>
          </div>

          {/* Contenido dinámico */}
          <div
            key={`${selectedUgelId}_${selectedCategoriaId}_${selectedEtapa}_${subTab}_${localEvaluacionId || ''}`}
            className="p-4 sm:p-5"
            role="tabpanel"
            tabIndex={0}
          >
            {isMatrixLoading ? (
              <MatrixLoadingState
                categoryName={currentCategoryName}
                subTab={subTab}
                ugelName={currentUgelName}
              />
            ) : directoresDeUgel.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 px-4 bg-slate-50/60 rounded-xl border border-dashed border-slate-200 text-center">
                <MdDomain className="w-12 h-12 text-slate-300 mb-2" />
                <h5 className="text-sm font-bold text-slate-700">
                  Sin directores participantes en UGEL {currentUgelName}
                </h5>
                <p className="text-xs text-slate-500 max-w-md mt-1">
                  Aún no se han consolidado reportes en tiempo real para esta evaluación y UGEL seleccionada.
                </p>
              </div>
            ) : subTab === 'burbujas' ? (
              loadingSchoolDrillDown ? (
                <div
                  className="flex flex-col items-center justify-center py-12 px-4 bg-slate-50/50 rounded-2xl border border-dashed border-slate-200/90 min-h-[340px] animate-fadeIn"
                  role="status"
                  aria-live="polite"
                >
                  <div className="relative flex items-center justify-center w-12 h-12 rounded-full bg-blue-50 ring-8 ring-blue-50/60 mb-3">
                    <RiLoader4Line className="w-6 h-6 text-blue-600 animate-spin" />
                  </div>
                  <h4 className="text-sm sm:text-base font-bold text-slate-800 mb-1">
                    Cargando secciones de {selectedSchoolInfo?.name || 'la Institución Educativa'}
                  </h4>
                  <p className="text-xs text-slate-500 max-w-md text-center">
                    Obteniendo resultados por aula y estudiantes para el análisis pedagógico...
                  </p>
                </div>
              ) : selectedInstitucion !== 'all' && activeBubblesMetricas.secciones.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 px-4 bg-slate-50/60 rounded-xl border border-dashed border-slate-200 text-center">
                  <MdDomain className="w-12 h-12 text-slate-300 mb-2" />
                  <h5 className="text-sm font-bold text-slate-700">
                    Sin estudiantes registrados en {selectedSchoolInfo?.name || 'esta I.E.'}
                  </h5>
                  <p className="text-xs text-slate-500 max-w-md mt-1 mb-4">
                    No se encontraron registros de estudiantes evaluados para esta institución educativa en este grado y período.
                  </p>
                  <button
                    type="button"
                    onClick={() => setSelectedInstitucion('all')}
                    className="inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-blue-600 text-white rounded-lg text-xs font-semibold hover:bg-blue-700 transition-colors shadow-2xs cursor-pointer"
                  >
                    <MdRestartAlt className="w-4 h-4" />
                    <span>Volver a todas las instituciones</span>
                  </button>
                </div>
              ) : (
                <div className="space-y-3.5">
                  {/* Banner contextual cuando se está visualizando el desglose de una institución */}
                  {selectedInstitucion !== 'all' && (
                    <div className="flex flex-wrap items-center justify-between gap-3 p-3 bg-blue-50/70 border border-blue-200/80 rounded-xl">
                      <div className="flex items-center gap-2.5">
                        <span className="w-2.5 h-2.5 rounded-full bg-blue-600 shrink-0" />
                        <div>
                          <div className="text-xs sm:text-sm font-bold text-blue-950 flex items-center gap-2">
                            <span>Desglose por secciones: {selectedSchoolInfo?.name}</span>
                            <span className="px-2 py-0.5 rounded-full bg-blue-100 text-blue-800 text-[11px] font-semibold">
                              {activeBubblesMetricas.secciones.length} {activeBubblesMetricas.secciones.length === 1 ? 'sección' : 'secciones'}
                            </span>
                          </div>
                          {selectedSchoolInfo?.director && (
                            <p className="text-[11px] text-blue-800/80 mt-0.5">
                              Director(a): <span className="font-semibold">{selectedSchoolInfo.director}</span> · {activeBubblesMetricas.totalIe?.totalEstudiantes || 0} alumnos evaluados
                            </p>
                          )}
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => setSelectedInstitucion('all')}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white text-blue-700 hover:text-blue-900 border border-blue-300 rounded-lg text-xs font-semibold hover:bg-blue-50 transition-colors shadow-2xs cursor-pointer ml-auto"
                        title="Regresar a la vista macro de todas las instituciones de la UGEL"
                      >
                        <MdRestartAlt className="w-4 h-4" />
                        <span>Ver todas las I.E.</span>
                      </button>
                    </div>
                  )}

                  <DirectorBurbujasTab
                    metricas={activeBubblesMetricas}
                    preguntas={currentPreguntas}
                    evaluacion={activeEvaluacion}
                    onOpenQuestionDetail={(order, coords) => setQuestionDetailPopover({ order, coords })}
                    onOpenGuiaModal={() => setIsBurbujasModalOpen(true)}
                    isUgelView={true}
                    benchmarkRow={selectedInstitucion !== 'all' ? metricasUgel.totalIe : null}
                    headerLabel={selectedInstitucion !== 'all' ? selectedSchoolInfo?.name : undefined}
                  />
                </div>
              )
            ) : (
              <DirectorDecisionesTab
                metricas={metricasUgel}
                preguntas={currentPreguntas}
                onOpenQuestionDetail={(order, coords) => setQuestionDetailPopover({ order, coords })}
                onOpenGuiaModal={() => setIsDecisionesModalOpen(true)}
                isUgelView={true}
                ugelName={currentUgelName}
              />
            )}
          </div>
        </div>
      )}

      {/* Modales Compartidos */}
      <GuiaBurbujasModal
        isOpen={isBurbujasModalOpen}
        onClose={() => setIsBurbujasModalOpen(false)}
      />

      <GuiaDecisionesModal
        isOpen={isDecisionesModalOpen}
        onClose={() => setIsDecisionesModalOpen(false)}
        baremo={baremo}
      />

      {questionDetailPopover && (
        <QuestionDetailPopover
          order={questionDetailPopover.order}
          coords={questionDetailPopover.coords}
          onClose={() => setQuestionDetailPopover(null)}
          preguntas={currentPreguntas}
          gradoName={`${getGradoTexto(localGrado)} - ${activeEvaluacion?.nombre || ''}`}
        />
      )}
    </div>
  );
};

export default UgelBrechasTab;
