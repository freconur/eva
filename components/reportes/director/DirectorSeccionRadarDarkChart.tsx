import React, { useMemo, useState } from 'react';
import {
  MdCheck,
  MdSearch,
  MdClose,
  MdTrendingUp,
  MdTrendingDown,
  MdTrendingFlat,
  MdLayers,
  MdVisibility,
  MdVisibilityOff,
} from 'react-icons/md';
import type { ActuacionCatalogoItem } from '@/components/reportes/estudiante/useDocenteEvolucionEstudiantes';
import type { SeccionDetalleAnalytics, SeccionEtapaDetalle } from './DirectorEvolucionEstudiantesTab';
import { determinarNivelSalonHabilidad } from './DirectorSeccionRadarChart';

export interface DirectorSeccionRadarDarkChartProps {
  catalogoActuaciones: ActuacionCatalogoItem[];
  seccionData?: SeccionDetalleAnalytics;
  etapasConfiguradas: { key: string; label: string; [k: string]: any }[];
  activeStages: Record<string, boolean>;
  seccionLabel?: string;
  onToggleStage?: (stageKey: string) => void;
  ieMetrica?: SeccionEtapaDetalle;
  headerSlot?: React.ReactNode;
  compact?: boolean;
  highlightedOrder?: number | null;
  onHoverOrder?: (order: number | null) => void;
}

// Paleta institucional oficial de EVA para las evaluaciones (EDI, EP1, EP2, etc.)
export const EVALUACION_PALETTE: Record<string, { border: string; bg: string; dot: string; label: string }> = {
  edi: { border: '#2563eb', bg: 'rgba(37, 99, 235, 0.32)', dot: '#2563eb', label: 'EDI' },
  ep1: { border: '#f59e0b', bg: 'rgba(245, 158, 11, 0.32)', dot: '#f59e0b', label: 'EP1' },
  ep2: { border: '#10b981', bg: 'rgba(16, 185, 129, 0.32)', dot: '#10b981', label: 'EP2' },
  ep3: { border: '#8b5cf6', bg: 'rgba(139, 92, 246, 0.32)', dot: '#8b5cf6', label: 'EP3' },
  es: { border: '#ec4899', bg: 'rgba(236, 72, 153, 0.32)', dot: '#ec4899', label: 'ES' },
};

export const getEvaluacionColor = (stageKey: string, idx: number = 0): { border: string; bg: string; dot: string } => {
  const k = (stageKey || '').toLowerCase();
  if (EVALUACION_PALETTE[k]) {
    return EVALUACION_PALETTE[k];
  }
  const fallback = [
    { border: '#2563eb', bg: 'rgba(37, 99, 235, 0.32)', dot: '#2563eb' },
    { border: '#f59e0b', bg: 'rgba(245, 158, 11, 0.32)', dot: '#f59e0b' },
    { border: '#10b981', bg: 'rgba(16, 185, 129, 0.32)', dot: '#10b981' },
    { border: '#8b5cf6', bg: 'rgba(139, 92, 246, 0.32)', dot: '#8b5cf6' },
    { border: '#ec4899', bg: 'rgba(236, 72, 153, 0.32)', dot: '#ec4899' },
  ];
  return fallback[idx % fallback.length];
};

// Colores rotativos vibrantes de los badges circulares perimetrales (1 a M) fieles al diseño de la captura
const PERIMETER_BADGE_COLORS = [
  '#ffcf33', // Amarillo cálido
  '#ff499e', // Rosa magenta
  '#4ce0b3', // Menta esmeralda
];

