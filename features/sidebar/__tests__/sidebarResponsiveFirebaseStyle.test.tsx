import React from 'react';
import fs from 'fs';
import path from 'path';
import { render, screen } from '@testing-library/react';

jest.mock('@/firebase/firebase.config', () => ({
  db: {},
  app: {},
  auth: { currentUser: { uid: 'test-user-id' } },
}));
jest.mock('firebase/firestore', () => ({
  doc: jest.fn(),
  onSnapshot: jest.fn(() => jest.fn()),
  getFirestore: jest.fn(),
}));
jest.mock('firebase/auth', () => ({
  getAuth: jest.fn(),
  onAuthStateChanged: jest.fn(),
}));
jest.mock('next/router', () => ({
  useRouter: () => ({
    pathname: '/docentes/evaluaciones',
    query: {},
    asPath: '/docentes/evaluaciones',
    push: jest.fn(),
    events: {
      on: jest.fn(),
      off: jest.fn(),
    },
  }),
}));

import SidebarDocentes from '@/components/sidebar/SidebarDocentes';
import { GlobalContextProvider } from '@/features/context/GlolbalContext';

describe('Sidebar Firebase Style & Width Reduction (250px)', () => {
  const sidebarCssPath = path.resolve(__dirname, '../../../components/sidebar/sidebar.module.css');
  const layoutCssPath = path.resolve(__dirname, '../../../components/layouts/layout.module.css');

  it('el ancho en desktop cuando está desplegado es 250px tanto en layout como en sidebar', () => {
    const sidebarCss = fs.readFileSync(sidebarCssPath, 'utf8');
    const layoutCss = fs.readFileSync(layoutCssPath, 'utf8');

    // layout desktop grid
    expect(layoutCss).toContain('grid-template-columns: 250px minmax(0, 1fr)');
    expect(layoutCss).toContain('grid-template-columns: 64px minmax(0, 1fr)');

    // sidebar desktop width
    expect(sidebarCss).toMatch(/width:\s*250px;/);
    expect(sidebarCss).toMatch(/width:\s*64px;/);
  });

  it('los enlaces y textos de menú implementan ellipsis (...) y min-width: 0 para evitar desbordamiento', () => {
    const sidebarCss = fs.readFileSync(sidebarCssPath, 'utf8');

    // Verificar .dashboardLink
    expect(sidebarCss).toMatch(/\.dashboardLink\s*{[^}]*text-overflow:\s*ellipsis;/);
    expect(sidebarCss).toMatch(/\.dashboardLink\s*{[^}]*min-width:\s*0;/);

    // Verificar .link
    expect(sidebarCss).toMatch(/\.link\s*{[^}]*text-overflow:\s*ellipsis;/);
    expect(sidebarCss).toMatch(/\.link\s*{[^}]*min-width:\s*0;/);

    // Verificar .submenuLink
    expect(sidebarCss).toMatch(/\.submenuLink\s*{[^}]*text-overflow:\s*ellipsis;/);
    expect(sidebarCss).toMatch(/\.submenuLink\s*{[^}]*min-width:\s*0;/);
  });

  it('la barra inferior (sidebarFooter) contiene el botón circular con diseño idéntico', () => {
    const sidebarCss = fs.readFileSync(sidebarCssPath, 'utf8');

    // sidebarFooter exists with border-top
    expect(sidebarCss).toContain('.sidebarFooter');
    expect(sidebarCss).toMatch(/border-top:\s*1px solid/);

    // circular collapseToggleBtn (border-radius: 50%)
    expect(sidebarCss).toMatch(/\.collapseToggleBtn\s*{[^}]*border-radius:\s*50%;/);
  });

  it('renderiza el botón de colapso como elemento <button> accesible dentro de sidebarFooter', () => {
    render(
      <GlobalContextProvider>
        <SidebarDocentes />
      </GlobalContextProvider>
    );

    const toggleButton = screen.getByRole('button', { name: /contraer/i });
    expect(toggleButton).toBeInTheDocument();
    expect(toggleButton).toHaveAttribute('type', 'button');
    expect(toggleButton).toHaveAttribute('title', 'Contraer');
  });
});
