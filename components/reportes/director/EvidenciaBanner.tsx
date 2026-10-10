import React from 'react';
import { Evaluaciones } from '@/features/types/types';

interface EvidenciaBannerProps {
  titulo: string;
  subtitulo?: string;
  evaluacion?: Evaluaciones;
  categoryName?: string;
}

/**
 * Membrete institucional que se inyecta exclusivamente en la captura de evidencia (PNG).
 * En la interfaz interactiva normal permanece invisible (`display: none`),
 * activándose únicamente durante la rasterización en html2canvas para conferirle
 * formato oficial de reporte pedagógico para UGEL y Directivos.
 */
export const EvidenciaBanner: React.FC<EvidenciaBannerProps> = ({
  titulo,
  subtitulo,
  evaluacion,
  categoryName,
}) => {
  const fechaHoy = new Date().toLocaleDateString('es-PE', {
    day: '2-digit',
    month: 'long',
    year: 'numeric',
  });

  return (
    <>
      <div
        data-evidence-banner="true"
        style={{ display: 'none' }}
        className="w-full p-5 mb-5 rounded-xl bg-slate-900 text-white border-b-4 border-blue-500 shadow-md"
      >
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-3.5">
            <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-blue-600 to-indigo-700 flex items-center justify-center font-black text-white text-base tracking-wider shrink-0 shadow-xs border border-blue-400/40">
              EVA
            </div>
            <div>
              <div className="text-[10px] font-extrabold tracking-widest text-blue-400 uppercase">
                UGEL · Sistema de Evaluación de los Aprendizajes
              </div>
              <h2 className="text-xl font-black text-white m-0 leading-tight">
                {titulo}
              </h2>
              {evaluacion?.nombre && (
                <div className="text-xs font-semibold text-slate-300 mt-1 uppercase tracking-wide">
                  {evaluacion.nombre}
                </div>
              )}
            </div>
          </div>

          <div className="text-right shrink-0">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg bg-slate-800/80 border border-slate-700 text-xs font-semibold text-slate-200">
              <span>📅 {fechaHoy}</span>
            </div>
            <div className="text-xs text-blue-300 font-medium mt-1">
              {categoryName ? `Área: ${categoryName}` : ''}
              {evaluacion?.grado ? ` · Grado: ${evaluacion.grado}°` : ''}
              {subtitulo ? ` · ${subtitulo}` : ''}
            </div>
          </div>
        </div>
      </div>

      <div
        data-evidence-footer="true"
        style={{ display: 'none' }}
        className="w-full pt-3 pb-1 mt-4 text-center border-t border-slate-200 text-[11px] text-slate-500 font-medium"
      >
        Evidencia pedagógica generada automáticamente desde el Portal EVA · UGEL. Válida para informes técnico-pedagógicos y acompañamiento directivo.
      </div>
    </>
  );
};

export default EvidenciaBanner;
