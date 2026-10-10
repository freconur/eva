import React, { useState, useEffect, useRef, useMemo } from 'react';
import { 
  CustomSidebarItem, 
  CustomItemRole, 
  CustomTargetType, 
  PLATFORM_ROUTES_CATALOG, 
  CatalogRouteOption,
  AVAILABLE_ICONS, 
  PARENT_MENUS_BY_ROLE,
  ParentMenuOption,
  renderCustomSidebarIcon
} from '@/features/sidebar/customSidebarConfig';
import { 
  RiCloseLine, 
  RiExternalLinkLine, 
  RiCompass3Line, 
  RiLinksLine, 
  RiCheckLine,
  RiSearchLine,
  RiFolderAddLine,
  RiArrowRightLine,
  RiEditLine,
  RiFoldersLine
} from 'react-icons/ri';
import { MdBookmark, MdLayers } from 'react-icons/md';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  defaultRole?: CustomItemRole;
  existingCustomItems?: CustomSidebarItem[];
  itemToEdit?: CustomSidebarItem | null;
  onSave: (itemData: Omit<CustomSidebarItem, 'id' | 'createdAt'>, editId?: string) => Promise<void>;
}

export const ModalCrearMenuPersonalizado: React.FC<Props> = ({
  isOpen,
  onClose,
  defaultRole = 'especialista',
  existingCustomItems = [],
  itemToEdit = null,
  onSave,
}) => {
  const [role, setRole] = useState<CustomItemRole>(defaultRole);
  const [itemType, setItemType] = useState<'menu' | 'submenu'>('menu');
  const [parentId, setParentId] = useState<string>('');
  const [label, setLabel] = useState<string>('');
  const [targetType, setTargetType] = useState<CustomTargetType>('internal');
  const [selectedRoute, setSelectedRoute] = useState<string>('/admin/pruebas');
  const [externalUrl, setExternalUrl] = useState<string>('https://');
  const [openInNewTab, setOpenInNewTab] = useState<boolean>(true);
  const [selectedIcon, setSelectedIcon] = useState<string>('MdLink');
  const [routeSearch, setRouteSearch] = useState<string>('');
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string>('');

  const inputLabelRef = useRef<HTMLInputElement>(null);

  // Verificar si este elemento ya tiene submenús asociados
  const hasExistingSubmenus = itemToEdit
    ? (existingCustomItems || []).some((c) => c.parentId === itemToEdit.id)
    : false;

  // Inicializar estados cuando se abre el modal (modo creación o edición)
  useEffect(() => {
    if (isOpen) {
      if (itemToEdit) {
        setRole(itemToEdit.role);
        setItemType(itemToEdit.parentId ? 'submenu' : 'menu');
        setParentId(itemToEdit.parentId || '');
        setLabel(itemToEdit.label);
        const resolvedTargetType: CustomTargetType =
          itemToEdit.targetType === 'none' || (!itemToEdit.route && hasExistingSubmenus)
            ? 'none'
            : itemToEdit.targetType;
        setTargetType(resolvedTargetType);
        setSelectedRoute(
          itemToEdit.targetType === 'internal' && itemToEdit.route ? itemToEdit.route : '/admin/pruebas'
        );
        setExternalUrl(itemToEdit.targetType === 'external' ? itemToEdit.route : 'https://');
        setOpenInNewTab(itemToEdit.openInNewTab ?? true);
        setSelectedIcon(itemToEdit.iconName || 'MdLink');
        setRouteSearch('');
      } else {
        setRole(defaultRole);
        setItemType('menu');
        setParentId('');
        setLabel('');
        setTargetType('internal');
        setSelectedRoute('/admin/pruebas');
        setExternalUrl('https://');
        setOpenInNewTab(true);
        setSelectedIcon('MdLink');
        setRouteSearch('');
      }
      setIsSaving(false);
      setErrorMsg('');

      // Autofocus en el campo de texto del nombre (Regla UI/UX)
      setTimeout(() => {
        inputLabelRef.current?.focus();
      }, 80);
    }
  }, [isOpen, defaultRole, itemToEdit, hasExistingSubmenus]);

  // Manejar tecla Escape para cerrar modal de forma segura
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isOpen) return;
      if (e.key === 'Escape') {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  // 1. Opciones de menús padres según el rol seleccionado
  const parentOptions: ParentMenuOption[] = useMemo(() => {
    const standardParentOptions = PARENT_MENUS_BY_ROLE.filter(
      (p) => role === 'all' || p.role === role || p.role === 'all'
    );

    const customParentOptions: ParentMenuOption[] = (existingCustomItems || [])
      .filter((item) => {
        // Si estamos editando, este elemento no puede ser su propio padre
        if (itemToEdit && item.id === itemToEdit.id) return false;
        // Debe ser un menú de nivel principal (no un submenú)
        if (item.parentId) return false;
        return role === 'all' || item.role === role || item.role === 'all';
      })
      .map((item) => ({
        id: item.id,
        label: `${item.label} (Personalizado)`,
        role: item.role,
      }));

    return [...standardParentOptions, ...customParentOptions];
  }, [role, existingCustomItems, itemToEdit]);

  // Limpiar parentId si cambia de rol y el menú padre seleccionado ya no corresponde
  useEffect(() => {
    if (parentId && !parentOptions.some((p) => p.id === parentId)) {
      setParentId('');
    }
  }, [role, parentOptions, parentId]);

  // Filtrar catálogo de rutas según búsqueda
  const filteredCatalogRoutes = PLATFORM_ROUTES_CATALOG.filter((r) => {
    const term = routeSearch.toLowerCase().trim();
    if (!term) return true;
    return (
      r.label.toLowerCase().includes(term) ||
      r.route.toLowerCase().includes(term) ||
      r.category.toLowerCase().includes(term) ||
      r.description.toLowerCase().includes(term)
    );
  });

  const handleSelectCatalogRoute = (option: CatalogRouteOption) => {
    setSelectedRoute(option.route);
    if (!label.trim()) {
      setLabel(option.label);
    }
    if (option.suggestedIcon) {
      setSelectedIcon(option.suggestedIcon);
    }
  };

  const handleSubmit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (isSaving) return;

    if (!label.trim()) {
      setErrorMsg('Por favor ingresa un nombre para el menú.');
      inputLabelRef.current?.focus();
      return;
    }

    if (itemType === 'submenu' && !parentId) {
      setErrorMsg('Debes seleccionar el menú padre bajo el cual se ubicará este submenú.');
      return;
    }

    let finalRoute = selectedRoute;
    if (targetType === 'none') {
      finalRoute = '';
    } else if (targetType === 'external') {
      const url = externalUrl.trim();
      if (!url || url === 'https://' || url === 'http://') {
        setErrorMsg('Por favor ingresa una URL web válida para el enlace externo, o selecciona "Sin Ruta (Contenedor)".');
        return;
      }
      finalRoute = url;
    } else {
      if (!selectedRoute) {
        if (hasExistingSubmenus) {
          finalRoute = '';
        } else {
          setErrorMsg('Por favor selecciona una ruta del catálogo o selecciona "Sin Ruta (Contenedor)".');
          return;
        }
      }
    }

    setIsSaving(true);
    setErrorMsg('');

    try {
      const payload: Omit<CustomSidebarItem, 'id' | 'createdAt'> = {
        label: label.trim(),
        role,
        targetType,
        route: targetType === 'none' ? '' : finalRoute,
        openInNewTab: targetType === 'external' ? openInNewTab : false,
        iconName: selectedIcon || 'MdLink',
      };

      if (itemType === 'submenu' && parentId && parentId.trim()) {
        payload.parentId = parentId.trim();
      }

      await onSave(payload, itemToEdit?.id);
      onClose();
    } catch (err: any) {
      console.error('Error al guardar menú personalizado:', err);
      setErrorMsg(err.message || 'Ocurrió un error al guardar el menú.');
    } finally {
      setIsSaving(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[3000] flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div 
        className="w-full max-w-2xl bg-slate-900 border border-slate-700/80 rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh] text-white"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Cabecera del Modal */}
        <div className="px-6 py-4.5 bg-slate-950 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="p-2 rounded-xl bg-indigo-500/20 text-indigo-400 border border-indigo-500/30">
              {itemToEdit ? <RiEditLine className="text-xl" /> : <RiFolderAddLine className="text-xl" />}
            </span>
            <div>
              <h3 className="text-base font-bold text-white">
                {itemToEdit ? 'Editar Menú / Ruta del Sidebar' : 'Agregar Nuevo Menú al Sidebar'}
              </h3>
              <p className="text-xs text-slate-400">
                {itemToEdit 
                  ? 'Modifica la ruta de destino, jerarquía o enlace de navegación'
                  : 'Crea accesos directos internos o enlaces web externos para la navegación'}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <RiCloseLine className="text-xl" />
          </button>
        </div>

        {/* Cuerpo del Formulario */}
        <div className="p-6 overflow-y-auto space-y-5 flex-1">
          {errorMsg && (
            <div className="p-3 rounded-xl bg-rose-500/20 border border-rose-500/40 text-rose-300 text-xs font-medium flex items-center gap-2">
              <span>⚠️</span>
              <span>{errorMsg}</span>
            </div>
          )}

          {/* Fila 1: Rol de Destino y Tipo de Elemento */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-1.5">
                Rol con acceso al menú:
              </label>
              <select
                value={role}
                onChange={(e) => setRole(e.target.value as CustomItemRole)}
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-700 text-white text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                <option value="especialista">Especialistas</option>
                <option value="director">Directores</option>
                <option value="docente">Docentes</option>
                <option value="admin">Administrador</option>
                <option value="all">Todos los roles</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-1.5">
                Nivel de jerarquía:
              </label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setItemType('menu')}
                  className={`px-3 py-2.5 rounded-xl text-xs font-bold border transition-all text-center ${
                    itemType === 'menu'
                      ? 'bg-indigo-600 text-white border-indigo-500 shadow-md shadow-indigo-600/30'
                      : 'bg-slate-950 text-slate-400 border-slate-800 hover:bg-slate-800'
                  }`}
                >
                  Menú Principal
                </button>
                <button
                  type="button"
                  onClick={() => setItemType('submenu')}
                  className={`px-3 py-2.5 rounded-xl text-xs font-bold border transition-all text-center ${
                    itemType === 'submenu'
                      ? 'bg-indigo-600 text-white border-indigo-500 shadow-md shadow-indigo-600/30'
                      : 'bg-slate-950 text-slate-400 border-slate-800 hover:bg-slate-800'
                  }`}
                >
                  Submenú
                </button>
              </div>
            </div>
          </div>

          {/* Selector de Menú Padre (Solo si es Submenú) */}
          {itemType === 'submenu' && (
            <div className="p-3.5 rounded-2xl bg-indigo-950/40 border border-indigo-800/50 space-y-2 animate-in fade-in duration-150">
              <label className="block text-xs font-bold text-indigo-300">
                Selecciona el menú padre donde se anidará el submenú:
              </label>
              <select
                value={parentId}
                onChange={(e) => setParentId(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-indigo-700/60 text-white text-xs font-medium focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                {parentOptions.length === 0 ? (
                  <option value="" disabled>
                    ⚠️ No hay menús principales disponibles para este rol
                  </option>
                ) : (
                  <option value="">-- Elige un menú padre ({parentOptions.length} disponibles) --</option>
                )}
                {parentOptions.map((opt) => {
                  const roleBadge =
                    role === 'all'
                      ? ` [${opt.role === 'all' ? 'Todos' : opt.role}]`
                      : opt.role === 'all'
                      ? ' [Todos los roles]'
                      : '';
                  return (
                    <option key={opt.id} value={opt.id}>
                      {opt.label}{roleBadge}
                    </option>
                  );
                })}
              </select>
              {parentOptions.length === 0 ? (
                <p className="text-[11px] text-amber-300/80">
                  Para crear un submenú, primero debes registrar al menos un Menú Principal para este rol o seleccionar un rol con menús disponibles.
                </p>
              ) : (
                <p className="text-[11px] text-indigo-300/70">
                  El submenú aparecerá dentro del menú desplegable seleccionado.
                </p>
              )}
            </div>
          )}

          {/* Nombre Visible */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-1.5">
              Nombre visible en la navegación:
            </label>
            <input
              ref={inputLabelRef}
              type="text"
              value={label}
              onChange={(e) => setLabel(e.target.value)}
              placeholder="Ej. Cobertura Pedagógica 2026, Directorio de Colegios, etc."
              className="w-full px-4 py-2.5 rounded-xl bg-slate-950 border border-slate-700 text-white placeholder-slate-500 text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all shadow-inner"
            />
          </div>

          {/* Selector de Destino: Catálogo Interno vs Enlace Externo vs Sin Ruta */}
          <div className="space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-400">
                Destino del enlace:
              </label>
              <div className="flex items-center bg-slate-950 p-1 rounded-xl border border-slate-800 gap-1 text-xs">
                <button
                  type="button"
                  onClick={() => setTargetType('internal')}
                  className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-bold transition-all ${
                    targetType === 'internal'
                      ? 'bg-indigo-600 text-white shadow-sm'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  <RiCompass3Line className="text-xs" />
                  <span>Ruta Interna</span>
                </button>
                <button
                  type="button"
                  onClick={() => setTargetType('external')}
                  className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-bold transition-all ${
                    targetType === 'external'
                      ? 'bg-indigo-600 text-white shadow-sm'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  <RiLinksLine className="text-xs" />
                  <span>Enlace Web</span>
                </button>
                <button
                  type="button"
                  onClick={() => setTargetType('none')}
                  className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-bold transition-all ${
                    targetType === 'none'
                      ? 'bg-indigo-600 text-white shadow-sm'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  <RiFoldersLine className="text-xs" />
                  <span>Sin Ruta (Contenedor)</span>
                </button>
              </div>
            </div>

            {hasExistingSubmenus && (
              <div className="p-3 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-amber-300 text-xs flex items-center gap-2.5">
                <span className="text-base shrink-0">💡</span>
                <span>
                  Este menú tiene submenús asociados. Actúa principalmente como carpeta desplegable en el sidebar y no requiere ruta obligatoria.
                </span>
              </div>
            )}

            {targetType === 'none' ? (
              /* PANEL: SIN RUTA ASIGNADA (SOLO CONTENEDOR) */
              <div className="p-4 rounded-2xl bg-slate-950/70 border border-slate-800 space-y-2 animate-in fade-in duration-150">
                <div className="flex items-center gap-2.5 text-indigo-400 font-bold text-xs">
                  <span className="p-1.5 rounded-lg bg-indigo-500/20 border border-indigo-500/30">
                    <RiFoldersLine className="text-base" />
                  </span>
                  <span>Modo Menú Contenedor / Desplegable (Sin Redirección)</span>
                </div>
                <p className="text-xs text-slate-400 leading-relaxed pl-8">
                  Este menú no redirigirá a ninguna página al hacer clic. Si contiene submenús, alternará su apertura y cierre de acordeón. Si aún no tiene submenús, permanecerá como un menú visible en preparación.
                </p>
              </div>
            ) : targetType === 'internal' ? (
              /* PANEL: CATÁLOGO DE RUTAS DEL SISTEMA */
              <div className="p-4 rounded-2xl bg-slate-950/70 border border-slate-800 space-y-3 animate-in fade-in duration-150">
                <div className="relative">
                  <RiSearchLine className="absolute left-3.5 top-3 text-slate-500 text-sm" />
                  <input
                    type="text"
                    value={routeSearch}
                    onChange={(e) => setRouteSearch(e.target.value)}
                    placeholder="Buscar ruta o módulo por nombre (ej. Pizarra, Cobertura, Docentes...)"
                    className="w-full pl-9 pr-4 py-2 rounded-xl bg-slate-900 border border-slate-700/80 text-white placeholder-slate-500 text-xs font-medium focus:outline-none focus:ring-1 focus:ring-indigo-500"
                  />
                </div>

                <div className="max-h-48 overflow-y-auto space-y-1.5 pr-1 divide-y divide-slate-800/60">
                  {filteredCatalogRoutes.map((opt) => {
                    const isSelected = selectedRoute === opt.route;
                    return (
                      <div
                        key={opt.route}
                        onClick={() => handleSelectCatalogRoute(opt)}
                        className={`p-2.5 rounded-xl cursor-pointer transition-all flex items-center justify-between gap-3 ${
                          isSelected
                            ? 'bg-indigo-600/25 border border-indigo-500/60 text-white shadow-sm'
                            : 'hover:bg-slate-900/90 text-slate-300'
                        }`}
                      >
                        <div className="flex items-center gap-2.5 min-w-0">
                          <span className="p-1.5 rounded-lg bg-slate-800 text-indigo-400 shrink-0">
                            {renderCustomSidebarIcon(opt.suggestedIcon, 'text-sm')}
                          </span>
                          <div className="min-w-0">
                            <div className="flex items-center gap-2">
                              <span className="text-xs font-bold text-white truncate">
                                {opt.label}
                              </span>
                              <span className="px-1.5 py-0.2 rounded text-[9px] font-bold uppercase tracking-wider bg-slate-800 text-slate-400 border border-slate-700/60">
                                {opt.category}
                              </span>
                            </div>
                            <p className="text-[11px] text-slate-400 truncate">
                              {opt.description}
                            </p>
                          </div>
                        </div>

                        <div className="text-right shrink-0">
                          <span className="font-mono text-[10px] text-slate-400 block">
                            {opt.route}
                          </span>
                          {isSelected && (
                            <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-400">
                              <RiCheckLine /> Seleccionado
                            </span>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            ) : (
              /* PANEL: ENLACE WEB EXTERNO */
              <div className="p-4 rounded-2xl bg-slate-950/70 border border-slate-800 space-y-3 animate-in fade-in duration-150">
                <div>
                  <label className="block text-[11px] font-bold text-slate-400 mb-1">
                    Dirección URL de destino:
                  </label>
                  <div className="relative">
                    <input
                      type="url"
                      value={externalUrl}
                      onChange={(e) => setExternalUrl(e.target.value)}
                      placeholder="https://siagie.minedu.gob.pe o enlace de Google Forms / Drive"
                      className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-white placeholder-slate-500 text-xs font-mono focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                  </div>
                </div>

                <label className="flex items-center gap-2 cursor-pointer text-xs text-slate-300">
                  <input
                    type="checkbox"
                    checked={openInNewTab}
                    onChange={(e) => setOpenInNewTab(e.target.checked)}
                    className="w-4 h-4 rounded text-indigo-600 focus:ring-indigo-500 bg-slate-900 border-slate-700"
                  />
                  <span>Abrir enlace en una pestaña nueva del navegador (Recomendado)</span>
                </label>
              </div>
            )}
          </div>

          {/* Selector Visual de Iconos */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">
              Icono del menú:
            </label>
            <div className="grid grid-cols-6 sm:grid-cols-8 gap-2 max-h-32 overflow-y-auto p-2 rounded-2xl bg-slate-950 border border-slate-800">
              {AVAILABLE_ICONS.map((ico) => {
                const IconComponent = ico.component;
                const isSelected = selectedIcon === ico.name;
                return (
                  <button
                    key={ico.name}
                    type="button"
                    title={ico.label}
                    onClick={() => setSelectedIcon(ico.name)}
                    className={`p-2.5 rounded-xl flex items-center justify-center transition-all ${
                      isSelected
                        ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/40 ring-2 ring-white/30'
                        : 'bg-slate-900 text-slate-400 hover:text-white hover:bg-slate-800'
                    }`}
                  >
                    <IconComponent className="text-lg" />
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Pie de Acciones del Modal */}
        <div className="px-6 py-4 bg-slate-950 border-t border-slate-800 flex items-center justify-between gap-3">
          <button
            type="button"
            onClick={onClose}
            disabled={isSaving}
            className="px-4 py-2.5 rounded-xl text-xs font-bold text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            Cancelar
          </button>

          <button
            type="button"
            onClick={() => handleSubmit()}
            disabled={isSaving || !label.trim()}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl font-bold text-xs text-white bg-indigo-600 hover:bg-indigo-500 active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-lg shadow-indigo-600/30"
          >
            {isSaving ? (
              <>
                <span className="w-3.5 h-3.5 rounded-full border-2 border-white/30 border-t-white animate-spin" />
                <span>Guardando Menú...</span>
              </>
            ) : (
              <>
                <RiCheckLine className="text-base" />
                <span>{itemToEdit ? 'Guardar Cambios' : 'Agregar al Sidebar'}</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ModalCrearMenuPersonalizado;
