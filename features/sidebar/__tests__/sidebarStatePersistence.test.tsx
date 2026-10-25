import React from 'react';
import { render, screen, act } from '@testing-library/react';
import { GlobalContextProvider, useGlobalContext } from '@/features/context/GlolbalContext';
import { useRolUsers } from '@/features/hooks/useRolUsers';

const TestComponent = () => {
  const { isSidebarCollapsed } = useGlobalContext();
  const { toggleSidebarCollapsed } = useRolUsers();

  return (
    <div>
      <span data-testid="collapsed-state">{String(isSidebarCollapsed)}</span>
      <button
        data-testid="toggle-btn"
        onClick={() => toggleSidebarCollapsed(isSidebarCollapsed)}
      >
        Toggle
      </button>
    </div>
  );
};

describe('Sidebar Collapsed State Persistence (localStorage)', () => {
  beforeEach(() => {
    localStorage.clear();
    jest.clearAllMocks();
  });

  it('guarda el nuevo estado en localStorage al invocar toggleSidebarCollapsed', () => {
    render(
      <GlobalContextProvider>
        <TestComponent />
      </GlobalContextProvider>
    );

    expect(screen.getByTestId('collapsed-state').textContent).toBe('false');

    act(() => {
      screen.getByTestId('toggle-btn').click();
    });

    expect(screen.getByTestId('collapsed-state').textContent).toBe('true');
    expect(localStorage.getItem('eva_sidebar_collapsed')).toBe('true');

    act(() => {
      screen.getByTestId('toggle-btn').click();
    });

    expect(screen.getByTestId('collapsed-state').textContent).toBe('false');
    expect(localStorage.getItem('eva_sidebar_collapsed')).toBe('false');
  });

  it('restaura el estado contraído desde localStorage al montar la aplicación', () => {
    localStorage.setItem('eva_sidebar_collapsed', 'true');

    render(
      <GlobalContextProvider>
        <TestComponent />
      </GlobalContextProvider>
    );

    expect(screen.getByTestId('collapsed-state').textContent).toBe('true');
  });
});
