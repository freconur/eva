import { AppAction } from "../actions/appAction";

export type AppReducerValues = {
  testValue: boolean;
  showSidebar: boolean;
  currentUserData: User;
  evaluaciones: Evaluaciones[];
  evaluacion: Evaluaciones;
  preguntasRespuestas: PreguntasRespuestas[];
  sizePreguntas: number;
  preguntasRespuestasEstudiante: PreguntasRespuestas[];
  preguntasRespuestasEstudianteInitialValue: PreguntasRespuestas[];
  directores: User[];
  estudiantes: Estudiante[];
  docentesDeDirectores: User[];
  dataEstadisticas: DataEstadisticas[];
  reporteDirector: DataEstadisticas[];
  loaderLogin: boolean;
  warningLogin: string;
  loaderPages: boolean;
  loaderReporteDirector: boolean;
  loaderSalvarPregunta: boolean;
  regiones: Region[];
  reporteRegional: DataEstadisticas[];
  loaderReporteRegional: boolean;
  grados: Grades[];
  evaluacionesGradoYCategoria: Evaluaciones[];
  evaluacionesPsicolinguistica: Psicolinguistica[];
  psicolinguisticaById: Psicolinguistica;
  preguntasPsicolinguistica: PsicolinguiticaExamen[];
  preguntasPsicolinguisticaActualizadas: PsicolinguiticaExamen[];
  usuariosDirectores: User[];
  warningUsuarioExiste: string;
  dataDirector: User;
  warningUsuarioNoEncontrado: string;
  evaluacionesDirector: Evaluaciones[];
  evaluacionDesempeñoDocente: CrearEvaluacionDocente[];
  getPreguntaRespuestaDocentes: PRDocentes[];
  dataDocente: User;
  warningDataDocente:string
  dataEvaluacionDocente:DataEvaluacion,
  reporteIndividualDocente: ReporteDocenteIndividual,
  loaderModales:boolean,
  evaluacionCurricular:EvaluacionCurricular[],
  paHabilidad:EvaluacionHabilidad[],
  evaluacionCurricularAlternativa:EvaluacionCurricularAlternativa[],
  evaluacionCurricularById:EvaluacionCurricularAlternativa,
  allEvaluacionesCurricularesDocente:EvaluacionCurricularAlternativa[],
  caracteristicaCurricular:CaracteristicaCurricular[]
};

export type AppActions =
  | { type: AppAction.TEST_VALUE; payload: boolean }
  | { type: AppAction.SHOW_SIDEBAR; payload: boolean }
  | { type: AppAction.CURRENT_USER_DATA; payload: User }
  | { type: AppAction.DATA_DOCENTE; payload: User }
  | { type: AppAction.EVALUACIONES; payload: Evaluaciones[] }
  | { type: AppAction.EVALUACION; payload: Evaluaciones }
  | { type: AppAction.PREGUNTAS_RESPUESTAS; payload: PreguntasRespuestas[] }
  | { type: AppAction.SIZE_PREGUNTAS; payload: number }
  | {
      type: AppAction.PREGUNTAS_RESPUESTAS_ESTUDIANTES;
      payload: PreguntasRespuestas[];
    }
  | {
      type: AppAction.PREGUNTAS_RESPUESTAS_ESTUDIANTES_INITIAL_VALUE;
      payload: PreguntasRespuestas[];
    }
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
  | {
      type: AppAction.PSICOLINGUISTICA_PREGUNTAS;
      payload: PsicolinguiticaExamen[];
    }
  | {
      type: AppAction.PSICOLINGUISTICA_PREGUNTAS_ACTUALIZADAS;
      payload: PsicolinguiticaExamen[];
    }
  | { type: AppAction.USUARIOS_DIRECTORES; payload: User[] }
  | { type: AppAction.WARNING_USUARIO_EXISTE; payload: string }
  | { type: AppAction.DATA_DIRECTOR; payload: User }
  | { type: AppAction.WARNING_USUARIO_NO_ENCONTRADO; payload: string }
  | { type: AppAction.EVALUACIONES_DIRECTOR; payload: Evaluaciones[] }
  | { type: AppAction.EVALUACIONES_DOCENTES; payload: CrearEvaluacionDocente[] }
  | { type: AppAction.GET_PREGUNTA_RESPUESTA_DOCENTE; payload: PRDocentes[] }
  | { type: AppAction.WARNING_DATA_DOCENTE; payload: string }
  | { type: AppAction.DATA_EVALUACION_DOCENTE; payload: DataEvaluacion }
  | { type: AppAction.REPORTE_INDIVIDUAL_DOCENTE; payload: ReporteDocenteIndividual }
  | { type: AppAction.LOADER_MODALES; payload: boolean }
  | { type: AppAction.EVALUACION_CURRICULAR; payload: EvaluacionCurricular[] }
  | { type: AppAction.PA_HABILIDAD; payload: EvaluacionHabilidad[] }
  | { type: AppAction.EVALUACION_CURRICULAR_ALTERNATIVA; payload: EvaluacionCurricularAlternativa[] }
  | { type: AppAction.EVALUACION_CURRICULAR_BY_ID; payload: EvaluacionCurricularAlternativa }
  | { type: AppAction.ALL_EVALUACIONES_CURRICULARES_DOCENTE; payload: EvaluacionCurricularAlternativa[] }
  | { type: AppAction.CARACTERISTICA_CURRICULAR; payload: CaracteristicaCurricular[] }
