import React from 'react';
import { 
  MdDashboard, 
  MdPeople, 
  MdSettings, 
  MdAssignment, 
  MdAttachMoney, 
  MdAccountBalance, 
  MdSchool, 
  MdMenuBook, 
  MdPieChart, 
  MdTrendingUp, 
  MdFolder, 
  MdLink, 
  MdBookmark, 
  MdStar, 
  MdCheckCircle, 
  MdDescription, 
  MdPsychology,
  MdBarChart, 
  MdTableChart, 
  MdViewModule,
  MdAccountCircle,
  MdLayers,
  MdPublic
} from 'react-icons/md';
import { 
  FaUserGraduate, 
  FaUserTie, 
  FaUsers, 
  FaGraduationCap, 
  FaChalkboardTeacher, 
  FaBook, 
  FaGlobe 
} from 'react-icons/fa';
import { 
  LuListTodo, 
  LuExternalLink, 
  LuLayers, 
  LuSparkles,
  LuFileSpreadsheet,
  LuFolderGit2
} from 'react-icons/lu';
import { 
  RiExternalLinkLine, 
  RiFoldersLine, 
  RiAppsLine,
  RiFolderShield2Line,
  RiGlobalLine
} from 'react-icons/ri';

export type CustomItemRole = 'admin' | 'director' | 'docente' | 'especialista' | 'all';
export type CustomTargetType = 'internal' | 'external' | 'none';

export interface CustomSidebarItem {
  id: string; // ID único ej: "custom_1728591823"
  label: string; // Título visible del menú o submenú
  role: CustomItemRole; // Rol al que va dirigido
  parentId?: string; // ID del menú padre si es un submenú (ej. "especialista_docentes")
  targetType: CustomTargetType; // 'internal' (catálogo) | 'external' (URL externa) | 'none' (sin ruta / contenedor)
  route: string; // Ruta interna elegida del catálogo (ej. "/admin/pizarra"), URL externa o vacía si no tiene ruta
  openInNewTab?: boolean; // Abrir en nueva pestaña (por defecto true para externos)
  iconName?: string; // Nombre del icono del catálogo
  order?: number; // Prioridad visual
  createdAt?: string; // Fecha de creación ISO
}

/**
 * Catálogo completo y seguro de rutas existentes en la plataforma EVA.
 * Garantiza que cualquier menú interno direccionará a una página real sin errores 404.
 */
export interface CatalogRouteOption {
  route: string;
  label: string;
  category: 'Administración' | 'Especialistas' | 'Directores' | 'Docentes' | 'General';
  description: string;
  suggestedIcon: string;
}

