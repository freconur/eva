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
      <div className='w-[700px] bg-hoverTableSale p-10 shadow-lg'>
        <h1 className='font-semibold text-center text-2xl uppercase text-colorPrincipal font-montserrat' >Registrar Profesor</h1>
        <form onClick={handleAgregarDirector} action="">
          <div className='w-full  my-5'>
            <p className='text-slate-400 text-sm uppercase font-montserrat mb-2'>nombres de docente:</p>
            <input 
            {...register("nombres",
              {
                required: { value: true, message: "institucion es requerido" },
                minLength: { value: 5, message: "nombre debe tener un minimo de 5 caracteres" },
                maxLength: { value: 100, message: "nombre debe tener un maximo de 100 caracteres" },
              }
            )}
            className='p-3 outline-none rounded-md shadow-md w-full text-slate-500' 
            type="text" 
            placeholder="nombre de docente" 
            />
          {errors.nombres && <span className='text-red-400 text-sm'>{errors.nombres.message as string}</span>}
          </div>
          <div className='w-full my-5'>
            <p className='text-slate-400 text-sm uppercase mb-2'>apellidos de docente:</p>
            <input 
            {...register("apellidos",
              {
                required: { value: true, message: "nombre es requerido" },
                minLength: { value: 3, message: "numero modular debe tener un minimo de 3 caracteres" },
                maxLength: { value: 40, message: "numero modular debe tener un maximo de 40 caracteres" },
              }
            )}
            className='p-3 outline-none rounded-md shadow-md w-full text-slate-500' 
            type="text" 
            placeholder="apellidos de docente" />
          {errors.apellidos && <span className='text-red-400 text-sm'>{errors.apellidos.message as string}</span>}
          </div>
          <div className='w-full my-5 '>
            <p className='text-slate-400 text-sm uppercase mb-2'>dni:</p>
            <input 
            {...register("dni",
              {
                required: { value: true, message: "dni es requerido" },
                minLength: { value: 8, message: "dni debe tener un minimo de 8 caracteres" },
                maxLength: { value: 8, message: "dni debe tener un maximo de 8 caracteres" },
              }
            )}
            className='p-3 outline-none rounded-md shadow-md w-full text-slate-500' 
            type="number"
            placeholder="dni de docente" />
          {errors.dni && <span className='text-red-400 text-sm'>{errors.dni.message as string}</span>}
          </div>
          
          <button className='flex justify-center items-center bg-colorSegundo hover:opacity-80 duration-300 p-3 rounded-md w-full text-white hover:text-white uppercase font-semibold font-comfortaa'>registrar</button>
        </form>
      </div>
    </div>
  )
}


export default AgregarDirectores
AgregarDirectores.Auth = PrivateRouteDirectores