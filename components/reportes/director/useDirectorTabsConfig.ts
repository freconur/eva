import { useState, useEffect, useCallback } from 'react';
import { getFirestore, doc, onSnapshot, setDoc } from 'firebase/firestore';
import { toast } from 'react-toastify';
import { useGlobalContext } from '@/features/context/GlolbalContext';

export type DirectorTabKey =
  | 'grilla'
  | 'brechas'
  | 'tendencia'
  | 'comparativa'
  | 'preguntas';

export const DEFAULT_DIRECTOR_TAB_LABELS: Record<DirectorTabKey, string> = {
  grilla: 'Estudiantes y Grilla',
  brechas: 'Brechas de Aprendizaje',
  tendencia: 'Tendencias y Cobertura',
  comparativa: 'Comparativa Histórica',
  preguntas: 'Análisis por Ítem',
};

export const DEFAULT_DIRECTOR_TAB_ORDER: DirectorTabKey[] = [
  'grilla',
  'brechas',
  'tendencia',
  'comparativa',
  'preguntas',
];

export interface DirectorTabsConfig {
  tabs?: Partial<Record<DirectorTabKey, string>>;
  tabOrder?: DirectorTabKey[];
  categorias?: Record<string, string>;
  updatedAt?: string;
  updatedBy?: string;
}

/**
 * Hook para gestionar de forma centralizada y persistente los nombres y orden de las pestañas
 * del reporte del director en Firestore (colección 'configuraciones', documento 'reporte_director_tabs').
 * 
 * Permite que un usuario administrador o en modo auditoría modifique los títulos globales
 * y el orden de las pestañas mediante Drag and Drop en tiempo real.
 */
