import { collection, getDocs, getFirestore, query, where } from "firebase/firestore/lite";
import { User } from "../types/types";
import { useGlobalContextDispatch } from "../context/GlolbalContext";
import { AppAction } from "../actions/appAction";



const db = getFirestore()


export const useRegistros = () => {
  const dispatch = useGlobalContextDispatch()

  const getDirectores = async () => {
    // const querySnapshot = await getDocs(collection(db, "usuarios"));
    // const directores: User[] = []
    // querySnapshot.forEach((doc) => {
    //   directores.push(doc.data())
    // });


    const q = query(collection(db, "usuarios"), where("rol", "==", 2));

    const querySnapshot = await getDocs(q);
    const directores: User[] = []
    querySnapshot.forEach((doc) => {
      directores.push(doc.data())
      // doc.data() is never undefined for query doc snapshots
    });
    dispatch({ type: AppAction.DIRECTORES, payload: directores })
  }

  return {
    getDirectores
  }
}