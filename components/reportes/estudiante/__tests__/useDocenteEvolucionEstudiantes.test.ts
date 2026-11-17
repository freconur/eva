import { renderHook, waitFor } from '@testing-library/react';
import { useDocenteEvolucionEstudiantes } from '../useDocenteEvolucionEstudiantes';
import { Evaluaciones } from '@/features/types/types';

// Mock de Firestore
jest.mock('firebase/firestore', () => ({
  getFirestore: jest.fn(),
  collection: jest.fn(),
  query: jest.fn(),
  where: jest.fn(),
  getDocs: jest.fn(() =>
    Promise.resolve({
      empty: false,
      forEach: (cb: any) => {
        // Simular documentos de estudiantes en Firestore donde el campo es nombresApellidos
        cb({
          id: '91280388',
          data: () => ({
            dni: '91280388',
            nombresApellidos: 'QUISPE MAMANI JUAN CARLOS',
            seccion: 'c',
            grado: '3',
            puntaje: 18,
            nivel: 'Satisfactorio',
          }),
        });
        cb({
          id: '91292265',
          data: () => ({
            dni: '91292265',
            nombresApellidos: 'FLORES ROJAS MARIA ELENA',
            seccion: 'c',
            grado: '3',
            puntaje: 14,
            nivel: 'En Proceso',
          }),
        });
        // Caso de prueba con puntaje máximo (200 pts) y respuestasCorrectas raw desfasada (7)
        cb({
          id: '91312787',
          data: () => ({
            dni: '91312787',
            nombresApellidos: 'ANGELES LUANA VILCA CAJIA',
            seccion: 'c',
            grado: '3',
            puntaje: 200,
            nivel: 'Satisfactorio',
            totalPreguntas: 20,
            respuestasCorrectas: 7, // Simulación de data en base de datos con aciertos incongruentes
          }),
        });
      },
    })
  ),
  doc: jest.fn(),
  getDoc: jest.fn(() =>
    Promise.resolve({
      exists: () => false,
    })
  ),
}));

const mockEvaluacion: Evaluaciones = {
  id: 'eval-ep1',
  nombre: 'Evaluación Progresiva 1',
  grado: 3,
  categoria: 1,
  añoDelExamen: '2026',
  mesDelExamen: '6',
  tipoDeEvaluacion: '1',
  active: true,
  cerrada: false,
};

describe('useDocenteEvolucionEstudiantes Hook', () => {
  it('resuelve correctamente nombresApellidos desde Firestore y no recurre al fallback "Estudiante"', async () => {
    const { result } = renderHook(() =>
      useDocenteEvolucionEstudiantes({
        evaluacion: mockEvaluacion,
        dniDocente: '10203040',
        currentEstudiantes: [],
        yearSelected: 2026,
        monthSelected: 6,
        isDemoMode: false,
      })
    );

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    const estudiantes = result.current.estudiantesEvolutivos;
    expect(estudiantes.length).toBe(3);

    const quispe = estudiantes.find((e) => e.dni === '91280388');
    expect(quispe).toBeDefined();
    expect(quispe?.nombreCompleto).toBe('QUISPE MAMANI JUAN CARLOS');
    expect(quispe?.nombreCompleto).not.toBe('Estudiante');

    const flores = estudiantes.find((e) => e.dni === '91292265');
    expect(flores).toBeDefined();
    expect(flores?.nombreCompleto).toBe('FLORES ROJAS MARIA ELENA');
    expect(flores?.nombreCompleto).not.toBe('Estudiante');

    // Validación del caso crítico: estudiante con 200/200 pts debe reflejar 20/20 (100%) aciertos
    const angeles = estudiantes.find((e) => e.dni === '91312787');
    expect(angeles).toBeDefined();
    expect(angeles?.nombreCompleto).toBe('ANGELES LUANA VILCA CAJIA');
    const etapaActual = Object.values(angeles?.etapas || {})[0];
    expect(etapaActual).toBeDefined();
    expect(etapaActual?.puntaje).toBe(200);
    expect(etapaActual?.respuestasCorrectas).toBe(20);
    expect(etapaActual?.porcentaje).toBe(100);
  });
});
