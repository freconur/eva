import { AppAction } from "../actions/appAction";

export type AppReducerValues = {
  testValue: boolean,
  showSidebar: boolean,
  currentUserData: User,
  evaluaciones: Evaluaciones[],
  evaluacion: Evaluaciones,
  preguntasRespuestas: PreguntasRespuestas[],
  sizePreguntas: number,
  preguntasRespuestasEstudiante: PreguntasRespuestas[],
  preguntasRespuestasEstudianteInitialValue: PreguntasRespuestas[],
  directores: User[],
  estudiantes: Estudiante[],
  docentesDeDirectores: User[],
  dataEstadisticas: DataEstadisticas[],
  reporteDirector: DataEstadisticas[],
  loaderLogin: boolean,
  warningLogin: string,
  loaderPages: boolean,
  loaderReporteDirector: boolean,
  loaderSalvarPregunta: boolean,
  regiones: Region[],
  reporteRegional: DataEstadisticas[],
  loaderReporteRegional: boolean,
  grados: Grades[],
  evaluacionesGradoYCategoria: Evaluaciones[],
  evaluacionesPsicolinguistica: Psicolinguistica[]
  psicolinguisticaById: Psicolinguistica,
  preguntasPsicolinguistica:PsicolinguiticaExamen[]
}


export type AppActions =
  | { type: AppAction.TEST_VALUE; payload: boolean }
  | { type: AppAction.SHOW_SIDEBAR; payload: boolean }
  | { type: AppAction.CURRENT_USER_DATA; payload: User }
  | { type: AppAction.EVALUACIONES; payload: Evaluaciones[] }
  | { type: AppAction.EVALUACION; payload: Evaluaciones }
  | { type: AppAction.PREGUNTAS_RESPUESTAS; payload: PreguntasRespuestas[] }
  | { type: AppAction.SIZE_PREGUNTAS; payload: number }
  | { type: AppAction.PREGUNTAS_RESPUESTAS_ESTUDIANTES; payload: PreguntasRespuestas[] }
  | { type: AppAction.PREGUNTAS_RESPUESTAS_ESTUDIANTES_INITIAL_VALUE; payload: PreguntasRespuestas[] }
  | { type: AppAction.DIRECTORES; payload: User[] }
  | { type: AppAction.ESTUDIANTES; payload: Estudiante[] }
  | { type: AppAction.DOCENTES_DIRECTORES; payload: User[] }
  | { type: AppAction.DATA_ESTADISTICAS; payload: DataEstadisticas[] }
  | { type: AppAction.REPORTE_DIRECTOR; payload: DataEstadisticas[] }
  | { type: AppAction.LOADER_LOGIN; payload: boolean }
  | { type: AppAction.WARNING_LOGIN; payload: string }
  | { type: AppAction.LOADER_PAGES; payload: boolean }
  | { type: AppAction.LOADER_REPORTE_DIRECTOR; payload: boolean }
  | { type: AppAction.LOADER_SALVAR_PREGUNTA; payload: boolean }
  | { type: AppAction.REGIONES; payload: Region[] }
  | { type: AppAction.REPORTE_REGIONAL; payload: DataEstadisticas[] }
  | { type: AppAction.LOADER_REPORTE_REGIONAL; payload: boolean }
  | { type: AppAction.GRADOS; payload: Grades[] }
  | { type: AppAction.EVALUACIONES_GRADO_CATEGORIA; payload: Evaluaciones[] }
  | { type: AppAction.PSICOLINGUISTICA; payload: Psicolinguistica[] }
  | { type: AppAction.PSICOLINGUISTICA_BY_ID; payload: Psicolinguistica }
  | { type: AppAction.PSICOLINGUISTICA_PREGUNTAS; payload: PsicolinguiticaExamen[] }

export type LoginData = {
  usuario: string,
  contrasena: string
}

export type UserPerfil = {
  rol?: number,
  nombre?: string
}

export type Alternativas = [
  { a?: string },
  { b?: string },
  { c?: string },
  { d?: string },
  { e?: string }
]

export type Region = {
  codigo?: number,
  region?: string
}

export type Alternativa = {
  alternativa?: string,
  descripcion?: string,
  selected: boolean
}
export type Psicolinguistica = {
  nombre?: string,
  id?: string
}

export type PsicolinguiticaExamen = {
  id?: string,
  pregunta?: string,
  order?:number,
  alternativas?: string
}
export type PreguntasRespuestas = {
  id?: string,
  pregunta?: string,
  respuesta?: string,
  alternativas?: Alternativa[],
  order?: number,
  preguntaDocente?: string
}
export type Evaluaciones = {
  id?: string,
  idDocente?: string,
  nombre?: string,
  preguntasRespuestas?: PreguntasRespuestas,
  grado?: number,
  categoria?: number
}

export type UserEstudiante = {
  id?: string
  nombresApellidos?: string,
  dni?: string,
  dniDocente?: string,
  respuestasCorrectas?: string,
  totalPreguntas?: string
}

export type Estudiante = {
  dni?: string,
  nombresApellidos?: string,
  dniDocente?: string,
  respuestasCorrectas?: number,
  totalPreguntas?: number,
  respuestasIncorrectas?: number
}
export type User = {
  nombres?: string,
  apellidos?: string,
  dni?: string,
  institucion?: string,
  perfil?: UserPerfil,
  modular?: string,
  dniDirector?: string,
  rolDirector?: number,
  rol?: number,
  region?: number
}

export type DataEstadisticas = {
  id?: string
  a?: number,
  b?: number,
  c?: number,
  d?: number,
  total?: number,
}

export type Regiones = {
  codigo?: number,
  region?: string
}

export type Grades = {
  id?: string,
  nombre?: string,
  grado?: number
}

export type CreaEvaluacion = {
  id?: string,
  grado?: number,
  categoria?: string,
  nombreEvaluacion?: string
}

