export const especialidad = [
  {
    id:1,
    categoria:'lee'
  },
  {
    id:2,
    categoria:'resuelve problemas'
  }
]

export const categoriaTransform = (data:number) => {
  let rta
  especialidad.forEach(a => {
    if(a.id === data){
      rta = a.categoria
    }
  })
  return rta
}