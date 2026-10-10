/**
 * Configuración y definiciones de nombres personalizables del Sidebar
 * Permite al Administrador renombrar cualquier elemento del menú de cualquier rol.
 */

export interface SidebarLabels {
  // === GENERAL / CABECERA ===
  sidebar_tituloSistema?: string;
  sidebar_subtituloPrefix?: string;
  sidebar_seccionPrincipal?: string;
  sidebar_seccionGestion?: string;

  // === ADMINISTRADOR ===
  admin_miCuenta?: string;
  admin_gestionUsuarios?: string;
  admin_configuracion?: string;
  admin_pizarra?: string;
  admin_matrizCostos?: string;
  admin_perfiles?: string;
  // Perfiles - Especialista Regional
  admin_especialistaRegional?: string;
  admin_especialistaRegional_crearUsuario?: string;
  // Perfiles - Especialistas
  admin_especialistas?: string;
  admin_especialistas_crearUsuario?: string;
  admin_especialistas_seguimiento?: string;
  admin_especialistas_cobertura?: string;
  admin_especialistas_autorreporte?: string;
  // Perfiles - Directores
  admin_directores?: string;
  admin_directores_crearUsuario?: string;
  admin_directores_seguimiento?: string;
  admin_directores_cobertura?: string;
  admin_directores_autorreporte?: string;
  // Perfiles - Docentes
  admin_docentes?: string;
  admin_docentes_usuarios?: string;
  admin_docentes_seguimiento?: string;
  admin_docentes_cobertura?: string;
  admin_docentes_autorreporte?: string;
  // Perfiles - Estudiantes
  admin_estudiantes?: string;
  admin_estudiantes_seguimiento?: string;
  admin_estudiantes_matriz?: string;

  // === DIRECTORES ===
  director_miCuenta?: string;
  director_estudiantes?: string;
  director_estudiantes_seguimiento?: string;
  director_docentes?: string;
  director_docentes_mediacion?: string;
  director_docentes_crearUsuario?: string;
  director_docentes_cobertura?: string;
  director_docentes_reporte?: string;
  director_autorreporte?: string;

  // === DOCENTES ===
  docente_miCuenta?: string;
  docente_seguimiento?: string;
  docente_estudiantes?: string;
  docente_autorreporte?: string;

  // === ESPECIALISTAS ===
  especialista_miCuenta?: string;
  especialista_directivos?: string;
  especialista_directivos_seguimiento?: string;
  especialista_directivos_cobertura?: string;
  especialista_directivos_crear?: string;
  especialista_docentes?: string;
  especialista_docentes_usuarios?: string;
  especialista_estudiantes?: string;
  especialista_estudiantes_seguimiento?: string;
  especialista_autorreporte?: string;
}

export type SidebarLabelKey = keyof SidebarLabels;

