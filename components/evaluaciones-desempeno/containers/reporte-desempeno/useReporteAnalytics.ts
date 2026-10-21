import { useMemo } from 'react';
import { DataEstadisticas, PRDocentes, User, DataEvaluacion } from '@/features/types/types';
import { regiones } from '@/fuctions/regiones';
import { getCleanPhaseName, getMonitoreoTimestamp, getLocalDateString } from '@/features/evaluados-especialistas/components/utils';
import { getDomainColor, hexToRgba, DEFAULT_DOMAIN_PALETTE } from './chartPlugins';

export interface UseReporteAnalyticsProps {
  evaluados: User[];
  dataEvaluacion: DataEvaluacion | null;
  preguntasRespuestas: PRDocentes[];
  dimensiones: any[];
  colorMode: 'dominio' | 'nivel';
  targetNounSingular?: string;
  isDirectorRole?: boolean;
  groupFallbackName?: string;
}

export const getPersonDni = (item: any): string => {
  if (!item) return '';
  return String(
    item.docenteDni ||
    item.directorDni ||
    item.dniDirector ||
    item.especialistaDni ||
    item.evaluadoDni ||
    item.dni ||
    item.datosDirector?.dni ||
    item.info?.dni ||
    ''
  ).trim();
};

export const getPersonName = (item: any, fallbackNoun: string = 'Evaluado'): string => {
  if (!item) return fallbackNoun;
  const name =
    item.directorNombre ||
    item.nombreDirector ||
    item.docenteNombre ||
    item.nombre ||
    item.nombres ||
    item.datosDirector?.nombres ||
    item.info?.nombres ||
    '';
  const surnames =
    item.directorApellidos ||
    item.apellidoDirector ||
    item.apellidos ||
    item.datosDirector?.apellidos ||
    item.info?.apellidos ||
    '';
  const full = `${name} ${surnames}`.trim();
  if (full) return full;
  const dni = getPersonDni(item);
  return dni ? `${fallbackNoun} (${dni})` : fallbackNoun;
};

