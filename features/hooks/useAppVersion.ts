import { useState, useEffect, useCallback } from 'react';
import { doc, onSnapshot } from 'firebase/firestore';
import { db } from '@/firebase/firebase.config';
import {
  AppVersionData,
  CURRENT_CLIENT_VERSION,
  VERSION_COLLECTION,
  VERSION_DOCUMENT,
  isUpdateAvailable,
} from '@/features/version/version.config';

export interface UseAppVersionReturn {
  clientVersion: string;
  serverData: AppVersionData | null;
  updateAvailable: boolean;
  isDismissed: boolean;
  isReloading: boolean;
  isLoading: boolean;
  reloadApp: () => void;
  dismissUpdate: () => void;
  restoreBanner: () => void;
}

const STORAGE_KEY_PREFIX = 'app_update_dismissed_';

export function useAppVersion(): UseAppVersionReturn {
  const [serverData, setServerData] = useState<AppVersionData | null>(null);
  const [isDismissed, setIsDismissed] = useState<boolean>(false);
  const [isReloading, setIsReloading] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // Escuchar cambios en tiempo real desde Firestore
  useEffect(() => {
    const docRef = doc(db, VERSION_COLLECTION, VERSION_DOCUMENT);

    const unsubscribe = onSnapshot(
      docRef,
      (docSnap) => {
        setIsLoading(false);
        if (docSnap.exists()) {
          const data = docSnap.data() as AppVersionData;
          setServerData(data);

          // Verificar si el usuario ya descartó esta versión específica en esta sesión
          if (typeof window !== 'undefined' && data?.version) {
            const dismissed = sessionStorage.getItem(`${STORAGE_KEY_PREFIX}${data.version}`);
            // Si la actualización está marcada como obligatoria/forzada, no se permite descartar
            if (data.forzarActualizacion) {
              setIsDismissed(false);
            } else {
              setIsDismissed(dismissed === 'true');
            }
          }
        } else {
          setServerData(null);
        }
      },
      (error) => {
        // En caso de error de red o permisos, se registra sin interrumpir la app
        console.warn('Control de versiones: no se pudo consultar la versión remota.', error.message);
        setIsLoading(false);
      }
    );

    return () => unsubscribe();
  }, []);

  const updateAvailable = isUpdateAvailable(serverData, CURRENT_CLIENT_VERSION);

  const reloadApp = useCallback(() => {
    setIsReloading(true);
    // Limpiar sessionStorage de versiones descartadas para la nueva sesión
    if (typeof window !== 'undefined' && serverData?.version) {
      sessionStorage.removeItem(`${STORAGE_KEY_PREFIX}${serverData.version}`);
      
      // Recarga forzada limpia
      window.location.reload();
    }
  }, [serverData]);

  const dismissUpdate = useCallback(() => {
    if (typeof window !== 'undefined' && serverData?.version) {
      sessionStorage.setItem(`${STORAGE_KEY_PREFIX}${serverData.version}`, 'true');
      setIsDismissed(true);
    }
  }, [serverData]);

  const restoreBanner = useCallback(() => {
    if (typeof window !== 'undefined' && serverData?.version) {
      sessionStorage.removeItem(`${STORAGE_KEY_PREFIX}${serverData.version}`);
      setIsDismissed(false);
    }
  }, [serverData]);

  return {
    clientVersion: CURRENT_CLIENT_VERSION,
    serverData,
    updateAvailable,
    isDismissed,
    isReloading,
    isLoading,
    reloadApp,
    dismissUpdate,
    restoreBanner,
  };
}

export default useAppVersion;
