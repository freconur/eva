import React, { useMemo } from 'react';
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
import { FiltrosState } from './DirectorFiltrosBar';
import DirectorExportMenu from './DirectorExportMenu';
import DirectorLayoutModeSwitch, { DirectorLayoutMode } from './DirectorLayoutModeSwitch';

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
  layoutMode?: DirectorLayoutMode;
  onChangeLayoutMode?: (mode: DirectorLayoutMode) => void;
  totalEstudiantesMatriculados?: number;
  estudiantes?: UserEstudiante[];
  filtros?: FiltrosState;
  hasAnyDirectorAction?: boolean;
  loadingExport?: boolean;
  loadingPDF?: boolean;
  allowExportGrillaPdf?: boolean;
  allowExportExcel?: boolean;
  allowGenerarPdfPreguntas?: boolean;
  imagenesGeneradas?: boolean;
  hasPreguntasConImagenes?: boolean;
  onExport?: (type: 'excel' | 'pdf-tabla' | 'pdf-preguntas') => void;
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
  layoutMode,
  onChangeLayoutMode,
  totalEstudiantesMatriculados = 0,
  estudiantes,
  filtros,
  hasAnyDirectorAction = true,
  loadingExport = false,
  loadingPDF = false,
  allowExportGrillaPdf = true,
  allowExportExcel = true,
  allowGenerarPdfPreguntas = true,
  imagenesGeneradas = false,
  hasPreguntasConImagenes = false,
  onExport,
}) => {
  // Evaluados en el ámbito actual (si hay filtro de sección o género se respeta; los filtros de nivel se aplican a la tabla, no a la participación del examen)
  const evaluadosEnAmbito = useMemo(() => {
    const listaBase = estudiantes && estudiantes.length > 0 ? estudiantes : estudiantesFiltrados;
    if (!filtros?.seccion && !filtros?.genero) {
      return listaBase;
    }
    return listaBase.filter((est) => {
      const matchSeccion =
        !filtros?.seccion ||
        String(est.seccion || '').trim().toLowerCase() === String(filtros.seccion).trim().toLowerCase();
      const matchGenero =
        !filtros?.genero ||
        String(est.genero || '').trim().toLowerCase() === String(filtros.genero).trim().toLowerCase();
      return matchSeccion && matchGenero;
    });
  }, [estudiantes, estudiantesFiltrados, filtros?.seccion, filtros?.genero]);

  const totalEvaluados = evaluadosEnAmbito.length;

  // Pendientes en el ámbito actual (filtrados por sección/género si aplica)
  const pendientesEnAmbito = useMemo(() => {
    if (!estudiantesDeEvaluacion || estudiantesDeEvaluacion.length === 0) return [];
    if (!filtros?.seccion && !filtros?.genero) return estudiantesDeEvaluacion;
    return estudiantesDeEvaluacion.filter((est) => {
      const matchSeccion =
        !filtros?.seccion ||
        String(est.seccion || '').trim().toLowerCase() === String(filtros.seccion).trim().toLowerCase();
      const matchGenero =
        !filtros?.genero ||
        String(est.genero || '').trim().toLowerCase() === String(filtros.genero).trim().toLowerCase();
      return matchSeccion && matchGenero;
    });
  }, [estudiantesDeEvaluacion, filtros?.seccion, filtros?.genero]);

  const totalPendientes = pendientesEnAmbito.length;

  // Total de alumnos matriculados en el ámbito actual (matriculados = evaluados + pendientes)
  const hasFilter = Boolean(filtros?.seccion || filtros?.genero);
  const totalMatriculados = useMemo(() => {
    if (!hasFilter && totalEstudiantesMatriculados > 0) {
      return Math.max(totalEstudiantesMatriculados, totalEvaluados + totalPendientes);
    }
    return totalEvaluados + totalPendientes;
  }, [hasFilter, totalEstudiantesMatriculados, totalEvaluados, totalPendientes]);

  // Cálculo de cobertura real: porcentaje de participación de la evaluación
  const porcentajeCobertura = useMemo(() => {
    if (totalMatriculados <= 0) return 0;
    return Math.min(100, (totalEvaluados / totalMatriculados) * 100);
  }, [totalEvaluados, totalMatriculados]);

  const coberturaTexto = useMemo(() => {
    if (totalMatriculados <= 0) return '0%';
    return porcentajeCobertura % 1 === 0
      ? `${porcentajeCobertura.toFixed(0)}%`
      : `${porcentajeCobertura.toFixed(1)}%`;
  }, [totalMatriculados, porcentajeCobertura]);

  // Título en mayúsculas obligatorio según AGENTS.md
  const tituloEvaluacion = (evaluacion?.nombre || 'EVALUACIÓN INSTITUCIONAL').toUpperCase();
  const gradoTexto = getGradoTexto(evaluacion?.grado);
  const nombreMes = getMonthName(monthSelected);

  return (
    <div className="relative rounded-2xl bg-gradient-to-r from-[#071e4a] via-[#0c367a] to-[#163297] text-white px-4 py-3 sm:px-5 sm:py-3.5 mb-6 shadow-lg border border-blue-900/40">
      {/* Capa de efectos decorativos recortados */}
      <div className="absolute inset-0 overflow-hidden rounded-2xl pointer-events-none" aria-hidden="true">
        {/* Patrón de Malla de Puntos de Fondo Sutil */}
        <div
          className="absolute inset-0 opacity-[0.05] bg-[radial-gradient(#ffffff_1.5px,transparent_1.5px)] [background-size:16px_16px]"
        />

        {/* Orbe de Iluminación Ambiental */}
        <div
          className="absolute -right-12 -top-12 w-48 h-48 rounded-full bg-blue-400/15 blur-2xl"
        />
      </div>

      <div className="relative z-10 flex flex-col gap-2 sm:gap-2.5">
        {/* Fila 1 (Superior): Badges Institucionales (izq) y Acciones Glassmorphism (der) */}
        <div className="flex flex-wrap items-center justify-between gap-2">
          {/* Badges de Contexto Inline */}
          <div className="flex flex-wrap items-center gap-1.5 min-w-0">
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
              <span
                className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-white/10 backdrop-blur-md border border-white/15 text-blue-100 shadow-2xs max-w-[280px] truncate"
                title={colegio}
              >
                <RiBuilding4Line className="w-3 h-3 text-purple-200" />
                <span className="truncate">{colegio}</span>
              </span>
            )}
          </div>

          {/* Acciones Glassmorphism: Exportar Reporte + Conmutador a modo compacto */}
          <div className="flex items-center gap-2 shrink-0 ml-auto">
            {hasAnyDirectorAction && onExport && (
              <DirectorExportMenu
                variant="glass"
                loadingExport={Boolean(loadingExport)}
                loadingPDF={Boolean(loadingPDF)}
                disabled={!estudiantesFiltrados || estudiantesFiltrados.length === 0}
                allowExportGrillaPdf={Boolean(allowExportGrillaPdf)}
                allowExportExcel={Boolean(allowExportExcel)}
                allowGenerarPdfPreguntas={Boolean(allowGenerarPdfPreguntas)}
                imagenesGeneradas={Boolean(imagenesGeneradas)}
                hasPreguntasConImagenes={Boolean(hasPreguntasConImagenes)}
                onExport={onExport}
              />
            )}

            {/* Conmutador de modo de vista Pestañas / Cascada */}
            {onChangeLayoutMode && layoutMode && (
              <DirectorLayoutModeSwitch
                mode={layoutMode}
                onChange={onChangeLayoutMode}
                variant="glass"
              />
            )}

            {/* Botón para contraer a vista compacta */}
            <button
              type="button"
              onClick={onSwitchToCompact}
              className="h-9 sm:h-[38px] px-2.5 sm:px-3 text-xs font-semibold text-white/90 hover:text-white bg-white/10 hover:bg-white/20 active:bg-white/25 rounded-xl border border-white/20 transition-all duration-150 shrink-0 inline-flex items-center gap-1.5 shadow-2xs backdrop-blur-md focus:outline-none focus-visible:ring-2 focus-visible:ring-white/40"
              title="Cambiar a vista compacta tradicional"
              aria-label="Cambiar a vista compacta"
            >
              <RiLayoutTopLine className="w-3.5 h-3.5 text-blue-200" />
              <span className="hidden sm:inline">Compacto</span>
            </button>
          </div>
        </div>

        {/* Fila 2 (Principal): Título Oficial de Evaluación (izq) y Micro-Cápsulas de Métricas (der) */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 pt-1 sm:pt-1.5 border-t border-white/10">
          {/* Título en mayúsculas (.toUpperCase()) y Subtítulo con amplio espacio disponible */}
          <div className="min-w-0 flex-1 pr-0 lg:pr-4">
            <h1 className="text-base sm:text-lg lg:text-xl font-bold tracking-tight text-white leading-snug drop-shadow-2xs">
              {tituloEvaluacion}
            </h1>
            <p className="text-xs text-blue-100/75 leading-tight mt-0.5">
              Monitoreo Directivo • Resultados y Logros de Aprendizaje
            </p>
          </div>

          {/* Micro-Cápsulas de Métricas Glassmorphism */}
          <div className="grid grid-cols-2 sm:flex sm:items-center gap-1.5 sm:gap-2 shrink-0">
            {/* Métrica 1: Alumnos */}
            <div
              className="bg-white/10 backdrop-blur-md rounded-xl px-2.5 py-1.5 border border-white/15 flex items-center gap-2 shadow-2xs"
              title={`${totalEvaluados} estudiantes participaron de ${totalMatriculados} matriculados${
                totalPendientes > 0 ? ` (${totalPendientes} pendientes)` : ''
              }`}
            >
              <div className="w-6 h-6 rounded-lg bg-blue-400/20 border border-blue-300/30 flex items-center justify-center text-blue-200 shrink-0">
                <RiUserHeartLine className="w-3.5 h-3.5" />
              </div>
              <div className="min-w-0">
                <span className="block text-[10px] uppercase tracking-wider font-semibold text-blue-200/80 leading-none">
                  Alumnos
                </span>
                <div className="text-xs sm:text-sm font-bold text-white tracking-tight leading-tight mt-0.5 inline-flex items-baseline">
                  <span>{totalEvaluados}</span>
                  {totalMatriculados > 0 && (
                    <span className="text-[10px] sm:text-xs text-blue-200/80 font-medium">
                      /{totalMatriculados}
                    </span>
                  )}
                </div>
              </div>
            </div>

            {/* Métrica 2: Cobertura */}
            <div
              className="bg-white/10 backdrop-blur-md rounded-xl px-2.5 py-1.5 border border-white/15 flex items-center gap-2 shadow-2xs"
              title={`Cobertura de evaluación: ${coberturaTexto} (${totalEvaluados} de ${totalMatriculados} estudiantes)`}
            >
              <div className="w-6 h-6 rounded-lg bg-emerald-400/20 border border-emerald-300/30 flex items-center justify-center text-emerald-200 shrink-0">
                <RiShieldCheckLine className="w-3.5 h-3.5" />
              </div>
              <div className="min-w-0">
                <span className="block text-[10px] uppercase tracking-wider font-semibold text-emerald-200/80 leading-none">
                  Cobertura
                </span>
                <div className="text-xs sm:text-sm font-bold text-white tracking-tight leading-tight mt-0.5">
                  {coberturaTexto}
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
        </div>
      </div>
    </div>
  );
};

export default DirectorHeroBanner;
