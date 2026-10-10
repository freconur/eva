import React, { useState, useRef, useEffect } from 'react';
import {
  RiFilter3Line,
  RiArrowDownSLine,
  RiCheckLine,
  RiRestartLine,
  RiLock2Line,
  RiSearchLine,
} from 'react-icons/ri';

export interface FilterOption<T = string | number> {
  value: T;
  label: string;
  badge?: string;
  badgeType?: 'neutral' | 'success' | 'warning';
  icon?: React.ReactNode;
}

export interface FilterItem<T = string | number> {
  id: string;
  label: string;
  value: T;
  onChange: (value: T) => void;
  options: FilterOption<T>[];
  placeholder?: string;
  minWidth?: string; // e.g. "md:min-w-[150px]"
  disabled?: boolean;
  icon?: React.ReactNode;
  showSearch?: boolean;
}

export type ExtraActionsRenderProps = {
  openDropdown: string | null;
  setOpenDropdown: React.Dispatch<React.SetStateAction<string | null>>;
};

export interface SegmentedFilterBarProps {
  title?: string;
  filters: FilterItem<any>[];
  onReset?: () => void;
  resetLabel?: string;
  showReset?: boolean;
  className?: string;
  extraActions?:
    | React.ReactNode
    | ((props: ExtraActionsRenderProps) => React.ReactNode);
}

