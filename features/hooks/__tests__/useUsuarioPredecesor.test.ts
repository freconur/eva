import { renderHook, act } from '@testing-library/react';
import useUsuario from '../useUsuario';
import { updateDoc, arrayUnion, arrayRemove, deleteField, getDoc } from 'firebase/firestore';

const mockUpdateDoc = jest.fn().mockResolvedValue(undefined);
const mockArrayUnion = jest.fn((val) => ({ type: 'arrayUnion', val }));
const mockArrayRemove = jest.fn((val) => ({ type: 'arrayRemove', val }));
const mockDeleteField = jest.fn(() => ({ type: 'deleteField' }));
const mockGetDoc = jest.fn();

jest.mock('firebase/firestore', () => ({
  getFirestore: jest.fn(() => ({})),
  doc: jest.fn((_db, col, id) => ({ id, path: `${col}/${id}` })),
  collection: jest.fn((_db, path) => ({ path })),
  getDoc: (...args: any[]) => mockGetDoc(...args),
  getDocs: jest.fn().mockResolvedValue({ empty: true, size: 0, docs: [] }),
  setDoc: jest.fn().mockResolvedValue(undefined),
  updateDoc: (...args: any[]) => mockUpdateDoc(...args),
  deleteDoc: jest.fn().mockResolvedValue(undefined),
  query: jest.fn((col) => col),
  where: jest.fn(),
  orderBy: jest.fn(),
  limit: jest.fn(),
  arrayUnion: (...args: any[]) => mockArrayUnion(...args),
  arrayRemove: (...args: any[]) => mockArrayRemove(...args),
  deleteField: () => mockDeleteField(),
  serverTimestamp: jest.fn(() => 'TIMESTAMP_MOCK'),
  increment: jest.fn(),
  onSnapshot: jest.fn(),
}));

jest.mock('firebase/auth', () => ({
  getAuth: jest.fn(() => ({})),
  onAuthStateChanged: jest.fn(),
  signInWithEmailAndPassword: jest.fn(),
  signOut: jest.fn(),
  setPersistence: jest.fn(),
  browserLocalPersistence: {},
}));

jest.mock('@/firebase/firebase.config', () => ({
  app: {},
  auth: {},
  db: {},
}));

const mockDispatch = jest.fn();
let mockCurrentUser = {
  dni: '10000001',
  rol: 2,
  dniDirectorPredecesor: '20000002',
  directoresPredecesores: ['20000002', '30000003'],
};

jest.mock('@/features/context/GlolbalContext', () => ({
  useGlobalContext: () => ({
    currentUserData: mockCurrentUser,
    docentesDeDirectores: [],
    usuariosDirectores: [],
  }),
  useGlobalContextDispatch: () => mockDispatch,
}));

describe('useUsuario - Director Predecesor vincular y desvincular', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('debe vincular un nuevo director predecesor usando arrayUnion y seteando dniDirectorPredecesor', async () => {
    mockGetDoc
      .mockResolvedValueOnce({
        exists: () => true,
        data: () => ({ dni: '20000002', nombres: 'Predecesor Uno' }),
      })
      .mockResolvedValueOnce({
        exists: () => true,
        data: () => ({
          dni: '10000001',
          dniDirectorPredecesor: undefined,
          directoresPredecesores: [],
        }),
      });

    const { result } = renderHook(() => useUsuario());

    let res: any;
    await act(async () => {
      res = await result.current.vincularDirectorPredecesor('10000001', '20000002');
    });

    expect(res.success).toBe(true);
    expect(mockArrayUnion).toHaveBeenCalledWith('20000002');
    expect(mockUpdateDoc).toHaveBeenCalledWith(
      expect.anything(),
      expect.objectContaining({
        dniDirectorPredecesor: '20000002',
        directoresPredecesores: expect.objectContaining({ type: 'arrayUnion', val: '20000002' }),
      })
    );
  });

  it('debe desvincular un director predecesor específico con arrayRemove sin borrar el campo array', async () => {
    mockGetDoc.mockResolvedValueOnce({
      exists: () => true,
      data: () => ({
        dni: '10000001',
        dniDirectorPredecesor: '20000002',
        directoresPredecesores: ['20000002', '30000003'],
      }),
    });

    const { result } = renderHook(() => useUsuario());

    let res: any;
    await act(async () => {
      res = await result.current.desvincularDirectorPredecesor('10000001', '20000002');
    });

    expect(res.success).toBe(true);
    expect(mockArrayRemove).toHaveBeenCalledWith('20000002');
    // Como quedaba '30000003', dniDirectorPredecesor pasa al restante
    expect(mockUpdateDoc).toHaveBeenCalledWith(
      expect.anything(),
      expect.objectContaining({
        directoresPredecesores: expect.objectContaining({ type: 'arrayRemove', val: '20000002' }),
        dniDirectorPredecesor: '30000003',
      })
    );
  });

  it('debe borrar dniDirectorPredecesor con deleteField() si no quedan predecesores, pero usando arrayRemove para el array', async () => {
    mockGetDoc.mockResolvedValueOnce({
      exists: () => true,
      data: () => ({
        dni: '10000001',
        dniDirectorPredecesor: '20000002',
        directoresPredecesores: ['20000002'],
      }),
    });

    const { result } = renderHook(() => useUsuario());

    let res: any;
    await act(async () => {
      res = await result.current.desvincularDirectorPredecesor('10000001', '20000002');
    });

    expect(res.success).toBe(true);
    expect(mockArrayRemove).toHaveBeenCalledWith('20000002');
    expect(mockDeleteField).toHaveBeenCalled();
    expect(mockUpdateDoc).toHaveBeenCalledWith(
      expect.anything(),
      expect.objectContaining({
        directoresPredecesores: expect.objectContaining({ type: 'arrayRemove', val: '20000002' }),
        dniDirectorPredecesor: expect.objectContaining({ type: 'deleteField' }),
      })
    );
  });
});
