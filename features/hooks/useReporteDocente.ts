import { collection, getDocs, getFirestore } from "firebase/firestore/lite"
import { useGlobalContext, useGlobalContextDispatch } from "../context/GlolbalContext"
import { Estudiante } from "../types/types"
import { AppAction } from "../actions/appAction"






export const useReporteDocente = () => {
  const db = getFirestore()
  const { currentUserData } = useGlobalContext()
  const dispatch = useGlobalContextDispatch()

  const estudiantesQueDieronExamen = async (idExamen: string, idDocente:string) => {

    console.log('path', `/usuarios/${idDocente}/${idExamen}`)
    const queryEstudiantes = collection(db, `/usuarios/${currentUserData.dni}/${idExamen}`)
    const docsEstudiantes = await getDocs(queryEstudiantes)

    const arrayEstudiantes: Estudiante[] = []
    docsEstudiantes.forEach((doc) => {
      // doc.data() is never undefined for query doc snapshots
      console.log(doc.id, " => ", doc.data());
      arrayEstudiantes.push(doc.data())
    });

    dispatch({type:AppAction.ESTUDIANTES , payload:arrayEstudiantes})
  }

  return {
    estudiantesQueDieronExamen
  }
}