import React, { useState, useRef, useEffect, useMemo } from 'react';
import {
  MdTableChart,
  MdTrackChanges,
  MdTrendingUp,
  MdShowChart,
  MdAssignment,
  MdEdit,
  MdCheck,
  MdClose,
  MdDragIndicator,
} from 'react-icons/md';
import { RiLoader4Line } from 'react-icons/ri';
import {
  DndContext,
  closestCenter,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from '@dnd-kit/core';
import {
  SortableContext,
  horizontalListSortingStrategy,
  useSortable,
  arrayMove,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import {
  useDirectorTabsConfig,
  DirectorTabKey,
  DEFAULT_DIRECTOR_TAB_ORDER,
} from './useDirectorTabsConfig';
import styles from './DirectorTabsNav.module.css';

export type { DirectorTabKey };

interface TabItem {
  id: DirectorTabKey;
  defaultLabel: string;
  icon: React.ReactNode;
  badge?: string | number;
  isAlertBadge?: boolean;
}

interface SortableTabButtonProps {
  tab: TabItem;
  isActive: boolean;
  currentLabel: string;
  isEditingThisTab: boolean;
  canEdit: boolean;
  isSaving: boolean;
  editingText: string;
  editInputRef: React.RefObject<HTMLInputElement>;
  setEditingText: (text: string) => void;
  onChangeTab: (tabId: DirectorTabKey) => void;
  onStartEdit: (e: React.MouseEvent, tabId: DirectorTabKey, label: string) => void;
  onSaveEdit: (e: React.MouseEvent | React.KeyboardEvent, tabId: DirectorTabKey) => void;
  onCancelEdit: (e?: React.MouseEvent | React.KeyboardEvent) => void;
}

const SortableTabButton: React.FC<SortableTabButtonProps> = ({
  tab,
  isActive,
  currentLabel,
  isEditingThisTab,
  canEdit,
  isSaving,
  editingText,
  editInputRef,
  setEditingText,
  onChangeTab,
  onStartEdit,
  onSaveEdit,
  onCancelEdit,
}) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({
    id: tab.id,
    disabled: !canEdit || isEditingThisTab,
  });

  const style: React.CSSProperties = {
    transform: CSS.Transform.toString(transform),
    transition,
    zIndex: isDragging ? 50 : undefined,
    opacity: isDragging ? 0.75 : 1,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className="inline-flex items-end self-end"
    >
      <button
        type="button"
        role="tab"
        aria-selected={isActive}
        className={`${styles.tabBtn} ${isActive ? styles.tabBtnActive : ''} ${
          isDragging ? 'ring-2 ring-blue-500 shadow-md bg-blue-50/70' : ''
        }`}
        onClick={() => {
          if (!isEditingThisTab) {
            onChangeTab(tab.id);
          }
        }}
      >
        {/* Handle de arrastre discreto: SOLO visible y operativo para Administrador / Modo Auditoría */}
        {canEdit && !isEditingThisTab && (
          <span
            {...attributes}
            {...listeners}
            className="inline-flex items-center justify-center p-0.5 -ml-1 mr-0.5 text-slate-400 hover:text-blue-600 cursor-grab active:cursor-grabbing rounded hover:bg-slate-200/60 transition-colors"
            title="Arrastrar para reordenar pestaña"
            aria-label="Arrastrar para reordenar pestaña"
            onClick={(e) => e.stopPropagation()}
          >
            <MdDragIndicator className="w-3.5 h-3.5" />
          </span>
        )}

        {tab.icon}

        {isEditingThisTab ? (
          <div
            className="inline-flex items-center gap-1.5 z-40"
            onClick={(e) => e.stopPropagation()}
          >
            <input
              ref={editInputRef}
              type="text"
              value={editingText}
              disabled={isSaving}
              onChange={(e) => setEditingText(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  onSaveEdit(e, tab.id);
                } else if (e.key === 'Escape') {
                  onCancelEdit(e);
                }
              }}
              className="px-2 py-0.5 text-xs font-semibold text-slate-900 bg-white border border-blue-500 rounded-md shadow-xs outline-none focus:ring-2 focus:ring-blue-500 min-w-[130px] max-w-[210px]"
              placeholder="Nombre de pestaña..."
            />
            <button
              type="button"
              disabled={isSaving || !editingText.trim()}
              onClick={(e) => onSaveEdit(e, tab.id)}
              className="inline-flex items-center justify-center w-6 h-6 rounded-md bg-blue-600 hover:bg-blue-700 text-white transition-colors cursor-pointer shadow-2xs disabled:opacity-50"
              title="Guardar nombre (Enter)"
              aria-label="Guardar nombre"
            >
              {isSaving ? (
                <RiLoader4Line className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <MdCheck className="w-3.5 h-3.5" />
              )}
            </button>
            <button
              type="button"
              disabled={isSaving}
              onClick={(e) => onCancelEdit(e)}
              className="inline-flex items-center justify-center w-6 h-6 rounded-md bg-slate-200 hover:bg-slate-300 text-slate-700 transition-colors cursor-pointer"
              title="Cancelar edición (Escape)"
              aria-label="Cancelar edición"
            >
              <MdClose className="w-3.5 h-3.5" />
            </button>
          </div>
        ) : (
          <span className="inline-flex items-center gap-1">
            <span className={styles.tabLabel}>{currentLabel}</span>
            {canEdit && (
              <span
                role="button"
                tabIndex={0}
                onClick={(e) => onStartEdit(e, tab.id, currentLabel)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    onStartEdit(e as any, tab.id, currentLabel);
                  }
                }}
                className="inline-flex items-center justify-center w-5 h-5 ml-0.5 rounded-md text-slate-400 hover:text-blue-600 hover:bg-blue-50/80 transition-all cursor-pointer opacity-70 hover:opacity-100"
                title={`Editar nombre de pestaña "${currentLabel}"`}
                aria-label={`Editar nombre de pestaña "${currentLabel}"`}
              >
                <MdEdit className="w-3.5 h-3.5" />
              </span>
            )}
          </span>
        )}

        {!isEditingThisTab && tab.badge !== undefined && (
          <span
            className={`${styles.tabBadge} ${
              tab.isAlertBadge ? styles.tabBadgeAlert : ''
            }`}
          >
            {tab.badge}
          </span>
        )}
      </button>
    </div>
  );
};

