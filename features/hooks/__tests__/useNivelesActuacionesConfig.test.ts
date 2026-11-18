import {
  DEFAULT_NIVELES_ACTUACIONES,
  determinarNivelActuacion,
  validarNivelesActuacion,
  NivelActuacionItem,
} from '../useNivelesActuacionesConfig';

jest.mock('@/firebase/firebase.config', () => ({
  db: {},
}));

describe('useNivelesActuacionesConfig - Lógica de Escala Global', () => {
  describe('DEFAULT_NIVELES_ACTUACIONES', () => {
    it('contiene exactamente los 4 niveles solicitados para evaluaciones progresivas', () => {
      expect(DEFAULT_NIVELES_ACTUACIONES).toHaveLength(4);

      const nombres = DEFAULT_NIVELES_ACTUACIONES.map((n) => n.nombre);
      expect(nombres).toEqual([
        'Por desarrollar',
        'Iniciándose',
        'Consolidación',
        'Autonomía',
      ]);
    });

    it('la plantilla por defecto pasa la validación de consistencia', () => {
      const res = validarNivelesActuacion(DEFAULT_NIVELES_ACTUACIONES);
      expect(res.valido).toBe(true);
      expect(res.error).toBeUndefined();
    });
  });

  describe('validarNivelesActuacion', () => {
    it('falla si hay menos de dos niveles configurados', () => {
      const soloUno: NivelActuacionItem[] = [
        { id: 1, key: 'u', nombre: 'Único', min: 0, max: 4, color: '#ef4444' },
      ];
      const res = validarNivelesActuacion(soloUno);
      expect(res.valido).toBe(false);
      expect(res.error).toMatch(/al menos dos niveles/i);
    });

    it('falla si algún nivel tiene nombre vacío o en blanco', () => {
      const conNombreVacio: NivelActuacionItem[] = [
        { id: 1, key: '1', nombre: '   ', min: 0, max: 1, color: '#ef4444' },
        { id: 2, key: '2', nombre: 'Nivel 2', min: 2, max: 4, color: '#10b981' },
      ];
      const res = validarNivelesActuacion(conNombreVacio);
      expect(res.valido).toBe(false);
      expect(res.error).toMatch(/nombre válido/i);
    });

    it('falla si el valor mínimo es mayor que el valor máximo', () => {
      const minMayorQueMax: NivelActuacionItem[] = [
        { id: 1, key: '1', nombre: 'Nivel 1', min: 3, max: 1, color: '#ef4444' },
        { id: 2, key: '2', nombre: 'Nivel 2', min: 4, max: 5, color: '#10b981' },
      ];
      const res = validarNivelesActuacion(minMayorQueMax);
      expect(res.valido).toBe(false);
      expect(res.error).toMatch(/mínimo.*no puede ser mayor/i);
    });

    it('falla si existen rangos superpuestos entre niveles consecutivos', () => {
      const superpuestos: NivelActuacionItem[] = [
        { id: 1, key: '1', nombre: 'Nivel A', min: 0, max: 2, color: '#ef4444' },
        { id: 2, key: '2', nombre: 'Nivel B', min: 2, max: 4, color: '#10b981' }, // 2 se superpone con máx 2
      ];
      const res = validarNivelesActuacion(superpuestos);
      expect(res.valido).toBe(false);
      expect(res.error).toMatch(/rangos se superponen/i);
    });

    it('falla si los valores son negativos', () => {
      const negativo: NivelActuacionItem[] = [
        { id: 1, key: '1', nombre: 'Nivel Negativo', min: -1, max: 2, color: '#ef4444' },
        { id: 2, key: '2', nombre: 'Nivel Positivo', min: 3, max: 5, color: '#10b981' },
      ];
      const res = validarNivelesActuacion(negativo);
      expect(res.valido).toBe(false);
      expect(res.error).toMatch(/no pueden ser negativos/i);
    });
  });

  describe('determinarNivelActuacion', () => {
    it('clasifica correctamente los aciertos según la escala institucional de 4 niveles', () => {
      // 0 aciertos -> Por desarrollar
      expect(determinarNivelActuacion(0).nombre).toBe('Por desarrollar');

      // 1 acierto -> Iniciándose
      expect(determinarNivelActuacion(1).nombre).toBe('Iniciándose');

      // 2 aciertos -> Consolidación
      expect(determinarNivelActuacion(2).nombre).toBe('Consolidación');

      // 3 aciertos -> Autonomía
      expect(determinarNivelActuacion(3).nombre).toBe('Autonomía');

      // 4 aciertos -> Autonomía
      expect(determinarNivelActuacion(4).nombre).toBe('Autonomía');
    });

    it('asigna el nivel máximo si el número de aciertos supera el límite superior', () => {
      expect(determinarNivelActuacion(10).nombre).toBe('Autonomía');
    });

    it('respeta configuraciones personalizadas de niveles', () => {
      const escalaPersonalizada: NivelActuacionItem[] = [
        { id: 1, key: 'bajo', nombre: 'Inicial', min: 0, max: 2, color: '#ef4444' },
        { id: 2, key: 'medio', nombre: 'Intermedio', min: 3, max: 6, color: '#f59e0b' },
        { id: 3, key: 'alto', nombre: 'Sobresaliente', min: 7, max: 10, color: '#10b981' },
      ];

      expect(determinarNivelActuacion(2, 10, escalaPersonalizada).nombre).toBe('Inicial');
      expect(determinarNivelActuacion(5, 10, escalaPersonalizada).nombre).toBe('Intermedio');
      expect(determinarNivelActuacion(8, 10, escalaPersonalizada).nombre).toBe('Sobresaliente');
    });
  });
});
