import { Estudiante, Evaluacion, PreguntasRespuestas, UserEstudiante } from "../types/types";

export const calculoNivel = (data:UserEstudiante | Estudiante, evaluacion:Evaluacion) => {
    console.log('estudiantes antes de calcular el nivel', data);
    
    let puntajeAcumulado = 0;
    let tienePuntajes = false;
    
    data.respuestas?.forEach(pregunta => {
        pregunta.alternativas?.forEach(alternativas => {
            if (alternativas.selected) {
                // Marcar que el estudiante al menos intentó responder
                tienePuntajes = true;
                
                if (alternativas.alternativa?.toLowerCase() === pregunta.respuesta?.toLowerCase()) {
                    // Verificar si pregunta.puntaje existe y tiene datos
                    if (pregunta.puntaje !== undefined && pregunta.puntaje !== null && pregunta.puntaje !== '') {
                        const puntajePregunta = Number(pregunta.puntaje);
                        puntajeAcumulado = puntajeAcumulado + puntajePregunta;
                    } else {
                        console.log('calculoNivel - pregunta sin puntaje válido:', pregunta.puntaje);
                    }
                }
            }
        })
    })

    if (puntajeAcumulado > 0) {
        data.puntaje = puntajeAcumulado;
    }else {
        data.puntaje = 0
    }

    // Solo ejecutar la clasificación si existen puntajes válidos
    if (tienePuntajes && evaluacion.nivelYPuntaje && evaluacion.nivelYPuntaje.length > 0) {
        // Ordenar los niveles por puntaje mínimo para asegurar el orden correcto
        const nivelesOrdenados = [...evaluacion.nivelYPuntaje].sort((a, b) => (a.min || 0) - (b.min || 0));
        
        // Buscar el nivel correspondiente al puntaje
        let nivelEncontrado = null;
        for (const nivelData of nivelesOrdenados) {
            const minPuntaje = nivelData.min || 0;
            const maxPuntaje = nivelData.max || Number.MAX_SAFE_INTEGER;
            
            
            if (puntajeAcumulado >= minPuntaje && puntajeAcumulado <= maxPuntaje) {
                nivelEncontrado = nivelData;
                break;
            }
        }
        
        if (nivelEncontrado) {
            data.nivel = nivelEncontrado.nivel || "sin clasificar";
            data.nivelData = nivelEncontrado;
        } else {
            data.nivel = "sin clasificar";
            data.nivelData = undefined;
        }
    } else {
        data.nivel = "sin clasificar";
        data.nivelData = undefined;
    }
    
    return data;
}

export const calculoNivelProgresivo = (estudiantes:Estudiante[], evaluacion:Evaluacion, ) => {
    
    // Verificar que tenemos los datos necesarios
    if (!estudiantes || estudiantes.length === 0 || !evaluacion.nivelYPuntaje || evaluacion.nivelYPuntaje.length === 0) {
        return [];
    }

    // Ordenar los niveles por puntaje mínimo para asegurar el orden correcto
    const nivelesOrdenados = [...evaluacion.nivelYPuntaje].sort((a, b) => (a.min || 0) - (b.min || 0));
    
    // Crear un mapa para contar estudiantes por nivel
    const conteoNiveles: { [key: string]: { id: number; nivel: string; cantidadDeEstudiantes: number; color?: string } } = {};
    
    // Inicializar contadores para cada nivel
    nivelesOrdenados.forEach(nivelData => {
        const nivelKey = nivelData.nivel || 'sin clasificar';
        conteoNiveles[nivelKey] = {
            id: nivelData.id || 0,
            nivel: nivelKey,
            cantidadDeEstudiantes: 0,
            color: nivelData.color
        };
    });
    
    
    // Iterar sobre cada estudiante y clasificar por nivel
    estudiantes.forEach(estudiante => {
        if (estudiante.puntaje !== undefined && estudiante.puntaje !== null) {
            const puntaje = estudiante.puntaje;
            let nivelEncontrado = null;
            
            // Buscar el nivel correspondiente al puntaje
            for (const nivelData of nivelesOrdenados) {
                const minPuntaje = nivelData.min || 0;
                const maxPuntaje = nivelData.max || Number.MAX_SAFE_INTEGER;
                
                if (puntaje >= minPuntaje && puntaje <= maxPuntaje) {
                    nivelEncontrado = nivelData.nivel;
                    break;
                }
            }
            
            // Incrementar contador del nivel encontrado solo si existe
            if (nivelEncontrado && conteoNiveles[nivelEncontrado]) {
                conteoNiveles[nivelEncontrado].cantidadDeEstudiantes++;
            }
        }
    });
    
    // Convertir el mapa a array y retornar todos los niveles (incluso con cantidad 0)
    return Object.values(conteoNiveles);
}

