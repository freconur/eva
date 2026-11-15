import React, { useState, useEffect, useMemo, useCallback } from 'react';
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
import {
  MdTrendingUp,
  MdInfoOutline,
  MdLocationOn,
  MdKeyboardArrowDown,
  MdCompareArrows,
  MdCheckCircle,
  MdFilterList,
  MdCheckBox,
  MdCheckBoxOutlineBlank,
  MdShowChart,
  MdBarChart,
  MdZoomIn,
  MdOutlineLabel,
} from 'react-icons/md';
import { RiLoader4Line } from 'react-icons/ri';
import {
  getFirestore,
  collection,
  getDocs,
  doc,
  getDoc,
  query,
  where,
  limit,
} from 'firebase/firestore';
import { Evaluaciones } from '@/features/types/types';
import { useGlobalContext } from '@/features/context/GlolbalContext';
import { regiones, regionTexto } from '@/fuctions/regiones';
import { getCategoriasParaGrado } from '@/fuctions/categorias';
import { formatCategoriaLabel } from '@/components/reportes/director/DirectorCategoriaTabs';
import { useDirectorTabsConfig } from '@/components/reportes/director/useDirectorTabsConfig';
import { useEvaluacionesMatriz } from '@/components/reportes/director/useEvaluacionesMatriz';
import AcordeonGraficosTendencia from '@/components/reportes/AcordeonGraficosTendencia';

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

export interface EtapaUgelStats {
  promedio: number;
  totalEstudiantes: number;
  satisfactorio: number;
  proceso: number;
  inicio: number;
  previo: number;
  pctSatisfactorio: number;
  pctProceso: number;
  pctInicio: number;
  pctPrevio: number;
  hasData: boolean;
}

export interface EtapaDataBundle {
  global: EtapaUgelStats;
  byUgel: Record<number, EtapaUgelStats>;
}

export type EtapaKey = 'edi' | 'ep1' | 'ep2';

export interface AdminTendenciasTabProps {
  evaluacion?: Evaluaciones;
  evaluacionesDb?: Evaluaciones[];
  currentUserData?: any;
  yearSelected?: number;
  monthSelected?: number;
  initialUgel?: string | number;
  idEvaluacion?: string;
  isDirectView?: boolean;
  isAdmin?: boolean;
  onSelectEvaluacion?: (
    idEvaluacion: string,
    mesDelExamen?: number,
    grado?: number | string
  ) => void;
  onSelectGrado?: (grado: number | string) => void;
}

const DEFAULT_STATS: EtapaUgelStats = {
  promedio: 0,
  totalEstudiantes: 0,
  satisfactorio: 0,
  proceso: 0,
  inicio: 0,
  previo: 0,
  pctSatisfactorio: 0,
  pctProceso: 0,
  pctInicio: 0,
  pctPrevio: 0,
  hasData: false,
};

