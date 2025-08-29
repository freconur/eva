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
}

export type Alternativa = {
    alternativa?: string | undefined;
    descripcion?: string | undefined;
    selected: boolean;
  };