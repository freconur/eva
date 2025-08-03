import {
  collection,
  doc,
  getDocs,
  getFirestore,
  onSnapshot,
  query,
  updateDoc,
  where,
} from 'firebase/firestore';
import { app } from '@/firebase/firebase.config';
import { AppAction } from '../actions/appAction';
import { useGlobalContextDispatch } from '../context/GlolbalContext';
import { Evaluaciones, User, UserEstudiante } from '../types/types';
import { currentYear } from '@/fuctions/dates';

export const useSeguimeintoEvaluaciones = () => {
  const db = getFirestore(app);
  const dispatch = useGlobalContextDispatch();


  const buscarUsuarioPorDni = async (dni: string) => {
    const pathRef = collection(db, 'usuarios')
    const q = query(pathRef, where('dni', '==', dni))
    const resultadoBusquedaUsuario = await getDocs(q)
    
    if (resultadoBusquedaUsuario.size > 0) {
      const usuarioData = resultadoBusquedaUsuario.docs[0].data() as User
      if (usuarioData.rol === 2) {
        const qDocentes = query(pathRef, where('dniDirector', '==', dni))
        const resultadoBusquedaDocentes = await getDocs(qDocentes)
        if(resultadoBusquedaDocentes.size > 0) {
            const docentesDelDirector:User[] = []
            resultadoBusquedaDocentes.docs.forEach((doc) => {
              docentesDelDirector.push(doc.data() as User)
            })
            // Agregar los docentes del director al objeto usuarioData
            usuarioData.docentesDelDirector = docentesDelDirector
        }
      }
      dispatch({ type: AppAction.USUARIO_POR_DNI, payload: usuarioData })
    }
    

  }
  const estudiantesDelDocente = async(dni:string,month:string,idEvaluacion:string,usuarioPorDni:User) => {
      /* /usuarios/01287328/PPnzR009d0GOySiOEiQK/2025/6 */
      console.log(dni,month,idEvaluacion)
      const pathRef = collection(db, `usuarios/${dni}/${idEvaluacion}/${currentYear}/${month}`)
      /* const q = query(pathRef, where('dniDirector', '==', dni)) */
      const resultadoBusquedaUsuario = await getDocs(pathRef)
      const estudiantesDelDocente:UserEstudiante[] = []
      if (resultadoBusquedaUsuario.size > 0) {
        resultadoBusquedaUsuario.docs.forEach((doc) => {
          estudiantesDelDocente.push(doc.data() as UserEstudiante)
        })
        // Crear una copia del objeto para evitar mutación directa
        const usuarioActualizado = {
          ...usuarioPorDni,
          estudiantesDelDocente: estudiantesDelDocente
        }
        dispatch({ type: AppAction.USUARIO_POR_DNI, payload: usuarioActualizado })
      }
  }
  const todasLasEvaluaciones = async() => {
    const pathRef = collection(db, 'evaluaciones')
    const resultadoBusquedaEvaluaciones = await getDocs(pathRef)
    const evaluaciones:Evaluaciones[] = []
        resultadoBusquedaEvaluaciones.docs.forEach((doc) => {
            evaluaciones.push({ ...doc.data(), id: doc.id } as Evaluaciones)
        })
        /* console.log('evaluaciones', evaluaciones) */
    dispatch({ type: AppAction.EVALUACIONES, payload: evaluaciones })
  }
  return {
    buscarUsuarioPorDni,
    todasLasEvaluaciones,
    estudiantesDelDocente,
  };
};
