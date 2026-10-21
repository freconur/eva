import React from 'react';
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import { EvaluacionDetalleDirectorContainer } from '../containers/EvaluacionDetalleDirectorContainer';

jest.mock('@/firebase/firebase.config', () => ({
  db: {},
  storage: {},
  app: {},
  initAnalytics: jest.fn().mockResolvedValue(null),
}));

jest.mock('firebase/auth', () => ({
  getAuth: jest.fn(() => ({})),
  onAuthStateChanged: jest.fn(),
}));

jest.mock('firebase/firestore', () => ({
  getFirestore: jest.fn(() => ({})),
  doc: jest.fn(() => ({ id: 'mockDoc' })),
  collection: jest.fn(() => ({})),
  onSnapshot: jest.fn(() => jest.fn()),
  setDoc: jest.fn(),
  deleteDoc: jest.fn(),
  updateDoc: jest.fn(),
  query: jest.fn(() => ({})),
  where: jest.fn(),
  getDocs: jest.fn().mockResolvedValue({
    forEach: (cb: any) => {
      cb({
        id: 'dir-1',
        data: () => ({
          dni: '11112222',
          nombres: 'Carlos',
          apellidos: 'Mamani',
          institucion: 'I.E. Gran Unidad San Carlos',
          region: 1,
          rol: 2,
        }),
      });
      cb({
        id: 'dir-2',
        data: () => ({
          dni: '33334444',
          nombres: 'Elena',
          apellidos: 'Quispe',
          institucion: 'I.E. Pedro Vilcapaza',
          region: 1,
          rol: 2,
        }),
      });
    },
  }),
}));

jest.mock('next/router', () => ({
  useRouter: () => ({
    query: { id: 'eval-dir-123' },
    pathname: '/admin/evaluaciones-directores/evaluacion/[id]',
  }),
}));

const mockGetDataEvaluacion = jest.fn(() => jest.fn());
const mockGetDimensiones = jest.fn(() => jest.fn());
const mockGetPreguntasRespuestas = jest.fn(() => jest.fn());
const mockGetEvaluados = jest.fn(() => jest.fn());
const mockDeleteDimension = jest.fn();
const mockDeletePreguntaRespuesta = jest.fn();
const mockBuscarUsuario = jest.fn();

jest.mock('@/features/hooks/useEvaluacionDesempenoBase', () => ({
  __esModule: true,
  default: () => ({
    getDataEvaluacion: mockGetDataEvaluacion,
    getDimensiones: mockGetDimensiones,
    getPreguntasRespuestas: mockGetPreguntasRespuestas,
    getEvaluados: mockGetEvaluados,
    deleteDimension: mockDeleteDimension,
    deletePreguntaRespuesta: mockDeletePreguntaRespuesta,
    buscarUsuario: mockBuscarUsuario,
  }),
}));

const mockEvaluacion = {
  id: 'eval-dir-123',
  name: 'Evaluación del Desempeño Directivo 2026',
  descripcion: 'Monitoreo de gestión escolar y liderazgo pedagógico',
  active: false,
};

const mockDimensiones = [
  {
    id: 'dim-1',
    nombre: 'Gestión de las Condiciones Operativas',
    evaluacionId: 'eval-dir-123',
  },
];

const mockPreguntas = [
  {
    id: 'pr-1',
    dimensionId: 'dim-1',
    criterio: 'Garantiza la matrícula oportuna y sin condicionamientos',
    requiereEvidencia: true,
  },
];

const mockEvaluados = [
  {
    id: 'eval-1',
    dni: '11112222',
    nombres: 'Carlos',
    apellidos: 'Mamani',
    institucion: 'Gran Unidad San Carlos',
    region: 1,
    calificacion: 19,
    fechaMonitoreo: '18/10/2026',
    evaluadorDni: '99999999',
  },
  {
    id: 'eval-other-user',
    dni: '55556666',
    nombres: 'Roberto',
    apellidos: 'Flores',
    institucion: 'I.E. Los Andes',
    region: 2,
    calificacion: 16,
    fechaMonitoreo: '19/10/2026',
    evaluadorDni: '88888888', // Evaluado por otro monitor
  },
];

let mockCurrentUser: any = {
  dni: '99999999',
  nombres: 'Admin',
  apellidos: 'General',
  rol: 4,
};

