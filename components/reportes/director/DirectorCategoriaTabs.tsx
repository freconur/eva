import React, { useMemo } from 'react';
import {
  MdMenuBook,
  MdCalculate,
  MdPublic,
  MdScience,
  MdGroups,
  MdCheck,
  MdAssignmentLate,
  MdLayers,
} from 'react-icons/md';
import { Evaluaciones } from '@/features/types/types';
import { useGlobalContext } from '@/features/context/GlolbalContext';
import { getCategoriasParaGrado, getNivelFromGrado } from '@/fuctions/categorias';
import { getGradoTexto } from '@/fuctions/regiones';
import tabsStyles from './DirectorTabsNav.module.css';

export interface DirectorCategoriaTabsProps {
  grado?: number | string;
  selectedCategoriaId: number;
  onSelectCategoria: (catId: number) => void;
  matrizConfigGrados: Record<string, any>;
  evaluacionesDb?: Evaluaciones[];
  disabled?: boolean;
}

/**
 * Limpia y normaliza el nombre de la categoría para presentación ejecutiva:
 * - Elimina sufijo '-Secundaria'
 * - Convierte a mayúsculas
 */
export const formatCategoriaLabel = (rawName?: string): string => {
  if (!rawName) return '';
  return rawName
    .replace(/-secundaria/i, '')
    .trim()
    .toUpperCase();
};

/**
 * Asigna un icono temático profesional según la categoría de área pedagógica
 */
const getCategoriaIcon = (catId: number, label: string) => {
  const clean = label.toUpperCase();
  if (catId === 1 || clean.includes('LEE') || clean.includes('COMUNICACI')) {
    return <MdMenuBook className={tabsStyles.categoriaTabIcon} />;
  }
  if (catId === 2 || clean.includes('PROBLEMA') || clean.includes('MATEM')) {
    return <MdCalculate className={tabsStyles.categoriaTabIcon} />;
  }
  if (catId === 8 || clean.includes('PERSONAL') || clean.includes('SOCIAL')) {
    return <MdPublic className={tabsStyles.categoriaTabIcon} />;
  }
  if (catId === 9 || catId === 5 || clean.includes('CIENCIA')) {
    return <MdScience className={tabsStyles.categoriaTabIcon} />;
  }
  if (catId === 6 || clean.includes('DPCC')) {
    return <MdGroups className={tabsStyles.categoriaTabIcon} />;
  }
  return <MdMenuBook className={tabsStyles.categoriaTabIcon} />;
};

