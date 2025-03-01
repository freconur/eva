import PrivateRouteAdmin from '@/components/layouts/PrivateRoutesAdmin'
import { useGlobalContext } from '@/features/context/GlolbalContext'
import useUsuario from '@/features/hooks/useUsuario'
import React, { useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { RiLoader4Line } from 'react-icons/ri'

const AgregareEspecialista = () => {

  const { register, handleSubmit, watch, reset, formState: { errors } } = useForm()
  const { getUserData, createNewEspecialista, getRegiones } = useUsuario()
  const { currentUserData, regiones, loaderPages } = useGlobalContext()

  useEffect(() => {
    getUserData()
    getRegiones()
  }, [currentUserData.dni])
  const handleAgregarDirector = handleSubmit(data => {
    console.log("data", data)
    createNewEspecialista({ ...data, perfil: { rol: 1, nombre: "especialista" } })
    reset()
  })

  return (
    <div className='grid w-full p-1 place-content-center mt-5'>

      <div className='w-[700px] bg-white p-10 rounded-sm shadow-md '>
        {
          loaderPages ?
            <div className='grid w-[600px] h-[600px] '>
              <div className='flex justify-center items-center'>
                <RiLoader4Line className="animate-spin text-3xl text-colorTercero " />
                <span className='text-colorTercero animate-pulse'>...creado usuario especialista</span>
              </div>
            </div>
            :
            <>
              <h1 className='font-semibold text-center text-2xl uppercase text-slate-600'>Registrar Especialista</h1>
              <form onClick={handleAgregarDirector} action="">
                {/* <div className='w-full my-2'>
                  <p className='text-slate-400 text-sm uppercase'>nombre de la i.e.:</p>
                  <input
                    {...register("institucion",
                      {
                        required: { value: true, message: "institucion es requerido" },
                        minLength: { value: 5, message: "nombre debe tener un minimo de 5 caracteres" },
                        maxLength: { value: 100, message: "nombre debe tener un maximo de 100 caracteres" },
                      }
                    )}
                    className='p-3 outline-none rounded-md shadow-md w-full uppercase text-slate-400'
                    type="text"
                    placeholder="nombre de la institucion"
                  />
                </div>
                {errors.institucion && <span className='text-red-400 text-sm'>{errors.institucion.message as string}</span>} */}
                <div className='w-full my-2'>
                  <p className='text-slate-400 text-sm uppercase'>codigo modular:</p>
                  <input
                    {...register("modular",
                      {
                        required: { value: true, message: "nombre es requerido" },
                        minLength: { value: 8, message: "numero modular debe tener un minimo de 8 caracteres" },
                        maxLength: { value: 8, message: "numero modular debe tener un maximo de 8 caracteres" },
                      }
                    )}
                    className='p-3 outline-none rounded-md shadow-md w-full uppercase text-slate-400'
                    type="number"
                    placeholder="numero modular" />
                </div>
                {errors.modular && <span className='text-red-400 text-sm'>{errors.modular.message as string}</span>}
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
                    className='p-3 outline-none rounded-md shadow-md w-full uppercase text-slate-400'
                    type="number"
                    placeholder="dni de usuario" />
                </div>
                {errors.dni && <span className='text-red-400 text-sm'>{errors.dni.message as string}</span>}
                <div className='w-full my-2'>
                  <p className='text-slate-400 text-sm uppercase'>region:</p>
                  <select
                    {...register("region",
                      {
                        required: { value: true, message: "region es requerido" },
                      }
                    )}
                    className='w-full p-3 rounded-md bg-white text-slate-400 shadow-md'>
                    <option>--REGIONES--</option>

                    {regiones?.map((region, index) => {
                      return (
                        <option key={index} value={Number(region.codigo)}>{region.region?.toUpperCase()}</option>
                      )
                    })}
                  </select>
                </div>

                {errors.region && <span className='text-red-400 text-sm'>{errors.region.message as string}</span>}
                <div className='w-full my-2'>
                  <p className='text-slate-400 text-sm uppercase'>nombres:</p>
                  <input
                    {...register("nombres",
                      {
                        required: { value: true, message: "nombres es requerido" },
                        minLength: { value: 2, message: "nombres debe tener un minimo de 2 caracteres" },
                        maxLength: { value: 40, message: "nombres debe tener un maximo de 40 caracteres" },
                      }
                    )}
                    className='p-3 outline-none rounded-md shadow-md w-full uppercase text-slate-400'
                    type="text"
                    placeholder="nombre de usuario" />
                </div>
                {errors.nombres && <span className='text-red-400 text-sm'>{errors.nombres.message as string}</span>}
                <div className='w-full my-2'>
                  <p className='text-slate-400 text-sm uppercase'>apellidos:</p>
                  <input
                    {...register("apellidos",
                      {
                        required: { value: true, message: "apellidos es requerido" },
                        minLength: { value: 8, message: "apellidos debe tener un minimo de 2 caracteres" },
                        maxLength: { value: 40, message: "apellidos debe tener un maximo de 40 caracteres" },
                      }
                    )}
                    className='p-3 outline-none rounded-md shadow-md w-full uppercase text-slate-400'
                    type="text"
                    placeholder="apellido de usuario" />
                </div>
                {errors.apellidos && <span className='text-red-400 text-sm'>{errors.apellidos.message as string}</span>}
                <button className='flex justify-center items-center bg-blue-500 hover:bg-blue-300 duration-300 p-3 rounded-md w-full text-white hover:text-slate-600 uppercase'>registrar</button>
              </form>
            </>

        }
      </div>
    </div>
  )
}


export default AgregareEspecialista
AgregareEspecialista.Auth = PrivateRouteAdmin