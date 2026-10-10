import React, { useMemo, useState, useRef, useEffect } from 'react';
import {
  MdMenuBook,
  MdCalculate,
  MdPublic,
  MdScience,
  MdGroups,
  MdCheck,
  MdAssignmentLate,
  MdEdit,
  MdClose,
} from 'react-icons/md';
import { RiLoader4Line } from 'react-icons/ri';
import { Evaluaciones } from '@/features/types/types';
import { useGlobalContext } from '@/features/context/GlolbalContext';
import { getCategoriasParaGrado } from '@/fuctions/categorias';
import { getGradoTexto } from '@/fuctions/regiones';
import { useDirectorTabsConfig } from './useDirectorTabsConfig';
import tabsStyles from './DirectorTabsNav.module.css';

export interface DirectorCategoriaTabsProps {
  grado?: number | string;
  selectedCategoriaId: number;
  onSelectCategoria: (catId: number) => void;
  matrizConfigGrados: Record<string, any>;
  evaluacionesDb?: Evaluaciones[];
  disabled?: boolean;
  isAuditing?: boolean;
  onlyCategoriaId?: number;
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
    return <MdMenuBook className="w-4 h-4 shrink-0" />;
  }
  if (catId === 2 || clean.includes('PROBLEMA') || clean.includes('MATEM')) {
    return <MdCalculate className="w-4 h-4 shrink-0" />;
  }
  if (catId === 8 || clean.includes('PERSONAL') || clean.includes('SOCIAL')) {
    return <MdPublic className="w-4 h-4 shrink-0" />;
  }
  if (catId === 9 || catId === 5 || clean.includes('CIENCIA')) {
    return <MdScience className="w-4 h-4 shrink-0" />;
  }
  if (catId === 6 || clean.includes('DPCC')) {
    return <MdGroups className="w-4 h-4 shrink-0" />;
  }
  return <MdMenuBook className="w-4 h-4 shrink-0" />;
};