const cleanKey = (s: string) =>
  (s || '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .trim();

export const AdminTendenciasTab: React.FC<AdminTendenciasTabProps> = ({
  evaluacion,
  evaluacionesDb = [],
  currentUserData,
  yearSelected,
  monthSelected,
  initialUgel,
  idEvaluacion,
  isDirectView = false,
  isAdmin,
  onSelectEvaluacion,
  onSelectGrado,
}) => {
  const { categorias: contextCategorias } = useGlobalContext();

  const userRegion = currentUserData?.region ?? (currentUserData as any)?.perfil?.region;
  const isEspecialistaUgel = (isAdmin !== undefined ? !isAdmin : (currentUserData?.rol !== 4 && (currentUserData as any)?.perfil?.rol !== 4)) && Number(currentUserData?.rol ?? (currentUserData as any)?.perfil?.rol) === 1;

  // 1. Ámbito de consulta: 'all' (Toda la Región / Global) o ID numérico de UGEL (1 a 14)
  const [selectedUgelId, setSelectedUgelId] = useState<string | number>(() => {
    if (isEspecialistaUgel && userRegion) {
      return Number(userRegion);
    }
    if (initialUgel !== undefined && initialUgel !== null && initialUgel !== '' && initialUgel !== 'all') {
      const num = Number(initialUgel);
      if (!isNaN(num) && num > 0) return num;
    }
    return 'all';
  });

  // Sincronizar si cambia externamente el rol o initialUgel
  useEffect(() => {
    if (isEspecialistaUgel && userRegion) {
      setSelectedUgelId(Number(userRegion));
    } else if (initialUgel !== undefined && initialUgel !== null && initialUgel !== '') {
      if (initialUgel === 'all') {
        setSelectedUgelId('all');
      } else {
        const num = Number(initialUgel);
        if (!isNaN(num) && num > 0) setSelectedUgelId(num);
      }
    }
  }, [isEspecialistaUgel, userRegion, initialUgel]);

  // Nombre descriptivo del ámbito actual
  const currentUgelName = useMemo(() => {
    if (selectedUgelId === 'all') {
      return 'Toda la Región (Global - DRE Puno)';
    }
    return regionTexto(selectedUgelId) || `UGEL ${selectedUgelId}`;
  }, [selectedUgelId]);

  // 2. Métrica interactiva de niveles (% Porcentaje vs N° Alumnos)
  const [metricaNiveles, setMetricaNiveles] = useState<'pct' | 'cant'>('pct');

  // Controles switcheables para el gráfico de niveles:
  // 2.1 Tipo de gráfico: 'line' (Líneas) vs 'bar' (Barras agrupadas)
  const [tipoGraficoNiveles, setTipoGraficoNiveles] = useState<'line' | 'bar'>('line');
  // 2.2 Escala dinámica / Auto Zoom para amplificar diferencias mínimas
  const [escalaDinamicaNiveles, setEscalaDinamicaNiveles] = useState<boolean>(false);
  // 2.3 Cálculo y visualización de diferencias / deltas (Δ) en el tooltip
  const [mostrarDeltasTooltip, setMostrarDeltasTooltip] = useState<boolean>(true);
  // 2.4 Mostrar etiquetas con los valores siempre visibles sobre puntos y barras
  const [mostrarEtiquetasValores, setMostrarEtiquetasValores] = useState<boolean>(true);

  // 3. Selector interactivo de etapas a visualizar/comparar (EDI, EP1, EP2)
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

  // 4. Grado y Área Pedagógica de la evaluación
  const currentGrado =
    evaluacion?.grado !== undefined && evaluacion?.grado !== null
      ? Number(evaluacion.grado)
      : 2;

  const [selectedCategoriaId, setSelectedCategoriaId] = useState<number>(() => {
    if (evaluacion?.categoria !== undefined && evaluacion?.categoria !== null) {
      return Number(evaluacion.categoria);
    }
    return 1;
  });

  // Integración de la matriz curricular para identificar EDI, EP1, EP2
  const {
    matrizConfigGrados,
    loadingConfig,
  } = useEvaluacionesMatriz({
    grado: currentGrado,
    evaluacion,
    evaluacionesDb,
    selectedCategoriaId,
    onSelectEvaluacion,
  });

  // Detección de la categoría a partir de la evaluación o matriz
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

  useEffect(() => {
    if (evaluacionCategoriaId !== undefined && evaluacionCategoriaId !== null) {
      setSelectedCategoriaId(evaluacionCategoriaId);
    } else if (evaluacion?.categoria !== undefined && evaluacion?.categoria !== null) {
      setSelectedCategoriaId(Number(evaluacion.categoria));
    }
  }, [evaluacionCategoriaId, evaluacion?.categoria]);

  // Asignación de etapas para el grado y categoría activa
  const selectedCategoryAssignment =
    matrizConfigGrados[`${currentGrado}_${selectedCategoriaId}`] ||
    matrizConfigGrados[String(currentGrado)];

  const ediId: string | undefined = selectedCategoryAssignment?.ediId;
  const ep1Id: string | undefined = selectedCategoryAssignment?.ep1Id;
  const ep2Id: string | undefined = selectedCategoryAssignment?.ep2Id;

  // Detección inteligente: ¿Esta evaluación forma parte de la matriz longitudinal de etapas?
  const isEtapaConfigurada = useMemo(() => {
    if (!evaluacion?.id) return false;

    if (
      (ediId && evaluacion.id === ediId) ||
      (ep1Id && evaluacion.id === ep1Id) ||
      (ep2Id && evaluacion.id === ep2Id)
    ) {
      return true;
    }

    return Object.values(matrizConfigGrados).some((asgn: any) => {
      return Boolean(
        asgn &&
          (asgn.ediId === evaluacion.id ||
            asgn.ep1Id === evaluacion.id ||
            asgn.ep2Id === evaluacion.id)
      );
    });
  }, [evaluacion?.id, ediId, ep1Id, ep2Id, matrizConfigGrados]);

  // Identificador de la etapa de la evaluación actualmente abierta
  const currentEtapaKey = useMemo<EtapaKey | undefined>(() => {
    if (!evaluacion?.id) return undefined;
    if (evaluacion.id === ediId) return 'edi';
    if (evaluacion.id === ep1Id) return 'ep1';
    if (evaluacion.id === ep2Id) return 'ep2';
    return undefined;
  }, [evaluacion?.id, ediId, ep1Id, ep2Id]);

  // Título pedagógico del área (RADAMATE / RADALECTOR / Área X)
  const categoriasDisponibles = useMemo(() => {
    return getCategoriasParaGrado(currentGrado, contextCategorias, evaluacionesDb);
  }, [currentGrado, contextCategorias, evaluacionesDb]);

  const currentCategoryObj = categoriasDisponibles.find(
    (c) => Number(c.id) === selectedCategoriaId
  );
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
    ? customCatLabel?.toUpperCase() || 'RADAMATE'
    : customCatLabel?.toUpperCase() || 'RADALECTOR';

  // =========================================================================
  // CARGA Y AGREGACIÓN MULTI-NIVEL (GLOBAL Y POR UGEL) DE EDI, EP1, EP2
  // =========================================================================
  const [etapasCache, setEtapasCache] = useState<Record<string, EtapaDataBundle>>({});
  const [loadingEtapas, setLoadingEtapas] = useState<boolean>(false);

  // Helper para parsear los conteos de niveles en documentos
  const parseDocNiveles = useCallback((docData: any): Record<string, number> => {
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
  }, []);

  // Función de consulta y agregación por evaluación para todas las UGELs y Global
  const fetchSingleEvalBundle = useCallback(
    async (evalIdTarget: string): Promise<EtapaDataBundle> => {
      const db = getFirestore();
      const targetEval = (evaluacionesDb || []).find((e) => e.id === evalIdTarget);
      const targetYear = targetEval?.añoDelExamen
        ? Number(targetEval.añoDelExamen)
        : yearSelected || new Date().getFullYear();
      const targetMonth =
        targetEval?.mesDelExamen !== undefined && targetEval?.mesDelExamen !== ''
          ? Number(targetEval.mesDelExamen)
          : monthSelected ?? 0;

      const candidateMonths = Array.from(
        new Set(
          [targetMonth, monthSelected, 3, 4, 7, 8, 11, 12, 1, 2, 5, 6, 9, 10].filter(
            (v): v is number => v !== undefined && !isNaN(v) && v >= 1 && v <= 12
          )
        )
      );

      // 1. Cargar directores participantes
      const directoresList: any[] = [];
      try {
        const partSnap = await getDocs(
          collection(db, `evaluaciones/${evalIdTarget}/consolidados_realtime_directores`)
        );
        if (!partSnap.empty) {
          partSnap.forEach((docSnap) => {
            directoresList.push({ id: docSnap.id, ...docSnap.data() });
          });
        }
      } catch (e) {
        // no crítico
      }

      // 1.1 Si vino vacío, buscar con sufijo de año y mes
      if (directoresList.length === 0) {
        for (const testM of candidateMonths) {
          try {
            const snapYM = await getDocs(
              collection(db, `evaluaciones/${evalIdTarget}/consolidados_realtime_directores_${targetYear}_${testM}`)
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

      // 1.2 Fallback a consolidado JSON histórico
      if (directoresList.length === 0) {
        for (const testM of candidateMonths) {
          try {
            const consolidadoRef = doc(
              db,
              `evaluaciones/${evalIdTarget}/consolidados`,
              `directores_${targetYear}_${testM}`
            );
            const consolidadoSnap = await getDoc(consolidadoRef);
            if (consolidadoSnap.exists()) {
              const { url } = consolidadoSnap.data();
              if (url) {
                const response = await fetch(`${url}?t=${Date.now()}`);
                const res = await response.json();
                if (res?.success && Array.isArray(res?.data)) {
                  directoresList.push(...res.data);
                  break;
                }
              }
            }
          } catch (e) {
            // no crítico
          }
        }
      }

      // 2. Cargar consolidados oficiales de regiones
      const regionStatsMap = new Map<number, any>();
      for (const testM of candidateMonths) {
        try {
          const regSnap = await getDocs(
            collection(db, `evaluaciones/${evalIdTarget}/consolidados_realtime_regiones_${targetYear}_${testM}`)
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

      if (regionStatsMap.size === 0) {
        try {
          const regSnapPlain = await getDocs(
            collection(db, `evaluaciones/${evalIdTarget}/consolidados_realtime_regiones`)
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

      // 3. Estructurar estadísticas por UGEL (1 a 14)
      const byUgel: Record<number, EtapaUgelStats> = {};

      let sumTotalEstudiantesGlobal = 0;
      let sumPuntajesGlobal = 0;
      let sumSatGlobal = 0;
      let sumProcGlobal = 0;
      let sumIniGlobal = 0;
      let sumPrevGlobal = 0;

      regiones.forEach((reg) => {
        const ugelId = reg.id;
        const regSaved = regionStatsMap.get(ugelId);

        const dirsDeUgel = directoresList.filter((d) => {
          const r = d.region !== undefined && d.region !== null && d.region !== '' ? Number(d.region) : null;
          return r === ugelId;
        });

        let totalEstudiantesDirs = 0;
        let sumaPuntajesDirs = 0;
        let satDirs = 0;
        let procDirs = 0;
        let iniDirs = 0;
        let prevDirs = 0;

        dirsDeUgel.forEach((d) => {
          const t = Number(d.totalEstudiantes || 0);
          totalEstudiantesDirs += t;
          sumaPuntajesDirs +=
            d.sumaPuntajes !== undefined
              ? Number(d.sumaPuntajes || 0)
              : t * Number(d.promedioGlobal || d.puntajePromedio || 0);

          const parsed = parseDocNiveles(d);
          for (const [k, v] of Object.entries(parsed)) {
            if (k.includes('satisfactorio')) satDirs += v;
            else if (k.includes('proceso')) procDirs += v;
            else if (k.includes('previo')) prevDirs += v;
            else if (k.includes('inicio')) iniDirs += v;
          }
        });

        let totalEstudiantes =
          regSaved && regSaved.totalEstudiantes !== undefined && Number(regSaved.totalEstudiantes) > 0
            ? Number(regSaved.totalEstudiantes)
            : totalEstudiantesDirs;

        let sumaPuntajes =
          regSaved && regSaved.sumaPuntajes !== undefined && Number(regSaved.sumaPuntajes) > 0
            ? Number(regSaved.sumaPuntajes)
            : sumaPuntajesDirs;

        let sat = satDirs;
        let proc = procDirs;
        let ini = iniDirs;
        let prev = prevDirs;

        if (regSaved) {
          const parsedReg = parseDocNiveles(regSaved);
          const sumParsed = Object.values(parsedReg).reduce((a, b) => a + b, 0);
          if (sumParsed > 0) {
            sat = 0;
            proc = 0;
            ini = 0;
            prev = 0;
            for (const [k, v] of Object.entries(parsedReg)) {
              if (k.includes('satisfactorio')) sat += v;
              else if (k.includes('proceso')) proc += v;
              else if (k.includes('previo')) prev += v;
              else if (k.includes('inicio')) ini += v;
            }
          }
        }

        const avg = totalEstudiantes > 0 ? Number((sumaPuntajes / totalEstudiantes).toFixed(2)) : 0;
        const pctSat = totalEstudiantes > 0 ? Number(((sat / totalEstudiantes) * 100).toFixed(1)) : 0;
        const pctProc = totalEstudiantes > 0 ? Number(((proc / totalEstudiantes) * 100).toFixed(1)) : 0;
        const pctIni = totalEstudiantes > 0 ? Number(((ini / totalEstudiantes) * 100).toFixed(1)) : 0;
        const pctPrev = totalEstudiantes > 0 ? Number(((prev / totalEstudiantes) * 100).toFixed(1)) : 0;

        byUgel[ugelId] = {
          promedio: avg,
          totalEstudiantes,
          satisfactorio: sat,
          proceso: proc,
          inicio: ini,
          previo: prev,
          pctSatisfactorio: pctSat,
          pctProceso: pctProc,
          pctInicio: pctIni,
          pctPrevio: pctPrev,
          hasData: totalEstudiantes > 0,
        };

        sumTotalEstudiantesGlobal += totalEstudiantes;
        sumPuntajesGlobal += sumaPuntajes;
        sumSatGlobal += sat;
        sumProcGlobal += proc;
        sumIniGlobal += ini;
        sumPrevGlobal += prev;
      });

      const avgGlobal =
        sumTotalEstudiantesGlobal > 0
          ? Number((sumPuntajesGlobal / sumTotalEstudiantesGlobal).toFixed(2))
          : 0;

      const global: EtapaUgelStats = {
        promedio: avgGlobal,
        totalEstudiantes: sumTotalEstudiantesGlobal,
        satisfactorio: sumSatGlobal,
        proceso: sumProcGlobal,
        inicio: sumIniGlobal,
        previo: sumPrevGlobal,
        pctSatisfactorio:
          sumTotalEstudiantesGlobal > 0
            ? Number(((sumSatGlobal / sumTotalEstudiantesGlobal) * 100).toFixed(1))
            : 0,
        pctProceso:
          sumTotalEstudiantesGlobal > 0
            ? Number(((sumProcGlobal / sumTotalEstudiantesGlobal) * 100).toFixed(1))
            : 0,
        pctInicio:
          sumTotalEstudiantesGlobal > 0
            ? Number(((sumIniGlobal / sumTotalEstudiantesGlobal) * 100).toFixed(1))
            : 0,
        pctPrevio:
          sumTotalEstudiantesGlobal > 0
            ? Number(((sumPrevGlobal / sumTotalEstudiantesGlobal) * 100).toFixed(1))
            : 0,
        hasData: sumTotalEstudiantesGlobal > 0,
      };

      return { global, byUgel };
    },
    [evaluacionesDb, yearSelected, monthSelected, parseDocNiveles]
  );

  // Carga asíncrona de las 3 etapas (EDI, EP1, EP2)
  useEffect(() => {
    if (!isEtapaConfigurada) return;

    const idsParaConsultar = [ediId, ep1Id, ep2Id].filter(
      (id): id is string => !!id && !etapasCache[id]
    );

    if (idsParaConsultar.length === 0) return;

    let isMounted = true;
    const loadAll = async () => {
      setLoadingEtapas(true);
      const updates: Record<string, EtapaDataBundle> = {};

      for (const idTarget of idsParaConsultar) {
        try {
          const bundle = await fetchSingleEvalBundle(idTarget);
          if (isMounted) {
            updates[idTarget] = bundle;
          }
        } catch (err) {
          console.error(`Error al cargar datos longitudinales de etapa ${idTarget}:`, err);
        }
      }

      if (isMounted) {
        if (Object.keys(updates).length > 0) {
          setEtapasCache((prev) => ({ ...prev, ...updates }));
        }
        setLoadingEtapas(false);
      }
    };

    loadAll();

    return () => {
      isMounted = false;
    };
  }, [ediId, ep1Id, ep2Id, isEtapaConfigurada, etapasCache, fetchSingleEvalBundle]);

  // Lista estructurada de las 3 etapas según el ámbito seleccionado ('all' o ugelId)
  const etapasLista = useMemo(() => {
    const etapasDef: Array<{ key: 'edi' | 'ep1' | 'ep2'; label: string; id?: string }> = [
      { key: 'edi', label: 'EDI (Diagnóstica)', id: ediId },
      { key: 'ep1', label: 'EP1 (Progresiva 1)', id: ep1Id },
      { key: 'ep2', label: 'EP2 (Progresiva 2)', id: ep2Id },
    ];

    return etapasDef.map((def) => {
      const bundle = def.id ? etapasCache[def.id] : undefined;
      const data: EtapaUgelStats =
        bundle !== undefined
          ? selectedUgelId === 'all'
            ? bundle.global
            : bundle.byUgel[Number(selectedUgelId)] || DEFAULT_STATS
          : DEFAULT_STATS;

      const total = data.totalEstudiantes || 0;
      const sat = data.satisfactorio || 0;
      const proc = data.proceso || 0;
      const ini = data.inicio || 0;
      const prev = data.previo || 0;

      return {
        key: def.key,
        label: def.label,
        id: def.id,
        isConfigured: !!def.id,
        isCurrent: def.id === evaluacion?.id,
        hasData: Boolean(data.hasData),
        promedio: data.promedio || 0,
        totalEstudiantes: total,
        satisfactorio: sat,
        proceso: proc,
        inicio: ini,
        previo: prev,
        pctSatisfactorio: data.pctSatisfactorio,
        pctProceso: data.pctProceso,
        pctInicio: data.pctInicio,
        pctPrevio: data.pctPrevio,
      };
    });
  }, [ediId, ep1Id, ep2Id, etapasCache, evaluacion?.id, selectedUgelId]);

  // Lista filtrada según las etapas activas en el selector interactivo
  const etapasListaVisible = useMemo(() => {
    return etapasLista.filter((e) => selectedEtapas.includes(e.key));
  }, [etapasLista, selectedEtapas]);

  const hasAnyEtapaData = useMemo(() => {
    return etapasListaVisible.some((e) => e.hasData);
  }, [etapasListaVisible]);

  // Escala máxima dinámica para gráficos de promedio
  const maxScorePromedio = useMemo(() => {
    if (evaluacion?.nivelYPuntaje && Array.isArray(evaluacion.nivelYPuntaje) && evaluacion.nivelYPuntaje.length > 0) {
      const maxLevels = evaluacion.nivelYPuntaje
        .map((n) => Number(n.max) || 0)
        .filter((val) => val > 0);
      if (maxLevels.length > 0) {
        const topMax = Math.max(...maxLevels);
        if (topMax > 0) return topMax;
      }
    }

    const maxProm = Math.max(...etapasListaVisible.map((e) => e.promedio || 0), 0);
    if (maxProm > 0) {
      if (maxProm <= 20) return 20;
      if (maxProm <= 100) return 100;
      return Math.ceil((maxProm * 1.15) / 25) * 25;
    }

    return 20;
  }, [evaluacion?.nivelYPuntaje, etapasListaVisible]);

  // 1. DATASET: GRÁFICO DE BARRAS DE PROMEDIO
  const chartDataBarrasEtapas = useMemo(() => {
    return {
      labels: etapasListaVisible.map((e) => e.label),
      datasets: [
        {
          label: selectedUgelId === 'all' ? 'Promedio Global Regional' : `Promedio ${currentUgelName}`,
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
  }, [etapasListaVisible, selectedUgelId, currentUgelName]);

  // 2. DATASET: GRÁFICO LINEAL DE EVOLUCIÓN DEL PROMEDIO
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

  // 3. DATASET: GRÁFICO DE TENDENCIA DE NIVELES (Niveles en el Eje X, Etapas en Datasets)
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
                `Promedio: ${item.promedio} pts`,
                `Estudiantes evaluados: ${item.totalEstudiantes.toLocaleString('es-PE')}`,
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
              return `Promedio: ${item.promedio} pts (${item.totalEstudiantes.toLocaleString('es-PE')} estudiantes)`;
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
              return `Nivel de Logro: ${label}`;
            },
            label: (context: any) => {
              const isPct = metricaNiveles === 'pct';
              const datasetLabel = context.dataset?.label || '';
              const val = context.parsed.y;
              if (val === null || val === undefined) return `${datasetLabel}: Sin datos`;

              const baseText = isPct
                ? `${datasetLabel}: ${val}% de estudiantes`
                : `${datasetLabel}: ${Number(val).toLocaleString('es-PE')} estudiantes`;

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
          grid: { color: 'rgba(241, 245, 249, 0.8)' },
          title: {
            display: true,
            text: 'Niveles de Rendimiento (Eje X)',
            color: '#64748b',
            font: { size: 11 },
          },
        },
      },
    }),
    [metricaNiveles, yMaxNiveles, mostrarDeltasTooltip]
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
            // Cada barra tiene su propia posición horizontal independiente
            points.forEach((pt) => {
              const text = isPct ? `${pt.val}%` : Number(pt.val).toLocaleString('es-PE');
              const textWidth = ctx.measureText(text).width;
              const textY = Math.max(pt.y - 4, (chartArea?.top || 0) + 12);

              // Píldora de contraste blanca detrás del texto
              ctx.fillStyle = 'rgba(255, 255, 255, 0.9)';
              ctx.fillRect(pt.x - textWidth / 2 - 2, textY - 10, textWidth + 4, 12);

              ctx.fillStyle = pt.color;
              ctx.textBaseline = 'bottom';
              ctx.fillText(text, pt.x, textY);
            });
          } else {
            // En modo líneas, ordenar los puntos verticalmente para desfasar textos cercanos
            points.sort((a, b) => a.y - b.y);

            points.forEach((pt) => {
              const text = isPct ? `${pt.val}%` : Number(pt.val).toLocaleString('es-PE');
              const closeGroup = points.filter((other) => Math.abs(other.y - pt.y) < 16);

              let offsetY = -8;
              if (closeGroup.length > 1) {
                // Hay solapamiento vertical con al menos otro punto cercano
                const rankInGroup = closeGroup.findIndex((p) => p.datasetIndex === pt.datasetIndex);
                if (rankInGroup === 0) {
                  offsetY = -9; // El más alto va arriba del punto
                } else if (rankInGroup === 1) {
                  offsetY = 18; // El segundo va abajo del punto
                } else {
                  offsetY = -23; // El tercero va más arriba para no colisionar
                }
              }

              // Prevención de clipping contra los bordes superior e inferior
              let textY = pt.y + offsetY;
              if (chartArea) {
                if (textY - 10 < chartArea.top) {
                  textY = pt.y + 18;
                } else if (textY > chartArea.bottom) {
                  textY = pt.y - 9;
                }
              }

              const textWidth = ctx.measureText(text).width;

              // Fondo blanco de contraste para legibilidad sobre líneas cruzadas
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

            // Píldora de contraste blanca suave
            ctx.fillStyle = 'rgba(255, 255, 255, 0.9)';
            ctx.fillRect(pos.x - textWidth / 2 - 3, textY - 11, textWidth + 6, 13);

            // Color del texto según la etapa
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

  // Estado para acordeón complementario de comparativas libres
  const [mostrarComparadorLibre, setMostrarComparadorLibre] = useState<boolean>(false);

  return (
    <div className="space-y-6">
      {/* 1. SECCIÓN PRINCIPAL: TENDENCIA LONGITUDINAL POR ETAPAS */}
      {isEtapaConfigurada ? (
        <div className="bg-slate-50/60 rounded-2xl border border-slate-200/80 p-4 sm:p-6 shadow-2xs space-y-6">
          {/* Cabecera ergonómica del panel con selectores Global / UGEL y Métrica */}
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-4 border-b border-slate-200/70">
            {/* Lado izquierdo: Título y descripción */}
            <div className="flex items-start sm:items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-blue-50 border border-blue-200/80 flex items-center justify-center text-blue-600 shrink-0 mt-0.5 sm:mt-0 shadow-2xs">
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
                  Evolución del promedio {selectedUgelId === 'all' ? 'global regional' : `de UGEL ${currentUgelName}`} y distribución de niveles de logro a través de las evaluaciones diagnóstica y progresivas.
                </p>
              </div>
            </div>

            {/* Lado derecho: Selectores de Ámbito / UGEL y Métrica */}
            <div className="flex flex-col sm:flex-row sm:items-center gap-3">
              {/* Selector de Ámbito / UGEL */}
              <div className="flex items-center gap-1.5 bg-white rounded-lg border border-slate-200/90 px-2.5 py-1 text-xs shadow-2xs">
                <MdLocationOn className="w-4 h-4 text-blue-600 shrink-0" />
                <label htmlFor="admin-ugel-selector" className="text-[11px] font-bold text-slate-500 shrink-0 mr-1">
                  Ámbito:
                </label>
                <select
                  id="admin-ugel-selector"
                  value={selectedUgelId}
                  disabled={isEspecialistaUgel}
                  onChange={(e) => {
                    if (isEspecialistaUgel) return;
                    const val = e.target.value;
                    setSelectedUgelId(val === 'all' ? 'all' : Number(val));
                  }}
                  className={`bg-transparent font-semibold text-slate-800 border-none focus:outline-none focus:ring-0 text-xs py-0.5 pr-1 ${
                    isEspecialistaUgel ? 'cursor-not-allowed opacity-80' : 'cursor-pointer'
                  }`}
                  aria-label="Seleccionar ámbito de resultados (Global o UGEL específica)"
                >
                  {!isEspecialistaUgel && <option value="all">🌐 Toda la Región (Global - DRE Puno)</option>}
                  <optgroup label={isEspecialistaUgel ? "UGEL Asignada" : "UGELs de la Región Puno"}>
                    {regiones
                      .filter((reg) => !isEspecialistaUgel ? true : Number(reg.id) === Number(selectedUgelId))
                      .map((reg) => (
                        <option key={reg.id} value={reg.id}>
                          📍 UGEL {reg.region}
                        </option>
                      ))}
                  </optgroup>
                </select>
                {isEspecialistaUgel && (
                  <span className="ml-1 text-[10px] font-bold text-blue-600 bg-blue-50 px-1.5 py-0.5 rounded border border-blue-200/50">
                    Asignada
                  </span>
                )}
              </div>

              {/* Toggle % Porcentaje vs N° Estudiantes para el gráfico de niveles */}
              <div className="inline-flex items-center p-0.5 bg-white rounded-lg border border-slate-200/90 text-xs shadow-2xs self-start sm:self-auto">
                <button
                  type="button"
                  onClick={() => setMetricaNiveles('pct')}
                  className={`px-2.5 py-1 rounded-md font-semibold transition-all cursor-pointer ${
                    metricaNiveles === 'pct'
                      ? 'bg-blue-600 text-white shadow-2xs'
                      : 'text-slate-500 hover:text-slate-900'
                  }`}
                  title="Ver evolución en porcentajes (%)"
                  aria-pressed={metricaNiveles === 'pct'}
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
                  aria-pressed={metricaNiveles === 'cant'}
                >
                  N° Alumnos
                </button>
              </div>
            </div>
          </div>

          {/* Selector interactivo de etapas para comparar / filtrar */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 bg-white p-3 sm:p-3.5 rounded-xl border border-slate-200/90 shadow-2xs">
            <div className="flex items-center gap-2 flex-wrap">
              <div className="flex items-center gap-1.5 text-xs font-bold text-slate-700 mr-1 shrink-0">
                <MdFilterList className="w-4 h-4 text-blue-600" />
                <span>Etapas a visualizar:</span>
              </div>

              {etapasLista.map((etapa) => {
                const isSelected = selectedEtapas.includes(etapa.key);
                const isOnlyOne = selectedEtapas.length === 1 && isSelected;

                let activeClasses = 'bg-blue-600 text-white border-blue-600 shadow-2xs';
                let inactiveClasses = 'bg-slate-50 text-slate-600 border-slate-200/90 hover:bg-slate-100 hover:text-slate-800';

                if (etapa.key === 'ep1') {
                  activeClasses = 'bg-amber-500 text-white border-amber-500 shadow-2xs';
                } else if (etapa.key === 'ep2') {
                  activeClasses = 'bg-emerald-600 text-white border-emerald-600 shadow-2xs';
                }

                return (
                  <button
                    key={etapa.key}
                    type="button"
                    onClick={() => toggleEtapa(etapa.key)}
                    disabled={isOnlyOne}
                    className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all cursor-pointer ${
                      isSelected ? activeClasses : inactiveClasses
                    } ${isOnlyOne ? 'cursor-not-allowed opacity-90' : ''}`}
                    title={
                      isOnlyOne
                        ? 'Debe permanecer al menos 1 etapa seleccionada'
                        : isSelected
                        ? `Ocultar ${etapa.label}`
                        : `Mostrar ${etapa.label}`
                    }
                    aria-pressed={isSelected}
                  >
                    {isSelected ? (
                      <MdCheckBox className="w-4 h-4 shrink-0" />
                    ) : (
                      <MdCheckBoxOutlineBlank className="w-4 h-4 shrink-0 text-slate-400" />
                    )}
                    <span>{etapa.label}</span>
                    {etapa.isCurrent && (
                      <span
                        className={`text-[10px] font-bold px-1.5 py-0.2 rounded ${
                          isSelected
                            ? 'bg-white/20 text-white'
                            : 'bg-blue-50 text-blue-700 border border-blue-200/60'
                        }`}
                      >
                        Actual
                      </span>
                    )}
                  </button>
                );
              })}
            </div>

            {/* Accesos rápidos e indicador de modo */}
            <div className="flex items-center gap-2 text-xs shrink-0 self-end md:self-auto flex-wrap">
              <span className="text-[11px] font-medium text-slate-500 bg-slate-100 px-2.5 py-1 rounded-md">
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

          {/* Estado de Carga */}
          {loadingEtapas ? (
            <div className="flex flex-col items-center justify-center py-12 px-4 bg-white rounded-xl border border-dashed border-slate-200">
              <RiLoader4Line className="w-8 h-8 text-blue-600 animate-spin mb-2" />
              <p className="text-xs sm:text-sm font-semibold text-slate-700">
                Sincronizando consolidados de EDI, EP1 y EP2 para {currentUgelName}...
              </p>
              <p className="text-[11px] text-slate-400 mt-0.5">
                Procesando datos acumulados a nivel macro...
              </p>
            </div>
          ) : hasAnyEtapaData ? (
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

              {/* Fila 1: Promedio (Barra a la izquierda, Línea a la derecha) */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
                {/* Gráfico 1: Barras de Promedio EDI, EP1, EP2 */}
                <div className="bg-white rounded-xl border border-slate-200/80 p-4 shadow-2xs">
                  <div className="flex items-center justify-between pb-2 mb-3 border-b border-slate-100">
                    <div className="flex items-center gap-2">
                      <div className="w-2.5 h-4 bg-blue-600 rounded-xs" />
                      <h4 className="text-xs sm:text-sm font-bold text-slate-800">
                        Promedio {selectedUgelId === 'all' ? 'Global' : 'UGEL'} por Etapa (Barras)
                      </h4>
                    </div>
                    <span className="text-[11px] font-semibold text-slate-500">
                      Escala 0 a {maxScorePromedio} pts
                    </span>
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
                    <span className="text-[11px] font-semibold text-slate-500">
                      Escala 0 a {maxScorePromedio} pts
                    </span>
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

                  {/* Controles switcheables: [Líneas/Barras] [Auto Zoom] [Δ Deltas] */}
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
                Aún no se cuenta con registros de evaluaciones {selectedEtapas.map((k) => k.toUpperCase()).join(', ')} aplicadas para generar la curva longitudinal de {radarTitle} en {currentUgelName}. Los datos se actualizarán automáticamente conforme los directores rindan las pruebas.
              </span>
            </div>
          )}
        </div>
      ) : (
        /* Estado si la evaluación no está vinculada a una tríada en la matriz */
        <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-2xs space-y-4">
          <div className="flex items-start gap-3">
            <div className="w-9 h-9 rounded-xl bg-amber-50 border border-amber-200 text-amber-600 flex items-center justify-center shrink-0">
              <MdInfoOutline className="w-5 h-5" />
            </div>
            <div>
              <h4 className="text-sm font-bold text-slate-800">
                Evaluación fuera del flujo longitudinal de etapas
              </h4>
              <p className="text-xs text-slate-500 mt-0.5 leading-relaxed">
                Esta evaluación {(evaluacion?.nombre || '').toUpperCase()} no se encuentra mapeada en la tríada longitudinal (EDI, EP1, EP2) de la matriz curricular para su grado. Puedes utilizar el comparador libre a continuación para analizar su evolución histórica respecto a otras evaluaciones.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* 2. ACORDEÓN COMPLEMENTARIO: COMPARADOR HISTÓRICO LIBRE */}
      <div className="bg-white rounded-2xl border border-slate-200/90 shadow-2xs overflow-hidden">
        <button
          type="button"
          onClick={() => setMostrarComparadorLibre((prev) => !prev)}
          className="w-full flex items-center justify-between p-4 sm:p-5 text-left hover:bg-slate-50/80 transition-colors cursor-pointer"
          aria-expanded={mostrarComparadorLibre}
        >
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-indigo-50 text-indigo-600 border border-indigo-200/60 flex items-center justify-center shrink-0">
              <MdCompareArrows className="w-4 h-4" />
            </div>
            <div>
              <h4 className="text-xs sm:text-sm font-bold text-slate-800">
                Comparador Histórico Ad-Hoc
              </h4>
              <p className="text-[11px] text-slate-500">
                Compara libremente los resultados de esta evaluación con cualquier otra prueba registrada en el sistema.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold text-blue-600">
              {mostrarComparadorLibre ? 'Ocultar comparador' : 'Abrir comparador'}
            </span>
            <MdKeyboardArrowDown
              className={`w-5 h-5 text-slate-400 transition-transform duration-200 ${
                mostrarComparadorLibre ? 'rotate-180' : ''
              }`}
            />
          </div>
        </button>

        {mostrarComparadorLibre && evaluacion?.id && (
          <div className="p-4 sm:p-5 pt-0 border-t border-slate-100">
            <AcordeonGraficosTendencia
              idEvaluacion={evaluacion.id}
              isDirectView={isDirectView}
            />
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminTendenciasTab;
