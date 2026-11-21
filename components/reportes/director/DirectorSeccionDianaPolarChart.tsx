import React, { useState, useMemo } from 'react';
import {
  MdSearch,
  MdTrendingUp,
  MdTrendingDown,
  MdTrendingFlat,
  MdInfoOutline,
  MdClose,
  MdLayers,
  MdCheckCircle,
  MdWarning,
} from 'react-icons/md';
import type { ActuacionCatalogoItem } from '@/components/reportes/estudiante/useDocenteEvolucionEstudiantes';
import type { SeccionDetalleAnalytics } from './DirectorEvolucionEstudiantesTab';

export interface DirectorSeccionDianaPolarChartProps {
  catalogoActuaciones: ActuacionCatalogoItem[];
  seccionData?: SeccionDetalleAnalytics;
  etapasConfiguradas: { key: string; label: string; [k: string]: any }[];
  activeStages: Record<string, boolean>;
  seccionLabel?: string;
  orderDirection?: 'horario' | 'antihorario';
}

/**
 * Genera el path SVG para un sector anular (celda de diana polar / radial)
 */
export function describeAnnularSector(
  cx: number,
  cy: number,
  innerR: number,
  outerR: number,
  startDeg: number,
  endDeg: number
): string {
  const rad = Math.PI / 180;
  const actualEndDeg = endDeg - startDeg >= 360 ? startDeg + 359.999 : endDeg;
  const a1 = startDeg * rad;
  const a2 = actualEndDeg * rad;

  const x1 = cx + outerR * Math.cos(a1);
  const y1 = cy + outerR * Math.sin(a1);
  const x2 = cx + outerR * Math.cos(a2);
  const y2 = cy + outerR * Math.sin(a2);

  const x3 = cx + innerR * Math.cos(a2);
  const y3 = cy + innerR * Math.sin(a2);
  const x4 = cx + innerR * Math.cos(a1);
  const y4 = cy + innerR * Math.sin(a1);

  const largeArc = actualEndDeg - startDeg > 180 ? 1 : 0;

  return `M ${x1} ${y1} A ${outerR} ${outerR} 0 ${largeArc} 1 ${x2} ${y2} L ${x3} ${y3} A ${innerR} ${innerR} 0 ${largeArc} 0 ${x4} ${y4} Z`;
}

export const ETAPA_COLORS: Record<string, { border: string; bg: string; dot: string; label: string }> = {
  edi: { border: '#2563eb', bg: 'rgba(37, 99, 235, 0.15)', dot: '#2563eb', label: 'EDI' },
  ep1: { border: '#f59e0b', bg: 'rgba(245, 158, 11, 0.15)', dot: '#f59e0b', label: 'EP1' },
  ep2: { border: '#10b981', bg: 'rgba(16, 185, 129, 0.15)', dot: '#10b981', label: 'EP2' },
};

export const getEtapaColorConfig = (stageKey: string, idx: number = 0) => {
  const normalizedKey = (stageKey || '').toLowerCase();
  if (ETAPA_COLORS[normalizedKey]) {
    return ETAPA_COLORS[normalizedKey];
  }
  const fallbackPalette = [
    { border: '#2563eb', bg: 'rgba(37, 99, 235, 0.15)', dot: '#2563eb', label: stageKey || 'EDI' },
    { border: '#f59e0b', bg: 'rgba(245, 158, 11, 0.15)', dot: '#f59e0b', label: stageKey || 'EP1' },
    { border: '#10b981', bg: 'rgba(16, 185, 129, 0.15)', dot: '#10b981', label: stageKey || 'EP2' },
  ];
  return fallbackPalette[idx % fallbackPalette.length];
};

/**
 * Escala pedagógica estándar de EVA / MINEDU para tasas de logro porcentual en el aula:
 * - Destacado: >= 90% (Azul EVA)
 * - Logrado: 75% a 89% (Esmeralda)
 * - En Proceso: 50% a 74% (Ámbar)
 * - En Inicio / Alerta: < 50% (Rojo Coral)
 */
