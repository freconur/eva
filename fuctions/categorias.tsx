import { Category } from '@/features/types/types';

export const especialidad: Category[] = [
  {
    id: 1,
    categoria: 'lee',
    niveles: [0, 1]
  },
  {
    id: 2,
    categoria: 'resuelve problemas',
    niveles: [0, 1]
  },
  {
    id: 3,
    categoria: 'Comunicación-Secundaria',
    niveles: [2]
  },
  {
    id: 4,
    categoria: 'Matemática-Secundaria',
    niveles: [2]
  },
  {
    id: 5,
    categoria: 'Ciencia y Tecnología-Secundaria',
    niveles: [2]
  },
  {
    id: 6,
    categoria: 'DPCC-Secundaria',
    niveles: [2]
  },
  {
    id: 7,
    categoria: 'Ciencias Sociales-Secundaria',
    niveles: [2]
  },
  {
    id: 8,
    categoria: 'Personal Social',
    niveles: [1]
  },
  {
    id: 9,
    categoria: 'Ciencia y Tecnologia',
    niveles: [1]
  },
]

export const categoriaTransform = (data: number | string | undefined, dynamicCategories?: any[]) => {
  if (data === undefined || data === null || data === '') return '-';
  const list = dynamicCategories && dynamicCategories.length > 0 ? dynamicCategories : especialidad;
  const found = list.find(a => Number(a.id) === Number(data));
  return found ? found.categoria : '-';
};

export const getNivelFromGrado = (gradoId: number | string): number => {
  const num = Number(gradoId);
  if (num === 12) return 0; // Inicial (5 años)
  if (num >= 1 && num <= 6) return 1; // Primaria
  if (num >= 7 && num <= 11) return 2; // Secundaria
  return 1;
};

export const getCategoriasParaGrado = (
  gradoId: number | string,
  dynamicCategories?: Category[],
  evaluacionesList?: { grado?: number; categoria?: number }[]
): Category[] => {
  const list = dynamicCategories && dynamicCategories.length > 0 ? dynamicCategories : especialidad;
  const nivel = getNivelFromGrado(gradoId);

  const categoriasConEvals = new Set<number>();
  if (evaluacionesList) {
    evaluacionesList.forEach((e) => {
      if (Number(e.grado) === Number(gradoId) && e.categoria !== undefined && e.categoria !== null) {
        categoriasConEvals.add(Number(e.categoria));
      }
    });
  }

  const filtered = list.filter((c) => {
    if (c.activo === false) return false;
    if (categoriasConEvals.has(Number(c.id))) return true;
    if (!c.niveles || c.niveles.length === 0) return true;
    return c.niveles.includes(nivel);
  });

  return filtered.length > 0 ? filtered : list;
};