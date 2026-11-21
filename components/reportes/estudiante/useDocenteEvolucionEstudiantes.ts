import { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { getFirestore, collection, query, where, getDocs, doc, getDoc, orderBy } from 'firebase/firestore';
import { Evaluaciones, Estudiante } from '@/features/types/types';
import { generateRealisticStudentName } from '@/features/utils/fakeNamesGenerator';
import { getMonthName } from '@/fuctions/dates';
import { getEtapasFromConfig } from '@/components/modals/ConfigurarMatrizModal';

export interface ActuacionCatalogoItem {
  order: number;
  actuacion: string;
  pregunta?: string;
  id?: string;
  respuesta?: string;
}

export interface EstudianteEtapaData {
  etapaKey: string;
  label: string;
  nombreEvaluacion: string;
  evaluacionId: string;
  puntaje: number;
  maxPuntaje: number;
  nivel: string;
  nivelColor?: string;
  respuestasCorrectas: number;
  totalPreguntas: number;
  porcentaje: number;
  fecha?: string;
  respuestas?: any;
  actuacionesResultados?: Record<number, 1 | 2>; // order -> 2 (SÍ) | 1 (NO)
}

export interface EstudianteEvolutivo {
  dni: string;
  nombres: string;
  apellidos: string;
  nombresApellidos: string;
  nombreCompleto: string;
  genero?: string;
  seccion: string;
  grado?: string | number;
  dniDocente?: string;
  fotoUrl?: string;
  foto?: string;
  etapas: Record<string, EstudianteEtapaData>;
  historial: EstudianteEtapaData[];
  puntajeInicial: number;
  puntajeFinal: number;
  deltaPuntaje: number;
  nivelInicial: string;
  nivelFinal: string;
  estadoTrayectoria: 'superacion' | 'estable' | 'alerta';
  porcentajeAsistencia: number; // Ej. 100 si dio todas las etapas posibles, 50 si dio 1 de 2
  diferenciaConAula: number;
}

export interface KpisEvolutivos {
  totalEstudiantes: number;
  totalSuperacion: number;
  totalEstable: number;
  totalAlerta: number;
  promedioAulaActual: number;
  deltaPromedioAula: number;
  promediosPorEtapa: Record<string, number>;
  conteosPorEtapa?: Record<string, number>;
}

interface UseDocenteEvolucionEstudiantesProps {
  evaluacion: Evaluaciones;
  matrizConfigGrados?: Record<string, any>;
  evaluacionesDb?: any[];
  dniDocente?: string | number;
  dniDirector?: string | number;
  currentEstudiantes: Estudiante[];
  yearSelected: number | string;
  monthSelected: number;
  isDemoMode?: boolean;
  preguntasRespuestas?: any[];
}

export interface EvolucionCacheEntry {
  etapasMapData: Record<string, { evalObj: any; estudiantes: Estudiante[] }>;
  masterRosterMap: Record<string, any>;
  timestamp: number;
}

// Caché en memoria a nivel de módulo para evitar lecturas redundantes en Firestore al alternar pestañas
const evolucionModuleCache = new Map<string, EvolucionCacheEntry>();

export const clearEvolucionModuleCache = () => {
  evolucionModuleCache.clear();
};

export const useDocenteEvolucionEstudiantes = ({
  evaluacion,
  matrizConfigGrados = {},
  evaluacionesDb = [],
  dniDocente,
  dniDirector,
  currentEstudiantes = [],
  yearSelected,
  monthSelected,
  isDemoMode = false,
  preguntasRespuestas = [],
}: UseDocenteEvolucionEstudiantesProps) => {
  const currentEstudiantesRef = useRef(currentEstudiantes);
  currentEstudiantesRef.current = currentEstudiantes;

  const evaluacionesDbRef = useRef(evaluacionesDb);
  evaluacionesDbRef.current = evaluacionesDb;

  const matrizConfigKey = useMemo(
    () => JSON.stringify(matrizConfigGrados || {}),
    [matrizConfigGrados]
  );

  // 1. Identificar si la evaluación actual forma parte de las etapas longitudinales (EDI, EP1, EP2, EP3, etc.)
  const etapasConfiguradas = useMemo(() => {
    if (!evaluacion?.id) return [];

    let assignment: any = null;
    const currentGrado = evaluacion.grado;
    const currentCat = evaluacion.categoria;

    if (currentGrado !== undefined && currentCat !== undefined) {
      assignment = matrizConfigGrados[`${currentGrado}_${currentCat}`];
    }

    if (!assignment) {
      for (const [, asgn] of Object.entries(matrizConfigGrados || {})) {
        if (!asgn) continue;
        const etapasMatriz = getEtapasFromConfig(asgn);
        if (etapasMatriz.some((et) => et.evaluacionId === evaluacion.id)) {
          assignment = asgn;
          break;
        }
      }
    }

    const etapas: { key: string; id: string; label: string; order: number }[] = [];
    if (assignment) {
      const etapasMatriz = getEtapasFromConfig(assignment);
      etapasMatriz.forEach((et, index) => {
        if (et.evaluacionId && et.evaluacionId.trim()) {
          const key = (et.id || et.codigo || `ep${index + 1}`).toLowerCase();
          let label = '';
          if (key === 'edi') {
            label = 'EDI (Diagnóstica)';
          } else if (key === 'ep1') {
            label = 'EP1 (Progresiva 1)';
          } else if (key === 'ep2') {
            label = 'EP2 (Progresiva 2)';
          } else if (key === 'ep3') {
            label = 'EP3 (Progresiva 3)';
          } else if (key === 'ep4') {
            label = 'EP4 (Progresiva 4)';
          } else if (key === 'es') {
            label = 'ES (Salida)';
          } else {
            const code = (et.codigo || key).toUpperCase();
            label = et.nombre ? `${code} (${et.nombre})` : code;
          }
          etapas.push({
            key,
            id: et.evaluacionId.trim(),
            label,
            order: index + 1,
          });
        }
      });
    }

    // Si la evaluación no está en la matriz, considerar al menos la evaluación actual
    if (etapas.length === 0 && evaluacion.id) {
      etapas.push({
        key: 'actual',
        id: evaluacion.id,
        label: evaluacion.nombre || 'Evaluación Actual',
        order: 1,
      });
    }

    return etapas.sort((a, b) => a.order - b.order);
  }, [evaluacion?.id, evaluacion?.grado, evaluacion?.categoria, evaluacion?.nombre, matrizConfigKey]);

  const etapasIdsKey = useMemo(
    () => etapasConfiguradas.map((e) => `${e.key}:${e.id}`).join(','),
    [etapasConfiguradas]
  );

  const cacheKey = useMemo(() => {
    return `${evaluacion?.id || ''}_${dniDocente || ''}_${dniDirector || ''}_${yearSelected || ''}_${monthSelected || ''}_${etapasIdsKey}`;
  }, [evaluacion?.id, dniDocente, dniDirector, yearSelected, monthSelected, etapasIdsKey]);

  const initialCached = useMemo(() => {
    return cacheKey ? evolucionModuleCache.get(cacheKey) : undefined;
  }, [cacheKey]);

  const [loading, setLoading] = useState<boolean>(!initialCached);
  const [error, setError] = useState<string | null>(null);
  const [etapasMapData, setEtapasMapData] = useState<Record<string, { evalObj: any; estudiantes: Estudiante[] }>>(
    initialCached?.etapasMapData || {}
  );
  const [masterRosterMap, setMasterRosterMap] = useState<Record<string, any>>(
    initialCached?.masterRosterMap || {}
  );

  useEffect(() => {
    if (cacheKey && evolucionModuleCache.has(cacheKey)) {
      const cached = evolucionModuleCache.get(cacheKey)!;
      setEtapasMapData(cached.etapasMapData);
      setMasterRosterMap(cached.masterRosterMap);
      setLoading(false);
    }
  }, [cacheKey]);

  // 1.1 Catálogo maestro de actuaciones pedagógicas de las preguntas de la evaluación
  const catalogoActuaciones: ActuacionCatalogoItem[] = useMemo(() => {
    let sourceList: any[] = [];
    if (preguntasRespuestas && preguntasRespuestas.length > 0) {
      sourceList = preguntasRespuestas;
    } else if (Array.isArray(evaluacion?.preguntasRespuestas)) {
      sourceList = evaluacion.preguntasRespuestas;
    } else if (Array.isArray((evaluacion as any)?.preguntas)) {
      sourceList = (evaluacion as any).preguntas;
    }

    if (sourceList.length === 0) {
      // Fallback a 20 actuaciones estándar si aún no cargan preguntas explícitas
      return Array.from({ length: 20 }, (_, i) => ({
        order: i + 1,
        actuacion: `Actuación Pedagógica ${i + 1}`,
        pregunta: `Pregunta N° ${i + 1}`,
      }));
    }

    return sourceList
      .map((p, idx) => ({
        order: p.order !== undefined ? Number(p.order) : idx + 1,
        actuacion:
          String(p.preguntaDocente || p.actuacion || '').trim() ||
          `Actuación Pedagógica ${p.order !== undefined ? p.order : idx + 1}`,
        pregunta:
          String(p.pregunta || '').trim() ||
          `Pregunta N° ${p.order !== undefined ? p.order : idx + 1}`,
        id: p.id,
        respuesta: p.respuesta,
      }))
      .sort((a, b) => a.order - b.order);
  }, [preguntasRespuestas, evaluacion]);

  // 2. Cargar datos de etapas y el padrón oficial del docente o director desde Firestore
  const fetchEtapasData = useCallback(async (forceRefresh = false) => {
    if (!evaluacion?.id || (!dniDocente && !dniDirector)) return;

    if (!forceRefresh && cacheKey && evolucionModuleCache.has(cacheKey)) {
      const cached = evolucionModuleCache.get(cacheKey)!;
      setEtapasMapData(cached.etapasMapData);
      setMasterRosterMap(cached.masterRosterMap);
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    const db = getFirestore();
    const resultEtapas: Record<string, { evalObj: any; estudiantes: Estudiante[] }> = {};
    const localMasterRoster: Record<string, any> = {};

    try {
      // 2.1 Cargar lista oficial de estudiantes registrados
      if (dniDocente) {
        try {
          const rosterColl = collection(db, 'usuarios', String(dniDocente), 'estudiantes-docentes');
          const rosterSnap = await getDocs(rosterColl);
          rosterSnap.forEach((d) => {
            const dat = d.data();
            const key = String(dat.dni || d.id || '').trim();
            if (key) {
              localMasterRoster[key] = { id: d.id, ...dat };
            }
          });
          setMasterRosterMap(localMasterRoster);
        } catch (errRoster) {
          console.warn('Advertencia al consultar estudiantes-docentes:', errRoster);
        }
      } else if (dniDirector) {
        // Para directores, construir el master roster a partir de los estudiantes de la I.E. en memoria
        currentEstudiantesRef.current.forEach((est: any) => {
          const key = String(est.dni || est.id || '').trim();
          if (key) {
            localMasterRoster[key] = { ...est };
          }
        });
        setMasterRosterMap(localMasterRoster);
      }

      // 2.2 Cargar las evaluaciones de cada etapa
      await Promise.all(
        etapasConfiguradas.map(async (etapa) => {
          // Si es la evaluación actual y ya tenemos los estudiantes en memoria
          const memStudents = currentEstudiantesRef.current;
          if (etapa.id === evaluacion.id && memStudents.length > 0) {
            const currentEvalWithQuestions = {
              ...evaluacion,
              preguntasRespuestas:
                preguntasRespuestas && preguntasRespuestas.length > 0
                  ? preguntasRespuestas
                  : evaluacion.preguntasRespuestas,
            };
            resultEtapas[etapa.key] = {
              evalObj: currentEvalWithQuestions,
              estudiantes: memStudents,
            };
            return;
          }

          // Buscar metadatos de la evaluación
          let targetEvalObj = evaluacionesDbRef.current.find((ev) => ev.id === etapa.id);
          if (!targetEvalObj) {
            try {
              const evalDocSnap = await getDoc(doc(db, 'evaluaciones', etapa.id));
              if (evalDocSnap.exists()) {
                targetEvalObj = { id: evalDocSnap.id, ...evalDocSnap.data() };
              }
            } catch (e) {
              console.error(`Error al recuperar evaluación ${etapa.id}:`, e);
            }
          }

          // Cargar banco de preguntas de la etapa (preguntasRespuestas) si no vienen embebidas
          let preguntasEtapa =
            etapa.id === evaluacion.id && preguntasRespuestas && preguntasRespuestas.length > 0
              ? preguntasRespuestas
              : targetEvalObj?.preguntasRespuestas || (targetEvalObj as any)?.preguntas;

          if (!preguntasEtapa || !Array.isArray(preguntasEtapa) || preguntasEtapa.length === 0) {
            try {
              const prColl = collection(db, 'evaluaciones', etapa.id, 'preguntasRespuestas');
              const prSnap = await getDocs(query(prColl, orderBy('order', 'asc')));
              if (!prSnap.empty) {
                const loadedP: any[] = [];
                prSnap.forEach((pDoc) => {
                  loadedP.push({ id: pDoc.id, ...pDoc.data() });
                });
                preguntasEtapa = loadedP;
              }
            } catch (errPr) {
              try {
                const prColl = collection(db, 'evaluaciones', etapa.id, 'preguntasRespuestas');
                const prSnap = await getDocs(prColl);
                if (!prSnap.empty) {
                  const loadedP: any[] = [];
                  prSnap.forEach((pDoc) => {
                    loadedP.push({ id: pDoc.id, ...pDoc.data() });
                  });
                  loadedP.sort((a, b) => (Number(a.order) || 0) - (Number(b.order) || 0));
                  preguntasEtapa = loadedP;
                }
              } catch (eFallback) {
                console.warn(`No se pudieron cargar preguntas de la etapa ${etapa.id}:`, eFallback);
              }
            }
          }

          const baseEval = targetEvalObj || (etapa.id === evaluacion.id ? evaluacion : null);
          if (preguntasEtapa && preguntasEtapa.length > 0) {
            targetEvalObj = {
              ...(baseEval || { id: etapa.id }),
              preguntasRespuestas: preguntasEtapa,
            };
          } else if (!targetEvalObj && etapa.id === evaluacion.id) {
            targetEvalObj = evaluacion;
          }

          const targetYear = targetEvalObj?.añoDelExamen || yearSelected || new Date().getFullYear();
          const targetMonth =
            targetEvalObj?.mesDelExamen !== undefined && targetEvalObj.mesDelExamen !== ''
              ? Number(targetEvalObj.mesDelExamen)
              : monthSelected;

          const coll = collection(
            db,
            `/evaluaciones/${etapa.id}/estudiantes-evaluados/${targetYear}/${targetMonth}`
          );

          let q = dniDirector
            ? query(coll, where('dniDirector', '==', String(dniDirector)))
            : query(coll, where('dniDocente', '==', String(dniDocente)));
          let snap = await getDocs(q);

          if (snap.empty) {
            if (dniDirector && !isNaN(Number(dniDirector))) {
              const snapNum = await getDocs(query(coll, where('dniDirector', '==', Number(dniDirector))));
              if (!snapNum.empty) snap = snapNum;
            } else if (dniDocente && !isNaN(Number(dniDocente))) {
              const snapNum = await getDocs(query(coll, where('dniDocente', '==', Number(dniDocente))));
              if (!snapNum.empty) snap = snapNum;
            }
          }

          const alumnos: Estudiante[] = [];
          snap.forEach((d) => {
            alumnos.push({ id: d.id, ...d.data() } as Estudiante);
          });

          resultEtapas[etapa.key] = {
            evalObj: targetEvalObj || evaluacion,
            estudiantes: alumnos,
          };
        })
      );

      setEtapasMapData(resultEtapas);
      if (cacheKey) {
        evolucionModuleCache.set(cacheKey, {
          etapasMapData: resultEtapas,
          masterRosterMap: localMasterRoster,
          timestamp: Date.now(),
        });
      }
    } catch (err: any) {
      console.error('Error al cargar datos evolutivos de etapas:', err);
      setError(err?.message || 'Error al sincronizar datos evolutivos');
    } finally {
      setLoading(false);
    }
  }, [evaluacion?.id, dniDocente, dniDirector, etapasIdsKey, yearSelected, monthSelected, cacheKey]);

  useEffect(() => {
    fetchEtapasData(false);
  }, [fetchEtapasData]);

  // 3. Procesar y unificar la lista de estudiantes por DNI
  const { estudiantesEvolutivos, kpis } = useMemo(() => {
    const studentMap = new Map<string, EstudianteEvolutivo>();

    // Roster maestro consolidado (estudiantes-docentes + currentEstudiantes en memoria)
    const combinedRosterMap = new Map<string, any>();
    Object.entries(masterRosterMap).forEach(([k, v]) => {
      combinedRosterMap.set(k, v);
    });
    (currentEstudiantes || []).forEach((e: any) => {
      const k = String(e.dni || e.id || '').trim();
      if (k) {
        combinedRosterMap.set(k, { ...combinedRosterMap.get(k), ...e });
      }
    });

    // Función robusta para resolver nombre del estudiante priorizando nombresApellidos
    const resolveStudentName = (alumno: any, dniKey: string) => {
      const fromRoster = combinedRosterMap.get(dniKey) || combinedRosterMap.get(String(Number(dniKey)));

      let rawName =
        alumno.nombresApellidos ||
        alumno.nombreCompleto ||
        (alumno.apellidos && alumno.nombres ? `${alumno.apellidos} ${alumno.nombres}` : '') ||
        alumno.nombres ||
        alumno.apellidos ||
        alumno.nombre ||
        alumno.name ||
        fromRoster?.nombresApellidos ||
        fromRoster?.nombreCompleto ||
        (fromRoster?.apellidos && fromRoster?.nombres ? `${fromRoster.apellidos} ${fromRoster.nombres}` : '') ||
        fromRoster?.nombres ||
        fromRoster?.nombre ||
        '';

      rawName = String(rawName || '').trim();

      let nombres = alumno.nombres || fromRoster?.nombres || '';
      let apellidos = alumno.apellidos || fromRoster?.apellidos || '';

      if (!rawName) {
        rawName = dniKey ? `Estudiante (${dniKey})` : 'Estudiante';
      }

      if (!nombres && !apellidos && rawName) {
        nombres = rawName;
      }

      return {
        nombreCompleto: rawName,
        nombres,
        apellidos,
      };
    };

    // Obtener color para un nivel dado
    const getColorForNivel = (nivelStr: string, evalObj?: any) => {
      const lower = (nivelStr || '').toLowerCase();
      if (evalObj?.nivelYPuntaje && Array.isArray(evalObj.nivelYPuntaje)) {
        const found = evalObj.nivelYPuntaje.find((np: any) =>
          (np.nivel || '').toLowerCase() === lower
        );
        if (found?.color) return found.color;
      }
      if (lower.includes('satisfactorio')) return '#10b981';
      if (lower.includes('proceso')) return '#f59e0b';
      if (lower.includes('previo')) return '#8b5cf6';
      if (lower.includes('inicio')) return '#ef4444';
      return '#64748b';
    };

    // Estimar nivel si no está explícito en el estudiante
    const getSafeNivel = (est: Estudiante, evalObj?: any) => {
      if (est.nivel && est.nivel !== 'sin clasificar') return est.nivel;
      const pts = Number(est.puntaje) || 0;
      if (evalObj?.nivelYPuntaje && Array.isArray(evalObj.nivelYPuntaje)) {
        const found = evalObj.nivelYPuntaje.find(
          (np: any) => pts >= (np.min || 0) && pts <= (np.max || 20)
        );
        if (found?.nivel) return found.nivel;
      }
      return 'Sin clasificar';
    };

    // Poblar mapa de estudiantes a través de todas las etapas disponibles
    etapasConfiguradas.forEach((etapa) => {
      const etapaData = etapasMapData[etapa.key];
      if (!etapaData) return;

      const evalObj = etapaData.evalObj;
      const alumnos = etapaData.estudiantes;

      alumnos.forEach((alumno: any) => {
        const dniKey = String(alumno.dni || alumno.id || '').trim();
        if (!dniKey) return;

        const fromRoster = combinedRosterMap.get(dniKey) || combinedRosterMap.get(String(Number(dniKey)));
        const nameData = resolveStudentName(alumno, dniKey);
        const seccionVal = String(alumno.seccion || fromRoster?.seccion || '');
        const generoVal = alumno.genero || fromRoster?.genero;
        const gradoVal = alumno.grado || fromRoster?.grado || evaluacion.grado;
        const fotoVal = fromRoster?.fotoUrl || fromRoster?.foto || alumno?.fotoUrl || alumno?.foto || undefined;

        let entry = studentMap.get(dniKey);
        if (!entry) {
          entry = {
            dni: dniKey,
            nombres: nameData.nombres,
            apellidos: nameData.apellidos,
            nombresApellidos: nameData.nombreCompleto,
            nombreCompleto: nameData.nombreCompleto,
            genero: generoVal,
            seccion: seccionVal,
            grado: gradoVal,
            dniDocente: String(alumno.dniDocente || fromRoster?.dniDocente || ''),
            fotoUrl: fotoVal,
            foto: fotoVal,
            etapas: {},
            historial: [],
            puntajeInicial: 0,
            puntajeFinal: 0,
            deltaPuntaje: 0,
            nivelInicial: '',
            nivelFinal: '',
            estadoTrayectoria: 'estable',
            porcentajeAsistencia: 0,
            diferenciaConAula: 0,
          };
          studentMap.set(dniKey, entry);
        } else {
          // Si el registro ya existía pero le faltaban nombres reales, enriquecerlo
          if (
            entry.nombreCompleto === 'Estudiante' ||
            entry.nombreCompleto.startsWith('Estudiante (')
          ) {
            if (
              nameData.nombreCompleto &&
              nameData.nombreCompleto !== 'Estudiante' &&
              !nameData.nombreCompleto.startsWith('Estudiante (')
            ) {
              entry.nombreCompleto = nameData.nombreCompleto;
              entry.nombresApellidos = nameData.nombreCompleto;
              entry.nombres = nameData.nombres;
              entry.apellidos = nameData.apellidos;
            }
          }
          if ((!entry.seccion || entry.seccion === '') && seccionVal) {
            entry.seccion = seccionVal;
          }
          if (!entry.dniDocente && (alumno.dniDocente || fromRoster?.dniDocente)) {
            entry.dniDocente = String(alumno.dniDocente || fromRoster?.dniDocente);
          }
          if (!entry.genero && generoVal) {
            entry.genero = generoVal;
          }
          if (!entry.fotoUrl && fotoVal) {
            entry.fotoUrl = fotoVal;
            entry.foto = fotoVal;
          }
        }

        const pts = Number(alumno.puntaje) || 0;

        // Max puntaje del nivel más alto configurado en la evaluación
        let maxP = 20;
        if (evalObj?.nivelYPuntaje && Array.isArray(evalObj.nivelYPuntaje) && evalObj.nivelYPuntaje.length > 0) {
          maxP = Math.max(...evalObj.nivelYPuntaje.map((np: any) => Number(np.max) || 20));
        } else if (evalObj?.puntajeMaximo && Number(evalObj.puntajeMaximo) > 0) {
          maxP = Number(evalObj.puntajeMaximo);
        } else if (pts > 20) {
          // Si el puntaje obtenido supera 20, inferir escala proporcional (ej. 100, 200, 500 o 900)
          if (pts > 800) maxP = 1000;
          else if (pts > 200) maxP = 900;
          else if (pts > 100) maxP = 200;
          else maxP = 100;
        }

        // Banco de preguntas de la evaluación para verificación de respuestas correctas
        const evalPreguntas: any[] =
          evalObj?.preguntasRespuestas || evalObj?.preguntas || [];
        const evalPreguntasSorted: any[] = Array.isArray(evalPreguntas)
          ? [...evalPreguntas].sort(
              (a: any, b: any) => (Number(a.order) || 0) - (Number(b.order) || 0)
            )
          : [];

        // Determinar total de preguntas de la etapa evaluativa
        let totalP = 20;
        if (alumno.totalPreguntas && Number(alumno.totalPreguntas) > 0) {
          totalP = Number(alumno.totalPreguntas);
        } else if (evalPreguntasSorted.length > 0) {
          totalP = evalPreguntasSorted.length;
        } else if (catalogoActuaciones.length > 0) {
          totalP = catalogoActuaciones.length;
        } else if (Array.isArray(alumno.respuestas) && alumno.respuestas.length > 0) {
          totalP = alumno.respuestas.length;
        } else if (alumno.respuestas && typeof alumno.respuestas === 'object') {
          const numKeys = Object.keys(alumno.respuestas).length;
          if (numKeys > 0) totalP = numKeys;
        }

        const ptsRatio = maxP > 0 ? Math.min(1, Math.max(0, pts / maxP)) : 0;
        const expectedFromScore = Math.round(ptsRatio * totalP);

        // Helper para resolver la alternativa marcada por el estudiante para una pregunta dada
        const obtenerRespuestaMarcada = (p: any, idx: number): string | undefined => {
          if (!alumno.respuestas) return undefined;

          if (Array.isArray(alumno.respuestas)) {
            const respItem =
              alumno.respuestas.find(
                (r: any) =>
                  (p.id && (r.id === p.id || r.idPregunta === p.id)) ||
                  (p.order !== undefined && r.order !== undefined && Number(r.order) === Number(p.order))
              ) || alumno.respuestas[idx];

            if (respItem) {
              if (respItem.alternativas && Array.isArray(respItem.alternativas)) {
                const sel = respItem.alternativas.find((a: any) => a.selected);
                if (sel?.alternativa) return String(sel.alternativa);
              }
              if (respItem.alternativaSeleccionada) return String(respItem.alternativaSeleccionada);
              if (respItem.alternativa) return String(respItem.alternativa);
              if (respItem.respuestaMarcada) return String(respItem.respuestaMarcada);
              if (respItem.respuesta && !p.respuesta) return String(respItem.respuesta);
            }
            return undefined;
          }

          if (typeof alumno.respuestas === 'object') {
            const map = alumno.respuestas as Record<string, any>;
            if (p.id && map[p.id] !== undefined) return String(map[p.id]);
            if (p.order !== undefined && map[String(p.order)] !== undefined) return String(map[String(p.order)]);
            if (map[String(idx + 1)] !== undefined) return String(map[String(idx + 1)]);
            if (map[String(idx)] !== undefined) return String(map[String(idx)]);
            return undefined;
          }

          return undefined;
        };

        // Evaluar las respuestas del estudiante contra las preguntas oficiales de ESTA etapa
        let aciertosEvaluados = 0;
        let preguntasCotejadas = 0;
        const aciertosPorPreguntaEtapa: boolean[] = [];

        if (evalPreguntasSorted.length > 0 && alumno.respuestas) {
          evalPreguntasSorted.forEach((p: any, idx: number) => {
            const marcada = obtenerRespuestaMarcada(p, idx);
            const respCorrecta = p.respuesta || p.respuestaCorrecta;

            if (marcada && respCorrecta) {
              preguntasCotejadas++;
              const cleanMarcada = String(marcada).toLowerCase().replace(/\s+/g, '');
              const cleanCorrecta = String(respCorrecta).toLowerCase().replace(/\s+/g, '');
              const esCorrecta = cleanMarcada === cleanCorrecta;
              aciertosPorPreguntaEtapa.push(esCorrecta);
              if (esCorrecta) aciertosEvaluados++;
            } else {
              aciertosPorPreguntaEtapa.push(false);
            }
          });
        }

        let correctas: number | undefined = undefined;

        // 1. Caso puntaje perfecto (100% de la evaluación)
        if (pts >= maxP && maxP > 0) {
          correctas = totalP;
        } else if (pts <= 0) {
          correctas = 0;
        } else if (preguntasCotejadas >= Math.min(totalP, evalPreguntasSorted.length) * 0.7) {
          // 2. Si se cotejó la gran mayoría de preguntas con las claves oficiales de esta evaluación
          const countRatio = totalP > 0 ? aciertosEvaluados / totalP : 0;
          if (Math.abs(countRatio - ptsRatio) <= 0.25 || maxP <= 20) {
            correctas = aciertosEvaluados;
          }
        }

        // 3. Si en el documento viene respuestasCorrectas numérico y es consistente con el puntaje
        if (
          correctas === undefined &&
          alumno.respuestasCorrectas !== undefined &&
          alumno.respuestasCorrectas !== null &&
          !isNaN(Number(alumno.respuestasCorrectas))
        ) {
          const rc = Number(alumno.respuestasCorrectas);
          const rcRatio = totalP > 0 ? rc / totalP : 0;
          if (Math.abs(rcRatio - ptsRatio) <= 0.25) {
            correctas = rc;
          }
        }

        // 4. Si aún no está definido o los valores cotejados eran incongruentes (ej. 7 aciertos con 200 pts)
        if (correctas === undefined) {
          correctas = expectedFromScore;
        }

        correctas = Math.max(0, Math.min(totalP, correctas));

        const porcentajeFinal =
          pts >= maxP && maxP > 0
            ? 100
            : totalP > 0
            ? Math.round((correctas / totalP) * 100)
            : 0;

        const nivel = getSafeNivel(alumno, evalObj);
        const color = getColorForNivel(nivel, evalObj);

        // 5. Mapear resultados binarios por actuación pedagógica: 2 = SÍ (acertó), 1 = NO (no acertó)
        const actuacionesResultados: Record<number, 1 | 2> = {};

        if (pts >= maxP && maxP > 0) {
          // Si el puntaje es perfecto, todas las actuaciones son SÍ (2)
          catalogoActuaciones.forEach((act) => {
            actuacionesResultados[act.order] = 2;
          });
        } else if (pts <= 0) {
          // Si el puntaje es 0, todas las actuaciones son NO (1)
          catalogoActuaciones.forEach((act) => {
            actuacionesResultados[act.order] = 1;
          });
        } else {
          let assignedCount = 0;

          // Si pudimos evaluar pregunta a pregunta con el banco oficial de esta etapa:
          if (evalPreguntasSorted.length > 0 && preguntasCotejadas >= evalPreguntasSorted.length * 0.5) {
            catalogoActuaciones.forEach((act, actIdx) => {
              // Buscar la pregunta correspondiente en esta etapa
              let targetIdx = act.id ? evalPreguntasSorted.findIndex((ep: any) => ep.id === act.id) : -1;
              if (targetIdx === -1) {
                targetIdx = evalPreguntasSorted.findIndex(
                  (ep: any) => ep.order !== undefined && Number(ep.order) === act.order
                );
              }
              if (targetIdx === -1 && actIdx < evalPreguntasSorted.length) {
                targetIdx = actIdx;
              }

              const acerto = targetIdx !== -1 ? !!aciertosPorPreguntaEtapa[targetIdx] : false;
              if (acerto) {
                actuacionesResultados[act.order] = 2;
                assignedCount++;
              } else {
                actuacionesResultados[act.order] = 1;
              }
            });
          }

          // Salvaguarda: si no se pudo asignar pregunta por pregunta o si la cantidad de aciertos asignados
          // discrepa severamente de los aciertos reales calculados por el puntaje (ej. 1 acierto asignado vs 13 reales):
          const discrepa =
            assignedCount === 0 ||
            (correctas > 2 && assignedCount < Math.floor(correctas * 0.6)) ||
            (correctas > 0 && Math.abs(assignedCount - correctas) > 4);

          if (discrepa && correctas > 0) {
            catalogoActuaciones.forEach((act, idx) => {
              actuacionesResultados[act.order] = idx < correctas ? 2 : 1;
            });
          }
        }

        const etapaRecord: EstudianteEtapaData = {
          etapaKey: etapa.key,
          label: etapa.label,
          nombreEvaluacion: evalObj?.nombre || etapa.label,
          evaluacionId: etapa.id,
          puntaje: pts,
          maxPuntaje: maxP,
          nivel,
          nivelColor: color,
          respuestasCorrectas: correctas,
          totalPreguntas: totalP,
          porcentaje: totalP > 0 ? Math.round((correctas / totalP) * 100) : 0,
          fecha: evalObj?.mesDelExamen ? getMonthName(Number(evalObj.mesDelExamen)) : undefined,
          respuestas: alumno.respuestas,
          actuacionesResultados,
        };

        entry.etapas[etapa.key] = etapaRecord;
      });
    });

    // 4. Calcular deltas, clasificar trayectoria y aplicar nombres realistas en modo demo
    const estudiantesList: EstudianteEvolutivo[] = Array.from(studentMap.values());
    const totalPosiblesEtapas = etapasConfiguradas.length || 1;

    let totalSumActual = 0;
    let countActual = 0;
    const sumsPorEtapa: Record<string, { sum: number; count: number }> = {};

    etapasConfiguradas.forEach((et) => {
      sumsPorEtapa[et.key] = { sum: 0, count: 0 };
    });

    estudiantesList.forEach((est, index) => {
      // Ordenar historial cronológico
      const hist: EstudianteEtapaData[] = [];
      etapasConfiguradas.forEach((et) => {
        if (est.etapas[et.key]) {
          hist.push(est.etapas[et.key]);
          sumsPorEtapa[et.key].sum += est.etapas[et.key].puntaje;
          sumsPorEtapa[et.key].count += 1;
        }
      });
      est.historial = hist;
      est.porcentajeAsistencia = Math.round((hist.length / totalPosiblesEtapas) * 100);

      if (hist.length > 0) {
        const first = hist[0];
        const last = hist[hist.length - 1];

        est.puntajeInicial = first.puntaje;
        est.puntajeFinal = last.puntaje;
        est.deltaPuntaje = Number((last.puntaje - first.puntaje).toFixed(1));
        est.nivelInicial = first.nivel;
        est.nivelFinal = last.nivel;

        totalSumActual += last.puntaje;
        countActual++;

        // Clasificación de trayectoria pedagógica
        const lowerFinal = (last.nivel || '').toLowerCase();
        const lowerInit = (first.nivel || '').toLowerCase();

        if (est.deltaPuntaje > 0 || (lowerInit.includes('inicio') && !lowerFinal.includes('inicio'))) {
          est.estadoTrayectoria = 'superacion';
        } else if (
          est.deltaPuntaje < 0 ||
          lowerFinal.includes('inicio') ||
          lowerFinal.includes('previo')
        ) {
          est.estadoTrayectoria = 'alerta';
        } else {
          est.estadoTrayectoria = 'estable';
        }
      }

      // Anonimización SOLO en Modo Demostración activo
      if (isDemoMode) {
        const fake = generateRealisticStudentName(est.dni, index, est.genero);
        est.nombres = fake.nombres;
        est.apellidos = fake.apellidos;
        est.nombresApellidos = `${fake.apellidos} ${fake.nombres}`;
        est.nombreCompleto = `${fake.apellidos} ${fake.nombres}`;
      }
    });

    // Promedio de aula para la última etapa evaluada
    const promedioAulaActual = countActual > 0 ? Number((totalSumActual / countActual).toFixed(2)) : 0;
    const promediosPorEtapa: Record<string, number> = {};
    const conteosPorEtapa: Record<string, number> = {};

    etapasConfiguradas.forEach((et) => {
      const item = sumsPorEtapa[et.key];
      promediosPorEtapa[et.key] = item.count > 0 ? Number((item.sum / item.count).toFixed(2)) : 0;
      conteosPorEtapa[et.key] = item.count;
    });

    let deltaPromedioAula = 0;
    // Considerar solo etapas que registren alumnos evaluados para evitar deltas negativos artificiales con etapas futuras sin rendir
    const etapasConEvaluaciones = etapasConfiguradas.filter(
      (et) => (conteosPorEtapa[et.key] ?? 0) > 0
    );
    if (etapasConEvaluaciones.length >= 2) {
      const firstKey = etapasConEvaluaciones[0].key;
      const lastKey = etapasConEvaluaciones[etapasConEvaluaciones.length - 1].key;
      deltaPromedioAula = Number((promediosPorEtapa[lastKey] - promediosPorEtapa[firstKey]).toFixed(2));
    } else if (etapasConfiguradas.length >= 2) {
      const firstKey = etapasConfiguradas[0].key;
      const lastKey = etapasConfiguradas[etapasConfiguradas.length - 1].key;
      deltaPromedioAula = Number((promediosPorEtapa[lastKey] - promediosPorEtapa[firstKey]).toFixed(2));
    }

    // Asignar diferencia con el aula a cada estudiante
    let totalSuperacion = 0;
    let totalEstable = 0;
    let totalAlerta = 0;

    estudiantesList.forEach((est) => {
      est.diferenciaConAula = Number((est.puntajeFinal - promedioAulaActual).toFixed(2));
      if (est.estadoTrayectoria === 'superacion') totalSuperacion++;
      else if (est.estadoTrayectoria === 'alerta') totalAlerta++;
      else totalEstable++;
    });

    // Ordenar inicialmente por nombreCompleto / nombresApellidos ascendente
    estudiantesList.sort((a, b) => a.nombreCompleto.localeCompare(b.nombreCompleto));

    const calculatedKpis: KpisEvolutivos = {
      totalEstudiantes: estudiantesList.length,
      totalSuperacion,
      totalEstable,
      totalAlerta,
      promedioAulaActual,
      deltaPromedioAula,
      promediosPorEtapa,
      conteosPorEtapa,
    };

    return {
      estudiantesEvolutivos: estudiantesList,
      kpis: calculatedKpis,
    };
  }, [etapasConfiguradas, etapasMapData, evaluacion, isDemoMode, masterRosterMap, currentEstudiantes, catalogoActuaciones]);

  return {
    estudiantesEvolutivos,
    etapasConfiguradas,
    catalogoActuaciones,
    kpis,
    loading,
    error,
    refetch: (force?: boolean | React.MouseEvent | unknown) => {
      const shouldForce = force === undefined || force === true || (typeof force === 'object' && force !== null);
      return fetchEtapasData(shouldForce);
    },
  };
};
