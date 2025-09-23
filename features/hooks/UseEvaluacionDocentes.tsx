import React from 'react'
import { AlternativasDocente, CrearEvaluacionDocente, DataEstadisticas, DataEstadisticasDocente, ObservacionMonitoreoDocente, PRDocentes, PreviewPRDocentes, ReporteDocenteIndividual, User } from '../types/types'
import { onSnapshot, addDoc, query, where, deleteDoc, doc, collection, getDocs, getFirestore, setDoc, updateDoc, getDoc, increment, orderBy, connectFirestoreEmulator } from "firebase/firestore";
import { useGlobalContext, useGlobalContextDispatch } from '../context/GlolbalContext';
import { AppAction } from '../actions/appAction';
import { } from 'firebase/firestore/lite';
import { useRouter } from 'next/router';
import { currentMonth, currentYear } from '@/fuctions/dates';

const UseEvaluacionDocentes = () => {
  const dispatch = useGlobalContextDispatch()
  const { currentUserData } = useGlobalContext()
  const db = getFirestore()
  const router = useRouter()
  const createEvaluacionesDocentes = async (data: CrearEvaluacionDocente) => {
    
    await addDoc(collection(db, "evaluaciones-docentes"), data);
  }

  const getDataEvaluacion = (idEvaluacion: string) => {
    dispatch({ type: AppAction.EVALUACIONES_DOCENTES, payload: [] })
    const q = query(collection(db, "/evaluaciones-docentes"), orderBy("order", "asc"))
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
        arrayEvaluaciones.push({ ...doc.data(), id: doc.id });
      });
      dispatch({ type: AppAction.EVALUACIONES_DOCENTES, payload: arrayEvaluaciones })
      dispatch({ type: AppAction.LOADER_PAGES, payload: false })
    });
  }

  const deleteEvaluacionDocentes = async (id: string) => {
    await deleteDoc(doc(db, "evaluaciones-docentes", id));
  }

  const updateEvaluacionDocentes = async (data: CrearEvaluacionDocente, id: string) => {
    await updateDoc(doc(db, "evaluaciones-docentes", id), data);
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
    dispatch({ type: AppAction.GET_PREGUNTA_RESPUESTA_DOCENTE, payload: [] })
    dispatch({ type: AppAction.LOADER_PAGES, payload: true })
    const path = `/evaluaciones-docentes/${idEvaluacion}/preguntasRespuestas`
    const q = query(collection(db, path), orderBy("order", "asc"))
    onSnapshot(q, (querySnapshot) => {
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

  const buscarDocenteToEspecialista = async (dni: string) => {
    dispatch({ type: AppAction.WARNING_DATA_DOCENTE, payload: "" })
    const docRef = doc(db, "usuarios", `${dni}`);
    const docSnap = await getDoc(docRef);

    if (docSnap.exists()) {
      dispatch({ type: AppAction.DATA_DOCENTE, payload: docSnap.data() })
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
      const path = doc(db, `/usuarios/${currentUserData?.dni}/${idEvaluacion}/${currentYear}/${currentMonth}`, idDocente)
      // const docRef = doc(db, path, `${idDocente}`);
      await getDoc(path)
        .then(response => {
          if (response.exists()) {
            dispatch({ type: AppAction.REPORTE_INDIVIDUAL_DOCENTE, payload: response.data() })
          }
        })
    }
  }

  const buscarDocenteReporteEvaluacionToEspecilista = async (idEvaluacion: string, dataDocente: User) => {
    /*  if (idEvaluacion.length > 0 && dataDocente.dni.length > 0) { */
    const path = doc(db, `/usuarios/${dataDocente.dniDirector}/${idEvaluacion}`, `${dataDocente.dni}`)
    // const docRef = doc(db, path, `${idDocente}`);
    await getDoc(path)
      .then(response => {
        if (response.exists()) {
          dispatch({ type: AppAction.REPORTE_INDIVIDUAL_DOCENTE, payload: response.data() })
        }
      })
    /* } */
  }
  const getDataEvaluacionMediacionDirector = async (idEvaluacion: string) => {
    const path = doc(db, `/evaluaciones-docentes`, idEvaluacion)
    await getDoc(path)
      .then(response => {
        if (response.exists()) {
          dispatch({ type: AppAction.DATA_EVALUACION_MEDIACION_DIRECTOR, payload: response.data() })
        }
      })
  }
  const resetDocente = () => {
    dispatch({ type: AppAction.DATA_DOCENTE, payload: {} })
  }

  const guardarObservacionDocente = async (idEvaluacion: string, data: ObservacionMonitoreoDocente, dataDocente: ReporteDocenteIndividual) => {

    const path = `/usuarios/${currentUserData.dni}/${idEvaluacion}/`
    await setDoc(doc(db, path, `${dataDocente.dni}`), { ...dataDocente, observacionesMonitoreo: data })
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

    const path = `/usuarios/${dataDocente.dniDirector}/${idEvaluacion}/${currentYear}/${currentMonth}`
    await setDoc(doc(db, path, `${dataDocente.dni}`), {
      observacionesMonitoreo: {},
      resultados: data,
      dni: dataDocente.dni,
      dniDirector: currentUserData.dni,
      calificacion: totalPuntos,
      info: dataDocente
    })
      .then(() => {
        dispatch({ type: AppAction.LOADER_SALVAR_PREGUNTA, payload: false })
        router.push(`/directores/evaluaciones-docentes/evaluacion/reporte-docente-individual?idDocente=${dataDocente.dni}&idEvaluacion=${idEvaluacion}`)
      })
    //AGREGANDO RESULTADOS DE LA EVALUACION DEL DOCENTE
  }

  const guardarEvaluacionDocenteToEspecialista = async (idEvaluacion: string, data: PRDocentes[], dataDocente: User) => {
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

    const path = `/usuarios/${dataDocente.dniDirector}/${idEvaluacion}`
    await setDoc(doc(db, path, `${dataDocente.dni}`), {
      observacionesMonitoreo: {},
      resultados: data,
      dni: dataDocente.dni,
      dniDirector: dataDocente.dniDirector,
      calificacion: totalPuntos,
      info: dataDocente
    })
      .then(() => {
        router.push(`/especialistas/evaluaciones-docentes/evaluacion/reporte-docente-individual?idDocente=${dataDocente.dni}&idEvaluacion=${idEvaluacion}`)
        dispatch({ type: AppAction.LOADER_SALVAR_PREGUNTA, payload: false })
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
  const resetReporteTabla = () => {
    dispatch({ type: AppAction.DATA_FILTRADA_DIRECTOR_DOCENTE_TABLA, payload: [] })
  }
  const getDocentesDelDirector = async (idEvaluacion: string, month: number) => {
    const path = `/usuarios/${currentUserData.dni}/${idEvaluacion}/${currentYear}/${month}`
    const docentesDelDirectorarray: ReporteDocenteIndividual[] = []
    const getDocenterIdRef = collection(db, path)
    const docentesDelDirector = await getDocs(getDocenterIdRef)
    docentesDelDirector.forEach(doc => {
      docentesDelDirectorarray.push(doc.data())
    })
    return docentesDelDirectorarray
  }
  const reporteTablaEvaluacionEspecialistaDocente = (data: ReporteDocenteIndividual[], { genero, grado, seccion, order }: { genero: string, grado: string, seccion: string, order: string }) => {
    console.log('Filtros recibidos:', { genero, grado, seccion, order });

    const dataFiltrada = data?.filter(docente => {
      // Si no hay filtros activos, incluir todos los docentes
      if (!genero && !grado && !seccion) {
        return true;
      }

      // Aplicar filtros solo si están definidos
      const cumpleGenero = !genero || docente.info?.genero?.toString() === genero;

      // Verificar si el docente tiene los arrays de grados y secciones
      const tieneGrados = Array.isArray(docente.info?.grados);
      const tieneSecciones = Array.isArray(docente.info?.secciones);

      // Filtrar por grado y sección solo si existen los arrays
      const cumpleGrado = !grado || (tieneGrados && docente.info?.grados?.includes(Number(grado)));
      const cumpleSeccion = !seccion || (tieneSecciones && docente.info?.secciones?.includes(Number(seccion)));

      // El docente debe cumplir todos los filtros activos
      const cumpleFiltros = cumpleGenero && cumpleGrado && cumpleSeccion;

      if (cumpleFiltros) {
        console.log('Docente cumple filtros:', {
          nombre: docente.info?.nombres,
          grados: docente.info?.grados,
          secciones: docente.info?.secciones
        });
      }

      return cumpleFiltros;
    });

    // Aplicar ordenamiento si se especifica
    let dataOrdenada = [...dataFiltrada];
    if (order) {
      dataOrdenada.sort((a, b) => {
        const calificacionA = Number(a.calificacion) || 0;
        const calificacionB = Number(b.calificacion) || 0;

        if (order === "1") { // Ascendente
          return calificacionA - calificacionB;
        } else if (order === "2") { // Descendente
          return calificacionB - calificacionA;
        }
        return 0;
      });
    }

    console.log('Datos ordenados:', dataOrdenada.map(d => ({ nombre: d.info?.nombres, calificacion: d.calificacion })));
    dispatch({ type: AppAction.DATA_FILTRADA_DIRECTOR_DOCENTE_TABLA, payload: dataOrdenada });
    convertDataEstadisticasYGraficos(dataOrdenada);
  }
  const reporteTablaEvaluacionDirectorDocente = (data: ReporteDocenteIndividual[], { grado, seccion, orden, genero }: { grado: string, seccion: string, orden: string, genero: string }) => {
    console.log('Filtros recibidos:', { grado, seccion, orden, genero });

    const dataFiltrada = data?.filter(docente => {
      // Si no hay filtros activos, incluir todos los docentes
      if (!grado && !seccion) {
        return true;
      }

      // Verificar si el docente tiene los arrays de grados y secciones
      const tieneGrados = Array.isArray(docente.info?.grados);
      const tieneSecciones = Array.isArray(docente.info?.secciones);

      // Filtrar por grado y sección solo si existen los arrays
      const cumpleGrado = !grado || (tieneGrados && docente.info?.grados?.includes(Number(grado)));
      const cumpleSeccion = !seccion || (tieneSecciones && docente.info?.secciones?.includes(Number(seccion)));

      // El docente debe cumplir todos los filtros activos
      const cumpleFiltros = cumpleGrado && cumpleSeccion;

      if (cumpleFiltros) {
        console.log('Docente cumple filtros:', {
          nombre: docente.info?.nombres,
          grados: docente.info?.grados,
          secciones: docente.info?.secciones
        });
      }

      return cumpleFiltros;
    });

    // Aplicar ordenamiento si se especifica
    let dataOrdenada = [...dataFiltrada];
    if (orden) {
      dataOrdenada.sort((a, b) => {
        const calificacionA = Number(a.calificacion) || 0;
        const calificacionB = Number(b.calificacion) || 0;

        if (orden === "1") { // Ascendente
          return calificacionA - calificacionB;
        } else if (orden === "2") { // Descendente
          return calificacionB - calificacionA;
        }
        return 0;
      });
    }

    console.log('Datos ordenados:', dataOrdenada.map(d => ({ nombre: d.info?.nombres, calificacion: d.calificacion })));
    dispatch({ type: AppAction.DATA_FILTRADA_DIRECTOR_DOCENTE_TABLA, payload: dataOrdenada });
    convertDataEstadisticasYGraficos(dataOrdenada);
  }


  const reporteEvaluacionDocentesTest = async (idEvaluacion: string, month: number) => {
    dispatch({ type: AppAction.DATA_FILTRADA_DIRECTOR_DOCENTE_TABLA, payload: [] });
    const resultadosDocentes = await getDocentesDelDirector(idEvaluacion, month)
    dispatch({ type: AppAction.ALL_EVALUACIONES_DIRECTOR_DOCENTE, payload: resultadosDocentes });

    const estadisticas = resultadosDocentes.reduce((acc, docente) => {
      docente.resultados?.forEach(respuesta => {
        if (respuesta.order === undefined) return;

        const orderId = respuesta.order.toString();
        let estadistica = acc.find(stat => stat.id === orderId);

        if (!estadistica) {
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

        const alternativasPresentes = respuesta.alternativas?.some(alt => alt.alternativa === 'd');
        if (alternativasPresentes) {
          estadistica!.total = (estadistica!.a || 0) + (estadistica!.b || 0) + (estadistica!.c || 0) + (estadistica!.d || 0);
        } else {
          estadistica!.total = (estadistica!.a || 0) + (estadistica!.b || 0) + (estadistica!.c || 0);
          estadistica!.d = undefined;
        }
      });
      return acc;
    }, [] as DataEstadisticas[]);

    const refUser = doc(db, "usuarios", `${currentUserData.dni}`);
    const user = await getDoc(refUser);
    const path = `evaluaciones-docentes/${idEvaluacion}/${currentYear}-${month}`
    user.data() && await setDoc(doc(db, path, `${currentUserData.dni}`), {
      ...user.data(),
      resultados: estadisticas
    })
    dispatch({ type: AppAction.DATA_ESTADISTICAS, payload: estadisticas });
  }
  const convertDataEstadisticasYGraficos = (data: ReporteDocenteIndividual[]) => {
    const estadisticas = data.reduce((acc, docente) => {
      docente.resultados?.forEach(respuesta => {
        if (respuesta.order === undefined) return;

        const orderId = respuesta.order.toString();
        let estadistica = acc.find(stat => stat.id === orderId);

        if (!estadistica) {
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

        const alternativasPresentes = respuesta.alternativas?.some(alt => alt.alternativa === 'd');
        if (alternativasPresentes) {
          estadistica!.total = (estadistica!.a || 0) + (estadistica!.b || 0) + (estadistica!.c || 0) + (estadistica!.d || 0);
        } else {
          estadistica!.total = (estadistica!.a || 0) + (estadistica!.b || 0) + (estadistica!.c || 0);
          estadistica!.d = undefined;
        }
      });
      return acc;
    }, [] as DataEstadisticas[]);

    /* dispatch({ type: AppAction.DATA_FILTRADA_DIRECTOR_DOCENTE_TABLA, payload: resultadosDocentes }) */
    dispatch({ type: AppAction.DATA_ESTADISTICAS, payload: estadisticas });
  }
  const reporteEvaluacionDocentes = (idEvaluacion: string) => {
    dispatch({ type: AppAction.DATA_ESTADISTICAS, payload: [] })
    const path = `/evaluaciones-docentes/${idEvaluacion}/${currentUserData.dni}/`
    const refData = collection(db, path)

    const docentesDelDirector: ReporteDocenteIndividual[] = []
    const getDocenterIdRef = collection(db, `usuarios/${currentUserData.dni}/${idEvaluacion}/${currentYear}/${currentMonth}`)


    //me traigo a todos los docentes que estan acargo del director

    //aqui debemos de validar si existe evaluaciones de los docentes de dicha evalucion

    const getDniDocentesDeDirectores = new Promise<ReporteDocenteIndividual[]>(
      async (resolve, reject) => {
        try {
          const docenteSnapshot = await getDocs(getDocenterIdRef);

          if (docenteSnapshot.size === 0) {
            dispatch({ type: AppAction.LOADER_PAGES, payload: false });
            /* reject(new Error('No se encontraron docentes')); */
            return;
          }

          const procesarDocentes = docenteSnapshot.docs.map(doc => {
            return new Promise<void>((resolveDocente) => {
              docentesDelDirector.push(doc.data());
              resolveDocente();
            });
          });

          await Promise.all(procesarDocentes);
          resolve(docentesDelDirector);
        } catch (error) {
          console.error('Error al obtener docentes:', error);
          reject(error);
        }
      }
    );

    getDniDocentesDeDirectores.then(async (docentes) => {
      //aqui debo de lanzar un dispatch para tener los datos que van a tener filtros para manejo de la data que se usara en la tabla
      dispatch({ type: AppAction.ALL_EVALUACIONES_DIRECTOR_DOCENTE, payload: docentes })
      const dataEstadisticasEstudiantes = docentes.reduce((acc, docente) => {
        docente.resultados?.forEach(respuesta => {
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
        dispatch({ type: AppAction.DATA_ESTADISTICAS, payload: acc })
        return acc;
      }, [] as DataEstadisticas[]);

    })
  }
  //esta funcion no se esta usando por lo que se esta condiderando borrarlo, ademas tienes unos pequeños fallos, moerarlo.
  const getPRDocentes = async (idEvaluacion: string) => {
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
    const path = `/usuarios/${currentUserData.dni}/${idEvaluacion}`
    const pathRef = doc(db, path, `${idDocente}`)
    await updateDoc(pathRef, {
      observacion: valueObservacion
    })
    dispatch({ type: AppAction.LOADER_SALVAR_PREGUNTA, payload: false })
  }

  const reporteUgelGlobal = async (ugel: number, idEvaluacion: string, totalPreguntas: number) => {
    dispatch({ type: AppAction.REPORTE_REGIONAL, payload: [] })
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
        const path = `/evaluaciones-docentes/${idEvaluacion}/${director}`
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
    createEvaluacionesDocentes,
    getEvaluacionesDocentes,
    deleteEvaluacionDocentes,
    updateEvaluacionDocentes,
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
    reporteUgelGlobal,
    guardarObservacionDocente,
    reporteTablaEvaluacionDirectorDocente,
    resetReporteTabla,
    getDataEvaluacionMediacionDirector,
    buscarDocenteToEspecialista,
    buscarDocenteReporteEvaluacionToEspecilista,
    guardarEvaluacionDocenteToEspecialista,
    getDocentesDelDirector,
    reporteEvaluacionDocentesTest,
    reporteTablaEvaluacionEspecialistaDocente
  }

}

export default UseEvaluacionDocentes