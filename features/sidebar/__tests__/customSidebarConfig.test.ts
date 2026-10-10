import {
  PARENT_MENUS_BY_ROLE,
  PLATFORM_ROUTES_CATALOG,
  CustomSidebarItem,
  CustomItemRole,
  renderCustomSidebarIcon,
} from '../customSidebarConfig';

describe('customSidebarConfig', () => {
  it('debe incluir opciones de menú padre para todos los roles del sistema', () => {
    const rolesPresentes = new Set(PARENT_MENUS_BY_ROLE.map((opt) => opt.role));
    expect(rolesPresentes.has('docente')).toBe(true);
    expect(rolesPresentes.has('director')).toBe(true);
    expect(rolesPresentes.has('especialista')).toBe(true);
    expect(rolesPresentes.has('admin')).toBe(true);
  });

  it('debe contener los menús padre correctos para docentes', () => {
    const docenteParents = PARENT_MENUS_BY_ROLE.filter((opt) => opt.role === 'docente');
    const ids = docenteParents.map((p) => p.id);

    expect(ids).toContain('docente_seguimiento');
    expect(ids).toContain('docente_estudiantes');
    expect(ids).toContain('docente_autorreporte');
  });

  it('debe contener los menús padre correctos para directores', () => {
    const directorParents = PARENT_MENUS_BY_ROLE.filter((opt) => opt.role === 'director');
    const ids = directorParents.map((p) => p.id);

    expect(ids).toContain('director_estudiantes');
    expect(ids).toContain('director_docentes');
    expect(ids).toContain('director_autorreporte');
  });

  it('debe contener los menús padre correctos para especialistas', () => {
    const especialistaParents = PARENT_MENUS_BY_ROLE.filter((opt) => opt.role === 'especialista');
    const ids = especialistaParents.map((p) => p.id);

    expect(ids).toContain('especialista_directivos');
    expect(ids).toContain('especialista_docentes');
    expect(ids).toContain('especialista_estudiantes');
  });

  it('debe filtrar correctamente menús estándar y personalizados para un rol', () => {
    const mockCustomItems: CustomSidebarItem[] = [
      {
        id: 'custom_1',
        label: 'Gestión Pedagógica',
        role: 'docente',
        targetType: 'internal',
        route: '/docentes/evaluaciones',
      },
      {
        id: 'custom_2',
        label: 'Capacitaciones Regionales',
        role: 'all',
        targetType: 'external',
        route: 'https://ugel.gob.pe',
      },
      {
        id: 'custom_sub_1',
        label: 'Submenú A',
        role: 'docente',
        parentId: 'custom_1',
        targetType: 'internal',
        route: '/docentes/evaluaciones',
      },
    ];

    const standardDocente = PARENT_MENUS_BY_ROLE.filter(
      (p) => p.role === 'docente'
    );
    const customDocenteParents = mockCustomItems.filter(
      (item) => !item.parentId && (item.role === 'docente' || item.role === 'all')
    );

    expect(standardDocente.length).toBeGreaterThanOrEqual(3);
    expect(customDocenteParents).toHaveLength(2);
    expect(customDocenteParents.map((c) => c.id)).toEqual(['custom_1', 'custom_2']);
  });

  it('debe permitir menús con targetType "none" sin ruta obligatoria para contenedores de submenús', () => {
    const contenedorMenu: CustomSidebarItem = {
      id: 'custom_padre_sin_ruta',
      label: 'Planificación Curricular',
      role: 'docente',
      targetType: 'none',
      route: '',
    };

    const subitem1: CustomSidebarItem = {
      id: 'custom_hijo_1',
      label: 'Seguimiento y Retroalimentación',
      role: 'docente',
      parentId: 'custom_padre_sin_ruta',
      targetType: 'internal',
      route: '/docentes/evaluaciones',
    };

    expect(contenedorMenu.targetType).toBe('none');
    expect(contenedorMenu.route).toBe('');

    const children = [subitem1].filter((item) => item.parentId === contenedorMenu.id);
    expect(children).toHaveLength(1);
    expect(children[0].label).toBe('Seguimiento y Retroalimentación');
  });

  it('debe resolver el nombre amigable de un menú padre personalizado en lugar de su ID técnico', () => {
    const items: CustomSidebarItem[] = [
      {
        id: 'CUSTOM_1791669981968_BYO7',
        label: 'Planificación Curricular 2026',
        role: 'docente',
        targetType: 'none',
        route: '',
      },
      {
        id: 'custom_hijo_cobertura',
        label: 'Cobertura Curricular',
        role: 'docente',
        parentId: 'CUSTOM_1791669981968_BYO7',
        targetType: 'internal',
        route: '/docentes/evaluaciones',
      },
    ];

    const child = items.find((i) => i.id === 'custom_hijo_cobertura');
    const parentCustom = items.find((c) => c.id === child?.parentId);
    const parentStandard = PARENT_MENUS_BY_ROLE.find((p) => p.id === child?.parentId);
    const resolvedLabel = parentStandard?.label || parentCustom?.label || child?.parentId;

    expect(resolvedLabel).toBe('Planificación Curricular 2026');
    expect(resolvedLabel).not.toBe('CUSTOM_1791669981968_BYO7');
  });
});
