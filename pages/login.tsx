import React, { useEffect, useState } from 'react'
import { useRouter } from 'next/router'
import useUsuario from '@/features/hooks/useUsuario'
import { getAuth, onAuthStateChanged } from 'firebase/auth'
import { useGlobalContext } from '@/features/context/GlolbalContext'
import { app } from '@/firebase/firebase.config'
import { RiLoader4Line } from 'react-icons/ri'


const initialValue = { usuario: "", contrasena: "" }
const Login = () => {

  const auth = getAuth(app)
  const router = useRouter()
  const { signIn } = useUsuario()
  const { currentUserData, loaderLogin, warningLogin } = useGlobalContext()
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
  }, [currentUserData.perfil?.rol, loaderLogin, warningLogin])

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
  return (
    <div className='grid h-login w-full p-1 place-content-center'>
      <h1 className='text-center text-3xl uppercase text-colorSecundario font-semibold font-montserrat mb-10 [text-shadow:_0_2px_4px_rgba(0,0,0,0.5)] '>sistema de evaluación <br />
        regional de puno</h1>
      <div className='min-w-[320px] bg-white p-5 shadow-xl m-auto'>
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

          {
            loaderLogin ?
              <div className='flex  justify-center items-center'>
                <RiLoader4Line className="animate-spin text-3xl text-slate-500 " />
                <span className='text-slate-500'>...validando datos </span>
              </div>

              :
              <>
                {
                  warningLogin?.length > 0 &&
                  <span className='text-red-400 text-sm mb-3'>
                    * {warningLogin}
                  </span>
                }
                <button className='p-3 bg-gradient-to-r to-colorQuinto  from-colorSegundo uppercase font-semibold cursor-pointer rounded-md shadow-md text-white w-full'>ingresar</button>
              </>

          }

        </form>
      </div>
    </div>
  )
}

export default Login