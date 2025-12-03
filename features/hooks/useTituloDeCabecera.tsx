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
  startAfter,
  getAggregateFromServer,
  count,
  addDoc,
  writeBatch,
  deleteDoc,
  QueryDocumentSnapshot,
  DocumentData,
} from 'firebase/firestore';
import { useGlobalContext, useGlobalContextDispatch } from '../context/GlolbalContext';
import { useEffect, useState, useRef } from 'react';
import { DataUsuarioEvaluacionLikert, EscalaLikert, EvaluacionesEscalaLikertUsario, EvaluacionLikert, PreguntasEvaluacionLikert, PreguntasEvaluacionLikertConResultado } from '../types/types';
import { AppAction } from '../actions/appAction';
import { currentYear } from '@/fuctions/dates';
import * as XLSX from 'xlsx';
import { storage } from '@/firebase/firebase.config';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { regionTexto, convertGrade } from '@/fuctions/regiones';

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
        return escalaLikertByUsuario
      }
    });
  }

  const exportarExcelEvaluacionEscalaLikert = async (id: string, month:number) => {
    try {
      const pathRef = collection(db, `/evaluaciones-escala-likert/${id}/${currentYear}-${month}`);
      const data: EvaluacionesEscalaLikertUsario[] = [];
      const BATCH_SIZE = 500; // Tamaño del lote para evitar problemas de memoria
      
      // Función recursiva para obtener todos los documentos
      const getAllDocuments = async (lastVisible: QueryDocumentSnapshot<DocumentData> | null = null): Promise<void> => {
        let q;
        
        if (lastVisible) {
          // Si hay un último documento visible, continuar desde ahí
          q = query(pathRef, limit(BATCH_SIZE), startAfter(lastVisible));
        } else {
          // Primera consulta
          q = query(pathRef, limit(BATCH_SIZE));
        }
        
        const querySnapshot = await getDocs(q);
        
        // Agregar los documentos del lote actual al array
        querySnapshot.forEach((doc) => {
          const docData = doc.data();
          data.push({ ...docData, id: doc.id, datosDocente: docData.datosDocente || [] });
        });
        
        // Si hay más documentos (el tamaño del lote es igual al límite), continuar
        if (querySnapshot.docs.length === BATCH_SIZE) {
          const newLastVisible = querySnapshot.docs[querySnapshot.docs.length - 1];
          await getAllDocuments(newLastVisible);
        }
      };
      
      // Iniciar la obtención recursiva de documentos
      await getAllDocuments();
      console.log('Total documentos obtenidos:', data.length);
      
      // Si no hay datos, retornar
      if (data.length === 0) {
        console.warn('No hay datos para exportar');
        return;
      }
      
      // Preparar los datos para la exportación a Excel
      const dataToExport = data.map((item, index) => {
        const baseData: any = {
          'N°': index + 1,
          'ID': item.id || '',
          'DNI Docente': item.datosDocente?.dni || '',
          'Nombres Docente': item.datosDocente?.nombres || '',
          'Apellidos Docente': item.datosDocente?.apellidos || '',
          'Grado': Array.isArray(item.datosDocente?.grado) 
            ? item.datosDocente.grado.map(g => convertGrade(g.toString())).join(' - ')
            : '',
          'Sexo': item.datosDocente?.sexo?.name || '',
          'Edad': item.datosDocente?.edad?.name || '',
          'Institución': item.datosDocente?.institucion || '',
          'Region': regionTexto(item.datosDocente?.region?.toString() || ''),
          'Distrito': item.datosDocente?.distrito || '',
          'Link Documentos': item.linkDocumentos || '',
          'Total Preguntas': item.evaluacion?.totalPreguntas ?? '',
          'Respuestas Completas': item.evaluacion?.respuestasCompletas ? 'Sí' : 'No',
        };
        
        // Agregar las preguntas y respuestas
        if (item.evaluacion?.preguntas && Array.isArray(item.evaluacion.preguntas)) {
          item.evaluacion.preguntas.forEach((pregunta, preguntaIndex) => {
            /* baseData[`Pregunta ${preguntaIndex + 1}`] = pregunta.pregunta || ''; */
            // Usar ?? para manejar correctamente el valor 0
            baseData[`Pregunta ${preguntaIndex + 1}`] = pregunta.respuesta ?? '';
            /* baseData[`Orden ${preguntaIndex + 1}`] = pregunta.orden ?? ''; */
          });
        }
        
        // Agregar links de documentos si existen
        if (item.linkDocumentos && Array.isArray(item.linkDocumentos)) {
          baseData['Links Documentos'] = item.linkDocumentos.join('; ');
        }
        
        return baseData;
      });
      
      // Crear un nuevo libro de Excel
      const workbook = XLSX.utils.book_new();
      
      // Crear una hoja de cálculo con los datos
      const worksheet = XLSX.utils.json_to_sheet(dataToExport);
      
      // Ajustar el ancho de las columnas
      const columnWidths = [
        { wch: 5 },   // N°
        { wch: 20 },  // ID
        { wch: 15 },  // DNI Docente
        { wch: 25 },  // Nombres Docente
        { wch: 25 },  // Apellidos Docente
        { wch: 30 },  // Institución
        { wch: 20 },  // Distrito
        { wch: 15 },  // Total Preguntas
        { wch: 20 },  // Respuestas Completas
      ];
      
      // Agregar anchos para las columnas de preguntas (si hay datos)
      if (data[0]?.evaluacion?.preguntas) {
        const numPreguntas = data[0].evaluacion.preguntas.length;
        for (let i = 0; i < numPreguntas; i++) {
          columnWidths.push(
            { wch: 50 }, // Pregunta
            { wch: 15 }, // Respuesta
            { wch: 10 }  // Orden
          );
        }
      }
      
      columnWidths.push({ wch: 50 }); // Links Documentos
      worksheet['!cols'] = columnWidths;
      
      // Agregar la hoja al libro
      XLSX.utils.book_append_sheet(workbook, worksheet, 'Evaluaciones Escala Likert');
      
      // Convertir el workbook a un array buffer
      const excelBuffer = XLSX.write(workbook, { type: 'array', bookType: 'xlsx' });
      
      // Crear un blob desde el buffer
      const blob = new Blob([excelBuffer], { 
        type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' 
      });
      
      // Generar nombre único para el archivo
      const timestamp = new Date().getTime();
      const fileName = `evaluaciones-escala-likert-${id}-${currentYear}-${month}-${timestamp}.xlsx`;
      const storagePath = `excel-exports/${fileName}`;
      
      // Crear referencia en Storage
      const storageRef = ref(storage, storagePath);
      
      // Subir el archivo a Storage
      console.log('Subiendo archivo a Storage...');
      await uploadBytes(storageRef, blob);
      
      // Obtener la URL de descarga
      console.log('Obteniendo URL de descarga...');
      const downloadURL = await getDownloadURL(storageRef);
      
      console.log('Archivo subido exitosamente. URL:', downloadURL);
      
      // Abrir la URL en una nueva pestaña
      window.open(downloadURL, '_blank');
      
      return downloadURL;
    } catch (error) {
      console.error('Error al exportar Excel:', error);
      throw error;
    }
  }
  return {
    exportarExcelEvaluacionEscalaLikert,
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
