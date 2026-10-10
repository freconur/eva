import React from 'react';
import { RiFoldersLine, RiLayoutRowLine } from 'react-icons/ri';

export type DirectorLayoutMode = 'tabs' | 'cascade';

interface DirectorLayoutModeSwitchProps {
  mode: DirectorLayoutMode;
  onChange: (mode: DirectorLayoutMode) => void;
  variant?: 'glass' | 'light';
  className?: string;
}

export const DirectorLayoutModeSwitch: React.FC<DirectorLayoutModeSwitchProps> = ({
  mode,
  onChange,
  variant = 'light',
  className = '',
}) => {
  const isGlass = variant === 'glass';

  return (
    <div
      className={`inline-flex items-center p-0.5 sm:p-1 rounded-xl transition-all select-none ${
        isGlass
          ? 'bg-white/10 backdrop-blur-md border border-white/20 h-9 sm:h-[38px] shadow-2xs'
          : 'bg-slate-100 border border-slate-200/90 h-[42px] shadow-2xs'
      } ${className}`}
      role="group"
      aria-label="Modo de diseño del reporte"
    >
      <button
        type="button"
        onClick={() => onChange('tabs')}
        className={`h-full flex items-center gap-1.5 px-2.5 sm:px-3 text-xs font-semibold rounded-lg transition-all duration-150 cursor-pointer ${
          mode === 'tabs'
            ? 'bg-white text-slate-900 shadow-xs'
            : isGlass
            ? 'text-white/80 hover:text-white hover:bg-white/10'
            : 'text-slate-500 hover:text-blue-700 hover:bg-blue-50/50'
        }`}
        title="Ver reporte organizado por pestañas independientes"
        aria-pressed={mode === 'tabs'}
      >
        <RiFoldersLine className="w-3.5 h-3.5 shrink-0" />
        <span className="hidden sm:inline">Pestañas</span>
      </button>

      <button
        type="button"
        onClick={() => onChange('cascade')}
        className={`h-full flex items-center gap-1.5 px-2.5 sm:px-3 text-xs font-semibold rounded-lg transition-all duration-150 cursor-pointer ${
          mode === 'cascade'
            ? 'bg-white text-slate-900 shadow-xs'
            : isGlass
            ? 'text-white/80 hover:text-white hover:bg-white/10'
            : 'text-slate-500 hover:text-blue-700 hover:bg-blue-50/50'
        }`}
        title="Ver reporte en cascada vertical continua"
        aria-pressed={mode === 'cascade'}
      >
        <RiLayoutRowLine className="w-3.5 h-3.5 shrink-0" />
        <span className="hidden sm:inline">Cascada</span>
      </button>
    </div>
  );
};

export default DirectorLayoutModeSwitch;
