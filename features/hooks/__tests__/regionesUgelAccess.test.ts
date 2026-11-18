import { tieneAccesoPorUgel, getUgelsTexto, regiones, regionTexto } from '@/fuctions/regiones';

describe('tieneAccesoPorUgel', () => {
  it('permite acceso si evaluacion.ugels es undefined, null o vacío (retrocompatibilidad)', () => {
    expect(tieneAccesoPorUgel({})).toBe(true);
    expect(tieneAccesoPorUgel({ ugels: undefined })).toBe(true);
    expect(tieneAccesoPorUgel({ ugels: null })).toBe(true);
    expect(tieneAccesoPorUgel({ ugels: [] })).toBe(true);
    expect(tieneAccesoPorUgel({ ugels: [] }, 2)).toBe(true);
  });

  it('deniega acceso si la evaluación tiene UGELs restringidas y el usuario no tiene región', () => {
    const evaluacionRestringida = { ugels: [1, 2] };
    expect(tieneAccesoPorUgel(evaluacionRestringida, undefined)).toBe(false);
    expect(tieneAccesoPorUgel(evaluacionRestringida, null)).toBe(false);
    expect(tieneAccesoPorUgel(evaluacionRestringida, '')).toBe(false);
  });

  it('permite acceso si la región del usuario está en el array ugels (número o string)', () => {
    const evaluacionSanRoman = { ugels: [2, 4] };
    expect(tieneAccesoPorUgel(evaluacionSanRoman, 2)).toBe(true);
    expect(tieneAccesoPorUgel(evaluacionSanRoman, '2')).toBe(true);
    expect(tieneAccesoPorUgel(evaluacionSanRoman, 4)).toBe(true);
    expect(tieneAccesoPorUgel(evaluacionSanRoman, '4')).toBe(true);
  });

  it('deniega acceso si la región del usuario NO está en el array ugels', () => {
    const evaluacionSanRoman = { ugels: [2, 4] };
    expect(tieneAccesoPorUgel(evaluacionSanRoman, 1)).toBe(false);
    expect(tieneAccesoPorUgel(evaluacionSanRoman, '1')).toBe(false);
    expect(tieneAccesoPorUgel(evaluacionSanRoman, 3)).toBe(false);
  });
});

describe('getUgelsTexto', () => {
  it('retorna "Todas las UGELs" si ugels está vacío o no está definido', () => {
    expect(getUgelsTexto()).toBe('Todas las UGELs');
    expect(getUgelsTexto([])).toBe('Todas las UGELs');
  });

  it('retorna "Todas las UGELs" si contiene todas las UGELs registradas', () => {
    const todas = regiones.map(r => r.id);
    expect(getUgelsTexto(todas)).toBe('Todas las UGELs');
  });

  it('retorna los nombres de las UGELs separadas por coma', () => {
    expect(getUgelsTexto([2])).toBe('San Román');
    expect(getUgelsTexto([1, 2])).toBe('Puno, San Román');
  });
});
