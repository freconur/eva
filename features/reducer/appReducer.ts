import { AppAction } from "../actions/appAction";
import { AppActions, AppReducerValues } from "../types/types";


export const appReducer = (state: AppReducerValues, action: AppActions) => {
  switch (action.type) {
    case AppAction.REPORTE_DIRECTOR:
      return {
        ...state,
        reporteDirector: action.payload
      }
    case AppAction.DATA_ESTADISTICAS:
      return {
        ...state,
        dataEstadisticas: action.payload
      }
    case AppAction.DOCENTES_DIRECTORES:
      return {
        ...state,
        docentesDeDirectores: action.payload
      }
    case AppAction.ESTUDIANTES:
      return {
        ...state,
        estudiantes: action.payload
      }
    case AppAction.DIRECTORES:
      return {
        ...state,
        directores: action.payload
      }
    case AppAction.PREGUNTAS_RESPUESTAS_ESTUDIANTES_INITIAL_VALUE:
      return {
        ...state,
        preguntasRespuestasEstudianteInitialValue: action.payload
      }
    case AppAction.PREGUNTAS_RESPUESTAS_ESTUDIANTES:
      return {
        ...state,
        preguntasRespuestasEstudiante: action.payload
      }
    case AppAction.SIZE_PREGUNTAS:
      return {
        ...state,
        sizePreguntas: action.payload
      }
    case AppAction.PREGUNTAS_RESPUESTAS:
      return {
        ...state,
        preguntasRespuestas: action.payload
      }
    case AppAction.EVALUACION:
      return {
        ...state,
        evaluacion: action.payload
      }
    case AppAction.EVALUACIONES:
      return {
        ...state,
        evaluaciones: action.payload
      }
    case AppAction.TEST_VALUE:
      return {
        ...state,
        testValue: action.payload
      }
    case AppAction.SHOW_SIDEBAR:
      return {
        ...state,
        showSidebar: action.payload
      }
    case AppAction.CURRENT_USER_DATA:
      return {
        ...state,
        currentUserData: action.payload
      }
    default:
      return state
  }
}