export type Estudiante = {
    id?: string;
    nombresApellidos?: string;  
    dni?: string;
    dniDocente?: string;
    respuestasCorrectas?: string;
    totalPreguntas?: string;
    grado?: number;
    seccion?: string;
    genero?: string;
    nivel?: string;
    puntaje?: number;
    respuestas?: {
      id?: string;
      order?: number;
      pregunta?: string;
      respuesta?: string;
      alternativas?: Alternativa[];
      preguntaDocente?: string;
      puntaje?: string;
    }[];
    region?: number;
    nivelData?: NivelYPuntaje;
}
export type Evaluacion = {
  id?: string;
  nombre?: string;
  grado?: number;
  rol?: number;
  categoria?: number;
  active?: boolean;
  timestamp?: Date;
  mesDelExamen?: string;
  tipoSDeEvaluacion?: TipoDeEvaluacion[];
  tipoEvaluacion?: string;
  tipoDeEvaluacion?: string;
  nivelYPuntaje?: NivelYPuntaje[];
  idDocente?: string;
};
export type TipoDeEvaluacion = {
  name?: string;
  value?: string;
};
export type NivelYPuntaje = {
  nivel?: string;
  max?: number;
  min?: number;
  color?: string;
  id?: number;
};
export type Alternativa = {
    alternativa?: string | undefined;
    descripcion?: string | undefined;
    selected: boolean;
  };
  export type User = {
    calificacion?:number,
    nombres?: string;
    apellidos?: string;
    dni?: string;
    institucion?: string;
    modular?: string;
    dniDirector?: string;
    rolDirector?: number;
    rol?: number;
    region?: number;
    caracteristicaCurricular?:string;
    grados?:number[];
    secciones?:number[];
    area?:number;
    distrito?:string;
    genero?:string;
    celular?:string;
    nivel?:number;
    rolDirectivo?:number,
    tipoEspecialista?:number,
    fechaEvaluacion?:Date,
    docentesDelDirector?:User[]
  };
  export type PreguntasRespuestas = {
    id?: string;
    pregunta?: string;
    respuesta?: string;
    alternativas?: Alternativa[];
    order?: number;
    preguntaDocente?: string;
    puntaje?: string;
  };