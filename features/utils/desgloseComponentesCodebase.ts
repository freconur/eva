import { FeatureCostoItem, SubItemDetallado } from './exportarMatrizCostosPDF';

export interface SubFeatureComponente extends Omit<FeatureCostoItem, 'id' | 'tarifaPorHora' | 'costoTotal'> {
  archivos: string[];
  seleccionada?: boolean;
}

export interface ComponenteAnalizado {
  id: string;
  nombre: string;
  rutaPrincipal: string;
  modulo: string;
  descripcionGeneral: string;
  subFeatures: SubFeatureComponente[];
}

export const COMPONENTES_DESGLOSADOS: ComponenteAnalizado[] = [
  {
    id: 'matriz-resultados',
    nombre: 'Matriz Principal Multi-Etapa y Reportes (EDI, EP1, EP2)',
    rutaPrincipal: 'pages/admin/matriz-resultados/index.tsx',
    modulo: 'Evaluaciones de Estudiantes',
    descripcionGeneral:
      'Módulo troncal de análisis pedagógico que correlaciona las evaluaciones diagnóstica (EDI) y procesales (EP1, EP2), desglosado con cada tarea y funcionalidad desarrollada para su funcionamiento.',
    subFeatures: [
      {
        codigo: 'F-001',
        titulo: 'Funcionalidad: Vista completa para gráfico desempeño por institución o directores y lógica para filtrar y organizar por nivel',
        modulo: 'Reportes y Gráficas PDF/Excel',
        tipo: 'Nueva Feature',
        modalidad: 'horas',
        horasEstimadas: 4,
        horasReales: 4,
        estado: 'Completado',
        prioridad: 'Alta',
        descripcion:
          'Desarrollo de vista completa y lógica por nivel Directores, gráficos de desempeño consolidado por institución y filtros por nivel alcanzado.',
        subItems: [
          {
            codigo: '1.1',
            descripcion: 'Desarrollo de vista completa y lógica por nivel Directores',
            horas: 1
          },
          {
            codigo: '1.2',
            descripcion: 'Desarrollo vista completa para gráfico desempeño por institución o director',
            horas: 1
          },
          {
            codigo: '1.3',
            descripcion: 'Desarrollo feature de filtro y organización por nivel según puntaje alcanzado',
            horas: 2
          }
        ],
        archivos: [
          'components/reportes/PanelVisualizacionesMatriz.tsx',
          'components/grafico-tendencia/'
        ],
        notas: 'Permite filtrar el rendimiento según directores e instituciones.'
      },
      {
        codigo: 'F-002',
        titulo: 'Funcionalidad: Vista completa para gráfico desempeño por docentes y lógica para filtrar y organizar por nivel',
        modulo: 'Reportes y Gráficas PDF/Excel',
        tipo: 'Nueva Feature',
        modalidad: 'horas',
        horasEstimadas: 3,
        horasReales: 3,
        estado: 'Completado',
        prioridad: 'Alta',
        descripcion:
          'Desarrollo de vista completa y lógica por nivel Profesores, gráficos analíticos por docente y clasificación por puntaje obtenido.',
        subItems: [
          {
            codigo: '2.1',
            descripcion: 'Desarrollo vista completa para gráfico desempeño por docentes o aula',
            horas: 1
          },
          {
            codigo: '2.2',
            descripcion: 'Desarrollo feature de filtro y organización por nivel según puntaje alcanzado',
            horas: 2
          }
        ],
        archivos: [
          'components/reportes/PanelVisualizacionesMatriz.tsx',
          'components/reportes/TablaMatrizComparativa.tsx'
        ],
        notas: 'Permite a los directivos evaluar el rendimiento pedagógico por docente.'
      },
      {
        codigo: 'F-003',
        titulo: 'Funcionalidad: Exportar archivo excel para reporte consolidado',
        modulo: 'Reportes y Gráficas PDF/Excel',
        tipo: 'Nueva Feature',
        modalidad: 'horas',
        horasEstimadas: 4,
        horasReales: 4,
        estado: 'Completado',
        prioridad: 'Alta',
        descripcion:
          'Desarrollo de lógica para renderización de datos para exportación de excel con columnas tipológicas de escuela y consolidados de directores.',
        subItems: [
          {
            codigo: '3.1',
            descripcion: 'Adición de nueva columna en la tabla de excel a exportar archivo excel estudiantes: Unidocente, multigrado, polidocente, distrito, área, tipo de gestión',
            horas: 2
          },
          {
            codigo: '3.2',
            descripcion: 'Desarrollo de adición de nueva columna en la exportación de archivo de excel consolidado directores',
            horas: 2
          }
        ],
        archivos: [
          'components/reportes/TablaMatrizComparativa.tsx',
          'fuctions/exportarExcel.ts'
        ],
        notas: 'Consolidado oficial compatible con el SIAGIE y reportes de UGEL.'
      },
      {
        codigo: 'F-004',
        titulo: 'Funcionalidad: Gráfico Cobertura de Instituciones (Institución que han participado en la evaluación)',
        modulo: 'Reportes y Gráficas PDF/Excel',
        tipo: 'Nueva Feature',
        modalidad: 'horas',
        horasEstimadas: 7,
        horasReales: 7,
        estado: 'Completado',
        prioridad: 'Alta',
        descripcion:
          'Desarrollo de lógica para renderización de datos de directores participantes por nivel educativo, nuevas propiedades y tabla interactiva con dropdowns.',
        subItems: [
          {
            codigo: '4.1',
            descripcion: 'Desarrollo de lógica para renderizar directores del nivel de la evaluación (inicial, primaria o secundaria)',
            horas: 2
          },
          {
            codigo: '4.2',
            descripcion: 'Desarrollo de lógica para agregar nuevas propiedades a los directores para la evaluación',
            horas: 2
          },
          {
            codigo: '4.3',
            descripcion: 'Desarrollo de feature para la tabla, renderización para nuevas propiedades y dropdown (filtros)',
            horas: 3
          }
        ],
        archivos: [
          'components/reportes/PanelVisualizacionesMatriz.tsx',
          'components/modals/GuiaDecisionesModal.tsx'
        ],
        notas: 'Monitorea el porcentaje de colegios que completaron las evaluaciones.'
      },
      {
        codigo: 'F-005',
        titulo: 'Funcionalidad: Desarrollo de feature para ajustes de color de diseño',
        modulo: 'Diseño UI/UX y Navegación',
        tipo: 'Mejora / Refactor',
        modalidad: 'horas',
        horasEstimadas: 5,
        horasReales: 5,
        estado: 'Completado',
        prioridad: 'Alta',
        descripcion:
          'Desarrollo de componente para gestión de diseño y branding en componentes sidebar, página de login y tarjetas de cursos.',
        subItems: [
          {
            codigo: '5.1',
            descripcion: 'Desarrollo de lógica para la gestión de color branding del componente sidebar',
            horas: 2
          },
          {
            codigo: '5.2',
            descripcion: 'Desarrollo de lógica para la gestión de color branding del componente Página de Login',
            horas: 1
          },
          {
            codigo: '5.3',
            descripcion: 'Desarrollo de lógica para la gestión de color branding del componente Tarjetas de Cursos',
            horas: 2
          }
        ],
        archivos: [
          'components/sidebar/',
          'components/layouts/LayoutMenu.tsx'
        ],
        notas: 'Personalización institucional del portal EVA.'
      },
      {
        codigo: 'F-006',
        titulo: 'Funcionalidad: Desarrollo de feature gestión de estudiantes',
        modulo: 'Gestión de Usuarios y Roles',
        tipo: 'Nueva Feature',
        modalidad: 'horas',
        horasEstimadas: 6,
        horasReales: 6,
        estado: 'Completado',
        prioridad: 'Alta',
        descripcion:
          'Desarrollo del componente gestión de estudiantes: estructura, diseño, importación/exportación de Excel, tabla de alumnos y filtros por grado y sección.',
        subItems: [
          {
            codigo: '6.1',
            descripcion: 'Desarrollo del componente gestión de estudiantes estructura y diseño',
            horas: 2
          },
          {
            codigo: '6.2',
            descripcion: 'Desarrollo de importación y exportación de lógica para rehúso en el componente de importación por excel',
            horas: 1
          },
          {
            codigo: '6.3',
            descripcion: 'Desarrollo de la lógica para renderización de estudiantes en tabla',
            horas: 1
          },
          {
            codigo: '6.4',
            descripcion: 'Desarrollo de la lógica para los filtros grados y secciones',
            horas: 1
          },
          {
            codigo: '6.5',
            descripcion: 'Desarrollo de importación de la lógica para creación de nuevos estudiantes',
            horas: 1
          }
        ],
        archivos: [
          'pages/admin/estudiantes/index.tsx',
          'components/estudiantes/'
        ],
        notas: 'Gestión ágil del padrón de alumnos evaluados.'
      },
      {
        codigo: 'F-007',
        titulo: 'Funcionalidad: Desarrollo de lógica para el gráfico de tendencia comparativo',
        modulo: 'Reportes y Gráficas PDF/Excel',
        tipo: 'Nueva Feature',
        modalidad: 'horas',
        horasEstimadas: 6,
        horasReales: 6,
        estado: 'Completado',
        prioridad: 'Alta',
        descripcion:
          'Desarrollo de lógica para gráficos de tendencia comparativos por nivel global, UGEL, directores y docentes, con búsqueda inteligente.',
        subItems: [
          {
            codigo: '7.1',
            descripcion: 'Desarrollo de la lógica para obtener datos de evaluación a comparar (nivel global, ugel, directores, docente)',
            horas: 4
          },
          {
            codigo: '7.2',
            descripcion: 'Desarrollo de input de búsqueda inteligente de las evaluaciones y tabla comparativa',
            horas: 2
          }
        ],
        archivos: [
          'components/grafico-tendencia/',
          'components/reportes/PanelVisualizacionesMatriz.tsx'
        ],
        notas: 'Gráficas de líneas y barras con series temporales comparativas.'
      },
      {
        codigo: 'F-008',
        titulo: 'Funcionalidad: Matriz Principal Comparativa Multi-Etapa (EDI, EP1, EP2)',
        modulo: 'Evaluaciones de Estudiantes',
        tipo: 'Nueva Feature',
        modalidad: 'horas',
        horasEstimadas: 10,
        horasReales: 10,
        estado: 'Completado',
        prioridad: 'Crítica',
        descripcion:
          'Lógica integral para vincular la triada de evaluaciones (Diagnóstica EDI, Progresiva 1 EP1 y Progresiva 2 EP2) con unificación de IDs de preguntas y tabs interactivos.',
        subItems: [
          {
            codigo: '8.1',
            descripcion: 'Desarrollo del hook useMatrizResultados para consultar y vincular la triada de evaluaciones en Firestore (EDI, EP1, EP2)',
            horas: 3
          },
          {
            codigo: '8.2',
            descripcion: 'Lógica de correlación y unificación de IDs de preguntas y alternativas entre las tres etapas evaluativas',
            horas: 3
          },
          {
            codigo: '8.3',
            descripcion: 'Desarrollo de modal ConfigurarMatrizModal con slots dedicados para EDI, EP1 y EP2 por grado y categoría',
            horas: 2
          },
          {
            codigo: '8.4',
            descripcion: 'Desarrollo de QuestionDetailPopover con tabs independientes para EDI, EP1 y EP2 al hacer clic en preguntas',
            horas: 2
          }
        ],
        archivos: [
          'features/hooks/useMatrizResultados.ts',
          'components/modals/ConfigurarMatrizModal.tsx',
          'components/reportes/QuestionDetailPopover.tsx'
        ],
        notas: 'Pilar principal de la evaluación por triadas evolutivas en el sistema EVA.'
      },
      {
        codigo: 'F-009',
        titulo: 'Funcionalidad: Heatmap Matricial y Guías Pedagógicas de Decisión',
        modulo: 'Reportes y Gráficas PDF/Excel',
        tipo: 'Nueva Feature',
        modalidad: 'horas',
        horasEstimadas: 8,
        horasReales: 8,
        estado: 'Completado',
        prioridad: 'Alta',
        descripcion:
          'Renderizado visual de la grilla de calor con cálculo dinámico de notas, semáforos vigesimales y guías pedagógicas interactivas para toma de decisiones.',
        subItems: [
          {
            codigo: '9.1',
            descripcion: 'Renderizado matricial con scroll horizontal, cabeceras fijas y semaforización de logros (Inicio, Proceso, Logrado, Destacado)',
            horas: 3
          },
          {
            codigo: '9.2',
            descripcion: 'Desarrollo de GuiaHeatmapModal y GuiaDecisionesModal para especialistas de UGEL con pautas pedagógicas',
            horas: 2
          },
          {
            codigo: '9.3',
            descripcion: 'Exportación en formato PDF horizontal A4 con cálculo de promedios de aula y colorimetría dinámica',
            horas: 3
          }
        ],
        archivos: [
          'components/reportes/TablaMatrizComparativa.tsx',
          'components/modals/GuiaHeatmapModal.tsx',
          'components/modals/GuiaDecisionesModal.tsx'
        ],
        notas: 'Proporciona retroalimentación visual inmediata a docentes y directores.'
      }
    ]
  },
  {
    id: 'gestor-evaluaciones',
    nombre: 'Gestor Integral de Evaluaciones y Reglas de Negocio',
    rutaPrincipal: 'pages/admin/evaluaciones/index.tsx',
    modulo: 'Evaluaciones de Estudiantes',
    descripcionGeneral:
      'Panel central de administración de pruebas: creación de exámenes, ordenamiento drag-and-drop con dnd-kit, validaciones de activación y modo de protección de evaluación activa.',
    subFeatures: [
      {
        codigo: 'G-001',
        titulo: 'Reordenamiento de Evaluaciones Drag-and-Drop con Dnd-Kit',
        modulo: 'Evaluaciones de Estudiantes',
        tipo: 'Nueva Feature',
        modalidad: 'horas',
        horasEstimadas: 6,
        horasReales: 6,
        estado: 'Completado',
        prioridad: 'Alta',
        descripcion:
          'Integración de @dnd-kit/core y @dnd-kit/sortable para arrastrar y soltar filas de evaluaciones, con componente SortableRow y persistencia de orden.',
        subItems: [
          {
            codigo: '1.1',
            descripcion: 'Implementación del contexto DndContext y SortableContext con sensores de puntero',
            horas: 3
          },
          {
            codigo: '1.2',
            descripcion: 'Desarrollo del componente SortableRow con indicador visual y bloqueo condicional',
            horas: 3
          }
        ],
        archivos: [
          'components/evaluaciones/SortableRow.tsx',
          'pages/admin/evaluaciones/index.tsx'
        ],
        notas: 'Bloqueado lógicamente cuando la evaluación está activa (Regla 3).'
      },
      {
        codigo: 'G-002',
        titulo: 'Motor de Validación Estricta para Activación de Evaluaciones',
        modulo: 'Seguridad y Validación',
        tipo: 'Seguridad y Validación',
        modalidad: 'horas',
        horasEstimadas: 8,
        horasReales: 8,
        estado: 'Completado',
        prioridad: 'Crítica',
        descripcion:
          'Función validacionSiEvaluacionTienePreguntasYPuntuacion que comprueba: configuración de nivelYPuntaje, mínimo 1 pregunta, puntaje individual >= 1 y suma exacta al valor máximo del nivel.',
        subItems: [
          {
            codigo: '2.1',
            descripcion: 'Validación de existencia de configuración nivelYPuntaje y al menos 1 pregunta registrada',
            horas: 3
          },
          {
            codigo: '2.2',
            descripcion: 'Verificación estricta de puntajes >= 1 y cálculo de suma total idéntica al valor máximo del nivel Satisfactorio',
            horas: 5
          }
        ],
        archivos: [
          'features/hooks/useAgregarEvaluaciones.tsx',
          'pages/admin/evaluaciones/index.tsx'
        ],
        notas: 'Regla de negocio crítica del proyecto EVA (Regla 2).'
      },
      {
        codigo: 'G-003',
        titulo: 'Modo de Protección y Bloqueo para Evaluaciones Activas',
        modulo: 'Seguridad y Validación',
        tipo: 'Seguridad y Validación',
        modalidad: 'horas',
        horasEstimadas: 7,
        horasReales: 7,
        estado: 'Completado',
        prioridad: 'Alta',
        descripcion:
          'Ocultamiento de botones de edición/eliminación, modo solo lectura en puntajes con badge y banner informativo de protección cuando evaluacion.active === true.',
        subItems: [
          {
            codigo: '3.1',
            descripcion: 'Desarrollo de banner de advertencia visual de estado bloqueado y título en mayúsculas (.toUpperCase())',
            horas: 3
          },
          {
            codigo: '3.2',
            descripcion: 'Inhabilitación de controles de edición/borrado, drag-and-drop y badges de puntaje solo lectura',
            horas: 4
          }
        ],
        archivos: [
          'pages/admin/evaluaciones/index.tsx',
          'components/tabla-preguntas/'
        ],
        notas: 'Evita discrepancias en resultados ya aplicados a colegios (Regla 3).'
      }
    ]
  },
  {
    id: 'banco-preguntas',
    nombre: 'Banco de Preguntas y Modal de Creación / Edición',
    rutaPrincipal: 'components/tabla-preguntas/PreguntaModal.tsx',
    modulo: 'Evaluaciones de Estudiantes',
    descripcionGeneral:
      'Módulo de captura de reactivos pedagógicos con reglas de ergonomía: autofocus en textarea, atajos Enter/Escape, número de pregunta dinámico y prevención de doble clic.',
    subFeatures: [
      {
        codigo: 'P-001',
        titulo: 'Modal de Creación de Preguntas con Ergonomía de Teclado',
        modulo: 'Evaluaciones de Estudiantes',
        tipo: 'Nueva Feature',
        modalidad: 'horas',
        horasEstimadas: 5,
        horasReales: 5,
        estado: 'Completado',
        prioridad: 'Alta',
        descripcion:
          'Implementación de autofocus en textarea de pregunta, atajo Enter para guardar y Escape para cerrar el modal de forma segura.',
        subItems: [
          {
            codigo: '1.1',
            descripcion: 'Autofocus automático en el área de texto (textarea) al abrir el modal de preguntas',
            horas: 1
          },
          {
            codigo: '1.2',
            descripcion: 'Capturador de eventos de teclado: Enter para guardar y Escape para cerrar modal',
            horas: 2
          },
          {
            codigo: '1.3',
            descripcion: 'Indicador dinámico del número de pregunta (Pregunta N° X) y protección isSaving contra clics múltiples',
            horas: 2
          }
        ],
        archivos: [
          'components/tabla-preguntas/PreguntaModal.tsx'
        ],
        notas: 'Cumple a cabalidad con las especificaciones de la Regla 1 del proyecto.'
      }
    ]
  }
];

export function getComponentesDisponibles(): ComponenteAnalizado[] {
  return COMPONENTES_DESGLOSADOS;
}

export function getDesgloseDeComponente(componenteId: string, hourlyRate: number) {
  const comp = COMPONENTES_DESGLOSADOS.find((c) => c.id === componenteId);
  if (!comp) return null;

  const rate = hourlyRate > 0 ? hourlyRate : 50;
  const hoy = new Date().toISOString().split('T')[0];

  const subFeaturesCalculadas = comp.subFeatures.map((sf) => {
    // Si la feature tiene subItems, la suma de horas de los subItems es la hora real
    const horasFromSubItems =
      sf.subItems && sf.subItems.length > 0
        ? sf.subItems.reduce((acc, item) => acc + (Number(item.horas) || 0), 0)
        : 0;

    const horas = horasFromSubItems > 0 ? horasFromSubItems : (sf.horasReales || sf.horasEstimadas || 0);

    return {
      ...sf,
      horasEstimadas: horas,
      horasReales: horas,
      tarifaPorHora: rate,
      costoTotal: Math.round(horas * rate * 100) / 100,
      fecha: hoy,
      seleccionada: true
    };
  });

  return {
    ...comp,
    subFeatures: subFeaturesCalculadas
  };
}
