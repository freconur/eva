import React from 'react'
import { AlternativasDocente, CrearEvaluacionDocente, DataEstadisticas, PRDocentes, PreviewPRDocentes, User } from '../types/types'
import { onSnapshot, addDoc, query, where, deleteDoc, doc, collection, getDocs, getFirestore, setDoc, updateDoc, getDoc, increment, orderBy, connectFirestoreEmulator } from "firebase/firestore";
import { useGlobalContext, useGlobalContextDispatch } from '../context/GlolbalContext';
import { AppAction } from '../actions/appAction';
import { } from 'firebase/firestore/lite';

const UseEvaluacionDocentes = () => {
  const dispatch = useGlobalContextDispatch()
  const { currentUserData } = useGlobalContext()
  const db = getFirestore()
  const createEvaluacionesDocentes = async (data: CrearEvaluacionDocente) => {
    await addDoc(collection(db, "evaluaciones-docentes"), data);
  }

  const getDataEvaluacion = (idEvaluacion: string) => {
    onSnapshot(doc(db, "/evaluaciones-docentes", idEvaluacion), (doc) => {
      if (doc.exists()) {
        dispatch({ type: AppAction.DATA_EVALUACION_DOCENTE, payload: doc.data() })
      }
    });
    onSnapshot(collection(db, "/evaluaciones-docentes"), (querySnapshot) => {
      const arrayEvaluaciones: CrearEvaluacionDocente[] = [];
      querySnapshot.forEach((doc) => {
        arrayEvaluaciones.push({ ...doc.data(), id: doc.id });
      });
      dispatch({ type: AppAction.EVALUACIONES_DOCENTES, payload: arrayEvaluaciones })
    });
  }
  const getEvaluacionesDocentes = () => {
    dispatch({ type: AppAction.LOADER_PAGES, payload: true })
    onSnapshot(collection(db, "/evaluaciones-docentes"), (querySnapshot) => {
      const arrayEvaluaciones: CrearEvaluacionDocente[] = [];
      querySnapshot.forEach((doc) => {
        console.log(doc.data())
        arrayEvaluaciones.push({ ...doc.data(), id: doc.id });
      });
      dispatch({ type: AppAction.EVALUACIONES_DOCENTES, payload: arrayEvaluaciones })
      dispatch({ type: AppAction.LOADER_PAGES, payload: false })
    });
  }

  const deleteEvaluacionDocentes = async (id: string) => {
    await deleteDoc(doc(db, "evaluaciones-docentes", id));
  }
  const addPreguntasEvaluacionDocente = async (data: PreviewPRDocentes, idEvaluacion: string) => {
    dispatch({ type: AppAction.LOADER_MODALES, payload: true })
    const path = `/evaluaciones-docentes/${idEvaluacion}/preguntasRespuestas`
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

  const getPreguntasRespuestasDocentes = async (idEvaluacion: string) => {
    dispatch({ type: AppAction.LOADER_PAGES, payload: true })
    const path = `/evaluaciones-docentes/${idEvaluacion}/preguntasRespuestas`
    onSnapshot(collection(db, path), (querySnapshot) => {
      const arrayPreguntaRespuestaDocentes: PreviewPRDocentes[] = []
      querySnapshot.forEach((doc) => {
        arrayPreguntaRespuestaDocentes.push({ ...doc.data(), id: doc.id });
      });
      dispatch({ type: AppAction.GET_PREGUNTA_RESPUESTA_DOCENTE, payload: arrayPreguntaRespuestaDocentes })
      dispatch({ type: AppAction.LOADER_PAGES, payload: false })
    });
  }

  const updatePreResDocentes = async (data: PRDocentes, idEvaluacion: string) => {
    const path = `/evaluaciones-docentes/${idEvaluacion}/preguntasRespuestas`
    const pathRef = doc(db, path, `${data.id}`);
    await updateDoc(pathRef, data);
  }

  const buscarDocente = async (dni: string) => {
    dispatch({ type: AppAction.WARNING_DATA_DOCENTE, payload: "" })
    const docRef = doc(db, "usuarios", `${dni}`);
    const docSnap = await getDoc(docRef);

    if (docSnap.exists()) {
      if (docSnap.data().dniDirector === currentUserData.dni) {
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
  const buscarDocenteReporteDeEvaluacion = async (idEvaluacion: string, idDocente: string) => {
    `/usuarios/49163626/KtOATuI2gOKH80n1R6yt/88490965`
    if (idEvaluacion.length > 0 && idDocente.length > 0) {
      console.log('cumplimos condicion')
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
  const resetDocente = () => {
    dispatch({ type: AppAction.DATA_DOCENTE, payload: {} })
  }
  const guardarEvaluacionDocente = async (idEvaluacion: string, data: PRDocentes[], dataDocente: User) => {
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

    const path = `/usuarios/${currentUserData.dni}/${idEvaluacion}/`
    await setDoc(doc(db, path, `${dataDocente.dni}`), { observacion: "sin observaciones", resultados: data, dni: dataDocente.dni, dniDirector: currentUserData.dni, calificacion: totalPuntos, info: dataDocente });
    //AGREGANDO RESULTADOS DE LA EVALUACION DEL DOCENTE

    data.forEach(async (pr) => {
      `/evaluaciones-docentes/KtOATuI2gOKH80n1R6yt/49163626/id`
      const docRef = doc(db, `/evaluaciones-docentes/${idEvaluacion}/${currentUserData.dni}`, `${pr.order}`);
      await getDoc(docRef)
        .then(async (response) => {
          if (!response.exists()) {
            const docPathRef = doc(db, `/evaluaciones-docentes/${idEvaluacion}/${currentUserData.dni}/${pr.order}`);
            await setDoc(docPathRef, {
              a: 0,
              b: 0,
              c: 0,
              d: 0
            })
          }
        })
        .then(res => {
          const docPathRef = doc(db, `/evaluaciones-docentes/${idEvaluacion}/${currentUserData.dni}/${pr.order}`);
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
    })
  }
  const reporteEvaluacionDocenteAdmin = (idEvaluacion: string, dniDirector: string) => {
    dispatch({ type: AppAction.LOADER_PAGES, payload: true })
    buscarDirector(dniDirector)
    const path = `/evaluaciones-docentes/${idEvaluacion}/${dniDirector}/`
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


  const agregarObservacionDocente = async (idEvaluacion: string, idDocente: string, valueObservacion: string) => {
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
    dispatch({ type: AppAction.LOADER_PAGES, payload: true })
    const usuariosUgel = collection(db, "usuarios");

    // Create a query against the collection.
    const q = query(usuariosUgel, where("region", "==", Number(ugel)), where("rol", "==", 2));
    const arrayDirectoresUgel: string[] = []
    const getDirectoresPromise = new Promise<string[]>(async (resolve, reject) => {
      let index = 0
      try {
        await getDocs(q)
          .then(directores => {
            // console.log('drec', directores)
            // console.log('index directores', index)
            // console.log('directores size', directores.size)
            directores.forEach(doc => {
              index = index + 1
              arrayDirectoresUgel.push(doc.data().dni)
              if (index === directores.size) {
                resolve(arrayDirectoresUgel)
              }
            })
          })
      } catch (error) {
        reject()
      }
    })

    getDirectoresPromise.then(res => {
      const getDataEvaluacion = new Promise<DataEstadisticas[]>((resolve, reject) => {
        let arrayAcumulativoDeRespuestas: DataEstadisticas[] = [];
        try {
          let index = 0
          res.forEach(async (director) => {
            index = index + 1
            const path = `/evaluaciones-docentes/${idEvaluacion}/${director}`
            const pathRef = collection(db, path)
            await getDocs(pathRef)
              .then(async (resultadoDirector) => {
                if (resultadoDirector.size > 0) {
                  if (arrayAcumulativoDeRespuestas.length === 0) {
                    const arrayOrdenadoRespuestas: DataEstadisticas[] = [];
                    resultadoDirector.forEach((doc) => {
                      arrayOrdenadoRespuestas.push({
                        ...doc.data(),
                        id: doc.id,
                        total:
                          doc.data().d === undefined
                            ? Number(doc.data().a) +
                            Number(doc.data().b) +
                            Number(doc.data().c)
                            : Number(doc.data().a) +
                            Number(doc.data().b) +
                            Number(doc.data().c) +
                            Number(doc.data().d),
                      })
                    }
                    );
                    arrayOrdenadoRespuestas
                      .sort((a: any, b: any) => a.id - b.id)
                      .forEach((a) => arrayAcumulativoDeRespuestas.push(a));
                  } else {
                    const arrayOrdenadoRespuestas: DataEstadisticas[] = [];
                    resultadoDirector.forEach((doc) =>
                      arrayOrdenadoRespuestas.push({
                        ...doc.data(),
                        id: doc.id,
                        total:
                          doc.data().d === undefined
                            ? Number(doc.data().a) +
                            Number(doc.data().b) +
                            Number(doc.data().c)
                            : Number(doc.data().a) +
                            Number(doc.data().b) +
                            Number(doc.data().c) +
                            Number(doc.data().d),
                      })
                    );
                    arrayOrdenadoRespuestas
                      ?.sort((a: any, b: any) => a.id - b.id)
                      .forEach((data) => {
                        arrayAcumulativoDeRespuestas?.map((rta, i) => {
                          if (rta.d === undefined) {
                            if (rta.id === data.id) {
                              rta.a = Number(rta.a) + Number(data.a);
                              rta.b = Number(rta.b) + Number(data.b);
                              rta.c = Number(rta.c) + Number(data.c);
                              rta.total =
                                Number(rta.total) + Number(data.total);
                            }
                          } else {
                            if (rta.id === data.id) {
                              rta.a = Number(rta.a) + Number(data.a);
                              rta.b = Number(rta.b) + Number(data.b);
                              rta.c = Number(rta.c) + Number(data.c);
                              rta.d = Number(rta.d) + Number(data.d);
                              rta.total =
                                Number(rta.total) + Number(data.total);
                            }
                          }
                        });
                      });
                  }
                }
              })
            if (res.length === index) {
              // debugger
              setTimeout(() => {
                resolve(arrayAcumulativoDeRespuestas)
              }, 5000)
            }
          })
          // getDirectoresPromise.then(async (directores) => {
          //   let index = 0
          //   directores.forEach(async director => {
          //     index = index + 1
          //     console.log('rta', director === '49163626' && 'este es el dni 49163626')
          //     const path = `/evaluaciones-docentes/${idEvaluacion}/${director}`
          //     const pathRef = collection(db, path)
          //     await getDocs(pathRef)
          //       .then(async (resultadoDirector) => {
          //         if (resultadoDirector.size > 0) {
          //           console.log('si soy del 49163626')
          //           if (arrayAcumulativoDeRespuestas.length === 0) {
          //             const arrayOrdenadoRespuestas: DataEstadisticas[] = [];
          //             resultadoDirector.forEach((doc) => {
          //               arrayOrdenadoRespuestas.push({
          //                 ...doc.data(),
          //                 id: doc.id,
          //                 total:
          //                   doc.data().d === undefined
          //                     ? Number(doc.data().a) +
          //                     Number(doc.data().b) +
          //                     Number(doc.data().c)
          //                     : Number(doc.data().a) +
          //                     Number(doc.data().b) +
          //                     Number(doc.data().c) +
          //                     Number(doc.data().d),
          //               })
          //             }
          //             );
          //             arrayOrdenadoRespuestas
          //               .sort((a: any, b: any) => a.id - b.id)
          //               .forEach((a) => arrayAcumulativoDeRespuestas.push(a));
          //           } else {
          //             const arrayOrdenadoRespuestas: DataEstadisticas[] = [];
          //             resultadoDirector.forEach((doc) =>
          //               arrayOrdenadoRespuestas.push({
          //                 ...doc.data(),
          //                 id: doc.id,
          //                 total:
          //                   doc.data().d === undefined
          //                     ? Number(doc.data().a) +
          //                     Number(doc.data().b) +
          //                     Number(doc.data().c)
          //                     : Number(doc.data().a) +
          //                     Number(doc.data().b) +
          //                     Number(doc.data().c) +
          //                     Number(doc.data().d),
          //               })
          //             );
          //             arrayOrdenadoRespuestas
          //               ?.sort((a: any, b: any) => a.id - b.id)
          //               .forEach((data) => {
          //                 arrayAcumulativoDeRespuestas?.map((rta, i) => {
          //                   if (rta.d === undefined) {
          //                     if (rta.id === data.id) {
          //                       rta.a = Number(rta.a) + Number(data.a);
          //                       rta.b = Number(rta.b) + Number(data.b);
          //                       rta.c = Number(rta.c) + Number(data.c);
          //                       rta.total =
          //                         Number(rta.total) + Number(data.total);
          //                     }
          //                   } else {
          //                     if (rta.id === data.id) {
          //                       rta.a = Number(rta.a) + Number(data.a);
          //                       rta.b = Number(rta.b) + Number(data.b);
          //                       rta.c = Number(rta.c) + Number(data.c);
          //                       rta.d = Number(rta.d) + Number(data.d);
          //                       rta.total =
          //                         Number(rta.total) + Number(data.total);
          //                     }
          //                   }
          //                 });
          //               });
          //           }
          //         } 
          //         // else {
          //         //   //este es la condicional del resultadoDirector.size
          //         //   //retornamos los resultados indicando que no se encontraron resultados para dicha ugel
          //         //   dispatch({
          //         //     type: AppAction.LOADER_REPORTE_DIRECTOR,
          //         //     payload: false,
          //         //   });
          //         // }
          //       })
          //     })
          //     if(directores.length === index) {
          //       // debugger
          //       resolve(arrayAcumulativoDeRespuestas)
          //   }
          // })

        } catch (error) {
          reject()
        }
      })

      getDataEvaluacion.then(data => {
        if (data.length === totalPreguntas) {
          console.log('data', data)
          dispatch({ type: AppAction.REPORTE_REGIONAL, payload: data })
          dispatch({ type: AppAction.LOADER_PAGES, payload: false })
        }
      })
    })

  }

  return {
    createEvaluacionesDocentes,
    getEvaluacionesDocentes,
    deleteEvaluacionDocentes,
    addPreguntasEvaluacionDocente,
    getPreguntasRespuestasDocentes,
    updatePreResDocentes,
    buscarDocente,
    guardarEvaluacionDocente,
    reporteEvaluacionDocentes,
    getPRDocentes,
    getDataEvaluacion,
    resetDocente,
    agregarObservacionDocente,
    buscarDocenteReporteDeEvaluacion,
    buscarDirector,
    reporteEvaluacionDocenteAdmin,
    reporteUgelGlobal
  }

}

export default UseEvaluacionDocentes