import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { EvaluacionDetalleDocenteContainer } from '../containers/EvaluacionDetalleDocenteContainer';

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
}));

jest.mock('next/router', () => ({
  useRouter: () => ({
    query: { id: 'eval-123' },
    pathname: '/admin/evaluaciones-docentes/evaluacion/[id]',
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

const mockEvaluados = [
  {
    id: 'ses-1',
    dni: '12345678',
    nombres: 'Juan',
    apellidos: 'Pérez',
    institucion: 'I.E. San Juan',
    dniDirector: '77889900',
    nombreDirector: 'Franco Ernesto Condori Huaraya',
    calificacion: 18,
    cargo: 'Docente de Primaria',
    fechaMonitoreo: '15/10/2026',
    faseNombre: 'FASE I',
    evaluadorDni: '11223344',
    especialistaDni: '11223344',
    adminDni: '11223344',
  },
  {
    id: 'ses-2',
    dni: '87654321',
    nombres: 'María',
    apellidos: 'López',
    institucion: 'I.E. Santa Rosa',
    dniDirector: '44556677',
    nombreDirector: 'Rosa María Directora',
    calificacion: 16,
    cargo: 'Docente de Secundaria',
    fechaMonitoreo: '16/10/2026',
    faseNombre: 'FASE I',
    evaluadorDni: '11223344',
    especialistaDni: '11223344',
    adminDni: '11223344',
  },
  {
    id: 'ses-director',
    dni: '99887766',
    nombres: 'Carlos',
    apellidos: 'EvaluadoPorDirector',
    institucion: 'I.E. San Juan',
    dniDirector: '77889900',
    calificacion: 14,
    cargo: 'Docente de Primaria',
    fechaMonitoreo: '10/10/2026',
    faseNombre: 'FASE I',
    evaluadorRol: 'director',
    evaluadorDni: '77889900',
  },
];

const mockDimensiones = [
  { id: 'dim-1', nombre: 'Planificación Curricular' },
  { id: 'dim-2', nombre: 'Clima de Aula' },
];

const mockPreguntas = [
  {
    id: 'preg-1',
    dimensionId: 'dim-1',
    criterio: 'Diseña la sesión según el CNEB',
    puntaje: 4,
    alternativas: [
      { alternativa: '0', value: 0, descripcion: 'No evidencia de planificación' },
      { alternativa: '1', value: 1, descripcion: 'En proceso de planificación' },
    ],
  },
  { id: 'preg-2', dimensionId: 'dim-2', criterio: 'Promueve el respeto mutuo', puntaje: 4 },
];

const defaultAdminUser = {
  dni: '11223344',
  nombres: 'Administrador',
  apellidos: 'General',
  rol: 4,
  institucion: 'UGEL Puno',
  region: 1,
};

const defaultSpecialistUser = {
  dni: '88776655',
  nombres: 'Especialista',
  apellidos: 'UGEL',
  rol: 1,
  institucion: 'UGEL Puno',
  region: 1,
};
let mockCurrentUser: any = null;

let mockDataEvaluacion: any = null;

jest.mock('@/features/context/GlolbalContext', () => ({
  useGlobalContext: () => ({
    currentUserData: mockCurrentUser || defaultAdminUser,
    dataEvaluacionDocente: mockDataEvaluacion || {
      id: 'eval-123',
      active: true,
      name: 'RÚBRICA DE MONITOREO DOCENTE 2026',
      descripcion: 'Evaluación y acompañamiento en aula',
      categoria: 'ACOMPAÑAMIENTO',
      faseNombre: 'OCTUBRE II',
    },
    loaderPages: false,
    dimensionesEspecialistas: mockDimensiones,
    getPreguntaRespuestaDocentes: mockPreguntas,
    evaluadosEspecialista: mockEvaluados,
  }),
}));

describe('EvaluacionDetalleDocenteContainer', () => {
  beforeEach(() => {
    mockCurrentUser = null;
    mockDataEvaluacion = null;
    jest.clearAllMocks();
  });

  it('renderiza la vista para Administrador con los enlaces a /admin/evaluaciones-docentes', () => {
    render(
      <EvaluacionDetalleDocenteContainer
        id="eval-123"
        role="admin"
        basePath="/admin/evaluaciones-docentes"
      />
    );

    // Título y datos de la evaluación
    expect(screen.getByText('RÚBRICA DE MONITOREO DOCENTE 2026')).toBeInTheDocument();

    // Verificamos que las 3 tarjetas KPI estén presentes y que NO esté "Puntaje Promedio"
    expect(screen.getByText('Monitoreos Realizados')).toBeInTheDocument();
    expect(screen.getByText('I.E. Monitoreadas')).toBeInTheDocument();
    expect(screen.getByText('Criterios Pedagógicos')).toBeInTheDocument();
    expect(screen.queryByText('Puntaje Promedio')).not.toBeInTheDocument();

    // Verificamos que los enlaces internos utilicen la ruta de admin
    const btnEvaluar = screen.getAllByRole('link', { name: /\+ Evaluar/i });
    expect(btnEvaluar[0]).toHaveAttribute(
      'href',
      '/admin/evaluaciones-docentes/evaluacion/evaluar-docente?id=eval-123'
    );
    expect(btnEvaluar.length).toBeGreaterThan(0);

    // Enlace del reporte de una institución
    const linkReporteIE = screen.getByTitle('Ver reporte detallado de I.E. San Juan');
    expect(linkReporteIE).toHaveAttribute(
      'href',
      expect.stringContaining('/admin/evaluaciones-docentes/evaluacion/reporte?idEvaluacion=eval-123')
    );

    // Enlace de resultados y analíticas de la institución
    const linkResultadosIE = screen.getByTitle('Ver resultados y analíticas de I.E. San Juan');
    expect(linkResultadosIE).toHaveAttribute(
      'href',
      expect.stringContaining('/admin/evaluaciones-docentes/evaluacion/eval-123/evaluados')
    );

    // Verificamos que el docente evaluado por el director NO aparezca en esta vista de monitoreo
    expect(screen.queryByText('Carlos EvaluadoPorDirector')).not.toBeInTheDocument();

    // Verificamos que se muestre el nombre del director y DNI debajo de la I.E. sin la pastilla redundante ni "Identificador de Sede:"
    expect(screen.getByText(/Franco Ernesto Condori Huaraya/i)).toBeInTheDocument();
    expect(screen.getByText(/DNI: 77889900/i)).toBeInTheDocument();
    expect(screen.queryByText('Identificador de Sede:')).not.toBeInTheDocument();
  });

  it('aísla los monitoreos del especialista/admin y excluye los docentes evaluados por directores de I.E.', () => {
    render(
      <EvaluacionDetalleDocenteContainer
        id="eval-123"
        role="admin"
        basePath="/admin/evaluaciones-docentes"
      />
    );

    // Solo se deben contar los 2 monitoreos del admin, descartando el evaluado por el director
    expect(screen.getByText('Monitoreos Realizados (2)')).toBeInTheDocument();
    expect(screen.queryByText('Monitoreos Realizados (3)')).not.toBeInTheDocument();

    // El docente evaluado por el director no debe figurar en el padrón de monitoreos del admin
    expect(screen.queryByText('Carlos EvaluadoPorDirector')).not.toBeInTheDocument();

    // Los docentes monitoreados por el admin sí deben figurar
    expect(screen.getByText('Juan Pérez')).toBeInTheDocument();
    expect(screen.getByText('María López')).toBeInTheDocument();
  });

  it('renderiza la vista para Especialista con los enlaces a /especialistas/evaluaciones-docentes', () => {
    render(
      <EvaluacionDetalleDocenteContainer
        id="eval-123"
        role="especialista"
        basePath="/especialistas/evaluaciones-docentes"
      />
    );

    // Verificamos que los enlaces apunten a especialistas
    const btnEvaluar = screen.getAllByRole('link', { name: /\+ Evaluar/i });
    expect(btnEvaluar[0]).toHaveAttribute(
      'href',
      '/especialistas/evaluaciones-docentes/evaluacion/evaluar-docente?id=eval-123'
    );

    const linkReporteIE = screen.getByTitle('Ver reporte detallado de I.E. San Juan');
    expect(linkReporteIE).toHaveAttribute(
      'href',
      expect.stringContaining('/especialistas/evaluaciones-docentes/evaluacion/reporte?idEvaluacion=eval-123')
    );
  });

  it('permite alternar entre la pestaña de monitoreos y la rúbrica', () => {
    render(
      <EvaluacionDetalleDocenteContainer
        id="eval-123"
        role="admin"
        basePath="/admin/evaluaciones-docentes"
      />
    );

    // Por defecto inicia en Monitoreos Realizados
    expect(screen.getByText('Monitoreos Realizados (2)')).toBeInTheDocument();

    // Click en la pestaña de Rúbrica
    const tabRubrica = screen.getByText(/Estructura de Rúbricas/i);
    fireEvent.click(tabRubrica);

    // Verificamos que se muestre la rúbrica con los dominios
    const headerDominio = screen.getByText('Planificación Curricular');
    expect(headerDominio).toBeInTheDocument();
    expect(screen.getByText('Clima de Aula')).toBeInTheDocument();

    // Click para abrir el acordeón del dominio y desplegar sus criterios
    fireEvent.click(headerDominio);

    // Verificamos que se muestre el criterio, pero sin las escalas
    expect(screen.getByText('Diseña la sesión según el CNEB')).toBeInTheDocument();
    expect(screen.queryByText('No evidencia de planificación')).not.toBeInTheDocument();
    expect(screen.queryByText('En proceso de planificación')).not.toBeInTheDocument();
  });

  it('permite cambiar a la vista de lista general y buscar un docente', () => {
    render(
      <EvaluacionDetalleDocenteContainer
        id="eval-123"
        role="admin"
        basePath="/admin/evaluaciones-docentes"
      />
    );

    // Cambiar a Lista General
    const btnLista = screen.getByTitle('Lista completa de todos los docentes monitoreados');
    fireEvent.click(btnLista);

    expect(screen.getByText('Juan Pérez')).toBeInTheDocument();
    expect(screen.getByText('María López')).toBeInTheDocument();

    // Filtrar por búsqueda
    const inputSearch = screen.getByPlaceholderText(/Buscar por docente, DNI, institución o director/i);
    fireEvent.change(inputSearch, { target: { value: 'María' } });

    expect(screen.getByText('María López')).toBeInTheDocument();
    expect(screen.queryByText('Juan Pérez')).not.toBeInTheDocument();
  });

  it('muestra alerta y no permite evaluar si el docente buscado por DNI pertenece a otra UGEL', async () => {
    mockCurrentUser = {
      dni: '10000000',
      nombres: 'Especialista',
      apellidos: 'San Román',
      rol: 1,
      region: 2, // UGEL San Román
      institucion: 'UGEL San Román',
    };

    mockBuscarUsuario.mockResolvedValueOnce({
      dni: '77889911',
      nombres: 'Carlos',
      apellidos: 'Mamani',
      region: 1, // UGEL Puno (distinta a San Román)
      institucion: 'I.E. Glorioso San Carlos',
    });

    render(
      <EvaluacionDetalleDocenteContainer
        id="eval-123"
        role="especialista"
        basePath="/especialistas/evaluaciones-docentes"
      />
    );

    const inputSearch = screen.getByPlaceholderText(/Buscar por docente, DNI, institución o director/i);
    fireEvent.change(inputSearch, { target: { value: '77889911' } });

    // Esperar a que se ejecute la verificación del DNI
    expect(await screen.findByText('Docente no pertenece a su UGEL')).toBeInTheDocument();
    expect(screen.getByText('Sin autorización')).toBeInTheDocument();
    expect(screen.getAllByText(/pertenece a la/i).length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText(/Puno/i).length).toBeGreaterThanOrEqual(1);

    // No debe haber botón para evaluar este DNI
    expect(screen.queryByRole('link', { name: /Evaluar DNI 77889911/i })).not.toBeInTheDocument();
  });

  it('muestra mensaje de no existen resultados en su UGEL si el docente con DNI no existe', async () => {
    mockCurrentUser = {
      dni: '10000000',
      nombres: 'Especialista',
      apellidos: 'San Román',
      rol: 1,
      region: 2,
    };

    mockBuscarUsuario.mockResolvedValueOnce(null);

    render(
      <EvaluacionDetalleDocenteContainer
        id="eval-123"
        role="especialista"
        basePath="/especialistas/evaluaciones-docentes"
      />
    );

    const inputSearch = screen.getByPlaceholderText(/Buscar por docente, DNI, institución o director/i);
    fireEvent.change(inputSearch, { target: { value: '99999999' } });

    expect(await screen.findByText('No existen resultados del docente con DNI 99999999 en su UGEL')).toBeInTheDocument();
    expect(screen.queryByRole('link', { name: /Evaluar DNI 99999999/i })).not.toBeInTheDocument();
  });

  it('permite evaluar si el docente con DNI pertenece a la misma UGEL del especialista', async () => {
    mockCurrentUser = {
      dni: '10000000',
      nombres: 'Especialista',
      apellidos: 'San Román',
      rol: 1,
      region: 2, // UGEL San Román
    };

    mockBuscarUsuario.mockResolvedValueOnce({
      dni: '44332211',
      nombres: 'Rosa',
      apellidos: 'Flores',
      region: 2, // UGEL San Román (coincide)
      institucion: 'I.E. Comercio 32',
    });

    render(
      <EvaluacionDetalleDocenteContainer
        id="eval-123"
        role="especialista"
        basePath="/especialistas/evaluaciones-docentes"
      />
    );

    const inputSearch = screen.getByPlaceholderText(/Buscar por docente, DNI, institución o director/i);
    fireEvent.change(inputSearch, { target: { value: '44332211' } });

    // Debe mostrar la invitación para evaluar y el botón correspondiente
    expect(await screen.findByRole('link', { name: /Evaluar DNI 44332211/i })).toBeInTheDocument();
    expect(screen.getByText(/El docente pertenece a su UGEL \(UGEL San Román\)/i)).toBeInTheDocument();
    expect(screen.getAllByText('UGEL San Román').length).toBeGreaterThanOrEqual(1);
  });

  it('muestra la UGEL real del docente (ej. UGEL Yunguyo) cuando un Administrador realiza la búsqueda', async () => {
    mockCurrentUser = {
      dni: '11223344',
      nombres: 'Administrador',
      apellidos: 'Regional',
      rol: 4,
      region: 2, // Admin registrado con San Román
      institucion: 'DRE Puno',
    };

    mockBuscarUsuario.mockResolvedValueOnce({
      dni: '40396957',
      nombres: 'MARTHA LUCIA',
      apellidos: 'MARON MAMANI',
      region: 4, // Docente de UGEL Yunguyo
      institucion: '70232 NUESTRA SEÑORA DE FÁTIMA',
    });

    render(
      <EvaluacionDetalleDocenteContainer
        id="eval-123"
        role="admin"
        basePath="/admin/evaluaciones-docentes"
      />
    );

    const inputSearch = screen.getByPlaceholderText(/Buscar por docente, DNI, institución o director/i);
    fireEvent.change(inputSearch, { target: { value: '40396957' } });

    // Debe mostrar que pertenece a la UGEL Yunguyo (NO a San Román ni "su UGEL")
    expect(await screen.findByRole('link', { name: /Evaluar DNI 40396957/i })).toBeInTheDocument();
    expect(screen.getByText('Docente MARTHA LUCIA MARON MAMANI no registra monitoreos en esta evaluación')).toBeInTheDocument();
    expect(screen.getByText('70232 NUESTRA SEÑORA DE FÁTIMA')).toBeInTheDocument();
    expect(screen.getByText('UGEL Yunguyo')).toBeInTheDocument();
    expect(screen.getByText(/El docente pertenece a la UGEL Yunguyo/i)).toBeInTheDocument();
    expect(screen.queryByText(/San Román/i)).not.toBeInTheDocument();
  });

  it('bloquea el acceso a especialistas cuando la evaluación está inactiva y muestra el mensaje correspondiente', () => {
    mockCurrentUser = defaultSpecialistUser;
    mockDataEvaluacion = {
      id: 'eval-123',
      active: false,
      name: 'RÚBRICA DE MONITOREO DOCENTE 2026',
    };

    render(
      <EvaluacionDetalleDocenteContainer
        id="eval-123"
        role="especialista"
        basePath="/especialistas/evaluaciones-docentes"
      />
    );

    expect(screen.getByText('Evaluación Inactiva o Pausada')).toBeInTheDocument();
    expect(
      screen.getByText(/no se encuentra activa en este momento\. Solo los administradores pueden activar evaluaciones/i)
    ).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /Volver a Evaluaciones Docentes/i })).toBeInTheDocument();
  });

  it('permite el acceso a administradores incluso si la evaluación está inactiva', () => {
    mockCurrentUser = defaultAdminUser;
    mockDataEvaluacion = {
      id: 'eval-123',
      active: false,
      name: 'RÚBRICA DE MONITOREO DOCENTE 2026',
    };

    render(
      <EvaluacionDetalleDocenteContainer
        id="eval-123"
        role="admin"
        basePath="/admin/evaluaciones-docentes"
      />
    );

    expect(screen.queryByText('Evaluación Inactiva o Pausada')).not.toBeInTheDocument();
    expect(screen.getByText('RÚBRICA DE MONITOREO DOCENTE 2026')).toBeInTheDocument();
  });
});
