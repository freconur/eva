import React, { useState, useRef, useEffect } from 'react';
import {
  MdCameraAlt,
  MdFileDownload,
  MdContentCopy,
  MdKeyboardArrowDown,
  MdRefresh,
} from 'react-icons/md';
import { Evaluaciones } from '@/features/types/types';
import { useCapturaMatriz } from './useCapturaMatriz';

interface EvidenciaCaptureButtonProps {
  targetRef: React.RefObject<HTMLElement | null>;
  titulo: string;
  subtitulo?: string;
  evaluacion?: Evaluaciones;
  categoryName?: string;
  disabled?: boolean;
}

/**
 * Botón interactivo con menú desplegable para capturar la matriz como evidencia.
 * Permite descargarla directamente como PNG en alta resolución (2x Retina) o
 * copiarla al portapapeles para pegarla al instante en documentos (Word, PPT, WhatsApp).
 * 
 * Cumple estrictamente con la guía ui-ux-design (WCAG 2.1 AA, feedback inmediato,
 * prevención de doble clic con estado isCapturing).
 */
export const EvidenciaCaptureButton: React.FC<EvidenciaCaptureButtonProps> = ({
  targetRef,
  titulo,
  subtitulo,
  evaluacion,
  categoryName,
  disabled = false,
}) => {
  const [isOpen, setIsOpen] = useState<boolean>(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const { isCapturing, capturar } = useCapturaMatriz();

  // Cerrar menú con clic exterior o con Escape
  useEffect(() => {
    if (!isOpen) return;

    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    window.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen]);

  const handleDescargar = () => {
    setIsOpen(false);
    capturar(targetRef.current, {
      titulo,
      subtitulo,
      evaluacionNombre: evaluacion?.nombre,
      tipo: 'descargar',
    });
  };

  const handleCopiar = () => {
    setIsOpen(false);
    capturar(targetRef.current, {
      titulo,
      subtitulo,
      evaluacionNombre: evaluacion?.nombre,
      tipo: 'copiar',
    });
  };

  const isDisabled = disabled || isCapturing;

  return (
    <div className="relative inline-block" ref={menuRef}>
      {/* Botón Principal Disparador */}
      <button
        type="button"
        disabled={isDisabled}
        onClick={() => setIsOpen((prev) => !prev)}
        aria-haspopup="true"
        aria-expanded={isOpen}
        title="Capturar esta matriz como evidencia en alta resolución (Descargar PNG o Copiar)"
        className={`
          inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold
          transition-all duration-150 ease-in-out shadow-2xs border
          ${
            isCapturing
              ? 'bg-blue-50 text-blue-700 border-blue-300 cursor-wait'
              : isOpen
              ? 'bg-blue-50 text-blue-700 border-blue-400 ring-2 ring-blue-500/20'
              : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-50 hover:text-slate-900 hover:border-slate-400'
          }
          focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-1
          disabled:opacity-60 disabled:cursor-not-allowed
        `}
      >
        {isCapturing ? (
          <MdRefresh className="w-3.5 h-3.5 animate-spin text-blue-600" />
        ) : (
          <MdCameraAlt className="w-3.5 h-3.5 text-blue-600" />
        )}
        <span>{isCapturing ? 'Generando evidencia...' : 'Capturar Evidencia'}</span>
        <MdKeyboardArrowDown
          className={`w-3.5 h-3.5 text-slate-500 transition-transform duration-150 ${
            isOpen ? 'rotate-180' : ''
          }`}
        />
      </button>

      {/* Menú Desplegable de Acciones */}
      {isOpen && (
        <div
          role="menu"
          aria-orientation="vertical"
          className="
            absolute right-0 mt-1.5 w-72 rounded-xl bg-white border border-slate-200/90 shadow-xl
            p-1.5 z-50 animate-in fade-in zoom-in-95 duration-100 origin-top-right
          "
        >
          <div className="px-3 py-2 border-b border-slate-100 mb-1">
            <span className="text-[11px] font-bold text-slate-800 uppercase tracking-wider block">
              Opciones de Evidencia
            </span>
            <span className="text-[11px] text-slate-500 block leading-tight mt-0.5">
              Exportación en alta calidad (2x Retina)
            </span>
          </div>

          {/* Opción 1: Descargar PNG */}
          <button
            type="button"
            role="menuitem"
            onClick={handleDescargar}
            className="
              w-full flex items-start gap-3 px-3 py-2.5 rounded-lg text-left
              hover:bg-blue-50/80 active:bg-blue-100/70 transition-colors group cursor-pointer
              focus:outline-none focus:bg-blue-50
            "
          >
            <div className="w-8 h-8 rounded-lg bg-blue-100 text-blue-700 flex items-center justify-center shrink-0 mt-0.5 group-hover:bg-blue-600 group-hover:text-white transition-colors">
              <MdFileDownload className="text-lg" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-xs font-bold text-slate-800 group-hover:text-blue-900">
                Descargar Imagen PNG
              </div>
              <div className="text-[11px] text-slate-500 group-hover:text-blue-700/80 leading-snug mt-0.5">
                Archivo de imagen nítido ideal para informes o imprimir
              </div>
            </div>
          </button>

          {/* Opción 2: Copiar al Portapapeles */}
          <button
            type="button"
            role="menuitem"
            onClick={handleCopiar}
            className="
              w-full flex items-start gap-3 px-3 py-2.5 rounded-lg text-left
              hover:bg-emerald-50/80 active:bg-emerald-100/70 transition-colors group cursor-pointer
              focus:outline-none focus:bg-emerald-50
            "
          >
            <div className="w-8 h-8 rounded-lg bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0 mt-0.5 group-hover:bg-emerald-600 group-hover:text-white transition-colors">
              <MdContentCopy className="text-base" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-xs font-bold text-slate-800 group-hover:text-emerald-900 flex items-center gap-1.5">
                <span>Copiar al Portapapeles</span>
                <span className="px-1.5 py-0.2 bg-emerald-100 text-emerald-800 text-[10px] font-semibold rounded">
                  Ctrl + V
                </span>
              </div>
              <div className="text-[11px] text-slate-500 group-hover:text-emerald-700/80 leading-snug mt-0.5">
                Pega directo en Word, PowerPoint o WhatsApp
              </div>
            </div>
          </button>

          <div className="px-3 py-1.5 mt-1 border-t border-slate-100 bg-slate-50/70 rounded-b-lg">
            <span className="text-[10px] text-slate-400 block text-center">
              🔒 100% procesado en tu navegador (sin consumo de servidor)
            </span>
          </div>
        </div>
      )}
    </div>
  );
};

export default EvidenciaCaptureButton;