export type LoginData = {
  usuario: string;
  contrasena: string;
};

export type UserPerfil = {
  rol?: number;
  nombre?: string;
};

export type Alternativas = [
  { a?: string },
  { b?: string },
  { c?: string },
  { d?: string },
  { e?: string }
];

export type Region = {
  codigo?: number;
  region?: string;
};

export type Alternativa = {
  alternativa?: string | undefined;
  descripcion?: string | undefined;
  selected: boolean;
};
export type Psicolinguistica = {
  nombre?: string;
  id?: string;
};

export type PsicolinguiticaExamen = {
  id?: string;
  pregunta?: string;
  order?: number;
  alternativas?: Alternativa[];
};
export type PreguntasRespuestas = {
  id?: string;
  pregunta?: string;
  respuesta?: string;
  alternativas?: Alternativa[];
  order?: number;
  preguntaDocente?: string;
};
export type Evaluaciones = {
  id?: string;
  idDocente?: string;
  nombre?: string;
  preguntasRespuestas?: PreguntasRespuestas;
  grado?: number;
  categoria?: number;
  rol?: number;
};

export type UserEstudiante = {
  id?: string;
  nombresApellidos?: string;
  dni?: string;
  dniDocente?: string;
  respuestasCorrectas?: string;
  totalPreguntas?: string;
};

export type Estudiante = {
  respuestas?: PreguntasRespuestas[];
  dni?: string;
  nombresApellidos?: string;
  dniDocente?: string;
  respuestasCorrectas?: number;
  totalPreguntas?: number;
  respuestasIncorrectas?: number;
};
export type User = {
  nombres?: string;
  apellidos?: string;
  dni?: string;
  institucion?: string;
  perfil?: UserPerfil;
  modular?: string;
  dniDirector?: string;
  rolDirector?: number;
  rol?: number;
  region?: number;
  caracteristicaCurricular?:string;
  grados?:number[] | number;
  secciones?:number[] | number;
  area?:number;
  distrito?:string;
  celular?:string;
  observacionCurricular?:AnexosCurricularType
};

export type DataEstadisticas = {
  id?: string;
  a?: number;
  b?: number;
  c?: number;
  d?: number;
  total?: number;
};
export type DataEstadisticasDocente = {
  id: string;
  a: number;
  b: number;
  c: number;
  d: number;
  total?: number;
};
export type Regiones = {
  codigo?: number;
  region?: string;
};

export type Grades = {
  id?: string;
  nombre?: string;
  grado?: number;
};

export type CreaEvaluacion = {
  id?: string;
  grado?: number;
  categoria?: string;
  nombreEvaluacion?: string;
};

export type respuestaPsicolinguistica = {
  nombreApellidos?: string;
  dni?: string;
  grado?: string;
  seccion?: string;
};

export type CrearEvaluacionDocente = {
  name?: string;
  categoria?: string;
  id?: string;
};

export type PreviewPRDocentes = {
  criterio?: string;
  a?: string;
  b?: string;
  c?: string;
  d?: string;
  id?: string;
};
export type PRDocentes = {
  criterio?: string;
  alternativas?: AlternativasDocente[];
  order?: number;
  id?: string;
  calificacion?:number
};

export interface AlternativasDocente {
  value?: number;
  descripcion?: string;
  alternativa?: string;
  selected?: boolean;
  id?:string
}

export type DataEvaluacion = {
  name?:string;
  categoria?:string
}

export type ReporteDocenteIndividual = {
  calificacion?:number,
  dni?:string,
  dniDirector?:string,
  info?:User,
  observacion?:string,
  resultados?:PRDocentes[]
}

export type EvaluacionCurricular = {
  id?:string,
  name?:string,
  order?:number,
  nivelCurricular?:number,
}

export type EvaluacionHabilidad = {
  id?:string,
  habilidad?:string,
  order?:number
}
export type AlternativaCurricular = {
  id?:string,
  name?:string,
  order?:number,
  acronimo?:string,
  selected?:boolean
}
export type EvaluacionCurricularAlternativa = {
  id?:string,
  name?:string,
  preguntasAlternativas?:PaHanilidad[]
}

export type PaHanilidad = {
  alternativas?:AlternativaCurricular[],
  habilidad?:string,
  id?:string,
  order?:number
}

export type CaracteristicaCurricular = {
  id?:string,
  name?:string,
}
export type AnexosCurricularType = {
  fortalezasObservadas?:string,
  oportunidadesDeMejora?:string,
  acuerdosYCompomisos?:string,
  nivelCobertura?:NivelCobertura
}

export type NivelCobertura = {
  cobertura?:string,
  alternativas?: AlternativasCobertura[]
}
export type AlternativasCobertura = {
  alternativa:string,
  descripcion?:string,
  selected?:boolean
}