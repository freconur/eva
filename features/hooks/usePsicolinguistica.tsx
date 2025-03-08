import { app } from "@/firebase/firebase.config"
import { addDoc, collection, doc, getDoc, getDocs, getFirestore, setDoc } from "firebase/firestore/lite"
import { Psicolinguistica, PsicolinguiticaExamen } from "../types/types"
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
const salvarPreguntaPsicolinguistica = async (data:PsicolinguiticaExamen, id:string) => {
  console.log('primera entrada')
  dispatch({type:AppAction.LOADER_SALVAR_PREGUNTA, payload:true})
  const pathRef = collection(db,`psicolinguistica/${id}/preguntas`)
  const pathRefPregunta = `psicolinguistica/${id}/preguntas`
  await getDocs(pathRef)
  .then(async (res) => {
    console.log('estamos entrando')
    // if(res.size === 0) {
      await setDoc(doc(db, pathRefPregunta,`${res.size + 1}`), {
        pregunta: data.pregunta,
        order: res.size + 1
      })
      .then(res => dispatch({type:AppAction.LOADER_SALVAR_PREGUNTA, payload:false}))
    // }
  })
}
  const getPsicolinguisticaById = async (id: string) => {
    const pathRef = doc(db, "psicolinguistica", `${id}`);
    await getDoc(pathRef)
      .then((res) => {
        dispatch({ type: AppAction.PSICOLINGUISTICA_BY_ID, payload: { ...res.data(), id: res.id } })
      })
      .then(async (res) => {
        const pathRef = collection(db,`psicolinguistica/${id}/preguntas`)
        await getDocs(pathRef)
        .then(res => {
          const array:PsicolinguiticaExamen[] = []
          res.forEach(doc => {
            array.push(doc.data())
          })
          dispatch({ type: AppAction.PSICOLINGUISTICA_PREGUNTAS, payload: array})
        })
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
    getPsicolinguistica,
    getPsicolinguisticaById,
    salvarPreguntaPsicolinguistica
  }
}