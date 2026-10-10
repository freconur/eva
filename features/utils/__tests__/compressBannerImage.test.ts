import { compressBannerImage } from '../compressBannerImage';

describe('compressBannerImage', () => {
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

    await expect(compressBannerImage(invalidFile)).rejects.toThrow(
      'El archivo seleccionado no es una imagen válida.'
    );
  });

  test('comprime la imagen asegurando que el blob resultante no supere 100 KB', async () => {
    // Mock de FileReader
    class MockFileReader {
      onload: any = null;
      readAsDataURL() {
        setTimeout(() => {
          if (this.onload) {
            this.onload({ target: { result: 'data:image/jpeg;base64,mockdata' } });
          }
        }, 10);
      }
    }
    // @ts-ignore
    global.FileReader = MockFileReader;

    // Mock de Image
    class MockImage {
      width = 2400;
      height = 1200;
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
    const mockToBlob = jest.fn((callback, _mime, quality) => {
      attempts++;
      // Simulamos que la primera llamada produce 150 KB, y la segunda se ajusta a 85 KB (<= 100 KB)
      const simulatedSize = attempts === 1 ? 150 * 1024 : 85 * 1024;
      const fakeBlob = new Blob([new Uint8Array(simulatedSize)], {
        type: 'image/jpeg',
      });
      callback(fakeBlob);
    });

    const mockGetContext = jest.fn(() => ({
      fillStyle: '',
      fillRect: jest.fn(),
      drawImage: jest.fn(),
    }));

    jest.spyOn(document, 'createElement').mockImplementation((tagName: string) => {
      if (tagName === 'canvas') {
        return {
          width: 0,
          height: 0,
          getContext: mockGetContext,
          toBlob: mockToBlob,
        } as any;
      }
      return document.createElement(tagName);
    });

    const file = new File(['large_image_data'], 'fachada-colegio.jpg', {
      type: 'image/jpeg',
    });

    const compressedBlob = await compressBannerImage(file, 100 * 1024);

    expect(compressedBlob).toBeDefined();
    expect(compressedBlob.size).toBeLessThanOrEqual(100 * 1024);
    expect(compressedBlob.size).toBe(85 * 1024);
    expect(attempts).toBeGreaterThanOrEqual(1);
  });
});
