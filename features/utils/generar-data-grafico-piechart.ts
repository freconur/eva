import { RiContactsBookLine } from "react-icons/ri";
import { Estudiante, Evaluacion, UserEstudiante } from "../types/types";

export const generarDataGraficoPiechart = (estudiantes: UserEstudiante[] | Estudiante[], month: number, evaluacion: Evaluacion) => {
  // Ordenar la evaluación de manera descendente por ID de NivelYPuntaje
  const evaluacionOrdenada = evaluacion.nivelYPuntaje ? [...evaluacion.nivelYPuntaje].sort((a, b) => (b.id || 0) - (a.id || 0)) : [];
  
  console.log('evaluacion', evaluacionOrdenada)
  const conteoNiveles: { [key: string]: number } = {};
  
  // Iterar sobre cada estudiante
  estudiantes.forEach(estudiante => {
    // Verificar si el estudiante tiene nivelData y nivel definido
    if (estudiante.nivelData && estudiante.nivelData.nivel) {
      const nivel = estudiante.nivelData.nivel;
      
      // Incrementar el contador para este nivel
      if (conteoNiveles[nivel]) {
        conteoNiveles[nivel]++;
      } else {
        conteoNiveles[nivel] = 1;
      }
    }
  });
  
  // Convertir el mapa a un array de objetos con nivel, cantidad, id y color
  const resultado = Object.entries(conteoNiveles).map(([nivel, cantidadDeEstudiantes]) => {
    // Buscar el objeto correspondiente en evaluacionOrdenada por nivel
    const nivelData = evaluacionOrdenada.find(item => item.nivel === nivel);
    return {
      id: nivelData?.id || 0,
      nivel,
      cantidadDeEstudiantes,
      color: nivelData?.color || `#${Math.floor(Math.random()*16777215).toString(16)}`
    };
  });
  
  // Ordenar el resultado de manera descendente por ID
  const resultadoOrdenado = resultado.sort((a, b) => b.id - a.id);
  console.log({niveles: resultadoOrdenado, mes: month})
  return {niveles: resultadoOrdenado, mes: month};
}