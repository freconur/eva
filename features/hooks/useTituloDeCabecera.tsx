import {
  doc,
  onSnapshot,
  getFirestore,
  updateDoc,
  setDoc,
  collection,
  getDocs,
  query,
  orderBy,
  limit,
  getAggregateFromServer,
  count,
  addDoc,
  writeBatch,
  deleteDoc,
} from 'firebase/firestore';
import { useGlobalContext, useGlobalContextDispatch } from '../context/GlolbalContext';
import { useEffect, useState, useRef } from 'react';
import { DataUsuarioEvaluacionLikert, EscalaLikert, EvaluacionesEscalaLikertUsario, EvaluacionLikert, PreguntasEvaluacionLikert, PreguntasEvaluacionLikertConResultado } from '../types/types';
import { AppAction } from '../actions/appAction';
import { currentYear } from '@/fuctions/dates';

export const useTituloDeCabecera = () => {
  const dispatch = useGlobalContextDispatch();
  const { currentUserData } = useGlobalContext();
  const db = getFirestore();
  const [tituloDeCabecera, setTituloDeCabecera] = useState<string>('');
  const [evaluacionEscalaLikert, setEvaluacionEscalaLikert] = useState<EvaluacionLikert>({});
  const [preguntasEscalaLikert, setPreguntaEscalaLikert] = useState<PreguntasEvaluacionLikert[]>([]);
  const [evaluacionesEscalaLikertUsuarios, setEvaluacionesEscalaLikertUsuarios] = useState<EvaluacionesEscalaLikertUsario[]>([]);
  const [acumuladoDeDatosLikertParaGraficos, setAcumuladoDeDatosLikertParaGraficos] = useState<PreguntasEvaluacionLikertConResultado[]>([]);
  const [escalaLikertByUsuario, setEscalaLikertByUsuario] = useState<EvaluacionesEscalaLikertUsario>()
  // Ref para guardar la referencia del unsubscribe
  const unsubscribeRef = useRef<(() => void) | null>(null);
  
  // Limpiar suscripciones cuando el componente se desmonte
  useEffect(() => {
    return () => {
      if (unsubscribeRef.current) {
        unsubscribeRef.current();
      }
    };
  }, []);

  const getTituloDeCabecera = (id: string) => {
    const pathRef = doc(db, 'titulos-cabecera', id);

    const unsubscribe = onSnapshot(
      pathRef,
      (docSnap) => {
        if (docSnap.exists()) {
          setTituloDeCabecera(docSnap.data().name);
        } else {
          setTituloDeCabecera('');
        }
      },
      (error) => {
        console.error('Error al obtener el título de cabecera:', error);
        setTituloDeCabecera('');
      }
    );

    return unsubscribe;
  };

  const updateTituloDeCabecera = (id: string, name: string) => {
    const pathRef = doc(db, 'titulos-cabecera', id);
    updateDoc(pathRef, { name });
  };

  const getPreguntasEvaluacionEscalaLikert = (id: string) => {
    // Cancelar la suscripción anterior si existe
    if (unsubscribeRef.current) {
      unsubscribeRef.current();
      unsubscribeRef.current = null;
    }
    
    // Limpiar tanto el estado local como el global
    setPreguntaEscalaLikert([]);
    dispatch({ type: AppAction.PREGUNTAS_EVALUACION_ESCALA_LIKERT, payload: [] });
    
    const pathRef = collection(db, `evaluaciones-escala-likert/${id}/preguntas`);
    const q = query(pathRef, orderBy('orden','asc'));
    
    const unsubscribe = onSnapshot(q, (querySnapshot) => {
      // Verificar que la suscripción no haya sido cancelada
      if (!unsubscribeRef.current) return;
      
      const arrayEvaluacionEscalaLikert: PreguntasEvaluacionLikert[] = [];
      querySnapshot.forEach((doc) => {
        arrayEvaluacionEscalaLikert.push({ ...doc.data(), id: doc.id });
      });
      
      setPreguntaEscalaLikert(arrayEvaluacionEscalaLikert);
      dispatch({ type: AppAction.PREGUNTAS_EVALUACION_ESCALA_LIKERT, payload: arrayEvaluacionEscalaLikert });
    });
    
    // Guardar la referencia del unsubscribe
    unsubscribeRef.current = unsubscribe;
  };

  const addPuntajeEscalaLikert = async (id: string, puntaje: EscalaLikert[]) => {
    const rutaPuntaje = doc(db, 'evaluaciones-escala-likert', id);

    try {
      // Usar updateDoc para agregar la propiedad puntaje al documento
      // Si el documento no existe, updateDoc fallará, por lo que usamos setDoc con merge
      await updateDoc(rutaPuntaje, { puntaje: puntaje });
    } catch (error: any) {
      // Si el documento no existe, lo creamos con la propiedad puntaje
      if (error.code === 'not-found') {
        await setDoc(rutaPuntaje, { puntaje: puntaje }, { merge: true });
      } else {
        console.error('Error al agregar puntaje:', error);
        throw error;
      }
    }
  };

  // Función para obtener el siguiente orden disponible
  const getSiguienteOrden = async (id: string): Promise<number> => {
    const rutaPreguntas = `evaluaciones-escala-likert/${id}/preguntas`;
    const preguntasRef = collection(db, rutaPreguntas);

    // Obtener la pregunta con el mayor orden para calcular el siguiente
    const q = query(preguntasRef, orderBy('orden', 'desc'), limit(1));
    const snapshot = await getDocs(q);
    
    if (snapshot.empty) {
      return 1.0; // Primera pregunta
    }
    
    const ultimaPregunta = snapshot.docs[0].data();
    return ultimaPregunta.orden + 1.0;
  };

  const addPreguntasAlternativasEscalaLikert = async (id: string, pregunta: string) => {
    const rutaPreguntas = `evaluaciones-escala-likert/${id}/preguntas`;
    const preguntasRef = collection(db, rutaPreguntas);

    // Obtener la pregunta con el mayor orden para calcular el siguiente
    const q = query(preguntasRef, orderBy('orden', 'desc'), limit(1));
    const snapshot = await getDocs(q);
    
    let siguienteOrden = 1.0;
    if (!snapshot.empty) {
      const ultimaPregunta = snapshot.docs[0].data();
      siguienteOrden = ultimaPregunta.orden + 1.0;
    }
    
    await addDoc(preguntasRef, { 
      pregunta,
      orden: siguienteOrden 
    });
  };

  // Función para reordenar preguntas (para futuras implementaciones)
  const reordenarPregunta = async (id: string, preguntaId: string, nuevoOrden: number) => {
    const rutaPregunta = `evaluaciones-escala-likert/${id}/preguntas/${preguntaId}`;
    const preguntaRef = doc(db, rutaPregunta);
    
    await updateDoc(preguntaRef, { orden: nuevoOrden });
  };

  // Función optimizada para actualizar múltiples órdenes en batch
  const actualizarOrdenesEnBatch = async (id: string, cambios: Map<string, number>) => {
    if (cambios.size === 0) return;

    const batch = writeBatch(db);
    
    for (const [preguntaId, nuevoOrden] of cambios) {
      const rutaPregunta = `evaluaciones-escala-likert/${id}/preguntas/${preguntaId}`;
      const preguntaRef = doc(db, rutaPregunta);
      batch.update(preguntaRef, { orden: nuevoOrden });
    }
    
    await batch.commit();
  };

  // Función para reordenar pregunta individual (optimizada)
  const reordenarPreguntaOptimizada = async (id: string, preguntaId: string, nuevoOrden: number) => {
    const rutaPregunta = `evaluaciones-escala-likert/${id}/preguntas/${preguntaId}`;
    const preguntaRef = doc(db, rutaPregunta);
    
    await updateDoc(preguntaRef, { orden: nuevoOrden });
  };
  
  const getEvaluacionEscalaLikert = async (id: string) => {
    const pathRef = doc(db, 'evaluaciones-escala-likert', id);
    onSnapshot(pathRef, (docSnap) => {
      if (docSnap.exists()) {
        /* dispatch({ type: AppAction.EVALUACION_ESCALA_LIKERT, payload: docSnap.data() }); */
        console.log('docSnap.data()', docSnap.data())
        setEvaluacionEscalaLikert(docSnap.data())
      }
    });
  }

  const updateEvaluacionEscalaLikert = async (id: string, data: EvaluacionLikert) => {
    const pathRef = doc(db, 'evaluaciones-escala-likert', id);
    await updateDoc(pathRef, data);
  }
  const saveEvaluacionEscalaLikert = async (id: string, data: DataUsuarioEvaluacionLikert, evaluacionEscalaLikert: EvaluacionLikert) => {
    // Verificar que mesDelExamen esté definido
    if (!evaluacionEscalaLikert.mesDelExamen) {
      throw new Error('mesDelExamen es requerido para guardar la evaluación');
    }
    
    // Verificar que currentUserData.dni esté definido
    if (!currentUserData?.dni) {
      throw new Error('DNI del usuario es requerido para guardar la evaluación');
    }
    
    const pathRef = doc(db, `evaluaciones-escala-likert/${id}/${currentYear}-${evaluacionEscalaLikert.mesDelExamen}`, currentUserData.dni);
    await setDoc(pathRef, data);
  }

  // Función para actualizar el texto de una pregunta
  const updatePreguntaTexto = async (id: string, preguntaId: string, nuevoTexto: string) => {
    const rutaPregunta = `evaluaciones-escala-likert/${id}/preguntas/${preguntaId}`;
    const preguntaRef = doc(db, rutaPregunta);
    
    await updateDoc(preguntaRef, { pregunta: nuevoTexto });
  }

  const deletePreguntaEvaluacionEscalaLikert = async (id: string, preguntaId: string) => {
    const rutaPregunta = `evaluaciones-escala-likert/${id}/preguntas`;
    const preguntaRef = doc(db, rutaPregunta, preguntaId);
    await deleteDoc(preguntaRef);
  }


  const calculoDeDatosParaGraficoEscalaLikert = (data: EvaluacionesEscalaLikertUsario[], evaluacionEscalaLikert: EvaluacionLikert) => {
    // Obtener las preguntas de la evaluación (asumiendo que todas las evaluaciones tienen las mismas preguntas)
    const preguntasEvaluacion = data[0]?.evaluacion?.preguntas || [];
    // Para cada pregunta, calcular los resultados por valor de escala
    const resultadoPorPregunta = preguntasEvaluacion.map(pregunta => {
      // Inicializar contadores para esta pregunta
      const contadoresPorValor = [...(evaluacionEscalaLikert.puntaje || [])].map(item => ({ ...item, total: 0 }));
      // Contar respuestas para esta pregunta específica
      data.forEach((usuario) => {
        if (usuario.evaluacion?.preguntas) {
          const preguntaUsuario = usuario.evaluacion.preguntas.find(p => p.id === pregunta.id);
          if (preguntaUsuario) {
            const elementoEncontrado = contadoresPorValor.find(item => item.value === preguntaUsuario.respuesta);
            if (elementoEncontrado) {
              elementoEncontrado.total = (elementoEncontrado.total || 0) + 1;
            }
          }
        }
      });
      return {
        resultado: contadoresPorValor,
        order: pregunta.orden,
        pregunta: pregunta.pregunta,
        id: pregunta.id
      };
    });
    setAcumuladoDeDatosLikertParaGraficos(resultadoPorPregunta);
    /* console.log('resultado final por pregunta', resultadoPorPregunta);
    return resultadoPorPregunta; */
  }
  const getEvaluacionesEscalaLikert = async (id: string, evaluacionEscalaLikert: EvaluacionLikert) => {
    const pathRef = collection(db, `/evaluaciones-escala-likert/${id}/${currentYear}-9`);
    
    try {
      const querySnapshot = await getDocs(pathRef);
      const data: EvaluacionesEscalaLikertUsario[] = [];
      
      querySnapshot.forEach((doc) => {
        const docData = doc.data();
        data.push({ 
          ...docData, 
          id: doc.id,
          datosDocente: docData.datosDocente || []
        });
      });
      
      // Actualizar el estado con los datos obtenidos
      setEvaluacionesEscalaLikertUsuarios(data);
      
      // Ejecutar el cálculo solo después de que getDocs termine
      calculoDeDatosParaGraficoEscalaLikert(data, evaluacionEscalaLikert);
    } catch (error) {
      console.error('Error al obtener evaluaciones escala likert:', error);
      setEvaluacionesEscalaLikertUsuarios([]);
    }
  }

  const evaluacionEscalaLikertByUsuario = async(id: string) => {
    const pathRef = doc(db, `/evaluaciones-escala-likert/${id}/${currentYear}-9/`, `${currentUserData.dni}`);
    console.log(`/evaluaciones-escala-likert/${id}/${currentYear}-9/`, `${currentUserData.dni}`)
    onSnapshot(pathRef, (docSnap) => {
      if (docSnap.exists()) {
        setEscalaLikertByUsuario(docSnap.data() as EvaluacionesEscalaLikertUsario)
      }
    });
    return escalaLikertByUsuario
  }
  return {
    evaluacionEscalaLikertByUsuario,
    escalaLikertByUsuario,
    getTituloDeCabecera,
    getEvaluacionesEscalaLikert,
    tituloDeCabecera,
    updateTituloDeCabecera,
    getPreguntasEvaluacionEscalaLikert,
    addPreguntasAlternativasEscalaLikert,
    addPuntajeEscalaLikert,
    getSiguienteOrden,
    reordenarPregunta,
    actualizarOrdenesEnBatch,
    reordenarPreguntaOptimizada,
    getEvaluacionEscalaLikert,
    evaluacionEscalaLikert,
    saveEvaluacionEscalaLikert,
    updatePreguntaTexto,
    updateEvaluacionEscalaLikert,
    deletePreguntaEvaluacionEscalaLikert,
    preguntasEscalaLikert,
    evaluacionesEscalaLikertUsuarios,
    acumuladoDeDatosLikertParaGraficos,
  };
};
