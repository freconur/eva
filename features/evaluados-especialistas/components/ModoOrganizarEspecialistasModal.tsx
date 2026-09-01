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
  useSortable,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import {
  MdDragIndicator,
  MdClose,
  MdRefresh,
  MdCheck,
  MdOutlineDashboardCustomize,
} from 'react-icons/md';
import {
  RiArrowUpSLine,
  RiArrowDownSLine,
  RiBarChartGroupedLine,
  RiAwardLine,
  RiGovernmentLine,
  RiGroupLine,
  RiLayoutGridLine,
} from 'react-icons/ri';
import styles from './ModoOrganizarEspecialistasModal.module.css';

export interface SectionDefinition {
  id: string;
  title: string;
  subtitle: string;
  icon: React.ReactNode;
  color: string;
}

export const SECCIONES_REPORTE_CONFIG: Record<string, SectionDefinition> = {
  global_consolidado: {
    id: 'global_consolidado',
    title: 'Rendimiento Global Consolidado',
    subtitle: 'Barras y ranking de UGELs y Especialistas de toda la evaluación',
    icon: <RiBarChartGroupedLine />,
    color: '#3b82f6',
  },
  pie_charts: {
    id: 'pie_charts',
    title: 'Consolidado Global y Niveles de Logro',
    subtitle: 'Gráficos circulares de estado general y distribución por niveles',
    icon: <RiAwardLine />,
    color: '#10b981',
  },
  dimensiones_ugel: {
    id: 'dimensiones_ugel',
    title: 'Rendimiento por UGEL según Dominio',
    subtitle: 'Comparativas y puntajes desagregados por dimensiones para UGELs',
    icon: <RiGovernmentLine />,
    color: '#8b5cf6',
  },
  dimensiones_especialistas: {
    id: 'dimensiones_especialistas',
    title: 'Rendimiento por Especialista según Dominio',
    subtitle: 'Ranking y comparativas desagregados por dimensiones para Especialistas',
    icon: <RiGroupLine />,
    color: '#ec4899',
  },
  preguntas_criterios: {
    id: 'preguntas_criterios',
    title: 'Resultados Detallados por Criterio',
    subtitle: 'Desglose individual de respuestas de cada pregunta y criterio evaluado',
    icon: <RiLayoutGridLine />,
    color: '#f59e0b',
  },
};

export const DEFAULT_SECTIONS_ORDER = [
  'global_consolidado',
  'pie_charts',
  'dimensiones_ugel',
  'dimensiones_especialistas',
  'preguntas_criterios',
];

interface SortableRowProps {
  id: string;
  section: SectionDefinition;
  visible: boolean;
  onToggleVisibility: (id: string) => void;
  onMoveUp: (index: number) => void;
  onMoveDown: (index: number) => void;
  index: number;
  total: number;
}

const SortableRow: React.FC<SortableRowProps> = ({
  id,
  section,
  visible,
  onToggleVisibility,
  onMoveUp,
  onMoveDown,
  index,
  total,
}) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    zIndex: isDragging ? 1000 : 'auto',
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`${styles.listItem} ${isDragging ? styles.listItemDragging : ''} ${
        !visible ? styles.listItemHidden : ''
      }`}
    >
      <div
        {...attributes}
        {...listeners}
        className={styles.itemDragHandle}
        title="Arrastra para reordenar esta sección"
      >
        <MdDragIndicator />
      </div>

      <div
        className={styles.itemIconWrapper}
        style={{
          background: `${section.color}15`,
          color: section.color,
        }}
      >
        {section.icon}
      </div>

      <div className={styles.itemContent}>
        <div className={styles.itemTitleRow}>
          <h4 className={styles.itemTitle}>{section.title}</h4>
        </div>
        <p className={styles.itemSubtitle}>{section.subtitle}</p>
      </div>

      <div className={styles.itemOrderActions}>
        <button
          type="button"
          onClick={() => onMoveUp(index)}
          disabled={index === 0}
          className={styles.arrowBtn}
          title="Mover arriba"
        >
          <RiArrowUpSLine />
        </button>
        <button
          type="button"
          onClick={() => onMoveDown(index)}
          disabled={index === total - 1}
          className={styles.arrowBtn}
          title="Mover abajo"
        >
          <RiArrowDownSLine />
        </button>
      </div>

      <label className={styles.switchLabel} title={visible ? 'Ocultar sección' : 'Mostrar sección'}>
        <input
          type="checkbox"
          checked={visible}
          onChange={() => onToggleVisibility(id)}
          className={styles.switchInput}
        />
        <span className={styles.switchSlider}></span>
      </label>
    </div>
  );
};

