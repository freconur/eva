import React, { useState, useRef, useEffect, useMemo } from 'react';
import {
  RiPaletteLine,
  RiAwardLine,
  RiEqualizerLine,
  RiArrowDownSLine,
  RiGridFill,
} from 'react-icons/ri';
import SegmentedFilterBar, { FilterItem } from '@/components/common/SegmentedFilterBar';

export interface DesempenoFiltrosState {
  region?: string;
  institucion?: string;
  genero?: string;
  idFase?: string;
  [key: string]: any;
}

export interface DesempenoFiltrosBarProps {
  filtros: DesempenoFiltrosState;
  onChangeFiltros: (newFiltros: DesempenoFiltrosState) => void;
  onResetFiltros: () => void;

  // Filtro de Región / UGEL
  showRegionFilter?: boolean;
  regiones?: Array<{ id: string | number; region?: string; name?: string }>;
  regionLabel?: string;
  regionPlaceholder?: string;

  // Filtro de Institución Educativa
  showInstitucionFilter?: boolean;
  instituciones?: Array<{ id: string | number; name: string }>;
  institucionLabel?: string;
  institucionPlaceholder?: string;

  // Filtro de Género
  showGeneroFilter?: boolean;
  generos?: Array<{ id: string | number; name: string }>;

  // Filtro de Fase de Evaluación
  showFasesFilter?: boolean;
  fases?: Array<{ id: string; nombre: string }>;
  faseLabel?: string;
  fasePlaceholder?: string;

  // Filtros adicionales personalizados
  extraFilters?: FilterItem<any>[];

  // Modo de color (Dominio vs Nivel)
  colorMode?: 'dominio' | 'nivel';
  onChangeColorMode?: (mode: 'dominio' | 'nivel') => void;
  showColorModeToggle?: boolean;

  // Acciones de Ajustes y Personalización
  showSettingsMenu?: boolean;
  onOpenOrganizerModal?: () => void;
  onOpenGlobalLevelsModal?: () => void;
  onOpenDomainLevelsModal?: () => void;
  onOpenColorModal?: () => void;
  hasDomainLevels?: boolean;
  hiddenSectionsCount?: number;

  className?: string;
}

