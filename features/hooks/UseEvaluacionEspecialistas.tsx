import {
  AlternativasDocente,
  CrearEvaluacionDocente,
  DataEstadisticas,
  DataEstadisticasDocente,
  PRDocentes,
  PreviewPRDocentes,
  ReporteDocenteIndividual,
  User,
} from '../types/types';
import {
  onSnapshot,
  addDoc,
  query,
  where,
  deleteDoc,
  doc,
  collection,
  getDocs,
  getFirestore,
  setDoc,
  updateDoc,
  getDoc,
  increment,
  orderBy,
} from 'firebase/firestore';
import { useGlobalContext, useGlobalContextDispatch } from '../context/GlolbalContext';
import { AppAction } from '../actions/appAction';
import {} from 'firebase/firestore/lite';
import { currentMonth, currentYear } from '@/fuctions/dates';

// Función para calcular estadísticas de especialistas
const calcularEstadisticasEspecialistas = (especialistasEvaluacion: User[]): DataEstadisticas[] => {
  return especialistasEvaluacion.reduce((acc: DataEstadisticas[], especialista: User) => {
    especialista.resultadosSeguimientoRetroalimentacion?.forEach((respuesta: PRDocentes) => {
      if (respuesta.order === undefined) return;

      const orderId = respuesta.order.toString();
      let estadistica = acc.find((stat: DataEstadisticas) => stat.id === orderId);

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

      respuesta.alternativas?.forEach((alternativa: AlternativasDocente) => {
        if (!alternativa.selected) return;

        switch (alternativa.alternativa) {
          case 'a': estadistica!.a = (estadistica!.a || 0) + 1; break;
          case 'b': estadistica!.b = (estadistica!.b || 0) + 1; break;
          case 'c': estadistica!.c = (estadistica!.c || 0) + 1; break;
          case 'd': estadistica!.d = (estadistica!.d || 0) + 1; break;
        }
      });

      // Calculamos el total basado en las alternativas presentes
      const alternativasPresentes = respuesta.alternativas?.some((alt: AlternativasDocente) => alt.alternativa === 'd');
      if (alternativasPresentes) {
        estadistica!.total = (estadistica!.a || 0) + (estadistica!.b || 0) + (estadistica!.c || 0) + (estadistica!.d || 0);
      } else {
        estadistica!.total = (estadistica!.a || 0) + (estadistica!.b || 0) + (estadistica!.c || 0);
        // Si no hay alternativa 'd', la establecemos como undefined
        estadistica!.d = undefined;
      }
    });
    return acc;
  }, [] as DataEstadisticas[]);
};
import { useState } from 'react';

