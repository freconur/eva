import { renderHook, act } from '@testing-library/react'
import { useAgregarEvaluaciones } from '../useAgregarEvaluaciones'
import { AppAction } from '../../actions/appAction'

// 1. Mocks para Firebase Firestore
const mockDocSnapOrigen = {
  exists: jest.fn(),
  data: jest.fn(),
}

const mockGetDoc = jest.fn()
const mockGetDocs = jest.fn()
const mockBatchSet = jest.fn()
const mockBatchUpdate = jest.fn()
const mockBatchCommit = jest.fn()
const mockSetDoc = jest.fn()

jest.mock('firebase/firestore', () => ({
  getFirestore: jest.fn(() => ({})),
  doc: jest.fn((...args) => ({ path: args.join('/'), id: 'mock-eval-doc-id-456' })),
  collection: jest.fn((...args) => ({ path: args.join('/'), id: 'new-eval-id-123' })),
  getDoc: (ref: any) => mockGetDoc(ref),
  getDocs: (ref: any) => mockGetDocs(ref),
  setDoc: (...args: any[]) => mockSetDoc(...args),
  deleteDoc: jest.fn(),
  updateDoc: jest.fn(),
  increment: jest.fn(),
  orderBy: jest.fn(),
  query: jest.fn((coll) => coll),
  where: jest.fn(),
  serverTimestamp: jest.fn(() => 'MOCK_TIMESTAMP'),
  writeBatch: jest.fn(() => ({
    set: mockBatchSet,
    update: mockBatchUpdate,
    commit: mockBatchCommit,
  })),
  onSnapshot: jest.fn(),
  runTransaction: jest.fn(),
}))

jest.mock('firebase/functions', () => ({
  functions: {},
}))

jest.mock('firebase/app', () => ({
  initializeApp: jest.fn(),
  getApps: jest.fn(() => [{}]),
}))

jest.mock('@/firebase/firebase.config', () => ({
  db: {},
  functions: {},
}))

// 2. Mocks para GlobalContext
const mockDispatch = jest.fn()
jest.mock('../../context/GlolbalContext', () => ({
  useGlobalContext: () => ({
    currentUserData: { dni: '76543210', rol: 4 },
  }),
  useGlobalContextDispatch: () => mockDispatch,
}))

// 3. Mocks para react-toastify
jest.mock('react-toastify', () => ({
  toast: {
    success: jest.fn(),
    error: jest.fn(),
    warning: jest.fn(),
  },
}))

