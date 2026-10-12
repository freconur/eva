import React, { useState, useEffect, useRef, useMemo } from 'react';
import Link from 'next/link';
import {
  RiCalendarLine,
  RiBuilding4Line,
  RiSparklingLine,
  RiLayoutRowLine,
  RiLayoutGridLine,
  RiLoader4Line,
  RiImageAddLine,
  RiImageEditLine,
  RiDeleteBin7Line,
  RiEditLine,
} from 'react-icons/ri';
import { MdArrowBack } from 'react-icons/md';
import { toast } from 'react-toastify';
import { getFirestore, doc, setDoc } from 'firebase/firestore';
import { ref as storageRef, uploadBytes, getDownloadURL } from 'firebase/storage';
import { storage } from '@/firebase/firebase.config';
import { compressBannerImage } from '@/features/utils/compressBannerImage';
import { useGlobalContext } from '@/features/context/GlolbalContext';
import { ModalEditarTituloDescripcion } from '../modals';

export type BannerVariant = 'compact' | 'expanded';

export type MetricColorTheme =
  | 'blue'
  | 'emerald'
  | 'amber'
  | 'purple'
  | 'rose'
  | 'indigo'
  | 'teal';

export interface HeroBannerMetricItem {
  id?: string;
  label: string;
  value: number | string;
  icon?: React.ComponentType<{ className?: string }>;
  colorTheme?: MetricColorTheme;
  badgeText?: string;
  helperText?: string;
  /** Enlace opcional para navegar al hacer clic en la tarjeta */
  href?: string;
  /** Callback opcional al hacer clic en la tarjeta (ej. para filtrar por estado) */
  onClick?: () => void;
  /** Estado activo resaltado (ej. filtro seleccionado) */
  active?: boolean;
  theme?: {
    iconBg?: string;
    labelColor?: string;
    cardBorder?: string;
    badgeBg?: string;
  };
}

export interface EvaluacionDetalleHeroBannerProps {
  /** ID de la evaluación para persistencia automática de la imagen en Firestore */
  idEvaluacion?: string;
  /** Nombre de la colección en Firestore ('evaluaciones-docentes' | 'evaluaciones-director' | etc.) */
  collectionName?: string;

  /** Ruta para el botón Volver */
  backHref?: string;
  backLabel?: string;

  /** Año escolar mostrado en la cabecera */
  selectedYear?: number;
  /** Institución, UGEL o entidad */
  institucion?: string;
  institucionIcon?: React.ComponentType<{ className?: string }>;
  /** Fase o etapa pedagógica */
  faseNombre?: string;

  /** Categoría / etiqueta superior */
  categoria?: string;
  /** Título principal de la evaluación */
  title: string;
  /** Subtítulo o descripción */
  descripcion?: string;

  /** Grilla de métricas / tarjetas KPI */
  metricas?: HeroBannerMetricItem[];

  /** Botones y controles de la esquina superior derecha (ej: EvaluacionConfigMenu, Botón Reporte) */
  actions?: React.ReactNode;

  /** Permiso de administración para habilitar subida/eliminación de fondo */
  isAdmin?: boolean;
  canUploadBackground?: boolean;

  /** Imagen de fondo actual (URL o base64) */
  backgroundImage?: string | null;
  /** Opacidad de la imagen de fondo (0 a 1). Default: 0.25 */
  backgroundImageOpacity?: number;

  /** Callbacks personalizados de imagen de fondo (opcionales) */
  onUploadBackgroundImage?: (file: File) => Promise<string | null>;
  onRemoveBackgroundImage?: () => Promise<void>;

  /** Permiso para editar título y descripción */
  canEditTitleDescription?: boolean;

  /** Storage key para recordar la variante en localStorage. Default: 'eva_eval_detalle_banner_variant' */
  storageKey?: string;
  /** Variante inicial por defecto. Default: 'expanded' */
  defaultVariant?: BannerVariant;
  /** Callback al alternar la variante */
  onVariantChange?: (variant: BannerVariant) => void;
}

const DEFAULT_COLOR_THEMES: Record<
  MetricColorTheme,
  { iconBg: string; labelColor: string; cardBorder: string; badgeBg: string }
