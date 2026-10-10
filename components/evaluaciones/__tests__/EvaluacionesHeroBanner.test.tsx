import React from 'react';
import { render, screen, fireEvent, act } from '@testing-library/react';
import '@testing-library/jest-dom';
import EvaluacionesHeroBanner from '../EvaluacionesHeroBanner';
import { RiAwardLine } from 'react-icons/ri';

describe('EvaluacionesHeroBanner', () => {
  test('renderiza título y subtítulo por defecto en vista compacta', () => {
    render(
      <EvaluacionesHeroBanner
        selectedYear={2026}
        totalEvaluaciones={10}
        totalActivas={6}
        totalCerradas={4}
        totalGrados={5}
      />
    );

    expect(screen.getByRole('banner')).toBeInTheDocument();
    expect(screen.getByText('GESTIÓN DE EVALUACIONES')).toBeInTheDocument();
    expect(
      screen.getByText(
        'Supervisión directiva de pruebas diagnósticas y logros de aprendizaje'
      )
    ).toBeInTheDocument();
  });

  test('renderiza título y subtítulo personalizados', () => {
    render(
      <EvaluacionesHeroBanner
        title="MIS EVALUACIONES DOCENTES"
        subtitle="Seguimiento de pruebas pedagógicas de aula"
        selectedYear={2026}
      />
    );

    expect(screen.getByText('MIS EVALUACIONES DOCENTES')).toBeInTheDocument();
    expect(
      screen.getByText('Seguimiento de pruebas pedagógicas de aula')
    ).toBeInTheDocument();
  });

  test('renderiza contexto de periodo y colegio/institución', () => {
    render(
      <EvaluacionesHeroBanner
        colegio="I.E. Mariscal Cáceres"
        selectedYear={2026}
        selectedMonth="2"
      />
    );

    expect(screen.getByText(/Año Escolar 2026/)).toBeInTheDocument();
    expect(screen.getByText(/Marzo/)).toBeInTheDocument();
    expect(screen.getByText('I.E. Mariscal Cáceres')).toBeInTheDocument();
  });

  test('renderiza las 4 métricas estándar por atajos retrocompatibles', () => {
    render(
      <EvaluacionesHeroBanner
        selectedYear={2026}
        totalEvaluaciones={12}
        totalActivas={8}
        totalCerradas={4}
        totalGrados={6}
      />
    );

    expect(screen.getByText('Pruebas')).toBeInTheDocument();
    expect(screen.getByText('12')).toBeInTheDocument();

    expect(screen.getByText('Activas')).toBeInTheDocument();
    expect(screen.getByText('8')).toBeInTheDocument();

    expect(screen.getByText('Cerradas')).toBeInTheDocument();
    expect(screen.getByText('4')).toBeInTheDocument();

    expect(screen.getByText('Grados')).toBeInTheDocument();
    expect(screen.getByText('6')).toBeInTheDocument();
  });

  test('permite personalizar la etiqueta de grados por secciones', () => {
    render(
      <EvaluacionesHeroBanner
        selectedYear={2026}
        totalGrados={4}
        gradosLabel="Secciones"
      />
    );

    expect(screen.getByText('Secciones')).toBeInTheDocument();
    expect(screen.getByText('4')).toBeInTheDocument();
  });

  test('renderiza métricas dinámicas personalizadas vía array `metrics`', () => {
    const customMetrics = [
      {
        id: 'estudiantes',
        label: 'Estudiantes',
        value: 120,
        colorTheme: 'teal' as const,
        icon: RiAwardLine,
      },
      {
        id: 'promedio',
        label: 'Promedio',
        value: '16.5',
        colorTheme: 'amber' as const,
      },
    ];

    render(
      <EvaluacionesHeroBanner
        title="MONITOREO UGEL"
        selectedYear={2026}
        metrics={customMetrics}
      />
    );

    expect(screen.getByText('Estudiantes')).toBeInTheDocument();
    expect(screen.getByText('120')).toBeInTheDocument();
    expect(screen.getByText('Promedio')).toBeInTheDocument();
    expect(screen.getByText('16.5')).toBeInTheDocument();
  });

  test('renderiza la variante expandida (Vista Grande) con tarjetas destacadas y badgeTema', () => {
    render(
      <EvaluacionesHeroBanner
        variant="expanded"
        badgeTema="Panel Directivo 2026"
        selectedYear={2026}
        totalEvaluaciones={15}
        totalActivas={9}
        totalCerradas={6}
        totalGrados={8}
      />
    );

    expect(screen.getByText('Panel Directivo 2026')).toBeInTheDocument();
    expect(screen.getByText('GESTIÓN DE EVALUACIONES')).toBeInTheDocument();

    // En vista grande se muestran los valores y sus etiquetas de estado
    expect(screen.getByText('15')).toBeInTheDocument();
    expect(screen.getByText('Periodo')).toBeInTheDocument();

    expect(screen.getByText('9')).toBeInTheDocument();
    expect(screen.getByText('En curso')).toBeInTheDocument();

    expect(screen.getByText('6')).toBeInTheDocument();
    expect(screen.getByText('Concluidas')).toBeInTheDocument();

    expect(screen.getByText('8')).toBeInTheDocument();
    expect(screen.getByText('Alcance')).toBeInTheDocument();
  });

  test('no muestra el selector de auditoría si isAuditing y showVariantSwitch son falsos', () => {
    render(
      <EvaluacionesHeroBanner
        selectedYear={2026}
        isAuditing={false}
        showVariantSwitch={false}
      />
    );

    expect(
      screen.queryByRole('group', {
        name: 'Control de vista de banner para auditoría',
      })
    ).not.toBeInTheDocument();
  });

  test('muestra el selector de auditoría e interactúa para cambiar de vista', () => {
    const handleVariantChange = jest.fn();

    render(
      <EvaluacionesHeroBanner
        variant="compact"
        selectedYear={2026}
        isAuditing={true}
        onVariantChange={handleVariantChange}
      />
    );

    const switcher = screen.getByRole('group', {
      name: 'Control de vista de banner para auditoría',
    });
    expect(switcher).toBeInTheDocument();

    const btnGrande = screen.getByRole('button', { name: /Grande/i });
    const btnCompacta = screen.getByRole('button', { name: /Compacta/i });

    expect(btnCompacta).toHaveAttribute('aria-pressed', 'true');
    expect(btnGrande).toHaveAttribute('aria-pressed', 'false');

    // Clic en "Grande"
    fireEvent.click(btnGrande);
    expect(handleVariantChange).toHaveBeenCalledWith('expanded');

    // Clic en "Compacta"
    fireEvent.click(btnCompacta);
    expect(handleVariantChange).toHaveBeenCalledWith('compact');
  });

  test('renderiza imagen de fondo y permite subir o remover imagen en modo auditoría', () => {
    const mockUpload = jest.fn();
    const mockRemove = jest.fn();

    const { rerender } = render(
      <EvaluacionesHeroBanner
        selectedYear={2026}
        isAuditing={true}
        backgroundImage={null}
        onUploadBackgroundImage={mockUpload}
        onRemoveBackgroundImage={mockRemove}
      />
    );

    // Botón de subir fondo presente
    const btnUpload = screen.getByRole('button', { name: /Fondo/i });
    expect(btnUpload).toBeInTheDocument();

    // Simular selección de archivo
    const fileInput = screen.getByTestId('banner-file-input');
    const fakeFile = new File(['image_bytes'], 'banner.jpg', { type: 'image/jpeg' });
    fireEvent.change(fileInput, { target: { files: [fakeFile] } });
    expect(mockUpload).toHaveBeenCalledWith(fakeFile);

    // Rerender con imagen ya cargada
    rerender(
      <EvaluacionesHeroBanner
        selectedYear={2026}
        isAuditing={true}
        backgroundImage="https://fake.url/banner.jpg"
        backgroundImageOpacity={0.3}
        onUploadBackgroundImage={mockUpload}
        onRemoveBackgroundImage={mockRemove}
      />
    );

    expect(screen.getByRole('button', { name: /Cambiar Fondo/i })).toBeInTheDocument();
    const btnRemove = screen.getByRole('button', { name: /Eliminar imagen de fondo/i });
    expect(btnRemove).toBeInTheDocument();

    fireEvent.click(btnRemove);
    expect(mockRemove).toHaveBeenCalled();
  });

  test('renderiza extraBadges y actions si se suministran', () => {
    render(
      <EvaluacionesHeroBanner
        selectedYear={2026}
        extraBadges={<span data-testid="badge-extra">Nivel Secundaria</span>}
        actions={<button data-testid="btn-action">Descargar</button>}
      />
    );

    expect(screen.getByTestId('badge-extra')).toBeInTheDocument();
    expect(screen.getByTestId('btn-action')).toBeInTheDocument();
  });

  test('renderiza textos personalizados y permite editarlos en modal para el administrador', async () => {
    const mockUpdateTexts = jest.fn();
    const mockResetTexts = jest.fn();

    render(
      <EvaluacionesHeroBanner
        selectedYear={2026}
        isAuditing={true}
        customTitle="EVALUACIONES REGIONALES 2026"
        customSubtitle="Supervisión pedagógica especializada UGEL"
        onUpdateTexts={mockUpdateTexts}
        onResetTexts={mockResetTexts}
      />
    );

    // Debe mostrar los textos personalizados
    expect(screen.getByText('EVALUACIONES REGIONALES 2026')).toBeInTheDocument();
    expect(screen.getByText('Supervisión pedagógica especializada UGEL')).toBeInTheDocument();

    // Abrir modal con botón de editar textos
    const btnEditarTextos = screen.getByRole('button', { name: /Personalizar textos del banner/i });
    expect(btnEditarTextos).toBeInTheDocument();
    fireEvent.click(btnEditarTextos);

    // Modal debe estar visible
    expect(screen.getByRole('dialog')).toBeInTheDocument();
    expect(screen.getByText('Personalizar Textos del Banner')).toBeInTheDocument();

    // Inputs con valores iniciales
    const inputTitulo = screen.getByPlaceholderText(/ej. GESTIÓN DE EVALUACIONES/i);
    const textareaSubtitulo = screen.getByPlaceholderText(/ej. Supervisión directiva/i);
    expect(inputTitulo).toHaveValue('EVALUACIONES REGIONALES 2026');
    expect(textareaSubtitulo).toHaveValue('Supervisión pedagógica especializada UGEL');

    // Modificar valores y guardar
    fireEvent.change(inputTitulo, { target: { value: 'NUEVO TÍTULO 2026' } });
    fireEvent.change(textareaSubtitulo, { target: { value: 'Nuevo subtítulo descriptivo' } });

    const btnGuardar = screen.getByRole('button', { name: /Guardar Cambios/i });
    await act(async () => {
      fireEvent.click(btnGuardar);
    });

    expect(mockUpdateTexts).toHaveBeenCalledWith('NUEVO TÍTULO 2026', 'Nuevo subtítulo descriptivo');
  });

  test('permite restablecer textos por defecto desde el modal', async () => {
    const mockUpdateTexts = jest.fn();
    const mockResetTexts = jest.fn();

    render(
      <EvaluacionesHeroBanner
        selectedYear={2026}
        isAuditing={true}
        customTitle="TÍTULO ANTERIOR"
        onUpdateTexts={mockUpdateTexts}
        onResetTexts={mockResetTexts}
      />
    );

    const btnEditar = screen.getByRole('button', { name: /Personalizar textos del banner/i });
    fireEvent.click(btnEditar);

    const btnReset = screen.getByRole('button', { name: /Restablecer/i });
    expect(btnReset).toBeInTheDocument();
    await act(async () => {
      fireEvent.click(btnReset);
    });

    expect(mockResetTexts).toHaveBeenCalledTimes(1);
  });
});
