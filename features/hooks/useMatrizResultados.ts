import { useState, useEffect, useCallback, useMemo } from 'react';
import { useRouter } from 'next/router';
import {
  collection,
  query,
  where,
  getDocs,
  doc,
  getDoc,
  setDoc,
  orderBy,
  limit,
} from 'firebase/firestore';
import { db } from '@/firebase/firebase.config';
import { Evaluaciones, PreguntasRespuestas, NivelYPuntaje } from '@/features/types/types';
import { useGlobalContext } from '@/features/context/GlolbalContext';
import { getCategoriasParaGrado } from '@/fuctions/categorias';
import { regiones } from '@/fuctions/regiones';
import { currentMonth, currentYear } from '@/fuctions/dates';
import { GradoConfigAssignment } from '@/components/modals/ConfigurarMatrizModal';

export interface NivelComparativoStat {
  id?: string;
  nivel: string;
  color: string;
  edi?: { cantidad: number; porcentaje: number };
  ep1?: { cantidad: number; porcentaje: number };
  ep2?: { cantidad: number; porcentaje: number };
}

export interface PreguntaComparativaStat {
  order: number;
  id?: string;
  enunciado?: string;
  edi?: { total: number; correctas: number; porcentaje: number };
  ep1?: { total: number; correctas: number; porcentaje: number };
  ep2?: { total: number; correctas: number; porcentaje: number };
}

export interface UgelMatrizComparativaRow {
  index: number;
  id: number;
  nombre: string;
  nombreCorto: string;
  totalEstudiantes: {
    edi?: number;
    ep1?: number;
    ep2?: number;
  };
  rc: {
    edi?: number;
    ep1?: number;
    ep2?: number;
  };
  puntaje: {
    edi?: number;
    ep1?: number;
    ep2?: number;
  };
  niveles: NivelComparativoStat[];
  preguntas: Record<number, PreguntaComparativaStat>;
}

export interface SingleEvalDataResult {
  evaluacion: Evaluaciones | null;
  preguntas: PreguntasRespuestas[];
  ugelDataMap: Map<
    number,
    {
      totalEstudiantes: number;
      sumaPuntajes: number;
      puntajePromedio: number;
      rcPromedio: number;
      niveles: Record<string, { cantidad: number; porcentaje: number }>;
      preguntas: Record<number, { total: number; correctas: number; porcentaje: number }>;
    }
  >;
}

const CONFIG_DOC_PATH = 'configuraciones';
const CONFIG_DOC_ID = 'matriz_resultados';

// =========================================================================
// CONTROL DE LIBERACIÓN TEMPORAL DE EVALUACIONES EDI (MARZO)
// =========================================================================
// Poner en false cuando se desee liberar EDI para todos los grados de primaria.
// Cuando está en true, EDI solo se muestra para 1° y 2° de primaria; 3° a 6° quedan ocultos/pendientes.
export const BLOQUEAR_EDI_3RO_A_6TO = true;

