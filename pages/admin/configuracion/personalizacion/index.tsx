import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import PrivateRoutesAdmin from '@/components/layouts/PrivateRoutesAdmin';
import { 
  RiPaletteLine, 
  RiArrowLeftLine, 
  RiSave2Line, 
  RiRefreshLine,
  RiLayout4Line,
  RiBookOpenLine,
  RiArrowRightLine,
  RiCalculatorLine,
  RiFlaskLine,
  RiShieldUserLine,
  RiGlobalLine,
  RiArrowDownSLine,
  RiLoginBoxLine,
  RiSideBarLine,
  RiSearchLine,
  RiCloseLine,
  RiRestartLine,
  RiBuilding4Line,
  RiUserStarLine,
  RiTeamLine,
  RiCheckLine,
  RiEditLine,
  RiInformationLine,
  RiArrowRightSLine,
  RiAddLine,
  RiDeleteBinLine,
  RiFolderAddLine,
  RiExternalLinkLine,
  RiCompass3Line,
  RiFoldersLine
} from 'react-icons/ri';
import { 
  MdAccountBalance, 
  MdAccountCircle, 
  MdPeople, 
  MdSettings, 
  MdAssignment, 
  MdAttachMoney 
} from 'react-icons/md';
import { 
  FaUserGraduate, 
  FaUserTie, 
  FaUsers 
} from 'react-icons/fa';
import { LuListTodo } from 'react-icons/lu';
import { IoIosArrowDown, IoIosArrowForward } from 'react-icons/io';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { db } from '@/firebase/firebase.config';
import { toast } from 'react-toastify';
import {
  SidebarLabels,
  SidebarLabelKey,
  DEFAULT_SIDEBAR_LABELS,
  SIDEBAR_ROLES_METADATA,
} from '@/features/sidebar/sidebarLabelsConfig';
import { useSidebarLabels } from '@/features/context/SidebarLabelsContext';
import { 
  CustomSidebarItem, 
  CustomTargetType,
  PARENT_MENUS_BY_ROLE,
  PLATFORM_ROUTES_CATALOG,
  renderCustomSidebarIcon 
} from '@/features/sidebar/customSidebarConfig';
import { ModalCrearMenuPersonalizado } from '@/components/sidebar/ModalCrearMenuPersonalizado';

import { useRouter } from 'next/router';

const DEFAULT_COLORS = {
  colorPrincipal: '#163297',
  colorSecundario: '#0a47c4',
  colorTercero: '#3ABEF9',
  colorBackground: '#12235f',
  colorLoginBackground: '#0b132b',
  colorLoginAccent: '#facc15',
  colorSidebarBackground: '#141d2b',
  colorSidebarAccent: '#f5c518',
  // Colores por defecto para las materias de secundaria
  colorMateriaComunicacion: '#0891b2',
  colorMateriaMatematica: '#dc2626',
  colorMateriaCiencia: '#059669',
  colorMateriaDpcc: '#7c3aed',
  colorMateriaSociales: '#ea580c',
  colorHeaderEstandar: '#1d4ed8'
};

