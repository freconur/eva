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
  loaderLogin:false,
  warningLogin:"",
  loaderPages: false,
  loaderReporteDirector:false,
  loaderSalvarPregunta:false,
  regiones:[]
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