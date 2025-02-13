import { doc, getDoc, getFirestore } from "firebase/firestore/lite"
import { app } from "./firebase/firebase.config"
import { getAuth } from "firebase/auth"


const db = getFirestore(app)
const auth = getAuth(app)
export const getUser = async (id: string) => {
  const refUser = doc(db, 'usuarios', `id` as string)
  const user = await getDoc(refUser)

  if (user.exists()) {
    
    console.log('la data', user.data())
    // dispatch({
    //   type: AppAction.CURRENT_USER_DATA, payload: {
    //     nombres: user.data().nombres,
    //     apellidos: user.data().apellidos,
    //     dni: user.data().dni,
    //     institucion: user.data().institucion,
    //     modular: user.data().modular,
    //     perfil: user.data().perfil
    //   }
    // })
  } else {
    console.log('usuario incorrecto o la contraseña no es valida.')
  }
}

