import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import AdminTabsNav, { AdminTabKey } from '../AdminTabsNav';

describe('AdminTabsNav Component', () => {
  const defaultProps = {
    activeTab: 'general' as AdminTabKey,
    onChangeTab: jest.fn(),
    totalEstudiantes: 1250,
    directoresStats: { participo: 45, no_participo: 5, total: 50 },
    totalDocentes: 120,
    totalPreguntas: 20,
    hideBrechas: false,
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders all default tabs including badges', () => {
    render(<AdminTabsNav {...defaultProps} />);

    expect(screen.getByText('Panel General')).toBeInTheDocument();
    expect(screen.getByText('Directores')).toBeInTheDocument();
    expect(screen.getByText('Docentes')).toBeInTheDocument();
    expect(screen.getByText('Brechas de Aprendizaje')).toBeInTheDocument();
    expect(screen.getByText('Tendencias Históricas')).toBeInTheDocument();
    expect(screen.getByText('Análisis por Pregunta')).toBeInTheDocument();

    // Verify badges
    expect(screen.getByText('1,250 est.')).toBeInTheDocument();
    expect(screen.getByText('45/50')).toBeInTheDocument();
    expect(screen.getByText('120 doc.')).toBeInTheDocument();
    expect(screen.getByText('UGEL')).toBeInTheDocument();
    expect(screen.getByText('Histórico')).toBeInTheDocument();
    expect(screen.getByText('20 ítems')).toBeInTheDocument();
  });

  it('indicates the active tab via aria-selected', () => {
    render(<AdminTabsNav {...defaultProps} activeTab="directores" />);

    const directoresTab = screen.getByRole('tab', { name: /directores/i });
    expect(directoresTab).toHaveAttribute('aria-selected', 'true');

    const generalTab = screen.getByRole('tab', { name: /panel general/i });
    expect(generalTab).toHaveAttribute('aria-selected', 'false');
  });

  it('calls onChangeTab when a tab is clicked', () => {
    const onChangeTab = jest.fn();
    render(<AdminTabsNav {...defaultProps} onChangeTab={onChangeTab} />);

    const docentesTab = screen.getByRole('tab', { name: /docentes/i });
    fireEvent.click(docentesTab);

    expect(onChangeTab).toHaveBeenCalledWith('docentes');
  });

  it('hides the brechas tab when hideBrechas is true', () => {
    render(<AdminTabsNav {...defaultProps} hideBrechas={true} />);

    expect(screen.queryByText('Brechas de Aprendizaje')).not.toBeInTheDocument();
  });
});