export const useDirectorTabsConfig = () => {
  const { currentUserData } = useGlobalContext();
  const [tabLabels, setTabLabels] = useState<Record<DirectorTabKey, string>>(DEFAULT_DIRECTOR_TAB_LABELS);
  const [tabOrder, setTabOrder] = useState<DirectorTabKey[]>(DEFAULT_DIRECTOR_TAB_ORDER);
  const [categoriaLabels, setCategoriaLabels] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState<boolean>(true);
  const [isSaving, setIsSaving] = useState<boolean>(false);

  // Detección de permisos de administración / auditoría
  const [isAuditing, setIsAuditing] = useState<boolean>(false);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const audited = sessionStorage.getItem('audited_user');
      const realAdmin = sessionStorage.getItem('real_admin_user');
      const isUserAdmin = currentUserData?.rol === 4 || currentUserData?.perfil?.rol === 4;
      const nextVal = Boolean(audited || realAdmin || isUserAdmin);
      setIsAuditing((prev) => (prev !== nextVal ? nextVal : prev));
    }
  }, [currentUserData?.rol, currentUserData?.perfil?.rol]);

  // Suscripción en tiempo real a la configuración en Firestore
  useEffect(() => {
    let isMounted = true;
    const db = getFirestore();
    const configDocRef = doc(db, 'configuraciones', 'reporte_director_tabs');

    const unsubscribe = onSnapshot(
      configDocRef,
      (docSnap) => {
        if (!isMounted) return;
        if (docSnap.exists()) {
          const data = docSnap.data() as DirectorTabsConfig;
          if (data?.tabs) {
            setTabLabels({
              ...DEFAULT_DIRECTOR_TAB_LABELS,
              ...data.tabs,
            });
          }
          if (data?.tabOrder && Array.isArray(data.tabOrder)) {
            const raw = data.tabOrder.filter((k) =>
              DEFAULT_DIRECTOR_TAB_ORDER.includes(k)
            );
            const missing = DEFAULT_DIRECTOR_TAB_ORDER.filter(
              (k) => !raw.includes(k)
            );
            setTabOrder([...raw, ...missing]);
          }
          if (data?.categorias) {
            setCategoriaLabels(data.categorias);
          }
        }
        setLoading(false);
      },
      (error) => {
        console.error('Error al escuchar configuraciones/reporte_director_tabs:', error);
        if (isMounted) setLoading(false);
      }
    );

    return () => {
      isMounted = false;
      unsubscribe();
    };
  }, []);

  /**
   * Guarda el nuevo orden de las pestañas (grilla, brechas, tendencia, preguntas)
   */
  const saveTabOrder = useCallback(
    async (newOrder: DirectorTabKey[]): Promise<boolean> => {
      if (!newOrder || newOrder.length === 0) return false;

      // Actualización optimista inmediata
      setTabOrder(newOrder);

      try {
        const db = getFirestore();
        const configDocRef = doc(db, 'configuraciones', 'reporte_director_tabs');

        await setDoc(
          configDocRef,
          {
            tabOrder: newOrder,
            updatedAt: new Date().toISOString(),
            updatedBy: currentUserData?.dni || 'admin',
          },
          { merge: true }
        );

        toast.success('Orden de pestañas guardado en la base de datos.');
        return true;
      } catch (error: any) {
        console.error('Error al guardar orden de pestañas:', error);
        toast.error(`Error al guardar orden en base de datos: ${error.message || 'Error desconocido'}`);
        return false;
      }
    },
    [currentUserData]
  );

  /**
   * Guarda el nuevo nombre de una pestaña principal (grilla, brechas, tendencia, preguntas)
   */
  const saveTabLabel = useCallback(
    async (tabKey: DirectorTabKey, newLabel: string): Promise<boolean> => {
      const trimmed = newLabel.trim();
      if (!trimmed) {
        toast.warning('El nombre de la pestaña no puede estar vacío.');
        return false;
      }

      setIsSaving(true);
      try {
        const db = getFirestore();
        const configDocRef = doc(db, 'configuraciones', 'reporte_director_tabs');

        await setDoc(
          configDocRef,
          {
            tabs: {
              [tabKey]: trimmed,
            },
            updatedAt: new Date().toISOString(),
            updatedBy: currentUserData?.dni || 'admin',
          },
          { merge: true }
        );

        setTabLabels((prev) => ({
          ...prev,
          [tabKey]: trimmed,
        }));

        toast.success(`Nombre de pestaña "${trimmed}" actualizado con éxito.`);
        return true;
      } catch (error: any) {
        console.error('Error al guardar nombre de pestaña:', error);
        toast.error(`Error al guardar en base de datos: ${error.message || 'Error desconocido'}`);
        return false;
      } finally {
        setIsSaving(false);
      }
    },
    [currentUserData]
  );

  /**
   * Guarda el nuevo nombre de una pestaña de área curricular (LEE, RESUELVE PROBLEMAS, etc.)
   */
  const saveCategoriaLabel = useCallback(
    async (catId: number | string, newLabel: string): Promise<boolean> => {
      const trimmed = newLabel.trim();
      if (!trimmed) {
        toast.warning('El nombre del área curricular no puede estar vacío.');
        return false;
      }

      setIsSaving(true);
      try {
        const db = getFirestore();
        const configDocRef = doc(db, 'configuraciones', 'reporte_director_tabs');

        const catKey = String(catId);
        await setDoc(
          configDocRef,
          {
            categorias: {
              [catKey]: trimmed,
            },
            updatedAt: new Date().toISOString(),
            updatedBy: currentUserData?.dni || 'admin',
          },
          { merge: true }
        );

        setCategoriaLabels((prev) => ({
          ...prev,
          [catKey]: trimmed,
        }));

        toast.success(`Nombre de área "${trimmed}" actualizado con éxito.`);
        return true;
      } catch (error: any) {
        console.error('Error al guardar nombre de área curricular:', error);
        toast.error(`Error al guardar en base de datos: ${error.message || 'Error desconocido'}`);
        return false;
      } finally {
        setIsSaving(false);
      }
    },
    [currentUserData]
  );

  return {
    tabLabels,
    tabOrder,
    categoriaLabels,
    loading,
    isSaving,
    isAuditing,
    saveTabLabel,
    saveTabOrder,
    saveCategoriaLabel,
  };
};

export default useDirectorTabsConfig;
