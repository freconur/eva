import { collection, getDocs, getFirestore, query, where } from "firebase/firestore/lite";
import { User } from "../types/types";
import { useGlobalContextDispatch } from "../context/GlolbalContext";
import { AppAction } from "../actions/appAction";



const db = getFirestore()


export const useRegistros = () => {
  const dispatch = useGlobalContextDispatch()

  const getDirectores = async () => {
    const q = query(collection(db, "usuarios"), where("rol", "==", 2));
    const querySnapshot = await getDocs(q);
    const directores: User[] = []
    querySnapshot.forEach((doc) => {
      directores.push(doc.data())
    });
    dispatch({ type: AppAction.DIRECTORES, payload: directores })
  }

  const getDocentesDeDirectores = async (idDirector: string) => {
    const q = query(collection(db, "usuarios"), where("dniDirector", "==", `${idDirector}`));
    const querySnapshot = await getDocs(q);
    const arrayDocentesDirectores: User[] = []
    querySnapshot.forEach((doc) => {
      arrayDocentesDirectores.push(doc.data())
    });
    dispatch({ type: AppAction.DOCENTES_DIRECTORES, payload: arrayDocentesDirectores })
  }
  return {
    getDirectores,
    getDocentesDeDirectores
  }
}