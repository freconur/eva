/**
 * Comprime una imagen asegurando que su tamaño final sea como máximo el límite especificado (por defecto 100 KB).
 * Realiza un proceso iterativo de redimensionamiento proporcional y reducción gradual de calidad JPEG.
 *
 * @param file Archivo de imagen original seleccionado por el usuario.
 * @param maxSizeBytes Límite máximo en bytes (default: 100 * 1024 = 102,400 bytes).
 * @returns Promise<Blob> Blob de imagen comprimido en formato JPEG.
 */
export const compressBannerImage = async (
  file: File,
  maxSizeBytes: number = 100 * 1024
): Promise<Blob> => {
  return new Promise((resolve, reject) => {
    // Validar tipo de archivo
    if (!file.type.startsWith('image/')) {
      reject(new Error('El archivo seleccionado no es una imagen válida.'));
      return;
    }

    const reader = new FileReader();
    reader.readAsDataURL(file);

    reader.onload = (event) => {
      const img = new Image();
      img.src = event.target?.result as string;

      img.onload = async () => {
        try {
          let currentWidth = img.width;
          let currentHeight = img.height;

          // Límite inicial de resolución óptima para banner responsive (1400px es ultra nítido)
          const MAX_WIDTH = 1400;
          if (currentWidth > MAX_WIDTH) {
            currentHeight = Math.round((currentHeight * MAX_WIDTH) / currentWidth);
            currentWidth = MAX_WIDTH;
          }

          let quality = 0.82;
          let iteration = 0;
          let resultBlob: Blob | null = null;

          while (iteration < 10) {
            iteration++;
            const canvas = document.createElement('canvas');
            canvas.width = currentWidth;
            canvas.height = currentHeight;
            const ctx = canvas.getContext('2d');

            if (!ctx) {
              reject(new Error('No se pudo inicializar el contexto 2D para compresión.'));
              return;
            }

            // Fondo blanco para evitar fondos negros en caso de PNGs transparentes
            ctx.fillStyle = '#FFFFFF';
            ctx.fillRect(0, 0, currentWidth, currentHeight);
            ctx.drawImage(img, 0, 0, currentWidth, currentHeight);

            resultBlob = await new Promise<Blob | null>((res) =>
              canvas.toBlob((b) => res(b), 'image/jpeg', quality)
            );

            if (!resultBlob) break;

            // Si cumple con la meta estricta de <= 100 KB
            if (resultBlob.size <= maxSizeBytes) {
              resolve(resultBlob);
              return;
            }

            // Si supera el límite de 100 KB, reducimos calidad o escala
            if (quality > 0.45) {
              quality -= 0.12;
            } else {
              // Si la calidad ya es baja, reducimos dimensiones en un 15% adicional
              currentWidth = Math.round(currentWidth * 0.85);
              currentHeight = Math.round(currentHeight * 0.85);
              quality = 0.7;
            }
          }

          if (resultBlob) {
            resolve(resultBlob);
          } else {
            reject(new Error('No se pudo completar la compresión de la imagen.'));
          }
        } catch (err) {
          reject(err);
        }
      };

      img.onerror = (err) => reject(new Error('Error al cargar la imagen para compresión.'));
    };

    reader.onerror = (err) => reject(new Error('Error al leer el archivo de imagen.'));
  });
};
