import { useState, useEffect, useMemo, useCallback } from 'react';
import { doc, getDoc, getFirestore } from 'firebase/firestore';
import { Evaluaciones } from '@/features/types/types';
import { FilterOption } from '@/components/reportes/CustomFilterDropdown';
import {
  BaremoDecisiones,
  DEFAULT_BAREMO_DECISIONES,
} from '@/components/modals/ConfigurarBaremoModal';
import { toast } from 'react-toastify';

export type EtapaKey = 'edi' | 'ep1' | 'ep2';

/**
 * Determina si una evaluación está configurada en algún slot longitudinal (EDI, EP1, EP2)
 * en el mapa de asignaciones de grados y categorías de la matriz.
 */
export const isEvaluacionEnMatriz = (
  evaluacionId?: string,
  matrizConfigGrados?: Record<string, any>
): boolean => {
  if (!evaluacionId || !matrizConfigGrados) return false;
  return Object.values(matrizConfigGrados).some((asgn: any) => {
    return Boolean(
      asgn &&
        (asgn.ediId === evaluacionId ||
          asgn.ep1Id === evaluacionId ||
          asgn.ep2Id === evaluacionId)
    );
  });
};

interface UseEvaluacionesMatrizProps {
  grado?: number | string;
  evaluacion?: Evaluaciones;
  evaluacionesDb?: Evaluaciones[];
  selectedCategoriaId?: number;
  onSelectEvaluacion?: (idEvaluacion: string, mesDelExamen?: number, grado?: number | string) => void;
}