> = {
  blue: {
    iconBg: 'bg-blue-400/20 border-blue-300/30 text-blue-200',
    labelColor: 'text-blue-200/80',
    cardBorder: 'hover:border-blue-400/40',
    badgeBg: 'bg-blue-400/15 text-blue-200 border-blue-300/25',
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
  purple: {
    iconBg: 'bg-purple-400/20 border-purple-300/30 text-purple-200',
    labelColor: 'text-purple-200/80',
    cardBorder: 'hover:border-purple-400/40',
    badgeBg: 'bg-purple-400/15 text-purple-200 border-purple-300/25',
  },
  rose: {
    iconBg: 'bg-rose-400/20 border-rose-300/30 text-rose-200',
    labelColor: 'text-rose-200/80',
    cardBorder: 'hover:border-rose-400/40',
    badgeBg: 'bg-rose-400/15 text-rose-200 border-rose-300/25',
  },
  indigo: {
    iconBg: 'bg-indigo-400/20 border-indigo-300/30 text-indigo-200',
    labelColor: 'text-indigo-200/80',
    cardBorder: 'hover:border-indigo-400/40',
    badgeBg: 'bg-indigo-400/15 text-indigo-200 border-indigo-300/25',
  },
  teal: {
    iconBg: 'bg-teal-400/20 border-teal-300/30 text-teal-200',
    labelColor: 'text-teal-200/80',
    cardBorder: 'hover:border-teal-400/40',
    badgeBg: 'bg-teal-400/15 text-teal-200 border-teal-300/25',
  },
};

const THEME_KEYS: MetricColorTheme[] = ['blue', 'emerald', 'amber', 'purple'];

export const EvaluacionDetalleHeroBanner: React.FC<EvaluacionDetalleHeroBannerProps> = ({
  idEvaluacion,
  collectionName,
  backHref,
  backLabel = 'Volver',
  selectedYear,
  institucion,
  institucionIcon: InstitucionIcon = RiBuilding4Line,
  faseNombre,
  categoria,
  title,
  descripcion,
  metricas = [],
  actions,
  isAdmin: propIsAdmin,
  canUploadBackground,
  canEditTitleDescription,
  backgroundImage: propBgImage,
  backgroundImageOpacity = 0.25,
  onUploadBackgroundImage,
  onRemoveBackgroundImage,
  storageKey = 'eva_eval_detalle_banner_variant',
  defaultVariant = 'expanded',
  onVariantChange,
}) => {
  const { currentUserData } = useGlobalContext();

  const isUserAdmin = useMemo(() => {
    if (typeof propIsAdmin === 'boolean') return propIsAdmin;
    return (
      currentUserData?.rol === 4 ||
      currentUserData?.rol === 0 ||
      currentUserData?.perfil?.rol === 4 ||
      currentUserData?.perfil?.rol === 0 ||
      Number(currentUserData?.rol) === 4 ||
      Number(currentUserData?.rol) === 0
    );
  }, [propIsAdmin, currentUserData]);

  const allowUploadBg = canUploadBackground !== undefined ? canUploadBackground : isUserAdmin;
  const allowEditTitle = canEditTitleDescription !== undefined ? canEditTitleDescription : (isUserAdmin || Boolean(idEvaluacion && collectionName));

  const [isEditModalOpen, setIsEditModalOpen] = useState<boolean>(false);

  // 1. Variante (Compacta / Grande)
  const [variant, setVariant] = useState<BannerVariant>(defaultVariant);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      try {
        const saved = localStorage.getItem(storageKey);
        if (saved === 'compact' || saved === 'expanded') {
          setVariant(saved);
        }
      } catch (e) {
        console.error('Error al leer variante del banner:', e);
      }
    }
  }, [storageKey]);

  const handleToggleVariant = (newVariant: BannerVariant) => {
    setVariant(newVariant);
    if (onVariantChange) onVariantChange(newVariant);
    if (typeof window !== 'undefined') {
      try {
        localStorage.setItem(storageKey, newVariant);
      } catch (e) {
        console.error('Error al guardar variante del banner:', e);
      }
    }
  };

  // 2. Imagen de fondo local y remota
  const [localBgImage, setLocalBgImage] = useState<string | null>(propBgImage || null);
  const [isUploadingImage, setIsUploadingImage] = useState<boolean>(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setLocalBgImage(propBgImage || null);
  }, [propBgImage]);

  const currentBgImage = localBgImage;
  const currentYearNumber = useMemo(() => selectedYear || new Date().getFullYear(), [selectedYear]);

  // 3. Manejador de subida de imagen con compresión estricta a <= 100 KB
  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      toast.warning('Por favor, selecciona un archivo de imagen válido.');
      return;
    }

    setIsUploadingImage(true);
    const toastId = toast.loading('Optimizando y comprimiendo imagen a menos de 100 KB...');

    try {
      if (onUploadBackgroundImage) {
        const uploadedUrl = await onUploadBackgroundImage(file);
        if (uploadedUrl) {
          setLocalBgImage(uploadedUrl);
        }
        toast.update(toastId, {
          render: 'Imagen de fondo actualizada exitosamente.',
          type: 'success',
          isLoading: false,
          autoClose: 3000,
        });
      } else if (idEvaluacion && collectionName) {
        // A. Compresión
        const compressedBlob = await compressBannerImage(file, 100 * 1024);
        const sizeInKb = Math.round(compressedBlob.size / 1024);

        toast.update(toastId, {
          render: `Subiendo imagen optimizada (${sizeInKb} KB)...`,
          isLoading: true,
        });

        // B. Storage o base64 fallback
        let finalImageUrl: string | null = null;
        try {
          const fileName = `banner_${collectionName}_${idEvaluacion}_${Date.now()}.jpg`;
          const sRef = storageRef(storage, `banners/${fileName}`);
          const snapshot = await uploadBytes(sRef, compressedBlob, {
            contentType: 'image/jpeg',
          });
          finalImageUrl = await getDownloadURL(snapshot.ref);
        } catch (storageError) {
          console.warn('Storage falló, guardando como base64 optimizado en Firestore:', storageError);
          finalImageUrl = await new Promise<string>((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = () => resolve(reader.result as string);
            reader.onerror = (err) => reject(err);
            reader.readAsDataURL(compressedBlob);
          });
        }

        // C. Persistencia en Firestore
        const db = getFirestore();
        const evalDocRef = doc(db, collectionName, idEvaluacion);
        await setDoc(
          evalDocRef,
          {
            backgroundImage: finalImageUrl,
            backgroundImageOpacity: backgroundImageOpacity,
            updatedAt: new Date().toISOString(),
          },
          { merge: true }
        );

        setLocalBgImage(finalImageUrl);
        toast.update(toastId, {
          render: `Imagen de fondo optimizada (${sizeInKb} KB) y guardada exitosamente.`,
          type: 'success',
          isLoading: false,
          autoClose: 3000,
        });
      } else {
        toast.update(toastId, {
          render: 'No se configuró destino de persistencia para la imagen de fondo.',
          type: 'warning',
          isLoading: false,
          autoClose: 3500,
        });
      }
    } catch (error: any) {
      console.error('Error al procesar/subir imagen de fondo:', error);
      toast.update(toastId, {
        render: `Error al procesar imagen: ${error?.message || 'Error desconocido'}`,
        type: 'error',
        isLoading: false,
        autoClose: 4000,
      });
    } finally {
      setIsUploadingImage(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  // 4. Manejador para eliminar imagen de fondo
  const handleRemoveImage = async () => {
    if (!window.confirm('¿Deseas eliminar la imagen de fondo y restaurar el estilo por defecto?')) {
      return;
    }

    setIsUploadingImage(true);
    const toastId = toast.loading('Eliminando imagen de fondo...');

    try {
      if (onRemoveBackgroundImage) {
        await onRemoveBackgroundImage();
      } else if (idEvaluacion && collectionName) {
        const db = getFirestore();
        const evalDocRef = doc(db, collectionName, idEvaluacion);
        await setDoc(
          evalDocRef,
          {
            backgroundImage: null,
            updatedAt: new Date().toISOString(),
          },
          { merge: true }
        );
      }
      setLocalBgImage(null);
      toast.update(toastId, {
        render: 'Imagen de fondo eliminada correctamente.',
        type: 'success',
        isLoading: false,
        autoClose: 2500,
      });
    } catch (error: any) {
      console.error('Error al eliminar imagen de fondo:', error);
      toast.update(toastId, {
        render: `Error al eliminar: ${error?.message || 'Error desconocido'}`,
        type: 'error',
        isLoading: false,
        autoClose: 3500,
      });
    } finally {
      setIsUploadingImage(false);
    }
  };

  // 5. Normalizar temas de métricas
  const resolvedMetrics = useMemo(() => {
    return metricas.map((m, idx) => {
      const themeKey = m.colorTheme || THEME_KEYS[idx % THEME_KEYS.length];
      const fallbackTheme = DEFAULT_COLOR_THEMES[themeKey] || DEFAULT_COLOR_THEMES.blue;
      return {
        ...m,
        resolvedTheme: {
          iconBg: m.theme?.iconBg || fallbackTheme.iconBg,
          labelColor: m.theme?.labelColor || fallbackTheme.labelColor,
          cardBorder: m.theme?.cardBorder || fallbackTheme.cardBorder,
          badgeBg: m.theme?.badgeBg || fallbackTheme.badgeBg,
        },
      };
    });
  }, [metricas]);

  // Controles de fondo accesibles
  const renderBackgroundControls = () => {
    if (!allowUploadBg) return null;

    return (
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
          disabled={isUploadingImage}
          onClick={() => fileInputRef.current?.click()}
          className={`inline-flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-semibold transition-all duration-150 cursor-pointer ${
            currentBgImage
              ? 'bg-blue-500/25 text-blue-100 border border-blue-400/35 hover:bg-blue-500/35'
              : 'text-blue-100/80 hover:text-white hover:bg-white/10'
          } ${isUploadingImage ? 'opacity-60 cursor-not-allowed' : ''}`}
          title={
            currentBgImage
              ? 'Cambiar imagen de fondo (se comprime a <= 100 KB)'
              : 'Subir imagen de fondo institucional (se comprime a <= 100 KB)'
          }
        >
          {isUploadingImage ? (
            <RiLoader4Line className="w-3.5 h-3.5 animate-spin text-amber-300" />
          ) : currentBgImage ? (
            <RiImageEditLine className="w-3.5 h-3.5 text-blue-200" />
          ) : (
            <RiImageAddLine className="w-3.5 h-3.5 text-blue-200" />
          )}
          <span className="hidden md:inline">
            {isUploadingImage
              ? 'Comprimiendo...'
              : currentBgImage
              ? 'Cambiar Fondo'
              : 'Fondo'}
          </span>
        </button>

        {currentBgImage && (
          <button
            type="button"
            disabled={isUploadingImage}
            onClick={handleRemoveImage}
            className="inline-flex items-center p-1 rounded-lg text-rose-300 hover:text-rose-100 hover:bg-rose-500/25 transition-all duration-150 cursor-pointer border border-rose-300/30"
            title="Eliminar imagen de fondo y restaurar diseño por defecto"
            aria-label="Eliminar imagen de fondo"
          >
            <RiDeleteBin7Line className="w-3.5 h-3.5" />
          </button>
        )}
      </div>
    );
  };

  // Selector de variantes Compacta / Grande
  const renderVariantSwitcher = () => (
    <div
      className="inline-flex items-center p-0.5 rounded-xl bg-white/10 backdrop-blur-md border border-white/15 text-xs font-semibold shadow-2xs"
      role="group"
      aria-label="Selector de tamaño de banner"
    >
      <button
        type="button"
        onClick={() => handleToggleVariant('compact')}
        className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
          variant === 'compact'
            ? 'bg-white text-slate-900 shadow-xs font-bold'
            : 'text-blue-100 hover:text-white hover:bg-white/10'
        }`}
        title="Vista compacta: horizontal de alta densidad"
      >
        <RiLayoutRowLine className="w-3 h-3" />
        <span className="hidden md:inline">Compacta</span>
      </button>
      <button
        type="button"
        onClick={() => handleToggleVariant('expanded')}
        className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
          variant === 'expanded'
            ? 'bg-white text-slate-900 shadow-xs font-bold'
            : 'text-blue-100 hover:text-white hover:bg-white/10'
        }`}
        title="Vista grande: hero amplio con tarjetas KPI destacadas"
      >
        <RiLayoutGridLine className="w-3 h-3" />
        <span className="hidden md:inline">Grande</span>
      </button>

      {renderBackgroundControls()}
    </div>
  );

  if (variant === 'compact') {
    return (
      <div
        role="banner"
        className="relative z-20 rounded-2xl bg-gradient-to-r from-[#071e4a] via-[#0c367a] to-[#163297] text-white px-4 py-3 sm:px-5 sm:py-3.5 shadow-lg border border-blue-900/40 transition-all duration-300"
      >
        {/* Capa de imagen de fondo y decorativa */}
        <div
          className="absolute inset-0 overflow-hidden rounded-2xl pointer-events-none"
          aria-hidden="true"
        >
          {currentBgImage && (
            <div
              className="absolute inset-0 bg-cover bg-center pointer-events-none transition-opacity duration-500"
              style={{
                backgroundImage: `url(${currentBgImage})`,
                opacity: backgroundImageOpacity,
              }}
              aria-hidden="true"
            />
          )}

          {currentBgImage && (
            <div
              className="absolute inset-0 bg-gradient-to-r from-[#071e4a]/90 via-[#0c367a]/85 to-[#163297]/90 pointer-events-none"
              aria-hidden="true"
            />
          )}

          <div className="absolute inset-0 opacity-[0.05] bg-[radial-gradient(#ffffff_1.5px,transparent_1.5px)] [background-size:16px_16px]" />
          <div className="absolute -right-12 -top-12 w-48 h-48 rounded-full bg-blue-400/15 blur-2xl" />
        </div>

        <div className="relative z-10 flex flex-col gap-2 sm:gap-2.5">
          {/* Fila Superior */}
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="flex flex-wrap items-center gap-1.5 min-w-0">
              {backHref && (
                <Link
                  href={backHref}
                  className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-white/10 hover:bg-white/20 text-blue-100 hover:text-white backdrop-blur-md border border-white/15 shadow-2xs transition-all cursor-pointer"
                  title="Volver"
                >
                  <MdArrowBack className="w-3 h-3" />
                  <span className="hidden sm:inline">{backLabel}</span>
                </Link>
              )}

              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-white/10 backdrop-blur-md border border-white/15 text-blue-100 shadow-2xs">
                <RiCalendarLine className="w-3 h-3 text-teal-200" />
                <span>Año Escolar {currentYearNumber}</span>
              </span>

              {institucion && (
                <span
                  className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-white/10 backdrop-blur-md border border-white/15 text-blue-100 shadow-2xs max-w-[280px] truncate"
                  title={institucion}
                >
                  <InstitucionIcon className="w-3 h-3 text-purple-200 shrink-0" />
                  <span className="truncate">{institucion}</span>
                </span>
              )}

              {faseNombre && (
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-white/10 backdrop-blur-md border border-white/15 text-emerald-200 shadow-2xs">
                  <RiSparklingLine className="w-3 h-3 text-emerald-300" />
                  <span>Fase: {faseNombre}</span>
                </span>
              )}
            </div>

            <div className="flex items-center gap-2 flex-wrap">
              {renderVariantSwitcher()}
              {actions}
            </div>
          </div>

          {/* Fila Principal: Título y Micro-Cápsulas */}
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 pt-1 sm:pt-1.5 border-t border-white/10">
            <div className="min-w-0 flex-1 pr-0 lg:pr-4">
              <div className="flex items-center gap-2">
                <h1 className="text-base sm:text-lg lg:text-xl font-bold tracking-tight text-white leading-snug drop-shadow-2xs">
                  {title.toUpperCase()}
                </h1>
                {allowEditTitle && idEvaluacion && collectionName && (
                  <button
                    type="button"
                    onClick={() => setIsEditModalOpen(true)}
                    className="opacity-75 hover:opacity-100 hover:scale-105 p-1 rounded-lg text-white/80 hover:text-white hover:bg-white/15 border border-white/10 transition-all cursor-pointer shadow-2xs"
                    title="Editar título y descripción"
                    aria-label="Editar título y descripción"
                  >
                    <RiEditLine className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
              {descripcion && (
                <p className="text-xs text-blue-100/75 leading-tight mt-0.5 line-clamp-1">
                  {descripcion}
                </p>
              )}
            </div>

            {resolvedMetrics.length > 0 && (
              <div className="grid grid-cols-2 sm:flex sm:items-center gap-1.5 sm:gap-2 shrink-0 flex-wrap">
                {resolvedMetrics.map((m, index) => {
                  const Icon = m.icon;
                  const CardComponent = (m.href ? Link : 'div') as any;
                  const isInteractive = Boolean(m.onClick || m.href);
                  return (
                    <CardComponent
                      key={m.id || index}
                      href={m.href}
                      onClick={m.onClick}
                      role={isInteractive ? 'button' : undefined}
                      tabIndex={isInteractive ? 0 : undefined}
                      onKeyDown={
                        m.onClick
                          ? (e: React.KeyboardEvent) => {
                              if (e.key === 'Enter' || e.key === ' ') {
                                e.preventDefault();
                                m.onClick?.();
                              }
                            }
                          : undefined
                      }
                      className={`bg-white/10 backdrop-blur-md rounded-xl px-2.5 py-1.5 border border-white/15 flex items-center gap-2 shadow-2xs transition-all ${
                        isInteractive ? 'cursor-pointer hover:bg-white/20 active:scale-95' : ''
                      } ${m.active ? 'ring-2 ring-white/80 bg-white/20 shadow-md' : ''}`}
                    >
                      {Icon && (
                        <div
                          className={`w-6 h-6 rounded-lg border flex items-center justify-center shrink-0 ${m.resolvedTheme.iconBg}`}
                        >
                          <Icon className="w-3.5 h-3.5" />
                        </div>
                      )}
                      <div className="min-w-0">
                        <span
                          className={`block text-[10px] uppercase tracking-wider font-semibold leading-none ${m.resolvedTheme.labelColor}`}
                        >
                          {m.label}
                        </span>
                        <span className="text-xs sm:text-sm font-bold text-white tracking-tight leading-tight mt-0.5 block">
                          {m.value}
                        </span>
                      </div>
                    </CardComponent>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  // Vista Grande (Expanded)
  return (
    <div
      role="banner"
      className="relative z-20 rounded-3xl bg-gradient-to-br from-[#05173c] via-[#0a2e6b] to-[#143694] text-white p-5 sm:p-7 lg:p-8 shadow-xl border border-blue-800/40 transition-all duration-300"
    >
      {/* Capa de efectos luminosos y fondo */}
      <div
        className="absolute inset-0 overflow-hidden rounded-3xl pointer-events-none"
        aria-hidden="true"
      >
        {currentBgImage && (
          <div
            className="absolute inset-0 bg-cover bg-center pointer-events-none transition-opacity duration-500"
            style={{
              backgroundImage: `url(${currentBgImage})`,
              opacity: backgroundImageOpacity,
            }}
            aria-hidden="true"
          />
        )}

        {currentBgImage && (
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
        {/* Fila 1: Badges y Acciones */}
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-2 min-w-0">
            {backHref && (
              <Link
                href={backHref}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold bg-white/10 hover:bg-white/20 text-blue-100 hover:text-white backdrop-blur-md border border-white/15 shadow-2xs transition-all cursor-pointer"
                title="Volver"
              >
                <MdArrowBack className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">{backLabel}</span>
              </Link>
            )}

            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-white/10 backdrop-blur-md border border-white/15 text-blue-100 shadow-2xs">
              <RiCalendarLine className="w-3.5 h-3.5 text-teal-200" />
              <span>Año Escolar {currentYearNumber}</span>
            </span>

            {institucion && (
              <span
                className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-white/10 backdrop-blur-md border border-white/15 text-blue-100 shadow-2xs max-w-[360px] truncate"
                title={institucion}
              >
                <InstitucionIcon className="w-3.5 h-3.5 text-purple-200 shrink-0" />
                <span className="truncate">{institucion}</span>
              </span>
            )}

            {faseNombre && (
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-white/10 backdrop-blur-md border border-white/15 text-emerald-200 shadow-2xs">
                <RiSparklingLine className="w-3.5 h-3.5 text-emerald-300" />
                <span>Fase: {faseNombre}</span>
              </span>
            )}
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            {renderVariantSwitcher()}
            {actions}
          </div>
        </div>

        {/* Fila 2: Título y Categoría */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="min-w-0 max-w-3xl">
            {categoria && (
              <span className="inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full text-[11px] font-bold uppercase tracking-wider bg-blue-500/20 text-blue-200 border border-blue-400/30 mb-2.5">
                {categoria.toUpperCase()}
              </span>
            )}
            <div className="flex items-center gap-2.5 flex-wrap">
              <h1 className="text-xl sm:text-2xl lg:text-3xl font-extrabold tracking-tight text-white leading-tight drop-shadow-sm">
                {title.toUpperCase()}
              </h1>
              {allowEditTitle && idEvaluacion && collectionName && (
                <button
                  type="button"
                  onClick={() => setIsEditModalOpen(true)}
                  className="opacity-75 hover:opacity-100 hover:scale-105 p-1.5 rounded-lg text-white/80 hover:text-white hover:bg-white/15 border border-white/10 transition-all cursor-pointer shadow-2xs"
                  title="Editar título y descripción"
                  aria-label="Editar título y descripción"
                >
                  <RiEditLine className="w-4 h-4" />
                </button>
              )}
            </div>
            {descripcion && (
              <p className="text-xs sm:text-sm text-blue-100/80 leading-relaxed mt-2 max-w-2xl">
                {descripcion}
              </p>
            )}
          </div>
        </div>

        {/* Fila 3: Tarjetas KPI */}
        {resolvedMetrics.length > 0 && (
          <div
            className={`grid gap-3 sm:gap-4 pt-4 sm:pt-5 border-t border-white/15 ${
              resolvedMetrics.length === 3
                ? 'grid-cols-1 sm:grid-cols-3'
                : 'grid-cols-2 md:grid-cols-4'
            }`}
          >
            {resolvedMetrics.map((m, index) => {
              const Icon = m.icon;
              const CardComponent = (m.href ? Link : 'div') as any;
              const isInteractive = Boolean(m.onClick || m.href);
              return (
                <CardComponent
                  key={m.id || index}
                  href={m.href}
                  onClick={m.onClick}
                  role={isInteractive ? 'button' : undefined}
                  tabIndex={isInteractive ? 0 : undefined}
                  onKeyDown={
                    m.onClick
                      ? (e: React.KeyboardEvent) => {
                          if (e.key === 'Enter' || e.key === ' ') {
                            e.preventDefault();
                            m.onClick?.();
                          }
                        }
                      : undefined
                  }
                  className={`relative bg-white/10 hover:bg-white/15 backdrop-blur-md rounded-2xl p-4 sm:p-5 border border-white/15 transition-all duration-200 shadow-xs hover:shadow-md hover:-translate-y-0.5 group ${
                    isInteractive ? 'cursor-pointer active:scale-95' : ''
                  } ${m.active ? 'ring-2 ring-white/80 bg-white/20 shadow-lg' : ''} ${m.resolvedTheme.cardBorder}`}
                >
                  <div className="flex items-center justify-between gap-2 mb-3">
                    {Icon && (
                      <div
                        className={`w-10 h-10 rounded-xl border flex items-center justify-center shrink-0 shadow-2xs group-hover:scale-105 transition-transform duration-200 ${m.resolvedTheme.iconBg}`}
                      >
                        <Icon className="w-5 h-5" />
                      </div>
                    )}
                    {m.badgeText && (
                      <span
                        className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider border ${m.resolvedTheme.badgeBg}`}
                      >
                        {m.badgeText}
                      </span>
                    )}
                  </div>

                  <div>
                    <span
                      className={`block text-[11px] uppercase tracking-wider font-bold ${m.resolvedTheme.labelColor}`}
                    >
                      {m.label}
                    </span>
                    <span className="text-2xl sm:text-3xl font-black text-white tracking-tight leading-none mt-1 block">
                      {m.value}
                    </span>
                    {m.helperText && (
                      <span className="block text-[11px] text-blue-100/70 line-clamp-1 mt-1.5 font-medium">
                        {m.helperText}
                      </span>
                    )}
                  </div>
                </CardComponent>
              );
            })}
          </div>
        )}
      </div>

      {isEditModalOpen && idEvaluacion && collectionName && (
        <ModalEditarTituloDescripcion
          idEvaluacion={idEvaluacion}
          collectionName={collectionName}
          tituloActual={title}
          descripcionActual={descripcion}
          onClose={() => setIsEditModalOpen(false)}
        />
      )}
    </div>
  );
};

export default EvaluacionDetalleHeroBanner;