export function getTasaLogroLevel(tasa: number): {
  key: 'destacado' | 'logrado' | 'proceso' | 'inicio';
  nombre: string;
  color: string;
  badgeBg: string;
  badgeText: string;
  badgeBorder: string;
} {
  if (tasa >= 90) {
    return {
      key: 'destacado',
      nombre: 'Destacado',
      color: '#2563eb',
      badgeBg: 'bg-blue-50',
      badgeText: 'text-blue-700',
      badgeBorder: 'border-blue-200',
    };
  }
  if (tasa >= 75) {
    return {
      key: 'logrado',
      nombre: 'Logrado',
      color: '#10b981',
      badgeBg: 'bg-emerald-50',
      badgeText: 'text-emerald-700',
      badgeBorder: 'border-emerald-200',
    };
  }
  if (tasa >= 50) {
    return {
      key: 'proceso',
      nombre: 'En Proceso',
      color: '#f59e0b',
      badgeBg: 'bg-amber-50',
      badgeText: 'text-amber-700',
      badgeBorder: 'border-amber-200',
    };
  }
  return {
    key: 'inicio',
    nombre: 'En Inicio',
    color: '#f43f5e',
    badgeBg: 'bg-rose-50',
    badgeText: 'text-rose-700',
    badgeBorder: 'border-rose-200',
  };
}