jest.mock('@/features/context/GlolbalContext', () => ({
  useGlobalContext: () => ({
    currentUserData: mockCurrentUser,
    dataEvaluacionDocente: mockEvaluacion,
    dimensionesEspecialistas: mockDimensiones,
    getPreguntaRespuestaDocentes: mockPreguntas,
    evaluadosEspecialista: mockEvaluados,
    loaderPages: false,
  }),
}));

describe('EvaluacionDetalleDirectorContainer', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockCurrentUser = {
      dni: '99999999',
      nombres: 'Admin',
      apellidos: 'General',
      rol: 4,
    };
  });

  it('renders the 3 tabs navigation and the default Monitoreos Realizados tab', async () => {
    render(
      <EvaluacionDetalleDirectorContainer
        id="eval-dir-123"
        role="admin"
        basePath="/admin/evaluaciones-directores"
      />
    );

    // Verify 3 tabs presence
    expect(screen.getByText(/Monitoreos Realizados \(/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Padrón de Directores por UGEL/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Estructura de Rúbricas/i })).toBeInTheDocument();

    // Verify evaluated director appears in Tab 1
    expect(screen.getByText('MAMANI CARLOS')).toBeInTheDocument();
    expect(screen.getByText('11112222')).toBeInTheDocument();
    expect(screen.getByText('19 pts')).toBeInTheDocument();

    // Verify + Monitorear button exists
    const addEvalLink = screen.getByRole('link', { name: /\+ Monitorear/i });
    expect(addEvalLink).toBeInTheDocument();
    expect(addEvalLink.getAttribute('href')).toContain('/admin/evaluaciones-directores/evaluacion/evaluar-director');
  });

  it('allows searching within Monitoreos Realizados tab', async () => {
    render(
      <EvaluacionDetalleDirectorContainer
        id="eval-dir-123"
        role="admin"
        basePath="/admin/evaluaciones-directores"
      />
    );

    expect(screen.getByText('MAMANI CARLOS')).toBeInTheDocument();

    const searchInput = screen.getByPlaceholderText(
      /Buscar por director, DNI o institución educativa.../i
    );
    fireEvent.change(searchInput, { target: { value: 'Inexistente' } });

    expect(screen.queryByText('MAMANI CARLOS')).not.toBeInTheDocument();
    expect(screen.getByText(/No se encontraron directores evaluados/i)).toBeInTheDocument();
  });

  it('switches to Padron de Directores por UGEL tab and shows UGEL selector', async () => {
    render(
      <EvaluacionDetalleDirectorContainer
        id="eval-dir-123"
        role="admin"
        basePath="/admin/evaluaciones-directores"
      />
    );

    const padronTab = screen.getByRole('button', {
      name: /Padrón de Directores por UGEL/i,
    });
    fireEvent.click(padronTab);

    expect(
      screen.getByText(/Consulta del Padrón de Directores por UGEL/i)
    ).toBeInTheDocument();
  });

  it('switches to rubrica tab and renders criteria without scale cards', async () => {
    render(
      <EvaluacionDetalleDirectorContainer
        id="eval-dir-123"
        role="admin"
        basePath="/admin/evaluaciones-directores"
      />
    );

    const rubricaTab = screen.getByRole('button', {
      name: /Estructura de Rúbricas/i,
    });
    fireEvent.click(rubricaTab);

    expect(
      screen.getByText('Gestión de las Condiciones Operativas')
    ).toBeInTheDocument();

    // Click accordion header to expand domain
    const domainHeader = screen.getByText('Gestión de las Condiciones Operativas');
    fireEvent.click(domainHeader);

    expect(
      screen.getByText('Garantiza la matrícula oportuna y sin condicionamientos')
    ).toBeInTheDocument();
    expect(screen.getByText(/Requiere Evidencias/i)).toBeInTheDocument();

    // Verify scales are NOT in the criteria card
    expect(screen.queryByText('Nivel 1')).not.toBeInTheDocument();
    expect(screen.queryByText('Nivel 4')).not.toBeInTheDocument();
  });

  it('renders correct evaluation links in Monitoreos Realizados', async () => {
    render(
      <EvaluacionDetalleDirectorContainer
        id="eval-dir-123"
        role="admin"
        basePath="/admin/evaluaciones-directores"
      />
    );

    const reevaluarLink = screen.getByRole('link', { name: /Reevaluar/i });
    expect(reevaluarLink).toBeInTheDocument();
    expect(reevaluarLink.getAttribute('href')).toContain('idDirector=11112222');
    expect(reevaluarLink.getAttribute('href')).toContain('idEvaluacion=eval-dir-123');

    const reporteLinks = screen.getAllByRole('link', { name: /Reporte/i });
    const indReporteLink = reporteLinks.find((l) =>
      l.getAttribute('href')?.includes('reporte-director-individual')
    );
    expect(indReporteLink).toBeDefined();
    expect(indReporteLink?.getAttribute('href')).toContain('reporte-director-individual');
  });

  it('renders UGEL filter for admin users in Monitoreos Realizados', async () => {
    render(
      <EvaluacionDetalleDirectorContainer
        id="eval-dir-123"
        role="admin"
        basePath="/admin/evaluaciones-directores"
      />
    );

    const regionSelect = screen.getByDisplayValue('Todas las UGEL');
    expect(regionSelect).toBeInTheDocument();

    // Change to San Román (id: 2) -> Director 11112222 is region 1, so should filter out
    fireEvent.change(regionSelect, { target: { value: '2' } });
    expect(screen.queryByText('MAMANI CARLOS')).not.toBeInTheDocument();
  });

  it('preserves the selected UGEL and directores list when switching between tabs', async () => {
    render(
      <EvaluacionDetalleDirectorContainer
        id="eval-dir-123"
        role="admin"
        basePath="/admin/evaluaciones-directores"
      />
    );

    // 1. Switch to Padron tab
    const padronTab = screen.getByRole('button', {
      name: /Padrón de Directores por UGEL/i,
    });
    fireEvent.click(padronTab);

    // 2. Select UGEL San Román (id: 2)
    const selects = screen.getAllByRole('combobox');
    const ugelSelect = selects.find((s) =>
      (s as HTMLSelectElement).innerHTML.includes('-- Seleccionar UGEL --')
    );
    expect(ugelSelect).toBeDefined();

    fireEvent.change(ugelSelect!, { target: { value: '2' } });

    await waitFor(() => {
      expect(screen.getByText(/QUISPE ELENA/i)).toBeInTheDocument();
    });

    // 3. Switch to Monitoreos Realizados tab
    const monitoreosTab = screen.getByText(/Monitoreos Realizados \(/i);
    fireEvent.click(monitoreosTab);

    // Verify Monitoreos Realizados is active in tab button
    expect(monitoreosTab.closest('button')).toHaveClass('border-blue-600');
    expect(screen.getAllByText('MAMANI CARLOS').length).toBeGreaterThan(0);

    // 4. Switch back to Padron tab
    fireEvent.click(padronTab);

    // 5. DIRECTORS MUST STILL BE PRESENT without needing to re-select UGEL!
    expect(screen.getAllByText(/QUISPE ELENA/i).length).toBeGreaterThan(0);
    expect(ugelSelect).toHaveValue('2');
  });

  it('isolates evaluations to only show records evaluated by the current user', () => {
    render(
      <EvaluacionDetalleDirectorContainer
        id="eval-dir-123"
        role="admin"
        basePath="/admin/evaluaciones-directores"
      />
    );

    // Current user (dni: 99999999) evaluated Carlos Mamani
    expect(screen.getByText('MAMANI CARLOS')).toBeInTheDocument();

    // Roberto Flores was evaluated by another user (dni: 88888888), so must NOT appear
    expect(screen.queryByText(/FLORES ROBERTO/i)).not.toBeInTheDocument();
    expect(screen.queryByText('55556666')).not.toBeInTheDocument();
  });

  it('renders UGEL accordions and allows switching between Por UGEL and Lista General', () => {
    render(
      <EvaluacionDetalleDirectorContainer
        id="eval-dir-123"
        role="admin"
        basePath="/admin/evaluaciones-directores"
      />
    );

    // In Por UGEL view (default)
    expect(screen.getByText('Por UGEL')).toBeInTheDocument();
    expect(screen.getByText('Lista General')).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'UGEL Puno' })).toBeInTheDocument();
    expect(screen.getByText(/1 director evaluado/i)).toBeInTheDocument();

    // Switch to Lista General
    const listaBtn = screen.getByText('Lista General');
    fireEvent.click(listaBtn);
    expect(screen.getByText('MAMANI CARLOS')).toBeInTheDocument();

    // Switch back to Por UGEL
    const ugelBtn = screen.getByText('Por UGEL');
    fireEvent.click(ugelBtn);
    expect(screen.getByRole('heading', { name: 'UGEL Puno' })).toBeInTheDocument();
  });

  it('renders "Resultados" button in UGEL accordion and toolbar linking to evaluados', () => {
    render(
      <EvaluacionDetalleDirectorContainer
        id="eval-dir-123"
        role="especialista"
        basePath="/especialistas/evaluaciones-director"
      />
    );

    // Toolbar general "Resultados" link
    const toolbarResultadosLinks = screen.getAllByRole('link', { name: /Resultados/i });
    expect(toolbarResultadosLinks.length).toBeGreaterThanOrEqual(2);

    // The accordion specific link
    const accordionResultadosLink = toolbarResultadosLinks.find(
      (link) => link.getAttribute('title')?.includes('UGEL Puno')
    );
    expect(accordionResultadosLink).toBeDefined();
    expect(accordionResultadosLink?.getAttribute('href')).toBe(
      '/especialistas/evaluaciones-director/evaluacion/eval-dir-123/evaluados?region=1'
    );

    // The general toolbar link
    const generalResultadosLink = toolbarResultadosLinks.find(
      (link) => link.getAttribute('title')?.includes('panel general')
    );
    expect(generalResultadosLink).toBeDefined();
    expect(generalResultadosLink?.getAttribute('href')).toBe(
      '/especialistas/evaluaciones-director/evaluacion/eval-dir-123/evaluados'
    );
  });

  it('calls deletePreguntaRespuesta with (idEvaluacion, prId) when admin deletes a question', async () => {
    const confirmSpy = jest.spyOn(window, 'confirm').mockImplementation(() => true);

    render(
      <EvaluacionDetalleDirectorContainer
        id="eval-dir-123"
        role="admin"
        basePath="/admin/evaluaciones-directores"
      />
    );

    // Switch to rubrica tab
    const rubricaBtn = screen.getByRole('button', { name: /Estructura de Rúbricas/i });
    fireEvent.click(rubricaBtn);

    // Expand domain accordion to see criteria
    const domainHeader = screen.getByText('Gestión de las Condiciones Operativas');
    fireEvent.click(domainHeader);

    // Find the delete question button
    const deleteQuestionBtn = screen.getByTitle('Eliminar criterio');
    expect(deleteQuestionBtn).toBeInTheDocument();

    await act(async () => {
      fireEvent.click(deleteQuestionBtn);
    });

    expect(confirmSpy).toHaveBeenCalledWith('¿Está seguro de eliminar este criterio pedagógico?');
    expect(mockDeletePreguntaRespuesta).toHaveBeenCalledWith('eval-dir-123', 'pr-1');

    confirmSpy.mockRestore();
  });

  it('calls deleteDimension with (idEvaluacion, dimId) when admin deletes a domain', async () => {
    const confirmSpy = jest.spyOn(window, 'confirm').mockImplementation(() => true);

    render(
      <EvaluacionDetalleDirectorContainer
        id="eval-dir-123"
        role="admin"
        basePath="/admin/evaluaciones-directores"
      />
    );

    // Switch to rubrica tab
    const rubricaBtn = screen.getByRole('button', { name: /Estructura de Rúbricas/i });
    fireEvent.click(rubricaBtn);

    // Find the delete domain button
    const deleteDomainBtn = screen.getByTitle('Eliminar dominio');
    expect(deleteDomainBtn).toBeInTheDocument();

    await act(async () => {
      fireEvent.click(deleteDomainBtn);
    });

    expect(confirmSpy).toHaveBeenCalledWith(
      expect.stringContaining('Gestión de las Condiciones Operativas')
    );
    expect(confirmSpy).toHaveBeenCalledWith(
      expect.stringContaining('criterio pedagógico que también se eliminará')
    );
    expect(mockDeleteDimension).toHaveBeenCalledWith('eval-dir-123', 'dim-1', true);

    confirmSpy.mockRestore();
  });

  it('renders orphan criteria section and allows admin to purge orphan criteria', async () => {
    const confirmSpy = jest.spyOn(window, 'confirm').mockImplementation(() => true);

    const originalPreguntas = [
      {
        id: 'pr-1',
        dimensionId: 'dim-1',
        criterio: 'Criterio en dimensión',
      },
      {
        id: 'pr-orphan-1',
        criterio: 'Criterio huérfano 1',
      },
    ];

    jest.spyOn(require('@/features/context/GlolbalContext'), 'useGlobalContext').mockImplementation(() => ({
      currentUserData: mockCurrentUser,
      dataEvaluacionDocente: mockEvaluacion,
      dimensionesEspecialistas: mockDimensiones,
      getPreguntaRespuestaDocentes: originalPreguntas,
      evaluadosEspecialista: mockEvaluados,
      loaderPages: false,
    }));

    render(
      <EvaluacionDetalleDirectorContainer
        id="eval-dir-123"
        role="admin"
        basePath="/admin/evaluaciones-directores"
      />
    );

    // Switch to rubrica tab
    const rubricaBtn = screen.getByRole('button', { name: /Estructura de Rúbricas/i });
    fireEvent.click(rubricaBtn);

    expect(screen.getByText(/Criterios Generales \(Sin Dominio Asignado\)/i)).toBeInTheDocument();
    expect(screen.getByText('Criterio huérfano 1')).toBeInTheDocument();

    const purgeBtn = screen.getByRole('button', { name: /Eliminar 1 huérfanos/i });
    expect(purgeBtn).toBeInTheDocument();

    await act(async () => {
      fireEvent.click(purgeBtn);
    });

    expect(confirmSpy).toHaveBeenCalledWith(expect.stringContaining('1 criterios sin dominio'));
    expect(mockDeletePreguntaRespuesta).toHaveBeenCalledWith('eval-dir-123', 'pr-orphan-1');

    confirmSpy.mockRestore();
  });

  it('identifica al especialista en la pestaña de padrón: carga su UGEL automáticamente sin selector de otras UGELs', async () => {
    mockCurrentUser = {
      dni: '12345678',
      nombres: 'Especialista',
      apellidos: 'UGEL',
      rol: 1,
      region: 2, // UGEL San Román
    };

    render(
      <EvaluacionDetalleDirectorContainer
        id="eval-dir-123"
        role="especialista"
        basePath="/especialistas/evaluaciones-director"
      />
    );

    // Cambiar a la pestaña de padrón
    const padronTab = screen.getByRole('button', { name: /Padrón de Directores/i });
    fireEvent.click(padronTab);

    // Debe mostrar la identificación de su UGEL asignada con 'Mi UGEL'
    expect(screen.getByText('Mi UGEL')).toBeInTheDocument();
    expect(screen.getAllByText(/UGEL San Román/i).length).toBeGreaterThan(0);

    // No debe existir el combobox para cambiar de UGEL (está bloqueado a su jurisdicción)
    const comboboxes = screen.queryAllByRole('combobox');
    const ugelSelect = comboboxes.find((c) => (c as HTMLSelectElement).innerHTML.includes('-- Seleccionar UGEL --'));
    expect(ugelSelect).toBeUndefined();
  });

  it('permite al Administrador buscar un director por DNI en la base de datos (con acceso regional habilitado)', async () => {
    mockBuscarUsuario.mockResolvedValueOnce({
      id: 'dir-yunguyo',
      dni: '77889900',
      nombres: 'Marcos',
      apellidos: 'Apaza',
      institucion: 'I.E. José Carlos Mariátegui',
      region: 9, // UGEL Yunguyo
      rol: 2,
    });

    render(
      <EvaluacionDetalleDirectorContainer
        id="eval-dir-123"
        role="admin"
        basePath="/admin/evaluaciones-directores"
      />
    );

    // Ir a pestaña Padrón
    fireEvent.click(screen.getByRole('button', { name: /Padrón de Directores por UGEL/i }));

    // Localizar buscador por DNI en Base de Datos
    const inputDni = screen.getByPlaceholderText(/Ingrese DNI del director \(8 dígitos\) para buscar en la base de datos/i);
    expect(inputDni).toBeInTheDocument();

    // Ingresar DNI y buscar
    fireEvent.change(inputDni, { target: { value: '77889900' } });
    const btnBuscar = screen.getByRole('button', { name: /Buscar en Base de Datos/i });
    fireEvent.click(btnBuscar);

    await waitFor(() => {
      expect(mockBuscarUsuario).toHaveBeenCalledWith('77889900');
      expect(screen.getByText(/APAZA MARCOS/i)).toBeInTheDocument();
    });

    // Detecta Admin con acceso regional
    expect(screen.getByText(/Acceso Regional \(Admin\)/i)).toBeInTheDocument();
    expect(screen.getAllByText(/UGEL Yunguyo/i).length).toBeGreaterThan(0);

    // Muestra botón de monitorear habilitado
    const btnMonitorear = screen.getByRole('link', { name: /Monitorear Director/i });
    expect(btnMonitorear).toHaveAttribute(
      'href',
      '/admin/evaluaciones-directores/evaluacion/evaluar-director?idEvaluacion=eval-dir-123&idDirector=77889900'
    );
  });

  it('permite al Especialista buscar por DNI en base de datos y autoriza si pertenece a su misma UGEL', async () => {
    mockCurrentUser = {
      dni: '12345678',
      nombres: 'Especialista',
      apellidos: 'Puno',
      rol: 1,
      region: 1, // UGEL Puno
    };

    mockBuscarUsuario.mockResolvedValueOnce({
      id: 'dir-puno',
      dni: '44556677',
      nombres: 'Lucía',
      apellidos: 'Condori',
      institucion: 'I.E. San Juan',
      region: 1, // UGEL Puno
      rol: 2,
    });

    render(
      <EvaluacionDetalleDirectorContainer
        id="eval-dir-123"
        role="especialista"
        basePath="/especialistas/evaluaciones-director"
      />
    );

    // Ir a pestaña Padrón
    fireEvent.click(screen.getByRole('button', { name: /Padrón de Directores por UGEL/i }));

    const inputDni = screen.getByPlaceholderText(/Ingrese DNI del director \(8 dígitos\) para buscar en la base de datos/i);
    fireEvent.change(inputDni, { target: { value: '44556677' } });
    fireEvent.click(screen.getByRole('button', { name: /Buscar en Base de Datos/i }));

    await waitFor(() => {
      expect(screen.getByText(/CONDORI LUCÍA/i)).toBeInTheDocument();
    });

    // Detecta que pertenece a su jurisdicción
    expect(screen.getByText(/Su Jurisdicción \(UGEL Puno\)/i)).toBeInTheDocument();

    // Habilitado para monitorear
    const btnMonitorear = screen.getByRole('link', { name: /Monitorear Director/i });
    expect(btnMonitorear).toHaveAttribute(
      'href',
      '/especialistas/evaluaciones-director/evaluacion/evaluar-director?idEvaluacion=eval-dir-123&idDirector=44556677'
    );
  });

  it('bloquea la evaluación para el Especialista cuando el director buscado en BD pertenece a otra UGEL', async () => {
    mockCurrentUser = {
      dni: '12345678',
      nombres: 'Especialista',
      apellidos: 'Puno',
      rol: 1,
      region: 1, // UGEL Puno
    };

    mockBuscarUsuario.mockResolvedValueOnce({
      id: 'dir-san-roman',
      dni: '88776655',
      nombres: 'Juan',
      apellidos: 'Pérez',
      institucion: 'I.E. Comercio 32',
      region: 2, // UGEL San Román
      rol: 2,
    });

    render(
      <EvaluacionDetalleDirectorContainer
        id="eval-dir-123"
        role="especialista"
        basePath="/especialistas/evaluaciones-director"
      />
    );

    fireEvent.click(screen.getByRole('button', { name: /Padrón de Directores por UGEL/i }));

    const inputDni = screen.getByPlaceholderText(/Ingrese DNI del director \(8 dígitos\) para buscar en la base de datos/i);
    fireEvent.change(inputDni, { target: { value: '88776655' } });
    fireEvent.click(screen.getByRole('button', { name: /Buscar en Base de Datos/i }));

    await waitFor(() => {
      expect(screen.getByText(/PÉREZ JUAN/i)).toBeInTheDocument();
    });

    // Detecta que pertenece a otra UGEL y alerta de sin autorización
    expect(screen.getByText(/Sin Autorización/i)).toBeInTheDocument();
    expect(screen.getAllByText(/Director no pertenece a su UGEL/i).length).toBeGreaterThan(0);
    expect(screen.getByText(/Monitoreo Bloqueado/i)).toBeInTheDocument();

    // No debe existir el link para evaluar a este director
    expect(screen.queryByRole('link', { name: /Monitorear Director/i })).not.toBeInTheDocument();
  });

  it('muestra mensaje informativo cuando el DNI no existe en la base de datos', async () => {
    mockBuscarUsuario.mockResolvedValueOnce(null);

    render(
      <EvaluacionDetalleDirectorContainer
        id="eval-dir-123"
        role="admin"
        basePath="/admin/evaluaciones-directores"
      />
    );

    fireEvent.click(screen.getByRole('button', { name: /Padrón de Directores por UGEL/i }));

    const inputDni = screen.getByPlaceholderText(/Ingrese DNI del director \(8 dígitos\) para buscar en la base de datos/i);
    fireEvent.change(inputDni, { target: { value: '00000000' } });
    fireEvent.click(screen.getByRole('button', { name: /Buscar en Base de Datos/i }));

    await waitFor(() => {
      expect(screen.getByText(/No se encontró ningún director con DNI 00000000 en la base de datos/i)).toBeInTheDocument();
    });
  });
});
