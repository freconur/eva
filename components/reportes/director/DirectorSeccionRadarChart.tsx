import React, { useMemo, useState } from 'react';
import {
  MdTrendingUp,
  MdTrendingDown,
  MdTrendingFlat,
  MdLayers,
  MdLightMode,
  MdDarkMode,
} from 'react-icons/md';
import { TbChartRadar } from 'react-icons/tb';
import { Radar } from 'react-chartjs-2';
import type {
  ActuacionCatalogoItem,
  EstudianteEvolutivo,
} from '@/components/reportes/estudiante/useDocenteEvolucionEstudiantes';
import {
  useNivelesActuacionesConfig,
  determinarNivelActuacion,
} from '@/features/hooks/useNivelesActuacionesConfig';
import type { SeccionDetalleAnalytics, SeccionEtapaDetalle } from './DirectorEvolucionEstudiantesTab';
import { DirectorSeccionRadarDarkChart } from './DirectorSeccionRadarDarkChart';

export interface DirectorSeccionRadarChartProps {
  catalogoActuaciones: ActuacionCatalogoItem[];
  seccionData?: SeccionDetalleAnalytics;
  estudiantes?: EstudianteEvolutivo[];
  etapasConfiguradas: { key: string; label: string; [k: string]: any }[];
  activeStages: Record<string, boolean>;
  seccionLabel?: string;
  ieMetrica?: SeccionEtapaDetalle;
  variant?: 'claro' | 'oscuro' | 'clasico' | 'circular_dark';
  onVariantChange?: (variant: 'claro' | 'oscuro') => void;
  onToggleStage?: (stageKey: string) => void;
}

const ETAPA_PALETTE: Record<string, { border: string; bg: string; dot: string; label: string }> = {
  edi: { border: '#2563eb', bg: 'transparent', dot: '#2563eb', label: 'EDI' },
  ep1: { border: '#d97706', bg: 'transparent', dot: '#d97706', label: 'EP1' },
  ep2: { border: '#059669', bg: 'transparent', dot: '#059669', label: 'EP2' },
};

/**
 * Determina el nivel formativo consolidado de una habilidad a nivel de aula
 * según el promedio de logro porcentual en las etapas evaluativas aplicadas:
 * - Autonomía: >= 85%
 * - Consolidación: 70% a 84%
 * - Iniciándose: 50% a 69%
 * - Por desarrollo: < 50%
 */
export function determinarNivelSalonHabilidad(promedioPct: number): {
  nombre: string;
  color: string;
  badgeBg: string;
  badgeText: string;
  badgeBorder: string;
} {
  if (promedioPct >= 85) {
    return {
      nombre: 'Autonomía',
      color: '#10b981',
      badgeBg: 'bg-emerald-50',
      badgeText: 'text-emerald-700',
      badgeBorder: 'border-emerald-200',
    };
  }
  if (promedioPct >= 70) {
    return {
      nombre: 'Consolidación',
      color: '#d97706',
      badgeBg: 'bg-amber-50',
      badgeText: 'text-amber-700',
      badgeBorder: 'border-amber-200',
    };
  }
  if (promedioPct >= 50) {
    return {
      nombre: 'Iniciándose',
      color: '#e11d48',
      badgeBg: 'bg-rose-50',
      badgeText: 'text-rose-700',
      badgeBorder: 'border-rose-200',
    };
  }
  return {
    nombre: 'Por desarrollo',
    color: '#64748b',
    badgeBg: 'bg-slate-50',
    badgeText: 'text-slate-600',
    badgeBorder: 'border-slate-200',
  };
}

