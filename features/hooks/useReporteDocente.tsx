import { useGlobalContext, useGlobalContextDispatch } from '../context/GlolbalContext';
import {
  DataEstadisticas,
  Estudiante,
  Evaluacion,
  GraficoTendenciaNiveles,
  PreguntasRespuestas,
  PromedioGlobalPorGradoEvaluacionPRogresiva,
  PromedioGlobalPorMes,
  UserEstudiante,
} from '../types/types';
import { AppAction } from '../actions/appAction';
import { currentMonth, currentYear, getAllMonths } from '@/fuctions/dates';
import { app } from '@/firebase/firebase.config';
import {
  doc,
  getDoc,
  collection,
  getDocs,
  getFirestore,
  updateDoc,
  onSnapshot,
  getAggregateFromServer,
  count,
  setDoc,
  writeBatch,
} from 'firebase/firestore';
import { puntajePreguntasMatemticaProgresiva } from '@/fuctions/correccionPuntaje';
import {
  agregarPuntajesARespuestas,
  calculoNivel,
  calculoNivelProgresivo,
  calculoPreguntasCorrectas,
  calculoPromedioGlobalPorGradoEvaluacionPRogresiva,
} from '../utils/calculoNivel';
import { useState, useRef } from 'react';

export const useReporteDocente = () => {
  const [mesesConDataDisponibles, setMesesConDataDisponibles] = useState<number[]>([]);
  const [añosConDataDisponibles, setAñosConDataDisponibles] = useState<string[]>([]);
  const [promedioGlobal, setPromedioGlobal] = useState<PromedioGlobalPorMes[]>([]);
  const [datosPorMes, setDatosPorMes] = useState<GraficoTendenciaNiveles[]>([]);
  const [loaderCorreccionPuntajes, setLoaderCorreccionPuntajes] = useState<boolean>(false)
  const [correccionPuntajesExitoso, setCorreccionPuntajesExitoso] = useState<boolean>(false)
  const [correccionPuntajesError, setCorreccionPuntajesError] = useState<boolean>(false)
  const db = getFirestore(app);
  const { currentUserData } = useGlobalContext();
  const dispatch = useGlobalContextDispatch();

  const filtroEstudiantes = (estudiantes: Estudiante[], order: number) => {
    const estudiantesOrdenados = [...estudiantes].sort((a, b) => {
      if (order === 1) {
        // Orden ascendente
        return Number(a.respuestasCorrectas) - Number(b.respuestasCorrectas);
      } else if (order === 2) {
        // Orden descendente
        return Number(b.respuestasCorrectas) - Number(a.respuestasCorrectas);
      }
      return 0;
    });

    dispatch({ type: AppAction.ESTUDIANTES, payload: estudiantesOrdenados });
    return estudiantesOrdenados;
  };

  const obtenerAñosConData = async (evaluacionId: string) => {
    if (!evaluacionId || !currentUserData.dni) return [];

    try {
      const pathRef = collection(db, `/usuarios/${currentUserData.dni}/${evaluacionId}`);
      const snapshot = await getDocs(pathRef);
      const años: string[] = [];

      snapshot.forEach((doc) => {
        if (doc.id.match(/^\d{4}$/)) {
          años.push(doc.id);
        }
      });

      const añosOrdenados = años.sort((a, b) => Number(b) - Number(a));
      setAñosConDataDisponibles(añosOrdenados);
      return añosOrdenados;
    } catch (error) {
      console.error('Error al obtener años con data:', error);
      return [];
    }
  };

  const unsubscribesRef = useRef<(() => void)[]>([]);

  const limpiarListeners = () => {
    unsubscribesRef.current.forEach((unsub: () => void) => unsub());
    unsubscribesRef.current = [];
  };

  const estudiantesQueDieronExamenPorMes = async (
    evaluacion: Evaluacion,
    estudiantes: Estudiante[],
    yearSelected?: string
  ) => {
    const usuario = currentUserData.dni;
    const año = yearSelected || evaluacion.añoDelExamen || currentYear.toString();

    // Limpiar listeners previos antes de iniciar nuevos
    limpiarListeners();

    // 1. Verificar disponibilidad de meses en paralelo (MÁS RÁPIDO)
    const promesasMeses = getAllMonths.map(async (mes) => {
      try {
        const pathRef = collection(
          db,
          `/usuarios/${usuario}/${evaluacion.id}/${año}/${mes.id}`
        );
        const snapshot = await getAggregateFromServer(pathRef, {
          total: count(),
        });

        return snapshot.data().total > 0 ? mes.id : null;
      } catch (error) {
        console.error(`Error verificando datos para el mes ${mes.id}:`, error);
        return null;
      }
    });

    const resultadosMeses = await Promise.all(promesasMeses);
    const mesesConData = resultadosMeses.filter((id): id is number => id !== null);

    setMesesConDataDisponibles(mesesConData);

    // 2. Iniciar listeners para cada mes con data
    mesesConData.forEach((mes) => {
      const pathRef = collection(
        db,
        `/usuarios/${currentUserData.dni}/${evaluacion.id}/${año}/${mes}`
      );

      const unsubscribe = onSnapshot(
        pathRef,
        (snapshot) => {
          const estudiantesDelMes: Estudiante[] = [];

          snapshot.forEach((doc) => {
            const estudianteData = {
              ...doc.data(),
              respuestasIncorrectas:
                Number(doc.data().totalPreguntas) - Number(doc.data().respuestasCorrectas),
            } as Estudiante;

            estudiantesDelMes.push(estudianteData);
          });

          estudiantesDelMes.forEach((estudiante) => {
            calculoNivel(estudiante, evaluacion);
            calculoPreguntasCorrectas(estudiante);
          });

          const resultadosProgresivo = calculoNivelProgresivo(estudiantesDelMes, evaluacion);
          const promedioGlobalDelMes =
            calculoPromedioGlobalPorGradoEvaluacionPRogresiva(estudiantesDelMes);

          setDatosPorMes((prevData) => {
            const otrosMeses = prevData.filter((item) => item.mes !== mes);
            return [...otrosMeses, { mes, niveles: resultadosProgresivo }];
          });

          setPromedioGlobal((prevData) => {
            const otrosMeses = prevData.filter((item) => item.mes !== mes);
            return [
              ...otrosMeses,
              {
                mes,
                totalEstudiantes: promedioGlobalDelMes.totalEstudiantes,
                promedioGlobal: promedioGlobalDelMes.promedioGlobal,
              },
            ];
          });
        },
        (error) => {
          console.error(`Error en onSnapshot para el mes ${mes}:`, error);
        }
      );

      // Guardar el unsubscribe para limpieza posterior
      unsubscribesRef.current.push(unsubscribe);
    });

    return mesesConData;
  };

  const corregirPuntajesEstudiantes = async (
    dniDocente: string,
    evaluacion: Evaluacion,
    month: number,
    estudiantes: Estudiante[],
    preguntaRespuestas: PreguntasRespuestas[],
    yearSelected?: string
  ) => {
    setLoaderCorreccionPuntajes(true);
    const año = yearSelected || evaluacion.añoDelExamen || currentYear.toString();
    const pathRef = `/usuarios/${dniDocente}/${evaluacion.id}/${año}/${month}`;
    const estudiantesDelDocente: Estudiante[] = [];

    const pathParaEvaluacionGLobal = `/evaluaciones/${evaluacion.id}/estudiantes-evaluados/${año}/${month}`
    const querySnapshot = await getDocs(collection(db, pathRef));
    querySnapshot.forEach((doc) => {
      estudiantesDelDocente.push(doc.data() as Estudiante);
    });

    try {
      const resultados = estudiantesDelDocente.map((estudiante) => {
        const rta = agregarPuntajesARespuestas(estudiante, preguntaRespuestas);
        const rta2 = calculoNivel(rta, evaluacion);
        const rta3 = calculoPreguntasCorrectas(rta2);
        return { estudiante, data: rta3 };
      });

      const BATCH_SIZE = 500;
      const chunks = [];
      for (let i = 0; i < resultados.length; i += BATCH_SIZE) {
        chunks.push(resultados.slice(i, i + BATCH_SIZE));
      }

      for (let i = 0; i < chunks.length; i++) {
        const chunk = chunks[i];
        const batch = writeBatch(db);

        chunk.forEach(({ estudiante, data }) => {
          const docRef = doc(db, pathRef, `${estudiante.dni}`);
          const docRefParaEvaluacionGlobal = doc(db, pathParaEvaluacionGLobal, `${estudiante.dni}`);
          batch.set(docRef, data);
          batch.set(docRefParaEvaluacionGlobal, data);
        });

        await batch.commit();
      }

      const todosLosResultados = resultados.map(({ data }) => data);
      setLoaderCorreccionPuntajes(false);
      setCorreccionPuntajesExitoso(true);
      return todosLosResultados;
    } catch (error) {
      console.error('Error en corregirPuntajesEstudiantes:', error);
      setLoaderCorreccionPuntajes(false);
      setCorreccionPuntajesError(true);
    }
  };

  const estudiantesQueDieronExamen = (
    evaluacion: Evaluacion,
    month: number,
    preguntaRespuestas: PreguntasRespuestas[],
    yearSelected?: string,
    callback?: (estudiantes: Estudiante[]) => void
  ) => {
    dispatch({ type: AppAction.LOADER_DATA_GRAFICO_PIE_CHART, payload: true });
    dispatch({ type: AppAction.WARNING_EVA_ESTUDIANTE_SIN_REGISTRO, payload: null });
    const año = yearSelected || evaluacion.añoDelExamen || currentYear.toString();
    const queryEstudiantes = collection(
      db,
      `/usuarios/${currentUserData.dni}/${evaluacion.id}/${año}/${month}`
    );

    const unsubscribe = onSnapshot(
      queryEstudiantes,
      (snapshot) => {
        const arrayEstudiantes: Estudiante[] = [];

        if (snapshot.empty) {
          dispatch({
            type: AppAction.WARNING_EVA_ESTUDIANTE_SIN_REGISTRO,
            payload: 'No hay registros',
          });
        }

        snapshot.forEach((doc) => {
          arrayEstudiantes.push({
            ...doc.data(),
            respuestasIncorrectas:
              Number(doc.data().totalPreguntas) - Number(doc.data().respuestasCorrectas),
          });
        });

        const rta = arrayEstudiantes.map((estudiante) => {
          calculoNivel(estudiante, evaluacion);
          calculoPreguntasCorrectas(estudiante);
          return estudiante;
        });
        dispatch({ type: AppAction.ESTUDIANTES, payload: rta });
        dispatch({ type: AppAction.LOADER_REPORTE_DIRECTOR, payload: false });
        dispatch({ type: AppAction.LOADER_DATA_GRAFICO_PIE_CHART, payload: false });
        if (callback) {
          callback(rta);
        }
      },
      (error) => {
        console.error('Error en onSnapshot:', error);
        dispatch({ type: AppAction.LOADER_REPORTE_DIRECTOR, payload: false });
      }
    );

    return unsubscribe;
  };

  const estadisticasEstudiantesDelDocente = (
    evaluacion: Evaluacion,
    month: number,
    preguntaRespuestas: PreguntasRespuestas[],
    yearSelected?: string,
    callback?: (estadisticas: any[]) => void
  ) => {
    dispatch({ type: AppAction.LOADER_REPORTE_DIRECTOR, payload: true });

    const unsubscribe = estudiantesQueDieronExamen(
      evaluacion,
      month,
      preguntaRespuestas,
      yearSelected,
      async (estudiantes) => {
        const acumuladoPorPregunta: Record<
          string,
          { id: string; a: number; b: number; c: number; d?: number; total: number }
        > = {};
        estudiantes.forEach((estudiante) => {
          if (estudiante.respuestas && Array.isArray(estudiante.respuestas)) {
            estudiante.respuestas.forEach((respuesta) => {
              const idPregunta = String(respuesta.id);
              if (!idPregunta) return;
              let tieneD = false;
              if (respuesta.alternativas && Array.isArray(respuesta.alternativas)) {
                tieneD = respuesta.alternativas.some((alt) => alt.alternativa === 'd');
              }
              if (!acumuladoPorPregunta[idPregunta]) {
                acumuladoPorPregunta[idPregunta] = tieneD
                  ? { id: idPregunta, a: 0, b: 0, c: 0, d: 0, total: 0 }
                  : { id: idPregunta, a: 0, b: 0, c: 0, total: 0 };
              }
              if (respuesta.alternativas && Array.isArray(respuesta.alternativas)) {
                respuesta.alternativas.forEach((alternativa) => {
                  if (alternativa.selected) {
                    switch (alternativa.alternativa) {
                      case 'a':
                        acumuladoPorPregunta[idPregunta].a += 1;
                        break;
                      case 'b':
                        acumuladoPorPregunta[idPregunta].b += 1;
                        break;
                      case 'c':
                        acumuladoPorPregunta[idPregunta].c += 1;
                        break;
                      case 'd':
                        if (typeof acumuladoPorPregunta[idPregunta].d === 'number') {
                          acumuladoPorPregunta[idPregunta].d! += 1;
                        }
                        break;
                      default:
                        break;
                    }
                  }
                });
              }
            });
          }
        });
        Object.values(acumuladoPorPregunta).forEach((obj) => {
          obj.total = obj.a + obj.b + obj.c + (typeof obj.d === 'number' ? obj.d : 0);
        });
        const resultado = Object.values(acumuladoPorPregunta);
        dispatch({ type: AppAction.DATA_ESTADISTICAS, payload: resultado });

        if (callback) {
          callback(resultado);
        }
      }
    );

    return unsubscribe;
  };

  const updateEvaluacionEstudiante = async (
    data: UserEstudiante,
    idExamen: string,
    idEstudiante: string,
    dni: string,
    evaluacion: Evaluacion,
    month: string,
    yearSelected?: string
  ) => {
    const año = yearSelected || evaluacion.añoDelExamen || currentYear.toString();
    const docRef = doc(
      db,
      `/usuarios/${dni}/${idExamen}/${año}/${month}`,
      `${idEstudiante}`
    );
    const docRefEstudianteEvaluado = doc(
      db,
      `/evaluaciones/${idExamen}/estudiantes-evaluados/${año}/${month}`,
      `${idEstudiante}`
    );
    if (evaluacion.tipoDeEvaluacion === '1') {
      if (data.respuestas && Array.isArray(data.respuestas)) {
        try {
          const dataEstudiante = calculoNivel(data, evaluacion);
          const estudiante = calculoPreguntasCorrectas(dataEstudiante);
          const estudianteUpdate = {
            dni: estudiante.dni,
            nombresApellidos: estudiante.nombresApellidos,
            grado: estudiante.grado,
            seccion: estudiante.seccion,
            genero: estudiante.genero,
            respuestas: estudiante.respuestas,
            region: currentUserData.region,
            puntaje: estudiante.puntaje,
            dniDocente: currentUserData.dni,
            nivel: estudiante.nivel,
            nivelData: estudiante.nivelData,
          };
          await setDoc(
            docRef,
            {
              respuestas: estudianteUpdate.respuestas,
              region: currentUserData.region,
              puntaje: estudianteUpdate.puntaje,
              dniDocente: currentUserData.dni,
              nivel: estudianteUpdate.nivel,
              nivelData: estudianteUpdate.nivelData,
            },
            { merge: true }
          );
          await setDoc(docRefEstudianteEvaluado, estudianteUpdate, { merge: true });
        } catch (error) {
          console.log('error', error);
        }
      }
    } else if (evaluacion.tipoDeEvaluacion === '0') {
      try {
        const dataEstudiante = calculoPreguntasCorrectas(data);
        await updateDoc(docRef, dataEstudiante);
      } catch (error) {
        console.log('error', error);
      }
    }
  };

  const getEvaluacionEstudiante = async (
    idExamen: string,
    idEstudiante: string,
    dni: string,
    mes: string,
    yearSelected?: string
  ) => {
    if (idExamen && idEstudiante) {
      const año = yearSelected || currentYear.toString();
      const queryEvaluacion = doc(
        db,
        `/usuarios/${dni}/${idExamen}/${año}/${mes}`,
        `${idEstudiante}`
      );
      const evaluacion = await getDoc(queryEvaluacion);
      dispatch({
        type: AppAction.EVALUACION_ESTUDIANTE,
        payload: evaluacion.data() as UserEstudiante,
      });
    }
  };

  return {
    estudiantesQueDieronExamen,
    estadisticasEstudiantesDelDocente,
    filtroEstudiantes,
    getEvaluacionEstudiante,
    updateEvaluacionEstudiante,
    estudiantesQueDieronExamenPorMes,
    corregirPuntajesEstudiantes,
    obtenerAñosConData,
    mesesConDataDisponibles,
    añosConDataDisponibles,
    datosPorMes,
    promedioGlobal,
    loaderCorreccionPuntajes,
    correccionPuntajesExitoso,
    setCorreccionPuntajesExitoso,
    correccionPuntajesError,
    setCorreccionPuntajesError,
  };
};
