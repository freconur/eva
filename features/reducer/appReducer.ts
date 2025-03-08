import { AppAction } from "../actions/appAction";
import { AppActions, AppReducerValues } from "../types/types";


export const appReducer = (state: AppReducerValues, action: AppActions) => {
  switch (action.type) {
    case AppAction.PSICOLINGUISTICA_PREGUNTAS:
      return {
        ...state,
        preguntasPsicolinguistica:action.payload
      }
    case AppAction.PSICOLINGUISTICA_BY_ID:
      return {
        ...state,
        psicolinguisticaById:action.payload
      }
    case AppAction.PSICOLINGUISTICA:
      return {
        ...state,
        evaluacionesPsicolinguistica: action.payload
      }
    case AppAction.EVALUACIONES_GRADO_CATEGORIA:
      return {
        ...state,
        evaluacionesGradoYCategoria: action.payload
      }
    case AppAction.GRADOS:
      return {
        ...state,
        grados: action.payload
      }
    case AppAction.LOADER_REPORTE_REGIONAL:
      return {
        ...state,
        loaderReporteRegional: action.payload
      }
    case AppAction.REPORTE_REGIONAL:
      return {
        ...state,
        reporteRegional: action.payload
      }
    case AppAction.REGIONES:
      return {
        ...state,
        regiones: action.payload
      }
    case AppAction.LOADER_SALVAR_PREGUNTA:
      return {
        ...state,
        loaderSalvarPregunta: action.payload
      }
    case AppAction.LOADER_REPORTE_DIRECTOR:
      return {
        ...state,
        loaderReporteDirector: action.payload
      }
    case AppAction.LOADER_PAGES:
      return {
        ...state,
        loaderPages: action.payload
      }
    case AppAction.WARNING_LOGIN:
      return {
        ...state,
        warningLogin: action.payload
      }
    case AppAction.LOADER_LOGIN:
      return {
        ...state,
        loaderLogin: action.payload
      }
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