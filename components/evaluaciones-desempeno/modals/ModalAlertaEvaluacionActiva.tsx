import React, { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { MdClose, MdVisibilityOff } from 'react-icons/md';
import { RiLockLine, RiLoader4Line, RiErrorWarningLine } from 'react-icons/ri';

export interface ModalAlertaEvaluacionActivaProps {
  isOpen: boolean;
  onClose: () => void;
  onDesactivar?: () => Promise<void> | void;
  isDesactivando?: boolean;
  accionIntentada?: 'editar' | 'eliminar';
}

export const ModalAlertaEvaluacionActiva: React.FC<ModalAlertaEvaluacionActivaProps> = ({
  isOpen,
  onClose,
  onDesactivar,
  isDesactivando = false,
  accionIntentada = 'editar',
}) => {
  const [mounted, setMounted] = useState<boolean>(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && !isDesactivando) {
        onClose();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose, isDesactivando]);

  if (!isOpen || !mounted || typeof window === 'undefined') return null;

  const container = document.getElementById('portal-modal') || document.body;

  return createPortal(
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="alerta-activa-title"
      aria-describedby="alerta-activa-desc"
      className="fixed inset-0 z-[9999] bg-slate-950/65 backdrop-blur-sm flex items-center justify-center p-4 transition-all animate-fade-in"
      onClick={(e) => {
        if (e.target === e.currentTarget && !isDesactivando) onClose();
      }}
    >
      <div className="bg-white rounded-3xl shadow-2xl max-w-md w-full border border-amber-200/80 overflow-hidden relative animate-scale-up transform transition-all">
        {/* Cabecera estilizada */}
        <div className="px-6 py-5 bg-gradient-to-r from-amber-50/90 via-white to-orange-50/40 border-b border-amber-100 flex items-start justify-between">
          <div className="flex items-center gap-3.5">
            <div className="w-11 h-11 rounded-2xl bg-gradient-to-tr from-amber-500 to-amber-400 text-white flex items-center justify-center shadow-md shadow-amber-500/25 shrink-0">
              <RiLockLine className="text-2xl" />
            </div>
            <div>
              <div className="flex items-center gap-1.5 mb-0.5">
                <span className="inline-block px-2 py-0.5 rounded-md text-[10px] font-bold bg-amber-100/80 text-amber-800 border border-amber-200/60 uppercase tracking-wide">
                  Modo Protegido Activo
                </span>
              </div>
              <h3
                id="alerta-activa-title"
                className="text-lg font-bold text-slate-900 leading-tight tracking-tight"
              >
                Evaluación en Curso
              </h3>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            disabled={isDesactivando}
            aria-label="Cerrar advertencia"
            className="w-8 h-8 rounded-full flex items-center justify-center text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer disabled:opacity-50"
          >
            <MdClose className="text-xl" />
          </button>
        </div>

        {/* Mensaje descriptivo */}
        <div className="p-6 space-y-4">
          <div
            id="alerta-activa-desc"
            className="space-y-2 text-sm text-slate-600 leading-relaxed bg-amber-50/60 border border-amber-200/70 rounded-2xl p-4"
          >
            <div className="flex items-center gap-2 text-amber-900 font-semibold text-sm">
              <RiErrorWarningLine className="text-base text-amber-600 shrink-0" />
              <span>
                No es posible {accionIntentada === 'eliminar' ? 'eliminar' : 'modificar'} elementos en este estado
              </span>
            </div>
            <p className="text-xs text-slate-600 leading-relaxed pl-6">
              Para salvaguardar la coherencia de las rúbricas y las calificaciones registradas, la estructura pedagógica está protegida contra cambios. Para editar o eliminar criterios, <strong>primero debe pausar la evaluación</strong>.
            </p>
          </div>

          {/* Acciones */}
          <div className="flex items-center justify-end gap-2.5 pt-2">
            <button
              type="button"
              onClick={onClose}
              disabled={isDesactivando}
              className="px-4 py-2.5 text-xs font-semibold text-slate-600 hover:text-slate-800 hover:bg-slate-100 rounded-xl transition-colors cursor-pointer disabled:opacity-50"
            >
              Entendido
            </button>

            {onDesactivar && (
              <button
                type="button"
                disabled={isDesactivando}
                onClick={async () => {
                  await onDesactivar();
                  onClose();
                }}
                className="inline-flex items-center gap-2 px-4 py-2.5 text-xs font-semibold bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-white rounded-xl shadow-md shadow-amber-500/20 transition-all cursor-pointer disabled:opacity-50"
              >
                {isDesactivando ? (
                  <>
                    <RiLoader4Line className="w-3.5 h-3.5 animate-spin" />
                    <span>Desactivando...</span>
                  </>
                ) : (
                  <>
                    <MdVisibilityOff className="text-sm" />
                    <span>Pausar evaluación ahora</span>
                  </>
                )}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>,
    container
  );
};

export default ModalAlertaEvaluacionActiva;
