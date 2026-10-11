import { renderHook, act } from '@testing-library/react';

// Mock de @/firebase/firebase.config
jest.mock('@/firebase/firebase.config', () => ({
  db: {},
  storage: {},
}));

import { useReportesBannerConfig } from '../useReportesBannerConfig';

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

// Mock de Firebase Storage
jest.mock('firebase/storage', () => ({
  getStorage: jest.fn(() => ({})),
  ref: jest.fn((_storage, path) => ({ fullPath: path })),
  uploadBytes: jest.fn().mockResolvedValue({}),
  getDownloadURL: jest.fn().mockResolvedValue('https://storage.mock/banner-uploaded.jpg'),
  deleteObject: jest.fn().mockResolvedValue(undefined),
}));

// Mock de compressBannerImage
jest.mock('@/features/utils/compressBannerImage', () => ({
  compressBannerImage: jest.fn((file) => Promise.resolve(file)),
}));

describe('useReportesBannerConfig Hook', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    snapshotCallback = null;
  });

  it('inicia con los valores por defecto para el rol especificado', () => {
    const { result } = renderHook(() =>
      useReportesBannerConfig({ routeKey: 'directores' })
    );

    expect(result.current.variant).toBe('compact');
    expect(result.current.backgroundImage).toBeNull();
    expect(result.current.backgroundImageOpacity).toBe(0.25);
    expect(result.current.loadingConfig).toBe(true);
  });

  it('actualiza el estado cuando Firestore emite cambios en tiempo real', () => {
    const { result } = renderHook(() =>
      useReportesBannerConfig({ routeKey: 'directores' })
    );

    act(() => {
      snapshotCallback?.({
        exists: () => true,
        data: () => ({
          directores: {
            variant: 'expanded',
            backgroundImage: 'https://ejemplo.com/fondo-directores.jpg',
            backgroundImageOpacity: 0.35,
          },
          especialistas: {
            variant: 'compact',
          },
        }),
      });
    });

    expect(result.current.variant).toBe('expanded');
    expect(result.current.backgroundImage).toBe('https://ejemplo.com/fondo-directores.jpg');
    expect(result.current.backgroundImageOpacity).toBe(0.35);
    expect(result.current.loadingConfig).toBe(false);
  });

  it('permite cambiar la variante y persiste en Firestore con el rol correspondiente', async () => {
    const { result } = renderHook(() =>
      useReportesBannerConfig({ routeKey: 'especialistas' })
    );

    await act(async () => {
      await result.current.setBannerVariant('expanded');
    });

    expect(mockSetDoc).toHaveBeenCalledWith(
      { path: 'configuraciones/reportes_banner' },
      expect.objectContaining({
        especialistas: expect.objectContaining({
          variant: 'expanded',
        }),
      }),
      { merge: true }
    );
    expect(result.current.variant).toBe('expanded');
  });

  it('permite eliminar la imagen de fondo y actualizar Firestore', async () => {
    const { result } = renderHook(() =>
      useReportesBannerConfig({ routeKey: 'docentes' })
    );

    // Simular que ya tiene imagen
    act(() => {
      snapshotCallback?.({
        exists: () => true,
        data: () => ({
          docentes: {
            variant: 'expanded',
            backgroundImage: 'https://storage.mock/banner-uploaded.jpg',
          },
        }),
      });
    });

    await act(async () => {
      await result.current.removeBannerImage();
    });

    expect(mockSetDoc).toHaveBeenCalledWith(
      { path: 'configuraciones/reportes_banner' },
      expect.objectContaining({
        docentes: expect.objectContaining({
          backgroundImage: null,
        }),
      }),
      { merge: true }
    );
    expect(result.current.backgroundImage).toBeNull();
  });
});
