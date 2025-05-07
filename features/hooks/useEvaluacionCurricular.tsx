import React from 'react'
import { addDoc, collection, doc, getDoc, getDocs, getFirestore, increment, onSnapshot, orderBy, query, setDoc, updateDoc, where } from "firebase/firestore";
import { useGlobalContext, useGlobalContextDispatch } from '../context/GlolbalContext';
import { AnexosCurricularType, CaracteristicaCurricular, DataEstadisticas, DataEstadisticasCurricular, EvaluacionCurricular, EvaluacionCurricularAlternativa, EvaluacionHabilidad, PaHanilidad, ReporteCurricularDirector, ReporteDataEstadisticasCD, User } from '../types/types';
import { AppAction } from '../actions/appAction';

const useEvaluacionCurricular = () => {
  const db = getFirestore()
  const dispatch = useGlobalContextDispatch()
  const { currentUserData } = useGlobalContext()

  const getEvaluacionCurricular = async () => {
    const pathRef = collection(db, "/evaluacion-curricular")
    const q = query(pathRef, orderBy("order", "asc"));
    onSnapshot(q, (querySnapshot) => {
      const arrayEvaluacionesCurricular: EvaluacionCurricular[] = [];
      querySnapshot.forEach((doc) => {
        arrayEvaluacionesCurricular.push({ ...doc.data(), id: doc.id });
      });
      dispatch({ type: AppAction.EVALUACION_CURRICULAR, payload: arrayEvaluacionesCurricular })
      dispatch({ type: AppAction.LOADER_PAGES, payload: false })
    });
  }
  const createEvaluacionCurricular = async (data: EvaluacionCurricular) => {
    await getDocs(collection(db, "evaluacion-curricular"))
      .then(async response => {
        console.log('data', { ...data, order: response.size + 1 })
        if (response.size === 0) {
          await addDoc(collection(db, "evaluacion-curricular"), { ...data, order: 0 });
        } else {
          await addDoc(collection(db, "evaluacion-curricular"), { ...data, order: response.size + 1 });
        }
      })
  }

  const addPreguntasAlternativasCurricular = async (data: EvaluacionCurricular) => {
    //el dopcumento tendra atributos de nivel, preguntas, id, tipo
    const path = `evaluacion-curricular-preguntas-alternativas/nivel-${data.nivelCurricular}/preguntas`
    const pathDoc = `evaluacion-curricular-preguntas-alternativas/nivel-${data.nivelCurricular}`
    const pathRef = collection(db, path)
    dispatch({ type: AppAction.LOADER_MODALES, payload: true })


    await setDoc(doc(db, pathDoc), {
      nivel: Number(data.nivelCurricular),
      tipo: "lectura"
    })


    await getDocs(pathRef)
      .then(async (response) => {
        await setDoc(doc(db, path, `${response.size + 1}`), { id: `${response.size + 1}`, habilidad: data.name, order: response.size + 1 })
          .then(rta => {
            dispatch({ type: AppAction.LOADER_MODALES, payload: false })
          })
      })
  }

  const getDocentesFromDirectores = async (dniDirector: string) => {
    {
      const arrayDocentes: User[] = []
      const pathRef = collection(db, 'usuarios')
      const q = query(pathRef, where("dniDirector", "==", `${currentUserData?.dni}`));
      /* const q = query(pathRef, where("dniDirector", "==", `49163626`)); */
      await getDocs(q)
        .then(async (response) => {
          console.log(response.size)
          response.forEach(doc => {
            arrayDocentes.push({ ...doc.data() })
          })
          dispatch({ type: AppAction.DOCENTES_DIRECTORES, payload: arrayDocentes })
        })
    }
  }

  const getDocente = async (dni: string) => {
    const docRef = doc(db, 'usuarios', dni)
    const docSnap = await getDoc(docRef);


    onSnapshot(docRef, (querySnapshot) => {
      querySnapshot.exists() &&
        dispatch({ type: AppAction.DATA_DOCENTE, payload: querySnapshot.data() })

    });
  }

  const getPreguntaAlternativaCurricular = async (dataDocente: User) => {
    // Este código obtiene las preguntas alternativas curriculares basadas en el grado del docente
    if (Array.isArray(dataDocente?.grados)) {
      // Define los niveles y los grados correspondientes
      const niveles = {
        1: [1, 2],
        2: [3, 4],
        3: [5, 6]
      };
      const grado = dataDocente.grados[0]; // Toma el primer grado del docente
      let nivel;
      // Determina el nivel basado en el grado
      for (const [key, value] of Object.entries(niveles)) {
        if (value.includes(grado)) {
          nivel = key;
          break;
        }
      }

      if (nivel) {
        const pathRef = collection(db, `evaluacion-curricular-preguntas-alternativas/nivel-${nivel}/preguntas`);
        const q = query(pathRef, orderBy("order", "asc"));
        const arrayEvaluacionHabilidad: EvaluacionHabilidad[] = [];

        // Obtiene las preguntas y las almacena en un array
        const querySnapshot = await getDocs(q);
        querySnapshot.forEach(doc => {
          arrayEvaluacionHabilidad.push({ ...doc.data() });
        });

        // Actualiza el estado global con las preguntas obtenidas
        dispatch({ type: AppAction.PA_HABILIDAD, payload: arrayEvaluacionHabilidad });
        // Construye la referencia a la colección de preguntas para el nivel determinado

      }
    }
  }

  const getEvaluacionCurricularAlternativa = async () => {
    const path = collection(db, '/evaluacion-curricular-alternativas')
    const q = query(path, orderBy('order', 'asc'))
    const arrayEvaluacionCurricularAlternativa: EvaluacionCurricularAlternativa[] = []
    await getDocs(q)
      .then(response => {
        console.log('response.size', response.size)
        response.forEach(doc => {
          arrayEvaluacionCurricularAlternativa.push({ ...doc.data() })
        })
        dispatch({ type: AppAction.EVALUACION_CURRICULAR_ALTERNATIVA, payload: arrayEvaluacionCurricularAlternativa })
      })
  }

  const generateEvaluacionCurricular = async (alternativas: EvaluacionCurricularAlternativa[], paHabilidad: EvaluacionHabilidad[], idCurricular: string) => {
    console.log('idCurricular', idCurricular)
    const pathRef = doc(db, '/evaluacion-curricular', idCurricular)

    const array: PaHanilidad[] = []
    paHabilidad.forEach(habilidad => {
      array.push({ alternativas, habilidad: habilidad.habilidad, id: habilidad.id, order: habilidad.order })
    })
    if (array.length === paHabilidad.length) {
      console.log('array', array)
      dispatch({ type: AppAction.PA_HABILIDAD, payload: array });
      /* await updateDoc(pathRef, {
        preguntasAlternativas: array
      })
        .then(response => {
          getEvaluacionByIdCurricular(idCurricular)
        }) */
    }
  }


  const getEvaluacionByIdCurricular = async (idCurricular: string) => {
    const docRef = doc(db, "/evaluacion-curricular", idCurricular);
    const docSnap = await getDoc(docRef);

    if (docSnap.exists()) {
      console.log("Document data:", docSnap.data());
      dispatch({ type: AppAction.EVALUACION_CURRICULAR_BY_ID, payload: docSnap.data() })
    } else {
      // docSnap.data() will be undefined in this case
      console.log("No such document!");
    }
  }

  const salvarEvaluacionCurricular = async (idCurricular: string, dataDocente: User, data: PaHanilidad[]) => {
    /* console.log(`/usuarios/${dataDocente}/evaluacion-curricular/${idCurricular}`) */
    //tengo que traerme todas las evaluaciones curriculares de un docente por lo que usare collection

    /* console.log('dataDocente', dataDocente.grados?.find(grado => grado === 1 || grado === 2) ? 1 : dataDocente.grados?.find(grado => grado === 3 || grado === 4) ? 2 : 3) */
    await setDoc(doc(db, `/usuarios/${dataDocente.dni}/evaluacion-curricular`, idCurricular), {
      dataDocente,
      preguntasAlternativas: data,
      nivel: dataDocente.grados?.find(grado => grado === 1 || grado === 2) ? 1 : dataDocente.grados?.find(grado => grado === 3 || grado === 4) ? 2 : 3
    });
    await setDoc(doc(db, `/usuarios/${currentUserData.dni}/${idCurricular}`, `${dataDocente.dni}`), {
      ...dataDocente,
      preguntasAlternativas: data,
      nivel: dataDocente.grados?.find(grado => grado === 1 || grado === 2) ? 1 : dataDocente.grados?.find(grado => grado === 3 || grado === 4) ? 2 : 3
    });


    /*  dataDocente.grados?.forEach(async (grado) => {
       if (grado === 1 || grado === 2) {
         data.forEach(async (eva) => {
           const docRef = doc(db, `/reporte-curricular/${idCurricular}/${currentUserData.dni}/nivel1/nivel1`, `${eva.order}`)
           await setDoc(docRef, {
             n: 0,
             cn: 0,
             av: 0,
             f: 0,
             s: 0
           })
             .then(response => {
               if (eva.alternativas?.length === 5) {
                 eva.alternativas?.map(async (alt) => {
                   if (alt.selected === true && alt.acronimo === "n") {
                     await updateDoc(docRef, { n: increment(1) })
                   }
                   if (alt.selected === true && alt.acronimo === "cn") {
                     await updateDoc(docRef, { cn: increment(1) })
                   }
                   if (alt.selected === true && alt.acronimo === "av") {
                     await updateDoc(docRef, { av: increment(1) })
                   }
                   if (alt.selected === true && alt.acronimo === "f") {
                     await updateDoc(docRef, { f: increment(1) })
                   }
                   if (alt.selected === true && alt.acronimo === "s") {
                     await updateDoc(docRef, { s: increment(1) })
                   }
                 })
               }
             })
         })
       }
       if (grado === 3 || grado === 4) {
         data.forEach(async (eva) => {
           const docRef = doc(db, `/reporte-curricular/${idCurricular}/${currentUserData.dni}/nivel2/nivel2`, `${eva.order}`)
           await setDoc(docRef, {
             n: 0,
             cn: 0,
             av: 0,
             f: 0,
             s: 0
           })
             .then(response => {
               if (eva.alternativas?.length === 5) {
                 eva.alternativas?.map(async (alt) => {
                   if (alt.selected === true && alt.acronimo === "n") {
                     await updateDoc(docRef, { n: increment(1) })
                   }
                   if (alt.selected === true && alt.acronimo === "cn") {
                     await updateDoc(docRef, { cn: increment(1) })
                   }
                   if (alt.selected === true && alt.acronimo === "av") {
                     await updateDoc(docRef, { av: increment(1) })
                   }
                   if (alt.selected === true && alt.acronimo === "f") {
                     await updateDoc(docRef, { f: increment(1) })
                   }
                   if (alt.selected === true && alt.acronimo === "s") {
                     await updateDoc(docRef, { s: increment(1) })
                   }
                 })
               }
             })
         })
       }
       if (grado === 5 || grado === 6) {
         data.forEach(async (eva) => {
           const docRef = doc(db, `/reporte-curricular/${idCurricular}/${currentUserData.dni}/nivel3/nivel3`, `${eva.order}`)
           await setDoc(docRef, {
             n: 0,
             cn: 0,
             av: 0,
             f: 0,
             s: 0
           })
             .then(response => {
               if (eva.alternativas?.length === 5) {
                 eva.alternativas?.map(async (alt) => {
                   if (alt.selected === true && alt.acronimo === "n") {
                     await updateDoc(docRef, { n: increment(1) })
                   }
                   if (alt.selected === true && alt.acronimo === "cn") {
                     await updateDoc(docRef, { cn: increment(1) })
                   }
                   if (alt.selected === true && alt.acronimo === "av") {
                     await updateDoc(docRef, { av: increment(1) })
                   }
                   if (alt.selected === true && alt.acronimo === "f") {
                     await updateDoc(docRef, { f: increment(1) })
                   }
                   if (alt.selected === true && alt.acronimo === "s") {
                     await updateDoc(docRef, { s: increment(1) })
                   }
                 })
               }
             })
         })
       }
     }) */
  }
  const getEvaluacionCurricularDocente = async (dataDocente: string) => {
    console.log(`/usuarios/${dataDocente}/evaluacion-curricular`)
    dispatch({ type: AppAction.LOADER_PAGES, payload: true })
    onSnapshot(collection(db, `/usuarios/${dataDocente}/evaluacion-curricular`), (querySnapshot) => {
      const arrayEvaluaciones: EvaluacionCurricularAlternativa[] = [];
      querySnapshot.forEach((doc) => {
        console.log(doc.data())
        arrayEvaluaciones.push(doc.data());
      });
      dispatch({ type: AppAction.ALL_EVALUACIONES_CURRICULARES_DOCENTE, payload: arrayEvaluaciones })
      dispatch({ type: AppAction.LOADER_PAGES, payload: false })
    });
  }

  const getCaracteristicasCurricular = async () => {
    const pathRef = collection(db, '/caracteristica-curricular')
    const q = query(pathRef, orderBy('name', 'asc'))
    const arrayCaracteristicas: CaracteristicaCurricular[] = []
    await getDocs(q)
      .then(response => {
        response.forEach(doc => {
          arrayCaracteristicas.push({ ...doc.data() })
        })
        dispatch({ type: AppAction.CARACTERISTICA_CURRICULAR, payload: arrayCaracteristicas })
      })
  }

  const updateEvaluacionCurricular = async (idCurricular: string, name: string) => {
    await updateDoc(doc(db, "/evaluacion-curricular", idCurricular), {
      name: name
    })
  }
  const updateDocenteParaCoberturaCurricular = async (dataDocente: string, data: User, docente: User) => {
    await setDoc(doc(db, "usuarios", dataDocente), {
      nombres: data.nombres,
      apellidos: data.apellidos,
      dni: data.dni,
      institucion: data.institucion,
      region: data.region,
      area: data.area,
      grados: data.grados,
      secciones: data.secciones,
      caracteristicaCurricular: data.caracteristicaCurricular,
      distrito: data.distrito || '',
      celular: data.celular || '',
      dniDirector: docente.dniDirector,
      rol: docente.rol,
      perfil: docente.perfil,
      genero: data.genero,
    })
  }

  const guardarAnexosCurricular = async (dataDocente: User, data: AnexosCurricularType) => {
    if (dataDocente.caracteristicaCurricular) {
      await setDoc(doc(db, 'usuarios', `${dataDocente.dni}`), {
        ...dataDocente,
        observacionCurricular: data
      })
    }
  }

  const resetValuesEvaluarCurricular = () => {
    dispatch({ type: AppAction.PA_HABILIDAD, payload: [] })
    dispatch({ type: AppAction.EVALUACION_CURRICULAR, payload: [] })
    dispatch({ type: AppAction.EVALUACION_CURRICULAR_ALTERNATIVA, payload: [] })
  }

  const reporteCurricularDirectorFilter = (data:User[], {grado, orden, seccion}:{grado:string, orden:string, seccion:string}) => {
    const filteredData = data.reduce((acc: User[], docente) => {
      // Verificar si el docente tiene los grados y secciones necesarios
      const hasGrado = grado ? Array.isArray(docente.grados) && docente.grados.includes(Number(grado)) : true;
      const hasSeccion = seccion ? Array.isArray(docente.secciones) && docente.secciones.includes(Number(seccion)) : true;
      
      // Si el docente cumple con los filtros, lo agregamos al acumulador
      if (hasGrado && hasSeccion) {
        acc.push(docente);
      }
      
      return acc;
    }, []);

    // Ordenar los datos si se especifica un orden
    if (orden) {
      filteredData.sort((a, b) => {
        const nombreA = a.nombres || '';
        const nombreB = b.nombres || '';
        
        if (orden === 'asc') {
          return nombreA.localeCompare(nombreB);
        } else {
          return nombreB.localeCompare(nombreA);
        }
      });
    }
    console.log('filteredData', filteredData)
    dispatch({ type: AppAction.CURRICULAR_DIRECTOR_DATA_FILTER, payload: filteredData });
  }

  const reporteCD = async (idCurricular: string, dniDirector: string, nivel: string) => {

    const path = `usuarios/${dniDirector}/${idCurricular}`
    const pathRef = collection(db, path)
    const q = query(pathRef, where("nivel", "==", Number(nivel)))
    const docentesEvaluados: User[] = []

    const pathRefHabilidad = collection(db, `/evaluacion-curricular-preguntas-alternativas/nivel-${nivel}/preguntas`)
    const arrayEvaluacionHabilidad: EvaluacionHabilidad[] = []
    await getDocs(pathRefHabilidad)
      .then(response => {
        response.forEach(doc => {
          arrayEvaluacionHabilidad.push(doc.data())
        })
        dispatch({ type: AppAction.REPORT_PREGUNTA_HABILIDAD, payload: arrayEvaluacionHabilidad.sort((a: any, b: any) => a.order - b.order) })
      })
    const querySnapshot = await getDocs(q);
    const promises = querySnapshot.docs.map(doc => Promise.resolve(doc.data()));
    await Promise.all(promises).then(rta => {
      docentesEvaluados.push(...rta)
      dispatch({ type: AppAction.REPORT_CURRICULAR_DIRECTOR_DATA, payload: docentesEvaluados })
    })

    const rta =docentesEvaluados.reduce((acc, docente) => {
      docente.preguntasAlternativas?.forEach(respuesta => {
        if (respuesta.order === undefined) return;

        const orderId = respuesta.order.toString();
        let estadistica = acc.find(stat => stat.id === orderId);

        if (!estadistica) {
          // Inicializamos con todas las propiedades posibles
          estadistica = {
            id: orderId,
            n: 0,
            cn: 0,
            av: 0,
            f: 0,
            s: 0,
            total: 0
          };
          acc.push(estadistica);
        }

        respuesta.alternativas?.forEach(alternativa => {
          if (!alternativa.selected) return;

          switch (alternativa.acronimo) {
            case 'n': estadistica!.n = (estadistica!.n || 0) + 1; break;
            case 'cn': estadistica!.cn = (estadistica!.cn || 0) + 1; break;
            case 'av': estadistica!.av = (estadistica!.av || 0) + 1; break;
            case 'f': estadistica!.f = (estadistica!.f || 0) + 1; break;
            case 's': estadistica!.s = (estadistica!.s || 0) + 1; break;
          }
        });

        // Calculamos el total sumando todas las alternativas seleccionadas
        if (estadistica) {
          estadistica.total = (estadistica.n || 0) +
            (estadistica.cn || 0) +
            (estadistica.av || 0) +
            (estadistica.f || 0) +
            (estadistica.s || 0);
        }
      });
      dispatch({ type: AppAction.REPORT_CURRICULAR_DIRECTOR, payload: acc.sort((a: any, b: any) => a.id - b.id)})
      return acc;
    }, [] as DataEstadisticasCurricular[]);
  }
  return {
    createEvaluacionCurricular,
    getEvaluacionCurricular,
    addPreguntasAlternativasCurricular,
    getDocentesFromDirectores,
    getDocente,
    getPreguntaAlternativaCurricular,
    generateEvaluacionCurricular,
    getEvaluacionCurricularAlternativa,
    getEvaluacionByIdCurricular,
    salvarEvaluacionCurricular,
    getEvaluacionCurricularDocente,
    getCaracteristicasCurricular,
    updateDocenteParaCoberturaCurricular,
    guardarAnexosCurricular,
    resetValuesEvaluarCurricular,
    reporteCD,
    updateEvaluacionCurricular,
    reporteCurricularDirectorFilter
  }
}
export default useEvaluacionCurricular