interface ModoOrganizarEspecialistasModalProps {
  isOpen: boolean;
  onClose: () => void;
  ordenSecciones: string[];
  onOrderChange: (newOrder: string[]) => void;
  seccionesVisibles: string[];
  onVisibilityChange: (newVisible: string[]) => void;
}

export const ModoOrganizarEspecialistasModal: React.FC<ModoOrganizarEspecialistasModalProps> = ({
  isOpen,
  onClose,
  ordenSecciones,
  onOrderChange,
  seccionesVisibles,
  onVisibilityChange,
}) => {
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 5,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  if (!isOpen) return null;

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (active && over && active.id !== over.id) {
      const oldIndex = ordenSecciones.indexOf(active.id as string);
      const newIndex = ordenSecciones.indexOf(over.id as string);
      const newOrder = arrayMove(ordenSecciones, oldIndex, newIndex);
      onOrderChange(newOrder);
    }
  };

  const handleToggleVisibility = (id: string) => {
    if (seccionesVisibles.includes(id)) {
      onVisibilityChange(seccionesVisibles.filter((item) => item !== id));
    } else {
      onVisibilityChange([...seccionesVisibles, id]);
    }
  };

  const handleMoveUp = (index: number) => {
    if (index > 0) {
      const newOrder = arrayMove(ordenSecciones, index, index - 1);
      onOrderChange(newOrder);
    }
  };

  const handleMoveDown = (index: number) => {
    if (index < ordenSecciones.length - 1) {
      const newOrder = arrayMove(ordenSecciones, index, index + 1);
      onOrderChange(newOrder);
    }
  };

  const handleReset = () => {
    onOrderChange(DEFAULT_SECTIONS_ORDER);
    onVisibilityChange(DEFAULT_SECTIONS_ORDER);
  };

  const hiddenCount = ordenSecciones.length - seccionesVisibles.length;

  return (
    <div className={styles.modalOverlay} onClick={onClose}>
      <div className={styles.modalContent} onClick={(e) => e.stopPropagation()}>
        <div className={styles.modalHeader}>
          <div className={styles.modalTitleGroup}>
            <h3 className={styles.modalTitle}>
              <MdOutlineDashboardCustomize style={{ color: '#2563eb', fontSize: '1.35rem' }} />
              Personalizar y Organizar Gráficos
            </h3>
            <p className={styles.modalSubtitle}>
              Arrastra desde los tiradores izquierdos o usa las flechas para reorganizar el orden, y activa/desactiva los switches para mostrar u ocultar gráficos.
            </p>
          </div>
          <button
            type="button"
            className={styles.closeButton}
            onClick={onClose}
            title="Cerrar modal (Esc)"
          >
            <MdClose />
          </button>
        </div>

        <div className={styles.modalBody}>
          <div className={styles.instructionCard}>
            <MdCheck style={{ fontSize: '1.15rem', color: '#16a34a', flexShrink: 0 }} />
            <span>Los cambios se guardan automáticamente en tu navegador para esta evaluación.</span>
          </div>

          <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragEnd={handleDragEnd}
          >
            <SortableContext items={ordenSecciones} strategy={verticalListSortingStrategy}>
              <div className={styles.listContainer}>
                {ordenSecciones.map((secId, index) => {
                  const sectionDef = SECCIONES_REPORTE_CONFIG[secId] || {
                    id: secId,
                    title: secId,
                    subtitle: 'Sección del reporte',
                    icon: <RiBarChartGroupedLine />,
                    color: '#3b82f6',
                  };

                  return (
                    <SortableRow
                      key={secId}
                      id={secId}
                      section={sectionDef}
                      visible={seccionesVisibles.includes(secId)}
                      onToggleVisibility={handleToggleVisibility}
                      onMoveUp={handleMoveUp}
                      onMoveDown={handleMoveDown}
                      index={index}
                      total={ordenSecciones.length}
                    />
                  );
                })}
              </div>
            </SortableContext>
          </DndContext>
        </div>

        <div className={styles.modalFooter}>
          <button
            type="button"
            className={styles.resetButton}
            onClick={handleReset}
            title="Restablecer el orden y visibilidad original"
          >
            <MdRefresh style={{ fontSize: '1.1rem' }} />
            <span>Restablecer Original</span>
          </button>

          <button
            type="button"
            className={styles.saveButton}
            onClick={onClose}
          >
            <MdCheck style={{ fontSize: '1.15rem' }} />
            <span>Guardar y Aplicar</span>
          </button>
        </div>
      </div>
    </div>
  );
};
