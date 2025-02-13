import PrivateRouteDirectores from '@/components/layouts/PrivateRoutesDirectores'
import { useGlobalContext } from '@/features/context/GlolbalContext'
import useUsuario from '@/features/hooks/useUsuario'
import React, { useEffect } from 'react'
import { useForm } from 'react-hook-form'

const AgregarDirectores = () => {

  const { register, handleSubmit, watch, reset, formState: { errors } } = useForm()
  const {  getUserData, createNewDirector, crearNuevoDocente} = useUsuario()
  const { currentUserData } = useGlobalContext()

  useEffect(() => {
    getUserData()
  }, [currentUserData.dni])
  const handleAgregarDirector = handleSubmit(data => {

    crearNuevoDocente({...data, perfil:{rol:3, nombre:"docente"}})
    reset()
  })

  return (
    <div className='grid h-login w-full p-1 place-content-center'>
      <div className='w-[700px]'>
        <h1 className='font-semibold text-center text-2xl uppercase text-slate-600' >Registrar Profesor</h1>
        <form onClick={handleAgregarDirector} action="">
          <div className='w-full my-2'>
            <p className='text-slate-400 text-sm uppercase'>nombres de docente:</p>
            <input 
            {...register("nombres",
              {
                required: { value: true, message: "institucion es requerido" },
                minLength: { value: 5, message: "nombre debe tener un minimo de 5 caracteres" },
                maxLength: { value: 100, message: "nombre debe tener un maximo de 100 caracteres" },
              }
            )}
            className='p-3 outline-none rounded-md shadow-md w-full' 
            type="text" 
            placeholder="nombre de docente" 
            />
          </div>
          {errors.nombres && <span className='text-red-400 text-sm'>{errors.nombres.message as string}</span>}
          <div className='w-full my-2'>
            <p className='text-slate-400 text-sm uppercase'>apellidos de docente:</p>
            <input 
            {...register("apellidos",
              {
                required: { value: true, message: "nombre es requerido" },
                minLength: { value: 3, message: "numero modular debe tener un minimo de 3 caracteres" },
                maxLength: { value: 40, message: "numero modular debe tener un maximo de 40 caracteres" },
              }
            )}
            className='p-3 outline-none rounded-md shadow-md w-full' 
            type="text" 
            placeholder="apellidos de docente" />
          </div>
          {errors.apellidos && <span className='text-red-400 text-sm'>{errors.apellidos.message as string}</span>}
          <div className='w-full my-2'>
            <p className='text-slate-400 text-sm uppercase'>dni:</p>
            <input 
            {...register("dni",
              {
                required: { value: true, message: "dni es requerido" },
                minLength: { value: 8, message: "dni debe tener un minimo de 8 caracteres" },
                maxLength: { value: 8, message: "dni debe tener un maximo de 8 caracteres" },
              }
            )}
            className='p-3 outline-none rounded-md shadow-md w-full' 
            type="number"
            placeholder="dni de docente" />
          </div>
          {errors.dni && <span className='text-red-400 text-sm'>{errors.dni.message as string}</span>}
          
          <button className='flex justify-center items-center bg-blue-500 hover:bg-blue-300 duration-300 p-3 rounded-md w-full text-white hover:text-slate-600 uppercase'>registrar</button>
        </form>
      </div>
    </div>
  )
}


export default AgregarDirectores
AgregarDirectores.Auth = PrivateRouteDirectores