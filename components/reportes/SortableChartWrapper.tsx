import React from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { MdDragIndicator } from 'react-icons/md';
import styles from './SortableChartWrapper.module.css';

interface SortableChartWrapperProps {
  id: string;
  children: React.ReactNode;
  className?: string;
}

export const SortableChartWrapper: React.FC<SortableChartWrapperProps> = ({
  id,
  children,
  className = '',
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
    zIndex: isDragging ? 100 : 'auto',
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`${className} ${styles.wrapper} ${isDragging ? styles.dragging : ''}`}
    >
      <div className={styles.dragHeader}>
        <div
          {...attributes}
          {...listeners}
          className={styles.dragHandle}
          title="Arrastrar para reordenar gráfico"
        >
          <MdDragIndicator />
        </div>
      </div>
      <div className={styles.chartContent}>
        {children}
      </div>
    </div>
  );
};
