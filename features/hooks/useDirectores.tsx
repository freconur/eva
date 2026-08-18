import { collection, doc, getDocs, getFirestore, onSnapshot, query, serverTimestamp, updateDoc, where } from "firebase/firestore"
import { app } from "@/firebase/firebase.config";
import { AppAction } from "../actions/appAction";
import { useGlobalContextDispatch } from "../context/GlolbalContext";
import { User } from "../types/types";

export const useDirectores = () => {
  const db = getFirestore(app)
  const dispatch = useGlobalContextDispatch();

  const fetchEstudiantesDataForDocente = async (docenteDni?: string) => {
    if (!docenteDni) return { total: 0, porGrado: {} };
    try {
      const subColRef = collection(db, 'usuarios', String(docenteDni), 'estudiantes-docentes');
      const snapshot = await getDocs(subColRef);
      const porGrado: Record<string, number> = {};
      let total = 0;
      snapshot.forEach((doc) => {
        total += 1;
        const data = doc.data();
        const gradoVal = String(data.grado ?? '').trim();
        if (gradoVal) {
          porGrado[gradoVal] = (porGrado[gradoVal] || 0) + 1;
        }
      });
      return { total, porGrado };
    } catch (err) {
      console.error(`Error al cargar estudiantes para docente ${docenteDni}:`, err);
      return { total: 0, porGrado: {} };
    }
  };

  const getDocentesByDniDirector = async (dniDirector: string) => {
    const pathRef = collection(db, "usuarios")
    const q = query(pathRef, where("dniDirector", "==", dniDirector))

    onSnapshot(q, async (querySnapshot) => {
      const baseDocentes: User[] = []
      querySnapshot.forEach((doc) => {
        baseDocentes.push(doc.data())
      })

      const docentesConEstudiantes: User[] = await Promise.all(
        baseDocentes.map(async (user) => {
          if (!user.dni) return { ...user, totalEstudiantes: 0, estudiantesPorGrado: {} };
          const { total, porGrado } = await fetchEstudiantesDataForDocente(String(user.dni));
          return {
            ...user,
            totalEstudiantes: total,
            estudiantesPorGrado: porGrado
          };
        })
      );

      dispatch({ type: AppAction.USUARIOS_BY_ROL, payload: docentesConEstudiantes })
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

    // Obtener lista de apellidos únicos de los docentes del director
    const apellidosUnicos = Array.from(new Set(
      docentesDirector
        .map(d => (d.apellidos || '').trim())
        .filter(Boolean)
    ))

    if (apellidosUnicos.length === 0) return []

    // Map de coincidencias encontradas por id/dni único
    const coincidentesMap = new Map<string, User>()
    const pathRef = collection(db, "usuarios")

    // Consultas indexadas en paralelo por cada apellido (en lugar de traer toda la base de datos)
    const querySnapshots = await Promise.all(
      apellidosUnicos.map(apellidos => {
        const q = query(pathRef, where("apellidos", "==", apellidos))
        return getDocs(q)
      })
    )

    // Mapa de llaves objetivo (nombres + apellidos en minúsculas)
    const targetKeys = new Set(
      docentesDirector
        .filter(d => d.nombres && d.apellidos)
        .map(d => `${(d.nombres || '').trim().toLowerCase()}|${(d.apellidos || '').trim().toLowerCase()}`)
    )

    querySnapshots.forEach(snapshot => {
      snapshot.forEach(docSnap => {
        const user = docSnap.data() as User

        // Descartar si el usuario ya existe en la primera tabla por DNI
        if (user.dni && dnisAsignados.has(String(user.dni).trim())) {
          return
        }

        if (user.nombres && user.apellidos) {
          const key = `${user.nombres.trim().toLowerCase()}|${user.apellidos.trim().toLowerCase()}`
          if (targetKeys.has(key)) {
            const uniqueId = docSnap.id || user.dni || `${user.nombres}-${user.apellidos}`
            coincidentesMap.set(uniqueId, user)
          }
        }
      })
    })

    const resultDocentes = Array.from(coincidentesMap.values())
    const docentesConEstudiantes: User[] = await Promise.all(
      resultDocentes.map(async (user) => {
        if (!user.dni) return { ...user, totalEstudiantes: 0, estudiantesPorGrado: {} }
        const { total, porGrado } = await fetchEstudiantesDataForDocente(String(user.dni))
        return {
          ...user,
          totalEstudiantes: total,
          estudiantesPorGrado: porGrado
        }
      })
    )

    return docentesConEstudiantes
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
