import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import DesempenoFiltrosBar from '../containers/reporte-desempeno/DesempenoFiltrosBar';

describe('DesempenoFiltrosBar Component', () => {
  const mockRegiones = [
    { id: '1', region: 'UGEL 01' },
    { id: '2', region: 'UGEL 02' },
  ];

  const mockGeneros = [
    { id: 'M', name: 'Masculino' },
    { id: 'F', name: 'Femenino' },
  ];

  const mockFases = [
    { id: 'f1', nombre: 'I TRAMO' },
    { id: 'f2', nombre: 'II TRAMO' },
  ];

  const defaultProps = {
    filtros: { region: '', genero: '', idFase: '' },
    onChangeFiltros: jest.fn(),
    onResetFiltros: jest.fn(),
    regiones: mockRegiones,
    generos: mockGeneros,
    fases: mockFases,
    colorMode: 'nivel' as const,
    onChangeColorMode: jest.fn(),
    onOpenOrganizerModal: jest.fn(),
    onOpenGlobalLevelsModal: jest.fn(),
    onOpenDomainLevelsModal: jest.fn(),
    onOpenColorModal: jest.fn(),
  };

  it('renders the segmented filter bar with title and filter items', () => {
    render(<DesempenoFiltrosBar {...defaultProps} />);

    expect(screen.getAllByText('Filtrar por').length).toBeGreaterThan(0);
    expect(screen.getByText('Todas las UGELs')).toBeInTheDocument();
    expect(screen.getByText('Todos los géneros')).toBeInTheDocument();
    expect(screen.getByText('Todas las fases')).toBeInTheDocument();
  });

  it('displays reset button when active filters exist and triggers onResetFiltros on click', () => {
    const onResetFiltros = jest.fn();
    render(
      <DesempenoFiltrosBar
        {...defaultProps}
        filtros={{ region: '1', genero: '', idFase: '' }}
        onResetFiltros={onResetFiltros}
      />
    );

    const resetBtn = screen.getByLabelText('Restablecer Filtros');
    expect(resetBtn).toBeInTheDocument();
    fireEvent.click(resetBtn);
    expect(onResetFiltros).toHaveBeenCalledTimes(1);
  });

  it('allows switching color mode between Dominio and Nivel de Logro without Colorear por label', () => {
    const onChangeColorMode = jest.fn();
    render(
      <DesempenoFiltrosBar
        {...defaultProps}
        colorMode="nivel"
        onChangeColorMode={onChangeColorMode}
      />
    );

    expect(screen.queryByText(/Colorear por:/i)).not.toBeInTheDocument();

    const dominioBtn = screen.getByTitle(/color temático/i);
    fireEvent.click(dominioBtn);
    expect(onChangeColorMode).toHaveBeenCalledWith('dominio');
  });

  it('opens settings dropdown menu and triggers modal actions', () => {
    const onOpenOrganizerModal = jest.fn();
    render(
      <DesempenoFiltrosBar
        {...defaultProps}
        hiddenSectionsCount={2}
        onOpenOrganizerModal={onOpenOrganizerModal}
      />
    );

    // Badge de secciones ocultas en el botón
    expect(screen.getByText('2')).toBeInTheDocument();

    const triggerBtn = screen.getByTitle(/Opciones de personalización/i);
    fireEvent.click(triggerBtn);

    // Debe mostrar la opción Personalizar Gráficos con el conteo
    const organizerOption = screen.getByText('Personalizar Gráficos');
    expect(organizerOption).toBeInTheDocument();
    expect(screen.getByText('2 ocultos')).toBeInTheDocument();

    fireEvent.click(organizerOption);
    expect(onOpenOrganizerModal).toHaveBeenCalledTimes(1);
  });

  it('renders the institucion filter when showInstitucionFilter is true', () => {
    const mockInstituciones = [
      { id: 'I.E. 80001', name: 'I.E. 80001 San Juan' },
      { id: 'I.E. 80002', name: 'I.E. 80002 Santa Rosa' },
    ];

    render(
      <DesempenoFiltrosBar
        {...defaultProps}
        showInstitucionFilter={true}
        instituciones={mockInstituciones}
        institucionPlaceholder="Todas las I.E."
      />
    );

    expect(screen.getByText('Todas las I.E.')).toBeInTheDocument();
  });
});