export const DEFAULT_SIDEBAR_LABELS: Record<SidebarLabelKey, string> = {
  // General / Cabecera
  sidebar_tituloSistema: 'Competence-Lab',
  sidebar_subtituloPrefix: 'ugel',
  sidebar_seccionPrincipal: 'Principal',
  sidebar_seccionGestion: 'Gestión',

  // Administrador
  admin_miCuenta: 'Mi cuenta',
  admin_gestionUsuarios: 'Gestión de Usuarios',
  admin_configuracion: 'Configuración',
  admin_pizarra: 'Pizarra',
  admin_matrizCostos: 'Matriz de Costos',
  admin_perfiles: 'Perfiles',
  admin_especialistaRegional: 'Especialista Regional',
  admin_especialistaRegional_crearUsuario: 'Crear usuario',
  admin_especialistas: 'Especialistas',
  admin_especialistas_crearUsuario: 'Crear usuario',
  admin_especialistas_seguimiento: 'Seguimiento y retroalimentacion',
  admin_especialistas_cobertura: 'Cobertura curricular',
  admin_especialistas_autorreporte: 'Autorreporte',
  admin_directores: 'Directores',
  admin_directores_crearUsuario: 'Crear usuario',
  admin_directores_seguimiento: 'Seguimiento y retroalimentacion',
  admin_directores_cobertura: 'Cobertura curricular',
  admin_directores_autorreporte: 'Autorreporte',
  admin_docentes: 'Docentes',
  admin_docentes_usuarios: 'Usuarios',
  admin_docentes_seguimiento: 'Seguimiento y retroalimentacion',
  admin_docentes_cobertura: 'Cobertura curricular',
  admin_docentes_autorreporte: 'Autorreporte',
  admin_estudiantes: 'Estudiantes',
  admin_estudiantes_seguimiento: 'Seguimiento de Aprendizaje',
  admin_estudiantes_matriz: 'Matriz de Resultados',

  // Directores
  director_miCuenta: 'Mi cuenta',
  director_estudiantes: 'Estudiantes',
  director_estudiantes_seguimiento: 'Seguimiento de aprendizaje',
  director_docentes: 'Docentes',
  director_docentes_mediacion: 'Mediación didáctica',
  director_docentes_crearUsuario: 'Crear usuario',
  director_docentes_cobertura: 'Cobertura curricular',
  director_docentes_reporte: 'Reporte',
  director_autorreporte: 'Autorreporte',

  // Docentes
  docente_miCuenta: 'Mi cuenta',
  docente_seguimiento: 'Seguimiento de aprendizajes',
  docente_estudiantes: 'Mis Estudiantes',
  docente_autorreporte: 'Autorreporte',

  // Especialistas
  especialista_miCuenta: 'Mi cuenta',
  especialista_directivos: 'Directivos',
  especialista_directivos_seguimiento: 'Seguimiento y retroalimentación',
  especialista_directivos_cobertura: 'Cobertura curricular',
  especialista_directivos_crear: 'Crear directivo',
  especialista_docentes: 'Docentes',
  especialista_docentes_usuarios: 'Usuarios',
  especialista_estudiantes: 'Estudiantes',
  especialista_estudiantes_seguimiento: 'Seguimiento de aprendizaje',
  especialista_autorreporte: 'Autorreporte',
};

export interface SidebarItemMeta {
  key: SidebarLabelKey;
  labelOriginal: string;
  description: string;
  route?: string;
  isHeader?: boolean;
}

export interface SidebarCategoryMeta {
  categoryId: string;
  categoryTitle: string;
  iconName?: string;
  items: SidebarItemMeta[];
}

export interface SidebarRoleMeta {
  roleId: 'admin' | 'director' | 'docente' | 'especialista' | 'general';
  roleName: string;
  roleBadge: string;
  icon: string;
  categories: SidebarCategoryMeta[];
}