export const DirectorCategoriaTabs: React.FC<DirectorCategoriaTabsProps> = ({
  grado = 2,
  selectedCategoriaId,
  onSelectCategoria,
  matrizConfigGrados,
  evaluacionesDb = [],
  disabled = false,
}) => {
  const { categorias: contextCategorias } = useGlobalContext();

  const currentGrado = Number(grado) || 2;
  const nivelEducativo = getNivelFromGrado(currentGrado);

  // Categorías curriculares correspondientes al grado y nivel (Primaria vs Secundaria vs Inicial)
  const categorias = useMemo(() => {
    return getCategoriasParaGrado(currentGrado, contextCategorias, evaluacionesDb);
  }, [currentGrado, contextCategorias, evaluacionesDb]);

  const nivelLabel = nivelEducativo === 2 ? 'Secundaria' : nivelEducativo === 0 ? 'Inicial' : 'Primaria';

  return (
    <div className="bg-slate-50/80 rounded-2xl border border-slate-200/80 p-3 sm:p-3.5 shadow-2xs mb-3">
      <div className="flex items-center justify-between gap-2 px-1 mb-2.5">
        <span className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-600 uppercase tracking-wider">
          <MdLayers className="w-3.5 h-3.5 text-blue-600" />
          <span>Áreas Curriculares · {getGradoTexto(currentGrado)} ({nivelLabel})</span>
        </span>
        <span className="text-[11px] text-slate-500 font-medium hidden sm:inline">
          Selecciona una materia para analizar sus brechas y decisiones
        </span>
      </div>

      <div
        className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none w-full"
        role="tablist"
        aria-label="Píldoras de áreas curriculares por nivel"
      >
        {categorias.map((cat) => {
          const catId = Number(cat.id);
          const isSelected = Number(selectedCategoriaId) === catId;
          const label = formatCategoriaLabel(cat.categoria);
          const icon = getCategoriaIcon(catId, label);

          // Verificar si el área tiene al menos una evaluación asignada en matriz_resultados
          const assignment = matrizConfigGrados[`${currentGrado}_${catId}`];
          const hasConfig = !!(
            assignment &&
            (assignment.ediId || assignment.ep1Id || assignment.ep2Id)
          );

          return (
            <button
              key={catId}
              type="button"
              role="tab"
              aria-selected={isSelected}
              disabled={disabled}
              className={`group relative inline-flex items-center gap-2.5 px-3.5 sm:px-4 h-[42px] rounded-xl text-xs sm:text-sm font-semibold transition-all duration-150 whitespace-nowrap cursor-pointer select-none outline-none border shadow-2xs ${
                isSelected
                  ? 'bg-blue-50/90 border-blue-500 text-blue-900 ring-2 ring-blue-100 font-bold'
                  : 'bg-white hover:bg-slate-50 border-slate-200/90 hover:border-slate-300 text-slate-700 hover:text-slate-900'
              } ${disabled ? 'opacity-50 cursor-not-allowed' : 'active:scale-[0.98]'}`}
              onClick={() => onSelectCategoria(catId)}
              title={`Área: ${label}${hasConfig ? ' (Configurado)' : ' (Sin evaluaciones)'}`}
            >
              <span
                className={`text-base transition-colors shrink-0 ${
                  isSelected ? 'text-blue-600' : 'text-slate-400 group-hover:text-slate-600'
                }`}
              >
                {icon}
              </span>
              <span className="tracking-tight">{label}</span>

              {hasConfig && (
                <span className="inline-flex items-center gap-1 px-1.5 py-0.5 text-[11px] font-bold rounded-md bg-emerald-50 text-emerald-700 border border-emerald-200/80 shrink-0">
                  ✓ Configurado
                </span>
              )}

              {isSelected && (
                <MdCheck className="w-4 h-4 text-blue-600 shrink-0 animate-in zoom-in-75 duration-150" />
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
};

/**
 * Estado vacío amigable cuando se selecciona un área que aún no cuenta con evaluaciones asignadas
 */
export const EmptyCategoriaState: React.FC<{
  categoriaName: string;
  grado: number | string;
  configuredCategories: { id: number; categoria: string }[];
  onSelectCategoria: (catId: number) => void;
}> = ({ categoriaName, grado, configuredCategories, onSelectCategoria }) => {
  const currentGrado = Number(grado) || 2;
  const gradoTexto = getGradoTexto(currentGrado);

  return (
    <div className={tabsStyles.emptyCategoryContainer} role="region" aria-live="polite">
      <div className={tabsStyles.emptyCategoryIconBox}>
        <MdAssignmentLate style={{ fontSize: '1.8rem' }} />
      </div>
      <h3 className={tabsStyles.emptyCategoryTitle}>
        Área curricular sin evaluaciones asignadas
      </h3>
      <p className={tabsStyles.emptyCategoryDesc}>
        El área <strong>{categoriaName}</strong> aún no cuenta con evaluaciones diagnósticas o progresivas
        (EDI, EP1 o EP2) configuradas para <strong>{gradoTexto}</strong> en la Matriz de Resultados regional.
      </p>

      {configuredCategories.length > 0 && (
        <button
          type="button"
          onClick={() => onSelectCategoria(configuredCategories[0].id)}
          className={tabsStyles.emptyCategoryActionBtn}
        >
          <MdMenuBook style={{ fontSize: '1rem' }} />
          <span>Ver {formatCategoriaLabel(configuredCategories[0].categoria)}</span>
        </button>
      )}
    </div>
  );
};

export default DirectorCategoriaTabs;
