const regiones = [
  { region: "puno", id: 1 },
  { region: "san román", id: 2 },
  { region: "chucuito-juli", id: 3 },
  { region: "yunguyo", id: 4 },
  { region: "el collao", id: 5 },
  { region: "putina", id: 6 },
  { region: "huancané", id: 7 },
  { region: "sandia", id: 8 },
  { region: "crucero", id: 9 },
  { region: "carabaya", id: 10 },
  { region: "lampa", id: 11 },
  { region: "melgar", id: 12 },
  { region: "azángaro", id: 13 },
  { region: "moho", id: 14 },
]

export const regionTexto = (id: string) => {
  let rta
  regiones.forEach(reg => {
    if (Number(id) === reg.id) {
      rta = reg.region
    }
  })
  return rta
}

export const convertGrade = (grade: string) => {
  if (grade === "1") return "1ro grado"
  if (grade === "2") return "2do grado"
  if (grade === "3") return "3ro grado"
  if (grade === "4") return "4to grado"
  if (grade === "5") return "5to grado"
  if (grade === "6") return "6to grado"
  if (grade === "7") return "1ro sec."
  if (grade === "8") return "2ro sec."
  if (grade === "9") return "3ro sec."
  if (grade === "10") return "4to sec."
  if (grade === "11") return "5to sec."
}

export const sectionByGrade = [
  { id: 1, name: "a" },
  { id: 2, name: "b" },
  { id: 3, name: "c" },
  { id: 4, name: "d" },
  { id: 5, name: "e" },
  { id: 6, name: "f" },
  { id: 7, name: "g" },
  { id: 8, name: "h" },
  { id: 9, name: "i" },
  { id: 10, name: "j" },
  { id: 11, name: "k" },
  { id: 12, name: "l" },
  { id: 13, name: "m" },
  { id: 14, name: "n" },
  { id: 15, name: "o" },
]