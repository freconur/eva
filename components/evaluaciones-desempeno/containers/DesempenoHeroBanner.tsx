import React from 'react';
import { useGlobalContext } from '@/features/context/GlolbalContext';
import EvaluacionesHeroBanner, {
  HeroBannerMetricItem,
  EvaluacionesBannerVariant,
} from '@/components/evaluaciones/EvaluacionesHeroBanner';
import useEvaluacionesBannerConfig from '@/components/evaluaciones/useEvaluacionesBannerConfig';

export type { HeroBannerMetricItem, EvaluacionesBannerVariant };

export interface DesempenoHeroBannerProps {
  /**
   * Identificador único de la ruta para persistir la configuración en Firestore
   * ('configuraciones/evaluaciones_banner').
   * Ejemplos: 'admin_especialistas', 'directores_evaluaciones_docentes',
   * 'docentes_mi_desempeno', 'directores_mi_desempeno'
   */
  routeKey: string;

  /** Título principal del banner */
  title: string;

  /** Subtítulo descriptivo pedagógico / de seguimiento */
  subtitle: string;

  /** Etiqueta o badge temático sobre el título (ej. "Seguimiento y Retroalimentación", "Desempeño Docente") */
  badgeTema?: string;

  /** Nombre del colegio, institución educativa o UGEL */
  colegio?: string;

  /** Año escolar actual o seleccionado */
  selectedYear?: number;

  /** Mes escolar seleccionado (opcional) */
  selectedMonth?: string;

  /** Métricas a renderizar en las tarjetas KPI o micro-cápsulas */
  metrics?: HeroBannerMetricItem[];

  /** Cantidad total de evaluaciones (utilizado como fallback si no se provee metrics) */
  totalEvaluaciones?: number;

  /** Cantidad de evaluaciones activas */
  totalActivas?: number;

  /** Elementos de acción interactivos a la derecha del banner (ej. botón de creación, filtros, perfil) */
  actions?: React.ReactNode;

  /** Badges adicionales en la fila superior del banner */
  extraBadges?: React.ReactNode;

  /** Mostrar selector de variante e imagen de fondo (default: true) */
  showVariantSwitch?: boolean;

  /** Variante visual por defecto si no existe en base de datos */
  defaultVariant?: EvaluacionesBannerVariant;

  /** Clases CSS adicionales */
  className?: string;
}

/**
 * Componente modular y reutilizable de Hero Banner para procesos de
 * seguimiento, retroalimentación y evaluación de desempeño.
 *
 * Utilizable para:
 * - Docentes (seguimiento a su desempeño en aula y retroalimentación directiva)
 * - Directores (acompañamiento docente y monitoreo de su propia gestión institucional)
 * - Especialistas y Administradores (monitoreo pedagógico y rúbricas de evaluación)
 */
export const DesempenoHeroBanner: React.FC<DesempenoHeroBannerProps> = ({
  routeKey,
  title,
  subtitle,
  badgeTema = 'Seguimiento y Retroalimentación',
  colegio,
  selectedYear,
  selectedMonth,
  metrics,
  totalEvaluaciones,
  totalActivas,
  actions,
  extraBadges,
  showVariantSwitch = true,
  defaultVariant = 'compact',
  className = '',
}) => {
  const { currentUserData } = useGlobalContext();
  const bannerConfig = useEvaluacionesBannerConfig({ routeKey, defaultVariant });

  const isUserAdmin =
    currentUserData?.rol === 4 ||
    currentUserData?.rol === 0 ||
    currentUserData?.perfil?.rol === 4 ||
    currentUserData?.perfil?.rol === 0 ||
    Number(currentUserData?.rol) === 4 ||
    Number(currentUserData?.rol) === 0;

  const canShowVariantSwitch = showVariantSwitch && (isUserAdmin || bannerConfig.isAuditing);

  const institucionEfectiva =
    colegio ||
    currentUserData?.institucion ||
    currentUserData?.ugel ||
    'UGEL';

  const anioEfectivo = selectedYear || new Date().getFullYear();

  return (
    <EvaluacionesHeroBanner
      title={title}
      subtitle={subtitle}
      colegio={institucionEfectiva}
      badgeTema={badgeTema}
      selectedYear={anioEfectivo}
      selectedMonth={selectedMonth}
      totalEvaluaciones={totalEvaluaciones}
      totalActivas={totalActivas}
      variant={bannerConfig.variant}
      backgroundImage={bannerConfig.backgroundImage}
      backgroundImageOpacity={bannerConfig.backgroundImageOpacity}
      customTitle={bannerConfig.customTitle}
      customSubtitle={bannerConfig.customSubtitle}
      isAuditing={bannerConfig.isAuditing}
      showVariantSwitch={canShowVariantSwitch}
      isSavingVariant={bannerConfig.isSaving}
      isSavingTexts={bannerConfig.isSavingTexts}
      isUploadingImage={bannerConfig.isUploadingImage}
      onVariantChange={bannerConfig.setBannerVariant}
      onUploadBackgroundImage={bannerConfig.uploadBannerImage}
      onRemoveBackgroundImage={bannerConfig.removeBannerImage}
      onUpdateTexts={bannerConfig.updateBannerTexts}
      onResetTexts={bannerConfig.resetBannerTexts}
      metrics={metrics}
      actions={actions}
      extraBadges={extraBadges}
      className={className}
    />
  );
};

export default DesempenoHeroBanner;
