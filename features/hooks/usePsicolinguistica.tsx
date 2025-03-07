import { app } from "@/firebase/firebase.config"
import { addDoc, collection, getDocs, getFirestore } from "firebase/firestore/lite"
import { Psicolinguistica } from "../types/types"
import { useGlobalContextDispatch } from "../context/GlolbalContext"
import { AppAction } from "../actions/appAction"




export const usePsicolinguistica = () => {
  const db = getFirestore(app)
  const dispatch = useGlobalContextDispatch()

  const createPsicolinguistica = async (data: Psicolinguistica) => {
    const ref = collection(db, "psicolinguistica")
    await addDoc(ref, {
      nombre: data.nombre
    })
      .then(res => {
        console.log(res.id)
      })
  }

  const getPsicolinguistica = async () => {
    const pathRef = collection(db, "psicolinguistica")
    await getDocs(pathRef)
      .then(res => {
        const evaluacionesPsicolinguistica: Psicolinguistica[] = []
        res.forEach(doc => {
          evaluacionesPsicolinguistica.push({ ...doc.data(), id: doc.id })
        })
        dispatch({ type: AppAction.PSICOLINGUISTICA, payload: evaluacionesPsicolinguistica })
      })
  }
  return {
    createPsicolinguistica,
    getPsicolinguistica
  }
}