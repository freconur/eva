import React, { useEffect, useState, useRef, useMemo, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { useRouter } from 'next/router';
import Link from 'next/link';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';
import { Bar, Pie } from 'react-chartjs-2';
import {
  RiLoader4Line,
  RiInformationLine,
  RiBarChartGroupedLine,
  RiBarChartHorizontalLine,
  RiBarChart2Line,
  RiFullscreenLine,
  RiCloseLine,
  RiArrowLeftSLine,
  RiArrowRightSLine,
  RiPaletteLine,
  RiRefreshLine,
  RiAwardLine,
  RiGroupLine,
  RiGovernmentLine,
  RiLayoutGridLine,
  RiGridFill,
  RiEqualizerLine,
  RiArrowDownSLine,
  RiBuilding4Line,
  RiGraduationCapLine,
} from 'react-icons/ri';
import { MdArrowBack, MdBarChart, MdAssignment } from 'react-icons/md';

import { useGlobalContext } from '@/features/context/GlolbalContext';
import useEvaluacionDesempenoBase from '@/features/hooks/useEvaluacionDesempenoBase';
import { DataEstadisticas, PRDocentes, User } from '@/features/types/types';
import { regiones, genero } from '@/fuctions/regiones';
import DesempenoTabsNav, {
  DesempenoTabItem,
  DirectorLayoutMode,
} from './reporte-desempeno/DesempenoTabsNav';
import DesempenoFiltrosBar from './reporte-desempeno/DesempenoFiltrosBar';
import tabsStyles from '@/components/reportes/director/DirectorTabsNav.module.css';
import GenericDropdown from '@/components/common/GenericDropdown';
import NoHayResultados from '@/components/no-hay-resultados';

import {
  ModoOrganizarEspecialistasModal,
  DEFAULT_SECTIONS_DOCENTES_ORDER,
  SECCIONES_REPORTE_DOCENTES_CONFIG,
} from '@/features/evaluados-especialistas/components/ModoOrganizarEspecialistasModal';
import { getMonitoreoTimestamp } from '@/features/evaluados-especialistas/components/utils';
import { ModalConfigurarNiveles } from '../modals/ModalConfigurarNiveles';
import { ModalConfigurarNivelesPorDominio } from '../modals/ModalConfigurarNivelesPorDominio';

import styles from './ReporteGeneralDesempenoContainer.module.css';
import {
  barDataLabelPlugin,
  getDomainColor,
  hexToRgba,
  PRESET_COLOR_SWATCHES,
} from './reporte-desempeno/chartPlugins';
import {
  getDimensionBarOptions,
  getDimensionVerticalBarOptions,
  getPersonDimensionChartOptions,
  getPersonDimensionVerticalChartOptions,
  getGlobalUgelChartOptions,
  getGlobalUgelVerticalChartOptions,
  getGlobalPersonChartOptions,
  getGlobalPersonVerticalChartOptions,
  getPieChartOptions,
} from './reporte-desempeno/chartOptions';
import {
  useReporteAnalytics,
  getPersonDni,
} from './reporte-desempeno/useReporteAnalytics';
import { GlobalScoreInfoPopup } from './reporte-desempeno/GlobalScoreInfoPopup';
import CardPromedioGlobalDominio from './reporte-desempeno/CardPromedioGlobalDominio';
import CardResultadoCriterio from './reporte-desempeno/CardResultadoCriterio';
import CardRendimientoGlobalInstitucion from './reporte-desempeno/CardRendimientoGlobalInstitucion';
import DocentesReporteHeroBanner from '@/components/reportes/docentes/DocentesReporteHeroBanner';
import useReportesBannerConfig from '@/components/reportes/director/useReportesBannerConfig';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend
);

export interface ReporteGeneralDesempenoContainerProps {
  id?: string;
  collectionName?: 'evaluaciones-docentes' | 'evaluaciones-especialistas' | 'evaluaciones-especialista' | string;
  role?: 'admin' | 'especialista' | 'director' | string;
  targetTitle?: string;
  targetNoun?: string;
  targetNounSingular?: string;
  backHref?: string;
}

