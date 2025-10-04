import { PreguntasRespuestas, Alternativa } from '../types/types';

/**
 * Función para agregar una alternativa "no respondió" a todas las preguntas
 * Identifica el correlativo actual de las alternativas y agrega la siguiente letra
 * @param preguntas - Array de preguntas a procesar
 * @returns Array de preguntas con la alternativa "no respondió" agregada
 */
export const addNoRespondioAlternative = (preguntas: PreguntasRespuestas[]): PreguntasRespuestas[] => {
  return preguntas.map(pregunta => {
    // Si no hay alternativas, retornar la pregunta sin cambios
    if (!pregunta.alternativas || pregunta.alternativas.length === 0) {
      return pregunta;
    }

    // Obtener las alternativas existentes
    const alternativasExistentes = [...pregunta.alternativas];
    
    // Identificar el correlativo actual (a, b, c, d, etc.)
    const correlativosExistentes = alternativasExistentes
      .map(alt => alt.alternativa?.toLowerCase())
      .filter(alt => alt && alt.length === 1 && alt >= 'a' && alt <= 'z')
      .sort();

    // Determinar la siguiente letra en orden alfabético
    let siguienteLetra = 'd'; // Valor por defecto si no hay alternativas
    
    if (correlativosExistentes.length > 0) {
      const ultimaLetra = correlativosExistentes[correlativosExistentes.length - 1];
      if (ultimaLetra) {
        const codigoAscii = ultimaLetra.charCodeAt(0);
        siguienteLetra = String.fromCharCode(codigoAscii + 1);
      }
    }

    // Crear la nueva alternativa "no respondió"
    const nuevaAlternativa: Alternativa = {
      alternativa: siguienteLetra.toUpperCase(),
      descripcion: 'no respondio',
      selected: false
    };

    // Agregar la nueva alternativa al array existente
    const alternativasActualizadas = [...alternativasExistentes, nuevaAlternativa];

    // Retornar la pregunta con las alternativas actualizadas
    return {
      ...pregunta,
      alternativas: alternativasActualizadas
    };
  });
};

/**
 * Función para agregar alternativa "no respondió" a una sola pregunta
 * @param pregunta - Pregunta individual a procesar
 * @returns Pregunta con la alternativa "no respondió" agregada
 */
export const addNoRespondioToSingleQuestion = (pregunta: PreguntasRespuestas): PreguntasRespuestas => {
  return addNoRespondioAlternative([pregunta])[0];
};

/**
 * Función para verificar si una pregunta ya tiene la alternativa "no respondió"
 * @param pregunta - Pregunta a verificar
 * @returns true si ya tiene la alternativa "no respondió"
 */
export const hasNoRespondioAlternative = (pregunta: PreguntasRespuestas): boolean => {
  if (!pregunta.alternativas || pregunta.alternativas.length === 0) {
    return false;
  }

  return pregunta.alternativas.some(alt => 
    alt.descripcion?.toLowerCase() === 'no respondio'
  );
};