export const formatLabel = (str: string, maxLen: number = 24): string[] => {
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

export const useReporteAnalytics = ({
  evaluados,
  dataEvaluacion,
  preguntasRespuestas,
  dimensiones,
  colorMode,
  targetNounSingular = 'Docente',
  isDirectorRole = false,
  groupFallbackName,
}: UseReporteAnalyticsProps) => {
  const scale = useMemo(() => dataEvaluacion?.escala || [], [dataEvaluacion?.escala]);
  const rawNiveles = useMemo(
    () => dataEvaluacion?.niveles || (dataEvaluacion as any)?.nivelYPuntaje || [],
    [dataEvaluacion]
  );

  const maxScaleValue = useMemo(() => {
    return Math.max(1, ...(scale.map((e: any) => Number(e.value) || 0) || [3]));
  }, [scale]);

  const maxGlobalDomainScore = useMemo(() => {
    if (!dimensiones || dimensiones.length === 0) return 20;
    const maxQuestionsInAnyDim = Math.max(
      1,
      ...dimensiones.map((d: any) => {
        const count = preguntasRespuestas.filter((p) => p.dimensionId === d.id).length;
        return count || 1;
      })
    );
    return maxQuestionsInAnyDim * maxScaleValue;
  }, [dimensiones, preguntasRespuestas, maxScaleValue]);

  // Función para determinar el nivel de logro a partir de un puntaje
  const getNivelLogro = (calificacion: number, nivelesEspecificos?: any[]) => {
    const list = nivelesEspecificos && nivelesEspecificos.length > 0 ? nivelesEspecificos : rawNiveles;
    if (!list || list.length === 0) return null;

    const sortedNiveles = [...list].sort(
      (a: any, b: any) => (Number(a.min) || 0) - (Number(b.min) || 0)
    );

    const exact = sortedNiveles.find(
      (n: any) => calificacion >= (Number(n.min) || 0) && calificacion <= (Number(n.max) || 0)
    );
    if (exact) return exact;

    if (calificacion <= (Number(sortedNiveles[0]?.max) || 0)) {
      return sortedNiveles[0];
    }

    for (let i = 0; i < sortedNiveles.length; i++) {
      const current = sortedNiveles[i];
      const next = sortedNiveles[i + 1];
      const curMax = Number(current.max) || 0;
      const nextMin = next ? Number(next.min) || 0 : Infinity;

      if (calificacion > curMax && calificacion < nextMin) {
        return next || current;
      }
      if (calificacion <= curMax) {
        return current;
      }
    }

    return sortedNiveles[sortedNiveles.length - 1];
  };

  const getNivelLogroDominio = (puntajeDominio: number, maxDomainScore: number, dimObj?: any) => {
    if (dimObj?.niveles && dimObj.niveles.length > 0) {
      return getNivelLogro(puntajeDominio, dimObj.niveles);
    }
    if (rawNiveles.length === 0) return null;

    const maxScaleNivel = Math.max(1, ...(rawNiveles.map((n: any) => Number(n.max) || 0) || [20]));
    const puntajeEquivalente = maxDomainScore > 0 ? (puntajeDominio / maxDomainScore) * maxScaleNivel : puntajeDominio;

    return getNivelLogro(puntajeEquivalente, rawNiveles);
  };

  // Suma de puntaje por dimensión para una sesión evaluada específica
  const getPuntajeSumPorDominio = (
    evalu: any,
    dimensionId: string,
    preguntasDim: any[]
  ): number | null => {
    const respuestas = (evalu as any).resultadosSeguimientoRetroalimentacion || (evalu as any).resultados || [];
    if (!respuestas || respuestas.length === 0) return null;

    let sumaPuntos = 0;
    let respuestasEncontradas = 0;

    preguntasDim.forEach((pregunta) => {
      const pId = pregunta.id || pregunta.order?.toString();
      const resp = respuestas.find((r: any) => {
        const rId = r.id || r.order?.toString();
        if (r.dimensionId && r.dimensionId === dimensionId && rId === pId) return true;
        if (rId && pId && rId.toString() === pId.toString()) return true;
        if (
          (r.dimensionId === dimensionId || (!r.dimensionId && pregunta.dimensionId === dimensionId)) &&
          r.criterio &&
          pregunta.criterio &&
          r.criterio.trim().toLowerCase() === pregunta.criterio.trim().toLowerCase()
        ) {
          return true;
        }
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

  // Puntaje total general de una sesión
  const getPersonTotalScore = (evalu: any): number | null => {
    if (typeof evalu.calificacion === 'number') {
      return evalu.calificacion;
    }
    const respuestas = (evalu as any).resultadosSeguimientoRetroalimentacion || (evalu as any).resultados || [];
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

  // Mapa de personas únicas agrupadas por DNI
  const uniquePersonMap = useMemo(() => {
    const map = new Map<string, any[]>();
    evaluados.forEach((item) => {
      const dni = getPersonDni(item);
      if (!dni) return;
      if (!map.has(dni)) {
        map.set(dni, []);
      }
      map.get(dni)!.push(item);
    });
    return map;
  }, [evaluados]);

  // Consolidado Global de Respuestas (Doughnut / Pie)
  const getPieData = (dataConsolidadoGlobal?: DataEstadisticas) => {
    if (!dataConsolidadoGlobal || !scale || scale.length === 0) {
      return { labels: [], datasets: [] };
    }

    const alphabet = ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h', 'i', 'j'];
    const dataValues = scale.map((_, index) => {
      const key = alphabet[index] || `opt_${index}`;
      return (dataConsolidadoGlobal as any)[key] || 0;
    });

    const backgroundColors = [
      'rgba(148, 163, 184, 0.85)', // Slate (En inicio)
      'rgba(96, 165, 250, 0.85)',  // Blue (En desarrollo)
      'rgba(52, 211, 153, 0.85)',  // Emerald (Logrado esperado)
      'rgba(129, 140, 248, 0.85)', // Indigo / Purple (Logro destacado)
      'rgba(100, 116, 139, 0.85)', // Slate darker (Logro innovador)
      'rgba(251, 146, 60, 0.85)',  // Orange
      'rgba(244, 63, 94, 0.85)',   // Rose
      'rgba(168, 85, 247, 0.85)',  // Purple
    ];

    const borderColors = [
      '#64748b',
      '#3b82f6',
      '#10b981',
      '#6366f1',
      '#475569',
      '#ea580c',
      '#e11d48',
      '#9333ea',
    ];

    return {
      labels: scale.map((e) => e.descripcion || ''),
      datasets: [
        {
          data: dataValues,
          backgroundColor: backgroundColors.slice(0, scale.length),
          borderColor: borderColors.slice(0, scale.length),
          borderWidth: 1.5,
        },
      ],
    };
  };

  // Distribución Proporcional por Dominio (Doughnut / Pie)
  const getDimensionPieData = () => {
    if (!scale || scale.length === 0 || !dimensiones || dimensiones.length === 0) {
      return { labels: [], datasets: [] };
    }

    const labels = dimensiones.map((d: any) => (d.nombre || '').toUpperCase());

    const data = dimensiones.map((dim: any) => {
      const preguntasDim = preguntasRespuestas.filter((p) => p.dimensionId === dim.id);
      if (preguntasDim.length === 0) return 0;

      const latestDomainScores: number[] = [];
      Array.from(uniquePersonMap.values()).forEach((evalsList) => {
        const evalsSorted = [...evalsList].sort((a, b) => {
          const timeA = getMonitoreoTimestamp(a);
          const timeB = getMonitoreoTimestamp(b);
          if (timeA !== timeB) return timeA - timeB;
          return (Number(a.numeroEvaluacion) || 0) - (Number(b.numeroEvaluacion) || 0);
        });
        const latestEval = evalsSorted[evalsSorted.length - 1];
        const sumVal = getPuntajeSumPorDominio(latestEval, dim.id, preguntasDim);
        if (sumVal !== null) {
          latestDomainScores.push(sumVal);
        }
      });

      const avgScore = latestDomainScores.length > 0
        ? latestDomainScores.reduce((acc, curr) => acc + curr, 0) / latestDomainScores.length
        : 0;

      return Number(avgScore.toFixed(2));
    });

    const backgroundColors = dimensiones.map((dim: any, i: number) =>
      hexToRgba(getDomainColor(dim, i), 0.8)
    );
    const borderColors = dimensiones.map((dim: any, i: number) =>
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

  // Datos para gráfico de Dominios (Barras horizontales/verticales)
  const getDimensionData = () => {
    if (!scale || scale.length === 0 || !dimensiones || dimensiones.length === 0) {
      return { labels: [], datasets: [], dimList: [] };
    }

    const dimList = (dimensiones || []).map((dim: any, dimIndex: number) => {
      const preguntasDim = preguntasRespuestas.filter((p) => p.dimensionId === dim.id);

      const latestDomainScores: number[] = [];
      const latestCalifs: number[] = [];

      Array.from(uniquePersonMap.values()).forEach((evalsList) => {
        const evalsSorted = [...evalsList].sort((a, b) => {
          const timeA = getMonitoreoTimestamp(a);
          const timeB = getMonitoreoTimestamp(b);
          if (timeA !== timeB) return timeA - timeB;
          return (Number(a.numeroEvaluacion) || 0) - (Number(b.numeroEvaluacion) || 0);
        });
        const latestEval = evalsSorted[evalsSorted.length - 1];
        const sumVal = getPuntajeSumPorDominio(latestEval, dim.id, preguntasDim);
        if (sumVal !== null) {
          latestDomainScores.push(sumVal);
          const califVal = typeof latestEval.calificacion === 'number' ? latestEval.calificacion : sumVal;
          latestCalifs.push(califVal);
        }
      });

      const latestGlobalDomainAvg = latestDomainScores.length > 0
        ? latestDomainScores.reduce((acc, curr) => acc + curr, 0) / latestDomainScores.length
        : 0;

      const countQuestions = preguntasDim.length || 1;
      const maxDomainScore = countQuestions * maxScaleValue;

      const roundedDomainAvg = Number(latestGlobalDomainAvg.toFixed(2));
      const nivelObj = (dim.niveles && dim.niveles.length > 0)
        ? getNivelLogro(roundedDomainAvg, dim.niveles)
        : getNivelLogroDominio(roundedDomainAvg, maxDomainScore, dim);

      // Desglose histórico por fases
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

      evaluados.forEach((item: any) => {
        const sumVal = getPuntajeSumPorDominio(item, dim.id, preguntasDim);
        if (sumVal !== null) {
          const numEval = Number(item.numeroEvaluacion) || 1;
          const faseName = getCleanPhaseName(item.faseNombre, item.idFase || item.faseActualID || `Eval ${numEval}`);
          const timestamp = getMonitoreoTimestamp(item);
          const faseKey = (item.idFase || item.faseActualID || item.faseNombre || `eval_${numEval}`).toString().trim();

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
          pData.domainScores.push(sumVal);
          if (typeof item.calificacion === 'number') {
            pData.califs.push(item.calificacion);
          } else {
            pData.califs.push(sumVal);
          }
        }
      });

      const phasesSorted = Array.from(phaseMap.values()).sort((a, b) => {
        if (a.timestamp !== b.timestamp) return a.timestamp - b.timestamp;
        return a.numEval - b.numEval;
      });

      const evalsData = phasesSorted.map((p) => {
        const avgScore = p.domainScores.reduce((acc, curr) => acc + curr, 0) / p.domainScores.length;
        const avgCalif = p.califs.reduce((acc, curr) => acc + curr, 0) / p.califs.length;
        const roundedScore = Number(avgScore.toFixed(2));
        const nivel = (dim.niveles && dim.niveles.length > 0)
          ? getNivelLogro(roundedScore, dim.niveles)
          : getNivelLogroDominio(roundedScore, maxDomainScore, dim);

        return {
          domainScore: roundedScore,
          fase: p.faseName,
          calif: Number(avgCalif.toFixed(2)),
          nivel,
          nivelColor: nivel?.color || '#3b82f6',
        };
      });

      const rawColor = getDomainColor(dim, dimIndex);
      const chosenColor = colorMode === 'nivel' && nivelObj?.color ? nivelObj.color : rawColor;

      return {
        dim,
        name: dim.nombre || `Dominio ${dimIndex + 1}`,
        avg: roundedDomainAvg,
        latestDomainScore: roundedDomainAvg,
        maxScore: maxDomainScore,
        countQuestions,
        color: chosenColor,
        nivelNombre: nivelObj?.nivel || '',
        nivelColor: nivelObj?.color || chosenColor,
        evalsData,
      };
    });

    const labels = dimList.map((d) => formatLabel(d.name));
    const maxPhases = Math.max(1, ...dimList.map((d) => d.evalsData.length));

    let datasets: any[] = [];
    for (let pIdx = 0; pIdx < maxPhases; pIdx++) {
      const dataForPhase: number[] = [];
      const rawDomainScores: number[] = [];
      const phaseNames: string[] = [];
      const bgColors: string[] = [];
      const borderColors: string[] = [];

      dimList.forEach((item, dIdx) => {
        const evData = item.evalsData[pIdx];
        if (evData) {
          const sumScores = item.evalsData.reduce((acc: number, ev: any) => acc + (ev.domainScore || 0), 0);
          const propVal = (maxPhases > 1 && sumScores > 0)
            ? Number(((evData.domainScore / sumScores) * item.latestDomainScore).toFixed(3))
            : evData.domainScore;
          dataForPhase.push(propVal);
          rawDomainScores.push(evData.domainScore);
          phaseNames.push(evData.fase);
          const baseColor = colorMode === 'nivel' && evData.nivelColor ? evData.nivelColor : getDomainColor(item.dim, dIdx);
          const alpha = maxPhases === 1 ? 0.85 : 0.55 + (pIdx / maxPhases) * 0.4;
          bgColors.push(hexToRgba(baseColor, alpha));
          borderColors.push(baseColor);
        } else {
          dataForPhase.push(0);
          rawDomainScores.push(0);
          phaseNames.push('');
          bgColors.push('transparent');
          borderColors.push('transparent');
        }
      });

      const samplePhaseName = phaseNames.find(Boolean) || (maxPhases === 1 ? 'Fase Única' : `Fase ${pIdx + 1}`);
      datasets.push({
        label: samplePhaseName,
        data: dataForPhase,
        rawDomainScores,
        phaseNames,
        backgroundColor: bgColors,
        borderColor: borderColors,
        borderWidth: 1.5,
        borderRadius: pIdx === maxPhases - 1 ? 6 : 0,
      });
    }

    return {
      labels,
      datasets,
      dimList,
    };
  };

  // Distribución por Niveles de Logro (Pie / Doughnut)
  const getLevelsData = () => {
    if (!rawNiveles || rawNiveles.length === 0) {
      return { labels: [], datasets: [] };
    }

    const counts: { [nivelName: string]: number } = {};
    rawNiveles.forEach((n: any) => {
      counts[n.nivel] = 0;
    });

    Array.from(uniquePersonMap.values()).forEach((evalsList) => {
      const evalsSorted = [...evalsList].sort((a, b) => {
        const timeA = getMonitoreoTimestamp(a);
        const timeB = getMonitoreoTimestamp(b);
        if (timeA !== timeB) return timeA - timeB;
        return (Number(a.numeroEvaluacion) || 0) - (Number(b.numeroEvaluacion) || 0);
      });
      const latestEval = evalsSorted[evalsSorted.length - 1];
      const calif = getPersonTotalScore(latestEval);
      if (calif !== null) {
        const nivel = getNivelLogro(calif);
        if (nivel && counts[nivel.nivel] !== undefined) {
          counts[nivel.nivel] += 1;
        }
      }
    });

    const labels = rawNiveles.map((n: any) => n.nivel);
    const data = rawNiveles.map((n: any) => counts[n.nivel] || 0);
    const backgroundColors = rawNiveles.map((n: any) => hexToRgba(n.color || '#3b82f6', 0.8));
    const borderColors = rawNiveles.map((n: any) => n.color || '#3b82f6');

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

  // Comparativa de Dominios / Radar pentagonal
  const getRadarData = () => {
    if (!dimensiones || dimensiones.length === 0) {
      return { labels: [], datasets: [] };
    }

    const labels = dimensiones.map((d: any) => (d.nombre || '').toUpperCase());

    const averages = dimensiones.map((dim: any) => {
      const preguntasDim = preguntasRespuestas.filter((p) => p.dimensionId === dim.id);
      if (preguntasDim.length === 0) return 0;

      const latestScores: number[] = [];
      Array.from(uniquePersonMap.values()).forEach((evalsList) => {
        const evalsSorted = [...evalsList].sort((a, b) => {
          const timeA = getMonitoreoTimestamp(a);
          const timeB = getMonitoreoTimestamp(b);
          if (timeA !== timeB) return timeA - timeB;
          return (Number(a.numeroEvaluacion) || 0) - (Number(b.numeroEvaluacion) || 0);
        });
        const latestEval = evalsSorted[evalsSorted.length - 1];
        const sumVal = getPuntajeSumPorDominio(latestEval, dim.id, preguntasDim);
        if (sumVal !== null) {
          latestScores.push(sumVal);
        }
      });

      const avg = latestScores.length > 0
        ? latestScores.reduce((acc, curr) => acc + curr, 0) / latestScores.length
        : 0;

      return Number(avg.toFixed(2));
    });

    return {
      labels,
      datasets: [
        {
          label: 'Puntaje Promedio',
          data: averages,
          backgroundColor: 'rgba(59, 130, 246, 0.25)',
          borderColor: '#2563eb',
          borderWidth: 2,
          pointBackgroundColor: '#2563eb',
          pointBorderColor: '#ffffff',
          pointHoverBackgroundColor: '#ffffff',
          pointHoverBorderColor: '#2563eb',
        },
      ],
    };
  };

  // ----------------------------------------------------
  // AGRUPACIÓN POR UGEL / INSTITUCIÓN PARA UN DOMINIO
  // ----------------------------------------------------
  const getUGELDataForDimension = (dimensionId: string, color?: string) => {
    const preguntasDim = preguntasRespuestas.filter((p) => p.dimensionId === dimensionId);
    const countQuestions = preguntasDim.length || 1;
    const maxDomainScore = Math.max(1, countQuestions * maxScaleValue);

    const groupPersonMap = new Map<string, Map<string, any[]>>();
    const groupPhaseMap = new Map<
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

    evaluados.forEach((item: any) => {
      // Para directores agrupamos por Institución (o sede); para otros por Región/UGEL
      let groupId = '';
      let groupName = '';

      if (isDirectorRole) {
        groupId = item.institucion || item.info?.institucion || 'Mi Institución';
        groupName = groupId.toUpperCase();
      } else if (targetNounSingular === 'Docente') {
        const rawInst = (item.institucion || item.info?.institucion || '').toString().trim();
        groupId = rawInst ? (rawInst.startsWith('I.E.') ? rawInst : `I.E. ${rawInst}`) : (item.region ? `UGEL ${item.region}` : 'General');
        groupName = groupId.toUpperCase();
      } else {
        const reg = item.region || item.ugel || item.info?.region;
        if (!reg && item.institucion) {
          groupId = item.institucion;
          groupName = item.institucion.toUpperCase();
        } else if (reg) {
          groupId = reg.toString();
          groupName = (regiones.find((r) => r.id.toString() === groupId)?.region || groupId).toUpperCase();
        } else {
          groupId = 'General';
          groupName = 'GENERAL';
        }
      }

      const dni = getPersonDni(item);

      if (!groupPersonMap.has(groupId)) {
        groupPersonMap.set(groupId, new Map());
      }
      if (dni) {
        const pGroup = groupPersonMap.get(groupId)!;
        if (!pGroup.has(dni)) {
          pGroup.set(dni, []);
        }
        pGroup.get(dni)!.push(item);
      }

      if (!groupPhaseMap.has(groupId)) {
        groupPhaseMap.set(groupId, new Map());
      }

      const sumVal = getPuntajeSumPorDominio(item, dimensionId, preguntasDim);
      if (sumVal !== null) {
        const numEval = Number(item.numeroEvaluacion) || 1;
        const faseName = getCleanPhaseName(item.faseNombre, item.idFase || item.faseActualID || `Eval ${numEval}`);
        const timestamp = getMonitoreoTimestamp(item);
        const faseKey = (item.idFase || item.faseActualID || item.faseNombre || `eval_${numEval}`).toString().trim();

        const pMap = groupPhaseMap.get(groupId)!;
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
        pData.domainScores.push(sumVal);
        if (typeof item.calificacion === 'number') {
          pData.califs.push(item.calificacion);
        } else {
          pData.califs.push(sumVal);
        }
      }
    });

    const groupList: any[] = [];
    Array.from(groupPersonMap.entries()).forEach(([groupId, pGroup]) => {
      let groupName = groupId;
      if (!isDirectorRole) {
        if (targetNounSingular === 'Docente') {
          groupName = groupId.toUpperCase();
        } else {
          groupName = (regiones.find((r) => r.id.toString() === groupId)?.region || groupId).toUpperCase();
        }
      }

      const latestDomainScores: number[] = [];
      const latestCalifs: number[] = [];

      Array.from(pGroup.values()).forEach((evalsList) => {
        const evalsSorted = [...evalsList].sort((a, b) => {
          const timeA = getMonitoreoTimestamp(a);
          const timeB = getMonitoreoTimestamp(b);
          if (timeA !== timeB) return timeA - timeB;
          return (Number(a.numeroEvaluacion) || 0) - (Number(b.numeroEvaluacion) || 0);
        });
        const latestEval = evalsSorted[evalsSorted.length - 1];
        const sumVal = getPuntajeSumPorDominio(latestEval, dimensionId, preguntasDim);
        if (sumVal !== null) {
          latestDomainScores.push(sumVal);
          const califVal = typeof latestEval.calificacion === 'number' ? latestEval.calificacion : sumVal;
          latestCalifs.push(califVal);
        }
      });

      if (latestDomainScores.length === 0) return;

      const currentDim = dimensiones?.find((d) => d.id === dimensionId);
      const latestGroupDomainAvg = latestDomainScores.reduce((acc, curr) => acc + curr, 0) / latestDomainScores.length;
      const latestGroupCalifAvg = latestCalifs.reduce((acc, curr) => acc + curr, 0) / latestCalifs.length;
      const roundedDomainAvg = Number(latestGroupDomainAvg.toFixed(2));
      const nivelObj = (currentDim?.niveles && currentDim.niveles.length > 0)
        ? getNivelLogro(roundedDomainAvg, currentDim.niveles)
        : getNivelLogroDominio(roundedDomainAvg, maxDomainScore, currentDim);

      const pMap = groupPhaseMap.get(groupId) || new Map();
      const phasesSorted = Array.from(pMap.values()).sort((a, b) => {
        if (a.timestamp !== b.timestamp) return a.timestamp - b.timestamp;
        return a.numEval - b.numEval;
      });

      const evalsData = phasesSorted.map((p) => {
        const avgScore = p.domainScores.reduce((acc: number, curr: number) => acc + curr, 0) / p.domainScores.length;
        const avgCalif = p.califs.reduce((acc: number, curr: number) => acc + curr, 0) / p.califs.length;
        const roundedScore = Number(avgScore.toFixed(2));
        const nivel = (currentDim?.niveles && currentDim.niveles.length > 0)
          ? getNivelLogro(roundedScore, currentDim.niveles)
          : getNivelLogroDominio(roundedScore, maxDomainScore, currentDim);

        return {
          domainScore: roundedScore,
          fase: p.faseName,
          dateStr: '',
          calif: Number(avgCalif.toFixed(2)),
          nivel,
          nivelColor: nivel?.color || '#3b82f6',
        };
      });

      groupList.push({
        name: groupName,
        avg: roundedDomainAvg,
        latestDomainScore: roundedDomainAvg,
        groupId,
        latestCalificacion: Number(latestGroupCalifAvg.toFixed(2)),
        nivelNombre: nivelObj?.nivel || '',
        nivelColor: nivelObj?.color || '#3b82f6',
        evalsData,
      });
    });

    groupList.sort((a, b) => b.latestDomainScore - a.latestDomainScore);

    const labels = groupList.map((g) => g.name);
    const maxPhases = Math.max(1, ...groupList.map((g) => g.evalsData.length));

    let datasets: any[] = [];
    for (let pIdx = 0; pIdx < maxPhases; pIdx++) {
      const dataForPhase: number[] = [];
      const rawDomainScores: number[] = [];
      const phaseNames: string[] = [];
      const bgColors: string[] = [];
      const borderColors: string[] = [];

      groupList.forEach((item) => {
        const evData = item.evalsData[pIdx];
        if (evData) {
          dataForPhase.push(evData.domainScore);
          rawDomainScores.push(evData.domainScore);
          phaseNames.push(evData.fase);
          const baseColor = colorMode === 'nivel' && evData.nivelColor ? evData.nivelColor : (color || '#3b82f6');
          const alpha = maxPhases === 1 ? 0.85 : 0.55 + (pIdx / maxPhases) * 0.4;
          bgColors.push(hexToRgba(baseColor, alpha));
          borderColors.push(baseColor);
        } else {
          dataForPhase.push(0);
          rawDomainScores.push(0);
          phaseNames.push('');
          bgColors.push('transparent');
          borderColors.push('transparent');
        }
      });

      const samplePhaseName = phaseNames.find(Boolean) || (maxPhases === 1 ? 'Fase Única' : `Fase ${pIdx + 1}`);
      datasets.push({
        label: samplePhaseName,
        data: dataForPhase,
        rawDomainScores,
        phaseNames,
        backgroundColor: bgColors,
        borderColor: borderColors,
        borderWidth: 1.5,
        borderRadius: pIdx === maxPhases - 1 ? 6 : 0,
      });
    }

    return {
      labels,
      datasets,
      groupList,
      maxDomainScore,
      totalItems: preguntasDim.length,
    };
  };

  // ----------------------------------------------------
  // DATOS POR PERSONA (DOCENTE) PARA UN DOMINIO
  // ----------------------------------------------------
  const getPersonDataForDimension = (dimensionId: string, color?: string) => {
    const preguntasDim = preguntasRespuestas.filter((p) => p.dimensionId === dimensionId);
    const countQuestions = preguntasDim.length || 1;
    const maxDomainScore = Math.max(1, countQuestions * maxScaleValue);
    const currentDim = dimensiones?.find((d) => d.id === dimensionId);

    const personList: any[] = [];
    Array.from(uniquePersonMap.entries()).forEach(([dni, evalsList]) => {
      const evalsSorted = [...evalsList].sort((a, b) => {
        const timeA = getMonitoreoTimestamp(a);
        const timeB = getMonitoreoTimestamp(b);
        if (timeA !== timeB) return timeA - timeB;
        return (Number(a.numeroEvaluacion) || 0) - (Number(b.numeroEvaluacion) || 0);
      });

      const evalsData = evalsSorted.map((ev: any, idx: number) => {
        const domainScore = getPuntajeSumPorDominio(ev, dimensionId, preguntasDim) || 0;
        const fase = getCleanPhaseName(ev.faseNombre, ev.idFase || ev.faseActualID || `Eval ${idx + 1}`);
        const dateStr = getLocalDateString(ev.fechaCreacion || ev.fecha || '');
        const calif = typeof ev.calificacion === 'number' ? ev.calificacion : domainScore;
        const nivel = (currentDim?.niveles && currentDim.niveles.length > 0)
          ? getNivelLogro(domainScore, currentDim.niveles)
          : getNivelLogroDominio(domainScore, maxDomainScore, currentDim);

        return {
          domainScore,
          fase,
          dateStr,
          calif,
          nivel,
          nivelColor: nivel?.color || '#3b82f6',
        };
      });

      const latestEvalData = evalsData[evalsData.length - 1];
      const name = getPersonName(evalsSorted[evalsSorted.length - 1], targetNounSingular);

      personList.push({
        dni,
        name,
        latestDomainScore: latestEvalData.domainScore,
        latestCalificacion: latestEvalData.calif,
        nivelNombre: latestEvalData.nivel?.nivel || '',
        nivelColor: latestEvalData.nivelColor || '#3b82f6',
        evalsData,
      });
    });

    personList.sort((a, b) => b.latestDomainScore - a.latestDomainScore);

    const labels = personList.map((p) => p.name);
    const maxEvals = Math.max(1, ...personList.map((p) => p.evalsData.length));

    let datasets: any[] = [];
    for (let eIdx = 0; eIdx < maxEvals; eIdx++) {
      const dataForEval: number[] = [];
      const rawDomainScores: number[] = [];
      const phaseNames: string[] = [];
      const bgColors: string[] = [];
      const borderColors: string[] = [];

      personList.forEach((item) => {
        const evData = item.evalsData[eIdx];
        if (evData) {
          dataForEval.push(evData.domainScore);
          rawDomainScores.push(evData.domainScore);
          phaseNames.push(evData.fase);
          const baseColor = colorMode === 'nivel' && evData.nivelColor ? evData.nivelColor : (color || '#6366f1');
          const alpha = maxEvals === 1 ? 0.85 : 0.55 + (eIdx / maxEvals) * 0.4;
          bgColors.push(hexToRgba(baseColor, alpha));
          borderColors.push(baseColor);
        } else {
          dataForEval.push(0);
          rawDomainScores.push(0);
          phaseNames.push('');
          bgColors.push('transparent');
          borderColors.push('transparent');
        }
      });

      const samplePhaseName = phaseNames.find(Boolean) || `Evaluación ${eIdx + 1}`;
      datasets.push({
        label: samplePhaseName,
        data: dataForEval,
        rawDomainScores,
        phaseNames,
        backgroundColor: bgColors,
        borderColor: borderColors,
        borderWidth: 1.5,
        borderRadius: eIdx === maxEvals - 1 ? 6 : 0,
      });
    }

    return {
      labels,
      datasets,
      personList,
      maxDomainScore,
      totalItems: preguntasDim.length,
    };
  };

  // ----------------------------------------------------
  // RENDIMIENTO GLOBAL POR UGEL / INSTITUCIÓN
  // ----------------------------------------------------
  const getGlobalUGELData = (color: string = '#3b82f6') => {
    const totalQuestions = preguntasRespuestas.length || 1;
    const maxGlobalScore = Math.max(
      1,
      ...(rawNiveles.map((n: any) => Number(n.max) || 0) || [totalQuestions * maxScaleValue])
    );

    const groupPersonMap = new Map<string, Map<string, any[]>>();
    const groupPhaseMap = new Map<
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

    evaluados.forEach((item: any) => {
      let groupId = '';
      if (isDirectorRole) {
        groupId = item.institucion || item.info?.institucion || groupFallbackName || 'Mi Institución';
      } else if (targetNounSingular === 'Docente') {
        const rawInst = (item.institucion || item.info?.institucion || '').toString().trim();
        if (rawInst) {
          groupId = rawInst.startsWith('I.E.') ? rawInst : `I.E. ${rawInst}`;
        } else {
          groupId = item.region ? `UGEL ${item.region}` : (groupFallbackName || 'General');
        }
      } else {
        const reg = item.region || item.ugel || item.info?.region;
        if (!reg && item.institucion) {
          groupId = item.institucion;
        } else if (reg) {
          groupId = reg.toString();
        } else {
          groupId = 'General';
        }
      }

      const dni = getPersonDni(item);

      if (!groupPersonMap.has(groupId)) {
        groupPersonMap.set(groupId, new Map());
      }
      if (dni) {
        const pGroup = groupPersonMap.get(groupId)!;
        if (!pGroup.has(dni)) {
          pGroup.set(dni, []);
        }
        pGroup.get(dni)!.push(item);
      }

      if (!groupPhaseMap.has(groupId)) {
        groupPhaseMap.set(groupId, new Map());
      }

      const score = getPersonTotalScore(item);
      if (score !== null) {
        const numEval = Number(item.numeroEvaluacion) || 1;
        const faseName = getCleanPhaseName(item.faseNombre, item.idFase || item.faseActualID || `Eval ${numEval}`);
        const timestamp = getMonitoreoTimestamp(item);
        const faseKey = (item.idFase || item.faseActualID || item.faseNombre || `eval_${numEval}`).toString().trim();

        const pMap = groupPhaseMap.get(groupId)!;
        if (!pMap.has(faseKey)) {
          pMap.set(faseKey, {
            faseKey,
            faseName,
            timestamp,
            numEval,
            scores: [],
          });
        }
        pMap.get(faseKey)!.scores.push(score);
      }
    });

    const groupList: any[] = [];
    Array.from(groupPersonMap.entries()).forEach(([groupId, pGroup]) => {
      let groupName = groupId;
      if (!isDirectorRole) {
        if (targetNounSingular === 'Docente') {
          groupName = groupId.toUpperCase();
        } else {
          groupName = (regiones.find((r) => r.id.toString() === groupId)?.region || groupId).toUpperCase();
        }
      }

      const latestScores: number[] = [];
      Array.from(pGroup.values()).forEach((evalsList) => {
        const evalsSorted = [...evalsList].sort((a, b) => {
          const timeA = getMonitoreoTimestamp(a);
          const timeB = getMonitoreoTimestamp(b);
          if (timeA !== timeB) return timeA - timeB;
          return (Number(a.numeroEvaluacion) || 0) - (Number(b.numeroEvaluacion) || 0);
        });
        const latestEval = evalsSorted[evalsSorted.length - 1];
        const score = getPersonTotalScore(latestEval);
        if (score !== null) {
          latestScores.push(score);
        }
      });

      if (latestScores.length === 0) return;

      const latestAvg = latestScores.reduce((acc, curr) => acc + curr, 0) / latestScores.length;
      const roundedAvg = Number(latestAvg.toFixed(2));
      const nivelObj = getNivelLogro(roundedAvg);

      const pMap = groupPhaseMap.get(groupId) || new Map();
      const phasesSorted = Array.from(pMap.values()).sort((a, b) => {
        if (a.timestamp !== b.timestamp) return a.timestamp - b.timestamp;
        return a.numEval - b.numEval;
      });

      const evalsData = phasesSorted.map((p) => {
        const avg = p.scores.reduce((acc: number, curr: number) => acc + curr, 0) / p.scores.length;
        const rounded = Number(avg.toFixed(2));
        const nivel = getNivelLogro(rounded);
        return {
          score: rounded,
          fase: p.faseName,
          nivel,
          nivelColor: nivel?.color || '#3b82f6',
        };
      });

      groupList.push({
        groupId,
        name: groupName,
        latestScore: roundedAvg,
        nivelNombre: nivelObj?.nivel || '',
        nivelColor: nivelObj?.color || '#3b82f6',
        evalsData,
      });
    });

    groupList.sort((a, b) => b.latestScore - a.latestScore);

    const labels = groupList.map((g) => g.name);
    const maxPhases = Math.max(1, ...groupList.map((g) => g.evalsData.length));

    let datasets: any[] = [];
    for (let pIdx = 0; pIdx < maxPhases; pIdx++) {
      const dataForPhase: number[] = [];
      const rawScores: number[] = [];
      const phaseNames: string[] = [];
      const bgColors: string[] = [];
      const borderColors: string[] = [];

      groupList.forEach((item) => {
        const evData = item.evalsData[pIdx];
        if (evData) {
          dataForPhase.push(evData.score);
          rawScores.push(evData.score);
          phaseNames.push(evData.fase);
          const baseColor = colorMode === 'nivel' && evData.nivelColor ? evData.nivelColor : color;
          const alpha = maxPhases === 1 ? 0.85 : 0.55 + (pIdx / maxPhases) * 0.4;
          bgColors.push(hexToRgba(baseColor, alpha));
          borderColors.push(baseColor);
        } else {
          dataForPhase.push(0);
          rawScores.push(0);
          phaseNames.push('');
          bgColors.push('transparent');
          borderColors.push('transparent');
        }
      });

      const samplePhaseName = phaseNames.find(Boolean) || (maxPhases === 1 ? 'Fase Única' : `Fase ${pIdx + 1}`);
      datasets.push({
        label: samplePhaseName,
        data: dataForPhase,
        rawScores,
        phaseNames,
        backgroundColor: bgColors,
        borderColor: borderColors,
        borderWidth: 1.5,
        borderRadius: pIdx === maxPhases - 1 ? 6 : 0,
      });
    }

    return {
      labels,
      datasets,
      groupList,
      maxGlobalScore,
      totalQuestions,
    };
  };

  // ----------------------------------------------------
  // RENDIMIENTO GLOBAL POR PERSONA (DOCENTE)
  // ----------------------------------------------------
  const getGlobalPersonData = (color: string = '#6366f1') => {
    const totalQuestions = preguntasRespuestas.length || 1;
    const maxGlobalScore = Math.max(
      1,
      ...(rawNiveles.map((n: any) => Number(n.max) || 0) || [totalQuestions * maxScaleValue])
    );

    const personList: any[] = [];
    Array.from(uniquePersonMap.entries()).forEach(([dni, evalsList]) => {
      const evalsSorted = [...evalsList].sort((a, b) => {
        const timeA = getMonitoreoTimestamp(a);
        const timeB = getMonitoreoTimestamp(b);
        if (timeA !== timeB) return timeA - timeB;
        return (Number(a.numeroEvaluacion) || 0) - (Number(b.numeroEvaluacion) || 0);
      });

      const evalsData = evalsSorted.map((ev: any, idx: number) => {
        const score = getPersonTotalScore(ev) || 0;
        const fase = getCleanPhaseName(ev.faseNombre, ev.idFase || ev.faseActualID || `Eval ${idx + 1}`);
        const dateStr = getLocalDateString(ev.fechaCreacion || ev.fecha || '');
        const nivel = getNivelLogro(score);

        return {
          score,
          fase,
          dateStr,
          nivel,
          nivelColor: nivel?.color || '#3b82f6',
        };
      });

      const latestEvalData = evalsData[evalsData.length - 1];
      const name = getPersonName(evalsSorted[evalsSorted.length - 1], targetNounSingular);

      personList.push({
        dni,
        name,
        latestScore: latestEvalData.score,
        nivelNombre: latestEvalData.nivel?.nivel || '',
        nivelColor: latestEvalData.nivelColor || '#3b82f6',
        evalsData,
      });
    });

    personList.sort((a, b) => b.latestScore - a.latestScore);

    const labels = personList.map((p) => p.name);
    const maxEvals = Math.max(1, ...personList.map((p) => p.evalsData.length));

    let datasets: any[] = [];
    for (let eIdx = 0; eIdx < maxEvals; eIdx++) {
      const dataForEval: number[] = [];
      const rawScores: number[] = [];
      const phaseNames: string[] = [];
      const bgColors: string[] = [];
      const borderColors: string[] = [];

      personList.forEach((item) => {
        const evData = item.evalsData[eIdx];
        if (evData) {
          dataForEval.push(evData.score);
          rawScores.push(evData.score);
          phaseNames.push(evData.fase);
          const baseColor = colorMode === 'nivel' && evData.nivelColor ? evData.nivelColor : color;
          const alpha = maxEvals === 1 ? 0.85 : 0.55 + (eIdx / maxEvals) * 0.4;
          bgColors.push(hexToRgba(baseColor, alpha));
          borderColors.push(baseColor);
        } else {
          dataForEval.push(0);
          rawScores.push(0);
          phaseNames.push('');
          bgColors.push('transparent');
          borderColors.push('transparent');
        }
      });

      const samplePhaseName = phaseNames.find(Boolean) || `Evaluación ${eIdx + 1}`;
      datasets.push({
        label: samplePhaseName,
        data: dataForEval,
        rawScores,
        phaseNames,
        backgroundColor: bgColors,
        borderColor: borderColors,
        borderWidth: 1.5,
        borderRadius: eIdx === maxEvals - 1 ? 6 : 0,
      });
    }

    return {
      labels,
      datasets,
      personList,
      maxGlobalScore,
      totalQuestions,
    };
  };

  // ----------------------------------------------------
  // ANÁLISIS DE ÍTEMS / CRITERIOS
  // ----------------------------------------------------
  const getItemAnalysisData = (pregunta: PRDocentes) => {
    const scaleDescriptions = scale.map((e) => e.descripcion || '');
    const counts = scale.map(() => 0);

    const latestList = Array.from(uniquePersonMap.values()).map((evalsList) => {
      const evalsSorted = [...evalsList].sort((a, b) => {
        const timeA = getMonitoreoTimestamp(a);
        const timeB = getMonitoreoTimestamp(b);
        if (timeA !== timeB) return timeA - timeB;
        return (Number(a.numeroEvaluacion) || 0) - (Number(b.numeroEvaluacion) || 0);
      });
      return evalsSorted[evalsSorted.length - 1];
    });

    latestList.forEach((item: any) => {
      const respuestas = item.resultadosSeguimientoRetroalimentacion || item.resultados || [];
      const pId = pregunta.id || pregunta.order?.toString();
      const resp = respuestas.find((r: any) => {
        const rId = r.id || r.order?.toString();
        if (rId && pId && rId.toString() === pId.toString()) return true;
        if (r.criterio && pregunta.criterio && r.criterio.trim().toLowerCase() === pregunta.criterio.trim().toLowerCase()) return true;
        return false;
      });

      if (resp && resp.alternativas) {
        resp.alternativas.forEach((alt: any, altIndex: number) => {
          if (alt.selected && altIndex < counts.length) {
            counts[altIndex] += 1;
          }
        });
      }
    });

    const backgroundColors = [
      'rgba(148, 163, 184, 0.65)',
      'rgba(96, 165, 250, 0.65)',
      'rgba(52, 211, 153, 0.65)',
      'rgba(129, 140, 248, 0.65)',
      'rgba(192, 132, 252, 0.65)',
      'rgba(56, 189, 248, 0.65)',
    ];

    const borderColors = [
      '#64748b',
      '#3b82f6',
      '#10b981',
      '#6366f1',
      '#c084fc',
      '#0284c7',
    ];

    const scaleStats = scale.map((s, idx) => ({
      label: s.descripcion || `Nivel ${idx + 1}`,
      count: counts[idx] || 0,
    }));

    return {
      labels: scaleDescriptions,
      datasets: [
        {
          label: 'Respuestas',
          data: counts,
          backgroundColor: scale.map((_, i) => backgroundColors[i % backgroundColors.length]),
          borderColor: scale.map((_, i) => borderColors[i % borderColors.length]),
          borderWidth: 1,
          borderRadius: 4,
        },
      ],
      totalRespondents: counts.reduce((a, b) => a + b, 0),
      scaleStats,
    };
  };

  return {
    scale,
    rawNiveles,
    maxScaleValue,
    maxGlobalDomainScore,
    getNivelLogro,
    getNivelLogroDominio,
    getPuntajeSumPorDominio,
    getPersonTotalScore,
    uniquePersonMap,
    getPieData,
    getDimensionPieData,
    getDimensionData,
    getLevelsData,
    getRadarData,
    getUGELDataForDimension,
    getPersonDataForDimension,
    getGlobalUGELData,
    getGlobalPersonData,
    getItemAnalysisData,
  };
};
