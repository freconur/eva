import { renderHook, act } from '@testing-library/react';
import useEvaluacionesBannerConfig from '../useEvaluacionesBannerConfig';
import { toast } from 'react-toastify';

let mockSnapshotCallback: any = null;
const mockSetDoc = jest.fn();

jest.mock('firebase/firestore', () => ({
  getFirestore: jest.fn(() => ({})),
  doc: jest.fn(() => ({ id: 'mockDoc' })),
  onSnapshot: jest.fn((ref, callback) => {
    mockSnapshotCallback = callback;
    return jest.fn(); // Unsubscribe
  }),
  setDoc: (...args: any[]) => mockSetDoc(...args),
}));

const mockUploadBytes = jest.fn();
const mockGetDownloadURL = jest.fn();

jest.mock('firebase/storage', () => ({
  getStorage: jest.fn(() => ({})),
  ref: jest.fn(() => ({ fullPath: 'mock/path' })),
  uploadBytes: (...args: any[]) => mockUploadBytes(...args),
  getDownloadURL: (...args: any[]) => mockGetDownloadURL(...args),
}));

jest.mock('@/firebase/firebase.config', () => ({
  storage: {},
  db: {},
}));

const mockCompressBannerImage = jest.fn();
jest.mock('@/features/utils/compressBannerImage', () => ({
  compressBannerImage: (...args: any[]) => mockCompressBannerImage(...args),
}));

jest.mock('react-toastify', () => ({
  toast: {
    success: jest.fn(),
    error: jest.fn(),
    warning: jest.fn(),
    loading: jest.fn(() => 'toast-id'),
    update: jest.fn(),
  },
}));

let mockCurrentUser: any = { dni: '12345678', rol: 4 };

jest.mock('@/features/context/GlolbalContext', () => ({
  useGlobalContext: () => ({
    currentUserData: mockCurrentUser,
  }),
}));

