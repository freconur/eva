import React from 'react';
import { MdAddCircle } from 'react-icons/md';

export interface RubricaSectionHeaderProps {
  titulo?: string;
  subtitulo?: string;
  isAdmin: boolean;
  onAgregarDominio?: () => void;
  onAgregarCriterio?: () => void;
  onExpandAll?: () => void;
  onCollapseAll?: () => void;
  hasItems?: boolean;
}

export const RubricaSectionHeader: React.FC<RubricaSectionHeaderProps> = ({
  titulo = 'Criterios de la Ficha',
  subtitulo = 'Organiza las dimensiones pedagógicas y los criterios de evaluación.',
  isAdmin,
  onAgregarDominio,
  onAgregarCriterio,
  onExpandAll,
  onCollapseAll,
  hasItems = false,
}) => {
  return (
    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
      <div>
        <h3 className="text-base font-bold text-slate-800">{titulo}</h3>
        <p className="text-xs text-slate-500 mt-0.5">{subtitulo}</p>
      </div>

      <div className="flex items-center gap-2 flex-wrap">
        {hasItems && onExpandAll && onCollapseAll && (
          <div className="flex items-center gap-1.5 mr-1">
            <button
              type="button"
              onClick={onExpandAll}
              className="px-3 py-1.5 text-xs font-semibold text-slate-600 hover:text-blue-600 bg-slate-100 hover:bg-blue-50 rounded-xl transition-colors cursor-pointer"
            >
              Expandir todos
            </button>
            <button
              type="button"
              onClick={onCollapseAll}
              className="px-3 py-1.5 text-xs font-semibold text-slate-600 hover:text-blue-600 bg-slate-100 hover:bg-blue-50 rounded-xl transition-colors cursor-pointer"
            >
              Contraer todos
            </button>
          </div>
        )}

        {isAdmin && (
          <>
            {onAgregarDominio && (
              <button
                type="button"
                onClick={onAgregarDominio}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-bold rounded-xl border border-blue-200 text-blue-700 bg-blue-50 hover:bg-blue-100 hover:border-blue-300 transition-all cursor-pointer shadow-2xs"
                title="Agregar nuevo dominio pedagógico"
              >
                <MdAddCircle className="text-base text-blue-600" />
                <span>Dominio</span>
              </button>
            )}

            {onAgregarCriterio && (
              <button
                type="button"
                onClick={onAgregarCriterio}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-bold rounded-xl bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white shadow-sm shadow-blue-500/20 hover:shadow-md hover:shadow-blue-500/30 transition-all cursor-pointer"
                title="Agregar nuevo criterio de evaluación"
              >
                <MdAddCircle className="text-base text-white" />
                <span>Criterio</span>
              </button>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default RubricaSectionHeader;
