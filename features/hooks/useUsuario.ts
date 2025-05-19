import { Estudiante, LoginData, Region, User } from "../types/types";
import {
  browserSessionPersistence,
  getAuth,
  onAuthStateChanged,
  setPersistence,
  signInWithEmailAndPassword,
  signOut,
} from "firebase/auth";
import {
  useGlobalContext,
  useGlobalContextDispatch,
} from "../context/GlolbalContext";
// import { getFirestore, doc, getDoc } from "firebase/firestore/lite"
import { AppAction } from "../actions/appAction";

import { app } from "@/firebase/firebase.config";
import axios from "axios";
import { ToastContainer, toast } from "react-toastify";
import {
  onSnapshot, where, query, getFirestore,
  doc,
  getDoc,
  setDoc,
  collection,
  getDocs,
  orderBy,
  updateDoc,
  deleteDoc,
  increment,
} from "firebase/firestore";
import { currentYear } from "@/fuctions/dates";
const useUsuario = () => {
  const URL_API = "https://api-ugel-production.up.railway.app/";
  /* const URL_API = "http://localhost:3001/" */
  const auth = getAuth(app);
  const db = getFirestore(app);
  const { currentUserData } = useGlobalContext();
  const dispatch = useGlobalContextDispatch();

  const getUsersDirectores = async () => {
    console.log('currentUserData', currentUserData)
    const q = query(
      collection(db, "usuarios"),
      where("rol", "==", 2),
      where("region", "==", Number(currentUserData.region)),
      orderBy("rol", "asc")
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
  }
  const getDirectorById = async (dni: string) => {
    dispatch({ type: AppAction.WARNING_USUARIO_NO_ENCONTRADO, payload: "" });
    const pathRef = doc(db, "usuarios", `${dni}`);
    await getDoc(pathRef).then((res) => {
      if (res.exists()) {
        dispatch({ type: AppAction.DATA_DIRECTOR, payload: res.data() });
      } else {
        dispatch({
          type: AppAction.WARNING_USUARIO_NO_ENCONTRADO,
          payload: "no se encontro usuario prueba con otro dni",
        });
      }
    });
  };
  const updateDirector = async (dniDirector: string, data: User) => {
    const pathRef = doc(db, "usuarios", `${dniDirector}`);
    await updateDoc(pathRef, data).then((res) => {
      getUsersDirectores();
      dispatch({ type: AppAction.DATA_DIRECTOR, payload: {} });
    });
  };

  const getUser = async (id: string) => {
    const refUser = doc(db, "usuarios", id as string);
    const user = await getDoc(refUser);

    if (user.exists()) {
      dispatch({ type: AppAction.LOADER_LOGIN, payload: false });
      dispatch({
        type: AppAction.CURRENT_USER_DATA,
        payload: {
          nombres: user.data().nombres,
          apellidos: user.data().apellidos,
          dni: user.data().dni,
          institucion: user.data().institucion,
          dniDirector: user.data().dniDirector,
          modular: user.data().modular || '',
          perfil: user.data().perfil,
          region: user.data().region,
          rol: user.data().rol,
        },
      });
    } else {
      console.log("usuario incorrecto o la contraseña no es valida.");
      dispatch({ type: AppAction.LOADER_LOGIN, payload: false });
    }
  };

  const getRegiones = async () => {
    const regionRef = collection(db, "region");
    const queryRegiones = await getDocs(regionRef);
    const arrayRegiones: Region[] = [];
    queryRegiones.forEach((doc) => {
      arrayRegiones.push(doc.data());
    });

    dispatch({ type: AppAction.REGIONES, payload: arrayRegiones });
  };
  const signIn = async (loginData: LoginData) => {
    dispatch({ type: AppAction.LOADER_LOGIN, payload: true });
    dispatch({ type: AppAction.WARNING_LOGIN, payload: "" });
    console.log("loginDatad", loginData);
    try {
      // return await signInWithEmailAndPassword(auth, loginData.usuario, loginData.contrasena)
      await setPersistence(auth, browserSessionPersistence)
        .then(async () => {
          return await signInWithEmailAndPassword(
            auth,
            loginData.usuario,
            loginData.contrasena
          );
        })
        .then((response) => {
          console.log("response", response);
          // debugger
          getUser(response.user.uid);
        });
      // .catch(Error) {
      //   console.log('error', Error)
      // }
    } catch (error) {
      dispatch({ type: AppAction.LOADER_LOGIN, payload: false });
      if (error) {
        console.log("error");
        dispatch({
          type: AppAction.WARNING_LOGIN,
          payload: "el usuario o contraseña son invalidos",
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
  const createNewEspecialista = (data: User) => {
    dispatch({ type: AppAction.LOADER_PAGES, payload: true });
    try {
      if (currentUserData.rol === 4) {
        axios
          .post(`${URL_API}crear-director`, {
            email: `${data.dni}@competencelab.com`,
            password: `${data.dni}`,
            dni: `${data.dni}`,
          })
          .then(async (res) => {
            console.log("res", res);
            await setDoc(doc(db, "usuarios", `${data.dni}`), {
              dni: `${data.dni}`,
              // institucion: `${data.institucion}`,
              perfil: data.perfil,
              rol: data.perfil?.rol,
              /* modular: data.modular, */
              nombres: data.nombres,
              apellidos: data.apellidos,
              region: Number(data.region),
              tipoEspecialista: data.tipoEspecialista,
              genero: data.genero,
            });
          })
          .then((res) => {
            dispatch({ type: AppAction.LOADER_PAGES, payload: false });
          });
      }
    } catch (error) {
      console.log("error", error);
    }
  };
  const createNewDirector = (data: User) => {
    dispatch({ type: AppAction.LOADER_PAGES, payload: true });
    try {
      if (currentUserData.perfil?.rol === 1) {
        console.log("agregando director");
        try {
          axios
            .post(`${URL_API}crear-director`, {
              email: `${data.dni}@competencelab.com`,
              password: `${data.dni}`,
              dni: `${data.dni}`,
              rol: currentUserData.perfil?.rol,
              institucion: `${data.institucion}`,
              perfil: data.perfil,
              nombres: `${data.nombres}`,
              apellidos: `${data.apellidos}`,
            })
            .then(async (res) => {
              if (res.data.exists === true) {
                console.log("ya existe el usuario");
                dispatch({
                  type: AppAction.WARNING_USUARIO_EXISTE,
                  payload: `${data.dni} ${res.data.warning}`,
                });
                dispatch({ type: AppAction.LOADER_PAGES, payload: false });
              } else {
                console.log("no existe se creara el usuario");
                await setDoc(doc(db, "usuarios", `${data.dni}`), {
                  dni: `${data.dni}`,
                  institucion: `${data.institucion}`,
                  perfil: data.perfil,
                  rol: data.perfil?.rol,
                  nombres: data.nombres,
                  apellidos: data.apellidos,
                  region: Number(data.region),
                  genero: data.genero,
                  distrito: data.distrito,
                  rolDirectivo: data.rolDirectivo,
                }).then((res) => {
                  dispatch({
                    type: AppAction.WARNING_USUARIO_EXISTE,
                    payload: "",
                  });
                  dispatch({ type: AppAction.LOADER_PAGES, payload: false });
                });
              }
            });
        } catch (error) {
          console.log("error", error);
        }
      } else if (currentUserData.perfil?.rol === 4) {
        console.log("agregando director como admin");
        try {
          axios
            .post(`${URL_API}crear-director`, {
              email: `${data.dni}@competencelab.com`,
              password: `${data.dni}`,
              dni: `${data.dni}`,
              rol: currentUserData.perfil?.rol,
              institucion: `${data.institucion}`,
              modular: `${data.modular}`,
              perfil: data.perfil,
              nombres: `${data.nombres}`,
              apellidos: `${data.apellidos}`,
            })
            .then(async (res) => {
              if (res.data.exists === true) {
                console.log("ya existe el usuario");
                dispatch({
                  type: AppAction.WARNING_USUARIO_EXISTE,
                  payload: `${data.dni} ${res.data.warning}`,
                });
                dispatch({ type: AppAction.LOADER_PAGES, payload: false });
              } else {
                console.log("no existe se creara el usuario");
                await setDoc(doc(db, "usuarios", `${data.dni}`), {
                  dni: `${data.dni}`,
                  institucion: `${data.institucion}`,
                  perfil: data.perfil,
                  rol: data.perfil?.rol,
                  modular: data.modular,
                  nombres: data.nombres,
                  apellidos: data.apellidos,
                  region: Number(data.region),
                }).then((res) => {
                  dispatch({
                    type: AppAction.WARNING_USUARIO_EXISTE,
                    payload: "",
                  });
                  dispatch({ type: AppAction.LOADER_PAGES, payload: false });
                });
              }
            });
        } catch (error) {
          console.log("error", error);
        }
      }
    } catch (error) {
      console.log("error", error);
    }
  };

  const crearNuevoDocente = async (data: User) => {
    dispatch({ type: AppAction.LOADER_PAGES, payload: true });
    console.log("data", data);
    try {
      axios
        .post(`${URL_API}crear-docente`, {
          email: `${data.dni}@competencelab.com`,
          password: `${data.dni}`,
          dni: `${data.dni}`,
          rol: currentUserData.perfil?.rol,
          institucion: `${data.institucion}`,
          modular: `${data.modular}`,
          perfil: data.perfil,
          nombres: `${data.nombres}`,
          apellidos: `${data.apellidos}`,
        })
        .then(async (res) => {
          if (res.data.exists === true) {
            console.log("ya existe el usuario");
            dispatch({
              type: AppAction.WARNING_USUARIO_EXISTE,
              payload: `${data.dni} ${res.data.warning}`,
            });
            dispatch({ type: AppAction.LOADER_PAGES, payload: false });
          } else {
            console.log("no existe se creara el usuario");
            await setDoc(doc(db, "usuarios", `${data.dni}`), {
              dni: `${data.dni}`,
              rol: data.perfil?.rol,
              institucion: currentUserData.institucion,
              dniDirector: currentUserData.dni,
              perfil: data.perfil,
              nombres: `${data.nombres}`,
              apellidos: `${data.apellidos}`,
              region: currentUserData.region,
              grados: data.grados,
              secciones: data.secciones,
              genero: data.genero,
            }).then((res) => {
              dispatch({ type: AppAction.WARNING_USUARIO_EXISTE, payload: "" });
              dispatch({ type: AppAction.LOADER_PAGES, payload: false });
            });
          }
        });
    } catch (error) {
      console.log("error", error);
    }
  };
  const deleteUsuarioById = (idUsuario: string) => {
    console.log("idUsuario", idUsuario)
    const newPromise = new Promise<boolean>((resolve, reject) => {
      try {
        axios
          .post(`${URL_API}borrar-usuario`, { dni: idUsuario }, {
            headers: {
              'Content-Type': 'application/json',
            },
            withCredentials: true, // si usas cookies/sesiones
          })
          .then((res) => {
            console.log("resDelete", res);
            resolve(true);
          });
      } catch (error) {
        console.log("error", error);
        reject(false);
      }
    });
    toast.promise(newPromise, {
      pending: "Eliminando usuario",
      success: "Se ha eliminado usuario con exito 👌",
      error: "Parece que algo fallo, intentalo despues 🤯",
    });
  };

  const deleteEvaluacionEstudiante = async (idEvaluacion: string, idEstudiante: string, monthSelected: number) => {
    console.log("idEvaluacion", idEvaluacion) 
    console.log("idEstudiante", idEstudiante)
    console.log("monthSelected", monthSelected)
    const pathRef = doc(db, `/usuarios/${currentUserData.dni}/${idEvaluacion}/${currentYear}/${monthSelected}`, idEstudiante)
    await deleteDoc(pathRef)
  }
  const deleteEstudianteById = async (
    id: string,
    idExamen: string,
    estudiantes: Estudiante[]
  ) => {
    dispatch({ type: AppAction.LOADER_SALVAR_PREGUNTA, payload: true })
    const rta = estudiantes.find((es) => es.dni === id);
    console.log("primero");
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
          const dataValidate = await getDoc(pathValidateRef)

          if (respuesta.alternativas?.length === 3) {
            respuesta.alternativas?.map(async (al) => {
              if (al.selected === true && al.alternativa === "a") {
                await updateDoc(pathRef, {
                  a: Number(dataValidate.data()?.a) === 0 ? 0 : increment(-1),
                });
              } else if (al.selected === true && al.alternativa === "b") {
                await updateDoc(pathRef, {
                  b: Number(dataValidate.data()?.b) === 0 ? 0 : increment(-1),
                });
              } else if (al.selected === true && al.alternativa === "c") {
                await updateDoc(pathRef, {
                  c: Number(dataValidate.data()?.c) === 0 ? 0 : increment(-1),
                });
              }
            });
          }
          //esto es nuevo para mas alternativas
          if (respuesta.alternativas?.length === 4) {
            respuesta.alternativas?.map(async (al) => {
              if (al.selected === true && al.alternativa === "a") {
                await updateDoc(pathRef, {
                  a: Number(dataValidate.data()?.a) === 0 ? 0 : increment(-1),
                });
              } else if (al.selected === true && al.alternativa === "b") {
                await updateDoc(pathRef, {
                  b: Number(dataValidate.data()?.b) === 0 ? 0 : increment(-1),
                });
              } else if (al.selected === true && al.alternativa === "c") {
                await updateDoc(pathRef, {
                  c: Number(dataValidate.data()?.c) === 0 ? 0 : increment(-1),
                });
              } else if (al.selected === true && al.alternativa === "d") {
                await updateDoc(pathRef, {
                  d: Number(dataValidate.data()?.d) === 0 ? 0 : increment(-1),
                });
              }
            });
          }
        });
        resolve(true);
        console.log("segundo");
      } catch (error) {
        reject(false);
      }
    });
    newPRomise.then((res) => {
      if (res === true) {
        console.log("tercero");
        console.log("rta estudiante", rta);

        setTimeout(async () => {
          const pathRef = doc(db, `/usuarios/${currentUserData.dni}/${idExamen}/`, id)
          await deleteDoc(pathRef);
          dispatch({ type: AppAction.LOADER_SALVAR_PREGUNTA, payload: false })
        }, 5000)
      }
    });
  };

  const getAllEspecialistas = async () => {
    const pathRef = collection(db, "usuarios")
    const q = query(pathRef, where("rol", "==", 1));
    onSnapshot(q, (querySnapshot) => {
      const arrayEspecialistas: User[] = []
      querySnapshot.forEach((doc) => {
        arrayEspecialistas.push(doc.data())
      })
      dispatch({ type: AppAction.ALL_ESPECIALISTAS, payload: arrayEspecialistas })
    });
  }

  const updateEspecialista = async (dniEspecialista: string, data: User) => {
    const pathRef = doc(db, "usuarios", `${dniEspecialista}`);
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
    deleteEstudianteById,
    getAllEspecialistas,
    updateEspecialista,
    deleteEvaluacionEstudiante
  };
};

export default useUsuario;
