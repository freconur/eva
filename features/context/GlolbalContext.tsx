import { createContext, useContext, useReducer, ReactNode, Dispatch } from "react";
import { AppReducerValues, AppActions } from "../types/types";
import { appReducer } from "../reducer/appReducer"
interface Props {
  children: ReactNode
}
const initialState: AppReducerValues = {
  testValue: true,
  showSidebar: false,
  currentUserData: {},
  evaluaciones: [],
  evaluacion: {},
  preguntasRespuestas: [],
  sizePreguntas: 0,
  preguntasRespuestasEstudiante: [],
  preguntasRespuestasEstudianteInitialValue: [],
  directores: [],
  estudiantes: [],
  docentesDeDirectores: [],
  dataEstadisticas: [],
  reporteDirector: [],
  loaderLogin: false,
  warningLogin: "",
  loaderPages: false,
  loaderReporteDirector: false,
  loaderSalvarPregunta: false,
  regiones: [],
  reporteRegional: [],
  loaderReporteRegional: false,
  grados: [],
  evaluacionesGradoYCategoria: [],
  evaluacionesPsicolinguistica: [],
  psicolinguisticaById: {},
  preguntasPsicolinguistica: [],
  preguntasPsicolinguisticaActualizadas: [],
  usuariosDirectores: [],
  warningUsuarioExiste: "",
  dataDirector: {},
  warningUsuarioNoEncontrado: "",
  evaluacionesDirector: [],
  evaluacionDesempeñoDocente: [],
  getPreguntaRespuestaDocentes: [],
  dataDocente: {},
  warningDataDocente: "",
  dataEvaluacionDocente: {},
  reporteIndividualDocente: {},
  loaderModales: false,
  evaluacionCurricular: [],
  paHabilidad: [],
  evaluacionCurricularAlternativa: [],
  evaluacionCurricularById: {},
  allEvaluacionesCurricularesDocente: [],
  caracteristicaCurricular: [],
  allEspecialistas: [],
  reporteCurricularDirector: [],
  reportePreguntaHabilidad: [],
  testReporteDirector: [],
  allRespuestasEstudiantesDirector: [],
  dataFiltradaDirectorTabla: [],
  allEvaluacionesDirectorDocente: [],
  dataFiltradaDirectorDocenteTabla: [],
  reporteCurricularDirectorData: [],
  curricularDirectorDataFilter: [],
  allEvaluacionesEspecialistaDirector: [],
  dataFiltradaEspecialistaDirectorTabla: [],
  usuariosByRol: [],
  resultadoBusquedaUsuario: {},
  lastVisible: {},
  dataEvaluacionMediacionDirector: {},
  dataDocenteMaster: {},
  warningEvaEstudianteSinRegistro: "",
  allEvaluacionesEstudiantes: [],
  preguntasEstandar: [],
  estandaresCurriculares: [],
  tituloCoberturaCurricular: "",
  reporteCCADataEspecialista: [],
  ccDataFilterEspecialista: [],
  evaluacionEstudiante: {},
  usuarioPorDni: {},
  estudiantesDeEvaluacion: [],
  dataGraficoTendencia: [],
  dataGraficoTendenciaNiveles: [],
  dataEstadisticaEvaluacion: [],
  loaderGraficos: false,
  loaderReportePorPregunta: false,
  tiposDeEvaluacion: [],
  dataGraficoPieChart: [],
  loaderDataGraficoPieChart: false,
  preguntaEvaluacionLikert: [],
  dimensionesEspecialistas: []
}

export const GlobalContext = createContext<[AppReducerValues, Dispatch<AppActions>]>([initialState, () => { }])
// export const Attendance = createContext<Student>({studentData: {}})

export const useGlobalContext = () => useContext(GlobalContext)[0]
export const useGlobalContextDispatch = () => useContext(GlobalContext)[1]

export const GlobalContextProvider = ({ children }: Props) => {

  return (
    <GlobalContext.Provider value={useReducer(appReducer, initialState)}>
      {children}
    </GlobalContext.Provider>
  )
}