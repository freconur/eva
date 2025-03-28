import {
  collection,
  doc,
  getDocs,
  getFirestore,
  query,
  setDoc,
  where,
} from "firebase/firestore/lite";
import { DataEstadisticas, Region } from "../types/types";
import {
  useGlobalContext,
  useGlobalContextDispatch,
} from "../context/GlolbalContext";
import { AppAction } from "../actions/appAction";

export const useReporteDirectores = () => {
  const dispatch = useGlobalContextDispatch();
  const { currentUserData } = useGlobalContext();
  const db = getFirestore();

  const reporteDirectorData = async (
    idDirector: string,
    idEvaluacion: string
  ) => {
    const docentesDelDirector: string[] = [];
    dispatch({ type: AppAction.LOADER_REPORTE_DIRECTOR, payload: true });
    const getDocenterIdRef = query(
      collection(db, "usuarios"),
      where("dniDirector", "==", `${idDirector}`)
    );
    //aqui debemos de validar si existe evaluaciones de los docentes de dicha evalucion
    const getDniDocentesDeDirectores = new Promise<string[]>(
      async (resolve, reject) => {
        try {
          await getDocs(getDocenterIdRef).then((res) => {
            if (res.size === 0) {
              //obtengo todos los dni de los docentes que estan acargo del director si no tiene no devuelve resultados
              console.log("res.size", res.size);
              dispatch({
                type: AppAction.LOADER_REPORTE_DIRECTOR,
                payload: false,
              });
              reject();
            } else {
              res.forEach((doc) => {
                //obtengo todos los dni de los docentes que estan acargo del director
                docentesDelDirector.push(doc.id);
              });
              resolve(docentesDelDirector);
            }
          });
        } catch (error) {
          console.log("error", error);
          reject(error);
        }
      }
    );
    //con esta promesa una vez tenga los dni de todo los docentes comienzo hacer get del acumulativo del examen hecho por el profesor
    const reporteDirectorColegio = new Promise<DataEstadisticas[]>(
      async (resolve, reject) => {
        let arrayAcumulativoDeRespuestas: DataEstadisticas[] = [];
        try {
          await getDniDocentesDeDirectores.then((arrayDocentes) => {
            arrayDocentes.forEach(async (dni, index) => {
              const pathRef = collection(
                db,
                `/evaluaciones/${idEvaluacion}/${dni}`
              );
              await getDocs(pathRef).then((evaluaciones) => {
                if (evaluaciones.size > 0) {
                  if (arrayAcumulativoDeRespuestas.length === 0) {
                    const arrayOrdenadoRespuestas: DataEstadisticas[] = [];
                    evaluaciones.forEach((doc) =>
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
                    console.log("array vacio agregando datos first time");
                    arrayOrdenadoRespuestas
                      .sort((a: any, b: any) => a.id - b.id)
                      .forEach((a) => arrayAcumulativoDeRespuestas.push(a));
                  } else if (arrayAcumulativoDeRespuestas.length > 0) {
                    const arrayOrdenadoRespuestas: DataEstadisticas[] = [];
                    evaluaciones.forEach((doc) =>
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
                    // if(doc.data().d === undefined)
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
                } else {
                  dispatch({
                    type: AppAction.LOADER_REPORTE_DIRECTOR,
                    payload: false,
                  });
                }
                if (arrayDocentes.length === index + 1) {
                  resolve(arrayAcumulativoDeRespuestas);
                }
              });
            });
          });
        } catch (error) {
          console.log("error", error);
          reject(error);
        }
      }
    );
    reporteDirectorColegio.then((res) => {
      console.log("llegamos al final antes del setime");
      agregarDatosEstadisticosDirector(res, idEvaluacion);

      setTimeout(() => {
        //eszta funcion es la que genera el acumulado en la collection de evaluaciones-directores
      }, 5000);
    });
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
  };

  const agregarDatosEstadisticosDirector = async (
    data: DataEstadisticas[],
    idEvaluacion: string
  ) => {
    await setDoc(doc(db, "evaluaciones-directores", `${currentUserData.dni}`), {
      dni: currentUserData.dni,
    });

    // const newPromiseAddAcumulado = new Promise<boolean>((resolve, reject) => {
    //   try {
    data.map(async (pq) => {
      const pathRef = doc(
        db,
        `/evaluaciones-directores/${currentUserData.dni}/${idEvaluacion}`,
        `${pq.id}`
      );

      if (pq.d === undefined) {
        await setDoc(pathRef, {
          id: pq.id,
          a: pq.a,
          b: pq.b,
          c: pq.c,
          total: pq.total,
        }).then((res) => {
          if (data.length === Number(pq.id)) {
            dispatch({
              type: AppAction.LOADER_REPORTE_DIRECTOR,
              payload: false,
            });
            dispatch({ type: AppAction.REPORTE_DIRECTOR, payload: data });
          }
        });
      } else {
        await setDoc(pathRef, {
          id: pq.id,
          a: pq.a,
          b: pq.b,
          c: pq.c,
          d: pq.d,
          total: pq.total,
        }).then((res) => {
          if (data.length === Number(pq.id)) {
            dispatch({
              type: AppAction.LOADER_REPORTE_DIRECTOR,
              payload: false,
            });
            dispatch({ type: AppAction.REPORTE_DIRECTOR, payload: data });
          }
        });
      }
    });
    //   } catch (error) {
    //     console.log("error", error);
    //     reject(error);
    //   }
    // });
  };

  const resetReporteRegional = () => {
    // dispatch({ type: AppAction.LOADER_REPORTE_REGIONAL, payload: true })
    dispatch({ type: AppAction.REPORTE_REGIONAL, payload: [] });
  };
  const resetReporteGlobal = () => {
    // dispatch({ type: AppAction.LOADER_REPORTE_REGIONAL, payload: true })
    dispatch({ type: AppAction.REPORTE_REGIONAL, payload: [] });
  };

  const reporteRegionalGlobal = async (idEvaluacion: string) => {
    resetReporteGlobal();
    dispatch({ type: AppAction.LOADER_REPORTE_REGIONAL, payload: true });
    //pathref es la referencia para hacer el get de todos los directores que estan en la collection de evaluaciones-directores
    const pathRefEvaluacionesDirectores = collection(
      db,
      "evaluaciones-directores"
    );
    //creamos un array para almacenar toda la data alli
    const dniDirectoreDeRegion: string[] = [];
    const arrayAllDirectoresEvaluacionesDirectore: DataEstadisticas[] = [];

    const getDniDirectores = new Promise<string[]>(async (resolve, reject) => {
      try {
        await getDocs(pathRefEvaluacionesDirectores).then((res) => {
          res.forEach((doc) => {
            dniDirectoreDeRegion.push(doc.id);
          });
          resolve(dniDirectoreDeRegion);
        });
      } catch (error) {
        reject();
        console.log("error", error);
      }
    });

    const reporteGlobalPromise = new Promise<DataEstadisticas[]>(
      async (resolve, reject) => {
        let arrayAcumulativoDeRespuestas: DataEstadisticas[] = [];
        let pruebaRespuestas = [];

        try {
          getDniDirectores.then((arrayDirectores) => {
            arrayDirectores.forEach(async (director, index) => {
              const pathRefDirectoresTodasRegiones = collection(
                db,
                `/evaluaciones-directores/${director}/${idEvaluacion}`
              );

              await getDocs(pathRefDirectoresTodasRegiones).then(
                (evaluaciones) => {
                  if (evaluaciones.size > 0) {
                    // const dataEvaluaciones:DataEstadisticas[] = []
                    // evaluaciones.forEach(doc => {
                    //   dataEvaluaciones.push(doc.data())
                    // })
                    // pruebaRespuestas.push(dataEvaluaciones)
                    // console.log('linea 325 evaluaciones',pruebaRespuestas)
                    // resolve(pruebaRespuestas)
                    if (arrayAcumulativoDeRespuestas.length === 0) {
                      const arrayOrdenadoRespuestas: DataEstadisticas[] = [];
                      evaluaciones.forEach((doc) =>
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
                        .sort((a: any, b: any) => a.id - b.id)
                        .forEach((a) => arrayAcumulativoDeRespuestas.push(a));

                      console.log(
                        `revision ${index}`,
                        arrayAcumulativoDeRespuestas
                      );
                    } else {
                      const arrayOrdenadoRespuestas: DataEstadisticas[] = [];
                      evaluaciones.forEach((doc) =>
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
                      // if(doc.data().d === undefined)
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
                      console.log(
                        `revision ${index}`,
                        arrayAcumulativoDeRespuestas
                      );
                    }
                  }
                  if (arrayDirectores.length === index + 1) {
                    resolve(arrayAcumulativoDeRespuestas);
                  }
                }
              );
            });
          });
        } catch (error) {
          console.log("linea 315 error", error);
          reject(error);
        }
      }
    );

    reporteGlobalPromise.then((res) => {
      console.log("linea 405 res", res);
      setTimeout(() => {
        dispatch({ type: AppAction.LOADER_REPORTE_REGIONAL, payload: false });
        dispatch({ type: AppAction.REPORTE_REGIONAL, payload: res });
      },3000)
    });

    // getDniDirectores
    //   .then((res) => {
    //     //dniDirectoreDeRegion tiene toda los dni de los directores donde de buscara aquellas que tengan la evaluacion que se busca para hacer el resultado acumulado.
    //     console.log("linea:301, res", res);
    //     res.forEach(async (director, index) => {
    //       const pathRefDirectoresTodasRegiones = collection(
    //         db,
    //         `/evaluaciones-directores/${director}/${idEvaluacion}`
    //       );
    //       //comienzo a hacer el get de todos los resultados de los directores pero solo para un examen en especifico
    //       await getDocs(pathRefDirectoresTodasRegiones).then(
    //         (resultadosExamen) => {
    //           console.log("index", index);

    //           //primero verifico si el director tiene registros de evaluacion de ese examen
    //           if (resultadosExamen.size > 0) {
    //             //entonces si existe data
    //             if (arrayAcumulativoDeRespuestas.length === 0) {
    //               const arrayOrdenadoRespuestas: DataEstadisticas[] = [];
    //               resultadosExamen.forEach((doc) => {
    //                 arrayOrdenadoRespuestas.push({
    //                   ...doc.data(),
    //                   id: doc.id,
    //                   total:
    //                     doc.data().d === undefined
    //                       ? Number(doc.data().a) +
    //                         Number(doc.data().b) +
    //                         Number(doc.data().c)
    //                       : Number(doc.data().a) +
    //                         Number(doc.data().b) +
    //                         Number(doc.data().c) +
    //                         Number(doc.data().d),
    //                 });
    //                 arrayOrdenadoRespuestas
    //                   .sort((a: any, b: any) => a.id - b.id)
    //                   .forEach((a) => arrayAcumulativoDeRespuestas.push(a));
    //                 //  arrayAllDirectoresEvaluacionesDirectore.push(doc.data())
    //               });
    //               console.log(`rta ${index}`, arrayAcumulativoDeRespuestas);
    //             } else if (arrayAcumulativoDeRespuestas.length > 0) {
    //               console.log(
    //                 "index 1, para saber si entra qui este bastardo",
    //                 index
    //               );
    //               //este array lo utliziamos cada vez que ingresamos a la condicion con el objetivo de poder guardar la data y ordenarla y luego resetea su valor
    //               const arrayOrdenadoRespuestas: DataEstadisticas[] = [];
    //               resultadosExamen.forEach((doc) =>
    //                 //primero se agrega el total
    //                 arrayOrdenadoRespuestas.push({
    //                   ...doc.data(),
    //                   id: doc.id,
    //                   total:
    //                     doc.data().d === undefined
    //                       ? Number(doc.data().a) +
    //                         Number(doc.data().b) +
    //                         Number(doc.data().c)
    //                       : Number(doc.data().a) +
    //                         Number(doc.data().b) +
    //                         Number(doc.data().c) +
    //                         Number(doc.data().d),
    //                 })
    //               );

    //               //luego se ordena y se hacen las sumas correspondientes
    //               arrayOrdenadoRespuestas
    //                 ?.sort((a: any, b: any) => a.id - b.id)
    //                 .forEach((data) => {
    //                   arrayAcumulativoDeRespuestas?.map((rta, i) => {
    //                     if (rta.d === undefined) {
    //                       if (rta.id === data.id) {
    //                         rta.a = Number(rta.a) + Number(data.a);
    //                         rta.b = Number(rta.b) + Number(data.b);
    //                         rta.c = Number(rta.c) + Number(data.c);
    //                         rta.total = Number(rta.total) + Number(data.total);
    //                       }
    //                     } else {
    //                       if (rta.id === data.id) {
    //                         rta.a = Number(rta.a) + Number(data.a);
    //                         rta.b = Number(rta.b) + Number(data.b);
    //                         rta.c = Number(rta.c) + Number(data.c);
    //                         rta.d = Number(rta.d) + Number(data.d);
    //                         rta.total = Number(rta.total) + Number(data.total);
    //                       }
    //                     }
    //                   });
    //                 });
    //               console.log(`rta ${index}`, arrayAcumulativoDeRespuestas);
    //             }
    //           }
    //         }
    //       );
    //     });
    //     // dniDirectoreDeRegion;
    //   });
  };

  const reporteRegionales = async (
    regionValue: number,
    idEvaluacion: string
  ) => {
    resetReporteRegional();
    dispatch({ type: AppAction.LOADER_REPORTE_REGIONAL, payload: true });
    const dniDirectoreDeRegion: string[] = [];

    let dataEstadisticasRegionalesAcumulativo: DataEstadisticas[] = [];
    const directoreRegionRef = collection(db, "usuarios");
    const directoreRegionQuery = query(
      directoreRegionRef,
      where("region", "==", regionValue)
    );

    const sizesDirectores = await getDocs(directoreRegionQuery);

    if (sizesDirectores.size === 0) {
      console.log("la region no tiene data");
      dispatch({ type: AppAction.REPORTE_REGIONAL, payload: [] });
      dispatch({ type: AppAction.LOADER_REPORTE_REGIONAL, payload: false });
      // dispatch({ type: AppAction.LOADER_REPORTE_REGIONAL, payload: false })
    } else {
      const getDataRegionPromise = new Promise<string[]>(
        async (resolve, reject) => {
          try {
            await getDocs(directoreRegionQuery).then((res) => {
              res.forEach((doc) => {
                dniDirectoreDeRegion.push(doc.data().dni);
              });
              resolve(dniDirectoreDeRegion);
            });
          } catch (error) {
            console.log("error", error);
            reject(error);
          }
        }
      );

      const reporteFinalRegional = new Promise<DataEstadisticas[]>(
        async (resolve, reject) => {
          try {
            await getDataRegionPromise.then(async (res) => {
              res.forEach(async (dni, index) => {
                const evaluacionesDirectorRef = collection(
                  db,
                  `/evaluaciones-directores/${dni}/${idEvaluacion}`
                );
                await getDocs(evaluacionesDirectorRef).then((evaluaciones) => {
                  if (evaluaciones.size > 0) {
                    //preguntamos si la collecition tiene datos, si tiene ingresa a la condicion

                    if (dataEstadisticasRegionalesAcumulativo.length === 0) {
                      const dataEstadisticasRegionales: DataEstadisticas[] = [];
                      evaluaciones.forEach((doc) =>
                        dataEstadisticasRegionales.push({
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
                      console.log(
                        "entrando cuando el array se encuentra vacio, solo ingresara una vez"
                      );
                      dataEstadisticasRegionales
                        .sort((a: any, b: any) => a.id - b.id)
                        .forEach((a) =>
                          dataEstadisticasRegionalesAcumulativo.push(a)
                        );
                      // resolve(dataEstadisticasRegionalesAcumulativo)
                    } else if (
                      dataEstadisticasRegionalesAcumulativo.length > 0
                    ) {
                      const dataEstadisticasRegionales: DataEstadisticas[] = [];
                      evaluaciones.forEach((doc) =>
                        dataEstadisticasRegionales.push({
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
                      dataEstadisticasRegionales
                        .sort((a: any, b: any) => a.id - b.id)
                        .forEach((data) => {
                          dataEstadisticasRegionalesAcumulativo.map((rta) => {
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
                  if (res.length === index + 1) {
                    resolve(dataEstadisticasRegionalesAcumulativo);
                  }
                });
              });
            });
          } catch (error) {
            console.log("error", error);
            reject(error);
          }
        }
      );
      reporteFinalRegional.then((rtaFinal) => {
        dispatch({ type: AppAction.REPORTE_REGIONAL, payload: rtaFinal });
        dispatch({ type: AppAction.LOADER_REPORTE_REGIONAL, payload: false });
        // setTimeout(() => {
        //   console.log("rtafinal", rtaFinal);
        // }, 5000);
      });
    }
  };

  const getRegiones = async () => {
    const regionRef = collection(db, "region");
    const queryRegiones = await getDocs(regionRef);
    const arrayRegiones: Region[] = [];
    queryRegiones.forEach((doc) => {
      arrayRegiones.push(doc.data());
    });

    dispatch({ type: AppAction.REGIONES, payload: arrayRegiones });
  };
  return {
    reporteDirectorData,
    agregarDatosEstadisticosDirector,
    getRegiones,
    reporteRegionales,
    resetReporteRegional,
    reporteRegionalGlobal,
    resetReporteGlobal,

  };
};
