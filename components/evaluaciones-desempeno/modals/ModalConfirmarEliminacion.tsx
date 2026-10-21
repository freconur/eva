import React, { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { MdClose, MdDeleteForever } from 'react-icons/md';
import { RiLoader4Line, RiErrorWarningLine } from 'react-icons/ri';

export interface ModalConfirmarEliminacionProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => Promise<void> | void;
  isDeleting?: boolean;
  titulo?: string;
  nombreElemento?: string;
  descripcion?: string;
  advertenciaCascada?: string;
  textoBotonConfirmar?: string;
}

export const ModalConfirmarEliminacion: React.FC<ModalConfirmarEliminacionProps> = ({
  isOpen,
  onClose,
  onConfirm,
  isDeleting = false,
  titulo = '¿Eliminar elemento?',
  nombreElemento,
  descripcion = 'Esta acción eliminará el registro de la evaluación de forma permanente.',
  advertenciaCascada,
  textoBotonConfirmar = 'Eliminar definitivamente',
}) => {
  const [mounted, setMounted] = useState<boolean>(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && !isDeleting) {
        onClose();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose, isDeleting]);

  if (!isOpen || !mounted || typeof window === 'undefined') return null;

  const container = document.getElementById('portal-modal') || document.body;

  return createPortal(
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="confirm-delete-title"
      className="fixed inset-0 z-[9999] bg-slate-950/65 backdrop-blur-sm flex items-center justify-center p-4 transition-all animate-fade-in"
      onClick={(e) => {
        if (e.target === e.currentTarget && !isDeleting) onClose();
      }}
    >
      <div className="bg-white rounded-3xl shadow-2xl max-w-md w-full border border-rose-200/80 overflow-hidden relative animate-scale-up transform transition-all">
        {/* Cabecera estilizada */}
        <div className="px-6 py-5 bg-gradient-to-r from-rose-50/90 via-white to-red-50/40 border-b border-rose-100 flex items-start justify-between">
          <div className="flex items-center gap-3.5">
            <div className="w-11 h-11 rounded-2xl bg-gradient-to-tr from-rose-600 to-red-500 text-white flex items-center justify-center shadow-md shadow-rose-500/25 shrink-0">
              <MdDeleteForever className="text-2xl" />
            </div>
            <div>
              <div className="flex items-center gap-1.5 mb-0.5">
                <span className="inline-block px-2 py-0.5 rounded-md text-[10px] font-bold bg-rose-100/80 text-rose-800 border border-rose-200/60 uppercase tracking-wide">
                  Confirmación requerida
                </span>
              </div>
              <h3
                id="confirm-delete-title"
                className="text-lg font-bold text-slate-900 leading-tight tracking-tight"
              >
                {titulo}
              </h3>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            disabled={isDeleting}
            aria-label="Cerrar modal"
            className="w-8 h-8 rounded-full flex items-center justify-center text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer disabled:opacity-50"
          >
            <MdClose className="text-xl" />
          </button>
        </div>

        {/* Contenido */}
        <div className="p-6 space-y-4">
          {/* Nombre del elemento seleccionado */}
          {nombreElemento && (
            <div className="bg-slate-50/90 border border-slate-200/80 rounded-2xl p-3.5">
              <p className="text-[11px] text-slate-400 font-semibold uppercase tracking-wider mb-1">
                Elemento seleccionado:
              </p>
              <p className="text-sm font-bold text-slate-800 line-clamp-2" title={nombreElemento}>
                &ldquo;{nombreElemento}&rdquo;
              </p>
            </div>
          )}

          {/* Advertencia principal */}
          <div className="flex items-start gap-2.5 text-xs text-slate-600 leading-relaxed bg-rose-50/50 border border-rose-100 rounded-2xl p-3.5">
            <RiErrorWarningLine className="text-base text-rose-500 shrink-0 mt-0.5" />
            <p>{descripcion}</p>
          </div>

          {/* Advertencia en Cascada (si aplica) */}
          {advertenciaCascada && (
            <div className="flex items-start gap-2 text-xs font-semibold text-rose-800 bg-rose-100/60 border border-rose-200 rounded-2xl p-3.5">
              <RiErrorWarningLine className="text-base text-rose-600 shrink-0 mt-0.5" />
              <span>{advertenciaCascada}</span>
            </div>
          )}

          {/* Acciones */}
          <div className="flex items-center justify-end gap-2.5 pt-2">
            <button
              type="button"
              onClick={onClose}
              disabled={isDeleting}
              className="px-4 py-2.5 text-xs font-semibold text-slate-600 hover:text-slate-800 hover:bg-slate-100 rounded-xl transition-colors cursor-pointer disabled:opacity-50"
            >
              Cancelar
            </button>

            <button
              type="button"
              onClick={onConfirm}
              disabled={isDeleting}
              className="inline-flex items-center gap-2 px-5 py-2.5 text-xs font-semibold bg-gradient-to-r from-rose-600 to-red-600 hover:from-rose-700 hover:to-red-700 active:scale-[0.98] text-white rounded-xl shadow-md shadow-rose-600/20 hover:shadow-lg hover:shadow-rose-600/30 transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isDeleting ? (
                <>
                  <RiLoader4Line className="text-base animate-spin" />
                  <span>Eliminando...</span>
                </>
              ) : (
                <span>{textoBotonConfirmar}</span>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>,
    container
  );
};

export default ModalConfirmarEliminacion;
