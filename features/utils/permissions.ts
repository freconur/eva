// Sistema de permisos y roles
export enum ROLES {
  ESPECIALISTA = 1,
  DIRECTOR = 2,
  DOCENTE = 3,
  ADMIN = 4,
  ESPECIALISTA_REGIONAL = 5
}

export enum PERMISSIONS {
  // Evaluaciones
  VIEW_EVALUACIONES = 'view_evaluaciones',
  CREATE_EVALUACIONES = 'create_evaluaciones',
  EDIT_EVALUACIONES = 'edit_evaluaciones',
  DELETE_EVALUACIONES = 'delete_evaluaciones',
  
  // Docentes
  VIEW_DOCENTES = 'view_docentes',
  CREATE_DOCENTES = 'create_docentes',
  EDIT_DOCENTES = 'edit_docentes',
  DELETE_DOCENTES = 'delete_docentes',
  
  // Estudiantes
  VIEW_ESTUDIANTES = 'view_estudiantes',
  CREATE_ESTUDIANTES = 'create_estudiantes',
  EDIT_ESTUDIANTES = 'edit_estudiantes',
  DELETE_ESTUDIANTES = 'delete_estudiantes',
  
  // Reportes
  VIEW_REPORTES = 'view_reportes',
  EXPORT_REPORTES = 'export_reportes',
  
  // Cobertura curricular
  VIEW_COBERTURA_CURRICULAR = 'view_cobertura_curricular',
  EDIT_COBERTURA_CURRICULAR = 'edit_cobertura_curricular',
  
  // Mediación didáctica
  VIEW_MEDIACION_DIDACTICA = 'view_mediacion_didactica',
  EDIT_MEDIACION_DIDACTICA = 'edit_mediacion_didactica',
  
  // Autorreporte
  VIEW_AUTORREPORTE = 'view_autorreporte',
  EDIT_AUTORREPORTE = 'edit_autorreporte',
  
  // Usuarios
  VIEW_USUARIOS = 'view_usuarios',
  CREATE_USUARIOS = 'create_usuarios',
  EDIT_USUARIOS = 'edit_usuarios',
  DELETE_USUARIOS = 'delete_usuarios',
  
  // Administración
  ADMIN_PANEL = 'admin_panel',
  MANAGE_ROLES = 'manage_roles',

  //niveles
  NIVELES='niveles'
}

// Mapeo de roles a permisos
export const ROLE_PERMISSIONS: Record<ROLES, PERMISSIONS[]> = {
  [ROLES.ESPECIALISTA]: [
    PERMISSIONS.VIEW_EVALUACIONES,
    PERMISSIONS.VIEW_DOCENTES,
    PERMISSIONS.VIEW_ESTUDIANTES,
    PERMISSIONS.VIEW_REPORTES,
    PERMISSIONS.EXPORT_REPORTES,
    PERMISSIONS.VIEW_COBERTURA_CURRICULAR,
    PERMISSIONS.VIEW_MEDIACION_DIDACTICA,
    PERMISSIONS.VIEW_AUTORREPORTE,
    PERMISSIONS.VIEW_USUARIOS,
    PERMISSIONS.CREATE_USUARIOS,
    PERMISSIONS.EDIT_USUARIOS
  ],
  
  [ROLES.DIRECTOR]: [
    PERMISSIONS.VIEW_EVALUACIONES,
    PERMISSIONS.VIEW_DOCENTES,
    PERMISSIONS.VIEW_ESTUDIANTES,
    PERMISSIONS.VIEW_REPORTES,
    PERMISSIONS.EXPORT_REPORTES,
    PERMISSIONS.VIEW_COBERTURA_CURRICULAR,
    PERMISSIONS.VIEW_MEDIACION_DIDACTICA,
    PERMISSIONS.VIEW_AUTORREPORTE,
    PERMISSIONS.CREATE_DOCENTES,
    PERMISSIONS.EDIT_DOCENTES,
    PERMISSIONS.CREATE_ESTUDIANTES,
    PERMISSIONS.EDIT_ESTUDIANTES
  ],
  
  [ROLES.DOCENTE]: [
    PERMISSIONS.VIEW_EVALUACIONES,
    PERMISSIONS.VIEW_ESTUDIANTES,
    PERMISSIONS.VIEW_REPORTES,
    PERMISSIONS.VIEW_AUTORREPORTE,
    PERMISSIONS.NIVELES
  ],
  
  [ROLES.ADMIN]: [
    // Todos los permisos
    ...Object.values(PERMISSIONS)
  ],
  
  [ROLES.ESPECIALISTA_REGIONAL]: [
    PERMISSIONS.VIEW_EVALUACIONES,
    PERMISSIONS.VIEW_DOCENTES,
    PERMISSIONS.VIEW_ESTUDIANTES,
    PERMISSIONS.VIEW_REPORTES,
    PERMISSIONS.EXPORT_REPORTES,
    PERMISSIONS.VIEW_COBERTURA_CURRICULAR,
    PERMISSIONS.VIEW_MEDIACION_DIDACTICA,
    PERMISSIONS.VIEW_AUTORREPORTE,
    PERMISSIONS.VIEW_USUARIOS,
    PERMISSIONS.CREATE_USUARIOS,
    PERMISSIONS.EDIT_USUARIOS
  ]
};

