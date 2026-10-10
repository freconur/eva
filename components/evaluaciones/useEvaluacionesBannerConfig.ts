import { useState, useEffect, useCallback } from 'react';
import { getFirestore, doc, onSnapshot, setDoc } from 'firebase/firestore';
import { ref as storageRef, uploadBytes, getDownloadURL } from 'firebase/storage';
import { storage } from '@/firebase/firebase.config';
import { toast } from 'react-toastify';
import { useGlobalContext } from '@/features/context/GlolbalContext';
import { compressBannerImage } from '@/features/utils/compressBannerImage';

export type EvaluacionesBannerVariant = 'compact' | 'expanded';

export interface EvaluacionesBannerConfigOptions {
  /** Identificador de la ruta o rol (ej: 'directores', 'docentes', 'especialistas'). Default: 'directores' */
  routeKey?: string;
  /** Variante por defecto si aún no existe registro en base de datos. Default: 'compact' */
  defaultVariant?: EvaluacionesBannerVariant;
}

/**
 * Hook para gestionar la variante visual del banner de evaluaciones y su imagen de fondo opcional.
 *
 * - Sincroniza en tiempo real desde Firestore (`configuraciones/evaluaciones_banner`).
 * - Detecta automáticamente si el usuario actual está en modo de auditoría o es administrador.
 * - Permite al administrador persistir la variante oficial y subir/remover una imagen de fondo (comprimida a <= 100 KB).
 */
