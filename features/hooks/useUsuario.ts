import { LoginData, Region, User } from "../types/types"
import { browserSessionPersistence, getAuth, onAuthStateChanged, setPersistence, signInWithEmailAndPassword, signOut, } from "firebase/auth"
import { useGlobalContext, useGlobalContextDispatch } from "../context/GlolbalContext"
// import { getFirestore, doc, getDoc } from "firebase/firestore/lite"
import { AppAction } from "../actions/appAction"
import { getFirestore, doc, getDoc, setDoc, collection, getDocs, where, query, orderBy, } from "firebase/firestore/lite"
import { app } from "@/firebase/firebase.config"
import axios from "axios"

const useUsuario = () => {
  const URL_API = "https://api-ugel-production.up.railway.app/"
  const auth = getAuth(app)
  const db = getFirestore(app)
  const { currentUserData } = useGlobalContext()
  const dispatch = useGlobalContextDispatch()


  const getUsersDirectores = async () => {
    const pathRef = query(collection(db, "usuarios"), where("rol", "==", 2), orderBy("rol", "asc"))
    await getDocs(pathRef)
      .then(res => {
        const arryaDirectores: User[] = []
        res.forEach((doc) => {
          arryaDirectores.push(doc.data())
        });
        dispatch({ type: AppAction.USUARIOS_DIRECTORES, payload: arryaDirectores })
      })
    // const q = query(collection(db, "cities"), where("capital", "==", true));
    // const querySnapshot = await getDocs(collection(db, "cities"));

  }
  const getUser = async (id: string) => {
    const refUser = doc(db, 'usuarios', id as string)
    const user = await getDoc(refUser)

    if (user.exists()) {
      dispatch({ type: AppAction.LOADER_LOGIN, payload: false })
      dispatch({
        type: AppAction.CURRENT_USER_DATA, payload: {
          nombres: user.data().nombres,
          apellidos: user.data().apellidos,
          dni: user.data().dni,
          institucion: user.data().institucion,
          dniDirector: user.data().dniDirector,
          modular: user.data().modular,
          perfil: user.data().perfil,
          region: user.data().region,
          rol: user.data().rol
        }
      })
    } else {
      console.log('usuario incorrecto o la contraseña no es valida.')
      dispatch({ type: AppAction.LOADER_LOGIN, payload: false })
    }
  }

  const getRegiones = async () => {
    const regionRef = collection(db, 'region')
    const queryRegiones = await getDocs(regionRef)
    const arrayRegiones: Region[] = []
    queryRegiones.forEach((doc) => {
      arrayRegiones.push(doc.data())
    })

    dispatch({ type: AppAction.REGIONES, payload: arrayRegiones })
  }
  const signIn = async (loginData: LoginData) => {
    dispatch({ type: AppAction.LOADER_LOGIN, payload: true })
    dispatch({ type: AppAction.WARNING_LOGIN, payload: '' })
    console.log('loginDatad', loginData)
    try {
      // return await signInWithEmailAndPassword(auth, loginData.usuario, loginData.contrasena)
      await setPersistence(auth, browserSessionPersistence)
        .then(async () => {
          return await signInWithEmailAndPassword(auth, loginData.usuario, loginData.contrasena)
        }).then(response => {
          console.log('response', response)
          // debugger
          getUser(response.user.uid)
        })
      // .catch(Error) {
      //   console.log('error', Error)
      // }
    } catch (error) {
      dispatch({ type: AppAction.LOADER_LOGIN, payload: false })
      if (error) {
        console.log('error')
        dispatch({ type: AppAction.WARNING_LOGIN, payload: 'el usuario o contraseña son invalidos' })

      }
    }
  }
  const logout = () => {
    signOut(auth)
    // AsyncStorage.setItem(TOKEN_KEY, JSON.stringify({}))
    // dispatch({ type: AttendanceRegister.USER_TOKEN, payload: { token: "", isAuthenticated: false } })
    dispatch({
      type: AppAction.CURRENT_USER_DATA, payload: {}
    })
  }


  const getUserData = () => {
    onAuthStateChanged(auth, currentUser => {
      if (currentUser) {
        getUser(currentUser.uid)
      }
    })
  }
  const createNewEspecialista = (data: User) => {
    dispatch({ type: AppAction.LOADER_PAGES, payload: true })
    console.log('currentUserData.rol', currentUserData.rol)
    try {
      if (currentUserData.rol === 4) {
        axios
          .post(`${URL_API}crear-director`,
            {
              email: `${data.dni}@formativa.com`,
              password: `${data.dni}`,
              dni: `${data.dni}`,
            }
          )
          .then(async res => {
            console.log('res', res)
            await setDoc(doc(db, "usuarios", `${data.dni}`), {
              dni: `${data.dni}`,
              // institucion: `${data.institucion}`,
              perfil: data.perfil,
              rol: data.perfil?.rol,
              modular: data.modular,
              nombres: data.nombres,
              apellidos: data.apellidos,
              region: Number(data.region)
            })
          })
          .then(res => {
            dispatch({ type: AppAction.LOADER_PAGES, payload: false })
          })
      }
    } catch (error) {
      console.log('error', error)
    }
  }
  const createNewDirector = (data: User) => {
    dispatch({ type: AppAction.LOADER_PAGES, payload: true })
    try {
      if (currentUserData.perfil?.rol === 1) {
        console.log('agregando director')
        axios
          .post(`${URL_API}crear-director`,
            {
              email: `${data.dni}@formativa.com`,
              password: `${data.dni}`,
              dni: `${data.dni}`,
              rol: currentUserData.perfil?.rol,
              institucion: `${data.institucion}`,
              modular: `${data.modular}`,
              perfil: data.perfil,
              nombres: `${data.nombres}`,
              apellidos: `${data.apellidos}`,
            })
          .then(async response => {
            console.log('response.status', response)
            await setDoc(doc(db, "usuarios", `${data.dni}`), {
              dni: `${data.dni}`,
              institucion: `${data.institucion}`,
              perfil: data.perfil,
              rol: data.perfil?.rol,
              modular: data.modular,
              nombres: data.nombres,
              apellidos: data.apellidos,
              region: Number(data.region)
            })
              .then(res => {
                dispatch({ type: AppAction.LOADER_PAGES, payload: false })
              })
          })
      } else if (currentUserData.perfil?.rol === 4) {
        console.log('agregando director como admin')
        try {
          axios
            .post(`${URL_API}crear-director`,
              {
                email: `${data.dni}@formativa.com`,
                password: `${data.dni}`,
                dni: `${data.dni}`,
                rol: currentUserData.perfil?.rol,
                institucion: `${data.institucion}`,
                modular: `${data.modular}`,
                perfil: data.perfil,
                nombres: `${data.nombres}`,
                apellidos: `${data.apellidos}`,
              })
            .then(async response => {
              await setDoc(doc(db, "usuarios", `${data.dni}`), {
                dni: `${data.dni}`,
                institucion: `${data.institucion}`,
                perfil: data.perfil,
                rol: data.perfil?.rol,
                modular: data.modular,
                nombres: data.nombres,
                apellidos: data.apellidos,
                region: Number(data.region)
              })
                .then((res) => {
                  dispatch({ type: AppAction.LOADER_PAGES, payload: false })
                })
            })
        } catch (error) {
          console.log('error', error)
        }
      }
    } catch (error) {
      console.log('error', error)
    }
  }

  const crearNuevoDocente = async (data: User) => {
    dispatch({ type: AppAction.LOADER_PAGES, payload: true })
    try {
      axios
        .post(`${URL_API}crear-docente`,
          {
            email: `${data.dni}@formativa.com`,
            password: `${data.dni}`,
            dni: `${data.dni}`,
          })
        .then(async response => {
          await setDoc(doc(db, "usuarios", `${data.dni}`), {
            dni: `${data.dni}`,
            rol: data.perfil?.rol,
            institucion: currentUserData.institucion,
            dniDirector: currentUserData.dni,
            perfil: data.perfil,
            nombres: `${data.nombres}`,
            apellidos: `${data.apellidos}`,
            region: currentUserData.region
          });
        })
        .then(res => dispatch({ type: AppAction.LOADER_PAGES, payload: false }))
    } catch (error) {
      console.log('error', error)
    }
  }

  return {
    signIn,
    getUserData,
    logout,
    createNewDirector,
    crearNuevoDocente,
    getRegiones,
    createNewEspecialista,
    getUsersDirectores
  }

}

export default useUsuario