// Permisos específicos por nivel de institución
export const INSTITUTION_LEVEL_PERMISSIONS: Record<number, PERMISSIONS[]> = {
  1: [ // Inicial
    PERMISSIONS.VIEW_MEDIACION_DIDACTICA,
    PERMISSIONS.VIEW_COBERTURA_CURRICULAR
  ],
  2: [ // Primaria
    PERMISSIONS.VIEW_MEDIACION_DIDACTICA,
    PERMISSIONS.VIEW_COBERTURA_CURRICULAR
  ],
  3: [ // Secundaria
    PERMISSIONS.VIEW_MEDIACION_DIDACTICA,
    PERMISSIONS.VIEW_COBERTURA_CURRICULAR
  ]
};

// Clase para manejar permisos
export class PermissionManager {
  private userRole: ROLES;
  private userInstitutionLevels: number[];
  private userPermissions: Set<PERMISSIONS>;

  constructor(role: number, institutionLevels: number[] = []) {
    this.userRole = role as ROLES;
    this.userInstitutionLevels = institutionLevels;
    this.userPermissions = new Set();
    
    this.initializePermissions();
  }

  private initializePermissions() {
    // Agregar permisos del rol
    const rolePermissions = ROLE_PERMISSIONS[this.userRole] || [];
    rolePermissions.forEach(permission => {
      this.userPermissions.add(permission);
    });

    // Agregar permisos específicos del nivel de institución
    this.userInstitutionLevels.forEach(level => {
      const levelPermissions = INSTITUTION_LEVEL_PERMISSIONS[level] || [];
      levelPermissions.forEach(permission => {
        this.userPermissions.add(permission);
      });
    });
  }

  hasPermission(permission: PERMISSIONS): boolean {
    return this.userPermissions.has(permission);
  }

  hasAnyPermission(permissions: PERMISSIONS[]): boolean {
    return permissions.some(permission => this.hasPermission(permission));
  }

  hasAllPermissions(permissions: PERMISSIONS[]): boolean {
    return permissions.every(permission => this.hasPermission(permission));
  }

  canAccessRoute(route: string): boolean {
    // Mapeo de rutas a permisos
    const routePermissions: Record<string, PERMISSIONS[]> = {
      '/directores/evaluaciones-docentes': [PERMISSIONS.VIEW_MEDIACION_DIDACTICA],
      '/directores/cobertura-curricular': [PERMISSIONS.VIEW_COBERTURA_CURRICULAR],
      '/admin/conocimientos-pedagogicos': [PERMISSIONS.VIEW_AUTORREPORTE],
      '/directores/agregar-profesores': [PERMISSIONS.CREATE_DOCENTES],
      '/admin/usuarios': [PERMISSIONS.VIEW_USUARIOS],
      '/admin/evaluaciones': [PERMISSIONS.VIEW_EVALUACIONES, PERMISSIONS.ADMIN_PANEL]
    };

    const requiredPermissions = routePermissions[route];
    if (!requiredPermissions) return true; // Ruta sin restricciones

    return this.hasAnyPermission(requiredPermissions);
  }

  getAvailablePermissions(): PERMISSIONS[] {
    return Array.from(this.userPermissions);
  }

  // Método para verificar si el usuario puede ver un elemento del menú
  canShowMenuItem(menuItem: string): boolean {
    const menuPermissions: Record<string, PERMISSIONS[]> = {
      'mediacion-didactica': [PERMISSIONS.VIEW_MEDIACION_DIDACTICA],
      'cobertura-curricular': [PERMISSIONS.VIEW_COBERTURA_CURRICULAR],
      'autorreporte': [PERMISSIONS.VIEW_AUTORREPORTE],
      'crear-usuario': [PERMISSIONS.CREATE_DOCENTES],
      'evaluaciones': [PERMISSIONS.VIEW_EVALUACIONES]
    };

    const requiredPermissions = menuPermissions[menuItem];
    if (!requiredPermissions) return true;

    return this.hasAnyPermission(requiredPermissions);
  }

  canShowNiveles(value:string) {
    const nivelesPermissions: Record<string, PERMISSIONS[]> = {
      'niveles': [PERMISSIONS.NIVELES]
    };
    const requiredPermissions = nivelesPermissions[value];
    if (!requiredPermissions) return true;

    return this.hasAnyPermission(requiredPermissions);
  }
}

// Hook personalizado para usar permisos
export const usePermissions = (userRole: number, institutionLevels: number[] = []) => {
  const permissionManager = new PermissionManager(userRole, institutionLevels);

  return {
    hasPermission: (permission: PERMISSIONS) => permissionManager.hasPermission(permission),
    hasAnyPermission: (permissions: PERMISSIONS[]) => permissionManager.hasAnyPermission(permissions),
    hasAllPermissions: (permissions: PERMISSIONS[]) => permissionManager.hasAllPermissions(permissions),
    canAccessRoute: (route: string) => permissionManager.canAccessRoute(route),
    canShowMenuItem: (menuItem: string) => permissionManager.canShowMenuItem(menuItem),
    getAvailablePermissions: () => permissionManager.getAvailablePermissions()
  };
};
