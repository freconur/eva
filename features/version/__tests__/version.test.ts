import { compareSemver, isUpdateAvailable } from '../version.config';

describe('Version comparator and update detection', () => {
  describe('compareSemver', () => {
    it('debe detectar correctamente si una versión es mayor', () => {
      expect(compareSemver('0.1.1', '0.1.0')).toBe(1);
      expect(compareSemver('1.0.0', '0.9.9')).toBe(1);
      expect(compareSemver('1.2.10', '1.2.2')).toBe(1);
      expect(compareSemver('2.0.0', '1.99.99')).toBe(1);
    });

    it('debe detectar correctamente si una versión es menor', () => {
      expect(compareSemver('0.1.0', '0.1.1')).toBe(-1);
      expect(compareSemver('0.9.9', '1.0.0')).toBe(-1);
      expect(compareSemver('1.2.2', '1.2.10')).toBe(-1);
    });

    it('debe detectar versiones iguales independientemente del prefijo v', () => {
      expect(compareSemver('0.1.0', '0.1.0')).toBe(0);
      expect(compareSemver('v1.0.0', '1.0.0')).toBe(0);
      expect(compareSemver('1.0.0', 'v1.0.0')).toBe(0);
      expect(compareSemver('v2.1.3', 'V2.1.3')).toBe(0);
    });

    it('debe manejar entradas vacías o inválidas sin caerse', () => {
      expect(compareSemver('', '')).toBe(0);
      expect(compareSemver('1.0.0', '')).toBe(0);
    });
  });

  describe('isUpdateAvailable', () => {
    it('debe retornar true si la versión del servidor es mayor a la del cliente', () => {
      const serverData = {
        version: '0.1.1',
        activo: true,
      };
      expect(isUpdateAvailable(serverData, '0.1.0')).toBe(true);
    });

    it('debe retornar false si las versiones son idénticas', () => {
      const serverData = {
        version: '0.1.0',
        activo: true,
      };
      expect(isUpdateAvailable(serverData, '0.1.0')).toBe(false);
    });

    it('debe retornar false si la versión del cliente es mayor a la del servidor', () => {
      const serverData = {
        version: '0.1.0',
        activo: true,
      };
      expect(isUpdateAvailable(serverData, '0.1.1')).toBe(false);
    });

    it('debe retornar false si activo es false (aviso desactivado)', () => {
      const serverData = {
        version: '0.2.0',
        activo: false,
      };
      expect(isUpdateAvailable(serverData, '0.1.0')).toBe(false);
    });

    it('debe retornar false si serverData es null o no tiene versión', () => {
      expect(isUpdateAvailable(null, '0.1.0')).toBe(false);
      expect(isUpdateAvailable(undefined, '0.1.0')).toBe(false);
      expect(isUpdateAvailable({ version: '' }, '0.1.0')).toBe(false);
    });
  });
});