const PersonalizacionMarcaPage = () => {
  // Estados de colores generales
  const [colorPrincipal, setColorPrincipal] = useState(DEFAULT_COLORS.colorPrincipal);
  const [colorSecundario, setColorSecundario] = useState(DEFAULT_COLORS.colorSecundario);
  const [colorTercero, setColorTercero] = useState(DEFAULT_COLORS.colorTercero);
  const [colorBackground, setColorBackground] = useState(DEFAULT_COLORS.colorBackground);
  const [colorLoginBackground, setColorLoginBackground] = useState(DEFAULT_COLORS.colorLoginBackground);
  const [colorLoginAccent, setColorLoginAccent] = useState(DEFAULT_COLORS.colorLoginAccent);
  
  // Estados de colores del sidebar
  const [colorSidebarBackground, setColorSidebarBackground] = useState(DEFAULT_COLORS.colorSidebarBackground);
  const [colorSidebarAccent, setColorSidebarAccent] = useState(DEFAULT_COLORS.colorSidebarAccent);

  // Estados de colores por materia y acordeón
  const [colorMateriaComunicacion, setColorMateriaComunicacion] = useState(DEFAULT_COLORS.colorMateriaComunicacion);
  const [colorMateriaMatematica, setColorMateriaMatematica] = useState(DEFAULT_COLORS.colorMateriaMatematica);
  const [colorMateriaCiencia, setColorMateriaCiencia] = useState(DEFAULT_COLORS.colorMateriaCiencia);
  const [colorMateriaDpcc, setColorMateriaDpcc] = useState(DEFAULT_COLORS.colorMateriaDpcc);
  const [colorMateriaSociales, setColorMateriaSociales] = useState(DEFAULT_COLORS.colorMateriaSociales);
  const [colorHeaderEstandar, setColorHeaderEstandar] = useState(DEFAULT_COLORS.colorHeaderEstandar);

  const router = useRouter();
  const [activeSection, setActiveSection] = useState<'general' | 'login' | 'sidebar' | 'tarjetas' | 'acciones'>('general');
  const [previewNivel, setPreviewNivel] = useState<'primaria' | 'secundaria'>('primaria');
  const [dropdownOpen, setDropdownOpen] = useState(false);

  useEffect(() => {
    if (router.isReady && router.query.section) {
      const sec = String(router.query.section);
      if (['general', 'login', 'sidebar', 'tarjetas', 'acciones'].includes(sec)) {
        setActiveSection(sec as any);
      }
    }
  }, [router.isReady, router.query.section]);

  // Estados de permisos globales de acciones de reporte
  const [accionesDirector, setAccionesDirector] = useState({
    exportarGrillaPdf: true,
    exportarExcel: true,
    generarPdfPreguntas: true,
  });
  const [accionesEspecialista, setAccionesEspecialista] = useState({
    exportarEstudiantes: true,
    exportarExcel: true,
  });
  const [accionesDocente, setAccionesDocente] = useState({
    exportarGrillaPdf: true,
    exportarExcel: true,
    generarPdfPreguntas: true,
    actualizarRespuestas: false,
  });

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Estados para nombres y personalización del sidebar
  const [sidebarLabels, setSidebarLabels] = useState<SidebarLabels>(DEFAULT_SIDEBAR_LABELS);
  const [sidebarRoleTab, setSidebarRoleTab] = useState<'all' | 'admin' | 'director' | 'docente' | 'especialista' | 'general'>('admin');
  const [sidebarSearch, setSidebarSearch] = useState<string>('');
  const [sidebarPreviewRole, setSidebarPreviewRole] = useState<'admin' | 'director' | 'docente' | 'especialista'>('admin');

  // Integración con Menús Personalizados
  const {
    customItems,
    addCustomItem,
    updateCustomItem,
    deleteCustomItem
  } = useSidebarLabels();

  const [isModalCreateMenuOpen, setIsModalCreateMenuOpen] = useState<boolean>(false);
  const [customItemToEdit, setCustomItemToEdit] = useState<CustomSidebarItem | null>(null);
  const [selectedCustomItemId, setSelectedCustomItemId] = useState<string | null>(null);
  const [editingCustomItemLabel, setEditingCustomItemLabel] = useState<string>('');
  const [editingCustomItemRoute, setEditingCustomItemRoute] = useState<string>('');
  const [editingCustomItemTargetType, setEditingCustomItemTargetType] = useState<CustomTargetType>('internal');
  const [editingCustomItemOpenInNewTab, setEditingCustomItemOpenInNewTab] = useState<boolean>(true);
  const [isSavingCustomItem, setIsSavingCustomItem] = useState<boolean>(false);
  const [isSavingCustomItemRoute, setIsSavingCustomItemRoute] = useState<boolean>(false);

  // Estados para la previsualización interactiva y edición en vivo del sidebar
  const [selectedSidebarKey, setSelectedSidebarKey] = useState<SidebarLabelKey | null>('admin_miCuenta');
  const [editingKey, setEditingKey] = useState<SidebarLabelKey | null>(null);
  const [editingText, setEditingText] = useState<string>('');
  const [showClassicForm, setShowClassicForm] = useState<boolean>(false);
  const [openPreviewDropdowns, setOpenPreviewDropdowns] = useState<Record<string, boolean>>({
    perfiles: true,
    'especialistas-regional': false,
    especialistas: true,
    directores: false,
    docentes: true,
    estudiantes: false,
    directivos: true,
    'docentes-usuarios': false,
  });

  const handleSelectItem = (key: SidebarLabelKey) => {
    setSelectedSidebarKey(key);
    setSelectedCustomItemId(null);
    setEditingKey(null);
  };

  const handleStartInlineEdit = (key: SidebarLabelKey) => {
    setSelectedSidebarKey(key);
    setSelectedCustomItemId(null);
    setEditingKey(key);
    setEditingText(sidebarLabels[key] ?? DEFAULT_SIDEBAR_LABELS[key]);
  };

  const handleSelectCustomItem = (id: string) => {
    setSelectedCustomItemId(id);
    setSelectedSidebarKey(null);
    setEditingKey(null);
    const item = customItems.find((i) => i.id === id);
    if (item) {
      setEditingCustomItemLabel(item.label);
      setEditingCustomItemRoute(item.route || '');
      setEditingCustomItemTargetType(item.targetType || (item.route ? 'internal' : 'none'));
      setEditingCustomItemOpenInNewTab(item.openInNewTab ?? true);
    }
  };

  const handleSaveCustomItemLabel = async (id: string) => {
    if (!editingCustomItemLabel.trim()) {
      toast.error('El nombre no puede estar vacío');
      return;
    }
    setIsSavingCustomItem(true);
    try {
      await updateCustomItem(id, { label: editingCustomItemLabel.trim() });
      toast.success('Nombre del menú personalizado actualizado');
    } catch (e) {
      console.error('Error al actualizar item personalizado:', e);
      toast.error('Error al actualizar el menú personalizado');
    } finally {
      setIsSavingCustomItem(false);
    }
  };

  const handleSaveCustomItemRoute = async (
    id: string,
    overrideTargetType?: CustomTargetType,
    overrideRoute?: string
  ) => {
    const currentTargetType = overrideTargetType ?? editingCustomItemTargetType;
    const currentRoute = overrideRoute !== undefined ? overrideRoute : editingCustomItemRoute;

    if (currentTargetType === 'none') {
      setIsSavingCustomItemRoute(true);
      try {
        await updateCustomItem(id, {
          route: '',
          targetType: 'none',
          openInNewTab: false,
        });
        setEditingCustomItemRoute('');
        setEditingCustomItemTargetType('none');
        toast.success('Menú configurado sin ruta (modo contenedor / desplegable)');
      } catch (e) {
        console.error('Error al actualizar la ruta del menú:', e);
        toast.error('Error al actualizar el menú');
      } finally {
        setIsSavingCustomItemRoute(false);
      }
      return;
    }

    if (!currentRoute.trim()) {
      toast.error('La ruta no puede estar vacía');
      return;
    }
    if (currentTargetType === 'external') {
      const url = currentRoute.trim();
      if (!url.startsWith('http://') && !url.startsWith('https://')) {
        toast.error('El enlace externo debe comenzar con https:// o http://');
        return;
      }
    }
    setIsSavingCustomItemRoute(true);
    try {
      await updateCustomItem(id, {
        route: currentRoute.trim(),
        targetType: currentTargetType,
        openInNewTab: currentTargetType === 'external' ? editingCustomItemOpenInNewTab : false,
      });
      toast.success('Ruta del menú actualizada exitosamente');
    } catch (e) {
      console.error('Error al actualizar la ruta del menú:', e);
      toast.error('Error al actualizar la ruta del menú');
    } finally {
      setIsSavingCustomItemRoute(false);
    }
  };

  const handleDeleteCustomItem = async (id: string) => {
    const item = customItems.find((i) => i.id === id);
    const confirmMsg = item?.parentId 
      ? `¿Estás seguro de eliminar el submenú "${item.label}"?`
      : `¿Estás seguro de eliminar el menú "${item?.label || 'personalizado'}" y sus posibles submenús?`;

    if (window.confirm(confirmMsg)) {
      try {
        await deleteCustomItem(id);
        if (selectedCustomItemId === id) {
          setSelectedCustomItemId(null);
        }
        toast.success('Elemento eliminado del menú');
      } catch (e) {
        console.error('Error al eliminar menú personalizado:', e);
        toast.error('Error al eliminar el elemento');
      }
    }
  };

  const handleCommitInlineEdit = (key: SidebarLabelKey) => {
    handleSidebarLabelChange(key, editingText);
    setEditingKey(null);
    toast.success('Nombre actualizado en la previsualización');
  };

  const handleCancelInlineEdit = () => {
    setEditingKey(null);
  };

  const togglePreviewDropdown = (dropdownId: string) => {
    setOpenPreviewDropdowns((prev) => ({
      ...prev,
      [dropdownId]: !prev[dropdownId],
    }));
  };

  const getItemMeta = (key: SidebarLabelKey): {
    key: SidebarLabelKey;
    labelOriginal: string;
    description: string;
    categoryTitle: string;
    roleName?: string;
    roleId?: string;
    route?: string;
    isHeader?: boolean;
  } => {
    for (const role of SIDEBAR_ROLES_METADATA) {
      for (const cat of role.categories) {
        const item = cat.items.find((i) => i.key === key);
        if (item) {
          return {
            ...item,
            categoryTitle: cat.categoryTitle,
            roleName: role.roleName,
            roleId: role.roleId,
          };
        }
      }
    }
    if (key === 'sidebar_tituloSistema') {
      return { key, labelOriginal: 'Competence-Lab', description: 'Título principal en la cabecera del sidebar', categoryTitle: 'Cabecera', route: undefined };
    }
    if (key === 'sidebar_subtituloPrefix') {
      return { key, labelOriginal: 'ugel', description: 'Prefijo institucional en la cabecera', categoryTitle: 'Cabecera', route: undefined };
    }
    if (key === 'sidebar_seccionPrincipal') {
      return { key, labelOriginal: 'Principal', description: 'Título de la primera sección de navegación', categoryTitle: 'Secciones', route: undefined };
    }
    if (key === 'sidebar_seccionGestion') {
      return { key, labelOriginal: 'Gestión', description: 'Título de la sección de módulos de gestión', categoryTitle: 'Secciones', route: undefined };
    }
    return {
      key,
      labelOriginal: DEFAULT_SIDEBAR_LABELS[key] || String(key),
      description: 'Elemento del menú lateral',
      categoryTitle: 'Navegación',
      route: undefined,
    };
  };

  const renderMockItem = (
    key: SidebarLabelKey,
    defaultLabel: string,
    options?: {
      icon?: React.ReactNode;
      isSubitem?: boolean;
      subitemLevel?: number;
      isDropdownHeader?: boolean;
      dropdownId?: string;
    }
  ) => {
    const isSelected = selectedSidebarKey === key;
    const isEditing = editingKey === key;
    const currentLabel = sidebarLabels[key] ?? defaultLabel;
    const isModified = currentLabel.trim() !== '' && currentLabel !== defaultLabel;
    const isDropdownOpen = options?.dropdownId ? !!openPreviewDropdowns[options.dropdownId] : false;

    if (isEditing) {
      return (
        <div 
          key={key}
          className={`flex items-center gap-1.5 px-2 py-1.5 rounded-lg border text-xs bg-slate-900/95 shadow-lg z-10 ${
            options?.subitemLevel === 2 ? 'ml-6' : options?.isSubitem ? 'ml-3' : ''
          }`}
          style={{ borderColor: colorSidebarAccent }}
          onClick={(e) => e.stopPropagation()}
        >
          <input
            type="text"
            autoFocus
            value={editingText}
            onChange={(e) => setEditingText(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault();
                handleCommitInlineEdit(key);
              } else if (e.key === 'Escape') {
                e.preventDefault();
                handleCancelInlineEdit();
              }
            }}
            placeholder={defaultLabel}
            className="flex-1 bg-black/60 text-white font-medium text-xs px-2 py-1 rounded outline-none border border-white/20 focus:border-white/60 min-w-0"
          />
          <button
            type="button"
            onClick={() => handleCommitInlineEdit(key)}
            title="Guardar nombre (Enter)"
            className="p-1 rounded bg-emerald-500 hover:bg-emerald-600 text-white shrink-0 transition-colors"
          >
            <RiCheckLine className="text-sm" />
          </button>
          <button
            type="button"
            onClick={handleCancelInlineEdit}
            title="Cancelar (Esc)"
            className="p-1 rounded bg-slate-700 hover:bg-slate-600 text-white shrink-0 transition-colors"
          >
            <RiCloseLine className="text-sm" />
          </button>
        </div>
      );
    }

    return (
      <div
        key={key}
        onClick={() => handleSelectItem(key)}
        onDoubleClick={() => handleStartInlineEdit(key)}
        className={`group relative flex items-center justify-between px-2.5 py-1.5 rounded-lg text-xs cursor-pointer transition-all select-none ${
          options?.subitemLevel === 2 
            ? 'ml-5 pl-2.5 border-l border-white/10' 
            : options?.isSubitem 
            ? 'ml-2.5 pl-2.5 border-l border-white/10' 
            : ''
        } ${
          isSelected
            ? 'font-semibold text-white shadow-sm ring-1'
            : 'text-white/75 hover:text-white hover:bg-white/5'
        }`}
        style={
          isSelected
            ? {
                backgroundColor: `color-mix(in srgb, ${colorSidebarAccent} 22%, transparent)`,
                borderColor: colorSidebarAccent,
                color: '#ffffff',
                boxShadow: `0 0 0 1px ${colorSidebarAccent}`,
              }
            : undefined
        }
      >
        <div className="flex items-center gap-2 min-w-0 flex-1 mr-1">
          {options?.icon && (
            <span className="text-sm shrink-0 opacity-80 group-hover:opacity-100">
              {options.icon}
            </span>
          )}
          {options?.isSubitem && !options.icon && (
            <span 
              className={`w-1.5 h-1.5 rounded-full shrink-0 ${
                isModified ? 'bg-amber-400' : 'bg-white/30 group-hover:bg-white/70'
              }`}
            />
          )}
          <span className="truncate">{currentLabel || defaultLabel}</span>
          {isModified && (
            <span 
              className="w-1.5 h-1.5 rounded-full bg-amber-400 shrink-0" 
              title="Texto personalizado"
            />
          )}
        </div>

        <div className="flex items-center gap-1 shrink-0">
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              handleStartInlineEdit(key);
            }}
            title="Editar nombre"
            className="opacity-0 group-hover:opacity-100 p-1 rounded text-white/70 hover:text-white hover:bg-white/20 transition-all"
          >
            <RiEditLine className="text-xs" />
          </button>

          {options?.isDropdownHeader && options.dropdownId && (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                togglePreviewDropdown(options.dropdownId!);
              }}
              title={isDropdownOpen ? 'Contraer' : 'Desplegar'}
              className="p-0.5 text-white/50 hover:text-white transition-colors"
            >
              {isDropdownOpen ? <IoIosArrowDown className="text-xs" /> : <IoIosArrowForward className="text-xs" />}
            </button>
          )}
        </div>
      </div>
    );
  };

  const renderMockCustomItems = (parentId?: string, isSubmenu?: boolean) => {
    const items = customItems.filter((item) => {
      const roleMatches = item.role === sidebarPreviewRole || item.role === 'all';
      if (!roleMatches) return false;
      if (parentId) return item.parentId === parentId;
      return !item.parentId;
    });

    if (items.length === 0) return null;

    return (
      <>
        {items.map((item) => {
          const isSelected = selectedCustomItemId === item.id;
          const children = customItems.filter(
            (c) => (c.role === sidebarPreviewRole || c.role === 'all') && c.parentId === item.id
          );
          const hasChildren = children.length > 0;
          const isExpanded = openPreviewDropdowns[item.id] ?? true;

          return (
            <React.Fragment key={item.id}>
              <div
                onClick={(e) => {
                  e.stopPropagation();
                  handleSelectCustomItem(item.id);
                }}
                className={`group relative flex items-center justify-between px-2.5 py-1.5 rounded-lg text-xs cursor-pointer transition-all select-none ${
                  isSubmenu ? 'ml-2.5 pl-2.5 border-l border-white/10' : ''
                } ${
                  isSelected
                    ? 'font-semibold text-white shadow-sm ring-1'
                    : 'text-white/80 hover:text-white hover:bg-white/5'
                }`}
                style={
                  isSelected
                    ? {
                        backgroundColor: `color-mix(in srgb, ${colorSidebarAccent} 22%, transparent)`,
                        borderColor: colorSidebarAccent,
                        color: '#ffffff',
                        boxShadow: `0 0 0 1px ${colorSidebarAccent}`,
                      }
                    : undefined
                }
              >
                <div className="flex items-center gap-2 min-w-0 flex-1 mr-1" title={item.label}>
                  {!isSubmenu && item.iconName ? (
                    <span className="text-sm shrink-0 opacity-80 group-hover:opacity-100">
                      {renderCustomSidebarIcon(item.iconName, 'text-sm')}
                    </span>
                  ) : null}
                  <span className="truncate">{item.label}</span>
                  <span className="px-1.5 py-0.5 rounded text-[8px] font-bold uppercase tracking-wider bg-indigo-500/25 text-indigo-200 border border-indigo-400/25 shrink-0">
                    Personalizado
                  </span>
                </div>

                <div className="flex items-center gap-1 shrink-0">
                  {hasChildren && !isSubmenu && (
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        togglePreviewDropdown(item.id);
                      }}
                      className="p-0.5 text-white/50 hover:text-white transition-colors"
                      title={isExpanded ? 'Contraer' : 'Expandir'}
                    >
                      {isExpanded ? <IoIosArrowDown className="text-xs" /> : <IoIosArrowForward className="text-xs" />}
                    </button>
                  )}
                  {item.targetType === 'external' ? (
                    <RiExternalLinkLine className="text-xs text-white/50" title="Enlace Web Externo" />
                  ) : item.targetType === 'none' || !item.route ? (
                    <span className="text-[10px] text-amber-300/80 font-bold" title="Sin ruta asignada (Contenedor)">📁</span>
                  ) : (
                    <RiCompass3Line className="text-xs text-white/50" title="Ruta Interna" />
                  )}
                </div>
              </div>

              {!isSubmenu && hasChildren && isExpanded && (
                <div className="space-y-1">
                  {renderMockCustomItems(item.id, true)}
                </div>
              )}
            </React.Fragment>
          );
        })}
      </>
    );
  };

  useEffect(() => {
    const fetchBranding = async () => {
      try {
        const docRef = doc(db, 'configuracion', 'branding');
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          const data = docSnap.data();
          if (data.colorPrincipal) setColorPrincipal(data.colorPrincipal);
          if (data.colorSecundario) setColorSecundario(data.colorSecundario);
          if (data.colorTercero) setColorTercero(data.colorTercero);
          if (data.colorBackground) setColorBackground(data.colorBackground);
          if (data.colorLoginBackground) setColorLoginBackground(data.colorLoginBackground);
          if (data.colorLoginAccent) setColorLoginAccent(data.colorLoginAccent);
          if (data.colorSidebarBackground) setColorSidebarBackground(data.colorSidebarBackground);
          if (data.colorSidebarAccent) setColorSidebarAccent(data.colorSidebarAccent);
          
          if (data.colorMateriaComunicacion) setColorMateriaComunicacion(data.colorMateriaComunicacion);
          if (data.colorMateriaMatematica) setColorMateriaMatematica(data.colorMateriaMatematica);
          if (data.colorMateriaCiencia) setColorMateriaCiencia(data.colorMateriaCiencia);
          if (data.colorMateriaDpcc) setColorMateriaDpcc(data.colorMateriaDpcc);
          if (data.colorMateriaSociales) setColorMateriaSociales(data.colorMateriaSociales);
          if (data.colorHeaderEstandar) setColorHeaderEstandar(data.colorHeaderEstandar);

          if (data.sidebarLabels && typeof data.sidebarLabels === 'object') {
            setSidebarLabels({ ...DEFAULT_SIDEBAR_LABELS, ...data.sidebarLabels });
          }

          if (data.accionesDirector) {
            setAccionesDirector({
              exportarGrillaPdf: data.accionesDirector.exportarGrillaPdf !== false,
              exportarExcel: data.accionesDirector.exportarExcel !== false,
              generarPdfPreguntas: data.accionesDirector.generarPdfPreguntas !== false,
            });
          }
          if (data.accionesEspecialista) {
            setAccionesEspecialista({
              exportarEstudiantes: data.accionesEspecialista.exportarEstudiantes !== false,
              exportarExcel: data.accionesEspecialista.exportarExcel !== false,
            });
          }
          if (data.accionesDocente) {
            setAccionesDocente({
              exportarGrillaPdf: data.accionesDocente.exportarGrillaPdf !== false,
              exportarExcel: data.accionesDocente.exportarExcel !== false,
              generarPdfPreguntas: data.accionesDocente.generarPdfPreguntas !== false,
              actualizarRespuestas: Boolean(data.accionesDocente.actualizarRespuestas),
            });
          }
        }
      } catch (error) {
        console.error('Error al obtener la configuración de marca:', error);
        toast.error('No se pudo cargar la configuración de marca');
      } finally {
        setLoading(false);
      }
    };

    fetchBranding();
  }, []);

  const handleSave = async () => {
    setSaving(true);
    try {
      const docRef = doc(db, 'configuracion', 'branding');
      await setDoc(docRef, {
        colorPrincipal,
        colorSecundario,
        colorTercero,
        colorBackground,
        colorLoginBackground,
        colorLoginAccent,
        colorSidebarBackground,
        colorSidebarAccent,
        colorMateriaComunicacion,
        colorMateriaMatematica,
        colorMateriaCiencia,
        colorMateriaDpcc,
        colorMateriaSociales,
        colorHeaderEstandar,
        accionesDirector,
        accionesEspecialista,
        accionesDocente,
        sidebarLabels,
        ultimaActualizacion: new Date()
      }, { merge: true });

      if (typeof window !== 'undefined') {
        localStorage.setItem('sidebar_labels', JSON.stringify(sidebarLabels));
      }

      toast.success('¡Configuración guardada exitosamente!');
    } catch (error) {
      console.error('Error al guardar branding:', error);
      toast.error('Ocurrió un error al guardar los colores de la marca');
    } finally {
      setSaving(false);
    }
  };

  const handleReset = () => {
    if (window.confirm('¿Está seguro de que desea restablecer los colores predeterminados de esta sección?')) {
      if (activeSection === 'general') {
        setColorPrincipal(DEFAULT_COLORS.colorPrincipal);
        setColorSecundario(DEFAULT_COLORS.colorSecundario);
        setColorTercero(DEFAULT_COLORS.colorTercero);
        setColorBackground(DEFAULT_COLORS.colorBackground);
      } else if (activeSection === 'login') {
        setColorLoginBackground(DEFAULT_COLORS.colorLoginBackground);
        setColorLoginAccent(DEFAULT_COLORS.colorLoginAccent);
      } else if (activeSection === 'sidebar') {
        setColorSidebarBackground(DEFAULT_COLORS.colorSidebarBackground);
        setColorSidebarAccent(DEFAULT_COLORS.colorSidebarAccent);
        if (window.confirm('¿Desea también restablecer todos los nombres personalizados del menú lateral a sus valores predeterminados?')) {
          setSidebarLabels(DEFAULT_SIDEBAR_LABELS);
        }
      } else if (activeSection === 'tarjetas') {
        setColorMateriaComunicacion(DEFAULT_COLORS.colorMateriaComunicacion);
        setColorMateriaMatematica(DEFAULT_COLORS.colorMateriaMatematica);
        setColorMateriaCiencia(DEFAULT_COLORS.colorMateriaCiencia);
        setColorMateriaDpcc(DEFAULT_COLORS.colorMateriaDpcc);
        setColorMateriaSociales(DEFAULT_COLORS.colorMateriaSociales);
        setColorHeaderEstandar(DEFAULT_COLORS.colorHeaderEstandar);
      }
    }
  };

  const handleSidebarLabelChange = (key: SidebarLabelKey, val: string) => {
    setSidebarLabels((prev) => ({ ...prev, [key]: val }));
  };

  const handleResetSingleSidebarLabel = (key: SidebarLabelKey) => {
    setSidebarLabels((prev) => ({ ...prev, [key]: DEFAULT_SIDEBAR_LABELS[key] }));
  };

  const handleResetRoleSidebarLabels = (roleId: string) => {
    const roleMeta = SIDEBAR_ROLES_METADATA.find((r) => r.roleId === roleId);
    if (!roleMeta) return;
    if (window.confirm(`¿Está seguro de que desea restablecer todos los nombres de "${roleMeta.roleName}" a sus valores originales?`)) {
      setSidebarLabels((prev) => {
        const next = { ...prev };
        roleMeta.categories.forEach((cat) => {
          cat.items.forEach((item) => {
            next[item.key] = DEFAULT_SIDEBAR_LABELS[item.key];
          });
        });
        return next;
      });
      toast.info(`Nombres de ${roleMeta.roleName} restablecidos.`);
    }
  };

  const getCustomizedCount = (roleId?: string) => {
    if (!roleId || roleId === 'all') {
      return Object.keys(sidebarLabels).filter(
        (k) => sidebarLabels[k as SidebarLabelKey] && sidebarLabels[k as SidebarLabelKey] !== DEFAULT_SIDEBAR_LABELS[k as SidebarLabelKey]
      ).length;
    }
    const roleMeta = SIDEBAR_ROLES_METADATA.find((r) => r.roleId === roleId);
    if (!roleMeta) return 0;
    let count = 0;
    roleMeta.categories.forEach((cat) => {
      cat.items.forEach((item) => {
        const val = sidebarLabels[item.key];
        if (val && val !== DEFAULT_SIDEBAR_LABELS[item.key]) {
          count++;
        }
      });
    });
    return count;
  };

  const customizedCountTotal = getCustomizedCount('all');

  const filteredRoleMetas = SIDEBAR_ROLES_METADATA.filter((roleMeta) => {
    if (sidebarRoleTab === 'all') return true;
    return roleMeta.roleId === sidebarRoleTab;
  }).map((roleMeta) => {
    if (!sidebarSearch.trim()) return roleMeta;
    const q = sidebarSearch.toLowerCase().trim();
    const filteredCategories = roleMeta.categories.map((cat) => {
      const filteredItems = cat.items.filter((item) => {
        const currentVal = (sidebarLabels[item.key] || '').toLowerCase();
        const defaultVal = item.labelOriginal.toLowerCase();
        const desc = item.description.toLowerCase();
        const route = (item.route || '').toLowerCase();
        return (
          currentVal.includes(q) ||
          defaultVal.includes(q) ||
          desc.includes(q) ||
          route.includes(q)
        );
      });
      return { ...cat, items: filteredItems };
    }).filter((cat) => cat.items.length > 0);

    return { ...roleMeta, categories: filteredCategories };
  }).filter((roleMeta) => roleMeta.categories.length > 0);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="w-12 h-12 border-4 border-violet-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className={`p-4 sm:p-6 mx-auto min-h-screen transition-all ${
      activeSection === 'sidebar' ? 'max-w-[1720px] w-full' : 'max-w-7xl'
    }`}>
      <div className="mb-6">
        <Link 
          href="/admin/configuracion" 
          className="text-sm font-semibold text-slate-500 hover:text-slate-800 transition-colors flex items-center gap-1"
        >
          <RiArrowLeftLine /> Volver a Configuración
        </Link>
      </div>

      <div className="flex items-center gap-3 mb-8">
        <div className="w-12 h-12 rounded-2xl bg-violet-50 text-violet-600 flex items-center justify-center">
          <RiPaletteLine className="text-2xl" />
        </div>
        <div>
          <h1 className="text-2xl font-extrabold text-slate-800">
            Personalización de Marca
          </h1>
          <p className="text-slate-500 text-sm">
            Gestiona la paleta de colores global, tarjetas de evaluación y componentes.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Panel de Controles */}
        <div className={`${
          activeSection === 'sidebar' ? 'lg:col-span-4 xl:col-span-4 2xl:col-span-3' : 'lg:col-span-5'
        } bg-white p-6 rounded-3xl border border-slate-100 shadow-sm flex flex-col justify-between`}>
          <div>
            {/* Dropdown Custom */}
            <div className="relative mb-8">
              <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">
                Seleccionar Sección
              </label>
              <button
                type="button"
                onClick={() => setDropdownOpen(!dropdownOpen)}
                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl flex items-center justify-between text-slate-700 font-semibold text-sm hover:bg-slate-100 hover:border-slate-300 transition-all active:scale-[0.99] focus:outline-none"
              >
                <div className="flex items-center gap-2">
                  <span className="text-violet-600 text-lg">
                    {activeSection === 'general' && <RiLayout4Line />}
                    {activeSection === 'login' && <RiLoginBoxLine />}
                    {activeSection === 'sidebar' && <RiSideBarLine />}
                    {activeSection === 'tarjetas' && <RiBookOpenLine />}
                    {activeSection === 'acciones' && <RiShieldUserLine />}
                  </span>
                  <span>
                    {activeSection === 'general' && 'Tema General'}
                    {activeSection === 'login' && 'Página de Login'}
                    {activeSection === 'sidebar' && 'Barra Lateral (Sidebar)'}
                    {activeSection === 'tarjetas' && 'Tarjetas Cursos'}
                    {activeSection === 'acciones' && 'Acciones de Reportes (Permisos)'}
                  </span>
                </div>
                <RiArrowDownSLine className={`text-slate-400 text-lg transition-transform duration-200 ${dropdownOpen ? 'rotate-180' : ''}`} />
              </button>

              {dropdownOpen && (
                <>
                  <div className="fixed inset-0 z-10" onClick={() => setDropdownOpen(false)} />
                  <div className="absolute left-0 right-0 mt-2 bg-white border border-slate-100 rounded-2xl shadow-xl z-20 overflow-hidden animate-in fade-in slide-in-from-top-2 duration-150">
                    <button
                      type="button"
                      onClick={() => {
                        setActiveSection('general');
                        setDropdownOpen(false);
                      }}
                      className={`w-full px-4 py-3 flex items-center gap-2 text-sm text-left transition-colors ${
                        activeSection === 'general' 
                          ? 'bg-violet-50 text-violet-600 font-bold' 
                          : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                      }`}
                    >
                      <span className={activeSection === 'general' ? 'text-violet-600 text-lg' : 'text-slate-400 text-lg'}>
                        <RiLayout4Line />
                      </span>
                      <span>Tema General</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setActiveSection('login');
                        setDropdownOpen(false);
                      }}
                      className={`w-full px-4 py-3 flex items-center gap-2 text-sm text-left transition-colors ${
                        activeSection === 'login' 
                          ? 'bg-violet-50 text-violet-600 font-bold' 
                          : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                      }`}
                    >
                      <span className={activeSection === 'login' ? 'text-violet-600 text-lg' : 'text-slate-400 text-lg'}>
                        <RiLoginBoxLine />
                      </span>
                      <span>Página de Login</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setActiveSection('sidebar');
                        setDropdownOpen(false);
                      }}
                      className={`w-full px-4 py-3 flex items-center gap-2 text-sm text-left transition-colors ${
                        activeSection === 'sidebar' 
                          ? 'bg-violet-50 text-violet-600 font-bold' 
                          : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                      }`}
                    >
                      <span className={activeSection === 'sidebar' ? 'text-violet-600 text-lg' : 'text-slate-400 text-lg'}>
                        <RiSideBarLine />
                      </span>
                      <span>Barra Lateral (Sidebar)</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setActiveSection('tarjetas');
                        setDropdownOpen(false);
                      }}
                      className={`w-full px-4 py-3 flex items-center gap-2 text-sm text-left transition-colors ${
                        activeSection === 'tarjetas' 
                          ? 'bg-violet-50 text-violet-600 font-bold' 
                          : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                      }`}
                    >
                      <span className={activeSection === 'tarjetas' ? 'text-violet-600 text-lg' : 'text-slate-400 text-lg'}>
                        <RiBookOpenLine />
                      </span>
                      <span>Tarjetas Cursos</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setActiveSection('acciones');
                        setDropdownOpen(false);
                      }}
                      className={`w-full px-4 py-3 flex items-center gap-2 text-sm text-left transition-colors ${
                        activeSection === 'acciones' 
                          ? 'bg-violet-50 text-violet-600 font-bold' 
                          : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                      }`}
                    >
                      <span className={activeSection === 'acciones' ? 'text-violet-600 text-lg' : 'text-slate-400 text-lg'}>
                        <RiShieldUserLine />
                      </span>
                      <span>Acciones de Reportes (Permisos)</span>
                    </button>
                  </div>
                </>
              )}
            </div>

            {activeSection === 'general' && (
              <div>
                <h3 className="text-sm font-bold text-slate-700 mb-4">Colores del Portal</h3>
                
                {/* Color de Navbar */}
                <div className="mb-5">
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">
                    Color de Navbar (Cabeceras y Menús)
                  </label>
                  <div className="flex gap-2">
                    <input 
                      type="color" 
                      value={colorPrincipal}
                      onChange={(e) => setColorPrincipal(e.target.value)}
                      className="w-12 h-12 border border-slate-200 rounded-xl cursor-pointer p-1 bg-white"
                    />
                    <input 
                      type="text" 
                      value={colorPrincipal}
                      onChange={(e) => setColorPrincipal(e.target.value)}
                      maxLength={7}
                      className="flex-1 px-4 py-2 border border-slate-200 rounded-xl text-slate-700 font-mono text-sm focus:outline-none focus:border-violet-500"
                    />
                  </div>
                </div>

                {/* Color de Fondo */}
                <div className="mb-5">
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">
                    Color de Fondo (Contenido Principal)
                  </label>
                  <div className="flex gap-2">
                    <input 
                      type="color" 
                      value={colorSecundario}
                      onChange={(e) => setColorSecundario(e.target.value)}
                      className="w-12 h-12 border border-slate-200 rounded-xl cursor-pointer p-1 bg-white"
                    />
                    <input 
                      type="text" 
                      value={colorSecundario}
                      onChange={(e) => setColorSecundario(e.target.value)}
                      maxLength={7}
                      className="flex-1 px-4 py-2 border border-slate-200 rounded-xl text-slate-700 font-mono text-sm focus:outline-none focus:border-violet-500"
                    />
                  </div>
                </div>

                {/* Color Tercero */}
                <div className="mb-5">
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">
                    Color de Botones y Acentos (Tercero)
                  </label>
                  <div className="flex gap-2">
                    <input 
                      type="color" 
                      value={colorTercero}
                      onChange={(e) => setColorTercero(e.target.value)}
                      className="w-12 h-12 border border-slate-200 rounded-xl cursor-pointer p-1 bg-white"
                    />
                    <input 
                      type="text" 
                      value={colorTercero}
                      onChange={(e) => setColorTercero(e.target.value)}
                      maxLength={7}
                      className="flex-1 px-4 py-2 border border-slate-200 rounded-xl text-slate-700 font-mono text-sm focus:outline-none focus:border-violet-500"
                    />
                  </div>
                </div>

                {/* Color de Fondo (Dashboard) */}
                <div className="mb-5">
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">
                    Color de Fondo (Dashboard)
                  </label>
                  <div className="flex gap-2">
                    <input 
                      type="color" 
                      value={colorBackground}
                      onChange={(e) => setColorBackground(e.target.value)}
                      className="w-12 h-12 border border-slate-200 rounded-xl cursor-pointer p-1 bg-white"
                    />
                    <input 
                      type="text" 
                      value={colorBackground}
                      onChange={(e) => setColorBackground(e.target.value)}
                      maxLength={7}
                      className="flex-1 px-4 py-2 border border-slate-200 rounded-xl text-slate-700 font-mono text-sm focus:outline-none focus:border-violet-500"
                    />
                  </div>
                </div>
              </div>
            )}

            {activeSection === 'login' && (
              <div>
                <h3 className="text-sm font-bold text-slate-700 mb-4">Página de Login</h3>

                {/* Color de Fondo de Login */}
                <div className="mb-5">
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">
                    Color de Fondo de Login
                  </label>
                  <div className="flex gap-2">
                    <input 
                      type="color" 
                      value={colorLoginBackground}
                      onChange={(e) => {
                        setColorLoginBackground(e.target.value);
                      }}
                      className="w-12 h-12 border border-slate-200 rounded-xl cursor-pointer p-1 bg-white"
                    />
                    <input 
                      type="text" 
                      value={colorLoginBackground}
                      onChange={(e) => {
                        setColorLoginBackground(e.target.value);
                      }}
                      maxLength={7}
                      className="flex-1 px-4 py-2 border border-slate-200 rounded-xl text-slate-700 font-mono text-sm focus:outline-none focus:border-violet-500"
                    />
                  </div>
                </div>

                {/* Color de Acento de Login */}
                <div className="mb-5">
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">
                    Color de Acento de Login (Botón y Detalles)
                  </label>
                  <div className="flex gap-2">
                    <input 
                      type="color" 
                      value={colorLoginAccent}
                      onChange={(e) => {
                        setColorLoginAccent(e.target.value);
                      }}
                      className="w-12 h-12 border border-slate-200 rounded-xl cursor-pointer p-1 bg-white"
                    />
                    <input 
                      type="text" 
                      value={colorLoginAccent}
                      onChange={(e) => {
                        setColorLoginAccent(e.target.value);
                      }}
                      maxLength={7}
                      className="flex-1 px-4 py-2 border border-slate-200 rounded-xl text-slate-700 font-mono text-sm focus:outline-none focus:border-violet-500"
                    />
                  </div>
                </div>
              </div>
            )}

            {activeSection === 'sidebar' && (
              <div className="space-y-6">
                <div>
                  <h3 className="text-sm font-bold text-slate-700 mb-1">Barra Lateral (Sidebar)</h3>
                  <p className="text-xs text-slate-500">
                    Ajusta los colores y personaliza la estructura de navegación para cada perfil.
                  </p>
                </div>

                {/* Colores del Sidebar */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 p-4 bg-slate-50 rounded-2xl border border-slate-200/80">
                  {/* Color de Fondo de Sidebar */}
                  <div>
                    <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider mb-2">
                      Color de Fondo
                    </label>
                    <div className="flex gap-2">
                      <input 
                        type="color" 
                        value={colorSidebarBackground}
                        onChange={(e) => {
                          setColorSidebarBackground(e.target.value);
                        }}
                        className="w-11 h-11 border border-slate-200 rounded-xl cursor-pointer p-1 bg-white shadow-sm"
                      />
                      <input 
                        type="text" 
                        value={colorSidebarBackground}
                        onChange={(e) => {
                          setColorSidebarBackground(e.target.value);
                        }}
                        maxLength={7}
                        className="flex-1 px-3 py-2 border border-slate-200 rounded-xl text-slate-700 font-mono text-xs focus:outline-none focus:border-indigo-500 bg-white"
                      />
                    </div>
                  </div>

                  {/* Color de Acento de Sidebar */}
                  <div>
                    <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider mb-2">
                      Color de Acento / Activo
                    </label>
                    <div className="flex gap-2">
                      <input 
                        type="color" 
                        value={colorSidebarAccent}
                        onChange={(e) => {
                          setColorSidebarAccent(e.target.value);
                        }}
                        className="w-11 h-11 border border-slate-200 rounded-xl cursor-pointer p-1 bg-white shadow-sm"
                      />
                      <input 
                        type="text" 
                        value={colorSidebarAccent}
                        onChange={(e) => {
                          setColorSidebarAccent(e.target.value);
                        }}
                        maxLength={7}
                        className="flex-1 px-3 py-2 border border-slate-200 rounded-xl text-slate-700 font-mono text-xs focus:outline-none focus:border-indigo-500 bg-white"
                      />
                    </div>
                  </div>
                </div>

                {/* Separador y Personalización por Rol */}
                <div className="pt-4 border-t border-slate-200">
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-4">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="p-1.5 rounded-lg bg-indigo-50 text-indigo-600">
                          <RiEditLine className="text-base" />
                        </span>
                        <h4 className="text-sm font-bold text-slate-800">
                          Nombres de Menú por Rol
                        </h4>
                      </div>
                      <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                        Edita directamente en la <strong>previsualización en vivo</strong> de la derecha o busca un elemento a continuación.
                      </p>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-slate-100 text-slate-700 border border-slate-200">
                        <span className={`w-2 h-2 rounded-full ${customizedCountTotal > 0 ? 'bg-amber-500 animate-pulse' : 'bg-emerald-500'}`} />
                        {customizedCountTotal > 0 ? `${customizedCountTotal} modificados` : 'Predeterminados'}
                      </span>
                    </div>
                  </div>

                  {/* Tarjeta de Gestión de Menús y Submenús Personalizados */}
                  <div className="mb-5 p-4 rounded-2xl bg-indigo-50/70 border border-indigo-200/80 shadow-sm">
                    <div className="flex items-center justify-between gap-3 mb-3">
                      <div className="flex items-center gap-2">
                        <div className="p-1.5 rounded-lg bg-indigo-600 text-white shadow-sm">
                          <RiFolderAddLine className="text-sm" />
                        </div>
                        <div>
                          <h5 className="text-xs font-bold text-slate-800">
                            Menús y Submenús Personalizados
                          </h5>
                          <p className="text-[11px] text-slate-500">
                            {customItems.length === 0 
                              ? 'Crea nuevos accesos directos o herramientas externas' 
                              : `${customItems.length} configurado(s) en total`}
                          </p>
                        </div>
                      </div>

                      <button
                        type="button"
                        onClick={() => {
                          setCustomItemToEdit(null);
                          setIsModalCreateMenuOpen(true);
                        }}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold shadow-sm transition-all active:scale-95 shrink-0"
                      >
                        <RiAddLine className="text-sm" />
                        <span>+ Agregar Menú</span>
                      </button>
                    </div>

                    {customItems.length > 0 ? (
                      <div className="space-y-2 max-h-[220px] overflow-y-auto pr-1">
                        {customItems.map((item) => {
                          const isSelected = selectedCustomItemId === item.id;
                          return (
                            <div
                              key={item.id}
                              onClick={() => handleSelectCustomItem(item.id)}
                              className={`p-2.5 rounded-xl border flex items-center justify-between gap-2.5 cursor-pointer transition-all ${
                                isSelected
                                  ? 'bg-white border-indigo-500 shadow-sm ring-1 ring-indigo-500'
                                  : 'bg-white/90 border-slate-200 hover:border-indigo-300 hover:bg-white'
                              }`}
                            >
                              <div className="flex items-center gap-2 min-w-0 flex-1">
                                <span className="text-indigo-600 shrink-0">
                                  {renderCustomSidebarIcon(item.iconName, 'text-sm')}
                                </span>
                                <div className="min-w-0 flex-1">
                                  <div className="flex items-center gap-1.5 flex-wrap">
                                    <span className="text-xs font-bold text-slate-800 truncate">
                                      {item.label}
                                    </span>
                                    <span className="px-1.5 py-0.2 rounded text-[9px] font-bold uppercase bg-slate-100 text-slate-600">
                                      {item.role === 'all' ? 'Todos' : item.role}
                                    </span>
                                    {item.parentId && (
                                      <span className="px-1.5 py-0.2 rounded text-[9px] font-medium bg-amber-50 text-amber-700 border border-amber-200">
                                        Submenú
                                      </span>
                                    )}
                                  </div>
                                  <p className="text-[10px] font-mono text-slate-400 truncate mt-0.5">
                                    {item.route}
                                  </p>
                                </div>
                              </div>

                              <div className="flex items-center gap-1 shrink-0">
                                <button
                                  type="button"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setCustomItemToEdit(item);
                                    setIsModalCreateMenuOpen(true);
                                  }}
                                  className="p-1 rounded text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 transition-colors"
                                  title="Editar menú / ruta"
                                >
                                  <RiEditLine className="text-sm" />
                                </button>

                                <button
                                  type="button"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleDeleteCustomItem(item.id);
                                  }}
                                  className="p-1 rounded text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors"
                                  title="Eliminar menú personalizado"
                                >
                                  <RiDeleteBinLine className="text-sm" />
                                </button>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    ) : (
                      <div className="text-center py-3 px-2 bg-white/60 rounded-xl border border-dashed border-indigo-200 text-slate-500 text-[11px]">
                        No hay menús personalizados aún. Pulsa <strong>+ Agregar Menú</strong> para crear el primero.
                      </div>
                    )}
                  </div>

                  {/* Tabs de Filtro y Sincronización por Rol */}
                  <div className="flex items-center gap-1.5 overflow-x-auto pb-2 mb-4 scrollbar-thin">
                    {[
                      { id: 'admin', label: 'Administrador', icon: RiShieldUserLine, count: getCustomizedCount('admin') },
                      { id: 'director', label: 'Directores', icon: RiBuilding4Line, count: getCustomizedCount('director') },
                      { id: 'docente', label: 'Docentes', icon: RiUserStarLine, count: getCustomizedCount('docente') },
                      { id: 'especialista', label: 'Especialistas', icon: RiTeamLine, count: getCustomizedCount('especialista') },
                      { id: 'general', label: 'Cabecera', icon: RiGlobalLine, count: getCustomizedCount('general') },
                      { id: 'all', label: 'Todos', icon: RiSideBarLine, count: customizedCountTotal },
                    ].map((tab) => {
                      const Icon = tab.icon;
                      const isActive = sidebarRoleTab === tab.id;
                      return (
                        <button
                          key={tab.id}
                          type="button"
                          onClick={() => {
                            setSidebarRoleTab(tab.id as any);
                            if (tab.id !== 'all' && tab.id !== 'general') {
                              setSidebarPreviewRole(tab.id as any);
                            }
                          }}
                          className={`inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold transition-all whitespace-nowrap min-h-[38px] ${
                            isActive
                              ? 'bg-indigo-600 text-white shadow-sm shadow-indigo-200'
                              : 'bg-white text-slate-600 hover:bg-slate-50 hover:text-slate-900 border border-slate-200/80'
                          }`}
                        >
                          <Icon className={`text-sm ${isActive ? 'text-white' : 'text-slate-400'}`} />
                          <span>{tab.label}</span>
                          {tab.count > 0 && (
                            <span className={`px-1.5 py-0.5 rounded-full text-[10px] font-bold ${
                              isActive ? 'bg-white/20 text-white' : 'bg-amber-100 text-amber-800'
                            }`}>
                              {tab.count}
                            </span>
                          )}
                        </button>
                      );
                    })}
                  </div>

                  {/* Barra de Búsqueda Rápida */}
                  <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 mb-4 bg-slate-50 p-3 rounded-2xl border border-slate-200/70">
                    <div className="relative flex-1">
                      <RiSearchLine className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 text-base" />
                      <input
                        type="text"
                        value={sidebarSearch}
                        onChange={(e) => setSidebarSearch(e.target.value)}
                        placeholder="Buscar menú, submenú o ruta..."
                        className="w-full pl-10 pr-9 py-2 bg-white border border-slate-200 rounded-xl text-xs text-slate-700 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent min-h-[38px]"
                      />
                      {sidebarSearch && (
                        <button
                          type="button"
                          onClick={() => setSidebarSearch('')}
                          aria-label="Limpiar búsqueda"
                          className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-1"
                        >
                          <RiCloseLine className="text-base" />
                        </button>
                      )}
                    </div>

                    {sidebarRoleTab !== 'all' && (
                      <button
                        type="button"
                        onClick={() => handleResetRoleSidebarLabels(sidebarRoleTab)}
                        className="inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold text-slate-600 bg-white hover:bg-rose-50 hover:text-rose-600 border border-slate-200 hover:border-rose-200 transition-colors shrink-0 min-h-[38px]"
                        title="Restablecer los textos de este rol a sus valores predeterminados"
                      >
                        <RiRestartLine className="text-sm" />
                        <span>Restablecer rol</span>
                      </button>
                    )}
                  </div>

                  {/* Resultados de Búsqueda si hay término */}
                  {sidebarSearch.trim() !== '' ? (
                    filteredRoleMetas.length === 0 ? (
                      <div className="text-center py-8 px-4 bg-slate-50 rounded-2xl border border-dashed border-slate-300">
                        <RiSearchLine className="mx-auto text-3xl text-slate-400 mb-2" />
                        <p className="text-xs font-semibold text-slate-600">No se encontraron elementos de menú</p>
                        <p className="text-[11px] text-slate-400 mt-1">Intenta con otro término de búsqueda.</p>
                        <button
                          type="button"
                          onClick={() => setSidebarSearch('')}
                          className="mt-3 px-3 py-1.5 text-xs font-semibold text-indigo-600 hover:text-indigo-800 bg-indigo-50 rounded-lg transition-colors"
                        >
                          Limpiar búsqueda
                        </button>
                      </div>
                    ) : (
                      <div className="space-y-3 mb-6">
                        <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                          Resultados de Búsqueda ({filteredRoleMetas.flatMap(r => r.categories.flatMap(c => c.items)).length})
                        </span>
                        <div className="space-y-2 max-h-[320px] overflow-y-auto pr-1">
                          {filteredRoleMetas.flatMap((r) =>
                            r.categories.flatMap((cat) =>
                              cat.items.map((item) => {
                                const currentVal = sidebarLabels[item.key] ?? '';
                                const isModified = currentVal.trim() !== '' && currentVal !== item.labelOriginal;
                                const isSelected = selectedSidebarKey === item.key;

                                return (
                                  <div
                                    key={item.key}
                                    onClick={() => {
                                      handleSelectItem(item.key);
                                      if (r.roleId !== 'general') {
                                        setSidebarPreviewRole(r.roleId as any);
                                      }
                                    }}
                                    className={`p-3 rounded-xl border cursor-pointer transition-all flex items-center justify-between gap-3 ${
                                      isSelected
                                        ? 'bg-indigo-50/70 border-indigo-300 ring-2 ring-indigo-200'
                                        : 'bg-white border-slate-200 hover:border-indigo-200 hover:bg-slate-50'
                                    }`}
                                  >
                                    <div className="min-w-0 flex-1">
                                      <div className="flex items-center gap-2 flex-wrap">
                                        <span className="text-xs font-bold text-slate-800">
                                          {currentVal || item.labelOriginal}
                                        </span>
                                        <span className="px-1.5 py-0.5 rounded text-[10px] bg-slate-100 text-slate-500 font-medium">
                                          {cat.categoryTitle}
                                        </span>
                                        {isModified && (
                                          <span className="px-1.5 py-0.5 rounded-full text-[9px] font-bold bg-amber-100 text-amber-800">
                                            Modificado
                                          </span>
                                        )}
                                      </div>
                                      <p className="text-[11px] text-slate-400 truncate mt-0.5">
                                        {item.route || item.description}
                                      </p>
                                    </div>
                                    <button
                                      type="button"
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        handleStartInlineEdit(item.key);
                                        if (r.roleId !== 'general') {
                                          setSidebarPreviewRole(r.roleId as any);
                                        }
                                      }}
                                      className="p-1.5 rounded-lg bg-indigo-50 hover:bg-indigo-100 text-indigo-600 transition-colors text-xs font-semibold shrink-0"
                                    >
                                      Editar en vista
                                    </button>
                                  </div>
                                );
                              })
                            )
                          )}
                        </div>
                      </div>
                    )
                  ) : (
                    /* Tarjeta Guía y Micro-interacciones */
                    <div className="space-y-4 mb-4">
                      <div className="p-4 rounded-2xl bg-gradient-to-br from-indigo-50/80 to-violet-50/50 border border-indigo-100">
                        <div className="flex items-start gap-3">
                          <div className="p-2 rounded-xl bg-indigo-600 text-white shadow-sm shrink-0 mt-0.5">
                            <RiEditLine className="text-lg" />
                          </div>
                          <div className="space-y-1.5 text-xs text-slate-600">
                            <h5 className="font-bold text-slate-800">
                              Edición Directa en Previsualización
                            </h5>
                            <p className="leading-relaxed">
                              En la tarjeta de <strong>Previsualización en Vivo</strong> a la derecha:
                            </p>
                            <ul className="list-disc pl-4 space-y-1 text-slate-500">
                              <li><strong>Haz clic</strong> en cualquier menú para inspeccionar y editar su texto.</li>
                              <li><strong>Pulsa el lápiz ✏️ o doble clic</strong> para escribir directamente sobre el sidebar.</li>
                              <li>Presiona <kbd className="px-1.5 py-0.5 bg-white border rounded text-[10px] font-mono text-slate-700">Enter</kbd> para guardar o <kbd className="px-1.5 py-0.5 bg-white border rounded text-[10px] font-mono text-slate-700">Esc</kbd> para cancelar.</li>
                            </ul>
                          </div>
                        </div>
                      </div>

                      {/* Resumen del Rol Activo */}
                      <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/70 flex items-center justify-between">
                        <div>
                          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                            Rol Activo en Previsualización
                          </span>
                          <div className="text-xs font-bold text-slate-800 mt-0.5 flex items-center gap-2">
                            <span className="capitalize">{sidebarPreviewRole}</span>
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-indigo-100 text-indigo-700">
                              {getCustomizedCount(sidebarPreviewRole)} personalizados
                            </span>
                          </div>
                        </div>

                        <button
                          type="button"
                          onClick={() => handleResetRoleSidebarLabels(sidebarPreviewRole)}
                          className="px-3 py-1.5 rounded-xl text-xs font-semibold text-slate-600 bg-white hover:bg-rose-50 hover:text-rose-600 border border-slate-200 transition-colors"
                        >
                          Restablecer rol
                        </button>
                      </div>
                    </div>
                  )}

                  {/* Sección Colapsible: Formulario Tradicional */}
                  <div className="pt-2 border-t border-slate-200/80">
                    <button
                      type="button"
                      onClick={() => setShowClassicForm(!showClassicForm)}
                      className="w-full py-2.5 px-3 rounded-xl bg-slate-100 hover:bg-slate-200/70 text-slate-700 text-xs font-bold transition-all flex items-center justify-between"
                    >
                      <div className="flex items-center gap-2">
                        <RiSideBarLine className="text-base text-slate-500" />
                        <span>Ver lista completa en formato formulario</span>
                      </div>
                      <span className="text-slate-500 font-semibold text-[11px]">
                        {showClassicForm ? 'Ocultar ▲' : 'Mostrar ▼'}
                      </span>
                    </button>

                    {showClassicForm && (
                      <div className="mt-4 space-y-6 pt-2">
                        {filteredRoleMetas.map((roleMeta) => (
                          <div key={roleMeta.roleId} className="space-y-4">
                            {sidebarRoleTab === 'all' && (
                              <div className="flex items-center gap-2 pb-2 border-b border-slate-200">
                                <span className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                                  {roleMeta.roleName}
                                </span>
                                <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-slate-100 text-slate-600">
                                  {roleMeta.roleBadge}
                                </span>
                              </div>
                            )}

                            {roleMeta.categories.map((cat) => (
                              <div key={cat.categoryId} className="bg-slate-50/60 p-4 rounded-2xl border border-slate-200/60">
                                <div className="flex items-center justify-between mb-3">
                                  <div className="flex items-center gap-2">
                                    <div className="w-1.5 h-3.5 bg-indigo-500 rounded-full" />
                                    <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700">
                                      {cat.categoryTitle}
                                    </h4>
                                  </div>
                                  <span className="text-[10px] font-medium text-slate-400">
                                    {cat.items.length} {cat.items.length === 1 ? 'campo' : 'campos'}
                                  </span>
                                </div>

                                <div className="space-y-3">
                                  {cat.items.map((item) => {
                                    const currentVal = sidebarLabels[item.key] ?? '';
                                    const isModified = currentVal.trim() !== '' && currentVal !== item.labelOriginal;

                                    return (
                                      <div 
                                        key={item.key} 
                                        className="p-3 bg-white rounded-xl border border-slate-200 hover:border-indigo-200 transition-all shadow-sm"
                                      >
                                        <div className="flex items-start justify-between gap-2 mb-2">
                                          <div className="flex-1 min-w-0">
                                            <div className="flex items-center gap-2 flex-wrap">
                                              <span className="text-xs font-semibold text-slate-800">
                                                {item.labelOriginal}
                                              </span>
                                              {item.route && (
                                                <span 
                                                  className="px-1.5 py-0.5 rounded text-[10px] font-mono bg-slate-100 text-slate-500 border border-slate-200 truncate max-w-[220px]" 
                                                  title={item.route}
                                                >
                                                  {item.route}
                                                </span>
                                              )}
                                              {isModified && (
                                                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800 border border-amber-200">
                                                  Modificado
                                                </span>
                                              )}
                                            </div>
                                            <p className="text-[11px] text-slate-400 mt-0.5">
                                              {item.description}
                                            </p>
                                          </div>

                                          {isModified && (
                                            <button
                                              type="button"
                                              onClick={() => handleResetSingleSidebarLabel(item.key)}
                                              title={`Restablecer a "${item.labelOriginal}"`}
                                              aria-label={`Restablecer texto de ${item.labelOriginal}`}
                                              className="p-1.5 text-slate-400 hover:text-amber-600 hover:bg-amber-50 rounded-lg transition-colors shrink-0"
                                            >
                                              <RiRestartLine className="text-sm" />
                                            </button>
                                          )}
                                        </div>

                                        <div className="relative">
                                          <input
                                            type="text"
                                            value={currentVal}
                                            onChange={(e) => handleSidebarLabelChange(item.key, e.target.value)}
                                            placeholder={item.labelOriginal}
                                            className={`w-full px-3 py-2 rounded-lg text-xs transition-colors focus:outline-none focus:ring-2 focus:ring-indigo-500 min-h-[38px] ${
                                              isModified
                                                ? 'border-indigo-300 bg-indigo-50/20 text-slate-800 font-medium'
                                                : 'border-slate-200 bg-slate-50/40 text-slate-700'
                                            } border`}
                                          />
                                        </div>
                                      </div>
                                    );
                                  })}
                                </div>
                              </div>
                            ))}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}

            {activeSection === 'tarjetas' && (
              <div>
                {/* Cabecera de Estándar / Acordeón */}
                <div className="mb-6 pb-5 border-b border-slate-100">
                  <h3 className="text-sm font-bold text-slate-700 mb-3">Cabecera de Estándar de Aprendizaje</h3>
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">
                    Color del Acordeón (Estándar)
                  </label>
                  <div className="flex gap-2">
                    <input 
                      type="color" 
                      value={colorHeaderEstandar}
                      onChange={(e) => setColorHeaderEstandar(e.target.value)}
                      className="w-12 h-12 border border-slate-200 rounded-xl cursor-pointer p-1 bg-white"
                    />
                    <input 
                      type="text" 
                      value={colorHeaderEstandar}
                      onChange={(e) => setColorHeaderEstandar(e.target.value)}
                      maxLength={7}
                      className="flex-1 px-4 py-2 border border-slate-200 rounded-xl text-slate-700 font-mono text-sm focus:outline-none focus:border-violet-500"
                    />
                  </div>
                </div>

                <h3 className="text-sm font-bold text-slate-700 mb-4">Colores por Materia (Primaria y Secundaria)</h3>
                
                {/* Comunicación */}
                <div className="mb-5">
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">
                    Comunicación (Primaria / Secundaria)
                  </label>
                  <div className="flex gap-2">
                    <input 
                      type="color" 
                      value={colorMateriaComunicacion}
                      onChange={(e) => setColorMateriaComunicacion(e.target.value)}
                      className="w-12 h-12 border border-slate-200 rounded-xl cursor-pointer p-1 bg-white"
                    />
                    <input 
                      type="text" 
                      value={colorMateriaComunicacion}
                      onChange={(e) => setColorMateriaComunicacion(e.target.value)}
                      maxLength={7}
                      className="flex-1 px-4 py-2 border border-slate-200 rounded-xl text-slate-700 font-mono text-sm focus:outline-none focus:border-violet-500"
                    />
                  </div>
                </div>

                {/* Matemática */}
                <div className="mb-5">
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">
                    Matemática (Primaria / Secundaria)
                  </label>
                  <div className="flex gap-2">
                    <input 
                      type="color" 
                      value={colorMateriaMatematica}
                      onChange={(e) => setColorMateriaMatematica(e.target.value)}
                      className="w-12 h-12 border border-slate-200 rounded-xl cursor-pointer p-1 bg-white"
                    />
                    <input 
                      type="text" 
                      value={colorMateriaMatematica}
                      onChange={(e) => setColorMateriaMatematica(e.target.value)}
                      maxLength={7}
                      className="flex-1 px-4 py-2 border border-slate-200 rounded-xl text-slate-700 font-mono text-sm focus:outline-none focus:border-violet-500"
                    />
                  </div>
                </div>

                {/* Ciencia y Tecnología */}
                <div className="mb-5">
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">
                    Ciencia y Tecnología (Primaria / Secundaria)
                  </label>
                  <div className="flex gap-2">
                    <input 
                      type="color" 
                      value={colorMateriaCiencia}
                      onChange={(e) => setColorMateriaCiencia(e.target.value)}
                      className="w-12 h-12 border border-slate-200 rounded-xl cursor-pointer p-1 bg-white"
                    />
                    <input 
                      type="text" 
                      value={colorMateriaCiencia}
                      onChange={(e) => setColorMateriaCiencia(e.target.value)}
                      maxLength={7}
                      className="flex-1 px-4 py-2 border border-slate-200 rounded-xl text-slate-700 font-mono text-sm focus:outline-none focus:border-violet-500"
                    />
                  </div>
                </div>

                {/* Personal Social / Ciencias Sociales */}
                <div className="mb-5">
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">
                    Personal Social / Ciencias Sociales
                  </label>
                  <div className="flex gap-2">
                    <input 
                      type="color" 
                      value={colorMateriaSociales}
                      onChange={(e) => setColorMateriaSociales(e.target.value)}
                      className="w-12 h-12 border border-slate-200 rounded-xl cursor-pointer p-1 bg-white"
                    />
                    <input 
                      type="text" 
                      value={colorMateriaSociales}
                      onChange={(e) => setColorMateriaSociales(e.target.value)}
                      maxLength={7}
                      className="flex-1 px-4 py-2 border border-slate-200 rounded-xl text-slate-700 font-mono text-sm focus:outline-none focus:border-violet-500"
                    />
                  </div>
                </div>

                {/* DPCC */}
                <div className="mb-5">
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">
                    DPCC (Secundaria)
                  </label>
                  <div className="flex gap-2">
                    <input 
                      type="color" 
                      value={colorMateriaDpcc}
                      onChange={(e) => setColorMateriaDpcc(e.target.value)}
                      className="w-12 h-12 border border-slate-200 rounded-xl cursor-pointer p-1 bg-white"
                    />
                    <input 
                      type="text" 
                      value={colorMateriaDpcc}
                      onChange={(e) => setColorMateriaDpcc(e.target.value)}
                      maxLength={7}
                      className="flex-1 px-4 py-2 border border-slate-200 rounded-xl text-slate-700 font-mono text-sm focus:outline-none focus:border-violet-500"
                    />
                  </div>
                </div>

                {/* Otras Materias / Escribe */}
                <div className="mb-5">
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">
                    Otras Materias / Escribe
                  </label>
                  <div className="flex gap-2">
                    <input 
                      type="color" 
                      value={colorTercero}
                      onChange={(e) => setColorTercero(e.target.value)}
                      className="w-12 h-12 border border-slate-200 rounded-xl cursor-pointer p-1 bg-white"
                    />
                    <input 
                      type="text" 
                      value={colorTercero}
                      onChange={(e) => setColorTercero(e.target.value)}
                      maxLength={7}
                      className="flex-1 px-4 py-2 border border-slate-200 rounded-xl text-slate-700 font-mono text-sm focus:outline-none focus:border-violet-500"
                    />
                  </div>
                </div>
              </div>
            )}

            {activeSection === 'acciones' && (
              <div>
                <h3 className="text-sm font-bold text-slate-700 mb-1">Permisos de Exportaciones en Reportes</h3>
                <p className="text-xs text-slate-500 mb-5">
                  Configura globalmente qué opciones de descarga e impresión pueden utilizar los roles de Director y Especialista en sus vistas de reportes.
                </p>

                {/* Acciones para el Director */}
                <div className="mb-6 p-4 bg-slate-50 border border-slate-200 rounded-2xl">
                  <h4 className="text-xs font-extrabold text-violet-700 uppercase tracking-wider mb-3 flex items-center gap-2">
                    <span>Acciones en Reporte de Director</span>
                  </h4>
                  
                  <label className="flex items-center gap-3 py-2 cursor-pointer border-b border-slate-200/60 last:border-0">
                    <input
                      type="checkbox"
                      checked={accionesDirector.exportarGrillaPdf}
                      onChange={(e) => setAccionesDirector(prev => ({ ...prev, exportarGrillaPdf: e.target.checked }))}
                      className="w-4 h-4 text-violet-600 rounded focus:ring-violet-500"
                    />
                    <div>
                      <span className="block text-sm font-bold text-slate-700">Exportar Grilla PDF</span>
                      <span className="block text-xs text-slate-500">Reporte tabular con grilla de resultados por estudiante</span>
                    </div>
                  </label>

                  <label className="flex items-center gap-3 py-2 cursor-pointer border-b border-slate-200/60 last:border-0">
                    <input
                      type="checkbox"
                      checked={accionesDirector.exportarExcel}
                      onChange={(e) => setAccionesDirector(prev => ({ ...prev, exportarExcel: e.target.checked }))}
                      className="w-4 h-4 text-violet-600 rounded focus:ring-violet-500"
                    />
                    <div>
                      <span className="block text-sm font-bold text-slate-700">Exportar a Excel</span>
                      <span className="block text-xs text-slate-500">Descarga de datos crudos filtrados para análisis</span>
                    </div>
                  </label>

                  <label className="flex items-center gap-3 py-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={accionesDirector.generarPdfPreguntas}
                      onChange={(e) => setAccionesDirector(prev => ({ ...prev, generarPdfPreguntas: e.target.checked }))}
                      className="w-4 h-4 text-violet-600 rounded focus:ring-violet-500"
                    />
                    <div>
                      <span className="block text-sm font-bold text-slate-700">Generar PDF Preguntas</span>
                      <span className="block text-xs text-slate-500">Reporte gráfico detallado por cada pregunta del examen</span>
                    </div>
                  </label>
                </div>

                {/* Acciones para el Especialista */}
                <div className="mb-4 p-4 bg-slate-50 border border-slate-200 rounded-2xl">
                  <h4 className="text-xs font-extrabold text-blue-700 uppercase tracking-wider mb-3 flex items-center gap-2">
                    <span>Acciones en Reporte de Especialista</span>
                  </h4>

                  <label className="flex items-center gap-3 py-2 cursor-pointer border-b border-slate-200/60 last:border-0">
                    <input
                      type="checkbox"
                      checked={accionesEspecialista.exportarEstudiantes}
                      onChange={(e) => setAccionesEspecialista(prev => ({ ...prev, exportarEstudiantes: e.target.checked }))}
                      className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
                    />
                    <div>
                      <span className="block text-sm font-bold text-slate-700">Exportar Estudiantes</span>
                      <span className="block text-xs text-slate-500">Descarga del padrón detallado de estudiantes</span>
                    </div>
                  </label>

                  <label className="flex items-center gap-3 py-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={accionesEspecialista.exportarExcel}
                      onChange={(e) => setAccionesEspecialista(prev => ({ ...prev, exportarExcel: e.target.checked }))}
                      className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
                    />
                    <div>
                      <span className="block text-sm font-bold text-slate-700">Exportar Excel</span>
                      <span className="block text-xs text-slate-500">Descarga del reporte consolidado general en Excel</span>
                    </div>
                  </label>
                </div>

                {/* Acciones para el Docente */}
                <div className="mb-4 p-4 bg-slate-50 border border-slate-200 rounded-2xl">
                  <h4 className="text-xs font-extrabold text-emerald-700 uppercase tracking-wider mb-3 flex items-center gap-2">
                    <span>Acciones en Reporte de Docente</span>
                  </h4>

                  <label className="flex items-center gap-3 py-2 cursor-pointer border-b border-slate-200/60 last:border-0">
                    <input
                      type="checkbox"
                      checked={accionesDocente.exportarGrillaPdf}
                      onChange={(e) => setAccionesDocente(prev => ({ ...prev, exportarGrillaPdf: e.target.checked }))}
                      className="w-4 h-4 text-emerald-600 rounded focus:ring-emerald-500"
                    />
                    <div>
                      <span className="block text-sm font-bold text-slate-700">Exportar Grilla PDF</span>
                      <span className="block text-xs text-slate-500">Reporte tabular con grilla de resultados por estudiante</span>
                    </div>
                  </label>

                  <label className="flex items-center gap-3 py-2 cursor-pointer border-b border-slate-200/60 last:border-0">
                    <input
                      type="checkbox"
                      checked={accionesDocente.exportarExcel}
                      onChange={(e) => setAccionesDocente(prev => ({ ...prev, exportarExcel: e.target.checked }))}
                      className="w-4 h-4 text-emerald-600 rounded focus:ring-emerald-500"
                    />
                    <div>
                      <span className="block text-sm font-bold text-slate-700">Exportar a Excel</span>
                      <span className="block text-xs text-slate-500">Descarga de datos crudos filtrados de la sección</span>
                    </div>
                  </label>

                  <label className="flex items-center gap-3 py-2 cursor-pointer border-b border-slate-200/60 last:border-0">
                    <input
                      type="checkbox"
                      checked={accionesDocente.generarPdfPreguntas}
                      onChange={(e) => setAccionesDocente(prev => ({ ...prev, generarPdfPreguntas: e.target.checked }))}
                      className="w-4 h-4 text-emerald-600 rounded focus:ring-emerald-500"
                    />
                    <div>
                      <span className="block text-sm font-bold text-slate-700">Generar PDF Preguntas</span>
                      <span className="block text-xs text-slate-500">Reporte gráfico detallado por cada pregunta del examen</span>
                    </div>
                  </label>

                  <label className="flex items-center gap-3 py-2.5 px-3 cursor-pointer bg-amber-50/60 rounded-xl border border-amber-200/80 mt-2 hover:bg-amber-50 transition-colors">
                    <input
                      type="checkbox"
                      checked={Boolean(accionesDocente.actualizarRespuestas)}
                      onChange={(e) => setAccionesDocente(prev => ({ ...prev, actualizarRespuestas: e.target.checked }))}
                      className="w-4 h-4 text-amber-600 rounded focus:ring-amber-500 mt-0.5"
                    />
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <span className="block text-sm font-bold text-slate-800">Actualizar Respuestas de Estudiantes</span>
                        {accionesDocente.actualizarRespuestas ? (
                          <span className="px-2 py-0.5 text-[10px] font-bold text-emerald-700 bg-emerald-100 rounded-full border border-emerald-300">
                            HABILITADO
                          </span>
                        ) : (
                          <span className="px-2 py-0.5 text-[10px] font-bold text-slate-500 bg-slate-100 rounded-full border border-slate-200">
                            BLOQUEADO
                          </span>
                        )}
                      </div>
                      <span className="block text-xs text-slate-600 mt-0.5 leading-relaxed">
                        Permite a los docentes hacer clic sobre el nombre del estudiante para rectificar y guardar respuestas (funciona incluso en evaluaciones cerradas). Si está apagado, la edición queda 100% bloqueada.
                      </span>
                    </div>
                  </label>
                </div>
              </div>
            )}
          </div>

          <div className="border-t border-slate-100 pt-6 mt-6 flex gap-3">
            <button
              onClick={handleReset}
              className="px-4 py-3 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-600 font-semibold text-sm transition-all flex items-center justify-center gap-2 active:scale-95"
            >
              <RiRefreshLine /> Restablecer
            </button>
            <button
              onClick={handleSave}
              disabled={saving}
              className="flex-1 px-4 py-3 rounded-xl bg-violet-600 hover:bg-violet-700 disabled:bg-violet-400 text-white font-semibold text-sm transition-all flex items-center justify-center gap-2 shadow-lg shadow-violet-600/20 active:scale-95"
            >
              {saving ? (
                <>
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                  Guardando...
                </>
              ) : (
                <>
                  <RiSave2Line /> Guardar Branding
                </>
              )}
            </button>
          </div>
        </div>

        {/* Panel de Previsualización en Vivo */}
        <div className={`${
          activeSection === 'sidebar' ? 'lg:col-span-8 xl:col-span-8 2xl:col-span-9' : 'lg:col-span-7'
        } bg-slate-50 p-6 rounded-3xl border border-slate-200/60 shadow-inner flex flex-col lg:sticky lg:top-6 self-start max-h-[calc(100vh-3rem)] overflow-y-auto scrollbar-thin`}>
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <RiLayout4Line className="text-slate-400 text-lg" />
              <h3 className="text-sm font-bold text-slate-500 uppercase tracking-wider">
                Previsualización en Vivo
              </h3>
            </div>
          </div>

          {/* Canvas de Previsualización */}
          <div 
            className="flex-1 min-h-[460px] border border-slate-200 rounded-2xl overflow-hidden flex flex-col shadow-sm transition-all"
            style={{ 
              backgroundColor: 
                activeSection === 'general'
                  ? colorSecundario
                  : activeSection === 'sidebar'
                    ? '#0f172a'
                    : activeSection === 'login' 
                      ? colorLoginBackground 
                      : '#f8fafc' 
            }}
          >
            {activeSection === 'general' && (
              /* VISTA 1: PANEL ADMIN GENERAL */
              <>
                {/* Header simulado */}
                <div 
                  className="px-6 py-4 flex items-center justify-between border-b border-white/10"
                  style={{ backgroundColor: colorPrincipal }}
                >
                  <div className="flex items-center gap-2 text-white">
                    <div className="w-8 h-8 rounded bg-white/20 flex items-center justify-center font-bold">L</div>
                    <span className="font-extrabold text-sm tracking-wide uppercase">LOGO INSTITUCIÓN</span>
                  </div>
                  <div className="flex gap-3 text-white/80 text-xs">
                    <span>Inicio</span>
                    <span>Reportes</span>
                    <span className="underline font-semibold text-white">Configuración</span>
                  </div>
                </div>

                {/* Contenido simulado */}
                <div className="flex-1 p-8 flex gap-6">
                  {/* Sidebar simulado */}
                  <div 
                     className="w-44 rounded-xl p-4 flex flex-col gap-2 border"
                     style={{ 
                       background: `linear-gradient(160deg, ${colorSidebarBackground} 0%, color-mix(in srgb, ${colorSidebarBackground} 75%, #000000) 100%)`,
                       borderColor: `color-mix(in srgb, ${colorSidebarBackground} 120%, #2d4260)`
                     }}
                  >
                    <div className="text-white/50 text-[10px] font-bold uppercase tracking-wider mb-2">Menú</div>
                    <div 
                      className="px-3 py-2 rounded-lg text-xs font-semibold border transition-all"
                      style={{ 
                        backgroundColor: `color-mix(in srgb, ${colorSidebarAccent} 8%, transparent)`,
                        borderColor: colorSidebarAccent,
                        color: '#ffffff'
                      }}
                    >
                      Dashboard
                    </div>
                    <div className="px-3 py-2 rounded-lg text-white/50 hover:bg-white/10 text-xs transition-colors">
                      Usuarios
                    </div>
                    <div className="px-3 py-2 rounded-lg text-white/80 hover:bg-white/10 text-xs transition-colors">
                      Evaluaciones
                    </div>
                  </div>

                  {/* Contenedor central simulado */}
                  <div className="flex-1 bg-white p-6 rounded-xl border border-slate-100 flex flex-col justify-between shadow-sm">
                    <div>
                      <h4 className="text-slate-800 font-extrabold text-base mb-1">
                        Panel de Administración
                      </h4>
                      <p className="text-slate-400 text-[11px] mb-4">
                        Este es un ejemplo de cómo se visualiza el contraste de tus colores elegidos.
                      </p>

                      <div className="flex gap-2 mb-4">
                        <span 
                          className="px-2 py-1 rounded text-[10px] font-bold text-white uppercase"
                          style={{ backgroundColor: colorSecundario }}
                        >
                          Rol Administrador
                        </span>
                        <span 
                          className="px-2 py-1 rounded text-[10px] font-bold text-slate-700 bg-slate-100 uppercase"
                        >
                          Modo Activo
                        </span>
                      </div>
                    </div>

                    <div className="flex gap-2">
                      <button 
                        className="flex-1 px-4 py-2 rounded-lg text-white text-xs font-semibold transition-all hover:brightness-110 active:scale-[0.98]"
                        style={{ backgroundColor: colorTercero }}
                      >
                        Botón Destacado
                      </button>
                      <button 
                        className="px-4 py-2 rounded-lg border border-slate-200 text-slate-600 text-xs font-semibold bg-white hover:bg-slate-50 transition-colors"
                      >
                        Cancelar
                      </button>
                    </div>
                  </div>
                </div>
              </>
            )}

            {activeSection === 'sidebar' && (
              /* VISTA DEDICADA: PREVISUALIZACIÓN INTERACTIVA MULTI-ROL DEL SIDEBAR */
              <div className="flex-1 flex flex-col bg-slate-900 overflow-hidden text-white min-h-[650px]">
                {/* Cabecera del Preview con Selector de Rol */}
                <div className="px-5 py-3.5 bg-slate-950/90 border-b border-white/10 flex flex-wrap items-center justify-between gap-3">
                  <div className="flex items-center gap-2.5">
                    <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse shadow-sm shadow-emerald-400/50" />
                    <div>
                      <span className="text-xs font-bold uppercase tracking-wider text-slate-200 block">
                        Previsualización Interactiva
                      </span>
                      <span className="text-[10px] text-slate-400">
                        Haz clic o pulsa ✏️ en el menú para editar directamente
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    {/* Botón para agregar menú/submenú personalizado */}
                    <button
                      type="button"
                      onClick={() => {
                        setCustomItemToEdit(null);
                        setIsModalCreateMenuOpen(true);
                      }}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold shadow-md shadow-indigo-600/30 transition-all active:scale-95 shrink-0"
                      title="Agregar un nuevo menú o submenú a la plataforma"
                    >
                      <RiAddLine className="text-sm" />
                      <span>+ Nuevo Menú</span>
                    </button>

                    {/* Switcher de Roles */}
                    <div className="flex items-center bg-slate-800/90 p-1 rounded-xl border border-slate-700/60 gap-1 text-xs">
                      {[
                        { id: 'admin', label: 'Admin', icon: RiShieldUserLine, count: getCustomizedCount('admin') },
                        { id: 'director', label: 'Director', icon: RiBuilding4Line, count: getCustomizedCount('director') },
                        { id: 'docente', label: 'Docente', icon: RiUserStarLine, count: getCustomizedCount('docente') },
                        { id: 'especialista', label: 'Especialista', icon: RiTeamLine, count: getCustomizedCount('especialista') },
                      ].map((r) => {
                        const Icon = r.icon;
                        const isActive = sidebarPreviewRole === r.id;
                        return (
                          <button
                            key={r.id}
                            type="button"
                            onClick={() => {
                              setSidebarPreviewRole(r.id as any);
                              setSidebarRoleTab(r.id as any);
                            }}
                            className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-semibold transition-all ${
                              isActive
                                ? 'bg-indigo-600 text-white shadow-sm shadow-indigo-600/30'
                                : 'text-slate-400 hover:text-white hover:bg-slate-700/50'
                            }`}
                          >
                            <Icon className="text-xs" />
                            <span>{r.label}</span>
                            {r.count > 0 && (
                              <span className={`px-1.5 py-0.2 rounded-full text-[9px] font-bold ${
                                isActive ? 'bg-white/20 text-white' : 'bg-amber-400/20 text-amber-300'
                              }`}>
                                {r.count}
                              </span>
                            )}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                </div>

                {/* Área de Visualización: Mock Sidebar + Panel Inspector */}
                <div className="flex-1 p-5 lg:p-6 flex flex-col xl:flex-row gap-6 items-start overflow-visible">
                  {/* Mock Sidebar Interactivo */}
                  <div 
                    className="w-full xl:w-80 shrink-0 rounded-2xl p-4 flex flex-col gap-2.5 border shadow-2xl transition-all self-start relative overflow-hidden"
                    style={{ 
                      background: `linear-gradient(175deg, ${colorSidebarBackground} 0%, color-mix(in srgb, ${colorSidebarBackground} 88%, #000000) 45%, color-mix(in srgb, ${colorSidebarBackground} 65%, #000000) 100%)`,
                      borderColor: `color-mix(in srgb, ${colorSidebarBackground} 125%, #334155)`
                    }}
                  >
                    {/* Capa de Resplandor Ambiental y Focos de Profundidad (Ambient Glow) */}
                    <div 
                      className="absolute inset-0 pointer-events-none z-[1]"
                      style={{
                        background: `
                          radial-gradient(ellipse 120% 240px at 50% -40px, rgba(255, 255, 255, 0.08) 0%, rgba(255, 255, 255, 0.02) 50%, transparent 80%),
                          radial-gradient(circle 240px at 100% 16%, rgba(191, 219, 254, 0.08) 0%, transparent 70%),
                          radial-gradient(circle 300px at 0% 90%, rgba(147, 197, 253, 0.06) 0%, transparent 75%)
                        `
                      }}
                    />

                    {/* Capa de textura de grano / ruido fotográfico */}
                    <div 
                      className="absolute inset-0 pointer-events-none opacity-[0.055] mix-blend-overlay z-[2]"
                      style={{
                        backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 250 250' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E")`,
                        backgroundSize: '180px 180px',
                        backgroundRepeat: 'repeat'
                      }}
                    />

                    {/* Header del Sidebar */}
                    <div className="pb-3 mb-1 border-b border-white/10 flex items-center gap-2.5 relative z-[2]">
                      <div 
                        className="w-8 h-8 rounded-lg flex items-center justify-center font-bold text-xs shadow-inner shrink-0"
                        style={{ backgroundColor: colorSidebarAccent, color: '#0f172a' }}
                      >
                        EVA
                      </div>
                      <div className="flex-1 min-w-0">
                        {editingKey === 'sidebar_tituloSistema' ? (
                          <div className="flex items-center gap-1">
                            <input
                              type="text"
                              autoFocus
                              value={editingText}
                              onChange={(e) => setEditingText(e.target.value)}
                              onKeyDown={(e) => {
                                if (e.key === 'Enter') handleCommitInlineEdit('sidebar_tituloSistema');
                                if (e.key === 'Escape') handleCancelInlineEdit();
                              }}
                              className="bg-black/60 text-white font-extrabold text-xs px-1.5 py-0.5 rounded border border-white/30 outline-none w-full"
                            />
                            <button
                              type="button"
                              onClick={() => handleCommitInlineEdit('sidebar_tituloSistema')}
                              className="p-1 rounded bg-emerald-500 text-white text-xs shrink-0"
                            >
                              <RiCheckLine />
                            </button>
                          </div>
                        ) : (
                          <div 
                            onClick={() => handleSelectItem('sidebar_tituloSistema')}
                            onDoubleClick={() => handleStartInlineEdit('sidebar_tituloSistema')}
                            className={`group flex items-center justify-between font-extrabold text-xs tracking-wider uppercase truncate cursor-pointer rounded px-1.5 py-0.5 transition-all ${
                              selectedSidebarKey === 'sidebar_tituloSistema'
                                ? 'bg-white/15 text-white ring-1 ring-white/30'
                                : 'text-white hover:bg-white/10'
                            }`}
                          >
                            <span className="truncate">{sidebarLabels.sidebar_tituloSistema || 'Competence-Lab'}</span>
                            <RiEditLine className="text-xs opacity-0 group-hover:opacity-100 ml-1 shrink-0" />
                          </div>
                        )}

                        {editingKey === 'sidebar_subtituloPrefix' ? (
                          <div className="flex items-center gap-1 mt-0.5">
                            <input
                              type="text"
                              autoFocus
                              value={editingText}
                              onChange={(e) => setEditingText(e.target.value)}
                              onKeyDown={(e) => {
                                if (e.key === 'Enter') handleCommitInlineEdit('sidebar_subtituloPrefix');
                                if (e.key === 'Escape') handleCancelInlineEdit();
                              }}
                              className="bg-black/60 text-white font-medium text-[10px] px-1.5 py-0.5 rounded border border-white/30 outline-none w-full"
                            />
                            <button
                              type="button"
                              onClick={() => handleCommitInlineEdit('sidebar_subtituloPrefix')}
                              className="p-1 rounded bg-emerald-500 text-white text-xs shrink-0"
                            >
                              <RiCheckLine />
                            </button>
                          </div>
                        ) : (
                          <div 
                            onClick={() => handleSelectItem('sidebar_subtituloPrefix')}
                            onDoubleClick={() => handleStartInlineEdit('sidebar_subtituloPrefix')}
                            className={`group flex items-center justify-between text-[10px] uppercase tracking-widest truncate font-medium cursor-pointer rounded px-1.5 py-0.5 transition-all ${
                              selectedSidebarKey === 'sidebar_subtituloPrefix'
                                ? 'bg-white/15 text-white/90 ring-1 ring-white/30'
                                : 'text-white/60 hover:text-white hover:bg-white/10'
                            }`}
                          >
                            <span className="truncate">{(sidebarLabels.sidebar_subtituloPrefix || 'ugel') + ' SAN IGNACIO'}</span>
                            <RiEditLine className="text-xs opacity-0 group-hover:opacity-100 ml-1 shrink-0" />
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Sección Principal */}
                    <div 
                      onClick={() => handleSelectItem('sidebar_seccionPrincipal')}
                      onDoubleClick={() => handleStartInlineEdit('sidebar_seccionPrincipal')}
                      className={`group flex items-center justify-between text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded cursor-pointer transition-all relative z-[2] ${
                        selectedSidebarKey === 'sidebar_seccionPrincipal'
                          ? 'bg-white/15 text-white ring-1 ring-white/30'
                          : 'text-white/40 hover:text-white/70 hover:bg-white/5'
                      }`}
                    >
                      <span className="truncate">{sidebarLabels.sidebar_seccionPrincipal || 'PRINCIPAL'}</span>
                      <RiEditLine className="text-xs opacity-0 group-hover:opacity-100 shrink-0" />
                    </div>

                    {/* Menús según el Rol Seleccionado */}
                    <div className="flex-1 space-y-1 overflow-y-auto max-h-[460px] pr-1 relative z-[2]">
                      {/* === ROL ADMIN === */}
                      {sidebarPreviewRole === 'admin' && (
                        <>
                          {renderMockItem('admin_miCuenta', 'Mi cuenta', { icon: <MdAccountCircle /> })}
                          {renderMockItem('admin_gestionUsuarios', 'Gestión de Usuarios', { icon: <MdPeople /> })}
                          {renderMockItem('admin_configuracion', 'Configuración', { icon: <MdSettings /> })}

                          {/* Sección Gestión */}
                          <div 
                            onClick={() => handleSelectItem('sidebar_seccionGestion')}
                            onDoubleClick={() => handleStartInlineEdit('sidebar_seccionGestion')}
                            className={`group flex items-center justify-between text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded cursor-pointer transition-all mt-2 ${
                              selectedSidebarKey === 'sidebar_seccionGestion'
                                ? 'bg-white/15 text-white ring-1 ring-white/30'
                                : 'text-white/40 hover:text-white/70 hover:bg-white/5'
                            }`}
                          >
                            <span className="truncate">{sidebarLabels.sidebar_seccionGestion || 'GESTIÓN'}</span>
                            <RiEditLine className="text-xs opacity-0 group-hover:opacity-100 shrink-0" />
                          </div>

                          {renderMockItem('admin_pizarra', 'Pizarra', { icon: <MdAssignment /> })}
                          {renderMockItem('admin_matrizCostos', 'Matriz de Costos', { icon: <MdAttachMoney /> })}

                          {/* Desplegable Perfiles */}
                          {renderMockItem('admin_perfiles', 'Perfiles', {
                            icon: <FaUsers />,
                            isDropdownHeader: true,
                            dropdownId: 'perfiles'
                          })}

                          {openPreviewDropdowns.perfiles && (
                            <div className="space-y-1">
                              {/* Sub-desplegable Especialista Regional */}
                              {renderMockItem('admin_especialistaRegional', 'Especialista Regional', {
                                isSubitem: true,
                                isDropdownHeader: true,
                                dropdownId: 'especialistas-regional'
                              })}
                              {openPreviewDropdowns['especialistas-regional'] && (
                                <div className="space-y-1">
                                  {renderMockItem('admin_especialistaRegional_crearUsuario', 'Crear usuario', {
                                    isSubitem: true,
                                    subitemLevel: 2
                                  })}
                                </div>
                              )}

                              {/* Sub-desplegable Especialistas */}
                              {renderMockItem('admin_especialistas', 'Especialistas', {
                                isSubitem: true,
                                isDropdownHeader: true,
                                dropdownId: 'especialistas'
                              })}
                              {openPreviewDropdowns.especialistas && (
                                <div className="space-y-1">
                                  {renderMockItem('admin_especialistas_crearUsuario', 'Crear usuario', { isSubitem: true, subitemLevel: 2 })}
                                  {renderMockItem('admin_especialistas_seguimiento', 'Seguimiento y retroalimentacion', { isSubitem: true, subitemLevel: 2 })}
                                  {renderMockItem('admin_especialistas_cobertura', 'Cobertura curricular', { isSubitem: true, subitemLevel: 2 })}
                                  {renderMockItem('admin_especialistas_autorreporte', 'Autorreporte', { isSubitem: true, subitemLevel: 2 })}
                                  {renderMockCustomItems('admin_especialistas', true)}
                                </div>
                              )}

                              {/* Sub-desplegable Directores */}
                              {renderMockItem('admin_directores', 'Directores', {
                                isSubitem: true,
                                isDropdownHeader: true,
                                dropdownId: 'directores'
                              })}
                              {openPreviewDropdowns.directores && (
                                <div className="space-y-1">
                                  {renderMockItem('admin_directores_crearUsuario', 'Crear usuario', { isSubitem: true, subitemLevel: 2 })}
                                  {renderMockItem('admin_directores_seguimiento', 'Seguimiento y retroalimentacion', { isSubitem: true, subitemLevel: 2 })}
                                  {renderMockItem('admin_directores_cobertura', 'Cobertura curricular', { isSubitem: true, subitemLevel: 2 })}
                                  {renderMockItem('admin_directores_autorreporte', 'Autorreporte', { isSubitem: true, subitemLevel: 2 })}
                                  {renderMockCustomItems('admin_directores', true)}
                                </div>
                              )}

                              {/* Sub-desplegable Docentes */}
                              {renderMockItem('admin_docentes', 'Docentes', {
                                isSubitem: true,
                                isDropdownHeader: true,
                                dropdownId: 'docentes'
                              })}
                              {openPreviewDropdowns.docentes && (
                                <div className="space-y-1">
                                  {renderMockItem('admin_docentes_usuarios', 'Usuarios', { isSubitem: true, subitemLevel: 2 })}
                                  {renderMockItem('admin_docentes_seguimiento', 'Seguimiento y retroalimentacion', { isSubitem: true, subitemLevel: 2 })}
                                  {renderMockItem('admin_docentes_cobertura', 'Cobertura curricular', { isSubitem: true, subitemLevel: 2 })}
                                  {renderMockItem('admin_docentes_autorreporte', 'Autorreporte', { isSubitem: true, subitemLevel: 2 })}
                                  {renderMockCustomItems('admin_docentes', true)}
                                </div>
                              )}

                              {/* Sub-desplegable Estudiantes */}
                              {renderMockItem('admin_estudiantes', 'Estudiantes', {
                                isSubitem: true,
                                isDropdownHeader: true,
                                dropdownId: 'estudiantes'
                              })}
                              {openPreviewDropdowns.estudiantes && (
                                <div className="space-y-1">
                                  {renderMockItem('admin_estudiantes_seguimiento', 'Seguimiento de Aprendizaje', { isSubitem: true, subitemLevel: 2 })}
                                  {renderMockItem('admin_estudiantes_matriz', 'Matriz de Resultados', { isSubitem: true, subitemLevel: 2 })}
                                  {renderMockCustomItems('admin_estudiantes', true)}
                                </div>
                              )}

                              {/* Menús personalizados dentro de Perfiles */}
                              {renderMockCustomItems('admin_perfiles', true)}
                            </div>
                          )}

                          {/* Menús de nivel superior personalizados para Admin */}
                          {renderMockCustomItems(undefined, false)}
                        </>
                      )}

                      {/* === ROL DIRECTOR === */}
                      {sidebarPreviewRole === 'director' && (
                        <>
                          {renderMockItem('director_miCuenta', 'Mi cuenta', { icon: <MdAccountCircle /> })}

                          {/* Sección Gestión */}
                          <div 
                            onClick={() => handleSelectItem('sidebar_seccionGestion')}
                            onDoubleClick={() => handleStartInlineEdit('sidebar_seccionGestion')}
                            className={`group flex items-center justify-between text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded cursor-pointer transition-all mt-2 ${
                              selectedSidebarKey === 'sidebar_seccionGestion'
                                ? 'bg-white/15 text-white ring-1 ring-white/30'
                                : 'text-white/40 hover:text-white/70 hover:bg-white/5'
                            }`}
                          >
                            <span className="truncate">{sidebarLabels.sidebar_seccionGestion || 'GESTIÓN'}</span>
                            <RiEditLine className="text-xs opacity-0 group-hover:opacity-100 shrink-0" />
                          </div>

                          {/* Dropdown Estudiantes */}
                          {renderMockItem('director_estudiantes', 'Estudiantes', {
                            icon: <FaUserGraduate />,
                            isDropdownHeader: true,
                            dropdownId: 'estudiantes'
                          })}
                          {openPreviewDropdowns.estudiantes && (
                            <div className="space-y-1">
                              {renderMockItem('director_estudiantes_seguimiento', 'Seguimiento de aprendizaje', { isSubitem: true })}
                              {renderMockCustomItems('director_estudiantes', true)}
                            </div>
                          )}

                          {/* Dropdown Docentes */}
                          {renderMockItem('director_docentes', 'Docentes', {
                            icon: <FaUserTie />,
                            isDropdownHeader: true,
                            dropdownId: 'docentes'
                          })}
                          {openPreviewDropdowns.docentes && (
                            <div className="space-y-1">
                              {renderMockItem('director_docentes_mediacion', 'Mediación didáctica', { isSubitem: true })}
                              {renderMockItem('director_docentes_crearUsuario', 'Crear usuario', { isSubitem: true })}
                              {renderMockItem('director_docentes_cobertura', 'Cobertura curricular', { isSubitem: true })}
                              {renderMockItem('director_docentes_reporte', 'Reporte', { isSubitem: true })}
                              {renderMockCustomItems('director_docentes', true)}
                            </div>
                          )}

                          {renderMockItem('director_autorreporte', 'Autorreporte', { icon: <LuListTodo /> })}
                          {renderMockCustomItems('director_autorreporte', true)}

                          {/* Menús de nivel superior personalizados para Director */}
                          {renderMockCustomItems(undefined, false)}
                        </>
                      )}

                      {/* === ROL DOCENTE === */}
                      {sidebarPreviewRole === 'docente' && (
                        <>
                          {renderMockItem('docente_miCuenta', 'Mi cuenta', { icon: <MdAccountCircle /> })}

                          {/* Sección Gestión */}
                          <div 
                            onClick={() => handleSelectItem('sidebar_seccionGestion')}
                            onDoubleClick={() => handleStartInlineEdit('sidebar_seccionGestion')}
                            className={`group flex items-center justify-between text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded cursor-pointer transition-all mt-2 ${
                              selectedSidebarKey === 'sidebar_seccionGestion'
                                ? 'bg-white/15 text-white ring-1 ring-white/30'
                                : 'text-white/40 hover:text-white/70 hover:bg-white/5'
                            }`}
                          >
                            <span className="truncate">{sidebarLabels.sidebar_seccionGestion || 'GESTIÓN'}</span>
                            <RiEditLine className="text-xs opacity-0 group-hover:opacity-100 shrink-0" />
                          </div>

                          {renderMockItem('docente_seguimiento', 'Seguimiento de aprendizajes', { icon: <MdAssignment /> })}
                          {renderMockCustomItems('docente_seguimiento', true)}

                          {renderMockItem('docente_estudiantes', 'Mis Estudiantes', { icon: <FaUserGraduate /> })}
                          {renderMockCustomItems('docente_estudiantes', true)}

                          {renderMockItem('docente_autorreporte', 'Autorreporte', { icon: <LuListTodo /> })}
                          {renderMockCustomItems('docente_autorreporte', true)}

                          {/* Menús de nivel superior personalizados para Docente */}
                          {renderMockCustomItems(undefined, false)}
                        </>
                      )}

                      {/* === ROL ESPECIALISTA === */}
                      {sidebarPreviewRole === 'especialista' && (
                        <>
                          {renderMockItem('especialista_miCuenta', 'Mi cuenta', { icon: <MdAccountCircle /> })}

                          {/* Sección Gestión */}
                          <div 
                            onClick={() => handleSelectItem('sidebar_seccionGestion')}
                            onDoubleClick={() => handleStartInlineEdit('sidebar_seccionGestion')}
                            className={`group flex items-center justify-between text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded cursor-pointer transition-all mt-2 ${
                              selectedSidebarKey === 'sidebar_seccionGestion'
                                ? 'bg-white/15 text-white ring-1 ring-white/30'
                                : 'text-white/40 hover:text-white/70 hover:bg-white/5'
                            }`}
                          >
                            <span className="truncate">{sidebarLabels.sidebar_seccionGestion || 'GESTIÓN'}</span>
                            <RiEditLine className="text-xs opacity-0 group-hover:opacity-100 shrink-0" />
                          </div>

                          {/* Dropdown Directivos */}
                          {renderMockItem('especialista_directivos', 'Directivos', {
                            icon: <FaUsers />,
                            isDropdownHeader: true,
                            dropdownId: 'directivos'
                          })}
                          {openPreviewDropdowns.directivos && (
                            <div className="space-y-1">
                              {renderMockItem('especialista_directivos_seguimiento', 'Seguimiento y retroalimentación', { isSubitem: true })}
                              {renderMockItem('especialista_directivos_cobertura', 'Cobertura curricular', { isSubitem: true })}
                              {renderMockItem('especialista_directivos_crear', 'Crear directivo', { isSubitem: true })}
                              {renderMockCustomItems('especialista_directivos', true)}
                            </div>
                          )}

                          {/* Dropdown Docentes */}
                          {renderMockItem('especialista_docentes', 'Docentes', {
                            icon: <FaUserTie />,
                            isDropdownHeader: true,
                            dropdownId: 'docentes'
                          })}
                          {openPreviewDropdowns.docentes && (
                            <div className="space-y-1">
                              {renderMockItem('especialista_docentes_usuarios', 'Usuarios', { isSubitem: true })}
                              {renderMockItem('especialista_autorreporte', 'Autorreporte', { isSubitem: true })}
                              {renderMockCustomItems('especialista_docentes', true)}
                            </div>
                          )}

                          {/* Dropdown Estudiantes */}
                          {renderMockItem('especialista_estudiantes', 'Estudiantes', {
                            icon: <FaUserGraduate />,
                            isDropdownHeader: true,
                            dropdownId: 'estudiantes'
                          })}
                          {openPreviewDropdowns.estudiantes && (
                            <div className="space-y-1">
                              {renderMockItem('especialista_estudiantes_seguimiento', 'Seguimiento de aprendizaje', { isSubitem: true })}
                              {renderMockCustomItems('especialista_estudiantes', true)}
                            </div>
                          )}

                          {/* Menús de nivel superior personalizados para Especialista */}
                          {renderMockCustomItems(undefined, false)}
                        </>
                      )}
                    </div>

                    <div className="pt-2 border-t border-white/10 text-[10px] text-white/40 text-center relative z-[2]">
                      Haz clic en cualquier menú o submenú para editarlo
                    </div>
                  </div>

                  {/* Panel Inspector en Vivo */}
                  {(() => {
                    const selectedCustomItem = selectedCustomItemId
                      ? customItems.find((c) => c.id === selectedCustomItemId)
                      : null;
                    const selectedMeta = selectedSidebarKey ? getItemMeta(selectedSidebarKey) : null;
                    const currentSelectedVal = selectedSidebarKey ? (sidebarLabels[selectedSidebarKey] ?? '') : '';
                    const isCurrentSelectedModified = selectedSidebarKey
                      ? currentSelectedVal.trim() !== '' && currentSelectedVal !== (DEFAULT_SIDEBAR_LABELS[selectedSidebarKey] || selectedMeta?.labelOriginal)
                      : false;

                    const matchedCatalogRoute = selectedCustomItem?.targetType === 'internal'
                      ? PLATFORM_ROUTES_CATALOG.find((r) => r.route === selectedCustomItem.route)
                      : null;

                    const parentCustom = customItems.find((c) => c.id === selectedCustomItem?.parentId);
                    const parentStandard = PARENT_MENUS_BY_ROLE.find((p) => p.id === selectedCustomItem?.parentId);
                    const parentLabel = selectedCustomItem?.parentId
                      ? (parentStandard?.label || parentCustom?.label || selectedCustomItem.parentId)
                      : null;
                    const submenusCount = selectedCustomItem
                      ? customItems.filter((c) => c.parentId === selectedCustomItem.id).length
                      : 0;

                    return (
                      <div className="flex-1 w-full min-w-0 bg-slate-900/95 backdrop-blur-md p-5 sm:p-6 rounded-2xl border border-slate-700/80 flex flex-col justify-between shadow-2xl min-h-[500px]">
                        <div>
                          {/* Cabecera del Inspector */}
                          <div className="flex items-center justify-between pb-4 mb-4 border-b border-slate-700/60">
                            <div className="flex items-center gap-2.5">
                              <span className="p-2 rounded-xl bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                                <RiEditLine className="text-base" />
                              </span>
                              <div>
                                <h4 className="text-sm font-bold text-white">
                                  Panel Inspector en Vivo
                                </h4>
                                <p className="text-[11px] text-slate-400">
                                  {selectedCustomItem ? (
                                    <>
                                      Elemento personalizado ({selectedCustomItem.role === 'all' ? 'todos los roles' : `rol ${selectedCustomItem.role}`})
                                    </>
                                  ) : (
                                    <>
                                      Edición directa para el rol <strong className="text-slate-200 capitalize">{sidebarPreviewRole}</strong>
                                    </>
                                  )}
                                </p>
                              </div>
                            </div>

                            <div className="flex items-center gap-2">
                              {customItems.length > 0 && (
                                <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-violet-500/20 text-violet-300 border border-violet-500/30">
                                  {customItems.length} creados
                                </span>
                              )}
                              <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                                {getCustomizedCount(sidebarPreviewRole)} personalizados
                              </span>
                            </div>
                          </div>

                          {/* 1. VISTA DE INSPECTOR PARA ITEM PERSONALIZADO */}
                          {selectedCustomItem ? (
                            <div className="p-4 sm:p-5 rounded-2xl bg-slate-950/80 border border-indigo-500/40 shadow-xl space-y-4">
                              <div className="flex items-start justify-between gap-3">
                                <div className="space-y-1.5 flex-1 min-w-0">
                                  <div className="flex items-center gap-2 flex-wrap">
                                    <span className="px-2.5 py-0.5 rounded-lg text-[10px] font-bold uppercase tracking-wider bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 flex items-center gap-1.5">
                                      {selectedCustomItem.parentId ? (
                                        <>
                                          <RiFoldersLine className="text-xs" />
                                          <span>Submenú de {parentLabel}</span>
                                        </>
                                      ) : (
                                        <span>Menú Principal</span>
                                      )}
                                    </span>
                                    <span className="px-2.5 py-0.5 rounded-lg text-[10px] font-bold uppercase tracking-wider bg-slate-800 text-slate-300 border border-slate-700">
                                      Rol: {selectedCustomItem.role === 'all' ? 'Todos' : selectedCustomItem.role}
                                    </span>
                                    <span className="px-2.5 py-0.5 rounded-lg text-[10px] font-bold uppercase tracking-wider bg-purple-500/20 text-purple-300 border border-purple-500/30">
                                      {selectedCustomItem.targetType === 'none' || !selectedCustomItem.route
                                        ? 'Sin Ruta (Contenedor)'
                                        : selectedCustomItem.targetType === 'internal'
                                        ? 'Ruta Interna'
                                        : 'Enlace Web'}
                                    </span>
                                    {submenusCount > 0 && (
                                      <span className="px-2.5 py-0.5 rounded-lg text-[10px] font-bold uppercase tracking-wider bg-sky-500/20 text-sky-300 border border-sky-500/30">
                                        {submenusCount} {submenusCount === 1 ? 'submenú anidado' : 'submenús anidados'}
                                      </span>
                                    )}
                                  </div>

                                  <div className="flex items-center gap-3 pt-1">
                                    <div className="w-9 h-9 rounded-xl bg-indigo-600/30 border border-indigo-400/40 flex items-center justify-center text-indigo-200 shrink-0 shadow-sm">
                                      {renderCustomSidebarIcon(selectedCustomItem.iconName, 'text-xl')}
                                    </div>
                                    <div className="min-w-0 flex-1">
                                      <h5 className="text-base font-bold text-white leading-tight truncate">
                                        {selectedCustomItem.label}
                                      </h5>
                                      <p className="text-xs font-mono text-slate-400 mt-0.5 truncate">
                                        {selectedCustomItem.route || '(Sin ruta de navegación asignada)'}
                                      </p>
                                    </div>
                                  </div>
                                </div>

                                <div className="flex items-center gap-2 shrink-0">
                                  <button
                                    type="button"
                                    onClick={() => {
                                      setCustomItemToEdit(selectedCustomItem);
                                      setIsModalCreateMenuOpen(true);
                                    }}
                                    title="Editar menú completo en modal"
                                    className="px-3 py-1.5 rounded-xl text-xs font-semibold text-indigo-300 bg-indigo-500/15 hover:bg-indigo-500/25 border border-indigo-500/40 transition-colors flex items-center gap-1.5 shadow-sm active:scale-95"
                                  >
                                    <RiEditLine className="text-sm" />
                                    <span>Editar</span>
                                  </button>

                                  <button
                                    type="button"
                                    onClick={() => handleDeleteCustomItem(selectedCustomItem.id)}
                                    title="Eliminar este menú personalizado"
                                    className="px-3 py-1.5 rounded-xl text-xs font-semibold text-rose-300 bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/30 transition-colors flex items-center gap-1.5 active:scale-95"
                                  >
                                    <RiDeleteBinLine className="text-sm" />
                                    <span>Eliminar</span>
                                  </button>
                                </div>
                              </div>

                              {/* Información del destino */}
                              <div className="p-3.5 rounded-xl bg-slate-900 border border-slate-800 text-xs text-slate-300 space-y-1.5">
                                <div className="flex items-center justify-between">
                                  <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                                    Destino actual:
                                  </span>
                                  {selectedCustomItem.targetType === 'none' || !selectedCustomItem.route ? (
                                    <span className="text-[11px] text-amber-300 font-semibold flex items-center gap-1">
                                      <RiFoldersLine className="text-xs" />
                                      <span>Solo contenedor / Desplegable</span>
                                    </span>
                                  ) : selectedCustomItem.targetType === 'external' ? (
                                    <a
                                      href={selectedCustomItem.route}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      className="text-[11px] text-indigo-400 hover:text-indigo-300 flex items-center gap-1 font-semibold"
                                    >
                                      <span>Abrir enlace</span>
                                      <RiExternalLinkLine className="text-xs" />
                                    </a>
                                  ) : (
                                    <span className="text-[11px] text-emerald-400 font-semibold flex items-center gap-1">
                                      <RiCompass3Line className="text-xs" />
                                      <span>Navegación protegida</span>
                                    </span>
                                  )}
                                </div>
                                <div className="font-mono text-[11px] text-slate-300 truncate">
                                  {selectedCustomItem.route || '(Sin ruta asignada - Actúa como acordeón / contenedor)'}
                                </div>
                                {matchedCatalogRoute && (
                                  <p className="text-[11px] text-slate-400 pt-0.5">
                                    {matchedCatalogRoute.description}
                                  </p>
                                )}
                                {(selectedCustomItem.targetType === 'none' || !selectedCustomItem.route) && submenusCount > 0 && (
                                  <p className="text-[11px] text-amber-300/80 pt-0.5">
                                    💡 Este menú contiene {submenusCount} submenú(s). Al hacer clic en el sidebar expandirá o contraerá las opciones sin recargar la página.
                                  </p>
                                )}
                              </div>

                              {/* Formulario de edición de nombre */}
                              <div className="space-y-1.5 pt-3 border-t border-slate-800/80">
                                <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-300">
                                  Modificar nombre visible:
                                </label>
                                <div className="flex gap-2">
                                  <input
                                    type="text"
                                    value={editingCustomItemLabel}
                                    onChange={(e) => setEditingCustomItemLabel(e.target.value)}
                                    onKeyDown={(e) => {
                                      if (e.key === 'Enter') {
                                        e.preventDefault();
                                        handleSaveCustomItemLabel(selectedCustomItem.id);
                                      }
                                    }}
                                    placeholder="Nombre del menú..."
                                    className="flex-1 px-3.5 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-white placeholder-slate-500 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all shadow-inner"
                                  />
                                  <button
                                    type="button"
                                    disabled={isSavingCustomItem}
                                    onClick={() => handleSaveCustomItemLabel(selectedCustomItem.id)}
                                    className="px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white text-xs font-semibold shrink-0 transition-all flex items-center gap-1.5 shadow-md shadow-indigo-600/30"
                                  >
                                    <RiSave2Line className="text-sm" />
                                    <span>{isSavingCustomItem ? 'Guardando...' : 'Guardar'}</span>
                                  </button>
                                </div>
                              </div>

                              {/* Formulario de edición de ruta */}
                              <div className="space-y-3 pt-3 border-t border-slate-800/80">
                                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                                  <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-300">
                                    Modificar ruta de destino:
                                  </label>
                                  <div className="flex rounded-xl bg-slate-900 p-1 border border-slate-800 gap-1 text-xs">
                                    <button
                                      type="button"
                                      onClick={() => {
                                        setEditingCustomItemTargetType('internal');
                                        if (editingCustomItemRoute.startsWith('http') || !editingCustomItemRoute) {
                                          setEditingCustomItemRoute('/admin/pruebas');
                                        }
                                      }}
                                      className={`px-3 py-1 rounded-lg text-[10px] font-bold transition-all ${
                                        editingCustomItemTargetType === 'internal'
                                          ? 'bg-indigo-600 text-white shadow-sm'
                                          : 'text-slate-400 hover:text-slate-200'
                                      }`}
                                    >
                                      Ruta Interna
                                    </button>
                                    <button
                                      type="button"
                                      onClick={() => {
                                        setEditingCustomItemTargetType('external');
                                        if (!editingCustomItemRoute.startsWith('http')) {
                                          setEditingCustomItemRoute('https://');
                                        }
                                      }}
                                      className={`px-3 py-1 rounded-lg text-[10px] font-bold transition-all ${
                                        editingCustomItemTargetType === 'external'
                                          ? 'bg-indigo-600 text-white shadow-sm'
                                          : 'text-slate-400 hover:text-slate-200'
                                      }`}
                                    >
                                      Enlace Web
                                    </button>
                                    <button
                                      type="button"
                                      onClick={() => {
                                        setEditingCustomItemTargetType('none');
                                        setEditingCustomItemRoute('');
                                      }}
                                      className={`px-3 py-1 rounded-lg text-[10px] font-bold transition-all ${
                                        editingCustomItemTargetType === 'none'
                                          ? 'bg-indigo-600 text-white shadow-sm'
                                          : 'text-slate-400 hover:text-slate-200'
                                      }`}
                                    >
                                      Sin Ruta
                                    </button>
                                  </div>
                                </div>

                                {editingCustomItemTargetType === 'none' ? (
                                  <div className="p-3.5 rounded-xl bg-slate-900 border border-slate-800 space-y-2.5 animate-in fade-in duration-150">
                                    <div className="flex items-center gap-2 text-indigo-400 font-bold text-xs">
                                      <RiFoldersLine className="text-base" />
                                      <span>Configurar como Solo Contenedor / Desplegable</span>
                                    </div>
                                    <p className="text-xs text-slate-400 leading-relaxed">
                                      {submenusCount > 0
                                        ? `Este menú contiene ${submenusCount} submenús y actúa como un acordeón desplegable. Al guardarlo sin ruta, los usuarios podrán abrir y cerrar sus opciones con un clic.`
                                        : 'Al guardarlo sin ruta, este menú no tendrá redirección. Es ideal para preparar menús antes de definir su destino o para convertirlos luego en carpetas de submenús.'}
                                    </p>
                                    <button
                                      type="button"
                                      disabled={isSavingCustomItemRoute}
                                      onClick={() => handleSaveCustomItemRoute(selectedCustomItem.id, 'none', '')}
                                      className="px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white text-xs font-bold transition-all flex items-center gap-2 shadow-md shadow-indigo-600/30"
                                    >
                                      <RiSave2Line className="text-sm" />
                                      <span>{isSavingCustomItemRoute ? 'Guardando...' : 'Guardar como Sin Ruta'}</span>
                                    </button>
                                  </div>
                                ) : editingCustomItemTargetType === 'internal' ? (
                                  <div className="space-y-2.5 animate-in fade-in duration-150">
                                    <div className="relative">
                                      <label className="block text-[10px] font-semibold text-slate-400 mb-1">
                                        Elegir del catálogo del sistema:
                                      </label>
                                      <select
                                        value={PLATFORM_ROUTES_CATALOG.some(r => r.route === editingCustomItemRoute) ? editingCustomItemRoute : ''}
                                        onChange={(e) => {
                                          if (e.target.value) {
                                            setEditingCustomItemRoute(e.target.value);
                                          }
                                        }}
                                        className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-white text-xs font-medium focus:outline-none focus:ring-2 focus:ring-indigo-500"
                                      >
                                        <option value="">-- Elige una ruta predefinida --</option>
                                        {PLATFORM_ROUTES_CATALOG.map((catRoute) => (
                                          <option key={catRoute.route} value={catRoute.route}>
                                            [{catRoute.category}] {catRoute.label} ({catRoute.route})
                                          </option>
                                        ))}
                                      </select>
                                    </div>

                                    <div className="space-y-1">
                                      <label className="block text-[10px] font-semibold text-slate-400">
                                        Ruta exacta en la plataforma:
                                      </label>
                                      <div className="flex gap-2 items-center">
                                        <input
                                          type="text"
                                          value={editingCustomItemRoute}
                                          onChange={(e) => setEditingCustomItemRoute(e.target.value)}
                                          onKeyDown={(e) => {
                                            if (e.key === 'Enter') {
                                              e.preventDefault();
                                              handleSaveCustomItemRoute(selectedCustomItem.id);
                                            }
                                          }}
                                          placeholder="/docentes/evaluaciones"
                                          className="flex-1 px-3.5 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-white placeholder-slate-500 text-xs font-mono font-medium focus:outline-none focus:ring-2 focus:ring-indigo-500 shadow-inner"
                                        />
                                        <button
                                          type="button"
                                          disabled={isSavingCustomItemRoute || !editingCustomItemRoute.trim()}
                                          onClick={() => handleSaveCustomItemRoute(selectedCustomItem.id)}
                                          className="px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white text-xs font-semibold shrink-0 transition-all flex items-center gap-1.5 shadow-md shadow-emerald-600/30"
                                        >
                                          <RiSave2Line className="text-sm" />
                                          <span>{isSavingCustomItemRoute ? 'Guardando...' : 'Guardar Ruta'}</span>
                                        </button>
                                      </div>
                                    </div>
                                  </div>
                                ) : (
                                  <div className="space-y-2.5 animate-in fade-in duration-150">
                                    <div className="space-y-1">
                                      <label className="block text-[10px] font-semibold text-slate-400">
                                        URL externa de destino:
                                      </label>
                                      <div className="flex gap-2 items-center">
                                        <input
                                          type="url"
                                          value={editingCustomItemRoute}
                                          onChange={(e) => setEditingCustomItemRoute(e.target.value)}
                                          onKeyDown={(e) => {
                                            if (e.key === 'Enter') {
                                              e.preventDefault();
                                              handleSaveCustomItemRoute(selectedCustomItem.id);
                                            }
                                          }}
                                          placeholder="https://ejemplo.gob.pe"
                                          className="flex-1 px-3.5 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-white placeholder-slate-500 text-xs font-mono font-medium focus:outline-none focus:ring-2 focus:ring-indigo-500 shadow-inner"
                                        />
                                        <button
                                          type="button"
                                          disabled={isSavingCustomItemRoute || !editingCustomItemRoute.trim()}
                                          onClick={() => handleSaveCustomItemRoute(selectedCustomItem.id)}
                                          className="px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white text-xs font-semibold shrink-0 transition-all flex items-center gap-1.5 shadow-md shadow-emerald-600/30"
                                        >
                                          <RiSave2Line className="text-sm" />
                                          <span>{isSavingCustomItemRoute ? 'Guardando...' : 'Guardar Ruta'}</span>
                                        </button>
                                      </div>
                                    </div>

                                    <label className="flex items-center gap-2 text-[11px] text-slate-300 cursor-pointer pt-0.5">
                                      <input
                                        type="checkbox"
                                        checked={editingCustomItemOpenInNewTab}
                                        onChange={(e) => setEditingCustomItemOpenInNewTab(e.target.checked)}
                                        className="rounded border-slate-700 bg-slate-950 text-indigo-600 focus:ring-indigo-500"
                                      />
                                      <span>Abrir en una nueva pestaña del navegador</span>
                                    </label>
                                  </div>
                                )}
                              </div>
                            </div>
                          ) : selectedSidebarKey && selectedMeta ? (
                            /* 2. VISTA DE INSPECTOR PARA ITEM ESTÁNDAR */
                            <div className="p-4 rounded-xl bg-slate-900/80 border border-slate-700/80 space-y-4">
                              <div className="flex items-start justify-between gap-3">
                                <div>
                                  <div className="flex items-center gap-2 flex-wrap mb-1">
                                    <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-slate-800 text-indigo-300 border border-slate-700">
                                      {selectedMeta.categoryTitle}
                                    </span>
                                    {selectedMeta.route && (
                                      <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-slate-800 text-slate-300 border border-slate-700">
                                        {selectedMeta.route}
                                      </span>
                                    )}
                                    {isCurrentSelectedModified ? (
                                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30">
                                        Personalizado
                                      </span>
                                    ) : (
                                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                                        Original
                                      </span>
                                    )}
                                  </div>
                                  <h5 className="text-sm font-bold text-white mt-1">
                                    {currentSelectedVal || selectedMeta.labelOriginal}
                                  </h5>
                                  <p className="text-xs text-slate-400 mt-0.5">
                                    {selectedMeta.description}
                                  </p>
                                </div>

                                {isCurrentSelectedModified && (
                                  <button
                                    type="button"
                                    onClick={() => handleResetSingleSidebarLabel(selectedSidebarKey)}
                                    title={`Restablecer a "${selectedMeta.labelOriginal}"`}
                                    className="px-2.5 py-1 rounded-lg text-xs font-semibold text-amber-300 bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/30 transition-colors shrink-0 flex items-center gap-1.5"
                                  >
                                    <RiRestartLine className="text-xs" />
                                    <span>Restablecer</span>
                                  </button>
                                )}
                              </div>

                              <div className="space-y-1.5 pt-2 border-t border-slate-800">
                                <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-300">
                                  Nombre visible en la navegación:
                                </label>
                                <div className="relative">
                                  <input
                                    type="text"
                                    value={currentSelectedVal}
                                    onChange={(e) => handleSidebarLabelChange(selectedSidebarKey, e.target.value)}
                                    placeholder={selectedMeta.labelOriginal}
                                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-700 text-white placeholder-slate-500 text-xs font-medium focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all shadow-inner"
                                  />
                                </div>
                                <div className="flex items-center justify-between text-[11px] text-slate-400 pt-1">
                                  <span>Texto original: <strong className="text-slate-300 font-semibold">{selectedMeta.labelOriginal}</strong></span>
                                  <button
                                    type="button"
                                    onClick={() => handleStartInlineEdit(selectedSidebarKey)}
                                    className="text-indigo-400 hover:text-indigo-300 transition-colors font-medium"
                                  >
                                    Editar en el menú ✏️
                                  </button>
                                </div>
                              </div>
                            </div>
                          ) : (
                            /* 3. ESTADO VACÍO CUANDO NO HAY NADA SELECCIONADO */
                            <div className="p-6 text-center rounded-xl bg-slate-900/40 border border-dashed border-slate-700 text-slate-400">
                              <RiSideBarLine className="mx-auto text-3xl mb-2 opacity-50" />
                              <p className="text-xs font-medium text-slate-300">Ningún elemento seleccionado</p>
                              <p className="text-[11px] text-slate-500 mt-1 max-w-xs mx-auto">
                                Haz clic sobre cualquier menú estándar o personalizado de la previsualización a la izquierda para inspeccionarlo y editarlo.
                              </p>
                            </div>
                          )}

                          {/* Resumen de Colores de Previsualización */}
                          <div className="grid grid-cols-2 gap-3 mt-4">
                            <div className="p-3 rounded-xl bg-slate-900/60 border border-slate-700/50">
                              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
                                Fondo del Sidebar
                              </span>
                              <div className="flex items-center gap-2">
                                <span 
                                  className="w-4 h-4 rounded-full border border-white/20 shadow-sm" 
                                  style={{ backgroundColor: colorSidebarBackground }} 
                                />
                                <span className="font-mono text-xs text-slate-200">
                                  {colorSidebarBackground}
                                </span>
                              </div>
                            </div>

                            <div className="p-3 rounded-xl bg-slate-900/60 border border-slate-700/50">
                              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
                                Acento / Activo
                              </span>
                              <div className="flex items-center gap-2">
                                <span 
                                  className="w-4 h-4 rounded-full border border-white/20 shadow-sm" 
                                  style={{ backgroundColor: colorSidebarAccent }} 
                                />
                                <span className="font-mono text-xs text-slate-200">
                                  {colorSidebarAccent}
                                </span>
                              </div>
                            </div>
                          </div>
                        </div>

                        {/* Pie de Información del Inspector */}
                        <div className="pt-4 mt-4 border-t border-slate-700/60 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 text-xs text-slate-400">
                          <div className="flex items-center gap-1.5">
                            <span className="w-2 h-2 rounded-full bg-emerald-400" />
                            <span>Sincronización en tiempo real activa</span>
                          </div>
                          <span className="text-[11px] text-slate-400">
                            Presiona <strong className="text-white">Guardar Cambios</strong> para aplicar en toda la plataforma
                          </span>
                        </div>
                      </div>
                    );
                  })()}
                </div>
              </div>
            )}

            {activeSection === 'tarjetas' && (
              /* VISTA 2: TARJETAS DOCENTE (Primaria y Secundaria) */
              <div className="p-6 flex-1 flex flex-col bg-slate-50">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <RiBookOpenLine className="text-slate-400 text-lg" />
                    <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                      Vista Docente: {previewNivel === 'primaria' ? 'Educación Primaria' : 'Educación Secundaria'}
                    </span>
                  </div>

                  {/* Selector de Nivel para la Previsualización */}
                  <div className="flex bg-slate-200/80 p-0.5 rounded-lg text-xs font-semibold">
                    <button
                      type="button"
                      onClick={() => setPreviewNivel('primaria')}
                      className={`px-2.5 py-1 rounded-md transition-all ${
                        previewNivel === 'primaria'
                          ? 'bg-white text-slate-800 shadow-sm'
                          : 'text-slate-500 hover:text-slate-700'
                      }`}
                    >
                      Primaria
                    </button>
                    <button
                      type="button"
                      onClick={() => setPreviewNivel('secundaria')}
                      className={`px-2.5 py-1 rounded-md transition-all ${
                        previewNivel === 'secundaria'
                          ? 'bg-white text-slate-800 shadow-sm'
                          : 'text-slate-500 hover:text-slate-700'
                      }`}
                    >
                      Secundaria
                    </button>
                  </div>
                </div>

                {/* Previsualización del Acordeón / Estándar */}
                <div 
                  className="mb-4 p-3.5 rounded-xl flex items-center justify-between text-white shadow-md transition-all relative overflow-hidden"
                  style={{ background: colorHeaderEstandar }}
                >
                  <div className="flex items-center gap-3 relative z-10">
                    <div className="w-8 h-8 rounded-full bg-white/20 border border-white/30 flex items-center justify-center font-bold text-xs">
                      {previewNivel === 'primaria' ? '3' : '6'}
                    </div>
                    <div>
                      <h5 className="text-xs font-bold text-white leading-tight">Estándar de aprendizaje</h5>
                      <p className="text-[10px] text-white/80">
                        {previewNivel === 'primaria' 
                          ? 'Evaluaciones para estudiantes de 1° y 2° de primaria' 
                          : 'Evaluaciones para estudiantes de 1° y 2° de secundaria'}
                      </p>
                    </div>
                  </div>
                  <div className="text-4xl font-extrabold opacity-10 absolute right-2 bottom-0 select-none">
                    {previewNivel === 'primaria' ? '3' : '6'}
                  </div>
                </div>

                <h4 className="text-slate-800 font-extrabold text-base mb-1">
                  {previewNivel === 'primaria' ? '1ro grado' : '1ro sec.'}{' '}
                  <span className="text-slate-400 font-normal text-xs">(5 categorías)</span>
                </h4>
                
                {/* Cuadrícula simulada de tarjetas */}
                <div className="grid grid-cols-2 gap-4 mt-3">
                  
                  {/* Tarjeta 1 - Comunicación */}
                  <div 
                    className="relative p-4 rounded-xl border transition-all shadow-sm hover:shadow flex flex-col justify-between h-[100px] cursor-pointer group overflow-hidden"
                    style={{ 
                      backgroundColor: `color-mix(in srgb, ${colorMateriaComunicacion} 6%, #ffffff)`,
                      borderColor: `color-mix(in srgb, ${colorMateriaComunicacion} 22%, #e5e7eb)` 
                    }}
                  >
                    <div 
                      className="absolute -right-2 -bottom-3 text-5xl pointer-events-none transition-all group-hover:scale-110 group-hover:-rotate-6 opacity-[0.09]"
                      style={{ color: colorMateriaComunicacion }}
                    >
                      <RiBookOpenLine />
                    </div>
                    
                    <h5 className="text-xs font-bold font-sans relative z-10" style={{ color: `color-mix(in srgb, ${colorMateriaComunicacion} 80%, #1f2937)` }}>
                      Comunicación
                    </h5>
                    <div className="flex items-center justify-between text-[10px] pt-2 border-t relative z-10" style={{ color: `color-mix(in srgb, ${colorMateriaComunicacion} 75%, #6b7280)`, borderColor: `color-mix(in srgb, ${colorMateriaComunicacion} 15%, rgba(0,0,0,0.05))` }}>
                      <span>Disponible</span>
                      <RiArrowRightLine className="group-hover:translate-x-1 transition-transform" />
                    </div>
                  </div>

                  {/* Tarjeta 2 - Matemática */}
                  <div 
                    className="relative p-4 rounded-xl border transition-all shadow-sm hover:shadow flex flex-col justify-between h-[100px] cursor-pointer group overflow-hidden"
                    style={{ 
                      backgroundColor: `color-mix(in srgb, ${colorMateriaMatematica} 6%, #ffffff)`,
                      borderColor: `color-mix(in srgb, ${colorMateriaMatematica} 22%, #e5e7eb)` 
                    }}
                  >
                    <div 
                      className="absolute -right-2 -bottom-3 text-5xl pointer-events-none transition-all group-hover:scale-110 group-hover:-rotate-6 opacity-[0.09]"
                      style={{ color: colorMateriaMatematica }}
                    >
                      <RiCalculatorLine />
                    </div>

                    <h5 className="text-xs font-bold font-sans relative z-10" style={{ color: `color-mix(in srgb, ${colorMateriaMatematica} 80%, #1f2937)` }}>
                      Matemática
                    </h5>
                    <div className="flex items-center justify-between text-[10px] pt-2 border-t relative z-10" style={{ color: `color-mix(in srgb, ${colorMateriaMatematica} 75%, #6b7280)`, borderColor: `color-mix(in srgb, ${colorMateriaMatematica} 15%, rgba(0,0,0,0.05))` }}>
                      <span>Disponible</span>
                      <RiArrowRightLine className="group-hover:translate-x-1 transition-transform" />
                    </div>
                  </div>

                  {/* Tarjeta 3 - Personal Social (Primaria) / Ciencia y Tecnología (Secundaria) */}
                  <div 
                    className="relative p-4 rounded-xl border transition-all shadow-sm hover:shadow flex flex-col justify-between h-[100px] cursor-pointer group overflow-hidden"
                    style={{ 
                      backgroundColor: `color-mix(in srgb, ${previewNivel === 'primaria' ? colorMateriaSociales : colorMateriaCiencia} 6%, #ffffff)`,
                      borderColor: `color-mix(in srgb, ${previewNivel === 'primaria' ? colorMateriaSociales : colorMateriaCiencia} 22%, #e5e7eb)` 
                    }}
                  >
                    <div 
                      className="absolute -right-2 -bottom-3 text-5xl pointer-events-none transition-all group-hover:scale-110 group-hover:-rotate-6 opacity-[0.09]"
                      style={{ color: previewNivel === 'primaria' ? colorMateriaSociales : colorMateriaCiencia }}
                    >
                      {previewNivel === 'primaria' ? <RiShieldUserLine /> : <RiFlaskLine />}
                    </div>

                    <h5 className="text-xs font-bold font-sans relative z-10" style={{ color: `color-mix(in srgb, ${previewNivel === 'primaria' ? colorMateriaSociales : colorMateriaCiencia} 80%, #1f2937)` }}>
                      {previewNivel === 'primaria' ? 'Personal Social' : 'Ciencia y Tecnología'}
                    </h5>
                    <div className="flex items-center justify-between text-[10px] pt-2 border-t relative z-10" style={{ color: `color-mix(in srgb, ${previewNivel === 'primaria' ? colorMateriaSociales : colorMateriaCiencia} 75%, #6b7280)`, borderColor: `color-mix(in srgb, ${previewNivel === 'primaria' ? colorMateriaSociales : colorMateriaCiencia} 15%, rgba(0,0,0,0.05))` }}>
                      <span>Disponible</span>
                      <RiArrowRightLine className="group-hover:translate-x-1 transition-transform" />
                    </div>
                  </div>

                  {/* Tarjeta 4 - Ciencia y Tecnología (Primaria) / DPCC (Secundaria) */}
                  <div 
                    className="relative p-4 rounded-xl border transition-all shadow-sm hover:shadow flex flex-col justify-between h-[100px] cursor-pointer group overflow-hidden"
                    style={{ 
                      backgroundColor: `color-mix(in srgb, ${previewNivel === 'primaria' ? colorMateriaCiencia : colorMateriaDpcc} 6%, #ffffff)`,
                      borderColor: `color-mix(in srgb, ${previewNivel === 'primaria' ? colorMateriaCiencia : colorMateriaDpcc} 22%, #e5e7eb)` 
                    }}
                  >
                    <div 
                      className="absolute -right-2 -bottom-3 text-5xl pointer-events-none transition-all group-hover:scale-110 group-hover:-rotate-6 opacity-[0.09]"
                      style={{ color: previewNivel === 'primaria' ? colorMateriaCiencia : colorMateriaDpcc }}
                    >
                      {previewNivel === 'primaria' ? <RiFlaskLine /> : <RiShieldUserLine />}
                    </div>

                    <h5 className="text-xs font-bold font-sans relative z-10" style={{ color: `color-mix(in srgb, ${previewNivel === 'primaria' ? colorMateriaCiencia : colorMateriaDpcc} 80%, #1f2937)` }}>
                      {previewNivel === 'primaria' ? 'Ciencia y Tecnología' : 'DPCC'}
                    </h5>
                    <div className="flex items-center justify-between text-[10px] pt-2 border-t relative z-10" style={{ color: `color-mix(in srgb, ${previewNivel === 'primaria' ? colorMateriaCiencia : colorMateriaDpcc} 75%, #6b7280)`, borderColor: `color-mix(in srgb, ${previewNivel === 'primaria' ? colorMateriaCiencia : colorMateriaDpcc} 15%, rgba(0,0,0,0.05))` }}>
                      <span>Disponible</span>
                      <RiArrowRightLine className="group-hover:translate-x-1 transition-transform" />
                    </div>
                  </div>

                  {/* Tarjeta 5 - Escribe (Primaria) / Ciencias Sociales (Secundaria) */}
                  <div 
                    className="relative p-4 rounded-xl border transition-all shadow-sm hover:shadow flex flex-col justify-between h-[100px] cursor-pointer group overflow-hidden"
                    style={{ 
                      backgroundColor: `color-mix(in srgb, ${previewNivel === 'primaria' ? colorTercero : colorMateriaSociales} 6%, #ffffff)`,
                      borderColor: `color-mix(in srgb, ${previewNivel === 'primaria' ? colorTercero : colorMateriaSociales} 22%, #e5e7eb)` 
                    }}
                  >
                    <div 
                      className="absolute -right-2 -bottom-3 text-5xl pointer-events-none transition-all group-hover:scale-110 group-hover:-rotate-6 opacity-[0.09]"
                      style={{ color: previewNivel === 'primaria' ? colorTercero : colorMateriaSociales }}
                    >
                      {previewNivel === 'primaria' ? <RiBookOpenLine /> : <RiGlobalLine />}
                    </div>

                    <h5 className="text-xs font-bold font-sans relative z-10" style={{ color: `color-mix(in srgb, ${previewNivel === 'primaria' ? colorTercero : colorMateriaSociales} 80%, #1f2937)` }}>
                      {previewNivel === 'primaria' ? 'Escribe' : 'Ciencias Sociales'}
                    </h5>
                    <div className="flex items-center justify-between text-[10px] pt-2 border-t relative z-10" style={{ color: `color-mix(in srgb, ${previewNivel === 'primaria' ? colorTercero : colorMateriaSociales} 75%, #6b7280)`, borderColor: `color-mix(in srgb, ${previewNivel === 'primaria' ? colorTercero : colorMateriaSociales} 15%, rgba(0,0,0,0.05))` }}>
                      <span>Disponible</span>
                      <RiArrowRightLine className="group-hover:translate-x-1 transition-transform" />
                    </div>
                  </div>

                </div>
              </div>
            )}

            {activeSection === 'login' && (
              /* VISTA 3: PÁGINA LOGIN */
              <div className="relative flex-1 p-6 flex flex-col justify-center items-center overflow-hidden font-sans text-white h-full min-h-[460px]">
                {/* Simulación del overlay con gradiente */}
                <div 
                  className="absolute inset-0 pointer-events-none transition-all duration-300"
                  style={{
                    background: `linear-gradient(135deg, rgba(4, 35, 84, 0.90) 0%, rgba(2, 10, 24, 0.85) 50%, color-mix(in srgb, ${colorLoginAccent} 15%, transparent) 100%)`,
                    zIndex: 1
                  }}
                ></div>

                <div className="relative z-10 w-full flex flex-col md:flex-row items-center justify-between gap-6 px-4">
                  {/* Columna Izquierda */}
                  <div className="flex-1 text-left max-w-[240px]">
                    {/* Logo */}
                    <div className="mb-4 inline-block bg-white/5 p-2 rounded-xl border border-white/10 backdrop-blur-sm">
                      <div className="w-12 h-12 rounded-lg bg-orange-500/90 flex flex-col items-center justify-center text-[8px] font-bold leading-none select-none">
                        <span className="text-white opacity-70 scale-90">competence</span>
                        <span className="text-white text-[12px] font-black tracking-tight mt-0.5">LaB</span>
                      </div>
                    </div>
                    
                    <h4 className="text-base font-extrabold tracking-tight uppercase leading-tight mb-2">
                      BIENVENIDO A COMPETENCE
                    </h4>
                    <p className="text-white/70 text-[9px] leading-relaxed mb-3">
                      Plataforma integral para el seguimiento y evaluación del desarrollo de competencias.
                    </p>
                    {/* Línea decorativa */}
                    <div 
                      className="w-12 h-1 rounded-sm transition-colors duration-300"
                      style={{ backgroundColor: colorLoginAccent }}
                    ></div>
                  </div>

                  {/* Columna Derecha - Card */}
                  <div 
                    className="w-full max-w-[220px] bg-slate-900/60 backdrop-blur-md border border-white/10 rounded-2xl p-4 shadow-2xl flex flex-col gap-3"
                  >
                    <div className="text-center">
                      <h5 className="text-xs font-semibold">Iniciar Sesión</h5>
                      <span className="text-[8px] text-slate-400">Ingresa tus credenciales</span>
                    </div>

                    <div className="flex flex-col gap-2">
                      <div className="px-2 py-1.5 bg-white/5 border border-white/15 rounded-md text-[9px] text-slate-300">
                        Correo Electrónico
                      </div>
                      <div className="px-2 py-1.5 bg-white/5 border border-white/15 rounded-md text-[9px] text-slate-300">
                        Contraseña
                      </div>
                    </div>

                    <div className="text-right">
                      <span className="text-[7px] text-slate-400 cursor-pointer">¿Olvidaste tu contraseña?</span>
                    </div>

                    <button 
                      className="w-full py-2 rounded-lg text-slate-900 text-[10px] font-extrabold uppercase tracking-wider transition-all duration-300 hover:brightness-110 active:scale-95 animate-pulse"
                      style={{ backgroundColor: colorLoginAccent }}
                    >
                      INGRESAR
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Modal para Crear o Editar Menú / Submenú Personalizado */}
      <ModalCrearMenuPersonalizado
        isOpen={isModalCreateMenuOpen}
        onClose={() => {
          setIsModalCreateMenuOpen(false);
          setCustomItemToEdit(null);
        }}
        defaultRole={sidebarPreviewRole}
        existingCustomItems={customItems}
        itemToEdit={customItemToEdit}
        onSave={async (itemData, editId) => {
          try {
            if (editId) {
              await updateCustomItem(editId, itemData);
              toast.success('¡Menú y ruta actualizados exitosamente!');
              setSelectedCustomItemId(editId);
            } else {
              const created = await addCustomItem(itemData);
              toast.success('¡Menú personalizado creado exitosamente!');
              setSelectedCustomItemId(created.id);
            }
            setSelectedSidebarKey(null);
            setCustomItemToEdit(null);
            if (itemData.role !== 'all' && itemData.role !== sidebarPreviewRole) {
              setSidebarPreviewRole(itemData.role as any);
            }
          } catch (e) {
            console.error('Error al guardar item personalizado:', e);
            toast.error('Ocurrió un error al guardar el menú personalizado');
          }
        }}
      />
    </div>
  );
};

PersonalizacionMarcaPage.Auth = PrivateRoutesAdmin;

export default PersonalizacionMarcaPage;
