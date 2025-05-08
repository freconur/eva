import React, { useEffect, useState } from 'react'
import { useRouter } from 'next/router'
import useUsuario from '@/features/hooks/useUsuario'
import { getAuth, onAuthStateChanged } from 'firebase/auth'
import { useGlobalContext } from '@/features/context/GlolbalContext'
import { app } from '@/firebase/firebase.config'
import { RiLoader4Line } from 'react-icons/ri'
import Image from 'next/image'
import logo from '../assets/formativa-logo.png'
import fondoLogin from '../assets/bg-login.png'


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
    <div className='relative grid h-altura-total w-full p-1 place-content-center bg-tableEstandares6'>
      {/* <div className='relative w-full grid justify-center items-center'> */}
        <div className='absolute grid justify-center items-center bg-white w-[150px] h-[150px] left-[10px] top-[10px] rounded-full border-[5px] border-yellow-400 drop-shadow-lg '>
          <Image
            alt="logo formativa"
            src={logo}
            width={130}
            height={130}
          />
        </div>
      {/* </div> */}
      <div className='absolute z-[30] bottom-[0px] right-[0px]'>
        <Image
          alt="logo formativa"
          src={fondoLogin}
          width={500}
          height={500}
        />
      </div>
      <div className='grid gap-1 relative z-[50]'>
        <h1 className='text-center text-4xl uppercase text-white font-semibold font-martianMono [text-shadow:_0_2px_4px_rgba(0,0,0,0.5)] '>Sistema de seguimiento del desarrollo de competencias</h1>
        <h2 className='text-center text-4xl uppercase text-white font-semibold font-martianMono mb-10 [text-shadow:_0_2px_4px_rgba(0,0,0,0.5)] '>Competence-Lab</h2>
      </div>
      <div className='min-w-[350px] bg-white shadow-xl m-auto rounded-md overflow-hidden relative z-[50]'>
        <div className='bg-yellow-400 py-7'>
          <h1 className='text-color-boton text-xl uppercase font-semibold text-center font-montserrat [text-shadow:_0_1px_2px_rgba(0,0,0,0.5)] '>inicio de sesión</h1>
          <p className='text-sm font-montserrat text-color-boton text-center'>Ingresa tus datos</p>
        </div>
        <form onSubmit={handleSubmit} className='p-8 bg-hoverTableSale'>
          <div className=''>
            <div className='w-full my-5'>
              {/* <p className='text-slate-500 text-sm uppercase font-comfortaa'>usuario:</p> */}
              <input
                onChange={handleChangeValuesLogin}
                className='p-3 outline-none rounded-sm shadow-md w-full text-slate-400'
                type="email" placeholder="USUARIO"
                name="usuario" />
            </div>
            <div className='w-full my-5'>
              {/* <p className='text-slate-500 text-sm uppercase font-comfortaa'>contraseña:</p> */}
              <input
                onChange={handleChangeValuesLogin}
                name="contrasena"
                type="password"
                className='p-3 outline-none rounded-sm shadow-md w-full text-slate-400'
                placeholder="CONTRASEÑA" />
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
                <div className=''>
                  <button className='hover:opacity-80 duration-300 p-3 bg-color-boton-login uppercase font-semibold cursor-pointer rounded-md shadow-md text-white w-full'>ingresar</button>
                </div>
              </>

          }

        </form>
      </div>
    </div>
  )
}

export default Login