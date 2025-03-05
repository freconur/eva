import { addDoc, collection, doc, getDoc, getDocs, getFirestore, increment, orderBy, query, setDoc, updateDoc, where } from "firebase/firestore/lite"
import { AppAction } from "../actions/appAction"
import { useGlobalContext, useGlobalContextDispatch } from "../context/GlolbalContext"
import { CreaEvaluacion, Evaluaciones, Grades, PreguntasRespuestas, User, UserEstudiante } from "../types/types"




export const useAgregarEvaluaciones = () => {
  const dispatch = useGlobalContextDispatch()
  const { currentUserData } = useGlobalContext()
  const db = getFirestore()


  const getEvaluaciones = async () => {
    // let allEvaluaciones: Evaluaciones[] = []
    dispatch({ type: AppAction.LOADER_PAGES, payload: true })

    const querySnapshot = await getDocs(collection(db, "evaluaciones"));
    let allEvaluaciones: Evaluaciones[] = []

    const newPromise = new Promise<boolean>((resolve, reject) => {
      try {
        querySnapshot.forEach((doc) => {
          allEvaluaciones.push({ ...doc.data(), id: doc.id })
        });

        resolve(true)
      } catch (error) {
        console.log('error', error)
        dispatch({ type: AppAction.LOADER_PAGES, payload: false })
        reject(false)
      }
    })

    newPromise.then(response => {
      if (response === true) {
        dispatch({ type: AppAction.EVALUACIONES, payload: allEvaluaciones })
        dispatch({ type: AppAction.LOADER_PAGES, payload: false })
      }
    })
  }


  const getGrades = async () => {
    const refGrados = collection(db, 'grados')
    const q = query(refGrados, orderBy("grado"))
    await getDocs(q)
      .then(res => {
        const grados: Grades[] = []
        if (res.size > 0) {
          res.forEach(doc => {
            grados.push({ ...doc.data(), id: doc.id })
          })
        }
        dispatch({ type: AppAction.GRADOS, payload: grados })
      })
  }

  const getEvaluacionesGradoYCategoria = async (grado: number, categoria: number) => {
    const refGrados = collection(db, 'evaluaciones')
    const q = query(refGrados, where("grado", "==", Number(grado)), where("categoria", "==", Number(categoria)))
    // const q = query(refGrados, )

    await getDocs(q)
      .then(res => {
        const allEvaluaciones: Evaluaciones[] = []
        res.forEach(doc => {
          allEvaluaciones.push({ ...doc.data(), id: doc.id })
        })
        dispatch({ type: AppAction.EVALUACIONES_GRADO_CATEGORIA, payload: allEvaluaciones })
      })
  }
  const crearEvaluacion = async (value: CreaEvaluacion) => {


    await addDoc(collection(db, "/evaluaciones"), {
      idDocente: currentUserData.dni,
      nombre: value.nombreEvaluacion,
      grado: Number(value.grado),
      categoria: Number(value.categoria)
    })
  }

  const getEvaluacion = async (id: string) => {
    const docRef = doc(db, "evaluaciones", `${id}`);
    const docSnap = await getDoc(docRef);

    if (docSnap.exists()) {
      dispatch({ type: AppAction.EVALUACION, payload: docSnap.data() })
    }
  }

  const getPreguntasRespuestas = async (id: string) => {
    dispatch({ type: AppAction.LOADER_PAGES, payload: true })
    if (id.length > 0) {
      const querySnapshot = await getDocs(collection(db, `/evaluaciones/${id}/preguntasRespuestas`));
      const count = querySnapshot.size
      let preguntasrespuestas: PreguntasRespuestas[] = []

      const newPromise = new Promise<boolean>((resolve, reject) => {
        try {
          querySnapshot.forEach((doc) => {
            preguntasrespuestas.push({ ...doc.data(), id: doc.id })
          });
          preguntasrespuestas.sort((a: any, b: any) => a.id - b.id)
          resolve(true)
        } catch (error) {
          console.log('error', error)
          dispatch({ type: AppAction.LOADER_PAGES, payload: false })
          reject(false)
        }
      })

      newPromise.then(response => {
        if (response === true) {
          dispatch({ type: AppAction.PREGUNTAS_RESPUESTAS, payload: preguntasrespuestas })
          dispatch({ type: AppAction.SIZE_PREGUNTAS, payload: count })
          dispatch({ type: AppAction.LOADER_PAGES, payload: false })
        }
      })
    }
  }

  const guardarPreguntasRespuestas = async (data: PreguntasRespuestas) => {
    console.log('data', data)
    const querySnapshot = await getDocs(collection(db, `/evaluaciones/${data.id}/preguntasRespuestas`));
    console.log('querySnapshot.size', querySnapshot.size)
    const count = querySnapshot.size


    await setDoc(doc(db, `/evaluaciones/${data.id}/preguntasRespuestas`, `${count + 1}`), {
      pregunta: data.pregunta,
      respuesta: data.respuesta,
      alternativas: data.alternativas,
    });
  }
  const salvarPreguntRespuestaEstudiante = async (data: UserEstudiante, id: string, pq: PreguntasRespuestas[], respuestasCorrectas: number, sizePreguntas: number) => {
    dispatch({ type: AppAction.LOADER_SALVAR_PREGUNTA, payload: true })

    const rutaRef = doc(db, `/usuarios/${currentUserData.dni}/${id}/${data.dni}`);
    await setDoc(rutaRef, {
      nombresApellidos: data.nombresApellidos,
      dni: data.dni,
      dniDocente: currentUserData.dni,
      respuestasCorrectas: respuestasCorrectas,
      totalPreguntas: sizePreguntas
    })

    const promiseGuardarData = new Promise<boolean>((resolve, reject) => {
      try {
        pq.forEach(async (a) => {
          let rta: string = ""
          a.alternativas?.forEach(x => {
            if (x.selected === true) {
              rta = `${x.alternativa}`
              console.log('rta', rta)
            }
          })
          const rutaRef = doc(db, `/usuarios/${currentUserData.dni}/${id}/${data.dni}/${data.dni}/${a.id}`);
          await setDoc(rutaRef, {
            pregunta: a.pregunta,
            respuesta: a.respuesta,
            respuestaEstudiante: rta.length > 0 && rta
          })
          const docRef = doc(db, `/evaluaciones/${id}/${currentUserData.dni}`, `${a.id}`);
          const querySnapshot = await getDoc(docRef);
          // const docSnap = await getDoc(docRef);
          if (!querySnapshot.exists()) {
            const dataGraficos = doc(db, `/evaluaciones/${id}/${currentUserData.dni}/${a.id}`)
            await setDoc(dataGraficos, {
              a: 0,
              b: 0,
              c: 0
            })
          }
          const dataGraficos = doc(db, `/evaluaciones/${id}/${currentUserData.dni}/${a.id}`)
          a.alternativas?.map(async al => {
            if (al.selected === true && al.alternativa === "a") {
              await updateDoc(dataGraficos, {
                a: increment(1)
              })
            } else if (al.selected === true && al.alternativa === "b") {
              await updateDoc(dataGraficos, {
                b: increment(1)
              })
            } else if (al.selected === true && al.alternativa === "c") {
              await updateDoc(dataGraficos, {
                c: increment(1)
              })
            }
          })
        })
        resolve(true)
      } catch (error) {
        console.log('error', error)
        dispatch({ type: AppAction.LOADER_SALVAR_PREGUNTA, payload: false })
        reject(false)
      }
    })

    promiseGuardarData.then(response => {
      if (response === true) {
        console.log('response update data', response)
        dispatch({ type: AppAction.LOADER_SALVAR_PREGUNTA, payload: false })
      }
    })

  }
  const prEstudiantes = (data: PreguntasRespuestas[]) => {
    dispatch({ type: AppAction.PREGUNTAS_RESPUESTAS_ESTUDIANTES, payload: data })
  }

  return {
    guardarPreguntasRespuestas,
    crearEvaluacion,
    getEvaluaciones,
    getEvaluacion,
    getPreguntasRespuestas,
    prEstudiantes,
    salvarPreguntRespuestaEstudiante,
    getGrades,
    getEvaluacionesGradoYCategoria
  }
}
