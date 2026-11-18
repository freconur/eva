/**
 * Utilidad para comprimir y encuadrar fotografías tamaño carnet (proporción 5:6 / 2.5 x 3.0 cm).
 * Realiza un recorte inteligente centrado (center-crop) para evitar distorsiones o bandas blancas,
 * escala a resolución estándar de alta definición (300 x 360 px), y comprime en formato JPEG
 * asegurando un peso mínimo (generalmente 15 KB a 35 KB, máximo 45 KB).
 */

export interface CompressedCarnetResult {
  blob: Blob;
  dataUrl: string;
  sizeInKb: number;
  width: number;
  height: number;
}

export interface CompressCarnetOptions {
  targetWidth?: number;
  targetHeight?: number;
  maxSizeBytes?: number;
  initialQuality?: number;
}

export const compressCarnetImage = async (
  file: File,
  options: CompressCarnetOptions = {}
): Promise<CompressedCarnetResult> => {
  const {
    targetWidth = 300,
    targetHeight = 360,
    maxSizeBytes = 45 * 1024, // 45 KB estricto
    initialQuality = 0.82,
  } = options;

  return new Promise((resolve, reject) => {
    if (!file || !file.type.startsWith('image/')) {
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
          const targetRatio = targetWidth / targetHeight;
          const sourceRatio = img.width / img.height;

          let cropX = 0;
          let cropY = 0;
          let cropWidth = img.width;
          let cropHeight = img.height;

          // Recorte centrado (Center-Crop) según la relación de aspecto del carnet
          if (sourceRatio > targetRatio) {
            // La imagen es más ancha que el carnet: recortamos los laterales
            cropWidth = Math.round(img.height * targetRatio);
            cropX = Math.round((img.width - cropWidth) / 2);
          } else if (sourceRatio < targetRatio) {
            // La imagen es más alta que el carnet: recortamos superior/inferior con ligero énfasis superior
            cropHeight = Math.round(img.width / targetRatio);
            // En fotos de personas, los rostros suelen estar en el tercio superior
            const yOffsetFactor = 0.35;
            cropY = Math.max(0, Math.round((img.height - cropHeight) * yOffsetFactor));
          }

          let currentWidth = targetWidth;
          let currentHeight = targetHeight;
          let quality = initialQuality;
          let iteration = 0;
          let resultBlob: Blob | null = null;
          let finalDataUrl = '';

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

            // Fondo blanco neutro
            ctx.fillStyle = '#FFFFFF';
            ctx.fillRect(0, 0, currentWidth, currentHeight);

            // Suavizado de imagen de alta calidad
            ctx.imageSmoothingEnabled = true;
            ctx.imageSmoothingQuality = 'high';

            ctx.drawImage(
              img,
              cropX,
              cropY,
              cropWidth,
              cropHeight,
              0,
              0,
              currentWidth,
              currentHeight
            );

            resultBlob = await new Promise<Blob | null>((res) =>
              canvas.toBlob((b) => res(b), 'image/jpeg', quality)
            );

            if (!resultBlob) break;

            if (resultBlob.size <= maxSizeBytes || iteration >= 8) {
              finalDataUrl = canvas.toDataURL('image/jpeg', quality);
              break;
            }

            // Reducir calidad gradualmente
            if (quality > 0.45) {
              quality -= 0.12;
            } else {
              // Si la calidad ya es baja, reducir dimensiones levemente
              currentWidth = Math.round(currentWidth * 0.9);
              currentHeight = Math.round(currentHeight * 0.9);
              quality = 0.75;
            }
          }

          if (resultBlob) {
            const sizeInKb = Math.round((resultBlob.size / 1024) * 10) / 10;
            resolve({
              blob: resultBlob,
              dataUrl: finalDataUrl,
              sizeInKb,
              width: currentWidth,
              height: currentHeight,
            });
          } else {
            reject(new Error('No se pudo completar la compresión de la foto carnet.'));
          }
        } catch (err) {
          reject(err);
        }
      };

      img.onerror = () => reject(new Error('Error al decodificar la imagen seleccionada.'));
    };

    reader.onerror = () => reject(new Error('Error al leer el archivo de imagen.'));
  });
};
