import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import DesempenoTabsNav, { DesempenoTabItem } from '../containers/reporte-desempeno/DesempenoTabsNav';
import { MdBarChart, MdAssignment } from 'react-icons/md';
import { RiGraduationCapLine } from 'react-icons/ri';

describe('DesempenoTabsNav Component', () => {
  const sampleTabs: DesempenoTabItem[] = [
    {
      id: 'general',
      label: 'Panel General',
      icon: <MdBarChart data-testid="icon-general" />,
      badge: '12 doc.',
    },
    {
      id: 'evaluados',
      label: 'Docentes Evaluados',
      icon: <RiGraduationCapLine data-testid="icon-docentes" />,
      badge: 12,
    },
    {
      id: 'criterios',
      label: 'Análisis por Criterio',
      icon: <MdAssignment data-testid="icon-criterios" />,
      badge: '8 ítems',
    },
  ];

  it('renders all tab buttons, icons, and badges correctly', () => {
    render(
      <DesempenoTabsNav
        activeTab="general"
        onChangeTab={jest.fn()}
        tabs={sampleTabs}
      />
    );

    expect(screen.getByText('Panel General')).toBeInTheDocument();
    expect(screen.getByText('Docentes Evaluados')).toBeInTheDocument();
    expect(screen.getByText('Análisis por Criterio')).toBeInTheDocument();

    expect(screen.getByText('12 doc.')).toBeInTheDocument();
    expect(screen.getByText('12')).toBeInTheDocument();
    expect(screen.getByText('8 ítems')).toBeInTheDocument();

    expect(screen.getByTestId('icon-general')).toBeInTheDocument();
    expect(screen.getByTestId('icon-docentes')).toBeInTheDocument();
    expect(screen.getByTestId('icon-criterios')).toBeInTheDocument();
  });

  it('highlights the active tab with aria-selected="true" and tabIndex=0', () => {
    render(
      <DesempenoTabsNav
        activeTab="evaluados"
        onChangeTab={jest.fn()}
        tabs={sampleTabs}
      />
    );

    const activeTabBtn = screen.getByRole('tab', { name: /docentes evaluados/i });
    expect(activeTabBtn).toHaveAttribute('aria-selected', 'true');
    expect(activeTabBtn).toHaveAttribute('tabIndex', '0');

    const inactiveTabBtn = screen.getByRole('tab', { name: /panel general/i });
    expect(inactiveTabBtn).toHaveAttribute('aria-selected', 'false');
    expect(inactiveTabBtn).toHaveAttribute('tabIndex', '-1');
  });

  it('calls onChangeTab when a tab is clicked', () => {
    const handleChangeTab = jest.fn();
    render(
      <DesempenoTabsNav
        activeTab="general"
        onChangeTab={handleChangeTab}
        tabs={sampleTabs}
      />
    );

    const criteriosTab = screen.getByRole('tab', { name: /análisis por criterio/i });
    fireEvent.click(criteriosTab);

    expect(handleChangeTab).toHaveBeenCalledTimes(1);
    expect(handleChangeTab).toHaveBeenCalledWith('criterios');
  });

  it('supports keyboard navigation via ArrowRight and ArrowLeft', () => {
    const handleChangeTab = jest.fn();
    render(
      <DesempenoTabsNav
        activeTab="general"
        onChangeTab={handleChangeTab}
        tabs={sampleTabs}
      />
    );

    const generalTab = screen.getByRole('tab', { name: /panel general/i });
    fireEvent.keyDown(generalTab, { key: 'ArrowRight' });
    expect(handleChangeTab).toHaveBeenCalledWith('evaluados');

    fireEvent.keyDown(generalTab, { key: 'ArrowLeft' });
    expect(handleChangeTab).toHaveBeenCalledWith('criterios');
  });

  it('renders layout mode switch and triggers mode changes', () => {
    const handleChangeLayoutMode = jest.fn();
    render(
      <DesempenoTabsNav
        activeTab="general"
        onChangeTab={jest.fn()}
        tabs={sampleTabs}
        layoutMode="tabs"
        onChangeLayoutMode={handleChangeLayoutMode}
        showLayoutSwitch={true}
      />
    );

    const cascadeBtn = screen.getByRole('button', { name: /cascada/i });
    fireEvent.click(cascadeBtn);

    expect(handleChangeLayoutMode).toHaveBeenCalledWith('cascade');
  });
});
