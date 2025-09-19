import { useGlobalContext, useGlobalContextDispatch } from '../context/GlolbalContext';
import { DataEstadisticas, Estudiante, Evaluacion, UserEstudiante } from '../types/types';
import { AppAction } from '../actions/appAction';
import { currentMonth, currentYear } from '@/fuctions/dates';
import { app } from '@/firebase/firebase.config';
import {
  doc,
  getDoc,
  collection,
  getDocs,
  getFirestore,
  updateDoc,
  onSnapshot,
} from 'firebase/firestore';
import { puntajePreguntasMatemticaProgresiva } from '@/fuctions/correccionPuntaje';
import { calculoNivel, calculoPreguntasCorrectas } from '../utils/calculoNivel';

export const useReporteDocente = () => {
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
  const estudiantesQueDieronExamen = (
    evaluacion: Evaluacion,
    month: number,
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
        arrayEstudiantes.forEach((estudiante) => {
          calculoNivel(estudiante, evaluacion);
          calculoPreguntasCorrectas(estudiante);
        });
        dispatch({ type: AppAction.ESTUDIANTES, payload: arrayEstudiantes });
        dispatch({ type: AppAction.LOADER_REPORTE_DIRECTOR, payload: false });
        dispatch({ type: AppAction.LOADER_DATA_GRAFICO_PIE_CHART, payload: false });
        // Llamar al callback si se proporciona
        if (callback) {
          callback(arrayEstudiantes);
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
  const estadisticasEstudiantesDelDocente = (
    evaluacion: Evaluacion,
    month: number,
    callback?: (estadisticas: any[]) => void
  ) => {
    dispatch({ type: AppAction.LOADER_REPORTE_DIRECTOR, payload: true });

    const unsubscribe = estudiantesQueDieronExamen(evaluacion, month, (estudiantes) => {//este unsubscribe la verdad que no es nada relevante ya vere que hago con el.
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
    });

    return unsubscribe;
  };
  const updateEvaluacionEstudiante = async (
    data: UserEstudiante,
    idExamen: string,
    idEstudiante: string,
    dni: string,
    evaluacion: Evaluacion,
    month:string
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

          console.log('estudiante progresiva',estudiante)
          await updateDoc(docRef, estudiante);
          await updateDoc(docRefEstudianteEvaluado, estudiante);
          /* await setDoc(rutaEstudianteParaEvaluacion, documentoEstudiante); */
        } catch (error) {
          console.log('error', error);
        }finally{
          /* dispatch({ type: AppAction.LOADER_REPORTE_DIRECTOR, payload: false }); */
        }

        
      }
    }else if(evaluacion.tipoDeEvaluacion === '0'){
      try {
        const dataEstudiante = calculoPreguntasCorrectas(data);
        console.log('dataEstudiante regular',dataEstudiante)
        await updateDoc(docRef, dataEstudiante);
       /*  await updateDoc(docRefEstudianteEvaluado, dataEstudiante) */;//no se si existe la ruta para evaluacion regular
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
  };
};
