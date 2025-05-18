import {
  collection,
  doc,
  getDoc,
  getDocs,
  getFirestore,
  query,
  setDoc,
  where,
} from "firebase/firestore";
import { DataEstadisticas, Region, User, UserEstudiante } from "../types/types";
import {
  useGlobalContext,
  useGlobalContextDispatch,
} from "../context/GlolbalContext";
import { AppAction } from "../actions/appAction";
import { currentMonth, currentYear, } from "@/fuctions/dates";
export const useReporteDirectores = () => {
  const dispatch = useGlobalContextDispatch();
  const { currentUserData } = useGlobalContext();
  const db = getFirestore();


  //dataFiltradaDirectorTabla, esta es la constate que contiene los datos de los estudiantes que se van a mostrar en la tabla

  const getAllEvaluacionesDeEstudiantes = async (idEvaluacion: string, month: number) => {
    try {
      console.log('month', month)
      const q = query(collection(db, "usuarios"), where("dniDirector", "==", `${currentUserData.dni}`));
      const querySnapshot = await getDocs(q);

      const docentesDelDirector: string[] = [];
      querySnapshot.forEach((doc) => {
        docentesDelDirector.push(doc.id);
      });
      // Convertimos el forEach en un array de promesas
      const promesasEvaluaciones = docentesDelDirector.map(async (docente) => {
        const pathRefEstudiantes = collection(db, `/usuarios/${docente}/${idEvaluacion}/${currentYear}/${month}`);
        const snapshot = await getDocs(pathRefEstudiantes);
        const evaluacionesDocente: UserEstudiante[] = [];

        snapshot.forEach(doc => {
          evaluacionesDocente.push(doc.data() as UserEstudiante);
        });

        return evaluacionesDocente;
      });

      // Esperamos a que todas las promesas se resuelvan
      const resultadosEvaluaciones = await Promise.all(promesasEvaluaciones);

      // Aplanamos el array de arrays en un solo array
      const todasLasEvaluaciones = resultadosEvaluaciones.flat();
      console.log('todasLasEvaluaciones', todasLasEvaluaciones)
      if (todasLasEvaluaciones.length === 0) {
        dispatch({ type: AppAction.DATA_FILTRADA_DIRECTOR_TABLA, payload: [] });
        dispatch({ type: AppAction.ALL_RESPUESTAS_ESTUDIANTES_DIRECTOR, payload: [] });
        return [];
      }

      dispatch({ type: AppAction.ALL_RESPUESTAS_ESTUDIANTES_DIRECTOR, payload: todasLasEvaluaciones });
      return todasLasEvaluaciones;
    } catch (error) {
      console.error("Error en reporteDirectorEstudiantes:", error);
      throw error;
    }
  }

  const reporteDirectorEstudiantes = async (idEvaluacion: string, month: number, currentUserData: User) => {
    const estudiantes = await getAllEvaluacionesDeEstudiantes(idEvaluacion, month)
    const acumuladoPorPregunta: Record<string, { id: string, a: number, b: number, c: number, d?: number, total: number }> = {}
    console.log('estudiantes', estudiantes.length)
    estudiantes.forEach(estudiante => {
      if (estudiante.respuestas && Array.isArray(estudiante.respuestas)) {
        estudiante.respuestas.forEach(respuesta => {
          const idPregunta = String(respuesta.id)
          if (!idPregunta) return
          // Detectar si la alternativa 'd' existe en esta pregunta
          let tieneD = false
          if (respuesta.alternativas && Array.isArray(respuesta.alternativas)) {
            tieneD = respuesta.alternativas.some(alt => alt.alternativa === 'd')
          }
          if (!acumuladoPorPregunta[idPregunta]) {
            acumuladoPorPregunta[idPregunta] = tieneD
              ? { id: idPregunta, a: 0, b: 0, c: 0, d: 0, total: 0 }
              : { id: idPregunta, a: 0, b: 0, c: 0, total: 0 }
          }
          if (respuesta.alternativas && Array.isArray(respuesta.alternativas)) {
            respuesta.alternativas.forEach(alternativa => {
              if (alternativa.selected) {
                switch (alternativa.alternativa) {
                  case 'a':
                    acumuladoPorPregunta[idPregunta].a += 1
                    break
                  case 'b':
                    acumuladoPorPregunta[idPregunta].b += 1
                    break
                  case 'c':
                    acumuladoPorPregunta[idPregunta].c += 1
                    break
                  case 'd':
                    if (typeof acumuladoPorPregunta[idPregunta].d === 'number') {
                      acumuladoPorPregunta[idPregunta].d! += 1
                    }
                    break
                  default:
                    break
                }
              }
            })
          }
        })
      }
    })
    Object.values(acumuladoPorPregunta).forEach(obj => {
      obj.total = obj.a + obj.b + obj.c + (typeof obj.d === 'number' ? obj.d : 0)
    })
    const resultado = Object.values(acumuladoPorPregunta)
    console.log('acumulado por pregunta', resultado)
    /* dispatch({ type: AppAction.DATA_ESTADISTICAS, payload: resultado }) */
    dispatch({ type: AppAction.REPORTE_DIRECTOR, payload: resultado });


    //enviaremos el valor de resultado a la base de datos de los directores
    //collection    /    documento     /    subcollection  /    documento  /    subcollection  /    documento
    //evaluaciones  /id de la evaluacion/    año y mes     / todos los directores
    console.log('currentUserData', currentUserData)
    const myDirector = await getDoc(doc(db, `usuarios`, `${currentUserData.dni}`))
    myDirector.exists() && await setDoc(doc(db, `evaluaciones/${idEvaluacion}/${currentYear}-${month}`, `${currentUserData.dni}`), {
      ...myDirector.data(),
      reporteEstudiantes: resultado
    })
    /* if (currentUserData.dni) {
      try {
        // Filtrar propiedades undefined de currentUserData
        const userDataToSave = Object.fromEntries(
          Object.entries(currentUserData).filter(([_, value]) => value !== undefined)
        );

        await setDoc(doc(db, `evaluaciones/${idEvaluacion}/${currentYear}-${month}`, `${currentUserData.dni}`), {
          ...userDataToSave,
          reporteEstudiantes: resultado || []
        });
      } catch (error) {
        console.error("Error al guardar el reporte:", error);
        throw error;
      }
    } */
    return resultado
  }

  const reporteDirectorData = async (
    idDirector: string,
    idEvaluacion: string
  ) => {

    //1.-traer a todos los docentes que estan acargo del director
    //2.-comenzar a iterar en el array de docentes y hacer get de las evaluaciones de cada docente
    //3.-hacer acumulado de las evaluaciones de cada docente
    //4.-hacer set de los datos en la collection de evaluaciones-directores
    const docentesDelDirector: string[] = [];
    /* dispatch({ type: AppAction.LOADER_REPORTE_DIRECTOR, payload: true }); */
    const getDocenterIdRef = query(
      collection(db, "usuarios"),
      where("dniDirector", "==", `${idDirector}`)
    );//me traigo a todos los docentes que estan acargo del director

    //aqui debemos de validar si existe evaluaciones de los docentes de dicha evalucion

    //1.-traer a todos los docentes que estan acargo del director
    const getDniDocentesDeDirectores = new Promise<string[]>(
      async (resolve, reject) => {
        let index = 0
        try {
          await getDocs(getDocenterIdRef).then((docente) => {
            //obtengo todos los dni de los docentes que estan acargo del director si no tiene no devuelve reultados
            if (docente.size === 0) {
              //entro aqui si no hay docentes que han evaluado a sus estudiantes
              console.log("docente.size", docente.size);
              dispatch({
                type: AppAction.LOADER_REPORTE_DIRECTOR,
                payload: false,
              });
              reject();
            } else {
              console.log("entro aqui si hay docentes que han evaluado a sus estudiantes");
              //entro aqui si hay docentes que han evaluado a sus estudiantes
              docente.forEach((doc) => {
                index = index + 1
                //obtengo todos los dni de los docentes que estan acargo del director
                docentesDelDirector.push(doc.id);
                if (index === docente.size) {
                  resolve(docentesDelDirector)
                }
              });
            }
          });
        } catch (error) {
          console.log("error", error);
          reject(error);
        }
      }
    );

    //2.-comenzar a iterar en el array de docentes y hacer get de las evaluaciones de cada docente
    //con esta promesa una vez tenga los dni de todo los docentes comienzo hacer get del acumulativo del examen hecho por el profesor

    getDniDocentesDeDirectores.then(async (docentes) => {
      console.log("docentes", docentes)
      const promesaEstudiantes = docentes.map(async (docente) => {
        try {
          const path = `/usuarios/${docente}/${idEvaluacion}/`;
          const pathRefEstudiantes = collection(db, path);

          const snapshot = await getDocs(pathRefEstudiantes);
          const arrayEstudiantes: UserEstudiante[] = [];

          snapshot.forEach(doc => {
            const data = doc.data();
            if (data) {
              arrayEstudiantes.push({
                ...data,
                id: doc.id
              } as UserEstudiante);
            }
          });
          return arrayEstudiantes;
        } catch (error) {
          console.error(`Error al obtener datos del docente ${docente}:`, error);
          return [] as UserEstudiante[];
        }
      });

      const dataDeTodosLosEstudiantes = Promise.allSettled(promesaEstudiantes)
      dataDeTodosLosEstudiantes.then((res) => {
        const estudiantesExitosos = res
          .filter((result): result is PromiseFulfilledResult<UserEstudiante[]> =>
            result.status === 'fulfilled')
          .map(result => result.value)
          .flat();
        //en este dispatch guardare la data de todos los estudiantes que pertenecen a la institucion
        dispatch({ type: AppAction.ALL_RESPUESTAS_ESTUDIANTES_DIRECTOR, payload: estudiantesExitosos })
        const dataEstadisticasEstudiantes = estudiantesExitosos.reduce((acc, estudiante) => {
          estudiante.respuestas?.forEach(respuesta => {
            if (respuesta.order === undefined) return;

            const orderId = respuesta.order.toString();
            let estadistica = acc.find(stat => stat.id === orderId);

            if (!estadistica) {
              // Inicializamos con todas las propiedades posibles
              estadistica = {
                id: orderId,
                a: 0,
                b: 0,
                c: 0,
                d: 0,
                total: 0
              };
              acc.push(estadistica);
            }

            respuesta.alternativas?.forEach(alternativa => {
              if (!alternativa.selected) return;

              switch (alternativa.alternativa) {
                case 'a': estadistica!.a = (estadistica!.a || 0) + 1; break;
                case 'b': estadistica!.b = (estadistica!.b || 0) + 1; break;
                case 'c': estadistica!.c = (estadistica!.c || 0) + 1; break;
                case 'd': estadistica!.d = (estadistica!.d || 0) + 1; break;
              }
            });

            // Calculamos el total basado en las alternativas presentes
            const alternativasPresentes = respuesta.alternativas?.some(alt => alt.alternativa === 'd');
            if (alternativasPresentes) {
              estadistica!.total = (estadistica!.a || 0) + (estadistica!.b || 0) + (estadistica!.c || 0) + (estadistica!.d || 0);
            } else {
              estadistica!.total = (estadistica!.a || 0) + (estadistica!.b || 0) + (estadistica!.c || 0);
              // Si no hay alternativa 'd', la establecemos como undefined
              estadistica!.d = undefined;
            }
          });
          console.log('acc', acc)
          return acc;
        }, [] as DataEstadisticas[]);

        dispatch({ type: AppAction.REPORTE_DIRECTOR, payload: dataEstadisticasEstudiantes });
      })
    })
  }


  const reporteToTableDirector = (data: UserEstudiante[], { grado, seccion, orden, genero }: { grado: string, seccion: string, orden: string, genero: string }, idDirector: string, idEvaluacion: string) => {
    const dataFiltrada = data?.filter(estudiante => {
      // Si no hay filtros, incluir todos los datos
      if (!grado && !seccion && !genero) {
        return true;
      }

      // Verificar cada filtro individualmente
      const cumpleGrado = !grado || estudiante.grado?.toString() === grado;
      const cumpleSeccion = !seccion || estudiante.seccion?.toString() === seccion;
      const cumpleGenero = !genero || estudiante.genero?.toString() === genero;

      // El estudiante debe cumplir con todos los filtros activos
      return cumpleGrado && cumpleSeccion && cumpleGenero;
    });

    // Ordenar los datos según el parámetro orden
    let dataOrdenada = [...dataFiltrada];
    if (orden) {
      switch (orden) {
        case 'asc':
          dataOrdenada.sort((a, b) => Number(a.respuestasCorrectas || 0) - Number(b.respuestasCorrectas || 0));
          break;
        case 'desc':
          dataOrdenada.sort((a, b) => Number(b.respuestasCorrectas || 0) - Number(a.respuestasCorrectas || 0));
          break;
        default:
          break;
      }
    }

    dispatch({ type: AppAction.DATA_FILTRADA_DIRECTOR_TABLA, payload: dataOrdenada });
    return dataOrdenada;
  }

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
      }, 3000);
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
    reporteToTableDirector,
    reporteDirectorEstudiantes
  };
};
