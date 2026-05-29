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

export const categoriaTransform = (data: number, dynamicCategories?: any[]) => {
  const list = dynamicCategories && dynamicCategories.length > 0 ? dynamicCategories : especialidad;
  const found = list.find(a => Number(a.id) === data);
  return found ? found.categoria : '-';
};