import React, { useMemo, useRef } from 'react';
import Link from 'next/link';
import {
  RiLayoutTopLine,
  RiLayoutRowLine,
  RiLayoutGridLine,
  RiCalendarLine,
  RiBuilding4Line,
  RiUserHeartLine,
  RiQuestionAnswerLine,
  RiShieldCheckLine,
  RiImageAddLine,
  RiImageEditLine,
  RiDeleteBin7Line,
  RiLoader4Line,
  RiGraduationCapLine,
  RiBarChartGroupedLine,
} from 'react-icons/ri';
import { MdArrowBack } from 'react-icons/md';
import DirectorLayoutModeSwitch, { DirectorLayoutMode } from '../director/DirectorLayoutModeSwitch';
import { ReporteBannerVariant } from '../director/useReportesBannerConfig';
import { getMonthName } from '@/fuctions/dates';
import { useGlobalContext } from '@/features/context/GlolbalContext';

export type { ReporteBannerVariant } from '../director/useReportesBannerConfig';

export interface DocentesReporteHeroBannerProps {
  /** Nombre o título de la evaluación (se formateará en MAYÚSCULAS) */
  tituloEvaluacion?: string;
  /** Subtítulo descriptivo */
  subtitulo?: string;
  /** Rol activo: 'director' | 'especialista' | 'admin' */
  role?: 'director' | 'especialista' | 'admin' | string;
  /** Etiqueta de ámbito (ej: "Evaluación Docente") */
  ambitoTexto?: string;
  /** Nombre de la Institución Educativa o UGEL */
  colegio?: string;
  /** Región o UGEL */
  regionTexto?: string;
  /** Mes escolar seleccionado (número 0-11, 1-12 o string) */
  mes?: number | string;
  /** Mes seleccionado alias */
  monthSelected?: number;
  /** Año seleccionado */
  anio?: number | string;
  /** Año seleccionado alias */
  yearSelected?: number;
  /** Texto de fecha explícito */
  fechaTexto?: string;

  /** Cantidad de docentes evaluados */
  docentesEvaluados?: number;
  /** Total de docentes en el padrón de la I.E. */
  totalDocentesPadron?: number;
  /** Cobertura porcentual (auto-calculada si no se provee) */
  coberturaPorcentaje?: number;
  /** Total de criterios / ítems pedagógicos evaluados */
  totalCriterios?: number;
  /** Total de dominios / competencias evaluadas */
  totalDominios?: number;

  /** Para especialista / admin: instituciones participantes */
  institucionesParticipantes?: number;
  totalInstituciones?: number;

  /** Modo de diseño de secciones: 'tabs' (pestañas) | 'cascade' (cascada vertical continua) */
  layoutMode?: DirectorLayoutMode;
  onChangeLayoutMode?: (mode: DirectorLayoutMode) => void;

  /** Variante visual del banner: 'compact' (horizontal compacta) | 'expanded' (grande destacada) */
  variant?: ReporteBannerVariant;
  onVariantChange?: (variant: ReporteBannerVariant) => void;
  isSavingVariant?: boolean;

  /** Imagen de fondo institucional y opacidad */
  backgroundImage?: string | null;
  backgroundImageOpacity?: number;
  onUploadBackgroundImage?: (file: File) => Promise<string | null>;
  onRemoveBackgroundImage?: () => Promise<void>;
  isUploadingImage?: boolean;

  /** Si el usuario actual tiene permisos para configurar la vista o imagen */
  canConfigureBanner?: boolean;

  /** Permiso explícito de administrador para alternar variantes y configuración */
  isAdmin?: boolean;

  /** Enlace para volver a la pantalla de la evaluación */
  backHref?: string;

  /** Botón para contraer a vista compacta */
  onSwitchToCompact?: () => void;

  /** Acciones personalizadas adicionales */
  customActions?: React.ReactNode;
}