export const DirectorCategoriaTabs: React.FC<DirectorCategoriaTabsProps> = ({
  grado = 2,
  selectedCategoriaId,
  onSelectCategoria,
  matrizConfigGrados,
  evaluacionesDb = [],
  disabled = false,
  isAuditing: propIsAuditing,
  onlyCategoriaId,
}) => {
  const { categorias: contextCategorias } = useGlobalContext();
  const currentGrado = Number(grado) || 2;

  const {
    categoriaLabels,
    saveCategoriaLabel,
    isSaving: hookIsSaving,
    isAuditing: hookIsAuditing,
  } = useDirectorTabsConfig();

  // Permiso para editar nombres: en modo auditoría o con rol administrador
  const canEdit = propIsAuditing !== undefined ? propIsAuditing : hookIsAuditing;

  // Estados locales para edición interactiva inline de nombres de categoría
  const [editingCatId, setEditingCatId] = useState<number | null>(null);
  const [editingText, setEditingText] = useState<string>('');
  const [isLocalSaving, setIsLocalSaving] = useState<boolean>(false);
  const editInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (editingCatId !== null && editInputRef.current) {
      editInputRef.current.focus();
      editInputRef.current.select();
    }
  }, [editingCatId]);

  const handleStartEdit = (e: React.MouseEvent, catId: number, currentLabel: string) => {
    e.stopPropagation();
    e.preventDefault();
    setEditingCatId(catId);
    setEditingText(currentLabel);
  };

  const handleCancelEdit = (e?: React.MouseEvent | React.KeyboardEvent) => {
    if (e) {
      e.stopPropagation();
      e.preventDefault();
    }
    setEditingCatId(null);
    setEditingText('');
  };

  const handleSaveEdit = async (e: React.MouseEvent | React.KeyboardEvent, catId: number) => {
    e.stopPropagation();
    e.preventDefault();
    if (!editingText.trim() || isLocalSaving) return;

    setIsLocalSaving(true);
    const success = await saveCategoriaLabel(catId, editingText);
    setIsLocalSaving(false);

    if (success) {
      setEditingCatId(null);
      setEditingText('');
    }
  };

  // 1. Todas las categorías curriculares teóricas para este grado y nivel
  const todasLasCategorias = useMemo(() => {
    return getCategoriasParaGrado(currentGrado, contextCategorias, evaluacionesDb);
  }, [currentGrado, contextCategorias, evaluacionesDb]);

  // 2. Filtrar para mostrar ÚNICAMENTE las materias que sí tienen evaluaciones configuradas
  const categoriasConfiguradas = useMemo(() => {
    const list = todasLasCategorias.filter((cat) => {
      const catId = Number(cat.id);
      const assignment = matrizConfigGrados[`${currentGrado}_${catId}`];
      return !!(
        assignment &&
        (assignment.ediId || assignment.ep1Id || assignment.ep2Id)
      );
    });

    // Si se especifica mostrar únicamente el área de la evaluación activa (ej. solo RADALECTOR o solo RADAMATE)
    if (onlyCategoriaId !== undefined && onlyCategoriaId !== null) {
      const filtered = list.filter((cat) => Number(cat.id) === Number(onlyCategoriaId));
      if (filtered.length > 0) {
        return filtered;
      }
      const matching = todasLasCategorias.filter((cat) => Number(cat.id) === Number(onlyCategoriaId));
      if (matching.length > 0) {
        return matching;
      }
    }

    // Fallback de resiliencia: si aún no hay configuraciones registradas, mostrar al menos la categoría activa
    if (list.length === 0) {
      const activeCat =
        todasLasCategorias.find((c) => Number(c.id) === selectedCategoriaId) ||
        todasLasCategorias[0];
      return activeCat ? [activeCat] : todasLasCategorias;
    }

    return list;
  }, [todasLasCategorias, matrizConfigGrados, currentGrado, selectedCategoriaId, onlyCategoriaId]);

  return (
    <div
      className={tabsStyles.categoriaTabsBar}
      role="tablist"
      aria-label="Pestañas de materias curriculares configuradas"
    >
      {categoriasConfiguradas.map((cat) => {
        const catId = Number(cat.id);
        const isSelected = Number(selectedCategoriaId) === catId;
        const customLabel = categoriaLabels[String(catId)];
        const label = customLabel ? customLabel.toUpperCase() : formatCategoriaLabel(cat.categoria);
        const icon = getCategoriaIcon(catId, label);
        const isEditingThisCat = editingCatId === catId;

        return (
          <button
            key={catId}
            type="button"
            role="tab"
            aria-selected={isSelected}
            disabled={disabled}
            onClick={() => {
              if (!isEditingThisCat) {
                onSelectCategoria(catId);
              }
            }}
            className={`${tabsStyles.categoriaTabBtn} ${
              isSelected ? tabsStyles.categoriaTabBtnActive : ''
            } ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
            title={`Área: ${label} (Configurado)`}
          >
            <span className={tabsStyles.categoriaTabIcon}>
              {icon}
            </span>

            {isEditingThisCat ? (
              <div
                className="inline-flex items-center gap-1.5 z-40"
                onClick={(e) => e.stopPropagation()}
              >
                <input
                  ref={editInputRef}
                  type="text"
                  value={editingText}
                  disabled={isLocalSaving}
                  onChange={(e) => setEditingText(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      handleSaveEdit(e, catId);
                    } else if (e.key === 'Escape') {
                      handleCancelEdit(e);
                    }
                  }}
                  className="px-2 py-0.5 text-xs font-bold uppercase text-slate-900 bg-white border border-emerald-500 rounded-md shadow-xs outline-none focus:ring-2 focus:ring-emerald-500 min-w-[100px] max-w-[190px]"
                  placeholder="Nombre de área..."
                />
                <button
                  type="button"
                  disabled={isLocalSaving || !editingText.trim()}
                  onClick={(e) => handleSaveEdit(e, catId)}
                  className="inline-flex items-center justify-center w-6 h-6 rounded-md bg-emerald-600 hover:bg-emerald-700 text-white transition-colors cursor-pointer shadow-2xs disabled:opacity-50"
                  title="Guardar nombre de área (Enter)"
                  aria-label="Guardar nombre de área"
                >
                  {isLocalSaving ? (
                    <RiLoader4Line className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <MdCheck className="w-3.5 h-3.5" />
                  )}
                </button>
                <button
                  type="button"
                  disabled={isLocalSaving}
                  onClick={(e) => handleCancelEdit(e)}
                  className="inline-flex items-center justify-center w-6 h-6 rounded-md bg-slate-200 hover:bg-slate-300 text-slate-700 transition-colors cursor-pointer"
                  title="Cancelar edición (Escape)"
                  aria-label="Cancelar edición"
                >
                  <MdClose className="w-3.5 h-3.5" />
                </button>
              </div>
            ) : (
              <span className="inline-flex items-center gap-1">
                <span className="tracking-tight">{label}</span>
                {canEdit && (
                  <span
                    role="button"
                    tabIndex={0}
                    onClick={(e) => handleStartEdit(e, catId, label)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' || e.key === ' ') {
                        handleStartEdit(e as any, catId, label);
                      }
                    }}
                    className="inline-flex items-center justify-center w-5 h-5 ml-0.5 rounded-md text-slate-400 hover:text-emerald-600 hover:bg-emerald-50/80 transition-all cursor-pointer opacity-70 hover:opacity-100"
                    title={`Editar nombre de área "${label}"`}
                    aria-label={`Editar nombre de área "${label}"`}
                  >
                    <MdEdit className="w-3.5 h-3.5" />
                  </span>
                )}
              </span>
            )}

            {!isEditingThisCat && (
              <span className="inline-flex items-center gap-1 px-1.5 py-0.5 text-[11px] font-bold rounded-md bg-emerald-50 text-emerald-700 border border-emerald-200/90 shrink-0">
                ✓ Configurado
              </span>
            )}

            {!isEditingThisCat && isSelected && (
              <MdCheck className="w-4 h-4 text-emerald-600 shrink-0 animate-in zoom-in-75 duration-150" />
            )}
          </button>
        );
      })}
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
