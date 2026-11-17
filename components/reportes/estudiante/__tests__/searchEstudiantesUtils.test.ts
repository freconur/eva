import {
  normalizeSearchText,
  damerauLevenshtein,
  searchAndRankStudents,
} from '../searchEstudiantesUtils';

describe('searchEstudiantesUtils', () => {
  describe('normalizeSearchText', () => {
    it('elimina acentos, pasa a minúsculas y equipara ñ con n', () => {
      expect(normalizeSearchText('ÁNGEL PEÑA NÚÑEZ')).toBe('angel pena nunez');
      expect(normalizeSearchText('  franco   condori  ')).toBe('franco condori');
    });

    it('limpia signos de puntuación como puntos y guiones en DNIs o nombres', () => {
      expect(normalizeSearchText('47.163.626')).toBe('47 163 626');
      expect(normalizeSearchText('Pérez-Ramos')).toBe('perez ramos');
    });
  });

  describe('damerauLevenshtein', () => {
    it('calcula correctamente distancia por transposiciones contiguas', () => {
      expect(damerauLevenshtein('franco', 'frnaco')).toBe(1);
      expect(damerauLevenshtein('condori', 'condory')).toBe(1);
    });
  });

  describe('searchAndRankStudents', () => {
    const estudiantes = [
      {
        dni: '47163626',
        nombres: 'FRANCO',
        apellidos: 'CONDORI MAMANI',
        nombreCompleto: 'CONDORI MAMANI FRANCO',
        seccion: 'c',
      },
      {
        dni: '91280388',
        nombres: 'JUAN CARLOS',
        apellidos: 'QUISPE CONDORI',
        nombreCompleto: 'QUISPE CONDORI JUAN CARLOS',
        seccion: 'c',
      },
      {
        dni: '91292265',
        nombres: 'MARIA ELENA',
        apellidos: 'FLORES ROJAS',
        nombreCompleto: 'FLORES ROJAS MARIA ELENA',
        seccion: 'b',
      },
      {
        dni: '91312787',
        nombres: 'ANGELES LUANA',
        apellidos: 'VILCA CAJIA',
        nombreCompleto: 'VILCA CAJIA ANGELES LUANA',
        seccion: 'c',
      },
    ];

    it('encuentra estudiante cuando se combina nombre, apellido y DNI en cualquier orden', () => {
      // Caso exacto solicitado por el usuario: "franco condori 47163626"
      const res1 = searchAndRankStudents(estudiantes, 'franco condori 47163626');
      expect(res1.length).toBe(1);
      expect(res1[0].dni).toBe('47163626');
      expect(res1[0].nombreCompleto).toBe('CONDORI MAMANI FRANCO');

      // Orden inverso con DNI primero: "47163626 franco"
      const res2 = searchAndRankStudents(estudiantes, '47163626 franco');
      expect(res2.length).toBe(1);
      expect(res2[0].dni).toBe('47163626');

      // Mezcla de apellido + DNI: "condori 47163626"
      const res3 = searchAndRankStudents(estudiantes, 'condori 47163626');
      expect(res3.length).toBe(1);
      expect(res3[0].dni).toBe('47163626');
    });

    it('discrimina cuando múltiples estudiantes comparten un apellido', () => {
      // Ambos tienen "condori" en su apellido
      const condoris = searchAndRankStudents(estudiantes, 'condori');
      expect(condoris.length).toBe(2);

      // Si se agrega el DNI o nombre, solo queda el específico
      const soloFranco = searchAndRankStudents(estudiantes, 'condori franco');
      expect(soloFranco.length).toBe(1);
      expect(soloFranco[0].dni).toBe('47163626');

      const soloJuan = searchAndRankStudents(estudiantes, 'condori juan 91280388');
      expect(soloJuan.length).toBe(1);
      expect(soloJuan[0].dni).toBe('91280388');
    });

    it('soporta búsqueda por prefijos de DNI o nombres', () => {
      const res = searchAndRankStudents(estudiantes, 'fran 4716');
      expect(res.length).toBe(1);
      expect(res[0].dni).toBe('47163626');
    });

    it('tolera erratas tipográficas leves en nombres', () => {
      // "frnaco" en lugar de "franco" + DNI
      const res = searchAndRankStudents(estudiantes, 'frnaco condori 47163626');
      expect(res.length).toBe(1);
      expect(res[0].dni).toBe('47163626');
    });

    it('soporta búsqueda con tildes y mayúsculas/minúsculas indistintamente', () => {
      const res = searchAndRankStudents(estudiantes, 'ángeles vilca 91312787');
      expect(res.length).toBe(1);
      expect(res[0].dni).toBe('91312787');
    });

    it('devuelve todos los estudiantes si la búsqueda está vacía', () => {
      expect(searchAndRankStudents(estudiantes, '')).toEqual(estudiantes);
      expect(searchAndRankStudents(estudiantes, '   ')).toEqual(estudiantes);
    });
  });
});
