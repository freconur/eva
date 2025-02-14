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
  preguntasRespuestasEstudianteInitialValue:PreguntasRespuestas[],
  directores:User[],
  estudiantes:Estudiante[],
  docentesDeDirectores:User[]
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

export type Alternativa = {
  alternativa?: string,
  descripcion?: string,
  selected: boolean
}
export type PreguntasRespuestas = {
  id?: string,
  pregunta?: string,
  respuesta?: string,
  alternativas?: Alternativa[],
}
export type Evaluaciones = {
  id?: string,
  idDocente?: string,
  nombre?: string,
  preguntasRespuestas?: PreguntasRespuestas
}

export type UserEstudiante = {
  id?: string
  nombresApellidos?: string,
  dni?: string,
  dniDocente?:string,
  respuestasCorrectas?:string,
  totalPreguntas?:string
}

export type Estudiante = {
  dni?:string,
  nombresApellidos?:string,
  dniDocente?:string,
  respuestasCorrectas?:number,
  totalPreguntas?:number
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
  rol?: number
}