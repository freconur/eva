import { collection, getDocs, getFirestore, query, where } from "firebase/firestore/lite";
import { User } from "../types/types";
import { useGlobalContext, useGlobalContextDispatch } from "../context/GlolbalContext";
import { AppAction } from "../actions/appAction";



const db = getFirestore()


export const useRegistros = () => {
  const dispatch = useGlobalContextDispatch()
  const { currentUserData } = useGlobalContext()

  const getDirectores = async () => {
    const q = query(collection(db, "usuarios"), where("rol", "==", 2));
    const querySnapshot = await getDocs(q);
    const directores: User[] = []
    querySnapshot.forEach((doc) => {
      directores.push(doc.data())
    });
    dispatch({ type: AppAction.DIRECTORES, payload: directores })
  }

  const getDocentesDeDirectores = async (idDirector: string, dniPredecesor?: string) => {
    if (!idDirector) return;
    const effectivePredecesor = dniPredecesor || currentUserData?.dniDirectorPredecesor;
    const dnis = [String(idDirector).trim()];
    if (effectivePredecesor && String(effectivePredecesor).trim() && !dnis.includes(String(effectivePredecesor).trim())) {
      dnis.push(String(effectivePredecesor).trim());
    }
    if (Array.isArray(currentUserData?.directoresPredecesores)) {
      currentUserData.directoresPredecesores.forEach((d: string) => {
        const clean = String(d || '').trim();
        if (clean && !dnis.includes(clean)) dnis.push(clean);
      });
    }
    const q = dnis.length === 1
      ? query(collection(db, "usuarios"), where("dniDirector", "==", dnis[0]))
      : query(collection(db, "usuarios"), where("dniDirector", "in", dnis.slice(0, 30)));
    const querySnapshot = await getDocs(q);
    const mapDocentes = new Map<string, User>();
    querySnapshot.forEach((doc) => {
      const data = doc.data() as User;
      const key = String(data.dni || doc.id);
      if (!mapDocentes.has(key)) {
        mapDocentes.set(key, data);
      }
    });
    dispatch({ type: AppAction.DOCENTES_DIRECTORES, payload: Array.from(mapDocentes.values()) });
  }
  return {
    getDirectores,
    getDocentesDeDirectores
  }
}