import React, { useState, useMemo, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import {
  MdPrint,
  MdDownload,
  MdSchool,
  MdGroups,
  MdTrendingUp,
  MdTrendingDown,
  MdTrendingFlat,
  MdCheckCircle,
  MdWarning,
  MdSearch,
  MdFullscreen,
  MdClose,
  MdKeyboardArrowDown,
  MdPerson,
  MdRestartAlt,
  MdSplitscreen,
  MdRotateRight,
  MdCompareArrows,
  MdTimeline,
  MdTableChart,
  MdViewModule,
  MdChevronLeft,
  MdChevronRight,
  MdPeople,
  MdLayers,
  MdInfoOutline,
  MdOpenInNew,
} from 'react-icons/md';
import { RiLoader4Line, RiUser3Line } from 'react-icons/ri';
import { TbChartRadar } from 'react-icons/tb';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler,
  RadialLinearScale,
  RadarController,
} from 'chart.js';
import { Radar, Line } from 'react-chartjs-2';
import { Evaluaciones, Estudiante, PreguntasRespuestas } from '@/features/types/types';
import { converSeccion, getGradoTexto } from '@/fuctions/regiones';
import {
  useDocenteEvolucionEstudiantes,
  EstudianteEvolutivo,
} from '@/components/reportes/estudiante/useDocenteEvolucionEstudiantes';
import {
  DocenteActuacionesRadarChart,
  DocenteRadarControls,
  loadStoredCardAdjustments,
  saveStoredTextScale,
} from '@/components/reportes/estudiante/DocenteActuacionesRadarChart';
import { searchAndRankStudents } from '@/components/reportes/estudiante/searchEstudiantesUtils';
import type { EstudianteEvolutivoPDFProps } from '@/features/utils/exportarFichaEvolutivaEstudiantePDF';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler,
  RadialLinearScale,
  RadarController
);

const ETAPA_PALETTE: Record<string, { bg: string; border: string; text: string; lightBg: string }> = {
  edi: {
    bg: 'rgba(59, 130, 246, 0.22)',
    border: '#2563eb',
    text: 'text-blue-700',
    lightBg: 'bg-blue-50 border-blue-200/80',
  },
  ep1: {
    bg: 'rgba(245, 158, 11, 0.22)',
    border: '#d97706',
    text: 'text-amber-700',
    lightBg: 'bg-amber-50 border-amber-200/80',
  },
  ep2: {
    bg: 'rgba(16, 185, 129, 0.22)',
    border: '#059669',
    text: 'text-emerald-700',
    lightBg: 'bg-emerald-50 border-emerald-200/80',
  },
  actual: {
    bg: 'rgba(99, 102, 241, 0.22)',
    border: '#4f46e5',
    text: 'text-indigo-700',
    lightBg: 'bg-indigo-50 border-indigo-200/80',
  },
};

const SECTION_COLORS = [
  '#2563eb', // Azul
  '#059669', // Esmeralda
  '#d97706', // Ámbar
  '#7c3aed', // Violeta
  '#db2777', // Rosa
  '#0891b2', // Cian
  '#ea580c', // Naranja
];

const SECTION_BG_COLORS = [
  'rgba(37, 99, 235, 0.15)',
  'rgba(5, 150, 105, 0.15)',
  'rgba(217, 119, 6, 0.15)',
  'rgba(124, 58, 237, 0.15)',
  'rgba(219, 39, 119, 0.15)',
  'rgba(8, 145, 178, 0.15)',
  'rgba(234, 88, 12, 0.15)',
];

export interface SeccionEtapaDetalle {
  etapaKey: string;
  etapaLabel: string;
  totalParticipantes: number;
  promedioPuntaje: number;
  promedioPorcentaje: number;
  promedioCorrectas: number;
  maxPuntaje: number;
  tasaLogroPorActuacion: Record<number, number>; // order -> % (0 - 100)
}

export interface SeccionDetalleAnalytics {
  id: string;
  label: string;
  docenteNombre: string;
  totalEstudiantes: number;
  etapas: Record<string, SeccionEtapaDetalle>;
  deltaPuntaje: number;
  deltaPorcentaje: number;
}

export interface DirectorEvolucionEstudiantesTabProps {
  evaluacion: Evaluaciones;
  matrizConfigGrados?: Record<string, any>;
  evaluacionesDb?: any[];
  dniDirector: string | number;
  nombreDirector?: string;
  nombreColegio?: string;
  currentEstudiantes: Estudiante[];
  yearSelected: number | string;
  monthSelected: number;
  isDemoMode?: boolean;
  availableSections?: { id: string | number; name: string }[];
  docentesMap?: Map<string, string>;
  docentesDeDirectores?: any[];
  preguntasRespuestas?: PreguntasRespuestas[];
}

