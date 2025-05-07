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

export const niveles = (value: number) => {
  if (value === 1) return "N1"
  if (value === 2) return "N2"
  if (value === 3) return "N3"
  if (value === 4) return "N4"
}
  
export const rolTexto = (rol: number) => {
  if (rol === 1) return "Especialista"
  if (rol === 2) return "Director"
  if (rol === 3) return "Docente"
  if (rol === 4) return "Admin"
}
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

export const converSeccion = (seccion: number) => {
  if (seccion === 1) return "a"
  if (seccion === 2) return "b"
  if (seccion === 3) return "c"
  if (seccion === 4) return "d"
  if (seccion === 5) return "e"
  if (seccion === 6) return "f"
  if (seccion === 7) return "g"
  if (seccion === 8) return "h"
}
export const converGenero = (genero: string) => {
  if (genero === "1") return "masculino"
  if (genero === "2") return "femenino"
}
export const gradosDeColegio = [
  { id: 1, name: "1ro grado" },
  { id: 2, name: "2do grado" },
  { id: 3, name: "3ro grado" },
  { id: 4, name: "4to grado" },
  { id: 5, name: "5to grado" },
  { id: 6, name: "6to grado" },
]
export const ordernarAscDsc = [
  { id: 1, name: "asc" },
  { id: 2, name: "desc" },
]
export const sectionByGrade = [
  { id: 1, name: "a" },
  { id: 2, name: "b" },
  { id: 3, name: "c" },
  { id: 4, name: "d" },
  { id: 5, name: "e" },
  { id: 6, name: "f" },
  { id: 7, name: "g" },
  { id: 8, name: "h" },
  /* { id: 9, name: "i" },
  { id: 10, name: "j" },
  { id: 11, name: "k" },
  { id: 12, name: "l" },
  { id: 13, name: "m" },
  { id: 14, name: "n" },
  { id: 15, name: "o" }, */
]
export const genero = [
  { id: 1, name: "masculino" },
  { id: 2, name: "femenino" },
]

export const area = [
  { id: 1, name: "rural" },
  { id: 2, name: "urbano" },
]

export const nivelCurricular = [
  { id: 1, name: "estandar III" },
  { id: 2, name: "estandar IV" },
  { id: 3, name: "estandar V" },
]

export const nivelCobertura = 
  {
    id: 1,
    order: 1,
    alternativas: [
      {
        id: 1,
        alternativa: "a",
        cobertura: "Cobertura Selectiva Limitada: Se abordan algunas habilidades y tipos, formatos textuales, pero se omiten áreas o habilidades importantes de manera no planificada o justificada pedagógicamente (Únicamente 2 capacidades y hasta 3 tipos textuales, hasta un formato textual).",
        selected: false,
      },
      {
        id: 2,
        alternativa: "b",
        cobertura: "Cobertura Parcial: Se aborda una parte significativa de las habilidades, pero quedan algunos sin cubrir o con una cobertura muy superficial. (Únicamente 2 capacidades y todos los tipos textuales, todos los formatos textuales).",
        selected: false,
      },
      {
        id: 3,
        alternativa: "c",
        cobertura: "Cobertura Selectiva Planificada: Se priorizan y profundizan ciertas habilidadesy tipos, formatos textuales del currículo de manera intencional y justificada pedagógicamente, pudiendo dejar otros con una cobertura menor. (Las 3 capacidades y todos los tipos textuales, todos los formatos textuales).",
        selected: false,
      },
      {
        id: 4,
        alternativa: "d",
        cobertura: "Cobertura Total (o Amplia y Conectada): Se abordan la mayoría o la totalidad de las habilidades y tipos, géneros, formatos del currículo, buscando establecer conexiones entre ellos y con otras áreas del conocimiento. (Las 3 capacidades y todos los tipos textuales, todos los formatos textuales).",
        selected: false,
      },
    ],
  }
 export const nivelCurricularPreguntas = [
    {
      id:1,
      selected: false,
      description:"estandar III"
    },
    {
      id:2,
      selected: false,
      description:"estandar IV"
    },  
    {
      id:3,
      selected: false,
      description:"estandar V"
    },
  ]
