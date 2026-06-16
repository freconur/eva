import React from 'react';
import {
  DndContext,
  closestCenter,
  useSensor,
  useSensors,
  PointerSensor,
  KeyboardSensor,
  DragEndEvent,
} from '@dnd-kit/core';
import {
  SortableContext,
  verticalListSortingStrategy,
  arrayMove,
  sortableKeyboardCoordinates,
} from '@dnd-kit/sortable';
import {
  MdPieChart,
  MdStackedBarChart,
  MdSupervisorAccount,
  MdSchool,
  MdBarChart,
  MdCheckCircle,
  MdClose,
  MdRefresh,
  MdOutlineDashboard,
  MdOutlineSegment,
} from 'react-icons/md';
import { SortableItemCompact } from './SortableItemCompact';
import styles from './ModoOrganizarModal.module.css';

interface ModoOrganizarModalProps {
  isOpen: boolean;
  onClose: () => void;
  ordenGraficos: string[];
  onOrderChange: (newOrder: string[]) => void;
  defaultLayout: string[];
  elementosVisibles: string[];
  onVisibilityChange: (newVisible: string[]) => void;
  defaultVisibility: string[];
}

const friendlyNames: Record<string, { label: string; icon: React.ReactNode }> = {
  pie_chart: {
    label: 'Distribución de Niveles (Pie Chart)',
    icon: <MdPieChart />,
  },
  ugel_stacked: {
    label: 'Comparativa Regional (UGEL Stacked)',
    icon: <MdStackedBarChart />,
  },
  directores_bar: {
    label: 'Ranking de Directores',
    icon: <MdSupervisorAccount />,
  },
  docentes_bar: {
    label: 'Ranking de Docentes',
    icon: <MdSchool />,
  },
  docentes_buckets: {
    label: 'Distribución de Docentes (Buckets)',
    icon: <MdBarChart />,
  },
  participacion_directores: {
    label: 'Participación de Directores',
    icon: <MdCheckCircle />,
  },
  docente_detalle: {
    label: 'Detalle de Docentes (Tabla de Puntajes)',
    icon: <MdSchool />,
  },
  graficos_tendencia: {
    label: 'Tendencias Históricas (Exámenes Previos)',
    icon: <MdStackedBarChart />,
  },
  reporte_preguntas: {
    label: 'Respuestas por Pregunta (Acordeón)',
    icon: <MdBarChart />,
  },
  tabla_directores: {
    label: 'Detalle de Directores (Tabla de Participación)',
    icon: <MdSupervisorAccount />,
  },
};

const accordionIds = [
  'docente_detalle',
  'graficos_tendencia',
  'reporte_preguntas',
  'tabla_directores',
];

export const ModoOrganizarModal: React.FC<ModoOrganizarModalProps> = ({
  isOpen,
  onClose,
  ordenGraficos,
  onOrderChange,
  defaultLayout,
  elementosVisibles,
  onVisibilityChange,
  defaultVisibility,
}) => {
  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  if (!isOpen) return null;

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (active && over && active.id !== over.id) {
      const oldIndex = ordenGraficos.indexOf(active.id as string);
      const newIndex = ordenGraficos.indexOf(over.id as string);
      const newOrder = arrayMove(ordenGraficos, oldIndex, newIndex);
      onOrderChange(newOrder);
    }
  };

  const toggleVisibility = (id: string) => {
    if (elementosVisibles.includes(id)) {
      onVisibilityChange(elementosVisibles.filter((item) => item !== id));
    } else {
      onVisibilityChange([...elementosVisibles, id]);
    }
  };

  const handleReset = () => {
    if (window.confirm('¿Deseas restablecer el diseño por defecto de los gráficos y secciones?')) {
      onOrderChange(defaultLayout);
      onVisibilityChange(defaultVisibility);
    }
  };

  return (
    <div className={styles.modalOverlay} onClick={onClose}>
      <div className={styles.modalContent} onClick={(e) => e.stopPropagation()} style={{ maxWidth: '550px' }}>
        <div className={styles.modalHeader}>
          <h2 className={styles.modalTitle}>Personalizar Reporte</h2>
          <button className={styles.closeButton} onClick={onClose} title="Cerrar modal">
            <MdClose />
          </button>
        </div>

        <p className={styles.modalSubtitle}>
          Personaliza la presentación desactivando elementos o reordenando los gráficos del dashboard arrastrándolos desde los tiradores izquierdos.
        </p>

        <div style={{ maxHeight: '420px', overflowY: 'auto', paddingRight: '4px' }}>
          {/* Gráficos del Dashboard Section */}
          <div className={styles.sectionHeader}>
            <MdOutlineDashboard style={{ color: '#4f46e5', fontSize: '1rem' }} />
            <span>Gráficos del Dashboard (Ordenar y Mostrar)</span>
          </div>

          <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragEnd={handleDragEnd}
          >
            <SortableContext items={ordenGraficos} strategy={verticalListSortingStrategy}>
              <div className={styles.listContainer}>
                {ordenGraficos.map((id) => {
                  const config = friendlyNames[id] || {
                    label: id,
                    icon: <MdBarChart />,
                  };
                  return (
                    <SortableItemCompact
                      key={id}
                      id={id}
                      label={config.label}
                      icon={config.icon}
                      visible={elementosVisibles.includes(id)}
                      onToggleVisibility={() => toggleVisibility(id)}
                      isDraggable={true}
                    />
                  );
                })}
              </div>
            </SortableContext>
          </DndContext>

          {/* Secciones de Detalle Section */}
          <div className={styles.sectionHeader} style={{ marginTop: '24px' }}>
            <MdOutlineSegment style={{ color: '#4f46e5', fontSize: '1rem' }} />
            <span>Secciones de Detalle (Mostrar / Ocultar)</span>
          </div>

          <div className={styles.listContainer}>
            {accordionIds.map((id) => {
              const config = friendlyNames[id] || {
                label: id,
                icon: <MdBarChart />,
              };
              return (
                <SortableItemCompact
                  key={id}
                  id={id}
                  label={config.label}
                  icon={config.icon}
                  visible={elementosVisibles.includes(id)}
                  onToggleVisibility={() => toggleVisibility(id)}
                  isDraggable={false}
                />
              );
            })}
          </div>
        </div>

        <div className={styles.modalFooter}>
          <button className={styles.resetButton} onClick={handleReset}>
            <MdRefresh />
            <span>Restablecer Diseño</span>
          </button>
          <button className={styles.saveButton} onClick={onClose}>
            Guardar y Cerrar
          </button>
        </div>
      </div>
    </div>
  );
};
