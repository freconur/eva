import React, { useEffect, useState } from 'react'
import { useRouter } from 'next/router'
import useUsuario from '@/features/hooks/useUsuario'
import { getAuth, onAuthStateChanged } from 'firebase/auth'
import { useGlobalContext } from '@/features/context/GlolbalContext'
import { app } from '@/firebase/firebase.config'


const initialValue = { usuario: "", contrasena: "" }
const Login = () => {

  const auth = getAuth(app)
  const router = useRouter()
  const { signIn } = useUsuario()
  const { currentUserData } = useGlobalContext()
  const [loginValues, setLoginValues] = useState(initialValue)

  useEffect(() => {
    onAuthStateChanged(auth, (user) => {
      if (user) {
        if (currentUserData.perfil?.rol === 1) {
          router.push('/mi-cuenta')
        }
        if (currentUserData.perfil?.rol === 2) {
          router.push('/mi-cuenta')
        }
        if (currentUserData.perfil?.rol === 3) {
          router.push('/mi-cuenta')
        }
        if (currentUserData.perfil?.rol === 4) {
          router.push('/mi-cuenta')
        }
      }
    })
  }, [currentUserData.perfil?.rol])

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    signIn(loginValues)
  }
  const handleChangeValuesLogin = (e: React.ChangeEvent<HTMLInputElement>) => {
    setLoginValues({
      ...loginValues,
      [e.target.name]: e.target.value
    })
  }

  // console.log('loginValues', loginValues)
  console.log('currentUserData', currentUserData)
  return (
    <div className='grid h-login w-full p-1 place-content-center'>
      <div className='min-w-[320px] bg-white p-5 shadow-xl'>
        <h1 className='text-colorSegundo text-xl uppercase font-semibold text-center font-comfortaa'>inicio de sesión</h1>
        <form onSubmit={handleSubmit} >
          <div>
            <div className='w-full my-5'>
              <p className='text-slate-500 text-sm uppercase font-comfortaa'>usuario:</p>
              <input
                onChange={handleChangeValuesLogin}
                className='p-3 outline-none rounded-sm shadow-md w-full text-slate-400'
                type="email" placeholder="nombre de usuario"
                name="usuario" />
            </div>
            <div className='w-full my-5'>
              <p className='text-slate-500 text-sm uppercase font-comfortaa'>contraseña:</p>
              <input
                onChange={handleChangeValuesLogin}
                name="contrasena"
                type="password"
                className='p-3 outline-none rounded-sm shadow-md w-full text-slate-400'
                placeholder="contraseña" />
            </div>
          </div>
          <button className='p-3 bg-gradient-to-r to-colorQuinto  from-colorSegundo uppercase font-semibold cursor-pointer rounded-md shadow-md text-white w-full'>ingresar</button>

        </form>
      </div>
      {/* <div className='p-3'>
        <h4 className='capitalize text-center text-blue-500 mb-2'>crear nuevo usuario</h4>
        <button className='capitalize p-3 w-full border-[1px] border-emerald-400 hover:border-emerald-600 text-emerald-400 hover:text-white hover:bg-emerald-600 duration-300'>nuevo usuario</button>
      </div> */}
    </div>
  )
}

export default Login