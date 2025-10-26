import React from 'react';
import { useGlobalContext } from '@/features/context/GlolbalContext';
import { usePermissions, PERMISSIONS } from '@/features/utils/permissions';

interface PermissionGateProps {
  permission?: PERMISSIONS;
  permissions?: PERMISSIONS[];
  requireAll?: boolean; // Si true, requiere TODOS los permisos. Si false, requiere AL MENOS UNO
  children: React.ReactNode;
  fallback?: React.ReactNode;
}

const PermissionGate: React.FC<PermissionGateProps> = ({
  permission,
  permissions = [],
  requireAll = false,
  children,
  fallback = null
}) => {
  const { currentUserData } = useGlobalContext();
  const userRole = currentUserData.perfil?.rol || 0;
  const institutionLevels = currentUserData.nivelDeInstitucion || [];
  
  const { hasPermission, hasAnyPermission, hasAllPermissions } = usePermissions(
    userRole, 
    institutionLevels
  );
  
  // Si el usuario tiene nivelDeInstitucion, no tiene permiso
  if (currentUserData.nivelDeInstitucion && currentUserData.nivelDeInstitucion.length > 0) {
    return <>{fallback}</>;
  }

  // Si se especifica un permiso específico
  if (permission) {
    // Lógica específica para VIEW_AUTORREPORTE
    if (permission === PERMISSIONS.VIEW_AUTORREPORTE) {
      const userNivel = currentUserData.nivel;
      console.log("currentUserData", currentUserData)
      return userNivel !== 2 ? <>{children}</> : <>{fallback}</>;
    }
    
    return hasPermission(permission) ? <>{children}</> : <>{fallback}</>;
  }

  // Si se especifican múltiples permisos
  if (permissions.length > 0) {
    const hasAccess = requireAll 
      ? hasAllPermissions(permissions)
      : hasAnyPermission(permissions);
    
    return hasAccess ? <>{children}</> : <>{fallback}</>;
  }

  // Si no se especifican permisos, mostrar siempre
  return <>{children}</>;
};

export default PermissionGate;
