import React, { useState, useEffect, useRef } from 'react';
import { RiLoader4Line } from 'react-icons/ri';

export interface LazyReportSectionProps {
  children: React.ReactNode;
  title?: string;
  minHeight?: number | string;
  onVisible?: () => void;
  rootMargin?: string;
  forceLoad?: boolean;
}

/**
 * LazyReportSection:
 * Carga diferida inteligente para secciones pesadas de reporte.
 * Utiliza IntersectionObserver con rootMargin para comenzar la carga y renderizado
 * justo antes de que el usuario llegue a la sección mediante scroll, evitando
 * consultas pesadas y carga de gráficos en el montaje inicial de la página.
 */
export const LazyReportSection: React.FC<LazyReportSectionProps> = ({
  children,
  title = 'Cargando contenido...',
  minHeight = 350,
  onVisible,
  rootMargin = '300px 0px',
  forceLoad = false,
}) => {
  const [isVisible, setIsVisible] = useState<boolean>(forceLoad);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (forceLoad) {
      setIsVisible(true);
      onVisible?.();
      return;
    }

    if (isVisible) return;

    const target = containerRef.current;
    if (!target) return;

    if (typeof window === 'undefined' || !('IntersectionObserver' in window)) {
      setIsVisible(true);
      onVisible?.();
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        const entry = entries[0];
        if (entry && entry.isIntersecting) {
          setIsVisible(true);
          onVisible?.();
          observer.disconnect();
        }
      },
      { root: null, rootMargin, threshold: 0.01 }
    );

    observer.observe(target);

    return () => {
      observer.disconnect();
    };
  }, [isVisible, forceLoad, rootMargin, onVisible]);

  if (isVisible) {
    return <>{children}</>;
  }

  return (
    <div
      ref={containerRef}
      style={{ minHeight: typeof minHeight === 'number' ? `${minHeight}px` : minHeight }}
      className="w-full flex flex-col items-center justify-center p-8 bg-slate-50/70 border border-dashed border-slate-200/90 rounded-2xl transition-all duration-300"
    >
      <div className="flex flex-col items-center gap-3 text-center max-w-sm">
        <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center shadow-2xs">
          <RiLoader4Line className="w-5 h-5 animate-spin" />
        </div>
        <p className="text-sm font-semibold text-slate-700">
          {title}
        </p>
        <span className="text-xs text-slate-500">
          Los datos se cargarán automáticamente al desplazarse a esta sección.
        </span>
        <button
          type="button"
          onClick={() => {
            setIsVisible(true);
            onVisible?.();
          }}
          className="mt-1 px-3 py-1.5 text-xs font-semibold text-blue-600 hover:text-blue-700 bg-white hover:bg-blue-50 rounded-lg border border-slate-200 shadow-2xs transition-colors cursor-pointer"
        >
          Cargar ahora
        </button>
      </div>
    </div>
  );
};

export default LazyReportSection;
