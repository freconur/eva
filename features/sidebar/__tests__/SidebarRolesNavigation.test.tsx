import {
  SIDEBAR_ROLES_METADATA,
  DEFAULT_SIDEBAR_LABELS,
} from '../sidebarLabelsConfig';

describe('SidebarRolesNavigation & Catalog Verification', () => {
  it('contiene la ruta de evaluación de mediación didáctica para directores en el catálogo', () => {
    const directorMeta = SIDEBAR_ROLES_METADATA.find((s) => s.roleId === 'director');
    expect(directorMeta).toBeDefined();

    const allDirectorItems = directorMeta?.categories.flatMap((c) => c.items) || [];
    const rutaMediacion = allDirectorItems.find(
      (item) => item.route === '/directores/evaluaciones-docentes'
    );
    expect(rutaMediacion).toBeDefined();
    expect(rutaMediacion?.key).toBe('director_docentes_mediacion');
    expect(DEFAULT_SIDEBAR_LABELS.director_docentes_mediacion).toBe('Mediación didáctica');
  });

  it('no contiene la ruta "Mi desempeño" para directores en el sidebar', () => {
    const directorMeta = SIDEBAR_ROLES_METADATA.find((s) => s.roleId === 'director');
    expect(directorMeta).toBeDefined();

    const allDirectorItems = directorMeta?.categories.flatMap((c) => c.items) || [];
    const rutaMiDesempeno = allDirectorItems.find(
      (item) => item.route === '/directores/mi-desempeno'
    );
    expect(rutaMiDesempeno).toBeUndefined();
  });

  it('no contiene la ruta "Mi desempeño" para docentes en el sidebar', () => {
    const docenteMeta = SIDEBAR_ROLES_METADATA.find((s) => s.roleId === 'docente');
    expect(docenteMeta).toBeDefined();

    const allDocenteItems = docenteMeta?.categories.flatMap((c) => c.items) || [];
    const rutaMiDesempeno = allDocenteItems.find(
      (item) => item.route === '/docentes/mi-desempeno'
    );
    expect(rutaMiDesempeno).toBeUndefined();
  });

  it('contiene las rutas de evaluación de desempeño para especialistas en el catálogo', () => {
    const especialistaMeta = SIDEBAR_ROLES_METADATA.find((s) => s.roleId === 'especialista');
    expect(especialistaMeta).toBeDefined();

    const allEspecialistaItems = especialistaMeta?.categories.flatMap((c) => c.items) || [];
    const rutaEspecialista = allEspecialistaItems.find(
      (item) => item.route === '/especialistas/evaluaciones-director'
    );
    expect(rutaEspecialista).toBeDefined();
  });
});
