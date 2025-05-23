import React from 'react'
import { AlternativasDocente, CrearEvaluacionDocente, DataEstadisticas, DataEstadisticasDocente, PRDocentes, PreviewPRDocentes, User } from '../types/types'
import { onSnapshot, addDoc, query, where, deleteDoc, doc, collection, getDocs, getFirestore, setDoc, updateDoc, getDoc, increment, orderBy, connectFirestoreEmulator } from "firebase/firestore";
import { useGlobalContext, useGlobalContextDispatch } from '../context/GlolbalContext';
import { AppAction } from '../actions/appAction';
import { } from 'firebase/firestore/lite';
import { useRouter } from 'next/router';
import { currentMonth, currentYear } from '@/fuctions/dates';

const UseEvaluacionDirectores = () => {
  const router = useRouter()
  const dispatch = useGlobalContextDispatch()
  const { currentUserData } = useGlobalContext()
  const db = getFirestore()
  const createEvaluacionesDirectores = async (data: CrearEvaluacionDocente) => {
    await addDoc(collection(db, "evaluaciones-director"), data);
  }

  const getDataEvaluacion = (idEvaluacion: string) => {
    onSnapshot(doc(db, "/evaluaciones-director", idEvaluacion), (doc) => {
      if (doc.exists()) {
        dispatch({ type: AppAction.DATA_EVALUACION_DOCENTE, payload: doc.data() })
      }
    });
    onSnapshot(collection(db, "/evaluaciones-director"), (querySnapshot) => {
      const arrayEvaluaciones: CrearEvaluacionDocente[] = [];
      querySnapshot.forEach((doc) => {
        arrayEvaluaciones.push({ ...doc.data(), id: doc.id });
      });
      dispatch({ type: AppAction.EVALUACIONES_DOCENTES, payload: arrayEvaluaciones })
    });
  }
  const getEvaluacionesDirectores = () => {
    dispatch({ type: AppAction.LOADER_PAGES, payload: true })
    onSnapshot(collection(db, "/evaluaciones-director"), (querySnapshot) => {
      const arrayEvaluaciones: CrearEvaluacionDocente[] = [];
      querySnapshot.forEach((doc) => {
        console.log(doc.data())
        arrayEvaluaciones.push({ ...doc.data(), id: doc.id });
      });
      dispatch({ type: AppAction.EVALUACIONES_DOCENTES, payload: arrayEvaluaciones })
      dispatch({ type: AppAction.LOADER_PAGES, payload: false })
    });
  }

  const deleteEvaluacionDirectores = async (id: string) => {
    await deleteDoc(doc(db, "evaluaciones-director", id));
  }
  const deleteEvaluacionDirectorCurricular = async (id: string) => {
    await deleteDoc(doc(db, "/evaluacion-curricular", id));
  }
  const addPreguntasEvaluacionDirectores = async (data: PreviewPRDocentes, idEvaluacion: string) => {
    dispatch({ type: AppAction.LOADER_MODALES, payload: true })
    const path = `/evaluaciones-director/${idEvaluacion}/preguntasRespuestas`
    const pathRef = collection(db, path)
    await getDocs(pathRef)
      .then(async (response) => {
        const arrayAlternativa: AlternativasDocente[] = []
        for (const [key, value] of Object.entries(data)) {
          if (key === 'a') { arrayAlternativa.push({ value: 1, descripcion: value, alternativa: "a" }) }
          if (key === 'b') { arrayAlternativa.push({ value: 2, descripcion: value, alternativa: "b" }) }
          if (key === 'c') { arrayAlternativa.push({ value: 3, descripcion: value, alternativa: "c" }) }
          if (key === 'd') { arrayAlternativa.push({ value: 4, descripcion: value, alternativa: "d" }) }
        }
        await setDoc(doc(db, path, `${response.size + 1}`), { alternativas: arrayAlternativa, id: `${response.size + 1}`, criterio: data.criterio, order: response.size + 1 })
          .then(rta => {
            dispatch({ type: AppAction.LOADER_MODALES, payload: false })
          })
      })
  }

  const getPreguntasRespuestasDirectores = async (idEvaluacion: string) => {
    dispatch({ type: AppAction.LOADER_PAGES, payload: true })
    const path = `/evaluaciones-director/${idEvaluacion}/preguntasRespuestas`
    onSnapshot(collection(db, path), (querySnapshot) => {
      const arrayPreguntaRespuestaDocentes: PreviewPRDocentes[] = []
      querySnapshot.forEach((doc) => {
        arrayPreguntaRespuestaDocentes.push({ ...doc.data(), id: doc.id });
      });
      dispatch({ type: AppAction.GET_PREGUNTA_RESPUESTA_DOCENTE, payload: arrayPreguntaRespuestaDocentes })
      dispatch({ type: AppAction.LOADER_PAGES, payload: false })
    });
  }

  const updatePreResDirectores = async (data: PRDocentes, idEvaluacion: string) => {
    const path = `/evaluaciones-director/${idEvaluacion}/preguntasRespuestas`
    const pathRef = doc(db, path, `${data.id}`);
    await updateDoc(pathRef, data);
  }

  const buscarDocente = async (dni: string) => {
    dispatch({ type: AppAction.WARNING_DATA_DOCENTE, payload: "" })
    const docRef = doc(db, "usuarios", `${dni}`);
    const docSnap = await getDoc(docRef);

    if (docSnap.exists()) {
      if (docSnap.data().rol === 2) {
        console.log('pertenece a la institucion')
        dispatch({ type: AppAction.DATA_DOCENTE, payload: docSnap.data() })
      } else {
        dispatch({ type: AppAction.DATA_DOCENTE, payload: {} })
        dispatch({ type: AppAction.WARNING_DATA_DOCENTE, payload: "no se encontro docente con el numero de dni" })
      }
    } else {
      dispatch({ type: AppAction.DATA_DOCENTE, payload: {} })
      dispatch({ type: AppAction.WARNING_DATA_DOCENTE, payload: "no se encontro docente con el numero de dni" })
    }
  }

  const buscarDirector = async (dni: string) => {
    dispatch({ type: AppAction.WARNING_DATA_DOCENTE, payload: "" })
    const docRef = doc(db, "usuarios", `${dni}`);
    const docSnap = await getDoc(docRef);

    if (docSnap.exists()) {
      if (docSnap.data().rol === 2) {
        console.log('es un director')
        dispatch({ type: AppAction.DATA_DIRECTOR, payload: docSnap.data() })
      } else {
        dispatch({ type: AppAction.DATA_DIRECTOR, payload: {} })
        dispatch({ type: AppAction.WARNING_DATA_DOCENTE, payload: "no se encontro director" })
      }
    } else {
      dispatch({ type: AppAction.DATA_DIRECTOR, payload: {} })
      dispatch({ type: AppAction.WARNING_DATA_DOCENTE, payload: "no se encontro director" })
    }
  }
  const buscarDirectorReporteDeEvaluacion = async (idEvaluacion: string, idDocente: string) => {
    // `/usuarios/49163626/KtOATuI2gOKH80n1R6yt/88490965`
    console.log('currentUserData?.dni', currentUserData?.dni)
    if (idEvaluacion.length > 0 && idDocente.length > 0) {
      const path = doc(db, `/usuarios/${currentUserData?.dni}/${idEvaluacion}`, idDocente)
      // const docRef = doc(db, path, `${idDocente}`);
      await getDoc(path)
        .then(response => {
          if (response.exists()) {
            console.log('response.data()', response.data())
            dispatch({ type: AppAction.REPORTE_INDIVIDUAL_DOCENTE, payload: response.data() })
          }
        })
    }
  }
  const resetDirector = () => {
    dispatch({ type: AppAction.DATA_DIRECTOR, payload: {} })
  }
  const resetDocente = () => {
    dispatch({ type: AppAction.DATA_DOCENTE, payload: {} })
  }
  const guardarEvaluacionDirector = async (idEvaluacion: string, data: PRDocentes[], dataDocente: User) => {
    //AGREGANDO RESULTADOS DE LA EVALUACION DEL DOCENTE
    `/usuarios/80039014/7pf6AVgNVNDkoRB4RPYX/11001902`
    dispatch({ type: AppAction.LOADER_SALVAR_PREGUNTA, payload: true })

    let totalPuntos = 0
    if (data) {
      data.map(pr => {
        pr?.alternativas?.map(p => {
          if (p.selected === true) {
            if (p.value) {
              totalPuntos = totalPuntos + p.value
            }
          }
        })
      })
    }

    const path = `/reporte-directores/${idEvaluacion}/${currentYear}-${currentMonth}/`
    await setDoc(doc(db, path, `${dataDocente.dni}`), { observacionesMonitoreo: {}, resultados: data, dni: dataDocente.dni, dniDirector: currentUserData.dni, calificacion: totalPuntos, info: dataDocente })
    .then(() => {
      dispatch({ type: AppAction.LOADER_SALVAR_PREGUNTA, payload: false })
      router.push(`/especialistas/evaluaciones-director/evaluacion/reporte-director-individual?idDirector=${dataDocente.dni}&idEvaluacion=${idEvaluacion}`)
    })
    //AGREGANDO RESULTADOS DE LA EVALUACION DEL DOCENTE

    /* data.forEach(async (pr) => {
      `/evaluaciones-docentes/KtOATuI2gOKH80n1R6yt/49163626/id`
      const docRef = doc(db, `/evaluaciones-director/${idEvaluacion}/${currentUserData.dni}`, `${pr.order}`);
      await getDoc(docRef)
        .then(async (response) => {
          if (!response.exists()) {
            const docPathRef = doc(db, `/evaluaciones-director/${idEvaluacion}/${currentUserData.dni}/${pr.order}`);
            await setDoc(docPathRef, {
              a: 0,
              b: 0,
              c: 0,
              d: 0
            })
          }
        })
        .then(res => {
          const docPathRef = doc(db, `/evaluaciones-director/${idEvaluacion}/${currentUserData.dni}/${pr.order}`);
          if (pr.alternativas?.length === 4) {
            pr.alternativas?.map(async al => {
              if (al.selected === true && al.alternativa === "a") {
                await updateDoc(docPathRef, {
                  a: increment(1)
                })
              } else if (al.selected === true && al.alternativa === "b") {
                await updateDoc(docPathRef, {
                  b: increment(1)
                })
              } else if (al.selected === true && al.alternativa === "c") {
                await updateDoc(docPathRef, {
                  c: increment(1)
                })
              } else if (al.selected === true && al.alternativa === "d") {
                await updateDoc(docPathRef, {
                  d: increment(1)
                })
              }
            })
          }
        })
        .then(response => dispatch({ type: AppAction.LOADER_SALVAR_PREGUNTA, payload: false }))
    }) */
  }
  const reporteEvaluacionDocenteAdmin = (idEvaluacion: string, dniDirector: string) => {
    dispatch({ type: AppAction.LOADER_PAGES, payload: true })
    buscarDirector(dniDirector)
    const path = `/evaluaciones-director/${idEvaluacion}/${dniDirector}/`
    const refData = collection(db, path)
    const arrayDataEstadisticas: DataEstadisticas[] = []

    const newPromise = new Promise<DataEstadisticas[]>(async (resolve, reject) => {
      try {
        await getDocs(refData)
          .then(response => {
            let index = 0
            response.forEach((doc) => {
              index = index + 1
              console.log('index', index)
              console.log('response.size', response.size)
              // doc.data() is never undefined for query doc snapshots
              arrayDataEstadisticas.push({
                ...doc.data(),
                id: doc.id,
                total: doc.data().d === undefined ? Number(doc.data().a) + Number(doc.data().b) + Number(doc.data().c) : Number(doc.data().a) + Number(doc.data().b) + Number(doc.data().c) + Number(doc.data().d)
              })
            })
            if (response.size === index) {
              arrayDataEstadisticas.sort((a: any, b: any) => a.id - b.id)
              resolve(arrayDataEstadisticas)
            }
          })
      } catch (error) {
        console.log('error', error)
        reject()
      }
    })
    newPromise.then(res => {
      dispatch({ type: AppAction.DATA_ESTADISTICAS, payload: arrayDataEstadisticas })
      dispatch({ type: AppAction.LOADER_PAGES, payload: false })
    }
    )
  }
  const reporteEvaluacionDocentes = (idEvaluacion: string) => {
    const path = `/evaluaciones-docentes/${idEvaluacion}/${currentUserData.dni}/`
    const refData = collection(db, path)
    const arrayDataEstadisticas: DataEstadisticas[] = []

    const newPromise = new Promise<DataEstadisticas[]>(async (resolve, reject) => {
      try {
        await getDocs(refData)
          .then(response => {
            let index = 0
            response.forEach((doc) => {
              index = index + 1
              console.log('index', index)
              console.log('response.size', response.size)
              // doc.data() is never undefined for query doc snapshots
              arrayDataEstadisticas.push({
                ...doc.data(),
                id: doc.id,
                total: doc.data().d === undefined ? Number(doc.data().a) + Number(doc.data().b) + Number(doc.data().c) : Number(doc.data().a) + Number(doc.data().b) + Number(doc.data().c) + Number(doc.data().d)
              })
            })
            if (response.size === index) {
              arrayDataEstadisticas.sort((a: any, b: any) => a.id - b.id)
              resolve(arrayDataEstadisticas)
            }
          })
      } catch (error) {
        console.log('error', error)
        reject()
      }
    })
    newPromise.then(res => dispatch({ type: AppAction.DATA_ESTADISTICAS, payload: arrayDataEstadisticas }))
  }
  //esta funcion no se esta usando por lo que se esta condiderando borrarlo, ademas tienes unos pequeños fallos, moerarlo.
  const getPRDocentes = async (idEvaluacion: string) => {
    console.log('rta', idEvaluacion)
    const pethRef = collection(db, `/evaluaciones-docentes/${idEvaluacion}/preguntasRespuestas`)
    const q = query(pethRef, orderBy("order", "asc"));

    const newPromise = new Promise<AlternativasDocente[]>(async (resolve, reject) => {
      try {
        let index = 0
        await getDocs(q)
          .then(response => {
            index = index + 1
            let preguntasrespuestas: AlternativasDocente[] = []
            response.forEach((doc) => {
              preguntasrespuestas.push({ ...doc.data(), id: doc.id })
              if (index === response.size) {
                resolve(preguntasrespuestas)
              }
            });
          })
      } catch (error) {
        console.log('error', error)
        reject()
      }
    })
    newPromise.then(res => {
      dispatch({ type: AppAction.PREGUNTAS_RESPUESTAS, payload: res })
      dispatch({ type: AppAction.LOADER_PAGES, payload: false })
    })


  }
  //esta funcion no se esta usando por lo que se esta condiderando borrarlo, ademas tienes unos pequeños fallos, moerarlo.


  const agregarObservacionDirector = async (idEvaluacion: string, idDocente: string, valueObservacion: string) => {
    // `/usuarios/49163626/KtOATuI2gOKH80n1R6yt/88490965`
    dispatch({ type: AppAction.LOADER_SALVAR_PREGUNTA, payload: false })
    console.log('datos:', idEvaluacion, idDocente, valueObservacion)
    const path = `/usuarios/${currentUserData.dni}/${idEvaluacion}`
    const pathRef = doc(db, path, `${idDocente}`)
    await updateDoc(pathRef, {
      observacion: valueObservacion
    })
    dispatch({ type: AppAction.LOADER_SALVAR_PREGUNTA, payload: false })
  }

  const reporteUgelGlobal = async (ugel: number, idEvaluacion: string, totalPreguntas: number) => {
    console.log('etrnamos')
    dispatch({ type: AppAction.REPORTE_REGIONAL, payload: [] })
    dispatch({ type: AppAction.LOADER_PAGES, payload: true })
    const usuariosUgel = collection(db, "usuarios");

    // Create a query against the collection.
    const q = query(usuariosUgel, where("region", "==", Number(ugel)), where("rol", "==", 1));
    const arrayDirectoresUgel: string[] = []
    const getDirectoresPromise = new Promise<string[]>(async (resolve, reject) => {
      let index = 0
      try {
        await getDocs(q)
          .then(directores => {
            if (directores.size === 0) {
              dispatch({ type: AppAction.REPORTE_REGIONAL, payload: [] })
              dispatch({ type: AppAction.LOADER_PAGES, payload: false })
            } else {
              directores.forEach(doc => {
                index = index + 1
                arrayDirectoresUgel.push(doc.data().dni)
                if (index === directores.size) {
                  resolve(arrayDirectoresUgel)
                }
              })
            }
          })
      } catch (error) {
        reject()
      }
    })
    getDirectoresPromise.then(directores => {
      const testPromise = directores.map(async (director) => {
        const path = `/evaluaciones-director/${idEvaluacion}/${director}`
        const pathRef = collection(db, path)
        return new Promise(async (resolve: any) => {
          await getDocs(pathRef).then(rta => {
            const arrayOrdenadoRespuestas: any = [];
            rta.forEach(doc => {
              arrayOrdenadoRespuestas.push({ ...doc.data(), id: doc.id })
            })
            resolve(arrayOrdenadoRespuestas)
          })
        })
      })
      const respuestasDirectores: any = Promise.allSettled(testPromise)
      respuestasDirectores.then((response: DataEstadisticasDocente[]) => {
        let arrayAcumulativoDeRespuestas: DataEstadisticasDocente[] = [];
        let index = 0
        response.forEach((resultado: any) => {
          index = index + 1
          if (resultado.value.length > 0) {
            console.log('entro')
            if (arrayAcumulativoDeRespuestas.length === 0) {
              const arrayOrdenadoRespuesta: DataEstadisticasDocente[] = [];
              resultado.value.forEach((a: DataEstadisticasDocente) => {
                arrayOrdenadoRespuesta.push({
                  ...a,
                  total: a.a + a.b + a.c + a.d
                })
              })
              arrayOrdenadoRespuesta
                .sort((a: any, b: any) => a.id - b.id)
                .forEach((a) => arrayAcumulativoDeRespuestas.push(a));
            } else {
              const arrayOrdenadoRespuestas: DataEstadisticasDocente[] = [];
              resultado.value.forEach((a: any) => {
                arrayOrdenadoRespuestas.push({
                  ...a,
                  total: a.a + a.b + a.c + a.d
                })
              })
              arrayOrdenadoRespuestas
                ?.sort((a: any, b: any) => a.id - b.id)
                .forEach((data) => {
                  arrayAcumulativoDeRespuestas?.forEach((rta, i) => {
                    if (rta.id === data.id) {
                      rta.a = Number(rta.a) + Number(data.a);
                      rta.b = Number(rta.b) + Number(data.b);
                      rta.c = Number(rta.c) + Number(data.c);
                      rta.d = Number(rta.d) + Number(data.d);
                      rta.total = Number(rta.total) + Number(data.total);
                    }
                  });
                });
            }
          }
          if (index === response.length) {
            dispatch({ type: AppAction.REPORTE_REGIONAL, payload: arrayAcumulativoDeRespuestas })
            dispatch({ type: AppAction.LOADER_PAGES, payload: false })
          }
        })
      })
    })
  }

  return {
    createEvaluacionesDirectores,
    getEvaluacionesDirectores,
    deleteEvaluacionDirectores,
    addPreguntasEvaluacionDirectores,
    getPreguntasRespuestasDirectores,
    updatePreResDirectores,
    buscarDocente,
    guardarEvaluacionDirector,
    reporteEvaluacionDocentes,
    getPRDocentes,
    getDataEvaluacion,
    resetDocente,
    agregarObservacionDirector,
    buscarDirectorReporteDeEvaluacion,
    buscarDirector,
    reporteEvaluacionDocenteAdmin,
    reporteUgelGlobal,
    resetDirector,
    deleteEvaluacionDirectorCurricular
  }

}

export default UseEvaluacionDirectores