describe('useAgregarEvaluaciones - duplicarEvaluacion', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    mockBatchCommit.mockResolvedValue(undefined)
    mockSetDoc.mockResolvedValue(undefined)
  })

  test('debe duplicar correctamente una evaluación con sus preguntas y dejarla inactiva (active: false)', async () => {
    const evaluacionOrigenMock = {
      id: 'eva-origen-1',
      idDocente: '99999999',
      nombre: 'Evaluación Diagnóstica Marzo',
      grado: 3,
      categoria: 2,
      rol: 4,
      tipoDeEvaluacion: '1',
      mesDelExamen: '2',
      añoDelExamen: '2026',
      active: true, // La original estaba activa
      nivel: 1,
      realtimeEnabled: true,
      nivelYPuntaje: [
        { nivel: 'Satisfactorio', min: 15, max: 20 },
        { nivel: 'Proceso', min: 11, max: 14 },
        { nivel: 'Inicio', min: 0, max: 10 },
      ],
    }

    mockGetDoc.mockResolvedValueOnce({
      exists: () => true,
      data: () => evaluacionOrigenMock,
    })

    const preguntasOrigenDocs = [
      {
        id: '1',
        data: () => ({
          pregunta: '¿Cuánto es 2 + 2?',
          respuesta: 'a',
          order: 1,
          puntaje: '5',
          alternativas: [
            { alternativa: 'a', descripcion: '4', selected: false },
            { alternativa: 'b', descripcion: '5', selected: false },
            { alternativa: 'c', descripcion: 'no respondio', selected: false }, // Debe ser limpiada
          ],
        }),
      },
      {
        id: '2',
        data: () => ({
          pregunta: '¿Cuánto es 3 * 3?',
          respuesta: 'b',
          order: 2,
          puntaje: '15',
          alternativas: [
            { alternativa: 'a', descripcion: '6', selected: false },
            { alternativa: 'b', descripcion: '9', selected: false },
          ],
        }),
      },
    ]

    mockGetDocs.mockResolvedValueOnce(preguntasOrigenDocs)

    const { result } = renderHook(() => useAgregarEvaluaciones())

    let nuevoId: string | null = null
    await act(async () => {
      nuevoId = await result.current.duplicarEvaluacion({
        idOrigen: 'eva-origen-1',
        nuevoNombre: 'Evaluación de Salida Octubre',
        nuevoMes: '9',
        nuevoAño: '2026',
        copiarNivelYPuntaje: true,
      })
    })

    expect(nuevoId).toBeDefined()
    expect(mockBatchCommit).toHaveBeenCalled()

    // Verificar que la nueva evaluación se guarde con active: false
    const firstBatchCall = mockBatchSet.mock.calls[0]
    const evaluacionGuardada = firstBatchCall[1]
    expect(evaluacionGuardada.active).toBe(false)
    expect(evaluacionGuardada.nombre).toBe('Evaluación de Salida Octubre')
    expect(evaluacionGuardada.mesDelExamen).toBe('9')
    expect(evaluacionGuardada.añoDelExamen).toBe('2026')
    expect(evaluacionGuardada.grado).toBe(3)
    expect(evaluacionGuardada.categoria).toBe(2)
    expect(evaluacionGuardada.nivelYPuntaje).toEqual(evaluacionOrigenMock.nivelYPuntaje)

    // Verificar que el contador metadata se inicialice con 2
    const counterCall = mockBatchSet.mock.calls[1]
    expect(counterCall[1]).toEqual({ count: 2 })

    // Verificar que las preguntas se hayan clonado y "no respondio" se haya removido de alternativas
    const pregunta1Call = mockBatchSet.mock.calls[2]
    const dataPregunta1 = pregunta1Call[1]
    expect(dataPregunta1.pregunta).toBe('¿Cuánto es 2 + 2?')
    expect(dataPregunta1.order).toBe(1)
    expect(dataPregunta1.puntaje).toBe('5')
    expect(dataPregunta1.alternativas).toEqual([
      { alternativa: 'a', descripcion: '4', selected: false },
      { alternativa: 'b', descripcion: '5', selected: false },
    ])

    const pregunta2Call = mockBatchSet.mock.calls[3]
    const dataPregunta2 = pregunta2Call[1]
    expect(dataPregunta2.pregunta).toBe('¿Cuánto es 3 * 3?')
    expect(dataPregunta2.order).toBe(2)
    expect(dataPregunta2.puntaje).toBe('15')
  })

  test('duplicarEvaluacionesMasivas debe procesar múltiples evaluaciones e invocar callback de progreso', async () => {
    const evaluacionMock = {
      id: 'eva-1',
      idDocente: '99999999',
      nombre: 'Evaluación Original',
      grado: 1,
      categoria: 1,
      rol: 4,
      tipoDeEvaluacion: '1',
      mesDelExamen: '0',
      añoDelExamen: '2026',
      active: true,
    }

    mockGetDoc.mockResolvedValue({
      exists: () => true,
      data: () => evaluacionMock,
      id: 'eva-1',
    })

    mockGetDocs.mockResolvedValue({
      size: 0,
      forEach: jest.fn(),
    })

    const { result } = renderHook(() => useAgregarEvaluaciones())

    const progressReports: { current: number; total: number }[] = []
    let duplicatedIds: string[] = []

    await act(async () => {
      duplicatedIds = await result.current.duplicarEvaluacionesMasivas({
        evaluacionesConfig: [
          { idOrigen: 'eva-1', nuevoNombre: 'Copia 1 08.08.2026', nuevoMes: '7', nuevoAño: '2026' },
          { idOrigen: 'eva-1', nuevoNombre: 'Copia 2 08.08.2026', nuevoMes: '7', nuevoAño: '2026' },
        ],
        copiarNivelYPuntaje: true,
        onProgress: (current, total) => {
          progressReports.push({ current, total })
        },
      })
    })

    expect(duplicatedIds.length).toBe(2)
    expect(progressReports).toEqual([
      { current: 1, total: 2 },
      { current: 2, total: 2 },
    ])
  })

  test('cleanExistingDateFromNombre debe limpiar correctamente fechas previas del nombre', () => {
    const { cleanExistingDateFromNombre } = require('@/modals/duplicarEvaluacion')

    expect(cleanExistingDateFromNombre('1ero matematica 07.07.2026')).toBe('1ero matematica')
    expect(cleanExistingDateFromNombre('1ero matematica - 07.07.2026')).toBe('1ero matematica')
    expect(cleanExistingDateFromNombre('1ero matematica 07/07/2026')).toBe('1ero matematica')
    expect(cleanExistingDateFromNombre('1ero matematica 7.7.2026')).toBe('1ero matematica')
    expect(cleanExistingDateFromNombre('1ero matematica 15.10.2026')).toBe('1ero matematica')
    expect(cleanExistingDateFromNombre('1ero matematica')).toBe('1ero matematica')
  })

  test('generarNuevoNombreEvaluacion debe reemplazar el mes y fecha de forma inteligente', () => {
    const dayjs = require('dayjs')
    const { generarNuevoNombreEvaluacion } = require('@/modals/duplicarEvaluacion')

    // Fecha objetivo: 15 de octubre de 2026 (mes 9 en 0-indexed dayjs)
    const targetDate = dayjs('2026-10-15')

    // Caso 1: Con mes en minúsculas y fecha
    expect(
      generarNuevoNombreEvaluacion('1ero matematica marzo 01.03.2026', targetDate)
    ).toBe('1ero matematica octubre 15.10.2026')

    // Caso 2: Con mes capitalizado (Marzo)
    expect(
      generarNuevoNombreEvaluacion('1ero matematica Marzo 01.03.2026', targetDate)
    ).toBe('1ero matematica Octubre 15.10.2026')

    // Caso 3: Con mes en mayúsculas (MARZO)
    expect(
      generarNuevoNombreEvaluacion('1ero matematica MARZO 01.03.2026', targetDate)
    ).toBe('1ero matematica OCTUBRE 15.10.2026')

    // Caso 4: Con separadores (- Marzo - 01.03.2026)
    expect(
      generarNuevoNombreEvaluacion('1ero matematica - Marzo - 01.03.2026', targetDate)
    ).toBe('1ero matematica Octubre 15.10.2026')

    // Caso 5: Solo fecha numérica (sin mes en texto)
    expect(
      generarNuevoNombreEvaluacion('1ero matematica 01.03.2026', targetDate)
    ).toBe('1ero matematica 15.10.2026')

    // Caso 6: Sin fecha ni mes previo
    expect(
      generarNuevoNombreEvaluacion('1ero matematica', targetDate)
    ).toBe('1ero matematica 15.10.2026')
  })
})