interface DirectorTabsNavProps {
  activeTab: DirectorTabKey;
  onChangeTab: (tab: DirectorTabKey) => void;
  totalEstudiantes?: number;
  totalCritico?: number;
  totalPreguntas?: number;
  isAuditing?: boolean;
  hideBrechas?: boolean;
  hiddenTabs?: DirectorTabKey[];
}

export const DirectorTabsNav: React.FC<DirectorTabsNavProps> = ({
  activeTab,
  onChangeTab,
  totalEstudiantes,
  totalCritico = 0,
  totalPreguntas,
  isAuditing: propIsAuditing,
  hideBrechas,
  hiddenTabs,
}) => {
  const {
    tabLabels,
    tabOrder,
    saveTabLabel,
    saveTabOrder,
    isSaving,
    isAuditing: hookIsAuditing,
  } = useDirectorTabsConfig();

  // Permiso para editar nombres y reordenar pestañas: exclusivo para Administrador o Modo Auditoría
  const canEdit = propIsAuditing !== undefined ? propIsAuditing : hookIsAuditing;

  // Sensor de arrastre configurado con distancia mínima de 8px para no interferir con clicks normales
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    })
  );

  // Estado local para edición interactiva inline de nombres de pestaña
  const [editingTabId, setEditingTabId] = useState<DirectorTabKey | null>(null);
  const [editingText, setEditingText] = useState<string>('');
  const editInputRef = useRef<HTMLInputElement>(null);

  // Autofocus inmediato y selección del texto al iniciar la edición
  useEffect(() => {
    if (editingTabId && editInputRef.current) {
      editInputRef.current.focus();
      editInputRef.current.select();
    }
  }, [editingTabId]);

  const handleStartEdit = (e: React.MouseEvent, tabId: DirectorTabKey, currentLabel: string) => {
    e.stopPropagation();
    e.preventDefault();
    setEditingTabId(tabId);
    setEditingText(currentLabel);
  };

  const handleCancelEdit = (e?: React.MouseEvent | React.KeyboardEvent) => {
    if (e) {
      e.stopPropagation();
      e.preventDefault();
    }
    setEditingTabId(null);
    setEditingText('');
  };

  const handleSaveEdit = async (e: React.MouseEvent | React.KeyboardEvent, tabId: DirectorTabKey) => {
    e.stopPropagation();
    e.preventDefault();
    if (!editingText.trim() || isSaving) return;

    const success = await saveTabLabel(tabId, editingText);
    if (success) {
      setEditingTabId(null);
      setEditingText('');
    }
  };

  // Definición base de cada pestaña del sistema
  const baseTabs: Record<DirectorTabKey, TabItem> = useMemo(
    () => ({
      grilla: {
        id: 'grilla',
        defaultLabel: 'Estudiantes y Grilla',
        icon: <MdTableChart className={styles.tabIcon} />,
        badge: totalEstudiantes !== undefined ? `${totalEstudiantes}` : undefined,
      },
      brechas: {
        id: 'brechas',
        defaultLabel: 'Brechas de Aprendizaje',
        icon: <MdTrackChanges className={styles.tabIcon} />,
        badge: totalCritico > 0 ? `${totalCritico} críticas` : undefined,
        isAlertBadge: totalCritico > 0,
      },
      tendencia: {
        id: 'tendencia',
        defaultLabel: 'Tendencias y Cobertura',
        icon: <MdTrendingUp className={styles.tabIcon} />,
      },
      comparativa: {
        id: 'comparativa',
        defaultLabel: 'Comparativa Histórica',
        icon: <MdShowChart className={styles.tabIcon} />,
      },
      preguntas: {
        id: 'preguntas',
        defaultLabel: 'Análisis por Ítem',
        icon: <MdAssignment className={styles.tabIcon} />,
        badge: totalPreguntas !== undefined ? `${totalPreguntas} ítems` : undefined,
      },
    }),
    [totalEstudiantes, totalCritico, totalPreguntas]
  );

  // Pestañas ordenadas dinámicamente según la configuración guardada en Firestore
  const orderedTabs: TabItem[] = useMemo(() => {
    const order = tabOrder && tabOrder.length > 0 ? tabOrder : DEFAULT_DIRECTOR_TAB_ORDER;
    const items: TabItem[] = [];
    const addedIds = new Set<DirectorTabKey>();

    order.forEach((key) => {
      if (baseTabs[key]) {
        items.push(baseTabs[key]);
        addedIds.add(key);
      }
    });

    // Agregar cualquier pestaña faltante que no esté en el orden guardado
    DEFAULT_DIRECTOR_TAB_ORDER.forEach((key) => {
      if (!addedIds.has(key) && baseTabs[key]) {
        items.push(baseTabs[key]);
      }
    });

    return items.filter((tab) => {
      if (hideBrechas && tab.id === 'brechas') return false;
      if (hiddenTabs && hiddenTabs.includes(tab.id)) return false;
      return true;
    });
  }, [baseTabs, tabOrder, hideBrechas, hiddenTabs]);

  // Manejador del evento Drag & Drop (reordenamiento de pestañas)
  const handleDragEnd = (event: DragEndEvent) => {
    if (!canEdit) return;
    const { active, over } = event;

    if (over && active.id !== over.id) {
      const currentIds = orderedTabs.map((t) => t.id);
      const oldIndex = currentIds.indexOf(active.id as DirectorTabKey);
      const newIndex = currentIds.indexOf(over.id as DirectorTabKey);

      if (oldIndex !== -1 && newIndex !== -1) {
        const reordered = arrayMove(currentIds, oldIndex, newIndex);
        saveTabOrder(reordered);
      }
    }
  };

  return (
    <DndContext
      sensors={canEdit ? sensors : []}
      collisionDetection={closestCenter}
      onDragEnd={handleDragEnd}
    >
      <SortableContext
        items={orderedTabs.map((t) => t.id)}
        strategy={horizontalListSortingStrategy}
      >
        <div
          className={styles.tabsBar}
          role="tablist"
          aria-label="Pestañas de Resultados del Director"
        >
          {orderedTabs.map((tab) => {
            const isActive = activeTab === tab.id;
            const currentLabel = tabLabels[tab.id] || tab.defaultLabel;
            const isEditingThisTab = editingTabId === tab.id;

            return (
              <SortableTabButton
                key={tab.id}
                tab={tab}
                isActive={isActive}
                currentLabel={currentLabel}
                isEditingThisTab={isEditingThisTab}
                canEdit={canEdit}
                isSaving={isSaving}
                editingText={editingText}
                editInputRef={editInputRef}
                setEditingText={setEditingText}
                onChangeTab={onChangeTab}
                onStartEdit={handleStartEdit}
                onSaveEdit={handleSaveEdit}
                onCancelEdit={handleCancelEdit}
              />
            );
          })}
        </div>
      </SortableContext>
    </DndContext>
  );
};

export default DirectorTabsNav;
