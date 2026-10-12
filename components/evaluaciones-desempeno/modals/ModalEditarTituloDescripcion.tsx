import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { RiLoader4Line, RiEditLine, RiCloseLine } from 'react-icons/ri';
import { MdTitle, MdDescription } from 'react-icons/md';
import { doc, updateDoc } from 'firebase/firestore';
import { db } from '@/firebase/firebase.config';
import { toast } from 'react-toastify';

export interface ModalEditarTituloDescripcionProps {
  idEvaluacion: string;
  collectionName?: string;
  tituloActual?: string;
  descripcionActual?: string;
  onClose: () => void;
  onSuccess?: () => void;
}

export const ModalEditarTituloDescripcion: React.FC<ModalEditarTituloDescripcionProps> = ({
  idEvaluacion,
  collectionName = 'evaluaciones-docentes',
  tituloActual = '',
  descripcionActual = '',
  onClose,
  onSuccess,
}) => {
  const [titulo, setTitulo] = useState<string>(tituloActual);
  const [descripcion, setDescripcion] = useState<string>(descripcionActual);
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [errorValidation, setErrorValidation] = useState<string | null>(null);
  const [mounted, setMounted] = useState<boolean>(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    setTitulo(tituloActual);
    setDescripcion(descripcionActual);
  }, [tituloActual, descripcionActual]);

  // Manejo de atajos de teclado (Escape para salir, Enter en título para guardar)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && !isSaving) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose, isSaving]);

  const handleSave = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (isSaving) return;

    const trimmedTitulo = titulo.trim();
    if (!trimmedTitulo) {
      setErrorValidation('El título de la evaluación es obligatorio.');
      return;
    }

    if (trimmedTitulo.length < 2) {
      setErrorValidation('El título debe tener al menos 2 caracteres.');
      return;
    }

    setErrorValidation(null);
    setIsSaving(true);

    try {
      const docRef = doc(db, collectionName, idEvaluacion);
      await updateDoc(docRef, {
        name: trimmedTitulo,
        descripcion: descripcion.trim(),
        updatedAt: new Date().toISOString(),
      });

      toast.success('Título y descripción actualizados con éxito.');
      if (onSuccess) onSuccess();
      onClose();
    } catch (err: any) {
      console.error('Error al actualizar título y descripción:', err);
      toast.error(err?.message || 'Error al guardar los cambios.');
      setIsSaving(false);
    }
  };

  if (!mounted || typeof window === 'undefined') return null;

  const container = document.getElementById('portal-modal') || document.body;

  return createPortal(
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-fade-in"
      onClick={(e) => {
        if (e.target === e.currentTarget && !isSaving) onClose();
      }}
      role="dialog"
      aria-modal="true"
      aria-labelledby="modal-titulo-descripcion-title"
    >
      <div className="relative w-full max-w-lg bg-white rounded-2xl shadow-2xl border border-slate-100 overflow-hidden transform transition-all">
        {/* Cabecera del Modal */}
        <div className="flex items-center justify-between px-6 py-4.5 bg-gradient-to-r from-slate-50 to-blue-50/50 border-b border-slate-100">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-600/10 border border-blue-600/20 flex items-center justify-center text-blue-600 shadow-2xs">
              <RiEditLine className="text-xl" />
            </div>
            <div>
              <h3
                id="modal-titulo-descripcion-title"
                className="text-base font-bold text-slate-800 leading-tight"
              >
                Editar Título y Descripción
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Personaliza los textos visibles en el banner y los reportes
              </p>
            </div>
          </div>
          <button
            type="button"
            disabled={isSaving}
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors disabled:opacity-40 cursor-pointer"
            aria-label="Cerrar modal"
          >
            <RiCloseLine className="text-xl" />
          </button>
        </div>

        {/* Contenido del Formulario */}
        <form onSubmit={handleSave} className="p-6 space-y-5">
          {/* Campo 1: Título de la Evaluación */}
          <div>
            <label className="flex items-center justify-between text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
              <span className="flex items-center gap-1.5">
                <MdTitle className="text-base text-blue-600" />
                <span>Título de la Evaluación</span>
                <span className="text-rose-500 font-bold">*</span>
              </span>
              <span className="text-[11px] font-normal text-slate-400">Requerido</span>
            </label>
            <input
              type="text"
              autoFocus
              disabled={isSaving}
              value={titulo}
              onChange={(e) => {
                setTitulo(e.target.value);
                if (errorValidation) setErrorValidation(null);
              }}
              placeholder="Ej. RÚBRICA DE MEDIACIÓN DIDÁCTICA"
              className={`w-full px-3.5 py-2.5 text-sm bg-slate-50 border rounded-xl text-slate-800 font-medium placeholder-slate-400 focus:bg-white focus:outline-hidden transition-all ${
                errorValidation
                  ? 'border-rose-400 focus:border-rose-500 focus:ring-2 focus:ring-rose-200'
                  : 'border-slate-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-100'
              } disabled:opacity-60`}
            />
            {errorValidation ? (
              <p className="text-xs text-rose-500 mt-1 font-medium">{errorValidation}</p>
            ) : (
              <p className="text-[11px] text-slate-400 mt-1">
                Aparece como título principal en grande en el banner superior.
              </p>
            )}
          </div>

          {/* Campo 2: Texto Descriptivo / Subtítulo */}
          <div>
            <label className="flex items-center justify-between text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
              <span className="flex items-center gap-1.5">
                <MdDescription className="text-base text-blue-600" />
                <span>Texto descriptivo (subtítulo)</span>
              </span>
              <span className="text-[11px] font-normal text-slate-400">Opcional</span>
            </label>
            <textarea
              rows={3}
              disabled={isSaving}
              value={descripcion}
              onChange={(e) => setDescripcion(e.target.value)}
              placeholder="Ej. Supervisión y acompañamiento pedagógico al desempeño docente en aula"
              className="w-full px-3.5 py-2.5 text-sm bg-slate-50 border border-slate-200 rounded-xl text-slate-800 placeholder-slate-400 focus:bg-white focus:outline-hidden focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition-all resize-none disabled:opacity-60"
            />
            <p className="text-[11px] text-slate-400 mt-1">
              Este texto se muestra directamente debajo del título principal en la cabecera y en los reportes.
            </p>
          </div>

          {/* Acciones y Botones */}
          <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
            <button
              type="button"
              disabled={isSaving}
              onClick={onClose}
              className="px-4 py-2.5 text-xs font-semibold text-slate-600 hover:text-slate-800 hover:bg-slate-100 rounded-xl transition-all disabled:opacity-50 cursor-pointer"
            >
              Cancelar
            </button>

            <button
              type="submit"
              disabled={isSaving || !titulo.trim()}
              className="inline-flex items-center gap-2 px-5 py-2.5 bg-blue-600 hover:bg-blue-700 active:scale-95 text-white text-xs font-bold rounded-xl shadow-md shadow-blue-500/20 hover:shadow-blue-500/30 transition-all disabled:opacity-50 disabled:pointer-events-none cursor-pointer"
            >
              {isSaving ? (
                <>
                  <RiLoader4Line className="w-4 h-4 animate-spin text-white" />
                  <span>Guardando...</span>
                </>
              ) : (
                <span>Guardar cambios</span>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>,
    container
  );
};

export default ModalEditarTituloDescripcion;
