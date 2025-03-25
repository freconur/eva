import { addDoc, collection, deleteDoc, doc, getDoc, getDocs, getFirestore, increment, orderBy, query, serverTimestamp, setDoc, updateDoc, where } from "firebase/firestore/lite"
import { AppAction } from "../actions/appAction"
import { useGlobalContext, useGlobalContextDispatch } from "../context/GlolbalContext"
import { Alternativa, CreaEvaluacion, Evaluaciones, Grades, PreguntasRespuestas, User, UserEstudiante } from "../types/types"




export const useAgregarEvaluaciones = () => {
  const dispatch = useGlobalContextDispatch()
  const { currentUserData } = useGlobalContext()
  const db = getFirestore()


  const getEvaluaciones = async () => {
    // let allEvaluaciones: Evaluaciones[] = []
    dispatch({ type: AppAction.LOADER_PAGES, payload: true })
    const pathRef = collection(db, "evaluaciones")
    const q = query(pathRef, where("rol", "==", 4));
    const querySnapshot = await getDocs(q)
    let allEvaluaciones: Evaluaciones[] = []
    // const q2 = query(pathRef, where("rol", "==", 1));
    // const querySnapshot2 = await getDocs(q2)
    // querySnapshot2.forEach((doc) => {
    //   allEvaluaciones.push({ ...doc.data(), id: doc.id })
    // });
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
    // const q = query(refGrados, where("grado", "==", Number(grado)), where("categoria", "==", Number(categoria)))
    const q = query(refGrados, where("grado", "==", Number(grado)), where("categoria", "==", Number(categoria)), where("rol", "==", 4))
    const q1 = query(refGrados, where("grado", "==", Number(grado)), where("categoria", "==", Number(categoria)), where("idDocente", "==", `${currentUserData.dniDirector}`))
    // const q = query(refGrados, )

    const allEvaluaciones: Evaluaciones[] = []
    await getDocs(q).then(res => {
      res.forEach(doc => {
        allEvaluaciones.push({ ...doc.data(), id: doc.id })
      })
    })
    await getDocs(q1).then(res2 => {
      res2.forEach(doc => {
        allEvaluaciones.push({ ...doc.data(), id: doc.id })
      })

    })
    dispatch({ type: AppAction.EVALUACIONES_GRADO_CATEGORIA, payload: allEvaluaciones })
    // const newPromise = new Promise<any>(async (resolve, reject) => {
    //   await getDocs(q1)
    //     .then(async (res) => {
    //       res.forEach(doc => {
    //         allEvaluaciones.push({ ...doc.data(), id: doc.id })
    //       })
    //       resolve(true)
    //     })
    // })
    // newPromise.then(async res => {
    //   if (res === true) {
    //     await getDocs(q).then(res2 => {
    //       res2.forEach(doc => {
    //         allEvaluaciones.push({ ...doc.data(), id: doc.id })
    //       })

    //     })
    //       .then(res => {

    //         setTimeout(() => {
              
    //         }, 3000)

    //       })
    //   }
    // })
  }
  const crearEvaluacion = async (value: CreaEvaluacion) => {
    dispatch({ type: AppAction.LOADER_PAGES, payload: true })

    await addDoc(collection(db, "/evaluaciones"), {
      idDocente: currentUserData.dni,
      nombre: value.nombreEvaluacion,
      grado: Number(value.grado),
      categoria: Number(value.categoria),
      rol:4
    }).then(res => dispatch({ type: AppAction.LOADER_PAGES, payload: false }))
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
      const pethRef = collection(db, `/evaluaciones/${id}/preguntasRespuestas`)
      const q = query(pethRef, orderBy("order", "asc"));
      const querySnapshot = await getDocs(q);
      const count = querySnapshot.size
      let preguntasrespuestas: PreguntasRespuestas[] = []

      const newPromise = new Promise<boolean>((resolve, reject) => {
        try {
          querySnapshot.forEach((doc) => {
            preguntasrespuestas.push({ ...doc.data(), id: doc.id })
          });
          // preguntasrespuestas.sort((a: any, b: any) => Number(a.order) - Number(b.order))
          // console.log('rta 2', preguntasrespuestas)
          // preguntasrespuestas.sort((a: any, b: any) => a.id - b.id)
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
          return preguntasrespuestas
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
      preguntaDocente: data.preguntaDocente,
      order: count + 1 //modificacion para poder ordenar las preguntas en caso se falle y no querer volver a agregarlas desde cero
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
      totalPreguntas: sizePreguntas,
      respuestas:pq
    })

    const promiseGuardarData = new Promise<boolean>((resolve, reject) => {
      try {
        pq.forEach(async (a) => {
          let rta: string = ""
          a.alternativas?.forEach(x => {
            if (x.selected === true) {
              rta = `${x.alternativa}`
              // console.log('rta', rta)
            }
          })
          const rutaRef = doc(db, `/usuarios/${currentUserData.dni}/${id}/${data.dni}/${data.dni}/${a.id}`);
          await setDoc(rutaRef, {
            pregunta: a.pregunta,
            respuesta: a.respuesta,
            respuestaEstudiante: rta.length > 0 && rta,
            preguntaDocente: a.preguntaDocente
          })
          const docRef = doc(db, `/evaluaciones/${id}/${currentUserData.dni}`, `${a.id}`);
          const querySnapshot = await getDoc(docRef);
          // const docSnap = await getDoc(docRef);
          if (!querySnapshot.exists()) {
            const dataGraficos = doc(db, `/evaluaciones/${id}/${currentUserData.dni}/${a.id}`)
            if (a.alternativas?.length === 3) {
              await setDoc(dataGraficos, {
                a: 0,
                b: 0,
                c: 0
              })
            }
            //esto es nuevo para mas alternativas
            if (a.alternativas?.length === 4) {
              await setDoc(dataGraficos, {
                a: 0,
                b: 0,
                c: 0,
                d: 0
              })
            }
          }
          const dataGraficos = doc(db, `/evaluaciones/${id}/${currentUserData.dni}/${a.order}`)
          if (a.alternativas?.length === 3) {
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
          }
          //esto es nuevo para mas alternativas
          if (a.alternativas?.length === 4) {
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
              } else if (al.selected === true && al.alternativa === "d") {
                await updateDoc(dataGraficos, {
                  d: increment(1)
                })
              }
            })
          }
        })
        resolve(true)
      } catch (error) {
        console.log('error', error)
        ////////
        pq.map(p => {
          p.alternativas?.map(a => {
            if (a.selected === true) {
              a.selected = false
            }
          })
        })
        dispatch({ type: AppAction.PREGUNTAS_RESPUESTAS_ESTUDIANTES, payload: pq })
        ///////
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
  const resetPRestudiantes = (id: string) => {
    dispatch({ type: AppAction.PREGUNTAS_RESPUESTAS_ESTUDIANTES, payload: [] })
    getPreguntasRespuestas(id)
  }

  const deleteEvaluacion = async (id: string) => {
    await deleteDoc(doc(db, "evaluaciones", `${id}`)).then(res => getEvaluaciones())
  }

  const updateEvaluacion = async (evaluacion: Evaluaciones, id: string) => {
    const pathRef = doc(db, "evaluaciones", `${id}`);
    console.log('rta', evaluacion)
    await updateDoc(pathRef, { ...evaluacion, timestamp: serverTimestamp() })
      .then(res => {
        getEvaluaciones()
        getEvaluacionesDirector()
      })
  }

  const updatePreguntaRespuesta = async (data: PreguntasRespuestas, alternativass: Alternativa[], id: string) => {
    console.log('data final', { ...data, alternativas: alternativass })
    const pathRef = doc(db, `/evaluaciones/${id}/preguntasRespuestas`, `${data.id}`)
    console.log('alternativasslengh', alternativass.length)
    console.log('3', alternativass[3])
    if (alternativass[3] === undefined) {
      await updateDoc(pathRef, {
        order: data.order,
        pregunta: data.pregunta,
        preguntaDocente: data.preguntaDocente,
        respuesta: data.respuesta,
        alternativas: [
          {
            // selected: alternativass[0].selected,
            descripcion: alternativass[0].descripcion,
            alternativa: alternativass[0].alternativa,
          },
          {
            // selected: alternativass[1].selected,
            descripcion: alternativass[1].descripcion,
            alternativa: alternativass[1].alternativa,
          },
          {
            // selected: alternativass[2].selected,
            descripcion: alternativass[2].descripcion,
            alternativa: alternativass[2].alternativa,
          }
        ]
      })
        .then(res => getPreguntasRespuestas(id))
    } else {
      await updateDoc(pathRef, {
        order: data.order,
        pregunta: data.pregunta,
        preguntaDocente: data.preguntaDocente,
        respuesta: data.respuesta,
        alternativas: [
          {
            // selected: alternativass[0].selected,
            descripcion: alternativass[0].descripcion,
            alternativa: alternativass[0].alternativa,
          },
          {
            // selected: alternativass[1].selected,
            descripcion: alternativass[1].descripcion,
            alternativa: alternativass[1].alternativa,
          },
          {
            // selected: alternativass[2].selected,
            descripcion: alternativass[2].descripcion,
            alternativa: alternativass[2].alternativa,
          },
          {
            // selected: alternativass[3].selected,
            descripcion: alternativass[3].descripcion,
            alternativa: alternativass[3].alternativa,
          }
        ]
      })
        .then(res => getPreguntasRespuestas(id))
    }
  }

  const getEvaluacionesDirector = async () => {
    const pathRef = (collection(db, "evaluaciones"))
    const q = query(pathRef, where("idDocente", "==", `${currentUserData.dni}`))
    await getDocs(q)
      .then(async (res) => {
        const arrayEvaluacionesDirector: Evaluaciones[] = []
        res.forEach((doc) => {
          arrayEvaluacionesDirector.push({ ...doc.data(), id: doc.id })
        });
        dispatch({ type: AppAction.EVALUACIONES_DIRECTOR, payload: arrayEvaluacionesDirector })
      })
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
    getEvaluacionesGradoYCategoria,
    resetPRestudiantes,
    deleteEvaluacion,
    updateEvaluacion,
    updatePreguntaRespuesta,
    getEvaluacionesDirector
  }
}
