import React from 'react';
import {
  RiSparklingLine,
  RiLayoutTopLine,
  RiGraduationCapLine,
  RiCalendarLine,
  RiBuilding4Line,
  RiUserHeartLine,
  RiQuestionAnswerLine,
  RiShieldCheckLine,
  RiAlertLine,
} from 'react-icons/ri';
import { Evaluaciones, PreguntasRespuestas, UserEstudiante } from '@/features/types/types';
import { DirectorMetricasResumen } from './types';
import { getGradoTexto } from '@/fuctions/regiones';
import { getMonthName } from '@/fuctions/dates';

interface DirectorHeroBannerProps {
  evaluacion?: Evaluaciones;
  estudiantesFiltrados: UserEstudiante[];
  estudiantesDeEvaluacion: UserEstudiante[];
  preguntasRespuestas: PreguntasRespuestas[];
  metricasDirector: DirectorMetricasResumen;
  monthSelected: number;
  yearSelected: number;
  colegio?: string;
  onSwitchToCompact: () => void;
}

export const DirectorHeroBanner: React.FC<DirectorHeroBannerProps> = ({
  evaluacion,
  estudiantesFiltrados,
  estudiantesDeEvaluacion,
  preguntasRespuestas,
  metricasDirector,
  monthSelected,
  yearSelected,
  colegio,
  onSwitchToCompact,
}) => {
  // Cálculo de cobertura
  const totalAsignados = estudiantesDeEvaluacion.length;
  const totalEvaluados = estudiantesFiltrados.length;
  const cobertura =
    totalAsignados > 0 ? Math.min(100, Math.round((totalEvaluados / totalAsignados) * 100)) : 100;

  // Título en mayúsculas obligatorio según AGENTS.md
  const tituloEvaluacion = (evaluacion?.nombre || 'EVALUACIÓN INSTITUCIONAL').toUpperCase();
  const gradoTexto = getGradoTexto(evaluacion?.grado);
  const nombreMes = getMonthName(monthSelected);

  return (
    <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-[#071e4a] via-[#0c367a] to-[#163297] text-white px-4 py-3 sm:px-5 sm:py-3.5 mb-4 shadow-lg border border-blue-900/40">
      {/* Patrón de Malla de Puntos de Fondo Sutil */}
      <div
        className="absolute inset-0 opacity-[0.05] pointer-events-none bg-[radial-gradient(#ffffff_1.5px,transparent_1.5px)] [background-size:16px_16px]"
        aria-hidden="true"
      />

      {/* Orbe de Iluminación Ambiental */}
      <div
        className="absolute -right-12 -top-12 w-48 h-48 rounded-full bg-blue-400/15 blur-2xl pointer-events-none"
        aria-hidden="true"
      />

      <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-3 sm:gap-4">
        {/* Izquierda: Badges, Título Oficial y Subtítulo en bloque compacto */}
        <div className="min-w-0 flex-1">
          {/* Badges de Contexto Inline */}
          <div className="flex flex-wrap items-center gap-1.5 mb-1">
            {gradoTexto && (
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-white/10 backdrop-blur-md border border-white/15 text-blue-100 shadow-2xs">
                <RiGraduationCapLine className="w-3 h-3 text-blue-200" />
                <span>{gradoTexto}</span>
              </span>
            )}

            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-white/10 backdrop-blur-md border border-white/15 text-blue-100 shadow-2xs">
              <RiCalendarLine className="w-3 h-3 text-teal-200" />
              <span>
                {nombreMes} {yearSelected}
              </span>
            </span>

            {colegio && (
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-white/10 backdrop-blur-md border border-white/15 text-blue-100 shadow-2xs max-w-[220px] truncate">
                <RiBuilding4Line className="w-3 h-3 text-purple-200" />
                <span className="truncate">{colegio}</span>
              </span>
            )}
          </div>

          {/* Título en mayúsculas (.toUpperCase()) */}
          <h1 className="text-base sm:text-lg font-bold tracking-tight text-white leading-snug truncate drop-shadow-2xs">
            {tituloEvaluacion}
          </h1>
          <p className="text-[11px] text-blue-100/75 leading-tight truncate">
            Monitoreo Directivo • Resultados y Logros de Aprendizaje
          </p>
        </div>

        {/* Derecha: 4 Micro-Cápsulas de Métricas Glassmorphism + Conmutador */}
        <div className="flex items-center justify-between lg:justify-end gap-2.5 shrink-0 pt-2 lg:pt-0 border-t lg:border-t-0 border-white/10">
          <div className="grid grid-cols-2 sm:flex sm:items-center gap-2 w-full sm:w-auto">
            {/* Métrica 1: Alumnos */}
            <div className="bg-white/10 backdrop-blur-md rounded-xl px-2.5 py-1.5 border border-white/15 flex items-center gap-2 shadow-2xs">
              <div className="w-6 h-6 rounded-lg bg-blue-400/20 border border-blue-300/30 flex items-center justify-center text-blue-200 shrink-0">
                <RiUserHeartLine className="w-3.5 h-3.5" />
              </div>
              <div className="min-w-0">
                <span className="block text-[10px] uppercase tracking-wider font-semibold text-blue-200/80 leading-none">
                  Alumnos
                </span>
                <div className="text-xs sm:text-sm font-bold text-white tracking-tight leading-tight mt-0.5">
                  {totalEvaluados}
                  {totalAsignados > 0 && (
                    <span className="text-[10px] text-blue-200/70 font-normal">
                      /{totalAsignados}
                    </span>
                  )}
                </div>
              </div>
            </div>

            {/* Métrica 2: Cobertura */}
            <div className="bg-white/10 backdrop-blur-md rounded-xl px-2.5 py-1.5 border border-white/15 flex items-center gap-2 shadow-2xs">
              <div className="w-6 h-6 rounded-lg bg-emerald-400/20 border border-emerald-300/30 flex items-center justify-center text-emerald-200 shrink-0">
                <RiShieldCheckLine className="w-3.5 h-3.5" />
              </div>
              <div className="min-w-0">
                <span className="block text-[10px] uppercase tracking-wider font-semibold text-emerald-200/80 leading-none">
                  Cobertura
                </span>
                <div className="text-xs sm:text-sm font-bold text-white tracking-tight leading-tight mt-0.5">
                  {cobertura}%
                </div>
              </div>
            </div>

            {/* Métrica 3: Preguntas */}
            <div className="bg-white/10 backdrop-blur-md rounded-xl px-2.5 py-1.5 border border-white/15 flex items-center gap-2 shadow-2xs">
              <div className="w-6 h-6 rounded-lg bg-purple-400/20 border border-purple-300/30 flex items-center justify-center text-purple-200 shrink-0">
                <RiQuestionAnswerLine className="w-3.5 h-3.5" />
              </div>
              <div className="min-w-0">
                <span className="block text-[10px] uppercase tracking-wider font-semibold text-purple-200/80 leading-none">
                  Ítems
                </span>
                <div className="text-xs sm:text-sm font-bold text-white tracking-tight leading-tight mt-0.5">
                  {preguntasRespuestas.length}
                </div>
              </div>
            </div>

            {/* Métrica 4: Alertas */}
            <div className="bg-white/10 backdrop-blur-md rounded-xl px-2.5 py-1.5 border border-white/15 flex items-center gap-2 shadow-2xs">
              <div
                className={`w-6 h-6 rounded-lg border flex items-center justify-center shrink-0 ${
                  metricasDirector.kpis.totalCritico > 0
                    ? 'bg-rose-400/25 border-rose-300/40 text-rose-200'
                    : 'bg-teal-400/20 border-teal-300/30 text-teal-200'
                }`}
              >
                <RiAlertLine className="w-3.5 h-3.5" />
              </div>
              <div className="min-w-0">
                <span className="block text-[10px] uppercase tracking-wider font-semibold text-blue-200/80 leading-none">
                  Alertas
                </span>
                <div className="text-xs sm:text-sm font-bold text-white tracking-tight leading-tight mt-0.5">
                  {metricasDirector.kpis.totalCritico}
                </div>
              </div>
            </div>
          </div>

          {/* Botón para contraer a vista compacta */}
          <button
            type="button"
            onClick={onSwitchToCompact}
            className="flex items-center gap-1 px-2 py-1.5 text-[11px] font-medium text-white/80 hover:text-white bg-black/20 hover:bg-black/35 rounded-lg border border-white/15 transition-all duration-150 shrink-0"
            title="Contraer a vista compacta tradicional"
          >
            <RiLayoutTopLine className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Contraer</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default DirectorHeroBanner;