const UseEvaluacionEspecialistas = () => {
  const dispatch = useGlobalContextDispatch();
  const { currentUserData } = useGlobalContext();
  const db = getFirestore();

  const [evaluacionEspecialista, setEvaluacionEspecialista] = useState<CrearEvaluacionDocente>({});
  const [dataEvaluaciones, setDataEvaluaciones] = useState<DataEstadisticas[]>([]);
  const [allEvaluacionesEspecialistas, setAllEvaluacionesEspecialistas] = useState<User[]>([]);
  const createEvaluacionesEspecialistas = async (data: CrearEvaluacionDocente) => {
    await addDoc(collection(db, 'evaluaciones-especialista'), data);
  };

  const updateEvaluacionDesempeñoDirectivo = async (idEvaluacion: string, name: string) => {
    console.log('idEvaluacion', idEvaluacion);
    console.log('name', name);
    const pathRef = doc(db, `/evaluaciones-director`, `${idEvaluacion}`);
    await updateDoc(pathRef, { name: name });
  };

  const getAllReporteDeDirectoreToEspecialistas = async (
    idEvaluacion: string,
    month: number,
    currentUserData: User
  ) => {
    const directoresDelEspecialista: ReporteDocenteIndividual[] = [];
    const pathRef = collection(db, `/reporte-directores/${idEvaluacion}/${currentYear}-${month}`);
    const q = query(pathRef, where('info.region', '==', currentUserData.region));
    /* const pathAdmin = collection(db, `/reporte-directores/${idEvaluacion}/${currentYear}-${month}`) */
    const querySnapshot = await getDocs(currentUserData.rol === 4 ? pathRef : q);

    querySnapshot.forEach((doc) => {
      directoresDelEspecialista.push(doc.data() as User);
    });

    dispatch({
      type: AppAction.ALL_EVALUACIONES_DIRECTOR_DOCENTE,
      payload: directoresDelEspecialista,
    });
    return directoresDelEspecialista;
  };

  const getReporteDeDirectoresToEspecialistaTabla = async (
    data: ReporteDocenteIndividual[],
    filtros: {
      region: string;
      orden: string;
      genero: string;
      distrito: string;
      area: string;
      caracteristicaCurricular: string;
    }
  ) => {
    const dataFiltrada = data?.reduce((acc, docente) => {
      // Si no hay filtros, retornar todos los datos
      if (
        !filtros.region &&
        !filtros.genero &&
        !filtros.distrito &&
        !filtros.area &&
        !filtros.caracteristicaCurricular
      ) {
        return data;
      }

      let cumpleFiltros = true;

      // Filtrar por región si está presente
      if (filtros.region && docente.info?.region) {
        if (docente.info.region.toString() !== filtros.region) {
          cumpleFiltros = false;
        }
      }

      // Filtrar por género si está presente
      if (filtros.genero && docente.info?.genero) {
        if (docente.info.genero.toString() !== filtros.genero) {
          cumpleFiltros = false;
        }
      }

      // Filtrar por distrito si está presente
      if (filtros.distrito && docente.info?.distrito) {
        if (docente.info.distrito !== filtros.distrito) {
          cumpleFiltros = false;
        }
      }

      // Filtrar por área si está presente
      if (filtros.area && docente.info?.area) {
        if (docente.info.area.toString() !== filtros.area) {
          cumpleFiltros = false;
        }
      }

      // Filtrar por característica curricular si está presente
      if (filtros.caracteristicaCurricular && docente.info?.caracteristicaCurricular) {
        if (docente.info.caracteristicaCurricular !== filtros.caracteristicaCurricular) {
          cumpleFiltros = false;
        }
      }

      if (cumpleFiltros) {
        acc.push(docente);
      }
      return acc;
    }, [] as ReporteDocenteIndividual[]);

    // Ordenar por calificación si se especifica
    if (filtros.orden) {
      dataFiltrada.sort((a, b) => {
        if (filtros.orden === '1') {
          return (a.calificacion || 0) - (b.calificacion || 0);
        } else {
          return (b.calificacion || 0) - (a.calificacion || 0);
        }
      });
    }
    /*  dispatch({ type: AppAction.ALL_EVALUACIONES_DIRECTOR_DOCENTE, payload: dataFiltrada }) */
    dispatch({ type: AppAction.DATA_FILTRADA_ESPECIALISTA_DIRECTOR_TABLA, payload: dataFiltrada });
    convertDataEstadisticasYGraficos(dataFiltrada);
    return dataFiltrada;
  };
  const convertDataEstadisticasYGraficos = (data: ReporteDocenteIndividual[]) => {
    const estadisticas = data.reduce((acc, docente) => {
      docente.resultados?.forEach((respuesta) => {
        if (respuesta.order === undefined) return;

        const orderId = respuesta.order.toString();
        let estadistica = acc.find((stat) => stat.id === orderId);

        if (!estadistica) {
          estadistica = {
            id: orderId,
            a: 0,
            b: 0,
            c: 0,
            d: 0,
            total: 0,
          };
          acc.push(estadistica);
        }

        respuesta.alternativas?.forEach((alternativa) => {
          if (!alternativa.selected) return;

          switch (alternativa.alternativa) {
            case 'a':
              estadistica!.a = (estadistica!.a || 0) + 1;
              break;
            case 'b':
              estadistica!.b = (estadistica!.b || 0) + 1;
              break;
            case 'c':
              estadistica!.c = (estadistica!.c || 0) + 1;
              break;
            case 'd':
              estadistica!.d = (estadistica!.d || 0) + 1;
              break;
          }
        });

        const alternativasPresentes = respuesta.alternativas?.some(
          (alt) => alt.alternativa === 'd'
        );
        if (alternativasPresentes) {
          estadistica!.total =
            (estadistica!.a || 0) +
            (estadistica!.b || 0) +
            (estadistica!.c || 0) +
            (estadistica!.d || 0);
        } else {
          estadistica!.total =
            (estadistica!.a || 0) + (estadistica!.b || 0) + (estadistica!.c || 0);
          estadistica!.d = undefined;
        }
      });
      return acc;
    }, [] as DataEstadisticas[]);

    /* dispatch({ type: AppAction.DATA_FILTRADA_DIRECTOR_DOCENTE_TABLA, payload: resultadosDocentes }) */
    dispatch({ type: AppAction.DATA_ESTADISTICAS, payload: estadisticas });
  };
  const reporteDeEspecialistaToDirectore = async (
    idEvaluacion: string,
    month: number,
    currentUserData: User
  ) => {
    /*  currentUserData.rol === 4  */
    const reporteEspecialistaDirectores = await getAllReporteDeDirectoreToEspecialistas(
      idEvaluacion,
      month,
      currentUserData
    );
    console.log('reporteEspecialistaDirectores', reporteEspecialistaDirectores);
    const estadisticas = reporteEspecialistaDirectores.reduce((acc, docente) => {
      docente.resultados?.forEach((respuesta) => {
        if (respuesta.order === undefined) return;

        const orderId = respuesta.order.toString();
        let estadistica = acc.find((stat) => stat.id === orderId);

        if (!estadistica) {
          estadistica = {
            id: orderId,
            a: 0,
            b: 0,
            c: 0,
            d: 0,
            total: 0,
          };
          acc.push(estadistica);
        }

        respuesta.alternativas?.forEach((alternativa) => {
          if (!alternativa.selected) return;

          switch (alternativa.alternativa) {
            case 'a':
              estadistica!.a = (estadistica!.a || 0) + 1;
              break;
            case 'b':
              estadistica!.b = (estadistica!.b || 0) + 1;
              break;
            case 'c':
              estadistica!.c = (estadistica!.c || 0) + 1;
              break;
            case 'd':
              estadistica!.d = (estadistica!.d || 0) + 1;
              break;
          }
        });

        const alternativasPresentes = respuesta.alternativas?.some(
          (alt) => alt.alternativa === 'd'
        );
        if (alternativasPresentes) {
          estadistica!.total =
            (estadistica!.a || 0) +
            (estadistica!.b || 0) +
            (estadistica!.c || 0) +
            (estadistica!.d || 0);
        } else {
          estadistica!.total =
            (estadistica!.a || 0) + (estadistica!.b || 0) + (estadistica!.c || 0);
          estadistica!.d = undefined;
        }
      });
      return acc;
    }, [] as DataEstadisticas[]);
    console.log('estadisticas', estadisticas);
    return dispatch({ type: AppAction.DATA_ESTADISTICAS, payload: estadisticas });
  };

  const getDataEvaluacionEspecialistas = (idEvaluacion: string) => {
    onSnapshot(doc(db, '/evaluaciones-especialista', idEvaluacion), (doc) => {
      if (doc.exists()) {
        setEvaluacionEspecialista(doc.data());
      }
    });
    /* onSnapshot(collection(db, "/evaluaciones-especialista"), (querySnapshot) => {
      const arrayEvaluaciones: CrearEvaluacionDocente[] = [];
      querySnapshot.forEach((doc) => {
        arrayEvaluaciones.push({ ...doc.data(), id: doc.id });
      });
      
    }); */
  };
  const getDataEvaluacion = (idEvaluacion: string) => {
    onSnapshot(doc(db, '/evaluaciones-director', idEvaluacion), (doc) => {
      if (doc.exists()) {
        dispatch({ type: AppAction.DATA_EVALUACION_DOCENTE, payload: doc.data() });
      }
    });
    onSnapshot(collection(db, '/evaluaciones-director'), (querySnapshot) => {
      const arrayEvaluaciones: CrearEvaluacionDocente[] = [];
      querySnapshot.forEach((doc) => {
        arrayEvaluaciones.push({ ...doc.data(), id: doc.id });
      });
      dispatch({ type: AppAction.EVALUACIONES_DOCENTES, payload: arrayEvaluaciones });
    });
  };
  const getEvaluacionesEspecialistas = () => {
    dispatch({ type: AppAction.LOADER_PAGES, payload: true });
    onSnapshot(collection(db, '/evaluaciones-especialista'), (querySnapshot) => {
      const arrayEvaluaciones: CrearEvaluacionDocente[] = [];
      querySnapshot.forEach((doc) => {
        console.log(doc.data());
        arrayEvaluaciones.push({ ...doc.data(), id: doc.id });
      });
      dispatch({ type: AppAction.EVALUACIONES_DOCENTES, payload: arrayEvaluaciones });
      dispatch({ type: AppAction.LOADER_PAGES, payload: false });
    });
  };

  const deleteEvaluacionEspecilistas = async (id: string) => {
    await deleteDoc(doc(db, 'evaluaciones-especialista', id));
  };
  const addPreguntasEvaluacionEspecialistas = async (
    data: PreviewPRDocentes,
    idEvaluacion: string
  ) => {
    dispatch({ type: AppAction.LOADER_MODALES, payload: true });
    const path = `/evaluaciones-especialista/${idEvaluacion}/preguntasRespuestas`;
    const pathRef = collection(db, path);
    await getDocs(pathRef).then(async (response) => {
      const arrayAlternativa: AlternativasDocente[] = [];
      for (const [key, value] of Object.entries(data)) {
        if (key === 'a') {
          arrayAlternativa.push({ value: 1, descripcion: value, alternativa: 'a' });
        }
        if (key === 'b') {
          arrayAlternativa.push({ value: 2, descripcion: value, alternativa: 'b' });
        }
        if (key === 'c') {
          arrayAlternativa.push({ value: 3, descripcion: value, alternativa: 'c' });
        }
        if (key === 'd') {
          arrayAlternativa.push({ value: 4, descripcion: value, alternativa: 'd' });
        }
      }
      await setDoc(doc(db, path, `${response.size + 1}`), {
        alternativas: arrayAlternativa,
        id: `${response.size + 1}`,
        criterio: data.criterio,
        order: response.size + 1,
      }).then((rta) => {
        dispatch({ type: AppAction.LOADER_MODALES, payload: false });
      });
    });
  };

  const getPreguntasRespuestasEspecialistas = async (idEvaluacion: string) => {
    dispatch({ type: AppAction.LOADER_PAGES, payload: true });
    const path = `/evaluaciones-especialista/${idEvaluacion}/preguntasRespuestas`;
    const q = query(collection(db, path), orderBy('order', 'asc'));
    onSnapshot(q, (querySnapshot) => {
      const arrayPreguntaRespuestaDocentes: PreviewPRDocentes[] = [];
      querySnapshot.forEach((doc) => {
        arrayPreguntaRespuestaDocentes.push({ ...doc.data(), id: doc.id });
      });
      dispatch({
        type: AppAction.GET_PREGUNTA_RESPUESTA_DOCENTE,
        payload: arrayPreguntaRespuestaDocentes,
      });
      dispatch({ type: AppAction.LOADER_PAGES, payload: false });
    });
  };
  const getPREspecialistaDirector = async (idEvaluacion: string) => {
    dispatch({ type: AppAction.LOADER_PAGES, payload: true });
    const path = `/evaluaciones-director/${idEvaluacion}/preguntasRespuestas`;
    const q = query(collection(db, path), orderBy('order', 'asc'));
    onSnapshot(q, (querySnapshot) => {
      const arrayPreguntaRespuestaDocentes: PreviewPRDocentes[] = [];
      querySnapshot.forEach((doc) => {
        arrayPreguntaRespuestaDocentes.push({ ...doc.data(), id: doc.id });
      });
      dispatch({
        type: AppAction.GET_PREGUNTA_RESPUESTA_DOCENTE,
        payload: arrayPreguntaRespuestaDocentes,
      });
      dispatch({ type: AppAction.LOADER_PAGES, payload: false });
    });
  };
  const updatePreResEspecialistas = async (data: PRDocentes, idEvaluacion: string) => {
    const path = `/evaluaciones-especialista/${idEvaluacion}/preguntasRespuestas`;
    const pathRef = doc(db, path, `${data.id}`);
    await updateDoc(pathRef, data);
  };

  const buscarDocente = async (dni: string) => {
    dispatch({ type: AppAction.WARNING_DATA_DOCENTE, payload: '' });
    const docRef = doc(db, 'usuarios', `${dni}`);
    const docSnap = await getDoc(docRef);

    if (docSnap.exists()) {
      if (docSnap.data().rol === 2) {
        console.log('pertenece a la institucion');
        dispatch({ type: AppAction.DATA_DOCENTE, payload: docSnap.data() });
      } else {
        dispatch({ type: AppAction.DATA_DOCENTE, payload: {} });
        dispatch({
          type: AppAction.WARNING_DATA_DOCENTE,
          payload: 'no se encontro docente con el numero de dni',
        });
      }
    } else {
      dispatch({ type: AppAction.DATA_DOCENTE, payload: {} });
      dispatch({
        type: AppAction.WARNING_DATA_DOCENTE,
        payload: 'no se encontro docente con el numero de dni',
      });
    }
  };

  const buscarEspecialista = async (dni: string) => {
    dispatch({ type: AppAction.WARNING_DATA_DOCENTE, payload: '' });
    const docRef = doc(db, 'usuarios', `${dni}`);
    const docSnap = await getDoc(docRef);

    if (docSnap.exists()) {
      if (docSnap.data().rol === 1) {
        console.log('es un especialista');
        dispatch({ type: AppAction.DATA_DIRECTOR, payload: docSnap.data() });
      } else {
        dispatch({ type: AppAction.DATA_DIRECTOR, payload: {} });
        dispatch({ type: AppAction.WARNING_DATA_DOCENTE, payload: 'no se encontro especialista' });
      }
    } else {
      dispatch({ type: AppAction.DATA_DIRECTOR, payload: {} });
      dispatch({ type: AppAction.WARNING_DATA_DOCENTE, payload: 'no se encontro especialista' });
    }
  };
  const buscarEspecialistaReporteDeEvaluacion = async (idEvaluacion: string, idDocente: string) => {
    console.log('currentUserData?.dni', currentUserData?.dni);
    if (idEvaluacion.length > 0 && idDocente.length > 0) {
      console.log('path', `/usuarios/${currentUserData?.dni}/${idEvaluacion}`);
      const path = doc(db, `/usuarios/${currentUserData?.dni}/${idEvaluacion}`, idDocente);
      await getDoc(path).then((response) => {
        if (response.exists()) {
          console.log('response.data()', response.data());
          dispatch({ type: AppAction.REPORTE_INDIVIDUAL_DOCENTE, payload: response.data() });
        }
      });
    }
  };
  const resetDirector = () => {
    dispatch({ type: AppAction.DATA_DIRECTOR, payload: {} });
  };
  const resetEspecialista = () => {
    dispatch({ type: AppAction.DATA_DIRECTOR, payload: {} });
  };
  const resetDocente = () => {
    dispatch({ type: AppAction.DATA_DOCENTE, payload: {} });
  };
  // Función para calcular la calificación del especialista
  const calcularCalificacionEspecialista = (data: PRDocentes[]): number => {
    let calificacionTotal = 0;

    // Iterar sobre cada pregunta en el array data
    data.forEach((pregunta) => {
      // Verificar si la pregunta tiene alternativas
      if (pregunta.alternativas && Array.isArray(pregunta.alternativas)) {
        // Buscar las alternativas que tengan selected: true
        pregunta.alternativas.forEach((alternativa) => {
          if (alternativa.selected === true && typeof alternativa.value === 'number') {
            calificacionTotal += alternativa.value;
          }
        });
      }
    });

    return calificacionTotal;
  };

  const guardarEvaluacionEspecialistas = async (
    idEvaluacion: string,
    data: PRDocentes[],
    especialista: User,
    observacion: string
  ) => {
    // Calcular la calificación del especialista
    const calificacion = calcularCalificacionEspecialista(data);

    console.log('data', data);
    console.log('Calificación calculada:', calificacion);

    /* const docRef = doc(db, `/evaluaciones-especialista/${idEvaluacion}/2025-9`, `${pr.order}`); */
    const path = doc(
      db,
      `/evaluaciones-especialista/${idEvaluacion}/2025-9`,
      `${especialista.dni}`
    );

    // Guardar la evaluación con la calificación calculada
    await setDoc(path, {
      ...especialista,
      resultadosSeguimientoRetroalimentacion: data,
      calificacion: calificacion,
      observacionesSeguimientoRetroalimentacion: observacion || '',
    });
  };
  const reporteEvaluacionDocenteAdmin = (idEvaluacion: string, dniDirector: string) => {
    dispatch({ type: AppAction.LOADER_PAGES, payload: true });
    buscarEspecialista(dniDirector);
    const path = `/evaluaciones-director/${idEvaluacion}/${dniDirector}/`;
    const refData = collection(db, path);
    const arrayDataEstadisticas: DataEstadisticas[] = [];

    const newPromise = new Promise<DataEstadisticas[]>(async (resolve, reject) => {
      try {
        await getDocs(refData).then((response) => {
          let index = 0;
          response.forEach((doc) => {
            index = index + 1;
            console.log('index', index);
            console.log('response.size', response.size);
            arrayDataEstadisticas.push({
              ...doc.data(),
              id: doc.id,
              total:
                doc.data().d === undefined
                  ? Number(doc.data().a) + Number(doc.data().b) + Number(doc.data().c)
                  : Number(doc.data().a) +
                    Number(doc.data().b) +
                    Number(doc.data().c) +
                    Number(doc.data().d),
            });
          });
          if (response.size === index) {
            arrayDataEstadisticas.sort((a: any, b: any) => a.id - b.id);
            resolve(arrayDataEstadisticas);
          }
        });
      } catch (error) {
        console.log('error', error);
        reject();
      }
    });
    newPromise.then((res) => {
      dispatch({ type: AppAction.DATA_ESTADISTICAS, payload: arrayDataEstadisticas });
      dispatch({ type: AppAction.LOADER_PAGES, payload: false });
    });
  };

  const reporteEvaluacionesDirectores = (idEvaluacion: string) => {
    const directoresDelEspecialista: ReporteDocenteIndividual[] = [];
    const getDirectorIdRef = collection(db, `usuarios/${currentUserData.dni}/${idEvaluacion}`);
    const getDniDirectoresDeEspecialistas = new Promise<ReporteDocenteIndividual[]>(
      async (resolve, reject) => {
        try {
          const docenteSnapshot = await getDocs(getDirectorIdRef);
          if (docenteSnapshot.size === 0) {
            dispatch({ type: AppAction.LOADER_PAGES, payload: false });
            /* reject(new Error('No se encontraron docentes')); */
            return;
          }

          const procesarDocentes = docenteSnapshot.docs.map((doc) => {
            return new Promise<void>((resolve) => {
              directoresDelEspecialista.push(doc.data());
              resolve();
            });
          });

          await Promise.all(procesarDocentes);
          resolve(directoresDelEspecialista);
        } catch (error) {
          console.log('error', error);
          reject();
        }
      }
    );
    getDniDirectoresDeEspecialistas.then(async (directores) => {
      console.log('directores', directores);
      //mando el dispatch para los datos filtrados
      dispatch({ type: AppAction.ALL_EVALUACIONES_ESPECIALISTA_DIRECTOR, payload: directores });
      const dataEstadisticasEstudiantes = directores.reduce((acc, docente) => {
        docente.resultados?.forEach((respuesta) => {
          if (respuesta.order === undefined) return;

          const orderId = respuesta.order.toString();
          let estadistica = acc.find((stat) => stat.id === orderId);

          if (!estadistica) {
            // Inicializamos con todas las propiedades posibles
            estadistica = {
              id: orderId,
              a: 0,
              b: 0,
              c: 0,
              d: 0,
              total: 0,
            };
            acc.push(estadistica);
          }

          respuesta.alternativas?.forEach((alternativa) => {
            if (!alternativa.selected) return;

            switch (alternativa.alternativa) {
              case 'a':
                estadistica!.a = (estadistica!.a || 0) + 1;
                break;
              case 'b':
                estadistica!.b = (estadistica!.b || 0) + 1;
                break;
              case 'c':
                estadistica!.c = (estadistica!.c || 0) + 1;
                break;
              case 'd':
                estadistica!.d = (estadistica!.d || 0) + 1;
                break;
            }
          });

          // Calculamos el total basado en las alternativas presentes
          const alternativasPresentes = respuesta.alternativas?.some(
            (alt) => alt.alternativa === 'd'
          );
          if (alternativasPresentes) {
            estadistica!.total =
              (estadistica!.a || 0) +
              (estadistica!.b || 0) +
              (estadistica!.c || 0) +
              (estadistica!.d || 0);
          } else {
            estadistica!.total =
              (estadistica!.a || 0) + (estadistica!.b || 0) + (estadistica!.c || 0);
            // Si no hay alternativa 'd', la establecemos como undefined
            estadistica!.d = undefined;
          }
        });
        dispatch({ type: AppAction.DATA_ESTADISTICAS, payload: acc });
        return acc;
      }, [] as DataEstadisticas[]);
    });
  };
  const filtrarDataEspecialistaDirectorTabla = (
    data: ReporteDocenteIndividual[],
    filtros: { provincia: string }
  ) => {
    console.log('data', data);
    console.log('filtros', filtros);
    const dataFiltrada = data.filter((doc) => doc.info?.distrito === filtros.provincia);

    console.log('dataFiltrada', dataFiltrada);
    dispatch({ type: AppAction.DATA_FILTRADA_ESPECIALISTA_DIRECTOR_TABLA, payload: dataFiltrada });
  };
  const getPreguntasRespuestasDesempeñoDirectivo = async (idEvaluacion: string) => {
    dispatch({ type: AppAction.LOADER_PAGES, payload: true });
    const path = `/evaluaciones-director/${idEvaluacion}/preguntasRespuestas`;
    const q = query(collection(db, path), orderBy('order', 'asc'));
    onSnapshot(q, (querySnapshot) => {
      const arrayPreguntaRespuestaDocentes: PreviewPRDocentes[] = [];
      querySnapshot.forEach((doc) => {
        arrayPreguntaRespuestaDocentes.push({ ...doc.data(), id: doc.id });
      });
      dispatch({
        type: AppAction.GET_PREGUNTA_RESPUESTA_DOCENTE,
        payload: arrayPreguntaRespuestaDocentes,
      });
      dispatch({ type: AppAction.LOADER_PAGES, payload: false });
    });
  };

  const getPRDocentes = async (idEvaluacion: string) => {
    console.log('rta', idEvaluacion);
    const pethRef = collection(db, `/evaluaciones-docentes/${idEvaluacion}/preguntasRespuestas`);
    const q = query(pethRef, orderBy('order', 'asc'));

    const newPromise = new Promise<AlternativasDocente[]>(async (resolve, reject) => {
      try {
        let index = 0;
        await getDocs(q).then((response) => {
          index = index + 1;
          let preguntasrespuestas: AlternativasDocente[] = [];
          response.forEach((doc) => {
            preguntasrespuestas.push({ ...doc.data(), id: doc.id });
            if (index === response.size) {
              resolve(preguntasrespuestas);
            }
          });
        });
      } catch (error) {
        console.log('error', error);
        reject();
      }
    });
    newPromise.then((res) => {
      dispatch({ type: AppAction.PREGUNTAS_RESPUESTAS, payload: res });
      dispatch({ type: AppAction.LOADER_PAGES, payload: false });
    });
  };

  const agregarObservacionEspecialistas = async (
    idEvaluacion: string,
    idUsuarioEvaluado: string,
    valueObservacion: string
  ) => {
    dispatch({ type: AppAction.LOADER_SALVAR_PREGUNTA, payload: false });
    console.log('datos:', idEvaluacion, idUsuarioEvaluado, valueObservacion);
    const path = `/evaluaciones-especialista/${idEvaluacion}/2025-9/`;
    const pathRef = doc(db, path, `${idUsuarioEvaluado}`);
    await updateDoc(pathRef, {
      observacionesSeguimientoRetroalimentacion: valueObservacion || '',
    });
    dispatch({ type: AppAction.LOADER_SALVAR_PREGUNTA, payload: false });
  };

  const reporteUgelGlobal = async (ugel: number, idEvaluacion: string, totalPreguntas: number) => {
    console.log('etrnamos');
    dispatch({ type: AppAction.REPORTE_REGIONAL, payload: [] });
    dispatch({ type: AppAction.LOADER_PAGES, payload: true });
    const usuariosUgel = collection(db, 'usuarios');

    const q = query(usuariosUgel, where('region', '==', Number(ugel)), where('rol', '==', 1));
    const arrayDirectoresUgel: string[] = [];
    const getDirectoresPromise = new Promise<string[]>(async (resolve, reject) => {
      let index = 0;
      try {
        await getDocs(q).then((directores) => {
          if (directores.size === 0) {
            dispatch({ type: AppAction.REPORTE_REGIONAL, payload: [] });
            dispatch({ type: AppAction.LOADER_PAGES, payload: false });
          } else {
            directores.forEach((doc) => {
              index = index + 1;
              arrayDirectoresUgel.push(doc.data().dni);
              if (index === directores.size) {
                resolve(arrayDirectoresUgel);
              }
            });
          }
        });
      } catch (error) {
        reject();
      }
    });
    getDirectoresPromise.then((directores) => {
      const testPromise = directores.map(async (director) => {
        const path = `/evaluaciones-especialista/${idEvaluacion}/${director}`;
        const pathRef = collection(db, path);
        return new Promise(async (resolve: any) => {
          await getDocs(pathRef).then((rta) => {
            const arrayOrdenadoRespuestas: any = [];
            rta.forEach((doc) => {
              arrayOrdenadoRespuestas.push({ ...doc.data(), id: doc.id });
            });
            resolve(arrayOrdenadoRespuestas);
          });
        });
      });
      const respuestasDirectores: any = Promise.allSettled(testPromise);
      respuestasDirectores.then((response: DataEstadisticasDocente[]) => {
        let arrayAcumulativoDeRespuestas: DataEstadisticasDocente[] = [];
        let index = 0;
        response.forEach((resultado: any) => {
          index = index + 1;
          if (resultado.value.length > 0) {
            console.log('entro');
            if (arrayAcumulativoDeRespuestas.length === 0) {
              const arrayOrdenadoRespuesta: DataEstadisticasDocente[] = [];
              resultado.value.forEach((a: DataEstadisticasDocente) => {
                arrayOrdenadoRespuesta.push({
                  ...a,
                  total: a.a + a.b + a.c + a.d,
                });
              });
              arrayOrdenadoRespuesta
                .sort((a: any, b: any) => a.id - b.id)
                .forEach((a) => arrayAcumulativoDeRespuestas.push(a));
            } else {
              const arrayOrdenadoRespuestas: DataEstadisticasDocente[] = [];
              resultado.value.forEach((a: any) => {
                arrayOrdenadoRespuestas.push({
                  ...a,
                  total: a.a + a.b + a.c + a.d,
                });
              });
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
            dispatch({ type: AppAction.REPORTE_REGIONAL, payload: arrayAcumulativoDeRespuestas });
            dispatch({ type: AppAction.LOADER_PAGES, payload: false });
          }
        });
      });
    });
  };
  const updateEvaluacionEspecialista = async (idCurricular: string, name: string) => {
    console.log('idCurricular', idCurricular);
    console.log('name', name);
    await updateDoc(doc(db, '/evaluaciones-especialista', idCurricular), {
      name: name,
    });
  };
  const buscarDirectorReporteDeEvaluacion = (idEvaluacion: string, idDirector: string) => {
    /* const path = `/usuarios/${currentUserData.dni}/${idEvaluacion}/${idDirector}` */
    const path = `/reporte-directores/${idEvaluacion}/${currentYear}-${currentMonth}/`;
    const docRef = doc(db, path, `${idDirector}`);
    getDoc(docRef)
      .then((response) => {
        console.log('response', response.data());
        if (response.exists()) {
          console.log('response.data()', response.data());
          dispatch({ type: AppAction.REPORTE_INDIVIDUAL_DOCENTE, payload: response.data() });
        }
      })
      .catch((error) => console.log('error', error));
  };

  const reporteTablaEvaluacionEspecialista = (
    data: ReporteDocenteIndividual[],
    { region, orden }: { region: string; orden: string }
  ) => {
    console.log('entre en la funcion');
    console.log('region', region);
    console.log('orden', orden);
    const dataFiltrada = data?.reduce((acc, docente) => {
      // Si no hay filtros, retornar todos los datos
      if (!region) {
        return data;
      }

      // Filtrar por región si está presente
      if (region && docente.info?.region) {
        if (docente.info.region.toString() === region) {
          acc.push(docente);
        }
      }
      return acc;
    }, [] as ReporteDocenteIndividual[]);

    // Ordenar por calificación si se especifica
    if (orden) {
      dataFiltrada.sort((a, b) => {
        if (orden === 'asc') {
          return (a.calificacion || 0) - (b.calificacion || 0);
        } else {
          return (b.calificacion || 0) - (a.calificacion || 0);
        }
      });
    }
    console.log('dataFiltrada', dataFiltrada);
    dispatch({ type: AppAction.DATA_FILTRADA_ESPECIALISTA_DIRECTOR_TABLA, payload: dataFiltrada });
  };
const filtrosEvaluacionEspecialistasSeguimientoRetroalimentacion = () => {

}
  const getAllEvaluacionesEspecialistas = (idEvaluacion: string) => {
    const path = `/evaluaciones-especialista/${idEvaluacion}/2025-9`;
    const refData = collection(db, path);

    onSnapshot(refData, (docenteSnapshot) => {
      const docentesDelDirector: User[] = [];
      docenteSnapshot.forEach((doc) => {
        docentesDelDirector.push(doc.data() as User);
      });
      setAllEvaluacionesEspecialistas(docentesDelDirector);
    });
  };
  const reporteEvaluacionEspecialistas = async (idEvaluacion: string) => {
    dispatch({ type: AppAction.DATA_ESTADISTICAS, payload: [] });
    getAllEvaluacionesEspecialistas(idEvaluacion);
    //const path = doc(db, `/evaluaciones-especialista/${idEvaluacion}/2025-9`, `${especialista.dni}`)
    const path = `/evaluaciones-especialista/${idEvaluacion}/2025-9/`;
    const rtaEvaluacionesEspecialistas = collection(db, path);

    const especialistasEvaluacion: User[] = [];
    const getDocenterIdRef = collection(db, `usuarios/${currentUserData.dni}/${idEvaluacion}`);
    //me traigo a todos los docentes que estan acargo del director

    //aqui debemos de validar si existe evaluaciones de los docentes de dicha evalucion
    const docenteSnapshot = await getDocs(rtaEvaluacionesEspecialistas);
    docenteSnapshot.forEach((doc) => {
      especialistasEvaluacion.push(doc.data());
    });
    // Calcular estadísticas de especialistas usando la función
    const dataEstadisticasEspecialistas = calcularEstadisticasEspecialistas(especialistasEvaluacion);
    setDataEvaluaciones(dataEstadisticasEspecialistas);
    // Guardar las estadísticas de especialistas en el estado global
    dispatch({ type: AppAction.DATA_ESTADISTICAS, payload: dataEstadisticasEspecialistas });
  };

  return {
    createEvaluacionesEspecialistas,
    reporteEvaluacionEspecialistas,
    getEvaluacionesEspecialistas,
    deleteEvaluacionEspecilistas,
    addPreguntasEvaluacionEspecialistas,
    getPreguntasRespuestasEspecialistas,
    updatePreResEspecialistas,
    buscarDocente,
    guardarEvaluacionEspecialistas,
    getPRDocentes,
    getDataEvaluacion,
    resetDocente,
    agregarObservacionEspecialistas,
    buscarEspecialistaReporteDeEvaluacion,
    buscarEspecialista,
    reporteEvaluacionDocenteAdmin,
    reporteUgelGlobal,
    resetDirector,
    resetEspecialista,
    updateEvaluacionEspecialista,
    reporteEvaluacionesDirectores,
    getPreguntasRespuestasDesempeñoDirectivo,
    filtrarDataEspecialistaDirectorTabla,
    buscarDirectorReporteDeEvaluacion,
    reporteTablaEvaluacionEspecialista,
    updateEvaluacionDesempeñoDirectivo,
    getPREspecialistaDirector,
    reporteDeEspecialistaToDirectore,
    getReporteDeDirectoresToEspecialistaTabla,
    getDataEvaluacionEspecialistas,
    evaluacionEspecialista,
    dataEvaluaciones,
    allEvaluacionesEspecialistas,
    filtrosEvaluacionEspecialistasSeguimientoRetroalimentacion
  };
};

export default UseEvaluacionEspecialistas;