export const PLATFORM_ROUTES_CATALOG: CatalogRouteOption[] = [
  // === ADMINISTRACIÓN ===
  {
    route: '/admin/pruebas',
    label: 'Pizarra de Evaluaciones',
    category: 'Administración',
    description: 'Tablero Kanban y matriz de pruebas pedagógicas',
    suggestedIcon: 'MdAssignment',
  },
  {
    route: '/admin/gestion-usuarios',
    label: 'Gestión de Usuarios',
    category: 'Administración',
    description: 'Creación y administración de cuentas de usuario',
    suggestedIcon: 'MdPeople',
  },
  {
    route: '/admin/configuracion',
    label: 'Configuración General',
    category: 'Administración',
    description: 'Ajustes globales y parámetros del sistema',
    suggestedIcon: 'MdSettings',
  },
  {
    route: '/admin/configuracion/personalizacion',
    label: 'Personalización de Marca',
    category: 'Administración',
    description: 'Ajustes de marca, colores y nombres del menú',
    suggestedIcon: 'LuSparkles',
  },
  {
    route: '/admin/matriz-costos',
    label: 'Matriz de Costos',
    category: 'Administración',
    description: 'Presupuestos y costos de evaluaciones',
    suggestedIcon: 'MdAttachMoney',
  },
  {
    route: '/admin/matriz-resultados',
    label: 'Matriz de Resultados',
    category: 'Administración',
    description: 'Consolidado general de calificaciones por UGEL',
    suggestedIcon: 'MdTrendingUp',
  },
  {
    route: '/admin/estandares',
    label: 'Estándares de Aprendizaje',
    category: 'Administración',
    description: 'Competencias, capacidades y desempeños',
    suggestedIcon: 'MdSchool',
  },
  {
    route: '/admin/conocimientos-pedagogicos',
    label: 'Conocimientos Pedagógicos',
    category: 'Administración',
    description: 'Evaluaciones y bancos de conocimiento',
    suggestedIcon: 'MdMenuBook',
  },

  // === ESPECIALISTAS ===
  {
    route: '/especialistas/evaluaciones',
    label: 'Evaluaciones de Estudiantes',
    category: 'Especialistas',
    description: 'Monitoreo de resultados de estudiantes por nivel',
    suggestedIcon: 'FaUserGraduate',
  },
  {
    route: '/especialistas/evaluaciones-docentes',
    label: 'Evaluaciones a Docentes',
    category: 'Especialistas',
    description: 'Monitoreo y pruebas de mediación didáctica',
    suggestedIcon: 'FaUserTie',
  },
  {
    route: '/especialistas/evaluaciones-director',
    label: 'Evaluaciones a Directores',
    category: 'Especialistas',
    description: 'Seguimiento y retroalimentación directiva',
    suggestedIcon: 'MdAccountBalance',
  },
  {
    route: '/especialistas/cobertura-curricular',
    label: 'Cobertura Curricular',
    category: 'Especialistas',
    description: 'Avance y cobertura curricular en la UGEL',
    suggestedIcon: 'MdPieChart',
  },
  {
    route: '/especialistas/agregar-directores',
    label: 'Directorio de Directivos',
    category: 'Especialistas',
    description: 'Creación y gestión de directores de instituciones',
    suggestedIcon: 'FaUsers',
  },
  {
    route: '/especialistas/autoreporte',
    label: 'Autorreporte de Especialista',
    category: 'Especialistas',
    description: 'Fichas e instrumentos de autorreporte UGEL',
    suggestedIcon: 'LuListTodo',
  },

  // === DIRECTORES ===
  {
    route: '/directores/evaluaciones',
    label: 'Evaluaciones de la IE',
    category: 'Directores',
    description: 'Resultados de aprendizaje de los estudiantes de la IE',
    suggestedIcon: 'FaUserGraduate',
  },
  {
    route: '/directores/evaluaciones-docentes',
    label: 'Evaluaciones a Docentes',
    category: 'Directores',
    description: 'Seguimiento y mediación didáctica docente',
    suggestedIcon: 'FaUserTie',
  },
  {
    route: '/directores/cobertura-curricular',
    label: 'Cobertura Curricular IE',
    category: 'Directores',
    description: 'Avance curricular institucional por grado',
    suggestedIcon: 'MdPieChart',
  },
  {
    route: '/directores/agregar-profesores',
    label: 'Gestión de Docentes',
    category: 'Directores',
    description: 'Directorio y asignación de docentes de la IE',
    suggestedIcon: 'FaUsers',
  },

  // === DOCENTES ===
  {
    route: '/docentes/evaluaciones',
    label: 'Evaluaciones y Pruebas',
    category: 'Docentes',
    description: 'Banco de pruebas y registro de respuestas',
    suggestedIcon: 'FaUserGraduate',
  },
  {
    route: '/docentes/estudiantes',
    label: 'Mis Estudiantes',
    category: 'Docentes',
    description: 'Nómina de alumnos y secciones a cargo',
    suggestedIcon: 'FaUsers',
  },
  {
    route: '/docentes/conocimiento-pedagogico',
    label: 'Conocimiento Pedagógico',
    category: 'Docentes',
    description: 'Capacitación y desarrollo profesional docente',
    suggestedIcon: 'MdMenuBook',
  },
  {
    route: '/docentes/psicolinguistica',
    label: 'Evaluación Psicolingüística',
    category: 'Docentes',
    description: 'Pruebas y diagnósticos de lenguaje y expresión',
    suggestedIcon: 'MdPsychology',
  },

  // === GENERAL ===
  {
    route: '/mi-cuenta',
    label: 'Mi Cuenta',
    category: 'General',
    description: 'Perfil de usuario y credenciales personales',
    suggestedIcon: 'MdAccountCircle',
  },
  {
    route: '/autorreporte',
    label: 'Autorreporte General',
    category: 'General',
    description: 'Portal unificado de autorreportes institucionales',
    suggestedIcon: 'LuListTodo',
  },
  {
    route: '/evaluaciones',
    label: 'Portal General de Evaluaciones',
    category: 'General',
    description: 'Acceso unificado a las evaluaciones del sistema',
    suggestedIcon: 'MdFolder',
  },
];

/**
 * Catálogo de iconos seleccionables por el usuario para menús personalizados
 */
export interface AvailableIconOption {
  name: string;
  label: string;
  component: React.ComponentType<{ className?: string }>;
}

