import { Estudiante, LoginData, Region, User } from '../types/types';
import {
  browserSessionPersistence,
  getAuth,
  onAuthStateChanged,
  setPersistence,
  signInWithEmailAndPassword,
  signOut,
} from 'firebase/auth';
import { useGlobalContext, useGlobalContextDispatch } from '../context/GlolbalContext';
// import { getFirestore, doc, getDoc } from "firebase/firestore/lite"
import { AppAction } from '../actions/appAction';

import { app } from '@/firebase/firebase.config';
import axios from 'axios';
import { ToastContainer, toast } from 'react-toastify';
import {
  onSnapshot,
  where,
  query,
  getFirestore,
  doc,
  getDoc,
  setDoc,
  collection,
  getDocs,
  orderBy,
  updateDoc,
  deleteDoc,
  increment,
} from 'firebase/firestore';
import { currentYear } from '@/fuctions/dates';
const useUsuario = () => {
  const URL_API = 'https://api-ugel-production.up.railway.app/';
  /* const URL_API = "http://localhost:3001/" */
  const auth = getAuth(app);
  const db = getFirestore(app);
  const { currentUserData } = useGlobalContext();
  const dispatch = useGlobalContextDispatch();

  const getUsersDirectores = async () => {
    console.log('currentUserData', currentUserData);
    const q = query(
      collection(db, 'usuarios'),
      where('rol', '==', 2),
      where('region', '==', Number(currentUserData.region)),
      orderBy('rol', 'asc')
    );
    onSnapshot(q, (querysanpshot) => {
      const arryaDirectores: User[] = [];
      querysanpshot.forEach((doc) => {
        arryaDirectores.push(doc.data());
      });
      dispatch({
        type: AppAction.USUARIOS_DIRECTORES,
        payload: arryaDirectores,
      });
    });
    /* await getDocs(pathRef).then((res) => {
      const arryaDirectores: User[] = [];
      res.forEach((doc) => {
        arryaDirectores.push(doc.data());
      });
      dispatch({
        type: AppAction.USUARIOS_DIRECTORES,
        payload: arryaDirectores,
      });
    }); */
  };
  const getDirectorById = async (dni: string) => {
    dispatch({ type: AppAction.WARNING_USUARIO_NO_ENCONTRADO, payload: '' });
    const pathRef = doc(db, 'usuarios', `${dni}`);
    await getDoc(pathRef).then((res) => {
      if (res.exists()) {
        dispatch({ type: AppAction.DATA_DIRECTOR, payload: res.data() });
      } else {
        dispatch({
          type: AppAction.WARNING_USUARIO_NO_ENCONTRADO,
          payload: 'no se encontro usuario prueba con otro dni',
        });
      }
    });
  };
  const updateDirector = async (dniDirector: string, data: User) => {
    const pathRef = doc(db, 'usuarios', `${dniDirector}`);
    await updateDoc(pathRef, data).then((res) => {
      getUsersDirectores();
      dispatch({ type: AppAction.DATA_DIRECTOR, payload: {} });
    });
  };

  const getUser = async (id: string) => {
    const refUser = doc(db, 'usuarios', id as string);
    const user = await getDoc(refUser);

    if (user.exists()) {
      dispatch({ type: AppAction.LOADER_LOGIN, payload: false });
      dispatch({
        type: AppAction.CURRENT_USER_DATA,
        payload: {
          nombres: user.data().nombres || '',
          apellidos: user.data().apellidos || '',
          dni: user.data().dni || '',
          institucion: user.data().institucion || '',
          dniDirector: user.data().dniDirector || '',
          modular: user.data().modular || '',
          perfil: user.data().perfil || {},
          region: user.data().region || 0,
          rol: user.data().rol || 0,
          nivelDeInstitucion: user.data().nivelDeInstitucion || [],
          nivel: user.data().nivel || 0,
          nivelesInstitucion: user.data().nivelesInstitucion || [],
          area: user.data().area,
          distrito: user.data().distrito || '',
        },
      });
    } else {
      console.log('usuario incorrecto o la contraseña no es valida.');
      dispatch({ type: AppAction.LOADER_LOGIN, payload: false });
    }
  };

  const getRegiones = async () => {
    const regionRef = collection(db, 'region');
    const queryRegiones = await getDocs(regionRef);
    const arrayRegiones: Region[] = [];
    queryRegiones.forEach((doc) => {
      arrayRegiones.push(doc.data());
    });

    dispatch({ type: AppAction.REGIONES, payload: arrayRegiones });
  };
  const signIn = async (loginData: LoginData) => {
    dispatch({ type: AppAction.LOADER_LOGIN, payload: true });
    dispatch({ type: AppAction.WARNING_LOGIN, payload: '' });
    console.log('loginDatad', loginData);
    try {
      // return await signInWithEmailAndPassword(auth, loginData.usuario, loginData.contrasena)
      await setPersistence(auth, browserSessionPersistence)
        .then(async () => {
          return await signInWithEmailAndPassword(auth, loginData.usuario, loginData.contrasena);
        })
        .then(async (response) => {
          console.log('response', response);

          // Refrescar el token para obtener custom claims actualizados
          try {
            await response.user.getIdToken(true); // Force refresh
            console.log('Token refrescado con custom claims');
          } catch (error) {
            console.warn('Error al refrescar token:', error);
          }

          getUser(response.user.uid);
        });
      // .catch(Error) {
      //   console.log('error', Error)
      // }
    } catch (error) {
      dispatch({ type: AppAction.LOADER_LOGIN, payload: false });
      if (error) {
        console.log('error');
        dispatch({
          type: AppAction.WARNING_LOGIN,
          payload: 'el usuario o contraseña son invalidos',
        });
      }
    }
  };
  const logout = () => {
    signOut(auth);
    // AsyncStorage.setItem(TOKEN_KEY, JSON.stringify({}))
    // dispatch({ type: AttendanceRegister.USER_TOKEN, payload: { token: "", isAuthenticated: false } })
    dispatch({
      type: AppAction.CURRENT_USER_DATA,
      payload: {},
    });
  };

  const getUserData = () => {
    onAuthStateChanged(auth, (currentUser) => {
      if (currentUser) {
        getUser(currentUser.uid);
      }
    });
  };

  // Función para verificar los custom claims del usuario actual
  const checkCustomClaims = async () => {
    try {
      const currentUser = auth.currentUser;
      if (!currentUser) {
        console.log('No hay usuario autenticado');
        return null;
      }

      const token = await currentUser.getIdTokenResult(true);
      console.log('Custom claims del usuario:', token.claims);

      return token.claims;
    } catch (error) {
      console.error('Error al obtener custom claims:', error);
      return null;
    }
  };

  const createNewEspecialista = async (data: User) => {
    console.log('data', data)
    dispatch({ type: AppAction.LOADER_PAGES, payload: true });
    try {
      const { functions } = await import('@/firebase/firebase.config');
      const { httpsCallable } = await import('firebase/functions');
      const crearUsuarioFn = httpsCallable(functions, 'crearUsuario');

      const result = await crearUsuarioFn({
        email: `${data.dni}@competencelab.com`,
        password: `${data.dni}`,
        dni: `${data.dni}`,
        rol: data.perfil?.rol || 4, // Rol de especialista
        data: {
          ...data,
          dniEspecialistaRegional: currentUserData.rol === 5 ? currentUserData.dni : undefined,
        }
      });

      const resData = result.data as any;
      if (resData.exists === true) {
        // Podrías manejar el warning aquí si fuera necesario
      }

      dispatch({ type: AppAction.LOADER_PAGES, payload: false });
    } catch (error) {
      console.log('error', error);
      dispatch({ type: AppAction.LOADER_PAGES, payload: false });
    }
  };

  const createNewDirector = async (data: User): Promise<{ success: boolean; exists?: boolean; message?: string }> => {
    console.log('data', data);
    dispatch({ type: AppAction.LOADER_PAGES, payload: true });
    try {
      const { functions } = await import('@/firebase/firebase.config');
      const { httpsCallable } = await import('firebase/functions');
      const crearUsuarioFn = httpsCallable(functions, 'crearUsuario');

      const result = await crearUsuarioFn({
        email: `${data.dni}@competencelab.com`,
        password: `${data.dni}`,
        dni: `${data.dni}`,
        rol: data.perfil?.rol || 2, // Rol de director
        data: {
          ...data,
          // Campos específicos si fueran necesarios
        }
      });

      const resData = result.data as any;

      if (resData.exists === true) {
        dispatch({
          type: AppAction.WARNING_USUARIO_EXISTE,
          payload: `${data.dni} ${resData.warning || 'ya existe'}`,
        });
        dispatch({ type: AppAction.LOADER_PAGES, payload: false });
        return { success: false, exists: true, message: resData.warning };
      } else {
        dispatch({ type: AppAction.WARNING_USUARIO_EXISTE, payload: '' });
        dispatch({ type: AppAction.LOADER_PAGES, payload: false });
        return { success: true };
      }
    } catch (error: any) {
      console.log('error', error);
      dispatch({ type: AppAction.LOADER_PAGES, payload: false });
      return { success: false, message: error.message || 'Error desconocido' };
    }
  };

  const createMassiveDirectors = async (directores: any[]): Promise<{ success: boolean; message?: string; detalles?: any }> => {
    dispatch({ type: AppAction.LOADER_PAGES, payload: true });
    try {
      const { functions } = await import('@/firebase/firebase.config');
      const { httpsCallable } = await import('firebase/functions');
      const crearDirectoresMasivoFn = httpsCallable(functions, 'crearDirectoresMasivo');

      const result = await crearDirectoresMasivoFn({ directores });
      const resData = result.data as any;

      dispatch({ type: AppAction.LOADER_PAGES, payload: false });
      return { success: resData.success, message: resData.message, detalles: resData.detalles };

    } catch (error: any) {
      console.error('Error createMassiveDirectors', error);
      dispatch({ type: AppAction.LOADER_PAGES, payload: false });
      return { success: false, message: error.message || 'Error desconocido' };
    }
  };

  const crearNuevoDocente = async (data: User) => {
    dispatch({ type: AppAction.LOADER_PAGES, payload: true });
    console.log('data', data);
    try {
      const { functions } = await import('@/firebase/firebase.config');
      const { httpsCallable } = await import('firebase/functions');
      const crearUsuarioFn = httpsCallable(functions, 'crearUsuario');

      const result = await crearUsuarioFn({
        email: `${data.dni}@competencelab.com`,
        password: `${data.dni}`,
        dni: `${data.dni}`,
        rol: 3, // Rol de docente
        data: {
          ...data,
          institucion: currentUserData.institucion,
          dniDirector: currentUserData.dni,
          region: currentUserData.region,
          area: currentUserData.area,
          distrito: currentUserData.distrito,
        }
      });

      const resData = result.data as any;

      if (resData.exists === true) {
        console.log('ya existe el usuario');
        dispatch({
          type: AppAction.WARNING_USUARIO_EXISTE,
          payload: `${data.dni} ${resData.warning || 'ya existe'}`,
        });
      } else {
        console.log('usuario creado exitosamente via Cloud Function');
        dispatch({ type: AppAction.WARNING_USUARIO_EXISTE, payload: '' });
      }
      dispatch({ type: AppAction.LOADER_PAGES, payload: false });
    } catch (error: any) {
      console.log('error', error);
      dispatch({ type: AppAction.LOADER_PAGES, payload: false });
      // Aquí podrías manejar errores de la Cloud Function
    }
  };

  const createMassiveTeachers = async (docentes: any[], dataComun: any) => {
    dispatch({ type: AppAction.LOADER_PAGES, payload: true });
    try {
      const { functions } = await import('@/firebase/firebase.config');
      const { httpsCallable } = await import('firebase/functions');
      const crearDocentesMasivoFn = httpsCallable(functions, 'crearDocentesMasivo');

      const result = await crearDocentesMasivoFn({
        docentes,
        dataComun
      });

      console.log('Carga masiva de docentes completada:', result.data);
      dispatch({ type: AppAction.LOADER_PAGES, payload: false });
      return result.data as any;
    } catch (error: any) {
      console.error('Error en carga masiva de docentes:', error);
      dispatch({ type: AppAction.LOADER_PAGES, payload: false });
      return {
        success: false,
        message: error.message || 'Error en la comunicación con el servidor'
      };
    }
  };
  const deleteUsuarioById = async (idUsuario: string) => {
    console.log('idUsuario', idUsuario);
    return new Promise<boolean>(async (resolve, reject) => {
      try {
        const { functions } = await import('@/firebase/firebase.config');
        const { httpsCallable } = await import('firebase/functions');
        const borrarUsuarioFn = httpsCallable(functions, 'borrarUsuario');

        await borrarUsuarioFn({ dni: idUsuario });
        console.log('Usuario eliminado exitosamente vía Cloud Function');
        resolve(true);
      } catch (error) {
        console.error('Error al eliminar usuario:', error);
        reject(error);
      }
    });
  };

  const updateUsuarioById = async (dni: string, data: Partial<User>) => {
    dispatch({ type: AppAction.LOADER_PAGES, payload: true });
    try {
      const { functions } = await import('@/firebase/firebase.config');
      const { httpsCallable } = await import('firebase/functions');
      const actualizarUsuarioFn = httpsCallable(functions, 'actualizarUsuario');

      await actualizarUsuarioFn({
        dni,
        data: {
          ...data,
          // Asegurar que campos críticos se mantengan o se formateen correctamente si es necesario
        }
      });

      console.log('Usuario actualizado exitosamente vía Cloud Function');
      dispatch({ type: AppAction.LOADER_PAGES, payload: false });
      return true;
    } catch (error) {
      console.error('Error al actualizar usuario:', error);
      dispatch({ type: AppAction.LOADER_PAGES, payload: false });
      return false;
    }
  };

  const deleteEvaluacionEstudiante = async (
    idEvaluacion: string,
    idEstudiante: string,
    monthSelected: number
  ) => {
    console.log('idEvaluacion', idEvaluacion);
    console.log('idEstudiante', idEstudiante);
    console.log('monthSelected', monthSelected);
    const pathRef = doc(
      db,
      `/usuarios/${currentUserData.dni}/${idEvaluacion}/${currentYear}/${monthSelected}`,
      idEstudiante
    );
    await deleteDoc(pathRef);

    const pathRefBorrarEstudianteEvaluacion = doc(
      db,
      `/evaluaciones/${idEvaluacion}/estudiantes-evaluados/${currentYear}/${monthSelected}`,
      idEstudiante
    );
    await deleteDoc(pathRefBorrarEstudianteEvaluacion);
  };
  const deleteEstudianteById = async (id: string, idExamen: string, estudiantes: Estudiante[]) => {
    dispatch({ type: AppAction.LOADER_SALVAR_PREGUNTA, payload: true });
    const rta = estudiantes.find((es) => es.dni === id);
    console.log('primero');
    const newPRomise = new Promise<boolean>((resolve, reject) => {
      try {
        rta?.respuestas?.forEach(async (respuesta) => {
          const pathRef = doc(
            db,
            `/evaluaciones/${idExamen}/${currentUserData.dni}`,
            `${respuesta.order}`
          );
          //obtener los valores de cada pregunta para poder validar y llege a valores negativos si el valor que tiene es 0 y tiene que restar aun mas se que dara con el valor de 0
          const pathValidateRef = doc(
            db,
            `/evaluaciones/${idExamen}/${currentUserData.dni}`,
            `${respuesta.order}`
          );
          const dataValidate = await getDoc(pathValidateRef);

          if (respuesta.alternativas?.length === 3) {
            respuesta.alternativas?.map(async (al) => {
              if (al.selected === true && al.alternativa === 'a') {
                await updateDoc(pathRef, {
                  a: Number(dataValidate.data()?.a) === 0 ? 0 : increment(-1),
                });
              } else if (al.selected === true && al.alternativa === 'b') {
                await updateDoc(pathRef, {
                  b: Number(dataValidate.data()?.b) === 0 ? 0 : increment(-1),
                });
              } else if (al.selected === true && al.alternativa === 'c') {
                await updateDoc(pathRef, {
                  c: Number(dataValidate.data()?.c) === 0 ? 0 : increment(-1),
                });
              }
            });
          }
          //esto es nuevo para mas alternativas
          if (respuesta.alternativas?.length === 4) {
            respuesta.alternativas?.map(async (al) => {
              if (al.selected === true && al.alternativa === 'a') {
                await updateDoc(pathRef, {
                  a: Number(dataValidate.data()?.a) === 0 ? 0 : increment(-1),
                });
              } else if (al.selected === true && al.alternativa === 'b') {
                await updateDoc(pathRef, {
                  b: Number(dataValidate.data()?.b) === 0 ? 0 : increment(-1),
                });
              } else if (al.selected === true && al.alternativa === 'c') {
                await updateDoc(pathRef, {
                  c: Number(dataValidate.data()?.c) === 0 ? 0 : increment(-1),
                });
              } else if (al.selected === true && al.alternativa === 'd') {
                await updateDoc(pathRef, {
                  d: Number(dataValidate.data()?.d) === 0 ? 0 : increment(-1),
                });
              }
            });
          }
        });
        resolve(true);
        console.log('segundo');
      } catch (error) {
        reject(false);
      }
    });
    newPRomise.then((res) => {
      if (res === true) {
        console.log('tercero');
        console.log('rta estudiante', rta);

        setTimeout(async () => {
          const pathRef = doc(db, `/usuarios/${currentUserData.dni}/${idExamen}/`, id);
          await deleteDoc(pathRef);
          dispatch({ type: AppAction.LOADER_SALVAR_PREGUNTA, payload: false });
        }, 5000);
      }
    });
  };

  const getAllEspecialistas = async () => {
    const pathRef = collection(db, 'usuarios');
    const q = query(pathRef, where('rol', '==', 1));
    onSnapshot(q, (querySnapshot) => {
      const arrayEspecialistas: User[] = [];
      querySnapshot.forEach((doc) => {
        arrayEspecialistas.push(doc.data());
      });
      dispatch({ type: AppAction.ALL_ESPECIALISTAS, payload: arrayEspecialistas });
    });
  };

  const updateEspecialista = async (dniEspecialista: string, data: User) => {
    const pathRef = doc(db, 'usuarios', `${dniEspecialista}`);
    await updateDoc(pathRef, data);
    getAllEspecialistas(); // Actualizamos la lista después de modificar
  };

  return {
    getDirectorById,
    signIn,
    getUserData,
    logout,
    createNewDirector,
    crearNuevoDocente,
    getRegiones,
    createNewEspecialista,
    getUsersDirectores,
    updateDirector,
    deleteUsuarioById,
    updateUsuarioById,
    deleteEstudianteById,
    getAllEspecialistas,
    updateEspecialista,
    deleteEvaluacionEstudiante,
    checkCustomClaims,
    createMassiveDirectors,
    createMassiveTeachers,
  };
};

export default useUsuario;
