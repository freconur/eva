import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import TablaPreguntas from '../TablaPreguntas';
import { PreguntasRespuestas } from '@/features/types/types';

jest.mock('@/features/context/GlolbalContext', () => ({
  useGlobalContext: () => ({
    currentUserData: { dni: '12345678', rol: 'docente' },
  }),
}));

const mockEstudiantes = Array.from({ length: 30 }, (_, i) => ({
  dni: `dni-${i + 1}`,
  nombresApellidos: `Estudiante ${i + 1}`,
  puntaje: 15,
  nivel: 'Satisfactorio',
  respuestas: [],
}));

const mockPreguntas: PreguntasRespuestas[] = [
  { id: 'p1', order: 1, respuesta: 'A' },
  { id: 'p2', order: 2, respuesta: 'B' },
];

describe('TablaPreguntas - Control de Paginación y Montaje', () => {
  it('NO debe llamar a onPageChange al montar el componente', () => {
    const onPageChangeMock = jest.fn();
    const onItemsPerPageChangeMock = jest.fn();

    render(
      <TablaPreguntas
        estudiantes={mockEstudiantes}
        preguntasRespuestas={mockPreguntas}
        currentPage={1}
        itemsPerPage={10}
        onPageChange={onPageChangeMock}
        onItemsPerPageChange={onItemsPerPageChangeMock}
      />
    );

    // No debe dispararse onPageChange en el montaje
    expect(onPageChangeMock).not.toHaveBeenCalled();
  });

  it('NO debe llamar a onPageChange al cambiar el límite si ya está en la página 1', () => {
    const onPageChangeMock = jest.fn();
    const onItemsPerPageChangeMock = jest.fn();

    const { rerender } = render(
      <TablaPreguntas
        estudiantes={mockEstudiantes}
        preguntasRespuestas={mockPreguntas}
        currentPage={1}
        itemsPerPage={10}
        onPageChange={onPageChangeMock}
        onItemsPerPageChange={onItemsPerPageChangeMock}
      />
    );

    expect(onPageChangeMock).not.toHaveBeenCalled();

    // Rerender con nuevo itemsPerPage mientras currentPage es 1
    rerender(
      <TablaPreguntas
        estudiantes={mockEstudiantes}
        preguntasRespuestas={mockPreguntas}
        currentPage={1}
        itemsPerPage={25}
        onPageChange={onPageChangeMock}
        onItemsPerPageChange={onItemsPerPageChangeMock}
      />
    );

    expect(onPageChangeMock).not.toHaveBeenCalled();
  });

  it('SÍ debe resetear a página 1 (onPageChange(1)) si el límite cambia y la página actual es mayor a 1', () => {
    const onPageChangeMock = jest.fn();
    const onItemsPerPageChangeMock = jest.fn();

    const { rerender } = render(
      <TablaPreguntas
        estudiantes={mockEstudiantes}
        preguntasRespuestas={mockPreguntas}
        currentPage={2}
        itemsPerPage={10}
        onPageChange={onPageChangeMock}
        onItemsPerPageChange={onItemsPerPageChangeMock}
      />
    );

    expect(onPageChangeMock).not.toHaveBeenCalled();

    // Rerender con nuevo itemsPerPage mientras currentPage es 2
    rerender(
      <TablaPreguntas
        estudiantes={mockEstudiantes}
        preguntasRespuestas={mockPreguntas}
        currentPage={2}
        itemsPerPage={25}
        onPageChange={onPageChangeMock}
        onItemsPerPageChange={onItemsPerPageChangeMock}
      />
    );

    expect(onPageChangeMock).toHaveBeenCalledTimes(1);
    expect(onPageChangeMock).toHaveBeenCalledWith(1);
  });
});
