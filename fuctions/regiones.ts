const regiones = [
  { region: "puno", id: 1 },
  { region: "san roman", id: 2 },
  { region: "chuquito-juli", id: 3 },
  { region: "yunguyo", id: 4 },
  { region: "ilave", id: 5 },
  { region: "putina", id: 6 },
  { region: "huancane", id: 7 },
  { region: "sandia", id: 8 },
  { region: "crucero", id: 9 },
  { region: "macusani", id: 10 },
  { region: "lampa", id: 11 },
  { region: "melgar", id: 12 },
  { region: "azangaro", id: 13 },
  { region: "moho", id: 14 },
]

export const regionTexto = (id: string) => {
  console.log("id", id)
  let rta
  regiones.forEach(reg => {
    if (Number(id) === reg.id) {
      rta = reg.region
    }
  })
  return rta
}