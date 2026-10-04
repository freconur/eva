/**
 * Configuración y utilidades para el sistema de control y notificación de versiones de la aplicación.
 */

export interface AppVersionData {
  version: string;
  titulo?: string;
  mensaje?: string;
  notas?: string[] | string;
  activo?: boolean;
  forzarActualizacion?: boolean;
  fechaLanzamiento?: string;
  actualizadoPor?: string;
  buildTimestamp?: string | number;
}

// Versión inyectada en tiempo de build o fallback seguro
export const CURRENT_CLIENT_VERSION: string =
  process.env.NEXT_PUBLIC_APP_VERSION || '0.1.0';

export const CURRENT_BUILD_TIME: string =
  process.env.NEXT_PUBLIC_BUILD_TIME || '';

export const VERSION_COLLECTION = 'configuracion';
export const VERSION_DOCUMENT = 'version';

/**
 * Compara dos versiones en formato semver (ej. "1.2.3" vs "1.2.0")
 * Retorna:
 *   1 si v1 > v2
 *  -1 si v1 < v2
 *   0 si v1 === v2
 */
export function compareSemver(v1: string, v2: string): number {
  if (!v1 || !v2) return 0;
  
  // Limpiar posibles prefijos como 'v' (ej. "v1.0.0" -> "1.0.0")
  const cleanV1 = v1.trim().replace(/^v/i, '');
  const cleanV2 = v2.trim().replace(/^v/i, '');

  if (cleanV1 === cleanV2) return 0;

  const parts1 = cleanV1.split('.').map((p) => parseInt(p, 10) || 0);
  const parts2 = cleanV2.split('.').map((p) => parseInt(p, 10) || 0);

  const maxLength = Math.max(parts1.length, parts2.length);

  for (let i = 0; i < maxLength; i++) {
    const num1 = parts1[i] || 0;
    const num2 = parts2[i] || 0;

    if (num1 > num2) return 1;
    if (num1 < num2) return -1;
  }

  return 0;
}

/**
 * Determina si la versión del servidor requiere actualizar el cliente local.
 * Se considera actualización si:
 * - El flag activo es true (o undefined).
 * - La versión del servidor es mayor a la del cliente (o diferente si no sigue semver estricto).
 */
export function isUpdateAvailable(
  serverData: AppVersionData | null | undefined,
  clientVersion: string = CURRENT_CLIENT_VERSION
): boolean {
  if (!serverData || !serverData.version) return false;
  if (serverData.activo === false) return false;

  const serverVer = serverData.version.trim();
  const clientVer = clientVersion.trim();

  // Si son idénticas, no hay actualización
  if (serverVer === clientVer) return false;

  // Comparación semver
  const cmp = compareSemver(serverVer, clientVer);
  if (cmp > 0) return true;

  return false;
}

