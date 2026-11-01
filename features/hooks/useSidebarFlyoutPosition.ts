import { useEffect, RefObject } from 'react';
import styles from '@/components/sidebar/sidebar.module.css';

/**
 * Hook para posicionar dinámicamente los submenús flotantes (flyouts) del sidebar
 * cuando se encuentra en estado contraído (collapsed).
 * 
 * Si un elemento del menú se encuentra cerca del borde inferior del viewport y su submenú
 * desbordaría la pantalla hacia abajo, se invierte automáticamente para que se abra
 * hacia arriba (data-flyout-placement="top"), ajustando su altura máxima disponible (max-height)
 * para garantizar que ningún ítem ni encabezado quede oculto.
 */
export function useSidebarFlyoutPosition(
  sidebarRef: RefObject<HTMLElement>,
  isSidebarCollapsed: boolean
) {
  useEffect(() => {
    if (!isSidebarCollapsed) {
      // Limpiar atributos y estilos inline cuando el sidebar se expande
      if (sidebarRef.current) {
        const menuItems = sidebarRef.current.querySelectorAll(`.${styles.menuItem}`);
        menuItems.forEach((item) => {
          item.removeAttribute('data-flyout-placement');
          const submenu = item.querySelector(`.${styles.submenu}`) as HTMLElement | null;
          if (submenu) {
            submenu.style.removeProperty('max-height');
          }
        });
      }
      return;
    }

    const sidebar = sidebarRef.current;
    if (!sidebar) return;

    const updatePlacement = (target: HTMLElement | null) => {
      if (!target) return;
      const menuItem = target.closest(`.${styles.menuItem}`) as HTMLElement | null;
      if (!menuItem) return;

      const submenu = menuItem.querySelector(`.${styles.submenu}`) as HTMLElement | null;
      if (!submenu) return;

      const rect = menuItem.getBoundingClientRect();
      const viewportHeight = window.innerHeight;

      // Obtener o estimar la altura del submenú
      let submenuHeight = submenu.offsetHeight;
      if (!submenuHeight || submenuHeight <= 0) {
        const items = submenu.querySelectorAll('li');
        submenuHeight = Math.max(80, items.length * 40 + 24);
      }

      const spaceBelow = viewportHeight - rect.top;
      const spaceAbove = rect.bottom;
      const paddingSafety = 20;

      // Si abrir hacia abajo desborda la pantalla y hay más espacio hacia arriba:
      if (spaceBelow < submenuHeight + paddingSafety && spaceAbove > spaceBelow) {
        menuItem.setAttribute('data-flyout-placement', 'top');
        // Garantizar que hacia arriba nunca supere el borde superior de la pantalla
        const maxAllowed = Math.max(120, Math.floor(rect.bottom - 16));
        submenu.style.maxHeight = `${maxAllowed}px`;
      } else {
        menuItem.setAttribute('data-flyout-placement', 'bottom');
        // Garantizar que hacia abajo nunca supere el borde inferior de la pantalla
        const maxAllowed = Math.max(120, Math.floor(viewportHeight - rect.top - 16));
        submenu.style.maxHeight = `${maxAllowed}px`;
      }
    };

    const handleEvent = (e: MouseEvent | FocusEvent) => {
      updatePlacement(e.target as HTMLElement | null);
    };

    sidebar.addEventListener('mouseover', handleEvent, { passive: true });
    sidebar.addEventListener('focusin', handleEvent, { passive: true });

    return () => {
      sidebar.removeEventListener('mouseover', handleEvent);
      sidebar.removeEventListener('focusin', handleEvent);
      // Limpieza al desmontar
      const menuItems = sidebar.querySelectorAll(`.${styles.menuItem}`);
      menuItems.forEach((item) => {
        item.removeAttribute('data-flyout-placement');
        const submenu = item.querySelector(`.${styles.submenu}`) as HTMLElement | null;
        if (submenu) {
          submenu.style.removeProperty('max-height');
        }
      });
    };
  }, [sidebarRef, isSidebarCollapsed]);
}

export default useSidebarFlyoutPosition;
