import React, { useState, useEffect, useRef } from 'react';
import { HiOutlineDownload } from 'react-icons/hi';
import { RiFilePdfLine, RiFileExcel2Line, RiLoader4Line, RiArrowDownSLine } from 'react-icons/ri';

interface DirectorExportMenuProps {
  loadingExport: boolean;
  loadingPDF: boolean;
  disabled: boolean;
  allowExportGrillaPdf: boolean;
  allowExportExcel: boolean;
  allowGenerarPdfPreguntas: boolean;
  imagenesGeneradas: boolean;
  hasPreguntasConImagenes: boolean;
  onExport: (type: 'excel' | 'pdf-tabla' | 'pdf-preguntas') => void;
}

export const DirectorExportMenu: React.FC<DirectorExportMenuProps> = ({
  loadingExport,
  loadingPDF,
  disabled,
  allowExportGrillaPdf,
  allowExportExcel,
  allowGenerarPdfPreguntas,
  imagenesGeneradas,
  hasPreguntasConImagenes,
  onExport,
}) => {
  const [isOpen, setIsOpen] = useState<boolean>(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Cerrar al hacer clic fuera o presionar Escape
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, []);

  const handleSelect = (type: 'excel' | 'pdf-tabla' | 'pdf-preguntas') => {
    onExport(type);
    setIsOpen(false);
  };

  const isProcessing = loadingExport || loadingPDF;

  return (
    <div className="relative inline-block" ref={dropdownRef}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        disabled={disabled || isProcessing}
        aria-haspopup="true"
        aria-expanded={isOpen}
        className={`h-[42px] px-3.5 sm:px-4 rounded-xl text-xs sm:text-sm font-semibold transition-all duration-150 inline-flex items-center justify-between gap-2.5 shadow-2xs border outline-none select-none ${
          isOpen
            ? 'bg-blue-50/70 border-blue-500 text-blue-900 ring-2 ring-blue-100'
            : 'bg-white hover:bg-slate-50 border-slate-200/90 hover:border-slate-300 text-slate-700 hover:text-slate-900'
        } ${
          disabled || isProcessing
            ? 'opacity-60 cursor-not-allowed bg-slate-50'
            : 'cursor-pointer active:scale-[0.99]'
        }`}
      >
        <HiOutlineDownload
          className={`w-4 h-4 text-blue-600 shrink-0 transition-transform ${
            isProcessing ? 'animate-bounce' : ''
          }`}
        />
        <span className="whitespace-nowrap">
          {isProcessing ? 'Procesando...' : 'Exportar Reporte'}
        </span>
        <RiArrowDownSLine
          className={`w-4 h-4 text-slate-400 shrink-0 transition-transform duration-200 ${
            isOpen ? 'rotate-180 text-blue-600' : ''
          }`}
        />
      </button>

      {isOpen && (
        <div
          role="menu"
          className="absolute right-0 top-[calc(100%+6px)] z-50 w-72 p-1.5 bg-white rounded-2xl border border-slate-200/90 shadow-xl shadow-slate-900/10 flex flex-col gap-1"
        >
          {allowExportGrillaPdf && (
            <button
              type="button"
              role="menuitem"
              onClick={() => handleSelect('pdf-tabla')}
              className="flex items-center gap-3 p-2.5 rounded-xl text-left hover:bg-slate-50 active:bg-slate-100 transition-colors group cursor-pointer w-full border-none outline-none"
            >
              <div className="w-9 h-9 rounded-lg bg-rose-50 flex items-center justify-center text-rose-600 group-hover:scale-105 transition-transform shrink-0">
                <RiFilePdfLine className="w-5 h-5" />
              </div>
              <div className="flex flex-col min-w-0">
                <span className="text-xs sm:text-sm font-semibold text-slate-800 group-hover:text-rose-600 transition-colors">
                  Exportar Grilla PDF
                </span>
                <span className="text-[11px] text-slate-500 truncate">
                  Reporte tabular de resultados
                </span>
              </div>
            </button>
          )}

          {allowExportExcel && (
            <button
              type="button"
              role="menuitem"
              onClick={() => handleSelect('excel')}
              className="flex items-center gap-3 p-2.5 rounded-xl text-left hover:bg-slate-50 active:bg-slate-100 transition-colors group cursor-pointer w-full border-none outline-none"
            >
              <div className="w-9 h-9 rounded-lg bg-emerald-50 flex items-center justify-center text-emerald-600 group-hover:scale-105 transition-transform shrink-0">
                <RiFileExcel2Line className="w-5 h-5" />
              </div>
              <div className="flex flex-col min-w-0">
                <span className="text-xs sm:text-sm font-semibold text-slate-800 group-hover:text-emerald-600 transition-colors">
                  Exportar a Excel
                </span>
                <span className="text-[11px] text-slate-500 truncate">
                  Datos crudos para análisis
                </span>
              </div>
            </button>
          )}

          {allowGenerarPdfPreguntas && (
            <button
              type="button"
              role="menuitem"
              disabled={!imagenesGeneradas || !hasPreguntasConImagenes}
              onClick={() => {
                if (imagenesGeneradas && hasPreguntasConImagenes) {
                  handleSelect('pdf-preguntas');
                }
              }}
              className={`flex items-center gap-3 p-2.5 rounded-xl text-left transition-colors group w-full border-none outline-none ${
                !imagenesGeneradas || !hasPreguntasConImagenes
                  ? 'opacity-60 cursor-not-allowed bg-slate-50/50'
                  : 'hover:bg-slate-50 active:bg-slate-100 cursor-pointer'
              }`}
            >
              <div className="w-9 h-9 rounded-lg bg-indigo-50 flex items-center justify-center text-indigo-600 group-hover:scale-105 transition-transform shrink-0">
                <RiFilePdfLine className="w-5 h-5" />
              </div>
              <div className="flex flex-col min-w-0 flex-1">
                <span className="text-xs sm:text-sm font-semibold text-slate-800 group-hover:text-indigo-600 transition-colors">
                  {!imagenesGeneradas
                    ? 'Preparando PDF Preguntas...'
                    : 'Generar PDF Preguntas'}
                </span>
                <span className="text-[11px] text-slate-500 truncate">
                  Reporte gráfico detallado
                </span>
              </div>
              {!imagenesGeneradas && (
                <RiLoader4Line className="w-4 h-4 animate-spin text-indigo-500 shrink-0" />
              )}
            </button>
          )}
        </div>
      )}
    </div>
  );
};

export default DirectorExportMenu;
