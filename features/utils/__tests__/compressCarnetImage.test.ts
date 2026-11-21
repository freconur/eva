import { compressCarnetImage } from '../compressCarnetImage';

describe('compressCarnetImage', () => {
  const originalFileReader = global.FileReader;
  const originalImage = global.Image;

  beforeEach(() => {
    jest.clearAllMocks();
  });

  afterEach(() => {
    global.FileReader = originalFileReader;
    global.Image = originalImage;
  });

  test('rechaza si el archivo no es de tipo imagen', async () => {
    const invalidFile = new File(['dummy content'], 'documento.pdf', {
      type: 'application/pdf',
    });

    await expect(compressCarnetImage(invalidFile)).rejects.toThrow(
      'El archivo seleccionado no es una imagen válida.'
    );
  });

  test('comprime y encuadra foto carnet a proporción 5:6 y peso menor a 45 KB', async () => {
    // Mock de FileReader
    class MockFileReader {
      onload: any = null;
      readAsDataURL() {
        setTimeout(() => {
          if (this.onload) {
            this.onload({ target: { result: 'data:image/jpeg;base64,mockcarnet' } });
          }
        }, 10);
      }
    }
    // @ts-ignore
    global.FileReader = MockFileReader;

    // Mock de Image (foto rectangular horizontal para probar center-crop)
    class MockImage {
      width = 1200;
      height = 800;
      onload: any = null;
      set src(_val: string) {
        setTimeout(() => {
          if (this.onload) this.onload();
        }, 10);
      }
    }
    // @ts-ignore
    global.Image = MockImage;

    // Mock de Canvas
    let attempts = 0;
    const mockToBlob = jest.fn((callback, _mime, _quality) => {
      attempts++;
      // Simulamos que la compresión produce un blob ligero de ~25 KB
      const simulatedSize = 25 * 1024;
      const fakeBlob = new Blob([new Uint8Array(simulatedSize)], {
        type: 'image/jpeg',
      });
      callback(fakeBlob);
    });

    const mockDrawImage = jest.fn();
    const mockGetContext = jest.fn(() => ({
      fillStyle: '',
      fillRect: jest.fn(),
      drawImage: mockDrawImage,
      imageSmoothingEnabled: false,
      imageSmoothingQuality: 'low',
    }));

    jest.spyOn(document, 'createElement').mockImplementation((tagName: string) => {
      if (tagName === 'canvas') {
        return {
          width: 0,
          height: 0,
          getContext: mockGetContext,
          toBlob: mockToBlob,
          toDataURL: jest.fn(() => 'data:image/jpeg;base64,compressedMock'),
        } as any;
      }
      return document.createElement(tagName);
    });

    const file = new File(['estudiante_foto_raw'], 'foto_estudiante.jpg', {
      type: 'image/jpeg',
    });

    const result = await compressCarnetImage(file);

    expect(result).toBeDefined();
    expect(result.blob.size).toBe(25 * 1024);
    expect(result.sizeInKb).toBe(25);
    expect(result.dataUrl).toContain('data:image/jpeg;base64,compressedMock');
    expect(result.width).toBe(300);
    expect(result.height).toBe(360);
    expect(mockDrawImage).toHaveBeenCalled();
  });

  test('respeta coordenadas de recorte manual (customCrop) cuando se proveen', async () => {
    class MockFileReader {
      onload: any = null;
      readAsDataURL() {
        setTimeout(() => {
          if (this.onload) {
            this.onload({ target: { result: 'data:image/jpeg;base64,mockcarnet' } });
          }
        }, 10);
      }
    }
    // @ts-ignore
    global.FileReader = MockFileReader;

    class MockImage {
      width = 1600;
      height = 900;
      onload: any = null;
      set src(_val: string) {
        setTimeout(() => {
          if (this.onload) this.onload();
        }, 10);
      }
    }
    // @ts-ignore
    global.Image = MockImage;

    const mockDrawImage = jest.fn();
    const mockToBlob = jest.fn((callback) => {
      callback(new Blob([new Uint8Array(20 * 1024)], { type: 'image/jpeg' }));
    });

    jest.spyOn(document, 'createElement').mockImplementation((tagName: string) => {
      if (tagName === 'canvas') {
        return {
          width: 0,
          height: 0,
          getContext: jest.fn(() => ({
            fillStyle: '',
            fillRect: jest.fn(),
            drawImage: mockDrawImage,
            imageSmoothingEnabled: false,
            imageSmoothingQuality: 'low',
          })),
          toBlob: mockToBlob,
          toDataURL: jest.fn(() => 'data:image/jpeg;base64,customCropMock'),
        } as any;
      }
      return document.createElement(tagName);
    });

    const file = new File(['dummy'], 'horizontal_photo.jpg', { type: 'image/jpeg' });
    const customCrop = {
      cropX: 850,
      cropY: 50,
      cropWidth: 500,
      cropHeight: 600,
    };

    const result = await compressCarnetImage(file, { customCrop });

    expect(result).toBeDefined();
    expect(mockDrawImage).toHaveBeenCalledWith(
      expect.anything(),
      850,
      50,
      500,
      600,
      0,
      0,
      expect.any(Number),
      expect.any(Number)
    );
  });
});
