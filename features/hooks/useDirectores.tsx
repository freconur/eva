import { collection, getDocs, getFirestore, onSnapshot, query, where } from "firebase/firestore"
import { app } from "@/firebase/firebase.config";
import { AppAction } from "../actions/appAction";
import { useGlobalContextDispatch } from "../context/GlolbalContext";
import { User } from "../types/types";

export const useDirectores = () => {
  const db = getFirestore(app)
  const dispatch = useGlobalContextDispatch();
  
  const getDocentesByDniDirector = async (dniDirector: string) => {
    const pathRef = collection(db, "usuarios")
    const q = query(pathRef, where("dniDirector", "==", dniDirector))
    
    onSnapshot(q, (querySnapshot) => {
      const usuariosByRol: User[] = []
      querySnapshot.forEach((doc) => {
        usuariosByRol.push(doc.data())
      })
      dispatch({ type: AppAction.USUARIOS_BY_ROL, payload: usuariosByRol })
    })
  }

  return {
    getDocentesByDniDirector
  }
}
