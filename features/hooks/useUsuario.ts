import { LoginData, User } from "../types/types"
import { browserSessionPersistence, getAuth, onAuthStateChanged, setPersistence, signInWithEmailAndPassword, signOut, } from "firebase/auth"
import { useGlobalContext, useGlobalContextDispatch } from "../context/GlolbalContext"
// import { getFirestore, doc, getDoc } from "firebase/firestore/lite"
import { AppAction } from "../actions/appAction"
import { getFirestore, doc, getDoc, setDoc, } from "firebase/firestore/lite"
import { app } from "@/firebase/firebase.config"
import axios from "axios"

const useUsuario = () => {
  const URL_API = "https://api-ugel-production.up.railway.app/"
  const auth = getAuth(app)
  const db = getFirestore(app)
  const { currentUserData } = useGlobalContext()
  const dispatch = useGlobalContextDispatch()

  const getUser = async (id: string) => {
    const refUser = doc(db, 'usuarios', id as string)
    const user = await getDoc(refUser)

    if (user.exists()) {
      dispatch({
        type: AppAction.CURRENT_USER_DATA, payload: {
          nombres: user.data().nombres,
          apellidos: user.data().apellidos,
          dni: user.data().dni,
          institucion: user.data().institucion,
          modular: user.data().modular,
          perfil: user.data().perfil,
        }
      })
    } else {
      console.log('usuario incorrecto o la contraseña no es valida.')
    }
  }
  const signIn = async (loginData: LoginData) => {
    console.log('loginDatad', loginData)
    try {
      // return await signInWithEmailAndPassword(auth, loginData.usuario, loginData.contrasena)
      await setPersistence(auth, browserSessionPersistence)
        .then(async () => {
          return await signInWithEmailAndPassword(auth, loginData.usuario, loginData.contrasena)
        }).then(response => getUser(response.user.uid))
      // .catch(Error) {
      //   console.log('error', Error)
      // }
    } catch (error) {
      console.log('error', error)
    }
  }
  const logout = () => {
    signOut(auth)
    // AsyncStorage.setItem(TOKEN_KEY, JSON.stringify({}))
    // dispatch({ type: AttendanceRegister.USER_TOKEN, payload: { token: "", isAuthenticated: false } })
  }


  const getUserData = () => {
    onAuthStateChanged(auth, currentUser => {
      if (currentUser) {
        getUser(currentUser.uid)
      }
    })
  }

  const createNewDirector = (data: User) => {
    try {
      if (currentUserData.perfil?.rol === 1) {
        console.log('agregando director')
        axios
          .post(`${URL_API}crear-director`,
            {
              email: `${data.dni}@evaluaciones.com`,
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
            });
          })
      } else if (currentUserData.perfil?.rol === 4) {
        console.log('agregando director como admin')
        try {
          axios
            .post(`${URL_API}crear-director`,
              {
                email: `${data.dni}@evaluaciones.com`,
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
              });
            })
        } catch (error) {
          console.log('error', error)
        }
      }
    } catch (error) {
      console.log('error', error)
    }
  }

  const crearNuevoDocente = (data: User) => {
    try {
      axios
        .post(`${URL_API}crear-docente`,
          {
            email: `${data.dni}@eva.com`,
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
          });
        })
    } catch (error) {
      console.log('error', error)
    }
  }

  return {
    signIn,
    getUserData,
    logout,
    createNewDirector,
    crearNuevoDocente
  }

}

export default useUsuario