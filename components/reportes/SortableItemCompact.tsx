import React from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { MdDragIndicator, MdVisibility, MdVisibilityOff } from 'react-icons/md';
import styles from './ModoOrganizarModal.module.css';

interface SortableItemCompactProps {
  id: string;
  label: string;
  icon: React.ReactNode;
  visible: boolean;
  onToggleVisibility: () => void;
  isDraggable?: boolean;
}

export const SortableItemCompact: React.FC<SortableItemCompactProps> = ({
  id,
  label,
  icon,
  visible,
  onToggleVisibility,
  isDraggable = true,
}) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id, disabled: !isDraggable });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : visible ? 1 : 0.55,
    zIndex: isDragging ? 1000 : 'auto',
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`${styles.listItem} ${isDragging ? styles.listItemDragging : ''} ${!visible ? styles.listItemHidden : ''}`}
    >
      {isDraggable ? (
        <div {...attributes} {...listeners} className={styles.itemDragHandle} title="Arrastrar para ordenar">
          <MdDragIndicator />
        </div>
      ) : (
        <div className={styles.itemStaticSpacer} />
      )}
      <div className={styles.itemIcon} style={{ opacity: visible ? 1 : 0.6 }}>{icon}</div>
      <span className={styles.itemLabel} style={{ textDecoration: visible ? 'none' : 'line-through', opacity: visible ? 1 : 0.6 }}>
        {label}
      </span>
      
      <button
        onClick={(e) => {
          e.stopPropagation();
          onToggleVisibility();
        }}
        className={`${styles.visibilityButton} ${!visible ? styles.visibilityButtonOff : ''}`}
        title={visible ? 'Ocultar elemento' : 'Mostrar elemento'}
        type="button"
      >
        {visible ? <MdVisibility /> : <MdVisibilityOff />}
      </button>
    </div>
  );
};
