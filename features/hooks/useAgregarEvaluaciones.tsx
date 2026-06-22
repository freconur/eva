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
  Category,
  NivelYPuntaje,
  PreguntasRespuestas,
  TipoDeEvaluacion,
  User,
  UserEstudiante,
} from '../types/types';
import { currentMonth, currentYear } from '@/fuctions/dates';
import { calculoNivel } from '../utils/calculoNivel';
import { addNoRespondioAlternative } from '../utils/addNoRespondioAlternative';
import { useState } from 'react';
import { EstudianteImportado } from '@/features/types/estudiante';
import { toast } from 'react-toastify';
import { httpsCallable } from 'firebase/functions';
import { functions } from '@/firebase/firebase.config';

export const useAgregarEvaluaciones = () => {
  const dispatch = useGlobalContextDispatch();
  const { currentUserData } = useGlobalContext();

  const checkAuditReadOnly = (): boolean => {
    if (typeof window !== 'undefined' && sessionStorage.getItem('audited_user')) {
      toast.warning('Modo de Auditoría: No se permite modificar información en este modo.');
      return true;
    }
    return false;
  };
  const db = getFirestore();
  const [totalPreguntas, setTotalPreguntas] = useState<number>(0)
  const [loaderCrearEstudiantes, setLoaderCrearEstudiantes] = useState<boolean>(false);

  const updateEvaluacionesSentinel = async () => {
    try {
      const sentinelRef = doc(db, 'options', 'evaluaciones_sentinel');
      await setDoc(sentinelRef, { lastUpdate: serverTimestamp() }, { merge: true });
    } catch (error) {
      console.error('Error actualizando centinela:', error);
    }
  };

  const updatePreguntasSentinel = async (evaluacionId: string) => {
    try {
      const sentinelRef = doc(db, 'options', `preguntas_sentinel_${evaluacionId}`);
      await setDoc(sentinelRef, { lastUpdate: serverTimestamp() }, { merge: true });
    } catch (error) {
      console.error('Error actualizando centinela de preguntas:', error);
    }
  };


  const crearEstudiantesImportados = async (estudiantes: EstudianteImportado[]) => {
    if (checkAuditReadOnly()) return;
    // Validar parámetros
    if (!estudiantes || estudiantes.length === 0) {
      console.warn('No hay estudiantes para crear');
      return;
    }

    setLoaderCrearEstudiantes(true);

    try {
      const batch = writeBatch(db);
      const rutaColeccion = `usuarios/${currentUserData.dni}/estudiantes-docentes`;

      estudiantes.forEach((estudiante) => {
        // Validar datos del estudiante
        if (!estudiante.dni || !estudiante.nombresApellidos) {
          console.warn('Estudiante con datos incompletos:', estudiante);
          return;
        }

        // Crear referencia al documento usando el DNI como ID
        const docRef = doc(db, rutaColeccion, estudiante.dni);

        // Agregar al batch
        batch.set(docRef, {
          dni: estudiante.dni,
          nombresApellidos: estudiante.nombresApellidos,
          grado: estudiante.grado,
          seccion: estudiante.seccion,
          genero: estudiante.genero,
          fechaCreacion: serverTimestamp(),
        });
      });

      // Ejecutar todas las operaciones de una vez
      await batch.commit();
    } catch (error) {
      console.error('Error al crear estudiantes:', error);
      throw error; // Re-lanzar el error para que el componente pueda manejarlo
    } finally {
      setLoaderCrearEstudiantes(false);
    }
  }

  // Función para crear un estudiante individual
  const crearEstudianteIndividual = async (estudiante: EstudianteImportado) => {
    if (checkAuditReadOnly()) return;
    // Validar parámetros
    if (!estudiante.dni || !estudiante.nombresApellidos || !estudiante.grado || !estudiante.seccion || !estudiante.genero) {
      throw new Error('Todos los campos son requeridos');
    }

    setLoaderCrearEstudiantes(true);

    try {
      const rutaColeccion = `usuarios/${currentUserData.dni}/estudiantes-docentes`;
      const docRef = doc(db, rutaColeccion, estudiante.dni);

      // Verificar si el estudiante ya existe
      const docSnap = await getDoc(docRef);
      if (docSnap.exists()) {
        throw new Error('Ya existe un estudiante con este DNI');
      }

      // Crear el documento del estudiante
      await setDoc(docRef, {
        dni: estudiante.dni,
        nombresApellidos: estudiante.nombresApellidos,
        grado: estudiante.grado,
        seccion: estudiante.seccion,
        genero: estudiante.genero,
        fechaCreacion: serverTimestamp(),
      });

      return { success: true, message: 'Estudiante creado exitosamente' };
    } catch (error: any) {
      console.error('Error al crear estudiante:', error);
      throw error;
    } finally {
      setLoaderCrearEstudiantes(false);
    }
  }

  // Función para actualizar un estudiante individual
  const actualizarEstudiante = async (estudiante: EstudianteImportado) => {
    if (checkAuditReadOnly()) return;
    // Validar parámetros
    if (!estudiante.dni || !estudiante.nombresApellidos || !estudiante.grado || !estudiante.seccion || !estudiante.genero) {
      throw new Error('Todos los campos son requeridos');
    }

    setLoaderCrearEstudiantes(true);

    try {
      const rutaColeccion = `usuarios/${currentUserData.dni}/estudiantes-docentes`;
      const docRef = doc(db, rutaColeccion, estudiante.dni);

      // Verificar si el estudiante existe
      const docSnap = await getDoc(docRef);
      if (!docSnap.exists()) {
        throw new Error('El estudiante no existe');
      }

      // Actualizar el documento del estudiante
      await updateDoc(docRef, {
        nombresApellidos: estudiante.nombresApellidos,
        grado: estudiante.grado,
        seccion: estudiante.seccion,
        genero: estudiante.genero,
        fechaActualizacion: serverTimestamp(),
      });

      return { success: true, message: 'Estudiante actualizado exitosamente' };
    } catch (error: any) {
      console.error('Error al actualizar estudiante:', error);
      throw error;
    } finally {
      setLoaderCrearEstudiantes(false);
    }
  }

  // Función para eliminar un estudiante individual
  const eliminarEstudiante = async (dni: string) => {
    if (checkAuditReadOnly()) return;
    // Validar parámetro
    if (!dni) {
      throw new Error('El DNI es requerido');
    }

    setLoaderCrearEstudiantes(true);

    try {
      const rutaColeccion = `usuarios/${currentUserData.dni}/estudiantes-docentes`;
      const docRef = doc(db, rutaColeccion, dni);

      // Verificar si el estudiante existe
      const docSnap = await getDoc(docRef);
      if (!docSnap.exists()) {
        throw new Error('El estudiante no existe');
      }

      // Eliminar el documento del estudiante
      await deleteDoc(docRef);

      return { success: true, message: 'Estudiante eliminado exitosamente' };
    } catch (error: any) {
      console.error('Error al eliminar estudiante:', error);
      throw error;
    } finally {
      setLoaderCrearEstudiantes(false);
    }
  }

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
          }
        }
      },
      (error: Error) => {
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

    const rutaEstudiantesEvaluados = query(
      collection(db, `/evaluaciones/${evaluacion.id}/estudiantes-evaluados/${evaluacion.añoDelExamen || currentYear}/${month}/`),
      where('dniDocente', '==', currentUserData.dni)
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
            dispatch({ type: AppAction.LOADER_PAGES, payload: false });
            estudiantesDeEvaluacion.length > 0
              ? dispatch({
                type: AppAction.ESTUDIANTES_DE_EVALUACION,
                payload: estudiantesDeEvaluacion,
              })
              : dispatch({ type: AppAction.ESTUDIANTES_DE_EVALUACION, payload: [] });
          },
          (error: Error) => {
            dispatch({ type: AppAction.LOADER_PAGES, payload: false });
            dispatch({ type: AppAction.ESTUDIANTES_DE_EVALUACION, payload: [] });
          }
        );
      },
      (error: Error) => {
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
          allEvaluaciones.push({ ...doc.data(), id: doc.id } as Evaluaciones);
        });

        dispatch({ type: AppAction.EVALUACIONES, payload: allEvaluaciones });
        dispatch({ type: AppAction.LOADER_PAGES, payload: false });
      },
      (error: Error) => {
        dispatch({ type: AppAction.LOADER_PAGES, payload: false });
      }
    );

    // Retornar la función de limpieza para poder desuscribirse
    return unsubscribe;
  };

  const getEvaluacionesOnce = async () => {
    dispatch({ type: AppAction.LOADER_PAGES, payload: true });
    try {
      const pathRef = collection(db, 'evaluaciones');
      const q = query(pathRef, where('rol', '==', 4));
      const querySnapshot = await getDocs(q);
      
      const allEvaluaciones: Evaluaciones[] = [];
      querySnapshot.forEach((doc) => {
        allEvaluaciones.push({ ...doc.data(), id: doc.id } as Evaluaciones);
      });

      dispatch({ type: AppAction.EVALUACIONES, payload: allEvaluaciones });
      return allEvaluaciones;
    } catch (error) {
      console.error('Error al obtener evaluaciones:', error);
      return [];
    } finally {
      dispatch({ type: AppAction.LOADER_PAGES, payload: false });
    }
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

  const getCategories = async () => {
    const refCategorias = collection(db, 'categorias');
    const q = query(refCategorias, orderBy('id'));
    await getDocs(q).then((res) => {
      const categorias: Category[] = [];
      if (res.size > 0) {
        res.forEach((doc) => {
          categorias.push({ ...doc.data() as Category, docId: doc.id });
        });
      }
      dispatch({ type: AppAction.CATEGORIAS, payload: categorias });
    });
  };

  const crearCategoria = async (nombreCategoria: string, nivel: number) => {
    if (checkAuditReadOnly()) throw new Error('Modo de Auditoría: No se permite crear categorías.');
    dispatch({ type: AppAction.LOADER_PAGES, payload: true });
    try {
      const refCategorias = collection(db, 'categorias');
      const snap = await getDocs(refCategorias);
      let maxId = 0;
      snap.forEach(doc => {
        const data = doc.data();
        if (data.id && data.id > maxId) {
          maxId = data.id;
        }
      });
      const newId = maxId + 1;
      const docRef = doc(db, 'categorias', newId.toString());
      await setDoc(docRef, {
        id: newId,
        categoria: nombreCategoria,
        activo: true,
        niveles: [nivel]
      });
      await getCategories();
      return newId;
    } catch (error) {
      console.error('Error al crear categoría:', error);
      throw error;
    } finally {
      dispatch({ type: AppAction.LOADER_PAGES, payload: false });
    }
  };

  const actualizarCategoria = async (id: number, nombreCategoria: string, niveles: number[]) => {
    if (checkAuditReadOnly()) return;
    dispatch({ type: AppAction.LOADER_PAGES, payload: true });
    try {
      const docRef = doc(db, 'categorias', id.toString());
      await updateDoc(docRef, {
        categoria: nombreCategoria,
        niveles: niveles
      });
      await getCategories();
    } catch (error) {
      console.error('Error al actualizar categoría:', error);
      throw error;
    } finally {
      dispatch({ type: AppAction.LOADER_PAGES, payload: false });
    }
  };

  const getEvaluacionesGradoYCategoria = async (grado: number, categoria: number) => {
    dispatch({ type: AppAction.LOADER_PAGES, payload: true });

    if (!grado || !categoria) {
      dispatch({ type: AppAction.EVALUACIONES_GRADO_CATEGORIA, payload: [] });
      dispatch({ type: AppAction.LOADER_PAGES, payload: false });
      return () => { }; // Retorna función vacía si no hay parámetros válidos
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
    if (checkAuditReadOnly()) return;
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
        mesDelExamen: value.mesDelExamen || `${currentMonth}`,
        añoDelExamen: value.añoDelExamen || `${currentYear}`,
        active: false,
        nivel: Number(value.nivel),
        realtimeEnabled: true,
      });
      await updateEvaluacionesSentinel();
    } catch (error) {
    } finally {
      dispatch({ type: AppAction.LOADER_PAGES, payload: false });
    }
  };
  const getEvaluacion = (id: string) => {
    const docRef = doc(db, 'evaluaciones', `${id}`);

    // Usar onSnapshot para cambios en tiempo real
    return onSnapshot(
      docRef,
      (docSnap) => {
        if (docSnap.exists()) {
          dispatch({ type: AppAction.EVALUACION, payload: { id: docSnap.id, ...docSnap.data() } });
        }
      },
      (error: Error) => {
        console.error('Error en getEvaluacion:', error);
      }
    );
  };

  const getPreguntasRespuestas = (id: string) => {
    dispatch({ type: AppAction.LOADER_PAGES, payload: true });
    if (id && id.length > 0) {
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
          dispatch({ type: AppAction.LOADER_PAGES, payload: false });
          console.error('Error en getPreguntasRespuestas:', error);
        }
      );
    } else {
      // Si no hay id válido, limpiar el estado y desactivar el loader
      dispatch({ type: AppAction.PREGUNTAS_RESPUESTAS, payload: [] });
      dispatch({ type: AppAction.SIZE_PREGUNTAS, payload: 0 });
      dispatch({ type: AppAction.LOADER_PAGES, payload: false });
      return () => {};
    }
  };

  const getPreguntasRespuestasOnce = async (id: string) => {
    dispatch({ type: AppAction.LOADER_PAGES, payload: true });
    try {
      if (id && id.length > 0) {
        const pathRef = collection(db, `/evaluaciones/${id}/preguntasRespuestas`);
        const q = query(pathRef, orderBy('order', 'asc'));
        const querySnapshot = await getDocs(q);

        const count = querySnapshot.size;
        let preguntasrespuestas: PreguntasRespuestas[] = [];

        querySnapshot.forEach((doc) => {
          preguntasrespuestas.push({ ...doc.data(), id: doc.id });
        });

        // Ordenar por ID de manera ascendente
        preguntasrespuestas.sort((a, b) => {
          const idA = parseInt(a.order?.toString() || '0');
          const idB = parseInt(b.order?.toString() || '0');
          return idA - idB;
        });

        // Agregar alternativa "no respondió"
        const preguntasConNoRespondio = addNoRespondioAlternative(preguntasrespuestas);

        dispatch({ type: AppAction.PREGUNTAS_RESPUESTAS, payload: preguntasConNoRespondio });
        dispatch({ type: AppAction.SIZE_PREGUNTAS, payload: count });
        return preguntasConNoRespondio;
      }
      return [];
    } catch (error) {
      console.error('Error al obtener preguntas/respuestas:', error);
      return [];
    } finally {
      dispatch({ type: AppAction.LOADER_PAGES, payload: false });
    }
  };

  // Alternativa con timestamp como ID
  const guardarPreguntasRespuestas = async (data: PreguntasRespuestas) => {
    if (checkAuditReadOnly()) return;
    try {
      // Inicializar el contador si no existe antes de comenzar la transacción
      if (data.id) {
        await initializeCounter(data.id);
      }

      // Usar transacción para garantizar atomicidad en el contador
      const nextId = await runTransaction(db, async (transaction) => {
        // Referencia a la evaluación para verificar si está activa
        const evalRef = doc(db, `/evaluaciones/${data.id}`);
        const evalDoc = await transaction.get(evalRef);
        if (evalDoc.exists() && evalDoc.data().active) {
          throw new Error("No se pueden agregar preguntas a una evaluación activa");
        }

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
          puntaje: data.puntaje || '0',
          order: nextCount,
          timestamp: serverTimestamp(),
        });

        return nextCount;
      });

      if (data.id) {
        await updatePreguntasSentinel(data.id);
      }
    } catch (error) {
      console.error('Error al guardar pregunta con ID secuencial:', error);
      throw error;
    }
  };

  const addRangosNivel = async (nivelYPuntaje: NivelYPuntaje[], evaluacion: Evaluacion) => {
    if (checkAuditReadOnly()) return;
    const rutaRef = doc(db, `evaluaciones`, `${evaluacion.id}`);
    await updateDoc(rutaRef, {
      nivelYPuntaje: nivelYPuntaje,
    });
    await updateEvaluacionesSentinel();
  };

  const dataConAlternativasNoRespondidas = (preguntasRespuestas: PreguntasRespuestas[]): PreguntasRespuestas[] => {
    // Retornar las preguntas sin alteraciones aleatorias para conservar la alternativa 'no respondio' seleccionada
    return preguntasRespuestas;
  };
  const convertirRespuestasAMapa = (preguntas?: PreguntasRespuestas[]): Record<string, string> => {
    const mapa: Record<string, string> = {};
    if (!preguntas) return mapa;
    preguntas.forEach((p) => {
      const altSeleccionada = p.alternativas?.find((alt) => alt.selected === true);
      if (altSeleccionada && p.id) {
        mapa[p.id] = altSeleccionada.alternativa || "";
      }
    });
    return mapa;
  };

  const salvarPreguntRespuestaEstudiante = async (
    data: UserEstudiante,
    idEvaluacion: string,
    pq: PreguntasRespuestas[],
    respuestasCorrectas: number,
    sizePreguntas: number,
    evaluacion: Evaluacion
  ) => {
    if (checkAuditReadOnly()) return;
    let puntajeAcumulado = 0;
    dispatch({ type: AppAction.LOADER_SALVAR_PREGUNTA, payload: true });

    // Procesar las alternativas para cambiar "no respondió" por una alternativa aleatoria
    const pqConAlternativasAleatorias = dataConAlternativasNoRespondidas(pq);

    //guarda la informacion para el propio docente
    /* const rutaRef = doc(db, `/usuarios/${currentUserData.dni}/${id}/${data.dni}`); */
    const año = evaluacion.añoDelExamen || currentYear.toString();
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
      dniDirector: currentUserData?.dniDirector || '',
    });

    const rutaEstudianteParaEvaluacion = doc(
      db,
      `/evaluaciones/${idEvaluacion}/estudiantes-evaluados/${evaluacion.añoDelExamen || currentYear}/${evaluacion.mesDelExamen}`,
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
          respuestas: convertirRespuestasAMapa(pqConAlternativasAleatorias),
          region: currentUserData.region,
          distrito: currentUserData.distrito || '',
          dniDocente: currentUserData.dni,
          dniDirector: currentUserData?.dniDirector || '',
        };
        // Solo agregar puntaje y nivel si tienen datos válidos
        if (
          dataEstudiante.puntaje !== undefined &&
          dataEstudiante.puntaje !== null
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

        const callAggregate = httpsCallable(functions, 'aggregateStudentEvaluationRealtime');
        await callAggregate({
          idEvaluacion,
          año,
          mes: evaluacion.mesDelExamen,
          dniEstudiante: data.dni,
          newData: documentoEstudiante
        });
      } catch (error) {
        console.error('Error al guardar evaluación en tiempo real:', error);
      } finally {
        dispatch({ type: AppAction.LOADER_SALVAR_PREGUNTA, payload: false });
      }
    }
    if (evaluacion.tipoDeEvaluacion === '0') {
      try {
        const documentoEstudiante = {
          ...dataConRespuestas,
          respuestas: convertirRespuestasAMapa(pqConAlternativasAleatorias),
          dniDirector: currentUserData?.dniDirector || '',
          distrito: currentUserData.distrito || '',
        };

        const callAggregate = httpsCallable(functions, 'aggregateStudentEvaluationRealtime');
        await callAggregate({
          idEvaluacion,
          año,
          mes: evaluacion.mesDelExamen,
          dniEstudiante: data.dni,
          newData: documentoEstudiante
        });
      } catch (error) {
        console.error('Error al guardar evaluación en tiempo real:', error);
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
    if (checkAuditReadOnly()) return;
    await deleteDoc(doc(db, 'evaluaciones', `${id}`));
    await updateEvaluacionesSentinel();
  };

  const updateEvaluacion = async (evaluacion: Evaluaciones, id: string) => {
    if (checkAuditReadOnly()) return;
    const pathRef = doc(db, 'evaluaciones', `${id}`);
    await updateDoc(pathRef, { ...evaluacion, timestamp: serverTimestamp() });
    await updateEvaluacionesSentinel();
  };

  const updatePreguntaRespuesta = async (
    data: PreguntasRespuestas,
    alternativass: Alternativa[],
    id: string
  ) => {
    if (checkAuditReadOnly()) return;

    // Verificar si la evaluación está activa
    const evalRef = doc(db, `/evaluaciones/${id}`);
    const evalDoc = await getDoc(evalRef);
    if (evalDoc.exists() && evalDoc.data().active) {
      throw new Error("No se pueden modificar preguntas de una evaluación activa");
    }

    const pathRef = doc(db, `/evaluaciones/${id}/preguntasRespuestas`, `${data.id}`);
    const alternativasMapped = alternativass.map(alt => ({
      descripcion: alt.descripcion,
      alternativa: alt.alternativa,
    }));
    await updateDoc(pathRef, {
      order: data.order,
      pregunta: data.pregunta,
      preguntaDocente: data.preguntaDocente,
      respuesta: data.respuesta,
      puntaje: data.puntaje || '0',
      alternativas: alternativasMapped,
    });
    await updatePreguntasSentinel(id);
  };

  const updatePreguntaPuntaje = async (
    idEvaluacion: string,
    idPregunta: string,
    puntaje: string
  ) => {
    if (checkAuditReadOnly()) return;

    // Verificar si la evaluación está activa
    const evalRef = doc(db, `/evaluaciones/${idEvaluacion}`);
    const evalDoc = await getDoc(evalRef);
    if (evalDoc.exists() && evalDoc.data().active) {
      throw new Error("No se pueden modificar puntajes de una evaluación activa");
    }

    try {
      const pathRef = doc(db, `/evaluaciones/${idEvaluacion}/preguntasRespuestas`, `${idPregunta}`);
      await updateDoc(pathRef, {
        puntaje: puntaje || '0',
      });
      await updatePreguntasSentinel(idEvaluacion);
    } catch (error) {
      console.error('Error al actualizar puntaje de la pregunta:', error);
      throw error;
    }
  };

  const updatePreguntasOrder = async (
    preguntas: PreguntasRespuestas[],
    evaluacionId: string
  ) => {
    if (checkAuditReadOnly()) return;
    try {
      const batch = writeBatch(db);
      preguntas.forEach((pregunta, index) => {
        const docRef = doc(db, `/evaluaciones/${evaluacionId}/preguntasRespuestas`, `${pregunta.id}`);
        batch.update(docRef, { order: index + 1 });
      });
      await batch.commit();
      await updatePreguntasSentinel(evaluacionId);
    } catch (error) {
      console.error('Error al guardar el nuevo orden de preguntas:', error);
      throw error;
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
    if (checkAuditReadOnly()) return;

    dispatch({ type: AppAction.LOADER_SALVAR_PREGUNTA, payload: true });

    try {
      // Verificar que los parámetros no sean undefined
      if (!idEvaluacion || !idPregunta || order === undefined) {
        console.error('Parámetros inválidos:', { idEvaluacion, idPregunta, order });
        dispatch({ type: AppAction.LOADER_SALVAR_PREGUNTA, payload: false });
        return;
      }

      // Primero, eliminar la pregunta en una transacción simple
      await runTransaction(db, async (transaction) => {
        // DESPUÉS: Todas las escrituras
        const preguntaRef = doc(
          db,
          `/evaluaciones/${idEvaluacion}/preguntasRespuestas`,
          idPregunta
        );

        transaction.delete(preguntaRef);

        // NO decrementar el contador para mantener IDs únicos
        // El contador debe ser siempre incremental
      });


      // Después, reorganizar las preguntas restantes (fuera de la transacción)
      const preguntasSnapshot = await getDocs(
        collection(db, `/evaluaciones/${idEvaluacion}/preguntasRespuestas`)
      );
      const batch = writeBatch(db);

      preguntasSnapshot.forEach((doc) => {
        const pregunta = doc.data();
        if (pregunta.order > order) {

          batch.update(doc.ref, { order: pregunta.order - 1 });
        }
      });

      // Ejecutar todas las actualizaciones de orden
      await batch.commit();

      // Recargar las preguntas
      await updatePreguntasSentinel(idEvaluacion);

      dispatch({ type: AppAction.LOADER_SALVAR_PREGUNTA, payload: false });
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

    } catch (error) {
      console.error('Error al reparar contador:', error);
    }
  };


  const validacionSiEvaluacionTienePreguntasYPuntuacion = async (evaluacion: Evaluaciones) => {
    const pathRef = collection(db, `evaluaciones/${evaluacion.id}/preguntasRespuestas`);
    const preguntasRespuestas = await getDocs(pathRef);
    if (preguntasRespuestas.size > 0) {
      const arrayPreguntasRespuestas: PreguntasRespuestas[] = [];
      preguntasRespuestas.forEach((doc) => {
        arrayPreguntasRespuestas.push({ ...doc.data(), id: doc.id });
      });

      // Validar que todas las preguntas tengan la propiedad puntaje con valor numérico
      const tienePuntajeValido = arrayPreguntasRespuestas.every(pregunta => {
        if (pregunta.puntaje === undefined || pregunta.puntaje === null) {
          return false;
        }

        // Convertir a número si es string
        const puntajeNumerico = typeof pregunta.puntaje === 'string'
          ? parseFloat(pregunta.puntaje)
          : pregunta.puntaje;

        // Verificar que sea un número válido
        return !isNaN(puntajeNumerico) && isFinite(puntajeNumerico);
      });

      // Calcular la suma total de puntajes
      const sumaTotalPuntajes = arrayPreguntasRespuestas.reduce((sum, pregunta) => {
        const puntaje = typeof pregunta.puntaje === 'string'
          ? parseFloat(pregunta.puntaje)
          : (pregunta.puntaje || 0);

        return sum + (isNaN(puntaje) ? 0 : puntaje);
      }, 0);


      return { tienePuntajeValido, totalPreguntas: preguntasRespuestas.size, sumaTotalPuntajes, preguntas: arrayPreguntasRespuestas };
    } else {
      return { tienePuntajeValido: false, totalPreguntas: 0, sumaTotalPuntajes: 0, preguntas: [] };
    }
  }
  return {
    guardarPreguntasRespuestas,
    totalPreguntas,
    crearEvaluacion,
    getEvaluaciones,
    getEvaluacionesOnce,
    getEvaluacion,
    getPreguntasRespuestas,
    getPreguntasRespuestasOnce,
    prEstudiantes,
    salvarPreguntRespuestaEstudiante,
    getGrades,
    getCategories,
    crearCategoria,
    actualizarCategoria,
    getEvaluacionesGradoYCategoria,
    resetPRestudiantes,
    deleteEvaluacion,
    updateEvaluacion,
    updatePreguntaRespuesta,
    updatePreguntaPuntaje,
    updatePreguntasOrder,
    getEvaluacionesDirector,
    deletePreguntaRespuesta,
    initializeCounter,
    repairCounter,
    obtenerEstudianteDeEvaluacion,
    getTipoDeEvaluacion,
    addRangosNivel,
    validacionSiEvaluacionTienePreguntasYPuntuacion,
    crearEstudiantesImportados,
    crearEstudianteIndividual,
    actualizarEstudiante,
    eliminarEstudiante,
    loaderCrearEstudiantes
  };
};