export const SegmentedFilterBar: React.FC<SegmentedFilterBarProps> = ({
  title = 'Filtrar por',
  filters,
  onReset,
  resetLabel = 'Restablecer Filtros',
  showReset = true,
  className = 'w-full pb-2',
  extraActions,
}) => {
  const [openDropdown, setOpenDropdown] = useState<string | null>(null);
  const [searchTerms, setSearchTerms] = useState<Record<string, string>>({});
  const searchInputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Autoenfocar input de búsqueda al abrir dropdown que lo requiere
  useEffect(() => {
    if (openDropdown && searchInputRef.current) {
      setTimeout(() => {
        searchInputRef.current?.focus();
      }, 50);
    }
  }, [openDropdown]);

  // Búsqueda inteligente multi-palabra, insensible a tildes, mayúsculas y signos
  const normalizeText = (text: string) =>
    text
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-zA-Z0-9\s]/g, ' ')
      .toLowerCase()
      .trim();

  // Cerrar al hacer clic fuera o presionar Escape
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setOpenDropdown(null);
        setSearchTerms({});
      }
    };

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setOpenDropdown(null);
        setSearchTerms({});
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
    <div className={`relative z-[200] ${className}`}>
      <div
        ref={containerRef}
        className="w-full md:flex md:items-center bg-white border border-slate-200/90 rounded-2xl shadow-xs divide-y md:divide-y-0 md:divide-x divide-slate-200"
      >
        {/* 1. Header en Desktop: Icono de Embudo + Título unificados */}
        <div
          className="hidden md:flex items-center gap-2 px-3.5 xl:px-4 py-2.5 text-slate-700 bg-white rounded-l-2xl select-none shrink-0"
          title={title}
        >
          <RiFilter3Line className="w-4 h-4 text-slate-600 shrink-0" aria-hidden="true" />
          <span className="text-xs xl:text-sm font-bold text-slate-800 whitespace-nowrap">
            {title}
          </span>
        </div>

        {/* Header en Mobile: Icono de Embudo + Título unificados */}
        <div className="flex md:hidden items-center gap-2.5 px-4 py-3 bg-slate-50/80 rounded-t-2xl select-none">
          <RiFilter3Line className="w-5 h-5 text-slate-700 shrink-0" aria-hidden="true" />
          <span className="text-sm font-bold text-slate-800">{title}</span>
        </div>

        {/* 2. Dropdowns de Filtro */}
        {filters.map((filter, index) => {
          const isOpen = openDropdown === filter.id;
          const isLastItem = index === filters.length - 1 && !extraActions && !hasResetButton;
          const selectedOption = filter.options.find(
            (opt) => String(opt.value) === String(filter.value)
          );
          const displayLabel = selectedOption?.label || filter.placeholder || String(filter.value);

          // Si no hay extraActions ni reset, el último dropdown debe redondear la esquina exterior
          const lastItemRoundClasses = isLastItem
            ? 'rounded-b-2xl md:rounded-b-none md:rounded-r-2xl'
            : '';

          return (
            <div key={filter.id} className="relative w-full md:flex-1 md:min-w-0">
              <button
                type="button"
                disabled={filter.disabled}
                onClick={() => {
                  if (filter.disabled) return;
                  setOpenDropdown((prev) => (prev === filter.id ? null : filter.id));
                }}
                aria-haspopup="listbox"
                aria-expanded={isOpen}
                aria-disabled={filter.disabled}
                className={`w-full flex items-center justify-between gap-1.5 xl:gap-2 px-3 xl:px-4 py-2.5 min-h-[44px] md:min-h-0 text-xs xl:text-sm font-semibold transition-colors select-none focus:outline-none focus-visible:ring-2 focus-visible:ring-colorSegundo/50 ${
                  filter.minWidth || 'min-w-0'
                } ${lastItemRoundClasses} ${
                  filter.disabled
                    ? 'cursor-default bg-slate-100/70 text-slate-700'
                    : isOpen
                    ? 'bg-slate-50 text-colorSegundo cursor-pointer'
                    : 'text-slate-800 hover:bg-slate-50/80 cursor-pointer'
                }`}
                title={filter.disabled ? `${displayLabel} (Asignado a la evaluación)` : displayLabel}
                aria-label={`${filter.label}: ${displayLabel}`}
              >
                <div className="flex items-center gap-1.5 min-w-0 truncate">
                  {filter.icon && (
                    <span className="shrink-0">{filter.icon}</span>
                  )}
                  {selectedOption?.icon && !filter.icon && (
                    <span className="shrink-0">{selectedOption.icon}</span>
                  )}
                  {filter.label && (
                    <span className="text-slate-400 font-medium text-xs hidden 2xl:inline shrink-0">
                      {filter.label}:
                    </span>
                  )}
                  <span className="truncate min-w-0">{displayLabel}</span>
                </div>
                {filter.disabled ? (
                  <RiLock2Line className="w-3.5 h-3.5 text-slate-400 shrink-0 ml-1" />
                ) : (
                  <RiArrowDownSLine
                    className={`w-4 h-4 shrink-0 transition-transform duration-200 ${
                      isOpen
                        ? 'rotate-180 text-colorSegundo'
                        : 'text-slate-500'
                    }`}
                  />
                )}
              </button>

              {isOpen && !filter.disabled && (() => {
                const term = searchTerms[filter.id]?.trim() || '';
                const normSearch = normalizeText(term);
                const searchWords = normSearch.split(/\s+/).filter(Boolean);

                const displayedOptions =
                  filter.showSearch && searchWords.length > 0
                    ? filter.options.filter((opt) => {
                        const normLabel = normalizeText(opt.label);
                        const normBadge = opt.badge ? normalizeText(opt.badge) : '';
                        const combined = `${normLabel} ${normBadge}`;
                        return searchWords.every((w) => combined.includes(w));
                      })
                    : filter.options;

                const isRightAligned = index >= Math.floor(filters.length / 2);

                return (
                  <div
                    className={`absolute left-2 right-2 ${
                      isRightAligned ? 'md:left-auto md:right-0' : 'md:left-0 md:right-auto'
                    } top-full mt-1.5 md:mt-2 z-[250] min-w-[calc(100%-16px)] md:min-w-[220px] md:max-w-md bg-white rounded-2xl shadow-xl shadow-slate-900/10 border border-slate-100 p-1.5 focus:outline-none animate-dropdown`}
                  >
                    {filter.showSearch && (
                      <div className="p-1.5 border-b border-slate-100 mb-1">
                        <div className="relative flex items-center">
                          <RiSearchLine className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 pointer-events-none" />
                          <input
                            ref={searchInputRef}
                            type="text"
                            placeholder={`Buscar ${filter.label.toLowerCase()}...`}
                            value={searchTerms[filter.id] || ''}
                            onChange={(e) =>
                              setSearchTerms((prev) => ({
                                ...prev,
                                [filter.id]: e.target.value,
                              }))
                            }
                            className="w-full pl-8 pr-2.5 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-colorSegundo/30 focus:border-colorSegundo text-slate-800 placeholder-slate-400"
                            onClick={(e) => e.stopPropagation()}
                            onKeyDown={(e) => e.stopPropagation()}
                          />
                        </div>
                      </div>
                    )}
                    <div className="max-h-60 overflow-y-auto space-y-0.5">
                      {displayedOptions.length === 0 ? (
                        <div className="py-4 px-3 text-center text-xs text-slate-400">
                          No se encontraron resultados
                        </div>
                      ) : (
                        displayedOptions.map((option) => {
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
                                setSearchTerms((prev) => ({ ...prev, [filter.id]: '' }));
                              }}
                              className={`w-full flex items-center justify-between px-3.5 py-2.5 md:py-2 rounded-xl text-sm font-medium transition-colors cursor-pointer select-none ${
                                isSelected
                                  ? 'bg-colorSegundo/10 text-colorSegundo font-bold'
                                  : 'text-slate-700 hover:bg-slate-50 hover:text-slate-900'
                              }`}
                            >
                              <div className="flex items-center gap-2 truncate text-left">
                                {option.icon && (
                                  <span className="shrink-0">{option.icon}</span>
                                )}
                                <span className="truncate">{option.label}</span>
                                {option.badge && (
                                  <span
                                    className={`px-1.5 py-0.5 text-[10px] font-semibold rounded shrink-0 ${
                                      option.badgeType === 'success'
                                        ? 'bg-emerald-100 text-emerald-700'
                                        : option.badgeType === 'warning'
                                        ? 'bg-amber-100 text-amber-700'
                                        : 'bg-slate-100 text-slate-600'
                                    }`}
                                  >
                                    {option.badge}
                                  </span>
                                )}
                              </div>
                              {isSelected && (
                                <RiCheckLine className="w-4 h-4 text-colorSegundo shrink-0 ml-2" />
                              )}
                            </button>
                          );
                        })
                      )}
                    </div>
                  </div>
                );
              })()}
            </div>
          );
        })}

        {/* 3.5 Acciones Adicionales (ej. Configuración de Columnas con cierre mutuo sincronizado) */}
        {extraActions && (
          <div
            className={`relative w-full md:w-auto ${
              !hasResetButton ? 'rounded-b-2xl md:rounded-b-none md:rounded-r-2xl' : ''
            }`}
          >
            {typeof extraActions === 'function'
              ? extraActions({ openDropdown, setOpenDropdown })
              : extraActions}
          </div>
        )}

        {/* 4. Botón Restablecer Filtros (icono compacto en desktop, expandido en mobile) */}
        {hasResetButton && (
          <button
            type="button"
            onClick={() => {
              onReset!();
              setOpenDropdown(null);
            }}
            className="w-full md:w-auto flex items-center justify-center px-3.5 xl:px-4 py-2.5 min-h-[44px] md:min-h-0 text-xs xl:text-sm font-bold text-rose-500 hover:text-rose-600 hover:bg-rose-50/70 transition-colors whitespace-nowrap cursor-pointer select-none rounded-b-2xl md:rounded-b-none md:rounded-r-2xl focus:outline-none focus-visible:ring-2 focus-visible:ring-rose-400 shrink-0"
            title={resetLabel}
            aria-label={resetLabel}
          >
            <RiRestartLine className="w-4 h-4 text-rose-500 shrink-0 transition-transform duration-300 hover:-rotate-90" />
            <span className="md:hidden ml-2">
              {resetLabel}
            </span>
          </button>
        )}
      </div>
    </div>
  );
};

export default SegmentedFilterBar;