export const SIDEBAR_ROLES_METADATA: SidebarRoleMeta[] = [
  {
    roleId: 'admin',
    roleName: 'Sidebar Administrador',
    roleBadge: 'Rol 4 / 5',
    icon: 'RiShieldUserLine',
    categories: [
      {
        categoryId: 'admin_principales',
        categoryTitle: 'Accesos Principales',
        items: [
          { key: 'admin_miCuenta', labelOriginal: 'Mi cuenta', description: 'Acceso al perfil y datos personales', route: '/mi-cuenta' },
          { key: 'admin_gestionUsuarios', labelOriginal: 'Gestión de Usuarios', description: 'Administración de usuarios y solicitudes', route: '/admin/gestion-usuarios' },
          { key: 'admin_configuracion', labelOriginal: 'Configuración', description: 'Branding, temas y personalización', route: '/admin/configuracion' },
          { key: 'admin_pizarra', labelOriginal: 'Pizarra', description: 'Espacio de pruebas y pizarra general', route: '/admin/pruebas' },
          { key: 'admin_matrizCostos', labelOriginal: 'Matriz de Costos', description: 'Módulo financiero/costos (dev)', route: '/admin/matriz-costos' },
          { key: 'admin_perfiles', labelOriginal: 'Perfiles', description: 'Grupo acordeón de gestión por roles' },
        ],
      },
      {
        categoryId: 'admin_esp_regional',
        categoryTitle: 'Perfiles: Especialista Regional',
        items: [
          { key: 'admin_especialistaRegional', labelOriginal: 'Especialista Regional', description: 'Título de la sección de especialista regional' },
          { key: 'admin_especialistaRegional_crearUsuario', labelOriginal: 'Crear usuario', description: 'Enlace para crear especialista regional', route: '/admin/especialista-regional/usuarios-especialistas-regional' },
        ],
      },
      {
        categoryId: 'admin_esp',
        categoryTitle: 'Perfiles: Especialistas',
        items: [
          { key: 'admin_especialistas', labelOriginal: 'Especialistas', description: 'Título del grupo de especialistas' },
          { key: 'admin_especialistas_crearUsuario', labelOriginal: 'Crear usuario', description: 'Registro de especialistas', route: '/admin/especialistas/agregar-especialista' },
          { key: 'admin_especialistas_seguimiento', labelOriginal: 'Seguimiento y retroalimentacion', description: 'Evaluaciones y retroalimentación', route: '/admin/especialistas/evaluaciones-especialistas' },
          { key: 'admin_especialistas_cobertura', labelOriginal: 'Cobertura curricular', description: 'Avance curricular', route: '/admin/especialistas/cobertura-curricular' },
          { key: 'admin_especialistas_autorreporte', labelOriginal: 'Autorreporte', description: 'Conocimientos pedagógicos', route: '/admin/conocimientos-pedagogicos?rol=1' },
        ],
      },
      {
        categoryId: 'admin_dir',
        categoryTitle: 'Perfiles: Directores',
        items: [
          { key: 'admin_directores', labelOriginal: 'Directores', description: 'Título del grupo de directores' },
          { key: 'admin_directores_crearUsuario', labelOriginal: 'Crear usuario', description: 'Registro de directores', route: '/especialistas/agregar-directores' },
          { key: 'admin_directores_seguimiento', labelOriginal: 'Seguimiento y retroalimentacion', description: 'Evaluación directores', route: '/especialistas/evaluaciones-director' },
          { key: 'admin_directores_cobertura', labelOriginal: 'Cobertura curricular', description: 'Avance curricular de directores', route: '/especialistas/cobertura-curricular' },
          { key: 'admin_directores_autorreporte', labelOriginal: 'Autorreporte', description: 'Autorreporte de directores', route: '/admin/conocimientos-pedagogicos?rol=2' },
        ],
      },
      {
        categoryId: 'admin_doc',
        categoryTitle: 'Perfiles: Docentes',
        items: [
          { key: 'admin_docentes', labelOriginal: 'Docentes', description: 'Título del grupo de docentes' },
          { key: 'admin_docentes_usuarios', labelOriginal: 'Usuarios', description: 'Listado de docentes', route: '/admin/docentes/usuarios' },
          { key: 'admin_docentes_seguimiento', labelOriginal: 'Seguimiento y retroalimentacion', description: 'Evaluación docente', route: '/directores/evaluaciones-docentes' },
          { key: 'admin_docentes_cobertura', labelOriginal: 'Cobertura curricular', description: 'Avance curricular de docentes', route: '/directores/cobertura-curricular' },
          { key: 'admin_docentes_autorreporte', labelOriginal: 'Autorreporte', description: 'Autorreporte de docentes', route: '/admin/conocimientos-pedagogicos?rol=3' },
        ],
      },
      {
        categoryId: 'admin_est',
        categoryTitle: 'Perfiles: Estudiantes',
        items: [
          { key: 'admin_estudiantes', labelOriginal: 'Estudiantes', description: 'Título del grupo de estudiantes' },
          { key: 'admin_estudiantes_seguimiento', labelOriginal: 'Seguimiento de Aprendizaje', description: 'Evaluaciones y pruebas de estudiantes', route: '/admin/evaluaciones' },
          { key: 'admin_estudiantes_matriz', labelOriginal: 'Matriz de Resultados', description: 'Matriz consolidada de resultados', route: '/admin/matriz-resultados' },
        ],
      },
    ],
  },
  {
    roleId: 'director',
    roleName: 'Sidebar Directores',
    roleBadge: 'Rol 2',
    icon: 'RiBuilding4Line',
    categories: [
      {
        categoryId: 'director_general',
        categoryTitle: 'Menú del Director',
        items: [
          { key: 'director_miCuenta', labelOriginal: 'Mi cuenta', description: 'Perfil del director', route: '/mi-cuenta' },
          { key: 'director_estudiantes', labelOriginal: 'Estudiantes', description: 'Título del grupo de estudiantes' },
          { key: 'director_estudiantes_seguimiento', labelOriginal: 'Seguimiento de aprendizaje', description: 'Evaluaciones escolares de estudiantes', route: '/directores/evaluaciones' },
          { key: 'director_docentes', labelOriginal: 'Docentes', description: 'Título del grupo de docentes' },
          { key: 'director_docentes_mediacion', labelOriginal: 'Mediación didáctica', description: 'Evaluación de desempeño docente', route: '/directores/evaluaciones-docentes' },
          { key: 'director_docentes_crearUsuario', labelOriginal: 'Crear usuario', description: 'Registro de nuevos profesores', route: '/directores/agregar-profesores' },
          { key: 'director_docentes_cobertura', labelOriginal: 'Cobertura curricular', description: 'Cobertura curricular de la escuela', route: '/directores/cobertura-curricular' },
          { key: 'director_docentes_reporte', labelOriginal: 'Reporte', description: 'Reportes de gestión educativa', route: '/directores/reporte' },
          { key: 'director_autorreporte', labelOriginal: 'Autorreporte', description: 'Autorreporte de conocimientos pedagógicos', route: '/admin/conocimientos-pedagogicos?rol=2' },
        ],
      },
    ],
  },
  {
    roleId: 'docente',
    roleName: 'Sidebar Docentes',
    roleBadge: 'Rol 3',
    icon: 'RiUserStarLine',
    categories: [
      {
        categoryId: 'docente_general',
        categoryTitle: 'Menú del Docente',
        items: [
          { key: 'docente_miCuenta', labelOriginal: 'Mi cuenta', description: 'Perfil del docente', route: '/mi-cuenta' },
          { key: 'docente_seguimiento', labelOriginal: 'Seguimiento de aprendizajes', description: 'Pruebas y notas de sus aulas', route: '/docentes/evaluaciones' },
          { key: 'docente_estudiantes', labelOriginal: 'Mis Estudiantes', description: 'Padrón de estudiantes asignados', route: '/docentes/estudiantes' },
          { key: 'docente_autorreporte', labelOriginal: 'Autorreporte', description: 'Autorreporte de conocimientos pedagógicos', route: '/admin/conocimientos-pedagogicos?rol=3' },
        ],
      },
    ],
  },
  {
    roleId: 'especialista',
    roleName: 'Sidebar Especialistas UGEL',
    roleBadge: 'Rol 1',
    icon: 'RiTeamLine',
    categories: [
      {
        categoryId: 'especialista_general',
        categoryTitle: 'Menú de Especialista UGEL',
        items: [
          { key: 'especialista_miCuenta', labelOriginal: 'Mi cuenta', description: 'Perfil del especialista', route: '/mi-cuenta' },
          { key: 'especialista_directivos', labelOriginal: 'Directivos', description: 'Título del grupo de directivos' },
          { key: 'especialista_directivos_seguimiento', labelOriginal: 'Seguimiento y retroalimentación', description: 'Supervisión a directores', route: '/especialistas/evaluaciones-director' },
          { key: 'especialista_directivos_cobertura', labelOriginal: 'Cobertura curricular', description: 'Cobertura a nivel institucional', route: '/especialistas/cobertura-curricular' },
          { key: 'especialista_directivos_crear', labelOriginal: 'Crear directivo', description: 'Registro de directores', route: '/especialistas/agregar-directores' },
          { key: 'especialista_docentes', labelOriginal: 'Docentes', description: 'Título del grupo de docentes' },
          { key: 'especialista_docentes_usuarios', labelOriginal: 'Usuarios', description: 'Listado de docentes de la UGEL', route: '/admin/docentes/usuarios' },
          { key: 'especialista_autorreporte', labelOriginal: 'Autorreporte', description: 'Autorreporte del especialista', route: '/especialistas/autoreporte' },
          { key: 'especialista_estudiantes', labelOriginal: 'Estudiantes', description: 'Título del grupo de estudiantes' },
          { key: 'especialista_estudiantes_seguimiento', labelOriginal: 'Seguimiento de aprendizaje', description: 'Evaluaciones generales de estudiantes', route: '/especialistas/evaluaciones' },
        ],
      },
    ],
  },
  {
    roleId: 'general',
    roleName: 'Cabecera y General',
    roleBadge: 'Común',
    icon: 'RiGlobalLine',
    categories: [
      {
        categoryId: 'cabecera_general',
        categoryTitle: 'Encabezado del Sidebar',
        items: [
          { key: 'sidebar_tituloSistema', labelOriginal: 'Competence-Lab', description: 'Nombre o marca del sistema en la cabecera' },
          { key: 'sidebar_subtituloPrefix', labelOriginal: 'ugel', description: 'Prefijo antes del nombre de la región (ej. "ugel", "dre")' },
        ],
      },
    ],
  },
];
