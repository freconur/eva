import React, { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import {
  MdBubbleChart,
  MdFactCheck,
  MdAssignment,
  MdClass,
  MdSchool,
  MdRestartAlt,
  MdMenuBook,
  MdCalculate,
} from 'react-icons/md';
import { RiLoader4Line } from 'react-icons/ri';
import { doc, getDoc, collection, query, where, getDocs, orderBy, getFirestore } from 'firebase/firestore';
import { getFunctions, httpsCallable } from 'firebase/functions';
import { Evaluaciones, PreguntasRespuestas, UserEstudiante } from '@/features/types/types';
import { useGlobalContext } from '@/features/context/GlolbalContext';
import { getCategoriasParaGrado } from '@/fuctions/categorias';
import { gradosDeColegio, getGradoTexto } from '@/fuctions/regiones';
import SegmentedFilterBar, { FilterItem, FilterOption } from '@/components/common/SegmentedFilterBar';
import { addNoRespondioAlternative } from '@/features/utils/addNoRespondioAlternative';
import {
  BaremoDecisiones,
  DEFAULT_BAREMO_DECISIONES,
} from '@/components/modals/ConfigurarBaremoModal';
import { DirectorMetricasResumen, SeccionMetrica } from './types';
import { calculateMetricasDirector } from './useMetricasDirector';
import { useEvaluacionesMatriz } from './useEvaluacionesMatriz';
import DirectorBurbujasTab from './DirectorBurbujasTab';
import DirectorDecisionesTab from './DirectorDecisionesTab';
import DirectorCategoriaTabs, {
  EmptyCategoriaState,
  formatCategoriaLabel,
} from './DirectorCategoriaTabs';
import { useDirectorTabsConfig } from './useDirectorTabsConfig';
import tabsStyles from './DirectorTabsNav.module.css';

/**
 * Componente de carga localizada para la Matriz de Burbujas / Decisiones.
 * Aplica los lineamientos de ui-ux-design (feedback inmediato, carga perceptiva con skeleton,
 * halo suave y mensajes claros) evitando desmontar la barra de materias ni los filtros.
 */
const MatrixLoadingState: React.FC<{
  categoryName: string;
  subTab: 'burbujas' | 'decisiones';
}> = ({ categoryName, subTab }) => {
  return (
    <div
      className="flex flex-col items-center justify-center py-12 sm:py-16 px-4 bg-slate-50/50 rounded-2xl border border-dashed border-slate-200/90 my-2 min-h-[380px] animate-fadeIn"
      role="status"
      aria-live="polite"
      aria-label={`Cargando datos pedagógicos de ${categoryName}`}
    >
      {/* Halo animado suave con spinner central */}
      <div className="relative flex items-center justify-center w-14 h-14 rounded-full bg-blue-50 ring-8 ring-blue-50/60 mb-3.5">
        <RiLoader4Line className="w-7 h-7 text-blue-600 animate-spin" />
      </div>

      <h4 className="text-sm sm:text-base font-bold text-slate-800 mb-1">
        Cargando {subTab === 'burbujas' ? 'Matriz de Burbujas' : 'Panel de Decisiones'} · {categoryName}
      </h4>

      <p className="text-xs text-slate-500 max-w-md text-center mb-6 leading-relaxed">
        Sincronizando preguntas pedagógicas, porcentajes de criticidad y respuestas de los estudiantes...
      </p>

      {/* Skeleton de matriz simulada para retroalimentación visual de alta calidad */}
      <div className="w-full max-w-3xl bg-white rounded-xl border border-slate-200/80 p-4 shadow-2xs space-y-3.5 opacity-80">
        <div className="flex items-center justify-between pb-2 border-b border-slate-100">
          <div className="h-4 w-32 bg-slate-200 rounded animate-pulse" />
          <div className="flex gap-4">
            <div className="h-4 w-10 bg-slate-100 rounded animate-pulse" />
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
              <div className="w-6 h-6 rounded-full bg-emerald-100/80 animate-pulse" />
              <div className="w-6 h-6 rounded-full bg-amber-100/80 animate-pulse" />
              <div className="w-6 h-6 rounded-full bg-rose-100/80 animate-pulse" />
              <div className="w-6 h-6 rounded-full bg-amber-100/80 animate-pulse" />
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

interface DirectorBrechasTabProps {
  metricas: DirectorMetricasResumen;
  preguntas: PreguntasRespuestas[];
  evaluacion?: Evaluaciones;
  evaluacionesDb?: Evaluaciones[];
  initialGrado?: number | string;
  initialSeccion?: string;
  isLoadingData?: boolean;
  onSelectEvaluacion?: (idEvaluacion: string, mesDelExamen?: number, grado?: number | string) => void;
  onSelectGrado?: (grado: number | string) => void;
  onOpenQuestionDetail: (order: number, coords: { x: number; y: number }) => void;
  onOpenGuiaBurbujas: () => void;
  onOpenGuiaDecisiones: () => void;
  onOpenBaremoModal?: () => void;
  isAuditing?: boolean;
  availableSections?: Array<{ id: number | string; name: string }>;
  docentesMap?: Map<string, string>;
  dniDirector?: string | number;
  dniDocente?: string | number;
  isDocenteView?: boolean;
  yearSelected?: number;
  baremo?: BaremoDecisiones;
}

export const DirectorBrechasTab: React.FC<DirectorBrechasTabProps> = ({
  metricas,
  preguntas,
  evaluacion,
  evaluacionesDb = [],
  initialGrado,
  initialSeccion,
  isLoadingData = false,
  onOpenQuestionDetail,
  onOpenGuiaBurbujas,
  onOpenGuiaDecisiones,
  isAuditing,
  availableSections = [],
  docentesMap = new Map(),
  dniDirector,
  dniDocente,
  isDocenteView = false,
  yearSelected,
  baremo = DEFAULT_BAREMO_DECISIONES,
}) => {
  const { categorias: contextCategorias, currentUserData } = useGlobalContext();

  const [subTab, setSubTab] = useState<'burbujas' | 'decisiones'>('burbujas');
  const [selectedSeccion, setSelectedSeccion] = useState<string>(
    initialSeccion && initialSeccion.trim()
      ? initialSeccion
      : isDocenteView
        ? 'global'
        : 'all'
  );

  // 1. Grado local independiente de Brechas de Aprendizaje
  const [localGrado, setLocalGrado] = useState<number>(() => {
    if (initialGrado !== undefined && initialGrado !== '') return Number(initialGrado);
    if (evaluacion?.grado !== undefined && evaluacion?.grado !== null) return Number(evaluacion.grado);
    return 2;
  });

  // 2. ID de evaluación local activa en Brechas de Aprendizaje
  const [localEvaluacionId, setLocalEvaluacionId] = useState<string | undefined>(evaluacion?.id);

  // Estado de categoría de área curricular activa (por defecto la de la evaluación o la 1 = LEE)
  const [selectedCategoriaId, setSelectedCategoriaId] = useState<number>(() => {
    if (evaluacion?.categoria !== undefined && evaluacion?.categoria !== null) {
      return Number(evaluacion.categoria);
    }
    return 1;
  });

  // Sincronizar estado local si la evaluación inicial del reporte cambia desde fuera
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
      setSelectedSeccion(isDocenteView ? 'global' : 'all');
    }
  }, [evaluacion?.id, evaluacion?.grado, evaluacion?.categoria, isDocenteView]);

  // Caché local para datos de etapas cargadas asíncronamente en Brechas
  const [cacheData, setCacheData] = useState<
    Record<
      string,
      {
        evaluacion: Evaluaciones;
        preguntas: PreguntasRespuestas[];
        estudiantes: UserEstudiante[];
        metricas: DirectorMetricasResumen;
      }
    >
  >({});
  const [loadingLocalEval, setLoadingLocalEval] = useState<boolean>(false);

  // Determinar la instancia de evaluación activa en Brechas
  const activeEvaluacion = useMemo<Evaluaciones | undefined>(() => {
    if (!localEvaluacionId) return undefined;
    if (evaluacion?.id === localEvaluacionId) return evaluacion;
    const foundInDb = evaluacionesDb.find((e) => e.id === localEvaluacionId);
    if (foundInDb) return foundInDb;
    return cacheData[localEvaluacionId]?.evaluacion;
  }, [localEvaluacionId, evaluacion, evaluacionesDb, cacheData]);

  // Handler local para cambiar de evaluación sin alterar la URL ni la página global
  const handleLocalSelectEvaluacion = useCallback(
    (newEvalId: string, _targetMonth?: number, newGrado?: number | string) => {
      if (newGrado !== undefined && newGrado !== '') {
        setLocalGrado(Number(newGrado));
      }
      setLocalEvaluacionId(newEvalId);
      setSelectedSeccion(isDocenteView ? 'global' : 'all');
    },
    [isDocenteView]
  );

  // 1. Integración de configuraciones/matriz_resultados para EDI, EP1, EP2
  const {
    selectedEtapa,
    etapaOptions,
    handleSelectEtapa,
    handleSelectCategoria,
    matrizConfigGrados,
    baremoDecisiones: baremoMatriz,
  } = useEvaluacionesMatriz({
    grado: localGrado,
    evaluacion: activeEvaluacion,
    evaluacionesDb,
    selectedCategoriaId,
    onSelectEvaluacion: handleLocalSelectEvaluacion,
  });

  // Baremo efectivo: prioriza el prop si viene configurado o la configuración oficial de la Matriz regional
  const effectiveBaremo = useMemo(() => {
    if (
      baremo &&
      (baremo.critico !== DEFAULT_BAREMO_DECISIONES.critico ||
        baremo.alto !== DEFAULT_BAREMO_DECISIONES.alto ||
        baremo.medio !== DEFAULT_BAREMO_DECISIONES.medio)
    ) {
      return baremo;
    }
    return baremoMatriz || baremo || DEFAULT_BAREMO_DECISIONES;
  }, [baremo, baremoMatriz]);

  // Categorías de área curricular disponibles según el grado y nivel (Primaria vs Secundaria vs Inicial)
  const categoriasDisponibles = useMemo(() => {
    return getCategoriasParaGrado(localGrado, contextCategorias, evaluacionesDb);
  }, [localGrado, contextCategorias, evaluacionesDb]);

  // Categorías con configuración asignada en este grado para botones de recuperación
  const configuredCategories = useMemo(() => {
    return categoriasDisponibles.filter((cat) => {
      const assignment = matrizConfigGrados[`${localGrado}_${cat.id}`];
      return !!(assignment && (assignment.ediId || assignment.ep1Id || assignment.ep2Id));
    });
  }, [categoriasDisponibles, matrizConfigGrados, localGrado]);

  // Verificar si la categoría actualmente seleccionada tiene asignación o evaluación activa
  const selectedCategoryAssignment = matrizConfigGrados[`${localGrado}_${selectedCategoriaId}`];
  const isSelectedCategoryConfigured = !!(
    selectedCategoryAssignment &&
    (selectedCategoryAssignment.ediId || selectedCategoryAssignment.ep1Id || selectedCategoryAssignment.ep2Id)
  );

  const hasActiveEvaluationForCategory =
    Boolean(localEvaluacionId) ||
    isSelectedCategoryConfigured;

  // Auto-seleccionar la primera categoría configurada si la actual no tiene configuración
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

  // Handler al hacer clic en una pestaña de categoría de área
  const handleCategoriaChange = (catId: number) => {
    setSelectedCategoriaId(catId);
    handleSelectCategoria(catId);
  };

  // 2. Opciones dinámicas para el filtro de Grados
  const gradoOptions: FilterOption[] = useMemo(() => {
    // Filtrar grados según el nivel de institución del director si está configurado
    const userNiveles = currentUserData?.nivelDeInstitucion;
    const hasNivelesRestriction = Array.isArray(userNiveles) && userNiveles.length > 0;

    let availableGrados = gradosDeColegio;
    if (hasNivelesRestriction) {
      availableGrados = gradosDeColegio.filter((g) => userNiveles.includes(g.nivel));
    }

    // Asegurar que el grado actual siempre esté disponible en el listado
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
  }, [currentUserData?.nivelDeInstitucion, localGrado, matrizConfigGrados, evaluacionesDb]);

  // Handler al cambiar de grado desde el selector (exclusivo y local a Brechas)
  const handleSelectGrado = (newGradoStr: string) => {
    const newGrado = Number(newGradoStr);
    if (newGrado === localGrado) return;

    // Resetear filtro de sección local
    setSelectedSeccion(isDocenteView ? 'global' : 'all');
    setLocalGrado(newGrado);

    // Intentar encontrar una evaluación configurada para este nuevo grado
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

  // Carga asíncrona de datos cuando se selecciona otra evaluación en Brechas
  useEffect(() => {
    if (!localEvaluacionId || localEvaluacionId === evaluacion?.id) return;
    if (cacheData[localEvaluacionId]) return;

    let isMounted = true;
    const loadDataForEval = async () => {
      setLoadingLocalEval(true);
      try {
        const db = getFirestore();

        // 1. Obtener objeto Evaluacion
        let targetEval = evaluacionesDb.find((e) => e.id === localEvaluacionId);
        if (!targetEval) {
          const evalSnap = await getDoc(doc(db, 'evaluaciones', localEvaluacionId));
          if (evalSnap.exists()) {
            targetEval = { id: evalSnap.id, ...evalSnap.data() } as Evaluaciones;
          }
        }

        // 2. Obtener preguntas
        const qColl = collection(db, `evaluaciones/${localEvaluacionId}/preguntasRespuestas`);
        const qSnap = await getDocs(query(qColl, orderBy('order', 'asc')));
        let fetchedPreguntas: PreguntasRespuestas[] = [];
        qSnap.forEach((d) => {
          fetchedPreguntas.push({ ...d.data(), id: d.id } as PreguntasRespuestas);
        });
        fetchedPreguntas.sort((a, b) => Number(a.order || 0) - Number(b.order || 0));
        fetchedPreguntas = addNoRespondioAlternative(fetchedPreguntas);

        // 3. Obtener estudiantes mediante Firestore si es docente, o getReporteDirector si es director
        let rawStudents: any[] = [];
        if (dniDocente) {
          try {
            const targetYear = targetEval?.añoDelExamen
              ? Number(targetEval.añoDelExamen)
              : yearSelected || new Date().getFullYear();
            const targetMonth = targetEval?.mesDelExamen !== undefined && targetEval?.mesDelExamen !== ''
              ? Number(targetEval.mesDelExamen)
              : 0;

            const coll = collection(db, `/evaluaciones/${localEvaluacionId}/estudiantes-evaluados/${targetYear}/${targetMonth}`);
            const q = query(coll, where('dniDocente', '==', String(dniDocente)));
            const snap = await getDocs(q);
            snap.forEach((d) => rawStudents.push(d.data()));
          } catch (err) {
            console.error('Error al cargar estudiantes del docente para brechas:', err);
          }
        } else {
          const effectiveDni = dniDirector || currentUserData?.dni;
          if (effectiveDni) {
            try {
              const functions = getFunctions();
              const getReporte = httpsCallable(functions, 'getReporteDirector');
              const targetYear = targetEval?.añoDelExamen
                ? Number(targetEval.añoDelExamen)
                : yearSelected || new Date().getFullYear();

              const res: any = await getReporte({
                idEvaluacion: localEvaluacionId,
                year: targetYear,
                dniDirector: effectiveDni,
              });
              if (res?.data?.success) {
                rawStudents = res.data.estudiantes || [];
              }
            } catch (err) {
              console.error('Error al cargar estudiantes para brechas:', err);
            }
          }
        }

        // 4. Reconstruir respuestas de estudiantes con las preguntas obtenidas
        const reconstructedEstudiantes = rawStudents.map((est) => {
          let respuestasReconstruidas: PreguntasRespuestas[] = [];
          if (Array.isArray(est.respuestas)) {
            respuestasReconstruidas = est.respuestas.map((r: any) => {
              const globalP = fetchedPreguntas.find(
                (p) => (r.id && p.id === r.id) || (r.order !== undefined && p.order === r.order)
              );
              return { ...r, respuesta: globalP?.respuesta || r.respuesta };
            });
          } else if (est.respuestas && typeof est.respuestas === 'object') {
            respuestasReconstruidas = fetchedPreguntas.map((p) => {
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

        // 5. Determinar secciones
        const uniqueSecs = Array.from(
          new Set(reconstructedEstudiantes.map((e) => String(e.seccion || '')))
        ).filter(Boolean);
        const sectionsList =
          uniqueSecs.length > 0
            ? uniqueSecs.sort((a, b) => a.localeCompare(b)).map((sec) => ({ id: sec, name: sec }))
            : availableSections || [];

        // 6. Calcular métricas
        const computedMetricas = calculateMetricasDirector({
          estudiantes: reconstructedEstudiantes,
          preguntas: fetchedPreguntas,
          availableSections: sectionsList,
          docentesMap: docentesMap || new Map(),
          baremo: effectiveBaremo,
        });

        if (isMounted) {
          setCacheData((prev) => ({
            ...prev,
            [localEvaluacionId]: {
              evaluacion: targetEval || ({ id: localEvaluacionId, grado: localGrado } as Evaluaciones),
              preguntas: fetchedPreguntas,
              estudiantes: reconstructedEstudiantes,
              metricas: computedMetricas,
            },
          }));
        }
      } catch (err) {
        console.error('Error al cargar datos locales para Brechas:', err);
      } finally {
        if (isMounted) {
          setLoadingLocalEval(false);
        }
      }
    };

    loadDataForEval();
    return () => {
      isMounted = false;
    };
  }, [
    localEvaluacionId,
    evaluacion?.id,
    cacheData,
    evaluacionesDb,
    dniDirector,
    currentUserData?.dni,
    yearSelected,
    availableSections,
    docentesMap,
    effectiveBaremo,
    localGrado,
  ]);

  const isUsingDefaultEval = Boolean(evaluacion?.id && localEvaluacionId === evaluacion.id);

  const emptyMetricas: DirectorMetricasResumen = useMemo(
    () => ({
      secciones: [],
      totalIe: null,
      sortedPreguntas: [],
      kpis: {
        totalCritico: 0,
        totalAlto: 0,
        totalMedio: 0,
        totalBajo: 0,
        avgPrev: 0,
      },
      activeBaremo: effectiveBaremo,
    }),
    [effectiveBaremo]
  );

  const currentEvaluationObj: Evaluaciones | undefined = useMemo(() => {
    if (isUsingDefaultEval) return evaluacion;
    if (!localEvaluacionId) return undefined;
    return (
      evaluacionesDb.find((e) => e.id === localEvaluacionId) ||
      cacheData[localEvaluacionId]?.evaluacion
    );
  }, [isUsingDefaultEval, evaluacion, localEvaluacionId, evaluacionesDb, cacheData]);

  const currentPreguntas: PreguntasRespuestas[] = useMemo(() => {
    if (isUsingDefaultEval) return preguntas;
    if (!localEvaluacionId) return [];
    return cacheData[localEvaluacionId]?.preguntas || [];
  }, [isUsingDefaultEval, preguntas, localEvaluacionId, cacheData]);

  const currentMetricas: DirectorMetricasResumen = useMemo(() => {
    if (isUsingDefaultEval) return metricas;
    if (!localEvaluacionId) return emptyMetricas;
    return cacheData[localEvaluacionId]?.metricas || emptyMetricas;
  }, [isUsingDefaultEval, metricas, localEvaluacionId, cacheData, emptyMetricas]);

  // 3. Opciones dinámicas para el filtro de sección del colegio o docente
  const seccionOptions: FilterOption<string>[] = useMemo(() => {
    const list: FilterOption<string>[] = [];

    if (isDocenteView) {
      list.push({
        value: 'global',
        label: 'Global (Todos mis estudiantes)',
        badge: `${currentMetricas.totalIe?.totalEstudiantes || 0} alumnos`,
        badgeType: 'neutral',
      });

      if (currentMetricas.secciones.length > 1) {
        list.push({
          value: 'all',
          label: `Todas mis secciones (${currentMetricas.secciones.length} aulas)`,
          badge: `${currentMetricas.totalIe?.totalEstudiantes || 0} eval.`,
          badgeType: 'neutral',
        });
      }
    } else {
      list.push({
        value: 'all',
        label: `Todas las secciones (${currentMetricas.secciones.length} aulas)`,
        badge: `${currentMetricas.totalIe?.totalEstudiantes || 0} eval.`,
        badgeType: 'neutral',
      });
    }

    currentMetricas.secciones.forEach((sec) => {
      list.push({
        value: String(sec.id),
        label: sec.nombre,
        badge: `${sec.totalEstudiantes} eval.`,
        badgeType: sec.criticas > 0 ? 'warning' : 'neutral',
      });
    });

    return list;
  }, [currentMetricas.secciones, currentMetricas.totalIe?.totalEstudiantes, isDocenteView]);

  // 4. Filtrar métricas por sección seleccionada si no es 'all'
  const filteredMetricas = useMemo<DirectorMetricasResumen>(() => {
    if (selectedSeccion === 'all') return currentMetricas;

    if (selectedSeccion === 'global') {
      const globalSec: SeccionMetrica | null = currentMetricas.totalIe
        ? {
            ...currentMetricas.totalIe,
            id: 'global',
            nombre: isDocenteView
              ? 'Consolidado Global (Todos mis estudiantes)'
              : 'Consolidado I.E. (Global)',
            docenteNombre: isDocenteView ? undefined : currentMetricas.totalIe.docenteNombre,
          }
        : null;

      return {
        ...currentMetricas,
        secciones: globalSec ? [globalSec] : [],
        kpis: globalSec
          ? {
              totalCritico: globalSec.criticas,
              totalAlto: globalSec.altas,
              totalMedio: globalSec.medias,
              totalBajo: globalSec.bajas,
              avgPrev: globalSec.avgPrev,
            }
          : currentMetricas.kpis,
      };
    }

    const matched = currentMetricas.secciones.filter(
      (sec) => String(sec.id) === String(selectedSeccion)
    );

    if (matched.length > 0) {
      const sec = matched[0];
      return {
        ...currentMetricas,
        secciones: matched,
        kpis: {
          totalCritico: sec.criticas,
          totalAlto: sec.altas,
          totalMedio: sec.medias,
          totalBajo: sec.bajas,
          avgPrev: sec.avgPrev,
        },
      };
    }

    return currentMetricas;
  }, [currentMetricas, selectedSeccion, isDocenteView]);

  // Nombre formateado de la categoría activa para mensajes de estado
  const currentCategoryObj = categoriasDisponibles.find((c) => Number(c.id) === selectedCategoriaId);
  const currentCategoryName = currentCategoryObj
    ? formatCategoriaLabel(currentCategoryObj.categoria)
    : `ÁREA ${selectedCategoriaId}`;

  // Sincronización con nombres personalizados guardados en Firestore
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

  // Estado de carga local mientras se obtiene la evaluación o cambia la materia
  const isMatrixLoading =
    Boolean(isLoadingData) ||
    loadingLocalEval ||
    (currentEvaluationObj?.categoria !== undefined &&
      currentEvaluationObj.categoria !== null &&
      Number(currentEvaluationObj.categoria) !== selectedCategoriaId);

  // Verificar si la primera pestaña es la activa para conectar la esquina superior izquierda
  const isFirstTabActive =
    configuredCategories.length > 0 &&
    Number(configuredCategories[0].id) === selectedCategoriaId;

  // Configuración de filtros segmentados para la barra contextual
  const directorFilters: FilterItem<any>[] = useMemo(() => {
    return [
      {
        id: 'grado',
        label: 'Grado',
        value: String(localGrado),
        onChange: handleSelectGrado,
        options: gradoOptions,
        icon: <MdSchool className="text-blue-600 text-base shrink-0" />,
        disabled: isMatrixLoading,
        showSearch: gradoOptions.length > 6,
      },
      {
        id: 'evaluacion',
        label: 'Evaluación',
        value: selectedEtapa,
        onChange: handleSelectEtapa,
        options: etapaOptions,
        icon: <MdAssignment className="text-blue-600 text-base shrink-0" />,
      },
      {
        id: 'seccion',
        label: 'Sección',
        value: selectedSeccion,
        onChange: (val) => setSelectedSeccion(String(val)),
        options: seccionOptions,
        icon: <MdClass className="text-blue-600 text-base shrink-0" />,
        showSearch: seccionOptions.length > 5,
      },
    ];
  }, [
    localGrado,
    handleSelectGrado,
    gradoOptions,
    isMatrixLoading,
    selectedEtapa,
    handleSelectEtapa,
    etapaOptions,
    selectedSeccion,
    setSelectedSeccion,
    seccionOptions,
  ]);

  return (
    <div className="flex flex-col w-full">
      {/* 1. Selector de Pestañas de Áreas Curriculares según el Nivel Educativo (Primaria / Secundaria) */}
      <DirectorCategoriaTabs
        grado={localGrado}
        selectedCategoriaId={selectedCategoriaId}
        onSelectCategoria={handleCategoriaChange}
        matrizConfigGrados={matrizConfigGrados}
        evaluacionesDb={evaluacionesDb}
        disabled={isMatrixLoading}
        isAuditing={isAuditing}
      />

      {/* Si el área seleccionada no tiene evaluaciones asignadas, mostrar estado vacío accesible */}
      {!hasActiveEvaluationForCategory ? (
        <div
          key={`empty_${selectedCategoriaId}`}
          className={tabsStyles.tabContentPanel}
          role="tabpanel"
          tabIndex={0}
        >
          <EmptyCategoriaState
            categoriaName={currentCategoryName}
            grado={localGrado}
            configuredCategories={configuredCategories}
            onSelectCategoria={handleCategoriaChange}
          />
        </div>
      ) : (
        <>
          {/* ESPACIO DE TRABAJO DEL ÁREA CURRICULAR SELECCIONADA (MASTER WORKSPACE CARD) */}
          <div
            className="bg-white border-x-2 border-b-2 border-emerald-500 shadow-xs overflow-hidden rounded-b-2xl -mt-[2px] mb-4"
          >
            {/* Cabecera / Barra de Herramientas del Área Activa */}
            <div className="bg-white border-b border-slate-100 p-3 sm:p-4">
              {/* Título de Enfoque Pedagógico RADALECTOR / RADAMATE */}
              <div className="flex items-center justify-between gap-3 mb-3 pb-3 border-b border-slate-100/90">
                <div className="flex items-center gap-2.5">
                  <div
                    className={`w-7 h-7 sm:w-8 sm:h-8 rounded-xl flex items-center justify-center shrink-0 shadow-2xs border ${
                      isMatematica
                        ? 'bg-gradient-to-br from-indigo-50 to-blue-50 text-indigo-600 border-indigo-200/80'
                        : 'bg-gradient-to-br from-blue-50 to-sky-50 text-blue-600 border-blue-200/80'
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
                      Visualizaciones de dificultades y toma de decisiones
                    </span>
                  </div>
                </div>
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
                      title="Visualización gráfica de criticidad por aula"
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
                      title="Panel de toma de decisiones e intervención pedagógica"
                    >
                      <MdFactCheck className="w-4 h-4 shrink-0" />
                      <span className="whitespace-nowrap">Decisiones</span>
                      {filteredMetricas.kpis.totalCritico > 0 && (
                        <span
                          className={`px-1.5 py-0.5 text-[11px] font-bold rounded-full transition-colors shrink-0 ${
                            subTab === 'decisiones'
                              ? 'bg-white/20 text-white'
                              : 'bg-rose-100 text-rose-700'
                          }`}
                        >
                          {filteredMetricas.kpis.totalCritico} críticas
                        </span>
                      )}
                    </button>
                  </div>
                </div>

                {/* Derecha / Fila Siguiente: Barra de Filtros Segmentada Contextual */}
                <div className="w-full 2xl:w-auto min-w-0">
                  <SegmentedFilterBar
                    title="Filtrar por"
                    filters={directorFilters}
                    showReset={selectedSeccion !== (isDocenteView ? 'global' : 'all')}
                    onReset={() => setSelectedSeccion(isDocenteView ? 'global' : 'all')}
                    resetLabel={isDocenteView ? 'Vista Global' : 'Todas las aulas'}
                    className="w-full 2xl:w-auto"
                  />
                </div>
              </div>
            </div>

            {/* Contenido dinámico del área seleccionada */}
            <div
              key={`${selectedCategoriaId}_${selectedEtapa}_${subTab}_${localEvaluacionId || ''}`}
              className="p-4 sm:p-5"
              role="tabpanel"
              tabIndex={0}
            >
              {isMatrixLoading ? (
                <MatrixLoadingState
                  categoryName={currentCategoryName}
                  subTab={subTab}
                />
              ) : subTab === 'burbujas' ? (
                <DirectorBurbujasTab
                  metricas={filteredMetricas}
                  preguntas={currentPreguntas}
                  evaluacion={currentEvaluationObj}
                  categoryName={currentCategoryName}
                  onOpenQuestionDetail={onOpenQuestionDetail}
                  onOpenGuiaModal={onOpenGuiaBurbujas}
                  isDocenteView={isDocenteView}
                />
              ) : (
                <DirectorDecisionesTab
                  metricas={filteredMetricas}
                  preguntas={currentPreguntas}
                  evaluacion={currentEvaluationObj}
                  categoryName={currentCategoryName}
                  onOpenQuestionDetail={onOpenQuestionDetail}
                  onOpenGuiaModal={onOpenGuiaDecisiones}
                  isDocenteView={isDocenteView}
                  selectedSeccion={selectedSeccion}
                  onSelectSeccion={(val) => setSelectedSeccion(val)}
                  seccionOptions={seccionOptions}
                />
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default DirectorBrechasTab;
