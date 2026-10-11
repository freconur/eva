import React, { useMemo, useRef } from 'react';
import {
  RiSparklingLine,
  RiLayoutTopLine,
  RiLayoutRowLine,
  RiLayoutGridLine,
  RiGraduationCapLine,
  RiCalendarLine,
  RiBuilding4Line,
  RiUserHeartLine,
  RiQuestionAnswerLine,
  RiShieldCheckLine,
  RiAlertLine,
  RiImageAddLine,
  RiImageEditLine,
  RiDeleteBin7Line,
  RiLoader4Line,
} from 'react-icons/ri';
import { Evaluaciones, PreguntasRespuestas, UserEstudiante } from '@/features/types/types';
import { DirectorMetricasResumen } from './types';
import { getGradoTexto } from '@/fuctions/regiones';
import { getMonthName } from '@/fuctions/dates';
import { FiltrosState } from './DirectorFiltrosBar';
import DirectorExportMenu from './DirectorExportMenu';
import DirectorLayoutModeSwitch, { DirectorLayoutMode } from './DirectorLayoutModeSwitch';
import { ReporteBannerVariant } from './useReportesBannerConfig';

export type { ReporteBannerVariant } from './useReportesBannerConfig';

export interface EspecialistaHeroBannerStats {
  participaron: number;
  total: number;
  coberturaPorcentaje?: number;
  totalEstudiantes?: number;
  totalDocentes?: number;
  totalAlertas?: number;
}

export interface DirectorHeroBannerProps {
  evaluacion?: Evaluaciones;
  estudiantesFiltrados?: UserEstudiante[];
  estudiantesDeEvaluacion?: UserEstudiante[];
  preguntasRespuestas?: PreguntasRespuestas[];
  metricasDirector?: DirectorMetricasResumen;
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

  // Extensiones para Especialista y personalización
  role?: 'director' | 'docente' | 'especialista' | 'admin';
  subtitle?: string;
  customActions?: React.ReactNode;
  customMetrics?: React.ReactNode;
  especialistaStats?: EspecialistaHeroBannerStats;

  // Nuevas capacidades: Variante (Grande/Compacta) e Imagen de Fondo
  variant?: ReporteBannerVariant;
  onVariantChange?: (variant: ReporteBannerVariant) => void;
  isSavingVariant?: boolean;
  backgroundImage?: string | null;
  backgroundImageOpacity?: number;
  onUploadBackgroundImage?: (file: File) => Promise<string | null>;
  onRemoveBackgroundImage?: () => Promise<void>;
  isUploadingImage?: boolean;
  canConfigureBanner?: boolean;
}

