import { collection, getDocs, getFirestore, orderBy, query } from "firebase/firestore/lite"
import { useGlobalContext, useGlobalContextDispatch } from "../context/GlolbalContext"
import { DataEstadisticas, Estudiante } from "../types/types"
import { AppAction } from "../actions/appAction"






export const useReporteDocente = () => {
  const db = getFirestore()
  const { currentUserData } = useGlobalContext()
  const dispatch = useGlobalContextDispatch()

  const estudiantesQueDieronExamen = async (idExamen: string, idDocente: string) => {

    //datos para grafico
    const refData = collection(db, `/evaluaciones/${idExamen}/${idDocente}/`)
    // const q = query(refData, orderBy("order","asc"))
    const dataEstadisticas = await getDocs(refData)
    const arrayDataEstadisticas: DataEstadisticas[] = []
    dataEstadisticas.forEach((doc) => {
      // doc.data() is never undefined for query doc snapshots
      arrayDataEstadisticas.push({
        ...doc.data(),
        id: doc.id,
        total: doc.data().d === undefined ? Number(doc.data().a) + Number(doc.data().b) + Number(doc.data().c) : Number(doc.data().a) + Number(doc.data().b) + Number(doc.data().c) + Number(doc.data().d)
      })
    });
    arrayDataEstadisticas.sort((a: any, b: any) => a.id - b.id)
    dispatch({ type: AppAction.DATA_ESTADISTICAS, payload: arrayDataEstadisticas })

    const queryEstudiantes = collection(db, `/usuarios/${currentUserData.dni}/${idExamen}`)
    const docsEstudiantes = await getDocs(queryEstudiantes)

    const arrayEstudiantes: Estudiante[] = []
    docsEstudiantes.forEach((doc) => {
      // doc.data() is never undefined for query doc snapshots
      arrayEstudiantes.push({ ...doc.data(), respuestasIncorrectas: Number(doc.data().totalPreguntas) - Number(doc.data().respuestasCorrectas) })
    });
    dispatch({ type: AppAction.ESTUDIANTES, payload: arrayEstudiantes })

    //codigo para crear la tabla de estudiantes con las pregunta de actuacion





  }

  return {
    estudiantesQueDieronExamen
  }
}