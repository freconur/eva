import { FeatureCostoItem } from './exportarMatrizCostosPDF';

export interface DetectedFeature extends Omit<FeatureCostoItem, 'id'> {
  archivos: string[];
  seleccionada?: boolean;
}

export const CATALOGO_FEATURES_CODIGO: Omit<DetectedFeature, 'tarifaPorHora' | 'costoTotal'>[] = [
  {
    titulo: 'Matriz de Resultados y Analítica de Logros Estudiantiles',
    modulo: 'Evaluaciones de Estudiantes',
    tipo: 'Nueva Feature',
    modalidad: 'horas',
    horasEstimadas: 14,
    horasReales: 14,
    estado: 'Completado',
    prioridad: 'Alta',
    descripcion:
      'Página de matriz visual con consolidado de notas por grado, sección, niveles de logro (Satisfactorio, Proceso, Inicio, Previo) y cálculo automático de porcentajes.',
    archivos: [
      'pages/admin/matriz-resultados/index.tsx',
      'components/evaluaciones/',
      'features/hooks/useAgregarEvaluaciones.tsx'
    ],
    notas: 'Incluye filtros por institución y periodo escolar.'
  },
  {
    titulo: 'Motor de Validaciones Estrictas para Activación de Evaluaciones',
    modulo: 'Evaluaciones de Estudiantes',
    tipo: 'Seguridad y Validación',
    modalidad: 'horas',
    horasEstimadas: 8,
    horasReales: 8,
    estado: 'Completado',
    prioridad: 'Crítica',
    descripcion:
      'Validaciones antes de cambiar active a true: configuración previa de nivelYPuntaje, mínimo 1 pregunta, puntaje individual >= 1 y suma total exacta al valor máximo del nivel.',
    archivos: [
      'pages/admin/evaluaciones/index.tsx',
      'features/hooks/useAgregarEvaluaciones.tsx'
    ],
    notas: 'Regla de negocio obligatoria según especificación de proyecto.'
  },
  {
    titulo: 'Modo de Protección y Bloqueo para Evaluaciones Activas',
    modulo: 'Evaluaciones de Estudiantes',
    tipo: 'Seguridad y Validación',
    modalidad: 'horas',
    horasEstimadas: 10,
    horasReales: 10,
    estado: 'Completado',
    prioridad: 'Alta',
    descripcion:
      'Bloqueo de edición, eliminación, dnd-kit drag-and-drop y visualización de puntajes en badge de solo lectura cuando evaluacion.active === true para garantizar la integridad de resultados.',
    archivos: [
      'components/tabla-preguntas/',
      'components/QuestionNavigator/',
      'pages/admin/evaluaciones/index.tsx'
    ],
    notas: 'Oculta controles de mutación y muestra banner preventivo.'
  },
  {
    titulo: 'Gestor Dinámico de Preguntas y Alternativas (Modal y Teclado)',
    modulo: 'Evaluaciones de Estudiantes',
    tipo: 'Nueva Feature',
    modalidad: 'horas',
    horasEstimadas: 10,
    horasReales: 10,
    estado: 'Completado',
    prioridad: 'Media',
    descripcion:
      'Modal interactivo con autofocus automático en textarea de pregunta, atajos de teclado (Enter para guardar, Esc para cancelar), número dinámico de pregunta e indicador isSaving contra doble envío.',
    archivos: [
      'modals/agregarPreguntasYRespuestas/',
      'modals/updatePreguntaRespuesta/',
      'components/tabla-preguntas/'
    ],
    notas: 'Puntaje opcional en creación según especificaciones del portal.'
  },
  {
    titulo: 'Toma de Prueba y Calificación en Tiempo Real de Estudiantes',
    modulo: 'Evaluaciones de Estudiantes',
    tipo: 'Nueva Feature',
    modalidad: 'horas',
    horasEstimadas: 14,
    horasReales: 14,
    estado: 'Completado',
    prioridad: 'Alta',
    descripcion:
      'Flujo para registrar respuestas de estudiantes por preguntas, computar puntaje acumulado y asignar automáticamente el nivel de logro correspondiente.',
    archivos: [
      'modals/evaluarEstudiante/',
      'pages/evaluaciones/index.tsx',
      'components/evaluar/'
    ],
    notas: 'Soporte para múltiples formatos y tipos de evaluación.'
  },
  {
    titulo: 'Carga Masiva y Gestión de Nómina de Estudiantes',
    modulo: 'Evaluaciones de Estudiantes',
    tipo: 'Nueva Feature',
    modalidad: 'horas',
    horasEstimadas: 8,
    horasReales: 8,
    estado: 'Completado',
    prioridad: 'Media',
    descripcion:
      'Componente de importación de estudiantes por grado y sección, asociación con directores y docentes, y edición de datos del estudiante.',
    archivos: [
      'components/importarEstudiantes/',
      'pages/docentes/estudiantes/index.tsx'
    ],
    notas: 'Permite asociar nóminas con códigos modulares.'
  },
  {
    titulo: 'Sistema de Rúbricas y Monitoreo Didáctico a Docentes',
    modulo: 'Evaluaciones de Docentes',
    tipo: 'Nueva Feature',
    modalidad: 'horas',
    horasEstimadas: 16,
    horasReales: 16,
    estado: 'Completado',
    prioridad: 'Crítica',
    descripcion:
      'Módulo de mediación didáctica para directores y especialistas. Incluye rúbricas de monitoreo pedagógico, niveles de desempeño y retroalimentación docente.',
    archivos: [
      'components/rubrica-monitoreo/',
      'pages/directores/evaluaciones-docentes/',
      'modals/crearEvaluacionDocente/',
      'modals/evaluarDocente/'
    ],
    notas: 'Compatible con reportes individuales y grupales de docentes.'
  },
  {
    titulo: 'Evaluación de Conocimientos Pedagógicos y Autorreporte',
    modulo: 'Evaluaciones de Docentes',
    tipo: 'Nueva Feature',
    modalidad: 'horas',
    horasEstimadas: 12,
    horasReales: 12,
    estado: 'Completado',
    prioridad: 'Alta',
    descripcion:
      'Módulo para evaluación de conocimientos pedagógicos y autorreporte docente sobre competencias curriculares y metodologías de enseñanza.',
    archivos: [
      'pages/admin/conocimientos-pedagogicos/index.tsx',
      'pages/docentes/conocimiento-pedagogico/index.tsx',
      'pages/autorreporte/index.tsx'
    ],
    notas: 'Segmentado por niveles educativos y áreas de aprendizaje.'
  },
  {
    titulo: 'Monitoreo a Directores de Instituciones por Especialistas',
    modulo: 'Evaluaciones de Directores',
    tipo: 'Nueva Feature',
    modalidad: 'horas',
    horasEstimadas: 14,
    horasReales: 14,
    estado: 'Completado',
    prioridad: 'Alta',
    descripcion:
      'Instrumento de seguimiento y retroalimentación a la gestión directiva aplicado por especialistas de UGEL.',
    archivos: [
      'pages/especialistas/evaluaciones-director/',
      'modals/crearEvaluacionDirector/',
      'modals/evaluarDirector/'
    ],
    notas: 'Genera estadísticas consolidadas por red educativa.'
  },
  {
    titulo: 'Gestión Institucional de Directores y Perfil Director',
    modulo: 'Evaluaciones de Directores',
    tipo: 'Nueva Feature',
    modalidad: 'horas',
    horasEstimadas: 8,
    horasReales: 8,
    estado: 'Completado',
    prioridad: 'Media',
    descripcion:
      'Registro y asociación de directores, códigos modulares de colegios, y modal obligatorio de configuración de perfil incompleto.',
    archivos: [
      'pages/admin/agregar-directores/',
      'modals/ModalConfigurarPerfilDirector.tsx',
      'directores.ts'
    ],
    notas: 'Valida datos de contacto y sedes asignadas.'
  },
  {
    titulo: 'Configuración Regional de Dimensiones, Escalas y Fases',
    modulo: 'Módulo de Especialistas',
    tipo: 'Nueva Feature',
    modalidad: 'horas',
    horasEstimadas: 12,
    horasReales: 12,
    estado: 'Completado',
    prioridad: 'Alta',
    descripcion:
      'Modales de configuración de parámetros regionales: definición de dimensiones de monitoreo, escalas valorativas, fases de supervisión y niveles por dominio.',
    archivos: [
      'modals/ConfigurarDimensionEspecialistas/',
      'modals/ConfigurarEscalaEspecialistas/',
      'modals/ConfigurarNivelesPorDominio/'
    ],
    notas: 'Permite personalizar los criterios de evaluación por UGEL.'
  },
  {
    titulo: 'Módulo de Cobertura Curricular Master y Seguimiento de Avance',
    modulo: 'Cobertura Curricular',
    tipo: 'Nueva Feature',
    modalidad: 'horas',
    horasEstimadas: 14,
    horasReales: 14,
    estado: 'Completado',
    prioridad: 'Alta',
    descripcion:
      'Seguimiento del progreso curricular respecto a la malla programada por grado y área para directores y especialistas.',
    archivos: [
      'pages/especialistas/cobertura-curricular-master/',
      'pages/directores/cobertura-curricular/',
      'modals/mallaCurricular/'
    ],
    notas: 'Incluye reportes consolidados por grado y periodo.'
  },
  {
    titulo: 'Módulo Especializado de Evaluaciones Psicolingüísticas',
    modulo: 'Evaluaciones de Estudiantes',
    tipo: 'Nueva Feature',
    modalidad: 'horas',
    horasEstimadas: 16,
    horasReales: 16,
    estado: 'Completado',
    prioridad: 'Alta',
    descripcion:
      'Creación, administración y toma de pruebas psicolingüísticas para diagnóstico de habilidades lectoras y de comprensión en estudiantes.',
    archivos: [
      'pages/admin/psicolinguistica/',
      'pages/docentes/psicolinguistica/',
      'modals/crearEvaluacionPsicolinguitica/',
      'modals/agregarPreguntasPsicolinguisticas/'
    ],
    notas: 'Dispone de baremos y clasificaciones psicopedagógicas.'
  },
  {
    titulo: 'Exportación de Matriz Heatmap de Aprendizajes a PDF',
    modulo: 'Reportes y Gráficas PDF/Excel',
    tipo: 'Nueva Feature',
    modalidad: 'horas',
    horasEstimadas: 10,
    horasReales: 10,
    estado: 'Completado',
    prioridad: 'Alta',
    descripcion:
      'Generación de informe en formato PDF horizontal (A4) usando jsPDF y jspdf-autotable, con estilos semafóricos por logro y resumen estadístico.',
    archivos: [
      'features/utils/exportarGrillaHeatmapPDF.ts',
      'components/pdf/'
    ],
    notas: 'Diseño optimizado para impresión y distribución a directores.'
  },
  {
    titulo: 'Dashboard de Gráficos Analíticos de Tendencias y Ranking',
    modulo: 'Reportes y Gráficas PDF/Excel',
    tipo: 'Mejora / Refactor',
    modalidad: 'horas',
    horasEstimadas: 12,
    horasReales: 12,
    estado: 'Completado',
    prioridad: 'Alta',
    descripcion:
      'Integración de Chart.js y react-chartjs-2 para visualización de gráficos de tendencia mensual, flechas de desempeño y rankings institucionales.',
    archivos: [
      'components/grafico-tendencia/',
      'components/reportes/'
    ],
    notas: 'Paletas de colores contrastadas y tooltips informativos.'
  },
  {
    titulo: 'Sistema de Seguridad: PIN de Recuperación y Preguntas Secretas',
    modulo: 'Seguridad y Permisos',
    tipo: 'Seguridad y Validación',
    modalidad: 'horas',
    horasEstimadas: 10,
    horasReales: 10,
    estado: 'Completado',
    prioridad: 'Alta',
    descripcion:
      'Flujo de onboarding de seguridad que exige PIN secreto, preguntas de seguridad y restablecimiento de contraseña en primer inicio de sesión.',
    archivos: [
      'modals/ModalConfigurarSeguridad.tsx',
      'modals/ModalRecuperarContrasena/',
      'features/hooks/useUsuario.ts'
    ],
    notas: 'Protección para evitar accesos con credenciales iniciales por defecto.'
  },
  {
    titulo: 'Modo de Auditoría en Tiempo Real de Solo Lectura',
    modulo: 'Auditoría y Trazabilidad',
    tipo: 'Seguridad y Validación',
    modalidad: 'horas',
    horasEstimadas: 8,
    horasReales: 8,
    estado: 'Completado',
    prioridad: 'Media',
    descripcion:
      'Mecanismo de inspección segura que permite a administradores revisar la vista exacta de cualquier usuario bloqueando mutaciones accidentales en Firestore.',
    archivos: [
      'features/hooks/useUsuario.ts',
      'components/layouts/LayoutMenu.tsx'
    ],
    notas: 'Uso de sessionStorage (audited_user) y toasts de advertencia.'
  },
  {
    titulo: 'Control de Acceso Basado en Roles (RBAC) y PermissionGate',
    modulo: 'Seguridad y Permisos',
    tipo: 'Seguridad y Validación',
    modalidad: 'horas',
    horasEstimadas: 10,
    horasReales: 10,
    estado: 'Completado',
    prioridad: 'Alta',
    descripcion:
      'Definición de permisos declarativos y componente PermissionGate para renderizado condicional según roles (Admin: 4, Especialista: 1, Director: 2, Docente: 3).',
    archivos: [
      'components/permissions/PermissionGate.tsx',
      'features/utils/permissions.ts'
    ],
    notas: 'Desacopla lógica de permisos de las vistas individuales.'
  },
  {
    titulo: 'Personalización Dinámica de Branding y Temas Visuales',
    modulo: 'Infraestructura y Base de Datos (Firestore)',
    tipo: 'Nueva Feature',
    modalidad: 'horas',
    horasEstimadas: 8,
    horasReales: 8,
    estado: 'Completado',
    prioridad: 'Media',
    descripcion:
      'Configuración de colores institucionales en Firestore con inyección dinámica de CSS custom properties y algoritmo YIQ para cálculo de contraste automático.',
    archivos: [
      'pages/admin/configuracion/index.tsx',
      'components/layouts/LayoutMenu.tsx'
    ],
    notas: 'Garantiza legibilidad de textos sobre cualquier fondo personalizado.'
  },
  {
    titulo: 'Gestión Centralizada de Usuarios y Solicitudes de Reseteo',
    modulo: 'Gestión de Usuarios y Roles',
    tipo: 'Nueva Feature',
    modalidad: 'horas',
    horasEstimadas: 10,
    horasReales: 10,
    estado: 'Completado',
    prioridad: 'Media',
    descripcion:
      'Panel de administración de usuarios, edición de roles, y listener en tiempo real para atender solicitudes de reseteo de contraseñas con badge en sidebar.',
    archivos: [
      'pages/admin/gestion-usuarios/index.tsx',
      'components/sidebar/SidebarAdmin.tsx'
    ],
    notas: 'Escucha reactiva con onSnapshot sobre solicitudes_reseteo.'
  },
  {
    titulo: 'Matriz de Costos de Desarrollo y Exportación de Cotización en PDF',
    modulo: 'Infraestructura y Base de Datos (Firestore)',
    tipo: 'Nueva Feature',
    modalidad: 'horas',
    horasEstimadas: 12,
    horasReales: 12,
    estado: 'Completado',
    prioridad: 'Alta',
    descripcion:
      'Módulo privado para costeo de funcionalidades, escaneo de arquitectura de código, KPIs en vivo y generación de informes de liquidación en PDF formal.',
    archivos: [
      'pages/admin/matriz-costos/index.tsx',
      'features/utils/exportarMatrizCostosPDF.ts',
      'components/matriz-costos/'
    ],
    notas: 'Acceso restringido por DNI y persistencia en Firestore.'
  }
];

export function getFeaturesDetectadas(hourlyRate: number): DetectedFeature[] {
  const rate = hourlyRate > 0 ? hourlyRate : 50;
  const hoy = new Date().toISOString().split('T')[0];

  return CATALOGO_FEATURES_CODIGO.map((f) => {
    const horas = f.horasReales || f.horasEstimadas || 0;
    return {
      ...f,
      tarifaPorHora: rate,
      costoTotal: Math.round(horas * rate * 100) / 100,
      fecha: hoy,
      seleccionada: true
    };
  });
}
