import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { RiLoader4Line, RiEditLine, RiCloseLine, RiCheckLine } from 'react-icons/ri';
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
      className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-slate-950/65 backdrop-blur-sm animate-fade-in"
      onClick={(e) => {
        if (e.target === e.currentTarget && !isSaving) onClose();
      }}
      role="dialog"
      aria-modal="true"
      aria-labelledby="modal-titulo-descripcion-title"
    >
      <div className="relative w-full max-w-xl bg-white rounded-3xl shadow-2xl border border-slate-200/80 overflow-hidden transform transition-all animate-scale-up">
        {/* Cabecera del Modal */}
        <div className="px-6 py-5 bg-gradient-to-r from-slate-50 via-white to-blue-50/40 border-b border-slate-100 flex items-center justify-between">
          <div className="flex items-center gap-3.5">
            <div className="w-11 h-11 rounded-2xl bg-gradient-to-tr from-blue-600 to-indigo-500 text-white flex items-center justify-center shadow-md shadow-blue-500/20 shrink-0">
              <RiEditLine className="text-2xl" />
            </div>
            <div>
              <h3
                id="modal-titulo-descripcion-title"
                className="text-lg font-bold text-slate-900 tracking-tight leading-tight"
              >
                Editar Título y Descripción
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Personaliza los textos principales visibles en el banner y los reportes
              </p>
            </div>
          </div>
          <button
            type="button"
            disabled={isSaving}
            onClick={onClose}
            className="w-8 h-8 rounded-full flex items-center justify-center text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors disabled:opacity-40 cursor-pointer"
            aria-label="Cerrar modal"
          >
            <RiCloseLine className="text-xl" />
          </button>
        </div>

        {/* Contenido del Formulario */}
        <form onSubmit={handleSave} className="p-6 space-y-5">
          {/* Campo 1: Título de la Evaluación */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label className="flex items-center gap-1.5 text-xs font-semibold text-slate-700">
                <MdTitle className="text-base text-blue-600" />
                <span>Título de la Evaluación</span>
                <span className="text-rose-500 font-bold">*</span>
              </label>
              <span className="text-[11px] text-slate-400">Visible en encabezado</span>
            </div>
            <div className="relative">
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
                className={`w-full px-4 py-2.5 text-sm bg-slate-50/70 hover:bg-white focus:bg-white border rounded-xl text-slate-800 font-medium placeholder-slate-400 focus:outline-none transition-all shadow-2xs ${
                  errorValidation
                    ? 'border-rose-400 focus:border-rose-500 focus:ring-4 focus:ring-rose-500/10'
                    : 'border-slate-200 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10'
                } disabled:opacity-60`}
              />
            </div>
            {errorValidation ? (
              <p className="text-xs text-rose-500 font-medium">{errorValidation}</p>
            ) : (
              <p className="text-[11px] text-slate-400">
                Aparece como título principal en grande en el banner superior.
              </p>
            )}
          </div>

          {/* Campo 2: Texto Descriptivo / Subtítulo */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label className="flex items-center gap-1.5 text-xs font-semibold text-slate-700">
                <MdDescription className="text-base text-blue-600" />
                <span>Texto descriptivo (subtítulo)</span>
              </label>
              <span className="text-[11px] text-slate-400">Opcional</span>
            </div>
            <textarea
              rows={3}
              disabled={isSaving}
              value={descripcion}
              onChange={(e) => setDescripcion(e.target.value)}
              placeholder="Ej. Supervisión y acompañamiento pedagógico al desempeño docente en aula"
              className="w-full px-4 py-2.5 text-sm bg-slate-50/70 hover:bg-white focus:bg-white border border-slate-200 focus:border-blue-500 rounded-xl text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-4 focus:ring-blue-500/10 transition-all resize-none shadow-2xs disabled:opacity-60"
            />
            <p className="text-[11px] text-slate-400">
              Este texto se muestra directamente debajo del título principal en la cabecera y en los reportes.
            </p>
          </div>

          {/* Acciones */}
          <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-slate-100">
            <button
              type="button"
              disabled={isSaving}
              onClick={onClose}
              className="px-4 py-2.5 text-sm font-semibold text-slate-600 hover:text-slate-800 hover:bg-slate-100 rounded-xl transition-colors disabled:opacity-50 cursor-pointer"
            >
              Cancelar
            </button>

            <button
              type="submit"
              disabled={isSaving || !titulo.trim()}
              className="inline-flex items-center justify-center gap-2 px-5 py-2.5 text-sm font-semibold text-white bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 active:scale-[0.98] rounded-xl shadow-md shadow-blue-500/20 hover:shadow-lg hover:shadow-blue-500/30 transition-all disabled:opacity-60 disabled:cursor-not-allowed cursor-pointer"
            >
              {isSaving ? (
                <>
                  <RiLoader4Line className="w-4 h-4 animate-spin text-white" />
                  <span>Guardando...</span>
                </>
              ) : (
                <>
                  <RiCheckLine className="text-base" />
                  <span>Guardar Cambios</span>
                </>
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