export const DirectorEvolucionEstudiantesTab: React.FC<DirectorEvolucionEstudiantesTabProps> = ({
  evaluacion,
  matrizConfigGrados = {},
  evaluacionesDb = [],
  dniDirector,
  nombreDirector = 'Director(a)',
  nombreColegio = 'Institución Educativa',
  currentEstudiantes = [],
  yearSelected,
  monthSelected,
  isDemoMode = false,
  availableSections = [],
  docentesMap = new Map(),
  docentesDeDirectores = [],
  preguntasRespuestas = [],
}) => {
  // Hook evolutivo extendido con soporte para consultas globales del Director por dniDirector
  const {
    estudiantesEvolutivos,
    etapasConfiguradas,
    catalogoActuaciones = [],
    kpis,
    loading,
    error,
    refetch,
  } = useDocenteEvolucionEstudiantes({
    evaluacion,
    matrizConfigGrados,
    evaluacionesDb,
    dniDirector,
    currentEstudiantes,
    yearSelected,
    monthSelected,
    isDemoMode,
    preguntasRespuestas,
  });

  // Filtros de navegación
  const [selectedSeccion, setSelectedSeccion] = useState<string>(''); // '' = Todos los salones

  // Formato de visualización del Nivel 1: Matriz Compacta (por defecto) vs Tarjetas
  const [nivel1ViewFormat, setNivel1ViewFormat] = useState<'matriz' | 'tarjetas'>('matriz');

  // Resuelve el nivel de logro y color para un puntaje dado según la configuración oficial de la evaluación
  const resolveNivelBadge = (puntaje: number, evalObj?: any) => {
    const niveles =
      evalObj?.nivelYPuntaje ||
      evaluacion?.nivelYPuntaje ||
      [];

    if (Array.isArray(niveles) && niveles.length > 0) {
      const found = niveles.find(
        (np: any) => puntaje >= (Number(np.min) || 0) && puntaje <= (Number(np.max) || 20)
      );
      if (found?.nivel || found?.nombre) {
        const nombre = String(found.nivel || found.nombre);
        const color = found.color || '#3b82f6';
        return { nombre, color };
      }
    }

    // Escala regional / ECE (ej. 500 puntos):
    if (puntaje > 100) {
      if (puntaje >= 550) return { nombre: 'Satisfactorio', color: '#10b981' };
      if (puntaje >= 480) return { nombre: 'En Proceso', color: '#f59e0b' };
      if (puntaje >= 400) return { nombre: 'En Inicio', color: '#ef4444' };
      return { nombre: 'Previo al Inicio', color: '#8b5cf6' };
    }

    // Escala estándar de 0 a 20:
    if (puntaje >= 18) return { nombre: 'Destacado', color: '#10b981' };
    if (puntaje >= 14) return { nombre: 'Satisfactorio', color: '#059669' };
    if (puntaje >= 11) return { nombre: 'En Proceso', color: '#f59e0b' };
    return { nombre: 'En Inicio', color: '#ef4444' };
  };

  // Etapa seleccionada para la comparativa transversal entre secciones
  const [comparativaEtapaKey, setComparativaEtapaKey] = useState<string>(() => {
    return etapasConfiguradas[etapasConfiguradas.length - 1]?.key || 'actual';
  });

  useEffect(() => {
    if (etapasConfiguradas.length > 0 && !etapasConfiguradas.some((e) => e.key === comparativaEtapaKey)) {
      setComparativaEtapaKey(etapasConfiguradas[etapasConfiguradas.length - 1].key);
    }
  }, [etapasConfiguradas, comparativaEtapaKey]);

  // Secciones activas para la comparativa en el Radar (por defecto solo las primeras 3 para no saturar)
  const [activeCompareSections, setActiveCompareSections] = useState<Record<string, boolean>>({});
  const [showIeBenchmark, setShowIeBenchmark] = useState<boolean>(true);

  // Estado para el Buscador Centralizado Spotlight tipo Command Palette (Ctrl + K)
  const [isSpotlightOpen, setIsSpotlightOpen] = useState<boolean>(false);
  const [spotlightQuery, setSpotlightQuery] = useState<string>('');
  const [spotlightScopeOverride, setSpotlightScopeOverride] = useState<'seccion' | 'todos'>('seccion');

  // Estado de montaje del componente en cliente (para createPortal)
  const [mounted, setMounted] = useState<boolean>(false);
  useEffect(() => {
    setMounted(true);
  }, []);

  // Modos de visualización del Gráfico Radar Individual
  const [radarLayoutMode, setRadarLayoutMode] = useState<'columnas' | 'flotante'>('flotante');
  const [radarSplitInTwo, setRadarSplitInTwo] = useState<boolean>(false);
  const [radarOrderDirection, setRadarOrderDirection] = useState<'horario' | 'antihorario'>('horario');
  const [radarTextScale, setRadarTextScale] = useState<number>(1);
  const [activeStages, setActiveStages] = useState<Record<string, boolean>>({
    edi: true,
    ep1: true,
    ep2: true,
  });

  // Alternar capa evaluativa (EDI, EP1, EP2)
  const toggleStage = (stageKey: string) => {
    setActiveStages((prev) => ({
      ...prev,
      [stageKey]: !(prev[stageKey] ?? true),
    }));
  };

  // Visor modal en pantalla completa (Modo Salón vs Modo Estudiante)
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [modalSeccionId, setModalSeccionId] = useState<string>('');
  const [modalViewMode, setModalViewMode] = useState<'seccion' | 'estudiante'>('seccion');
  const [modalVisualMode, setModalVisualMode] = useState<'radar' | 'line'>('radar');
  const [modalShowRadarTable, setModalShowRadarTable] = useState<boolean>(false);
  const [modalStudentDni, setModalStudentDni] = useState<string | null>(null);

  // Estados de exportación e impresión
  const [exportingDni, setExportingDni] = useState<string | null>(null);
  const [isExportingAll, setIsExportingAll] = useState<boolean>(false);
  const [printingDni, setPrintingDni] = useState<string | null>(null);
  const [isPrintingAll, setIsPrintingAll] = useState<boolean>(false);

  // Menús desplegables del modal
  const [isModalExportDropdownOpen, setIsModalExportDropdownOpen] = useState<boolean>(false);
  const [isModalPrintDropdownOpen, setIsModalPrintDropdownOpen] = useState<boolean>(false);

  const modalExportDropdownRef = useRef<HTMLDivElement>(null);
  const modalPrintDropdownRef = useRef<HTMLDivElement>(null);

  // Cerrar menús al hacer clic afuera
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      const target = e.target as Node;
      if (modalExportDropdownRef.current && !modalExportDropdownRef.current.contains(target)) {
        setIsModalExportDropdownOpen(false);
      }
      if (modalPrintDropdownRef.current && !modalPrintDropdownRef.current.contains(target)) {
        setIsModalPrintDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // 1. Agrupación y Estadísticas Globales por Salón / Sección
  const seccionesResumen = useMemo(() => {
    const map = new Map<
      string,
      {
        id: string;
        label: string;
        docenteNombre: string;
        docenteDni: string;
        estudiantes: EstudianteEvolutivo[];
        total: number;
        totalSuperacion: number;
        totalEstable: number;
        totalAlerta: number;
        promedioActual: number;
        promedioInicial: number;
        delta: number;
      }
    >();

    estudiantesEvolutivos.forEach((est) => {
      const secKey = String(est.seccion || 'sin_seccion').trim();
      let secItem = map.get(secKey);
      if (!secItem) {
        let secLabel = 'Sección no esp.';
        if (secKey !== 'sin_seccion') {
          const numSec = Number(secKey);
          secLabel = `Sección ${converSeccion(numSec) || secKey}`;
        }

        // Buscar nombre del docente a cargo de esta sección
        let docNombre = 'Docente asignado';
        const docDni = est.dniDocente || '';
        if (docDni && docentesMap.has(docDni)) {
          docNombre = docentesMap.get(docDni)!;
        } else if (docDni) {
          const foundDoc = docentesDeDirectores.find((d: any) => String(d.dni) === docDni);
          if (foundDoc) {
            docNombre = `${foundDoc.nombres || ''} ${foundDoc.apellidos || ''}`.trim() || docNombre;
          }
        }

        secItem = {
          id: secKey,
          label: secLabel,
          docenteNombre: docNombre,
          docenteDni: docDni,
          estudiantes: [],
          total: 0,
          totalSuperacion: 0,
          totalEstable: 0,
          totalAlerta: 0,
          promedioActual: 0,
          promedioInicial: 0,
          delta: 0,
        };
        map.set(secKey, secItem);
      }

      secItem.estudiantes.push(est);
      secItem.total += 1;
      if (est.estadoTrayectoria === 'superacion') secItem.totalSuperacion += 1;
      else if (est.estadoTrayectoria === 'estable') secItem.totalEstable += 1;
      else if (est.estadoTrayectoria === 'alerta') secItem.totalAlerta += 1;
    });

    // Calcular promedios consolidados por salón
    const list = Array.from(map.values()).map((sec) => {
      const sumFinal = sec.estudiantes.reduce((acc, e) => acc + (e.puntajeFinal || 0), 0);
      const sumInit = sec.estudiantes.reduce((acc, e) => acc + (e.puntajeInicial || 0), 0);
      const avgFinal = sec.total > 0 ? Number((sumFinal / sec.total).toFixed(1)) : 0;
      const avgInit = sec.total > 0 ? Number((sumInit / sec.total).toFixed(1)) : 0;
      return {
        ...sec,
        promedioActual: avgFinal,
        promedioInicial: avgInit,
        delta: Number((avgFinal - avgInit).toFixed(1)),
      };
    });

    return list.sort((a, b) => a.label.localeCompare(b.label));
  }, [estudiantesEvolutivos, docentesMap, docentesDeDirectores]);

  // Inicializar seleccionando únicamente las primeras 3 secciones para el radar
  useEffect(() => {
    if (seccionesResumen.length > 0) {
      setActiveCompareSections((prev) => {
        if (Object.keys(prev).length > 0) return prev;
        const initial: Record<string, boolean> = {};
        seccionesResumen.forEach((sec, idx) => {
          initial[sec.id] = idx < 3;
        });
        return initial;
      });
    }
  }, [seccionesResumen]);

  const toggleCompareSection = (secId: string) => {
    setActiveCompareSections((prev) => ({
      ...prev,
      [secId]: !(prev[secId] ?? false),
    }));
  };

  const handleSelectFirstThree = () => {
    const updated: Record<string, boolean> = {};
    seccionesResumen.forEach((sec, idx) => {
      updated[sec.id] = idx < 3;
    });
    setActiveCompareSections(updated);
  };

  const handleSelectAllSections = () => {
    const updated: Record<string, boolean> = {};
    seccionesResumen.forEach((sec) => {
      updated[sec.id] = true;
    });
    setActiveCompareSections(updated);
  };

  const handleClearAllSections = () => {
    const updated: Record<string, boolean> = {};
    seccionesResumen.forEach((sec) => {
      updated[sec.id] = false;
    });
    setActiveCompareSections(updated);
  };

  // 1.1 Análisis Longitudinal y Medias por Sección en cada Evaluación
  const seccionEtapasMetricasMap = useMemo(() => {
    const result: Record<string, SeccionDetalleAnalytics> = {};

    const procesarGrupo = (
      id: string,
      label: string,
      docenteNombre: string,
      estudiantesGrupo: EstudianteEvolutivo[]
    ): SeccionDetalleAnalytics => {
      const etapasObj: Record<string, SeccionEtapaDetalle> = {};

      etapasConfiguradas.forEach((etapa) => {
        const alumnosConEtapa = estudiantesGrupo.filter(
          (e) => e.etapas && e.etapas[etapa.key] && (e.etapas[etapa.key].puntaje !== undefined || e.etapas[etapa.key].porcentaje !== undefined)
        );
        const count = alumnosConEtapa.length;
        const sumPts = alumnosConEtapa.reduce((acc, e) => acc + (e.etapas[etapa.key]?.puntaje || 0), 0);
        const sumPct = alumnosConEtapa.reduce((acc, e) => acc + (e.etapas[etapa.key]?.porcentaje || 0), 0);
        const sumCorr = alumnosConEtapa.reduce((acc, e) => acc + (e.etapas[etapa.key]?.respuestasCorrectas || 0), 0);
        const maxP = alumnosConEtapa[0]?.etapas?.[etapa.key]?.maxPuntaje || 20;

        const tasaLogro: Record<number, number> = {};
        catalogoActuaciones.forEach((act) => {
          if (count === 0) {
            tasaLogro[act.order] = 0;
            return;
          }
          const acertaron = alumnosConEtapa.filter(
            (e) => e.etapas[etapa.key]?.actuacionesResultados?.[act.order] === 2
          ).length;
          tasaLogro[act.order] = Number(((acertaron / count) * 100).toFixed(1));
        });

        etapasObj[etapa.key] = {
          etapaKey: etapa.key,
          etapaLabel: etapa.label,
          totalParticipantes: count,
          promedioPuntaje: count > 0 ? Number((sumPts / count).toFixed(1)) : 0,
          promedioPorcentaje: count > 0 ? Number((sumPct / count).toFixed(1)) : 0,
          promedioCorrectas: count > 0 ? Number((sumCorr / count).toFixed(1)) : 0,
          maxPuntaje: maxP,
          tasaLogroPorActuacion: tasaLogro,
        };
      });

      const keys = etapasConfiguradas.map((e) => e.key);
      const firstKey = keys[0];
      const lastKey = keys[keys.length - 1];
      const firstEtapa = firstKey ? etapasObj[firstKey] : undefined;
      const lastEtapa = lastKey ? etapasObj[lastKey] : undefined;

      const deltaPts =
        firstEtapa && lastEtapa && firstEtapa.totalParticipantes > 0 && lastEtapa.totalParticipantes > 0
          ? Number((lastEtapa.promedioPuntaje - firstEtapa.promedioPuntaje).toFixed(1))
          : 0;
      const deltaPct =
        firstEtapa && lastEtapa && firstEtapa.totalParticipantes > 0 && lastEtapa.totalParticipantes > 0
          ? Number((lastEtapa.promedioPorcentaje - firstEtapa.promedioPorcentaje).toFixed(1))
          : 0;

      return {
        id,
        label,
        docenteNombre,
        totalEstudiantes: estudiantesGrupo.length,
        etapas: etapasObj,
        deltaPuntaje: deltaPts,
        deltaPorcentaje: deltaPct,
      };
    };

    // Promedio Institucional Global (Todas las secciones)
    result['__global__'] = procesarGrupo(
      '__global__',
      'Promedio Institucional (Todas las Aulas)',
      'Todos los docentes',
      estudiantesEvolutivos
    );

    // Medias individuales por cada sección registrada
    seccionesResumen.forEach((sec) => {
      result[sec.id] = procesarGrupo(sec.id, sec.label, sec.docenteNombre, sec.estudiantes);
    });

    return result;
  }, [estudiantesEvolutivos, etapasConfiguradas, catalogoActuaciones, seccionesResumen]);

  // 1.2 Configuración de datasets dinámicos para el Radar de Comparativa de Salones en Chart.js
  const seccionRadarChartData = useMemo(() => {
    const labels = catalogoActuaciones.map((act) => {
      const txt = act.actuacion || `Actuación ${act.order}`;
      return txt.length > 25 ? `${act.order}. ${txt.slice(0, 23)}...` : `${act.order}. ${txt}`;
    });

    // Solo se grafican las secciones seleccionadas por el usuario (las 3 primeras por defecto)
    const datasets: any[] = seccionesResumen
      .filter((sec) => activeCompareSections[sec.id] ?? false)
      .map((sec) => {
        const i = seccionesResumen.findIndex((s) => s.id === sec.id);
        const secMetrica = seccionEtapasMetricasMap[sec.id]?.etapas[comparativaEtapaKey];
        const color = SECTION_COLORS[i % SECTION_COLORS.length];
        const bgColor = SECTION_BG_COLORS[i % SECTION_BG_COLORS.length];

        return {
          label: `${sec.label} • Prom: ${secMetrica?.promedioPuntaje || 0} pts`,
          data: catalogoActuaciones.map(
            (act) => secMetrica?.tasaLogroPorActuacion[act.order] ?? 0
          ),
          borderColor: color,
          backgroundColor: bgColor,
          borderWidth: 2.5,
          pointBackgroundColor: color,
          pointBorderColor: '#ffffff',
          pointHoverRadius: 6,
          pointRadius: 4,
        };
      });

    // Añadir el promedio general de la I.E. como línea de referencia si está activo
    if (showIeBenchmark) {
      const ieMetrica = seccionEtapasMetricasMap['__global__']?.etapas[comparativaEtapaKey];
      if (ieMetrica && ieMetrica.totalParticipantes > 0) {
        datasets.push({
          label: `Promedio General I.E. (${ieMetrica.promedioPuntaje} pts)`,
          data: catalogoActuaciones.map(
            (act) => ieMetrica.tasaLogroPorActuacion[act.order] ?? 0
          ),
          backgroundColor: 'transparent',
          borderColor: '#475569',
          borderWidth: 2,
          pointBackgroundColor: '#475569',
          pointBorderColor: '#ffffff',
          pointHoverRadius: 5,
          pointRadius: 3,
          borderDash: [5, 5],
        });
      }
    }

    return { labels, datasets };
  }, [
    activeCompareSections,
    showIeBenchmark,
    seccionEtapasMetricasMap,
    comparativaEtapaKey,
    catalogoActuaciones,
    seccionesResumen,
  ]);

  // 1.3 Opciones visuales avanzadas de Chart.js para el Radar de Secciones
  const seccionRadarOptions = useMemo(() => {
    return {
      responsive: true,
      maintainAspectRatio: false,
      scales: {
        r: {
          min: 0,
          max: 100,
          ticks: {
            stepSize: 20,
            callback: (val: any) => `${val}%`,
            backdropColor: 'transparent',
            color: '#64748b',
            font: { size: 10, weight: 'bold' as const },
          },
          grid: {
            color: 'rgba(226, 232, 240, 0.9)',
          },
          angleLines: {
            color: 'rgba(226, 232, 240, 0.9)',
          },
          pointLabels: {
            font: { size: 10, weight: '600' as const },
            color: '#334155',
          },
        },
      },
      plugins: {
        legend: {
          display: false, // Leyenda personalizada organizada en tarjetas compactas con bordes de color
        },
        tooltip: {
          backgroundColor: 'rgba(15, 23, 42, 0.92)',
          padding: 10,
          cornerRadius: 8,
          titleFont: { size: 12, weight: 'bold' as const },
          bodyFont: { size: 11 },
          callbacks: {
            title: (items: any[]) => {
              if (!items || items.length === 0) return '';
              const idx = items[0].dataIndex;
              const act = catalogoActuaciones[idx];
              return act ? `Actuación N° ${act.order}: ${act.actuacion}` : '';
            },
            label: (context: any) => {
              const datasetLabel = context.dataset.label || '';
              const val = context.parsed.r;
              return ` ${datasetLabel}: ${Number(val).toFixed(1)}% acierto`;
            },
          },
        },
      },
    };
  }, [catalogoActuaciones]);

  // 2. Estudiantes y Selección específica para el Modal
  const modalSectionStudents = useMemo(() => {
    const targetId = modalSeccionId || selectedSeccion;
    if (targetId) {
      const found = seccionesResumen.find((s) => s.id === targetId);
      if (found && found.estudiantes.length > 0) return found.estudiantes;
    }
    return estudiantesEvolutivos;
  }, [modalSeccionId, selectedSeccion, seccionesResumen, estudiantesEvolutivos]);

  const modalStudentIndex = useMemo(() => {
    if (!modalStudentDni || modalSectionStudents.length === 0) return 0;
    const idx = modalSectionStudents.findIndex((e) => e.dni === modalStudentDni);
    return idx >= 0 ? idx : 0;
  }, [modalStudentDni, modalSectionStudents]);

  const modalStudent = useMemo(() => {
    if (modalSectionStudents.length === 0) return null;
    return modalSectionStudents[modalStudentIndex] || modalSectionStudents[0];
  }, [modalSectionStudents, modalStudentIndex]);

  const modalSeccionItem = useMemo(() => {
    const targetId = modalSeccionId || selectedSeccion;
    return seccionesResumen.find((s) => s.id === targetId) || seccionesResumen[0] || null;
  }, [modalSeccionId, selectedSeccion, seccionesResumen]);

  // Manejadores para abrir el modal, cambiar salón y navegar estudiantes
  const handleOpenSeccionModal = (secId: string, initialMode: 'seccion' | 'estudiante' = 'seccion') => {
    setModalSeccionId(secId);
    setSelectedSeccion(secId);
    setModalViewMode(initialMode);
    const found = seccionesResumen.find((s) => s.id === secId);
    if (found && found.estudiantes.length > 0) {
      setModalStudentDni(found.estudiantes[0].dni);
    }
    setIsModalOpen(true);
  };

  const handleSwitchModalSeccion = (secId: string) => {
    setModalSeccionId(secId);
    setSelectedSeccion(secId);
    const found = seccionesResumen.find((s) => s.id === secId);
    if (found && found.estudiantes.length > 0) {
      setModalStudentDni(found.estudiantes[0].dni);
    }
  };

  const handlePrevStudent = () => {
    if (modalStudentIndex > 0) {
      setModalStudentDni(modalSectionStudents[modalStudentIndex - 1].dni);
    }
  };

  const handleNextStudent = () => {
    if (modalStudentIndex < modalSectionStudents.length - 1) {
      setModalStudentDni(modalSectionStudents[modalStudentIndex + 1].dni);
    }
  };

  // Estudiantes que entran en la búsqueda del Spotlight (Ctrl + K):
  // Si se está en un salón (modal abierto o sección seleccionada), se limita estrictamente a los alumnos de ese salón,
  // permitiendo también alternar al alcance global institucional si el usuario lo requiere.
  const targetSpotlightStudents = useMemo(() => {
    const activeSecId = isModalOpen ? modalSeccionId : (selectedSeccion || modalSeccionId);
    if (activeSecId && spotlightScopeOverride === 'seccion') {
      const found = seccionesResumen.find((s) => s.id === activeSecId);
      if (found && found.estudiantes.length > 0) return found.estudiantes;
    }
    return estudiantesEvolutivos;
  }, [isModalOpen, modalSeccionId, selectedSeccion, seccionesResumen, estudiantesEvolutivos, spotlightScopeOverride]);

  const activeSpotlightSectionLabel = useMemo(() => {
    const activeSecId = isModalOpen ? modalSeccionId : (selectedSeccion || modalSeccionId);
    if (activeSecId) {
      const found = seccionesResumen.find((s) => s.id === activeSecId);
      if (found) return found.label;
    }
    return null;
  }, [isModalOpen, modalSeccionId, selectedSeccion, seccionesResumen]);

  const spotlightResults = useMemo(() => {
    return searchAndRankStudents(targetSpotlightStudents, spotlightQuery);
  }, [targetSpotlightStudents, spotlightQuery]);

  const handleSelectSpotlightStudent = (est: EstudianteEvolutivo) => {
    setModalStudentDni(est.dni);
    const secKey = String(est.seccion || '').trim();
    if (secKey && secKey !== 'sin_seccion') {
      setModalSeccionId(secKey);
      setSelectedSeccion(secKey);
    }
    setModalViewMode('estudiante');
    setIsModalOpen(true);
    setIsSpotlightOpen(false);
  };

  // Atajos de teclado: Ctrl + K (activar búsqueda), Escape (cerrar búsqueda o modal), Flechas (navegar alumnos)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // 1. Activar con Ctrl + K o Cmd + K (Mac)
      if ((e.ctrlKey || e.metaKey) && (e.key === 'k' || e.key === 'K')) {
        e.preventDefault();
        setIsSpotlightOpen((prev) => {
          const next = !prev;
          if (next) {
            setSpotlightQuery('');
            setSpotlightScopeOverride('seccion');
          }
          return next;
        });
        return;
      }

      // 2. Escape: primero cierra Spotlight si está abierto; si no, cierra el modal
      if (e.key === 'Escape') {
        if (isSpotlightOpen) {
          e.preventDefault();
          e.stopPropagation();
          setIsSpotlightOpen(false);
          return;
        }
        if (isModalExportDropdownOpen || isModalPrintDropdownOpen) {
          setIsModalExportDropdownOpen(false);
          setIsModalPrintDropdownOpen(false);
          return;
        }
        if (isModalOpen) {
          setIsModalOpen(false);
          return;
        }
      }

      // 3. Flechas izquierda / derecha para navegar entre alumnos en modo estudiante
      if (isModalOpen && !isSpotlightOpen && modalViewMode === 'estudiante') {
        if (e.key === 'ArrowLeft') {
          handlePrevStudent();
        } else if (e.key === 'ArrowRight') {
          handleNextStudent();
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    if (isModalOpen || isSpotlightOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = 'unset';
    };
  }, [
    isModalOpen,
    isSpotlightOpen,
    modalViewMode,
    modalStudentIndex,
    modalSectionStudents,
    isModalExportDropdownOpen,
    isModalPrintDropdownOpen,
  ]);

  // Radar del Salón enfocado en el Modal
  const seccionModalRadarChartData = useMemo(() => {
    const targetSecKey = modalSeccionId || selectedSeccion || '__global__';
    const targetSecData = seccionEtapasMetricasMap[targetSecKey] || seccionEtapasMetricasMap['__global__'];

    const labels = catalogoActuaciones.map((act) => {
      const txt = act.actuacion || `Actuación ${act.order}`;
      return txt.length > 25 ? `${act.order}. ${txt.slice(0, 23)}...` : `${act.order}. ${txt}`;
    });

    const datasets: any[] = etapasConfiguradas
      .filter((etapa) => activeStages[etapa.key] ?? true)
      .map((etapa, idx) => {
        const metrica = targetSecData?.etapas[etapa.key];
        const color =
          ETAPA_PALETTE[etapa.key] ||
          (idx === 0
            ? ETAPA_PALETTE.edi
            : idx === 1
            ? ETAPA_PALETTE.ep1
            : ETAPA_PALETTE.ep2);

        const values = catalogoActuaciones.map(
          (act) => metrica?.tasaLogroPorActuacion[act.order] ?? 0
        );

        return {
          label: `${etapa.label} (Prom: ${metrica?.promedioPuntaje || 0} pts)`,
          data: values,
          backgroundColor: color.bg,
          borderColor: color.border,
          borderWidth: 2.5,
          pointBackgroundColor: color.border,
          pointBorderColor: '#ffffff',
          pointHoverRadius: 6,
          pointRadius: 4,
        };
      });

    if (targetSecKey !== '__global__' && seccionEtapasMetricasMap['__global__']) {
      const lastEtapaKey = etapasConfiguradas[etapasConfiguradas.length - 1]?.key || 'actual';
      const ieMetrica = seccionEtapasMetricasMap['__global__']?.etapas[lastEtapaKey];
      if (ieMetrica && ieMetrica.totalParticipantes > 0) {
        datasets.push({
          label: `Promedio I.E. (${ieMetrica.etapaLabel})`,
          data: catalogoActuaciones.map(
            (act) => ieMetrica.tasaLogroPorActuacion[act.order] ?? 0
          ),
          backgroundColor: 'transparent',
          borderColor: '#94a3b8',
          borderWidth: 1.5,
          pointBackgroundColor: '#94a3b8',
          pointBorderColor: '#ffffff',
          pointHoverRadius: 4,
          pointRadius: 2,
          borderDash: [5, 5],
        });
      }
    }

    return { labels, datasets };
  }, [
    modalSeccionId,
    selectedSeccion,
    seccionEtapasMetricasMap,
    catalogoActuaciones,
    etapasConfiguradas,
    activeStages,
  ]);

  // Helpers para el gráfico lineal del estudiante en el modal
  const buildStudentChartData = (student: EstudianteEvolutivo | null) => {
    if (!student || etapasConfiguradas.length === 0) {
      return { labels: [], datasets: [] };
    }

    const visibleEtapas = etapasConfiguradas.filter(
      (et) => activeStages[et.key] ?? true
    );

    const labels = visibleEtapas.map((et) => et.label);
    const dataAlumno = visibleEtapas.map((et) => {
      const item = student.etapas[et.key];
      return item ? item.puntaje : null;
    });

    const targetSecKey = student.seccion ? String(student.seccion).trim() : modalSeccionId || selectedSeccion || '__global__';
    const secMetrica = seccionEtapasMetricasMap[targetSecKey] || seccionEtapasMetricasMap['__global__'];

    const dataAula = visibleEtapas.map((et) => {
      const m = secMetrica?.etapas[et.key];
      return m && m.totalParticipantes > 0 ? m.promedioPuntaje : null;
    });

    return {
      labels,
      datasets: [
        {
          label: `${student.nombreCompleto || student.nombresApellidos || 'Estudiante'}`,
          data: dataAlumno,
          borderColor: '#2563eb',
          backgroundColor: 'rgba(37, 99, 235, 0.12)',
          fill: true,
          tension: 0.35,
          spanGaps: true,
          pointBackgroundColor: '#2563eb',
          pointBorderColor: '#ffffff',
          pointBorderWidth: 2,
          pointRadius: 6,
          pointHoverRadius: 8,
          borderWidth: 3,
          clip: false as const,
        },
        {
          label: `Promedio ${secMetrica?.label || 'del Salón'}`,
          data: dataAula,
          borderColor: '#94a3b8',
          backgroundColor: 'transparent',
          borderDash: [5, 5],
          tension: 0.35,
          spanGaps: true,
          pointBackgroundColor: '#94a3b8',
          pointBorderColor: '#ffffff',
          pointBorderWidth: 2,
          pointRadius: 4,
          pointHoverRadius: 6,
          borderWidth: 2,
          clip: false as const,
        },
      ],
    };
  };

  const calculateStudentMaxY = (student: EstudianteEvolutivo | null) => {
    let highest = 20;
    const visibleEtapas = etapasConfiguradas.filter(
      (et) => activeStages[et.key] ?? true
    );
    visibleEtapas.forEach((et) => {
      const item = student?.etapas[et.key];
      if (item) {
        if (item.maxPuntaje && item.maxPuntaje > highest) highest = item.maxPuntaje;
        if (item.puntaje && item.puntaje > highest) highest = item.puntaje;
      }
    });
    if (highest <= 20) return 20;
    if (highest <= 40) return 40;
    if (highest <= 100) return 100;
    if (highest <= 500) return 500;
    return Math.ceil(highest / 20) * 20;
  };

  const buildStudentChartOptions = (maxY: number): any => {
    const stepSize = maxY > 100 ? 50 : maxY > 40 ? 20 : maxY > 20 ? 10 : 4;
    return {
      responsive: true,
      maintainAspectRatio: false,
      spanGaps: true,
      plugins: {
        legend: {
          position: 'top' as const,
          labels: {
            boxWidth: 12,
            font: { size: 12, weight: 'bold' as const },
            color: '#334155',
          },
        },
        tooltip: {
          backgroundColor: '#0f172a',
          titleFont: { size: 12, weight: 'bold' },
          bodyFont: { size: 11 },
          padding: 10,
          cornerRadius: 8,
          callbacks: {
            label: (context: any) => {
              const val = context.parsed.y;
              return ` ${context.dataset.label}: ${val !== null && val !== undefined ? `${val} pts` : 'Sin evaluación'}`;
            },
          },
        },
      },
      scales: {
        y: {
          min: 0,
          max: maxY + stepSize,
          ticks: { stepSize, font: { size: 11 } },
          grid: { color: 'rgba(226, 232, 240, 0.7)' },
        },
        x: {
          grid: { display: false },
          ticks: { font: { size: 11, weight: 'bold' }, color: '#475569' },
        },
      },
    };
  };

  // 4. Métricas consolidadas del grupo actualmente visible
  // 5. Construcción de Props de PDF para el Estudiante
  const buildStudentPDFProps = (estudiante: EstudianteEvolutivo): EstudianteEvolutivoPDFProps => {
    const etapasPDF = (estudiante.historial || []).map((h) => ({
      etapaKey: h.etapaKey,
      label: h.label,
      nombreEvaluacion: h.nombreEvaluacion || h.label,
      puntaje: h.puntaje,
      maxPuntaje: h.maxPuntaje || 20,
      nivel: h.nivel,
      nivelColor: h.nivelColor,
      respuestasCorrectas: h.respuestasCorrectas,
      totalPreguntas: h.totalPreguntas,
      porcentaje: h.porcentaje,
      fecha: h.fecha,
    }));

    // Resolver nombre del docente responsable de este estudiante
    let docName = 'Docente de Aula';
    let docFoto: string | undefined = undefined;
    if (estudiante.dniDocente && docentesMap.has(estudiante.dniDocente)) {
      docName = docentesMap.get(estudiante.dniDocente)!;
    } else if (estudiante.dniDocente) {
      const foundDoc = docentesDeDirectores.find((d: any) => String(d.dni) === estudiante.dniDocente);
      if (foundDoc) {
        docName = `${foundDoc.nombres || ''} ${foundDoc.apellidos || ''}`.trim() || docName;
        docFoto = foundDoc.fotoUrl || foundDoc.foto || undefined;
      }
    }

    const secKey = estudiante.seccion ? String(estudiante.seccion).trim() : '';
    const secObj = secKey ? seccionesResumen.find((s) => s.id === secKey) : null;
    const aulaPromedio = secObj?.promedioActual || 0;

    const effectiveAdjustments =
      typeof window !== 'undefined'
        ? loadStoredCardAdjustments(catalogoActuaciones.length, radarSplitInTwo)
        : {};

    return {
      estudiante: {
        dni: estudiante.dni,
        nombres: estudiante.nombres,
        apellidos: estudiante.apellidos,
        seccion: estudiante.seccion,
        genero: estudiante.genero,
        fotoUrl: estudiante.fotoUrl || estudiante.foto,
        puntaje: estudiante.puntajeFinal,
        maxPuntaje: 20,
        nivel: estudiante.nivelFinal || estudiante.nivelInicial,
      },
      evaluacionActual: {
        id: evaluacion.id,
        nombre: evaluacion.nombre,
        grado: evaluacion.grado,
        añoDelExamen: evaluacion.añoDelExamen,
        mesDelExamen: evaluacion.mesDelExamen,
      },
      nombreDocente: docName,
      fotoDocenteUrl: docFoto,
      nombreColegio,
      historialEtapas: etapasPDF,
      deltaPuntaje: estudiante.deltaPuntaje,
      estadoTrayectoria: estudiante.estadoTrayectoria,
      promedioAula: aulaPromedio,
      diferenciaConAula: estudiante.diferenciaConAula,
      catalogoActuaciones,
      etapasConfiguradas,
      studentEtapas: estudiante.etapas,
      activeStages,
      chartLayoutMode: radarLayoutMode,
      splitInTwo: radarSplitInTwo,
      orderDirection: radarOrderDirection,
      textScale: radarTextScale,
      cardAdjustments: effectiveAdjustments,
    };
  };

  // 6. Manejo de Descarga en PDF
  const handleExportPDF = async (estudiante: EstudianteEvolutivo) => {
    if (exportingDni || isExportingAll) return;
    try {
      setExportingDni(estudiante.dni);
      const { exportarFichaEvolutivaEstudiantePDF } = await import(
        '@/features/utils/exportarFichaEvolutivaEstudiantePDF'
      );
      await exportarFichaEvolutivaEstudiantePDF(buildStudentPDFProps(estudiante));
    } catch (err) {
      console.error('Error al exportar ficha en PDF:', err);
    } finally {
      setExportingDni(null);
    }
  };

  const handleExportBatchPDF = async (targetStudents: EstudianteEvolutivo[], labelBatch: string) => {
    if (exportingDni || isExportingAll || targetStudents.length === 0) return;
    try {
      setIsExportingAll(true);
      const { exportarFichaEvolutivaConsolidadoPDF } = await import(
        '@/features/utils/exportarFichaEvolutivaEstudiantePDF'
      );
      const allProps = targetStudents.map(buildStudentPDFProps);
      const sanitizedName = `Fichas_Evolutivas_${labelBatch.replace(/\s+/g, '_')}.pdf`;
      await exportarFichaEvolutivaConsolidadoPDF(allProps, sanitizedName);
    } catch (err) {
      console.error('Error al exportar lote de fichas en PDF:', err);
    } finally {
      setIsExportingAll(false);
    }
  };

  // 7. Manejo de Impresión Directa con QR
  const handlePrintPDF = async (estudiante: EstudianteEvolutivo) => {
    if (exportingDni || isExportingAll || printingDni || isPrintingAll) return;
    try {
      setPrintingDni(estudiante.dni);
      const { imprimirFichaEvolutivaEstudiantePDF } = await import(
        '@/features/utils/exportarFichaEvolutivaEstudiantePDF'
      );
      await imprimirFichaEvolutivaEstudiantePDF(buildStudentPDFProps(estudiante));
    } catch (err) {
      console.error('Error al imprimir ficha en PDF:', err);
    } finally {
      setPrintingDni(null);
    }
  };

  const handlePrintBatchPDF = async (targetStudents: EstudianteEvolutivo[]) => {
    if (exportingDni || isExportingAll || printingDni || isPrintingAll || targetStudents.length === 0) return;
    try {
      setIsPrintingAll(true);
      const { imprimirFichaEvolutivaConsolidadoPDF } = await import(
        '@/features/utils/exportarFichaEvolutivaEstudiantePDF'
      );
      const allProps = targetStudents.map(buildStudentPDFProps);
      await imprimirFichaEvolutivaConsolidadoPDF(allProps);
    } catch (err) {
      console.error('Error al imprimir lote de fichas en PDF:', err);
    } finally {
      setIsPrintingAll(false);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-20 min-h-[400px] bg-white rounded-2xl border border-dashed border-slate-200">
        <RiLoader4Line className="w-10 h-10 text-emerald-600 animate-spin mb-3" />
        <h4 className="text-base font-bold text-slate-800">Sincronizando información evolutiva institucional</h4>
        <p className="text-xs text-slate-500 mt-1 max-w-md text-center">
          Procesando historial y trayectorias de todos los salones a través de las etapas del año lectivo...
        </p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center py-16 bg-rose-50/60 rounded-2xl border border-rose-200 p-6 text-center">
        <MdWarning className="w-10 h-10 text-rose-500 mb-2" />
        <h4 className="text-base font-bold text-rose-800">No se pudieron cargar los datos evolutivos de la I.E.</h4>
        <p className="text-xs text-rose-600 mt-1 mb-4">{error}</p>
        <button
          type="button"
          onClick={refetch}
          className="inline-flex items-center gap-2 px-4 py-2 text-xs font-semibold rounded-xl bg-rose-600 text-white hover:bg-rose-700 shadow-xs cursor-pointer transition-colors"
        >
          <MdRestartAlt className="w-4 h-4" />
          <span>Reintentar</span>
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* ========================================================= */}
      {/* NIVEL 1: TABLERO COMPARATIVO DE SALONES (MATRIZ COMPACTA)  */}
      {/* ========================================================= */}
      <section aria-label="Tablero Global de Salones" className="space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-xl bg-emerald-50 text-emerald-600">
              <MdGroups className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-900">
                Monitoreo Global de Salones • {evaluacion.nombre}
              </h3>
              <p className="text-xs text-slate-500">
                Matriz comparativa de rendimiento longitudinal por aula, promedios y niveles
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 self-end sm:self-center">
            <span className="text-xs font-semibold text-slate-500 hidden sm:inline">
              {seccionesResumen.length} {seccionesResumen.length === 1 ? 'Salón registrado' : 'Salones registrados'}
            </span>
            {/* Conmutador de Formato: Matriz Compacta vs Tarjetas */}
            <div className="inline-flex rounded-xl border border-slate-200 p-0.5 bg-slate-100 text-xs font-semibold">
              <button
                type="button"
                onClick={() => setNivel1ViewFormat('matriz')}
                className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg transition-colors cursor-pointer ${
                  nivel1ViewFormat === 'matriz'
                    ? 'bg-white text-emerald-700 shadow-2xs font-bold'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
                title="Vista Matriz Compacta (Recomendada)"
              >
                <MdTableChart className="w-3.5 h-3.5" />
                <span>Matriz Compacta</span>
              </button>
              <button
                type="button"
                onClick={() => setNivel1ViewFormat('tarjetas')}
                className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg transition-colors cursor-pointer ${
                  nivel1ViewFormat === 'tarjetas'
                    ? 'bg-white text-emerald-700 shadow-2xs font-bold'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
                title="Vista en Tarjetas"
              >
                <MdViewModule className="w-3.5 h-3.5" />
                <span>Tarjetas</span>
              </button>
            </div>
          </div>
        </div>

        {/* ------------------------------------------------------------- */}
        {/* VISTA A: MATRIZ COMPACTA DE SALONES (PUNTAJES Y NIVELES)      */}
        {/* ------------------------------------------------------------- */}
        {nivel1ViewFormat === 'matriz' ? (
          <div className="bg-white rounded-2xl border border-slate-200/90 shadow-2xs overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50/90 text-slate-600 font-bold border-b border-slate-200/80">
                  <tr>
                    <th className="py-3 px-3.5 w-10 text-center">#</th>
                    <th className="py-3 px-3.5 min-w-[140px]">Aula / Salón</th>
                    <th className="py-3 px-3.5 min-w-[180px]">Docente a cargo</th>
                    <th className="py-3 px-3.5 text-center min-w-[90px]">Evaluados</th>
                    {etapasConfiguradas.map((etapa) => (
                      <th
                        key={`th-matriz-etapa-${etapa.key}`}
                        className="py-3 px-3.5 text-center min-w-[130px]"
                      >
                        <div className="font-extrabold text-slate-800">{etapa.label}</div>
                        <div className="text-[10px] text-slate-400 font-normal">Promedio y Nivel</div>
                      </th>
                    ))}
                    <th className="py-3 px-3.5 text-center min-w-[110px]">
                      <div className="font-extrabold text-slate-800">Variación (Δ)</div>
                      <div className="text-[10px] text-slate-400 font-normal">Crecimiento neto</div>
                    </th>
                    <th className="py-3 px-3.5 min-w-[150px]">
                      <div className="font-extrabold text-slate-800">Trayectoria del Aula</div>
                      <div className="text-[10px] text-slate-400 font-normal">% Subieron vs % Alerta</div>
                    </th>
                    <th className="py-3 px-3.5 text-center min-w-[100px]">Acción</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {seccionesResumen.map((sec, idx) => {
                    const isSelected = selectedSeccion === sec.id;
                    const pctSuperacion = sec.total > 0 ? Math.round((sec.totalSuperacion / sec.total) * 100) : 0;
                    const pctAlerta = sec.total > 0 ? Math.round((sec.totalAlerta / sec.total) * 100) : 0;
                    const pctEstable = sec.total > 0 ? Math.max(0, 100 - pctSuperacion - pctAlerta) : 0;

                    return (
                      <tr
                        key={`row-matriz-sec-${sec.id}`}
                        onClick={() => handleOpenSeccionModal(sec.id, 'seccion')}
                        className={`transition-colors cursor-pointer group ${
                          isSelected
                            ? 'bg-emerald-50/80 font-semibold'
                            : 'hover:bg-emerald-50/40'
                        }`}
                      >
                        <td className="py-2.5 px-3.5 text-center text-slate-400 text-[11px] font-mono">
                          {idx + 1}
                        </td>
                        <td className="py-2.5 px-3.5">
                          <div className="flex items-center gap-2">
                            <span className="font-extrabold text-slate-900 text-sm group-hover:text-emerald-700 transition-colors">
                              {sec.label}
                            </span>
                            {isSelected && (
                              <span className="px-1.5 py-0.5 rounded-md text-[9px] font-black bg-emerald-600 text-white">
                                ACTIVO
                              </span>
                            )}
                          </div>
                        </td>
                        <td className="py-2.5 px-3.5 text-slate-600 truncate max-w-[200px]" title={sec.docenteNombre}>
                          Prof. {sec.docenteNombre}
                        </td>
                        <td className="py-2.5 px-3.5 text-center font-bold text-slate-800">
                          {sec.total} <span className="text-[10px] text-slate-400 font-normal">alumnos</span>
                        </td>
                        {etapasConfiguradas.map((etapa) => {
                          const metrica = seccionEtapasMetricasMap[sec.id]?.etapas[etapa.key];
                          const pts = metrica?.promedioPuntaje || 0;
                          const nivelInfo = resolveNivelBadge(pts);

                          return (
                            <td key={`cell-sec-${sec.id}-${etapa.key}`} className="py-2.5 px-3.5 text-center">
                              {metrica && metrica.totalParticipantes > 0 ? (
                                <div className="flex flex-col items-center justify-center gap-1">
                                  <span className="font-black text-slate-900 text-xs sm:text-sm">
                                    {pts} pts
                                  </span>
                                  <span
                                    className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold border truncate max-w-[120px]"
                                    style={{
                                      backgroundColor: `${nivelInfo.color}15`,
                                      borderColor: `${nivelInfo.color}40`,
                                      color: nivelInfo.color,
                                    }}
                                  >
                                    {nivelInfo.nombre}
                                  </span>
                                </div>
                              ) : (
                                <span className="text-slate-300 text-xs">—</span>
                              )}
                            </td>
                          );
                        })}
                        <td className="py-2.5 px-3.5 text-center">
                          <span
                            className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-black ${
                              sec.delta > 0
                                ? 'bg-emerald-100 text-emerald-800'
                                : sec.delta < 0
                                ? 'bg-rose-100 text-rose-800'
                                : 'bg-slate-100 text-slate-700'
                            }`}
                          >
                            {sec.delta > 0 ? (
                              <MdTrendingUp className="w-3.5 h-3.5" />
                            ) : sec.delta < 0 ? (
                              <MdTrendingDown className="w-3.5 h-3.5" />
                            ) : (
                              <MdTrendingFlat className="w-3.5 h-3.5" />
                            )}
                            <span>{sec.delta > 0 ? `+${sec.delta}` : sec.delta} pts</span>
                          </span>
                        </td>
                        <td className="py-2.5 px-3.5">
                          <div className="flex items-center justify-between text-[10px] text-slate-500 mb-1">
                            <span className="text-emerald-700 font-bold">{pctSuperacion}% subieron</span>
                            {pctAlerta > 0 && <span className="text-rose-600 font-bold">{pctAlerta}% alerta</span>}
                          </div>
                          <div className="w-full h-1.5 rounded-full bg-slate-100 overflow-hidden flex">
                            <div style={{ width: `${pctSuperacion}%` }} className="bg-emerald-500 h-full" />
                            <div style={{ width: `${pctEstable}%` }} className="bg-amber-400 h-full" />
                            <div style={{ width: `${pctAlerta}%` }} className="bg-rose-500 h-full" />
                          </div>
                        </td>
                        <td className="py-2.5 px-3.5 text-center">
                          <div className="inline-flex items-center gap-1.5" onClick={(e) => e.stopPropagation()}>
                            <button
                              type="button"
                              onClick={() => handleOpenSeccionModal(sec.id, 'seccion')}
                              className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-bold rounded-lg bg-emerald-50 text-emerald-700 hover:bg-emerald-600 hover:text-white transition-colors cursor-pointer shadow-2xs border border-emerald-200"
                              title="Ver evolución completa del salón en pantalla completa"
                            >
                              <TbChartRadar className="w-3.5 h-3.5" />
                              <span>Evolución</span>
                            </button>
                            <button
                              type="button"
                              onClick={() => handleOpenSeccionModal(sec.id, 'estudiante')}
                              className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-bold rounded-lg bg-blue-50 text-blue-700 hover:bg-blue-600 hover:text-white transition-colors cursor-pointer shadow-2xs border border-blue-200"
                              title="Ver estudiantes del salón en pantalla completa"
                            >
                              <MdPerson className="w-3.5 h-3.5" />
                              <span>Alumnos</span>
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>

                {/* Fila Resumen: Promedio Institucional General (Toda la I.E.) */}
                <tfoot className="bg-slate-100/90 font-bold border-t-2 border-slate-300/80">
                  <tr>
                    <td colSpan={3} className="py-3 px-3.5 text-slate-900 font-extrabold">
                      <div className="flex items-center gap-2">
                        <span className="w-2.5 h-2.5 rounded-full bg-emerald-600 shrink-0" />
                        <span>PROMEDIO INSTITUCIONAL GENERAL (Toda la I.E.)</span>
                      </div>
                    </td>
                    <td className="py-3 px-3.5 text-center font-extrabold text-slate-900">
                      {estudiantesEvolutivos.length} <span className="text-[10px] text-slate-500 font-normal">alumnos</span>
                    </td>
                    {etapasConfiguradas.map((etapa) => {
                      const ieMetrica = seccionEtapasMetricasMap['__global__']?.etapas[etapa.key];
                      const pts = ieMetrica?.promedioPuntaje || 0;
                      const nivelInfo = resolveNivelBadge(pts);

                      return (
                        <td key={`tfoot-etapa-${etapa.key}`} className="py-3 px-3.5 text-center">
                          <div className="flex flex-col items-center justify-center gap-1">
                            <span className="font-black text-slate-900 text-xs sm:text-sm">
                              {pts} pts
                            </span>
                            <span
                              className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold border"
                              style={{
                                backgroundColor: `${nivelInfo.color}15`,
                                borderColor: `${nivelInfo.color}40`,
                                color: nivelInfo.color,
                              }}
                            >
                              {nivelInfo.nombre}
                            </span>
                          </div>
                        </td>
                      );
                    })}
                    <td className="py-3 px-3.5 text-center">
                      {(() => {
                        const delta = seccionEtapasMetricasMap['__global__']?.deltaPuntaje || 0;
                        return (
                          <span
                            className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-black ${
                              delta > 0
                                ? 'bg-emerald-200 text-emerald-900'
                                : delta < 0
                                ? 'bg-rose-200 text-rose-900'
                                : 'bg-slate-200 text-slate-800'
                            }`}
                          >
                            <span>{delta > 0 ? `+${delta}` : delta} pts</span>
                          </span>
                        );
                      })()}
                    </td>
                    <td colSpan={2} className="py-3 px-3.5 text-right text-slate-500 text-[11px] font-medium pr-6">
                      Consolidado institucional de {seccionesResumen.length} salones
                    </td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </div>
        ) : (
          /* ------------------------------------------------------------- */
          /* VISTA B: CUADRÍCULA DE TARJETAS DE SALÓN (VISTA ALTERNATIVA)  */
          /* ------------------------------------------------------------- */
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
            {seccionesResumen.map((sec) => {
              const isSelected = selectedSeccion === sec.id;
              const pctSuperacion = sec.total > 0 ? Math.round((sec.totalSuperacion / sec.total) * 100) : 0;
              const pctAlerta = sec.total > 0 ? Math.round((sec.totalAlerta / sec.total) * 100) : 0;

              return (
                <div
                  key={`card-sec-${sec.id}`}
                  onClick={() => handleOpenSeccionModal(sec.id, 'seccion')}
                  className={`p-4 rounded-2xl border text-left transition-all duration-200 cursor-pointer shadow-2xs hover:shadow-md relative overflow-hidden group ${
                    isSelected
                      ? 'bg-emerald-50/80 border-emerald-500 ring-2 ring-emerald-500/20'
                      : 'bg-white border-slate-200/90 hover:border-emerald-400'
                  }`}
                >
                  {/* Cabecera de la tarjeta */}
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <div className="min-w-0 flex-1">
                      <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
                        Aula
                      </span>
                      <h4 className="text-base font-extrabold text-slate-900 group-hover:text-emerald-700 transition-colors truncate">
                        {sec.label}
                      </h4>
                      <p className="text-[11px] text-slate-500 truncate mt-0.5" title={sec.docenteNombre}>
                        Prof. {sec.docenteNombre}
                      </p>
                    </div>

                    {/* Badge de Delta de Aprendizaje */}
                    <div
                      className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-black shrink-0 ${
                        sec.delta > 0
                          ? 'bg-emerald-100 text-emerald-800'
                          : sec.delta < 0
                          ? 'bg-rose-100 text-rose-800'
                          : 'bg-slate-100 text-slate-700'
                      }`}
                    >
                      {sec.delta > 0 ? (
                        <MdTrendingUp className="w-3.5 h-3.5" />
                      ) : sec.delta < 0 ? (
                        <MdTrendingDown className="w-3.5 h-3.5" />
                      ) : (
                        <MdTrendingFlat className="w-3.5 h-3.5" />
                      )}
                      <span>{sec.delta > 0 ? `+${sec.delta}` : sec.delta} pts</span>
                    </div>
                  </div>

                  {/* Métricas de evolución */}
                  <div className="grid grid-cols-2 gap-2 my-3 pt-2.5 border-t border-slate-100 text-xs">
                    <div>
                      <span className="text-[10px] font-bold text-slate-400 block uppercase">Promedio Aula</span>
                      <span className="text-sm font-extrabold text-slate-900">{sec.promedioActual} pts</span>
                    </div>
                    <div>
                      <span className="text-[10px] font-bold text-slate-400 block uppercase">Alumnos</span>
                      <span className="text-sm font-extrabold text-slate-900">{sec.total} evaluados</span>
                    </div>
                  </div>

                  {/* Barra segmentada de trayectorias */}
                  <div>
                    <div className="flex items-center justify-between text-[10px] text-slate-500 mb-1">
                      <span className="text-emerald-700 font-bold">{pctSuperacion}% subieron</span>
                      {pctAlerta > 0 && <span className="text-rose-600 font-bold">{pctAlerta}% alerta</span>}
                    </div>
                    <div className="w-full h-1.5 rounded-full bg-slate-100 overflow-hidden flex">
                      <div style={{ width: `${pctSuperacion}%` }} className="bg-emerald-500 h-full" />
                      <div
                        style={{
                          width: `${sec.total > 0 ? ((sec.totalEstable / sec.total) * 100) : 0}%`,
                        }}
                        className="bg-amber-400 h-full"
                      />
                      <div style={{ width: `${pctAlerta}%` }} className="bg-rose-500 h-full" />
                    </div>
                  </div>

                  {/* Botones de acción inferior */}
                  <div className="mt-3 pt-2.5 border-t border-slate-100 flex items-center justify-between">
                    <span className="text-[11px] font-bold text-slate-500 group-hover:text-emerald-700 transition-colors flex items-center gap-1">
                      <TbChartRadar className="w-3.5 h-3.5" />
                      <span>Ver Evolución</span>
                    </span>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleOpenSeccionModal(sec.id, 'estudiante');
                      }}
                      className="px-2.5 py-1 rounded-lg text-[10px] font-bold bg-blue-50 text-blue-700 hover:bg-blue-600 hover:text-white transition-colors cursor-pointer border border-blue-200"
                    >
                      Alumnos
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>

      {/* ========================================================= */}
      {/* COMPARATIVA DE SALONES EN RADAR                            */}
      {/* ========================================================= */}
      <section aria-label="Comparativa de Salones en Radar" className="space-y-4">
        <div className="bg-white rounded-2xl border border-slate-200/90 shadow-2xs overflow-hidden">
          {/* Cabecera de la Comparativa de Salones */}
          <div className="p-4 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-slate-50/50">
            <div className="flex items-center gap-3 min-w-0">
              <div className="w-10 h-10 rounded-xl bg-indigo-100 text-indigo-800 flex items-center justify-center shrink-0 border border-indigo-200 font-extrabold text-sm">
                <MdCompareArrows className="w-5 h-5" />
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <h4 className="text-sm sm:text-base font-extrabold text-slate-900">
                    Comparativa de Salones en Radar
                  </h4>
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-indigo-50 text-indigo-700 border border-indigo-200/60">
                    {seccionesResumen.length} salones registrados
                  </span>
                </div>
                <p className="text-xs text-slate-500">
                  Comparativa transversal de los desempeños por actuación pedagógica entre todas las secciones.
                </p>
              </div>
            </div>

            {/* Selector de Etapa Evaluativa para la Comparativa */}
            <div className="flex items-center gap-2 self-end sm:self-center flex-wrap">
              <span className="text-xs font-bold text-slate-500">Etapa Evaluativa:</span>
              <div className="inline-flex rounded-xl border border-slate-200 p-0.5 bg-slate-100 text-xs font-semibold">
                {etapasConfiguradas.map((etapa) => (
                  <button
                    key={`comp-etapa-${etapa.key}`}
                    type="button"
                    onClick={() => setComparativaEtapaKey(etapa.key)}
                    className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
                      comparativaEtapaKey === etapa.key
                        ? 'bg-indigo-600 text-white font-bold shadow-2xs'
                        : 'text-slate-600 hover:text-indigo-700'
                    }`}
                  >
                    {etapa.label}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Barra de Selección y Leyenda Interactiva (Cards compactos con borde del color correspondiente) */}
          <div className="p-3.5 bg-slate-50/50 border-b border-slate-100 space-y-2.5">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs">
              <div className="flex items-center gap-2">
                <span className="font-extrabold text-slate-700">
                  Salones comparados en el radar:
                </span>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-50 text-blue-700 border border-blue-200/60">
                  {Object.values(activeCompareSections).filter(Boolean).length} de {seccionesResumen.length} activos
                </span>
                <span className="text-[11px] text-slate-400 hidden lg:inline">
                  (Haz clic en cada tarjeta para activar o desactivar su trazo)
                </span>
              </div>

              {/* Botones de acción rápida */}
              <div className="inline-flex items-center gap-1 self-end sm:self-auto text-[11px] font-semibold">
                <button
                  type="button"
                  onClick={handleSelectFirstThree}
                  className="px-2.5 py-0.5 rounded-lg bg-white border border-slate-200 hover:bg-slate-100 text-slate-600 hover:text-slate-900 shadow-2xs transition-colors cursor-pointer"
                  title="Mostrar solo las primeras 3 secciones para no saturar el gráfico"
                >
                  Primeras 3
                </button>
                <button
                  type="button"
                  onClick={handleSelectAllSections}
                  className="px-2.5 py-0.5 rounded-lg bg-white border border-slate-200 hover:bg-slate-100 text-slate-600 hover:text-slate-900 shadow-2xs transition-colors cursor-pointer"
                  title="Activar todas las secciones en el radar"
                >
                  Todas
                </button>
                <button
                  type="button"
                  onClick={handleClearAllSections}
                  className="px-2.5 py-0.5 rounded-lg bg-white border border-slate-200 hover:bg-slate-100 text-slate-600 hover:text-rose-600 shadow-2xs transition-colors cursor-pointer"
                  title="Deseleccionar todas las secciones"
                >
                  Limpiar
                </button>
              </div>
            </div>

            {/* Parrilla de Pastillas / Cards Compactos con borde del color que le corresponde */}
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-2">
              {seccionesResumen.map((sec, i) => {
                const color = SECTION_COLORS[i % SECTION_COLORS.length];
                const secMetrica = seccionEtapasMetricasMap[sec.id]?.etapas[comparativaEtapaKey];
                const pts = secMetrica?.promedioPuntaje || 0;
                const nivel = resolveNivelBadge(pts);
                const isActive = activeCompareSections[sec.id] ?? false;

                return (
                  <button
                    key={`radar-card-sec-${sec.id}`}
                    type="button"
                    onClick={() => toggleCompareSection(sec.id)}
                    className={`p-2 rounded-xl text-left transition-all cursor-pointer flex flex-col justify-between gap-1 shadow-2xs group ${
                      isActive
                        ? 'bg-white'
                        : 'bg-slate-50/70 opacity-45 hover:opacity-90 hover:bg-white'
                    }`}
                    style={{
                      border: `2px solid ${isActive ? color : '#cbd5e1'}`,
                      backgroundColor: isActive ? `${color}08` : undefined,
                    }}
                    title={`${isActive ? 'Ocultar' : 'Mostrar'} ${sec.label} en el radar`}
                  >
                    <div className="flex items-center justify-between gap-1 min-w-0">
                      <div className="flex items-center gap-1.5 min-w-0">
                        <span
                          className="w-3.5 h-3.5 rounded-md shrink-0 flex items-center justify-center text-[9px] text-white font-black shadow-2xs"
                          style={{ backgroundColor: isActive ? color : '#94a3b8' }}
                        >
                          {isActive ? '✓' : ''}
                        </span>
                        <span className="font-extrabold text-xs text-slate-900 group-hover:text-blue-700 truncate">
                          {sec.label}
                        </span>
                      </div>
                      <span
                        className="px-1.5 py-0.2 rounded text-[9px] font-black shrink-0"
                        style={{
                          backgroundColor: `${nivel.color}15`,
                          color: nivel.color,
                        }}
                      >
                        {nivel.nombre}
                      </span>
                    </div>

                    <div className="flex items-baseline justify-between gap-1 mt-0.5 text-[11px]">
                      <span className="font-mono font-bold text-slate-800">
                        {pts} <span className="text-[9px] font-normal text-slate-400">pts</span>
                      </span>
                      <span
                        className="text-[10px] text-slate-500 truncate max-w-[95px]"
                        title={sec.docenteNombre}
                      >
                        {sec.docenteNombre ? sec.docenteNombre.split(' ')[0] : 'Doc.'} • {sec.total} al.
                      </span>
                    </div>
                  </button>
                );
              })}

              {/* Tarjeta de Referencia: Promedio General I.E. */}
              {seccionEtapasMetricasMap['__global__']?.etapas[comparativaEtapaKey] && (
                <button
                  type="button"
                  onClick={() => setShowIeBenchmark((prev) => !prev)}
                  className={`p-2 rounded-xl text-left transition-all cursor-pointer flex flex-col justify-between gap-1 shadow-2xs group ${
                    showIeBenchmark
                      ? 'bg-slate-50 border-2 border-dashed border-slate-600'
                      : 'bg-slate-50/50 border-2 border-dashed border-slate-300 opacity-45 hover:opacity-90 hover:bg-white'
                  }`}
                  title={`${showIeBenchmark ? 'Ocultar' : 'Mostrar'} la línea de referencia general de la I.E.`}
                >
                  <div className="flex items-center justify-between gap-1 min-w-0">
                    <div className="flex items-center gap-1.5 min-w-0">
                      <span
                        className="w-3.5 h-3.5 rounded-md shrink-0 flex items-center justify-center text-[9px] text-white font-black shadow-2xs"
                        style={{ backgroundColor: showIeBenchmark ? '#475569' : '#94a3b8' }}
                      >
                        {showIeBenchmark ? '✓' : ''}
                      </span>
                      <span className="font-extrabold text-xs text-slate-900 truncate">
                        Promedio I.E.
                      </span>
                    </div>
                    <span className="px-1.5 py-0.2 rounded text-[9px] font-black bg-slate-200 text-slate-700 shrink-0">
                      I.E.
                    </span>
                  </div>

                  <div className="flex items-baseline justify-between gap-1 mt-0.5 text-[11px]">
                    <span className="font-mono font-bold text-slate-800">
                      {seccionEtapasMetricasMap['__global__'].etapas[comparativaEtapaKey].promedioPuntaje || 0}{' '}
                      <span className="text-[9px] font-normal text-slate-400">pts</span>
                    </span>
                    <span className="text-[10px] text-slate-500">
                      {estudiantesEvolutivos.length} evaluados
                    </span>
                  </div>
                </button>
              )}
            </div>
          </div>

          {/* Gráfico Radar de Comparativa de Salones */}
          <div className="p-4 w-full flex flex-col items-center justify-center bg-white">
            <div className="w-full max-w-[950px] h-[400px] sm:h-[480px] lg:h-[540px] relative">
              <Radar data={seccionRadarChartData} options={seccionRadarOptions as any} />
            </div>
          </div>
        </div>
      </section>

      {/* ========================================================================= */}
      {/* MODAL EN PANTALLA COMPLETA TOTAL (PORTAL BODY, Z-[999999], EDGE-TO-EDGE)  */}
      {/* VISTA DUAL: EVOLUCIÓN DEL SALÓN vs VISTA POR ESTUDIANTE (COMO EN DOCENTE) */}
      {/* ========================================================================= */}
      {mounted && typeof document !== 'undefined' && isModalOpen && createPortal(
        <div
          className="fixed inset-0 w-screen h-screen min-h-screen z-[999999] bg-slate-100 flex flex-col overflow-hidden animate-fadeIn"
          role="dialog"
          aria-modal="true"
          aria-label={
            modalViewMode === 'seccion'
              ? `Evolución de ${modalSeccionItem?.label || 'Salón'}`
              : `Ficha evolutiva de ${modalStudent?.nombreCompleto || 'Estudiante'}`
          }
        >
          {/* 1. Modal Top Full-Width Header */}
          <header className="w-full bg-white border-b border-slate-200 px-4 sm:px-6 md:px-8 py-3 flex flex-col lg:flex-row lg:items-center justify-between gap-3 shrink-0 shadow-2xs z-20">
            {/* Contexto a la izquierda */}
            {modalViewMode === 'seccion' ? (
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-11 h-11 rounded-2xl bg-gradient-to-tr from-emerald-600 to-teal-600 text-white flex items-center justify-center font-bold text-lg shadow-xs shrink-0">
                  <MdSchool className="w-6 h-6" />
                </div>
                <div className="min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h2 className="text-base sm:text-lg font-black text-slate-900 tracking-tight truncate">
                      {modalSeccionItem?.label || 'Sección'}
                    </h2>
                    <select
                      value={modalSeccionId || selectedSeccion}
                      onChange={(e) => handleSwitchModalSeccion(e.target.value)}
                      className="text-xs font-bold text-slate-700 bg-slate-100 border border-slate-200 rounded-lg px-2 py-0.5 cursor-pointer shadow-2xs hover:bg-slate-200/60 transition-colors"
                      title="Cambiar de salón"
                    >
                      {seccionesResumen.map((s) => (
                        <option key={s.id} value={s.id}>
                          {s.label} ({s.total} alumnos)
                        </option>
                      ))}
                    </select>
                  </div>
                  <p className="text-xs text-slate-500 truncate mt-0.5">
                    Prof. {modalSeccionItem?.docenteNombre || 'Docente'} • {modalSeccionItem?.total || 0} estudiantes • {getGradoTexto(evaluacion.grado)}
                  </p>
                </div>
              </div>
            ) : (
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-11 h-11 rounded-2xl bg-gradient-to-tr from-blue-600 to-indigo-600 text-white flex items-center justify-center font-bold text-lg shadow-xs shrink-0">
                  <RiUser3Line className="w-6 h-6" />
                </div>
                <div className="min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h2 className="text-base sm:text-lg font-black text-slate-900 tracking-tight truncate">
                      {modalStudent?.nombreCompleto || modalStudent?.nombresApellidos || 'Estudiante'}
                    </h2>
                    {modalStudent?.seccion && (
                      <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-slate-100 text-slate-700 border border-slate-200">
                        Sec. {converSeccion(Number(modalStudent.seccion)) || modalStudent.seccion}
                      </span>
                    )}
                    {modalStudent && (() => {
                      const badge = resolveNivelBadge(modalStudent.puntajeFinal);
                      return (
                        <span
                          className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-bold border"
                          style={{
                            backgroundColor: `${badge.color}18`,
                            borderColor: `${badge.color}40`,
                            color: badge.color,
                          }}
                        >
                          {modalStudent.nivelFinal || badge.nombre}
                        </span>
                      );
                    })()}
                  </div>
                  <p className="text-xs text-slate-500 truncate mt-0.5">
                    DNI: <strong className="font-mono text-slate-700">{modalStudent?.dni}</strong> • {getGradoTexto(evaluacion.grado)} • Estudiante {modalStudentIndex + 1} de {modalSectionStudents.length}
                  </p>
                </div>
              </div>
            )}

            {/* Centro: CONMUTADOR DE PERSPECTIVA (Salón vs Estudiante) */}
            <div
              className="inline-flex items-center p-1 bg-slate-100 rounded-xl border border-slate-200 shadow-2xs self-center"
              role="tablist"
              aria-label="Conmutador de perspectiva"
            >
              <button
                type="button"
                role="tab"
                aria-selected={modalViewMode === 'seccion'}
                onClick={() => setModalViewMode('seccion')}
                className={`inline-flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  modalViewMode === 'seccion'
                    ? 'bg-emerald-600 text-white shadow-2xs'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
                }`}
              >
                <MdSchool className="w-4 h-4" />
                <span>Evolución del Salón</span>
              </button>
              <button
                type="button"
                role="tab"
                aria-selected={modalViewMode === 'estudiante'}
                onClick={() => setModalViewMode('estudiante')}
                className={`inline-flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  modalViewMode === 'estudiante'
                    ? 'bg-blue-600 text-white shadow-2xs'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
                }`}
              >
                <MdPerson className="w-4 h-4" />
                <span>Vista por Estudiante</span>
              </button>
            </div>

            {/* Derecha: Selector y Navegación entre Estudiantes + Acciones */}
            <div className="flex items-center gap-2 self-end lg:self-auto flex-wrap">
              {/* Botón de Búsqueda Spotlight (Ctrl + K) - Solo icono y atajo */}
              <button
                type="button"
                onClick={() => {
                  setSpotlightQuery('');
                  setSpotlightScopeOverride('seccion');
                  setIsSpotlightOpen(true);
                }}
                className="inline-flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-bold rounded-xl bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 shadow-2xs transition-colors cursor-pointer"
                title={`Buscar alumno en ${modalSeccionItem?.label || 'esta sección'} (Ctrl + K)`}
              >
                <MdSearch className="w-4 h-4 text-blue-600 shrink-0" />
                <kbd className="inline-block px-1.5 py-0.5 text-[10px] font-mono bg-slate-100 rounded border border-slate-200 text-slate-500">
                  Ctrl K
                </kbd>
              </button>

              {/* Navegación secuencial entre estudiantes (Anterior / Siguiente) */}
              {modalViewMode === 'estudiante' && modalSectionStudents.length > 1 && (
                <div className="inline-flex items-center p-0.5 bg-slate-50 border border-slate-200 rounded-xl shadow-2xs">
                  <button
                    type="button"
                    onClick={handlePrevStudent}
                    disabled={modalStudentIndex <= 0}
                    className="p-1.5 rounded-lg text-slate-600 hover:text-blue-600 hover:bg-white disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer transition-colors"
                    title="Estudiante anterior (Flecha Izquierda)"
                  >
                    <MdChevronLeft className="w-4 h-4" />
                  </button>
                  <span className="text-xs font-bold text-slate-600 px-2 min-w-[50px] text-center font-mono">
                    {modalStudentIndex + 1} / {modalSectionStudents.length}
                  </span>
                  <button
                    type="button"
                    onClick={handleNextStudent}
                    disabled={modalStudentIndex >= modalSectionStudents.length - 1}
                    className="p-1.5 rounded-lg text-slate-600 hover:text-blue-600 hover:bg-white disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer transition-colors"
                    title="Siguiente estudiante (Flecha Derecha)"
                  >
                    <MdChevronRight className="w-4 h-4" />
                  </button>
                </div>
              )}

              {/* Dropdown Impresión con QR - Solo icono y flecha */}
              <div className="relative inline-block" ref={modalPrintDropdownRef}>
                <button
                  type="button"
                  onClick={() => setIsModalPrintDropdownOpen((p) => !p)}
                  disabled={Boolean(exportingDni) || isExportingAll || Boolean(printingDni) || isPrintingAll}
                  className="inline-flex items-center gap-1 px-2.5 py-1.5 text-xs font-bold rounded-xl bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 shadow-2xs transition-colors cursor-pointer disabled:opacity-50"
                  title={
                    isPrintingAll
                      ? `Imprimiendo salón (${modalSectionStudents.length})...`
                      : printingDni
                      ? 'Imprimiendo ficha...'
                      : 'Opciones de impresión con QR'
                  }
                >
                  <MdPrint className={`w-4 h-4 text-slate-600 ${(printingDni || isPrintingAll) ? 'animate-bounce text-blue-600' : ''}`} />
                  <MdKeyboardArrowDown className={`w-3.5 h-3.5 transition-transform ${isModalPrintDropdownOpen ? 'rotate-180' : ''}`} />
                </button>

                {isModalPrintDropdownOpen && (
                  <div className="absolute right-0 mt-1.5 w-60 bg-white rounded-xl shadow-xl border border-slate-200/90 py-1.5 z-50 animate-fadeIn">
                    {modalViewMode === 'estudiante' && modalStudent && (
                      <button
                        type="button"
                        onClick={() => {
                          setIsModalPrintDropdownOpen(false);
                          handlePrintPDF(modalStudent);
                        }}
                        className="w-full text-left px-3 py-2 text-xs hover:bg-blue-50/70 text-slate-700 hover:text-blue-700 flex items-center gap-2 cursor-pointer"
                      >
                        <MdPerson className="w-4 h-4 text-blue-600 shrink-0" />
                        <span className="font-bold truncate">Imprimir este alumno</span>
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={() => {
                        setIsModalPrintDropdownOpen(false);
                        handlePrintBatchPDF(modalSectionStudents);
                      }}
                      className="w-full text-left px-3 py-2 text-xs hover:bg-emerald-50/70 text-slate-700 hover:text-emerald-700 flex items-center gap-2 cursor-pointer border-t border-slate-100"
                    >
                      <MdPeople className="w-4 h-4 text-emerald-600 shrink-0" />
                      <span className="font-bold">Imprimir todo el salón ({modalSectionStudents.length})</span>
                    </button>
                  </div>
                )}
              </div>

              {/* Dropdown Descargar PDF - Solo icono y flecha */}
              <div className="relative inline-block" ref={modalExportDropdownRef}>
                <button
                  type="button"
                  onClick={() => setIsModalExportDropdownOpen((p) => !p)}
                  disabled={Boolean(exportingDni) || isExportingAll}
                  className="inline-flex items-center gap-1 px-2.5 py-1.5 text-xs font-bold rounded-xl bg-blue-600 hover:bg-blue-700 text-white shadow-2xs transition-colors cursor-pointer disabled:bg-blue-400"
                  title={
                    isExportingAll
                      ? `Generando PDF salón (${modalSectionStudents.length})...`
                      : exportingDni
                      ? 'Generando PDF...'
                      : 'Opciones de descarga en PDF'
                  }
                >
                  <MdDownload className={`w-4 h-4 ${(exportingDni || isExportingAll) ? 'animate-bounce' : ''}`} />
                  <MdKeyboardArrowDown className={`w-3.5 h-3.5 transition-transform ${isModalExportDropdownOpen ? 'rotate-180' : ''}`} />
                </button>

                {isModalExportDropdownOpen && (
                  <div className="absolute right-0 mt-1.5 w-60 bg-white rounded-xl shadow-xl border border-slate-200/90 py-1.5 z-50 animate-fadeIn">
                    {modalViewMode === 'estudiante' && modalStudent && (
                      <button
                        type="button"
                        onClick={() => {
                          setIsModalExportDropdownOpen(false);
                          handleExportPDF(modalStudent);
                        }}
                        className="w-full text-left px-3 py-2 text-xs hover:bg-blue-50/70 text-slate-700 hover:text-blue-700 flex items-center gap-2 cursor-pointer"
                      >
                        <MdPerson className="w-4 h-4 text-blue-600 shrink-0" />
                        <span className="font-bold truncate">Descargar este alumno</span>
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={() => {
                        setIsModalExportDropdownOpen(false);
                        handleExportBatchPDF(modalSectionStudents, modalSeccionItem?.label || 'Salon');
                      }}
                      className="w-full text-left px-3 py-2 text-xs hover:bg-emerald-50/70 text-slate-700 hover:text-emerald-700 flex items-center gap-2 cursor-pointer border-t border-slate-100"
                    >
                      <MdPeople className="w-4 h-4 text-emerald-600 shrink-0" />
                      <span className="font-bold">Descargar todo el salón ({modalSectionStudents.length})</span>
                    </button>
                  </div>
                )}
              </div>

              {/* Botón Cerrar (ESC) */}
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl text-xs font-bold text-slate-700 hover:text-rose-600 bg-slate-100 hover:bg-rose-50 border border-slate-200 hover:border-rose-200 transition-colors cursor-pointer"
                title="Cerrar pantalla completa (Esc)"
              >
                <MdClose className="w-4 h-4" />
                <kbd className="inline-block px-1.5 py-0.5 text-[10px] font-mono bg-white rounded border border-slate-300 text-slate-500">
                  ESC
                </kbd>
              </button>
            </div>
          </header>

          {/* 2. Sub-Bar: KPIs del Salón/Alumno, Capas Evaluativas y Conmutador de Representación */}
          {modalViewMode === 'seccion' ? (
            <div className="w-full bg-white/95 backdrop-blur-xs border-b border-slate-200/80 px-4 sm:px-6 md:px-8 py-2.5 flex flex-col lg:flex-row lg:items-center justify-between gap-3 shrink-0 z-10">
              <div className="flex items-center gap-2.5 flex-wrap">
                <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-xl text-xs font-bold border shadow-2xs ${
                  (modalSeccionItem?.delta || 0) > 0
                    ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
                    : (modalSeccionItem?.delta || 0) < 0
                    ? 'bg-rose-50 border-rose-200 text-rose-800'
                    : 'bg-slate-50 border-slate-200 text-slate-700'
                }`}>
                  {(modalSeccionItem?.delta || 0) > 0 ? (
                    <MdTrendingUp className="w-4 h-4 text-emerald-600" />
                  ) : (modalSeccionItem?.delta || 0) < 0 ? (
                    <MdTrendingDown className="w-4 h-4 text-rose-600" />
                  ) : (
                    <MdTrendingFlat className="w-4 h-4 text-slate-500" />
                  )}
                  <span>
                    {(modalSeccionItem?.delta || 0) > 0
                      ? `+${modalSeccionItem?.delta} pts de mejora en el aula`
                      : `${modalSeccionItem?.delta} pts`}
                  </span>
                </span>

                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl text-xs font-semibold bg-slate-50 border border-slate-200 text-slate-700 shadow-2xs">
                  <span className="text-emerald-700 font-bold">{modalSeccionItem?.total ? Math.round((modalSeccionItem.totalSuperacion / modalSeccionItem.total) * 100) : 0}% subieron</span>
                  <span>•</span>
                  <span className="text-rose-600 font-bold">{modalSeccionItem?.total ? Math.round((modalSeccionItem.totalAlerta / modalSeccionItem.total) * 100) : 0}% alerta</span>
                </span>

                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl text-xs font-semibold bg-slate-50 border border-slate-200 text-slate-700 shadow-2xs">
                  <MdGroups className="w-4 h-4 text-slate-500" />
                  <span>{modalSeccionItem?.total || 0} estudiantes evaluados</span>
                </span>
              </div>

              <div className="flex items-center gap-2.5 flex-wrap self-end lg:self-auto">
                {/* Capas de Evaluación (EDI, EP1, EP2) */}
                <div className="flex items-center gap-1 bg-slate-50 p-1 rounded-xl border border-slate-200 shadow-2xs">
                  <span className="p-1 text-slate-400 flex items-center justify-center shrink-0" title="Capas de evaluación">
                    <MdLayers className="w-3.5 h-3.5" />
                  </span>
                  <div className="flex items-center gap-1">
                    {etapasConfiguradas.map((etapa) => {
                      const isChecked = activeStages[etapa.key] ?? true;
                      const color = etapa.key === 'edi' ? '#2563eb' : etapa.key === 'ep1' ? '#f59e0b' : '#10b981';
                      return (
                        <button
                          key={`modal-pill-sec-${etapa.key}`}
                          type="button"
                          onClick={() => toggleStage(etapa.key)}
                          className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer border select-none ${
                            isChecked
                              ? 'bg-white border-slate-200 text-slate-800 shadow-2xs'
                              : 'bg-transparent border-transparent text-slate-400 hover:text-slate-600'
                          }`}
                          title={`Alternar visualización de ${etapa.label}`}
                        >
                          <span
                            className="w-2 h-2 rounded-full shrink-0"
                            style={{ backgroundColor: isChecked ? color : '#cbd5e1' }}
                          />
                          <span style={{ color: isChecked ? color : undefined }}>
                            {etapa.key.toUpperCase()}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Botón de alternar matriz de criterios */}
                <button
                  type="button"
                  onClick={() => setModalShowRadarTable((prev) => !prev)}
                  className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold rounded-xl border transition-colors cursor-pointer shadow-2xs ${
                    modalShowRadarTable
                      ? 'bg-slate-900 text-white border-slate-900'
                      : 'bg-white text-slate-700 hover:bg-slate-50 border-slate-200'
                  }`}
                >
                  <MdTableChart className="w-4 h-4" />
                  <span>{modalShowRadarTable ? 'Ver Radar' : 'Ver Matriz de Criterios'}</span>
                </button>
              </div>
            </div>
          ) : (
            <div className="w-full bg-white/95 backdrop-blur-xs border-b border-slate-200/80 px-4 sm:px-6 md:px-8 py-2.5 flex flex-col lg:flex-row lg:items-center justify-between gap-3 shrink-0 z-10">
              <div className="flex items-center gap-2.5 flex-wrap">
                {modalStudent?.estadoTrayectoria === 'superacion' && (
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl text-xs font-bold bg-emerald-50 border border-emerald-200 text-emerald-800 shadow-2xs">
                    <MdTrendingUp className="w-4 h-4 text-emerald-600" />
                    <span>Superación ({modalStudent.deltaPuntaje > 0 ? `+${modalStudent.deltaPuntaje}` : modalStudent.deltaPuntaje} pts)</span>
                  </span>
                )}
                {modalStudent?.estadoTrayectoria === 'alerta' && (
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl text-xs font-bold bg-rose-50 border border-rose-200 text-rose-800 shadow-2xs">
                    <MdTrendingDown className="w-4 h-4 text-rose-600" />
                    <span>En Alerta ({modalStudent.deltaPuntaje} pts)</span>
                  </span>
                )}
                {modalStudent?.estadoTrayectoria === 'estable' && (
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl text-xs font-bold bg-amber-50 border border-amber-200 text-amber-800 shadow-2xs">
                    <MdTrendingFlat className="w-4 h-4 text-amber-600" />
                    <span>Estable ({modalStudent.deltaPuntaje > 0 ? `+${modalStudent.deltaPuntaje}` : modalStudent.deltaPuntaje} pts)</span>
                  </span>
                )}

                {modalStudent && (
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl text-xs font-semibold bg-slate-50 border border-slate-200 text-slate-700 shadow-2xs">
                    <span className="text-slate-500">Vs. Promedio Aula:</span>
                    <strong className={modalStudent.diferenciaConAula >= 0 ? 'text-blue-600 font-bold' : 'text-slate-700 font-bold'}>
                      {modalStudent.diferenciaConAula > 0 ? `+${modalStudent.diferenciaConAula}` : modalStudent.diferenciaConAula} pts
                    </strong>
                  </span>
                )}
              </div>

              <div className="flex items-center gap-2.5 flex-wrap self-end lg:self-auto">
                {/* Capas de Evaluación */}
                <div className="flex items-center gap-1 bg-slate-50 p-1 rounded-xl border border-slate-200 shadow-2xs">
                  <span className="p-1 text-slate-400 flex items-center justify-center shrink-0" title="Capas de evaluación">
                    <MdLayers className="w-3.5 h-3.5" />
                  </span>
                  <div className="flex items-center gap-1">
                    {etapasConfiguradas.map((etapa) => {
                      const isChecked = activeStages[etapa.key] ?? true;
                      const color = etapa.key === 'edi' ? '#2563eb' : etapa.key === 'ep1' ? '#f59e0b' : '#10b981';
                      const tieneDatos = !!modalStudent?.etapas[etapa.key];

                      return (
                        <button
                          key={`modal-pill-est-${etapa.key}`}
                          type="button"
                          onClick={() => tieneDatos && toggleStage(etapa.key)}
                          disabled={!tieneDatos}
                          className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer border select-none ${
                            !tieneDatos
                              ? 'opacity-35 cursor-not-allowed bg-transparent border-dashed border-slate-300 text-slate-400'
                              : isChecked
                              ? 'bg-white border-slate-200 text-slate-800 shadow-2xs'
                              : 'bg-transparent border-transparent text-slate-400 hover:text-slate-600'
                          }`}
                          title={tieneDatos ? `Alternar ${etapa.label}` : `Sin evaluación en ${etapa.label}`}
                        >
                          <span
                            className="w-2 h-2 rounded-full shrink-0"
                            style={{ backgroundColor: isChecked ? color : '#cbd5e1' }}
                          />
                          <span style={{ color: isChecked ? color : undefined }}>
                            {etapa.key.toUpperCase()}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Controles de Radar cuando esté en modo radar */}
                {modalVisualMode === 'radar' && (
                  <DocenteRadarControls
                    chartLayoutMode={radarLayoutMode}
                    onLayoutModeSelect={setRadarLayoutMode}
                    orderDirection={radarOrderDirection}
                    onOrderDirectionChange={setRadarOrderDirection}
                    splitInTwo={radarSplitInTwo}
                    onToggleSplitInTwo={() => setRadarSplitInTwo((prev) => !prev)}
                    showTable={modalShowRadarTable}
                    onToggleShowTable={() => setModalShowRadarTable((prev) => !prev)}
                    textScale={radarTextScale}
                    onTextScaleChange={(scale) => {
                      setRadarTextScale(scale);
                      saveStoredTextScale(scale);
                    }}
                  />
                )}

                {/* Conmutador Trayectoria Línea vs Radar */}
                <div
                  className="inline-flex items-center p-1 bg-slate-100 rounded-xl border border-slate-200 shadow-2xs"
                  role="group"
                  aria-label="Conmutador de visualización de gráfico"
                >
                  <button
                    type="button"
                    onClick={() => setModalVisualMode('line')}
                    className={`p-1.5 sm:px-2.5 sm:py-1.5 rounded-lg transition-all cursor-pointer flex items-center justify-center ${
                      modalVisualMode === 'line'
                        ? 'bg-blue-600 text-white shadow-2xs'
                        : 'text-slate-500 hover:text-slate-800 hover:bg-slate-200/60'
                    }`}
                    title="Trayectoria (Línea)"
                  >
                    <MdTimeline className="w-4 h-4" />
                  </button>
                  <button
                    type="button"
                    onClick={() => setModalVisualMode('radar')}
                    className={`p-1.5 sm:px-2.5 sm:py-1.5 rounded-lg transition-all cursor-pointer flex items-center justify-center ${
                      modalVisualMode === 'radar'
                        ? 'bg-blue-600 text-white shadow-2xs'
                        : 'text-slate-500 hover:text-slate-800 hover:bg-slate-200/60'
                    }`}
                    title="Actuaciones (Radar)"
                  >
                    <TbChartRadar className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* 3. Modal Scrollable Body */}
          <main className="flex-1 w-full overflow-y-auto px-4 sm:px-6 md:px-8 py-6 space-y-6 bg-slate-100/70">
            {modalViewMode === 'seccion' ? (
              /* ======================================================= */
              /* PERSPECTIVA 1: EVOLUCIÓN GLOBAL DEL SALÓN SELECCIONADO  */
              /* ======================================================= */
              <div className="max-w-7xl mx-auto space-y-6 w-full animate-fadeIn">
                {/* 1.1 Tarjetas de resumen por Etapa Evaluativa */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5">
                  {etapasConfiguradas
                    .filter((etapa) => activeStages[etapa.key] ?? true)
                    .map((etapa) => {
                      const targetSecKey = modalSeccionId || selectedSeccion || '__global__';
                      const metrica = seccionEtapasMetricasMap[targetSecKey]?.etapas[etapa.key];
                      const pts = metrica?.promedioPuntaje || 0;
                      const nivelInfo = resolveNivelBadge(pts);
                      const color = etapa.key === 'edi' ? '#2563eb' : etapa.key === 'ep1' ? '#f59e0b' : '#10b981';

                      return (
                        <div
                          key={`modal-kpi-stage-${etapa.key}`}
                          className="p-4 rounded-2xl border border-slate-200/90 bg-white shadow-2xs hover:shadow-xs transition-shadow"
                        >
                          <div className="flex items-center justify-between mb-2">
                            <div className="flex items-center gap-2">
                              <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: color }} />
                              <span className="text-xs font-bold text-slate-700 truncate">{etapa.label}</span>
                            </div>
                            <span
                              className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold border"
                              style={{
                                backgroundColor: `${nivelInfo.color}15`,
                                borderColor: `${nivelInfo.color}40`,
                                color: nivelInfo.color,
                              }}
                            >
                              {nivelInfo.nombre}
                            </span>
                          </div>
                          <div className="flex items-baseline gap-1 mt-1">
                            <span className="text-2xl font-black text-slate-900">{pts}</span>
                            <span className="text-xs text-slate-400 font-semibold">pts promedio</span>
                          </div>
                          <div className="mt-2.5 pt-2 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
                            <span>Aciertos: <strong className="text-slate-700 font-bold">{metrica?.promedioPorcentaje || 0}%</strong></span>
                            <span>Evaluados: <strong className="text-slate-700 font-bold">{metrica?.totalParticipantes || 0}</strong></span>
                          </div>
                        </div>
                      );
                    })}
                </div>

                {/* 1.2 Radar de Competencias del Salón */}
                {!modalShowRadarTable && (
                  <div className="bg-white rounded-2xl border border-slate-200/90 p-5 sm:p-6 shadow-2xs animate-fadeIn">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 mb-4 border-b border-slate-100 gap-2">
                      <div className="flex items-center gap-2">
                        <div className="w-2.5 h-4 bg-emerald-600 rounded-xs" />
                        <h4 className="text-sm sm:text-base font-extrabold text-slate-900">
                          Radar de Competencias y Actuaciones Pedagógicas • {modalSeccionItem?.label}
                        </h4>
                      </div>
                      <span className="text-xs font-bold text-slate-500 bg-slate-50 px-2.5 py-1 rounded-lg border border-slate-200">
                        Escala 0 a 100% de Logro Pedagógico
                      </span>
                    </div>
                    <div className="h-[480px] sm:h-[580px] md:h-[620px] w-full flex items-center justify-center relative">
                      <Radar data={seccionModalRadarChartData} options={seccionRadarOptions as any} />
                    </div>
                  </div>
                )}

                {/* 1.3 Tabla de Desglose Pedagógico por Actuación / Criterio */}
                <div className="bg-white rounded-2xl border border-slate-200/90 p-5 shadow-2xs animate-fadeIn">
                  <div className="flex items-center justify-between pb-3 mb-4 border-b border-slate-100">
                    <div className="flex items-center gap-2">
                      <div className="w-2.5 h-4 bg-blue-600 rounded-xs" />
                      <h4 className="text-sm sm:text-base font-extrabold text-slate-900">
                        Desglose Pedagógico por Actuación / Criterio ({catalogoActuaciones.length} criterios evaluados)
                      </h4>
                    </div>
                    <span className="text-xs text-slate-500 font-semibold">
                      Logro promedio del aula en cada etapa
                    </span>
                  </div>

                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs">
                      <thead>
                        <tr className="border-b border-slate-200 bg-slate-50/75 text-slate-600 font-bold">
                          <th className="py-2.5 px-3 text-center w-12">N°</th>
                          <th className="py-2.5 px-3 min-w-[240px]">Actuación / Competencia Pedagógica</th>
                          {etapasConfiguradas
                            .filter((e) => activeStages[e.key] ?? true)
                            .map((e) => (
                              <th key={`modal-th-criterio-${e.key}`} className="py-2.5 px-3 text-center min-w-[110px]">
                                {e.label}
                              </th>
                            ))}
                          <th className="py-2.5 px-3 text-center min-w-[100px]">Variación (Δ)</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {catalogoActuaciones.map((act) => {
                          const targetSecKey = modalSeccionId || selectedSeccion || '__global__';
                          const modalSecMetrica = seccionEtapasMetricasMap[targetSecKey];
                          const activeEtapas = etapasConfiguradas.filter((e) => activeStages[e.key] ?? true);
                          const firstEtapa = activeEtapas[0];
                          const lastEtapa = activeEtapas[activeEtapas.length - 1];

                          const firstTasa = firstEtapa ? (modalSecMetrica?.etapas[firstEtapa.key]?.tasaLogroPorActuacion[act.order] ?? 0) : 0;
                          const lastTasa = lastEtapa ? (modalSecMetrica?.etapas[lastEtapa.key]?.tasaLogroPorActuacion[act.order] ?? 0) : 0;
                          const deltaCriterio = Number((lastTasa - firstTasa).toFixed(1));

                          return (
                            <tr key={`modal-row-criterio-${act.order}`} className="hover:bg-slate-50/80 transition-colors">
                              <td className="py-2 px-3 text-center font-mono font-bold text-slate-500">
                                {act.order}
                              </td>
                              <td className="py-2 px-3">
                                <span className="font-semibold text-slate-800">{act.actuacion}</span>
                              </td>
                              {activeEtapas.map((etapa) => {
                                const metricaEtapa = modalSecMetrica?.etapas[etapa.key];
                                const tasa = metricaEtapa?.tasaLogroPorActuacion[act.order] ?? 0;

                                return (
                                  <td key={`modal-cell-crit-${act.order}-${etapa.key}`} className="py-2 px-3 text-center">
                                    <div className="flex flex-col items-center">
                                      <span className="font-extrabold text-slate-900 text-xs">
                                        {tasa}%
                                      </span>
                                      <div className="w-16 h-1 rounded-full bg-slate-100 overflow-hidden mt-1">
                                        <div
                                          style={{ width: `${Math.min(100, Math.max(0, tasa))}%` }}
                                          className={`h-full ${
                                            tasa >= 75
                                              ? 'bg-emerald-500'
                                              : tasa >= 50
                                              ? 'bg-amber-500'
                                              : 'bg-rose-500'
                                          }`}
                                        />
                                      </div>
                                    </div>
                                  </td>
                                );
                              })}
                              <td className="py-2 px-3 text-center">
                                <span className={`inline-flex items-center gap-0.5 px-2 py-0.5 rounded-full text-[11px] font-black ${
                                  deltaCriterio > 0
                                    ? 'bg-emerald-50 text-emerald-700'
                                    : deltaCriterio < 0
                                    ? 'bg-rose-50 text-rose-700'
                                    : 'bg-slate-50 text-slate-600'
                                }`}>
                                  {deltaCriterio > 0 ? `+${deltaCriterio}%` : `${deltaCriterio}%`}
                                </span>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            ) : (
              /* ======================================================= */
              /* PERSPECTIVA 2: VISTA INDIVIDUAL DEL ESTUDIANTE (DOCENTE) */
              /* ======================================================= */
              <div className="w-full">
                {!modalStudent ? (
                  <div className="p-12 text-center bg-white rounded-2xl border border-slate-200">
                    <MdPerson className="w-12 h-12 text-slate-300 mx-auto mb-3" />
                    <h4 className="text-base font-bold text-slate-700">No hay estudiantes evaluados en este salón</h4>
                  </div>
                ) : modalVisualMode === 'line' ? (
                  /* SOLO GRÁFICO LINEAL A TODO EL ANCHO */
                  <div className="max-w-6xl mx-auto space-y-6 w-full animate-fadeIn">
                    <div className="bg-white rounded-2xl border border-slate-200/80 p-5 sm:p-6 shadow-2xs">
                      <div className="flex items-center justify-between pb-3 mb-4 border-b border-slate-100">
                        <div className="flex items-center gap-2">
                          <div className="w-2.5 h-4 bg-blue-600 rounded-xs" />
                          <h4 className="text-sm sm:text-base font-bold text-slate-800">
                            Trayectoria Longitudinal de Puntaje
                          </h4>
                        </div>
                        <span className="text-xs font-semibold text-slate-500 bg-slate-100 px-2.5 py-1 rounded-md border border-slate-200">
                          Escala 0 a {calculateStudentMaxY(modalStudent)} pts
                        </span>
                      </div>
                      <div className="h-72 sm:h-80 w-full">
                        <Line
                          data={buildStudentChartData(modalStudent)}
                          options={buildStudentChartOptions(calculateStudentMaxY(modalStudent))}
                        />
                      </div>
                    </div>

                    {/* Tarjetas de Detalle por Etapa Evaluativa */}
                    <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-2xs">
                      <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider mb-3">
                        Detalle por Etapa Evaluativa
                      </h4>
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                        {etapasConfiguradas
                          .filter((etapa) => activeStages[etapa.key] ?? true)
                          .map((etapa) => {
                            const item = modalStudent?.etapas[etapa.key];
                            const color = etapa.key === 'edi' ? '#2563eb' : etapa.key === 'ep1' ? '#f59e0b' : '#10b981';

                            if (!item) {
                              return (
                                <div
                                  key={`det-stage-${etapa.key}`}
                                  className="p-4 rounded-xl border border-dashed border-slate-200 bg-slate-50/50 flex flex-col items-center justify-center text-center min-h-[100px]"
                                >
                                  <span className="text-xs font-bold text-slate-400">{etapa.label}</span>
                                  <span className="text-xs text-slate-400 mt-1">Sin evaluación registrada</span>
                                </div>
                              );
                            }

                            return (
                              <div
                                key={`det-stage-${etapa.key}`}
                                className="p-4 rounded-xl border border-slate-200/80 bg-white shadow-2xs"
                              >
                                <div className="flex items-center justify-between mb-2">
                                  <span className="text-xs font-bold text-slate-700 truncate flex items-center gap-1.5">
                                    <span className="w-2.5 h-2.5 rounded-full inline-block shrink-0" style={{ backgroundColor: color }} />
                                    <span>{etapa.label}</span>
                                  </span>
                                  <span
                                    className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold"
                                    style={{
                                      backgroundColor: `${item.nivelColor}18`,
                                      color: item.nivelColor,
                                    }}
                                  >
                                    {item.nivel}
                                  </span>
                                </div>
                                <div className="flex items-baseline gap-1 mt-1">
                                  <span className="text-2xl font-black text-slate-900">{item.puntaje}</span>
                                  <span className="text-xs text-slate-400">/ {item.maxPuntaje} pts</span>
                                </div>
                                <div className="mt-2.5 pt-2 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
                                  <span>Aciertos:</span>
                                  <span className="font-semibold text-slate-700">
                                    {item.respuestasCorrectas}/{item.totalPreguntas} ({item.porcentaje}%)
                                  </span>
                                </div>
                              </div>
                            );
                          })}
                      </div>
                    </div>
                  </div>
                ) : (
                  /* SOLO GRÁFICO RETICULAR (RADAR) DE ACTUACIONES PEDAGÓGICAS A TODO EL ANCHO */
                  <div className="w-full max-w-[1920px] mx-auto animate-fadeIn px-1 sm:px-2">
                    <DocenteActuacionesRadarChart
                      student={modalStudent}
                      etapasConfiguradas={etapasConfiguradas}
                      catalogoActuaciones={catalogoActuaciones}
                      activeStages={activeStages}
                      onToggleStage={toggleStage}
                      layoutMode={radarLayoutMode}
                      onLayoutModeChange={setRadarLayoutMode}
                      splitInTwo={radarSplitInTwo}
                      onSplitInTwoChange={setRadarSplitInTwo}
                      orderDirection={radarOrderDirection}
                      onOrderDirectionChange={setRadarOrderDirection}
                      showTable={modalShowRadarTable}
                      onToggleTable={() => setModalShowRadarTable((prev) => !prev)}
                      textScale={radarTextScale}
                      onTextScaleChange={(scale) => {
                        setRadarTextScale(scale);
                        saveStoredTextScale(scale);
                      }}
                      hideHeader={true}
                    />
                  </div>
                )}
              </div>
            )}
          </main>
        </div>,
        document.body
      )}

      {/* ========================================================================= */}
      {/* 5. SPOTLIGHT / COMMAND PALETTE BUSCADOR INTELIGENTE POR ALUMNO (CTRL + K)  */}
      {/* ========================================================================= */}
      {mounted && typeof document !== 'undefined' && isSpotlightOpen && createPortal(
        <div
          className="fixed inset-0 w-screen h-screen z-[1000000] bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-3 sm:p-6 animate-fadeIn"
          role="dialog"
          aria-modal="true"
          aria-label="Buscador inteligente de estudiantes"
          onClick={(e) => {
            if (e.target === e.currentTarget) {
              setIsSpotlightOpen(false);
            }
          }}
        >
          <div
            className="w-full max-w-3xl bg-white rounded-2xl shadow-xl border border-slate-200/90 overflow-hidden flex flex-col max-h-[85vh] animate-spotlight"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header del Buscador Spotlight con Input Grande */}
            <div className="p-3.5 sm:p-4 border-b border-slate-100 bg-white relative flex items-center gap-3">
              <button
                type="button"
                onClick={() => setSpotlightQuery('')}
                className="text-slate-400 hover:text-blue-600 transition-colors cursor-pointer p-1 rounded-lg hover:bg-slate-50 shrink-0 group"
                title="Clic en la lupa para mostrar todos"
                aria-label="Mostrar toda la lista"
              >
                <MdSearch className="w-5 h-5 text-slate-400 group-hover:text-blue-600 transition-colors" />
              </button>

              <input
                type="text"
                autoFocus
                value={spotlightQuery}
                onChange={(e) => setSpotlightQuery(e.target.value)}
                placeholder={
                  activeSpotlightSectionLabel && spotlightScopeOverride === 'seccion'
                    ? `Buscar en ${activeSpotlightSectionLabel} por nombre, apellidos o DNI...`
                    : 'Buscar estudiante por nombre, apellidos o DNI (ej. Franco Condori)...'
                }
                className="flex-1 text-sm sm:text-base font-semibold text-slate-800 placeholder:text-slate-400 outline-none bg-transparent"
              />

              <div className="flex items-center gap-2 shrink-0">
                {spotlightQuery && (
                  <button
                    type="button"
                    onClick={() => setSpotlightQuery('')}
                    className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg text-xs font-bold transition-colors cursor-pointer"
                    title="Limpiar búsqueda"
                  >
                    ✕
                  </button>
                )}

                <button
                  type="button"
                  onClick={() => setIsSpotlightOpen(false)}
                  className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-medium rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-600 transition-colors cursor-pointer border border-slate-200"
                  title="Cerrar búsqueda (Esc)"
                >
                  <MdClose className="w-3.5 h-3.5" />
                  <span>ESC</span>
                </button>
              </div>
            </div>

            {/* Barra Informativa de Resultados con Filtro de Ámbito (Salón vs I.E. Global) */}
            <div className="px-4 py-2 bg-slate-50/70 border-b border-slate-100 flex flex-wrap items-center justify-between gap-2 text-xs text-slate-500">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="font-medium">
                  {spotlightQuery.trim()
                    ? `Resultados encontrados: ${spotlightResults.length} de ${targetSpotlightStudents.length}`
                    : `Estudiantes disponibles (${targetSpotlightStudents.length})`}
                </span>
                {activeSpotlightSectionLabel && (
                  <div className="inline-flex items-center rounded-lg border border-slate-200 p-0.5 bg-white text-[11px] font-bold shadow-2xs">
                    <button
                      type="button"
                      onClick={() => setSpotlightScopeOverride('seccion')}
                      className={`px-2 py-0.5 rounded cursor-pointer transition-colors ${
                        spotlightScopeOverride === 'seccion'
                          ? 'bg-blue-600 text-white'
                          : 'text-slate-600 hover:text-blue-600'
                      }`}
                      title={`Filtrar únicamente alumnos de ${activeSpotlightSectionLabel}`}
                    >
                      {activeSpotlightSectionLabel}
                    </button>
                    <button
                      type="button"
                      onClick={() => setSpotlightScopeOverride('todos')}
                      className={`px-2 py-0.5 rounded cursor-pointer transition-colors ${
                        spotlightScopeOverride === 'todos'
                          ? 'bg-blue-600 text-white'
                          : 'text-slate-600 hover:text-blue-600'
                      }`}
                      title="Buscar en todos los salones de la institución"
                    >
                      Toda la I.E.
                    </button>
                  </div>
                )}
              </div>

              <div className="flex items-center gap-2">
                {spotlightQuery.trim() && (
                  <button
                    type="button"
                    onClick={() => setSpotlightQuery('')}
                    className="text-blue-600 hover:text-blue-700 font-bold hover:underline cursor-pointer"
                  >
                    Mostrar todos
                  </button>
                )}
                <span className="hidden sm:inline text-slate-400">
                  Atajo: <kbd className="px-1 py-0.5 font-mono text-[10px] bg-white border border-slate-200 rounded">Ctrl</kbd> + <kbd className="px-1 py-0.5 font-mono text-[10px] bg-white border border-slate-200 rounded">K</kbd>
                </span>
              </div>
            </div>

            {/* Lista Cómoda y Amplia de Estudiantes */}
            <div className="flex-1 overflow-y-auto p-3 sm:p-4 space-y-2 max-h-[500px]">
              {spotlightResults.length === 0 ? (
                <div className="py-12 text-center text-slate-400">
                  <MdInfoOutline className="w-10 h-10 mx-auto mb-2 text-slate-300" />
                  <h4 className="text-sm font-bold text-slate-700">No se encontraron estudiantes</h4>
                  <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
                    {spotlightQuery
                      ? `No hay coincidencias para "${spotlightQuery}" ${
                          activeSpotlightSectionLabel && spotlightScopeOverride === 'seccion'
                            ? `en ${activeSpotlightSectionLabel}`
                            : ''
                        }. Intenta combinando nombre, apellido o DNI.`
                      : 'No hay estudiantes registrados en este grupo.'}
                  </p>
                  {spotlightQuery && (
                    <button
                      type="button"
                      onClick={() => setSpotlightQuery('')}
                      className="mt-3 px-3.5 py-1.5 text-xs font-semibold bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 rounded-xl shadow-2xs cursor-pointer"
                    >
                      Mostrar lista completa
                    </button>
                  )}
                </div>
              ) : (
                spotlightResults.map((est, idx) => {
                  const isSelected = modalStudent?.dni === est.dni;
                  const nivelBadge = resolveNivelBadge(est.puntajeFinal ?? est.puntajeInicial);

                  return (
                    <div
                      key={est.dni}
                      onClick={() => handleSelectSpotlightStudent(est)}
                      className={`group px-3.5 py-2.5 sm:px-4 sm:py-3 rounded-xl border transition-all cursor-pointer flex items-center justify-between gap-3 ${
                        isSelected
                          ? 'bg-slate-50/90 border-slate-300 shadow-2xs ring-1 ring-slate-300/40'
                          : 'bg-white border-slate-200/70 hover:border-slate-300 hover:bg-slate-50/60 hover:shadow-2xs'
                      }`}
                      title="Haz clic para abrir la ficha evolutiva y radar individual"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="w-8 h-8 rounded-lg bg-slate-100/90 group-hover:bg-slate-200/70 text-slate-500 group-hover:text-slate-700 font-mono font-semibold text-xs flex items-center justify-center shrink-0 border border-slate-200/60 transition-colors">
                          {idx + 1}
                        </div>
                        <div className="min-w-0">
                          <h4 className="text-sm font-bold text-slate-800 group-hover:text-blue-700 transition-colors truncate">
                            {est.nombreCompleto || est.nombresApellidos}
                          </h4>
                          <div className="flex items-center gap-2 text-xs text-slate-400 font-mono mt-0.5 flex-wrap">
                            <span>
                              DNI: <strong className="text-slate-600 font-medium">{est.dni}</strong>
                            </span>
                            <span>•</span>
                            <span>
                              Sec:{' '}
                              <strong className="text-slate-600 font-medium">
                                {converSeccion(Number(est.seccion)) || est.seccion || '—'}
                              </strong>
                            </span>
                            <span>•</span>
                            <span className="text-slate-500 font-sans">
                              {est.puntajeFinal ?? est.puntajeInicial} pts ({est.nivelFinal || est.nivelInicial || nivelBadge.nombre})
                            </span>
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-2.5 shrink-0">
                        {/* Badges de Trayectoria Suaves */}
                        {est.estadoTrayectoria === 'superacion' && (
                          <span className="hidden sm:inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200/60">
                            <MdTrendingUp className="w-3.5 h-3.5 text-emerald-600" />
                            <span>Superación</span>
                          </span>
                        )}
                        {est.estadoTrayectoria === 'alerta' && (
                          <span className="hidden sm:inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-rose-50 text-rose-700 border border-rose-200/60">
                            <MdTrendingDown className="w-3.5 h-3.5 text-rose-600" />
                            <span>En Alerta</span>
                          </span>
                        )}
                        {est.estadoTrayectoria === 'estable' && (
                          <span className="hidden sm:inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-amber-50 text-amber-700 border border-amber-200/60">
                            <MdTrendingFlat className="w-3.5 h-3.5 text-amber-600" />
                            <span>Estable</span>
                          </span>
                        )}

                        {/* Botón Ver Ficha */}
                        <button
                          type="button"
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold bg-slate-50 group-hover:bg-blue-50 text-slate-600 group-hover:text-blue-700 border border-slate-200 group-hover:border-blue-200 transition-all shadow-2xs"
                        >
                          <span>Ver Ficha</span>
                          <MdOpenInNew className="w-3.5 h-3.5 text-slate-400 group-hover:text-blue-500 transition-colors" />
                        </button>
                      </div>
                    </div>
                  );
                })
              )}
            </div>

            {/* Footer con Ayuda */}
            <div className="p-3 bg-slate-50 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-400">
              <span>Haz clic en un estudiante para abrir su ficha pedagógica y radar longitudinal</span>
              <div className="flex items-center gap-1.5">
                <span>Cerrar con</span>
                <kbd className="px-1.5 py-0.5 bg-white border border-slate-200 rounded font-mono font-bold text-slate-500">ESC</kbd>
              </div>
            </div>
          </div>
        </div>,
        document.body
      )}
    </div>
  );
};

export default DirectorEvolucionEstudiantesTab;
