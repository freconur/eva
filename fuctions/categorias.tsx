export const especialidad = [
  {
    id: 1,
    categoria: 'lee'
  },
  {
    id: 2,
    categoria: 'resuelve problemas'
  },
  {
    id: 3,
    categoria: 'Comunicación-Secundaria'
  },
  {
    id: 4,
    categoria: 'Matemática-Secundaria'
  },
  {
    id: 5,
    categoria: 'Ciencia y Tecnología-Secundaria'
  },
  {
    id: 6,
    categoria: 'DPCC-Secundaria'
  },
  {
    id: 7,
    categoria: 'Ciencias Sociales-Secundaria'
  },
  {
    id: 8,
    categoria: 'Personal Social'
  },
  {
    id: 9,
    categoria: 'Ciencia y Tecnologia'
  },
]

export const categoriaTransform = (data: number) => {
  let rta
  especialidad.forEach(a => {
    if (a.id === data) {
      rta = a.categoria
    }
  })
  return rta
}