import { useState, useCallback } from 'react';
import { toast } from 'react-toastify';

export interface CapturaOpciones {
  titulo?: string;
  subtitulo?: string;
  evaluacionNombre?: string;
  filename?: string;
  tipo: 'descargar' | 'copiar';
}

/**
 * Hook para capturar cualquier sección o matriz de reporte pedagógico como imagen PNG
 * en alta resolución (escala 2x / Retina) 100% en el frontend del navegador.
 * 
 * Ventajas:
 * 1. Cero peticiones y cero almacenamiento en el backend (0 bytes en servidor/Firestore).
 * 2. Alta definición (scale: 2) para impresión o anexos oficiales de evidencias.
 * 3. Descarga directa en un clic o copia instantánea al portapapeles (Ctrl + V).
 * 4. Inyección automática de membrete institucional en la imagen generada.
 */
export const useCapturaMatriz = () => {
  const [isCapturing, setIsCapturing] = useState<boolean>(false);

  const capturar = useCallback(
    async (targetEl: HTMLElement | null, opciones: CapturaOpciones) => {
      if (!targetEl) {
        toast.error('No se encontró el elemento para capturar la evidencia');
        return;
      }

      if (isCapturing) return;
      setIsCapturing(true);

      const toastId = toast.loading('Generando evidencia en alta resolución...');

      // Inyectar regla temporal en document.head para que img sea inline-block durante
      // el cálculo de FontMetrics de html2canvas. Esto evita que el preflight de Tailwind ('img { display: block }')
      // separe el span e img de prueba, lo que añade un offset de ~10-15px erróneo al baseline
      // empujando los números dentro de las burbujas hacia abajo.
      const tempFixStyle = document.createElement('style');
      tempFixStyle.setAttribute('data-html2canvas-fix', 'true');
      tempFixStyle.innerHTML = 'img { display: inline-block !important; }';
      document.head.appendChild(tempFixStyle);

      try {
        // Carga dinámica de html2canvas para óptimo rendimiento y compatibilidad SSR
        const html2canvas = (await import('html2canvas')).default;

        // Calcular ancho virtual óptimo para capturar todas las columnas sin truncamiento
        const virtualWidth = Math.max(targetEl.scrollWidth + 100, 1400);

        const canvas = await html2canvas(targetEl, {
          scale: 2, // 2x para resolución Retina ultra-nítida
          useCORS: true,
          logging: false,
          backgroundColor: '#ffffff',
          windowWidth: virtualWidth,
          onclone: (clonedDoc: Document, clonedEl: HTMLElement) => {
            // Fix de Tailwind preflight y centrado de burbujas en el documento clonado
            const clonedFixStyle = clonedDoc.createElement('style');
            clonedFixStyle.innerHTML = `
              img { display: inline-block !important; }
              [class*="bubbleBase"] {
                display: inline-flex !important;
                align-items: center !important;
                justify-content: center !important;
                text-align: center !important;
                vertical-align: middle !important;
                overflow: visible !important;
                transform: none !important;
                box-shadow: none !important;
              }
              [class*="bubbleText"] {
                display: inline-block !important;
                position: relative !important;
                top: -2.5px !important;
                line-height: 1 !important;
                text-align: center !important;
                vertical-align: middle !important;
                visibility: visible !important;
                opacity: 1 !important;
                color: #ffffff !important;
              }
            `;
            clonedDoc.head.appendChild(clonedFixStyle);

            // Asegurar estilos inline en cada burbuja y su texto para centrado milimétrico
            const bubbles = clonedEl.querySelectorAll<HTMLElement>('[class*="bubbleBase"]');
            bubbles.forEach((b) => {
              b.style.overflow = 'visible';
              b.style.transform = 'none';
              b.style.display = 'inline-flex';
              b.style.alignItems = 'center';
              b.style.justifyContent = 'center';
              const span = b.querySelector<HTMLElement>('span');
              if (span) {
                span.style.display = 'inline-block';
                span.style.position = 'relative';
                span.style.top = '-2.5px';
                span.style.lineHeight = '1';
                span.style.textAlign = 'center';
                span.style.verticalAlign = 'middle';
                span.style.color = '#ffffff';
                span.style.visibility = 'visible';
                span.style.opacity = '1';
              }
            });

            // 1. Mostrar membrete institucional y pie de evidencia
            const banners = clonedEl.querySelectorAll<HTMLElement>(
              '[data-evidence-banner="true"], [data-evidence-footer="true"]'
            );
            banners.forEach((b) => {
              b.style.display = 'block';
            });

            // 2. Expandir contenedores con scroll horizontal para capturar todas las preguntas
            const scrollContainers = clonedEl.querySelectorAll<HTMLElement>(
              '.overflow-x-auto, [class*="overflow-x"]'
            );
            scrollContainers.forEach((container) => {
              container.style.overflow = 'visible';
              container.style.maxWidth = 'none';
              container.style.width = 'max-content';
            });

            // 3. Forzar que las tablas mantengan todo su ancho expandido
            const tables = clonedEl.querySelectorAll<HTMLElement>('table');
            tables.forEach((table) => {
              table.style.width = 'max-content';
              table.style.minWidth = '100%';
              table.style.maxWidth = 'none';
            });

            // 4. Desactivar position: sticky en el DOM clonado para evitar desplazamientos
            const stickyCells = clonedEl.querySelectorAll<HTMLElement>(
              '.sticky, [class*="sticky"]'
            );
            stickyCells.forEach((cell) => {
              cell.style.position = 'static';
              cell.style.boxShadow = 'none';
            });

            // 5. Ocultar controles interactivos no deseados en la evidencia
            const noCapture = clonedEl.querySelectorAll<HTMLElement>('[data-no-capture="true"]');
            noCapture.forEach((nc) => {
              nc.style.display = 'none';
            });
          },
        });

        // Generar nombre de archivo limpio y descriptivo
        const sanitize = (name: string) =>
          name
            .normalize('NFD')
            .replace(/[\u0300-\u036f]/g, '')
            .replace(/[^a-zA-Z0-9_-]/g, '_')
            .replace(/_+/g, '_')
            .slice(0, 40);

        const fechaStr = new Date().toISOString().slice(0, 10);
        const finalFilename =
          opciones.filename ||
          `Evidencia_${sanitize(opciones.titulo || 'Matriz')}_${sanitize(
            opciones.evaluacionNombre || 'Reporte'
          )}_${fechaStr}.png`;

        if (opciones.tipo === 'descargar') {
          // Descargar directamente en el navegador del usuario
          const dataUrl = canvas.toDataURL('image/png');
          const link = document.createElement('a');
          link.download = finalFilename;
          link.href = dataUrl;
          document.body.appendChild(link);
          link.click();
          document.body.removeChild(link);

          toast.update(toastId, {
            render: '¡Evidencia descargada con éxito en alta resolución!',
            type: 'success',
            isLoading: false,
            autoClose: 3500,
          });
        } else {
          // Copiar al portapapeles para pegar en Word, PPT o mensajería
          const blob = await new Promise<Blob | null>((resolve) =>
            canvas.toBlob((b) => resolve(b), 'image/png')
          );

          if (!blob) {
            throw new Error('No se pudo convertir la evidencia a formato imagen');
          }

          if (navigator.clipboard && typeof window.ClipboardItem !== 'undefined') {
            try {
              const item = new ClipboardItem({ 'image/png': blob });
              await navigator.clipboard.write([item]);
              toast.update(toastId, {
                render: '¡Evidencia copiada al portapapeles! Pégala con Ctrl + V',
                type: 'success',
                isLoading: false,
                autoClose: 4000,
              });
            } catch (clipErr) {
              console.warn('Permiso de portapapeles bloqueado, descargando archivo:', clipErr);
              // Fallback automático a descarga si el navegador restringe el portapapeles
              const dataUrl = canvas.toDataURL('image/png');
              const link = document.createElement('a');
              link.download = finalFilename;
              link.href = dataUrl;
              document.body.appendChild(link);
              link.click();
              document.body.removeChild(link);

              toast.update(toastId, {
                render: 'Descargando imagen (portapapeles restringido en tu navegador)',
                type: 'info',
                isLoading: false,
                autoClose: 4000,
              });
            }
          } else {
            // Fallback a descarga si la API no está disponible
            const dataUrl = canvas.toDataURL('image/png');
            const link = document.createElement('a');
            link.download = finalFilename;
            link.href = dataUrl;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);

            toast.update(toastId, {
              render: 'Descargando imagen PNG (navegador sin soporte de copiado directo)',
              type: 'info',
              isLoading: false,
              autoClose: 4000,
            });
          }
        }
      } catch (err) {
        console.error('Error al capturar evidencia:', err);
        toast.update(toastId, {
          render: 'No se pudo generar la evidencia de imagen. Intenta nuevamente.',
          type: 'error',
          isLoading: false,
          autoClose: 4000,
        });
      } finally {
        tempFixStyle.remove();
        setIsCapturing(false);
      }
    },
    [isCapturing]
  );

  return {
    isCapturing,
    capturar,
  };
};

export default useCapturaMatriz;
