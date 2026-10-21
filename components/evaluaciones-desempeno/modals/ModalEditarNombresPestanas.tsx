import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import {
  RiLoader4Line,
  RiCloseLine,
  RiRestartLine,
  RiTeamLine,
  RiLayoutBottomLine,
  RiEyeLine,
  RiCheckLine,
} from 'react-icons/ri';
import { MdAssignmentTurnedIn, MdAssignment } from 'react-icons/md';
import { doc, updateDoc } from 'firebase/firestore';
import { db } from '@/firebase/firebase.config';
import { toast } from 'react-toastify';

export interface ModalEditarNombresPestanasProps {
  idEvaluacion: string;
  collectionName?: string;
  nombresPestanasActuales?: {
    monitoreos?: string;
    padron?: string;
    rubrica?: string;
  };
  defaultNombres: {
    monitoreos: string;
    padron: string;
    rubrica: string;
  };
  onClose: () => void;
  onSuccess?: () => void;
}

export const ModalEditarNombresPestanas: React.FC<ModalEditarNombresPestanasProps> = ({
  idEvaluacion,
  collectionName = 'evaluaciones-director',
  nombresPestanasActuales,
  defaultNombres,
  onClose,
  onSuccess,
}) => {
  const [monitoreos, setMonitoreos] = useState<string>(
    nombresPestanasActuales?.monitoreos ?? defaultNombres.monitoreos
  );
  const [padron, setPadron] = useState<string>(
    nombresPestanasActuales?.padron ?? defaultNombres.padron
  );
  const [rubrica, setRubrica] = useState<string>(
    nombresPestanasActuales?.rubrica ?? defaultNombres.rubrica
  );

  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [mounted, setMounted] = useState<boolean>(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    setMonitoreos(nombresPestanasActuales?.monitoreos ?? defaultNombres.monitoreos);
    setPadron(nombresPestanasActuales?.padron ?? defaultNombres.padron);
    setRubrica(nombresPestanasActuales?.rubrica ?? defaultNombres.rubrica);
  }, [nombresPestanasActuales, defaultNombres]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && !isSaving) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose, isSaving]);

  const handleResetDefaults = () => {
    setMonitoreos(defaultNombres.monitoreos);
    setPadron(defaultNombres.padron);
    setRubrica(defaultNombres.rubrica);
  };

  const handleSave = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (isSaving) return;

    const trimmedMonitoreos = monitoreos.trim() || defaultNombres.monitoreos;
    const trimmedPadron = padron.trim() || defaultNombres.padron;
    const trimmedRubrica = rubrica.trim() || defaultNombres.rubrica;

    setIsSaving(true);

    try {
      const docRef = doc(db, collectionName, idEvaluacion);
      await updateDoc(docRef, {
        nombresPestanas: {
          monitoreos: trimmedMonitoreos,
          padron: trimmedPadron,
          rubrica: trimmedRubrica,
        },
        updatedAt: new Date().toISOString(),
      });

      toast.success('Nombres de pestañas actualizados con éxito.');
      if (onSuccess) onSuccess();
      onClose();
    } catch (err: any) {
      console.error('Error al actualizar nombres de pestañas:', err);
      toast.error(err?.message || 'Error al guardar los nombres de pestañas.');
      setIsSaving(false);
    }
  };

  if (!mounted || typeof window === 'undefined') return null;

  return createPortal(
    <div
      className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-slate-950/65 backdrop-blur-sm animate-fade-in"
      onClick={(e) => {
        if (e.target === e.currentTarget && !isSaving) onClose();
      }}
      role="dialog"
      aria-modal="true"
      aria-labelledby="modal-nombres-pestanas-title"
    >
      <div className="relative w-full max-w-xl bg-white rounded-3xl shadow-2xl border border-slate-200/80 overflow-hidden transform transition-all animate-scale-up">
        {/* Cabecera del Modal */}
        <div className="px-6 py-5 bg-gradient-to-r from-slate-50 via-white to-blue-50/40 border-b border-slate-100 flex items-center justify-between">
          <div className="flex items-center gap-3.5">
            <div className="w-11 h-11 rounded-2xl bg-gradient-to-tr from-blue-600 to-indigo-500 text-white flex items-center justify-center shadow-md shadow-blue-500/20 shrink-0">
              <RiLayoutBottomLine className="text-2xl" />
            </div>
            <div>
              <h3
                id="modal-nombres-pestanas-title"
                className="text-lg font-bold text-slate-900 tracking-tight leading-tight"
              >
                Personalizar Pestañas
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Modifica los títulos de las secciones visibles para esta evaluación
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
          {/* Vista previa en vivo */}
          <div className="bg-slate-50/80 border border-slate-200/80 rounded-2xl p-3.5">
            <div className="flex items-center justify-between mb-2">
              <span className="flex items-center gap-1.5 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                <RiEyeLine className="text-sm text-blue-500" />
                <span>Vista Previa en Vivo</span>
              </span>
              <span className="text-[11px] text-slate-400">Así se verá en la navegación</span>
            </div>
            <div className="flex items-center gap-2 overflow-x-auto pb-0.5">
              <div className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white border border-blue-200 text-blue-700 rounded-xl text-xs font-semibold shadow-2xs whitespace-nowrap">
                <MdAssignmentTurnedIn className="text-sm text-emerald-600" />
                <span>{monitoreos.trim() || defaultNombres.monitoreos}</span>
              </div>
              <div className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white/70 border border-slate-200 text-slate-600 rounded-xl text-xs font-medium whitespace-nowrap">
                <RiTeamLine className="text-sm text-blue-600" />
                <span>{padron.trim() || defaultNombres.padron}</span>
              </div>
              <div className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white/70 border border-slate-200 text-slate-600 rounded-xl text-xs font-medium whitespace-nowrap">
                <MdAssignment className="text-sm text-amber-600" />
                <span>{rubrica.trim() || defaultNombres.rubrica}</span>
              </div>
            </div>
          </div>

          {/* Campos de Configuración */}
          <div className="space-y-4">
            {/* Campo 1: Pestaña Monitoreos */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label className="flex items-center gap-2 text-xs font-semibold text-slate-700">
                  <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200/60 uppercase tracking-wide">
                    Pestaña 1
                  </span>
                  <span>Evaluaciones y monitoreos concluidos</span>
                </label>
                <span className="text-[11px] text-slate-400">Principal</span>
              </div>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-emerald-600">
                  <MdAssignmentTurnedIn className="text-lg" />
                </div>
                <input
                  type="text"
                  autoFocus
                  disabled={isSaving}
                  value={monitoreos}
                  onChange={(e) => setMonitoreos(e.target.value)}
                  placeholder={defaultNombres.monitoreos}
                  className="w-full pl-10 pr-4 py-2.5 bg-slate-50/70 hover:bg-white focus:bg-white border border-slate-200 focus:border-blue-500 rounded-xl text-sm font-medium text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-4 focus:ring-blue-500/10 transition-all shadow-2xs disabled:opacity-60"
                />
              </div>
            </div>

            {/* Campo 2: Pestaña Padrón */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label className="flex items-center gap-2 text-xs font-semibold text-slate-700">
                  <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-blue-50 text-blue-700 border border-blue-200/60 uppercase tracking-wide">
                    Pestaña 2
                  </span>
                  <span>Padrón de usuarios por UGEL</span>
                </label>
                <span className="text-[11px] text-slate-400">Directorio</span>
              </div>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-blue-600">
                  <RiTeamLine className="text-lg" />
                </div>
                <input
                  type="text"
                  disabled={isSaving}
                  value={padron}
                  onChange={(e) => setPadron(e.target.value)}
                  placeholder={defaultNombres.padron}
                  className="w-full pl-10 pr-4 py-2.5 bg-slate-50/70 hover:bg-white focus:bg-white border border-slate-200 focus:border-blue-500 rounded-xl text-sm font-medium text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-4 focus:ring-blue-500/10 transition-all shadow-2xs disabled:opacity-60"
                />
              </div>
            </div>

            {/* Campo 3: Pestaña Rúbricas */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label className="flex items-center gap-2 text-xs font-semibold text-slate-700">
                  <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-amber-50 text-amber-700 border border-amber-200/60 uppercase tracking-wide">
                    Pestaña 3
                  </span>
                  <span>Estructura de rúbricas y criterios</span>
                </label>
                <span className="text-[11px] text-slate-400">Pedagógico</span>
              </div>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-amber-600">
                  <MdAssignment className="text-lg" />
                </div>
                <input
                  type="text"
                  disabled={isSaving}
                  value={rubrica}
                  onChange={(e) => setRubrica(e.target.value)}
                  placeholder={defaultNombres.rubrica}
                  className="w-full pl-10 pr-4 py-2.5 bg-slate-50/70 hover:bg-white focus:bg-white border border-slate-200 focus:border-blue-500 rounded-xl text-sm font-medium text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-4 focus:ring-blue-500/10 transition-all shadow-2xs disabled:opacity-60"
                />
              </div>
            </div>
          </div>

          {/* Pie del Formulario y Acciones */}
          <div className="pt-2 flex items-center justify-between border-t border-slate-100 gap-3">
            <button
              type="button"
              disabled={isSaving}
              onClick={handleResetDefaults}
              className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-slate-600 hover:text-slate-900 bg-slate-100/70 hover:bg-slate-100 border border-slate-200/70 hover:border-slate-300 rounded-xl transition-all cursor-pointer disabled:opacity-50 shadow-2xs"
              title="Restablecer los valores estándar originales"
            >
              <RiRestartLine className="text-sm text-slate-500" />
              <span>Restablecer por defecto</span>
            </button>

            <div className="flex items-center gap-2.5">
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
                disabled={isSaving}
                className="inline-flex items-center justify-center gap-2 px-5 py-2.5 text-sm font-semibold text-white bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 active:scale-[0.98] rounded-xl shadow-md shadow-blue-500/20 hover:shadow-lg hover:shadow-blue-500/30 transition-all disabled:opacity-60 disabled:cursor-not-allowed cursor-pointer"
              >
                {isSaving ? (
                  <>
                    <RiLoader4Line className="text-base animate-spin" />
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
          </div>
        </form>
      </div>
    </div>,
    document.body
  );
};

export default ModalEditarNombresPestanas;