export const DirectorHeroBanner: React.FC<DirectorHeroBannerProps> = ({
  evaluacion,
  estudiantesFiltrados = [],
  estudiantesDeEvaluacion = [],
  preguntasRespuestas = [],
  metricasDirector,
  monthSelected,
  yearSelected,
  colegio,
  onSwitchToCompact,
  layoutMode,
  onChangeLayoutMode,
  totalEstudiantesMatriculados = 0,
  estudiantes = [],
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
  role = 'director',
  subtitle,
  customActions,
  customMetrics,
  especialistaStats,
  variant = 'compact',
  onVariantChange,
  isSavingVariant = false,
  backgroundImage,
  backgroundImageOpacity = 0.25,
  onUploadBackgroundImage,
  onRemoveBackgroundImage,
  isUploadingImage = false,
  canConfigureBanner = true,
}) => {
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && onUploadBackgroundImage) {
      onUploadBackgroundImage(file);
      e.target.value = '';
    }
  };

  // Evaluados en el ámbito actual
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

  // Pendientes en el ámbito actual
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

  // Total de alumnos matriculados
  const hasFilter = Boolean(filtros?.seccion || filtros?.genero);
  const totalMatriculados = useMemo(() => {
    if (!hasFilter && totalEstudiantesMatriculados > 0) {
      return Math.max(totalEstudiantesMatriculados, totalEvaluados + totalPendientes);
    }
    return totalEvaluados + totalPendientes;
  }, [hasFilter, totalEstudiantesMatriculados, totalEvaluados, totalPendientes]);

  // Cálculo de cobertura
  const porcentajeCobertura = useMemo(() => {
    if (totalMatriculados <= 0) return 0;
    return Math.min(100, (totalEvaluados / totalMatriculados) * 100);
  }, [totalEvaluados, totalMatriculados]);

  const coberturaTexto = useMemo(() => {
    if (especialistaStats) {
      const cob =
        especialistaStats.coberturaPorcentaje !== undefined
          ? especialistaStats.coberturaPorcentaje
          : (especialistaStats.total > 0 ? (especialistaStats.participaron / especialistaStats.total) * 100 : 0);
      return cob % 1 === 0 ? `${cob.toFixed(0)}%` : `${cob.toFixed(1)}%`;
    }
    if (totalMatriculados <= 0) return '0%';
    return porcentajeCobertura % 1 === 0
      ? `${porcentajeCobertura.toFixed(0)}%`
      : `${porcentajeCobertura.toFixed(1)}%`;
  }, [especialistaStats, totalMatriculados, porcentajeCobertura]);

  // Título en mayúsculas obligatorio según AGENTS.md
  const tituloEvaluacion = (evaluacion?.nombre || 'EVALUACIÓN INSTITUCIONAL').toUpperCase();
  const gradoTexto = getGradoTexto(evaluacion?.grado);
  const nombreMes = getMonthName(monthSelected);
  const totalCritico = metricasDirector?.kpis?.totalCritico ?? 0;

  const subtituloTexto =
    subtitle ||
    (role === 'especialista' || role === 'admin'
      ? 'Monitoreo Especialista • Resultados y Logros de Aprendizaje Regional UGEL'
      : 'Monitoreo Directivo • Resultados y Logros de Aprendizaje');

  // Sub-panel de gestión de variante (Grande/Compacta) e Imagen de fondo
  const renderConfigControls = () => {
    if (!canConfigureBanner) return null;
    if (!onVariantChange && !onUploadBackgroundImage) return null;

    return (
      <div
        className="inline-flex items-center gap-1.5 p-1 bg-white/10 backdrop-blur-md rounded-xl border border-white/20 shadow-2xs"
        role="group"
        aria-label="Configuración de diseño del banner"
      >
        {/* Botones de Variante (Compacta / Grande) */}
        {onVariantChange && (
          <div className="inline-flex items-center gap-1">
            <button
              type="button"
              disabled={isSavingVariant || isUploadingImage}
              onClick={() => onVariantChange('compact')}
              className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-semibold transition-all duration-150 cursor-pointer ${
                variant === 'compact'
                  ? 'bg-white text-blue-900 shadow-xs font-bold'
                  : 'text-blue-100/80 hover:text-white hover:bg-white/10'
              } ${isSavingVariant ? 'opacity-60 cursor-not-allowed' : ''}`}
              title="Vista Compacta: Diseño horizontal de alta densidad"
              aria-pressed={variant === 'compact'}
            >
              <RiLayoutRowLine className="w-3.5 h-3.5" />
              <span>Compacta</span>
            </button>

            <button
              type="button"
              disabled={isSavingVariant || isUploadingImage}
              onClick={() => onVariantChange('expanded')}
              className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-semibold transition-all duration-150 cursor-pointer ${
                variant === 'expanded'
                  ? 'bg-white text-blue-900 shadow-xs font-bold'
                  : 'text-blue-100/80 hover:text-white hover:bg-white/10'
              } ${isSavingVariant ? 'opacity-60 cursor-not-allowed' : ''}`}
              title="Vista Grande: Diseño amplio con tarjetas KPI destacadas"
              aria-pressed={variant === 'expanded'}
            >
              <RiLayoutGridLine className="w-3.5 h-3.5" />
              <span>Grande</span>
            </button>

            {isSavingVariant && (
              <RiLoader4Line className="w-3.5 h-3.5 animate-spin text-amber-300 ml-0.5" />
            )}
          </div>
        )}

        {/* Controles de Imagen de Fondo (Subir / Eliminar) */}
        {onUploadBackgroundImage && (
          <div className="inline-flex items-center gap-1 pl-1 border-l border-white/15">
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              data-testid="banner-file-input"
              onChange={handleFileSelect}
            />

            <button
              type="button"
              disabled={isUploadingImage || isSavingVariant}
              onClick={() => fileInputRef.current?.click()}
              className={`inline-flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-semibold transition-all duration-150 cursor-pointer ${
                backgroundImage
                  ? 'bg-blue-500/25 text-blue-100 border border-blue-400/35 hover:bg-blue-500/35'
                  : 'text-blue-100/80 hover:text-white hover:bg-white/10'
              } ${isUploadingImage ? 'opacity-60 cursor-not-allowed' : ''}`}
              title={
                backgroundImage
                  ? 'Cambiar imagen de fondo (se comprime a <= 100 KB)'
                  : 'Subir imagen de fondo institucional (se comprime a <= 100 KB)'
              }
            >
              {isUploadingImage ? (
                <RiLoader4Line className="w-3.5 h-3.5 animate-spin text-amber-300" />
              ) : backgroundImage ? (
                <RiImageEditLine className="w-3.5 h-3.5 text-blue-200" />
              ) : (
                <RiImageAddLine className="w-3.5 h-3.5 text-blue-200" />
              )}
              <span className="hidden sm:inline">
                {isUploadingImage
                  ? 'Comprimiendo...'
                  : backgroundImage
                  ? 'Cambiar Fondo'
                  : 'Fondo'}
              </span>
            </button>

            {backgroundImage && onRemoveBackgroundImage && (
              <button
                type="button"
                disabled={isUploadingImage || isSavingVariant}
                onClick={onRemoveBackgroundImage}
                className="p-1 rounded-lg text-blue-200/80 hover:text-rose-200 hover:bg-rose-500/20 transition-all cursor-pointer"
                title="Eliminar imagen de fondo y restaurar fondo por defecto"
                aria-label="Eliminar imagen de fondo"
              >
                <RiDeleteBin7Line className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        )}
      </div>
    );
  };

  // =========================================================================
  // VARIANTE GRANDE (EXPANDIDA): Hero Amplio con Tarjetas KPI Destacadas
  // =========================================================================
  if (variant === 'expanded') {
    return (
      <div className="relative rounded-3xl bg-gradient-to-br from-[#05173c] via-[#0a2e6b] to-[#143694] text-white p-5 sm:p-7 lg:p-8 mb-6 shadow-xl border border-blue-800/40 transition-all duration-300 overflow-hidden">
        {/* Capa de efectos decorativos y fondo */}
        <div className="absolute inset-0 overflow-hidden rounded-3xl pointer-events-none" aria-hidden="true">
          {/* Imagen de Fondo Opcional */}
          {backgroundImage && (
            <div
              className="absolute inset-0 bg-cover bg-center pointer-events-none transition-opacity duration-500"
              style={{
                backgroundImage: `url(${backgroundImage})`,
                opacity: backgroundImageOpacity,
              }}
              aria-hidden="true"
            />
          )}

          {/* Overlay Protector de Contraste para garantizar legibilidad WCAG AA */}
          {backgroundImage && (
            <div
              className="absolute inset-0 bg-gradient-to-br from-[#05173c]/92 via-[#0a2e6b]/85 to-[#143694]/88 pointer-events-none"
              aria-hidden="true"
            />
          )}

          <div className="absolute inset-0 opacity-[0.06] bg-[radial-gradient(#ffffff_1.5px,transparent_1.5px)] [background-size:20px_20px]" />
          <div className="absolute -right-16 -top-16 w-80 h-80 rounded-full bg-blue-400/20 blur-3xl" />
          <div className="absolute -left-16 -bottom-16 w-72 h-72 rounded-full bg-indigo-500/15 blur-3xl" />
        </div>

        <div className="relative z-10 flex flex-col gap-5 sm:gap-6">
          {/* Fila 1 (Cabecera Superior): Badges Institucionales y Acciones */}
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex flex-wrap items-center gap-2 min-w-0">
              {gradoTexto && (
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-white/10 backdrop-blur-md border border-white/15 text-blue-100 shadow-2xs">
                  <RiGraduationCapLine className="w-3.5 h-3.5 text-blue-200" />
                  <span>{gradoTexto}</span>
                </span>
              )}

              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-white/10 backdrop-blur-md border border-white/15 text-blue-100 shadow-2xs">
                <RiCalendarLine className="w-3.5 h-3.5 text-teal-200" />
                <span>
                  {nombreMes} {yearSelected}
                </span>
              </span>

              {colegio && (
                <span
                  className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-white/10 backdrop-blur-md border border-white/15 text-blue-100 shadow-2xs max-w-[360px] truncate"
                  title={colegio}
                >
                  <RiBuilding4Line className="w-3.5 h-3.5 text-purple-200 shrink-0" />
                  <span className="truncate">{colegio}</span>
                </span>
              )}
            </div>

            {/* Controles de Configuración y Acciones */}
            <div className="flex items-center gap-2 flex-wrap ml-auto">
              {renderConfigControls()}

              {customActions}

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

              {onChangeLayoutMode && layoutMode && (
                <DirectorLayoutModeSwitch
                  mode={layoutMode}
                  onChange={onChangeLayoutMode}
                  variant="glass"
                />
              )}

              <button
                type="button"
                onClick={onSwitchToCompact}
                className="h-9 sm:h-[38px] px-2.5 sm:px-3 text-xs font-semibold text-white/90 hover:text-white bg-white/10 hover:bg-white/20 active:bg-white/25 rounded-xl border border-white/20 transition-all duration-150 shrink-0 inline-flex items-center gap-1.5 shadow-2xs backdrop-blur-md focus:outline-none focus-visible:ring-2 focus-visible:ring-white/40 cursor-pointer"
                title="Cambiar a vista compacta tradicional"
                aria-label="Cambiar a vista compacta"
              >
                <RiLayoutTopLine className="w-3.5 h-3.5 text-blue-200" />
                <span className="hidden sm:inline">Compacto</span>
              </button>
            </div>
          </div>

          {/* Fila 2: Título Oficial de Evaluación Destacado */}
          <div className="min-w-0 max-w-4xl">
            <h1 className="text-xl sm:text-2xl lg:text-3xl font-extrabold tracking-tight text-white leading-tight drop-shadow-sm">
              {tituloEvaluacion}
            </h1>
            <p className="text-xs sm:text-sm text-blue-100/80 leading-relaxed mt-2 max-w-2xl">
              {subtituloTexto}
            </p>
          </div>

          {/* Fila 3: Grilla de Tarjetas KPI Destacadas (Vista Grande) */}
          {customMetrics ? (
            customMetrics
          ) : especialistaStats ? (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4 pt-4 sm:pt-5 border-t border-white/15">
              {/* Tarjeta 1: Instituciones */}
              <div
                className="relative bg-white/10 hover:bg-white/15 backdrop-blur-md rounded-2xl p-4 sm:p-5 border border-white/15 transition-all duration-200 shadow-xs hover:shadow-md hover:-translate-y-0.5 group"
                title={`${especialistaStats.participaron} instituciones de ${especialistaStats.total} registradas participaron`}
              >
                <div className="flex items-center justify-between gap-2 mb-3">
                  <div className="w-10 h-10 rounded-xl border border-blue-300/30 bg-blue-400/20 text-blue-200 flex items-center justify-center shrink-0 shadow-2xs group-hover:scale-105 transition-transform duration-200">
                    <RiBuilding4Line className="w-5 h-5" />
                  </div>
                  <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-blue-400/15 text-blue-200 border border-blue-300/25">
                    Regional
                  </span>
                </div>
                <div>
                  <span className="block text-[11px] uppercase tracking-wider font-bold text-blue-200/80">
                    Instituciones
                  </span>
                  <span className="text-2xl sm:text-3xl font-black text-white tracking-tight leading-none mt-1.5 block">
                    {especialistaStats.participaron}
                    {especialistaStats.total > 0 && (
                      <span className="text-base sm:text-lg text-blue-200/70 font-semibold ml-1">
                        /{especialistaStats.total}
                      </span>
                    )}
                  </span>
                  <span className="block text-[11px] text-blue-100/70 line-clamp-1 mt-1.5 font-medium">
                    Instituciones educativas participantes
                  </span>
                </div>
              </div>

              {/* Tarjeta 2: Cobertura */}
              <div
                className="relative bg-white/10 hover:bg-white/15 backdrop-blur-md rounded-2xl p-4 sm:p-5 border border-white/15 transition-all duration-200 shadow-xs hover:shadow-md hover:-translate-y-0.5 group"
                title={`Cobertura regional: ${coberturaTexto} (${especialistaStats.participaron} de ${especialistaStats.total} instituciones)`}
              >
                <div className="flex items-center justify-between gap-2 mb-3">
                  <div className="w-10 h-10 rounded-xl border border-emerald-300/30 bg-emerald-400/20 text-emerald-200 flex items-center justify-center shrink-0 shadow-2xs group-hover:scale-105 transition-transform duration-200">
                    <RiShieldCheckLine className="w-5 h-5" />
                  </div>
                  <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-emerald-400/15 text-emerald-200 border border-emerald-300/25">
                    {especialistaStats.participaron} de {especialistaStats.total}
                  </span>
                </div>
                <div>
                  <span className="block text-[11px] uppercase tracking-wider font-bold text-emerald-200/80">
                    Cobertura
                  </span>
                  <span className="text-2xl sm:text-3xl font-black text-white tracking-tight leading-none mt-1.5 block">
                    {coberturaTexto}
                  </span>
                  <span className="block text-[11px] text-emerald-100/70 line-clamp-1 mt-1.5 font-medium">
                    Tasa de participación general
                  </span>
                </div>
              </div>

              {/* Tarjeta 3: Alumnos / Docentes */}
              <div
                className="relative bg-white/10 hover:bg-white/15 backdrop-blur-md rounded-2xl p-4 sm:p-5 border border-white/15 transition-all duration-200 shadow-xs hover:shadow-md hover:-translate-y-0.5 group"
                title={
                  especialistaStats.totalEstudiantes
                    ? `${especialistaStats.totalEstudiantes} estudiantes evaluados`
                    : `${especialistaStats.totalDocentes || 0} docentes evaluando`
                }
              >
                <div className="flex items-center justify-between gap-2 mb-3">
                  <div className="w-10 h-10 rounded-xl border border-indigo-300/30 bg-indigo-400/20 text-indigo-200 flex items-center justify-center shrink-0 shadow-2xs group-hover:scale-105 transition-transform duration-200">
                    <RiUserHeartLine className="w-5 h-5" />
                  </div>
                  <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-indigo-400/15 text-indigo-200 border border-indigo-300/25">
                    Evaluados
                  </span>
                </div>
                <div>
                  <span className="block text-[11px] uppercase tracking-wider font-bold text-indigo-200/80">
                    {especialistaStats.totalEstudiantes ? 'Alumnos' : 'Docentes'}
                  </span>
                  <span className="text-2xl sm:text-3xl font-black text-white tracking-tight leading-none mt-1.5 block">
                    {especialistaStats.totalEstudiantes
                      ? especialistaStats.totalEstudiantes.toLocaleString('es-PE')
                      : especialistaStats.totalDocentes || 0}
                  </span>
                  <span className="block text-[11px] text-blue-100/70 line-clamp-1 mt-1.5 font-medium">
                    {especialistaStats.totalEstudiantes
                      ? 'Estudiantes evaluados en la región'
                      : 'Docentes participantes'}
                  </span>
                </div>
              </div>

              {/* Tarjeta 4: Ítems */}
              <div
                className="relative bg-white/10 hover:bg-white/15 backdrop-blur-md rounded-2xl p-4 sm:p-5 border border-white/15 transition-all duration-200 shadow-xs hover:shadow-md hover:-translate-y-0.5 group"
                title={`${preguntasRespuestas.length} preguntas en la evaluación`}
              >
                <div className="flex items-center justify-between gap-2 mb-3">
                  <div className="w-10 h-10 rounded-xl border border-purple-300/30 bg-purple-400/20 text-purple-200 flex items-center justify-center shrink-0 shadow-2xs group-hover:scale-105 transition-transform duration-200">
                    <RiQuestionAnswerLine className="w-5 h-5" />
                  </div>
                  <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-purple-400/15 text-purple-200 border border-purple-300/25">
                    Prueba
                  </span>
                </div>
                <div>
                  <span className="block text-[11px] uppercase tracking-wider font-bold text-purple-200/80">
                    Ítems Evaluados
                  </span>
                  <span className="text-2xl sm:text-3xl font-black text-white tracking-tight leading-none mt-1.5 block">
                    {preguntasRespuestas.length}
                  </span>
                  <span className="block text-[11px] text-purple-100/70 line-clamp-1 mt-1.5 font-medium">
                    Preguntas pedagógicas formuladas
                  </span>
                </div>
              </div>
            </div>
          ) : metricasDirector ? (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4 pt-4 sm:pt-5 border-t border-white/15">
              {/* Tarjeta 1: Alumnos */}
              <div
                className="relative bg-white/10 hover:bg-white/15 backdrop-blur-md rounded-2xl p-4 sm:p-5 border border-white/15 transition-all duration-200 shadow-xs hover:shadow-md hover:-translate-y-0.5 group"
                title={`${totalEvaluados} estudiantes participaron de ${totalMatriculados} matriculados`}
              >
                <div className="flex items-center justify-between gap-2 mb-3">
                  <div className="w-10 h-10 rounded-xl border border-blue-300/30 bg-blue-400/20 text-blue-200 flex items-center justify-center shrink-0 shadow-2xs group-hover:scale-105 transition-transform duration-200">
                    <RiUserHeartLine className="w-5 h-5" />
                  </div>
                  <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-blue-400/15 text-blue-200 border border-blue-300/25">
                    {totalPendientes > 0 ? `${totalPendientes} pendientes` : 'Completado'}
                  </span>
                </div>
                <div>
                  <span className="block text-[11px] uppercase tracking-wider font-bold text-blue-200/80">
                    Alumnos
                  </span>
                  <span className="text-2xl sm:text-3xl font-black text-white tracking-tight leading-none mt-1.5 block">
                    {totalEvaluados}
                    {totalMatriculados > 0 && (
                      <span className="text-base sm:text-lg text-blue-200/70 font-semibold ml-1">
                        /{totalMatriculados}
                      </span>
                    )}
                  </span>
                  <span className="block text-[11px] text-blue-100/70 line-clamp-1 mt-1.5 font-medium">
                    Estudiantes participantes
                  </span>
                </div>
              </div>

              {/* Tarjeta 2: Cobertura */}
              <div
                className="relative bg-white/10 hover:bg-white/15 backdrop-blur-md rounded-2xl p-4 sm:p-5 border border-white/15 transition-all duration-200 shadow-xs hover:shadow-md hover:-translate-y-0.5 group"
                title={`Cobertura de evaluación: ${coberturaTexto}`}
              >
                <div className="flex items-center justify-between gap-2 mb-3">
                  <div className="w-10 h-10 rounded-xl border border-emerald-300/30 bg-emerald-400/20 text-emerald-200 flex items-center justify-center shrink-0 shadow-2xs group-hover:scale-105 transition-transform duration-200">
                    <RiShieldCheckLine className="w-5 h-5" />
                  </div>
                  <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-emerald-400/15 text-emerald-200 border border-emerald-300/25">
                    {totalEvaluados} de {totalMatriculados}
                  </span>
                </div>
                <div>
                  <span className="block text-[11px] uppercase tracking-wider font-bold text-emerald-200/80">
                    Cobertura
                  </span>
                  <span className="text-2xl sm:text-3xl font-black text-white tracking-tight leading-none mt-1.5 block">
                    {coberturaTexto}
                  </span>
                  <span className="block text-[11px] text-emerald-100/70 line-clamp-1 mt-1.5 font-medium">
                    Tasa de participación de examen
                  </span>
                </div>
              </div>

              {/* Tarjeta 3: Ítems */}
              <div
                className="relative bg-white/10 hover:bg-white/15 backdrop-blur-md rounded-2xl p-4 sm:p-5 border border-white/15 transition-all duration-200 shadow-xs hover:shadow-md hover:-translate-y-0.5 group"
                title={`${preguntasRespuestas.length} preguntas en la evaluación`}
              >
                <div className="flex items-center justify-between gap-2 mb-3">
                  <div className="w-10 h-10 rounded-xl border border-purple-300/30 bg-purple-400/20 text-purple-200 flex items-center justify-center shrink-0 shadow-2xs group-hover:scale-105 transition-transform duration-200">
                    <RiQuestionAnswerLine className="w-5 h-5" />
                  </div>
                  <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-purple-400/15 text-purple-200 border border-purple-300/25">
                    Ítems
                  </span>
                </div>
                <div>
                  <span className="block text-[11px] uppercase tracking-wider font-bold text-purple-200/80">
                    Preguntas
                  </span>
                  <span className="text-2xl sm:text-3xl font-black text-white tracking-tight leading-none mt-1.5 block">
                    {preguntasRespuestas.length}
                  </span>
                  <span className="block text-[11px] text-purple-100/70 line-clamp-1 mt-1.5 font-medium">
                    Preguntas pedagógicas evaluadas
                  </span>
                </div>
              </div>

              {/* Tarjeta 4: Alertas */}
              <div
                className="relative bg-white/10 hover:bg-white/15 backdrop-blur-md rounded-2xl p-4 sm:p-5 border border-white/15 transition-all duration-200 shadow-xs hover:shadow-md hover:-translate-y-0.5 group"
                title={`Alertas críticas: ${totalCritico}`}
              >
                <div className="flex items-center justify-between gap-2 mb-3">
                  <div
                    className={`w-10 h-10 rounded-xl border flex items-center justify-center shrink-0 shadow-2xs group-hover:scale-105 transition-transform duration-200 ${
                      totalCritico > 0
                        ? 'border-rose-300/40 bg-rose-400/25 text-rose-200'
                        : 'border-teal-300/30 bg-teal-400/20 text-teal-200'
                    }`}
                  >
                    <RiAlertLine className="w-5 h-5" />
                  </div>
                  <span
                    className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider border ${
                      totalCritico > 0
                        ? 'bg-rose-400/15 text-rose-200 border-rose-300/25'
                        : 'bg-teal-400/15 text-teal-200 border-teal-300/25'
                    }`}
                  >
                    {totalCritico > 0 ? 'Crítico' : 'Estable'}
                  </span>
                </div>
                <div>
                  <span className="block text-[11px] uppercase tracking-wider font-bold text-blue-200/80">
                    Alertas
                  </span>
                  <span className="text-2xl sm:text-3xl font-black text-white tracking-tight leading-none mt-1.5 block">
                    {totalCritico}
                  </span>
                  <span className="block text-[11px] text-blue-100/70 line-clamp-1 mt-1.5 font-medium">
                    {totalCritico > 0
                      ? 'Competencias con rezago crítico'
                      : 'Sin rezago crítico detectado'}
                  </span>
                </div>
              </div>
            </div>
          ) : null}
        </div>
      </div>
    );
  }

  // =========================================================================
  // VARIANTE COMPACTA (Por Defecto): Horizontal de Alta Densidad
  // =========================================================================
  return (
    <div className="relative rounded-2xl bg-gradient-to-r from-[#071e4a] via-[#0c367a] to-[#163297] text-white px-4 py-3 sm:px-5 sm:py-3.5 mb-6 shadow-lg border border-blue-900/40 transition-all duration-300 overflow-hidden">
      {/* Capa de efectos decorativos y fondo */}
      <div className="absolute inset-0 overflow-hidden rounded-2xl pointer-events-none" aria-hidden="true">
        {/* Imagen de Fondo Opcional */}
        {backgroundImage && (
          <div
            className="absolute inset-0 bg-cover bg-center pointer-events-none transition-opacity duration-500"
            style={{
              backgroundImage: `url(${backgroundImage})`,
              opacity: backgroundImageOpacity,
            }}
            aria-hidden="true"
          />
        )}

        {/* Overlay Protector de Contraste para garantizar legibilidad WCAG AA */}
        {backgroundImage && (
          <div
            className="absolute inset-0 bg-gradient-to-r from-[#071e4a]/90 via-[#0c367a]/85 to-[#163297]/90 pointer-events-none"
            aria-hidden="true"
          />
        )}

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

          {/* Acciones Glassmorphism: Configuración de Banner + Exportar Reporte + Conmutador a modo compacto */}
          <div className="flex items-center gap-2 shrink-0 ml-auto flex-wrap">
            {renderConfigControls()}

            {customActions}

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
              className="h-9 sm:h-[38px] px-2.5 sm:px-3 text-xs font-semibold text-white/90 hover:text-white bg-white/10 hover:bg-white/20 active:bg-white/25 rounded-xl border border-white/20 transition-all duration-150 shrink-0 inline-flex items-center gap-1.5 shadow-2xs backdrop-blur-md focus:outline-none focus-visible:ring-2 focus-visible:ring-white/40 cursor-pointer"
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
              {subtituloTexto}
            </p>
          </div>

          {/* Micro-Cápsulas de Métricas Glassmorphism */}
          {customMetrics ? (
            customMetrics
          ) : especialistaStats ? (
            <div className="grid grid-cols-2 sm:flex sm:items-center gap-1.5 sm:gap-2 shrink-0">
              {/* Métrica 1: Instituciones */}
              <div
                className="bg-white/10 backdrop-blur-md rounded-xl px-2.5 py-1.5 border border-white/15 flex items-center gap-2 shadow-2xs"
                title={`${especialistaStats.participaron} instituciones de ${especialistaStats.total} registradas participaron`}
              >
                <div className="w-6 h-6 rounded-lg bg-blue-400/20 border border-blue-300/30 flex items-center justify-center text-blue-200 shrink-0">
                  <RiBuilding4Line className="w-3.5 h-3.5" />
                </div>
                <div className="min-w-0">
                  <span className="block text-[10px] uppercase tracking-wider font-semibold text-blue-200/80 leading-none">
                    Instituciones
                  </span>
                  <div className="text-xs sm:text-sm font-bold text-white tracking-tight leading-tight mt-0.5 inline-flex items-baseline">
                    <span>{especialistaStats.participaron}</span>
                    {especialistaStats.total > 0 && (
                      <span className="text-[10px] sm:text-xs text-blue-200/80 font-medium">
                        /{especialistaStats.total}
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {/* Métrica 2: Cobertura */}
              <div
                className="bg-white/10 backdrop-blur-md rounded-xl px-2.5 py-1.5 border border-white/15 flex items-center gap-2 shadow-2xs"
                title={`Cobertura regional: ${coberturaTexto} (${especialistaStats.participaron} de ${especialistaStats.total} instituciones)`}
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

              {/* Métrica 3: Alumnos / Docentes */}
              <div
                className="bg-white/10 backdrop-blur-md rounded-xl px-2.5 py-1.5 border border-white/15 flex items-center gap-2 shadow-2xs"
                title={
                  especialistaStats.totalEstudiantes
                    ? `${especialistaStats.totalEstudiantes} estudiantes evaluados`
                    : `${especialistaStats.totalDocentes || 0} docentes evaluando`
                }
              >
                <div className="w-6 h-6 rounded-lg bg-indigo-400/20 border border-indigo-300/30 flex items-center justify-center text-indigo-200 shrink-0">
                  <RiUserHeartLine className="w-3.5 h-3.5" />
                </div>
                <div className="min-w-0">
                  <span className="block text-[10px] uppercase tracking-wider font-semibold text-blue-200/80 leading-none">
                    {especialistaStats.totalEstudiantes ? 'Alumnos' : 'Docentes'}
                  </span>
                  <div className="text-xs sm:text-sm font-bold text-white tracking-tight leading-tight mt-0.5">
                    {especialistaStats.totalEstudiantes
                      ? especialistaStats.totalEstudiantes.toLocaleString('es-PE')
                      : especialistaStats.totalDocentes || 0}
                  </div>
                </div>
              </div>

              {/* Métrica 4: Ítems */}
              <div
                className="bg-white/10 backdrop-blur-md rounded-xl px-2.5 py-1.5 border border-white/15 flex items-center gap-2 shadow-2xs"
                title={`${preguntasRespuestas.length} preguntas en la evaluación`}
              >
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
            </div>
          ) : metricasDirector ? (
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
              <div
                className="bg-white/10 backdrop-blur-md rounded-xl px-2.5 py-1.5 border border-white/15 flex items-center gap-2 shadow-2xs"
                title={`${preguntasRespuestas.length} preguntas en la evaluación`}
              >
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
              <div
                className="bg-white/10 backdrop-blur-md rounded-xl px-2.5 py-1.5 border border-white/15 flex items-center gap-2 shadow-2xs"
                title={`Alertas críticas: ${totalCritico}`}
              >
                <div
                  className={`w-6 h-6 rounded-lg border flex items-center justify-center shrink-0 ${
                    totalCritico > 0
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
                    {totalCritico}
                  </div>
                </div>
              </div>
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
};

export const ReporteHeroBanner = DirectorHeroBanner;
export default DirectorHeroBanner;
