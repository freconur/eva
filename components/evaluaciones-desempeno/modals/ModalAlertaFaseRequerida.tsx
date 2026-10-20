import React, { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import Link from 'next/link';
import { MdWarningAmber, MdClose, MdArrowForward } from 'react-icons/md';

export interface ModalAlertaFaseRequeridaProps {
  isOpen: boolean;
  onClose: () => void;
  evaluacionTitulo?: string;
  detailUrl?: string;
}

export const ModalAlertaFaseRequerida: React.FC<ModalAlertaFaseRequeridaProps> = ({
  isOpen,
  onClose,
  evaluacionTitulo = 'Evaluación',
  detailUrl,
}) => {
  const [mounted, setMounted] = useState<boolean>(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen || !mounted || typeof window === 'undefined') return null;

  const container = document.getElementById('portal-modal') || document.body;

  return createPortal(
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="alerta-fase-title"
      aria-describedby="alerta-fase-desc"
      className="fixed inset-0 z-[9999] bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 transition-all"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full border border-amber-200/70 p-6 flex flex-col gap-4 relative animate-fadeIn transform transition-all">
        {/* Botón cerrar X */}
        <button
          type="button"
          onClick={onClose}
          aria-label="Cerrar advertencia"
          className="absolute top-4 right-4 p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-full transition-colors cursor-pointer"
        >
          <MdClose className="text-xl" />
        </button>

        {/* Encabezado con Icono Ámbar */}
        <div className="flex items-start gap-3.5">
          <div className="flex-shrink-0 w-12 h-12 rounded-xl bg-amber-50 border border-amber-200 flex items-center justify-center text-amber-600 shadow-xs">
            <MdWarningAmber className="text-2xl" />
          </div>
          <div className="pt-0.5 pr-6">
            <span className="inline-block px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-100 text-amber-800 mb-1">
              Validación de activación
            </span>
            <h3
              id="alerta-fase-title"
              className="text-lg font-bold text-slate-900 leading-tight"
            >
              Fase de evaluación requerida
            </h3>
          </div>
        </div>

        {/* Badge de título de la evaluación */}
        {evaluacionTitulo && (
          <div className="bg-slate-50 border border-slate-200/80 rounded-xl px-3.5 py-2">
            <p className="text-xs text-slate-500 font-medium">Evaluación seleccionada:</p>
            <p className="text-sm font-semibold text-slate-800 truncate" title={evaluacionTitulo}>
              {evaluacionTitulo}
            </p>
          </div>
        )}

        {/* Mensaje descriptivo */}
        <div id="alerta-fase-desc" className="space-y-2 text-sm text-slate-600 leading-relaxed">
          <p className="font-semibold text-slate-800">
            Debe crear una fase antes de activar la evaluación.
          </p>
          <p className="text-xs text-slate-500">
            Para que los evaluadores puedan comenzar el registro y se conserve el historial de
            calificaciones, es indispensable que la evaluación cuente con al menos una etapa configurada
            (por ejemplo: <em>Fase Diagnóstica</em>, <em>Ronda I</em>, <em>Octubre</em>, etc.).
          </p>
        </div>

        {/* Botones de acción */}
        <div className="flex flex-col-reverse sm:flex-row items-center justify-end gap-2.5 pt-2 border-t border-slate-100 mt-1">
          <button
            type="button"
            onClick={onClose}
            className="w-full sm:w-auto px-4 py-2.5 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors cursor-pointer"
          >
            Entendido
          </button>

          {detailUrl && (
            <Link
              href={detailUrl}
              onClick={onClose}
              className="w-full sm:w-auto inline-flex items-center justify-center gap-1.5 px-4 py-2.5 text-xs font-bold text-white bg-amber-600 hover:bg-amber-700 rounded-xl shadow-md shadow-amber-600/20 transition-all cursor-pointer"
            >
              <span>Ir a configurar fase</span>
              <MdArrowForward className="text-sm" />
            </Link>
          )}
        </div>
      </div>
    </div>,
    container
  );
};

export default ModalAlertaFaseRequerida;
