import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { EvaluacionConfigMenu } from '../containers/EvaluacionConfigMenu';

jest.mock('@/firebase/firebase.config', () => ({
  db: {},
  storage: {},
  app: {},
  initAnalytics: jest.fn().mockResolvedValue(null),
}));

const mockUpdateActivacionEvidencias = jest.fn().mockResolvedValue(undefined);

jest.mock('@/features/hooks/useEvaluacionDesempenoBase', () => ({
  __esModule: true,
  default: () => ({
    updateActivacionEvidencias: mockUpdateActivacionEvidencias,
  }),
}));

describe('EvaluacionConfigMenu', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  const defaultProps = {
    idEvaluacion: 'eval-123',
    collectionName: 'evaluaciones-docentes',
    dimensiones: [{ id: 'dim-1', nombre: 'Dominio 1' }],
    preguntas: [],
    escala: [{ id: '1', alternativa: 'a', value: 1 }],
    activarEvidencias: false,
    descripcion: 'Descripción de prueba',
    faseActual: 'Fase Inicial',
    onRefresh: jest.fn(),
  };

  it('renderiza el botón principal de configuración cerrado por defecto', () => {
    render(<EvaluacionConfigMenu {...defaultProps} />);

    expect(screen.getByRole('button', { name: /configuración/i })).toBeInTheDocument();
    expect(screen.queryByText('Configurar Escala')).not.toBeInTheDocument();
  });

  it('despliega el menú con todas las opciones al hacer clic en el botón principal', () => {
    render(<EvaluacionConfigMenu {...defaultProps} />);

    const button = screen.getByRole('button', { name: /configuración/i });
    fireEvent.click(button);

    expect(screen.getByText('Agregar dominio')).toBeInTheDocument();
    expect(screen.getByText('Configurar Escala')).toBeInTheDocument();
    expect(screen.getByText('Niveles de Logro (Global)')).toBeInTheDocument();
    expect(screen.getByText('Niveles por Dominio')).toBeInTheDocument();
    expect(screen.getByText('Nueva Etapa de Evaluación')).toBeInTheDocument();
    expect(screen.getByText('Editar título y descripción')).toBeInTheDocument();
    expect(screen.getByText('Título PDF')).toBeInTheDocument();
    expect(screen.getByText('Agregar preguntas')).toBeInTheDocument();
    expect(screen.getByText(/Evidencias:/i)).toBeInTheDocument();
  });

  it('ejecuta onAgregarDominio y onAgregarPreguntas cuando se proporcionan', () => {
    const onAgregarDominio = jest.fn();
    const onAgregarPreguntas = jest.fn();

    render(
      <EvaluacionConfigMenu
        {...defaultProps}
        onAgregarDominio={onAgregarDominio}
        onAgregarPreguntas={onAgregarPreguntas}
      />
    );

    const button = screen.getByRole('button', { name: /configuración/i });
    fireEvent.click(button);

    fireEvent.click(screen.getByText('Agregar dominio'));
    expect(onAgregarDominio).toHaveBeenCalledTimes(1);

    // Reabrir
    fireEvent.click(button);
    fireEvent.click(screen.getByText('Agregar preguntas'));
    expect(onAgregarPreguntas).toHaveBeenCalledTimes(1);
  });

  it('ejecuta updateActivacionEvidencias y onRefresh al hacer toggle de evidencias', async () => {
    render(<EvaluacionConfigMenu {...defaultProps} />);

    // Abrir menú
    fireEvent.click(screen.getByRole('button', { name: /configuración/i }));

    const toggleButton = screen.getByText(/Evidencias:/i);
    fireEvent.click(toggleButton);

    await waitFor(() => {
      expect(mockUpdateActivacionEvidencias).toHaveBeenCalledWith('eval-123', true);
      expect(defaultProps.onRefresh).toHaveBeenCalled();
    });
  });
});