export const AVAILABLE_ICONS: AvailableIconOption[] = [
  { name: 'MdLink', label: 'Enlace', component: MdLink },
  { name: 'RiExternalLinkLine', label: 'Enlace Externo', component: RiExternalLinkLine },
  { name: 'MdAssignment', label: 'Evaluación / Tarea', component: MdAssignment },
  { name: 'MdDashboard', label: 'Tablero', component: MdDashboard },
  { name: 'FaUserGraduate', label: 'Estudiantes', component: FaUserGraduate },
  { name: 'FaUserTie', label: 'Docente', component: FaUserTie },
  { name: 'FaUsers', label: 'Usuarios / Equipo', component: FaUsers },
  { name: 'MdAccountBalance', label: 'Institución', component: MdAccountBalance },
  { name: 'MdFolder', label: 'Carpeta', component: MdFolder },
  { name: 'MdSchool', label: 'Educación', component: MdSchool },
  { name: 'MdMenuBook', label: 'Libro / Guía', component: MdMenuBook },
  { name: 'MdPieChart', label: 'Gráfico / Cobertura', component: MdPieChart },
  { name: 'MdTrendingUp', label: 'Resultados', component: MdTrendingUp },
  { name: 'LuListTodo', label: 'Reporte / Lista', component: LuListTodo },
  { name: 'MdSettings', label: 'Configuración', component: MdSettings },
  { name: 'MdBookmark', label: 'Marcador', component: MdBookmark },
  { name: 'MdStar', label: 'Destacado', component: MdStar },
  { name: 'MdCheckCircle', label: 'Completado', component: MdCheckCircle },
  { name: 'MdDescription', label: 'Documento', component: MdDescription },
  { name: 'MdBarChart', label: 'Estadísticas', component: MdBarChart },
  { name: 'MdTableChart', label: 'Tabla de Datos', component: MdTableChart },
  { name: 'MdPublic', label: 'Web Pública', component: MdPublic },
  { name: 'LuSparkles', label: 'Especial', component: LuSparkles },
];

const ICONS_MAP: Record<string, React.ComponentType<{ className?: string }>> = {
  MdLink,
  RiExternalLinkLine,
  MdAssignment,
  MdDashboard,
  FaUserGraduate,
  FaUserTie,
  FaUsers,
  MdAccountBalance,
  MdFolder,
  MdSchool,
  MdMenuBook,
  MdPieChart,
  MdTrendingUp,
  LuListTodo,
  MdSettings,
  MdBookmark,
  MdStar,
  MdCheckCircle,
  MdDescription,
  MdBarChart,
  MdTableChart,
  MdPublic,
  LuSparkles,
  MdAccountCircle,
  MdPeople,
  MdAttachMoney,
  MdPsychology,
};

/**
 * Renderiza de forma segura un icono según su nombre de catálogo con fallback
 */
export const renderCustomSidebarIcon = (iconName?: string, className?: string): React.ReactElement => {
  if (iconName && ICONS_MAP[iconName]) {
    const Component = ICONS_MAP[iconName];
    return <Component className={className || 'text-base'} />;
  }
  return <MdBookmark className={className || 'text-base'} />;
};

/**
 * Opciones de menús padres disponibles por rol para anidar submenús
 */
export interface ParentMenuOption {
  id: string;
  label: string;
  role: CustomItemRole;
}

export const PARENT_MENUS_BY_ROLE: ParentMenuOption[] = [
  // Especialistas
  { id: 'especialista_directivos', label: 'Directivos', role: 'especialista' },
  { id: 'especialista_docentes', label: 'Docentes', role: 'especialista' },
  { id: 'especialista_estudiantes', label: 'Estudiantes', role: 'especialista' },

  // Directores
  { id: 'director_estudiantes', label: 'Estudiantes', role: 'director' },
  { id: 'director_docentes', label: 'Docentes', role: 'director' },
  { id: 'director_autorreporte', label: 'Autorreporte', role: 'director' },

  // Docentes
  { id: 'docente_seguimiento', label: 'Seguimiento de aprendizajes', role: 'docente' },
  { id: 'docente_estudiantes', label: 'Mis Estudiantes', role: 'docente' },
  { id: 'docente_autorreporte', label: 'Autorreporte', role: 'docente' },

  // Administrador
  { id: 'admin_especialistas', label: 'Especialistas', role: 'admin' },
  { id: 'admin_directores', label: 'Directores', role: 'admin' },
  { id: 'admin_docentes', label: 'Docentes', role: 'admin' },
  { id: 'admin_estudiantes', label: 'Estudiantes', role: 'admin' },
];
