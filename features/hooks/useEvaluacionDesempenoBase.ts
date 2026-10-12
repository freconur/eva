import { useState, useCallback } from 'react';
import {
  AlternativasDocente,
  CrearEvaluacionDocente,
  PRDocentes,
  PreviewPRDocentes,
  User,
  DimensionEspecialista,
  Evidencia,
  RetroalimentacionDinamica,
  DataEvaluacion,
  NivelYPuntaje,
} from '../types/types';
import { db, storage } from '@/firebase/firebase.config';
import {
  onSnapshot,
  addDoc,
  query,
  where,
  deleteDoc,
  doc,
  collection,
  getDocs,
  setDoc,
  updateDoc,
  getDoc,
  orderBy,
  arrayUnion,
  serverTimestamp,
} from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL, deleteObject } from 'firebase/storage';
import { useGlobalContext, useGlobalContextDispatch } from '../context/GlolbalContext';
import { AppAction } from '../actions/appAction';
import { currentMonth, currentYear, getMonthName } from '@/fuctions/dates';

export type RoleType = 'especialista' | 'director' | 'docente' | 'admin';

export interface UseEvaluacionDesempenoBaseOptions {
  collectionName?: 'evaluaciones-especialista' | 'evaluaciones-docentes' | string;
  role?: RoleType;
  scopeKey?: 'region' | 'dniDirector' | string;
  scopeValue?: string | number | null;
}

