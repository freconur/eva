import { AppAction } from "../actions/appAction";
import { AppActions, AppReducerValues } from "../types/types";


export const appReducer = (state: AppReducerValues, action: AppActions) => {
  switch (action.type) {
    case AppAction.REPORT_PREGUNTA_HABILIDAD:
      return {
        ...state,
        reportePreguntaHabilidad: action.payload
      }
    case AppAction.REPORT_CURRICULAR_DIRECTOR:
      return {
        ...state,
        reporteCurricularDirector: action.payload
      }
    case AppAction.ALL_ESPECIALISTAS:
      return {
        ...state,
        allEspecialistas: action.payload
      }
    case AppAction.CARACTERISTICA_CURRICULAR:
      return {
        ...state,
        caracteristicaCurricular: action.payload
      }
    case AppAction.ALL_EVALUACIONES_CURRICULARES_DOCENTE:
      return {
        ...state,
        allEvaluacionesCurricularesDocente: action.payload
      }
    case AppAction.EVALUACION_CURRICULAR_BY_ID:
      return {
        ...state,
        evaluacionCurricularById: action.payload
      }
    case AppAction.EVALUACION_CURRICULAR_ALTERNATIVA:
      return {
        ...state,
        evaluacionCurricularAlternativa: action.payload
      }
    case AppAction.PA_HABILIDAD:
      return {
        ...state,
        paHabilidad: action.payload
      }
    case AppAction.EVALUACION_CURRICULAR:
      return {
        ...state,
        evaluacionCurricular: action.payload
      }
    case AppAction.LOADER_MODALES:
      return {
        ...state,
        loaderModales:action.payload
      }
    case AppAction.REPORTE_INDIVIDUAL_DOCENTE :
      return {
        ...state,
        reporteIndividualDocente:action.payload
      }
    case AppAction.DATA_EVALUACION_DOCENTE:
      return{
        ...state,
        dataEvaluacionDocente:action.payload
      }
    case AppAction.WARNING_DATA_DOCENTE:
      return {
        ...state,
        warningDataDocente:action.payload
      }
    case AppAction.DATA_DOCENTE:
      return {
        ...state,
        dataDocente:action.payload
      }
    case AppAction.GET_PREGUNTA_RESPUESTA_DOCENTE:
      return {
        ...state,
        getPreguntaRespuestaDocentes:action.payload
      }
    case AppAction.EVALUACIONES_DOCENTES:
      return {
        ...state,
        evaluacionDesempeñoDocente:action.payload
      }
    case AppAction.EVALUACIONES_DIRECTOR:
      return {
        ...state,
        evaluacionesDirector:action.payload
      }
    case AppAction.WARNING_USUARIO_NO_ENCONTRADO:
      return {
        ...state,
        warningUsuarioNoEncontrado:action.payload
      }
    case AppAction.DATA_DIRECTOR:
      return {
        ...state,
        dataDirector:action.payload
      }
    case AppAction.WARNING_USUARIO_EXISTE:
      return {
        ...state,
        warningUsuarioExiste:action.payload
      }
    case AppAction.USUARIOS_DIRECTORES:
      return {
        ...state,
        usuariosDirectores:action.payload
      }
    case AppAction.PSICOLINGUISTICA_PREGUNTAS_ACTUALIZADAS:
      return {
        ...state,
        preguntasPsicolinguisticaActualizadas: action.payload
      }
    case AppAction.PSICOLINGUISTICA_PREGUNTAS:
      return {
        ...state,
        preguntasPsicolinguistica: action.payload
      }
    case AppAction.PSICOLINGUISTICA_BY_ID:
      return {
        ...state,
        psicolinguisticaById: action.payload
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