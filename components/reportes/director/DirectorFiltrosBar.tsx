import React, { useMemo } from 'react';
import { RiSettings4Line, RiArrowDownSLine } from 'react-icons/ri';
import { gradosDeColegio, genero } from '@/fuctions/regiones';
import { Evaluaciones } from '@/features/types/types';
import SegmentedFilterBar, {
  FilterItem,
  ExtraActionsRenderProps,
} from '@/components/common/SegmentedFilterBar';

export interface ColumnasVisiblesState {
  showRC: boolean;
  showTP: boolean;
  showPuntaje: boolean;
  showNivel: boolean;
  showDniDocente: boolean;
}

export interface FiltrosState {
  grado: string;
  seccion: string;
  orden: string;
  genero: string;
  nivel: string;
}

interface DirectorFiltrosBarProps {
  filtros: FiltrosState;
  onFilterChange: (e: React.ChangeEvent<HTMLSelectElement>) => void;
  onSingleFilterChange?: (name: keyof FiltrosState, value: string) => void;
  evaluacion: Evaluaciones;
  availableSections: Array<{ id: number | string; name: string }>;
  isDirectorRol: boolean;
  columnasVisibles: ColumnasVisiblesState;
  onToggleColumna: (col: keyof ColumnasVisiblesState) => void;
  onLimpiarFiltros: () => void;
}