export const useEvaluacionesMatriz = ({
  grado,
  evaluacion,
  evaluacionesDb = [],
  selectedCategoriaId,
  onSelectEvaluacion,
}: UseEvaluacionesMatrizProps) => {
  const [matrizConfigGrados, setMatrizConfigGrados] = useState<Record<string, any>>({});
  const [baremoDecisiones, setBaremoDecisiones] = useState<BaremoDecisiones>(DEFAULT_BAREMO_DECISIONES);
  const [loadingConfig, setLoadingConfig] = useState<boolean>(true);
  const [fetchedEvaluationsMap, setFetchedEvaluationsMap] = useState<Record<string, Evaluaciones>>({});

  // 1. Cargar documento configuraciones/matriz_resultados de Firestore
  useEffect(() => {
    let isMounted = true;
    const fetchConfig = async () => {
      try {
        setLoadingConfig(true);
        const db = getFirestore();
        const cfgRef = doc(db, 'configuraciones', 'matriz_resultados');
        const snap = await getDoc(cfgRef);
        if (snap.exists() && isMounted) {
          const data = snap.data();
          if (data?.grados) {
            setMatrizConfigGrados(data.grados);
          }
          if (data?.baremoDecisiones) {
            setBaremoDecisiones({
              critico: Number(data.baremoDecisiones.critico) || DEFAULT_BAREMO_DECISIONES.critico,
              alto: Number(data.baremoDecisiones.alto) || DEFAULT_BAREMO_DECISIONES.alto,
              medio: Number(data.baremoDecisiones.medio) || DEFAULT_BAREMO_DECISIONES.medio,
            });
          }
        }
      } catch (error) {
        console.error('Error al cargar configuraciones/matriz_resultados:', error);
      } finally {
        if (isMounted) setLoadingConfig(false);
      }
    };
    fetchConfig();
    return () => {
      isMounted = false;
    };
  }, []);

  // Categoría efectiva: prioriza la seleccionada en las pestañas de área, o la de la evaluación actual
  const effectiveCategoriaId = useMemo(() => {
    if (selectedCategoriaId !== undefined && selectedCategoriaId !== null) {
      return Number(selectedCategoriaId);
    }
    if (evaluacion?.categoria !== undefined && evaluacion?.categoria !== null) {
      return Number(evaluacion.categoria);
    }
    return 1;
  }, [selectedCategoriaId, evaluacion?.categoria]);

  // Grado efectivo: prioriza el grado explícito o el de la evaluación actual
  const effectiveGrado = useMemo(() => {
    if (grado !== undefined && grado !== '') return Number(grado);
    if (evaluacion?.grado !== undefined && evaluacion?.grado !== null) return Number(evaluacion.grado);
    return 2;
  }, [grado, evaluacion?.grado]);

  // 2. Obtener la asignación para el grado y categoría efectiva
  const gradoAssignment = useMemo(() => {
    const g = effectiveGrado;
    const c = effectiveCategoriaId;
    return (
      matrizConfigGrados[`${g}_${c}`] ||
      matrizConfigGrados[`${g}`] ||
      null
    );
  }, [effectiveGrado, effectiveCategoriaId, matrizConfigGrados]);

  const ediId: string | undefined = gradoAssignment?.ediId;
  const ep1Id: string | undefined = gradoAssignment?.ep1Id;
  const ep2Id: string | undefined = gradoAssignment?.ep2Id;

  // 3. Fallback: Si alguna evaluación asignada no está en evaluacionesDb, cargarla individualmente
  useEffect(() => {
    const idsToFetch = [ediId, ep1Id, ep2Id].filter(
      (id): id is string => !!id && !evaluacionesDb.some((e) => e.id === id) && !fetchedEvaluationsMap[id]
    );

    if (idsToFetch.length === 0) return;

    let isMounted = true;
    const fetchMissing = async () => {
      const db = getFirestore();
      const updates: Record<string, Evaluaciones> = {};

      await Promise.all(
        idsToFetch.map(async (id) => {
          try {
            const snap = await getDoc(doc(db, 'evaluaciones', id));
            if (snap.exists()) {
              updates[id] = { id: snap.id, ...snap.data() } as Evaluaciones;
            }
          } catch (e) {
            console.error(`Error al recuperar evaluación ${id}:`, e);
          }
        })
      );

      if (isMounted && Object.keys(updates).length > 0) {
        setFetchedEvaluationsMap((prev) => ({ ...prev, ...updates }));
      }
    };

    fetchMissing();
    return () => {
      isMounted = false;
    };
  }, [ediId, ep1Id, ep2Id, evaluacionesDb, fetchedEvaluationsMap]);

  // 4. Resolver las instancias de evaluación
  const findEval = useCallback(
    (id?: string): Evaluaciones | null => {
      if (!id) return null;
      if (evaluacion?.id === id) return evaluacion;
      const foundInList = evaluacionesDb.find((e) => e.id === id);
      if (foundInList) return foundInList;
      return fetchedEvaluationsMap[id] || null;
    },
    [evaluacion, evaluacionesDb, fetchedEvaluationsMap]
  );

  const evalEdi = useMemo(() => findEval(ediId), [findEval, ediId]);
  const evalEp1 = useMemo(() => findEval(ep1Id), [findEval, ep1Id]);
  const evalEp2 = useMemo(() => findEval(ep2Id), [findEval, ep2Id]);

  // 5. Determinar la etapa activa
  const selectedEtapa = useMemo<EtapaKey>(() => {
    if (evaluacion?.id) {
      if (ediId && evaluacion.id === ediId) return 'edi';
      if (ep1Id && evaluacion.id === ep1Id) return 'ep1';
      if (ep2Id && evaluacion.id === ep2Id) return 'ep2';
      const name = (evaluacion.nombre || '').toLowerCase();
      if (name.includes('diagnostica') || name.includes('edi')) return 'edi';
      if (name.includes('progresiva 1') || name.includes('ep1')) return 'ep1';
      if (name.includes('progresiva 2') || name.includes('ep2')) return 'ep2';
    }
    if (evalEp1) return 'ep1';
    if (evalEdi) return 'edi';
    if (evalEp2) return 'ep2';
    return 'ep1';
  }, [evaluacion?.id, evaluacion?.nombre, ediId, ep1Id, ep2Id, evalEdi, evalEp1, evalEp2]);

  // 6. Opciones para el selector de evaluación
  const etapaOptions: FilterOption[] = useMemo(() => {
    return [
      {
        value: 'edi',
        label: 'EDI · Diagnóstica',
        badge: evalEdi ? '✓ Asignada' : 'Sin asignar',
        badgeType: evalEdi ? 'success' : 'neutral',
      },
      {
        value: 'ep1',
        label: 'EP1 · Progresiva 1',
        badge: evalEp1 ? '✓ Asignada' : 'Sin asignar',
        badgeType: evalEp1 ? 'success' : 'neutral',
      },
      {
        value: 'ep2',
        label: 'EP2 · Progresiva 2',
        badge: evalEp2 ? '✓ Asignada' : 'Sin asignar',
        badgeType: evalEp2 ? 'success' : 'neutral',
      },
    ];
  }, [evalEdi, evalEp1, evalEp2]);

  // 7. Handler para cambiar de etapa
  const handleSelectEtapa = useCallback(
    (etapa: string) => {
      let target: Evaluaciones | null = null;
      let label = '';
      if (etapa === 'edi') {
        target = evalEdi;
        label = 'Diagnóstica (EDI)';
      } else if (etapa === 'ep1') {
        target = evalEp1;
        label = 'Progresiva 1 (EP1)';
      } else if (etapa === 'ep2') {
        target = evalEp2;
        label = 'Progresiva 2 (EP2)';
      }

      if (!target) {
        toast.info(
          `La evaluación ${label} aún no está asignada en la configuración regional para este grado.`
        );
        return;
      }

      if (target.id === evaluacion?.id) {
        return; // Ya está seleccionada
      }

      if (onSelectEvaluacion && target.id) {
        const monthNum =
          target.mesDelExamen !== undefined && target.mesDelExamen !== null
            ? Number(target.mesDelExamen)
            : undefined;
        onSelectEvaluacion(target.id, monthNum, target.grado ?? effectiveGrado);
      }
    },
    [evalEdi, evalEp1, evalEp2, evaluacion?.id, effectiveGrado, onSelectEvaluacion]
  );

  // 8. Handler para cambiar de categoría de área curricular
  const handleSelectCategoria = useCallback(
    (catId: number): boolean => {
      const g = effectiveGrado;
      const assignment = matrizConfigGrados[`${g}_${catId}`];
      let targetId: string | undefined = undefined;

      // Buscar según etapa preferida (la actualmente activa)
      if (selectedEtapa === 'ep1' && assignment?.ep1Id) targetId = assignment.ep1Id;
      else if (selectedEtapa === 'edi' && assignment?.ediId) targetId = assignment.ediId;
      else if (selectedEtapa === 'ep2' && assignment?.ep2Id) targetId = assignment.ep2Id;
      else {
        targetId = assignment?.ep1Id || assignment?.ediId || assignment?.ep2Id;
      }

      // Fallback: buscar en evaluacionesDb una evaluación activa para ese grado y categoría
      if (!targetId && evaluacionesDb.length > 0) {
        const match = evaluacionesDb.find(
          (e) =>
            Number(e.grado) === Number(g) &&
            Number(e.categoria) === Number(catId)
        );
        if (match?.id) targetId = match.id;
      }

      if (targetId && onSelectEvaluacion) {
        const targetEval = findEval(targetId);
        const targetMonth =
          targetEval?.mesDelExamen !== undefined && targetEval?.mesDelExamen !== null
            ? Number(targetEval.mesDelExamen)
            : undefined;
        onSelectEvaluacion(targetId, targetMonth, targetEval?.grado || g);
        return true;
      }

      return false;
    },
    [effectiveGrado, matrizConfigGrados, selectedEtapa, evaluacionesDb, onSelectEvaluacion, findEval]
  );

  const isEvaluacionConfigurada = useMemo(() => {
    return isEvaluacionEnMatriz(evaluacion?.id, matrizConfigGrados);
  }, [evaluacion?.id, matrizConfigGrados]);

  return {
    selectedEtapa,
    etapaOptions,
    evalEdi,
    evalEp1,
    evalEp2,
    matrizConfigGrados,
    baremoDecisiones,
    loadingConfig,
    isEvaluacionConfigurada,
    handleSelectEtapa,
    handleSelectCategoria,
    findEval,
  };
};

export default useEvaluacionesMatriz;
