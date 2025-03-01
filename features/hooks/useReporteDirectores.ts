import { collection, doc, getDocs, getFirestore, query, setDoc, where } from "firebase/firestore/lite"
import { DataEstadisticas, Region } from "../types/types";
import { useGlobalContext, useGlobalContextDispatch } from "../context/GlolbalContext";
import { AppAction } from "../actions/appAction";





export const useReporteDirectores = () => {
  const dispatch = useGlobalContextDispatch()
  const { currentUserData } = useGlobalContext()
  const db = getFirestore()


  const reporteDirectorData = async (idDirector: string, idEvaluacion: string) => {
    const docentesDelDirector: string[] = []
    dispatch({ type: AppAction.LOADER_REPORTE_DIRECTOR, payload: true })
    const getDocenterIdRef = query(collection(db, "usuarios"), where("dniDirector", "==", `${idDirector}`));
    //aqui debemos de validar si existe evaluaciones de los docentes de dicha evalucion
    const getDniDocentesDeDirectores = new Promise<string[]>(async (resolve, reject) => {
      try {
        await getDocs(getDocenterIdRef).then(res => {
          res.forEach(doc => {
            docentesDelDirector.push(doc.id)
          })
          resolve(docentesDelDirector)
        })
      } catch (error) {
        console.log('error', error)
        reject(error)
      }
    })

    const reporteDirectorColegio = new Promise<DataEstadisticas[]>(async (resolve, reject) => {
      let arrayAcumulativoDeRespuestas: DataEstadisticas[] = []
      try {
        await getDniDocentesDeDirectores.then(arrayDocentes => {
          arrayDocentes.forEach(async (dni) => {
            const pathRef = collection(db, `/evaluaciones/${idEvaluacion}/${dni}`)
            await getDocs(pathRef)
              .then((evaluaciones) => {
                if (evaluaciones.size > 0) {
                  if (arrayAcumulativoDeRespuestas.length === 0) {
                    const arrayOrdenadoRespuestas: DataEstadisticas[] = []
                    evaluaciones.forEach(doc => arrayOrdenadoRespuestas.push(
                      {
                        ...doc.data(),
                        id: doc.id,
                        total: Number(doc.data().a) + Number(doc.data().b) + Number(doc.data().c)
                      }))
                    console.log('array vacio agregando datos first time')
                    arrayOrdenadoRespuestas.sort((a: any, b: any) => a.id - b.id).forEach(a => arrayAcumulativoDeRespuestas.push(a))
                  } else if (arrayAcumulativoDeRespuestas.length > 0) {
                    const arrayOrdenadoRespuestas: DataEstadisticas[] = []
                    evaluaciones.forEach(doc => arrayOrdenadoRespuestas.push({
                      ...doc.data(),
                      id: doc.id,
                      total: Number(doc.data().a) + Number(doc.data().b) + Number(doc.data().c)
                    }))
                    arrayOrdenadoRespuestas?.sort((a: any, b: any) => a.id - b.id).forEach(data => {
                      arrayAcumulativoDeRespuestas?.map((rta, i) => {

                        if (rta.id === data.id) {
                          rta.a = Number(rta.a) + Number(data.a)
                          rta.b = Number(rta.b) + Number(data.b)
                          rta.c = Number(rta.c) + Number(data.c)
                          rta.total = Number(rta.total) + Number(data.total)
                        }
                      })
                    })
                  }
                }
                resolve(arrayAcumulativoDeRespuestas)
              })
          })
        })
      } catch (error) {
        console.log('error', error)
        reject(error)
      }
    })
    await reporteDirectorColegio.then(res => {
      setTimeout(() => {
        agregarDatosEstadisticosDirector(res, idEvaluacion)
        dispatch({ type: AppAction.LOADER_REPORTE_DIRECTOR, payload: false })
        dispatch({ type: AppAction.REPORTE_DIRECTOR, payload: res })

      }, 5000)



    })
    // const newPromise = new Promise<DataEstadisticas[]>((resolve, reject) => {
    //   try {
    //     docentesDelDirector?.forEach(async (resDocente: string) => {
    //       // const arrayOrdenadoRespuestas: DataEstadisticas[] = []
    //       const pathRef = collection(db, `/evaluaciones/${idEvaluacion}/${resDocente}`)
    //       const getData = await getDocs(pathRef)
    //       //aqui deberia de ordnar las preguntas que obtengo de cada peticion y darle el valor del id
    //       // console.log('resDocente', resDocente) // esto es solo el dni

    //       if (getData.empty === false) {
    //         getData.forEach((data) => {
    //           // if(getData.empty) return console.log('no hay nada')
    //           arrayOrdenadoRespuestas.push({ ...data.data(), id: data.id })
    //         })
    //         // console.log('arrayOrdenadoRespuestasd', arrayOrdenadoRespuestas)
    //         // const acumulativoDeRespuestas: DataEstadisticas = { a: Number(0), b: Number(0), c: Number(0) }

    //         if (arrayAcumulativoDeRespuestas.length === 0) {
    //           // arrayAcumulativoDeRespuestas = [...arrayOrdenadoRespuestas]
    //           console.log('deberia aparecer una sola vewz')
    //           arrayOrdenadoRespuestas.sort((a: any, b: any) => a.id - b.id).forEach(a => {
    //             arrayAcumulativoDeRespuestas.push(a)
    //           })
    //           // console.log('arrayAcumulativoDeRespuestas', arrayAcumulativoDeRespuestas)
    //           // {id= 1} {id= 2 }{id=3}                        data: 2
    //         } else if (arrayAcumulativoDeRespuestas.length > 0) {
    //           console.log('segundo nuevo')
    //           arrayOrdenadoRespuestas.sort((a: any, b: any) => a.id - b.id).forEach(data => {
    //             arrayAcumulativoDeRespuestas.map(rta => {
    //               if (rta.id === data.id) {
    //                 rta.a = Number(data.a) > 0 ? Number(rta.a) + Number(data.a) : Number(rta.a)
    //                 rta.b = Number(data.b) > 0 ? Number(rta.b) + Number(data.b) : Number(rta.b)
    //                 rta.c = Number(data.c) > 0 ? Number(rta.c) + Number(data.c) : Number(rta.c)

    //               }
    //             })
    //             // console.log('arrayAcumulativoDeRespuestas',arrayAcumulativoDeRespuestas)
    //           })
    //         }
    //       }
    //     })
    //     setTimeout(() => {
    //       resolve(arrayAcumulativoDeRespuestas)
    //     }, 10000)
    //     // dispatch({ type: AppAction.REPORTE_DIRECTOR, payload: arrayAcumulativoDeRespuestas })
    //     // console.log('arrayAcumulativoDeRespuestas', arrayAcumulativoDeRespuestas)
    //   } catch (error) {
    //     console.log('error', error)
    //     reject(false)
    //   }
    // })
    // newPromise.then(response => {
    //   // console.log('response esperando')
    //   const newPromiseDos = new Promise<DataEstadisticas[]>((resolve, reject) => {
    //     try {
    //       response.map((a, index) => {
    //         a.total = Number(a.a) + Number(a.b) + Number(a.c)
    //       })
    //       resolve(response)
    //     } catch (error) {
    //       console.log(error)
    //       reject(false)
    //     }
    //   })

    //   newPromiseDos.then(newArray => {
    //     dispatch({ type: AppAction.REPORTE_DIRECTOR, payload: newArray })
    //     dispatch({ type: AppAction.LOADER_REPORTE_DIRECTOR, payload: false })
    //     return newArray
    //   })
    //     // return response
    //     .then(res => {
    //       console.log('res promesados', res)
    //       agregarDatosEstadisticosDirector(res, idEvaluacion)
    //     })
    // })
  }

  const agregarDatosEstadisticosDirector = async (data: DataEstadisticas[], idEvaluacion: string) => {
    data.map(async pq => {
      const pathRef = doc(db, `/evaluaciones-directores/${currentUserData.dni}/${idEvaluacion}`, `${pq.id}`)
      await setDoc(pathRef, {
        id: pq.id,
        a: pq.a,
        b: pq.b,
        c: pq.c,
        total: pq.total
      })
      // .then(response => {
      //   dispatch({ type: AppAction.LOADER_REPORTE_DIRECTOR, payload: false })
      // })
    })
  }


  const reporteRegionales = async (regionValue: number, idEvaluacion: string) => {
    dispatch({ type: AppAction.LOADER_REPORTE_REGIONAL, payload: true })
    const dniDirectoreDeRegion: string[] = []

    let dataEstadisticasRegionalesAcumulativo: DataEstadisticas[] = []
    const directoreRegionRef = collection(db, 'usuarios')
    const directoreRegionQuery = query(directoreRegionRef, where("region", "==", regionValue))


    const sizesDirectores = await getDocs(directoreRegionQuery)

    if (sizesDirectores.size === 0) {
      console.log('la region no tiene data')
      dispatch({ type: AppAction.REPORTE_REGIONAL, payload: [] })
      dispatch({ type: AppAction.LOADER_REPORTE_REGIONAL, payload: false })
      // dispatch({ type: AppAction.LOADER_REPORTE_REGIONAL, payload: false })
    } else {
      const getDataRegionPromise = new Promise<string[]>(async (resolve, reject) => {
        try {
          await getDocs(directoreRegionQuery).then(res => {
            res.forEach(doc => {
              dniDirectoreDeRegion.push(doc.data().dni)
            })
            resolve(dniDirectoreDeRegion)
          })
        } catch (error) {
          console.log('error', error)
          reject(error)
        }
      })

      const reporteFinalRegional = new Promise<DataEstadisticas[]>(async (resolve, reject) => {
        try {
          await getDataRegionPromise.then(async res => {
            res.forEach(async (dni) => {
              const evaluacionesDirectorRef = collection(db, `/evaluaciones-directores/${dni}/${idEvaluacion}`)
              await getDocs(evaluacionesDirectorRef)
                .then(evaluaciones => {
                  if (evaluaciones.size > 0) {//preguntamos si la collecition tiene datos, si tiene ingresa a la condicion

                    if (dataEstadisticasRegionalesAcumulativo.length === 0) {
                      const dataEstadisticasRegionales: DataEstadisticas[] = []
                      evaluaciones.forEach(doc => dataEstadisticasRegionales.push({
                        ...doc.data(),
                        id: doc.id,
                        total: Number(doc.data().a) + Number(doc.data().b) + Number(doc.data().c)
                      }))
                      console.log('entrando cuando el array se encuentra vacio, solo ingresara una vez')
                      dataEstadisticasRegionales.sort((a: any, b: any) => a.id - b.id).forEach(a => dataEstadisticasRegionalesAcumulativo.push(a))
                      // resolve(dataEstadisticasRegionalesAcumulativo)
                    } else if (dataEstadisticasRegionalesAcumulativo.length > 0) {
                      const dataEstadisticasRegionales: DataEstadisticas[] = []
                      evaluaciones.forEach(doc => dataEstadisticasRegionales.push({
                        ...doc.data(),
                        id: doc.id,
                        total: Number(doc.data().a) + Number(doc.data().b) + Number(doc.data().c)
                      }))
                      dataEstadisticasRegionales.sort((a: any, b: any) => a.id - b.id).forEach(data => {
                        dataEstadisticasRegionalesAcumulativo.map(rta => {
                          if (rta.id === data.id) {
                            // rta.a = Number(data.a) > 0 ? Number(rta.a) + Number(data.a) : Number(rta.a)
                            // rta.b = Number(data.b) > 0 ? Number(rta.b) + Number(data.b) : Number(rta.b)
                            // rta.c = Number(data.c) > 0 ? Number(rta.c) + Number(data.c) : Number(rta.c)
                            rta.a = Number(rta.a) + Number(data.a)
                            rta.b = Number(rta.b) + Number(data.b)
                            rta.c = Number(rta.c) + Number(data.c)
                            rta.total = Number(rta.total) + Number(data.total)
                          }
                        })
                      })
                    }
                  }
                  resolve(dataEstadisticasRegionalesAcumulativo)
                })
            })
          })
        } catch (error) {
          console.log('error', error)
          reject(error)
        }
      })
      reporteFinalRegional.then(rtaFinal => {
        setTimeout(() => {
          dispatch({ type: AppAction.REPORTE_REGIONAL, payload: rtaFinal })
          dispatch({ type: AppAction.LOADER_REPORTE_REGIONAL, payload: false })
          console.log('rtafinal', rtaFinal)
        }, 5000)
      })
    }

  }


  const getRegiones = async () => {
    const regionRef = collection(db, 'region')
    const queryRegiones = await getDocs(regionRef)
    const arrayRegiones: Region[] = []
    queryRegiones.forEach((doc) => {
      arrayRegiones.push(doc.data())
    })

    dispatch({ type: AppAction.REGIONES, payload: arrayRegiones })
  }
  return {
    reporteDirectorData,
    agregarDatosEstadisticosDirector,
    getRegiones,
    reporteRegionales
  }
}