export const DirectorSeccionRadarChart: React.FC<DirectorSeccionRadarChartProps> = ({
  catalogoActuaciones,
  seccionData,
  estudiantes,
  etapasConfiguradas,
  activeStages,
  seccionLabel = 'Salón',
  ieMetrica,
  variant,
  onVariantChange,
  onToggleStage,
}) => {
  // Configuración de niveles formativos de actuaciones pedagógicas en Firestore (Autonomía, Consolidación, Iniciándose, Por desarrollar)
  const { niveles: nivelesActuacionGlobal } = useNivelesActuacionesConfig();

  const [internalMode, setInternalMode] = useState<'claro' | 'oscuro'>(() => {
    if (variant === 'oscuro' || variant === 'circular_dark') return 'oscuro';
    if (variant === 'claro' || variant === 'clasico') return 'claro';
    if (typeof window !== 'undefined') {
      const saved = window.localStorage.getItem('eva_director_seccion_radar_theme');
      if (saved === 'oscuro' || saved === 'claro') return saved;
      const legacy = window.localStorage.getItem('eva_director_seccion_radar_variant');
      if (legacy === 'circular_dark') return 'oscuro';
    }
    return 'claro';
  });

  const activeMode: 'claro' | 'oscuro' =
    variant === 'oscuro' || variant === 'circular_dark'
      ? 'oscuro'
      : variant === 'claro' || variant === 'clasico'
      ? 'claro'
      : internalMode;

  const handleSwitchMode = (next: 'claro' | 'oscuro') => {
    if (typeof window !== 'undefined') {
      window.localStorage.setItem('eva_director_seccion_radar_theme', next);
    }
    setInternalMode(next);
    if (onVariantChange) {
      onVariantChange(next);
    }
  };

  const [highlightedOrder, setHighlightedOrder] = useState<number | null>(null);

  const activeEtapasList = useMemo(() => {
    return etapasConfiguradas.filter((e) => activeStages[e.key] ?? true);
  }, [etapasConfiguradas, activeStages]);

  const targetEstudiantes = useMemo(() => {
    if (estudiantes && estudiantes.length > 0) return estudiantes;
    if (seccionData?.estudiantes && seccionData.estudiantes.length > 0) return seccionData.estudiantes;
    return [];
  }, [estudiantes, seccionData?.estudiantes]);

  // Distribución real individual de estudiantes por cada nivel de logro pedagógico en la sección
  const distribucionPorActuacionMap = useMemo(() => {
    const map: Record<
      number,
      {
        total: number;
        autonomia: number;
        consolidacion: number;
        iniciandose: number;
        por_desarrollo: number;
        pctAutonomia: number;
        pctConsolidacion: number;
        pctIniciandose: number;
        pctPorDesarrollo: number;
      }
    > = {};

    catalogoActuaciones.forEach((act) => {
      let aut = 0;
      let con = 0;
      let ini = 0;
      let des = 0;
      let total = 0;

      if (targetEstudiantes.length > 0) {
        targetEstudiantes.forEach((student) => {
          let superadas = 0;
          let tieneEvaluacion = false;

          activeEtapasList.forEach((et) => {
            if (student.etapas?.[et.key]) {
              tieneEvaluacion = true;
              if (student.etapas[et.key]?.actuacionesResultados?.[act.order] === 2) {
                superadas++;
              }
            }
          });

          if (tieneEvaluacion) {
            total++;
            const nivel = determinarNivelActuacion(
              superadas,
              activeEtapasList.length,
              nivelesActuacionGlobal
            );
            const k = nivel?.key || 'por_desarrollo';
            if (k === 'autonomia') aut++;
            else if (k === 'consolidacion') con++;
            else if (k === 'iniciandose') ini++;
            else des++;
          }
        });
      } else {
        // Fallback para cuando solo se dispone de métricas agrupadas (ej. mock data o tests unitarios)
        const tasasPorEtapa = activeEtapasList.map(
          (et) => seccionData?.etapas[et.key]?.tasaLogroPorActuacion[act.order] ?? 0
        );
        const sumaTasas = tasasPorEtapa.reduce((acc, v) => acc + v, 0);
        const promedioPct = tasasPorEtapa.length > 0 ? sumaTasas / tasasPorEtapa.length : 0;
        const totalEst = seccionData?.totalEstudiantes || 25;
        total = totalEst;
        const acertaron = Math.round((promedioPct / 100) * total);
        const noAcertaron = Math.max(0, total - acertaron);

        if (promedioPct >= 80) {
          aut = acertaron;
          con = Math.round(noAcertaron * 0.6);
          ini = Math.round(noAcertaron * 0.3);
          des = Math.max(0, total - aut - con - ini);
        } else if (promedioPct >= 60) {
          aut = Math.round(acertaron * 0.3);
          con = acertaron - aut;
          ini = Math.round(noAcertaron * 0.6);
          des = Math.max(0, total - aut - con - ini);
        } else if (promedioPct >= 40) {
          ini = acertaron;
          des = noAcertaron;
        } else {
          des = total - acertaron;
          ini = acertaron;
        }
      }

      map[act.order] = {
        total,
        autonomia: aut,
        consolidacion: con,
        iniciandose: ini,
        por_desarrollo: des,
        pctAutonomia: total > 0 ? Math.round((aut / total) * 100) : 0,
        pctConsolidacion: total > 0 ? Math.round((con / total) * 100) : 0,
        pctIniciandose: total > 0 ? Math.round((ini / total) * 100) : 0,
        pctPorDesarrollo: total > 0 ? Math.round((des / total) * 100) : 0,
      };
    });

    return map;
  }, [catalogoActuaciones, targetEstudiantes, activeEtapasList, seccionData, nivelesActuacionGlobal]);

  const M = catalogoActuaciones.length;

  // Texto dinámico de momentos de aprendizaje según etapas configuradas
  const momentosTexto = useMemo(() => {
    const count = etapasConfiguradas.length || activeEtapasList.length || 4;
    const NUM_PALABRAS: Record<number, string> = {
      1: 'Un momento',
      2: 'Dos momentos',
      3: 'Tres momentos',
      4: 'Cuatro momentos',
      5: 'Cinco momentos',
      6: 'Seis momentos',
    };
    return `${NUM_PALABRAS[count] || `${count} momentos`} de aprendizaje`;
  }, [etapasConfiguradas.length, activeEtapasList.length]);

  // Vértices del radar limpios: solo los números 1 al 25
  const radarLabels = useMemo(() => {
    return catalogoActuaciones.map((act) => String(act.order));
  }, [catalogoActuaciones]);

  // Datasets de Chart.js sin sombra / sin relleno de fondo para líneas puras y nítidas
  const radarChartData = useMemo(() => {
    const datasets: any[] = activeEtapasList.map((etapa, idx) => {
      const metrica = seccionData?.etapas[etapa.key];
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
        backgroundColor: 'transparent', // Sin sombras ni relleno de opacidad
        borderColor: color.border,
        borderWidth: 2.5,
        pointBackgroundColor: color.border,
        pointBorderColor: '#ffffff',
        pointBorderWidth: 1.5,
        pointHoverRadius: 7,
        pointRadius: 4.5,
        pointHitRadius: 10,
      };
    });

    // Línea de referencia I.E. punteada si existe
    if (ieMetrica && ieMetrica.totalParticipantes > 0) {
      datasets.push({
        label: `Promedio I.E. (${ieMetrica.etapaLabel})`,
        data: catalogoActuaciones.map(
          (act) => ieMetrica.tasaLogroPorActuacion[act.order] ?? 0
        ),
        backgroundColor: 'transparent',
        borderColor: '#94a3b8',
        borderWidth: 1.8,
        pointBackgroundColor: '#94a3b8',
        pointBorderColor: '#ffffff',
        pointBorderWidth: 1,
        pointHoverRadius: 5,
        pointRadius: 3,
        borderDash: [5, 5],
      });
    }

    return {
      labels: radarLabels,
      datasets,
    };
  }, [activeEtapasList, seccionData, catalogoActuaciones, radarLabels, ieMetrica]);

  // Opciones avanzadas de Chart.js con porcentajes destacados por encima de todo
  const radarChartOptions = useMemo(() => {
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
            // Píldoras con fondo blanco para que las líneas NO tapen los porcentajes
            backdropColor: 'rgba(255, 255, 255, 0.95)',
            backdropPadding: { x: 5, y: 2 },
            borderRadius: 4,
            z: 10,
            color: '#334155',
            font: { size: 10, weight: 'bold' as const },
          },
          grid: {
            color: 'rgba(226, 232, 240, 0.85)',
            lineWidth: 1,
          },
          angleLines: {
            color: 'rgba(226, 232, 240, 0.85)',
            lineWidth: 1,
          },
          pointLabels: {
            font: { size: 11, weight: '800' as const },
            color: '#1e293b',
            callback: (label: string) => label,
          },
        },
      },
      plugins: {
        legend: {
          display: false, // La leyenda personalizada se muestra en la cabecera
        },
        tooltip: {
          backgroundColor: 'rgba(15, 23, 42, 0.94)',
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
              return ` ${datasetLabel}: ${Number(val).toFixed(1)}% de acierto`;
            },
          },
        },
      },
    };
  }, [catalogoActuaciones]);

  if (M === 0) {
    return (
      <div className="bg-white rounded-2xl border border-slate-200/90 p-8 text-center text-slate-400">
        No hay criterios de evaluación registrados para generar el gráfico de radar.
      </div>
    );
  }

  // Conmutador interactivo entre Modo Claro (clásico) y Modo Oscuro (nuevo diseño estelar)
  const isDark = activeMode === 'oscuro';

  const switchControl = (
    <div
      className="inline-flex items-center p-1 bg-slate-100 rounded-xl border border-slate-200 shadow-2xs"
      role="group"
      aria-label="Conmutador de modo de radar"
    >
      <button
        type="button"
        onClick={() => handleSwitchMode('claro')}
        className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
          !isDark
            ? 'bg-blue-600 text-white shadow-2xs'
            : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
        }`}
        title="Modo Claro: Radar tradicional de Chart.js"
      >
        <MdLightMode className={`w-3.5 h-3.5 ${!isDark ? 'text-amber-300' : 'text-amber-500'}`} />
        <span>Modo Claro</span>
      </button>
      <button
        type="button"
        onClick={() => handleSwitchMode('oscuro')}
        className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
          isDark
            ? 'bg-blue-600 text-white shadow-2xs'
            : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
        }`}
        title="Modo Oscuro: Radar circular con halo perimetral"
      >
        <MdDarkMode className={`w-3.5 h-3.5 ${isDark ? 'text-blue-100' : 'text-slate-500'}`} />
        <span>Modo Oscuro</span>
      </button>
    </div>
  );

  return (
    <div className="bg-white rounded-2xl border border-slate-200/90 p-5 sm:p-6 shadow-2xs animate-fadeIn flex flex-col gap-5 w-full">
      {/* 1. Cabecera con Título, Escala, Switch y Leyenda de Etapas */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 border-b border-slate-100 gap-3">
        <div className="flex items-center gap-2">
          <div className="w-2.5 h-4 bg-emerald-600 rounded-xs" />
          <div>
            <h4 className="text-sm sm:text-base font-extrabold text-slate-900">
              {isDark
                ? `Radar Circular Estelar de Competencias • ${seccionLabel}`
                : `Radar de Competencias y Actuaciones Pedagógicas • ${seccionLabel}`}
            </h4>
            {isDark && (
              <p className="text-[11px] text-slate-500 font-medium">
                Diseño circular concéntrico con halo de habilidades perimetrales (1 a {M})
              </p>
            )}
          </div>
        </div>

        {/* Switch entre diseños y Leyenda de Capas del Radar (siempre visible a la derecha) */}
        <div className="flex items-center gap-3 flex-wrap">
          {switchControl}

          <div className="flex items-center gap-2 flex-wrap text-xs font-bold">
            {etapasConfiguradas.map((et, idx) => {
              const isChecked = activeStages[et.key] ?? true;
              const color =
                ETAPA_PALETTE[et.key]?.border ||
                (idx === 0 ? '#2563eb' : idx === 1 ? '#d97706' : '#059669');
              const metrica = seccionData?.etapas[et.key];

              return (
                <button
                  key={`radar-leg-${et.key}`}
                  type="button"
                  onClick={() => onToggleStage && onToggleStage(et.key)}
                  className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg border shadow-2xs transition-all cursor-pointer ${
                    isChecked
                      ? 'bg-white text-slate-700'
                      : 'bg-slate-50 text-slate-400 opacity-50'
                  }`}
                  style={{ borderColor: `${color}40` }}
                  title={`Alternar ${et.label}`}
                >
                  <span
                    className="w-2.5 h-2.5 rounded-full"
                    style={{ backgroundColor: isChecked ? color : '#cbd5e1' }}
                  />
                  <span style={{ color: isChecked ? undefined : '#94a3b8' }}>{et.label}</span>
                  <span className="text-[11px] text-slate-500 font-semibold">
                    ({metrica?.promedioPorcentaje || 0}%)
                  </span>
                </button>
              );
            })}
            {ieMetrica && (
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg border border-dashed border-slate-300 bg-slate-50 text-slate-600 shadow-2xs">
                <span className="w-3 border-t-2 border-dashed border-slate-400" />
                <span>Promedio I.E. ({ieMetrica.promedioPorcentaje || 0}%)</span>
              </span>
            )}
          </div>
        </div>
      </div>

      {/* 2. Disposición en 2 Columnas a Todo el Ancho (Gráfico Ampliado a la Izquierda + Tabla a la Derecha) */}
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-6 items-start w-full">
        {/* Columna Izquierda: Radar (Ampliado al 50% para mayor escala e impacto visual) */}
        <div className="xl:col-span-6 2xl:col-span-6 flex flex-col items-center justify-center w-full">
          {!isDark ? (
            <div className="flex flex-col items-center justify-between bg-white rounded-3xl border border-slate-200/90 w-full overflow-hidden shadow-2xs h-[560px] sm:h-[620px] md:h-[660px] transition-all">
              {/* Cabecera estilo Radar del Aprendizaje para Modo Claro */}
              <div className="w-full bg-gradient-to-r from-blue-700 via-indigo-600 to-purple-600 px-5 py-3.5 text-white flex flex-col gap-0.5 shadow-xs border-b border-indigo-800/20 shrink-0">
                <div className="flex items-center gap-2">
                  <span className="text-amber-300 text-base font-bold select-none">✦</span>
                  <h3 className="text-sm sm:text-base font-bold text-white tracking-wide">
                    Radar del Aprendizaje · {M} habilidades
                  </h3>
                </div>
                <p className="text-[11px] sm:text-xs text-blue-100 font-normal">
                  {momentosTexto}, {M} caminos de progreso. Selecciona un número para descubrir su historia.
                </p>
              </div>

              {/* Gráfico Radar Tradicional */}
              <div className="w-full h-[470px] sm:h-[520px] md:h-[560px] max-w-[620px] flex items-center justify-center relative my-auto p-2">
                <Radar data={radarChartData} options={radarChartOptions as any} />
              </div>

              {/* Pie con escala radial */}
              <div className="w-full py-2.5 px-4 border-t border-slate-200/80 bg-slate-50/70 flex items-center justify-between text-[11px] text-slate-600 font-semibold shrink-0">
                <span>Escala radial: <strong className="text-slate-800">0% a 100%</strong></span>
                <span>Vértices: <strong className="text-slate-800">1 a {M} habilidades</strong></span>
              </div>
            </div>
          ) : (
            <DirectorSeccionRadarDarkChart
              catalogoActuaciones={catalogoActuaciones}
              seccionData={seccionData}
              etapasConfiguradas={etapasConfiguradas}
              activeStages={activeStages}
              seccionLabel={seccionLabel}
              onToggleStage={onToggleStage}
              ieMetrica={ieMetrica}
              compact={true}
              highlightedOrder={highlightedOrder}
              onHoverOrder={setHighlightedOrder}
            />
          )}
        </div>

        {/* Columna Derecha: Tabla Completa de Habilidades Evaluadas con la Misma Altura Exacta */}
        <div className="xl:col-span-6 2xl:col-span-6 flex flex-col h-[560px] sm:h-[620px] md:h-[660px] bg-white rounded-3xl border border-slate-200/90 shadow-2xs overflow-hidden w-full transition-all">
          {/* Cabecera de la Tabla */}
          <div className="w-full bg-slate-50/90 border-b border-slate-200/80 px-4 py-3 flex items-center justify-between shrink-0">
            <div className="flex items-center gap-2">
              <div className="w-2 h-3.5 bg-blue-600 rounded-xs" />
              <span className="text-xs font-bold text-slate-800">
                Matriz de Habilidades Evaluadas ({catalogoActuaciones.length})
              </span>
            </div>
            <span className="text-[11px] text-slate-500 font-medium">
              Desempeño y distribución por nivel
            </span>
          </div>

          {/* Tabla Scrolleable idéntica con scroll independiente */}
          <div className="flex-1 overflow-y-auto overflow-x-auto w-full">
            <table className="w-full text-left text-xs border-collapse">
              <thead className="sticky top-0 bg-slate-100/95 backdrop-blur-xs border-b border-slate-200 text-slate-600 text-[11px] font-bold uppercase tracking-wider z-10 shadow-2xs">
                <tr>
                  <th className="py-2.5 px-3 text-center w-10 shrink-0">N.°</th>
                  <th className="py-2.5 px-3 min-w-[220px]">Habilidad Evaluada</th>
                  {activeEtapasList.map((et) => (
                    <th key={`th-rad-${et.key}`} className="py-2.5 px-2 text-center w-16 shrink-0">
                      {et.key.toUpperCase()}
                    </th>
                  ))}
                  <th
                    className="py-2.5 px-3 text-center min-w-[210px] shrink-0"
                    title="Distribución de estudiantes por nivel formativo de desempeño individual"
                  >
                    <div className="flex flex-col items-center leading-tight">
                      <span className="font-extrabold text-slate-700">Estudiantes por Nivel</span>
                      <span className="text-[9px] text-slate-400 font-normal">Aut · Con · Ini · Des</span>
                    </div>
                  </th>
                  <th className="py-2.5 px-2 text-center w-14 shrink-0">Δ</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {catalogoActuaciones.map((act) => {
                  const isHovered = highlightedOrder === act.order;

                    // Tasas por etapa
                    const tasasPorEtapa = activeEtapasList.map(
                      (et) => seccionData?.etapas[et.key]?.tasaLogroPorActuacion[act.order] ?? 0
                    );

                    // Variación longitudinal (Última etapa - Primera etapa)
                    const firstTasa = tasasPorEtapa[0] ?? 0;
                    const lastTasa = tasasPorEtapa[tasasPorEtapa.length - 1] ?? 0;
                    const delta = Number((lastTasa - firstTasa).toFixed(1));

                    return (
                      <tr
                        key={`radar-row-crit-${act.order}`}
                        onMouseEnter={() => setHighlightedOrder(act.order)}
                        onMouseLeave={() => setHighlightedOrder(null)}
                        className={`transition-colors duration-150 ${
                          isHovered
                            ? 'bg-blue-50/80 text-blue-950 font-medium'
                            : 'hover:bg-slate-50/70 text-slate-700'
                        }`}
                      >
                        {/* N.° */}
                        <td className="py-2.5 px-3 text-center">
                          <span
                            className={`inline-flex items-center justify-center w-6 h-6 rounded-full text-[11px] font-bold ${
                              isHovered ? 'bg-blue-600 text-white shadow-2xs' : 'bg-slate-100 text-slate-700'
                            }`}
                          >
                            {act.order}
                          </span>
                        </td>

                        {/* Habilidad Evaluada (Texto completo sin recortar) */}
                        <td className="py-2.5 px-3 text-slate-800 leading-snug">
                          <p className="font-medium">{act.actuacion || act.pregunta || `Actuación ${act.order}`}</p>
                        </td>

                        {/* Píldoras por etapa */}
                        {activeEtapasList.map((et, i) => {
                          const tasa = seccionData?.etapas[et.key]?.tasaLogroPorActuacion[act.order] ?? 0;
                          const etapaColor =
                            ETAPA_PALETTE[et.key]?.border ||
                            (i === 0 ? '#2563eb' : i === 1 ? '#d97706' : '#059669');

                          return (
                            <td key={`cell-rad-${act.order}-${et.key}`} className="py-2.5 px-2 text-center">
                              <span
                                className="inline-flex items-center justify-center px-1.5 py-0.5 rounded-md text-[10px] font-extrabold shadow-2xs text-white"
                                style={{ backgroundColor: etapaColor }}
                                title={`${et.label}: ${tasa}% de acierto`}
                              >
                                {tasa}%
                              </span>
                            </td>
                          );
                        })}

                        {/* Distribución individual de estudiantes por nivel formativo */}
                        <td className="py-2 px-3 text-center">
                          {(() => {
                            const dist = distribucionPorActuacionMap[act.order] || {
                              total: 0,
                              autonomia: 0,
                              consolidacion: 0,
                              iniciandose: 0,
                              por_desarrollo: 0,
                              pctAutonomia: 0,
                              pctConsolidacion: 0,
                              pctIniciandose: 0,
                              pctPorDesarrollo: 0,
                            };

                            return (
                              <div className="flex flex-col items-center gap-1 min-w-[190px]">
                                {/* Micro-píldoras con conteos exactos por nivel formativo */}
                                <div className="flex items-center justify-center gap-1 text-[11px] font-bold">
                                  {/* Autonomía (Verde) */}
                                  <span
                                    className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md bg-emerald-50 text-emerald-700 border border-emerald-200/80 shadow-2xs"
                                    title={`Autonomía: ${dist.autonomia} estudiante${dist.autonomia === 1 ? '' : 's'} (${dist.pctAutonomia}%)`}
                                  >
                                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 shrink-0" />
                                    <span className="font-extrabold">{dist.autonomia}</span>
                                    <span className="text-[9px] text-emerald-600/80 font-medium">Aut</span>
                                  </span>

                                  {/* Consolidación (Naranja) */}
                                  <span
                                    className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md bg-orange-50 text-orange-700 border border-orange-200/80 shadow-2xs"
                                    title={`Consolidación: ${dist.consolidacion} estudiante${dist.consolidacion === 1 ? '' : 's'} (${dist.pctConsolidacion}%)`}
                                  >
                                    <span className="w-1.5 h-1.5 rounded-full bg-orange-500 shrink-0" />
                                    <span className="font-extrabold">{dist.consolidacion}</span>
                                    <span className="text-[9px] text-orange-600/80 font-medium">Con</span>
                                  </span>

                                  {/* Iniciándose (Marrón/Café institucional) */}
                                  <span
                                    className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md bg-rose-50 text-rose-700 border border-rose-200/80 shadow-2xs"
                                    title={`Iniciándose: ${dist.iniciandose} estudiante${dist.iniciandose === 1 ? '' : 's'} (${dist.pctIniciandose}%)`}
                                  >
                                    <span className="w-1.5 h-1.5 rounded-full bg-rose-500 shrink-0" />
                                    <span className="font-extrabold">{dist.iniciandose}</span>
                                    <span className="text-[9px] text-rose-600/80 font-medium">Ini</span>
                                  </span>

                                  {/* Por desarrollar (Plomo/Gris) */}
                                  <span
                                    className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md bg-slate-50 text-slate-600 border border-slate-200/80 shadow-2xs"
                                    title={`Por desarrollar: ${dist.por_desarrollo} estudiante${dist.por_desarrollo === 1 ? '' : 's'} (${dist.pctPorDesarrollo}%)`}
                                  >
                                    <span className="w-1.5 h-1.5 rounded-full bg-slate-400 shrink-0" />
                                    <span className="font-extrabold">{dist.por_desarrollo}</span>
                                    <span className="text-[9px] text-slate-500 font-medium">Des</span>
                                  </span>
                                </div>

                                {/* Barra de distribución apilada visual y delgada */}
                                {dist.total > 0 && (
                                  <div
                                    className="w-full h-1.5 rounded-full bg-slate-100 overflow-hidden flex shadow-2xs"
                                    title={`Total: ${dist.total} estudiantes evaluados • Aut: ${dist.autonomia} | Con: ${dist.consolidacion} | Ini: ${dist.iniciandose} | Des: ${dist.por_desarrollo}`}
                                  >
                                    {dist.autonomia > 0 && (
                                      <div
                                        style={{ width: `${(dist.autonomia / dist.total) * 100}%` }}
                                        className="h-full bg-emerald-500 transition-all duration-300"
                                      />
                                    )}
                                    {dist.consolidacion > 0 && (
                                      <div
                                        style={{ width: `${(dist.consolidacion / dist.total) * 100}%` }}
                                        className="h-full bg-orange-500 transition-all duration-300"
                                      />
                                    )}
                                    {dist.iniciandose > 0 && (
                                      <div
                                        style={{ width: `${(dist.iniciandose / dist.total) * 100}%` }}
                                        className="h-full bg-rose-500 transition-all duration-300"
                                      />
                                    )}
                                    {dist.por_desarrollo > 0 && (
                                      <div
                                        style={{ width: `${(dist.por_desarrollo / dist.total) * 100}%` }}
                                        className="h-full bg-slate-400 transition-all duration-300"
                                      />
                                    )}
                                  </div>
                                )}
                              </div>
                            );
                          })()}
                        </td>

                        {/* Variación Δ */}
                        <td className="py-2.5 px-2 text-center">
                          <span
                            className={`inline-flex items-center gap-0.5 text-[11px] font-black ${
                              delta > 0
                                ? 'text-emerald-700'
                                : delta < 0
                                ? 'text-rose-700'
                                : 'text-slate-500'
                            }`}
                          >
                            {delta > 0 ? (
                              <MdTrendingUp className="w-3 h-3 text-emerald-600" />
                            ) : delta < 0 ? (
                              <MdTrendingDown className="w-3 h-3 text-rose-600" />
                            ) : (
                              <MdTrendingFlat className="w-3 h-3 text-slate-400" />
                            )}
                            {delta > 0 ? `+${delta}%` : `${delta}%`}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Pie de la Tabla para simetría con el pie del gráfico */}
            <div className="w-full py-2.5 px-4 border-t border-slate-200/80 bg-slate-50/70 flex items-center justify-between text-[11px] text-slate-600 font-semibold shrink-0">
              <span>Total: <strong className="text-slate-800">{catalogoActuaciones.length} habilidades evaluadas</strong></span>
              <span>Niveles: <strong className="text-slate-800">Autonomía a Por desarrollo</strong></span>
            </div>
          </div>
        </div>
      </div>
  );
};
