import { useState, useEffect, useCallback } from 'react';
import { getFirestore, doc, onSnapshot, setDoc } from 'firebase/firestore';
import { ref as storageRef, uploadBytes, getDownloadURL } from 'firebase/storage';
import { storage } from '@/firebase/firebase.config';
import { toast } from 'react-toastify';
import { useGlobalContext } from '@/features/context/GlolbalContext';
import { compressBannerImage } from '@/features/utils/compressBannerImage';

export type ReporteBannerVariant = 'compact' | 'expanded';

export interface ReportesBannerConfigOptions {
  /** Identificador del rol o ruta ('especialistas' | 'directores' | 'docentes'). Default: 'directores' */
  routeKey?: 'especialistas' | 'directores' | 'docentes' | string;
  /** Variante por defecto si aún no existe en base de datos. Default: 'compact' */
  defaultVariant?: ReporteBannerVariant;
}

/**
 * Hook para gestionar la variante visual del banner de reportes (Compacta vs. Grande)
 * y su imagen de fondo opcional, con sincronización global en tiempo real por rol en Firestore (`configuraciones/reportes_banner`).
 */
export const useReportesBannerConfig = (options: ReportesBannerConfigOptions = {}) => {
  const { routeKey = 'directores', defaultVariant = 'compact' } = options;
  const { currentUserData } = useGlobalContext();

  const [variant, setVariant] = useState<ReporteBannerVariant>(defaultVariant);
  const [backgroundImage, setBackgroundImage] = useState<string | null>(null);
  const [backgroundImageOpacity, setBackgroundImageOpacity] = useState<number>(0.25);
  const [isAuditing, setIsAuditing] = useState<boolean>(false);
  const [isSavingVariant, setIsSavingVariant] = useState<boolean>(false);
  const [isUploadingImage, setIsUploadingImage] = useState<boolean>(false);
  const [loadingConfig, setLoadingConfig] = useState<boolean>(true);

  // 1. Detección de permisos de edición / administración
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const audited = sessionStorage.getItem('audited_user');
      const realAdmin = sessionStorage.getItem('real_admin_user');
      const isUserAdmin =
        currentUserData?.rol === 4 || (currentUserData as any)?.perfil?.rol === 4;
      const isRoleOwner =
        (routeKey === 'especialistas' && currentUserData?.rol === 1) ||
        (routeKey === 'directores' && currentUserData?.rol === 2) ||
        (routeKey === 'docentes' && currentUserData?.rol === 3);

      const nextVal = Boolean(audited || realAdmin || isUserAdmin || isRoleOwner);
      setIsAuditing((prev) => (prev !== nextVal ? nextVal : prev));
    }
  }, [currentUserData?.rol, (currentUserData as any)?.perfil?.rol, routeKey]);

  // 2. Suscripción en tiempo real a la configuración global por rol en Firestore
  useEffect(() => {
    let isMounted = true;
    const db = getFirestore();
    const configDocRef = doc(db, 'configuraciones', 'reportes_banner');

    const unsubscribe = onSnapshot(
      configDocRef,
      (docSnap) => {
        if (!isMounted) return;
        if (docSnap.exists()) {
          const data = docSnap.data();
          const routeConfig = data?.[routeKey];
          const savedVariant = routeConfig?.variant;

          if (savedVariant === 'compact' || savedVariant === 'expanded') {
            setVariant(savedVariant);
          } else {
            setVariant(defaultVariant);
          }

          const savedBg = routeConfig?.backgroundImage || null;
          setBackgroundImage(savedBg);

          const savedOpacity = routeConfig?.backgroundImageOpacity ?? 0.25;
          setBackgroundImageOpacity(savedOpacity);
        } else {
          setVariant(defaultVariant);
          setBackgroundImage(null);
          setBackgroundImageOpacity(0.25);
        }
        setLoadingConfig(false);
      },
      (error) => {
        console.error('Error al escuchar configuración de reportes_banner:', error);
        if (isMounted) setLoadingConfig(false);
      }
    );

    return () => {
      isMounted = false;
      unsubscribe();
    };
  }, [routeKey, defaultVariant]);

  // 3. Modificación persistente de la vista oficial en Firestore
  const setBannerVariant = useCallback(
    async (nextVariant: ReporteBannerVariant) => {
      const prevVariant = variant;
      setVariant(nextVariant); // Actualización optimista inmediata en UI
      setIsSavingVariant(true);

      try {
        const db = getFirestore();
        const configDocRef = doc(db, 'configuraciones', 'reportes_banner');

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
          `Vista del banner establecida como "${
            nextVariant === 'expanded' ? 'Grande' : 'Compacta'
          }" para todos los usuarios de este rol.`
        );
      } catch (error: any) {
        console.error('Error al guardar la vista del banner en Firestore:', error);
        setVariant(prevVariant); // Revertir estado local en caso de fallo
        toast.error(
          `Error al guardar en base de datos: ${error?.message || 'Error desconocido'}`
        );
      } finally {
        setIsSavingVariant(false);
      }
    },
    [variant, routeKey, currentUserData?.dni, currentUserData?.email]
  );

  // 4. Subida y compresión estricta a <= 100 KB de imagen de fondo
  const uploadBannerImage = useCallback(
    async (file: File): Promise<string | null> => {
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
          const fileName = `banner_reporte_${routeKey}_${Date.now()}.jpg`;
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
          // Fallback seguro en base64
          finalImageUrl = await new Promise<string>((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = () => resolve(reader.result as string);
            reader.onerror = (err) => reject(err);
            reader.readAsDataURL(compressedBlob);
          });
        }

        // C. Persistir en Firestore
        const db = getFirestore();
        const configDocRef = doc(db, 'configuraciones', 'reportes_banner');
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
    [routeKey, currentUserData?.dni, currentUserData?.email]
  );

  // 5. Eliminar imagen de fondo y restaurar fondo oficial
  const removeBannerImage = useCallback(async () => {
    setIsSavingVariant(true);
    try {
      const db = getFirestore();
      const configDocRef = doc(db, 'configuraciones', 'reportes_banner');

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
      setIsSavingVariant(false);
    }
  }, [routeKey, currentUserData?.dni, currentUserData?.email]);

  return {
    variant,
    setBannerVariant,
    isSavingVariant,
    backgroundImage,
    backgroundImageOpacity,
    uploadBannerImage,
    removeBannerImage,
    isUploadingImage,
    canEdit: isAuditing,
    loadingConfig,
  };
};

export default useReportesBannerConfig;