export const DesempenoFiltrosBar: React.FC<DesempenoFiltrosBarProps> = ({
  filtros,
  onChangeFiltros,
  onResetFiltros,
  showRegionFilter = true,
  regiones = [],
  regionLabel = 'UGEL',
  regionPlaceholder = 'Todas las UGELs',
  showInstitucionFilter = false,
  instituciones = [],
  institucionLabel = 'Institución Educativa',
  institucionPlaceholder = 'Todas las I.E.',
  showGeneroFilter = true,
  generos = [],
  showFasesFilter = true,
  fases = [],
  faseLabel = 'Fase de Evaluación',
  fasePlaceholder = 'Todas las fases',
  extraFilters,
  colorMode = 'nivel',
  onChangeColorMode,
  showColorModeToggle = true,
  showSettingsMenu = true,
  onOpenOrganizerModal,
  onOpenGlobalLevelsModal,
  onOpenDomainLevelsModal,
  onOpenColorModal,
  hasDomainLevels = true,
  hiddenSectionsCount = 0,
  className,
}) => {
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const settingsRef = useRef<HTMLDivElement>(null);

  // Cerrar dropdown de ajustes al hacer clic afuera
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (settingsRef.current && !settingsRef.current.contains(e.target as Node)) {
        setIsSettingsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Determinar si hay filtros activos para mostrar el botón de reset
  const hasActiveFilters = Boolean(
    (filtros.region !== '' && filtros.region !== undefined && filtros.region !== null) ||
    (filtros.institucion !== '' && filtros.institucion !== undefined && filtros.institucion !== null) ||
    (filtros.genero !== '' && filtros.genero !== undefined && filtros.genero !== null) ||
    (filtros.idFase !== '' && filtros.idFase !== undefined && filtros.idFase !== null)
  );

  // Construir los ítems segmentados de filtro
  const filterItems = useMemo<FilterItem<any>[]>(() => {
    const list: FilterItem<any>[] = [];

    // 1. Filtro Región / UGEL
    if (showRegionFilter && regiones && regiones.length > 0) {
      list.push({
        id: 'region',
        label: regionLabel,
        value: filtros.region || '',
        onChange: (val) => onChangeFiltros({ ...filtros, region: String(val) }),
        placeholder: regionPlaceholder,
        options: [
          { value: '', label: regionPlaceholder },
          ...regiones.map((reg) => ({
            value: reg.id.toString(),
            label: reg.region || reg.name || String(reg.id),
          })),
        ],
        showSearch: regiones.length > 6,
        minWidth: 'md:min-w-[190px]',
      });
    }

    // 2. Filtro Institución Educativa (I.E.)
    if (showInstitucionFilter && instituciones && instituciones.length > 0) {
      list.push({
        id: 'institucion',
        label: institucionLabel,
        value: filtros.institucion || '',
        onChange: (val) => onChangeFiltros({ ...filtros, institucion: String(val) }),
        placeholder: institucionPlaceholder,
        options: [
          { value: '', label: institucionPlaceholder },
          ...instituciones.map((inst) => ({
            value: inst.id.toString(),
            label: inst.name,
          })),
        ],
        showSearch: instituciones.length > 5,
        minWidth: 'md:min-w-[210px]',
      });
    }

    // 3. Filtro Género
    if (showGeneroFilter && generos && generos.length > 0) {
      list.push({
        id: 'genero',
        label: 'Género',
        value: filtros.genero || '',
        onChange: (val) => onChangeFiltros({ ...filtros, genero: String(val) }),
        placeholder: 'Todos los géneros',
        options: [
          { value: '', label: 'Todos los géneros' },
          ...generos.map((gen) => ({
            value: gen.id.toString(),
            label: gen.name,
          })),
        ],
        minWidth: 'md:min-w-[160px]',
      });
    }

    // 4. Filtro Fase
    if (showFasesFilter && fases && fases.length > 0) {
      list.push({
        id: 'idFase',
        label: faseLabel,
        value: filtros.idFase || '',
        onChange: (val) => onChangeFiltros({ ...filtros, idFase: String(val) }),
        placeholder: fasePlaceholder,
        options: [
          { value: '', label: fasePlaceholder },
          ...fases.map((f) => ({
            value: f.id,
            label: f.nombre,
          })),
        ],
        minWidth: 'md:min-w-[180px]',
      });
    }

    // 5. Filtros adicionales configurables
    if (extraFilters && extraFilters.length > 0) {
      list.push(...extraFilters);
    }

    return list;
  }, [
    showRegionFilter,
    regiones,
    regionLabel,
    regionPlaceholder,
    showInstitucionFilter,
    instituciones,
    institucionLabel,
    institucionPlaceholder,
    filtros,
    onChangeFiltros,
    showGeneroFilter,
    generos,
    showFasesFilter,
    fases,
    faseLabel,
    fasePlaceholder,
    extraFilters,
  ]);

  return (
    <div
      className={`flex flex-col xl:flex-row items-stretch xl:items-center justify-between gap-3 w-full mb-6 relative ${isSettingsOpen ? 'z-[400]' : 'z-[310]'} ${className || ''}`}
      data-testid="desempeno-filtros-bar"
    >
      {/* 1. Barra de Filtros Segmentada */}
      <div className="flex-1 min-w-0">
        <SegmentedFilterBar
          title="Filtrar por"
          filters={filterItems}
          onReset={hasActiveFilters ? onResetFiltros : undefined}
          showReset={hasActiveFilters}
          resetLabel="Restablecer Filtros"
          className="w-full pb-0"
        />
      </div>

      {/* 2. Barra de Herramientas Lateral: Color Mode + Personalizar/Ajustes */}
      {(showColorModeToggle || showSettingsMenu) && (
        <div className="flex flex-wrap items-center gap-2.5 shrink-0 self-end xl:self-center">
          {/* Selector de Modo de Color (Solo iconos, expande texto al hacer hover) */}
          {showColorModeToggle && onChangeColorMode && (
            <div
              className="inline-flex items-center bg-slate-100/90 p-1 rounded-2xl border border-slate-200/80 shadow-2xs gap-1"
              role="group"
              aria-label="Modo de coloreado de gráficos"
            >
              <button
                type="button"
                className={`group inline-flex items-center h-8 sm:h-8.5 px-2.5 rounded-xl text-xs font-semibold transition-all duration-200 cursor-pointer overflow-hidden ${
                  colorMode === 'dominio'
                    ? 'bg-white text-blue-600 font-bold shadow-2xs'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-white/60'
                }`}
                onClick={() => onChangeColorMode('dominio')}
                title="Color de Dominio: Colorear según el color temático configurado para cada dominio"
                aria-label="Color de Dominio"
                aria-pressed={colorMode === 'dominio'}
              >
                <RiPaletteLine className={`text-base shrink-0 ${colorMode === 'dominio' ? 'text-blue-600' : 'text-slate-500 group-hover:text-blue-600'}`} />
                <span className="max-w-0 opacity-0 overflow-hidden whitespace-nowrap transition-all duration-300 ease-in-out group-hover:max-w-xs group-hover:opacity-100 group-hover:ml-1.5">
                  Color de Dominio
                </span>
              </button>
              <button
                type="button"
                className={`group inline-flex items-center h-8 sm:h-8.5 px-2.5 rounded-xl text-xs font-semibold transition-all duration-200 cursor-pointer overflow-hidden ${
                  colorMode === 'nivel'
                    ? 'bg-white text-blue-600 font-bold shadow-2xs'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-white/60'
                }`}
                onClick={() => onChangeColorMode('nivel')}
                title="Nivel de Logro: Colorear según el nivel de logro alcanzado en la evaluación"
                aria-label="Nivel de Logro"
                aria-pressed={colorMode === 'nivel'}
              >
                <RiAwardLine className={`text-base shrink-0 ${colorMode === 'nivel' ? 'text-blue-600' : 'text-slate-500 group-hover:text-blue-600'}`} />
                <span className="max-w-0 opacity-0 overflow-hidden whitespace-nowrap transition-all duration-300 ease-in-out group-hover:max-w-xs group-hover:opacity-100 group-hover:ml-1.5">
                  Nivel de Logro
                </span>
              </button>
            </div>
          )}

          {/* Menú Dropdown Ajustes */}
          {showSettingsMenu && (
            <div className="relative" ref={settingsRef}>
              <button
                type="button"
                onClick={() => setIsSettingsOpen(!isSettingsOpen)}
                className={`inline-flex items-center gap-2 px-3.5 py-2.5 bg-white border rounded-2xl font-bold text-xs xl:text-sm shadow-2xs transition-all cursor-pointer select-none ${
                  isSettingsOpen
                    ? 'border-blue-500 text-blue-600 bg-blue-50/40 ring-2 ring-blue-100'
                    : 'border-slate-200/90 text-slate-700 hover:border-blue-400 hover:text-blue-600 hover:bg-slate-50/50'
                }`}
                title="Opciones de personalización y configuración del reporte"
                aria-expanded={isSettingsOpen}
              >
                <RiEqualizerLine className="text-base text-blue-600" />
                <span>Ajustes</span>
                {hiddenSectionsCount > 0 && (
                  <span className="px-1.5 py-0.5 bg-rose-500 text-white text-[10px] font-bold rounded-full leading-none">
                    {hiddenSectionsCount}
                  </span>
                )}
                <RiArrowDownSLine
                  className={`text-base text-slate-400 transition-transform duration-200 ${
                    isSettingsOpen ? 'rotate-180 text-blue-600' : ''
                  }`}
                />
              </button>

              {isSettingsOpen && (
                <div className="absolute right-0 top-full mt-2 w-64 bg-white border border-slate-200 rounded-2xl shadow-xl z-[450] py-1.5 animate-fadeIn">
                  {onOpenOrganizerModal && (
                    <button
                      type="button"
                      onClick={() => {
                        setIsSettingsOpen(false);
                        onOpenOrganizerModal();
                      }}
                      className="w-full flex items-center justify-between px-3.5 py-2.5 text-xs xl:text-sm font-semibold text-slate-700 hover:bg-slate-50 hover:text-blue-600 transition-colors cursor-pointer text-left"
                    >
                      <div className="flex items-center gap-2.5">
                        <RiGridFill className="text-base text-sky-600" />
                        <span>Personalizar Gráficos</span>
                      </div>
                      {hiddenSectionsCount > 0 && (
                        <span className="px-1.5 py-0.5 bg-rose-500 text-white text-[10px] font-bold rounded-full leading-none">
                          {hiddenSectionsCount} oculto{hiddenSectionsCount > 1 ? 's' : ''}
                        </span>
                      )}
                    </button>
                  )}

                  {onOpenGlobalLevelsModal && (
                    <button
                      type="button"
                      onClick={() => {
                        setIsSettingsOpen(false);
                        onOpenGlobalLevelsModal();
                      }}
                      className="w-full flex items-center gap-2.5 px-3.5 py-2.5 text-xs xl:text-sm font-semibold text-slate-700 hover:bg-slate-50 hover:text-emerald-600 transition-colors cursor-pointer text-left"
                    >
                      <RiAwardLine className="text-base text-emerald-600" />
                      <span>Niveles Globales</span>
                    </button>
                  )}

                  {hasDomainLevels && onOpenDomainLevelsModal && (
                    <button
                      type="button"
                      onClick={() => {
                        setIsSettingsOpen(false);
                        onOpenDomainLevelsModal();
                      }}
                      className="w-full flex items-center gap-2.5 px-3.5 py-2.5 text-xs xl:text-sm font-semibold text-slate-700 hover:bg-slate-50 hover:text-purple-600 transition-colors cursor-pointer text-left"
                    >
                      <RiAwardLine className="text-base text-purple-600" />
                      <span>Niveles por Dominio</span>
                    </button>
                  )}

                  {onOpenColorModal && (
                    <>
                      <div className="h-px bg-slate-100 my-1" />
                      <button
                        type="button"
                        onClick={() => {
                          setIsSettingsOpen(false);
                          onOpenColorModal();
                        }}
                        className="w-full flex items-center gap-2.5 px-3.5 py-2.5 text-xs xl:text-sm font-semibold text-slate-700 hover:bg-slate-50 hover:text-indigo-600 transition-colors cursor-pointer text-left"
                      >
                        <RiPaletteLine className="text-base text-indigo-600" />
                        <span>Colores de Dominios</span>
                      </button>
                    </>
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default DesempenoFiltrosBar;
