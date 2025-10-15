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
import { useState } from 'react';

export const useReporteDocente = () => {
  const [mesesConDataDisponibles, setMesesConDataDisponibles] = useState<number[]>([]);
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
  const estudiantesQueDieronExamenPorMes = async (
    evaluacion: Evaluacion,
    estudiantes: Estudiante[]
  ) => {
    const usuario = currentUserData.dni;
    const mesesConData: number[] = [];

    for (const mes of getAllMonths) {
      try {
        const pathRef = collection(
          db,
          `/usuarios/${usuario}/${evaluacion.id}/${currentYear}/${mes.id}`
        );
        const snapshot = await getAggregateFromServer(pathRef, {
          total: count(),
        });

        if (snapshot.data().total > 0) {
          mesesConData.push(mes.id);
        }
      } catch (error) {
        console.error(`Error verificando datos para el mes ${mes.id}:`, error);
      }
    }
    setMesesConDataDisponibles(mesesConData);
    mesesConData.forEach((mes) => {
      const pathRef = collection(
        db,
        `/usuarios/${currentUserData.dni}/${evaluacion.id}/${currentYear}/${mes}`
      );

      const estudiantesDelMes: Estudiante[] = [];
      onSnapshot(
        pathRef,
        (snapshot) => {
          // Procesar los documentos en tiempo real
          snapshot.forEach((doc) => {
            const estudianteData = {
              ...doc.data(),
              respuestasIncorrectas:
                Number(doc.data().totalPreguntas) - Number(doc.data().respuestasCorrectas),
            } as Estudiante;

            estudiantesDelMes.push(estudianteData);
          });

          // Aplicar cálculos a los estudiantes
          estudiantesDelMes.forEach((estudiante) => {
            calculoNivel(estudiante, evaluacion);
            calculoPreguntasCorrectas(estudiante);
          });

          // Actualizar el estado con los datos del mes
          const resultadosProgresivo = calculoNivelProgresivo(estudiantesDelMes, evaluacion);

          // Calcular el promedio global para este mes
          const promedioGlobalDelMes =
            calculoPromedioGlobalPorGradoEvaluacionPRogresiva(estudiantesDelMes);

          setDatosPorMes((prevData) => {
            // Filtrar datos existentes del mismo mes
            const otrosMeses = prevData.filter((item) => item.mes !== mes);
            // Agregar o actualizar los datos del mes actual
            return [...otrosMeses, { mes, niveles: resultadosProgresivo }];
          });

          // Actualizar el estado con el promedio global del mes
          setPromedioGlobal((prevData) => {
            // Filtrar datos existentes del mismo mes
            const otrosMeses = prevData.filter((item) => item.mes !== mes);
            // Agregar o actualizar los datos del mes actual
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

      // Opcional: guardar la función unsubscribe si necesitas cancelar la suscripción más tarde
      // Puedes almacenar estas funciones en un array o estado si necesitas gestionarlas
    });

    return mesesConData;
  };

  const corregirPuntajesEstudiantes = async (
    dniDocente: string,
    evaluacion: Evaluacion,
    month: number,
    estudiantes: Estudiante[],
    preguntaRespuestas: PreguntasRespuestas[]
  ) => {
    setLoaderCorreccionPuntajes(true);
    const pathRef = `/usuarios/${dniDocente}/${evaluacion.id}/${currentYear}/${month}`;
    console.log('pathRef', pathRef);
    const estudiantesDelDocente: Estudiante[] = [];
    
      
      const pathParaEvaluacionGLobal = `/evaluaciones/${evaluacion.id}/estudiantes-evaluados/${currentYear}/${month}`
    const querySnapshot = await getDocs(collection(db, pathRef));
    querySnapshot.forEach((doc) => {
      // doc.data() is never undefined for query doc snapshots
      estudiantesDelDocente.push(doc.data() as Estudiante);
    });

    try {
      // Procesar todos los estudiantes y preparar datos para batch
      const resultados = estudiantesDelDocente.map((estudiante) => {
        const rta = agregarPuntajesARespuestas(estudiante, preguntaRespuestas);
        const rta2 = calculoNivel(rta, evaluacion);
        const rta3 = calculoPreguntasCorrectas(rta2);
        console.log('rta3', rta3);
        return { estudiante, data: rta3 };
      });

      // Dividir en chunks de máximo 500 operaciones por batch (límite de Firestore)
      const BATCH_SIZE = 500;
      const chunks = [];
      for (let i = 0; i < resultados.length; i += BATCH_SIZE) {
        chunks.push(resultados.slice(i, i + BATCH_SIZE));
      }

      // Ejecutar cada batch
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
        console.log(`Batch ${i + 1}/${chunks.length} completado: ${chunk.length} estudiantes procesados`);
      }
      
      const todosLosResultados = resultados.map(({ data }) => data);
      console.log(`Se procesaron exitosamente ${todosLosResultados.length} estudiantes en ${chunks.length} batch(es)`);
      setLoaderCorreccionPuntajes(false);
      setCorreccionPuntajesExitoso(true);
      return todosLosResultados;
    } catch (error) {
      console.error('Error en corregirPuntajesEstudiantes:', error);
      setLoaderCorreccionPuntajes(false);
      setCorreccionPuntajesError(true);
    }finally{
     /*  setLoaderCorreccionPuntajes(false); */
    }
  };
  const estudiantesQueDieronExamen = (
    evaluacion: Evaluacion,
    month: number,
    preguntaRespuestas: PreguntasRespuestas[],
    callback?: (estudiantes: Estudiante[]) => void
  ) => {
    dispatch({ type: AppAction.LOADER_DATA_GRAFICO_PIE_CHART, payload: true });
    dispatch({ type: AppAction.WARNING_EVA_ESTUDIANTE_SIN_REGISTRO, payload: null });
    //coleccion usuario/dni del docente/ id del exasmen / año en numero / mes en numero
    const queryEstudiantes = collection(
      db,
      `/usuarios/${currentUserData.dni}/${evaluacion.id}/${currentYear}/${month}`
    );

    const arrayEstudiantes: Estudiante[] = [];
    const unsubscribe = onSnapshot(
      queryEstudiantes,
      (snapshot) => {
        if (snapshot.empty) {
          console.log('estudiantes', snapshot.size);
          dispatch({
            type: AppAction.WARNING_EVA_ESTUDIANTE_SIN_REGISTRO,
            payload: 'No hay registros',
          });
        }

        snapshot.forEach((doc) => {
          // doc.data() is never undefined for query doc snapshots
          arrayEstudiantes.push({
            ...doc.data(),
            respuestasIncorrectas:
              Number(doc.data().totalPreguntas) - Number(doc.data().respuestasCorrectas),
          });
        });
        const rta = arrayEstudiantes.map((estudiante) => {
          /* const rta = agregarPuntajesARespuestas(estudiante, preguntaRespuestas); */
          calculoNivel(estudiante, evaluacion);
          calculoPreguntasCorrectas(estudiante);
          return estudiante;
        });
        dispatch({ type: AppAction.ESTUDIANTES, payload: rta });
        dispatch({ type: AppAction.LOADER_REPORTE_DIRECTOR, payload: false });
        dispatch({ type: AppAction.LOADER_DATA_GRAFICO_PIE_CHART, payload: false });
        // Llamar al callback si se proporciona
        if (callback) {
          callback(rta);
        }
      },
      (error) => {
        console.error('Error en onSnapshot:', error);
        dispatch({ type: AppAction.LOADER_REPORTE_DIRECTOR, payload: false });
      }
    );

    // Retornar la función de unsubscribe para poder cancelar la suscripción
    return arrayEstudiantes;

    //codigo para crear la tabla de estudiantes con las pregunta de actuacion
  };
  const estadisticasEstudiantesDelDocentes = () => {};
  const estadisticasEstudiantesDelDocente = (
    evaluacion: Evaluacion,
    month: number,
    preguntaRespuestas: PreguntasRespuestas[],
    callback?: (estadisticas: any[]) => void
  ) => {
    dispatch({ type: AppAction.LOADER_REPORTE_DIRECTOR, payload: true });

    const unsubscribe = estudiantesQueDieronExamen(
      evaluacion,
      month,
      preguntaRespuestas,
      async (estudiantes) => {
        //este unsubscribe la verdad que no es nada relevante ya vere que hago con el.
        /* await estudiantesQueDieronExamenPorMes(evaluacion, estudiantes) */
        // Acumular los valores de a, b, c, d por cada pregunta
        const acumuladoPorPregunta: Record<
          string,
          { id: string; a: number; b: number; c: number; d?: number; total: number }
        > = {};
        estudiantes.forEach((estudiante) => {
          if (estudiante.respuestas && Array.isArray(estudiante.respuestas)) {
            estudiante.respuestas.forEach((respuesta) => {
              const idPregunta = String(respuesta.id);
              if (!idPregunta) return;
              // Detectar si la alternativa 'd' existe en esta pregunta
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
        // Calcular el total para cada pregunta
        Object.values(acumuladoPorPregunta).forEach((obj) => {
          obj.total = obj.a + obj.b + obj.c + (typeof obj.d === 'number' ? obj.d : 0);
        });
        const resultado = Object.values(acumuladoPorPregunta);
        console.log('acumulado por pregunta', resultado);
        dispatch({ type: AppAction.DATA_ESTADISTICAS, payload: resultado });

        // Llamar al callback si se proporciona
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
    month: string
  ) => {
    console.log('data', data);
    const docRef = doc(
      db,
      `/usuarios/${dni}/${idExamen}/${currentYear}/${month}`,
      `${idEstudiante}`
    );
    const docRefEstudianteEvaluado = doc(
      db,
      `/evaluaciones/${idExamen}/estudiantes-evaluados/${currentYear}/${month}`,
      `${idEstudiante}`
    );
    // Agregar puntaje a cada objeto en respuestas basándose en la coincidencia de order
    //aqui la condicional tengo que cambiarlo a por tipo y no idExamen , lo hare despues que termine de hacer la logica
    if (evaluacion.tipoDeEvaluacion === '1') {
      if (data.respuestas && Array.isArray(data.respuestas)) {
        try {
          const dataEstudiante = calculoNivel(data, evaluacion);

          const estudiante = calculoPreguntasCorrectas(dataEstudiante);

          console.log('estudiante', estudiante);
          //como se ocasiono problemas con los docentes que evaluaron estudiantes con la spreguntas sin puntaje,
          //entonces se agregara una validacion para poder actualzar o crear el documento del estudiuante.
          /* const estudianteExiste = await getDoc(docRefEstudianteEvaluado);
          if(estudianteExiste.exists()){
            await updateDoc(docRefEstudianteEvaluado, estudiante);
          }else{
            await updateDoc(docRefEstudianteEvaluado, estudiante);
          } */
          console.log('estudiante progresiva', estudiante);
          const estudianteUpdate = {
            dni: estudiante.dni, //defecto
            nombresApellidos: estudiante.nombresApellidos, //defecto
            grado: estudiante.grado, //defecto
            seccion: estudiante.seccion, //defecto
            genero: estudiante.genero, //defecto
            respuestas: estudiante.respuestas,
            region: currentUserData.region,
            puntaje: estudiante.puntaje,
            dniDocente: currentUserData.dni,
            nivel: estudiante.nivel, //defecto
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
          /* await updateDoc(docRef, estudiante); */
          /* await setDoc(rutaEstudianteParaEvaluacion, documentoEstudiante); */
        } catch (error) {
          console.log('error', error);
        } finally {
          /* dispatch({ type: AppAction.LOADER_REPORTE_DIRECTOR, payload: false }); */
        }
      }
    } else if (evaluacion.tipoDeEvaluacion === '0') {
      try {
        const dataEstudiante = calculoPreguntasCorrectas(data);
        console.log('dataEstudiante regular', dataEstudiante);
        await updateDoc(docRef, dataEstudiante);
        /*  await updateDoc(docRefEstudianteEvaluado, dataEstudiante) */ //no se si existe la ruta para evaluacion regular
      } catch (error) {
        console.log('error', error);
      }
    }
  };

  const getEvaluacionEstudiante = async (
    idExamen: string,
    idEstudiante: string,
    dni: string,
    mes: string
  ) => {
    /* /usuarios/00000900/HYC6LBERKU3DWgeO9rXL/2025/6/90049381 */
    if (idExamen && idEstudiante) {
      console.log('idExamen', idExamen);
      console.log('idEstudiante', idEstudiante);
      console.log('currentUserData.dni', currentUserData.dni);
      /* const queryEvaluacion = doc(db, `/usuarios/${dni}/${idExamen}/${currentYear}/${currentMonth}`,`${idEstudiante}`) */
      const queryEvaluacion = doc(
        db,
        `/usuarios/${dni}/${idExamen}/${currentYear}/${mes}`,
        `${idEstudiante}`
      );
      /* const docRef = doc(db, "cities", "SF");
const docSnap = await getDoc(docRef); */
      const evaluacion = await getDoc(queryEvaluacion);
      console.log('evaluacion', evaluacion.data());
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
    mesesConDataDisponibles,
    datosPorMes,
    promedioGlobal,
    loaderCorreccionPuntajes,
    correccionPuntajesExitoso,
    setCorreccionPuntajesExitoso,
    correccionPuntajesError,
    setCorreccionPuntajesError,
  };
};