/**
 * DocentesReporteHeroBanner
 *
 * Banner Hero modular y estilizado con Glassmorphism para los reportes de Desempeño
 * y Acompañamiento Docente (Directores, Especialistas y Administradores).
 *
 * Cumple con todas las normas del sistema EVA:
 * - Título oficial en mayúsculas (.toUpperCase()).
 * - Soporte para variantes "Grande" (Expanded) y "Compacta" (Compact).
 * - Carga y eliminación de imagen de fondo institucional persistente en Firestore.
 * - Conmutador ergonómico integrado de modo Pestañas / Cascada.
 * - Botón de retorno "Volver" con Glassmorphism accesible.
 * - 4 Tarjetas KPI adaptadas a Docentes: Docentes Evaluados, Cobertura, Criterios y Dominios.
 */
export const DocentesReporteHeroBanner: React.FC<DocentesReporteHeroBannerProps> = ({
  tituloEvaluacion = 'EVALUACIÓN DEL DESEMPEÑO DOCENTE',
  subtitulo,
  role = 'director',
  ambitoTexto,
  colegio = 'Institución Educativa',
  regionTexto,
  mes,
  monthSelected,
  anio,
  yearSelected,
  fechaTexto,
  docentesEvaluados = 0,
  totalDocentesPadron = 0,
  coberturaPorcentaje,
  totalCriterios = 0,
  totalDominios = 0,
  institucionesParticipantes = 0,
  totalInstituciones = 14,
  layoutMode,
  onChangeLayoutMode,
  variant = 'expanded',
  onVariantChange,
  isSavingVariant = false,
  backgroundImage,
  backgroundImageOpacity = 0.25,
  onUploadBackgroundImage,
  onRemoveBackgroundImage,
  isUploadingImage = false,
  canConfigureBanner = true,
  isAdmin: propIsAdmin,
  backHref,
  onSwitchToCompact,
  customActions,
}) => {
  const { currentUserData } = useGlobalContext();

  const isUserAdmin = useMemo(() => {
    if (typeof propIsAdmin === 'boolean') return propIsAdmin;
    return (
      role === 'admin' ||
      currentUserData?.rol === 4 ||
      currentUserData?.rol === 0 ||
      currentUserData?.perfil?.rol === 4 ||
      currentUserData?.perfil?.rol === 0 ||
      Number(currentUserData?.rol) === 4 ||
      Number(currentUserData?.rol) === 0
    );
  }, [propIsAdmin, role, currentUserData]);

  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && onUploadBackgroundImage) {
      onUploadBackgroundImage(file);
      e.target.value = '';
    }
  };

  const isDirectorRole = role === 'director';

  // Fecha formateada (Mes y Año)
  const fechaDisplay = useMemo(() => {
    if (fechaTexto) return fechaTexto;
    if (typeof mes === 'string' && isNaN(Number(mes))) {
      const yearVal = anio || yearSelected || new Date().getFullYear();
      return `${mes} ${yearVal}`;
    }
    const m =
      mes !== undefined
        ? Number(mes)
        : monthSelected !== undefined
        ? Number(monthSelected)
        : new Date().getMonth();
    const normalizedMonth = m >= 1 && m <= 12 ? m - 1 : m;
    const mesNombre = getMonthName(normalizedMonth) || 'Octubre';
    const yearVal = anio || yearSelected || new Date().getFullYear();
    return `${mesNombre} ${yearVal}`;
  }, [fechaTexto, mes, monthSelected, anio, yearSelected]);

  // Cálculo de cobertura
  const coberturaTexto = useMemo(() => {
    if (coberturaPorcentaje !== undefined) {
      return coberturaPorcentaje % 1 === 0
        ? `${coberturaPorcentaje.toFixed(0)}%`
        : `${coberturaPorcentaje.toFixed(1)}%`;
    }
    if (isDirectorRole) {
      if (totalDocentesPadron > 0) {
        const cob = Math.min(100, (docentesEvaluados / totalDocentesPadron) * 100);
        return cob % 1 === 0 ? `${cob.toFixed(0)}%` : `${cob.toFixed(1)}%`;
      }
      return docentesEvaluados > 0 ? '100%' : '0%';
    } else {
      if (totalInstituciones > 0) {
        const cob = Math.min(100, (institucionesParticipantes / totalInstituciones) * 100);
        return cob % 1 === 0 ? `${cob.toFixed(0)}%` : `${cob.toFixed(1)}%`;
      }
      return '0%';
    }
  }, [
    coberturaPorcentaje,
    isDirectorRole,
    totalDocentesPadron,
    docentesEvaluados,
    totalInstituciones,
    institucionesParticipantes,
  ]);

  // Título oficial garantizado en mayúsculas (.toUpperCase())
  const tituloFormateado = (tituloEvaluacion || 'EVALUACIÓN DEL DESEMPEÑO DOCENTE').toUpperCase();

  // Subtítulo por defecto según rol
  const subtituloEfectivo =
    subtitulo ||
    (isDirectorRole
      ? 'Monitoreo Directivo • Resultados y Logros de Desempeño Docente'
      : 'Monitoreo Pedagógico • Resultados de Evaluación Docente en Instituciones Educativas');

  // Ámbito por defecto
  const ambitoEfectivo = ambitoTexto || (isDirectorRole ? 'Evaluación Docente' : 'Especialistas UGEL');

  // Sub-panel de controles de configuración: Variante (Grande/Compacta) e Imagen de Fondo
  const renderConfigControls = () => {
    if (!canConfigureBanner) return null;

    const showVariantSwitch = isUserAdmin && Boolean(onVariantChange);
    const showBackgroundControls = Boolean(onUploadBackgroundImage);

    if (!showVariantSwitch && !showBackgroundControls) return null;

    return (
      <div
        className="inline-flex items-center gap-1.5 p-1 bg-white/10 backdrop-blur-md rounded-xl border border-white/20 shadow-2xs"
        role="group"
        aria-label="Configuración de diseño del banner"
      >
        {/* Conmutador de Variante (Compacta / Grande) - Solo Administrador */}
        {showVariantSwitch && (
          <div className="inline-flex items-center gap-1">
            <button
              type="button"
              disabled={isSavingVariant || isUploadingImage}
              onClick={() => onVariantChange?.('compact')}
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
              onClick={() => onVariantChange?.('expanded')}
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
        {showBackgroundControls && (
          <div className={`inline-flex items-center gap-1 ${showVariantSwitch ? 'pl-1 border-l border-white/15' : ''}`}>
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
                  ? 'Cambiar imagen de fondo institucional (se comprime a <= 100 KB)'
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
  // VARIANTE GRANDE (EXPANDIDA): Hero Amplio con 4 Tarjetas KPI Destacadas
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
              {backHref && (
                <Link
                  href={backHref}
                  className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-white/10 hover:bg-white/20 text-blue-100 hover:text-white backdrop-blur-md border border-white/15 shadow-2xs transition-all cursor-pointer"
                  title="Volver a la evaluación"
                  aria-label="Volver a la evaluación"
                >
                  <MdArrowBack className="w-3.5 h-3.5 text-blue-200" />
                  <span>Volver</span>
                </Link>
              )}

              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-white/10 backdrop-blur-md border border-white/15 text-blue-100 shadow-2xs">
                <RiGraduationCapLine className="w-3.5 h-3.5 text-blue-200" />
                <span>{ambitoEfectivo}</span>
              </span>

              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-white/10 backdrop-blur-md border border-white/15 text-blue-100 shadow-2xs">
                <RiCalendarLine className="w-3.5 h-3.5 text-teal-200" />
                <span>{fechaDisplay}</span>
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

              {regionTexto && regionTexto !== colegio && (
                <span
                  className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-white/10 backdrop-blur-md border border-white/15 text-blue-100 shadow-2xs max-w-[280px] truncate"
                  title={regionTexto}
                >
                  <span className="truncate">{regionTexto}</span>
                </span>
              )}
            </div>

            {/* Controles de Configuración y Acciones */}
            <div className="flex items-center gap-2 flex-wrap ml-auto">
              {renderConfigControls()}

              {customActions}

              {onChangeLayoutMode && layoutMode && (
                <DirectorLayoutModeSwitch
                  mode={layoutMode}
                  onChange={onChangeLayoutMode}
                  variant="glass"
                />
              )}

              {isUserAdmin && onSwitchToCompact && (
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
              )}
            </div>
          </div>

          {/* Fila 2: Título Oficial de Evaluación Destacado */}
          <div className="min-w-0 max-w-4xl">
            <h1 className="text-xl sm:text-2xl lg:text-3xl font-extrabold tracking-tight text-white leading-tight drop-shadow-sm">
              {tituloFormateado}
            </h1>
            <p className="text-xs sm:text-sm text-blue-100/80 leading-relaxed mt-2 max-w-2xl">
              {subtituloEfectivo}
            </p>
          </div>

          {/* Fila 3: Grilla de Tarjetas KPI Destacadas (Vista Grande) */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4 pt-4 sm:pt-5 border-t border-white/15">
            {isDirectorRole ? (
              <>
                {/* Tarjeta 1: Docentes Evaluados */}
                <div
                  className="relative bg-white/10 hover:bg-white/15 backdrop-blur-md rounded-2xl p-4 sm:p-5 border border-white/15 transition-all duration-200 shadow-xs hover:shadow-md hover:-translate-y-0.5 group"
                  title={`${docentesEvaluados} docentes evaluados en la I.E.`}
                >
                  <div className="flex items-center justify-between gap-2 mb-3">
                    <div className="w-10 h-10 rounded-xl border border-blue-300/30 bg-blue-400/20 text-blue-200 flex items-center justify-center shrink-0 shadow-2xs group-hover:scale-105 transition-transform duration-200">
                      <RiUserHeartLine className="w-5 h-5" />
                    </div>
                    <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-blue-400/15 text-blue-200 border border-blue-300/25">
                      Evaluados
                    </span>
                  </div>
                  <div>
                    <span className="block text-[11px] uppercase tracking-wider font-bold text-blue-200/80">
                      Docentes Evaluados
                    </span>
                    <span className="text-2xl sm:text-3xl font-black text-white tracking-tight leading-none mt-1.5 block">
                      {docentesEvaluados}
                      {totalDocentesPadron > 0 && (
                        <span className="text-base sm:text-lg text-blue-200/70 font-semibold ml-1">
                          /{totalDocentesPadron}
                        </span>
                      )}
                    </span>
                    <span className="block text-[11px] text-blue-100/70 line-clamp-1 mt-1.5 font-medium">
                      Docentes evaluados de la I.E.
                    </span>
                  </div>
                </div>

                {/* Tarjeta 2: Cobertura Institucional */}
                <div
                  className="relative bg-white/10 hover:bg-white/15 backdrop-blur-md rounded-2xl p-4 sm:p-5 border border-white/15 transition-all duration-200 shadow-xs hover:shadow-md hover:-translate-y-0.5 group"
                  title={`Cobertura institucional: ${coberturaTexto}`}
                >
                  <div className="flex items-center justify-between gap-2 mb-3">
                    <div className="w-10 h-10 rounded-xl border border-emerald-300/30 bg-emerald-400/20 text-emerald-200 flex items-center justify-center shrink-0 shadow-2xs group-hover:scale-105 transition-transform duration-200">
                      <RiShieldCheckLine className="w-5 h-5" />
                    </div>
                    <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-emerald-400/15 text-emerald-200 border border-emerald-300/25">
                      {totalDocentesPadron > 0
                        ? `${docentesEvaluados} de ${totalDocentesPadron}`
                        : `${docentesEvaluados} docentes`}
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
                      Tasa de avance docente
                    </span>
                  </div>
                </div>

                {/* Tarjeta 3: Criterios / Ítems Evaluados */}
                <div
                  className="relative bg-white/10 hover:bg-white/15 backdrop-blur-md rounded-2xl p-4 sm:p-5 border border-white/15 transition-all duration-200 shadow-xs hover:shadow-md hover:-translate-y-0.5 group"
                  title={`${totalCriterios} criterios e indicadores evaluados`}
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
                      Criterios Evaluados
                    </span>
                    <span className="text-2xl sm:text-3xl font-black text-white tracking-tight leading-none mt-1.5 block">
                      {totalCriterios}
                    </span>
                    <span className="block text-[11px] text-purple-100/70 line-clamp-1 mt-1.5 font-medium">
                      Criterios pedagógicos evaluados
                    </span>
                  </div>
                </div>

                {/* Tarjeta 4: Dominios Pedagógicos */}
                <div
                  className="relative bg-white/10 hover:bg-white/15 backdrop-blur-md rounded-2xl p-4 sm:p-5 border border-white/15 transition-all duration-200 shadow-xs hover:shadow-md hover:-translate-y-0.5 group"
                  title={`${totalDominios} dominios o competencias de aula`}
                >
                  <div className="flex items-center justify-between gap-2 mb-3">
                    <div className="w-10 h-10 rounded-xl border border-amber-300/30 bg-amber-400/20 text-amber-200 flex items-center justify-center shrink-0 shadow-2xs group-hover:scale-105 transition-transform duration-200">
                      <RiBarChartGroupedLine className="w-5 h-5" />
                    </div>
                    <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-amber-400/15 text-amber-200 border border-amber-300/25">
                      Dominios
                    </span>
                  </div>
                  <div>
                    <span className="block text-[11px] uppercase tracking-wider font-bold text-amber-200/80">
                      Dominios de Aula
                    </span>
                    <span className="text-2xl sm:text-3xl font-black text-white tracking-tight leading-none mt-1.5 block">
                      {totalDominios}
                    </span>
                    <span className="block text-[11px] text-amber-100/70 line-clamp-1 mt-1.5 font-medium">
                      Competencias y áreas pedagógicas
                    </span>
                  </div>
                </div>
              </>
            ) : (
              <>
                {/* Tarjeta 1 Especialista: Instituciones */}
                <div
                  className="relative bg-white/10 hover:bg-white/15 backdrop-blur-md rounded-2xl p-4 sm:p-5 border border-white/15 transition-all duration-200 shadow-xs hover:shadow-md hover:-translate-y-0.5 group"
                  title={`${institucionesParticipantes} de ${totalInstituciones} instituciones participantes`}
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
                      {institucionesParticipantes}
                      {totalInstituciones > 0 && (
                        <span className="text-base sm:text-lg text-blue-200/70 font-semibold ml-1">
                          /{totalInstituciones}
                        </span>
                      )}
                    </span>
                    <span className="block text-[11px] text-blue-100/70 line-clamp-1 mt-1.5 font-medium">
                      Instituciones educativas participantes
                    </span>
                  </div>
                </div>

                {/* Tarjeta 2 Especialista: Cobertura */}
                <div
                  className="relative bg-white/10 hover:bg-white/15 backdrop-blur-md rounded-2xl p-4 sm:p-5 border border-white/15 transition-all duration-200 shadow-xs hover:shadow-md hover:-translate-y-0.5 group"
                  title={`Cobertura territorial: ${coberturaTexto}`}
                >
                  <div className="flex items-center justify-between gap-2 mb-3">
                    <div className="w-10 h-10 rounded-xl border border-emerald-300/30 bg-emerald-400/20 text-emerald-200 flex items-center justify-center shrink-0 shadow-2xs group-hover:scale-105 transition-transform duration-200">
                      <RiShieldCheckLine className="w-5 h-5" />
                    </div>
                    <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-emerald-400/15 text-emerald-200 border border-emerald-300/25">
                      {institucionesParticipantes} de {totalInstituciones}
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
                      Tasa de cobertura territorial
                    </span>
                  </div>
                </div>

                {/* Tarjeta 3 Especialista: Docentes */}
                <div
                  className="relative bg-white/10 hover:bg-white/15 backdrop-blur-md rounded-2xl p-4 sm:p-5 border border-white/15 transition-all duration-200 shadow-xs hover:shadow-md hover:-translate-y-0.5 group"
                  title={`${docentesEvaluados} docentes evaluados`}
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
                      Docentes
                    </span>
                    <span className="text-2xl sm:text-3xl font-black text-white tracking-tight leading-none mt-1.5 block">
                      {docentesEvaluados.toLocaleString('es-PE')}
                    </span>
                    <span className="block text-[11px] text-blue-100/70 line-clamp-1 mt-1.5 font-medium">
                      Docentes evaluados en la región
                    </span>
                  </div>
                </div>

                {/* Tarjeta 4 Especialista: Criterios */}
                <div
                  className="relative bg-white/10 hover:bg-white/15 backdrop-blur-md rounded-2xl p-4 sm:p-5 border border-white/15 transition-all duration-200 shadow-xs hover:shadow-md hover:-translate-y-0.5 group"
                  title={`${totalCriterios} criterios e indicadores evaluados`}
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
                      Criterios Evaluados
                    </span>
                    <span className="text-2xl sm:text-3xl font-black text-white tracking-tight leading-none mt-1.5 block">
                      {totalCriterios}
                    </span>
                    <span className="block text-[11px] text-purple-100/70 line-clamp-1 mt-1.5 font-medium">
                      Criterios pedagógicos evaluados
                    </span>
                  </div>
                </div>
              </>
            )}
          </div>
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
        <div className="absolute inset-0 opacity-[0.05] bg-[radial-gradient(#ffffff_1.5px,transparent_1.5px)] [background-size:16px_16px]" />

        {/* Orbe de Iluminación Ambiental */}
        <div className="absolute -right-12 -top-12 w-48 h-48 rounded-full bg-blue-400/15 blur-2xl" />
      </div>

      <div className="relative z-10 flex flex-col gap-2 sm:gap-2.5">
        {/* Fila 1 (Superior): Badges Institucionales (izq) y Acciones Glassmorphism (der) */}
        <div className="flex flex-wrap items-center justify-between gap-2">
          {/* Badges de Contexto Inline */}
          <div className="flex flex-wrap items-center gap-1.5 min-w-0">
            {backHref && (
              <Link
                href={backHref}
                className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-white/10 hover:bg-white/20 text-blue-100 hover:text-white backdrop-blur-md border border-white/15 shadow-2xs transition-all cursor-pointer"
                title="Volver a la evaluación"
                aria-label="Volver a la evaluación"
              >
                <MdArrowBack className="w-3 h-3 text-blue-200" />
                <span>Volver</span>
              </Link>
            )}

            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-white/10 backdrop-blur-md border border-white/15 text-blue-100 shadow-2xs">
              <RiGraduationCapLine className="w-3 h-3 text-blue-200" />
              <span>{ambitoEfectivo}</span>
            </span>

            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-white/10 backdrop-blur-md border border-white/15 text-blue-100 shadow-2xs">
              <RiCalendarLine className="w-3 h-3 text-teal-200" />
              <span>{fechaDisplay}</span>
            </span>

            {colegio && (
              <span
                className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-white/10 backdrop-blur-md border border-white/15 text-blue-100 shadow-2xs max-w-[280px] truncate"
                title={colegio}
              >
                <RiBuilding4Line className="w-3 h-3 text-purple-200 shrink-0" />
                <span className="truncate">{colegio}</span>
              </span>
            )}

            {regionTexto && regionTexto !== colegio && (
              <span
                className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold bg-white/10 backdrop-blur-md border border-white/15 text-blue-100 shadow-2xs max-w-[200px] truncate"
                title={regionTexto}
              >
                <span className="truncate">{regionTexto}</span>
              </span>
            )}
          </div>

          {/* Acciones Glassmorphism: Configuración + Switch Pestañas/Cascada + Modo Compacto + Volver */}
          <div className="flex items-center gap-2 shrink-0 ml-auto flex-wrap">
            {renderConfigControls()}

            {customActions}

            {/* Conmutador de modo de vista Pestañas / Cascada */}
            {onChangeLayoutMode && layoutMode && (
              <DirectorLayoutModeSwitch
                mode={layoutMode}
                onChange={onChangeLayoutMode}
                variant="glass"
              />
            )}

            {/* Botón para contraer a vista compacta */}
            {isUserAdmin && onSwitchToCompact && (
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
            )}
          </div>
        </div>

        {/* Fila 2 (Principal): Título Oficial de Evaluación (izq) y Micro-Cápsulas de Métricas (der) */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 pt-1 sm:pt-1.5 border-t border-white/10">
          {/* Título en mayúsculas (.toUpperCase()) y Subtítulo */}
          <div className="min-w-0 flex-1 pr-0 lg:pr-4">
            <h1 className="text-base sm:text-lg lg:text-xl font-bold tracking-tight text-white leading-snug drop-shadow-2xs">
              {tituloFormateado}
            </h1>
            <p className="text-xs text-blue-100/75 leading-tight mt-0.5">
              {subtituloEfectivo}
            </p>
          </div>

          {/* Micro-Cápsulas de Métricas Glassmorphism */}
          <div className="grid grid-cols-2 sm:flex sm:items-center gap-1.5 sm:gap-2 shrink-0">
            {isDirectorRole ? (
              <>
                {/* Métrica 1: Docentes */}
                <div
                  className="bg-white/10 backdrop-blur-md rounded-xl px-2.5 py-1.5 border border-white/15 flex items-center gap-2 shadow-2xs"
                  title={`${docentesEvaluados} docentes evaluados en la I.E.`}
                >
                  <div className="w-6 h-6 rounded-lg bg-blue-400/20 border border-blue-300/30 flex items-center justify-center text-blue-200 shrink-0">
                    <RiUserHeartLine className="w-3.5 h-3.5" />
                  </div>
                  <div className="min-w-0">
                    <span className="block text-[10px] uppercase tracking-wider font-semibold text-blue-200/80 leading-none">
                      Docentes
                    </span>
                    <div className="text-xs sm:text-sm font-bold text-white tracking-tight leading-tight mt-0.5 inline-flex items-baseline">
                      <span>{docentesEvaluados}</span>
                      {totalDocentesPadron > 0 && (
                        <span className="text-[10px] sm:text-xs text-blue-200/80 font-medium">
                          /{totalDocentesPadron}
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Métrica 2: Cobertura */}
                <div
                  className="bg-white/10 backdrop-blur-md rounded-xl px-2.5 py-1.5 border border-white/15 flex items-center gap-2 shadow-2xs"
                  title={`Cobertura institucional: ${coberturaTexto}`}
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

                {/* Métrica 3: Criterios */}
                <div
                  className="bg-white/10 backdrop-blur-md rounded-xl px-2.5 py-1.5 border border-white/15 flex items-center gap-2 shadow-2xs"
                  title={`${totalCriterios} criterios pedagógicos evaluados`}
                >
                  <div className="w-6 h-6 rounded-lg bg-purple-400/20 border border-purple-300/30 flex items-center justify-center text-purple-200 shrink-0">
                    <RiQuestionAnswerLine className="w-3.5 h-3.5" />
                  </div>
                  <div className="min-w-0">
                    <span className="block text-[10px] uppercase tracking-wider font-semibold text-purple-200/80 leading-none">
                      Criterios
                    </span>
                    <div className="text-xs sm:text-sm font-bold text-white tracking-tight leading-tight mt-0.5">
                      {totalCriterios}
                    </div>
                  </div>
                </div>

                {/* Métrica 4: Dominios */}
                <div
                  className="bg-white/10 backdrop-blur-md rounded-xl px-2.5 py-1.5 border border-white/15 flex items-center gap-2 shadow-2xs"
                  title={`${totalDominios} dominios o competencias de aula`}
                >
                  <div className="w-6 h-6 rounded-lg bg-amber-400/20 border border-amber-300/30 flex items-center justify-center text-amber-200 shrink-0">
                    <RiBarChartGroupedLine className="w-3.5 h-3.5" />
                  </div>
                  <div className="min-w-0">
                    <span className="block text-[10px] uppercase tracking-wider font-semibold text-amber-200/80 leading-none">
                      Dominios
                    </span>
                    <div className="text-xs sm:text-sm font-bold text-white tracking-tight leading-tight mt-0.5">
                      {totalDominios}
                    </div>
                  </div>
                </div>
              </>
            ) : (
              <>
                {/* Métrica 1 Especialista: Instituciones */}
                <div
                  className="bg-white/10 backdrop-blur-md rounded-xl px-2.5 py-1.5 border border-white/15 flex items-center gap-2 shadow-2xs"
                  title={`${institucionesParticipantes} de ${totalInstituciones} instituciones participantes`}
                >
                  <div className="w-6 h-6 rounded-lg bg-blue-400/20 border border-blue-300/30 flex items-center justify-center text-blue-200 shrink-0">
                    <RiBuilding4Line className="w-3.5 h-3.5" />
                  </div>
                  <div className="min-w-0">
                    <span className="block text-[10px] uppercase tracking-wider font-semibold text-blue-200/80 leading-none">
                      Instituciones
                    </span>
                    <div className="text-xs sm:text-sm font-bold text-white tracking-tight leading-tight mt-0.5 inline-flex items-baseline">
                      <span>{institucionesParticipantes}</span>
                      {totalInstituciones > 0 && (
                        <span className="text-[10px] sm:text-xs text-blue-200/80 font-medium">
                          /{totalInstituciones}
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Métrica 2 Especialista: Cobertura */}
                <div
                  className="bg-white/10 backdrop-blur-md rounded-xl px-2.5 py-1.5 border border-white/15 flex items-center gap-2 shadow-2xs"
                  title={`Cobertura territorial: ${coberturaTexto}`}
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

                {/* Métrica 3 Especialista: Docentes */}
                <div
                  className="bg-white/10 backdrop-blur-md rounded-xl px-2.5 py-1.5 border border-white/15 flex items-center gap-2 shadow-2xs"
                  title={`${docentesEvaluados} docentes evaluados`}
                >
                  <div className="w-6 h-6 rounded-lg bg-indigo-400/20 border border-indigo-300/30 flex items-center justify-center text-indigo-200 shrink-0">
                    <RiUserHeartLine className="w-3.5 h-3.5" />
                  </div>
                  <div className="min-w-0">
                    <span className="block text-[10px] uppercase tracking-wider font-semibold text-blue-200/80 leading-none">
                      Docentes
                    </span>
                    <div className="text-xs sm:text-sm font-bold text-white tracking-tight leading-tight mt-0.5">
                      {docentesEvaluados.toLocaleString('es-PE')}
                    </div>
                  </div>
                </div>

                {/* Métrica 4 Especialista: Criterios */}
                <div
                  className="bg-white/10 backdrop-blur-md rounded-xl px-2.5 py-1.5 border border-white/15 flex items-center gap-2 shadow-2xs"
                  title={`${totalCriterios} criterios e ítems evaluados`}
                >
                  <div className="w-6 h-6 rounded-lg bg-purple-400/20 border border-purple-300/30 flex items-center justify-center text-purple-200 shrink-0">
                    <RiQuestionAnswerLine className="w-3.5 h-3.5" />
                  </div>
                  <div className="min-w-0">
                    <span className="block text-[10px] uppercase tracking-wider font-semibold text-purple-200/80 leading-none">
                      Criterios
                    </span>
                    <div className="text-xs sm:text-sm font-bold text-white tracking-tight leading-tight mt-0.5">
                      {totalCriterios}
                    </div>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default DocentesReporteHeroBanner;