export const useEvaluacionesBannerConfig = (
  options: EvaluacionesBannerConfigOptions = {}
) => {
  const { routeKey = 'directores', defaultVariant = 'compact' } = options;
  const { currentUserData } = useGlobalContext();

  const [variant, setVariant] = useState<EvaluacionesBannerVariant>(defaultVariant);
  const [backgroundImage, setBackgroundImage] = useState<string | null>(null);
  const [backgroundImageOpacity, setBackgroundImageOpacity] = useState<number>(0.25);
  const [customTitle, setCustomTitle] = useState<string | null>(null);
  const [customSubtitle, setCustomSubtitle] = useState<string | null>(null);
  const [isSavingTexts, setIsSavingTexts] = useState<boolean>(false);
  const [isAuditing, setIsAuditing] = useState<boolean>(false);
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [isUploadingImage, setIsUploadingImage] = useState<boolean>(false);
  const [loadingConfig, setLoadingConfig] = useState<boolean>(true);

  // 1. Detección de permisos de administración / modo auditoría
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const audited = sessionStorage.getItem('audited_user');
      const realAdmin = sessionStorage.getItem('real_admin_user');
      const isUserAdmin =
        currentUserData?.rol === 4 || currentUserData?.perfil?.rol === 4;
      const nextVal = Boolean(audited || realAdmin || isUserAdmin);
      setIsAuditing((prev) => (prev !== nextVal ? nextVal : prev));
    }
  }, [currentUserData?.rol, currentUserData?.perfil?.rol]);

  // 2. Suscripción en tiempo real a la configuración global en Firestore
  useEffect(() => {
    let isMounted = true;
    const db = getFirestore();
    const configDocRef = doc(db, 'configuraciones', 'evaluaciones_banner');

    const unsubscribe = onSnapshot(
      configDocRef,
      (docSnap) => {
        if (!isMounted) return;
        if (docSnap.exists()) {
          const data = docSnap.data();
          const routeConfig = data?.[routeKey];
          const savedVariant =
            routeConfig?.variant || (typeof data?.variant === 'string' ? data.variant : null);

          if (savedVariant === 'compact' || savedVariant === 'expanded') {
            setVariant(savedVariant);
          } else {
            setVariant(defaultVariant);
          }

          const savedBg = routeConfig?.backgroundImage || data?.backgroundImage || null;
          setBackgroundImage(savedBg);

          const savedOpacity =
            routeConfig?.backgroundImageOpacity ?? data?.backgroundImageOpacity ?? 0.25;
          setBackgroundImageOpacity(savedOpacity);

          const savedTitle = routeConfig?.title !== undefined ? routeConfig.title : null;
          setCustomTitle(savedTitle);

          const savedSubtitle = routeConfig?.subtitle !== undefined ? routeConfig.subtitle : null;
          setCustomSubtitle(savedSubtitle);
        } else {
          setVariant(defaultVariant);
          setBackgroundImage(null);
          setBackgroundImageOpacity(0.25);
          setCustomTitle(null);
          setCustomSubtitle(null);
        }
        setLoadingConfig(false);
      },
      (error) => {
        console.error('Error al escuchar configuración de evaluaciones_banner:', error);
        if (isMounted) setLoadingConfig(false);
      }
    );

    return () => {
      isMounted = false;
      unsubscribe();
    };
  }, [routeKey, defaultVariant]);

  // 3. Modificación persistente de la vista oficial por el administrador
  const setBannerVariant = useCallback(
    async (nextVariant: EvaluacionesBannerVariant) => {
      if (!isAuditing) {
        toast.warning(
          'Solo los administradores en modo auditoría pueden cambiar la vista oficial del banner.'
        );
        return;
      }

      const prevVariant = variant;
      setVariant(nextVariant); // Actualización optimista inmediata en UI
      setIsSaving(true);

      try {
        const db = getFirestore();
        const configDocRef = doc(db, 'configuraciones', 'evaluaciones_banner');

        await setDoc(
          configDocRef,
          {
            [routeKey]: {
              variant: nextVariant,
              updatedAt: new Date().toISOString(),
              updatedBy: currentUserData?.dni || currentUserData?.email || 'admin',
            },
          },
          { merge: true }
        );

        toast.success(
          `Vista oficial del banner establecida como "${
            nextVariant === 'expanded' ? 'Grande' : 'Compacta'
          }" para todos los usuarios.`
        );
      } catch (error: any) {
        console.error('Error al guardar la vista del banner en Firestore:', error);
        setVariant(prevVariant); // Revertir estado local en caso de fallo
        toast.error(
          `Error al guardar en base de datos: ${error?.message || 'Error desconocido'}`
        );
      } finally {
        setIsSaving(false);
      }
    },
    [isAuditing, variant, routeKey, currentUserData?.dni, currentUserData?.email]
  );

  // 4. Subida y compresión estricta a <= 100 KB de imagen de fondo
  const uploadBannerImage = useCallback(
    async (file: File): Promise<string | null> => {
      if (!isAuditing) {
        toast.warning('Solo administradores en modo auditoría pueden cambiar la imagen de fondo.');
        return null;
      }

      setIsUploadingImage(true);
      const toastId = toast.loading('Optimizando y comprimiendo imagen a menos de 100 KB...');

      try {
        // A. Compresión con límite estricto de 100 KB
        const compressedBlob = await compressBannerImage(file, 100 * 1024);
        const sizeInKb = Math.round(compressedBlob.size / 1024);

        toast.update(toastId, {
          render: `Subiendo imagen optimizada (${sizeInKb} KB)...`,
          isLoading: true,
        });

        // B. Intentar guardar en Firebase Storage
        let finalImageUrl: string | null = null;
        try {
          const fileName = `banner_${routeKey}_${Date.now()}.jpg`;
          const sRef = storageRef(storage, `banners/${fileName}`);
          const snapshot = await uploadBytes(sRef, compressedBlob, {
            contentType: 'image/jpeg',
          });
          finalImageUrl = await getDownloadURL(snapshot.ref);
        } catch (storageError) {
          console.warn(
            'Fallo al subir a Firebase Storage, recurriendo a guardado optimizado en Firestore:',
            storageError
          );
          // Fallback seguro: como la imagen está estrictamente comprimida a <= 100 KB,
          // se puede almacenar en base64 en Firestore sin problemas
          finalImageUrl = await new Promise<string>((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = () => resolve(reader.result as string);
            reader.onerror = (err) => reject(err);
            reader.readAsDataURL(compressedBlob);
          });
        }

        // C. Persistir en Firestore
        const db = getFirestore();
        const configDocRef = doc(db, 'configuraciones', 'evaluaciones_banner');
        await setDoc(
          configDocRef,
          {
            [routeKey]: {
              backgroundImage: finalImageUrl,
              backgroundImageOpacity: 0.25,
              updatedAt: new Date().toISOString(),
              updatedBy: currentUserData?.dni || currentUserData?.email || 'admin',
            },
          },
          { merge: true }
        );

        setBackgroundImage(finalImageUrl);
        toast.update(toastId, {
          render: `Imagen de fondo optimizada (${sizeInKb} KB) y guardada exitosamente.`,
          type: 'success',
          isLoading: false,
          autoClose: 3500,
        });

        return finalImageUrl;
      } catch (error: any) {
        console.error('Error al subir imagen de fondo:', error);
        toast.update(toastId, {
          render: `Error al procesar o subir la imagen: ${error?.message || 'Error desconocido'}`,
          type: 'error',
          isLoading: false,
          autoClose: 4000,
        });
        return null;
      } finally {
        setIsUploadingImage(false);
      }
    },
    [isAuditing, routeKey, currentUserData?.dni, currentUserData?.email]
  );

  // 5. Eliminar imagen de fondo y restaurar fondo por defecto
  const removeBannerImage = useCallback(async () => {
    if (!isAuditing) {
      toast.warning('Solo administradores en modo auditoría pueden eliminar la imagen de fondo.');
      return;
    }

    setIsSaving(true);
    try {
      const db = getFirestore();
      const configDocRef = doc(db, 'configuraciones', 'evaluaciones_banner');

      await setDoc(
        configDocRef,
        {
          [routeKey]: {
            backgroundImage: null,
            updatedAt: new Date().toISOString(),
            updatedBy: currentUserData?.dni || currentUserData?.email || 'admin',
          },
        },
        { merge: true }
      );

      setBackgroundImage(null);
      toast.success('Imagen de fondo eliminada. Se restauró el diseño oficial.');
    } catch (error: any) {
      console.error('Error al remover imagen de fondo:', error);
      toast.error(`Error al eliminar imagen: ${error?.message || 'Error desconocido'}`);
    } finally {
      setIsSaving(false);
    }
  }, [isAuditing, routeKey, currentUserData?.dni, currentUserData?.email]);

  // 6. Actualizar textos personalizados del banner (Título y Subtítulo)
  const updateBannerTexts = useCallback(
    async (newTitle: string, newSubtitle: string) => {
      if (!isAuditing) {
        toast.warning(
          'Solo los administradores en modo auditoría pueden modificar los textos del banner.'
        );
        return;
      }

      setIsSavingTexts(true);
      const prevTitle = customTitle;
      const prevSubtitle = customSubtitle;

      // Actualización optimista inmediata en la UI
      setCustomTitle(newTitle);
      setCustomSubtitle(newSubtitle);

      try {
        const db = getFirestore();
        const configDocRef = doc(db, 'configuraciones', 'evaluaciones_banner');

        await setDoc(
          configDocRef,
          {
            [routeKey]: {
              title: newTitle.trim(),
              subtitle: newSubtitle.trim(),
              updatedAt: new Date().toISOString(),
              updatedBy: currentUserData?.dni || currentUserData?.email || 'admin',
            },
          },
          { merge: true }
        );

        toast.success('Textos del banner actualizados correctamente.');
      } catch (error: any) {
        console.error('Error al actualizar textos del banner en Firestore:', error);
        setCustomTitle(prevTitle);
        setCustomSubtitle(prevSubtitle);
        toast.error(`Error al guardar textos: ${error?.message || 'Error desconocido'}`);
        throw error;
      } finally {
        setIsSavingTexts(false);
      }
    },
    [isAuditing, customTitle, customSubtitle, routeKey, currentUserData?.dni, currentUserData?.email]
  );

  // 7. Restablecer textos del banner a los valores por defecto
  const resetBannerTexts = useCallback(async () => {
    if (!isAuditing) {
      toast.warning('Solo los administradores en modo auditoría pueden restablecer los textos.');
      return;
    }

    setIsSavingTexts(true);
    const prevTitle = customTitle;
    const prevSubtitle = customSubtitle;

    setCustomTitle(null);
    setCustomSubtitle(null);

    try {
      const db = getFirestore();
      const configDocRef = doc(db, 'configuraciones', 'evaluaciones_banner');

      await setDoc(
        configDocRef,
        {
          [routeKey]: {
            title: null,
            subtitle: null,
            updatedAt: new Date().toISOString(),
            updatedBy: currentUserData?.dni || currentUserData?.email || 'admin',
          },
        },
        { merge: true }
      );

      toast.success('Textos restaurados a sus valores institucionales por defecto.');
    } catch (error: any) {
      console.error('Error al restablecer textos del banner:', error);
      setCustomTitle(prevTitle);
      setCustomSubtitle(prevSubtitle);
      toast.error(`Error al restablecer textos: ${error?.message || 'Error desconocido'}`);
      throw error;
    } finally {
      setIsSavingTexts(false);
    }
  }, [isAuditing, customTitle, customSubtitle, routeKey, currentUserData?.dni, currentUserData?.email]);

  return {
    variant,
    backgroundImage,
    backgroundImageOpacity,
    customTitle,
    customSubtitle,
    isAuditing,
    isSaving,
    isSavingTexts,
    isUploadingImage,
    loadingConfig,
    setBannerVariant,
    uploadBannerImage,
    removeBannerImage,
    updateBannerTexts,
    resetBannerTexts,
  };
};

export default useEvaluacionesBannerConfig;
