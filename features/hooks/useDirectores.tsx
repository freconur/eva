import { collection, doc, getDocs, getFirestore, onSnapshot, query, updateDoc, where } from "firebase/firestore"
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
  const gettAllProfesores = async () => {
    const pathRef = collection(db, 'usuarios')
    const q = query(pathRef, where("perfil.rol", "==", 3))

    /* console.log('withConverter',q.withConverter()) */
    await getDocs(q)
      .then(response => {
        console.log('size', response.size)
        const arrayProfesores: User[] = []
        response.forEach(doc => {
          arrayProfesores.push({ ...doc.data() })
        })
        console.log('arrayProfesores', arrayProfesores)
        dispatch({ type: AppAction.USUARIOS_BY_ROL, payload: arrayProfesores })
      }
      )
  }

  const fixedgrado = (arrayProfesores: User[]) => {
    const fixedUpdate = async (arrayProfesores: User[]) => {
      arrayProfesores.forEach(async (profesor) => {
        /* if (profesor.dni === "01316161") { */
          const pathRef = doc(db, "usuarios", `${profesor.dni}`);
          await updateDoc(pathRef, {
            grados: profesor.grados,
            secciones: profesor.secciones
          });
        /* } */
      })
    }
    console.log('0', arrayProfesores)
    const arrayProfesoresFixed = arrayProfesores.filter(profesor => Array.isArray(profesor.secciones) && Array.isArray(profesor.grados))
    console.log('1', arrayProfesoresFixed)
    let index = 0
    arrayProfesoresFixed.forEach((profesor) => {
      index = index + 1
      if (profesor.grados) {
        profesor.grados = profesor.grados?.map(grado => Number(grado))
        profesor.secciones = profesor.secciones?.map(seccion => Number(seccion))
      }
      if (index + 1 === arrayProfesoresFixed.length) {
        console.log('hemos terminado', index, arrayProfesoresFixed.length - 1)
        console.log('2', arrayProfesoresFixed)
         fixedUpdate(arrayProfesoresFixed)
        /* dispatch({ type: AppAction.USUARIOS_BY_ROL, payload: arrayProfesoresFixed }) */
      }
    })
    


    // Set the "capital" field of the city 'DC'
  }
  return {
    getDocentesByDniDirector,
    gettAllProfesores,
    fixedgrado
  }
}
