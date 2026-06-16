import { useReporteEspecialistas } from '../useReporteEspecialistas';
import { AppAction } from '../../actions/appAction';

// 1. Spies/Mocks para Firebase Firestore
const mockDocSnap = {
  exists: jest.fn(),
  data: jest.fn(),
};

const mockGetDoc = jest.fn();
const mockGetDocs = jest.fn();
const mockGetCountFromServer = jest.fn();

jest.mock('firebase/firestore', () => ({
  getFirestore: jest.fn(() => ({})),
  doc: jest.fn((db, path) => ({ path })),
  getDoc: (ref: any) => mockGetDoc(ref),
  getDocs: (ref: any) => mockGetDocs(ref),
  collection: jest.fn((db, path) => ({ path })),
  query: jest.fn((coll, ...conds) => ({ coll, conds })),
  where: jest.fn((field, op, val) => ({ field, op, val })),
  getCountFromServer: (q: any) => mockGetCountFromServer(q),
}));

// 2. Mocks para el Contexto Global
const mockDispatch = jest.fn();
jest.mock('../../context/GlolbalContext', () => ({
  useGlobalContext: () => ({
    currentUserData: { dni: '12345678', region: '9' },
  }),
  useGlobalContextDispatch: () => mockDispatch,
}));

describe('useReporteEspecialistas - getDataGraficoPieChart', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('Caso A: Realtime habilitado con filtro de UGEL específica (Notación por punto)', async () => {
    const evaluacionMock: any = {
      realtimeEnabled: true,
      nivelYPuntaje: [
        { nivel: 'Satisfactorio', min: 10, max: 20 },
        { nivel: 'En Proceso', min: 5, max: 9 },
      ],
    };

    // Simulamos que el documento de la región tiene los datos en notación plana de puntos
    mockGetDoc.mockResolvedValueOnce({
      exists: () => true,
      data: () => ({
        regionId: 9,
        'niveles.satisfactorio': 2,
        'niveles.en proceso': 0,
        totalEstudiantes: 2,
      }),
    });

    const { getDataGraficoPieChart } = useReporteEspecialistas();

    await getDataGraficoPieChart(
      'gigyMtzGhe157gAQ15mr', // idEvaluacion
      5,                      // mes (June)
      evaluacionMock,         // evaluacion
      undefined,              // filtroGenero
      '9',                    // filtroRegion
      2026                    // yearSelected
    );

    // Verificar despachos al reducer global
    expect(mockDispatch).toHaveBeenCalledWith({
      type: AppAction.LOADER_DATA_GRAFICO_PIE_CHART,
      payload: true,
    });

    expect(mockDispatch).toHaveBeenCalledWith({
      type: AppAction.DATA_GRAFICO_PIE_CHART,
      payload: [
        {
          mes: 5,
          niveles: [
            { nivel: 'Satisfactorio', cantidadDeEstudiantes: 2 },
            { nivel: 'En Proceso', cantidadDeEstudiantes: 0 },
          ],
        },
      ],
    });

    expect(mockDispatch).toHaveBeenCalledWith({
      type: AppAction.LOADER_DATA_GRAFICO_PIE_CHART,
      payload: false,
    });
  });

  test('Caso B: Realtime habilitado sin filtro de UGEL (Suma de múltiples regiones mixtas)', async () => {
    const evaluacionMock: any = {
      realtimeEnabled: true,
      nivelYPuntaje: [
        { nivel: 'Satisfactorio', min: 10, max: 20 },
        { nivel: 'En Proceso', min: 5, max: 9 },
      ],
    };

    // Simulamos que la colección devuelve dos regiones (una con campos planos y otra con mapa anidado)
    const mockDocs = [
      {
        id: '9',
        data: () => ({
          regionId: 9,
          'niveles.satisfactorio': 2,
          'niveles.en proceso': 1,
        }),
      },
      {
        id: '10',
        data: () => ({
          regionId: 10,
          niveles: {
            satisfactorio: 3,
            'en proceso': 0,
          },
        }),
      },
    ];

    mockGetDocs.mockResolvedValueOnce({
      forEach: (callback: any) => mockDocs.forEach(callback),
    });

    const { getDataGraficoPieChart } = useReporteEspecialistas();

    await getDataGraficoPieChart(
      'gigyMtzGhe157gAQ15mr',
      5,
      evaluacionMock,
      undefined,
      '', // Todas las UGELs
      2026
    );

    expect(mockDispatch).toHaveBeenCalledWith({
      type: AppAction.DATA_GRAFICO_PIE_CHART,
      payload: [
        {
          mes: 5,
          niveles: [
            { nivel: 'Satisfactorio', cantidadDeEstudiantes: 5 }, // 2 de región 9 + 3 de región 10
            { nivel: 'En Proceso', cantidadDeEstudiantes: 1 },    // 1 de región 9 + 0 de región 10
          ],
        },
      ],
    });
  });

  test('Caso C: Realtime deshabilitado (Compatibilidad hacia atrás con consultas tradicionales)', async () => {
    const evaluacionMock: any = {
      realtimeEnabled: false,
      nivelYPuntaje: [
        { nivel: 'Satisfactorio', min: 10, max: 20 },
      ],
    };

    // Simulamos la respuesta de getCountFromServer
    // 1. Primer llamado para conteo total de la colección
    mockGetCountFromServer.mockResolvedValueOnce({
      data: () => ({ count: 10 }),
    });
    // 2. Segundo llamado para el nivel 'Satisfactorio'
    mockGetCountFromServer.mockResolvedValueOnce({
      data: () => ({ count: 8 }),
    });

    const { getDataGraficoPieChart } = useReporteEspecialistas();

    await getDataGraficoPieChart(
      'gigyMtzGhe157gAQ15mr',
      5,
      evaluacionMock,
      undefined,
      '9',
      2026
    );

    // Debe llamar a getCountFromServer para resolver los estudiantes filtrados
    expect(mockGetCountFromServer).toHaveBeenCalledTimes(2);

    expect(mockDispatch).toHaveBeenCalledWith({
      type: AppAction.DATA_GRAFICO_PIE_CHART,
      payload: [
        {
          mes: 5,
          niveles: [
            { nivel: 'Satisfactorio', cantidadDeEstudiantes: 10 }, // 8 del conteo + 2 del diferencial (10 total - 8 satisfactorio = 2)
          ],
        },
      ],
    });
  });
});
