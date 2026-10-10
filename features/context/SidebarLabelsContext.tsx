import React, { createContext, useContext, useEffect, useState, useMemo, useCallback } from 'react';
import { doc, onSnapshot, setDoc } from 'firebase/firestore';
import { db } from '@/firebase/firebase.config';
import {
  SidebarLabels,
  SidebarLabelKey,
  DEFAULT_SIDEBAR_LABELS,
} from '@/features/sidebar/sidebarLabelsConfig';
import { CustomSidebarItem } from '@/features/sidebar/customSidebarConfig';

interface SidebarLabelsContextType {
  labels: SidebarLabels;
  getLabel: (key: SidebarLabelKey, fallback?: string) => string;
  updateLabels: (newLabels: Partial<SidebarLabels>) => Promise<void>;
  resetLabels: (keys?: SidebarLabelKey[]) => Promise<void>;
  customItems: CustomSidebarItem[];
  addCustomItem: (item: Omit<CustomSidebarItem, 'id' | 'createdAt'>) => Promise<CustomSidebarItem>;
  updateCustomItem: (id: string, updates: Partial<CustomSidebarItem>) => Promise<void>;
  deleteCustomItem: (id: string) => Promise<void>;
  isLoaded: boolean;
  isSaving: boolean;
}

const SidebarLabelsContext = createContext<SidebarLabelsContextType | undefined>(undefined);

const LOCAL_STORAGE_KEY = 'sidebar_labels';
const LOCAL_STORAGE_CUSTOM_ITEMS_KEY = 'sidebar_custom_items';

export const SidebarLabelsProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [labels, setLabels] = useState<SidebarLabels>(DEFAULT_SIDEBAR_LABELS);
  const [customItems, setCustomItems] = useState<CustomSidebarItem[]>([]);
  const [isLoaded, setIsLoaded] = useState<boolean>(false);
  const [isSaving, setIsSaving] = useState<boolean>(false);

  // 1. Cargar inmediatamente desde localStorage para evitar parpadeos visuales
  useEffect(() => {
    if (typeof window !== 'undefined') {
      try {
        const cached = localStorage.getItem(LOCAL_STORAGE_KEY);
        if (cached) {
          const parsed = JSON.parse(cached);
          if (parsed && typeof parsed === 'object') {
            setLabels((prev) => ({ ...prev, ...parsed }));
          }
        }
      } catch (err) {
        console.error('Error al leer sidebar_labels de localStorage:', err);
      }

      try {
        const cachedCustom = localStorage.getItem(LOCAL_STORAGE_CUSTOM_ITEMS_KEY);
        if (cachedCustom) {
          const parsedCustom = JSON.parse(cachedCustom);
          if (Array.isArray(parsedCustom)) {
            setCustomItems(parsedCustom);
          }
        }
      } catch (err) {
        console.error('Error al leer custom_sidebar_items de localStorage:', err);
      }
    }
  }, []);

  // 2. Escuchar en tiempo real de Firestore (configuracion/branding)
  useEffect(() => {
    const brandDocRef = doc(db, 'configuracion', 'branding');
    const unsubscribe = onSnapshot(
      brandDocRef,
      (docSnap) => {
        if (docSnap.exists()) {
          const data = docSnap.data();
          if (data && data.sidebarLabels && typeof data.sidebarLabels === 'object') {
            const merged = { ...DEFAULT_SIDEBAR_LABELS, ...data.sidebarLabels };
            setLabels(merged);
            if (typeof window !== 'undefined') {
              try {
                localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(data.sidebarLabels));
              } catch (e) {
                console.error('Error al guardar sidebar_labels en localStorage:', e);
              }
            }
          }

          if (data && Array.isArray(data.customSidebarItems)) {
            setCustomItems(data.customSidebarItems);
            if (typeof window !== 'undefined') {
              try {
                localStorage.setItem(LOCAL_STORAGE_CUSTOM_ITEMS_KEY, JSON.stringify(data.customSidebarItems));
              } catch (e) {
                console.error('Error al guardar customSidebarItems en localStorage:', e);
              }
            }
          }
        }
        setIsLoaded(true);
      },
      (error) => {
        console.error('Error al escuchar cambios en configuracion/branding:', error);
        setIsLoaded(true);
      }
    );

    return () => unsubscribe();
  }, []);

  // Función para obtener la etiqueta de forma segura con fallback
  const getLabel = useCallback(
    (key: SidebarLabelKey, fallback?: string): string => {
      const val = labels[key];
      if (val !== undefined && val !== null && String(val).trim() !== '') {
        return String(val);
      }
      if (fallback !== undefined) {
        return fallback;
      }
      return DEFAULT_SIDEBAR_LABELS[key] || '';
    },
    [labels]
  );

