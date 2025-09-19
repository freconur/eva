import { Estudiante, Evaluacion, UserEstudiante } from "../types/types";

export const calculoNivel = (data:UserEstudiante | Estudiante, evaluacion:Evaluacion) => {
    let puntajeAcumulado = 0;
    let tienePuntajes = false;
    
    data.respuestas?.forEach(pregunta => {
        pregunta.alternativas?.forEach(alternativas => {
            if (alternativas.selected) {
                if (alternativas.alternativa?.toLowerCase() === pregunta.respuesta?.toLowerCase()) {
                    // Verificar si pregunta.puntaje existe y tiene datos
                    if (pregunta.puntaje !== undefined && pregunta.puntaje !== null && pregunta.puntaje !== '') {
                        const puntajePregunta = Number(pregunta.puntaje);
                        puntajeAcumulado = puntajeAcumulado + puntajePregunta;
                        tienePuntajes = true;
                    } else {
                        console.log('calculoNivel - pregunta sin puntaje válido:', pregunta.puntaje);
                    }
                }
            }
        })
    })

    if (puntajeAcumulado > 0) {
        data.puntaje = puntajeAcumulado;
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
    
    return estudiante;
}