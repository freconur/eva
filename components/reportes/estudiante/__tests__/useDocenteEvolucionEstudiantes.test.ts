import { renderHook, waitFor } from '@testing-library/react';
import { useDocenteEvolucionEstudiantes } from '../useDocenteEvolucionEstudiantes';
import { isEvaluacionEnMatriz } from '@/components/reportes/director/useEvaluacionesMatriz';
import { Evaluaciones } from '@/features/types/types';

// Mock de Firestore
jest.mock('firebase/firestore', () => ({
  getFirestore: jest.fn(),
  collection: jest.fn(),
  query: jest.fn(),
  where: jest.fn(),
  orderBy: jest.fn(),
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
        // Caso de prueba real: Estudiante con 418 pts en escala de 900 pts y 28 preguntas
        cb({
          id: '78697318',
          data: () => ({
            dni: '78697318',
            nombresApellidos: 'AMANQUI ARIZACA, LUIS FERNANDO FAUSTINO',
            seccion: 'g',
            grado: '6',
            puntaje: 418,
            nivel: 'En Inicio',
            totalPreguntas: 28,
            respuestas: {
              '12': 'b', '13': 'b', '14': 'a', '15': 'd', '16': 'd', '17': 'c',
              '18': 'a', '19': 'a', '20': 'c', '21': 'a', '22': 'a', '23': 'c',
              '24': 'c', '25': 'd', '26': 'c', '27': 'c', '28': 'b', '29': 'a',
              '30': 'd', '31': 'a', '32': 'd', '33': 'a', '34': 'a', '35': 'c',
              '36': 'c', '37': 'a', '38': 'b', '39': 'a',
            },
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
    expect(estudiantes.length).toBe(4);

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

  it('calcula con precisión los aciertos en EDI con escala 900 (13 aciertos / 418 pts) y maneja etapas no evaluadas', async () => {
    const mockEvaluacionEscala900: Evaluaciones = {
      ...mockEvaluacion,
      id: 'eval-edi-900',
      nombre: 'Evaluación EDI Primaria',
      nivelYPuntaje: [
        { id: 1, nivel: 'satisfactorio', min: 526, max: 900, color: 'nivelSatisfactorio' },
        { id: 2, nivel: 'en proceso', min: 422, max: 525, color: 'nivelEnProceso' },
        { id: 3, nivel: 'en inicio', min: 352, max: 421, color: 'nivelEnInicio' },
        { id: 4, nivel: 'previo al inicio', min: 0, max: 351, color: 'nivelPrevioInicio' },
      ],
    };

    const { result } = renderHook(() =>
      useDocenteEvolucionEstudiantes({
        evaluacion: mockEvaluacionEscala900,
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
    const amanqui = estudiantes.find((e) => e.dni === '78697318');
    expect(amanqui).toBeDefined();
    expect(amanqui?.nombreCompleto).toBe('AMANQUI ARIZACA, LUIS FERNANDO FAUSTINO');

    const etapaAmanqui = Object.values(amanqui?.etapas || {})[0];
    expect(etapaAmanqui).toBeDefined();
    expect(etapaAmanqui?.puntaje).toBe(418);
    // 418 pts de 900 con 28 preguntas debe calcular exactamente 13 aciertos (y jamás 1 acierto)
    expect(etapaAmanqui?.respuestasCorrectas).toBe(13);
    expect(etapaAmanqui?.porcentaje).toBe(46);

    // Las actuaciones pedagógicas deben registrar 13 aciertos con valor 2 (SÍ)
    const aciertosCount = Object.values(etapaAmanqui?.actuacionesResultados || {}).filter(
      (v) => v === 2
    ).length;
    expect(aciertosCount).toBe(13);
  });

  it('mantiene los datos en caché de módulo y evita consultas redundantes a Firestore en remount', async () => {
    const { clearEvolucionModuleCache } = require('../useDocenteEvolucionEstudiantes');
    clearEvolucionModuleCache();
    const { getDocs } = require('firebase/firestore');
    const initialCallCount = getDocs.mock.calls.length;

    // Primer render (simula abrir la pestaña "Evolución" por primera vez)
    const hook1 = renderHook(() =>
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
      expect(hook1.result.current.loading).toBe(false);
    });

    const callsAfterFirst = getDocs.mock.calls.length;
    expect(callsAfterFirst).toBeGreaterThan(initialCallCount);

    // Desmontar el hook (simula que el usuario cambió a otra pestaña como "Grilla")
    hook1.unmount();

    // Segundo render (simula que el usuario regresa a la pestaña "Evolución")
    const hook2 = renderHook(() =>
      useDocenteEvolucionEstudiantes({
        evaluacion: mockEvaluacion,
        dniDocente: '10203040',
        currentEstudiantes: [],
        yearSelected: 2026,
        monthSelected: 6,
        isDemoMode: false,
      })
    );

    // Debe cargar inmediatamente desde caché sin estado de carga prolongado
    expect(hook2.result.current.loading).toBe(false);
    expect(hook2.result.current.estudiantesEvolutivos.length).toBeGreaterThan(0);

    // Verificamos que NO se hayan hecho llamadas adicionales a Firestore
    expect(getDocs.mock.calls.length).toBe(callsAfterFirst);
  });

  it('detecta automáticamente la etapa EP3 cuando el administrador la configuró en la matriz', async () => {
    const { clearEvolucionModuleCache } = require('../useDocenteEvolucionEstudiantes');
    clearEvolucionModuleCache();

    const matrizConEp3 = {
      '3_1': {
        gradoId: 3,
        categoriaId: 1,
        ediId: 'eval-edi',
        ep1Id: 'eval-ep1',
        ep2Id: 'eval-ep2',
        ep3Id: 'eval-ep3',
        etapas: [
          { id: 'edi', codigo: 'EDI', nombre: 'Evaluación Diagnóstica', evaluacionId: 'eval-edi' },
          { id: 'ep1', codigo: 'EP1', nombre: 'Evaluación Progresiva 1', evaluacionId: 'eval-ep1' },
          { id: 'ep2', codigo: 'EP2', nombre: 'Evaluación Progresiva 2', evaluacionId: 'eval-ep2' },
          { id: 'ep3', codigo: 'EP3', nombre: 'Evaluación Progresiva 3', evaluacionId: 'eval-ep3' },
        ],
      },
    };

    const { result } = renderHook(() =>
      useDocenteEvolucionEstudiantes({
        evaluacion: mockEvaluacion,
        matrizConfigGrados: matrizConEp3,
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

    const etapas = result.current.etapasConfiguradas;
    expect(etapas.length).toBe(4);

    const ep3 = etapas.find((e) => e.key === 'ep3');
    expect(ep3).toBeDefined();
    expect(ep3?.id).toBe('eval-ep3');
    expect(ep3?.label).toBe('EP3 (Progresiva 3)');
    expect(ep3?.order).toBe(4);

    // Los estudiantes deben tener la etapa ep3 procesada
    const quispe = result.current.estudiantesEvolutivos.find((e) => e.dni === '91280388');
    expect(quispe).toBeDefined();
    expect(quispe?.etapas['ep3']).toBeDefined();
    expect(quispe?.etapas['ep3'].evaluacionId).toBe('eval-ep3');
  });

  it('isEvaluacionEnMatriz reconoce evaluaciones de etapas dinámicas (como EP3)', () => {
    const matriz = {
      '3_1': {
        gradoId: 3,
        categoriaId: 1,
        ediId: 'eval-edi',
        ep1Id: 'eval-ep1',
        ep2Id: 'eval-ep2',
        ep3Id: 'eval-ep3',
        etapas: [
          { id: 'edi', codigo: 'EDI', evaluacionId: 'eval-edi' },
          { id: 'ep1', codigo: 'EP1', evaluacionId: 'eval-ep1' },
          { id: 'ep2', codigo: 'EP2', evaluacionId: 'eval-ep2' },
          { id: 'ep3', codigo: 'EP3', evaluacionId: 'eval-ep3' },
        ],
      },
    };

    expect(isEvaluacionEnMatriz('eval-edi', matriz)).toBe(true);
    expect(isEvaluacionEnMatriz('eval-ep1', matriz)).toBe(true);
    expect(isEvaluacionEnMatriz('eval-ep2', matriz)).toBe(true);
    expect(isEvaluacionEnMatriz('eval-ep3', matriz)).toBe(true);
    expect(isEvaluacionEnMatriz('eval-inexistente', matriz)).toBe(false);
  });
});
