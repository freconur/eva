import { renderHook } from '@testing-library/react';
import { useSidebarFlyoutPosition } from '@/features/hooks/useSidebarFlyoutPosition';
import styles from '@/components/sidebar/sidebar.module.css';

describe('useSidebarFlyoutPosition Hook', () => {
  let container: HTMLDivElement;
  let menuItem: HTMLDivElement;
  let submenu: HTMLUListElement;

  beforeEach(() => {
    container = document.createElement('div');
    container.className = styles.sidebar;

    menuItem = document.createElement('div');
    menuItem.className = styles.menuItem;

    submenu = document.createElement('ul');
    submenu.className = styles.submenu;

    const li1 = document.createElement('li');
    li1.textContent = 'Submenu Item 1';
    const li2 = document.createElement('li');
    li2.textContent = 'Submenu Item 2';
    submenu.appendChild(li1);
    submenu.appendChild(li2);

    menuItem.appendChild(submenu);
    container.appendChild(menuItem);
    document.body.appendChild(container);

    // Mock window.innerHeight
    Object.defineProperty(window, 'innerHeight', {
      writable: true,
      configurable: true,
      value: 700,
    });
  });

  afterEach(() => {
    document.body.removeChild(container);
    jest.restoreAllMocks();
  });

  it('no añade atributos cuando isSidebarCollapsed es false', () => {
    const ref = { current: container };
    renderHook(() => useSidebarFlyoutPosition(ref, false));

    const mouseEvent = new MouseEvent('mouseover', { bubbles: true });
    menuItem.dispatchEvent(mouseEvent);

    expect(menuItem.getAttribute('data-flyout-placement')).toBeNull();
  });

  it('asigna data-flyout-placement="top" y ajusta maxHeight cuando el elemento está cerca del fondo', () => {
    const ref = { current: container };
    renderHook(() => useSidebarFlyoutPosition(ref, true));

    // Simular que el menuItem está a 620px del top (en un viewport de 700px, solo quedan 80px abajo)
    jest.spyOn(menuItem, 'getBoundingClientRect').mockReturnValue({
      top: 620,
      bottom: 664,
      left: 10,
      right: 54,
      width: 44,
      height: 44,
      x: 10,
      y: 620,
      toJSON: () => {},
    });

    // Altura del submenú de 130px (130px > 80px disponible abajo)
    Object.defineProperty(submenu, 'offsetHeight', {
      configurable: true,
      value: 130,
    });

    const mouseEvent = new MouseEvent('mouseover', { bubbles: true });
    menuItem.dispatchEvent(mouseEvent);

    expect(menuItem.getAttribute('data-flyout-placement')).toBe('top');
    expect(submenu.style.maxHeight).toBe(`${664 - 16}px`);
  });

  it('asigna data-flyout-placement="bottom" cuando hay suficiente espacio inferior', () => {
    const ref = { current: container };
    renderHook(() => useSidebarFlyoutPosition(ref, true));

    // Simular que el menuItem está a 150px del top (quedan 550px abajo)
    jest.spyOn(menuItem, 'getBoundingClientRect').mockReturnValue({
      top: 150,
      bottom: 194,
      left: 10,
      right: 54,
      width: 44,
      height: 44,
      x: 10,
      y: 150,
      toJSON: () => {},
    });

    Object.defineProperty(submenu, 'offsetHeight', {
      configurable: true,
      value: 130,
    });

    const mouseEvent = new MouseEvent('mouseover', { bubbles: true });
    menuItem.dispatchEvent(mouseEvent);

    expect(menuItem.getAttribute('data-flyout-placement')).toBe('bottom');
    expect(submenu.style.maxHeight).toBe(`${700 - 150 - 16}px`);
  });

  it('reacciona a focusin para accesibilidad por teclado', () => {
    const ref = { current: container };
    renderHook(() => useSidebarFlyoutPosition(ref, true));

    jest.spyOn(menuItem, 'getBoundingClientRect').mockReturnValue({
      top: 620,
      bottom: 664,
      left: 10,
      right: 54,
      width: 44,
      height: 44,
      x: 10,
      y: 620,
      toJSON: () => {},
    });

    Object.defineProperty(submenu, 'offsetHeight', {
      configurable: true,
      value: 130,
    });

    const focusEvent = new FocusEvent('focusin', { bubbles: true });
    menuItem.dispatchEvent(focusEvent);

    expect(menuItem.getAttribute('data-flyout-placement')).toBe('top');
  });

  it('limpia atributos y estilos al desmontar o al expandir el sidebar', () => {
    const ref = { current: container };
    const { unmount, rerender } = renderHook(
      ({ collapsed }) => useSidebarFlyoutPosition(ref, collapsed),
      { initialProps: { collapsed: true } }
    );

    jest.spyOn(menuItem, 'getBoundingClientRect').mockReturnValue({
      top: 620,
      bottom: 664,
      left: 10,
      right: 54,
      width: 44,
      height: 44,
      x: 10,
      y: 620,
      toJSON: () => {},
    });

    const mouseEvent = new MouseEvent('mouseover', { bubbles: true });
    menuItem.dispatchEvent(mouseEvent);

    expect(menuItem.getAttribute('data-flyout-placement')).toBe('top');
    expect(submenu.style.maxHeight).toBeTruthy();

    // Rerender con collapsed = false (expandido)
    rerender({ collapsed: false });

    expect(menuItem.getAttribute('data-flyout-placement')).toBeNull();
    expect(submenu.style.maxHeight).toBe('');
  });
});
