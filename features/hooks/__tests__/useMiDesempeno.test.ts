import { resolverNivelLogro } from '../useMiDesempeno';
import { NivelYPuntaje } from '../../types/types';

describe('useMiDesempeno - resolverNivelLogro', () => {
  const nivelesPersonalizados: NivelYPuntaje[] = [
    { nivel: 'Inicio', min: 0, max: 10, color: '#ef4444' },
    { nivel: 'En Proceso', min: 11, max: 14, color: '#f59e0b' },
    { nivel: 'Satisfactorio', min: 15, max: 18, color: '#3b82f6' },
    { nivel: 'Destacado', min: 19, max: 20, color: '#10b981' },
  ];

  it('resuelve correctamente el nivel cuando hay niveles personalizados', () => {
    const resInicio = resolverNivelLogro(8, nivelesPersonalizados);
    expect(resInicio.nivel).toBe('Inicio');
    expect(resInicio.color).toBe('#ef4444');

    const resProceso = resolverNivelLogro(13, nivelesPersonalizados);
    expect(resProceso.nivel).toBe('En Proceso');
    expect(resProceso.color).toBe('#f59e0b');

    const resSatis = resolverNivelLogro(16, nivelesPersonalizados);
    expect(resSatis.nivel).toBe('Satisfactorio');
    expect(resSatis.color).toBe('#3b82f6');

    const resDest = resolverNivelLogro(20, nivelesPersonalizados);
    expect(resDest.nivel).toBe('Destacado');
    expect(resDest.color).toBe('#10b981');
  });

  it('calcula niveles relativos al total de criterios cuando no hay niveles configurados', () => {
    // Para 5 criterios (máximo 20 puntos):
    // Destacado: >= 17.5 (5 * 3.5)
    // Satisfactorio: >= 12.5 (5 * 2.5)
    // Proceso: >= 7.5 (5 * 1.5)
    // Inicio: < 7.5
    const totalCriterios = 5;

    expect(resolverNivelLogro(19, undefined, totalCriterios).nivel).toBe('Destacado');
    expect(resolverNivelLogro(14, undefined, totalCriterios).nivel).toBe('Satisfactorio');
    expect(resolverNivelLogro(9, undefined, totalCriterios).nivel).toBe('En Proceso');
    expect(resolverNivelLogro(5, undefined, totalCriterios).nivel).toBe('Inicio');
  });

  it('usa fallback de escala 20 si no hay criterios ni niveles', () => {
    expect(resolverNivelLogro(19).nivel).toBe('Destacado');
    expect(resolverNivelLogro(15).nivel).toBe('Satisfactorio');
    expect(resolverNivelLogro(12).nivel).toBe('En Proceso');
    expect(resolverNivelLogro(7).nivel).toBe('Inicio');
  });
});
