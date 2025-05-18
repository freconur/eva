import { collection, getDocs, getFirestore, orderBy, query } from "firebase/firestore/lite"
import { useGlobalContext, useGlobalContextDispatch } from "../context/GlolbalContext"
import { DataEstadisticas, Estudiante } from "../types/types"
import { AppAction } from "../actions/appAction"
import { currentMonth, currentYear } from "@/fuctions/dates"






export const useReporteDocente = () => {
  const db = getFirestore()
  const { currentUserData } = useGlobalContext()
  const dispatch = useGlobalContextDispatch()

  const filtroEstudiantes = (estudiantes: Estudiante[], order: number) => {
    const estudiantesOrdenados = [...estudiantes].sort((a, b) => {
      if (order === 1) {
        // Orden ascendente
        return Number(a.respuestasCorrectas) - Number(b.respuestasCorrectas);
      } else if (order === 2) {
        // Orden descendente
        return Number(b.respuestasCorrectas) - Number(a.respuestasCorrectas);
      }
      return 0;
    });
    
    dispatch({ type: AppAction.ESTUDIANTES, payload: estudiantesOrdenados });
    return estudiantesOrdenados;
  }
  const estudiantesQueDieronExamen = async (idExamen: string, month: number) => {
    dispatch({ type: AppAction.WARNING_EVA_ESTUDIANTE_SIN_REGISTRO, payload: null })
                                            //coleccion usuario/dni del docente/ id del exasmen / año en numero / mes en numero
    const queryEstudiantes = collection(db, `/usuarios/${currentUserData.dni}/${idExamen}/${currentYear}/${month}`)
    const estudiantes = await getDocs(queryEstudiantes)
    const arrayEstudiantes: Estudiante[] = []
    
    if(estudiantes.size === 0){
      console.log('estudiantes', estudiantes.size)
      dispatch({ type: AppAction.WARNING_EVA_ESTUDIANTE_SIN_REGISTRO, payload: "No hay registros" })
    }
    
    estudiantes.forEach((doc) => {
      // doc.data() is never undefined for query doc snapshots
      arrayEstudiantes.push({ ...doc.data(), respuestasIncorrectas: Number(doc.data().totalPreguntas) - Number(doc.data().respuestasCorrectas) })
    });
    
    dispatch({ type: AppAction.ESTUDIANTES, payload: arrayEstudiantes })
    dispatch({ type: AppAction.LOADER_REPORTE_DIRECTOR, payload: false })
    return arrayEstudiantes // Retornamos el array para poder usarlo después si es necesario
    
    //codigo para crear la tabla de estudiantes con las pregunta de actuacion
  }
  const estadisticasEstudiantesDelDocente = async(idEvaluacion:string, month: number) => {
    dispatch({ type: AppAction.LOADER_REPORTE_DIRECTOR, payload: true })
    const estudiantes = await estudiantesQueDieronExamen(idEvaluacion, month)
    // Acumular los valores de a, b, c, d por cada pregunta
    const acumuladoPorPregunta: Record<string, { id: string, a: number, b: number, c: number, d?: number, total: number }> = {}
    console.log('estudiantes', estudiantes.length)
    estudiantes.forEach(estudiante => {
      if (estudiante.respuestas && Array.isArray(estudiante.respuestas)) {
        estudiante.respuestas.forEach(respuesta => {
          const idPregunta = String(respuesta.id)
          if (!idPregunta) return
          // Detectar si la alternativa 'd' existe en esta pregunta
          let tieneD = false
          if (respuesta.alternativas && Array.isArray(respuesta.alternativas)) {
            tieneD = respuesta.alternativas.some(alt => alt.alternativa === 'd')
          }
          if (!acumuladoPorPregunta[idPregunta]) {
            acumuladoPorPregunta[idPregunta] = tieneD
              ? { id: idPregunta, a: 0, b: 0, c: 0, d: 0, total: 0 }
              : { id: idPregunta, a: 0, b: 0, c: 0, total: 0 }
          }
          if (respuesta.alternativas && Array.isArray(respuesta.alternativas)) {
            respuesta.alternativas.forEach(alternativa => {
              if (alternativa.selected) {
                switch (alternativa.alternativa) {
                  case 'a':
                    acumuladoPorPregunta[idPregunta].a += 1
                    break
                  case 'b':
                    acumuladoPorPregunta[idPregunta].b += 1
                    break
                  case 'c':
                    acumuladoPorPregunta[idPregunta].c += 1
                    break
                  case 'd':
                    if (typeof acumuladoPorPregunta[idPregunta].d === 'number') {
                      acumuladoPorPregunta[idPregunta].d! += 1
                    }
                    break
                  default:
                    break
                }
              }
            })
          }
        })
      }
    })
    // Calcular el total para cada pregunta
    Object.values(acumuladoPorPregunta).forEach(obj => {
      obj.total = obj.a + obj.b + obj.c + (typeof obj.d === 'number' ? obj.d : 0)
    })
    const resultado = Object.values(acumuladoPorPregunta)
    console.log('acumulado por pregunta', resultado)
    dispatch({ type: AppAction.DATA_ESTADISTICAS, payload: resultado })
    return resultado
  }
  return {
    estudiantesQueDieronExamen,
    estadisticasEstudiantesDelDocente,
    filtroEstudiantes
  }
}