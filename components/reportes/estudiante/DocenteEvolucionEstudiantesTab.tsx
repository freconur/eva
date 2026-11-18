import React, { useState, useMemo, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import {
  MdTimeline,
  MdTrendingUp,
  MdTrendingDown,
  MdTrendingFlat,
  MdSearch,
  MdFilterList,
  MdFileDownload,
  MdPrint,
  MdKeyboardArrowDown,
  MdCheckCircle,
  MdWarning,
  MdInfoOutline,
  MdViewAgenda,
  MdTableRows,
  MdPerson,
  MdSchool,
  MdRestartAlt,
  MdClose,
  MdOpenInFull,
  MdOpenInNew,
  MdChevronLeft,
  MdChevronRight,
  MdPeople,
  MdLayers,
} from 'react-icons/md';
import { RiLoader4Line, RiSparklingLine, RiUser3Line } from 'react-icons/ri';
import { TbChartRadar } from 'react-icons/tb';
import { Line } from 'react-chartjs-2';
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
} from 'chart.js';
import {
  useDocenteEvolucionEstudiantes,
  EstudianteEvolutivo,
  EstudianteEtapaData,
} from './useDocenteEvolucionEstudiantes';
import {
  DocenteActuacionesRadarChart,
  DocenteRadarControls,
  loadStoredCardAdjustments,
  loadStoredRadarDirection,
  clearStoredCardAdjustments,
  CustomCardAdjustment,
  loadStoredTextScale,
  saveStoredTextScale,
} from './DocenteActuacionesRadarChart';
import { searchAndRankStudents } from './searchEstudiantesUtils';
import { Evaluaciones, Estudiante, PreguntasRespuestas } from '@/features/types/types';
import { converSeccion, getGradoTexto } from '@/fuctions/regiones';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

interface DocenteEvolucionEstudiantesTabProps {
  evaluacion: Evaluaciones;
  matrizConfigGrados?: Record<string, any>;
  evaluacionesDb?: any[];
  dniDocente: string | number;
  nombreDocente?: string;
  fotoDocenteUrl?: string;
  nombreColegio?: string;
  currentEstudiantes: Estudiante[];
  yearSelected: number | string;
  monthSelected: number;
  isDemoMode?: boolean;
  availableSections?: { id: string; name: string }[];
  preguntasRespuestas?: PreguntasRespuestas[];
}

