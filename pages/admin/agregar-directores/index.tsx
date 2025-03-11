import PrivateRouteAdmins from '@/components/layouts/PrivateRoutes'
import PrivateRouteAdmin from '@/components/layouts/PrivateRoutesAdmin'
import { useGlobalContext } from '@/features/context/GlolbalContext'
import useUsuario from '@/features/hooks/useUsuario'
import React, { useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { RiLoader4Line } from 'react-icons/ri'

const AgregarDirectores = () => {

  const { register, handleSubmit, watch, reset, formState: { errors } } = useForm()
  const { getUserData, createNewDirector, getRegiones, getUsersDirectores } = useUsuario()
  const { currentUserData, regiones, loaderPages, usuariosDirectores } = useGlobalContext()

  useEffect(() => {
    getUserData()
    getRegiones()
    getUsersDirectores()
  }, [currentUserData.dni])
  const handleAgregarDirector = handleSubmit(data => {
    console.log("data", data)
    createNewDirector({ ...data, perfil: { rol: 2, nombre: "director" } })
    reset()
  })

  return (
    <div className='grid grid-cols-2 w-[1100px] p-1 place-content-center mt-5 m-auto'>
      <div className='p-5'>
        <div className='w-ful w-[500px] '>
          <h1 className='text-colorTercero font-semibold text-3xl font-mono mb-10 capitalize'>Usuarios de directores</h1>
          <table className='w-full  bg-white  rounded-md shadow-md'>
            <thead className='bg-azul-claro4 border-b-2 border-blue-300 '>
              <tr className='text-white capitalize font-nunito '>
                <th className="uppercase  pl-1 md:pl-2 px-1 text-center">#</th>
                <th className="py-3 md:p-2  text-left">dni</th>
                <th className="py-3 md:p-2  text-left">nombre de evaluación</th>
                {/* <th className="py-3 md:p-2  text-left"></th> */}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {
                usuariosDirectores.length > 0 ?
                  usuariosDirectores?.map((director, index) => {
                    return (
                      <tr key={index} className='h-[60px] hover:bg-blue-100 duration-300 cursor-pointer'>
                        <td className='uppercase text-slate-500 pl-1 md:pl-2 px-1 text-center'>
                          <div>
                            {index + 1}
                          </div>
                        </td>
                        <td className='uppercase text-slate-500 pl-1 md:pl-2 px-1 text-left'>
                          <div>
                            {director.dni}
                          </div>
                        </td>
                        <td className='uppercase text-slate-500 pl-1 md:pl-2 px-1 text-left'>
                          <div>
                            {director.nombres} {director.apellidos}
                          </div>
                        </td>
                        {/* <td>
                              <MdEditSquare onClick={() => { setNameEva(`${eva.nombre}`); handleShowInputUpdate(); setIdEva(`${eva.id}`) }} className='text-xl text-yellow-500 cursor-pointer' />
                            </td>
                            <td>
                              <MdDeleteForever onClick={() => { handleShowModalDelete(); setIdEva(`${eva.id}`) }} className='text-xl text-red-500 cursor-pointer' />
                            </td> */}
                      </tr>
                    )
                  })
                  :
                  null
              }
            </tbody>
          </table>
        </div>
      </div>
      <div className='w-[700px] p-5 rounded-sm shadow-md '>
        {
          loaderPages ?
            <div className='grid w-[600px] h-[600px] '>
              <div className='flex justify-center items-center'>
                <RiLoader4Line className="animate-spin text-3xl text-colorTercero " />
                <span className='text-colorTercero animate-pulse'>...creando usuario director</span>
              </div>
            </div>
            :
            <div>

              <h1 className='text-colorTercero font-semibold text-3xl font-mono mb-10 capitalize'>Registrar Director</h1>
              <div className='bg-white p-5 w-[400px]'>
                <form onClick={handleAgregarDirector} action="">
                  <div className='w-full my-2'>
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
                  {errors.institucion && <span className='text-red-400 text-sm'>{errors.institucion.message as string}</span>}
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
                      placeholder="nombre de usuario" />
                  </div>
                  {errors.dni && <span className='text-red-400 text-sm'>{errors.dni.message as string}</span>}
                  <div className='w-full my-2'>
                    <p className='text-slate-400 text-sm uppercase'>ugel:</p>
                    <select
                      {...register("region",
                        {
                          required: { value: true, message: "region es requerido" },
                        }
                      )}
                      className='w-full p-3 rounded-md bg-white text-slate-400 shadow-md'>
                      <option>--UGEL--</option>

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
                      placeholder="nombre de usuario" />
                  </div>
                  {errors.apellidos && <span className='text-red-400 text-sm'>{errors.apellidos.message as string}</span>}
                  <button className='flex justify-center items-center bg-blue-500 hover:bg-blue-300 duration-300 p-3 rounded-md w-full text-white hover:text-slate-600 uppercase'>registrar</button>
                </form>
              </div>
            </div>

        }
      </div>

    </div>
  )
}


export default AgregarDirectores
AgregarDirectores.Auth = PrivateRouteAdmins