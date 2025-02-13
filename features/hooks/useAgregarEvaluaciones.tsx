import { addDoc, collection, doc, getDoc, getDocs, getFirestore, setDoc } from "firebase/firestore/lite"
import { AppAction } from "../actions/appAction"
import { useGlobalContext, useGlobalContextDispatch } from "../context/GlolbalContext"
import { Evaluaciones, PreguntasRespuestas, User, UserEstudiante } from "../types/types"




export const useAgregarEvaluaciones = () => {
  const dispatch = useGlobalContextDispatch()
  const { currentUserData } = useGlobalContext()
  const db = getFirestore()


  const getEvaluaciones = async () => {
    // let allEvaluaciones: Evaluaciones[] = []
    const querySnapshot = await getDocs(collection(db, "evaluaciones"));
    let allEvaluaciones: Evaluaciones[] = []
    querySnapshot.forEach((doc) => {
      allEvaluaciones.push({ ...doc.data(), id: doc.id })
    });
    dispatch({ type: AppAction.EVALUACIONES, payload: allEvaluaciones })
  }
  const crearEvaluacion = async (value: string) => {
    
    await addDoc(collection(db, "/evaluaciones"), {
      idDocente: currentUserData.dni,
      nombre: value
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
    if (id.length > 0) {
      const querySnapshot = await getDocs(collection(db, `/evaluaciones/${id}/preguntasRespuestas`));
      const count = querySnapshot.size
      let preguntasrespuestas: PreguntasRespuestas[] = []
      querySnapshot.forEach((doc) => {
        preguntasrespuestas.push({ ...doc.data(), id: doc.id })
      });

      preguntasrespuestas.sort((a: any, b: any) => a.id - b.id)
      console.log('preguntasrespuestas', preguntasrespuestas)
      dispatch({ type: AppAction.PREGUNTAS_RESPUESTAS, payload: preguntasrespuestas })
      // dispatch({ type: AppAction.PREGUNTAS_RESPUESTAS_ESTUDIANTES_INITIAL_VALUE, payload: preguntasrespuestas })
      dispatch({ type: AppAction.SIZE_PREGUNTAS, payload: count })
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
  const salvarPreguntRespuestaEstudiante = async (data: UserEstudiante, id: string, pq: PreguntasRespuestas[], respuestasCorrectas:number, sizePreguntas:number) => {
    const rutaRef = doc(db, `/usuarios/${currentUserData.dni}/${id}/${data.dni}`);
    await setDoc(rutaRef, {
      nombresApellidos: data.nombresApellidos,
      dni: data.dni,
      dniDocente: currentUserData.dni,
      respuestasCorrectas:respuestasCorrectas,
      totalPreguntas:sizePreguntas
    })
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
    salvarPreguntRespuestaEstudiante
  }
}
