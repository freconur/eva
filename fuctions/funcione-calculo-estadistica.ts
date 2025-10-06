import { Estudiante, User } from "@/features/types/types";
export type Alternativa = {
    alternativa?: string | undefined;
    descripcion?: string | undefined;
    selected: boolean;
  };
  export interface EstadisticaPregunta {
    id: string;
    a: number;
    b: number;
    c: number;
    d?: number;
    total: number;
  }
export const calcularEstadisticasOptimizadas = (
    reporteDelDirector: User[]
  ) => {
    // Objeto para acumular las estadísticas de cada pregunta
    const estadisticasAcumuladas: { [key: string]: EstadisticaPregunta } = {};
    
    // Iterar sobre cada director en el reporte
    reporteDelDirector.forEach(director => {
      // Verificar si el director tiene reporteEstudiantes
      if (director.reporteEstudiantes && Array.isArray(director.reporteEstudiantes)) {
        // Iterar sobre cada pregunta en reporteEstudiantes
        director.reporteEstudiantes.forEach((pregunta: any) => {
          const preguntaId = pregunta.id;
          
          // Si es la primera vez que vemos esta pregunta, inicializarla
          if (!estadisticasAcumuladas[preguntaId]) {
            estadisticasAcumuladas[preguntaId] = {
              id: preguntaId,
              a: 0,
              b: 0,
              c: 0,
              d: 0,
              total: 0
            };
          }
          
          // Acumular los valores de cada alternativa
          estadisticasAcumuladas[preguntaId].a += pregunta.a || 0;
          estadisticasAcumuladas[preguntaId].b += pregunta.b || 0;
          estadisticasAcumuladas[preguntaId].c += pregunta.c || 0;
          estadisticasAcumuladas[preguntaId].d += pregunta.d || 0;
          estadisticasAcumuladas[preguntaId].total += pregunta.total || 0;
        });
      }
    });
    
    // Convertir el objeto a array para retornar
    return Object.values(estadisticasAcumuladas);
  };