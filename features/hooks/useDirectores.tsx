import { collection, doc, getDocs, getFirestore, onSnapshot, query, serverTimestamp, updateDoc, where } from "firebase/firestore"
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
  const getDocentesCoincidentesByNombreApellido = async (docentesDirector: User[]): Promise<User[]> => {
    if (!docentesDirector || docentesDirector.length === 0) return []

    // Conjunto de DNIs normalizados ya presentes en la primera tabla (para descartarlos)
    const dnisAsignados = new Set(
      docentesDirector
        .map(d => String(d.dni || '').trim())
        .filter(Boolean)
    )

    // Normalizar nombres y apellidos de los docentes del director
    const targetKeys = new Set(
      docentesDirector
        .filter(d => d.nombres && d.apellidos)
        .map(d => `${(d.nombres || '').trim().toLowerCase()}|${(d.apellidos || '').trim().toLowerCase()}`)
    )

    if (targetKeys.size === 0) return []

    const pathRef = collection(db, "usuarios")
    const querySnapshot = await getDocs(pathRef)
    const coincidentesMap = new Map<string, User>()

    querySnapshot.forEach((docSnap) => {
      const user = docSnap.data() as User

      // Descartar si el usuario ya existe en la primera tabla (por DNI)
      if (user.dni && dnisAsignados.has(String(user.dni).trim())) {
        return
      }

      if (user.nombres && user.apellidos) {
        const key = `${user.nombres.trim().toLowerCase()}|${user.apellidos.trim().toLowerCase()}`
        if (targetKeys.has(key)) {
          // Guardar por clave única (docSnap.id o dni) para evitar duplicados en los resultados
          const uniqueId = docSnap.id || user.dni || `${user.nombres}-${user.apellidos}`
          coincidentesMap.set(uniqueId, user)
        }
      }
    })

    return Array.from(coincidentesMap.values())
  }

  const reclamarDocente = async (dniDocente: string, nuevoDniDirector: string, dniDirectorAnterior?: string) => {
    const pathRef = doc(db, "usuarios", `${dniDocente}`)
    await updateDoc(pathRef, {
      dniDirector: `${nuevoDniDirector}`,
      dniDirectorAnterior: dniDirectorAnterior || null,
      fechaActualizacion: serverTimestamp()
    })
  }

  return {
    getDocentesByDniDirector,
    gettAllProfesores,
    fixedgrado,
    getDocentesCoincidentesByNombreApellido,
    reclamarDocente
  }
}