describe('useEvaluacionesBannerConfig', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    sessionStorage.clear();
    mockCurrentUser = { dni: '12345678', rol: 4 };
  });

  test('inicia con defaultVariant compact y se actualiza cuando Firestore emite datos', () => {
    const { result } = renderHook(() =>
      useEvaluacionesBannerConfig({ routeKey: 'directores' })
    );

    expect(result.current.variant).toBe('compact');
    expect(result.current.isAuditing).toBe(true);

    // Simular que Firestore envía configuración 'expanded' para 'directores'
    act(() => {
      if (mockSnapshotCallback) {
        mockSnapshotCallback({
          exists: () => true,
          data: () => ({
            directores: {
              variant: 'expanded',
              backgroundImage: 'https://fake.url/bg.jpg',
            },
          }),
        });
      }
    });

    expect(result.current.variant).toBe('expanded');
    expect(result.current.backgroundImage).toBe('https://fake.url/bg.jpg');
  });

  test('detecta no auditoría cuando el usuario no es admin ni tiene sessionStorage', () => {
    mockCurrentUser = { dni: '87654321', rol: 2 }; // Docente

    const { result } = renderHook(() =>
      useEvaluacionesBannerConfig({ routeKey: 'directores' })
    );

    expect(result.current.isAuditing).toBe(false);
  });

  test('detecta auditoría cuando sessionStorage tiene audited_user', () => {
    mockCurrentUser = { dni: '87654321', rol: 2 };
    sessionStorage.setItem('audited_user', 'true');

    const { result } = renderHook(() =>
      useEvaluacionesBannerConfig({ routeKey: 'directores' })
    );

    expect(result.current.isAuditing).toBe(true);
  });

  test('setBannerVariant guarda la variante en Firestore si es auditor', async () => {
    mockSetDoc.mockResolvedValueOnce(undefined);

    const { result } = renderHook(() =>
      useEvaluacionesBannerConfig({ routeKey: 'directores' })
    );

    await act(async () => {
      await result.current.setBannerVariant('expanded');
    });

    expect(mockSetDoc).toHaveBeenCalledWith(
      expect.anything(),
      expect.objectContaining({
        directores: expect.objectContaining({
          variant: 'expanded',
        }),
      }),
      { merge: true }
    );
    expect(toast.success).toHaveBeenCalledWith(
      expect.stringContaining('Grande')
    );
    expect(result.current.variant).toBe('expanded');
  });

  test('uploadBannerImage comprime la imagen a <= 100 KB, la sube y actualiza Firestore', async () => {
    const fakeBlob = new Blob([new Uint8Array(90 * 1024)], { type: 'image/jpeg' });
    mockCompressBannerImage.mockResolvedValueOnce(fakeBlob);
    mockUploadBytes.mockResolvedValueOnce({ ref: { fullPath: 'path' } });
    mockGetDownloadURL.mockResolvedValueOnce('https://storage.google.com/banner.jpg');
    mockSetDoc.mockResolvedValueOnce(undefined);

    const { result } = renderHook(() =>
      useEvaluacionesBannerConfig({ routeKey: 'directores' })
    );

    const fakeFile = new File(['image_bytes'], 'banner.png', { type: 'image/png' });

    let uploadedUrl: string | null = null;
    await act(async () => {
      uploadedUrl = await result.current.uploadBannerImage(fakeFile);
    });

    expect(mockCompressBannerImage).toHaveBeenCalledWith(fakeFile, 100 * 1024);
    expect(mockUploadBytes).toHaveBeenCalled();
    expect(mockGetDownloadURL).toHaveBeenCalled();
    expect(mockSetDoc).toHaveBeenCalledWith(
      expect.anything(),
      expect.objectContaining({
        directores: expect.objectContaining({
          backgroundImage: 'https://storage.google.com/banner.jpg',
        }),
      }),
      { merge: true }
    );
    expect(uploadedUrl).toBe('https://storage.google.com/banner.jpg');
  });

  test('removeBannerImage elimina la imagen de Firestore y restaura el estado', async () => {
    mockSetDoc.mockResolvedValueOnce(undefined);

    const { result } = renderHook(() =>
      useEvaluacionesBannerConfig({ routeKey: 'directores' })
    );

    await act(async () => {
      await result.current.removeBannerImage();
    });

    expect(mockSetDoc).toHaveBeenCalledWith(
      expect.anything(),
      expect.objectContaining({
        directores: expect.objectContaining({
          backgroundImage: null,
        }),
      }),
      { merge: true }
    );
    expect(toast.success).toHaveBeenCalledWith(
      expect.stringContaining('eliminada')
    );
    expect(result.current.backgroundImage).toBeNull();
  });

  test('updateBannerTexts guarda título y subtítulo en Firestore y actualiza el estado', async () => {
    mockSetDoc.mockResolvedValueOnce(undefined);

    const { result } = renderHook(() =>
      useEvaluacionesBannerConfig({ routeKey: 'directores' })
    );

    await act(async () => {
      await result.current.updateBannerTexts('TITULO ADMIN', 'SUBTITULO ADMIN');
    });

    expect(mockSetDoc).toHaveBeenCalledWith(
      expect.anything(),
      expect.objectContaining({
        directores: expect.objectContaining({
          title: 'TITULO ADMIN',
          subtitle: 'SUBTITULO ADMIN',
        }),
      }),
      { merge: true }
    );
    expect(toast.success).toHaveBeenCalledWith(
      expect.stringContaining('actualizados')
    );
    expect(result.current.customTitle).toBe('TITULO ADMIN');
    expect(result.current.customSubtitle).toBe('SUBTITULO ADMIN');
  });

  test('resetBannerTexts restablece título y subtítulo en Firestore a null', async () => {
    mockSetDoc.mockResolvedValueOnce(undefined);

    const { result } = renderHook(() =>
      useEvaluacionesBannerConfig({ routeKey: 'directores' })
    );

    await act(async () => {
      await result.current.resetBannerTexts();
    });

    expect(mockSetDoc).toHaveBeenCalledWith(
      expect.anything(),
      expect.objectContaining({
        directores: expect.objectContaining({
          title: null,
          subtitle: null,
        }),
      }),
      { merge: true }
    );
    expect(toast.success).toHaveBeenCalledWith(
      expect.stringContaining('restaurados')
    );
    expect(result.current.customTitle).toBeNull();
    expect(result.current.customSubtitle).toBeNull();
  });
});
