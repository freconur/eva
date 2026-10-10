import React, { useMemo, useRef, useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import {
  RiBuilding4Line,
  RiCalendarLine,
  RiGraduationCapLine,
  RiBookOpenLine,
  RiTimeLine,
  RiShieldCheckLine,
  RiLayoutRowLine,
  RiLayoutGridLine,
  RiLoader4Line,
  RiImageAddLine,
  RiImageEditLine,
  RiDeleteBin7Line,
  RiEdit2Line,
  RiCloseLine,
  RiCheckLine,
  RiRestartLine,
  RiHeading,
  RiFileTextLine,
  RiEyeLine,
  RiSparklingLine,
} from 'react-icons/ri';
import { getMonthName } from '@/fuctions/dates';

export type EvaluacionesBannerVariant = 'compact' | 'expanded';

export type HeroBannerColorTheme =
  | 'blue'
  | 'teal'
  | 'purple'
  | 'indigo'
  | 'emerald'
  | 'amber'
  | 'rose';

export interface HeroBannerMetricItem {
  id?: string;
  label: string;
  value: number | string;
  icon?: React.ComponentType<{ className?: string }>;
  colorTheme?: HeroBannerColorTheme;
  tooltip?: string;
  /** Etiqueta de estado o categoría (visible en modo expandido) */
  badgeText?: string;
  /** Subtítulo explicativo contextual (visible en modo expandido) */
  helperText?: string;
}

export interface EvaluacionesHeroBannerProps {
  /** Variante visual del banner: 'compact' (horizontal compacta) o 'expanded' (hero amplio con tarjetas KPI). Default: 'compact' */
  variant?: EvaluacionesBannerVariant;

  /** Imagen de fondo opcional (URL o base64) */
  backgroundImage?: string | null;
  /** Opacidad de la imagen de fondo (de 0 a 1). Default: 0.25 */
  backgroundImageOpacity?: number;

  /** Permite mostrar el interruptor de vista si está en modo auditoría / administración */
  isAuditing?: boolean;
  /** Callback al cambiar la variante */
  onVariantChange?: (newVariant: EvaluacionesBannerVariant) => void;
  /** Estado de guardado de la variante en Firestore */
  isSavingVariant?: boolean;
  /** Forzar mostrar el selector de variante independientemente de isAuditing */
  showVariantSwitch?: boolean;

  /** Callback para subir imagen de fondo (se comprime a <= 100 KB) */
  onUploadBackgroundImage?: (file: File) => Promise<string | null>;
  /** Callback para eliminar imagen de fondo */
  onRemoveBackgroundImage?: () => Promise<void>;
  /** Estado de carga/compresión de la imagen de fondo */
  isUploadingImage?: boolean;

  /** Título principal del banner. Default: "GESTIÓN DE EVALUACIONES" */
  title?: string;
  /** Subtítulo institucional o pedagógico. Default: "Supervisión directiva de pruebas diagnósticas y logros de aprendizaje" */
  subtitle?: string;
  /** Título personalizado almacenado en base de datos */
  customTitle?: string | null;
  /** Subtítulo personalizado almacenado en base de datos */
  customSubtitle?: string | null;
  /** Callback para actualizar título y subtítulo en Firestore */
  onUpdateTexts?: (title: string, subtitle: string) => Promise<boolean | void>;
  /** Callback para restablecer título y subtítulo por defecto en Firestore */
  onResetTexts?: () => Promise<boolean | void>;
  /** Estado de guardado de los textos */
  isSavingTexts?: boolean;
  /** Badge temático opcional sobre el título en la vista expandida (ej: "Panel de Monitoreo") */
  badgeTema?: string;

  /** Nombre de la Institución Educativa o Colegio */
  colegio?: string;
  /** Alias para colegio (ej: UGEL, Red, Entidad) */
  institucion?: string;
  /** Ícono institucional personalizado. Default: RiBuilding4Line */
  institucionIcon?: React.ComponentType<{ className?: string }>;
  /** Año escolar seleccionado */
  selectedYear?: number;
  /** Mes seleccionado (ej: "3", "all") */
  selectedMonth?: string | number;
  /** Texto personalizado para el periodo (anula el formato por defecto de Año/Mes) */
  periodoLabel?: string;
  /** Badges adicionales en la barra contextual superior */
  extraBadges?: React.ReactNode;
  /** Acciones o controles adicionales (botones, exportación, etc.) */
  actions?: React.ReactNode;

  /** Lista dinámica de métricas tipo cápsula o tarjeta */
  metrics?: HeroBannerMetricItem[];

  /** Atajos numéricos para métricas estándar (retrocompatibilidad) */
  totalEvaluaciones?: number;
  totalActivas?: number;
  totalCerradas?: number;
  totalGrados?: number;
  /** Etiqueta personalizada para totalGrados (default: "Grados", ej: "Secciones", "Aulas") */
  gradosLabel?: string;

  /** Clases CSS adicionales */
  className?: string;
}

const COLOR_THEMES: Record<
  HeroBannerColorTheme,
  {
    iconBg: string;
    labelColor: string;
    cardBorder: string;
    badgeBg: string;
  }
> = {
  blue: {
    iconBg: 'bg-blue-400/20 border-blue-300/30 text-blue-200',
    labelColor: 'text-blue-200/80',
    cardBorder: 'hover:border-blue-400/40',
    badgeBg: 'bg-blue-400/15 text-blue-200 border-blue-300/25',
  },
  teal: {
    iconBg: 'bg-teal-400/20 border-teal-300/30 text-teal-200',
    labelColor: 'text-teal-200/80',
    cardBorder: 'hover:border-teal-400/40',
    badgeBg: 'bg-teal-400/15 text-teal-200 border-teal-300/25',
  },
  purple: {
    iconBg: 'bg-purple-400/20 border-purple-300/30 text-purple-200',
    labelColor: 'text-purple-200/80',
    cardBorder: 'hover:border-purple-400/40',
    badgeBg: 'bg-purple-400/15 text-purple-200 border-purple-300/25',
  },
  indigo: {
    iconBg: 'bg-indigo-400/20 border-indigo-300/30 text-indigo-200',
    labelColor: 'text-indigo-200/80',
    cardBorder: 'hover:border-indigo-400/40',
    badgeBg: 'bg-indigo-400/15 text-indigo-200 border-indigo-300/25',
  },
  emerald: {
    iconBg: 'bg-emerald-400/20 border-emerald-300/30 text-emerald-200',
    labelColor: 'text-emerald-200/80',
    cardBorder: 'hover:border-emerald-400/40',
    badgeBg: 'bg-emerald-400/15 text-emerald-200 border-emerald-300/25',
  },
  amber: {
    iconBg: 'bg-amber-400/20 border-amber-300/30 text-amber-200',
    labelColor: 'text-amber-200/80',
    cardBorder: 'hover:border-amber-400/40',
    badgeBg: 'bg-amber-400/15 text-amber-200 border-amber-300/25',
  },
  rose: {
    iconBg: 'bg-rose-400/20 border-rose-300/30 text-rose-200',
    labelColor: 'text-rose-200/80',
    cardBorder: 'hover:border-rose-400/40',
    badgeBg: 'bg-rose-400/15 text-rose-200 border-rose-300/25',
  },
};

export const EvaluacionesHeroBanner: React.FC<EvaluacionesHeroBannerProps> = ({
  variant = 'compact',
  backgroundImage,
  backgroundImageOpacity = 0.25,
  isAuditing = false,
  onVariantChange,
  isSavingVariant = false,
  showVariantSwitch = false,
  onUploadBackgroundImage,
  onRemoveBackgroundImage,
  isUploadingImage = false,
  title = 'GESTIÓN DE EVALUACIONES',
  subtitle = 'Supervisión directiva de pruebas diagnósticas y logros de aprendizaje',
  customTitle,
  customSubtitle,
  onUpdateTexts,
  onResetTexts,
  isSavingTexts = false,
  badgeTema,
  colegio,
  institucion,
  institucionIcon: InstitucionIcon = RiBuilding4Line,
  selectedYear,
  selectedMonth,
  periodoLabel,
  extraBadges,
  actions,
  metrics,
  totalEvaluaciones,
  totalActivas,
  totalCerradas,
  totalGrados,
  gradosLabel = 'Grados',
  className = '',
}) => {
  const institucionNombre = colegio || institucion;
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // Textos efectivos (prioridad: personalizado de Firestore > valor por prop > valor por defecto)
  const displayTitle =
    customTitle !== null && customTitle !== undefined && customTitle.trim() !== ''
      ? customTitle
      : title;
  const displaySubtitle =
    customSubtitle !== null && customSubtitle !== undefined
      ? customSubtitle
      : subtitle;

  // Estado del Modal de Edición de Textos
  const [isEditingTextsModalOpen, setIsEditingTextsModalOpen] = useState(false);
  const [tempTitle, setTempTitle] = useState('');
  const [tempSubtitle, setTempSubtitle] = useState('');
  const [portalContainer, setPortalContainer] = useState<Element | null>(null);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      setPortalContainer(document.getElementById('portal-modal') || document.body);
    }
  }, []);

  const handleOpenEditModal = () => {
    setTempTitle(displayTitle);
    setTempSubtitle(displaySubtitle || '');
    setIsEditingTextsModalOpen(true);
  };

  const handleSaveTexts = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!tempTitle.trim() && !tempSubtitle.trim()) return;
    if (onUpdateTexts) {
      await onUpdateTexts(tempTitle, tempSubtitle);
      setIsEditingTextsModalOpen(false);
    }
  };

  const handleResetTexts = async () => {
    if (onResetTexts) {
      await onResetTexts();
      setIsEditingTextsModalOpen(false);
    }
  };

  const mesNombre = useMemo(() => {
    if (!selectedMonth || selectedMonth === 'all') return null;
    const num = Number(selectedMonth);
    return !isNaN(num) ? getMonthName(num) : null;
  }, [selectedMonth]);

  const textoPeriodo = useMemo(() => {
    if (periodoLabel) return periodoLabel;
    if (!selectedYear) return null;
    return `Año Escolar ${selectedYear}${mesNombre ? ` • ${mesNombre}` : ''}`;
  }, [periodoLabel, selectedYear, mesNombre]);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && onUploadBackgroundImage) {
      onUploadBackgroundImage(file);
      e.target.value = '';
    }
  };

  // Lista consolidada de métricas
  const activeMetrics = useMemo<HeroBannerMetricItem[]>(() => {
    if (metrics && metrics.length > 0) {
      return metrics;
    }

    const built: HeroBannerMetricItem[] = [];

    if (totalEvaluaciones !== undefined) {
      built.push({
        id: 'evaluaciones',
        label: 'Pruebas',
        value: totalEvaluaciones,
        icon: RiBookOpenLine,
        colorTheme: 'blue',
        tooltip: `${totalEvaluaciones} evaluaciones programadas en el periodo`,
        badgeText: 'Periodo',
        helperText: 'Evaluaciones registradas',
      });
    }

    if (totalActivas !== undefined) {
      built.push({
        id: 'activas',
        label: 'Activas',
        value: totalActivas,
        icon: RiTimeLine,
        colorTheme: 'teal',
        tooltip: `${totalActivas} evaluaciones activas disponibles para rendición`,
        badgeText: 'En curso',
        helperText: 'Disponibles para rendición',
      });
    }

    if (totalCerradas !== undefined) {
      built.push({
        id: 'cerradas',
        label: 'Cerradas',
        value: totalCerradas,
        icon: RiShieldCheckLine,
        colorTheme: 'purple',
        tooltip: `${totalCerradas} evaluaciones finalizadas y consolidadas`,
        badgeText: 'Concluidas',
        helperText: 'Resultados consolidados',
      });
    }

    if (totalGrados !== undefined) {
      built.push({
        id: 'grados',
        label: gradosLabel,
        value: totalGrados,
        icon: RiGraduationCapLine,
        colorTheme: 'indigo',
        tooltip: `${totalGrados} ${gradosLabel.toLowerCase()} con evaluaciones registradas`,
        badgeText: 'Alcance',
        helperText: `Niveles con evaluación`,
      });
    }

    return built;
  }, [
    metrics,
    totalEvaluaciones,
    totalActivas,
    totalCerradas,
    totalGrados,
    gradosLabel,
  ]);

  // Componente interno para el Selector de Auditoría e Imagen
  const renderAuditControls = () => {
    const canAudit = isAuditing || showVariantSwitch;
    if (!canAudit) return null;

    return (
      <div
        className="inline-flex items-center gap-1.5 p-1 bg-black/40 backdrop-blur-md rounded-xl border border-white/20 shadow-xs shrink-0 flex-wrap"
        role="group"
        aria-label="Control de vista de banner para auditoría"
      >
        {/* Badge de Identificación de Auditor */}
        <div
          className="inline-flex items-center gap-1 pl-1.5 pr-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-amber-300 border-r border-white/15"
          title="Modo auditoría: la configuración seleccionada se guardará para todos los usuarios de esta ruta"
        >
          <RiShieldCheckLine className="w-3.5 h-3.5 text-amber-300 shrink-0" />
          <span className="hidden sm:inline">Auditoría</span>
        </div>

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
              title="Vista Grande: Diseño hero amplio con tarjetas KPI destacadas"
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
              <span className="hidden md:inline">
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
                className="inline-flex items-center p-1 rounded-lg text-rose-300 hover:text-rose-100 hover:bg-rose-500/25 transition-all duration-150 cursor-pointer border border-rose-300/30"
                title="Eliminar imagen de fondo y restaurar diseño por defecto"
                aria-label="Eliminar imagen de fondo"
              >
                <RiDeleteBin7Line className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        )}

        {/* Controles de Textos Personalizados */}
        {onUpdateTexts && (
          <div className="inline-flex items-center pl-1 border-l border-white/15">
            <button
              type="button"
              disabled={isUploadingImage || isSavingVariant || isSavingTexts}
              onClick={handleOpenEditModal}
              className={`inline-flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-semibold transition-all duration-150 cursor-pointer ${
                customTitle || customSubtitle
                  ? 'bg-teal-500/25 text-teal-100 border border-teal-400/35 hover:bg-teal-500/35'
                  : 'text-blue-100/80 hover:text-white hover:bg-white/10'
              } ${isSavingTexts ? 'opacity-60 cursor-not-allowed' : ''}`}
              title="Personalizar título y subtítulo institucional del banner"
              aria-label="Personalizar textos del banner"
            >
              {isSavingTexts ? (
                <RiLoader4Line className="w-3.5 h-3.5 animate-spin text-teal-300" />
              ) : (
                <RiEdit2Line className="w-3.5 h-3.5 text-teal-200" />
              )}
              <span className="hidden md:inline">
                {customTitle || customSubtitle ? 'Editar Textos' : 'Textos'}
              </span>
            </button>
          </div>
        )}
      </div>
    );
  };

  // Renderizado del Modal Accesible de Edición de Textos con Portal al Root del DOM
  const renderTextsModal = () => {
    if (!isEditingTextsModalOpen) return null;

    const modalJSX = (
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="banner-text-modal-title"
        className="fixed inset-0 z-[99999] flex items-center justify-center p-4 sm:p-6 bg-slate-900/60 backdrop-blur-sm"
        onKeyDown={(e) => {
          if (e.key === 'Escape' && !isSavingTexts) {
            setIsEditingTextsModalOpen(false);
          }
        }}
      >
        <div
          className="relative w-full max-w-lg bg-white rounded-3xl shadow-2xl border border-slate-200/90 overflow-hidden text-slate-800 transition-all"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Barra superior de acento degradado */}
          <div className="h-1.5 w-full bg-gradient-to-r from-blue-600 via-indigo-600 to-teal-400" />

          {/* Cabecera del Modal */}
          <div className="flex items-start justify-between p-6 pb-4 border-b border-slate-100 bg-slate-50/50">
            <div className="flex items-center gap-3.5">
              <div className="w-11 h-11 rounded-2xl bg-gradient-to-tr from-blue-600 to-indigo-600 text-white flex items-center justify-center shadow-md shadow-blue-500/25 shrink-0">
                <RiEdit2Line className="w-5 h-5" />
              </div>
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-blue-50 text-blue-700 border border-blue-200/60">
                    <RiSparklingLine className="w-3 h-3 text-blue-600" />
                    Configuración Oficial
                  </span>
                </div>
                <h2 id="banner-text-modal-title" className="text-lg sm:text-xl font-extrabold text-slate-900 tracking-tight">
                  Personalizar Textos del Banner
                </h2>
                <p className="text-xs text-slate-500 leading-relaxed mt-0.5">
                  Edita el título y la descripción pedagógica oficial para esta sección.
                </p>
              </div>
            </div>
            <button
              type="button"
              disabled={isSavingTexts}
              onClick={() => setIsEditingTextsModalOpen(false)}
              className="w-8 h-8 rounded-xl flex items-center justify-center text-slate-400 hover:text-slate-700 hover:bg-slate-200/60 transition-colors cursor-pointer border border-transparent hover:border-slate-200 shrink-0"
              aria-label="Cerrar modal"
              title="Cerrar modal (Escape)"
            >
              <RiCloseLine className="w-5 h-5" />
            </button>
          </div>

          {/* Formulario */}
          <form onSubmit={handleSaveTexts} className="p-6 space-y-5">
            {/* Vista Previa en Vivo */}
            <div className="relative rounded-2xl bg-gradient-to-r from-[#071e4a] via-[#0c367a] to-[#163297] text-white p-4 shadow-xs border border-blue-900/40 overflow-hidden">
              <div className="absolute inset-0 opacity-[0.06] bg-[radial-gradient(#ffffff_1.5px,transparent_1.5px)] [background-size:16px_16px] pointer-events-none" />
              <div className="relative z-10 flex flex-col gap-1">
                <div className="flex items-center justify-between text-[10px] font-bold uppercase tracking-wider text-teal-200/90 mb-1">
                  <span className="inline-flex items-center gap-1">
                    <RiEyeLine className="w-3.5 h-3.5 text-teal-300" />
                    <span>Vista Previa en Vivo</span>
                  </span>
                  <span className="text-blue-200/70 font-medium normal-case text-[11px]">
                    Así se verá en pantalla
                  </span>
                </div>
                <h3 className="text-base sm:text-lg font-bold tracking-tight text-white line-clamp-1">
                  {tempTitle.trim() || 'GESTIÓN DE EVALUACIONES'}
                </h3>
                <p className="text-xs text-blue-100/80 line-clamp-2 leading-relaxed">
                  {tempSubtitle.trim() || 'Supervisión directiva de pruebas diagnósticas y logros de aprendizaje'}
                </p>
              </div>
            </div>

            {/* Campo Título Principal */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label htmlFor="banner-modal-title" className="flex items-center gap-1.5 text-xs font-bold text-slate-700 uppercase tracking-wider">
                  <RiHeading className="w-3.5 h-3.5 text-colorSegundo" />
                  <span>Título Principal</span>
                </label>
                <span className="text-[11px] font-medium text-slate-400">
                  {tempTitle.length} caracteres
                </span>
              </div>
              <input
                id="banner-modal-title"
                type="text"
                autoFocus
                disabled={isSavingTexts}
                value={tempTitle}
                onChange={(e) => setTempTitle(e.target.value)}
                placeholder="ej. GESTIÓN DE EVALUACIONES"
                className="w-full min-h-[44px] px-4 py-2.5 bg-slate-50/70 hover:bg-white focus:bg-white border border-slate-200 rounded-xl text-sm font-bold text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-colorSegundo/20 focus:border-colorSegundo transition-all shadow-2xs"
              />
            </div>

            {/* Campo Subtítulo Descriptivo */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label htmlFor="banner-modal-subtitle" className="flex items-center gap-1.5 text-xs font-bold text-slate-700 uppercase tracking-wider">
                  <RiFileTextLine className="w-3.5 h-3.5 text-colorSegundo" />
                  <span>Subtítulo Descriptivo</span>
                </label>
                <span className="text-[11px] font-medium text-slate-400">
                  {tempSubtitle.length} caracteres
                </span>
              </div>
              <textarea
                id="banner-modal-subtitle"
                rows={3}
                disabled={isSavingTexts}
                value={tempSubtitle}
                onChange={(e) => setTempSubtitle(e.target.value)}
                placeholder="ej. Supervisión directiva de pruebas diagnósticas y logros de aprendizaje"
                className="w-full px-4 py-2.5 bg-slate-50/70 hover:bg-white focus:bg-white border border-slate-200 rounded-xl text-sm font-medium text-slate-700 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-colorSegundo/20 focus:border-colorSegundo transition-all shadow-2xs resize-none leading-relaxed"
              />
            </div>

            {/* Acciones y Footer del Modal */}
            <div className="flex items-center justify-between pt-4 border-t border-slate-100 mt-6">
              <div className="flex items-center gap-2">
                {(customTitle || customSubtitle) && onResetTexts ? (
                  <button
                    type="button"
                    disabled={isSavingTexts}
                    onClick={handleResetTexts}
                    className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-rose-600 hover:text-rose-700 hover:bg-rose-50 border border-rose-200/70 rounded-xl transition-all cursor-pointer"
                    title="Restablecer textos por defecto"
                  >
                    <RiRestartLine className="w-3.5 h-3.5" />
                    <span>Restablecer</span>
                  </button>
                ) : (
                  <span className="hidden sm:inline-flex items-center gap-1 text-[11px] font-medium text-slate-400">
                    <kbd className="px-1.5 py-0.5 rounded bg-slate-100 border border-slate-200 text-[10px] text-slate-600 font-mono font-semibold">
                      Enter
                    </kbd>{' '}
                    para guardar
                  </span>
                )}
              </div>

              <div className="flex items-center gap-2.5">
                <button
                  type="button"
                  disabled={isSavingTexts}
                  onClick={() => setIsEditingTextsModalOpen(false)}
                  className="min-h-[42px] px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-800 hover:bg-slate-100 rounded-xl transition-colors cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={isSavingTexts || (!tempTitle.trim() && !tempSubtitle.trim())}
                  className="min-h-[42px] inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl font-bold text-xs sm:text-sm text-white bg-colorSegundo hover:bg-colorSegundo/90 active:scale-[0.98] focus:outline-none focus-visible:ring-2 focus-visible:ring-colorSegundo focus-visible:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-150 shadow-md shadow-colorSegundo/25 cursor-pointer"
                >
                  {isSavingTexts ? (
                    <>
                      <RiLoader4Line className="w-4 h-4 animate-spin" />
                      <span>Guardando...</span>
                    </>
                  ) : (
                    <>
                      <RiCheckLine className="w-4 h-4" />
                      <span>Guardar Cambios</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </form>
        </div>
      </div>
    );

    const target =
      portalContainer ||
      (typeof document !== 'undefined'
        ? document.getElementById('portal-modal') || document.body
        : null);

    if (target) {
      return createPortal(modalJSX, target);
    }

    return modalJSX;
  };

  // =========================================================================
  // RENDERIZADO: VARIANTE COMPACTA (La vista horizontal de alta densidad)
  // =========================================================================
  if (variant === 'compact') {
    return (
      <div
        role="banner"
        className={`relative rounded-2xl bg-gradient-to-r from-[#071e4a] via-[#0c367a] to-[#163297] text-white px-4 py-3 sm:px-5 sm:py-3.5 shadow-lg border border-blue-900/40 transition-all duration-300 overflow-hidden ${className}`}
      >
        {/* Capa de efectos decorativos y fondo */}
        <div
          className="absolute inset-0 overflow-hidden rounded-2xl pointer-events-none"
          aria-hidden="true"
        >
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

          {/* Overlay Protector de Contraste (WCAG AA) */}
          {backgroundImage && (
            <div
              className="absolute inset-0 bg-gradient-to-r from-[#071e4a]/90 via-[#0c367a]/85 to-[#163297]/90 pointer-events-none"
              aria-hidden="true"
            />
          )}

          <div className="absolute inset-0 opacity-[0.05] bg-[radial-gradient(#ffffff_1.5px,transparent_1.5px)] [background-size:16px_16px]" />
          <div className="absolute -right-12 -top-12 w-48 h-48 rounded-full bg-blue-400/15 blur-2xl" />
        </div>

        <div className="relative z-10 flex flex-col gap-2 sm:gap-2.5">
          {/* Fila 1 (Superior): Badges Institucionales, Controles de Auditoría y Contexto */}
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="flex flex-wrap items-center gap-1.5 min-w-0">
              {textoPeriodo && (
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-white/10 backdrop-blur-md border border-white/15 text-blue-100 shadow-2xs">
                  <RiCalendarLine className="w-3 h-3 text-teal-200" />
                  <span>{textoPeriodo}</span>
                </span>
              )}

              {institucionNombre && (
                <span
                  className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-white/10 backdrop-blur-md border border-white/15 text-blue-100 shadow-2xs max-w-[320px] truncate"
                  title={institucionNombre}
                >
                  <InstitucionIcon className="w-3 h-3 text-purple-200 shrink-0" />
                  <span className="truncate">{institucionNombre}</span>
                </span>
              )}

              {extraBadges}
            </div>

            <div className="flex items-center gap-2 flex-wrap">
              {renderAuditControls()}
              {actions}
            </div>
          </div>

          {/* Fila 2 (Principal): Título (izq) y Micro-Cápsulas de Métricas (der) */}
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 pt-1 sm:pt-1.5 border-t border-white/10">
            <div className="min-w-0 flex-1 pr-0 lg:pr-4">
              <div className="flex items-center gap-2">
                <h1 className="text-base sm:text-lg lg:text-xl font-bold tracking-tight text-white leading-snug drop-shadow-2xs">
                  {displayTitle}
                </h1>
                {isAuditing && onUpdateTexts && (
                  <button
                    type="button"
                    onClick={handleOpenEditModal}
                    className="p-1 rounded-md text-white/50 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
                    title="Personalizar título y subtítulo"
                    aria-label="Editar título y subtítulo"
                  >
                    <RiEdit2Line className="w-3.5 h-3.5 text-teal-200" />
                  </button>
                )}
              </div>
              {displaySubtitle && (
                <p className="text-xs text-blue-100/75 leading-tight mt-0.5">
                  {displaySubtitle}
                </p>
              )}
            </div>

            {activeMetrics.length > 0 && (
              <div className="grid grid-cols-2 sm:flex sm:items-center gap-1.5 sm:gap-2 shrink-0 flex-wrap">
                {activeMetrics.map((metrica, idx) => {
                  const Icon = metrica.icon;
                  const theme =
                    COLOR_THEMES[metrica.colorTheme || 'blue'] ||
                    COLOR_THEMES.blue;

                  return (
                    <div
                      key={metrica.id || `${metrica.label}-${idx}`}
                      className="bg-white/10 backdrop-blur-md rounded-xl px-2.5 py-1.5 border border-white/15 flex items-center gap-2 shadow-2xs"
                      title={metrica.tooltip}
                    >
                      {Icon && (
                        <div
                          className={`w-6 h-6 rounded-lg border flex items-center justify-center shrink-0 ${theme.iconBg}`}
                        >
                          <Icon className="w-3.5 h-3.5" />
                        </div>
                      )}
                      <div className="min-w-0">
                        <span
                          className={`block text-[10px] uppercase tracking-wider font-semibold leading-none ${theme.labelColor}`}
                        >
                          {metrica.label}
                        </span>
                        <span className="text-xs sm:text-sm font-bold text-white tracking-tight leading-tight mt-0.5 block">
                          {metrica.value}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
        {renderTextsModal()}
      </div>
    );
  }

  // =========================================================================
  // RENDERIZADO: VARIANTE EXPANDIDA (Vista Grande / Hero Amplio con Tarjetas KPI)
  // =========================================================================
  return (
    <div
      role="banner"
      className={`relative rounded-3xl bg-gradient-to-br from-[#05173c] via-[#0a2e6b] to-[#143694] text-white p-5 sm:p-7 lg:p-8 shadow-xl border border-blue-800/40 transition-all duration-300 overflow-hidden ${className}`}
    >
      {/* Capa de efectos decorativos luminosos inmersivos y fondo */}
      <div
        className="absolute inset-0 overflow-hidden rounded-3xl pointer-events-none"
        aria-hidden="true"
      >
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
        {/* Fila 1 (Cabecera Superior): Badges Institucionales y Switcher de Auditoría */}
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-2 min-w-0">
            {textoPeriodo && (
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-white/10 backdrop-blur-md border border-white/15 text-blue-100 shadow-2xs">
                <RiCalendarLine className="w-3.5 h-3.5 text-teal-200" />
                <span>{textoPeriodo}</span>
              </span>
            )}

            {institucionNombre && (
              <span
                className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-white/10 backdrop-blur-md border border-white/15 text-blue-100 shadow-2xs max-w-[360px] truncate"
                title={institucionNombre}
              >
                <InstitucionIcon className="w-3.5 h-3.5 text-purple-200 shrink-0" />
                <span className="truncate">{institucionNombre}</span>
              </span>
            )}

            {extraBadges}
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            {renderAuditControls()}
            {actions}
          </div>
        </div>

        {/* Fila 2: Bloque de Identidad y Presentación Institucional */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="min-w-0 max-w-3xl">
            {badgeTema && (
              <span className="inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full text-[11px] font-bold uppercase tracking-wider bg-blue-500/20 text-blue-200 border border-blue-400/30 mb-2.5">
                {badgeTema}
              </span>
            )}
            <div className="flex items-center gap-2">
              <h1 className="text-xl sm:text-2xl lg:text-3xl font-extrabold tracking-tight text-white leading-tight drop-shadow-sm">
                {displayTitle}
              </h1>
              {isAuditing && onUpdateTexts && (
                <button
                  type="button"
                  onClick={handleOpenEditModal}
                  className="p-1 rounded-md text-white/50 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
                  title="Personalizar título y subtítulo"
                  aria-label="Editar título y subtítulo"
                >
                  <RiEdit2Line className="w-4 h-4 text-teal-200" />
                </button>
              )}
            </div>
            {displaySubtitle && (
              <p className="text-xs sm:text-sm text-blue-100/80 leading-relaxed mt-2 max-w-2xl">
                {displaySubtitle}
              </p>
            )}
          </div>
        </div>

        {/* Fila 3: Grilla de Tarjetas KPI Destacadas (Vista Grande) */}
        {activeMetrics.length > 0 && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4 pt-4 sm:pt-5 border-t border-white/15">
            {activeMetrics.map((metrica, idx) => {
              const Icon = metrica.icon;
              const theme =
                COLOR_THEMES[metrica.colorTheme || 'blue'] || COLOR_THEMES.blue;

              return (
                <div
                  key={metrica.id || `${metrica.label}-${idx}`}
                  className={`relative bg-white/10 hover:bg-white/15 backdrop-blur-md rounded-2xl p-4 sm:p-5 border border-white/15 transition-all duration-200 shadow-xs hover:shadow-md hover:-translate-y-0.5 group ${theme.cardBorder}`}
                  title={metrica.tooltip}
                >
                  <div className="flex items-center justify-between gap-2 mb-3">
                    {Icon && (
                      <div
                        className={`w-10 h-10 rounded-xl border flex items-center justify-center shrink-0 shadow-2xs group-hover:scale-105 transition-transform duration-200 ${theme.iconBg}`}
                      >
                        <Icon className="w-5 h-5" />
                      </div>
                    )}

                    {metrica.badgeText && (
                      <span
                        className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider border ${theme.badgeBg}`}
                      >
                        {metrica.badgeText}
                      </span>
                    )}
                  </div>

                  <div>
                    <span
                      className={`block text-[11px] uppercase tracking-wider font-bold ${theme.labelColor}`}
                    >
                      {metrica.label}
                    </span>
                    <span className="text-2xl sm:text-3xl font-black text-white tracking-tight leading-none mt-1 block">
                      {metrica.value}
                    </span>
                    {metrica.helperText && (
                      <span className="block text-[11px] text-blue-100/70 line-clamp-1 mt-1.5 font-medium">
                        {metrica.helperText}
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
      {renderTextsModal()}
    </div>
  );
};

export default EvaluacionesHeroBanner;
