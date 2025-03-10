import { app } from "@/firebase/firebase.config"
import { addDoc, collection, doc, getDoc, getDocs, getFirestore, orderBy, query, setDoc } from "firebase/firestore/lite"
import { Psicolinguistica, PsicolinguiticaExamen, respuestaPsicolinguistica } from "../types/types"
import { useGlobalContext, useGlobalContextDispatch } from "../context/GlolbalContext"
import { AppAction } from "../actions/appAction"




export const usePsicolinguistica = () => {
  const db = getFirestore(app)
  const dispatch = useGlobalContextDispatch()
  const { currentUserData } = useGlobalContext()
  const createPsicolinguistica = async (data: Psicolinguistica) => {
    const ref = collection(db, "psicolinguistica")
    await addDoc(ref, {
      nombre: data.nombre
    })
      .then(res => {
        console.log(res.id)
      })
  }
  const salvarPreguntaPsicolinguistica = async (data: PsicolinguiticaExamen, id: string) => {
    console.log('primera entrada')
    dispatch({ type: AppAction.LOADER_SALVAR_PREGUNTA, payload: true })
    const pathRef = collection(db, `psicolinguistica/${id}/preguntas`)
    const pathRefPregunta = `psicolinguistica/${id}/preguntas`
    await getDocs(pathRef)
      .then(async (res) => {
        console.log('estamos entrando')
        // if(res.size === 0) {
        await setDoc(doc(db, pathRefPregunta, `${res.size + 1}`), {
          pregunta: data.pregunta,
          order: res.size + 1
        })
          .then(res => dispatch({ type: AppAction.LOADER_SALVAR_PREGUNTA, payload: false }))
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
        const pathRef = collection(db, `psicolinguistica/${id}/preguntas`)
        const q = query(pathRef, orderBy("order", "asc"))
        await getDocs(q)
          .then(res => {
            const array: PsicolinguiticaExamen[] = []
            res.forEach(doc => {
              array.push({
                ...doc.data(),
                id: doc.id,
                alternativas: [
                  { alternativa: 'a', descripcion: 'si', selected: true },
                  { alternativa: 'b', descripcion: 'no', selected: false },
                ]
              })
            })
            dispatch({ type: AppAction.PSICOLINGUISTICA_PREGUNTAS, payload: array })
          })
      })

  }
  const actualizarPreguntasPsicolinguistica = (preguntasPsicolinguistica: PsicolinguiticaExamen[]) => {
    dispatch({ type: AppAction.PSICOLINGUISTICA_PREGUNTAS_ACTUALIZADAS, payload: preguntasPsicolinguistica })
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

  const salvarRespuestaPsicolinguistica = async (data: respuestaPsicolinguistica, pr: PsicolinguiticaExamen[], idEvaluacion: string, idDirector:string) => {
    console.log('pr', pr)
    console.log('data', data)
    // const pathRef = `/psicolinguistica/${idEvaluacion}/${currentUserData.dniDirector}/${data.dni}`
    const pathRef = (`/psicolinguistica/${idEvaluacion}/${currentUserData.dniDirector}/`)
    await setDoc(doc(db, pathRef, `${data.dni}`), {
      dni: data.dni,
      grado: data.grado,
      nombreApellidos: data.nombreApellidos,
      seccion: data.seccion,
      respuestaPregunta:pr
    })
      // .then(async (res) => {
      //   const pathRef = (`/psicolinguistica/${idEvaluacion}/${currentUserData.dniDirector}/${data.dni}/${data.dni}`)
      //   pr.forEach(async (a) => {
      //     await setDoc(doc(db, pathRef, `${a.order}`), a)
      //     if(a.order === pr.length) {
      //       console.log('es el ultimo y estamos terminando')
      //     }
      //   })
      // })
  }

  const reportePsicolinguistica = (id:string) => {
    const pathRef = collection(db,`/psicolinguistica/${id}/${currentUserData.dniDirector}//46746711`)
  }
  return {
    createPsicolinguistica,
    getPsicolinguistica,
    getPsicolinguisticaById,
    salvarPreguntaPsicolinguistica,
    actualizarPreguntasPsicolinguistica,
    salvarRespuestaPsicolinguistica,
    reportePsicolinguistica
  }
}