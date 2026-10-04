import React from 'react';
import { useAppVersion } from '@/features/hooks/useAppVersion';
import { 
  RiRocketLine, 
  RiRefreshLine, 
  RiCloseLine, 
  RiInformationLine
} from 'react-icons/ri';

export const UpdateNotificationBanner: React.FC = () => {
  const {
    clientVersion,
    serverData,
    updateAvailable,
    isDismissed,
    isReloading,
    reloadApp,
    dismissUpdate,
    restoreBanner,
  } = useAppVersion();

  // Si no hay actualización disponible, no renderizar nada
  if (!updateAvailable) {
    return null;
  }

  // Si el usuario descartó el banner temporalmente (y no es actualización forzada),
  // mostrar una píldora flotante compacta y no invasiva en la esquina
  if (isDismissed && !serverData?.forzarActualizacion) {
    return (
      <aside
        aria-label="Notificación de actualización pendiente"
        onClick={restoreBanner}
        className="fixed bottom-4 right-4 z-[99999] flex items-center gap-2 px-3.5 py-2 rounded-full bg-slate-900/90 text-white border border-blue-500/40 shadow-xl backdrop-blur-md cursor-pointer hover:bg-slate-800 hover:scale-105 transition-all text-xs font-medium group"
      >
        <span className="relative flex h-2.5 w-2.5">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
          <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-blue-500"></span>
        </span>
        <span className="flex items-center gap-1.5">
          <RiRefreshLine className="group-hover:rotate-180 transition-transform duration-500 text-blue-400" />
          <span>Actualización disponible ({serverData?.version || 'nueva'})</span>
        </span>
      </aside>
    );
  }

  const serverVersion = serverData?.version || 'Nueva';
  const customMessage = serverData?.mensaje;
  const customTitle = serverData?.titulo || 'Nueva versión disponible';
  const isForced = Boolean(serverData?.forzarActualizacion);

  return (
    <div
      role="alertdialog"
      aria-labelledby="banner-actualizacion-titulo"
      aria-describedby="banner-actualizacion-desc"
      className="fixed bottom-4 right-4 z-[99999] max-w-md w-[calc(100vw-2rem)] sm:w-[440px] animate-fade-in-up"
    >
      <div className="relative overflow-hidden bg-slate-900/95 border border-slate-700/80 rounded-2xl p-5 shadow-2xl backdrop-blur-xl text-slate-100 ring-1 ring-white/10">
        {/* Glow de fondo */}
        <div className="absolute -top-10 -right-10 w-32 h-32 bg-blue-600/20 rounded-full blur-2xl pointer-events-none" />
        <div className="absolute -bottom-10 -left-10 w-32 h-32 bg-indigo-600/20 rounded-full blur-2xl pointer-events-none" />

        <div className="relative z-10">
          {/* Cabecera */}
          <div className="flex items-start justify-between gap-3 mb-2.5">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-500 flex items-center justify-center text-white shadow-md shadow-blue-500/25 shrink-0">
                <RiRocketLine className="text-xl animate-pulse" />
              </div>
              <div>
                <div className="flex items-center gap-2 flex-wrap">
                  <h3 id="banner-actualizacion-titulo" className="text-base font-bold text-white tracking-tight">
                    {customTitle}
                  </h3>
                  <span className="px-2 py-0.5 text-[11px] font-semibold rounded-md bg-blue-500/20 text-blue-300 border border-blue-400/30">
                    v{serverVersion}
                  </span>
                </div>
                <p className="text-xs text-slate-400 mt-0.5">
                  Versión actual en tu navegador: v{clientVersion}
                </p>
              </div>
            </div>

            {/* Botón de cerrar / posponer */}
            {!isForced && (
              <button
                type="button"
                onClick={dismissUpdate}
                aria-label="Posponer aviso de actualización"
                className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800/80 transition-colors"
              >
                <RiCloseLine className="text-xl" />
              </button>
            )}
          </div>

          {/* Mensaje descriptivo */}
          <p id="banner-actualizacion-desc" className="text-sm text-slate-300 leading-relaxed mb-4">
            {customMessage ||
              'Hemos publicado mejoras y optimizaciones en la plataforma. Te sugerimos guardar cualquier cambio pendiente y actualizar la aplicación.'}
          </p>

          {/* Notas de la versión si existen */}
          {serverData?.notas && (
            <div className="mb-4 p-2.5 rounded-lg bg-slate-800/60 border border-slate-700/60 text-xs text-slate-300 max-h-24 overflow-y-auto">
              <div className="flex items-center gap-1.5 font-semibold text-slate-200 mb-1">
                <RiInformationLine className="text-blue-400 text-sm" />
                <span>Novedades:</span>
              </div>
              {Array.isArray(serverData.notas) ? (
                <ul className="list-disc pl-4 space-y-0.5 text-slate-400">
                  {serverData.notas.map((nota, i) => (
                    <li key={i}>{nota}</li>
                  ))}
                </ul>
              ) : (
                <p className="text-slate-400 whitespace-pre-line">{serverData.notas}</p>
              )}
            </div>
          )}

          {/* Botones de acción */}
          <div className="flex items-center gap-2.5 pt-1">
            <button
              type="button"
              onClick={reloadApp}
              disabled={isReloading}
              className="flex-1 py-2.5 px-4 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white text-sm font-semibold flex items-center justify-center gap-2 shadow-lg shadow-blue-500/30 active:scale-[0.98] transition-all disabled:opacity-75 disabled:cursor-wait"
            >
              <RiRefreshLine className={`text-base ${isReloading ? 'animate-spin' : ''}`} />
              <span>{isReloading ? 'Actualizando plataforma...' : 'Actualizar ahora'}</span>
            </button>

            {!isForced && (
              <button
                type="button"
                onClick={dismissUpdate}
                disabled={isReloading}
                className="py-2.5 px-3.5 rounded-xl bg-slate-800 hover:bg-slate-700/80 text-slate-300 hover:text-white text-sm font-medium transition-colors"
              >
                Más tarde
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default UpdateNotificationBanner;