export const useMatrizResultados = () => {
  const router = useRouter();
  const { categorias: contextCategorias } = useGlobalContext();

  // Evaluaciones disponibles en el sistema (tipoDeEvaluacion === '1')
  const [evaluacionesDisponibles, setEvaluacionesDisponibles] = useState<Evaluaciones[]>([]);
  const [loadingEvaluaciones, setLoadingEvaluaciones] = useState<boolean>(true);

  // Configuración persistente por grado y categoría: { [`${gradoId}_${categoriaId}`]: { ediId, ep1Id, ep2Id } }
  const [configGrados, setConfigGrados] = useState<Record<string, GradoConfigAssignment>>({});
  const [loadingConfig, setLoadingConfig] = useState<boolean>(true);

  // Configuración efectiva: enmascara EDI para 3° a 6° de primaria si BLOQUEAR_EDI_3RO_A_6TO está activo
  const effectiveConfigGrados = useMemo(() => {
    if (!BLOQUEAR_EDI_3RO_A_6TO) return configGrados;

    const masked: Record<string, GradoConfigAssignment> = {};
    for (const [key, val] of Object.entries(configGrados)) {
      const gradoNum = Number(val.gradoId || key.split('_')[0]);
      if (gradoNum >= 3 && gradoNum <= 6) {
        masked[key] = {
          ...val,
          ediId: undefined,
        };
      } else {
        masked[key] = val;
      }
    }
    return masked;
  }, [configGrados]);

  // Grado seleccionado (por defecto 2do grado o el primero con configuración)
  const [selectedGrado, setSelectedGrado] = useState<number>(2);

  // Categoría seleccionada (por defecto 2 = Resuelve problemas / Matemática, o la primera del grado)
  const [selectedCategoria, setSelectedCategoria] = useState<number>(2);

  // Filtros de fecha generales (a partir de 2026 en adelante)
  const initialYear = Math.max(2026, currentYear);
  const [yearSelected, setYearSelected] = useState<number>(initialYear);
  const [monthSelected, setMonthSelected] = useState<number>(currentMonth);

  // Estado de cálculo y filas comparativas
  const [loadingMatriz, setLoadingMatriz] = useState<boolean>(false);
  const [matrizRows, setMatrizRows] = useState<UgelMatrizComparativaRow[]>([]);
  const [evaluacionEdi, setEvaluacionEdi] = useState<Evaluaciones | null>(null);
  const [evaluacionEp1, setEvaluacionEp1] = useState<Evaluaciones | null>(null);
  const [evaluacionEp2, setEvaluacionEp2] = useState<Evaluaciones | null>(null);
  const [preguntasUnificadas, setPreguntasUnificadas] = useState<PreguntasRespuestas[]>([]);

  // 1. Cargar evaluaciones de estudiantes
  useEffect(() => {
    const fetchEvaluaciones = async () => {
      setLoadingEvaluaciones(true);
      try {
        const evalsCol = collection(db, 'evaluaciones');
        const q = query(evalsCol, where('tipoDeEvaluacion', '==', '1'));
        const snap = await getDocs(q);

        const list: Evaluaciones[] = [];
        snap.forEach((d) => {
          list.push({ id: d.id, ...d.data() } as Evaluaciones);
        });

        // Ordenar por timestamp descendente
        list.sort((a: any, b: any) => {
          const dateA = a.timestamp?.seconds
            ? a.timestamp.seconds * 1000
            : a.timestamp
            ? new Date(a.timestamp).getTime()
            : 0;
          const dateB = b.timestamp?.seconds
            ? b.timestamp.seconds * 1000
            : b.timestamp
            ? new Date(b.timestamp).getTime()
            : 0;
          return dateB - dateA;
        });

        setEvaluacionesDisponibles(list);
      } catch (err) {
        console.error('Error al cargar evaluaciones:', err);
      } finally {
        setLoadingEvaluaciones(false);
      }
    };

    fetchEvaluaciones();
  }, []);

  // 2. Cargar configuración persistida desde Firestore
  useEffect(() => {
    const fetchConfig = async () => {
      setLoadingConfig(true);
      try {
        const cfgRef = doc(db, CONFIG_DOC_PATH, CONFIG_DOC_ID);
        const snap = await getDoc(cfgRef);
        if (snap.exists()) {
          const data = snap.data();
          if (data && data.grados) {
            setConfigGrados(data.grados);

            const urlGrado = router.query.grado ? Number(router.query.grado) : null;
            const urlCat = router.query.categoria ? Number(router.query.categoria) : null;

            let resolvedGrado = selectedGrado;
            if (urlGrado) {
              resolvedGrado = urlGrado;
              setSelectedGrado(urlGrado);
            } else {
              const configuredKeys = Object.keys(data.grados);
              if (configuredKeys.length > 0) {
                const firstKey = configuredKeys[0];
                const gId = Number(firstKey.split('_')[0]);
                if (!isNaN(gId)) {
                  resolvedGrado = gId;
                  setSelectedGrado(gId);
                }
              }
            }

            if (urlCat) {
              setSelectedCategoria(urlCat);
            } else {
              // Si hay una categoría configurada para el grado resuelto, preseleccionarla
              const matchingKey = Object.keys(data.grados).find((k) =>
                k.startsWith(`${resolvedGrado}_`)
              );
              if (matchingKey) {
                const cId = Number(matchingKey.split('_')[1]);
                if (!isNaN(cId)) {
                  setSelectedCategoria(cId);
                }
              }
            }
          }
        }
      } catch (err) {
        console.error('Error al cargar configuración de matriz:', err);
      } finally {
        setLoadingConfig(false);
      }
    };

    fetchConfig();
  }, []);

  // Sincronizar URL si cambian los queries grado o categoria
  useEffect(() => {
    const urlGrado = router.query.grado ? Number(router.query.grado) : null;
    if (urlGrado && urlGrado !== selectedGrado) {
      setSelectedGrado(urlGrado);
    }
    const urlCat = router.query.categoria ? Number(router.query.categoria) : null;
    if (urlCat && urlCat !== selectedCategoria) {
      setSelectedCategoria(urlCat);
    }
  }, [router.query.grado, router.query.categoria]);

  // Cambiar grado y actualizar URL
  const handleSelectGrado = useCallback(
    (grado: number) => {
      setSelectedGrado(grado);
      const availableCats = getCategoriasParaGrado(grado, contextCategorias, evaluacionesDisponibles);
      let nextCat = selectedCategoria;
      if (!availableCats.some((c) => Number(c.id) === Number(selectedCategoria))) {
        nextCat = availableCats.length > 0 ? Number(availableCats[0].id) : 1;
        setSelectedCategoria(nextCat);
      }
      router.push(
        {
          pathname: router.pathname,
          query: { ...router.query, grado, categoria: nextCat },
        },
        undefined,
        { shallow: true }
      );
    },
    [router, selectedCategoria, contextCategorias, evaluacionesDisponibles]
  );

  // Cambiar categoría y actualizar URL
  const handleSelectCategoria = useCallback(
    (categoria: number) => {
      setSelectedCategoria(categoria);
      router.push(
        {
          pathname: router.pathname,
          query: { ...router.query, grado: selectedGrado, categoria },
        },
        undefined,
        { shallow: true }
      );
    },
    [router, selectedGrado]
  );

  // Guardar configuración para un grado y categoría en Firestore
  const saveGradoConfig = async (
    gradoId: number,
    categoriaId: number,
    newConfig: GradoConfigAssignment
  ) => {
    try {
      const cfgRef = doc(db, CONFIG_DOC_PATH, CONFIG_DOC_ID);
      const key = `${gradoId}_${categoriaId}`;

      // Limpiar campos undefined para evitar error en Firestore SDK
      const cleanAssignment: GradoConfigAssignment = {
        gradoId,
        categoriaId,
        updatedAt: newConfig.updatedAt || new Date().toISOString(),
      };
      if (newConfig.ediId && newConfig.ediId.trim()) {
        cleanAssignment.ediId = newConfig.ediId.trim();
      } else if (BLOQUEAR_EDI_3RO_A_6TO && gradoId >= 3 && gradoId <= 6) {
        // Preservar el ediId real de Firestore si se guarda mientras el bloqueo está activo
        const originalEdi = configGrados[key]?.ediId;
        if (originalEdi) cleanAssignment.ediId = originalEdi;
      }
      if (newConfig.ep1Id && newConfig.ep1Id.trim()) {
        cleanAssignment.ep1Id = newConfig.ep1Id.trim();
      }
      if (newConfig.ep2Id && newConfig.ep2Id.trim()) {
        cleanAssignment.ep2Id = newConfig.ep2Id.trim();
      }

      const updatedGrados = {
        ...configGrados,
        [key]: cleanAssignment,
      };
      await setDoc(cfgRef, { grados: updatedGrados }, { merge: true });
      setConfigGrados(updatedGrados);
    } catch (err) {
      console.error('Error al guardar configuración de grado y categoría:', err);
      throw err;
    }
  };

  // 3. Helper para obtener los datos de una evaluación individual
  const fetchSingleEvalData = async (
    evalId?: string,
    defaultYear: number = currentYear,
    defaultMonth: number = currentMonth
  ): Promise<SingleEvalDataResult> => {
    if (!evalId) {
      return { evaluacion: null, preguntas: [], ugelDataMap: new Map() };
    }

    try {
      // Obtener evaluación
      const evalDocRef = doc(db, 'evaluaciones', evalId);
      const evalSnap = await getDoc(evalDocRef);
      if (!evalSnap.exists()) {
        return { evaluacion: null, preguntas: [], ugelDataMap: new Map() };
      }
      const evaluacion = { id: evalSnap.id, ...evalSnap.data() } as Evaluaciones;

      // Obtener preguntas
      const qCol = collection(db, `evaluaciones/${evalId}/preguntasRespuestas`);
      const qQuery = query(qCol, orderBy('order', 'asc'));
      const qSnap = await getDocs(qQuery);
      const preguntas: PreguntasRespuestas[] = [];
      qSnap.forEach((d) => preguntas.push({ id: d.id, ...d.data() } as PreguntasRespuestas));
      preguntas.sort((a, b) => Number(a.order ?? 0) - Number(b.order ?? 0));

      // Determinar periodo
      const y = Number(evaluacion.añoDelExamen) || defaultYear;
      const m = Number(evaluacion.mesDelExamen) || defaultMonth;

      // Meses candidatos para buscar consolidados (prioriza mes de la evaluación y mes del selector)
      const candidateMonths = Array.from(
        new Set(
          [
            m,
            defaultMonth,
            Number(evaluacion.mesDelExamen),
            7, 8, 3, 4, 11, 12, 5, 6, 9, 10, 1, 2,
          ].filter((v): v is number => v !== undefined && !isNaN(v) && v >= 1 && v <= 12)
        )
      );

      // 1. Cargar directores desde subcolección de la evaluación
      let directoresList: any[] = [];

      // A) Subcolección consolidados_realtime_directores
      try {
        const qParticipantes = collection(db, `evaluaciones/${evalId}/consolidados_realtime_directores`);
        const partSnap = await getDocs(qParticipantes);
        if (!partSnap.empty) {
          partSnap.forEach((docSnap) => {
            directoresList.push({ id: docSnap.id, ...docSnap.data() });
          });
        }
      } catch (e) {
        // no crítico
      }

      // B) Si está vacío, intentar colecciones con sufijo de año y mes
      if (directoresList.length === 0) {
        for (const testM of candidateMonths) {
          try {
            const snapYM = await getDocs(
              collection(db, `evaluaciones/${evalId}/consolidados_realtime_directores_${y}_${testM}`)
            );
            if (!snapYM.empty) {
              snapYM.forEach((docSnap) => {
                directoresList.push({ id: docSnap.id, ...docSnap.data() });
              });
              break;
            }
          } catch (e) {
            // continuar
          }
        }
      }

      // C) Si sigue vacío, buscar en consolidados en Storage
      if (directoresList.length === 0) {
        for (const testM of candidateMonths) {
          try {
            const consolidadoRef = doc(db, `evaluaciones/${evalId}/consolidados`, `directores_${y}_${testM}`);
            const consolidadoSnap = await getDoc(consolidadoRef);
            if (consolidadoSnap.exists()) {
              const { url } = consolidadoSnap.data();
              if (url) {
                const cacheBuster = `?t=${Date.now()}`;
                const response = await fetch(url + cacheBuster);
                const res = await response.json();
                if (res.success && Array.isArray(res.data)) {
                  directoresList = res.data;
                  break;
                }
              }
            }
          } catch (e) {
            // no crítico
          }
        }
      }

      // 2. Cargar consolidados oficiales de regiones desde la subcolección de la evaluación
      const regionStatsMap = new Map<number, any>();
      for (const testM of candidateMonths) {
        try {
          const regSnap = await getDocs(
            collection(db, `evaluaciones/${evalId}/consolidados_realtime_regiones_${y}_${testM}`)
          );
          if (!regSnap.empty) {
            regSnap.forEach((d) => {
              const data = d.data();
              const rId = data.region !== undefined && data.region !== null ? Number(data.region) : Number(d.id);
              if (!isNaN(rId)) {
                regionStatsMap.set(rId, data);
              }
            });
            break;
          }
        } catch (e) {
          // continuar
        }
      }

      // Si no se encontró por mes, intentar sin sufijo de mes
      if (regionStatsMap.size === 0) {
        try {
          const regSnapPlain = await getDocs(
            collection(db, `evaluaciones/${evalId}/consolidados_realtime_regiones`)
          );
          regSnapPlain.forEach((d) => {
            const data = d.data();
            const rId = data.region !== undefined && data.region !== null ? Number(data.region) : Number(d.id);
            if (!isNaN(rId)) {
              regionStatsMap.set(rId, data);
            }
          });
        } catch (e) {
          // no crítico
        }
      }

      // 3. Resolver directores sin región buscando en estudiantes-evaluados
      const directoresSinRegion = directoresList.filter((d) => {
        const r = d.region;
        return r === undefined || r === null || r === '' || r === 'N/A' || isNaN(Number(r));
      });

      if (directoresSinRegion.length > 0) {
        for (const testM of candidateMonths) {
          const studentsPath = `evaluaciones/${evalId}/estudiantes-evaluados/${y}/${testM}`;
          await Promise.all(
            directoresSinRegion.map(async (d) => {
              if (d.region !== undefined && d.region !== null && d.region !== '' && !isNaN(Number(d.region))) return;
              const idDir = String(d.id || d.idDirector || d.dniDirector || '');
              if (!idDir) return;
              try {
                const qDir = query(
                  collection(db, studentsPath),
                  where('dniDirector', '==', idDir),
                  limit(1)
                );
                const sSnap = await getDocs(qDir);
                if (!sSnap.empty) {
                  const sData = sSnap.docs[0].data();
                  if (sData && sData.region !== undefined && sData.region !== null && sData.region !== '') {
                    d.region = Number(sData.region);
                  }
                }
              } catch (err) {
                // no crítico
              }
            })
          );
        }
      }

      // Helper para normalizar llaves de niveles
      const cleanKey = (s: string) =>
        (s || '').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').trim();

      const nivelesConfig = evaluacion.nivelYPuntaje || [];

      const parseDocNiveles = (docData: any) => {
        const res: Record<string, number> = {};
        if (!docData) return res;
        if (docData.niveles && typeof docData.niveles === 'object') {
          if (Array.isArray(docData.niveles)) {
            docData.niveles.forEach((item: any) => {
              if (item && item.nivel) {
                const k = cleanKey(String(item.nivel));
                res[k] = (res[k] || 0) + Number(item.cantidadDeEstudiantes || 0);
              }
            });
          } else {
            for (const [k, v] of Object.entries(docData.niveles)) {
              res[cleanKey(k)] = typeof v === 'number' ? v : Number(v || 0);
            }
          }
        }
        for (const [k, v] of Object.entries(docData)) {
          if (k.startsWith('niveles.')) {
            const levelName = cleanKey(k.substring(8));
            res[levelName] = (res[levelName] || 0) + (typeof v === 'number' ? v : Number(v || 0));
          }
        }
        return res;
      };

      // Mapear por cada UGEL (1 a 14)
      const ugelDataMap = new Map<number, any>();

      regiones.forEach((reg) => {
        const ugelId = reg.id;
        const regSaved = regionStatsMap.get(ugelId);

        const dirsDeUgel = directoresList.filter((d) => {
          const r = d.region !== undefined && d.region !== null && d.region !== '' ? Number(d.region) : null;
          return r === ugelId;
        });

        let totalEstudiantesDirs = 0;
        let sumaPuntajesDirs = 0;

        dirsDeUgel.forEach((d) => {
          totalEstudiantesDirs += Number(d.totalEstudiantes || 0);
          sumaPuntajesDirs +=
            d.sumaPuntajes !== undefined
              ? Number(d.sumaPuntajes || 0)
              : Number(d.totalEstudiantes || 0) * Number(d.puntajePromedio || 0);
        });

        const totalEstudiantes =
          regSaved && regSaved.totalEstudiantes !== undefined && Number(regSaved.totalEstudiantes) > 0
            ? Number(regSaved.totalEstudiantes)
            : totalEstudiantesDirs;

        const sumaPuntajes =
          regSaved && regSaved.sumaPuntajes !== undefined && Number(regSaved.sumaPuntajes) > 0
            ? Number(regSaved.sumaPuntajes)
            : sumaPuntajesDirs;

        const puntajePromedio =
          totalEstudiantes > 0
            ? Number((sumaPuntajes / totalEstudiantes).toFixed(1))
            : regSaved && regSaved.puntajePromedio
            ? Number(regSaved.puntajePromedio)
            : 0;

        // Niveles
        const ugelNivelesMap: Record<string, number> = {};
        nivelesConfig.forEach((nc) => {
          ugelNivelesMap[cleanKey(nc.nivel || '')] = 0;
        });

        let sumNivelesReg = 0;
        if (regSaved) {
          const parsedReg = parseDocNiveles(regSaved);
          sumNivelesReg = Object.values(parsedReg).reduce((a, b) => a + b, 0);
          if (sumNivelesReg > 0) {
            for (const [k, val] of Object.entries(parsedReg)) {
              const match = nivelesConfig.find((nc) => {
                const name = cleanKey(nc.nivel || '');
                return name === k || name.includes(k) || k.includes(name);
              });
              const targetKey = match ? cleanKey(match.nivel || '') : k;
              ugelNivelesMap[targetKey] = val;
            }
          }
        }

        if (sumNivelesReg === 0) {
          dirsDeUgel.forEach((d) => {
            const parsed = parseDocNiveles(d);
            for (const [k, val] of Object.entries(parsed)) {
              const match = nivelesConfig.find((nc) => {
                const name = cleanKey(nc.nivel || '');
                return name === k || name.includes(k) || k.includes(name);
              });
              const targetKey = match ? cleanKey(match.nivel || '') : k;
              ugelNivelesMap[targetKey] = (ugelNivelesMap[targetKey] || 0) + val;
            }
          });
        }

        const nivelesRes: Record<string, { cantidad: number; porcentaje: number }> = {};
        nivelesConfig.forEach((nc) => {
          const key = cleanKey(nc.nivel || '');
          const cant = ugelNivelesMap[key] || 0;
          const pct = totalEstudiantes > 0 ? Math.round((cant / totalEstudiantes) * 100) : 0;
          nivelesRes[key] = { cantidad: cant, porcentaje: pct };
        });

        // Preguntas
        const preguntasStats: Record<number, { total: number; correctas: number; porcentaje: number }> = {};
        let sumaRespuestasCorrectas = 0;

        preguntas.forEach((p, pIdx) => {
          const pos = pIdx + 1;
          const posStr = String(pos);
          const orderNum = p.order !== undefined ? Number(p.order) : pos;
          const orderStr = String(orderNum);
          const idStr = p.id ? String(p.id) : '';
          const correctKey = ((p as any).respuestaCorrecta || p.respuesta || 'A').toUpperCase().trim();

          let totalRespondieronQ = 0;
          let correctasQ = 0;

          dirsDeUgel.forEach((d) => {
            const getVal = (path: string) => {
              if (d[path] !== undefined && d[path] !== null) return Number(d[path]);
              const parts = path.split('.');
              if (parts.length === 3 && parts[0] === 'preguntas') {
                const qKey = parts[1];
                const subKey = parts[2];
                if (d.preguntas && d.preguntas[qKey] && d.preguntas[qKey][subKey] !== undefined) {
                  return Number(d.preguntas[qKey][subKey]);
                }
              }
              return 0;
            };

            const totQ =
              getVal(`preguntas.${orderStr}.total`) ||
              getVal(`preguntas.${posStr}.total`) ||
              (idStr ? getVal(`preguntas.${idStr}.total`) : 0);
            totalRespondieronQ += totQ;

            const corrQ =
              getVal(`preguntas.${orderStr}.${correctKey}`) ||
              getVal(`preguntas.${orderStr}.${correctKey.toLowerCase()}`) ||
              getVal(`preguntas.${posStr}.${correctKey}`) ||
              getVal(`preguntas.${posStr}.${correctKey.toLowerCase()}`) ||
              (idStr
                ? getVal(`preguntas.${idStr}.${correctKey}`) || getVal(`preguntas.${idStr}.${correctKey.toLowerCase()}`)
                : 0);
            correctasQ += corrQ;
          });

          const pct = totalRespondieronQ > 0 ? Math.round((correctasQ / totalRespondieronQ) * 100) : 0;
          preguntasStats[pos] = {
            total: totalRespondieronQ,
            correctas: correctasQ,
            porcentaje: pct,
          };
          sumaRespuestasCorrectas += correctasQ;
        });

        const rcPromedio =
          totalEstudiantes > 0
            ? Number((sumaRespuestasCorrectas / totalEstudiantes).toFixed(1))
            : regSaved && regSaved.rcPromedio
            ? Number(regSaved.rcPromedio)
            : 0;

        ugelDataMap.set(ugelId, {
          totalEstudiantes,
          sumaPuntajes,
          puntajePromedio,
          rcPromedio,
          niveles: nivelesRes,
          preguntas: preguntasStats,
        });
      });

      return { evaluacion, preguntas, ugelDataMap };
    } catch (error) {
      console.error(`Error al procesar evaluación ${evalId}:`, error);
      return { evaluacion: null, preguntas: [], ugelDataMap: new Map() };
    }
  };

  // 4. Calcular la matriz comparativa multi-evaluación (EDI, EP1, EP2)
  const computeComparativeMatrix = useCallback(async () => {
    setLoadingMatriz(true);
    try {
      const cfgKey = `${selectedGrado}_${selectedCategoria}`;
      const cfg = effectiveConfigGrados[cfgKey] || effectiveConfigGrados[String(selectedGrado)] || {};
      const { ediId, ep1Id, ep2Id } = cfg;

      // Cargar en paralelo las 3 evaluaciones asignadas
      const [resEdi, resEp1, resEp2] = await Promise.all([
        fetchSingleEvalData(ediId, yearSelected),
        fetchSingleEvalData(ep1Id, yearSelected),
        fetchSingleEvalData(ep2Id, yearSelected),
      ]);

      setEvaluacionEdi(resEdi.evaluacion);
      setEvaluacionEp1(resEp1.evaluacion);
      setEvaluacionEp2(resEp2.evaluacion);

      // Unificar preguntas de las evaluaciones activas (secuencialmente por posición)
      const maxQuestions = Math.max(
        resEdi.preguntas.length,
        resEp1.preguntas.length,
        resEp2.preguntas.length
      );
      const positions = Array.from({ length: maxQuestions }, (_, i) => i + 1);

      const unifiedPreguntas: PreguntasRespuestas[] = positions.map((pos) => {
        const idx = pos - 1;
        const ediP = resEdi.preguntas[idx];
        const ep1P = resEp1.preguntas[idx];
        const ep2P = resEp2.preguntas[idx];

        const base = ediP || ep1P || ep2P || { order: pos };

        return {
          ...base,
          order: pos,
          preguntaDocente:
            ediP?.preguntaDocente ||
            ep1P?.preguntaDocente ||
            ep2P?.preguntaDocente ||
            base.preguntaDocente ||
            '',
          pregunta:
            ediP?.pregunta ||
            ep1P?.pregunta ||
            ep2P?.pregunta ||
            base.pregunta ||
            '',
          ediPregunta: ediP,
          ep1Pregunta: ep1P,
          ep2Pregunta: ep2P,
        } as any;
      });

      setPreguntasUnificadas(unifiedPreguntas);

      // Niveles de referencia (tomar de la primera evaluación que los tenga definidos o por defecto)
      const nivelesConfig: NivelYPuntaje[] =
        resEp2.evaluacion?.nivelYPuntaje ||
        resEp1.evaluacion?.nivelYPuntaje ||
        resEdi.evaluacion?.nivelYPuntaje || [
          { nivel: 'Satisfactorio', color: '#9bbb58' },
          { nivel: 'En proceso', color: '#f89646' },
          { nivel: 'En inicio', color: '#a64e4d' },
          { nivel: 'Previo al inicio', color: '#a5a5a5' },
        ];

      const cleanKey = (s: string) =>
        (s || '').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').trim();

      // Construir filas comparativas para las 14 UGELs
      const rows: UgelMatrizComparativaRow[] = regiones.map((reg, index) => {
        const ugelId = reg.id;
        const dataEdi = resEdi.ugelDataMap.get(ugelId);
        const dataEp1 = resEp1.ugelDataMap.get(ugelId);
        const dataEp2 = resEp2.ugelDataMap.get(ugelId);

        // R.C
        const rc = {
          edi: dataEdi?.rcPromedio,
          ep1: dataEp1?.rcPromedio,
          ep2: dataEp2?.rcPromedio,
        };

        // Puntaje Promedio
        const puntaje = {
          edi: dataEdi?.puntajePromedio,
          ep1: dataEp1?.puntajePromedio,
          ep2: dataEp2?.puntajePromedio,
        };

        // Total Estudiantes
        const totalEstudiantes = {
          edi: dataEdi?.totalEstudiantes,
          ep1: dataEp1?.totalEstudiantes,
          ep2: dataEp2?.totalEstudiantes,
        };

        // Niveles comparativos
        const niveles: NivelComparativoStat[] = nivelesConfig.map((nc) => {
          const k = cleanKey(nc.nivel || '');
          return {
            id: nc.id ? String(nc.id) : undefined,
            nivel: nc.nivel || 'Sin Nombre',
            color: nc.color || '#94a3b8',
            edi: dataEdi?.niveles?.[k],
            ep1: dataEp1?.niveles?.[k],
            ep2: dataEp2?.niveles?.[k],
          };
        });

        // Preguntas comparativas
        const preguntasRow: Record<number, PreguntaComparativaStat> = {};
        unifiedPreguntas.forEach((p, pIdx) => {
          const order = p.order !== undefined ? Number(p.order) : pIdx + 1;
          preguntasRow[order] = {
            order,
            id: p.id,
            enunciado: p.pregunta,
            edi: dataEdi?.preguntas?.[order],
            ep1: dataEp1?.preguntas?.[order],
            ep2: dataEp2?.preguntas?.[order],
          };
        });

        return {
          index: index + 1,
          id: ugelId,
          nombre: reg.region,
          nombreCorto: (reg as any).nombreCorto || reg.region,
          totalEstudiantes,
          rc,
          puntaje,
          niveles,
          preguntas: preguntasRow,
        };
      });

      setMatrizRows(rows);
    } catch (err) {
      console.error('Error al calcular matriz comparativa:', err);
    } finally {
      setLoadingMatriz(false);
    }
  }, [effectiveConfigGrados, selectedGrado, selectedCategoria, yearSelected]);

  // Recalcular al cambiar el grado seleccionado o la configuración
  useEffect(() => {
    computeComparativeMatrix();
  }, [computeComparativeMatrix]);

  return {
    evaluacionesDisponibles,
    loadingEvaluaciones,
    configGrados: effectiveConfigGrados,
    loadingConfig,
    selectedGrado,
    setSelectedGrado: handleSelectGrado,
    selectedCategoria,
    setSelectedCategoria: handleSelectCategoria,
    yearSelected,
    setYearSelected,
    monthSelected,
    setMonthSelected,
    matrizRows,
    loadingMatriz,
    evaluacionEdi,
    evaluacionEp1,
    evaluacionEp2,
    preguntasUnificadas,
    saveGradoConfig,
    reloadMatriz: computeComparativeMatrix,
  };
};

export default useMatrizResultados;
