import React, { useState, useRef, useEffect } from 'react';
import {
  RiFilter3Line,
  RiArrowDownSLine,
  RiCheckLine,
  RiRestartLine,
} from 'react-icons/ri';

export interface FilterOption<T = string | number> {
  value: T;
  label: string;
}

export interface FilterItem<T = string | number> {
  id: string;
  label: string;
  value: T;
  onChange: (value: T) => void;
  options: FilterOption<T>[];
  placeholder?: string;
  minWidth?: string; // e.g. "md:min-w-[150px]"
}

export interface SegmentedFilterBarProps {
  title?: string;
  filters: FilterItem<any>[];
  onReset?: () => void;
  resetLabel?: string;
  showReset?: boolean;
  className?: string;
}

export const SegmentedFilterBar: React.FC<SegmentedFilterBarProps> = ({
  title = 'Filtrar por',
  filters,
  onReset,
  resetLabel = 'Restablecer Filtros',
  showReset = true,
  className = '',
}) => {
  const [openDropdown, setOpenDropdown] = useState<string | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Cerrar al hacer clic fuera o presionar Escape
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setOpenDropdown(null);
      }
    };

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setOpenDropdown(null);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleKeyDown);

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, []);

  const hasResetButton = Boolean(showReset && onReset);

  return (
    <div className={`w-full pb-2 relative z-30 ${className}`}>
      <div
        ref={containerRef}
        className="w-full md:w-auto md:inline-flex md:items-center bg-white border border-slate-200/90 rounded-2xl shadow-xs divide-y md:divide-y-0 md:divide-x divide-slate-200"
      >
        {/* 1. Header en Desktop: Icono de Embudo (con rounded-l-2xl) */}
        <div className="hidden md:flex px-4 py-3 items-center justify-center text-slate-700 bg-white rounded-l-2xl select-none">
          <RiFilter3Line className="w-5 h-5 text-slate-700" aria-hidden="true" />
        </div>

        {/* 2. Header en Desktop: Etiqueta "Filtrar por" */}
        <div className="hidden md:block px-4 py-3 text-sm font-bold text-slate-800 whitespace-nowrap bg-white select-none">
          {title}
        </div>

        {/* Header en Mobile: Icono de Embudo + Título unificados */}
        <div className="flex md:hidden items-center gap-2.5 px-4 py-3 bg-slate-50/80 rounded-t-2xl select-none">
          <RiFilter3Line className="w-5 h-5 text-slate-700 shrink-0" aria-hidden="true" />
          <span className="text-sm font-bold text-slate-800">{title}</span>
        </div>

        {/* 3. Dropdowns de Filtro */}
        {filters.map((filter, index) => {
          const isOpen = openDropdown === filter.id;
          const isLastItem = index === filters.length - 1;
          const selectedOption = filter.options.find(
            (opt) => String(opt.value) === String(filter.value)
          );
          const displayLabel = selectedOption?.label || filter.placeholder || String(filter.value);

          // Si no hay botón de reset, el último dropdown debe redondear la esquina exterior
          const lastItemRoundClasses =
            isLastItem && !hasResetButton
              ? 'rounded-b-2xl md:rounded-b-none md:rounded-r-2xl'
              : '';

          return (
            <div key={filter.id} className="relative w-full md:w-auto">
              <button
                type="button"
                onClick={() => setOpenDropdown((prev) => (prev === filter.id ? null : filter.id))}
                aria-haspopup="listbox"
                aria-expanded={isOpen}
                className={`w-full md:w-auto flex items-center justify-between gap-2.5 px-4 py-3 min-h-[44px] md:min-h-0 text-sm font-semibold transition-colors select-none cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-colorSegundo/50 ${
                  filter.minWidth || 'md:min-w-[150px]'
                } ${lastItemRoundClasses} ${
                  isOpen
                    ? 'bg-slate-50 text-colorSegundo'
                    : 'text-slate-800 hover:bg-slate-50/80'
                }`}
              >
                <span className="truncate">{displayLabel}</span>
                <RiArrowDownSLine
                  className={`w-4 h-4 shrink-0 transition-transform duration-200 ${
                    isOpen ? 'rotate-180 text-colorSegundo' : 'text-slate-500'
                  }`}
                />
              </button>

              {isOpen && (
                <div className="absolute left-2 right-2 md:left-0 md:right-auto top-full mt-1.5 md:mt-2 z-50 min-w-[calc(100%-16px)] md:min-w-[180px] bg-white rounded-2xl shadow-xl shadow-slate-900/10 border border-slate-100 p-1.5 focus:outline-none animate-in fade-in zoom-in-95 duration-150">
                  <div className="max-h-60 overflow-y-auto space-y-0.5">
                    {filter.options.map((option) => {
                      const isSelected = String(option.value) === String(filter.value);
                      return (
                        <button
                          key={String(option.value)}
                          type="button"
                          role="option"
                          aria-selected={isSelected}
                          onClick={() => {
                            filter.onChange(option.value);
                            setOpenDropdown(null);
                          }}
                          className={`w-full flex items-center justify-between px-3.5 py-2.5 md:py-2 rounded-xl text-sm font-medium transition-colors cursor-pointer select-none ${
                            isSelected
                              ? 'bg-colorSegundo/10 text-colorSegundo font-bold'
                              : 'text-slate-700 hover:bg-slate-50 hover:text-slate-900'
                          }`}
                        >
                          <span className="truncate text-left">{option.label}</span>
                          {isSelected && (
                            <RiCheckLine className="w-4 h-4 text-colorSegundo shrink-0 ml-2" />
                          )}
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          );
        })}

        {/* 4. Botón Restablecer Filtros (icono por defecto en desktop, texto visible en hover y en mobile) */}
        {hasResetButton && (
          <button
            type="button"
            onClick={() => {
              onReset!();
              setOpenDropdown(null);
            }}
            className="group w-full md:w-auto flex items-center justify-center md:justify-start px-4 py-3 min-h-[44px] md:min-h-0 text-sm font-bold text-rose-500 hover:text-rose-600 hover:bg-rose-50/60 transition-all duration-300 whitespace-nowrap cursor-pointer select-none rounded-b-2xl md:rounded-b-none md:rounded-r-2xl focus:outline-none focus-visible:ring-2 focus-visible:ring-rose-400"
            title={resetLabel}
            aria-label={resetLabel}
          >
            <RiRestartLine className="w-4 h-4 text-rose-500 shrink-0 transition-transform duration-300 group-hover:-rotate-90" />
            <span className="inline md:max-w-0 md:opacity-0 md:overflow-hidden md:transition-all md:duration-300 md:ease-out md:group-hover:max-w-[160px] md:group-hover:opacity-100 ml-2 md:ml-0 md:group-hover:ml-2">
              {resetLabel}
            </span>
          </button>
        )}
      </div>
    </div>
  );
};

export default SegmentedFilterBar;