export const ReporteGeneralDesempenoContainer: React.FC<ReporteGeneralDesempenoContainerProps> = ({
  id: propId,
  collectionName = 'evaluaciones-docentes',
  role = 'director',
  targetTitle = 'Docentes Evaluados',
  targetNoun = 'docentes',
  targetNounSingular = 'Docente',
  backHref: propBackHref,
}) => {
  const router = useRouter();
  const idEvaluacion = propId || (router.query.idEvaluacion as string) || (router.query.id as string) || '';

  const {
    currentUserData,
    dataEvaluacionDocente,
    loaderPages,
    getPreguntaRespuestaDocentes,
    dimensionesEspecialistas,
    evaluadosEspecialista,
  } = useGlobalContext();

  const {
    getEvaluados,
    getParrillaEvaluados,
    getDataEvaluacion,
    getPreguntasRespuestas,
    getDimensiones,
    updateDimensionColor,
  } = useEvaluacionDesempenoBase({
    collectionName,
    role: role as any,
  });

  const isDirectorRole = role === 'director' || currentUserData?.rol === 2;
  const isAdmin = useMemo(() => {
    return (
      currentUserData?.rol === 4 ||
      currentUserData?.rol === 0 ||
      currentUserData?.perfil?.rol === 4 ||
      currentUserData?.perfil?.rol === 0 ||
      Number(currentUserData?.rol) === 4 ||
      Number(currentUserData?.rol) === 0
    );
  }, [currentUserData]);
  const groupLabel = isDirectorRole ? 'Institución Educativa' : 'UGEL';

  const queryDniDirector = (router.query.dniDirector as string) || '';
  const queryInstitucion = (router.query.institucion as string) || '';

  // Subscripciones a datos de Firestore
  useEffect(() => {
    if (!idEvaluacion) return;
    const unsubEvalu = getDataEvaluacion(idEvaluacion);
    const unsubPreg = getPreguntasRespuestas(idEvaluacion);
    const unsubDim = getDimensiones(idEvaluacion);
    const unsubSess = getEvaluados(idEvaluacion, {
      dniDirector: isDirectorRole ? currentUserData?.dni : queryDniDirector || null,
      institucion: !isDirectorRole ? queryInstitucion || null : null,
    });

    return () => {
      if (typeof unsubEvalu === 'function') unsubEvalu();
      if (typeof unsubPreg === 'function') unsubPreg();
      if (typeof unsubDim === 'function') unsubDim();
      if (typeof unsubSess === 'function') unsubSess();
    };
  }, [
    idEvaluacion,
    isDirectorRole,
    currentUserData?.dni,
    queryDniDirector,
    queryInstitucion,
    getDataEvaluacion,
    getPreguntasRespuestas,
    getDimensiones,
    getEvaluados,
  ]);

  // Aislamiento estricto de datos por dniDirector para el rol Director
  const directorDnis = useMemo(() => {
    if (!currentUserData?.dni) return new Set<string>();
    const dnis = new Set<string>();
    const cleanDni = String(currentUserData.dni).trim();
    if (cleanDni) dnis.add(cleanDni);
    const pred = String(
      (currentUserData as any).directorPredecesor || currentUserData.dniDirectorPredecesor || ''
    ).trim();
    if (pred) dnis.add(pred);
    if (Array.isArray(currentUserData.directoresPredecesores)) {
      currentUserData.directoresPredecesores.forEach((d: string) => {
        const c = String(d || '').trim();
        if (c) dnis.add(c);
      });
    }
    return dnis;
  }, [
    currentUserData?.dni,
    (currentUserData as any)?.directorPredecesor,
    currentUserData?.dniDirectorPredecesor,
    currentUserData?.directoresPredecesores,
  ]);

  const [docentesPadronDnis, setDocentesPadronDnis] = useState<Set<string>>(new Set());

  useEffect(() => {
    let isMounted = true;
    const targetDniDirector = isDirectorRole ? currentUserData?.dni : queryDniDirector;
    const targetInstitucion = !isDirectorRole ? queryInstitucion : undefined;

    if (targetDniDirector) {
      getParrillaEvaluados('dniDirector', targetDniDirector)
        .then((docentes) => {
          if (isMounted && Array.isArray(docentes)) {
            const dnis = new Set(
              docentes
                .map((d) => (d.dni ? String(d.dni).trim() : ''))
                .filter(Boolean)
            );
            setDocentesPadronDnis(dnis);
          }
        })
        .catch((err) => {
          console.error('Error al cargar padrón de docentes en reporte:', err);
        });
    } else if (targetInstitucion) {
      getParrillaEvaluados('institucion', targetInstitucion)
        .then((docentes) => {
          if (isMounted && Array.isArray(docentes)) {
            const dnis = new Set(
              docentes
                .map((d) => (d.dni ? String(d.dni).trim() : ''))
                .filter(Boolean)
            );
            setDocentesPadronDnis(dnis);
          }
        })
        .catch((err) => {
          console.error('Error al cargar padrón de docentes por institucion en reporte:', err);
        });
    }
    return () => {
      isMounted = false;
    };
  }, [isDirectorRole, currentUserData?.dni, queryDniDirector, queryInstitucion, getParrillaEvaluados]);

  // Evaluaciones válidas filtradas por rol
  const evaluadosValidos = useMemo(() => {
    if (!evaluadosEspecialista || evaluadosEspecialista.length === 0) return [];
    let list = evaluadosEspecialista;

    if (isDirectorRole) {
      if (directorDnis.size === 0) {
        return [];
      }
      list = list.filter((evalu) => {
        const evalDirectorDni = String(
          (evalu as any).dniDirector || (evalu as any).directorDni || ''
        ).trim();
        if (evalDirectorDni && directorDnis.has(evalDirectorDni)) {
          return true;
        }
        const teacherDni = getPersonDni(evalu);
        if (teacherDni && docentesPadronDnis.has(teacherDni)) {
          return true;
        }
        return false;
      });
    }

    return list;
  }, [evaluadosEspecialista, isDirectorRole, directorDnis, docentesPadronDnis]);

  // Estado de Filtros
  const [filtros, setFiltros] = useState({
    region: '',
    institucion: (router.query.institucion as string) || '',
    genero: '',
    idFase: '',
  });

  // Sincronizar si el parámetro institucion en la URL cambia dinámicamente
  useEffect(() => {
    if (router.query.institucion && typeof router.query.institucion === 'string') {
      setFiltros((prev) => ({
        ...prev,
        institucion: router.query.institucion as string,
      }));
    }
  }, [router.query.institucion]);

  const handleLimpiarFiltros = () => {
    setFiltros({
      region: '',
      institucion: '',
      genero: '',
      idFase: '',
    });
  };

  // Obtener lista única de Instituciones Educativas evaluadas
  const listaInstituciones = useMemo(() => {
    const map = new Map<string, { id: string; name: string }>();

    evaluadosValidos.forEach((ev: any) => {
      const rawInst = (ev.institucion || ev.info?.institucion || '').toString().trim();
      if (rawInst) {
        const normKey = rawInst.toLowerCase().replace(/^i\.?e\.?\s*/i, '').trim();
        const displayName = rawInst.startsWith('I.E.') ? rawInst : `I.E. ${rawInst}`;
        if (!map.has(normKey)) {
          map.set(normKey, {
            id: rawInst,
            name: displayName,
          });
        }
      }
    });

    return Array.from(map.values()).sort((a, b) =>
      a.name.localeCompare(b.name, 'es', { sensitivity: 'base' })
    );
  }, [evaluadosValidos]);

  // Obtener fases únicas existentes en las evaluaciones
  const fasesUnicas = useMemo(() => {
    const list: { id: string; nombre: string }[] = [];
    evaluadosValidos.forEach((ev: any) => {
      if (ev.idFase && !list.find((f) => f.id === ev.idFase)) {
        list.push({
          id: ev.idFase,
          nombre: (ev as any).faseNombre || ev.idFase,
        });
      }
    });
    return list;
  }, [evaluadosValidos]);

  // Aplicar filtros dinámicos al dataset
  const evaluadosFiltrados = useMemo(() => {
    let list = [...evaluadosValidos];

    if (filtros.region) {
      list = list.filter(
        (ev: any) =>
          (ev.region && ev.region.toString() === filtros.region) ||
          (ev.info?.region && ev.info.region.toString() === filtros.region)
      );
    }

    if (filtros.institucion) {
      const targetNorm = filtros.institucion.toLowerCase().replace(/^i\.?e\.?\s*/i, '').trim();
      const targetDni = filtros.institucion.trim();
      list = list.filter((ev: any) => {
        const evInst = (ev.institucion || ev.info?.institucion || '').toString().trim();
        const evDniDir = (ev.dniDirector || '').toString().trim();
        if (targetDni && evDniDir && evDniDir === targetDni) {
          return true;
        }
        if (evInst) {
          const norm = evInst.toLowerCase().replace(/^i\.?e\.?\s*/i, '').trim();
          return norm === targetNorm || norm.includes(targetNorm) || targetNorm.includes(norm);
        }
        return false;
      });
    }

    if (queryDniDirector) {
      list = list.filter((ev: any) => {
        const evDniDir = String((ev as any).dniDirector || (ev as any).directorDni || '').trim();
        return evDniDir === queryDniDirector;
      });
    }

    if (filtros.genero) {
      list = list.filter(
        (ev: any) =>
          (ev.genero && ev.genero.toString() === filtros.genero) ||
          (ev.info?.genero && ev.info.genero.toString() === filtros.genero)
      );
    }

    if (filtros.idFase) {
      list = list.filter((ev: any) => ev.idFase === filtros.idFase);
    }

    return list;
  }, [evaluadosValidos, filtros, queryDniDirector]);

  // Total de evaluados únicos por DNI
  const uniqueDocentesCount = useMemo(() => {
    const set = new Set<string>();
    evaluadosFiltrados.forEach((ev: any) => {
      const dni = getPersonDni(ev);
      if (dni) set.add(dni);
    });
    return set.size;
  }, [evaluadosFiltrados]);

  // Obtener la última evaluación vigente de cada docente único dentro del filtro actual
  const latestEvaluadosList = useMemo(() => {
    const map = new Map<string, any[]>();
    evaluadosFiltrados.forEach((item: any) => {
      const dni = getPersonDni(item);
      if (!dni) return;
      if (!map.has(dni)) {
        map.set(dni, []);
      }
      map.get(dni)!.push(item);
    });

    return Array.from(map.values()).map((evalsList) => {
      const evalsSorted = [...evalsList].sort((a, b) => {
        const timeA = getMonitoreoTimestamp(a);
        const timeB = getMonitoreoTimestamp(b);
        if (timeA !== timeB) return timeA - timeB;
        return (Number(a.numeroEvaluacion) || 0) - (Number(b.numeroEvaluacion) || 0);
      });
      return evalsSorted[evalsSorted.length - 1];
    });
  }, [evaluadosFiltrados]);

  // Cálculo de estadísticas por pregunta y consolidado global (basado en la última evaluación de cada docente)
  const { dataEstadisticas, dataConsolidadoGlobal } = useMemo(() => {
    const stats: DataEstadisticas[] = [];
    const consolidado: Record<string, number> = { a: 0, b: 0, c: 0, d: 0, e: 0, f: 0, g: 0, total: 0 };
    const alphabet = ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h', 'i', 'j'];

    latestEvaluadosList.forEach((item: any) => {
      const respuestas: PRDocentes[] = item.resultadosSeguimientoRetroalimentacion || item.resultados || [];
      respuestas.forEach((respuesta) => {
        const rawId = respuesta.order !== undefined ? respuesta.order : respuesta.id;
        if (rawId === undefined || rawId === null) return;
        const orderId = String(rawId);
        let estadistica = stats.find((s) => s.id === orderId);
        if (!estadistica) {
          estadistica = { id: orderId, a: 0, b: 0, c: 0, d: 0, e: 0, f: 0, g: 0, total: 0 };
          stats.push(estadistica);
        }

        respuesta.alternativas?.forEach((alt, index) => {
          if (!alt.selected) return;
          const key = alphabet[index] || `opt_${index}`;
          estadistica![key] = (estadistica![key] || 0) + 1;
          consolidado[key] = (consolidado[key] || 0) + 1;
          consolidado.total = (consolidado.total || 0) + 1;
        });

        estadistica!.total = alphabet.reduce((sum, key) => sum + (estadistica![key] || 0), 0);
      });
    });

    return { dataEstadisticas: stats, dataConsolidadoGlobal: consolidado as DataEstadisticas };
  }, [latestEvaluadosList]);

  // Estados interactivos de personalización
  const [colorMode, setColorMode] = useState<'dominio' | 'nivel'>('nivel');
  const [selectedDimensionModal, setSelectedDimensionModal] = useState<{
    dim: any;
    type: 'especialista' | 'global_especialista' | 'global_ugel' | 'global_dominio';
  } | null>(null);
  const [isColorModalOpen, setIsColorModalOpen] = useState(false);
  const [modalOrientation, setModalOrientation] = useState<'horizontal' | 'vertical'>('horizontal');
  const [espViewMode, setEspViewMode] = useState<'grid' | 'compact'>('compact');
  const [currentEspDimIndex, setCurrentEspDimIndex] = useState<number>(0);
  const [globalUgelColor, setGlobalUgelColor] = useState<string>('#3b82f6');
  const [globalEspColor, setGlobalEspColor] = useState<string>('#6366f1');

  const [cardOrientations, setCardOrientations] = useState<Record<string, 'horizontal' | 'vertical'>>({});
  const getCardOrientation = (key: string) => cardOrientations[key] || 'horizontal';
  const setCardOrientation = (key: string, val: 'horizontal' | 'vertical') =>
    setCardOrientations((prev) => ({ ...prev, [key]: val }));

  const [isOrganizerModalOpen, setIsOrganizerModalOpen] = useState(false);
  const [isGlobalLevelsModalOpen, setIsGlobalLevelsModalOpen] = useState(false);
  const [isDomainLevelsModalOpen, setIsDomainLevelsModalOpen] = useState(false);
  const [isSettingsDropdownOpen, setIsSettingsDropdownOpen] = useState(false);
  const settingsDropdownRef = useRef<HTMLDivElement>(null);

  // Popups informativos
  const [showGlobalUgelInfo, setShowGlobalUgelInfo] = useState(false);
  const [showGlobalEspInfo, setShowGlobalEspInfo] = useState(false);
  const [showGlobalDominioInfo, setShowGlobalDominioInfo] = useState(false);
  const [showConsolidadoInfo, setShowConsolidadoInfo] = useState(false);
  const [showLevelsInfo, setShowLevelsInfo] = useState(false);
  const [showProporcionalInfo, setShowProporcionalInfo] = useState(false);
  const [showModalGlobalInfo, setShowModalGlobalInfo] = useState(false);

  const globalUgelInfoRef = useRef<HTMLDivElement>(null);
  const globalEspInfoRef = useRef<HTMLDivElement>(null);
  const globalDominioInfoRef = useRef<HTMLDivElement>(null);
  const consolidadoInfoRef = useRef<HTMLDivElement>(null);
  const levelsInfoRef = useRef<HTMLDivElement>(null);
  const proporcionalInfoRef = useRef<HTMLDivElement>(null);
  const modalGlobalInfoRef = useRef<HTMLDivElement>(null);

  // Cerrar popups con click afuera
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (settingsDropdownRef.current && !settingsDropdownRef.current.contains(event.target as Node)) {
        setIsSettingsDropdownOpen(false);
      }
      if (globalUgelInfoRef.current && !globalUgelInfoRef.current.contains(event.target as Node)) {
        setShowGlobalUgelInfo(false);
      }
      if (globalEspInfoRef.current && !globalEspInfoRef.current.contains(event.target as Node)) {
        setShowGlobalEspInfo(false);
      }
      if (globalDominioInfoRef.current && !globalDominioInfoRef.current.contains(event.target as Node)) {
        setShowGlobalDominioInfo(false);
      }
      if (consolidadoInfoRef.current && !consolidadoInfoRef.current.contains(event.target as Node)) {
        setShowConsolidadoInfo(false);
      }
      if (levelsInfoRef.current && !levelsInfoRef.current.contains(event.target as Node)) {
        setShowLevelsInfo(false);
      }
      if (proporcionalInfoRef.current && !proporcionalInfoRef.current.contains(event.target as Node)) {
        setShowProporcionalInfo(false);
      }
      if (modalGlobalInfoRef.current && !modalGlobalInfoRef.current.contains(event.target as Node)) {
        setShowModalGlobalInfo(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Orden y visibilidad de secciones guardadas en localStorage
  const [ordenSecciones, setOrdenSecciones] = useState<string[]>(DEFAULT_SECTIONS_DOCENTES_ORDER);
  const [seccionesVisibles, setSeccionesVisibles] = useState<string[]>(DEFAULT_SECTIONS_DOCENTES_ORDER);

  useEffect(() => {
    if (typeof window !== 'undefined' && idEvaluacion) {
      try {
        const savedOrder = localStorage.getItem(`eva_docente_report_order_${idEvaluacion}`);
        const savedVisible = localStorage.getItem(`eva_docente_report_visible_${idEvaluacion}`);
        const validKeys = Object.keys(SECCIONES_REPORTE_DOCENTES_CONFIG);

        if (savedOrder) {
          const parsedOrder = JSON.parse(savedOrder);
          if (Array.isArray(parsedOrder) && parsedOrder.length > 0) {
            const filtered = parsedOrder.filter((s) => validKeys.includes(s));
            const missing = DEFAULT_SECTIONS_DOCENTES_ORDER.filter((s) => !filtered.includes(s));
            setOrdenSecciones([...filtered, ...missing]);
          }
        }

        if (savedVisible) {
          const parsedVisible = JSON.parse(savedVisible);
          if (Array.isArray(parsedVisible)) {
            setSeccionesVisibles(parsedVisible.filter((s) => validKeys.includes(s)));
          }
        }
      } catch (err) {
        console.error('Error cargando configuración de orden de secciones:', err);
      }
    }
  }, [idEvaluacion]);

  const handleOrderChange = (newOrder: string[]) => {
    setOrdenSecciones(newOrder);
    if (typeof window !== 'undefined' && idEvaluacion) {
      try {
        localStorage.setItem(`eva_docente_report_order_${idEvaluacion}`, JSON.stringify(newOrder));
      } catch (err) {
        console.error('Error guardando orden de secciones:', err);
      }
    }
  };

  const handleVisibilityChange = (newVisible: string[]) => {
    setSeccionesVisibles(newVisible);
    if (typeof window !== 'undefined' && idEvaluacion) {
      try {
        localStorage.setItem(`eva_docente_report_visible_${idEvaluacion}`, JSON.stringify(newVisible));
      } catch (err) {
        console.error('Error guardando visibilidad de secciones:', err);
      }
    }
  };

  // Hook de analíticas parametrizado
  const analytics = useReporteAnalytics({
    evaluados: evaluadosFiltrados,
    dataEvaluacion: dataEvaluacionDocente,
    preguntasRespuestas: getPreguntaRespuestaDocentes,
    dimensiones: dimensionesEspecialistas,
    colorMode,
    targetNounSingular,
    isDirectorRole,
    groupFallbackName: currentUserData?.institucion,
  });

  // Navegación en modal fullscreen
  const currentDimIndex = (dimensionesEspecialistas || []).findIndex(
    (d: any) => d.id === selectedDimensionModal?.dim?.id
  );
  const totalDims = (dimensionesEspecialistas || []).length;
  const hasPrevDim = currentDimIndex > 0;
  const hasNextDim = currentDimIndex >= 0 && currentDimIndex < totalDims - 1;

  const handlePrevDimension = () => {
    if (hasPrevDim && dimensionesEspecialistas && selectedDimensionModal) {
      setSelectedDimensionModal({
        dim: dimensionesEspecialistas[currentDimIndex - 1],
        type: selectedDimensionModal.type,
      });
    }
  };

  const handleNextDimension = () => {
    if (hasNextDim && dimensionesEspecialistas && selectedDimensionModal) {
      setSelectedDimensionModal({
        dim: dimensionesEspecialistas[currentDimIndex + 1],
        type: selectedDimensionModal.type,
      });
    }
  };

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!selectedDimensionModal) return;
      if (e.key === 'Escape') {
        setSelectedDimensionModal(null);
      } else if (e.key === 'ArrowRight' && hasNextDim) {
        handleNextDimension();
      } else if (e.key === 'ArrowLeft' && hasPrevDim) {
        handlePrevDimension();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedDimensionModal, dimensionesEspecialistas, currentDimIndex, hasNextDim, hasPrevDim]);

  const handleColorChange = async (dimId: string | undefined, newColor: string) => {
    if (!idEvaluacion || !dimId) return;
    try {
      await updateDimensionColor(idEvaluacion, dimId, newColor);
    } catch (err) {
      console.error('Error al actualizar color de dimensión:', err);
    }
  };

  const handleResetColors = async () => {
    if (!idEvaluacion || !dimensionesEspecialistas) return;
    try {
      await Promise.all(
        dimensionesEspecialistas.map((dim: any) =>
          updateDimensionColor(idEvaluacion, dim.id, '')
        )
      );
    } catch (err) {
      console.error('Error al resetear colores de dimensiones:', err);
    }
  };

  // Renderizador de rangos de nivel por dominio
  const renderDomainLevelRanges = (dim?: any) => {
    let niveles = dim?.niveles && dim.niveles.length > 0 ? dim.niveles : null;

    if (!niveles) {
      const globalNiveles = analytics.rawNiveles;
      if (!globalNiveles || globalNiveles.length === 0) return null;

      if (dim?.id) {
        const preguntasDim = getPreguntaRespuestaDocentes.filter((p) => p.dimensionId === dim.id);
        const countQuestions = preguntasDim.length || 1;
        const maxDomainScore = countQuestions * analytics.maxScaleValue;
        const maxGlobalScale = Math.max(1, ...(globalNiveles.map((n: any) => Number(n.max) || 0) || [maxDomainScore]));

        niveles = globalNiveles.map((n: any) => {
          const scaledMin = Number(((Number(n.min || 0) / maxGlobalScale) * maxDomainScore).toFixed(0));
          const scaledMax = Number(((Number(n.max || 0) / maxGlobalScale) * maxDomainScore).toFixed(0));
          return {
            ...n,
            min: scaledMin,
            max: scaledMax,
          };
        });
      } else {
        niveles = globalNiveles;
      }
    }

    if (!niveles || niveles.length === 0) return null;

    return (
      <div className={styles.domainCardLevelsFooter}>
        <div className={styles.domainLevelsFooterHeader}>
          <span className={styles.domainLevelsFooterTitle}>
            <RiAwardLine style={{ color: '#2563eb', fontSize: '0.95rem' }} />
            {dim?.nombre ? `Puntajes de Nivel de Logro (${dim.nombre}):` : 'Puntajes por Nivel de Logro:'}
          </span>
        </div>
        <div className={styles.domainLevelsList}>
          {niveles.map((n: any, idx: number) => (
            <div key={idx} className={styles.domainLevelChip}>
              <span className={styles.levelLegendDot} style={{ background: n.color || '#3b82f6' }} />
              <span className={styles.domainLevelChipRange}>
                {n.min ?? 0} - {n.max ?? 0}
              </span>
              <span className={styles.domainLevelChipName}>{n.nivel}</span>
            </div>
          ))}
        </div>
      </div>
    );
  };

  const backHref =
    propBackHref ||
    (isDirectorRole
      ? `/directores/evaluaciones-docentes/evaluacion/${idEvaluacion}`
      : role === 'especialista'
      ? `/especialistas/evaluaciones-docentes/evaluacion/${idEvaluacion}`
      : `/admin/evaluaciones-docentes/evaluacion/${idEvaluacion}`);

  // Modo de diseño del reporte: 'tabs' (pestañas independientes) o 'cascade' (cascada vertical continua)
  const [layoutMode, setLayoutMode] = useState<DirectorLayoutMode>(() => {
    if (typeof window !== 'undefined') {
      try {
        const saved = localStorage.getItem(`eva_desempeno_report_layout_${idEvaluacion || 'general'}`);
        if (saved === 'tabs' || saved === 'cascade') return saved;
        const globalSaved = localStorage.getItem('eva_desempeno_report_layout');
        if (globalSaved === 'tabs' || globalSaved === 'cascade') return globalSaved;
      } catch (e) {
        console.error('Error al leer layoutMode:', e);
      }
    }
    return 'tabs';
  });

  const [activeTab, setActiveTab] = useState<string>('general');

  const handleToggleLayoutMode = (mode: DirectorLayoutMode) => {
    setLayoutMode(mode);
    if (typeof window !== 'undefined') {
      try {
        localStorage.setItem(`eva_desempeno_report_layout_${idEvaluacion || 'general'}`, mode);
        localStorage.setItem('eva_desempeno_report_layout', mode);
      } catch (e) {
        console.error('Error al guardar layoutMode:', e);
      }
    }
    if (mode === 'cascade' && activeTab) {
      setTimeout(() => {
        const elem = document.getElementById(`section-${activeTab}`);
        if (elem) {
          elem.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
      }, 150);
    }
  };

  const handleTabChange = useCallback(
    (key: string) => {
      setActiveTab(key);
      if (layoutMode === 'cascade') {
        const elem = document.getElementById(`section-${key}`);
        if (elem) {
          elem.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
      } else {
        const navEl = document.getElementById('desempeno-tabs-nav-container');
        if (navEl && navEl.getBoundingClientRect().top < 0) {
          navEl.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
      }
    },
    [layoutMode]
  );

  // Configuración global del Hero Banner de Evaluación Docente (Variante e Imagen de Fondo en Firestore)
  const bannerConfig = useReportesBannerConfig({
    routeKey: isDirectorRole ? 'directores_evaluaciones_docentes' : 'especialistas_evaluaciones_docentes',
    defaultVariant: 'expanded',
  });

  const bannerRegionTexto = useMemo(() => {
    if (filtros.region) {
      const regObj = regiones.find((r) => r.id.toString() === String(filtros.region));
      return regObj ? `UGEL ${regObj.region}` : 'UGEL Regional';
    }
    if (currentUserData?.region) {
      const regObj = regiones.find((r) => r.id.toString() === String(currentUserData.region));
      return regObj ? `UGEL ${regObj.region}` : 'UGEL Regional';
    }
    return 'DRE Puno';
  }, [filtros.region, currentUserData?.region]);

  const evaluadosCount = uniqueDocentesCount || evaluadosFiltrados.length;
  const totalCriterios = getPreguntaRespuestaDocentes?.length || 0;
  const globalGroupData = analytics.getGlobalUGELData(globalUgelColor);
  const showInstitucionalTab = !isDirectorRole && (globalGroupData?.labels?.length || 0) > 1;

  // Auto-ajuste si la pestaña institucional no está disponible
  useEffect(() => {
    if (activeTab === 'institucional' && !showInstitucionalTab) {
      setActiveTab('general');
    }
  }, [activeTab, showInstitucionalTab]);

  const tabsList = useMemo<DesempenoTabItem[]>(() => {
    const list: DesempenoTabItem[] = [
      {
        id: 'general',
        label: 'Panel General',
        icon: <MdBarChart className="text-blue-600 text-lg" />,
        badge: evaluadosCount > 0 ? `${evaluadosCount} ${targetNoun}` : undefined,
      },
      {
        id: 'evaluados',
        label: targetTitle || 'Docentes',
        icon: <RiGraduationCapLine className="text-emerald-600 text-lg" />,
        badge: evaluadosCount > 0 ? `${evaluadosCount}` : undefined,
      },
    ];

    if (showInstitucionalTab) {
      list.push({
        id: 'institucional',
        label: groupLabel === 'Institución Educativa' ? 'Instituciones' : 'UGELs',
        icon: <RiBuilding4Line className="text-purple-600 text-lg" />,
        badge: `${globalGroupData.labels.length}`,
      });
    }

    list.push({
      id: 'criterios',
      label: 'Análisis por Criterio',
      icon: <MdAssignment className="text-cyan-600 text-lg" />,
      badge: totalCriterios > 0 ? `${totalCriterios} ítems` : undefined,
    });

    return list;
  }, [
    evaluadosCount,
    targetNoun,
    targetTitle,
    showInstitucionalTab,
    groupLabel,
    globalGroupData.labels.length,
    totalCriterios,
  ]);

  // -------------------------------------------------------------------------
  // MÉTODOS DE RENDERIZADO POR PESTAÑAS Y SECCIONES
  // -------------------------------------------------------------------------

  // 1. Institucional: Rendimiento Global por Institución / UGEL
  const renderInstitucionalContent = () => {
    if (!showInstitucionalTab) return null;
    if (!seccionesVisibles.includes('global_consolidado')) {
      return (
        <div className="text-center py-12 px-4 bg-slate-50 rounded-2xl border border-dashed border-slate-300">
          <p className="text-slate-600 text-sm font-medium">Esta sección se encuentra oculta en la personalización de gráficos.</p>
          <button
            type="button"
            onClick={() => setIsOrganizerModalOpen(true)}
            className="mt-3 px-3 py-1.5 bg-blue-600 text-white rounded-lg text-xs font-semibold hover:bg-blue-700 transition"
          >
            Personalizar Gráficos
          </button>
        </div>
      );
    }

    const orientGroup = getCardOrientation('global_ugel');

    return (
      <div className={styles.dimensionSectionWrapper} style={{ marginTop: 0, marginBottom: '1.5rem' }}>
        <div className={styles.sectionHeader}>
          <h2 className={styles.analyticsTitle}>Rendimiento Global por {groupLabel}</h2>
          <p className={styles.analyticsSubtitle}>
            Comparativa general y ranking del puntaje total de toda la evaluación y su evolución a través de las fases
          </p>
        </div>

        <CardRendimientoGlobalInstitucion
          globalGroupData={globalGroupData}
          groupLabel={groupLabel}
          groupColor={globalUgelColor}
          onColorChange={(newColor) => setGlobalUgelColor(newColor)}
          orientation={orientGroup}
          onOrientationChange={(newOrient) => setCardOrientation('global_ugel', newOrient)}
          onOpenFullScreen={() => {
            setModalOrientation(orientGroup);
            setSelectedDimensionModal({ dim: null, type: 'global_ugel' });
          }}
          targetNounSingular={targetNounSingular}
          globalNiveles={analytics.rawNiveles}
        />
      </div>
    );
  };

  // 2. Evaluados: Card de Rendimiento Global Individual
  const renderEvaluadosGlobalCard = () => {
    if (!seccionesVisibles.includes('global_consolidado')) return null;

    const globalPersonData = analytics.getGlobalPersonData(globalEspColor);
    const orientPerson = getCardOrientation('global_especialista');

    return (
      <div className={styles.dimensionSectionWrapper} style={{ marginTop: 0, marginBottom: '2rem' }}>
        <div className={styles.sectionHeader}>
          <h2 className={styles.analyticsTitle}>Rendimiento Global por {targetNounSingular}</h2>
          <p className={styles.analyticsSubtitle}>
            Comparativa individual y ranking del puntaje total de toda la evaluación
          </p>
        </div>

        <div className={`${styles.dimensionChartCard} ${styles.dimensionChartCardCompact}`} style={{ width: '100%' }}>
          <div
            className={styles.dimensionChartHeader}
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'flex-start',
              flexWrap: 'wrap',
              gap: '0.5rem',
            }}
          >
            <div>
              <h3 className={styles.dimensionChartMainTitle} style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                <span style={{ display: 'flex', alignItems: 'center' }}>
                  <span
                    className={styles.sectionTitleIndicator}
                    style={{
                      display: 'inline-block',
                      verticalAlign: 'middle',
                      marginRight: '8px',
                      background: globalEspColor,
                    }}
                  ></span>
                  Rendimiento Global por {targetNounSingular}
                </span>
                <GlobalScoreInfoPopup
                  type="especialista"
                  isOpen={showGlobalEspInfo}
                  onToggle={() => setShowGlobalEspInfo((prev) => !prev)}
                  onClose={() => setShowGlobalEspInfo(false)}
                  anchorRef={globalEspInfoRef}
                  targetNounSingular={targetNounSingular}
                />
              </h3>
              <p className={styles.dimensionChartSubtitle}>
                EVALUACIÓN INTEGRAL (TODAS LAS DIMENSIONES)
                <span style={{ display: 'block', fontSize: '0.78rem', color: '#64748b', marginTop: '2px', fontWeight: 500 }}>
                  {globalPersonData.totalQuestions} criterios evaluados · Puntaje máx: {globalPersonData.maxGlobalScore} pts
                </span>
              </p>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
              <div className={styles.segmentedControl}>
                <button
                  type="button"
                  className={`${styles.segmentedBtn} ${orientPerson === 'horizontal' ? styles.segmentedBtnActive : ''}`}
                  onClick={() => setCardOrientation('global_especialista', 'horizontal')}
                  title="Vista Horizontal"
                  aria-label="Vista Horizontal"
                  style={{ padding: '0.35rem 0.6rem' }}
                >
                  <RiBarChartHorizontalLine style={{ fontSize: '1.1rem' }} />
                </button>
                <button
                  type="button"
                  className={`${styles.segmentedBtn} ${orientPerson === 'vertical' ? styles.segmentedBtnActive : ''}`}
                  onClick={() => setCardOrientation('global_especialista', 'vertical')}
                  title="Vista Vertical"
                  aria-label="Vista Vertical"
                  style={{ padding: '0.35rem 0.6rem' }}
                >
                  <RiBarChart2Line style={{ fontSize: '1.1rem' }} />
                </button>
              </div>

              <div className={styles.colorPickerHeaderWrapper}>
                <label
                  className={styles.colorPickerCircle}
                  style={{ background: globalEspColor }}
                  title="Cambiar color del gráfico"
                >
                  <input
                    type="color"
                    value={globalEspColor}
                    onChange={(e) => setGlobalEspColor(e.target.value)}
                    className={styles.hiddenColorInput}
                  />
                </label>
              </div>

              <button
                type="button"
                onClick={() => {
                  setModalOrientation(orientPerson);
                  setSelectedDimensionModal({ dim: null, type: 'global_especialista' });
                }}
                className={styles.fullScreenButton}
                title="Ver en pantalla completa"
                aria-label="Ver en pantalla completa"
              >
                <RiFullscreenLine />
              </button>
            </div>
          </div>

          {orientPerson === 'horizontal' ? (
            <div
              className={styles.chartContainer}
              style={{
                height: `${Math.max(220, globalPersonData.labels.length * 40 + 70)}px`,
                width: '100%',
                position: 'relative',
              }}
            >
              <Bar
                key="chart-global-person-h"
                data={globalPersonData}
                options={getGlobalPersonChartOptions(globalPersonData.maxGlobalScore, globalPersonData.personList, targetNounSingular) as any}
                plugins={[barDataLabelPlugin]}
              />
            </div>
          ) : (
            <div
              style={{
                minHeight: '380px',
                width: '100%',
                overflowX: globalPersonData.labels.length > 10 ? 'auto' : 'visible',
                position: 'relative',
              }}
            >
              <div
                style={{
                  minWidth: globalPersonData.labels.length > 10 ? `${globalPersonData.labels.length * 42}px` : '100%',
                  height: '360px',
                }}
              >
                <Bar
                  key="chart-global-person-v"
                  data={globalPersonData}
                  options={getGlobalPersonVerticalChartOptions(globalPersonData.maxGlobalScore, globalPersonData.personList, targetNounSingular) as any}
                  plugins={[barDataLabelPlugin]}
                />
              </div>
            </div>
          )}

          {renderDomainLevelRanges()}
        </div>
      </div>
    );
  };

  // 3. Evaluados: Sección Rendimiento por Docente según Dominio
  const renderEvaluadosDimensionContent = () => {
    if (!seccionesVisibles.includes('dimensiones_especialistas')) return null;
    if (!dimensionesEspecialistas || dimensionesEspecialistas.length === 0) return null;

    const displayedDims =
      espViewMode === 'compact'
        ? [dimensionesEspecialistas[currentEspDimIndex]]
        : dimensionesEspecialistas;

    return (
      <div className={styles.dimensionSectionWrapper} style={{ marginTop: 0, marginBottom: '2rem' }}>
        <div className={styles.sectionHeader}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
            <div>
              <h2 className={styles.analyticsTitle}>Rendimiento por {targetNounSingular} según Dominio</h2>
              <p className={styles.analyticsSubtitle}>
                Ranking y puntajes desagregados por dimensiones para {targetNoun} evaluados
              </p>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
              <div className={styles.segmentedControl}>
                <button
                  type="button"
                  className={`${styles.segmentedBtn} ${espViewMode === 'compact' ? styles.segmentedBtnActive : ''}`}
                  onClick={() => setEspViewMode('compact')}
                  title="Vista Paginada / Carrusel"
                >
                  <span>Paginado</span>
                </button>
                <button
                  type="button"
                  className={`${styles.segmentedBtn} ${espViewMode === 'grid' ? styles.segmentedBtnActive : ''}`}
                  onClick={() => setEspViewMode('grid')}
                  title="Vista Cuadrícula Completa"
                >
                  <span>Todos</span>
                </button>
              </div>

              {espViewMode === 'compact' && totalDims > 1 && (
                <div className={styles.navDimensionGroup}>
                  <button
                    type="button"
                    onClick={() => setCurrentEspDimIndex((p) => Math.max(0, p - 1))}
                    disabled={currentEspDimIndex === 0}
                    className={styles.navDimensionBtn}
                    title="Dominio anterior"
                  >
                    <RiArrowLeftSLine />
                  </button>
                  <span style={{ fontSize: '0.85rem', fontWeight: 600, color: '#334155' }}>
                    {currentEspDimIndex + 1} / {totalDims}
                  </span>
                  <button
                    type="button"
                    onClick={() => setCurrentEspDimIndex((p) => Math.min(totalDims - 1, p + 1))}
                    disabled={currentEspDimIndex === totalDims - 1}
                    className={styles.navDimensionBtn}
                    title="Dominio siguiente"
                  >
                    <RiArrowRightSLine />
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.75rem', width: '100%' }}>
          {displayedDims.map((dim: any, dIdx: number) => {
            if (!dim) return null;
            const cardKey = `dim_${dim.id}`;
            const actualDimIndex = espViewMode === 'compact' ? currentEspDimIndex : dIdx;
            const dimColor = getDomainColor(dim, actualDimIndex);
            const chartData = analytics.getPersonDataForDimension(dim.id, dimColor);
            const orient = getCardOrientation(cardKey);

            return (
              <div key={dim.id || dIdx} className={`${styles.dimensionChartCard} ${styles.dimensionChartCardCompact}`} style={{ width: '100%' }}>
                <div
                  className={styles.dimensionChartHeader}
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'flex-start',
                    flexWrap: 'wrap',
                    gap: '0.5rem',
                  }}
                >
                  <div>
                    <h3 className={styles.dimensionChartMainTitle} style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                      <span style={{ display: 'flex', alignItems: 'center' }}>
                        <span
                          className={styles.sectionTitleIndicator}
                          style={{
                            display: 'inline-block',
                            verticalAlign: 'middle',
                            marginRight: '8px',
                            background: dimColor,
                          }}
                        ></span>
                        {dim.nombre}
                      </span>
                    </h3>
                    <p className={styles.dimensionChartSubtitle}>
                      PUNTAJES OBTENIDOS POR {targetNoun.toUpperCase()}
                      <span style={{ display: 'block', fontSize: '0.78rem', color: '#64748b', marginTop: '2px', fontWeight: 500 }}>
                        {chartData.totalItems} criterios evaluados en este dominio · Puntaje máx: {chartData.maxDomainScore} pts
                      </span>
                    </p>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                    <div className={styles.colorPickerHeaderWrapper}>
                      <label
                        className={styles.colorPickerCircle}
                        style={{ background: dimColor }}
                        title={`Cambiar color para ${dim.nombre}`}
                      >
                        <input
                          type="color"
                          value={dimColor}
                          onChange={(e) => handleColorChange(dim.id, e.target.value)}
                          className={styles.hiddenColorInput}
                        />
                      </label>
                    </div>

                    <div className={styles.segmentedControl}>
                      <button
                        type="button"
                        className={`${styles.segmentedBtn} ${orient === 'horizontal' ? styles.segmentedBtnActive : ''}`}
                        onClick={() => setCardOrientation(cardKey, 'horizontal')}
                        title="Vista Horizontal"
                      >
                        <RiBarChartHorizontalLine style={{ fontSize: '1.1rem' }} />
                      </button>
                      <button
                        type="button"
                        className={`${styles.segmentedBtn} ${orient === 'vertical' ? styles.segmentedBtnActive : ''}`}
                        onClick={() => setCardOrientation(cardKey, 'vertical')}
                        title="Vista Vertical"
                      >
                        <RiBarChart2Line style={{ fontSize: '1.1rem' }} />
                      </button>
                    </div>

                    <button
                      type="button"
                      onClick={() => {
                        setModalOrientation(orient);
                        setSelectedDimensionModal({ dim, type: 'especialista' });
                      }}
                      className={styles.fullScreenButton}
                      title="Ver en pantalla completa"
                    >
                      <RiFullscreenLine />
                    </button>
                  </div>
                </div>

                {orient === 'horizontal' ? (
                  <div
                    className={styles.chartContainer}
                    style={{
                      height: `${Math.max(200, chartData.labels.length * 40 + 70)}px`,
                      width: '100%',
                      position: 'relative',
                    }}
                  >
                    <Bar
                      key={`chart-dim-person-h-${dim.id}`}
                      data={chartData}
                      options={getPersonDimensionChartOptions(chartData.maxDomainScore, chartData.personList, targetNounSingular) as any}
                      plugins={[barDataLabelPlugin]}
                    />
                  </div>
                ) : (
                  <div
                    style={{
                      minHeight: '360px',
                      width: '100%',
                      overflowX: chartData.labels.length > 10 ? 'auto' : 'visible',
                      position: 'relative',
                    }}
                  >
                    <div
                      style={{
                        minWidth: chartData.labels.length > 10 ? `${chartData.labels.length * 40}px` : '100%',
                        height: '340px',
                      }}
                    >
                      <Bar
                        key={`chart-dim-person-v-${dim.id}`}
                        data={chartData}
                        options={getPersonDimensionVerticalChartOptions(chartData.maxDomainScore, chartData.personList, targetNounSingular) as any}
                        plugins={[barDataLabelPlugin]}
                      />
                    </div>
                  </div>
                )}

                {renderDomainLevelRanges(dim)}
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  // Combinación para la pestaña Evaluados
  const renderEvaluadosContent = () => {
    const isGlobalVisible = seccionesVisibles.includes('global_consolidado');
    const isDimsVisible = seccionesVisibles.includes('dimensiones_especialistas');

    if (!isGlobalVisible && !isDimsVisible) {
      return (
        <div className="text-center py-12 px-4 bg-slate-50 rounded-2xl border border-dashed border-slate-300">
          <p className="text-slate-600 text-sm font-medium">Las secciones de {targetNoun} se encuentran ocultas en la personalización de gráficos.</p>
          <button
            type="button"
            onClick={() => setIsOrganizerModalOpen(true)}
            className="mt-3 px-3 py-1.5 bg-blue-600 text-white rounded-lg text-xs font-semibold hover:bg-blue-700 transition"
          >
            Personalizar Gráficos
          </button>
        </div>
      );
    }

    return (
      <div className="flex flex-col gap-6 w-full">
        {renderEvaluadosGlobalCard()}
        {renderEvaluadosDimensionContent()}
      </div>
    );
  };

  // 4. Panel General: Consolidado Global y Niveles (Tortas + CardPromedioGlobalDominio)
  const renderGeneralContent = () => {
    if (!seccionesVisibles.includes('pie_charts')) {
      return (
        <div className="text-center py-12 px-4 bg-slate-50 rounded-2xl border border-dashed border-slate-300">
          <p className="text-slate-600 text-sm font-medium">El panel general se encuentra oculto en la personalización de gráficos.</p>
          <button
            type="button"
            onClick={() => setIsOrganizerModalOpen(true)}
            className="mt-3 px-3 py-1.5 bg-blue-600 text-white rounded-lg text-xs font-semibold hover:bg-blue-700 transition"
          >
            Personalizar Gráficos
          </button>
        </div>
      );
    }

    const pieData = analytics.getPieData(dataConsolidadoGlobal);
    const levelsData = analytics.getLevelsData();
    const dimPieData = analytics.getDimensionPieData();
    const dimBarData = analytics.getDimensionData();
    const orientDim = getCardOrientation('global_dominio');
    const orientGroup = getCardOrientation('global_ugel');
    const escala = (dataEvaluacionDocente as any)?.escala || [];
    const rawNiveles = (dataEvaluacionDocente as any)?.niveles || (dataEvaluacionDocente as any)?.nivelYPuntaje || [];

    return (
      <div className={styles.dimensionSectionWrapper} style={{ marginTop: 0, marginBottom: '1.5rem' }}>
        <div className={styles.sectionHeader}>
          <h2 className={styles.analyticsTitle}>Consolidado Global y Niveles de Logro</h2>
          <p className={styles.analyticsSubtitle}>
            Visualización integral de porcentajes, escala de calificación y distribución por niveles de logro
          </p>
        </div>

        <div className={styles.globalChartsGrid}>
          {/* 1. Gráfico de Barras: Rendimiento Global por Institución Educativa / UGEL (Modular) */}
          {globalGroupData && globalGroupData.labels.length > 0 && (
            <CardRendimientoGlobalInstitucion
              className={styles.fullWidthChart}
              globalGroupData={globalGroupData}
              groupLabel={groupLabel}
              groupColor={globalUgelColor}
              onColorChange={(newCol) => setGlobalUgelColor(newCol)}
              orientation={orientGroup}
              onOrientationChange={(newOrient) => setCardOrientation('global_ugel', newOrient)}
              onOpenFullScreen={() => {
                setModalOrientation(orientGroup);
                setSelectedDimensionModal({ dim: null, type: 'global_ugel' });
              }}
              targetNounSingular={targetNounSingular}
              globalNiveles={rawNiveles}
            />
          )}

          {/* 2. Gráfico de Barras: Puntaje Promedio Global por Dominio (Modular) */}
          {dimensionesEspecialistas && dimensionesEspecialistas.length > 0 && (
            <CardPromedioGlobalDominio
              className={styles.fullWidthChart}
              dimData={dimBarData}
              maxGlobalDomainScore={analytics.maxGlobalDomainScore}
              globalNiveles={rawNiveles}
              orientation={orientDim}
              onOrientationChange={(newOrient) => setCardOrientation('global_dominio', newOrient)}
              onOpenFullScreen={() => {
                setModalOrientation(orientDim);
                setSelectedDimensionModal({ dim: null, type: 'global_dominio' });
              }}
              targetNounSingular={targetNounSingular}
            />
          )}

          {/* 3. Gráficos Tipo Pie (Consolidado Global, Niveles de Logro y Proporción por Dominio) */}
          {/* Gráfico 1: Consolidado Global de Resultados (Pie) */}
          <div className={styles.chartContainer}>
            <h3 className={styles.sectionTitle} style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
              <span style={{ display: 'flex', alignItems: 'center' }}>
                <span className={styles.sectionTitleIndicator}></span>
                <span>Consolidado Global de Resultados</span>
              </span>
              <GlobalScoreInfoPopup
                type="consolidado_general"
                isOpen={showConsolidadoInfo}
                onToggle={() => setShowConsolidadoInfo((prev) => !prev)}
                onClose={() => setShowConsolidadoInfo(false)}
                anchorRef={consolidadoInfoRef}
                targetNounSingular={targetNounSingular}
              />
            </h3>

            <div className={styles.pieChartWrapper}>
              <Pie
                data={pieData}
                options={getPieChartOptions('Distribución de Criterios por Escala')}
              />
            </div>

            <div className={styles.statsGrid}>
              <div className={styles.statItem}>
                <span className={styles.statLabel}>Total {targetNoun}</span>
                <span className={styles.statValue}>{uniqueDocentesCount || evaluadosFiltrados.length}</span>
              </div>
              <div className={styles.statItem}>
                <span className={styles.statLabel}>Total Criterios Evaluados</span>
                <span className={styles.statValue}>
                  {dataConsolidadoGlobal?.total || 0}
                  <span className="text-[10px] font-normal text-slate-400 block">
                    ({uniqueDocentesCount} {targetNoun} × {getPreguntaRespuestaDocentes?.length || 0} ítems)
                  </span>
                </span>
              </div>
              {escala.map((item: any, index: number) => {
                const alphabet = ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h'];
                const key = alphabet[index] || `opt_${index}`;
                const count = (dataConsolidadoGlobal as any)?.[key] || 0;
                return (
                  <div key={index} className={styles.statItem}>
                    <span className={styles.statLabel}>{item.descripcion}</span>
                    <span className={styles.statValue}>{count}</span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Gráfico 2: Distribución por Niveles de Logro (Pie) */}
          {rawNiveles && rawNiveles.length > 0 && (
            <div className={styles.chartContainer}>
              <h3 className={styles.sectionTitle} style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                <span style={{ display: 'flex', alignItems: 'center' }}>
                  <span className={styles.sectionTitleIndicator}></span>
                  <span>Distribución por Niveles de Logro</span>
                </span>
                <GlobalScoreInfoPopup
                  type="niveles_logro"
                  isOpen={showLevelsInfo}
                  onToggle={() => setShowLevelsInfo((prev) => !prev)}
                  onClose={() => setShowLevelsInfo(false)}
                  anchorRef={levelsInfoRef}
                  targetNounSingular={targetNounSingular}
                />
              </h3>

              <div className={styles.pieChartWrapper}>
                <Pie
                  data={levelsData}
                  options={getPieChartOptions(`${targetNoun} por Nivel de Logro`)}
                />
              </div>

              <div className={styles.statsGrid}>
                <div className={styles.statItem}>
                  <span className={styles.statLabel}>Total Evaluados</span>
                  <span className={styles.statValue}>{uniqueDocentesCount || evaluadosFiltrados.length}</span>
                </div>
                {rawNiveles.map((nivel: any, index: number) => {
                  const count = levelsData.datasets[0]?.data[index] || 0;
                  return (
                    <div key={index} className={styles.statItem}>
                      <span className={styles.statLabel} style={{ color: nivel.color }}>{nivel.nivel}</span>
                      <span className={styles.statValue}>{count}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Gráfico 3: Distribución Proporcional por Dominio */}
          {dimensionesEspecialistas && dimensionesEspecialistas.length > 0 && (
            <div className={styles.chartContainer}>
              <h3 className={styles.sectionTitle} style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                <span style={{ display: 'flex', alignItems: 'center' }}>
                  <span className={styles.sectionTitleIndicator} style={{ background: '#8b5cf6' }}></span>
                  <span>Distribución Proporcional por Dominio</span>
                </span>
                <GlobalScoreInfoPopup
                  type="proporcional_dominio"
                  isOpen={showProporcionalInfo}
                  onToggle={() => setShowProporcionalInfo((prev) => !prev)}
                  onClose={() => setShowProporcionalInfo(false)}
                  anchorRef={proporcionalInfoRef}
                  targetNounSingular={targetNounSingular}
                />
              </h3>

              <div className={styles.pieChartWrapper}>
                <Pie
                  data={dimPieData}
                  options={getPieChartOptions('Promedio Comparativo por Dominio')}
                />
              </div>

              <div className={styles.statsGrid}>
                {dimensionesEspecialistas.map((dim: any, index: number) => {
                  const value = dimPieData.datasets[0]?.data[index] || 0;
                  const color = getDomainColor(dim, index);
                  return (
                    <div key={dim.id || index} className={styles.statItem}>
                      <span className={styles.statLabel} style={{ color }}>{dim.nombre}</span>
                      <span className={styles.statValue}>{value} pts</span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </div>
    );
  };

  // 5. Criterios: Resultados Detallados por Criterio
  const renderCriteriosContent = () => {
    if (!seccionesVisibles.includes('preguntas_criterios')) {
      return (
        <div className="text-center py-12 px-4 bg-slate-50 rounded-2xl border border-dashed border-slate-300">
          <p className="text-slate-600 text-sm font-medium">El análisis por criterio se encuentra oculto en la personalización de gráficos.</p>
          <button
            type="button"
            onClick={() => setIsOrganizerModalOpen(true)}
            className="mt-3 px-3 py-1.5 bg-blue-600 text-white rounded-lg text-xs font-semibold hover:bg-blue-700 transition"
          >
            Personalizar Gráficos
          </button>
        </div>
      );
    }

    if (!getPreguntaRespuestaDocentes || getPreguntaRespuestaDocentes.length === 0) {
      return (
        <div className="text-center py-12 text-slate-500 font-medium">
          No hay criterios de evaluación registrados.
        </div>
      );
    }

    return (
      <div className={styles.dimensionSectionWrapper} style={{ marginTop: 0, marginBottom: '1.5rem' }}>
        <div className={styles.sectionHeader}>
          <h2 className={styles.analyticsTitle}>Resultados Detallados por Criterio</h2>
          <p className={styles.analyticsSubtitle}>
            Desglose estadístico y frecuencias de respuestas para cada uno de los criterios evaluados
          </p>
        </div>

        <div className={styles.perQuestionGrid}>
          {getPreguntaRespuestaDocentes.map((pregunta: PRDocentes, pIdx: number) => {
            const itemData = analytics.getItemAnalysisData(pregunta);
            const dim = dimensionesEspecialistas?.find((d: any) => d.id === pregunta.dimensionId);

            return (
              <CardResultadoCriterio
                key={pregunta.id || pIdx}
                orderNumber={pregunta.order !== undefined ? pregunta.order : pIdx + 1}
                criterio={pregunta.criterio}
                dimensionName={dim?.nombre}
                dimensionColor={dim ? getDomainColor(dim, 0) : undefined}
                scaleStats={itemData.scaleStats}
                totalResponses={itemData.totalRespondents}
              />
            );
          })}
        </div>
      </div>
    );
  };

  // 6. Vista Cascada Vertical Continua
  const renderCascadeView = () => {
    return (
      <div className="flex flex-col gap-8 w-full mt-4">
        {ordenSecciones.map((secId) => {
          if (!seccionesVisibles.includes(secId)) return null;

          if (secId === 'global_consolidado') {
            return (
              <section key="global_consolidado" id="section-evaluados" className="w-full">
                {showInstitucionalTab && (
                  <div id="section-institucional">
                    {renderInstitucionalContent()}
                  </div>
                )}
                {renderEvaluadosGlobalCard()}
              </section>
            );
          }

          if (secId === 'pie_charts') {
            return (
              <section key="pie_charts" id="section-general" className="w-full">
                {renderGeneralContent()}
              </section>
            );
          }

          if (secId === 'dimensiones_especialistas') {
            return (
              <section key="dimensiones_especialistas" id="section-dimensiones" className="w-full">
                {renderEvaluadosDimensionContent()}
              </section>
            );
          }

          if (secId === 'preguntas_criterios') {
            return (
              <section key="preguntas_criterios" id="section-criterios" className="w-full">
                {renderCriteriosContent()}
              </section>
            );
          }

          return null;
        })}
      </div>
    );
  };

  const hasData = evaluadosValidos.length > 0;

  return (
    <>
      <div className={styles.container}>
        {loaderPages ? (
          <div className={styles.loaderContainer}>
            <RiLoader4Line className={styles.loaderIcon} />
            <p className={styles.loaderText}>Cargando datos y reportes...</p>
          </div>
        ) : (
          <div className={styles.tableContainer}>
            <DocentesReporteHeroBanner
              tituloEvaluacion={(dataEvaluacionDocente as any)?.nombre || (dataEvaluacionDocente as any)?.name}
              subtitulo={
                isDirectorRole
                  ? 'Monitoreo Directivo • Resultados y Logros de Desempeño Docente'
                  : 'Monitoreo Pedagógico • Resultados de Evaluación Docente en Instituciones Educativas'
              }
              role={role}
              ambitoTexto={isDirectorRole ? 'Evaluación Docente' : 'Especialistas UGEL'}
              colegio={
                filtros.institucion
                  ? filtros.institucion.startsWith('I.E.')
                    ? filtros.institucion
                    : `I.E. ${filtros.institucion}`
                  : isDirectorRole
                  ? currentUserData?.institucion || 'Mi Institución'
                  : 'Todas las Instituciones Educativas'
              }
              regionTexto={bannerRegionTexto}
              mes={(dataEvaluacionDocente as any)?.mesDelExamen}
              anio={(dataEvaluacionDocente as any)?.añoDelExamen}
              docentesEvaluados={evaluadosCount}
              totalDocentesPadron={docentesPadronDnis.size}
              totalCriterios={totalCriterios}
              totalDominios={dimensionesEspecialistas?.length || 0}
              institucionesParticipantes={
                filtros.institucion
                  ? 1
                  : listaInstituciones.length || globalGroupData?.labels?.length || 0
              }
              totalInstituciones={isDirectorRole ? 1 : listaInstituciones.length || 1}
              layoutMode={layoutMode}
              onChangeLayoutMode={handleToggleLayoutMode}
              variant={bannerConfig.variant}
              onVariantChange={bannerConfig.setBannerVariant}
              isSavingVariant={bannerConfig.isSavingVariant}
              backgroundImage={bannerConfig.backgroundImage}
              backgroundImageOpacity={bannerConfig.backgroundImageOpacity}
              onUploadBackgroundImage={bannerConfig.uploadBannerImage}
              onRemoveBackgroundImage={bannerConfig.removeBannerImage}
              isUploadingImage={bannerConfig.isUploadingImage}
              canConfigureBanner={isAdmin}
              isAdmin={isAdmin}
              backHref={backHref}
            />

            {!hasData ? (
              <div className="py-12">
                <NoHayResultados />
              </div>
            ) : (
              <div className={styles.tableSection}>
              {/* Barra Superior de Filtros y Configuración */}
              <DesempenoFiltrosBar
                filtros={filtros}
                onChangeFiltros={(newFiltros) => setFiltros(newFiltros as any)}
                onResetFiltros={handleLimpiarFiltros}
                showRegionFilter={!isDirectorRole && role !== 'especialista'}
                regiones={regiones}
                regionLabel="UGEL / Región"
                regionPlaceholder="Todas las UGELs"
                showInstitucionFilter={!isDirectorRole && listaInstituciones.length > 0}
                instituciones={listaInstituciones}
                institucionLabel="Institución Educativa"
                institucionPlaceholder="Todas las I.E."
                generos={genero}
                fases={fasesUnicas}
                showFasesFilter={fasesUnicas.length > 0}
                colorMode={colorMode}
                onChangeColorMode={setColorMode}
                showColorModeToggle={Boolean(dimensionesEspecialistas && dimensionesEspecialistas.length > 0)}
                showSettingsMenu={true}
                onOpenOrganizerModal={() => setIsOrganizerModalOpen(true)}
                onOpenGlobalLevelsModal={() => setIsGlobalLevelsModalOpen(true)}
                onOpenDomainLevelsModal={() => setIsDomainLevelsModalOpen(true)}
                onOpenColorModal={() => setIsColorModalOpen(true)}
                hasDomainLevels={Boolean(dimensionesEspecialistas && dimensionesEspecialistas.length > 0)}
                hiddenSectionsCount={DEFAULT_SECTIONS_DOCENTES_ORDER.length - seccionesVisibles.length}
              />

              {/* Banner Informativo cuando hay filtro activo por Institución Educativa */}
              {filtros.institucion && (
                <div className="flex items-center justify-between gap-3 px-4 py-2.5 mb-5 bg-blue-50/80 border border-blue-200/90 rounded-2xl text-xs sm:text-sm text-blue-900 shadow-2xs">
                  <div className="flex items-center gap-2.5">
                    <span className="w-2.5 h-2.5 rounded-full bg-blue-600 animate-pulse shrink-0" />
                    <span>
                      Mostrando resultados exclusivos de la institución:{' '}
                      <strong className="font-bold text-blue-700">
                        {filtros.institucion.startsWith('I.E.')
                          ? filtros.institucion
                          : `I.E. ${filtros.institucion}`}
                      </strong>{' '}
                      ({evaluadosCount} {evaluadosCount === 1 ? 'docente monitoreado' : 'docentes monitoreados'})
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => setFiltros((prev) => ({ ...prev, institucion: '' }))}
                    className="font-bold text-blue-600 hover:text-blue-800 underline cursor-pointer shrink-0"
                  >
                    Ver todas las I.E.
                  </button>
                </div>
              )}

              {/* Mensaje de todas las secciones ocultas */}
              {seccionesVisibles.length === 0 && (
                <div
                  style={{
                    textAlign: 'center',
                    padding: '3.5rem 1.5rem',
                    background: '#f8fafc',
                    borderRadius: '16px',
                    border: '2px dashed #cbd5e1',
                    marginBottom: '2rem',
                  }}
                >
                  <h4 style={{ color: '#1e293b', fontSize: '1.1rem', fontWeight: 700, margin: '0 0 0.5rem 0', fontFamily: 'Montserrat, sans-serif' }}>
                    Todos los gráficos están ocultos
                  </h4>
                  <p style={{ color: '#64748b', fontSize: '0.88rem', margin: '0 0 1.25rem 0', fontFamily: 'Montserrat, sans-serif' }}>
                    Usa el botón de personalizar para activar los gráficos que deseas visualizar.
                  </p>
                  <button
                    type="button"
                    onClick={() => setIsOrganizerModalOpen(true)}
                    style={{
                      padding: '0.65rem 1.35rem',
                      background: '#2563eb',
                      color: 'white',
                      border: 'none',
                      borderRadius: '10px',
                      fontWeight: 600,
                      cursor: 'pointer',
                      fontFamily: 'Montserrat, sans-serif',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '0.5rem',
                    }}
                  >
                    <RiGridFill />
                    <span>Personalizar Gráficos</span>
                  </button>
                </div>
              )}

              {/* Barra Ergonómica de Pestañas (Tabs) / Salto Rápido en Cascada (Fija y visible siempre al hacer scroll) */}
              <div
                id="desempeno-tabs-nav-container"
                className={`sticky top-0 z-[300] bg-white/95 backdrop-blur-md pt-2 transition-all duration-200 ${
                  layoutMode === 'cascade'
                    ? 'pb-1.5 mb-6 border-b border-slate-200/80 shadow-2xs'
                    : 'pb-0 mb-0 shadow-2xs'
                }`}
              >
                <DesempenoTabsNav
                  activeTab={activeTab}
                  onChangeTab={handleTabChange}
                  tabs={tabsList}
                  layoutMode={layoutMode}
                  onChangeLayoutMode={handleToggleLayoutMode}
                  showLayoutSwitch={false}
                />
              </div>

              {/* Contenedor del Reporte: Pestañas (Folder Card) o Cascada Vertical Continua */}
              {layoutMode === 'tabs' ? (
                <div className="bg-white border-x-2 border-b-2 border-blue-600 rounded-b-3xl p-4 sm:p-6 shadow-xs -mt-[2px] min-h-[520px]">
                  {activeTab === 'general' && (
                    <div key="general" className={tabsStyles.tabContentPanel} role="tabpanel" tabIndex={0}>
                      {renderGeneralContent()}
                    </div>
                  )}
                  {activeTab === 'evaluados' && (
                    <div key="evaluados" className={tabsStyles.tabContentPanel} role="tabpanel" tabIndex={0}>
                      {renderEvaluadosContent()}
                    </div>
                  )}
                  {activeTab === 'institucional' && showInstitucionalTab && (
                    <div key="institucional" className={tabsStyles.tabContentPanel} role="tabpanel" tabIndex={0}>
                      {renderInstitucionalContent()}
                    </div>
                  )}
                  {activeTab === 'criterios' && (
                    <div key="criterios" className={tabsStyles.tabContentPanel} role="tabpanel" tabIndex={0}>
                      {renderCriteriosContent()}
                    </div>
                  )}
                </div>
              ) : (
                renderCascadeView()
              )}
            </div>
          )}
        </div>
      )}
    </div>

      {/* Modal Pantalla Completa para Gráficos */}
      {selectedDimensionModal && typeof window !== 'undefined'
        ? (() => {
            const { dim, type } = selectedDimensionModal;
            const isGlobalDominio = type === 'global_dominio';
            const isGlobal = type === 'global_ugel' || type === 'global_especialista' || isGlobalDominio;
            const isUgel = type === 'global_ugel';
            const currentModalColor = isGlobalDominio
              ? '#8b5cf6'
              : isGlobal
              ? (type === 'global_ugel' ? globalUgelColor : globalEspColor)
              : getDomainColor(dim, currentDimIndex);

            let modalChartData: any;
            if (isGlobalDominio) {
              modalChartData = analytics.getDimensionData();
            } else if (type === 'global_ugel') {
              modalChartData = analytics.getGlobalUGELData(globalUgelColor);
            } else if (type === 'global_especialista') {
              modalChartData = analytics.getGlobalPersonData(globalEspColor);
            } else {
              modalChartData = analytics.getPersonDataForDimension(dim?.id, currentModalColor);
            }

            const entityName = isGlobalDominio ? 'Dominio' : (isUgel ? groupLabel : targetNounSingular);
            const modalTitle = isGlobalDominio
              ? 'Puntaje Promedio Global por Dominio — Vista Completa'
              : isGlobal
              ? `Rendimiento Global por ${entityName} — Vista Completa`
              : `Dimensión por ${entityName} — Vista Completa`;

            const maxScore = isGlobalDominio
              ? analytics.maxGlobalDomainScore
              : isGlobal
              ? modalChartData.maxGlobalScore
              : modalChartData.maxDomainScore;

            return createPortal(
              <div className={styles.fullScreenViewContainer}>
                <header className={styles.fullScreenHeader}>
                  <div className={styles.fullScreenTitleGroup}>
                    <h1 className={styles.fullScreenTitle} style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                      <span style={{ display: 'flex', alignItems: 'center' }}>
                        <span
                          className={styles.sectionTitleIndicator}
                          style={{ background: currentModalColor, width: '4px', height: '24px' }}
                        ></span>
                        {modalTitle}
                      </span>
                    </h1>
                    <p className={styles.fullScreenSubtitle}>
                      {isGlobalDominio
                        ? 'Rendimiento Global Consolidado por Dominio'
                        : isGlobal
                        ? 'Evaluación Integral Consolidada'
                        : (dim?.nombre || 'Dimensión')}
                    </p>
                  </div>

                  <div className={styles.fullScreenActions}>
                    <div className={styles.segmentedControl}>
                      <button
                        type="button"
                        className={`${styles.segmentedBtn} ${modalOrientation === 'horizontal' ? styles.segmentedBtnActive : ''}`}
                        onClick={() => setModalOrientation('horizontal')}
                        title="Vista Horizontal"
                        style={{ padding: '0.45rem 0.65rem' }}
                      >
                        <RiBarChartHorizontalLine style={{ fontSize: '1.15rem' }} />
                      </button>
                      <button
                        type="button"
                        className={`${styles.segmentedBtn} ${modalOrientation === 'vertical' ? styles.segmentedBtnActive : ''}`}
                        onClick={() => setModalOrientation('vertical')}
                        title="Vista Vertical"
                        style={{ padding: '0.45rem 0.65rem' }}
                      >
                        <RiBarChart2Line style={{ fontSize: '1.15rem' }} />
                      </button>
                    </div>

                    <div className={styles.segmentedControl}>
                      <button
                        type="button"
                        className={`${styles.segmentedBtn} ${colorMode === 'dominio' ? styles.segmentedBtnActive : ''}`}
                        onClick={() => setColorMode('dominio')}
                        title="Color por Dominio"
                        style={{ padding: '0.45rem 0.65rem' }}
                      >
                        <RiPaletteLine style={{ fontSize: '1.15rem' }} />
                      </button>
                      <button
                        type="button"
                        className={`${styles.segmentedBtn} ${colorMode === 'nivel' ? `${styles.segmentedBtnActive} ${styles.segmentedBtnNivel}` : ''}`}
                        onClick={() => setColorMode('nivel')}
                        title="Color por Nivel de Logro"
                        style={{ padding: '0.45rem 0.65rem' }}
                      >
                        <RiAwardLine style={{ fontSize: '1.15rem' }} />
                      </button>
                    </div>

                    {!isGlobal && totalDims > 1 && (
                      <div className={styles.navDimensionGroup}>
                        <button
                          onClick={handlePrevDimension}
                          disabled={!hasPrevDim}
                          className={styles.navDimensionBtn}
                          title={hasPrevDim ? `Dominio anterior: ${dimensionesEspecialistas[currentDimIndex - 1]?.nombre}` : 'Primer dominio'}
                          style={{ padding: '0.45rem 0.6rem' }}
                        >
                          <RiArrowLeftSLine style={{ fontSize: '1.25rem' }} />
                        </button>
                        <span style={{ fontSize: '0.88rem', fontWeight: 600, color: '#334155' }}>
                          {currentDimIndex + 1} / {totalDims}
                        </span>
                        <button
                          onClick={handleNextDimension}
                          disabled={!hasNextDim}
                          className={styles.navDimensionBtn}
                          title={hasNextDim ? `Dominio siguiente: ${dimensionesEspecialistas[currentDimIndex + 1]?.nombre}` : 'Último dominio'}
                          style={{ padding: '0.45rem 0.6rem' }}
                        >
                          <RiArrowRightSLine style={{ fontSize: '1.25rem' }} />
                        </button>
                      </div>
                    )}

                    <button
                      onClick={() => setSelectedDimensionModal(null)}
                      className={styles.fullScreenCloseBtn}
                      title="Cerrar vista completa (Esc)"
                    >
                      <RiCloseLine />
                    </button>
                  </div>
                </header>

                <div className={styles.fullScreenContent}>
                  {modalOrientation === 'horizontal' ? (
                    <div
                      className={styles.chartContainer}
                      style={{
                        height: `${Math.max(480, modalChartData.labels.length * 44 + 90)}px`,
                        width: '100%',
                        position: 'relative',
                      }}
                    >
                      <Bar
                        key={`modal-chart-h-${type}_${dim?.id || 'all'}`}
                        data={modalChartData}
                        options={
                          isGlobalDominio
                            ? (getDimensionBarOptions(modalChartData.dimList, maxScore) as any)
                            : type === 'global_ugel'
                            ? (getGlobalUgelChartOptions(maxScore, modalChartData.groupList, groupLabel) as any)
                            : type === 'global_especialista'
                            ? (getGlobalPersonChartOptions(maxScore, modalChartData.personList, targetNounSingular) as any)
                            : (getPersonDimensionChartOptions(maxScore, modalChartData.personList, targetNounSingular) as any)
                        }
                        plugins={[barDataLabelPlugin]}
                      />
                    </div>
                  ) : (
                    <div
                      style={{
                        minHeight: '520px',
                        width: '100%',
                        overflowX: modalChartData.labels.length > 14 ? 'auto' : 'visible',
                        position: 'relative',
                      }}
                    >
                      <div
                        style={{
                          width: '100%',
                          minWidth: modalChartData.labels.length > 14 ? `${modalChartData.labels.length * 40}px` : '100%',
                          height: '520px',
                        }}
                      >
                        <Bar
                          key={`modal-chart-v-${type}_${dim?.id || 'all'}`}
                          data={modalChartData}
                          options={
                            isGlobalDominio
                              ? (getDimensionVerticalBarOptions(modalChartData.dimList, maxScore) as any)
                              : type === 'global_ugel'
                              ? (getGlobalUgelVerticalChartOptions(maxScore, modalChartData.groupList, groupLabel) as any)
                              : type === 'global_especialista'
                              ? (getGlobalPersonVerticalChartOptions(maxScore, modalChartData.personList, targetNounSingular) as any)
                              : (getPersonDimensionVerticalChartOptions(maxScore, modalChartData.personList, targetNounSingular) as any)
                          }
                          plugins={[barDataLabelPlugin]}
                        />
                      </div>
                    </div>
                  )}
                  {renderDomainLevelRanges(isGlobal ? undefined : dim)}
                </div>
              </div>,
              document.body
            );
          })()
        : null}

      {/* Modal Personalizar Colores de Dominios */}
      {isColorModalOpen && typeof window !== 'undefined'
        ? createPortal(
            <div className={styles.colorModalOverlay} onClick={() => setIsColorModalOpen(false)}>
              <div className={styles.colorModalContent} onClick={(e) => e.stopPropagation()}>
                <div className={styles.colorModalHeader}>
                  <h2 className={styles.colorModalTitle}>
                    <RiPaletteLine style={{ color: '#6366f1', fontSize: '1.35rem' }} />
                    <span>Personalizar Colores por Dominio</span>
                  </h2>
                  <button onClick={() => setIsColorModalOpen(false)} className={styles.colorModalCloseBtn} title="Cerrar">
                    <RiCloseLine />
                  </button>
                </div>

                <div className={styles.colorModalBody}>
                  <p className={styles.colorModalSubtitle}>
                    Selecciona el color temático para cada dominio de la evaluación. Los cambios se reflejarán en tiempo real en todos los gráficos.
                  </p>

                  {dimensionesEspecialistas &&
                    dimensionesEspecialistas.map((dim: any, idx: number) => {
                      const currentColor = getDomainColor(dim, idx);
                      return (
                        <div key={dim.id || idx} className={styles.domainColorCard}>
                          <div className={styles.domainColorCardHeader}>
                            <span className={styles.domainColorName}>{dim.nombre || `Dominio ${idx + 1}`}</span>
                            <span
                              style={{
                                fontSize: '0.75rem',
                                fontFamily: 'monospace',
                                fontWeight: 700,
                                color: currentColor,
                                background: hexToRgba(currentColor, 0.12),
                                padding: '0.2rem 0.5rem',
                                borderRadius: '6px',
                              }}
                            >
                              {currentColor.toUpperCase()}
                            </span>
                          </div>

                          <div className={styles.domainColorControls}>
                            {PRESET_COLOR_SWATCHES.map((swatch) => {
                              const isSelected = currentColor.toLowerCase() === swatch.hex.toLowerCase();
                              return (
                                <button
                                  key={swatch.hex}
                                  type="button"
                                  onClick={() => handleColorChange(dim.id, swatch.hex)}
                                  className={`${styles.presetSwatch} ${isSelected ? styles.presetSwatchActive : ''}`}
                                  style={{ background: swatch.hex }}
                                  title={`${swatch.label} (${swatch.hex})`}
                                />
                              );
                            })}

                            <label className={styles.customColorBtn} title="Elegir cualquier color personalizado">
                              <span
                                style={{
                                  width: 14,
                                  height: 14,
                                  borderRadius: '50%',
                                  background: currentColor,
                                  display: 'inline-block',
                                }}
                              />
                              <span>Personalizado</span>
                              <input
                                type="color"
                                value={currentColor}
                                onChange={(e) => handleColorChange(dim.id, e.target.value)}
                                className={styles.hiddenColorInput}
                              />
                            </label>
                          </div>
                        </div>
                      );
                    })}
                </div>

                <div className={styles.colorModalFooter}>
                  <button type="button" onClick={handleResetColors} className={styles.resetColorsBtn}>
                    <RiRefreshLine style={{ display: 'inline', marginRight: 4 }} />
                    Restablecer predeterminados
                  </button>
                  <button type="button" onClick={() => setIsColorModalOpen(false)} className={styles.doneColorsBtn}>
                    Listo
                  </button>
                </div>
              </div>
            </div>,
            document.body
          )
        : null}

      {/* Modal Organizar / Reordenar Secciones */}
      <ModoOrganizarEspecialistasModal
        isOpen={isOrganizerModalOpen}
        onClose={() => setIsOrganizerModalOpen(false)}
        ordenSecciones={ordenSecciones}
        onOrderChange={handleOrderChange}
        seccionesVisibles={seccionesVisibles}
        onVisibilityChange={handleVisibilityChange}
        sectionsConfig={SECCIONES_REPORTE_DOCENTES_CONFIG}
      />

      {/* Modales de Configuración de Niveles de Logro */}
      {isGlobalLevelsModalOpen && (
        <ModalConfigurarNiveles
          idEvaluacion={idEvaluacion}
          collectionName={collectionName}
          nivelesActuales={dataEvaluacionDocente?.niveles || (dataEvaluacionDocente as any)?.nivelYPuntaje}
          onClose={() => setIsGlobalLevelsModalOpen(false)}
          onSuccess={() => setIsGlobalLevelsModalOpen(false)}
        />
      )}

      {isDomainLevelsModalOpen && (
        <ModalConfigurarNivelesPorDominio
          idEvaluacion={idEvaluacion}
          collectionName={collectionName}
          dimensiones={dimensionesEspecialistas}
          preguntas={getPreguntaRespuestaDocentes}
          escala={dataEvaluacionDocente?.escala}
          onClose={() => setIsDomainLevelsModalOpen(false)}
          onSuccess={() => setIsDomainLevelsModalOpen(false)}
        />
      )}
    </>
  );
};

export default ReporteGeneralDesempenoContainer;