export const DirectorSeccionDianaPolarChart: React.FC<DirectorSeccionDianaPolarChartProps> = ({
  catalogoActuaciones,
  seccionData,
  etapasConfiguradas,
  activeStages,
  seccionLabel = 'Salón',
  orderDirection = 'horario',
}) => {
  const [selectedOrder, setSelectedOrder] = useState<number | null>(null);
  const [hoveredOrder, setHoveredOrder] = useState<number | null>(null);
  const [searchQuery, setSearchQuery] = useState<string>('');

  const activeEtapasList = useMemo(() => {
    return etapasConfiguradas.filter((e) => activeStages[e.key] ?? true);
  }, [etapasConfiguradas, activeStages]);

  const M = catalogoActuaciones.length;
  const K = activeEtapasList.length;

  const highlightedOrder = hoveredOrder ?? selectedOrder ?? null;
  const selectedAct = selectedOrder !== null ? catalogoActuaciones.find((a) => a.order === selectedOrder) || null : null;

  // Filtrado de actuaciones para la lista interactiva
  const filteredActuaciones = useMemo(() => {
    if (!searchQuery.trim()) return catalogoActuaciones;
    const q = searchQuery.toLowerCase().trim();
    return catalogoActuaciones.filter((act) => {
      const txt = (act.actuacion || act.pregunta || '').toLowerCase();
      const num = String(act.order);
      return txt.includes(q) || num === q;
    });
  }, [catalogoActuaciones, searchQuery]);

  // Geometría SVG polar de la Diana
  const cx = 290;
  const cy = 290;
  const rHub = 64;
  const rMax = 224;
  const rBadges = 254;
  const ringThickness = K > 0 ? (rMax - rHub) / K : rMax - rHub;
  const sliceAngle = M > 0 ? 360 / M : 360;
  const isAntihorario = orderDirection === 'antihorario';

  const actsGeometry = useMemo(() => {
    return catalogoActuaciones.map((act, i) => {
      const startDeg = isAntihorario ? -90 - (i + 1) * sliceAngle : -90 + i * sliceAngle;
      const endDeg = isAntihorario ? -90 - i * sliceAngle : -90 + (i + 1) * sliceAngle;
      const midDeg = isAntihorario ? -90 - (i + 0.5) * sliceAngle : -90 + (i + 0.5) * sliceAngle;
      const rad = (midDeg * Math.PI) / 180;
      const bx = cx + rBadges * Math.cos(rad);
      const by = cy + rBadges * Math.sin(rad);
      return { act, i, startDeg, endDeg, midDeg, bx, by };
    });
  }, [catalogoActuaciones, isAntihorario, sliceAngle, cx, cy, rBadges]);

  const activeGeom = actsGeometry.find((g) => g.act.order === highlightedOrder);

  // Resumen global consolidado por etapa
  const globalStageSummaries = useMemo(() => {
    return activeEtapasList.map((et, idx) => {
      const etapaData = seccionData?.etapas[et.key];
      const colorCfg = getEtapaColorConfig(et.key, idx);
      const promedioPct = etapaData?.promedioPorcentaje || 0;
      const promedioPts = etapaData?.promedioPuntaje || 0;
      const totalPart = etapaData?.totalParticipantes || 0;

      return {
        key: et.key,
        label: et.label,
        promedioPct,
        promedioPts,
        totalPart,
        color: colorCfg.border,
      };
    });
  }, [activeEtapasList, seccionData]);

  // Detalle de la actuación seleccionada a lo largo de las etapas
  const selectedActDetail = useMemo(() => {
    if (!selectedAct) return null;

    const steps = activeEtapasList.map((et, idx) => {
      const etapaData = seccionData?.etapas[et.key];
      const colorCfg = getEtapaColorConfig(et.key, idx);
      const tasa = etapaData?.tasaLogroPorActuacion[selectedAct.order] ?? 0;
      const totalAlumnos = etapaData?.totalParticipantes || 0;
      const acertaron = Math.round((tasa / 100) * totalAlumnos);
      const nivel = getTasaLogroLevel(tasa);

      return {
        key: et.key,
        label: et.label,
        tasa,
        totalAlumnos,
        acertaron,
        nivel,
        color: colorCfg.border,
      };
    });

    const firstTasa = steps[0]?.tasa ?? 0;
    const lastTasa = steps[steps.length - 1]?.tasa ?? 0;
    const delta = Number((lastTasa - firstTasa).toFixed(1));

    return {
      act: selectedAct,
      steps,
      firstTasa,
      lastTasa,
      delta,
    };
  }, [selectedAct, activeEtapasList, seccionData]);

  if (M === 0) {
    return (
      <div className="bg-white rounded-2xl border border-slate-200/90 p-8 text-center text-slate-400">
        No hay criterios de evaluación registrados para generar la Diana Polar del salón.
      </div>
    );
  }

  return (
    <div className="bg-white rounded-2xl border border-slate-200/90 p-4 sm:p-5 md:p-6 shadow-2xs animate-fadeIn flex flex-col gap-5 w-full">
      {/* 1. Cabecera del Gráfico con Identificador y Escala */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 border-b border-slate-100 gap-2">
        <div className="flex items-center gap-2">
          <div className="w-2.5 h-4 bg-blue-600 rounded-xs" />
          <h4 className="text-sm sm:text-base font-extrabold text-slate-900">
            Diana Polar de Logro y Progresión • {seccionLabel}
          </h4>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-xs font-bold text-slate-600 bg-slate-50 px-2.5 py-1 rounded-lg border border-slate-200">
            Escala Porcentual: 0% a 100% de Aciertos en Aula
          </span>
          <span className="text-xs font-semibold text-slate-500">
            {M} criterios evaluados
          </span>
        </div>
      </div>

      {/* 2. Tarjetas KPI de Resumen Dinámico (Aula vs Criterio Seleccionado) */}
      <div className="w-full flex flex-col gap-2">
        {selectedAct && (
          <div className="flex items-center justify-between px-1 text-xs">
            <span className="font-bold text-blue-700 uppercase tracking-wider text-[11px] flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-blue-600 animate-pulse" />
              Criterio N° {selectedAct.order} seleccionado
            </span>
            <button
              type="button"
              onClick={() => setSelectedOrder(null)}
              className="text-[11px] font-bold text-slate-500 hover:text-blue-600 bg-slate-50 hover:bg-blue-50 px-2.5 py-1 rounded-lg border border-slate-200 transition-colors cursor-pointer"
              title="Volver a ver el promedio global del salón"
            >
              ✕ Ver resumen del aula
            </button>
          </div>
        )}

        <div
          className="grid gap-3 sm:gap-4 w-full"
          style={{
            gridTemplateColumns: `repeat(${Math.max(1, activeEtapasList.length)}, minmax(0, 1fr))`,
          }}
        >
          {selectedActDetail
            ? selectedActDetail.steps.map((st) => (
                <div
                  key={`diana-sec-card-${st.key}`}
                  className="w-full bg-white rounded-2xl border border-slate-200/90 shadow-2xs flex flex-col items-center text-center justify-center p-3 sm:p-4 border-t-4 transition-all"
                  style={{ borderTopColor: st.nivel.color }}
                >
                  <span className="text-[11px] sm:text-xs font-bold text-slate-600 uppercase tracking-wider">
                    {st.label}
                  </span>
                  <div className="flex items-baseline gap-1 my-1">
                    <span className="text-2xl sm:text-3xl font-black text-slate-900 leading-tight">
                      {st.tasa}%
                    </span>
                    <span className="text-xs font-semibold text-slate-400">acierto</span>
                  </div>
                  <span
                    className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold border ${st.nivel.badgeBg} ${st.nivel.badgeText} ${st.nivel.badgeBorder}`}
                  >
                    {st.nivel.nombre}
                  </span>
                  <span className="text-[11px] text-slate-400 mt-1 font-medium">
                    {st.acertaron} de {st.totalAlumnos} alumnos
                  </span>
                </div>
              ))
            : globalStageSummaries.map((st) => (
                <div
                  key={`diana-global-card-${st.key}`}
                  className="w-full bg-white rounded-2xl border border-slate-200/90 shadow-2xs flex flex-col items-center text-center justify-center p-3 sm:p-4 border-t-4 transition-all"
                  style={{ borderTopColor: st.color }}
                >
                  <span className="text-[11px] sm:text-xs font-bold text-slate-600 uppercase tracking-wider">
                    {st.label}
                  </span>
                  <div className="flex items-baseline gap-1 my-1">
                    <span className="text-2xl sm:text-3xl font-black text-slate-900 leading-tight">
                      {st.promedioPct}%
                    </span>
                    <span className="text-xs font-semibold text-slate-400">logro aula</span>
                  </div>
                  <span className="text-xs font-bold text-slate-500">
                    {st.promedioPts} pts prom. • {st.totalPart} evaluados
                  </span>
                </div>
              ))}
        </div>
      </div>

      {/* 3. Cuerpo Principal: Diana Polar SVG a la izquierda + Panel de Criterios a la derecha */}
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-6 items-start w-full">
        {/* Columna Izquierda: Diana Polar SVG */}
        <div className="xl:col-span-5 2xl:col-span-5 flex flex-col items-center justify-center p-3 sm:p-4 bg-slate-50/50 rounded-3xl border border-slate-200/80 w-full">
          <div className="w-full max-w-[560px] aspect-square relative flex items-center justify-center">
            <svg
              viewBox="0 0 580 580"
              className="w-full h-full select-none"
              style={{ overflow: 'visible' }}
            >
              <defs>
                <filter id="diana-sec-glow" x="-20%" y="-20%" width="140%" height="140%">
                  <feDropShadow dx="0" dy="2" stdDeviation="3.5" floodColor="#2563eb" floodOpacity="0.5" />
                </filter>
                <filter id="diana-sec-shadow" x="-20%" y="-20%" width="140%" height="140%">
                  <feDropShadow dx="0" dy="1" stdDeviation="2" floodColor="#000000" floodOpacity="0.14" />
                </filter>
              </defs>

              {/* Guía exterior punteada */}
              <circle
                cx={cx}
                cy={cy}
                r={rMax}
                fill="none"
                stroke="#cbd5e1"
                strokeWidth={1}
                strokeDasharray="2 3"
              />

              {/* Anillos concéntricos de etapas evaluativas y celdas de logro pedagógico */}
              {Array.from({ length: K }).map((_, k) => {
                const etapa = activeEtapasList[k];
                if (!etapa) return null;
                const innerR = rHub + k * ringThickness;
                const outerR = innerR + ringThickness;
                const etapaData = seccionData?.etapas[etapa.key];

                return (
                  <g key={`diana-ring-sec-${etapa.key}-${k}`}>
                    {actsGeometry.map(({ act, startDeg, endDeg }) => {
                      const tasa = etapaData?.tasaLogroPorActuacion[act.order] ?? 0;
                      const hasData = (etapaData?.totalParticipantes || 0) > 0;
                      const level = getTasaLogroLevel(tasa);
                      const fillColor = hasData ? level.color : '#f1f5f9';

                      const d = describeAnnularSector(cx, cy, innerR, outerR, startDeg, endDeg);
                      const isHovered = hoveredOrder === act.order;
                      const isSelected = selectedOrder === act.order;

                      return (
                        <path
                          key={`sector-sec-${etapa.key}-${act.order}`}
                          d={d}
                          fill={fillColor}
                          stroke="#ffffff"
                          strokeWidth={1.5}
                          opacity={isSelected || isHovered ? 1 : 0.88}
                          className="cursor-pointer transition-all duration-150"
                          onClick={() => setSelectedOrder((prev) => (prev === act.order ? null : act.order))}
                          onMouseEnter={() => setHoveredOrder(act.order)}
                          onMouseLeave={() => setHoveredOrder(null)}
                        >
                          <title>{`Criterio ${act.order} • ${etapa.label}: ${tasa}% de logro en el aula (${level.nombre})`}</title>
                        </path>
                      );
                    })}
                  </g>
                );
              })}

              {/* Resalte envolvente de la cuña activa (Hover o Selección) */}
              {activeGeom && (
                <path
                  d={describeAnnularSector(
                    cx,
                    cy,
                    rHub - 1,
                    rMax + 2,
                    activeGeom.startDeg,
                    activeGeom.endDeg
                  )}
                  fill="none"
                  stroke="#2563eb"
                  strokeWidth={2.8}
                  pointerEvents="none"
                  className="transition-all duration-150"
                />
              )}

              {/* Centro / Hub de la Diana Polar */}
              {(() => {
                const lastStageKey = activeEtapasList[activeEtapasList.length - 1]?.key;
                const lastStageMetrica = lastStageKey ? seccionData?.etapas[lastStageKey] : undefined;
                const generalPct = lastStageMetrica?.promedioPorcentaje || 0;

                const activeTasa = selectedAct && lastStageKey
                  ? seccionData?.etapas[lastStageKey]?.tasaLogroPorActuacion[selectedAct.order] ?? 0
                  : null;
                const activeLevel = activeTasa !== null ? getTasaLogroLevel(activeTasa) : null;
                const hubColor = activeLevel ? activeLevel.color : '#2563eb';

                return (
                  <g>
                    <circle
                      cx={cx}
                      cy={cy}
                      r={rHub - 2}
                      fill={hubColor}
                      className="transition-colors duration-200 cursor-pointer shadow-inner"
                      onClick={() => setSelectedOrder(null)}
                    />
                    <circle
                      cx={cx}
                      cy={cy}
                      r={rHub - 5}
                      fill="none"
                      stroke="rgba(255,255,255,0.4)"
                      strokeWidth={1.5}
                      pointerEvents="none"
                    />
                    {selectedAct && activeLevel ? (
                      <g pointerEvents="none">
                        <text
                          x={cx}
                          y={cy - 8}
                          textAnchor="middle"
                          fill="#ffffff"
                          fontSize={22}
                          fontWeight="900"
                        >
                          {activeTasa}%
                        </text>
                        <text
                          x={cx}
                          y={cy + 10}
                          textAnchor="middle"
                          fill="#ffffff"
                          fontSize={8.5}
                          fontWeight="800"
                          letterSpacing="0.04em"
                        >
                          N° {selectedAct.order} • {activeLevel.nombre.toUpperCase()}
                        </text>
                      </g>
                    ) : (
                      <g pointerEvents="none">
                        <text
                          x={cx}
                          y={cy - 6}
                          textAnchor="middle"
                          fill="#ffffff"
                          fontSize={23}
                          fontWeight="900"
                        >
                          {generalPct}%
                        </text>
                        <text
                          x={cx}
                          y={cy + 12}
                          textAnchor="middle"
                          fill="rgba(255,255,255,0.92)"
                          fontSize={8}
                          fontWeight="800"
                          letterSpacing="0.04em"
                        >
                          LOGRO AULA
                        </text>
                      </g>
                    )}
                  </g>
                );
              })()}

              {/* Badges perimetrales numerados basados en el nivel consolidado de todas las etapas */}
              {actsGeometry.map(({ act, bx, by }) => {
                const isSelected = selectedOrder === act.order;
                const isHovered = hoveredOrder === act.order;
                
                // Nivel consolidado del salón a través de todas las etapas activas
                const tasasPorEtapa = activeEtapasList.map(
                  (et) => seccionData?.etapas[et.key]?.tasaLogroPorActuacion[act.order] ?? 0
                );
                const sumaTasas = tasasPorEtapa.reduce((acc, v) => acc + v, 0);
                const promedioPct = tasasPorEtapa.length > 0 ? sumaTasas / tasasPorEtapa.length : 0;
                const level = getTasaLogroLevel(promedioPct);

                return (
                  <g
                    key={`diana-sec-badge-${act.order}`}
                    className="cursor-pointer transition-transform duration-150"
                    onClick={() => setSelectedOrder((prev) => (prev === act.order ? null : act.order))}
                    onMouseEnter={() => setHoveredOrder(act.order)}
                    onMouseLeave={() => setHoveredOrder(null)}
                  >
                    {isSelected ? (
                      <>
                        <circle
                          cx={bx}
                          cy={by}
                          r={15}
                          fill={level.color}
                          opacity={0.35}
                          filter="url(#diana-sec-glow)"
                        />
                        <circle
                          cx={bx}
                          cy={by}
                          r={12}
                          fill={level.color}
                          stroke="#ffffff"
                          strokeWidth={2}
                        />
                        <text
                          x={bx}
                          y={by}
                          textAnchor="middle"
                          dominantBaseline="central"
                          fill="#ffffff"
                          fontSize={11}
                          fontWeight="800"
                        >
                          {act.order}
                        </text>
                      </>
                    ) : (
                      <>
                        <circle
                          cx={bx}
                          cy={by}
                          r={10.5}
                          fill={isHovered ? level.color : '#ffffff'}
                          stroke={level.color}
                          strokeWidth={2}
                          filter="url(#diana-sec-shadow)"
                        />
                        <text
                          x={bx}
                          y={by}
                          textAnchor="middle"
                          dominantBaseline="central"
                          fill={isHovered ? '#ffffff' : '#1e293b'}
                          fontSize={9.5}
                          fontWeight="800"
                        >
                          {act.order}
                        </text>
                      </>
                    )}
                  </g>
                );
              })}
            </svg>
          </div>

          {/* Leyenda pedagógica de rangos y etapas */}
          <div className="w-full mt-4 pt-3 border-t border-slate-200/80 flex flex-col gap-2">
            <div className="flex items-center justify-between text-[11px] text-slate-500 font-semibold px-1">
              <span>Etapas de adentro hacia afuera:</span>
              <div className="flex items-center gap-1.5 font-bold">
                {activeEtapasList.map((et, i) => (
                  <span key={`leg-ring-${et.key}`} className="inline-flex items-center gap-1">
                    <span className="w-2 h-2 rounded-full" style={{ backgroundColor: getEtapaColorConfig(et.key, i).border }} />
                    <span>{et.key.toUpperCase()}</span>
                    {i < activeEtapasList.length - 1 && <span className="text-slate-300">→</span>}
                  </span>
                ))}
              </div>
            </div>

            <div className="flex items-center justify-between gap-1 flex-wrap text-[11px] font-bold">
              <span className="inline-flex items-center gap-1 text-rose-700 bg-rose-50 px-2 py-0.5 rounded-md border border-rose-200">
                <span className="w-2 h-2 rounded-full bg-rose-500" />
                &lt; 50% Inicio
              </span>
              <span className="inline-flex items-center gap-1 text-amber-700 bg-amber-50 px-2 py-0.5 rounded-md border border-amber-200">
                <span className="w-2 h-2 rounded-full bg-amber-500" />
                50% - 74% Proceso
              </span>
              <span className="inline-flex items-center gap-1 text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200">
                <span className="w-2 h-2 rounded-full bg-emerald-500" />
                75% - 89% Logrado
              </span>
              <span className="inline-flex items-center gap-1 text-blue-700 bg-blue-50 px-2 py-0.5 rounded-md border border-blue-200">
                <span className="w-2 h-2 rounded-full bg-blue-600" />
                ≥ 90% Destacado
              </span>
            </div>
          </div>
        </div>

        {/* Columna Derecha: Panel de Inspección y Tabla Rápida */}
        <div className="xl:col-span-7 2xl:col-span-7 flex flex-col gap-3.5 w-full">
          {/* Card Destacada del Criterio Seleccionado */}
          {selectedActDetail ? (
            <div className="p-4 rounded-2xl border border-blue-200 bg-blue-50/40 shadow-2xs flex flex-col gap-3">
              <div className="flex items-start justify-between gap-2">
                <div className="flex items-center gap-2">
                  <span className="inline-flex items-center justify-center w-7 h-7 rounded-xl bg-blue-600 text-white font-black text-xs shadow-2xs">
                    {selectedActDetail.act.order}
                  </span>
                  <div>
                    <h5 className="text-xs font-bold text-slate-800 leading-snug">
                      {selectedActDetail.act.actuacion || selectedActDetail.act.pregunta || `Actuación ${selectedActDetail.act.order}`}
                    </h5>
                    <span className="text-[11px] text-slate-500">
                      Evolución del logro en este criterio
                    </span>
                  </div>
                </div>
                <div className="text-right shrink-0">
                  <span
                    className={`inline-flex items-center gap-0.5 px-2 py-0.5 rounded-full text-xs font-black ${
                      selectedActDetail.delta > 0
                        ? 'bg-emerald-100 text-emerald-800'
                        : selectedActDetail.delta < 0
                        ? 'bg-rose-100 text-rose-800'
                        : 'bg-slate-100 text-slate-700'
                    }`}
                  >
                    {selectedActDetail.delta > 0 ? (
                      <MdTrendingUp className="w-3.5 h-3.5" />
                    ) : selectedActDetail.delta < 0 ? (
                      <MdTrendingDown className="w-3.5 h-3.5" />
                    ) : (
                      <MdTrendingFlat className="w-3.5 h-3.5" />
                    )}
                    {selectedActDetail.delta > 0 ? `+${selectedActDetail.delta}%` : `${selectedActDetail.delta}%`}
                  </span>
                </div>
              </div>

              {/* Barras de progreso por cada etapa evaluativa */}
              <div className="space-y-2 mt-1">
                {selectedActDetail.steps.map((st) => (
                  <div key={`progress-${st.key}`} className="space-y-1">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-bold text-slate-700 flex items-center gap-1.5">
                        <span className="w-2 h-2 rounded-full" style={{ backgroundColor: st.color }} />
                        {st.label}
                      </span>
                      <span className="font-black text-slate-900">
                        {st.tasa}%{' '}
                        <span className="text-[11px] font-semibold text-slate-500">
                          ({st.acertaron}/{st.totalAlumnos} alumnos)
                        </span>
                      </span>
                    </div>
                    <div className="w-full h-2 rounded-full bg-slate-200/80 overflow-hidden">
                      <div
                        className="h-full rounded-full transition-all duration-300"
                        style={{
                          width: `${Math.min(100, Math.max(0, st.tasa))}%`,
                          backgroundColor: st.nivel.color,
                        }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="p-4 rounded-2xl border border-slate-200/80 bg-slate-50/70 flex items-center gap-3">
              <MdInfoOutline className="w-5 h-5 text-blue-600 shrink-0" />
              <p className="text-xs text-slate-600">
                Haz clic en cualquier celda o número de la Diana Polar para ver la progresión detallada de esa competencia en el salón.
              </p>
            </div>
          )}

          {/* Buscador de Criterios */}
          <div className="relative">
            <MdSearch className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Buscar criterio por número o descripción..."
              className="w-full pl-9 pr-8 py-2 text-xs rounded-xl border border-slate-200 bg-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-0.5"
              >
                <MdClose className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Tabla Interactiva de Criterios con Semáforo */}
          <div className="border border-slate-200/90 rounded-2xl bg-white shadow-2xs overflow-hidden w-full">
            <div className="max-h-[520px] overflow-y-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead className="sticky top-0 bg-slate-100/95 backdrop-blur-xs border-b border-slate-200 text-slate-600 text-[11px] font-bold uppercase tracking-wider z-10">
                  <tr>
                    <th className="py-2.5 px-3 text-center w-10 shrink-0">N°</th>
                    <th className="py-2.5 px-3 min-w-[220px]">Criterio / Competencia</th>
                    {activeEtapasList.map((et) => (
                      <th key={`th-sec-${et.key}`} className="py-2.5 px-2 text-center w-16 shrink-0">
                        {et.key.toUpperCase()}
                      </th>
                    ))}
                    <th className="py-2.5 px-2.5 text-center min-w-[110px] shrink-0">Nivel</th>
                    <th className="py-2.5 px-2 text-center w-14 shrink-0">Δ</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredActuaciones.map((act) => {
                    const isSelected = selectedOrder === act.order;
                    const isHovered = hoveredOrder === act.order;

                    const activeEtapas = activeEtapasList;
                    const firstEt = activeEtapas[0];
                    const lastEt = activeEtapas[activeEtapas.length - 1];
                    const firstTasa = firstEt ? seccionData?.etapas[firstEt.key]?.tasaLogroPorActuacion[act.order] ?? 0 : 0;
                    const lastTasa = lastEt ? seccionData?.etapas[lastEt.key]?.tasaLogroPorActuacion[act.order] ?? 0 : 0;
                    const delta = Number((lastTasa - firstTasa).toFixed(1));

                    // Nivel consolidado de todas las etapas
                    const tasasPorEtapa = activeEtapas.map(
                      (et) => seccionData?.etapas[et.key]?.tasaLogroPorActuacion[act.order] ?? 0
                    );
                    const sumaTasas = tasasPorEtapa.reduce((acc, v) => acc + v, 0);
                    const promedioPct = tasasPorEtapa.length > 0 ? sumaTasas / tasasPorEtapa.length : 0;
                    const nivelConsolidado = getTasaLogroLevel(promedioPct);

                    return (
                      <tr
                        key={`diana-sec-row-${act.order}`}
                        onClick={() => setSelectedOrder((prev) => (prev === act.order ? null : act.order))}
                        onMouseEnter={() => setHoveredOrder(act.order)}
                        onMouseLeave={() => setHoveredOrder(null)}
                        className={`cursor-pointer transition-colors duration-150 ${
                          isSelected
                            ? 'bg-blue-50/90 text-blue-950 font-medium'
                            : isHovered
                            ? 'bg-slate-50 text-slate-800'
                            : 'hover:bg-slate-50/70 text-slate-700'
                        }`}
                      >
                        <td className="py-2 px-3 text-center font-bold">
                          <span
                            className={`inline-flex items-center justify-center w-5 h-5 rounded-md text-[11px] ${
                              isSelected ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-700'
                            }`}
                          >
                            {act.order}
                          </span>
                        </td>
                        <td className="py-2 px-3 text-slate-800 leading-snug">
                          <span className="line-clamp-2">{act.actuacion || act.pregunta || `Actuación ${act.order}`}</span>
                        </td>
                        {activeEtapas.map((et) => {
                          const tasa = seccionData?.etapas[et.key]?.tasaLogroPorActuacion[act.order] ?? 0;
                          const lvl = getTasaLogroLevel(tasa);

                          return (
                            <td key={`cell-sec-${act.order}-${et.key}`} className="py-2 px-2 text-center">
                              <span
                                className={`inline-flex items-center justify-center px-1.5 py-0.5 rounded-md text-[10px] font-black border ${lvl.badgeBg} ${lvl.badgeText} ${lvl.badgeBorder}`}
                              >
                                {tasa}%
                              </span>
                            </td>
                          );
                        })}
                        {/* Nivel Consolidado de todas las etapas */}
                        <td className="py-2 px-2.5 text-center">
                          <span
                            className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold border ${nivelConsolidado.badgeBg} ${nivelConsolidado.badgeText} ${nivelConsolidado.badgeBorder}`}
                          >
                            <span
                              className="w-1.5 h-1.5 rounded-full shrink-0"
                              style={{ backgroundColor: nivelConsolidado.color }}
                            />
                            <span>{nivelConsolidado.nombre}</span>
                          </span>
                        </td>
                        <td className="py-2 px-2 text-center">
                          <span
                            className={`inline-flex items-center text-[10px] font-black ${
                              delta > 0 ? 'text-emerald-700' : delta < 0 ? 'text-rose-700' : 'text-slate-500'
                            }`}
                          >
                            {delta > 0 ? `+${delta}%` : `${delta}%`}
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
      </div>
    </div>
  );
};
