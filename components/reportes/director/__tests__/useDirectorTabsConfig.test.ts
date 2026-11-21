import { renderHook, act } from '@testing-library/react';
import { useDirectorTabsConfig, DEFAULT_DIRECTOR_TAB_VISIBILITY } from '../useDirectorTabsConfig';

// Mock de Firestore
const mockSetDoc = jest.fn().mockResolvedValue(undefined);
let snapshotCallback: ((snap: any) => void) | null = null;

jest.mock('firebase/firestore', () => ({
  getFirestore: jest.fn(() => ({})),
  doc: jest.fn((_db, collection, docId) => ({ path: `${collection}/${docId}` })),
  setDoc: (...args: any[]) => mockSetDoc(...args),
  onSnapshot: jest.fn((_docRef, cb) => {
    snapshotCallback = cb;
    return () => {};
  }),
}));

jest.mock('@/features/context/GlolbalContext', () => ({
  useGlobalContext: jest.fn(() => ({
    currentUserData: { dni: 'admin123', rol: 4 },
  })),
}));

jest.mock('react-toastify', () => ({
  toast: {
    success: jest.fn(),
    error: jest.fn(),
    warning: jest.fn(),
  },
}));

describe('useDirectorTabsConfig Hook', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    snapshotCallback = null;
  });

  it('inicia con todas las pestañas visibles por defecto (tabVisibility)', () => {
    const { result } = renderHook(() => useDirectorTabsConfig());
    expect(result.current.tabVisibility).toEqual(DEFAULT_DIRECTOR_TAB_VISIBILITY);
    expect(result.current.tabVisibility.evolucion).toBe(true);
  });

  it('actualiza la visibilidad de una pestaña cuando llega un snapshot con tabVisibility', () => {
    const { result } = renderHook(() => useDirectorTabsConfig());

    expect(result.current.tabVisibility.evolucion).toBe(true);

    // Simular actualización en tiempo real desde Firestore
    act(() => {
      if (snapshotCallback) {
        snapshotCallback({
          exists: () => true,
          data: () => ({
            tabVisibility: {
              evolucion: false,
            },
          }),
        });
      }
    });

    expect(result.current.tabVisibility.evolucion).toBe(false);
    expect(result.current.tabVisibility.grilla).toBe(true);
  });

  it('guarda correctamente la visibilidad con saveTabVisibility y setDoc en Firestore', async () => {
    const { result } = renderHook(() => useDirectorTabsConfig());

    let success = false;
    await act(async () => {
      success = await result.current.saveTabVisibility('evolucion', false);
    });

    expect(success).toBe(true);
    expect(result.current.tabVisibility.evolucion).toBe(false);
    expect(mockSetDoc).toHaveBeenCalledWith(
      expect.objectContaining({ path: 'configuraciones/reporte_director_tabs' }),
      expect.objectContaining({
        tabVisibility: {
          evolucion: false,
        },
      }),
      { merge: true }
    );
  });
});
