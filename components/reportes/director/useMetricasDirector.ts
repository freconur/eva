import { useMemo } from 'react';
import { PreguntasRespuestas, UserEstudiante } from '@/features/types/types';
import {
  BaremoDecisiones,
  DEFAULT_BAREMO_DECISIONES,
} from '@/components/modals/ConfigurarBaremoModal';
import {
  SeccionMetrica,
  PreguntaMetricaSeccion,
  DirectorMetricasResumen,
  NivelRiesgoInfo,
  AlertaInfo,
} from './types';

interface UseMetricasDirectorProps {
  estudiantes: UserEstudiante[];
  preguntas: PreguntasRespuestas[];
  availableSections: Array<{ id: number | string; name: string }>;
  docentesMap: Map<string, string>;
  baremo?: BaremoDecisiones;
}

export const getNivelRiesgo = (avgPct: number, criticasCount: number, baremo: BaremoDecisiones): NivelRiesgoInfo => {
  if (criticasCount >= 3 || avgPct >= baremo.critico) {
    return {
      label: 'Crítico',
      icon: '',
      bg: '#fee2e2',
      text: '#991b1b',
      color: '#ef4444',
    };
  } else if (criticasCount >= 1 || avgPct >= baremo.alto) {
    return {
      label: 'Alto',
      icon: '',
      bg: '#ffedd5',
      text: '#9a3412',
      color: '#f97316',
    };
  } else if (avgPct >= baremo.medio) {
    return {
      label: 'Medio',
      icon: '',
      bg: '#fef9c3',
      text: '#854d0e',
      color: '#eab308',
    };
  } else {
    return {
      label: 'Bajo',
      icon: '',
      bg: '#dcfce7',
      text: '#166534',
      color: '#22c55e',
    };
  }
};

export const getAlertaInfo = (pct: number, baremo: BaremoDecisiones): AlertaInfo => {
  if (pct >= baremo.critico) {
    return {
      label: 'Crítico',
      clase: 'alertaCritico',
      color: '#e53935',
      accion: 'Intervención inmediata: Taller de reforzamiento',
    };
  } else if (pct >= baremo.alto) {
    return {
      label: 'Alto',
      clase: 'alertaAlto',
      color: '#ff8a65',
      accion: 'Priorizar: Sesiones de práctica adicionales',
    };
  } else if (pct >= baremo.medio) {
    return {
      label: 'Medio',
      clase: 'alertaMedio',
      color: '#f9a825',
      accion: 'Monitoreo: Seguimiento pedagógico',
    };
  } else {
    return {
      label: 'Bajo',
      clase: 'alertaBajo',
      color: '#66bb6a',
      accion: 'Mantener: Estrategias actuales de aula',
    };
  }
};

export const formatQuestionCode = (order: number) => {
  return `P${order < 10 ? '0' : ''}${order}`;
};

