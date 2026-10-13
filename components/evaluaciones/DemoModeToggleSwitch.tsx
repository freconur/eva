import React from 'react';
import { RiPresentationLine, RiShieldCheckLine } from 'react-icons/ri';

interface Props {
  isDemoMode: boolean;
  onToggle: () => void;
  variant?: 'light' | 'glass';
  className?: string;
}

export const DemoModeToggleSwitch: React.FC<Props> = ({
  isDemoMode,
  onToggle,
  variant = 'light',
  className = '',
}) => {
  const isGlass = variant === 'glass';

  return (
    <button
      type="button"
      onClick={onToggle}
      className={`inline-flex items-center gap-2 h-9 sm:h-[38px] px-3 rounded-xl text-xs font-bold transition-all duration-200 cursor-pointer select-none shrink-0 focus:outline-none focus-visible:ring-2 ${
        isGlass
          ? isDemoMode
            ? 'bg-purple-600/90 hover:bg-purple-500 text-white border border-purple-400/60 shadow-md shadow-purple-900/40 focus-visible:ring-purple-300'
            : 'bg-white/10 hover:bg-white/20 text-white/90 border border-white/20 shadow-2xs backdrop-blur-md focus-visible:ring-white/40'
          : isDemoMode
          ? 'bg-purple-700 hover:bg-purple-800 text-white border border-purple-600 shadow-xs focus-visible:ring-purple-400'
          : 'bg-white hover:bg-purple-50 text-slate-700 hover:text-purple-700 border border-slate-200/90 hover:border-purple-300 shadow-2xs focus-visible:ring-purple-300'
      } ${className}`}
      title={
        isDemoMode
          ? 'Desactivar Modo Demo (mostrar nombres originales de estudiantes y personal)'
          : 'Activar Modo Demo (anonimizar nombres de estudiantes, docentes y director con el pool local de 400 nombres)'
      }
      aria-pressed={isDemoMode}
      aria-label="Conmutador de Modo Demostración"
    >
      {isDemoMode ? (
        <RiShieldCheckLine className="w-4 h-4 text-purple-200 animate-pulse" />
      ) : (
        <RiPresentationLine className={`w-4 h-4 ${isGlass ? 'text-purple-300' : 'text-purple-600'}`} />
      )}
      <span className="font-semibold">Modo Demo</span>
      <span
        className={`px-1.5 py-0.5 rounded-md text-[10px] font-extrabold uppercase tracking-wider transition-colors ${
          isDemoMode
            ? 'bg-purple-950/70 text-purple-200 border border-purple-400/40'
            : isGlass
            ? 'bg-black/25 text-slate-300 border border-white/10'
            : 'bg-slate-100 text-slate-600 border border-slate-200'
        }`}
      >
        {isDemoMode ? 'ON' : 'OFF'}
      </span>
    </button>
  );
};

export default DemoModeToggleSwitch;