export const useEvaluacionDesempenoBase = (options?: UseEvaluacionDesempenoBaseOptions) => {
  const dispatch = useGlobalContextDispatch();
  const { currentUserData, dataEvaluacionDocente } = useGlobalContext();

  const role = options?.role || 'especialista';
  const collectionName =
    options?.collectionName ||
    (role === 'director' ? 'evaluaciones-docentes' : 'evaluaciones-especialista');
  const scopeValue = options?.scopeValue;

  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  // ----------------------------------------------------
  // 1. GESTIÓN DE EVALUACIONES (DOCUMENTO PRINCIPAL)
  // ----------------------------------------------------

  const createEvaluacion = async (data: CrearEvaluacionDocente): Promise<string | undefined> => {
    dispatch({ type: AppAction.LOADER_MODALES, payload: true });
    try {
      const docRef = await addDoc(collection(db, collectionName), {
        ...data,
        active: false,
        fechaCreacion: serverTimestamp(),
      });
      return docRef.id;
    } catch (err: any) {
      console.error(`Error al crear evaluación en ${collectionName}:`, err);
      setError(err?.message || 'Error al crear evaluación');
      throw err;
    } finally {
      dispatch({ type: AppAction.LOADER_MODALES, payload: false });
    }
  };

  const getEvaluaciones = useCallback(() => {
    dispatch({ type: AppAction.LOADER_PAGES, payload: true });
    const unsubscribe = onSnapshot(
      collection(db, collectionName),
      (querySnapshot) => {
        const arrayEvaluaciones: CrearEvaluacionDocente[] = [];
        querySnapshot.forEach((docSnap) => {
          arrayEvaluaciones.push({ ...docSnap.data(), id: docSnap.id });
        });
        dispatch({ type: AppAction.EVALUACIONES_DOCENTES, payload: arrayEvaluaciones });
        dispatch({ type: AppAction.LOADER_PAGES, payload: false });
      },
      (err) => {
        console.error(`Error al obtener evaluaciones de ${collectionName}:`, err);
        dispatch({ type: AppAction.LOADER_PAGES, payload: false });
      }
    );
    return unsubscribe;
  }, [collectionName, dispatch]);

  const getDataEvaluacion = useCallback(
    (idEvaluacion: string) => {
      if (!idEvaluacion) return () => {};
      const docRef = doc(db, collectionName, idEvaluacion);
      const unsubDoc = onSnapshot(
        docRef,
        (docSnap) => {
          if (docSnap.exists()) {
            dispatch({
              type: AppAction.DATA_EVALUACION_DOCENTE,
              payload: { ...docSnap.data(), id: docSnap.id } as DataEvaluacion,
            });
          }
        },
        (err) => console.error(`Error al obtener detalle de evaluación ${idEvaluacion}:`, err)
      );

      return () => {
        unsubDoc();
      };
    },
    [collectionName, dispatch]
  );

  const updateEvaluacion = async (idEvaluacion: string, data: Partial<CrearEvaluacionDocente>) => {
    dispatch({ type: AppAction.LOADER_MODALES, payload: true });
    try {
      const docRef = doc(db, collectionName, idEvaluacion);
      await updateDoc(docRef, data);
    } catch (err: any) {
      console.error(`Error al actualizar evaluación ${idEvaluacion}:`, err);
      throw err;
    } finally {
      dispatch({ type: AppAction.LOADER_MODALES, payload: false });
    }
  };

  const deleteEvaluacion = async (idEvaluacion: string) => {
    try {
      await deleteDoc(doc(db, collectionName, idEvaluacion));
    } catch (err: any) {
      console.error(`Error al eliminar evaluación ${idEvaluacion}:`, err);
      throw err;
    }
  };

  const updateEstadoEvaluacion = async (idEvaluacion: string, status: boolean) => {
    dispatch({ type: AppAction.LOADER_MODALES, payload: true });
    try {
      const docRef = doc(db, collectionName, idEvaluacion);
      await updateDoc(docRef, { active: status });
    } catch (err: any) {
      console.error(`Error al actualizar estado de la evaluación ${idEvaluacion}:`, err);
      throw err;
    } finally {
      dispatch({ type: AppAction.LOADER_MODALES, payload: false });
    }
  };

  // ----------------------------------------------------
  // 2. CONFIGURACIONES GENERALES DE LA EVALUACIÓN
  // ----------------------------------------------------

  const updateEscalaEvaluacion = async (idEvaluacion: string, escala: AlternativasDocente[]) => {
    dispatch({ type: AppAction.LOADER_MODALES, payload: true });
    try {
      const docRef = doc(db, collectionName, idEvaluacion);
      await updateDoc(docRef, { escala });
    } catch (err) {
      console.error('Error al actualizar escala:', err);
      throw err;
    } finally {
      dispatch({ type: AppAction.LOADER_MODALES, payload: false });
    }
  };

  const updateNivelesEvaluacion = async (idEvaluacion: string, niveles: NivelYPuntaje[]) => {
    dispatch({ type: AppAction.LOADER_MODALES, payload: true });
    try {
      const docRef = doc(db, collectionName, idEvaluacion);
      await updateDoc(docRef, { niveles });
    } catch (err) {
      console.error('Error al actualizar niveles globales:', err);
      throw err;
    } finally {
      dispatch({ type: AppAction.LOADER_MODALES, payload: false });
    }
  };

  const updateFaseEvaluacion = async (idEvaluacion: string, nombreFase: string) => {
    dispatch({ type: AppAction.LOADER_MODALES, payload: true });
    try {
      const idFase = `${nombreFase.toUpperCase().replace(/\s+/g, '_')}_${Date.now()}`;
      const nuevaFase = { id: idFase, nombre: nombreFase };
      const docRef = doc(db, collectionName, idEvaluacion);
      await updateDoc(docRef, {
        faseActualID: idFase,
        faseNombre: nombreFase,
        fases: arrayUnion(nuevaFase),
      });
    } catch (err) {
      console.error('Error al crear fase:', err);
      throw err;
    } finally {
      dispatch({ type: AppAction.LOADER_MODALES, payload: false });
    }
  };

  const updateNombreFaseEvaluacion = async (
    idEvaluacion: string,
    idFase: string,
    nuevoNombre: string
  ) => {
    dispatch({ type: AppAction.LOADER_MODALES, payload: true });
    try {
      const docRef = doc(db, collectionName, idEvaluacion);
      const snap = await getDoc(docRef);
      if (snap.exists()) {
        const data = snap.data();
        const fases = (data.fases || []).map((f: any) =>
          f.id === idFase ? { ...f, nombre: nuevoNombre } : f
        );
        const updates: any = { fases };
        if (data.faseActualID === idFase) {
          updates.faseNombre = nuevoNombre;
        }
        await updateDoc(docRef, updates);
      }
    } catch (err) {
      console.error('Error al actualizar nombre de fase:', err);
      throw err;
    } finally {
      dispatch({ type: AppAction.LOADER_MODALES, payload: false });
    }
  };

  const deleteFaseEvaluacion = async (idEvaluacion: string, idFase: string) => {
    dispatch({ type: AppAction.LOADER_MODALES, payload: true });
    try {
      const docRef = doc(db, collectionName, idEvaluacion);
      const snap = await getDoc(docRef);
      if (snap.exists()) {
        const data = snap.data();
        const fases = (data.fases || []).filter((f: any) => f.id !== idFase);
        const updates: any = { fases };
        if (data.faseActualID === idFase) {
          updates.faseActualID = null;
          updates.faseNombre = null;
        }
        await updateDoc(docRef, updates);
      }
    } catch (err) {
      console.error('Error al eliminar fase:', err);
      throw err;
    } finally {
      dispatch({ type: AppAction.LOADER_MODALES, payload: false });
    }
  };

  const updateDescripcionEvaluacion = async (idEvaluacion: string, descripcion: string) => {
    dispatch({ type: AppAction.LOADER_MODALES, payload: true });
    try {
      const docRef = doc(db, collectionName, idEvaluacion);
      await updateDoc(docRef, { descripcion });
    } catch (err) {
      console.error('Error al actualizar descripción:', err);
      throw err;
    } finally {
      dispatch({ type: AppAction.LOADER_MODALES, payload: false });
    }
  };

  const updateTituloYDescripcionEvaluacion = async (
    idEvaluacion: string,
    name: string,
    descripcion: string
  ) => {
    dispatch({ type: AppAction.LOADER_MODALES, payload: true });
    try {
      const docRef = doc(db, collectionName, idEvaluacion);
      await updateDoc(docRef, {
        name: name.trim(),
        descripcion: descripcion.trim(),
        updatedAt: new Date().toISOString(),
      });
    } catch (err) {
      console.error('Error al actualizar título y descripción:', err);
      throw err;
    } finally {
      dispatch({ type: AppAction.LOADER_MODALES, payload: false });
    }
  };

  const updateActivacionEvidencias = async (idEvaluacion: string, status: boolean) => {
    dispatch({ type: AppAction.LOADER_MODALES, payload: true });
    try {
      const docRef = doc(db, collectionName, idEvaluacion);
      await updateDoc(docRef, { activarEvidencias: status });
    } catch (err) {
      console.error('Error al actualizar activación de evidencias:', err);
      throw err;
    } finally {
      dispatch({ type: AppAction.LOADER_MODALES, payload: false });
    }
  };

  const updateConfiguracionCamposRetro = async (
    idEvaluacion: string,
    campos: NonNullable<DataEvaluacion['camposRetroalimentacion']>,
    silent?: boolean
  ) => {
    if (!silent) dispatch({ type: AppAction.LOADER_SALVAR_PREGUNTA, payload: true });
    try {
      const docRef = doc(db, collectionName, idEvaluacion);
      await updateDoc(docRef, { camposRetroalimentacion: campos });
    } catch (err) {
      console.error('Error al actualizar configuración de retroalimentación:', err);
      throw err;
    } finally {
      if (!silent) dispatch({ type: AppAction.LOADER_SALVAR_PREGUNTA, payload: false });
    }
  };

  // ----------------------------------------------------
  // 3. DIMENSIONES / DOMINIOS (SUBCOLECCIÓN: dominios)
  // ----------------------------------------------------

  const getDimensiones = useCallback(
    (idEvaluacion: string) => {
      if (!idEvaluacion) return () => {};
      dispatch({ type: AppAction.LOADER_PAGES, payload: true });
      const path = `/${collectionName}/${idEvaluacion}/dominios`;
      const q = query(collection(db, path), orderBy('order', 'asc'));

      return onSnapshot(
        q,
        (snapshot) => {
          const dims: DimensionEspecialista[] = [];
          snapshot.forEach((docSnap) => {
            dims.push({ ...docSnap.data(), id: docSnap.id });
          });
          dispatch({ type: AppAction.DIMENSIONES_ESPECIALISTAS, payload: dims });
          dispatch({ type: AppAction.LOADER_PAGES, payload: false });
        },
        (err) => {
          console.error('Error al obtener dominios/dimensiones:', err);
          dispatch({ type: AppAction.LOADER_PAGES, payload: false });
        }
      );
    },
    [collectionName, dispatch]
  );

  const createDimension = async (idEvaluacion: string, nombre: string) => {
    dispatch({ type: AppAction.LOADER_MODALES, payload: true });
    try {
      const path = `/${collectionName}/${idEvaluacion}/dominios`;
      const snapshot = await getDocs(collection(db, path));
      const order = snapshot.size + 1;
      await addDoc(collection(db, path), {
        nombre,
        order,
      });
    } catch (err) {
      console.error('Error al crear dimensión:', err);
      throw err;
    } finally {
      dispatch({ type: AppAction.LOADER_MODALES, payload: false });
    }
  };

  const updateDimension = async (idEvaluacion: string, idDimension: string, nombre: string) => {
    dispatch({ type: AppAction.LOADER_MODALES, payload: true });
    try {
      const docRef = doc(db, `/${collectionName}/${idEvaluacion}/dominios`, idDimension);
      await updateDoc(docRef, { nombre });
    } catch (err) {
      console.error('Error al actualizar dimensión:', err);
      throw err;
    } finally {
      dispatch({ type: AppAction.LOADER_MODALES, payload: false });
    }
  };

  const deleteDimension = async (idEvaluacion: string, idDimension: string) => {
    try {
      const docRef = doc(db, `/${collectionName}/${idEvaluacion}/dominios`, idDimension);
      await deleteDoc(docRef);
    } catch (err) {
      console.error('Error al eliminar dimensión:', err);
      throw err;
    }
  };

  const updateDimensionColor = async (idEvaluacion: string, idDimension: string, color: string) => {
    try {
      const docRef = doc(db, `/${collectionName}/${idEvaluacion}/dominios`, idDimension);
      await updateDoc(docRef, { color });
    } catch (err) {
      console.error('Error al actualizar color de dimensión:', err);
      throw err;
    }
  };

  const updateDimensionNiveles = async (
    idEvaluacion: string,
    idDimension: string,
    niveles: NivelYPuntaje[]
  ) => {
    dispatch({ type: AppAction.LOADER_MODALES, payload: true });
    try {
      const docRef = doc(db, `/${collectionName}/${idEvaluacion}/dominios`, idDimension);
      await updateDoc(docRef, { niveles });
    } catch (err) {
      console.error('Error al actualizar niveles por dimensión:', err);
      throw err;
    } finally {
      dispatch({ type: AppAction.LOADER_MODALES, payload: false });
    }
  };

  const updateAllDimensionesNiveles = async (
    idEvaluacion: string,
    dimensionesNiveles: { idDimension: string; niveles: NivelYPuntaje[] }[]
  ) => {
    dispatch({ type: AppAction.LOADER_MODALES, payload: true });
    try {
      await Promise.all(
        dimensionesNiveles.map(({ idDimension, niveles }) => {
          const docRef = doc(db, `/${collectionName}/${idEvaluacion}/dominios`, idDimension);
          return updateDoc(docRef, { niveles });
        })
      );
    } catch (err) {
      console.error('Error al actualizar múltiples niveles por dimensión:', err);
      throw err;
    } finally {
      dispatch({ type: AppAction.LOADER_MODALES, payload: false });
    }
  };

  // ----------------------------------------------------
  // 4. CRITERIOS / PREGUNTAS (SUBCOLECCIÓN: preguntasRespuestas)
  // ----------------------------------------------------

  const getPreguntasRespuestas = useCallback(
    (idEvaluacion: string) => {
      if (!idEvaluacion) return () => {};
      dispatch({ type: AppAction.LOADER_PAGES, payload: true });
      const path = `/${collectionName}/${idEvaluacion}/preguntasRespuestas`;
      const q = query(collection(db, path), orderBy('order', 'asc'));

      return onSnapshot(
        q,
        (snapshot) => {
          const list: PRDocentes[] = [];
          snapshot.forEach((docSnap) => {
            list.push({ ...docSnap.data(), id: docSnap.id });
          });
          dispatch({ type: AppAction.GET_PREGUNTA_RESPUESTA_DOCENTE, payload: list });
          dispatch({ type: AppAction.LOADER_PAGES, payload: false });
        },
        (err) => {
          console.error('Error al obtener preguntas/respuestas:', err);
          dispatch({ type: AppAction.LOADER_PAGES, payload: false });
        }
      );
    },
    [collectionName, dispatch]
  );

  const addPreguntaRespuesta = async (
    data: PreviewPRDocentes & { dimensionId?: string; requiereEvidencia?: boolean; descripcionEvidencia?: string },
    idEvaluacion: string,
    escalaCustom?: AlternativasDocente[]
  ) => {
    dispatch({ type: AppAction.LOADER_MODALES, payload: true });
    try {
      const path = `/${collectionName}/${idEvaluacion}/preguntasRespuestas`;
      const snapshot = await getDocs(collection(db, path));
      const nextOrder = snapshot.size + 1;

      const arrayAlternativas: AlternativasDocente[] = escalaCustom || [
        { value: 0, descripcion: 'No evidencia', alternativa: '0' },
        { value: 1, descripcion: 'En proceso', alternativa: '1' },
        { value: 2, descripcion: 'Logrado', alternativa: '2' },
      ];

      await setDoc(doc(db, path, `${nextOrder}`), {
        alternativas: arrayAlternativas,
        id: `${nextOrder}`,
        criterio: data.criterio,
        order: nextOrder,
        dimensionId: data.dimensionId || '',
        requiereEvidencia: data.requiereEvidencia || false,
        descripcionEvidencia: data.descripcionEvidencia || '',
      });
    } catch (err) {
      console.error('Error al agregar pregunta/criterio:', err);
      throw err;
    } finally {
      dispatch({ type: AppAction.LOADER_MODALES, payload: false });
    }
  };

  const updatePreguntaRespuesta = async (data: PRDocentes, idEvaluacion: string) => {
    dispatch({ type: AppAction.LOADER_SALVAR_PREGUNTA, payload: true });
    try {
      const path = `/${collectionName}/${idEvaluacion}/preguntasRespuestas`;
      const docRef = doc(db, path, `${data.id}`);
      await updateDoc(docRef, {
        criterio: data.criterio,
        dimensionId: data.dimensionId || '',
        requiereEvidencia: data.requiereEvidencia || false,
        descripcionEvidencia: data.descripcionEvidencia || '',
      });
    } catch (err) {
      console.error('Error al actualizar criterio:', err);
      throw err;
    } finally {
      dispatch({ type: AppAction.LOADER_SALVAR_PREGUNTA, payload: false });
    }
  };

  const deletePreguntaRespuesta = async (idEvaluacion: string, idPregunta: string) => {
    try {
      const docRef = doc(db, `/${collectionName}/${idEvaluacion}/preguntasRespuestas`, idPregunta);
      await deleteDoc(docRef);
    } catch (err) {
      console.error('Error al eliminar criterio:', err);
      throw err;
    }
  };

  // ----------------------------------------------------
  // 5. EVALUADOS Y SESIONES (SUBCOLECCIÓN: evaluados)
  // ----------------------------------------------------

  const getEvaluados = useCallback(
    (idEvaluacion: string) => {
      if (!idEvaluacion) return () => {};
      const path = `/${collectionName}/${idEvaluacion}/evaluados`;
      return onSnapshot(
        collection(db, path),
        (snapshot) => {
          const list: User[] = [];
          snapshot.forEach((docSnap) => {
            list.push({ ...docSnap.data(), id: docSnap.id });
          });
          dispatch({ type: AppAction.EVALUADOS_ESPECIALISTA, payload: list });
        },
        (err) => {
          console.error('Error al obtener lista de evaluados:', err);
        }
      );
    },
    [collectionName, dispatch]
  );

  const deleteEvaluadoSession = async (idEvaluacion: string, sessionId: string) => {
    try {
      const docRef = doc(db, `/${collectionName}/${idEvaluacion}/evaluados`, sessionId);
      await deleteDoc(docRef);
    } catch (err) {
      console.error('Error al eliminar sesión de evaluación:', err);
      throw err;
    }
  };

  const calcularCalificacion = (data: PRDocentes[], escala?: AlternativasDocente[]): number => {
    let total = 0;
    data.forEach((pregunta) => {
      const selectedAlt = pregunta.alternativas?.find((a) => a.selected === true);
      if (selectedAlt) {
        let val = selectedAlt.value;
        if (escala && Array.isArray(escala) && escala.length > 0) {
          const matched = escala.find(
            (s) =>
              String(s.alternativa || '') === String(selectedAlt.alternativa || '') ||
              (s.descripcion &&
                selectedAlt.descripcion &&
                s.descripcion.trim().toLowerCase() === selectedAlt.descripcion.trim().toLowerCase())
          );
          if (matched && typeof matched.value === 'number') {
            val = matched.value;
          }
        }
        if (typeof val === 'number') {
          total += val;
        }
      }
    });
    return total;
  };

  const guardarEvaluacion = async (
    idEvaluacion: string,
    data: PRDocentes[],
    evaluado: User,
    retroalimentacionDinamica?: RetroalimentacionDinamica[],
    fechaMonitoreo?: string,
    horaInicio?: string,
    horaFinal?: string,
    datosMonitor?: any,
    tituloReporte?: string,
    silent?: boolean,
    sessionId?: string,
    selectedFaseOverride?: { idFase?: string; faseNombre?: string }
  ): Promise<string> => {
    if (!silent) dispatch({ type: AppAction.LOADER_SALVAR_PREGUNTA, payload: true });
    try {
      const calificacion = calcularCalificacion(data, dataEvaluacionDocente?.escala);
      const docPath = sessionId
        ? doc(db, `/${collectionName}/${idEvaluacion}/evaluados`, sessionId)
        : doc(collection(db, `/${collectionName}/${idEvaluacion}/evaluados`));

      const finalSessionId = docPath.id;

      const nombreMes = getMonthName(currentMonth).toUpperCase();
      const idFaseAuto = `${nombreMes}_${currentYear}`;

      let idFase = selectedFaseOverride?.idFase || dataEvaluacionDocente?.faseActualID || idFaseAuto;
      let faseNombre = selectedFaseOverride?.faseNombre || dataEvaluacionDocente?.faseNombre || '';
      let numeroEvaluacion = 1;

      if (sessionId) {
        const docSnap = await getDoc(docPath);
        if (docSnap.exists()) {
          const prev = docSnap.data();
          idFase = selectedFaseOverride?.idFase || prev.idFase || idFase;
          faseNombre = selectedFaseOverride?.faseNombre || prev.faseNombre || faseNombre;
          numeroEvaluacion = prev.numeroEvaluacion || 1;
        }
        const targetDniField =
          role === 'director' ? 'docenteDni' : role === 'especialista' ? 'directorDni' : 'especialistaDni';
        const evaluadosRef = collection(db, `/${collectionName}/${idEvaluacion}/evaluados`);
        const qCount = query(
          evaluadosRef,
          where(targetDniField, '==', evaluado.dni || '')
        );
        const querySnapshot = await getDocs(qCount);
        numeroEvaluacion = querySnapshot.size + 1;
      }

      const dataToSave: any = {
        ...evaluado,
        id: finalSessionId,
        idFase,
        faseNombre,
        numeroEvaluacion,
        resultadosSeguimientoRetroalimentacion: data,
        calificacion,
        retroalimentacionDinamica: retroalimentacionDinamica || [],
        fechaMonitoreo: fechaMonitoreo || '',
        horaInicio: horaInicio || '',
        horaFinal: horaFinal || '',
        datosMonitor: datosMonitor || {},
        tituloReporte: tituloReporte || '',
        fechaCreacion: serverTimestamp(),
      };

      // Identificadores de rol según contexto
      if (role === 'director') {
        dataToSave.docenteDni = evaluado.dni || '';
        dataToSave.evaluadoDni = evaluado.dni || '';
        dataToSave.dniDirector = currentUserData?.dni || '';
      } else if (role === 'especialista') {
        dataToSave.directorDni = evaluado.dni || '';
        dataToSave.evaluadoDni = evaluado.dni || '';
        dataToSave.especialistaDni = currentUserData?.dni || '';
      } else {
        dataToSave.especialistaDni = evaluado.dni || '';
        dataToSave.evaluadoDni = evaluado.dni || '';
      }

      await setDoc(docPath, JSON.parse(JSON.stringify(dataToSave)), { merge: true });

      // Actualizar datos de contacto en usuarios si fueron modificados
      if (evaluado.dni && (evaluado.email || evaluado.celular)) {
        try {
          const userRef = doc(db, 'usuarios', String(evaluado.dni));
          await setDoc(
            userRef,
            {
              ...(evaluado.email ? { email: evaluado.email } : {}),
              ...(evaluado.celular ? { celular: evaluado.celular } : {}),
            },
            { merge: true }
          );
        } catch (uErr) {
          console.warn('No se pudo actualizar email/celular en usuarios:', uErr);
        }
      }

      return finalSessionId;
    } catch (err) {
      console.error('Error al guardar evaluación:', err);
      throw err;
    } finally {
      if (!silent) dispatch({ type: AppAction.LOADER_SALVAR_PREGUNTA, payload: false });
    }
  };

  const getParrillaEvaluados = useCallback(
    async (
      customScopeKey?: string,
      customScopeValue?: any
    ): Promise<User[]> => {
      try {
        const usuariosRef = collection(db, 'usuarios');
        let q;

        if (role === 'director') {
          // Director evalúa a sus docentes: rol === 3, dniDirector === dni del director
          const directorDni = customScopeValue || scopeValue || currentUserData?.dni;
          q = query(usuariosRef, where('rol', '==', 3), where('dniDirector', '==', String(directorDni)));
        } else if (role === 'admin') {
          // Administrador o DREP evalúa a especialistas: rol === 1
          const isRegionalAdmin =
            currentUserData?.rol === 4 ||
            currentUserData?.rol === 0 ||
            currentUserData?.rol === 5 ||
            currentUserData?.perfil?.rol === 4 ||
            currentUserData?.perfil?.rol === 0 ||
            currentUserData?.perfil?.rol === 5 ||
            Number(currentUserData?.rol) === 4 ||
            Number(currentUserData?.rol) === 0 ||
            Number(currentUserData?.rol) === 5;

          let targetRegion: any =
            customScopeValue !== undefined
              ? customScopeValue
              : !isRegionalAdmin
              ? scopeValue || currentUserData?.region
              : undefined;

          if (targetRegion && targetRegion !== 'all' && targetRegion !== '') {
            const regionNum = Number(targetRegion);
            q = query(
              usuariosRef,
              where('rol', '==', 1),
              where('region', '==', isNaN(regionNum) ? targetRegion : regionNum)
            );
          } else {
            q = query(usuariosRef, where('rol', '==', 1));
          }
        } else {
          // Especialista evalúa directores: rol === 2, filtrado por region
          const isDrep =
            currentUserData?.rol === 4 ||
            currentUserData?.rol === 0 ||
            currentUserData?.rol === 5 ||
            currentUserData?.perfil?.rol === 4 ||
            currentUserData?.perfil?.rol === 0 ||
            currentUserData?.perfil?.rol === 5 ||
            Number(currentUserData?.rol) === 4 ||
            Number(currentUserData?.rol) === 0 ||
            Number(currentUserData?.rol) === 5;

          let targetRegion: any =
            customScopeValue !== undefined
              ? customScopeValue
              : !isDrep
              ? scopeValue || currentUserData?.region
              : undefined;

          if (targetRegion && targetRegion !== 'all' && targetRegion !== '') {
            const regionNum = Number(targetRegion);
            q = query(
              usuariosRef,
              where('rol', '==', 2),
              where('region', '==', isNaN(regionNum) ? targetRegion : regionNum)
            );
          } else {
            q = query(usuariosRef, where('rol', '==', 2));
          }
        }

        const snap = await getDocs(q);
        const users: User[] = [];
        if (snap?.docs) {
          snap.docs.forEach((d) => users.push({ ...d.data(), id: d.id } as User));
        } else if (typeof snap?.forEach === 'function') {
          snap.forEach((d) => users.push({ ...d.data(), id: d.id } as User));
        }
        return users;
      } catch (err) {
        console.error('Error al obtener padrón de evaluados:', err);
        return [];
      }
    },
    [role, scopeValue, currentUserData?.dni, currentUserData?.rol, currentUserData?.region]
  );

  const buscarUsuario = useCallback(async (dni: string): Promise<User | null> => {
    if (!dni || dni.length < 8) return null;
    const cleanDni = dni.trim();
    try {
      const q = query(collection(db, 'usuarios'), where('dni', '==', cleanDni));
      const snap = await getDocs(q);
      if (!snap.empty) {
        return { ...snap.docs[0].data(), id: snap.docs[0].id } as User;
      }
      const directDoc = await getDoc(doc(db, 'usuarios', cleanDni));
      if (directDoc.exists()) {
        return { ...directDoc.data(), id: directDoc.id } as User;
      }
      return null;
    } catch (err) {
      console.error('Error al buscar usuario por DNI:', err);
      return null;
    }
  }, []);

  const getHistorialEvaluado = useCallback(
    async (idEvaluacion: string, dni: string): Promise<User[]> => {
      if (!idEvaluacion || !dni) return [];
      const cleanDni = String(dni).trim();
      const path = `/${collectionName}/${idEvaluacion}/evaluados`;
      try {
        const snap = await getDocs(collection(db, path));
        const list: User[] = [];
        snap.forEach((docSnap) => {
          const data = { ...(docSnap.data() as User), id: docSnap.id };
          const itemDni = String(
            (data as any).docenteDni ||
            (data as any).directorDni ||
            (data as any).especialistaDni ||
            (data as any).evaluadoDni ||
            data.dni ||
            ''
          ).trim();
          if (itemDni === cleanDni) {
            list.push(data);
          }
        });
        return list.sort(
          (a, b) => ((b as any).numeroEvaluacion || 0) - ((a as any).numeroEvaluacion || 0)
        );
      } catch (err) {
        console.error(`Error al obtener historial en ${collectionName}:`, err);
        return [];
      }
    },
    [collectionName]
  );

  const getSessionData = useCallback(
    (idEvaluacion: string, sessionId: string, onUpdate?: (data: User) => void) => {
      if (!idEvaluacion || !sessionId) return () => {};
      const docPath = doc(db, `/${collectionName}/${idEvaluacion}/evaluados`, sessionId);
      return onSnapshot(
        docPath,
        (docSnap) => {
          if (docSnap.exists() && docSnap.data() && onUpdate) {
            onUpdate({ ...(docSnap.data() as User), id: docSnap.id });
          }
        },
        (err) => console.error(`Error al obtener sesión ${sessionId}:`, err)
      );
    },
    [collectionName]
  );

  // ----------------------------------------------------
  // 7. EVIDENCIAS (FIREBASE STORAGE)
  // ----------------------------------------------------

  const uploadEvidencia = async (
    file: File,
    evaluacionId: string,
    folderId: string,
    preguntaId: string
  ): Promise<Evidencia> => {
    try {
      const storageFolder =
        collectionName === 'evaluaciones-docentes' ? 'evidencias_docentes' : 'evidencias_especialistas';
      const storageRef = ref(
        storage,
        `${storageFolder}/${evaluacionId}/${folderId}/${preguntaId}_${file.name}`
      );
      await uploadBytes(storageRef, file);
      const url = await getDownloadURL(storageRef);
      const nuevaEvidencia: Evidencia = {
        nombre: file.name,
        url: url,
        tipo: file.type,
        fechaSubida: new Date().toISOString(),
      };
      return nuevaEvidencia;
    } catch (err) {
      console.error('Error al subir evidencia:', err);
      throw err;
    }
  };

  const deleteEvidencia = async (urlOrPath: string): Promise<void> => {
    try {
      let storagePath = urlOrPath;
      if (urlOrPath.includes('/o/')) {
        const decodedUrl = decodeURIComponent(urlOrPath);
        storagePath = decodedUrl.split('/o/')[1].split('?')[0];
      }
      const storageRef = ref(storage, storagePath);
      await deleteObject(storageRef);
    } catch (err) {
      console.error('Error al eliminar evidencia de storage:', err);
      throw err;
    }
  };

  return {
    collectionName,
    role,
    loading,
    error,
    // Evaluaciones
    createEvaluacion,
    getEvaluaciones,
    getDataEvaluacion,
    updateEvaluacion,
    deleteEvaluacion,
    updateEstadoEvaluacion,
    // Configuraciones
    updateEscalaEvaluacion,
    updateNivelesEvaluacion,
    updateFaseEvaluacion,
    updateNombreFaseEvaluacion,
    deleteFaseEvaluacion,
    updateDescripcionEvaluacion,
    updateTituloYDescripcionEvaluacion,
    updateActivacionEvidencias,
    updateConfiguracionCamposRetro,
    // Dimensiones
    getDimensiones,
    createDimension,
    updateDimension,
    deleteDimension,
    updateDimensionColor,
    updateDimensionNiveles,
    updateAllDimensionesNiveles,
    // Criterios / Preguntas
    getPreguntasRespuestas,
    addPreguntaRespuesta,
    updatePreguntaRespuesta,
    deletePreguntaRespuesta,
    // Evaluados
    getEvaluados,
    guardarEvaluacion,
    deleteEvaluadoSession,
    calcularCalificacion,
    getHistorialEvaluado,
    getSessionData,
    // Padrón & Búsqueda
    getParrillaEvaluados,
    buscarUsuario,
    // Evidencias
    uploadEvidencia,
    deleteEvidencia,
  };
};

export default useEvaluacionDesempenoBase;
