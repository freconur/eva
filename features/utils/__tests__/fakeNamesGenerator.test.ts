import {
  stringHash,
  generateRealisticStudentName,
  generateRealisticDocenteName,
  generateRealisticDirectorName,
  generateRealisticInstitucion,
  generateRealisticEstudiante,
  anonymizeEstudiantesList,
} from '../fakeNamesGenerator';
import { UserEstudiante } from '@/features/types/types';

describe('fakeNamesGenerator', () => {
  describe('stringHash', () => {
    it('genera un hash positivo y determinista para el mismo string', () => {
      const h1 = stringHash('70894512');
      const h2 = stringHash('70894512');
      expect(h1).toBe(h2);
      expect(h1).toBeGreaterThanOrEqual(0);
    });

    it('genera hashes distintos para entradas diferentes', () => {
      const h1 = stringHash('70894512');
      const h2 = stringHash('40123456');
      expect(h1).not.toBe(h2);
    });
  });

  describe('generateRealisticStudentName', () => {
    it('genera nombres y apellidos realistas con formato oficial', () => {
      const res = generateRealisticStudentName('74123456', 'M');
      expect(res.nombres).toBeTruthy();
      expect(res.apellidos).toBeTruthy();
      expect(res.nombresApellidos).toContain(res.apellidos);
      expect(res.nombresApellidos).toContain(res.nombres);
      expect(res.dni).toMatch(/^\d{2}\*{3}\d{3}$/);
    });

    it('es determinista: el mismo seed devuelve siempre el mismo estudiante', () => {
      const a = generateRealisticStudentName('74123456', 'M');
      const b = generateRealisticStudentName('74123456', 'M');
      expect(a).toEqual(b);
    });
  });

  describe('generateRealisticDirectorName y Docente', () => {
    it('genera un director con título y apellidos peruanos', () => {
      const dir = generateRealisticDirectorName('70894512');
      expect(dir.fullName).toMatch(/^(Lic\.|Mg\.|Dr\.)/);
      expect(dir.nombres).toBeTruthy();
      expect(dir.apellidos).toBeTruthy();
      expect(dir.dni).toMatch(/^\d{2}\*{3}\d{3}$/);
    });

    it('genera un docente con prefijo Prof.', () => {
      const doc = generateRealisticDocenteName('40112233');
      expect(doc).toMatch(/^Prof\./);
    });
  });

  describe('generateRealisticInstitucion', () => {
    it('genera una institución educativa creíble', () => {
      const col = generateRealisticInstitucion('70894512');
      expect(col).toMatch(/^I\.E\./);
    });
  });

  describe('generateRealisticEstudiante y anonymizeEstudiantesList', () => {
    const realStudent: UserEstudiante = {
      id: 'doc-real-123',
      dni: '74987654',
      nombres: 'Estudiante Real',
      apellidos: 'De Prueba',
      nombresApellidos: 'De Prueba, Estudiante Real',
      puntaje: 18,
      respuestasCorrectas: 18,
      respuestasIncorrectas: 2,
      totalPreguntas: 20,
      nivel: 'Satisfactorio',
      seccion: 'A',
      grado: 2,
      genero: 'F',
      respuestas: [
        { id: 'p1', respuesta: 'A', order: 1 } as any,
      ],
    };

    it('preserva las respuestas, puntajes y niveles mientras anonimiza la identidad', () => {
      const fake = generateRealisticEstudiante(realStudent, 0);

      // Datos anonimizados
      expect(fake.nombres).not.toBe(realStudent.nombres);
      expect(fake.apellidos).not.toBe(realStudent.apellidos);
      expect(fake.dni).not.toBe(realStudent.dni);

      // Datos pedagógicos intactos
      expect(fake.id).toBe(realStudent.id);
      expect(fake.puntaje).toBe(18);
      expect(fake.respuestasCorrectas).toBe(18);
      expect(fake.respuestasIncorrectas).toBe(2);
      expect(fake.totalPreguntas).toBe(20);
      expect(fake.nivel).toBe('Satisfactorio');
      expect(fake.seccion).toBe('A');
      expect(fake.grado).toBe(2);
      expect(fake.respuestas).toEqual(realStudent.respuestas);
    });

    it('anonymizeEstudiantesList procesa una lista completa', () => {
      const lista = [realStudent, { ...realStudent, id: 'doc-2', dni: '74112233' }];
      const res = anonymizeEstudiantesList(lista);
      expect(res).toHaveLength(2);
      expect(res[0].puntaje).toBe(18);
      expect(res[1].dni).not.toBe('74112233');
    });
  });
});