export const DirectorSeccionRadarDarkChart: React.FC<DirectorSeccionRadarDarkChartProps> = ({
  catalogoActuaciones,
  seccionData,
  etapasConfiguradas,
  activeStages,
  seccionLabel = 'Salón',
  onToggleStage,
  ieMetrica,
  headerSlot,
  compact = false,
  highlightedOrder: externalHighlightedOrder,
  onHoverOrder,
}) => {
  const [internalHoveredOrder, setInternalHoveredOrder] = useState<number | null>(null);
  const [selectedOrder, setSelectedOrder] = useState<number | null>(null);
  const [showTable, setShowTable] = useState<boolean>(false);
  const [searchQuery, setSearchQuery] = useState<string>('');

  const activeEtapasList = useMemo(() => {
    return etapasConfiguradas.filter((e) => activeStages[e.key] ?? true);
  }, [etapasConfiguradas, activeStages]);

  const M = catalogoActuaciones.length;

  const setHoveredOrder = (order: number | null) => {
    setInternalHoveredOrder(order);
    if (onHoverOrder) {
      onHoverOrder(order);
    }
  };

  // Criterio actualmente enfocado para tooltip o detalle
  const activeFocusOrder =
    externalHighlightedOrder !== undefined && externalHighlightedOrder !== null
      ? externalHighlightedOrder
      : (internalHoveredOrder ?? selectedOrder ?? null);

  // Dimensiones y centro geométrico del lienzo circular
  // Tamaño expandido con mayor radio para que el gráfico sea visiblemente más grande
  const SVG_SIZE = 600;
  const cx = SVG_SIZE / 2;
  const cy = SVG_SIZE / 2;
  const R_outer = compact ? 228 : 236; // Radio del círculo blanco perimetral (expandido)
  const R_badges = compact ? 264 : 272; // Radio de los centros de los números perimetrales

  // Ángulo de cada vértice / habilidad: i = 0 inicia arriba (12 en punto) en sentido horario
  const vertexAngles = useMemo(() => {
    if (M === 0) return [];
    return catalogoActuaciones.map((_, i) => -Math.PI / 2 + (2 * Math.PI * i) / M);
  }, [M, catalogoActuaciones]);

  // Vértices y badges perimetrales
  const perimetroItems = useMemo(() => {
    return catalogoActuaciones.map((act, i) => {
      const angle = vertexAngles[i];
      const spokeX = cx + R_outer * Math.cos(angle);
      const spokeY = cy + R_outer * Math.sin(angle);
      const badgeX = cx + R_badges * Math.cos(angle);
      const badgeY = cy + R_badges * Math.sin(angle);
      const badgeColor = PERIMETER_BADGE_COLORS[i % PERIMETER_BADGE_COLORS.length];

      return {
        act,
        index: i,
        angle,
        spokeX,
        spokeY,
        badgeX,
        badgeY,
        badgeColor,
      };
    });
  }, [catalogoActuaciones, vertexAngles, cx, cy, R_outer, R_badges]);

  // Polígonos de cada etapa evaluativa activa con sus colores institucionales preservados
  const stagePolygons = useMemo(() => {
    return activeEtapasList.map((etapa, idx) => {
      const metrica = seccionData?.etapas[etapa.key];
      const colorCfg = getEvaluacionColor(etapa.key, idx);

      const points = perimetroItems.map(({ act, angle }) => {
        const tasa = metrica?.tasaLogroPorActuacion[act.order] ?? 0;
        // Normalización [0.04, 1.0] para evitar colapso al origen
        const val = Math.max(0.04, Math.min(1.0, tasa / 100));
        const r = val * R_outer;
        const x = cx + r * Math.cos(angle);
        const y = cy + r * Math.sin(angle);
        return { x, y, tasa, order: act.order };
      });

      const pointsSvgString = points.map((p) => `${p.x.toFixed(1)},${p.y.toFixed(1)}`).join(' ');

      return {
        etapa,
        colorCfg,
        metrica,
        points,
        pointsSvgString,
      };
    });
  }, [activeEtapasList, seccionData, perimetroItems, cx, cy, R_outer]);

  // Criterio actualmente enfocado para tooltip o detalle
  const activeFocusItem = useMemo(() => {
    if (activeFocusOrder === null) return null;
    return catalogoActuaciones.find((a) => a.order === activeFocusOrder) || null;
  }, [activeFocusOrder, catalogoActuaciones]);

  // Filtrado de tabla
  const filteredActuaciones = useMemo(() => {
    if (!searchQuery.trim()) return catalogoActuaciones;
    const q = searchQuery.toLowerCase().trim();
    return catalogoActuaciones.filter((act) => {
      const txt = (act.actuacion || act.pregunta || '').toLowerCase();
      const num = String(act.order);
      return txt.includes(q) || num === q;
    });
  }, [catalogoActuaciones, searchQuery]);

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

  if (M === 0) {
    return (
      <div className="bg-white rounded-3xl border border-slate-200/90 p-8 text-center text-slate-400">
        No hay criterios de evaluación registrados para generar el gráfico radar.
      </div>
    );
  }

  // Radios concéntricos de referencia: 0.2, 0.4, 0.6, 0.8, 1.0
  const concentricLevels = [0.2, 0.4, 0.6, 0.8, 1.0];

  // =========================================================================
  // VISTA COMPACTA: Ocupa la columna izquierda con fondo blanco y cabecera institucional
  // =========================================================================
  if (compact) {
    return (
      <div className="bg-white rounded-3xl border border-slate-200/90 shadow-2xs overflow-hidden flex flex-col items-center justify-between w-full h-[560px] sm:h-[620px] md:h-[660px] transition-all relative">
        {/* Cabecera estilo Radar del Aprendizaje con gradiente institucional */}
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

        {/* Lienzo SVG Circular Centrado y Ampliado sobre fondo blanco limpio */}
        <div className="w-full h-[470px] sm:h-[520px] md:h-[560px] max-w-[620px] flex items-center justify-center relative my-auto p-2">
          <svg
            viewBox={`0 0 ${SVG_SIZE} ${SVG_SIZE}`}
            className="h-full w-full max-h-full aspect-square drop-shadow-sm overflow-visible"
          >
            <rect
              x="0"
              y="0"
              width={SVG_SIZE}
              height={SVG_SIZE}
              fill="#ffffff"
              rx="24"
            />

            {/* Radios conectores (Spokes) */}
            <g className="spokes">
              {perimetroItems.map((item) => (
                <line
                  key={`spoke-c-${item.act.order}`}
                  x1={cx}
                  y1={cy}
                  x2={item.spokeX}
                  y2={item.spokeY}
                  stroke={activeFocusOrder === item.act.order ? '#64748b' : '#e2e8f0'}
                  strokeWidth={activeFocusOrder === item.act.order ? 1.6 : 1}
                />
              ))}
            </g>

            {/* Círculos concéntricos de referencia */}
            <g className="concentric-circles">
              {concentricLevels.map((lvl) => {
                const r = lvl * R_outer;
                return (
                  <circle
                    key={`circle-lvl-c-${lvl}`}
                    cx={cx}
                    cy={cy}
                    r={r}
                    fill="none"
                    stroke={lvl === 1.0 ? '#64748b' : '#e2e8f0'}
                    strokeWidth={lvl === 1.0 ? 1.8 : 1}
                  />
                );
              })}
            </g>

            {/* Etiquetas de escala radial vertical */}
            <g className="axis-labels select-none pointer-events-none">
              <text
                x={cx}
                y={cy + 13}
                textAnchor="middle"
                fill="#64748b"
                fontSize="10"
                fontWeight="600"
                fontFamily="sans-serif"
              >
                0.0
              </text>
              {concentricLevels.map((lvl) => {
                const yPos = cy - lvl * R_outer;
                return (
                  <g key={`lbl-txt-c-${lvl}`}>
                    <rect
                      x={cx - 13}
                      y={yPos - 11}
                      width="26"
                      height="11"
                      rx="3"
                      fill="#ffffff"
                      stroke="#e2e8f0"
                      strokeWidth="0.8"
                    />
                    <text
                      x={cx}
                      y={yPos - 2}
                      textAnchor="middle"
                      fill="#334155"
                      fontSize="9.5"
                      fontWeight="700"
                      fontFamily="sans-serif"
                    >
                      {lvl.toFixed(1)}
                    </text>
                  </g>
                );
              })}
            </g>

            {/* Polígonos de las Evaluaciones */}
            <g className="evaluation-polygons">
              {stagePolygons.map(({ etapa, colorCfg, pointsSvgString, points }) => (
                <g key={`poly-group-c-${etapa.key}`} className="transition-all">
                  <polygon
                    points={pointsSvgString}
                    fill={colorCfg.border}
                    fillOpacity={0.22}
                    stroke={colorCfg.border}
                    strokeWidth={2.4}
                    strokeLinejoin="round"
                  />
                  {points.map((pt) => {
                    const isTargetHovered = activeFocusOrder === pt.order;
                    return (
                      <circle
                        key={`pt-c-${etapa.key}-${pt.order}`}
                        cx={pt.x}
                        cy={pt.y}
                        r={isTargetHovered ? 6 : 3.8}
                        fill={colorCfg.border}
                        stroke="#ffffff"
                        strokeWidth={isTargetHovered ? 2 : 1.4}
                        className="transition-all cursor-pointer"
                        onMouseEnter={() => setHoveredOrder(pt.order)}
                        onMouseLeave={() => setHoveredOrder(null)}
                        onClick={() => setSelectedOrder((prev) => (prev === pt.order ? null : pt.order))}
                      >
                        <title>{`${etapa.label} - Pregunta N° ${pt.order}: ${pt.tasa}% de acierto`}</title>
                      </circle>
                    );
                  })}
                </g>
              ))}
            </g>

            {/* Badges Circulares Perimetrales con Números */}
            <g className="perimeter-badges">
              {perimetroItems.map((item) => {
                const isHovered = activeFocusOrder === item.act.order;
                const isSelected = selectedOrder === item.act.order;

                return (
                  <g
                    key={`badge-c-${item.act.order}`}
                    className="cursor-pointer transition-transform"
                    onMouseEnter={() => setHoveredOrder(item.act.order)}
                    onMouseLeave={() => setHoveredOrder(null)}
                    onClick={() => setSelectedOrder((prev) => (prev === item.act.order ? null : item.act.order))}
                  >
                    {(isHovered || isSelected) && (
                      <circle
                        cx={item.badgeX}
                        cy={item.badgeY}
                        r={16}
                        fill="none"
                        stroke="#3b82f6"
                        strokeWidth={2}
                        strokeDasharray="3,3"
                      />
                    )}
                    <circle
                      cx={item.badgeX}
                      cy={item.badgeY}
                      r={isHovered ? 14 : 12}
                      fill={item.badgeColor}
                      stroke="#ffffff"
                      strokeWidth={1.6}
                      className="transition-all shadow-sm"
                    />
                    <text
                      x={item.badgeX}
                      y={item.badgeY + 3.5}
                      textAnchor="middle"
                      fill="#0f172a"
                      fontSize={item.act.order > 99 ? '9' : '10'}
                      fontWeight="800"
                      fontFamily="sans-serif"
                      className="select-none pointer-events-none"
                    >
                      {item.act.order}
                    </text>
                  </g>
                );
              })}
            </g>
          </svg>
        </div>

        {/* Footer: HUD del elemento enfocado o Escala radial */}
        <div className="w-full py-2.5 px-4 border-t border-slate-200/80 bg-slate-50/70 flex items-center justify-between text-[11px] text-slate-600 font-semibold shrink-0">
          {activeFocusItem ? (
            <div className="flex items-center justify-between w-full">
              <span className="truncate">
                N.° {activeFocusItem.order}: <strong className="text-slate-900">{activeFocusItem.actuacion?.slice(0, 24)}...</strong>
              </span>
              <span className="font-mono text-blue-600 font-bold shrink-0 ml-2">
                {activeEtapasList.map((e) => `${e.key.toUpperCase()}: ${seccionData?.etapas[e.key]?.tasaLogroPorActuacion[activeFocusItem.order] ?? 0}%`).join(' · ')}
              </span>
            </div>
          ) : (
            <>
              <span>Escala: <strong className="text-slate-800">0% a 100%</strong></span>
              <span>Vértices: <strong className="text-slate-800">1 a {M} habilidades</strong></span>
            </>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-3xl border border-slate-200/90 shadow-xl p-4 sm:p-6 text-slate-900 flex flex-col gap-4 w-full transition-all">
      {/* 1. Header con Título, Slot de Controles (Switch) y Leyenda Interactiva con Checkboxes */}
      <div className="flex flex-col gap-3 pb-3 border-b border-slate-100">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <div className="w-2.5 h-4 bg-gradient-to-b from-blue-600 to-indigo-600 rounded-xs shadow-xs" />
            <div>
              <h4 className="text-sm sm:text-base font-extrabold text-slate-900 tracking-wide">
                Radar Circular Estelar de Competencias • {seccionLabel}
              </h4>
              <p className="text-[11px] text-slate-500 font-medium">
                Diseño circular concéntrico con halo de habilidades perimetrales (1 a {M})
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            {headerSlot}
            <button
              type="button"
              onClick={() => setShowTable((prev) => !prev)}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold rounded-xl border border-slate-200 bg-slate-50 hover:bg-slate-100 text-slate-700 transition-colors cursor-pointer shadow-xs"
              title={showTable ? 'Ocultar tabla de habilidades' : 'Ver tabla de habilidades'}
            >
              {showTable ? <MdVisibilityOff className="w-4 h-4" /> : <MdVisibility className="w-4 h-4" />}
              <span>{showTable ? 'Ocultar Tabla' : 'Ver Tabla'}</span>
            </button>
          </div>
        </div>

        {/* 2. Leyenda Superior Interactiva con Checkboxes */}
        <div className="flex items-center justify-center gap-4 sm:gap-6 flex-wrap pt-1 select-none">
          {etapasConfiguradas.map((etapa, idx) => {
            const isChecked = activeStages[etapa.key] ?? true;
            const colorCfg = getEvaluacionColor(etapa.key, idx);
            const metrica = seccionData?.etapas[etapa.key];

            return (
              <button
                key={`dark-radar-stage-${etapa.key}`}
                type="button"
                onClick={() => onToggleStage && onToggleStage(etapa.key)}
                className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-xl border transition-all cursor-pointer shadow-xs ${
                  isChecked
                    ? 'bg-white border-slate-300 text-slate-800 hover:bg-slate-50'
                    : 'bg-slate-50 border-slate-200 text-slate-400 hover:text-slate-600'
                }`}
                title={`Alternar ${etapa.label}`}
              >
                {/* Cuadro de Checkbox */}
                <span
                  className={`w-4 h-4 rounded-md flex items-center justify-center transition-all ${
                    isChecked
                      ? 'bg-blue-600 text-white shadow-xs'
                      : 'border border-slate-300 bg-transparent'
                  }`}
                >
                  {isChecked && <MdCheck className="w-3.5 h-3.5 stroke-[1]" />}
                </span>

                {/* Círculo indicador con el color exacto de la evaluación */}
                <span
                  className="w-3 h-3 rounded-full shrink-0 shadow-xs ring-1 ring-slate-300"
                  style={{ backgroundColor: colorCfg.border }}
                />

                {/* Nombre de la evaluación */}
                <span className="text-xs font-bold tracking-wide">
                  {etapa.label}
                </span>

                {metrica && (
                  <span className="text-[11px] text-slate-500 font-mono font-bold">
                    ({metrica.promedioPorcentaje || 0}%)
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* 3. Contenedor Principal: Gráfico Circular SVG + Tabla Lateral Opcional */}
      <div className={`grid grid-cols-1 ${showTable ? 'xl:grid-cols-12' : ''} gap-6 items-start w-full`}>
        {/* Columna del Gráfico Circular */}
        <div className={`${showTable ? 'xl:col-span-7 2xl:col-span-7' : 'w-full'} flex flex-col items-center justify-center relative`}>
          <div className="w-full max-w-[620px] aspect-square flex items-center justify-center relative">
            <svg
              viewBox={`0 0 ${SVG_SIZE} ${SVG_SIZE}`}
              className="w-full h-full drop-shadow-sm overflow-visible"
            >
              <rect
                x="0"
                y="0"
                width={SVG_SIZE}
                height={SVG_SIZE}
                fill="#ffffff"
                rx="32"
              />

              {/* 3.1 Radios radiales (Spokes) conectando el centro a cada número */}
              <g className="spokes">
                {perimetroItems.map((item) => (
                  <line
                    key={`spoke-${item.act.order}`}
                    x1={cx}
                    y1={cy}
                    x2={item.spokeX}
                    y2={item.spokeY}
                    stroke={activeFocusOrder === item.act.order ? '#64748b' : '#e2e8f0'}
                    strokeWidth={activeFocusOrder === item.act.order ? 1.5 : 0.9}
                  />
                ))}
              </g>

              {/* 3.2 Círculos concéntricos de referencia (0.2, 0.4, 0.6, 0.8, 1.0) */}
              <g className="concentric-circles">
                {concentricLevels.map((lvl) => {
                  const r = lvl * R_outer;
                  return (
                    <circle
                      key={`circle-lvl-${lvl}`}
                      cx={cx}
                      cy={cy}
                      r={r}
                      fill="none"
                      stroke={lvl === 1.0 ? '#64748b' : '#e2e8f0'}
                      strokeWidth={lvl === 1.0 ? 1.8 : 1}
                    />
                  );
                })}
              </g>

              {/* 3.3 Etiquetas de la escala radial vertical (0.0, 0.2, 0.4, 0.6, 0.8, 1.0) */}
              <g className="axis-labels select-none pointer-events-none">
                <text
                  x={cx}
                  y={cy + 13}
                  textAnchor="middle"
                  fill="#64748b"
                  fontSize="10"
                  fontWeight="600"
                  fontFamily="sans-serif"
                >
                  0.0
                </text>
                {concentricLevels.map((lvl) => {
                  const yPos = cy - lvl * R_outer;
                  return (
                    <g key={`lbl-txt-${lvl}`}>
                      {/* Fondo suave para legibilidad */}
                      <rect
                        x={cx - 14}
                        y={yPos - 12}
                        width="28"
                        height="12"
                        rx="4"
                        fill="#ffffff"
                        stroke="#e2e8f0"
                        strokeWidth="0.8"
                      />
                      <text
                        x={cx}
                        y={yPos - 2}
                        textAnchor="middle"
                        fill="#334155"
                        fontSize="10.5"
                        fontWeight="700"
                        fontFamily="sans-serif"
                      >
                        {lvl.toFixed(1)}
                      </text>
                    </g>
                  );
                })}
              </g>

              {/* 3.4 Polígonos de las Evaluaciones (Superpuestos con opacidad y color institucional) */}
              <g className="evaluation-polygons">
                {stagePolygons.map(({ etapa, colorCfg, pointsSvgString, points }) => (
                  <g key={`poly-group-${etapa.key}`} className="transition-all">
                    {/* Polígono de área */}
                    <polygon
                      points={pointsSvgString}
                      fill={colorCfg.border}
                      fillOpacity={0.28}
                      stroke={colorCfg.border}
                      strokeWidth={2.4}
                      strokeLinejoin="round"
                    />

                    {/* Vértices circulares con halo blanco nítido fieles a la captura */}
                    {points.map((pt) => {
                      const isTargetHovered = activeFocusOrder === pt.order;
                      return (
                        <circle
                          key={`pt-${etapa.key}-${pt.order}`}
                          cx={pt.x}
                          cy={pt.y}
                          r={isTargetHovered ? 6.5 : 4}
                          fill={colorCfg.border}
                          stroke="#ffffff"
                          strokeWidth={isTargetHovered ? 2.2 : 1.5}
                          className="transition-all cursor-pointer"
                          onMouseEnter={() => setHoveredOrder(pt.order)}
                          onMouseLeave={() => setHoveredOrder(null)}
                          onClick={() => setSelectedOrder((prev) => (prev === pt.order ? null : pt.order))}
                        >
                          <title>{`${etapa.label} - Pregunta N° ${pt.order}: ${pt.tasa}% de acierto`}</title>
                        </circle>
                      );
                    })}
                  </g>
                ))}
              </g>

              {/* 3.5 Badges Circulares Perimetrales con Números (1 a M) */}
              <g className="perimeter-badges">
                {perimetroItems.map((item) => {
                  const isHovered = activeFocusOrder === item.act.order;
                  const isSelected = selectedOrder === item.act.order;

                  return (
                    <g
                      key={`badge-${item.act.order}`}
                      className="cursor-pointer transition-transform"
                      onMouseEnter={() => setHoveredOrder(item.act.order)}
                      onMouseLeave={() => setHoveredOrder(null)}
                      onClick={() => setSelectedOrder((prev) => (prev === item.act.order ? null : item.act.order))}
                    >
                      {/* Aro de enfoque si está seleccionado o en hover */}
                      {(isHovered || isSelected) && (
                        <circle
                          cx={item.badgeX}
                          cy={item.badgeY}
                          r={18}
                          fill="none"
                          stroke="#ffffff"
                          strokeWidth={2}
                          strokeDasharray="3,3"
                        />
                      )}

                      {/* Círculo del Badge con color vibrante alternado */}
                      <circle
                        cx={item.badgeX}
                        cy={item.badgeY}
                        r={isHovered ? 15.5 : 13.5}
                        fill={item.badgeColor}
                        stroke="#ffffff"
                        strokeWidth={1.5}
                        className="transition-all"
                      />

                      {/* Número de Pregunta / Actuación */}
                      <text
                        x={item.badgeX}
                        y={item.badgeY + 4}
                        textAnchor="middle"
                        fill="#0f172a"
                        fontSize={item.act.order > 99 ? '9.5' : '11'}
                        fontWeight="800"
                        fontFamily="sans-serif"
                        className="select-none pointer-events-none"
                      >
                        {item.act.order}
                      </text>
                    </g>
                  );
                })}
              </g>
            </svg>
          </div>

          {/* HUD Flotante interactivo con detalles de la habilidad seleccionada */}
          {activeFocusItem && (
            <div className="w-full max-w-[560px] bg-purple-950/90 backdrop-blur-md rounded-2xl border border-purple-500/40 p-4 shadow-xl mt-2 animate-fadeIn flex flex-col gap-2">
              <div className="flex items-center justify-between gap-2 border-b border-purple-800/60 pb-2">
                <div className="flex items-center gap-2">
                  <span
                    className="w-6 h-6 rounded-full flex items-center justify-center font-black text-xs text-slate-900"
                    style={{
                      backgroundColor:
                        PERIMETER_BADGE_COLORS[(activeFocusItem.order - 1) % PERIMETER_BADGE_COLORS.length],
                    }}
                  >
                    {activeFocusItem.order}
                  </span>
                  <span className="text-xs font-bold text-white line-clamp-1">
                    {activeFocusItem.actuacion || `Actuación N° ${activeFocusItem.order}`}
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setSelectedOrder(null);
                    setHoveredOrder(null);
                  }}
                  className="p-1 text-purple-300 hover:text-white rounded-lg hover:bg-purple-900/60"
                  title="Cerrar detalle"
                >
                  <MdClose className="w-4 h-4" />
                </button>
              </div>

              {/* Comparativa de tasas en las evaluaciones activas */}
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 pt-1 text-xs">
                {activeEtapasList.map((etapa, idx) => {
                  const metrica = seccionData?.etapas[etapa.key];
                  const colorCfg = getEvaluacionColor(etapa.key, idx);
                  const tasa = metrica?.tasaLogroPorActuacion[activeFocusItem.order] ?? 0;

                  return (
                    <div
                      key={`hud-et-${etapa.key}`}
                      className="bg-purple-900/40 border border-purple-700/30 rounded-xl p-2 flex flex-col gap-0.5"
                    >
                      <div className="flex items-center gap-1.5 text-[11px] text-purple-200">
                        <span className="w-2 h-2 rounded-full" style={{ backgroundColor: colorCfg.border }} />
                        <span className="font-semibold truncate">{etapa.label}</span>
                      </div>
                      <span className="text-base font-black text-white">{tasa}%</span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* Columna Derecha: Tabla Completa de Habilidades en Modo Dark (si está expandida) */}
        {showTable && (
          <div className="xl:col-span-5 2xl:col-span-5 flex flex-col gap-3 w-full bg-purple-950/40 rounded-2xl border border-purple-800/40 p-4 shadow-xl animate-fadeIn">
            <div className="flex items-center justify-between pb-2 border-b border-purple-800/40">
              <h5 className="text-xs font-extrabold text-white uppercase tracking-wider">
                Desglose de Habilidades ({catalogoActuaciones.length})
              </h5>
              <span className="text-[11px] text-purple-300 font-medium">
                {activeEtapasList.length} evaluaciones activas
              </span>
            </div>

            {/* Buscador */}
            <div className="relative w-full">
              <MdSearch className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-purple-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Buscar por número o descripción..."
                className="w-full pl-9 pr-8 py-1.5 text-xs rounded-xl border border-purple-700/50 bg-purple-900/30 text-white placeholder-purple-300/40 focus:outline-none focus:ring-2 focus:ring-pink-500/40 shadow-xs"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery('')}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-purple-400 hover:text-white p-0.5"
                >
                  <MdClose className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            {/* Lista Scrolleable */}
            <div className="max-h-[460px] overflow-y-auto space-y-1.5 pr-1">
              {filteredActuaciones.map((act) => {
                const isSelected = activeFocusOrder === act.order;
                const badgeColor = PERIMETER_BADGE_COLORS[(act.order - 1) % PERIMETER_BADGE_COLORS.length];

                return (
                  <div
                    key={`dark-row-act-${act.order}`}
                    onClick={() => setSelectedOrder((prev) => (prev === act.order ? null : act.order))}
                    className={`p-2.5 rounded-xl border transition-all cursor-pointer flex flex-col gap-1.5 ${
                      isSelected
                        ? 'bg-purple-900/80 border-pink-400/60 shadow-md ring-1 ring-pink-400/30'
                        : 'bg-purple-950/50 border-purple-800/30 hover:bg-purple-900/40 text-purple-100'
                    }`}
                  >
                    <div className="flex items-start gap-2">
                      <span
                        className="w-5 h-5 rounded-full flex items-center justify-center font-black text-[11px] text-slate-900 shrink-0 mt-0.5"
                        style={{ backgroundColor: badgeColor }}
                      >
                        {act.order}
                      </span>
                      <span className="text-xs font-semibold leading-tight line-clamp-2">
                        {act.actuacion}
                      </span>
                    </div>

                    <div className="flex items-center gap-3 pt-1 border-t border-purple-800/30 text-[11px]">
                      {activeEtapasList.map((et, idx) => {
                        const tasa = seccionData?.etapas[et.key]?.tasaLogroPorActuacion[act.order] ?? 0;
                        const colorCfg = getEvaluacionColor(et.key, idx);

                        return (
                          <span key={`dr-et-${act.order}-${et.key}`} className="inline-flex items-center gap-1 font-mono">
                            <span className="w-2 h-2 rounded-full" style={{ backgroundColor: colorCfg.border }} />
                            <span className="text-purple-300 font-semibold">{et.key.toUpperCase()}:</span>
                            <strong className="text-white font-bold">{tasa}%</strong>
                          </span>
                        );
                      })}
                    </div>
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
