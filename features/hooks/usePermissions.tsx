import { useGlobalContext } from '@/features/context/GlolbalContext';
import { usePermissions as usePermissionsUtil, PERMISSIONS } from '@/features/utils/permissions';

export const usePermissions = () => {
  const { currentUserData } = useGlobalContext();
  const userRole = currentUserData.perfil?.rol || 0;
  const institutionLevels = currentUserData.nivelDeInstitucion || [];
  
  return usePermissionsUtil(userRole, institutionLevels);
};

// Hook específico para verificar permisos de menú
export const useMenuPermissions = () => {
  const permissions = usePermissions();
  
  return {
    canShowMediacionDidactica: () => permissions.hasPermission(PERMISSIONS.VIEW_MEDIACION_DIDACTICA),
    canShowCoberturaCurricular: () => permissions.hasPermission(PERMISSIONS.VIEW_COBERTURA_CURRICULAR),
    canShowAutorreporte: () => permissions.hasPermission(PERMISSIONS.VIEW_AUTORREPORTE),
    canCreateDocentes: () => permissions.hasPermission(PERMISSIONS.CREATE_DOCENTES),
    canViewEvaluaciones: () => permissions.hasPermission(PERMISSIONS.VIEW_EVALUACIONES),
    canViewReportes: () => permissions.hasPermission(PERMISSIONS.VIEW_REPORTES),
    canExportReportes: () => permissions.hasPermission(PERMISSIONS.EXPORT_REPORTES),
  };
};

export default usePermissions;