export const useMetricasDirector = ({
  estudiantes = [],
  preguntas = [],
  availableSections = [],
  docentesMap = new Map(),
  baremo = DEFAULT_BAREMO_DECISIONES,
}: UseMetricasDirectorProps): DirectorMetricasResumen => {
  const activeBaremo = useMemo(() => baremo || DEFAULT_BAREMO_DECISIONES, [baremo]);

  return useMemo(() => {
    // 1. Ordenar preguntas por 'order'
    const sortedPreguntas = [...preguntas].sort(
      (a, b) => Number(a.order || 0) - Number(b.order || 0)
    );

    // Mapa para acceso rápido a la respuesta correcta de cada pregunta
    const correctMap = new Map<number, string>();
    const idToOrderMap = new Map<string, number>();

    sortedPreguntas.forEach((p, idx) => {
      const order = p.order !== undefined && p.order !== null ? Number(p.order) : idx + 1;
      if (p.respuesta) {
        correctMap.set(order, p.respuesta.trim().toLowerCase());
      }
      if (p.id) {
        idToOrderMap.set(p.id, order);
      }
    });

    // Helper para verificar si un estudiante respondió correctamente una pregunta
    const verificarRespuestaEstudiante = (
      est: UserEstudiante,
      order: number,
      preguntaId?: string
    ): boolean => {
      const correctRespuesta = correctMap.get(order);
      if (!correctRespuesta) return false;

      let rtaSeleccionada: string | null = null;

      if (Array.isArray(est.respuestas)) {
        const resp = est.respuestas.find(
          (r) =>
            (preguntaId && r.id === preguntaId) ||
            (r.order !== undefined && Number(r.order) === order)
        );
        const altSelected = resp?.alternativas?.find((a) => a.selected === true);
        if (altSelected?.alternativa) {
          rtaSeleccionada = altSelected.alternativa.trim().toLowerCase();
        }
      } else if (est.respuestas && typeof est.respuestas === 'object') {
        const altKey = preguntaId ? (est.respuestas as any)[preguntaId] : null;
        if (altKey && typeof altKey === 'string') {
          rtaSeleccionada = altKey.trim().toLowerCase();
        }
      }

      return rtaSeleccionada === correctRespuesta;
    };

    // 2. Procesar métricas por sección
    const secciones: SeccionMetrica[] = availableSections.map((sec) => {
      const seccionIdStr = String(sec.id);
      const estudiantesSeccion = estudiantes.filter(
        (e) => String(e.seccion) === seccionIdStr
      );

      // Docentes asociados
      const docentesUnicos = Array.from(
        new Set(
          estudiantesSeccion
            .map((e) => (e.dniDocente ? docentesMap.get(String(e.dniDocente)) : null))
            .filter(Boolean)
        )
      );
      const docenteNombre =
        docentesUnicos.length > 0 ? docentesUnicos.join(', ') : undefined;

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
        const total = estudiantesSeccion.length;

        let correctas = 0;
        if (total > 0) {
          estudiantesSeccion.forEach((est) => {
            if (verificarRespuestaEstudiante(est, order, p.id)) {
              correctas++;
            }
          });
        }

        const falladas = Math.max(0, total - correctas);
        const aciertoPct = total > 0 ? Math.round((correctas / total) * 100) : 0;
        const prevPct = total > 0 ? Math.max(0, 100 - aciertoPct) : 0;

        const metrica: PreguntaMetricaSeccion = {
          order,
          preguntaId: p.id || '',
          totalEstudiantes: total,
          correctas,
          falladas,
          aciertoPct,
          prevPct,
        };

        preguntasMetricas[order] = metrica;

        if (total > 0) {
          sumPrev += prevPct;
          countPreguntas++;

          if (prevPct >= activeBaremo.critico) criticas++;
          else if (prevPct >= activeBaremo.alto) altas++;
          else if (prevPct >= activeBaremo.medio) medias++;
          else bajas++;

          if (prevPct > maxPrevPct) {
            maxPrevPct = prevPct;
            topPregunta = metrica;
          }
        }
      });

      const avgPrev = countPreguntas > 0 ? Math.round(sumPrev / countPreguntas) : 0;
      const nivelRiesgo = getNivelRiesgo(avgPrev, criticas, activeBaremo);

      return {
        id: seccionIdStr,
        nombre: `Sección ${sec.name.toUpperCase()}`,
        docenteNombre,
        totalEstudiantes: estudiantesSeccion.length,
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

    // Ordenar secciones por nivel de rezago descendente (más críticas primero)
    secciones.sort((a, b) => b.avgPrev - a.avgPrev);

    // 3. Procesar fila consolidada "TOTAL I.E."
    let totalIe: SeccionMetrica | null = null;
    if (estudiantes.length > 0) {
      const preguntasTotalIe: Record<number, PreguntaMetricaSeccion> = {};
      let sumPrevIe = 0;
      let countIe = 0;
      let criticasIe = 0;
      let altasIe = 0;
      let mediasIe = 0;
      let bajasIe = 0;
      let maxPrevPctIe = -1;
      let topPreguntaIe: PreguntaMetricaSeccion | null = null;

      sortedPreguntas.forEach((p, idx) => {
        const order = p.order !== undefined && p.order !== null ? Number(p.order) : idx + 1;
        const total = estudiantes.length;

        let correctas = 0;
        estudiantes.forEach((est) => {
          if (verificarRespuestaEstudiante(est, order, p.id)) {
            correctas++;
          }
        });

        const falladas = Math.max(0, total - correctas);
        const aciertoPct = total > 0 ? Math.round((correctas / total) * 100) : 0;
        const prevPct = total > 0 ? Math.max(0, 100 - aciertoPct) : 0;

        const metrica: PreguntaMetricaSeccion = {
          order,
          preguntaId: p.id || '',
          totalEstudiantes: total,
          correctas,
          falladas,
          aciertoPct,
          prevPct,
        };

        preguntasTotalIe[order] = metrica;

        if (total > 0) {
          sumPrevIe += prevPct;
          countIe++;

          if (prevPct >= activeBaremo.critico) criticasIe++;
          else if (prevPct >= activeBaremo.alto) altasIe++;
          else if (prevPct >= activeBaremo.medio) mediasIe++;
          else bajasIe++;

          if (prevPct > maxPrevPctIe) {
            maxPrevPctIe = prevPct;
            topPreguntaIe = metrica;
          }
        }
      });

      const avgPrevIe = countIe > 0 ? Math.round(sumPrevIe / countIe) : 0;
      totalIe = {
        id: 'total_ie',
        nombre: 'CONSOLIDADO I.E.',
        docenteNombre: 'Toda la Institución Educativa',
        totalEstudiantes: estudiantes.length,
        preguntas: preguntasTotalIe,
        avgPrev: avgPrevIe,
        criticas: criticasIe,
        altas: altasIe,
        medias: mediasIe,
        bajas: bajasIe,
        topPregunta: topPreguntaIe,
        nivelRiesgo: getNivelRiesgo(avgPrevIe, criticasIe, activeBaremo),
      };
    }

    // 4. Calcular KPIs globales (a nivel de las combinaciones sección x pregunta)
    let totalCritico = 0;
    let totalAlto = 0;
    let totalMedio = 0;
    let totalBajo = 0;
    let sumPrevTotal = 0;
    let countItems = 0;

    secciones.forEach((sec) => {
      Object.values(sec.preguntas).forEach((m) => {
        if (m.totalEstudiantes > 0) {
          sumPrevTotal += m.prevPct;
          countItems++;
          if (m.prevPct >= activeBaremo.critico) totalCritico++;
          else if (m.prevPct >= activeBaremo.alto) totalAlto++;
          else if (m.prevPct >= activeBaremo.medio) totalMedio++;
          else totalBajo++;
        }
      });
    });

    const kpis = {
      totalCritico,
      totalAlto,
      totalMedio,
      totalBajo,
      avgPrev: countItems > 0 ? Math.round(sumPrevTotal / countItems) : 0,
    };

    return {
      secciones,
      totalIe,
      sortedPreguntas,
      kpis,
      activeBaremo,
    };
  }, [estudiantes, preguntas, availableSections, docentesMap, activeBaremo]);
};
