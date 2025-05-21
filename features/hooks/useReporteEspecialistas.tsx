import {
  collection,
  doc,
  getDoc,
  getDocs,
  getFirestore,
  query,
  setDoc,
  where,
} from "firebase/firestore";
import { DataEstadisticas, Region, User, UserEstudiante } from "../types/types";
import {
  useGlobalContext,
  useGlobalContextDispatch,
} from "../context/GlolbalContext";
import { AppAction } from "../actions/appAction";
import { currentMonth, currentYear, } from "@/fuctions/dates";


export const useReporteEspecialistas = () => {
  const dispatch = useGlobalContextDispatch();
  const { currentUserData } = useGlobalContext();
  const db = getFirestore();

  const getAllReporteDeDirectores = async (idEvaluacion: string,month:number) => {
    const pathRef = collection(db, `/evaluaciones/${idEvaluacion}/${currentYear}-${month}`)
    const querySnapshot = await getDocs(pathRef)

    const docentesDelDirector: User[] = [];
    querySnapshot.forEach((doc) => {
      docentesDelDirector.push(doc.data() as User);
    });
    dispatch({ type: AppAction.ALL_EVALUACIONES_ESTUDIANTES, payload: docentesDelDirector });
    return docentesDelDirector;
  }
  const getAllReporteDeDirectoresToDocentes = async (idEvaluacion: string,month:number) => {
    const pathRef = collection(db, `/evaluaciones-docentes/${idEvaluacion}/${currentYear}-${month}`)
    const querySnapshot = await getDocs(pathRef)

    const docentesDelDirector: User[] = [];
    querySnapshot.forEach((doc) => {
      docentesDelDirector.push(doc.data() as User);
    });
    dispatch({ type: AppAction.ALL_EVALUACIONES_DIRECTOR_DOCENTE, payload: docentesDelDirector });
    console.log('docentesDelDirector', docentesDelDirector)
    return docentesDelDirector;
  }
  
  const reporteEspecialistaDeDocente = async (idEvaluacion: string, month: number) => {
    const reporteDeEvaluacionesDocentes = await getAllReporteDeDirectoresToDocentes(idEvaluacion, month)
    const acumuladoPorPregunta: Record<string, { id: string, a: number, b: number, c: number, d?: number, total: number }> = {}
    
    // Si no hay datos, inicializar con valores en cero
    if (!reporteDeEvaluacionesDocentes || reporteDeEvaluacionesDocentes.length === 0) {
      dispatch({ type: AppAction.DATA_ESTADISTICAS, payload: [] });
      return;
    }

    reporteDeEvaluacionesDocentes.forEach(director => {
      if (director.resultados && Array.isArray(director.resultados)) {
        director.resultados.forEach(reporte => {
          const idPregunta = String(reporte.id)
          if (!idPregunta) return
  
          // Detectar si la alternativa 'd' existe en esta pregunta
          let tieneD = typeof reporte.d === 'number'
  
          if (!acumuladoPorPregunta[idPregunta]) {
            acumuladoPorPregunta[idPregunta] = tieneD
              ? { id: idPregunta, a: 0, b: 0, c: 0, d: 0, total: 0 }
              : { id: idPregunta, a: 0, b: 0, c: 0, total: 0 }
          }
  
          // Acumular valores
          acumuladoPorPregunta[idPregunta].a += reporte.a || 0
          acumuladoPorPregunta[idPregunta].b += reporte.b || 0
          acumuladoPorPregunta[idPregunta].c += reporte.c || 0
          if (tieneD) {
            acumuladoPorPregunta[idPregunta].d! += reporte.d || 0
          }
        })
      }
    })
  
    // Calcular totales
    Object.values(acumuladoPorPregunta).forEach(obj => {
      obj.total = obj.a + obj.b + obj.c + (typeof obj.d === 'number' ? obj.d : 0)
    })
  
    const resultado = Object.values(acumuladoPorPregunta)
    console.log('acumulado por pregunta', resultado)
    
    dispatch({ type: AppAction.DATA_ESTADISTICAS, payload: resultado });
  }
  const reporteParaTablaDeEspecialista = (data: User[], { region, area, genero, caracteristicaCurricular, distrito }: { region: string, area: string, genero: string, caracteristicaCurricular: string, distrito: string }, idDirector: string, idEvaluacion: string) => {    
    console.log('data', data)
    
    const dataFiltrada = data?.filter(estudiante => {
      // Crear un objeto con los filtros que tienen valor
      const filtrosActivos = {
        ...(region && { region: String(estudiante.region) === region }),
        ...(area && { area: String(estudiante.area) === area }),
        ...(genero && { genero: String(estudiante.genero) === String(genero) }),
        ...(caracteristicaCurricular && { caracteristicaCurricular: String(estudiante.caracteristicaCurricular) === String(caracteristicaCurricular) }),
        ...(distrito && { distrito: String(estudiante.distrito) === String(distrito) })
      };

      // Si no hay filtros activos, retornar true para incluir todos los estudiantes
      if (Object.keys(filtrosActivos).length === 0) return true;

      // Verificar que todos los filtros activos sean verdaderos
      return Object.values(filtrosActivos).every(filtro => filtro === true);
    });
    const acumuladoPorPregunta: Record<string, { id: string, a: number, b: number, c: number, d?: number, total: number }> = {}
    dataFiltrada.forEach(director => {
      if (director.reporteEstudiantes && Array.isArray(director.reporteEstudiantes)) {
        director.reporteEstudiantes.forEach(reporte => {
          const idPregunta = String(reporte.id)
          if (!idPregunta) return
  
          // Detectar si la alternativa 'd' existe en esta pregunta
          let tieneD = typeof reporte.d === 'number'
  
          if (!acumuladoPorPregunta[idPregunta]) {
            acumuladoPorPregunta[idPregunta] = tieneD
              ? { id: idPregunta, a: 0, b: 0, c: 0, d: 0, total: 0 }
              : { id: idPregunta, a: 0, b: 0, c: 0, total: 0 }
          }
  
          // Acumular valores
          acumuladoPorPregunta[idPregunta].a += reporte.a || 0
          acumuladoPorPregunta[idPregunta].b += reporte.b || 0
          acumuladoPorPregunta[idPregunta].c += reporte.c || 0
          if (tieneD) {
            acumuladoPorPregunta[idPregunta].d! += reporte.d || 0
          }
        })
      }
    })
  
    // Calcular totales
    Object.values(acumuladoPorPregunta).forEach(obj => {
      obj.total = obj.a + obj.b + obj.c + (typeof obj.d === 'number' ? obj.d : 0)
    })
  
    const resultado = Object.values(acumuladoPorPregunta)
    console.log('acumulado por pregunta', resultado)
    dispatch({ type: AppAction.REPORTE_DIRECTOR, payload: resultado });
    return dataFiltrada;
  }
  
  const reporteFiltrosEspecialistaDirectores = (data: User[], { area, genero, caracteristicaCurricular, distrito }: { area: string, genero: string, caracteristicaCurricular: string, distrito: string }) => {
    console.log('data', data)
    
    const dataFiltrada = data?.filter(estudiante => {
      // Crear un objeto con los filtros que tienen valor
      const filtrosActivos = {
        ...(area && { area: String(estudiante.area) === area }),
        ...(genero && { genero: estudiante.genero === genero }),
        ...(caracteristicaCurricular && { caracteristicaCurricular: estudiante.caracteristicaCurricular === caracteristicaCurricular }),
        ...(distrito && { distrito: estudiante.distrito === distrito })
      };

      // Si no hay filtros activos, retornar true para incluir todos los estudiantes
      if (Object.keys(filtrosActivos).length === 0) return true;

      // Verificar que todos los filtros activos sean verdaderos
      return Object.values(filtrosActivos).every(filtro => filtro === true);
    });

    const acumuladoPorPregunta: Record<string, { id: string, a: number, b: number, c: number, d?: number, total: number }> = {}
    
    dataFiltrada.forEach(director => {
      if (director.resultados && Array.isArray(director.resultados)) {
        director.resultados.forEach(reporte => {
          const idPregunta = String(reporte.id)
          if (!idPregunta) return
  
          // Detectar si la alternativa 'd' existe en esta pregunta
          let tieneD = typeof reporte.d === 'number'
  
          if (!acumuladoPorPregunta[idPregunta]) {
            acumuladoPorPregunta[idPregunta] = tieneD
              ? { id: idPregunta, a: 0, b: 0, c: 0, d: 0, total: 0 }
              : { id: idPregunta, a: 0, b: 0, c: 0, total: 0 }
          }
  
          // Acumular valores
          acumuladoPorPregunta[idPregunta].a += reporte.a || 0
          acumuladoPorPregunta[idPregunta].b += reporte.b || 0
          acumuladoPorPregunta[idPregunta].c += reporte.c || 0
          if (tieneD) {
            acumuladoPorPregunta[idPregunta].d! += reporte.d || 0
          }
        })
      }
    })
  
    // Calcular totales
    Object.values(acumuladoPorPregunta).forEach(obj => {
      obj.total = obj.a + obj.b + obj.c + (typeof obj.d === 'number' ? obj.d : 0)
    })
  
    const resultado = Object.values(acumuladoPorPregunta)
    console.log('acumulado por pregunta', resultado)
    dispatch({ type: AppAction.DATA_ESTADISTICAS, payload: resultado });
    return dataFiltrada;
  }
  const getAllReporteDeDirectoreToAdmin = async (idEvaluacion: string,month:number) => {
    const pathRef = collection(db, `/evaluaciones/${idEvaluacion}/${currentYear}-${month}`)
    const querySnapshot = await getDocs(pathRef)

    const docentesDelDirector: User[] = [];
    querySnapshot.forEach((doc) => {
      docentesDelDirector.push(doc.data() as User);
    });
    
    console.log('docentesDelDirector', docentesDelDirector)
    dispatch({ type: AppAction.ALL_EVALUACIONES_DIRECTOR_DOCENTE, payload: docentesDelDirector });
    return docentesDelDirector;
  }
  //creo que esta funcion se esta usando para el especialista y directores, tengo que verificar en caso alguna pagina comienze a fallar y comienze a dar error
const reporteEspecialistaDeEstudiantes = async (idEvaluacion: string, month: number, currentUserData: User) => {
  /* const reporteDeEstudiantes = await getAllReporteDeDirectoresToDocentes(idEvaluacion, month) */
  const reporteDeEstudiantes = await getAllReporteDeDirectoreToAdmin(idEvaluacion, month)
  console.log('reporteDeEstudiantes', reporteDeEstudiantes)

  const acumuladoPorPregunta: Record<string, { id: string, a: number, b: number, c: number, d?: number, total: number }> = {}

  reporteDeEstudiantes.forEach(director => {
    if (director.reporteEstudiantes && Array.isArray(director.reporteEstudiantes)) {
      director.reporteEstudiantes.forEach(reporte => {
        const idPregunta = String(reporte.id)
        if (!idPregunta) return

        // Detectar si la alternativa 'd' existe en esta pregunta
        let tieneD = typeof reporte.d === 'number'

        if (!acumuladoPorPregunta[idPregunta]) {
          acumuladoPorPregunta[idPregunta] = tieneD
            ? { id: idPregunta, a: 0, b: 0, c: 0, d: 0, total: 0 }
            : { id: idPregunta, a: 0, b: 0, c: 0, total: 0 }
        }

        // Acumular valores
        acumuladoPorPregunta[idPregunta].a += reporte.a || 0
        acumuladoPorPregunta[idPregunta].b += reporte.b || 0
        acumuladoPorPregunta[idPregunta].c += reporte.c || 0
        if (tieneD) {
          acumuladoPorPregunta[idPregunta].d! += reporte.d || 0
        }
      })
    }
  })

  // Calcular totales
  Object.values(acumuladoPorPregunta).forEach(obj => {
    obj.total = obj.a + obj.b + obj.c + (typeof obj.d === 'number' ? obj.d : 0)
  })

  const resultado = Object.values(acumuladoPorPregunta)
  dispatch({ type: AppAction.REPORTE_DIRECTOR, payload: resultado });
  return resultado
}
  return {
    getAllReporteDeDirectores,
    reporteParaTablaDeEspecialista,
    reporteEspecialistaDeEstudiantes,
    getAllReporteDeDirectoresToDocentes,
    reporteEspecialistaDeDocente,
    reporteFiltrosEspecialistaDirectores
  }
}