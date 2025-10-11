import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  getFirestore,
  increment,
  orderBy,
  query,
  serverTimestamp,
  setDoc,
  updateDoc,
  where,
  writeBatch,
  onSnapshot,
  QuerySnapshot,
  DocumentData,
  runTransaction,
} from 'firebase/firestore';
import { AppAction } from '../actions/appAction';
import { useGlobalContext, useGlobalContextDispatch } from '../context/GlolbalContext';
import {
  Alternativa,
  CreaEvaluacion,
  Evaluacion,
  Evaluaciones,
  Grades,
  NivelYPuntaje,
  PreguntasRespuestas,
  TipoDeEvaluacion,
  User,
  UserEstudiante,
} from '../types/types';
import { currentMonth, currentYear } from '@/fuctions/dates';
import { calculoNivel } from '../utils/calculoNivel';
import { addNoRespondioAlternative } from '../utils/addNoRespondioAlternative';

export const useAgregarEvaluaciones = () => {
  const dispatch = useGlobalContextDispatch();
  const { currentUserData } = useGlobalContext();
  const db = getFirestore();

  const getTipoDeEvaluacion = () => {
    const docRef = doc(db, 'options', 'tipos-de-evaluacion');
    
    // Usar onSnapshot para actualizaciones en tiempo real
    const unsubscribe = onSnapshot(
      docRef,
      (docSnap) => {
        if (docSnap.exists()) {
          try {
            dispatch({
              type: AppAction.TIPOS_DE_EVALUACION,
              payload: docSnap.data().tiposDeEvaluacion as TipoDeEvaluacion[],
            });
          } catch (error) {
            console.log('error', error);
          }
        }
      },
      (error: Error) => {
        console.log('Error en getTipoDeEvaluacion:', error);
      }
    );

    // Retornar la función de limpieza para poder desuscribirse
    return unsubscribe;
  };
  const obtenerEstudianteDeEvaluacion = (
    evaluacion: Evaluacion,
    seccion: string,
    month: string
  ) => {
    console.log('test estamos dentro de obtenerEstudianteDeEvaluacion');
    console.log(`/usuarios/${currentUserData.dni}/${evaluacion.id}/${currentYear}/${currentMonth}`);
    console.log(`/usuarios/${currentUserData.dni}/estudiantes-docentes`);
    const rutaEstudiantesEvaluados = collection(
      db,
      `/usuarios/${currentUserData.dni}/${evaluacion.id}/${currentYear}/${month}/`
    );
    const rutaEstudiantesRef = collection(
      db,
      `/usuarios/${currentUserData.dni}/estudiantes-docentes/`
    );

    const q =
      seccion && seccion.trim() !== '' && seccion !== '-- Selecciona una sección --'
        ? query(
            rutaEstudiantesRef,
            where('grado', '==', `${evaluacion.grado}`),
            where('seccion', '==', `${seccion}`)
          )
        : query(rutaEstudiantesRef, where('grado', '==', `${evaluacion.grado}`));

    let unsubscribeEstudiantes: (() => void) | null = null;

    // Listener para estudiantes evaluados
    const unsubscribeEstudiantesEvaluados = onSnapshot(
      rutaEstudiantesEvaluados,
      (querySnapshot: QuerySnapshot<DocumentData>) => {
        let estudiantesEvaluadosArray: UserEstudiante[] = [];
        querySnapshot.forEach((doc) => {
          estudiantesEvaluadosArray.push({ ...doc.data(), id: doc.id });
        });

        // Desuscribirse del listener anterior si existe
        if (unsubscribeEstudiantes) {
          unsubscribeEstudiantes();
        }

        // Listener para todos los estudiantes del grado
        unsubscribeEstudiantes = onSnapshot(
          q,
          (querySnapshot: QuerySnapshot<DocumentData>) => {
            let estudiantesDeEvaluacion: UserEstudiante[] = [];
            querySnapshot.forEach((doc) => {
              // Verificar si el estudiante ya ha sido evaluado
              const yaEvaluado = estudiantesEvaluadosArray.find(
                (estudiante) => `${estudiante.id}` === `${doc.id}`
              );

              // Solo agregar si no ha sido evaluado
              if (!yaEvaluado) {
                estudiantesDeEvaluacion.push({ ...doc.data(), id: doc.id });
              }
            });
            console.log('estudiantesDeEvaluacion', estudiantesDeEvaluacion);
            dispatch({ type: AppAction.LOADER_PAGES, payload: false });
            estudiantesDeEvaluacion.length > 0
              ? dispatch({
                  type: AppAction.ESTUDIANTES_DE_EVALUACION,
                  payload: estudiantesDeEvaluacion,
                })
              : dispatch({ type: AppAction.ESTUDIANTES_DE_EVALUACION, payload: [] });
          },
          (error: Error) => {
            console.log('Error en query estudiantes:', error);
            dispatch({ type: AppAction.LOADER_PAGES, payload: false });
            dispatch({ type: AppAction.ESTUDIANTES_DE_EVALUACION, payload: [] });
          }
        );
      },
      (error: Error) => {
        console.log('Error en query estudiantes evaluados:', error);
        dispatch({ type: AppAction.LOADER_PAGES, payload: false });
        dispatch({ type: AppAction.ESTUDIANTES_DE_EVALUACION, payload: [] });
      }
    );

    // Retornar función para desuscribirse de ambos listeners
    return () => {
      if (unsubscribeEstudiantes) {
        unsubscribeEstudiantes();
      }
      unsubscribeEstudiantesEvaluados();
    };
  };

  const getEvaluaciones = () => {
    // let allEvaluaciones: Evaluaciones[] = []
    dispatch({ type: AppAction.LOADER_PAGES, payload: true });
    const pathRef = collection(db, 'evaluaciones');
    const q = query(pathRef, where('rol', '==', 4));

    // Usar onSnapshot para actualizaciones en tiempo real
    const unsubscribe = onSnapshot(
      q,
      (querySnapshot: QuerySnapshot<DocumentData>) => {
        let allEvaluaciones: Evaluaciones[] = [];
        querySnapshot.forEach((doc) => {
          allEvaluaciones.push({ ...doc.data(), id: doc.id });
        });

        dispatch({ type: AppAction.EVALUACIONES, payload: allEvaluaciones });
        dispatch({ type: AppAction.LOADER_PAGES, payload: false });
      },
      (error: Error) => {
        console.log('Error en getEvaluaciones:', error);
        dispatch({ type: AppAction.LOADER_PAGES, payload: false });
      }
    );

    // Retornar la función de limpieza para poder desuscribirse
    return unsubscribe;
  };

  const getGrades = async () => {
    const refGrados = collection(db, 'grados');
    const q = query(refGrados, orderBy('grado'));
    await getDocs(q).then((res) => {
      const grados: Grades[] = [];
      if (res.size > 0) {
        res.forEach((doc) => {
          grados.push({ ...doc.data(), id: doc.id });
        });
      }
      dispatch({ type: AppAction.GRADOS, payload: grados });
    });
  };

  const getEvaluacionesGradoYCategoria = async (grado: number, categoria: number) => {
    dispatch({ type: AppAction.LOADER_PAGES, payload: true });

    if (!grado || !categoria) {
      dispatch({ type: AppAction.EVALUACIONES_GRADO_CATEGORIA, payload: [] });
      dispatch({ type: AppAction.LOADER_PAGES, payload: false });
      return () => {}; // Retorna función vacía si no hay parámetros válidos
    }

    const refGrados = collection(db, 'evaluaciones');
    const q = query(
      refGrados,
      where('grado', '==', Number(grado)),
      where('categoria', '==', Number(categoria)),
      where('rol', '==', 4)
    );
    const q1 = query(
      refGrados,
      where('grado', '==', Number(grado)),
      where('categoria', '==', Number(categoria)),
      where('idDocente', '==', `${currentUserData.dniDirector}`)
    );

    let evaluacionesQ: Evaluaciones[] = [];
    let evaluacionesQ1: Evaluaciones[] = [];

    // Función para combinar y actualizar los resultados
    const updateCombinedResults = () => {
      const allEvaluaciones = [...evaluacionesQ, ...evaluacionesQ1];
      dispatch({ type: AppAction.EVALUACIONES_GRADO_CATEGORIA, payload: allEvaluaciones });
      dispatch({ type: AppAction.LOADER_PAGES, payload: false });
    };

    // Listener para evaluaciones con rol 4
    const unsubscribeQ = onSnapshot(
      q,
      (querySnapshot: QuerySnapshot<DocumentData>) => {
        evaluacionesQ = [];
        querySnapshot.forEach((doc) => {
          evaluacionesQ.push({ ...doc.data(), id: doc.id });
        });
        updateCombinedResults();
      },
      (error: Error) => {
        console.log('Error en query Q:', error);
        dispatch({ type: AppAction.LOADER_PAGES, payload: false });
      }
    );

    // Listener para evaluaciones del docente específico
    const unsubscribeQ1 = onSnapshot(
      q1,
      (querySnapshot: QuerySnapshot<DocumentData>) => {
        evaluacionesQ1 = [];
        querySnapshot.forEach((doc) => {
          evaluacionesQ1.push({ ...doc.data(), id: doc.id });
        });
        updateCombinedResults();
      },
      (error: Error) => {
        console.log('Error en query Q1:', error);
        dispatch({ type: AppAction.LOADER_PAGES, payload: false });
      }
    );

    // Retornar función para desuscribirse de ambos listeners
    return () => {
      unsubscribeQ();
      unsubscribeQ1();
    };
  };
  const crearEvaluacion = async (value: CreaEvaluacion) => {
    dispatch({ type: AppAction.LOADER_PAGES, payload: true });
    // 1. Obtiene una referencia a la colección 'productos' y un ID autogenerado
    const nuevoProductoRef = doc(collection(db, 'evaluaciones'));

    // 2. Obtiene el ID del documento
    /* ).then((res) => dispatch({ type: AppAction.LOADER_PAGES, payload: false }));
} */

    const nuevoProductoId: string = nuevoProductoRef.id;
    try {
      await setDoc(nuevoProductoRef, {
        id: nuevoProductoId,
        idDocente: currentUserData.dni,
        nombre: value.nombreEvaluacion,
        grado: Number(value.grado),
        categoria: Number(value.categoria),
        rol: 4,
        tipoDeEvaluacion: value.tipoDeEvaluacion,
        mesDelExamen: `${currentMonth}`,
        active: false,
      });
    } catch (error) {
      console.log('error', error);
    } finally {
      dispatch({ type: AppAction.LOADER_PAGES, payload: false });
    }
  };
  const getEvaluacion = (id: string) => {
    const docRef = doc(db, 'evaluaciones', `${id}`);

    // Usar onSnapshot para cambios en tiempo real
    onSnapshot(
      docRef,
      (docSnap) => {
        if (docSnap.exists()) {
          dispatch({ type: AppAction.EVALUACION, payload: { id: docSnap.id, ...docSnap.data() } });
        }
      },
      (error: Error) => {
        console.log('Error al obtener evaluación:', error);
      }
    );
  };

  const getPreguntasRespuestas = async (id: string) => {
    dispatch({ type: AppAction.LOADER_PAGES, payload: true });
    console.log('id', id);
    if (id && id.length > 0) {
      // Inicializar el contador si no existe
      await initializeCounter(id);

      const pethRef = collection(db, `/evaluaciones/${id}/preguntasRespuestas`);
      const q = query(pethRef, orderBy('order', 'asc'));

      return onSnapshot(
        q,
        (querySnapshot: QuerySnapshot<DocumentData>) => {
          const count = querySnapshot.size;
          let preguntasrespuestas: PreguntasRespuestas[] = [];

          querySnapshot.forEach((doc) => {
            preguntasrespuestas.push({ ...doc.data(), id: doc.id });
          });

          // Ordenar por ID de manera ascendente (convertir a número para ordenamiento correcto)
          preguntasrespuestas.sort((a, b) => {
            const idA = parseInt(a.order?.toString() || '0');
            const idB = parseInt(b.order?.toString() || '0');
            return idA - idB;
          });

          // Agregar alternativa "no respondió" a todas las preguntas
          const preguntasConNoRespondio = addNoRespondioAlternative(preguntasrespuestas);

          dispatch({ type: AppAction.PREGUNTAS_RESPUESTAS, payload: preguntasConNoRespondio });
          dispatch({ type: AppAction.SIZE_PREGUNTAS, payload: count });
          dispatch({ type: AppAction.LOADER_PAGES, payload: false });
        },
        (error: Error) => {
          console.log('error', error);
          dispatch({ type: AppAction.LOADER_PAGES, payload: false });
        }
      );
    } else {
      // Si no hay id válido, limpiar el estado y desactivar el loader
      dispatch({ type: AppAction.PREGUNTAS_RESPUESTAS, payload: [] });
      dispatch({ type: AppAction.SIZE_PREGUNTAS, payload: 0 });
      dispatch({ type: AppAction.LOADER_PAGES, payload: false });
    }
  };

  // Alternativa con timestamp como ID
  const guardarPreguntasRespuestas = async (data: PreguntasRespuestas) => {
    console.log('data', data);

    try {
      // Usar transacción para garantizar atomicidad en el contador
      const nextId = await runTransaction(db, async (transaction) => {
        // Referencia al documento contador
        const counterRef = doc(db, `/evaluaciones/${data.id}/metadata/counter`);
        const counterDoc = await transaction.get(counterRef);

        let nextCount: number;

        if (!counterDoc.exists()) {
          // Si no existe el contador, inicializarlo en 1
          nextCount = 1;
          transaction.set(counterRef, { count: nextCount });
        } else {
          // Si existe, incrementar el contador
          nextCount = counterDoc.data().count + 1;
          transaction.update(counterRef, { count: nextCount });
        }

        // Crear el documento de la pregunta con el ID secuencial
        const preguntaRef = doc(db, `/evaluaciones/${data.id}/preguntasRespuestas`, `${nextCount}`);
        transaction.set(preguntaRef, {
          pregunta: data.pregunta,
          respuesta: data.respuesta,
          alternativas: data.alternativas,
          preguntaDocente: data.preguntaDocente,
          order: nextCount,
          timestamp: serverTimestamp(),
        });

        return nextCount;
      });

      console.log(`Pregunta guardada con ID secuencial: ${nextId}`);
    } catch (error) {
      console.error('Error al guardar pregunta con ID secuencial:', error);
      throw error;
    }
  };

  const addRangosNivel = async (nivelYPuntaje: NivelYPuntaje[], evaluacion: Evaluacion) => {
    console.log('evaluacion', evaluacion);
    const rutaRef = doc(db, `evaluaciones`, `${evaluacion.id}`);
    await updateDoc(rutaRef, {
      nivelYPuntaje: nivelYPuntaje,
    });
  };

  const dataConAlternativasNoRespondidas = (preguntasRespuestas: PreguntasRespuestas[]): PreguntasRespuestas[] => {
    return preguntasRespuestas.map((pregunta) => {
      // Verificar si alguna alternativa tiene descripción "no respondio" y está seleccionada
      const tieneNoRespondioSeleccionado = pregunta.alternativas?.some(
        (alternativa) => 
          alternativa.descripcion?.toLowerCase() === "no respondio" && 
          alternativa.selected === true
      );

      if (tieneNoRespondioSeleccionado && pregunta.alternativas && pregunta.respuesta) {
        console.log('=== PROCESANDO PREGUNTA CON "NO RESPONDIÓ" ===');
        console.log('Pregunta:', pregunta.pregunta);
        console.log('Respuesta correcta:', pregunta.respuesta);
        console.log('Alternativas originales:', pregunta.alternativas);
        
        // Crear una copia de las alternativas
        const alternativasModificadas = [...pregunta.alternativas];
        
        // Filtrar las alternativas que NO son "no respondio" y que NO coinciden con la respuesta
        const alternativasElegibles = alternativasModificadas.filter((alternativa) => {
          const esNoRespondio = alternativa.descripcion?.toLowerCase() === "no respondio";
          const coincideConRespuesta = alternativa.alternativa?.toString().toLowerCase() === pregunta.respuesta?.toString().toLowerCase();
          console.log(`Alternativa: "${alternativa.descripcion}" (valor: "${alternativa.alternativa}") - EsNoRespondio: ${esNoRespondio}, CoincideConRespuesta: ${coincideConRespuesta}`);
          return !esNoRespondio && !coincideConRespuesta;
        });

        console.log('Alternativas elegibles (excluyendo "no respondió" y respuesta correcta):', alternativasElegibles);

        // Si hay alternativas elegibles, seleccionar una aleatoriamente
        if (alternativasElegibles.length > 0) {
          // Deseleccionar todas las alternativas primero
          alternativasModificadas.forEach((alt) => {
            alt.selected = false;
          });

          // Seleccionar una alternativa aleatoria de las elegibles
          const indiceAleatorio = Math.floor(Math.random() * alternativasElegibles.length);
          const alternativaSeleccionada = alternativasElegibles[indiceAleatorio];
          
          console.log('Alternativa seleccionada aleatoriamente:', alternativaSeleccionada);
          
          // Encontrar y seleccionar la alternativa en el array original
          const indiceEnArrayOriginal = alternativasModificadas.findIndex(
            (alt) => alt.descripcion === alternativaSeleccionada.descripcion
          );
          
          if (indiceEnArrayOriginal !== -1) {
            alternativasModificadas[indiceEnArrayOriginal].selected = true;
            console.log('Alternativa seleccionada en el array modificado:', alternativasModificadas[indiceEnArrayOriginal]);
          }

          // Eliminar la alternativa "no respondió" del array
          const alternativasSinNoRespondio = alternativasModificadas.filter(
            (alt) => alt.descripcion?.toLowerCase() !== "no respondio"
          );
          
          console.log('Alternativas después de eliminar "no respondió":', alternativasSinNoRespondio);
          
          // Actualizar el array de alternativas modificadas
          alternativasModificadas.length = 0;
          alternativasModificadas.push(...alternativasSinNoRespondio);
          
        } else {
          console.log('No hay alternativas elegibles (todas son "no respondió" o coinciden con la respuesta correcta)');
        }

        console.log('Alternativas finales:', alternativasModificadas);
        console.log('=== FIN PROCESAMIENTO ===');

        return {
          ...pregunta,
          alternativas: alternativasModificadas
        };
      }

      // Si no hay "no respondio" seleccionado, devolver la pregunta sin cambios
      return pregunta;
    });
  };
  const salvarPreguntRespuestaEstudiante = async (
    data: UserEstudiante,
    idEvaluacion: string,
    pq: PreguntasRespuestas[],
    respuestasCorrectas: number,
    sizePreguntas: number,
    evaluacion: Evaluacion
  ) => {
    let puntajeAcumulado = 0;
    dispatch({ type: AppAction.LOADER_SALVAR_PREGUNTA, payload: true });
    
    // Procesar las alternativas para cambiar "no respondió" por una alternativa aleatoria
    const pqConAlternativasAleatorias = dataConAlternativasNoRespondidas(pq);
    console.log('pqConAlternativasAleatorias', pqConAlternativasAleatorias);
    //guarda la informacion para el propio docente
    /* const rutaRef = doc(db, `/usuarios/${currentUserData.dni}/${id}/${data.dni}`); */
    const rutaRef = doc(
      db,
      `usuarios/${currentUserData.dni}/${idEvaluacion}/${currentYear}/${evaluacion.mesDelExamen}/${data.dni}`
    );

    await setDoc(rutaRef, {
      nombresApellidos: data.nombresApellidos,
      dni: data.dni,
      dniDocente: currentUserData.dni,
      grado: `${data.grado}`,
      seccion: `${data.seccion}`,
      genero: `${data.genero}`,
      respuestasCorrectas: respuestasCorrectas,
      totalPreguntas: sizePreguntas,
      respuestas: pqConAlternativasAleatorias,
    });
    const rutaCrearEstudiante = doc(
      db,
      `/usuarios/${currentUserData.dni}/estudiantes-docentes/${data.dni}`
    );
    ('/usuarios/80509804/estudiantes-docentes/2025/4/47163626');
    await setDoc(rutaCrearEstudiante, {
      nombresApellidos: data.nombresApellidos,
      dni: data.dni,
      grado: `${data.grado}`,
      seccion: `${data.seccion}`,
      genero: `${data.genero}`,
    });

    const rutaEstudianteParaEvaluacion = doc(
      db,
      `/evaluaciones/${idEvaluacion}/estudiantes-evaluados/${currentYear}/${evaluacion.mesDelExamen}`,
      `${data.dni}`
    );
    // Incluir las respuestas en el objeto data antes de calcular el nivel
    const dataConRespuestas = {
      ...data,
      respuestas: pqConAlternativasAleatorias,
    };

    if (evaluacion.tipoDeEvaluacion === '1') {
      try {
        const dataEstudiante = calculoNivel(dataConRespuestas, evaluacion);
        // Crear el objeto base del documento
        const documentoEstudiante: any = {
          nombresApellidos: dataEstudiante.nombresApellidos,
          dni: dataEstudiante.dni,
          grado: `${dataEstudiante.grado}`,
          seccion: `${dataEstudiante.seccion}`,
          genero: `${dataEstudiante.genero}`,
          respuestas: pqConAlternativasAleatorias,
          region: currentUserData.region,
          dniDocente: currentUserData.dni,
        };
        // Solo agregar puntaje y nivel si tienen datos válidos
        if (
          dataEstudiante.puntaje !== undefined &&
          dataEstudiante.puntaje !== null &&
          dataEstudiante.puntaje !== 0
        ) {
          documentoEstudiante.puntaje = dataEstudiante.puntaje;
        }

        if (
          dataEstudiante.nivel !== undefined &&
          dataEstudiante.nivel !== null &&
          dataEstudiante.nivel !== ''
        ) {
          documentoEstudiante.nivel = dataEstudiante.nivel;
        }
        await setDoc(rutaEstudianteParaEvaluacion, documentoEstudiante);
      } catch (error) {
        console.log('error', error);
      } finally {
        dispatch({ type: AppAction.LOADER_SALVAR_PREGUNTA, payload: false });
      }
    }
    if (evaluacion.tipoDeEvaluacion === '0') {
      
      try {
        await setDoc(rutaEstudianteParaEvaluacion, dataConRespuestas);
      } catch (error) {
        console.log('error', error);
      } finally {
        dispatch({ type: AppAction.LOADER_SALVAR_PREGUNTA, payload: false });
      }
    }
    
  };
  const prEstudiantes = (data: PreguntasRespuestas[]) => {
    dispatch({ type: AppAction.PREGUNTAS_RESPUESTAS_ESTUDIANTES, payload: data });
  };
  const resetPRestudiantes = (id: string) => {
    dispatch({ type: AppAction.PREGUNTAS_RESPUESTAS_ESTUDIANTES, payload: [] });
    getPreguntasRespuestas(id);
  };

  const deleteEvaluacion = async (id: string) => {
    await deleteDoc(doc(db, 'evaluaciones', `${id}`));
    // No es necesario llamar getEvaluaciones() aquí porque onSnapshot ya actualiza automáticamente
  };

  const updateEvaluacion = async (evaluacion: Evaluaciones, id: string) => {
    const pathRef = doc(db, 'evaluaciones', `${id}`);
    console.log('rta', evaluacion);
    await updateDoc(pathRef, { ...evaluacion, timestamp: serverTimestamp() });
    // No es necesario llamar getEvaluaciones() aquí porque onSnapshot ya actualiza automáticamente
    // El re-renderizado completo causaba que la página volviera al top
  };

  const updatePreguntaRespuesta = async (
    data: PreguntasRespuestas,
    alternativass: Alternativa[],
    id: string
  ) => {
    console.log('data final', { ...data, alternativas: alternativass });
    const pathRef = doc(db, `/evaluaciones/${id}/preguntasRespuestas`, `${data.id}`);
    console.log('alternativasslengh', alternativass.length);
    console.log('3', alternativass[3]);
    if (alternativass[3] === undefined) {
      await updateDoc(pathRef, {
        order: data.order,
        pregunta: data.pregunta,
        preguntaDocente: data.preguntaDocente,
        respuesta: data.respuesta,
        puntaje: data.puntaje || '0',
        alternativas: [
          {
            // selected: alternativass[0].selected,
            descripcion: alternativass[0].descripcion,
            alternativa: alternativass[0].alternativa,
          },
          {
            // selected: alternativass[1].selected,
            descripcion: alternativass[1].descripcion,
            alternativa: alternativass[1].alternativa,
          },
          {
            // selected: alternativass[2].selected,
            descripcion: alternativass[2].descripcion,
            alternativa: alternativass[2].alternativa,
          },
        ],
      }).then((res) => getPreguntasRespuestas(id));
    } else {
      await updateDoc(pathRef, {
        order: data.order,
        pregunta: data.pregunta,
        preguntaDocente: data.preguntaDocente,
        respuesta: data.respuesta,
        puntaje: data.puntaje || '0',
        alternativas: [
          {
            // selected: alternativass[0].selected,
            descripcion: alternativass[0].descripcion,
            alternativa: alternativass[0].alternativa,
          },
          {
            // selected: alternativass[1].selected,
            descripcion: alternativass[1].descripcion,
            alternativa: alternativass[1].alternativa,
          },
          {
            // selected: alternativass[2].selected,
            descripcion: alternativass[2].descripcion,
            alternativa: alternativass[2].alternativa,
          },
          {
            // selected: alternativass[3].selected,
            descripcion: alternativass[3].descripcion,
            alternativa: alternativass[3].alternativa,
          },
        ],
      }).then((res) => getPreguntasRespuestas(id));
    }
  };

  const getEvaluacionesDirector = async () => {
    const pathRef = collection(db, 'evaluaciones');
    const q = query(pathRef, where('idDocente', '==', `${currentUserData.dni}`));
    await getDocs(q).then(async (res) => {
      const arrayEvaluacionesDirector: Evaluaciones[] = [];
      res.forEach((doc) => {
        arrayEvaluacionesDirector.push({ ...doc.data(), id: doc.id });
      });
      dispatch({ type: AppAction.EVALUACIONES_DIRECTOR, payload: arrayEvaluacionesDirector });
    });
  };

  // Función para inicializar el contador basándose en el ID más alto existente
  const initializeCounter = async (idEvaluacion: string) => {
    try {
      const counterRef = doc(db, `/evaluaciones/${idEvaluacion}/metadata/counter`);
      const counterDoc = await getDoc(counterRef);

      if (!counterDoc.exists()) {
        // Obtener todas las preguntas existentes
        const preguntasSnapshot = await getDocs(
          collection(db, `/evaluaciones/${idEvaluacion}/preguntasRespuestas`)
        );

        let maxId = 0;
        preguntasSnapshot.forEach((doc) => {
          const id = parseInt(doc.id);
          if (!isNaN(id) && id > maxId) {
            maxId = id;
          }
        });

        // Inicializar el contador con el ID más alto encontrado
        await setDoc(counterRef, { count: maxId });
        console.log(`Contador inicializado con valor: ${maxId}`);
      }
    } catch (error) {
      console.error('Error al inicializar contador:', error);
    }
  };

  const deletePreguntaRespuesta = async (
    idEvaluacion: string,
    idPregunta: string,
    order: number
  ) => {
    console.log('=== INICIO DELETE PREGUNTA ===');
    console.log('idEvaluacion:', idEvaluacion);
    console.log('idPregunta:', idPregunta);
    console.log('order:', order);

    dispatch({ type: AppAction.LOADER_SALVAR_PREGUNTA, payload: true });

    try {
      // Verificar que los parámetros no sean undefined
      if (!idEvaluacion || !idPregunta || order === undefined) {
        console.error('Parámetros inválidos:', { idEvaluacion, idPregunta, order });
        dispatch({ type: AppAction.LOADER_SALVAR_PREGUNTA, payload: false });
        return;
      }

      // Primero, eliminar la pregunta en una transacción simple
      console.log('Eliminando pregunta...');
      await runTransaction(db, async (transaction) => {
        // DESPUÉS: Todas las escrituras
        const preguntaRef = doc(
          db,
          `/evaluaciones/${idEvaluacion}/preguntasRespuestas`,
          idPregunta
        );
        console.log(
          'Ruta de la pregunta:',
          `/evaluaciones/${idEvaluacion}/preguntasRespuestas/${idPregunta}`
        );
        transaction.delete(preguntaRef);

        // NO decrementar el contador para mantener IDs únicos
        // El contador debe ser siempre incremental
      });

      console.log('Pregunta eliminada exitosamente');

      // Después, reorganizar las preguntas restantes (fuera de la transacción)
      console.log('Reorganizando preguntas restantes...');
      const preguntasSnapshot = await getDocs(
        collection(db, `/evaluaciones/${idEvaluacion}/preguntasRespuestas`)
      );
      const batch = writeBatch(db);

      preguntasSnapshot.forEach((doc) => {
        const pregunta = doc.data();
        if (pregunta.order > order) {
          console.log(
            `Actualizando orden de pregunta ${doc.id} de ${pregunta.order} a ${pregunta.order - 1}`
          );
          batch.update(doc.ref, { order: pregunta.order - 1 });
        }
      });

      // Ejecutar todas las actualizaciones de orden
      await batch.commit();
      console.log('Orden de preguntas actualizado');

      // Recargar las preguntas
      console.log('Recargando preguntas...');
      await getPreguntasRespuestas(idEvaluacion);

      dispatch({ type: AppAction.LOADER_SALVAR_PREGUNTA, payload: false });
      console.log('=== FIN DELETE PREGUNTA EXITOSO ===');
    } catch (error) {
      console.error('=== ERROR AL BORRAR LA PREGUNTA ===');
      console.error('Error details:', error);
      dispatch({ type: AppAction.LOADER_SALVAR_PREGUNTA, payload: false });
    }
  };

  // Función para reparar el contador en caso de desincronización
  const repairCounter = async (idEvaluacion: string) => {
    try {
      const preguntasSnapshot = await getDocs(
        collection(db, `/evaluaciones/${idEvaluacion}/preguntasRespuestas`)
      );

      let maxId = 0;
      preguntasSnapshot.forEach((doc) => {
        const id = parseInt(doc.id);
        if (!isNaN(id) && id > maxId) {
          maxId = id;
        }
      });

      const counterRef = doc(db, `/evaluaciones/${idEvaluacion}/metadata/counter`);
      await setDoc(counterRef, { count: maxId }, { merge: true });

      console.log(`Contador reparado. Nuevo valor: ${maxId}`);
    } catch (error) {
      console.error('Error al reparar contador:', error);
    }
  };

  return {
    guardarPreguntasRespuestas,
    crearEvaluacion,
    getEvaluaciones,
    getEvaluacion,
    getPreguntasRespuestas,
    prEstudiantes,
    salvarPreguntRespuestaEstudiante,
    getGrades,
    getEvaluacionesGradoYCategoria,
    resetPRestudiantes,
    deleteEvaluacion,
    updateEvaluacion,
    updatePreguntaRespuesta,
    getEvaluacionesDirector,
    deletePreguntaRespuesta,
    initializeCounter,
    repairCounter,
    obtenerEstudianteDeEvaluacion,
    getTipoDeEvaluacion,
    addRangosNivel,
  };
};
