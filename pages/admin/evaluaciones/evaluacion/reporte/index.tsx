import { useGlobalContext } from '@/features/context/GlolbalContext';
import { useRouter } from 'next/router';
import React, { useMemo, useCallback, useState, useEffect, useRef } from 'react';
import { useColorsFromCSS } from '@/features/hooks/useColorsFromCSS';
import { ModoOrganizarModal } from '@/components/reportes/ModoOrganizarModal';
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
} from 'chart.js';
import { PreguntasRespuestas } from '@/features/types/types';
import { RiLoader4Line } from 'react-icons/ri';
import { RiBuilding4Line, RiGraduationCapLine } from 'react-icons/ri';
import styles from './Reporte.module.css';
import PrivateRouteEspecialista from '@/components/layouts/PrivateRoutesEspecialista';
import AcordeonGraficosTendencia from '@/components/reportes/AcordeonGraficosTendencia';
import AcordeonReportePregunta from '@/components/reportes/AcordeonReportePregunta';
import LazyReportSection from '@/components/reportes/LazyReportSection';
import PieChartComponent from '@/components/reportes/PieChartComponent';
import BarChartDirectores from '@/components/reportes/BarChartDirectores';
import ParticipacionDirectoresChart from '@/components/reportes/ParticipacionDirectoresChart';
import BarChartDocentes from '@/components/reportes/BarChartDocentes';
import BarChartDocentesBuckets from '@/components/reportes/BarChartDocentesBuckets';
import BarChartDocenteDetalle from '@/components/reportes/BarChartDocenteDetalle';
import BarChartUgelStacked from '@/components/reportes/BarChartUgelStacked';

// Modularized Components
import HeaderControlesReporte from '@/components/reportes/HeaderControlesReporte';
import TablaParticipacionDirectores from '@/components/reportes/TablaParticipacionDirectores';
import DirectorHeroBanner from '@/components/reportes/director/DirectorHeroBanner';
import useReportesBannerConfig from '@/components/reportes/director/useReportesBannerConfig';
import { DirectorLayoutMode } from '@/components/reportes/director/DirectorLayoutModeSwitch';
import AdminTabsNav, { AdminTabKey } from '@/components/reportes/admin/AdminTabsNav';
import tabsStyles from '@/components/reportes/director/DirectorTabsNav.module.css';

// Hook
import { useReporteAdmin } from '@/features/hooks/useReporteAdmin';
import { doc, getDoc, getFirestore } from 'firebase/firestore';
import {
  MdBarChart,
  MdBubbleChart,
  MdTrendingUp,
  MdAssignment,
  MdKeyboardArrowUp,
} from 'react-icons/md';
import { isEvaluacionEnMatriz } from '@/components/reportes/director/useEvaluacionesMatriz';
import UgelBrechasTab from '@/components/reportes/director/UgelBrechasTab';
import AdminTendenciasTab from '@/components/reportes/admin/AdminTendenciasTab';
import { regionTexto } from '@/fuctions/regiones';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend
);

const options = {
  interaction: {
    intersect: false,
    mode: 'index' as const,
  },
  plugins: {
    legend: {
      position: 'center' as const,
    },
    title: {
      display: true,
      text: 'estadistica de respuestas',
    },
    tooltip: {
      backgroundColor: 'rgba(15, 23, 42, 0.95)',
      titleColor: '#ffffff',
      bodyColor: '#ffffff',
      borderColor: 'rgba(59, 130, 246, 0.5)',
      borderWidth: 2,
      cornerRadius: 12,
      displayColors: true,
      titleFont: {
        size: 16,
        weight: 'bold' as const,
        family: "'Inter', 'Helvetica', 'Arial', sans-serif",
      },
      bodyFont: {
        size: 14,
        family: "'Inter', 'Helvetica', 'Arial', sans-serif",
      },
      padding: 16,
      titleSpacing: 8,
      bodySpacing: 8,
      boxPadding: 8,
      callbacks: {
        title: function (context: any) {
          return `📊 Alternativa: ${context[0].label.toUpperCase()}`;
        },
        label: function (context: any) {
          const value = context.parsed.y;
          const dataset = context.dataset;
          const total = Array.isArray(dataset.data)
            ? dataset.data.reduce((a: number, b: number) => a + b, 0)
            : 0;
          const percentage = total > 0 ? ((value / total) * 100).toFixed(1) : '0.0';
          return [
            `👥 Cantidad: ${value.toLocaleString('es-PE')}`,
            `📈 Porcentaje: ${percentage}%`,
            `📊 Total: ${total.toLocaleString('es-PE')}`,
          ];
        },
        labelColor: function (context: any) {
          const dataset = context.dataset;
          const index = context.dataIndex;
          const borderColor = Array.isArray(dataset.borderColor)
            ? dataset.borderColor[index]
            : (typeof dataset.borderColor === 'string' ? dataset.borderColor : '#6b7280');
          const backgroundColor = Array.isArray(dataset.backgroundColor)
            ? dataset.backgroundColor[index]
            : (typeof dataset.backgroundColor === 'string' ? dataset.backgroundColor : '#6b7280');

          return {
            borderColor: borderColor,
            backgroundColor: backgroundColor,
            borderWidth: 3,
            borderRadius: 4,
          };
        },
      },
    },
  },
  scales: {
    x: {
      ticks: {
        color: function (context: any) {
          const chart = context.chart;
          const dataset = chart.data.datasets[0];
          const index = context.index;
          const bgColor = Array.isArray(dataset.backgroundColor)
            ? dataset.backgroundColor[index]
            : (typeof dataset.backgroundColor === 'string' ? dataset.backgroundColor : '');
          if (bgColor.includes('34, 197, 94') || bgColor.includes('rgb(34, 197, 94)')) {
            return '#22c55e';
          }
          return '#374151';
        },
        font: {
          size: 13,
          weight: '600' as const,
          family: "'Inter', 'Helvetica', 'Arial', sans-serif",
        },
      },
    },
  },
};