export const DirectorFiltrosBar: React.FC<DirectorFiltrosBarProps> = ({
  filtros,
  onFilterChange,
  onSingleFilterChange,
  evaluacion,
  availableSections,
  isDirectorRol,
  columnasVisibles,
  onToggleColumna,
  onLimpiarFiltros,
}) => {
  // Manejador unificado de cambio de filtro
  const handleFilterChange = (name: keyof FiltrosState, value: string) => {
    if (onSingleFilterChange) {
      onSingleFilterChange(name, value);
    } else if (onFilterChange) {
      onFilterChange({
        target: { name, value },
      } as unknown as React.ChangeEvent<HTMLSelectElement>);
    }
  };

  // Construcción de la lista de filtros segmentados con etiquetas limpias
  const filters: FilterItem<string>[] = useMemo(() => {
    // 1. Nivel
    const nivelOptions = [
      { value: '', label: 'Todos los niveles' },
      ...(evaluacion?.nivelYPuntaje || []).map((n) => ({
        value: n.nivel || '',
        label: n.nivel || '',
        badge:
          n.min !== undefined && n.max !== undefined
            ? `${n.min}-${n.max} pts`
            : undefined,
        icon: n.color ? (
          <span
            className="w-2.5 h-2.5 rounded-full inline-block shrink-0 shadow-2xs border border-white"
            style={{ backgroundColor: n.color }}
          />
        ) : undefined,
      })),
    ];

    // 2. Grado
    const gradoOptions = [
      { value: '', label: 'Todos los grados' },
      ...gradosDeColegio.map((g) => ({
        value: String(g.id),
        label: g.name,
      })),
    ];

    // 3. Sección
    const seccionOptions = [
      {
        value: '',
        label:
          availableSections && availableSections.length > 0
            ? `Todas las secciones (${availableSections.length})`
            : 'Todas las secciones',
      },
      ...(availableSections || []).map((s) => ({
        value: String(s.id),
        label: `Sección ${s.name.toUpperCase()}`,
      })),
    ];

    // 4. Género
    const generoOptions = [
      { value: '', label: 'Todos los géneros' },
      ...genero.map((gen) => ({
        value: String(gen.id),
        label: gen.name.charAt(0).toUpperCase() + gen.name.slice(1).toLowerCase(),
      })),
    ];

    // 5. Orden
    const ordenOptions = [
      { value: '', label: 'Ordenar por' },
      {
        value: 'asc',
        label: 'Menor puntaje',
        badge: 'Ascendente',
      },
      {
        value: 'desc',
        label: 'Mayor puntaje',
        badge: 'Descendente',
      },
    ];

    return [
      {
        id: 'nivel',
        label: 'Nivel',
        value: filtros.nivel,
        onChange: (val: string) => handleFilterChange('nivel', val),
        options: nivelOptions,
        minWidth: 'md:min-w-[150px]',
      },
      {
        id: 'grado',
        label: 'Grado',
        value: filtros.grado,
        disabled: isDirectorRol,
        onChange: (val: string) => handleFilterChange('grado', val),
        options: gradoOptions,
        minWidth: 'md:min-w-[130px]',
      },
      {
        id: 'seccion',
        label: 'Sección',
        value: filtros.seccion,
        onChange: (val: string) => handleFilterChange('seccion', val),
        options: seccionOptions,
        minWidth: 'md:min-w-[155px]',
      },
      {
        id: 'genero',
        label: 'Género',
        value: filtros.genero,
        onChange: (val: string) => handleFilterChange('genero', val),
        options: generoOptions,
        minWidth: 'md:min-w-[145px]',
      },
      {
        id: 'orden',
        label: 'Ordenar',
        value: filtros.orden,
        onChange: (val: string) => handleFilterChange('orden', val),
        options: ordenOptions,
        minWidth: 'md:min-w-[140px]',
      },
    ];
  }, [
    filtros.nivel,
    filtros.grado,
    filtros.seccion,
    filtros.genero,
    filtros.orden,
    evaluacion?.nivelYPuntaje,
    isDirectorRol,
    availableSections,
  ]);

  // Segmento integrado para configuración de Columnas (sincronizado con el estado global de dropdowns)
  const renderColumnasAction = ({
    openDropdown,
    setOpenDropdown,
  }: ExtraActionsRenderProps) => {
    const isConfigOpen = openDropdown === 'columnas';

    return (
      <div className="relative w-full md:w-auto">
        <button
          type="button"
          onClick={() => setOpenDropdown(isConfigOpen ? null : 'columnas')}
          aria-haspopup="dialog"
          aria-expanded={isConfigOpen}
          className={`w-full md:w-auto flex items-center justify-between gap-2.5 px-4 py-3 min-h-[44px] md:min-h-0 text-sm font-semibold transition-colors select-none cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-colorSegundo/50 md:min-w-[130px] ${
            isConfigOpen
              ? 'bg-slate-50 text-colorSegundo'
              : 'text-slate-800 hover:bg-slate-50/80'
          }`}
          title="Configurar visibilidad de columnas de la grilla"
        >
          <div className="flex items-center gap-1.5 truncate">
            <RiSettings4Line className="w-4 h-4 text-slate-500 shrink-0" />
            <span>Columnas</span>
          </div>
          <RiArrowDownSLine
            className={`w-4 h-4 shrink-0 transition-transform duration-200 ${
              isConfigOpen ? 'rotate-180 text-colorSegundo' : 'text-slate-500'
            }`}
          />
        </button>

        {isConfigOpen && (
          <div
            className="absolute left-2 right-2 md:left-auto md:right-0 top-full mt-1.5 md:mt-2 z-[250] min-w-[240px] bg-white rounded-2xl shadow-xl shadow-slate-900/10 border border-slate-100 p-3 focus:outline-none animate-dropdown"
            role="dialog"
            aria-label="Configurar visibilidad de columnas"
          >
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block mb-2 px-1">
              Visibilidad de Columnas
            </span>
            <div className="flex flex-col gap-1">
              {[
                { key: 'showRC', label: 'Respuestas Correctas (RC)' },
                { key: 'showTP', label: 'Total Preguntas (TP)' },
                { key: 'showPuntaje', label: 'Puntaje' },
                { key: 'showNivel', label: 'Nivel (Logro)' },
                { key: 'showDniDocente', label: 'DNI Docente' },
              ].map(({ key, label }) => {
                const isChecked = columnasVisibles[key as keyof ColumnasVisiblesState];
                return (
                  <label
                    key={key}
                    className="flex items-center gap-2.5 px-2.5 py-1.5 rounded-xl hover:bg-slate-50 cursor-pointer transition-colors text-xs font-semibold text-slate-700 select-none"
                  >
                    <input
                      type="checkbox"
                      checked={isChecked}
                      onChange={() => onToggleColumna(key as keyof ColumnasVisiblesState)}
                      className="w-4 h-4 rounded text-blue-600 border-slate-300 focus:ring-blue-500 cursor-pointer accent-blue-600"
                    />
                    <span>{label}</span>
                  </label>
                );
              })}
            </div>
          </div>
        )}
      </div>
    );
  };

  return (
    <SegmentedFilterBar
      title="Filtrar por"
      filters={filters}
      extraActions={renderColumnasAction}
      onReset={onLimpiarFiltros}
      resetLabel="Limpiar Filtros"
      showReset={true}
      className="mb-4"
    />
  );
};

export default DirectorFiltrosBar;