/**
 * Sanitiza recursivamente cualquier objeto o array eliminando campos con valor undefined
 * para evitar que Firestore falle con:
 * "FirebaseError: Function setDoc() called with invalid data. Unsupported field value: undefined"
 */
function sanitizeForFirestore<T>(data: T): T {
  if (Array.isArray(data)) {
    return data
      .filter((item) => item !== undefined)
      .map((item) => sanitizeForFirestore(item)) as unknown as T;
  }
  if (data !== null && typeof data === 'object' && !(data instanceof Date)) {
    const cleaned: Record<string, any> = {};
    for (const [key, value] of Object.entries(data)) {
      if (value !== undefined) {
        cleaned[key] = sanitizeForFirestore(value);
      }
    }
    return cleaned as T;
  }
  return data;
}

  // Guardar modificaciones en Firestore
  const updateLabels = useCallback(
    async (newLabels: Partial<SidebarLabels>) => {
      setIsSaving(true);
      try {
        const brandDocRef = doc(db, 'configuracion', 'branding');
        const updated = sanitizeForFirestore({ ...labels, ...newLabels });
        
        await setDoc(
          brandDocRef,
          {
            sidebarLabels: updated,
            ultimaActualizacion: new Date(),
          },
          { merge: true }
        );

        setLabels(updated);
        if (typeof window !== 'undefined') {
          localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(updated));
        }
      } catch (err) {
        console.error('Error al actualizar sidebarLabels en Firestore:', err);
        throw err;
      } finally {
        setIsSaving(false);
      }
    },
    [labels]
  );

  // Restablecer etiquetas a sus valores predeterminados
  const resetLabels = useCallback(
    async (keys?: SidebarLabelKey[]) => {
      setIsSaving(true);
      try {
        const brandDocRef = doc(db, 'configuracion', 'branding');
        let nextLabels: SidebarLabels = { ...labels };

        if (keys && keys.length > 0) {
          keys.forEach((k) => {
            nextLabels[k] = DEFAULT_SIDEBAR_LABELS[k];
          });
        } else {
          nextLabels = { ...DEFAULT_SIDEBAR_LABELS };
        }

        const sanitized = sanitizeForFirestore(nextLabels);

        await setDoc(
          brandDocRef,
          {
            sidebarLabels: sanitized,
            ultimaActualizacion: new Date(),
          },
          { merge: true }
        );

        setLabels(sanitized);
        if (typeof window !== 'undefined') {
          localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(sanitized));
        }
      } catch (err) {
        console.error('Error al restablecer sidebarLabels en Firestore:', err);
        throw err;
      } finally {
        setIsSaving(false);
      }
    },
    [labels]
  );

  // === MÉTODOS CRUD PARA MENÚS Y SUBMENÚS PERSONALIZADOS ===

  const addCustomItem = useCallback(
    async (itemData: Omit<CustomSidebarItem, 'id' | 'createdAt'>): Promise<CustomSidebarItem> => {
      setIsSaving(true);
      try {
        const newItem: CustomSidebarItem = {
          id: `custom_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
          label: itemData.label ? itemData.label.trim() : '',
          role: itemData.role,
          targetType: itemData.targetType,
          route: itemData.route,
          openInNewTab: Boolean(itemData.openInNewTab),
          iconName: itemData.iconName || 'MdLink',
          order: itemData.order ?? customItems.length + 1,
          createdAt: new Date().toISOString(),
        };

        if (itemData.parentId && itemData.parentId.trim() !== '') {
          newItem.parentId = itemData.parentId.trim();
        }

        const rawUpdated = [...customItems, newItem];
        const updated = sanitizeForFirestore(rawUpdated);

        const brandDocRef = doc(db, 'configuracion', 'branding');
        await setDoc(
          brandDocRef,
          {
            customSidebarItems: updated,
            ultimaActualizacion: new Date(),
          },
          { merge: true }
        );

        setCustomItems(updated);
        if (typeof window !== 'undefined') {
          localStorage.setItem(LOCAL_STORAGE_CUSTOM_ITEMS_KEY, JSON.stringify(updated));
        }
        return newItem;
      } catch (err) {
        console.error('Error al agregar customSidebarItem:', err);
        throw err;
      } finally {
        setIsSaving(false);
      }
    },
    [customItems]
  );

  const updateCustomItem = useCallback(
    async (id: string, updates: Partial<CustomSidebarItem>) => {
      setIsSaving(true);
      try {
        const rawUpdated = customItems.map((item) => {
          if (item.id !== id) return item;
          const merged: CustomSidebarItem = { ...item, ...updates };
          if (!merged.parentId || merged.parentId.trim() === '') {
            delete merged.parentId;
          }
          return merged;
        });

        const updated = sanitizeForFirestore(rawUpdated);

        const brandDocRef = doc(db, 'configuracion', 'branding');
        await setDoc(
          brandDocRef,
          {
            customSidebarItems: updated,
            ultimaActualizacion: new Date(),
          },
          { merge: true }
        );

        setCustomItems(updated);
        if (typeof window !== 'undefined') {
          localStorage.setItem(LOCAL_STORAGE_CUSTOM_ITEMS_KEY, JSON.stringify(updated));
        }
      } catch (err) {
        console.error('Error al actualizar customSidebarItem:', err);
        throw err;
      } finally {
        setIsSaving(false);
      }
    },
    [customItems]
  );

  const deleteCustomItem = useCallback(
    async (id: string) => {
      setIsSaving(true);
      try {
        // Elimina el elemento y cualquier submenú hijo que dependa de él
        const rawUpdated = customItems.filter((item) => item.id !== id && item.parentId !== id);
        const updated = sanitizeForFirestore(rawUpdated);

        const brandDocRef = doc(db, 'configuracion', 'branding');
        await setDoc(
          brandDocRef,
          {
            customSidebarItems: updated,
            ultimaActualizacion: new Date(),
          },
          { merge: true }
        );

        setCustomItems(updated);
        if (typeof window !== 'undefined') {
          localStorage.setItem(LOCAL_STORAGE_CUSTOM_ITEMS_KEY, JSON.stringify(updated));
        }
      } catch (err) {
        console.error('Error al eliminar customSidebarItem:', err);
        throw err;
      } finally {
        setIsSaving(false);
      }
    },
    [customItems]
  );

  const value = useMemo(
    () => ({
      labels,
      getLabel,
      updateLabels,
      resetLabels,
      customItems,
      addCustomItem,
      updateCustomItem,
      deleteCustomItem,
      isLoaded,
      isSaving,
    }),
    [
      labels,
      getLabel,
      updateLabels,
      resetLabels,
      customItems,
      addCustomItem,
      updateCustomItem,
      deleteCustomItem,
      isLoaded,
      isSaving,
    ]
  );

  return (
    <SidebarLabelsContext.Provider value={value}>
      {children}
    </SidebarLabelsContext.Provider>
  );
};

export const useSidebarLabels = (): SidebarLabelsContextType => {
  const context = useContext(SidebarLabelsContext);
  if (!context) {
    // Si se usa fuera del provider (ej. pruebas aisladas), retorna defaults seguros sin romper
    return {
      labels: DEFAULT_SIDEBAR_LABELS,
      getLabel: (key: SidebarLabelKey, fallback?: string) =>
        fallback !== undefined ? fallback : DEFAULT_SIDEBAR_LABELS[key] || '',
      updateLabels: async () => {},
      resetLabels: async () => {},
      customItems: [],
      addCustomItem: async () => ({} as any),
      updateCustomItem: async () => {},
      deleteCustomItem: async () => {},
      isLoaded: true,
      isSaving: false,
    };
  }
  return context;
};

export default SidebarLabelsContext;