const Reporte = () => {
  const router = useRouter();
  const {
    currentUserData,
    preguntasRespuestas,
    loaderReporteDirector,
    evaluacion,
    evaluaciones: evaluacionesDb = [],
    dataGraficoTendenciaNiveles,
    dataGraficoUgelStacked,
    loaderDataGraficoUgelStacked,
  } = useGlobalContext();

  const {
    filtros,
    setFiltros,
    distritosDisponibles,
    loadingExport,
    loadingExportEstudiantes,
    loadingDetalleDirectores,
    detalleDirectoresCargado,
    fetchRealtimeDirectoresDetalle,
    rangoMes,
    setRangoMes,
    dataDirectoresBar,
    loadingDirectoresBar,
    chartColumns,
    setChartColumns,
    questionColumns,
    setQuestionColumns,
    dataReportePreguntas,
    loadingReportePreguntas,
    fullDocentesData,
    selectedRange,
    selectedDirectorStatus,
    setSelectedDirectorStatus,
    searchTermDirector,
    setSearchTermDirector,
    selectedRegionDirector,
    setSelectedRegionDirector,
    selectedNivelDirector,
    setSelectedNivelDirector,
    pageSizeDirector,
    setPageSizeDirector,
    consolidationStatus,
    loadingConsolidado,
    monthSelected,
    setMonthSelected,
    yearSelected,
    years,
    handleChangeYear,
    handleChangeFiltros,
    handleRangoChange,
    handleRestablecerFiltros,
    handleBarClick,
    handleDirectorSegmentClick,
    handleSaveMeta,
    handleFiltrarPreguntas,
    handleGenerarConsolidado,
    handleDetenerConsolidado,
    handleExportEstudiantesToExcel,
    handleExportEstudiantesToExcelFronted,
    computedDocentesBuckets,
    filteredDocentesByRange,
    filteredDirectoresByStatus,
    directoresStats,
    hasPieChartData,
    totalEstudiantesPieChart,
    drillDownRef,
    directorsDetailRef,
    loadingCrearEstudiantes,
    loadingProfesoresBuckets,
    handleExportToExcel,
    loadConsolidado,
    fetchBarGraphicsData,
    fetchReportePreguntas,
  } = useReporteAdmin();

  const { prepareBarChartData } = useColorsFromCSS();

  const defaultLayout = [
    'pie_chart',
    'ugel_stacked',
    'directores_bar',
    'docentes_bar',
    'docentes_buckets',
    'participacion_directores',
  ];

  const defaultVisibility = [
    'pie_chart',
    'ugel_stacked',
    'directores_bar',
    'docentes_bar',
    'docentes_buckets',
    'participacion_directores',
    'docente_detalle',
    'graficos_tendencia',
    'reporte_preguntas',
    'tabla_directores',
  ];

  const [ordenGraficos, setOrdenGraficos] = useState<string[]>(defaultLayout);
  const [elementosVisibles, setElementosVisibles] = useState<string[]>(defaultVisibility);
  const [mounted, setMounted] = useState(false);
  const [isOrganizerOpen, setIsOrganizerOpen] = useState(false);
  const [matrizConfigGrados, setMatrizConfigGrados] = useState<Record<string, any>>({});
  const [activeTab, setActiveTab] = useState<AdminTabKey>('general');

  // Modo de diseño del reporte: 'tabs' (pestañas independientes) o 'cascade' (cascada vertical continua)
  const [layoutMode, setLayoutMode] = useState<DirectorLayoutMode>(() => {
    if (typeof window !== 'undefined') {
      try {
        const saved = localStorage.getItem('eva_admin_report_layout');
        if (saved === 'tabs' || saved === 'cascade') return saved;
      } catch (e) {
        console.error('Error al leer layoutMode:', e);
      }
    }
    return 'tabs';
  });

  const handleToggleLayoutMode = (mode: DirectorLayoutMode) => {
    setLayoutMode(mode);
    if (typeof window !== 'undefined') {
      try {
        localStorage.setItem('eva_admin_report_layout', mode);
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

  // Control de scroll programático para modo cascada
  const isProgrammaticScroll = useRef(false);
  const programmaticScrollTimer = useRef<NodeJS.Timeout | null>(null);

  const handleTabChange = useCallback(
    (key: AdminTabKey) => {
      setActiveTab(key);
      if (layoutMode === 'cascade') {
        isProgrammaticScroll.current = true;
        if (programmaticScrollTimer.current) {
          clearTimeout(programmaticScrollTimer.current);
        }
        const elem = document.getElementById(`section-${key}`);
        if (elem) {
          elem.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
        programmaticScrollTimer.current = setTimeout(() => {
          isProgrammaticScroll.current = false;
        }, 850);
      }
    },
    [layoutMode]
  );

  // Configuración global por rol del Hero Banner (Variante Grande vs Compacta e Imagen de Fondo en Firestore)
  const bannerConfig = useReportesBannerConfig({ routeKey: 'especialistas' });

  // Modo de visualización superior: 'compacto' o 'ejecutivo' con Hero Banner
  const [bannerMode, setBannerMode] = useState<'compacto' | 'ejecutivo'>(() => {
    if (typeof window !== 'undefined') {
      try {
        const saved = localStorage.getItem('eva_especialista_banner_mode');
        if (saved === 'ejecutivo' || saved === 'compacto') return saved;
      } catch (e) {
        console.error('Error al leer bannerMode:', e);
      }
    }
    return 'ejecutivo';
  });

  const handleToggleBannerMode = (mode: 'compacto' | 'ejecutivo') => {
    setBannerMode(mode);
    if (typeof window !== 'undefined') {
      try {
        localStorage.setItem('eva_especialista_banner_mode', mode);
      } catch (e) {
        console.error('Error al guardar bannerMode:', e);
      }
    }
  };

  // Permisos exclusivos de Administrador para configurar variante y fondo del banner
  const [isAuditing, setIsAuditing] = useState(false);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const audited = sessionStorage.getItem('audited_user');
      const realAdmin = sessionStorage.getItem('real_admin_user');
      setIsAuditing(Boolean(audited || realAdmin));
    }
  }, [currentUserData]);

  const isAdmin = Boolean(
    isAuditing ||
    currentUserData?.rol === 4 ||
    (currentUserData as any)?.perfil?.rol === 4
  );

  const userRegion = currentUserData?.region ?? (currentUserData as any)?.perfil?.region;

  // Métricas agregadas para el Hero Banner de Especialistas y Panel General
  const totalEstudiantesEvaluados = useMemo(() => {
    // Si tenemos el conteo real regional del gráfico de niveles/PieChart, usamos ese total exacto
    if (typeof totalEstudiantesPieChart === 'number' && totalEstudiantesPieChart > 0) {
      return totalEstudiantesPieChart;
    }
    // Fallback: Si todavía no cargaron los datos de niveles, sumar los directores disponibles
    if (!dataDirectoresBar || !Array.isArray(dataDirectoresBar)) return 0;
    const effectiveRegion = (!isAdmin && userRegion) ? String(userRegion) : filtros?.region;
    const baseList = effectiveRegion
      ? dataDirectoresBar.filter((d) => String(d.region) === String(effectiveRegion))
      : dataDirectoresBar;
    return baseList.reduce((acc, d) => acc + (d.totalEstudiantes || 0), 0);
  }, [totalEstudiantesPieChart, dataDirectoresBar, filtros?.region, isAdmin, userRegion]);

  const porcentajeCobertura = useMemo(() => {
    if (!directoresStats || directoresStats.total <= 0) return 0;
    return Math.round((directoresStats.participo / directoresStats.total) * 100);
  }, [directoresStats]);

  const especialistaStats = useMemo(() => ({
    participaron: directoresStats?.participo || 0,
    total: directoresStats?.total || 0,
    coberturaPorcentaje: porcentajeCobertura,
    totalEstudiantes: totalEstudiantesEvaluados,
    totalDocentes: fullDocentesData?.length || 0,
    totalAlertas: 0,
  }), [directoresStats, porcentajeCobertura, totalEstudiantesEvaluados, fullDocentesData]);

  useEffect(() => {
    let isMounted = true;
    const fetchConfig = async () => {
      try {
        const db = getFirestore();
        const cfgRef = doc(db, 'configuraciones', 'matriz_resultados');
        const snap = await getDoc(cfgRef);
        if (snap.exists() && isMounted) {
          const data = snap.data();
          if (data?.grados) {
            setMatrizConfigGrados(data.grados);
          }
        }
      } catch (err) {
        console.error('Error al cargar configuraciones/matriz_resultados:', err);
      }
    };
    fetchConfig();
    return () => {
      isMounted = false;
    };
  }, []);

  const isEvaluacionConfigurada = useMemo(() => {
    return isEvaluacionEnMatriz(evaluacion?.id, matrizConfigGrados);
  }, [evaluacion?.id, matrizConfigGrados]);

  // Si la pestaña de Brechas no está habilitada para esta evaluación, redireccionar a Panel General
  useEffect(() => {
    if (!isEvaluacionConfigurada && activeTab === 'brechas') {
      setActiveTab('general');
    }
  }, [isEvaluacionConfigurada, activeTab]);

  // Carga diferida (Lazy loading) de preguntas en Modo Pestañas
  useEffect(() => {
    if (
      activeTab === 'preguntas' &&
      dataReportePreguntas.length === 0 &&
      !loadingReportePreguntas
    ) {
      fetchReportePreguntas();
    }
  }, [activeTab, dataReportePreguntas.length, loadingReportePreguntas, fetchReportePreguntas]);

  // Secciones visibles según si Brechas está habilitada
  const visibleSections = useMemo<AdminTabKey[]>(() => {
    const list: AdminTabKey[] = ['general', 'directores', 'docentes'];
    if (isEvaluacionConfigurada) {
      list.push('brechas');
    }
    list.push('tendencia', 'preguntas');
    return list;
  }, [isEvaluacionConfigurada]);

  // Scroll Spy en modo Cascada: sincronizar activeTab según la sección actualmente visible
  useEffect(() => {
    if (layoutMode !== 'cascade') return;

    let rafId: number | null = null;

    const updateActiveTab = () => {
      if (isProgrammaticScroll.current) return;

      const navEl = document.getElementById('admin-tabs-nav-container');
      const stickyBottom = navEl ? Math.max(navEl.getBoundingClientRect().bottom, 60) : 70;
      // Umbral de activación: la sección se considera activa cuando su encabezado alcanza
      // la zona de lectura debajo de las pestañas fijas (+55px de tolerancia).
      const activationOffset = stickyBottom + 55;

      // 1. Detectar si el scroll llegó al final del contenedor o ventana con scroll real
      const contentWrapper = navEl?.closest<HTMLElement>('[class*="contentWrapper"]');
      if (contentWrapper && contentWrapper.scrollTop > 200) {
        const isWrapperBottom =
          contentWrapper.scrollHeight - contentWrapper.scrollTop - contentWrapper.clientHeight <= 40;
        if (isWrapperBottom && visibleSections.length > 0) {
          const lastKey = visibleSections[visibleSections.length - 1];
          setActiveTab((prev) => (prev !== lastKey ? lastKey : prev));
          return;
        }
      } else if (typeof window !== 'undefined' && window.scrollY > 200) {
        const scrollEl = document.scrollingElement || document.documentElement;
        const totalHeight = Math.max(document.body?.scrollHeight || 0, scrollEl?.scrollHeight || 0);
        if (totalHeight > window.innerHeight + 200) {
          const isWindowBottom = window.innerHeight + window.scrollY >= totalHeight - 40;
          if (isWindowBottom && visibleSections.length > 0) {
            const lastKey = visibleSections[visibleSections.length - 1];
            setActiveTab((prev) => (prev !== lastKey ? lastKey : prev));
            return;
          }
        }
      }

      // 2. Encontrar la sección activa en el orden visible
      let activeSectionKey = visibleSections[0];

      for (const tabId of visibleSections) {
        const el = document.getElementById(`section-${tabId}`);
        if (!el) continue;
        const rect = el.getBoundingClientRect();
        if (rect.top <= activationOffset) {
          activeSectionKey = tabId;
        }
      }

      if (activeSectionKey) {
        setActiveTab((prev) => (prev !== activeSectionKey ? activeSectionKey : prev));
      }
    };

    const onScroll = () => {
      if (isProgrammaticScroll.current) return;
      if (rafId !== null) return;
      rafId = window.requestAnimationFrame(() => {
        rafId = null;
        updateActiveTab();
      });
    };

    window.addEventListener('scroll', onScroll, { capture: true, passive: true });
    window.addEventListener('resize', onScroll, { passive: true });

    // Verificación inicial al montar o alternar a modo cascada
    const initialTimer = setTimeout(updateActiveTab, 150);

    return () => {
      window.removeEventListener('scroll', onScroll, { capture: true });
      window.removeEventListener('resize', onScroll);
      clearTimeout(initialTimer);
      if (rafId !== null) {
        window.cancelAnimationFrame(rafId);
      }
    };
  }, [layoutMode, visibleSections]);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (evaluacion?.id) {
      const savedLayout = localStorage.getItem(`report-layout-order-${evaluacion.id}`);
      if (savedLayout) {
        try {
          const parsed = JSON.parse(savedLayout);
          if (Array.isArray(parsed) && parsed.length === defaultLayout.length) {
            setOrdenGraficos(parsed);
          }
        } catch (e) {
          console.error("Error loading layout order:", e);
        }
      }

      const savedVisibility = localStorage.getItem(`report-layout-visibility-${evaluacion.id}`);
      if (savedVisibility) {
        try {
          const parsed = JSON.parse(savedVisibility);
          if (Array.isArray(parsed)) {
            if (!parsed.includes('matriz_ugel')) {
              parsed.push('matriz_ugel');
            }
            setElementosVisibles(parsed);
          }
        } catch (e) {
          console.error("Error loading layout visibility:", e);
        }
      }
    }
  }, [evaluacion?.id, defaultLayout.length]);

  const renderChart = (idGrafico: string) => {
    const gridItemClass = chartColumns === 1 
      ? styles.gridItemFull 
      : chartColumns === 2 
      ? styles.gridItemHalf 
      : styles.gridItemThird;

    const chartNode = (() => {
      switch (idGrafico) {
        case 'pie_chart':
          return evaluacion.tipoDeEvaluacion === '1' && (
            <PieChartComponent
              monthSelected={monthSelected}
              yearSelected={yearSelected}
              dataGraficoTendenciaNiveles={dataGraficoTendenciaNiveles}
              filtros={filtros}
              onFilterChange={(name, value) => {
                if (name === 'region' && !isAdmin) return;
                setFiltros(prev => ({ ...prev, [name]: value }));
              }}
              canChangeRegion={isAdmin}
            />
          );
        case 'ugel_stacked':
          return evaluacion.tipoDeEvaluacion === '1' && (
            loaderDataGraficoUgelStacked ? (
              <div className={styles.loaderContainer} style={{ minHeight: '300px' }}>
                <div className={styles.loaderContent}>
                  <RiLoader4Line className={styles.loaderIcon} />
                  <span className={styles.loaderText}>Procesando comparativa regional...</span>
                </div>
              </div>
            ) : (
              dataGraficoUgelStacked && dataGraficoUgelStacked.length > 0 && (
                <BarChartUgelStacked data={dataGraficoUgelStacked} />
              )
            )
          );
        case 'directores_bar':
          return evaluacion.tipoDeEvaluacion === '1' && (
            loadingDirectoresBar ? (
              <div className={styles.loaderContainer} style={{ minHeight: '300px' }}>
                <div className={styles.loaderContent}>
                  <RiLoader4Line className={styles.loaderIcon} />
                  <span className={styles.loaderText}>Procesando analytics de directores...</span>
                </div>
              </div>
            ) : (
              (evaluacion as any)?.realtimeEnabled && !detalleDirectoresCargado ? (
                <div className={styles.loaderContainer} style={{ minHeight: '300px', flexDirection: 'column', gap: '1rem', justifyContent: 'center', alignItems: 'center', border: '1px dashed #cbd5e1', borderRadius: '12px', padding: '2rem', backgroundColor: '#f8fafc' }}>
                  <p style={{ color: '#64748b', fontSize: '0.95rem', textAlign: 'center', maxWidth: '400px' }}>
                    Las calificaciones detalladas por director se mostrarán una vez que se cargue el detalle de participación.
                  </p>
                  <button 
                    onClick={() => fetchRealtimeDirectoresDetalle()}
                    style={{ 
                      padding: '0.5rem 1rem', 
                      backgroundColor: '#3b82f6', 
                      color: '#fff', 
                      borderRadius: '6px', 
                      border: 'none', 
                      cursor: 'pointer',
                      fontWeight: '500',
                      transition: 'background-color 0.2s'
                    }}
                    onMouseOver={(e) => (e.currentTarget.style.backgroundColor = '#2563eb')}
                    onMouseOut={(e) => (e.currentTarget.style.backgroundColor = '#3b82f6')}
                  >
                    Cargar Detalle de Calificaciones
                  </button>
                </div>
              ) : (
                dataDirectoresBar && dataDirectoresBar.length > 0 && (
                  <BarChartDirectores
                    data={dataDirectoresBar}
                    nivelYPuntaje={evaluacion?.nivelYPuntaje}
                    canChangeRegion={isAdmin}
                    initialRegion={String(userRegion || '')}
                  />
                )
              )
            )
          );
        case 'docentes_bar':
          return evaluacion.tipoDeEvaluacion === '1' && !loadingProfesoresBuckets && fullDocentesData && fullDocentesData.length > 0 && (
            <BarChartDocentes
              data={fullDocentesData}
              nivelYPuntaje={evaluacion?.nivelYPuntaje}
              canChangeRegion={isAdmin}
              initialRegion={String(userRegion || '')}
            />
          );
        case 'docentes_buckets':
          return evaluacion.tipoDeEvaluacion === '1' && (
            loadingProfesoresBuckets ? (
              <div className={styles.loaderContainer} style={{ minHeight: '200px' }}>
                <div className={styles.loaderContent}>
                  <RiLoader4Line className={styles.loaderIcon} />
                  <span className={styles.loaderText}>Cargando distribución de docentes...</span>
                </div>
              </div>
            ) : (
              computedDocentesBuckets.length > 0 && (
                <BarChartDocentesBuckets
                  data={computedDocentesBuckets}
                  totalDocentes={fullDocentesData?.length || 0}
                  onBarClick={handleBarClick}
                />
              )
            )
          );
        case 'participacion_directores':
          return evaluacion.tipoDeEvaluacion === '1' && (
            loadingDirectoresBar ? (
              <div className={styles.loaderContainer} style={{ minHeight: '300px' }}>
                <div className={styles.loaderContent}>
                  <RiLoader4Line className={styles.loaderIcon} />
                  <span className={styles.loaderText}>Cargando participación...</span>
                </div>
              </div>
            ) : (
              dataDirectoresBar && dataDirectoresBar.length > 0 && (
                <ParticipacionDirectoresChart 
                  data={dataDirectoresBar} 
                  onSegmentClick={handleDirectorSegmentClick}
                />
              )
            )
          );
        default:
          return null;
      }
    })();

    if (!chartNode) return null;

    return (
      <div key={idGrafico} className={gridItemClass}>
        {chartNode}
      </div>
    );
  };

  const iterateData = (data: any, respuesta: string) => {
    // Clonar data para no mutar el estado original
    const clonedData = { ...data };
    
    if (Array.isArray(clonedData.alternativas)) {
      // Filtrar la alternativa "no respondió" si su cantidad es 0
      clonedData.alternativas = clonedData.alternativas.filter((alt: any) => {
        const isNoRespondio = alt.descripcion?.toLowerCase() === 'no respondio';
        if (isNoRespondio) {
          return (alt.cantidad ?? 0) > 0;
        }
        return true;
      });
    }

    const chartData = prepareBarChartData(clonedData, respuesta);
    
    if (chartData && chartData.labels && Array.isArray(clonedData.alternativas)) {
      chartData.labels = chartData.labels.map((label: string, idx: number) => {
        const altObj = clonedData.alternativas[idx];
        if (altObj && altObj.descripcion?.toLowerCase() === 'no respondio') {
          return 'NR';
        }
        return label.toUpperCase();
      });
    }
    
    return chartData;
  };

  const preguntasOrdenadas = useMemo(() => {
    return [...(preguntasRespuestas || [])].sort((a, b) => (a.order || 0) - (b.order || 0));
  }, [preguntasRespuestas]);

  const preguntasMap = useMemo(() => {
    const map = new Map<string, PreguntasRespuestas>();
    preguntasOrdenadas.forEach((pregunta) => {
      if (pregunta.id) {
        map.set(pregunta.id, pregunta);
      }
    });
    return map;
  }, [preguntasOrdenadas]);

  const iterarPregunta = useCallback(
    (idPregunta: string) => {
      const pregunta = preguntasMap.get(idPregunta);
      if (!pregunta) {
        return <p>Pregunta no encontrada</p>;
      }
      return (
        <>
          <h3 className="text-slate-500 mr-2">{pregunta.pregunta}</h3>
          <h3 className="text-slate-500 mr-2">
            <span className="text-colorSegundo mr-2 font-semibold">Actuación:</span>{' '}
            {pregunta.preguntaDocente}
          </h3>
        </>
      );
    },
    [preguntasMap]
  );

  const obtenerRespuestaPorId = useCallback(
    (idPregunta: string): string => {
      const pregunta = preguntasMap.get(idPregunta);
      return pregunta?.respuesta || '';
    },
    [preguntasMap]
  );

  const getSectionMeta = (tabId: AdminTabKey) => {
    switch (tabId) {
      case 'general':
        return {
          label: 'Panel General y Macrométricas',
          icon: MdBarChart,
          iconColor: 'text-blue-600',
          iconBg: 'bg-blue-50 border-blue-200/80',
          description: 'Distribución general de niveles de logro y comparativa macro por UGEL.',
          badge: (
            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-semibold bg-blue-50 text-blue-700 border border-blue-200/60">
              {totalEstudiantesEvaluados.toLocaleString('es-PE')} evaluados
            </span>
          ),
        };
      case 'directores':
        return {
          label: 'Gestión y Participación de Directores',
          icon: RiBuilding4Line,
          iconColor: 'text-purple-600',
          iconBg: 'bg-purple-50 border-purple-200/80',
          description: 'Monitoreo de participación institucional, ranking y reporte por directivo.',
          badge: (
            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-semibold bg-purple-50 text-purple-700 border border-purple-200/60">
              {directoresStats.participo} de {directoresStats.total} ({porcentajeCobertura}%)
            </span>
          ),
        };
      case 'docentes':
        return {
          label: 'Rendimiento y Distribución Docente',
          icon: RiGraduationCapLine,
          iconColor: 'text-emerald-600',
          iconBg: 'bg-emerald-50 border-emerald-200/80',
          description: 'Distribución por rangos de desempeño docente, metas pedagógicas y detalle.',
          badge: (
            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200/60">
              {fullDocentesData?.length || 0} docentes
            </span>
          ),
        };
      case 'brechas':
        return {
          label: 'Brechas de Aprendizaje Regional',
          icon: MdBubbleChart,
          iconColor: 'text-amber-600',
          iconBg: 'bg-amber-50 border-amber-200/80',
          description: 'Matriz de brechas regional UGEL con cuadrantes de priorización y decisiones pedagógicas.',
          badge: (
            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-semibold bg-amber-50 text-amber-700 border border-amber-200/60">
              Regional UGEL
            </span>
          ),
        };
      case 'tendencia':
        return {
          label: 'Tendencias Históricas y Evolución',
          icon: MdTrendingUp,
          iconColor: 'text-indigo-600',
          iconBg: 'bg-indigo-50 border-indigo-200/80',
          description: 'Evolución histórica y análisis comparativo longitudinal de niveles de logro.',
          badge: (
            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-semibold bg-indigo-50 text-indigo-700 border border-indigo-200/60">
              Longitudinal
            </span>
          ),
        };
      case 'preguntas':
        return {
          label: 'Análisis Psicométrico por Pregunta',
          icon: MdAssignment,
          iconColor: 'text-cyan-600',
          iconBg: 'bg-cyan-50 border-cyan-200/80',
          description: 'Desglose por ítem, porcentaje de aciertos, distractores y desempeño psicométrico.',
          badge: (
            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-semibold bg-cyan-50 text-cyan-700 border border-cyan-200/60">
              {preguntasRespuestas.length} preguntas
            </span>
          ),
        };
    }
  };

  const renderGeneralContent = () => {
    const generalCharts = (mounted ? ordenGraficos : defaultLayout).filter(
      (id) => (id === 'pie_chart' || id === 'ugel_stacked') && elementosVisibles.includes(id)
    );

    return (
      <div className="space-y-6">
        {generalCharts.length > 0 ? (
          <div className={styles.chartsGrid}>
            {generalCharts.map((idGrafico) => renderChart(idGrafico))}
          </div>
        ) : (
          <div className="p-8 text-center text-slate-500 bg-slate-50 rounded-2xl border border-slate-200">
            No hay gráficos visibles en el Panel General. Puedes activarlos desde el organizador de gráficos.
          </div>
        )}
      </div>
    );
  };

  const renderDirectoresContent = () => {
    const directoresCharts = (mounted ? ordenGraficos : defaultLayout).filter(
      (id) => (id === 'directores_bar' || id === 'participacion_directores') && elementosVisibles.includes(id)
    );

    return (
      <div className="space-y-6">
        {directoresCharts.length > 0 && (
          <div className={styles.chartsGrid}>
            {directoresCharts.map((idGrafico) => renderChart(idGrafico))}
          </div>
        )}

        <div ref={directorsDetailRef}>
          {(elementosVisibles.includes('tabla_directores') || selectedDirectorStatus) && (
            loadingDetalleDirectores ? (
              <div className={styles.loaderContainer} style={{ minHeight: '150px', marginTop: '1.5rem' }}>
                <div className={styles.loaderContent}>
                  <RiLoader4Line className={styles.loaderIcon} />
                  <span className={styles.loaderText}>Cargando perfiles y detalle de directores...</span>
                </div>
              </div>
            ) : (
              <TablaParticipacionDirectores
                styles={styles}
                directorsDetailRef={directorsDetailRef}
                selectedDirectorStatus={selectedDirectorStatus}
                setSelectedDirectorStatus={setSelectedDirectorStatus}
                selectedRegionDirector={selectedRegionDirector}
                setSelectedRegionDirector={setSelectedRegionDirector}
                selectedNivelDirector={selectedNivelDirector}
                setSelectedNivelDirector={setSelectedNivelDirector}
                pageSizeDirector={pageSizeDirector}
                setPageSizeDirector={setPageSizeDirector}
                searchTermDirector={searchTermDirector}
                setSearchTermDirector={setSearchTermDirector}
                filteredDirectoresByStatus={filteredDirectoresByStatus}
                directoresStats={directoresStats}
                canChangeRegion={isAdmin}
              />
            )
          )}
        </div>
      </div>
    );
  };

  const renderDocentesContent = () => {
    const docentesCharts = (mounted ? ordenGraficos : defaultLayout).filter(
      (id) => (id === 'docentes_bar' || id === 'docentes_buckets') && elementosVisibles.includes(id)
    );

    return (
      <div className="space-y-6">
        {docentesCharts.length > 0 && (
          <div className={styles.chartsGrid}>
            {docentesCharts.map((idGrafico) => renderChart(idGrafico))}
          </div>
        )}

        <div ref={drillDownRef}>
          {elementosVisibles.includes('docente_detalle') && selectedRange && filteredDocentesByRange.length > 0 && (
            <BarChartDocenteDetalle
              data={filteredDocentesByRange}
              selectedRange={selectedRange || ''}
              metaSatisfactorio={evaluacion?.metaSatisfactorio || 80}
              onSaveMeta={handleSaveMeta}
            />
          )}
        </div>
      </div>
    );
  };

  const renderBrechasContent = () => (
    <div className="mt-2 mb-4">
      <UgelBrechasTab
        evaluacion={evaluacion}
        evaluacionesDb={evaluacionesDb}
        preguntasRespuestas={preguntasRespuestas}
        currentUserData={currentUserData}
        yearSelected={yearSelected}
        monthSelected={monthSelected}
      />
    </div>
  );

  const renderTendenciaContent = (isDirectView: boolean = false) => (
    <div className="mt-2 mb-4">
      {elementosVisibles.includes('graficos_tendencia') && evaluacion?.tipoDeEvaluacion === '1' && (
        <AdminTendenciasTab
          evaluacion={evaluacion}
          evaluacionesDb={evaluacionesDb}
          currentUserData={currentUserData}
          yearSelected={yearSelected}
          monthSelected={monthSelected}
          initialUgel={filtros.region}
          idEvaluacion={`${router.query.idEvaluacion}`}
          isDirectView={isDirectView}
          isAdmin={isAdmin}
          onSelectEvaluacion={(id) => {
            router.push({
              pathname: '/admin/evaluaciones/evaluacion/reporte',
              query: { idEvaluacion: id },
            });
          }}
        />
      )}
    </div>
  );

  const renderPreguntasContent = (isDirectView: boolean = false) => (
    <div>
      {elementosVisibles.includes('reporte_preguntas') && (
        <AcordeonReportePregunta
          preguntasMap={preguntasMap}
          iterarPregunta={iterarPregunta}
          obtenerRespuestaPorId={obtenerRespuestaPorId}
          iterateData={iterateData}
          options={options}
          filtros={filtros}
          distritosDisponibles={distritosDisponibles}
          handleChangeFiltros={handleChangeFiltros}
          handleRestablecerFiltros={handleRestablecerFiltros}
          handleFiltrar={handleFiltrarPreguntas}
          yearSelected={yearSelected}
          dataReportePreguntas={dataReportePreguntas}
          loadingReportePreguntas={loadingReportePreguntas}
          questionColumns={questionColumns}
          setQuestionColumns={setQuestionColumns}
          globalStyles={styles}
          mostrarDistrito={(evaluacion as any)?.realtimeEnabled === true}
          hideUgelSelect={!isAdmin}
          isDirectView={isDirectView}
        />
      )}
    </div>
  );

  const renderCascadeView = () => {
    return (
      <div className="space-y-6 sm:space-y-8 pb-12">
        {visibleSections.map((tabId) => {
          const meta = getSectionMeta(tabId);
          const Icon = meta.icon;

          return (
            <section
              key={tabId}
              id={`section-${tabId}`}
              className="scroll-mt-24 sm:scroll-mt-28 bg-white rounded-2xl border border-slate-200/90 shadow-2xs hover:shadow-xs transition-shadow duration-200 p-4 sm:p-6"
              aria-label={meta.label}
            >
              {/* Cabecera accesible de la Sección en Cascada */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 mb-5 border-b border-slate-100">
                <div className="flex items-start sm:items-center gap-3 min-w-0">
                  <div
                    className={`w-10 h-10 rounded-xl border flex items-center justify-center shrink-0 ${meta.iconBg}`}
                  >
                    <Icon className={`w-5 h-5 ${meta.iconColor}`} />
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-2.5 flex-wrap">
                      <h2 className="text-base sm:text-lg font-bold text-slate-800 tracking-tight leading-snug">
                        {meta.label}
                      </h2>
                      {meta.badge}
                    </div>
                    <p className="text-xs text-slate-500 leading-tight mt-0.5">
                      {meta.description}
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
                  className="self-end sm:self-center inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-500 hover:text-blue-600 hover:bg-blue-50/80 active:bg-blue-100/60 rounded-xl transition-all duration-150 cursor-pointer border border-slate-200/80 hover:border-blue-200/80 shrink-0 shadow-2xs"
                  title="Volver a la parte superior del reporte"
                  aria-label="Volver arriba"
                >
                  <MdKeyboardArrowUp className="w-4 h-4 text-slate-400 group-hover:text-blue-600" />
                  <span>Subir</span>
                </button>
              </div>

              {/* Contenido Modular de la Sección */}
              <div>
                {tabId === 'general' && renderGeneralContent()}
                {tabId === 'directores' && renderDirectoresContent()}
                {tabId === 'docentes' && renderDocentesContent()}
                {tabId === 'brechas' && isEvaluacionConfigurada && renderBrechasContent()}
                {tabId === 'tendencia' && (
                  <LazyReportSection
                    title="Cargando Tendencias Históricas..."
                    minHeight={360}
                    forceLoad={activeTab === 'tendencia'}
                  >
                    {renderTendenciaContent(true)}
                  </LazyReportSection>
                )}
                {tabId === 'preguntas' && (
                  <LazyReportSection
                    title="Cargando Análisis por Pregunta..."
                    minHeight={450}
                    forceLoad={activeTab === 'preguntas'}
                    onVisible={() => {
                      if (dataReportePreguntas.length === 0 && !loadingReportePreguntas) {
                        fetchReportePreguntas();
                      }
                    }}
                  >
                    {renderPreguntasContent(true)}
                  </LazyReportSection>
                )}
              </div>
            </section>
          );
        })}
      </div>
    );
  };

  if (loaderReporteDirector || !evaluacion) {
    return (
      <div className={styles.loaderContainer}>
        <div className={styles.loaderContent}>
          <RiLoader4Line className={styles.loaderIcon} />
          <span className={styles.loaderText}>...cargando</span>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className={styles.mainContainer}>
        <main>
          {bannerMode === 'ejecutivo' && (
            <DirectorHeroBanner
              role="especialista"
              evaluacion={evaluacion}
              preguntasRespuestas={preguntasRespuestas}
              monthSelected={monthSelected}
              yearSelected={yearSelected}
              colegio={String(
                currentUserData?.institucion ||
                (userRegion ? `UGEL ${regionTexto(userRegion) || userRegion}` : 'UGEL Regional')
              )}
              onSwitchToCompact={() => handleToggleBannerMode('compacto')}
              layoutMode={layoutMode}
              onChangeLayoutMode={handleToggleLayoutMode}
              especialistaStats={especialistaStats}
              variant={bannerConfig.variant}
              onVariantChange={isAdmin ? bannerConfig.setBannerVariant : undefined}
              isSavingVariant={bannerConfig.isSavingVariant}
              backgroundImage={bannerConfig.backgroundImage}
              backgroundImageOpacity={bannerConfig.backgroundImageOpacity}
              onUploadBackgroundImage={isAdmin ? bannerConfig.uploadBannerImage : undefined}
              onRemoveBackgroundImage={isAdmin ? bannerConfig.removeBannerImage : undefined}
              isUploadingImage={bannerConfig.isUploadingImage}
              canConfigureBanner={isAdmin}
            />
          )}

          <HeaderControlesReporte
            evaluacion={evaluacion}
            styles={styles}
            chartColumns={chartColumns}
            setChartColumns={setChartColumns}
            loadingExportEstudiantes={loadingExportEstudiantes || loadingCrearEstudiantes || loadingExport}
            handleExportEstudiantesToExcel={handleExportEstudiantesToExcel}
            loadingExport={loadingExport}
            handleExportToExcel={handleExportToExcel}
            currentUserData={currentUserData}
            loadConsolidado={loadConsolidado}
            fetchBarGraphicsData={fetchBarGraphicsData}
            fetchReportePreguntas={fetchReportePreguntas}
            handleGenerarConsolidado={handleGenerarConsolidado}
            loadingConsolidado={loadingConsolidado}
            hasPieChartData={hasPieChartData}
            consolidationStatus={consolidationStatus}
            handleDetenerConsolidado={handleDetenerConsolidado}
            onOpenOrganizer={() => setIsOrganizerOpen(true)}
            hideTitle={bannerMode === 'ejecutivo'}
            bannerMode={bannerMode}
            onToggleBannerMode={handleToggleBannerMode}
            layoutMode={layoutMode}
            onChangeLayoutMode={handleToggleLayoutMode}
          />

          {/* Barra Ergonómica de Pestañas (Tabs) / Salto Rápido en Cascada */}
          <div
            id="admin-tabs-nav-container"
            className={`transition-all duration-200 ${
              layoutMode === 'cascade'
                ? 'sticky top-0 z-[300] bg-white/95 backdrop-blur-md pt-2 pb-1.5 mb-6 border-b border-slate-200/80 shadow-2xs'
                : ''
            }`}
          >
            <AdminTabsNav
              activeTab={activeTab}
              onChangeTab={handleTabChange}
              totalEstudiantes={totalEstudiantesEvaluados}
              directoresStats={directoresStats}
              totalDocentes={fullDocentesData?.length || 0}
              totalPreguntas={preguntasRespuestas.length}
              hideBrechas={!isEvaluacionConfigurada}
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
              {activeTab === 'directores' && (
                <div key="directores" className={tabsStyles.tabContentPanel} role="tabpanel" tabIndex={0}>
                  {renderDirectoresContent()}
                </div>
              )}
              {activeTab === 'docentes' && (
                <div key="docentes" className={tabsStyles.tabContentPanel} role="tabpanel" tabIndex={0}>
                  {renderDocentesContent()}
                </div>
              )}
              {activeTab === 'brechas' && isEvaluacionConfigurada && (
                <div key="brechas" className={tabsStyles.tabContentPanel} role="tabpanel" tabIndex={0}>
                  {renderBrechasContent()}
                </div>
              )}
              {activeTab === 'tendencia' && (
                <div key="tendencia" className={tabsStyles.tabContentPanel} role="tabpanel" tabIndex={0}>
                  {renderTendenciaContent(true)}
                </div>
              )}
              {activeTab === 'preguntas' && (
                <div key="preguntas" className={tabsStyles.tabContentPanel} role="tabpanel" tabIndex={0}>
                  {renderPreguntasContent(true)}
                </div>
              )}
            </div>
          ) : (
            renderCascadeView()
          )}
        </main>

        <ModoOrganizarModal
          isOpen={isOrganizerOpen}
          onClose={() => setIsOrganizerOpen(false)}
          ordenGraficos={ordenGraficos}
          onOrderChange={(newOrder) => {
            setOrdenGraficos(newOrder);
            if (evaluacion?.id) {
              localStorage.setItem(`report-layout-order-${evaluacion.id}`, JSON.stringify(newOrder));
            }
          }}
          defaultLayout={defaultLayout}
          elementosVisibles={elementosVisibles}
          onVisibilityChange={(newVisible) => {
            setElementosVisibles(newVisible);
            if (evaluacion?.id) {
              localStorage.setItem(`report-layout-visibility-${evaluacion.id}`, JSON.stringify(newVisible));
            }
          }}
          defaultVisibility={defaultVisibility}
        />
      </div>
    </>
  );
};

export default Reporte;
Reporte.Auth = PrivateRouteEspecialista;
