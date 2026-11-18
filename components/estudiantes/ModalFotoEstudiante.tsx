import React, { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { UserEstudiante } from '@/features/types/types';
import { compressCarnetImage } from '@/features/utils/compressCarnetImage';
import { getStorage, ref as storageRef, uploadBytes, getDownloadURL, deleteObject } from 'firebase/storage';
import { useAgregarEvaluaciones } from '@/features/hooks/useAgregarEvaluaciones';
import { convertGrade, converSeccion } from '@/fuctions/regiones';
import { toast } from 'react-toastify';
import {
  RiCloseLine,
  RiCameraLine,
  RiUpload2Line,
  RiDeleteBinLine,
  RiLoader4Line,
  RiCheckLine,
  RiUser3Line,
} from 'react-icons/ri';

interface ModalFotoEstudianteProps {
  isOpen: boolean;
  onClose: () => void;
  student: UserEstudiante | null;
  dniDocente?: string;
  onSuccess?: (dni: string, fotoUrl: string | null) => void;
}

const ModalFotoEstudiante: React.FC<ModalFotoEstudianteProps> = ({
  isOpen,
  onClose,
  student,
  dniDocente,
  onSuccess,
}) => {
  const { actualizarFotoEstudiante } = useAgregarEvaluaciones();
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [compressedBlob, setCompressedBlob] = useState<Blob | null>(null);
  const [compressedSizeKb, setCompressedSizeKb] = useState<number | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (isOpen && student) {
      setPreviewUrl(student.fotoUrl || student.foto || null);
      setCompressedBlob(null);
      setCompressedSizeKb(null);
      setIsProcessing(false);
      setIsSaving(false);
    }
  }, [isOpen, student]);

  if (!isOpen || !student) return null;

  const currentSavedPhoto = student.fotoUrl || student.foto || null;
  const hasPendingNewPhoto = Boolean(compressedBlob && previewUrl && previewUrl !== currentSavedPhoto);

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setIsProcessing(true);
      const res = await compressCarnetImage(file, {
        targetWidth: 300,
        targetHeight: 360,
        maxSizeBytes: 45 * 1024,
      });

      setPreviewUrl(res.dataUrl);
      setCompressedBlob(res.blob);
      setCompressedSizeKb(res.sizeInKb);
    } catch (err: any) {
      console.error('Error al procesar foto carnet:', err);
      toast.error(err?.message || 'Error al procesar la imagen seleccionada');
    } finally {
      setIsProcessing(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleSave = async () => {
    if (!student.dni) return;

    if (!compressedBlob) {
      toast.info('No hay cambios pendientes de foto por guardar.');
      return;
    }

    try {
      setIsSaving(true);
      const toastId = toast.loading('Guardando foto carnet del estudiante...');

      // 1. Subida a Storage (con fallback a Base64 optimizado en Firestore si Storage falla)
      let finalPhotoUrl = previewUrl || '';
      try {
        const storage = getStorage();
        const sRef = storageRef(storage, `estudiantes/${student.dni}/foto.jpg`);
        const snapshot = await uploadBytes(sRef, compressedBlob, {
          contentType: 'image/jpeg',
        });
        finalPhotoUrl = await getDownloadURL(snapshot.ref);
      } catch (storageErr) {
        console.warn('Advertencia al subir a Storage, guardando vista previa optimizada en Firestore:', storageErr);
        if (!finalPhotoUrl) {
          throw storageErr;
        }
      }

      // 2. Actualizar registro en Firestore
      const targetDocenteDni = dniDocente || student.dniDocente;
      await actualizarFotoEstudiante(student.dni, finalPhotoUrl, targetDocenteDni);

      // 3. Notificar callback
      if (onSuccess) {
        onSuccess(student.dni, finalPhotoUrl);
      }

      toast.update(toastId, {
        render: `Foto carnet guardada exitosamente (${compressedSizeKb || 25} KB).`,
        type: 'success',
        isLoading: false,
        autoClose: 3000,
      });

      onClose();
    } catch (err: any) {
      console.error('Error al guardar foto carnet:', err);
      toast.error(err?.message || 'Error al guardar la foto del estudiante');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!student.dni || !currentSavedPhoto) return;
    const confirmed = window.confirm(
      `¿Estás seguro de que deseas eliminar la foto de ${student.nombresApellidos || 'este estudiante'}?`
    );
    if (!confirmed) return;

    try {
      setIsSaving(true);
      const toastId = toast.loading('Eliminando foto carnet...');

      // 1. Intentar borrar de Storage si existe
      try {
        const storage = getStorage();
        const sRef = storageRef(storage, `estudiantes/${student.dni}/foto.jpg`);
        await deleteObject(sRef);
      } catch (storageErr) {
        console.warn('Archivo en Storage no encontrado o ya eliminado:', storageErr);
      }

      // 2. Actualizar Firestore
      const targetDocenteDni = dniDocente || student.dniDocente;
      await actualizarFotoEstudiante(student.dni, null, targetDocenteDni);

      // 3. Notificar callback
      if (onSuccess) {
        onSuccess(student.dni, null);
      }

      setPreviewUrl(null);
      setCompressedBlob(null);
      setCompressedSizeKb(null);

      toast.update(toastId, {
        render: 'Foto carnet eliminada correctamente.',
        type: 'info',
        isLoading: false,
        autoClose: 2500,
      });

      onClose();
    } catch (err: any) {
      console.error('Error al eliminar foto carnet:', err);
      toast.error(err?.message || 'Error al eliminar la foto');
    } finally {
      setIsSaving(false);
    }
  };

  let container: HTMLElement | null = null;
  if (typeof window !== 'undefined') {
    container = document.getElementById('portal-modal');
  }

  const modalContent = (
    <div className="fixed inset-0 z-[10000] flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs animate-backdrop-fade">
      <div className="relative w-full max-w-sm transform overflow-hidden rounded-2xl bg-white p-6 shadow-2xl border border-slate-100 transition-all">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-xl bg-blue-50 text-blue-600">
              <RiCameraLine className="text-xl" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-800 leading-tight">
                Foto Carnet
              </h3>
              <p className="text-xs text-slate-400">
                Ficha y reportes oficiales
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-full p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition-colors cursor-pointer"
            aria-label="Cerrar modal"
          >
            <RiCloseLine className="text-xl" />
          </button>
        </div>

        {/* Student summary info */}
        <div className="mt-3 bg-slate-50 rounded-xl p-3 border border-slate-100/80">
          <p className="text-xs font-bold text-slate-800 uppercase tracking-tight truncate">
            {student.nombresApellidos || 'Estudiante'}
          </p>
          <div className="flex items-center gap-2 mt-1 text-[11px] text-slate-500 font-medium">
            <span>DNI: <strong className="font-mono text-slate-700">{student.dni}</strong></span>
            <span>•</span>
            <span>Grado: <strong className="text-slate-700">{convertGrade(String(student.grado || ''))}</strong></span>
            {student.seccion && (
              <>
                <span>•</span>
                <span>Sec: <strong className="text-slate-700">{converSeccion(Number(student.seccion))?.toUpperCase() || student.seccion.toUpperCase()}</strong></span>
              </>
            )}
          </div>
        </div>

        {/* Carnet Photo Box (proporción 5:6 / 2.5 x 3.0 cm) */}
        <div className="my-5 flex flex-col items-center">
          <div className="relative w-36 h-44 rounded-xl border-2 border-dashed border-slate-300 bg-slate-50 overflow-hidden flex flex-col items-center justify-center shadow-xs group">
            {previewUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={previewUrl}
                alt={`Foto de ${student.nombresApellidos}`}
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="flex flex-col items-center justify-center p-3 text-center text-slate-400">
                <RiUser3Line className="text-4xl text-slate-300 mb-1" />
                <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                  Foto Carnet
                </span>
                <span className="text-[10px] text-slate-400 mt-0.5">
                  2.5 × 3.0 cm
                </span>
              </div>
            )}

            {/* Loading overlay during compression */}
            {isProcessing && (
              <div className="absolute inset-0 bg-slate-900/60 flex flex-col items-center justify-center text-white text-xs gap-1 backdrop-blur-2xs">
                <RiLoader4Line className="text-2xl animate-spin text-white" />
                <span>Optimizando...</span>
              </div>
            )}

            {/* Quick action button overlay on carnet */}
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              disabled={isProcessing || isSaving}
              aria-label="Seleccionar o cambiar imagen"
              title="Cambiar fotografía"
              className="absolute inset-0 bg-slate-900/40 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center text-white text-xs font-semibold gap-1 cursor-pointer focus:opacity-100"
            >
              <RiUpload2Line className="text-xl" />
              <span className="text-[11px]">Elegir foto</span>
            </button>
          </div>

          {/* Badge de optimización / estado */}
          {compressedSizeKb !== null ? (
            <span className="mt-2.5 inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-emerald-50 text-emerald-700 border border-emerald-200">
              <RiCheckLine className="text-sm" />
              Lista para guardar ({compressedSizeKb} KB)
            </span>
          ) : currentSavedPhoto ? (
            <span className="mt-2.5 inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-50 text-blue-700 border border-blue-200">
              Foto carnet registrada
            </span>
          ) : (
            <span className="mt-2.5 text-[11px] text-slate-400">
              Formatos aceptados: JPG, PNG o WEBP (máx. 45 KB)
            </span>
          )}

          <input
            ref={fileInputRef}
            type="file"
            accept="image/jpeg,image/png,image/webp"
            onChange={handleFileSelect}
            className="hidden"
          />
        </div>

        {/* Action Buttons */}
        <div className="space-y-2 pt-2 border-t border-slate-100">
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              disabled={isProcessing || isSaving}
              className="flex-1 inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 transition-all cursor-pointer disabled:opacity-50"
            >
              <RiUpload2Line className="text-sm" />
              <span>{previewUrl ? 'Cambiar imagen' : 'Seleccionar foto'}</span>
            </button>

            {hasPendingNewPhoto && (
              <button
                type="button"
                onClick={handleSave}
                disabled={isSaving}
                className="flex-1 inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 transition-all shadow-xs cursor-pointer disabled:opacity-50"
              >
                {isSaving ? (
                  <RiLoader4Line className="text-sm animate-spin" />
                ) : (
                  <RiCheckLine className="text-sm" />
                )}
                <span>{isSaving ? 'Guardando...' : 'Guardar foto'}</span>
              </button>
            )}
          </div>

          <div className="flex items-center justify-between pt-1">
            {currentSavedPhoto ? (
              <button
                type="button"
                onClick={handleDelete}
                disabled={isSaving}
                className="inline-flex items-center gap-1 text-xs text-red-600 hover:text-red-700 hover:underline cursor-pointer disabled:opacity-50"
              >
                <RiDeleteBinLine />
                <span>Eliminar foto actual</span>
              </button>
            ) : (
              <div />
            )}

            <button
              type="button"
              onClick={onClose}
              disabled={isSaving}
              className="text-xs text-slate-500 hover:text-slate-700 font-medium px-2 py-1 rounded-lg hover:bg-slate-50 cursor-pointer"
            >
              Cerrar
            </button>
          </div>
        </div>
      </div>
    </div>
  );

  return container ? createPortal(modalContent, container) : modalContent;
};

export default ModalFotoEstudiante;
