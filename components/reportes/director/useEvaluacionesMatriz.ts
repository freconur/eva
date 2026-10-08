import { useState, useEffect, useMemo, useCallback } from 'react';
import { doc, getDoc, getFirestore } from 'firebase/firestore';
import { Evaluaciones } from '@/features/types/types';
import { FilterOption } from '@/components/reportes/CustomFilterDropdown';
import { toast } from 'react-toastify';

export type EtapaKey = 'edi' | 'ep1' | 'ep2';

interface UseEvaluacionesMatrizProps {
  evaluacion?: Evaluaciones;
  evaluacionesDb?: Evaluaciones[];
  selectedCategoriaId?: number;
  onSelectEvaluacion?: (idEvaluacion: string, mesDelExamen?: number) => void;
}

export const useEvaluacionesMatriz = ({
  evaluacion,
  evaluacionesDb = [],
  selectedCategoriaId,
  onSelectEvaluacion,
}: UseEvaluacionesMatrizProps) => {
  const [matrizConfigGrados, setMatrizConfigGrados] = useState<Record<string, any>>({});
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

  // 2. Obtener la asignación para el grado y categoría efectiva
  const gradoAssignment = useMemo(() => {
    if (!evaluacion?.grado) return null;
    const g = evaluacion.grado;
    const c = effectiveCategoriaId;
    return (
      matrizConfigGrados[`${g}_${c}`] ||
      matrizConfigGrados[`${g}`] ||
      null
    );
  }, [evaluacion?.grado, effectiveCategoriaId, matrizConfigGrados]);

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
        onSelectEvaluacion(target.id, monthNum);
      }
    },
    [evalEdi, evalEp1, evalEp2, evaluacion?.id, onSelectEvaluacion]
  );

  // 8. Handler para cambiar de categoría de área curricular
  const handleSelectCategoria = useCallback(
    (catId: number): boolean => {
      if (!evaluacion?.grado) return false;
      const g = evaluacion.grado;
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
        onSelectEvaluacion(targetId, targetMonth);
        return true;
      }

      return false;
    },
    [evaluacion?.grado, matrizConfigGrados, selectedEtapa, evaluacionesDb, onSelectEvaluacion, findEval]
  );

  return {
    selectedEtapa,
    etapaOptions,
    evalEdi,
    evalEp1,
    evalEp2,
    matrizConfigGrados,
    loadingConfig,
    handleSelectEtapa,
    handleSelectCategoria,
    findEval,
  };
};

export default useEvaluacionesMatriz;
