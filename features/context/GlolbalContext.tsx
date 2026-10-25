import { createContext, useContext, useReducer, useEffect, ReactNode, Dispatch } from "react";
import { AppReducerValues, AppActions } from "../types/types";
import { appReducer } from "../reducer/appReducer"
import { AppAction } from "../actions/appAction";
interface Props {
  children: ReactNode
}
const initialState: AppReducerValues = {
  testValue: true,
  showSidebar: false,
  isSidebarCollapsed: false,
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
  categorias: [],
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
  dimensionesEspecialistas: [],
  evaluadosEspecialista: [],
  dataGraficoUgelStacked: [],
  loaderDataGraficoUgelStacked: false
}

export const GlobalContext = createContext<[AppReducerValues, Dispatch<AppActions>]>([initialState, () => { }])
// export const Attendance = createContext<Student>({studentData: {}})

export const useGlobalContext = () => useContext(GlobalContext)[0]
export const useGlobalContextDispatch = () => useContext(GlobalContext)[1]

export const GlobalContextProvider = ({ children }: Props) => {
  const [state, dispatch] = useReducer(appReducer, initialState);

  useEffect(() => {
    try {
      if (typeof window !== 'undefined') {
        const stored = localStorage.getItem('eva_sidebar_collapsed');
        if (stored !== null) {
          dispatch({
            type: AppAction.TOGGLE_SIDEBAR_COLLAPSED,
            payload: stored === 'true'
          });
        }
      }
    } catch (e) {
      console.warn("No se pudo leer eva_sidebar_collapsed de localStorage", e);
    }
  }, []);

  return (
    <GlobalContext.Provider value={[state, dispatch]}>
      {children}
    </GlobalContext.Provider>
  )
}