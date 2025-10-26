import React from 'react';
import { useRouter } from 'next/router';
import { useGlobalContext } from '@/features/context/GlolbalContext';
import { usePermissions, PERMISSIONS } from '@/features/utils/permissions';

interface ProtectedRouteProps {
  children: React.ReactNode;
  requiredPermission?: PERMISSIONS;
  requiredPermissions?: PERMISSIONS[];
  requireAll?: boolean;
  redirectTo?: string;
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({
  children,
  requiredPermission,
  requiredPermissions = [],
  requireAll = false,
  redirectTo = '/login'
}) => {
  const router = useRouter();
  const { currentUserData } = useGlobalContext();
  const userRole = currentUserData.perfil?.rol || 0;
  const institutionLevels = currentUserData.nivelDeInstitucion || [];
  
  const { hasPermission, hasAnyPermission, hasAllPermissions } = usePermissions(
    userRole, 
    institutionLevels
  );

  React.useEffect(() => {
    let hasAccess = true;

    if (requiredPermission) {
      hasAccess = hasPermission(requiredPermission);
    } else if (requiredPermissions.length > 0) {
      hasAccess = requireAll 
        ? hasAllPermissions(requiredPermissions)
        : hasAnyPermission(requiredPermissions);
    }

    if (!hasAccess) {
      router.push(redirectTo);
    }
  }, [requiredPermission, requiredPermissions, requireAll, redirectTo, router, hasPermission, hasAnyPermission, hasAllPermissions]);

  // Si no hay permisos requeridos, mostrar siempre
  if (!requiredPermission && requiredPermissions.length === 0) {
    return <>{children}</>;
  }

  // Verificar acceso
  let hasAccess = true;
  if (requiredPermission) {
    hasAccess = hasPermission(requiredPermission);
  } else if (requiredPermissions.length > 0) {
    hasAccess = requireAll 
      ? hasAllPermissions(requiredPermissions)
      : hasAnyPermission(requiredPermissions);
  }

  return hasAccess ? <>{children}</> : null;
};

export default ProtectedRoute;