export const DocenteEvolucionEstudiantesTab: React.FC<DocenteEvolucionEstudiantesTabProps> = ({
  evaluacion,
  matrizConfigGrados = {},
  evaluacionesDb = [],
  dniDocente,
  nombreDocente = 'Docente',
  fotoDocenteUrl,
  nombreColegio = 'Institución Educativa',
  currentEstudiantes = [],
  yearSelected,
  monthSelected,
  isDemoMode = false,
  availableSections = [],
  preguntasRespuestas = [],
}) => {
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
    dniDocente,
    currentEstudiantes,
    yearSelected,
    monthSelected,
    isDemoMode,
    preguntasRespuestas,
  });

  // Filtros locales
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedSeccion, setSelectedSeccion] = useState<string>('');
  const [trayectoriaFilter, setTrayectoriaFilter] = useState<'todos' | 'superacion' | 'estable' | 'alerta'>('todos');
  const [viewMode, setViewMode] = useState<'matrix' | 'split'>('matrix'); // Por defecto se muestra la Matriz General
  const [visualMode, setVisualMode] = useState<'line' | 'radar'>('line');
  const [selectedStudentDni, setSelectedStudentDni] = useState<string | null>(null);

  // Capas de Evaluación activas globales (afectan tanto al gráfico Lineal como al Radar)
  const [activeStages, setActiveStages] = useState<Record<string, boolean>>({
    edi: true,
    ep1: true,
    ep2: true,
  });

  // Personalizaciones de tarjetas de actuaciones en memoria viva (mientras el usuario interactúa en pantalla/modal)
  const [liveCardAdjustments, setLiveCardAdjustments] = useState<
    Record<number, CustomCardAdjustment>
  >({});

  const toggleStage = (stageKey: string) => {
    setActiveStages((prev) => {
      const next = {
        ...prev,
        [stageKey]: !prev[stageKey],
      };
      // Garantizar que siempre permanezca al menos una etapa seleccionada
      const anyActive = Object.values(next).some(Boolean);
      return anyActive ? next : prev;
    });
  };

  // Estado del Modal a Pantalla Completa del estudiante (Solo un gráfico a la vez: línea o radar)
  const [modalStudent, setModalStudent] = useState<EstudianteEvolutivo | null>(null);
  const [modalVisualMode, setModalVisualMode] = useState<'line' | 'radar'>('line');

  // Diseño seleccionado del gráfico radar para pantalla y exportación PDF ('columnas' o 'flotante')
  const [radarLayoutMode, setRadarLayoutMode] = useState<'columnas' | 'flotante'>('columnas');
  // Feature para dividir el gráfico radar en 2 mitades (2 páginas en PDF)
  const [radarSplitInTwo, setRadarSplitInTwo] = useState<boolean>(false);
  // Sentido de giro del gráfico radar en modo columnas ('horario' o 'antihorario')
  const [radarOrderDirection, setRadarOrderDirection] = useState<'horario' | 'antihorario'>(() => {
    return loadStoredRadarDirection();
  });
  // Feature de escalado de texto de actuaciones en el radar y ficha PDF
  const [radarTextScale, setRadarTextScale] = useState<number>(() => {
    return loadStoredTextScale();
  });
  // Despliegue de la tabla detallada de actuaciones en el modal
  const [modalShowRadarTable, setModalShowRadarTable] = useState<boolean>(false);

  // Estado para el Buscador Centralizado Amplio tipo Spotlight / Command Palette (Ctrl + K)
  const [isSpotlightOpen, setIsSpotlightOpen] = useState<boolean>(false);
  const [spotlightQuery, setSpotlightQuery] = useState<string>('');

  // Control de montaje en cliente para ReactDOM Portal (garantiza renderizado por delante de todo)
  const [mounted, setMounted] = useState<boolean>(false);
  const [exportingDni, setExportingDni] = useState<string | null>(null);
  const [isExportingAll, setIsExportingAll] = useState<boolean>(false);
  const [isCardDropdownOpen, setIsCardDropdownOpen] = useState<boolean>(false);
  const [isModalDropdownOpen, setIsModalDropdownOpen] = useState<boolean>(false);
  const cardDropdownRef = useRef<HTMLDivElement>(null);
  const modalDropdownRef = useRef<HTMLDivElement>(null);

  // Estados y referencias para la función de impresión directa a impresora
  const [printingDni, setPrintingDni] = useState<string | null>(null);
  const [isPrintingAll, setIsPrintingAll] = useState<boolean>(false);
  const [isCardPrintDropdownOpen, setIsCardPrintDropdownOpen] = useState<boolean>(false);
  const [isModalPrintDropdownOpen, setIsModalPrintDropdownOpen] = useState<boolean>(false);
  const cardPrintDropdownRef = useRef<HTMLDivElement>(null);
  const modalPrintDropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Manejo de cierre de menús desplegables al hacer clic fuera
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (
        cardDropdownRef.current &&
        !cardDropdownRef.current.contains(e.target as Node)
      ) {
        setIsCardDropdownOpen(false);
      }
      if (
        modalDropdownRef.current &&
        !modalDropdownRef.current.contains(e.target as Node)
      ) {
        setIsModalDropdownOpen(false);
      }
      if (
        cardPrintDropdownRef.current &&
        !cardPrintDropdownRef.current.contains(e.target as Node)
      ) {
        setIsCardPrintDropdownOpen(false);
      }
      if (
        modalPrintDropdownRef.current &&
        !modalPrintDropdownRef.current.contains(e.target as Node)
      ) {
        setIsModalPrintDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Filtrado reactivo inteligente de estudiantes (Multi-criterio: nombres, apellidos, DNI, sección)
  const filteredStudents = useMemo(() => {
    // 1. Aplicar filtros categóricos (Sección y Estado de Trayectoria)
    const baseList = estudiantesEvolutivos.filter((est) => {
      // Filtro de sección
      if (selectedSeccion && est.seccion !== selectedSeccion) {
        return false;
      }

      // Filtro de estado de trayectoria
      if (trayectoriaFilter !== 'todos' && est.estadoTrayectoria !== trayectoriaFilter) {
        return false;
      }

      return true;
    });

    // 2. Búsqueda inteligente multi-término y difusa con ordenamiento por relevancia
    return searchAndRankStudents(baseList, searchQuery);
  }, [estudiantesEvolutivos, searchQuery, selectedSeccion, trayectoriaFilter]);

  // Resultados de búsqueda inteligente para el buscador Spotlight centralizado
  const spotlightResults = useMemo(() => {
    return searchAndRankStudents(estudiantesEvolutivos, spotlightQuery);
  }, [estudiantesEvolutivos, spotlightQuery]);

  // Estudiante actualmente seleccionado para la Ficha Detallada
  const activeStudent = useMemo(() => {
    if (filteredStudents.length === 0) return null;
    if (selectedStudentDni) {
      const found = filteredStudents.find((s) => s.dni === selectedStudentDni);
      if (found) return found;
    }
    return filteredStudents[0];
  }, [filteredStudents, selectedStudentDni]);

  // Lista de estudiantes para exportación consolidada (respeta filtros actuales de sección o aula)
  const studentsToExport = useMemo(() => {
    return filteredStudents.length > 0 ? filteredStudents : estudiantesEvolutivos;
  }, [filteredStudents, estudiantesEvolutivos]);

  // Manejo de apertura y cierre del Modal de Ficha Individual a Pantalla Completa
  const handleOpenModal = (student: EstudianteEvolutivo) => {
    setModalStudent(student);
    setSelectedStudentDni(student.dni);
    setIsSpotlightOpen(false);
  };

  const handleCloseModal = () => {
    setModalStudent(null);
    setIsSpotlightOpen(false);
  };

  const modalStudentIndex = useMemo(() => {
    if (!modalStudent) return -1;
    return filteredStudents.findIndex((s) => s.dni === modalStudent.dni);
  }, [modalStudent, filteredStudents]);

  const handlePrevStudent = () => {
    if (modalStudentIndex > 0) {
      setModalStudent(filteredStudents[modalStudentIndex - 1]);
    }
  };

  const handleNextStudent = () => {
    if (modalStudentIndex >= 0 && modalStudentIndex < filteredStudents.length - 1) {
      setModalStudent(filteredStudents[modalStudentIndex + 1]);
    }
  };

  // Atajos de teclado: Ctrl + K (activar búsqueda central con efecto) y Escape (cerrar búsqueda / modal)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // 1. Activar con Ctrl + K o Cmd + K (Mac)
      if ((e.ctrlKey || e.metaKey) && (e.key === 'k' || e.key === 'K')) {
        e.preventDefault();
        setIsSpotlightOpen((prev) => !prev);
        setSpotlightQuery('');
        return;
      }

      // 2. Cerrar con Escape
      if (e.key === 'Escape') {
        if (isCardDropdownOpen || isModalDropdownOpen) {
          setIsCardDropdownOpen(false);
          setIsModalDropdownOpen(false);
          return;
        }
        if (isSpotlightOpen) {
          e.preventDefault();
          e.stopPropagation();
          setIsSpotlightOpen(false);
          return;
        }
        if (modalStudent) {
          setModalStudent(null);
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);

    // Bloqueo de scroll cuando el modal o el buscador centralizado están abiertos
    if (modalStudent || isSpotlightOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = 'unset';
    };
  }, [isSpotlightOpen, modalStudent]);

  // Helper para construir los props de PDF de cualquier estudiante
  const buildStudentPDFProps = (estudiante: EstudianteEvolutivo) => {
    const etapasPDF = estudiante.historial.map((hist) => ({
      etapaKey: hist.etapaKey,
      label: hist.label,
      nombreEvaluacion: hist.nombreEvaluacion,
      puntaje: hist.puntaje,
      maxPuntaje: hist.maxPuntaje,
      nivel: hist.nivel,
      nivelColor: hist.nivelColor,
      respuestasCorrectas: hist.respuestasCorrectas,
      totalPreguntas: hist.totalPreguntas,
      porcentaje: hist.porcentaje,
      fecha: hist.fecha,
    }));

    const numActuaciones = (catalogoActuaciones || []).length;
    const effectiveAdjustments =
      Object.keys(liveCardAdjustments).length > 0
        ? { ...loadStoredCardAdjustments(numActuaciones, radarSplitInTwo), ...liveCardAdjustments }
        : loadStoredCardAdjustments(numActuaciones, radarSplitInTwo);

    return {
      estudiante: {
        dni: estudiante.dni,
        nombres: estudiante.nombres,
        apellidos: estudiante.apellidos,
        seccion: estudiante.seccion,
        genero: estudiante.genero,
        fotoUrl: (estudiante as any).fotoUrl || (estudiante as any).foto || undefined,
        puntaje: estudiante.puntajeFinal ?? estudiante.puntajeInicial,
        maxPuntaje: (estudiante.historial && estudiante.historial.length > 0)
          ? estudiante.historial[estudiante.historial.length - 1].maxPuntaje
          : undefined,
        nivel: estudiante.nivelFinal || estudiante.nivelInicial,
      },
      evaluacionActual: {
        id: evaluacion.id,
        nombre: evaluacion.nombre,
        grado: evaluacion.grado,
        añoDelExamen: evaluacion.añoDelExamen,
        mesDelExamen: evaluacion.mesDelExamen,
      },
      nombreDocente,
      fotoDocenteUrl: fotoDocenteUrl || (evaluacion as any).fotoDocenteUrl || undefined,
      nombreColegio,
      historialEtapas: etapasPDF,
      deltaPuntaje: estudiante.deltaPuntaje,
      estadoTrayectoria: estudiante.estadoTrayectoria,
      promedioAula: kpis.promedioAulaActual,
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

  // Manejo de exportación individual en PDF con carga dinámica de @react-pdf/renderer (100% vectorial nítido)
  const handleExportPDF = async (estudiante: EstudianteEvolutivo) => {
    if (exportingDni || isExportingAll) return;
    try {
      setExportingDni(estudiante.dni);
      const { exportarFichaEvolutivaEstudiantePDF } = await import(
        '@/features/utils/exportarFichaEvolutivaEstudiantePDF'
      );
      await exportarFichaEvolutivaEstudiantePDF(buildStudentPDFProps(estudiante));
    } catch (err) {
      console.error('Error al exportar ficha evolutiva en PDF:', err);
    } finally {
      setExportingDni(null);
    }
  };

  // Manejo de exportación consolidada de todos los estudiantes en un único PDF
  const handleExportAllPDF = async () => {
    if (exportingDni || isExportingAll) return;
    const studentsToExport = filteredStudents.length > 0 ? filteredStudents : estudiantesEvolutivos;
    if (studentsToExport.length === 0) return;

    try {
      setIsExportingAll(true);
      const { exportarFichaEvolutivaConsolidadoPDF } = await import(
        '@/features/utils/exportarFichaEvolutivaEstudiantePDF'
      );

      const allProps = studentsToExport.map(buildStudentPDFProps);
      const sanitizedEval = (evaluacion.nombre || 'Aula').replace(/\s+/g, '_');
      const sec = selectedSeccion ? `_Sec_${selectedSeccion}` : '';
      const fileName = `Radar_Consolidado_${sanitizedEval}${sec}.pdf`;

      await exportarFichaEvolutivaConsolidadoPDF(allProps, fileName);
    } catch (err) {
      console.error('Error al exportar consolidado de aula en PDF:', err);
    } finally {
      setIsExportingAll(false);
    }
  };

  // Manejo de impresión directa individual (abre diálogo nativo de impresora)
  const handlePrintPDF = async (estudiante: EstudianteEvolutivo) => {
    if (exportingDni || isExportingAll || printingDni || isPrintingAll) return;
    try {
      setPrintingDni(estudiante.dni);
      const { imprimirFichaEvolutivaEstudiantePDF } = await import(
        '@/features/utils/exportarFichaEvolutivaEstudiantePDF'
      );
      await imprimirFichaEvolutivaEstudiantePDF(buildStudentPDFProps(estudiante));
    } catch (err) {
      console.error('Error al imprimir ficha evolutiva en PDF:', err);
    } finally {
      setPrintingDni(null);
    }
  };

  // Manejo de impresión consolidada directa de todos los estudiantes
  const handlePrintAllPDF = async () => {
    if (exportingDni || isExportingAll || printingDni || isPrintingAll) return;
    const studentsToExport = filteredStudents.length > 0 ? filteredStudents : estudiantesEvolutivos;
    if (studentsToExport.length === 0) return;

    try {
      setIsPrintingAll(true);
      const { imprimirFichaEvolutivaConsolidadoPDF } = await import(
        '@/features/utils/exportarFichaEvolutivaEstudiantePDF'
      );
      const allProps = studentsToExport.map(buildStudentPDFProps);
      await imprimirFichaEvolutivaConsolidadoPDF(allProps);
    } catch (err) {
      console.error('Error al imprimir consolidado de aula en PDF:', err);
    } finally {
      setIsPrintingAll(false);
    }
  };

  // Helper para construir datos del gráfico lineal para cualquier estudiante considerando las etapas activas globales
  const buildStudentChartData = (student: EstudianteEvolutivo | null) => {
    if (!student || etapasConfiguradas.length === 0) {
      return { labels: [], datasets: [] };
    }

    // Filtrar por capas de evaluación activas globales
    const visibleEtapas = etapasConfiguradas.filter(
      (et) => activeStages[et.key] ?? true
    );

    const labels = visibleEtapas.map((et) => et.label);
    const dataAlumno = visibleEtapas.map((et) => {
      const item = student.etapas[et.key];
      return item ? item.puntaje : null;
    });

    const dataAula = visibleEtapas.map((et) => {
      const count = kpis.conteosPorEtapa?.[et.key];
      if (count !== undefined && count === 0) {
        return null;
      }
      const avg = kpis.promediosPorEtapa[et.key];
      return typeof avg === 'number' && (count === undefined ? avg > 0 : true) ? avg : null;
    });

    return {
      labels,
      datasets: [
        {
          label: `${student.nombreCompleto || student.nombresApellidos || 'Estudiante'}`,
          data: dataAlumno,
          borderColor: '#2563eb', // blue-600
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
          label: 'Promedio del Aula',
          data: dataAula,
          borderColor: '#94a3b8', // slate-400
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

  // Helper para calcular la escala máxima según el puntaje máximo de la prueba
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
      const avg = kpis.promediosPorEtapa[et.key];
      if (avg && avg > highest) highest = Math.ceil(avg);
    });
    if (highest <= 20) return 20;
    if (highest <= 40) return 40;
    if (highest <= 100) return 100;
    return Math.ceil(highest / 20) * 20;
  };

  // Helper para generar opciones de Chart.js con espacio superior y etiquetas óptimas
  const buildStudentChartOptions = (maxY: number): any => {
    const stepSize = maxY > 100 ? 40 : maxY > 40 ? 20 : maxY > 20 ? 10 : 4;
    const scaleMax = maxY + stepSize;

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
              return ` ${context.dataset.label}: ${val !== null && val !== undefined ? `${val} pts` : 'Sin evaluación registrada'}`;
            },
          },
        },
      },
      layout: {
        padding: {
          top: 18,
          bottom: 6,
          left: 8,
          right: 14,
        },
      },
      scales: {
        x: {
          offset: true,
          grid: { display: false },
          ticks: {
            font: { size: 11, weight: 'bold' },
            color: '#475569',
          },
        },
        y: {
          min: 0,
          max: scaleMax,
          ticks: {
            stepSize,
            font: { size: 10 },
            color: '#64748b',
          },
          grid: {
            color: '#f1f5f9',
          },
        },
      },
    };
  };

  // Datos para el gráfico de línea evolutiva del estudiante activo en modo Split
  const chartData = useMemo(() => buildStudentChartData(activeStudent), [activeStudent, etapasConfiguradas, kpis.promediosPorEtapa, activeStages]);
  const dynamicMaxY = useMemo(() => calculateStudentMaxY(activeStudent), [activeStudent, etapasConfiguradas, kpis.promediosPorEtapa, activeStages]);
  const chartOptions = useMemo(() => buildStudentChartOptions(dynamicMaxY), [dynamicMaxY]);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-20 min-h-[380px] bg-slate-50/50 rounded-2xl border border-dashed border-slate-200">
        <RiLoader4Line className="w-9 h-9 text-blue-600 animate-spin mb-3" />
        <h4 className="text-base font-bold text-slate-800">Sincronizando información evolutiva</h4>
        <p className="text-xs text-slate-500 mt-1 max-w-sm text-center">
          Procesando historial y trayectorias de los estudiantes a través de las etapas del año lectivo...
        </p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center py-16 bg-rose-50/60 rounded-2xl border border-rose-200 p-6 text-center">
        <MdWarning className="w-10 h-10 text-rose-500 mb-2" />
        <h4 className="text-base font-bold text-rose-800">No se pudieron cargar los datos evolutivos</h4>
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

  const superacionPct =
    kpis.totalEstudiantes > 0 ? Math.round((kpis.totalSuperacion / kpis.totalEstudiantes) * 100) : 0;
  const establePct =
    kpis.totalEstudiantes > 0 ? Math.round((kpis.totalEstable / kpis.totalEstudiantes) * 100) : 0;
  const alertaPct =
    kpis.totalEstudiantes > 0 ? Math.round((kpis.totalAlerta / kpis.totalEstudiantes) * 100) : 0;

  return (
    <div className="flex flex-col gap-4.5 w-full animate-fadeIn">
      {/* 1. Tarjetas de Resumen KPI (Trayectorias y Crecimiento) */}
      <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-5 gap-3">
        {/* Total Estudiantes */}
        <div
          onClick={() => setTrayectoriaFilter('todos')}
          className={`group bg-white rounded-xl border p-3 sm:px-3.5 sm:py-2.5 transition-all duration-150 cursor-pointer relative overflow-hidden flex flex-col justify-between ${
            trayectoriaFilter === 'todos'
              ? 'border-blue-400 ring-2 ring-blue-500/15 shadow-2xs'
              : 'border-slate-200/80 hover:border-slate-300 hover:shadow-2xs'
          }`}
          title="Ver todos los estudiantes evaluados"
        >
          <div className="flex items-center justify-between gap-1.5 mb-1.5">
            <span className="text-xs font-semibold text-slate-500 truncate">Total Evaluados</span>
            <div className="w-6 h-6 rounded-md bg-blue-50 border border-blue-100 flex items-center justify-center text-blue-600 shrink-0">
              <MdPerson className="w-3.5 h-3.5" />
            </div>
          </div>
          <div className="flex items-baseline gap-1.5">
            <span className="text-xl sm:text-2xl font-black text-slate-800 tracking-tight">
              {kpis.totalEstudiantes}
            </span>
            <span className="text-xs text-slate-400 font-medium">alumnos</span>
          </div>
          <p className="text-[10px] text-slate-400 mt-0.5 truncate" title="Con registros en el sistema">
            Con registros en el sistema
          </p>
        </div>

        {/* En Superación */}
        <div
          onClick={() => setTrayectoriaFilter(trayectoriaFilter === 'superacion' ? 'todos' : 'superacion')}
          className={`group bg-white rounded-xl border p-3 sm:px-3.5 sm:py-2.5 transition-all duration-150 cursor-pointer relative overflow-hidden flex flex-col justify-between ${
            trayectoriaFilter === 'superacion'
              ? 'border-emerald-400 ring-2 ring-emerald-500/15 shadow-2xs bg-emerald-50/20'
              : 'border-slate-200/80 hover:border-emerald-300 hover:shadow-2xs'
          }`}
          title="Clic para filtrar estudiantes en superación"
        >
          <div className="flex items-center justify-between gap-1.5 mb-1.5">
            <span className="text-xs font-semibold text-slate-600 truncate">En Superación</span>
            <div className="w-6 h-6 rounded-md bg-emerald-50 border border-emerald-100 flex items-center justify-center text-emerald-600 shrink-0">
              <MdTrendingUp className="w-3.5 h-3.5" />
            </div>
          </div>
          <div className="flex items-baseline gap-1.5">
            <span className="text-xl sm:text-2xl font-black text-emerald-600 tracking-tight">
              {kpis.totalSuperacion}
            </span>
            <span className="inline-flex items-center px-1.5 py-0.2 rounded text-[11px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200/60">
              ({superacionPct}%)
            </span>
          </div>
          <p className="text-[10px] text-slate-400 mt-0.5 truncate" title="Subieron de puntaje o nivel">
            Subieron de puntaje o nivel
          </p>
        </div>

        {/* Rendimiento Estable */}
        <div
          onClick={() => setTrayectoriaFilter(trayectoriaFilter === 'estable' ? 'todos' : 'estable')}
          className={`group bg-white rounded-xl border p-3 sm:px-3.5 sm:py-2.5 transition-all duration-150 cursor-pointer relative overflow-hidden flex flex-col justify-between ${
            trayectoriaFilter === 'estable'
              ? 'border-amber-400 ring-2 ring-amber-500/15 shadow-2xs bg-amber-50/20'
              : 'border-slate-200/80 hover:border-amber-300 hover:shadow-2xs'
          }`}
          title="Clic para filtrar estudiantes con rendimiento estable"
        >
          <div className="flex items-center justify-between gap-1.5 mb-1.5">
            <span className="text-xs font-semibold text-slate-600 truncate">Rendimiento Estable</span>
            <div className="w-6 h-6 rounded-md bg-amber-50 border border-amber-100 flex items-center justify-center text-amber-600 shrink-0">
              <MdTrendingFlat className="w-3.5 h-3.5" />
            </div>
          </div>
          <div className="flex items-baseline gap-1.5">
            <span className="text-xl sm:text-2xl font-black text-amber-600 tracking-tight">
              {kpis.totalEstable}
            </span>
            <span className="inline-flex items-center px-1.5 py-0.2 rounded text-[11px] font-bold bg-amber-50 text-amber-700 border border-amber-200/60">
              ({establePct}%)
            </span>
          </div>
          <p className="text-[10px] text-slate-400 mt-0.5 truncate" title="Mantuvieron su nivel de logro">
            Mantuvieron su nivel de logro
          </p>
        </div>

        {/* En Alerta */}
        <div
          onClick={() => setTrayectoriaFilter(trayectoriaFilter === 'alerta' ? 'todos' : 'alerta')}
          className={`group bg-white rounded-xl border p-3 sm:px-3.5 sm:py-2.5 transition-all duration-150 cursor-pointer relative overflow-hidden flex flex-col justify-between ${
            trayectoriaFilter === 'alerta'
              ? 'border-rose-400 ring-2 ring-rose-500/15 shadow-2xs bg-rose-50/20'
              : 'border-slate-200/80 hover:border-rose-300 hover:shadow-2xs'
          }`}
          title="Clic para filtrar estudiantes en alerta pedagógica"
        >
          <div className="flex items-center justify-between gap-1.5 mb-1.5">
            <span className="text-xs font-semibold text-slate-600 truncate">En Alerta</span>
            <div className="w-6 h-6 rounded-md bg-rose-50 border border-rose-100 flex items-center justify-center text-rose-600 shrink-0">
              <MdTrendingDown className="w-3.5 h-3.5" />
            </div>
          </div>
          <div className="flex items-baseline gap-1.5">
            <span className="text-xl sm:text-2xl font-black text-rose-600 tracking-tight">
              {kpis.totalAlerta}
            </span>
            <span className="inline-flex items-center px-1.5 py-0.2 rounded text-[11px] font-bold bg-rose-50 text-rose-700 border border-rose-200/60">
              ({alertaPct}%)
            </span>
          </div>
          <p className="text-[10px] text-slate-400 mt-0.5 truncate" title="Retroceso o rezago persistente">
            Retroceso o rezago persistente
          </p>
        </div>

        {/* Promedio de Aula */}
        <div className="col-span-2 sm:col-span-2 lg:col-span-1 bg-white rounded-xl border border-slate-200/80 p-3 sm:px-3.5 sm:py-2.5 shadow-2xs hover:border-slate-300 transition-all flex flex-col justify-between">
          <div className="flex items-center justify-between gap-1.5 mb-1.5">
            <span className="text-xs font-semibold text-slate-500 truncate">Promedio de Aula</span>
            <div className="w-6 h-6 rounded-md bg-purple-50 border border-purple-100 flex items-center justify-center text-purple-600 shrink-0">
              <MdSchool className="w-3.5 h-3.5" />
            </div>
          </div>
          <div className="flex items-baseline gap-1.5">
            <span className="text-xl sm:text-2xl font-black text-slate-800 tracking-tight">
              {kpis.promedioAulaActual.toFixed(1)}
            </span>
            <span
              className={`inline-flex items-center px-1.5 py-0.2 rounded text-[11px] font-bold border ${
                kpis.deltaPromedioAula >= 0
                  ? 'bg-emerald-50 text-emerald-700 border-emerald-200/60'
                  : 'bg-rose-50 text-rose-700 border-rose-200/60'
              }`}
            >
              {kpis.deltaPromedioAula > 0 ? `+${kpis.deltaPromedioAula}` : kpis.deltaPromedioAula} pts
            </span>
          </div>
          <p className="text-[10px] text-slate-400 mt-0.5 truncate" title="Crecimiento medio inter-etapas">
            Crecimiento medio inter-etapas
          </p>
        </div>
      </div>

      {/* 2. Barra de Herramientas y Filtros */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-2.5 bg-white p-2.5 sm:p-3 rounded-xl border border-slate-200/80 shadow-2xs">
        {/* Buscador y Filtros */}
        <div className="flex items-center gap-2 flex-wrap flex-1">
          {/* Input de Búsqueda Inteligente con botón de Lupa para mostrar todos los estudiantes */}
          <div className="relative min-w-[220px] max-w-md flex-1">
            <button
              type="button"
              onClick={() => setSearchQuery('')}
              className="absolute left-1.5 top-1/2 -translate-y-1/2 p-1.5 rounded-md text-slate-400 hover:text-blue-600 hover:bg-blue-50 transition-colors cursor-pointer group"
              title="Clic en la lupa para mostrar toda la lista de estudiantes"
              aria-label="Mostrar toda la lista de estudiantes"
            >
              <MdSearch className="w-4 h-4 transition-transform group-hover:scale-110 text-slate-400 group-hover:text-blue-600" />
            </button>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Buscar por nombre, apellido, DNI o combinación (ej. Franco Condori 47163626)..."
              className="w-full pl-9 pr-8 py-1.5 text-xs font-medium bg-slate-50 hover:bg-slate-100/80 focus:bg-white border border-slate-200 rounded-lg outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all placeholder:text-slate-400"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 text-xs w-4 h-4 flex items-center justify-center rounded-full hover:bg-slate-200 transition-colors cursor-pointer"
                title="Limpiar búsqueda"
              >
                ✕
              </button>
            )}
          </div>

          {/* Botón Explícito de Búsqueda con Atajo Ctrl + K */}
          <button
            type="button"
            onClick={() => {
              setIsSpotlightOpen(true);
              setSpotlightQuery(searchQuery);
            }}
            className="px-3.5 py-1.5 bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white text-xs font-bold rounded-lg shadow-2xs transition-colors flex items-center gap-1.5 cursor-pointer shrink-0"
            title="Abrir buscador centralizado (Ctrl + K)"
          >
            <MdSearch className="w-3.5 h-3.5" />
            <span>Buscar</span>
            <kbd className="hidden sm:inline-flex items-center gap-0.5 px-1.5 py-0.5 text-[10px] font-mono bg-blue-700 text-blue-100 rounded border border-blue-500">
              Ctrl K
            </kbd>
          </button>

          {/* Filtro por Sección */}
          {availableSections.length > 0 && (
            <select
              value={selectedSeccion}
              onChange={(e) => setSelectedSeccion(e.target.value)}
              className="px-2.5 py-1.5 text-xs font-semibold bg-slate-50 border border-slate-200 rounded-lg text-slate-700 outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 cursor-pointer"
            >
              <option value="">Todas las Secciones</option>
              {availableSections.map((sec) => (
                <option key={sec.id} value={sec.id}>
                  {sec.name}
                </option>
              ))}
            </select>
          )}

          {/* Chip informativo de filtro de trayectoria activo (cuando se filtra desde las tarjetas superiores) */}
          {trayectoriaFilter !== 'todos' && (
            <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-100 border border-slate-200 text-xs font-medium text-slate-700 animate-fadeIn">
              <span className="text-slate-500 text-[11px]">Filtro:</span>
              <span className="font-semibold flex items-center gap-1">
                {trayectoriaFilter === 'superacion' && (
                  <span className="text-emerald-700 flex items-center gap-1">
                    <MdTrendingUp className="w-3.5 h-3.5" /> Superación
                  </span>
                )}
                {trayectoriaFilter === 'estable' && (
                  <span className="text-amber-700 flex items-center gap-1">
                    <MdTrendingFlat className="w-3.5 h-3.5" /> Estable
                  </span>
                )}
                {trayectoriaFilter === 'alerta' && (
                  <span className="text-rose-700 flex items-center gap-1">
                    <MdTrendingDown className="w-3.5 h-3.5" /> En Alerta
                  </span>
                )}
              </span>
              <button
                type="button"
                onClick={() => setTrayectoriaFilter('todos')}
                className="text-slate-400 hover:text-slate-700 text-xs ml-0.5 cursor-pointer font-bold"
                title="Quitar filtro de trayectoria"
              >
                ✕
              </button>
            </div>
          )}
        </div>

        {/* Conmutador de Vistas: Dividida vs Matriz Completa */}
        <div className="inline-flex items-center p-0.5 bg-slate-100 rounded-lg border border-slate-200/80 shrink-0 self-end sm:self-auto">
          <button
            type="button"
            onClick={() => setViewMode('split')}
            className={`flex items-center gap-1.5 px-3 py-1 text-xs font-semibold rounded-md transition-all cursor-pointer ${
              viewMode === 'split'
                ? 'bg-white text-blue-700 shadow-2xs font-bold'
                : 'text-slate-500 hover:text-slate-700'
            }`}
            title="Vista de Ficha Detallada individual con gráfico"
          >
            <MdViewAgenda className="w-3.5 h-3.5" />
            <span>Ficha Individual</span>
          </button>
          <button
            type="button"
            onClick={() => setViewMode('matrix')}
            className={`flex items-center gap-1.5 px-3 py-1 text-xs font-semibold rounded-md transition-all cursor-pointer ${
              viewMode === 'matrix'
                ? 'bg-white text-blue-700 shadow-2xs font-bold'
                : 'text-slate-500 hover:text-slate-700'
            }`}
            title="Vista de Matriz completa con todos los estudiantes"
          >
            <MdTableRows className="w-3.5 h-3.5" />
            <span>Matriz General</span>
          </button>
        </div>
      </div>

      {/* 3. Contenido Principal */}
      {filteredStudents.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 bg-slate-50/50 rounded-2xl border border-dashed border-slate-200 text-center p-6">
          <MdInfoOutline className="w-10 h-10 text-slate-400 mb-2" />
          <h4 className="text-sm font-bold text-slate-700">No se encontraron estudiantes con los filtros seleccionados</h4>
          <p className="text-xs text-slate-500 mt-1 max-w-sm">
            Intenta cambiar los términos de búsqueda o restablecer los filtros de sección y trayectoria.
          </p>
          <button
            type="button"
            onClick={() => {
              setSearchQuery('');
              setSelectedSeccion('');
              setTrayectoriaFilter('todos');
            }}
            className="mt-4 px-3.5 py-1.5 text-xs font-semibold rounded-xl bg-white border border-slate-200 text-slate-700 hover:bg-slate-100 shadow-2xs cursor-pointer"
          >
            Restablecer Filtros
          </button>
        </div>
      ) : viewMode === 'split' ? (
        /* VISTA DIVIDIDA (SPLIT VIEW): Lista Izquierda + Ficha Derecha */
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
          {/* Columna Izquierda: Lista de Estudiantes */}
          <div className="lg:col-span-5 flex flex-col gap-2.5 max-h-[720px] overflow-y-auto pr-1">
            <div className="flex items-center justify-between pb-1 px-1">
              <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                {searchQuery.trim()
                  ? `Resultados (${filteredStudents.length} de ${estudiantesEvolutivos.length})`
                  : `Estudiantes (${filteredStudents.length})`}
              </span>
              <span className="text-[11px] text-slate-400">Haz clic para ver ficha</span>
            </div>

            {filteredStudents.map((est) => {
              const isSelected = activeStudent?.dni === est.dni;
              const deltaSign = est.deltaPuntaje > 0 ? `+${est.deltaPuntaje}` : `${est.deltaPuntaje}`;

              return (
                <div
                  key={est.dni}
                  onClick={() => setSelectedStudentDni(est.dni)}
                  className={`p-2.5 sm:p-3 rounded-xl border transition-all duration-150 cursor-pointer ${
                    isSelected
                      ? 'bg-blue-50/70 border-blue-500 shadow-2xs ring-1 ring-blue-500/20'
                      : 'bg-white border-slate-200/80 hover:border-blue-300 hover:shadow-2xs'
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-xs font-bold text-slate-900 truncate">
                          {est.nombreCompleto || est.nombresApellidos || 'Estudiante'}
                        </span>
                        {est.seccion && (
                          <span className="inline-flex items-center px-1.5 py-0.2 rounded text-[10px] font-semibold bg-slate-100 text-slate-600">
                            Sec. {converSeccion(Number(est.seccion)) || est.seccion}
                          </span>
                        )}
                      </div>
                      <div className="text-[11px] text-slate-500 mt-0.5">
                        DNI: <span className="font-mono text-slate-600">{est.dni}</span>
                      </div>
                    </div>

                    {/* Estado de Trayectoria Badge */}
                    <div className="shrink-0 flex flex-col items-end gap-1">
                      {est.estadoTrayectoria === 'superacion' && (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-bold bg-emerald-100 text-emerald-800">
                          <MdTrendingUp className="w-3 h-3 text-emerald-600" />
                          <span>{deltaSign} pts</span>
                        </span>
                      )}
                      {est.estadoTrayectoria === 'alerta' && (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-bold bg-rose-100 text-rose-800">
                          <MdTrendingDown className="w-3 h-3 text-rose-600" />
                          <span>{deltaSign} pts</span>
                        </span>
                      )}
                      {est.estadoTrayectoria === 'estable' && (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold bg-amber-100 text-amber-800">
                          <MdTrendingFlat className="w-3 h-3 text-amber-600" />
                          <span>{deltaSign} pts</span>
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Chips con Puntajes de Etapas */}
                  <div className="flex items-center gap-1.5 mt-2 pt-2 border-t border-slate-100 flex-wrap">
                    {etapasConfiguradas.map((etapa) => {
                      const data = est.etapas[etapa.key];
                      if (!data) {
                        return (
                          <span
                            key={etapa.key}
                            className="text-[10px] px-2 py-0.5 rounded-md bg-slate-50 text-slate-400 border border-dashed border-slate-200"
                            title="No evaluado en esta etapa"
                          >
                            {etapa.key.toUpperCase()}: —
                          </span>
                        );
                      }
                      return (
                        <span
                          key={etapa.key}
                          className="text-[10px] font-semibold px-2 py-0.5 rounded-md border flex items-center gap-1"
                          style={{
                            backgroundColor: `${data.nivelColor}15`,
                            borderColor: `${data.nivelColor}40`,
                            color: data.nivelColor,
                          }}
                          title={`${etapa.label}: ${data.puntaje} pts (${data.nivel})`}
                        >
                          <span>{etapa.key.toUpperCase()}:</span>
                          <span className="font-bold">{data.puntaje}</span>
                        </span>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Columna Derecha: Ficha Pedagógica Detallada del Alumno */}
          {activeStudent && (
            <div className="lg:col-span-7 bg-white rounded-2xl border border-slate-200/80 shadow-2xs p-4 sm:p-5 sticky top-24">
              {/* Encabezado del Estudiante */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3.5 mb-4 border-b border-slate-100">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-600 text-white flex items-center justify-center font-bold text-base shadow-xs shrink-0">
                    <RiUser3Line className="w-5 h-5" />
                  </div>
                  <div className="min-w-0">
                    <h3 className="text-base font-bold text-slate-900 tracking-tight leading-snug truncate">
                      {activeStudent.nombreCompleto || activeStudent.nombresApellidos || 'Estudiante'}
                    </h3>
                    <div className="flex items-center gap-2 text-xs text-slate-500 mt-0.5 flex-wrap">
                      <span>DNI: <strong className="font-mono text-slate-700">{activeStudent.dni}</strong></span>
                      <span>•</span>
                      <span>{getGradoTexto(evaluacion.grado)}</span>
                      {activeStudent.seccion && (
                        <>
                          <span>•</span>
                          <span>Sección {converSeccion(Number(activeStudent.seccion)) || activeStudent.seccion}</span>
                        </>
                      )}
                    </div>
                  </div>
                </div>

                {/* Botones de Acción de Ficha Individual */}
                <div className="flex items-center gap-2 shrink-0 self-start sm:self-auto flex-wrap">
                  <button
                    type="button"
                    onClick={() => handleOpenModal(activeStudent)}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200 transition-all cursor-pointer shadow-2xs"
                    title="Ver ficha completa y gráficos en pantalla completa"
                  >
                    <MdOpenInFull className="w-3.5 h-3.5 text-blue-600" />
                    <span>Pantalla Completa</span>
                  </button>

                  {/* Dropdown de Impresión directa: Ficha individual o Consolidado a impresora */}
                  <div className="relative inline-block" ref={cardPrintDropdownRef}>
                    <button
                      type="button"
                      data-testid="print-card-dropdown-trigger"
                      onClick={() => setIsCardPrintDropdownOpen((prev) => !prev)}
                      disabled={Boolean(exportingDni) || isExportingAll || Boolean(printingDni) || isPrintingAll}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 hover:text-slate-900 shadow-2xs hover:shadow-xs transition-all cursor-pointer disabled:cursor-not-allowed shrink-0"
                      title="Imprimir ficha directamente con el diálogo de la impresora"
                      aria-haspopup="true"
                      aria-expanded={isCardPrintDropdownOpen}
                    >
                      <MdPrint
                        className={`w-3.5 h-3.5 text-slate-600 ${(printingDni || isPrintingAll) ? 'animate-bounce text-blue-600' : ''}`}
                      />
                      <span>
                        {isPrintingAll
                          ? `Preparando todas (${studentsToExport.length})...`
                          : printingDni === activeStudent.dni
                          ? 'Preparando...'
                          : 'Imprimir'}
                      </span>
                      <MdKeyboardArrowDown
                        className={`w-3.5 h-3.5 transition-transform duration-200 ${
                          isCardPrintDropdownOpen ? 'rotate-180' : ''
                        }`}
                      />
                    </button>

                    {isCardPrintDropdownOpen && (
                      <div className="absolute right-0 mt-1.5 w-64 bg-white rounded-xl shadow-xl border border-slate-200/90 py-1.5 z-50 animate-fadeIn text-left">
                        <div className="px-3 py-1.5 border-b border-slate-100">
                          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                            Opciones de impresión
                          </span>
                        </div>

                        {/* Opción 1: Imprimir estudiante */}
                        <button
                          type="button"
                          onClick={() => {
                            setIsCardPrintDropdownOpen(false);
                            handlePrintPDF(activeStudent);
                          }}
                          disabled={Boolean(exportingDni) || isExportingAll || Boolean(printingDni) || isPrintingAll}
                          className="w-full text-left px-3 py-2 text-xs hover:bg-slate-50 text-slate-700 hover:text-blue-700 flex items-start gap-2.5 transition-colors cursor-pointer"
                        >
                          <div className="p-1.5 rounded-lg bg-blue-100/60 text-blue-600 shrink-0 mt-0.5">
                            <MdPrint className="w-4 h-4" />
                          </div>
                          <div className="min-w-0">
                            <span className="font-bold block text-slate-800">
                              Imprimir estudiante
                            </span>
                            <span className="text-[11px] text-slate-500 block truncate">
                              Ficha de {activeStudent.nombresApellidos || activeStudent.nombres}
                            </span>
                          </div>
                        </button>

                        {/* Opción 2: Imprimir todas */}
                        <button
                          type="button"
                          onClick={() => {
                            setIsCardPrintDropdownOpen(false);
                            handlePrintAllPDF();
                          }}
                          disabled={Boolean(exportingDni) || isExportingAll || Boolean(printingDni) || isPrintingAll}
                          className="w-full text-left px-3 py-2 text-xs hover:bg-slate-50 text-slate-700 hover:text-emerald-700 flex items-start gap-2.5 transition-colors cursor-pointer border-t border-slate-100"
                        >
                          <div className="p-1.5 rounded-lg bg-emerald-100/60 text-emerald-600 shrink-0 mt-0.5">
                            <MdPrint className="w-4 h-4" />
                          </div>
                          <div className="min-w-0">
                            <span className="font-bold block text-slate-800">
                              Imprimir todas
                            </span>
                            <span className="text-[11px] text-slate-500 block">
                              Consolidado ({studentsToExport.length} {studentsToExport.length === 1 ? 'estudiante' : 'estudiantes'})
                            </span>
                          </div>
                        </button>
                      </div>
                    )}
                  </div>

                  {/* Dropdown de descarga en PDF: Individual o Todas las fichas consolidadas */}
                  <div className="relative inline-block" ref={cardDropdownRef}>
                    <button
                      type="button"
                      onClick={() => setIsCardDropdownOpen((prev) => !prev)}
                      disabled={Boolean(exportingDni) || isExportingAll}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg bg-blue-600 hover:bg-blue-700 active:bg-blue-800 disabled:bg-blue-400 text-white shadow-2xs hover:shadow-xs transition-all cursor-pointer disabled:cursor-not-allowed shrink-0"
                      title="Opciones de descarga de fichas en PDF"
                      aria-haspopup="true"
                      aria-expanded={isCardDropdownOpen}
                    >
                      <MdFileDownload
                        className={`w-4 h-4 ${(exportingDni || isExportingAll) ? 'animate-bounce' : ''}`}
                      />
                      <span>
                        {isExportingAll
                          ? `Generando todas (${studentsToExport.length})...`
                          : exportingDni === activeStudent.dni
                          ? 'Generando estudiante...'
                          : 'Descargar PDF'}
                      </span>
                      <MdKeyboardArrowDown
                        className={`w-3.5 h-3.5 transition-transform duration-200 ${
                          isCardDropdownOpen ? 'rotate-180' : ''
                        }`}
                      />
                    </button>

                    {isCardDropdownOpen && (
                      <div className="absolute right-0 mt-1.5 w-64 bg-white rounded-xl shadow-xl border border-slate-200/90 py-1.5 z-50 animate-fadeIn">
                        <div className="px-3 py-1.5 border-b border-slate-100">
                          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                            Opciones de descarga
                          </span>
                        </div>

                        {/* Opción 1: Descargar estudiante */}
                        <button
                          type="button"
                          onClick={() => {
                            setIsCardDropdownOpen(false);
                            handleExportPDF(activeStudent);
                          }}
                          disabled={Boolean(exportingDni) || isExportingAll}
                          className="w-full text-left px-3 py-2 text-xs hover:bg-blue-50/70 text-slate-700 hover:text-blue-700 flex items-start gap-2.5 transition-colors cursor-pointer"
                        >
                          <div className="p-1.5 rounded-lg bg-blue-100/60 text-blue-600 shrink-0 mt-0.5">
                            <MdPerson className="w-4 h-4" />
                          </div>
                          <div className="min-w-0">
                            <span className="font-bold block text-slate-800">
                              Descargar estudiante
                            </span>
                            <span className="text-[11px] text-slate-500 block truncate">
                              Ficha de {activeStudent.nombresApellidos || activeStudent.nombres}
                            </span>
                          </div>
                        </button>

                        {/* Opción 2: Descargar todas */}
                        <button
                          type="button"
                          onClick={() => {
                            setIsCardDropdownOpen(false);
                            handleExportAllPDF();
                          }}
                          disabled={Boolean(exportingDni) || isExportingAll}
                          className="w-full text-left px-3 py-2 text-xs hover:bg-emerald-50/70 text-slate-700 hover:text-emerald-700 flex items-start gap-2.5 transition-colors cursor-pointer border-t border-slate-100"
                        >
                          <div className="p-1.5 rounded-lg bg-emerald-100/60 text-emerald-600 shrink-0 mt-0.5">
                            <MdPeople className="w-4 h-4" />
                          </div>
                          <div className="min-w-0">
                            <span className="font-bold block text-slate-800">
                              Descargar todas
                            </span>
                            <span className="text-[11px] text-slate-500 block">
                              Consolidado en un solo PDF ({studentsToExport.length} {studentsToExport.length === 1 ? 'estudiante' : 'estudiantes'})
                            </span>
                          </div>
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Diagnóstico Breve y Semáforo */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 mb-4">
                <div
                  className={`p-2.5 sm:p-3 rounded-xl border ${
                    activeStudent.estadoTrayectoria === 'superacion'
                      ? 'bg-emerald-50/70 border-emerald-200 text-emerald-900'
                      : activeStudent.estadoTrayectoria === 'alerta'
                      ? 'bg-rose-50/70 border-rose-200 text-rose-900'
                      : 'bg-amber-50/70 border-amber-200 text-amber-900'
                  }`}
                >
                  <span className="text-[10px] font-semibold uppercase tracking-wider block opacity-75">
                    Trayectoria
                  </span>
                  <span className="text-sm font-bold flex items-center gap-1.5 mt-0.5">
                    {activeStudent.estadoTrayectoria === 'superacion' && (
                      <>
                        <MdTrendingUp className="w-4 h-4 text-emerald-600" />
                        <span>Superación</span>
                      </>
                    )}
                    {activeStudent.estadoTrayectoria === 'alerta' && (
                      <>
                        <MdTrendingDown className="w-4 h-4 text-rose-600" />
                        <span>En Alerta</span>
                      </>
                    )}
                    {activeStudent.estadoTrayectoria === 'estable' && (
                      <>
                        <MdTrendingFlat className="w-4 h-4 text-amber-600" />
                        <span>Estable</span>
                      </>
                    )}
                  </span>
                </div>

                <div className="p-2.5 sm:p-3 rounded-xl border border-slate-200/80 bg-slate-50/60">
                  <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-500 block">
                    Crecimiento Total
                  </span>
                  <span
                    className={`text-sm font-bold mt-0.5 block ${
                      activeStudent.deltaPuntaje >= 0 ? 'text-emerald-600' : 'text-rose-600'
                    }`}
                  >
                    {activeStudent.deltaPuntaje > 0 ? `+${activeStudent.deltaPuntaje}` : activeStudent.deltaPuntaje} puntos
                  </span>
                </div>

                <div className="p-2.5 sm:p-3 rounded-xl border border-slate-200/80 bg-slate-50/60">
                  <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-500 block">
                    Vs. Promedio Aula
                  </span>
                  <span
                    className={`text-sm font-bold mt-0.5 block ${
                      activeStudent.diferenciaConAula >= 0 ? 'text-blue-600' : 'text-slate-700'
                    }`}
                  >
                    {activeStudent.diferenciaConAula > 0
                      ? `+${activeStudent.diferenciaConAula}`
                      : activeStudent.diferenciaConAula} pts
                  </span>
                </div>
              </div>

              {/* Conmutador de Representación Gráfica: Línea Longitudinal vs Mapa Reticular (Radar) */}
              <div className="flex items-center justify-between mb-3 pb-2.5 border-b border-slate-100 flex-wrap gap-2">
                <div className="inline-flex items-center p-1 bg-slate-100 rounded-xl border border-slate-200/80">
                  <button
                    type="button"
                    onClick={() => setVisualMode('line')}
                    className={`flex items-center gap-1.5 px-3 py-1 text-xs font-semibold rounded-lg transition-all cursor-pointer ${
                      visualMode === 'line'
                        ? 'bg-white text-blue-700 shadow-2xs font-bold'
                        : 'text-slate-500 hover:text-slate-700'
                    }`}
                  >
                    <MdTimeline className="w-3.5 h-3.5" />
                    <span>Trayectoria de Puntaje</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setVisualMode('radar')}
                    className={`flex items-center gap-1.5 px-3 py-1 text-xs font-semibold rounded-lg transition-all cursor-pointer ${
                      visualMode === 'radar'
                        ? 'bg-blue-600 text-white shadow-2xs font-bold'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    <TbChartRadar className="w-3.5 h-3.5" />
                    <span>Mapa Reticular de Actuaciones</span>
                  </button>
                </div>

                {visualMode === 'line' && (
                  <span className="text-[11px] font-semibold text-slate-500 bg-slate-100/80 px-2 py-0.5 rounded-md border border-slate-200/80">
                    Puntaje máx: {dynamicMaxY} pts
                  </span>
                )}
              </div>

              {visualMode === 'line' ? (
                /* Gráfico de Línea Evolutiva */
                <div className="mb-4 pb-4 border-b border-slate-100">
                  <div className="h-44 sm:h-52 w-full">
                    <Line data={chartData} options={chartOptions} />
                  </div>
                </div>
              ) : (
                /* Gráfico Radar Reticular de Actuaciones Pedagógicas */
                <div className="mb-4">
                  <DocenteActuacionesRadarChart
                    student={activeStudent}
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
                    onAdjustmentsChange={setLiveCardAdjustments}
                    textScale={radarTextScale}
                    onTextScaleChange={(scale) => {
                      setRadarTextScale(scale);
                      saveStoredTextScale(scale);
                    }}
                  />
                </div>
              )}

              {/* Tarjetas de Desempeño por Etapa */}
              <div>
                <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider mb-2.5">
                  Detalle por Etapa Evaluativa
                </h4>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                  {etapasConfiguradas
                    .filter((etapa) => activeStages[etapa.key] ?? true)
                    .map((etapa) => {
                    const item = activeStudent.etapas[etapa.key];
                    if (!item) {
                      return (
                        <div
                          key={etapa.key}
                          className="p-2.5 sm:p-3 rounded-xl border border-dashed border-slate-200 bg-slate-50/50 flex flex-col items-center justify-center text-center min-h-[80px]"
                        >
                          <span className="text-xs font-bold text-slate-400">{etapa.label}</span>
                          <span className="text-[11px] text-slate-400 mt-1">Sin evaluación</span>
                        </div>
                      );
                    }

                    return (
                      <div
                        key={etapa.key}
                        className="p-2.5 sm:p-3 rounded-xl border border-slate-200/80 bg-white shadow-2xs"
                      >
                        <div className="flex items-center justify-between mb-1.5">
                          <span className="text-xs font-bold text-slate-700 truncate max-w-[120px] flex items-center gap-1.5">
                            <span
                              className="w-2 h-2 rounded-full inline-block shrink-0"
                              style={{
                                backgroundColor:
                                  etapa.key === 'edi'
                                    ? '#2563eb'
                                    : etapa.key === 'ep1'
                                    ? '#f59e0b'
                                    : '#10b981',
                              }}
                            />
                            {etapa.label}
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

                        <div className="flex items-baseline gap-1.5 mt-1">
                          <span className="text-xl font-black text-slate-900">{item.puntaje}</span>
                          <span className="text-xs text-slate-400">/ {item.maxPuntaje} pts</span>
                        </div>

                        <div className="flex items-center justify-between text-[11px] text-slate-500 mt-2 pt-2 border-t border-slate-100">
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

              {/* Recomendación Pedagógica de Cierre */}
              <div className="mt-4 p-3 rounded-xl bg-slate-50 border border-slate-200/80 text-xs text-slate-600 leading-relaxed">
                <strong className="text-slate-800 font-bold block mb-1">
                  💡 Orientación Formativa Sugerida:
                </strong>
                {activeStudent.estadoTrayectoria === 'superacion' && (
                  <span>
                    El estudiante ha mostrado una curva ascendente de consolidación. Se sugiere proponer actividades de ampliación o rol de monitor de equipo.
                  </span>
                )}
                {activeStudent.estadoTrayectoria === 'alerta' && (
                  <span>
                    El estudiante registra un retroceso o permanencia en niveles críticos. Se recomienda una sesión individual de retroalimentación reflexiva.
                  </span>
                )}
                {activeStudent.estadoTrayectoria === 'estable' && (
                  <span>
                    Rendimiento regular. Enfocar el refuerzo en los ítems intermedios para facilitar su transición al nivel Satisfactorio.
                  </span>
                )}
              </div>
            </div>
          )}
        </div>
      ) : (
        /* VISTA DE MATRIZ COMPLETA (FULL MATRIX VIEW) */
        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-2xs overflow-hidden">
          {/* Cabecera con Buscador Integrado y Botón Buscar */}
          <div className="py-3 px-4 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-slate-50/70">
            <span className="text-xs font-bold text-slate-600 uppercase tracking-wider flex items-center gap-2">
              <MdPeople className="w-4 h-4 text-blue-600" />
              <span>
                {searchQuery.trim()
                  ? `RESULTADOS (${filteredStudents.length} de ${estudiantesEvolutivos.length})`
                  : `ESTUDIANTES (${filteredStudents.length})`}
              </span>
            </span>

            <div className="flex items-center gap-2 flex-wrap">
              {/* Buscador Integrado en la Cabecera de la Tabla */}
              <div className="relative min-w-[210px] sm:min-w-[280px]">
                <button
                  type="button"
                  onClick={() => setSearchQuery('')}
                  className="absolute left-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-blue-600 transition-colors cursor-pointer group p-0.5"
                  title="Clic en la lupa para mostrar toda la lista de estudiantes"
                  aria-label="Mostrar toda la lista de estudiantes"
                >
                  <MdSearch className="w-4 h-4 text-slate-400 group-hover:text-blue-600" />
                </button>
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Buscar estudiante por nombre o DNI..."
                  className="w-full pl-8 pr-7 py-1.5 text-xs bg-white border border-slate-200 rounded-lg outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all font-medium placeholder:text-slate-400"
                />
                {searchQuery && (
                  <button
                    type="button"
                    onClick={() => setSearchQuery('')}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 text-xs w-4 h-4 flex items-center justify-center rounded-full hover:bg-slate-200 transition-colors cursor-pointer"
                    title="Limpiar búsqueda"
                  >
                    ✕
                  </button>
                )}
              </div>

              {/* Botón Buscar en la Matriz (Abre Spotlight centrado con Ctrl + K) */}
              <button
                type="button"
                onClick={() => {
                  setIsSpotlightOpen(true);
                  setSpotlightQuery(searchQuery);
                }}
                className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white text-xs font-bold rounded-lg shadow-2xs transition-colors flex items-center gap-1.5 cursor-pointer shrink-0"
                title="Abrir buscador centralizado (Ctrl + K)"
              >
                <MdSearch className="w-3.5 h-3.5" />
                <span>Buscar</span>
                <kbd className="hidden sm:inline-flex items-center gap-0.5 px-1 py-0.5 text-[9px] font-mono bg-blue-700 text-blue-100 rounded border border-blue-500">
                  Ctrl K
                </kbd>
              </button>

              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery('')}
                  className="px-2.5 py-1.5 bg-white hover:bg-slate-100 text-slate-700 text-xs font-semibold rounded-lg border border-slate-200 shadow-2xs transition-colors cursor-pointer shrink-0"
                  title="Mostrar todos los estudiantes"
                >
                  Mostrar todos
                </button>
              )}

              <span className="hidden md:inline-flex text-xs font-medium text-slate-400 items-center gap-1.5 ml-1">
                <span>Haz clic para ver ficha</span>
                <MdOpenInNew className="w-3.5 h-3.5 text-blue-500" />
              </span>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50/80 border-b border-slate-200/80 text-[11px] font-bold text-slate-600 uppercase tracking-wider">
                  <th className="py-2.5 px-3 text-center w-10">#</th>
                  <th className="py-2.5 px-4 min-w-[180px]">Estudiante</th>
                  <th className="py-2.5 px-3 text-center w-24">DNI</th>
                  <th className="py-2.5 px-3 text-center w-16">Sec.</th>
                  {etapasConfiguradas.map((et) => {
                    const color =
                      et.key === 'edi'
                        ? '#2563eb'
                        : et.key === 'ep1'
                        ? '#f59e0b'
                        : '#10b981';
                    return (
                      <th key={et.key} className="py-2.5 px-3 text-center min-w-[90px]">
                        <span className="inline-flex items-center gap-1.5 justify-center">
                          <span
                            className="w-2 h-2 rounded-full inline-block shrink-0"
                            style={{ backgroundColor: color }}
                          />
                          <span>{et.label}</span>
                        </span>
                      </th>
                    );
                  })}
                  <th className="py-2.5 px-3 text-center w-24">Delta</th>
                  <th className="py-2.5 px-3 text-center w-32">Trayectoria</th>
                  <th className="py-2.5 px-3 text-center w-28">Ficha</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-xs">
                {filteredStudents.map((est, idx) => {
                  const deltaSign = est.deltaPuntaje > 0 ? `+${est.deltaPuntaje}` : `${est.deltaPuntaje}`;

                  return (
                    <tr
                      key={est.dni}
                      className="hover:bg-blue-50/50 transition-colors cursor-pointer group"
                      onClick={() => handleOpenModal(est)}
                      title="Haz clic para abrir ficha y gráficos a pantalla completa"
                    >
                      <td className="py-2.5 px-3 text-center text-slate-400 font-mono text-[11px]">
                        {idx + 1}
                      </td>
                      <td className="py-2.5 px-4 font-bold text-slate-800 group-hover:text-blue-700 transition-colors">
                        <div className="flex items-center gap-2">
                          <span>{est.nombreCompleto || est.nombresApellidos || 'Estudiante'}</span>
                          <MdOpenInNew className="w-3.5 h-3.5 text-blue-500 opacity-0 group-hover:opacity-100 transition-opacity shrink-0" />
                        </div>
                      </td>
                      <td className="py-2.5 px-3 text-center font-mono text-slate-500 text-[11px]">
                        {est.dni}
                      </td>
                      <td className="py-2.5 px-3 text-center font-semibold text-slate-600">
                        {converSeccion(Number(est.seccion)) || est.seccion || '—'}
                      </td>

                      {/* Columnas de Etapas */}
                      {etapasConfiguradas.map((et) => {
                        const item = est.etapas[et.key];
                        if (!item) {
                          return (
                            <td key={et.key} className="py-2.5 px-3 text-center text-slate-300">
                              —
                            </td>
                          );
                        }
                        return (
                          <td key={et.key} className="py-2.5 px-3 text-center">
                            <span
                              className="inline-flex items-center gap-1 font-bold px-2 py-0.5 rounded-md text-xs"
                              style={{
                                backgroundColor: `${item.nivelColor}15`,
                                color: item.nivelColor,
                              }}
                              title={`${item.nivel} (${item.porcentaje}% aciertos)`}
                            >
                              <span>{item.puntaje}</span>
                            </span>
                          </td>
                        );
                      })}

                      {/* Columna Delta */}
                      <td className="py-2.5 px-3 text-center font-bold">
                        <span
                          className={
                            est.deltaPuntaje > 0
                              ? 'text-emerald-600'
                              : est.deltaPuntaje < 0
                              ? 'text-rose-600'
                              : 'text-amber-600'
                          }
                        >
                          {deltaSign} pts
                        </span>
                      </td>

                      {/* Columna Trayectoria */}
                      <td className="py-2.5 px-3 text-center">
                        {est.estadoTrayectoria === 'superacion' && (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800">
                            <MdTrendingUp className="w-3 h-3 text-emerald-600" />
                            <span>Superación</span>
                          </span>
                        )}
                        {est.estadoTrayectoria === 'alerta' && (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-rose-100 text-rose-800">
                            <MdTrendingDown className="w-3 h-3 text-rose-600" />
                            <span>Alerta</span>
                          </span>
                        )}
                        {est.estadoTrayectoria === 'estable' && (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-semibold bg-amber-100 text-amber-800">
                            <MdTrendingFlat className="w-3 h-3 text-amber-600" />
                            <span>Estable</span>
                          </span>
                        )}
                      </td>

                      {/* Columna Acciones / Ficha */}
                      <td className="py-2.5 px-3 text-center">
                        <div className="flex items-center justify-center gap-1">
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleOpenModal(est);
                            }}
                            className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-[11px] font-bold text-blue-700 bg-blue-50 hover:bg-blue-100 border border-blue-200/80 transition-colors cursor-pointer shadow-2xs"
                            title="Abrir ficha pedagógica y gráficos a pantalla completa"
                          >
                            <MdOpenInFull className="w-3 h-3 text-blue-600" />
                            <span>Ficha</span>
                          </button>
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleExportPDF(est);
                            }}
                            disabled={exportingDni === est.dni || printingDni === est.dni}
                            className="p-1 rounded-lg text-slate-400 hover:text-blue-600 hover:bg-blue-50 disabled:opacity-50 transition-colors cursor-pointer disabled:cursor-not-allowed"
                            title="Descargar Ficha PDF del estudiante"
                          >
                            <MdFileDownload className={`w-4 h-4 ${exportingDni === est.dni ? 'animate-bounce text-blue-600' : ''}`} />
                          </button>
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              handlePrintPDF(est);
                            }}
                            disabled={exportingDni === est.dni || printingDni === est.dni}
                            className="p-1 rounded-lg text-slate-400 hover:text-slate-800 hover:bg-slate-100 disabled:opacity-50 transition-colors cursor-pointer disabled:cursor-not-allowed"
                            title="Imprimir Ficha del estudiante"
                          >
                            <MdPrint className={`w-4 h-4 ${printingDni === est.dni ? 'animate-bounce text-blue-600' : ''}`} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 4. MODAL A PANTALLA COMPLETA TOTAL (PORTAL BODY, Z-[999999], EDGE-TO-EDGE) */}
      {/* ========================================================================= */}
      {mounted && typeof document !== 'undefined' && modalStudent && createPortal(
        <div
          className="fixed inset-0 w-screen h-screen min-h-screen z-[999999] bg-slate-100 flex flex-col overflow-hidden animate-fadeIn"
          role="dialog"
          aria-modal="true"
          aria-label={`Ficha de evolución de ${modalStudent.nombreCompleto || modalStudent.nombresApellidos}`}
        >
          {/* 1. Modal Top Full-Width Header */}
          <header className="w-full bg-white border-b border-slate-200 px-4 sm:px-6 md:px-8 py-3 flex flex-col md:flex-row md:items-center justify-between gap-3 shrink-0 shadow-2xs z-20">
            <div className="flex items-center gap-3.5 min-w-0">
              <div className="w-11 h-11 rounded-2xl bg-gradient-to-tr from-blue-600 to-indigo-600 text-white flex items-center justify-center font-bold text-lg shadow-xs shrink-0">
                <RiUser3Line className="w-6 h-6" />
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-2.5 flex-wrap">
                  <h2 className="text-base sm:text-lg md:text-xl font-black text-slate-900 tracking-tight truncate">
                    {modalStudent.nombreCompleto || modalStudent.nombresApellidos || 'Estudiante'}
                  </h2>
                  {modalStudent.seccion && (
                    <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-slate-100 text-slate-700 border border-slate-200">
                      Sec. {converSeccion(Number(modalStudent.seccion)) || modalStudent.seccion}
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-2 text-xs text-slate-500 mt-0.5 flex-wrap">
                  <span>DNI: <strong className="font-mono text-slate-700">{modalStudent.dni}</strong></span>
                  <span>•</span>
                  <span>{getGradoTexto(evaluacion.grado)}</span>
                  <span>•</span>
                  <span className="text-slate-500 font-medium">
                    Estudiante {modalStudentIndex + 1} de {filteredStudents.length}
                  </span>
                </div>
              </div>
            </div>

            {/* Controles de Navegación entre Estudiantes y Acciones Principales */}
            <div className="flex items-center gap-2.5 self-end md:self-auto flex-wrap">
              {/* Botón de Búsqueda de Estudiante (Spotlight Centrado con Ctrl + K) */}
              <button
                type="button"
                onClick={() => {
                  setIsSpotlightOpen(true);
                  setSpotlightQuery('');
                }}
                className="inline-flex items-center gap-1.5 px-2.5 py-2 text-xs font-bold rounded-xl bg-white hover:bg-blue-50 text-slate-700 hover:text-blue-700 border border-slate-200 hover:border-blue-300 transition-all cursor-pointer shadow-2xs"
                title="Buscar estudiante en toda la lista (Ctrl + K)"
                aria-label="Buscar estudiante (Ctrl + K)"
              >
                <MdSearch className="w-4 h-4 text-blue-600" />
                <kbd className="inline-flex items-center gap-0.5 px-1.5 py-0.5 text-[10px] font-mono bg-slate-100 text-slate-500 rounded border border-slate-200">
                  Ctrl K
                </kbd>
              </button>

              {filteredStudents.length > 1 && (
                <div className="inline-flex items-center p-0.5 bg-slate-50 border border-slate-200 rounded-xl shadow-2xs">
                  <button
                    type="button"
                    onClick={handlePrevStudent}
                    disabled={modalStudentIndex <= 0}
                    className="p-1.5 rounded-lg text-slate-600 hover:text-blue-600 hover:bg-white disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer transition-colors"
                    title="Estudiante anterior"
                  >
                    <MdChevronLeft className="w-5 h-5" />
                  </button>
                  <span className="text-xs font-bold text-slate-600 px-2.5 min-w-[55px] text-center font-mono">
                    {modalStudentIndex + 1} / {filteredStudents.length}
                  </span>
                  <button
                    type="button"
                    onClick={handleNextStudent}
                    disabled={modalStudentIndex >= filteredStudents.length - 1}
                    className="p-1.5 rounded-lg text-slate-600 hover:text-blue-600 hover:bg-white disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer transition-colors"
                    title="Siguiente estudiante"
                  >
                    <MdChevronRight className="w-5 h-5" />
                  </button>
                </div>
              )}

              {/* Dropdown de impresión directa dentro del Modal */}
              <div className="relative inline-block" ref={modalPrintDropdownRef}>
                <button
                  type="button"
                  data-testid="print-modal-dropdown-trigger"
                  onClick={() => setIsModalPrintDropdownOpen((prev) => !prev)}
                  disabled={Boolean(exportingDni) || isExportingAll || Boolean(printingDni) || isPrintingAll}
                  className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-bold rounded-xl bg-white hover:bg-slate-50 active:bg-slate-100 disabled:opacity-50 text-slate-700 hover:text-slate-900 border border-slate-200 shadow-2xs transition-colors cursor-pointer disabled:cursor-not-allowed"
                  title="Opciones de impresión directa"
                  aria-haspopup="true"
                  aria-expanded={isModalPrintDropdownOpen}
                >
                  <MdPrint
                    className={`w-4 h-4 text-slate-600 ${(printingDni || isPrintingAll) ? 'animate-bounce text-blue-600' : ''}`}
                  />
                  <span className="hidden sm:inline">
                    {isPrintingAll
                      ? `Preparando todas (${studentsToExport.length})...`
                      : printingDni === modalStudent.dni
                      ? 'Preparando...'
                      : 'Imprimir'}
                  </span>
                  <MdKeyboardArrowDown
                    className={`w-3.5 h-3.5 transition-transform duration-200 ${
                      isModalPrintDropdownOpen ? 'rotate-180' : ''
                    }`}
                  />
                </button>

                {isModalPrintDropdownOpen && (
                  <div className="absolute right-0 mt-1.5 w-64 bg-white rounded-xl shadow-xl border border-slate-200/90 py-1.5 z-50 animate-fadeIn text-left">
                    <div className="px-3 py-1.5 border-b border-slate-100">
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                        Opciones de impresión directa
                      </span>
                    </div>

                    <button
                      type="button"
                      onClick={() => {
                        setIsModalPrintDropdownOpen(false);
                        handlePrintPDF(modalStudent);
                      }}
                      disabled={Boolean(exportingDni) || isExportingAll || Boolean(printingDni) || isPrintingAll}
                      className="w-full text-left px-3 py-2 text-xs hover:bg-slate-50 text-slate-700 hover:text-blue-700 flex items-start gap-2.5 transition-colors cursor-pointer"
                    >
                      <div className="p-1.5 rounded-lg bg-blue-100/60 text-blue-600 shrink-0 mt-0.5">
                        <MdPrint className="w-4 h-4" />
                      </div>
                      <div className="min-w-0">
                        <span className="font-bold block text-slate-800">
                          Imprimir estudiante
                        </span>
                        <span className="text-[11px] text-slate-500 block truncate">
                          Ficha de {modalStudent.nombresApellidos || modalStudent.nombres}
                        </span>
                      </div>
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        setIsModalPrintDropdownOpen(false);
                        handlePrintAllPDF();
                      }}
                      disabled={Boolean(exportingDni) || isExportingAll || Boolean(printingDni) || isPrintingAll}
                      className="w-full text-left px-3 py-2 text-xs hover:bg-slate-50 text-slate-700 hover:text-emerald-700 flex items-start gap-2.5 transition-colors cursor-pointer border-t border-slate-100"
                    >
                      <div className="p-1.5 rounded-lg bg-emerald-100/60 text-emerald-600 shrink-0 mt-0.5">
                        <MdPrint className="w-4 h-4" />
                      </div>
                      <div className="min-w-0">
                        <span className="font-bold block text-slate-800">
                          Imprimir todas
                        </span>
                        <span className="text-[11px] text-slate-500 block">
                          Consolidado ({studentsToExport.length} {studentsToExport.length === 1 ? 'estudiante' : 'estudiantes'})
                        </span>
                      </div>
                    </button>
                  </div>
                )}
              </div>

              {/* Dropdown de descarga en PDF dentro del Modal */}
              <div className="relative inline-block" ref={modalDropdownRef}>
                <button
                  type="button"
                  onClick={() => setIsModalDropdownOpen((prev) => !prev)}
                  disabled={Boolean(exportingDni) || isExportingAll}
                  className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-bold rounded-xl bg-blue-600 hover:bg-blue-700 active:bg-blue-800 disabled:bg-blue-400 text-white shadow-2xs transition-colors cursor-pointer disabled:cursor-not-allowed"
                  title="Opciones de descarga en PDF"
                  aria-haspopup="true"
                  aria-expanded={isModalDropdownOpen}
                >
                  <MdFileDownload
                    className={`w-4 h-4 ${(exportingDni || isExportingAll) ? 'animate-bounce' : ''}`}
                  />
                  <span className="hidden sm:inline">
                    {isExportingAll
                      ? `Generando todas (${studentsToExport.length})...`
                      : exportingDni === modalStudent.dni
                      ? 'Generando...'
                      : 'Descargar PDF'}
                  </span>
                  <MdKeyboardArrowDown
                    className={`w-3.5 h-3.5 transition-transform duration-200 ${
                      isModalDropdownOpen ? 'rotate-180' : ''
                    }`}
                  />
                </button>

                {isModalDropdownOpen && (
                  <div className="absolute right-0 mt-1.5 w-64 bg-white rounded-xl shadow-xl border border-slate-200/90 py-1.5 z-50 animate-fadeIn text-left">
                    <div className="px-3 py-1.5 border-b border-slate-100">
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                        Opciones de descarga
                      </span>
                    </div>

                    <button
                      type="button"
                      onClick={() => {
                        setIsModalDropdownOpen(false);
                        handleExportPDF(modalStudent);
                      }}
                      disabled={Boolean(exportingDni) || isExportingAll}
                      className="w-full text-left px-3 py-2 text-xs hover:bg-blue-50/70 text-slate-700 hover:text-blue-700 flex items-start gap-2.5 transition-colors cursor-pointer"
                    >
                      <div className="p-1.5 rounded-lg bg-blue-100/60 text-blue-600 shrink-0 mt-0.5">
                        <MdPerson className="w-4 h-4" />
                      </div>
                      <div className="min-w-0">
                        <span className="font-bold block text-slate-800">
                          Descargar estudiante
                        </span>
                        <span className="text-[11px] text-slate-500 block truncate">
                          Ficha de {modalStudent.nombresApellidos || modalStudent.nombres}
                        </span>
                      </div>
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        setIsModalDropdownOpen(false);
                        handleExportAllPDF();
                      }}
                      disabled={Boolean(exportingDni) || isExportingAll}
                      className="w-full text-left px-3 py-2 text-xs hover:bg-emerald-50/70 text-slate-700 hover:text-emerald-700 flex items-start gap-2.5 transition-colors cursor-pointer border-t border-slate-100"
                    >
                      <div className="p-1.5 rounded-lg bg-emerald-100/60 text-emerald-600 shrink-0 mt-0.5">
                        <MdPeople className="w-4 h-4" />
                      </div>
                      <div className="min-w-0">
                        <span className="font-bold block text-slate-800">
                          Descargar todas
                        </span>
                        <span className="text-[11px] text-slate-500 block">
                          Consolidado en un solo PDF ({studentsToExport.length} {studentsToExport.length === 1 ? 'estudiante' : 'estudiantes'})
                        </span>
                      </div>
                    </button>
                  </div>
                )}
              </div>

              <button
                type="button"
                onClick={handleCloseModal}
                className="inline-flex items-center gap-1.5 px-2.5 py-2 rounded-xl text-xs font-bold text-slate-700 hover:text-rose-600 bg-slate-100 hover:bg-rose-50 border border-slate-200 hover:border-rose-200 transition-colors cursor-pointer"
                title="Cerrar pantalla completa (Esc)"
                aria-label="Cerrar (ESC)"
              >
                <MdClose className="w-4 h-4" />
                <kbd className="inline-block px-1.5 py-0.5 text-[10px] font-mono bg-white rounded border border-slate-300 text-slate-500">
                  ESC
                </kbd>
              </button>
            </div>
          </header>

          {/* 2. Sub-barra de Diagnóstico, Capas Globales y Switcher de Gráfico */}
          <div className="w-full bg-white/95 backdrop-blur-xs border-b border-slate-200/80 px-4 sm:px-6 md:px-8 py-2.5 flex flex-col lg:flex-row lg:items-center justify-between gap-3 shrink-0 z-10">
            {/* KPI Chips */}
            <div className="flex items-center gap-2.5 flex-wrap">
              {modalStudent.estadoTrayectoria === 'superacion' && (
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl text-xs font-bold bg-emerald-50 border border-emerald-200 text-emerald-800 shadow-2xs">
                  <MdTrendingUp className="w-4 h-4 text-emerald-600" />
                  <span>Superación ({modalStudent.deltaPuntaje > 0 ? `+${modalStudent.deltaPuntaje}` : modalStudent.deltaPuntaje} pts)</span>
                </span>
              )}
              {modalStudent.estadoTrayectoria === 'alerta' && (
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl text-xs font-bold bg-rose-50 border border-rose-200 text-rose-800 shadow-2xs">
                  <MdTrendingDown className="w-4 h-4 text-rose-600" />
                  <span>En Alerta ({modalStudent.deltaPuntaje} pts)</span>
                </span>
              )}
              {modalStudent.estadoTrayectoria === 'estable' && (
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl text-xs font-bold bg-amber-50 border border-amber-200 text-amber-800 shadow-2xs">
                  <MdTrendingFlat className="w-4 h-4 text-amber-600" />
                  <span>Estable ({modalStudent.deltaPuntaje > 0 ? `+${modalStudent.deltaPuntaje}` : modalStudent.deltaPuntaje} pts)</span>
                </span>
              )}

              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl text-xs font-semibold bg-slate-50 border border-slate-200 text-slate-700 shadow-2xs">
                <span className="text-slate-500">Vs. Promedio Aula:</span>
                <strong className={modalStudent.diferenciaConAula >= 0 ? 'text-blue-600 font-bold' : 'text-slate-700 font-bold'}>
                  {modalStudent.diferenciaConAula > 0 ? `+${modalStudent.diferenciaConAula}` : modalStudent.diferenciaConAula} pts
                </strong>
              </span>
            </div>

            {/* Controles: Capas de Evaluación Globales (Sin texto, botones simplificados) + Conmutador de Gráfico Único (Solo iconos) */}
            <div className="flex items-center gap-2.5 flex-wrap self-end lg:self-auto">
              {/* Capas de Evaluación Globales (Simplificadas con chips compactos EDI, EP1, EP2) */}
              <div className="flex items-center gap-1 bg-slate-50 p-1 rounded-xl border border-slate-200/90 shadow-2xs">
                <span className="p-1 text-slate-400 flex items-center justify-center shrink-0" title="Capas de evaluación">
                  <MdLayers className="w-3.5 h-3.5" />
                </span>
                <div className="flex items-center gap-1">
                  {etapasConfiguradas.map((etapa) => {
                    const isChecked = activeStages[etapa.key] ?? true;
                    const color =
                      etapa.key === 'edi'
                        ? '#2563eb'
                        : etapa.key === 'ep1'
                        ? '#f59e0b'
                        : '#10b981';

                    const tieneDatos = !!modalStudent.etapas[etapa.key];

                    return (
                      <button
                        key={etapa.key}
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
                        title={
                          tieneDatos
                            ? `Alternar visualización de ${etapa.label}`
                            : `Sin registro para ${etapa.label}`
                        }
                      >
                        <span
                          className="w-2 h-2 rounded-full shrink-0 transition-colors"
                          style={{
                            backgroundColor: isChecked ? color : '#cbd5e1',
                          }}
                        />
                        <span style={{ color: isChecked ? color : undefined }}>
                          {etapa.key.toUpperCase()}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Controles del Radar junto a los switches de evaluación (iconos por defecto, texto en hover) */}
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
                  canResetPositions={
                    radarLayoutMode === 'flotante' &&
                    (radarSplitInTwo
                      ? Object.keys(loadStoredCardAdjustments(catalogoActuaciones.length, true)).length > 0 ||
                        Object.keys(liveCardAdjustments).length > 0
                      : Object.keys(loadStoredCardAdjustments(catalogoActuaciones.length, false)).length > 0 ||
                        Object.keys(liveCardAdjustments).length > 0)
                  }
                  onResetPositions={() => {
                    clearStoredCardAdjustments(catalogoActuaciones.length, undefined, radarSplitInTwo);
                    setLiveCardAdjustments({});
                  }}
                  textScale={radarTextScale}
                  onTextScaleChange={(scale) => {
                    setRadarTextScale(scale);
                    saveStoredTextScale(scale);
                  }}
                />
              )}

              {/* Conmutador de Representación Gráfica (Solo iconos, sin texto) */}
              <div
                className="inline-flex items-center p-1 bg-slate-100 rounded-xl border border-slate-200/90 shadow-2xs"
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
                  aria-label="Trayectoria (Línea)"
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
                  aria-label="Actuaciones (Radar)"
                >
                  <TbChartRadar className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>

          {/* 3. Modal Scrollable Body a toda la pantalla (Un solo gráfico a la vez) */}
          <main className="flex-1 w-full overflow-y-auto px-4 sm:px-6 md:px-8 py-6 space-y-6 bg-slate-100/70">
            {modalVisualMode === 'line' ? (
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

                {/* Tarjetas de Detalle por Etapa Evaluativa (Filtradas según capas activas globales) */}
                <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-2xs">
                  <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider mb-3">
                    Detalle por Etapa Evaluativa
                  </h4>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    {etapasConfiguradas
                      .filter((etapa) => activeStages[etapa.key] ?? true)
                      .map((etapa) => {
                        const item = modalStudent.etapas[etapa.key];
                        const color =
                          etapa.key === 'edi'
                            ? '#2563eb'
                            : etapa.key === 'ep1'
                            ? '#f59e0b'
                            : '#10b981';

                        if (!item) {
                          return (
                            <div
                              key={etapa.key}
                              className="p-4 rounded-xl border border-dashed border-slate-200 bg-slate-50/50 flex flex-col items-center justify-center text-center min-h-[100px]"
                            >
                              <span className="text-xs font-bold text-slate-400">{etapa.label}</span>
                              <span className="text-xs text-slate-400 mt-1">Sin evaluación registrada</span>
                            </div>
                          );
                        }

                        return (
                          <div
                            key={etapa.key}
                            className="p-4 rounded-xl border border-slate-200/80 bg-white shadow-2xs"
                          >
                            <div className="flex items-center justify-between mb-2">
                              <span className="text-xs font-bold text-slate-700 truncate flex items-center gap-1.5">
                                <span
                                  className="w-2.5 h-2.5 rounded-full inline-block shrink-0"
                                  style={{ backgroundColor: color }}
                                />
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
              /* SOLO GRÁFICO RETICULAR (RADAR) A TODO EL ANCHO */
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
                  onAdjustmentsChange={setLiveCardAdjustments}
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
          </main>
        </div>,
        document.body
      )}

      {/* ========================================================================= */}
      {/* 5. SPOTLIGHT / COMMAND PALETTE BUSCADOR CENTRADO Y AMPLIO (CTRL + K)       */}
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
                title="Clic en la lupa para mostrar toda la lista de estudiantes"
                aria-label="Mostrar toda la lista de estudiantes"
              >
                <MdSearch className="w-5 h-5 text-slate-400 group-hover:text-blue-600 transition-colors" />
              </button>

              <input
                type="text"
                autoFocus
                value={spotlightQuery}
                onChange={(e) => setSpotlightQuery(e.target.value)}
                placeholder="Buscar por nombre, apellidos o DNI (ej. Franco Condori 47163626)..."
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

            {/* Barra Informativa de Resultados */}
            <div className="px-4 py-2 bg-slate-50/70 border-b border-slate-100 flex items-center justify-between text-xs text-slate-500">
              <span className="font-medium">
                {spotlightQuery.trim()
                  ? `Resultados encontrados: ${spotlightResults.length} de ${estudiantesEvolutivos.length}`
                  : `Todos los estudiantes (${estudiantesEvolutivos.length})`}
              </span>
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
                <span className="hidden sm:inline text-slate-400">Atajo: <kbd className="px-1 py-0.5 font-mono text-[10px] bg-white border border-slate-200 rounded">Ctrl</kbd> + <kbd className="px-1 py-0.5 font-mono text-[10px] bg-white border border-slate-200 rounded">K</kbd></span>
              </div>
            </div>

            {/* Lista Cómoda y Amplia de Estudiantes */}
            <div className="flex-1 overflow-y-auto p-3 sm:p-4 space-y-2 max-h-[500px]">
              {spotlightResults.length === 0 ? (
                <div className="py-12 text-center text-slate-400">
                  <MdInfoOutline className="w-10 h-10 mx-auto mb-2 text-slate-300" />
                  <h4 className="text-sm font-bold text-slate-700">No se encontraron estudiantes</h4>
                  <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
                    No hay coincidencias para &quot;{spotlightQuery}&quot;. Intenta buscar combinando nombre, apellido o DNI.
                  </p>
                  <button
                    type="button"
                    onClick={() => setSpotlightQuery('')}
                    className="mt-3 px-3.5 py-1.5 text-xs font-semibold bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 rounded-xl shadow-2xs cursor-pointer"
                  >
                    Mostrar toda la lista de estudiantes
                  </button>
                </div>
              ) : (
                spotlightResults.map((est, idx) => {
                  const isSelected = modalStudent?.dni === est.dni;

                  return (
                    <div
                      key={est.dni}
                      onClick={() => {
                        setModalStudent(est);
                        setSelectedStudentDni(est.dni);
                        setIsSpotlightOpen(false);
                      }}
                      className={`group px-3.5 py-2.5 sm:px-4 sm:py-3 rounded-xl border transition-all cursor-pointer flex items-center justify-between gap-3 ${
                        isSelected
                          ? 'bg-slate-50/90 border-slate-300 shadow-2xs ring-1 ring-slate-300/40'
                          : 'bg-white border-slate-200/70 hover:border-slate-300 hover:bg-slate-50/60 hover:shadow-2xs'
                      }`}
                      title="Haz clic para abrir ficha y gráficos"
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
                            <span>DNI: <strong className="text-slate-600 font-medium">{est.dni}</strong></span>
                            <span>•</span>
                            <span>Sec: <strong className="text-slate-600 font-medium">{converSeccion(Number(est.seccion)) || est.seccion || '—'}</strong></span>
                            <span>•</span>
                            <span className="text-slate-500 font-sans">
                              {est.puntajeFinal ?? est.puntajeInicial} pts ({est.nivelFinal || est.nivelInicial})
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

                        {/* Botón Ver Ficha con Colores Tenues y Elegantes */}
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
              <span>Haz clic en un estudiante para ver sus gráficos y ficha pedagógica completa</span>
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