export const calculoPromedioGlobalPorGradoEvaluacionPRogresiva = (estudiantes:Estudiante[]) => {
    
    // Verificar que tenemos estudiantes
    if (!estudiantes || estudiantes.length === 0) {
        return { totalEstudiantes: 0, promedioGlobal: 0 };
    }

    // Filtrar estudiantes que tienen puntaje válido
    const estudiantesConPuntaje = estudiantes.filter(estudiante => 
        estudiante.puntaje !== undefined && 
        estudiante.puntaje !== null && 
        !isNaN(Number(estudiante.puntaje))
    );

    const totalEstudiantes = estudiantesConPuntaje.length;

    // Si no hay estudiantes con puntaje válido, retornar 0
    if (totalEstudiantes === 0) {
        return { totalEstudiantes: 0, promedioGlobal: 0 };
    }

    // Calcular la suma total de puntajes
    const sumaTotal = estudiantesConPuntaje.reduce((suma, estudiante) => {
        return suma + Number(estudiante.puntaje);
    }, 0);

    // Calcular el promedio global
    const promedioGlobal = sumaTotal / totalEstudiantes;
   
    
    return {
        totalEstudiantes,
        promedioGlobal: Math.round(promedioGlobal * 100) / 100 // Redondear a 2 decimales
    };
}

export const calculoPreguntasCorrectas = (estudiante:UserEstudiante | Estudiante) => {
    let count = 0;
    
    estudiante.respuestas?.forEach(pregunta => {
        pregunta.alternativas?.forEach(alternativa => {
            if (alternativa.selected) {
                // Convertir a minúsculas y eliminar espacios para comparar
                const alternativaLimpia = alternativa.alternativa?.toLowerCase().replace(/\s+/g, '') || '';
                const respuestaLimpia = pregunta.respuesta?.toLowerCase().replace(/\s+/g, '') || '';
                
                if (alternativaLimpia === respuestaLimpia) {
                    count++;
                }
            }
        });
    });
    
    // Actualizar la propiedad respuestasCorrectas del estudiante
    /* estudiante.respuestasCorrectas = count.toString(); */
    estudiante.respuestasCorrectas = count;
    /*  calculoNivel(estudiantes, evaluacion); */
    return estudiante;
}


export function agregarPuntajesARespuestas(
    estudiante: Estudiante,
    preguntaRespuestas: PreguntasRespuestas[]
  ): Estudiante {
    // Validación temprana para evitar procesamiento innecesario
    if (!estudiante.respuestas || estudiante.respuestas.length === 0) {
      return estudiante;
    }
  
    // Crear un objeto simple en lugar de Map para mejor rendimiento
    // Los objetos son más rápidos que Map para claves numéricas simples
    const puntajesPorOrder: Record<number, string> = {};
    for (let i = 0; i < preguntaRespuestas.length; i++) {
      const pregunta = preguntaRespuestas[i];
      if (pregunta.order !== undefined && pregunta.puntaje !== undefined) {
        puntajesPorOrder[pregunta.order] = pregunta.puntaje;
      }
    }
  
    // Mutar directamente el array de respuestas para evitar crear nuevos objetos
    const respuestas = estudiante.respuestas;
    for (let i = 0; i < respuestas.length; i++) {
      const respuesta = respuestas[i];
      if (respuesta.order !== undefined) {
        respuesta.puntaje = puntajesPorOrder[respuesta.order] || "0";
      } else {
        respuesta.puntaje = "0";
      }
    }
  
    // Retornar el estudiante con las respuestas mutadas (más eficiente que spread)
    estudiante.respuestas = respuestas;
    console.log('estudiante', estudiante)
    return estudiante;
  }